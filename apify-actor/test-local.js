/**
 * Local Test Script for Enhanced Reddit Scraper
 * Tests scraping + metadata extraction pipeline locally
 */

import axios from 'axios';

async function testLocalScrape() {
  console.log('🧪 Starting local scraper test...\n');

  // Simulate scraped data (would come from Reddit API in production)
  const mockScrapedPosts = [
    {
      postId: `test_${Date.now()}_1`,
      title: 'Rejected from Google L4 SWE after System Design Round',
      author: 'test_user_1',
      createdAt: new Date().toISOString(),
      url: 'https://reddit.com/r/cscareerquestions/test1',
      bodyText: `I applied for Google L4 Software Engineer position. I have 4 years of experience working with Python and React. The interview process went well until the system design round. They asked me to design a distributed caching system. I struggled with explaining the consistency model and how to handle cache invalidation. The interviewer was friendly but I could tell I wasn't meeting the bar. Got the rejection email today. Looking for advice on how to improve for next time.`,
      subreddit: 'cscareerquestions',
      comments: [
        {
          id: 'c1',
          author: 'helpful_person',
          body: 'System design is tough at L4. You need to know about CAP theorem, consistent hashing, and cache eviction policies. Study Designing Data-Intensive Applications by Martin Kleppmann.',
          score: 25
        },
        {
          id: 'c2',
          author: 'another_user',
          body: 'I also failed Google system design. The key is to practice with a timer and talk through your thinking process out loud.',
          score: 12
        }
      ],
      potential_outcome: 'negative',
      confidence_score: 0.92,
      metadata: {},
      word_count: 95,
      scrapedAt: new Date().toISOString()
    },
    {
      postId: `test_${Date.now()}_2`,
      title: 'Passed Meta E4 ML Engineer Interview - My Experience',
      author: 'test_user_2',
      createdAt: new Date().toISOString(),
      url: 'https://reddit.com/r/ExperiencedDevs/test2',
      bodyText: `Just wanted to share my successful interview experience at Meta for E4 Machine Learning Engineer. I have 5 years of experience in ML. The interview had 2 coding rounds (LeetCode medium), 1 ML system design (recommendation system), and 1 behavioral round. For coding I focused on dynamic programming and graph algorithms. For ML design I studied PyTorch, TensorFlow, and model deployment strategies. The behavioral round focused on impact and collaboration. They asked about a time I disagreed with my manager. Used STAR method and it went great. Got the offer yesterday! Happy to answer questions.`,
      subreddit: 'ExperiencedDevs',
      comments: [
        {
          id: 'c3',
          author: 'congrats_person',
          body: 'Congrats! What was the ML system design question exactly?',
          score: 18
        },
        {
          id: 'c4',
          author: 'ml_engineer',
          body: 'E4 at Meta is a great level. Did they discuss compensation yet?',
          score: 9
        }
      ],
      potential_outcome: 'positive',
      confidence_score: 0.95,
      metadata: {},
      word_count: 112,
      scrapedAt: new Date().toISOString()
    },
    {
      postId: `test_${Date.now()}_3`,
      title: 'Amazon SDE 2 Offer - Leetcode Prep Strategy',
      author: 'test_user_3',
      createdAt: new Date().toISOString(),
      url: 'https://reddit.com/r/leetcode/test3',
      bodyText: `Got my Amazon SDE 2 offer! Want to share what worked for me. Background: 3 years experience as backend engineer working with Java and AWS. Prep time: 2 months. I did about 200 LeetCode problems focusing on arrays, trees, graphs, and dynamic programming. Used NeetCode 150 as my base. For system design I practiced designing scalable REST APIs and microservices. Leadership principles were crucial - prepared 8-10 STAR stories covering all 16 principles. The actual interview: 4 coding rounds (all LC medium), 1 system design (design URL shortener), 1 bar raiser behavioral. Keys to success: mock interviews, thinking out loud, asking clarifying questions.`,
      subreddit: 'leetcode',
      comments: [
        {
          id: 'c5',
          author: 'amazonian',
          body: 'SDE 2 is solid. Did you negotiate the offer?',
          score: 14
        }
      ],
      potential_outcome: 'positive',
      confidence_score: 0.89,
      metadata: {},
      word_count: 125,
      scrapedAt: new Date().toISOString()
    }
  ];

  console.log(`📦 Mock scraped ${mockScrapedPosts.length} posts\n`);

  // Send to ingestion endpoint (which will trigger metadata extraction)
  try {
    console.log('📤 Sending posts to ingestion endpoint...\n');

    const response = await axios.post('http://localhost:8080/api/content/agent/scrape', {
      subreddit: 'test_multi',
      numberOfPosts: mockScrapedPosts.length,
      scrapedPosts: mockScrapedPosts
    });

    console.log('✅ Ingestion Response:', JSON.stringify(response.data, null, 2));

    console.log('\n🔍 Now checking database for enhanced metadata...\n');

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Query the database to verify metadata extraction
    const dbCheck = await axios.get('http://localhost:8080/api/content/posts/recent?limit=3');

    console.log('📊 Database Check - Recent Posts with Enhanced Metadata:');
    console.log(JSON.stringify(dbCheck.data, null, 2));

    // Print summary
    console.log('\n📈 Test Summary:');
    console.log('═'.repeat(60));

    if (dbCheck.data && dbCheck.data.posts) {
      dbCheck.data.posts.forEach((post, idx) => {
        console.log(`\nPost ${idx + 1}: ${post.title}`);
        console.log(`  Role Type: ${post.role_type || 'N/A'}`);
        console.log(`  Level: ${post.level || 'N/A'} (${post.level_label || 'N/A'})`);
        console.log(`  Company: ${post.company || 'N/A'}`);
        console.log(`  Interview Stage: ${post.interview_stage || 'N/A'}`);
        console.log(`  Outcome: ${post.outcome || 'N/A'}`);
        console.log(`  Tech Stack: ${post.tech_stack ? post.tech_stack.join(', ') : 'N/A'}`);
        console.log(`  Primary Language: ${post.primary_language || 'N/A'}`);
        console.log(`  Comment Count: ${post.comment_count || 0}`);
      });
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run test
testLocalScrape().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
