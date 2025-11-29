/**
 * Labeling Controller
 * Handles API endpoints for human verification and labeling workflow
 */

const pool = require('../config/database');

/**
 * GET /api/content/labeling/pending
 * Get posts pending human verification/labeling
 */
async function getPendingPosts(req, res) {
  try {
    const {
      limit = 20,
      offset = 0,
      role_type,
      level,
      company,
      subreddit
    } = req.query;

    let query = `
      SELECT
        id, post_id, title, author, created_at, url,
        body_text, subreddit, word_count,
        -- Auto-extracted metadata
        role_type, role_category, level, level_label, experience_years,
        metadata->>'company' as company,
        interview_stage, outcome, tech_stack, primary_language,
        interview_topics, preparation,
        -- Labeling status
        labeling_status, labeled_at, labeled_by,
        verified_outcome,
        jsonb_array_length(COALESCE(comments, '[]'::jsonb)) as comment_count
      FROM scraped_posts
      WHERE labeling_status = 'pending'
    `;

    const params = [];
    let paramCount = 1;

    if (role_type) {
      query += ` AND role_type = $${paramCount++}`;
      params.push(role_type);
    }

    if (level) {
      query += ` AND level = $${paramCount++}`;
      params.push(level);
    }

    if (company) {
      query += ` AND metadata->>'company' = $${paramCount++}`;
      params.push(company);
    }

    if (subreddit) {
      query += ` AND subreddit = $${paramCount++}`;
      params.push(subreddit);
    }

    query += ` ORDER BY scraped_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM scraped_posts WHERE labeling_status = \'pending\'';
    const countParams = [];
    let countParamCount = 1;

    if (role_type) {
      countQuery += ` AND role_type = $${countParamCount++}`;
      countParams.push(role_type);
    }

    if (level) {
      countQuery += ` AND level = $${countParamCount++}`;
      countParams.push(level);
    }

    if (company) {
      countQuery += ` AND metadata->>'company' = $${countParamCount++}`;
      countParams.push(company);
    }

    if (subreddit) {
      countQuery += ` AND subreddit = $${countParamCount}`;
      countParams.push(subreddit);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalPending = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        posts: result.rows,
        totalPending,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending posts',
      message: error.message
    });
  }
}

/**
 * POST /api/content/labeling/:postId/label
 * Submit human verification label for a post
 */
async function labelPost(req, res) {
  try {
    const { postId } = req.params;
    const {
      verified_outcome, // 'positive', 'negative', 'neutral'
      verified_role_type,
      verified_level,
      verified_company,
      verified_interview_stage,
      verified_tech_stack,
      notes,
      labeled_by = 1 // TODO: Use actual user ID from auth
    } = req.body;

    // Validate required field
    if (!verified_outcome) {
      return res.status(400).json({
        success: false,
        error: 'verified_outcome is required'
      });
    }

    const updateQuery = `
      UPDATE scraped_posts
      SET
        labeling_status = 'verified',
        verified_outcome = $1,
        labeled_at = NOW(),
        labeled_by = $2,
        -- Update verified fields if provided
        role_type = COALESCE($3, role_type),
        level = COALESCE($4, level),
        interview_stage = COALESCE($5, interview_stage),
        tech_stack = COALESCE($6, tech_stack),
        metadata = metadata || jsonb_build_object('labeling_notes', $7::text, 'verified_company', $8::text)
      WHERE id = $9
      RETURNING id, post_id, title, labeling_status, verified_outcome
    `;

    const result = await pool.query(updateQuery, [
      verified_outcome,
      labeled_by,
      verified_role_type || null,
      verified_level || null,
      verified_interview_stage || null,
      verified_tech_stack || null,
      notes || null,
      verified_company || null,
      postId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    console.log(`✅ [LABELING] Post ${result.rows[0].post_id} labeled as ${verified_outcome} by ${labeled_by}`);

    res.json({
      success: true,
      message: 'Post labeled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error labeling post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to label post',
      message: error.message
    });
  }
}

/**
 * POST /api/content/labeling/:postId/skip
 * Skip a post (mark as reviewed but not labeled)
 */
async function skipPost(req, res) {
  try {
    const { postId } = req.params;
    const { reason = 'skipped' } = req.body;

    const updateQuery = `
      UPDATE scraped_posts
      SET
        labeling_status = 'skipped',
        metadata = metadata || jsonb_build_object('skip_reason', $1, 'skipped_at', NOW())
      WHERE id = $2
      RETURNING id, post_id, title
    `;

    const result = await pool.query(updateQuery, [reason, postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post skipped',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error skipping post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to skip post',
      message: error.message
    });
  }
}

/**
 * GET /api/content/labeling/stats
 * Get labeling progress statistics
 */
async function getLabelingStats(req, res) {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE labeling_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE labeling_status = 'verified') as verified_count,
        COUNT(*) FILTER (WHERE labeling_status = 'skipped') as skipped_count,
        COUNT(*) FILTER (WHERE verified_outcome = 'positive') as positive_count,
        COUNT(*) FILTER (WHERE verified_outcome = 'negative') as negative_count,
        COUNT(*) FILTER (WHERE verified_outcome = 'neutral') as neutral_count,
        COUNT(*) as total_posts
      FROM scraped_posts
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    // Get labeling progress by role
    const roleStatsQuery = `
      SELECT
        role_type,
        COUNT(*) FILTER (WHERE labeling_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE labeling_status = 'verified') as verified
      FROM scraped_posts
      WHERE role_type IS NOT NULL
      GROUP BY role_type
      ORDER BY verified DESC
      LIMIT 10
    `;

    const roleStats = await pool.query(roleStatsQuery);

    res.json({
      success: true,
      data: {
        overall: {
          totalPosts: parseInt(stats.total_posts),
          pending: parseInt(stats.pending_count),
          verified: parseInt(stats.verified_count),
          skipped: parseInt(stats.skipped_count),
          verificationRate: stats.total_posts > 0
            ? ((parseInt(stats.verified_count) / parseInt(stats.total_posts)) * 100).toFixed(1)
            : 0
        },
        outcomes: {
          positive: parseInt(stats.positive_count),
          negative: parseInt(stats.negative_count),
          neutral: parseInt(stats.neutral_count)
        },
        byRole: roleStats.rows
      }
    });
  } catch (error) {
    console.error('Error fetching labeling stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}

module.exports = {
  getPendingPosts,
  labelPost,
  skipPost,
  getLabelingStats
};
