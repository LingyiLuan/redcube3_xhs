# Learning Map Redesign - Master Implementation Plan

**Version:** 4.0 - DATABASE-FIRST ARCHITECTURE
**Date:** 2025-01-23
**Status:** Ready for Implementation

---

## CRITICAL ARCHITECTURAL CHANGE

### The Problem We Discovered
- **OLD APPROACH**: Extract data on-the-fly during learning map generation using LLM
- **ISSUE**: Functions expecting database fields (`areas_struggled`, `key_skills_tested`) that don't exist
- **RESULT**: Silent failures, empty data, unreliable generation, high LLM costs

### The Solution: Database-First Architecture
- **NEW APPROACH**: Extract and store metadata at the **child table level** (`scraped_posts`)
- **BENEFIT**: Learning map generation becomes **aggregation + LLM enrichment**
- **RESULT**: Fast, reliable, consistent, reusable data, lower costs

---

## Core Principles

### 1. Data Architecture
- **Single Source of Truth**: All metadata extracted and stored in `scraped_posts` table
- **Extract Once, Use Many**: One-time LLM extraction per post, reused across all features
- **Evidence-Based**: Every learning map insight traces to specific database records
- **NO MOCK DATA**: If data doesn't exist in database, show error - never fabricate

### 2. Design Philosophy
- **Professional McKinsey Style**: Clean, corporate, data-driven aesthetic
- **NO Emojis**: Professional communication only
- **Color Palette**: White → Light Gray (#F9FAFB) → Baby Blue (#DBEAFE) → Light Blue (#93C5FD) → Blue (#1E3A5F)

### 3. User Experience
- **Actionable**: Every recommendation backed by database records
- **Trackable**: Progress stored and retrievable
- **Transparent**: Show what data recommendations are based on
- **Fast**: <5 seconds for learning map generation (no on-the-fly LLM calls)

---

## Architecture Overview

### Data Flow (NEW - Database-First)

```
POST INGESTION (One-time per post)
├─ Scrape Reddit post
├─ Run comprehensive LLM extraction (ALL fields in one call)
├─ Store in scraped_posts table with 30+ metadata fields
└─ Mark as extracted (llm_extracted_at timestamp)

LEARNING MAP GENERATION (Fast - Query + Aggregate)
├─ User selects Batch Analysis Report (batch_1_abc123)
├─ Query scraped_posts for foundation posts (seed + RAG)
├─ Aggregate data from database fields:
│   ├─ Interview questions (interview_questions JSONB)
│   ├─ Struggle patterns (areas_struggled JSONB)
│   ├─ Failed skills (skills_tested JSONB)
│   ├─ Success factors (success_factors JSONB)
│   ├─ Resources used (resources_used JSONB)
│   └─ Timeline data (prep_time_days, interview_rounds, etc.)
├─ LLM enrichment (ONLY for synthesis, NOT extraction):
│   ├─ Generate personalized narrative
│   ├─ Synthesize patterns into insights
│   └─ Create week-by-week plan structure
└─ Return complete learning map (<5 seconds)
```

---

## Database Schema: Migration 27

### New Fields for `scraped_posts` Table

#### Category A: Already Exist (Migration 22) ✅
```sql
-- Basic LLM fields
llm_company VARCHAR(100)
llm_role VARCHAR(100)
llm_outcome VARCHAR(50) CHECK (llm_outcome IN ('passed', 'failed', 'pending', 'unknown'))
llm_experience_level VARCHAR(50)
llm_interview_stages JSONB DEFAULT '[]'::jsonb
difficulty_level VARCHAR(20)
sentiment_category VARCHAR(20)
timeline TEXT

-- Structured data
interview_topics JSONB DEFAULT '[]'::jsonb
interview_questions JSONB DEFAULT '[]'::jsonb
leetcode_problems JSONB DEFAULT '[]'::jsonb
preparation_materials JSONB DEFAULT '[]'::jsonb
key_insights JSONB DEFAULT '[]'::jsonb
```

#### Category B: MISSING - Critical for Knowledge Gaps ❌ (ADD IN MIGRATION 27)
```sql
-- Struggle/Failure Analysis Fields
ALTER TABLE scraped_posts
ADD COLUMN IF NOT EXISTS areas_struggled JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS failed_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mistakes_made JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills_tested JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weak_areas TEXT[] DEFAULT '{}',

-- Success Factors Fields
ADD COLUMN IF NOT EXISTS success_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS helpful_resources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preparation_time_days INTEGER,
ADD COLUMN IF NOT EXISTS practice_problem_count INTEGER,

-- Interview Experience Details
ADD COLUMN IF NOT EXISTS interview_rounds INTEGER,
ADD COLUMN IF NOT EXISTS interview_duration_hours DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS interviewer_feedback TEXT[],
ADD COLUMN IF NOT EXISTS rejection_reasons TEXT[],
ADD COLUMN IF NOT EXISTS offer_details JSONB DEFAULT '{}'::jsonb,

-- Temporal/Contextual Data
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS job_market_conditions VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),

-- Resource Effectiveness Tracking
ADD COLUMN IF NOT EXISTS resources_used JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS study_approach VARCHAR(100),
ADD COLUMN IF NOT EXISTS mock_interviews_count INTEGER,
ADD COLUMN IF NOT EXISTS study_schedule TEXT,

-- Outcome Correlation
ADD COLUMN IF NOT EXISTS prep_to_interview_gap_days INTEGER,
ADD COLUMN IF NOT EXISTS previous_interview_count INTEGER,
ADD COLUMN IF NOT EXISTS improvement_areas TEXT[];

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_posts_areas_struggled ON scraped_posts USING GIN (areas_struggled);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_skills_tested ON scraped_posts USING GIN (skills_tested);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_success_factors ON scraped_posts USING GIN (success_factors);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_resources_used ON scraped_posts USING GIN (resources_used);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_prep_time ON scraped_posts(preparation_time_days);
CREATE INDEX IF NOT EXISTS idx_scraped_posts_interview_date ON scraped_posts(interview_date);

-- Comments
COMMENT ON COLUMN scraped_posts.areas_struggled IS 'LLM-extracted array of specific areas where candidate struggled (e.g., ["System Design", "Dynamic Programming"])';
COMMENT ON COLUMN scraped_posts.failed_questions IS 'LLM-extracted array of questions that candidate failed with reasons';
COMMENT ON COLUMN scraped_posts.mistakes_made IS 'LLM-extracted array of mistakes and their impact on outcome';
COMMENT ON COLUMN scraped_posts.skills_tested IS 'LLM-extracted array of technical skills tested with pass/fail status';
COMMENT ON COLUMN scraped_posts.success_factors IS 'LLM-extracted factors that contributed to success (e.g., "practiced 200 LC problems")';
COMMENT ON COLUMN scraped_posts.resources_used IS 'LLM-extracted detailed breakdown of all preparation materials used';
COMMENT ON COLUMN scraped_posts.preparation_time_days IS 'LLM-extracted: Number of days spent preparing for interview';
COMMENT ON COLUMN scraped_posts.practice_problem_count IS 'LLM-extracted: Number of practice problems solved';
```

### Field Schemas (JSONB Structure)

#### areas_struggled
```json
[
  {
    "area": "System Design",
    "severity": "high",
    "details": "Struggled with scalability and distributed systems",
    "interview_stage": "onsite round 3"
  }
]
```

#### skills_tested
```json
[
  {
    "skill": "Binary Search Tree Traversal",
    "category": "Data Structures",
    "passed": false,
    "difficulty": "medium",
    "notes": "Couldn't implement iterative inorder traversal"
  }
]
```

#### success_factors
```json
[
  {
    "factor": "Practiced 200 LeetCode problems",
    "impact": "high",
    "category": "preparation"
  },
  {
    "factor": "Did 5 mock interviews",
    "impact": "medium",
    "category": "practice"
  }
]
```

#### resources_used
```json
[
  {
    "resource": "LeetCode Premium",
    "type": "platform",
    "duration_weeks": 8,
    "effectiveness": "high",
    "cost": "$35/month"
  },
  {
    "resource": "Cracking the Coding Interview",
    "type": "book",
    "chapters_completed": 12,
    "effectiveness": "high"
  }
]
```

#### failed_questions
```json
[
  {
    "question": "Design Twitter feed",
    "type": "System Design",
    "difficulty": "hard",
    "reason_failed": "Didn't consider caching strategy",
    "interview_stage": "phone screen"
  }
]
```

---

## LLM Extraction Strategy

### Phase 1: Comprehensive Post Extraction Service

**File**: `services/content-service/src/services/comprehensivePostExtractionService.js`

**Purpose**: Extract ALL 30+ metadata fields in ONE LLM call per post

**Approach**:
```javascript
async function extractComprehensiveMetadata(post) {
  const prompt = `
You are analyzing a technical interview experience post from Reddit.
Extract ALL relevant metadata from this post in ONE comprehensive pass.

POST CONTENT:
Title: ${post.title}
Body: ${post.body_text}

Extract the following fields in JSON format:

{
  // Basic fields
  "company": "Google",
  "role": "Software Engineer",
  "outcome": "passed",
  "experience_level": "mid",
  "difficulty_level": "hard",

  // Struggle/failure analysis (CRITICAL for knowledge gaps)
  "areas_struggled": [
    {"area": "System Design", "severity": "high", "details": "..."}
  ],
  "skills_tested": [
    {"skill": "Binary Search", "passed": true, "difficulty": "medium"}
  ],
  "failed_questions": [...],
  "mistakes_made": [...],

  // Success factors (CRITICAL for recommendations)
  "success_factors": [
    {"factor": "Practiced 200 LC problems", "impact": "high"}
  ],
  "resources_used": [
    {"resource": "LeetCode Premium", "effectiveness": "high"}
  ],

  // Timeline data (CRITICAL for realistic timelines)
  "preparation_time_days": 60,
  "practice_problem_count": 200,
  "interview_rounds": 5,
  "interview_date": "2024-01-15",

  // Structured data
  "interview_questions": [...],
  "leetcode_problems": [...],
  "interview_stages": [...],

  // Contextual
  "location": "San Francisco",
  "study_approach": "self-study",
  "mock_interviews_count": 3
}

Guidelines:
- If a field cannot be determined from the post, use null or empty array
- Be specific (e.g., "Graph BFS/DFS" not just "graphs")
- Extract actual numbers when mentioned
- Preserve exact question text when possible
`;

  const response = await analyzeWithOpenRouter(prompt, {
    max_tokens: 3000,
    temperature: 0.1  // Low temperature for extraction accuracy
  });

  return extractJsonFromString(response);
}
```

### Phase 2: Batch Extraction (Backfill Existing Posts)

**File**: `services/content-service/src/scripts/backfillComprehensiveMetadata.js`

```javascript
async function backfillAllPosts() {
  // Get posts without comprehensive extraction
  const posts = await pool.query(`
    SELECT post_id, title, body_text
    FROM scraped_posts
    WHERE areas_struggled IS NULL  -- Not yet extracted
    ORDER BY created_at DESC
    LIMIT 100  -- Process in batches
  `);

  for (const post of posts.rows) {
    try {
      const metadata = await extractComprehensiveMetadata(post);

      await pool.query(`
        UPDATE scraped_posts
        SET
          areas_struggled = $1,
          skills_tested = $2,
          failed_questions = $3,
          success_factors = $4,
          resources_used = $5,
          preparation_time_days = $6,
          practice_problem_count = $7,
          interview_rounds = $8,
          interview_date = $9,
          -- ... all other fields
          llm_extracted_at = NOW()
        WHERE post_id = $10
      `, [
        JSON.stringify(metadata.areas_struggled),
        JSON.stringify(metadata.skills_tested),
        // ... map all fields
        post.post_id
      ]);

      logger.info(`✅ Extracted metadata for post ${post.post_id}`);

    } catch (error) {
      logger.error(`❌ Failed to extract post ${post.post_id}:`, error);
    }

    // Rate limiting
    await sleep(1000);  // 1 request per second
  }
}
```

---

## Learning Map Generation (Database-First)

### Updated Service Flow

**File**: `services/content-service/src/services/learningMapGeneratorService.js`

```javascript
async function generateLearningMapFromReport(reportId, userGoals = {}) {
  // 1. Get foundation posts (seed + RAG)
  const sourcePosts = await getFoundationPosts(reportId);

  // 2. Aggregate data from database (NO LLM extraction here!)
  const aggregatedData = {
    // Knowledge gaps from database fields
    strugglePatterns: await aggregateStrugglePatterns(sourcePosts),

    // Success factors from database fields
    successFactors: await aggregateSuccessFactors(sourcePosts),

    // Resources from database fields
    resources: await aggregateResources(sourcePosts),

    // Timeline data from database fields
    timelineStats: await aggregateTimelineData(sourcePosts),

    // Interview questions from database fields
    questions: await aggregateInterviewQuestions(sourcePosts)
  };

  // 3. LLM enrichment (synthesis only, NOT extraction)
  const enrichedData = await enrichWithLLM(aggregatedData, userGoals);

  // 4. Build learning map structure
  return {
    skills_roadmap: buildSkillsRoadmap(aggregatedData, enrichedData),
    knowledge_gaps: buildKnowledgeGaps(aggregatedData.strugglePatterns),
    curated_resources: buildCuratedResources(aggregatedData.resources),
    timeline: buildTimeline(aggregatedData.timelineStats, enrichedData),
    expected_outcomes: buildExpectedOutcomes(aggregatedData)
  };
}

// Example: Aggregate struggle patterns from database
async function aggregateStrugglePatterns(sourcePosts) {
  const postIds = sourcePosts.map(p => p.post_id);

  const result = await pool.query(`
    SELECT
      area,
      COUNT(*) as struggle_count,
      AVG(CASE WHEN severity = 'high' THEN 3
               WHEN severity = 'medium' THEN 2
               ELSE 1 END) as avg_severity,
      ARRAY_AGG(DISTINCT post_id) as source_post_ids
    FROM scraped_posts,
         JSONB_ARRAY_ELEMENTS(areas_struggled) AS area_obj,
         LATERAL (SELECT area_obj->>'area' as area,
                         area_obj->>'severity' as severity) AS areas
    WHERE post_id = ANY($1)
    GROUP BY area
    ORDER BY struggle_count DESC
    LIMIT 10
  `, [postIds]);

  return result.rows.map(row => ({
    area: row.area,
    count: row.struggle_count,
    severity: row.avg_severity,
    sourcePostIds: row.source_post_ids,
    evidence_quality: 'high'  // Direct from database
  }));
}
```

---

## Learning Map Sections (Enhanced)

### 1. Skills Roadmap (Database-Driven)
**Data Source**: `interview_questions`, `leetcode_problems`, `skills_tested` fields
**LLM Role**: Synthesize module descriptions only

### 2. Knowledge Gaps (Database-Driven)
**Data Source**: `areas_struggled`, `failed_questions`, `mistakes_made` fields
**LLM Role**: Generate remediation recommendations

### 3. Curated Resources (Database-Driven)
**Data Source**: `resources_used`, `helpful_resources` fields
**LLM Role**: None - pure database aggregation with effectiveness calculations

### 4. Timeline & Milestones (Database-Driven)
**Data Source**: `preparation_time_days`, `practice_problem_count`, `interview_rounds` fields
**LLM Role**: Generate week-by-week narrative structure

### 5. Common Pitfalls (NEW - Database-Driven)
**Data Source**: `mistakes_made`, `rejection_reasons` fields
**LLM Role**: Synthesize patterns into actionable warnings

### 6. Readiness Checklist (NEW - Database-Driven)
**Data Source**: `success_factors` from passed interviews
**LLM Role**: Format into checklist structure

### 7. Company-Specific Insights (Database-Driven)
**Data Source**: Filter by `llm_company`, aggregate `interview_stages`, `interview_questions`
**LLM Role**: Generate company culture insights

### 8. Expected Outcomes (Database-Driven)
**Data Source**: Statistical aggregation of `llm_outcome`, `preparation_time_days`, `offer_details`
**LLM Role**: None - pure statistics

---

## Implementation Phases

### Phase 1: Database Migration (Priority: CRITICAL)
**Timeline**: Day 1
**Effort**: 2 hours

**Tasks**:
1. Create Migration 27 SQL file with 30+ new fields
2. Run migration on local database
3. Verify schema with test queries
4. Create indexes for performance

**Deliverable**: `27-comprehensive-post-metadata.sql` applied successfully

---

### Phase 2: Update Auto-Extraction Services (Priority: CRITICAL)
**Timeline**: Day 1-2
**Effort**: 4 hours

**IMPORTANT**: We have EXISTING extraction services that need to be updated:

**A. Auto-Extraction for NEW Posts** (`aiService.analyzeText()`):
- Currently extracts ~20 fields for new posts where `is_relevant = true`
- Called automatically by `agentService` when new posts are scraped
- **UPDATE NEEDED**: Add NEW 22 fields from Migration 27 to the extraction prompt

**B. Backfill for EXISTING Posts** (`comprehensiveLLMBackfillService.js`):
- Processes existing posts where `is_relevant = true AND llm_extracted_at IS NULL`
- **UPDATE NEEDED**: Save the NEW 22 fields to database

**Tasks**:
1. ✅ Update `aiService.analyzeText()` LLM prompt to extract NEW fields:
   - areas_struggled, failed_questions, mistakes_made, skills_tested
   - success_factors, preparation_time_days, practice_problem_count
   - interview_rounds, interview_duration_hours, interviewer_feedback
   - rejection_reasons, offer_details, interview_date
   - resources_used, study_approach, mock_interviews_count
   - prep_to_interview_gap_days, improvement_areas

2. ✅ Update `comprehensiveLLMBackfillService.js` to SAVE new fields:
   - Update the SQL INSERT/UPDATE query (line ~200)
   - Map extracted fields to database columns
   - Add JSONB sanitization for new array fields

3. Test extraction on 5 sample posts manually
4. Verify data saves correctly to database

**Deliverable**: Both auto-extraction and backfill work with ALL fields

---

### Phase 3: Backfill Existing Posts (Priority: HIGH)
**Timeline**: Day 2-3
**Effort**: 6 hours (mostly waiting for LLM calls)

**Tasks**:
1. Create backfill script `backfillComprehensiveMetadata.js`
2. Process posts in batches of 100
3. Rate limiting: 1 request/second (avoid API limits)
4. Track progress with `llm_extracted_at` timestamp
5. Monitor and fix errors

**Deliverable**: All existing posts have comprehensive metadata

---

### Phase 4: Update Learning Map Generator (Priority: CRITICAL)
**Timeline**: Day 3-4
**Effort**: 6 hours

**Tasks**:
1. Rewrite `analyzeStrugglePatterns()` to query database (DONE ✅)
2. Rewrite `aggregateSuccessFactors()` to query database
3. Rewrite `aggregateResources()` to query database
4. Rewrite `aggregateTimelineData()` to query database
5. Update `buildKnowledgeGaps()` to use database results
6. Remove old LLM extraction code
7. Test with batch_1_6bdfb0c041c4c4a5

**Deliverable**: Learning map generation uses database fields, not on-the-fly LLM

---

### Phase 5: Add New Sections (Priority: HIGH)
**Timeline**: Day 5-6
**Effort**: 8 hours

**Tasks**:
1. Implement "Common Pitfalls" section
   - Query `mistakes_made`, `rejection_reasons`
   - Aggregate patterns
   - Display in frontend

2. Implement "Readiness Checklist" section
   - Query `success_factors` from passed interviews
   - Generate checklist with checkboxes
   - Track user progress

3. Enhance "Company-Specific Insights"
   - Show interview process breakdown
   - Display typical question types
   - Add hiring bar expectations

**Deliverable**: 3 new sections visible in learning map

---

### Phase 6: Frontend Updates (Priority: MEDIUM)
**Timeline**: Day 6-7
**Effort**: 6 hours

**Tasks**:
1. Update LearningMapViewer.vue
   - Fix `map.expected_outcomes` field (was `map.outcomes`)
   - Add Knowledge Gaps section UI
   - Add Common Pitfalls section UI
   - Add Readiness Checklist section UI

2. Add loading states
   - Show "Generating learning map..." message
   - Progress indicator

3. Add empty states
   - "Insufficient data" warnings
   - Suggestions for improvement

**Deliverable**: All sections display correctly in frontend

---

### Phase 7: Testing & Validation (Priority: HIGH)
**Timeline**: Day 7-8
**Effort**: 4 hours

**Tasks**:
1. Test learning map generation with 3 different reports
2. Verify all data traces to database records
3. Check performance (<5 seconds generation time)
4. Validate JSONB field structures
5. Test with insufficient data scenarios
6. Verify no mock data or hardcoded values

**Deliverable**: All tests pass, no regressions

---

## Success Metrics

### Data Quality ✅
- 100% of learning map data from database fields
- Zero on-the-fly LLM extraction calls
- All statistics trace to specific post IDs
- No mock or fabricated data

### Performance ✅
- Learning map generation: <5 seconds (was 30-60 seconds)
- Database queries optimized with indexes
- JSONB aggregation efficient

### User Experience ✅
- All 8 sections populated with real data
- Knowledge gaps section actually works
- Resources show effectiveness ratings
- Timeline based on real prep times

### Code Quality ✅
- Clear separation: extraction vs aggregation
- Reusable metadata for other features
- Well-documented JSONB schemas
- Error handling for edge cases

---

## Risk Mitigation

### Risk 1: LLM Extraction Accuracy
**Issue**: LLM might extract incorrect data
**Mitigation**:
- Use low temperature (0.1) for extraction
- Validate JSON schema before saving
- Manual review of first 50 extractions
- Add correction mechanism if needed

### Risk 2: Incomplete Post Data
**Issue**: Some posts lack sufficient detail for extraction
**Mitigation**:
- Mark posts with insufficient data
- Aggregate only from high-quality posts
- Show data coverage warnings in UI

### Risk 3: Backfill Takes Too Long
**Issue**: 1000s of posts to backfill
**Mitigation**:
- Process in batches of 100
- Run as background job
- Prioritize recent posts first
- Continue generating maps with partial data

### Risk 4: Database Schema Changes Break Queries
**Issue**: Adding fields might break existing code
**Mitigation**:
- Use `IF NOT EXISTS` in migration
- Default values for all new fields
- Test migration on copy of production DB first
- Version control for rollback

---

## Cost Analysis

### OLD APPROACH (On-the-fly LLM Extraction)
- Every learning map generation: 10-15 LLM calls
- Cost per map: ~$0.30
- 100 maps/day: **$30/day**
- Unreliable, slow, inconsistent

### NEW APPROACH (Database-First)
- One-time extraction per post: 1 LLM call
- 1000 posts: $50 (one-time)
- Learning map generation: 1-2 LLM calls (synthesis only)
- Cost per map: ~$0.05
- 100 maps/day: **$5/day**
- Reliable, fast, consistent

**Savings**: 83% reduction in daily costs

---

## Next Steps

### Immediate Actions (Today)
1. ✅ Approve this plan
2. ✅ Create Migration 27 SQL file
3. ✅ Run migration on local database
4. ⏳ Create comprehensive extraction service
5. ⏳ Test extraction on 5 sample posts

### This Week
- Complete Phases 1-4 (Database + Extraction + Learning Map Update)
- Backfill existing posts
- Test with real reports

### Next Week
- Add new sections (Pitfalls, Readiness, Insights)
- Update frontend
- Full testing and validation

**Total Timeline**: 7-8 days for complete implementation

---

**End of Updated Master Plan - v4.0**
