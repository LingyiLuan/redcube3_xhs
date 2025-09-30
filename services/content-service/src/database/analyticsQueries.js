const pool = require('../config/database');

/**
 * Get analytics data
 */
async function getAnalytics(timeframe = '30d', userId = null) {
  let whereClause = "WHERE created_at >= NOW() - INTERVAL '30 days'";
  let queryParams = [];

  if (userId) {
    whereClause += ` AND user_id = $1`;
    queryParams.push(userId);
  }

  // Company analytics
  const analyticsQuery = `
    SELECT
      company,
      COUNT(*) as mention_count,
      AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) as avg_sentiment,
      array_agg(DISTINCT role) FILTER (WHERE role IS NOT NULL) as roles_mentioned,
      COUNT(CASE WHEN outcome = 'passed' THEN 1 END) as success_count,
      COUNT(CASE WHEN outcome IN ('passed', 'failed') THEN 1 END) as total_outcomes
    FROM analysis_results
    ${whereClause} AND company IS NOT NULL
    GROUP BY company
    ORDER BY mention_count DESC
    LIMIT 10
  `;

  const companiesResult = await pool.query(analyticsQuery, queryParams);

  // Topics analytics
  const topicsQuery = `
    SELECT
      topic,
      COUNT(*) as frequency,
      AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) as avg_sentiment
    FROM analysis_results,
    jsonb_array_elements_text(interview_topics) as topic
    ${whereClause}
    GROUP BY topic
    ORDER BY frequency DESC
    LIMIT 15
  `;

  const topicsResult = await pool.query(topicsQuery, queryParams);

  // Total count
  const totalQuery = `SELECT COUNT(*) as total FROM analysis_results ${whereClause}`;
  const totalResult = await pool.query(totalQuery, queryParams);

  // Connection stats
  const connectionsQuery = `
    SELECT
      connection_type,
      COUNT(*) as count,
      AVG(strength) as avg_strength
    FROM analysis_connections
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY connection_type
    ORDER BY count DESC
  `;

  const connectionsResult = await pool.query(connectionsQuery);

  return {
    topCompanies: companiesResult.rows,
    topTopics: topicsResult.rows,
    connectionStats: connectionsResult.rows,
    totalAnalyses: parseInt(totalResult.rows[0].total),
    timeframe
  };
}

/**
 * Get total analysis count
 */
async function getTotalAnalysisCount() {
  const result = await pool.query('SELECT COUNT(*) FROM analysis_results');
  return parseInt(result.rows[0].count);
}

module.exports = {
  getAnalytics,
  getTotalAnalysisCount
};