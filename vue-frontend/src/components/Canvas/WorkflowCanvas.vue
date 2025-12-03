<script setup lang="ts">
// @ts-nocheck
import { markRaw, computed, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import InputNode from '@/components/Nodes/InputNode.vue'
import AnalysisNode from '@/components/Nodes/AnalysisNode.vue'
import ResultsNode from '@/components/Nodes/ResultsNode.vue'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const { nodes, edges, selectedEdgeId, selectionMode, connectedEdgesForSelection } = storeToRefs(workflowStore)
const { canvasCommand } = storeToRefs(uiStore)

// Register custom node types
const nodeTypes = {
  input: markRaw(InputNode),
  analysis: markRaw(AnalysisNode),
  results: markRaw(ResultsNode)
}

// Vue Flow composable for events
const { onConnect, onNodeClick, onNodeDragStop, onEdgeClick, fitView, zoomIn, zoomOut } = useVueFlow()

// Watch for canvas commands from the toolbar via uiStore
watch(canvasCommand, (command) => {
  if (!command) return

  console.log('[WorkflowCanvas] Executing canvas command:', command)

  switch (command) {
    case 'zoomIn':
      zoomIn()
      break
    case 'zoomOut':
      zoomOut()
      break
    case 'fitView':
      fitView({ padding: 0.2, duration: 400 })
      uiStore.showToast('Fit to screen', 'info')
      break
  }

  // Clear the command after executing
  nextTick(() => {
    uiStore.clearCanvasCommand()
  })
})

// Handle new connections
onConnect((params) => {
  console.log('[Canvas] New connection:', params)
  workflowStore.addEdge(params)
})

// Handle node clicks with multi-select support
onNodeClick(({ event, node }) => {
  if (!node) return

  const isShiftClick = event.shiftKey
  console.log('[Canvas] Node clicked:', node.id, isShiftClick ? '(shift-click)' : '')

  if (isShiftClick) {
    // Multi-select mode: toggle selection
    workflowStore.toggleNodeSelection(node.id, true)
  } else {
    // Single select mode: select only this node
    workflowStore.toggleNodeSelection(node.id, false)

    // Only open inspector for Input nodes (they have editable content)
    // Analysis and Results nodes have their own UI and don't need inspector
    if (node.type === 'input') {
      uiStore.openInspector()
    }
  }
})

// Handle edge clicks for selection
onEdgeClick(({ edge }) => {
  if (!edge) return
  console.log('[Canvas] Edge clicked:', edge.id)
  workflowStore.setSelectedEdge(edge.id)
})

// Snap to grid helper function
const GRID_SIZE = 16 // Must match Background gap
function snapToGrid(position: { x: number; y: number }) {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
  }
}

// Handle node drag end with snap-to-grid
onNodeDragStop(({ event, node }) => {
  if (!node) return

  // Snap position to grid
  const snappedPosition = snapToGrid(node.position)
  console.log('[Canvas] Node drag stopped:', node.id, 'Original:', node.position, 'Snapped:', snappedPosition)

  // Update node position with snapped coordinates
  workflowStore.updateNodePosition(node.id, snappedPosition)

  // Force update the node position in Vue Flow
  node.position = snappedPosition
})

// Fit view on mount
setTimeout(() => {
  if (nodes.value.length > 0) {
    fitView({ padding: 0.2 })
  }
}, 100)

// Node color function for minimap
function getNodeColor(node: any) {
  switch (node.data.status) {
    case 'analyzing':
      return '#f59e0b' // Yellow
    case 'completed':
      return '#10b981' // Green
    case 'error':
      return '#ef4444' // Red
    default:
      return '#3b82f6' // Blue
  }
}

// Apply visual classes to edges based on selection mode
const edgesWithClasses = computed(() => {
  return edges.value.map(edge => {
    const classes = []

    // Selected edge styling
    if (edge.id === selectedEdgeId.value) {
      classes.push('edge-selected')
    }

    // Connected group styling
    const connectedEdgeIds = new Set(connectedEdgesForSelection.value.map(e => e.id))
    if (selectionMode.value === 'connected-group' && connectedEdgeIds.has(edge.id)) {
      classes.push('edge-connected-group')
    }

    return {
      ...edge,
      class: classes.join(' ')
    }
  })
})

// Handle edge deletion via button click
function handleDeleteEdge(edgeId: string, event: Event) {
  event.stopPropagation()
  workflowStore.removeEdge(edgeId)
}
</script>

<template>
  <div class="workflow-canvas">
    <VueFlow
      :nodes="nodes"
      :edges="edgesWithClasses"
      :node-types="nodeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="4"
      fit-view-on-init
      class="vue-flow-container"
    >
      <!-- SVG Gradient Definition for Connected Group Edges -->
      <svg style="position: absolute; width: 0; height: 0;">
        <defs>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Edge Labels with Delete Button -->
      <template #edge-label="{ edge }">
        <div class="edge-label-container">
          <button
            @click="(e) => handleDeleteEdge(edge.id, e)"
            class="edge-delete-btn"
            :aria-label="`Delete connection ${edge.id}`"
            title="Delete connection"
          >
            ×
          </button>
        </div>
      </template>

      <!-- Background with dots pattern -->
      <Background
        pattern-color="#aaa"
        :gap="16"
        variant="dots"
      />

      <!-- Zoom/Pan Controls - Removed (using CanvasSideToolbar instead) -->
      <!--
      <Controls
        :show-zoom="false"
        :show-fit-view="false"
        :show-interactive="false"
      />
      -->

      <!-- MiniMap -->
      <MiniMap
        :node-color="getNodeColor"
        pannable
        zoomable
      />
    </VueFlow>
  </div>
</template>

<style scoped>
.workflow-canvas {
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.vue-flow-container {
  width: 100%;
  height: 100%;
}

/* Dark mode support */
.dark .workflow-canvas {
  background: #1f2937;
}

/* Vue Flow customization */
:deep(.vue-flow__node) {
  cursor: pointer;
  /* Remove Vue Flow's default node styling that creates the frame */
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

:deep(.vue-flow__edge) {
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
  stroke: #94a3b8;
  transition: all 0.3s ease;
}

/* Default selected edge (via Vue Flow) */
:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #3b82f6;
  stroke-width: 3;
}

/* Edge selected via our custom selection */
:deep(.vue-flow__edge.edge-selected .vue-flow__edge-path) {
  stroke: #ef4444 !important;
  stroke-width: 3;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
  animation: edge-pulse-red 1.5s ease-in-out infinite;
}

/* Connected group edges - gradient pulse */
:deep(.vue-flow__edge.edge-connected-group .vue-flow__edge-path) {
  stroke: url(#edge-gradient);
  stroke-width: 3;
  filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.5));
  animation: edge-pulse-gradient 2s ease-in-out infinite;
}

/* Edge hover effect */
:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke: #f59e0b;
  stroke-width: 3;
}

/* Edge delete button */
.edge-label-container {
  @apply flex items-center justify-center;
  pointer-events: all;
}

.edge-delete-btn {
  @apply flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full;
  @apply hover:bg-red-600 active:bg-red-700 transition-all duration-200;
  @apply opacity-0 hover:opacity-100 focus:opacity-100;
  @apply shadow-lg hover:shadow-xl;
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  border: 2px solid white;
}

/* Show delete button on edge hover */
:deep(.vue-flow__edge:hover) .edge-delete-btn,
:deep(.vue-flow__edge.edge-selected) .edge-delete-btn {
  opacity: 1;
  animation: fade-in 0.2s ease-out;
}

/* Pulse animations */
@keyframes edge-pulse-red {
  0%, 100% {
    stroke-width: 3;
    filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4));
  }
  50% {
    stroke-width: 4;
    filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));
  }
}

@keyframes edge-pulse-gradient {
  0%, 100% {
    stroke-width: 3;
    filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3));
  }
  50% {
    stroke-width: 4;
    filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.7));
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* SVG gradient definition for connected group edges */
:deep(.vue-flow__edges svg defs) {
  linearGradient#edge-gradient {
    stop[offset="0%"] { stop-color: #3b82f6; }
    stop[offset="100%"] { stop-color: #a855f7; }
  }
}

:deep(.vue-flow__minimap) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep(.vue-flow__controls) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.vue-flow__controls-button) {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.vue-flow__controls-button:hover) {
  background: #f9fafb;
  border-color: #3b82f6;
}

/* Dark mode Vue Flow */
.dark :deep(.vue-flow__minimap) {
  background: #374151;
  border-color: #4b5563;
}

.dark :deep(.vue-flow__controls-button) {
  background: #374151;
  border-color: #4b5563;
  color: white;
}

.dark :deep(.vue-flow__controls-button:hover) {
  background: #4b5563;
  border-color: #60a5fa;
}
</style>
