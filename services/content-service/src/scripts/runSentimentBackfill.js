/**
 * Script to run sentiment backfill
 *
 * Usage:
 *   node src/scripts/runSentimentBackfill.js
 *
 * This will analyze all scraped_posts that don't have sentiment data yet
 */

require('dotenv').config();
const sentimentBackfillService = require('../services/sentimentBackfillService');
const logger = require('../utils/logger');

async function main() {
  logger.info('');
  logger.info('╔══════════════════════════════════════════════════════════╗');
  logger.info('║        SENTIMENT ANALYSIS BACKFILL - BATCH PROCESSOR     ║');
  logger.info('╚══════════════════════════════════════════════════════════╝');
  logger.info('');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('');
    logger.info('[Main] 🛑 SIGINT received, stopping backfill gracefully...');
    sentimentBackfillService.stopBackfill();
  });

  process.on('SIGTERM', () => {
    logger.info('');
    logger.info('[Main] 🛑 SIGTERM received, stopping backfill gracefully...');
    sentimentBackfillService.stopBackfill();
  });

  try {
    await sentimentBackfillService.startBackfill();
    logger.info('[Main] ✅ Backfill completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[Main] ❌ Backfill failed:', error);
    process.exit(1);
  }
}

main();
