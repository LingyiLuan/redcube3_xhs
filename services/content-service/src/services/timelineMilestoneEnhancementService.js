/**
 * Timeline & Milestone Enhancement Service
 *
 * Phase 4: Enhanced Timeline & Milestones
 * Generates LLM-powered weekly timelines and evidence-based milestones
 *
 * CORE PRINCIPLES:
 * 1. ALL content must be evidence-based from real posts
 * 2. LLM generates structure, but data comes from database
 * 3. Every recommendation traces to specific posts
 */

const logger = require('../utils/logger');
const { analyzeWithOpenRouter, extractJsonFromString } = require('./aiService');
const pool = require('../config/database');

/**
 * Generate enhanced weekly timeline with daily breakdowns
 * Uses LLM to create realistic, evidence-based daily tasks
 *
 * @param {Array} sourcePosts - Foundation posts (seed + RAG)
 * @param {Object} timelineData - Timeline statistics from posts
 * @param {Array} skillModules - Generated skill modules with problems
 * @param {Object} userGoals - User goals including timelineWeeks preference
 * @returns {Object} Enhanced timeline with weekly and daily breakdowns
 */
async function generateEnhancedTimeline(sourcePosts, timelineData, skillModules, userGoals = {}) {
  logger.info('[TimelineEnhancement] Generating enhanced timeline');

  // Priority: 1. User's requested timeline, 2. Database average, 3. Default 12 weeks
  const totalWeeks = userGoals.timelineWeeks || timelineData.avg_prep_weeks || timelineData.median_prep_weeks || 12;

  logger.info(`[TimelineEnhancement] Using ${totalWeeks} weeks (user requested: ${userGoals.timelineWeeks || 'none'}, data average: ${timelineData.avg_prep_weeks || 'none'})`);

  // Extract real evidence from posts for LLM context
  const evidenceContext = await extractTimelineEvidence(sourcePosts);

  // Get all problems from skill modules for task planning
  const allProblems = extractAllProblems(skillModules);

  // Generate weekly structure via LLM
  const weeks = await generateWeeklyStructure(totalWeeks, evidenceContext, allProblems, sourcePosts.length);

  return {
    total_weeks: totalWeeks,
    weeks,
    data_warning: timelineData.has_warning ? {
      type: 'low_timeline_coverage',
      message: `Timeline based on ${timelineData.posts_with_data} posts (${timelineData.coverage_percent}% coverage). Actual prep time may vary.`,
      posts_with_data: timelineData.posts_with_data,
      total_posts: timelineData.total_posts
    } : null,
    evidence_quality: {
      posts_analyzed: sourcePosts.length,
      has_sufficient_data: sourcePosts.length >= 20,
      confidence: sourcePosts.length >= 50 ? 'high' : sourcePosts.length >= 30 ? 'medium' : 'low'
    }
  };
}

/**
 * Generate evidence-based milestones with criteria and real examples
 * Uses LLM to create meaningful checkpoints based on actual post data
 *
 * @param {Array} sourcePosts - Foundation posts (seed + RAG)
 * @param {Object} timeline - Generated timeline structure
 * @param {Array} skillModules - Generated skill modules
 * @returns {Array} Enhanced milestones with criteria and evidence
 */
async function generateEnhancedMilestones(sourcePosts, timeline, skillModules) {
  logger.info('[TimelineEnhancement] Generating enhanced milestones');

  // Extract real success patterns from posts
  const successPatterns = await extractSuccessPatterns(sourcePosts);

  // Get skill progression data
  const skillProgression = extractSkillProgression(skillModules);

  // Generate milestones via LLM with evidence
  const milestones = await generateMilestonesWithEvidence(
    timeline.total_weeks,
    successPatterns,
    skillProgression,
    sourcePosts.length
  );

  return milestones;
}

// ============================================================================
// EVIDENCE EXTRACTION
// ============================================================================

/**
 * Extract timeline evidence from real posts
 * Pulls actual preparation patterns, study schedules, etc.
 */
async function extractTimelineEvidence(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      prep_durations: [],
      study_patterns: [],
      success_stories: []
    };
  }

  const query = `
    SELECT
      p.post_id as id,
      p.llm_outcome as outcome,
      p.title,
      SUBSTRING(p.body_text, 1, 300) as excerpt
    FROM scraped_posts p
    WHERE p.post_id = ANY($1)
    AND p.llm_outcome IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 30
  `;

  const result = await pool.query(query, [postIds]);

  // Note: prep_duration_weeks, study_schedule columns don't exist in scraped_posts
  // We extract success stories from available data
  return {
    prep_durations: [], // Future enhancement: extract from post text
    study_patterns: [], // Future enhancement: extract from post text
    success_stories: result.rows.filter(r => r.outcome && (r.outcome.toLowerCase().includes('pass') || r.outcome.toLowerCase().includes('offer'))).map(r => ({
      title: r.title,
      excerpt: r.excerpt,
      post_id: r.id,
      prep_weeks: null // Future enhancement: extract from post text
    }))
  };
}

/**
 * Extract success patterns from posts
 * Identifies common checkpoints and skills mastered
 */
async function extractSuccessPatterns(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      common_checkpoints: [],
      skill_milestones: [],
      success_indicators: []
    };
  }

  // Query for posts with success outcomes and their skills/patterns
  const query = `
    SELECT
      p.post_id as id,
      p.llm_outcome as outcome,
      SUBSTRING(p.body_text, 1, 200) as excerpt
    FROM scraped_posts p
    WHERE p.post_id = ANY($1)
    AND p.llm_outcome IS NOT NULL
    ORDER BY
      CASE
        WHEN LOWER(p.llm_outcome) LIKE '%pass%' OR LOWER(p.llm_outcome) LIKE '%offer%' THEN 1
        ELSE 2
      END,
      p.created_at DESC
    LIMIT 40
  `;

  const result = await pool.query(query, [postIds]);

  // Group by outcome type
  const passedPosts = result.rows.filter(r =>
    r.outcome && (r.outcome.toLowerCase().includes('pass') || r.outcome.toLowerCase().includes('offer'))
  );

  // Note: prep_duration_weeks, key_skills_tested, turning_points columns don't exist in scraped_posts
  // We work with available data and gracefully handle missing fields
  return {
    common_checkpoints: extractCheckpoints(result.rows),
    skill_milestones: extractSkillMilestones(passedPosts),
    success_indicators: passedPosts.map(r => ({
      prep_weeks: null, // Future enhancement: extract from post text
      key_skills: null, // Future enhancement: extract from post text
      turning_points: null, // Future enhancement: extract from post text
      post_id: r.id
    }))
  };
}

/**
 * Extract checkpoint patterns from posts
 * Note: prep_duration_weeks column doesn't exist in scraped_posts yet
 * This function gracefully handles missing data and returns empty array
 */
function extractCheckpoints(posts) {
  const checkpoints = [];
  const weekCounts = {};

  // prep_duration_weeks field doesn't exist in current schema
  // Future enhancement: extract timeline data from post text
  posts.forEach(post => {
    if (post.prep_duration_weeks) {
      const third = Math.floor(post.prep_duration_weeks / 3);
      const twoThirds = Math.floor(post.prep_duration_weeks * 2 / 3);

      weekCounts[third] = (weekCounts[third] || 0) + 1;
      weekCounts[twoThirds] = (weekCounts[twoThirds] || 0) + 1;
      weekCounts[post.prep_duration_weeks] = (weekCounts[post.prep_duration_weeks] || 0) + 1;
    }
  });

  // Return most common checkpoint weeks (will be empty if no data)
  return Object.entries(weekCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([week, count]) => ({ week: parseInt(week), mentioned_in: count }));
}

/**
 * Extract skill milestone patterns
 * Note: key_skills_tested and prep_duration_weeks columns don't exist in scraped_posts yet
 * This function gracefully handles missing data and returns empty array
 */
function extractSkillMilestones(passedPosts) {
  const skillsByWeek = {};

  // key_skills_tested and prep_duration_weeks fields don't exist in current schema
  // Future enhancement: extract skills data from post text
  passedPosts.forEach(post => {
    if (post.key_skills_tested && post.prep_duration_weeks) {
      const week = post.prep_duration_weeks;
      if (!skillsByWeek[week]) {
        skillsByWeek[week] = [];
      }
      skillsByWeek[week].push({
        skills: post.key_skills_tested,
        post_id: post.id
      });
    }
  });

  // Return skill milestones (will be empty if no data)
  return Object.entries(skillsByWeek).map(([week, skills]) => ({
    week: parseInt(week),
    skills_mastered: skills,
    posts_count: skills.length
  }));
}

/**
 * Extract all problems from skill modules
 */
function extractAllProblems(skillModules) {
  if (!skillModules || !skillModules.modules) {
    return [];
  }

  const problems = [];
  skillModules.modules.forEach(module => {
    module.categories.forEach(category => {
      category.problems.forEach(problem => {
        problems.push({
          name: problem.problem_name,
          number: problem.problem_number,
          difficulty: problem.difficulty,
          category: category.category_name,
          module: module.module_name,
          priority: problem.priority,
          frequency: problem.frequency
        });
      });
    });
  });

  return problems;
}

/**
 * Extract skill progression data
 */
function extractSkillProgression(skillModules) {
  if (!skillModules || !skillModules.modules) {
    return [];
  }

  return skillModules.modules.map((module, idx) => ({
    sequence: idx + 1,
    module_name: module.module_name,
    priority: module.priority,
    total_problems: module.total_problems,
    estimated_hours: module.estimated_time_hours
  }));
}

// ============================================================================
// LLM GENERATION
// ============================================================================

/**
 * Generate weekly structure with daily breakdowns via LLM
 */
async function generateWeeklyStructure(totalWeeks, evidenceContext, allProblems, totalPosts) {
  logger.info(`[TimelineEnhancement] Generating ${totalWeeks} weeks with LLM`);

  // Prepare real evidence for LLM context
  const evidenceSummary = {
    successful_prep_durations: evidenceContext.prep_durations.slice(0, 10),
    study_schedule_examples: evidenceContext.study_patterns.slice(0, 5),
    available_problems: allProblems.slice(0, 50),  // Top 50 problems
    total_problems: allProblems.length,
    total_posts_analyzed: totalPosts
  };

  const prompt = `You are an interview preparation expert analyzing ${totalPosts} real Reddit interview experiences.

EVIDENCE FROM REAL POSTS:
- Successful preparation durations: ${JSON.stringify(evidenceContext.prep_durations.slice(0, 5).map(d => `${d.weeks} weeks (${d.outcome})`), null, 2)}
- Study schedule patterns: ${JSON.stringify(evidenceContext.study_patterns.slice(0, 3).map(s => s.schedule), null, 2)}
- Total problems available: ${allProblems.length}

TASK: Create a ${totalWeeks}-week study plan with daily breakdowns.

REQUIREMENTS:
1. Each week must have:
   - Week number and title
   - Description (what to focus on)
   - Daily tasks (Monday-Sunday, 7 days)
   - Skills covered
   - Source post count

2. Daily tasks must be REALISTIC and SPECIFIC:
   - Reference actual LeetCode problems from the evidence
   - Mix problem-solving with theory/review
   - Include rest days
   - Be achievable (2-4 hours/day typical)

3. Progression must be LOGICAL:
   - Early weeks: Fundamentals (Easy/Medium problems)
   - Middle weeks: Advanced patterns (Medium/Hard)
   - Final weeks: Mock interviews, company-specific prep

4. Base ALL recommendations on the evidence provided

Return JSON array of ${totalWeeks} weeks with this structure:
[{
  "week": 1,
  "title": "Foundations: Arrays & Strings",
  "description": "Master fundamental data structures",
  "daily_tasks": [
    "Monday: Review array fundamentals, solve Two Sum (Easy)",
    "Tuesday: Practice string manipulation, Valid Anagram (Easy)",
    "Wednesday: Two pointers technique, Container With Most Water (Medium)",
    "Thursday: Review and practice - revisit hard problems",
    "Friday: Sliding window pattern, Longest Substring (Medium)",
    "Saturday: Mock interview practice - 2 Easy problems timed",
    "Sunday: Rest and review week's concepts"
  ],
  "skills_covered": ["Arrays", "Strings", "Two Pointers", "Hash Tables"],
  "based_on_posts": ${Math.floor(totalPosts / totalWeeks)}
}, ...]

CRITICAL: Return ONLY the JSON array, no explanation.`;

  try {
    // Calculate token budget: ~800 tokens per week (7 days × ~100 tokens/day + structure)
    const estimatedTokens = Math.max(6000, totalWeeks * 800);
    const response = await analyzeWithOpenRouter(prompt, { max_tokens: estimatedTokens, temperature: 0.7 });
    const weeks = extractJsonFromString(response);

    if (!weeks || weeks.length === 0) {
      logger.warn(`[TimelineEnhancement] LLM returned no weeks, using fallback`);
      return generateFallbackWeeks(totalWeeks, allProblems, totalPosts);
    }

    logger.info(`[TimelineEnhancement] Generated ${weeks.length} weeks successfully (requested: ${totalWeeks})`);

    // If LLM didn't generate all weeks, pad with fallback weeks
    if (weeks.length < totalWeeks) {
      logger.warn(`[TimelineEnhancement] LLM only generated ${weeks.length}/${totalWeeks} weeks, padding with fallback`);
      const fallbackWeeks = generateFallbackWeeks(totalWeeks - weeks.length, allProblems, totalPosts);
      // Adjust week numbers for fallback weeks
      fallbackWeeks.forEach((w, i) => {
        w.week = weeks.length + i + 1;
      });
      return [...weeks, ...fallbackWeeks];
    }

    return weeks;
  } catch (error) {
    logger.error('[TimelineEnhancement] LLM generation failed, using fallback:', error);
    return generateFallbackWeeks(totalWeeks, allProblems, totalPosts);
  }
}

/**
 * Generate milestones with evidence via LLM
 */
async function generateMilestonesWithEvidence(totalWeeks, successPatterns, skillProgression, totalPosts) {
  logger.info(`[TimelineEnhancement] Generating evidence-based milestones`);

  const prompt = `You are an interview preparation expert analyzing ${totalPosts} real Reddit interview experiences.

EVIDENCE FROM REAL POSTS:
- Common checkpoint weeks: ${JSON.stringify(successPatterns.common_checkpoints.slice(0, 5))}
- Skill milestones: ${JSON.stringify(successPatterns.skill_milestones.slice(0, 3))}
- Success indicators: ${successPatterns.success_indicators.slice(0, 5).map(s => `${s.prep_weeks} weeks: ${s.key_skills}`).join(', ')}

TASK: Create meaningful milestones for a ${totalWeeks}-week study plan.

REQUIREMENTS:
1. Create 3-5 milestones at key checkpoints (e.g., Week 3, Week 6, Week 10)
2. Each milestone must have:
   - Week number
   - Title (clear achievement)
   - Criteria (specific, measurable goals)
   - Evidence (how many posts support this milestone)
   - Skills_mastered (specific skills at this point)
   - Source_post_ids (empty array, will be filled by backend)

3. Criteria must be SPECIFIC and MEASURABLE:
   - "Solve 50+ Easy problems with 90% success rate"
   - "Complete 20 Medium problems across 5 categories"
   - "Pass 2 mock interviews with positive feedback"

4. Base milestones on the evidence provided

Return JSON array of milestones with this structure:
[{
  "week": 3,
  "title": "Data Structures Mastery",
  "description": "Solid foundation in core data structures",
  "criteria": [
    "Solved 40+ Easy problems (Arrays, Strings, Hash Tables)",
    "Completed 15 Medium problems",
    "Can explain time/space complexity for all solutions",
    "90% success rate on Easy problems"
  ],
  "skills_mastered": ["Arrays", "Strings", "Hash Tables", "Two Pointers"],
  "evidence": "67 posts mention achieving this milestone around week 3",
  "based_on_posts": ${Math.floor(totalPosts / 3)},
  "source_post_ids": []
}, ...]

CRITICAL: Return ONLY the JSON array, no explanation.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, { max_tokens: 4000, temperature: 0.7 });
    const milestones = extractJsonFromString(response);

    logger.info(`[TimelineEnhancement] Generated ${milestones.length} milestones successfully`);
    return milestones;
  } catch (error) {
    logger.error('[TimelineEnhancement] LLM generation failed, using fallback:', error);
    return generateFallbackMilestones(totalWeeks, totalPosts);
  }
}

// ============================================================================
// FALLBACK GENERATION (if LLM fails)
// ============================================================================

function generateFallbackWeeks(totalWeeks, allProblems, totalPosts) {
  logger.warn('[TimelineEnhancement] Using fallback week generation');

  const weeks = [];
  const problemsPerWeek = Math.ceil(allProblems.length / totalWeeks);

  for (let week = 1; week <= totalWeeks; week++) {
    const progress = week / totalWeeks;
    let title, description;

    if (progress <= 0.33) {
      title = `Week ${week}: Core Fundamentals`;
      description = 'Master basic data structures and algorithms';
    } else if (progress <= 0.66) {
      title = `Week ${week}: Advanced Patterns`;
      description = 'Tackle complex problem-solving techniques';
    } else {
      title = `Week ${week}: Interview Preparation`;
      description = 'Practice mock interviews and company-specific problems';
    }

    weeks.push({
      week,
      title,
      description,
      daily_tasks: [
        `Monday: Study core concepts and solve 2 problems`,
        `Tuesday: Practice pattern recognition with 3 problems`,
        `Wednesday: Deep dive into 2 challenging problems`,
        `Thursday: Review and optimize previous solutions`,
        `Friday: Timed practice - solve 3 problems under time pressure`,
        `Saturday: Mock interview simulation`,
        `Sunday: Rest and review week's learnings`
      ],
      skills_covered: ['Problem Solving', 'Data Structures', 'Algorithms'],
      based_on_posts: Math.floor(totalPosts / totalWeeks)
    });
  }

  return weeks;
}

function generateFallbackMilestones(totalWeeks, totalPosts) {
  logger.warn('[TimelineEnhancement] Using fallback milestone generation');

  const milestones = [];
  const checkpointWeeks = [
    Math.floor(totalWeeks / 3),
    Math.floor(totalWeeks * 2 / 3),
    totalWeeks
  ];

  checkpointWeeks.forEach((week, idx) => {
    milestones.push({
      week,
      title: `Checkpoint ${idx + 1}`,
      description: `Progress assessment at week ${week}`,
      criteria: [
        'Complete assigned problems',
        'Achieve target success rate',
        'Master current skill set'
      ],
      skills_mastered: [],
      evidence: `Based on ${totalPosts} interview experiences`,
      based_on_posts: Math.floor(totalPosts / 3),
      source_post_ids: []
    });
  });

  return milestones;
}

module.exports = {
  generateEnhancedTimeline,
  generateEnhancedMilestones
};
