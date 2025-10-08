const pool = require('../config/database');

/**
 * Save analysis result to database
 */
async function saveAnalysisResult(originalText, analysisResult, userId, batchId = null) {
  const query = `
    INSERT INTO analysis_results
    (original_text, company, role, sentiment, interview_topics, industry, experience_level,
     preparation_materials, key_insights, interview_stages, difficulty_level, timeline, outcome,
     user_id, batch_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    RETURNING id, created_at
  `;

  const values = [
    originalText,
    analysisResult.company,
    analysisResult.role,
    analysisResult.sentiment,
    JSON.stringify(analysisResult.interview_topics || []),
    analysisResult.industry,
    analysisResult.experience_level,
    JSON.stringify(analysisResult.preparation_materials || []),
    JSON.stringify(analysisResult.key_insights || []),
    JSON.stringify(analysisResult.interview_stages || []),
    analysisResult.difficulty_level,
    analysisResult.timeline,
    analysisResult.outcome,
    userId,
    batchId
  ];

  console.log(`💾 DATABASE QUERY - Saving Analysis:`);
  console.log(`  - User ID being saved: ${userId}`);
  console.log(`  - Company: ${analysisResult.company}`);
  console.log(`  - Batch ID: ${batchId || 'null'}`);

  const result = await pool.query(query, values);

  console.log(`✅ DATABASE SAVE SUCCESS:`);
  console.log(`  - Analysis ID: ${result.rows[0].id}`);
  console.log(`  - Created at: ${result.rows[0].created_at}`);
  return result.rows[0];
}

/**
 * Get analysis history
 */
async function getAnalysisHistory(userId, limit = 10, batchId = null) {
  let query = 'SELECT * FROM analysis_results';
  let values = [];
  let whereConditions = [];

  if (userId) {
    whereConditions.push(`user_id = $${values.length + 1}`);
    values.push(userId);
  }

  if (batchId) {
    whereConditions.push(`batch_id = $${values.length + 1}`);
    values.push(batchId);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
  values.push(limit);

  const result = await pool.query(query, values);

  // JSONB columns are already parsed as objects by PostgreSQL driver
  // No JSON.parse() needed - just ensure defaults for null values
  return result.rows.map(row => ({
    ...row,
    interview_topics: row.interview_topics || [],
    preparation_materials: row.preparation_materials || [],
    key_insights: row.key_insights || [],
    interview_stages: row.interview_stages || []
  }));
}

module.exports = {
  saveAnalysisResult,
  getAnalysisHistory
};