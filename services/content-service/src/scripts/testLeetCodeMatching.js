/**
 * Test LeetCode Matching Algorithm
 *
 * Tests various question formats to verify matching accuracy
 */

const { matchQuestionToLeetCode } = require('../services/leetcodeMatcherService');

const testQuestions = [
  // Exact matches
  { text: "Two Sum", expected: "Two Sum", type: "coding" },
  { text: "Add Two Numbers", expected: "Add Two Numbers", type: "coding" },
  { text: "Reverse Linked List", expected: "Reverse Linked List", type: "coding" },

  // Common variations
  { text: "Reverse a linked list", expected: "Reverse Linked List", type: "coding" },
  { text: "Implement an LRU cache", expected: "LRU Cache", type: "coding" },
  { text: "Design Twitter", expected: "Design Twitter", type: "system_design" },
  { text: "Find the median of two sorted arrays", expected: "Median of Two Sorted Arrays", type: "coding" },

  // Interview-style questions
  { text: "They asked me to validate parentheses", expected: "Valid Parentheses", type: "coding" },
  { text: "Longest substring without repeating chars", expected: "Longest Substring Without Repeating Characters", type: "coding" },
  { text: "Merge k sorted lists", expected: "Merge k Sorted Lists", type: "coding" },

  // System design questions
  { text: "Design a URL shortener", expected: "Design TinyURL", type: "system_design" },
  { text: "Design a rate limiter", expected: null, type: "system_design" }, // May not exist

  // Edge cases
  { text: "Two sum problem", expected: "Two Sum", type: "coding" },
  { text: "Implement LRU", expected: "LRU Cache", type: "coding" },
  { text: "3 sum", expected: "3Sum", type: "coding" }
];

async function runTests() {
  console.log('🧪 Testing LeetCode Matching Algorithm\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  let noMatch = 0;

  for (const test of testQuestions) {
    console.log(`\nTest: "${test.text}"`);
    console.log(`Expected: ${test.expected || 'NO MATCH'}`);

    const result = await matchQuestionToLeetCode(test.text, test.type);

    if (!test.expected) {
      // Expected no match
      if (!result.matched) {
        console.log(`✅ PASS: Correctly identified as no match`);
        passed++;
      } else {
        console.log(`❌ FAIL: Found match when none expected: ${result.title}`);
        failed++;
      }
    } else if (result.matched && result.title === test.expected) {
      console.log(`✅ PASS: Matched to "${result.title}" (${result.method}, confidence: ${result.confidence.toFixed(2)})`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Difficulty: ${result.difficulty} (numeric: ${result.difficulty_numeric})`);
      passed++;
    } else if (result.matched) {
      console.log(`⚠️  PARTIAL: Matched to "${result.title}" instead of "${test.expected}"`);
      console.log(`   Method: ${result.method}, Confidence: ${result.confidence.toFixed(2)}`);
      console.log(`   URL: ${result.url}`);
      failed++;
    } else {
      console.log(`❌ FAIL: No match found`);
      noMatch++;
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}/${testQuestions.length} (${Math.round(passed / testQuestions.length * 100)}%)`);
  console.log(`   ❌ Failed: ${failed}/${testQuestions.length}`);
  console.log(`   🔍 No Match: ${noMatch}/${testQuestions.length}`);
  console.log('='.repeat(80));

  if (passed / testQuestions.length >= 0.85) {
    console.log('\n🎉 SUCCESS: Match rate meets target (>85%)');
  } else {
    console.log('\n⚠️  WARNING: Match rate below target (<85%)');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
