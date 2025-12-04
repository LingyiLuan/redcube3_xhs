const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const redis = require('redis');
const RedisStore = require('connect-redis').default;

require('dotenv').config();

const app = express();

// Trust proxy for sessions behind reverse proxy
app.set('trust proxy', 1);

// Ensure Express recognizes HTTPS requests (important for cookie SameSite=None)
app.use((req, res, next) => {
  // Force HTTPS detection for cookie security
  if (req.headers['x-forwarded-proto'] === 'https' || req.secure) {
    req.secure = true;
    req.protocol = 'https';
  }
  next();
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080', // API Gateway / Production frontend
    'http://localhost:5173', // Vue dev server
    'http://localhost:3001', // Container frontend (legacy)
    'http://localhost:3002', // Local dev frontend (legacy)
    process.env.FRONTEND_URL || 'https://labzero.io' // Production frontend
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// DEBUG: Log raw body for /api/auth/register to debug JSON parse errors
app.use('/api/auth/register', (req, res, next) => {
  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk.toString();
  });
  req.on('end', () => {
    console.log('[DEBUG] Raw body received for /api/auth/register:');
    console.log('[DEBUG] Raw body length:', rawBody.length);
    console.log('[DEBUG] Raw body content:', rawBody);
    console.log('[DEBUG] Content-Type header:', req.headers['content-type']);
    // Don't call next() here - let express.json() handle parsing on original stream
  });
  next(); // Continue immediately, logging happens async
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Redis client for session store (production-ready)
let redisClient = null;
let sessionStore = null;

// Initialize Redis client for session storage
if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        family: 0, // Enable dual-stack (IPv4 + IPv6) for Railway private network
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('[Session] Redis reconnection failed after 10 retries');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000); // Exponential backoff, max 3s
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('[Session] Redis client error:', err);
    });

    redisClient.on('connect', () => {
      console.log('[Session] ✅ Redis connected for session storage');
    });

    redisClient.on('ready', () => {
      console.log('[Session] ✅ Redis ready for session storage');
    });

    // Connect Redis client (async, but we'll handle it)
    redisClient.connect().catch((err) => {
      console.error('[Session] ❌ Failed to connect to Redis:', err);
      console.warn('[Session] ⚠️  Sessions will use MemoryStore until Redis connects');
    });

    // Create Redis session store
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'redcube:sess:'
    });

    console.log('[Session] ✅ Using Redis session store (production-ready)');
  } catch (error) {
    console.error('[Session] ❌ Failed to initialize Redis session store:', error);
    console.warn('[Session] ⚠️  Falling back to MemoryStore (not recommended for production)');
    redisClient = null;
    sessionStore = null;
  }
} else {
  console.warn('[Session] ⚠️  REDIS_URL not set, using MemoryStore (not recommended for production)');
}

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'redcube-session-secret-change-in-production',
  resave: false,
  saveUninitialized: true, // IMPORTANT: Must be true for OAuth state to persist
  name: 'redcube.sid',
  store: sessionStore || undefined, // Use Redis store if available, otherwise default to MemoryStore
  cookie: {
    secure: process.env.SESSION_COOKIE_SECURE === 'true', // Must be true for HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none', // Required for cross-subdomain cookie sharing (api.labzero.io ↔ labzero.io)
    path: '/', // Cookie available for all paths
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined // Allow cookie to work across subdomains (e.g., '.labzero.io')
  }
};

// Ensure cookie settings are properly applied
if (process.env.SESSION_COOKIE_SECURE === 'true') {
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'none'; // Force 'none' when Secure is true
}

if (process.env.SESSION_COOKIE_DOMAIN) {
  sessionConfig.cookie.domain = process.env.SESSION_COOKIE_DOMAIN;
}

const sessionMiddleware = session(sessionConfig);

// CRITICAL: Skip session middleware for endpoints that don't need sessions
// This prevents Redis session save from blocking the response
// These endpoints don't require user to be logged in - they work with tokens instead
const sessionlessRoutes = [
  '/api/auth/register',       // User registering - not logged in yet
  '/api/auth/verify-email',   // Email verification via token
  '/api/auth/forgot-password', // Password reset request - not logged in
  '/api/auth/reset-password', // Password reset with token - not logged in
  '/api/auth/resend-verification', // Resend verification email
  '/api/auth/check-email'     // Check if email exists - public endpoint
];
app.use((req, res, next) => {
  if (sessionlessRoutes.some(route => req.path === route || req.path.startsWith(route + '?'))) {
    console.log(`[Session] Skipping session middleware for: ${req.path}`);
    return next();
  }
  return sessionMiddleware(req, res, next);
});

// Middleware to fix cookie attributes - must run after session middleware
// Express session sometimes ignores cookie config, so we fix it using onHeaders event
app.use((req, res, next) => {
  // Use onHeaders to intercept headers right before they're sent
  res.on('finish', () => {
    // This runs after response is sent, but we need to catch it earlier
  });
  
  // Intercept when headers are about to be written
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name === 'Set-Cookie' && value) {
      console.log('[Cookie Debug] Set-Cookie called with:', value);
      // Convert to array if needed
      const cookieHeaders = Array.isArray(value) ? value : [value];
      
      // Find and fix the session cookie
      const fixedHeaders = cookieHeaders.map(header => {
        if (header && typeof header === 'string' && header.includes('redcube.sid')) {
          // Replace SameSite=Lax with SameSite=None
          let fixed = header.replace(/SameSite=Lax/gi, 'SameSite=None');
          
          // Add Secure if not present
          if (!fixed.includes('Secure')) {
            fixed = fixed.replace(/; Path=\//, '; Secure; Path=/');
          }
          
          // Add Domain if configured and not present
          if (process.env.SESSION_COOKIE_DOMAIN && !fixed.includes('Domain=')) {
            fixed = fixed.replace(/; Path=\//, `; Domain=${process.env.SESSION_COOKIE_DOMAIN}; Path=/`);
          }
          
          return fixed;
        }
        return header;
      });
      
      // Set the fixed headers
      return originalSetHeader(name, fixedHeaders.length === 1 ? fixedHeaders[0] : fixedHeaders);
    }
    return originalSetHeader(name, value);
  };
  
  next();
});

// Passport middleware
app.use(passport.initialize());

// CRITICAL: Skip passport.session() for sessionless routes
// passport.session() requires req.session to exist, which is skipped for sessionless routes
app.use((req, res, next) => {
  if (sessionlessRoutes.some(route => req.path === route || req.path.startsWith(route + '?'))) {
    console.log(`[Passport] Skipping passport.session() for: ${req.path}`);
    return next();
  }
  return passport.session()(req, res, next);
});

// Debug middleware for authentication
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Authenticated: ${req.isAuthenticated()}`);
  if (req.user) {
    console.log('User:', { id: req.user.id, email: req.user.email });
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', subscriptionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const features = ['Google OAuth', 'Session Management', 'User Profiles'];
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    features.push('LinkedIn OAuth');
  }
  res.json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    features
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'User Service - Authentication and User Management',
    version: '3.0.0',
    endpoints: {
      auth: {
        google: '/auth/google',
        callback: '/auth/google/callback',
        logout: '/api/auth/logout',
        me: '/api/auth/me',
        profile: '/api/auth/profile'
      },
      admin: {
        stats: '/api/auth/stats'
      },
      system: {
        health: '/health'
      }
    },
    features: [
      'Google OAuth 2.0 authentication',
      'Session-based user management',
      'User profile management',
      'Admin statistics',
      'CORS-enabled for frontend integration'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Always log the full error for debugging
  console.error('[Global Error Handler] Request:', req.method, req.originalUrl);
  console.error('[Global Error Handler] Error name:', err.name);
  console.error('[Global Error Handler] Error message:', err.message);
  console.error('[Global Error Handler] Error stack:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Duplicate data',
      message: 'User with this email already exists'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;