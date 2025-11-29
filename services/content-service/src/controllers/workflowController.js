const { analyzeWorkflowIntent } = require('../services/workflowIntentService');
const { semanticSearch } = require('../services/embeddingService');

/**
 * Parse user's workflow search intent
 * POST /api/content/workflow/parse-intent
 * Body: { query: string }
 */
async function parseIntent(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    console.log('[WorkflowController] Parsing intent for query:', query);

    const result = await analyzeWorkflowIntent(query);

    // Add the simplified searchQuery to the response for frontend to use
    if (result.success && result.intent && result.intent.searchQuery) {
      console.log('[WorkflowController] LLM reformulated query:', result.intent.searchQuery);
    }

    return res.json(result);

  } catch (error) {
    console.error('[WorkflowController] Error parsing intent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse intent',
      message: error.message
    });
  }
}

/**
 * Search posts using RAG (semantic search with entity filters)
 * POST /api/content/workflow/search-posts
 * Body: {
 *   query: string,
 *   entities: { companies, roles, levels, outcomeFilter, qualityFilter },
 *   limit: number (default 20),
 *   timeFilter: string (default '1year') - '3months', '6months', '1year', '2years', 'all'
 * }
 */
async function searchPosts(req, res) {
  try {
    const { query, entities = {}, limit = 20, timeFilter = '1year' } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    console.log('[WorkflowController] Searching posts for query:', query);
    console.log('[WorkflowController] Entities:', entities);
    console.log('[WorkflowController] Time filter:', timeFilter);

    // Use semantic search with entity filters
    // NOTE: Don't filter by role here - the embedding search already captures semantic meaning
    // Role filtering would require exact database matches (e.g., "SWE" vs "SDE" mismatch issues)
    // BUT we DO prioritize by company - that's stored consistently in metadata
    const posts = await semanticSearch(query, {
      matchCount: limit,
      filterRole: null, // Disabled - embedding search handles this semantically
      filterOutcome: entities.outcomeFilter || null,
      filterCompany: entities.companies && entities.companies.length > 0 ? entities.companies[0] : null,
      timeFilter: timeFilter
    });

    console.log('[WorkflowController] Found', posts.length, 'posts');

    // Add Reddit URLs to posts
    const postsWithUrls = posts.map(post => ({
      ...post,
      url: `https://reddit.com/r/cscareerquestions/comments/${post.post_id}`
    }));

    return res.json({
      success: true,
      posts: postsWithUrls,
      count: postsWithUrls.length,
      query,
      entities
    });

  } catch (error) {
    console.error('[WorkflowController] Error searching posts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search posts',
      message: error.message
    });
  }
}

module.exports = {
  parseIntent,
  searchPosts
};
