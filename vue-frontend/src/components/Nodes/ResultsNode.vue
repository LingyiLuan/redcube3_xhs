<script setup lang="ts">
// @ts-nocheck
import { Handle, Position } from '@vue-flow/core'
import { FileText, Eye, Download, CheckCircle } from 'lucide-vue-next'
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useReportsStore } from '@/stores/reportsStore'
import type { WorkflowNode } from '@/types/workflow'
import html2pdf from 'html2pdf.js'

interface Props {
  id: string
  data: WorkflowNode['data']
  selected?: boolean
}

const props = defineProps<Props>()
const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const reportsStore = useReportsStore()

// Parse analysis result
const analysisResult = computed(() => props.data.analysisResult)

// Count of analyzed posts
const postCount = computed(() => {
  if (!analysisResult.value) return 0

  // Check if it's an ExecutionResults object (from executeBatchAnalysis)
  if (analysisResult.value.mode === 'batch' && analysisResult.value.results) {
    return analysisResult.value.results.length
  }

  // Check if it's a direct array
  if (Array.isArray(analysisResult.value)) {
    return analysisResult.value.length
  }

  // Single analysis result
  return 1
})

// Result type (single or batch)
const resultType = computed(() => {
  if (!analysisResult.value) return 'Unknown'

  // Check ExecutionResults mode
  if (analysisResult.value.mode === 'batch') {
    return 'Batch'
  }

  return postCount.value > 1 ? 'Batch' : 'Single'
})

// Summary preview
const summaryPreview = computed(() => {
  if (!analysisResult.value) return 'No results available'

  // For ExecutionResults (batch analysis)
  if (analysisResult.value.mode === 'batch' && analysisResult.value.results?.length > 0) {
    const firstResult = analysisResult.value.results[0]
    if (firstResult.result?.summary) {
      return firstResult.result.summary.slice(0, 120) + '...'
    }
  }

  // For direct array
  if (Array.isArray(analysisResult.value) && analysisResult.value.length > 0) {
    const firstResult = analysisResult.value[0]
    if (firstResult.summary) {
      return firstResult.summary.slice(0, 120) + '...'
    }
  }

  // For single analysis
  if (analysisResult.value.summary) {
    return analysisResult.value.summary.slice(0, 120) + '...'
  }

  return 'Click to view detailed analysis'
})

// Find the report ID by matching batchId, analysisId, or generating from batchId
const reportId = computed(() => {
  const batchId = props.data.metadata?.batchId
  const analysisId = props.data.metadata?.analysisId
  const sourceAnalysisNodeId = props.data.metadata?.sourceAnalysisNode

  // Try matching by batchId first (for batch analysis)
  if (batchId) {
    const report = reportsStore.reports.find(r => r.batchId === batchId)
    if (report) {
      console.log('[ResultsNode] Matched report by batchId:', batchId, report.id)
      return report.id
    }

    // If no report in store, generate deterministic ID from batchId
    // ReportViewer will fetch from backend using this ID
    const generatedId = `batch-${batchId}`
    console.log('[ResultsNode] No report in store, generating ID from batchId:', generatedId)
    return generatedId
  }

  // Try matching by analysisId (for single analysis)
  if (analysisId) {
    const report = reportsStore.reports.find(r => r.analysisId === analysisId)
    if (report) {
      console.log('[ResultsNode] Matched report by analysisId:', analysisId, report.id)
      return report.id
    }

    // Generate ID from analysisId if not found
    const generatedId = `analysis-${analysisId}`
    console.log('[ResultsNode] No report in store, generating ID from analysisId:', generatedId)
    return generatedId
  }

  // Fallback to matching by nodeId (for backwards compatibility)
  if (sourceAnalysisNodeId) {
    const report = reportsStore.reports.find(r => r.nodeId === sourceAnalysisNodeId)
    if (report) {
      console.log('[ResultsNode] Matched report by nodeId:', sourceAnalysisNodeId, report.id)
      return report.id
    }
  }

  console.warn('[ResultsNode] No report found and no batchId/analysisId for metadata:', props.data.metadata)
  return null
})

// Handle view results - Navigate to report detail in content area
function handleViewResults(event: Event) {
  event.stopPropagation()

  if (!reportId.value) {
    uiStore.showToast('Report not found', 'error')
    return
  }

  // Navigate to report detail view in content area
  uiStore.showReportDetail(reportId.value)
  console.log('[ResultsNode] Navigating to report:', reportId.value)
}

// Handle PDF export
async function handleExportPDF(event: Event) {
  event.stopPropagation()

  try {
    // Create HTML content for the report
    const htmlContent = generateReportHTML()

    // PDF options
    const options = {
      margin: [10, 10, 10, 10],
      filename: `analysis-report-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    // Generate PDF
    await html2pdf().set(options).from(htmlContent).save()

    uiStore.showToast('PDF exported successfully', 'success')
  } catch (error) {
    console.error('[ResultsNode] Failed to export PDF:', error)
    uiStore.showToast('Failed to export PDF', 'error')
  }
}

// Generate HTML for PDF export
function generateReportHTML(): string {
  const result = analysisResult.value

  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #10b981; padding-bottom: 10px;">
        Analysis Report
      </h1>
      <p style="color: #6b7280; margin-bottom: 20px;">
        Generated: ${new Date().toLocaleString()}
      </p>
  `

  // Add type and post count
  html += `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0;"><strong>Type:</strong> ${resultType.value} Analysis</p>
      <p style="margin: 5px 0 0 0;"><strong>Posts Analyzed:</strong> ${postCount.value}</p>
    </div>
  `

  // Add summary
  if (result?.summary) {
    html += `
      <h2 style="color: #1f2937; margin-top: 30px;">Summary</h2>
      <p style="line-height: 1.6; color: #374151;">${result.summary}</p>
    `
  }

  // Add sentiment if available
  if (result?.sentiment) {
    html += `
      <h2 style="color: #1f2937; margin-top: 30px;">Sentiment Analysis</h2>
      <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">
          ${result.sentiment.overall || 'N/A'}
        </p>
      </div>
    `
  }

  // Add key themes
  if (result?.key_themes && result.key_themes.length > 0) {
    html += `
      <h2 style="color: #1f2937; margin-top: 30px;">Key Themes</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
    `
    result.key_themes.forEach((theme: string) => {
      html += `
        <span style="background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 16px; font-size: 14px;">
          ${theme}
        </span>
      `
    })
    html += `</div>`
  }

  // Add insights
  if (result?.insights && result.insights.length > 0) {
    html += `
      <h2 style="color: #1f2937; margin-top: 30px;">Key Insights</h2>
      <ul style="line-height: 1.8; color: #374151;">
    `
    result.insights.forEach((insight: string) => {
      html += `<li>${insight}</li>`
    })
    html += `</ul>`
  }

  // Add batch insights if available
  if (result?.batchInsights) {
    html += `
      <h2 style="color: #1f2937; margin-top: 30px;">Batch Analysis Insights</h2>
      <p style="line-height: 1.6; color: #374151;">${result.batchInsights}</p>
    `
  }

  html += `</div>`

  return html
}
</script>

<template>
  <div
    :class="[
      'results-node',
      {
        'ring-2 ring-green-500': selected
      }
    ]"
    role="article"
    :aria-label="`Results node with ${postCount} analysis results`"
    :aria-selected="selected"
    tabindex="0"
  >
    <!-- Target Handle (Left Side) - receives from Analysis node -->
    <Handle
      id="left"
      type="target"
      :position="Position.Left"
      class="handle handle-target"
    />
    <div class="handle-label handle-label-left">report</div>

    <!-- Source Handle (Right Side) - sends to Learning Map -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      class="handle handle-source"
    />
    <div class="handle-label handle-label-right">map</div>

    <!-- Header -->
    <div class="node-header">
      <FileText
        :size="18"
        class="text-green-600 dark:text-green-400"
      />
      <span class="node-title">Analysis Results</span>
      <CheckCircle
        :size="16"
        class="text-green-600 dark:text-green-400"
      />
    </div>

    <!-- Divider -->
    <div class="divider" />

    <!-- Meta Info -->
    <div class="meta-info">
      <p class="meta-text">
        <strong>{{ resultType }}</strong> Analysis • {{ postCount }} post{{ postCount !== 1 ? 's' : '' }}
      </p>
      <p class="timestamp">
        {{ new Date(data.createdAt || Date.now()).toLocaleString() }}
      </p>
    </div>

    <!-- Summary Preview -->
    <div class="summary-preview">
      <p>{{ summaryPreview }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button
        @click="handleViewResults"
        class="action-btn primary-btn"
        title="View detailed results"
      >
        <Eye :size="14" />
        <span>View Report</span>
      </button>

      <button
        @click="handleExportPDF"
        class="action-btn secondary-btn"
        title="Export as PDF"
      >
        <Download :size="14" />
        <span>PDF</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.results-node {
  @apply rounded-lg border-2 border-green-400 bg-green-50 dark:bg-green-900/20 p-4 shadow-md min-w-[280px] max-w-[320px] transition-all cursor-pointer bg-white dark:bg-gray-800;
  position: relative;
  overflow: visible;
}

.results-node:hover {
  @apply shadow-xl;
}

.node-header {
  @apply flex items-center gap-2 mb-2;
}

.node-title {
  @apply font-bold text-base text-gray-800 dark:text-white flex-1;
}

.divider {
  @apply border-t border-gray-300 dark:border-gray-600 mb-3;
}

.meta-info {
  @apply mb-3;
}

.meta-text {
  @apply text-sm text-gray-700 dark:text-gray-300 mb-1;
}

.timestamp {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.summary-preview {
  @apply bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-600;
}

.summary-preview p {
  @apply text-xs text-gray-600 dark:text-gray-300 line-clamp-3;
}

.action-buttons {
  @apply flex items-center gap-2;
}

.action-btn {
  @apply flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm;
  @apply transition-all duration-200;
  @apply hover:scale-105 active:scale-95;
}

.primary-btn {
  @apply flex-1 bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg;
}

.secondary-btn {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600;
}

/* Handle styling */
.handle {
  @apply !w-3 !h-3 !border-2 !border-white dark:!border-gray-800;
  position: absolute !important;
}

.handle-target {
  @apply !bg-green-500;
  left: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

/* Handle Labels */
.handle-label {
  @apply absolute text-xs font-medium bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full;
  @apply border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300;
  @apply pointer-events-none;
  z-index: 10;
}

.handle-label-left {
  left: -12px;
  top: 50%;
  transform: translate(-100%, -50%);
}

/* Ensure interactions work */
.results-node * {
  pointer-events: auto;
}
</style>
