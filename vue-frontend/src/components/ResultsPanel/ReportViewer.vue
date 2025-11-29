<template>
  <div class="report-viewer">
    <!-- Back Button -->
    <div class="viewer-header">
      <button @click="handleBack" class="back-btn">
        <ArrowLeft :size="20" />
        <span>Back to Reports</span>
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading report...</p>
    </div>

    <div v-else-if="report" class="report-content">
      <!-- Report Header -->
      <div class="report-header">
        <div class="report-meta">
          <span class="report-type-badge" :class="reportTypeBadgeClass">
            {{ reportTypeLabel }}
          </span>
          <span class="report-date">{{ formatDate(report.timestamp) }}</span>
        </div>
      </div>

      <!-- Batch Report -->
      <div v-if="report.result?.type === 'batch'" class="batch-report">
        <!-- Multi-Post Pattern Analysis -->
        <MultiPostPatternReport
          v-if="report.result.pattern_analysis"
          :patterns="report.result.pattern_analysis"
          :individual-analyses="report.result.individual_analyses || []"
          :similar-posts="report.result.similar_posts || []"
          :extraction-warning="report.result.extraction_warning || null"
          :features-available="report.result.features_available || null"
          :enhanced-intelligence="report.result.enhanced_intelligence || null"
        />

        <!-- Fallback: Old batch report format (if pattern_analysis not available) -->
        <div v-else>
          <div class="summary-card">
            <h4 class="section-title">Batch Summary</h4>
            <p class="summary-text">{{ report.result.summary }}</p>
          </div>
        </div>
      </div>

      <!-- Single Post Analysis (New Deep Dive Format) -->
      <div v-else-if="report.result?.type === 'single'" class="single-post-analysis">
        <SinglePostAnalysisViewer
          :analysisData="report.result"
          :embedded="true"
        />
        
        <!-- Post-Analysis CTA: Encourage user to share their experience -->
        <PostAnalysisCTA 
          :sourceCount="report.result?.similarExperiences?.length || report.result?.pattern_analysis?.source_posts?.length || 0"
        />
      </div>

      <!-- Single Report (Legacy Format) -->
      <div v-else class="single-report">
        <!-- Post Analysis Report -->
        <PostAnalysisReport v-if="isPostAnalysis" :analysis="report.result" />

        <!-- Regular Analysis Report -->
        <AnalysisDetails v-else :analysis="report.result" />
      </div>

      <!-- Export Button -->
      <div class="report-actions">
        <button class="export-btn" @click="exportReport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export Report
        </button>
      </div>
    </div>

    <div v-else class="error-state">
      <p>Report not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useReportsStore } from '@/stores/reportsStore'
import { useUIStore } from '@/stores/uiStore'
import { analysisService } from '@/services/analysisService'
import AnalysisDetails from './AnalysisDetails.vue'
import PostAnalysisReport from './PostAnalysisReport.vue'
import MultiPostPatternReport from './MultiPostPatternReport.vue'
import SinglePostAnalysisViewer from './SinglePostAnalysisViewer.vue'
import PostAnalysisCTA from './sections/PostAnalysisCTA.vue'

const props = defineProps<{
  reportId: string
}>()

const reportsStore = useReportsStore()
const uiStore = useUIStore()
const loading = ref(false)
const fetchError = ref<string | null>(null)

const report = computed(() => {
  const foundReport = reportsStore.reports.find(r => r.id === props.reportId)
  if (foundReport) {
    console.log('\n' + '='.repeat(80))
    console.log('[REPORT VIEWER] 📊 Report Found')
    console.log('='.repeat(80))
    console.log('[REPORT VIEWER] Report ID:', foundReport.id)
    console.log('[REPORT VIEWER] Report batchId:', foundReport.batchId)
    console.log('[REPORT VIEWER] Has pattern_analysis?:', !!foundReport.result?.pattern_analysis)
    console.log('[REPORT VIEWER] 🔍 individual_analyses:', foundReport.result?.individual_analyses)
    console.log('[REPORT VIEWER] 🔍 individual_analyses length:', foundReport.result?.individual_analyses?.length)
    console.log('[REPORT VIEWER] 🔍 similar_posts:', foundReport.result?.similar_posts)
    console.log('[REPORT VIEWER] 🔍 similar_posts length:', foundReport.result?.similar_posts?.length)

    if (foundReport.result?.similar_posts && foundReport.result.similar_posts.length > 0) {
      console.log('[REPORT VIEWER] ✅ First similar post:', {
        post_id: foundReport.result.similar_posts[0].post_id,
        title: foundReport.result.similar_posts[0].title?.substring(0, 50),
        company: foundReport.result.similar_posts[0].company
      })
    } else {
      console.log('[REPORT VIEWER] ❌ NO SIMILAR POSTS in report.result!')
    }

    if (foundReport.result?.individual_analyses) {
      console.log('[REPORT VIEWER] Companies in individual_analyses:',
        foundReport.result.individual_analyses.map((a: any) => a.company))
    }

    // Debug: Degraded mode fields
    console.log('[REPORT VIEWER] 🚨 Degraded Mode Check:')
    console.log('[REPORT VIEWER]   - extraction_warning:', foundReport.result?.extraction_warning)
    console.log('[REPORT VIEWER]   - features_available:', foundReport.result?.features_available)
    console.log('[REPORT VIEWER] 🎯 Enhanced Intelligence Check:')
    console.log('[REPORT VIEWER]   - enhanced_intelligence:', foundReport.result?.enhanced_intelligence)
    console.log('[REPORT VIEWER]   - has enhanced_intelligence:', !!foundReport.result?.enhanced_intelligence)
    console.log('='.repeat(80) + '\n')
  }
  return foundReport
})

// Fetch report from backend cache if not found locally
async function fetchReportFromBackend(batchId: string) {
  loading.value = true
  fetchError.value = null

  try {
    console.log('[ReportViewer] Fetching report from backend cache:', batchId)
    const cachedReport = await analysisService.getCachedBatchReport(batchId)
    console.log('[ReportViewer] Received cached report:', cachedReport)
    console.log('[ReportViewer] 🔍 Backend response analysis:')
    console.log('[ReportViewer]   - has pattern_analysis:', !!cachedReport.pattern_analysis)
    console.log('[ReportViewer]   - has enhanced_intelligence:', !!cachedReport.enhanced_intelligence)
    console.log('[ReportViewer]   - enhanced_intelligence value:', cachedReport.enhanced_intelligence)
    console.log('[ReportViewer]   - individual_analyses count:', cachedReport.individual_analyses?.length || 0)
    console.log('[ReportViewer]   - similar_posts count:', cachedReport.similar_posts?.length || 0)

    // Get existing report to preserve metadata like timestamp
    const existingReport = report.value
    const reportId = `batch-${batchId}`

    // Update the existing report or add new one with cached data
    reportsStore.addReport({
      id: reportId,
      batchId: batchId,
      result: {
        type: 'batch',
        pattern_analysis: cachedReport.pattern_analysis,
        individual_analyses: cachedReport.individual_analyses || [],
        similar_posts: cachedReport.similar_posts || [],
        extraction_warning: cachedReport.extraction_warning || null,
        features_available: cachedReport.features_available || null,
        enhanced_intelligence: cachedReport.enhanced_intelligence || null,
        cached: true
      },
      // Preserve original timestamp if exists, otherwise use current time
      timestamp: existingReport?.timestamp || new Date(),
      date: existingReport?.date || new Date().toISOString()
    })

    console.log('[ReportViewer] ✅ Report added to store from backend cache')
  } catch (error: any) {
    console.error('[ReportViewer] Failed to fetch cached report:', error)
    fetchError.value = error.response?.data?.message || 'Failed to load cached report'
  } finally {
    loading.value = false
  }
}

// Extract batchId from reportId (handles "batch-{id}" and "report-{id}" formats)
function extractBatchId(reportId: string): string {
  console.log('[ReportViewer] extractBatchId called with:', reportId)

  if (reportId.startsWith('batch-')) {
    const extracted = reportId.substring(6)
    console.log('[ReportViewer] → Extracted from "batch-" prefix:', extracted)
    return extracted
  }

  if (reportId.startsWith('report-')) {
    // For "report-{analysisId}" format, we need to look up the batchId from the report
    console.log('[ReportViewer] → Looking up batchId for report-XXX format in store...')
    console.log('[ReportViewer] → Store has', reportsStore.reports.length, 'reports')

    const report = reportsStore.reports.find(r => r.id === reportId)
    console.log('[ReportViewer] → Found report?', !!report)

    if (report) {
      console.log('[ReportViewer] → Report.batchId:', report.batchId)
      console.log('[ReportViewer] → Report.analysisId:', report.analysisId)
      console.log('[ReportViewer] → Full report object:', report)

      if (report.batchId) {
        console.log('[ReportViewer] ✅ Extracted batchId from report:', reportId, '→', report.batchId)
        return report.batchId
      }
    }

    // Fallback: treat the number after "report-" as potential batchId
    const fallback = reportId.substring(7)
    console.log('[ReportViewer] ⚠️ No batchId in report, using fallback (number after "report-"):', fallback)
    return fallback
  }

  // Direct batchId (no prefix)
  console.log('[ReportViewer] → No prefix, treating as direct batchId:', reportId)
  return reportId
}

// On mounted, wait for store to initialize, then check if we need to fetch from backend
onMounted(async () => {
  console.log('[ReportViewer] ===== REPORT VIEWER MOUNTED =====')
  console.log('[ReportViewer] props.reportId:', props.reportId)
  console.log('[ReportViewer] reportsStore.isLoading:', reportsStore.isLoading)

  // CRITICAL FIX: Wait for the store to finish loading from backend
  // The store initializes with a 500ms delay, so if we check immediately after page refresh,
  // the store will be empty and we'll incorrectly show "No report found"
  if (reportsStore.isLoading) {
    console.log('[ReportViewer] ⏳ Store is loading, waiting for it to finish...')
    loading.value = true

    // Wait for store to finish loading (max 2 seconds)
    const maxWait = 2000
    const startTime = Date.now()
    while (reportsStore.isLoading && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('[ReportViewer] ✅ Store finished loading after', Date.now() - startTime, 'ms')
    loading.value = false
  }

  console.log('[ReportViewer] report.value:', report.value)
  console.log('[ReportViewer] Report batchId:', report.value?.batchId)
  console.log('[ReportViewer] Report ID:', report.value?.id)
  console.log('[ReportViewer] Report has pattern_analysis:', !!report.value?.result?.pattern_analysis)

  // Debug: Check all reports in store
  const allReports = reportsStore.reports
  console.log('[ReportViewer] 📊 All reports in store:', allReports.length)
  allReports.forEach(r => {
    console.log(`  - Report: ${r.id}, batchId: ${r.batchId}`)
  })

  // Fetch from backend if:
  // 1. Report is completely missing, OR
  // Check if this is a single post analysis (has 'type: single')
  const isSingleAnalysis = report.value?.result?.type === 'single'

  // Only fetch from backend if:
  // 1. Report doesn't exist, OR
  // 2. It's a BATCH analysis missing pattern_analysis or enhanced_intelligence
  const needsFetch = !report.value ||
                     (!isSingleAnalysis && (
                       !report.value.result?.pattern_analysis ||
                       !report.value.result?.enhanced_intelligence
                     ))

  if (needsFetch && props.reportId && !isSingleAnalysis) {
    const batchId = extractBatchId(props.reportId)
    console.log('[ReportViewer] ⚠️ Batch report data missing or incomplete, fetching from backend:', batchId)
    console.log('[ReportViewer]   - report.value exists:', !!report.value)
    console.log('[ReportViewer]   - has pattern_analysis:', !!report.value?.result?.pattern_analysis)
    console.log('[ReportViewer]   - has enhanced_intelligence:', !!report.value?.result?.enhanced_intelligence)
    await fetchReportFromBackend(batchId)
  } else if (report.value) {
    console.log('[ReportViewer] ✅ Using complete report from store')
    console.log('[ReportViewer]   - has pattern_analysis:', !!report.value.result?.pattern_analysis)
    console.log('[ReportViewer]   - has enhanced_intelligence:', !!report.value.result?.enhanced_intelligence)
    console.log('[ReportViewer]   - has extraction_warning:', !!report.value.result?.extraction_warning)
    console.log('[ReportViewer]   - has features_available:', !!report.value.result?.features_available)
  }
})

const reportTypeLabel = computed(() => {
  if (report.value?.result?.post_summary) return 'Post Analysis'
  return report.value?.result?.type === 'batch' ? 'Batch Analysis' : 'Single Analysis'
})

const reportTypeBadgeClass = computed(() => {
  return report.value?.result?.type === 'batch' ? 'badge-batch' : 'badge-single'
})

const isPostAnalysis = computed(() => {
  // Check if this is a post analysis report
  return report.value?.result?.post_summary !== undefined
})

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatConnectionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function exportReport() {
  if (!report.value) return

  const dataStr = JSON.stringify(report.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `report-${report.value.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function handleBack() {
  uiStore.showReportsList()
}
</script>

<style scoped>
.report-viewer {
  @apply h-full bg-gray-50 dark:bg-gray-900;
}

/* Viewer Header with Back Button */
.viewer-header {
  @apply p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.back-btn {
  @apply flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors;
}

.back-btn:hover {
  @apply text-blue-600 dark:text-blue-400;
}

.loading-state,
.error-state {
  @apply flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400;
}

.spinner {
  @apply w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3;
}

.report-content {
  @apply p-6 space-y-6;
}

/* Report Header */
.report-header {
  @apply pb-4 border-b border-gray-200 dark:border-gray-700;
}

.report-meta {
  @apply flex items-center gap-3;
}

.report-type-badge {
  @apply px-3 py-1 rounded-full text-xs font-semibold;
}

.badge-batch {
  @apply bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300;
}

.badge-single {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.report-date {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Section Titles */
.section-title {
  @apply text-lg font-bold text-gray-900 dark:text-gray-100 mb-4;
}

/* Summary Card */
.summary-card {
  @apply p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.summary-text {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-4;
}

.stats-grid {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply flex flex-col;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mb-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

/* Connections */
.connections-section {
  @apply space-y-3;
}

.connections-list {
  @apply space-y-3;
}

.connection-card {
  @apply p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.connection-header {
  @apply relative mb-3 pb-2;
}

.connection-strength {
  @apply absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full;
}

.strength-value {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.connection-types {
  @apply flex flex-wrap gap-2 mb-3;
}

.type-badge {
  @apply px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded;
}

.connection-insights {
  @apply text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside;
}

/* Insights */
.insights-section {
  @apply space-y-3;
}

.insights-content {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4;
}

.insights-json {
  @apply text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto;
  font-family: 'Monaco', 'Courier New', monospace;
}

/* Individual Results */
.individual-results {
  @apply space-y-3;
}

.results-list {
  @apply space-y-3;
}

.result-card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.result-header {
  @apply flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.result-title {
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.result-status {
  @apply text-xs font-medium;
}

.result-status.success {
  @apply text-green-600 dark:text-green-400;
}

.result-status.error {
  @apply text-red-600 dark:text-red-400;
}

.result-details {
  @apply p-4;
}

/* Actions */
.report-actions {
  @apply flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700;
}

.export-btn {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors;
}

/* Dev Tools */
.dev-tools {
  @apply mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg;
}

.dev-tools-header {
  @apply text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-3;
}

.dev-tools-content {
  @apply space-y-3;
}

.dev-tools-status {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.dev-tools-status strong {
  @apply font-semibold mr-2;
}

.dev-tools-buttons {
  @apply flex gap-2;
}

.dev-btn {
  @apply px-3 py-1.5 text-sm font-medium rounded transition-colors;
}

.dev-btn-enable {
  @apply bg-green-500 hover:bg-green-600 text-white;
}

.dev-btn-disable {
  @apply bg-gray-500 hover:bg-gray-600 text-white;
}

.dev-tools-note {
  @apply text-xs text-gray-600 dark:text-gray-400 italic;
}
</style>
