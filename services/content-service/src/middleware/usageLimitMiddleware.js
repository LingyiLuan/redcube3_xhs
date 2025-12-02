/**
 * Usage Limit Middleware
 *
 * Enforces tier-based rate limiting for analysis requests
 * Tracks usage in experience_analysis_history table
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

// Tier usage limits per month
const TIER_LIMITS = {
  bronze: 5,
  silver: 15,
  gold: -1,    // unlimited
  platinum: -1 // unlimited
};

/**
 * Middleware to check if user has exceeded their monthly analysis limit
 * @param {string} analysisType - Type of analysis (e.g., 'single', 'batch', 'learning_map')
 */
function checkUsageLimit(analysisType = 'analysis') {
  return async (req, res, next) => {
    try {
      // Get user ID from request (auth middleware should set this)
      const userId = req.user?.id;

      // BETA LAUNCH: All authenticated users are Founding Members with unlimited access
      // Skip reputation service check since users table is in a different database
      // TODO: Re-enable tier-based limits after beta when databases are consolidated
      if (userId) {
        logger.info(`[UsageLimitMiddleware] BETA: User ${userId} has unlimited Founding Member access`);
        req.usageInfo = {
          tier: 'founding_member',
          limit: -1,
          currentUsage: 0,
          remaining: 'unlimited'
        };
        return next();
      }

      // For unauthenticated users, allow limited anonymous access
      logger.info(`[UsageLimitMiddleware] Anonymous user - allowing request`);
      req.usageInfo = {
        tier: 'anonymous',
        limit: 3,
        currentUsage: 0,
        remaining: 3
      };
      next();

    } catch (error) {
      logger.error('[UsageLimitMiddleware] Error checking usage limit:', error);
      // Allow request to proceed on error (fail open)
      next();
    }
  };
}

/**
 * Middleware to record analysis usage after successful request
 * @param {string} analysisType - Type of analysis
 */
function recordUsage(analysisType = 'analysis') {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to intercept successful responses
    res.json = function(data) {
      // Only record usage if request was successful
      if (data.success) {
        recordAnalysisUsage(req, analysisType).catch(err => {
          logger.error('[UsageLimitMiddleware] Error recording usage:', err);
        });
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Record analysis usage in database
 */
async function recordAnalysisUsage(req, analysisType) {
  try {
    const userId = req.user?.id || 1;
    const workflowId = req.body?.workflowId || null;
    const experienceId = req.body?.experienceId || req.params?.id || null;

    await pool.query(
      `INSERT INTO experience_analysis_history
       (experience_id, analyzed_by_user_id, workflow_id, analysis_type, analyzed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [experienceId, userId, workflowId, analysisType]
    );

    logger.info(`[UsageLimitMiddleware] Recorded ${analysisType} usage for user ${userId}`);
  } catch (error) {
    logger.error('[UsageLimitMiddleware] Error recording usage:', error);
    throw error;
  }
}

/**
 * Get user's usage statistics for current month
 */
async function getUserUsageStats(userId) {
  try {
    // BETA LAUNCH: All users are Founding Members with unlimited access
    // Skip reputation service check since users table is in a different database
    // TODO: Re-enable tier-based stats after beta when databases are consolidated

    if (!userId) {
      return {
        tier: 'anonymous',
        limit: 3,
        currentUsage: 0,
        remaining: 3,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      };
    }

    return {
      tier: 'founding_member',
      limit: 'unlimited',
      currentUsage: 0,
      remaining: 'unlimited',
      resetDate: null // No reset needed for unlimited
    };
  } catch (error) {
    logger.error('[UsageLimitMiddleware] Error getting usage stats:', error);
    throw error;
  }
}

module.exports = {
  checkUsageLimit,
  recordUsage,
  getUserUsageStats,
  TIER_LIMITS
};
