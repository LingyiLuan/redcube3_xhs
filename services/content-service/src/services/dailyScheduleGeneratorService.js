/**
 * Daily Schedule Generator Service
 *
 * Generates detailed, time-slotted daily schedules with:
 * - Specific time slots (9:00 AM, 9:10 AM, etc.)
 * - Activity types (Warmup, Learn, Guided, Solo, Mock, Reflect)
 * - Actual LeetCode problems with numbers
 * - Built-in breaks
 * - Configurable hours per day
 *
 * HYBRID LLM ENHANCEMENT:
 * - LLM generates rich educational content (why each problem matters, connections, tips)
 * - Content is cached in database for 30 days
 * - Subsequent requests load from cache instantly
 */

const logger = require('../utils/logger');
const crypto = require('crypto');
const { analyzeWithOpenRouter, extractJsonFromString } = require('./aiService');
const pool = require('../config/database');

// Activity type definitions with icons and typical durations
const ACTIVITY_TYPES = {
  WARMUP: { icon: '🧠', label: 'Warmup', defaultDuration: 10 },
  LEARN: { icon: '📖', label: 'Learn', defaultDuration: 25 },
  GUIDED: { icon: '💻', label: 'Guided', defaultDuration: 40 },
  SOLO: { icon: '💪', label: 'Solo', defaultDuration: 45 },
  MOCK: { icon: '🎯', label: 'Mock', defaultDuration: 60 },
  REFLECT: { icon: '✍️', label: 'Reflect', defaultDuration: 15 },
  BREAK: { icon: '☕', label: 'Break', defaultDuration: 5 },
  LUNCH: { icon: '🍽️', label: 'Lunch', defaultDuration: 60 },
  REVIEW: { icon: '📝', label: 'Review', defaultDuration: 20 },
  CONNECT: { icon: '💡', label: 'Connect', defaultDuration: 15 }
};

// Schedule templates based on available hours
const SCHEDULE_TEMPLATES = {
  // 4-hour compressed schedule
  compact: {
    totalMinutes: 240,
    structure: [
      { type: 'WARMUP', duration: 10 },
      { type: 'LEARN', duration: 20 },
      { type: 'BREAK', duration: 5 },
      { type: 'GUIDED', duration: 35 },
      { type: 'BREAK', duration: 5 },
      { type: 'SOLO', duration: 40 },
      { type: 'BREAK', duration: 10 },
      { type: 'SOLO', duration: 40 },
      { type: 'BREAK', duration: 5 },
      { type: 'REVIEW', duration: 15 },
      { type: 'REFLECT', duration: 15 }
    ]
  },
  // 6-hour standard schedule
  standard: {
    totalMinutes: 360,
    structure: [
      { type: 'WARMUP', duration: 10 },
      { type: 'LEARN', duration: 25 },
      { type: 'BREAK', duration: 5 },
      { type: 'GUIDED', duration: 40 },
      { type: 'BREAK', duration: 10 },
      { type: 'SOLO', duration: 45 },
      { type: 'LUNCH', duration: 45 },
      { type: 'LEARN', duration: 20 },
      { type: 'SOLO', duration: 45 },
      { type: 'BREAK', duration: 10 },
      { type: 'SOLO', duration: 45 },
      { type: 'BREAK', duration: 5 },
      { type: 'REVIEW', duration: 20 },
      { type: 'REFLECT', duration: 15 },
      { type: 'CONNECT', duration: 20 }
    ]
  },
  // 8-hour full day schedule
  full: {
    totalMinutes: 480,
    structure: [
      { type: 'WARMUP', duration: 10 },
      { type: 'LEARN', duration: 30 },
      { type: 'BREAK', duration: 5 },
      { type: 'GUIDED', duration: 45 },
      { type: 'BREAK', duration: 10 },
      { type: 'SOLO', duration: 50 },
      { type: 'BREAK', duration: 5 },
      { type: 'SOLO', duration: 45 },
      { type: 'LUNCH', duration: 60 },
      { type: 'LEARN', duration: 25 },
      { type: 'BREAK', duration: 5 },
      { type: 'SOLO', duration: 45 },
      { type: 'BREAK', duration: 10 },
      { type: 'MOCK', duration: 60 },
      { type: 'BREAK', duration: 10 },
      { type: 'REVIEW', duration: 25 },
      { type: 'REFLECT', duration: 20 },
      { type: 'CONNECT', duration: 20 }
    ]
  }
};

/**
 * Generate detailed daily schedule for a specific day
 *
 * @param {Object} params - Generation parameters
 * @param {number} params.weekNumber - Current week (1-12+)
 * @param {string} params.dayOfWeek - Day name (Monday, Tuesday, etc.)
 * @param {number} params.availableHours - Hours available (4, 6, or 8)
 * @param {Array} params.problems - Available problems for this day
 * @param {string} params.focusArea - Main topic for the day (e.g., "Dynamic Programming")
 * @param {Object} params.userGoals - User's goals and preferences
 * @param {string} params.startTime - Start time (default "09:00")
 * @returns {Object} Detailed daily schedule
 */
async function generateDetailedDailySchedule(params) {
  const {
    weekNumber = 1,
    dayOfWeek = 'Monday',
    availableHours = 6,
    problems = [],
    focusArea = 'General Practice',
    userGoals = {},
    startTime = '09:00'
  } = params;

  logger.info(`[DailySchedule] Generating schedule for Week ${weekNumber}, ${dayOfWeek} (${availableHours}h)`);

  // Select appropriate template based on hours
  const templateKey = availableHours <= 4 ? 'compact' : availableHours <= 6 ? 'standard' : 'full';
  const template = SCHEDULE_TEMPLATES[templateKey];

  // Determine if it's a rest day
  const isRestDay = dayOfWeek === 'Sunday';
  const isLightDay = dayOfWeek === 'Saturday';

  if (isRestDay) {
    return generateRestDaySchedule(weekNumber, dayOfWeek, focusArea);
  }

  // Get problems assigned for this day
  const dayProblems = selectProblemsForDay(problems, focusArea, weekNumber, isLightDay);

  // Generate schedule using LLM for dynamic content
  const schedule = await generateScheduleWithLLM({
    weekNumber,
    dayOfWeek,
    template,
    problems: dayProblems,
    focusArea,
    userGoals,
    startTime,
    isLightDay
  });

  return schedule;
}

/**
 * Generate rest day schedule
 */
function generateRestDaySchedule(weekNumber, dayOfWeek, focusArea) {
  return {
    weekNumber,
    dayOfWeek,
    date: null, // Will be set by frontend
    totalMinutes: 60,
    availableHours: 1,
    focusArea: 'Rest & Recovery',
    isRestDay: true,
    slots: [
      {
        time: '10:00',
        duration: 15,
        type: 'REVIEW',
        typeIcon: '📝',
        typeLabel: 'Review',
        activity: 'Week review',
        details: `Briefly review key concepts from Week ${weekNumber}`,
        problem: null
      },
      {
        time: '10:15',
        duration: 30,
        type: 'REFLECT',
        typeIcon: '✍️',
        typeLabel: 'Reflect',
        activity: 'Journal & plan',
        details: 'Write about challenges faced, wins achieved, and goals for next week',
        problem: null
      },
      {
        time: '10:45',
        duration: 15,
        type: 'CONNECT',
        typeIcon: '💡',
        typeLabel: 'Connect',
        activity: 'Community check-in',
        details: 'Read 1-2 success stories on r/cscareerquestions for motivation',
        problem: null
      }
    ],
    summary: {
      problemsSolved: 0,
      learnTime: 0,
      practiceTime: 0,
      breakTime: 0
    }
  };
}

/**
 * Select problems appropriate for the day
 */
function selectProblemsForDay(allProblems, focusArea, weekNumber, isLightDay) {
  if (!allProblems || allProblems.length === 0) {
    return getDefaultProblems(focusArea, weekNumber);
  }

  // Filter problems by focus area if applicable
  let relevantProblems = allProblems.filter(p =>
    p.category?.toLowerCase().includes(focusArea.toLowerCase()) ||
    p.module?.toLowerCase().includes(focusArea.toLowerCase())
  );

  // If no matches, use all problems
  if (relevantProblems.length === 0) {
    relevantProblems = allProblems;
  }

  // Adjust difficulty based on week number
  const difficultyWeight = weekNumber <= 3 ? 'Easy' : weekNumber <= 8 ? 'Medium' : 'Hard';

  // Sort by priority and difficulty
  relevantProblems.sort((a, b) => {
    const aDiff = a.difficulty === difficultyWeight ? 0 : 1;
    const bDiff = b.difficulty === difficultyWeight ? 0 : 1;
    return aDiff - bDiff || (b.priority || 0) - (a.priority || 0);
  });

  // Select number of problems based on day type
  const count = isLightDay ? 2 : 4;
  return relevantProblems.slice(0, count);
}

/**
 * Get default problems - first try database, then use curated fallback
 * This ensures we use real problems from posts when available
 */
async function getDefaultProblems(focusArea, weekNumber) {
  try {
    // Try to get problems from database first
    const dbProblems = await getProblemsFromDatabase(focusArea);
    if (dbProblems && dbProblems.length >= 4) {
      logger.info(`[DailySchedule] Using ${dbProblems.length} problems from database for ${focusArea}`);
      return dbProblems.slice(0, 8);
    }
  } catch (error) {
    logger.warn(`[DailySchedule] Database query failed, using fallback: ${error.message}`);
  }

  // Fallback to curated defaults (used when no database data available)
  logger.info(`[DailySchedule] Using curated fallback problems for ${focusArea}`);
  return getCuratedFallbackProblems(focusArea);
}

/**
 * Query database for real problems mentioned in posts
 * Uses leetcode_questions table (the actual production table name)
 * topic_tags is a JSONB array like ["Array", "Hash Table"]
 */
async function getProblemsFromDatabase(focusArea) {
  const query = `
    SELECT
      lq.title as name,
      lq.frontend_id as number,
      lq.difficulty,
      lq.difficulty_numeric
    FROM leetcode_questions lq
    WHERE lq.title IS NOT NULL
      AND lq.frontend_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(lq.topic_tags, '[]'::jsonb)) AS tag
          WHERE tag ILIKE $1 OR tag ILIKE '%' || $1 || '%'
        )
        OR $1 = 'default'
      )
    ORDER BY lq.difficulty_numeric ASC, lq.frontend_id ASC
    LIMIT 12
  `;

  const focusParam = focusArea === 'default' ? '%' : focusArea;
  const result = await pool.query(query, [focusParam]);

  return result.rows.map(row => ({
    name: row.name,
    number: parseInt(row.number),
    difficulty: row.difficulty || 'Medium'
  }));
}

/**
 * Curated fallback problems - only used when database has no data
 * These are classic LeetCode problems as last resort
 */
function getCuratedFallbackProblems(focusArea) {
  const curatedProblems = {
    'Arrays': [
      { name: 'Two Sum', number: 1, difficulty: 'Easy' },
      { name: 'Best Time to Buy and Sell Stock', number: 121, difficulty: 'Easy' },
      { name: 'Product of Array Except Self', number: 238, difficulty: 'Medium' },
      { name: 'Maximum Subarray', number: 53, difficulty: 'Medium' }
    ],
    'Dynamic Programming': [
      { name: 'Climbing Stairs', number: 70, difficulty: 'Easy' },
      { name: 'House Robber', number: 198, difficulty: 'Medium' },
      { name: 'Unique Paths', number: 62, difficulty: 'Medium' },
      { name: 'Coin Change', number: 322, difficulty: 'Medium' }
    ],
    'Trees': [
      { name: 'Maximum Depth of Binary Tree', number: 104, difficulty: 'Easy' },
      { name: 'Invert Binary Tree', number: 226, difficulty: 'Easy' },
      { name: 'Binary Tree Level Order Traversal', number: 102, difficulty: 'Medium' },
      { name: 'Validate Binary Search Tree', number: 98, difficulty: 'Medium' }
    ],
    'Graphs': [
      { name: 'Number of Islands', number: 200, difficulty: 'Medium' },
      { name: 'Clone Graph', number: 133, difficulty: 'Medium' },
      { name: 'Course Schedule', number: 207, difficulty: 'Medium' },
      { name: 'Pacific Atlantic Water Flow', number: 417, difficulty: 'Medium' }
    ],
    'Strings': [
      { name: 'Valid Anagram', number: 242, difficulty: 'Easy' },
      { name: 'Longest Substring Without Repeating Characters', number: 3, difficulty: 'Medium' },
      { name: 'Group Anagrams', number: 49, difficulty: 'Medium' },
      { name: 'Longest Palindromic Substring', number: 5, difficulty: 'Medium' }
    ],
    'default': [
      { name: 'Two Sum', number: 1, difficulty: 'Easy' },
      { name: 'Valid Parentheses', number: 20, difficulty: 'Easy' },
      { name: 'Merge Two Sorted Lists', number: 21, difficulty: 'Easy' },
      { name: 'Best Time to Buy and Sell Stock', number: 121, difficulty: 'Easy' }
    ]
  };

  return curatedProblems[focusArea] || curatedProblems['default'];
}

/**
 * Generate schedule content using LLM
 */
async function generateScheduleWithLLM(params) {
  const { weekNumber, dayOfWeek, template, problems, focusArea, userGoals, startTime, isLightDay } = params;

  // Build time slots from template
  let currentTime = parseTime(startTime);
  const slots = [];
  let problemIndex = 0;

  for (const item of template.structure) {
    const activityType = ACTIVITY_TYPES[item.type];
    const timeString = formatTime(currentTime);

    let activity = '';
    let details = '';
    let problem = null;

    switch (item.type) {
      case 'WARMUP':
        activity = 'Morning setup';
        details = 'Coffee, review today\'s goals, quick mental prep';
        break;

      case 'LEARN':
        activity = `Concept: ${focusArea}`;
        details = await generateLearnDetails(focusArea, weekNumber);
        break;

      case 'GUIDED':
        if (problems[problemIndex]) {
          problem = problems[problemIndex];
          // Check if this is an interview question (source_type) or LeetCode problem
          if (problem.source_type === 'interview_question') {
            activity = `"${problem.name}"`;
            details = problem.company
              ? `Interview question from ${problem.company} - Follow along with solution approach`
              : 'Interview question - Follow along with solution approach';
          } else {
            activity = `"${problem.name}" (LC #${problem.number})`;
            details = 'Follow along with solution explanation, understand each step';
          }
          problemIndex++;
        } else {
          activity = `Guided practice: ${focusArea}`;
          details = 'Follow tutorial on core concepts';
        }
        break;

      case 'SOLO':
        if (problems[problemIndex]) {
          problem = problems[problemIndex];
          // Check if this is an interview question or LeetCode problem
          if (problem.source_type === 'interview_question') {
            activity = `"${problem.name}"`;
            details = problem.company
              ? `Interview question from ${problem.company} (${problem.difficulty}). Solve independently!`
              : `Interview question (${problem.difficulty}). Solve independently!`;
          } else {
            activity = `"${problem.name}" (LC #${problem.number})`;
            details = `Solve independently (${problem.difficulty}). Time yourself!`;
          }
          problemIndex++;
        } else {
          activity = `Solo practice: ${focusArea}`;
          details = 'Work through problems independently';
        }
        break;

      case 'MOCK':
        activity = 'Mock interview';
        details = `Simulate real interview: ${focusArea} focus. 45min coding + 15min behavioral`;
        break;

      case 'REVIEW':
        activity = 'Solution review';
        details = 'Review today\'s solutions, note patterns and optimizations';
        break;

      case 'REFLECT':
        activity = 'Daily reflection';
        details = 'What worked? What was challenging? Update study notes';
        break;

      case 'CONNECT':
        activity = 'Real-world connection';
        details = userGoals?.targetCompany
          ? `Research how ${userGoals.targetCompany} uses ${focusArea} in their tech stack`
          : `Read 1 article on ${focusArea} in production systems`;
        break;

      case 'BREAK':
        activity = item.duration >= 10 ? 'Break' : 'Micro-break';
        details = item.duration >= 10 ? 'Walk, stretch, hydrate' : 'Stand, stretch';
        break;

      case 'LUNCH':
        activity = 'Lunch break';
        details = 'Step away from screen, proper meal, mental reset';
        break;
    }

    slots.push({
      time: timeString,
      duration: item.duration,
      type: item.type,
      typeIcon: activityType.icon,
      typeLabel: activityType.label,
      activity,
      details,
      problem: problem ? {
        name: problem.name,
        number: problem.number,
        difficulty: problem.difficulty,
        source_type: problem.source_type || 'leetcode',
        company: problem.company || null,
        url: problem.source_type === 'interview_question'
          ? null // No URL for interview questions
          : `https://leetcode.com/problems/${problem.name.toLowerCase().replace(/\s+/g, '-')}/`
      } : null
    });

    currentTime += item.duration;
  }

  // Calculate summary
  const summary = calculateScheduleSummary(slots);

  return {
    weekNumber,
    dayOfWeek,
    date: null,
    totalMinutes: template.totalMinutes,
    availableHours: Math.round(template.totalMinutes / 60),
    focusArea,
    isRestDay: false,
    isLightDay,
    slots,
    summary
  };
}

/**
 * Generate learning details based on focus area
 * Tries to get real topics from database first, then uses curated fallback
 */
async function generateLearnDetails(focusArea, weekNumber) {
  try {
    // Try to get real topics from database
    const dbTopics = await getTopicsFromDatabase(focusArea);
    if (dbTopics && dbTopics.length > 0) {
      const topicIndex = (weekNumber - 1) % dbTopics.length;
      return `Study: ${dbTopics[topicIndex]}. Based on real interview experiences.`;
    }
  } catch (error) {
    logger.warn(`[DailySchedule] Failed to get topics from database: ${error.message}`);
  }

  // Fallback to curated topics (only when database has no data)
  const curatedTopics = {
    'Arrays': ['Array traversal patterns', 'Two-pointer technique', 'Sliding window basics', 'Prefix sums'],
    'Dynamic Programming': ['State transitions', 'Memoization vs tabulation', 'Common DP patterns', '1D vs 2D DP'],
    'Trees': ['Tree traversals (BFS/DFS)', 'Recursion patterns', 'Tree properties', 'BST operations'],
    'Graphs': ['Graph representations', 'BFS/DFS on graphs', 'Cycle detection', 'Topological sort'],
    'Strings': ['String manipulation', 'Pattern matching', 'Anagram techniques', 'Substring problems'],
    'Linked Lists': ['Pointer manipulation', 'Fast/slow pointers', 'Reversal techniques', 'Merge operations'],
    'default': ['Core concepts review', 'Pattern recognition', 'Time complexity analysis', 'Edge cases']
  };

  const topics = curatedTopics[focusArea] || curatedTopics['default'];
  const topicIndex = (weekNumber - 1) % topics.length;
  return `Study: ${topics[topicIndex]}. Take notes on key patterns.`;
}

/**
 * Query database for real topics mentioned in successful interviews
 */
async function getTopicsFromDatabase(focusArea) {
  const query = `
    SELECT DISTINCT
      iq.llm_category as topic,
      COUNT(*) as mention_count
    FROM interview_questions iq
    JOIN scraped_posts sp ON sp.post_id = iq.post_id
    WHERE iq.llm_category IS NOT NULL
      AND (
        iq.llm_category ILIKE $1
        OR iq.llm_category ILIKE '%' || $1 || '%'
        OR $1 = 'default'
      )
      AND (sp.llm_outcome ILIKE '%pass%' OR sp.llm_outcome ILIKE '%offer%' OR sp.llm_outcome IS NULL)
    GROUP BY iq.llm_category
    ORDER BY mention_count DESC
    LIMIT 8
  `;

  const focusParam = focusArea === 'default' ? '%' : focusArea;
  const result = await pool.query(query, [focusParam]);

  return result.rows.map(row => row.topic);
}

/**
 * Calculate schedule summary statistics
 */
function calculateScheduleSummary(slots) {
  let problemsSolved = 0;
  let learnTime = 0;
  let practiceTime = 0;
  let breakTime = 0;

  slots.forEach(slot => {
    if (slot.problem) problemsSolved++;

    switch (slot.type) {
      case 'LEARN':
        learnTime += slot.duration;
        break;
      case 'GUIDED':
      case 'SOLO':
      case 'MOCK':
        practiceTime += slot.duration;
        break;
      case 'BREAK':
      case 'LUNCH':
        breakTime += slot.duration;
        break;
    }
  });

  return {
    problemsSolved,
    learnTime,
    practiceTime,
    breakTime
  };
}

/**
 * Parse time string to minutes from midnight
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight to time string
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Generate detailed daily schedules for an entire week
 *
 * @param {Object} params - Week parameters
 * @param {number} params.weekNumber - Week number (1-12+)
 * @param {number} params.availableHours - Hours per day (4, 6, or 8)
 * @param {Array} params.problems - All available problems for the week
 * @param {string} params.focusArea - Main focus for the week
 * @param {Object} params.userGoals - User preferences
 * @returns {Object} Week schedule with daily breakdowns
 */
async function generateWeeklyDetailedSchedule(params) {
  const {
    weekNumber = 1,
    availableHours = 6,
    problems = [],
    focusArea = 'General Practice',
    userGoals = {}
  } = params;

  logger.info(`[DailySchedule] Generating Week ${weekNumber} detailed schedule`);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailySchedules = [];

  // Distribute problems across weekdays
  const problemsPerDay = Math.ceil(problems.length / 5); // 5 main practice days

  for (let i = 0; i < days.length; i++) {
    const dayOfWeek = days[i];
    const dayProblems = problems.slice(i * problemsPerDay, (i + 1) * problemsPerDay);

    const schedule = await generateDetailedDailySchedule({
      weekNumber,
      dayOfWeek,
      availableHours: dayOfWeek === 'Saturday' ? Math.min(availableHours, 4) :
                      dayOfWeek === 'Sunday' ? 1 : availableHours,
      problems: dayProblems,
      focusArea,
      userGoals,
      startTime: '09:00'
    });

    dailySchedules.push(schedule);
  }

  // Calculate week totals
  const weekSummary = {
    totalProblems: dailySchedules.reduce((sum, d) => sum + d.summary.problemsSolved, 0),
    totalLearnTime: dailySchedules.reduce((sum, d) => sum + d.summary.learnTime, 0),
    totalPracticeTime: dailySchedules.reduce((sum, d) => sum + d.summary.practiceTime, 0),
    totalBreakTime: dailySchedules.reduce((sum, d) => sum + d.summary.breakTime, 0),
    totalHours: dailySchedules.reduce((sum, d) => sum + d.availableHours, 0)
  };

  return {
    weekNumber,
    focusArea,
    availableHoursPerDay: availableHours,
    dailySchedules,
    summary: weekSummary
  };
}

// ============================================================================
// LLM ENHANCEMENT WITH CACHING (Hybrid Approach)
// ============================================================================

/**
 * Generate cache key for LLM-enhanced content
 * Key is based on focus area, week number, and problem numbers
 */
function generateCacheKey(focusArea, weekNumber, problems) {
  const problemNumbers = (problems || [])
    .map(p => p.number)
    .filter(Boolean)
    .sort((a, b) => a - b)
    .join(',');

  const keyData = `${focusArea.toLowerCase()}_week${weekNumber}_probs${problemNumbers}`;
  return crypto.createHash('md5').update(keyData).digest('hex');
}

/**
 * Check cache for existing LLM-enhanced content
 */
async function getCachedEnhancement(cacheKey) {
  try {
    const result = await pool.query(`
      SELECT
        enhanced_slots,
        problem_insights,
        learning_objectives,
        pattern_connections,
        personalized_tips,
        expires_at
      FROM daily_schedule_llm_cache
      WHERE cache_key = $1
        AND expires_at > NOW()
    `, [cacheKey]);

    if (result.rows.length > 0) {
      // Update access stats
      await pool.query(`
        UPDATE daily_schedule_llm_cache
        SET last_accessed_at = NOW(), access_count = access_count + 1
        WHERE cache_key = $1
      `, [cacheKey]);

      logger.info(`[DailySchedule] Cache HIT for key ${cacheKey.substring(0, 8)}...`);
      return result.rows[0];
    }

    logger.info(`[DailySchedule] Cache MISS for key ${cacheKey.substring(0, 8)}...`);
    return null;
  } catch (error) {
    logger.warn(`[DailySchedule] Cache lookup failed: ${error.message}`);
    return null;
  }
}

/**
 * Store LLM-enhanced content in cache
 */
async function cacheEnhancement(cacheKey, focusArea, weekNumber, problems, enhancement, metadata = {}) {
  try {
    const problemNumbers = (problems || []).map(p => p.number).filter(Boolean);

    await pool.query(`
      INSERT INTO daily_schedule_llm_cache (
        cache_key, focus_area, week_number, problem_numbers,
        enhanced_slots, problem_insights, learning_objectives,
        pattern_connections, personalized_tips,
        model_used, tokens_used, generation_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (cache_key) DO UPDATE SET
        enhanced_slots = EXCLUDED.enhanced_slots,
        problem_insights = EXCLUDED.problem_insights,
        learning_objectives = EXCLUDED.learning_objectives,
        pattern_connections = EXCLUDED.pattern_connections,
        personalized_tips = EXCLUDED.personalized_tips,
        expires_at = NOW() + INTERVAL '30 days',
        last_accessed_at = NOW()
    `, [
      cacheKey,
      focusArea,
      weekNumber,
      problemNumbers,
      JSON.stringify(enhancement.enhanced_slots || []),
      JSON.stringify(enhancement.problem_insights || {}),
      JSON.stringify(enhancement.learning_objectives || []),
      JSON.stringify(enhancement.pattern_connections || []),
      JSON.stringify(enhancement.personalized_tips || []),
      metadata.model || 'openrouter',
      metadata.tokens || 0,
      metadata.generation_time_ms || 0
    ]);

    logger.info(`[DailySchedule] Cached LLM enhancement for key ${cacheKey.substring(0, 8)}...`);
    return true;
  } catch (error) {
    logger.warn(`[DailySchedule] Cache store failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate LLM-enhanced educational content for daily schedules
 * This adds the "why" behind each problem and activity
 */
async function generateLLMEnhancement(focusArea, weekNumber, problems, slots) {
  const startTime = Date.now();

  // Build problem context for LLM
  const problemContext = problems.map(p => ({
    name: p.name,
    number: p.number,
    difficulty: p.difficulty
  }));

  // Build slot context
  const slotContext = slots.filter(s => s.problem).map(s => ({
    time: s.time,
    type: s.type,
    problem: s.problem?.name,
    number: s.problem?.number
  }));

  const prompt = `You are an expert coding interview coach. Generate educational insights for a ${focusArea} study day in Week ${weekNumber}.

PROBLEMS FOR TODAY:
${JSON.stringify(problemContext, null, 2)}

SCHEDULE SLOTS WITH PROBLEMS:
${JSON.stringify(slotContext, null, 2)}

Generate educational content that explains:
1. WHY each problem matters for interviews
2. What patterns/concepts each problem teaches
3. How problems connect to each other
4. Personalized tips for Week ${weekNumber} learners

Return JSON with this structure:
{
  "problem_insights": {
    "1": {
      "why_it_matters": "Two Sum is the most asked interview question. It teaches the hash map lookup pattern used in 80% of array problems.",
      "patterns_taught": ["Hash Map Lookup", "Complement Technique", "O(n) Optimization"],
      "common_mistakes": ["Forgetting to handle duplicate values", "Using nested loops (O(n²))"],
      "related_problems": [15, 167, 560]
    }
  },
  "learning_objectives": [
    "Master the hash map complement pattern",
    "Understand time-space tradeoffs",
    "Practice explaining solutions out loud"
  ],
  "pattern_connections": [
    {
      "pattern": "Hash Map for O(1) Lookup",
      "problems": [1, 217, 242],
      "explanation": "These problems all use hash maps to reduce nested loop searches from O(n²) to O(n)"
    }
  ],
  "personalized_tips": [
    {
      "tip": "Week ${weekNumber} focus: Don't rush to code. Spend 5 minutes understanding the problem first.",
      "reason": "At this stage, building the habit of problem analysis is more valuable than speed"
    },
    {
      "tip": "After solving, explain your solution out loud as if in an interview",
      "reason": "Communication is 40% of the interview score at top companies"
    }
  ],
  "enhanced_slots": [
    {
      "original_activity": "Two Sum (LC #1)",
      "enhanced_details": "Start with brute force O(n²), then optimize using hash map. Key insight: instead of searching for target-num, store what we've seen.",
      "before_you_start": "Ask yourself: What's being repeated in the brute force? (The inner loop search)",
      "success_criteria": "You can solve this in under 10 minutes and explain the optimization clearly"
    }
  ]
}

Focus on being helpful and educational, not just descriptive.
CRITICAL: Return ONLY valid JSON, no explanation.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, { max_tokens: 3000, temperature: 0.7 });
    const enhancement = extractJsonFromString(response);

    if (!enhancement || typeof enhancement !== 'object') {
      logger.warn('[DailySchedule] LLM returned invalid enhancement, using fallback');
      return generateFallbackEnhancement(focusArea, weekNumber, problems);
    }

    const generationTime = Date.now() - startTime;
    logger.info(`[DailySchedule] LLM enhancement generated in ${generationTime}ms`);

    return {
      ...enhancement,
      _metadata: {
        generated_at: new Date().toISOString(),
        generation_time_ms: generationTime,
        model: 'openrouter'
      }
    };
  } catch (error) {
    logger.error(`[DailySchedule] LLM enhancement failed: ${error.message}`);
    return generateFallbackEnhancement(focusArea, weekNumber, problems);
  }
}

/**
 * Generate fallback enhancement when LLM fails
 */
function generateFallbackEnhancement(focusArea, weekNumber, problems) {
  const problemInsights = {};

  problems.forEach(p => {
    if (p.number) {
      problemInsights[p.number] = {
        why_it_matters: `${p.name} is a classic ${focusArea} problem that teaches fundamental patterns.`,
        patterns_taught: [focusArea, 'Problem Solving', 'Time Complexity Analysis'],
        common_mistakes: ['Not considering edge cases', 'Suboptimal time complexity'],
        related_problems: []
      };
    }
  });

  return {
    problem_insights: problemInsights,
    learning_objectives: [
      `Master ${focusArea} fundamentals`,
      'Practice explaining your thought process',
      'Focus on understanding patterns, not just solutions'
    ],
    pattern_connections: [{
      pattern: focusArea,
      problems: problems.map(p => p.number).filter(Boolean),
      explanation: `These problems help you master ${focusArea} techniques used in technical interviews.`
    }],
    personalized_tips: [
      {
        tip: weekNumber <= 4
          ? 'Focus on understanding, not speed. Take time to truly grasp each concept.'
          : 'Start timing yourself. Aim to solve Easy problems in 15 minutes, Medium in 25.',
        reason: weekNumber <= 4
          ? 'Building strong foundations early pays dividends later'
          : 'Interview time management becomes critical at this stage'
      }
    ],
    enhanced_slots: []
  };
}

/**
 * Enhance a daily schedule with LLM-generated educational content
 * Uses cache-first approach: check cache, generate if miss, store for future
 *
 * @param {Object} schedule - Basic daily schedule from generateScheduleWithLLM
 * @param {Array} problems - Problems assigned for this day
 * @param {boolean} skipLLM - If true, skip LLM generation (for testing)
 * @returns {Object} Enhanced schedule with educational content
 */
async function enhanceScheduleWithLLM(schedule, problems, skipLLM = false) {
  const { focusArea, weekNumber, slots } = schedule;

  logger.info(`[DailySchedule] 🔍 enhanceScheduleWithLLM called:`, {
    focusArea,
    weekNumber,
    problemCount: problems?.length || 0,
    slotCount: slots?.length || 0,
    skipLLM
  });

  // Generate cache key
  const cacheKey = generateCacheKey(focusArea, weekNumber, problems);
  logger.info(`[DailySchedule] 🔑 Cache key: ${cacheKey}`);

  // Check cache first
  const cached = await getCachedEnhancement(cacheKey);

  if (cached) {
    logger.info(`[DailySchedule] ✅ CACHE HIT! Applying cached enhancement`);
    logger.info(`[DailySchedule] 📦 Cached data has:`, {
      learning_objectives: cached.learning_objectives?.length || 0,
      problem_insights: Object.keys(cached.problem_insights || {}).length,
      enhanced_slots: cached.enhanced_slots?.length || 0
    });
    // Apply cached enhancement to schedule
    const enhanced = applyEnhancementToSchedule(schedule, cached);
    logger.info(`[DailySchedule] 📊 After applying cache, slots with enhanced_details:`,
      enhanced.slots?.filter(s => s.enhanced_details !== s.details).length || 0);
    return enhanced;
  }

  logger.info(`[DailySchedule] ❌ CACHE MISS for key: ${cacheKey}`);

  // Skip LLM if requested (for testing or rate limiting)
  if (skipLLM) {
    logger.info(`[DailySchedule] Skipping LLM enhancement as requested`);
    return schedule;
  }

  logger.info(`[DailySchedule] 🤖 Generating new LLM enhancement...`);
  // Generate new enhancement via LLM
  const enhancement = await generateLLMEnhancement(focusArea, weekNumber, problems, slots);
  logger.info(`[DailySchedule] 🎯 LLM enhancement generated:`, {
    hasLearningObjectives: !!enhancement.learning_objectives,
    hasProblemInsights: !!enhancement.problem_insights,
    hasEnhancedSlots: !!enhancement.enhanced_slots
  });

  // Cache the enhancement for future use
  await cacheEnhancement(cacheKey, focusArea, weekNumber, problems, enhancement, enhancement._metadata);
  logger.info(`[DailySchedule] 💾 Enhancement cached`);

  // Apply enhancement to schedule
  const result = applyEnhancementToSchedule(schedule, enhancement);
  logger.info(`[DailySchedule] ✨ Enhancement applied, llm_enhanced flag:`, result.llm_enhanced);
  return result;
}

/**
 * Apply LLM enhancement to a schedule
 */
function applyEnhancementToSchedule(schedule, enhancement) {
  // Deep clone schedule to avoid mutations
  const enhanced = JSON.parse(JSON.stringify(schedule));

  // Add learning objectives for the day
  enhanced.learning_objectives = enhancement.learning_objectives || [];

  // Add pattern connections
  enhanced.pattern_connections = enhancement.pattern_connections || [];

  // Add personalized tips
  enhanced.personalized_tips = enhancement.personalized_tips || [];

  // Enhance slots with problem-specific insights
  const problemInsights = enhancement.problem_insights || {};
  const enhancedSlotData = enhancement.enhanced_slots || [];

  enhanced.slots = enhanced.slots.map(slot => {
    if (!slot.problem) return slot;

    const insight = problemInsights[slot.problem.number];
    const slotEnhancement = enhancedSlotData.find(
      e => e.original_activity?.includes(slot.problem.name)
    );

    return {
      ...slot,
      // Add "why this matters" insight
      why_it_matters: insight?.why_it_matters || null,
      // Add patterns taught
      patterns_taught: insight?.patterns_taught || [],
      // Add common mistakes to avoid
      common_mistakes: insight?.common_mistakes || [],
      // Add related problems
      related_problems: insight?.related_problems || [],
      // Enhanced details from LLM
      enhanced_details: slotEnhancement?.enhanced_details || slot.details,
      // Before you start hint
      before_you_start: slotEnhancement?.before_you_start || null,
      // Success criteria
      success_criteria: slotEnhancement?.success_criteria || null
    };
  });

  // Add metadata flag
  enhanced.llm_enhanced = true;
  enhanced.enhancement_source = enhancement.expires_at ? 'cache' : 'generated';

  return enhanced;
}

/**
 * Clear expired cache entries (call periodically)
 */
async function cleanupExpiredCache() {
  try {
    const result = await pool.query(`
      DELETE FROM daily_schedule_llm_cache
      WHERE expires_at < NOW()
      RETURNING cache_key
    `);

    if (result.rowCount > 0) {
      logger.info(`[DailySchedule] Cleaned up ${result.rowCount} expired cache entries`);
    }

    return result.rowCount;
  } catch (error) {
    logger.warn(`[DailySchedule] Cache cleanup failed: ${error.message}`);
    return 0;
  }
}

module.exports = {
  generateDetailedDailySchedule,
  generateWeeklyDetailedSchedule,
  enhanceScheduleWithLLM,
  cleanupExpiredCache,
  ACTIVITY_TYPES,
  SCHEDULE_TEMPLATES
};
