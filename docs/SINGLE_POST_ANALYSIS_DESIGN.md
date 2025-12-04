# Single Post Analysis Report - Design Specification

**Date:** January 19, 2025
**Version:** 1.0
**Status:** Design Phase

---

## Core Principles

### 1. **No Mock Data**
- All insights must be derived from actual data in the database
- If data doesn't exist, hide the section entirely (conditional rendering)
- Use foundation pool (benchmark cache) for industry comparisons
- Never generate placeholder or synthetic data

### 2. **No Emojis**
- Professional, McKinsey-style presentation
- Use visual indicators: badges, color coding, progress bars
- Let data and design speak for themselves

### 3. **Professional UI/UX**
- Same design system as Batch Analysis Report
- Color palette: White → Grey → Baby Blue → Light Blue → Blue
- Clean typography, generous whitespace
- Data visualization over decoration

### 4. **Focus on Both Success & Failure**
- Equal treatment of successful and failed interviews
- "What went wrong" for failures
- "What went right" for successes
- Learning opportunities in both cases

### 5. **Learning Map Integration**
- Remove "Actionable Recommendations" section
- Replace with "Generate Learning Map" button
- Learning Map handles skill gap analysis and action plans
- Single Post Analysis focuses on diagnosis, Learning Map handles prescription

---

## User Intent Analysis

### What Users Want from Single Post Analysis:

**Primary Questions:**
1. "How does THIS interview compare to industry benchmarks?"
2. "What specifically happened in THIS interview?"
3. "Why did I fail/succeed?"
4. "Is my experience normal for this company/role?"
5. "What were my strengths and weaknesses?"

**Secondary Questions:**
1. "How does this compare to my other interviews?" (if user has multiple posts)
2. "What questions were asked and how hard were they?"
3. "What should I focus on next?" (→ Learning Map)

---

## Report Structure

### **Section 1: Interview Overview**
**Purpose:** Context and quick summary

**Components:**
- Company name
- Role title
- Interview outcome (Success/Failure) with visual indicator
- Interview date (if available)
- Difficulty rating (if extracted from post)
- Interview stages (if multi-stage, from post content)

**Data Sources:**
- Post metadata (company, role, outcome)
- Post content (NLP extraction for stages, difficulty)
- `interview_date` field (if populated)

**UI Design:**
- Card layout with key metrics
- Color-coded outcome badge (blue for success, grey for failure - no red/green)
- Clean grid for stages if multi-stage
- Date shown in relative format ("3 months ago") + absolute

**Conditional Logic:**
- Always show (required fields: company, role, outcome)
- Hide stages if not extracted
- Hide date if not available

---

### **Section 2: Benchmark Comparison**
**Purpose:** "How does this interview stack up?"

**Components:**

**A. Success Rate Benchmark**
- "Industry Success Rate: 45% for Google SWE"
- "Your Outcome: Failed" (or "Passed")
- Visual: Horizontal bar showing where user falls vs benchmark

**B. Difficulty Benchmark**
- "Your Difficulty Rating: 4.5/5"
- "Industry Average: 4.2/5 for Google SWE"
- "Interpretation: Your interview was slightly harder than typical"

**C. Interview Stage Comparison (if multi-stage)**
- Table showing success rates by stage
- Example:
  ```
  Stage            | Industry Success | Your Outcome
  -------------------|------------------|-------------
  Phone Screen       | 60%              | Passed
  Technical Round 1  | 55%              | Passed
  Technical Round 2  | 40%              | Failed
  Onsite             | 50%              | Did not reach
  ```

**Data Sources:**
- `benchmark_role_intelligence` table (filtered by role)
- `benchmark_stage_success` table (filtered by company)
- Post content (for user's outcome)

**UI Design:**
- McKinsey-style comparison table
- Inline progress bars for percentages
- Subtle color coding (baby blue for above benchmark, grey for below)
- Professional typography

**Conditional Logic:**
- Always show success rate benchmark (required)
- Show difficulty only if extracted from post or user-provided
- Show stage breakdown only if post has multi-stage data

---

### **Section 3: Skills Performance Analysis**
**Purpose:** "What were your strengths and weaknesses?"

**Components:**

**A. Skills Tested in This Interview**
- List of skills extracted from post content
- Comparison to typical skills for this role
- Example:
  ```
  Skills You Were Tested On:
  - System Design
  - Algorithms (Dynamic Programming)
  - Behavioral (Leadership)

  Typical Skills for Google SWE:
  - System Design (95% of interviews)
  - Algorithms (98% of interviews)
  - Behavioral (80% of interviews)
  ```

**B. Skills Performance Matrix**
- Table showing each skill tested, performance level, benchmark
- Example:
  ```
  Skill            | Your Performance | Benchmark Success
  -----------------|------------------|------------------
  System Design    | Strong           | 70% excel
  Algorithms       | Weak             | 85% excel
  Behavioral       | Strong           | 60% excel
  ```

**C. Gap Analysis (Critical Section)**
- Identify likely failure/success factors
- Based on comparison of user performance vs benchmark
- Example (Failure):
  ```
  Critical Gap: Algorithms (Dynamic Programming)

  Evidence:
  - You indicated struggling with DP question in post
  - 85% of successful Google SWE candidates excel at algorithms
  - Your other skills (System Design, Behavioral) met benchmarks

  Likely Impact: Primary reason for rejection
  ```

- Example (Success):
  ```
  Success Factors:

  Strengths:
  - System Design: Exceeded benchmark (90th percentile)
  - Behavioral: Strong leadership examples (80th percentile)

  Why This Mattered:
  - Google SWE heavily emphasizes system design (95% of roles)
  - Your preparation in distributed systems aligned with requirements
  ```

**Data Sources:**
- `post_skills` table (skills for this post)
- `interview_questions` table (if questions extracted)
- Foundation pool (benchmark skill distribution by role)
- Post content (NLP extraction for performance indicators)

**UI Design:**
- Clean table with visual performance indicators
- Progress bars for benchmark percentages
- Highlight critical gaps with subtle baby blue background
- Professional narrative text for interpretation

**Conditional Logic:**
- Show only if skills were extracted from post
- Hide performance level if not extractable from post content
- Show gap analysis only if we have enough data to make inference

---

### **Section 4: Interview Questions Intelligence**
**Purpose:** "What questions were asked and how hard were they?"

**Components:**

**A. Questions Asked (if extracted)**
- List of specific questions from post
- Difficulty rating for each question
- Success rate for each question (from foundation pool)
- Example:
  ```
  Question 1: "Design a distributed cache system"
  - Type: System Design
  - Difficulty: Hard (4.5/5)
  - Success Rate: 35% of candidates answer well
  - Your Performance: Strong (based on post content)

  Question 2: "Implement LRU Cache with O(1) operations"
  - Type: Algorithms (Dynamic Programming)
  - Difficulty: Medium-Hard (4.0/5)
  - Success Rate: 60% of candidates answer well
  - Your Performance: Struggled (based on post content)
  ```

**B. Question Difficulty vs Benchmark**
- Overall difficulty of questions vs typical for this company/role
- Visual comparison

**Data Sources:**
- `interview_questions` table (if questions extracted from post)
- Foundation pool (question difficulty benchmarks)
- Post content (user's description of performance on each question)

**UI Design:**
- Card layout for each question
- Difficulty shown as compact badge (e.g., "Hard 4.5/5")
- Success rate shown as inline progress bar
- Performance indicator (subtle color coding)

**Conditional Logic:**
- **Hide entire section if no questions extracted**
- This is optional/nice-to-have section
- Only show if we have high-quality question extraction

---

### **Section 5: Similar Interview Experiences**
**Purpose:** "Am I alone in this? What happened to others?"

**Components:**

**A. Similar Interviews from Foundation Pool**
- Find 3-5 similar posts based on:
  - Same company
  - Same role
  - Similar outcome (failed/passed)
  - Similar skill profile

**B. Display Format:**
```
Post #1: Google SWE, Failed
- Difficulty: 4.5/5
- Key Skills: System Design (Strong), Algorithms (Weak), Behavioral (Strong)
- Similar to your experience: "Failed on DP question in technical round 2"
- Follow-up: Re-interviewed 8 months later, passed on second attempt

Post #2: Google SWE, Failed
- Difficulty: 4.0/5
- Key Skills: System Design (Strong), Algorithms (Strong), Behavioral (Weak)
- Similar to your experience: "Technical skills solid, failed behavioral round"
- Follow-up: Joined Meta instead, similar role

Post #3: Google SWE, Passed
- Difficulty: 4.2/5
- Key Skills: All Strong
- Key Success Factor: "Practiced 50+ DP problems before interview"
- Outcome: Offered L4, accepted offer
```

**Data Sources:**
- Foundation pool (all `is_relevant=true` posts)
- Query filters:
  - `company = <this post's company>`
  - `role = <this post's role>`
  - `outcome` (prioritize same outcome, show some opposite for contrast)
  - Similarity score based on skills overlap

**UI Design:**
- Card layout for each similar post
- Clean typography, concise summaries
- Subtle visual grouping (failed vs passed)
- Anonymous (no user info, just post summaries)

**Conditional Logic:**
- Show only if 3+ similar posts exist in foundation pool
- If <3 similar posts, hide section entirely
- Never show mock/synthetic data

---

### **Section 6: Learning Map Integration**
**Purpose:** "What should I do next?"

**Components:**

**A. Call-to-Action Button**
- Primary button: "Generate Personalized Learning Map"
- Positioned prominently after analysis sections
- Clicking navigates to Learning Map feature with this post as seed

**B. Context Text:**
```
Based on this interview analysis, our AI can generate a personalized
learning roadmap to address skill gaps and prepare you for your next
opportunity.
```

**C. Preview of What Learning Map Will Include:**
- Skill gap analysis
- Recommended learning resources
- Practice problem sets
- Timeline and milestones
- Interview readiness score

**UI Design:**
- Prominent CTA button (baby blue background, white text)
- Clean card layout with preview text
- Professional, inviting (not pushy)

**Data Flow:**
- Button passes `post_id` to Learning Map feature
- Learning Map uses this post + benchmark data to generate plan
- Seamless navigation between features

---

### **Sections EXCLUDED from Single Post Analysis**

**Why excluded:**

❌ **Company-by-Company Comparison**
- Reason: Only one company in single post
- Alternative: Shown in Batch Analysis if user has multiple posts

❌ **Role Intelligence (Multiple Roles)**
- Reason: Only one role in single post
- Alternative: Benchmark comparison shows role-specific data

❌ **Strategic Insights Dashboard**
- Reason: Requires pattern detection across multiple posts
- Alternative: Available in Batch Analysis

❌ **Temporal Trends**
- Reason: Needs time-series data (multiple posts over time)
- Alternative: Can show "Interview Date" in overview if available

❌ **Actionable Recommendations**
- Reason: Replaced by Learning Map feature
- Alternative: Learning Map provides comprehensive action plans

---

## Data Architecture

### **Primary Data Sources**

1. **This Post's Data:**
   - Table: `posts`
   - Fields: `id`, `company`, `role`, `outcome`, `content`, `interview_date`, `difficulty`

2. **Skills from This Post:**
   - Table: `post_skills`
   - Query: `WHERE post_id = <this_post_id>`

3. **Questions from This Post (Optional):**
   - Table: `interview_questions`
   - Query: `WHERE post_id = <this_post_id>`

4. **Benchmark Data:**
   - Table: `benchmark_role_intelligence`
   - Query: `WHERE role = <this_post_role>`

   - Table: `benchmark_stage_success`
   - Query: `WHERE company = <this_post_company>`

5. **Similar Posts:**
   - Query foundation pool:
   ```sql
   SELECT * FROM posts
   WHERE is_relevant = true
     AND company = <this_post_company>
     AND role = <this_post_role>
     AND id != <this_post_id>
   ORDER BY
     (outcome = <this_post_outcome>) DESC,  -- prioritize same outcome
     created_at DESC
   LIMIT 5
   ```

### **Conditional Rendering Logic**

```javascript
// Section 1: Always show (required fields)
showOverview = true

// Section 2: Show if benchmark data exists
showBenchmark = benchmarkRoleData && benchmarkRoleData.length > 0

// Section 3: Show if skills extracted
showSkills = postSkills && postSkills.length > 0

// Section 4: Show if questions extracted
showQuestions = interviewQuestions && interviewQuestions.length > 0

// Section 5: Show if 3+ similar posts exist
showSimilar = similarPosts && similarPosts.length >= 3

// Section 6: Always show (Learning Map CTA)
showLearningMapCTA = true
```

---

## UI/UX Design Guidelines

### **Color Palette**

**Primary Colors:**
- Background: `#FFFFFF` (White)
- Borders/Dividers: `#E5E7EB` (Grey 200)
- Text Primary: `#111827` (Grey 900)
- Text Secondary: `#6B7280` (Grey 500)

**Accent Colors (Blue Gradient):**
- Baby Blue: `#DBEAFE` (Blue 100) - for highlights
- Light Blue: `#93C5FD` (Blue 300) - for borders
- Blue: `#3B82F6` (Blue 500) - for primary actions
- Navy Blue: `#1E40AF` (Blue 700) - for emphasis

**Semantic Colors:**
- Success: `#DBEAFE` (Baby Blue - not green)
- Failure: `#F3F4F6` (Grey 100 - not red)
- Neutral: `#E5E7EB` (Grey 200)

### **Typography**

**Headers:**
- Section Title: 24px, Bold, Grey 900
- Subsection Title: 18px, Semibold, Grey 900
- Chart Title: 16px, Semibold, Grey 900

**Body:**
- Narrative Text: 14px, Regular, Grey 700
- Table Text: 13px, Regular, Grey 700
- Caption/Label: 11px, Medium, Grey 600

**Font Family:**
- System font stack (same as Batch Analysis)
- `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`

### **Layout**

**Spacing:**
- Section margin-bottom: 40px
- Card padding: 24px
- Table cell padding: 12px 14px
- Gap between components: 16px

**Width:**
- Max content width: Same as Batch Analysis
- Responsive breakpoints: Same as Batch Analysis

**Visual Hierarchy:**
- Use whitespace, not color, for separation
- Subtle shadows for card elevation
- Border-radius: 6px for cards, 4px for badges

### **Components**

**Badges:**
- Outcome badge: Pill shape, 12px text, bold
- Difficulty badge: Compact, inline
- Data source badge: Same as Batch Analysis (Benchmark/Personalized)

**Progress Bars:**
- Height: 8px
- Border-radius: 4px
- Background: Grey 200
- Fill: Baby Blue to Blue gradient based on value

**Tables:**
- Header: Grey 50 background
- Row hover: Grey 50
- Borders: Grey 200
- No zebra striping (keep clean)

**Buttons:**
- Primary (Learning Map CTA): Blue background, white text, medium shadow
- Secondary: White background, blue border, blue text
- Hover: Subtle lift animation

---

## Backend API Design

### **Endpoint:**
```
POST /api/content/posts/analyze-single
```

### **Request Body:**
```json
{
  "postId": "abc123"
}
```

### **Response Structure:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "company": "Google",
      "role": "Software Engineer",
      "outcome": "failed",
      "difficulty": 4.5,
      "interviewDate": "2024-10-15T00:00:00Z",
      "stages": [
        { "name": "Phone Screen", "outcome": "passed" },
        { "name": "Technical Round 1", "outcome": "passed" },
        { "name": "Technical Round 2", "outcome": "failed" }
      ]
    },
    "benchmark": {
      "successRate": 45,
      "avgDifficulty": 4.2,
      "stageBreakdown": [
        { "stage": "Phone Screen", "successRate": 60 },
        { "stage": "Technical Round 1", "successRate": 55 },
        { "stage": "Technical Round 2", "successRate": 40 }
      ]
    },
    "skills": {
      "tested": [
        {
          "name": "System Design",
          "performance": "strong",
          "benchmark": { "successRate": 70, "percentile": 75 }
        },
        {
          "name": "Algorithms",
          "performance": "weak",
          "benchmark": { "successRate": 85, "percentile": 30 }
        }
      ],
      "gapAnalysis": {
        "criticalGap": "Algorithms (Dynamic Programming)",
        "evidence": [
          "Post mentions struggling with DP question",
          "85% of successful candidates excel at algorithms",
          "Other skills met benchmarks"
        ],
        "likelyImpact": "Primary reason for rejection"
      }
    },
    "questions": [
      {
        "question": "Design a distributed cache system",
        "type": "System Design",
        "difficulty": 4.5,
        "successRate": 35,
        "userPerformance": "strong"
      }
    ],
    "similarPosts": [
      {
        "id": "xyz789",
        "company": "Google",
        "role": "Software Engineer",
        "outcome": "failed",
        "difficulty": 4.5,
        "keySkills": ["System Design", "Algorithms", "Behavioral"],
        "summary": "Failed on DP question in technical round 2",
        "followUp": "Re-interviewed 8 months later, passed"
      }
    ]
  }
}
```

### **Error Handling:**
```json
{
  "success": false,
  "error": "Post not found",
  "code": "POST_NOT_FOUND"
}
```

---

## Implementation Plan

### **Phase 1: MVP (Week 1-2)**
1. ✅ Section 1: Interview Overview
2. ✅ Section 2: Benchmark Comparison
3. ✅ Section 3: Skills Performance Analysis
4. ✅ Section 6: Learning Map CTA

### **Phase 2: Enhanced (Week 3)**
5. ✅ Section 4: Questions Intelligence (if extraction ready)
6. ✅ Section 5: Similar Experiences

### **Phase 3: Polish (Week 4)**
7. ✅ UI refinements
8. ✅ Performance optimization
9. ✅ Edge case handling
10. ✅ User testing feedback

---

## Success Metrics

**User Engagement:**
- Time spent on Single Post Analysis page
- Click-through rate to Learning Map
- Return visits to analyze other posts

**User Satisfaction:**
- Survey: "Did this analysis provide valuable insights?" (1-5 scale)
- Survey: "Did you understand why you failed/succeeded?" (1-5 scale)

**Technical Performance:**
- Page load time < 1 second
- API response time < 500ms
- Zero timeout errors

---

## Open Questions

1. **Skills Performance Inference:**
   - Q: How do we infer "strong" vs "weak" performance from post content?
   - A: Use NLP extraction + sentiment analysis on skill mentions
   - Fallback: Only show skills tested, not performance level

2. **Similar Posts Matching:**
   - Q: What similarity threshold should we use?
   - A: Start with exact company + role match, add skill overlap scoring later

3. **Gap Analysis Confidence:**
   - Q: When do we show gap analysis vs hide it?
   - A: Only show if we have high confidence (skills extracted + clear failure pattern)

4. **Learning Map Integration:**
   - Q: Should Learning Map auto-generate or require user click?
   - A: Require user click - gives user control, avoids unnecessary computation

---

**Last Updated:** January 19, 2025
**Next Review:** After MVP implementation
**Owner:** Development Team
