const { Pool } = require('pg');
const dns = require('dns');

/**
 * PostgreSQL connection pool for user service
 *
 * CRITICAL TIMEOUTS:
 * - connectionTimeoutMillis: Max time to wait for a connection from pool
 * - statement_timeout: Max time for any SQL statement (prevents hung queries)
 * - query_timeout: Client-side query timeout
 * - idle_in_transaction_session_timeout: Kill idle transactions
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'redcube_users',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // FAIL-FAST TIMEOUTS to prevent 2+ minute hangs
  statement_timeout: 15000, // 15s max for any SQL statement
  query_timeout: 20000, // 20s client-side query timeout
  idle_in_transaction_session_timeout: 30000, // Kill idle transactions after 30s
  // Force IPv4 DNS resolution to avoid IPv6 fallback delays
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, family: 4 }, callback);
  }
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database (users)');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

module.exports = pool;