/**
 * Scheduler Service - Consolidated
 * Automated scheduling for scraping, embeddings, NLP, and briefings
 */

const cron = require('node-cron');
const agentService = require('./agentService');
const hackerNewsService = require('./hackerNewsService');
const devtoService = require('./devtoService');
const mediumService = require('./mediumService');
const backfillService = require('./backfillService');
const targetedCompanyScraper = require('./targetedCompanyScraper');
const { queueEmbeddingGeneration } = require('../queues/embeddingQueue');
const { refreshAllBenchmarkCaches } = require('./benchmarkCacheService');
const trendingService = require('./trendingService');
const logger = require('../utils/logger');

// Store active cron jobs
let scraperJob = null;
let backfillJob = null;
let embeddingJob = null;
let weeklyBriefingsJob = null;
let dailyDataCollectionJob = null;
let targetedScraperJob = null;
let benchmarkCacheJob = null;
let trendingScoresJob = null;

/**
 * Start automated scraping scheduler with parallel scraping and rotation strategy
 * Default: Every 30 minutes
 * Scrapes ALL sources in parallel (4 Reddit + Hacker News)
 * Rotates through different sort strategies to get comprehensive coverage
 */
function startScraperSchedule(schedule = '*/30 * * * *') {
  if (scraperJob) {
    logger.warn('[Scheduler] Scraper job already running');
    return;
  }

  // All data sources to scrape in parallel (8 high-quality subreddits)
  const REDDIT_SOURCES = [
    'cscareerquestions',   // General career advice, high volume (3M+ members)
    'ExperiencedDevs',     // Senior engineers, complex interviews (200K+ members)
    'csMajors',            // Students, new grads, internships (200K+ members)
    'leetcode',            // Interview prep, company experiences (300K+ members)
    'techinterviews',      // Dedicated interview discussion (50K+ members)
    'codinginterview',     // Coding interview focus (20K+ members)
    'datascience',         // Data science interviews, ML roles (1M+ members)
    'MachineLearning'      // ML engineer interviews, research roles (2.8M+ members)
    // Removed 'FAANG' - subreddit doesn't exist (404 errors)
  ];

  // Rotation strategy: cycle through different sort methods
  // This ensures we get ALL posts over time, not just duplicates
  const SCRAPE_STRATEGIES = [
    { sortBy: 'new', timeFilter: 'all', label: 'NEW' },           // Fresh posts
    { sortBy: 'top', timeFilter: 'day', label: 'TOP:DAY' },       // Today's best
    { sortBy: 'top', timeFilter: 'week', label: 'TOP:WEEK' },     // This week
    { sortBy: 'top', timeFilter: 'month', label: 'TOP:MONTH' },   // This month
    { sortBy: 'hot', timeFilter: 'all', label: 'HOT' },           // Trending
    { sortBy: 'rising', timeFilter: 'all', label: 'RISING' }      // Gaining traction
  ];

  let rotationIndex = 0;

  scraperJob = cron.schedule(schedule, async () => {
    // Get current strategy
    const currentStrategy = SCRAPE_STRATEGIES[rotationIndex % SCRAPE_STRATEGIES.length];
    rotationIndex++;

    logger.info(`[Scheduler] 🕷️ PARALLEL scraping (every 30 min) - Strategy ${rotationIndex}: ${currentStrategy.label}`);
    const startTime = Date.now();

    try {
      // Create all scraping promises to run in parallel
      const scrapingPromises = [];

      // 1. Reddit - all 7 subreddits in parallel with current strategy
      // Increased from 100 to 500 posts per subreddit for faster database growth
      REDDIT_SOURCES.forEach(subreddit => {
        const promise = agentService.scrapeNewInterviewData({
          subreddit,
          numberOfPosts: 500,  // Increased from 100 to 500
          sortBy: currentStrategy.sortBy,
          timeFilter: currentStrategy.timeFilter
        })
        .then(scrapedData => {
          logger.info(`[Scheduler] 📥 Reddit r/${subreddit}: ${scrapedData.length} posts fetched`);
          return agentService.saveScrapedData(scrapedData);
        })
        .then(savedCount => {
          logger.info(`[Scheduler] ✅ Reddit r/${subreddit}: ${savedCount} posts saved`);
          return { source: `reddit:${subreddit}`, count: savedCount };
        })
        .catch(error => {
          logger.error(`[Scheduler] ❌ Reddit r/${subreddit} failed:`, error.message);
          return { source: `reddit:${subreddit}`, count: 0, error: error.message };
        });

        scrapingPromises.push(promise);
      });

      // 2. Hacker News in parallel (increased volume)
      const hnPromise = hackerNewsService.scrapeInterviewData({
        query: 'interview experience OR technical interview OR job interview',
        numberOfPosts: 200,  // Increased from 50 to 200
        dateRange: 'past_week'
      })
      .then(hnPosts => {
        logger.info(`[Scheduler] 📥 Hacker News: ${hnPosts.length} posts fetched`);
        return agentService.saveScrapedData(hnPosts);
      })
      .then(savedCount => {
        logger.info(`[Scheduler] ✅ Hacker News: ${savedCount} posts saved`);
        return { source: 'hackernews', count: savedCount };
      })
      .catch(error => {
        logger.error(`[Scheduler] ❌ Hacker News failed:`, error.message);
        return { source: 'hackernews', count: 0, error: error.message };
      });

      scrapingPromises.push(hnPromise);

      // 3. Dev.to in parallel (FREE official API!)
      const devtoPromise = devtoService.scrapeDevToArticles({
        tags: ['interview', 'career', 'hiring', 'jobsearch', 'coding-interview', 'system-design'],
        numberOfPosts: 300  // Increased from 50 to 300 with more tags
      })
      .then(devtoPosts => {
        logger.info(`[Scheduler] 📥 Dev.to: ${devtoPosts.length} posts fetched`);
        return agentService.saveScrapedData(devtoPosts);
      })
      .then(savedCount => {
        logger.info(`[Scheduler] ✅ Dev.to: ${savedCount} posts saved`);
        return { source: 'devto', count: savedCount };
      })
      .catch(error => {
        logger.error(`[Scheduler] ❌ Dev.to failed:`, error.message);
        return { source: 'devto', count: 0, error: error.message };
      });

      scrapingPromises.push(devtoPromise);

      // 4. Medium RSS in parallel (expanded tags for more coverage)
      const mediumPromise = mediumService.scrapeMediumArticles({
        tags: ['interview', 'tech-interview', 'coding-interview', 'job-interview',
               'software-engineering', 'career', 'faang', 'system-design', 'leetcode'],
        numberOfPosts: 225 // 25 posts × 9 tags = ~225 posts
      })
      .then(mediumPosts => {
        logger.info(`[Scheduler] 📥 Medium: ${mediumPosts.length} posts fetched`);
        return agentService.saveScrapedData(mediumPosts);
      })
      .then(savedCount => {
        logger.info(`[Scheduler] ✅ Medium: ${savedCount} posts saved`);
        return { source: 'medium', count: savedCount };
      })
      .catch(error => {
        logger.error(`[Scheduler] ❌ Medium failed:`, error.message);
        return { source: 'medium', count: 0, error: error.message };
      });

      scrapingPromises.push(mediumPromise);

      // Discord scraping disabled (no bot permissions yet)
      // To enable: Add DISCORD_BOT_TOKEN and DISCORD_SERVER_IDS to .env
      // See DISCORD_BOT_SETUP.md for instructions

      // Wait for all sources to complete in parallel
      const results = await Promise.all(scrapingPromises);

      // Calculate totals
      const totalSaved = results.reduce((sum, r) => sum + r.count, 0);
      const successCount = results.filter(r => !r.error).length;
      const failCount = results.filter(r => r.error).length;
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

      logger.info(`[Scheduler] 🎉 PARALLEL SCRAPING COMPLETE in ${elapsedTime}s`);
      logger.info(`[Scheduler] 📊 Total saved: ${totalSaved} posts`);
      logger.info(`[Scheduler] ✅ Success: ${successCount}/${results.length} sources`);
      if (failCount > 0) {
        logger.warn(`[Scheduler] ⚠️ Failed: ${failCount}/${results.length} sources`);
      }

      // Log per-source results
      results.forEach(r => {
        const status = r.error ? '❌' : '✅';
        const msg = r.error ? `(${r.error})` : `(${r.count} posts)`;
        logger.info(`[Scheduler]   ${status} ${r.source}: ${msg}`);
      });

    } catch (error) {
      logger.error('[Scheduler] ❌ Parallel scraping failed:', error.message);
    }
  }, {
    scheduled: true
  });

  logger.info(`[Scheduler] Scraper schedule started: ${schedule} (PARALLEL + ROTATION: 7 Reddit + HN + Dev.to + Medium, every 30 min)`);
}

/**
 * Start automated embedding generation scheduler
 * Default: Every hour
 */
function startEmbeddingSchedule(schedule = '0 * * * *') {
  if (embeddingJob) {
    logger.warn('[Scheduler] Embedding job already running');
    return;
  }

  embeddingJob = cron.schedule(schedule, async () => {
    logger.info('[Scheduler] Triggering automated embedding generation');

    try {
      await queueEmbeddingGeneration({ batchSize: 100 });
      logger.info('[Scheduler] Embedding job queued successfully');

    } catch (error) {
      logger.error('[Scheduler] Automated embedding generation failed:', error.message);
    }
  }, {
    scheduled: true
  });

  logger.info(`[Scheduler] Embedding schedule started: ${schedule} (every hour)`);
}

/**
 * Start benchmark cache pre-computation scheduler
 * Runs daily at 2:00 AM PST to refresh all benchmark caches
 * Prevents 504 timeouts during batch analysis by pre-computing expensive queries
 */
function startBenchmarkCacheSchedule() {
  if (benchmarkCacheJob) {
    logger.warn('[Scheduler] Benchmark cache job already running');
    return;
  }

  const cronExpression = '0 2 * * *'; // Every day at 2:00 AM

  benchmarkCacheJob = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] 📊 Triggering daily benchmark cache refresh (2:00 AM PST)...');

    try {
      const result = await refreshAllBenchmarkCaches();
      logger.info(`[Scheduler] ✅ Benchmark cache refresh complete: ${result.updated} caches updated in ${result.totalTime}ms`);
    } catch (error) {
      logger.error('[Scheduler] ❌ Benchmark cache refresh failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.info('[Scheduler] Benchmark cache schedule started: 0 2 * * * (Every day 2:00 AM PST)');
}

/**
 * Start trending scores update scheduler
 * Runs every hour to keep trending scores fresh
 * Updates all interview experience trending scores and refreshes materialized view
 */
function startTrendingScoresSchedule() {
  if (trendingScoresJob) {
    logger.warn('[Scheduler] Trending scores job already running');
    return;
  }

  const cronExpression = '0 * * * *'; // Every hour at minute 0

  trendingScoresJob = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] Triggering hourly trending scores update...');

    try {
      const result = await trendingService.updateTrendingScores();

      if (result.success) {
        logger.info(`[Scheduler] Trending scores updated: ${result.updated} experiences`);

        // Log trending stats for monitoring
        const stats = await trendingService.getTrendingStats();
        if (stats.success) {
          logger.info(`[Scheduler] Trending stats: avg=${stats.stats.avg_trending_score?.toFixed(2)}, max=${stats.stats.max_trending_score?.toFixed(2)}`);
        }
      } else {
        logger.error(`[Scheduler] Trending scores update failed: ${result.error}`);
      }
    } catch (error) {
      logger.error('[Scheduler] Trending scores update error:', error.message);
    }
  }, {
    scheduled: true
  });

  logger.info('[Scheduler] Trending scores schedule started: 0 * * * * (Every hour)');
}

/**
 * Start backfill scheduler (aggressive: every 2 hours)
 * Systematically scrapes ALL historical posts from past year
 */
function startBackfillSchedule(schedule = '0 */2 * * *') {
  if (backfillJob) {
    logger.warn('[Scheduler] Backfill job already running');
    return;
  }

  backfillJob = cron.schedule(schedule, async () => {
    logger.info('[Scheduler] 🔄 Triggering backfill scraping...');

    try {
      const result = await backfillService.runBackfillScraping();

      if (result.completed) {
        logger.info('[Scheduler] 🎉 Backfill complete! All historical posts scraped.');
      } else if (result.error) {
        logger.error(`[Scheduler] ❌ Backfill failed: ${result.error}`);
      } else {
        logger.info(`[Scheduler] ✅ Backfill progress: ${result.source}/${result.sourceIdentifier} - ${result.saved} posts saved`);
      }

      // Get overall progress
      const progress = await backfillService.getBackfillProgress();
      const totalSaved = progress.reduce((sum, p) => sum + parseInt(p.total_posts_saved || 0), 0);
      const completedSources = progress.reduce((sum, p) => sum + parseInt(p.completed_sources || 0), 0);
      const totalSources = progress.reduce((sum, p) => sum + parseInt(p.total_sources || 0), 0);

      logger.info(`[Scheduler] 📊 Backfill status: ${completedSources}/${totalSources} sources completed, ${totalSaved} total posts`);

    } catch (error) {
      logger.error('[Scheduler] ❌ Backfill job failed:', error.message);
    }
  }, {
    scheduled: true
  });

  logger.info(`[Scheduler] Backfill schedule started: ${schedule} (every 2 hours - AGGRESSIVE)`);
}

/**
 * Start targeted company scraping scheduler
 * Fills data gaps for companies with <10 posts
 * Default: Every 30 minutes (AGGRESSIVE - temporary mode for fast data collection)
 * TODO: Change back to weekly ('0 0 * * 0') once we have enough data
 */
function startTargetedScraperSchedule(schedule = '*/30 * * * *') {
  if (targetedScraperJob) {
    logger.warn('[Scheduler] Targeted scraper job already running');
    return;
  }

  targetedScraperJob = cron.schedule(schedule, async () => {
    logger.info('[Scheduler] 🎯 Triggering targeted company scraping (AGGRESSIVE MODE)...');

    try {
      const result = await targetedCompanyScraper.runTargetedScraping();

      logger.info(`[Scheduler] ✅ Targeted scraping complete!`);
      logger.info(`[Scheduler] 📊 Results: ${result.postsSaved} posts saved for ${result.companiesFilled.length} companies`);

      if (result.companiesFilled.length > 0) {
        logger.info(`[Scheduler] 🎯 Companies filled: ${result.companiesFilled.join(', ')}`);
      }

      // Check if we should slow down
      if (result.companiesFilled.length === 0) {
        logger.info(`[Scheduler] 💡 All companies have enough data. Consider switching to weekly schedule.`);
      }

    } catch (error) {
      logger.error('[Scheduler] ❌ Targeted scraping failed:', error.message);
    }
  }, {
    scheduled: true
  });

  logger.info(`[Scheduler] Targeted scraper schedule started: ${schedule} (every 30 min - AGGRESSIVE MODE)`);
}

/**
 * Stop all scheduled jobs
 */
function stopAllSchedules() {
  if (scraperJob) {
    scraperJob.stop();
    scraperJob = null;
    logger.info('[Scheduler] Scraper schedule stopped');
  }

  if (backfillJob) {
    backfillJob.stop();
    backfillJob = null;
    logger.info('[Scheduler] Backfill schedule stopped');
  }

  if (targetedScraperJob) {
    targetedScraperJob.stop();
    targetedScraperJob = null;
    logger.info('[Scheduler] Targeted scraper schedule stopped');
  }

  if (embeddingJob) {
    embeddingJob.stop();
    embeddingJob = null;
    logger.info('[Scheduler] Embedding schedule stopped');
  }

  if (benchmarkCacheJob) {
    benchmarkCacheJob.stop();
    benchmarkCacheJob = null;
    logger.info('[Scheduler] Benchmark cache schedule stopped');
  }

  if (trendingScoresJob) {
    trendingScoresJob.stop();
    trendingScoresJob = null;
    logger.info('[Scheduler] Trending scores schedule stopped');
  }
}

/**
 * Schedule weekly briefings (from old scheduler.js)
 * Runs every Monday at 9:00 AM
 */
function scheduleWeeklyBriefings() {
  if (weeklyBriefingsJob) {
    logger.warn('[Scheduler] Weekly briefings job already running');
    return;
  }

  const cronExpression = '0 9 * * 1'; // Every Monday at 9:00 AM

  weeklyBriefingsJob = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] 🤖 Triggering weekly briefings...');

    try {
      const result = await agentService.runWeeklyBriefings();
      logger.info('[Scheduler] ✅ Weekly briefings completed:', result);
    } catch (error) {
      logger.error('[Scheduler] ❌ Weekly briefings failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.info('[Scheduler] Weekly Briefings schedule started: 0 9 * * 1 (Every Monday 9:00 AM PST)');
}

/**
 * Schedule daily data collection (from old scheduler.js)
 * Runs every day at 2:00 AM
 */
function scheduleDailyDataCollection() {
  if (dailyDataCollectionJob) {
    logger.warn('[Scheduler] Daily data collection job already running');
    return;
  }

  const cronExpression = '0 2 * * *'; // Every day at 2:00 AM

  dailyDataCollectionJob = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] 🕷️ Triggering daily data collection...');

    try {
      const result = await agentService.scrapeNewInterviewData({
        subreddit: 'cscareerquestions',
        numberOfPosts: 200,
        sortBy: 'top',
        timeFilter: 'month'
      });

      const savedCount = await agentService.saveScrapedData(result);
      logger.info(`[Scheduler] ✅ Daily collection completed: ${savedCount} posts saved (last 3 months)`);
    } catch (error) {
      logger.error('[Scheduler] ❌ Daily collection failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  logger.info('[Scheduler] Daily Data Collection schedule started: 0 2 * * * (Every day 2:00 AM PST)');
}

/**
 * Initialize all scheduled tasks
 */
async function initializeScheduler() {
  logger.info('[Scheduler] 🕐 Initializing all scheduled tasks...');

  // Initialize backfill tracking table
  await backfillService.initializeBackfillTracking();

  // Always start embedding, benchmark cache, and trending scores schedules
  startEmbeddingSchedule();
  startBenchmarkCacheSchedule();
  startTrendingScoresSchedule();

  // Start scraper schedule if auto-scraping is enabled
  if (process.env.ENABLE_AUTO_SCRAPING === 'true') {
    startScraperSchedule();
    startBackfillSchedule(); // AGGRESSIVE backfill (every 2 hours)
    startTargetedScraperSchedule(); // Weekly targeted scraping for sparse companies
  }

  // Start weekly briefings
  scheduleWeeklyBriefings();

  // Start daily data collection
  scheduleDailyDataCollection();

  const activeJobs = [
    embeddingJob && 'embeddings',
    benchmarkCacheJob && 'benchmarkCache',
    trendingScoresJob && 'trendingScores',
    scraperJob && 'scraper',
    backfillJob && 'backfill',
    targetedScraperJob && 'targetedScraper',
    weeklyBriefingsJob && 'weeklyBriefings',
    dailyDataCollectionJob && 'dailyDataCollection'
  ].filter(Boolean);

  logger.info(`[Scheduler] ✅ All scheduled tasks initialized`);
  logger.info(`[Scheduler] Active jobs (${activeJobs.length}): ${activeJobs.join(', ')}`);
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    scraperActive: scraperJob !== null,
    backfillActive: backfillJob !== null,
    targetedScraperActive: targetedScraperJob !== null,
    embeddingActive: embeddingJob !== null,
    benchmarkCacheActive: benchmarkCacheJob !== null,
    trendingScoresActive: trendingScoresJob !== null,
    weeklyBriefingsActive: weeklyBriefingsJob !== null,
    dailyDataCollectionActive: dailyDataCollectionJob !== null
  };
}

/**
 * Stop a specific scheduled job
 */
function stopJob(jobName) {
  let job = null;

  switch(jobName) {
    case 'scraper':
      job = scraperJob;
      if (job) {
        job.stop();
        scraperJob = null;
      }
      break;
    case 'embedding':
      job = embeddingJob;
      if (job) {
        job.stop();
        embeddingJob = null;
      }
      break;
    case 'benchmarkCache':
      job = benchmarkCacheJob;
      if (job) {
        job.stop();
        benchmarkCacheJob = null;
      }
      break;
    case 'trendingScores':
      job = trendingScoresJob;
      if (job) {
        job.stop();
        trendingScoresJob = null;
      }
      break;
    case 'weeklyBriefings':
      job = weeklyBriefingsJob;
      if (job) {
        job.stop();
        weeklyBriefingsJob = null;
      }
      break;
    case 'dailyDataCollection':
      job = dailyDataCollectionJob;
      if (job) {
        job.stop();
        dailyDataCollectionJob = null;
      }
      break;
    default:
      logger.warn(`[Scheduler] Unknown job: ${jobName}`);
      return false;
  }

  if (job) {
    logger.info(`[Scheduler] ⏸️ Stopped job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Manually trigger a job (for testing)
 */
async function triggerJob(jobName) {
  logger.info(`[Scheduler] 🔧 Manually triggering job: ${jobName}`);

  try {
    let result;

    switch (jobName) {
      case 'weeklyBriefings':
        result = await agentService.runWeeklyBriefings();
        break;

      case 'dailyDataCollection':
        const scrapedData = await agentService.scrapeNewInterviewData({
          subreddit: 'cscareerquestions',
          numberOfPosts: 25,
          sortBy: 'top',
          timeFilter: 'month'
        });
        result = await agentService.saveScrapedData(scrapedData);
        break;

      case 'scraper':
        const scraperData = await agentService.scrapeNewInterviewData({
          subreddit: 'cscareerquestions',
          numberOfPosts: 100,
          sortBy: 'top',
          timeFilter: 'month'
        });
        result = await agentService.saveScrapedData(scraperData);
        break;

      case 'embedding':
        await queueEmbeddingGeneration({ batchSize: 100 });
        result = { message: 'Embedding job queued' };
        break;

      case 'benchmarkCache':
        result = await refreshAllBenchmarkCaches();
        break;

      case 'trendingScores':
        result = await trendingService.updateTrendingScores();
        break;

      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    logger.info(`[Scheduler] ✅ Manual trigger completed:`, result);
    return result;

  } catch (error) {
    logger.error(`[Scheduler] ❌ Manual trigger failed:`, error);
    throw error;
  }
}

module.exports = {
  // Individual schedule starters
  startScraperSchedule,
  startBackfillSchedule,
  startTargetedScraperSchedule,
  startEmbeddingSchedule,
  startBenchmarkCacheSchedule,
  startTrendingScoresSchedule,
  scheduleWeeklyBriefings,
  scheduleDailyDataCollection,

  // Consolidated initialization
  initializeScheduler,

  // Control functions
  stopAllSchedules,
  stopJob,
  triggerJob,
  getSchedulerStatus
};
