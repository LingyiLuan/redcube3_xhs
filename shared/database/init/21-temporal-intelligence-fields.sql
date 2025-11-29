--
-- Temporal Intelligence Fields - Enable Time-Series Trend Analysis
-- Date: 2025-11-17
-- Purpose: Track when interviews occurred to analyze temporal trends (2024 vs 2025)
--

-- Add temporal fields to scraped_posts
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS post_year_quarter VARCHAR(20);

-- Create indexes for fast temporal queries
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_date
ON scraped_posts(interview_date)
WHERE interview_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scraped_posts_year_quarter
ON scraped_posts(post_year_quarter)
WHERE post_year_quarter IS NOT NULL;

-- Create composite index for role + time period queries
CREATE INDEX IF NOT EXISTS idx_scraped_posts_role_quarter
ON scraped_posts(role_type, post_year_quarter)
WHERE post_year_quarter IS NOT NULL;

-- Create composite index for company + time period queries
CREATE INDEX IF NOT EXISTS idx_scraped_posts_company_quarter
ON scraped_posts(
  (metadata->>'company'),
  post_year_quarter
)
WHERE post_year_quarter IS NOT NULL;

-- Add comments
COMMENT ON COLUMN scraped_posts.interview_date IS 'When the interview occurred (extracted from post content or metadata)';
COMMENT ON COLUMN scraped_posts.post_year_quarter IS 'Time period in format YYYY-QN (e.g., 2024-Q4, 2025-Q1)';

-- Create function to compute year-quarter from date
CREATE OR REPLACE FUNCTION compute_year_quarter(input_date DATE) RETURNS VARCHAR(20) AS $$
BEGIN
  IF input_date IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN TO_CHAR(input_date, 'YYYY') || '-Q' || TO_CHAR(input_date, 'Q');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill post_year_quarter from scraped_at for posts without explicit interview_date
UPDATE scraped_posts
SET post_year_quarter = compute_year_quarter(scraped_at::DATE)
WHERE post_year_quarter IS NULL
  AND scraped_at IS NOT NULL;

-- Create view for temporal trend analysis
CREATE OR REPLACE VIEW temporal_trends_view AS
SELECT
  post_year_quarter,
  role_type,
  metadata->>'company' as company,
  COUNT(*) as post_count,
  COUNT(*) FILTER (WHERE outcome = 'offer') as offers_count,
  COUNT(*) FILTER (WHERE outcome = 'rejected') as rejected_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE outcome = 'offer') / NULLIF(COUNT(*), 0), 1) as success_rate,
  MIN(scraped_at) as earliest_post,
  MAX(scraped_at) as latest_post
FROM scraped_posts
WHERE post_year_quarter IS NOT NULL
  AND outcome IS NOT NULL
GROUP BY post_year_quarter, role_type, metadata->>'company'
ORDER BY post_year_quarter DESC, post_count DESC;

COMMENT ON VIEW temporal_trends_view IS 'Aggregated temporal trends for quick analysis';

-- Verify temporal coverage
DO $$
DECLARE
  total_posts INTEGER;
  with_interview_date INTEGER;
  with_year_quarter INTEGER;
  coverage_interview NUMERIC;
  coverage_quarter NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM scraped_posts WHERE outcome IS NOT NULL;
  SELECT COUNT(*) INTO with_interview_date FROM scraped_posts WHERE outcome IS NOT NULL AND interview_date IS NOT NULL;
  SELECT COUNT(*) INTO with_year_quarter FROM scraped_posts WHERE outcome IS NOT NULL AND post_year_quarter IS NOT NULL;

  coverage_interview := ROUND(100.0 * with_interview_date / NULLIF(total_posts, 0), 1);
  coverage_quarter := ROUND(100.0 * with_year_quarter / NULLIF(total_posts, 0), 1);

  RAISE NOTICE 'Temporal Coverage Report:';
  RAISE NOTICE '  Total posts with outcomes: %', total_posts;
  RAISE NOTICE '  Posts with interview_date: %', with_interview_date;
  RAISE NOTICE '  Posts with post_year_quarter: %', with_year_quarter;
  RAISE NOTICE '  Coverage interview_date: % percent', coverage_interview;
  RAISE NOTICE '  Coverage post_year_quarter: % percent', coverage_quarter;
  RAISE NOTICE ' ';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run interview date extraction for remaining % posts', (total_posts - with_interview_date);
  RAISE NOTICE '  2. Target: 80+ percent coverage for accurate temporal analysis';
END $$;
