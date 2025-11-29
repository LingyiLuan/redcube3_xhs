/**
 * Problem Matching Service
 *
 * Matches extracted interview questions from Reddit to curated LeetCode problems
 * Uses a 3-tier matching strategy:
 * 1. Exact name matching
 * 2. Fuzzy string matching (Levenshtein distance)
 * 3. Category-based fallback
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of problem names
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  const len1 = s1.length;
  const len2 = s2.length;

  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Normalize problem name for better matching
 * - Remove common suffixes like "(Easy)", "(Medium)", "(Hard)"
 * - Trim whitespace
 * - Convert to lowercase
 */
function normalizeProblemName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .replace(/\s*\((Easy|Medium|Hard)\)\s*/gi, '')
    .replace(/\s*\[Easy\]\s*|\s*\[Medium\]\s*|\s*\[Hard\]\s*/gi, '')
    .replace(/\s*-\s*(Easy|Medium|Hard)\s*/gi, '')
    .replace(/^LC\s*#?\d+\s*[-:.]?\s*/i, '') // Remove "LC #123 -" prefix
    .replace(/^#?\d+\s*[-:.]?\s*/i, '') // Remove "#123." prefix
    .trim()
    .toLowerCase();
}

/**
 * Validate if text looks like a real problem name (not Reddit snippet)
 */
function isValidProblemName(text) {
  if (!text || typeof text !== 'string') return false;

  // Too short (likely not a problem name)
  if (text.length < 5) return false;

  // Too long (likely a Reddit post snippet)
  if (text.length > 100) return false;

  // Blacklist: biographical/anecdotal patterns
  const blacklistPatterns = [
    /location:/i,
    /minutes.*min/i,
    /internship.*fortune/i,
    /recruiter/i,
    /\d+\s*(years?|months?|weeks?)\s*(experience|exp)/i,
    /graduated/i,
    /bachelor|master|phd|degree/i,
    /contacted/i,
    /waiting for/i,
    /got rejected/i,
    /offer letter/i,
    /interview.*round/i,
    /i\s+(was|am|have|got|received)/i,
    /my\s+(interview|experience|story)/i
  ];

  for (const pattern of blacklistPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  // Whitelist: coding-related keywords
  const whitelistPatterns = [
    /array|list|string|tree|graph|heap|stack|queue/i,
    /sort|search|traverse|find|reverse|merge|clone/i,
    /sum|product|max|min|longest|shortest/i,
    /binary|depth|breadth|level|order/i,
    /dynamic|programming|recursion|iteration/i,
    /valid|palindrome|anagram|substring/i,
    /interval|sliding|window|pointer/i,
    /path|cycle|island|connected/i
  ];

  // At least one coding keyword should be present
  const hasCodeKeyword = whitelistPatterns.some(pattern => pattern.test(text));

  return hasCodeKeyword;
}

/**
 * Extract category hints from question text
 */
function extractCategoryHints(text) {
  const categoryMap = {
    'Arrays & Hashing': ['array', 'hash', 'hashing', 'hash table', 'hashmap', 'set'],
    'Two Pointers': ['two pointer', 'pointers', 'left right'],
    'Sliding Window': ['sliding window', 'window', 'substring'],
    'Linked List': ['linked list', 'node', 'reverse list'],
    'Trees': ['tree', 'binary tree', 'bst', 'trie', 'prefix tree'],
    'Graph': ['graph', 'dfs', 'bfs', 'island', 'clone graph'],
    'Dynamic Programming': ['dynamic programming', 'dp', 'memoization', 'fibonacci', 'knapsack'],
    'Heap': ['heap', 'priority queue', 'top k', 'median'],
    'Intervals': ['interval', 'merge interval', 'meeting room'],
    'Bit Manipulation': ['bit', 'xor', 'binary']
  };

  const hints = [];
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        hints.push(category);
        break;
      }
    }
  }

  return hints;
}

/**
 * Tier 1: Exact Match
 * Try to find exact problem name match in curated_problems table
 */
async function findExactMatch(questionText) {
  const normalized = normalizeProblemName(questionText);

  if (!normalized || normalized.length < 3) return null;

  try {
    const query = `
      SELECT
        id,
        problem_name,
        leetcode_number,
        leetcode_slug,
        difficulty,
        category,
        subcategory,
        topics,
        url,
        problem_list,
        company_frequency,
        estimated_time_minutes
      FROM curated_problems
      WHERE LOWER(TRIM(problem_name)) = $1
         OR LOWER(leetcode_slug) = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [normalized]);

    if (result.rows.length > 0) {
      logger.info(`[ExactMatch] Found: ${result.rows[0].problem_name}`);
      return result.rows[0];
    }

    return null;
  } catch (error) {
    logger.error('[ExactMatch] Error:', error);
    return null;
  }
}

/**
 * Tier 2: Fuzzy Match
 * Use Levenshtein distance to find similar problem names
 */
async function findFuzzyMatch(questionText, threshold = 0.75) {
  const normalized = normalizeProblemName(questionText);

  if (!normalized || normalized.length < 5) return null;

  try {
    // Get all curated problems
    const query = `
      SELECT
        id,
        problem_name,
        leetcode_number,
        leetcode_slug,
        difficulty,
        category,
        subcategory,
        topics,
        url,
        problem_list,
        company_frequency,
        estimated_time_minutes
      FROM curated_problems
      ORDER BY leetcode_number
    `;

    const result = await pool.query(query);

    let bestMatch = null;
    let bestScore = 0;

    for (const problem of result.rows) {
      const problemNameNorm = normalizeProblemName(problem.problem_name);
      const similarity = calculateSimilarity(normalized, problemNameNorm);

      if (similarity > bestScore && similarity >= threshold) {
        bestScore = similarity;
        bestMatch = { ...problem, similarity_score: similarity };
      }
    }

    if (bestMatch) {
      logger.info(`[FuzzyMatch] Found: ${bestMatch.problem_name} (score: ${bestScore.toFixed(2)})`);
      return bestMatch;
    }

    return null;
  } catch (error) {
    logger.error('[FuzzyMatch] Error:', error);
    return null;
  }
}

/**
 * Tier 3: Category-Based Match
 * Find problems by category and difficulty
 */
async function findByCategoryAndDifficulty(categoryHints, difficulty = 'Medium') {
  if (!categoryHints || categoryHints.length === 0) return null;

  try {
    // Map numeric difficulty to string
    const difficultyMap = {
      1: 'Easy',
      2: 'Easy',
      3: 'Medium',
      4: 'Medium',
      5: 'Hard'
    };

    const difficultyStr = typeof difficulty === 'number'
      ? difficultyMap[difficulty]
      : difficulty;

    const query = `
      SELECT
        id,
        problem_name,
        leetcode_number,
        leetcode_slug,
        difficulty,
        category,
        subcategory,
        topics,
        url,
        problem_list,
        company_frequency,
        estimated_time_minutes
      FROM curated_problems
      WHERE category = ANY($1)
        AND difficulty = $2
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const result = await pool.query(query, [categoryHints, difficultyStr]);

    if (result.rows.length > 0) {
      logger.info(`[CategoryMatch] Found: ${result.rows[0].problem_name} (${categoryHints[0]})`);
      return result.rows[0];
    }

    return null;
  } catch (error) {
    logger.error('[CategoryMatch] Error:', error);
    return null;
  }
}

/**
 * Main matching function - tries all 3 tiers sequentially
 */
async function matchQuestionToProblem(extractedQuestion) {
  if (!extractedQuestion || !extractedQuestion.text) {
    return null;
  }

  const questionText = extractedQuestion.text;

  // Validate that it looks like a real problem name
  if (!isValidProblemName(questionText)) {
    logger.info(`[Matching] Rejected invalid question text: "${questionText.substring(0, 50)}..."`);
    return null;
  }

  // Tier 1: Exact match
  const exactMatch = await findExactMatch(questionText);
  if (exactMatch) {
    return {
      ...exactMatch,
      match_type: 'exact',
      original_text: questionText
    };
  }

  // Tier 2: Fuzzy match
  const fuzzyMatch = await findFuzzyMatch(questionText, 0.75);
  if (fuzzyMatch) {
    return {
      ...fuzzyMatch,
      match_type: 'fuzzy',
      original_text: questionText
    };
  }

  // Tier 3: Category-based match
  const categoryHints = extractCategoryHints(questionText);
  if (categoryHints.length > 0) {
    const categoryMatch = await findByCategoryAndDifficulty(
      categoryHints,
      extractedQuestion.difficulty || 3
    );

    if (categoryMatch) {
      return {
        ...categoryMatch,
        match_type: 'category',
        original_text: questionText
      };
    }
  }

  // No match found - return null
  logger.info(`[Matching] No match found for: "${questionText.substring(0, 50)}..."`);
  return null;
}

/**
 * Batch match multiple questions
 */
async function matchMultipleQuestions(extractedQuestions) {
  if (!Array.isArray(extractedQuestions) || extractedQuestions.length === 0) {
    return [];
  }

  const results = [];

  for (const question of extractedQuestions) {
    const match = await matchQuestionToProblem(question);
    if (match) {
      results.push(match);
    }
  }

  logger.info(`[BatchMatching] Matched ${results.length}/${extractedQuestions.length} questions`);

  return results;
}

/**
 * Get problems by difficulty distribution
 * Used for curriculum building
 */
async function getProblemsByDifficulty(difficulty, category = null, limit = 10) {
  try {
    let query = `
      SELECT
        id,
        problem_name,
        leetcode_number,
        leetcode_slug,
        difficulty,
        category,
        subcategory,
        topics,
        url,
        problem_list,
        company_frequency,
        estimated_time_minutes
      FROM curated_problems
      WHERE difficulty = $1
    `;

    const params = [difficulty];

    if (category) {
      query += ` AND category = $2`;
      params.push(category);
    }

    const paramIndex = params.length + 1;
    query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(limit);

    logger.info(`[GetProblemsByDifficulty] Query: ${query}, Params: ${JSON.stringify(params)}`);

    const result = await pool.query(query, params);

    logger.info(`[GetProblemsByDifficulty] Found ${result.rows.length} problems for difficulty=${difficulty}, category=${category}`);

    return result.rows;
  } catch (error) {
    logger.error('[GetProblemsByDifficulty] Error:', error);
    return [];
  }
}

/**
 * Get problems by category
 */
async function getProblemsByCategory(category, limit = 10) {
  try {
    const query = `
      SELECT
        id,
        problem_name,
        leetcode_number,
        leetcode_slug,
        difficulty,
        category,
        subcategory,
        topics,
        url,
        problem_list,
        company_frequency,
        estimated_time_minutes
      FROM curated_problems
      WHERE category = $1
      ORDER BY
        CASE difficulty
          WHEN 'Easy' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Hard' THEN 3
        END,
        leetcode_number
      LIMIT $2
    `;

    const result = await pool.query(query, [category, limit]);

    return result.rows;
  } catch (error) {
    logger.error('[GetProblemsByCategory] Error:', error);
    return [];
  }
}

/**
 * Get all available categories
 */
async function getAllCategories() {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as problem_count
      FROM curated_problems
      GROUP BY category
      ORDER BY problem_count DESC
    `;

    const result = await pool.query(query);

    return result.rows;
  } catch (error) {
    logger.error('[GetAllCategories] Error:', error);
    return [];
  }
}

module.exports = {
  matchQuestionToProblem,
  matchMultipleQuestions,
  getProblemsByDifficulty,
  getProblemsByCategory,
  getAllCategories,
  isValidProblemName,
  normalizeProblemName,
  calculateSimilarity,
  extractCategoryHints
};
