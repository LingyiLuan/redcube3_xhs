/**
 * Post Analysis Controller
 * Handles API requests for post analysis features
 */

const singlePostAnalysisService = require('../services/singlePostAnalysisService');
const logger = require('../utils/logger');

/**
 * POST /api/content/posts/analyze-single
 * Analyze a single post with comprehensive benchmark comparisons
 *
 * Request body: { post_id: string }
 * Response: Comprehensive analysis with conditional sections
 */
async function analyzeSinglePost(req, res) {
  try {
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({
        success: false,
        error: 'post_id is required'
      });
    }

    logger.info(`[Single Post Analysis API] Analyzing post: ${post_id}`);

    const analysis = await singlePostAnalysisService.analyzeSinglePost(post_id);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('[Single Post Analysis API] Error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze post'
    });
  }
}

module.exports = {
  analyzeSinglePost
};
