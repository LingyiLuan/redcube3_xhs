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
      const userId = req.user?.id || 1; // Default to user 1 for now

      // Get user's tier from reputation service
      const reputationService = require('../services/reputationService');
      const userReputation = await reputationService.getUserReputation(userId);

      if (!userReputation.success) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const userTier = userReputation.user.tier || 'bronze';
      const tierLimit = TIER_LIMITS[userTier.toLowerCase()];

      // If tier has unlimited usage, allow request
      if (tierLimit === -1) {
        logger.info(`[UsageLimitMiddleware] User ${userId} (${userTier}) has unlimited access`);
        return next();
      }

      // Check current month's usage
      const usageResult = await pool.query(
        `SELECT COUNT(*) as usage_count
         FROM experience_analysis_history
         WHERE analyzed_by_user_id = $1
           AND DATE_TRUNC('month', analyzed_at) = DATE_TRUNC('month', NOW())`,
        [userId]
      );

      const currentUsage = parseInt(usageResult.rows[0].usage_count);

      logger.info(`[UsageLimitMiddleware] User ${userId} (${userTier}): ${currentUsage}/${tierLimit} analyses this month`);

      // Check if user has exceeded limit
      if (currentUsage >= tierLimit) {
        return res.status(429).json({
          success: false,
          error: 'Monthly analysis limit reached',
          limit: tierLimit,
          currentUsage: currentUsage,
          tier: userTier,
          message: `You've reached your ${userTier} tier limit of ${tierLimit} analyses per month. Upgrade to Silver (15/month) or Gold (unlimited) to continue.`
        });
      }

      // Allow request to proceed
      req.usageInfo = {
        tier: userTier,
        limit: tierLimit,
        currentUsage: currentUsage,
        remaining: tierLimit - currentUsage
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
    // Get user's tier from reputation service
    const reputationService = require('../services/reputationService');
    const userReputation = await reputationService.getUserReputation(userId);

    if (!userReputation.success) {
      return null;
    }

    const tier = userReputation.user.tier || 'bronze';

    // Get current month's usage count
    const usageResult = await pool.query(
      `SELECT COUNT(*) as current_usage
       FROM experience_analysis_history
       WHERE analyzed_by_user_id = $1
         AND DATE_TRUNC('month', analyzed_at) = DATE_TRUNC('month', NOW())`,
      [userId]
    );

    const currentUsage = parseInt(usageResult.rows[0].current_usage);
    const limit = TIER_LIMITS[tier.toLowerCase()];

    return {
      tier,
      limit: limit === -1 ? 'unlimited' : limit,
      currentUsage,
      remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - currentUsage),
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
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
