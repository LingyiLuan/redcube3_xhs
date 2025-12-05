# 🚀 PRE-LAUNCH TESTING & VALIDATION PLAN

**Application**: Interview Intel Platform - Reddit Career Intelligence System
**Testing Methodology**: Based on 2025 industry standards (Google SRE, LinkedIn, Facebook, Stripe)
**Test Environment**: Production-like staging with real data
**Timeline**: Systematic testing before public launch

---

## 📋 TABLE OF CONTENTS

1. [Testing Philosophy & Strategy](#testing-philosophy--strategy)
2. [Phase 1: User Journey Testing](#phase-1-user-journey-testing)
3. [Phase 2: Data Quality Validation](#phase-2-data-quality-validation)
4. [Phase 3: Share Experiences Feature Testing](#phase-3-share-experiences-feature-testing)
5. [Phase 4: Performance & Load Testing](#phase-4-performance--load-testing)
6. [Phase 5: End-to-End Integration Testing](#phase-5-end-to-end-integration-testing)
7. [Phase 6: Analytics & Monitoring Setup](#phase-6-analytics--monitoring-setup)
8. [Phase 7: Launch Readiness Checklist](#phase-7-launch-readiness-checklist)

---

## 🎯 TESTING PHILOSOPHY & STRATEGY

### Testing Pyramid (Industry Standard)
```
           E2E (10%)
      ┌─────────────┐
      │ User Journey │
      │   Testing    │
      └─────────────┘
    ┌───────────────────┐
    │  Integration (20%) │
    │  API + Database    │
    └───────────────────┘
  ┌─────────────────────────┐
  │    Unit Tests (70%)     │
  │  Individual Functions   │
  └─────────────────────────┘
```

### Our Focus Areas
1. **User Journey Testing** - Complete workflows from landing to learning map
2. **Data Quality Validation** - AI analysis accuracy vs ground truth
3. **Performance Testing** - Response times, throughput, error rates
4. **Integration Testing** - All services working together correctly
5. **Monitoring Setup** - Observability for production

---

## 🛤️ PHASE 1: USER JOURNEY TESTING

### Methodology: LinkedIn's Risk-Based Approach
**Priority**: Critical paths that users MUST be able to complete

### Journey 1: **First-Time User Experience** (CRITICAL)
**User Persona**: New candidate preparing for Google SWE interview
**Success Criteria**: User completes journey in <5 minutes, generates useful insights

#### Test Steps:
```yaml
Journey: First-Time User - Browse to Analysis to Learning Map
User: New visitor (not logged in)
Email: test-user-001@gmail.com (your email for testing)

Steps:
  1. Landing Page Visit
     - Action: Navigate to http://localhost:5173
     - Measure: Time to First Contentful Paint (target: <1.8s)
     - Verify: All hero elements visible, CTA buttons functional
     - Screenshot: Save for visual regression testing

  2. Browse Share Experiences
     - Action: Click "Share Experiences" in nav or hero CTA
     - Measure: Page load time (target: <1s)
     - Verify:
       - Tab navigation works (Browse, Share, Trending, My Experiences)
       - Experiences list loads with pagination
       - Company/role filters work
       - View count increments when clicking experience

  3. Select Experience to Analyze
     - Action: Find Google SWE experience, click "Analyze This Experience"
     - Expected: Modal/page showing experience details with "Analyze" button
     - Measure: Modal open time (target: <300ms)
     - Verify: All experience fields display correctly

  4. Redirect to Workflow Lab
     - Action: Click "Analyze" button
     - Expected: Redirect to /workflow page with postId pre-loaded
     - Measure: Redirect time (target: <500ms)
     - Verify:
       - Workflow canvas loads
       - Analysis node appears automatically
       - "Analyze" button is ready/auto-starts

  5. Auto-Analysis Execution
     - Action: System auto-runs analysis (or user clicks "Analyze")
     - Measure: Analysis completion time (target: <30s for single post)
     - Monitor:
       - Loading indicators work
       - No error messages
       - Progress feedback to user
     - Verify:
       - API call: POST /api/content/single-post-analysis
       - Response structure matches expected schema
       - Database: analysis result saved to database

  6. View Analysis Report
     - Action: Analysis completes, report displays
     - Measure: Report render time (target: <2s)
     - Verify:
       - All sections populated (skills, questions, sentiment, trends)
       - Charts render correctly
       - Data matches source post content
       - "Generate Learning Map" button visible

  7. Generate Learning Map from Report
     - Action: Click "Generate Learning Map" button
     - Expected: Modal for learning map parameters
     - Fill in:
       - Target Role: "Software Engineer"
       - Target Company: "Google"
       - Target Level: "L4"
       - Timeline: 12 weeks
     - Measure: Form submission time
     - Verify: Form validation works

  8. Learning Map Generation
     - Action: Submit learning map request
     - Measure: Generation time (target: <90s)
     - Monitor:
       - Loading state with progress indicator
       - No timeouts or errors
     - API Call: POST /api/content/learning-map
     - Verify:
       - Response contains all sections
       - Weekly breakdown with LeetCode problems
       - Resource recommendations
       - Interview question bank

  9. Review Learning Map
     - Action: Learning map displays
     - Measure: Render time for full map (target: <3s)
     - Verify:
       - All 12 weeks populated
       - Daily study plans visible
       - LeetCode problems linked correctly
       - Skills matrix shows progression
       - Timeline milestones clear

  10. Save Learning Map (if logged in)
      - Action: Click "Save Learning Map"
      - Verify: Save functionality or prompt to login

Performance Benchmarks:
  - Total Journey Time: <180 seconds (3 minutes)
  - Zero critical errors
  - All API calls return 2xx status codes
  - No console errors in browser DevTools

Data to Log:
  - Journey completion rate
  - Drop-off points (which step users abandon)
  - Error rate per step
  - Performance timing for each step
  - User actions (clicks, scrolls, time on page)
```

---

### Journey 2: **Post Your Own Experience** (HIGH PRIORITY)
**User Persona**: User who just completed Google SWE interview
**Success Criteria**: Experience posted, saved to DB, appears in listings

#### Test Steps:
```yaml
Journey: Share Your Interview Experience
User: Authenticated user (test-user-001@gmail.com / userId: 1)

Steps:
  1. Login
     - Action: Navigate to /login
     - Enter: test-user-001@gmail.com + password
     - Verify: Successful authentication, redirect to landing page
     - Check: Auth token in cookies/localStorage

  2. Navigate to Share Experiences
     - Action: Click "Share Experiences" tab
     - Measure: Page load time
     - Verify: "Share Your Experience" tab visible (logged in users only)

  3. Click "Share Your Experience" Tab
     - Action: Switch to share tab
     - Verify: Share experience form loads
     - Check fields:
       - Company (text input + autocomplete)
       - Role (text input)
       - Interview Date (date picker)
       - Difficulty (1-5 scale)
       - Outcome (Offer/Reject/Pending/Withdrew/No Response)
       - Questions Asked (textarea or dynamic list)
       - Preparation Feedback (textarea)
       - Tips for Others (textarea)
       - Areas Struggled (textarea or tags)

  4. Fill Out Experience Form
     - Action: Fill all required fields with test data:
       Company: "Google"
       Role: "Software Engineer - L4"
       Interview Date: Today's date
       Difficulty: 4 (Hard)
       Outcome: "Offer"
       Questions Asked: [
         "Implement LRU Cache",
         "Design a rate limiter",
         "System design: Design YouTube"
       ]
       Preparation Feedback: "LeetCode helped a lot, especially medium/hard problems"
       Tips for Others: "Practice system design, know your data structures"
       Areas Struggled: ["System design scalability", "Concurrency questions"]
     - Measure: Form fill time (user experience)
     - Verify: Form validation (required fields, formats)

  5. Submit Experience
     - Action: Click "Submit Experience" button
     - Measure: Submission time (target: <2s)
     - API Call: POST /api/content/interview-intel/experiences
     - Verify:
       - HTTP 201 Created response
       - Experience ID returned
       - Success message displayed

  6. Database Verification
     - Action: Check PostgreSQL database
     - Query: SELECT * FROM interview_experiences WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1
     - Verify:
       - Record exists with correct data
       - All fields populated correctly
       - verified = false (email verification pending)
       - upvotes = 0, downvotes = 0, views = 0, citation_count = 0
       - impact_score = 0
       - created_at = current timestamp

  7. User Reputation Initialization
     - Action: Check user_reputation table
     - Query: SELECT * FROM user_reputation WHERE user_id = 1
     - Verify:
       - Record exists (created if first post)
       - total_experiences_posted incremented
       - tier = "New Contributor" (if first post)

  8. Experience Appears in Browse Tab
     - Action: Switch to "Browse Experiences" tab
     - Verify:
       - New experience appears in list
       - Filters work (company: Google, role contains "Engineer")
       - Experience displays correctly (all fields)
       - Author shown (test-user-001@gmail.com or anonymized)

  9. My Experiences Tab
     - Action: Switch to "My Experiences" tab
     - Verify:
       - New experience listed
       - Edit/Delete options available
       - Status badge (verified/pending)

  10. Analyze Posted Experience
      - Action: Click "Analyze This Experience" on newly posted experience
      - Flow: Should follow Journey 1 steps 4-9
      - Verify: Own experience can be analyzed just like scraped posts

Success Metrics:
  - Form submission success rate: 100%
  - Database write success rate: 100%
  - Experience appears in listings within 1 second
  - Zero duplicate records
  - Data integrity: All fields match form submission

Error Scenarios to Test:
  - Missing required fields
  - Invalid date format
  - Network timeout during submission
  - Database connection failure
  - Duplicate submission (clicking submit twice)
```

---

### Journey 3: **Upvote, Citation, Ranking System** (MEDIUM PRIORITY)
**Testing**: Reputation system, gamification, trending algorithm

#### Test Steps:
```yaml
Journey: Engagement & Reputation System
Users: Multiple test accounts (test-user-001, test-user-002, test-user-003)

Steps:
  1. Upvote Experience
     - User: test-user-002 (not the author)
     - Action: Click upvote button on experience by test-user-001
     - Measure: Response time (target: <200ms)
     - API Call: POST /api/content/interview-intel/experiences/:id/vote
     - Verify:
       - experience_votes table: record created (user_id=2, vote_type='upvote')
       - interview_experiences table: upvotes incremented (+1)
       - helpfulness_ratio updated
       - impact_score recalculated
       - reputation_events table: event logged
       - user_reputation table: author's points increased (+1)
       - UI updates immediately (optimistic update)

  2. Change Vote (Upvote -> Downvote)
     - User: test-user-002
     - Action: Click downvote button (was upvoted)
     - Verify:
       - experience_votes: vote_type updated to 'downvote'
       - interview_experiences: upvotes -1, downvotes +1
       - helpfulness_ratio recalculated
       - Author's reputation points adjusted

  3. Citation Tracking (Learning Map Generation)
     - User: test-user-003
     - Action: Generate learning map using test-user-001's experience
     - Flow:
       1. Analyze test-user-001's Google SWE experience
       2. Generate learning map from that analysis
       3. System creates citation link
     - Verify:
       - learning_map_citations table: record created
       - interview_experiences: citation_count incremented (+1)
       - impact_score recalculated (citation worth 10 points)
       - reputation_events: 'experience_cited' event logged
       - user_reputation: author gains +5 points, total_citations_received +1
       - trigger functions execute correctly

  4. Trending Algorithm Test
     - Setup: Create 10 experiences with varying engagement
       - Experience A: 5 upvotes, 0 citations, 100 views (created today)
       - Experience B: 2 upvotes, 3 citations, 50 views (created today)
       - Experience C: 10 upvotes, 5 citations, 200 views (created 31 days ago)
     - Action: View "Trending" tab
     - Query: SELECT * FROM v_trending_experiences LIMIT 20
     - Verify:
       - Trending algorithm prioritizes recent citations (30 days)
       - Experience B ranks higher than A (citations > upvotes)
       - Experience C doesn't appear (outside 30-day window)
       - Sort order: recent_citations DESC, impact_score DESC

  5. Leaderboard Test
     - Action: Navigate to /leaderboard page
     - Query: SELECT * FROM v_top_contributors LIMIT 100
     - Verify:
       - Top contributors ranked by total_points
       - Rank calculated correctly
       - User tiers displayed ("New Contributor", "Regular", "Veteran", "Expert", "Legend")
       - Badges shown (if any earned)
       - Stats correct: total_experiences_posted, total_citations_received, total_people_helped

  6. Tier Progression Test
     - Setup: Award points to test-user-001 to trigger tier upgrade
     - Actions:
       1. Initial: 0 points -> "New Contributor"
       2. Add 100 points -> Should upgrade to "Regular"
       3. Add 400 more points (500 total) -> "Veteran"
       4. Add 2000 more points (2500 total) -> "Expert"
       5. Add 7500 more points (10000 total) -> "Legend"
     - Method: Direct database update (for testing) or simulate organic engagement
     - Verify:
       - trigger_update_user_tier fires correctly
       - tier field updated
       - tier_updated_at timestamp updated
       - badges array includes tier badge with earned_at timestamp
       - reputation_events logged

  7. Impact Score Calculation Verification
     - Formula: impact_score = (citation_count * 10) + (upvotes * 2) + (views / 10)
     - Test Case:
       - Experience: 5 citations, 20 upvotes, 1000 views
       - Expected: (5*10) + (20*2) + (1000/10) = 50 + 40 + 100 = 190
     - Verify:
       - Database value matches calculation
       - Updates in real-time when metrics change
       - Used correctly for sorting/ranking

Performance Metrics:
  - Vote action response time: <200ms (p95)
  - Citation tracking: <500ms
  - Leaderboard query time: <1s
  - Trending query time: <1s
  - Zero race conditions in concurrent voting

Data Integrity Checks:
  - No duplicate votes (unique constraint enforced)
  - Vote counts match experience_votes records
  - Reputation points sum matches reputation_events audit log
  - Impact scores recalculate correctly
```

---

## 🔬 PHASE 2: DATA QUALITY VALIDATION

### Methodology: Baseline Testing (Stripe, OpenAI approach)
**Goal**: Verify AI analysis provides accurate, useful insights

### Test 2.1: **Ground Truth Comparison**
Compare our analysis against manual expert analysis

#### Test Setup:
```yaml
Ground Truth Test: Google SWE Analysis Accuracy
Source: Real interview experience post (user-generated or scraped)

Manual Expert Analysis (Your Analysis):
  - Action: You manually analyze a Google SWE interview experience
  - Extract:
    1. Top 10 most mentioned questions
    2. Top 10 skills required
    3. Sentiment (positive/neutral/negative)
    4. Difficulty level
    5. Common preparation strategies
    6. Areas candidates struggled with
  - Tool: Use Claude (external) to analyze the raw post
  - Save as: /tmp/ground-truth-google-swe.json

Automated System Analysis:
  - Action: Run same post through our analysis pipeline
  - API: POST /api/content/single-post-analysis
  - Save as: /tmp/system-analysis-google-swe.json

Comparison Metrics:
  1. Question Extraction Accuracy
     - Metric: Precision = (Correct Questions Extracted) / (Total Questions Extracted)
     - Metric: Recall = (Correct Questions Extracted) / (Total Actual Questions)
     - Target: Precision > 80%, Recall > 70%
     - Method: Compare top 10 questions from both analyses

  2. Skill Identification Accuracy
     - Metric: F1 Score = 2 * (Precision * Recall) / (Precision + Recall)
     - Target: F1 Score > 75%
     - Method: Compare skill lists, calculate overlap

  3. Sentiment Accuracy
     - Metric: Exact match (positive/neutral/negative)
     - Target: 90% accuracy across 10 sample posts
     - Method: Compare sentiment classifications

  4. Ranking Correlation
     - Metric: Spearman's Rank Correlation Coefficient
     - Target: ρ > 0.7 (strong correlation)
     - Method: Compare ranking of skills/questions by frequency

Automated Test Script:
```python
# /scripts/test-data-quality.py

import json
import anthropic

def analyze_with_claude(post_content):
    """
    Use external Claude to create ground truth
    """
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""
    Analyze this Google SWE interview experience and extract:
    1. List all technical questions asked (be specific)
    2. List all skills required (technical and soft skills)
    3. Overall sentiment (positive/neutral/negative)
    4. Difficulty level (1-5)
    5. Preparation strategies mentioned
    6. Areas the candidate struggled with

    Interview Experience:
    {post_content}

    Return as JSON with exact field names.
    """

    response = client.messages.create(
        model="claude-sonnet-4",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.content[0].text)

def analyze_with_system(post_id):
    """
    Use our system's analysis
    """
    response = requests.post(
        "http://localhost:8080/api/content/single-post-analysis",
        json={"postId": post_id}
    )
    return response.json()

def calculate_precision_recall(ground_truth_list, system_list):
    """
    Calculate precision and recall for lists (questions, skills)
    """
    gt_set = set([item.lower().strip() for item in ground_truth_list])
    sys_set = set([item.lower().strip() for item in system_list])

    true_positives = len(gt_set.intersection(sys_set))
    false_positives = len(sys_set - gt_set)
    false_negatives = len(gt_set - sys_set)

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    return {
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "true_positives": true_positives,
        "false_positives": false_positives,
        "false_negatives": false_negatives
    }

def run_validation_test(post_id, post_content):
    """
    Run full validation test
    """
    print(f"Testing Post ID: {post_id}")

    # Ground truth
    print("Generating ground truth with Claude...")
    ground_truth = analyze_with_claude(post_content)

    # System analysis
    print("Running system analysis...")
    system_analysis = analyze_with_system(post_id)

    # Compare
    results = {
        "post_id": post_id,
        "questions": calculate_precision_recall(
            ground_truth.get("questions", []),
            system_analysis.get("data", {}).get("questions", [])
        ),
        "skills": calculate_precision_recall(
            ground_truth.get("skills", []),
            system_analysis.get("data", {}).get("skills", [])
        ),
        "sentiment_match": ground_truth.get("sentiment") == system_analysis.get("data", {}).get("sentiment"),
        "difficulty_diff": abs(
            ground_truth.get("difficulty", 0) -
            system_analysis.get("data", {}).get("difficulty", 0)
        )
    }

    return results

# Run test on 10 sample posts
if __name__ == "__main__":
    test_posts = [
        # Add 10 diverse post IDs for testing
        {"id": 1, "content": "..."},
        # ...
    ]

    all_results = []
    for post in test_posts:
        results = run_validation_test(post["id"], post["content"])
        all_results.append(results)
        print(json.dumps(results, indent=2))

    # Calculate aggregate metrics
    avg_question_f1 = sum(r["questions"]["f1_score"] for r in all_results) / len(all_results)
    avg_skill_f1 = sum(r["skills"]["f1_score"] for r in all_results) / len(all_results)
    sentiment_accuracy = sum(1 for r in all_results if r["sentiment_match"]) / len(all_results)

    print("\n=== AGGREGATE RESULTS ===")
    print(f"Average Question F1 Score: {avg_question_f1:.2%}")
    print(f"Average Skill F1 Score: {avg_skill_f1:.2%}")
    print(f"Sentiment Accuracy: {sentiment_accuracy:.2%}")

    # Pass/Fail Criteria
    if avg_question_f1 >= 0.75 and avg_skill_f1 >= 0.75 and sentiment_accuracy >= 0.90:
        print("\n✅ DATA QUALITY VALIDATION PASSED")
    else:
        print("\n❌ DATA QUALITY VALIDATION FAILED")
```

#### Success Criteria:
- Question Extraction F1 Score: ≥75%
- Skill Identification F1 Score: ≥75%
- Sentiment Accuracy: ≥90%
- Difficulty Prediction: Within ±1 point for 80% of samples

---

### Test 2.2: **LeetCode Problem Matching Accuracy**
Verify curriculum builder selects appropriate problems

```yaml
LeetCode Matching Test:
  Input:
    - Extracted questions from Google SWE interviews
    - Example: "Implement LRU Cache"

  Expected Output:
    - LeetCode #146: LRU Cache (Medium)
    - Related problems: LFU Cache (#460), Design HashMap (#706)

  System Output:
    - Query: GET /api/content/leetcode/match?question=Implement%20LRU%20Cache
    - Response: JSON with matched problems

  Verification:
    1. Exact Match Rate: System finds exact problem (LC #146)
    2. Relevance: Related problems are actually similar
    3. Difficulty Alignment: Difficulty matches interview context
    4. Coverage: At least 1 relevant problem found for 90% of questions

  Test Cases (20 common interview questions):
    1. "Implement LRU Cache" -> LC #146 (exact)
    2. "Two Sum" -> LC #1 (exact)
    3. "Design Rate Limiter" -> LC #design problems (similar)
    4. "Longest Substring Without Repeating Characters" -> LC #3 (exact)
    5. "Merge K Sorted Lists" -> LC #23 (exact)
    6. "Binary Tree Level Order Traversal" -> LC #102 (exact)
    7. "Design Parking Lot" -> System design (no exact LC, provide similar)
    8. "Implement Trie" -> LC #208 (exact)
    9. "Word Search" -> LC #79 (exact)
    10. "Clone Graph" -> LC #133 (exact)
    # ... 10 more

  Metrics:
    - Exact Match Rate: Target ≥60%
    - Relevant Match Rate: Target ≥90%
    - No Match Rate: Target ≤10%
    - Avg Time to Match: Target <500ms
```

---

## 🎤 PHASE 3: SHARE EXPERIENCES FEATURE TESTING

### Test 3.1: **Post Creation & Database Persistence**

```bash
# Test Script: test-share-experience.sh

#!/bin/bash

echo "=== SHARE EXPERIENCE E2E TEST ==="

# Step 1: Login as test user
echo "Step 1: Authenticating..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-user-001@gmail.com",
    "password": "Test1234!"
  }' \
  -c cookies.txt \
  2>&1)

USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
echo "Logged in as User ID: $USER_ID"

# Step 2: Post new interview experience
echo "Step 2: Posting interview experience..."
POST_RESPONSE=$(curl -X POST http://localhost:8080/api/content/interview-intel/experiences \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "company": "Google",
    "role": "Software Engineer - L4",
    "interviewDate": "2025-01-15",
    "difficulty": 4,
    "outcome": "Offer",
    "questionsAsked": [
      "Implement LRU Cache (LC #146)",
      "Design a rate limiter for an API",
      "System Design: Design YouTube video streaming"
    ],
    "preparationFeedback": "LeetCode Medium/Hard problems were essential. Mock interviews helped a lot.",
    "tipsForOthers": "Practice system design daily, know your data structures cold.",
    "areasStruggled": [
      "System design scalability concepts",
      "Concurrency and threading questions"
    ]
  }' \
  2>&1)

EXPERIENCE_ID=$(echo $POST_RESPONSE | jq -r '.experience.id')
echo "Experience created with ID: $EXPERIENCE_ID"

# Step 3: Verify database record
echo "Step 3: Verifying database record..."
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT id, company, role, difficulty, outcome, citation_count, upvotes, downvotes, created_at
   FROM interview_experiences
   WHERE id = $EXPERIENCE_ID;"

# Step 4: Verify user reputation updated
echo "Step 4: Checking user reputation..."
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT user_id, total_points, tier, total_experiences_posted
   FROM user_reputation
   WHERE user_id = $USER_ID;"

# Step 5: Fetch experience from API (Browse tab simulation)
echo "Step 5: Fetching experience from API..."
GET_RESPONSE=$(curl -X GET "http://localhost:8080/api/content/interview-intel/experiences?company=Google" \
  -H "Content-Type: application/json" \
  2>&1)

echo $GET_RESPONSE | jq '.experiences[] | select(.id == '$EXPERIENCE_ID')'

# Step 6: Analyze the posted experience
echo "Step 6: Analyzing posted experience..."
ANALYSIS_RESPONSE=$(curl -X POST http://localhost:8080/api/content/single-post-analysis \
  -H "Content-Type: application/json" \
  -d "{
    \"postId\": \"ugc_$EXPERIENCE_ID\"
  }" \
  2>&1 | tee /tmp/analysis-ugc-$EXPERIENCE_ID.json)

echo "Analysis completed. Saved to /tmp/analysis-ugc-$EXPERIENCE_ID.json"

# Step 7: Generate learning map from analysis
echo "Step 7: Generating learning map..."
LEARNING_MAP_RESPONSE=$(curl -X POST http://localhost:8080/api/content/learning-map \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"analysisId\": \"analysis_ugc_$EXPERIENCE_ID\",
    \"userId\": $USER_ID,
    \"userGoals\": {
      \"targetRole\": \"Software Engineer\",
      \"targetCompany\": \"Google\",
      \"targetLevel\": \"L4\",
      \"timelineWeeks\": 12
    }
  }" \
  2>&1 | tee /tmp/learning-map-ugc-$EXPERIENCE_ID.json)

LEARNING_MAP_ID=$(echo $LEARNING_MAP_RESPONSE | jq -r '.data.id')
echo "Learning map created with ID: $LEARNING_MAP_ID"

# Step 8: Verify citation was created
echo "Step 8: Verifying citation tracking..."
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT * FROM learning_map_citations
   WHERE learning_map_id = $LEARNING_MAP_ID
   AND interview_experience_id = $EXPERIENCE_ID;"

# Step 9: Verify citation count incremented
echo "Step 9: Checking citation count..."
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT id, citation_count, impact_score
   FROM interview_experiences
   WHERE id = $EXPERIENCE_ID;"

# Step 10: Verify reputation points awarded
echo "Step 10: Verifying reputation points..."
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT user_id, event_type, points_delta, interview_experience_id, learning_map_id, created_at
   FROM reputation_events
   WHERE interview_experience_id = $EXPERIENCE_ID
   ORDER BY created_at DESC;"

echo "=== TEST COMPLETE ==="
```

### Expected Outcomes:
1. ✅ Experience created successfully (HTTP 201)
2. ✅ Database record exists with correct data
3. ✅ User reputation initialized/updated
4. ✅ Experience appears in browse listings
5. ✅ Analysis pipeline processes UGC same as scraped data
6. ✅ Learning map generation works
7. ✅ Citation tracking creates link
8. ✅ Citation count incremented
9. ✅ Reputation points awarded (+5 for citation)
10. ✅ Impact score calculated correctly

---

### Test 3.2: **Upvote/Downvote System**

```bash
# Test Script: test-voting-system.sh

#!/bin/bash

echo "=== VOTING SYSTEM TEST ==="

EXPERIENCE_ID=1  # Use existing experience ID

# User 2 upvotes
echo "User 2: Upvoting experience..."
curl -X POST http://localhost:8080/api/content/interview-intel/experiences/$EXPERIENCE_ID/vote \
  -H "Content-Type: application/json" \
  -b cookies-user2.txt \
  -d '{"voteType": "upvote"}' \
  2>&1

# Verify vote recorded
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT * FROM experience_votes WHERE interview_experience_id = $EXPERIENCE_ID AND user_id = 2;"

# Verify upvote count incremented
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT upvotes, downvotes, helpfulness_ratio, impact_score
   FROM interview_experiences WHERE id = $EXPERIENCE_ID;"

# User 3 downvotes
echo "User 3: Downvoting experience..."
curl -X POST http://localhost:8080/api/content/interview-intel/experiences/$EXPERIENCE_ID/vote \
  -H "Content-Type: application/json" \
  -b cookies-user3.txt \
  -d '{"voteType": "downvote"}' \
  2>&1

# Verify helpfulness ratio recalculated
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT upvotes, downvotes,
          ROUND(helpfulness_ratio::numeric, 2) as helpfulness_ratio,
          impact_score
   FROM interview_experiences WHERE id = $EXPERIENCE_ID;"

# User 2 changes vote (upvote -> downvote)
echo "User 2: Changing vote to downvote..."
curl -X POST http://localhost:8080/api/content/interview-intel/experiences/$EXPERIENCE_ID/vote \
  -H "Content-Type: application/json" \
  -b cookies-user2.txt \
  -d '{"voteType": "downvote"}' \
  2>&1

# Final verification
docker exec redcube3_xhs-postgres-1 psql -U postgres -d postgres -c \
  "SELECT upvotes, downvotes, helpfulness_ratio, impact_score
   FROM interview_experiences WHERE id = $EXPERIENCE_ID;"

echo "=== VOTING TEST COMPLETE ==="
```

### Expected Outcomes:
1. ✅ Upvote increments upvotes count
2. ✅ Downvote increments downvotes count
3. ✅ Helpfulness ratio calculated correctly: upvotes / (upvotes + downvotes)
4. ✅ Impact score recalculated: (citations * 10) + (upvotes * 2) + (views / 10)
5. ✅ Vote changes handled correctly (upvote -> downvote)
6. ✅ Unique constraint enforced (one vote per user per experience)
7. ✅ Reputation points awarded to author (+1 for upvote)

---

### Test 3.3: **Trending Algorithm Validation**

```sql
-- Test Script: test-trending-algorithm.sql

-- Setup: Create test experiences with known metrics
BEGIN;

-- Experience A: Recent, high upvotes, no citations
INSERT INTO interview_experiences (user_id, company, role, difficulty, outcome, upvotes, views, created_at)
VALUES (1, 'Google', 'SWE L4', 4, 'Offer', 15, 500, NOW());

-- Experience B: Recent, moderate upvotes, multiple citations
INSERT INTO interview_experiences (user_id, company, role, difficulty, outcome, upvotes, views, created_at)
VALUES (2, 'Meta', 'SWE E4', 5, 'Offer', 8, 300, NOW());

-- Create citations for Experience B (within 30 days)
INSERT INTO learning_map_citations (learning_map_id, interview_experience_id, created_at)
VALUES
  (1, (SELECT id FROM interview_experiences WHERE company = 'Meta' LIMIT 1), NOW() - INTERVAL '2 days'),
  (2, (SELECT id FROM interview_experiences WHERE company = 'Meta' LIMIT 1), NOW() - INTERVAL '5 days'),
  (3, (SELECT id FROM interview_experiences WHERE company = 'Meta' LIMIT 1), NOW() - INTERVAL '10 days');

-- Experience C: Old, high engagement (should NOT appear in trending)
INSERT INTO interview_experiences (user_id, company, role, difficulty, outcome, upvotes, views, created_at)
VALUES (3, 'Amazon', 'SDE II', 3, 'Offer', 25, 1000, NOW() - INTERVAL '35 days');

COMMIT;

-- Query trending view
SELECT
  id,
  company,
  role,
  upvotes,
  citation_count,
  impact_score,
  recent_citations,
  created_at
FROM v_trending_experiences
ORDER BY recent_citations DESC, impact_score DESC
LIMIT 20;

-- Verify: Experience B (Meta) should rank #1 due to recent citations
-- Verify: Experience A (Google) should rank #2
-- Verify: Experience C (Amazon) should NOT appear (outside 30-day window)
```

---

## ⚡ PHASE 4: PERFORMANCE & LOAD TESTING

### Test 4.1: **Response Time Benchmarks**

```yaml
Performance Test Suite:

  Test 1: Landing Page Load
    - URL: http://localhost:5173/
    - Metric: Time to First Contentful Paint (FCP)
    - Target: <1.8s (p95)
    - Tool: Lighthouse CI
    - Command: lighthouse http://localhost:5173/ --output=json --chrome-flags="--headless"

  Test 2: Single Post Analysis
    - API: POST /api/content/single-post-analysis
    - Input: Post ID with ~500 words
    - Metric: Total analysis time
    - Target: <30s (p95)
    - Breakdown:
      - NLP processing: <5s
      - LLM extraction: <20s
      - Database write: <1s
      - Response generation: <1s

  Test 3: Batch Analysis (10 posts)
    - API: POST /api/content/batch-analysis
    - Input: 10 post IDs
    - Metric: Total analysis time
    - Target: <120s (p95)
    - Parallel processing expected

  Test 4: Learning Map Generation
    - API: POST /api/content/learning-map
    - Input: Analysis ID, user goals (12 weeks)
    - Metric: Total generation time
    - Target: <90s (p95)
    - Breakdown:
      - Data aggregation: <5s
      - LLM curriculum generation: <70s
      - LeetCode matching: <10s
      - Database write: <2s

  Test 5: Database Queries
    - Query: Browse experiences (paginated)
    - Target: <500ms (p95)
    - Query: Trending experiences view
    - Target: <1s (p95)
    - Query: Leaderboard (top 100)
    - Target: <1s (p95)

  Test 6: Concurrent Users
    - Scenario: 50 concurrent users browsing
    - Tool: k6 or Apache JMeter
    - Metrics:
      - Throughput: >100 requests/second
      - Error rate: <1%
      - p95 latency: <2s
```

### Load Test Script (k6):

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
  },
};

export default function () {
  // Test 1: Browse experiences
  let browseRes = http.get('http://localhost:8080/api/content/interview-intel/experiences?page=1&limit=20');
  check(browseRes, {
    'browse status is 200': (r) => r.status === 200,
    'browse response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: View experience details
  let experienceId = JSON.parse(browseRes.body).experiences[0].id;
  let detailRes = http.get(`http://localhost:8080/api/content/interview-intel/experiences/${experienceId}`);
  check(detailRes, {
    'detail status is 200': (r) => r.status === 200,
    'detail response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(2);

  // Test 3: Analyze experience
  let analysisRes = http.post(
    'http://localhost:8080/api/content/single-post-analysis',
    JSON.stringify({ postId: `ugc_${experienceId}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(analysisRes, {
    'analysis status is 200': (r) => r.status === 200,
    'analysis response time < 30s': (r) => r.timings.duration < 30000,
  });

  sleep(5);
}
```

**Run test:**
```bash
k6 run load-test.js
```

---

### Test 4.2: **Database Performance**

```sql
-- Test Script: test-database-performance.sql

-- Enable timing
\timing on

-- Test 1: Browse experiences with filters (most common query)
EXPLAIN ANALYZE
SELECT *
FROM interview_experiences
WHERE company = 'Google'
  AND difficulty >= 3
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
-- Target: <100ms execution time, using indexes

-- Test 2: Trending experiences (complex aggregation)
EXPLAIN ANALYZE
SELECT * FROM v_trending_experiences LIMIT 20;
-- Target: <500ms execution time

-- Test 3: Leaderboard (top 100 contributors)
EXPLAIN ANALYZE
SELECT * FROM v_top_contributors LIMIT 100;
-- Target: <500ms execution time

-- Test 4: Full-text search
EXPLAIN ANALYZE
SELECT *
FROM interview_experiences
WHERE to_tsvector('english',
  COALESCE(array_to_string(questions_asked, ' '), '') || ' ' ||
  COALESCE(preparation_feedback, '')
) @@ plainto_tsquery('english', 'LeetCode system design')
  AND deleted_at IS NULL
LIMIT 20;
-- Target: <1s execution time, using GIN index

-- Test 5: Citation count aggregation
EXPLAIN ANALYZE
SELECT
  ie.id,
  ie.company,
  COUNT(lmc.id) as total_citations
FROM interview_experiences ie
LEFT JOIN learning_map_citations lmc ON ie.id = lmc.interview_experience_id
WHERE ie.deleted_at IS NULL
GROUP BY ie.id
ORDER BY total_citations DESC
LIMIT 20;
-- Target: <500ms execution time

-- Index Usage Check
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('interview_experiences', 'learning_map_citations', 'user_reputation')
ORDER BY idx_scan DESC;
-- Verify: All indexes being used (idx_scan > 0)

-- Table Size Analysis
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Performance Targets:**
- Simple queries (<3 joins): <100ms
- Complex aggregations: <500ms
- Full-text search: <1s
- All queries using appropriate indexes (verified with EXPLAIN ANALYZE)

---

## 🔗 PHASE 5: END-TO-END INTEGRATION TESTING

### Test 5.1: **Complete User Journey (Automated)**

```python
# test-e2e-complete-journey.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json

def test_complete_user_journey():
    """
    Automate complete user journey from landing to learning map
    """
    driver = webdriver.Chrome()
    wait = WebDriverWait(driver, 30)

    try:
        # Step 1: Landing page
        print("Step 1: Landing page")
        driver.get("http://localhost:5173")
        assert "Interview Intel" in driver.title

        # Measure FCP
        fcp = driver.execute_script(
            "return performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint').startTime"
        )
        print(f"  FCP: {fcp}ms")
        assert fcp < 1800, f"FCP too slow: {fcp}ms"

        # Step 2: Navigate to Share Experiences
        print("Step 2: Navigate to Share Experiences")
        share_btn = wait.until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Share Experiences"))
        )
        share_btn.click()

        # Step 3: Browse experiences
        print("Step 3: Browse experiences tab")
        time.sleep(1)  # Wait for data to load
        experiences = driver.find_elements(By.CLASS_NAME, "experience-card")
        assert len(experiences) > 0, "No experiences loaded"

        # Step 4: Select first Google SWE experience
        print("Step 4: Select Google SWE experience")
        google_experience = None
        for exp in experiences:
            if "Google" in exp.text and "Software Engineer" in exp.text:
                google_experience = exp
                break

        assert google_experience is not None, "No Google SWE experience found"

        # Click analyze button
        analyze_btn = google_experience.find_element(By.CLASS_NAME, "analyze-btn")
        experience_id = analyze_btn.get_attribute("data-experience-id")
        analyze_btn.click()

        # Step 5: Redirected to workflow lab
        print("Step 5: Verify redirect to workflow lab")
        wait.until(EC.url_contains("/workflow"))
        assert f"postId={experience_id}" in driver.current_url or experience_id in driver.page_source

        # Step 6: Analysis starts automatically
        print("Step 6: Wait for analysis to complete")
        start_time = time.time()

        # Wait for analysis complete indicator
        wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "analysis-complete")),
            timeout=60
        )

        analysis_time = time.time() - start_time
        print(f"  Analysis time: {analysis_time:.2f}s")
        assert analysis_time < 35, f"Analysis too slow: {analysis_time}s"

        # Step 7: Verify analysis report
        print("Step 7: Verify analysis report sections")
        assert driver.find_element(By.ID, "skills-section")
        assert driver.find_element(By.ID, "questions-section")
        assert driver.find_element(By.ID, "trends-section")

        # Step 8: Generate learning map
        print("Step 8: Generate learning map")
        generate_map_btn = driver.find_element(By.ID, "generate-learning-map-btn")
        generate_map_btn.click()

        # Fill learning map form
        wait.until(EC.presence_of_element_located((By.ID, "learning-map-form")))
        driver.find_element(By.ID, "target-role").send_keys("Software Engineer")
        driver.find_element(By.ID, "target-company").send_keys("Google")
        driver.find_element(By.ID, "target-level").send_keys("L4")
        driver.find_element(By.ID, "timeline-weeks").send_keys("12")

        # Submit form
        submit_btn = driver.find_element(By.ID, "submit-learning-map")
        submit_btn.click()

        # Step 9: Wait for learning map generation
        print("Step 9: Wait for learning map generation")
        start_time = time.time()

        wait.until(
            EC.presence_of_element_located((By.CLASS_NAME, "learning-map-generated")),
            timeout=120
        )

        generation_time = time.time() - start_time
        print(f"  Learning map generation time: {generation_time:.2f}s")
        assert generation_time < 95, f"Learning map generation too slow: {generation_time}s"

        # Step 10: Verify learning map sections
        print("Step 10: Verify learning map sections")
        assert driver.find_element(By.ID, "weekly-breakdown")
        assert driver.find_element(By.ID, "skills-matrix")
        assert driver.find_element(By.ID, "leetcode-problems")

        # Count weeks
        weeks = driver.find_elements(By.CLASS_NAME, "week-card")
        assert len(weeks) == 12, f"Expected 12 weeks, found {len(weeks)}"

        # Verify LeetCode problems have links
        problems = driver.find_elements(By.CLASS_NAME, "leetcode-problem")
        linked_problems = [p for p in problems if p.find_elements(By.TAG_NAME, "a")]
        assert len(linked_problems) > 0, "No LeetCode problems linked"

        print("\n✅ COMPLETE USER JOURNEY TEST PASSED")
        print(f"  Total journey time: {time.time() - start_time:.2f}s")

        # Save screenshots
        driver.save_screenshot("/tmp/test-journey-final.png")

        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        driver.save_screenshot("/tmp/test-journey-error.png")
        return False

    finally:
        driver.quit()

if __name__ == "__main__":
    success = test_complete_user_journey()
    exit(0 if success else 1)
```

**Run test:**
```bash
python test-e2e-complete-journey.py
```

---

## 📊 PHASE 6: ANALYTICS & MONITORING SETUP

### Monitoring Requirements (2025 Standards)

```yaml
Monitoring Stack:

  Application Performance Monitoring (APM):
    Recommendation: Open-source SigNoz or Grafana + Prometheus
    Alternative: Datadog (if budget allows)

    Metrics to Track:
      - Request rate (requests/second)
      - Error rate (errors/total requests)
      - Response time (p50, p95, p99)
      - Database query performance
      - Cache hit rate (if using Redis)
      - CPU/Memory usage per service
      - API endpoint performance breakdown

    Setup:
      1. Install OpenTelemetry SDK in each service
      2. Configure exporters to send to SigNoz/Prometheus
      3. Create dashboards for key metrics
      4. Set up alerts for anomalies

  Error Tracking:
    Tool: Sentry (free tier) or Rollbar
    Setup:
      1. Install Sentry SDK in backend services
      2. Install Sentry in Vue frontend (@sentry/vue)
      3. Configure error filtering (ignore 404s, etc.)
      4. Set up Slack/email alerts for critical errors

  User Analytics:
    Tool: Plausible (privacy-friendly) or Google Analytics 4
    Events to Track:
      - Page views
      - Button clicks (Analyze, Generate Map)
      - Form submissions (Share Experience)
      - Time on page
      - Scroll depth
      - Conversion funnel: Landing -> Browse -> Analyze -> Learning Map

  Custom Business Metrics:
    Database: PostgreSQL (store in separate analytics table)
    Metrics:
      - Daily active users (DAU)
      - Experiences posted per day
      - Analyses run per day
      - Learning maps generated per day
      - Average time to generate learning map
      - User retention (day 1, day 7, day 30)
      - Citation rate (% of experiences cited)
      - Upvote rate (% of experiences upvoted)
```

### Implementation:

```javascript
// services/content-service/src/middleware/monitoring.js

const opentelemetry = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');

function setupMonitoring() {
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'content-service',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    })
  );

  const provider = new NodeTracerProvider({
    resource: resource,
  });

  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  console.log('[Monitoring] OpenTelemetry initialized');
}

// Custom metrics middleware
function trackAnalyticsMetrics(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    // Log to analytics table
    try {
      await pool.query(
        `INSERT INTO analytics_events (event_type, endpoint, method, status_code, duration_ms, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        ['api_request', path, method, statusCode, duration, req.user?.id || null]
      );
    } catch (error) {
      console.error('[Analytics] Failed to log metric:', error);
    }
  });

  next();
}

module.exports = { setupMonitoring, trackAnalyticsMetrics };
```

```sql
-- Migration: analytics_events table
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  endpoint VARCHAR(500),
  method VARCHAR(10),
  status_code INTEGER,
  duration_ms INTEGER,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_endpoint ON analytics_events(endpoint, created_at DESC);
```

---

## ✅ PHASE 7: LAUNCH READINESS CHECKLIST

### Technical Checklist

```markdown
## Backend Services
- [ ] All services start successfully (`docker-compose up -d`)
- [ ] Database migrations applied (check `pg_migrations` table)
- [ ] All required environment variables set
- [ ] API endpoints return expected responses
- [ ] Error handling works (test invalid inputs)
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Authentication working (login, register, OAuth)
- [ ] Session management working
- [ ] Database connection pool configured
- [ ] Redis cache connected (if using)
- [ ] File uploads working (if applicable)
- [ ] Email service configured (SendGrid, etc.)
- [ ] Background jobs running (if using queues)

## Frontend
- [ ] Production build succeeds (`npm run build`)
- [ ] All pages load without errors
- [ ] Forms submit correctly
- [ ] Client-side validation working
- [ ] API calls have proper error handling
- [ ] Loading states implemented
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility (keyboard navigation, screen reader support)
- [ ] SEO meta tags present
- [ ] Favicon and app icons set
- [ ] Analytics tracking code integrated
- [ ] Error tracking (Sentry) integrated

## Database
- [ ] All indexes created
- [ ] Triggers functioning correctly
- [ ] Views created and performant
- [ ] Foreign key constraints working
- [ ] Unique constraints enforced
- [ ] Query performance acceptable (<1s for 95% of queries)
- [ ] Backup strategy configured
- [ ] Connection limits appropriate

## Security
- [ ] HTTPS enabled (SSL certificate)
- [ ] Authentication secure (bcrypt passwords, JWT expiry)
- [ ] Authorization checks on protected routes
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection enabled
- [ ] Secrets not in code (use environment variables)
- [ ] API rate limiting configured
- [ ] Sensitive data encrypted at rest
- [ ] Audit logging for sensitive operations

## Performance
- [ ] Landing page FCP < 1.8s
- [ ] API response times meet targets (see Phase 4)
- [ ] Database queries use indexes
- [ ] Image optimization (if using images)
- [ ] Code splitting implemented (lazy loading)
- [ ] Caching strategy in place
- [ ] CDN configured (if applicable)
- [ ] Compression enabled (gzip/brotli)

## Monitoring & Observability
- [ ] APM tool configured (SigNoz, Datadog, etc.)
- [ ] Error tracking configured (Sentry)
- [ ] Logging centralized (structured logs)
- [ ] Alerts configured (error rate, performance)
- [ ] Dashboards created (key metrics)
- [ ] Health check endpoints working
- [ ] Status page set up (if public-facing)

## Testing
- [ ] Unit tests passing (>70% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed (acceptable performance under load)
- [ ] Data quality validation passed (see Phase 2)
- [ ] User journey testing passed (see Phase 1)
- [ ] Share experience feature tested (see Phase 3)

## Documentation
- [ ] README updated with setup instructions
- [ ] API documentation complete (Swagger/Postman collection)
- [ ] Architecture diagram available
- [ ] Database schema documented
- [ ] Deployment guide written
- [ ] Runbook for common issues
- [ ] Changelog started (version 1.0.0)

## Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner (if EU users)
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)
- [ ] Acceptable use policy
- [ ] Content moderation guidelines

## Business Readiness
- [ ] Pricing decided (if applicable)
- [ ] Payment integration tested (Stripe, etc.)
- [ ] Customer support plan (email, chat, etc.)
- [ ] Marketing materials ready
- [ ] Social media accounts set up
- [ ] Launch announcement prepared
- [ ] Beta user feedback incorporated
- [ ] Roadmap for next 3 months planned
```

---

## 🎯 TESTING EXECUTION PLAN

### Week-by-Week Timeline

```markdown
## Week 1: Foundation Testing
**Days 1-2: User Journey Testing**
- Execute Journey 1 (First-Time User Experience)
- Execute Journey 2 (Post Your Own Experience)
- Execute Journey 3 (Upvote, Citation, Ranking)
- Document any failures, create bug tickets

**Days 3-4: Data Quality Validation**
- Run ground truth comparison test (10 sample posts)
- Run LeetCode matching accuracy test
- Calculate F1 scores, precision, recall
- Tune AI prompts if accuracy < 75%

**Day 5: Share Experiences Feature**
- Test post creation end-to-end
- Test voting system
- Test trending algorithm
- Verify database triggers

## Week 2: Performance & Integration
**Days 1-2: Performance Testing**
- Measure response times (all API endpoints)
- Run database performance tests
- Execute load test (k6 script)
- Identify bottlenecks, optimize

**Days 3-4: End-to-End Integration**
- Run automated E2E test (Selenium script)
- Test complete workflows (5+ journeys)
- Cross-browser testing
- Mobile responsiveness testing

**Day 5: Monitoring Setup**
- Install OpenTelemetry/SigNoz
- Configure error tracking (Sentry)
- Set up analytics (Plausible/GA4)
- Create dashboards, configure alerts

## Week 3: Polish & Launch Readiness
**Days 1-2: Bug Fixes**
- Fix all critical bugs found in Week 1-2
- Re-test affected features
- Regression testing

**Days 3-4: Launch Checklist**
- Complete technical checklist (above)
- Review documentation
- Final security audit
- Backup verification

**Day 5: Soft Launch**
- Deploy to production
- Test live environment
- Monitor dashboards
- Invite beta users (friends, family)

## Week 4: Feedback & Iteration
**Days 1-5: Beta Testing**
- Collect user feedback
- Monitor analytics (DAU, errors, performance)
- Fix critical issues immediately
- Plan next iteration
```

---

## 📈 SUCCESS METRICS (KPIs)

### Launch Day Success Criteria

```yaml
Technical Metrics:
  - Uptime: >99% (max 15 minutes downtime)
  - Error rate: <1% of requests
  - API response time (p95): <2s
  - Page load time (FCP): <1.8s
  - Zero critical bugs

User Engagement Metrics:
  - First 24 hours: ≥10 unique visitors
  - Journey completion rate: ≥50% (landing -> learning map)
  - Experiences posted: ≥3
  - Analyses run: ≥20
  - Learning maps generated: ≥10

Data Quality Metrics:
  - Question extraction F1 score: ≥75%
  - Skill identification F1 score: ≥75%
  - Sentiment accuracy: ≥90%
  - LeetCode match relevance: ≥90%

## Week 1 Post-Launch Targets

User Growth:
  - Daily active users (DAU): 20-50
  - Retention (day 1): ≥60%
  - Retention (day 7): ≥30%

Engagement:
  - Avg time on site: ≥5 minutes
  - Analyses per user: ≥2
  - Learning maps per user: ≥0.5
  - Upvotes per experience: ≥2

Technical Health:
  - Uptime: >99.5%
  - Error rate: <0.5%
  - API response time: <1.5s (p95)
  - Database query time: <500ms (p95)
```

---

## 🚨 INCIDENT RESPONSE PLAN

```markdown
## Severity Levels

### P0: Critical (Response Time: Immediate)
- Site completely down
- Data loss or corruption
- Security breach
- Payment processing failure

Actions:
1. Page on-call engineer immediately
2. Roll back to last known good version
3. Investigate root cause
4. Post-mortem within 24 hours

### P1: High (Response Time: <1 hour)
- Major feature broken (e.g., analysis not working)
- High error rate (>5%)
- Database connection failures
- Significant performance degradation

Actions:
1. Notify engineering team
2. Investigate and attempt hotfix
3. If no quick fix, roll back
4. Post-mortem within 48 hours

### P2: Medium (Response Time: <4 hours)
- Minor feature broken
- Moderate performance issues
- Non-critical errors

Actions:
1. Create bug ticket
2. Investigate during business hours
3. Fix in next deployment
4. Monitor for escalation

### P3: Low (Response Time: <1 week)
- UI glitches
- Minor bugs
- Feature requests

Actions:
1. Add to backlog
2. Prioritize in sprint planning
3. Fix when capacity available
```

---

## 📞 CONTACT & ESCALATION

```markdown
## Team Contacts
- Engineering Lead: [Your Name] - [Email] - [Phone]
- Database Admin: [DBA Contact]
- DevOps: [DevOps Contact]

## External Services
- Hosting: [Provider] - [Support Email/Phone]
- Database: [Provider] - [Support Email/Phone]
- Email Service: [Provider] - [Support Email/Phone]

## Escalation Path
1. On-call Engineer (immediate response)
2. Engineering Lead (if not resolved in 30 min)
3. CTO/Technical Advisor (if critical and not resolved in 2 hours)
```

---

## 🎓 LESSONS FROM BIG TECH

### Google SRE Principles Applied
1. **Gradual Rollout**: Start with friends/family (beta), then 10% of traffic, then 100%
2. **Feature Flags**: Use flags to enable/disable features without deployment
3. **Rollback Plan**: Always have 1-click rollback ready
4. **Monitoring First**: Set up monitoring BEFORE launch
5. **Error Budget**: Acceptable error rate (e.g., 99.9% uptime = 43 minutes downtime/month)

### LinkedIn Testing Strategy Applied
1. **Risk-Based Prioritization**: Test critical paths first
2. **No Self-Testing**: Have someone else test your code
3. **Automation**: Automate repetitive tests (E2E, load tests)
4. **SETs (Software Engineers in Test)**: Dedicated testing mindset

### Facebook Beta Testing Applied
1. **Internal Alpha**: Team members test first (week 1)
2. **Limited Beta**: 10-50 trusted users (week 2)
3. **Open Beta**: Announce publicly, gather feedback (week 3)
4. **Full Launch**: Open to all (week 4)

---

## 📝 FINAL NOTES

### Testing Best Practices
1. **Test Early, Test Often**: Don't wait until the end
2. **Automate Everything**: Manual testing doesn't scale
3. **Monitor in Production**: Testing doesn't end at launch
4. **User Feedback**: Real users find bugs you won't
5. **Continuous Improvement**: Testing is never "done"

### Common Pitfalls to Avoid
- ❌ Skipping edge case testing
- ❌ Not testing error states
- ❌ Ignoring performance testing
- ❌ No rollback plan
- ❌ Launching without monitoring
- ❌ Not having a support plan
- ❌ Forgetting mobile testing
- ❌ No load testing

### Launch Day Checklist
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Team notified and available
- [ ] Support plan in place
- [ ] Rollback plan tested
- [ ] Announcement prepared
- [ ] Social media ready
- [ ] Take a deep breath! 🚀

---

**Good luck with your launch! You've got this! 💪**
