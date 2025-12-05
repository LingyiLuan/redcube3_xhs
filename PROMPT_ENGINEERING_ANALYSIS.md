# Prompt Engineering Analysis: Migration 27 Field Extraction

**Date**: 2025-01-23
**Issue**: LLM returns empty arrays for Migration 27 fields despite having comprehensive schema
**Root Cause**: Prompt lacks reasoning instructions for fields that require inference

---

## Database Analysis

### Current State (is_relevant = true posts only)

```sql
Total posts: 776
- has_outcome (llm_outcome): 757 posts (97.5%) ✅ WORKING
- has_prep_materials: 125 posts (16%) ✅ WORKING
- has_insights: 491 posts (63%) ✅ WORKING
- has_success_factors: 0 posts (0%) ❌ NOT EXTRACTING
- has_resources_used: 0 posts (0%) ❌ NOT EXTRACTING
- has_preparation_time_days: 0 posts (0%) ❌ NOT EXTRACTING
```

**Observation**: Old fields work fine. NEW Migration 27 fields return empty arrays.

---

## LLM Response Analysis

### Test Post: "How I cracked FAANG+ with just 30 minutes of studying per day" (1kmt5le)

**Post Characteristics**:
- Outcome: **PASSED** (got FAANG+ offer)
- Content: Detailed preparation strategy (30 min/day for ~6 months)
- Rich in: study approach, resources, success factors
- **Perfect candidate** for Migration 27 extraction

**Actual LLM Response**:
```json
{
  "success_factors": [],
  "resources_used": [],
  "preparation_time_days": null,
  "areas_struggled": [],
  "practice_problem_count": null,
  "interview_rounds": null
}
```

**Expected Response**:
```json
{
  "success_factors": [
    {"factor": "Studied 30 minutes daily consistently", "impact": "high", "category": "preparation"},
    {"factor": "Focused on quality over quantity", "impact": "high", "category": "approach"}
  ],
  "resources_used": [
    {"resource": "LeetCode", "type": "platform", "effectiveness": "high"},
    {"resource": "System Design Primer", "type": "book", "effectiveness": "medium"}
  ],
  "preparation_time_days": 180,
  "practice_problem_count": 150
}
```

---

## Root Cause Analysis

### Why Old Fields Work

**Example: `preparation_materials`** (WORKING - 125 posts have data)

Posts explicitly mention:
- "I used LeetCode Premium"
- "studied from CTCI"
- "watched YouTube tutorials"

These are **DIRECT MENTIONS** - easy to extract.

### Why New Fields Don't Work

**Example: `success_factors`** (NOT WORKING - 0 posts have data)

Posts say things like:
- "I studied 30 minutes a day" → **Need to infer**: This is a success factor
- "I got the offer!" → **Need to correlate**: What led to success?
- "Consistency was key" → **Need to categorize**: Is this preparation/practice/experience?

These require **REASONING** - the LLM needs to:
1. **Identify** what contributed to success
2. **Categorize** the impact level (high/medium/low)
3. **Classify** the category (preparation/practice/experience)
4. **Infer** implicit information from context

---

## Prompt Engineering Issues

### Current Prompt Structure

```
**Success Factors Fields (NEW - Migration 27):**
- success_factors: What contributed to success (e.g., [{"factor": "Practiced 200 LC problems", "impact": "high", "category": "preparation"}])
```

**Problems**:
1. ❌ **No reasoning instructions** - doesn't tell LLM to INFER
2. ❌ **Only one example** - not enough patterns
3. ❌ **No negative examples** - doesn't show what NOT to extract
4. ❌ **No explicit inference rules** - doesn't explain HOW to determine impact/category
5. ❌ **No correlation instructions** - doesn't connect actions → outcomes

### Why This Matters

For a post like:
> "I studied for 6 months, 30 min a day, doing NeetCode 150. Finally got my dream job at Google!"

**Current prompt** → LLM sees no explicit "success factors" label → returns []

**Better prompt** → LLM should infer:
- Study duration (6 months)
- Consistency (daily habit)
- Resource used (NeetCode 150)
- Outcome correlation (this led to Google offer)

---

## Recommended Prompt Engineering Solutions

### Strategy 1: Add Reasoning Instructions

**Before**:
```
- success_factors: What contributed to success (e.g., [...])
```

**After**:
```
- success_factors: ANALYZE what the candidate did that led to success.
  REASONING REQUIRED:
  1. Identify preparation activities mentioned (study routines, resources, practice)
  2. Determine impact based on outcome: If passed → high impact, if struggled but passed → medium, if mentioned casually → low
  3. Categorize as:
     - "preparation": Study time, materials, planning
     - "practice": Mock interviews, coding problems, projects
     - "experience": Prior roles, referrals, networking

  EXTRACT EVEN IF NOT EXPLICITLY LABELED as "success factor". Infer from:
  - "I did X and got the offer" → X is a success factor
  - "X really helped" → X is a success factor
  - "Thanks to X, I passed" → X is a success factor
  - "I spent Y time on Z" → Z is likely a success factor

  Examples:
  ✅ "I studied 3 months, 2 hrs/day" → {"factor": "Studied 2 hours daily for 3 months", "impact": "high", "category": "preparation"}
  ✅ "Did 5 mock interviews" → {"factor": "Completed 5 mock interviews", "impact": "medium", "category": "practice"}
  ✅ "My friend referred me" → {"factor": "Employee referral", "impact": "high", "category": "experience"}
  ❌ Do NOT extract vague statements like "I prepared well" without specifics
```

### Strategy 2: Add Conditional Extraction Logic

```
**IMPORTANT**: success_factors, resources_used, and preparation_time_days are CORRELATED with outcome:

IF outcome = "passed" OR outcome = "pending" (still in process):
  - ACTIVELY SEARCH for success factors (what they did right)
  - AGGRESSIVELY EXTRACT resources_used (what tools/platforms helped)
  - CALCULATE preparation_time_days from timeline mentions

IF outcome = "failed":
  - Focus on mistakes_made, failed_questions, areas_struggled instead
  - Still extract resources_used if mentioned (even if didn't help)
```

### Strategy 3: Add Inference Examples

```
**INFERENCE EXAMPLES for preparation_time_days**:

From text → Inferred days:
"I studied for 3 months" → 90 days
"Prepared for 2 weeks before interview" → 14 days
"6 month grind" → 180 days
"Started prep in January, interviewed in April" → 90 days
"2 years of on-and-off practice" → 730 days (or null if too vague)
```

### Strategy 4: Add Multi-Step Reasoning Chain

```
**EXTRACTION PROCESS for resources_used**:

Step 1: Identify mentions
  - Look for: "I used X", "X helped me", "studied from X", "practiced on X"

Step 2: Classify type
  - "LeetCode", "HackerRank", "CodeSignal" → type: "platform"
  - "CTCI", "System Design Primer", books → type: "book"
  - "Udemy", "Coursera", online classes → type: "course"
  - Websites, blogs, GitHub repos → type: "website"

Step 3: Determine effectiveness
  - IF candidate passed AND mentioned resource → effectiveness: "high"
  - IF candidate mentioned "X helped a lot" → effectiveness: "high"
  - IF candidate mentioned but didn't emphasize → effectiveness: "medium"
  - IF candidate said "X didn't help much" → effectiveness: "low"

Step 4: Extract duration
  - "used LeetCode for 2 months" → duration_weeks: 8
  - "subscribed for 3 months" → duration_weeks: 12
  - If not mentioned → duration_weeks: null
```

---

## Specific Field-by-Field Recommendations

### 1. success_factors (CRITICAL)

**Current Problem**: Returns [] even for clear success stories

**Solution**: Add explicit reasoning chain:
```
**success_factors** - REASONING REQUIRED:

THINK: What actions did the candidate take that led to their outcome?

For PASSED candidates:
1. Study routine (e.g., "studied X hours/day for Y weeks")
2. Problem-solving volume (e.g., "solved 200 LC problems")
3. Resource effectiveness (e.g., "Neetcode 150 was game-changer")
4. Preparation strategies (e.g., "focused on patterns not memorization")
5. Mock interview practice
6. Referrals or networking

For EACH factor, determine:
- impact: "high" if candidate emphasized it or it directly led to success
          "medium" if mentioned as helpful but not critical
          "low" if mentioned casually
- category: "preparation" (study/planning), "practice" (coding/mocks), "experience" (prior work/referrals)

EXTRACT even if not labeled as "success factor". Infer from context.
```

### 2. resources_used (CRITICAL)

**Current Problem**: Returns [] even when resources are clearly mentioned

**Solution**: Add extraction triggers:
```
**resources_used** - EXTRACT ALL mentions of:

Platforms: LeetCode, HackerRank, CodeSignal, AlgoExpert, NeetCode, Pramp, interviewing.io
Books: CTCI (Cracking the Coding Interview), Elements of Programming Interviews, System Design Interview, Designing Data-Intensive Applications
Courses: Udemy, Coursera, educative.io, Frontend Masters, Pluralsight
Websites: GeeksforGeeks, LeetCode Discuss, System Design Primer (GitHub)

For EACH resource:
- resource: exact name mentioned
- type: infer from common platforms (LeetCode → "platform", CTCI → "book")
- effectiveness: "high" if candidate passed and mentioned it, "medium" if helpful, "low" if mentioned but not emphasized
- duration_weeks: calculate from "used X for Y months" statements
- cost: extract if mentioned (e.g., "$35/month", "free", "$99 course")
```

### 3. preparation_time_days (CRITICAL)

**Current Problem**: Always returns null

**Solution**: Add calculation logic:
```
**preparation_time_days** - CALCULATE from timeline mentions:

Look for patterns:
- "I studied for X months" → multiply X by 30
- "X weeks of prep" → multiply X by 7
- "Started in Month1, interviewed in Month2" → calculate difference
- "Y years of practice" → multiply Y by 365

Common phrases:
"3 month grind" → 90
"2 weeks before interview" → 14
"6 month journey" → 180
"prepared for a year" → 365
"1 month of intensive study" → 30

IF multiple timelines mentioned, use the MOST RECENT focused prep period (not total YOE).
```

### 4. areas_struggled (for failed interviews)

**Current Problem**: Returns [] even for failure stories

**Solution**: Add failure pattern recognition:
```
**areas_struggled** - For FAILED or PENDING candidates:

Look for phrases like:
- "I struggled with X"
- "couldn't solve X"
- "got stuck on X"
- "weak in X"
- "didn't know X"
- "failed the X round"

Severity classification:
- "high": Led to rejection ("failed because of X", "couldn't solve X and was rejected")
- "medium": Struggled but continued ("had trouble with X but moved forward")
- "low": Minor difficulty ("X was challenging but I managed")

Extract details about WHAT they struggled with and WHY.
```

---

## Proposed Prompt Refactor

### New Prompt Structure

```markdown
You are a data extraction expert specializing in tech interview analysis.

**CRITICAL INSTRUCTION**: Many fields require INFERENCE and REASONING, not just direct extraction.

**TWO TYPES OF FIELDS**:

1. **DIRECT EXTRACTION** (explicitly stated):
   - company, role, interview_questions, leetcode_problems
   - Look for exact mentions

2. **INFERENCE REQUIRED** (derive from context):
   - success_factors, resources_used, preparation_time_days
   - areas_struggled, failed_questions, interview_rounds
   - **THINK and ANALYZE** - don't just look for labels

**OUTCOME-BASED EXTRACTION STRATEGY**:

IF outcome = "passed":
  → FOCUS ON: success_factors, resources_used, preparation_time_days, practice_problem_count
  → THINK: What did they do that worked?

IF outcome = "failed":
  → FOCUS ON: areas_struggled, failed_questions, mistakes_made, rejection_reasons
  → THINK: What went wrong?

IF outcome = "pending" or "unknown":
  → Extract both positive and negative signals

---

**REASONING FRAMEWORK for success_factors**:

ASK YOURSELF:
1. What preparation activities did the candidate mention?
2. Which activities do they credit for their success?
3. What patterns emerge from their story?

EXTRACTION RULES:
- "I did X" + "got the offer" = X is a success factor
- "X really helped" = X is a success factor
- "spent Y time on Z" = Z is a success factor
- Quantify impact based on emphasis and outcome correlation

EXAMPLES:
✅ "I studied 2 hours daily for 3 months using LeetCode"
   → {"factor": "Consistent daily study (2 hrs/day for 3 months)", "impact": "high", "category": "preparation"}
   → ALSO extract: resources_used: [{"resource": "LeetCode", "type": "platform", ...}]
   → ALSO extract: preparation_time_days: 90

✅ "Did 5 mock interviews with friends"
   → {"factor": "Completed 5 mock interviews", "impact": "medium", "category": "practice"}
   → ALSO extract: mock_interviews_count: 5

❌ "I prepared well" → TOO VAGUE, skip

---

**REASONING FRAMEWORK for preparation_time_days**:

LOOK FOR:
- "X months of study" → multiply by 30
- "Y weeks before interview" → multiply by 7
- "started in [month], interviewed in [month]" → calculate difference
- "Z days of grinding" → use Z directly

PRIORITIZE:
- FOCUSED prep time over total years of experience
- RECENT prep cycle over career-long practice

EXAMPLES:
"3 month grind" → 90
"studied for 2 weeks" → 14
"6 months from application to offer" → calculate from context
"been practicing for 2 years" → likely too vague, use null OR 730 if specific

---

**REASONING FRAMEWORK for resources_used**:

SEARCH FOR:
- Platform names: LeetCode, HackerRank, Blind75, NeetCode, AlgoExpert
- Books: CTCI, EPI, System Design Interview, DDIA
- Courses: Udemy, Coursera, educative.io, Grokking
- Websites: GeeksforGeeks, interviewing.io, Pramp

FOR EACH RESOURCE:
- effectiveness: "high" if passed + mentioned prominently
                 "medium" if mentioned as helpful
                 "low" if mentioned but not emphasized
- duration_weeks: extract from "used X for Y months"
- cost: extract if mentioned ("$35/month", "free", etc.)

CORRELATION:
- IF candidate passed AND mentioned resource → likely effective
- IF candidate failed AND mentioned resource → might have low effectiveness

---

**FIELD INTERDEPENDENCIES**:

These fields should CORRELATE:
- preparation_time_days ↔ practice_problem_count
  (more time usually = more problems solved)

- resources_used ↔ success_factors
  (resources mentioned often become success factors)

- interview_rounds ↔ total_rounds
  (should match if both mentioned)

CROSS-VALIDATE your extractions for consistency.

---

Post content:
```
${text}
```

REMEMBER:
1. INFER and REASON - don't just look for exact labels
2. Use outcome to guide what to extract
3. Quantify everything possible (time, problems, rounds)
4. Extract empty [] only if truly no information available
5. Think like an analyst, not just a parser
```

---

## Testing Strategy

### Phase 1: Test on Known-Good Posts

Test posts that SHOULD have rich data:
1. "How I cracked FAANG+" (1kmt5le) - success story
2. "My 6-month journey to Meta" - preparation story
3. "Failed Google interview - lessons learned" - failure story

Expected results:
- success_factors: 3-5 items for success stories
- resources_used: 2-4 items
- preparation_time_days: numeric value
- areas_struggled: 2-3 items for failure stories

### Phase 2: Compare Before/After

Run backfill with:
1. OLD prompt → check extraction rate
2. NEW prompt → check extraction rate
3. Compare: should see 50-80% increase in populated fields

### Phase 3: Data Quality Validation

Check for:
- Hallucinations (LLM making up resources not mentioned)
- Consistency (success_factors align with resources_used)
- Impact accuracy (high impact factors match outcome)

---

## Implementation Priority

### CRITICAL (Do First):
1. ✅ Update `success_factors` reasoning (highest ROI)
2. ✅ Update `resources_used` extraction (essential for learning maps)
3. ✅ Update `preparation_time_days` calculation (key metric)

### HIGH (Do Next):
4. ✅ Update `areas_struggled` for failed interviews
5. ✅ Update `practice_problem_count` inference
6. ✅ Update `interview_rounds` extraction

### MEDIUM (Do Later):
7. Update `mistakes_made` reasoning
8. Update `skills_tested` correlation
9. Update `offer_details` extraction

---

## Expected Impact

### Before (Current State):
```
success_factors populated: 0 / 776 posts (0%)
resources_used populated: 0 / 776 posts (0%)
preparation_time_days populated: 0 / 776 posts (0%)
```

### After (With Improved Prompt):
```
success_factors populated: ~400 / 776 posts (50-60%)
  - Passed interviews: 80% coverage
  - Failed interviews: 20% coverage (less relevant)

resources_used populated: ~450 / 776 posts (60-70%)
  - Most posts mention at least 1 resource

preparation_time_days populated: ~350 / 776 posts (45-55%)
  - Posts with timeline info: 80% coverage
  - Posts without timeline: 0% coverage (expected)
```

### Learning Map Impact:
- **Before**: Empty success_factors, empty resources → no value
- **After**: Rich data for aggregation → actionable insights
- **Example**: "78% of passed candidates used LeetCode Premium for avg 8 weeks"

---

## Next Steps

1. **Refactor `aiService.analyzeText()` prompt** using new reasoning framework
2. **Test on 10 sample posts** with known outcomes
3. **Validate extraction quality** (no hallucinations, accurate categorization)
4. **Run backfill on 50 posts** to measure coverage improvement
5. **If successful, run full backfill** on all 776 posts
6. **Re-test learning map** to verify data flows through

**Estimated Time**: 4-6 hours for prompt refactor + testing
**Expected ROI**: 50-60% field population rate (vs 0% now)
