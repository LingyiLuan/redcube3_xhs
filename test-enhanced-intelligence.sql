-- Test Enhanced Intelligence Queries
-- Validates Phase 1 implementation against 664-post foundation pool

\echo '================================================================================';
\echo 'Testing Enhanced Intelligence Database Queries';
\echo '================================================================================';
\echo '';

-- Test 1: Foundation Pool Size
\echo '📊 Test 1: Foundation Pool Size';
\echo '---';
SELECT
  COUNT(*) as total_posts,
  COUNT(CASE WHEN llm_extracted_at IS NOT NULL THEN 1 END) as posts_with_llm,
  ROUND(COUNT(CASE WHEN llm_extracted_at IS NOT NULL THEN 1 END)::numeric / COUNT(*) * 100, 2) as extraction_percentage
FROM scraped_posts
WHERE is_relevant = true;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 2: Hiring Process Intelligence
\echo '📈 Test 2: Hiring Process Intelligence (Sample: First 100 posts)';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  -- Process Metrics
  COUNT(*) as total_posts,
  ROUND(AVG(total_rounds), 1) as avg_interview_rounds,

  -- Remote Work Distribution
  ROUND(COUNT(CASE WHEN remote_or_onsite = 'remote' THEN 1 END)::numeric /
    NULLIF(COUNT(remote_or_onsite), 0) * 100, 0) as remote_ratio_percent,

  -- Referral Impact
  ROUND(COUNT(CASE WHEN referral_used = true AND llm_outcome = 'passed' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN referral_used = true THEN 1 END), 0) * 100, 0) as referral_success_rate,
  ROUND(COUNT(CASE WHEN referral_used = false AND llm_outcome = 'passed' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN referral_used = false THEN 1 END), 0) * 100, 0) as non_referral_success_rate,

  -- Calculate multiplier
  ROUND(
    (COUNT(CASE WHEN referral_used = true AND llm_outcome = 'passed' THEN 1 END)::numeric /
      NULLIF(COUNT(CASE WHEN referral_used = true THEN 1 END), 0)) /
    NULLIF(
      (COUNT(CASE WHEN referral_used = false AND llm_outcome = 'passed' THEN 1 END)::numeric /
        NULLIF(COUNT(CASE WHEN referral_used = false THEN 1 END), 0)),
      0
    ),
    1
  ) as referral_multiplier,

  -- Negotiation
  ROUND(COUNT(CASE WHEN negotiation_occurred = true THEN 1 END)::numeric /
    NULLIF(COUNT(offer_accepted), 0) * 100, 0) as negotiation_rate_percent

FROM scraped_posts sp
WHERE sp.post_id IN (SELECT post_id FROM foundation_pool);

\echo '';
\echo '================================================================================';
\echo '';

-- Test 3: Rejection Intelligence
\echo '🚫 Test 3: Top Rejection Reasons';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  rejection_reason,
  COUNT(*) as frequency,
  ARRAY_AGG(DISTINCT llm_company) FILTER (WHERE llm_company IS NOT NULL) as companies,
  COUNT(CASE WHEN difficulty_level = 'hard' THEN 1 END) as hard_count
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)
  AND rejection_reason IS NOT NULL
  AND rejection_reason != ''
  AND llm_outcome = 'failed'
GROUP BY rejection_reason
ORDER BY frequency DESC
LIMIT 10;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 4: Question Intelligence
\echo '❓ Test 4: Top Interview Questions (Asked 2+ times)';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  LEFT(q.question_text, 80) as question_truncated,
  COUNT(*) as asked_count,
  q.llm_difficulty,
  q.llm_category,
  ROUND(AVG(q.estimated_time_minutes), 0) as avg_time_minutes,
  ARRAY_AGG(DISTINCT q.company) FILTER (WHERE q.company IS NOT NULL) as companies_asking
FROM interview_questions q
WHERE q.post_id IN (SELECT post_id FROM foundation_pool)
  AND q.llm_extracted_at IS NOT NULL
GROUP BY q.question_text, q.llm_difficulty, q.llm_category
HAVING COUNT(*) >= 2
ORDER BY asked_count DESC, q.llm_difficulty DESC
LIMIT 10;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 5: Interviewer Focus Patterns
\echo '🎯 Test 5: What Interviewers Value Most';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
),
focus_areas AS (
  SELECT
    post_id,
    JSONB_ARRAY_ELEMENTS_TEXT(interviewer_focused_on) as focus_area
  FROM interview_questions
  WHERE post_id IN (SELECT post_id FROM foundation_pool)
    AND interviewer_focused_on IS NOT NULL
    AND interviewer_focused_on != '[]'::jsonb
)
SELECT
  focus_area,
  COUNT(*) as frequency,
  ROUND(AVG(CASE WHEN sp.llm_outcome = 'passed' THEN 1 ELSE 0 END) * 100, 0) as success_correlation_percent
FROM focus_areas f
JOIN scraped_posts sp ON sp.post_id = f.post_id
GROUP BY focus_area
HAVING COUNT(*) >= 3
ORDER BY frequency DESC
LIMIT 10;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 6: Timeline Patterns by Company
\echo '⏱️  Test 6: Interview Timeline Patterns';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  llm_company as company,
  llm_role as role,
  ROUND(AVG(total_rounds), 1) as avg_rounds,
  COUNT(*) as sample_size,
  ROUND(AVG(CASE WHEN llm_outcome = 'passed' THEN 1 ELSE 0 END) * 100, 0) as success_rate_percent
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)
  AND llm_company IS NOT NULL
  AND total_rounds IS NOT NULL
GROUP BY llm_company, llm_role
HAVING COUNT(*) >= 3
ORDER BY sample_size DESC
LIMIT 10;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 7: Experience Level Breakdown
\echo '👥 Test 7: Metrics by Experience Level';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  llm_experience_level as experience_level,
  COUNT(*) as total_posts,
  ROUND(AVG(total_rounds), 1) as avg_rounds,
  ROUND(COUNT(CASE WHEN llm_outcome = 'passed' THEN 1 END)::numeric /
    NULLIF(COUNT(llm_outcome), 0) * 100, 0) as success_rate_percent,
  ROUND(COUNT(CASE WHEN referral_used = true THEN 1 END)::numeric /
    COUNT(*) * 100, 0) as referral_usage_percent
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)
  AND llm_experience_level IS NOT NULL
GROUP BY llm_experience_level
ORDER BY
  CASE llm_experience_level
    WHEN 'intern' THEN 1
    WHEN 'entry' THEN 2
    WHEN 'mid' THEN 3
    WHEN 'senior' THEN 4
    WHEN 'executive' THEN 5
    ELSE 6
  END;

\echo '';
\echo '================================================================================';
\echo '';

-- Test 8: Data Quality Metrics
\echo '✅ Test 8: Data Quality Metrics';
\echo '---';
WITH foundation_pool AS (
  SELECT post_id
  FROM scraped_posts
  WHERE is_relevant = true
    AND llm_extracted_at IS NOT NULL
  LIMIT 100
)
SELECT
  'Total Posts' as metric,
  COUNT(*) as value
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)

UNION ALL

SELECT
  'Posts with Total Rounds' as metric,
  COUNT(total_rounds) as value
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)

UNION ALL

SELECT
  'Posts with Location Data' as metric,
  COUNT(remote_or_onsite) as value
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)

UNION ALL

SELECT
  'Posts with Interview Format' as metric,
  COUNT(interview_format) as value
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)

UNION ALL

SELECT
  'Posts with Rejection Reasons' as metric,
  COUNT(rejection_reason) as value
FROM scraped_posts
WHERE post_id IN (SELECT post_id FROM foundation_pool)
  AND rejection_reason IS NOT NULL
  AND rejection_reason != ''

UNION ALL

SELECT
  'Total Questions Extracted' as metric,
  COUNT(*) as value
FROM interview_questions
WHERE post_id IN (SELECT post_id FROM foundation_pool)
  AND llm_extracted_at IS NOT NULL;

\echo '';
\echo '================================================================================';
\echo '✅ ALL TESTS COMPLETED';
\echo '================================================================================';
\echo '';
