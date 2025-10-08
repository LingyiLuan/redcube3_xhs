require('dotenv').config();
const app = require('./app');
const scheduler = require('./services/scheduler');

const PORT = process.env.PORT || 3003;

// Start server
app.listen(PORT, () => {
  console.log(`Content service v2 with OpenRouter integration running on port ${PORT}`);
  console.log('Features: Single analysis, Batch analysis, Connection detection, Enhanced analytics');
  console.log(`AI Provider: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter (with model fallback cascade)' : 'Mock responses only'}`);

  // Initialize autonomous agent scheduler
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    console.log('\n🤖 [PHASE 4] Initializing Autonomous Agent...');
    scheduler.initializeScheduler();
  } else {
    console.log('\n⚠️ [PHASE 4] Scheduler disabled (set ENABLE_SCHEDULER=true to enable)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  scheduler.stopAllJobs();
  process.exit(0);
});

module.exports = app;