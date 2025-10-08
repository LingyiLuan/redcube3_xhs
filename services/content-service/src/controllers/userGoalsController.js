const analysisDataService = require('../services/analysisDataService');

/**
 * User Goals Controller
 * Handles user goals and analysis data requests
 */

/**
 * Get user goals
 * GET /api/content/user-goals?userId=123
 */
async function getUserGoals(req, res) {
  try {
    // Get user ID from authenticated session (added by requireAuth middleware)
    const userId = req.user.id;

    const userGoals = await analysisDataService.getUserGoals(userId);

    res.json({
      success: true,
      data: userGoals
    });

  } catch (error) {
    console.error('Error getting user goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user goals'
    });
  }
}

/**
 * Get user's analysis IDs for learning map generation
 * GET /api/content/user-analyses?userId=123
 */
async function getUserAnalysisIds(req, res) {
  try {
    // Get user ID from authenticated session (added by requireAuth middleware)
    const userId = req.user.id;

    // First try to get user-specific analyses
    let userSpecificAnalyses = await analysisDataService.fetchUserSpecificAnalyses(userId, 20);

    let analysisData;
    if (userSpecificAnalyses.length > 0) {
      // User has their own analysis data
      analysisData = userSpecificAnalyses;
      console.log(`Found ${userSpecificAnalyses.length} user-specific analyses for user ${userId}`);
    } else {
      // No user-specific data, fall back to all recent analyses for demo/testing
      console.log(`No user-specific analyses for user ${userId}, using shared analysis data`);
      const recentAnalyses = await analysisDataService.fetchRecentAnalyses(20);
      analysisData = recentAnalyses;
    }

    const analysisIds = analysisData.map(analysis => analysis.id);

    res.json({
      success: true,
      data: {
        analysisIds,
        totalCount: analysisIds.length,
        isUserSpecific: userSpecificAnalyses.length > 0,
        analyses: analysisData.map(analysis => ({
          id: analysis.id,
          company: JSON.parse(analysis.analysis_result).company_name,
          role: JSON.parse(analysis.analysis_result).position_title,
          created_at: analysis.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error getting user analysis IDs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user analysis IDs'
    });
  }
}

module.exports = {
  getUserGoals,
  getUserAnalysisIds
};