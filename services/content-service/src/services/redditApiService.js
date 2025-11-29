/**
 * Reddit API Service
 * Direct Reddit API integration to replace Apify
 * Cost: $0/month (vs $100-150/month for Apify)
 * Rate Limit: 100 requests/minute = 1,000+ posts/hour
 */

const axios = require('axios');
const logger = require('../utils/logger');

class RedditApiService {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_SECRET;
    this.username = process.env.REDDIT_USER;
    this.password = process.env.REDDIT_PASS;

    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.userAgent = 'RedCube3:v1.0.0 (by /u/' + this.username + ')';

    // Base URLs
    this.authUrl = 'https://www.reddit.com/api/v1/access_token';
    this.apiUrl = 'https://oauth.reddit.com';
  }

  /**
   * Authenticate with Reddit OAuth2
   */
  async authenticate() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      logger.info('[Reddit API] Using cached access token');
      return this.accessToken;
    }

    logger.info('[Reddit API] Authenticating with OAuth2...');

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early

      logger.info('[Reddit API] ✅ Authentication successful');
      return this.accessToken;

    } catch (error) {
      logger.error('[Reddit API] ❌ Authentication failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error('Reddit authentication failed: ' + error.message);
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, params = {}) {
    await this.authenticate();

    try {
      const response = await axios.get(`${this.apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': this.userAgent
        },
        params
      });

      return response.data;

    } catch (error) {
      logger.error('[Reddit API] Request failed:', {
        endpoint,
        message: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Scrape posts from a subreddit
   * @param {Object} options - Scraping options
   * @returns {Array} Array of scraped posts
   */
  async scrapeSubreddit(options = {}) {
    const {
      subreddit = 'cscareerquestions',
      numberOfPosts = 100,
      sortBy = 'new', // new, hot, top, rising
      timeFilter = 'week' // hour, day, week, month, year, all (for 'top' sort)
    } = options;

    logger.info(`[Reddit API] 🕷️ Scraping r/${subreddit}: ${numberOfPosts} posts (${sortBy})`);

    const posts = [];
    let after = null;
    const limit = 100; // Reddit API max per request

    try {
      while (posts.length < numberOfPosts) {
        const batchSize = Math.min(limit, numberOfPosts - posts.length);

        const params = {
          limit: batchSize,
          after: after
        };

        // Add time filter for 'top' sorting
        if (sortBy === 'top') {
          params.t = timeFilter;
        }

        logger.info(`[Reddit API] Fetching batch: ${posts.length}/${numberOfPosts}...`);

        const data = await this.makeRequest(`/r/${subreddit}/${sortBy}`, params);

        if (!data.data || !data.data.children || data.data.children.length === 0) {
          logger.info('[Reddit API] No more posts available');
          break;
        }

        // Process posts
        for (const child of data.data.children) {
          const post = child.data;

          // Filter for interview-related posts
          if (this.isInterviewRelated(post)) {
            const scrapedPost = this.transformPost(post, subreddit);
            posts.push(scrapedPost);
          }

          if (posts.length >= numberOfPosts) break;
        }

        // Get next page cursor
        after = data.data.after;

        if (!after) {
          logger.info('[Reddit API] Reached end of available posts');
          break;
        }

        // Rate limiting: Wait 1 second between requests
        await this.sleep(1000);
      }

      logger.info(`[Reddit API] ✅ Scraped ${posts.length} posts from r/${subreddit}`);

      // Get summary statistics
      const stats = this.calculateStats(posts);
      logger.info('[Reddit API] 📊 Summary:', stats);

      return posts;

    } catch (error) {
      logger.error('[Reddit API] ❌ Scraping failed:', error.message);
      throw error;
    }
  }

  /**
   * Check if post is interview-related
   */
  isInterviewRelated(post) {
    const title = (post.title || '').toLowerCase();
    const body = (post.selftext || '').toLowerCase();
    const combined = title + ' ' + body;

    const interviewKeywords = [
      'interview', 'interviewing', 'interviewed',
      'offer', 'offers', 'offered',
      'onsite', 'on-site',
      'phone screen', 'technical screen',
      'coding challenge', 'take home', 'takehome',
      'behavioral', 'culture fit',
      'system design', 'systems design',
      'hiring', 'recruiter', 'recruiting',
      'got the job', 'accepted offer',
      'rejected', 'rejection',
      'leetcode', 'hackerrank', 'codesignal',
      'final round', 'first round',
      'job search', 'job hunt'
    ];

    return interviewKeywords.some(keyword => combined.includes(keyword));
  }

  /**
   * Transform Reddit post to our schema
   */
  transformPost(post, subreddit) {
    const scrapedAt = new Date().toISOString();
    const createdAt = new Date(post.created_utc * 1000).toISOString();

    // Extract outcome signals
    const outcome = this.detectOutcome(post);

    return {
      postId: post.id,
      title: post.title,
      author: post.author,
      createdAt: createdAt,
      url: `https://reddit.com${post.permalink}`,
      bodyText: post.selftext || '',
      potential_outcome: outcome.outcome,
      confidence_score: outcome.confidence,
      subreddit: subreddit,
      metadata: {
        upvotes: post.ups,
        downvotes: post.downs || 0,
        score: post.score,
        num_comments: post.num_comments,
        upvote_ratio: post.upvote_ratio,
        flair: post.link_flair_text || null,
        gilded: post.gilded || 0,
        is_self: post.is_self,
        over_18: post.over_18
      },
      word_count: (post.selftext || '').split(/\s+/).length,
      scrapedAt: scrapedAt,
      comments: [] // Comments would require additional API calls
    };
  }

  /**
   * Detect outcome from post content
   */
  detectOutcome(post) {
    const text = `${post.title} ${post.selftext}`.toLowerCase();

    // Positive signals
    const positiveKeywords = [
      'got offer', 'accepted offer', 'received offer', 'offer accepted',
      'passed', 'passed interview', 'got the job', 'hired',
      'successful', 'success', 'went well', 'positive experience',
      'moving forward', 'next round', 'final round'
    ];

    // Negative signals
    const negativeKeywords = [
      'rejected', 'rejection', 'didn\'t get', 'did not get',
      'failed', 'bombing', 'bombed', 'terrible',
      'ghosted', 'no response', 'heard nothing',
      'bad experience', 'horrible', 'awful'
    ];

    const positiveScore = positiveKeywords.filter(kw => text.includes(kw)).length;
    const negativeScore = negativeKeywords.filter(kw => text.includes(kw)).length;

    if (positiveScore > negativeScore) {
      return { outcome: 'positive', confidence: Math.min(0.9, 0.6 + (positiveScore * 0.1)) };
    } else if (negativeScore > positiveScore) {
      return { outcome: 'negative', confidence: Math.min(0.9, 0.6 + (negativeScore * 0.1)) };
    } else {
      return { outcome: 'unknown', confidence: 0.5 };
    }
  }

  /**
   * Calculate scraping statistics
   */
  calculateStats(posts) {
    const outcomes = {
      positive: 0,
      negative: 0,
      unknown: 0
    };

    posts.forEach(post => {
      outcomes[post.potential_outcome]++;
    });

    return {
      totalPosts: posts.length,
      positive: outcomes.positive,
      negative: outcomes.negative,
      unknown: outcomes.unknown,
      avgWordCount: Math.round(posts.reduce((sum, p) => sum + p.word_count, 0) / posts.length),
      dateRange: {
        earliest: posts.length > 0 ? new Date(Math.min(...posts.map(p => new Date(p.createdAt)))).toISOString() : null,
        latest: posts.length > 0 ? new Date(Math.max(...posts.map(p => new Date(p.createdAt)))).toISOString() : null
      }
    };
  }

  /**
   * Search Reddit for specific query in a subreddit
   * Used by targetedCompanyScraper for finding company-specific posts
   */
  async searchReddit(options = {}) {
    const {
      query,
      subreddit = 'cscareerquestions',
      limit = 100,
      sortBy = 'relevance', // relevance, hot, top, new, comments
      timeFilter = 'all' // hour, day, week, month, year, all
    } = options;

    if (!query) {
      throw new Error('Search query is required');
    }

    logger.info(`[Reddit Search] 🔍 "${query}" in r/${subreddit} (limit: ${limit}, sort: ${sortBy})`);

    try {
      const params = {
        q: query,
        restrict_sr: true,
        sort: sortBy,
        limit: Math.min(limit, 100), // Reddit API max
        t: timeFilter
      };

      const data = await this.makeRequest(`/r/${subreddit}/search`, params);

      if (!data.data || !data.data.children || data.data.children.length === 0) {
        logger.info(`[Reddit Search] No results for "${query}" in r/${subreddit}`);
        return [];
      }

      const posts = [];
      for (const child of data.data.children) {
        const post = child.data;
        // Transform all posts (targeted scraper will do its own filtering)
        posts.push(this.transformPost(post, subreddit));
      }

      logger.info(`[Reddit Search] ✅ Found ${posts.length} posts for "${query}" in r/${subreddit}`);
      return posts;

    } catch (error) {
      logger.error(`[Reddit Search] ❌ Error searching r/${subreddit}:`, error.message);
      return [];
    }
  }

  /**
   * Search across multiple subreddits
   */
  async searchInterviewPosts(options = {}) {
    const {
      query = 'interview OR offer OR hiring',
      subreddits = ['cscareerquestions', 'experiencedevs', 'cscareerquestionsEU'],
      numberOfPosts = 100,
      timeFilter = 'week'
    } = options;

    logger.info(`[Reddit API] 🔍 Searching: "${query}" across ${subreddits.length} subreddits`);

    const allPosts = [];

    for (const subreddit of subreddits) {
      try {
        const params = {
          q: query,
          restrict_sr: true,
          sort: 'new',
          limit: Math.ceil(numberOfPosts / subreddits.length),
          t: timeFilter
        };

        const data = await this.makeRequest(`/r/${subreddit}/search`, params);

        if (data.data && data.data.children) {
          for (const child of data.data.children) {
            const post = child.data;
            if (this.isInterviewRelated(post)) {
              allPosts.push(this.transformPost(post, subreddit));
            }
          }
        }

        // Rate limiting
        await this.sleep(1000);

      } catch (error) {
        logger.error(`[Reddit API] Error searching r/${subreddit}:`, error.message);
      }
    }

    logger.info(`[Reddit API] ✅ Found ${allPosts.length} posts across ${subreddits.length} subreddits`);
    return allPosts;
  }

  /**
   * Scrape posts targeting specific companies
   */
  async scrapeByCompanies(companies = [], options = {}) {
    const {
      subreddit = 'cscareerquestions',
      postsPerCompany = 50
    } = options;

    logger.info(`[Reddit API] 🎯 Targeting ${companies.length} companies: ${companies.join(', ')}`);

    const allPosts = [];

    for (const company of companies) {
      try {
        const query = `${company} AND (interview OR offer OR hiring)`;
        const params = {
          q: query,
          restrict_sr: true,
          sort: 'new',
          limit: postsPerCompany,
          t: 'month'
        };

        logger.info(`[Reddit API] Searching for ${company}...`);
        const data = await this.makeRequest(`/r/${subreddit}/search`, params);

        if (data.data && data.data.children) {
          for (const child of data.data.children) {
            const post = child.data;
            if (this.isInterviewRelated(post)) {
              const transformed = this.transformPost(post, subreddit);
              // Add company metadata
              transformed.metadata.company = company;
              allPosts.push(transformed);
            }
          }
        }

        logger.info(`[Reddit API] Found ${allPosts.length} posts for ${company}`);

        // Rate limiting
        await this.sleep(1000);

      } catch (error) {
        logger.error(`[Reddit API] Error searching ${company}:`, error.message);
      }
    }

    logger.info(`[Reddit API] ✅ Total: ${allPosts.length} posts for ${companies.length} companies`);
    return allPosts;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection
   */
  async testConnection() {
    logger.info('[Reddit API] Testing connection...');

    try {
      await this.authenticate();
      const data = await this.makeRequest('/api/v1/me');

      logger.info('[Reddit API] ✅ Connection successful!', {
        username: data.name,
        karma: data.total_karma
      });

      return { success: true, username: data.name };

    } catch (error) {
      logger.error('[Reddit API] ❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RedditApiService();
