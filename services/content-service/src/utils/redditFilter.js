/**
 * Reddit Post Filtering Utility
 *
 * Filters Reddit posts to only keep actual tech job interview experiences
 * Uses the same relevance scoring system as Hacker News filtering
 *
 * Rejects posts like:
 * - LeetCode practice progress (not actual interviews)
 * - General career advice
 * - Random tech questions
 * - Company comparisons without interview context
 */

const { calculateJobInterviewRelevance } = require('../services/hackerNewsService');
const logger = require('./logger');

// Subreddit-specific relevance thresholds
const SUBREDDIT_THRESHOLDS = {
  'cscareerquestions': 40,  // General career sub, lots of non-interview posts
  'ExperiencedDevs': 45,     // More general discussions, higher threshold
  'csMajors': 40,            // Students asking various questions
  'leetcode': 50             // Mostly practice, not interviews - higher threshold
};

/**
 * Filter Reddit posts by relevance score
 *
 * @param {Array} posts - Array of Reddit posts to filter
 * @param {Object} options - Filtering options
 * @returns {Array} Filtered posts (only relevant interview experiences)
 */
function filterRedditPosts(posts, options = {}) {
  if (!posts || posts.length === 0) {
    return [];
  }

  const {
    logRejections = false,
    customThresholds = {}
  } = options;

  const thresholds = { ...SUBREDDIT_THRESHOLDS, ...customThresholds };

  logger.info(`[REDDIT FILTER] Filtering ${posts.length} Reddit posts for interview relevance...`);

  // Score all posts
  const scoredPosts = posts.map(post => {
    const score = calculateJobInterviewRelevance(post.title, post.bodyText || '');
    return {
      ...post,
      _relevanceScore: score  // Temp field for filtering
    };
  });

  // Filter by threshold
  const relevantPosts = [];
  const rejectedPosts = [];

  for (const post of scoredPosts) {
    const threshold = thresholds[post.subreddit] || 40; // Default 40% threshold

    if (post._relevanceScore >= threshold) {
      // Post passes threshold - keep it
      post.metadata = post.metadata || {};
      post.metadata.relevance_score = post._relevanceScore / 100;
      delete post._relevanceScore;  // Remove temp field
      relevantPosts.push(post);
    } else {
      // Post fails threshold - reject it
      rejectedPosts.push({
        title: post.title,
        subreddit: post.subreddit,
        score: post._relevanceScore,
        threshold: threshold
      });
    }
  }

  // Log results
  const precision = Math.round((relevantPosts.length / posts.length) * 100);
  logger.info(`[REDDIT FILTER] ✅ Results: ${relevantPosts.length}/${posts.length} posts kept (${precision}% precision)`);
  logger.info(`[REDDIT FILTER] ❌ Rejected: ${rejectedPosts.length} posts below threshold`);

  // Log rejection details if requested
  if (logRejections && rejectedPosts.length > 0) {
    logger.info(`[REDDIT FILTER] Rejection details (top 5):`);
    rejectedPosts.slice(0, 5).forEach(r => {
      logger.info(`  - [${r.subreddit}] Score ${r.score}/${r.threshold}: "${r.title.substring(0, 60)}..."`);
    });
  }

  return relevantPosts;
}

/**
 * Check if a single post is relevant (for quick checks)
 *
 * @param {Object} post - Reddit post
 * @returns {Boolean} True if post is relevant interview experience
 */
function isRelevantInterviewPost(post) {
  const score = calculateJobInterviewRelevance(post.title, post.bodyText || '');
  const threshold = SUBREDDIT_THRESHOLDS[post.subreddit] || 40;
  return score >= threshold;
}

/**
 * Get relevance statistics for a set of posts
 *
 * @param {Array} posts - Reddit posts
 * @returns {Object} Statistics about relevance
 */
function getRelevanceStats(posts) {
  const scoredPosts = posts.map(post => ({
    subreddit: post.subreddit,
    score: calculateJobInterviewRelevance(post.title, post.bodyText || '')
  }));

  const bySubreddit = {};

  for (const post of scoredPosts) {
    if (!bySubreddit[post.subreddit]) {
      bySubreddit[post.subreddit] = {
        total: 0,
        relevant: 0,
        avgScore: 0,
        scores: []
      };
    }

    const threshold = SUBREDDIT_THRESHOLDS[post.subreddit] || 40;
    bySubreddit[post.subreddit].total++;
    bySubreddit[post.subreddit].scores.push(post.score);

    if (post.score >= threshold) {
      bySubreddit[post.subreddit].relevant++;
    }
  }

  // Calculate averages
  for (const subreddit in bySubreddit) {
    const stats = bySubreddit[subreddit];
    stats.avgScore = Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length);
    stats.precision = Math.round((stats.relevant / stats.total) * 100);
    delete stats.scores; // Remove raw scores from output
  }

  return {
    total: posts.length,
    relevant: Object.values(bySubreddit).reduce((sum, s) => sum + s.relevant, 0),
    precision: Math.round((Object.values(bySubreddit).reduce((sum, s) => sum + s.relevant, 0) / posts.length) * 100),
    bySubreddit
  };
}

module.exports = {
  filterRedditPosts,
  isRelevantInterviewPost,
  getRelevanceStats,
  SUBREDDIT_THRESHOLDS
};
