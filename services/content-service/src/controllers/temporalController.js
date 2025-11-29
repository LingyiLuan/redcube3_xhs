/**
 * Temporal Intelligence Controller
 * Phase 1: Interview date population and temporal statistics
 */

const {
  populateInterviewDates,
  getExtractionStats,
  getTemporalDistribution
} = require('../services/interviewDateExtractionService');
const logger = require('../utils/logger');

/**
 * POST /api/content/temporal/populate-dates
 * Populate interview_date and post_year_quarter from created_at
 */
async function populateDates(req, res) {
  try {
    logger.info('[Temporal Controller] Starting date population');

    const result = await populateInterviewDates();

    logger.info(`[Temporal Controller] Completed: ${result.updated} posts updated`);

    res.json({
      success: true,
      message: `Successfully populated dates for ${result.updated} posts`,
      data: result
    });

  } catch (error) {
    logger.error('[Temporal Controller] Error populating dates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to populate interview dates',
      message: error.message
    });
  }
}

/**
 * GET /api/content/temporal/stats
 * Get temporal coverage statistics
 */
async function getStats(req, res) {
  try {
    const stats = await getExtractionStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('[Temporal Controller] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get temporal statistics',
      message: error.message
    });
  }
}

/**
 * GET /api/content/temporal/distribution
 * Get post distribution by time period
 */
async function getDistribution(req, res) {
  try {
    const distribution = await getTemporalDistribution();

    res.json({
      success: true,
      data: {
        periods: distribution,
        total_periods: distribution.length
      }
    });

  } catch (error) {
    logger.error('[Temporal Controller] Error getting distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get temporal distribution',
      message: error.message
    });
  }
}

module.exports = {
  populateDates,
  getStats,
  getDistribution
};
