// ✅ NEW: Using enhanced learning map generator only
const learningMapGeneratorService = require('../services/learningMapGeneratorService');
const learningMapEnhancementsService = require('../services/learningMapEnhancementsService');
const resourceExtractionService = require('../services/resourceExtractionService');
const learningMapsQueries = require('../database/learningMapsQueries');
const logger = require('../utils/logger');

/**
 * Learning Map Controller
 * Handles AI-generated learning pathway requests
 */

/**
 * Generate a personalized learning map
 * POST /api/content/learning-map
 *
 * NEW: Supports reportId parameter for generating from comprehensive analysis report
 * LEGACY: Still supports analysisIds for backward compatibility
 */
async function generateLearningMap(req, res) {
  try {
    const {
      reportId,           // NEW: Batch report ID (e.g., "batch_1_abc123")
      analysisIds,        // LEGACY: Analysis IDs array
      userGoals,
      userId,
      isCrazyPlan = false,
      useRAG = false
    } = req.body;

    // Validate request
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'userId is required'
      });
    }

    // NEW PATH: Generate from comprehensive analysis report (reportId)
    if (reportId) {
      logger.info(`[Learning Map] Generating from report: ${reportId} for user: ${userId}`);

      try {
        // ===== STEP 0: Log the cached report data to understand what we're working with =====
        const { getCachedBatchData } = require('./analysisController');
        const cachedData = await getCachedBatchData(reportId);

        logger.info(`[Learning Map Controller] 🔍 Checking cached report data for: ${reportId}`);
        if (!cachedData) {
          logger.error(`[Learning Map Controller] ❌ No cached data found for reportId: ${reportId}`);
        } else {
          logger.info(`[Learning Map Controller] ✅ Cached data exists`);
          const patterns = cachedData.patternAnalysis;
          if (patterns) {
            logger.info(`[Learning Map Controller] 📊 Pattern Analysis Data:`);
            logger.info(`  - source_posts count: ${patterns.source_posts?.length || 0}`);
            logger.info(`  - individual_analyses count: ${patterns.individual_analyses?.length || 0}`);
            logger.info(`  - seed_companies: ${JSON.stringify(patterns.seed_companies || [])}`);
            logger.info(`  - skill_frequency keys: ${patterns.skill_frequency ? Object.keys(patterns.skill_frequency).length : 0}`);
            if (patterns.individual_analyses) {
              logger.info(`  - First analysis sample: ${JSON.stringify(patterns.individual_analyses[0]?.post_url || 'NO POST URL')}`);
            }
          } else {
            logger.error(`[Learning Map Controller] ❌ Pattern analysis is missing in cached data`);
          }
        }

        // Step 1: Generate base learning map
        const baseLearningMap = await learningMapGeneratorService.generateLearningMapFromReport(
          reportId,
          { ...userGoals, userId }
        );

        // DEBUG: Check what fields baseLearningMap has
        logger.info(`[Learning Map Controller] 🔍 baseLearningMap fields check:`);
        logger.info(`  - common_pitfalls: ${baseLearningMap.common_pitfalls ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - readiness_checklist: ${baseLearningMap.readiness_checklist ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - success_factors length: ${baseLearningMap.success_factors?.length || 0}`);
        logger.info(`  - database_resources length: ${baseLearningMap.database_resources?.length || 0}`);
        logger.info(`  - timeline_statistics: ${baseLearningMap.timeline_statistics ? 'EXISTS' : 'NULL/MISSING'}`);

        // Step 2: Fetch patterns from the report for enhancement
        const patterns = cachedData ? cachedData.patternAnalysis : null;

        // Step 3: Apply enhancements (company tracks, daily plans, resources)
        const learningMap = patterns
          ? await learningMapEnhancementsService.enhanceLearningMap(
              baseLearningMap,
              patterns,
              userGoals?.targetCompany || null
            )
          : baseLearningMap;

        // DEBUG: Check what fields learningMap has after enhancement
        logger.info(`[Learning Map Controller] 🔍 After enhancement fields check:`);
        logger.info(`  - common_pitfalls: ${learningMap.common_pitfalls ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - readiness_checklist: ${learningMap.readiness_checklist ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - success_factors length: ${learningMap.success_factors?.length || 0}`);
        logger.info(`  - database_resources length: ${learningMap.database_resources?.length || 0}`);
        logger.info(`  - timeline_statistics: ${learningMap.timeline_statistics ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - pitfalls_narrative: ${learningMap.pitfalls_narrative ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - improvement_areas: ${learningMap.improvement_areas ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - resource_recommendations: ${learningMap.resource_recommendations ? 'EXISTS' : 'NULL/MISSING'}`);
        logger.info(`  - preparation_expectations: ${learningMap.preparation_expectations ? 'EXISTS' : 'NULL/MISSING'}`);


        logger.info(`[Learning Map] Enhancement applied: ${learningMap.enhancement_version || '1.0'}`);

        // ===== COMPREHENSIVE LOGGING: Trace generated learning map data =====
        logger.info(`[Learning Map Controller] 📊 Generated map structure check:`);
        logger.info(`  - Title: ${learningMap.title}`);
        logger.info(`  - Foundation: ${JSON.stringify(learningMap.foundation)}`);
        logger.info(`  - Timeline: ${learningMap.timeline ? learningMap.timeline.total_weeks + ' weeks' : 'MISSING'}`);
        logger.info(`  - Milestones count: ${learningMap.milestones?.length || 0}`);
        logger.info(`  - Company tracks count: ${learningMap.company_tracks?.length || 0}`);
        logger.info(`  - Analytics: ${learningMap.analytics ? JSON.stringify(Object.keys(learningMap.analytics)) : 'MISSING'}`);
        logger.info(`  - Expected outcomes: ${learningMap.expected_outcomes ? JSON.stringify(Object.keys(learningMap.expected_outcomes)) : 'MISSING'}`);

        // Save to database
        const savedMap = await learningMapsQueries.saveLearningMap({
          user_id: userId,
          title: learningMap.title,
          summary: learningMap.foundation.seed_companies.join(', ') + ' Interview Prep',
          difficulty: learningMap.foundation.data_coverage,
          timeline_weeks: learningMap.timeline.total_weeks,
          is_crazy_plan: false,
          milestones: learningMap.milestones || [],
          outcomes: learningMap.expected_outcomes || {},
          next_steps: [],
          analysis_count: learningMap.foundation.total_posts_analyzed,
          analysis_ids: learningMap.source_data.generated_from_analysis_ids || [],
          user_goals: userGoals || {},
          personalization_score: learningMap.foundation.data_coverage === 'High' ? 0.9 : 0.7,
          // NEW: Store additional metadata
          source_report_id: reportId,
          foundation_posts: learningMap.foundation.total_posts_analyzed,
          company_tracks: learningMap.company_tracks,
          analytics: learningMap.analytics,
          // NEW: LLM-generated fields (Migration 26)
          skills_roadmap: {}, // Removed - was just a problem list without real roadmap structure
          knowledge_gaps: learningMap.knowledge_gaps || {},
          curated_resources: learningMap.curated_resources || [],
          timeline: learningMap.timeline || {},
          expected_outcomes: learningMap.expected_outcomes || [],
          // NEW: Database-first sections (Migration 28)
          common_pitfalls: learningMap.common_pitfalls || null,
          readiness_checklist: learningMap.readiness_checklist || null,
          success_factors: learningMap.success_factors || [],
          database_resources: learningMap.database_resources || [],
          timeline_statistics: learningMap.timeline_statistics || null,
          // NEW: Synthesized narrative fields (Migration 29)
          pitfalls_narrative: learningMap.pitfalls_narrative || null,
          improvement_areas: learningMap.improvement_areas || null,
          resource_recommendations: learningMap.resource_recommendations || null,
          preparation_expectations: learningMap.preparation_expectations || null
        });

        logger.info(`[Learning Map Controller] 💾 Saved to database with ID: ${savedMap.id}`);

        // Log what savedMap contains
        logger.info(`[Learning Map Controller] 🔍 savedMap type check:`);
        logger.info(`  - savedMap.milestones type: ${typeof savedMap.milestones}`);
        logger.info(`  - savedMap.analytics type: ${typeof savedMap.analytics}`);
        logger.info(`  - savedMap.company_tracks type: ${typeof savedMap.company_tracks}`);

        // Return the complete learning map with database ID
        const responseData = {
          ...learningMap,
          // Override with database-specific fields
          id: savedMap.id,
          created_at: savedMap.created_at,
          status: savedMap.status,
          progress: savedMap.progress
        };

        logger.info(`[Learning Map Controller] 📤 Response data being sent:`);
        logger.info(`  - responseData.milestones count: ${responseData.milestones?.length || 'MISSING'}`);
        logger.info(`  - responseData.company_tracks count: ${responseData.company_tracks?.length || 'MISSING'}`);
        logger.info(`  - responseData.analytics keys: ${responseData.analytics ? Object.keys(responseData.analytics).length : 'MISSING'}`);

        return res.json({
          success: true,
          data: responseData,
          message: 'Learning map generated from comprehensive analysis report'
        });

      } catch (error) {
        logger.error('[Learning Map] Generation failed:', error);

        // Check if error is due to insufficient data
        if (error.message.includes('Insufficient foundation data') ||
            error.message.includes('No timeline data')) {
          return res.status(400).json({
            error: 'insufficient_data',
            message: error.message,
            recommendation: 'Try uploading more interview experiences or use broader search criteria'
          });
        }

        throw error;
      }
    }

    // ❌ LEGACY PATH REMOVED
    // Only the new reportId-based path is supported
    return res.status(400).json({
      error: 'Invalid request',
      message: 'reportId is required. Please generate a batch analysis report first, then create a learning map from it.'
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
    // ✅ SECURITY FIX: Use authenticated user ID from session, not query param
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
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

    // ✅ SECURITY FIX: Double-check ownership (defense in depth)
    if (learningMap.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this learning map'
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
    // ✅ SECURITY FIX: Use authenticated user ID from session, not query param
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { status, isCrazyPlan, limit, offset } = req.query;

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

/**
 * Backfill resources for existing posts
 * POST /api/content/learning-map/backfill-resources
 */
async function backfillResources(req, res) {
  try {
    const { limit, offset, onlySuccessful, companies } = req.body;

    logger.info('[ResourceBackfill] Starting backfill process');

    const stats = await resourceExtractionService.backfillResourcesForPosts({
      limit: limit || 50,
      offset: offset || 0,
      onlySuccessful: onlySuccessful || false,
      companies: companies || null
    });

    res.json({
      success: true,
      data: stats,
      message: `Backfill complete: ${stats.successful}/${stats.processed} posts processed successfully`
    });

  } catch (error) {
    logger.error('[ResourceBackfill] Failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to backfill resources'
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
  deleteMap,
  backfillResources
};