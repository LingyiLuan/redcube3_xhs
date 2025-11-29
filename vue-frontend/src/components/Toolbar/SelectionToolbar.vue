<script setup lang="ts">
import { computed, watch } from 'vue'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useVueFlow } from '@vue-flow/core'
import { Layers, Trash2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const { selectionMode, selectedNodeIds, selectedNodes } = storeToRefs(workflowStore)

// Get Vue Flow instance for coordinate transformation and viewport tracking
const vueFlow = useVueFlow()

// Prevent mousedown/click events from bubbling to Vue Flow pane
// This keeps the toolbar interactive without triggering deselection
function preventPaneInteraction(event: MouseEvent) {
  event.stopPropagation()
}

// Watch viewport changes to trigger position recalculation
const viewportKey = computed(() => {
  const vp = vueFlow.viewport.value
  return `${vp.x}-${vp.y}-${vp.zoom}`
})

// Calculate toolbar position (center of selected nodes) in screen coordinates
const toolbarPosition = computed(() => {
  if (selectedNodes.value.length === 0) {
    return { display: 'none', left: '0px', top: '0px' }
  }

  // Calculate centroid of selected nodes in canvas coordinates
  const positions = selectedNodes.value.map(n => n.position)
  const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
  const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length

  // Offset to position above nodes (assuming typical node width ~280px)
  const canvasX = avgX + 140 // center of node
  const canvasY = avgY - 80   // 80px above node

  // Convert canvas coordinates to screen coordinates using Vue Flow's project()
  // This automatically applies zoom and pan transformations
  const screenPos = vueFlow.project({ x: canvasX, y: canvasY })

  // Get viewport dimensions for edge detection
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Toolbar approximate width/height
  const toolbarWidth = 400
  const toolbarHeight = 120

  // Clamp position to keep toolbar on screen
  let finalX = screenPos.x
  let finalY = screenPos.y

  // Prevent going off left edge
  if (finalX - toolbarWidth / 2 < 10) {
    finalX = toolbarWidth / 2 + 10
  }

  // Prevent going off right edge
  if (finalX + toolbarWidth / 2 > viewportWidth - 10) {
    finalX = viewportWidth - toolbarWidth / 2 - 10
  }

  // Prevent going off top edge
  if (finalY < 10) {
    finalY = 10
  }

  // Prevent going off bottom edge
  if (finalY + toolbarHeight > viewportHeight - 10) {
    finalY = viewportHeight - toolbarHeight - 10
  }

  return {
    display: 'block',
    left: `${finalX}px`,
    top: `${finalY}px`
  }
})

// Force re-render when viewport changes (for smooth tracking during pan/zoom)
watch(viewportKey, () => {
  // This triggers a recomputation of toolbarPosition
  // The watch ensures position updates smoothly during pan/zoom
})

// Button text for batch analysis (only for connected groups)
const buttonText = computed(() => {
  return `Batch Analyze (${selectedNodeIds.value.length} Connected)`
})

// Check if nodes have content
const hasValidContent = computed(() => {
  return selectedNodes.value.some(n => n.data.content?.trim())
})

const isAnalyzing = computed(() => {
  return selectedNodes.value.some(n => n.data.status === 'analyzing')
})

// Handle batch analyze action (only for connected groups)
async function handleAnalyze() {
  if (!hasValidContent.value || isAnalyzing.value) return

  try {
    // Batch analysis for connected group
    const nodes = selectedNodes.value.filter(n => n.data.content?.trim())
    if (nodes.length > 0) {
      await workflowStore.executeBatchAnalysis(nodes)
    }
  } catch (error) {
    console.error('[SelectionToolbar] Batch analysis failed:', error)
  }
}

// Handle delete action
function handleDelete() {
  if (selectedNodeIds.value.length === 0) return

  const count = selectedNodeIds.value.length
  const message = count === 1
    ? 'Delete this node?'
    : `Delete ${count} nodes?`

  if (confirm(message)) {
    workflowStore.deleteSelectedNodes()
    uiStore.showToast(
      count === 1 ? 'Node deleted' : `${count} nodes deleted`,
      'info'
    )
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toolbar-fade">
      <div
        v-if="selectionMode === 'connected-group'"
        class="selection-toolbar"
        :style="toolbarPosition"
        @mousedown="preventPaneInteraction"
        @click="preventPaneInteraction"
        data-toolbar="selection"
      >
      <!-- Mode Indicator Badge -->
      <div class="mode-indicator">
        <span class="badge badge-connected">
          <Layers :size="12" />
          Connected Group
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="toolbar-actions">
        <!-- Batch Analyze Button -->
        <button
          @click="handleAnalyze"
          :disabled="!hasValidContent || isAnalyzing"
          class="toolbar-btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          :title="buttonText"
        >
          <Layers :size="18" />
          <span>{{ isAnalyzing ? 'Analyzing...' : buttonText }}</span>
        </button>

        <!-- Delete Button -->
        <button
          @click="handleDelete"
          class="toolbar-btn-secondary"
          title="Delete selected node(s)"
        >
          <Trash2 :size="18" />
        </button>
      </div>

      <!-- Content Warning -->
      <div v-if="!hasValidContent" class="warning-message">
        ⚠️ No content to analyze
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>
.selection-toolbar {
  @apply fixed z-50 flex flex-col items-center gap-2;
  /* Position is controlled by inline styles from toolbarPosition computed */
  transform: translate(-50%, -100%); /* Center horizontally, position above anchor point */
  pointer-events: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  /* Smooth transitions for position changes */
  transition: left 0.15s ease-out, top 0.15s ease-out;
}

/* Mode Indicator */
.mode-indicator {
  @apply mb-1;
}

.badge {
  @apply flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm;
  @apply border-2 border-white/20;
}

.badge-connected {
  @apply bg-gradient-to-r from-blue-500 to-purple-500 text-white;
}

.badge-mixed {
  @apply bg-purple-300 text-purple-900;
}

.badge-single {
  @apply bg-blue-500 text-white;
}

/* Action Buttons */
.toolbar-actions {
  @apply flex items-center gap-2;
}

.toolbar-btn-primary {
  @apply flex items-center gap-2 px-4 py-2.5 text-white rounded-lg shadow-lg font-medium;
  @apply transition-all duration-200;
  @apply hover:scale-105 hover:shadow-xl active:scale-95;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100;
}

.toolbar-btn-secondary {
  @apply flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-lg shadow-lg;
  @apply transition-all duration-200;
  @apply hover:bg-red-600 hover:scale-105 hover:shadow-xl active:scale-95;
}

/* Warning Message */
.warning-message {
  @apply text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full;
  @apply border border-yellow-200;
}

/* Fade transition - keeps your existing smooth animations */
.toolbar-fade-enter-active,
.toolbar-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toolbar-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

.toolbar-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.9);
}

/* Dark mode support */
.dark .badge-mixed {
  @apply bg-purple-700 text-purple-100;
}

.dark .warning-message {
  @apply bg-yellow-900/50 text-yellow-300 border-yellow-700;
}
</style>
