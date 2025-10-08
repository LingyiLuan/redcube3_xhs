/**
 * Proactive Agent Service
 * Orchestrates autonomous data collection, analysis, and user briefings
 */

const { ApifyClient } = require('apify-client');
const pool = require('../config/database');

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN || 'YOUR_APIFY_TOKEN_HERE'
});

/**
 * Main function for weekly autonomous briefings
 * This will be triggered by the scheduler
 */
async function runWeeklyBriefings() {
  console.log('🤖 [AGENT] Starting weekly briefings workflow...');

  try {
    // Step 1: Get all users with goals set
    const usersWithGoals = await getUsersWithGoals();
    console.log(`📊 [AGENT] Found ${usersWithGoals.length} users with active goals`);

    if (usersWithGoals.length === 0) {
      console.log('⚠️ [AGENT] No users with goals. Skipping briefings.');
      return { success: true, message: 'No users to brief', count: 0 };
    }

    // Step 2: Scrape new data from Reddit
    const scrapedData = await scrapeNewInterviewData();
    console.log(`✅ [AGENT] Scraped ${scrapedData.length} new posts`);

    // Step 3: Save scraped data to database
    const savedCount = await saveScrapedData(scrapedData);
    console.log(`💾 [AGENT] Saved ${savedCount} posts to database`);

    // Step 4: Process and generate briefings for each user
    const briefings = [];
    for (const user of usersWithGoals) {
      try {
        const briefing = await generateUserBriefing(user, scrapedData);
        briefings.push(briefing);
        console.log(`📧 [AGENT] Generated briefing for user ${user.id}`);
      } catch (error) {
        console.error(`❌ [AGENT] Failed to generate briefing for user ${user.id}:`, error);
      }
    }

    console.log(`🎉 [AGENT] Weekly briefings completed! Generated ${briefings.length} briefings.`);

    return {
      success: true,
      usersProcessed: usersWithGoals.length,
      postsScraped: scrapedData.length,
      briefingsGenerated: briefings.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [AGENT] Error in weekly briefings workflow:', error);
    throw error;
  }
}

/**
 * Get all users who have set career goals
 */
async function getUsersWithGoals() {
  const query = `
    SELECT DISTINCT user_id as id, email
    FROM user_goals
    WHERE target_role IS NOT NULL
      AND is_active = true
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching users with goals:', error);
    return [];
  }
}

/**
 * Scrape new interview data using Apify
 */
async function scrapeNewInterviewData(options = {}) {
  const {
    subreddit = 'cscareerquestions',
    numberOfPosts = 50,
    sortBy = 'new'
  } = options;

  console.log(`🕷️ [SCRAPER] Starting Apify actor for r/${subreddit}...`);

  try {
    // Get your actor ID from Apify Console after deployment
    const actorId = process.env.APIFY_ACTOR_ID || 'YOUR_ACTOR_ID';

    // Prepare actor input with Reddit credentials
    const input = {
      subreddit,
      numberOfPosts,
      sortBy,
      // Pass Reddit credentials as input parameters
      redditClientId: process.env.REDDIT_CLIENT_ID,
      redditSecret: process.env.REDDIT_SECRET,
      redditUser: process.env.REDDIT_USER,
      redditPass: process.env.REDDIT_PASS
    };

    console.log('🔐 [SCRAPER] Passing Reddit credentials via actor input');
    console.log('🔍 [DEBUG] Reddit credentials check:', {
      hasClientId: !!input.redditClientId,
      hasSecret: !!input.redditSecret,
      hasUser: !!input.redditUser,
      hasPass: !!input.redditPass,
      clientIdPreview: input.redditClientId ? input.redditClientId.substring(0, 5) + '...' : 'missing',
      userPreview: input.redditUser || 'missing'
    });

    // Run the actor with input and wait for completion
    const run = await apifyClient.actor(actorId).call(input, {
      build: 'latest'
    });

    console.log(`⏳ [SCRAPER] Actor run completed: ${run.id}`);
    console.log(`✅ [SCRAPER] Actor finished with status: ${run.status}`);

    // If the actor failed, fetch and display the logs
    if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
      console.error(`❌ [SCRAPER] Actor failed with status: ${run.status}`);
      try {
        const logUrl = `https://api.apify.com/v2/actor-runs/${run.id}/log`;
        const logResponse = await apifyClient.log(run.id).get();
        console.error('📋 [SCRAPER] Actor logs:');
        console.error(logResponse);
      } catch (logError) {
        console.error('⚠️ [SCRAPER] Could not fetch actor logs:', logError.message);
      }
    }

    // Fetch the dataset results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`📦 [SCRAPER] Retrieved ${items.length} items from dataset`);

    // Fetch summary statistics
    const summary = await apifyClient.keyValueStore(run.defaultKeyValueStoreId).getRecord('SUMMARY');

    if (summary) {
      console.log('📊 [SCRAPER] Summary:', summary.value);
    }

    return items;

  } catch (error) {
    console.error('❌ [SCRAPER] Error running Apify actor:', error);

    // Fallback: return empty array instead of crashing
    console.log('⚠️ [SCRAPER] Returning empty results due to error');
    return [];
  }
}

/**
 * Save scraped data to database
 */
async function saveScrapedData(scrapedPosts) {
  if (!scrapedPosts || scrapedPosts.length === 0) {
    return 0;
  }

  console.log(`💾 [DB] Saving ${scrapedPosts.length} posts to database...`);

  const insertQuery = `
    INSERT INTO scraped_posts (
      post_id, title, author, created_at, url, body_text,
      potential_outcome, confidence_score, subreddit, metadata,
      word_count, scraped_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (post_id) DO UPDATE SET
      potential_outcome = EXCLUDED.potential_outcome,
      confidence_score = EXCLUDED.confidence_score,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING id
  `;

  let savedCount = 0;

  for (const post of scrapedPosts) {
    try {
      await pool.query(insertQuery, [
        post.postId,
        post.title,
        post.author,
        post.createdAt,
        post.url,
        post.bodyText,
        post.potential_outcome,
        post.confidence_score,
        post.subreddit,
        JSON.stringify(post.metadata),
        post.word_count,
        post.scrapedAt
      ]);
      savedCount++;
    } catch (error) {
      console.error(`❌ [DB] Error saving post ${post.postId}:`, error.message);
    }
  }

  console.log(`✅ [DB] Successfully saved ${savedCount}/${scrapedPosts.length} posts`);
  return savedCount;
}

/**
 * Generate personalized briefing for a user
 */
async function generateUserBriefing(user, scrapedData) {
  console.log(`📝 [BRIEFING] Generating briefing for user ${user.id}...`);

  // Get user's goals
  const userGoals = await getUserGoals(user.id);

  // Filter relevant posts based on user's interests
  const relevantPosts = filterRelevantPosts(scrapedData, userGoals);

  // Extract key insights
  const insights = extractInsights(relevantPosts, userGoals);

  // Build briefing object
  const briefing = {
    userId: user.id,
    email: user.email,
    generatedAt: new Date().toISOString(),
    period: 'weekly',
    userGoals,
    insights,
    relevantPostsCount: relevantPosts.length,
    totalPostsScraped: scrapedData.length
  };

  // Save briefing to database
  await saveBriefing(briefing);

  return briefing;
}

/**
 * Get user's career goals
 */
async function getUserGoals(userId) {
  const query = `
    SELECT target_role, target_companies, desired_skills, timeline_months, location_preference
    FROM user_goals
    WHERE user_id = $1 AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || {};
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return {};
  }
}

/**
 * Filter posts relevant to user's goals
 */
function filterRelevantPosts(posts, userGoals) {
  if (!posts || posts.length === 0) return [];

  const targetRole = (userGoals.target_role || '').toLowerCase();
  const targetCompanies = (userGoals.target_companies || []).map(c => c.toLowerCase());
  const desiredSkills = (userGoals.desired_skills || []).map(s => s.toLowerCase());

  return posts.filter(post => {
    const metadata = post.metadata || {};
    const combinedText = `${post.title} ${post.bodyText}`.toLowerCase();

    // Check if post mentions target role
    const hasRole = targetRole && combinedText.includes(targetRole);

    // Check if post mentions target companies
    const hasCompany = targetCompanies.some(company =>
      (metadata.companies || []).includes(company) || combinedText.includes(company)
    );

    // Check if post mentions desired skills
    const hasSkill = desiredSkills.some(skill =>
      (metadata.technologies || []).includes(skill) || combinedText.includes(skill)
    );

    // Include post if it matches any criteria
    return hasRole || hasCompany || hasSkill;
  });
}

/**
 * Extract key insights from relevant posts
 */
function extractInsights(posts, userGoals) {
  if (!posts || posts.length === 0) {
    return {
      summary: 'No new relevant posts this week.',
      topCompanies: [],
      topSkills: [],
      successRate: null,
      topPosts: []
    };
  }

  // Calculate success rate
  const positiveCount = posts.filter(p => p.potential_outcome === 'positive').length;
  const negativeCount = posts.filter(p => p.potential_outcome === 'negative').length;
  const totalWithOutcome = positiveCount + negativeCount;
  const successRate = totalWithOutcome > 0
    ? ((positiveCount / totalWithOutcome) * 100).toFixed(1)
    : null;

  // Extract top companies mentioned
  const companyCounts = {};
  posts.forEach(post => {
    (post.metadata?.companies || []).forEach(company => {
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }));

  // Extract top skills mentioned
  const skillCounts = {};
  posts.forEach(post => {
    (post.metadata?.technologies || []).forEach(tech => {
      skillCounts[tech] = (skillCounts[tech] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  // Get top 3 most relevant posts (by confidence and outcome)
  const topPosts = posts
    .filter(p => p.potential_outcome !== 'unknown')
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 3)
    .map(p => ({
      title: p.title,
      url: p.url,
      outcome: p.potential_outcome,
      confidence: p.confidence_score
    }));

  return {
    summary: `Found ${posts.length} relevant posts this week. Success rate: ${successRate}%`,
    successRate: parseFloat(successRate),
    topCompanies,
    topSkills,
    topPosts,
    totalPosts: posts.length
  };
}

/**
 * Save briefing to database
 */
async function saveBriefing(briefing) {
  const query = `
    INSERT INTO user_briefings (
      user_id, period, user_goals, insights, relevant_posts_count,
      total_posts_scraped, generated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      briefing.userId,
      briefing.period,
      JSON.stringify(briefing.userGoals),
      JSON.stringify(briefing.insights),
      briefing.relevantPostsCount,
      briefing.totalPostsScraped,
      briefing.generatedAt
    ]);

    console.log(`✅ [DB] Saved briefing ${result.rows[0].id} for user ${briefing.userId}`);
    return result.rows[0].id;
  } catch (error) {
    console.error('❌ [DB] Error saving briefing:', error);
    throw error;
  }
}

/**
 * Manual trigger for testing
 */
async function runManualScrape(subreddit = 'cscareerquestions', numberOfPosts = 25) {
  console.log(`🔧 [MANUAL] Running manual scrape: r/${subreddit}, ${numberOfPosts} posts`);

  const scrapedData = await scrapeNewInterviewData({ subreddit, numberOfPosts, sortBy: 'new' });
  const savedCount = await saveScrapedData(scrapedData);

  return {
    success: true,
    scraped: scrapedData.length,
    saved: savedCount,
    data: scrapedData
  };
}

module.exports = {
  runWeeklyBriefings,
  scrapeNewInterviewData,
  saveScrapedData,
  generateUserBriefing,
  runManualScrape
};
