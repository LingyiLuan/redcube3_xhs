# Railway PostgreSQL Database Credentials & Structure

> Production database configuration for LabZero/RedCube
> Last updated: December 2024

---

## Connection Details

```
Host: gondola.proxy.rlwy.net
Port: 25309
User: postgres
Password: zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i
```

---

## Databases Overview

Railway hosts **4 PostgreSQL databases** on the same server:

| Database | Service | Tables | Purpose |
|----------|---------|--------|---------|
| `redcube_content` | content-service | 34 | Main content, analysis, learning maps |
| `redcube_users` | user-service | 12 | User accounts, auth, preferences |
| `redcube_interviews` | interview-service | 3 | Interview tracking |
| `railway` | shared/legacy | 4 | Curated problems, curriculum |

---

## Database Connection URLs

### 1. redcube_content (MAIN - Content Service)

```
postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/redcube_content
```

**Key Tables (34 total)**:

| Table | Rows | Description |
|-------|------|-------------|
| `interview_questions` | 3,583 | Real questions extracted from Reddit |
| `scraped_posts` | ~10K+ | Reddit interview experiences |
| `batch_analysis_cache` | varies | Cached pattern analysis |
| `analysis_results` | varies | Individual post analyses |
| `learning_maps_history` | varies | Generated learning maps |
| `learning_map_resources` | varies | Resources linked to maps |
| `curated_problems` | 75 | NeetCode 150 problem bank |
| `assistant_conversations` | varies | AI assistant chat history |
| `assistant_messages` | varies | Chat messages |
| `user_workflows` | varies | Saved workflows |
| `user_goals` | varies | User career goals |
| `user_briefings` | varies | Daily briefings |
| `daily_schedule_llm_cache` | varies | Cached LLM responses |

### 2. redcube_users (User Service)

```
postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/redcube_users
```

**Tables (12 total)**:
- `users` - User accounts
- `user_sessions` - Active sessions
- `user_profiles` - Extended profile data
- `user_preferences` - App settings
- `subscriptions` - Subscription status
- `email_verification_tokens` - Email verification
- `password_reset_attempts` - Password reset tracking
- `usage_tracking` - Feature usage analytics

### 3. redcube_interviews (Interview Service)

```
postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/redcube_interviews
```

**Tables (3 total)**:
- `interviews` - Interview records
- `interview_questions` - Questions per interview
- `interview_feedback` - User feedback

### 4. railway (Legacy/Shared)

```
postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/railway
```

**Tables (4 total)**:
- `curated_problems` (75 rows) - NeetCode problem list
- `curriculum_templates` - Predefined study plans
- `daily_schedule_llm_cache` - LLM response cache
- `topic_taxonomy` - Skill/topic hierarchy

---

## Key Table Schemas

### interview_questions (redcube_content)

```sql
CREATE TABLE interview_questions (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(50) REFERENCES scraped_posts(post_id),
  question_text TEXT,
  question_type VARCHAR(50),  -- coding, system_design, behavioral
  difficulty VARCHAR(20),      -- Easy, Medium, Hard
  category VARCHAR(100),
  llm_category VARCHAR(100),   -- LLM-assigned category
  llm_difficulty VARCHAR(20),
  company VARCHAR(100),
  interview_stage VARCHAR(50), -- phone, onsite, final
  role_type VARCHAR(50),
  level VARCHAR(20),
  embedding VECTOR(384),       -- pgvector embedding
  extraction_confidence FLOAT,
  extracted_from VARCHAR(20),  -- title, body, comments
  hints_given TEXT[],
  common_mistakes TEXT[],
  optimal_approach TEXT,
  follow_up_questions TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Stats**: 3,583 real questions from 755 unique posts

### curated_problems (redcube_content)

```sql
CREATE TABLE curated_problems (
  id SERIAL PRIMARY KEY,
  problem_name VARCHAR(200),
  leetcode_number INTEGER,
  leetcode_slug VARCHAR(200),
  difficulty VARCHAR(20),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  topics TEXT[],
  url VARCHAR(500),
  problem_list VARCHAR(50),    -- neetcode_150, blind_75
  company_frequency JSONB,     -- {"Google": 15, "Meta": 12}
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Stats**: 75 curated LeetCode problems (NeetCode 150)

### learning_maps_history (redcube_content)

```sql
CREATE TABLE learning_maps_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Basic Info
  title VARCHAR(500),
  summary TEXT,
  difficulty VARCHAR(50),
  timeline_weeks INTEGER,

  -- Core Sections (JSONB)
  milestones JSONB,
  company_tracks JSONB,
  analytics JSONB,
  timeline JSONB,              -- Contains detailed_daily_schedules

  -- LLM-Generated (Migration 26)
  skills_roadmap JSONB,
  knowledge_gaps JSONB,
  curated_resources JSONB,
  expected_outcomes JSONB,

  -- Database-First (Migration 28)
  common_pitfalls JSONB,
  readiness_checklist JSONB,
  success_factors JSONB,
  database_resources JSONB,
  timeline_statistics JSONB,

  -- Synthesized Narratives (Migration 29)
  pitfalls_narrative JSONB,
  improvement_areas JSONB,
  resource_recommendations JSONB,
  preparation_expectations JSONB,

  -- Metadata
  source_report_id VARCHAR(100),
  foundation_posts INTEGER,
  data_coverage VARCHAR(20),
  user_goals JSONB,
  status VARCHAR(20) DEFAULT 'active'
);
```

### scraped_posts (redcube_content)

Key Migration 27 fields for database-first extraction:

```sql
-- Migration 27 fields (JSONB)
resources_used JSONB,         -- [{name, url, type, rating}]
areas_struggled JSONB,        -- [{area, severity, details}]
skills_tested JSONB,          -- [{skill, category, passed}]
mistakes_made JSONB,          -- [{mistake, impact, lesson}]
prep_duration_weeks INTEGER,
study_hours_per_week INTEGER,
llm_outcome VARCHAR(50),      -- passed, failed, pending
llm_company VARCHAR(100),
llm_interview_stages JSONB,
difficulty_level INTEGER,
```

---

## Quick Connect Commands

### psql Direct Connection

```bash
# Connect to redcube_content
psql "postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/redcube_content"

# Connect to redcube_users
psql "postgres://postgres:zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i@gondola.proxy.rlwy.net:25309/redcube_users"
```

### Node.js Connection

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'gondola.proxy.rlwy.net',
  port: 25309,
  database: 'redcube_content',
  user: 'postgres',
  password: 'zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i'
});
```

### Environment Variables (Railway Services)

```bash
# Content Service
DB_HOST=gondola.proxy.rlwy.net
DB_PORT=25309
DB_NAME=redcube_content
DB_USER=postgres
DB_PASSWORD=zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i

# User Service
DB_NAME=redcube_users
```

---

## Common Queries

### Check interview_questions stats

```sql
SELECT
  COUNT(*) as total_questions,
  COUNT(DISTINCT post_id) as unique_posts,
  COUNT(DISTINCT company) as unique_companies
FROM interview_questions;
-- Result: 3,583 questions, 755 posts, ~50 companies
```

### Get questions for a batch

```sql
SELECT iq.question_text, iq.difficulty, iq.company
FROM interview_questions iq
WHERE iq.post_id = ANY(
  SELECT jsonb_array_elements_text(pattern_analysis->'source_posts'->>'post_id')
  FROM batch_analysis_cache
  WHERE batch_id = 'batch_1_abc123'
)
LIMIT 50;
```

### Check learning map by ID

```sql
SELECT id, title, timeline_weeks,
       jsonb_array_length(milestones) as milestone_count,
       timeline->'weeks' IS NOT NULL as has_weeks
FROM learning_maps_history
WHERE id = 102;
```

---

## Service Environment Variables

### content-service (Railway)

```
DB_HOST=gondola.proxy.rlwy.net
DB_PORT=25309
DB_NAME=redcube_content
DB_USER=postgres
DB_PASSWORD=zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i
OPENROUTER_API_KEY=<redacted>
```

### user-service (Railway)

```
DB_HOST=gondola.proxy.rlwy.net
DB_PORT=25309
DB_NAME=redcube_users
DB_USER=postgres
DB_PASSWORD=zy.KpBE-zQ.YMgpAGsZWJ.IhZB7MKf1i
SESSION_SECRET=<redacted>
GOOGLE_CLIENT_ID=<redacted>
```

---

## Security Notes

1. **DO NOT commit this file to public repos** - contains production credentials
2. Add to `.gitignore` if needed
3. Consider rotating password periodically
4. Railway provides connection via private network for inter-service communication

---

## Related Files

- `.railway-db-credentials` - Original credentials file (root)
- `railway-content-service.env` - Content service env template
- `railway-user-service.env` - User service env template
- `services/content-service/src/config/database.js` - DB connection config
