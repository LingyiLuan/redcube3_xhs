# NER Fallback Implementation - Testing Status

## 🏗️ Current Status

**Implementation:** ✅ Complete
**Docker Rebuild:** 🔄 In Progress
**Testing:** ⏳ Pending (awaiting rebuild)

---

## 📋 Testing Plan

### Test Scenario 1: Normal Mode (LLM Works)
**Objective:** Verify full features when OpenRouter API is working

**Expected Behavior:**
- ✅ LLM extraction succeeds
- ✅ `extraction_method: 'llm'`
- ✅ `extraction_warning: null`
- ✅ All features available:
  - `interview_questions: true`
  - `skills_priority_matrix: true`
  - `topic_breakdown: true`
  - `sentiment_quality: 'contextual'`
- ✅ No warning alert shown in frontend
- ✅ All report sections visible

**Test Command:**
```bash
curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d @test-ner-fallback.json
```

---

### Test Scenario 2: Degraded Mode (LLM Fails, NER Succeeds)
**Objective:** Verify graceful fallback to NER when OpenRouter API fails

**Current State:**
- OpenRouter API returning: `403 Key limit exceeded`
- This is PERFECT for testing degraded mode!

**Expected Behavior:**
- ⚠️ LLM extraction fails with 403 error
- ✅ System falls back to NER extraction
- ✅ `extraction_method: 'ner'`
- ✅ `extraction_warning` present with:
  - `type: 'degraded_mode'`
  - `title: 'Limited Analysis Mode'`
  - `message: 'Due to API limitations, some advanced features are unavailable...'`
  - `unavailable_features: ['Interview Questions Bank', 'Skills Priority Matrix', ...]`
  - `reason: 'LLM extraction failed: 403 Key limit exceeded'`
  - `fallback_method: 'NER (Named Entity Recognition)'`
- ✅ Limited features:
  - `interview_questions: false`
  - `skills_priority_matrix: false`
  - `topic_breakdown: false`
  - `sentiment_quality: 'keyword-based'`
- ✅ NER extracts:
  - `company` from text (Google, Microsoft, Meta)
  - `role` from text (Software Engineer, Senior SDE)
  - `outcome` via keyword matching
- ✅ Frontend shows:
  - ⚠️ Yellow warning alert at top
  - ✅ Company Insights section (with NER data)
  - ✅ Similar Posts section (RAG still works)
  - ❌ Interview Questions section shows "unavailable" message
  - ❌ Skills Matrix shows "unavailable" message
  - ❌ Topic Breakdown shows "unavailable" message
  - ❌ Timeline shows "unavailable" message

**Test Data:**
```json
{
  "posts": [
    {
      "text": "Just finished my Google interview. They asked me about system design and coding problems. The role was Software Engineer.",
      "id": "test_google"
    },
    {
      "text": "Microsoft interview went well! They focused on algorithms and data structures. Position: Senior SDE.",
      "id": "test_microsoft"
    },
    {
      "text": "Meta (Facebook) interview was tough. Lots of behavioral questions and coding challenges.",
      "id": "test_meta"
    }
  ]
}
```

**NER Expected Extractions:**
- Post 1: `company: 'Google'`, `role: 'Software Engineer'`
- Post 2: `company: 'Microsoft'`, `role: 'Senior SDE'` (or normalized to "Software Development Engineer")
- Post 3: `company: 'Meta'` or `'Facebook'`, `role: null` (no explicit role mentioned)

---

### Test Scenario 3: Complete Failure (Both LLM and NER Fail)
**Objective:** Verify clear error message when no extraction method works

**Setup:** Would need to:
1. Break OpenRouter API (already broken - 403)
2. Break NER service (stop NER container or provide text with no company names)

**Expected Behavior:**
- ❌ LLM extraction fails
- ❌ NER extraction fails (no company found)
- ❌ HTTP 500 error returned
- ❌ Error message: `"Unable to extract interview details from your posts. Please ensure your posts mention company names and try again later."`
- ❌ No report generated
- ✅ Clear guidance to user about what went wrong

**Test Data (No Company Names):**
```json
{
  "posts": [
    {
      "text": "Just had an interview. They asked about algorithms.",
      "id": "test_no_company"
    }
  ]
}
```

---

## 🐛 Known Issues

### Issue 1: HuggingFace Embeddings API Down
**Status:** 🔴 Blocking all tests
**Error:** `410 Gone` from `https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5`
**Impact:** Cannot generate embeddings → Cannot retrieve RAG posts → Batch analysis fails
**Root Cause:** HuggingFace migrated API endpoints (Jan 2025 migration)

**Logs:**
```
[ERROR] [Embeddings] ❌ HuggingFace API returned 410 Gone
[ERROR] [Embeddings] Current endpoint: https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5
[ERROR] [Embeddings] This is a critical failure - embeddings cannot be generated
```

**Workaround Options:**
1. Switch to local embedding server (if available)
2. Use OpenAI embeddings API (when Tier 2+ available)
3. Temporarily disable RAG retrieval for testing
4. Use cached embeddings from previous runs

### Issue 2: Docker Image Not Updating
**Status:** 🟡 In Progress
**Action:** Rebuilding Docker image to include new code changes
**Command:** `docker-compose build content-service`

---

## 📊 What We've Verified So Far

### ✅ Code Changes Applied
1. **Backend Changes:**
   - [x] `aiService.js` - Mock data removed, proper error throwing
   - [x] `analysisController.js` - NER fallback logic, feature tracking

2. **Frontend Changes:**
   - [x] `DegradedModeAlert.vue` - Alert component created
   - [x] `MultiPostPatternReport.vue` - Alert integrated, sections gated
   - [x] `ReportViewer.vue` - Props passed correctly

### ⏳ Pending Verification
1. **Backend Behavior:**
   - [ ] LLM → NER fallback cascade works
   - [ ] Feature availability tracking accurate
   - [ ] Error messages clear and helpful
   - [ ] NER extraction succeeds for test data

2. **Frontend Display:**
   - [ ] Warning alert displays correctly
   - [ ] Unavailable sections show placeholder messages
   - [ ] Available sections (Company Insights, RAG) work
   - [ ] Alert can be dismissed

---

## 🔍 Actual Test Results

### Current Environment State:
- **OpenRouter API:** ❌ Failed (403 Key limit exceeded)
- **HuggingFace API:** ❌ Failed (410 Gone - endpoint deprecated)
- **NER Service:** ❓ Unknown (can't test due to embedding failure)
- **Docker Image:** 🔄 Rebuilding with new code

### Test Execution:
```bash
# Test attempt:
curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d @test-ner-fallback.json

# Result:
{
  "error": "Batch analysis failed",
  "message": "HuggingFace API 410 Gone - embedding generation failed. Check API endpoint and model availability."
}
HTTP Status: 500
```

**Analysis:**
- The analysis never reached the extraction stage
- It failed at embedding generation (STEP 3)
- This is a separate issue from LLM/NER fallback
- NER fallback logic exists but can't be tested until embeddings work

---

## 🎯 Next Steps

1. **Fix Embeddings Issue:**
   - Option A: Wait for HuggingFace router to stabilize
   - Option B: Switch to local embedding server
   - Option C: Use OpenAI embeddings (requires Tier 2+)
   - Option D: Temporarily mock embeddings for testing

2. **Complete Docker Rebuild:**
   - Wait for `docker-compose build content-service` to finish
   - Restart container: `docker-compose up -d content-service`
   - Verify new code loaded: Check logs for "Don't use mock data" removal

3. **Re-run Tests:**
   - Test Scenario 2 (Degraded Mode) - Perfect conditions with 403 error
   - Verify NER extraction works
   - Verify frontend alert displays
   - Verify section gating works

---

## 💡 Testing Recommendations

Since we have a real API failure (403 Key limit), this is actually the **perfect opportunity** to test degraded mode! Once the embedding issue is resolved and Docker rebuild completes:

1. **Don't fix the OpenRouter API key** - use the 403 error to our advantage
2. **Test degraded mode first** - this is the critical path
3. **Verify all 4 warning sections** show placeholder messages
4. **Check alert dismissal** works
5. **Verify Company Insights** still displays with NER data

This will give us high confidence that the fallback system works in production when API limits are hit.

---

## 📝 Test Checklist

- [ ] Docker rebuild complete
- [ ] New code verified in container
- [ ] Embeddings issue resolved or worked around
- [ ] Test Scenario 2 (Degraded Mode) executed
- [ ] Warning alert displays correctly
- [ ] NER extraction verified (companies: Google, Microsoft, Meta)
- [ ] Feature availability flags correct
- [ ] Section placeholders show for unavailable features
- [ ] Available sections (Company Insights) work
- [ ] Alert can be dismissed
- [ ] localStorage persists report with warning
- [ ] Re-opening report shows warning again (before dismissal)
