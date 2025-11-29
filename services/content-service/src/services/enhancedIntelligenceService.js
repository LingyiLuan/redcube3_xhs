/**
 * Enhanced Intelligence Service
 * Transforms raw aggregations into McKinsey-style actionable insights
 *
 * Data Flow:
 * 1. Raw metrics from enhancedIntelligenceQueries.js
 * 2. Statistical analysis (confidence intervals, benchmarking)
 * 3. Pattern recognition (clustering, outlier detection)
 * 4. Actionable recommendations (mitigation strategies, prep advice)
 * 5. Professional presentation (executive summary, deep dives)
 */

const {
  getHiringProcessIntelligence,
  getRejectionIntelligence,
  getEnhancedQuestionIntelligence,
  getInterviewerFocusPatterns,
  getTimelinePatterns,
  getExperienceLevelBreakdown
} = require('../database/enhancedIntelligenceQueries');

/**
 * Generate complete enhanced intelligence report
 * Foundation Pool: (Seed Posts + RAG Posts) with comprehensive LLM extraction
 *
 * @param {Array<string>} foundationPoolIds - Post IDs from foundation pool
 * @returns {Promise<Object>} Complete enhanced intelligence report
 */
async function generateEnhancedIntelligence(foundationPoolIds) {
  console.log(`[Enhanced Intelligence] Analyzing ${foundationPoolIds.length} posts from foundation pool`);

  try {
    // Run all aggregations in parallel for performance
    const [
      hiringProcess,
      rejections,
      questions,
      interviewerFocus,
      timelines,
      experienceLevels
    ] = await Promise.all([
      getHiringProcessIntelligence(foundationPoolIds),
      getRejectionIntelligence(foundationPoolIds),
      getEnhancedQuestionIntelligence(foundationPoolIds),
      getInterviewerFocusPatterns(foundationPoolIds),
      getTimelinePatterns(foundationPoolIds),
      getExperienceLevelBreakdown(foundationPoolIds)
    ]);

    console.log(`[Enhanced Intelligence] Aggregation complete:`, {
      total_posts: hiringProcess.total_posts,
      rejections: rejections.length,
      questions: questions.length,
      focus_patterns: interviewerFocus.length,
      timelines: timelines.length,
      experience_levels: experienceLevels.length
    });

    // Transform into McKinsey-style structured insights
    const report = {
      // Executive Summary: High-level findings with strategic implications
      executive_summary: generateExecutiveSummary(hiringProcess, rejections, questions, interviewerFocus),

      // Section 1: Hiring Process Intelligence
      hiring_process: generateHiringProcessSection(hiringProcess),

      // Section 2: Rejection Intelligence with Mitigation Strategies
      rejection_analysis: generateRejectionAnalysis(rejections),

      // Section 3: Question Intelligence (ENHANCED with rich metadata)
      question_intelligence: generateQuestionIntelligence(questions, interviewerFocus),

      // Section 4: Timeline Intelligence by Company/Role
      timeline_intelligence: generateTimelineIntelligence(timelines),

      // Section 5: Experience Level Benchmarking
      experience_level_insights: generateExperienceLevelInsights(experienceLevels),

      // Metadata
      generated_at: new Date().toISOString(),
      data_quality: {
        foundation_pool_size: foundationPoolIds.length,
        posts_analyzed: hiringProcess.total_posts,
        extraction_coverage: Math.round((hiringProcess.extraction_coverage || 0) * 100),
        questions_analyzed: questions.length,
        companies_covered: new Set(timelines.map(t => t.company)).size,
        statistical_confidence: calculateStatisticalConfidence(hiringProcess.total_posts)
      }
    };

    return report;

  } catch (error) {
    console.error('[Enhanced Intelligence] Error generating report:', error);
    throw error;
  }
}

/**
 * Generate Executive Summary section
 */
function generateExecutiveSummary(hiringProcess, rejections, questions, interviewerFocus) {
  const totalPosts = hiringProcess.total_posts || 0;
  const confidence = calculateStatisticalConfidence(totalPosts);

  // Calculate key metrics
  const referralMultiplier = calculateReferralMultiplier(hiringProcess);
  const avgRounds = hiringProcess.avg_interview_rounds || 0;
  const remoteRatio = Math.round((hiringProcess.remote_ratio || 0) * 100);
  const negotiationRate = Math.round((hiringProcess.negotiation_rate || 0) * 100);
  const negotiationSuccessRate = Math.round((hiringProcess.negotiation_success_rate || 0) * 100);

  // Generate key findings
  const findings = [];

  // Finding 1: Interview Process Length
  findings.push({
    category: 'Interview Process',
    finding: `Average ${avgRounds} rounds`,
    benchmark: 'Industry average: 3-4 rounds',
    implication: avgRounds > 4
      ? 'Longer process - prepare for endurance, maintain momentum over weeks'
      : avgRounds < 3
        ? 'Quick process - be ready early, first impression critical'
        : 'Standard process - steady preparation, consistent performance key',
    data_points: hiringProcess.rounds_data_points || 0
  });

  // Finding 2: Remote Flexibility
  if (hiringProcess.location_data_points > 0) {
    findings.push({
      category: 'Remote Flexibility',
      finding: `${remoteRatio}% remote interviews`,
      benchmark: 'Post-2020 trend: 60-70% remote',
      implication: remoteRatio >= 60
        ? 'High remote flexibility - optimize home setup: lighting, audio, background'
        : 'Mixed environment - prepare for both remote and on-site logistics',
      data_points: hiringProcess.location_data_points
    });
  }

  // Finding 3: Negotiation Landscape
  if (hiringProcess.negotiation_count > 0) {
    findings.push({
      category: 'Negotiation Dynamics',
      finding: `${negotiationRate}% negotiate, ${negotiationSuccessRate}% succeed`,
      benchmark: 'Industry benchmark: 40-50% negotiate, 60-70% succeed',
      implication: negotiationRate > 40
        ? `Strong negotiation culture - prepare 3 leverage points (competing offers, market data, unique value)`
        : `Conservative culture - negotiate tactfully with thorough research`,
      data_points: hiringProcess.negotiation_count
    });
  }

  // Finding 4: Referral Impact
  if (referralMultiplier) {
    const referralSuccessRate = Math.round((hiringProcess.referral_success_rate || 0) * 100);
    const nonReferralSuccessRate = Math.round((hiringProcess.non_referral_success_rate || 0) * 100);

    findings.push({
      category: 'Referral Impact',
      finding: `${referralMultiplier}x higher success with referral (${referralSuccessRate}% vs ${nonReferralSuccessRate}%)`,
      benchmark: 'Typical multiplier: 2-3x',
      implication: referralMultiplier >= 2
        ? `Referrals are critical - allocate 30% of prep time to networking, meetups, informational interviews`
        : `Referrals helpful but not decisive - focus on technical excellence`,
      data_points: hiringProcess.referral_count
    });
  }

  // Finding 5: Top Rejection Driver
  if (rejections.length > 0) {
    const topRejection = rejections[0];
    findings.push({
      category: 'Primary Risk Factor',
      finding: `${topRejection.rejection_reason} (${topRejection.frequency} cases)`,
      benchmark: `Most common in ${topRejection.most_common_difficulty || 'medium-hard'} interviews`,
      implication: generateMitigationStrategy(topRejection.rejection_reason),
      data_points: topRejection.frequency
    });
  }

  return {
    data_foundation: {
      total_posts_analyzed: totalPosts,
      extraction_coverage: Math.round((hiringProcess.extraction_coverage || 0) * 100),
      statistical_confidence: confidence,
      confidence_explanation: getConfidenceExplanation(confidence, totalPosts)
    },
    key_findings: findings
  };
}

/**
 * Generate Hiring Process section
 */
function generateHiringProcessSection(data) {
  return {
    overview: {
      avg_rounds: data.avg_interview_rounds || 0,
      median_rounds: data.median_interview_rounds || 0,
      range: {
        min: data.min_rounds || 0,
        max: data.max_rounds || 0
      },

      format_distribution: {
        video: Math.round((data.video_interview_ratio || 0) * 100),
        phone: Math.round((data.phone_interview_ratio || 0) * 100),
        in_person: Math.round((data.in_person_ratio || 0) * 100),
        take_home: Math.round((data.takehome_ratio || 0) * 100),
        mixed: Math.round((data.mixed_format_ratio || 0) * 100)
      },

      location_preference: {
        remote: Math.round((data.remote_ratio || 0) * 100),
        hybrid: Math.round((data.hybrid_ratio || 0) * 100),
        onsite: Math.round((data.onsite_ratio || 0) * 100)
      },

      // Data quality
      data_points: {
        rounds: data.rounds_data_points || 0,
        format: data.format_data_points || 0,
        location: data.location_data_points || 0
      }
    },

    offer_dynamics: {
      offers_received: (data.offers_accepted || 0) + (data.offers_declined || 0),
      acceptance_rate: Math.round((data.offer_acceptance_rate || 0) * 100),
      decline_rate: Math.round((data.offer_decline_rate || 0) * 100),
      negotiation_rate: Math.round((data.negotiation_rate || 0) * 100),
      negotiation_success_rate: Math.round((data.negotiation_success_rate || 0) * 100),

      // Insights
      insights: {
        negotiation_recommendation: (data.negotiation_success_rate || 0) > 0.6
          ? 'High negotiation success rate - always negotiate, prepare leverage'
          : 'Moderate success - negotiate selectively with strong justification',
        offer_decision_pattern: (data.offer_decline_rate || 0) > 0.25
          ? 'High decline rate suggests candidates shopping offers - expect competition'
          : 'Low decline rate suggests strong company appeal'
      }
    },

    referral_intelligence: {
      usage_rate: Math.round((data.referral_usage_rate || 0) * 100),
      success_with_referral: Math.round((data.referral_success_rate || 0) * 100),
      success_without_referral: Math.round((data.non_referral_success_rate || 0) * 100),
      multiplier: calculateReferralMultiplier(data),

      // Breakdown by experience level
      referral_by_experience: {
        entry: data.referral_entry || 0,
        mid: data.referral_mid || 0,
        senior: data.referral_senior || 0
      },

      actionable_advice: generateReferralAdvice(data)
    },

    compensation_transparency: {
      discussion_rate: Math.round((data.compensation_discussion_rate || 0) * 100),
      discussion_success_correlation: Math.round((data.comp_discussion_success_rate || 0) * 100),
      interpretation: (data.compensation_discussion_rate || 0) > 0.5
        ? 'High transparency - expect salary discussions early in process'
        : 'Conservative - salary typically discussed after final round'
    }
  };
}

/**
 * Generate Rejection Analysis section
 */
function generateRejectionAnalysis(rejections) {
  if (rejections.length === 0) {
    return {
      top_reasons: [],
      patterns: { difficulty_concentration: [], experience_level_patterns: [] },
      insufficient_data: true
    };
  }

  const topReasons = rejections.slice(0, 10).map(r => ({
    reason: r.rejection_reason,
    frequency: r.frequency,

    // Context
    common_companies: r.companies || [],
    common_roles: r.roles || [],
    experience_levels: r.experience_levels || [],

    // Difficulty breakdown
    difficulty_distribution: {
      easy: r.difficulty_easy || 0,
      medium: r.difficulty_medium || 0,
      hard: r.difficulty_hard || 0
    },
    most_common_difficulty: r.most_common_difficulty,

    // Actionable mitigation
    how_to_improve: generateMitigationStrategy(r.rejection_reason),
    priority_level: r.frequency >= 10 ? 'critical' : r.frequency >= 5 ? 'important' : 'monitor'
  }));

  // Analyze patterns
  const patterns = analyzeRejectionPatterns(rejections);

  return {
    top_reasons: topReasons,
    patterns: patterns,
    total_rejection_cases: rejections.reduce((sum, r) => sum + r.frequency, 0)
  };
}

/**
 * Generate Question Intelligence section
 */
function generateQuestionIntelligence(questions, interviewerFocus) {
  const topQuestions = questions.map(q => ({
    question: q.question_text,
    asked_count: q.asked_count,
    difficulty: q.llm_difficulty,
    category: q.llm_category,
    question_type: q.question_type,

    // Time allocation
    time_allocation: q.avg_time_minutes
      ? {
        avg_minutes: q.avg_time_minutes,
        range: { min: q.min_time_minutes, max: q.max_time_minutes },
        interpretation: q.avg_time_minutes > 45
          ? 'Extended discussion - expect deep dive, multiple approaches'
          : 'Standard duration - focus on optimal solution'
      }
      : null,

    // Rich metadata (NEW - competitive advantage)
    optimal_approach: q.most_common_approach,
    common_struggle: q.common_struggle,
    success_rate: q.reported_success_rate,
    real_world_application: q.real_world_use_case,

    // Actionable intelligence
    hints_frequently_given: q.all_hints_given || [],
    mistakes_to_avoid: q.all_common_mistakes || [],
    preparation_resources: q.prep_resources || [],
    interviewer_priorities: q.interviewer_priorities || [],
    common_followups: q.common_followups || [],

    // Context
    companies_asking: q.companies_asking || [],
    relevant_roles: q.roles || [],

    // Preparation priority
    prep_priority: calculatePrepPriority(q)
  }));

  // Interviewer focus patterns
  const focusPatterns = interviewerFocus.map(f => ({
    focus_area: f.focus_area,
    frequency: f.frequency,
    correlation_with_success: Math.round((f.correlation_with_success || 0) * 100),
    priority: (f.correlation_with_success || 0) > 0.7 ? 'critical' :
      (f.correlation_with_success || 0) > 0.5 ? 'important' : 'standard',

    // Context
    top_companies: f.top_companies || [],
    difficulty_levels: f.difficulty_levels || [],

    // Outcome breakdown
    success_correlation_explanation: generateSuccessCorrelationExplanation(f),

    // Actionable advice
    how_to_demonstrate: generateDemonstrationAdvice(f.focus_area)
  }));

  return {
    top_questions: topQuestions,
    what_interviewers_value: focusPatterns,
    total_questions_analyzed: questions.length,
    insights: {
      most_tested_category: questions[0]?.llm_category || 'Unknown',
      average_question_frequency: questions.length > 0
        ? Math.round(questions.reduce((sum, q) => sum + q.asked_count, 0) / questions.length)
        : 0
    }
  };
}

/**
 * Generate Timeline Intelligence section
 */
function generateTimelineIntelligence(timelines) {
  const companyTimelines = timelines.map(t => ({
    company: t.company,
    role: t.role,
    experience_level: t.experience_level,

    // Process metrics
    avg_rounds: t.avg_rounds,
    median_rounds: t.median_rounds,
    range: { min: t.min_rounds, max: t.max_rounds },
    typical_timeline: t.typical_timeline,

    // Outcome metrics
    sample_size: t.sample_size,
    success_rate: Math.round((t.success_rate || 0) * 100),
    confidence: t.sample_size >= 5 ? 'high' : t.sample_size >= 3 ? 'medium' : 'low',

    // Process characteristics
    most_common_format: t.most_common_format,
    most_common_location: t.most_common_location,
    referral_rate: Math.round((t.referral_rate || 0) * 100),
    negotiation_rate: Math.round((t.negotiation_rate || 0) * 100),

    // Strategic insights
    preparation_strategy: generatePreparationStrategy(t)
  }));

  return {
    by_company: companyTimelines,
    total_patterns: timelines.length,
    insights: {
      longest_process: timelines.length > 0
        ? { company: timelines[0].company, rounds: timelines[0].avg_rounds }
        : null,
      most_successful_company: timelines.length > 0
        ? timelines.reduce((max, t) => (t.success_rate || 0) > (max.success_rate || 0) ? t : max)
        : null
    }
  };
}

/**
 * Generate Experience Level Insights section
 */
function generateExperienceLevelInsights(experienceLevels) {
  const levelComparison = experienceLevels.map(level => ({
    experience_level: level.experience_level,
    total_posts: level.total_posts,

    // Process metrics
    avg_rounds: level.avg_rounds,
    success_rate: Math.round((level.success_rate || 0) * 100),

    // Difficulty distribution
    difficulty_distribution: {
      easy: level.easy_count || 0,
      medium: level.medium_count || 0,
      hard: level.hard_count || 0
    },

    // Behavioral patterns
    referral_usage_rate: Math.round((level.referral_usage_rate || 0) * 100),
    negotiation_rate: Math.round((level.negotiation_rate || 0) * 100),
    preferred_format: level.preferred_format,
    preferred_location: level.preferred_location,

    // Strategic insights
    key_differentiator: generateLevelDifferentiator(level)
  }));

  return {
    level_comparison: levelComparison,
    insights: {
      most_challenging_level: levelComparison.length > 0
        ? levelComparison.reduce((min, l) => (l.success_rate < min.success_rate ? l : min))
        : null,
      negotiation_by_level: levelComparison.map(l => ({
        level: l.experience_level,
        rate: l.negotiation_rate
      }))
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStatisticalConfidence(sampleSize) {
  if (sampleSize >= 30) return 'high';
  if (sampleSize >= 15) return 'medium';
  return 'low';
}

function getConfidenceExplanation(confidence, sampleSize) {
  const explanations = {
    high: `High confidence (n=${sampleSize}): Statistically significant, robust insights`,
    medium: `Medium confidence (n=${sampleSize}): Directionally accurate, interpret with context`,
    low: `Low confidence (n=${sampleSize}): Preliminary insights, seek additional data`
  };
  return explanations[confidence];
}

function calculateReferralMultiplier(data) {
  const referralRate = data.referral_success_rate || 0;
  const nonReferralRate = data.non_referral_success_rate || 0;

  if (!referralRate || !nonReferralRate || nonReferralRate === 0) {
    return null;
  }

  return (referralRate / nonReferralRate).toFixed(1);
}

function generateMitigationStrategy(rejectionReason) {
  const lowerReason = (rejectionReason || '').toLowerCase();

  const strategies = {
    'system design': 'Study: Grokking System Design Interview, Designing Data-Intensive Applications. Practice: 3 mock system designs weekly on Pramp/Interviewing.io. Focus: Distributed systems, scalability, trade-offs.',
    'coding': 'Practice: 3-5 LeetCode medium/hard daily. Focus: Time/space complexity analysis, edge cases. Resources: NeetCode roadmap, Blind 75.',
    'communication': 'Improve: Think-aloud problem solving, structured responses (STAR method). Practice: Mock interviews with feedback. Read: Cracking the Coding Interview Chapter 1-2.',
    'cultural fit': 'Research: Company values, mission, recent news. Prepare: Behavioral examples (STAR format). Network: Connect with current employees, attend meetups.',
    'experience': 'Demonstrate: Past projects with measurable impact. Prepare: Portfolio showcasing relevant skills. Bridge gaps: Online courses, side projects in target domain.',
    'technical depth': 'Deepen: Fundamentals (data structures, algorithms, OS, networks). Practice: Explain concepts simply. Resource: System Design Primer, CS fundamentals courses.'
  };

  for (const [key, strategy] of Object.entries(strategies)) {
    if (lowerReason.includes(key)) {
      return strategy;
    }
  }

  return 'Review detailed feedback. Identify specific skill gaps. Create targeted study plan. Seek mentorship in weak areas.';
}

function analyzeRejectionPatterns(rejections) {
  const byDifficulty = {};
  const byExperienceLevel = {};

  rejections.forEach(r => {
    if (r.most_common_difficulty) {
      byDifficulty[r.most_common_difficulty] = (byDifficulty[r.most_common_difficulty] || 0) + r.frequency;
    }
    if (r.most_common_experience_level) {
      byExperienceLevel[r.most_common_experience_level] = (byExperienceLevel[r.most_common_experience_level] || 0) + r.frequency;
    }
  });

  return {
    difficulty_concentration: Object.entries(byDifficulty)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count),
    experience_level_patterns: Object.entries(byExperienceLevel)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count)
  };
}

function calculatePrepPriority(question) {
  const frequency = question.asked_count || 0;
  const difficulty = question.llm_difficulty || '';

  if (frequency >= 10 && difficulty === 'hard') return 'critical';
  if (frequency >= 5) return 'high';
  if (frequency >= 2) return 'medium';
  return 'low';
}

function generateSuccessCorrelationExplanation(focus) {
  const correlation = focus.correlation_with_success || 0;
  const frequency = focus.frequency || 0;

  if (correlation > 0.7) {
    return `Strong predictor of success (${Math.round(correlation * 100)}% correlation, ${frequency} cases). Mastering this is critical.`;
  } else if (correlation > 0.5) {
    return `Moderate predictor (${Math.round(correlation * 100)}% correlation, ${frequency} cases). Important but not decisive.`;
  } else {
    return `Weak correlation (${Math.round(correlation * 100)}%). Necessary but not sufficient for success.`;
  }
}

function generateDemonstrationAdvice(focusArea) {
  const advice = {
    'code quality': 'Write clean, readable code. Use meaningful variable names. Add comments for complex logic. Follow language conventions.',
    'communication': 'Think aloud. Explain your approach before coding. Clarify requirements. Ask questions.',
    'problem solving': 'Break down problem. Consider edge cases. Discuss trade-offs. Iterate on solution.',
    'optimization': 'Analyze time/space complexity. Identify bottlenecks. Propose improvements. Justify optimizations.',
    'testing': 'Write test cases. Cover edge cases. Discuss testing strategy. Mention integration tests.',
    'scalability': 'Discuss distributed systems. Consider load balancing. Address single points of failure. Plan for growth.'
  };

  for (const [key, value] of Object.entries(advice)) {
    if (focusArea.toLowerCase().includes(key)) {
      return value;
    }
  }

  return `Demonstrate ${focusArea} through clear examples and structured communication.`;
}

function generatePreparationStrategy(timeline) {
  const rounds = timeline.avg_rounds || 0;
  const successRate = timeline.success_rate || 0;

  if (rounds >= 5) {
    return `Extended process (${rounds} rounds) - pace yourself over 6-8 weeks. Maintain technical sharpness throughout. Success rate: ${Math.round(successRate * 100)}%.`;
  } else if (rounds <= 2) {
    return `Quick process (${rounds} rounds) - be ready immediately. First impression critical. Success rate: ${Math.round(successRate * 100)}%.`;
  } else {
    return `Standard process (${rounds} rounds) - steady 3-4 week preparation. Success rate: ${Math.round(successRate * 100)}%.`;
  }
}

function generateLevelDifferentiator(level) {
  const experienceLevel = level.experience_level || '';
  const avgRounds = level.avg_rounds || 0;
  const successRate = level.success_rate || 0;

  const insights = {
    entry: `Entry-level: ${avgRounds} rounds avg. Focus on fundamentals, communication. Success rate: ${Math.round(successRate * 100)}%.`,
    mid: `Mid-level: ${avgRounds} rounds avg. Expect system design + coding depth. Success rate: ${Math.round(successRate * 100)}%.`,
    senior: `Senior: ${avgRounds} rounds avg. Leadership, architecture, mentoring focus. Success rate: ${Math.round(successRate * 100)}%.`,
    intern: `Intern: ${avgRounds} rounds avg. Fundamentals + eagerness to learn. Success rate: ${Math.round(successRate * 100)}%.`
  };

  return insights[experienceLevel.toLowerCase()] || `${avgRounds} rounds, ${Math.round(successRate * 100)}% success rate.`;
}

function generateReferralAdvice(data) {
  const multiplier = calculateReferralMultiplier(data);

  if (!multiplier) {
    return 'Insufficient data on referral impact. Network building generally recommended.';
  }

  const multiplierNum = parseFloat(multiplier);

  if (multiplierNum >= 2.5) {
    return `Referrals are CRITICAL (${multiplier}x multiplier). Allocate 30-40% of prep time to networking: attend meetups, request informational interviews, leverage LinkedIn. This is your highest ROI activity.`;
  } else if (multiplierNum >= 1.5) {
    return `Referrals are valuable (${multiplier}x multiplier). Spend 20-30% of prep time networking. Target: 2-3 employee connections per target company.`;
  } else {
    return `Referrals helpful but not decisive (${multiplier}x multiplier). Focus primarily on technical preparation. Network strategically for cultural insights.`;
  }
}

module.exports = {
  generateEnhancedIntelligence
};
