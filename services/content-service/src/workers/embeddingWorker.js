/**
 * Embedding Worker - Phase 6: Agent System
 * Background worker that processes embedding generation jobs
 */

const { Worker } = require('bullmq');
const { connection } = require('../queues/config');
const {
  generatePendingEmbeddings,
  generateEmbeddingsForPosts
} = require('../services/embeddingService');
const logger = require('../utils/logger');

// Create worker
const embeddingWorker = new Worker(
  'embeddings',
  async (job) => {
    const { name, data } = job;

    logger.info(`[EmbeddingWorker] Processing job ${job.id}: ${name}`);

    try {
      let result;

      switch (name) {
        case 'generate-embeddings':
          // Process batch of pending embeddings
          result = await generatePendingEmbeddings();
          logger.info(`[EmbeddingWorker] Batch complete: ${result.succeeded} succeeded, ${result.failed} failed`);
          break;

        case 'generate-specific-posts':
          // Process specific posts
          result = await generateEmbeddingsForPosts(data.postIds);
          logger.info(`[EmbeddingWorker] Specific posts complete: ${result.succeeded} succeeded, ${result.failed} failed`);
          break;

        default:
          throw new Error(`Unknown job type: ${name}`);
      }

      return result;

    } catch (error) {
      logger.error(`[EmbeddingWorker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process 2 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000 // Per 60 seconds (to respect OpenAI rate limits)
    }
  }
);

// Event listeners
embeddingWorker.on('completed', (job, result) => {
  logger.info(`[EmbeddingWorker] Job ${job.id} completed:`, result);
});

embeddingWorker.on('failed', (job, error) => {
  logger.error(`[EmbeddingWorker] Job ${job.id} failed:`, error.message);
});

embeddingWorker.on('error', (error) => {
  logger.error('[EmbeddingWorker] Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('[EmbeddingWorker] SIGTERM received, closing worker...');
  await embeddingWorker.close();
  process.exit(0);
});

logger.info('[EmbeddingWorker] Worker started and ready to process jobs');

module.exports = embeddingWorker;
