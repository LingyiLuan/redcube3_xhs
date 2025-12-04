# Learning Map Architecture Documentation

> Complete technical documentation for the Learning Map generation system.
> Last updated: December 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Generation Flow](#generation-flow)
3. [Sections Reference](#sections-reference)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Key Files](#key-files)

---

## Overview

The Learning Map is a personalized interview preparation plan generated from real Reddit interview experiences. It uses a **Database + LLM Hybrid** approach:

- **Database-first**: Aggregates real data (questions, resources, timelines, pitfalls)
- **LLM Enhancement**: Synthesizes narratives and generates actionable guidance
- **Evidence-based**: Every recommendation is backed by actual interview posts

### Core Principles

1. **NO GENERIC ADVICE** - Everything backed by actual data
2. **Source Traceability** - Every section links to source posts
3. **Success Rate Tracking** - Resources ranked by candidate outcomes
4. **Real Questions** - Uses actual interview questions from `interview_questions` table

---

## Generation Flow

### SSE Streaming Architecture

```
Client                          Server
  |--- POST /learning-map/stream --|
  |<-- event: connected -----------|
  |<-- event: progress (5%) -------|  Phase 1: Load cached report
  |<-- event: progress (15%) ------|  Phase 2: Generate structure
  |<-- event: progress (58%) ------|  Phase 2.5: Daily schedules
  |<-- event: progress (65%) ------|  Phase 3: Enhancements
  |<-- event: progress (85%) ------|  Phase 4: Save to DB
  |<-- event: complete ------------|  Final response
```

### Generation Phases

| Phase | Percent | Description | Service |
|-------|---------|-------------|---------|
| 1 | 5-10% | Load cached batch analysis | `analysisController.getCachedBatchData()` |
| 2 | 15-55% | Generate base learning map | `generateOptimizedLearningMap()` |
| 2.5 | 58-60% | Hour-by-hour schedules | `timelineMilestoneEnhancementService` |
| 3 | 65-80% | Company tracks, enhancements | `learningMapEnhancementsService` |
| 4 | 85-95% | Save to database | `learningMapsQueries.saveLearningMap()` |
| 5 | 100% | Send complete event | SSE response |

---

## Sections Reference

### 1. Timeline (Weekly Plan)

**File**: `timelineMilestoneEnhancementService.js`
**Data Source**: `scraped_posts.prep_duration_weeks` + LLM
**LLM Used**: Yes (single call for all weeks)

```javascript
{
  total_weeks: 12,
  weeks: [{
    week: 1,
    title: "Foundations: Arrays & Strings",
    daily_tasks: ["Monday: ...", ...],
    skills_covered: ["Arrays", "Strings"],
    detailed_daily_schedules: { /* hour-by-hour */ }
  }]
}
```

### 2. Detailed Daily Schedules (Hour-by-Hour)

**File**: `timelineMilestoneEnhancementService.js` -> `enhanceWeeksWithDetailedSchedules()`
**Data Source**: `interview_questions` table (NOT curated_problems)
**LLM Used**: Optional (for tips, cached in `daily_schedule_llm_cache`)

```javascript
{
  monday: {
    total_hours: 6,
    slots: [{
      time: "9:00 AM",
      duration_minutes: 90,
      activity: "Theory & Concept Review",
      focus: "Arrays",
      type: "theory"
    }, {
      time: "10:30 AM",
      activity: "Problem Practice",
      problems: [{ name: "Two Sum", difficulty: "Easy" }],
      type: "practice"
    }]
  }
}
```

**Schedule Templates**: compact (3-4h), standard (5-6h), full (7-8h)

### 3. Company-Specific Question Tracks

**File**: `learningMapEnhancementsService.js` -> `buildCompanySpecificTrack()`
**Data Source**: 100% Database
**LLM Used**: No

```sql
SELECT iq.question_text, iq.difficulty, COUNT(*) as frequency
FROM interview_questions iq
WHERE iq.company ILIKE '%Google%'
ORDER BY frequency DESC
```

```javascript
{
  company: "Google",
  total_questions: 45,
  success_rate: 68.5,
  categories: [{
    name: "System Design",
    questions: [{ text: "Design URL shortener", difficulty: "Hard" }]
  }]
}
```

### 4. Knowledge Gaps

**File**: `knowledgeGapsResourcesService.js` -> `extractKnowledgeGaps()`
**Data Source**: Database-first (Migration 27 fields: `areas_struggled`, `skills_tested`)
**LLM Used**: Yes (for synthesis)

```javascript
{
  gaps: [{
    skill: "Dynamic Programming",
    severity: "high",
    mentioned_in_posts: 23,
    remediation_week: 5
  }],
  evidence_quality: { confidence: "high" }
}
```

### 5. Common Pitfalls

**File**: `knowledgeGapsResourcesService.js` -> `aggregateCommonPitfalls()`
**Data Source**: Database aggregation
**LLM Used**: Yes (for narrative synthesis)

**Raw** (DB): `{ pitfalls: [{ pitfall: "Time management", count: 34 }] }`

**Synthesized** (LLM):
```javascript
{
  pitfalls_narrative: {
    summary: "Most candidates struggle with...",
    top_pitfalls: [{
      title: "Time Management Under Pressure",
      severity: "critical",
      how_to_avoid: ["Practice timed sessions", ...]
    }]
  }
}
```

### 6. Resource Recommendations

**File**: `learningMapEnhancementsService.js` -> `curateResources()`
**Data Source**: `scraped_posts.resources_used` (JSONB)
**LLM Used**: Yes (for usage guidance)

```javascript
{
  books: [{
    name: "Cracking the Coding Interview",
    mention_count: 89,
    success_rate: 73.4,
    evidence: "Mentioned by 89 candidates, 73.4% success rate"
  }],
  courses: [...],
  platforms: [...]
}
```

### 7. Milestones

**File**: `learningMapEnhancementsService.js` -> `enrichMilestonesFromTimeline()`
**Data Source**: Assembled from timeline + patterns
**LLM Used**: No

```javascript
{
  milestones: [{
    week: 4,
    title: "Foundation Complete",
    skills: ["Arrays", "Strings", "Hash Tables"],
    tasks: ["Complete 50 easy problems"],
    resources: [{ title: "NeetCode 150", url: "..." }],
    sourcePostIds: ["post_1", "post_2"]
  }]
}
```

### 8. Success Factors

**File**: `knowledgeGapsResourcesService.js` -> `aggregateSuccessFactors()`
**Data Source**: 100% Database (posts with successful outcomes)
**LLM Used**: No

---

## Summary: Data Source by Section

| Section | Data Source | LLM? |
|---------|-------------|------|
| Timeline weeks | `scraped_posts` + LLM | Yes |
| Hour-by-hour schedules | `interview_questions` | Optional (cached) |
| Company tracks | `interview_questions` | No |
| Knowledge gaps | DB `areas_struggled` | Yes (synthesis) |
| Common pitfalls | DB aggregation | Yes (narrative) |
| Resources | DB `resources_used` | Yes (guidance) |
| Milestones | Timeline + patterns | No |
| Success factors | DB (successful posts) | No |

---

## Database Schema

### `learning_maps_history` Table

```sql
CREATE TABLE learning_maps_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Basic
  title VARCHAR(500),
  timeline_weeks INTEGER,

  -- Core Sections (JSONB)
  milestones JSONB,
  company_tracks JSONB,
  timeline JSONB,  -- Contains detailed_daily_schedules

  -- Database-First (Migration 28)
  knowledge_gaps JSONB,
  common_pitfalls JSONB,
  success_factors JSONB,
  curated_resources JSONB,

  -- Synthesized Narratives (Migration 29)
  pitfalls_narrative JSONB,
  improvement_areas JSONB,
  resource_recommendations JSONB,

  -- Metadata
  source_report_id VARCHAR(100),
  foundation_posts INTEGER
);
```

---

## API Endpoints

### Generate Learning Map (SSE)
```
POST /api/content/learning-map/stream
Body: { reportId, userId, userGoals }
Response: SSE stream with progress events
```

### Get User's Maps
```
GET /api/content/learning-maps/user/:userId
```

### Get Single Map
```
GET /api/content/learning-maps/:mapId
```

---

## Key Files

| File | Purpose |
|------|---------|
| `learningMapStreamController.js` | SSE streaming, orchestration |
| `timelineMilestoneEnhancementService.js` | Timeline, daily schedules |
| `learningMapEnhancementsService.js` | Company tracks, resources, milestones |
| `knowledgeGapsResourcesService.js` | Knowledge gaps, pitfalls |
| `learningMapsQueries.js` | Database operations |
| `stores/learningMapStore.ts` | Frontend state management |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Insufficient foundation data" | < 20 posts | Generate batch with more posts |
| Empty `detailed_daily_schedules` | Export missing | Check `module.exports` |
| Stream ends without complete | Cloudflare timeout | Check SSE headers |
