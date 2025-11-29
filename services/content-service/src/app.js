const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const contentRoutes = require('./routes/contentRoutes');
const { logger, requestLoggingMiddleware, errorLoggingMiddleware } = require('./utils/logger');

const app = express();

// Initialize workers if enabled
if (process.env.ENABLE_WORKER !== 'false') {
  require('./workers/embeddingWorker');
  logger.info('[App] Workers initialized (embedding only - NLP removed)');
}

// Initialize all schedulers if enabled
if (process.env.ENABLE_SCHEDULER !== 'false') {
  const schedulerService = require('./services/schedulerService');

  // Initialize all schedules (embeddings, NLP, scraping, briefings, daily collection)
  schedulerService.initializeScheduler();

  logger.info('[App] ✅ All schedulers initialized via schedulerService.initializeScheduler()');
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
// Exclude webhook endpoints from JSON parsing (they need raw body for signature verification)
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Store raw body for webhook signature verification
    if (req.originalUrl && (req.originalUrl.includes('webhook'))) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Production-grade request logging with trace IDs
// Pattern: Stripe's canonical log lines + Netflix's structured JSON
app.use(requestLoggingMiddleware);

// API routes
app.use('/api/content', contentRoutes);

// Error logging middleware (logs before error response)
app.use(errorLoggingMiddleware);

// Global error handler
app.use((error, req, res, next) => {
  // Error already logged by errorLoggingMiddleware
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    trace_id: req.traceId // Include trace ID for debugging
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;