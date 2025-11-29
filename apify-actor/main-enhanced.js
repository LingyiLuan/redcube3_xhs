/**
 * RedCube XHS - Enhanced Autonomous Reddit Interview Data Scraper
 * Phase 5.1 Enhancements:
 * - Multi-subreddit support (30+ subreddits)
 * - Deep comment scraping (top 10 comments per post)
 * - Enhanced metadata extraction
 * - Retry logic and error handling
 * - Rate limiting
 */

import { Actor } from 'apify';
import { gotScraping } from 'got-scraping';

// ============================================
// CONFIGURATION
// ============================================

const TARGET_SUBREDDITS = {
  // Software Engineering (Priority 1)
  engineering: [
    'cscareerquestions',
    'ExperiencedDevs',
    'leetcode',
    'csMajors',
    'webdev',
    'backend'
  ],

  // ML/AI (Priority 2)
  ml_ai: [
    'MachineLearning',
    'MLQuestions',
    'LanguageTechnology',
    'deeplearning'
  ],

  // Data (Priority 3)
  data: [
    'dataengineering',
    'datascience',
    'BusinessIntelligence',
    'analytics'
  ],

  // Product & Design (Priority 4)
  product: [
    'ProductManagement',
    'product_design',
    'userexperience'
  ],

  // Infrastructure (Priority 5)
  infra: [
    'devops',
    'kubernetes',
    'aws',
    'sysadmin'
  ],

  // Company-specific (Priority 6)
  companies: [
    'Google',
    'Meta',
    'Amazon',
    'Microsoft',
    'Netflix',
    'Apple'
  ],

  // General Career (Priority 7)
  general: [
    'careerguidance',
    'cscareerquestionsEU',
    'cscareerquestionsCAD'
  ]
};

// Flatten all subreddits into a single array
const ALL_SUBREDDITS = Object.values(TARGET_SUBREDDITS).flat();

// Keyword-based outcome detection
const POSITIVE_KEYWORDS = [
    'got the offer', 'received an offer', 'passed', 'hired',
    'accepted the offer', 'landed the job', 'got hired', 'offer accepted',
    'successful interview', 'moving forward', 'starting soon', 'accepted position'
];

const NEGATIVE_KEYWORDS = [
    'rejected', 'didn\'t pass', 'failed', 'ghosted',
    'did not receive an offer', 'didn\'t get', 'turned down', 'no offer',
    'rejection', 'unsuccessful', 'bombed', 'didn\'t make it'
];

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Get OAuth2 access token from Reddit
 */
async function getToken(clientId, clientSecret, username, password) {
    if (!clientId || !clientSecret || !username || !password) {
        throw new Error('Missing Reddit OAuth credentials');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('🔐 Authenticating with Reddit API...');

    const response = await gotScraping({
        url: 'https://www.reddit.com/api/v1/access_token',
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'RedCubeXHS/2.0.0 (by /u/' + username + ')',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=password&username=${username}&password=${password}`,
        responseType: 'json',
        retry: {
            limit: 3,
            methods: ['POST']
        }
    });

    if (!response.body || !response.body.access_token) {
        throw new Error('Failed to get access token from Reddit');
    }

    console.log('✅ Successfully authenticated with Reddit');
    return response.body.access_token;
}

// ============================================
// DATA FETCHING
// ============================================

/**
 * Fetch posts from a subreddit with retry logic
 */
async function fetchPosts(accessToken, subreddit, limit, sortBy = 'new') {
    console.log(`📡 Fetching ${limit} posts from r/${subreddit} (${sortBy})...`);

    try {
        const response = await gotScraping({
            url: `https://oauth.reddit.com/r/${subreddit}/${sortBy}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'RedCubeXHS/2.0.0'
            },
            searchParams: {
                limit: limit,
                raw_json: 1
            },
            responseType: 'json',
            retry: {
                limit: 3,
                methods: ['GET']
            },
            timeout: {
                request: 30000
            }
        });

        if (!response.body || !response.body.data || !response.body.data.children) {
            throw new Error('Invalid response from Reddit API');
        }

        const posts = response.body.data.children.map(child => {
            const post = child.data;
            return {
                title: post.title,
                url: `https://www.reddit.com${post.permalink}`,
                created_utc: post.created_utc,
                id: post.id,
                author: post.author,
                selftext: post.selftext || '',
                is_video: post.is_video || false,
                stickied: post.stickied || false,
                subreddit: subreddit,
                num_comments: post.num_comments || 0,
                score: post.score || 0,
                permalink: post.permalink
            };
        });

        console.log(`✅ Retrieved ${posts.length} posts from r/${subreddit}`);
        return posts;
    } catch (error) {
        console.error(`❌ Error fetching from r/${subreddit}:`, error.message);
        return [];
    }
}

/**
 * Fetch comments for a specific post (NEW: Phase 5.1)
 */
async function fetchComments(accessToken, permalink, maxComments = 10) {
    try {
        const response = await gotScraping({
            url: `https://oauth.reddit.com${permalink}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'RedCubeXHS/2.0.0'
            },
            searchParams: {
                depth: 2,
                limit: maxComments,
                raw_json: 1
            },
            responseType: 'json',
            retry: {
                limit: 2
            },
            timeout: {
                request: 15000
            }
        });

        if (!response.body || !Array.isArray(response.body) || response.body.length < 2) {
            return [];
        }

        const commentData = response.body[1].data.children;
        const comments = [];

        for (const comment of commentData) {
            if (comment.kind === 't1' && comment.data.body) {
                comments.push({
                    id: comment.data.id,
                    author: comment.data.author,
                    body: comment.data.body,
                    score: comment.data.score || 0,
                    created_utc: comment.data.created_utc
                });

                if (comments.length >= maxComments) break;
            }
        }

        return comments;
    } catch (error) {
        console.warn(`⚠️ Failed to fetch comments for ${permalink}:`, error.message);
        return [];
    }
}

// ============================================
// DATA PROCESSING
// ============================================

/**
 * Detect interview outcome from post text
 */
function detectOutcome(bodyText) {
    if (!bodyText) return 'unknown';

    const lowerText = bodyText.toLowerCase();

    const hasPositive = POSITIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
    if (hasPositive) return 'positive';

    const hasNegative = NEGATIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
    if (hasNegative) return 'negative';

    return 'unknown';
}

/**
 * Extract metadata from post text (Basic - detailed extraction happens in metadata-extraction-service)
 */
function extractMetadata(bodyText, title) {
    const combinedText = `${title} ${bodyText}`.toLowerCase();

    const companies = ['google', 'amazon', 'meta', 'facebook', 'microsoft', 'apple',
                      'netflix', 'uber', 'lyft', 'airbnb', 'stripe', 'twitter', 'tesla'];
    const foundCompanies = companies.filter(c => combinedText.includes(c));

    const roles = ['software engineer', 'swe', 'frontend', 'backend', 'full stack',
                  'data scientist', 'ml engineer', 'devops', 'product manager'];
    const foundRoles = roles.filter(r => combinedText.includes(r));

    const techs = ['python', 'java', 'javascript', 'react', 'node', 'typescript',
                  'aws', 'docker', 'kubernetes', 'machine learning', 'sql'];
    const foundTechs = techs.filter(t => combinedText.includes(t));

    return {
        companies: foundCompanies,
        roles: foundRoles,
        technologies: foundTechs
    };
}

/**
 * Filter posts for interview-related content
 */
function isInterviewRelated(post) {
    const combinedText = `${post.title} ${post.selftext}`.toLowerCase();

    const interviewKeywords = [
        'interview', 'offer', 'rejected', 'hired', 'onsite', 'phone screen',
        'coding round', 'system design', 'behavioral', 'leetcode', 'got the job',
        'failed', 'passed', 'application', 'recruiter', 'hiring manager'
    ];

    return interviewKeywords.some(keyword => combinedText.includes(keyword));
}

// ============================================
// RATE LIMITING
// ============================================

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN ACTOR LOGIC
// ============================================

await Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        // NEW: Support for multiple subreddits
        subreddits = ['cscareerquestions'], // Can be array or single string
        postsPerSubreddit = 50,
        sortBy = 'new', // 'new', 'hot', 'top'

        // NEW: Comment scraping
        includeComments = true,
        maxCommentsPerPost = 10,

        // Filter options
        filterInterviewOnly = true,
        minWordCount = 100,

        // Credentials
        redditClientId = process.env.REDDIT_CLIENT_ID,
        redditSecret = process.env.REDDIT_SECRET,
        redditUser = process.env.REDDIT_USER,
        redditPass = process.env.REDDIT_PASS
    } = input || {};

    // Normalize subreddits to array
    const targetSubreddits = Array.isArray(subreddits) ? subreddits : [subreddits];

    console.log(`🚀 Enhanced Reddit Scraper Started`);
    console.log(`📊 Target: ${targetSubreddits.length} subreddits × ${postsPerSubreddit} posts = ${targetSubreddits.length * postsPerSubreddit} posts`);
    console.log(`💬 Comments: ${includeComments ? `Enabled (${maxCommentsPerPost} per post)` : 'Disabled'}`);
    console.log(`🔍 Filter: ${filterInterviewOnly ? 'Interview-related only' : 'All posts'}`);

    try {
        // Step 1: Authenticate
        const accessToken = await getToken(redditClientId, redditSecret, redditUser, redditPass);

        // Step 2: Scrape all subreddits
        let allProcessedPosts = [];
        let totalFetched = 0;
        let totalProcessed = 0;

        for (const subreddit of targetSubreddits) {
            console.log(`\n📦 Processing r/${subreddit}...`);

            // Fetch posts
            const posts = await fetchPosts(accessToken, subreddit, postsPerSubreddit, sortBy);
            totalFetched += posts.length;

            // Rate limiting between subreddits
            await sleep(1000);

            // Process each post
            for (const post of posts) {
                // Skip stickied posts and videos
                if (post.stickied || post.is_video) {
                    continue;
                }

                // Skip short posts
                if (post.selftext.length < minWordCount) {
                    continue;
                }

                // Filter for interview-related content
                if (filterInterviewOnly && !isInterviewRelated(post)) {
                    continue;
                }

                // Detect outcome and extract metadata
                const potential_outcome = detectOutcome(post.selftext);
                const metadata = extractMetadata(post.selftext, post.title);

                // NEW: Fetch comments if enabled
                let comments = [];
                if (includeComments && post.num_comments > 0) {
                    comments = await fetchComments(accessToken, post.permalink, maxCommentsPerPost);
                    console.log(`  💬 Fetched ${comments.length} comments for: ${post.title.substring(0, 50)}...`);

                    // Rate limiting between comment fetches
                    await sleep(500);
                }

                // Calculate confidence score
                const hasDetailedContent = post.selftext.length > 200;
                const hasComments = comments.length > 0;
                const confidence = potential_outcome === 'unknown' ? 0.3 :
                                 (hasDetailedContent && hasComments ? 0.9 :
                                  hasDetailedContent ? 0.7 : 0.5);

                const processedPost = {
                    postId: post.id,
                    title: post.title,
                    author: post.author,
                    createdAt: new Date(post.created_utc * 1000).toISOString(),
                    url: post.url,
                    bodyText: post.selftext,
                    potential_outcome,
                    confidence_score: confidence,
                    subreddit: post.subreddit,
                    metadata,
                    word_count: post.selftext.split(/\s+/).length,
                    scrapedAt: new Date().toISOString(),

                    // NEW Phase 5.1 fields
                    comments: comments,
                    comment_count: comments.length,
                    post_score: post.score,
                    num_comments_reddit: post.num_comments
                };

                await Actor.pushData(processedPost);
                allProcessedPosts.push(processedPost);
                totalProcessed++;
            }

            console.log(`✅ r/${subreddit}: Processed ${totalProcessed} posts`);
        }

        // Final summary
        console.log(`\n📊 ===== SCRAPING SUMMARY =====`);
        console.log(`Total Subreddits: ${targetSubreddits.length}`);
        console.log(`Total Posts Fetched: ${totalFetched}`);
        console.log(`Total Posts Processed: ${totalProcessed}`);
        console.log(`Total Comments Fetched: ${allProcessedPosts.reduce((sum, p) => sum + (p.comment_count || 0), 0)}`);
        console.log(`Average Posts per Subreddit: ${(totalProcessed / targetSubreddits.length).toFixed(1)}`);
        console.log(`Success Rate: ${((totalProcessed / totalFetched) * 100).toFixed(1)}%`);

        // Save summary
        await Actor.setValue('SCRAPING_SUMMARY', {
            subreddits: targetSubreddits,
            totalFetched,
            totalProcessed,
            timestamp: new Date().toISOString(),
            config: {
                postsPerSubreddit,
                includeComments,
                maxCommentsPerPost,
                filterInterviewOnly
            }
        });

        console.log(`✅ Actor completed successfully!`);

    } catch (error) {
        console.error('❌ Actor failed:', error);
        throw error;
    }
});
