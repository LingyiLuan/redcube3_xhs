<template>
  <div class="node-properties-tab">
    <!-- No Node Selected -->
    <div v-if="!selectedNode" class="empty-state">
      <Box :size="48" class="empty-icon" />
      <h3 class="empty-title">No Node Selected</h3>
      <p class="empty-description">
        Select a node on the canvas to view and edit its properties
      </p>
    </div>

    <!-- Node Properties (Horizontal Layout) -->
    <div v-else class="properties-horizontal">
      <!-- Row 1: Info Bar (Horizontal) -->
      <div class="info-bar">
        <!-- Label Edit -->
        <div class="info-group">
          <label class="info-label">Label</label>
          <input
            v-model="nodeLabel"
            @blur="updateLabel"
            @keyup.enter="updateLabel"
            class="label-input"
            placeholder="Node label"
          />
        </div>

        <!-- Status Badge -->
        <div class="info-group">
          <label class="info-label">Status</label>
          <span :class="['status-badge', `status-${selectedNode.data.status || 'idle'}`]">
            {{ formatStatus(selectedNode.data.status || 'idle') }}
          </span>
        </div>

        <!-- Statistics -->
        <div class="info-group stats-group">
          <label class="info-label">Statistics</label>
          <div class="stats-inline">
            <span v-if="nodeStats.created" class="stat-item">
              <Calendar :size="14" />
              {{ nodeStats.created }}
            </span>
            <span v-if="nodeStats.analyzed" class="stat-item">
              <Activity :size="14" />
              Analyzed: {{ nodeStats.analyzed }}
            </span>
            <span v-if="contentLength > 0" class="stat-item">
              <FileText :size="14" />
              {{ contentLength }} chars
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="info-group actions-group">
          <button
            v-if="selectedNode.type === 'input' && hasContent"
            @click="handleAnalyze"
            :disabled="isAnalyzing"
            class="action-btn action-btn-primary"
          >
            <Play :size="14" />
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze' }}
          </button>
          <button
            v-if="hasContent"
            @click="handleClear"
            class="action-btn action-btn-secondary"
          >
            <Trash2 :size="14" />
            Clear
          </button>
          <button
            @click="handleDelete"
            class="action-btn action-btn-danger"
          >
            <X :size="14" />
            Delete
          </button>
        </div>
      </div>

      <!-- Row 2: Content Editor (Full Width) -->
      <div class="content-editor-section">
        <div class="editor-header">
          <label class="editor-label">
            <FileText :size="16" />
            Content
          </label>
          <span v-if="hasUnsavedChanges" class="unsaved-indicator">
            ● Unsaved changes
          </span>
        </div>
        <textarea
          v-model="nodeContent"
          @input="handleContentChange"
          @blur="saveContent"
          class="content-textarea"
          :placeholder="getPlaceholder()"
          rows="8"
        />
        <div class="editor-footer">
          <span class="char-count">{{ contentLength }} characters</span>
          <button
            v-if="hasUnsavedChanges"
            @click="saveContent"
            class="save-btn"
          >
            <Save :size="14" />
            Save Changes
          </button>
        </div>
      </div>

      <!-- Row 3: Error Display (if any) -->
      <div v-if="hasError" class="error-section">
        <div class="error-card">
          <AlertCircle :size="16" />
          <div class="error-content">
            <h4 class="error-title">Error</h4>
            <p class="error-message">{{ selectedNode.data.error }}</p>
          </div>
        </div>
      </div>

      <!-- Row 4: Quick Results Summary (No Details) -->
      <div v-if="hasResults && !hasError" class="results-summary">
        <div class="summary-card">
          <CheckCircle :size="16" class="success-icon" />
          <div class="summary-content">
            <h4 class="summary-title">Analysis Complete</h4>
            <p class="summary-text">View detailed results in the Reports tab</p>
          </div>
          <button @click="openReportsTab" class="view-reports-btn">
            <FileBarChart :size="14" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import {
  Box,
  FileText,
  Calendar,
  Activity,
  Play,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  FileBarChart
} from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { storeToRefs } from 'pinia'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const { selectedNodeId } = storeToRefs(workflowStore)

const nodeLabel = ref('')
const nodeContent = ref('')
const hasUnsavedChanges = ref(false)
const isAnalyzing = ref(false)

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return workflowStore.nodes.find(n => n.id === selectedNodeId.value)
})

const hasContent = computed(() => {
  return nodeContent.value.trim().length > 0
})

const contentLength = computed(() => {
  return nodeContent.value.length
})

const hasResults = computed(() => {
  return selectedNode.value?.data.analysisResult != null
})

const hasError = computed(() => {
  return selectedNode.value?.data.error != null
})

const nodeStats = computed(() => {
  if (!selectedNode.value) return {}

  return {
    created: selectedNode.value.data.createdAt
      ? new Date(selectedNode.value.data.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null,
    analyzed: selectedNode.value.data.analyzedAt
      ? new Date(selectedNode.value.data.analyzedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null
  }
})

// Watch for node selection changes
watch(selectedNode, (newNode) => {
  if (newNode) {
    nodeLabel.value = newNode.data.label || ''
    nodeContent.value = newNode.data.content || ''
    hasUnsavedChanges.value = false
  } else {
    nodeLabel.value = ''
    nodeContent.value = ''
    hasUnsavedChanges.value = false
  }
}, { immediate: true })

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getPlaceholder(): string {
  if (!selectedNode.value) return ''
  if (selectedNode.value.type === 'input') {
    return 'Enter your post content here...'
  }
  return 'Enter content...'
}

function handleContentChange() {
  hasUnsavedChanges.value = true
}

function saveContent() {
  if (!selectedNode.value || !hasUnsavedChanges.value) return

  workflowStore.updateNode(selectedNode.value.id, {
    content: nodeContent.value
  })

  hasUnsavedChanges.value = false
  uiStore.showToast('Content saved', 'success')
}

function updateLabel() {
  if (!selectedNode.value) return

  workflowStore.updateNode(selectedNode.value.id, {
    label: nodeLabel.value
  })

  uiStore.showToast('Label updated', 'success')
}

async function handleAnalyze() {
  if (!selectedNode.value || !hasContent.value) return

  // Save content first
  if (hasUnsavedChanges.value) {
    saveContent()
  }

  isAnalyzing.value = true
  try {
    await workflowStore.analyzeNode(selectedNode.value.id)
    uiStore.showToast('Analysis complete', 'success')
  } catch (error: any) {
    uiStore.showToast(error.message || 'Analysis failed', 'error')
  } finally {
    isAnalyzing.value = false
  }
}

function handleClear() {
  if (!selectedNode.value) return

  if (confirm('Clear this node\'s content?')) {
    nodeContent.value = ''
    workflowStore.updateNode(selectedNode.value.id, {
      content: '',
      analysisResult: null,
      error: null
    })
    hasUnsavedChanges.value = false
    uiStore.showToast('Content cleared', 'info')
  }
}

function handleDelete() {
  if (!selectedNode.value) return

  if (confirm('Delete this node?')) {
    workflowStore.removeNode(selectedNode.value.id)
    uiStore.showToast('Node deleted', 'info')
    uiStore.closeConsole()
  }
}

function openReportsTab() {
  // Switch to Reports tab in Console
  // This will be handled by ConsolePanel parent component
  uiStore.showToast('Switch to Reports tab to view details', 'info')
}
</script>

<style scoped>
.node-properties-tab {
  @apply h-full overflow-y-auto bg-gray-50 dark:bg-gray-900;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center h-full text-center px-4;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Horizontal Properties Layout */
.properties-horizontal {
  @apply flex flex-col gap-4 p-4;
}

/* Info Bar - Horizontal Grid */
.info-bar {
  @apply grid grid-cols-[200px_150px_1fr_auto] gap-4 items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.info-group {
  @apply flex flex-col gap-2;
}

.info-label {
  @apply text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase;
}

.label-input {
  @apply px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Status Badge */
.status-badge {
  @apply px-3 py-1 rounded-full text-xs font-semibold uppercase inline-block;
}

.status-idle {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300;
}

.status-analyzing {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.status-completed {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.status-error {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

/* Statistics Inline */
.stats-group {
  @apply flex-1;
}

.stats-inline {
  @apply flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300;
}

.stat-item {
  @apply flex items-center gap-1;
}

/* Actions */
.actions-group {
  @apply flex items-end gap-2;
}

.action-btn {
  @apply flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors;
}

.action-btn-primary {
  @apply bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300;
}

.action-btn-danger {
  @apply bg-red-500 hover:bg-red-600 text-white;
}

/* Content Editor Section - Full Width */
.content-editor-section {
  @apply flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.editor-header {
  @apply flex items-center justify-between;
}

.editor-label {
  @apply flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.unsaved-indicator {
  @apply text-xs text-orange-600 dark:text-orange-400 font-medium;
}

.content-textarea {
  @apply w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.editor-footer {
  @apply flex items-center justify-between;
}

.char-count {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.save-btn {
  @apply flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors;
}

/* Error Section */
.error-section {
  @apply w-full;
}

.error-card {
  @apply flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-card svg {
  @apply text-red-500 dark:text-red-400 shrink-0;
}

.error-content {
  @apply flex-1;
}

.error-title {
  @apply text-sm font-semibold text-red-900 dark:text-red-300 mb-1;
}

.error-message {
  @apply text-sm text-red-700 dark:text-red-400;
}

/* Results Summary */
.results-summary {
  @apply w-full;
}

.summary-card {
  @apply flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg;
}

.success-icon {
  @apply text-green-500 dark:text-green-400 shrink-0;
}

.summary-content {
  @apply flex-1;
}

.summary-title {
  @apply text-sm font-semibold text-green-900 dark:text-green-300 mb-1;
}

.summary-text {
  @apply text-sm text-green-700 dark:text-green-400;
}

.view-reports-btn {
  @apply flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .info-bar {
    @apply grid-cols-[1fr_1fr] gap-3;
  }

  .actions-group {
    @apply col-span-2;
  }
}
</style>
