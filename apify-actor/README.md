# RedCube Reddit Interview Data Scraper

An autonomous Apify Actor that scrapes Reddit for interview experience posts and automatically labels them with outcome predictions.

## Features

- 🎯 **Targeted Scraping**: Collects posts from career-focused subreddits (e.g., r/cscareerquestions)
- 🤖 **Automatic Labeling**: Uses keyword analysis to detect interview outcomes (positive/negative/unknown)
- 📊 **Rich Metadata**: Extracts companies, roles, and technologies mentioned
- ✅ **Confidence Scoring**: Rates the reliability of each outcome prediction
- 💾 **Structured Output**: Returns clean JSON data ready for ML training

## How It Works

### 1. Data Collection
The scraper navigates to the specified subreddit and collects the top posts based on your sorting preference (new/hot/top).

### 2. Outcome Detection
For each post, the scraper analyzes the body text for keywords indicating success or failure:

**Positive Keywords:**
- "got the offer", "received an offer", "passed", "hired", "accepted the offer"

**Negative Keywords:**
- "rejected", "didn't pass", "failed", "ghosted", "did not receive an offer"

### 3. Metadata Extraction
Automatically identifies:
- **Companies**: Google, Amazon, Meta, Microsoft, etc.
- **Roles**: Software Engineer, Data Scientist, DevOps, etc.
- **Technologies**: Python, React, AWS, Docker, etc.

### 4. Quality Scoring
Each post receives a confidence score (0.3-0.8) based on:
- Text length (longer posts = more reliable)
- Presence of clear outcome keywords
- Detail level

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `subreddit` | string | `cscareerquestions` | Subreddit name (without 'r/') |
| `numberOfPosts` | integer | `25` | Number of posts to scrape (1-100) |
| `sortBy` | string | `new` | Sort method: `new`, `hot`, or `top` |

## Output Format

Each scraped post returns:

```json
{
  "postId": "t3_abc123",
  "title": "Got an offer from Google after 5 rounds!",
  "author": "username",
  "createdAt": "2024-01-15T10:30:00Z",
  "url": "https://old.reddit.com/r/cscareerquestions/...",
  "bodyText": "Full post content...",
  "potential_outcome": "positive",
  "confidence_score": 0.8,
  "subreddit": "cscareerquestions",
  "metadata": {
    "companies": ["google"],
    "roles": ["software engineer"],
    "technologies": ["python", "react"]
  },
  "word_count": 342,
  "scrapedAt": "2024-01-20T15:45:00Z"
}
```

## Usage with Apify

### 1. Deploy to Apify
```bash
# Install Apify CLI
npm install -g apify-cli

# Login to Apify
apify login

# Create new actor
apify init

# Deploy
apify push
```

### 2. Run via Apify Console
1. Go to [Apify Console](https://console.apify.com)
2. Navigate to your actor
3. Click "Try it"
4. Set input parameters
5. Click "Start"

### 3. Run via API (for backend integration)
```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const run = await client.actor('YOUR_ACTOR_ID').call({
  subreddit: 'cscareerquestions',
  numberOfPosts: 50,
  sortBy: 'new'
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items);
```

## Example Results

After scraping 25 posts, you might get:
- ✅ 8 positive outcomes (successful interviews)
- ❌ 5 negative outcomes (rejections)
- ❓ 12 unknown outcomes (no clear result mentioned)
- Average confidence: 0.72

## Integration with RedCube Backend

This actor is designed to work with the RedCube XHS `agentService.js`, which:
1. Triggers the actor on a weekly schedule
2. Fetches the results
3. Processes and stores the data in PostgreSQL
4. Uses the labeled data for ML training

## Development

### Local Testing
```bash
cd apify-actor
npm install
npm start
```

### Environment Variables
Set these in `.env` (for local testing):
```
APIFY_TOKEN=your_token_here
```

## Performance

- **Speed**: ~1-2 posts per second (respects Reddit rate limits)
- **Memory**: 512MB - 2GB recommended
- **Timeout**: 1 hour (adjustable)
- **Cost**: ~$0.02 - $0.05 per 100 posts on Apify platform

## Limitations

- Only works with old.reddit.com (easier to scrape)
- Keyword-based labeling has ~70-80% accuracy
- Some posts may be deleted or removed
- Reddit may rate limit aggressive scraping

## Future Enhancements

- [ ] Add LLM-based outcome classification for higher accuracy
- [ ] Support for multiple subreddits in one run
- [ ] Extract salary information when mentioned
- [ ] Identify interview question patterns
- [ ] Support for LinkedIn, Glassdoor scraping

## License

MIT

---

**Built for RedCube XHS - Phase 4: Autonomous Data Engine**
