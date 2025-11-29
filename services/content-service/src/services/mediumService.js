const Parser = require('rss-parser');
const logger = require('../utils/logger');

/**
 * Medium service for scraping tech interview articles via RSS feeds
 * Uses Medium's public RSS feeds (no API key needed)
 *
 * Note: RSS feeds are limited to ~25 posts per feed
 * For larger scraping, consider Apify's Medium scraper
 */

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator']
  }
});

/**
 * Scrape interview articles from Medium RSS feeds
 * @param {Object} options - Scraping options
 * @param {Array<string>} options.tags - Tags to scrape
 * @param {number} options.numberOfPosts - Target number of posts (limited by RSS)
 * @returns {Promise<Array>} Array of scraped articles
 */
async function scrapeMediumArticles({
  tags = ['interview', 'tech-interview', 'job-interview', 'coding-interview'],
  numberOfPosts = 100
} = {}) {
  try {
    logger.info(`[Medium Service] 📖 Starting RSS scraping: target ${numberOfPosts} articles`);

    const allArticles = [];

    for (const tag of tags) {
      logger.info(`[Medium Service] 🔍 Fetching RSS feed for tag: ${tag}`);

      try {
        // Medium RSS feed format
        const feedUrl = `https://medium.com/feed/tag/${tag}`;

        const feed = await parser.parseURL(feedUrl);

        if (!feed || !feed.items) {
          logger.warn(`[Medium Service] ⚠️ No feed found for tag: ${tag}`);
          continue;
        }

        logger.info(`[Medium Service] 📥 Found ${feed.items.length} articles in feed: ${tag}`);

        // Filter for interview-related content
        const relevantArticles = feed.items.filter(isInterviewRelated);

        logger.info(`[Medium Service] ✅ Found ${relevantArticles.length}/${feed.items.length} interview-related in tag: ${tag}`);

        allArticles.push(...relevantArticles);

        // Stop if we've reached target
        if (allArticles.length >= numberOfPosts) break;

        // Rate limiting: delay between feeds
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (tagError) {
        logger.error(`[Medium Service] ❌ Failed to fetch tag ${tag}:`, tagError.message);
      }
    }

    // Remove duplicates
    const uniqueArticles = removeDuplicates(allArticles);

    logger.info(`[Medium Service] 🎉 Scraping complete: ${uniqueArticles.length} unique articles (from ${allArticles.length} total)`);

    // Transform to standard format
    return uniqueArticles.slice(0, numberOfPosts).map(transformMediumArticle);

  } catch (error) {
    logger.error('[Medium Service] ❌ Scraping failed:', error.message);
    return [];
  }
}

/**
 * Check if article is interview-related
 * @param {Object} article - Medium RSS item
 * @returns {boolean} True if interview-related
 */
function isInterviewRelated(article) {
  const title = (article.title || '').toLowerCase();
  const content = (article['content:encoded'] || article.contentSnippet || '').toLowerCase();
  const categories = (article.categories || []).map(c => c.toLowerCase());

  const interviewKeywords = [
    'interview', 'interviewed', 'interviewing',
    'job search', 'career', 'offer',
    'technical round', 'coding challenge',
    'system design', 'behavioral',
    'google', 'amazon', 'meta', 'microsoft', 'apple',
    'faang', 'big tech', 'software engineer',
    'rejection', 'accepted'
  ];

  // Check if title, content, or categories contain interview keywords
  const hasKeywordInTitle = interviewKeywords.some(kw => title.includes(kw));
  const hasKeywordInContent = interviewKeywords.some(kw => content.includes(kw));
  const hasKeywordInCategories = interviewKeywords.some(kw =>
    categories.some(cat => cat.includes(kw))
  );

  return hasKeywordInTitle || hasKeywordInContent || hasKeywordInCategories;
}

/**
 * Remove duplicate articles by link
 * @param {Array} articles - Array of articles
 * @returns {Array} Array without duplicates
 */
function removeDuplicates(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const link = article.link || article.guid;
    if (seen.has(link)) {
      return false;
    }
    seen.add(link);
    return true;
  });
}

/**
 * Transform Medium RSS item to standard post format
 * @param {Object} article - Medium RSS item
 * @returns {Object} Standardized post object
 */
function transformMediumArticle(article) {
  // Extract ID from Medium URL (e.g., https://medium.com/@user/title-abc123 → abc123)
  const urlMatch = (article.link || '').match(/-([a-f0-9]+)$/);
  const postId = urlMatch ? urlMatch[1] : article.guid || article.link;

  return {
    postId: `medium_${postId}`,
    title: article.title,
    bodyText: article['content:encoded'] || article.contentSnippet || article.content || '',
    author: article['dc:creator'] || article.creator || 'unknown',
    createdAt: new Date(article.pubDate || article.isoDate),
    url: article.link,
    source: 'medium',
    metadata: {
      categories: article.categories || [],
      guid: article.guid
    }
  };
}

module.exports = {
  scrapeMediumArticles,
  transformMediumArticle
};
