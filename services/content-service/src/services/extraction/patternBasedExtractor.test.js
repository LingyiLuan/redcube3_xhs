/**
 * Test Suite for Pattern-Based Interview Question Extractor
 * Covers edge cases, regression tests, and accuracy measurement
 */

const {
  extractInterviewQuestions,
  extractBatch,
  classifyQuestionType,
  calculateQualityScore,
  preprocessText,
  _internal
} = require('./patternBasedExtractor');

// ============================================
// TEST CASES
// ============================================

const TEST_CASES = [
  // Test Case 1: Clean numbered list
  {
    name: 'Clean Numbered List - Google L4',
    post: {
      title: 'Google L4 SWE Onsite',
      bodyText: `Had my Google onsite yesterday. They asked:

1. Implement LRU cache with O(1) operations
2. Design a rate limiter for API requests
3. Tell me about a time you disagreed with your manager

The first two were hard but I think I passed.`
    },
    expected: {
      count: 3,
      types: ['coding', 'system_design', 'behavioral'],
      minConfidence: 0.90
    }
  },

  // Test Case 2: Mixed formats
  {
    name: 'Mixed Formats - Various Patterns',
    post: {
      title: 'Amazon Interview Experience',
      bodyText: `Round 1: Explain REST vs GraphQL

Then came the hard part - finding cycles in a graph

They asked: "how would you scale a system to handle 1M requests per second?"

- First question was about databases
- Behavioral at the end`
    },
    expected: {
      count: 5,
      minConfidence: 0.65
    }
  },

  // Test Case 3: Quoted questions
  {
    name: 'Quoted Questions',
    post: {
      title: 'Facebook Interview',
      bodyText: `The interviewer said "can you reverse a linked list?" and then asked 'design a rate limiter for our API'.`
    },
    expected: {
      count: 2,
      types: ['coding', 'system_design']
    }
  },

  // Test Case 4: Noise filtering - meta questions
  {
    name: 'Noise Filtering - Meta Questions',
    post: {
      title: 'Question about Google interviews',
      bodyText: `Anyone know what Google asks for L5?
Should I solve this problem?
Does anyone have questions about the process?
I have a question about the offer.

Actually in my interview they asked me to implement merge sort.`
    },
    expected: {
      count: 1, // Only "implement merge sort" should be extracted
      minConfidence: 0.65
    }
  },

  // Test Case 5: Implicit questions in narrative
  {
    name: 'Implicit Questions',
    post: {
      title: 'Netflix System Design',
      bodyText: `So the interviewer started with an easy warmup about arrays, then moved to this crazy hard tree problem where I had to find the lowest common ancestor, and finally asked how I would scale a system to handle millions of concurrent users.`
    },
    expected: {
      count: 3,
      minConfidence: 0.60
    }
  },

  // Test Case 6: Round markers
  {
    name: 'Round Markers',
    post: {
      title: 'Microsoft Onsite',
      bodyText: `Round 1: Binary tree traversal
Round 2: Design a distributed cache
Phone screen: Tell me about your biggest project
Final round: Coding challenge - merge intervals`
    },
    expected: {
      count: 4,
      minConfidence: 0.85
    }
  },

  // Test Case 7: Bullet points
  {
    name: 'Bullet Points',
    post: {
      title: 'Stripe Interview',
      bodyText: `Questions I got:
- Implement a payment processing system
- Design an API gateway
- Explain how you would handle fraud detection
* What's your experience with distributed systems?`
    },
    expected: {
      count: 4,
      minConfidence: 0.80
    }
  },

  // Test Case 8: Empty/malformed
  {
    name: 'Empty Post',
    post: {
      title: '',
      bodyText: ''
    },
    expected: {
      count: 0
    }
  },

  // Test Case 9: Code blocks mixed with questions
  {
    name: 'Code Blocks',
    post: {
      title: 'Apple Interview',
      bodyText: `They asked me to reverse a string.

\`\`\`python
def reverse(s):
    return s[::-1]
\`\`\`

Then design a URL shortener service.`
    },
    expected: {
      count: 2,
      types: ['coding', 'system_design']
    }
  },

  // Test Case 10: Deduplication
  {
    name: 'Deduplication',
    post: {
      title: 'Uber Interview',
      bodyText: `1. Design Uber
2. Design a ride-sharing service
3. Design an Uber-like system

They also asked: Design Uber's backend architecture`
    },
    expected: {
      count: 2, // Should deduplicate similar "Design Uber" questions
      minConfidence: 0.80
    }
  },

  // Test Case 11: Multi-part questions
  {
    name: 'Multi-part Questions',
    post: {
      title: 'Twitter Interview',
      bodyText: `Implement a function that takes an array and returns the longest increasing subsequence. Follow-up: what's the time complexity?`
    },
    expected: {
      count: 2, // Should extract both main question and follow-up
      minConfidence: 0.65
    }
  },

  // Test Case 12: Non-English text
  {
    name: 'Non-English Text',
    post: {
      title: 'Interview en español',
      bodyText: `La entrevista fue muy difícil. Me preguntaron sobre algoritmos.`
    },
    expected: {
      count: 0, // Should not extract non-English
      minConfidence: 0.60
    }
  },

  // Test Case 13: Very long post
  {
    name: 'Long Post (2000+ words)',
    post: {
      title: 'Complete Google Interview Experience',
      bodyText: generateLongPost(2000)
    },
    expected: {
      minTime: 0,
      maxTime: 50, // Must complete in <50ms
      count: { min: 5, max: 20 }
    }
  },

  // Test Case 14: Behavioral questions
  {
    name: 'Behavioral Questions Only',
    post: {
      title: 'Amazon Leadership Principles',
      bodyText: `1. Tell me about a time you had to make a difficult decision
2. Describe a situation where you disagreed with your team
3. Give me an example of when you failed
4. How do you handle conflict with coworkers?`
    },
    expected: {
      count: 4,
      types: ['behavioral'],
      minConfidence: 0.85
    }
  },

  // Test Case 15: System design keywords
  {
    name: 'System Design Keywords',
    post: {
      title: 'Meta E5 System Design',
      bodyText: `Design Instagram
Design Twitter feed
Design Netflix video streaming
Design URL shortener
Design WhatsApp`
    },
    expected: {
      count: 5,
      types: ['system_design'],
      minConfidence: 0.80
    }
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a long post for performance testing
 */
function generateLongPost(wordCount) {
  const questions = [
    'Implement a binary search tree',
    'Design a scalable chat system',
    'Explain the CAP theorem',
    'Write a function to detect cycles in a linked list',
    'Design a distributed key-value store',
    'Implement merge sort',
    'Explain database indexing',
    'Design a recommendation system'
  ];

  let text = 'This is my interview experience. ';
  let words = 10;

  let questionIndex = 0;
  while (words < wordCount) {
    // Add some narrative
    text += 'The interviewer was very professional and asked me about my background. ';
    words += 12;

    // Add a question every 200 words
    if (words % 200 === 0 && questionIndex < questions.length) {
      text += `\n\n${questionIndex + 1}. ${questions[questionIndex]}\n\n`;
      words += questions[questionIndex].split(' ').length + 2;
      questionIndex++;
    }

    // Add filler
    text += 'I explained my approach and they seemed satisfied with my answer. ';
    words += 11;
  }

  return text;
}

/**
 * Run a single test case
 */
function runTestCase(testCase, options = {}) {
  const startTime = Date.now();
  
  try {
    const results = extractInterviewQuestions(testCase.post, options);
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const passed = validateResults(results, testCase.expected, executionTime);

    return {
      name: testCase.name,
      passed,
      results,
      executionTime,
      expected: testCase.expected
    };

  } catch (error) {
    return {
      name: testCase.name,
      passed: false,
      error: error.message,
      expected: testCase.expected
    };
  }
}

/**
 * Validate test results against expected values
 */
function validateResults(results, expected, executionTime) {
  // Check count
  if (expected.count !== undefined) {
    if (typeof expected.count === 'number') {
      if (results.length !== expected.count) {
        console.log(`  ❌ Expected ${expected.count} questions, got ${results.length}`);
        return false;
      }
    } else if (expected.count.min !== undefined && expected.count.max !== undefined) {
      if (results.length < expected.count.min || results.length > expected.count.max) {
        console.log(`  ❌ Expected ${expected.count.min}-${expected.count.max} questions, got ${results.length}`);
        return false;
      }
    }
  }

  // Check types
  if (expected.types) {
    const types = results.map(r => r.type);
    for (const expectedType of expected.types) {
      if (!types.includes(expectedType)) {
        console.log(`  ❌ Expected type '${expectedType}' not found in results`);
        return false;
      }
    }
  }

  // Check minimum confidence
  if (expected.minConfidence !== undefined) {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    if (avgConfidence < expected.minConfidence) {
      console.log(`  ❌ Expected min confidence ${expected.minConfidence}, got ${avgConfidence.toFixed(2)}`);
      return false;
    }
  }

  // Check execution time
  if (expected.maxTime !== undefined) {
    if (executionTime > expected.maxTime) {
      console.log(`  ❌ Expected max time ${expected.maxTime}ms, took ${executionTime}ms`);
      return false;
    }
  }

  return true;
}

// ============================================
// TEST RUNNERS
// ============================================

/**
 * Run all test cases
 */
function runAllTests() {
  console.log('\n========================================');
  console.log('Pattern-Based Extractor Test Suite');
  console.log('========================================\n');

  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('-'.repeat(50));

    const result = runTestCase(testCase);
    results.push(result);

    if (result.passed) {
      console.log(`✅ PASSED (${result.executionTime}ms)`);
      console.log(`   Found ${result.results.length} questions`);
      if (result.results.length > 0) {
        console.log(`   Sample: "${result.results[0].text.substring(0, 60)}..."`);
        console.log(`   Type: ${result.results[0].type}, Confidence: ${result.results[0].confidence.toFixed(2)}`);
      }
      passed++;
    } else {
      console.log(`❌ FAILED`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);

  // Performance stats
  const avgTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length;
  console.log(`\nAverage Execution Time: ${avgTime.toFixed(2)}ms`);

  return {
    results,
    passed,
    failed,
    successRate: (passed / TEST_CASES.length) * 100
  };
}

/**
 * Run regression tests on edge cases
 */
function runRegressionTests() {
  console.log('\n========================================');
  console.log('Regression Tests - Edge Cases');
  console.log('========================================\n');

  const edgeCases = [
    {
      name: 'Null input',
      post: null,
      shouldNotCrash: true
    },
    {
      name: 'Undefined body',
      post: { title: 'Test' },
      shouldNotCrash: true
    },
    {
      name: 'Very short text',
      post: { title: 'Hi', bodyText: 'Ok' },
      shouldNotCrash: true
    },
    {
      name: 'Special characters',
      post: { title: '@#$%^&*()', bodyText: '!@#$%^&*()_+' },
      shouldNotCrash: true
    },
    {
      name: 'Unicode characters',
      post: { title: '你好', bodyText: 'مرحبا 🚀 привет' },
      shouldNotCrash: true
    }
  ];

  let passed = 0;
  for (const testCase of edgeCases) {
    try {
      const results = extractInterviewQuestions(testCase.post);
      console.log(`✅ ${testCase.name}: No crash (found ${results.length} questions)`);
      passed++;
    } catch (error) {
      console.log(`❌ ${testCase.name}: Crashed with ${error.message}`);
    }
  }

  console.log(`\nRegression Tests: ${passed}/${edgeCases.length} passed`);
  return passed === edgeCases.length;
}

/**
 * Benchmark performance
 */
function runPerformanceBenchmark() {
  console.log('\n========================================');
  console.log('Performance Benchmark');
  console.log('========================================\n');

  const wordCounts = [100, 500, 1000, 2000, 5000];
  
  for (const wordCount of wordCounts) {
    const post = {
      title: 'Performance Test',
      bodyText: generateLongPost(wordCount)
    };

    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      extractInterviewQuestions(post);
      times.push(Date.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const status = avgTime < 50 ? '✅' : '⚠️';
    console.log(`${status} ${wordCount} words: avg=${avgTime.toFixed(2)}ms, min=${minTime}ms, max=${maxTime}ms`);
  }
}

/**
 * Test classification accuracy
 */
function testClassificationAccuracy() {
  console.log('\n========================================');
  console.log('Classification Accuracy Test');
  console.log('========================================\n');

  const classificationTests = [
    { text: 'Implement a binary search algorithm', expected: 'coding' },
    { text: 'Design a scalable chat system', expected: 'system_design' },
    { text: 'Tell me about a time you failed', expected: 'behavioral' },
    { text: 'What is the CAP theorem', expected: 'trivia' },
    { text: 'Reverse a linked list', expected: 'coding' },
    { text: 'Design Twitter feed', expected: 'system_design' },
    { text: 'How do you handle conflicts', expected: 'behavioral' },
    { text: 'Explain database indexing', expected: 'trivia' },
    { text: 'Write a function to merge two sorted arrays', expected: 'coding' },
    { text: 'Design a distributed cache', expected: 'system_design' }
  ];

  let correct = 0;
  for (const test of classificationTests) {
    const result = classifyQuestionType(test.text);
    const isCorrect = result === test.expected;
    
    if (isCorrect) {
      console.log(`✅ "${test.text.substring(0, 40)}..." → ${result}`);
      correct++;
    } else {
      console.log(`❌ "${test.text.substring(0, 40)}..." → ${result} (expected ${test.expected})`);
    }
  }

  const accuracy = (correct / classificationTests.length) * 100;
  console.log(`\nClassification Accuracy: ${accuracy.toFixed(1)}% (${correct}/${classificationTests.length})`);
  
  return accuracy;
}

// ============================================
// MAIN TEST EXECUTION
// ============================================

if (require.main === module) {
  console.log('\n🧪 Starting Pattern-Based Extractor Tests\n');

  // Run all test suites
  const testResults = runAllTests();
  const regressionPass = runRegressionTests();
  runPerformanceBenchmark();
  const classificationAccuracy = testClassificationAccuracy();

  // Final summary
  console.log('\n========================================');
  console.log('Final Summary');
  console.log('========================================');
  console.log(`Unit Tests: ${testResults.successRate.toFixed(1)}% passed`);
  console.log(`Regression Tests: ${regressionPass ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Classification Accuracy: ${classificationAccuracy.toFixed(1)}%`);
  console.log('\n');

  // Exit with appropriate code
  const allPassed = testResults.successRate === 100 && regressionPass && classificationAccuracy >= 80;
  process.exit(allPassed ? 0 : 1);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  runAllTests,
  runRegressionTests,
  runPerformanceBenchmark,
  testClassificationAccuracy,
  TEST_CASES
};
