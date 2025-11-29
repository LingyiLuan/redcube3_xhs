/**
 * ============================================================================
 * Structured JSON Logger (Production-grade)
 * Pattern: Canonical Log Lines (Stripe) + Structured JSON (Netflix/Google)
 * ============================================================================
 *
 * Features:
 * - Structured JSON output for easy parsing
 * - Request tracing with correlation IDs
 * - Log levels: ERROR, WARN, INFO, DEBUG
 * - Performance timing
 * - Automatic context enrichment
 *
 * Companies using this pattern:
 * - Stripe: Canonical request logs
 * - Netflix: Structured JSON with trace IDs
 * - Google: Structured logging with Cloud Logging
 * - Datadog: JSON logs for automatic parsing
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels (syslog severity levels)
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create Winston logger
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'content-service',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
    // File transport for production (rotate daily)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

/**
 * Generate unique trace ID for request correlation
 * Pattern: Stripe's request IDs (req_xxxxx)
 */
function generateTraceId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Canonical Request Logger
 * Logs one line per HTTP request with all critical info
 * Pattern: Stripe's canonical log lines
 *
 * Example output:
 * {
 *   "timestamp": "2025-11-27 10:00:00.123",
 *   "level": "info",
 *   "message": "request.completed",
 *   "trace_id": "req_1234567890_abc123",
 *   "method": "POST",
 *   "path": "/api/content/analyze-single/text",
 *   "status": 200,
 *   "duration_ms": 1234,
 *   "user_id": 19,
 *   "ip": "127.0.0.1",
 *   "user_agent": "curl/7.64.1"
 * }
 */
function logRequest(req, res, duration) {
  const logData = {
    message: 'request.completed',
    trace_id: req.traceId,
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration_ms: Math.round(duration),
    user_id: req.user?.id || null,
    ip: req.ip || req.connection?.remoteAddress,
    user_agent: req.get('user-agent'),
  };

  // Log errors separately
  if (res.statusCode >= 500) {
    logger.error(logData);
  } else if (res.statusCode >= 400) {
    logger.warn(logData);
  } else {
    logger.info(logData);
  }
}

/**
 * Canonical Error Logger
 * Logs errors with full context and stack traces
 *
 * Example output:
 * {
 *   "timestamp": "2025-11-27 10:00:00.123",
 *   "level": "error",
 *   "message": "Database connection failed",
 *   "trace_id": "req_1234567890_abc123",
 *   "error_type": "DatabaseError",
 *   "error_message": "Connection timeout",
 *   "stack": "Error: Connection timeout\n  at ...",
 *   "user_id": 19,
 *   "path": "/api/content/analyze"
 * }
 */
function logError(error, req = null) {
  const logData = {
    message: error.message || 'Unknown error',
    trace_id: req?.traceId || 'unknown',
    error_type: error.name || 'Error',
    error_message: error.message,
    stack: error.stack,
    user_id: req?.user?.id || null,
    path: req?.path || null,
  };

  logger.error(logData);
}

/**
 * Express middleware to add trace ID and timing
 * Usage: app.use(requestLoggingMiddleware);
 */
function requestLoggingMiddleware(req, res, next) {
  // Generate trace ID for request correlation
  req.traceId = generateTraceId();

  // Track request start time
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req, res, duration);
  });

  next();
}

/**
 * Express error handling middleware
 * Usage: app.use(errorLoggingMiddleware);
 */
function errorLoggingMiddleware(err, req, res, next) {
  logError(err, req);

  // Pass to next error handler
  next(err);
}

// Export logger and utilities
// For backward compatibility, export logger as both named export and default export
module.exports = logger;
module.exports.logger = logger;
module.exports.generateTraceId = generateTraceId;
module.exports.logRequest = logRequest;
module.exports.logError = logError;
module.exports.requestLoggingMiddleware = requestLoggingMiddleware;
module.exports.errorLoggingMiddleware = errorLoggingMiddleware;
