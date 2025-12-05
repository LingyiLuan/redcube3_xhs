# RedCube Enhanced Reddit Interview Scraper

Enhanced Reddit scraper designed to collect high-quality interview experience posts from multiple subreddits with deep comment scraping for better metadata extraction.

## Features

✅ **Multi-Subreddit Support** - Scrape from 30+ career-related subreddits simultaneously
✅ **Deep Comment Scraping** - Fetch top 10 comments per post for richer context
✅ **Interview Filtering** - Automatically filter posts related to interviews and career experiences
✅ **Quality Control** - Minimum word count filtering to ensure substantive content
✅ **Metadata Ready** - Optimized output format for downstream NLP metadata extraction

## Input Configuration

### Required Parameters

- **subreddits** (array): List of subreddit names to scrape (without r/ prefix)
  - Example: `["cscareerquestions", "ExperiencedDevs", "leetcode"]`

### Optional Parameters

- **postsPerSubreddit** (integer, default: 50): Number of posts to scrape from each subreddit
  - Range: 1-100

- **sortBy** (string, default: "new"): Sort order for posts
  - Options: "hot", "new", "top", "rising"

- **includeComments** (boolean, default: true): Whether to fetch comments
  - Recommended: true for better metadata extraction

- **maxCommentsPerPost** (integer, default: 10): Number of top comments to fetch
  - Range: 0-50

- **filterInterviewOnly** (boolean, default: true): Filter posts containing interview keywords
  - Keywords: interview, offer, reject, onsite, phone screen, etc.

- **minWordCount** (integer, default: 100): Minimum body text word count
  - Helps filter out low-quality or very short posts

## Recommended Subreddits

### Engineering (6)
- cscareerquestions
- ExperiencedDevs
- leetcode
- csMajors
- webdev
- backend

### ML/AI (4)
- MachineLearning
- MLQuestions
- LanguageTechnology
- deeplearning

### Data (4)
- dataengineering
- datascience
- BusinessIntelligence
- analytics

### Product (3)
- ProductManagement
- product_design
- userexperience

### Infrastructure (4)
- devops
- kubernetes
- aws
- sysadmin

### Companies (6)
- Google
- Meta
- Amazon
- Microsoft
- Netflix
- Apple

## Output Format

Each scraped post includes:

```json
{
  "postId": "abc123",
  "title": "Got rejected from Google L4 SWE after system design",
  "author": "username",
  "created": 1696473600,
  "createdAt": "2025-10-05T12:00:00Z",
  "score": 142,
  "num_comments": 35,
  "permalink": "/r/cscareerquestions/comments/...",
  "url": "https://reddit.com/r/cscareerquestions/...",
  "subreddit": "cscareerquestions",
  "bodyText": "Full post text...",
  "comments": [
    {
      "id": "comment1",
      "author": "helper",
      "body": "Comment text...",
      "score": 25
    }
  ],
  "comment_count": 10,
  "word_count": 150
}
```

## Setup Requirements

### Reddit API Credentials

You need to set up a Reddit app and provide OAuth credentials:

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Select **"script"** as the app type
4. Fill in:
   - Name: RedCube Interview Scraper
   - Redirect URI: http://localhost:8080
5. Copy the **Client ID** and **Client Secret**

### Environment Variables

Set these in Apify Console → Settings → Environment Variables:

```
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

## Usage Examples

### Example 1: Quick Test (5 posts from 1 subreddit)
```json
{
  "subreddits": ["cscareerquestions"],
  "postsPerSubreddit": 5,
  "includeComments": true,
  "maxCommentsPerPost": 5
}
```

### Example 2: Production Run (Multi-subreddit)
```json
{
  "subreddits": [
    "cscareerquestions",
    "ExperiencedDevs",
    "leetcode",
    "csMajors",
    "MachineLearning",
    "dataengineering"
  ],
  "postsPerSubreddit": 50,
  "sortBy": "new",
  "includeComments": true,
  "maxCommentsPerPost": 10,
  "filterInterviewOnly": true,
  "minWordCount": 100
}
```

### Example 3: Full Scale (All subreddits)
```json
{
  "subreddits": [
    "cscareerquestions", "ExperiencedDevs", "leetcode", "csMajors",
    "webdev", "backend", "MachineLearning", "MLQuestions",
    "dataengineering", "datascience", "ProductManagement",
    "devops", "kubernetes"
  ],
  "postsPerSubreddit": 50,
  "includeComments": true,
  "maxCommentsPerPost": 10
}
```

## Performance

- **Speed**: ~2-5 seconds per subreddit (depending on API response time)
- **Rate Limits**: Respects Reddit API rate limits with 1-second delays
- **Memory**: Low memory footprint (~50MB)
- **Scalability**: Can handle 30+ subreddits in single run

## Cost Estimation

- **Apify Free Tier**: $5 credit/month (~10,000 runs)
- **Typical Run**: 50 posts × 10 subreddits = 500 posts ≈ 10-20 compute units
- **Monthly Cost**: ~$1-2 for daily runs

## Integration

This scraper is designed to integrate with the RedCube content service for automatic metadata extraction including:

- Role type detection (SWE, MLE, SDE, etc.)
- Level normalization (L1-L8)
- Company extraction
- Tech stack detection
- Interview stage tracking

## Troubleshooting

**No posts scraped:**
- Verify Reddit credentials are correct
- Check subreddit names (no r/ prefix)
- Try sortBy="new" instead of "hot"

**Missing comments:**
- Ensure includeComments=true
- Check that posts have num_comments > 0
- Verify Reddit API credentials

**Low quality posts:**
- Increase minWordCount
- Enable filterInterviewOnly
- Use sortBy="top" for higher quality

## Version History

- **v2.0.0** (2025-10-10): Enhanced version with multi-subreddit support and deep comment scraping
- **v1.0.0** (2025-10-06): Initial version with basic scraping

## License

MIT

## Support

For issues or questions, check the [APIFY_DEPLOYMENT_GUIDE.md](../APIFY_DEPLOYMENT_GUIDE.md) or open an issue in the repository.
