/**
 * Agent Controller
 * Handles API endpoints for the autonomous agent and scheduler
 */

const agentService = require('../services/agentService');
const schedulerService = require('../services/schedulerService');

/**
 * GET /api/content/agent/status
 * Get current status of the autonomous agent
 */
async function getAgentStatus(req, res) {
  try {
    const jobsStatus = schedulerService.getSchedulerStatus();

    res.json({
      success: true,
      agent: {
        enabled: process.env.ENABLE_SCHEDULER !== 'false',
        scheduledJobs: jobsStatus,
        apifyConfigured: !!process.env.APIFY_API_TOKEN,
        actorId: process.env.APIFY_ACTOR_ID || null
      }
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent status',
      message: error.message
    });
  }
}

/**
 * POST /api/content/agent/scrape
 * Manually trigger a scraping job or directly ingest posts (for testing)
 */
async function triggerManualScrape(req, res) {
  try {
    const { subreddit = 'cscareerquestions', numberOfPosts = 25, scrapedPosts } = req.body;

    // If scrapedPosts are provided directly, use them (for testing)
    if (scrapedPosts && Array.isArray(scrapedPosts)) {
      console.log(`🧪 [API] Direct post ingestion: ${scrapedPosts.length} posts`);

      const savedCount = await agentService.saveScrapedData(scrapedPosts);

      return res.json({
        success: true,
        message: 'Posts ingested successfully',
        data: {
          scraped: scrapedPosts.length,
          saved: savedCount,
          subreddit,
          numberOfPosts: scrapedPosts.length
        }
      });
    }

    // Otherwise, run normal scrape via Apify
    console.log(`🔧 [API] Manual scrape triggered: r/${subreddit}, ${numberOfPosts} posts`);

    const result = await agentService.runManualScrape(subreddit, numberOfPosts);

    res.json({
      success: true,
      message: 'Manual scrape completed',
      data: {
        scraped: result.scraped,
        saved: result.saved,
        subreddit,
        numberOfPosts
      }
    });
  } catch (error) {
    console.error('Error in manual scrape:', error);
    res.status(500).json({
      success: false,
      error: 'Manual scrape failed',
      message: error.message
    });
  }
}

/**
 * POST /api/content/agent/briefings
 * Manually trigger weekly briefings generation
 */
async function triggerBriefings(req, res) {
  try {
    console.log('🔧 [API] Manual briefings generation triggered');

    const result = await agentService.runWeeklyBriefings();

    res.json({
      success: true,
      message: 'Briefings generation completed',
      data: result
    });
  } catch (error) {
    console.error('Error triggering briefings:', error);
    res.status(500).json({
      success: false,
      error: 'Briefings generation failed',
      message: error.message
    });
  }
}

/**
 * GET /api/content/agent/briefings/:userId
 * Get briefings for a specific user
 */
async function getUserBriefings(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const pool = require('../config/database');
    const query = `
      SELECT *
      FROM user_briefings
      WHERE user_id = $1
      ORDER BY generated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    res.json({
      success: true,
      data: {
        briefings: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching user briefings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch briefings',
      message: error.message
    });
  }
}

/**
 * GET /api/content/posts/recent
 * Get recent posts with enhanced metadata (Phase 5.1)
 */
async function getRecentPosts(req, res) {
  try {
    const {
      limit = 10,
      offset = 0
    } = req.query;

    const pool = require('../config/database');

    const query = `
      SELECT
        id, post_id, title, author, created_at, url,
        potential_outcome, confidence_score, subreddit,
        word_count, scraped_at,
        -- Phase 5.1 enhanced metadata
        role_type, role_category, level, level_label, experience_years,
        metadata->>'company' as company,
        interview_stage, outcome, tech_stack, primary_language,
        interview_topics, preparation,
        jsonb_array_length(COALESCE(comments, '[]'::jsonb)) as comment_count
      FROM scraped_posts
      ORDER BY scraped_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    res.json({
      success: true,
      data: {
        posts: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent posts',
      message: error.message
    });
  }
}

/**
 * GET /api/content/agent/scraped-posts
 * Get scraped posts with filtering
 */
async function getScrapedPosts(req, res) {
  try {
    const {
      outcome, // positive, negative, unknown
      subreddit,
      minConfidence = 0,
      limit = 50,
      offset = 0
    } = req.query;

    const pool = require('../config/database');

    let query = `
      SELECT id, post_id, title, author, created_at, url,
             potential_outcome, confidence_score, subreddit,
             metadata, word_count, scraped_at,
             role_type, role_category, level, level_label, experience_years,
             metadata->>'company' as company,
             interview_stage, outcome, tech_stack, primary_language
      FROM scraped_posts
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (outcome) {
      query += ` AND potential_outcome = $${paramCount++}`;
      params.push(outcome);
    }

    if (subreddit) {
      query += ` AND subreddit = $${paramCount++}`;
      params.push(subreddit);
    }

    if (minConfidence) {
      query += ` AND confidence_score >= $${paramCount++}`;
      params.push(minConfidence);
    }

    query += ` ORDER BY scraped_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM scraped_posts WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (outcome) {
      countQuery += ` AND potential_outcome = $${countParamCount++}`;
      countParams.push(outcome);
    }

    if (subreddit) {
      countQuery += ` AND subreddit = $${countParamCount++}`;
      countParams.push(subreddit);
    }

    if (minConfidence) {
      countQuery += ` AND confidence_score >= $${countParamCount}`;
      countParams.push(minConfidence);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        posts: result.rows,
        totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching scraped posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraped posts',
      message: error.message
    });
  }
}

/**
 * GET /api/content/agent/stats
 * Get scraper statistics
 */
async function getScraperStats(req, res) {
  try {
    const pool = require('../config/database');

    // Get overall statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_posts,
        COUNT(DISTINCT subreddit) as total_subreddits,
        COUNT(CASE WHEN potential_outcome = 'positive' THEN 1 END) as positive_count,
        COUNT(CASE WHEN potential_outcome = 'negative' THEN 1 END) as negative_count,
        COUNT(CASE WHEN potential_outcome = 'unknown' THEN 1 END) as unknown_count,
        AVG(confidence_score) as avg_confidence,
        MAX(scraped_at) as last_scrape,
        COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as posts_with_embeddings
      FROM scraped_posts
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get posts by subreddit
    const subredditQuery = `
      SELECT subreddit, COUNT(*) as count
      FROM scraped_posts
      GROUP BY subreddit
      ORDER BY count DESC
      LIMIT 10
    `;

    const subredditResult = await pool.query(subredditQuery);

    // Get recent scrapes (last 7 days)
    const recentQuery = `
      SELECT DATE(scraped_at) as date, COUNT(*) as count
      FROM scraped_posts
      WHERE scraped_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(scraped_at)
      ORDER BY date DESC
    `;

    const recentResult = await pool.query(recentQuery);

    // Get company coverage
    const companyQuery = `
      SELECT
        metadata->>'company' as company,
        COUNT(*) as count
      FROM scraped_posts
      WHERE metadata->>'company' IS NOT NULL
      GROUP BY metadata->>'company'
      ORDER BY count DESC
      LIMIT 20
    `;

    const companyResult = await pool.query(companyQuery);

    // Get posts collected today
    const todayQuery = `
      SELECT COUNT(*) as today_count
      FROM scraped_posts
      WHERE DATE(scraped_at) = CURRENT_DATE
    `;

    const todayResult = await pool.query(todayQuery);

    res.json({
      success: true,
      data: {
        overall: {
          totalPosts: parseInt(stats.total_posts),
          postsWithEmbeddings: parseInt(stats.posts_with_embeddings),
          totalSubreddits: parseInt(stats.total_subreddits),
          outcomes: {
            positive: parseInt(stats.positive_count),
            negative: parseInt(stats.negative_count),
            unknown: parseInt(stats.unknown_count)
          },
          avgConfidence: parseFloat(stats.avg_confidence).toFixed(2),
          lastScrape: stats.last_scrape,
          todayCount: parseInt(todayResult.rows[0].today_count)
        },
        bySubreddit: subredditResult.rows,
        recentActivity: recentResult.rows,
        companyCoverage: companyResult.rows,
        scraperMode: process.env.SCRAPER_MODE || 'reddit',
        autoScrapingEnabled: process.env.ENABLE_AUTO_SCRAPING === 'true'
      }
    });
  } catch (error) {
    console.error('Error fetching scraper stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}

/**
 * POST /api/content/agent/scrape/companies
 * Trigger company-targeted scraping (FAANG, Finance, Startups)
 */
async function scrapeCompanies(req, res) {
  try {
    const { companies, postsPerCompany = 50 } = req.body;

    console.log(`🎯 [API] Company-targeted scraping: ${companies?.length || 0} companies`);

    const result = await agentService.scrapeCompanyTargeted({
      companies,
      postsPerCompany
    });

    res.json({
      success: result.success,
      message: result.success ? 'Company scraping completed' : 'Company scraping failed',
      data: result
    });
  } catch (error) {
    console.error('Error in company scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Company scraping failed',
      message: error.message
    });
  }
}

/**
 * GET /api/content/agent/test-reddit
 * Test Reddit API connection
 */
async function testRedditApi(req, res) {
  try {
    console.log('🧪 [API] Testing Reddit API connection...');

    const result = await agentService.testRedditConnection();

    res.json({
      success: result.success,
      message: result.success ? 'Reddit API connection successful' : 'Reddit API connection failed',
      data: result
    });
  } catch (error) {
    console.error('Error testing Reddit API:', error);
    res.status(500).json({
      success: false,
      error: 'Reddit API test failed',
      message: error.message
    });
  }
}

module.exports = {
  getAgentStatus,
  triggerManualScrape,
  triggerBriefings,
  getUserBriefings,
  getScrapedPosts,
  getScraperStats,
  getRecentPosts,
  scrapeCompanies,
  testRedditApi
};
