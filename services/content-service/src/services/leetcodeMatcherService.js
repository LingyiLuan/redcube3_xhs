const pool = require('../config/database');
const stringSimilarity = require('string-similarity');

/**
 * LeetCode Question Matcher Service
 *
 * Matches extracted interview questions to LeetCode database
 * Uses hybrid approach: exact → keyword → alias → fuzzy → LLM fallback
 *
 * Target accuracy: 95%+ match rate
 */

/**
 * Question Aliases Mapping
 * Maps common question phrasings to LeetCode titles
 * Add new aliases as we discover failures in production
 */
const QUESTION_ALIASES = {
  // URL shortening variations
  'url shortener': ['encode decode tinyurl', 'design tinyurl', 'tinyurl'],
  'shorten url': ['encode decode tinyurl', 'tinyurl'],
  'tiny url': ['encode decode tinyurl', 'tinyurl'],
  'encode decode url': ['encode decode tinyurl'],

  // LRU Cache variations
  'lru': ['lru cache'],
  'implement lru': ['lru cache'],
  'least recently used cache': ['lru cache'],
  'least recently used': ['lru cache'],
  'lru cache implementation': ['lru cache'],

  // Rate limiting variations
  'rate limit': ['logger rate limiter'],
  'rate limiter': ['logger rate limiter'],
  'design rate limiter': ['logger rate limiter'],

  // Social media
  'twitter': ['design twitter'],
  'design twitter feed': ['design twitter'],
  'twitter feed': ['design twitter'],

  // Data structures
  'trie': ['implement trie prefix tree'],
  'prefix tree': ['implement trie prefix tree'],
  'implement trie': ['implement trie prefix tree'],

  // Linked list variations
  'reverse list': ['reverse linked list'],
  'reverse linked': ['reverse linked list'],

  // Parentheses/brackets
  'validate brackets': ['valid parentheses'],
  'validate parentheses': ['valid parentheses'],
  'balanced parentheses': ['valid parentheses'],
  'balanced brackets': ['valid parentheses'],

  // Sum variations
  'two numbers sum': ['two sum'],
  'sum two': ['two sum'],
  'three sum': ['3sum'],
  'four sum': ['4sum'],

  // Substring/string problems
  'longest substring': ['longest substring without repeating characters'],
  'substring without repeat': ['longest substring without repeating characters'],

  // Array problems
  'median sorted arrays': ['median of two sorted arrays'],
  'median two sorted': ['median of two sorted arrays'],

  // Binary tree
  'maximum depth tree': ['maximum depth of binary tree'],
  'max depth binary tree': ['maximum depth of binary tree'],
  'invert tree': ['invert binary tree'],
  'invert binary tree': ['invert binary tree'],

  // Graph problems
  'number islands': ['number of islands'],
  'count islands': ['number of islands'],
  'clone graph': ['clone graph'],

  // Dynamic programming
  'climbing stairs': ['climbing stairs'],
  'house robber': ['house robber'],
  'coin change': ['coin change'],

  // System design
  'design parking': ['design parking system'],
  'parking lot': ['design parking system'],
  'design hashmap': ['design hashmap'],
  'design hashset': ['design hashset']
};

/**
 * Main matching function
 * @param {string} questionText - The extracted interview question text
 * @param {string} questionType - coding, system_design, behavioral, technical
 * @returns {Object} { matched, leetcode_id, title, difficulty, url, confidence, method }
 */
async function matchQuestionToLeetCode(questionText, questionType = 'coding') {
  if (!questionText || typeof questionText !== 'string') {
    return { matched: false, confidence: 0, method: 'none' };
  }

  console.log(`🔍 Matching: "${questionText.substring(0, 60)}..."`);

  // Step 1: Normalize the question text
  const normalized = normalizeQuestionText(questionText);

  // Step 2: Try exact match (fastest, 100% accurate)
  const exactMatch = await tryExactMatch(normalized);
  if (exactMatch) {
    console.log(`  ✅ Exact match: ${exactMatch.title} (confidence: 1.0)`);
    return { ...exactMatch, confidence: 1.0, method: 'exact', matched: true };
  }

  // Step 3: Try keyword match (very fast, ~80% accuracy)
  const keywordMatch = await tryKeywordMatch(normalized, questionType);
  if (keywordMatch && keywordMatch.confidence > 0.85) {
    console.log(`  ✅ Keyword match: ${keywordMatch.title} (confidence: ${keywordMatch.confidence.toFixed(2)})`);
    return { ...keywordMatch, method: 'keyword', matched: true };
  }

  // Step 4: Try alias match (handles common variations)
  const aliasMatch = await tryAliasMatch(normalized, questionType);
  if (aliasMatch && aliasMatch.confidence > 0.80) {
    console.log(`  ✅ Alias match: ${aliasMatch.title} (confidence: ${aliasMatch.confidence.toFixed(2)})`);
    return { ...aliasMatch, method: 'alias', matched: true };
  }

  // Step 5: Try fuzzy match (fast, handles typos)
  const fuzzyMatch = await tryFuzzyMatch(normalized, questionType);
  if (fuzzyMatch && fuzzyMatch.confidence > 0.75) {
    console.log(`  ✅ Fuzzy match: ${fuzzyMatch.title} (confidence: ${fuzzyMatch.confidence.toFixed(2)})`);
    return { ...fuzzyMatch, method: 'fuzzy', matched: true };
  }

  // Step 6: LLM fallback (last resort, for <5% of questions)
  const llmMatch = await tryLLMMatch(questionText, questionType);
  if (llmMatch && llmMatch.confidence > 0.65) {
    console.log(`  ✅ LLM match: ${llmMatch.title} (confidence: ${llmMatch.confidence.toFixed(2)})`);
    return { ...llmMatch, method: 'llm', matched: true };
  }

  // No match found
  console.log(`  ❌ No match found for: "${questionText.substring(0, 60)}..."`);
  return { matched: false, confidence: 0, method: 'none' };
}

/**
 * Normalize question text for matching
 * Removes common filler words, punctuation, normalizes whitespace
 */
function normalizeQuestionText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .replace(/\b(implement|design|create|write|find|return|given|you are|the|a|an|in|on|at|to|for|of|with|by|from|as|is|was|are|were|be|that|this|it|question|asked|they|me|about)\b/g, '') // Remove filler words
    .replace(/\s+/g, ' ')         // Clean up extra spaces
    .trim();
}

/**
 * Method 1: Exact Match
 * Fastest, 100% accurate when it matches
 */
async function tryExactMatch(normalized) {
  try {
    // Try exact title match (case-insensitive, normalized)
    const result = await pool.query(`
      SELECT leetcode_id, frontend_id, title, title_slug, difficulty, difficulty_numeric, url
      FROM leetcode_questions
      WHERE LOWER(REPLACE(REPLACE(title, '-', ' '), '  ', ' ')) = $1
      LIMIT 1
    `, [normalized]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  Exact match error:', error.message);
    return null;
  }
}

/**
 * Method 2: Keyword Match
 * Extract important keywords and find questions containing them
 */
async function tryKeywordMatch(normalized, questionType) {
  try {
    // Extract important keywords
    const keywords = extractKeywords(normalized);

    if (keywords.length < 2) {
      return null; // Need at least 2 keywords for reliable matching
    }

    // Build SQL query to find questions containing these keywords
    const keywordConditions = keywords.map((_, idx) =>
      `LOWER(title) LIKE $${idx + 1}`
    ).join(' AND ');

    const keywordPatterns = keywords.map(kw => `%${kw}%`);

    const query = `
      SELECT
        leetcode_id,
        frontend_id,
        title,
        title_slug,
        difficulty,
        difficulty_numeric,
        url,
        (
          SELECT COUNT(*)
          FROM unnest($${keywords.length + 1}::text[]) kw
          WHERE LOWER(title) LIKE '%' || kw || '%'
        ) as match_count
      FROM leetcode_questions
      WHERE ${keywordConditions}
      ORDER BY match_count DESC, frontend_id ASC
      LIMIT 1
    `;

    const result = await pool.query(query, [...keywordPatterns, keywords]);

    if (result.rows.length > 0) {
      const match = result.rows[0];
      const confidence = match.match_count / keywords.length; // % of keywords matched
      return { ...match, confidence };
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  Keyword match error:', error.message);
    return null;
  }
}

/**
 * Method 3: Alias Match
 * Check if question matches any known aliases
 * Handles common variations like "URL shortener" → "TinyURL"
 */
async function tryAliasMatch(normalized, questionType) {
  try {
    // Check if normalized text contains any alias
    for (const [alias, targets] of Object.entries(QUESTION_ALIASES)) {
      // Check if alias is in the normalized text
      if (normalized.includes(alias.toLowerCase())) {
        console.log(`  🔄 Found alias: "${alias}" in question`);

        // Try to match against target variations
        for (const target of targets) {
          const result = await pool.query(`
            SELECT leetcode_id, frontend_id, title, title_slug,
                   difficulty, difficulty_numeric, url
            FROM leetcode_questions
            WHERE LOWER(title) LIKE $1
            ORDER BY
              CASE
                WHEN LOWER(title) = $2 THEN 1
                WHEN LOWER(title) LIKE $3 THEN 2
                ELSE 3
              END
            LIMIT 1
          `, [
            `%${target.toLowerCase()}%`,  // Contains target
            target.toLowerCase(),          // Exact match (prioritize)
            `${target.toLowerCase()}%`     // Starts with (second priority)
          ]);

          if (result.rows.length > 0) {
            const match = result.rows[0];
            console.log(`  🎯 Alias expanded: "${alias}" → "${match.title}"`);
            return { ...match, confidence: 0.90 }; // High confidence for alias matches
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  Alias match error:', error.message);
    return null;
  }
}

/**
 * Method 4: Fuzzy Match
 * Use string similarity to find best match
 * Handles typos and variations in question phrasing
 */
async function tryFuzzyMatch(normalized, questionType) {
  try {
    // Get candidate questions (limit to 1000 for performance)
    // Prioritize by difficulty and question type
    let query = `
      SELECT leetcode_id, frontend_id, title, title_slug, difficulty, difficulty_numeric, url
      FROM leetcode_questions
    `;

    const conditions = [];
    const params = [];

    // Filter by question type if known
    if (questionType === 'coding') {
      // Exclude system design questions for coding type
      conditions.push(`NOT (LOWER(title) LIKE '%design%' OR LOWER(title) LIKE '%implement%system%')`);
    } else if (questionType === 'system_design') {
      // Only include design-related questions
      conditions.push(`(LOWER(title) LIKE '%design%' OR LOWER(title) LIKE '%implement%')`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' LIMIT 1000';

    const result = await pool.query(query, params);
    const questions = result.rows;

    if (questions.length === 0) {
      return null;
    }

    // Calculate string similarity for each question
    const similarities = questions.map(q => {
      const titleNormalized = normalizeQuestionText(q.title);
      const similarity = stringSimilarity.compareTwoStrings(normalized, titleNormalized);
      return { ...q, confidence: similarity };
    });

    // Sort by confidence and get best match
    similarities.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = similarities[0];

    if (bestMatch && bestMatch.confidence > 0.5) {
      return bestMatch;
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  Fuzzy match error:', error.message);
    return null;
  }
}

/**
 * Method 5: LLM Match (Last Resort - Minimal Cost)
 * Use OpenAI GPT to identify the LeetCode problem
 * Only called for <5% of questions that fail all other methods
 * Cost: ~$0.001 per question, ~$0.05 per batch
 */
async function tryLLMMatch(questionText, questionType) {
  try {
    const openai = require('../config/openai');

    const prompt = `You are a LeetCode expert. Given this interview question, identify the exact LeetCode problem it refers to.

Interview question: "${questionText}"

Return ONLY the exact LeetCode problem title (e.g., "Two Sum", "Reverse Linked List", "LRU Cache").
If you're not confident (>70%), return "UNKNOWN".

LeetCode problem title:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 50
    });

    const leetcodeTitle = response.choices[0].message.content.trim();

    if (leetcodeTitle === 'UNKNOWN' || !leetcodeTitle) {
      return null;
    }

    // Look up this title in our database
    const result = await pool.query(`
      SELECT leetcode_id, frontend_id, title, title_slug, difficulty, difficulty_numeric, url
      FROM leetcode_questions
      WHERE LOWER(title) = LOWER($1)
      LIMIT 1
    `, [leetcodeTitle]);

    if (result.rows.length > 0) {
      return { ...result.rows[0], confidence: 0.70 };
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  LLM match error:', error.message);
    return null;
  }
}

/**
 * Extract important keywords from question text
 * Filters out stop words and keeps meaningful terms
 */
function extractKeywords(text) {
  // Common stop words to ignore
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'can', 'may', 'might', 'must', 'that', 'this', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'where', 'when', 'why', 'how', 'implement', 'design', 'write', 'create',
    'given', 'return', 'find', 'question', 'asked', 'interview', 'problem'
  ]);

  const words = text.toLowerCase().split(/\s+/);
  const keywords = words
    .filter(word => word.length > 2)  // At least 3 characters
    .filter(word => !stopWords.has(word))
    .filter((word, idx, arr) => arr.indexOf(word) === idx); // Unique

  return keywords;
}

/**
 * Get match statistics (for analytics)
 */
async function getMatchStatistics() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_questions,
        difficulty,
        COUNT(*) FILTER (WHERE difficulty = 'Easy') as easy_count,
        COUNT(*) FILTER (WHERE difficulty = 'Medium') as medium_count,
        COUNT(*) FILTER (WHERE difficulty = 'Hard') as hard_count
      FROM leetcode_questions
      GROUP BY difficulty
    `);

    return result.rows;
  } catch (error) {
    console.error('Error getting match statistics:', error.message);
    return [];
  }
}

module.exports = {
  matchQuestionToLeetCode,
  getMatchStatistics,
  normalizeQuestionText,
  extractKeywords
};
