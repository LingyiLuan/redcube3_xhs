/**
 * Learning Map Streaming Controller
 *
 * Uses Server-Sent Events (SSE) to stream learning map generation progress
 * This prevents Cloudflare timeout (100s) by sending progress updates
 *
 * Flow:
 * 1. Client opens SSE connection
 * 2. Server streams progress events as each phase completes
 * 3. Final event contains the complete learning map
 */

const learningMapGeneratorService = require('../services/learningMapGeneratorService');
const learningMapEnhancementsService = require('../services/learningMapEnhancementsService');
const timelineMilestoneEnhancementService = require('../services/timelineMilestoneEnhancementService');
const learningMapsQueries = require('../database/learningMapsQueries');
const logger = require('../utils/logger');

/**
 * Generate learning map with SSE streaming
 * POST /api/content/learning-map/stream
 *
 * SSE Events:
 * - progress: { phase, message, percent }
 * - data: { partial data as it becomes available }
 * - complete: { full learning map }
 * - error: { error message }
 */
async function generateLearningMapStream(req, res) {
  const { reportId, userGoals, userId } = req.body;

  // Validate request
  if (!userId) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'userId is required'
    });
  }

  if (!reportId) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'reportId is required'
    });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Helper to send SSE events
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial connection confirmation
  sendEvent('connected', { message: 'SSE connection established', reportId });

  try {
    logger.info(`[Learning Map Stream] Starting generation for report: ${reportId}`);

    // Phase 1: Load cached report data
    sendEvent('progress', { phase: 1, message: 'Loading analysis report...', percent: 5 });

    const { getCachedBatchData } = require('./analysisController');
    const cachedData = await getCachedBatchData(reportId);

    if (!cachedData || !cachedData.patternAnalysis) {
      sendEvent('error', { message: 'Report not found or missing pattern analysis' });
      return res.end();
    }

    const patterns = cachedData.patternAnalysis;
    const sourcePosts = patterns.source_posts || [];

    sendEvent('progress', {
      phase: 1,
      message: `Loaded ${sourcePosts.length} posts from analysis`,
      percent: 10
    });

    // Phase 2: Generate base learning map (this is the heavy LLM work)
    sendEvent('progress', { phase: 2, message: 'Generating learning map structure...', percent: 15 });

    // Use the optimized generator that skips detailed daily schedules
    const baseLearningMap = await generateOptimizedLearningMap(
      reportId,
      { ...userGoals, userId },
      (progress) => sendEvent('progress', progress)
    );

    sendEvent('progress', { phase: 2, message: 'Base learning map generated', percent: 55 });

    // Phase 2.5: Generate detailed hour-by-hour schedules for timeline weeks
    // DEBUG MODE: No fallbacks - let errors surface so we can fix them
    sendEvent('progress', { phase: 2, message: 'Generating detailed daily schedules...', percent: 58 });

    const pool = require('../config/database');

    // Get interview questions from source posts (real data, NOT curated_problems fallback)
    const postIds = cachedData.patternAnalysis?.source_posts?.map(p => p.post_id) || [];
    logger.info(`[LearningMapStream] Fetching interview questions from ${postIds.length} source posts...`);

    const problemsResult = await pool.query(`
      SELECT DISTINCT
        iq.id,
        COALESCE(iq.question_text, iq.raw_question) as name,
        COALESCE(iq.difficulty, 'Medium') as difficulty,
        COALESCE(iq.llm_category, iq.question_type, 'Algorithm') as category,
        COALESCE(iq.llm_category, 'General') as module,
        iq.leetcode_number
      FROM interview_questions iq
      WHERE iq.post_id = ANY($1)
        AND (iq.question_text IS NOT NULL OR iq.raw_question IS NOT NULL)
      ORDER BY iq.difficulty, iq.llm_category
      LIMIT 200
    `, [postIds]);
    const allProblems = problemsResult.rows;
    logger.info(`[LearningMapStream] Found ${allProblems.length} interview questions from source posts`);

    // Enhance timeline weeks with hour-by-hour schedules (disable LLM for speed)
    if (baseLearningMap.timeline && baseLearningMap.timeline.weeks) {
      logger.info(`[LearningMapStream] Enhancing ${baseLearningMap.timeline.weeks.length} weeks with detailed schedules...`);
      const enhancedWeeks = await timelineMilestoneEnhancementService.enhanceWeeksWithDetailedSchedules(
        baseLearningMap.timeline.weeks,
        allProblems,
        6, // hours per day
        false // disable LLM enhancement for speed
      );
      baseLearningMap.timeline.weeks = enhancedWeeks;
      logger.info(`[LearningMapStream] Added detailed_daily_schedules to ${enhancedWeeks.filter(w => w.detailed_daily_schedules).length}/${enhancedWeeks.length} weeks`);
    }

    sendEvent('progress', { phase: 2, message: 'Daily schedules generated', percent: 60 });

    // Phase 3: Apply enhancements
    sendEvent('progress', { phase: 3, message: 'Enhancing with company tracks...', percent: 65 });

    const learningMap = patterns
      ? await learningMapEnhancementsService.enhanceLearningMap(
          baseLearningMap,
          patterns,
          userGoals?.targetCompany || null
        )
      : baseLearningMap;

    sendEvent('progress', { phase: 3, message: 'Enhancements applied', percent: 80 });

    // Phase 4: Save to database
    sendEvent('progress', { phase: 4, message: 'Saving learning map...', percent: 85 });

    const savedMap = await learningMapsQueries.saveLearningMap({
      user_id: userId,
      title: learningMap.title,
      summary: learningMap.foundation.seed_companies.join(', ') + ' Interview Prep',
      difficulty: learningMap.foundation.data_coverage,
      timeline_weeks: learningMap.timeline.total_weeks,
      is_crazy_plan: false,
      milestones: learningMap.milestones || [],
      outcomes: learningMap.expected_outcomes || {},
      next_steps: [],
      analysis_count: learningMap.foundation.total_posts_analyzed,
      analysis_ids: learningMap.source_data.generated_from_analysis_ids || [],
      user_goals: userGoals || {},
      personalization_score: learningMap.foundation.data_coverage === 'High' ? 0.9 : 0.7,
      source_report_id: reportId,
      foundation_posts: learningMap.foundation.total_posts_analyzed,
      company_tracks: learningMap.company_tracks,
      analytics: learningMap.analytics,
      skills_roadmap: {},
      knowledge_gaps: learningMap.knowledge_gaps || {},
      curated_resources: learningMap.curated_resources || [],
      timeline: learningMap.timeline || {},
      expected_outcomes: learningMap.expected_outcomes || [],
      common_pitfalls: learningMap.common_pitfalls || null,
      readiness_checklist: learningMap.readiness_checklist || null,
      success_factors: learningMap.success_factors || [],
      database_resources: learningMap.database_resources || [],
      timeline_statistics: learningMap.timeline_statistics || null,
      pitfalls_narrative: learningMap.pitfalls_narrative || null,
      improvement_areas: learningMap.improvement_areas || null,
      resource_recommendations: learningMap.resource_recommendations || null,
      preparation_expectations: learningMap.preparation_expectations || null
    });

    sendEvent('progress', { phase: 4, message: 'Learning map saved', percent: 95 });

    // Final response
    const responseData = {
      ...learningMap,
      id: savedMap.id,
      created_at: savedMap.created_at,
      status: savedMap.status,
      progress: savedMap.progress
    };

    sendEvent('progress', { phase: 5, message: 'Complete!', percent: 100 });
    sendEvent('complete', {
      success: true,
      data: responseData,
      message: 'Learning map generated successfully'
    });

    logger.info(`[Learning Map Stream] Generation complete: ${savedMap.id}`);

  } catch (error) {
    logger.error('[Learning Map Stream] Generation failed:', error);
    sendEvent('error', {
      message: error.message || 'Failed to generate learning map',
      details: error.message.includes('Insufficient') ? 'insufficient_data' : 'generation_error'
    });
  }

  res.end();
}

/**
 * Optimized learning map generator
 * Skips the heavy LLM daily schedule enhancement to reduce generation time from 6-10 min to ~30-60s
 */
async function generateOptimizedLearningMap(reportId, userGoals, progressCallback) {
  const pool = require('../config/database');
  const { getCachedBatchData } = require('./analysisController');
  const { generateEnhancedTimeline, generateEnhancedMilestones } = require('../services/timelineMilestoneEnhancementService');
  const {
    extractKnowledgeGaps,
    extractCuratedResources,
    aggregateSuccessFactors,
    aggregateResourcesFromDB,
    aggregateTimelineData,
    aggregateCommonPitfalls,
    aggregateReadinessChecklist
  } = require('../services/knowledgeGapsResourcesService');

  const startTime = Date.now();
  logger.info(`[Learning Map Optimized] Starting generation for report: ${reportId}`);

  // 1. Load cached report data
  const cachedData = await getCachedBatchData(reportId);
  if (!cachedData || !cachedData.patternAnalysis) {
    throw new Error('Report not found or missing pattern analysis');
  }

  const patterns = cachedData.patternAnalysis;
  const sourcePosts = patterns.source_posts || [];
  const seedCompanies = patterns.seed_companies || [];
  const individualAnalyses = patterns.individual_analyses || [];

  // Validate foundation data
  if (sourcePosts.length < 20) {
    throw new Error(`Insufficient foundation data: ${sourcePosts.length} posts found (minimum 20 required).`);
  }

  progressCallback({ phase: 2, message: `Analyzing ${sourcePosts.length} posts...`, percent: 20 });

  // 2. Extract timeline data (fast DB query)
  const postIds = sourcePosts.map(p => p.post_id);
  const timelineResult = await pool.query(`
    SELECT
      AVG(prep_duration_weeks) as avg_prep_weeks,
      AVG(study_hours_per_week) as avg_study_hours,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY prep_duration_weeks) as median_prep_weeks,
      MIN(prep_duration_weeks) as min_prep_weeks,
      MAX(prep_duration_weeks) as max_prep_weeks,
      COUNT(prep_duration_weeks) as posts_with_timeline,
      COUNT(*) as total_posts
    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND prep_duration_weeks IS NOT NULL
      AND prep_duration_weeks > 0
      AND prep_duration_weeks < 52
  `, [postIds]);

  const row = timelineResult.rows[0];
  const coverage = row.total_posts > 0
    ? (row.posts_with_timeline / row.total_posts * 100).toFixed(1)
    : 0;

  if (row.posts_with_timeline === 0) {
    throw new Error('No timeline data available in foundation posts.');
  }

  const timelineData = {
    avg_prep_weeks: Math.round(row.avg_prep_weeks) || 12,
    avg_study_hours: row.avg_study_hours ? Math.round(row.avg_study_hours) : null,
    median_prep_weeks: Math.round(row.median_prep_weeks) || 12,
    prep_duration_range: [row.min_prep_weeks, row.max_prep_weeks],
    posts_with_data: row.posts_with_timeline,
    total_posts: row.total_posts,
    coverage_percent: parseFloat(coverage),
    has_warning: row.posts_with_timeline < 15
  };

  progressCallback({ phase: 2, message: 'Running parallel LLM operations...', percent: 25 });

  // 3. Run all operations in parallel - but SKIP the heavy daily schedule enhancement
  const [
    timeline,
    knowledgeGapsData,
    curatedResourcesData,
    successFactorsData,
    databaseResourcesData,
    timelineStatsData,
    commonPitfallsData,
    readinessChecklistData
  ] = await Promise.all([
    generateEnhancedTimelineOptimized(sourcePosts, timelineData, null, userGoals),
    extractKnowledgeGaps(sourcePosts, userGoals),
    extractCuratedResources(sourcePosts),
    aggregateSuccessFactors(sourcePosts),
    aggregateResourcesFromDB(sourcePosts),
    aggregateTimelineData(sourcePosts),
    aggregateCommonPitfalls(sourcePosts),
    aggregateReadinessChecklist(sourcePosts)
  ]);

  progressCallback({ phase: 2, message: 'LLM operations complete', percent: 45 });

  // 4. Generate milestones (depends on timeline)
  progressCallback({ phase: 2, message: 'Generating milestones...', percent: 50 });
  const milestones = await generateEnhancedMilestones(sourcePosts, timeline, null);

  progressCallback({ phase: 2, message: 'Building learning map...', percent: 55 });

  // 5. Build foundation metadata
  const foundation = {
    seed_posts_count: individualAnalyses.length,
    rag_posts_count: sourcePosts.length - individualAnalyses.length,
    total_posts_analyzed: sourcePosts.length,
    seed_companies: patterns.seed_companies || [],
    overall_success_rate: patterns.summary?.overall_success_rate || 'N/A',
    data_coverage: sourcePosts.length >= 50 ? 'High' : sourcePosts.length >= 30 ? 'Medium' : 'Low',
    avg_prep_duration_weeks: timelineData.avg_prep_weeks,
    median_prep_duration_weeks: timelineData.median_prep_weeks,
    prep_duration_range: timelineData.prep_duration_range,
    timeline_coverage_percent: timelineData.coverage_percent,
    timeline_has_warning: timelineData.has_warning,
    source_report_id: patterns.batch_id || patterns.id,
    foundation_post_urls: sourcePosts.map(p => p.url).filter(Boolean)
  };

  // 6. Build company tracks
  const companyTracks = buildCompanyTracks(patterns, userGoals);

  // 7. Knowledge gaps with remediation
  const knowledgeGaps = {
    ...knowledgeGapsData,
    gaps: knowledgeGapsData.gaps || [],
    remediation: mapKnowledgeGapsRemediation(knowledgeGapsData.gaps, timeline)
  };

  // 8. Calculate expected outcomes
  const successRate = parseFloat(foundation.overall_success_rate) || 0;
  const expectedOutcomes = {
    timeline_weeks: timeline.total_weeks,
    confidence_level: foundation.data_coverage,
    estimated_success_rate: `${Math.max(50, successRate - 10)}-${Math.min(95, successRate + 10)}%`,
    based_on_posts: foundation.total_posts_analyzed,
    data_notes: []
  };

  // 9. Build analytics
  const analytics = buildAnalytics(patterns, timeline, sourcePosts);

  // 10. Assemble final learning map
  const learningMap = {
    id: `map_${Date.now()}`,
    title: generateTitle(patterns, userGoals),
    created_at: new Date().toISOString(),
    user_id: userGoals.userId || 1,
    foundation,
    company_tracks: companyTracks,
    timeline,
    milestones,
    knowledge_gaps: knowledgeGaps,
    curated_resources: curatedResourcesData,
    success_factors: successFactorsData,
    database_resources: databaseResourcesData,
    timeline_statistics: timelineStatsData,
    common_pitfalls: commonPitfallsData,
    readiness_checklist: readinessChecklistData,
    expected_outcomes: expectedOutcomes,
    source_data: {
      foundation_posts: sourcePosts.length,
      seed_posts: individualAnalyses.length,
      rag_posts: sourcePosts.length - individualAnalyses.length,
      source_report_id: reportId,
      generated_from_analysis_ids: individualAnalyses.map(a => a.id),
      foundation_post_urls: sourcePosts.map(p => p.url).filter(Boolean)
    },
    analytics
  };

  logger.info(`[Learning Map Optimized] Generated in ${Date.now() - startTime}ms`);

  return learningMap;
}

/**
 * Optimized timeline generation - skips LLM daily schedule enhancement
 * Uses template-based daily tasks instead of per-day LLM calls
 */
async function generateEnhancedTimelineOptimized(sourcePosts, timelineData, skillModules, userGoals = {}) {
  const { analyzeWithOpenRouter, extractJsonFromString } = require('../services/aiService');
  const pool = require('../config/database');

  const totalWeeks = userGoals.timelineWeeks || timelineData.avg_prep_weeks || timelineData.median_prep_weeks || 12;
  logger.info(`[TimelineOptimized] Generating ${totalWeeks} weeks`);

  // Extract evidence for context
  const postIds = sourcePosts.map(p => p.post_id);
  const evidenceResult = await pool.query(`
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
  `, [postIds]);

  const successStories = evidenceResult.rows.filter(r =>
    r.outcome && (r.outcome.toLowerCase().includes('pass') || r.outcome.toLowerCase().includes('offer'))
  ).map(r => ({
    title: r.title,
    excerpt: r.excerpt?.substring(0, 100)
  }));

  // Single LLM call to generate all weeks at once
  const prompt = `You are an interview preparation expert analyzing ${sourcePosts.length} real Reddit interview experiences.

EVIDENCE FROM REAL POSTS:
- Success stories: ${JSON.stringify(successStories.slice(0, 5), null, 2)}
- Total posts analyzed: ${sourcePosts.length}

TASK: Create a ${totalWeeks}-week study plan.

REQUIREMENTS:
1. Each week must have:
   - Week number and title
   - Description (what to focus on)
   - Daily tasks (Monday-Sunday, 7 days) - simple strings
   - Skills covered (2-4 skills)

2. Daily tasks should be brief and actionable:
   - "Monday: Arrays & Strings - 3 problems, review solutions"
   - "Saturday: Mock interview simulation"
   - "Sunday: Rest and review"

3. Progression:
   - Weeks 1-3: Fundamentals (Easy/Medium)
   - Weeks 4-8: Advanced patterns (Medium/Hard)
   - Weeks 9+: Mock interviews, company-specific

Return JSON array of ${totalWeeks} weeks:
[{
  "week": 1,
  "title": "Foundations: Arrays & Strings",
  "description": "Master fundamental data structures",
  "daily_tasks": ["Monday: ...", "Tuesday: ...", ...],
  "skills_covered": ["Arrays", "Strings", "Hash Tables"]
}, ...]

CRITICAL: Return ONLY the JSON array, no explanation.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, {
      max_tokens: Math.max(4000, totalWeeks * 500),
      temperature: 0.7
    });

    let weeks = extractJsonFromString(response);

    if (!Array.isArray(weeks)) {
      if (weeks && typeof weeks === 'object') {
        weeks = weeks.weeks || weeks.timeline || weeks.data || Object.values(weeks);
      }
      if (!Array.isArray(weeks)) {
        weeks = generateFallbackWeeks(totalWeeks, sourcePosts.length);
      }
    }

    // Pad if needed
    while (weeks.length < totalWeeks) {
      weeks.push(generateFallbackWeek(weeks.length + 1, totalWeeks));
    }

    return {
      total_weeks: totalWeeks,
      weeks: weeks.slice(0, totalWeeks),
      data_warning: timelineData.has_warning ? {
        type: 'low_timeline_coverage',
        message: `Timeline based on ${timelineData.posts_with_data} posts (${timelineData.coverage_percent}% coverage).`,
        posts_with_data: timelineData.posts_with_data,
        total_posts: timelineData.total_posts
      } : null,
      evidence_quality: {
        posts_analyzed: sourcePosts.length,
        has_sufficient_data: sourcePosts.length >= 20,
        confidence: sourcePosts.length >= 50 ? 'high' : sourcePosts.length >= 30 ? 'medium' : 'low'
      }
    };
  } catch (error) {
    logger.error('[TimelineOptimized] LLM failed, using fallback:', error);
    return {
      total_weeks: totalWeeks,
      weeks: generateFallbackWeeks(totalWeeks, sourcePosts.length),
      data_warning: null,
      evidence_quality: {
        posts_analyzed: sourcePosts.length,
        has_sufficient_data: sourcePosts.length >= 20,
        confidence: 'low'
      }
    };
  }
}

// Helper functions
function generateFallbackWeeks(totalWeeks, totalPosts) {
  const weeks = [];
  for (let i = 1; i <= totalWeeks; i++) {
    weeks.push(generateFallbackWeek(i, totalWeeks));
  }
  return weeks;
}

function generateFallbackWeek(week, totalWeeks) {
  const progress = week / totalWeeks;
  let phase, skills;

  if (progress <= 0.33) {
    phase = 'Foundations';
    skills = ['Arrays', 'Strings', 'Hash Tables', 'Two Pointers'];
  } else if (progress <= 0.66) {
    phase = 'Advanced Patterns';
    skills = ['Trees', 'Graphs', 'Dynamic Programming', 'Binary Search'];
  } else {
    phase = 'Interview Prep';
    skills = ['System Design', 'Mock Interviews', 'Behavioral', 'Company-Specific'];
  }

  return {
    week,
    title: `Week ${week}: ${phase}`,
    description: `Focus on ${phase.toLowerCase()} with practical problems`,
    daily_tasks: [
      'Monday: Problem solving - 3 problems with analysis',
      'Tuesday: Pattern practice - 2-3 medium problems',
      'Wednesday: Deep dive - 1 hard problem with solutions',
      'Thursday: Review and optimize previous solutions',
      'Friday: Timed practice - 3 problems under pressure',
      'Saturday: Mock interview or light review',
      'Sunday: Rest and review week concepts'
    ],
    skills_covered: skills.slice(0, 3)
  };
}

function buildCompanyTracks(patterns, userGoals) {
  const tracks = [];
  const companyTrends = patterns.company_trends || [];
  const companyTieredQuestions = patterns.company_tiered_questions || {};

  if (companyTieredQuestions.yourCompanies) {
    companyTieredQuestions.yourCompanies.forEach(companyData => {
      const trend = companyTrends.find(t => t.company === companyData.company);
      if (trend && companyData.totalQuestions >= 3) {
        tracks.push({
          company: companyData.company,
          track_type: 'primary',
          difficulty_rating: trend.avg_difficulty || 4.0,
          success_rate: trend.success_rate || 0,
          total_questions: companyData.totalQuestions,
          questions: companyData.questions || [],
          category_breakdown: companyData.categoryBreakdown || [],
          based_on_posts: trend.total_posts || 0
        });
      }
    });
  }

  if (companyTieredQuestions.similarCompanies) {
    companyTieredQuestions.similarCompanies.slice(0, 2).forEach(companyData => {
      const trend = companyTrends.find(t => t.company === companyData.company);
      if (trend && companyData.totalQuestions >= 3) {
        tracks.push({
          company: companyData.company,
          track_type: 'secondary',
          difficulty_rating: trend.avg_difficulty || 4.0,
          success_rate: trend.success_rate || 0,
          total_questions: companyData.totalQuestions,
          questions: companyData.questions || [],
          category_breakdown: companyData.categoryBreakdown || [],
          relevance_score: companyData.relevanceScore || 0,
          based_on_posts: companyData.sourcePostCount || 0
        });
      }
    });
  }

  return tracks;
}

function mapKnowledgeGapsRemediation(gaps, timeline) {
  if (!gaps || gaps.length === 0) return [];
  return gaps.map((gap, idx) => ({
    ...gap,
    remediation_week: Math.floor((idx + 1) * (timeline.total_weeks / (gaps.length + 1)))
  }));
}

function buildAnalytics(patterns, timeline, sourcePosts) {
  const skillFrequency = patterns.skill_frequency || [];

  // Topic frequency
  const topicFrequency = {};
  skillFrequency.slice(0, 10).forEach(skill => {
    topicFrequency[skill.skill] = parseInt(skill.count || 0);
  });

  // Company breakdown
  const companyBreakdown = {};
  (patterns.seed_companies || []).forEach(company => {
    companyBreakdown[company] = 1;
  });

  // Calculate real success rate
  const postsWithOutcome = sourcePosts.filter(p => p.llm_outcome);
  let overallSuccessRate = null;
  if (postsWithOutcome.length > 0) {
    const successKeywords = ['pass', 'offer', 'accepted', 'got the job', 'hired'];
    const successfulPosts = postsWithOutcome.filter(p => {
      const outcome = (p.llm_outcome || '').toLowerCase();
      return successKeywords.some(keyword => outcome.includes(keyword));
    });
    overallSuccessRate = Math.round((successfulPosts.length / postsWithOutcome.length) * 100) / 100;
  }

  return {
    topicFrequency,
    companyBreakdown,
    totalCompanies: (patterns.seed_companies || []).length,
    totalPosts: sourcePosts.length,
    overallSuccessRate,
    dataQuality: {
      hasOutcomeData: postsWithOutcome.length,
      totalPosts: sourcePosts.length,
      outcomeCoverage: sourcePosts.length > 0
        ? (postsWithOutcome.length / sourcePosts.length * 100).toFixed(1) + '%'
        : '0%'
    }
  };
}

function generateTitle(patterns, userGoals) {
  const companies = patterns.seed_companies || [];
  const role = userGoals.target_role || 'Software Engineer';
  if (companies.length > 0) {
    return `${companies.join(', ')} ${role} Interview Preparation`;
  }
  return `${role} Interview Preparation Plan`;
}

module.exports = {
  generateLearningMapStream
};
