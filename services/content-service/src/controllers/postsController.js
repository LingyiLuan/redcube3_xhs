/**
 * Posts Controller
 * Handles API endpoints for fetching post data
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/content/posts/batch
 * Fetch multiple posts by IDs
 *
 * Request body: { postIds: string[] }
 * Response: { success: boolean, posts: SourcePost[] }
 */
async function getBatchPosts(req, res) {
  try {
    const { postIds } = req.body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'postIds must be a non-empty array'
      });
    }

    logger.info(`[PostsController] Fetching ${postIds.length} posts`);

    // Query posts with relevant fields for the Source Posts Modal
    const query = `
      SELECT
        p.post_id,
        p.title,
        p.llm_company as company,
        p.llm_role as role_type,
        p.llm_experience_level as level,
        p.outcome,
        p.url,
        SUBSTRING(p.body_text, 1, 200) as excerpt
      FROM scraped_posts p
      WHERE p.post_id = ANY($1)
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, [postIds]);

    logger.info(`[PostsController] Found ${result.rows.length} posts`);

    // Transform to match SourcePost interface
    const posts = result.rows.map(row => ({
      post_id: row.post_id,
      title: row.title || 'Untitled Post',
      company: row.company || undefined,
      role_type: row.role_type || undefined,
      level: row.level || undefined,
      outcome: row.outcome || undefined,
      url: row.url || undefined,
      excerpt: row.excerpt ? row.excerpt.trim() + '...' : undefined
    }));

    res.json({
      success: true,
      posts
    });

  } catch (error) {
    logger.error('[PostsController] Error fetching batch posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
      message: error.message
    });
  }
}

module.exports = {
  getBatchPosts
};
