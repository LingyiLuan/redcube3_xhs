<template>
  <div class="single-post-analysis">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Analyzing interview post...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Unable to Load Analysis</h3>
      <p>{{ error }}</p>
      <button @click="retryAnalysis" class="retry-button">Retry</button>
    </div>

    <!-- Analysis Report -->
    <div v-else-if="analysis" class="analysis-report">
      <!-- Report Header (outside report-body for full-width header) -->
      <div class="report-header">
        <h1 class="report-title">Single Post Analysis</h1>
        <p class="report-subtitle">Comprehensive insights from your interview experience</p>
      </div>

      <!-- Professional McKinsey-Style Report Body -->
      <div class="report-body">
        <!-- 0. Your Interview Experience - Seed post data only -->
        <YourInterviewExperienceV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 0.5. Performance Benchmark - How user's outcome compares -->
        <PerformanceBenchmarkV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 1. Executive Summary - Narrative overview -->
        <ExecutiveSummaryV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 2. Skill Landscape Analysis - Horizontal bar chart -->
        <SkillLandscapeAnalysisV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 3. Company Intelligence - Deep dive on company -->
        <CompanyIntelligenceV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 4. Role Intelligence - Deep dive on role -->
        <RoleIntelligenceV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 5. Topic Breakdown - Question category distribution -->
        <TopicBreakdownV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- TODO: Red Flags & Success Signals - Deferred to post-launch -->
        <!-- Will implement with LLM-based behavioral pattern extraction when we have more data -->

        <!-- 6. Interview Questions Intelligence - Interactive dashboard -->
        <InterviewQuestionsIntelligenceV1
          v-if="analysis.pattern_analysis?.interview_questions"
          :patterns="analysis.pattern_analysis"
          :intelligence="analysis.enhanced_intelligence || null"
        />

        <!-- 7. Industry Trends Analysis - Temporal trends -->
        <IndustryTrendsV1
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />

        <!-- 8. Learning Plan CTA - Navigate to learning map -->
        <LearningPlanCTA
          v-if="analysis.pattern_analysis"
          :patterns="analysis.pattern_analysis"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
// Batch-style sections - Professional McKinsey dashboard UI
import YourInterviewExperienceV1 from './sections/YourInterviewExperienceV1.vue'
import ExecutiveSummaryV1 from './sections/ExecutiveSummaryV1.vue'
import SkillLandscapeAnalysisV1 from './sections/SkillLandscapeAnalysisV1.vue'
import CompanyIntelligenceV1 from './sections/CompanyIntelligenceV1.vue'
import RoleIntelligenceV1 from './sections/RoleIntelligenceV1.vue'
import TopicBreakdownV1 from './sections/TopicBreakdownV1.vue'
import PerformanceBenchmarkV1 from './sections/PerformanceBenchmarkV1.vue'
// import RedFlagsSuccessSignalsV1 from './sections/RedFlagsSuccessSignalsV1.vue' // Deferred to post-launch
import InterviewQuestionsIntelligenceV1 from './sections/InterviewQuestionsIntelligenceV1.vue'
import IndustryTrendsV1 from './sections/IndustryTrendsV1.vue'
import LearningPlanCTA from './sections/LearningPlanCTA.vue'

interface Props {
  postId?: string // Optional - used when viewing by URL route
  analysisData?: any // Optional - used when embedded in ReportViewer
  embedded?: boolean // Flag to indicate if component is embedded
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref<string | null>(null)
const analysis = ref<any>(null)

async function fetchAnalysis() {
  loading.value = true
  error.value = null

  try {
    // If analysis data is already provided (embedded mode), use it directly
    if (props.analysisData) {
      console.log('[Single Post Analysis] ✅ Using provided analysis data (embedded mode)')
      console.log('[Single Post Analysis] 🔍 analysisData structure:', props.analysisData)
      console.log('[Single Post Analysis] 🔍 pattern_analysis:', props.analysisData.pattern_analysis)
      analysis.value = props.analysisData
      loading.value = false
      return
    }

    // First, try to retrieve from localStorage (for freshly analyzed posts)
    const localStorageKey = `single-analysis-${props.postId}`
    const cachedData = localStorage.getItem(localStorageKey)

    if (cachedData) {
      console.log('[Single Post Analysis] ✅ Found analysis in localStorage for:', props.postId)
      analysis.value = JSON.parse(cachedData)

      // Clean up localStorage after retrieval (optional - can remove this line to keep cache)
      localStorage.removeItem(localStorageKey)

      loading.value = false
      return
    }

    // Fallback: Fetch from API (for existing scraped posts from database)
    console.log('[Single Post Analysis] 📡 No cached data, fetching from API for:', props.postId)
    const response = await axios.post('/api/content/analyze-single/post', {
      post_id: props.postId
    })

    if (response.data.success) {
      analysis.value = response.data.data
    } else {
      error.value = response.data.error || 'Failed to analyze post'
    }
  } catch (err: any) {
    console.error('[Single Post Analysis] Error fetching analysis:', err)
    error.value = err.response?.data?.error || 'Network error occurred'
  } finally {
    loading.value = false
  }
}

function retryAnalysis() {
  fetchAnalysis()
}

onMounted(() => {
  fetchAnalysis()
})
</script>

<style>
/* Import McKinsey shared styles for batch-style sections */
@import '@/assets/mckinsey-report-shared.css';
</style>

<style scoped>
.single-post-analysis {
  /* Match batch report container (full-width layout) */
  position: relative;
  background-color: #ffffff;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: #6b7280;
  font-size: 0.95rem;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-container h3 {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-container p {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #2563eb;
}

/* Analysis Report */
.analysis-report {
  background-color: #ffffff;
}

/* Report Header - Full width with border */
.report-header {
  background-color: #ffffff;
  padding: 3rem 4rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.report-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.report-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 400;
}

/* Batch-style sections use .report-body class from mckinsey-report-shared.css */
/* This provides: padding: 64px 80px; max-width: 1400px; margin: 0 auto; */
</style>
