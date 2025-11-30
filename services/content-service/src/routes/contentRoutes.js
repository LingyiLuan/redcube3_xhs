const express = require('express');
const {
  analyzeSinglePost,
  analyzeBatchPosts,
  getHistory,
  getCachedBatchReport,
  getSingleAnalysisHistory,
  healthCheck,
  getServiceInfo
} = require('../controllers/analysisController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { checkUsageLimit, recordUsage } = require('../middleware/usageLimitMiddleware');
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
  deleteMap,
  backfillResources
} = require('../controllers/learningMapController');
const {
  getUserGoals,
  getUserAnalysisIds
} = require('../controllers/userGoalsController');
const {
  getPricingPlans,
  createCheckoutSession,
  getSubscriptionStatus,
  createPortalSession,
  cancelSubscription,
  getAnalytics: getSubscriptionAnalytics
} = require('../controllers/subscriptionController');
const { handleWebhook } = require('../controllers/webhookController');
const {
  getPricingPlans: getLSPricingPlans,
  createCheckoutSession: createLSCheckoutSession,
  getSubscriptionStatus: getLSSubscriptionStatus,
  getCustomerPortalUrl: getLSCustomerPortalUrl,
  cancelSubscription: cancelLSSubscription,
  getAnalytics: getLSAnalytics
} = require('../controllers/lemonSqueezyController');
const { handleLemonSqueezyWebhook } = require('../controllers/lemonSqueezyWebhookController');
const {
  getAgentStatus,
  triggerManualScrape,
  triggerBriefings,
  getUserBriefings,
  getScrapedPosts,
  getScraperStats,
  getRecentPosts,
  scrapeCompanies,
  testRedditApi
} = require('../controllers/agentController');
const {
  predictInterviewSuccess,
  analyzeSkillGap,
  getPredictionStatus,
  retrainModels
} = require('../controllers/predictionController');
const {
  getPendingPosts,
  labelPost,
  skipPost,
  getLabelingStats
} = require('../controllers/labelingController');
const {
  queryAssistant,
  getAssistantInfo
} = require('../controllers/assistantController');
const {
  listUserChats,
  createUserChat,
  getUserChat,
  appendChatMessage,
  deleteUserChat
} = require('../controllers/assistantChatHistoryController');
const {
  handleApifyWebhook,
  manualIngest,
  getIngestionStats
} = require('../controllers/ingestionController');
const {
  triggerEmbeddingGeneration,
  generateForSpecificPosts,
  getStats: getEmbeddingStats,
  search: semanticSearch
} = require('../controllers/embeddingController');
const {
  populateDates,
  getStats: getTemporalStats,
  getDistribution: getTemporalDistribution
} = require('../controllers/temporalController');
const {
  analyze: ragAnalyze,
  compare: ragCompare,
  trending: ragTrending,
  recommendations: ragRecommendations
} = require('../controllers/ragAnalysisController');
const {
  triggerExtraction: nlpExtract,
  getStats: nlpStats,
  findSimilar: nlpFindSimilar,
  classifyDifficulty: nlpClassify,
  triggerBackfill: nlpBackfill,
  triggerReExtraction: nlpReExtract,
  triggerCodingReExtraction: nlpCodingReExtract,
  triggerUnprocessedExtraction: nlpUnprocessedExtract,
  triggerComprehensiveLLMBackfill: nlpComprehensiveBackfill
} = require('../controllers/nlpController');
const {
  analyzeSinglePost: analyzePostDeepDive
} = require('../controllers/postAnalysisController');
const {
  refreshBenchmarkCache,
  getBenchmarkMetadata,
  getSeedMarkers
} = require('../controllers/benchmarkCacheController');
const {
  parseIntent,
  searchPosts
} = require('../controllers/workflowController');
const {
  listUserWorkflows,
  createUserWorkflow,
  getUserWorkflow,
  updateUserWorkflow,
  deleteUserWorkflow
} = require('../controllers/workflowLibraryController');
const {
  getBatchPosts
} = require('../controllers/postsController');
const {
  createExperience,
  getExperiences,
  getExperienceById,
  getExperienceCitations,
  voteExperience,
  getMyExperiences,
  getTrendingExperiences,
  searchExperiences,
  citeExperience
} = require('../controllers/interviewIntelController');
const {
  getTrendingExperiences: getTrendingExperiencesAdvanced,
  getRisingStars,
  getMostCited,
  getCategoryTrending,
  updateTrendingScores,
  getTrendingStats
} = require('../controllers/trendingController');
const {
  getUserProfile,
  getReputationHistory,
  getLeaderboard,
  awardPoints,
  checkUsageLimit: checkUsageLimitEndpoint,
  getTierInfo,
  getUsageStats
} = require('../controllers/reputationController');

const router = express.Router();

// Analysis endpoints (require authentication to associate with user)
// Apply usage limit checking and recording for tier-based rate limiting
router.post('/analyze-single/text', optionalAuth, checkUsageLimit('single_analysis'), recordUsage('single_analysis'), analyzeSinglePost);  // Analyze new text input (single analysis)
router.post('/analyze-single/post', checkUsageLimit('single_analysis'), recordUsage('single_analysis'), analyzePostDeepDive);  // Analyze existing database post (single analysis)
router.post('/analyze/batch', optionalAuth, checkUsageLimit('batch_analysis'), recordUsage('batch_analysis'), analyzeBatchPosts);  // Batch analysis

// Batch report retrieval endpoint (get cached report by batchId)
router.get('/batch/report/:batchId', getCachedBatchReport);

// Data retrieval endpoints
router.get('/history', requireAuth, getHistory);  // ✅ SECURITY FIX: Require authentication
router.get('/single-analysis/history', requireAuth, getSingleAnalysisHistory);  // ✅ SECURITY FIX: Require authentication
router.get('/analytics', getAnalytics);

// Trends and intelligence endpoints
router.get('/trends', getTrends);
router.get('/trends/signals', getMarketSignals);
router.get('/trends/recommendations', getRecommendations);

// Learning map endpoints
router.post('/learning-map', checkUsageLimit('learning_map'), recordUsage('learning_map'), generateLearningMap);
router.post('/learning-map/backfill-resources', backfillResources);
router.get('/learning-map/:mapId', requireAuth, getLearningMap);  // ✅ SECURITY FIX: Require authentication
router.get('/learning-maps/history', requireAuth, getLearningMapsHistory);  // ✅ SECURITY FIX: Require authentication
router.get('/learning-recommendations', getLearningRecommendations);
router.put('/learning-map/:mapId/progress', updateMapProgress);
router.put('/learning-map/:mapId/status', updateMapStatus);
router.delete('/learning-map/:mapId', deleteMap);

// Interview Intel UGC endpoints (Phase 1A: UGC Foundation)
router.post('/interview-intel/experiences', optionalAuth, createExperience);  // Create interview experience
router.get('/interview-intel/experiences', getExperiences);  // Browse experiences with filters
router.get('/interview-intel/experiences/:id', getExperienceById);  // Get single experience
router.get('/interview-intel/experiences/:id/citations', getExperienceCitations);  // Get citation tracking
router.post('/interview-intel/experiences/:id/vote', optionalAuth, voteExperience);  // Vote on experience
router.post('/interview-intel/experiences/:id/cite', optionalAuth, citeExperience);  // Record citation
router.get('/interview-intel/my-experiences', optionalAuth, getMyExperiences);  // User's own experiences
router.get('/interview-intel/trending', getTrendingExperiences);  // Trending experiences (basic)
router.get('/interview-intel/search', searchExperiences);  // Search by keywords

// Trending & Discovery endpoints (Phase 2: Advanced Trending)
router.get('/trending/experiences', getTrendingExperiencesAdvanced);  // Advanced trending with filters
router.get('/trending/rising-stars', getRisingStars);  // New but highly engaging experiences
router.get('/trending/most-cited', getMostCited);  // Most cited experiences (academic influence)
router.get('/trending/category/:category/:value', getCategoryTrending);  // Category-specific trending
router.post('/trending/update-scores', updateTrendingScores);  // Manual trending score update (admin/cron)
router.get('/trending/stats', getTrendingStats);  // Trending statistics (monitoring)

// User data endpoints (require authentication)
router.get('/user-goals', requireAuth, getUserGoals);
router.get('/user-analyses', requireAuth, getUserAnalysisIds);

// Autonomous Agent endpoints (Phase 4)
router.get('/agent/status', getAgentStatus);
router.post('/agent/scrape', triggerManualScrape);
router.post('/agent/scrape/companies', scrapeCompanies); // NEW: Company-targeted scraping
router.get('/agent/test-reddit', testRedditApi); // NEW: Test Reddit API connection
router.post('/agent/briefings', triggerBriefings);
router.get('/agent/briefings/:userId', getUserBriefings);
router.get('/agent/scraped-posts', getScrapedPosts);
router.get('/agent/stats', getScraperStats);

// Phase 5.1 Enhanced Data endpoints
router.get('/posts/recent', getRecentPosts);

// Posts endpoints (Phase 3: Source Attribution)
router.post('/posts/batch', getBatchPosts);

// ML Prediction endpoints (Phase 4)
router.post('/predict/interview-success', predictInterviewSuccess);
router.post('/predict/skill-gap', analyzeSkillGap);
router.get('/predict/status', getPredictionStatus);
router.post('/predict/retrain', retrainModels);

// Labeling endpoints (Phase 5.1)
router.get('/labeling/pending', getPendingPosts);
router.post('/labeling/:postId/label', labelPost);
router.post('/labeling/:postId/skip', skipPost);
router.get('/labeling/stats', getLabelingStats);

// AI Assistant endpoints (Vue Migration Phase 4)
router.post('/assistant/query', queryAssistant);
router.get('/assistant/info', getAssistantInfo);
router.get('/assistant/chats', requireAuth, listUserChats);
router.post('/assistant/chats', requireAuth, createUserChat);
router.get('/assistant/chats/:chatId', requireAuth, getUserChat);
router.post('/assistant/chats/:chatId/messages', requireAuth, appendChatMessage);
router.delete('/assistant/chats/:chatId', requireAuth, deleteUserChat);

// Workflow endpoints (Vue Frontend Phase 2: AI Search)
router.post('/workflow/parse-intent', parseIntent);
router.post('/workflow/search-posts', searchPosts);
router.get('/workflow/library', requireAuth, listUserWorkflows);
router.post('/workflow/library', requireAuth, createUserWorkflow);
router.get('/workflow/library/:workflowId', requireAuth, getUserWorkflow);
router.put('/workflow/library/:workflowId', requireAuth, updateUserWorkflow);
router.delete('/workflow/library/:workflowId', requireAuth, deleteUserWorkflow);

// Data Ingestion endpoints (Phase 6: RAG Database)
router.post('/ingest/webhook', handleApifyWebhook);
router.post('/ingest/manual', manualIngest);
router.get('/ingest/stats', getIngestionStats);

// Embedding & RAG endpoints (Phase 6)
router.post('/embeddings/generate', triggerEmbeddingGeneration);
router.post('/embeddings/posts', generateForSpecificPosts);
router.get('/embeddings/stats', getEmbeddingStats);
router.post('/embeddings/search', semanticSearch);

// RAG Analysis endpoints (Phase 6: Deep Analysis)
router.post('/rag/analyze', ragAnalyze);
router.post('/rag/compare', ragCompare);
router.get('/rag/trending', ragTrending);
router.post('/rag/recommendations', ragRecommendations);

// NLP Extraction endpoints (Phase 6: Sprint 4)
router.post('/nlp/extract', nlpExtract);
router.get('/nlp/stats', nlpStats);
router.post('/nlp/similar', nlpFindSimilar);
router.post('/nlp/classify', nlpClassify);
router.post('/nlp/backfill', nlpBackfill);
router.post('/nlp/reextract', nlpReExtract);  // Re-extract low-quality questions
router.post('/nlp/reextract-coding', nlpCodingReExtract);  // Re-extract coding questions with leetcode_problems field
router.post('/nlp/extract-unprocessed', nlpUnprocessedExtract);  // Extract from posts with NO questions at all
router.post('/nlp/comprehensive-backfill', nlpComprehensiveBackfill);  // Extract ALL 13 LLM fields (parent + child tables)

// Post Analysis endpoints (Phase 1: Single Post Deep Dive)
// DEPRECATED: Use /analyze/post instead
// router.post('/posts/analyze-single', analyzePostDeepDive);

// Temporal Intelligence endpoints (Phase 1: Analysis Report Enhancement)
router.post('/temporal/populate-dates', populateDates);
router.get('/temporal/stats', getTemporalStats);
router.get('/temporal/distribution', getTemporalDistribution);

// Benchmark Cache endpoints (Background Pre-computation)
router.post('/benchmark/refresh', refreshBenchmarkCache);
router.get('/benchmark/metadata', getBenchmarkMetadata);
router.get('/benchmark/seed-markers/:batchId', getSeedMarkers);

// Reputation & Gamification endpoints (Phase 3: User Engagement)
router.get('/reputation/profile/:userId', getUserProfile);  // Get user reputation profile
router.get('/reputation/history/:userId', getReputationHistory);  // Get reputation history
router.get('/reputation/leaderboard', getLeaderboard);  // Get leaderboard
router.post('/reputation/award', awardPoints);  // Award points (internal/admin)
router.get('/reputation/check-limit/:userId', checkUsageLimitEndpoint);  // Check usage limits
router.get('/reputation/tiers', getTierInfo);  // Get tier information
router.get('/reputation/usage/:userId', getUsageStats);  // Get usage statistics

// Subscription & Payment endpoints (Stripe Integration)
router.get('/pricing', getPricingPlans);  // Get pricing plans (public)
router.post('/subscription/checkout', requireAuth, createCheckoutSession);  // Create checkout session
router.get('/subscription/status', requireAuth, getSubscriptionStatus);  // Get subscription status
router.post('/subscription/portal', requireAuth, createPortalSession);  // Create billing portal session
router.post('/subscription/cancel', requireAuth, cancelSubscription);  // Cancel subscription
router.get('/subscription/analytics', getSubscriptionAnalytics);  // Get subscription analytics (admin)

// Stripe webhook (raw body required - handled in app.js)
router.post('/webhooks/stripe', handleWebhook);  // Raw body stored via express.json verify

// Lemon Squeezy Payment endpoints (NO SSN required - Merchant of Record)
router.get('/ls/pricing', getLSPricingPlans);  // Get Lemon Squeezy pricing plans (public)
router.post('/ls/checkout', requireAuth, createLSCheckoutSession);  // Create Lemon Squeezy checkout
router.get('/ls/subscription/status', requireAuth, getLSSubscriptionStatus);  // Get subscription status
router.get('/ls/portal', requireAuth, getLSCustomerPortalUrl);  // Get customer portal URL
router.post('/ls/subscription/cancel', requireAuth, cancelLSSubscription);  // Cancel subscription
router.get('/ls/analytics', getLSAnalytics);  // Get Lemon Squeezy analytics (admin)

// Lemon Squeezy webhook (raw body required for signature verification)
router.post('/webhooks/lemon-squeezy', handleLemonSqueezyWebhook);  // Raw body stored via express.json verify

// System endpoints
router.get('/health', healthCheck);
router.get('/', getServiceInfo);

module.exports = router;