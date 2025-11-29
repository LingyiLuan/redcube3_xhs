/**
 * Benchmark Cache Controller
 *
 * API endpoints for managing benchmark cache pre-computation
 */

const benchmarkCacheService = require('../services/benchmarkCacheService');
const logger = require('../utils/logger');

/**
 * Manually trigger benchmark cache refresh
 * POST /api/content/benchmark/refresh
 */
async function refreshBenchmarkCache(req, res) {
  try {
    logger.info('[API] Manual benchmark cache refresh requested');

    const result = await benchmarkCacheService.refreshAllBenchmarkCaches();

    res.json({
      success: true,
      message: 'Benchmark cache refreshed successfully',
      ...result
    });
  } catch (error) {
    logger.error('[API] Error refreshing benchmark cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh benchmark cache',
      message: error.message
    });
  }
}

/**
 * Get benchmark cache metadata (freshness, last updated, etc.)
 * GET /api/content/benchmark/metadata
 */
async function getBenchmarkMetadata(req, res) {
  try {
    const metadata = await benchmarkCacheService.getCacheMetadata();

    res.json({
      success: true,
      metadata
    });
  } catch (error) {
    logger.error('[API] Error fetching benchmark metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmark metadata',
      message: error.message
    });
  }
}

/**
 * Get seed post markers for a batch
 * GET /api/content/benchmark/seed-markers/:batchId
 */
async function getSeedMarkers(req, res) {
  try {
    const { batchId } = req.params;

    const markers = await benchmarkCacheService.getSeedPostMarkers(batchId);

    res.json({
      success: true,
      batchId,
      markers
    });
  } catch (error) {
    logger.error('[API] Error fetching seed markers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seed markers',
      message: error.message
    });
  }
}

module.exports = {
  refreshBenchmarkCache,
  getBenchmarkMetadata,
  getSeedMarkers
};
