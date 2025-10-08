const pool = require('../config/database');

/**
 * Analysis Data Service
 * Handles fetching and filtering analysis data from database
 */

class AnalysisDataService {
  /**
   * Get user goals from database
   * @param {number} userId - User ID
   * @param {Object} fallbackGoals - Fallback goals if none in database
   * @returns {Object} Enhanced user goals
   */
  async getUserGoals(userId, fallbackGoals = {}) {
    try {
      if (!userId) {
        return {
          target_role: fallbackGoals.target_role || 'Data Analyst',
          target_companies: fallbackGoals.target_companies || [],
          timeline_months: fallbackGoals.timeline_months || 6,
          focus_areas: fallbackGoals.focus_areas || [],
          current_level: fallbackGoals.current_level || 'Intermediate'
        };
      }

      const query = `
        SELECT target_role, target_companies, timeline_months, focus_areas, current_level
        FROM user_goals
        WHERE user_id = $1 AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        console.log('No user goals found, using fallback');
        return {
          target_role: fallbackGoals.target_role || 'Data Analyst',
          target_companies: fallbackGoals.target_companies || [],
          timeline_months: fallbackGoals.timeline_months || 6,
          focus_areas: fallbackGoals.focus_areas || [],
          current_level: fallbackGoals.current_level || 'Intermediate'
        };
      }

      const userGoals = result.rows[0];
      console.log('Fetched user goals:', userGoals);

      return {
        target_role: userGoals.target_role || fallbackGoals.target_role || 'Data Analyst',
        target_companies: userGoals.target_companies || fallbackGoals.target_companies || [],
        timeline_months: userGoals.timeline_months || fallbackGoals.timeline_months || 6,
        focus_areas: userGoals.focus_areas || fallbackGoals.focus_areas || [],
        current_level: userGoals.current_level || fallbackGoals.current_level || 'Intermediate'
      };

    } catch (error) {
      console.error('Error fetching user goals:', error);
      return fallbackGoals;
    }
  }

  /**
   * Fetch specific analysis results by IDs
   * @param {Array} analysisIds - Analysis IDs to fetch
   * @returns {Array} Analysis results
   */
  async fetchAnalysisResults(analysisIds) {
    try {
      if (!analysisIds || analysisIds.length === 0) {
        return [];
      }

      const placeholders = analysisIds.map((_, index) => `$${index + 1}`).join(',');
      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        WHERE id IN (${placeholders})
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, analysisIds);
      console.log(`Fetched ${result.rows.length} analysis results`);

      return this.transformDatabaseRows(result.rows);
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      return [];
    }
  }

  /**
   * Fetch analyses relevant to user goals
   * @param {Object} userGoals - User's learning goals
   * @param {number} userId - User ID for filtering
   * @returns {Array} Relevant analysis results
   */
  async fetchRelevantAnalyses(userGoals, userId) {
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Filter by target companies if specified
      if (userGoals.target_companies && userGoals.target_companies.length > 0) {
        whereConditions.push(`company = ANY($${paramIndex})`);
        queryParams.push(userGoals.target_companies);
        paramIndex++;
      }

      // Filter by target role if specified
      if (userGoals.target_role) {
        whereConditions.push(`(role ILIKE $${paramIndex} OR role IS NULL)`);
        queryParams.push(`%${userGoals.target_role}%`);
        paramIndex++;
      }

      // Filter by experience level if specified
      if (userGoals.current_level) {
        whereConditions.push(`(experience_level = $${paramIndex} OR experience_level IS NULL)`);
        queryParams.push(userGoals.current_level);
        paramIndex++;
      }

      // Prefer successful outcomes
      whereConditions.push(`(sentiment = 'positive' OR outcome = 'success' OR sentiment IS NULL)`);

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        ${whereClause}
        ORDER BY created_at DESC,
                 CASE WHEN sentiment = 'positive' THEN 1
                      WHEN outcome = 'success' THEN 2
                      ELSE 3 END
        LIMIT 20
      `;

      const result = await pool.query(query, queryParams);
      console.log(`Fetched ${result.rows.length} relevant analyses for user goals`);

      const transformedRows = this.transformDatabaseRows(result.rows);

      // Add relevance scores
      return transformedRows.map(row => ({
        ...row,
        relevance_score: this.calculateRelevanceScore(
          JSON.parse(row.analysis_result),
          userGoals
        )
      }));

    } catch (error) {
      console.error('Error fetching relevant analyses:', error);
      return [];
    }
  }

  /**
   * Fetch user-specific analysis results
   * @param {number} userId - User ID to filter by
   * @param {number} limit - Number of recent analyses to fetch
   * @returns {Array} User's analysis results
   */
  async fetchUserSpecificAnalyses(userId, limit = 20) {
    try {
      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [userId, limit]);
      console.log(`Fetched ${result.rows.length} user-specific analysis results for user ${userId}`);

      return this.transformDatabaseRows(result.rows);
    } catch (error) {
      console.error('Error fetching user-specific analyses:', error);
      return [];
    }
  }

  /**
   * Fetch recent analyses as fallback
   * @param {number} limit - Number of recent analyses to fetch
   * @returns {Array} Recent analysis results
   */
  async fetchRecentAnalyses(limit = 10) {
    try {
      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      console.log(`Fetched ${result.rows.length} recent analysis results as fallback`);

      return this.transformDatabaseRows(result.rows);
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      return [];
    }
  }

  /**
   * Transform database rows to expected format
   * @param {Array} rows - Database rows
   * @returns {Array} Transformed analysis results
   */
  transformDatabaseRows(rows) {
    return rows.map(row => ({
      id: row.id,
      original_content: row.original_text,
      analysis_result: JSON.stringify({
        company_name: row.company,
        position_title: row.role,
        sentiment: row.sentiment,
        // JSONB columns are already objects - no parsing needed
        interview_topics: row.interview_topics || [],
        industry: row.industry,
        experience_level: row.experience_level,
        preparation_materials: row.preparation_materials || [],
        key_insights: row.key_insights || [],
        interview_stages: row.interview_stages || [],
        difficulty_level: row.difficulty_level,
        timeline: row.timeline,
        outcome: row.outcome
      }),
      created_at: row.created_at
    }));
  }

  /**
   * Calculate relevance score for an analysis based on user goals
   * @param {Object} analysis - Analysis result
   * @param {Object} userGoals - User goals
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(analysis, userGoals) {
    let score = 0;
    let factors = 0;

    // Company match (30% weight)
    if (userGoals.target_companies && userGoals.target_companies.length > 0) {
      factors++;
      if (userGoals.target_companies.includes(analysis.company_name)) {
        score += 0.3;
      }
    }

    // Role match (25% weight)
    if (userGoals.target_role && analysis.position_title) {
      factors++;
      if (analysis.position_title.toLowerCase().includes(userGoals.target_role.toLowerCase())) {
        score += 0.25;
      }
    }

    // Experience level match (20% weight)
    if (userGoals.current_level && analysis.experience_level) {
      factors++;
      if (analysis.experience_level === userGoals.current_level) {
        score += 0.2;
      }
    }

    // Positive outcome bonus (15% weight)
    factors++;
    if (analysis.sentiment === 'positive' || analysis.outcome === 'success') {
      score += 0.15;
    }

    // Recency bonus (10% weight)
    factors++;
    const daysSince = (new Date() - new Date(analysis.created_at)) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      score += 0.1 * (1 - daysSince / 30); // Decay over 30 days
    }

    return factors > 0 ? score : 0.1; // Minimum score for any analysis
  }
}

module.exports = new AnalysisDataService();