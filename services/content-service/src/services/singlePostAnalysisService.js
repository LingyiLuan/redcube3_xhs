/**
 * Single Post Analysis Service
 *
 * Provides comprehensive analysis of a single interview post with benchmark comparisons
 *
 * Design Principles:
 * - No mock data - all insights from real database data
 * - Conditional sections - hide if data unavailable
 * - Benchmark comparisons using pre-computed cache
 * - Professional, actionable insights
 *
 * Created: January 19, 2025
 */

const pool = require('../config/database');
const benchmarkCacheService = require('./benchmarkCacheService');
const logger = require('../utils/logger');

/**
 * Analyze a single post with comprehensive insights
 *
 * @param {string} postId - The ID of the post to analyze
 * @returns {Object} Comprehensive analysis with all sections
 */
async function analyzeSinglePost(postId) {
  logger.info(`[Single Post Analysis] Starting analysis for post: ${postId}`);

  try {
    // 1. Get the post data with all related information
    const post = await getPostWithMetadata(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // 2. Build analysis sections (all conditional)
    const analysis = {
      overview: await buildOverviewSection(post),
      benchmark: await buildBenchmarkSection(post),
      skills: await buildSkillsSection(post),
      questions: await buildQuestionsSection(post),
      similarExperiences: await buildSimilarExperiencesSection(post)
    };

    logger.info(`[Single Post Analysis] Analysis complete for post ${postId}`);
    return analysis;

  } catch (error) {
    logger.error('[Single Post Analysis] Error:', error);
    throw error;
  }
}

/**
 * Get post with all metadata, skills, questions, and related data
 */
async function getPostWithMetadata(postId) {
  const result = await pool.query(`
    SELECT
      p.post_id,
      p.metadata->>'company' as company,
      p.role_type,
      p.outcome,
      p.metadata->>'difficulty' as difficulty,
      p.created_at,
      p.body_text as content,
      p.tech_stack,
      p.frameworks
    FROM scraped_posts p
    WHERE p.post_id = $1
  `, [postId]);

  if (result.rows.length === 0) {
    return null;
  }

  const post = result.rows[0];

  // Combine tech_stack and frameworks as skills
  const techStack = Array.isArray(post.tech_stack) ? post.tech_stack : [];
  const frameworks = Array.isArray(post.frameworks) ? post.frameworks : [];
  const allSkills = [...techStack, ...frameworks].filter(Boolean);

  post.skills = allSkills.map(skill => ({ skill, count: 1 }));

  // Get questions for this post (if any)
  const questionsResult = await pool.query(`
    SELECT
      question_text,
      category,
      llm_difficulty as difficulty,
      success_rate_reported
    FROM interview_questions
    WHERE post_id = $1
    ORDER BY llm_difficulty DESC
  `, [postId]);

  post.questions = questionsResult.rows;

  return post;
}

/**
 * Section 1: Interview Overview
 * Always shown - contains basic post information
 */
async function buildOverviewSection(post) {
  return {
    company: post.company || 'Unknown',
    role: post.role_type || 'Unknown',
    outcome: post.outcome || 'unknown',
    difficulty: post.difficulty ? parseFloat(post.difficulty) : null,
    interviewDate: post.created_at || null,
    // Extract stages from content if available (Phase 2 enhancement)
    stages: null // TODO: NLP extraction for multi-stage detection
  };
}

/**
 * Section 2: Benchmark Comparison
 * Compares this post to industry benchmarks
 */
async function buildBenchmarkSection(post) {
  try {
    // Get role-specific benchmark data
    const roleBenchmark = await getRoleBenchmark(post.role_type);

    if (!roleBenchmark) {
      logger.warn(`[Single Post Analysis] No benchmark data for role: ${post.role_type}`);
      return null; // Hide section if no benchmark available
    }

    // Get company+stage benchmark data (if available)
    const stageBenchmark = await getCompanyStageBenchmark(post.company);

    return {
      successRate: {
        industry: parseFloat(roleBenchmark.success_rate) || 0,
        userOutcome: post.outcome
      },
      difficulty: {
        userRating: post.difficulty || null,
        industryAverage: parseFloat(roleBenchmark.avg_difficulty) || null,
        interpretation: generateDifficultyInterpretation(
          post.difficulty,
          parseFloat(roleBenchmark.avg_difficulty)
        )
      },
      stageBreakdown: stageBenchmark // Can be null
    };

  } catch (error) {
    logger.error('[Single Post Analysis] Error building benchmark section:', error);
    return null; // Hide section on error
  }
}

/**
 * Get role-specific benchmark from cache
 */
async function getRoleBenchmark(role) {
  if (!role || role === 'Unknown') {
    return null;
  }

  const benchmarkData = await benchmarkCacheService.getCachedRoleIntelligence();

  if (!benchmarkData || benchmarkData.length === 0) {
    return null;
  }

  // Find exact role match (case-insensitive)
  const roleMatch = benchmarkData.find(
    r => r.role && r.role.toLowerCase() === role.toLowerCase()
  );

  return roleMatch || null;
}

/**
 * Get company-specific stage benchmark
 */
async function getCompanyStageBenchmark(company) {
  if (!company || company === 'Unknown') {
    return null;
  }

  const stageBenchmark = await benchmarkCacheService.getCachedStageSuccess();

  if (!stageBenchmark || stageBenchmark.length === 0) {
    return null;
  }

  // Filter stages for this company
  const companyStages = stageBenchmark.filter(
    s => s.company && s.company.toLowerCase() === company.toLowerCase()
  );

  if (companyStages.length === 0) {
    return null;
  }

  // Format stage data
  return companyStages.map(stage => ({
    stage: stage.interview_stage,
    successRate: parseFloat(stage.success_rate) || 0,
    totalPosts: stage.total_posts
  }));
}

/**
 * Generate difficulty interpretation text
 */
function generateDifficultyInterpretation(userDifficulty, industryAvg) {
  if (!userDifficulty || !industryAvg) {
    return null;
  }

  const diff = userDifficulty - industryAvg;

  if (Math.abs(diff) < 0.3) {
    return 'Your interview difficulty was typical for this role';
  } else if (diff > 0) {
    return `Your interview was ${diff.toFixed(1)} points harder than average`;
  } else {
    return `Your interview was ${Math.abs(diff).toFixed(1)} points easier than average`;
  }
}

/**
 * Section 3: Skills Performance Analysis
 * Shows skills tested and benchmark comparison
 */
async function buildSkillsSection(post) {
  if (!post.skills || post.skills.length === 0) {
    logger.warn(`[Single Post Analysis] No skills data for post ${post.post_id}`);
    return null; // Hide section if no skills
  }

  try {
    // Get role benchmark to compare skills
    const roleBenchmark = await getRoleBenchmark(post.role_type);

    const skillsAnalysis = post.skills.slice(0, 10).map(skill => ({
      name: skill.skill,
      frequency: skill.count,
      // Performance inference from post content (Phase 2 enhancement)
      performance: null, // TODO: NLP extraction for performance indicators
      benchmark: {
        // This would come from skill success correlation data
        successRate: null, // TODO: Add to benchmark cache
        percentile: null
      }
    }));

    // Gap analysis (only if we have performance data)
    const gapAnalysis = buildGapAnalysis(post, skillsAnalysis);

    return {
      tested: skillsAnalysis,
      gapAnalysis: gapAnalysis
    };

  } catch (error) {
    logger.error('[Single Post Analysis] Error building skills section:', error);
    return null;
  }
}

/**
 * Build gap analysis based on skills and outcome
 */
function buildGapAnalysis(post, skillsAnalysis) {
  // Only provide gap analysis for failures with skill data
  if (post.outcome !== 'failed' || !skillsAnalysis || skillsAnalysis.length === 0) {
    return null;
  }

  // Basic gap analysis based on available data
  // TODO: Enhance with NLP extraction of performance indicators from post content
  return {
    criticalGap: 'Unable to determine specific gap from available data',
    evidence: [
      'Post marked as failed',
      `${skillsAnalysis.length} skills were tested`
    ],
    likelyImpact: 'Analysis requires post content examination'
  };
}

/**
 * Section 4: Interview Questions Intelligence
 * Shows specific questions asked (if extracted)
 */
async function buildQuestionsSection(post) {
  if (!post.questions || post.questions.length === 0) {
    logger.info(`[Single Post Analysis] No questions data for post ${post.post_id}`);
    return null; // Hide section if no questions
  }

  return post.questions.map(q => ({
    question: q.question_text,
    type: q.category || 'Unknown',
    difficulty: q.difficulty || null,
    successRate: q.success_rate_reported || null,
    userPerformance: null // TODO: Extract from post content via NLP
  }));
}

/**
 * Section 5: Similar Interview Experiences
 * Finds and displays similar posts from foundation pool
 */
async function buildSimilarExperiencesSection(post) {
  try {
    // Find similar posts: same company + role, mix of outcomes
    const similarPosts = await findSimilarPosts(post);

    if (!similarPosts || similarPosts.length < 3) {
      logger.warn(`[Single Post Analysis] Insufficient similar posts (found ${similarPosts?.length || 0})`);
      return null; // Hide section if <3 similar posts
    }

    return similarPosts.slice(0, 5).map(p => ({
      id: p.id,
      company: p.company,
      role: p.role,
      outcome: p.outcome,
      difficulty: p.difficulty,
      keySkills: p.skills ? p.skills.split(',').slice(0, 5) : [],
      summary: generatePostSummary(p),
      followUp: null // Could extract from post content in Phase 2
    }));

  } catch (error) {
    logger.error('[Single Post Analysis] Error building similar experiences:', error);
    return null;
  }
}

/**
 * Find similar posts from scraped_posts table
 * Prioritize same outcome, but include opposite for contrast
 */
async function findSimilarPosts(targetPost) {
  const result = await pool.query(`
    SELECT
      p.post_id as id,
      p.metadata->>'company' as company,
      p.role_type as role,
      p.outcome,
      p.metadata->>'difficulty' as difficulty,
      p.body_text as content,
      ARRAY_TO_STRING(COALESCE(p.tech_stack, ARRAY[]::text[]) || COALESCE(p.frameworks, ARRAY[]::text[]), ', ') as skills
    FROM scraped_posts p
    WHERE
      p.post_id != $1
      AND p.metadata->>'company' IS NOT NULL
      AND p.role_type IS NOT NULL
      AND LOWER(p.metadata->>'company') = LOWER($2)
      AND LOWER(p.role_type) = LOWER($3)
      AND p.outcome IS NOT NULL
    ORDER BY
      (p.outcome = $4) DESC,  -- Prioritize same outcome
      p.created_at DESC
    LIMIT 10
  `, [targetPost.post_id, targetPost.company, targetPost.role_type, targetPost.outcome]);

  return result.rows;
}

/**
 * Generate brief summary for similar post
 */
function generatePostSummary(post) {
  const outcome = post.outcome === 'failed' ? 'Failed' : post.outcome === 'passed' ? 'Passed' : 'Outcome not specified';
  const difficulty = post.difficulty ? `, difficulty ${post.difficulty}/5` : '';

  // Extract key phrase from content if available (first 100 chars)
  let snippet = '';
  if (post.content && post.content.length > 20) {
    snippet = ` - "${post.content.substring(0, 100)}..."`;
  }

  return `${outcome}${difficulty}${snippet}`;
}

module.exports = {
  analyzeSinglePost
};
