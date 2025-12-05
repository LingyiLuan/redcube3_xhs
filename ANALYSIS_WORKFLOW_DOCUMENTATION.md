# Analysis Workflow Documentation

## BATCH ANALYSIS WORKFLOW (Working ✅)

### 1. User Action
- User inputs multiple posts in Workflow Lab
- Clicks "Run Analysis" button on Analysis Node

### 2. Frontend Flow (AnalysisNode.vue)
```javascript
// Line 119-121: Check if batch mode
if (analysisMode.value === 'batch') {
  const result = await workflowStore.executeBatchAnalysis(validNodes)
}
```

### 3. API Call (workflowStore.ts → analysisService.ts)
```javascript
// workflowStore.ts line 593-598
const batchResult = await analysisService.analyzeBatch(
  posts,      // Array of {id, text}
  userId,
  true,       // analyzeConnections
  signal
)

// Calls: POST /api/content/analyze/batch
```

### 4. Backend Response Structure
```javascript
{
  batchId: "batch_1_abc123xyz",  // Deterministic hash from backend
  individual_analyses: [...],     // Array of analyzed posts
  similar_posts: [...],           // RAG-found similar posts
  pattern_analysis: {...},        // Pattern extraction data
  connections: [...],
  batchInsights: {...},
  extraction_warning: string,
  features_available: {...},
  enhanced_intelligence: {...}
}
```

### 5. Frontend Processing (AnalysisNode.vue line 134-186)
```javascript
// Extract batchId from backend response
const batchId = result.batchId  // e.g., "batch_1_abc123xyz"

// Create report object
const reportData = {
  id: `report-${batchId}`,       // e.g., "report-batch_1_abc123xyz"
  nodeId: props.id,
  workflowId: 'default-workflow',
  batchId: batchId,              // Store for cache lookupresult: {
    ...result,                   // Spread all backend data
    type: 'batch',
    pattern_analysis: result.pattern_analysis,
    individual_analyses: result.individual_analyses,
    similar_posts: result.similar_posts
  },
  timestamp: new Date(),
  isRead: false
}

// Add to reports store
reportsStore.addReport(reportData)
```

### 6. View Report Flow
- User clicks "View Report" button
- Navigates to: `/reports/:reportId` (e.g., `/reports/report-batch_1_abc123xyz`)
- ReportViewer component loads
- Extracts `batchId` from report
- If `pattern_analysis` missing → fetches from `/api/content/batch/report/${batchId}`
- Displays comprehensive batch analysis report

---

## SINGLE ANALYSIS WORKFLOW (Now Working ✅)

### Fixed Flow (Mirrors Batch Analysis Pattern)

#### 1. User Action
- User inputs single post text in Workflow Lab
- Clicks "Run Analysis" button

#### 2. Frontend Flow (AnalysisNode.vue line 192-247)
```javascript
// Line 192-194: Single analysis mode
else {
  const sourceNode = validNodes[0]
  const result = await workflowStore.analyzeNode(sourceNode.id)
}
```

#### 3. API Call (workflowStore.ts → analysisService.ts)
```javascript
// workflowStore.ts line 434-438
const result = await analysisService.analyzeSingle(
  node.data.content,
  userId,
  signal
)

// analysisService.ts line 29-55
// Calls: POST /api/content/analyze (NOT /posts/analyze-single)
```

#### 4. Backend Response Structure (FIXED ✅)
```javascript
{
  id: 361,              // analysisId from database
  createdAt: "2025-11-19T10:30:00Z",
  aiProvider: "OpenRouter",

  // ✅ NOW HAS overview field (critical for frontend detection!)
  overview: {
    company: "Google",
    role: "SWE",
    outcome: "passed",
    difficulty: null,
    interviewDate: "2025-11-19T10:30:00Z",
    stages: null
  },

  // Other sections (benchmark, skills, questions, similarExperiences)
  benchmark: {...},
  skills: {...},
  questions: null,
  similarExperiences: [...]
}
```

#### 5. Frontend Processing (AnalysisNode.vue line 207-228) ✅
```javascript
// Line 207: Check if Single Post Analysis
const isSinglePostAnalysis = result && typeof result === 'object' && 'overview' in result

// ✅ SUCCEEDS: result now has 'overview' field!
if (isSinglePostAnalysis) {
  console.log('[AnalysisNode] ✅ Detected Single Post Analysis')
  console.log('[AnalysisNode] Analysis ID from backend:', result.id)

  const analysisId = result.id  // 361

  if (analysisId) {
    // Store analysis in localStorage (MIRRORS BATCH PATTERN!)
    localStorage.setItem(`single-analysis-${analysisId}`, JSON.stringify(result))

    console.log('[AnalysisNode] 💾 Stored analysis data for ID:', analysisId)
    console.log('[AnalysisNode] 🚀 Navigating to /analyze/' + analysisId)

    // Navigate to Single Post Analysis viewer
    window.location.href = `/analyze/${analysisId}`
  }
}
```

#### 6. View Report Flow (FIXED ✅)
- User automatically navigated to: `/analyze/361`
- SinglePostAnalysisViewer loads
- Viewer checks `localStorage.getItem('single-analysis-361')`
- ✅ FINDS data in localStorage
- Parses and displays the comprehensive Single Post Analysis
- Cleans up localStorage after retrieval
- No API call needed (data already fetched once!)
- Displays all conditional sections: Overview, Benchmark, Skills, Questions, Similar Experiences

---

## IMPLEMENTATION SUMMARY ✅

### What Was Fixed

**Problem:** Single post analyses were failing because:
1. Backend `/analyze` endpoint returned plain analysis data without `overview` field
2. Frontend couldn't detect it was a Single Post Analysis
3. Data wasn't being stored for the viewer to retrieve
4. Viewer tried to make API call with wrong ID type

**Solution:** Made single analysis mirror batch analysis pattern exactly

### Backend Changes (analysisController.js)
✅ Modified `/analyze` endpoint to return Single Post Analysis format with `overview` field
✅ Includes all conditional sections: benchmark, skills, questions, similarExperiences
✅ Uses RAG analysis data when available

### Frontend Changes

**AnalysisNode.vue (lines 207-228):**
✅ Detection works: checks for `overview` field in result
✅ Stores analysis data in localStorage before navigation
✅ Navigates to `/analyze/:analysisId` route
✅ Mirrors batch pattern: data fetched once, stored, then displayed

**SinglePostAnalysisViewer.vue (lines 87-124):**
✅ First checks localStorage for cached analysis data
✅ Parses and displays if found (no API call needed!)
✅ Fallback: API call to `/posts/analyze-single` for existing scraped posts
✅ Cleans up localStorage after retrieval

**Vue Router (index.ts):**
✅ Route `/analyze/:postId` configured with dynamic parameter
✅ Loads SinglePostAnalysisViewer component

### Key Architectural Pattern

Both batch and single analyses now follow the same pattern:

**Batch Analysis:**
1. Backend returns data with `batchId`
2. Frontend stores in reports store
3. Navigates to `/reports/:reportId`
4. ReportViewer displays stored data

**Single Analysis:**
1. Backend returns data with `id` and `overview` field
2. Frontend stores in localStorage
3. Navigates to `/analyze/:analysisId`
4. SinglePostAnalysisViewer displays stored data

**Why This Works:**
- Data fetched once from backend
- Stored immediately (reports store or localStorage)
- Viewer just displays pre-fetched data
- No 404 errors from mismatched IDs
- Clean separation between analysis types
