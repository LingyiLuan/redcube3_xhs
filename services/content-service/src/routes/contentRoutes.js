const express = require('express');
const {
  analyzeSinglePost,
  analyzeBatchPosts,
  getHistory,
  healthCheck,
  getServiceInfo
} = require('../controllers/analysisController');
const { getAnalytics } = require('../controllers/analyticsController');
const {
  getTrends,
  getMarketSignals,
  getRecommendations
} = require('../controllers/trendsController');

const router = express.Router();

// Analysis endpoints
router.post('/analyze', analyzeSinglePost);
router.post('/analyze/batch', analyzeBatchPosts);

// Data retrieval endpoints
router.get('/history', getHistory);
router.get('/analytics', getAnalytics);

// Trends and intelligence endpoints
router.get('/trends', getTrends);
router.get('/trends/signals', getMarketSignals);
router.get('/trends/recommendations', getRecommendations);

// System endpoints
router.get('/health', healthCheck);
router.get('/', getServiceInfo);

module.exports = router;