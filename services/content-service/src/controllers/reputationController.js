/**
 * Reputation Controller
 *
 * HTTP request handlers for reputation and gamification endpoints
 */

const reputationService = require('../services/reputationService');
const { getUserUsageStats } = require('../middleware/usageLimitMiddleware');
const logger = require('../utils/logger');

/**
 * GET /api/reputation/profile/:userId
 * Get user reputation profile with stats and tier info
 */
async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    const result = await reputationService.getUserReputation(parseInt(userId));

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.user
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[ReputationController] Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/reputation/history/:userId
 * Get user reputation history (audit log of point changes)
 */
async function getReputationHistory(req, res) {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;

    const result = await reputationService.getReputationHistory(
      parseInt(userId),
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.history,
        metadata: result.metadata
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[ReputationController] Error getting reputation history:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/reputation/leaderboard
 * Get top users by reputation points
 */
async function getLeaderboard(req, res) {
  try {
    const { limit } = req.query;

    const result = await reputationService.getLeaderboard(
      limit ? parseInt(limit) : 50
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.leaderboard
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[ReputationController] Error getting leaderboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/reputation/award
 * Award points to a user (internal/admin use)
 *
 * Body:
 * {
 *   "userId": 1,
 *   "pointsDelta": 10,
 *   "reason": "Shared interview experience",
 *   "relatedEntityType": "experience",
 *   "relatedEntityId": 123,
 *   "metadata": { ... }
 * }
 */
async function awardPoints(req, res) {
  try {
    const {
      userId,
      pointsDelta,
      reason,
      relatedEntityType,
      relatedEntityId,
      metadata
    } = req.body;

    // Validation
    if (!userId || pointsDelta === undefined || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, pointsDelta, reason'
      });
    }

    const result = await reputationService.awardPoints(
      parseInt(userId),
      parseInt(pointsDelta),
      reason,
      relatedEntityType || null,
      relatedEntityId || null,
      metadata || null
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          historyEntry: result.historyEntry
        },
        message: `Awarded ${pointsDelta} points to user ${userId}`
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[ReputationController] Error awarding points:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/reputation/check-limit/:userId
 * Check if user can perform an action based on tier limits
 */
async function checkUsageLimit(req, res) {
  try {
    const { userId } = req.params;
    const { action } = req.query;

    const result = await reputationService.checkUsageLimit(
      parseInt(userId),
      action || 'analysis'
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[ReputationController] Error checking usage limit:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/reputation/tiers
 * Get tier information (thresholds, limits, etc.)
 */
async function getTierInfo(req, res) {
  try {
    const { TIER_THRESHOLDS } = reputationService;

    const tiers = Object.keys(TIER_THRESHOLDS).map(tierKey => ({
      name: tierKey.toLowerCase(),
      minPoints: TIER_THRESHOLDS[tierKey].min,
      maxPoints: TIER_THRESHOLDS[tierKey].max === Infinity ? null : TIER_THRESHOLDS[tierKey].max,
      analysisLimit: TIER_THRESHOLDS[tierKey].analysisLimit,
      unlimited: TIER_THRESHOLDS[tierKey].analysisLimit === -1
    }));

    return res.status(200).json({
      success: true,
      data: {
        tiers,
        pointValues: reputationService.POINT_VALUES
      }
    });

  } catch (error) {
    logger.error('[ReputationController] Error getting tier info:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/reputation/usage/:userId
 * Get user's monthly usage statistics
 */
async function getUsageStats(req, res) {
  try {
    const { userId } = req.params;

    const stats = await getUserUsageStats(parseInt(userId));

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('[ReputationController] Error getting usage stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  getUserProfile,
  getReputationHistory,
  getLeaderboard,
  awardPoints,
  checkUsageLimit,
  getTierInfo,
  getUsageStats
};
