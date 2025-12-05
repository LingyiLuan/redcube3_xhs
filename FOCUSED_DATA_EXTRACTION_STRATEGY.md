# 🎯 Focused Data Extraction Strategy

## What Data Should We Focus On?

Based on your platform's use case (interview prep intelligence), here's what matters most:

---

## 🔍 Core Use Case Analysis

**Your Platform's Purpose:**
- Help candidates prepare for tech interviews
- Provide insights on what to expect (questions, skills, difficulty)
- Show success patterns (what works, what doesn't)
- Guide preparation (resources, time, strategies)

**What Users Actually Need:**
1. **What questions will I be asked?** (Interview Questions)
2. **What skills do they test?** (Skills Tested)
3. **How hard is it?** (Difficulty, Outcome)
4. **How should I prepare?** (Resources, Preparation Time)
5. **What are common mistakes?** (Areas Struggled, Mistakes Made)
6. **What works?** (Success Factors)

---

## 📊 Priority Fields (What to Extract)

### **Tier 1: Critical Fields (Must Have) - 8 Fields**

These are **absolutely essential** for your platform to function:

1. **Company** ⭐⭐⭐⭐⭐
   - **Why:** Core filter/search dimension
   - **Extraction:** NER (easy, free)
   - **Used in:** All reports, filtering, search

2. **Role** ⭐⭐⭐⭐⭐
   - **Why:** Core filter/search dimension
   - **Extraction:** NER (easy, free)
   - **Used in:** All reports, filtering, search

3. **Outcome** ⭐⭐⭐⭐⭐
   - **Why:** Success rate calculations, filtering
   - **Extraction:** Keyword matching (easy, free)
   - **Used in:** Success rate analysis, filtering

4. **Difficulty** ⭐⭐⭐⭐⭐
   - **Why:** User expectations, filtering
   - **Extraction:** Keyword matching (easy, free)
   - **Used in:** Difficulty analysis, filtering

5. **Interview Questions** ⭐⭐⭐⭐⭐
   - **Why:** Core value proposition - "What will I be asked?"
   - **Extraction:** Pattern matching (medium, free)
   - **Used in:** Question Bank, Intelligence Dashboard

6. **Skills Tested** ⭐⭐⭐⭐
   - **Why:** Preparation guidance - "What should I study?"
   - **Extraction:** Keyword matching (easy, free)
   - **Used in:** Skills Priority Matrix, Critical Skills Analysis

7. **Resources Used** ⭐⭐⭐⭐
   - **Why:** Preparation guidance - "What should I use?"
   - **Extraction:** Keyword matching (easy, free)
   - **Used in:** Preparation Roadmap, Resource recommendations

8. **Interview Rounds** ⭐⭐⭐
   - **Why:** Process expectations
   - **Extraction:** Number extraction (easy, free)
   - **Used in:** Process overview, timeline

**Total: 8 fields**
**Extraction Method: NER + Patterns (Free)**
**Coverage: 85-90% of posts**

---

### **Tier 2: Important Fields (Nice to Have) - 5 Fields**

These add significant value but aren't critical:

9. **Preparation Time** ⭐⭐⭐
   - **Why:** Preparation guidance
   - **Extraction:** Regex (medium, free) - "3 months" → 90 days
   - **Used in:** Preparation Roadmap, time estimates

10. **Areas Struggled** ⭐⭐⭐
    - **Why:** Common pitfalls, what to avoid
    - **Extraction:** Keyword matching (medium, free)
    - **Used in:** Weak Areas analysis, preparation tips

11. **Success Factors** ⭐⭐⭐
    - **Why:** What works, best practices
    - **Extraction:** LLM or keyword matching (hard, expensive OR medium, free)
    - **Used in:** Success analysis, recommendations

12. **Interview Format** ⭐⭐
    - **Why:** Process expectations
    - **Extraction:** Keyword matching (easy, free)
    - **Used in:** Process overview

13. **Location** ⭐⭐
    - **Why:** Regional variations
    - **Extraction:** NER (easy, free)
    - **Used in:** Location-based insights

**Total: 5 fields**
**Extraction Method: Hybrid (NER + Patterns + selective LLM)**
**Coverage: 70-80% of posts**

---

### **Tier 3: Advanced Fields (Optional) - 14+ Fields**

These are **nice to have** but not essential:

14. **Practice Problem Count** ⭐⭐
15. **Mock Interviews Count** ⭐⭐
16. **Study Approach** ⭐⭐
17. **Interviewer Feedback** ⭐⭐
18. **Mistakes Made** (with details) ⭐⭐
19. **Questions with Details** (12 sub-fields) ⭐⭐
20. **Skills Tested** (with pass/fail) ⭐⭐
21. **Weak Areas** (with severity) ⭐⭐
22. **Helpful Resources** (with why_helpful) ⭐⭐
23. **Interview Duration** ⭐
24. **Job Market Conditions** ⭐
25. **Prep to Interview Gap** ⭐
26. **Previous Interview Count** ⭐
27. **Improvement Areas** ⭐

**Total: 14+ fields**
**Extraction Method: LLM (expensive)**
**Coverage: 50-60% of posts (with LLM)**

**Recommendation:** Extract these **only for user-requested analyses**, not for all scraped posts.

---

## 🎯 Recommended Focus: **8-13 Fields**

### **For Scraped Posts (Automatic Extraction):
**Extract 8-11 fields using NER + Patterns:**

1. Company (NER)
2. Role (NER)
3. Outcome (keyword)
4. Difficulty (keyword)
5. Interview Questions (pattern matching)
6. Skills Tested (keyword)
7. Resources Used (keyword)
8. Interview Rounds (number extraction)
9. Preparation Time (regex - optional)
10. Areas Struggled (keyword - optional)
11. Interview Format (keyword - optional)

**Cost: $0 (NER + Patterns)**
**Coverage: 85-90% of posts**
**Speed: <100ms per post**

### **For User-Submitted Posts (Structured Form):
**Collect 15-20 fields via form:**

**Current (9 fields):**
- Company, Role, Date, Difficulty, Outcome
- Questions, Preparation, Tips, Areas Struggled

**Add (6-11 optional fields):**
- Years of Experience
- Interview Rounds
- Interview Format
- Resources Used (multi-select)
- Skills Tested (multi-select)
- Preparation Time (dropdown)
- Success Factors (textarea)
- Mistakes Made (textarea)
- Mock Interviews Count
- Practice Problems Count
- Study Approach (dropdown)

**Total: 15-20 fields**
**Cost: $0 (user-provided)**
**Coverage: 100% (structured input)**

### **For User-Requested Analysis (LLM):
**Extract all 27+ fields using LLM:**

- Only when user clicks "Analyze" on a specific post
- Only for posts they're actively viewing
- Full LLM extraction with all fields

**Cost: ~$0.003 per analysis**
**Coverage: 90-95% (with LLM)**
**Usage: Low volume (user-driven)**

---

## 📈 Data Usage in Your Reports

### **What Your Reports Actually Use:**

**Single Analysis Report:**
- Company, Role, Outcome, Difficulty ✅
- Interview Questions ✅
- Skills Tested ✅
- Resources Used ✅
- Areas Struggled ✅

**Batch Analysis Report:**
- Company trends (company, outcome) ✅
- Skills Priority Matrix (skills_tested) ✅
- Interview Questions Intelligence (interview_questions) ✅
- Critical Skills Analysis (skills_tested) ✅
- Success Factors (success_factors) ⚠️
- Preparation Roadmap (resources_used, preparation_time) ⚠️

**Learning Map:**
- Skills Roadmap (skills_tested) ✅
- Resources (resources_used) ✅
- Timeline (preparation_time) ⚠️

**Key Insight:** Your reports use **8-11 core fields** most of the time. The advanced fields (success_factors, preparation_time_days, etc.) are **nice to have** but not critical.

---

## 💡 Final Recommendation

### **Focus on These 8-11 Fields:**

**Must Have (8 fields):**
1. Company
2. Role
3. Outcome
4. Difficulty
5. Interview Questions
6. Skills Tested
7. Resources Used
8. Interview Rounds

**Nice to Have (3 fields):**
9. Preparation Time
10. Areas Struggled
11. Interview Format

**Extraction Method:**
- **Scraped Posts:** NER + Patterns (free, 85-90% coverage)
- **User-Submitted:** Structured form (free, 100% coverage)
- **User-Requested:** Full LLM (expensive, but low volume)

**Result:**
- ✅ **85-90% of posts** extracted without LLM
- ✅ **$0 cost** for automatic extraction
- ✅ **LLM only for user-requested analyses** (low volume)
- ✅ **Cost: 90%+ reduction** (from $7/day to <$1/day)

---

## 🎯 Action Plan

1. **Simplify LLM extraction** to 8-11 fields (not 27+)
2. **Use NER + Patterns** for scraped posts (free)
3. **Expand user form** to 15-20 fields (for rich user data)
4. **Use LLM only** for user-requested analyses (low volume)
5. **Accept incomplete data** (better than expensive extraction)

**Bottom Line:** Focus on **8-11 critical fields** that your reports actually use. Extract them with **free methods** (NER + Patterns). Use **LLM only for user-requested analyses**, not for all scraped posts.
