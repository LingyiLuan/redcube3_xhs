const pool = require('../config/database');

/**
 * Save a learning map to history
 */
async function saveLearningMap(learningMapData) {
  const {
    user_id,
    title,
    summary,
    difficulty,
    timeline_weeks,
    is_crazy_plan = false,
    milestones = [],
    outcomes = [],
    next_steps = [],
    analysis_count = 0,
    analysis_ids = [],
    user_goals = {},
    personalization_score = 0,
    // NEW: Enhanced fields for redesigned learning maps
    source_report_id = null,
    foundation_posts = null,
    data_coverage = null,
    avg_prep_weeks = null,
    company_tracks = [],
    analytics = {},
    // NEW: LLM-generated fields (Migration 26)
    skills_roadmap = {},
    knowledge_gaps = {},
    curated_resources = [],
    timeline = {},
    expected_outcomes = [],
    // NEW: Database-first sections (Migration 28)
    common_pitfalls = null,
    readiness_checklist = null,
    success_factors = [],
    database_resources = [],
    timeline_statistics = null,
    // NEW: Synthesized narrative fields (Migration 29)
    pitfalls_narrative = null,
    improvement_areas = null,
    resource_recommendations = null,
    preparation_expectations = null
  } = learningMapData;

  const query = `
    INSERT INTO learning_maps_history (
      user_id, title, summary, difficulty, timeline_weeks, is_crazy_plan,
      milestones, outcomes, next_steps, analysis_count, analysis_ids,
      user_goals, personalization_score, status, progress, last_viewed_at,
      source_report_id, foundation_posts, data_coverage, avg_prep_weeks,
      company_tracks, analytics,
      skills_roadmap, knowledge_gaps, curated_resources, timeline, expected_outcomes,
      common_pitfalls, readiness_checklist, success_factors, database_resources, timeline_statistics,
      pitfalls_narrative, improvement_areas, resource_recommendations, preparation_expectations
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', 0, NOW(),
            $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
            $25, $26, $27, $28, $29, $30, $31, $32, $33)
    RETURNING *
  `;

  const values = [
    user_id,
    title,
    summary,
    difficulty,
    timeline_weeks,
    is_crazy_plan,
    JSON.stringify(milestones),
    JSON.stringify(outcomes),
    JSON.stringify(next_steps),
    analysis_count,
    JSON.stringify(analysis_ids),
    JSON.stringify(user_goals),
    personalization_score,
    // NEW: Enhanced fields
    source_report_id,
    foundation_posts,
    data_coverage,
    avg_prep_weeks,
    JSON.stringify(company_tracks),
    JSON.stringify(analytics),
    // NEW: LLM-generated fields
    JSON.stringify(skills_roadmap),
    JSON.stringify(knowledge_gaps),
    JSON.stringify(curated_resources),
    JSON.stringify(timeline),
    JSON.stringify(expected_outcomes),
    // NEW: Database-first sections
    common_pitfalls ? JSON.stringify(common_pitfalls) : null,
    readiness_checklist ? JSON.stringify(readiness_checklist) : null,
    JSON.stringify(success_factors),
    JSON.stringify(database_resources),
    timeline_statistics ? JSON.stringify(timeline_statistics) : null,
    // NEW: Synthesized narrative fields
    pitfalls_narrative ? JSON.stringify(pitfalls_narrative) : null,
    improvement_areas ? JSON.stringify(improvement_areas) : null,
    resource_recommendations ? JSON.stringify(resource_recommendations) : null,
    preparation_expectations ? JSON.stringify(preparation_expectations) : null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get all learning maps for a user
 */
async function getUserLearningMaps(userId, options = {}) {
  const {
    status = null,
    is_crazy_plan = null,
    limit = 50,
    offset = 0
  } = options;

  // ✅ CRITICAL FIX: Select ALL columns including milestones, company_tracks, analytics
  // These fields contain the actual learning map data needed for visualization
  let query = `
    SELECT *
    FROM learning_maps_history
    WHERE user_id = $1
  `;

  const values = [userId];
  let paramIndex = 2;

  if (status) {
    query += ` AND status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  if (is_crazy_plan !== null) {
    query += ` AND is_crazy_plan = $${paramIndex}`;
    values.push(is_crazy_plan);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Get a single learning map by ID
 */
async function getLearningMapById(mapId, userId) {
  const query = `
    SELECT * FROM learning_maps_history
    WHERE id = $1 AND user_id = $2
  `;

  const result = await pool.query(query, [mapId, userId]);

  if (result.rows.length === 0) {
    return null;
  }

  // Update last_viewed_at
  await pool.query(
    'UPDATE learning_maps_history SET last_viewed_at = NOW() WHERE id = $1',
    [mapId]
  );

  return result.rows[0];
}

/**
 * Update learning map progress
 */
async function updateLearningMapProgress(mapId, userId, progress) {
  const query = `
    UPDATE learning_maps_history
    SET progress = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
    RETURNING *
  `;

  const result = await pool.query(query, [progress, mapId, userId]);
  return result.rows[0];
}

/**
 * Update learning map status
 */
async function updateLearningMapStatus(mapId, userId, status) {
  const validStatuses = ['active', 'archived', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const query = `
    UPDATE learning_maps_history
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
    RETURNING *
  `;

  const result = await pool.query(query, [status, mapId, userId]);
  return result.rows[0];
}

/**
 * Delete a learning map
 */
async function deleteLearningMap(mapId, userId) {
  const query = `
    DELETE FROM learning_maps_history
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [mapId, userId]);
  return result.rows.length > 0;
}

/**
 * Get learning maps count for a user
 */
async function getUserLearningMapsCount(userId, status = null) {
  let query = 'SELECT COUNT(*) FROM learning_maps_history WHERE user_id = $1';
  const values = [userId];

  if (status) {
    query += ' AND status = $2';
    values.push(status);
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count);
}

module.exports = {
  saveLearningMap,
  getUserLearningMaps,
  getLearningMapById,
  updateLearningMapProgress,
  updateLearningMapStatus,
  deleteLearningMap,
  getUserLearningMapsCount
};
