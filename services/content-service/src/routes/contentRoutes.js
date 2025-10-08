const express = require('express');
const {
  analyzeSinglePost,
  analyzeBatchPosts,
  getHistory,
  healthCheck,
  getServiceInfo
} = require('../controllers/analysisController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');
const {
  getTrends,
  getMarketSignals,
  getRecommendations
} = require('../controllers/trendsController');
const {
  generateLearningMap,
  getLearningRecommendations,
  updateLearningProgress,
  getLearningMap,
  getLearningMapsHistory,
  updateMapProgress,
  updateMapStatus,
  deleteMap
} = require('../controllers/learningMapController');
const {
  getUserGoals,
  getUserAnalysisIds
} = require('../controllers/userGoalsController');
const {
  getAgentStatus,
  triggerManualScrape,
  triggerBriefings,
  getUserBriefings,
  getScrapedPosts,
  getScraperStats
} = require('../controllers/agentController');
const {
  predictInterviewSuccess,
  analyzeSkillGap,
  getPredictionStatus,
  retrainModels
} = require('../controllers/predictionController');

const router = express.Router();

// Analysis endpoints (require authentication to associate with user)
router.post('/analyze', requireAuth, analyzeSinglePost);
router.post('/analyze/batch', requireAuth, analyzeBatchPosts);

// Data retrieval endpoints
router.get('/history', getHistory);
router.get('/analytics', getAnalytics);

// Trends and intelligence endpoints
router.get('/trends', getTrends);
router.get('/trends/signals', getMarketSignals);
router.get('/trends/recommendations', getRecommendations);

// Learning map endpoints
router.post('/learning-map', generateLearningMap);
router.get('/learning-map/:mapId', getLearningMap);
router.get('/learning-maps/history', getLearningMapsHistory);
router.get('/learning-recommendations', getLearningRecommendations);
router.put('/learning-map/:mapId/progress', updateMapProgress);
router.put('/learning-map/:mapId/status', updateMapStatus);
router.delete('/learning-map/:mapId', deleteMap);

// User data endpoints (require authentication)
router.get('/user-goals', requireAuth, getUserGoals);
router.get('/user-analyses', requireAuth, getUserAnalysisIds);

// Autonomous Agent endpoints (Phase 4)
router.get('/agent/status', getAgentStatus);
router.post('/agent/scrape', triggerManualScrape);
router.post('/agent/briefings', triggerBriefings);
router.get('/agent/briefings/:userId', getUserBriefings);
router.get('/agent/scraped-posts', getScrapedPosts);
router.get('/agent/stats', getScraperStats);

// ML Prediction endpoints (Phase 4)
router.post('/predict/interview-success', predictInterviewSuccess);
router.post('/predict/skill-gap', analyzeSkillGap);
router.get('/predict/status', getPredictionStatus);
router.post('/predict/retrain', retrainModels);

// System endpoints
router.get('/health', healthCheck);
router.get('/', getServiceInfo);

module.exports = router;