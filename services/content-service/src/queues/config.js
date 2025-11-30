/**
 * Queue Configuration - Phase 6: Agent System
 * BullMQ configuration for job queues
 */

const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection configuration
// Use REDIS_URL if available (Railway managed Redis with password)
// Fallback to REDIS_HOST/REDIS_PORT for local development
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null
    });

// Default queue options
const defaultQueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 25s, 125s
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs
      age: 24 * 3600 // Keep jobs for 24 hours
    },
    removeOnFail: {
      count: 5000 // Keep last 5000 failed jobs for debugging
    }
  }
};

module.exports = {
  connection,
  defaultQueueOptions
};
