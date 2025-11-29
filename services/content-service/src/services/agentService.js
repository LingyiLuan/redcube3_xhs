/**
 * Proactive Agent Service
 * Orchestrates autonomous data collection, analysis, and user briefings
 */

const { ApifyClient } = require('apify-client');
const pool = require('../config/database');
const { extractMetadata } = require('../metadata-extraction');
const { analyzeText } = require('./aiService');
const redditApiService = require('./redditApiService');
const logger = require('../utils/logger');

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || 'YOUR_APIFY_TOKEN_HERE'
});

// Scraper mode: 'reddit' (direct Reddit API - FREE) or 'apify' (Apify actor - $$$)
const SCRAPER_MODE = process.env.SCRAPER_MODE || 'reddit';

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
 * Main function for weekly autonomous briefings
 * This will be triggered by the scheduler
 */
async function runWeeklyBriefings() {
  console.log('🤖 [AGENT] Starting weekly briefings workflow...');

  try {
    // Step 1: Get all users with goals set
    const usersWithGoals = await getUsersWithGoals();
    console.log(`📊 [AGENT] Found ${usersWithGoals.length} users with active goals`);

    if (usersWithGoals.length === 0) {
      console.log('⚠️ [AGENT] No users with goals. Skipping briefings.');
      return { success: true, message: 'No users to brief', count: 0 };
    }

    // Step 2: Scrape new data from Reddit
    const scrapedData = await scrapeNewInterviewData();
    console.log(`✅ [AGENT] Scraped ${scrapedData.length} new posts`);

    // Step 3: Save scraped data to database
    const savedCount = await saveScrapedData(scrapedData);
    console.log(`💾 [AGENT] Saved ${savedCount} posts to database`);

    // Step 4: Process and generate briefings for each user
    const briefings = [];
    for (const user of usersWithGoals) {
      try {
        const briefing = await generateUserBriefing(user, scrapedData);
        briefings.push(briefing);
        console.log(`📧 [AGENT] Generated briefing for user ${user.id}`);
      } catch (error) {
        console.error(`❌ [AGENT] Failed to generate briefing for user ${user.id}:`, error);
      }
    }

    console.log(`🎉 [AGENT] Weekly briefings completed! Generated ${briefings.length} briefings.`);

    return {
      success: true,
      usersProcessed: usersWithGoals.length,
      postsScraped: scrapedData.length,
      briefingsGenerated: briefings.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [AGENT] Error in weekly briefings workflow:', error);
    throw error;
  }
}

/**
 * Get all users who have set career goals
 */
async function getUsersWithGoals() {
  const query = `
    SELECT DISTINCT user_id as id, email
    FROM user_goals
    WHERE target_role IS NOT NULL
      AND is_active = true
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching users with goals:', error);
    return [];
  }
}

/**
 * Scrape new interview data using Reddit API or Apify
 */
async function scrapeNewInterviewData(options = {}) {
  const {
    subreddit = 'cscareerquestions',
    numberOfPosts = 50,
    sortBy = 'new',
    mode = SCRAPER_MODE // 'reddit' or 'apify'
  } = options;

  console.log(`🕷️ [SCRAPER] Mode: ${mode.toUpperCase()} | Subreddit: r/${subreddit} | Posts: ${numberOfPosts}`);

  // Use direct Reddit API (FREE, no Apify costs)
  if (mode === 'reddit') {
    return scrapeWithRedditApi({ subreddit, numberOfPosts, sortBy });
  }

  // Use Apify (legacy mode, costs $$$)
  return scrapeWithApify({ subreddit, numberOfPosts, sortBy });
}

/**
 * Scrape using direct Reddit API (FREE)
 */
async function scrapeWithRedditApi(options) {
  const { subreddit, numberOfPosts, sortBy } = options;

  try {
    console.log(`🆓 [REDDIT API] Starting direct Reddit API scraping (FREE)...`);

    const posts = await redditApiService.scrapeSubreddit({
      subreddit,
      numberOfPosts,
      sortBy
    });

    console.log(`✅ [REDDIT API] Successfully scraped ${posts.length} posts`);
    return posts;

  } catch (error) {
    console.error('❌ [REDDIT API] Error:', error.message);
    console.log('⚠️ [REDDIT API] Returning empty results due to error');
    return [];
  }
}

/**
 * Scrape using Apify (LEGACY - costs money)
 */
async function scrapeWithApify(options) {
  const { subreddit, numberOfPosts, sortBy } = options;

  console.log(`💰 [APIFY] Starting Apify actor (costs $$$)...`);

  try {
    // Get your actor ID from Apify Console after deployment
    const actorId = process.env.APIFY_ACTOR_ID || 'YOUR_ACTOR_ID';

    // Prepare actor input with Reddit credentials
    const input = {
      subreddit,
      numberOfPosts,
      sortBy,
      // Pass Reddit credentials as input parameters
      redditClientId: process.env.REDDIT_CLIENT_ID,
      redditSecret: process.env.REDDIT_SECRET,
      redditUser: process.env.REDDIT_USER,
      redditPass: process.env.REDDIT_PASS
    };

    console.log('🔐 [APIFY] Passing Reddit credentials via actor input');
    console.log('🔍 [DEBUG] Reddit credentials check:', {
      hasClientId: !!input.redditClientId,
      hasSecret: !!input.redditSecret,
      hasUser: !!input.redditUser,
      hasPass: !!input.redditPass,
      clientIdPreview: input.redditClientId ? input.redditClientId.substring(0, 5) + '...' : 'missing',
      userPreview: input.redditUser || 'missing'
    });

    // Run the actor with input and wait for completion
    const run = await apifyClient.actor(actorId).call(input, {
      build: 'latest'
    });

    console.log(`⏳ [APIFY] Actor run completed: ${run.id}`);
    console.log(`✅ [APIFY] Actor finished with status: ${run.status}`);

    // If the actor failed, fetch and display the logs
    if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
      console.error(`❌ [APIFY] Actor failed with status: ${run.status}`);
      try {
        const logUrl = `https://api.apify.com/v2/actor-runs/${run.id}/log`;
        const logResponse = await apifyClient.log(run.id).get();
        console.error('📋 [APIFY] Actor logs:');
        console.error(logResponse);
      } catch (logError) {
        console.error('⚠️ [APIFY] Could not fetch actor logs:', logError.message);
      }
    }

    // Fetch the dataset results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`📦 [APIFY] Retrieved ${items.length} items from dataset`);

    // Fetch summary statistics
    const summary = await apifyClient.keyValueStore(run.defaultKeyValueStoreId).getRecord('SUMMARY');

    if (summary) {
      console.log('📊 [APIFY] Summary:', summary.value);
    }

    return items;

  } catch (error) {
    console.error('❌ [APIFY] Error running Apify actor:', error);

    // Fallback: return empty array instead of crashing
    console.log('⚠️ [APIFY] Returning empty results due to error');
    return [];
  }
}

/**
 * Save scraped data to database
 */
async function saveScrapedData(scrapedPosts) {
  if (!scrapedPosts || scrapedPosts.length === 0) {
    return 0;
  }

  const { calculateJobInterviewRelevance } = require('./hackerNewsService');
  const { classifyPostWithLLM, isLLMAvailable } = require('./llmFilterService');
  const axios = require('axios');

  const originalCount = scrapedPosts.length;
  console.log(`💾 [DB] Processing ${originalCount} posts with advanced filtering...`);

  // We'll save ALL posts (both relevant and irrelevant) for future classifier training
  const postsToSave = [];
  let relevantCount = 0;
  let irrelevantCount = 0;
  let llmUsedCount = 0;

  for (const post of scrapedPosts) {
    try {
      // Step 1: Calculate base relevance score (rules + negative signals)
      let relevanceScore = calculateJobInterviewRelevance(post.title, post.bodyText || '');
      let isRelevant = false;
      let relevanceSource = 'rules';

      // Step 2: Check with NER service for boost (if score is borderline)
      if (relevanceScore >= 20 && relevanceScore <= 70) {
        try {
          const nerResponse = await axios.post('http://ner-service:8000/extract-metadata', {
            text: `${post.title} ${post.bodyText || ''}`.substring(0, 2000)
          }, { timeout: 3000 });

          const nerData = nerResponse.data;

          // Variable NER boost based on metadata richness (max +30 points)
          let nerBoost = 0;
          const foundItems = [];

          if (nerData.outcome) {
            nerBoost += 10;  // Outcome is highly valuable (offer/rejection)
            foundItems.push(`outcome:${nerData.outcome}`);
          }
          if (nerData.interview_stage) {
            nerBoost += 10;  // Interview stage indicates real experience
            foundItems.push(`stage:${nerData.interview_stage}`);
          }
          if (nerData.company) {
            nerBoost += 5;   // Company mention is good but less definitive
            foundItems.push(`company:${nerData.company}`);
          }
          if (nerData.tech_stack && nerData.tech_stack.length > 0) {
            nerBoost += 5;   // Tech stack adds context
            foundItems.push(`tech:${nerData.tech_stack.length} items`);
          }

          if (nerBoost > 0) {
            relevanceScore += nerBoost;
            console.log(`🔍 [NER BOOST] +${nerBoost} points for "${post.title.substring(0, 50)}..." (found: ${foundItems.join(', ')})`);
          }
        } catch (nerError) {
          // NER service unavailable, continue without boost
        }
      }

      // Step 3: For borderline cases (30-60), use LLM
      if (relevanceScore >= 30 && relevanceScore <= 60 && isLLMAvailable()) {
        const llmResult = await classifyPostWithLLM(post);
        isRelevant = llmResult.isRelevant;
        relevanceSource = 'llm';
        llmUsedCount++;

        // Update score based on LLM confidence
        if (llmResult.isRelevant) {
          relevanceScore = Math.max(relevanceScore, llmResult.confidence);
        }
      } else {
        // Clear cases: auto-accept or auto-reject based on score
        isRelevant = relevanceScore >= 40;  // 40% threshold
        relevanceSource = 'rules';
      }

      // Add relevance tracking to post
      post.is_relevant = isRelevant;
      post.relevance_source = relevanceSource;
      post.relevance_score = relevanceScore;

      postsToSave.push(post);

      if (isRelevant) {
        relevantCount++;
      } else {
        irrelevantCount++;
      }

    } catch (error) {
      console.error(`❌ [FILTER] Error processing post: ${error.message}`);
      // On error, mark as irrelevant
      post.is_relevant = false;
      post.relevance_source = 'error';
      post.relevance_score = 0;
      postsToSave.push(post);
      irrelevantCount++;
    }
  }

  console.log(`📊 [FILTER] Results: ${relevantCount} relevant, ${irrelevantCount} irrelevant (LLM used: ${llmUsedCount})`);
  console.log(`💾 [DB] Saving ALL ${postsToSave.length} posts to database (for future classifier training)...`);

  const insertQuery = `
    INSERT INTO scraped_posts (
      post_id, title, author, created_at, url, body_text,
      potential_outcome, confidence_score, subreddit, source, metadata,
      word_count, scraped_at,
      role_type, role_category, level, level_label, experience_years,
      interview_stage, outcome, tech_stack, primary_language,
      interview_topics, preparation, comments, comment_count,
      is_relevant, relevance_source, relevance_score, relevance_checked_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW())
    ON CONFLICT (post_id) DO UPDATE SET
      potential_outcome = EXCLUDED.potential_outcome,
      confidence_score = EXCLUDED.confidence_score,
      metadata = EXCLUDED.metadata,
      role_type = EXCLUDED.role_type,
      level = EXCLUDED.level,
      updated_at = NOW()
    RETURNING id
  `;

  let savedCount = 0;
  let extractionErrors = 0;

  for (const post of postsToSave) {
    try {
      // Extract enhanced metadata using NLP service
      let extractedMetadata = null;
      try {
        extractedMetadata = extractMetadata({
          title: post.title,
          body_text: post.bodyText,
          comments: post.comments || []
        });
        console.log(`🔍 [METADATA] Extracted for "${post.title}": role=${extractedMetadata.role_type}, level=${extractedMetadata.level}, company=${extractedMetadata.company}`);
      } catch (extractError) {
        console.warn(`⚠️ [METADATA] Extraction failed for post ${post.postId}:`, extractError.message);
        extractionErrors++;
      }

      // Merge company into metadata
      const enrichedMetadata = {
        ...post.metadata,
        company: extractedMetadata?.company || null
      };

      await pool.query(insertQuery, [
        post.postId,
        post.title,
        post.author,
        post.createdAt,
        post.url,
        post.bodyText,
        post.potential_outcome,
        post.confidence_score,
        post.subreddit,
        post.source || 'reddit',  // Default to 'reddit' for backwards compatibility
        safeJsonStringify(enrichedMetadata),
        post.word_count,
        post.scrapedAt,
        // Enhanced metadata fields
        extractedMetadata?.role_type || null,
        extractedMetadata?.role_category || null,
        extractedMetadata?.level || null,
        extractedMetadata?.level_label || null,
        extractedMetadata?.experience_years || null,
        extractedMetadata?.interview_stage || null,
        extractedMetadata?.outcome || null,
        extractedMetadata?.tech_stack || null,
        extractedMetadata?.primary_language || null,
        extractedMetadata?.interview_topics ? safeJsonStringify(extractedMetadata.interview_topics) : null,
        extractedMetadata?.preparation ? safeJsonStringify(extractedMetadata.preparation) : null,
        post.comments ? safeJsonStringify(post.comments) : '[]',
        post.comments ? post.comments.length : 0,
        // Relevance tracking fields
        post.is_relevant,
        post.relevance_source,
        post.relevance_score
      ]);
      savedCount++;
    } catch (error) {
      console.error(`❌ [DB] Error saving post ${post.postId}:`, error.message);
    }
  }

  console.log(`✅ [DB] Successfully saved ${savedCount}/${scrapedPosts.length} posts`);
  if (extractionErrors > 0) {
    console.log(`⚠️ [METADATA] ${extractionErrors} posts had metadata extraction errors`);
  }

  // AUTOMATIC LLM EXTRACTION: Process all newly saved is_relevant=true posts
  await processRelevantPostsWithLLM();

  return savedCount;
}

/**
 * Automatically run comprehensive LLM extraction on new is_relevant=true posts
 * This ensures all 21 new fields are extracted immediately when posts are scraped
 */
async function processRelevantPostsWithLLM() {
  try {
    logger.info('[AutoLLM] Checking for new relevant posts needing LLM extraction...');

    // Find posts that are relevant but haven't been processed with LLM yet
    const query = `
      SELECT post_id, title, body_text
      FROM scraped_posts
      WHERE is_relevant = true
        AND llm_extracted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query);
    const posts = result.rows;

    if (posts.length === 0) {
      logger.info('[AutoLLM] No new relevant posts need LLM extraction');
      return;
    }

    logger.info(`[AutoLLM] Found ${posts.length} new relevant posts - starting LLM extraction...`);

    let processedCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        const postText = `${post.title}\n\n${post.body_text}`;

        // Extract ALL fields using LLM
        const llmData = await analyzeText(postText);

        // Build a map for question details
        const questionDetailsMap = new Map();
        if (llmData.questions_with_details && Array.isArray(llmData.questions_with_details)) {
          llmData.questions_with_details.forEach(detail => {
            questionDetailsMap.set(detail.question_text, detail);
          });
        }

        // Prepare Migration 27 JSONB fields
        const areasStruggled = safeJsonStringify(sanitizeForJsonb(llmData.areas_struggled || []));
        const failedQuestions = safeJsonStringify(sanitizeForJsonb(llmData.failed_questions || []));
        const mistakesMade = safeJsonStringify(sanitizeForJsonb(llmData.mistakes_made || []));
        const skillsTested = safeJsonStringify(sanitizeForJsonb(llmData.skills_tested || []));
        const weakAreas = safeJsonStringify(sanitizeForJsonb(llmData.weak_areas || []));
        const successFactors = safeJsonStringify(sanitizeForJsonb(llmData.success_factors || []));
        const helpfulResources = safeJsonStringify(sanitizeForJsonb(llmData.helpful_resources || []));
        const resourcesUsed = safeJsonStringify(sanitizeForJsonb(llmData.resources_used || []));
        const interviewerFeedback = safeJsonStringify(sanitizeForJsonb(llmData.interviewer_feedback || []));
        const rejectionReasons = safeJsonStringify(sanitizeForJsonb(llmData.rejection_reasons || []));
        const improvementAreas = safeJsonStringify(sanitizeForJsonb(llmData.improvement_areas || []));
        const offerDetails = safeJsonStringify(sanitizeForJsonb(llmData.offer_details || {}));

        // Update parent table with ALL fields (OLD 21 + NEW Migration 27 fields)
        await pool.query(`
          UPDATE scraped_posts
          SET
            sentiment_category = $1,
            difficulty_level = $2,
            timeline = $3,
            llm_industry = $4,
            preparation_materials = $5::jsonb,
            key_insights = $6::jsonb,
            llm_company = $7,
            llm_role = $8,
            llm_outcome = $9,
            llm_experience_level = $10,
            llm_interview_stages = $11::jsonb,
            total_rounds = $12,
            remote_or_onsite = $13,
            offer_accepted = $14,
            compensation_mentioned = $15,
            negotiation_occurred = $16,
            referral_used = $17,
            background_check_mentioned = $18,
            rejection_reason = $19,
            interview_format = $20,
            followup_actions = $21,
            areas_struggled = $22::jsonb,
            failed_questions = $23::jsonb,
            mistakes_made = $24::jsonb,
            skills_tested = $25::jsonb,
            weak_areas = $26::jsonb,
            success_factors = $27::jsonb,
            helpful_resources = $28::jsonb,
            preparation_time_days = $29,
            practice_problem_count = $30,
            interview_rounds = $31,
            interview_duration_hours = $32,
            interviewer_feedback = $33::jsonb,
            rejection_reasons = $34::jsonb,
            offer_details = $35::jsonb,
            interview_date = $36,
            job_market_conditions = $37,
            location = $38,
            resources_used = $39::jsonb,
            study_approach = $40,
            mock_interviews_count = $41,
            study_schedule = $42,
            prep_to_interview_gap_days = $43,
            previous_interview_count = $44,
            improvement_areas = $45::jsonb,
            llm_extracted_at = NOW()
          WHERE post_id = $46
        `, [
          llmData.sentiment || null,
          llmData.difficulty_level || null,
          llmData.timeline ? { description: sanitizeForJsonb(llmData.timeline) } : {},
          llmData.industry || null,
          safeJsonStringify(llmData.preparation_materials || []),
          safeJsonStringify(llmData.key_insights || []),
          llmData.company || null,
          llmData.role || null,
          llmData.outcome || null,
          llmData.experience_level || null,
          safeJsonStringify(llmData.interview_stages || []),
          llmData.total_rounds || null,
          llmData.remote_or_onsite || null,
          llmData.offer_accepted !== undefined ? llmData.offer_accepted : null,
          llmData.compensation_mentioned || false,
          llmData.negotiation_occurred || false,
          llmData.referral_used || false,
          llmData.background_check_mentioned || false,
          llmData.rejection_reason || null,
          llmData.interview_format || null,
          llmData.followup_actions || null,
          areasStruggled,
          failedQuestions,
          mistakesMade,
          skillsTested,
          weakAreas,
          successFactors,
          helpfulResources,
          llmData.preparation_time_days || null,
          llmData.practice_problem_count || null,
          llmData.interview_rounds || null,
          llmData.interview_duration_hours || null,
          interviewerFeedback,
          rejectionReasons,
          offerDetails,
          llmData.interview_date || null,
          llmData.job_market_conditions || null,
          llmData.location || null,
          resourcesUsed,
          llmData.study_approach || null,
          llmData.mock_interviews_count || null,
          llmData.study_schedule || null,
          llmData.prep_to_interview_gap_days || null,
          llmData.previous_interview_count || null,
          improvementAreas,
          post.post_id
        ]);

        // Insert questions into child table with all 12 new fields
        const allQuestions = [
          ...(llmData.leetcode_problems || []).map(q => ({ text: q, tier: 1, type: 'coding' })),
          ...(llmData.interview_questions || []).map(q => ({ text: q, tier: 2, type: 'unknown' })),
          ...(llmData.interview_topics || []).map(q => ({ text: q, tier: 3, type: 'topic' }))
        ];

        for (const question of allQuestions) {
          const details = questionDetailsMap.get(question.text) || {};

          await pool.query(`
            INSERT INTO interview_questions (
              post_id, question_text, question_type,
              extraction_confidence, extracted_from,
              company, role_type, difficulty,
              llm_difficulty, llm_category, estimated_time_minutes,
              hints_given, common_mistakes, optimal_approach,
              follow_up_questions, real_world_application, interviewer_focused_on,
              candidate_struggled_with, preparation_resources, success_rate_reported
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
              success_rate_reported = EXCLUDED.success_rate_reported
          `, [
            post.post_id,
            question.text,
            details.category || question.type,
            question.tier === 1 ? 0.95 : question.tier === 2 ? 0.90 : 0.75,
            'auto_llm',
            llmData.company || null,
            llmData.role || null,
            llmData.difficulty_level || null,
            details.difficulty || null,
            details.category || null,
            details.estimated_time_minutes || null,
            safeJsonStringify(details.hints_given || []),
            safeJsonStringify(details.common_mistakes || []),
            details.optimal_approach || null,
            safeJsonStringify(details.follow_up_questions || []),
            details.real_world_application || null,
            safeJsonStringify(details.interviewer_focused_on || []),
            details.candidate_struggled_with || null,
            safeJsonStringify(details.preparation_resources || []),
            details.success_rate_reported || null
          ]);
        }

        processedCount++;
        logger.info(`[AutoLLM] ✅ Processed post ${post.post_id} (${processedCount}/${posts.length})`);

        // Rate limiting to avoid overwhelming API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errorCount++;
        logger.error(`[AutoLLM] ❌ Error processing post ${post.post_id}:`, error.message);
      }
    }

    logger.info(`[AutoLLM] Complete: ${processedCount} posts processed, ${errorCount} errors`);

  } catch (error) {
    logger.error('[AutoLLM] Fatal error in automatic LLM extraction:', error);
  }
}

/**
 * Generate personalized briefing for a user
 */
async function generateUserBriefing(user, scrapedData) {
  console.log(`📝 [BRIEFING] Generating briefing for user ${user.id}...`);

  // Get user's goals
  const userGoals = await getUserGoals(user.id);

  // Filter relevant posts based on user's interests
  const relevantPosts = filterRelevantPosts(scrapedData, userGoals);

  // Extract key insights
  const insights = extractInsights(relevantPosts, userGoals);

  // Build briefing object
  const briefing = {
    userId: user.id,
    email: user.email,
    generatedAt: new Date().toISOString(),
    period: 'weekly',
    userGoals,
    insights,
    relevantPostsCount: relevantPosts.length,
    totalPostsScraped: scrapedData.length
  };

  // Save briefing to database
  await saveBriefing(briefing);

  return briefing;
}

/**
 * Get user's career goals
 */
async function getUserGoals(userId) {
  const query = `
    SELECT target_role, target_companies, desired_skills, timeline_months, location_preference
    FROM user_goals
    WHERE user_id = $1 AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return {};
  }
}

/**
 * Filter posts relevant to user's goals
 */
function filterRelevantPosts(posts, userGoals) {
  if (!posts || posts.length === 0) return [];

  const targetRole = (userGoals.target_role || '').toLowerCase();
  const targetCompanies = (userGoals.target_companies || []).map(c => c.toLowerCase());
  const desiredSkills = (userGoals.desired_skills || []).map(s => s.toLowerCase());

  return posts.filter(post => {
    const metadata = post.metadata || {};
    const combinedText = `${post.title} ${post.bodyText}`.toLowerCase();

    // Check if post mentions target role
    const hasRole = targetRole && combinedText.includes(targetRole);

    // Check if post mentions target companies
    const hasCompany = targetCompanies.some(company =>
      (metadata.companies || []).includes(company) || combinedText.includes(company)
    );

    // Check if post mentions desired skills
    const hasSkill = desiredSkills.some(skill =>
      (metadata.technologies || []).includes(skill) || combinedText.includes(skill)
    );

    // Include post if it matches any criteria
    return hasRole || hasCompany || hasSkill;
  });
}

/**
 * Extract key insights from relevant posts
 */
function extractInsights(posts, userGoals) {
  if (!posts || posts.length === 0) {
    return {
      summary: 'No new relevant posts this week.',
      topCompanies: [],
      topSkills: [],
      successRate: null,
      topPosts: []
    };
  }

  // Calculate success rate
  const positiveCount = posts.filter(p => p.potential_outcome === 'positive').length;
  const negativeCount = posts.filter(p => p.potential_outcome === 'negative').length;
  const totalWithOutcome = positiveCount + negativeCount;
  const successRate = totalWithOutcome > 0
    ? ((positiveCount / totalWithOutcome) * 100).toFixed(1)
    : null;

  // Extract top companies mentioned
  const companyCounts = {};
  posts.forEach(post => {
    (post.metadata?.companies || []).forEach(company => {
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));

  // Extract top skills mentioned
  const skillCounts = {};
  posts.forEach(post => {
    (post.metadata?.technologies || []).forEach(tech => {
      skillCounts[tech] = (skillCounts[tech] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  // Get top 3 most relevant posts (by confidence and outcome)
  const topPosts = posts
    .filter(p => p.potential_outcome !== 'unknown')
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 3)
    .map(p => ({
      title: p.title,
      url: p.url,
      outcome: p.potential_outcome,
      confidence: p.confidence_score
    }));

  return {
    summary: `Found ${posts.length} relevant posts this week. Success rate: ${successRate}%`,
    successRate: parseFloat(successRate),
    topCompanies,
    topSkills,
    topPosts,
    totalPosts: posts.length
  };
}

/**
 * Save briefing to database
 */
async function saveBriefing(briefing) {
  const query = `
    INSERT INTO user_briefings (
      user_id, period, user_goals, insights, relevant_posts_count,
      total_posts_scraped, generated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      briefing.userId,
      briefing.period,
      safeJsonStringify(briefing.userGoals),
      safeJsonStringify(briefing.insights),
      briefing.relevantPostsCount,
      briefing.totalPostsScraped,
      briefing.generatedAt
    ]);

    console.log(`✅ [DB] Saved briefing ${result.rows[0].id} for user ${briefing.userId}`);
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ [DB] Error saving briefing:', error);
    throw error;
  }
}

/**
 * Manual trigger for testing
 */
async function runManualScrape(subreddit = 'cscareerquestions', numberOfPosts = 25) {
  console.log(`🔧 [MANUAL] Running manual scrape: r/${subreddit}, ${numberOfPosts} posts`);

  const scrapedData = await scrapeNewInterviewData({ subreddit, numberOfPosts, sortBy: 'new' });
  const savedCount = await saveScrapedData(scrapedData);

  return {
    success: true,
    scraped: scrapedData.length,
    saved: savedCount,
    data: scrapedData
  };
}

/**
 * Scrape posts targeting specific companies (FAANG, Finance, Startups)
 */
async function scrapeCompanyTargeted(options = {}) {
  const {
    companies = ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft'], // Default FAANG
    postsPerCompany = 50,
    subreddit = 'cscareerquestions'
  } = options;

  console.log(`🎯 [COMPANY SCRAPER] Targeting ${companies.length} companies: ${companies.join(', ')}`);

  try {
    const posts = await redditApiService.scrapeByCompanies(companies, {
      subreddit,
      postsPerCompany
    });

    console.log(`✅ [COMPANY SCRAPER] Scraped ${posts.length} company-targeted posts`);

    const savedCount = await saveScrapedData(posts);
    console.log(`💾 [COMPANY SCRAPER] Saved ${savedCount} posts to database`);

    return {
      success: true,
      scraped: posts.length,
      saved: savedCount,
      companies: companies.length
    };

  } catch (error) {
    console.error('❌ [COMPANY SCRAPER] Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Reddit API connection
 */
async function testRedditConnection() {
  console.log('🧪 [TEST] Testing Reddit API connection...');
  return await redditApiService.testConnection();
}

module.exports = {
  runWeeklyBriefings,
  scrapeNewInterviewData,
  saveScrapedData,
  generateUserBriefing,
  runManualScrape,
  scrapeCompanyTargeted,
  testRedditConnection
};
