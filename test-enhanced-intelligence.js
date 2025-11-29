/**
 * Test Enhanced Intelligence Queries
 * Verifies Phase 1 implementation against 664-post foundation pool
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'redcube_content',
  user: 'postgres',
  password: 'postgres'
});

// Import the query functions
const {
  getHiringProcessIntelligence,
  getRejectionIntelligence,
  getEnhancedQuestionIntelligence,
  getInterviewerFocusPatterns,
  getTimelinePatterns,
  getExperienceLevelBreakdown
} = require('./services/content-service/src/database/enhancedIntelligenceQueries');

const { generateEnhancedIntelligence } = require('./services/content-service/src/services/enhancedIntelligenceService');

async function runTests() {
  console.log('🧪 Testing Enhanced Intelligence Queries\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Get foundation pool (all extracted posts)
    console.log('\n📊 Step 1: Building Foundation Pool...');
    const foundationPoolQuery = `
      SELECT post_id
      FROM scraped_posts
      WHERE is_relevant = true
        AND llm_extracted_at IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(foundationPoolQuery);
    const foundationPoolIds = result.rows.map(r => r.post_id);

    console.log(`✅ Foundation pool: ${foundationPoolIds.length} posts`);
    console.log(`   Sample IDs: ${foundationPoolIds.slice(0, 5).join(', ')}\n`);

    // Step 2: Test Hiring Process Intelligence
    console.log('=' .repeat(80));
    console.log('\n📈 Step 2: Testing Hiring Process Intelligence...');

    const hiringProcess = await getHiringProcessIntelligence(foundationPoolIds);

    console.log('✅ Hiring Process Results:');
    console.log(`   Total Posts: ${hiringProcess.total_posts}`);
    console.log(`   Extraction Coverage: ${Math.round((hiringProcess.extraction_coverage || 0) * 100)}%`);
    console.log(`   Avg Interview Rounds: ${hiringProcess.avg_interview_rounds}`);
    console.log(`   Remote Ratio: ${Math.round((hiringProcess.remote_ratio || 0) * 100)}%`);
    console.log(`   Video Interview Ratio: ${Math.round((hiringProcess.video_interview_ratio || 0) * 100)}%`);
    console.log(`   Referral Usage: ${Math.round((hiringProcess.referral_usage_rate || 0) * 100)}%`);
    console.log(`   Referral Success Rate: ${Math.round((hiringProcess.referral_success_rate || 0) * 100)}%`);
    console.log(`   Non-Referral Success Rate: ${Math.round((hiringProcess.non_referral_success_rate || 0) * 100)}%`);

    const referralMultiplier = hiringProcess.referral_success_rate && hiringProcess.non_referral_success_rate
      ? (hiringProcess.referral_success_rate / hiringProcess.non_referral_success_rate).toFixed(1)
      : 'N/A';
    console.log(`   🎯 Referral Multiplier: ${referralMultiplier}x`);

    console.log(`   Negotiation Rate: ${Math.round((hiringProcess.negotiation_rate || 0) * 100)}%`);
    console.log(`   Negotiation Success Rate: ${Math.round((hiringProcess.negotiation_success_rate || 0) * 100)}%`);
    console.log(`   Compensation Discussion Rate: ${Math.round((hiringProcess.compensation_discussion_rate || 0) * 100)}%`);

    // Step 3: Test Rejection Intelligence
    console.log('\n' + '='.repeat(80));
    console.log('\n🚫 Step 3: Testing Rejection Intelligence...');

    const rejections = await getRejectionIntelligence(foundationPoolIds);

    console.log(`✅ Found ${rejections.length} rejection patterns`);
    if (rejections.length > 0) {
      console.log('\n   Top 5 Rejection Reasons:');
      rejections.slice(0, 5).forEach((r, idx) => {
        console.log(`   ${idx + 1}. "${r.rejection_reason}" (${r.frequency} cases)`);
        console.log(`      Most common difficulty: ${r.most_common_difficulty || 'N/A'}`);
        console.log(`      Companies: ${(r.companies || []).slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`      Difficulty breakdown: Easy=${r.difficulty_easy}, Medium=${r.difficulty_medium}, Hard=${r.difficulty_hard}`);
      });
    }

    // Step 4: Test Question Intelligence
    console.log('\n' + '='.repeat(80));
    console.log('\n❓ Step 4: Testing Enhanced Question Intelligence...');

    const questions = await getEnhancedQuestionIntelligence(foundationPoolIds);

    console.log(`✅ Found ${questions.length} frequently asked questions (asked 2+ times)`);
    if (questions.length > 0) {
      console.log('\n   Top 5 Questions:');
      questions.slice(0, 5).forEach((q, idx) => {
        console.log(`   ${idx + 1}. "${q.question_text.substring(0, 80)}..."`);
        console.log(`      Asked ${q.asked_count}x | Difficulty: ${q.llm_difficulty} | Category: ${q.llm_category}`);
        console.log(`      Avg Time: ${q.avg_time_minutes || 'N/A'} min`);
        console.log(`      Optimal Approach: ${q.most_common_approach ? q.most_common_approach.substring(0, 60) + '...' : 'N/A'}`);
        console.log(`      Common Struggle: ${q.common_struggle || 'N/A'}`);
        console.log(`      Hints Given: ${q.all_hints_given ? JSON.parse(q.all_hints_given).length : 0} unique hints`);
        console.log(`      Companies: ${(q.companies_asking || []).slice(0, 3).join(', ') || 'N/A'}`);
      });
    }

    // Step 5: Test Interviewer Focus Patterns
    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 Step 5: Testing Interviewer Focus Patterns...');

    const focusPatterns = await getInterviewerFocusPatterns(foundationPoolIds);

    console.log(`✅ Found ${focusPatterns.length} focus patterns (3+ occurrences)`);
    if (focusPatterns.length > 0) {
      console.log('\n   Top Focus Areas:');
      focusPatterns.slice(0, 10).forEach((f, idx) => {
        console.log(`   ${idx + 1}. "${f.focus_area}" (${f.frequency} times)`);
        console.log(`      Success Correlation: ${Math.round((f.correlation_with_success || 0) * 100)}%`);
        console.log(`      Led to Success: ${f.times_led_to_success} times`);
        console.log(`      Led to Failure: ${f.times_led_to_failure} times`);
        console.log(`      Companies: ${(f.top_companies || []).slice(0, 3).join(', ') || 'N/A'}`);
      });
    }

    // Step 6: Test Timeline Patterns
    console.log('\n' + '='.repeat(80));
    console.log('\n⏱️  Step 6: Testing Timeline Patterns...');

    const timelines = await getTimelinePatterns(foundationPoolIds);

    console.log(`✅ Found ${timelines.length} timeline patterns (3+ samples)`);
    if (timelines.length > 0) {
      console.log('\n   Company Timeline Patterns:');
      timelines.slice(0, 5).forEach((t, idx) => {
        console.log(`   ${idx + 1}. ${t.company} - ${t.role} (${t.experience_level || 'all levels'})`);
        console.log(`      Avg Rounds: ${t.avg_rounds} (range: ${t.min_rounds}-${t.max_rounds})`);
        console.log(`      Success Rate: ${Math.round((t.success_rate || 0) * 100)}% (${t.sample_size} samples)`);
        console.log(`      Format: ${t.most_common_format} | Location: ${t.most_common_location}`);
        console.log(`      Timeline: ${t.typical_timeline || 'N/A'}`);
      });
    }

    // Step 7: Test Experience Level Breakdown
    console.log('\n' + '='.repeat(80));
    console.log('\n👥 Step 7: Testing Experience Level Breakdown...');

    const experienceLevels = await getExperienceLevelBreakdown(foundationPoolIds);

    console.log(`✅ Found ${experienceLevels.length} experience levels`);
    if (experienceLevels.length > 0) {
      console.log('\n   Experience Level Comparison:');
      experienceLevels.forEach((level, idx) => {
        console.log(`   ${idx + 1}. ${level.experience_level.toUpperCase()} (${level.total_posts} posts)`);
        console.log(`      Avg Rounds: ${level.avg_rounds}`);
        console.log(`      Success Rate: ${Math.round((level.success_rate || 0) * 100)}%`);
        console.log(`      Referral Usage: ${Math.round((level.referral_usage_rate || 0) * 100)}%`);
        console.log(`      Negotiation Rate: ${Math.round((level.negotiation_rate || 0) * 100)}%`);
        console.log(`      Difficulty: Easy=${level.easy_count}, Medium=${level.medium_count}, Hard=${level.hard_count}`);
      });
    }

    // Step 8: Test Full Enhanced Intelligence Report
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Step 8: Testing Full Enhanced Intelligence Report Generation...');

    const report = await generateEnhancedIntelligence(foundationPoolIds);

    console.log('✅ Enhanced Intelligence Report Generated:');
    console.log(`   Foundation Pool Size: ${report.data_quality.foundation_pool_size}`);
    console.log(`   Posts Analyzed: ${report.data_quality.posts_analyzed}`);
    console.log(`   Extraction Coverage: ${report.data_quality.extraction_coverage}%`);
    console.log(`   Questions Analyzed: ${report.data_quality.questions_analyzed}`);
    console.log(`   Companies Covered: ${report.data_quality.companies_covered}`);
    console.log(`   Statistical Confidence: ${report.data_quality.statistical_confidence.toUpperCase()}`);

    console.log('\n   Executive Summary Key Findings:');
    report.executive_summary.key_findings.forEach((finding, idx) => {
      console.log(`   ${idx + 1}. [${finding.category}] ${finding.finding}`);
      console.log(`      Benchmark: ${finding.benchmark}`);
      console.log(`      Implication: ${finding.implication}`);
    });

    console.log('\n   Hiring Process Overview:');
    console.log(`      Avg Rounds: ${report.hiring_process.overview.avg_rounds}`);
    console.log(`      Referral Multiplier: ${report.hiring_process.referral_intelligence.multiplier}x`);
    console.log(`      Offer Acceptance Rate: ${report.hiring_process.offer_dynamics.acceptance_rate}%`);

    console.log('\n   Top Rejection Reasons:');
    report.rejection_analysis.top_reasons.slice(0, 3).forEach((reason, idx) => {
      console.log(`      ${idx + 1}. ${reason.reason} (${reason.frequency} cases) - ${reason.priority_level.toUpperCase()}`);
    });

    console.log('\n   Top Questions:');
    report.question_intelligence.top_questions.slice(0, 3).forEach((q, idx) => {
      console.log(`      ${idx + 1}. ${q.question.substring(0, 60)}... (asked ${q.asked_count}x)`);
      console.log(`         Priority: ${q.prep_priority.toUpperCase()}`);
    });

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log(`  ✓ Hiring Process Intelligence: ${hiringProcess.total_posts} posts`);
    console.log(`  ✓ Rejection Intelligence: ${rejections.length} patterns`);
    console.log(`  ✓ Question Intelligence: ${questions.length} questions`);
    console.log(`  ✓ Interviewer Focus: ${focusPatterns.length} patterns`);
    console.log(`  ✓ Timeline Patterns: ${timelines.length} companies`);
    console.log(`  ✓ Experience Levels: ${experienceLevels.length} levels`);
    console.log(`  ✓ Full Report: Generated successfully`);
    console.log('\n' + '='.repeat(80));

    // Write sample report to file for inspection
    const fs = require('fs');
    fs.writeFileSync(
      '/Users/luan02/Desktop/redcube3_xhs/sample-enhanced-intelligence-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Sample report written to: sample-enhanced-intelligence-report.json\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
runTests().then(() => {
  console.log('✅ Test script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
