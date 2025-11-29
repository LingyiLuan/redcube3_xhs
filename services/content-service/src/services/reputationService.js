/**
 * Reputation Service
 *
 * Manages user reputation points, tier calculations, and gamification logic
 * Implements the point system and tier progression for Interview Intel platform
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

/**
 * Point values for various actions
 * Based on Phase 3 gamification design
 */
const POINT_VALUES = {
  SHARE_EXPERIENCE: 10,
  RECEIVE_UPVOTE: 5,
  EXPERIENCE_ANALYZED: 10,
  SPECIFIC_QUESTIONS_BONUS: 5, // When adding 3+ specific questions
  PREPARATION_TIPS_BONUS: 5,   // When adding 200+ char preparation tips
  COMPLETE_PROFILE: 20,
  VERIFY_LINKEDIN: 30,
  GIVE_UPVOTE: 1
};

/**
 * Tier thresholds
 */
const TIER_THRESHOLDS = {
  BRONZE: { min: 0, max: 49, analysisLimit: 5 },
  SILVER: { min: 50, max: 199, analysisLimit: 15 },
  GOLD: { min: 200, max: 499, analysisLimit: -1 }, // Unlimited
  PLATINUM: { min: 500, max: Infinity, analysisLimit: -1 } // Unlimited
};

/**
 * Award points to a user for a specific action
 *
 * @param {number} userId - User ID
 * @param {number} pointsDelta - Points to award (can be negative)
 * @param {string} reason - Human-readable reason for point change
 * @param {string} relatedEntityType - Type of entity ('experience', 'upvote', 'citation', etc.)
 * @param {number} relatedEntityId - ID of related entity
 * @param {Object} metadata - Additional context
 * @returns {Promise<Object>} Result with updated user reputation
 */
async function awardPoints(userId, pointsDelta, reason, relatedEntityType = null, relatedEntityId = null, metadata = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update user's reputation points
    const updateUserQuery = `
      UPDATE users
      SET reputation_points = reputation_points + $1
      WHERE id = $2
      RETURNING id, reputation_points, tier
    `;

    const userResult = await client.query(updateUserQuery, [pointsDelta, userId]);

    if (userResult.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const user = userResult.rows[0];

    // Record in reputation history
    const historyQuery = `
      INSERT INTO reputation_history (
        user_id, points_delta, reason, related_entity_type, related_entity_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;

    const historyResult = await client.query(historyQuery, [
      userId,
      pointsDelta,
      reason,
      relatedEntityType,
      relatedEntityId,
      metadata ? JSON.stringify(metadata) : null
    ]);

    await client.query('COMMIT');

    logger.info(`[ReputationService] Awarded ${pointsDelta} points to user ${userId}: ${reason}`);

    return {
      success: true,
      user: {
        id: user.id,
        reputationPoints: user.reputation_points,
        tier: user.tier
      },
      historyEntry: historyResult.rows[0]
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[ReputationService] Error awarding points:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
}

/**
 * Get user reputation profile
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User reputation data with stats
 */
async function getUserReputation(userId) {
  try {
    const query = `
      SELECT
        u.id,
        u.email,
        u.reputation_points,
        u.tier,
        u.verified_at,
        u.linkedin_verified,
        u.profile_completed,
        u.created_at as user_since,
        COUNT(DISTINCT ie.id) as experiences_shared,
        COALESCE(SUM(ie.upvotes), 0) as total_upvotes_received,
        COALESCE(SUM(ie.analysis_usage_count), 0) as total_citations_received
      FROM users u
      LEFT JOIN interview_experiences ie ON ie.user_id = u.id AND ie.deleted_at IS NULL
      WHERE u.id = $1
      GROUP BY u.id
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = result.rows[0];

    // Get tier info
    const tierInfo = getTierInfo(user.tier);

    // Calculate progress to next tier
    const nextTier = getNextTier(user.tier);
    const progressPercentage = nextTier
      ? ((user.reputation_points - tierInfo.min) / (nextTier.min - tierInfo.min)) * 100
      : 100;

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        reputationPoints: parseInt(user.reputation_points),
        tier: user.tier,
        tierInfo: {
          name: user.tier,
          min: tierInfo.min,
          max: tierInfo.max,
          analysisLimit: tierInfo.analysisLimit,
          nextTier: nextTier ? nextTier.name : null,
          pointsToNextTier: nextTier ? nextTier.min - user.reputation_points : 0,
          progressPercentage: Math.round(progressPercentage)
        },
        verificationStatus: {
          emailVerified: !!user.verified_at,
          linkedinVerified: user.linkedin_verified,
          profileCompleted: user.profile_completed
        },
        stats: {
          experiencesShared: parseInt(user.experiences_shared),
          totalUpvotesReceived: parseInt(user.total_upvotes_received),
          totalCitationsReceived: parseInt(user.total_citations_received),
          memberSince: user.user_since
        }
      }
    };

  } catch (error) {
    logger.error('[ReputationService] Error getting user reputation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user reputation history
 *
 * @param {number} userId - User ID
 * @param {number} limit - Max records to return
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} Reputation history entries
 */
async function getReputationHistory(userId, limit = 50, offset = 0) {
  try {
    const query = `
      SELECT
        id,
        points_delta,
        reason,
        related_entity_type,
        related_entity_id,
        metadata,
        created_at
      FROM reputation_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reputation_history
      WHERE user_id = $1
    `;
    const countResult = await pool.query(countQuery, [userId]);

    return {
      success: true,
      history: result.rows.map(row => ({
        id: row.id,
        pointsDelta: row.points_delta,
        reason: row.reason,
        relatedEntityType: row.related_entity_type,
        relatedEntityId: row.related_entity_id,
        metadata: row.metadata,
        createdAt: row.created_at
      })),
      metadata: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      }
    };

  } catch (error) {
    logger.error('[ReputationService] Error getting reputation history:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get leaderboard
 *
 * @param {number} limit - Number of top users to return
 * @returns {Promise<Object>} Top users by reputation
 */
async function getLeaderboard(limit = 50) {
  try {
    const query = `
      SELECT * FROM reputation_leaderboard
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return {
      success: true,
      leaderboard: result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        email: row.email,
        reputationPoints: parseInt(row.reputation_points),
        tier: row.tier,
        experiencesShared: parseInt(row.experiences_shared),
        totalUpvotesReceived: parseInt(row.total_upvotes_received),
        totalCitationsReceived: parseInt(row.total_citations_received),
        memberSince: row.user_since
      }))
    };

  } catch (error) {
    logger.error('[ReputationService] Error getting leaderboard:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user can perform an action based on tier limits
 *
 * @param {number} userId - User ID
 * @param {string} action - Action type (e.g., 'analysis')
 * @returns {Promise<Object>} Permission status
 */
async function checkUsageLimit(userId, action = 'analysis') {
  try {
    // Get user tier
    const userQuery = `
      SELECT tier, reputation_points
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = userResult.rows[0];
    const tierInfo = getTierInfo(user.tier);

    // If unlimited, allow
    if (tierInfo.analysisLimit === -1) {
      return {
        success: true,
        allowed: true,
        unlimited: true,
        tier: user.tier
      };
    }

    // Count usage this month for the action
    const usageQuery = `
      SELECT COUNT(*) as usage_count
      FROM analysis_history
      WHERE user_id = $1
        AND created_at >= DATE_TRUNC('month', NOW())
    `;
    const usageResult = await pool.query(usageQuery, [userId]);
    const usageCount = parseInt(usageResult.rows[0].usage_count);

    const allowed = usageCount < tierInfo.analysisLimit;

    return {
      success: true,
      allowed,
      unlimited: false,
      tier: user.tier,
      limit: tierInfo.analysisLimit,
      used: usageCount,
      remaining: Math.max(0, tierInfo.analysisLimit - usageCount)
    };

  } catch (error) {
    logger.error('[ReputationService] Error checking usage limit:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper: Get tier info by tier name
 */
function getTierInfo(tierName) {
  const tier = tierName.toUpperCase();
  return {
    name: tierName,
    min: TIER_THRESHOLDS[tier].min,
    max: TIER_THRESHOLDS[tier].max,
    analysisLimit: TIER_THRESHOLDS[tier].analysisLimit
  };
}

/**
 * Helper: Get next tier info
 */
function getNextTier(currentTier) {
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier.toLowerCase());

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null; // Already at max tier
  }

  const nextTierName = tiers[currentIndex + 1];
  return getTierInfo(nextTierName);
}

module.exports = {
  awardPoints,
  getUserReputation,
  getReputationHistory,
  getLeaderboard,
  checkUsageLimit,
  POINT_VALUES,
  TIER_THRESHOLDS
};
