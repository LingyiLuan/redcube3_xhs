-- Migration 27: Interview Intel UGC Platform
-- Creates tables for user-generated interview experiences with citation tracking and reputation system

-- ============================================================================
-- 0. PREREQUISITE TABLES
-- ============================================================================
-- Create users table if it doesn't exist (simple version for now)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create learning_maps table if it doesn't exist (simple version for now)
CREATE TABLE IF NOT EXISTS learning_maps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 1. INTERVIEW EXPERIENCES TABLE
-- ============================================================================
-- Core table storing user-submitted interview experiences

CREATE TABLE IF NOT EXISTS interview_experiences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Interview Details
  company VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  interview_date DATE,
  difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5), -- 1=Very Easy, 5=Very Hard
  outcome VARCHAR(50) CHECK(outcome IN ('Offer', 'Reject', 'Pending', 'Withdrew', 'No Response')),

  -- Content
  questions_asked TEXT[], -- Array of interview questions asked
  preparation_feedback TEXT, -- What preparation helped
  tips_for_others TEXT, -- Advice for future candidates
  areas_struggled TEXT[], -- Topics that were challenging

  -- Metadata
  verified BOOLEAN DEFAULT FALSE, -- Email verified
  verified_email_domain VARCHAR(255), -- e.g., "google.com" (company email verification)

  -- Engagement Metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0, -- How many learning maps reference this experience

  -- Impact Metrics (calculated)
  impact_score INTEGER DEFAULT 0, -- Weighted score: citations * 10 + upvotes * 2 + views
  helpfulness_ratio NUMERIC(5,2) DEFAULT 0.00, -- upvotes / (upvotes + downvotes)

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Soft delete
  deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_interview_experiences_company ON interview_experiences(company) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_role ON interview_experiences(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_difficulty ON interview_experiences(difficulty) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_outcome ON interview_experiences(outcome) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_created_at ON interview_experiences(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_citation_count ON interview_experiences(citation_count DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_impact_score ON interview_experiences(impact_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_interview_experiences_user_id ON interview_experiences(user_id) WHERE deleted_at IS NULL;

-- Full-text search index for questions and feedback
CREATE INDEX idx_interview_experiences_search ON interview_experiences
  USING gin(to_tsvector('english',
    COALESCE(array_to_string(questions_asked, ' '), '') || ' ' ||
    COALESCE(preparation_feedback, '') || ' ' ||
    COALESCE(tips_for_others, '')
  )) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. LEARNING MAP CITATIONS TABLE
-- ============================================================================
-- Tracks which learning maps reference which interview experiences
-- This is the key innovation: academic-style citation tracking

CREATE TABLE IF NOT EXISTS learning_map_citations (
  id SERIAL PRIMARY KEY,
  learning_map_id INTEGER NOT NULL REFERENCES learning_maps(id) ON DELETE CASCADE,
  interview_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,

  -- Citation context (optional)
  citation_type VARCHAR(50) DEFAULT 'reference', -- 'reference', 'inspiration', 'data_source'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate citations
  UNIQUE(learning_map_id, interview_experience_id)
);

CREATE INDEX idx_learning_map_citations_experience ON learning_map_citations(interview_experience_id);
CREATE INDEX idx_learning_map_citations_learning_map ON learning_map_citations(learning_map_id);

-- ============================================================================
-- 3. EXPERIENCE CITATIONS TABLE (OPTIONAL - PHASE 2)
-- ============================================================================
-- Allows experiences to cite other experiences (e.g., "Similar to Experience #123")

CREATE TABLE IF NOT EXISTS experience_citations (
  id SERIAL PRIMARY KEY,
  citing_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  cited_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate citations and self-citations
  UNIQUE(citing_experience_id, cited_experience_id),
  CHECK(citing_experience_id != cited_experience_id)
);

CREATE INDEX idx_experience_citations_cited ON experience_citations(cited_experience_id);
CREATE INDEX idx_experience_citations_citing ON experience_citations(citing_experience_id);

-- ============================================================================
-- 4. USER REPUTATION TABLE
-- ============================================================================
-- Tracks user reputation points, tiers, and badges

CREATE TABLE IF NOT EXISTS user_reputation (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Points
  total_points INTEGER DEFAULT 0,
  points_this_month INTEGER DEFAULT 0,
  points_all_time INTEGER DEFAULT 0,

  -- Tier (calculated from points)
  tier VARCHAR(50) DEFAULT 'New Contributor', -- 'New Contributor', 'Regular', 'Veteran', 'Expert', 'Legend'

  -- Badges (array of badge identifiers)
  badges JSONB DEFAULT '[]'::jsonb,

  -- Stats
  total_experiences_posted INTEGER DEFAULT 0,
  total_citations_received INTEGER DEFAULT 0,
  total_upvotes_received INTEGER DEFAULT 0,
  total_people_helped INTEGER DEFAULT 0, -- Sum of all citation counts

  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_reputation_total_points ON user_reputation(total_points DESC);
CREATE INDEX idx_user_reputation_tier ON user_reputation(tier);
CREATE INDEX idx_user_reputation_updated_at ON user_reputation(updated_at DESC);

-- ============================================================================
-- 5. REPUTATION EVENTS TABLE (AUDIT LOG)
-- ============================================================================
-- Tracks all reputation point changes for transparency

CREATE TABLE IF NOT EXISTS reputation_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL, -- 'experience_posted', 'experience_cited', 'upvote_received', 'badge_earned'
  points_delta INTEGER NOT NULL, -- Positive or negative points

  -- Context
  interview_experience_id INTEGER REFERENCES interview_experiences(id) ON DELETE SET NULL,
  learning_map_id INTEGER REFERENCES learning_maps(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reputation_events_user_id ON reputation_events(user_id, created_at DESC);
CREATE INDEX idx_reputation_events_type ON reputation_events(event_type);

-- ============================================================================
-- 6. EXPERIENCE VOTES TABLE
-- ============================================================================
-- Tracks individual user votes on experiences (upvote/downvote)

CREATE TABLE IF NOT EXISTS experience_votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,

  vote_type VARCHAR(10) CHECK(vote_type IN ('upvote', 'downvote')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- One vote per user per experience
  UNIQUE(user_id, interview_experience_id)
);

CREATE INDEX idx_experience_votes_experience ON experience_votes(interview_experience_id);
CREATE INDEX idx_experience_votes_user ON experience_votes(user_id);

-- ============================================================================
-- 7. EXPERIENCE COMMENTS TABLE (PHASE 2)
-- ============================================================================
-- Allows users to comment on interview experiences

CREATE TABLE IF NOT EXISTS experience_comments (
  id SERIAL PRIMARY KEY,
  interview_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  comment_text TEXT NOT NULL,

  -- Threading support
  parent_comment_id INTEGER REFERENCES experience_comments(id) ON DELETE CASCADE,

  -- Engagement
  upvotes INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_experience_comments_experience ON experience_comments(interview_experience_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_experience_comments_user ON experience_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_experience_comments_parent ON experience_comments(parent_comment_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 8. EMAIL VERIFICATION TABLE
-- ============================================================================
-- Temporary storage for email verification codes (deleted after verification)
-- Follows Blind model: verify but don't store email long-term

CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL, -- 6-digit code
  interview_experience_id INTEGER REFERENCES interview_experiences(id) ON DELETE CASCADE,

  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- 15 minutes from creation
  verified_at TIMESTAMP NULL
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email) WHERE verified = FALSE;
CREATE INDEX idx_email_verifications_expires ON email_verifications(expires_at) WHERE verified = FALSE;

-- ============================================================================
-- 9. MODERATION FLAGS TABLE (PHASE 2)
-- ============================================================================
-- Community flagging system for spam/inappropriate content

CREATE TABLE IF NOT EXISTS experience_flags (
  id SERIAL PRIMARY KEY,
  interview_experience_id INTEGER NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  flagged_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  flag_reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'fake', 'nda_violation', 'duplicate'
  flag_description TEXT,

  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,

  -- One flag per user per experience per reason
  UNIQUE(interview_experience_id, flagged_by_user_id, flag_reason)
);

CREATE INDEX idx_experience_flags_experience ON experience_flags(interview_experience_id);
CREATE INDEX idx_experience_flags_status ON experience_flags(status, created_at DESC);

-- ============================================================================
-- 10. TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Trigger: Update citation_count when learning_map_citation is added
CREATE OR REPLACE FUNCTION update_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE interview_experiences
    SET citation_count = citation_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.interview_experience_id;

    -- Update impact score
    UPDATE interview_experiences
    SET impact_score = (citation_count * 10) + (upvotes * 2) + (views / 10)
    WHERE id = NEW.interview_experience_id;

    -- Award reputation points to experience author
    INSERT INTO reputation_events (user_id, event_type, points_delta, interview_experience_id, learning_map_id)
    SELECT ie.user_id, 'experience_cited', 5, NEW.interview_experience_id, NEW.learning_map_id
    FROM interview_experiences ie
    WHERE ie.id = NEW.interview_experience_id;

    -- Update user reputation
    UPDATE user_reputation ur
    SET total_points = total_points + 5,
        points_this_month = points_this_month + 5,
        points_all_time = points_all_time + 5,
        total_citations_received = total_citations_received + 1,
        total_people_helped = total_people_helped + 1,
        updated_at = CURRENT_TIMESTAMP
    FROM interview_experiences ie
    WHERE ur.user_id = ie.user_id AND ie.id = NEW.interview_experience_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE interview_experiences
    SET citation_count = GREATEST(citation_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.interview_experience_id;

    -- Update impact score
    UPDATE interview_experiences
    SET impact_score = (citation_count * 10) + (upvotes * 2) + (views / 10)
    WHERE id = OLD.interview_experience_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_citation_count
AFTER INSERT OR DELETE ON learning_map_citations
FOR EACH ROW
EXECUTE FUNCTION update_citation_count();

-- Trigger: Update upvotes/downvotes when vote is added/changed
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE interview_experiences
      SET upvotes = upvotes + 1,
          helpfulness_ratio = (upvotes + 1.0) / NULLIF(upvotes + downvotes + 1, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.interview_experience_id;

      -- Award reputation points
      INSERT INTO reputation_events (user_id, event_type, points_delta, interview_experience_id)
      SELECT ie.user_id, 'upvote_received', 1, NEW.interview_experience_id
      FROM interview_experiences ie
      WHERE ie.id = NEW.interview_experience_id;

      UPDATE user_reputation ur
      SET total_points = total_points + 1,
          points_this_month = points_this_month + 1,
          points_all_time = points_all_time + 1,
          total_upvotes_received = total_upvotes_received + 1,
          updated_at = CURRENT_TIMESTAMP
      FROM interview_experiences ie
      WHERE ur.user_id = ie.user_id AND ie.id = NEW.interview_experience_id;

    ELSIF NEW.vote_type = 'downvote' THEN
      UPDATE interview_experiences
      SET downvotes = downvotes + 1,
          helpfulness_ratio = upvotes / NULLIF(upvotes + downvotes + 1.0, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.interview_experience_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Vote type changed (upvote -> downvote or vice versa)
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE interview_experiences
      SET upvotes = GREATEST(upvotes - 1, 0),
          downvotes = downvotes + 1,
          helpfulness_ratio = GREATEST(upvotes - 1, 0) / NULLIF(upvotes + downvotes, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.interview_experience_id;

    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE interview_experiences
      SET upvotes = upvotes + 1,
          downvotes = GREATEST(downvotes - 1, 0),
          helpfulness_ratio = (upvotes + 1.0) / NULLIF(upvotes + downvotes, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.interview_experience_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE interview_experiences
      SET upvotes = GREATEST(upvotes - 1, 0),
          helpfulness_ratio = GREATEST(upvotes - 1, 0) / NULLIF(upvotes + downvotes - 1, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.interview_experience_id;
    ELSIF OLD.vote_type = 'downvote' THEN
      UPDATE interview_experiences
      SET downvotes = GREATEST(downvotes - 1, 0),
          helpfulness_ratio = upvotes / NULLIF(upvotes + downvotes - 1.0, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.interview_experience_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON experience_votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_counts();

-- Trigger: Update user tier when reputation points change
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier VARCHAR(50);
BEGIN
  -- Calculate tier based on total_points
  IF NEW.total_points >= 10000 THEN
    new_tier := 'Legend';
  ELSIF NEW.total_points >= 2500 THEN
    new_tier := 'Expert';
  ELSIF NEW.total_points >= 500 THEN
    new_tier := 'Veteran';
  ELSIF NEW.total_points >= 100 THEN
    new_tier := 'Regular';
  ELSE
    new_tier := 'New Contributor';
  END IF;

  -- Update tier if changed
  IF NEW.tier != new_tier THEN
    NEW.tier := new_tier;
    NEW.tier_updated_at := CURRENT_TIMESTAMP;

    -- Award tier badge
    NEW.badges := NEW.badges || jsonb_build_object(
      'type', 'tier',
      'name', new_tier,
      'earned_at', CURRENT_TIMESTAMP
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_tier
BEFORE UPDATE ON user_reputation
FOR EACH ROW
WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
EXECUTE FUNCTION update_user_tier();

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================

-- View: Top Contributors (Leaderboard)
CREATE OR REPLACE VIEW v_top_contributors AS
SELECT
  ur.user_id,
  u.email,
  ur.total_points,
  ur.tier,
  ur.total_experiences_posted,
  ur.total_citations_received,
  ur.total_people_helped,
  ur.badges,
  RANK() OVER (ORDER BY ur.total_points DESC) as rank
FROM user_reputation ur
JOIN users u ON ur.user_id = u.id
ORDER BY ur.total_points DESC;

-- View: Trending Experiences (Most cited in last 30 days)
CREATE OR REPLACE VIEW v_trending_experiences AS
SELECT
  ie.*,
  COUNT(lmc.id) as recent_citations,
  u.email as author_email
FROM interview_experiences ie
LEFT JOIN learning_map_citations lmc ON ie.id = lmc.interview_experience_id
  AND lmc.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
LEFT JOIN users u ON ie.user_id = u.id
WHERE ie.deleted_at IS NULL
GROUP BY ie.id, u.email
HAVING COUNT(lmc.id) > 0
ORDER BY recent_citations DESC, ie.impact_score DESC;

-- ============================================================================
-- 12. SEED DATA (OPTIONAL - FOR TESTING)
-- ============================================================================

-- Initialize reputation for existing users
INSERT INTO user_reputation (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE interview_experiences IS 'User-submitted interview experiences with citation tracking';
COMMENT ON TABLE learning_map_citations IS 'Tracks which learning maps reference which interview experiences (academic-style citations)';
COMMENT ON TABLE user_reputation IS 'User reputation points, tiers, and badges';
COMMENT ON TABLE reputation_events IS 'Audit log of all reputation point changes';
COMMENT ON TABLE experience_votes IS 'Upvotes and downvotes on interview experiences';
COMMENT ON TABLE email_verifications IS 'Temporary email verification codes (Blind model)';
