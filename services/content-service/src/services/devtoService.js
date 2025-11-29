const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Dev.to service for scraping tech interview articles
 * Uses official FREE Dev.to API: https://developers.forem.com/api
 *
 * No API key needed! Completely free and legal.
 */

const DEVTO_API = 'https://dev.to/api';

/**
 * Scrape interview articles from Dev.to
 * @param {Object} options - Scraping options
 * @param {Array<string>} options.tags - Tags to search for
 * @param {number} options.numberOfPosts - Target number of posts
 * @returns {Promise<Array>} Array of scraped articles
 */
async function scrapeDevToArticles({
  tags = ['interview', 'career', 'hiring', 'jobsearch'],
  numberOfPosts = 500
} = {}) {
  try {
    logger.info(`[Dev.to Service] 📚 Starting scraping: target ${numberOfPosts} articles`);

    const allArticles = [];
    const postsPerTag = Math.ceil(numberOfPosts / tags.length);

    for (const tag of tags) {
      logger.info(`[Dev.to Service] 🔍 Fetching tag: #${tag} (${postsPerTag} articles)`);

      try {
        // Dev.to API allows max 1000 articles per request via pagination
        let page = 1;
        let articlesFetched = 0;

        while (articlesFetched < postsPerTag && page <= 10) { // Max 10 pages (1000 articles)
          const response = await axios.get(`${DEVTO_API}/articles`, {
            params: {
              tag: tag,
              per_page: 100, // Max allowed by API
              page: page,
              state: 'all' // Get all published articles
            },
            timeout: 10000
          });

          const articles = response.data;

          if (articles.length === 0) {
            logger.info(`[Dev.to Service] ✅ No more articles for #${tag}`);
            break;
          }

          // Filter for interview-related content AND recent date (last year)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

          const relevantArticles = articles.filter(article => {
            // Filter by relevance
            if (!isInterviewRelated(article)) return false;

            // Filter by date (only posts from last year)
            const publishedDate = new Date(article.published_at || article.created_at);
            return publishedDate >= oneYearAgo;
          });

          logger.info(`[Dev.to Service] 📥 Found ${relevantArticles.length}/${articles.length} interview-related + recent (last year) in #${tag} (page ${page})`);

          allArticles.push(...relevantArticles);
          articlesFetched += relevantArticles.length;
          page++;

          // Stop if we've reached target for this tag
          if (articlesFetched >= postsPerTag) break;

          // Rate limiting: small delay between pages
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        logger.info(`[Dev.to Service] ✅ Tag #${tag}: ${articlesFetched} articles collected`);

      } catch (tagError) {
        logger.error(`[Dev.to Service] ❌ Failed to fetch tag #${tag}:`, tagError.message);
      }
    }

    // Remove duplicates (same article can have multiple tags)
    const uniqueArticles = removeDuplicates(allArticles);

    logger.info(`[Dev.to Service] 🎉 Scraping complete: ${uniqueArticles.length} unique articles (from ${allArticles.length} total)`);

    // Transform to standard format
    return uniqueArticles.slice(0, numberOfPosts).map(transformDevToArticle);

  } catch (error) {
    logger.error('[Dev.to Service] ❌ Scraping failed:', error.message);
    return [];
  }
}

/**
 * Check if article is interview-related
 * @param {Object} article - Dev.to article object
 * @returns {boolean} True if interview-related
 */
function isInterviewRelated(article) {
  const title = (article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const tags = (article.tag_list || []).map(t => t.toLowerCase());

  const interviewKeywords = [
    'interview', 'interviewed', 'interviewing',
    'job search', 'job hunt', 'career',
    'offer', 'rejected', 'accepted',
    'technical round', 'coding challenge',
    'system design', 'behavioral',
    'google', 'amazon', 'meta', 'microsoft', 'apple',
    'faang', 'big tech'
  ];

  // Check if title, description, or tags contain interview keywords
  const hasKeywordInTitle = interviewKeywords.some(kw => title.includes(kw));
  const hasKeywordInDescription = interviewKeywords.some(kw => description.includes(kw));
  const hasKeywordInTags = interviewKeywords.some(kw => tags.some(tag => tag.includes(kw)));

  return hasKeywordInTitle || hasKeywordInDescription || hasKeywordInTags;
}

/**
 * Remove duplicate articles by ID
 * @param {Array} articles - Array of articles
 * @returns {Array} Array without duplicates
 */
function removeDuplicates(articles) {
  const seen = new Set();
  return articles.filter(article => {
    if (seen.has(article.id)) {
      return false;
    }
    seen.add(article.id);
    return true;
  });
}

/**
 * Transform Dev.to article to standard post format
 * @param {Object} article - Dev.to article object
 * @returns {Object} Standardized post object
 */
function transformDevToArticle(article) {
  return {
    postId: `devto_${article.id}`,
    title: article.title,
    bodyText: article.body_markdown || article.description || '',
    author: article.user?.name || article.user?.username || 'unknown',
    createdAt: new Date(article.published_at || article.created_at),
    url: article.url,
    source: 'devto',
    metadata: {
      tags: article.tag_list || [],
      readingTimeMinutes: article.reading_time_minutes || 0,
      positiveReactionsCount: article.positive_reactions_count || 0,
      commentsCount: article.comments_count || 0,
      coverImage: article.cover_image || null
    }
  };
}

module.exports = {
  scrapeDevToArticles,
  transformDevToArticle
};
