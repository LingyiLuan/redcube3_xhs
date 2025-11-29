/**
 * Trending Controller
 *
 * HTTP request handlers for trending and discovery features
 */

const trendingService = require('../services/trendingService');
const logger = require('../utils/logger');

/**
 * GET /api/trending/experiences
 * Get trending experiences with filters
 */
async function getTrendingExperiences(req, res) {
  try {
    const {
      limit,
      offset,
      category,
      filter,
      timeWindow
    } = req.query;

    const result = await trendingService.getTrendingExperiences({
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      category,
      filter,
      timeWindow: timeWindow || '7d'
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences,
        metadata: result.metadata
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error getting trending:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/trending/rising-stars
 * Get rising star experiences (new but highly engaging)
 */
async function getRisingStars(req, res) {
  try {
    const { limit, minEngagement } = req.query;

    const result = await trendingService.getRisingStars(
      limit ? parseInt(limit) : 10,
      minEngagement ? parseInt(minEngagement) : 10
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error getting rising stars:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/trending/most-cited
 * Get most cited experiences (academic influence)
 */
async function getMostCited(req, res) {
  try {
    const { limit, timeWindow } = req.query;

    const result = await trendingService.getMostCited({
      limit: limit ? parseInt(limit) : 20,
      timeWindow: timeWindow || 'all'
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences,
        metadata: result.metadata
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error getting most cited:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/trending/category/:category/:value
 * Get category-specific trending (e.g., /api/trending/category/company/Google)
 */
async function getCategoryTrending(req, res) {
  try {
    const { category, value } = req.params;
    const { limit } = req.query;

    const result = await trendingService.getCategoryTrending(
      category,
      value,
      limit ? parseInt(limit) : 10
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences,
        category: result.category,
        value: result.value
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error getting category trending:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/trending/update-scores
 * Manually trigger trending score update (admin/cron use)
 */
async function updateTrendingScores(req, res) {
  try {
    logger.info('[TrendingController] Manual trending score update triggered');

    const result = await trendingService.updateTrendingScores();

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Updated ${result.updated} trending scores`,
        updated: result.updated
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error updating scores:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/trending/stats
 * Get trending statistics (monitoring/debugging)
 */
async function getTrendingStats(req, res) {
  try {
    const result = await trendingService.getTrendingStats();

    if (result.success) {
      return res.status(200).json({
        success: true,
        stats: result.stats
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[TrendingController] Error getting stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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
