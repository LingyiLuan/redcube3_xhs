const { Pool } = require('pg');
const agentService = require('./agentService');
const devtoService = require('./devtoService');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_CONTENT || 'redcube_content'
});

/**
 * Backfill Service - Systematically scrapes ALL historical posts
 *
 * Strategy: Time-window scanning
 * - Goes back 1 year from now
 * - Scrapes in chunks (1 week at a time)
 * - Tracks progress in database
 * - Resumes where it left off
 */

const REDDIT_SOURCES = [
  'cscareerquestions',
  'ExperiencedDevs',
  'csMajors',
  'leetcode',
  'techinterviews',
  'codinginterview',
  'datascience',         // Data science interviews, ML roles
  'MachineLearning'      // ML engineer interviews, research roles
  // Removed 'FAANG' - subreddit doesn't exist (404 errors)
];

/**
 * Initialize backfill tracking for all sources
 * Creates database entries if they don't exist
 */
async function initializeBackfillTracking() {
  try {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp (seconds)
    const oneYearAgo = now - (365 * 24 * 60 * 60); // 1 year ago

    logger.info('[Backfill] Initializing backfill tracking...');

    // Initialize Reddit subreddits
    for (const subreddit of REDDIT_SOURCES) {
      await pool.query(`
        INSERT INTO scraping_backfill_progress
          (source, source_identifier, current_position_timestamp, end_timestamp, status)
        VALUES ($1, $2, $3, $4, 'pending')
        ON CONFLICT (source, source_identifier) DO NOTHING
      `, ['reddit', subreddit, now, oneYearAgo]);
    }

    // Initialize Dev.to
    await pool.query(`
      INSERT INTO scraping_backfill_progress
        (source, source_identifier, current_position_timestamp, end_timestamp, status)
      VALUES ('devto', 'interview', $1, $2, 'pending')
      ON CONFLICT (source, source_identifier) DO NOTHING
    `, [now, oneYearAgo]);

    logger.info(`[Backfill] ✅ Initialized tracking for ${REDDIT_SOURCES.length + 1} sources`);

  } catch (error) {
    logger.error('[Backfill] ❌ Failed to initialize tracking:', error.message);
  }
}

/**
 * Run backfill scraping for next pending source
 * This is called every 2 hours by the scheduler
 */
async function runBackfillScraping() {
  try {
    logger.info('[Backfill] 🔄 Starting backfill run...');

    // Get next source to process (round-robin through all sources)
    const result = await pool.query(`
      SELECT * FROM scraping_backfill_progress
      WHERE status IN ('pending', 'in_progress')
        AND (current_position_timestamp > end_timestamp OR current_position_timestamp IS NULL)
      ORDER BY
        CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END,  -- Prioritize in-progress
        last_run_at ASC NULLS FIRST,  -- Then least recently run
        id ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      logger.info('[Backfill] ✅ All sources completed! Backfill is done.');
      return { completed: true, totalScraped: 0 };
    }

    const tracker = result.rows[0];
    logger.info(`[Backfill] 📍 Processing: ${tracker.source}/${tracker.source_identifier}`);
    logger.info(`[Backfill] 📊 Progress: ${tracker.posts_saved_total} posts saved so far`);

    // Mark as in_progress
    await pool.query(`
      UPDATE scraping_backfill_progress
      SET status = 'in_progress',
          started_at = COALESCE(started_at, NOW()),
          last_run_at = NOW()
      WHERE id = $1
    `, [tracker.id]);

    let scrapedPosts = [];
    let savedCount = 0;

    // Scrape based on source type
    if (tracker.source === 'reddit') {
      const result = await scrapeRedditBackfill(tracker);
      scrapedPosts = result.posts;
      savedCount = result.savedCount;
    } else if (tracker.source === 'devto') {
      const result = await scrapeDevToBackfill(tracker);
      scrapedPosts = result.posts;
      savedCount = result.savedCount;
    }

    // Update progress
    const isCompleted = scrapedPosts.length === 0 || tracker.current_position_timestamp <= tracker.end_timestamp;

    await pool.query(`
      UPDATE scraping_backfill_progress
      SET
        posts_scraped_total = posts_scraped_total + $1,
        posts_saved_total = posts_saved_total + $2,
        status = $3,
        completed_at = CASE WHEN $3 = 'completed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = $4
    `, [
      scrapedPosts.length,
      savedCount,
      isCompleted ? 'completed' : 'in_progress',
      tracker.id
    ]);

    logger.info(`[Backfill] ✅ ${tracker.source}/${tracker.source_identifier}: ${savedCount} posts saved (${scrapedPosts.length} scraped)`);

    return {
      completed: false,
      source: tracker.source,
      sourceIdentifier: tracker.source_identifier,
      scraped: scrapedPosts.length,
      saved: savedCount
    };

  } catch (error) {
    logger.error('[Backfill] ❌ Backfill run failed:', error.message);
    return { completed: false, error: error.message };
  }
}

/**
 * Scrape Reddit backfill for a specific subreddit
 * Uses time-window strategy (going backwards in time)
 */
async function scrapeRedditBackfill(tracker) {
  try {
    const subreddit = tracker.source_identifier;

    logger.info(`[Backfill] 🔍 Reddit r/${subreddit}: Scraping time window...`);

    // Scrape 500 posts using 'new' (to get chronological order)
    const scrapedData = await agentService.scrapeNewInterviewData({
      subreddit,
      numberOfPosts: 500,
      sortBy: 'new',
      timeFilter: 'all'
    });

    // Save to database
    const savedCount = await agentService.saveScrapedData(scrapedData);

    // Update tracker with oldest post timestamp (for next iteration)
    if (scrapedData.length > 0) {
      const oldestPost = scrapedData[scrapedData.length - 1];
      const oldestTimestamp = Math.floor(new Date(oldestPost.createdAt).getTime() / 1000);

      await pool.query(`
        UPDATE scraping_backfill_progress
        SET current_position_timestamp = $1, last_post_id = $2
        WHERE id = $3
      `, [oldestTimestamp, oldestPost.postId, tracker.id]);
    }

    return {
      posts: scrapedData,
      savedCount
    };

  } catch (error) {
    logger.error(`[Backfill] ❌ Reddit backfill failed for r/${tracker.source_identifier}:`, error.message);
    return { posts: [], savedCount: 0 };
  }
}

/**
 * Scrape Dev.to backfill
 * Dev.to API doesn't support time-based filtering well,
 * so we just scrape in batches and mark as complete
 */
async function scrapeDevToBackfill(tracker) {
  try {
    logger.info('[Backfill] 📚 Dev.to: Scraping articles...');

    const articles = await devtoService.scrapeDevToArticles({
      tags: ['interview', 'career', 'hiring', 'jobsearch'],
      numberOfPosts: 200
    });

    const savedCount = await agentService.saveScrapedData(articles);

    // Dev.to is limited by API, mark as completed after first run
    await pool.query(`
      UPDATE scraping_backfill_progress
      SET status = 'completed'
      WHERE id = $1
    `, [tracker.id]);

    return {
      posts: articles,
      savedCount
    };

  } catch (error) {
    logger.error('[Backfill] ❌ Dev.to backfill failed:', error.message);
    return { posts: [], savedCount: 0 };
  }
}

/**
 * Get backfill progress summary
 */
async function getBackfillProgress() {
  try {
    const result = await pool.query(`
      SELECT
        source,
        COUNT(*) as total_sources,
        SUM(posts_saved_total) as total_posts_saved,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_sources,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_sources,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_sources
      FROM scraping_backfill_progress
      GROUP BY source
      ORDER BY source
    `);

    return result.rows;

  } catch (error) {
    logger.error('[Backfill] ❌ Failed to get progress:', error.message);
    return [];
  }
}

module.exports = {
  initializeBackfillTracking,
  runBackfillScraping,
  getBackfillProgress
};
