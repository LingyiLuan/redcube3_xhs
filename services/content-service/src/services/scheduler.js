/**
 * Task Scheduler Service
 * Uses node-cron to schedule autonomous agent tasks
 */

const cron = require('node-cron');
const agentService = require('./agentService');

// Store active cron jobs
const activeCronJobs = new Map();

/**
 * Initialize all scheduled tasks
 */
function initializeScheduler() {
  console.log('🕐 [SCHEDULER] Initializing task scheduler...');

  // Weekly briefings - Every Monday at 9:00 AM
  scheduleWeeklyBriefings();

  // Daily data collection - Every day at 2:00 AM
  scheduleDailyDataCollection();

  console.log('✅ [SCHEDULER] All scheduled tasks initialized');
  console.log(`   Active jobs: ${activeCronJobs.size}`);
}

/**
 * Schedule weekly briefings
 * Runs every Monday at 9:00 AM
 */
function scheduleWeeklyBriefings() {
  const cronExpression = '0 9 * * 1'; // Every Monday at 9:00 AM
  // For testing: '*/5 * * * *' runs every 5 minutes

  const job = cron.schedule(cronExpression, async () => {
    console.log('🤖 [SCHEDULER] Triggering weekly briefings...');

    try {
      const result = await agentService.runWeeklyBriefings();
      console.log('✅ [SCHEDULER] Weekly briefings completed:', result);
    } catch (error) {
      console.error('❌ [SCHEDULER] Weekly briefings failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // Adjust to your timezone
  });

  activeCronJobs.set('weeklyBriefings', job);
  console.log('📅 [SCHEDULER] Scheduled: Weekly Briefings (Every Monday 9:00 AM)');
}

/**
 * Schedule daily data collection
 * Runs every day at 2:00 AM
 */
function scheduleDailyDataCollection() {
  const cronExpression = '0 2 * * *'; // Every day at 2:00 AM
  // For testing: '*/10 * * * *' runs every 10 minutes

  const job = cron.schedule(cronExpression, async () => {
    console.log('🕷️ [SCHEDULER] Triggering daily data collection...');

    try {
      const result = await agentService.scrapeNewInterviewData({
        subreddit: 'cscareerquestions',
        numberOfPosts: 50,
        sortBy: 'new'
      });

      const savedCount = await agentService.saveScrapedData(result);
      console.log(`✅ [SCHEDULER] Daily collection completed: ${savedCount} posts saved`);
    } catch (error) {
      console.error('❌ [SCHEDULER] Daily collection failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Los_Angeles'
  });

  activeCronJobs.set('dailyDataCollection', job);
  console.log('📅 [SCHEDULER] Scheduled: Daily Data Collection (Every day 2:00 AM)');
}

/**
 * Stop a specific scheduled job
 */
function stopJob(jobName) {
  const job = activeCronJobs.get(jobName);
  if (job) {
    job.stop();
    activeCronJobs.delete(jobName);
    console.log(`⏸️ [SCHEDULER] Stopped job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Stop all scheduled jobs
 */
function stopAllJobs() {
  console.log('⏸️ [SCHEDULER] Stopping all scheduled jobs...');

  activeCronJobs.forEach((job, name) => {
    job.stop();
    console.log(`   Stopped: ${name}`);
  });

  activeCronJobs.clear();
  console.log('✅ [SCHEDULER] All jobs stopped');
}

/**
 * Get status of all scheduled jobs
 */
function getJobsStatus() {
  const status = [];

  activeCronJobs.forEach((job, name) => {
    status.push({
      name,
      running: true // If it's in the map, it's running
    });
  });

  return status;
}

/**
 * Manually trigger a job (for testing)
 */
async function triggerJob(jobName) {
  console.log(`🔧 [SCHEDULER] Manually triggering job: ${jobName}`);

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
          sortBy: 'new'
        });
        result = await agentService.saveScrapedData(scrapedData);
        break;

      default:
        throw new Error(`Unknown job: ${jobName}`);
    }

    console.log(`✅ [SCHEDULER] Manual trigger completed:`, result);
    return result;

  } catch (error) {
    console.error(`❌ [SCHEDULER] Manual trigger failed:`, error);
    throw error;
  }
}

module.exports = {
  initializeScheduler,
  stopJob,
  stopAllJobs,
  getJobsStatus,
  triggerJob
};
