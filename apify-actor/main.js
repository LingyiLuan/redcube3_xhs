/**
 * RedCube XHS - Autonomous Reddit Interview Data Scraper
 * Using Reddit's Official OAuth2 API
 */

import { Actor } from 'apify';
import { gotScraping } from 'got-scraping';

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

/**
 * Get OAuth2 access token from Reddit
 */
async function getToken(clientId, clientSecret, username, password) {
    if (!clientId || !clientSecret || !username || !password) {
        throw new Error('Missing Reddit OAuth credentials. Please provide credentials via input parameters.');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('🔐 Authenticating with Reddit API...');

    const response = await gotScraping({
        url: 'https://www.reddit.com/api/v1/access_token',
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'RedCubeXHS/1.0.0 (by /u/' + username + ')',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=password&username=${username}&password=${password}`,
        responseType: 'json'
    });

    if (!response.body || !response.body.access_token) {
        console.error('❌ Reddit API Response:', JSON.stringify(response.body, null, 2));
        console.error('❌ Response Status:', response.statusCode);
        throw new Error('Failed to get access token from Reddit: ' + (response.body?.error || 'No access_token in response'));
    }

    console.log('✅ Successfully authenticated with Reddit');
    return response.body.access_token;
}

/**
 * Fetch posts from Reddit using OAuth2
 */
async function fetchPosts(accessToken, subreddit, limit) {
    console.log(`📡 Fetching ${limit} posts from r/${subreddit}...`);

    const response = await gotScraping({
        url: `https://oauth.reddit.com/r/${subreddit}/new`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'RedCubeXHS/1.0.0'
        },
        searchParams: {
            limit: limit
        },
        responseType: 'json'
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
            stickied: post.stickied || false
        };
    });

    console.log(`✅ Retrieved ${posts.length} posts from Reddit API`);
    return posts;
}

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
 * Extract metadata from post text
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

await Actor.main(async () => {
    // Get input from Apify platform
    const input = await Actor.getInput();
    const {
        subreddit = 'cscareerquestions',
        numberOfPosts = 25,
        limit = 25,
        // Accept Reddit credentials from input OR environment variables
        redditClientId = process.env.REDDIT_CLIENT_ID,
        redditSecret = process.env.REDDIT_SECRET,
        redditUser = process.env.REDDIT_USER,
        redditPass = process.env.REDDIT_PASS
    } = input || {};

    // Override environment variables with input if provided
    if (redditClientId) process.env.REDDIT_CLIENT_ID = redditClientId;
    if (redditSecret) process.env.REDDIT_SECRET = redditSecret;
    if (redditUser) process.env.REDDIT_USER = redditUser;
    if (redditPass) process.env.REDDIT_PASS = redditPass;

    const actualLimit = numberOfPosts || limit;

    console.log(`🚀 Starting Reddit scraper for r/${subreddit}`);
    console.log(`📊 Target: ${actualLimit} posts`);

    try {
        // Step 1: Authenticate with Reddit using credentials from input
        const accessToken = await getToken(
            redditClientId,
            redditSecret,
            redditUser,
            redditPass
        );

        // Step 2: Fetch posts from Reddit
        const posts = await fetchPosts(accessToken, subreddit, actualLimit);

        // Step 3: Process and label each post
        let processedCount = 0;
        const outcomes = { positive: 0, negative: 0, unknown: 0 };

        for (const post of posts) {
            // Skip stickied posts and videos
            if (post.stickied || post.is_video) {
                console.log(`⏩ Skipping stickied/video post: ${post.title.substring(0, 30)}...`);
                continue;
            }

            const potential_outcome = detectOutcome(post.selftext);
            const metadata = extractMetadata(post.selftext, post.title);

            const hasDetailedContent = post.selftext.length > 200;
            const confidence = potential_outcome === 'unknown' ? 0.3 :
                             (hasDetailedContent ? 0.8 : 0.6);

            const processedPost = {
                postId: post.id,
                title: post.title,
                author: post.author,
                createdAt: new Date(post.created_utc * 1000).toISOString(),
                url: post.url,
                bodyText: post.selftext.substring(0, 5000),
                potential_outcome,
                confidence_score: confidence,
                subreddit,
                metadata,
                word_count: post.selftext.split(/\s+/).filter(w => w.length > 0).length,
                scrapedAt: new Date().toISOString()
            };

            await Actor.pushData(processedPost);
            processedCount++;
            outcomes[potential_outcome]++;

            console.log(`✅ Processed post ${processedCount}/${actualLimit}: [${potential_outcome}] - ${post.title.substring(0, 40)}...`);
        }

        // Summary
        const summary = {
            totalScraped: processedCount,
            outcomes,
            subreddit,
            completedAt: new Date().toISOString()
        };

        console.log('\n📊 SCRAPING SUMMARY:');
        console.log(`   Total Posts: ${summary.totalScraped}`);
        console.log(`   ✅ Positive: ${summary.outcomes.positive}`);
        console.log(`   ❌ Negative: ${summary.outcomes.negative}`);
        console.log(`   ❓ Unknown: ${summary.outcomes.unknown}`);

        await Actor.setValue('SUMMARY', summary);

        console.log('🎉 Scraping completed successfully!');

    } catch (error) {
        console.error('❌ Error during scraping:', error.message);
        throw error;
    }
});
