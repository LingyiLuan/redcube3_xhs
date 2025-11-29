/**
 * Targeted Company Scraper
 *
 * Fills data gaps for companies with sparse interview posts (<10)
 * Uses Reddit search API to find company-specific interview experiences
 * across ALL of Reddit, not just our tracked subreddits
 */

const redditApiService = require('./redditApiService');
const agentService = require('./agentService');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Companies with sparse data that need targeted scraping
 * Priority order: Most critical companies first
 */
const SPARSE_COMPANIES = [
  // Tier 1: Critical (1-2 posts, high demand)
  { name: 'Lyft', target: 50, searchTerms: ['Lyft', 'lyft'] },
  { name: 'Coinbase', target: 50, searchTerms: ['Coinbase', 'coinbase'] },
  { name: 'Twitter', target: 50, searchTerms: ['Twitter', 'X Corp', 'twitter'] },
  { name: 'Two Sigma', target: 50, searchTerms: ['Two Sigma', 'two sigma', 'twosigma'] },
  { name: 'Databricks', target: 50, searchTerms: ['Databricks', 'databricks'] },
  { name: 'Airbnb', target: 50, searchTerms: ['Airbnb', 'airbnb'] },
  { name: 'Snap', target: 50, searchTerms: ['Snap', 'Snapchat', 'snap'] },

  // Tier 2: Important (6-7 posts)
  { name: 'Netflix', target: 50, searchTerms: ['Netflix', 'netflix'] },
  { name: 'IBM', target: 50, searchTerms: ['IBM', 'ibm'] },
  { name: 'Snowflake', target: 50, searchTerms: ['Snowflake', 'snowflake'] },
  { name: 'Pinterest', target: 50, searchTerms: ['Pinterest', 'pinterest'] },
  { name: 'Tesla', target: 50, searchTerms: ['Tesla', 'tesla'] },
  { name: 'Discord', target: 50, searchTerms: ['Discord', 'discord'] },
  { name: 'Jane Street', target: 50, searchTerms: ['Jane Street', 'jane street', 'janestreet'] },

  // Tier 3: Good to have (8-9 posts)
  { name: 'Oracle', target: 50, searchTerms: ['Oracle', 'oracle'] },
  { name: 'Citadel', target: 50, searchTerms: ['Citadel', 'citadel'] },
  { name: 'Roblox', target: 50, searchTerms: ['Roblox', 'roblox'] },

  // Additional high-value companies
  { name: 'ByteDance', target: 50, searchTerms: ['ByteDance', 'TikTok', 'bytedance'] },
  { name: 'Shopify', target: 50, searchTerms: ['Shopify', 'shopify'] },
  { name: 'DoorDash', target: 50, searchTerms: ['DoorDash', 'doordash', 'door dash'] }
];

/**
 * Get current post count for a company
 */
async function getCompanyPostCount(companyName) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM scraped_posts
      WHERE metadata->>'company' = $1
    `, [companyName]);

    return parseInt(result.rows[0].count) || 0;
  } catch (error) {
    logger.error(`[Targeted] Error counting posts for ${companyName}:`, error.message);
    return 0;
  }
}

/**
 * Search Reddit for company-specific interview posts
 * Uses multiple search queries to maximize coverage
 */
async function searchCompanyPosts(company, maxPosts = 100) {
  logger.info(`[Targeted] 🎯 Searching for ${company.name} interview posts...`);

  const allPosts = [];
  const searchQueries = [
    `${company.searchTerms[0]} interview`,
    `${company.searchTerms[0]} interview experience`,
    `${company.searchTerms[0]} offer`,
    `${company.searchTerms[0]} rejection`,
    `${company.searchTerms[0]} onsite`,
    `${company.searchTerms[0]} phone screen`
  ];

  for (const query of searchQueries) {
    try {
      // Search across ALL subreddits we track + general tech subs
      const subreddits = [
        'cscareerquestions',
        'ExperiencedDevs',
        'csMajors',
        'leetcode',
        'techinterviews',
        'codinginterview',
        'datascience',         // Data science interviews, ML roles
        'MachineLearning',     // ML engineer interviews, research roles
        // Removed 'FAANG' - subreddit doesn't exist (404 errors)
        // Phase 2: Additional subreddits
        'programming',
        'jobs',
        'careerguidance',
        'EngineeringStudents'
      ];

      for (const subreddit of subreddits) {
        try {
          const posts = await redditApiService.searchReddit({
            query,
            subreddit,
            limit: 20,
            sortBy: 'relevance',
            timeFilter: 'all' // Search all time to get historical data
          });

          if (posts && posts.length > 0) {
            logger.info(`[Targeted] 📥 Found ${posts.length} posts for "${query}" in r/${subreddit}`);
            allPosts.push(...posts);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (subError) {
          logger.debug(`[Targeted] No results for ${query} in r/${subreddit}`);
        }
      }

      // Stop if we've collected enough
      if (allPosts.length >= maxPosts) break;

    } catch (queryError) {
      logger.error(`[Targeted] Error searching "${query}":`, queryError.message);
    }
  }

  // Remove duplicates by post_id
  const uniquePosts = Array.from(
    new Map(allPosts.map(post => [post.postId, post])).values()
  );

  logger.info(`[Targeted] ✅ ${company.name}: Found ${uniquePosts.length} unique posts (from ${allPosts.length} total)`);

  return uniquePosts.slice(0, maxPosts);
}

/**
 * Run targeted scraping for companies with sparse data
 */
async function runTargetedScraping() {
  logger.info('[Targeted] 🎯 Starting targeted company scraping...');

  const results = {
    companiesProcessed: 0,
    postsFound: 0,
    postsSaved: 0,
    companiesFilled: []
  };

  for (const company of SPARSE_COMPANIES) {
    try {
      // Check current count
      const currentCount = await getCompanyPostCount(company.name);

      if (currentCount >= company.target) {
        logger.info(`[Targeted] ✅ ${company.name}: Already has ${currentCount} posts (target: ${company.target}) - SKIP`);
        continue;
      }

      const needed = company.target - currentCount;
      logger.info(`[Targeted] 🎯 ${company.name}: Has ${currentCount} posts, need ${needed} more`);

      // Search for company-specific posts
      const posts = await searchCompanyPosts(company, needed * 2); // Get 2x to account for filtering
      results.postsFound += posts.length;

      if (posts.length === 0) {
        logger.warn(`[Targeted] ⚠️ ${company.name}: No posts found`);
        continue;
      }

      // Save posts
      const saved = await agentService.saveScrapedData(posts);
      results.postsSaved += saved;
      results.companiesProcessed++;

      const newCount = await getCompanyPostCount(company.name);

      logger.info(`[Targeted] ✅ ${company.name}: ${saved} new posts saved (${currentCount} → ${newCount})`);

      if (newCount >= company.target) {
        results.companiesFilled.push(company.name);
        logger.info(`[Targeted] 🎉 ${company.name}: REACHED TARGET (${newCount}/${company.target})`);
      }

      // Rate limiting between companies
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      logger.error(`[Targeted] ❌ Error processing ${company.name}:`, error.message);
    }
  }

  // Check how many companies still need data
  const stillSparse = await getSparseCompanies();
  results.companiesRemaining = stillSparse.length;

  logger.info(`[Targeted] 🎉 Targeted scraping complete!`);
  logger.info(`[Targeted] 📊 Results:`);
  logger.info(`[Targeted]    - Companies processed: ${results.companiesProcessed}/${SPARSE_COMPANIES.length}`);
  logger.info(`[Targeted]    - Posts found: ${results.postsFound}`);
  logger.info(`[Targeted]    - Posts saved: ${results.postsSaved}`);
  logger.info(`[Targeted]    - Companies filled: ${results.companiesFilled.join(', ') || 'none'}`);
  logger.info(`[Targeted]    - Companies still needing data: ${results.companiesRemaining}/${SPARSE_COMPANIES.length}`);

  if (results.companiesRemaining === 0) {
    logger.info(`[Targeted] 🎉 ALL COMPANIES FILLED! Consider switching to weekly schedule.`);
  }

  return results;
}

/**
 * Get list of sparse companies that need more data
 */
async function getSparseCompanies() {
  const sparse = [];

  for (const company of SPARSE_COMPANIES) {
    const count = await getCompanyPostCount(company.name);
    if (count < company.target) {
      sparse.push({
        name: company.name,
        current: count,
        target: company.target,
        needed: company.target - count
      });
    }
  }

  return sparse;
}

module.exports = {
  runTargetedScraping,
  getSparseCompanies,
  SPARSE_COMPANIES
};
