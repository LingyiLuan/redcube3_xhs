/**
 * Embedding Queue - Phase 6: Agent System
 * Job queue for processing embeddings asynchronously
 */

const { Queue } = require('bullmq');
const { defaultQueueOptions } = require('./config');
const logger = require('../utils/logger');

// Create embedding queue
const embeddingQueue = new Queue('embeddings', defaultQueueOptions);

/**
 * Add a job to generate embeddings for pending posts
 */
async function queueEmbeddingGeneration(data = {}) {
  const { batchSize = 100, priority = 1 } = data;

  try {
    const job = await embeddingQueue.add(
      'generate-embeddings',
      { batchSize },
      {
        priority, // Lower number = higher priority
        jobId: `embedding-batch-${Date.now()}` // Prevent duplicate jobs
      }
    );

    logger.info(`[EmbeddingQueue] Job queued: ${job.id}`);
    return job;

  } catch (error) {
    logger.error('[EmbeddingQueue] Failed to queue job:', error);
    throw error;
  }
}

/**
 * Add a job to generate embeddings for specific posts
 */
async function queueSpecificPosts(postIds) {
  try {
    const job = await embeddingQueue.add(
      'generate-specific-posts',
      { postIds },
      {
        priority: 0, // High priority for specific requests
        jobId: `embedding-posts-${postIds.join('-')}`
      }
    );

    logger.info(`[EmbeddingQueue] Specific posts job queued: ${job.id}`);
    return job;

  } catch (error) {
    logger.error('[EmbeddingQueue] Failed to queue specific posts:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      embeddingQueue.getWaitingCount(),
      embeddingQueue.getActiveCount(),
      embeddingQueue.getCompletedCount(),
      embeddingQueue.getFailedCount(),
      embeddingQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };

  } catch (error) {
    logger.error('[EmbeddingQueue] Failed to get stats:', error);
    throw error;
  }
}

/**
 * Clean old jobs
 */
async function cleanQueue(grace = 24 * 3600 * 1000) {
  try {
    const cleaned = await embeddingQueue.clean(grace, 1000);
    logger.info(`[EmbeddingQueue] Cleaned ${cleaned.length} old jobs`);
    return cleaned;

  } catch (error) {
    logger.error('[EmbeddingQueue] Failed to clean queue:', error);
    throw error;
  }
}

module.exports = {
  embeddingQueue,
  queueEmbeddingGeneration,
  queueSpecificPosts,
  getQueueStats,
  cleanQueue
};
