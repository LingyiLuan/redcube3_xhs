/**
 * Test Question Extraction with Enhanced Regex Patterns
 *
 * Tests the new 16 regex patterns on all relevant posts
 * Reports coverage improvement and accuracy
 */

const { Pool } = require('pg');
const { extractInterviewQuestions } = require('./src/services/questionExtractionService');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function testExtractionOnAllPosts() {
  console.log('\n🔍 Testing Enhanced Question Extraction\n');
  console.log('================================================================================\n');

  try {
    // 1. Get current baseline stats
    const baselineResult = await pool.query(`
      SELECT COUNT(DISTINCT post_id) as posts_with_questions,
             COUNT(*) as total_questions
      FROM interview_questions
    `);

    const baseline = baselineResult.rows[0];
    console.log('📊 BASELINE (Before Enhancement):');
    console.log(`  Posts with questions: ${baseline.posts_with_questions}`);
    console.log(`  Total questions: ${baseline.total_questions}`);
    console.log('');

    // 2. Get all posts with interview dates
    const postsResult = await pool.query(`
      SELECT sp.post_id, sp.title, sp.body_text,
             sp.metadata->>'company' as company,
             sp.interview_date,
             CASE WHEN iq.post_id IS NOT NULL THEN true ELSE false END as has_questions
      FROM scraped_posts sp
      LEFT JOIN (
        SELECT DISTINCT post_id FROM interview_questions
      ) iq ON sp.post_id = iq.post_id
      WHERE sp.interview_date IS NOT NULL
        AND EXTRACT(YEAR FROM sp.interview_date) >= 2023
      ORDER BY sp.created_at DESC
    `);

    const allPosts = postsResult.rows;
    const postsWithoutQuestions = allPosts.filter(p => !p.has_questions);

    console.log('📋 POST ANALYSIS:');
    console.log(`  Total relevant posts (2023-2025): ${allPosts.length}`);
    console.log(`  Posts with questions (already): ${allPosts.length - postsWithoutQuestions.length}`);
    console.log(`  Posts without questions: ${postsWithoutQuestions.length}`);
    console.log(`  Coverage: ${((allPosts.length - postsWithoutQuestions.length) / allPosts.length * 100).toFixed(1)}%`);
    console.log('');

    // 3. Test extraction on posts without questions
    console.log('🧪 TESTING NEW REGEX PATTERNS:\n');

    let newPostsCovered = 0;
    let totalNewQuestions = 0;
    const sampleQuestions = [];
    const patternStats = {};

    for (const post of postsWithoutQuestions.slice(0, 100)) { // Test first 100
      const text = `${post.title}\n\n${post.body_text}`;

      // Extract questions with new patterns
      const questions = extractInterviewQuestions(text, {
        minConfidence: 0.70
      });

      if (questions.length > 0) {
        newPostsCovered++;
        totalNewQuestions += questions.length;

        // Track pattern usage
        questions.forEach(q => {
          const pattern = q.pattern || 'unknown';
          patternStats[pattern] = (patternStats[pattern] || 0) + 1;
        });

        // Save sample questions (first 10)
        if (sampleQuestions.length < 10) {
          sampleQuestions.push({
            post_id: post.post_id,
            company: post.company,
            questions: questions.map(q => ({
              text: q.text,
              pattern: q.pattern,
              confidence: q.confidence
            }))
          });
        }
      }

      // Progress indicator
      if ((newPostsCovered) % 10 === 0 && newPostsCovered > 0) {
        process.stdout.write(`  Processed ${newPostsCovered} posts...\r`);
      }
    }

    console.log('\n');
    console.log('✅ EXTRACTION RESULTS:\n');
    console.log(`  New posts covered: ${newPostsCovered}/100 tested (${(newPostsCovered / 100 * 100).toFixed(1)}%)`);
    console.log(`  New questions extracted: ${totalNewQuestions}`);
    console.log(`  Avg questions per post: ${(totalNewQuestions / Math.max(1, newPostsCovered)).toFixed(2)}`);
    console.log('');

    // 4. Pattern effectiveness
    if (Object.keys(patternStats).length > 0) {
      console.log('📊 PATTERN EFFECTIVENESS:\n');
      const sortedPatterns = Object.entries(patternStats)
        .sort((a, b) => b[1] - a[1]);

      sortedPatterns.forEach(([pattern, count], index) => {
        console.log(`  ${index + 1}. ${pattern}: ${count} questions`);
      });
      console.log('');
    }

    // 5. Sample questions for accuracy check
    if (sampleQuestions.length > 0) {
      console.log('🎯 SAMPLE QUESTIONS (Accuracy Check):\n');
      sampleQuestions.slice(0, 5).forEach((sample, index) => {
        console.log(`${index + 1}. POST: ${sample.post_id} (${sample.company || 'Unknown Company'})`);
        sample.questions.forEach((q, qIndex) => {
          console.log(`   ${String.fromCharCode(97 + qIndex)}. "${q.text.substring(0, 80)}${q.text.length > 80 ? '...' : ''}"`);
          console.log(`      Pattern: ${q.pattern} | Confidence: ${q.confidence}`);
        });
        console.log('');
      });
    }

    // 6. Projected results
    if (newPostsCovered > 0) {
      const projectedNewPosts = Math.round(newPostsCovered * (postsWithoutQuestions.length / 100));
      const projectedCoverage = Math.round(((parseInt(baseline.posts_with_questions) + projectedNewPosts) / allPosts.length) * 100);
      const projectedQuestions = Math.round(parseInt(baseline.total_questions) + (totalNewQuestions * (postsWithoutQuestions.length / 100)));

      console.log('📈 PROJECTED RESULTS (After Full Extraction):\n');
      console.log('  Before Enhancement:');
      console.log(`    Posts covered: ${baseline.posts_with_questions}/${allPosts.length} (${((baseline.posts_with_questions / allPosts.length) * 100).toFixed(1)}%)`);
      console.log(`    Total questions: ${baseline.total_questions}`);
      console.log('');
      console.log('  After Enhancement (Estimated):');
      console.log(`    Posts covered: ~${parseInt(baseline.posts_with_questions) + projectedNewPosts}/${allPosts.length} (~${projectedCoverage}%)`);
      console.log(`    Total questions: ~${projectedQuestions}`);
      console.log('');
      console.log(`  Improvement: +${(projectedCoverage - ((baseline.posts_with_questions / allPosts.length) * 100)).toFixed(1)}% coverage`);
      console.log('');

      // 7. Posts still needing LLM
      const postsNeedingLLM = postsWithoutQuestions.length - projectedNewPosts;
      console.log('💰 LLM FALLBACK ESTIMATION:\n');
      console.log(`  Posts still without questions: ~${postsNeedingLLM}`);
      console.log(`  Estimated LLM cost (@ $0.0005/post): ~$${(postsNeedingLLM * 0.0005).toFixed(2)}`);
      console.log(`  Final coverage with LLM: ~${Math.round(((allPosts.length - postsNeedingLLM) / allPosts.length) * 100)}%`);
      console.log('');
    } else {
      console.log('⚠️ No new questions extracted with enhanced patterns.');
      console.log('   All posts may need LLM fallback.\n');
    }

    console.log('================================================================================\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error);
    await pool.end();
    process.exit(1);
  }
}

testExtractionOnAllPosts();
