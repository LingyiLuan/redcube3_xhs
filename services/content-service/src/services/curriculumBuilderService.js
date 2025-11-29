/**
 * Curriculum Builder Service
 *
 * Builds personalized 12-week LeetCode curricula based on:
 * - Target company (Google, Meta, Amazon, etc.)
 * - Target role and level
 * - User's current skill gaps
 * - Pedagogical best practices (Easy → Medium → Hard progression)
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');
const {
  getProblemsByDifficulty,
  getProblemsByCategory,
  getAllCategories
} = require('./problemMatchingService');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

/**
 * Topic Sequencing for 12-Week Curriculum
 * Follows pedagogical best practices: fundamentals first, then advanced topics
 */
const TOPIC_SEQUENCE = [
  { week: 1, topics: ['Arrays & Hashing'], difficulty: ['Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Medium'] },
  { week: 2, topics: ['Two Pointers', 'Sliding Window'], difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'] },
  { week: 3, topics: ['Linked List'], difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'] },
  { week: 4, topics: ['Trees'], difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard'] },
  { week: 5, topics: ['Trees'], difficulty: ['Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Hard'] },
  { week: 6, topics: ['Graph'], difficulty: ['Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'] },
  { week: 7, topics: ['Dynamic Programming'], difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard'] },
  { week: 8, topics: ['Dynamic Programming'], difficulty: ['Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Hard'] },
  { week: 9, topics: ['Heap', 'Intervals'], difficulty: ['Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'] },
  { week: 10, topics: ['Bit Manipulation', 'Arrays & Hashing'], difficulty: ['Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard'] },
  { week: 11, topics: ['Graph', 'Trees', 'Dynamic Programming'], difficulty: ['Medium', 'Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Hard', 'Hard'] },
  { week: 12, topics: ['Arrays & Hashing', 'Trees', 'Dynamic Programming', 'Graph'], difficulty: ['Medium', 'Medium', 'Medium', 'Hard', 'Hard', 'Hard', 'Hard', 'Hard'] }
];

/**
 * Company-specific problem prioritization
 * Based on company_frequency data in curated_problems table
 */
const COMPANY_PRIORITIES = {
  'Google': ['Graph', 'Trees', 'Dynamic Programming', 'Arrays & Hashing'],
  'Meta': ['Trees', 'Graph', 'Arrays & Hashing', 'Dynamic Programming'],
  'Amazon': ['Arrays & Hashing', 'Trees', 'Graph', 'Dynamic Programming'],
  'Microsoft': ['Trees', 'Arrays & Hashing', 'Dynamic Programming', 'Graph'],
  'Apple': ['Arrays & Hashing', 'Trees', 'Linked List', 'Dynamic Programming'],
  'default': ['Arrays & Hashing', 'Trees', 'Graph', 'Dynamic Programming']
};

/**
 * Build 12-week curriculum
 */
async function buildCurriculum(userGoals = {}, skillGaps = []) {
  const {
    targetCompany = 'Google',
    targetLevel = 'L4',
    timelineWeeks = 12
  } = userGoals;

  logger.info(`[CurriculumBuilder] Building ${timelineWeeks}-week curriculum for ${targetCompany} (${targetLevel})`);

  const curriculum = [];

  for (let weekNum = 1; weekNum <= timelineWeeks; weekNum++) {
    const weekPlan = await buildWeekPlan(weekNum, targetCompany, skillGaps);
    curriculum.push(weekPlan);
  }

  return {
    total_weeks: timelineWeeks,
    target_company: targetCompany,
    target_level: targetLevel,
    weekly_plan: curriculum,
    metadata: {
      total_problems: curriculum.reduce((sum, week) => sum + week.problems.length, 0),
      difficulty_distribution: calculateDifficultyDistribution(curriculum),
      category_coverage: calculateCategoryCoverage(curriculum)
    }
  };
}

/**
 * Build plan for a single week
 */
async function buildWeekPlan(weekNum, targetCompany, skillGaps = []) {
  const weekTemplate = TOPIC_SEQUENCE[weekNum - 1] || TOPIC_SEQUENCE[TOPIC_SEQUENCE.length - 1];

  const { topics, difficulty } = weekTemplate;

  logger.info(`[Week ${weekNum}] Topics: ${topics.join(', ')}`);

  // Select problems based on topic and difficulty distribution
  const problems = [];
  const selectedProblemIds = new Set();

  for (let i = 0; i < difficulty.length; i++) {
    const targetDifficulty = difficulty[i];
    const topicIndex = i % topics.length;
    const topic = topics[topicIndex];

    // Try to get a problem that hasn't been selected yet
    const candidateProblems = await getProblemsByDifficulty(targetDifficulty, topic, 10);
    logger.info(`[Week ${weekNum}] Got ${candidateProblems.length} candidates for ${targetDifficulty} ${topic}`);

    // Filter out already selected problems
    const availableProblems = candidateProblems.filter(p => !selectedProblemIds.has(p.id));

    if (availableProblems.length > 0) {
      const selected = availableProblems[0];
      problems.push({
        name: selected.problem_name,
        leetcode_number: selected.leetcode_number,
        difficulty: selected.difficulty,
        category: selected.category,
        url: selected.url,
        estimated_time_minutes: selected.estimated_time_minutes || 30,
        topics: selected.topics || []
      });
      selectedProblemIds.add(selected.id);
      logger.info(`[Week ${weekNum}] Selected: LC #${selected.leetcode_number} - ${selected.problem_name}`);
    } else {
      logger.warn(`[Week ${weekNum}] No available problems for ${targetDifficulty} ${topic}`);
    }
  }

  logger.info(`[Week ${weekNum}] Total problems selected: ${problems.length}`);

  // Generate week objective and description
  const objective = generateWeekObjective(weekNum, topics, targetCompany);
  const description = generateWeekDescription(weekNum, topics, problems);

  return {
    week: weekNum,
    objective,
    description,
    topics,
    problems,
    daily_breakdown: generateDailyBreakdown(problems, topics),
    success_criteria: generateSuccessCriteria(weekNum, problems)
  };
}

/**
 * Generate week objective
 */
function generateWeekObjective(weekNum, topics, targetCompany) {
  const topicList = topics.join(' & ');

  if (weekNum === 1) {
    return `Master fundamental ${topicList} patterns and build strong coding foundations for ${targetCompany} interviews.`;
  } else if (weekNum <= 4) {
    return `Develop proficiency in ${topicList} problems with increasing complexity.`;
  } else if (weekNum <= 8) {
    return `Tackle advanced ${topicList} problems and optimize time/space complexity.`;
  } else {
    return `Synthesize multiple concepts and solve ${targetCompany}-style ${topicList} challenges.`;
  }
}

/**
 * Generate week description
 */
function generateWeekDescription(weekNum, topics, problems) {
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  return `This week focuses on ${topics.join(', ')} with ${easyCount} Easy, ${mediumCount} Medium, and ${hardCount} Hard problems. You'll practice core patterns and build problem-solving intuition.`;
}

/**
 * Generate daily breakdown
 */
function generateDailyBreakdown(problems, topics) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyPlan = [];

  // Distribute problems across 7 days (typically 8-12 problems per week)
  const problemsPerDay = Math.ceil(problems.length / 5); // Spread across 5 days (Mon-Fri)

  for (let i = 0; i < 7; i++) {
    const dayName = days[i];
    const startIdx = i * problemsPerDay;
    const endIdx = Math.min(startIdx + problemsPerDay, problems.length);
    const dayProblems = problems.slice(startIdx, endIdx);

    if (i < 5 && dayProblems.length > 0) {
      // Weekdays: Theory + Practice
      dailyPlan.push({
        day: dayName,
        focus: 'Theory & Practice',
        morning_session: {
          activity: 'Review concepts',
          topics: topics,
          duration_minutes: 60,
          resources: generateResourceLinks(topics)
        },
        afternoon_session: {
          activity: 'Solve problems',
          problems: dayProblems.map(p => ({
            title: `${p.name} (${p.difficulty})`,
            name: p.name,
            leetcode_number: p.leetcode_number,
            difficulty: p.difficulty,
            url: p.url,
            estimated_time: p.estimated_time_minutes
          })),
          duration_minutes: dayProblems.reduce((sum, p) => sum + (p.estimated_time_minutes || 30), 0)
        }
      });
    } else if (i === 5) {
      // Saturday: Review
      dailyPlan.push({
        day: dayName,
        focus: 'Review & Practice',
        morning_session: {
          activity: 'Review week\'s problems',
          topics: topics,
          duration_minutes: 90
        },
        afternoon_session: {
          activity: 'Redo challenging problems',
          problems: [],
          duration_minutes: 90
        }
      });
    } else {
      // Sunday: Rest or optional practice
      dailyPlan.push({
        day: dayName,
        focus: 'Rest & Reflect',
        morning_session: {
          activity: 'Optional: Mock interview practice',
          topics: topics,
          duration_minutes: 60
        },
        afternoon_session: {
          activity: 'Rest and prepare for next week',
          problems: [],
          duration_minutes: 0
        }
      });
    }
  }

  return dailyPlan;
}

/**
 * Generate success criteria for the week
 */
function generateSuccessCriteria(weekNum, problems) {
  const criteria = [];

  // All problems solved
  criteria.push(`Complete all ${problems.length} assigned problems`);

  // Time targets
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  if (easyCount > 0) {
    criteria.push(`Solve Easy problems in under 15 minutes`);
  }
  if (mediumCount > 0) {
    criteria.push(`Solve Medium problems in under 30 minutes`);
  }
  if (hardCount > 0) {
    criteria.push(`Solve Hard problems in under 45 minutes`);
  }

  // Complexity targets
  criteria.push(`Explain time and space complexity for each solution`);

  // Review
  if (weekNum % 2 === 0) {
    criteria.push(`Review and optimize solutions from previous week`);
  }

  return criteria;
}

/**
 * Generate resource links for topics
 */
function generateResourceLinks(topics) {
  const resourceMap = {
    'Arrays & Hashing': [
      { name: 'NeetCode Arrays & Hashing', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode Explore - Arrays 101', url: 'https://leetcode.com/explore/learn/card/fun-with-arrays/' }
    ],
    'Two Pointers': [
      { name: 'NeetCode Two Pointers', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode Two Pointers Pattern', url: 'https://leetcode.com/tag/two-pointers/' }
    ],
    'Sliding Window': [
      { name: 'Sliding Window Technique', url: 'https://www.geeksforgeeks.org/window-sliding-technique/' }
    ],
    'Linked List': [
      { name: 'NeetCode Linked List', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode Explore - Linked List', url: 'https://leetcode.com/explore/learn/card/linked-list/' }
    ],
    'Trees': [
      { name: 'NeetCode Trees', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode Explore - Binary Tree', url: 'https://leetcode.com/explore/learn/card/data-structure-tree/' }
    ],
    'Graph': [
      { name: 'NeetCode Graph', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode Explore - Graph', url: 'https://leetcode.com/explore/learn/card/graph/' }
    ],
    'Dynamic Programming': [
      { name: 'NeetCode Dynamic Programming', url: 'https://neetcode.io/roadmap' },
      { name: 'LeetCode DP Patterns', url: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns' }
    ],
    'Heap': [
      { name: 'LeetCode Heap (Priority Queue)', url: 'https://leetcode.com/tag/heap-priority-queue/' }
    ],
    'Intervals': [
      { name: 'Interval Problems Pattern', url: 'https://leetcode.com/discuss/general-discussion/794725/interval-problem-patterns' }
    ],
    'Bit Manipulation': [
      { name: 'Bit Manipulation Tricks', url: 'https://leetcode.com/tag/bit-manipulation/' }
    ]
  };

  const resources = [];
  for (const topic of topics) {
    if (resourceMap[topic]) {
      resources.push(...resourceMap[topic]);
    }
  }

  return resources;
}

/**
 * Calculate difficulty distribution across curriculum
 */
function calculateDifficultyDistribution(curriculum) {
  const distribution = { Easy: 0, Medium: 0, Hard: 0 };

  for (const week of curriculum) {
    for (const problem of week.problems) {
      distribution[problem.difficulty] = (distribution[problem.difficulty] || 0) + 1;
    }
  }

  return distribution;
}

/**
 * Calculate category coverage across curriculum
 */
function calculateCategoryCoverage(curriculum) {
  const coverage = {};

  for (const week of curriculum) {
    for (const problem of week.problems) {
      coverage[problem.category] = (coverage[problem.category] || 0) + 1;
    }
  }

  return coverage;
}

/**
 * Get recommended problems for skill gaps
 */
async function getProblemsForSkillGaps(skillGaps, limit = 20) {
  const problems = [];

  for (const gap of skillGaps) {
    const { skill, difficulty } = gap;

    // Map skill to category
    const categoryProblems = await getProblemsByCategory(skill, 5);

    problems.push(...categoryProblems.slice(0, Math.ceil(limit / skillGaps.length)));
  }

  return problems;
}

module.exports = {
  buildCurriculum,
  buildWeekPlan,
  getProblemsForSkillGaps,
  TOPIC_SEQUENCE
};
