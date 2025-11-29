/**
 * Question Extraction Backfill Service
 *
 * Strategy:
 * 1. Run enhanced regex on all RELEVANT posts without questions
 * 2. Use LLM fallback for posts with 0 regex matches
 * 3. Re-extract posts with only low-quality questions (confidence < 0.90)
 *
 * Only processes relevant posts (successful interviews, ~705 posts)
 */

const { extractInterviewQuestions } = require('./questionExtractionService');
const { analyzeText } = require('./aiService');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Backfill questions for all relevant posts without existing questions
 * Uses regex first (free), then LLM fallback (minimal cost)
 */
async function backfillQuestions(options = {}) {
  const { useRegexOnly = false, batchSize = 30, rateLimit = 5000 } = options;

  logger.info('[QuestionBackfill] Starting question extraction backfill');
  logger.info('[QuestionBackfill] Options:', { useRegexOnly, batchSize, rateLimit });

  const stats = {
    totalPosts: 0,
    regexSuccesses: 0,
    llmSuccesses: 0,
    errors: 0,
    questionsExtracted: 0
  };

  try {
    // 1. Get all RELEVANT posts without questions
    // RELEVANT = positive outcome posts (~704 posts)
    const result = await pool.query(`
      SELECT sp.post_id, sp.title, sp.body_text,
             sp.metadata->>'company' as company,
             sp.interview_date,
             sp.potential_outcome
      FROM scraped_posts sp
      LEFT JOIN (
        SELECT DISTINCT post_id FROM interview_questions
      ) iq ON sp.post_id = iq.post_id
      WHERE iq.post_id IS NULL
        AND sp.potential_outcome = 'positive'
      ORDER BY sp.created_at DESC
    `);

    const postsWithoutQuestions = result.rows;
    stats.totalPosts = postsWithoutQuestions.length;

    logger.info(`[QuestionBackfill] Found ${stats.totalPosts} relevant posts without questions`);

    if (stats.totalPosts === 0) {
      logger.info('[QuestionBackfill] No posts need processing');
      return stats;
    }

    // 2. Try regex extraction first (FREE!)
    logger.info('[QuestionBackfill] Phase 1: Regex extraction');

    const postsNeedingLLM = [];

    for (const post of postsWithoutQuestions) {
      try {
        const text = `${post.title}\n\n${post.body_text}`;
        const questions = extractInterviewQuestions(text, { minConfidence: 0.70 });

        if (questions.length > 0) {
          // Regex success! Save to database
          await saveQuestions(post, questions, 'regex');
          stats.regexSuccesses++;
          stats.questionsExtracted += questions.length;

          if (stats.regexSuccesses % 50 === 0) {
            logger.info(`[QuestionBackfill] Regex: ${stats.regexSuccesses} posts processed`);
          }
        } else {
          // Need LLM fallback
          postsNeedingLLM.push(post);
        }
      } catch (error) {
        logger.error(`[QuestionBackfill] Regex error for ${post.post_id}:`, error.message);
        stats.errors++;
      }
    }

    logger.info(`[QuestionBackfill] Regex phase complete:`);
    logger.info(`  - Posts covered: ${stats.regexSuccesses}`);
    logger.info(`  - Questions extracted: ${stats.questionsExtracted}`);
    logger.info(`  - Posts needing LLM: ${postsNeedingLLM.length}`);

    // 3. LLM fallback for remaining posts
    if (!useRegexOnly && postsNeedingLLM.length > 0) {
      logger.info('[QuestionBackfill] Phase 2: LLM fallback');
      logger.info(`[QuestionBackfill] Processing ${postsNeedingLLM.length} posts with LLM`);

      for (let i = 0; i < postsNeedingLLM.length; i += batchSize) {
        const batch = postsNeedingLLM.slice(i, i + batchSize);
        logger.info(`[QuestionBackfill] LLM batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(postsNeedingLLM.length / batchSize)}`);

        for (const post of batch) {
          try {
            const text = `${post.title}\n\n${post.body_text}`;

            // Use LLM to extract BOTH topics and detailed questions
            const extracted = await analyzeText(text);

            const questions = [];

            // Extract detailed interview_questions (primary)
            if (extracted.interview_questions && extracted.interview_questions.length > 0) {
              extracted.interview_questions.forEach(question => {
                questions.push({
                  text: question,
                  confidence: 0.90,  // Higher confidence for explicit questions
                  pattern: 'llm_question_extraction',
                  type: classifyQuestionType(question)
                });
              });
            }

            // Also extract interview_topics (as fallback or additional data)
            if (extracted.interview_topics && extracted.interview_topics.length > 0) {
              extracted.interview_topics.forEach(topic => {
                questions.push({
                  text: topic,
                  confidence: 0.75,  // Lower confidence for topics
                  pattern: 'llm_topic_extraction',
                  type: classifyQuestionType(topic)
                });
              });
            }

            if (questions.length > 0) {
              await saveQuestions(post, questions, 'llm');
              stats.llmSuccesses++;
              stats.questionsExtracted += questions.length;
            }
          } catch (error) {
            logger.error(`[QuestionBackfill] LLM error for ${post.post_id}:`, error.message);
            stats.errors++;
          }
        }

        // Rate limiting between batches
        if (i + batchSize < postsNeedingLLM.length) {
          logger.info(`[QuestionBackfill] Rate limiting: waiting ${rateLimit}ms`);
          await sleep(rateLimit);
        }
      }

      logger.info(`[QuestionBackfill] LLM phase complete:`);
      logger.info(`  - Posts covered: ${stats.llmSuccesses}`);
      logger.info(`  - Total questions: ${stats.questionsExtracted}`);
    }

    // 4. Final stats
    const totalCovered = stats.regexSuccesses + stats.llmSuccesses;
    const coverage = ((totalCovered / stats.totalPosts) * 100).toFixed(1);

    logger.info('[QuestionBackfill] Backfill complete:');
    logger.info(`  - Total relevant posts: ${stats.totalPosts}`);
    logger.info(`  - Posts covered: ${totalCovered} (${coverage}%)`);
    logger.info(`  - Regex successes: ${stats.regexSuccesses}`);
    logger.info(`  - LLM successes: ${stats.llmSuccesses}`);
    logger.info(`  - Questions extracted: ${stats.questionsExtracted}`);
    logger.info(`  - Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    logger.error('[QuestionBackfill] Fatal error:', error);
    throw error;
  }
}

/**
 * Save extracted questions to database
 */
async function saveQuestions(post, questions, extractionMethod) {
  for (const question of questions) {
    try {
      await pool.query(`
        INSERT INTO interview_questions (
          post_id, question_text, question_type,
          extraction_confidence, extracted_from, company
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        post.post_id,
        question.text,
        question.type || 'unknown',
        question.confidence || 0.75,
        extractionMethod,
        post.company
      ]);
    } catch (error) {
      logger.error(`[QuestionBackfill] Error saving question for ${post.post_id}:`, error.message);
      logger.error(`[QuestionBackfill] Error details:`, error);
      throw error; // Re-throw to see actual error
    }
  }
}

/**
 * Classify question type based on content
 */
function classifyQuestionType(questionText) {
  const text = questionText.toLowerCase();

  // Coding patterns
  if (text.match(/implement|code|write|algorithm|data structure|array|tree|graph|sort|search|lru|cache/)) {
    return 'coding';
  }

  // System design patterns
  if (text.match(/design|system|scale|architecture|distributed|microservice|twitter|uber|url shortener|rate limiter/)) {
    return 'system_design';
  }

  // Behavioral patterns
  if (text.match(/tell me about|describe a time|how do you|why|conflict|challenge|leadership|team|experience/)) {
    return 'behavioral';
  }

  // Technical discussion
  if (text.match(/explain|difference|compare|what is|how does|rest|graphql|database|sql|api/)) {
    return 'technical';
  }

  return 'unknown';
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Re-extract questions for posts with only low-quality questions
 * Deletes existing low-quality questions and re-runs LLM extraction
 *
 * Target: 432 posts with questions but confidence < 0.90
 * Expected: ~400-500 detailed questions + topics
 * Cost: ~$0.22 (432 × $0.0005)
 */
async function reExtractLowQualityQuestions(options = {}) {
  const { batchSize = 30, rateLimit = 5000 } = options;

  logger.info('[QuestionReExtract] Starting re-extraction of low-quality questions');
  logger.info('[QuestionReExtract] Options:', { batchSize, rateLimit });

  const stats = {
    totalPosts: 0,
    postsProcessed: 0,
    questionsDeleted: 0,
    detailedQuestionsExtracted: 0,
    topicsExtracted: 0,
    errors: 0
  };

  try {
    // 1. Get posts with only low-quality questions (confidence < 0.90)
    const result = await pool.query(`
      SELECT sp.post_id, sp.title, sp.body_text,
             sp.metadata->>'company' as company,
             sp.interview_date,
             sp.potential_outcome,
             sp.created_at
      FROM scraped_posts sp
      JOIN interview_questions iq ON sp.post_id = iq.post_id
      WHERE sp.potential_outcome = 'positive'
      GROUP BY sp.post_id, sp.title, sp.body_text, sp.metadata, sp.interview_date, sp.potential_outcome, sp.created_at
      HAVING COUNT(CASE WHEN iq.extraction_confidence >= 0.90 THEN 1 END) = 0
      ORDER BY sp.created_at DESC
    `);

    const postsToReExtract = result.rows;
    stats.totalPosts = postsToReExtract.length;

    logger.info(`[QuestionReExtract] Found ${stats.totalPosts} posts with low-quality questions`);

    if (stats.totalPosts === 0) {
      logger.info('[QuestionReExtract] No posts need re-extraction');
      return stats;
    }

    // 2. Delete existing low-quality questions for these posts
    logger.info('[QuestionReExtract] Deleting existing low-quality questions...');

    const postIds = postsToReExtract.map(p => p.post_id);
    const deleteResult = await pool.query(`
      DELETE FROM interview_questions
      WHERE post_id = ANY($1)
      RETURNING id
    `, [postIds]);

    stats.questionsDeleted = deleteResult.rowCount;
    logger.info(`[QuestionReExtract] Deleted ${stats.questionsDeleted} low-quality questions`);

    // 3. Run LLM extraction on all posts
    logger.info('[QuestionReExtract] Starting LLM extraction...');

    for (let i = 0; i < postsToReExtract.length; i += batchSize) {
      const batch = postsToReExtract.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(postsToReExtract.length / batchSize);

      logger.info(`[QuestionReExtract] Processing batch ${batchNum}/${totalBatches} (${batch.length} posts)`);

      for (const post of batch) {
        try {
          const text = `${post.title}\n\n${post.body_text}`;

          // Use LLM to extract BOTH topics and detailed questions
          const extracted = await analyzeText(text);

          const questions = [];
          let detailedCount = 0;
          let topicsCount = 0;

          // Extract LeetCode problems FIRST (highest priority - confidence 0.95)
          if (extracted.leetcode_problems && extracted.leetcode_problems.length > 0) {
            extracted.leetcode_problems.forEach(problem => {
              questions.push({
                text: problem,
                confidence: 0.95,  // Highest confidence for clean LeetCode names
                pattern: 'llm_leetcode_extraction',
                type: 'coding'  // Always coding
              });
              detailedCount++;
            });
          }

          // Extract detailed interview_questions (confidence 0.90)
          if (extracted.interview_questions && extracted.interview_questions.length > 0) {
            extracted.interview_questions.forEach(question => {
              questions.push({
                text: question,
                confidence: 0.90,
                pattern: 'llm_question_extraction',
                type: classifyQuestionType(question)
              });
              detailedCount++;
            });
          }

          // Also extract interview_topics (confidence 0.75)
          if (extracted.interview_topics && extracted.interview_topics.length > 0) {
            extracted.interview_topics.forEach(topic => {
              questions.push({
                text: topic,
                confidence: 0.75,
                pattern: 'llm_topic_extraction',
                type: classifyQuestionType(topic)
              });
              topicsCount++;
            });
          }

          if (questions.length > 0) {
            await saveQuestions(post, questions, 'llm');
            stats.postsProcessed++;
            stats.detailedQuestionsExtracted += detailedCount;
            stats.topicsExtracted += topicsCount;

            if (stats.postsProcessed % 50 === 0) {
              logger.info(`[QuestionReExtract] Progress: ${stats.postsProcessed}/${stats.totalPosts} posts (${stats.detailedQuestionsExtracted} detailed, ${stats.topicsExtracted} topics)`);
            }
          }

        } catch (error) {
          logger.error(`[QuestionReExtract] LLM error for ${post.post_id}:`, error.message);
          stats.errors++;
        }
      }

      // Rate limiting between batches
      if (i + batchSize < postsToReExtract.length) {
        logger.info(`[QuestionReExtract] Rate limiting: waiting ${rateLimit}ms`);
        await sleep(rateLimit);
      }
    }

    // 4. Final stats
    const coverage = ((stats.postsProcessed / stats.totalPosts) * 100).toFixed(1);

    logger.info('[QuestionReExtract] Re-extraction complete:');
    logger.info(`  - Total posts targeted: ${stats.totalPosts}`);
    logger.info(`  - Posts processed: ${stats.postsProcessed} (${coverage}%)`);
    logger.info(`  - Questions deleted: ${stats.questionsDeleted}`);
    logger.info(`  - Detailed questions extracted: ${stats.detailedQuestionsExtracted}`);
    logger.info(`  - Topics extracted: ${stats.topicsExtracted}`);
    logger.info(`  - Total questions: ${stats.detailedQuestionsExtracted + stats.topicsExtracted}`);
    logger.info(`  - Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    logger.error('[QuestionReExtract] Fatal error:', error);
    throw error;
  }
}

/**
 * Re-extract ONLY coding questions with new leetcode_problems field
 * Target: ~99 posts with coding/technical questions
 * This will dramatically improve LeetCode matching accuracy
 *
 * Strategy:
 * 1. Find all posts with coding/system_design/technical questions
 * 2. Delete ONLY those coding questions (keep behavioral/other questions)
 * 3. Re-extract with new prompt that includes leetcode_problems field
 *
 * Expected: ~100-150 clean LeetCode problem names
 * Cost: ~$0.05 (99 × $0.0005)
 * Time: ~5 minutes
 */
async function reExtractCodingQuestions(options = {}) {
  const { batchSize = 30, rateLimit = 5000 } = options;

  logger.info('[CodingReExtract] Starting re-extraction of coding questions with leetcode_problems field');
  logger.info('[CodingReExtract] Options:', { batchSize, rateLimit });

  const stats = {
    totalPosts: 0,
    postsProcessed: 0,
    codingQuestionsDeleted: 0,
    leetcodeProblemsExtracted: 0,
    detailedQuestionsExtracted: 0,
    topicsExtracted: 0,
    errors: 0
  };

  try {
    // 1. Get all posts with coding/system_design/technical questions
    const result = await pool.query(`
      SELECT DISTINCT sp.post_id, sp.title, sp.body_text,
             sp.metadata->>'company' as company,
             sp.interview_date,
             sp.potential_outcome,
             sp.created_at
      FROM scraped_posts sp
      JOIN interview_questions iq ON sp.post_id = iq.post_id
      WHERE sp.potential_outcome = 'positive'
        AND iq.question_type IN ('coding', 'system_design', 'technical')
        AND iq.extraction_confidence >= 0.90
      ORDER BY sp.created_at DESC
    `);

    const postsToReExtract = result.rows;
    stats.totalPosts = postsToReExtract.length;

    logger.info(`[CodingReExtract] Found ${stats.totalPosts} posts with coding questions`);

    if (stats.totalPosts === 0) {
      logger.info('[CodingReExtract] No posts need re-extraction');
      return stats;
    }

    // 2. Delete ONLY coding/system_design/technical questions from these posts
    logger.info('[CodingReExtract] Deleting existing coding questions...');

    const postIds = postsToReExtract.map(p => p.post_id);
    const deleteResult = await pool.query(`
      DELETE FROM interview_questions
      WHERE post_id = ANY($1)
        AND question_type IN ('coding', 'system_design', 'technical')
      RETURNING id
    `, [postIds]);

    stats.codingQuestionsDeleted = deleteResult.rowCount;
    logger.info(`[CodingReExtract] Deleted ${stats.codingQuestionsDeleted} coding questions`);

    // 3. Run LLM extraction on all posts with NEW leetcode_problems field
    logger.info('[CodingReExtract] Starting LLM extraction with leetcode_problems field...');

    for (let i = 0; i < postsToReExtract.length; i += batchSize) {
      const batch = postsToReExtract.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(postsToReExtract.length / batchSize);

      logger.info(`[CodingReExtract] Processing batch ${batchNum}/${totalBatches} (${batch.length} posts)`);

      for (const post of batch) {
        try {
          const text = `${post.title}\n\n${post.body_text}`;

          // Use LLM to extract with NEW leetcode_problems field
          const extracted = await analyzeText(text);

          const questions = [];
          let leetcodeCount = 0;
          let detailedCount = 0;
          let topicsCount = 0;

          // Extract LeetCode problems FIRST (highest priority - confidence 0.95)
          if (extracted.leetcode_problems && extracted.leetcode_problems.length > 0) {
            extracted.leetcode_problems.forEach(problem => {
              questions.push({
                text: problem,
                confidence: 0.95,  // Highest confidence for clean LeetCode names
                pattern: 'llm_leetcode_extraction',
                type: 'coding'  // Always coding
              });
              leetcodeCount++;
            });
          }

          // Extract detailed interview_questions (confidence 0.90)
          if (extracted.interview_questions && extracted.interview_questions.length > 0) {
            extracted.interview_questions.forEach(question => {
              const type = classifyQuestionType(question);
              // Only include coding-related questions
              if (type === 'coding' || type === 'system_design' || type === 'technical') {
                questions.push({
                  text: question,
                  confidence: 0.90,
                  pattern: 'llm_question_extraction',
                  type
                });
                detailedCount++;
              }
            });
          }

          // Also extract coding-related topics (confidence 0.75)
          if (extracted.interview_topics && extracted.interview_topics.length > 0) {
            extracted.interview_topics.forEach(topic => {
              const type = classifyQuestionType(topic);
              // Only include coding-related topics
              if (type === 'coding' || type === 'system_design' || type === 'technical') {
                questions.push({
                  text: topic,
                  confidence: 0.75,
                  pattern: 'llm_topic_extraction',
                  type
                });
                topicsCount++;
              }
            });
          }

          if (questions.length > 0) {
            await saveQuestions(post, questions, 'llm');
            stats.postsProcessed++;
            stats.leetcodeProblemsExtracted += leetcodeCount;
            stats.detailedQuestionsExtracted += detailedCount;
            stats.topicsExtracted += topicsCount;

            if (stats.postsProcessed % 25 === 0) {
              logger.info(`[CodingReExtract] Progress: ${stats.postsProcessed}/${stats.totalPosts} posts (${stats.leetcodeProblemsExtracted} LeetCode, ${stats.detailedQuestionsExtracted} detailed, ${stats.topicsExtracted} topics)`);
            }
          }

        } catch (error) {
          logger.error(`[CodingReExtract] LLM error for ${post.post_id}:`, error.message);
          stats.errors++;
        }
      }

      // Rate limiting between batches
      if (i + batchSize < postsToReExtract.length) {
        logger.info(`[CodingReExtract] Rate limiting: waiting ${rateLimit}ms`);
        await sleep(rateLimit);
      }
    }

    // 4. Final stats
    const coverage = ((stats.postsProcessed / stats.totalPosts) * 100).toFixed(1);

    logger.info('[CodingReExtract] Re-extraction complete:');
    logger.info(`  - Total posts targeted: ${stats.totalPosts}`);
    logger.info(`  - Posts processed: ${stats.postsProcessed} (${coverage}%)`);
    logger.info(`  - Coding questions deleted: ${stats.codingQuestionsDeleted}`);
    logger.info(`  - LeetCode problems extracted: ${stats.leetcodeProblemsExtracted}`);
    logger.info(`  - Detailed questions extracted: ${stats.detailedQuestionsExtracted}`);
    logger.info(`  - Topics extracted: ${stats.topicsExtracted}`);
    logger.info(`  - Total new questions: ${stats.leetcodeProblemsExtracted + stats.detailedQuestionsExtracted + stats.topicsExtracted}`);
    logger.info(`  - Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    logger.error('[CodingReExtract] Fatal error:', error);
    throw error;
  }
}

/**
 * Extract questions from posts that have NO questions at all
 * Targets the 465 posts that were completely missed during initial extraction
 */
async function extractFromUnprocessedPosts(options = {}) {
  const {
    batchSize = 30,
    rateLimit = 1000,  // Changed from 5000ms to 1000ms (1 second)
    limit = null  // Process all by default
  } = options;

  try {
    logger.info('[UnprocessedExtract] ========================================');
    logger.info('[UnprocessedExtract] Starting extraction for posts with NO questions');
    logger.info('[UnprocessedExtract] ========================================');

    // 1. Get all relevant interview posts with NO questions extracted
    const query = `
      SELECT sp.post_id, sp.title, sp.body_text, sp.created_at
      FROM scraped_posts sp
      LEFT JOIN interview_questions iq ON sp.post_id = iq.post_id
      WHERE sp.is_relevant = true
        AND iq.post_id IS NULL
      ORDER BY sp.created_at DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const result = await pool.query(query);
    const posts = result.rows;

    logger.info(`[UnprocessedExtract] Found ${posts.length} posts with no questions extracted`);

    if (posts.length === 0) {
      return {
        postsProcessed: 0,
        postsSkipped: 0,
        leetcodeProblemsExtracted: 0,
        detailedQuestionsExtracted: 0,
        topicsExtracted: 0,
        errors: 0
      };
    }

    const stats = {
      postsProcessed: 0,
      postsSkipped: 0,
      leetcodeProblemsExtracted: 0,
      detailedQuestionsExtracted: 0,
      topicsExtracted: 0,
      errors: 0
    };

    // 2. Process posts in batches with rate limiting
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      logger.info(`[UnprocessedExtract] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)} (${batch.length} posts)`);

      for (const post of batch) {
        try {
          const postText = `${post.title}\n\n${post.body_text}`;

          // Extract using LLM with NEW leetcode_problems field
          logger.info(`[UnprocessedExtract] Extracting from post ${post.post_id}: "${post.title.substring(0, 50)}..."`);

          const extracted = await analyzeText(postText);

          // Classify questions with proper confidence tiers
          const questions = [];

          // TIER 1: Extract LeetCode problems FIRST (confidence 0.95)
          if (extracted.leetcode_problems && extracted.leetcode_problems.length > 0) {
            extracted.leetcode_problems.forEach(problem => {
              questions.push({
                text: problem,
                confidence: 0.95,
                pattern: 'llm_leetcode_extraction',
                type: 'coding'
              });
              stats.leetcodeProblemsExtracted++;
            });
            logger.info(`[UnprocessedExtract]   ✅ Extracted ${extracted.leetcode_problems.length} LeetCode problems (0.95 confidence)`);
          }

          // TIER 2: Extract detailed interview_questions (confidence 0.90)
          if (extracted.interview_questions && extracted.interview_questions.length > 0) {
            extracted.interview_questions.forEach(q => {
              const qType = classifyQuestionType(q);
              questions.push({
                text: q,
                confidence: 0.90,
                pattern: 'llm_question_extraction',
                type: qType
              });
              stats.detailedQuestionsExtracted++;
            });
            logger.info(`[UnprocessedExtract]   ✅ Extracted ${extracted.interview_questions.length} detailed questions (0.90 confidence)`);
          }

          // TIER 3: Extract topics (confidence 0.75)
          if (extracted.interview_topics && extracted.interview_topics.length > 0) {
            extracted.interview_topics.forEach(topic => {
              questions.push({
                text: topic,
                confidence: 0.75,
                pattern: 'llm_topic_extraction',
                type: classifyQuestionType(topic)
              });
              stats.topicsExtracted++;
            });
            logger.info(`[UnprocessedExtract]   ✅ Extracted ${extracted.interview_topics.length} topics (0.75 confidence)`);
          }

          // Insert new questions into database
          if (questions.length > 0) {
            for (const q of questions) {
              await pool.query(`
                INSERT INTO interview_questions (
                  post_id,
                  question_text,
                  question_type,
                  extraction_confidence
                ) VALUES ($1, $2, $3, $4)
              `, [post.post_id, q.text, q.type, q.confidence]);
            }

            logger.info(`[UnprocessedExtract]   💾 Inserted ${questions.length} questions for post ${post.post_id}`);
            stats.postsProcessed++;
          } else {
            logger.warn(`[UnprocessedExtract]   ⚠️  No questions extracted from post ${post.post_id}`);
            stats.postsSkipped++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, rateLimit));

        } catch (error) {
          logger.error(`[UnprocessedExtract] Error processing post ${post.post_id}:`, error.message);
          stats.errors++;
        }
      }
    }

    logger.info('[UnprocessedExtract] ========================================');
    logger.info('[UnprocessedExtract] Extraction Complete');
    logger.info('[UnprocessedExtract] ========================================');
    logger.info(`  - Posts processed: ${stats.postsProcessed}`);
    logger.info(`  - Posts skipped (no questions): ${stats.postsSkipped}`);
    logger.info(`  - LeetCode problems extracted: ${stats.leetcodeProblemsExtracted}`);
    logger.info(`  - Detailed questions extracted: ${stats.detailedQuestionsExtracted}`);
    logger.info(`  - Topics extracted: ${stats.topicsExtracted}`);
    logger.info(`  - Total new questions: ${stats.leetcodeProblemsExtracted + stats.detailedQuestionsExtracted + stats.topicsExtracted}`);
    logger.info(`  - Errors: ${stats.errors}`);

    return stats;

  } catch (error) {
    logger.error('[UnprocessedExtract] Fatal error:', error);
    throw error;
  }
}

module.exports = {
  backfillQuestions,
  reExtractLowQualityQuestions,
  reExtractCodingQuestions,
  extractFromUnprocessedPosts
};
