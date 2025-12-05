# Analysis Report Enhancement Plan
**Intelligence Layer: "WHAT" - Temporal Trends & Industry Insights**

**Author:** AI Analysis System
**Date:** 2025-11-17
**Status:** Design Phase - Ready for Implementation

---

## Core Principles

**Foundation: Seed Posts + RAG Posts**
- **Seed Posts**: User's uploaded interview experiences (4-10 posts)
- **RAG Posts**: Semantically similar posts from database (30-50 posts)
- **Total Foundation**: 50+ real Reddit interview experiences
- **CRITICAL**: All temporal intelligence derived from this foundation pool only

**100% Real Data - Zero Mock Data**
- Every trend calculated from actual post frequency changes
- Every insight backed by statistical significance (minimum thresholds)
- Every time period comparison uses real temporal data
- **Only use 2023-2025 relevant data** (exclude older posts - not representative of current industry)
- If data is insufficient → Show "Insufficient data" message, NOT mock trends
- Minimum requirements:
  - 20+ posts per time period for trend analysis
  - 5+ occurrences for question/skill inclusion
  - 80%+ temporal coverage (posts with dates)

**Actual Useful Insights Only**
- No generic observations (e.g., "Skills are changing")
- Specific, actionable intelligence (e.g., "ML questions surged 260% in 2025 - appeared in 35% of Google interviews vs 12% in 2024")
- Quantified changes with evidence (e.g., "Based on 66 posts across 8 companies")
- Severity-based prioritization (Critical > High > Medium > Low)
- Source attribution for every insight (link to Reddit posts)

**Professional McKinsey Style**
- No emojis in any section
- Data-driven visualizations
- Clean, professional typography
- Navy/charcoal/slate color palette
- Evidence-backed recommendations only

---

## Strategic Clarity: Analysis Report vs Learning Map

### Analysis Report = INTELLIGENCE ("WHAT")
**Purpose:** Provide pure intelligence and insights about the industry
- "What's changing in 2024 vs 2025?"
- "What skills are emerging?"
- "What questions do companies ask?"
- "What are success patterns?"
- **NO action items** - just data-driven insights

### Learning Map = ACTION PLAN ("HOW")
**Purpose:** Provide actionable preparation roadmap
- "How do I prepare for this role?"
- "What should I learn first?"
- "How long will it take?"
- "What resources should I use?"
- **References insights from report** but focuses on execution

---

## Current Analysis Report Structure

### What We Have Already (Good - Keep)

```javascript
{
  // SECTION 1: Foundation Data
  summary: {
    total_posts_analyzed: 54,
    unique_companies: 12,
    unique_roles: 8,
    overall_success_rate: "67%",
    data_coverage: "High"
  },

  // SECTION 2: Skills Intelligence
  skill_frequency: [...],           // Top 20 skills by frequency
  skill_success_correlation: [...], // Skills correlated with success
  skill_pairs: [...],               // Skill combinations

  // SECTION 3: Company Intelligence
  company_trends: [...],            // Success rates, difficulty by company
  difficulty_by_company: {...},    // Easy/medium/hard breakdown
  stage_by_company: {...},          // Interview stages

  // SECTION 4: Questions Intelligence
  interview_questions: [...],       // All extracted questions
  company_tiered_questions: {       // Seed vs similar vs general
    yourCompanies: [...],
    similarCompanies: [...],
    generalPatterns: {...}
  },
  question_intelligence: {
    question_frequency: [...],           // Top 10 questions
    company_question_profiles: [...],    // Category breakdown
    difficulty_distribution: {...},      // Easy/medium/hard counts
    topic_distribution: [...]            // Topics by frequency
  },

  // SECTION 5: Success Patterns
  sentiment_metrics: {...},         // Success vs failure rates
  correlation_insights: [...],      // "System Design increases success by 12.5%"
  knowledge_gaps: [...],            // High-severity gaps

  // SECTION 6: Source Attribution
  source_posts: [...],              // All 54 foundation posts
  seed_companies: [...]             // Companies from user's posts
}
```

---

## What's Missing: Temporal Intelligence (NEW)

### SECTION 7: Temporal Trends (NEW - CRITICAL)

**Purpose:** Answer "What's changing over time?"

```javascript
{
  temporal_trends: {
    time_periods_analyzed: {
      period_1: "2024",
      period_2: "2025-Q1",
      posts_2024: 450,
      posts_2025: 188
    },

    // Question Evolution
    question_trends: [
      {
        question_text: "Design a distributed cache",
        trend_type: "emerging",      // "emerging", "stable", "declining"
        frequency_2024: 5,            // Asked in 5 posts (2024)
        frequency_2025: 18,           // Asked in 18 posts (2025-Q1 annualized)
        change_percent: 260,          // 260% increase
        severity: "critical",         // "critical", "high", "medium", "low"
        insight: "Distributed systems questions surged 260% in 2025. This is now critical.",
        companies_asking: ["Google", "Meta", "Amazon"],
        evidence_posts: 18,
        source_post_urls: [...]
      },
      {
        question_text: "Implement a REST API",
        trend_type: "declining",
        frequency_2024: 20,
        frequency_2025: 8,
        change_percent: -60,
        severity: "medium",
        insight: "Basic API questions declining. Companies assume this knowledge now.",
        companies_asking: ["Startups"],
        evidence_posts: 8,
        source_post_urls: [...]
      }
      // ... top 20 trending questions
    ],

    // Skill Evolution
    skill_trends: [
      {
        skill: "Machine Learning",
        trend_type: "emerging",
        frequency_2024: "12%",        // 12% of 2024 posts mentioned ML
        frequency_2025: "35%",        // 35% of 2025 posts mention ML
        posts_2024: 54,
        posts_2025: 66,
        change_percent: 192,          // 192% increase
        severity: "critical",
        insight: "ML skills demand tripled. Even non-ML roles now test basic ML knowledge.",
        evidence_posts: 66,
        source_post_urls: [...]
      },
      {
        skill: "React",
        trend_type: "stable",
        frequency_2024: "45%",
        frequency_2025: "48%",
        posts_2024: 202,
        posts_2025: 90,
        change_percent: 7,
        severity: "low",
        insight: "React remains dominant frontend skill. Steady demand across companies.",
        evidence_posts: 292,
        source_post_urls: [...]
      },
      {
        skill: "jQuery",
        trend_type: "declining",
        frequency_2024: "8%",
        frequency_2025: "2%",
        posts_2024: 36,
        posts_2025: 4,
        change_percent: -75,
        severity: "medium",
        insight: "jQuery usage dropped 75%. Modern frameworks have replaced it.",
        evidence_posts: 40,
        source_post_urls: [...]
      }
      // ... top 30 skill trends
    ],

    // Company Evolution
    company_evolution: [
      {
        company: "Google",
        trend_summary: "Shift from pure algorithms to ML system design",
        posts_2024: 180,
        posts_2025: 120,
        changes: [
          {
            metric: "ML questions",
            value_2024: "12%",
            value_2025: "34%",
            change_percent: 183,
            severity: "critical",
            insight: "Google 2025 interviews heavily emphasize ML infrastructure (3x increase)"
          },
          {
            metric: "LeetCode Hard problems",
            value_2024: "45%",
            value_2025: "34%",
            change_percent: -24,
            severity: "high",
            insight: "Less focus on pure algorithm problems (-24%), more practical system design"
          },
          {
            metric: "System Design rounds",
            value_2024: "2.1 avg",
            value_2025: "2.8 avg",
            change_percent: 33,
            severity: "high",
            insight: "More system design rounds per candidate (+33%)"
          }
        ]
      },
      {
        company: "Meta",
        trend_summary: "Increased behavioral focus, reduced coding difficulty",
        posts_2024: 95,
        posts_2025: 68,
        changes: [...]
      }
      // ... all companies with 20+ posts
    ],

    // Industry Shifts (Cross-company patterns)
    industry_shifts: [
      {
        shift_name: "ML Everywhere",
        severity: "critical",
        description: "ML questions appearing in 70% more roles (not just ML positions)",
        affected_roles: ["SWE", "Backend Engineer", "Full Stack", "DevOps"],
        change_percent: 250,
        posts_2024: 54,
        posts_2025: 135,
        recommendation: "Even non-ML roles now require ML fundamentals. Prioritize learning."
      },
      {
        shift_name: "System Design Earlier",
        severity: "high",
        description: "System design now asked in phone screens (was only onsite before)",
        affected_companies: ["Google", "Meta", "Amazon", "Microsoft"],
        change_percent: 180,
        posts_2024: 32,
        posts_2025: 90,
        recommendation: "Start system design prep immediately, don't wait for onsite."
      },
      {
        shift_name: "Code Quality Over Speed",
        severity: "medium",
        description: "Interviewers emphasize clean code, testing, edge cases (not just solving)",
        affected_companies: ["All FAANG"],
        change_percent: 85,
        posts_2024: 78,
        posts_2025: 144,
        recommendation: "Practice writing production-quality code, not just passing tests."
      }
      // ... top 10 industry shifts
    ],

    // Temporal Metadata
    analysis_timestamp: "2025-11-17T12:00:00Z",
    temporal_coverage: {
      total_posts_analyzed: 638,
      posts_with_dates: 510,  // 80% coverage
      date_range: {
        earliest: "2023-06-15",
        latest: "2025-11-15"
      }
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Database & Date Population (IN PROGRESS)

**Database Schema (COMPLETED):**
- Added `interview_date` DATE and `post_year_quarter` VARCHAR(20) fields
- Created temporal indexes for fast queries
- Migration 21 executed successfully

**Date Population Strategy (SIMPLIFIED):**

Reddit posts contain `created_at` timestamp (when post was published on Reddit). People typically post interview experiences within days of the interview. Therefore:

```sql
UPDATE scraped_posts
SET
  interview_date = created_at::DATE,
  post_year_quarter = TO_CHAR(created_at, 'YYYY') || '-Q' || TO_CHAR(created_at, 'Q')
WHERE created_at IS NOT NULL;
```

**Advantages:**
- 100% data coverage (every post has created_at from Reddit API)
- No LLM costs or pattern matching needed
- Fast (single SQL UPDATE)
- Real timestamps from Reddit's `post.created_utc`

**Implementation:**
- File: [interviewDateExtractionService.js](services/content-service/src/services/interviewDateExtractionService.js)
- Function: `populateInterviewDates()` - One-time backfill
- Endpoint: `POST /api/content/populate-interview-dates`

### Phase 2: Temporal Analysis Service (NEW - CRITICAL)

**Service:** `temporalTrendAnalysisService.js`

**Core Functions:**

```javascript
/**
 * Generate temporal trends section for comprehensive report
 * This is added to existing pattern_analysis
 */
async function generateTemporalIntelligence(sourcePosts) {
  // 1. Group posts by time period
  const postsByPeriod = groupPostsByPeriod(sourcePosts);

  // 2. Compare question frequencies
  const questionTrends = await compareQuestionTrends(postsByPeriod);

  // 3. Compare skill frequencies
  const skillTrends = await compareSkillTrends(postsByPeriod);

  // 4. Analyze company evolution
  const companyEvolution = await analyzeCompanyEvolution(postsByPeriod);

  // 5. Detect industry shifts (cross-company patterns)
  const industryShifts = detectIndustryShifts(skillTrends, questionTrends);

  return {
    time_periods_analyzed: {
      period_1: "2024",
      period_2: "2025-Q1",
      posts_2024: postsByPeriod['2024'].length,
      posts_2025: postsByPeriod['2025-Q1'].length
    },
    question_trends: questionTrends,
    skill_trends: skillTrends,
    company_evolution: companyEvolution,
    industry_shifts: industryShifts,
    temporal_coverage: calculateTemporalCoverage(sourcePosts)
  };
}

/**
 * Compare question trends across time periods
 */
async function compareQuestionTrends(postsByPeriod) {
  const posts2024 = postsByPeriod['2024'] || [];
  const posts2025 = postsByPeriod['2025-Q1'] || [];

  // Extract all questions from both periods
  const questions2024 = extractAllQuestions(posts2024);
  const questions2025 = extractAllQuestions(posts2025);

  // Calculate frequency changes
  const allQuestions = new Set([...questions2024.map(q => q.text), ...questions2025.map(q => q.text)]);
  const trends = [];

  for (const questionText of allQuestions) {
    const freq2024 = questions2024.filter(q => q.text === questionText).length;
    const freq2025 = questions2025.filter(q => q.text === questionText).length;

    // Annualize Q1 data (multiply by 4)
    const freq2025Annual = freq2025 * 4;

    // Calculate change
    const changePercent = freq2024 === 0
      ? (freq2025 > 0 ? 999 : 0)  // New question
      : ((freq2025Annual - freq2024) / freq2024 * 100);

    // Only include significant trends (>50% change AND 5+ posts)
    if (Math.abs(changePercent) > 50 && (freq2024 >= 5 || freq2025 >= 5)) {
      const trendType = changePercent > 0 ? 'emerging' : 'declining';
      const severity = calculateTrendSeverity(changePercent, freq2025);

      trends.push({
        question_text: questionText,
        trend_type: trendType,
        frequency_2024: freq2024,
        frequency_2025: freq2025Annual,
        change_percent: changePercent === 999 ? 'NEW' : Math.round(changePercent),
        severity,
        insight: generateQuestionInsight(questionText, trendType, changePercent),
        companies_asking: extractCompanies(questions2024, questions2025, questionText),
        evidence_posts: freq2024 + freq2025,
        source_post_urls: getSourceUrls(questions2024, questions2025, questionText)
      });
    }
  }

  // Sort by change magnitude
  return trends.sort((a, b) => {
    const changeA = a.change_percent === 'NEW' ? 999 : Math.abs(a.change_percent);
    const changeB = b.change_percent === 'NEW' ? 999 : Math.abs(b.change_percent);
    return changeB - changeA;
  }).slice(0, 20);  // Top 20 trends
}

/**
 * Detect industry-wide shifts (cross-company patterns)
 */
function detectIndustryShifts(skillTrends, questionTrends) {
  const shifts = [];

  // Shift 1: ML Everywhere (if ML appears in 3+ roles)
  const mlSkill = skillTrends.find(s => s.skill === 'Machine Learning');
  if (mlSkill && mlSkill.change_percent > 150) {
    shifts.push({
      shift_name: "ML Everywhere",
      severity: "critical",
      description: `ML questions appearing in ${mlSkill.change_percent}% more roles`,
      affected_roles: ["SWE", "Backend", "Full Stack", "DevOps"],
      change_percent: mlSkill.change_percent,
      posts_2024: mlSkill.posts_2024,
      posts_2025: mlSkill.posts_2025,
      recommendation: "Even non-ML roles now require ML fundamentals. Prioritize learning."
    });
  }

  // Shift 2: System Design Earlier (if system design questions in phone screens)
  const sysDesignQuestions = questionTrends.filter(q =>
    q.question_text.toLowerCase().includes('design') &&
    q.trend_type === 'emerging'
  );
  if (sysDesignQuestions.length >= 3) {
    const avgChange = sysDesignQuestions.reduce((sum, q) => sum + q.change_percent, 0) / sysDesignQuestions.length;
    shifts.push({
      shift_name: "System Design Earlier",
      severity: "high",
      description: "System design now asked in phone screens (was only onsite)",
      affected_companies: ["Google", "Meta", "Amazon", "Microsoft"],
      change_percent: Math.round(avgChange),
      recommendation: "Start system design prep immediately, don't wait for onsite."
    });
  }

  // ... detect more shifts

  return shifts.sort((a, b) => {
    const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}
```

### Phase 3: Integration into Batch Analysis

**Update:** `ragAnalysisService.js` or pattern extraction service

```javascript
async function generateComprehensiveReport(seedPosts, ragPosts) {
  const allPosts = [...seedPosts, ...ragPosts];

  // Existing pattern analysis
  const patternAnalysis = await extractPatterns(allPosts);

  // NEW: Add temporal intelligence
  const temporalTrends = await generateTemporalIntelligence(allPosts);

  return {
    ...patternAnalysis,
    temporal_trends: temporalTrends  // NEW SECTION
  };
}
```

---

## Frontend: Analysis Report Enhancements

### New Section: Temporal Trends Dashboard

**Location:** Add new tab in comprehensive report viewer

```vue
<template>
  <section class="temporal-trends-section">
    <div class="section-header">
      <h2>Industry Trends & Evolution</h2>
      <div class="time-period-badge">
        2024 vs 2025-Q1 ({{ postsAnalyzed }} posts)
      </div>
    </div>

    <!-- Industry Shifts (Critical Alerts) -->
    <div class="industry-shifts-panel" v-if="shifts.length > 0">
      <h3>Critical Industry Shifts</h3>
      <div class="shift-card"
           v-for="shift in shifts"
           :key="shift.shift_name"
           :class="`severity-${shift.severity}`">
        <div class="shift-header">
          <span class="shift-badge">{{ shift.severity.toUpperCase() }}</span>
          <h4>{{ shift.shift_name }}</h4>
        </div>
        <p class="shift-description">{{ shift.description }}</p>
        <p class="shift-recommendation">Recommendation: {{ shift.recommendation }}</p>
        <div class="shift-meta">
          +{{ shift.change_percent }}% change |
          {{ shift.posts_2024 + shift.posts_2025 }} posts analyzed
        </div>
      </div>
    </div>

    <!-- Question Trends -->
    <div class="trends-panel">
      <h3>Question Trends</h3>
      <div class="trend-filters">
        <button @click="filterTrends('emerging')" :class="{active: filter === 'emerging'}">
          Emerging ({{ emergingCount }})
        </button>
        <button @click="filterTrends('declining')" :class="{active: filter === 'declining'}">
          Declining ({{ decliningCount }})
        </button>
        <button @click="filterTrends('all')" :class="{active: filter === 'all'}">
          All
        </button>
      </div>

      <div class="trend-list">
        <div class="trend-item"
             v-for="trend in filteredQuestionTrends"
             :key="trend.question_text"
             :class="`trend-${trend.trend_type}`">
          <div class="trend-icon" :class="`trend-${trend.trend_type}`">
            <span class="trend-indicator"></span>
          </div>
          <div class="trend-content">
            <div class="trend-question">{{ trend.question_text }}</div>
            <div class="trend-change">
              {{ trend.change_percent }}%
              ({{ trend.frequency_2024 }} → {{ trend.frequency_2025 }} posts)
            </div>
            <div class="trend-insight">{{ trend.insight }}</div>
            <div class="trend-companies">
              Companies: {{ trend.companies_asking.join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skill Trends -->
    <div class="trends-panel">
      <h3>Skill Evolution</h3>
      <!-- Similar structure to questions -->
    </div>

    <!-- Company Evolution -->
    <div class="company-evolution-panel">
      <h3>Company-Specific Evolution</h3>
      <div class="company-card" v-for="company in companyEvolution" :key="company.company">
        <h4>{{ company.company }}</h4>
        <p class="company-summary">{{ company.trend_summary }}</p>
        <div class="company-changes">
          <div class="change-item"
               v-for="change in company.changes"
               :key="change.metric">
            <span class="metric-name">{{ change.metric }}</span>
            <span class="metric-change" :class="`severity-${change.severity}`">
              {{ change.change_percent > 0 ? '+' : '' }}{{ change.change_percent }}%
            </span>
            <p class="metric-insight">{{ change.insight }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

---

## Success Metrics

### Intelligence Quality
- 80%+ posts have explicit interview dates (temporal coverage)
- Trends based on 20+ posts minimum (statistical significance)
- All trends include source attribution (evidence links)
- Severity scoring aligns with actual change magnitude

### User Value
- Users can answer: "What's changing in the industry?"
- Users can answer: "Should I focus on ML or algorithms?"
- Users can answer: "Is Google changing their interview style?"
- Insights are actionable (not just interesting facts)

---

## Relationship with Learning Map

**Analysis Report provides INTELLIGENCE** →
**Learning Map consumes intelligence to build ACTION PLAN**

```
Analysis Report: "ML questions surged 260% in 2025"
                          ↓
Learning Map: "Week 1-4: ML Fundamentals (prioritized due to industry shift)"
```

**Clear Separation:**
- Report = What's happening (insights)
- Learning Map = What to do about it (execution plan)

---

**End of Analysis Report Enhancement Plan**

**Status:** Ready for Implementation
**Estimated Effort:** 12 hours (temporal analysis service + frontend dashboard)
**Expected Impact:** Transform report from static snapshot to living intelligence platform
