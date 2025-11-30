<script setup lang="ts">
// @ts-nocheck
import { Handle, Position } from '@vue-flow/core'
import { Layers, Zap, Play, Loader2, CheckCircle, XCircle, RotateCcw, StopCircle } from 'lucide-vue-next'
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

// Detect analysis mode: single or batch based on incoming connections
const analysisMode = computed(() => {
  const incomingEdges = workflowStore.edges.filter(e => e.target === props.id)
  return incomingEdges.length > 1 ? 'batch' : 'single'
})

// Count source nodes
const sourceCount = computed(() => {
  const incomingEdges = workflowStore.edges.filter(e => e.target === props.id)
  return incomingEdges.length
})

// Get source node IDs
const sourceNodeIds = computed(() => {
  return workflowStore.edges
    .filter(e => e.target === props.id)
    .map(e => e.source)
})

// Display text based on mode and state
const displayText = computed(() => {
  if (props.data.status === 'analyzing') {
    return analysisMode.value === 'batch'
      ? `Analyzing ${sourceCount.value} posts...`
      : 'Analyzing...'
  }

  if (props.data.status === 'completed') {
    return analysisMode.value === 'batch'
      ? `Analyzed ${sourceCount.value} posts`
      : 'Analysis complete'
  }

  if (props.data.status === 'error') {
    return 'Analysis failed'
  }

  return analysisMode.value === 'batch'
    ? `${sourceCount.value} posts connected`
    : sourceCount.value === 1
      ? '1 post connected'
      : 'Connect posts to analyze'
})

// Button text
const buttonText = computed(() => {
  if (props.data.status === 'completed') {
    return 'Re-run'
  }
  return analysisMode.value === 'batch' ? 'Run Batch Analysis' : 'Run Analysis'
})

// Icon based on mode
const modeIcon = computed(() => {
  return analysisMode.value === 'batch' ? Layers : Zap
})

// Status color
const statusColor = computed(() => {
  switch (props.data.status) {
    case 'analyzing':
      return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'completed':
      return 'border-green-400 bg-green-50 dark:bg-green-900/20'
    case 'error':
      return 'border-red-400 bg-red-50 dark:bg-red-900/20'
    default:
      return 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
  }
})

// Handle run analysis click
async function handleRunAnalysis(event: Event) {
  event.stopPropagation()

  if (sourceCount.value === 0) {
    return
  }

  if (props.data.status === 'analyzing') {
    return
  }

  try {
    // Get source nodes
    const sourceNodes = workflowStore.nodes.filter(n =>
      sourceNodeIds.value.includes(n.id)
    )

    // Filter nodes with valid content
    const validNodes = sourceNodes.filter(n => n.data.content?.trim())

    if (validNodes.length === 0) {
      console.warn('[AnalysisNode] No valid content to analyze')
      return
    }

    // Update this node's status
    workflowStore.updateNodeData(props.id, { status: 'analyzing' })

    if (analysisMode.value === 'batch') {
      // Execute batch analysis
      console.log('[AnalysisNode] Starting batch analysis for', validNodes.length, 'nodes')
      const result = await workflowStore.executeBatchAnalysis(validNodes, props.id)

      if (!result) {
        console.warn('[AnalysisNode] Analysis was cancelled or returned null')
        return
      }

      // ✅ FIX: Check if analysis was cancelled before updating status
      const currentNode = workflowStore.nodes.find(n => n.id === props.id)
      if (currentNode?.data.status === 'cancelled') {
        console.log('[AnalysisNode] Analysis was cancelled, not updating status or creating results')
        return
      }

      console.log('[AnalysisNode] Batch analysis completed! Result:', result)

      // Update status to completed
      workflowStore.updateNodeData(props.id, {
        status: 'completed',
        analysisResult: result
      })
      console.log('[AnalysisNode] Node status updated to completed')

      // Add ONE batch report with all connections and insights
      // CRITICAL: Use backend's deterministic batchId (content-based hash)
      // DO NOT generate a random fallback - backend always provides batchId
      const batchId = result.batchId

      if (!batchId) {
        console.error('[AnalysisNode] ERROR: Backend did not return batchId!', result)
        throw new Error('Backend did not return batchId - this should never happen')
      }

      console.log('[AnalysisNode] ✅ Using backend deterministic batchId:', batchId)

      const reportData = {
        id: `report-${batchId}`, // Use batchId as report ID for consistency
        nodeId: props.id, // Use the Analysis node ID
        workflowId: 'default-workflow',
        batchId: batchId, // Store backend's deterministic batchId
        result: {
          ...result,
          type: 'batch',
          nodeCount: result.results?.length || 0,
          summary: `Batch analysis of ${result.results?.length || 0} connected posts`,
          connections: result.connections,
          batchInsights: result.batchInsights,
          totalConnections: result.totalConnections,
          pattern_analysis: result.pattern_analysis, // Include pattern analysis data
          individual_analyses: result.individual_analyses, // User's 3 posts
          similar_posts: result.similar_posts, // ← CRITICAL FIX: Include RAG posts!
          extraction_warning: result.extraction_warning, // ← Degraded mode warning
          features_available: result.features_available, // ← Feature availability flags
          enhanced_intelligence: result.enhanced_intelligence // ← Enhanced Intelligence (Phase 3)
        },
        timestamp: new Date(),
        isRead: false
      }

      // ===== CRITICAL: Log report data being created =====
      console.log(`\n${'='.repeat(80)}`)
      console.log(`[ANALYSIS NODE] 📝 Creating Report`)
      console.log(`${'='.repeat(80)}`)
      console.log('[AnalysisNode] batchId:', batchId)
      console.log('[AnalysisNode] result.batchId:', result.batchId)
      console.log('[AnalysisNode] result.individual_analyses count:', result.individual_analyses?.length)
      console.log('[AnalysisNode] result.similar_posts count:', result.similar_posts?.length)
      console.log('[AnalysisNode] reportData.result.individual_analyses count:', reportData.result.individual_analyses?.length)
      console.log('[AnalysisNode] reportData.result.similar_posts count:', reportData.result.similar_posts?.length)
      if (result.individual_analyses) {
        console.log('[AnalysisNode] Companies:', result.individual_analyses.map((a: any) => a.company))
      }
      console.log('[AnalysisNode] 🚨 Degraded Mode Check:')
      console.log('[AnalysisNode]   - result.extraction_warning:', result.extraction_warning)
      console.log('[AnalysisNode]   - result.features_available:', result.features_available)
      console.log('[AnalysisNode]   - reportData.result.extraction_warning:', reportData.result.extraction_warning)
      console.log('[AnalysisNode]   - reportData.result.features_available:', reportData.result.features_available)
      console.log(`${'='.repeat(80)}\n`)
      reportsStore.addReport(reportData)

      // Create results node
      workflowStore.createResultsNode(props.id, result)

    } else {
      // Execute single analysis
      const sourceNode = validNodes[0]
      const result = await workflowStore.analyzeNode(sourceNode.id)

      console.log('[AnalysisNode] Single analysis result:', result)

      // Update status to completed
      workflowStore.updateNodeData(props.id, {
        status: 'completed',
        analysisResult: result
      })

      // Check if this is a Single Post Analysis (has 'overview' field) or regular analysis
      const isSinglePostAnalysis = result && typeof result === 'object' && 'overview' in result

      if (isSinglePostAnalysis) {
        console.log('[AnalysisNode] ✅ Detected Single Post Analysis - storing in reports store')
        console.log('[AnalysisNode] Overview data:', result.overview)
        console.log('[AnalysisNode] Analysis ID from backend:', result.id)

        // Store in reportsStore (EXACTLY like batch analysis does!)
        const analysisId = result.id

        if (!analysisId) {
          console.error('[AnalysisNode] ERROR: Backend did not return analysisId!', result)
          throw new Error('Backend did not return analysisId - this should never happen')
        }

        console.log('[AnalysisNode] ✅ Using backend analysisId:', analysisId)

        const reportData = {
          id: `report-${analysisId}`, // Use analysisId as report ID for consistency
          nodeId: props.id, // Use the Analysis node ID
          workflowId: 'default-workflow',
          analysisId: analysisId, // Store backend's analysisId
          result: {
            ...result,
            type: 'single', // CRITICAL: Mark as single post analysis
            summary: `Single post analysis - ${result.overview?.company || 'Unknown Company'}`,
          },
          timestamp: new Date(),
          isRead: false
        }

        console.log('[AnalysisNode] Adding single post report to store:', reportData)
        reportsStore.addReport(reportData)
        console.log('[AnalysisNode] Total reports after add:', reportsStore.reports.length)

        // Create results node
        workflowStore.createResultsNode(props.id, result)
      } else {
        console.log('[AnalysisNode] Regular analysis detected - adding to reports store')

        // Add report to reports store
        // Use backend analysis ID if available for matching after page refresh
        const analysisId = result.id

        const reportData = {
          id: analysisId ? `report-${analysisId}` : `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nodeId: props.id, // Use the Analysis node ID (not source node)
          workflowId: 'default-workflow',
          analysisId: analysisId, // Store backend analysis ID for matching
          result: result,
          timestamp: new Date(),
          isRead: false
        }
        console.log('[AnalysisNode] Adding report to store:', reportData)
        reportsStore.addReport(reportData)
        console.log('[AnalysisNode] Total reports after add:', reportsStore.reports.length)

        // Create results node with the result from analyzeNode
        workflowStore.createResultsNode(props.id, result)
      }
    }

  } catch (error) {
    console.error('[AnalysisNode] Analysis failed:', error)
    workflowStore.updateNodeData(props.id, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Analysis failed'
    })
  }
}

// Handle stop analysis click
function handleStopAnalysis(event: Event) {
  event.stopPropagation()

  if (props.data.status !== 'analyzing') {
    return
  }

  // ✅ FIX: Abort batch analysis controller if batchId is stored
  const batchId = props.data.batchId
  if (batchId) {
    console.log('[AnalysisNode] Aborting batch analysis with batchId:', batchId)
    workflowStore.abortAnalysis(batchId)
  }

  // Abort analysis for all source nodes (for single analysis mode)
  const sourceNodes = workflowStore.nodes.filter(n =>
    sourceNodeIds.value.includes(n.id)
  )

  for (const sourceNode of sourceNodes) {
    workflowStore.abortAnalysis(sourceNode.id)
  }

  // Update this node's status to cancelled
  workflowStore.updateNodeData(props.id, {
    status: 'cancelled',
    error: 'Analysis cancelled by user'
  })
}
</script>

<template>
  <div
    :class="[
      'analysis-node',
      statusColor,
      {
        'ring-2 ring-purple-500': selected
      }
    ]"
    role="article"
    :aria-label="`Analysis node, mode: ${analysisMode}, status: ${data.status}`"
    :aria-selected="selected"
    tabindex="0"
  >
    <!-- Target Handle (Left Side) - receives from Input nodes -->
    <Handle
      id="left"
      type="target"
      :position="Position.Left"
      class="handle handle-target"
    />
    <div class="handle-label handle-label-left">input</div>

    <!-- Header -->
    <div class="node-header">
      <component
        :is="modeIcon"
        :size="18"
        :class="[
          'mode-icon',
          analysisMode === 'batch' ? 'text-purple-600' : 'text-blue-600'
        ]"
      />
      <span class="node-title">
        {{ analysisMode === 'batch' ? 'Batch Analysis' : 'Analysis' }}
      </span>

      <!-- Status Icon -->
      <component
        v-if="data.status !== 'idle'"
        :is="data.status === 'analyzing' ? Loader2 : data.status === 'completed' ? CheckCircle : XCircle"
        :size="16"
        :class="{ 'animate-spin': data.status === 'analyzing' }"
      />
    </div>

    <!-- Divider -->
    <div class="divider" />

    <!-- Status Display -->
    <div class="status-display">
      <p class="status-text">{{ displayText }}</p>
    </div>

    <!-- Progress Bar (only when analyzing) -->
    <div v-if="data.status === 'analyzing'" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" />
      </div>
    </div>

    <!-- Run Button -->
    <button
      v-if="sourceCount > 0 && data.status !== 'analyzing'"
      @click="handleRunAnalysis"
      :class="[
        'run-button',
        analysisMode === 'batch'
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
          : 'bg-blue-500 hover:bg-blue-600'
      ]"
      :title="buttonText"
    >
      <component
        :is="data.status === 'completed' ? RotateCcw : Play"
        :size="14"
      />
      <span>{{ buttonText }}</span>
    </button>

    <!-- Stop Button (only visible when analyzing) -->
    <button
      v-if="data.status === 'analyzing'"
      @click="handleStopAnalysis"
      class="stop-button bg-red-500 hover:bg-red-600"
      title="Stop Analysis"
    >
      <StopCircle :size="14" />
      <span>Stop Analysis</span>
    </button>

    <!-- Warning if no connections -->
    <div v-else class="warning-box">
      <p>⚠️ Connect posts above to enable analysis</p>
    </div>

    <!-- Error Display -->
    <div v-if="data.status === 'error' && data.error" class="node-error">
      <XCircle :size="14" />
      <span>{{ data.error }}</span>
    </div>

    <!-- Source Handle (Right Side) - sends to Results node -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      class="handle handle-source"
    />
    <div class="handle-label handle-label-right">report</div>
  </div>
</template>

<style scoped>
.analysis-node {
  @apply rounded-lg border-2 p-4 shadow-md min-w-[280px] max-w-[320px] transition-all cursor-pointer bg-white dark:bg-gray-800;
  position: relative;
  overflow: visible;
}

.analysis-node:hover {
  @apply shadow-xl;
}

.node-header {
  @apply flex items-center gap-2 mb-2;
}

.mode-icon {
  @apply flex-shrink-0;
}

.node-title {
  @apply font-bold text-base text-gray-800 dark:text-white flex-1;
}

.divider {
  @apply border-t border-gray-300 dark:border-gray-600 mb-3;
}

.status-display {
  @apply mb-3;
}

.status-text {
  @apply text-sm text-gray-700 dark:text-gray-300 text-center;
}

.progress-container {
  @apply mb-3;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full;
  animation: progress-animation 2s ease-in-out infinite;
}

@keyframes progress-animation {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.run-button {
  @apply w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg shadow-lg font-medium;
  @apply transition-all duration-200;
  @apply hover:scale-105 hover:shadow-xl active:scale-95;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100;
}

.stop-button {
  @apply w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg shadow-lg font-medium;
  @apply transition-all duration-200;
  @apply hover:scale-105 hover:shadow-xl active:scale-95;
}

.warning-box {
  @apply bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-center;
}

.warning-box p {
  @apply text-xs text-yellow-700 dark:text-yellow-300;
}

.node-error {
  @apply mt-3 pt-3 border-t border-red-200 dark:border-red-700 flex items-center gap-2 text-xs text-red-600 dark:text-red-400;
}

/* Handle styling */
.handle {
  @apply !w-3 !h-3 !border-2 !border-white dark:!border-gray-800;
  position: absolute !important;
}

.handle-target {
  @apply !bg-purple-500;
  left: -6px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.handle-source {
  @apply !bg-green-500;
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

.handle-label-left {
  left: -12px;
  top: 50%;
  transform: translate(-100%, -50%);
}

.handle-label-right {
  right: -12px;
  top: 50%;
  transform: translate(100%, -50%);
}

/* Ensure interactions work */
.analysis-node * {
  pointer-events: auto;
}
</style>
