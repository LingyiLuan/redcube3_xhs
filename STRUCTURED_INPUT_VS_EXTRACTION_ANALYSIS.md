# Structured Input vs. LLM Extraction: How Other Platforms Do It

## 🔍 The Core Question

**You have 27+ fields to extract from scraped posts, but your user form only collects 9 fields. How do other platforms handle this gap?**

---

## 📊 Your Current Situation

### Your User Form (ShareExperienceForm.vue) - 9 Fields:
1. Company (text input)
2. Role (text input)
3. Interview Date (date picker)
4. Difficulty (1-5 buttons)
5. Outcome (dropdown: Offer/Reject/Pending/Withdrew/No Response)
6. Questions Asked (textarea, split by newline)
7. Preparation Feedback (textarea)
8. Tips for Others (textarea)
9. Areas Struggled (textarea, split by newline)

### Your LLM Extraction Target - 27+ Fields:
**Basic Info:**
- company, role, sentiment, interview_topics, interview_questions, leetcode_problems
- industry, experience_level, preparation_materials, key_insights
- interview_stages, difficulty_level, timeline, outcome

**Detailed Metadata:**
- total_rounds, remote_or_onsite, offer_accepted, compensation_mentioned
- negotiation_occurred, referral_used, background_check_mentioned
- rejection_reason, interview_format, followup_actions

**Rich Analysis:**
- questions_with_details (12 sub-fields per question!)
- areas_struggled (with severity, details, interview_stage)
- failed_questions, mistakes_made, skills_tested, weak_areas
- success_factors, helpful_resources
- preparation_time_days, practice_problem_count
- interview_rounds, interview_duration_hours
- interviewer_feedback, rejection_reasons, offer_details
- interview_date, job_market_conditions, location
- resources_used, study_approach, mock_interviews_count
- study_schedule, prep_to_interview_gap_days
- previous_interview_count, improvement_areas

**The Gap:** You're trying to extract 27+ fields from unstructured Reddit posts, but your form only collects 9 fields.

---

## 🎯 How Other Platforms Handle This

### 1. **Levels.fyi** - Minimal Structured Input

**What They Collect:**
- Company (dropdown/autocomplete)
- Role/Title (dropdown/autocomplete)
- Level (L3, L4, L5, etc. - dropdown)
- Location (city/state - dropdown)
- Base Salary (number input)
- Stock/Equity (number input)
- Bonus (number input)
- Total Compensation (calculated)
- Years of Experience (number)
- Date (date picker)

**Total Fields: ~10**

**What They DON'T Extract:**
- Interview questions
- Preparation methods
- Areas struggled
- Detailed interview process
- Skills tested
- Resources used

**Key Insight:** They focus on **compensation data only**, not interview experiences. They don't need 27 fields because they're solving a different problem (salary transparency, not interview prep).

**Design Pattern:**
- **Single-purpose form** (compensation only)
- **Dropdowns/autocomplete** for consistency
- **No free-text extraction needed**
- **Basic validation** (numbers, dates)

---

### 2. **Glassdoor** - Hybrid Structured + Free Text

**What They Collect (Structured):**
- Company (autocomplete)
- Job Title (autocomplete)
- Location (autocomplete)
- Interview Date (date picker)
- Offer Status (dropdown: No Offer, Offer, Declined)
- Interview Difficulty (1-5 stars)
- Interview Experience (1-5 stars)
- Interview Process Length (dropdown: <1 week, 1-2 weeks, etc.)

**What They Collect (Free Text):**
- Interview Experience Description (textarea)
- Interview Questions (textarea)
- Advice to Management (textarea)

**Total Structured Fields: ~8**
**Total Free Text Fields: 3**

**What They Extract (Basic NLP):**
- **Keywords** from free text (company names, technologies, skills)
- **Sentiment** (positive/negative/neutral)
- **Topics** (basic categorization)
- **NO complex extraction** (no preparation_time_days, no practice_problem_count, etc.)

**Key Insight:** They use **structured fields for critical data** and **basic NLP for free text**. They don't try to extract 27 fields - they focus on what users can easily provide.

**Design Pattern:**
- **Structured fields** for searchable/filterable data
- **Free text** for rich context (not heavily extracted)
- **Basic keyword extraction** for search
- **No LLM extraction** (too expensive)

---

### 3. **Blind** - Minimal Structure, Maximum Free Text

**What They Collect:**
- Company (autocomplete)
- Topic/Tags (checkboxes: Interview, Salary, Culture, etc.)
- Post Content (rich text editor - unlimited)

**Total Structured Fields: ~2**
**Total Free Text: 1 (but unlimited length)**

**What They Extract:**
- **Nothing!** They just display posts as-is
- **Basic search** (full-text search, keyword matching)
- **No structured extraction**

**Key Insight:** They don't extract anything. Users write free-form, and Blind just displays it. They rely on **user-generated content** and **community moderation**, not AI extraction.

**Design Pattern:**
- **Minimal structure** (just company + tags)
- **Free-form text** (users write however they want)
- **No extraction** (display as-is)
- **Community-driven** (users upvote/downvote, comment)

---

### 4. **LeetCode** - No Extraction, Just Display

**What They Collect:**
- Problem Title (text)
- Problem Description (rich text)
- Solution Code (code editor)
- Tags (checkboxes: Array, String, Dynamic Programming, etc.)

**Total Structured Fields: ~3**
**Total Free Text: 2**

**What They Extract:**
- **Nothing!** Just display discussions
- **Tag-based categorization** (user-selected)
- **No AI extraction**

**Key Insight:** They focus on **problem-solving**, not interview experiences. They don't need complex extraction.

---

## 💡 Key Insights from Research

### 1. **Other Platforms Use SIMPLER Forms**
- Levels.fyi: 10 fields (compensation only)
- Glassdoor: 8 structured + 3 free text
- Blind: 2 structured + 1 free text
- **You:** 9 fields (but trying to extract 27+ from scraped posts)

### 2. **They DON'T Extract Everything**
- Glassdoor: Basic keyword extraction only
- Blind: No extraction at all
- LeetCode: No extraction
- **You:** Trying to extract 27+ fields with LLM

### 3. **They Focus on What Users Can Easily Provide**
- **Structured fields** for critical, searchable data
- **Free text** for context (not heavily processed)
- **No complex inference** (no "preparation_time_days" from text)

### 4. **They Use Basic NLP/Regex, Not LLM**
- **Keyword extraction** (regex)
- **Sentiment analysis** (simple rule-based or cheap API)
- **Topic categorization** (keyword matching)
- **NO LLM extraction** for all fields

---

## 🎯 The Solution: Two-Track Approach

### Track 1: User-Submitted Data (Structured Form)
**Use your existing form** - it's already good! But consider expanding it:

**Current (9 fields):**
- Company, Role, Date, Difficulty, Outcome
- Questions, Preparation, Tips, Areas Struggled

**Could Add (Optional Fields):**
- Years of Experience (number)
- Interview Rounds (number)
- Interview Format (dropdown: Video/Phone/Onsite)
- Resources Used (multi-select or tags)
- Skills Tested (multi-select or tags)
- Preparation Time (dropdown: <1 week, 1-2 weeks, etc.)

**Total: 15-20 structured fields** (still manageable for users)

**Benefits:**
- ✅ **100% accurate** (user-provided)
- ✅ **$0 extraction cost**
- ✅ **Searchable/filterable** immediately
- ✅ **No LLM needed**

### Track 2: Scraped Data (Hybrid Extraction)
**For Reddit/scraped posts, use hybrid extraction:**

**Phase 1: NER + Patterns (Free)**
- Extract: company, role, level, outcome, location (NER)
- Extract: questions, skills, resources (patterns)
- **Coverage: 70-80% of posts**

**Phase 2: Basic NLP (Cheap)**
- Extract: sentiment (rule-based or cheap API)
- Extract: topics (keyword matching)
- Extract: difficulty (keyword matching: "hard", "easy", etc.)
- **Coverage: +10-15%**

**Phase 3: LLM Fallback (Expensive, but rare)**
- Only for posts with <50% field coverage
- Only for high-value posts (user-requested analysis)
- **Coverage: 5-10% of posts**

**Result:**
- **85-90% of posts** extracted without LLM
- **10-15% of posts** need LLM (but only critical ones)
- **Cost: 80-90% reduction**

---

## 🔬 What Fields Can Basic NLP/Regex Handle?

### ✅ Easy with Regex/NER (No LLM Needed):
1. **Company** - NER or keyword matching
2. **Role** - NER or keyword matching
3. **Level** - Keyword matching (L3, L4, Senior, etc.)
4. **Outcome** - Keyword matching (offer, reject, passed, failed)
5. **Location** - NER
6. **Interview Questions** - Pattern matching (numbered lists, "they asked", etc.)
7. **Skills Tested** - Keyword matching (LeetCode, system design, etc.)
8. **Difficulty** - Keyword matching (hard, easy, medium, brutal)
9. **Interview Format** - Keyword matching (video, phone, onsite)
10. **Total Rounds** - Number extraction (regex: "5 rounds", "round 4", etc.)

### ⚠️ Medium Difficulty (Basic NLP, No LLM):
11. **Sentiment** - Rule-based (positive/negative keywords)
12. **Topics** - Keyword matching (coding, system design, behavioral)
13. **Resources Used** - Keyword matching (LeetCode, CTCI, etc.)
14. **Preparation Time** - Number + unit extraction (regex: "3 months", "2 weeks")
15. **Practice Problems** - Number extraction (regex: "200 problems", "150 LC")

### ❌ Hard (Needs LLM or User Input):
16. **Preparation Time Days** (exact calculation from "3 months")
17. **Practice Problem Count** (inference from "a lot of problems")
18. **Success Factors** (inference from narrative)
19. **Mistakes Made** (inference from failure description)
20. **Areas Struggled** (with severity, details, interview_stage)
21. **Questions with Details** (12 sub-fields per question)
22. **Interviewer Feedback** (extraction from narrative)
23. **Job Market Conditions** (inference from context)
24. **Study Approach** (inference: self-study vs. bootcamp)
25. **Mock Interviews Count** (inference from "did 5 mocks")
26. **Prep to Interview Gap** (calculation from dates)
27. **Improvement Areas** (inference from reflection)

---

## 💡 Recommendation: Simplify Your Extraction Goals

### Option 1: **Match Glassdoor's Approach** (Recommended)
**Extract Only Critical Fields:**
1. Company (NER)
2. Role (NER)
3. Level (keyword)
4. Outcome (keyword)
5. Difficulty (keyword)
6. Interview Questions (pattern matching)
7. Skills Tested (keyword)
8. Resources Used (keyword)
9. Preparation Time (basic regex: "3 months" → 90 days)
10. Interview Format (keyword)
11. Total Rounds (number extraction)

**Total: 11 fields** (vs. 27+ currently)

**Use Basic NLP for:**
- Sentiment (rule-based)
- Topics (keyword matching)
- Key insights (extract first 3 sentences)

**Result:**
- ✅ **85-90% coverage** with NER + Patterns
- ✅ **$0 cost** for most posts
- ✅ **LLM only for 5-10%** of posts (edge cases)
- ✅ **Cost: 80-90% reduction**

### Option 2: **Expand User Form** (For User-Submitted Data)
**Add Optional Fields to ShareExperienceForm:**
- Years of Experience
- Interview Rounds
- Interview Format
- Resources Used (multi-select)
- Skills Tested (multi-select)
- Preparation Time (dropdown)

**Result:**
- ✅ **User-submitted data: 15-20 fields** (structured, accurate)
- ✅ **Scraped data: 11 fields** (hybrid extraction)
- ✅ **Best of both worlds**

### Option 3: **Two-Tier System**
**Tier 1: User-Submitted (Rich Data)**
- Full 15-20 field form
- 100% accurate
- $0 extraction cost

**Tier 2: Scraped Data (Basic Data)**
- 11 critical fields only
- Hybrid extraction (NER + Patterns)
- LLM fallback for 5-10%

**Result:**
- ✅ **User data: Rich and accurate**
- ✅ **Scraped data: Basic but free**
- ✅ **Combined: Comprehensive coverage**

---

## 📝 Summary

### The Answer to Your Question:

**"How do they get structured input without extraction?"**

1. **They use SIMPLER forms** (8-10 fields, not 27+)
2. **They focus on what users can easily provide** (structured fields)
3. **They DON'T extract everything** (just critical fields)
4. **They use basic NLP/regex** (not LLM) for free text
5. **They accept incomplete data** (better to have 80% coverage with $0 cost than 100% with $7/day)

### Your Situation:

**You're trying to extract 27+ fields from unstructured Reddit posts, but:**
- Other platforms only extract 8-11 critical fields
- They use basic NLP/regex, not LLM
- They accept that scraped data will be incomplete
- They rely on user-submitted data for rich details

### Recommendation:

**Simplify your extraction goals:**
1. **Extract only 11 critical fields** from scraped posts (NER + Patterns)
2. **Expand your user form** to 15-20 fields (for user-submitted data)
3. **Use LLM only for edge cases** (5-10% of posts)
4. **Accept incomplete data** (better than expensive extraction)

**Result: 80-90% cost reduction, 85-90% field coverage, scalable to 10K+ posts/day**
