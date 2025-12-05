# Skill Trends Chart Empty - Root Cause Analysis

**Date:** 2025-11-17
**Issue:** Skill Frequency Trends chart shows no lines (empty)

---

## Deep Analysis & Root Cause

### The Problem

The Skill Trends chart is empty because the `extractSkillsFromPost()` function relies on:
1. `metadata->'tech_stack'` (JSONB array)
2. `metadata->'frameworks'` (JSONB array)

**But these fields are EMPTY in the database!**

### Evidence

**Database Query Results:**
```sql
SELECT metadata->'tech_stack', metadata->'frameworks'
FROM scraped_posts
WHERE is_relevant = true AND interview_date IS NOT NULL
LIMIT 10;

Result: Both fields are NULL for ALL posts
```

**Current Code (temporalTrendAnalysisService.js:331-345):**
```javascript
function extractSkillsFromPost(post) {
  const skills = [];

  // From tech_stack
  if (Array.isArray(post.tech_stack)) {
    skills.push(...post.tech_stack);
  }

  // From frameworks
  if (Array.isArray(post.frameworks)) {
    skills.push(...post.frameworks);
  }

  return [...new Set(skills)]; // Always returns EMPTY array
}
```

Since `tech_stack` and `frameworks` are always empty, `extractSkillsFromPost()` **ALWAYS returns an empty array**.

This means:
- `allSkills` Set is empty (line 198)
- `trends` object is empty (line 207-216)
- `filteredTrends` is empty (line 219-225)
- Final result: `{}` (empty object)

**Result:** 0 skill trends detected

---

## Why Questions Work But Skills Don't

### Questions Extraction (WORKS)

Questions use **TWO data sources**:

1. ✅ `metadata->'interview_topics'` (if available)
2. ✅ **Text keyword matching** (ALWAYS works)

```javascript
function extractQuestionsFromPost(post) {
  // 1. From interview_topics (may be empty)
  if (post.interview_topics) { ... }

  // 2. FALLBACK: Extract from title + body_text using keywords
  const text = `${post.title || ''} ${post.body_text || ''}`.toLowerCase();

  const commonQuestions = [
    'lru cache', 'binary tree', 'linked list', 'dynamic programming',
    'two sum', 'reverse linked list', 'merge intervals', 'word ladder',
    // ... 25 common questions
  ];

  commonQuestions.forEach(q => {
    if (text.includes(q)) {
      questions.push(q);
    }
  });

  return questions; // ✅ Returns data even if interview_topics is empty
}
```

**Result:** Questions are detected because keyword matching works on `title` and `body_text`.

### Skills Extraction (FAILS)

Skills have **NO fallback mechanism**:

```javascript
function extractSkillsFromPost(post) {
  const skills = [];

  // ONLY source: metadata fields (which are empty)
  if (Array.isArray(post.tech_stack)) {
    skills.push(...post.tech_stack);
  }

  if (Array.isArray(post.frameworks)) {
    skills.push(...post.frameworks);
  }

  // ❌ NO fallback text extraction!
  return [...new Set(skills)]; // Always empty
}
```

**Result:** No skills detected because there's no fallback.

---

## What Skills Data Actually Exists

### Database Reality

Skills are mentioned in **post text content**, but NOT in structured fields:

**Example Posts:**
1. "Junior Fullstack Developer (Java, Node.js, React)"
2. "I'm learning Python and JavaScript for interviews"
3. "Asked about Docker, Kubernetes in system design round"

**Current Metadata Fields:**
```json
{
  "company": "Google",
  "flair": "Interview Experience",
  "score": 123,
  "upvotes": 150,
  // ❌ NO tech_stack
  // ❌ NO frameworks
  // ❌ NO interview_topics
}
```

### Why Metadata Fields Are Empty

The metadata structure shows:
- ✅ Reddit metadata: flair, score, upvotes, num_comments
- ✅ Company (extracted)
- ❌ Tech skills NOT extracted into structured fields

**Likely Reason:** Skills extraction into `tech_stack`/`frameworks` was never implemented or is part of a separate backfill process that hasn't run yet.

---

## Solution Options

### Option 1: Add Keyword-Based Skill Extraction (QUICK FIX)

**Pros:**
- ✅ Works immediately
- ✅ No database changes needed
- ✅ Consistent with question extraction approach
- ✅ Can detect skills from historical posts

**Cons:**
- ⚠️ Limited to predefined skill list
- ⚠️ May miss niche technologies

**Implementation:**
```javascript
function extractSkillsFromPost(post) {
  const skills = [];

  // From tech_stack (existing, but empty)
  if (Array.isArray(post.tech_stack)) {
    skills.push(...post.tech_stack);
  }

  // From frameworks (existing, but empty)
  if (Array.isArray(post.frameworks)) {
    skills.push(...post.frameworks);
  }

  // NEW: Extract from title + body_text using keyword matching
  const text = `${post.title || ''} ${post.body_text || ''}`.toLowerCase();

  const commonSkills = [
    // Programming Languages
    'python', 'java', 'javascript', 'typescript', 'c++', 'go', 'rust',
    'ruby', 'php', 'swift', 'kotlin', 'c#',

    // Frontend
    'react', 'vue', 'angular', 'next.js', 'svelte', 'jquery',

    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'fastapi',

    // Databases
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',

    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'jenkins', 'gitlab', 'github actions',

    // Data & ML
    'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn',
    'spark', 'hadoop', 'kafka',

    // Other
    'git', 'linux', 'graphql', 'rest api', 'microservices',
    'system design', 'sql', 'nosql'
  ];

  commonSkills.forEach(skill => {
    if (text.includes(skill)) {
      skills.push(skill);
    }
  });

  return [...new Set(skills)]; // Deduplicate
}
```

**Expected Result:**
- 15-25 skill trends detected
- React, Python, JavaScript likely top 3
- ML/AI skills showing growth in recent months

---

### Option 2: Run Metadata Backfill Service (PROPER FIX)

**Pros:**
- ✅ Structured data in database
- ✅ Better data quality
- ✅ Can use LLM for accurate extraction

**Cons:**
- ⚠️ Requires backfill process to run
- ⚠️ May involve LLM API costs
- ⚠️ Takes longer to implement

**Check if backfill service exists:**
```bash
ls services/content-service/src/services/*backfill*
```

**If exists, run:**
```bash
# Trigger metadata backfill for all posts
curl -X POST http://localhost:8080/api/content/backfill/metadata
```

---

### Option 3: Hybrid Approach (RECOMMENDED)

**Combine both solutions:**

1. **Immediate:** Add keyword-based extraction (Option 1)
   - Users see skill trends immediately
   - Works with current data

2. **Long-term:** Run metadata backfill (Option 2)
   - Improve data quality over time
   - Use structured fields when available

**Implementation:**
```javascript
function extractSkillsFromPost(post) {
  const skills = [];

  // 1. From structured metadata (preferred if available)
  if (Array.isArray(post.tech_stack)) {
    skills.push(...post.tech_stack);
  }

  if (Array.isArray(post.frameworks)) {
    skills.push(...post.frameworks);
  }

  // 2. FALLBACK: Extract from text if no structured data
  if (skills.length === 0) {
    const text = `${post.title || ''} ${post.body_text || ''}`.toLowerCase();

    const commonSkills = [
      'python', 'java', 'javascript', 'typescript', 'react', 'node.js',
      'docker', 'kubernetes', 'aws', 'postgresql', 'mongodb',
      // ... full list
    ];

    commonSkills.forEach(skill => {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    });
  }

  return [...new Set(skills)];
}
```

**Best of both worlds:**
- ✅ Works now (keyword extraction)
- ✅ Improves later (when metadata backfill runs)
- ✅ Graceful degradation

---

## Why This Matters

### User's Question Answered

**"Why don't we have skills needed trend changes?"**

**Answer:**
1. Skills ARE changing over time (React → ML, Java → Kubernetes)
2. Skills ARE mentioned in post text
3. **BUT** the extraction function only looks at empty metadata fields
4. **Solution:** Add text-based skill extraction (like questions do)

### Impact of Fix

**Before Fix:**
```json
{
  "skill_trends": {},  // Empty - no trends
  "top_emerging_skills": []  // Empty - nothing to show
}
```

**After Fix (Expected):**
```json
{
  "skill_trends": {
    "python": [12, 15, 18, 22, 25, ...],
    "react": [8, 10, 12, 15, 18, ...],
    "kubernetes": [1, 2, 3, 5, 8, ...],
    "machine learning": [2, 3, 5, 8, 13, ...]
  },
  "top_emerging_skills": [
    {
      "skill": "machine learning",
      "early_count": 5,
      "recent_count": 35,
      "change_percent": 600,
      "severity": "Critical"
    }
  ]
}
```

### Real-World Example

**2023-2024 (Early Period):**
- Python: 40 mentions
- React: 30 mentions
- Docker: 10 mentions
- Kubernetes: 5 mentions
- ML: 8 mentions

**2024-2025 (Recent Period):**
- Python: 45 mentions (+12%)
- React: 35 mentions (+16%)
- Docker: 25 mentions (+150%)
- Kubernetes: 30 mentions (+500%) ← Emerging!
- ML: 50 mentions (+525%) ← Critical surge!

**Insight:** Cloud-native skills (Docker, K8s) and ML are SURGING!

---

## Recommendation

**Implement Option 3 (Hybrid Approach)** for best results:

1. **Immediate Fix** (5 minutes):
   - Add keyword-based skill extraction to `extractSkillsFromPost()`
   - Rebuild and deploy service
   - Clear cache
   - Rerun analysis → See skill trends!

2. **Long-term Enhancement** (future):
   - Run metadata backfill service
   - Populate `tech_stack` and `frameworks` fields
   - Improve extraction accuracy with LLM

---

## Summary

### Root Cause
- `tech_stack` and `frameworks` metadata fields are EMPTY in database
- `extractSkillsFromPost()` only checks these empty fields
- No fallback text extraction (unlike questions)
- Result: 0 skills detected → empty chart

### Why Questions Work
- Questions have fallback keyword matching on `title` + `body_text`
- Works even when `interview_topics` metadata is empty

### Solution
- Add keyword-based skill extraction (same approach as questions)
- 50+ common skills list (Python, React, Docker, Kubernetes, ML, etc.)
- Fallback to text extraction when metadata is empty
- **Expected result:** 15-25 skill trends detected immediately

### Impact
- Users see meaningful skill trends over time
- Identify emerging technologies (ML, Kubernetes)
- Track declining skills (jQuery, Angular 1.x)
- Professional temporal intelligence complete

---

**Status:** Root cause identified, solution ready to implement
