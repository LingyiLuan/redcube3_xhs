/**
 * Enhanced Intelligence Query Service
 * Aggregates 21 new LLM-extracted fields for pattern analysis
 * Foundation Pool: (Seed Posts + RAG Posts)
 *
 * Data Source: scraped_posts table with 664/665 posts having comprehensive LLM extraction
 * Coverage: 99.85% extraction via aiService.analyzeText()
 */

const pool = require('../config/database');

/**
 * Get hiring process intelligence from foundation pool
 * Extracts: Interview rounds, format, location, offers, negotiation, referrals
 *
 * @param {Array<string>} postIds - Foundation pool post IDs (Seed + RAG)
 * @returns {Promise<Object>} Hiring process metrics
 */
async function getHiringProcessIntelligence(postIds) {
  const query = `
    SELECT
      -- Process Metrics
      COUNT(*) as total_posts,
      ROUND(AVG(total_rounds), 1) as avg_interview_rounds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_rounds) as median_interview_rounds,
      MIN(total_rounds) as min_rounds,
      MAX(total_rounds) as max_rounds,

      -- Remote Work Distribution
      COUNT(CASE WHEN remote_or_onsite = 'remote' THEN 1 END) as remote_count,
      COUNT(CASE WHEN remote_or_onsite = 'remote' THEN 1 END)::float /
        NULLIF(COUNT(remote_or_onsite), 0) as remote_ratio,
      COUNT(CASE WHEN remote_or_onsite = 'hybrid' THEN 1 END)::float /
        NULLIF(COUNT(remote_or_onsite), 0) as hybrid_ratio,
      COUNT(CASE WHEN remote_or_onsite = 'onsite' THEN 1 END)::float /
        NULLIF(COUNT(remote_or_onsite), 0) as onsite_ratio,

      -- Interview Format Breakdown
      COUNT(CASE WHEN interview_format = 'video' THEN 1 END) as video_count,
      COUNT(CASE WHEN interview_format = 'video' THEN 1 END)::float /
        NULLIF(COUNT(interview_format), 0) as video_interview_ratio,
      COUNT(CASE WHEN interview_format = 'phone' THEN 1 END)::float /
        NULLIF(COUNT(interview_format), 0) as phone_interview_ratio,
      COUNT(CASE WHEN interview_format = 'in-person' THEN 1 END)::float /
        NULLIF(COUNT(interview_format), 0) as in_person_ratio,
      COUNT(CASE WHEN interview_format = 'take-home' THEN 1 END)::float /
        NULLIF(COUNT(interview_format), 0) as takehome_ratio,
      COUNT(CASE WHEN interview_format = 'mixed' THEN 1 END)::float /
        NULLIF(COUNT(interview_format), 0) as mixed_format_ratio,

      -- Offer Metrics
      COUNT(CASE WHEN offer_accepted = true THEN 1 END) as offers_accepted,
      COUNT(CASE WHEN offer_accepted = false THEN 1 END) as offers_declined,
      COUNT(CASE WHEN offer_accepted = true THEN 1 END)::float /
        NULLIF(COUNT(offer_accepted), 0) as offer_acceptance_rate,
      COUNT(CASE WHEN offer_accepted = false THEN 1 END)::float /
        NULLIF(COUNT(offer_accepted), 0) as offer_decline_rate,

      -- Negotiation Intelligence
      COUNT(CASE WHEN negotiation_occurred = true THEN 1 END) as negotiation_count,
      COUNT(CASE WHEN negotiation_occurred = true THEN 1 END)::float /
        NULLIF(COUNT(offer_accepted), 0) as negotiation_rate,
      COUNT(CASE WHEN negotiation_occurred = true AND offer_accepted = true THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN negotiation_occurred = true THEN 1 END), 0) as negotiation_success_rate,
      COUNT(CASE WHEN negotiation_occurred = false AND offer_accepted = true THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN negotiation_occurred = false THEN 1 END), 0) as no_negotiation_success_rate,

      -- Referral Impact Analysis
      COUNT(CASE WHEN referral_used = true THEN 1 END) as referral_count,
      COUNT(CASE WHEN referral_used = true THEN 1 END)::float /
        COUNT(*) as referral_usage_rate,
      COUNT(CASE WHEN referral_used = true AND llm_outcome = 'passed' THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN referral_used = true THEN 1 END), 0) as referral_success_rate,
      COUNT(CASE WHEN referral_used = false AND llm_outcome = 'passed' THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN referral_used = false THEN 1 END), 0) as non_referral_success_rate,

      -- Referral by experience level
      COUNT(CASE WHEN referral_used = true AND llm_experience_level = 'entry' THEN 1 END) as referral_entry,
      COUNT(CASE WHEN referral_used = true AND llm_experience_level = 'mid' THEN 1 END) as referral_mid,
      COUNT(CASE WHEN referral_used = true AND llm_experience_level = 'senior' THEN 1 END) as referral_senior,

      -- Compensation Discussion
      COUNT(CASE WHEN compensation_mentioned = true THEN 1 END) as comp_mentioned_count,
      COUNT(CASE WHEN compensation_mentioned = true THEN 1 END)::float /
        COUNT(*) as compensation_discussion_rate,
      COUNT(CASE WHEN compensation_mentioned = true AND llm_outcome = 'passed' THEN 1 END)::float /
        NULLIF(COUNT(CASE WHEN compensation_mentioned = true THEN 1 END), 0) as comp_discussion_success_rate,

      -- Background Check Mentions
      COUNT(CASE WHEN background_check_mentioned = true THEN 1 END)::float /
        COUNT(*) as background_check_rate,

      -- Data Quality Metrics
      COUNT(llm_extracted_at) as posts_with_llm_extraction,
      COUNT(llm_extracted_at)::float / COUNT(*) as extraction_coverage,
      COUNT(remote_or_onsite) as location_data_points,
      COUNT(interview_format) as format_data_points,
      COUNT(total_rounds) as rounds_data_points

    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND is_relevant = true
      AND llm_extracted_at IS NOT NULL
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows[0];
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getHiringProcessIntelligence:', error);
    throw error;
  }
}

/**
 * Get rejection reason intelligence with patterns
 * Groups by reason, company, role, experience level, difficulty
 *
 * @param {Array<string>} postIds - Foundation pool post IDs
 * @returns {Promise<Array>} Top rejection reasons with context
 */
async function getRejectionIntelligence(postIds) {
  const query = `
    SELECT
      rejection_reason,
      COUNT(*) as frequency,

      -- Context aggregation
      ARRAY_AGG(DISTINCT llm_company) FILTER (WHERE llm_company IS NOT NULL) as companies,
      ARRAY_AGG(DISTINCT llm_role) FILTER (WHERE llm_role IS NOT NULL) as roles,
      ARRAY_AGG(DISTINCT llm_experience_level) FILTER (WHERE llm_experience_level IS NOT NULL) as experience_levels,

      -- Difficulty breakdown
      COUNT(CASE WHEN difficulty_level = 'easy' THEN 1 END) as difficulty_easy,
      COUNT(CASE WHEN difficulty_level = 'medium' THEN 1 END) as difficulty_medium,
      COUNT(CASE WHEN difficulty_level = 'hard' THEN 1 END) as difficulty_hard,

      -- Most common context
      MODE() WITHIN GROUP (ORDER BY llm_company) as most_common_company,
      MODE() WITHIN GROUP (ORDER BY difficulty_level) as most_common_difficulty,
      MODE() WITHIN GROUP (ORDER BY llm_experience_level) as most_common_experience_level

    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND rejection_reason IS NOT NULL
      AND rejection_reason != ''
      AND llm_outcome = 'failed'
    GROUP BY rejection_reason
    ORDER BY frequency DESC
    LIMIT 20
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows;
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getRejectionIntelligence:', error);
    throw error;
  }
}

/**
 * Get enhanced question intelligence with rich metadata
 * Aggregates 15 question-level fields from interview_questions table
 *
 * @param {Array<string>} postIds - Foundation pool post IDs
 * @returns {Promise<Array>} Top questions with metadata
 */
async function getEnhancedQuestionIntelligence(postIds) {
  const query = `
    SELECT
      q.question_text,
      COUNT(*) as asked_count,
      q.llm_difficulty,
      q.llm_category,
      q.question_type,

      -- Time allocation
      ROUND(AVG(q.estimated_time_minutes), 0) as avg_time_minutes,
      MIN(q.estimated_time_minutes) as min_time_minutes,
      MAX(q.estimated_time_minutes) as max_time_minutes,

      -- Most common metadata
      MODE() WITHIN GROUP (ORDER BY q.optimal_approach) as most_common_approach,
      MODE() WITHIN GROUP (ORDER BY q.candidate_struggled_with) as common_struggle,
      MODE() WITHIN GROUP (ORDER BY q.success_rate_reported) as reported_success_rate,
      MODE() WITHIN GROUP (ORDER BY q.real_world_application) as real_world_use_case,

      -- Company/Role context
      ARRAY_AGG(DISTINCT q.company) FILTER (WHERE q.company IS NOT NULL) as companies_asking,
      ARRAY_AGG(DISTINCT q.role_type) FILTER (WHERE q.role_type IS NOT NULL) as roles,

      -- Aggregate JSONB arrays (hints, mistakes, resources, interviewer focus)
      (
        SELECT JSONB_AGG(DISTINCT hint)
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(hints_given) as hint
          FROM interview_questions iq
          WHERE iq.question_text = q.question_text
            AND iq.post_id = ANY($1)
            AND iq.hints_given IS NOT NULL
            AND iq.hints_given != '[]'::jsonb
          LIMIT 100
        ) hints
      ) as all_hints_given,

      (
        SELECT JSONB_AGG(DISTINCT mistake)
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(common_mistakes) as mistake
          FROM interview_questions iq
          WHERE iq.question_text = q.question_text
            AND iq.post_id = ANY($1)
            AND iq.common_mistakes IS NOT NULL
            AND iq.common_mistakes != '[]'::jsonb
          LIMIT 100
        ) mistakes
      ) as all_common_mistakes,

      (
        SELECT JSONB_AGG(DISTINCT resource)
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(preparation_resources) as resource
          FROM interview_questions iq
          WHERE iq.question_text = q.question_text
            AND iq.post_id = ANY($1)
            AND iq.preparation_resources IS NOT NULL
            AND iq.preparation_resources != '[]'::jsonb
          LIMIT 100
        ) resources
      ) as prep_resources,

      (
        SELECT JSONB_AGG(DISTINCT focus)
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(interviewer_focused_on) as focus
          FROM interview_questions iq
          WHERE iq.question_text = q.question_text
            AND iq.post_id = ANY($1)
            AND iq.interviewer_focused_on IS NOT NULL
            AND iq.interviewer_focused_on != '[]'::jsonb
          LIMIT 100
        ) focuses
      ) as interviewer_priorities,

      (
        SELECT JSONB_AGG(DISTINCT followup)
        FROM (
          SELECT JSONB_ARRAY_ELEMENTS_TEXT(follow_up_questions) as followup
          FROM interview_questions iq
          WHERE iq.question_text = q.question_text
            AND iq.post_id = ANY($1)
            AND iq.follow_up_questions IS NOT NULL
            AND iq.follow_up_questions != '[]'::jsonb
          LIMIT 100
        ) followups
      ) as common_followups

    FROM interview_questions q
    WHERE q.post_id = ANY($1)
      AND q.llm_extracted_at IS NOT NULL
    GROUP BY q.question_text, q.llm_difficulty, q.llm_category, q.question_type
    HAVING COUNT(*) >= 2  -- Only questions asked 2+ times
    ORDER BY asked_count DESC, q.llm_difficulty DESC
    LIMIT 50
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows;
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getEnhancedQuestionIntelligence:', error);
    throw error;
  }
}

/**
 * Get interviewer focus patterns across all questions
 * Identifies what interviewers value most (e.g., "code quality", "communication")
 *
 * @param {Array<string>} postIds - Foundation pool post IDs
 * @returns {Promise<Array>} Top focus areas with success correlation
 */
async function getInterviewerFocusPatterns(postIds) {
  const query = `
    SELECT
      focus_area,
      COUNT(*) as frequency,
      ROUND(AVG(CASE WHEN sp.llm_outcome = 'passed' THEN 1 ELSE 0 END), 2) as correlation_with_success,

      -- Context
      ARRAY_AGG(DISTINCT sp.llm_company) FILTER (WHERE sp.llm_company IS NOT NULL) as top_companies,
      ARRAY_AGG(DISTINCT iq.llm_difficulty) FILTER (WHERE iq.llm_difficulty IS NOT NULL) as difficulty_levels,

      -- Success breakdown
      COUNT(CASE WHEN sp.llm_outcome = 'passed' THEN 1 END) as times_led_to_success,
      COUNT(CASE WHEN sp.llm_outcome = 'failed' THEN 1 END) as times_led_to_failure

    FROM (
      SELECT
        post_id,
        JSONB_ARRAY_ELEMENTS_TEXT(interviewer_focused_on) as focus_area
      FROM interview_questions
      WHERE post_id = ANY($1)
        AND interviewer_focused_on IS NOT NULL
        AND interviewer_focused_on != '[]'::jsonb
    ) focuses
    JOIN scraped_posts sp ON sp.post_id = focuses.post_id
    LEFT JOIN interview_questions iq ON iq.post_id = focuses.post_id

    GROUP BY focus_area
    HAVING COUNT(*) >= 3  -- Minimum 3 occurrences for statistical validity
    ORDER BY frequency DESC, correlation_with_success DESC
    LIMIT 15
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows;
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getInterviewerFocusPatterns:', error);
    throw error;
  }
}

/**
 * Get timeline patterns by company and role
 * Extracts: Average rounds, typical timeline description, success rate
 *
 * @param {Array<string>} postIds - Foundation pool post IDs
 * @returns {Promise<Array>} Timeline patterns with company/role context
 */
async function getTimelinePatterns(postIds) {
  const query = `
    SELECT
      llm_company as company,
      llm_role as role,
      llm_experience_level as experience_level,

      -- Process metrics
      ROUND(AVG(total_rounds), 1) as avg_rounds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_rounds) as median_rounds,
      MIN(total_rounds) as min_rounds,
      MAX(total_rounds) as max_rounds,

      -- Timeline description (most common)
      MODE() WITHIN GROUP (ORDER BY timeline->>'description') as typical_timeline,

      -- Outcome metrics
      COUNT(*) as sample_size,
      COUNT(CASE WHEN llm_outcome = 'passed' THEN 1 END) as passed_count,
      COUNT(CASE WHEN llm_outcome = 'failed' THEN 1 END) as failed_count,
      ROUND(AVG(CASE WHEN llm_outcome = 'passed' THEN 1 ELSE 0 END), 2) as success_rate,

      -- Format preferences
      MODE() WITHIN GROUP (ORDER BY interview_format) as most_common_format,
      MODE() WITHIN GROUP (ORDER BY remote_or_onsite) as most_common_location,

      -- Additional context
      AVG(CASE WHEN referral_used = true THEN 1 ELSE 0 END) as referral_rate,
      AVG(CASE WHEN negotiation_occurred = true THEN 1 ELSE 0 END) as negotiation_rate

    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND llm_company IS NOT NULL
      AND llm_role IS NOT NULL
      AND total_rounds IS NOT NULL
      AND llm_extracted_at IS NOT NULL
    GROUP BY llm_company, llm_role, llm_experience_level
    HAVING COUNT(*) >= 3  -- Minimum 3 data points for statistical validity
    ORDER BY sample_size DESC, avg_rounds DESC
    LIMIT 20
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows;
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getTimelinePatterns:', error);
    throw error;
  }
}

/**
 * Get experience level breakdown for all metrics
 * Compares entry vs mid vs senior across all dimensions
 *
 * @param {Array<string>} postIds - Foundation pool post IDs
 * @returns {Promise<Array>} Metrics by experience level
 */
async function getExperienceLevelBreakdown(postIds) {
  const query = `
    SELECT
      llm_experience_level as experience_level,
      COUNT(*) as total_posts,

      -- Process metrics
      ROUND(AVG(total_rounds), 1) as avg_rounds,

      -- Success rate
      COUNT(CASE WHEN llm_outcome = 'passed' THEN 1 END)::float /
        NULLIF(COUNT(llm_outcome), 0) as success_rate,

      -- Difficulty distribution
      COUNT(CASE WHEN difficulty_level = 'easy' THEN 1 END) as easy_count,
      COUNT(CASE WHEN difficulty_level = 'medium' THEN 1 END) as medium_count,
      COUNT(CASE WHEN difficulty_level = 'hard' THEN 1 END) as hard_count,

      -- Referral usage
      COUNT(CASE WHEN referral_used = true THEN 1 END)::float /
        COUNT(*) as referral_usage_rate,

      -- Negotiation behavior
      COUNT(CASE WHEN negotiation_occurred = true THEN 1 END)::float /
        NULLIF(COUNT(offer_accepted), 0) as negotiation_rate,

      -- Format preferences
      MODE() WITHIN GROUP (ORDER BY interview_format) as preferred_format,
      MODE() WITHIN GROUP (ORDER BY remote_or_onsite) as preferred_location

    FROM scraped_posts
    WHERE post_id = ANY($1)
      AND llm_experience_level IS NOT NULL
      AND llm_extracted_at IS NOT NULL
    GROUP BY llm_experience_level
    ORDER BY
      CASE llm_experience_level
        WHEN 'intern' THEN 1
        WHEN 'entry' THEN 2
        WHEN 'mid' THEN 3
        WHEN 'senior' THEN 4
        WHEN 'executive' THEN 5
        ELSE 6
      END
  `;

  try {
    const result = await pool.query(query, [postIds]);
    return result.rows;
  } catch (error) {
    console.error('[Enhanced Intelligence] Error in getExperienceLevelBreakdown:', error);
    throw error;
  }
}

module.exports = {
  getHiringProcessIntelligence,
  getRejectionIntelligence,
  getEnhancedQuestionIntelligence,
  getInterviewerFocusPatterns,
  getTimelinePatterns,
  getExperienceLevelBreakdown
};
