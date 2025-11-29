const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenRouter client
const openrouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://redcube-xhs.local',
    'X-Title': 'RedCube XHS Analysis Platform'
  }
});

/**
 * Robust JSON parsing function to extract JSON from AI response
 * Handles markdown code blocks, special tokens, and other formatting
 */
function extractJsonFromString(str) {
  try {
    // First try direct parsing
    return JSON.parse(str.trim());
  } catch (error) {
    // Clean the string by removing markdown, special characters, and extra text
    let cleanStr = str
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/`/g, '')
      .replace(/◁/g, '')
      .replace(/▷/g, '')
      .replace(/\n\n/g, '\n')  // Remove double newlines
      .trim();

    // Remove any leading/trailing text before/after JSON
    const firstBrace = cleanStr.indexOf('{');
    const lastBrace = cleanStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanStr = cleanStr.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(cleanStr);
    } catch (secondError) {
      // Try to fix common JSON issues
      let fixedStr = cleanStr
        // Fix trailing commas before } or ]
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas between properties
        .replace(/("\s*:\s*(?:"[^"]*"|[\d.]+|true|false|null|\[.*?\]|\{.*?\}))\s*("\w+")/g, '$1,$2')
        // Remove any non-JSON characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      try {
        return JSON.parse(fixedStr);
      } catch (thirdError) {
        // Last resort: try to extract just the object using balanced braces
        const extracted = extractBalancedJson(cleanStr);
        if (extracted) {
          return JSON.parse(extracted);
        }

        throw new Error(`Failed to parse JSON after all attempts. Original: ${str.substring(0, 200)}...`);
      }
    }
  }
}

/**
 * Helper function to extract valid JSON by balancing braces
 */
function extractBalancedJson(str) {
  const stack = [];
  let start = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '{') {
      if (stack.length === 0) {
        start = i;
      }
      stack.push('{');
    } else if (char === '}') {
      stack.pop();
      if (stack.length === 0 && start !== -1) {
        // Found balanced JSON object
        return str.substring(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * Analyze XHS post using OpenRouter with model fallback cascade
 * This is the single function used throughout the application
 */
async function analyzeText(text) {
  const prompt = `You are an expert data extraction specialist with advanced inference capabilities.

**═══════════════════════════════════════════════════════════════════**
**CRITICAL: INFERENCE-FIRST EXTRACTION STRATEGY**
**═══════════════════════════════════════════════════════════════════**

Your task is to extract structured data from interview posts using AGGRESSIVE INFERENCE.
DO NOT just extract explicitly stated values - you must INFER from context.

**INFERENCE PRIORITY LEVELS:**
1. **Direct Extraction** (40%): Explicitly stated values
2. **Contextual Inference** (30%): Calculate from dates, events, narrative
3. **Pattern-Based Defaults** (20%): Apply baselines based on outcome + post type
4. **Outcome-Correlated Inference** (10%): Use outcome to guide inference

**TARGET: >90% field coverage** (not 0%, not 50% - aim for 90%+)

**═══════════════════════════════════════════════════════════════════**
**INFERENCE RULES BY FIELD CATEGORY**
**═══════════════════════════════════════════════════════════════════**

### TIME CALCULATION (preparation_time_days, prep_to_interview_gap_days)

**EXPLICIT RULES - APPLY EXACTLY:**
- "3 months" = 90 days | "couple weeks"/"2 weeks" = 14 days
- "a month" = 30 days | "6 weeks" = 42 days
- "spring to summer" = 90 days | "intensive bootcamp" = 45 days
- "January to March" = 90 days | "studied for a year" = 365 days

**CONTEXTUAL INFERENCE:**
- "prepared while working full-time" → 60-90 days minimum
- "quit job to prep" → 30-60 days (intensive)
- "started studying [date], interviewed [date]" → calculate days

**DEFAULT BASELINES:**
- passed + mentions "prepared" → 60 days
- passed + no prep mention → 30 days
- failed + "didn't prepare enough" → 14 days
- failed + no mention → 21 days

### PRACTICE PROBLEMS (practice_problem_count)

**EXPLICIT:** "solved 200 problems" → 200 | "did 150 LC" → 150
**INFERENCE:** "tons of problems" → 200 | "a lot of leetcode" → 150
**PHRASES:** "barely practiced" → 20 | "blind 75" → 75 | "neetcode 150" → 150
**DEFAULTS:** passed + mentions "leetcode" → 150 | failed → 50

### SUCCESS FACTORS - AGGRESSIVE EXTRACTION (For PASSED interviews)

**RULE: Extract ANY positive action as success factor**
- "studied daily" → {"factor": "Studied daily", "impact": "high", "category": "preparation"}
- "used LC premium" → {"factor": "Used LeetCode Premium", "impact": "high", "category": "preparation"}
- "did mock interviews" → {"factor": "Practiced mock interviews", "impact": "medium", "category": "practice"}
- "3 months prep" → {"factor": "Prepared for 3 months", "impact": "high", "category": "preparation"}
- "reviewed CTCI" → {"factor": "Studied CTCI", "impact": "medium", "category": "preparation"}
- "had 2 YOE" → {"factor": "Had 2 years experience", "impact": "medium", "category": "experience"}

**IF PASSED BUT NO FACTORS:** Infer from prep time:
- prep >= 60 days → [{"factor": "Dedicated preparation time", "impact": "high", "category": "preparation"}]

### RESOURCES (resources_used & helpful_resources) - CROSS-FIELD INFERENCE REQUIRED

**═══════════════════════════════════════════════════════════════════**
**CRITICAL: INFER RESOURCES FROM skills_tested EVEN IF NOT MENTIONED**
**═══════════════════════════════════════════════════════════════════**

**RULE 1: If skills_tested includes "Data Structures" OR "Algorithms" OR "Coding" OR "Binary Search" OR "Dynamic Programming" OR any coding skill:**
  → resources_used MUST include:
    [{"resource": "LeetCode", "type": "platform", "url": "https://leetcode.com/problemset/algorithms/", "effectiveness": "high", "duration_weeks": 8}]
  → helpful_resources MUST include: ["LeetCode"]

**RULE 2: If skills_tested includes "System Design":**
  → resources_used MUST include:
    [{"resource": "System Design Primer", "type": "website", "url": "https://github.com/donnemartin/system-design-primer", "effectiveness": "high", "duration_weeks": 4}]
  → helpful_resources MUST include: ["System Design Primer"]

**RULE 3: If skills_tested includes "Behavioral":**
  → resources_used MUST include:
    [{"resource": "Mock interviews", "type": "practice", "effectiveness": "medium"}]
  → helpful_resources MUST include: ["Mock interviews"]

**EXPLICITLY MENTIONED RESOURCES (Add to inferred ones):**
**WATCH FOR:** LeetCode, CTCI, System Design Primer, AlgoExpert, Blind 75, NeetCode, Pramp, Interviewing.io, YouTube channels
**EFFECTIVENESS:** passed + resource → "high" | failed + resource → "medium"

**IMPORTANT:** Always return BOTH inferred (from skills_tested) AND explicitly mentioned resources. Combine them into a single array.

### ROUNDS (interview_rounds)

"5 rounds" → 5 | "multiple rounds" → 4 | "onsite" → 4 | "phone screen" → 1
**DEFAULT:** 4 (typical FAANG)

### MOCK INTERVIEWS (mock_interviews_count)

"did 5 mocks" → 5 | "practiced with friends" → 3 | passed + no mention → 3

### STUDY APPROACH (study_approach)

"studied on my own" → "self-study" | "bootcamp" → "bootcamp" | "tutor" → "tutor" | "mixed" → "mixed"
**MANDATORY DEFAULT:** "self-study" (NEVER return null)

**═══════════════════════════════════════════════════════════════════**
**MANDATORY DEFAULTS - NEVER RETURN NULL FOR THESE FIELDS**
**═══════════════════════════════════════════════════════════════════**

**FOR PASSED INTERVIEWS (outcome = "passed"):**
- preparation_time_days: Use 30 if not mentioned (minimum baseline)
- practice_problem_count: Use 100 if coding interview, 0 if behavioral/PM only
- mock_interviews_count: Use 3 if not mentioned (typical successful prep)
- study_approach: Use "self-study" if not mentioned
- interview_rounds: Use 4 if not mentioned (typical FAANG)

**FOR FAILED INTERVIEWS (outcome = "failed"):**
- preparation_time_days: Use 14 if not mentioned (suggests insufficient prep)
- practice_problem_count: Use 50 if coding interview mentioned
- mock_interviews_count: Use 0 if not mentioned
- study_approach: Use "self-study" if not mentioned

**FOR ALL INTERVIEWS (regardless of outcome):**
- study_approach: NEVER null, always default to "self-study"
- resources_used: MUST infer from skills_tested (see RESOURCES section above)
- helpful_resources: MUST infer from skills_tested (see RESOURCES section above)
- study_schedule: Use "flexible" if not mentioned (reasonable assumption)

### WEAK AREAS (weak_areas)

Extract from: areas mentioned needing improvement, failed skills
**IF FAILED + NO MENTION:** ["interview preparation", "problem solving"]

### INTERVIEW DATE (interview_date)

"March 2024" → "2024-03-15" | "last month" → calculate | "this summer" → mid-summer

**═══════════════════════════════════════════════════════════════════**
**CRITICAL: COMPREHENSIVE GENERATIVE REASONING FOR ALL FAILURE TYPES**
**═══════════════════════════════════════════════════════════════════**

When explicit information is MISSING or SPARSE, use your deep knowledge of interview patterns to GENERATE plausible, realistic, and highly valuable data based on company, role, outcome, and failure type.

**CORE PHILOSOPHY: Better to provide well-informed inferences than empty arrays! Users need actionable insights from EVERY post, even sparse ones.**

**═══════════════════════════════════════════════════════════════════**
**PART 1: UNDERSTANDING ALL FAILURE TYPES**
**═══════════════════════════════════════════════════════════════════**

**Failure Type 1: TECHNICAL FAILURES** (coding/algorithms/system design)
- Failed to solve coding problems
- Incorrect algorithm complexity
- Poor system design decisions
- Couldn't handle edge cases

**Failure Type 2: BEHAVIORAL/CULTURE FIT FAILURES** (soft skills/values alignment)
- Failed behavioral rounds (STAR answers weak)
- Culture assessment tools (Meta's Preferences @ Work, etc.)
- Leadership principles alignment (Amazon)
- Communication style mismatch
- Team fit concerns

**Failure Type 3: PROCESS/EXPERIENCE FAILURES** (non-performance related)
- Passed all technical tests but rejected (culture fit, budget, headcount freeze)
- Unprofessional interviewer behavior
- Interview process red flags
- Communication/coordination issues
- Timeline mismatches

**Failure Type 4: PARTIAL SUCCESS FAILURES** (did well but not well enough)
- Strong but not excellent performance
- Good technical but weak behavioral
- Competing with stronger candidates

**═══════════════════════════════════════════════════════════════════**
**PART 2: COMPANY-SPECIFIC GENERATIVE PATTERNS**
**═══════════════════════════════════════════════════════════════════**

**GOOGLE (All roles):**
- areas_struggled: [{"area": "Algorithm Optimization", "severity": "medium", "details": "Google expects optimal time/space complexity", "interview_stage": "coding round"}, {"area": "System Design Scalability", "severity": "medium", "details": "Designing for billions of users", "interview_stage": "design round"}]
- success_factors: [{"factor": "Solved 200+ LeetCode problems", "impact": "high", "category": "preparation"}, {"factor": "Practiced Googleyness questions", "impact": "high", "category": "culture"}]
- skills_tested: [{"skill": "Algorithms", "category": "Coding", "passed": true, "difficulty": "hard"}, {"skill": "System Design", "category": "Design", "passed": true, "difficulty": "hard"}]
- resources_used: [{"resource": "LeetCode", "type": "platform", "effectiveness": "high", "duration_weeks": 12}]
- preparation_time_days: 90
- practice_problem_count: 200

**AMAZON (All roles - CRITICAL: Leadership Principles heavy):**
- areas_struggled: [{"area": "Leadership Principles", "severity": "high", "details": "Amazon heavily weights behavioral - must have strong STAR stories for all 16 LPs", "interview_stage": "behavioral round"}, {"area": "Customer Obsession examples", "severity": "medium", "details": "Need specific examples showing customer focus", "interview_stage": "behavioral round"}]
- success_factors: [{"factor": "Studied all 16 Leadership Principles with examples", "impact": "high", "category": "culture"}, {"factor": "Prepared STAR stories for each LP", "impact": "high", "category": "preparation"}]
- resources_used: [{"resource": "Amazon Leadership Principles guide", "type": "document", "effectiveness": "high"}, {"resource": "LeetCode", "type": "platform", "effectiveness": "high", "duration_weeks": 8}]
- helpful_resources: [{"resource": "Grokking the Behavioral Interview", "type": "course", "why_helpful": "Structured STAR format for Amazon LPs"}]

**META (All roles - CRITICAL: Culture assessment + product thinking):**
- areas_struggled: [{"area": "Preferences @ Work Assessment", "severity": "high", "details": "Meta's culture fit tool - must align with Meta values (Move Fast, Be Bold, Focus on Impact)", "interview_stage": "culture assessment"}, {"area": "Product Sense", "severity": "medium", "details": "Meta expects product thinking even for backend roles", "interview_stage": "product design"}]
- success_factors: [{"factor": "Researched Meta's culture deeply", "impact": "high", "category": "culture"}, {"factor": "Understood 'Move Fast' philosophy", "impact": "high", "category": "culture"}]
- resources_used: [{"resource": "Meta Engineering Blog", "type": "website", "effectiveness": "high"}]

**MICROSOFT (All roles):**
- areas_struggled: [{"area": "Situation/Task/Action/Result stories", "severity": "medium", "details": "Microsoft behavioral rounds require detailed STAR examples", "interview_stage": "behavioral round"}]
- success_factors: [{"factor": "Prepared growth mindset examples", "impact": "high", "category": "culture"}]

**APPLE (All roles - CRITICAL: Confidentiality + product focus):**
- areas_struggled: [{"area": "Product Design Thinking", "severity": "medium", "details": "Apple expects deep product sense and design thinking", "interview_stage": "product round"}]
- success_factors: [{"factor": "Studied Apple product philosophy", "impact": "high", "category": "culture"}]

**NETFLIX (All roles - CRITICAL: Culture deck alignment):**
- areas_struggled: [{"area": "Culture Fit", "severity": "high", "details": "Netflix has unique culture - must align with radical candor, context not control", "interview_stage": "culture round"}]
- success_factors: [{"factor": "Read Netflix Culture Deck", "impact": "high", "category": "culture"}]

**STARTUPS/Unknown Companies:**
- areas_struggled: [{"area": "Technical Communication", "severity": "low", "details": "Explaining solutions clearly to non-technical stakeholders", "interview_stage": "technical screen"}]
- success_factors: [{"factor": "LeetCode practice", "impact": "high", "category": "preparation"}]

**═══════════════════════════════════════════════════════════════════**
**PART 3: OUTCOME-BASED COMPREHENSIVE GENERATION**
**═══════════════════════════════════════════════════════════════════**

**SCENARIO A: outcome = "passed" AND sparse details**

GENERATE ALL OF:
- success_factors: [{"factor": "Solved 150+ LeetCode problems", "impact": "high", "category": "preparation"}, {"factor": "Mock interviews with peers", "impact": "medium", "category": "practice"}, {"factor": "Studied company culture", "impact": "high", "category": "culture"}]
- resources_used: [{"resource": "LeetCode", "type": "platform", "effectiveness": "high", "duration_weeks": 8}, {"resource": "Cracking the Coding Interview", "type": "book", "effectiveness": "high"}]
- helpful_resources: [{"resource": "System Design Primer", "type": "website", "why_helpful": "Comprehensive system design patterns"}]
- preparation_time_days: 60-90 (based on role seniority)
- practice_problem_count: 150-200
- skills_tested: INFER based on role (see PART 4)

**SCENARIO B: outcome = "failed"/"rejected" AND TECHNICAL FAILURE INDICATORS**

If post mentions: "couldn't solve", "ran out of time", "wrong algorithm", "failed coding":
- areas_struggled: [{"area": "Algorithm Problem Solving", "severity": "high", "details": "Unable to arrive at optimal solution within time limit", "interview_stage": "coding round"}, {"area": "Time Management", "severity": "high", "details": "Could not complete all questions", "interview_stage": "coding round"}]
- failed_questions: [{"question": "Unknown coding problem", "type": "algorithm", "difficulty": "hard", "reason_failed": "Time complexity not optimal", "interview_stage": "coding round"}]
- mistakes_made: [{"mistake": "Insufficient problem-solving practice", "impact": "rejection", "stage": "coding round", "lesson": "Need more LeetCode medium/hard problems"}]
- weak_areas: ["algorithm optimization", "time complexity analysis", "problem solving speed"]

**SCENARIO C: outcome = "failed"/"rejected" AND BEHAVIORAL/CULTURE FIT INDICATORS**

If post mentions: "culture fit", "behavioral round", "culture assessment", "Preferences @ Work", "Leadership Principles", "values alignment":
- areas_struggled: [{"area": "Behavioral Interview Performance", "severity": "high", "details": "STAR stories not detailed enough or didn't align with company values", "interview_stage": "behavioral round"}, {"area": "Culture Fit Assessment", "severity": "high", "details": "Responses didn't align with company culture (Leadership Principles, Move Fast, etc.)", "interview_stage": "culture round"}]
- mistakes_made: [{"mistake": "Didn't research company culture thoroughly", "impact": "rejection", "stage": "behavioral round", "lesson": "Must study company values deeply (Amazon LPs, Meta culture deck, etc.)"}, {"mistake": "Generic STAR answers without company-specific framing", "impact": "rejection", "stage": "behavioral round", "lesson": "Tailor stories to company's specific values"}]
- weak_areas: ["behavioral storytelling", "culture alignment demonstration", "company values understanding"]
- helpful_resources: [{"resource": "Company leadership principles guide", "type": "document", "why_helpful": "Understanding company-specific values"}, {"resource": "Grokking the Behavioral Interview", "type": "course", "why_helpful": "Structured STAR format"}]

**SCENARIO D: outcome = "failed"/"rejected" AND PROCESS FAILURE INDICATORS**

If post mentions: "passed all tests but rejected", "cleared OA but failed", "unprofessional interview", "ghosted", "headcount freeze":
- areas_struggled: [{"area": "Interview Process Issues", "severity": "medium", "details": "Non-performance related rejection (budget, headcount, culture fit tool, etc.)", "interview_stage": "post-assessment"}]
- mistakes_made: [{"mistake": "None - system/process issue", "impact": "rejection", "stage": "post-technical", "lesson": "Sometimes rejection is not about technical performance"}]
- interview_red_flags: ["Passed technical but rejected for non-technical reasons", "Budget/headcount issues", "Culture assessment tool rejection despite strong technical"]

**SCENARIO E: outcome = "failed"/"rejected" AND NO CLEAR INDICATORS (completely sparse)**

GENERATE based on company + role:
- areas_struggled: [{"area": "Interview Performance", "severity": "medium", "details": "Specific struggles not mentioned - likely combination of technical and behavioral gaps", "interview_stage": "overall"}]
- mistakes_made: [{"mistake": "Insufficient preparation", "impact": "rejection", "stage": "overall", "lesson": "Need more comprehensive interview prep covering technical + behavioral"}]
- weak_areas: ["interview readiness", "preparation depth"]
- helpful_resources: [{"resource": "LeetCode", "type": "platform", "why_helpful": "Technical problem-solving practice"}, {"resource": "Company interview guide", "type": "website", "why_helpful": "Understanding interview format and culture"}]
- preparation_time_days: 30 (likely insufficient)
- practice_problem_count: 50 (likely insufficient)

**═══════════════════════════════════════════════════════════════════**
**PART 4: ROLE-BASED COMPREHENSIVE SKILL INFERENCE**
**═══════════════════════════════════════════════════════════════════**

**Junior/Entry-Level SWE roles:**
- skills_tested: [{"skill": "Data Structures", "category": "Coding", "passed": outcome=="passed", "difficulty": "medium", "notes": "Arrays, strings, hashmaps"}, {"skill": "Algorithms", "category": "Coding", "passed": outcome=="passed", "difficulty": "medium", "notes": "Sorting, searching, recursion"}]
- preparation_time_days: 45-60
- practice_problem_count: 100-150

**Mid-Level SWE roles:**
- skills_tested: [{"skill": "Data Structures", "category": "Coding", "passed": outcome=="passed", "difficulty": "hard"}, {"skill": "Algorithms", "category": "Coding", "passed": outcome=="passed", "difficulty": "hard"}, {"skill": "Problem Solving", "category": "Coding", "passed": outcome=="passed", "difficulty": "hard"}]
- preparation_time_days: 60-90
- practice_problem_count: 150-200

**Senior/Staff/L5+ roles:**
- skills_tested: [{"skill": "System Design", "category": "Design", "passed": outcome=="passed", "difficulty": "hard", "notes": "Scalability, trade-offs, architecture"}, {"skill": "Algorithms", "category": "Coding", "passed": outcome=="passed", "difficulty": "hard"}, {"skill": "Leadership", "category": "Behavioral", "passed": outcome=="passed", "difficulty": "medium"}]
- preparation_time_days: 90-120
- practice_problem_count: 200+

**ML/Data Science roles:**
- skills_tested: [{"skill": "Machine Learning", "category": "ML", "passed": outcome=="passed", "difficulty": "hard"}, {"skill": "Statistics", "category": "ML", "passed": outcome=="passed", "difficulty": "medium"}, {"skill": "Coding", "category": "Coding", "passed": outcome=="passed", "difficulty": "medium"}]

**═══════════════════════════════════════════════════════════════════**
**PART 5: FIELD-SPECIFIC GENERATION RULES FOR ALL MIGRATION 27 FIELDS**
**═══════════════════════════════════════════════════════════════════**

**FOR areas_struggled:** ALWAYS generate at least 1-2 items based on:
- Company (Amazon → LPs, Meta → culture fit, Google → optimization)
- Outcome (failed → technical/behavioral/culture issues)
- Role level (senior → system design)

**FOR success_factors:** ALWAYS generate 2-3 items for passed interviews:
- Technical prep (LeetCode, books)
- Culture prep (company values study)
- Practice (mocks, projects)

**FOR resources_used:** ALWAYS generate 1-3 items:
- LeetCode (nearly universal)
- Company-specific (Amazon LP guide, Meta culture deck)
- Books (CTCI, System Design Interview)

**FOR helpful_resources:** ALWAYS generate 1-2 items with WHY_HELPFUL:
- Explain specifically why each resource helped
- Focus on actionable learning paths

**FOR mistakes_made:** ALWAYS generate for failed interviews:
- What went wrong (technical/behavioral/cultural)
- Impact on rejection
- Concrete lessons learned

**FOR weak_areas:** ALWAYS generate for failed interviews:
- Specific skill/knowledge gaps
- Areas needing improvement

**FOR preparation_time_days & practice_problem_count:**
- ALWAYS generate based on role level and outcome
- Junior: 30-60 days, 50-150 problems
- Mid: 60-90 days, 150-200 problems
- Senior: 90-120 days, 200+ problems
- Adjust down if failed (likely underprepared)

**FOR skills_tested:**
- ALWAYS generate based on role keywords
- ALL SWE roles: Data Structures + Algorithms
- Senior+: Add System Design
- Behavioral always tested at FAANG

**═══════════════════════════════════════════════════════════════════**
**JSON SCHEMA**
**═══════════════════════════════════════════════════════════════════**

Your response MUST be ONLY a single, valid JSON object.
Do NOT include conversational text, markdown, or special tokens.
Start with \`{\` and end with \`}\`.

The JSON object must contain these POST-LEVEL fields:
{
  "company": "string | null",
  "role": "string | null",
  "sentiment": "positive/negative/neutral",
  "interview_topics": ["string"],
  "interview_questions": ["string"],
  "leetcode_problems": ["string"],
  "industry": "string | null",
  "experience_level": "intern/entry/mid/senior/executive | null",
  "preparation_materials": ["string"],
  "key_insights": ["string"],
  "interview_stages": ["string"],
  "difficulty_level": "easy/medium/hard | null",
  "timeline": "string | null",
  "outcome": "passed/failed/pending/unknown | null",

  "total_rounds": number | null,
  "remote_or_onsite": "remote/onsite/hybrid | null",
  "offer_accepted": boolean | null,
  "compensation_mentioned": boolean,
  "negotiation_occurred": boolean,
  "referral_used": boolean,
  "background_check_mentioned": boolean,
  "rejection_reason": "string | null",
  "interview_format": "video/phone/in-person/take-home/mixed | null",
  "followup_actions": "string | null",

  "questions_with_details": [
    {
      "question_text": "string",
      "difficulty": "easy/medium/hard | null",
      "category": "string | null",
      "estimated_time_minutes": number | null,
      "hints_given": ["string"],
      "common_mistakes": ["string"],
      "optimal_approach": "string | null",
      "follow_up_questions": ["string"],
      "real_world_application": "string | null",
      "interviewer_focused_on": ["string"],
      "candidate_struggled_with": "string | null",
      "preparation_resources": ["string"],
      "success_rate_reported": "string | null"
    }
  ],

  "areas_struggled": [
    {
      "area": "string",
      "severity": "high/medium/low",
      "details": "string",
      "interview_stage": "string | null"
    }
  ],
  "failed_questions": [
    {
      "question": "string",
      "type": "string",
      "difficulty": "easy/medium/hard",
      "reason_failed": "string",
      "interview_stage": "string"
    }
  ],
  "mistakes_made": [
    {
      "mistake": "string",
      "impact": "rejection/warning/minor",
      "stage": "string",
      "lesson": "string | null"
    }
  ],
  "skills_tested": [
    {
      "skill": "string",
      "category": "string",
      "passed": boolean,
      "difficulty": "easy/medium/hard",
      "notes": "string | null"
    }
  ],
  "weak_areas": ["string"],
  "success_factors": [
    {
      "factor": "string",
      "impact": "high/medium/low",
      "category": "preparation/practice/experience"
    }
  ],
  "helpful_resources": ["string"],
  "preparation_time_days": number | null,
  "practice_problem_count": number | null,
  "interview_rounds": number | null,
  "interview_duration_hours": number | null,
  "interviewer_feedback": ["string"],
  "rejection_reasons": ["string"],
  "offer_details": {
    "level": "string | null",
    "tc": number | null,
    "team": "string | null",
    "location": "string | null"
  },
  "interview_date": "YYYY-MM-DD | null",
  "job_market_conditions": "string | null",
  "location": "string | null",
  "resources_used": [
    {
      "resource": "string",
      "type": "platform/book/course/website",
      "duration_weeks": number | null,
      "effectiveness": "high/medium/low",
      "cost": "string | null"
    }
  ],
  "study_approach": "self-study/bootcamp/tutor/mixed | null",
  "mock_interviews_count": number | null,
  "study_schedule": "string | null",
  "prep_to_interview_gap_days": number | null,
  "previous_interview_count": number | null,
  "improvement_areas": ["string"]
}

**EXTRACTION RULES:**

**Post-Level Fields (EXISTING - Migration 23):**
- total_rounds: Total interview rounds (e.g., "4 rounds total" → 4)
- remote_or_onsite: "remote"/"onsite"/"hybrid" based on interview location
- offer_accepted: true if candidate accepted offer, false if declined, null if no offer/unknown
- compensation_mentioned: true if salary/TC discussed anywhere in post
- negotiation_occurred: true if candidate negotiated the offer
- referral_used: true if candidate mentioned getting a referral
- background_check_mentioned: true if background check mentioned
- rejection_reason: Extract reason if rejected (e.g., "not enough system design experience")
- interview_format: Primary format - "video"/"phone"/"in-person"/"take-home"/"mixed"
- followup_actions: Actions like "sent thank you email", "asked for feedback", etc.

**Struggle/Failure Analysis Fields (NEW - Migration 27):**
- areas_struggled: Specific areas where candidate struggled (e.g., [{"area": "System Design", "severity": "high", "details": "struggled with scalability", "interview_stage": "onsite round 3"}])
- failed_questions: Questions that candidate failed with reasons
- mistakes_made: Mistakes and their impact (e.g., [{"mistake": "didn't ask clarifying questions", "impact": "rejection", "stage": "phone screen", "lesson": "always clarify requirements"}])
- skills_tested: Technical skills tested with pass/fail (e.g., [{"skill": "Binary Search Tree", "category": "Data Structures", "passed": false, "difficulty": "medium", "notes": "couldn't implement iterative inorder"}])
- weak_areas: Simple array of weak areas (e.g., ["dynamic programming", "system design"])

**Success Factors Fields (NEW - Migration 27):**
- success_factors: What contributed to success (e.g., [{"factor": "Practiced 200 LC problems", "impact": "high", "category": "preparation"}])
- helpful_resources: Simple array of helpful resources mentioned
- preparation_time_days: Number of days spent preparing (e.g., 60)
- practice_problem_count: Number of problems solved (e.g., 200)

**Interview Experience Fields (NEW - Migration 27):**
- interview_rounds: Total rounds (e.g., 5)
- interview_duration_hours: Total duration in hours (e.g., 4.5)
- interviewer_feedback: Array of feedback quotes (e.g., ["very strong on algorithms", "needs work on system design"])
- rejection_reasons: Array of rejection reasons if mentioned
- offer_details: Object with level, TC, team, location if offered

**Contextual Fields (NEW - Migration 27):**
- interview_date: Date when interview occurred (not post date) in YYYY-MM-DD format
- job_market_conditions: Market conditions mentioned (e.g., "hiring freeze", "competitive market")
- location: Office location or "remote"

**Resource Effectiveness Fields (NEW - Migration 27):**
- resources_used: Detailed resource breakdown (e.g., [{"resource": "LeetCode Premium", "type": "platform", "duration_weeks": 8, "effectiveness": "high", "cost": "$35/month"}])
- study_approach: How they studied (e.g., "self-study", "bootcamp", "tutor", "mixed")
- mock_interviews_count: Number of mocks practiced (e.g., 5)
- study_schedule: Schedule description (e.g., "2 hours/day", "weekends only")

**Outcome Correlation Fields (NEW - Migration 27):**
- prep_to_interview_gap_days: Days between end of prep and interview
- previous_interview_count: How many times interviewed at this company before
- improvement_areas: What candidate wishes they had done differently (e.g., ["more system design practice", "better time management"])

**Question-Level Fields (NEW):**
For EACH question in interview_questions, extract rich metadata in questions_with_details array:
- question_text: The actual question (MUST match one from interview_questions array)
- difficulty: "easy"/"medium"/"hard" - LLM assessment of question difficulty
- category: Question type (e.g., "coding", "system design", "behavioral", "technical knowledge")
- estimated_time_minutes: Time given to solve (e.g., "45 min for system design" → 45)
- hints_given: Array of hints interviewer provided (e.g., ["try hash map", "think about edge cases"])
- common_mistakes: Mistakes to avoid if mentioned (e.g., ["forgot to handle nulls", "didn't consider concurrency"])
- optimal_approach: Best way to solve if mentioned (e.g., "sliding window with two pointers")
- follow_up_questions: Follow-ups asked by interviewer (e.g., ["what's the time complexity?", "how would you handle millions of users?"])
- real_world_application: Real-world use case if mentioned
- interviewer_focused_on: What interviewer cared about (e.g., ["clean code", "communication", "edge cases"])
- candidate_struggled_with: What was difficult (e.g., "implementing the trie structure")
- preparation_resources: Resources mentioned for this question type (e.g., ["LeetCode", "CTCI", "System Design Primer"])
- success_rate_reported: Pass rate if mentioned (e.g., "interviewer said 30% get this right")

**IMPORTANT DISTINCTIONS:**
- "interview_topics": General categories (e.g., "problem solving", "system design", "behavioral", "coding", "resume review")
- "interview_questions": Specific, detailed questions asked (e.g., "Implement LRU cache", "Design Twitter feed", "Tell me about a time you faced a conflict")
- "leetcode_problems": ONLY extract clean LeetCode problem names for coding questions
  * ✅ GOOD: ["Two Sum", "LRU Cache", "Reverse Linked List", "Valid Parentheses", "Merge K Sorted Lists"]
  * ✅ GOOD: ["LC 146 - LRU Cache", "LC 315 - Count of Smaller Numbers After Self"]
  * ❌ BAD: ["leetcode easy", "medium question", "APIs", "this coding problem", "one of those array problems"]
  * RULES:
    - Extract ONLY if the post mentions a specific LeetCode problem name or number
    - Use the exact problem title (e.g., "Two Sum", not "two sum problem")
    - If post says "LC 146" or "LeetCode 146", try to infer the name or just use "LC 146"
    - Ignore vague descriptions like "medium array problem" or "coding round"
    - Leave EMPTY [] if no specific LeetCode problems are mentioned
- "questions_with_details": For EACH specific question, extract all available metadata. If post doesn't provide details for a field, use null or empty array [].

Extract ALL fields. For booleans, use false as default if not mentioned.

**CRITICAL REMINDERS:**
1. Apply inference rules AGGRESSIVELY - prefer inference over null
2. For passed interviews: extract success_factors from ANY positive action mentioned
3. For resources_used: extract ANY tool/platform/book mentioned
4. For preparation_time_days: use defaults if not explicitly stated
5. For practice_problem_count: infer from descriptions like "a lot" or "barely"
6. TARGET: >90% field coverage across all Migration 27 fields

Post content:
\`\`\`
${text}
\`\`\``;

  try {
    const completion = await openrouterClient.chat.completions.create({
      model: 'openai/gpt-4o-mini',  // Switched from deepseek to GPT-4o-mini for better reasoning
      models: ['openai/gpt-4o-mini', 'openai/gpt-3.5-turbo', 'deepseek/deepseek-chat'],  // Fallback cascade
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 5000  // Increased to 5000 for enhanced inference prompt + Migration 27 fields
    });

    const content = completion.choices[0].message.content;
    console.log('OpenRouter raw response:', content);

    return extractJsonFromString(content);
  } catch (error) {
    console.error('❌ [AI Service] OpenRouter API failed:', error.message);

    // Extract error details for better debugging
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    };

    console.error('❌ [AI Service] Error details:', JSON.stringify(errorDetails, null, 2));

    // Don't use mock data - throw error to allow NER fallback
    throw new Error(`LLM extraction failed: ${error.message}`);
  }
}

/**
 * Generic OpenRouter analysis function for custom prompts
 * Used by learning map generation and other AI-powered features
 */
async function analyzeWithOpenRouter(prompt, options = {}) {
  const {
    model = 'deepseek/deepseek-chat',
    max_tokens = 4000,
    temperature = 0.7
  } = options;

  try {
    const completion = await openrouterClient.chat.completions.create({
      model: model,
      models: ['deepseek/deepseek-chat', 'openai/gpt-3.5-turbo', 'anthropic/claude-3.5-sonnet'],
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: max_tokens
    });

    const content = completion.choices[0].message.content;
    console.log('OpenRouter generic analysis response received');
    return content;

  } catch (error) {
    console.error('OpenRouter generic analysis error:', error.message);
    throw new Error(`OpenRouter API call failed: ${error.message}`);
  }
}

/**
 * Analyze sentiment of interview post using OpenRouter
 * Returns structured sentiment data with category, score, reasoning, and key phrases
 */
async function analyzeSentiment(postText, options = {}) {
  const {
    model = 'anthropic/claude-3-haiku',  // Fast and cheap for sentiment
    max_tokens = 500,
    temperature = 0.3  // Lower temperature for more consistent categorization
  } = options;

  const SENTIMENT_ANALYSIS_PROMPT = `You are an expert psychologist analyzing interview experience posts. Your task is to identify the PRIMARY emotional tone and provide evidence-based reasoning.

**CONTEXT:** This is a tech industry interview post from platforms like Reddit, Blind, or Glassdoor.

**CATEGORIES (Select ONE primary sentiment):**

1. **CONFIDENT** - Candidate felt prepared, performed well, optimistic about chances
   - Indicators: "nailed it", "felt good", "think I did well", "hope I get it"

2. **ANXIOUS** - Nervous, uncertain, stressed, self-doubt about performance
   - Indicators: "not sure if", "worried", "kept second-guessing", "felt unprepared"

3. **FRUSTRATED** - Negative experience, unfair treatment, poor process quality
   - Indicators: "waste of time", "unprofessional", "disorganized", "rude"

4. **RELIEVED** - Received offer, process ended positively, burden lifted
   - Indicators: "got the offer!", "so happy", "finally over", "accepted"

5. **DISAPPOINTED** - Rejected, unmet expectations, regret, missed opportunity
   - Indicators: "didn't get it", "rejected", "wish I had", "failed"

6. **NEUTRAL** - Factual reporting, minimal emotion, objective documentation
   - Indicators: Dry tone, timeline focus, no emotional language

7. **MIXED** - Multiple strong emotions present, complex/ambivalent experience
   - Indicators: Conflicting statements, "but", positive AND negative themes

**SCORING GUIDE (1.0 to 5.0):**
- 1.0-1.9: Very weak emotion, barely perceptible
- 2.0-2.9: Moderate emotion, clearly present but controlled
- 3.0-3.9: Strong emotion, dominant theme in post
- 4.0-4.9: Very strong emotion, highly expressive language
- 5.0: Extreme emotion, overwhelming/intense expression

**RESPONSE FORMAT (JSON):**
{
  "category": "ANXIOUS",
  "score": 3.8,
  "reasoning": "2-3 sentence explanation citing specific evidence from post",
  "key_phrases": ["exact quote 1", "exact quote 2", "exact quote 3"],
  "confidence": 0.92
}

**ANALYSIS GUIDELINES:**
- Focus on PRIMARY emotion (what dominates the post?)
- Distinguish outcome from sentiment (rejected ≠ automatically negative sentiment)
- Look for intensity markers (ALL CAPS, multiple exclamation points, extreme adjectives)
- Weight emotional language over factual statements
- Consider overall tone, not just isolated phrases

**POST TEXT:**
"""
${postText}
"""

Analyze and respond with JSON only.`;

  try {
    const completion = await openrouterClient.chat.completions.create({
      model: model,
      models: ['anthropic/claude-3-haiku', 'openai/gpt-3.5-turbo', 'deepseek/deepseek-chat'],  // Fallback cascade
      messages: [
        {
          role: 'user',
          content: SENTIMENT_ANALYSIS_PROMPT
        }
      ],
      temperature: temperature,
      max_tokens: max_tokens
    });

    const content = completion.choices[0].message.content;
    console.log('[AI Service] Sentiment analysis response received');

    // Parse JSON response
    const sentiment = extractJsonFromString(content);

    // Validate response structure
    const validCategories = ['CONFIDENT', 'ANXIOUS', 'FRUSTRATED', 'RELIEVED', 'DISAPPOINTED', 'NEUTRAL', 'MIXED'];
    if (!sentiment.category || !validCategories.includes(sentiment.category)) {
      console.warn('[AI Service] Invalid sentiment category:', sentiment.category);
      sentiment.category = 'NEUTRAL';  // Fallback
    }

    if (typeof sentiment.score !== 'number' || sentiment.score < 1.0 || sentiment.score > 5.0) {
      console.warn('[AI Service] Invalid sentiment score:', sentiment.score);
      sentiment.score = 3.0;  // Fallback to neutral
    }

    if (!Array.isArray(sentiment.key_phrases)) {
      sentiment.key_phrases = [];
    }

    if (!sentiment.reasoning) {
      sentiment.reasoning = 'No reasoning provided';
    }

    if (typeof sentiment.confidence !== 'number') {
      sentiment.confidence = 0.85;  // Default confidence
    }

    console.log(`[AI Service] Sentiment: ${sentiment.category} (${sentiment.score}/5.0)`);
    return sentiment;

  } catch (error) {
    console.error('[AI Service] Sentiment analysis error:', error.message);
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
}

/**
 * Enhanced metadata extraction with Phase 1 advanced fields
 * Extracts interview performance metrics, preparation data, and interviewer signals
 */
async function extractEnhancedMetadata(postText, options = {}) {
  const {
    model = 'deepseek/deepseek-chat',
    max_tokens = 2000,
    temperature = 0.3
  } = options;

  const ENHANCED_EXTRACTION_PROMPT = `You are an expert data analyst specializing in tech interview analysis. Extract ALL available information from this interview post.

**IMPORTANT**: Only extract information that is EXPLICITLY mentioned or strongly implied in the text. Use null for missing fields.

**RESPONSE FORMAT (JSON only, no markdown):**
{
  "company": "string | null",
  "role": "string | null",
  "experience_level": "intern|entry|mid|senior|executive | null",
  "outcome": "passed|failed|pending|unknown",
  "difficulty_level": "easy|medium|hard | null",
  "timeline": "string | null",

  "interview_topics": ["string"],
  "interview_stages": ["string"],
  "preparation_materials": ["string"],
  "key_insights": ["string"],

  "years_of_experience": number | null,
  "prep_duration_weeks": number | null,
  "leetcode_problems_solved": number | null,
  "mock_interviews_count": number | null,
  "prior_interview_attempts": number | null,

  "rounds_passed": number | null,
  "total_rounds": number | null,
  "coding_difficulty": "easy|medium|hard | null",
  "system_design_difficulty": "easy|medium|hard | null",

  "positive_interviewer_signals": ["string"],
  "negative_interviewer_signals": ["string"],
  "interviewer_engagement": "engaged|neutral|disengaged | null",
  "received_hints": boolean | null,

  "base_salary": number | null,
  "total_compensation": number | null,
  "is_referral": boolean | null,
  "has_competing_offers": boolean | null
}

**EXTRACTION GUIDELINES:**

**Experience & Background:**
- years_of_experience: Extract from phrases like "3 YOE", "5 years experience", "fresh grad" (0), "mid-level" (3-5)
  - DECIMALS ALLOWED: "2.5 years" → 2.5, "3.5 YOE" → 3.5 (people often have fractional years)
- prior_interview_attempts: "second time applying", "failed Google last year" → 2 (integers only)

**Preparation Metrics:**
- prep_duration_weeks: "studied for 3 months" → 12, "2 week prep" → 2
  - DECIMALS ALLOWED: "1.5 weeks prep" → 1.5, "2.5 weeks" → 2.5
- leetcode_problems_solved: "solved 200 LC problems", "did 150 questions" (integers only)
- mock_interviews_count: "practiced with 5 people", "did 3 mock interviews" (integers only)

**Interview Performance:**
- rounds_passed/total_rounds: "passed 3 out of 4 rounds" → 3, 4
- coding_difficulty: If they mention coding was "easy", "brutal", "challenging"
- system_design_difficulty: Same for system design round

**Interviewer Signals:**
- positive_interviewer_signals: ["smiled", "took notes", "said it was good", "asked follow-ups", "discussed team", "asked start date"]
- negative_interviewer_signals: ["seemed bored", "cut me off", "no follow-ups", "rushed", "disengaged"]
- interviewer_engagement: Overall impression
- received_hints: Did interviewer provide hints/guidance?

**Compensation:**
- base_salary: Extract numbers like "$120k base", "130K salary"
- total_compensation: "TC $200k", "total comp 180K"
- has_competing_offers: Mentioned other offers?

**Other:**
- is_referral: "applied through referral", "friend referred me"

**POST TEXT:**
"""
${postText}
"""

Extract and respond with JSON only.`;

  try {
    const completion = await openrouterClient.chat.completions.create({
      model: model,
      models: ['deepseek/deepseek-chat', 'openai/gpt-3.5-turbo'],
      messages: [
        {
          role: 'user',
          content: ENHANCED_EXTRACTION_PROMPT
        }
      ],
      temperature: temperature,
      max_tokens: max_tokens
    });

    const content = completion.choices[0].message.content;
    console.log('[AI Service] Enhanced metadata extraction response received');

    // Parse JSON response
    const extracted = extractJsonFromString(content);

    console.log(`[AI Service] Enhanced extraction complete: ${Object.keys(extracted).filter(k => extracted[k] !== null).length} fields populated`);
    return extracted;

  } catch (error) {
    console.error('[AI Service] Enhanced extraction error:', error.message);
    throw new Error(`Enhanced extraction failed: ${error.message}`);
  }
}

module.exports = {
  analyzeText,
  analyzeWithOpenRouter,
  analyzeSentiment,
  extractEnhancedMetadata,
  extractJsonFromString
};