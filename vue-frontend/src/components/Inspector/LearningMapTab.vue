<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Network, Sparkles, CheckCircle2, Circle } from 'lucide-vue-next'
import AuthEmptyState from '@/components/common/AuthEmptyState.vue'
import { useLearningMapStore} from '@/stores/learningMapStore'
import { useReportsStore } from '@/stores/reportsStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

const learningMapStore = useLearningMapStore()
const reportsStore = useReportsStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const emit = defineEmits(['request-login'])

// Selection state
const selectedReportIds = ref<string[]>([])

// RAG/Embedding coverage state
const embeddingCoverage = ref<number>(0)
const isLoadingCoverage = ref(false)

// Computed properties
// Include BOTH batch reports (batchId) AND single analysis reports (analysisId)
const analysisReports = computed(() => {
  const reports = reportsStore.sortedReports.filter(r => {
    // Include batch reports (have batchId)
    if (r.batchId) return true
    
    // Include single analysis reports (have analysisId or result.id)
    if (r.analysisId) return true
    if (r.result?.id) return true
    
    return false
  })
  
  console.log('[LearningMapTab] Available reports:', {
    total: reportsStore.sortedReports.length,
    batchCount: reports.filter(r => r.batchId).length,
    singleCount: reports.filter(r => r.analysisId || r.result?.id).length,
    filtered: reports.length
  })
  
  return reports
})

const hasReports = computed(() => analysisReports.value.length > 0)

const canGenerate = computed(() => {
  return isAuthenticated.value && selectedReportIds.value.length === 1 && !learningMapStore.isGenerating
})

const isAuthenticated = computed(() => !!authStore.userId)

// RAG status indicator with actual data from backend
const ragStatus = computed(() => {
  return {
    enabled: embeddingCoverage.value > 0,
    coverage: Math.round(embeddingCoverage.value)
  }
})

// Fetch embedding coverage from backend
async function fetchEmbeddingCoverage() {
  isLoadingCoverage.value = true
  try {
    const response = await fetch('/api/content/embeddings/stats')
    if (response.ok) {
      const data = await response.json()
      console.log('[LearningMapTab] Embedding stats:', data)

      // Backend returns snake_case: total_posts, posts_with_embeddings
      const totalPosts = parseInt(data.database?.total_posts || '0')
      const postsWithEmbeddings = parseInt(data.database?.posts_with_embeddings || '0')

      if (totalPosts > 0) {
        embeddingCoverage.value = (postsWithEmbeddings / totalPosts) * 100
        console.log('[LearningMapTab] Coverage calculated:', embeddingCoverage.value.toFixed(2) + '%')
      }
    }
  } catch (error) {
    console.error('[LearningMapTab] Failed to fetch embedding coverage:', error)
    // Default to 0 on error
    embeddingCoverage.value = 0
  } finally {
    isLoadingCoverage.value = false
  }
}

onMounted(async () => {
  // Ensure auth status is checked first
  await authStore.checkAuthStatus()
  // Fetch embedding coverage on mount
  fetchEmbeddingCoverage()
})

// Actions
function toggleReportSelection(reportId: string) {
  const index = selectedReportIds.value.indexOf(reportId)

  if (index > -1) {
    selectedReportIds.value.splice(index, 1)
  } else {
    // Only allow selecting one report at a time
    selectedReportIds.value = [reportId]
  }
}

function isReportSelected(reportId: string) {
  return selectedReportIds.value.includes(reportId)
}

async function handleGenerateLearningMap() {
  if (!canGenerate.value) {
    return
  }

  try {
    const map = await learningMapStore.generateMap(selectedReportIds.value)

    // Show success message
    uiStore.showToast('Learning map generated successfully!', 'success')

    // Navigate to learning maps list view to show the new map
    uiStore.showLearningMapsList()

    // Clear selection
    selectedReportIds.value = []
  } catch (error: any) {
    console.error('[LearningMapTab] Generation failed:', error)
    uiStore.showToast(error.message || 'Failed to generate learning map', 'error')
  }
}

function formatDate(timestamp: Date | string) {
  return new Date(timestamp).toLocaleString()
}

function getReportTimestamp(report: any) {
  return (report.result && (report.result as any).created_at) ||
    (report as any).created_at ||
    report.timestamp
}

function handleLogin() {
  emit('request-login')
}

function getReportSummary(report: any) {
  // Extract from individual_analyses (user's actual analyzed posts)
  if (report.result?.individual_analyses && Array.isArray(report.result.individual_analyses)) {
    const companies = [...new Set(
      report.result.individual_analyses
        .map((analysis: any) => analysis.company)
        .filter((c: string) => c && c !== 'Unknown' && c !== 'unknown')
    )]
    const postsCount = report.result.individual_analyses.length

    if (companies.length > 0) {
      const companiesSummary = companies.length > 2
        ? `${companies.slice(0, 2).join(', ')} +${companies.length - 2}`
        : companies.join(', ')
      return `${companiesSummary} - ${postsCount} posts`
    }
  }

  // Fallback
  return `Batch Report - ${report.result?.foundation?.total_posts_analyzed || 0} posts`
}
</script>

<template>
  <div class="learning-map-tab">
    <template v-if="isAuthenticated">
      <!-- Header -->
      <div class="tab-header">
        <div class="header-content">
          <Network :size="20" />
          <h3 class="tab-title">Generate Learning Map</h3>
        </div>
      </div>

      <!-- RAG Status Indicator -->
      <div class="rag-status">
        <div class="status-indicator" :class="{ 'active': ragStatus.enabled }">
          <div class="status-dot"></div>
          <span class="status-label">RAG {{ ragStatus.enabled ? 'Enabled' : 'Disabled' }}</span>
        </div>
        <span class="coverage-badge">{{ ragStatus.coverage }}% Coverage</span>
      </div>

      <!-- Instructions -->
      <div class="instructions">
        <p class="instruction-text">
          Select one analysis report to generate a personalized learning map
        </p>
      </div>

      <!-- Report Selection Section -->
      <div class="reports-section">
        <!-- Empty State -->
        <div v-if="!hasReports" class="empty-state">
          <Network :size="48" class="empty-icon" />
          <h5 class="empty-title">No Reports Yet</h5>
          <p class="empty-description">
            Run an analysis first to generate a learning map
          </p>
        </div>

        <!-- Reports List with Checkboxes -->
        <div v-else class="reports-list">
          <div
            v-for="report in analysisReports"
            :key="report.id"
            class="report-checkbox-item"
            :class="{ 'selected': isReportSelected(report.id) }"
            @click="toggleReportSelection(report.id)"
          >
            <div class="checkbox-icon">
              <CheckCircle2 v-if="isReportSelected(report.id)" :size="20" class="checked" />
              <Circle v-else :size="20" class="unchecked" />
            </div>
            <div class="report-info">
              <p class="report-summary">{{ getReportSummary(report) }}</p>
              <p class="report-date">{{ formatDate(getReportTimestamp(report)) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="generate-section">
        <button
          @click="handleGenerateLearningMap"
          :disabled="!canGenerate"
          class="generate-btn"
          :class="{ 'generating': learningMapStore.isGenerating }"
        >
          <Sparkles :size="18" />
          <span v-if="learningMapStore.isGenerating">Generating...</span>
          <span v-else>Generate Learning Map</span>
        </button>

        <p v-if="selectedReportIds.length !== 1" class="help-text">
          Select exactly one report to generate a learning map
        </p>
      </div>
    </template>

    <template v-else>
      <AuthEmptyState
        :icon="Network"
        title="Sign in to access learning maps"
        description="Run analyses, save reports, and generate personalized learning maps once you log in."
      />
    </template>
  </div>
</template>

<style scoped>
.learning-map-tab {
  @apply flex flex-col h-full overflow-y-auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* Header */
.tab-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
}

.header-content {
  @apply flex items-center gap-3;
}

.tab-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

/* RAG Status Indicator */
.rag-status {
  @apply flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800;
}

.status-indicator {
  @apply flex items-center gap-2;
}

.status-dot {
  @apply w-2 h-2 rounded-full bg-gray-400;
}

.status-indicator.active .status-dot {
  @apply bg-green-500 animate-pulse;
}

.status-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.coverage-badge {
  @apply px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded;
}

/* Instructions */
.instructions {
  @apply px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700;
}

.instruction-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Reports Section */
.reports-section {
  @apply flex-1 overflow-y-auto p-4;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center p-6 text-center;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-3;
}

.empty-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100 mb-1;
}

.empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Reports List */
.reports-list {
  @apply space-y-2;
}

.report-checkbox-item {
  @apply flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all;
}

.report-checkbox-item:hover {
  @apply border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20;
}

.report-checkbox-item.selected {
  @apply border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30;
}

.checkbox-icon {
  @apply flex-shrink-0 pt-0.5;
}

.checkbox-icon .checked {
  @apply text-blue-600 dark:text-blue-400;
}

.checkbox-icon .unchecked {
  @apply text-gray-400 dark:text-gray-600;
}

.report-info {
  @apply flex-1 min-w-0;
}

.report-summary {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 truncate;
}

.report-date {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

/* Generate Section */
.generate-section {
  @apply p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
}

.generate-btn {
  @apply w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors;
}

.generate-btn:disabled {
  @apply bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed;
}

.generate-btn.generating {
  @apply bg-blue-500 cursor-wait;
}

.help-text {
  @apply mt-2 text-xs text-center text-gray-500 dark:text-gray-400;
}

.auth-empty-state {
  @apply flex flex-col items-center justify-center text-center p-6 h-full gap-4 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 m-4 rounded-lg;
}

.auth-empty-state .empty-icon {
  @apply text-gray-400 dark:text-gray-600;
}

.auth-empty-state .empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.auth-empty-state .empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400 max-w-sm;
}

.login-btn {
  @apply mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors;
}
</style>
