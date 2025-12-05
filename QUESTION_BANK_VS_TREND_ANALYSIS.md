# Question Bank vs Trend Analysis - Different Purposes

**Date:** 2025-11-17

---

## Two Different Systems

### System 1: Question Bank (Detailed Questions)
**Purpose:** Store specific interview questions asked by companies
**Database:** `interview_questions` table (218 questions)

### System 2: Trend Analysis (Topic Keywords)
**Purpose:** Track question topic frequency changes over time
**Database:** In-memory aggregation for temporal charts

---

## Question Bank: How It Works

### Database Schema
```sql
interview_questions:
  - id (primary key)
  - post_id (reference to scraped_posts)
  - question_text (FULL QUESTION - detailed!)
  - question_type (coding, system_design, behavioral, etc.)
  - difficulty (easy, medium, hard)
  - category (data_structures, algorithms, etc.)
  - company (Google, Meta, etc.)
  - interview_stage (phone_screen, onsite, etc.)
  - extraction_confidence (0.75-0.95)
  - embedding (vector for similarity search)
```

### Sample Questions (From Database)

**Detailed LeetCode Questions:**
- "LC 315 - Count Smaller Numbers After Self"
- "LC 148 - Sort List"
- "LC 421 - Maximum XOR of Two Numbers"
- "LC 212 - Word Search II"
- "LC 239 - Sliding Window Maximum"

**Behavioral Questions:**
- "How did you prioritize what type of PM roles to go after?"
- "What's your least favorite part about the job?"
- "How valuable is having a technical background as a Product Manager?"

### Extraction Method: Pattern-Based (NO LLM!)

**6 Regex Patterns (0.75-0.95 confidence):**

1. **Numbered Lists** (0.95 confidence)
   ```
   Pattern: ^\s*\d+[\.)]\s+(.{10,300})$
   Example: "1. Implement LRU cache"
            "2) Design a rate limiter"
   ```

2. **Explicit Question Markers** (0.90 confidence)
   ```
   Pattern: (they asked|interviewer asked|was asked)[\s:,]+(.{10,300})
   Example: "They asked: how would you design Twitter?"
            "Interviewer asked me to implement merge sort"
   ```

3. **Bullet Lists** (0.88 confidence)
   ```
   Pattern: ^\s*[-*•]\s+(.{10,300})$
   Example: "- Design a URL shortener"
            "* Implement merge sort"
   ```

4. **Round/Phase Markers** (0.87 confidence)
   ```
   Pattern: (round\s*\d+|phone screen|onsite)[\s:]+(.{10,300})
   Example: "Round 1: System design question"
            "Phone screen: Reverse a linked list"
   ```

5. **Quoted Questions** (0.82 confidence)
   ```
   Pattern: "([A-Z][^"]{10,300}\?)"
   Example: "Can you reverse a linked list?"
            "Explain the difference between REST and GraphQL"
   ```

6. **Imperative Patterns** (0.75 confidence)
   ```
   Pattern: (implement|design|write|create)\s+(.{10,200})
   Example: "Implement a function to find duplicates"
            "Design a system that can handle 1M users"
   ```

### Processing Pipeline

```
Reddit Post
    ↓
Preprocess (clean markdown, remove code blocks)
    ↓
Apply 6 regex patterns
    ↓
Filter blacklist ("anyone know", "should i", etc.)
    ↓
Deduplicate similar questions
    ↓
Classify type (coding, system_design, behavioral, technical)
    ↓
Save to interview_questions table
    ↓
Generate embedding for similarity search
```

**Key Stats:**
- **218 questions** extracted from posts
- **7 companies** tracked
- **36 question types** identified
- **No LLM used** - pure regex patterns!
- **Performance:** <1ms per post, $0/month cost

---

## Trend Analysis: How It Works (Current)

### Purpose
Track how question TOPICS change over time (not specific questions)

### Current Method

**Simple Keyword Matching:**
```javascript
const commonQuestions = [
  'lru cache', 'binary tree', 'linked list', 'dynamic programming',
  'two sum', 'reverse linked list', 'merge intervals', 'word ladder',
  'longest substring', 'valid parentheses', 'climbing stairs',
  'house robber', 'coin change', 'edit distance', 'shortest path',
  'graph traversal', 'bfs', 'dfs', 'backtracking', 'heap',
  'trie', 'union find', 'sliding window', 'kadane', 'binary search'
];

// For each post:
const text = `${post.title} ${post.body_text}`.toLowerCase();
commonQuestions.forEach(topic => {
  if (text.includes(topic)) {
    // This post mentions this topic
  }
});
```

### Current Output

**Monthly Frequency Data:**
```json
{
  "question_trends": {
    "trie": [0, 0, 0, 0, 0, 2, 0, 0, 1, 0, ...],  // 31 months
    "binary search": [0, 0, 0, 0, 1, 2, 3, 4, ...],
    "linked list": [1, 2, 3, 5, 7, 10, 12, ...]
  }
}
```

**This is NOT detailed questions!**
- It's tracking TOPICS mentioned in posts
- Counts how many posts mention "binary tree" each month
- Used for trend visualization (charts)

---

## Key Differences

| Aspect | Question Bank | Trend Analysis |
|--------|---------------|----------------|
| **Purpose** | Store specific interview questions | Track topic frequency over time |
| **Granularity** | DETAILED questions ("LC 315 - Count Smaller...") | TOPIC keywords ("binary tree") |
| **Storage** | Database table (persistent) | In-memory aggregation (ephemeral) |
| **Extraction** | Regex patterns (6 methods) | Simple keyword matching (25 keywords) |
| **Output** | List of unique questions | Monthly frequency counts |
| **Use Case** | "What questions does Google ask?" | "Are binary tree questions increasing?" |
| **LLM Used** | NO - pure regex | NO - simple text search |
| **Examples** | "LC 212 - Word Search II" | "binary tree" (topic) |

---

## Your Question Answered

### "How do we extract questions for question bank?"

**Answer:** Using **pattern-based extraction (NO LLM!)**

**The questionExtractionService.js does:**

1. **Finds question patterns in text:**
   - Numbered lists: "1. Implement LRU cache"
   - Explicit markers: "They asked: design Twitter"
   - Bullet points: "- Reverse a linked list"
   - Round markers: "Round 1: System design"
   - Quoted questions: "Can you implement merge sort?"
   - Imperative instructions: "Implement a function to..."

2. **Cleans and filters:**
   - Removes code blocks, URLs, markdown
   - Filters blacklist patterns ("anyone know", "should i")
   - Length validation (10-300 chars)
   - Confidence threshold (0.70+)

3. **Deduplicates:**
   - Normalizes similar questions
   - Removes near-duplicates

4. **Classifies:**
   - coding (array, tree, graph problems)
   - system_design (design Twitter, URL shortener)
   - behavioral (tell me about a time...)
   - technical (explain REST vs GraphQL)

5. **Saves to database:**
   - Full question text
   - Metadata (company, difficulty, type)
   - Generates embedding for similarity search

**Result:** 218 detailed questions extracted from posts!

### "Each question is very detailed not just a topic"

**YES! Examples from database:**

**Detailed Questions:**
- ✅ "LC 315 - Count Smaller Numbers After Self"
- ✅ "How did you prioritize what type of PM roles to go after?"
- ✅ "Explain the difference between REST and GraphQL"

**NOT just topics:**
- ❌ "binary tree" (this is trend analysis)
- ❌ "system design" (this is trend analysis)

---

## Should We Change Trend Analysis?

### Current Approach (Topic Keywords)
**Pros:**
- ✅ Fast (simple keyword matching)
- ✅ No LLM needed
- ✅ Good for trend visualization
- ✅ Catches topic mentions across different phrasings

**Cons:**
- ⚠️ Not detailed (just topics, not specific questions)
- ⚠️ Limited to 25 predefined topics

### Alternative: Use Question Bank Data

**Could we use the 218 detailed questions for trends?**

**Challenges:**
1. **Different granularity:**
   - "LC 315 - Count Smaller Numbers After Self" (too specific)
   - vs "data structures" (topic for trends)

2. **Need normalization:**
   - "Reverse a linked list"
   - "LC 206 - Reverse Linked List"
   - "Implement a function to reverse a linked list"
   - → Should all count as "linked list" topic

3. **Coverage:**
   - Question bank: 218 specific questions
   - Trend topics: Need to cover ALL 580 posts

### Recommended Hybrid Approach

**For Trend Analysis:**
- Keep simple topic keywords (75 topics)
- Fast, covers all posts
- Good for temporal visualization

**For Question Bank:**
- Keep detailed pattern extraction
- Stores specific questions
- Used for "What questions did Google ask?" queries

**Both systems serve different purposes!**

---

## Implications for Our Fix

### What We're Fixing

**Trend Analysis (temporalTrendAnalysisService.js):**

**For Questions:**
- Current: 25 topic keywords
- Proposed: **75 topic keywords** (expanded coverage)
- Method: Simple text matching (NO LLM)
- Output: Monthly topic frequencies

**For Skills:**
- Current: 0 (broken SQL query)
- Proposed: **90 skill keywords** (comprehensive)
- Method: Simple text matching (NO LLM)
- Output: Monthly skill frequencies

### What We're NOT Changing

**Question Bank (questionExtractionService.js):**
- Keep 6 regex patterns
- Keep detailed question extraction
- Keep database storage
- Still NO LLM needed
- Still extracts 218+ detailed questions

---

## Summary

### Question Bank (interview_questions table)
- **Purpose:** Store detailed interview questions
- **Example:** "LC 315 - Count Smaller Numbers After Self"
- **Method:** 6 regex patterns (NO LLM)
- **Output:** 218 specific questions with metadata
- **Use:** "What questions does Google ask for SDE2?"

### Trend Analysis (temporal trends)
- **Purpose:** Track topic frequency changes over time
- **Example:** "binary tree" mentioned 5 times in 2024, 12 times in 2025
- **Method:** Simple keyword matching (NO LLM)
- **Output:** Monthly frequencies for charts
- **Use:** "Are binary tree questions becoming more popular?"

### Both Work Together
- Question Bank: What specific questions are asked?
- Trend Analysis: Which topics are trending up/down?
- Both use pattern/keyword matching (NO LLM!)
- Both are fast and cost-effective

---

## Our Fix is Still Valid

**We're NOT trying to make trend analysis as detailed as question bank!**

We're just:
1. Fixing SQL query (use correct columns)
2. Adding more topic keywords (75 questions, 90 skills)
3. Using simple text matching (like question bank uses regex)

**This gives us:**
- ✅ Better topic coverage
- ✅ Better trend detection
- ✅ Still fast and simple
- ✅ Still NO LLM needed
- ✅ Serves different purpose than question bank

---

**Conclusion:** Question bank and trend analysis are complementary systems with different purposes. Our fix enhances trend analysis without duplicating question bank functionality.
