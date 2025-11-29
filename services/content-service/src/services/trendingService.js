/**
 * Trending Service
 *
 * Implements trending algorithm and discovery features for interview experiences
 * Uses database-calculated trending scores and provides various discovery methods
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
 * Get trending experiences using algorithmic ranking
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.offset - Pagination offset
 * @param {string} options.category - Filter category ('company', 'role', or null)
 * @param {string} options.filter - Filter value for category
 * @param {string} options.timeWindow - Time window ('24h', '7d', '30d', 'all')
 * @returns {Promise<Object>} Trending experiences with metadata
 */
async function getTrendingExperiences(options = {}) {
  const {
    limit = 20,
    offset = 0,
    category = null,
    filter = null,
    timeWindow = '7d'
  } = options;

  try {
    // Build time filter
    let timeFilter = '';
    if (timeWindow !== 'all') {
      const intervals = {
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days'
      };

      if (intervals[timeWindow]) {
        timeFilter = `AND created_at >= NOW() - INTERVAL '${intervals[timeWindow]}'`;
      }
    }

    // Build category filter
    let categoryFilter = '';
    const params = [limit, offset];

    if (category && filter) {
      // Validate category to prevent SQL injection
      if (['company', 'role', 'outcome'].includes(category)) {
        categoryFilter = `AND ${category} = $3`;
        params.push(filter);
      }
    }

    // Query with calculated trending score
    const query = `
      SELECT
        ie.*,
        calculate_trending_score(
          ie.upvotes,
          ie.downvotes,
          ie.views,
          ie.citation_count,
          ie.analysis_usage_count,
          ie.created_at,
          ie.verified
        ) as calculated_trending_score
      FROM interview_experiences ie
      WHERE ie.deleted_at IS NULL
        ${timeFilter}
        ${categoryFilter}
      ORDER BY calculated_trending_score DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, params);

    logger.info(`[TrendingService] Fetched ${result.rows.length} trending experiences (timeWindow: ${timeWindow}, category: ${category || 'all'})`);

    return {
      success: true,
      experiences: result.rows,
      metadata: {
        timeWindow,
        category,
        filter,
        count: result.rows.length,
        limit,
        offset
      }
    };

  } catch (error) {
    logger.error('[TrendingService] Error getting trending experiences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get rising star experiences (new but highly engaging)
 * Focuses on recently created experiences with good engagement
 *
 * @param {number} limit - Maximum number of results
 * @param {number} minEngagement - Minimum engagement threshold
 * @returns {Promise<Object>} Rising star experiences
 */
async function getRisingStars(limit = 10, minEngagement = 10) {
  try {
    const query = `
      SELECT
        ie.*,
        calculate_trending_score(
          ie.upvotes,
          ie.downvotes,
          ie.views,
          ie.citation_count,
          ie.analysis_usage_count,
          ie.created_at,
          ie.verified
        ) as calculated_trending_score,
        (ie.upvotes + ie.views + ie.citation_count) as total_engagement
      FROM interview_experiences ie
      WHERE ie.deleted_at IS NULL
        AND ie.created_at >= NOW() - INTERVAL '7 days'
        AND (ie.upvotes + ie.views + ie.citation_count) >= $2
      ORDER BY calculated_trending_score DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit, minEngagement]);

    logger.info(`[TrendingService] Fetched ${result.rows.length} rising star experiences`);

    return {
      success: true,
      experiences: result.rows
    };

  } catch (error) {
    logger.error('[TrendingService] Error getting rising stars:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get most cited experiences (academic influence)
 * Ranks by analysis_usage_count (citation count)
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results
 * @param {string} options.timeWindow - Time window for recent citations ('7d', '30d', 'all')
 * @returns {Promise<Object>} Most cited experiences
 */
async function getMostCited(options = {}) {
  const {
    limit = 20,
    timeWindow = 'all'
  } = options;

  try {
    // Build time filter for recent citations
    let timeFilter = '';
    if (timeWindow !== 'all') {
      const intervals = {
        '7d': '7 days',
        '30d': '30 days'
      };

      if (intervals[timeWindow]) {
        // Filter by last_analyzed_at for recent citations
        timeFilter = `AND last_analyzed_at >= NOW() - INTERVAL '${intervals[timeWindow]}'`;
      }
    }

    const query = `
      SELECT
        ie.*,
        ie.analysis_usage_count as total_citations
      FROM interview_experiences ie
      WHERE ie.deleted_at IS NULL
        AND ie.analysis_usage_count > 0
        ${timeFilter}
      ORDER BY ie.analysis_usage_count DESC, ie.last_analyzed_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    logger.info(`[TrendingService] Fetched ${result.rows.length} most cited experiences (timeWindow: ${timeWindow})`);

    return {
      success: true,
      experiences: result.rows,
      metadata: {
        timeWindow,
        count: result.rows.length
      }
    };

  } catch (error) {
    logger.error('[TrendingService] Error getting most cited:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get category-specific trending (by company or role)
 *
 * @param {string} category - Category name ('company' or 'role')
 * @param {string} value - Category value to filter by
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Object>} Category-specific trending experiences
 */
async function getCategoryTrending(category, value, limit = 10) {
  try {
    // Validate category to prevent SQL injection
    if (!['company', 'role', 'outcome'].includes(category)) {
      throw new Error('Invalid category. Must be "company", "role", or "outcome"');
    }

    const query = `
      SELECT
        ie.*,
        calculate_trending_score(
          ie.upvotes,
          ie.downvotes,
          ie.views,
          ie.citation_count,
          ie.analysis_usage_count,
          ie.created_at,
          ie.verified
        ) as calculated_trending_score
      FROM interview_experiences ie
      WHERE ie.deleted_at IS NULL
        AND ie.${category} = $1
      ORDER BY calculated_trending_score DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [value, limit]);

    logger.info(`[TrendingService] Fetched ${result.rows.length} trending experiences for ${category}: ${value}`);

    return {
      success: true,
      category,
      value,
      experiences: result.rows
    };

  } catch (error) {
    logger.error('[TrendingService] Error getting category trending:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update trending scores for all experiences
 * Should be run periodically (e.g., hourly) to keep scores fresh
 *
 * @returns {Promise<Object>} Update result with count of updated records
 */
async function updateTrendingScores() {
  try {
    logger.info('[TrendingService] Starting trending score update...');

    // Update all non-deleted experiences
    const query = `
      UPDATE interview_experiences
      SET
        trending_score = calculate_trending_score(
          upvotes,
          downvotes,
          views,
          citation_count,
          analysis_usage_count,
          created_at,
          verified
        ),
        trending_score_updated_at = NOW()
      WHERE deleted_at IS NULL
    `;

    const result = await pool.query(query);

    logger.info(`[TrendingService] Updated ${result.rowCount} trending scores`);

    // Refresh materialized view for fast queries
    await pool.query('SELECT refresh_trending_experiences()');

    logger.info('[TrendingService] Refreshed trending_experiences materialized view');

    return {
      success: true,
      updated: result.rowCount
    };

  } catch (error) {
    logger.error('[TrendingService] Error updating trending scores:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get trending statistics (for monitoring/debugging)
 *
 * @returns {Promise<Object>} Trending statistics
 */
async function getTrendingStats() {
  try {
    const query = `
      SELECT
        COUNT(*) as total_experiences,
        COUNT(*) FILTER (WHERE trending_score > 0) as experiences_with_score,
        AVG(trending_score) as avg_trending_score,
        MAX(trending_score) as max_trending_score,
        MIN(trending_score) as min_trending_score,
        MAX(trending_score_updated_at) as last_update
      FROM interview_experiences
      WHERE deleted_at IS NULL
    `;

    const result = await pool.query(query);

    return {
      success: true,
      stats: result.rows[0]
    };

  } catch (error) {
    logger.error('[TrendingService] Error getting trending stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getTrendingExperiences,
  getRisingStars,
  getMostCited,
  getCategoryTrending,
  updateTrendingScores,
  getTrendingStats
};
