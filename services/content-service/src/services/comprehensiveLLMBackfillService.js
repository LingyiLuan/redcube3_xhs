/**
 * Comprehensive LLM Backfill Service
 *
 * Purpose: Extract ALL 13 LLM fields from relevant posts and save to both:
 * 1. Parent table (scraped_posts) - post-level fields
 * 2. Child table (interview_questions) - question-level fields
 *
 * Strategy: LLM primary, rule-based fallback
 */

const { analyzeText } = require('./aiService');
const { extractMetadata } = require('../metadata-extraction');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Sanitize data for safe JSONB insertion
 * Handles special characters, null bytes, and invalid Unicode
 */
function sanitizeForJsonb(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeForJsonb(item)).filter(item => item !== null);
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeForJsonb(val);
    }
    return sanitized;
  }

  if (typeof value === 'string') {
    return value
      .replace(/\u0000/g, '')  // Remove null bytes
      .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')  // Remove control characters
      .trim();
  }

  return value;
}

/**
 * Safe JSON stringify for PostgreSQL JSONB
 */
function safeJsonStringify(data) {
  try {
    const sanitized = sanitizeForJsonb(data);
    return JSON.stringify(sanitized || []);
  } catch (error) {
    logger.error('[JSONB] Stringify error:', error.message);
    return '[]';
  }
}

/**
 * Backfill ALL LLM fields for relevant posts
 * Saves 10 new fields to parent table + questions to child table
 */
async function backfillComprehensiveLLM(options = {}) {
  const {
    batchSize = 30,
    rateLimit = 1000,
    limit = null  // Process all by default
  } = options;

  logger.info('[ComprehensiveLLM] ========================================');
  logger.info('[ComprehensiveLLM] Starting comprehensive LLM extraction');
  logger.info('[ComprehensiveLLM] ========================================');
  logger.info('[ComprehensiveLLM] Options:', { batchSize, rateLimit, limit });

  const stats = {
    totalPosts: 0,
    postsProcessed: 0,
    postsWithLLMData: 0,
    postsWithRuleFallback: 0,
    questionsExtracted: 0,
    errors: 0,
    fieldStats: {
      sentiment: 0,
      difficulty: 0,
      timeline: 0,
      industry: 0,
      company: 0,
      role: 0,
      outcome: 0,
      experienceLevel: 0,
      preparationMaterials: 0,
      keyInsights: 0,
      interviewStages: 0
    }
  };

  try {
    // 1. Get all relevant posts that haven't been processed with comprehensive LLM
    const query = `
      SELECT post_id, title, body_text, created_at,
             metadata->>'company' as current_company,
             role_type as current_role,
             outcome as current_outcome
      FROM scraped_posts
      WHERE is_relevant = true
        AND llm_extracted_at IS NULL
      ORDER BY created_at DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;

    const result = await pool.query(query);
    const posts = result.rows;
    stats.totalPosts = posts.length;

    logger.info(`[ComprehensiveLLM] Found ${stats.totalPosts} relevant posts to process`);

    if (stats.totalPosts === 0) {
      logger.info('[ComprehensiveLLM] No posts need processing');
      return stats;
    }

    // 2. Process posts in batches with PARALLEL processing
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(posts.length / batchSize);

      logger.info(`[ComprehensiveLLM] Processing batch ${batchNum}/${totalBatches} (${batch.length} posts)`);

      for (const post of batch) {
        try {
          const postText = `${post.title}\n\n${post.body_text}`;

          logger.info(`[ComprehensiveLLM] Processing post ${post.post_id}: "${post.title.substring(0, 60)}..."`);

          // Extract using LLM (all 13 fields)
          const llmData = await analyzeText(postText);

          // Also get rule-based extraction as fallback
          const ruleData = extractMetadata({
            title: post.title,
            body_text: post.body_text,
            comments: []
          });

          // Hybrid approach: LLM primary, rules as fallback
          const finalData = {
            // Post-level fields (save to parent table)
            sentiment_category: llmData.sentiment || null,
            difficulty_level: llmData.difficulty_level || null,
            timeline: llmData.timeline || null,
            llm_industry: llmData.industry || null,
            preparation_materials: llmData.preparation_materials || [],
            key_insights: llmData.key_insights || [],
            llm_interview_stages: llmData.interview_stages || [],

            // Hybrid fields (LLM primary, rule fallback)
            llm_company: llmData.company || ruleData.company || post.current_company || null,
            llm_role: llmData.role || ruleData.role_type || post.current_role || null,
            llm_outcome: llmData.outcome || ruleData.outcome || post.current_outcome || null,
            llm_experience_level: llmData.experience_level || ruleData.level || null,

            // Migration 23: NEW parent table fields
            total_rounds: llmData.total_rounds || null,
            remote_or_onsite: llmData.remote_or_onsite || null,
            offer_accepted: llmData.offer_accepted !== undefined ? llmData.offer_accepted : null,
            compensation_mentioned: llmData.compensation_mentioned || false,
            negotiation_occurred: llmData.negotiation_occurred || false,
            referral_used: llmData.referral_used || false,
            background_check_mentioned: llmData.background_check_mentioned || false,
            rejection_reason: llmData.rejection_reason || null,
            interview_format: llmData.interview_format || null,
            followup_actions: llmData.followup_actions || null,

            // Question-level fields (save to child table)
            interview_topics: llmData.interview_topics || [],
            interview_questions: llmData.interview_questions || [],
            leetcode_problems: llmData.leetcode_problems || [],
            questions_with_details: llmData.questions_with_details || [],

            // Migration 27: Comprehensive post metadata
            // Struggle/Failure Analysis
            areas_struggled: llmData.areas_struggled || [],
            failed_questions: llmData.failed_questions || [],
            mistakes_made: llmData.mistakes_made || [],
            skills_tested: llmData.skills_tested || [],
            weak_areas: llmData.weak_areas || [],
            // Success Factors
            success_factors: llmData.success_factors || [],
            helpful_resources: llmData.helpful_resources || [],
            preparation_time_days: llmData.preparation_time_days || null,
            practice_problem_count: llmData.practice_problem_count || null,
            // Interview Experience
            interview_rounds: llmData.interview_rounds || null,
            interview_duration_hours: llmData.interview_duration_hours || null,
            interviewer_feedback: llmData.interviewer_feedback || [],
            rejection_reasons: llmData.rejection_reasons || [],
            offer_details: llmData.offer_details || {},
            // Contextual
            interview_date: llmData.interview_date || null,
            job_market_conditions: llmData.job_market_conditions || null,
            location: llmData.location || null,
            // Resource Effectiveness
            resources_used: llmData.resources_used || [],
            study_approach: llmData.study_approach || null,
            mock_interviews_count: llmData.mock_interviews_count || null,
            study_schedule: llmData.study_schedule || null,
            // Outcome Correlation
            prep_to_interview_gap_days: llmData.prep_to_interview_gap_days || null,
            previous_interview_count: llmData.previous_interview_count || null,
            improvement_areas: llmData.improvement_areas || []
          };

          // Update field stats
          if (finalData.sentiment_category) stats.fieldStats.sentiment++;
          if (finalData.difficulty_level) stats.fieldStats.difficulty++;
          if (finalData.timeline) stats.fieldStats.timeline++;
          if (finalData.llm_industry) stats.fieldStats.industry++;
          if (finalData.llm_company) stats.fieldStats.company++;
          if (finalData.llm_role) stats.fieldStats.role++;
          if (finalData.llm_outcome) stats.fieldStats.outcome++;
          if (finalData.llm_experience_level) stats.fieldStats.experienceLevel++;
          if (finalData.preparation_materials.length > 0) stats.fieldStats.preparationMaterials++;
          if (finalData.key_insights.length > 0) stats.fieldStats.keyInsights++;
          if (finalData.llm_interview_stages.length > 0) stats.fieldStats.interviewStages++;

          // Save to parent table (scraped_posts) - ALL fields including Migration 23 + Migration 27
          try {
            // Sanitize and stringify arrays for ::jsonb casting (matching agentService pattern)
            const prepMat = safeJsonStringify(sanitizeForJsonb(finalData.preparation_materials));
            const keyIns = safeJsonStringify(sanitizeForJsonb(finalData.key_insights));
            const intStages = safeJsonStringify(sanitizeForJsonb(finalData.llm_interview_stages));

            // Migration 27: New JSONB fields
            const areasStruggled = safeJsonStringify(sanitizeForJsonb(finalData.areas_struggled || []));
            const failedQuestions = safeJsonStringify(sanitizeForJsonb(finalData.failed_questions || []));
            const mistakesMade = safeJsonStringify(sanitizeForJsonb(finalData.mistakes_made || []));
            const skillsTested = safeJsonStringify(sanitizeForJsonb(finalData.skills_tested || []));
            const successFactors = safeJsonStringify(sanitizeForJsonb(finalData.success_factors || []));
            const helpfulResources = safeJsonStringify(sanitizeForJsonb(finalData.helpful_resources || []));
            const resourcesUsed = safeJsonStringify(sanitizeForJsonb(finalData.resources_used || []));
            const offerDetails = safeJsonStringify(sanitizeForJsonb(finalData.offer_details || {}));

            // Location field: existing column is JSONB, but LLM returns string - wrap it
            const locationValue = finalData.location
              ? safeJsonStringify({ location: finalData.location })
              : null;

            // Timeline as object (no casting needed)
            const timelineValue = finalData.timeline
              ? { description: sanitizeForJsonb(finalData.timeline) }
              : {};

            // MIGRATION 27 BACKFILL: Update ONLY Migration 27 fields, preserve existing old fields
            await pool.query(`
              UPDATE scraped_posts
              SET
                -- Migration 27: Struggle/Failure Analysis
                areas_struggled = $1::jsonb,
                failed_questions = $2::jsonb,
                mistakes_made = $3::jsonb,
                skills_tested = $4::jsonb,
                weak_areas = $5,
                -- Migration 27: Success Factors
                success_factors = $6::jsonb,
                helpful_resources = $7::jsonb,
                preparation_time_days = $8,
                practice_problem_count = $9,
                -- Migration 27: Interview Experience
                interview_rounds = $10,
                interview_duration_hours = $11,
                interviewer_feedback = $12,
                rejection_reasons = $13,
                offer_details = $14::jsonb,
                -- Migration 27: Contextual
                interview_date = $15,
                job_market_conditions = $16,
                location = $17::jsonb,
                -- Migration 27: Resource Effectiveness
                resources_used = $18::jsonb,
                study_approach = $19,
                mock_interviews_count = $20,
                study_schedule = $21,
                -- Migration 27: Outcome Correlation
                prep_to_interview_gap_days = $22,
                previous_interview_count = $23,
                improvement_areas = $24,
                llm_extracted_at = NOW()
              WHERE post_id = $25
            `, [
              // Migration 27: Struggle/Failure Analysis
              areasStruggled,
              failedQuestions,
              mistakesMade,
              skillsTested,
              finalData.weak_areas || null,
              // Migration 27: Success Factors
              successFactors,
              helpfulResources,
              finalData.preparation_time_days || null,
              finalData.practice_problem_count || null,
              // Migration 27: Interview Experience
              finalData.interview_rounds || null,
              finalData.interview_duration_hours || null,
              finalData.interviewer_feedback || null,
              finalData.rejection_reasons || null,
              offerDetails,
              // Migration 27: Contextual
              finalData.interview_date || null,
              finalData.job_market_conditions || null,
              locationValue,
              // Migration 27: Resource Effectiveness
              resourcesUsed,
              finalData.study_approach || null,
              finalData.mock_interviews_count || null,
              finalData.study_schedule || null,
              // Migration 27: Outcome Correlation
              finalData.prep_to_interview_gap_days || null,
              finalData.previous_interview_count || null,
              finalData.improvement_areas || null,
              post.post_id
            ]);
          } catch (dbError) {
            logger.error(`[JSONB Error] Failed to update parent table for ${post.post_id}: ${dbError.message}`);
            logger.error(`[JSONB Error] Full error:`, dbError);
            throw dbError;
          }

          // Save questions to child table (interview_questions) with Migration 24 fields
          const questions = [];

          // Build a map of question_text -> details for quick lookup
          const questionDetailsMap = new Map();
          if (finalData.questions_with_details && Array.isArray(finalData.questions_with_details)) {
            finalData.questions_with_details.forEach(detail => {
              questionDetailsMap.set(detail.question_text, detail);
            });
          }

          // TIER 1: LeetCode problems (0.95 confidence)
          finalData.leetcode_problems.forEach(problem => {
            const details = questionDetailsMap.get(problem) || {};
            questions.push({
              text: problem,
              confidence: 0.95,
              type: 'coding',
              details: details
            });
          });

          // TIER 2: Detailed questions (0.90 confidence)
          finalData.interview_questions.forEach(q => {
            const details = questionDetailsMap.get(q) || {};
            questions.push({
              text: q,
              confidence: 0.90,
              type: classifyQuestionType(q),
              details: details
            });
          });

          // TIER 3: Topics (0.75 confidence)
          finalData.interview_topics.forEach(topic => {
            const details = questionDetailsMap.get(topic) || {};
            questions.push({
              text: topic,
              confidence: 0.75,
              type: classifyQuestionType(topic),
              details: details
            });
          });

          // Save questions to database (skip duplicates) with ALL Migration 24 fields
          for (const question of questions) {
            try {
              await pool.query(`
                INSERT INTO interview_questions (
                  post_id, question_text, question_type,
                  extraction_confidence, extracted_from,
                  company, role_type, difficulty,
                  llm_difficulty, llm_category, estimated_time_minutes,
                  hints_given, common_mistakes, optimal_approach,
                  follow_up_questions, real_world_application, interviewer_focused_on,
                  candidate_struggled_with, preparation_resources, success_rate_reported,
                  llm_extracted_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
                ON CONFLICT (post_id, question_text) DO UPDATE SET
                  llm_difficulty = EXCLUDED.llm_difficulty,
                  llm_category = EXCLUDED.llm_category,
                  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
                  hints_given = EXCLUDED.hints_given,
                  common_mistakes = EXCLUDED.common_mistakes,
                  optimal_approach = EXCLUDED.optimal_approach,
                  follow_up_questions = EXCLUDED.follow_up_questions,
                  real_world_application = EXCLUDED.real_world_application,
                  interviewer_focused_on = EXCLUDED.interviewer_focused_on,
                  candidate_struggled_with = EXCLUDED.candidate_struggled_with,
                  preparation_resources = EXCLUDED.preparation_resources,
                  success_rate_reported = EXCLUDED.success_rate_reported,
                  llm_extracted_at = NOW()
              `, [
                post.post_id,
                question.text,
                question.type,
                question.confidence,
                'llm_comprehensive',
                finalData.llm_company,
                finalData.llm_role,
                finalData.difficulty_level,
                // Migration 24 fields (12 new fields)
                question.details.difficulty || null,
                question.details.category || null,
                question.details.estimated_time_minutes || null,
                safeJsonStringify(question.details.hints_given || []),
                safeJsonStringify(question.details.common_mistakes || []),
                question.details.optimal_approach || null,
                safeJsonStringify(question.details.follow_up_questions || []),
                question.details.real_world_application || null,
                safeJsonStringify(question.details.interviewer_focused_on || []),
                question.details.candidate_struggled_with || null,
                safeJsonStringify(question.details.preparation_resources || []),
                question.details.success_rate_reported || null
              ]);
              stats.questionsExtracted++;
            } catch (error) {
              // Duplicate or other constraint error - skip
              logger.debug(`[ComprehensiveLLM] Question insertion/update failed: ${question.text.substring(0, 50)} - ${error.message}`);
            }
          }

          stats.postsProcessed++;

          // Check if we used LLM data or fell back to rules
          const hasLLMData = llmData.company || llmData.role || llmData.sentiment ||
                             llmData.industry || llmData.difficulty_level;
          if (hasLLMData) {
            stats.postsWithLLMData++;
          } else {
            stats.postsWithRuleFallback++;
          }

          if (stats.postsProcessed % 25 === 0) {
            logger.info(`[ComprehensiveLLM] Progress: ${stats.postsProcessed}/${stats.totalPosts} posts, ${stats.questionsExtracted} questions`);
          }

        } catch (error) {
          logger.error(`[ComprehensiveLLM] Error processing post ${post.post_id}:`, error.message);
          stats.errors++;
        }
      }

      // Rate limiting between batches
      if (i + batchSize < posts.length) {
        logger.info(`[ComprehensiveLLM] Rate limiting: waiting ${rateLimit}ms`);
        await sleep(rateLimit);
      }
    }

    // 3. Final stats
    const coverage = ((stats.postsProcessed / stats.totalPosts) * 100).toFixed(1);

    logger.info('[ComprehensiveLLM] ========================================');
    logger.info('[ComprehensiveLLM] Backfill complete:');
    logger.info('[ComprehensiveLLM] ========================================');
    logger.info(`  - Total posts: ${stats.totalPosts}`);
    logger.info(`  - Posts processed: ${stats.postsProcessed} (${coverage}%)`);
    logger.info(`  - Posts with LLM data: ${stats.postsWithLLMData}`);
    logger.info(`  - Posts with rule fallback: ${stats.postsWithRuleFallback}`);
    logger.info(`  - Questions extracted: ${stats.questionsExtracted}`);
    logger.info(`  - Errors: ${stats.errors}`);
    logger.info('');
    logger.info('[ComprehensiveLLM] Field Coverage:');
    logger.info(`  - Sentiment: ${stats.fieldStats.sentiment} (${((stats.fieldStats.sentiment / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Difficulty: ${stats.fieldStats.difficulty} (${((stats.fieldStats.difficulty / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Timeline: ${stats.fieldStats.timeline} (${((stats.fieldStats.timeline / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Industry: ${stats.fieldStats.industry} (${((stats.fieldStats.industry / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Company: ${stats.fieldStats.company} (${((stats.fieldStats.company / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Role: ${stats.fieldStats.role} (${((stats.fieldStats.role / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Outcome: ${stats.fieldStats.outcome} (${((stats.fieldStats.outcome / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Experience Level: ${stats.fieldStats.experienceLevel} (${((stats.fieldStats.experienceLevel / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Preparation Materials: ${stats.fieldStats.preparationMaterials} (${((stats.fieldStats.preparationMaterials / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Key Insights: ${stats.fieldStats.keyInsights} (${((stats.fieldStats.keyInsights / stats.postsProcessed) * 100).toFixed(1)}%)`);
    logger.info(`  - Interview Stages: ${stats.fieldStats.interviewStages} (${((stats.fieldStats.interviewStages / stats.postsProcessed) * 100).toFixed(1)}%)`);

    return stats;

  } catch (error) {
    logger.error('[ComprehensiveLLM] Fatal error:', error);
    throw error;
  }
}

/**
 * Helper: Classify question type
 */
function classifyQuestionType(questionText) {
  const text = questionText.toLowerCase();

  // Coding/LeetCode patterns
  if (text.includes('leetcode') ||
      text.includes('algorithm') ||
      text.includes('implement') ||
      text.includes('write a function') ||
      text.includes('data structure')) {
    return 'coding';
  }

  // System design patterns
  if (text.includes('design') ||
      text.includes('architecture') ||
      text.includes('scale') ||
      text.includes('system')) {
    return 'system_design';
  }

  // Behavioral patterns
  if (text.includes('tell me about') ||
      text.includes('describe a time') ||
      text.includes('how do you handle') ||
      text.includes('why')) {
    return 'behavioral';
  }

  // Technical/knowledge patterns
  if (text.includes('what is') ||
      text.includes('explain') ||
      text.includes('difference between') ||
      text.includes('how does')) {
    return 'technical';
  }

  return 'unknown';
}

/**
 * Helper: Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  backfillComprehensiveLLM
};
