# Interview Analysis Report Structure

**Generated:** 2025-11-15
**Version:** McKinsey Design System (Post-Refactor)

---

## Overview

The Interview Analysis Report is a comprehensive, multi-section analytical document generated from user-submitted interview experience posts and semantically similar posts from r/cscareerquestions. The report follows McKinsey consulting design principles with a professional blue/gray color palette.

---

## Report Architecture

### Data Foundation Principle
**All insights derive from Foundation Posts:**
- **Seed Posts:** 4 user-submitted interview experience posts
- **RAG Posts:** ~50 similar posts retrieved via pgvector semantic similarity (60%+ similarity threshold, last 2 years)
- **Total Foundation Posts:** ~54 posts used for ALL analysis

---

## Report Sections (Top to Bottom)

### 1. **Report Header**
**Component:** `ReportHeaderV1.vue`
**Location:** Top of report

**Purpose:** Executive summary banner showing high-level metrics at a glance

**Content:**
- **Report Title:** "Your Interview Intelligence Report"
- **Generation Timestamp:** Date/time when report was created
- **Key Metrics Row:**
  - Total posts analyzed (e.g., "54 posts")
  - Unique companies (e.g., "12 companies")
  - Distinct roles (e.g., "8 roles")
  - Overall success rate (e.g., "67%")
  - Data coverage badge (High/Medium/Low)

**Data Source:** `patterns.summary.*`

**Visual Design:**
- McKinsey navy background (#1E3A8A)
- White text
- Horizontal metrics grid
- Clean, executive-style layout

---

### 2. **Your Interview Experiences**
**Component:** `YourInterviewExperiencesV1.vue`
**Location:** After header

**Purpose:** Summarize the 4 seed posts (user's original submissions) that anchor the entire analysis

**Content:**
- **Summary Text:** "You submitted 4 interview experience posts covering [companies] for [roles]"
- **Individual Post Cards (4 cards):**
  - Company name (e.g., "Google")
  - Role (e.g., "Senior Software Engineer")
  - Outcome badge (Offer/Rejected/Unknown)
  - Interview stage reached
  - Key topics mentioned
  - Sentiment indicator
  - "View Details" button (future: links to detailed view)

**Data Source:** `individualAnalyses` (4 seed posts)

**Visual Design:**
- Grid layout (2x2 on desktop)
- Each card has company-specific styling
- Outcome badges color-coded (green/red/gray)
- Seed posts prominently highlighted

---

### 3. **Methodology**
**Component:** `MethodologyV1.vue`
**Location:** After seed posts summary

**Purpose:** Explain how the analysis was conducted (data transparency and source attribution)

**Content:**
- **Explanation Text:**
  - "Analysis begins with 4 interview experience posts you submitted"
  - "Using semantic similarity matching (pgvector embeddings), we identified 50 related posts from r/cscareerquestions"
- **Data Sources Stats Grid (5 stats):**
  - Your Posts: 4
  - Similar Posts (RAG): 50
  - Companies: 12
  - Distinct Roles: 8
  - Time Range: 2024 (or date range of posts)
- **"View All 54 Source Posts" Button:** Opens modal showing all foundation posts
- **Transparency Note:** "All insights derived from real Reddit posts. Click 'View Sources' buttons throughout to see original posts."

**Data Source:**
- `individualAnalyses.length` (seed count)
- `patterns.summary.total_posts_analyzed` (total)
- `patterns.source_posts` (RAG posts)

**Visual Design:**
- Off-white background (#F9FAFB)
- Navy border top/bottom
- 5-column stats grid (responsive: 3 cols tablet, 2 cols mobile)
- Professional, transparent feel

---

### 4. **Executive Summary**
**Component:** `ExecutiveSummaryV1.vue`
**Location:** After methodology

**Purpose:** High-level narrative overview of ALL findings (3-5 sentence summary)

**Content:**
- **Auto-generated summary text** combining:
  - Number of posts analyzed
  - Top companies identified
  - Success rate trends
  - Key skills discovered
  - Notable patterns

**Data Source:** `patterns.narrative_summary` (AI-generated text)

**Visual Design:**
- Large, readable text (16px)
- Navy accent border on left
- White background card
- Emphasizes key numbers with bold text

---

### 5. **Skill Landscape Analysis**
**Component:** `SkillLandscapeAnalysisV1.vue`

**Purpose:** Visualize the most frequently mentioned technical skills and their relationships

**Content:**
- **Force-Directed Network Graph:**
  - Each node = a skill (size = frequency)
  - Edges = skills that appear together
  - Color-coded by category (languages, frameworks, tools)
  - Interactive: hover to highlight connections
- **Top Skills Table:**
  - Skill name
  - Frequency count
  - Success impact percentage
  - Category badge
- **Skill Pairs Table:** Shows commonly co-occurring skills (e.g., "React + Node.js")

**Data Source:**
- `patterns.skill_frequency` (skill counts)
- `patterns.knowledge_graph` (skill relationships)
- `patterns.skill_pairs` (co-occurrence data)

**Visual Design:**
- D3.js force-directed graph
- McKinsey color palette for nodes
- Interactive tooltips
- Responsive table layout

---

### 6. **Company Intelligence**
**Component:** `CompanyIntelligenceV1.vue`

**Purpose:** Compare companies by difficulty and success rate; identify best opportunities

**Content:**
- **Scatter Plot:** Company Performance Analysis
  - X-axis: Interview difficulty (1-5)
  - Y-axis: Success rate (0-100%)
  - Points: Companies (size = number of posts)
  - Color: Seed companies (navy) vs RAG companies (light blue)
  - Quadrants: High Success/Low Difficulty = "Best Opportunities"
- **Company Comparison Table:**
  - Company name
  - Total posts
  - Success rate
  - Avg difficulty
  - Top skills required
  - Seed badge (if from user's posts)
  - Highlighted rows: Best/worst performers

**Data Source:**
- `patterns.company_trends` (company metrics)
- `patterns.seed_companies` (seed vs RAG distinction)

**Visual Design:**
- Chart.js scatter plot
- McKinsey navy/light blue colors
- Responsive table
- Best/worst performers highlighted (light blue background)

---

### 7. **Role Intelligence**
**Component:** `RoleIntelligenceV1.vue`

**Purpose:** Break down interview experiences by job role (e.g., Senior SWE, Staff Engineer, etc.)

**Content:**
- **Role Cards Grid:**
  - Role title
  - Number of posts
  - Avg success rate
  - Top companies hiring for this role
  - Required skills (top 5)
  - Difficulty level
- **Role Comparison Chart:** Bar chart comparing success rates across roles

**Data Source:** `patterns.role_breakdown`

**Visual Design:**
- Card grid layout
- Navy headers
- Skill tags in baby blue
- Success rate badges color-coded

---

### 8. **Critical Skills Analysis**
**Component:** `CriticalSkillsAnalysisV1.vue`

**Purpose:** Identify which skills have the highest impact on interview success

**Content:**
- **Skill-Success Correlation Chart:**
  - Skill name
  - Success rate when skill is present
  - Success rate when skill is absent
  - Delta (impact score)
- **Top Impact Skills List:**
  - Skills sorted by success correlation
  - "Must-have" vs "Nice-to-have" categorization

**Data Source:** `patterns.skill_success_correlation`

**Visual Design:**
- Horizontal bar chart
- Delta arrows (↑↓) showing impact direction
- Green = positive impact, red = negative
- Impact badges

---

### 9. **Topic Breakdown**
**Component:** `TopicBreakdownV1.vue`

**Purpose:** Show distribution of interview topics (coding, system design, behavioral, etc.)

**Content:**
- **Donut Chart:** Topic distribution percentages
- **Topic Cards:**
  - Topic name (e.g., "System Design")
  - Percentage of interviews
  - Example questions
  - Preparation tips

**Data Source:** `patterns.question_distribution`

**Visual Design:**
- Chart.js donut chart
- McKinsey colors
- Topic cards with navy headers

---

### 10. **Success Factors**
**Component:** `SuccessFactorsV1.vue`

**Purpose:** Identify what separates successful interviews from unsuccessful ones

**Content:**
- **Success Factors List:**
  - Factor name (e.g., "System Design preparation")
  - Correlation strength
  - Supporting evidence from posts
- **Failure Patterns:**
  - Common reasons for rejection
  - Knowledge gaps identified

**Data Source:**
- `patterns.correlation_insights`
- `patterns.knowledge_gaps`

**Visual Design:**
- Two-column layout (success vs failure)
- Green checkmarks for success factors
- Red X for failure patterns

---

### 11. **Sentiment & Outcome Analysis**
**Component:** `SentimentOutcomeAnalysisV1.vue`

**Purpose:** Analyze emotional tone and final outcomes of interview experiences

**Content:**
- **Outcome Pie Chart:**
  - Success: X%
  - Failure: Y%
  - Unknown: Z%
- **Sentiment Metrics:**
  - Positive/Negative/Neutral breakdown
  - Emotion keywords word cloud (nervous, confident, etc.)
- **Timeline:** Success rate trends over time

**Data Source:**
- `patterns.sentiment_metrics`
- `patterns.sentiment_timeline`
- `patterns.emotion_keywords`

**Visual Design:**
- Pie chart with green/red/gray slices
- Word cloud visualization
- Line chart for timeline

---

### 12. **Skills Priority Matrix**
**Component:** `SkillsPriorityMatrixV1.vue`

**Purpose:** Help users prioritize which skills to learn/improve (Eisenhower matrix style)

**Content:**
- **2x2 Matrix:**
  - **Quadrant 1 (High Frequency, High Impact):** Learn First
  - **Quadrant 2 (Low Frequency, High Impact):** Differentiate
  - **Quadrant 3 (High Frequency, Low Impact):** Baseline
  - **Quadrant 4 (Low Frequency, Low Impact):** Deprioritize
- **Skill Recommendations:**
  - Top 3 skills to focus on
  - Skills to maintain
  - Skills to skip

**Data Source:**
- `patterns.skill_frequency` (frequency)
- `patterns.skill_success_correlation` (impact)

**Visual Design:**
- 4-quadrant scatter plot
- Color-coded quadrants
- Skill bubbles (size = frequency)

---

### 13. **Interview Questions Intelligence** ⭐ NEW FEATURE
**Component:** `InterviewQuestionsIntelligenceV1.vue`

**Purpose:** Comprehensive searchable database of actual interview questions extracted from foundation posts

**Content:**

#### **A. Overview Stats**
- Total questions extracted
- Questions from seed posts vs RAG posts
- Company coverage
- Category breakdown

#### **B. Source Filter Buttons (Prominent)**
- **"Your Questions Only"** - Filter to questions from user's 4 seed posts
- **"Similar Experiences"** - Questions from RAG posts
- **"All Questions"** - Full database

#### **C. Search & Filters (Compact 2-Row Layout)**
- **Row 1:** Search bar (full width) with 🔍 icon
- **Row 2:** 4 dropdown filters + Clear button (single row)
  - Company filter
  - Category filter (Technical/Behavioral/System Design/Coding)
  - Difficulty filter (Easy/Medium/Hard)
  - Sort dropdown
  - Clear Filters button (right-aligned, red)

#### **D. Question Bank Table**
- Paginated list (10 per page)
- Each question shows:
  - Question text
  - Company
  - Category badge
  - Difficulty (1-5)
  - Success rate %
  - Interview stage
  - Click to open modal

#### **E. Question Detail Modal** ⭐ SOURCE ATTRIBUTION
When user clicks a question, modal shows:
- **Question text** (full)
- **Company & Category badges**
- **Question Details Grid:**
  - Difficulty: 3/5
  - Interview Stage: Technical Round
  - Success Rate: 75%
  - Avg Time: 30 min
- **Related Topics tags** (e.g., "algorithms", "data structures")
- **Preparation Tips** (AI-generated suggestions)
- **🔗 Source Attribution Section:** ⭐ NEW
  - **"View Original Post on Reddit"** link (external link icon)
  - Clickable URL to the original Reddit post where this question was found
  - If question appears in multiple posts: "Mentioned in 3 foundation posts"
  - Security: Opens in new tab with `rel="noopener noreferrer"`

**Data Source:**
- `patterns.interview_questions` (full array)
- Each question includes:
  - `primary_source_url` - Reddit URL of first source post
  - `source_posts[]` - Array of all posts mentioning this question
  - `post_source` - "seed" or "rag"

**Visual Design:**
- Compact filter layout (2 rows)
- Search icon (🔍) for visual affordance
- Modal centered in content area (respects sidebar)
- Source link with external link icon (→)
- McKinsey navy → blue hover transition

**Foundation Posts Principle:**
Every question is traceable back to original Reddit posts, maintaining complete data transparency and allowing users to verify source material.

---

### 14. **Interview Process & Timeline**
**Component:** `InterviewProcessTimelineV1.vue`

**Purpose:** Show typical interview process stages and timelines

**Content:**
- **Horizontal Timeline (Connected Stepper):**
  - Stage 1: Phone Screen (30-45 min)
  - Stage 2: Technical (1-2 hours)
  - Stage 3: Onsite (3-5 hours)
  - Stage 4: Final Round (1-2 hours)
  - Total: 3-5 weeks
- **Disclaimer:** Links to Glassdoor/Blind for company-specific details
- **Company Process Variations Table (if data available):**
  - Company name
  - Total stages
  - Avg duration
  - Unique characteristics

**Data Source:**
- `patterns.interview_stages` (if available)
- Fallback: Industry-standard 4-stage process

**Visual Design:**
- Horizontal connected timeline
- Navy numbered circles
- Gray connecting line
- Responsive: Vertical on mobile

---

### 15. **Learning Plan CTA**
**Component:** `LearningPlanCTA.vue`

**Purpose:** Call-to-action encouraging user to generate a personalized learning roadmap

**Content:**
- **Headline:** "Ready to Level Up?"
- **Description:** "Based on this analysis, create a personalized learning plan to master the skills that matter most"
- **CTA Button:** "Generate My Learning Plan" → Links to Learning Map feature
- **Preview Stats:**
  - X skills to master
  - Y weeks estimated timeline
  - Z companies you'll be ready for

**Data Source:** Summary of top skills from analysis

**Visual Design:**
- Gradient background (navy → blue)
- White text
- Large CTA button
- Engaging, action-oriented

---

## Report Generation Flow

```
User submits 4 posts
    ↓
Backend generates embeddings for each post
    ↓
RAG retrieves ~50 similar posts (60%+ similarity, last 2 years)
    ↓
Combined Foundation Posts (4 seed + 50 RAG = 54 total)
    ↓
Pattern Analysis Engine processes ALL foundation posts
    ↓
Extracts: Skills, Companies, Roles, Questions, Sentiments, etc.
    ↓
Generates pattern_analysis object with 15+ data sections
    ↓
pattern_analysis cached in database (deterministic - same posts = same results)
    ↓
Frontend receives pattern_analysis + individual_analyses + source_posts
    ↓
MultiPostPatternReport.vue orchestrates all 15 section components
    ↓
Each component renders its section using patterns data
    ↓
User views complete report with source attribution throughout
```

---

## Data Structure (Backend Response)

```javascript
{
  // High-level summary
  summary: {
    total_posts_analyzed: 54,
    unique_companies: 12,
    unique_roles: 8,
    overall_success_rate: "67%",
    data_coverage: "High"
  },

  // Individual seed post analyses
  individual_analyses: [
    { company: "Google", role: "Senior SWE", outcome: "offer", ... },
    { company: "Meta", role: "E5 Engineer", outcome: "rejected", ... },
    // ... 4 total
  ],

  // Foundation posts (seed + RAG)
  source_posts: [
    { post_id: "abc123", url: "https://reddit.com/...", title: "...", ... },
    // ... 54 total
  ],

  // Pattern analysis sections
  narrative_summary: "...",
  skill_frequency: [ { skill: "React", count: 45, ... }, ... ],
  skill_success_correlation: [ { skill: "System Design", impact: 12.5, ... }, ... ],
  company_trends: [ { company: "Google", success_rate: 75, ... }, ... ],
  role_breakdown: [ { role: "Senior SWE", count: 20, ... }, ... ],
  question_distribution: { coding: 45, system_design: 30, ... },
  knowledge_gaps: [ { topic: "Distributed Systems", ... }, ... ],
  sentiment_metrics: { total_success: 36, total_failure: 18, ... },
  correlation_insights: [ ... ],
  top_keywords: [ "algorithms", "system design", ... ],
  example_quotes: [ ... ],
  knowledge_graph: { nodes: [...], edges: [...] },
  skill_pairs: [ { skill1: "React", skill2: "Node.js", ... }, ... ],
  emotion_keywords: [ { keyword: "nervous", count: 15 }, ... ],

  // Interview questions with SOURCE ATTRIBUTION
  interview_questions: [
    {
      text: "Design a URL shortener",
      company: "Google",
      category: "system_design",
      difficulty: 4,
      stage: "Technical Round",
      successRate: 75,
      frequency: 3,
      topics: ["distributed systems", "databases"],
      tips: "Review scalability patterns...",
      post_source: "rag",

      // ⭐ NEW: Source attribution fields
      primary_source_url: "https://reddit.com/r/cscareerquestions/comments/xyz/...",
      source_posts: [
        {
          post_id: "xyz",
          url: "https://reddit.com/r/cscareerquestions/comments/xyz/...",
          title: "Google L5 Interview Experience",
          post_source: "rag"
        },
        // Additional posts if question appeared in multiple places
      ]
    },
    // ... more questions
  ],

  company_tiered_questions: { ... },
  seed_companies: ["Google", "Meta"],
  generated_at: "2025-11-15T19:53:00.000Z"
}
```

---

## Modal Components

### 1. **Question Detail Modal**
**Trigger:** Click any question in Question Bank
**Location:** Centered in content area (respects sidebar toggle)
**Features:**
- Question details grid
- Related topics
- Preparation tips
- **Source attribution link** (new)
- Close button (×)
- Click outside to dismiss

### 2. **Source Data Modal** (Future)
**Trigger:** "View All 54 Source Posts" button in Methodology
**Content:**
- Filterable list of all foundation posts
- Seed vs RAG distinction
- Link to original Reddit post
- Post preview
- Metadata (company, role, date)

---

## Styling System

### Color Palette (McKinsey Design System)

```css
/* Primary Colors */
--color-navy: #1E3A8A;           /* Headings, primary buttons */
--color-blue: #3B82F6;           /* Hover states, links */
--color-light-blue: #60A5FA;     /* Accents */
--color-baby-blue: #DBEAFE;      /* Backgrounds, badges */

/* Neutrals */
--color-charcoal: #374151;       /* Body text */
--color-slate: #64748B;          /* Secondary text */
--color-light-gray: #E5E7EB;     /* Borders */
--color-off-white: #F9FAFB;      /* Section backgrounds */
--color-white: #FFFFFF;          /* Cards */

/* Semantic Colors */
--color-destructive: #DC2626;    /* Delete/Clear actions */
--color-success: #10B981;        /* Success indicators */
--color-warning: #F59E0B;        /* Warnings */
```

### Typography

```css
/* Headings */
Section Title: 24px, 700 weight, Navy
Chart Title: 20px, 700 weight, Navy
Modal Title: 22px, 700 weight, Charcoal

/* Body */
Body Text: 15px, 400 weight, Charcoal
Small Text: 13px, 500 weight, Slate
Label Text: 11px, 600 weight, uppercase, Slate
```

### Spacing

```css
Section Padding: 32px
Card Padding: 24px
Gap Between Elements: 16px
Compact Gap: 12px
```

---

## Responsive Breakpoints

```css
Desktop: > 1024px (full layout)
Tablet: 768px - 1024px (2-col grids → 1-col)
Mobile: < 768px (stacked layout, full-width cards)
```

---

## Key Features

### 1. **Source Attribution**
Every insight links back to original Reddit posts for verification and transparency.

### 2. **Deterministic Reports**
Same input posts = identical report every time (cached by batch_id).

### 3. **Foundation Posts Principle**
ALL data derives from 54 foundation posts (4 seed + 50 RAG). No external sources.

### 4. **Interactive Visualizations**
Charts, graphs, and network diagrams for data exploration.

### 5. **Search & Filter**
Powerful question bank with search, multi-filter, and pagination.

### 6. **Responsive Design**
Optimized for desktop, tablet, and mobile viewing.

### 7. **McKinsey Aesthetics**
Professional, consulting-grade visual design.

---

## File Locations

```
vue-frontend/src/components/ResultsPanel/
├── MultiPostPatternReport.vue              # Main orchestrator
├── ReportViewer.vue                        # Report container
├── sections/
│   ├── ReportHeaderV1.vue                  # 1. Header
│   ├── YourInterviewExperiencesV1.vue      # 2. Seed posts
│   ├── MethodologyV1.vue                   # 3. Data sources
│   ├── ExecutiveSummaryV1.vue              # 4. Summary
│   ├── SkillLandscapeAnalysisV1.vue        # 5. Skills
│   ├── CompanyIntelligenceV1.vue           # 6. Companies
│   ├── RoleIntelligenceV1.vue              # 7. Roles
│   ├── CriticalSkillsAnalysisV1.vue        # 8. Skill impact
│   ├── TopicBreakdownV1.vue                # 9. Topics
│   ├── SuccessFactorsV1.vue                # 10. Success/failure
│   ├── SentimentOutcomeAnalysisV1.vue      # 11. Sentiment
│   ├── SkillsPriorityMatrixV1.vue          # 12. Matrix
│   ├── InterviewQuestionsIntelligenceV1.vue # 13. Questions ⭐
│   ├── InterviewProcessTimelineV1.vue      # 14. Timeline
│   └── LearningPlanCTA.vue                 # 15. CTA
└── components/
    └── QuestionBankTable.vue               # Question table component
```

---

## Recent Updates (2025-11-15)

### ✅ Completed Features

1. **Question Source Attribution**
   - Added `primary_source_url` field to all interview questions
   - Added `source_posts[]` array tracking all posts mentioning each question
   - Modal now displays "View Original Post on Reddit" link
   - External link icon (→) for visual clarity
   - "Mentioned in X foundation posts" count for duplicate questions
   - Security: `target="_blank"` + `rel="noopener noreferrer"`

2. **Compact Filter Layout**
   - Reorganized from multi-row to 2-row layout
   - Row 1: Full-width search bar
   - Row 2: 4 filters + Clear button (single row)
   - Added 🔍 search icon with proper positioning
   - Reduced sizing for more compact feel (8px padding, 13px font)

3. **Modal Positioning Fix**
   - Modal centers within content area (respects sidebar)
   - Responsive to sidebar toggle (320px open → 60px closed)
   - Smooth transition animation (0.3s ease)
   - Always visible in current viewport (scroll-independent)

4. **Bug Fixes**
   - Removed undefined `normalizeCompanyName()` function calls
   - Rebuilt Docker container to apply changes
   - Fixed caching issues

---

## Data Transparency Guarantee

Every section of this report can be traced back to specific Reddit posts:

- **Skills** → Extracted from foundation post text
- **Companies** → Mentioned in foundation posts
- **Questions** → Pattern-matched from foundation post content + linked to source URL
- **Success Rates** → Calculated from foundation post outcomes
- **Sentiment** → Analyzed from foundation post language

**No synthetic data. No hallucination. All real Reddit experiences.**

---

## Future Enhancements (Roadmap)

- [ ] Company-specific interview question filtering
- [ ] Question difficulty calibration based on user profile
- [ ] Export report as PDF
- [ ] Share report via unique URL
- [ ] Question upvote/downvote system
- [ ] Community-contributed question tips
- [ ] Integration with LeetCode/HackerRank for practice links
- [ ] Real-time updates when new similar posts are scraped

---

**End of Report Structure Documentation**
