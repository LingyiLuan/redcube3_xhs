/**
 * Ingestion Controller - Phase 6: RAG Database
 * Handles webhook data ingestion from Apify actor and triggers embedding pipeline
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const { queueEmbeddingGeneration } = require('../queues/embeddingQueue');

/**
 * Webhook endpoint for Apify actor to push scraped data
 * POST /api/content/ingest/webhook
 *
 * Expected payload from Apify:
 * {
 *   "resource": {
 *     "defaultDatasetId": "dataset_id",
 *     "actorId": "actor_id",
 *     "actorRunId": "run_id"
 *   },
 *   "data": [
 *     {
 *       "postId": "reddit_post_id",
 *       "title": "Post title",
 *       "body": "Post body",
 *       "author": "username",
 *       ... (see existing agentService schema)
 *     }
 *   ]
 * }
 */
async function handleApifyWebhook(req, res) {
  const startTime = Date.now();

  try {
    const { resource, data } = req.body;

    // Validate webhook signature (if configured)
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-apify-webhook-signature'];
      if (!signature || signature !== webhookSecret) {
        logger.warn('[Ingestion] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    if (!data || !Array.isArray(data)) {
      logger.warn('[Ingestion] Invalid webhook payload - missing data array');
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    logger.info(`[Ingestion] Received webhook with ${data.length} posts from Apify run ${resource?.actorRunId}`);

    // Process each post and insert into database
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const post of data) {
      try {
        // Check if post already exists
        const existingPost = await pool.query(
          'SELECT id FROM scraped_posts WHERE post_id = $1',
          [post.postId]
        );

        if (existingPost.rows.length > 0) {
          skippedCount++;
          continue;
        }

        // Insert post with embedding_status = 'pending'
        await pool.query(`
          INSERT INTO scraped_posts (
            post_id, title, body_text, author, subreddit,
            score, num_comments, created_utc, permalink,
            url, is_self, link_flair_text,
            selftext, selftext_html,
            word_count, metadata,
            potential_outcome, confidence_score,
            scraped_at, embedding_status
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12,
            $13, $14,
            $15, $16,
            $17, $18,
            NOW(), 'pending'
          )
        `, [
          post.postId,
          post.title || '',
          post.body || post.selftext || '',
          post.author || 'unknown',
          post.subreddit || 'cscareerquestions',
          post.score || 0,
          post.num_comments || post.numComments || 0,
          post.created_utc || post.createdUtc || Math.floor(Date.now() / 1000),
          post.permalink || '',
          post.url || '',
          post.is_self !== undefined ? post.is_self : true,
          post.link_flair_text || post.linkFlairText || null,
          post.selftext || post.body || '',
          post.selftext_html || post.selftextHtml || null,
          post.wordCount || post.word_count || 0,
          JSON.stringify(post.metadata || {}),
          post.potentialOutcome || post.potential_outcome || null,
          post.confidenceScore || post.confidence_score || 0
        ]);

        insertedCount++;
      } catch (error) {
        logger.error(`[Ingestion] Error inserting post ${post.postId}:`, error.message);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;

    logger.info(`[Ingestion] Completed: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors (${duration}ms)`);

    // Trigger embedding generation job (async - don't wait)
    if (insertedCount > 0) {
      triggerEmbeddingPipeline(insertedCount).catch(err => {
        logger.error('[Ingestion] Failed to trigger embedding pipeline:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      errors: errorCount,
      duration_ms: duration
    });

  } catch (error) {
    logger.error('[Ingestion] Webhook handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Trigger embedding generation pipeline for pending posts
 * Queues a BullMQ job to generate embeddings asynchronously
 */
async function triggerEmbeddingPipeline(batchSize) {
  logger.info(`[Ingestion] Triggering embedding pipeline for ~${batchSize} new posts`);

  try {
    await queueEmbeddingGeneration({ batchSize });
    logger.info(`[Ingestion] Embedding job queued successfully`);
  } catch (error) {
    logger.error(`[Ingestion] Failed to queue embedding job:`, error);
    // Don't throw - embedding failure shouldn't block ingestion
  }
}

/**
 * Manual ingestion endpoint for testing
 * POST /api/content/ingest/manual
 * Body: { posts: [...] }
 */
async function manualIngest(req, res) {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts)) {
      return res.status(400).json({ error: 'posts array is required' });
    }

    // Use same handler as webhook
    const result = await handleApifyWebhook({ body: { data: posts }, headers: {} }, res);

  } catch (error) {
    logger.error('[Ingestion] Manual ingest error:', error);
    return res.status(500).json({
      error: 'Failed to ingest posts',
      message: error.message
    });
  }
}

/**
 * Get ingestion statistics
 * GET /api/content/ingest/stats
 */
async function getIngestionStats(req, res) {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE scraped_at >= NOW() - INTERVAL '24 hours') as posts_24h,
        COUNT(*) FILTER (WHERE scraped_at >= NOW() - INTERVAL '7 days') as posts_7d,
        COUNT(*) FILTER (WHERE embedding_status = 'pending') as pending_embeddings,
        COUNT(*) FILTER (WHERE embedding_status = 'completed') as completed_embeddings,
        COUNT(*) FILTER (WHERE embedding_status = 'failed') as failed_embeddings,
        MAX(scraped_at) as last_scrape,
        AVG(word_count) as avg_word_count
      FROM scraped_posts
    `);

    return res.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    logger.error('[Ingestion] Error fetching stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
}

module.exports = {
  handleApifyWebhook,
  manualIngest,
  getIngestionStats
};
