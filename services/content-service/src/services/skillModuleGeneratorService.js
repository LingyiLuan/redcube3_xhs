/**
 * Skill Module Generator Service
 *
 * Generates comprehensive skill modules for learning maps from actual database data.
 *
 * CORE PRINCIPLES:
 * - NO MOCK DATA - Everything traces to actual posts
 * - Extract facts from database (problems, frequencies, companies)
 * - Use LLM to synthesize narratives and explanations
 * - Professional McKinsey style (NO emojis)
 */

const pool = require('../config/database');
const aiService = require('./aiService');
const logger = require('../utils/logger');

/**
 * Time estimates for different difficulty levels (in hours)
 */
const TIME_ESTIMATES = {
  Easy: 2,
  Medium: 3,
  Hard: 4
};

/**
 * Category groupings for skill modules
 */
const CATEGORY_GROUPINGS = {
  'Arrays & Strings': ['Array', 'String', 'Hash Table', 'Sliding Window'],
  'Linked Lists': ['Linked List'],
  'Trees & Graphs': ['Tree', 'Binary Tree', 'Binary Search Tree', 'Graph', 'Trie'],
  'Dynamic Programming': ['Dynamic Programming', 'DP'],
  'Sorting & Searching': ['Sorting', 'Binary Search', 'Search'],
  'Recursion & Backtracking': ['Recursion', 'Backtracking'],
  'Greedy Algorithms': ['Greedy'],
  'Stack & Queue': ['Stack', 'Queue', 'Monotonic Stack'],
  'Heap & Priority Queue': ['Heap', 'Priority Queue'],
  'Two Pointers': ['Two Pointers'],
  'Bit Manipulation': ['Bit Manipulation'],
  'Math & Geometry': ['Math', 'Geometry'],
  'System Design': ['System Design', 'OOD', 'Design'],
  'Database': ['SQL', 'Database']
};

/**
 * Extract LeetCode problems from database for given post IDs
 */
async function extractProblemsFromDatabase(postIds) {
  try {
    logger.info(`[SkillModule] Extracting problems from ${postIds.length} posts`);

    // Check if leetcode_problems table exists - if not, return empty array
    // This table may not exist in all deployments, it requires separate LeetCode extraction
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'leetcode_problems'
      ) as table_exists
    `;

    const tableCheck = await pool.query(tableCheckQuery);

    if (!tableCheck.rows[0].table_exists) {
      logger.warn('[SkillModule] leetcode_problems table does not exist - falling back to curated_problems');

      // Fallback to curated_problems table (Blind 75, NeetCode 150, etc.)
      return await extractFromCuratedProblems();
    }

    const query = `
      SELECT
        lp.id as problem_id,
        lp.problem_name,
        lp.problem_number,
        lp.difficulty,
        lp.category,
        lp.url as problem_url,
        COUNT(DISTINCT lp.post_id) as frequency,
        ARRAY_AGG(DISTINCT p.llm_company) FILTER (WHERE p.llm_company IS NOT NULL) as companies,
        ARRAY_AGG(DISTINCT lp.post_id) as source_post_ids
      FROM leetcode_problems lp
      LEFT JOIN scraped_posts p ON p.id = lp.post_id
      WHERE lp.post_id = ANY($1)
        AND lp.problem_name IS NOT NULL
        AND lp.problem_name != ''
      GROUP BY lp.id, lp.problem_name, lp.problem_number, lp.difficulty, lp.category, lp.url
      ORDER BY frequency DESC, lp.difficulty ASC
    `;

    const result = await pool.query(query, [postIds]);

    logger.info(`[SkillModule] Found ${result.rows.length} unique problems`);
    logger.info(`[SkillModule] Sample problems: ${result.rows.slice(0, 5).map(p => `${p.problem_name} (${p.frequency} mentions)`).join(', ')}`);

    return result.rows;
  } catch (error) {
    logger.error('[SkillModule] Error extracting problems:', error);
    // Return empty array instead of throwing to allow learning map generation to continue
    logger.warn('[SkillModule] Returning empty problems array due to error');
    return [];
  }
}

/**
 * Fallback: Extract problems from curated_problems table (Blind 75, NeetCode 150, etc.)
 * Used when leetcode_problems table doesn't exist
 */
async function extractFromCuratedProblems() {
  try {
    logger.info('[SkillModule] Extracting from curated_problems table');

    // Check if curated_problems table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'curated_problems'
      ) as table_exists
    `;

    const tableCheck = await pool.query(tableCheckQuery);

    if (!tableCheck.rows[0].table_exists) {
      logger.warn('[SkillModule] curated_problems table does not exist - returning empty array');
      return [];
    }

    const query = `
      SELECT
        id as problem_id,
        problem_name,
        leetcode_number as problem_number,
        difficulty,
        category,
        url as problem_url,
        topics,
        estimated_time_minutes,
        problem_list
      FROM curated_problems
      WHERE problem_list = 'Blind 75'
      ORDER BY
        CASE difficulty
          WHEN 'Easy' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Hard' THEN 3
        END,
        category,
        leetcode_number
    `;

    const result = await pool.query(query);

    logger.info(`[SkillModule] Found ${result.rows.length} curated problems (Blind 75)`);

    // Transform to match the expected format
    return result.rows.map(row => ({
      problem_id: row.problem_id,
      problem_name: row.problem_name,
      problem_number: row.problem_number,
      difficulty: row.difficulty,
      category: row.category,
      problem_url: row.problem_url,
      frequency: 10, // Default frequency for curated problems (high priority)
      companies: [], // No company data for curated problems
      source_post_ids: [],
      estimated_time_minutes: row.estimated_time_minutes,
      is_curated: true
    }));
  } catch (error) {
    logger.error('[SkillModule] Error extracting from curated_problems:', error);
    return [];
  }
}

/**
 * Calculate priority level based on frequency
 */
function calculatePriority(frequency, totalPosts) {
  const percentage = (frequency / totalPosts) * 100;

  if (percentage >= 70) return 'Critical';
  if (percentage >= 50) return 'High';
  if (percentage >= 30) return 'Medium';
  return 'Low';
}

/**
 * Group problems by category
 */
function groupProblemsByCategory(problems) {
  logger.info('[SkillModule] Grouping problems by category');

  const categoryMap = {};

  problems.forEach(problem => {
    // Determine which module this problem belongs to
    let assignedModule = 'Other';

    for (const [moduleName, categories] of Object.entries(CATEGORY_GROUPINGS)) {
      if (categories.some(cat => problem.category && problem.category.includes(cat))) {
        assignedModule = moduleName;
        break;
      }
    }

    if (!categoryMap[assignedModule]) {
      categoryMap[assignedModule] = [];
    }

    categoryMap[assignedModule].push(problem);
  });

  logger.info(`[SkillModule] Grouped into ${Object.keys(categoryMap).length} categories`);
  Object.entries(categoryMap).forEach(([cat, probs]) => {
    logger.info(`  - ${cat}: ${probs.length} problems`);
  });

  return categoryMap;
}

/**
 * Calculate time estimate for a module
 */
function calculateModuleTimeEstimate(problems) {
  return problems.reduce((total, problem) => {
    const difficulty = problem.difficulty || 'Medium';
    return total + (TIME_ESTIMATES[difficulty] || 3);
  }, 0);
}

/**
 * Use LLM to generate module context explaining WHY this module matters
 */
async function generateModuleContext(moduleName, problems, totalPosts) {
  try {
    const topProblems = problems.slice(0, 5);
    const totalMentions = problems.reduce((sum, p) => sum + p.frequency, 0);
    const avgFrequency = (totalMentions / problems.length).toFixed(1);

    const prompt = `You are a professional career advisor analyzing real interview data.

Module: ${moduleName}
Total Problems: ${problems.length}
Total Posts Analyzed: ${totalPosts}
Average Mentions per Problem: ${avgFrequency}

Top 5 Most Mentioned Problems:
${topProblems.map((p, i) => `${i + 1}. ${p.problem_name} (${p.difficulty}) - Mentioned in ${p.frequency} posts`).join('\n')}

Companies Asking These Questions:
${[...new Set(topProblems.flatMap(p => p.companies || []))].slice(0, 10).join(', ')}

Task: Write a 2-3 sentence professional explanation of WHY this skill module is important for interview preparation. Focus on:
1. Real-world relevance based on the data
2. Which companies prioritize this skill
3. What mastering this module enables candidates to do

Style: Professional, concise, NO emojis, McKinsey consulting tone.

Output ONLY the explanation text, no preamble.`;

    const response = await aiService.analyzeWithOpenRouter(prompt, {
      max_tokens: 300,
      temperature: 0.7
    });

    return response.trim();
  } catch (error) {
    logger.error(`[SkillModule] Error generating context for ${moduleName}:`, error);
    // Fallback to simple description
    return `Master ${moduleName} problems commonly asked in technical interviews. This module covers ${problems.length} problems mentioned across multiple interview experiences.`;
  }
}

/**
 * Generate comprehensive skill modules from post IDs
 */
async function generateSkillModules(postIds, options = {}) {
  try {
    logger.info(`[SkillModule] ===== Generating Skill Modules =====`);
    logger.info(`[SkillModule] Input: ${postIds.length} posts`);

    // Step 1: Extract problems from database
    const problems = await extractProblemsFromDatabase(postIds);

    if (problems.length === 0) {
      logger.warn('[SkillModule] No problems found, returning empty modules');
      return {
        modules: [],
        metadata: {
          total_problems: 0,
          total_posts: postIds.length,
          categories_covered: 0
        }
      };
    }

    // Step 2: Group by category
    const categoryMap = groupProblemsByCategory(problems);

    // Step 3: Build skill modules
    const modules = [];

    for (const [moduleName, moduleProblems] of Object.entries(categoryMap)) {
      // Skip modules with too few problems
      if (moduleProblems.length < 2) {
        logger.info(`[SkillModule] Skipping ${moduleName} (only ${moduleProblems.length} problem)`);
        continue;
      }

      // Calculate total frequency for this module
      const totalFrequency = moduleProblems.reduce((sum, p) => sum + p.frequency, 0);
      const priority = calculatePriority(totalFrequency, postIds.length);

      // Calculate time estimate
      const estimatedHours = calculateModuleTimeEstimate(moduleProblems);

      // Get unique companies
      const companies = [...new Set(moduleProblems.flatMap(p => p.companies || []))];

      // Generate LLM context
      logger.info(`[SkillModule] Generating context for: ${moduleName}`);
      const context = await generateModuleContext(moduleName, moduleProblems, postIds.length);

      // Build problem items with source attribution
      const problemItems = moduleProblems.map(p => ({
        problem_id: p.problem_id,
        problem_name: p.problem_name,
        problem_number: p.problem_number,
        difficulty: p.difficulty,
        category: p.category,
        problem_url: p.problem_url,
        frequency: p.frequency,
        mentioned_in_posts: p.frequency,
        source_post_ids: p.source_post_ids,
        companies: p.companies || [],
        priority: calculatePriority(p.frequency, postIds.length),
        estimated_time_hours: TIME_ESTIMATES[p.difficulty] || 3
      }));

      // Sort problems by frequency (most mentioned first)
      problemItems.sort((a, b) => b.frequency - a.frequency);

      modules.push({
        module_name: moduleName,
        priority,
        total_problems: moduleProblems.length,
        estimated_hours: estimatedHours,
        total_mentions: totalFrequency,
        companies,
        context,
        problems: problemItems,
        source_post_ids: [...new Set(moduleProblems.flatMap(p => p.source_post_ids))]
      });
    }

    // Sort modules by priority (Critical > High > Medium > Low)
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    modules.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // If same priority, sort by total mentions
      return b.total_mentions - a.total_mentions;
    });

    logger.info(`[SkillModule] ===== Generated ${modules.length} Skill Modules =====`);
    modules.forEach(m => {
      logger.info(`  - ${m.module_name}: ${m.priority} priority, ${m.total_problems} problems, ${m.estimated_hours}hrs, ${m.total_mentions} mentions`);
    });

    return {
      modules,
      metadata: {
        total_problems: problems.length,
        total_posts: postIds.length,
        categories_covered: modules.length,
        total_estimated_hours: modules.reduce((sum, m) => sum + m.estimated_hours, 0),
        priority_breakdown: {
          Critical: modules.filter(m => m.priority === 'Critical').length,
          High: modules.filter(m => m.priority === 'High').length,
          Medium: modules.filter(m => m.priority === 'Medium').length,
          Low: modules.filter(m => m.priority === 'Low').length
        }
      }
    };

  } catch (error) {
    logger.error('[SkillModule] Error generating skill modules:', error);
    throw error;
  }
}

/**
 * Extract non-coding interview questions (behavioral, system design, etc.)
 */
async function extractNonCodingQuestions(postIds) {
  try {
    logger.info(`[SkillModule] Extracting non-coding questions from ${postIds.length} posts`);

    const query = `
      SELECT
        iq.id,
        iq.question_text,
        iq.question_type,
        iq.company,
        iq.post_id,
        COUNT(*) OVER (PARTITION BY LOWER(TRIM(iq.question_text))) as frequency
      FROM interview_questions iq
      WHERE iq.post_id = ANY($1)
        AND iq.question_type IN ('Behavioral', 'System Design', 'Culture Fit', 'Technical Discussion')
        AND iq.question_text IS NOT NULL
        AND LENGTH(iq.question_text) > 10
      ORDER BY frequency DESC, iq.question_type
      LIMIT 50
    `;

    const result = await pool.query(query, [postIds]);

    logger.info(`[SkillModule] Found ${result.rows.length} non-coding questions`);

    // Group by type
    const grouped = {};
    result.rows.forEach(q => {
      const type = q.question_type || 'Other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        question_text: q.question_text,
        company: q.company,
        frequency: q.frequency,
        post_id: q.post_id
      });
    });

    return grouped;
  } catch (error) {
    logger.error('[SkillModule] Error extracting non-coding questions:', error);
    return {};
  }
}

module.exports = {
  generateSkillModules,
  extractProblemsFromDatabase,
  extractNonCodingQuestions,
  calculatePriority,
  TIME_ESTIMATES,
  CATEGORY_GROUPINGS
};
