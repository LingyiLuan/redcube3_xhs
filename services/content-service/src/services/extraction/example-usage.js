/**
 * Pattern-Based Extractor - Usage Examples
 * 
 * Run this file to see the extractor in action:
 * node src/services/extraction/example-usage.js
 */

const { extractInterviewQuestions, extractBatch, classifyQuestionType } = require('./patternBasedExtractor');

console.log('\n========================================');
console.log('Pattern-Based Extractor - Examples');
console.log('========================================\n');

// Example 1: Simple numbered list
console.log('Example 1: Clean Numbered List');
console.log('-'.repeat(50));

const example1 = {
  title: 'Google L4 SWE Onsite Experience',
  bodyText: 'Had my Google onsite yesterday. They asked:\n\n1. Implement LRU cache with O(1) operations\n2. Design a rate limiter for API requests\n3. Tell me about a time you disagreed with your manager\n\nThe first two were hard but I think I passed!'
};

const result1 = extractInterviewQuestions(example1);

console.log('Found ' + result1.length + ' questions:\n');
result1.forEach((q, i) => {
  console.log((i + 1) + '. "' + q.text + '"');
  console.log('   Type: ' + q.type);
  console.log('   Confidence: ' + q.confidence.toFixed(2));
  console.log('   Source: ' + q.source + '\n');
});

// Example 2: Batch processing
console.log('\nExample 2: Batch Processing');
console.log('-'.repeat(50));

const posts = [
  {
    postId: 'post_1',
    title: 'Meta E5 Interview',
    bodyText: '1. Design Instagram\n2. Implement merge sort\n3. Tell me about a conflict'
  },
  {
    postId: 'post_2', 
    title: 'Microsoft Onsite',
    bodyText: 'They asked me to reverse a linked list and design a distributed cache'
  }
];

const batchResults = extractBatch(posts);

console.log('Processed ' + posts.length + ' posts:\n');
batchResults.forEach(r => {
  console.log('Post ' + r.postId + ': ' + r.questionsFound + ' questions');
  if (r.questionsFound > 0) {
    console.log('  Sample: "' + r.questions[0].text + '"');
  }
});

console.log('\n========================================');
console.log('Examples Complete');
console.log('========================================\n');
