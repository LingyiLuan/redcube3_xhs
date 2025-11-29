/**
 * Embedding Controller - Phase 6: RAG Database
 * Handles embedding generation and semantic search endpoints
 */

const {
  getEmbeddingStats,
  semanticSearch
} = require('../services/embeddingService');
const {
  queueEmbeddingGeneration,
  queueSpecificPosts,
  getQueueStats
} = require('../queues/embeddingQueue');
const logger = require('../utils/logger');

/**
 * Trigger embedding generation for pending posts
 * POST /api/content/embeddings/generate
 * Queues a job instead of processing immediately
 */
async function triggerEmbeddingGeneration(req, res) {
  try {
    logger.info('[Embeddings API] Manual trigger received');

    const { batchSize = 100 } = req.body;
    const job = await queueEmbeddingGeneration({ batchSize });

    return res.json({
      success: true,
      message: 'Embedding generation job queued',
      jobId: job.id,
      batchSize
    });

  } catch (error) {
    logger.error('[Embeddings API] Queue error:', error);
    return res.status(500).json({
      error: 'Failed to queue embedding generation',
      message: error.message
    });
  }
}

/**
 * Generate embeddings for specific posts
 * POST /api/content/embeddings/posts
 * Body: { postIds: ["post1", "post2"] }
 */
async function generateForSpecificPosts(req, res) {
  try {
    const { postIds } = req.body;

    if (!postIds || !Array.isArray(postIds)) {
      return res.status(400).json({ error: 'postIds array is required' });
    }

    const job = await queueSpecificPosts(postIds);

    return res.json({
      success: true,
      message: 'Embedding job queued for specific posts',
      jobId: job.id,
      postCount: postIds.length
    });

  } catch (error) {
    logger.error('[Embeddings API] Queue error:', error);
    return res.status(500).json({
      error: 'Failed to queue embedding generation',
      message: error.message
    });
  }
}

/**
 * Get embedding statistics
 * GET /api/content/embeddings/stats
 */
async function getStats(req, res) {
  try {
    const [dbStats, queueStats] = await Promise.all([
      getEmbeddingStats(),
      getQueueStats()
    ]);

    return res.json({
      success: true,
      database: dbStats,
      queue: queueStats
    });

  } catch (error) {
    logger.error('[Embeddings API] Stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
}

/**
 * Semantic search endpoint
 * POST /api/content/embeddings/search
 * Body: {
 *   query: "Google system design interview",
 *   matchThreshold: 0.7,
 *   matchCount: 10,
 *   filterRole: "SWE",
 *   filterLevel: "L4",
 *   filterOutcome: "offer"
 * }
 */
async function search(req, res) {
  try {
    const {
      query,
      matchThreshold,
      matchCount,
      filterRole,
      filterLevel,
      filterOutcome
    } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query string is required' });
    }

    const results = await semanticSearch(query, {
      matchThreshold,
      matchCount,
      filterRole,
      filterLevel,
      filterOutcome
    });

    return res.json({
      success: true,
      query,
      results,
      count: results.length
    });

  } catch (error) {
    logger.error('[Embeddings API] Search error:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
}

module.exports = {
  triggerEmbeddingGeneration,
  generateForSpecificPosts,
  getStats,
  search
};
