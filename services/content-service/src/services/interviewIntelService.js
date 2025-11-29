/**
 * Interview Intel Service
 *
 * Core business logic for managing user-generated interview experiences
 * with citation tracking and reputation system.
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

/**
 * Create a new interview experience
 */
async function createExperience(experienceData) {
  const {
    userId,
    company,
    role,
    interviewDate,
    difficulty,
    outcome,
    questionsAsked,
    preparationFeedback,
    tipsForOthers,
    areasStruggled
  } = experienceData;

  try {
    const query = `
      INSERT INTO interview_experiences (
        user_id,
        company,
        role,
        interview_date,
        difficulty,
        outcome,
        questions_asked,
        preparation_feedback,
        tips_for_others,
        areas_struggled,
        verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      userId,
      company,
      role,
      interviewDate || null,
      difficulty,
      outcome,
      questionsAsked || [],
      preparationFeedback || '',
      tipsForOthers || '',
      areasStruggled || [],
      false // Email verification required before setting to true
    ];

    const result = await pool.query(query, values);
    const experience = result.rows[0];

    // Initialize user reputation if doesn't exist
    await initializeUserReputation(userId);

    // Award points for posting experience (will be added after email verification)
    logger.info(`[InterviewIntel] Created experience ${experience.id} for user ${userId}`);

    return {
      success: true,
      experience
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error creating experience:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get experiences with filters and pagination
 */
async function getExperiences(filters = {}, pagination = {}) {
  const {
    company,
    role,
    difficulty,
    outcome,
    minDifficulty,
    maxDifficulty,
    startDate,
    endDate,
    verified
  } = filters;

  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = pagination;

  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT
        ie.*,
        u.email as author_email,
        ur.tier as author_tier,
        ur.total_points as author_reputation
      FROM interview_experiences ie
      LEFT JOIN users u ON ie.user_id = u.id
      LEFT JOIN user_reputation ur ON ie.user_id = ur.user_id
      WHERE ie.deleted_at IS NULL
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (company) {
      query += ` AND LOWER(ie.company) = LOWER($${paramIndex})`;
      queryParams.push(company);
      paramIndex++;
    }

    if (role) {
      query += ` AND LOWER(ie.role) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${role}%`);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND ie.difficulty = $${paramIndex}`;
      queryParams.push(difficulty);
      paramIndex++;
    }

    if (minDifficulty) {
      query += ` AND ie.difficulty >= $${paramIndex}`;
      queryParams.push(minDifficulty);
      paramIndex++;
    }

    if (maxDifficulty) {
      query += ` AND ie.difficulty <= $${paramIndex}`;
      queryParams.push(maxDifficulty);
      paramIndex++;
    }

    if (outcome) {
      query += ` AND ie.outcome = $${paramIndex}`;
      queryParams.push(outcome);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND ie.interview_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ie.interview_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    if (verified !== undefined) {
      query += ` AND ie.verified = $${paramIndex}`;
      queryParams.push(verified);
      paramIndex++;
    }

    // Sorting
    const allowedSortFields = ['created_at', 'citation_count', 'impact_score', 'upvotes', 'difficulty'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ie.${sortField} ${order}`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM interview_experiences WHERE deleted_at IS NULL`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

    return {
      success: true,
      experiences: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error getting experiences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get a single experience by ID
 */
async function getExperienceById(experienceId) {
  try {
    const query = `
      SELECT
        ie.*,
        u.email as author_email,
        ur.tier as author_tier,
        ur.total_points as author_reputation,
        ur.total_citations_received as author_total_citations
      FROM interview_experiences ie
      LEFT JOIN users u ON ie.user_id = u.id
      LEFT JOIN user_reputation ur ON ie.user_id = ur.user_id
      WHERE ie.id = $1 AND ie.deleted_at IS NULL
    `;

    const result = await pool.query(query, [experienceId]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Experience not found'
      };
    }

    // Increment view count
    await pool.query(
      'UPDATE interview_experiences SET views = views + 1 WHERE id = $1',
      [experienceId]
    );

    return {
      success: true,
      experience: result.rows[0]
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error getting experience:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get citations for an experience (which learning maps referenced it)
 */
async function getExperienceCitations(experienceId) {
  try {
    const query = `
      SELECT
        lmc.id,
        lmc.created_at,
        lmc.citation_type,
        lm.id as learning_map_id,
        lm.title as learning_map_title,
        u.email as user_email
      FROM learning_map_citations lmc
      JOIN learning_maps lm ON lmc.learning_map_id = lm.id
      LEFT JOIN users u ON lm.user_id = u.id
      WHERE lmc.interview_experience_id = $1
      ORDER BY lmc.created_at DESC
    `;

    const result = await pool.query(query, [experienceId]);

    return {
      success: true,
      citations: result.rows,
      count: result.rows.length
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error getting citations:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upvote an experience
 */
async function voteExperience(experienceId, userId, voteType) {
  try {
    // Check if user already voted
    const existingVote = await pool.query(
      'SELECT * FROM experience_votes WHERE interview_experience_id = $1 AND user_id = $2',
      [experienceId, userId]
    );

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        'UPDATE experience_votes SET vote_type = $1, updated_at = CURRENT_TIMESTAMP WHERE interview_experience_id = $2 AND user_id = $3',
        [voteType, experienceId, userId]
      );
    } else {
      // Create new vote
      await pool.query(
        'INSERT INTO experience_votes (interview_experience_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [experienceId, userId, voteType]
      );
    }

    // Get updated vote counts and author info
    const experience = await pool.query(
      'SELECT user_id, upvotes, downvotes, helpfulness_ratio FROM interview_experiences WHERE id = $1',
      [experienceId]
    );

    return {
      success: true,
      authorId: experience.rows[0].user_id,
      voteType,
      upvotes: experience.rows[0].upvotes,
      downvotes: experience.rows[0].downvotes,
      helpfulness_ratio: experience.rows[0].helpfulness_ratio
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error voting on experience:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's own experiences
 */
async function getUserExperiences(userId) {
  try {
    const query = `
      SELECT
        ie.*,
        (SELECT COUNT(*) FROM learning_map_citations WHERE interview_experience_id = ie.id) as citation_count
      FROM interview_experiences ie
      WHERE ie.user_id = $1 AND ie.deleted_at IS NULL
      ORDER BY ie.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    return {
      success: true,
      experiences: result.rows
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error getting user experiences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Initialize user reputation if doesn't exist
 */
async function initializeUserReputation(userId) {
  try {
    await pool.query(
      `INSERT INTO user_reputation (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  } catch (error) {
    logger.error('[InterviewIntel] Error initializing user reputation:', error);
  }
}

/**
 * Get trending experiences (most cited in last 30 days)
 */
async function getTrendingExperiences(limit = 10) {
  try {
    const query = `
      SELECT * FROM v_trending_experiences
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    return {
      success: true,
      experiences: result.rows
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error getting trending experiences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search experiences by keywords (full-text search)
 */
async function searchExperiences(searchQuery, limit = 20) {
  try {
    const query = `
      SELECT
        ie.*,
        u.email as author_email,
        ur.tier as author_tier
      FROM interview_experiences ie
      LEFT JOIN users u ON ie.user_id = u.id
      LEFT JOIN user_reputation ur ON ie.user_id = ur.user_id
      WHERE ie.deleted_at IS NULL
        AND (
          LOWER(ie.company) LIKE LOWER($1)
          OR LOWER(ie.role) LIKE LOWER($1)
          OR LOWER(ie.preparation_feedback) LIKE LOWER($1)
          OR LOWER(ie.tips_for_others) LIKE LOWER($1)
          OR EXISTS (
            SELECT 1 FROM unnest(ie.questions_asked) q
            WHERE LOWER(q) LIKE LOWER($1)
          )
        )
      ORDER BY ie.impact_score DESC, ie.citation_count DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [`%${searchQuery}%`, limit]);

    return {
      success: true,
      experiences: result.rows,
      count: result.rows.length
    };

  } catch (error) {
    logger.error('[InterviewIntel] Error searching experiences:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Record citation of an experience (when analyzed in workflow)
 */
async function citeExperience(experienceId, userId, workflowId, analysisType) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert citation record
    const citationQuery = `
      INSERT INTO experience_analysis_history (
        experience_id,
        analyzed_by_user_id,
        workflow_id,
        analysis_type
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    await client.query(citationQuery, [experienceId, userId, workflowId, analysisType]);

    // Update experience citation count and last_analyzed_at, get author ID
    const updateQuery = `
      UPDATE interview_experiences
      SET
        analysis_usage_count = analysis_usage_count + 1,
        last_analyzed_at = NOW()
      WHERE id = $1
      RETURNING analysis_usage_count, last_analyzed_at, user_id
    `;

    const result = await client.query(updateQuery, [experienceId]);

    await client.query('COMMIT');

    logger.info(`[InterviewIntel] Experience ${experienceId} cited by user ${userId}`);

    return {
      success: true,
      authorId: result.rows[0].user_id,
      citationCount: result.rows[0].analysis_usage_count,
      lastAnalyzedAt: result.rows[0].last_analyzed_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[InterviewIntel] Error citing experience:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
}

module.exports = {
  createExperience,
  getExperiences,
  getExperienceById,
  getExperienceCitations,
  voteExperience,
  getUserExperiences,
  getTrendingExperiences,
  searchExperiences,
  citeExperience
};
