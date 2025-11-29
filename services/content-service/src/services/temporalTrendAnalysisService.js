/**
 * Temporal Trend Analysis Service - REFACTORED
 * Phase 3.1: Monthly trend analysis using ALL 2023-2025 database posts
 *
 * Purpose: Generate temporal intelligence with monthly granularity for trend visualization
 * Principle: Query database directly (not RAG posts), use ALL 580 relevant posts from 2023-2025
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Generate complete temporal intelligence with monthly trends
 *
 * NOTE: This queries the database directly for ALL 2023-2025 relevant posts,
 * NOT just the foundation posts from RAG search
 *
 * @returns {Object} Monthly trends for questions, skills, companies
 */
async function generateTemporalIntelligence() {
  try {
    logger.info('[Temporal Analysis] Starting temporal intelligence generation');
    logger.info('[Temporal Analysis] Querying ALL 2023-2025 relevant posts from database');

    // Query ALL 2023-2025 relevant posts from database
    const result = await pool.query(`
      SELECT
        post_id,
        title,
        body_text,
        metadata->>'company' as company,
        role_type,
        outcome,
        interview_date,
        created_at,
        post_year_quarter,
        interview_topics,
        tech_stack,
        frameworks
      FROM scraped_posts
      WHERE is_relevant = true
        AND interview_date IS NOT NULL
        AND EXTRACT(YEAR FROM interview_date) >= 2023
        AND EXTRACT(YEAR FROM interview_date) <= 2025
      ORDER BY interview_date ASC
    `);

    const allPosts = result.rows;
    logger.info(`[Temporal Analysis] Retrieved ${allPosts.length} posts from database`);

    if (allPosts.length < 20) {
      logger.warn('[Temporal Analysis] Insufficient data for temporal trends');
      return {
        insufficient_data: true,
        message: 'Insufficient data for temporal trend analysis (minimum 20 posts required)',
        total_posts: allPosts.length
      };
    }

    // Group posts by month (YYYY-MM format)
    const postsByMonth = groupPostsByMonth(allPosts);
    const months = Object.keys(postsByMonth).sort();

    logger.info(`[Temporal Analysis] Analyzing ${months.length} months from ${months[0]} to ${months[months.length - 1]}`);

    // Calculate monthly trends
    const questionTrends = calculateMonthlyQuestionTrends(postsByMonth, months);
    const skillTrends = calculateMonthlySkillTrends(postsByMonth, months);
    const companyActivity = calculateMonthlyCompanyActivity(postsByMonth, months);

    // Calculate summary statistics (comparing first half vs second half)
    const halfwayPoint = Math.floor(months.length / 2);
    const earlyMonths = months.slice(0, halfwayPoint);
    const recentMonths = months.slice(halfwayPoint);

    const earlyPosts = earlyMonths.flatMap(m => postsByMonth[m] || []);
    const recentPosts = recentMonths.flatMap(m => postsByMonth[m] || []);

    const summaryTrends = {
      top_emerging_questions: identifyEmergingQuestions(earlyPosts, recentPosts),
      top_emerging_skills: identifyEmergingSkills(earlyPosts, recentPosts),
      top_declining_questions: identifyDecliningQuestions(earlyPosts, recentPosts),
      top_declining_skills: identifyDecliningSkills(earlyPosts, recentPosts)
    };

    const temporalIntelligence = {
      // Monthly time series data for charts
      monthly_data: {
        months: months, // ["2023-01", "2023-02", ..., "2025-11"]
        question_trends: questionTrends, // { "LRU Cache": [0, 1, 2, 3, ...], ... }
        skill_trends: skillTrends, // { "React": [5, 7, 8, 10, ...], ... }
        company_activity: companyActivity // { "Google": [10, 12, 15, ...], ... }
      },

      // Summary statistics for quick insights
      summary: {
        total_posts: allPosts.length,
        months_analyzed: months.length,
        date_range: {
          start: months[0],
          end: months[months.length - 1]
        },
        ...summaryTrends
      },

      // Metadata
      analysis_timestamp: new Date().toISOString(),
      data_source: 'database_query_all_2023_2025'
    };

    logger.info(`[Temporal Analysis] Generated monthly trends for ${Object.keys(questionTrends).length} questions and ${Object.keys(skillTrends).length} skills`);
    return temporalIntelligence;

  } catch (error) {
    logger.error('[Temporal Analysis] Error generating temporal intelligence:', error);
    throw error;
  }
}

/**
 * Group posts by month (YYYY-MM)
 */
function groupPostsByMonth(posts) {
  const grouped = {};

  posts.forEach(post => {
    const date = new Date(post.interview_date || post.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(post);
  });

  return grouped;
}

/**
 * Calculate monthly question frequency trends
 * Returns: { "LRU Cache": [0, 1, 2, 3, ...], "Binary Tree": [1, 1, 2, 4, ...] }
 */
function calculateMonthlyQuestionTrends(postsByMonth, months) {
  const questionsByMonth = {};

  // Extract all unique questions
  const allQuestions = new Set();
  Object.values(postsByMonth).forEach(posts => {
    posts.forEach(post => {
      const questions = extractQuestionsFromPost(post);
      questions.forEach(q => allQuestions.add(q));
    });
  });

  // Calculate frequency for each question per month
  const trends = {};
  allQuestions.forEach(question => {
    trends[question] = months.map(month => {
      const posts = postsByMonth[month] || [];
      return posts.filter(post => {
        const questions = extractQuestionsFromPost(post);
        return questions.includes(question);
      }).length;
    });
  });

  // Filter: Only include questions with at least 5 total occurrences
  const filteredTrends = {};
  Object.entries(trends).forEach(([question, counts]) => {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total >= 5) {
      filteredTrends[question] = counts;
    }
  });

  // Sort by total frequency and take top 20
  const sorted = Object.entries(filteredTrends)
    .sort((a, b) => {
      const sumA = a[1].reduce((x, y) => x + y, 0);
      const sumB = b[1].reduce((x, y) => x + y, 0);
      return sumB - sumA;
    })
    .slice(0, 20);

  return Object.fromEntries(sorted);
}

/**
 * Calculate monthly skill frequency trends
 * Returns: { "React": [5, 7, 8, 10, ...], "Python": [3, 4, 5, 7, ...] }
 */
function calculateMonthlySkillTrends(postsByMonth, months) {
  const skillsByMonth = {};

  // Extract all unique skills
  const allSkills = new Set();
  Object.values(postsByMonth).forEach(posts => {
    posts.forEach(post => {
      const skills = extractSkillsFromPost(post);
      skills.forEach(s => allSkills.add(s));
    });
  });

  // Calculate frequency for each skill per month
  const trends = {};
  allSkills.forEach(skill => {
    trends[skill] = months.map(month => {
      const posts = postsByMonth[month] || [];
      return posts.filter(post => {
        const skills = extractSkillsFromPost(post);
        return skills.includes(skill);
      }).length;
    });
  });

  // Filter: Only include skills with at least 5 total occurrences
  const filteredTrends = {};
  Object.entries(trends).forEach(([skill, counts]) => {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total >= 5) {
      filteredTrends[skill] = counts;
    }
  });

  // Sort by total frequency and take top 20
  const sorted = Object.entries(filteredTrends)
    .sort((a, b) => {
      const sumA = a[1].reduce((x, y) => x + y, 0);
      const sumB = b[1].reduce((x, y) => x + y, 0);
      return sumB - sumA;
    })
    .slice(0, 20);

  return Object.fromEntries(sorted);
}

/**
 * Calculate monthly company activity
 * Returns: { "Google": [10, 12, 15, ...], "Meta": [5, 6, 8, ...] }
 */
function calculateMonthlyCompanyActivity(postsByMonth, months) {
  const companiesByMonth = {};

  // Extract all unique companies
  const allCompanies = new Set();
  Object.values(postsByMonth).forEach(posts => {
    posts.forEach(post => {
      if (post.company && post.company !== 'Unknown') {
        allCompanies.add(post.company);
      }
    });
  });

  // Calculate activity for each company per month
  const activity = {};
  allCompanies.forEach(company => {
    activity[company] = months.map(month => {
      const posts = postsByMonth[month] || [];
      return posts.filter(post => post.company === company).length;
    });
  });

  // Filter: Only include companies with at least 5 total posts
  const filteredActivity = {};
  Object.entries(activity).forEach(([company, counts]) => {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total >= 5) {
      filteredActivity[company] = counts;
    }
  });

  // Sort by total activity and take top 10
  const sorted = Object.entries(filteredActivity)
    .sort((a, b) => {
      const sumA = a[1].reduce((x, y) => x + y, 0);
      const sumB = b[1].reduce((x, y) => x + y, 0);
      return sumB - sumA;
    })
    .slice(0, 10);

  return Object.fromEntries(sorted);
}

/**
 * Extract questions from post
 */
function extractQuestionsFromPost(post) {
  const questions = [];

  // From interview_topics (JSONB format)
  if (post.interview_topics) {
    let topics = post.interview_topics;

    // Handle JSONB object format
    if (typeof topics === 'object' && !Array.isArray(topics)) {
      topics = Object.values(topics).flat();
    }

    // Normalize to array
    if (Array.isArray(topics)) {
      questions.push(...topics);
    }
  }

  // Extract from title and body_text using comprehensive keyword matching
  const text = `${post.title || ''} ${post.body_text || ''}`.toLowerCase();

  // Comprehensive question topics (75 topics)
  const commonQuestions = [
    // Arrays & Strings (15)
    'two sum', 'three sum', 'container with most water',
    'longest substring', 'valid parentheses', 'group anagrams',
    'longest palindrome', 'trapping rain water', 'product of array',
    'rotate array', 'merge intervals', 'insert interval',
    'spiral matrix', 'set matrix zeroes', 'word search',

    // Linked Lists (8)
    'linked list', 'reverse linked list', 'merge sorted lists',
    'linked list cycle', 'remove nth node', 'reorder list',
    'add two numbers', 'copy list with random pointer',

    // Trees (12)
    'binary tree', 'invert binary tree', 'maximum depth',
    'validate bst', 'lowest common ancestor', 'level order traversal',
    'serialize deserialize', 'binary tree paths', 'path sum',
    'construct binary tree', 'flatten binary tree', 'word search ii',

    // Graphs (8)
    'graph traversal', 'bfs', 'dfs', 'clone graph',
    'course schedule', 'number of islands', 'word ladder',
    'shortest path',

    // Dynamic Programming (12)
    'dynamic programming', 'climbing stairs', 'house robber',
    'coin change', 'longest increasing subsequence',
    'edit distance', 'partition equal subset', 'decode ways',
    'unique paths', 'word break', 'kadane', 'maximum subarray',

    // Data Structures (8)
    'lru cache', 'heap', 'priority queue', 'trie',
    'union find', 'disjoint set', 'segment tree',
    'design hashmap',

    // Techniques (7)
    'sliding window', 'two pointers', 'backtracking',
    'greedy', 'binary search', 'topological sort',
    'monotonic stack',

    // System Design (5)
    'system design', 'design twitter', 'design url shortener',
    'design rate limiter', 'design distributed cache'
  ];

  commonQuestions.forEach(q => {
    // Use word boundaries for more accurate matching
    const regex = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text)) {
      questions.push(q);
    }
  });

  return [...new Set(questions)]; // Deduplicate
}

/**
 * Comprehensive tech skill keywords for extraction
 * 90 skills covering all major tech areas
 */
const TECH_SKILLS = [
  // Programming Languages (15)
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'csharp',
  'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',

  // Frontend Frameworks (12)
  'react', 'vue', 'vue.js', 'angular', 'next.js', 'nextjs', 'nuxt',
  'svelte', 'ember', 'backbone', 'jquery', 'preact',

  // Backend Frameworks (12)
  'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi',
  'spring', 'spring boot', 'rails', 'laravel', 'asp.net', 'gin',

  // Databases (12)
  'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'cassandra',
  'elasticsearch', 'dynamodb', 'sqlite', 'oracle', 'mariadb', 'neo4j',

  // Cloud Platforms (8)
  'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'digitalocean',

  // DevOps & Tools (18)
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins',
  'gitlab', 'github actions', 'circleci', 'travis', 'prometheus',
  'grafana', 'nginx', 'apache', 'ci/cd', 'git', 'linux', 'bash',

  // Data & ML (15)
  'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'sklearn',
  'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'machine learning',
  'deep learning', 'mlops', 'data science',

  // Other Important (10)
  'graphql', 'rest', 'rest api', 'grpc', 'microservices', 'websocket',
  'rabbitmq', 'celery', 'selenium', 'jest'
];

/**
 * Extract skills from post
 * Uses database columns first, falls back to keyword matching
 */
function extractSkillsFromPost(post) {
  const skills = [];

  // 1. From tech_stack column (if available)
  if (Array.isArray(post.tech_stack)) {
    skills.push(...post.tech_stack);
  }

  // 2. From frameworks column (if available)
  if (Array.isArray(post.frameworks)) {
    skills.push(...post.frameworks);
  }

  // 3. FALLBACK: Extract from text if no database data
  if (skills.length === 0) {
    const text = `${post.title || ''} ${post.body_text || ''}`.toLowerCase();

    TECH_SKILLS.forEach(skill => {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        skills.push(skill);
      }
    });
  }

  // Normalize and deduplicate
  return [...new Set(skills.map(s => s.toLowerCase()))];
}

/**
 * Identify emerging questions (higher frequency in recent months)
 */
function identifyEmergingQuestions(earlyPosts, recentPosts) {
  const earlyQuestions = {};
  const recentQuestions = {};

  earlyPosts.forEach(post => {
    const questions = extractQuestionsFromPost(post);
    questions.forEach(q => {
      earlyQuestions[q] = (earlyQuestions[q] || 0) + 1;
    });
  });

  recentPosts.forEach(post => {
    const questions = extractQuestionsFromPost(post);
    questions.forEach(q => {
      recentQuestions[q] = (recentQuestions[q] || 0) + 1;
    });
  });

  const emerging = [];
  Object.keys(recentQuestions).forEach(question => {
    const earlyCount = earlyQuestions[question] || 0;
    const recentCount = recentQuestions[question] || 0;

    if (recentCount >= 3) { // Minimum threshold
      const change = earlyCount > 0
        ? ((recentCount - earlyCount) / earlyCount * 100)
        : 999; // New question

      if (change >= 50) { // At least 50% increase
        emerging.push({
          question,
          early_count: earlyCount,
          recent_count: recentCount,
          change_percent: change === 999 ? 'NEW' : Math.round(change),
          severity: change >= 200 ? 'Critical' : change >= 100 ? 'High' : 'Medium'
        });
      }
    }
  });

  return emerging
    .sort((a, b) => {
      const aChange = typeof a.change_percent === 'number' ? a.change_percent : 999;
      const bChange = typeof b.change_percent === 'number' ? b.change_percent : 999;
      return bChange - aChange;
    })
    .slice(0, 10);
}

/**
 * Identify emerging skills
 */
function identifyEmergingSkills(earlyPosts, recentPosts) {
  const earlySkills = {};
  const recentSkills = {};

  earlyPosts.forEach(post => {
    const skills = extractSkillsFromPost(post);
    skills.forEach(s => {
      earlySkills[s] = (earlySkills[s] || 0) + 1;
    });
  });

  recentPosts.forEach(post => {
    const skills = extractSkillsFromPost(post);
    skills.forEach(s => {
      recentSkills[s] = (recentSkills[s] || 0) + 1;
    });
  });

  const emerging = [];
  Object.keys(recentSkills).forEach(skill => {
    const earlyCount = earlySkills[skill] || 0;
    const recentCount = recentSkills[skill] || 0;

    if (recentCount >= 3) {
      const change = earlyCount > 0
        ? ((recentCount - earlyCount) / earlyCount * 100)
        : 999;

      if (change >= 50) {
        emerging.push({
          skill,
          early_count: earlyCount,
          recent_count: recentCount,
          change_percent: change === 999 ? 'NEW' : Math.round(change),
          severity: change >= 200 ? 'Critical' : change >= 100 ? 'High' : 'Medium'
        });
      }
    }
  });

  return emerging
    .sort((a, b) => {
      const aChange = typeof a.change_percent === 'number' ? a.change_percent : 999;
      const bChange = typeof b.change_percent === 'number' ? b.change_percent : 999;
      return bChange - aChange;
    })
    .slice(0, 10);
}

/**
 * Identify declining questions
 */
function identifyDecliningQuestions(earlyPosts, recentPosts) {
  const earlyQuestions = {};
  const recentQuestions = {};

  earlyPosts.forEach(post => {
    const questions = extractQuestionsFromPost(post);
    questions.forEach(q => {
      earlyQuestions[q] = (earlyQuestions[q] || 0) + 1;
    });
  });

  recentPosts.forEach(post => {
    const questions = extractQuestionsFromPost(post);
    questions.forEach(q => {
      recentQuestions[q] = (recentQuestions[q] || 0) + 1;
    });
  });

  const declining = [];
  Object.keys(earlyQuestions).forEach(question => {
    const earlyCount = earlyQuestions[question] || 0;
    const recentCount = recentQuestions[question] || 0;

    if (earlyCount >= 3) {
      const change = ((recentCount - earlyCount) / earlyCount * 100);

      if (change <= -50) { // At least 50% decrease
        declining.push({
          question,
          early_count: earlyCount,
          recent_count: recentCount,
          change_percent: Math.round(change),
          severity: change <= -80 ? 'High' : 'Medium'
        });
      }
    }
  });

  return declining
    .sort((a, b) => a.change_percent - b.change_percent)
    .slice(0, 10);
}

/**
 * Identify declining skills
 */
function identifyDecliningSkills(earlyPosts, recentPosts) {
  const earlySkills = {};
  const recentSkills = {};

  earlyPosts.forEach(post => {
    const skills = extractSkillsFromPost(post);
    skills.forEach(s => {
      earlySkills[s] = (earlySkills[s] || 0) + 1;
    });
  });

  recentPosts.forEach(post => {
    const skills = extractSkillsFromPost(post);
    skills.forEach(s => {
      recentSkills[s] = (recentSkills[s] || 0) + 1;
    });
  });

  const declining = [];
  Object.keys(earlySkills).forEach(skill => {
    const earlyCount = earlySkills[skill] || 0;
    const recentCount = recentSkills[skill] || 0;

    if (earlyCount >= 3) {
      const change = ((recentCount - earlyCount) / earlyCount * 100);

      if (change <= -50) {
        declining.push({
          skill,
          early_count: earlyCount,
          recent_count: recentCount,
          change_percent: Math.round(change),
          severity: change <= -80 ? 'High' : 'Medium'
        });
      }
    }
  });

  return declining
    .sort((a, b) => a.change_percent - b.change_percent)
    .slice(0, 10);
}

module.exports = {
  generateTemporalIntelligence
};
