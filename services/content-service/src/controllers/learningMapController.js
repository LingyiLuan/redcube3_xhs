const learningMapService = require('../services/learningMapService');
const learningMapsQueries = require('../database/learningMapsQueries');

/**
 * Learning Map Controller
 * Handles AI-generated learning pathway requests
 */

/**
 * Generate a personalized learning map
 * POST /api/content/learning-map
 */
async function generateLearningMap(req, res) {
  try {
    const { analysisIds, userGoals, userId, isCrazyPlan = false } = req.body;

    // Validate request
    if (!analysisIds || !Array.isArray(analysisIds)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'analysisIds must be an array'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    console.log('Generating learning map for user:', userId, 'analysis IDs:', analysisIds, 'CrazyPlan:', isCrazyPlan);

    // Generate learning map with enhanced personalization
    const learningMap = await learningMapService.generateLearningMap(analysisIds, userGoals, userId, isCrazyPlan);

    // Save to database
    const savedMap = await learningMapsQueries.saveLearningMap({
      user_id: userId,
      title: learningMap.title,
      summary: learningMap.summary,
      difficulty: learningMap.difficulty,
      timeline_weeks: learningMap.timeline_weeks,
      is_crazy_plan: isCrazyPlan,
      milestones: learningMap.milestones || [],
      outcomes: learningMap.outcomes || [],
      next_steps: learningMap.next_steps || [],
      analysis_count: learningMap.analysis_count,
      analysis_ids: analysisIds,
      user_goals: userGoals || {},
      personalization_score: learningMap.personalization_score || 0
    });

    // Return the generated map with DB ID
    const responseData = {
      ...learningMap,
      id: savedMap.id,
      created_at: savedMap.created_at
    };

    res.json({
      success: true,
      data: responseData,
      message: 'Learning map generated and saved successfully'
    });

  } catch (error) {
    console.error('Error generating learning map:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate learning map'
    });
  }
}

/**
 * Get personalized learning recommendations
 * GET /api/content/learning-recommendations
 */
async function getLearningRecommendations(req, res) {
  try {
    const { userProfile } = req.query;

    console.log('Getting learning recommendations for user profile');

    // Get recommendations
    const recommendations = await learningMapService.getPersonalizedRecommendations(userProfile);

    res.json({
      success: true,
      data: recommendations,
      message: 'Learning recommendations retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting learning recommendations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get learning recommendations'
    });
  }
}

/**
 * Update learning progress
 * PUT /api/content/learning-map/:mapId/progress
 */
async function updateLearningProgress(req, res) {
  try {
    const { mapId } = req.params;
    const progressData = req.body;

    console.log('Updating learning progress for map:', mapId);

    // Update progress
    const updatedProgress = await learningMapService.updateProgress(mapId, progressData);

    res.json({
      success: true,
      data: updatedProgress,
      message: 'Learning progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating learning progress:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update learning progress'
    });
  }
}

/**
 * Get learning map by ID
 * GET /api/content/learning-map/:mapId
 */
async function getLearningMap(req, res) {
  try {
    const { mapId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    console.log('Getting learning map:', mapId, 'for user:', userId);

    const learningMap = await learningMapsQueries.getLearningMapById(mapId, userId);

    if (!learningMap) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Learning map not found'
      });
    }

    res.json({
      success: true,
      data: learningMap,
      message: 'Learning map retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting learning map:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get learning map'
    });
  }
}

/**
 * Get all learning maps for a user
 * GET /api/content/learning-maps/history
 */
async function getLearningMapsHistory(req, res) {
  try {
    const { userId, status, isCrazyPlan, limit, offset } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    console.log('Getting learning maps history for user:', userId);

    const options = {
      status,
      is_crazy_plan: isCrazyPlan === 'true' ? true : isCrazyPlan === 'false' ? false : null,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };

    const maps = await learningMapsQueries.getUserLearningMaps(userId, options);
    const totalCount = await learningMapsQueries.getUserLearningMapsCount(userId, status);

    res.json({
      success: true,
      data: {
        maps,
        totalCount,
        limit: options.limit,
        offset: options.offset
      },
      message: 'Learning maps history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting learning maps history:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get learning maps history'
    });
  }
}

/**
 * Update learning map progress
 * PUT /api/content/learning-map/:mapId/progress
 */
async function updateMapProgress(req, res) {
  try {
    const { mapId } = req.params;
    const { userId, progress } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Progress must be between 0 and 100'
      });
    }

    console.log('Updating progress for map:', mapId, 'user:', userId, 'progress:', progress);

    const updatedMap = await learningMapsQueries.updateLearningMapProgress(mapId, userId, progress);

    if (!updatedMap) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Learning map not found'
      });
    }

    res.json({
      success: true,
      data: updatedMap,
      message: 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating map progress:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update progress'
    });
  }
}

/**
 * Update learning map status
 * PUT /api/content/learning-map/:mapId/status
 */
async function updateMapStatus(req, res) {
  try {
    const { mapId } = req.params;
    const { userId, status } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    console.log('Updating status for map:', mapId, 'user:', userId, 'status:', status);

    const updatedMap = await learningMapsQueries.updateLearningMapStatus(mapId, userId, status);

    if (!updatedMap) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Learning map not found'
      });
    }

    res.json({
      success: true,
      data: updatedMap,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Error updating map status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update status'
    });
  }
}

/**
 * Delete a learning map
 * DELETE /api/content/learning-map/:mapId
 */
async function deleteMap(req, res) {
  try {
    const { mapId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    console.log('Deleting map:', mapId, 'for user:', userId);

    const deleted = await learningMapsQueries.deleteLearningMap(mapId, userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Learning map not found'
      });
    }

    res.json({
      success: true,
      message: 'Learning map deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting map:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete learning map'
    });
  }
}

module.exports = {
  generateLearningMap,
  getLearningRecommendations,
  updateLearningProgress,
  getLearningMap,
  getLearningMapsHistory,
  updateMapProgress,
  updateMapStatus,
  deleteMap
};