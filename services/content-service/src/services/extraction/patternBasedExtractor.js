/**
 * Pattern-Based Interview Question Extractor
 * MVP approach - No LLM, pure regex and rule-based extraction
 * 
 * Target Performance: <50ms for 2000-word post
 * Target Accuracy: 85%+ precision on well-formatted posts
 * 
 * @module patternBasedExtractor
 */

const logger = require('../../utils/logger');

// ============================================
// 1. PATTERN DEFINITIONS (Hierarchy: High → Low Confidence)
// ============================================

/**
 * Pattern categories ordered by confidence level
 * Higher patterns = higher confidence scores
 */
const EXTRACTION_PATTERNS = {
  // Level 1: Highly structured formats (confidence: 0.90-0.95)
  NUMBERED_LISTS: {
    // Matches: "1. Design a URL shortener", "Q1: Implement LRU cache"
    patterns: [
      /(?:^|\n)\s*(?:Q|Question|Round)?\s*(\d+)[\s.):]+([^\n]{10,200})(?:\n|$)/gim,
      /(?:^|\n)\s*(\d+)\.\s+([^\n]{10,200})(?:\n|$)/gim
    ],
    confidence: 0.95,
    source: 'numbered_list'
  },

  // Level 2: Bullet points (confidence: 0.85-0.90)
  BULLET_LISTS: {
    // Matches: "- Reverse a linked list", "* Design Twitter feed"
    patterns: [
      /(?:^|\n)\s*[-*•]\s+([^\n]{10,200})(?:\n|$)/gim
    ],
    confidence: 0.88,
    source: 'bullet_list'
  },

  // Level 3: Explicit question markers (confidence: 0.85-0.90)
  EXPLICIT_QUESTIONS: {
    // Matches: "They asked: 'how would you design...'"
    patterns: [
      /(?:they\s+)?(?:asked|wanted|said|question\s+was):\s*['""]?([^'"".\n]{15,200})['""]?/gi,
      /(?:the\s+)?(?:interviewer|manager|recruiter)\s+(?:asked|wanted|said):\s*['""]?([^'"".\n]{15,200})['""]?/gi,
      /(?:^|\n)\s*(?:Q|Question|Interview\s+Question):\s*([^\n]{10,200})(?:\n|$)/gim
    ],
    confidence: 0.90,
    source: 'explicit_marker'
  },

  // Level 4: Quoted questions (confidence: 0.80-0.85)
  QUOTED_QUESTIONS: {
    // Matches: "can you reverse a linked list?", 'design a rate limiter'
    patterns: [
      /['""]([^'""]{15,200}(?:how|what|why|design|implement|build|create|write|explain|describe)[^'""]{5,200})['""]?/gi,
      /['""]([^'""]{5,200}(?:how|what|why|design|implement|build|create|write|explain|describe)[^'""]{15,200})['""]?/gi
    ],
    confidence: 0.82,
    source: 'quoted'
  },

  // Level 5: Round/Stage markers (confidence: 0.85-0.90)
  ROUND_MARKERS: {
    // Matches: "Round 1: System design", "Phone screen: coding challenge"
    patterns: [
      /(?:Round|Stage|Phase)\s+\d+:\s*([^\n]{10,200})(?:\n|$)/gi,
      /(?:Phone\s+screen|Technical\s+screen|Onsite|Final\s+round|First\s+round):\s*([^\n]{10,200})(?:\n|$)/gi
    ],
    confidence: 0.87,
    source: 'round_marker'
  },

  // Level 6: Implicit questions in narrative (confidence: 0.65-0.75)
  IMPLICIT_QUESTIONS: {
    // Matches: "Then came finding cycles in a graph"
    patterns: [
      /(?:was|came|got|faced|given|asked\s+to)\s+(?:the\s+)?(?:classic|hard|easy|tough)?\s*(?:problem|question|task|challenge)?\s*[-–—:]\s*([^\n]{10,200})/gi,
      /(?:next|then|first|second|third|final)\s+(?:was|came|question)?\s*[-–—:]\s*([^\n]{10,200})/gi,
      /had\s+to\s+((?:design|implement|build|create|write|explain|solve|find)[^\n]{10,150})/gi,
      /asked\s+(?:me\s+)?to\s+((?:design|implement|build|create|write|explain|solve|find)[^\n]{10,150})/gi
    ],
    confidence: 0.70,
    source: 'implicit_narrative'
  }
};

// ============================================
// 2. CLASSIFICATION KEYWORDS
// ============================================

const CLASSIFICATION_KEYWORDS = {
  coding: {
    primary: [
      'implement', 'code', 'write a function', 'algorithm', 'leetcode',
      'data structure', 'array', 'linked list', 'tree', 'graph',
      'binary search', 'sorting', 'dynamic programming', 'recursion',
      'hash', 'stack', 'queue', 'heap', 'bfs', 'dfs'
    ],
    secondary: [
      'time complexity', 'space complexity', 'optimize',
      'runtime', 'o(n)', 'big o', 'edge case'
    ]
  },
  
  system_design: {
    primary: [
      'design', 'scale', 'architecture', 'distributed',
      'microservices', 'database design', 'api design',
      'rate limiter', 'load balancer', 'caching', 'cdn',
      'sharding', 'replication', 'consistency', 'availability',
      'url shortener', 'design twitter', 'design instagram',
      'design uber', 'design netflix', 'design youtube'
    ],
    secondary: [
      'capacity', 'throughput', 'latency', 'bottleneck',
      'tradeoff', 'trade-off', 'scalability', 'reliability'
    ]
  },
  
  behavioral: {
    primary: [
      'tell me about', 'describe a time', 'give me an example',
      'how did you', 'how do you handle', 'what would you do',
      'conflict', 'disagreement', 'challenge', 'failure',
      'leadership', 'teamwork', 'deadline', 'difficult',
      'strengths', 'weaknesses', 'why do you want'
    ],
    secondary: [
      'situation', 'task', 'action', 'result', 'star method',
      'experience', 'team', 'project', 'manager', 'coworker'
    ]
  },
  
  trivia: {
    primary: [
      'what is', 'explain', 'difference between', 'how does',
      'define', 'meaning of', 'what are the', 'list',
      'compare', 'contrast'
    ],
    secondary: [
      'concept', 'principle', 'theory', 'definition'
    ]
  }
};

// ============================================
// 3. NOISE FILTERING RULES
// ============================================

const NOISE_PATTERNS = {
  // Meta-questions (not actual interview questions)
  metaQuestions: [
    /^(?:does\s+)?anyone\s+(?:know|have|think)/i,
    /^should\s+i\s+/i,
    /^how\s+(?:can|do|should)\s+i\s+(?:prepare|study|practice)/i,
    /^what\s+(?:should|can)\s+i\s+(?:expect|study|prepare)/i,
    /^is\s+(?:it|this|that)\s+(?:normal|common|expected)/i,
    /^has\s+anyone\s+/i,
    /^do\s+you\s+(?:think|know|have)/i,
    /\?$/  // Ends with question mark (Reddit users asking questions)
  ],

  // Noise phrases to exclude
  noiseKeywords: [
    'click here', 'see link', 'check out', 'dm me',
    'inbox', 'message me', 'pm me', 'edit:', 'update:',
    'tl;dr', 'tldr', 'thanks in advance', 'thank you',
    'any advice', 'any tips', 'any suggestions'
  ],

  // Company/offer discussion (not questions)
  offerDiscussion: [
    /^comparing\s+offers/i,
    /^negotiation\s+/i,
    /^should\s+i\s+accept/i,
    /^which\s+offer/i,
    /^\$\d+/,  // Starts with dollar amount
    /compensation\s+comparison/i
  ]
};

// Minimum/maximum length constraints
const LENGTH_CONSTRAINTS = {
  MIN_LENGTH: 10,   // "Design API" is ~10 chars
  MAX_LENGTH: 300,  // Anything longer is likely not a single question
  OPTIMAL_MIN: 20,  // Prefer questions with at least 20 chars
  OPTIMAL_MAX: 150  // Most questions are under 150 chars
};

// Blacklist patterns - instant rejection
const BLACKLIST_PATTERNS = [
  /^lol\s+/i,
  /^haha\s+/i,
  /^wtf\s+/i,
  /^omg\s+/i,
  /^fml\s+/i,
  /^bruh\s+/i,
  /^yo\s+/i,
  /^hey\s+(?:guys|everyone)/i,
  /emoji|:joy:|:fire:|:skull:/i
];

// ============================================
// 4. TEXT PREPROCESSING
// ============================================

/**
 * Preprocess Reddit post text before extraction
 * @param {string} text - Raw text from Reddit post
 * @returns {Object} Preprocessed text and metadata
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') {
    return { cleaned: '', metadata: { isEmpty: true } };
  }

  const original = text;
  let cleaned = text;

  // Step 1: Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '[URL]');
  
  // Step 2: Remove Reddit markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Step 3: Remove code blocks (preserve for later analysis)
  const codeBlocks = [];
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return '[CODE_BLOCK]';
  });
  
  // Step 4: Remove inline code
  cleaned = cleaned.replace(/`[^`]+`/g, '[CODE]');
  
  // Step 5: Normalize whitespace
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Step 6: Remove excessive punctuation
  cleaned = cleaned.replace(/[!]{2,}/g, '!');
  cleaned = cleaned.replace(/[?]{2,}/g, '?');
  
  // Step 7: Fix common typos in question markers
  cleaned = cleaned.replace(/questoin/gi, 'question');
  cleaned = cleaned.replace(/intervew/gi, 'interview');
  
  // Step 8: Normalize dashes/bullets
  cleaned = cleaned.replace(/[–—]/g, '-');
  cleaned = cleaned.replace(/^[\s]*[▪▫■□●○◆◇]/gm, '-');

  return {
    cleaned,
    metadata: {
      isEmpty: cleaned.trim().length === 0,
      hasCodeBlocks: codeBlocks.length > 0,
      codeBlockCount: codeBlocks.length,
      originalLength: original.length,
      cleanedLength: cleaned.length
    }
  };
}

// ============================================
// 5. MAIN EXTRACTION FUNCTION
// ============================================

/**
 * Extract interview questions from Reddit post using pattern matching
 * 
 * @param {Object} post - Reddit post object
 * @param {string} post.title - Post title
 * @param {string} post.bodyText - Post body text
 * @param {Object} options - Extraction options
 * @param {number} options.minConfidence - Minimum confidence threshold (default: 0.65)
 * @param {number} options.maxQuestions - Maximum questions to extract (default: 20)
 * @param {boolean} options.includeImplicit - Include implicit questions (default: true)
 * @param {boolean} options.deduplication - Enable deduplication (default: true)
 * @returns {Array<ExtractedQuestion>} Array of extracted questions
 * 
 * @typedef {Object} ExtractedQuestion
 * @property {string} text - The question text
 * @property {string} type - Question type: 'coding', 'system_design', 'behavioral', 'trivia', 'unknown'
 * @property {number} confidence - Confidence score (0.0-1.0)
 * @property {string} source - Extraction source: 'numbered_list', 'bullet_list', etc.
 * @property {Object} metadata - Additional metadata
 * @property {number} metadata.position - Position in original text
 * @property {number} metadata.length - Length of question text
 * @property {string} metadata.extractedFrom - 'title' or 'body'
 */
function extractInterviewQuestions(post, options = {}) {
  const startTime = Date.now();
  
  const {
    minConfidence = 0.65,
    maxQuestions = 20,
    includeImplicit = true,
    deduplication = true
  } = options;

  // Validate input
  if (!post || (!post.title && !post.bodyText)) {
    logger.warn('[Pattern Extractor] Invalid post: missing title and body');
    return [];
  }

  // Preprocess text
  const titlePreprocessed = preprocessText(post.title || '');
  const bodyPreprocessed = preprocessText(post.bodyText || '');

  // Extract from title and body separately
  const titleQuestions = extractFromText(
    titlePreprocessed.cleaned,
    'title',
    { includeImplicit }
  );
  
  const bodyQuestions = extractFromText(
    bodyPreprocessed.cleaned,
    'body',
    { includeImplicit }
  );

  // Combine results
  let allQuestions = [...titleQuestions, ...bodyQuestions];

  // Filter by confidence threshold
  allQuestions = allQuestions.filter(q => q.confidence >= minConfidence);

  // Apply noise filtering
  allQuestions = filterNoise(allQuestions);

  // Classify question types
  allQuestions = allQuestions.map(q => ({
    ...q,
    type: classifyQuestionType(q.text),
    metadata: {
      ...q.metadata,
      wordCount: q.text.split(/\s+/).length
    }
  }));

  // Deduplication
  if (deduplication) {
    allQuestions = deduplicateQuestions(allQuestions);
  }

  // Sort by confidence (descending)
  allQuestions.sort((a, b) => b.confidence - a.confidence);

  // Limit results
  allQuestions = allQuestions.slice(0, maxQuestions);

  // Calculate extraction time
  const extractionTime = Date.now() - startTime;

  // Log results
  logger.info(`[Pattern Extractor] Extracted ${allQuestions.length} questions in ${extractionTime}ms`, {
    postId: post.postId || post.post_id,
    titleQuestions: titleQuestions.length,
    bodyQuestions: bodyQuestions.length,
    filtered: (titleQuestions.length + bodyQuestions.length) - allQuestions.length
  });

  return allQuestions;
}

/**
 * Extract questions from a single text block
 * @private
 */
function extractFromText(text, source, options = {}) {
  const questions = [];
  const { includeImplicit = true } = options;

  // Skip implicit patterns if disabled
  const patternCategories = includeImplicit 
    ? Object.entries(EXTRACTION_PATTERNS)
    : Object.entries(EXTRACTION_PATTERNS).filter(([key]) => key !== 'IMPLICIT_QUESTIONS');

  // Process patterns in order (high confidence first)
  for (const [categoryName, category] of patternCategories) {
    for (const pattern of category.patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state

      while ((match = pattern.exec(text)) !== null) {
        // Extract question text (usually in capture group 1 or 2)
        const questionText = (match[2] || match[1] || '').trim();
        
        if (questionText && questionText.length >= LENGTH_CONSTRAINTS.MIN_LENGTH) {
          questions.push({
            text: cleanQuestionText(questionText),
            confidence: category.confidence,
            source: category.source,
            metadata: {
              extractedFrom: source,
              position: match.index,
              length: questionText.length,
              patternCategory: categoryName
            }
          });
        }
      }
    }
  }

  return questions;
}

/**
 * Clean extracted question text
 * @private
 */
function cleanQuestionText(text) {
  let cleaned = text.trim();

  // Remove trailing punctuation artifacts
  cleaned = cleaned.replace(/[.,;:]+$/, '');
  
  // Remove leading/trailing quotes
  cleaned = cleaned.replace(/^['""]|['""]$/g, '');
  
  // Remove question marks at the end (usually noise from Reddit users asking questions)
  cleaned = cleaned.replace(/\?+$/, '');
  
  // Remove "Follow-up:" prefix
  cleaned = cleaned.replace(/^follow[-\s]?up:\s*/i, '');
  
  // Remove round numbers at start
  cleaned = cleaned.replace(/^(?:round|question|q)\s*\d+:\s*/i, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

// ============================================
// 6. CLASSIFICATION
// ============================================

/**
 * Classify question type using keyword matching
 * @param {string} questionText - The question text
 * @returns {string} Question type
 */
function classifyQuestionType(questionText) {
  const lower = questionText.toLowerCase();
  const scores = {
    coding: 0,
    system_design: 0,
    behavioral: 0,
    trivia: 0
  };

  // Calculate scores for each type
  for (const [type, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    // Primary keywords (weight: 2.0)
    for (const keyword of keywords.primary) {
      if (lower.includes(keyword)) {
        scores[type] += 2.0;
      }
    }

    // Secondary keywords (weight: 0.5)
    for (const keyword of keywords.secondary) {
      if (lower.includes(keyword)) {
        scores[type] += 0.5;
      }
    }
  }

  // Find type with highest score
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  
  const [topType, topScore] = entries[0];

  // Return 'unknown' if no clear match
  if (topScore < 1.0) {
    return 'unknown';
  }

  return topType;
}

// ============================================
// 7. NOISE FILTERING
// ============================================

/**
 * Filter out noise and low-quality extractions
 * @private
 */
function filterNoise(questions) {
  return questions.filter(question => {
    const text = question.text;
    const lower = text.toLowerCase();

    // Check length constraints
    if (text.length < LENGTH_CONSTRAINTS.MIN_LENGTH || 
        text.length > LENGTH_CONSTRAINTS.MAX_LENGTH) {
      return false;
    }

    // Check blacklist patterns
    for (const pattern of BLACKLIST_PATTERNS) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // Check meta-questions
    for (const pattern of NOISE_PATTERNS.metaQuestions) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // Check noise keywords
    for (const keyword of NOISE_PATTERNS.noiseKeywords) {
      if (lower.includes(keyword)) {
        return false;
      }
    }

    // Check offer discussion patterns
    for (const pattern of NOISE_PATTERNS.offerDiscussion) {
      if (pattern.test(text)) {
        return false;
      }
    }

    // Must contain at least one verb or action word
    const hasActionWord = /(?:implement|design|build|create|write|explain|describe|solve|find|calculate|optimize|analyze|reverse|merge|sort|search|traverse)/i.test(text);
    
    if (!hasActionWord && question.confidence < 0.85) {
      return false;
    }

    return true;
  });
}

// ============================================
// 8. DEDUPLICATION
// ============================================

/**
 * Remove duplicate or very similar questions
 * @private
 */
function deduplicateQuestions(questions) {
  const unique = [];
  const seen = new Set();

  for (const question of questions) {
    // Normalize for comparison
    const normalized = question.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for exact duplicates
    if (seen.has(normalized)) {
      continue;
    }

    // Check for high similarity with existing questions
    let isDuplicate = false;
    for (const existing of unique) {
      const existingNormalized = existing.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const similarity = calculateStringSimilarity(normalized, existingNormalized);
      
      if (similarity > 0.85) {
        // Keep the one with higher confidence
        if (question.confidence > existing.confidence) {
          const index = unique.indexOf(existing);
          unique[index] = question;
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(question);
      seen.add(normalized);
    }
  }

  return unique;
}

/**
 * Calculate similarity between two strings (Jaccard similarity)
 * @private
 */
function calculateStringSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// ============================================
// 9. QUALITY SCORING
// ============================================

/**
 * Calculate quality score for extracted question
 * @param {ExtractedQuestion} question - Extracted question
 * @returns {number} Quality score (0.0-1.0)
 */
function calculateQualityScore(question) {
  let score = question.confidence;

  // Bonus for optimal length
  if (question.text.length >= LENGTH_CONSTRAINTS.OPTIMAL_MIN &&
      question.text.length <= LENGTH_CONSTRAINTS.OPTIMAL_MAX) {
    score += 0.05;
  }

  // Bonus for technical keywords
  const technicalKeywords = [
    'algorithm', 'data structure', 'complexity', 'optimize',
    'distributed', 'scalable', 'architecture', 'design pattern'
  ];
  
  const lower = question.text.toLowerCase();
  const technicalMatches = technicalKeywords.filter(kw => lower.includes(kw)).length;
  score += Math.min(technicalMatches * 0.02, 0.08);

  // Bonus for clear question type
  if (question.type !== 'unknown') {
    score += 0.03;
  }

  // Penalty for very short questions
  if (question.text.length < LENGTH_CONSTRAINTS.OPTIMAL_MIN) {
    score -= 0.10;
  }

  // Penalty for questions from implicit patterns
  if (question.source === 'implicit_narrative') {
    score -= 0.05;
  }

  // Cap at 1.0
  return Math.min(Math.max(score, 0), 1.0);
}

// ============================================
// 10. BATCH PROCESSING
// ============================================

/**
 * Process multiple posts in batch
 * @param {Array<Object>} posts - Array of Reddit posts
 * @param {Object} options - Extraction options
 * @returns {Array<Object>} Results with extracted questions per post
 */
function extractBatch(posts, options = {}) {
  const startTime = Date.now();
  const results = [];

  for (const post of posts) {
    try {
      const questions = extractInterviewQuestions(post, options);
      results.push({
        postId: post.postId || post.post_id,
        questionsFound: questions.length,
        questions,
        success: true
      });
    } catch (error) {
      logger.error('[Pattern Extractor] Error processing post:', {
        postId: post.postId || post.post_id,
        error: error.message
      });
      results.push({
        postId: post.postId || post.post_id,
        questionsFound: 0,
        questions: [],
        success: false,
        error: error.message
      });
    }
  }

  const totalTime = Date.now() - startTime;
  const totalQuestions = results.reduce((sum, r) => sum + r.questionsFound, 0);

  logger.info(`[Pattern Extractor] Batch completed: ${posts.length} posts in ${totalTime}ms`, {
    avgTimePerPost: Math.round(totalTime / posts.length),
    totalQuestions,
    avgQuestionsPerPost: (totalQuestions / posts.length).toFixed(2)
  });

  return results;
}

// ============================================
// 11. PERFORMANCE MONITORING
// ============================================

/**
 * Get performance statistics
 * @returns {Object} Performance stats
 */
function getPerformanceStats() {
  return {
    patternCount: Object.values(EXTRACTION_PATTERNS).reduce((sum, cat) => sum + cat.patterns.length, 0),
    classificationTypes: Object.keys(CLASSIFICATION_KEYWORDS).length,
    noiseFilters: NOISE_PATTERNS.metaQuestions.length + NOISE_PATTERNS.noiseKeywords.length,
    targetPerformance: '<50ms per 2000-word post',
    memoryFootprint: 'Low (no ML models, pure regex)'
  };
}

// ============================================
// 12. EXPORTS
// ============================================

module.exports = {
  extractInterviewQuestions,
  extractBatch,
  classifyQuestionType,
  calculateQualityScore,
  preprocessText,
  getPerformanceStats,
  
  // Export for testing
  _internal: {
    EXTRACTION_PATTERNS,
    CLASSIFICATION_KEYWORDS,
    NOISE_PATTERNS,
    LENGTH_CONSTRAINTS,
    filterNoise,
    deduplicateQuestions,
    cleanQuestionText,
    calculateStringSimilarity
  }
};
