/**
 * Pattern-Based Interview Question Extraction Service
 *
 * Extracts interview questions from Reddit posts using regex patterns and keyword matching.
 * This is the MVP approach - no LLM, just smart patterns and rules.
 *
 * Performance: <1ms per post, $0/month cost
 * Accuracy Target: 70-80% coverage with high confidence patterns
 *
 * @module questionExtractionService
 */

const logger = require('../utils/logger');

/**
 * Question extraction patterns with confidence scores
 * Ordered by reliability (highest confidence first)
 */
const EXTRACTION_PATTERNS = [
  // Pattern 1: Numbered Lists (0.95 confidence)
  // "1. Implement LRU cache"
  // "2) Design a rate limiter"
  {
    name: 'numbered_list',
    regex: /^\s*\d+[\.)]\s+(.{10,300})$/gm,
    confidence: 0.95,
    description: 'Numbered list items'
  },

  // Pattern 2: Explicit Question Markers (0.90 confidence)
  // "They asked: how would you design..."
  // "Interviewer asked me to implement..."
  {
    name: 'explicit_marker',
    regex: /(?:they asked|he asked|she asked|interviewer asked|was asked|got asked|question was|asked me to)[\s:,]+["']?([^"'\n]{10,300})[."']?/gi,
    confidence: 0.90,
    description: 'Explicit question markers'
  },

  // Pattern 3: Bullet Lists (0.88 confidence)
  // "- Design a URL shortener"
  // "* Implement merge sort"
  {
    name: 'bullet_list',
    regex: /^\s*[-*•]\s+(.{10,300})$/gm,
    confidence: 0.88,
    description: 'Bullet point items'
  },

  // Pattern 4: Round/Phase Markers (0.87 confidence)
  // "Round 1: System design question"
  // "Phone screen: Reverse a linked list"
  {
    name: 'round_marker',
    regex: /(?:round\s*\d+|phone screen|onsite|technical round|behavioral round|final round)[\s:]+(.{10,300})/gi,
    confidence: 0.87,
    description: 'Interview round markers'
  },

  // Pattern 5: Quoted Questions (0.82 confidence)
  // "Can you reverse a linked list?"
  // "Explain the difference between REST and GraphQL"
  {
    name: 'quoted_question',
    regex: /"([A-Z][^"]{10,300}\??)"/g,
    confidence: 0.82,
    description: 'Quoted text with question'
  },

  // Pattern 6: Imperative Patterns (0.75 confidence)
  // "Implement a function to..."
  // "Design a system that..."
  {
    name: 'imperative',
    regex: /(?:implement|design|write|create|build|explain|describe|tell me about|walk me through)\s+(?:a|an|your|how|why)?\s*([^.?!]{10,200})[.?]/gi,
    confidence: 0.75,
    description: 'Imperative instructions'
  },

  // ===== ENHANCED PATTERNS (10 new patterns) =====

  // Pattern 7: LeetCode References (0.95 confidence)
  // "LC 315 - Count Smaller Numbers"
  // "LeetCode #212 - Word Search II"
  {
    name: 'leetcode_ref',
    regex: /(?:LC|LeetCode)\s*#?\d+\s*[-:]?\s*(.{5,300}?)(?:\n|$|\.)/gi,
    confidence: 0.95,
    description: 'LeetCode problem references'
  },

  // Pattern 8: Question Numbers with Colon (0.92 confidence)
  // "Q1: Implement LRU cache"
  // "Question 2: Design rate limiter"
  {
    name: 'question_number',
    regex: /(?:Q|Question)\s*\d+[\s:]+(.{10,300})(?:\n|$)/gim,
    confidence: 0.92,
    description: 'Numbered questions (Q1, Q2, etc.)'
  },

  // Pattern 9: Technical Interview Sections (0.90 confidence)
  // "Coding question: reverse a binary tree"
  // "Technical round: implement merge sort"
  {
    name: 'technical_section',
    regex: /(?:coding|technical|behavioral|system design)\s+(?:question|round|interview|test)[\s:]+(.{10,300})(?:\n|$)/gi,
    confidence: 0.90,
    description: 'Technical interview sections'
  },

  // Pattern 10: Asked About Pattern (0.88 confidence)
  // "They asked about system design patterns"
  // "Asked about data structures"
  {
    name: 'asked_about',
    regex: /asked about\s+(.{10,300})(?:\n|$|\.)/gi,
    confidence: 0.88,
    description: 'Asked about pattern'
  },

  // Pattern 11: Given Problem Pattern (0.85 confidence)
  // "Given a problem to design Twitter"
  // "Provided a task to implement autocomplete"
  {
    name: 'given_problem',
    regex: /(?:given|provided)\s+(?:a|an)?\s*(?:problem|task|challenge)?\s+to\s+(.{10,300})(?:\n|$)/gi,
    confidence: 0.85,
    description: 'Given problem/task pattern'
  },

  // Pattern 12: Had To Pattern (0.83 confidence)
  // "I had to implement merge sort"
  // "Had to design a distributed cache"
  {
    name: 'had_to',
    regex: /(?:I\s+)?had to\s+(?:implement|design|write|solve|explain|create|build)\s+(.{10,300})(?:\n|$)/gi,
    confidence: 0.83,
    description: 'Had to pattern'
  },

  // Pattern 13: Problem Statement Pattern (0.80 confidence)
  // "The problem was: find the longest substring"
  // "Problem statement: design a rate limiter"
  {
    name: 'problem_statement',
    regex: /(?:the\s+)?problem\s+(?:was|statement)[\s:]+(.{10,300})(?:\n|$)/gi,
    confidence: 0.80,
    description: 'Problem statement pattern'
  },

  // Pattern 14: Interview Gave Pattern (0.80 confidence)
  // "Interviewer gave me a graph problem"
  // "They presented a system design challenge"
  {
    name: 'interview_gave',
    regex: /(?:interviewer|they|he|she)\s+(?:gave|presented|showed)\s+(?:me\s+)?(?:a|an)?\s*(.{10,300})(?:\n|$)/gi,
    confidence: 0.80,
    description: 'Interviewer gave pattern'
  },

  // Pattern 15: Solve This Pattern (0.78 confidence)
  // "Solve this: find missing number in array"
  // "Solve the following: implement LRU cache"
  {
    name: 'solve_this',
    regex: /solve\s+(?:this|the|following)[\s:]+(.{10,300})(?:\n|$)/gi,
    confidence: 0.78,
    description: 'Solve this pattern'
  },

  // Pattern 16: Challenge/Task Was Pattern (0.75 confidence)
  // "The challenge was to implement autocomplete"
  // "Task was: design a URL shortener"
  {
    name: 'challenge_was',
    regex: /(?:the\s+)?(?:challenge|task)\s+was[\s:]+(?:to\s+)?(.{10,300})(?:\n|$)/gi,
    confidence: 0.75,
    description: 'Challenge/task was pattern'
  }
];

/**
 * Keywords for question type classification
 */
const CATEGORY_KEYWORDS = {
  coding: {
    primary: ['implement', 'algorithm', 'function', 'array', 'tree', 'graph', 'linked list',
              'sort', 'search', 'complexity', 'runtime', 'reverse', 'merge'],
    secondary: ['leetcode', 'hackerrank', 'o(n)', 'recursion', 'iteration', 'loop']
  },
  system_design: {
    primary: ['design', 'architecture', 'scale', 'distributed', 'microservices', 'system',
              'database', 'api', 'service'],
    secondary: ['load balancer', 'cache', 'redis', 'messaging', 'kafka', 'rate limiter',
                'url shortener', 'news feed', 'instagram', 'twitter']
  },
  behavioral: {
    primary: ['tell me about', 'describe a time', 'how do you handle', 'experience with',
              'situation where'],
    secondary: ['conflict', 'team', 'deadline', 'leadership', 'failure', 'success',
                'disagree', 'improve', 'challenge']
  },
  technical: {
    primary: ['explain', 'difference between', 'what is', 'how does', 'define'],
    secondary: ['rest', 'graphql', 'sql', 'nosql', 'oop', 'solid', 'design pattern',
                'testing', 'ci/cd', 'docker', 'kubernetes']
  }
};

/**
 * Blacklist patterns to filter out meta-questions and noise
 */
const BLACKLIST_PATTERNS = [
  /anyone know/i,
  /does anyone/i,
  /should i/i,
  /can someone/i,
  /i have a question about/i,
  /is it worth/i,
  /how long did/i,
  /when should i/i,
  /where can i/i
];

/**
 * Extract interview questions from post text
 * @param {string} text - Reddit post body text
 * @param {Object} options - Extraction options
 * @param {number} options.minConfidence - Minimum confidence threshold (default: 0.70)
 * @param {number} options.maxQuestions - Maximum questions to return (default: 20)
 * @returns {Array<Object>} Extracted questions with metadata
 */
function extractInterviewQuestions(text, options = {}) {
  const {
    minConfidence = 0.70,
    maxQuestions = 20
  } = options;

  if (!text || typeof text !== 'string' || text.length < 20) {
    return [];
  }

  // Step 1: Preprocess text
  const cleanedText = preprocessText(text);

  // Step 2: Extract questions using all patterns
  const rawQuestions = [];

  for (const pattern of EXTRACTION_PATTERNS) {
    const matches = extractWithPattern(cleanedText, pattern);
    rawQuestions.push(...matches);
  }

  if (rawQuestions.length === 0) {
    logger.debug('[QuestionExtraction] No questions found in text');
    return [];
  }

  // Step 3: Filter out noise
  const filtered = rawQuestions.filter(q => {
    // Check blacklist
    if (BLACKLIST_PATTERNS.some(pattern => pattern.test(q.text))) {
      logger.debug(`[QuestionExtraction] Filtered blacklisted: "${q.text.substring(0, 50)}..."`);
      return false;
    }

    // Check length constraints
    if (q.text.length < 10 || q.text.length > 300) {
      return false;
    }

    // Check confidence threshold
    if (q.confidence < minConfidence) {
      return false;
    }

    return true;
  });

  // Step 4: Deduplicate similar questions
  const unique = deduplicateQuestions(filtered);

  // Step 5: Classify question types
  const classified = unique.map(q => ({
    ...q,
    type: classifyQuestion(q.text)
  }));

  // Step 6: Sort by confidence (desc) then length (asc for conciseness)
  classified.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.text.length - b.text.length;
  });

  // Step 7: Limit results
  const limited = classified.slice(0, maxQuestions);

  logger.info(`[QuestionExtraction] Extracted ${limited.length} questions from ${text.length} chars (${rawQuestions.length} raw → ${filtered.length} filtered → ${unique.length} unique)`);

  return limited;
}

/**
 * Preprocess text to clean markdown and normalize formatting
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function preprocessText(text) {
  return text
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`code`)
    .replace(/`[^`]+`/g, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Normalize quotes
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive punctuation
    .replace(/\.{3,}/g, '...')
    .trim();
}

/**
 * Extract questions using a specific pattern
 * @param {string} text - Cleaned text
 * @param {Object} pattern - Pattern configuration
 * @returns {Array<Object>} Extracted questions
 */
function extractWithPattern(text, pattern) {
  const questions = [];
  const matches = text.matchAll(pattern.regex);

  for (const match of matches) {
    const questionText = match[1]?.trim();

    if (!questionText || questionText.length < 10) {
      continue;
    }

    questions.push({
      text: cleanQuestionText(questionText),
      raw_text: questionText,
      confidence: pattern.confidence,
      source: pattern.name,
      normalized: normalizeForDedup(questionText)
    });
  }

  return questions;
}

/**
 * Clean and format question text
 * @param {string} text - Raw question text
 * @returns {string} Cleaned question
 */
function cleanQuestionText(text) {
  let cleaned = text
    .trim()
    // Remove leading/trailing quotes
    .replace(/^["']|["']$/g, '')
    // Remove trailing dots
    .replace(/\.+$/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Ensure question mark if it looks like a question
  if (!cleaned.endsWith('?') && !cleaned.endsWith('.')) {
    // Add question mark for interrogative words
    if (/^(how|what|why|when|where|who|which|can|could|would|should|do|does|did|is|are|was|were)/i.test(cleaned)) {
      cleaned += '?';
    }
  }

  return cleaned;
}

/**
 * Normalize text for deduplication
 * @param {string} text - Question text
 * @returns {string} Normalized text
 */
function normalizeForDedup(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate questions using Jaccard similarity
 * @param {Array<Object>} questions - Questions to deduplicate
 * @returns {Array<Object>} Unique questions
 */
function deduplicateQuestions(questions) {
  const unique = [];

  for (const question of questions) {
    // Check if similar question already exists
    const similarIndex = unique.findIndex(existing =>
      calculateJaccardSimilarity(existing.normalized, question.normalized) > 0.85
    );

    if (similarIndex === -1) {
      // New unique question
      unique.push({
        ...question,
        frequency: 1
      });
    } else {
      // Similar question exists - keep higher confidence version
      if (question.confidence > unique[similarIndex].confidence) {
        unique[similarIndex] = {
          ...question,
          frequency: (unique[similarIndex].frequency || 1) + 1
        };
      } else {
        unique[similarIndex].frequency = (unique[similarIndex].frequency || 1) + 1;
      }
    }
  }

  return unique;
}

/**
 * Calculate Jaccard similarity between two strings
 * @param {string} str1 - First string (normalized)
 * @param {string} str2 - Second string (normalized)
 * @returns {number} Similarity score (0-1)
 */
function calculateJaccardSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 2));

  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Classify question type using keyword matching
 * @param {string} questionText - Question text
 * @returns {string} Category name (coding, system_design, behavioral, technical, unknown)
 */
function classifyQuestion(questionText) {
  const lowerText = questionText.toLowerCase();
  const scores = {};

  // Score each category
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    // Primary keywords (2.0 points each)
    for (const keyword of keywords.primary) {
      if (lowerText.includes(keyword)) {
        score += 2.0;
      }
    }

    // Secondary keywords (0.5 points each)
    for (const keyword of keywords.secondary) {
      if (lowerText.includes(keyword)) {
        score += 0.5;
      }
    }

    scores[category] = score;
  }

  // Find highest scoring category
  const maxScore = Math.max(...Object.values(scores));

  if (maxScore === 0) {
    return 'technical'; // Default fallback
  }

  // Return first category with max score (deterministic)
  const categories = Object.keys(scores);
  categories.sort(); // Alphabetical order for deterministic tie-breaking
  return categories.find(cat => scores[cat] === maxScore) || 'unknown';
}

module.exports = {
  extractInterviewQuestions,
  // Export for testing
  preprocessText,
  cleanQuestionText,
  normalizeForDedup,
  calculateJaccardSimilarity,
  classifyQuestion,
  EXTRACTION_PATTERNS,
  CATEGORY_KEYWORDS
};
