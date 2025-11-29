-- Migration 23: Enhanced Parent Table Fields for Interview Posts
-- Purpose: Add 10 strategic fields for future-proof interview intelligence
-- These fields capture critical hiring process details that LLM can extract

-- Add enhanced interview process fields
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS total_rounds INTEGER,
ADD COLUMN IF NOT EXISTS remote_or_onsite VARCHAR(20) CHECK (remote_or_onsite IN ('remote', 'onsite', 'hybrid') OR remote_or_onsite IS NULL),
ADD COLUMN IF NOT EXISTS offer_accepted BOOLEAN,
ADD COLUMN IF NOT EXISTS compensation_mentioned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS negotiation_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_mentioned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS interview_format VARCHAR(50) CHECK (interview_format IN ('video', 'phone', 'in-person', 'take-home', 'mixed') OR interview_format IS NULL),
ADD COLUMN IF NOT EXISTS followup_actions TEXT;

-- Add indexes for filtering/searching
CREATE INDEX IF NOT EXISTS idx_scraped_posts_total_rounds ON scraped_posts(total_rounds);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_remote_or_onsite ON scraped_posts(remote_or_onsite);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_offer_accepted ON scraped_posts(offer_accepted);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_compensation_mentioned ON scraped_posts(compensation_mentioned);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_referral_used ON scraped_posts(referral_used);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_format ON scraped_posts(interview_format);

-- Add comments for documentation
COMMENT ON COLUMN scraped_posts.total_rounds IS 'Total number of interview rounds mentioned (LLM extracted)';
COMMENT ON COLUMN scraped_posts.remote_or_onsite IS 'Interview location type: remote/onsite/hybrid (LLM extracted)';
COMMENT ON COLUMN scraped_posts.offer_accepted IS 'Whether candidate accepted the job offer (LLM extracted)';
COMMENT ON COLUMN scraped_posts.compensation_mentioned IS 'Whether salary/TC was discussed in post (LLM extracted)';
COMMENT ON COLUMN scraped_posts.negotiation_occurred IS 'Whether candidate negotiated the offer (LLM extracted)';
COMMENT ON COLUMN scraped_posts.referral_used IS 'Whether candidate got referral (LLM extracted)';
COMMENT ON COLUMN scraped_posts.background_check_mentioned IS 'Whether background check was mentioned (LLM extracted)';
COMMENT ON COLUMN scraped_posts.rejection_reason IS 'Reason for rejection if mentioned (LLM extracted)';
COMMENT ON COLUMN scraped_posts.interview_format IS 'Primary interview format: video/phone/in-person/take-home/mixed (LLM extracted)';
COMMENT ON COLUMN scraped_posts.followup_actions IS 'Follow-up actions mentioned like thank you notes, checking status (LLM extracted)';
