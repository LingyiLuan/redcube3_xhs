/**
 * Learning Map Enhancements Service
 *
 * PURPOSE: Add strategic enhancements to learning maps per redesign plan
 * - Company-specific question tracks with REAL questions from database
 * - Daily breakdowns for weekly plans
 * - Resource curation from successful candidates
 * - Evidence-based recommendations
 *
 * STRATEGY: Database + LLM Hybrid
 * - Fetch real data from postgres (questions, resources, success patterns)
 * - Use LLM to synthesize narrative and structure
 * - NO GENERIC ADVICE - everything backed by actual data
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const { analyzeWithOpenRouter, extractJsonFromString } = require('./aiService');
const { getTopResources } = require('./resourceExtractionService');

// ============================================================================
// COMPANY-SPECIFIC QUESTION TRACKS
// ============================================================================

/**
 * Build company-specific tracks with ACTUAL questions from database
 * Each track shows:
 * - Real interview questions asked at that company
 * - Frequency of each question type
 * - Success patterns from candidates who passed
 * - Recommended preparation order
 *
 * @param {String} company - Target company name
 * @param {Array} sourcePosts - Foundation posts (seed + RAG)
 * @returns {Object} Company track with real questions
 */
async function buildCompanySpecificTrack(company, sourcePosts) {

  // 1. Fetch real interview questions for this company
  const questionsResult = await pool.query(`
    SELECT
      iq.id,
      iq.question_text,
      iq.question_type,
      iq.llm_category,
      iq.difficulty,
      iq.interview_stage,
      iq.post_id,
      COUNT(*) OVER (PARTITION BY iq.question_text) as frequency,
      sp.outcome as source_outcome
    FROM interview_questions iq
    JOIN scraped_posts sp ON sp.post_id = iq.post_id
    WHERE iq.company ILIKE $1
      AND iq.question_text IS NOT NULL
      AND LENGTH(iq.question_text) > 10
    ORDER BY frequency DESC, iq.difficulty ASC
    LIMIT 50
  `, [`%${company}%`]);

  const questions = questionsResult.rows;


  if (questions.length === 0) {
    return null; // No data for this company
  }

  // 2. Group questions by category
  const questionsByCategory = {};
  questions.forEach(q => {
    const category = q.llm_category || q.question_type || 'Technical';
    if (!questionsByCategory[category]) {
      questionsByCategory[category] = [];
    }
    questionsByCategory[category].push(q);
  });

  // 3. Calculate success patterns (questions from passed candidates)
  const successfulQuestions = questions.filter(q => q.source_outcome === 'passed');
  const successRate = questions.length > 0
    ? (successfulQuestions.length / questions.length * 100).toFixed(1)
    : 0;

  // 4. Build track structure
  const track = {
    company: company,
    total_questions: questions.length,
    success_rate: parseFloat(successRate),
    categories: Object.keys(questionsByCategory).map(category => ({
      name: category,
      question_count: questionsByCategory[category].length,
      questions: questionsByCategory[category].slice(0, 15).map(q => ({
        id: q.id,
        text: q.question_text,
        difficulty: q.difficulty || 'Unknown',
        stage: q.interview_stage || 'Not specified',
        frequency: q.frequency,
        from_successful_candidate: q.source_outcome === 'passed'
      }))
    })),
    preparation_notes: `Based on ${questions.length} real interview questions from ${company} candidates.`
  };

  return track;
}

/**
 * Build tracks for all companies mentioned in analysis
 */
async function buildAllCompanyTracks(patterns, sourcePosts) {
  const companies = patterns.company_trends ? patterns.company_trends.map(c => c.company) : [];

  if (companies.length === 0) {
    return [];
  }

  const tracks = [];
  for (const company of companies) {
    const track = await buildCompanySpecificTrack(company, sourcePosts);
    if (track) {
      tracks.push(track);
    }
  }

  return tracks;
}

// ============================================================================
// DAILY BREAKDOWN FOR WEEKLY PLANS
// ============================================================================

/**
 * Generate daily breakdown for a given week
 * Each day includes:
 * - Morning session (theory/concept learning)
 * - Afternoon session (practice problems)
 * - Evening review (optional)
 * - Specific resources for that day
 *
 * @param {Number} weekNumber - Week number (1-based)
 * @param {Object} weeklyGoals - Goals for this week
 * @param {Array} availableQuestions - Questions to distribute
 * @param {Array} resources - Recommended resources
 * @returns {Array} 7-day breakdown
 */
async function generateDailyBreakdown(weekNumber, weeklyGoals, availableQuestions, resources) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Distribute questions across the week
  const questionsPerDay = Math.ceil(availableQuestions.length / 7);

  const dailyPlan = daysOfWeek.map((day, index) => {
    const dayQuestions = availableQuestions.slice(
      index * questionsPerDay,
      (index + 1) * questionsPerDay
    );

    return {
      day_number: index + 1,
      day_name: day,
      morning_session: {
        type: 'Theory & Concepts',
        duration_hours: 2,
        topics: weeklyGoals.topics || [],
        resources: resources.filter(r => r.type === 'course' || r.type === 'video').slice(0, 2)
      },
      afternoon_session: {
        type: 'Practice Problems',
        duration_hours: 3,
        problems: dayQuestions.map(q => ({
          id: q.id,
          text: q.question_text || q.text,
          difficulty: q.difficulty,
          category: q.llm_category || q.question_type
        })),
        platform: 'LeetCode' // Can be dynamic based on resources
      },
      evening_review: {
        type: 'Review & Reflection',
        duration_hours: 1,
        activities: [
          'Review solutions from afternoon session',
          'Document learnings and patterns',
          'Preview tomorrow\'s topics'
        ]
      },
      total_study_hours: 6
    };
  });

  return dailyPlan;
}

/**
 * Enhance existing timeline with daily breakdowns
 */
async function addDailyBreakdownsToTimeline(timeline, patterns, questions, resources) {
  if (!timeline || !timeline.weeks) {
    return timeline;
  }

  const enhancedWeeks = await Promise.all(timeline.weeks.map(async (week, index) => {
    // Get questions relevant to this week's focus
    const weekQuestions = questions.slice(index * 10, (index + 1) * 10);

    // Generate daily breakdown
    const dailyPlan = await generateDailyBreakdown(
      week.week_number,
      week.goals || { topics: week.focus_areas || [] },
      weekQuestions,
      resources
    );

    return {
      ...week,
      daily_plan: dailyPlan,
      total_week_hours: dailyPlan.reduce((sum, day) => sum + day.total_study_hours, 0)
    };
  }));

  return {
    ...timeline,
    weeks: enhancedWeeks,
    has_daily_breakdowns: true
  };
}

// ============================================================================
// RESOURCE CURATION
// ============================================================================

/**
 * Curate resources for learning map based on:
 * - Success rate (% of successful candidates who used it)
 * - Relevance to target company/role
 * - Skills coverage
 *
 * @param {Object} patterns - Pattern analysis data
 * @param {String} targetCompany - Optional target company
 * @returns {Array} Curated resources with evidence
 */
async function curateResources(patterns, targetCompany = null) {

  // Get top skills from analysis
  const topSkills = patterns.skill_frequency
    ? patterns.skill_frequency.slice(0, 10).map(s => s.skill)
    : [];

  // Fetch top resources from database
  const resources = await getTopResources({
    companies: targetCompany ? [targetCompany] : null,
    skills: topSkills,
    minMentions: 2,
    minSuccessRate: 50,
    limit: 20
  });

  // Group resources by type
  const resourcesByType = {
    books: [],
    courses: [],
    platforms: [],
    videos: [],
    websites: [],
    tools: []
  };

  resources.forEach(resource => {
    const type = resource.type || 'websites';
    if (resourcesByType[type]) {
      resourcesByType[type].push({
        name: resource.name,
        url: resource.url,
        mention_count: resource.mention_count,
        success_rate: parseFloat(resource.success_rate),
        skills_covered: resource.skills || [],
        evidence: `Mentioned by ${resource.mention_count} candidates, ${resource.success_rate}% success rate`
      });
    }
  });

  return resourcesByType;
}

// ============================================================================
// LLM-POWERED SYNTHESIS
// ============================================================================

/**
 * Use LLM to synthesize weekly narrative based on real data
 * Adds professional context and guidance to raw data
 */
async function synthesizeWeeklyNarrative(weekData, companyTrack, resources) {
  const prompt = `You are creating a professional interview preparation plan. Based on REAL data from successful candidates, synthesize a concise weekly narrative.

WEEK ${weekData.week_number} DATA:
- Focus Areas: ${weekData.focus_areas ? weekData.focus_areas.join(', ') : 'Not specified'}
- Questions to Practice: ${weekData.daily_plan ? weekData.daily_plan.reduce((sum, d) => sum + d.afternoon_session.problems.length, 0) : 0}
- Company Focus: ${companyTrack ? companyTrack.company : 'General'}
- Available Resources: ${resources.platforms.length + resources.courses.length} resources

Write a 2-3 sentence professional summary for this week that:
1. States the main learning objective
2. Connects to actual interview patterns
3. Provides actionable guidance

Keep it professional, evidence-based, NO emojis.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, {
      max_tokens: 200,
      temperature: 0.3
    });

    return response.trim();
  } catch (error) {
    logger.error('[WeeklyNarrative] LLM synthesis failed:', error.message);
    return `Week ${weekData.week_number}: Focus on ${weekData.focus_areas ? weekData.focus_areas[0] : 'core skills'} through structured practice.`;
  }
}

// ============================================================================
// MILESTONE ENRICHMENT
// ============================================================================

/**
 * Enrich milestones with data from enhanced timeline
 * Transfers skills, tasks, resources, and real examples from timeline.weeks to milestones
 *
 * @param {Array} baseMilestones - Basic milestones with week, title, description
 * @param {Object} enhancedTimeline - Timeline with daily breakdowns and narratives
 * @param {Object} patterns - Pattern analysis data (for source posts)
 * @param {Array} allResources - All curated resources
 * @returns {Array} Enriched milestones with skills, tasks, resources, real_examples
 */
function enrichMilestonesFromTimeline(baseMilestones, enhancedTimeline, patterns, allResources) {
  // Defensive type checking - ensure baseMilestones is an array
  if (!baseMilestones) {
    logger.warn('[EnrichMilestones] No base milestones provided');
    return [];
  }

  // If baseMilestones is a string (JSON), parse it
  if (typeof baseMilestones === 'string') {
    try {
      baseMilestones = JSON.parse(baseMilestones);
    } catch (error) {
      logger.error('[EnrichMilestones] Failed to parse baseMilestones:', error);
      return [];
    }
  }

  // Ensure it's an array
  if (!Array.isArray(baseMilestones)) {
    logger.error(`[EnrichMilestones] baseMilestones is not an array, got: ${typeof baseMilestones}`);
    return [];
  }

  if (baseMilestones.length === 0) {
    logger.warn('[EnrichMilestones] No base milestones to enrich');
    return [];
  }

  if (!enhancedTimeline || !enhancedTimeline.weeks || enhancedTimeline.weeks.length === 0) {
    logger.warn('[EnrichMilestones] No enhanced timeline data available, using patterns directly');

    // Fallback: Enrich from patterns directly instead of timeline
    return baseMilestones.map(milestone => ({
      ...milestone,
      skills: patterns.skill_frequency ? patterns.skill_frequency.slice(0, 8).map(s => s.skill) : [],
      tasks: [`Review ${patterns.skill_frequency ? patterns.skill_frequency[0].skill : 'core concepts'}`, 'Complete practice problems', 'Study system design'],
      resources: allResources.slice(0, 3),
      real_examples: patterns.source_posts ? patterns.source_posts.slice(0, 3).map(p => p.title || p.text?.substring(0, 100)) : [],
      sourcePostIds: patterns.source_posts ? patterns.source_posts.map(p => p.post_id).slice(0, 10) : [],
      based_on_posts: patterns.source_posts ? patterns.source_posts.length : 0
    }));
  }

  const enrichedMilestones = baseMilestones.map((milestone, index) => {
    // Get milestone week number - handle both 'week' and 'week_number' properties
    // Also handle undefined by calculating from index
    const milestoneWeek = milestone.week || milestone.week_number || ((index + 1) * Math.ceil(enhancedTimeline.weeks.length / baseMilestones.length));

    // Find ALL weeks up to this milestone
    // Handle both 'week' and 'week_number' properties in timeline weeks
    const relevantWeeks = enhancedTimeline.weeks.filter(week => {
      const weekNum = week.week || week.week_number;
      return weekNum <= milestoneWeek;
    });

    if (relevantWeeks.length === 0) {
      logger.warn(`[EnrichMilestones] No timeline weeks found for milestone week ${milestoneWeek}, using fallback`);
      // Fallback to using all available weeks
      const allWeeks = enhancedTimeline.weeks || [];
      if (allWeeks.length === 0) {
        // Ultimate fallback: use patterns
        return {
          ...milestone,
          skills: patterns.skill_frequency ? patterns.skill_frequency.slice(0, 8).map(s => s.skill) : [],
          tasks: ['Complete coding practice', 'Study system design', 'Review behavioral questions'],
          resources: allResources.slice(0, 3),
          real_examples: patterns.source_posts ? patterns.source_posts.slice(0, 3).map(p => p.title || p.text?.substring(0, 100)) : [],
          sourcePostIds: patterns.source_posts ? patterns.source_posts.map(p => p.post_id).slice(0, 10) : [],
          based_on_posts: patterns.source_posts ? patterns.source_posts.length : 0
        };
      }
      // Use all available weeks as fallback - just use the week extraction logic below
      const weeks = allWeeks;
      const skills = [];
      weeks.forEach(week => {
        if (week.focus_areas) {
          week.focus_areas.forEach(skill => {
            if (!skills.includes(skill)) skills.push(skill);
          });
        }
      });

      return {
        ...milestone,
        skills: skills.slice(0, 8),
        tasks: ['Complete coding practice', 'Study system design', 'Review behavioral questions'],
        resources: allResources.slice(0, 3),
        real_examples: patterns.source_posts ? patterns.source_posts.slice(0, 3).map(p => p.title || p.text?.substring(0, 100)) : [],
        sourcePostIds: patterns.source_posts ? patterns.source_posts.map(p => p.post_id).slice(0, 10) : [],
        based_on_posts: patterns.source_posts ? patterns.source_posts.length : 0
      };
    }

    // Extract skills from relevant weeks
    const skills = [];
    relevantWeeks.forEach(week => {
      if (week.focus_areas) {
        week.focus_areas.forEach(skill => {
          if (!skills.includes(skill)) {
            skills.push(skill);
          }
        });
      }
      if (week.goals && week.goals.topics) {
        week.goals.topics.forEach(topic => {
          if (!skills.includes(topic)) {
            skills.push(topic);
          }
        });
      }
    });

    // Extract tasks from daily breakdowns
    const tasks = [];
    relevantWeeks.forEach(week => {
      if (week.daily_plan) {
        week.daily_plan.forEach(day => {
          // Add morning session topics as tasks
          if (day.morning_session && day.morning_session.topics) {
            day.morning_session.topics.slice(0, 2).forEach(topic => {
              const task = `Study ${topic}`;
              if (!tasks.includes(task)) {
                tasks.push(task);
              }
            });
          }
          // Add practice problems as tasks
          if (day.afternoon_session && day.afternoon_session.problems) {
            const problemCount = day.afternoon_session.problems.length;
            if (problemCount > 0) {
              tasks.push(`Complete ${problemCount} practice problems on ${day.afternoon_session.platform || 'coding platform'}`);
            }
          }
        });
      }
    });

    // Extract resources (limit to top relevant ones)
    const resources = [];
    if (allResources && allResources.length > 0) {
      // Get resources that match milestone skills
      const relevantResources = allResources.filter(resource => {
        if (!resource.skills_covered) return false;
        return skills.some(skill =>
          resource.skills_covered.some(resSkill =>
            resSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resSkill.toLowerCase())
          )
        );
      });

      // Add top resources (limit to 5 per milestone)
      relevantResources.slice(0, 5).forEach(resource => {
        if (resource.url) {
          resources.push({
            title: resource.name,
            url: resource.url,
            mentionedBy: resource.mention_count || 1
          });
        } else {
          resources.push(resource.name);
        }
      });

      // If no relevant resources, add general top resources
      if (resources.length === 0) {
        allResources.slice(0, 3).forEach(resource => {
          if (resource.url) {
            resources.push({
              title: resource.name,
              url: resource.url,
              mentionedBy: resource.mention_count || 1
            });
          } else {
            resources.push(resource.name);
          }
        });
      }
    }

    // Extract real examples from source posts
    const real_examples = [];
    if (patterns.source_posts && patterns.source_posts.length > 0) {
      // Get a sample of source posts (2-3 examples per milestone)
      const samplePosts = patterns.source_posts.slice(0, 3);
      samplePosts.forEach(post => {
        if (post.title) {
          real_examples.push(post.title);
        } else if (post.text) {
          real_examples.push(post.text.substring(0, 100) + '...');
        }
      });
    }

    // Build enriched milestone
    const enrichedMilestone = {
      ...milestone,
      skills: skills.slice(0, 8), // Top 8 skills
      tasks: tasks.slice(0, 6), // Top 6 tasks
      resources: resources,
      real_examples: real_examples,
      sourcePostIds: patterns.source_posts ? patterns.source_posts.map(p => p.post_id).slice(0, 10) : [],
      based_on_posts: patterns.source_posts ? patterns.source_posts.length : 0
    };

    return enrichedMilestone;
  });

  return enrichedMilestones;
}

// ============================================================================
// QUESTION FETCHING
// ============================================================================

/**
 * Fetch REAL LeetCode problems from database for daily plans
 * Filters out raw Reddit post snippets and only returns actual coding problems
 *
 * @param {Array} sourcePosts - Source posts from RAG
 * @returns {Array} Real LeetCode problems with proper structure
 */
async function fetchRealLeetCodeProblems(sourcePosts) {
  if (!sourcePosts || sourcePosts.length === 0) {
    return [];
  }

  const postIds = sourcePosts.map(p => p.post_id);

  try {
    // Fix: For SELECT DISTINCT, ORDER BY columns must be in SELECT list
    // Added extraction_confidence to SELECT and removed DISTINCT (use subquery instead)
    const query = `
      SELECT text, difficulty, category, llm_category, id, extraction_confidence
      FROM (
        SELECT DISTINCT ON (iq.question_text)
          iq.question_text as text,
          iq.difficulty,
          iq.question_type as category,
          iq.llm_category,
          iq.id,
          iq.extraction_confidence
        FROM interview_questions iq
        WHERE iq.post_id = ANY($1)
          AND iq.question_type IN ('coding', 'leetcode', 'system_design', 'technical')
          AND iq.extraction_confidence >= 0.80
          AND iq.question_text IS NOT NULL
          AND LENGTH(iq.question_text) < 200  -- Filter out long Reddit post snippets
          AND iq.question_text NOT LIKE '%location:%'  -- Filter out biographical info
          AND iq.question_text NOT LIKE '%minutes%min%'  -- Filter out interview descriptions
          AND iq.question_text NOT LIKE '%internship%Fortune%'  -- Filter out experience descriptions
        ORDER BY iq.question_text, iq.extraction_confidence DESC
      ) sub
      ORDER BY difficulty ASC, extraction_confidence DESC
      LIMIT 200
    `;

    const result = await pool.query(query, [postIds]);


    return result.rows.map(row => ({
      id: row.id,
      text: row.question_text || row.text,
      question_text: row.question_text || row.text,
      difficulty: row.difficulty || 3,
      category: row.llm_category || row.category || 'coding',
      question_type: row.category
    }));
  } catch (error) {
    logger.error('[FetchLeetCodeProblems] Error fetching questions:', error);
    return [];
  }
}

// ============================================================================
// MAIN ENHANCEMENT FUNCTION
// ============================================================================

/**
 * Enhance existing learning map with strategic features
 * @param {Object} baseLearningMap - Base learning map from learningMapGeneratorService
 * @param {Object} patterns - Pattern analysis data
 * @param {String} targetCompany - Optional target company
 * @returns {Object} Enhanced learning map
 */
async function enhanceLearningMap(baseLearningMap, patterns, targetCompany = null) {
  try {
    // Import curriculum builder service
    const { buildCurriculum } = require('./curriculumBuilderService');
    const { matchMultipleQuestions } = require('./problemMatchingService');

    // 1. Build company-specific tracks
    const companyTracks = await buildAllCompanyTracks(patterns, patterns.source_posts || []);

    // 2. Get questions from database and match to curated problems
    const extractedQuestions = await fetchRealLeetCodeProblems(patterns.source_posts || []);
    const matchedQuestions = await matchMultipleQuestions(extractedQuestions);

    // 3. Build curated curriculum matching the base timeline week count
    // CRITICAL: Use the actual number of weeks from base timeline to ensure consistency
    // This ensures curriculum weeks match the weeks that have detailed_daily_schedules
    const baseTimelineWeekCount = baseLearningMap.timeline?.weeks?.length || baseLearningMap.timeline_weeks || 12;

    const userGoals = {
      targetCompany: targetCompany || 'Google',
      targetLevel: 'L4',
      timelineWeeks: baseTimelineWeekCount
    };

    const curatedCurriculum = await buildCurriculum(userGoals, []);

    // 4. Merge curated curriculum into timeline format
    // CRITICAL: Preserve detailed_daily_schedules from baseLearningMap.timeline if they exist
    const baseTimelineWeeks = baseLearningMap.timeline?.weeks || [];

    const enhancedTimeline = {
      weeks: curatedCurriculum.weekly_plan.map((weekPlan, index) => {
        // Find matching week from base timeline to preserve detailed_daily_schedules
        const baseWeek = baseTimelineWeeks.find(w => w.week === weekPlan.week) || baseTimelineWeeks[index];

        return {
          week: weekPlan.week,
          title: weekPlan.objective,
          narrative: weekPlan.description,
          topics: weekPlan.topics,
          daily_plan: weekPlan.daily_breakdown,
          success_criteria: weekPlan.success_criteria,
          // PRESERVE hour-by-hour schedules from base timeline (generated by timelineMilestoneEnhancementService)
          detailed_daily_schedules: baseWeek?.detailed_daily_schedules || null
        };
      })
    };

    // 5. Curate resources
    const curatedResources = await curateResources(patterns, targetCompany);

    // 5. Add weekly narratives (using LLM)
    if (enhancedTimeline && enhancedTimeline.weeks) {
      for (let i = 0; i < enhancedTimeline.weeks.length; i++) {
        const week = enhancedTimeline.weeks[i];
        const targetTrack = companyTracks.find(t => t.company === targetCompany) || companyTracks[0];

        week.narrative = await synthesizeWeeklyNarrative(week, targetTrack, curatedResources);
      }
    }

    // NEW: Enrich milestones from enhanced timeline data
    const enrichedMilestones = enrichMilestonesFromTimeline(
      baseLearningMap.milestones || [],
      enhancedTimeline,
      patterns,
      Object.values(curatedResources).flat()
    );

    // 6. Synthesize database-first fields into narrative insights
    const targetRole = baseLearningMap.title?.split(' at ')[0] || 'Software Engineer';
    const synthesizedInsights = await synthesizeDatabaseFirstInsights(
      baseLearningMap,
      patterns,
      targetCompany || 'Target Company',
      targetRole
    );

    // 7. Assemble enhanced learning map
    const enhancedMap = {
      ...baseLearningMap,

      // Enhanced sections
      company_specific_tracks: companyTracks,
      curated_resources: curatedResources,
      timeline: enhancedTimeline,
      milestones: enrichedMilestones,  // Use enriched milestones

      // NEW: Replace raw database-first fields with synthesized narratives
      pitfalls_narrative: synthesizedInsights.pitfalls_narrative,
      improvement_areas: synthesizedInsights.improvement_areas,
      resource_recommendations: synthesizedInsights.resource_recommendations,
      preparation_expectations: synthesizedInsights.preparation_expectations,

      // Keep raw data for reference/debugging
      _raw_database_fields: {
        common_pitfalls: baseLearningMap.common_pitfalls,
        readiness_checklist: baseLearningMap.readiness_checklist,
        database_resources: baseLearningMap.database_resources,
        timeline_statistics: baseLearningMap.timeline_statistics,
        success_factors: baseLearningMap.success_factors
      },

      // Metadata
      enhancement_version: '3.0',
      enhanced_at: new Date().toISOString(),
      enhancements_applied: [
        'company_specific_question_tracks',
        'daily_breakdown_plans',
        'evidence_based_resource_curation',
        'llm_synthesized_narratives',
        'database_first_narrative_synthesis'
      ],

      // Evidence tracking
      evidence: {
        total_real_questions: extractedQuestions.length,
        matched_curated_problems: matchedQuestions.length,
        curated_curriculum_metadata: curatedCurriculum.metadata,
        companies_covered: companyTracks.length,
        resources_curated: Object.values(curatedResources).flat().length,
        data_sources: `${patterns.source_posts ? patterns.source_posts.length : 0} foundation posts`
      }
    };

    logger.info('[EnhanceLearningMap] Enhancement complete');
    logger.info(`[EnhanceLearningMap] - ${companyTracks.length} company tracks`);
    logger.info(`[EnhanceLearningMap] - ${extractedQuestions.length} extracted questions, ${matchedQuestions.length} matched to curated problems`);
    logger.info(`[EnhanceLearningMap] - ${Object.values(curatedResources).flat().length} curated resources`);

    return enhancedMap;
  } catch (error) {
    logger.error('[EnhanceLearningMap] Enhancement failed:', error);
    // Return base map if enhancement fails
    return {
      ...baseLearningMap,
      enhancement_error: error.message,
      enhancement_version: '1.0'
    };
  }
}

// ============================================================================
// DATABASE-FIRST FIELDS LLM SYNTHESIS
// ============================================================================

/**
 * Synthesize narrative insights from raw database-first aggregated data
 *
 * Takes raw aggregated data and uses LLM to generate actionable narrative insights:
 * - Pitfalls → Detailed explanation of WHY + how to avoid
 * - Checklist → Prioritized improvement areas with action steps
 * - Resources → Ranked recommendations with usage guidance
 * - Timeline stats → Realistic preparation expectations
 * - Success factors → What actually worked (if data exists)
 *
 * @param {Object} baseLearningMap - Base learning map with raw database-first fields
 * @param {Object} patterns - Full pattern analysis data
 * @param {String} targetCompany - Target company name
 * @param {String} targetRole - Target role
 * @returns {Object} Enhanced fields with LLM-generated narratives
 */
async function synthesizeDatabaseFirstInsights(baseLearningMap, patterns, targetCompany, targetRole) {
  logger.info('[DatabaseFirstSynthesis] Starting LLM synthesis of aggregated data');

  try {
    // Extract raw database-first fields
    const rawPitfalls = baseLearningMap.common_pitfalls || { pitfalls: [], evidence_quality: {} };
    const rawChecklist = baseLearningMap.readiness_checklist || { checklist_items: [], evidence_quality: {} };
    const rawResources = baseLearningMap.database_resources || [];
    const rawTimelineStats = baseLearningMap.timeline_statistics || {};
    const rawSuccessFactors = baseLearningMap.success_factors || [];

    const totalPosts = patterns.source_posts?.length || 0;

    // Prepare context for LLM
    const synthesisContext = {
      targetCompany,
      targetRole,
      totalPosts,
      rawData: {
        pitfalls: rawPitfalls.pitfalls || [],
        pitfallsConfidence: rawPitfalls.evidence_quality?.confidence || 'low',
        pitfallsPostsAnalyzed: rawPitfalls.evidence_quality?.posts_analyzed || 0,

        checklistItems: rawChecklist.checklist_items || [],
        checklistConfidence: rawChecklist.evidence_quality?.confidence || 'low',
        checklistPostsAnalyzed: rawChecklist.evidence_quality?.posts_analyzed || 0,

        resources: rawResources,
        timelineStats: rawTimelineStats,
        successFactors: rawSuccessFactors
      }
    };

    // Build LLM prompt
    const prompt = `You are an expert career coach analyzing interview preparation data. Transform raw aggregated data into actionable insights.

**TARGET**: ${targetRole} at ${targetCompany}
**DATA SOURCE**: ${totalPosts} real interview experiences

**RAW DATA:**

1. COMMON PITFALLS (Confidence: ${synthesisContext.rawData.pitfallsConfidence}, ${synthesisContext.rawData.pitfallsPostsAnalyzed} posts analyzed):
${JSON.stringify(synthesisContext.rawData.pitfalls, null, 2)}

2. READINESS CHECKLIST (Confidence: ${synthesisContext.rawData.checklistConfidence}, ${synthesisContext.rawData.checklistPostsAnalyzed} posts analyzed):
${JSON.stringify(synthesisContext.rawData.checklistItems, null, 2)}

3. LEARNING RESOURCES (${rawResources.length} resources with success rates):
${JSON.stringify(synthesisContext.rawData.resources, null, 2)}

4. TIMELINE STATISTICS:
${JSON.stringify(synthesisContext.rawData.timelineStats, null, 2)}

**TASK**: Generate comprehensive narrative insights following this EXACT JSON structure:

{
  "pitfalls_narrative": {
    "summary": "Brief overview of main pitfalls (2-3 sentences)",
    "top_pitfalls": [
      {
        "title": "Descriptive title (e.g., 'Time Management Under Pressure')",
        "severity": "critical|high|medium",
        "explanation": "WHY this is a pitfall (2-3 sentences with specific examples from data)",
        "how_to_avoid": "Concrete action steps (3-5 bullet points)",
        "affected_percentage": "X% of candidates (if data available)"
      }
    ],
    "data_confidence": "high|medium|low"
  },

  "improvement_areas": {
    "summary": "Overview of key skills to develop",
    "priority_skills": [
      {
        "skill": "Skill name",
        "priority": "critical|high|medium",
        "current_gap": "Description of the gap based on checklist data",
        "action_plan": [
          {
            "step": "Detailed step with specific resources",
            "resources": [
              {
                "name": "Resource name (e.g., Blind 75, NeetCode, specific book)",
                "url": "Direct URL if available from database_resources",
                "description": "What to do with this resource (e.g., 'Complete 2 problems/day for 8 weeks')"
              }
            ],
            "timeline": "When to do this (e.g., 'Week 1-4', 'Daily for 2 months')",
            "success_pattern": "What successful candidates did (from database)"
          }
        ],
        "time_estimate": "X weeks",
        "mentioned_in": "X posts"
      }
    ]
  },

  "resource_recommendations": {
    "summary": "How to use these resources effectively",
    "ranked_resources": [
      {
        "name": "Resource name",
        "url": "Direct URL if available from database_resources or well-known resource",
        "type": "platform|course|book|practice",
        "why_recommended": "Based on X% success rate from Y candidates",
        "action_plan": [
          {
            "step": "Detailed step with specific usage instructions",
            "resources": [
              {
                "name": "Specific resource/section (e.g., 'Arrays & Hashing section', 'Chapters 1-4')",
                "url": "Direct URL to this specific section if available",
                "description": "Exactly what to do (e.g., 'Complete 2 problems/day', 'Read chapters with notes')"
              }
            ],
            "timeline": "When to do this (e.g., 'Week 1-3', 'Daily for 1 month')",
            "success_pattern": "How successful candidates used this (from database)"
          }
        ],
        "expected_time": "X weeks/hours",
        "success_metrics": "What defines success with this resource"
      }
    ]
  },

  "preparation_expectations": {
    "realistic_timeline": "Based on data, X weeks is typical",
    "factors_affecting_timeline": ["Factor 1", "Factor 2"],
    "success_indicators": ["Indicator 1", "Indicator 2"],
    "common_timeline_mistakes": ["Mistake 1", "Mistake 2"]
  }
}

**CRITICAL RULES**:
1. Use ONLY the data provided - no generic advice
2. Include specific numbers, percentages, and mention counts from raw data
3. If data is insufficient (confidence: low), say "Limited data available" and provide cautious guidance
4. Prioritize by frequency/success rate from the data
5. Be specific and actionable - every recommendation must have concrete steps
6. **CRITICAL**: For each action_plan step in BOTH improvement_areas AND resource_recommendations, YOU MUST recommend specific resources with URLs:
   - LeetCode problems → Recommend "Blind 75" (https://neetcode.io/practice) or "Grind 169" or "NeetCode 150"
   - Coding practice → Recommend specific platforms (LeetCode, HackerRank, AlgoExpert)
   - Books → Recommend "Cracking the Coding Interview", "Elements of Programming Interviews"
   - System Design → Recommend "System Design Primer" (https://github.com/donnemartin/system-design-primer)
   - Mock interviews → Recommend Pramp (https://pramp.com), interviewing.io, or Exponent
   - Video tutorials → Recommend NeetCode YouTube, Abdul Bari, Back to Back SWE
7. **CRITICAL**: Include specific timelines (e.g., "2 problems/day for 8 weeks", "Study 3 hours daily")
8. **CRITICAL**: If database_resources has relevant resources, use those. Otherwise, recommend well-known industry-standard resources
9. Every action step MUST include: specific resource name + URL + how to use it + timeline + success pattern
10. **CRITICAL**: For resource_recommendations.ranked_resources, ALWAYS include:
    - url: Direct URL to the resource (from database_resources or well-known resource)
    - action_plan: Array of detailed steps with resources, timeline, and success patterns (same structure as improvement_areas)
11. Return ONLY valid JSON, no markdown formatting

**RESOURCE RECOMMENDATIONS CHEAT SHEET** (Use these when generating action plans):
- Coding Problems: Blind 75 (neetcode.io/practice), Grind 169, NeetCode 150, LeetCode Patterns
- Books: "Cracking the Coding Interview", "Elements of Programming Interviews in Python/Java/C++"
- System Design: System Design Primer (github.com/donnemartin/system-design-primer), Grokking System Design
- Mock Interviews: Pramp (pramp.com), interviewing.io, Exponent, Blind Mock Interviews
- Video Learning: NeetCode YouTube, Back to Back SWE, Abdul Bari (algorithms), Gaurav Sen (system design)
- Behavioral: "The Behavioral Interview Handbook", STAR method guides

**EXAMPLES OF GOOD ACTION PLANS**:
✓ GOOD (improvement_areas): {"step": "Master coding fundamentals", "resources": [{"name": "Blind 75", "url": "https://neetcode.io/practice", "description": "Complete 2 problems per day, start with Arrays and Two Pointers categories"}], "timeline": "Week 1-5 (5 weeks total)", "success_pattern": "73% of successful candidates completed this list"}
✓ GOOD (improvement_areas): {"step": "Learn system design patterns", "resources": [{"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "description": "Study one pattern per day, create diagrams for each"}], "timeline": "Week 6-8 (3 weeks)", "success_pattern": "Used by 45 candidates who passed senior interviews"}
✓ GOOD (resource_recommendations): {"name": "NeetCode 150", "url": "https://neetcode.io/practice", "type": "platform", "why_recommended": "100% success rate from 3 candidates", "action_plan": [{"step": "Master arrays and hashing patterns", "resources": [{"name": "Arrays & Hashing Section", "url": "https://neetcode.io/roadmap", "description": "Complete 2 problems per day, watch video explanations"}], "timeline": "Week 1-2", "success_pattern": "All successful candidates completed this section first"}], "expected_time": "7.3 weeks", "success_metrics": "Complete all 150 problems with optimal solutions"}
✗ BAD: {"step": "Practice coding problems"} (NO RESOURCES, NO TIMELINE)
✗ BAD: ["Practice LeetCode", "Study algorithms"] (WRONG FORMAT - should be objects with resources)
✗ BAD (resource_recommendations): {"name": "LeetCode", "how_to_use": "Complete exercises"} (NO URL, NO ACTION_PLAN)`;


    const llmResponse = await analyzeWithOpenRouter(prompt, {
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.3,
      max_tokens: 4000
    });

    // Extract and parse JSON
    const synthesizedInsights = extractJsonFromString(llmResponse);

    if (!synthesizedInsights) {
      logger.warn('[DatabaseFirstSynthesis] LLM did not return valid JSON, using raw data');
      return {
        pitfalls_narrative: rawPitfalls,
        improvement_areas: rawChecklist,
        resource_recommendations: rawResources,
        preparation_expectations: rawTimelineStats
      };
    }

    return synthesizedInsights;

  } catch (error) {
    logger.error('[DatabaseFirstSynthesis] Synthesis failed:', error);
    // Fallback to raw data structure
    return {
      pitfalls_narrative: rawPitfalls,
      improvement_areas: rawChecklist,
      resource_recommendations: rawResources,
      preparation_expectations: rawTimelineStats,
      synthesis_error: error.message
    };
  }
}

module.exports = {
  buildCompanySpecificTrack,
  buildAllCompanyTracks,
  generateDailyBreakdown,
  addDailyBreakdownsToTimeline,
  curateResources,
  synthesizeWeeklyNarrative,
  synthesizeDatabaseFirstInsights,
  enhanceLearningMap
};
