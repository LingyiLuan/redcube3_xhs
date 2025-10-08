const analysisDataService = require('./analysisDataService');
const smartInsightsService = require('./smartInsightsService');
const aiContentService = require('./aiContentService');

/**
 * Learning Map Service (Refactored)
 * Main orchestration service for AI-powered learning pathways
 */

class LearningMapService {
  /**
   * Generate a structured learning map based on selected analyses
   * @param {Array} analysisIds - Array of analysis result IDs
   * @param {Object} userGoals - User's learning goals and preferences
   * @param {number} userId - User ID for personalization
   * @param {boolean} isCrazyPlan - Whether to generate an aggressive 1-month plan
   * @returns {Object} Structured learning map
   */
  async generateLearningMap(analysisIds, userGoals = {}, userId = null, isCrazyPlan = false) {
    try {
      console.log('Generating learning map for user:', userId);
      console.log('Analysis IDs:', analysisIds);
      console.log('User goals:', userGoals);
      console.log('CrazyPlan mode:', isCrazyPlan);

      // Step 1: Fetch user goals from database if not provided
      const enhancedUserGoals = await analysisDataService.getUserGoals(userId, userGoals);

      // Override timeline for CrazyPlan mode (aggressive 1-month timeline)
      if (isCrazyPlan) {
        enhancedUserGoals.timeline_months = 1;
        enhancedUserGoals.intensity = 'high';
        enhancedUserGoals.learning_style = 'Project-Based'; // Force project-based learning
      }

      // Step 2: Fetch smart analysis results based on user goals
      const analysisResults = await this.fetchSmartAnalysisResults(analysisIds, enhancedUserGoals, userId);

      // Step 3: Process analysis data with intelligent filtering
      const insights = smartInsightsService.extractSmartInsights(analysisResults, enhancedUserGoals);

      // Step 4: Generate AI-powered learning map using enhanced data
      const aiGeneratedContent = await aiContentService.generateAILearningContent(
        insights,
        enhancedUserGoals,
        isCrazyPlan
      );

      // Step 5: Structure the learning map with personalization metrics
      const learningMap = {
        id: `map_${Date.now()}`,
        title: isCrazyPlan
          ? `🚀 CrazyPlan: ${aiGeneratedContent.title || "30-Day Interview Mastery Sprint"}`
          : aiGeneratedContent.title || "Interview Success Learning Path",
        summary: isCrazyPlan
          ? `AGGRESSIVE 30-DAY PLAN: ${aiGeneratedContent.summary || "Fast-track your interview prep with project-based learning and modern AI tools."}`
          : aiGeneratedContent.summary || "Personalized learning journey based on your interview analysis data.",
        timeline_weeks: isCrazyPlan ? 4 : (aiGeneratedContent.timeline_weeks || enhancedUserGoals.timeline_months || 6),
        difficulty: isCrazyPlan ? "High Intensity" : (aiGeneratedContent.difficulty || enhancedUserGoals.current_level || "Intermediate"),
        created_at: new Date().toISOString(),
        analysis_count: analysisResults.length,
        personalization_score: insights.personalization_score,
        is_crazy_plan: isCrazyPlan,
        insights_used: insights,
        milestones: aiGeneratedContent.milestones || [],
        prerequisites: aiGeneratedContent.prerequisites || [],
        outcomes: aiGeneratedContent.outcomes || [],
        next_steps: aiGeneratedContent.next_steps || []
      };

      console.log('Generated personalized learning map:', learningMap.title);
      console.log('Personalization score:', insights.personalization_score);
      console.log('CrazyPlan mode:', isCrazyPlan);
      return learningMap;

    } catch (error) {
      console.error('Error generating learning map:', error);
      throw new Error('Failed to generate learning map');
    }
  }

  /**
   * Fetch smart analysis results based on user goals and preferences
   * @param {Array} analysisIds - Specific analysis IDs to fetch
   * @param {Object} userGoals - User's learning goals
   * @param {number} userId - User ID for filtering
   * @returns {Array} Filtered and weighted analysis results
   */
  async fetchSmartAnalysisResults(analysisIds, userGoals, userId) {
    try {
      let analyses = [];

      // If specific IDs provided, fetch those first
      if (analysisIds && analysisIds.length > 0) {
        analyses = await analysisDataService.fetchAnalysisResults(analysisIds);
      }

      // If no specific analyses or user wants more personalized results
      if (analyses.length === 0 || userId) {
        const smartAnalyses = await analysisDataService.fetchRelevantAnalyses(userGoals, userId);
        analyses = analyses.concat(smartAnalyses);
      }

      // Remove duplicates and apply intelligent filtering
      const uniqueAnalyses = smartInsightsService.deduplicateAnalyses(analyses);
      const filteredAnalyses = smartInsightsService.filterByRelevance(uniqueAnalyses, userGoals);
      const weightedAnalyses = smartInsightsService.applyRecencyWeighting(filteredAnalyses);

      console.log(`Smart filtering: ${analyses.length} → ${filteredAnalyses.length} relevant analyses`);
      return weightedAnalyses.slice(0, 15); // Limit to top 15 most relevant

    } catch (error) {
      console.error('Error fetching smart analysis results:', error);
      // Fallback to recent analyses
      return analysisDataService.fetchRecentAnalyses(10);
    }
  }

  /**
   * Get personalized learning recommendations
   * @param {Object} userProfile - User's current skills and goals
   * @returns {Array} Recommended learning paths
   */
  async getPersonalizedRecommendations(userProfile) {
    try {
      // Mock recommendations based on user profile
      const recommendations = [
        {
          title: "Beginner's XHS Analysis Path",
          description: "Start with fundamental content analysis techniques",
          estimated_weeks: 4,
          difficulty: "Beginner",
          match_score: 0.9
        },
        {
          title: "Advanced Trend Prediction",
          description: "Master predictive analytics for content trends",
          estimated_weeks: 6,
          difficulty: "Advanced",
          match_score: 0.75
        },
        {
          title: "Interview-Focused Strategy",
          description: "Apply XHS analysis specifically for interview success",
          estimated_weeks: 3,
          difficulty: "Intermediate",
          match_score: 0.85
        }
      ];

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  /**
   * Update learning progress
   * @param {string} mapId - Learning map ID
   * @param {Object} progress - Progress update data
   * @returns {Object} Updated progress
   */
  async updateProgress(mapId, progress) {
    try {
      // Mock progress tracking
      const updatedProgress = {
        map_id: mapId,
        completed_milestones: progress.completed_milestones || [],
        current_week: progress.current_week || 1,
        completion_percentage: progress.completion_percentage || 0,
        last_updated: new Date().toISOString()
      };

      console.log('Updated learning progress for map:', mapId);
      return updatedProgress;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Failed to update learning progress');
    }
  }
}

module.exports = new LearningMapService();