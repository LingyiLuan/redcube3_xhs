require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`User service with Google OAuth running on port ${PORT}`);
  console.log('Features: Google OAuth 2.0, Session Management, User Profiles');
  console.log(`Authentication provider: ${process.env.GOOGLE_CLIENT_ID ? 'Google OAuth configured' : 'Google OAuth NOT configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'}`);
  console.log(`Frontend URLs: ${process.env.FRONTEND_URL || 'http://localhost:3001, http://localhost:3002'}`);
  console.log(`Session store: ${process.env.REDIS_URL ? 'Redis (production-ready)' : 'MemoryStore (development only)'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;