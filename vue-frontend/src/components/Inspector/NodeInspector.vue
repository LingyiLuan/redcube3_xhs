<script setup lang="ts">
import { computed } from 'vue'
import { X, FileText, Calendar, Activity, MousePointerClick } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useReportsStore } from '@/stores/reportsStore'
import { storeToRefs } from 'pinia'
import ContentEditor from './ContentEditor.vue'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const reportsStore = useReportsStore()

const { selectedNodeId } = storeToRefs(workflowStore)
const { inspectorOpen } = storeToRefs(uiStore)

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return workflowStore.nodes.find(n => n.id === selectedNodeId.value)
})

const hasContent = computed(() => {
  return selectedNode.value?.data.content && selectedNode.value.data.content.trim().length > 0
})

const hasError = computed(() => {
  return selectedNode.value?.data.error != null
})

const nodeStats = computed(() => {
  if (!selectedNode.value) return null

  return {
    created: selectedNode.value.data.createdAt
      ? new Date(selectedNode.value.data.createdAt).toLocaleString()
      : 'Unknown',
    updated: selectedNode.value.data.updatedAt
      ? new Date(selectedNode.value.data.updatedAt).toLocaleString()
      : 'Not modified',
    analyzed: selectedNode.value.data.analyzedAt
      ? new Date(selectedNode.value.data.analyzedAt).toLocaleString()
      : 'Not analyzed',
    status: selectedNode.value.data.status || 'idle',
    contentLength: selectedNode.value.data.content?.length || 0
  }
})

function handleClose() {
  uiStore.closeInspector()
  workflowStore.setSelectedNode(null)
}

function handleContentUpdate(newContent: string) {
  if (!selectedNodeId.value) return
  workflowStore.updateNode(selectedNodeId.value, { content: newContent })
}

function handleLabelUpdate(event: Event) {
  if (!selectedNodeId.value) return
  const target = event.target as HTMLInputElement
  workflowStore.updateNode(selectedNodeId.value, { label: target.value })
}

async function handleAnalyze() {
  if (!selectedNodeId.value) return
  try {
    const result = await workflowStore.analyzeNode(selectedNodeId.value)

    console.log('[NodeInspector] Analysis result:', result)

    // Create report after successful analysis
    if (result) {
      const reportData = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nodeId: selectedNodeId.value,
        workflowId: 'default-workflow',
        result: result,
        timestamp: new Date(),
        isRead: false
      }
      console.log('[NodeInspector] Adding report to store:', reportData)
      reportsStore.addReport(reportData)
      console.log('[NodeInspector] Total reports after add:', reportsStore.reports.length)
    }

    uiStore.showToast('Analysis complete!', 'success')
  } catch (error: any) {
    console.error('[NodeInspector] Analysis failed:', error)
    uiStore.showToast(error.message || 'Analysis failed', 'error')
  }
}

function handleDeleteNode() {
  if (!selectedNodeId.value) return
  if (confirm('Delete this node?')) {
    workflowStore.removeNode(selectedNodeId.value)
    handleClose()
    uiStore.showToast('Node deleted', 'info')
  }
}

function handleClearError() {
  if (!selectedNodeId.value) return
  workflowStore.updateNode(selectedNodeId.value, { error: undefined, status: 'idle' })
  uiStore.showToast('Error cleared', 'info')
}
</script>

<template>
  <!-- Inspector Panel -->
  <div v-if="inspectorOpen" class="node-inspector">
    <!-- Header -->
    <div class="inspector-header">
      <div class="header-left">
        <FileText :size="20" />
        <h2>Node Properties</h2>
      </div>
      <button @click="handleClose" class="close-btn" aria-label="Close inspector">
        <X :size="20" />
      </button>
    </div>

    <!-- Content -->
    <div class="inspector-body">
      <!-- Node Selected Content -->
      <div v-if="selectedNode">
          <!-- Node Title Editor -->
          <div class="inspector-section">
            <label class="section-label">Node Label</label>
            <input
              type="text"
              :value="selectedNode.data.label"
              @input="handleLabelUpdate"
              class="label-input"
              placeholder="Enter node label..."
            />
          </div>

          <!-- Status Badge -->
          <div class="inspector-section">
            <label class="section-label">Status</label>
            <div class="status-badge-container">
              <span :class="['status-badge', `status-${selectedNode.data.status || 'idle'}`]">
                <Activity :size="14" />
                {{ selectedNode.data.status || 'idle' }}
              </span>
            </div>
          </div>

          <!-- Content Editor -->
          <div class="inspector-section">
            <label class="section-label">Content</label>
            <ContentEditor
              :content="selectedNode.data.content || ''"
              :node-id="selectedNode.id"
              :status="selectedNode.data.status || 'idle'"
              @update:content="handleContentUpdate"
              @analyze="handleAnalyze"
            />
          </div>

          <!-- Error Display -->
          <div v-if="hasError" class="inspector-section">
            <div class="error-header">
              <label class="section-label error-label">Error</label>
              <button @click="handleClearError" class="btn-clear-error">Clear</button>
            </div>
            <div class="error-display">
              {{ selectedNode.data.error }}
            </div>
          </div>

          <!-- Node Statistics -->
          <div class="inspector-section">
            <label class="section-label">Statistics</label>
            <div class="stats-grid">
              <div class="stat-item">
                <Calendar :size="14" />
                <div class="stat-content">
                  <span class="stat-label">Created</span>
                  <span class="stat-value">{{ nodeStats?.created }}</span>
                </div>
              </div>
              <div class="stat-item">
                <Calendar :size="14" />
                <div class="stat-content">
                  <span class="stat-label">Updated</span>
                  <span class="stat-value">{{ nodeStats?.updated }}</span>
                </div>
              </div>
              <div class="stat-item">
                <Activity :size="14" />
                <div class="stat-content">
                  <span class="stat-label">Analyzed</span>
                  <span class="stat-value">{{ nodeStats?.analyzed }}</span>
                </div>
              </div>
              <div class="stat-item">
                <FileText :size="14" />
                <div class="stat-content">
                  <span class="stat-label">Content Length</span>
                  <span class="stat-value">{{ nodeStats?.contentLength }} characters</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="inspector-actions">
            <button @click="handleDeleteNode" class="btn-delete">
              Delete Node
            </button>
          </div>
        </div>

      <!-- No Node Selected -->
      <div v-else class="empty-state">
        <MousePointerClick :size="48" class="empty-icon" />
        <h3 class="empty-title">No Node Selected</h3>
        <p class="empty-description">
          Click on a node in the canvas to view and edit its details.
        </p>
        <div class="empty-hints">
          <p class="hint-item">Click any node to inspect it</p>
          <p class="hint-item">Press Cmd+A to add a new node</p>
          <p class="hint-item">Press Esc to close this panel</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-inspector {
  @apply fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col;
  z-index: 1000;
}

.inspector-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
}

.header-left {
  @apply flex items-center gap-2;
}

.header-left h2 {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.close-btn {
  @apply p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors;
}

/* Body */
.inspector-body {
  @apply flex-1 overflow-y-auto;
}

.inspector-section {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
}

.section-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
}

.error-label {
  @apply text-red-600 dark:text-red-400;
}

.label-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.status-badge-container {
  @apply flex items-center;
}

.status-badge {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium;
}

.status-idle {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300;
}

.status-analyzing {
  @apply bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300;
}

.status-completed {
  @apply bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300;
}

.status-error {
  @apply bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300;
}

.error-header {
  @apply flex items-center justify-between mb-2;
}

.btn-clear-error {
  @apply text-xs px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded transition-colors;
}

.error-display {
  @apply p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400;
}

.stats-grid {
  @apply grid gap-3;
}

.stat-item {
  @apply flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded;
}

.stat-item svg {
  @apply text-gray-500 dark:text-gray-400 mt-0.5;
}

.stat-content {
  @apply flex flex-col gap-0.5;
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.stat-value {
  @apply text-sm text-gray-900 dark:text-gray-100 font-medium;
}

.inspector-actions {
  @apply p-4 flex flex-col gap-2 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

.btn-analyze {
  @apply w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-delete {
  @apply w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center min-h-[400px];
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-4;
}

.empty-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs;
}

.empty-hints {
  @apply w-full max-w-xs space-y-2;
}

.hint-item {
  @apply text-xs text-left text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 p-2 rounded;
}

.hint-item kbd {
  @apply px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono;
}
</style>
