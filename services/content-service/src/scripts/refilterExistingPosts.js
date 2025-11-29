/**
 * Refilter Existing Posts Script
 *
 * Re-evaluates all existing posts (609) with the new advanced filtering system
 * Updates is_relevant, relevance_source, and relevance_score for each post
 */

const pool = require('../config/database');
const { calculateJobInterviewRelevance } = require('../services/hackerNewsService');
const { classifyPostWithLLM, isLLMAvailable } = require('../services/llmFilterService');
const axios = require('axios');

async function refilterExistingPosts() {
  console.log('🔄 Starting refiltering of existing posts...\n');

  try {
    // Get all existing posts
    const result = await pool.query(`
      SELECT
        id,
        post_id as "postId",
        title,
        body_text as "bodyText",
        subreddit,
        source
      FROM scraped_posts
      ORDER BY id
    `);

    const posts = result.rows;
    console.log(`📊 Found ${posts.length} posts to refilter\n`);

    if (!isLLMAvailable()) {
      console.warn('⚠️  WARNING: OPENROUTER_API_KEY not found. LLM filtering disabled.');
      console.warn('   Will use Rules + NER only (50-60% precision instead of 70-80%)\n');
    } else {
      console.log('✅ LLM available - using full advanced filtering\n');
    }

    let stats = {
      total: posts.length,
      relevant: 0,
      irrelevant: 0,
      rulesOnly: 0,
      nerBoosted: 0,
      llmUsed: 0,
      errors: 0
    };

    // Process posts in batches to show progress
    const batchSize = 10;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, Math.min(i + batchSize, posts.length));

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(posts.length/batchSize)} (posts ${i+1}-${Math.min(i+batchSize, posts.length)})`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      for (const post of batch) {
        try {
          // Step 1: Calculate base relevance score
          let relevanceScore = calculateJobInterviewRelevance(post.title, post.bodyText || '');
          let isRelevant = false;
          let relevanceSource = 'rules';
          let nerBoosted = false;

          // Step 2: Check with NER service for boost
          if (relevanceScore >= 20 && relevanceScore <= 70) {
            try {
              const nerResponse = await axios.post('http://ner-service:8000/extract-metadata', {
                text: `${post.title} ${post.bodyText || ''}`.substring(0, 2000)
              }, { timeout: 3000 });

              const nerData = nerResponse.data;

              if (nerData.outcome || nerData.interview_stage || nerData.company) {
                relevanceScore += 20;
                nerBoosted = true;
                stats.nerBoosted++;
              }
            } catch (nerError) {
              // NER unavailable, continue
            }
          }

          // Step 3: For borderline cases (30-60), use LLM
          if (relevanceScore >= 30 && relevanceScore <= 60 && isLLMAvailable()) {
            const llmResult = await classifyPostWithLLM(post);
            isRelevant = llmResult.isRelevant;
            relevanceSource = 'llm';
            stats.llmUsed++;

            if (llmResult.isRelevant) {
              relevanceScore = Math.max(relevanceScore, llmResult.confidence);
            }
          } else {
            // Clear cases
            isRelevant = relevanceScore >= 40;
            relevanceSource = 'rules';
            stats.rulesOnly++;
          }

          // Update database
          await pool.query(`
            UPDATE scraped_posts
            SET
              is_relevant = $1,
              relevance_source = $2,
              relevance_score = $3,
              relevance_checked_at = NOW()
            WHERE id = $4
          `, [isRelevant, relevanceSource, relevanceScore, post.id]);

          // Update stats
          if (isRelevant) {
            stats.relevant++;
          } else {
            stats.irrelevant++;
          }

          // Log result
          const icon = isRelevant ? '✅' : '❌';
          const boost = nerBoosted ? ' (+NER)' : '';
          const source = relevanceSource === 'llm' ? ' [LLM]' : '';
          console.log(`  ${icon} [Score: ${relevanceScore}${boost}${source}] ${post.title.substring(0, 60)}...`);

        } catch (error) {
          console.error(`  ❌ ERROR: ${error.message}`);
          stats.errors++;
        }
      }

      // Show progress
      console.log(`\n📊 Progress: ${Math.min(i + batchSize, posts.length)}/${posts.length} posts processed`);
    }

    // Final report
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('           REFILTERING COMPLETE - FINAL REPORT         ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Total posts:        ${stats.total}`);
    console.log(`   ✅ Relevant:        ${stats.relevant} (${Math.round(stats.relevant/stats.total*100)}%)`);
    console.log(`   ❌ Irrelevant:      ${stats.irrelevant} (${Math.round(stats.irrelevant/stats.total*100)}%)`);
    console.log(`\n🔧 Method Breakdown:`);
    console.log(`   Rules only:         ${stats.rulesOnly}`);
    console.log(`   NER boosted:        ${stats.nerBoosted}`);
    console.log(`   LLM classified:     ${stats.llmUsed}`);
    console.log(`   Errors:             ${stats.errors}`);
    console.log(`\n💰 Estimated Cost:`);
    console.log(`   LLM calls:          ${stats.llmUsed}`);
    console.log(`   Approx cost:        $${(stats.llmUsed * 500 * 0.14 / 1000000).toFixed(4)} (DeepSeek)`);
    console.log('\n✅ All posts have been refiltered with the new system!');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
refilterExistingPosts();
