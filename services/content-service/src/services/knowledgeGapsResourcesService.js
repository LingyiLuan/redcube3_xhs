/**
 * Knowledge Gaps & Resources Service
 *
 * Phase 5: Enhanced Learning Map
 * Extracts knowledge gaps from failure patterns and curates resources with success rates
 *
 * CORE PRINCIPLES:
 * 1. ALL content must be evidence-based from real posts
 * 2. Track success/failure patterns to identify gaps
 * 3. Calculate resource effectiveness from real outcomes
 */

const logger = require('../utils/logger');
const { analyzeWithOpenRouter, extractJsonFromString } = require('./aiService');
const pool = require('../config/database');

/**
 * Extract knowledge gaps from failure patterns
 * Analyzes posts with failed outcomes to identify common struggles
 *
 * @param {Array} sourcePosts - Foundation posts (seed + RAG)
 * @param {Object} userGoals - User's target company/role
 * @returns {Object} Knowledge gaps with evidence
 */
async function extractKnowledgeGaps(sourcePosts, userGoals) {
  logger.info('[KnowledgeGaps] Extracting knowledge gaps from failure patterns');

  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      gaps: [],
      evidence_quality: {
        posts_analyzed: 0,
        has_sufficient_data: false
      }
    };
  }

  // Query posts with failure indicators
  const failureQuery = `
    SELECT
      p.post_id as id,
      p.title,
      p.llm_company as company,
      p.role_type,
      p.llm_outcome as outcome,
      p.llm_interview_stages,
      p.difficulty_level as interview_difficulty,
      SUBSTRING(p.body_text, 1, 500) as excerpt
    FROM scraped_posts p
    WHERE p.post_id = ANY($1)
    AND (
      LOWER(p.llm_outcome) LIKE '%fail%'
      OR LOWER(p.llm_outcome) LIKE '%reject%'
      OR LOWER(p.llm_outcome) LIKE '%no offer%'
      OR LOWER(p.potential_outcome) LIKE '%fail%'
      OR LOWER(p.potential_outcome) LIKE '%reject%'
    )
    ORDER BY p.created_at DESC
    LIMIT 100
  `;

  const result = await pool.query(failureQuery, [postIds]);

  logger.info(`[KnowledgeGaps] Found ${result.rows.length} posts with failure patterns`);

  // Extract struggle patterns from posts
  const strugglePatterns = await analyzeStrugglePatterns(result.rows);

  // Use LLM to categorize and prioritize knowledge gaps
  const gaps = await generateKnowledgeGaps(strugglePatterns, result.rows.length, sourcePosts.length);

  return {
    gaps,
    evidence_quality: {
      posts_analyzed: result.rows.length,
      total_posts: sourcePosts.length,
      has_sufficient_data: result.rows.length >= 10,
      confidence: result.rows.length >= 30 ? 'high' : result.rows.length >= 15 ? 'medium' : 'low'
    }
  };
}

/**
 * Extract and curate resources with success rate tracking
 * Identifies resources mentioned in posts and calculates effectiveness
 *
 * @param {Array} sourcePosts - Foundation posts (seed + RAG)
 * @returns {Object} Curated resources with success rates
 */
async function extractCuratedResources(sourcePosts) {
  // ✅ MIGRATION 27 DATABASE-FIRST APPROACH
  // Use aggregateResourcesFromDB which queries the resources_used field
  logger.info('[Resources] Extracting curated resources from database (Migration 27)');

  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      resources: [],
      evidence_quality: {
        posts_analyzed: 0,
        has_sufficient_data: false
      }
    };
  }

  // Directly aggregate from database using Migration 27 field: resources_used
  const resources = await aggregateResourcesFromDB(sourcePosts);

  // Count posts with resources_used data for evidence quality
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND resources_used IS NOT NULL
      AND jsonb_array_length(resources_used) > 0
  `, [postIds]);

  const postsWithData = parseInt(result.rows[0].count) || 0;

  logger.info(`[Resources] Found ${resources.length} unique resources from ${postsWithData} posts with data`);

  return {
    resources,
    evidence_quality: {
      posts_analyzed: postsWithData,
      total_posts: sourcePosts.length,
      has_sufficient_data: postsWithData >= 20,
      confidence: postsWithData >= 50 ? 'high' : postsWithData >= 30 ? 'medium' : 'low'
    }
  };
}

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

/**
 * Analyze struggle patterns from failure posts
 * DATABASE-FIRST: Aggregates from Migration 27 fields (areas_struggled, skills_tested, mistakes_made)
 * Identifies common areas where candidates struggled
 */
async function analyzeStrugglePatterns(failurePosts) {
  // ✅ MIGRATION 27 DATABASE-FIRST APPROACH
  // Query actual database fields instead of LLM extraction

  logger.info(`[StrugglePatterns] Aggregating from database (Migration 27 fields)`);

  if (failurePosts.length === 0) {
    return {
      struggle_areas: [],
      failed_skills: [],
      total_failure_posts: 0
    };
  }

  const postIds = failurePosts.map(p => p.id);

  try {
    // Aggregate areas_struggled from database
    const areasResult = await pool.query(`
      SELECT
        area_obj->>'area' as area,
        area_obj->>'severity' as severity,
        COUNT(*) as struggle_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids,
        ARRAY_AGG(DISTINCT (area_obj->>'details')) FILTER (WHERE (area_obj->>'details') IS NOT NULL) as details
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(areas_struggled, '[]'::jsonb)) AS area_obj
      WHERE post_id = ANY($1)
        AND areas_struggled IS NOT NULL
        AND jsonb_array_length(areas_struggled) > 0
      GROUP BY area_obj->>'area', area_obj->>'severity'
      HAVING COUNT(*) >= 2  -- At least 2 mentions
      ORDER BY struggle_count DESC
      LIMIT 10
    `, [postIds]);

    // Aggregate skills_tested (failed) from database
    const skillsResult = await pool.query(`
      SELECT
        skill_obj->>'skill' as skill,
        skill_obj->>'category' as category,
        skill_obj->>'difficulty' as difficulty,
        COUNT(*) as fail_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(skills_tested, '[]'::jsonb)) AS skill_obj
      WHERE post_id = ANY($1)
        AND skills_tested IS NOT NULL
        AND jsonb_array_length(skills_tested) > 0
        AND (skill_obj->>'passed')::boolean = false  -- Only failed skills
      GROUP BY skill_obj->>'skill', skill_obj->>'category', skill_obj->>'difficulty'
      HAVING COUNT(*) >= 2  -- At least 2 mentions
      ORDER BY fail_count DESC
      LIMIT 10
    `, [postIds]);

    logger.info(`[StrugglePatterns] Found ${areasResult.rows.length} struggle areas, ${skillsResult.rows.length} failed skills from database`);

    return {
      struggle_areas: areasResult.rows.map(row => ({
        area: row.area,
        count: parseInt(row.struggle_count),
        severity: row.severity || 'medium',
        source_post_ids: row.source_post_ids,
        details: row.details || []
      })),
      failed_skills: skillsResult.rows.map(row => ({
        skill: row.skill,
        count: parseInt(row.fail_count),
        category: row.category || 'Technical',
        difficulty: row.difficulty || 'Medium',
        source_post_ids: row.source_post_ids
      })),
      total_failure_posts: failurePosts.length
    };
  } catch (error) {
    logger.error('[StrugglePatterns] Database aggregation failed:', error.message);
    // Return empty patterns on error
    return {
      struggle_areas: [],
      failed_skills: [],
      total_failure_posts: failurePosts.length
    };
  }
}

/**
 * Analyze resource patterns from posts
 * Tracks which resources correlate with success
 */
async function analyzeResourcePatterns(resourcePosts) {
  const patterns = {
    resources_mentioned: new Map(),  // resource -> { total, success, posts }
    leetcode_patterns: {
      premium: { total: 0, success: 0, posts: [] },
      free: { total: 0, success: 0, posts: [] }
    }
  };

  resourcePosts.forEach(post => {
    const isSuccess = post.outcome && (
      post.outcome.toLowerCase().includes('pass') ||
      post.outcome.toLowerCase().includes('offer') ||
      post.outcome.toLowerCase().includes('accept')
    );

    // Extract from preparation_resources field
    if (post.preparation_resources) {
      try {
        const resources = typeof post.preparation_resources === 'string'
          ? JSON.parse(post.preparation_resources)
          : post.preparation_resources;

        if (Array.isArray(resources)) {
          resources.forEach(resource => {
            trackResource(patterns.resources_mentioned, resource, post.id, isSuccess);
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Extract from text content
    const commonResources = [
      'LeetCode Premium',
      'LeetCode',
      'Cracking the Coding Interview',
      'CTCI',
      'Grokking the System Design Interview',
      'System Design Interview',
      'AlgoExpert',
      'NeetCode',
      'Educative',
      'Elements of Programming Interviews',
      'Blind 75',
      'NeetCode 150',
      'Grind 75'
    ];

    const excerptLower = post.excerpt.toLowerCase();
    commonResources.forEach(resource => {
      if (excerptLower.includes(resource.toLowerCase())) {
        trackResource(patterns.resources_mentioned, resource, post.id, isSuccess);
      }
    });

    // Track LeetCode Premium vs Free
    if (excerptLower.includes('leetcode premium')) {
      patterns.leetcode_patterns.premium.total++;
      if (isSuccess) patterns.leetcode_patterns.premium.success++;
      patterns.leetcode_patterns.premium.posts.push(post.id);
    } else if (excerptLower.includes('leetcode')) {
      patterns.leetcode_patterns.free.total++;
      if (isSuccess) patterns.leetcode_patterns.free.success++;
      patterns.leetcode_patterns.free.posts.push(post.id);
    }
  });

  return {
    resources: Array.from(patterns.resources_mentioned.entries()).map(([name, data]) => ({
      name,
      total_mentions: data.total,
      success_count: data.success,
      success_rate: data.total > 0 ? (data.success / data.total * 100).toFixed(1) : 0,
      post_ids: data.posts
    })),
    leetcode_patterns: patterns.leetcode_patterns,
    total_posts: resourcePosts.length
  };
}

/**
 * Helper: Track resource mention and outcome
 */
function trackResource(resourceMap, resourceName, postId, isSuccess) {
  if (!resourceMap.has(resourceName)) {
    resourceMap.set(resourceName, {
      total: 0,
      success: 0,
      posts: []
    });
  }

  const data = resourceMap.get(resourceName);
  data.total++;
  if (isSuccess) data.success++;
  data.posts.push(postId);
}

/**
 * Helper: Aggregate struggle areas
 */
function aggregateByArea(struggles) {
  const areaMap = new Map();

  struggles.forEach(({ area, post_id, company, outcome }) => {
    const normalizedArea = normalizeAreaName(area);
    if (!areaMap.has(normalizedArea)) {
      areaMap.set(normalizedArea, {
        count: 0,
        posts: [],
        companies: new Set()
      });
    }

    const data = areaMap.get(normalizedArea);
    data.count++;
    data.posts.push(post_id);
    if (company) data.companies.add(company);
  });

  return Array.from(areaMap.entries())
    .map(([area, data]) => ({
      area,
      struggle_count: data.count,
      posts: data.posts,
      companies: Array.from(data.companies)
    }))
    .sort((a, b) => b.struggle_count - a.struggle_count)
    .slice(0, 10);  // Top 10 struggle areas
}

/**
 * Helper: Aggregate skills that were tested but failed
 */
function aggregateBySkill(skills) {
  const skillMap = new Map();

  skills.forEach(({ skill, post_id, company, difficulty }) => {
    const normalizedSkill = normalizeSkillName(skill);
    if (!skillMap.has(normalizedSkill)) {
      skillMap.set(normalizedSkill, {
        count: 0,
        posts: [],
        companies: new Set()
      });
    }

    const data = skillMap.get(normalizedSkill);
    data.count++;
    data.posts.push(post_id);
    if (company) data.companies.add(company);
  });

  return Array.from(skillMap.entries())
    .map(([skill, data]) => ({
      skill,
      failure_count: data.count,
      posts: data.posts,
      companies: Array.from(data.companies)
    }))
    .sort((a, b) => b.failure_count - a.failure_count)
    .slice(0, 10);  // Top 10 failed skills
}

/**
 * Helper: Normalize area names
 */
function normalizeAreaName(area) {
  const normalized = area.toLowerCase().trim();

  // Map similar areas to canonical names
  const mappings = {
    'system design': ['sys design', 'system architecture', 'design'],
    'behavioral': ['behavioral questions', 'behavioural', 'behavior'],
    'coding': ['programming', 'algorithms', 'problem solving'],
    'data structures': ['ds', 'data structure'],
    'dynamic programming': ['dp', 'dynamic prog'],
    'object oriented design': ['ood', 'object oriented', 'oo design'],
    'concurrency': ['multithreading', 'threading', 'parallel']
  };

  for (const [canonical, variants] of Object.entries(mappings)) {
    if (variants.some(v => normalized.includes(v)) || normalized.includes(canonical)) {
      return canonical;
    }
  }

  return normalized;
}

/**
 * Helper: Normalize skill names
 */
function normalizeSkillName(skill) {
  const normalized = skill.toLowerCase().trim();

  const mappings = {
    'arrays': ['array'],
    'linked lists': ['linked list', 'linkedlist'],
    'trees': ['tree', 'binary tree'],
    'graphs': ['graph'],
    'dynamic programming': ['dp'],
    'backtracking': ['back tracking']
  };

  for (const [canonical, variants] of Object.entries(mappings)) {
    if (variants.some(v => normalized.includes(v)) || normalized.includes(canonical)) {
      return canonical;
    }
  }

  return normalized;
}

// ============================================================================
// DATABASE AGGREGATION FUNCTIONS (Migration 27 Fields)
// ============================================================================

/**
 * Aggregate success factors from database (Migration 27 field: success_factors)
 * Queries the success_factors JSONB field from passed interviews
 */
async function aggregateSuccessFactors(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  logger.info(`[SuccessFactors] Aggregating from ${postIds.length} posts`);

  try {
    const result = await pool.query(`
      SELECT
        factor_obj->>'factor' as factor,
        factor_obj->>'impact' as impact,
        factor_obj->>'category' as category,
        COUNT(*) as mention_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(success_factors, '[]'::jsonb)) AS factor_obj
      WHERE post_id = ANY($1)
        AND llm_outcome IN ('passed', 'unknown')  -- Only success stories
        AND success_factors IS NOT NULL
        AND jsonb_array_length(success_factors) > 0
      GROUP BY factor_obj->>'factor', factor_obj->>'impact', factor_obj->>'category'
      HAVING COUNT(*) >= 2  -- At least 2 mentions
      ORDER BY mention_count DESC, impact DESC
      LIMIT 15
    `, [postIds]);

    logger.info(`[SuccessFactors] Found ${result.rows.length} unique success factors`);

    return result.rows.map(row => ({
      factor: row.factor,
      impact: row.impact || 'medium',
      category: row.category || 'preparation',
      mention_count: parseInt(row.mention_count),
      source_post_ids: row.source_post_ids
    }));
  } catch (error) {
    logger.error('[SuccessFactors] Database aggregation failed:', error.message);
    return [];
  }
}

/**
 * Aggregate resources from database (Migration 27 field: resources_used)
 * Calculates effectiveness based on outcome correlation
 */
async function aggregateResourcesFromDB(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  logger.info(`[ResourcesDB] Aggregating from ${postIds.length} posts`);

  try {
    const result = await pool.query(`
      SELECT
        resource_obj->>'resource' as resource_name,
        resource_obj->>'type' as resource_type,
        resource_obj->>'effectiveness' as effectiveness,
        COUNT(*) as total_mentions,
        COUNT(*) FILTER (WHERE llm_outcome = 'passed') as success_mentions,
        ROUND(
          (COUNT(*) FILTER (WHERE llm_outcome = 'passed')::numeric / COUNT(*)::numeric) * 100,
          0
        ) as success_rate,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids,
        AVG((resource_obj->>'duration_weeks')::int) FILTER (WHERE (resource_obj->>'duration_weeks') IS NOT NULL) as avg_duration_weeks
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(resources_used, '[]'::jsonb)) AS resource_obj
      WHERE post_id = ANY($1)
        AND resources_used IS NOT NULL
        AND jsonb_array_length(resources_used) > 0
      GROUP BY resource_obj->>'resource', resource_obj->>'type', resource_obj->>'effectiveness'
      HAVING COUNT(*) >= 2  -- At least 2 mentions
      ORDER BY success_rate DESC, total_mentions DESC
      LIMIT 15
    `, [postIds]);

    logger.info(`[ResourcesDB] Found ${result.rows.length} unique resources`);

    return result.rows.map(row => ({
      name: row.resource_name,
      type: row.resource_type || 'Resource',
      effectiveness: row.effectiveness || 'medium',
      mention_count: parseInt(row.total_mentions),
      success_rate: parseInt(row.success_rate) || 0,
      avg_duration_weeks: row.avg_duration_weeks ? parseFloat(row.avg_duration_weeks).toFixed(1) : null,
      source_post_ids: row.source_post_ids
    }));
  } catch (error) {
    logger.error('[ResourcesDB] Database aggregation failed:', error.message);
    return [];
  }
}

/**
 * Aggregate timeline data from database (Migration 27 fields: preparation_time_days, interview_rounds, etc.)
 * Provides realistic timeline statistics
 */
async function aggregateTimelineData(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  logger.info(`[TimelineData] Aggregating from ${postIds.length} posts`);

  try {
    const result = await pool.query(`
      SELECT
        -- Preparation statistics
        AVG(preparation_time_days) FILTER (WHERE preparation_time_days IS NOT NULL) as avg_prep_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY preparation_time_days) FILTER (WHERE preparation_time_days IS NOT NULL) as median_prep_days,
        MIN(preparation_time_days) FILTER (WHERE preparation_time_days IS NOT NULL) as min_prep_days,
        MAX(preparation_time_days) FILTER (WHERE preparation_time_days IS NOT NULL) as max_prep_days,

        -- Interview process statistics
        AVG(interview_rounds) FILTER (WHERE interview_rounds IS NOT NULL) as avg_rounds,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY interview_rounds) FILTER (WHERE interview_rounds IS NOT NULL) as median_rounds,

        -- Practice statistics
        AVG(practice_problem_count) FILTER (WHERE practice_problem_count IS NOT NULL) as avg_problems_solved,
        AVG(mock_interviews_count) FILTER (WHERE mock_interviews_count IS NOT NULL) as avg_mock_interviews,

        -- Success correlation
        AVG(preparation_time_days) FILTER (WHERE llm_outcome = 'passed' AND preparation_time_days IS NOT NULL) as avg_prep_days_success,
        AVG(preparation_time_days) FILTER (WHERE llm_outcome = 'failed' AND preparation_time_days IS NOT NULL) as avg_prep_days_failure,

        -- Data coverage
        COUNT(*) FILTER (WHERE preparation_time_days IS NOT NULL) as posts_with_prep_time,
        COUNT(*) FILTER (WHERE interview_rounds IS NOT NULL) as posts_with_rounds,
        COUNT(*) FILTER (WHERE practice_problem_count IS NOT NULL) as posts_with_practice_count
      FROM scraped_posts
      WHERE post_id = ANY($1)
    `, [postIds]);

    const stats = result.rows[0];

    logger.info(`[TimelineData] Stats: avg_prep=${stats.avg_prep_days?.toFixed(0)} days, median=${stats.median_prep_days}, posts_with_data=${stats.posts_with_prep_time}`);

    return {
      preparation: {
        avg_days: stats.avg_prep_days ? Math.round(stats.avg_prep_days) : null,
        median_days: stats.median_prep_days ? Math.round(stats.median_prep_days) : null,
        min_days: stats.min_prep_days,
        max_days: stats.max_prep_days,
        posts_with_data: parseInt(stats.posts_with_prep_time) || 0
      },
      interview_process: {
        avg_rounds: stats.avg_rounds ? parseFloat(stats.avg_rounds).toFixed(1) : null,
        median_rounds: stats.median_rounds ? Math.round(stats.median_rounds) : null,
        posts_with_data: parseInt(stats.posts_with_rounds) || 0
      },
      practice: {
        avg_problems_solved: stats.avg_problems_solved ? Math.round(stats.avg_problems_solved) : null,
        avg_mock_interviews: stats.avg_mock_interviews ? parseFloat(stats.avg_mock_interviews).toFixed(1) : null,
        posts_with_practice_data: parseInt(stats.posts_with_practice_count) || 0
      },
      success_correlation: {
        avg_prep_passed: stats.avg_prep_days_success ? Math.round(stats.avg_prep_days_success) : null,
        avg_prep_failed: stats.avg_prep_days_failure ? Math.round(stats.avg_prep_days_failure) : null
      },
      data_quality: {
        total_posts: postIds.length,
        coverage_prep_time: stats.posts_with_prep_time ? Math.round((stats.posts_with_prep_time / postIds.length) * 100) : 0,
        coverage_rounds: stats.posts_with_rounds ? Math.round((stats.posts_with_rounds / postIds.length) * 100) : 0
      }
    };
  } catch (error) {
    logger.error('[TimelineData] Database aggregation failed:', error.message);
    return {
      preparation: { avg_days: null, median_days: null, posts_with_data: 0 },
      interview_process: { avg_rounds: null, median_rounds: null, posts_with_data: 0 },
      practice: { avg_problems_solved: null, avg_mock_interviews: null },
      success_correlation: {},
      data_quality: { total_posts: postIds.length, coverage_prep_time: 0, coverage_rounds: 0 }
    };
  }
}

// ============================================================================
// LLM GENERATION
// ============================================================================

/**
 * Generate knowledge gaps via LLM
 * Creates categorized, prioritized list of areas to focus on
 */
async function generateKnowledgeGaps(strugglePatterns, failurePostsCount, totalPosts) {
  logger.info('[KnowledgeGaps] Generating knowledge gaps via LLM');

  // 🔍 DEBUG: Log input data
  logger.info(`[KnowledgeGaps] 🔍 Input data:`);
  logger.info(`  - failurePostsCount: ${failurePostsCount}`);
  logger.info(`  - totalPosts: ${totalPosts}`);
  logger.info(`  - strugglePatterns.struggle_areas length: ${strugglePatterns.struggle_areas?.length || 0}`);
  logger.info(`  - strugglePatterns.failed_skills length: ${strugglePatterns.failed_skills?.length || 0}`);
  logger.info(`  - Sample struggle_areas: ${JSON.stringify(strugglePatterns.struggle_areas?.slice(0, 2))}`);
  logger.info(`  - Sample failed_skills: ${JSON.stringify(strugglePatterns.failed_skills?.slice(0, 2))}`);

  const prompt = `You are an interview preparation expert analyzing ${failurePostsCount} failure experiences from ${totalPosts} total interview posts.

EVIDENCE FROM REAL FAILURE PATTERNS:
- Explicit struggle areas: ${JSON.stringify(strugglePatterns.struggle_areas.slice(0, 5), null, 2)}
- Skills tested but failed: ${JSON.stringify(strugglePatterns.failed_skills.slice(0, 5), null, 2)}
- Total failure posts analyzed: ${failurePostsCount}

TASK: Create a prioritized list of knowledge gaps based on the evidence.

REQUIREMENTS:
1. Each gap must have:
   - Area name (clear, specific)
   - Struggle percentage (based on evidence)
   - Evidence count (number of posts mentioning this gap)
   - Recommendation (specific, actionable advice)
   - Source post IDs (empty array, will be filled by backend)

2. Prioritize gaps by:
   - Frequency in failure posts
   - Severity of impact
   - Recency of mentions

3. Focus on ACTIONABLE gaps:
   - Not too broad ("algorithms")
   - Not too narrow ("LeetCode 234")
   - Just right ("Dynamic Programming patterns", "System Design scalability")

4. Base ALL percentages on the actual evidence provided

Return JSON array of knowledge gaps with this structure:
[{
  "area": "System Design",
  "struggle_percentage": 43,
  "evidence_count": 67,
  "recommendation": "Focus on distributed systems patterns, caching strategies, and load balancing. Practice designing scalable systems like Twitter, Netflix, or Uber.",
  "source_post_ids": []
}, ...]

CRITICAL: Return ONLY the JSON array, no explanation. Maximum 8 gaps.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, { max_tokens: 4000, temperature: 0.7 });

    // 🔍 DEBUG: Log raw LLM response
    logger.info(`[KnowledgeGaps] 🔍 Raw LLM response (first 1000 chars): ${response.substring(0, 1000)}`);
    logger.info(`[KnowledgeGaps] 🔍 Response length: ${response.length} characters`);

    let gaps = extractJsonFromString(response);

    // 🔍 DEBUG: Log extraction result
    logger.info(`[KnowledgeGaps] 🔍 Extracted gaps type: ${Array.isArray(gaps) ? 'array' : typeof gaps}`);
    logger.info(`[KnowledgeGaps] 🔍 Extracted gaps: ${JSON.stringify(gaps).substring(0, 500)}`);

    // Ensure gaps is an array
    if (!Array.isArray(gaps)) {
      if (gaps && typeof gaps === 'object') {
        // Try to extract array from common wrapper properties
        gaps = gaps.gaps || gaps.knowledge_gaps || gaps.data || Object.values(gaps);
        if (!Array.isArray(gaps)) {
          logger.warn('[KnowledgeGaps] Could not extract array from object, using fallback');
          return generateFallbackKnowledgeGaps(strugglePatterns, failurePostsCount);
        }
      } else {
        logger.warn('[KnowledgeGaps] Gaps is not an array, using fallback');
        return generateFallbackKnowledgeGaps(strugglePatterns, failurePostsCount);
      }
    }

    // Fill in source_post_ids from actual evidence
    gaps.forEach(gap => {
      const matchingArea = strugglePatterns.struggle_areas.find(a =>
        a.area.toLowerCase().includes(gap.area.toLowerCase()) ||
        gap.area.toLowerCase().includes(a.area.toLowerCase())
      );
      if (matchingArea) {
        gap.source_post_ids = matchingArea.posts.slice(0, 20);
      }
    });

    logger.info(`[KnowledgeGaps] Generated ${gaps.length} knowledge gaps successfully`);
    return gaps;
  } catch (error) {
    logger.error('[KnowledgeGaps] LLM generation failed, using fallback:', error);
    return generateFallbackKnowledgeGaps(strugglePatterns, failurePostsCount);
  }
}

/**
 * Generate curated resources via LLM
 * Ranks resources by effectiveness and mentions
 */
async function generateCuratedResources(resourcePatterns, resourcePostsCount, totalPosts) {
  logger.info('[Resources] Generating curated resources via LLM');

  const topResources = resourcePatterns.resources
    .filter(r => r.total_mentions >= 3)  // At least 3 mentions
    .sort((a, b) => {
      // Sort by success rate, then by total mentions
      const successDiff = parseFloat(b.success_rate) - parseFloat(a.success_rate);
      return successDiff !== 0 ? successDiff : b.total_mentions - a.total_mentions;
    })
    .slice(0, 15);

  const prompt = `You are an interview preparation expert analyzing ${resourcePostsCount} posts from ${totalPosts} total posts that mention preparation resources.

EVIDENCE FROM REAL RESOURCE MENTIONS:
${JSON.stringify(topResources.map(r => ({
  name: r.name,
  mentions: r.total_mentions,
  success_rate: r.success_rate + '%'
})), null, 2)}

LEETCODE PATTERNS:
- LeetCode Premium: ${resourcePatterns.leetcode_patterns.premium.total} mentions, ${resourcePatterns.leetcode_patterns.premium.total > 0 ? (resourcePatterns.leetcode_patterns.premium.success / resourcePatterns.leetcode_patterns.premium.total * 100).toFixed(1) : 0}% success rate
- LeetCode Free: ${resourcePatterns.leetcode_patterns.free.total} mentions, ${resourcePatterns.leetcode_patterns.free.total > 0 ? (resourcePatterns.leetcode_patterns.free.success / resourcePatterns.leetcode_patterns.free.total * 100).toFixed(1) : 0}% success rate

TASK: Curate and rank the most effective resources based on the evidence.

REQUIREMENTS:
1. Each resource must have:
   - Resource name (exact name from evidence)
   - Type (Book, Course, Platform, Problem Set)
   - Mention count (from evidence)
   - Success rate (from evidence, percentage)
   - Description (what it covers, why it's effective)
   - Source post IDs (empty array, will be filled by backend)

2. Only include resources with:
   - At least 3 mentions OR
   - Success rate >= 60%

3. Rank by effectiveness (success rate) and popularity (mentions)

4. Base ALL statistics on the actual evidence provided

Return JSON array of curated resources with this structure:
[{
  "name": "LeetCode Premium",
  "type": "Platform",
  "mention_count": 67,
  "success_rate": 78,
  "description": "Comprehensive problem set with company-specific questions. Most effective for FAANG prep.",
  "source_post_ids": []
}, ...]

CRITICAL: Return ONLY the JSON array, no explanation. Maximum 10 resources.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, { max_tokens: 4000, temperature: 0.7 });

    // 🔍 DEBUG: Log raw LLM response
    logger.info(`[Resources] 🔍 Raw LLM response (first 1000 chars): ${response.substring(0, 1000)}`);
    logger.info(`[Resources] 🔍 Response length: ${response.length} characters`);

    const resources = extractJsonFromString(response);

    // 🔍 DEBUG: Log extraction result
    logger.info(`[Resources] 🔍 Extracted resources type: ${Array.isArray(resources) ? 'array' : typeof resources}`);
    logger.info(`[Resources] 🔍 Extracted resources: ${JSON.stringify(resources).substring(0, 500)}`);

    // Fill in source_post_ids from actual evidence
    resources.forEach(resource => {
      const matchingResource = resourcePatterns.resources.find(r =>
        r.name.toLowerCase().includes(resource.name.toLowerCase()) ||
        resource.name.toLowerCase().includes(r.name.toLowerCase())
      );
      if (matchingResource) {
        resource.source_post_ids = matchingResource.post_ids.slice(0, 30);
      }
    });

    logger.info(`[Resources] Generated ${resources.length} curated resources successfully`);
    return resources;
  } catch (error) {
    logger.error('[Resources] LLM generation failed, using fallback:', error);
    return generateFallbackResources(resourcePatterns);
  }
}

// ============================================================================
// FALLBACK GENERATION (if LLM fails)
// ============================================================================

function generateFallbackKnowledgeGaps(strugglePatterns, failurePostsCount) {
  logger.warn('[KnowledgeGaps] Using fallback gap generation');

  return strugglePatterns.struggle_areas.slice(0, 5).map(area => ({
    area: area.area,
    struggle_percentage: Math.round((area.count / failurePostsCount) * 100),
    evidence_count: area.count,
    recommendation: `Focus on improving ${area.area} based on ${area.count} reported struggles.`,
    source_post_ids: (area.source_post_ids || []).slice(0, 20)
  }));
}

function generateFallbackResources(resourcePatterns) {
  logger.warn('[Resources] Using fallback resource generation');

  return resourcePatterns.resources.slice(0, 8).map(r => ({
    name: r.name,
    type: 'Resource',
    mention_count: r.total_mentions,
    success_rate: parseFloat(r.success_rate),
    description: `Mentioned in ${r.total_mentions} posts with ${r.success_rate}% success rate.`,
    source_post_ids: r.post_ids.slice(0, 30)
  }));
}

/**
 * ========================================
 * MIGRATION 27: COMMON PITFALLS SECTION
 * ========================================
 * Database-first aggregation of mistakes_made and rejection_reasons
 */
async function aggregateCommonPitfalls(sourcePosts) {
  logger.info('[CommonPitfalls] Aggregating from database (Migration 27 fields)');

  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      pitfalls: [],
      evidence_quality: {
        posts_analyzed: 0,
        has_sufficient_data: false
      }
    };
  }

  try {
    // Aggregate mistakes_made (JSONB)
    const mistakesResult = await pool.query(`
      SELECT
        mistake_obj->>'mistake' as mistake,
        mistake_obj->>'severity' as severity,
        mistake_obj->>'category' as category,
        COUNT(*) as mention_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(mistakes_made, '[]'::jsonb)) AS mistake_obj
      WHERE post_id = ANY($1)
        AND mistakes_made IS NOT NULL
        AND jsonb_array_length(mistakes_made) > 0
      GROUP BY mistake_obj->>'mistake', mistake_obj->>'severity', mistake_obj->>'category'
      HAVING COUNT(*) >= 2
      ORDER BY mention_count DESC
      LIMIT 15
    `, [postIds]);

    // Aggregate rejection_reasons (text[])
    const rejectionsResult = await pool.query(`
      SELECT
        UNNEST(rejection_reasons) as reason,
        COUNT(*) as mention_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts
      WHERE post_id = ANY($1)
        AND rejection_reasons IS NOT NULL
        AND array_length(rejection_reasons, 1) > 0
      GROUP BY reason
      HAVING COUNT(*) >= 2
      ORDER BY mention_count DESC
      LIMIT 10
    `, [postIds]);

    // Count posts with data for evidence quality
    const coverageResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN mistakes_made IS NOT NULL AND jsonb_array_length(mistakes_made) > 0 THEN 1 END) as has_mistakes,
        COUNT(CASE WHEN rejection_reasons IS NOT NULL AND array_length(rejection_reasons, 1) > 0 THEN 1 END) as has_rejections
      FROM scraped_posts
      WHERE post_id = ANY($1)
    `, [postIds]);

    const postsWithData = Math.max(
      parseInt(coverageResult.rows[0].has_mistakes) || 0,
      parseInt(coverageResult.rows[0].has_rejections) || 0
    );

    // Combine mistakes and rejections into unified pitfalls format
    const pitfalls = [
      ...mistakesResult.rows.map(row => ({
        pitfall: row.mistake,
        category: row.category || 'Technical',
        severity: row.severity || 'Medium',
        mention_count: parseInt(row.mention_count),
        source_post_ids: row.source_post_ids.slice(0, 20),
        type: 'mistake'
      })),
      ...rejectionsResult.rows.map(row => ({
        pitfall: row.reason,
        category: 'Rejection',
        severity: 'High',
        mention_count: parseInt(row.mention_count),
        source_post_ids: row.source_post_ids.slice(0, 20),
        type: 'rejection'
      }))
    ].sort((a, b) => b.mention_count - a.mention_count).slice(0, 12);

    logger.info(`[CommonPitfalls] Found ${pitfalls.length} common pitfalls from ${postsWithData} posts with data`);

    return {
      pitfalls,
      evidence_quality: {
        posts_analyzed: postsWithData,
        total_posts: sourcePosts.length,
        has_sufficient_data: postsWithData >= 15,
        confidence: postsWithData >= 40 ? 'high' : postsWithData >= 20 ? 'medium' : 'low'
      }
    };
  } catch (error) {
    logger.error('[CommonPitfalls] Database aggregation failed:', error.message);
    return {
      pitfalls: [],
      evidence_quality: {
        posts_analyzed: 0,
        total_posts: sourcePosts.length,
        has_sufficient_data: false,
        confidence: 'low'
      }
    };
  }
}

/**
 * ========================================
 * MIGRATION 27: READINESS CHECKLIST SECTION
 * ========================================
 * Database-first aggregation of success_factors and improvement_areas
 */
async function aggregateReadinessChecklist(sourcePosts) {
  logger.info('[ReadinessChecklist] Aggregating from database (Migration 27 fields)');

  const postIds = sourcePosts.map(p => p.post_id);

  if (postIds.length === 0) {
    return {
      checklist_items: [],
      evidence_quality: {
        posts_analyzed: 0,
        has_sufficient_data: false
      }
    };
  }

  try {
    // Aggregate success_factors (JSONB) - these become "Must Have" checklist items
    const successResult = await pool.query(`
      SELECT
        factor_obj->>'factor' as factor,
        factor_obj->>'category' as category,
        factor_obj->>'impact' as impact,
        COUNT(*) as mention_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts,
           JSONB_ARRAY_ELEMENTS(COALESCE(success_factors, '[]'::jsonb)) AS factor_obj
      WHERE post_id = ANY($1)
        AND success_factors IS NOT NULL
        AND jsonb_array_length(success_factors) > 0
      GROUP BY factor_obj->>'factor', factor_obj->>'category', factor_obj->>'impact'
      HAVING COUNT(*) >= 2
      ORDER BY mention_count DESC
      LIMIT 15
    `, [postIds]);

    // Aggregate improvement_areas (text[]) - these become "Need to Improve" checklist items
    const improvementResult = await pool.query(`
      SELECT
        UNNEST(improvement_areas) as area,
        COUNT(*) as mention_count,
        ARRAY_AGG(DISTINCT post_id) as source_post_ids
      FROM scraped_posts
      WHERE post_id = ANY($1)
        AND improvement_areas IS NOT NULL
        AND array_length(improvement_areas, 1) > 0
      GROUP BY area
      HAVING COUNT(*) >= 2
      ORDER BY mention_count DESC
      LIMIT 10
    `, [postIds]);

    // Count posts with data for evidence quality
    const coverageResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN success_factors IS NOT NULL AND jsonb_array_length(success_factors) > 0 THEN 1 END) as has_success,
        COUNT(CASE WHEN improvement_areas IS NOT NULL AND array_length(improvement_areas, 1) > 0 THEN 1 END) as has_improvements
      FROM scraped_posts
      WHERE post_id = ANY($1)
    `, [postIds]);

    const postsWithData = Math.max(
      parseInt(coverageResult.rows[0].has_success) || 0,
      parseInt(coverageResult.rows[0].has_improvements) || 0
    );

    // Combine success factors and improvement areas into unified checklist format
    const checklist_items = [
      ...successResult.rows.map(row => ({
        item: row.factor,
        category: row.category || 'Technical',
        priority: row.impact === 'high' ? 'Critical' : row.impact === 'medium' ? 'Important' : 'Recommended',
        mention_count: parseInt(row.mention_count),
        source_post_ids: row.source_post_ids.slice(0, 20),
        type: 'strength',
        status: 'must_have'
      })),
      ...improvementResult.rows.map(row => ({
        item: row.area,
        category: 'Improvement',
        priority: 'Important',
        mention_count: parseInt(row.mention_count),
        source_post_ids: row.source_post_ids.slice(0, 20),
        type: 'weakness',
        status: 'need_work'
      }))
    ].sort((a, b) => {
      // Sort by priority first (Critical > Important > Recommended), then by mention count
      const priorityOrder = { 'Critical': 0, 'Important': 1, 'Recommended': 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return priorityDiff !== 0 ? priorityDiff : b.mention_count - a.mention_count;
    }).slice(0, 15);

    logger.info(`[ReadinessChecklist] Found ${checklist_items.length} checklist items from ${postsWithData} posts with data`);

    return {
      checklist_items,
      evidence_quality: {
        posts_analyzed: postsWithData,
        total_posts: sourcePosts.length,
        has_sufficient_data: postsWithData >= 15,
        confidence: postsWithData >= 40 ? 'high' : postsWithData >= 20 ? 'medium' : 'low'
      }
    };
  } catch (error) {
    logger.error('[ReadinessChecklist] Database aggregation failed:', error.message);
    return {
      checklist_items: [],
      evidence_quality: {
        posts_analyzed: 0,
        total_posts: sourcePosts.length,
        has_sufficient_data: false,
        confidence: 'low'
      }
    };
  }
}

module.exports = {
  extractKnowledgeGaps,
  extractCuratedResources,
  // Migration 27: Database-first aggregation functions
  aggregateSuccessFactors,
  aggregateResourcesFromDB,
  aggregateTimelineData,
  aggregateCommonPitfalls,
  aggregateReadinessChecklist
};
