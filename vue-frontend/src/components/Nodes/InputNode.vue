<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { FileText, Play, Loader2, CheckCircle, XCircle, Plus, AlertCircle } from 'lucide-vue-next'
import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useReportsStore } from '@/stores/reportsStore'
import type { WorkflowNode } from '@/types/workflow'

interface Props {
  id: string
  data: WorkflowNode['data']
  selected?: boolean
}

const props = defineProps<Props>()
const workflowStore = useWorkflowStore()
const reportsStore = useReportsStore()

// Check if this node is in multi-select
const isMultiSelected = computed(() =>
  workflowStore.selectedNodeIds.length > 1 &&
  workflowStore.selectedNodeIds.includes(props.id)
)

// Check selection mode for enhanced visual feedback
const selectionMode = computed(() => workflowStore.selectionMode)

const isInConnectedGroup = computed(() =>
  selectionMode.value === 'connected-group' &&
  workflowStore.selectedNodeIds.includes(props.id)
)

const isInMixedSelection = computed(() =>
  selectionMode.value === 'mixed-selection' &&
  workflowStore.selectedNodeIds.includes(props.id)
)

// Validation: check if node has content
const hasValidationWarning = computed(() => {
  return !props.data.content || props.data.content.trim() === ''
})

// Computed styles based on status
const statusColor = computed(() => {
  switch (props.data.status) {
    case 'analyzing':
      return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'completed':
      return 'border-green-400 bg-green-50 dark:bg-green-900/20'
    case 'error':
      return 'border-red-400 bg-red-50 dark:bg-red-900/20'
    default:
      return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
  }
})

const statusIcon = computed(() => {
  switch (props.data.status) {
    case 'analyzing':
      return Loader2
    case 'completed':
      return CheckCircle
    case 'error':
      return XCircle
    default:
      return FileText
  }
})

const analysisLabel = computed(() => {
  const result = props.data.analysisResult
  if (!result) return null
  if (typeof (result as any)?.id !== 'undefined') {
    return `Analysis #${(result as any).id}`
  }
  return 'Analysis complete'
})

// Handle analyze button click
async function handleAnalyze(event: Event) {
  event.stopPropagation()

  if (!props.data.content || props.data.content.trim() === '') {
    return
  }

  try {
    const result = await workflowStore.analyzeNode(props.id)

    console.log('[InputNode] Analysis result:', result)

    // Create report after successful analysis
    if (result) {
      const reportData = {
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nodeId: props.id,
        workflowId: 'default-workflow',
        result: result,
        timestamp: new Date(),
        isRead: false
      }
      console.log('[InputNode] Adding report to store:', reportData)
      reportsStore.addReport(reportData)
      console.log('[InputNode] Total reports after add:', reportsStore.reports.length)
    }
  } catch (error) {
    console.error('[InputNode] Analysis failed:', error)
  }
}

// Handle create linked node
function handlePlusClick(event: Event) {
  event.stopPropagation()
  workflowStore.createLinkedNode(props.id, 'right')
}
</script>

<template>
  <div
    :class="[
      'input-node',
      statusColor,
      {
        'ring-2 ring-blue-500': selected && !isMultiSelected,
        'ring-4 ring-gradient-purple': isInConnectedGroup,
        'ring-2 ring-purple-300': isInMixedSelection
      }
    ]"
    role="article"
    :aria-label="`${data.label} node, status: ${data.status}`"
    :aria-selected="selected"
    tabindex="0"
  >
    <!-- Header -->
    <div class="node-header">
      <component
        :is="statusIcon"
        :size="16"
        :class="{ 'animate-spin': data.status === 'analyzing' }"
      />
      <span class="node-title">{{ data.label }}</span>

      <!-- Validation Warning Icon -->
      <AlertCircle
        v-if="hasValidationWarning && data.status === 'idle'"
        :size="16"
        class="text-yellow-500 dark:text-yellow-400"
        title="Content is empty"
      />

      <!-- Action Buttons -->
      <div class="node-actions">
        <button
          v-if="data.content"
          @click="handleAnalyze"
          :disabled="data.status === 'analyzing'"
          class="action-btn"
          title="Analyze content"
          aria-label="Analyze this node's content"
          :aria-busy="data.status === 'analyzing'"
        >
          <Play :size="14" aria-hidden="true" />
        </button>
        <button
          @click="handlePlusClick"
          class="action-btn"
          title="Add linked node"
          aria-label="Create a new linked node"
        >
          <Plus :size="14" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Content Preview -->
    <div
      v-if="data.content && data.content.trim()"
      class="node-content"
      role="region"
      aria-label="Node content"
    >
      {{ data.content.slice(0, 100) }}{{ data.content.length > 100 ? '...' : '' }}
    </div>
    <div
      v-else
      class="node-placeholder"
      :class="{ 'border-yellow-400': hasValidationWarning }"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-2 justify-center">
        <AlertCircle v-if="hasValidationWarning" :size="14" class="text-yellow-500" aria-hidden="true" />
        <p>Click to add content</p>
      </div>
    </div>

    <!-- Metadata -->
    <div v-if="data.metadata?.source" class="node-metadata">
      Source: {{ data.metadata.source }}
    </div>

    <!-- Error Display -->
    <div v-if="data.status === 'error' && data.error" class="node-error">
      <XCircle :size="14" />
      <span>{{ data.error }}</span>
    </div>

    <!-- Analysis Result Preview -->
    <div v-if="analysisLabel" class="node-result">
      <CheckCircle :size="14" />
      <span>{{ analysisLabel }}</span>
    </div>

    <!-- Source Handle (Right Side) - connects to Analysis node -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      class="handle handle-source"
    />
    <div class="handle-label handle-label-right">input</div>
  </div>
</template>

<style scoped>
.input-node {
  @apply rounded-lg border-2 p-3 shadow-md min-w-[250px] max-w-[320px] transition-all cursor-pointer bg-white dark:bg-gray-800;
  position: relative;
  overflow: visible;
}

.input-node:hover {
  @apply shadow-lg;
}

.node-header {
  @apply flex items-center gap-2 mb-2;
}

.node-title {
  @apply font-semibold text-sm text-gray-800 dark:text-white flex-1;
}

.node-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  color: #3b82f6;
}

.node-content {
  @apply bg-white dark:bg-gray-700 rounded p-2 mb-2 text-xs text-gray-700 dark:text-gray-300 overflow-hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.node-placeholder {
  @apply bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded p-3 mb-2 text-center;
}

.node-placeholder p {
  @apply text-xs text-gray-400;
}

.node-metadata {
  @apply text-xs text-gray-500 dark:text-gray-400 mb-1;
}

.node-error {
  @apply mt-2 pt-2 border-t border-red-200 dark:border-red-700 flex items-center gap-2 text-xs text-red-600 dark:text-red-400;
}

.node-result {
  @apply mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium;
}

/* Handle styling */
.handle {
  @apply !w-3 !h-3 !border-2 !border-white dark:!border-gray-800;
  position: absolute !important;
}

.handle-source {
  @apply !bg-blue-500;
  right: -6px !important;
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

.handle-label-right {
  right: -12px;
  top: 50%;
  transform: translate(100%, -50%);
}

/* Ensure node doesn't interfere with Vue Flow interactions */
.input-node * {
  pointer-events: auto;
}

/* Connected group gradient ring with pulse */
.ring-gradient-purple {
  position: relative;
  box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.5);
  animation: pulse-gradient-ring 2s ease-in-out infinite;
}

.ring-gradient-purple::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  padding: 4px;
  background: linear-gradient(135deg, #3b82f6, #a855f7);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

@keyframes pulse-gradient-ring {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.6);
  }
}
</style>
