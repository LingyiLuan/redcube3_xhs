/**
 * Hacker News Service
 *
 * Scrapes tech interview experiences from Hacker News using the official Firebase API
 * Focuses on "Who is hiring?" threads and interview-related discussions
 *
 * API Docs: https://github.com/HackerNews/API
 * Base URL: https://hacker-news.firebaseio.com/v0/
 * No authentication required, no rate limits
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { findCompanyInText } = require('../config/companyMappings');

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_API_BASE = 'http://hn.algolia.com/api/v1';

/**
 * Scrape interview-related posts from Hacker News
 * Uses Algolia HN Search API for better filtering
 *
 * @param {Object} options - Scraping options
 * @param {string} options.query - Search query (default: "interview")
 * @param {number} options.numberOfPosts - Number of posts to fetch (default: 50)
 * @param {string} options.tags - HN tags to filter (default: "story")
 * @returns {Array} Scraped posts with metadata
 */
async function scrapeInterviewData(options = {}) {
  const {
    query = 'interview experience',
    numberOfPosts = 50,
    tags = 'story',
    dateRange = 'last_year'  // Options: last_24h, past_week, past_month, past_year, all_time
  } = options;

  logger.info(`[HN Service] 🔍 Searching Hacker News for: "${query}"`);
  logger.info(`[HN Service] 📊 Target: ${numberOfPosts} posts, tags: ${tags}, date: ${dateRange}`);

  try {
    // Use Algolia HN Search API for better filtering
    const numericFilters = getDateRangeFilter(dateRange);
    const response = await axios.get(`${ALGOLIA_API_BASE}/search`, {
      params: {
        query: query,
        tags: tags,
        hitsPerPage: numberOfPosts,
        numericFilters: numericFilters
      },
      timeout: 30000
    });

    const hits = response.data.hits || [];
    logger.info(`[HN Service] ✅ Found ${hits.length} posts from Hacker News`);

    // Transform HN posts to our standard format
    const transformedPosts = hits.map(hit => transformHNPost(hit));

    // Filter for interview-related content with relevance scoring
    const scoredPosts = transformedPosts.map(post => {
      const score = calculateJobInterviewRelevance(post.title, post.bodyText);
      return { ...post, relevanceScore: score };
    });

    // Filter posts with score >= 40 (40% relevance threshold)
    const relevantPosts = scoredPosts.filter(post => post.relevanceScore >= 40);

    // Store score in metadata
    relevantPosts.forEach(post => {
      post.metadata.relevance_score = post.relevanceScore / 100;
      delete post.relevanceScore;  // Remove temp field
    });

    logger.info(`[HN Service] 🎯 Filtered to ${relevantPosts.length}/${hits.length} relevant posts (${Math.round(relevantPosts.length/hits.length*100)}% precision)`);

    // Log rejected posts for debugging
    const rejected = scoredPosts.filter(p => p.relevanceScore < 40);
    if (rejected.length > 0) {
      logger.debug(`[HN Service] ❌ Rejected ${rejected.length} posts (scores < 40):`);
      rejected.slice(0, 3).forEach(p => {
        logger.debug(`  - [Score: ${p.relevanceScore}] ${p.title.substring(0, 60)}`);
      });
    }

    return relevantPosts;

  } catch (error) {
    logger.error('[HN Service] ❌ Error scraping Hacker News:', error.message);
    throw error;
  }
}

/**
 * Get numeric filter for date range
 */
function getDateRangeFilter(dateRange) {
  const now = Math.floor(Date.now() / 1000);
  const ranges = {
    'last_24h': now - 86400,
    'past_week': now - 604800,
    'past_month': now - 2592000,
    'past_year': now - 31536000,
    'all_time': 0
  };

  const timestamp = ranges[dateRange] || ranges.past_year;
  return timestamp > 0 ? `created_at_i>${timestamp}` : '';
}

/**
 * Transform HN post to our standard format (matching Reddit post schema)
 */
function transformHNPost(hit) {
  return {
    // Use Reddit schema field names for compatibility
    postId: `hn_${hit.objectID}`,
    title: hit.title || hit.story_title || 'No title',
    bodyText: hit.story_text || hit.comment_text || hit.title || '',
    author: hit.author || 'anonymous',
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    subreddit: null,  // NULL for non-Reddit sources
    source: 'hackernews',  // Proper source field
    upvotes: hit.points || 0,
    commentCount: hit.num_comments || 0,
    createdAt: new Date(hit.created_at_i * 1000),
    scrapedAt: new Date(),
    comments: [],

    // HN-specific metadata
    metadata: {
      hn_id: hit.objectID,
      story_id: hit.story_id,
      parent_id: hit.parent_id,
      relevance_score: hit._highlightResult?.title?.matchLevel === 'full' ? 1.0 : 0.7,
      tags: hit._tags || []
    }
  };
}

/**
 * Calculate relevance score for job interview posts (0-100)
 * Filters out journalism interviews, product interviews, etc.
 */
function calculateJobInterviewRelevance(title, bodyText = '') {
  const text = `${title} ${bodyText}`.toLowerCase();
  let score = 0;

  // AUTO-REJECT: Journalism/news interviews (but not personal experiences!)
  const excludePatterns = [
    // Only reject if it's journalism (reading/watching interviews), not personal experience
    /\b(read|watch|saw|found) (an?|the) interview (with|of)/i,  // "I read an interview with CEO"
    /\b(ceo|cto|founder|president|senator|congressman)'s interview/i,  // "CEO's interview about..."
    /election|candidate|senator|congress/i,
    /user interview|customer interview/i,  // UX research
    /product interview guide/i  // Articles about PM interviews (not personal exp)
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(text)) {
      return 0; // Auto-reject
    }
  }

  // POSITIVE SIGNALS: First-person job interview experience (+30 points)
  const firstPersonIndicators = [
    /\b(i|my|just) (got|received|failed|passed|bombed|aced)/i,
    /\bi (interviewed|applied|accepted|rejected|turned down)/i,
    /my (interview|offer|rejection|experience) (at|with|from)/i,
    /just finished my/i
  ];
  if (firstPersonIndicators.some(p => p.test(text))) score += 30;

  // POSITIVE SIGNALS: Job outcomes (+25 points)
  const outcomeKeywords = ['offer letter', 'got an offer', 'rejected', 'hired', 'turned down',
                          'accepted the offer', 'failed the', 'passed all'];
  if (outcomeKeywords.some(kw => text.includes(kw))) score += 25;

  // POSITIVE SIGNALS: Interview stages (+20 points)
  const stageKeywords = ['onsite', 'phone screen', 'technical round', 'coding interview',
                        'system design', 'behavioral', 'leetcode', 'hackerrank', 'take home'];
  if (stageKeywords.some(kw => text.includes(kw))) score += 20;

  // POSITIVE SIGNALS: Company mentions (+15 points)
  // Uses shared company mappings with 150+ variations
  // Deduplicates (e.g., "Meta and Facebook" = one company)
  const companiesFound = findCompanyInText(text);
  if (companiesFound.length > 0) {
    score += 15;
    // Optional: Log for debugging
    // logger.debug(`[Relevance] Found companies: ${companiesFound.join(', ')}`);
  }

  // POSITIVE SIGNALS: Ask HN personal questions (+10 points)
  if (title.toLowerCase().startsWith('ask hn:')) score += 10;

  // NEGATIVE SIGNALS: Deduct points for non-interview posts (-20 points each)
  const negativePatterns = [
    /how (do i|to|can i) (prepare|study|learn)/i,  // Study advice, not experience
    /what (is|are) (the best|good) (resources|books|courses)/i,  // Resource requests
    /should i (accept|take|choose)/i,  // Decision questions (not interview experience)
    /\bsalary\b.*\bnegotiation\b/i,  // Salary negotiation (not interview)
    /\bresume\b|\bcv\b.*\breview\b/i,  // Resume help
    /career (switch|change|transition)/i,  // Career advice (not interviews)
    /leetcode.*progress|progress.*leetcode/i,  // LeetCode practice (not real interview)
    /\d+\s*(problems?|questions?)\s*(solved|completed)/i,  // "150 problems solved"
    /advice|tips|suggestions/i  // General advice posts
  ];

  for (const pattern of negativePatterns) {
    if (pattern.test(text)) {
      score -= 20;  // Deduct points
    }
  }

  // Ensure score doesn't go below 0
  return Math.max(0, score);
}

/**
 * Check if post is relevant job interview experience (legacy - kept for compatibility)
 */
function isInterviewRelated(text) {
  const score = calculateJobInterviewRelevance(text);
  return score >= 40; // 40% threshold
}

/**
 * Fetch top stories (for "Who is hiring?" threads)
 */
async function getWhoIsHiringThreads() {
  try {
    logger.info('[HN Service] 🔍 Searching for "Who is hiring?" threads');

    const response = await axios.get(`${ALGOLIA_API_BASE}/search`, {
      params: {
        query: 'Who is hiring',
        tags: 'story',
        hitsPerPage: 10
      },
      timeout: 10000
    });

    const threads = response.data.hits
      .filter(hit => hit.title && hit.title.includes('Who is hiring?'))
      .map(hit => ({
        id: hit.objectID,
        title: hit.title,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        comments: hit.num_comments,
        created: new Date(hit.created_at_i * 1000).toISOString()
      }));

    logger.info(`[HN Service] ✅ Found ${threads.length} "Who is hiring?" threads`);
    return threads;

  } catch (error) {
    logger.error('[HN Service] ❌ Error fetching hiring threads:', error.message);
    return [];
  }
}

/**
 * Get comments from a specific story
 * Useful for scraping "Who is hiring?" thread comments
 */
async function getStoryComments(storyId, maxComments = 100) {
  try {
    logger.info(`[HN Service] 💬 Fetching comments for story ${storyId}`);

    // Get story details first
    const storyResponse = await axios.get(`${HN_API_BASE}/item/${storyId}.json`);
    const story = storyResponse.data;

    if (!story || !story.kids || story.kids.length === 0) {
      logger.warn(`[HN Service] No comments found for story ${storyId}`);
      return [];
    }

    // Fetch top-level comments
    const commentIds = story.kids.slice(0, maxComments);
    const comments = [];

    for (const commentId of commentIds) {
      try {
        const commentResponse = await axios.get(`${HN_API_BASE}/item/${commentId}.json`);
        const comment = commentResponse.data;

        if (comment && comment.text) {
          comments.push({
            id: `hn_comment_${commentId}`,
            source: 'hackernews',
            sourceId: commentId,
            title: `Comment on: ${story.title}`,
            content: stripHtmlTags(comment.text),
            author: comment.by || 'anonymous',
            url: `https://news.ycombinator.com/item?id=${commentId}`,
            createdAt: new Date(comment.time * 1000).toISOString(),
            metadata: {
              story_id: storyId,
              parent_story_title: story.title
            }
          });
        }
      } catch (err) {
        logger.warn(`[HN Service] Failed to fetch comment ${commentId}:`, err.message);
      }
    }

    logger.info(`[HN Service] ✅ Retrieved ${comments.length} comments from story ${storyId}`);
    return comments;

  } catch (error) {
    logger.error(`[HN Service] ❌ Error fetching comments for story ${storyId}:`, error.message);
    return [];
  }
}

/**
 * Strip HTML tags from HN comment text
 */
function stripHtmlTags(html) {
  if (!html) return '';

  return html
    .replace(/<p>/gi, '\n\n')
    .replace(/<br>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

module.exports = {
  scrapeInterviewData,
  getWhoIsHiringThreads,
  getStoryComments,
  calculateJobInterviewRelevance  // Export for reuse in Reddit filtering
};
