<template>
  <div class="node-inspector-content">
    <!-- No Node Selected -->
    <div v-if="!selectedNode" class="empty-state">
      <Box :size="48" class="empty-icon" />
      <h3 class="empty-title">No Node Selected</h3>
      <p class="empty-description">
        Select a node to view and edit its properties
      </p>
    </div>

    <!-- Node Selected -->
    <div v-else class="node-details">
      <!-- Node Header -->
      <div class="node-header">
        <div class="node-title">
          <Box :size="20" />
          <h3>{{ selectedNode.data.label || `Node ${selectedNode.id}` }}</h3>
        </div>
        <span :class="['node-status', `status-${selectedNode.data.status || 'idle'}`]">
          {{ selectedNode.data.status || 'idle' }}
        </span>
      </div>

      <!-- Node Stats -->
      <div v-if="nodeStats" class="node-stats">
        <div class="stat-item">
          <Calendar :size="14" />
          <span class="stat-label">Created:</span>
          <span class="stat-value">{{ nodeStats.created }}</span>
        </div>
        <div v-if="nodeStats.analyzed" class="stat-item">
          <Activity :size="14" />
          <span class="stat-label">Analyzed:</span>
          <span class="stat-value">{{ nodeStats.analyzed }}</span>
        </div>
      </div>

      <!-- Content Editor -->
      <div class="content-section">
        <h4 class="section-title">
          <FileText :size="16" />
          Content
        </h4>
        <ContentEditor />
      </div>

      <!-- Analysis Results -->
      <div v-if="hasResults" class="results-section">
        <h4 class="section-title">
          <FileBarChart :size="16" />
          Analysis Results
        </h4>
        <ResultsPanel :result="selectedNode.data.analysisResult" />
      </div>

      <!-- Error Display -->
      <div v-if="hasError" class="error-section">
        <div class="error-card">
          <h4 class="error-title">Error</h4>
          <p class="error-message">{{ selectedNode.data.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { Box, FileText, Calendar, Activity, FileBarChart } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { storeToRefs } from 'pinia'
import ContentEditor from '../Inspector/ContentEditor.vue'
import ResultsPanel from '../Inspector/ResultsPanel.vue'

const workflowStore = useWorkflowStore()
const { selectedNodeId } = storeToRefs(workflowStore)

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return workflowStore.nodes.find(n => n.id === selectedNodeId.value)
})

const hasResults = computed(() => {
  return selectedNode.value?.data.analysisResult != null
})

const hasError = computed(() => {
  return selectedNode.value?.data.error != null
})

const nodeStats = computed(() => {
  if (!selectedNode.value) return null

  return {
    created: selectedNode.value.data.createdAt
      ? new Date(selectedNode.value.data.createdAt).toLocaleString()
      : 'N/A',
    analyzed: selectedNode.value.data.analyzedAt
      ? new Date(selectedNode.value.data.analyzedAt).toLocaleString()
      : null
  }
})
</script>

<style scoped>
.node-inspector-content {
  @apply h-full overflow-y-auto p-4;
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

/* Node Details */
.node-details {
  @apply space-y-4;
}

.node-header {
  @apply flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700;
}

.node-title {
  @apply flex items-center gap-2;
}

.node-title h3 {
  @apply text-lg font-bold text-gray-900 dark:text-gray-100;
}

.node-status {
  @apply px-3 py-1 rounded-full text-xs font-semibold uppercase;
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

/* Node Stats */
.node-stats {
  @apply space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.stat-item {
  @apply flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300;
}

.stat-label {
  @apply font-medium;
}

.stat-value {
  @apply text-gray-600 dark:text-gray-400;
}

/* Sections */
.content-section,
.results-section {
  @apply space-y-3;
}

.section-title {
  @apply flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100 mb-3;
}

/* Error */
.error-section {
  @apply space-y-2;
}

.error-card {
  @apply p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-title {
  @apply text-sm font-semibold text-red-900 dark:text-red-300 mb-2;
}

.error-message {
  @apply text-sm text-red-700 dark:text-red-400;
}
</style>
