# Pattern-Based Extraction Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Reddit Post Input                        │
│                                                               │
│  Title: "Google L4 SWE Onsite"                               │
│  Body:  "Had my Google onsite yesterday. They asked:         │
│          1. Implement LRU cache with O(1) operations          │
│          2. Design a rate limiter for API requests            │
│          3. Tell me about a time you disagreed..."           │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                 Step 1: Text Preprocessing                    │
│                                                               │
│  Remove:    URLs, code blocks, markdown links                │
│  Normalize: Whitespace, punctuation, dashes                  │
│  Fix:       Common typos (questoin → question)               │
│                                                               │
│  Output:    Clean text ready for pattern matching            │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│              Step 2: Pattern Matching (Parallel)              │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L1: Numbered Lists (confidence: 0.95)               │    │
│  │ Pattern: /(\d+)\.\s+([^\n]{10,200})/                │    │
│  │ Matches: "1. Implement LRU cache..."                 │    │
│  │          "2. Design a rate limiter..."               │    │
│  │          "3. Tell me about a time..."                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L2: Bullet Lists (confidence: 0.88)                  │    │
│  │ Pattern: /[-*•]\s+([^\n]{10,200})/                   │    │
│  │ Matches: "- First question was..."                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L3: Explicit Markers (confidence: 0.90)              │    │
│  │ Pattern: /they asked:\s*([^\n]+)/                    │    │
│  │ Matches: "They asked: how would you..."              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L4: Quoted Questions (confidence: 0.82)              │    │
│  │ Pattern: /["']([^"']{15,200})["']/                   │    │
│  │ Matches: "can you design Twitter?"                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L5: Round Markers (confidence: 0.87)                 │    │
│  │ Pattern: /Round \d+:\s*([^\n]+)/                     │    │
│  │ Matches: "Round 1: System design"                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ L6: Implicit Narrative (confidence: 0.70)            │    │
│  │ Pattern: /had to (design|implement)[^\n]{10,150}/    │    │
│  │ Matches: "I had to design a cache system"            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Extracted: 6 raw question candidates                        │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                 Step 3: Noise Filtering                       │
│                                                               │
│  Check:     Meta-questions ("Should I...", "Anyone know...")  │
│  Validate:  Length (10-300 chars)                            │
│  Remove:    Blacklist patterns ("lol", emojis)               │
│  Require:   Action words for low-confidence extractions      │
│                                                               │
│  Filtered:  6 candidates → 3 valid questions                 │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│              Step 4: Question Classification                  │
��                                                               │
│  For each question, calculate keyword scores:                │
│                                                               │
│  Q1: "Implement LRU cache with O(1) operations"              │
│      → coding: 4.0 (implement + algorithm keywords)          │
│      → system_design: 0                                      │
│      → behavioral: 0                                         │
│      → Type: CODING                                          │
│                                                               │
│  Q2: "Design a rate limiter for API requests"                │
│      → coding: 0                                             │
│      → system_design: 4.0 (design + rate limiter)            │
│      → behavioral: 0                                         │
│      → Type: SYSTEM_DESIGN                                   │
│                                                               │
│  Q3: "Tell me about a time you disagreed"                    │
│      → coding: 0                                             │
│      → system_design: 0                                      │
│      → behavioral: 4.0 (tell me about + disagreed)           │
│      → Type: BEHAVIORAL                                      │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                 Step 5: Deduplication                         │
│                                                               │
│  Calculate Jaccard similarity for all pairs:                 │
│                                                               │
│  similarity(Q1, Q2) = |Q1 ∩ Q2| / |Q1 ∪ Q2|                  │
│                                                               │
│  If similarity > 0.85 → Keep higher confidence version       │
│                                                               │
│  All pairs < 0.85 → Keep all 3 questions                     │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│              Step 6: Quality Scoring & Sorting                │
│                                                               │
│  Q1: confidence 0.95 + bonuses 0.08 = 1.00 (capped)         │
│  Q2: confidence 0.95 + bonuses 0.08 = 1.00 (capped)         │
│  Q3: confidence 0.95 + bonuses 0.08 = 1.00 (capped)         │
│                                                               │
│  Sort by confidence (descending)                             │
│  Limit to maxQuestions (default: 20)                         │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                     Final Output                              │
│                                                               │
│  [                                                            │
│    {                                                          │
│      text: "Implement LRU cache with O(1) operations",       │
│      type: "coding",                                         │
│      confidence: 0.95,                                       │
│      source: "numbered_list",                                │
│      metadata: {                                             │
│        extractedFrom: "body",                                │
│        position: 123,                                        │
│        length: 44,                                           │
│        wordCount: 7,                                         │
│        patternCategory: "NUMBERED_LISTS"                     │
│      }                                                        │
│    },                                                         │
│    {                                                          │
│      text: "Design a rate limiter for API requests",         │
│      type: "system_design",                                  │
│      confidence: 0.95,                                       │
│      source: "numbered_list",                                │
│      metadata: { ... }                                       │
│    },                                                         │
│    {                                                          │
│      text: "Tell me about a time you disagreed...",          │
│      type: "behavioral",                                     │
│      confidence: 0.95,                                       │
│      source: "numbered_list",                                │
│      metadata: { ... }                                       │
│    }                                                          │
│  ]                                                            │
│                                                               │
│  Total Time: 0.8ms                                           │
│  Questions Extracted: 3                                      │
│  Average Confidence: 0.95                                    │
└──────────────────────────────────────────────────────────────┘
```

## Performance Timeline

```
Time (ms)     Operation
─────────────────────────────────────────────────────────────
0.0           Start extraction
│
├── 0.1       Preprocess text (remove URLs, normalize)
│             
├── 0.3       Pattern matching (all 6 levels in parallel)
│             - L1: Numbered lists    [3 matches]
│             - L2: Bullet lists      [0 matches]
│             - L3: Explicit markers  [0 matches]
│             - L4: Quoted questions  [0 matches]
│             - L5: Round markers     [0 matches]
│             - L6: Implicit          [0 matches]
│
├── 0.5       Noise filtering (validate 3 candidates)
│             - Length check: ✅ all pass
│             - Meta-questions: ✅ all pass
│             - Blacklist: ✅ all pass
│
├── 0.6       Classification (calculate keyword scores)
│             - Q1: coding (score: 4.0)
│             - Q2: system_design (score: 4.0)
│             - Q3: behavioral (score: 4.0)
│
├── 0.7       Deduplication (check 3 pairs)
│             - No duplicates found
│
├── 0.8       Quality scoring & sorting
│             - All questions rated 0.95+
│
└── 0.8       Return results (3 questions)
              ✅ Complete in <1ms
```

## Classification Decision Tree

```
                    Question Text
                         │
                         ▼
         ┌───────────────┴───────────────┐
         │   Calculate Keyword Scores    │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
  Primary Keywords              Secondary Keywords
  (weight: 2.0)                 (weight: 0.5)
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
                 Sum All Scores
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    Coding          System            Behavioral
    Score: X        Design            Score: Z
                    Score: Y
                         │
                         ▼
              Find Maximum Score
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    Score ≥ 1.0     Score ≥ 1.0     Score < 1.0
         │               │               │
         ▼               ▼               ▼
     Return          Return          Return
     "coding"    "system_design"    "unknown"
```

## Confidence Adjustment Flow

```
Base Confidence (from pattern)
        │
        ▼
    0.95 (Numbered List)
        │
        ├──► Length Bonus
        │    ├─ 20-150 chars? → +0.05
        │    └─ < 20 chars?   → -0.10
        │
        ├──► Technical Keyword Bonus
        │    └─ +0.02 per keyword (max +0.08)
        │
        ├──► Type Classification Bonus
        │    ├─ Type != "unknown" → +0.03
        │    └─ Type == "unknown" → +0.00
        │
        └──► Source Penalty
             └─ Implicit source? → -0.05
        │
        ▼
Final Confidence (clamped 0.0-1.0)
        │
        ▼
    0.95 + 0.05 + 0.04 + 0.03 = 1.07 → 1.00 (capped)
```

## Error Handling & Graceful Degradation

```
                Input Validation
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    null/undefined  empty text   malformed
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
              Return [] (empty array)
                      │
                      ▼
              Log warning, no crash
                      
                      
              Pattern Matching
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   All fail     Some match     All match
        │             │             │
        ▼             ▼             ▼
    Return []    Return partial  Return all
    (no crash)   (degraded)      (success)
```
