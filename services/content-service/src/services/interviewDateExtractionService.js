/**
 * Interview Date Extraction Service
 * Phase 1: Temporal Intelligence - Populate interview dates from Reddit timestamps
 *
 * Purpose: Use Reddit post creation dates as interview dates for temporal trend analysis
 * Principle: Reddit posts are typically created within days of the interview experience
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Compute year-quarter from date
 */
function computeYearQuarter(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

/**
 * Populate interview_date and post_year_quarter from created_at for all posts
 * This is a simple one-time backfill operation
 */
async function populateInterviewDates() {
  const startTime = Date.now();
  logger.info('[Interview Date Population] Starting backfill from created_at timestamps');

  try {
    // Update all posts: interview_date = created_at, post_year_quarter = computed
    const result = await pool.query(`
      UPDATE scraped_posts
      SET
        interview_date = created_at::DATE,
        post_year_quarter = TO_CHAR(created_at, 'YYYY') || '-Q' || TO_CHAR(created_at, 'Q'),
        updated_at = NOW()
      WHERE created_at IS NOT NULL
        AND (interview_date IS NULL OR post_year_quarter IS NULL)
      RETURNING id
    `);

    const updated = result.rowCount;
    const duration = Date.now() - startTime;

    logger.info(`[Interview Date Population] Completed: ${updated} posts updated (${duration}ms)`);

    // Get statistics
    const stats = await getExtractionStats();

    return {
      updated,
      duration_ms: duration,
      stats
    };

  } catch (error) {
    logger.error('[Interview Date Population] Error:', error);
    throw error;
  }
}

/**
 * Get extraction statistics
 */
async function getExtractionStats() {
  const stats = await pool.query(`
    SELECT
      COUNT(*) as total_posts,
      COUNT(interview_date) as posts_with_dates,
      COUNT(*) FILTER (WHERE post_year_quarter IS NOT NULL) as posts_with_quarters,
      ROUND(100.0 * COUNT(interview_date) / NULLIF(COUNT(*), 0), 1) as date_coverage_pct,
      MIN(interview_date) as earliest_interview,
      MAX(interview_date) as latest_interview,
      COUNT(DISTINCT post_year_quarter) as unique_quarters
    FROM scraped_posts
  `);

  return stats.rows[0];
}

/**
 * Get temporal distribution by quarter
 */
async function getTemporalDistribution() {
  const distribution = await pool.query(`
    SELECT
      post_year_quarter,
      COUNT(*) as post_count,
      COUNT(*) FILTER (WHERE outcome = 'offer') as offers,
      COUNT(*) FILTER (WHERE outcome = 'rejected') as rejections,
      ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'offer') / NULLIF(COUNT(*), 0), 1) as success_rate,
      MIN(interview_date) as period_start,
      MAX(interview_date) as period_end
    FROM scraped_posts
    WHERE post_year_quarter IS NOT NULL
      AND outcome IS NOT NULL
    GROUP BY post_year_quarter
    ORDER BY post_year_quarter DESC
  `);

  return distribution.rows;
}

module.exports = {
  populateInterviewDates,
  getExtractionStats,
  getTemporalDistribution,
  computeYearQuarter
};
