/**
 * NLP Controller - Phase 6: Sprint 4
 * Endpoints for NLP extraction and question management
 */

// Removed redundant nlpExtractionService and nlpQueue imports
// All question extraction is now handled by comprehensiveLLMBackfillService
const { backfillQuestions, reExtractLowQualityQuestions, reExtractCodingQuestions, extractFromUnprocessedPosts } = require('../services/questionBackfillService');
const { backfillComprehensiveLLM } = require('../services/comprehensiveLLMBackfillService');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Trigger question extraction - DEPRECATED
 * Now use triggerComprehensiveLLMBackfill instead
 * POST /api/content/nlp/extract
 */
async function triggerExtraction(req, res) {
  return res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Use POST /api/content/nlp/comprehensive-backfill instead',
    newEndpoint: '/api/content/nlp/comprehensive-backfill'
  });
}

/**
 * Get question statistics - DEPRECATED
 * GET /api/content/nlp/stats
 */
async function getStats(req, res) {
  return res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Question stats are no longer tracked separately. Use comprehensive LLM backfill service.',
    newEndpoint: '/api/content/nlp/comprehensive-backfill'
  });
}

/**
 * Find similar questions - DEPRECATED
 * POST /api/content/nlp/similar
 */
async function findSimilar(req, res) {
  return res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Similar question search is no longer available. Use comprehensive LLM backfill service.',
    newEndpoint: '/api/content/nlp/comprehensive-backfill'
  });
}

/**
 * Classify question difficulty - DEPRECATED
 * POST /api/content/nlp/classify
 */
async function classifyDifficulty(req, res) {
  return res.status(410).json({
    error: 'This endpoint is deprecated',
    message: 'Question classification is no longer available. Use comprehensive LLM backfill service.',
    newEndpoint: '/api/content/nlp/comprehensive-backfill'
  });
}

/**
 * Trigger question backfill for relevant posts
 * POST /api/content/nlp/backfill
 * Body: { useRegexOnly: false, batchSize: 30 }
 */
async function triggerBackfill(req, res) {
  try {
    const { useRegexOnly = false, batchSize = 30, rateLimit = 5000 } = req.body;

    logger.info('[NLP Backfill] Starting question extraction backfill');
    logger.info('[NLP Backfill] Options:', { useRegexOnly, batchSize, rateLimit });

    // Run backfill in background
    backfillQuestions({ useRegexOnly, batchSize, rateLimit })
      .then(result => {
        logger.info('[NLP Backfill] Complete:', result);
      })
      .catch(error => {
        logger.error('[NLP Backfill] Error:', error);
      });

    return res.json({
      success: true,
      message: 'Question backfill started',
      options: { useRegexOnly, batchSize, rateLimit }
    });

  } catch (error) {
    logger.error('[NLP Backfill] Error:', error);
    return res.status(500).json({
      error: 'Failed to start backfill',
      message: error.message
    });
  }
}

/**
 * Trigger re-extraction of low-quality questions
 * POST /api/content/nlp/reextract
 * Body: { batchSize: 30, rateLimit: 5000 }
 */
async function triggerReExtraction(req, res) {
  try {
    const { batchSize = 30, rateLimit = 5000 } = req.body;

    logger.info('[NLP ReExtract] Starting re-extraction of low-quality questions');
    logger.info('[NLP ReExtract] Options:', { batchSize, rateLimit });

    // Run re-extraction in background
    reExtractLowQualityQuestions({ batchSize, rateLimit })
      .then(result => {
        logger.info('[NLP ReExtract] Complete:', result);
      })
      .catch(error => {
        logger.error('[NLP ReExtract] Error:', error);
      });

    return res.json({
      success: true,
      message: 'Question re-extraction started (432 posts with low-quality questions)',
      estimatedTime: '~10-15 minutes',
      estimatedCost: '$0.22',
      options: { batchSize, rateLimit }
    });

  } catch (error) {
    logger.error('[NLP ReExtract] Error:', error);
    return res.status(500).json({
      error: 'Failed to start re-extraction',
      message: error.message
    });
  }
}

/**
 * Trigger re-extraction of coding questions with leetcode_problems field
 * POST /api/content/nlp/reextract-coding
 * Body: { batchSize: 30, rateLimit: 5000 }
 */
async function triggerCodingReExtraction(req, res) {
  try {
    const { batchSize = 30, rateLimit = 5000 } = req.body;

    logger.info('[NLP CodingReExtract] Starting re-extraction of coding questions with leetcode_problems field');
    logger.info('[NLP CodingReExtract] Options:', { batchSize, rateLimit });

    // Run re-extraction in background
    reExtractCodingQuestions({ batchSize, rateLimit })
      .then(result => {
        logger.info('[NLP CodingReExtract] Complete:', result);
      })
      .catch(error => {
        logger.error('[NLP CodingReExtract] Error:', error);
      });

    return res.json({
      success: true,
      message: 'Coding question re-extraction started with leetcode_problems field',
      targetPosts: '~99 posts with coding/technical questions',
      estimatedTime: '~5 minutes',
      estimatedCost: '$0.05',
      expectedQuestions: '~100-150 clean LeetCode problem names',
      options: { batchSize, rateLimit }
    });

  } catch (error) {
    logger.error('[NLP CodingReExtract] Error:', error);
    return res.status(500).json({
      error: 'Failed to start coding re-extraction',
      message: error.message
    });
  }
}

/**
 * Trigger extraction for posts with NO questions at all
 * POST /api/content/nlp/extract-unprocessed
 * Body: { batchSize: 30, rateLimit: 5000, limit: 100 }
 */
async function triggerUnprocessedExtraction(req, res) {
  try {
    const { batchSize = 30, rateLimit = 1000, limit = null } = req.body;

    logger.info('[NLP UnprocessedExtract] Starting extraction for posts with no questions');
    logger.info('[NLP UnprocessedExtract] Options:', { batchSize, rateLimit, limit });

    // Run extraction in background
    extractFromUnprocessedPosts({ batchSize, rateLimit, limit })
      .then(result => {
        logger.info('[NLP UnprocessedExtract] Complete:', result);
      })
      .catch(error => {
        logger.error('[NLP UnprocessedExtract] Error:', error);
      });

    return res.json({
      success: true,
      message: 'Unprocessed posts extraction started',
      targetPosts: limit || '465 posts with no questions',
      estimatedTime: limit ? `~${Math.ceil(limit * 5 / 60)} minutes` : '~40 minutes',
      estimatedCost: limit ? `$${(limit * 0.0005).toFixed(2)}` : '$0.23',
      expectedQuestions: limit ? `~${limit * 2}-${limit * 4}` : '~930-1860 questions',
      options: { batchSize, rateLimit, limit }
    });

  } catch (error) {
    logger.error('[NLP UnprocessedExtract] Error:', error);
    return res.status(500).json({
      error: 'Failed to start unprocessed extraction',
      message: error.message
    });
  }
}

/**
 * Trigger comprehensive LLM extraction for ALL fields
 * POST /api/content/nlp/comprehensive-backfill
 * Body: { batchSize: 30, rateLimit: 1000, limit: 100 }
 */
async function triggerComprehensiveLLMBackfill(req, res) {
  try {
    const { batchSize = 30, rateLimit = 1000, limit = null } = req.body;

    logger.info('[ComprehensiveLLM] Starting comprehensive LLM backfill for ALL fields');
    logger.info('[ComprehensiveLLM] Options:', { batchSize, rateLimit, limit });

    // Query actual count of posts needing extraction
    const countResult = await pool.query(`
      SELECT COUNT(*) as total_posts
      FROM scraped_posts
      WHERE is_relevant = true
        AND llm_extracted_at IS NULL
    `);
    const actualCount = parseInt(countResult.rows[0].total_posts);

    // Run backfill in background
    backfillComprehensiveLLM({ batchSize, rateLimit, limit })
      .then(result => {
        logger.info('[ComprehensiveLLM] Complete:', result);
      })
      .catch(error => {
        logger.error('[ComprehensiveLLM] Error:', error);
      });

    return res.json({
      success: true,
      message: 'Comprehensive LLM backfill started - extracting ALL 13 LLM fields',
      targetPosts: limit || `${actualCount} relevant posts`,
      estimatedTime: limit ? `~${Math.ceil(limit * 1 / 60)} minutes` : `~${Math.ceil(actualCount * 1 / 60)} minutes`,
      estimatedCost: limit ? `$${(limit * 0.0005).toFixed(2)}` : `$${(actualCount * 0.0005).toFixed(2)}`,
      fieldsExtracted: [
        'sentiment_category',
        'difficulty_level',
        'timeline',
        'llm_industry',
        'preparation_materials (array)',
        'key_insights (array)',
        'llm_company (hybrid: LLM + rules)',
        'llm_role (hybrid: LLM + rules)',
        'llm_outcome (hybrid: LLM + rules)',
        'llm_experience_level',
        'llm_interview_stages (array)',
        'interview_questions (child table)',
        'interview_topics (child table)',
        'leetcode_problems (child table)'
      ],
      options: { batchSize, rateLimit, limit }
    });

  } catch (error) {
    logger.error('[ComprehensiveLLM] Error:', error);
    return res.status(500).json({
      error: 'Failed to start comprehensive LLM backfill',
      message: error.message
    });
  }
}

module.exports = {
  triggerExtraction,
  getStats,
  findSimilar,
  classifyDifficulty,
  triggerBackfill,
  triggerReExtraction,
  triggerCodingReExtraction,
  triggerUnprocessedExtraction,
  triggerComprehensiveLLMBackfill
};
