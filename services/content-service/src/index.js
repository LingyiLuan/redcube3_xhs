require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3003;

// Start server
app.listen(PORT, () => {
  console.log(`Content service v2 with OpenRouter integration running on port ${PORT}`);
  console.log('Features: Single analysis, Batch analysis, Connection detection, Enhanced analytics');
  console.log(`AI Provider: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter (with model fallback cascade)' : 'Mock responses only'}`);
  console.log(`Scheduler: ${process.env.ENABLE_SCHEDULER !== 'false' ? 'Enabled in app.js' : 'Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const schedulerService = require('./services/schedulerService');
  schedulerService.stopAllSchedules();
  process.exit(0);
});

module.exports = app;