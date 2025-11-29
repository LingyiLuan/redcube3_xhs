const pool = require('../config/database');

/**
 * Save analysis result to database
 */
async function saveAnalysisResult(originalText, analysisResult, userId, batchId = null) {
  const query = `
    INSERT INTO analysis_results
    (original_text, company, role, sentiment, interview_topics, industry, experience_level,
     preparation_materials, key_insights, interview_stages, difficulty_level, timeline, outcome,
     user_id, batch_id, full_result, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
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
    batchId,
    null
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
  // Query batch_analysis_cache for batch analyses (not analysis_results)
  // batch_analysis_cache stores complete batch analysis data including pattern_analysis
  let query = 'SELECT * FROM batch_analysis_cache';
  let values = [];
  let whereConditions = [];

  // Note: batch_analysis_cache doesn't have user_id column
  // For now, return all batch analyses (can filter client-side or add user_id column later)

  if (batchId) {
    whereConditions.push(`batch_id = $${values.length + 1}`);
    values.push(batchId);
  }

  if (whereConditions.length > 0) {
    query += ' WHERE ' + whereConditions.join(' AND ');
  }

  query += ` ORDER BY cached_at DESC LIMIT $${values.length + 1}`;
  values.push(limit);

  console.log('[getAnalysisHistory] Querying batch_analysis_cache:', { userId, batchId, limit });
  const result = await pool.query(query, values);

  // Map batch_analysis_cache columns to frontend-expected format
  console.log('[getAnalysisHistory] Found', result.rows.length, 'batch analyses');

  return result.rows.map(row => {
    const patternAnalysis = row.pattern_analysis || {};

    // Extract degraded mode fields if they exist
    const featuresAvailable = patternAnalysis.features_available || null;
    const extractionWarning = patternAnalysis.extraction_warning || null;

    // Remove these from pattern_analysis to avoid duplication
    const { features_available, extraction_warning, ...cleanPatternAnalysis } = patternAnalysis;

    return {
      id: row.id,
      batch_id: row.batch_id,
      created_at: row.cached_at, // Map cached_at to created_at for frontend compatibility

      // Include the complete pattern_analysis data (without degraded mode fields)
      pattern_analysis: cleanPatternAnalysis,

      // Include degraded mode metadata at top level
      features_available: featuresAvailable,
      extraction_warning: extractionWarning,

      // Include other data
      user_post_embeddings: row.user_post_embeddings || [],

      // For frontend compatibility, extract data from pattern_analysis if available
      individual_analyses: cleanPatternAnalysis.individual_analyses || [],
      similar_posts: cleanPatternAnalysis.similar_posts || [],
      question_intelligence: cleanPatternAnalysis.question_intelligence || null,

      // Type indicator
      type: 'batch'
    };
  });
}

async function updateAnalysisFullResult(analysisId, fullResult) {
  const query = `
    UPDATE analysis_results
    SET full_result = $2
    WHERE id = $1
  `;

  await pool.query(query, [analysisId, JSON.stringify(fullResult)]);
}

module.exports = {
  saveAnalysisResult,
  getAnalysisHistory,
  updateAnalysisFullResult
};