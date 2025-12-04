# Enhanced Single Analysis Report - Design Document

**Date**: November 8, 2025
**Context**: Redesigning the single post analysis report to provide actionable, comprehensive insights for interview preparation

---

## Current State Analysis

### What We Have Now:
The current single analysis report ([AnalysisDetails.vue](../vue-frontend/src/components/ResultsPanel/AnalysisDetails.vue)) shows:

**Basic Metadata** (8 fields):
- Company, Role
- Sentiment, Outcome
- Industry, Experience Level
- Difficulty, Timeline

**Interview Information**:
- Interview Topics (tags)
- Interview Stages (ordered list)
- Preparation Materials (bullet list)
- Key Insights (bullet list)
- Original Post text

**What's Missing**:
- ❌ No RAG-enhanced insights (we have 4,660 posts but don't use them for single analysis)
- ❌ No actual interview questions extracted
- ❌ No categorization of questions (behavioral vs technical vs system design)
- ❌ No comparison to similar interviews at the same company/role
- ❌ Can't see source posts that informed the analysis
- ❌ No clickable links to original Reddit posts
- ❌ No actionable preparation roadmap
- ❌ No success rate statistics for this company/role
- ❌ Insights are vague, not specific to the company/role

---

## User Scenario & Needs

### Primary Use Case:
**User selects a Google SWE post from recommendation list → Analyzes it → Wants actionable preparation guidance**

### What Users Want to Know:

#### 1. **Interview Questions - The Most Important**
Users preparing for interviews need **specific questions** that have been asked:

**Behavioral Questions:**
- "Tell me about a time you had conflict with a teammate"
- "Why Google?"
- "Describe a project you're proud of"
- "What would you do if you disagreed with your manager?"

**Technical Questions:**
- LeetCode-style problems: "Reverse a linked list", "Longest substring without repeating characters"
- Algorithm questions: "Design an LRU cache", "Find median in data stream"
- Language-specific: "Explain closures in JavaScript", "What is a generator in Python?"

**System Design Questions:**
- "Design Instagram feed ranking system"
- "Design a distributed cache"
- "Design URL shortener"
- "How would you scale WhatsApp to 1 billion users?"

**Domain-Specific:**
- "Explain CAP theorem"
- "How does garbage collection work?"
- "What's the difference between TCP and UDP?"

#### 2. **Interview Process Details**
- **Rounds**: How many rounds? (Phone screen → Technical → System design → Behavioral → Hiring committee)
- **Round-specific questions**: What's asked in each round?
- **Timeline**: How long between rounds? Total process duration?
- **Interviewers**: Titles (e.g., "2 senior engineers, 1 manager")

#### 3. **Comparative Analysis**
- **Success Rate**: Of 30 similar posts, how many passed? (e.g., "18/30 passed - 60% success rate")
- **Common Patterns**: "Candidates who mentioned X preparation method had 80% success rate"
- **Difficulty Comparison**: "Google L4 SWE is harder than Amazon L5" (based on data)
- **Trending Topics**: "Dynamic programming appeared in 70% of recent Google interviews"

#### 4. **Preparation Guidance** (vs Learning Map)
**Question**: Do we duplicate Learning Map functionality?

**Answer**: NO - Different purposes:
- **Learning Map**: Long-term skill building roadmap (3-6 months)
  - "Learn React → Master Hooks → Build projects → Study system design"
  - Focuses on acquiring fundamentals

- **Single Analysis Report**: Immediate interview prep (1-2 weeks)
  - "These 15 questions were asked at Google SWE"
  - "Practice these specific LeetCode problems"
  - "Review these behavioral frameworks (STAR method)"
  - Focuses on interview-specific preparation

**Keep Both** - They serve different needs!

#### 5. **Source Post Visibility**
- Show all analyzed posts used for insights (e.g., "30 similar Google SWE L4 posts analyzed")
- Make "Posts Analyzed: 30" clickable → Opens modal/panel showing:
  - List of all 30 posts
  - Each with title, snippet, date, upvotes
  - Clickable link to original Reddit post
  - Ability to deep-dive into any specific post

#### 6. **Actionable Insights**
Current insights are too vague:
- ❌ "Technical skills are important" (useless)
- ❌ "Practice coding problems" (obvious)

Better insights:
- ✅ "67% of successful candidates mentioned solving 200+ LeetCode problems"
- ✅ "System design questions focus heavily on scalability - review distributed systems"
- ✅ "Behavioral questions emphasize Googleyness - prepare examples of collaboration"
- ✅ "Most failures cited difficulty with LC Hard problems - prioritize these"

---

## Proposed Enhanced Report Structure

### 📊 Report Layout (Top to Bottom):

#### **Section 1: Overview Header** (Existing + Enhanced)
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Google        💼 SWE L4         📊 Mid-Level            │
│ ⏱️ 3-4 weeks     ⚡ Hard           🎯 60% Success Rate      │
│ 😊 Positive      📅 Feb 2025                               │
└─────────────────────────────────────────────────────────────┘
```
- Add: **Success Rate** (from similar posts analysis)
- Add: **Date** of original post

#### **Section 2: 🎯 Interview Questions** (NEW - MOST IMPORTANT)
This is what users desperately need!

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Interview Questions                                       │
│                                                              │
│ 📋 Behavioral Questions (8 questions)                        │
│   • "Tell me about a time you had a conflict with a         │
│      teammate" (Asked in 12/30 posts)                       │
│   • "Why Google?" (Asked in 28/30 posts)                    │
│   • "Describe your most challenging project"                │
│   ...                                                        │
│                                                              │
│ 💻 Technical/Coding Questions (15 questions)                 │
│   • "Reverse a linked list" (LC Easy - 8/30 posts)          │
│   • "LRU Cache implementation" (LC Medium - 15/30 posts)    │
│   • "Word Break II" (LC Hard - 5/30 posts)                  │
│   ...                                                        │
│                                                              │
│ 🏗️ System Design Questions (6 questions)                    │
│   • "Design Instagram feed ranking" (10/30 posts)           │
│   • "Design distributed cache" (7/30 posts)                 │
│   • "Design URL shortener" (5/30 posts)                     │
│   ...                                                        │
│                                                              │
│ 🧠 Domain Knowledge Questions (4 questions)                  │
│   • "Explain CAP theorem"                                   │
│   • "How does HTTP/2 differ from HTTP/1.1?"                 │
│   ...                                                        │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Categorized by question type
- Show frequency ("Asked in 12/30 posts")
- Difficulty tags for coding questions (LC Easy/Medium/Hard)
- Expandable sections (collapse/expand each category)
- Search/filter questions

#### **Section 3: 📈 Process & Rounds** (Enhanced)
```
┌──────────────────────────────────────────────────────────────┐
│ 📈 Interview Process                                         │
│                                                              │
│ Round 1: Phone Screen (45 min)                              │
│   • 2 LC Medium problems                                    │
│   • Focus: Array manipulation, hash maps                    │
│   • Typical questions: Two Sum, Valid Parentheses           │
│                                                              │
│ Round 2: Technical Interview 1 (60 min)                     │
│   • 1 LC Hard problem                                       │
│   • Focus: Dynamic programming, graphs                      │
│   • Typical questions: Word Break II, Course Schedule       │
│                                                              │
│ Round 3: System Design (60 min)                             │
│   • Design scalable system                                  │
│   • Focus: Distributed systems, caching, load balancing     │
│   • Typical questions: Design Instagram, Design cache       │
│                                                              │
│ Round 4: Behavioral (45 min)                                │
│   • Googleyness & Leadership                                │
│   • STAR format responses                                   │
│   • Culture fit assessment                                  │
│                                                              │
│ Timeline: 3-4 weeks total (1 week between each round)       │
└──────────────────────────────────────────────────────────────┘
```

#### **Section 4: 📚 Data-Driven Insights** (NEW - Analytics)
```
┌──────────────────────────────────────────────────────────────┐
│ 📚 Insights from 30 Similar Interviews                       │
│                                                    [View All]│
│                                                              │
│ ✅ Success Factors:                                          │
│   • 72% of successful candidates solved 200+ LeetCode       │
│   • 65% mentioned practicing system design with peers       │
│   • 58% emphasized "Googleyness" in behavioral answers      │
│                                                              │
│ ⚠️  Common Pitfalls:                                         │
│   • 45% of failures cited difficulty with LC Hard problems  │
│   • 38% struggled with system design scalability questions  │
│   • 30% didn't prepare enough behavioral examples           │
│                                                              │
│ 📊 Question Frequency:                                       │
│   [Bar chart showing most common question types]            │
│   Dynamic Programming: ████████████░ 80%                    │
│   System Design:       ██████████░░░ 67%                    │
│   Behavioral:          ████████████░ 85%                    │
│   Trees/Graphs:        ████████░░░░░ 55%                    │
│                                                              │
│ 🎯 Trending Topics (Last 3 months):                         │
│   • Distributed systems (↑ 25%)                             │
│   • Dynamic programming (→ stable)                          │
│   • Behavioral emphasis (↑ 15%)                             │
└──────────────────────────────────────────────────────────────┘
```

#### **Section 5: 🎯 Preparation Roadmap** (NEW - Actionable)
```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Recommended Preparation (2-3 weeks)                       │
│                                                              │
│ Week 1: Coding Foundations                                  │
│   □ Solve 50 LC Medium problems (focus: arrays, strings)   │
│   □ Practice 10 LC Hard problems (focus: DP, graphs)       │
│   □ Review time/space complexity analysis                  │
│   Recommended: Blind 75 + Google tagged problems            │
│                                                              │
│ Week 2: System Design                                       │
│   □ Study distributed systems fundamentals                 │
│   □ Practice 5 system design questions                     │
│   □ Review: Caching, Load balancing, CAP theorem           │
│   Resources: Grokking System Design, System Design Primer  │
│                                                              │
│ Week 3: Behavioral + Mock                                   │
│   □ Prepare 10 STAR format stories                        │
│   □ Practice "Googleyness" examples                       │
│   □ Do 2-3 full mock interviews                           │
│   □ Review common behavioral questions                     │
└──────────────────────────────────────────────────────────────┘
```

**Note**: This is simpler than Learning Map (focused on interview prep, not skill building)

#### **Section 6: 📄 Source Posts** (NEW - Transparency)
```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Analysis Based on 30 Similar Posts          [View All ▼] │
│                                                              │
│ [Collapsed by default, click to expand]                     │
│                                                              │
│ When expanded:                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Google SWE L4 - Passed after 4 rounds                 │ │
│ │ Posted 2 days ago • 45 upvotes • r/cscareerquestions  │ │
│ │ "Just got an offer from Google as L4 SWE. TC is..."   │ │
│ │ [🔗 View on Reddit]                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Google Phone Screen - What to expect?                 │ │
│ │ Posted 1 week ago • 32 upvotes • r/leetcode           │ │
│ │ "Had my Google phone screen yesterday. They asked..." │ │
│ │ [🔗 View on Reddit]                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│ ... (show all 30)                                           │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Collapsible section (starts collapsed)
- Each post shows: Title, date, upvotes, subreddit, snippet
- Clickable link to original Reddit URL
- Can filter by outcome (passed/failed), difficulty, date

#### **Section 7: 📝 Original Post** (Existing)
Keep as-is at the bottom.

---

## Technical Implementation Plan

### Phase 1: Backend - Enhanced RAG Analysis

#### Update Single Analysis Endpoint
**File**: `services/content-service/src/controllers/analysisController.js`

**Current**:
```javascript
POST /api/content/analyze
// Just analyzes the input text, no RAG
```

**Enhanced**:
```javascript
POST /api/content/analyze
{
  "text": "...",
  "useRAG": true,  // New parameter
  "ragLimit": 30   // How many similar posts to retrieve
}

// Response includes:
{
  // Original analysis fields
  "company": "Google",
  "role": "SWE L4",
  ...

  // NEW: RAG-enhanced fields
  "rag_analysis": {
    "similar_posts_count": 30,
    "interview_questions": {
      "behavioral": [
        { "question": "Why Google?", "frequency": 28, "posts": [...] },
        ...
      ],
      "technical": [
        { "question": "Reverse linked list", "frequency": 8, "difficulty": "Easy", "posts": [...] },
        ...
      ],
      "system_design": [...],
      "domain_knowledge": [...]
    },
    "process_insights": {
      "rounds": [
        {
          "name": "Phone Screen",
          "duration": "45 min",
          "typical_questions": [...],
          "focus_areas": ["arrays", "hash maps"]
        },
        ...
      ],
      "avg_timeline": "3-4 weeks"
    },
    "success_metrics": {
      "total_analyzed": 30,
      "passed": 18,
      "failed": 12,
      "success_rate": 0.60,
      "success_factors": [
        { "factor": "Solved 200+ LC problems", "percentage": 0.72 },
        ...
      ],
      "common_pitfalls": [
        { "pitfall": "Struggled with LC Hard", "percentage": 0.45 },
        ...
      ]
    },
    "trending_topics": {
      "hot": ["distributed systems", "dynamic programming"],
      "cold": ["linked lists"],
      "stats": [
        { "topic": "Dynamic Programming", "percentage": 0.80, "trend": "stable" },
        ...
      ]
    },
    "source_posts": [
      {
        "id": "abc123",
        "title": "Google SWE L4 - Passed!",
        "url": "https://reddit.com/r/cscareerquestions/...",
        "author": "throwaway123",
        "created_at": "2025-02-01",
        "upvotes": 45,
        "subreddit": "cscareerquestions",
        "snippet": "Just got an offer from Google...",
        "outcome": "passed"
      },
      ...
    ]
  }
}
```

#### New Service: RAG Single Analysis Service
**File**: `services/content-service/src/services/ragSingleAnalysisService.js` (NEW)

**Functions**:
1. `analyzeSinglePostWithRAG(text, options)`
   - Find similar posts using embeddings
   - Extract company/role from input
   - Filter similar posts by company/role
   - Extract questions from all posts
   - Compute statistics and insights

2. `extractInterviewQuestions(posts)`
   - Use LLM to extract questions from post text
   - Categorize: behavioral, technical, system design, domain
   - Track frequency across posts
   - Extract difficulty (for technical questions)

3. `analyzeInterviewProcess(posts)`
   - Extract round information
   - Aggregate typical questions per round
   - Calculate timeline statistics

4. `computeSuccessMetrics(posts)`
   - Success/failure rates
   - Identify success factors (text analysis)
   - Identify common pitfalls

5. `identifyTrendingTopics(posts)`
   - Topic frequency analysis
   - Time-series trend detection
   - Hot/cold topic classification

### Phase 2: Frontend - Enhanced Report Component

#### New Component: `EnhancedSingleAnalysisReport.vue`
**File**: `vue-frontend/src/components/ResultsPanel/EnhancedSingleAnalysisReport.vue` (NEW)

**Structure**:
```vue
<template>
  <div class="enhanced-single-analysis">
    <!-- Section 1: Overview Header -->
    <OverviewHeader :analysis="analysis" :ragAnalysis="ragAnalysis" />

    <!-- Section 2: Interview Questions (MOST IMPORTANT) -->
    <InterviewQuestionsSection :questions="ragAnalysis.interview_questions" />

    <!-- Section 3: Interview Process -->
    <InterviewProcessSection :process="ragAnalysis.process_insights" />

    <!-- Section 4: Data-Driven Insights -->
    <InsightsSection
      :success="ragAnalysis.success_metrics"
      :trending="ragAnalysis.trending_topics"
    />

    <!-- Section 5: Preparation Roadmap -->
    <PreparationRoadmap
      :company="analysis.company"
      :role="analysis.role"
      :insights="ragAnalysis"
    />

    <!-- Section 6: Source Posts -->
    <SourcePostsSection :posts="ragAnalysis.source_posts" />

    <!-- Section 7: Original Post -->
    <OriginalPostSection :text="analysis.original_text" />
  </div>
</template>
```

#### Sub-Components:

1. **InterviewQuestionsSection.vue** (NEW - CRITICAL)
   - Tabbed interface: Behavioral | Technical | System Design | Domain
   - Each question shows frequency
   - Technical questions show difficulty
   - Click question → Shows which posts mentioned it
   - Search/filter functionality

2. **InsightsSection.vue** (NEW)
   - Success metrics with charts
   - Bar charts for topic frequency
   - Success factors vs pitfalls comparison

3. **SourcePostsSection.vue** (NEW)
   - Collapsible section
   - List of all source posts
   - Filters: outcome, date, upvotes
   - Click post → Opens in modal or new tab

4. **PreparationRoadmap.vue** (NEW)
   - Week-by-week checklist
   - Dynamically generated based on insights
   - Progress tracking (checkbox state)
   - Resource links

### Phase 3: Question Extraction Logic

#### LLM Prompt for Question Extraction:
```javascript
const questionExtractionPrompt = `
You are an expert at extracting interview questions from interview experience posts.

Analyze this interview post and extract ALL interview questions that were asked.

Categorize each question as:
- "behavioral": Questions about past experiences, teamwork, conflict, leadership
- "technical": Coding problems, algorithms, data structures
- "system_design": Architecture, scalability, distributed systems design
- "domain_knowledge": Theoretical CS concepts, protocols, technologies

For technical questions, also identify difficulty: "easy", "medium", "hard"

Return JSON:
{
  "questions": [
    {
      "question": "Tell me about a time...",
      "category": "behavioral",
      "difficulty": null
    },
    {
      "question": "Implement an LRU cache",
      "category": "technical",
      "difficulty": "medium"
    },
    ...
  ]
}

Post:
${postText}
`;
```

---

## Success Metrics

### User Value:
- ✅ Users can see **actual questions** asked in interviews
- ✅ Users understand **what to prepare** (specific LeetCode problems)
- ✅ Users see **success patterns** (data-driven insights)
- ✅ Users can **access source material** (original Reddit posts)
- ✅ Users get **actionable roadmap** (not vague advice)

### Differentiation from Learning Map:
- **Learning Map**: Long-term skill building (3-6 months roadmap)
- **Single Analysis**: Immediate interview prep (specific questions, 1-2 weeks)

### Data Utilization:
- Current: Single analysis uses 0% of our 4,660 post database
- Enhanced: Uses RAG to leverage all similar posts
- Impact: Turn static analysis into dynamic, data-driven insights

---

## Next Steps

### Priority 1: Question Extraction (CRITICAL)
1. Create `extractInterviewQuestions()` service function
2. Test on sample posts to ensure accurate extraction
3. Build question database from existing 4,660 posts

### Priority 2: RAG Integration
1. Implement `ragSingleAnalysisService.js`
2. Update `/api/content/analyze` endpoint
3. Add embedding-based similarity search

### Priority 3: Frontend Components
1. Build `InterviewQuestionsSection.vue` (MOST IMPORTANT)
2. Build `SourcePostsSection.vue` (transparency)
3. Build `InsightsSection.vue` (data visualization)

### Priority 4: Testing & Iteration
1. Test with real user scenarios
2. Gather feedback on question quality
3. Iterate on insights generation

---

## Open Questions for Discussion

1. **Question Extraction Quality**: Should we use LLM or rule-based extraction?
   - LLM: More flexible, but costs $
   - Rule-based: Cheaper, but less accurate
   - **Recommendation**: LLM with caching (extract once, store in DB)

2. **Preparation Roadmap Generation**: Should it be:
   - Static template based on company/role?
   - Dynamically generated from insights?
   - **Recommendation**: Dynamic, based on common patterns in successful candidates

3. **Source Post Privacy**: Should we:
   - Show all 30 posts by default?
   - Require click to expand?
   - **Recommendation**: Collapsed by default (privacy + performance)

4. **Question Frequency Threshold**: Only show questions asked in:
   - ≥ 3 posts (more conservative)?
   - ≥ 2 posts?
   - All questions (even if mentioned once)?
   - **Recommendation**: Show all, but highlight high-frequency ones

---

**Status**: Design Complete - Ready for Implementation Discussion
**Next**: Review with stakeholder, prioritize features, start implementation
