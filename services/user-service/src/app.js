const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();

const app = express();

// Trust proxy for sessions behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001', // Container frontend
    'http://localhost:3002', // Local dev frontend
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'redcube-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'redcube.sid'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    features: ['Google OAuth', 'Session Management', 'User Profiles']
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
  console.error('User service error:', err);

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