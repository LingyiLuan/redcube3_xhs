require('dotenv').config();
const app = require('./app');
const pool = require('./database/connection');

const PORT = process.env.PORT || 3001;

/**
 * Initialize the application with DB warmup before starting server
 * This ensures the first request doesn't wait for cold DB connection
 */
async function initializeApp() {
  try {
    // Warmup: Establish DB connection before accepting requests
    console.log('[Startup] Warming up database connection...');
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const duration = Date.now() - startTime;
    console.log(`[Startup] Database connection established in ${duration}ms`);
  } catch (error) {
    console.error('[Startup] Failed to connect to database:', error.message);
    console.warn('[Startup] Server will start but first DB request may be slow');
  }

  // Start server after DB warmup
  const server = app.listen(PORT, () => {
    console.log(`User service with Google OAuth running on port ${PORT}`);
    console.log('Features: Google OAuth 2.0, Session Management, User Profiles');
    console.log(`Authentication provider: ${process.env.GOOGLE_CLIENT_ID ? 'Google OAuth configured' : 'Google OAuth NOT configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'}`);
    console.log(`Frontend URLs: ${process.env.FRONTEND_URL || 'http://localhost:3001, http://localhost:3002'}`);
    console.log(`Session store: ${process.env.REDIS_URL ? 'Redis (production-ready)' : 'MemoryStore (development only)'}`);
  });

  return server;
}

// Initialize and store server reference for graceful shutdown
let server;
initializeApp().then(s => { server = s; });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;