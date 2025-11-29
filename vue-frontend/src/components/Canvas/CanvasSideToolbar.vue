<template>
  <div class="canvas-side-toolbar" :style="{ left: toolbarLeftPosition }">
    <!-- Add Node Button with Dropdown -->
    <div class="toolbar-item-wrapper">
      <button
        class="toolbar-btn"
        @click="toggleNodeMenu"
        :class="{ active: showNodeMenu }"
        title="Add node"
      >
        <Plus :size="18" />
      </button>

      <!-- Node Type Menu -->
      <Transition name="menu">
        <div v-if="showNodeMenu" class="node-menu">
          <button class="menu-item" @click="addNode('input')">
            <FileText :size="16" />
            <span>Input Node</span>
          </button>
          <button class="menu-item" @click="addNode('analysis')">
            <Zap :size="16" />
            <span>Analysis Node</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Zoom In -->
    <button
      class="toolbar-btn"
      @click="zoomIn"
      title="Zoom in"
    >
      <ZoomIn :size="18" />
    </button>

    <!-- Zoom Out -->
    <button
      class="toolbar-btn"
      @click="zoomOut"
      title="Zoom out"
    >
      <ZoomOut :size="18" />
    </button>

    <!-- Fit to Screen -->
    <button
      class="toolbar-btn"
      @click="fitView"
      title="Fit to screen"
    >
      <Maximize2 :size="18" />
    </button>

    <!-- Divider -->
    <div class="toolbar-divider"></div>

    <!-- Tags/Labels -->
    <button
      class="toolbar-btn"
      @click="toggleTags"
      :class="{ active: showTags }"
      title="Toggle labels"
    >
      <Tag :size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { Plus, ZoomIn, ZoomOut, Maximize2, Tag, FileText, Zap } from 'lucide-vue-next'
import { useVueFlow } from '@vue-flow/core'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { storeToRefs } from 'pinia'

const { fitView: vueFlowFitView, zoomIn: vueFlowZoomIn, zoomOut: vueFlowZoomOut } = useVueFlow()
const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

const { sidebarOpen } = storeToRefs(uiStore)
const showNodeMenu = ref(false)
const showTags = ref(true)

// Calculate left position based on sidebar state
const toolbarLeftPosition = computed(() => {
  return sidebarOpen.value ? '336px' : '76px' // 320px/60px sidebar + 16px padding
})

function toggleNodeMenu() {
  showNodeMenu.value = !showNodeMenu.value
}

function addNode(type: 'input' | 'analysis') {
  const newNode = workflowStore.addNode({
    type,
    position: {
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150
    },
    data: {
      label: type === 'input' ? 'Interview Post' : 'Analysis',
      content: '',
      status: 'idle'
    }
  })

  const nodeLabel = type === 'input' ? 'Input node' : 'Analysis node'
  uiStore.showToast(`${nodeLabel} added`, 'success')
  showNodeMenu.value = false

  console.log('[CanvasSideToolbar] Added node:', newNode.id)
}

function zoomIn() {
  vueFlowZoomIn()
}

function zoomOut() {
  vueFlowZoomOut()
}

function fitView() {
  vueFlowFitView({ padding: 0.2, duration: 400 })
  uiStore.showToast('Fit to screen', 'info')
}

function toggleTags() {
  showTags.value = !showTags.value
  // TODO: Implement label visibility toggle
  uiStore.showToast(showTags.value ? 'Labels shown' : 'Labels hidden', 'info')
}

// Close node menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.toolbar-item-wrapper')) {
    showNodeMenu.value = false
  }
}

// Add event listener
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped>
.canvas-side-toolbar {
  position: fixed;
  /* left is set via inline style based on sidebar state */
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  background: rgba(243, 244, 246, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: left 0.3s ease;
}

.toolbar-item-wrapper {
  position: relative;
}

.toolbar-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: rgba(31, 41, 55, 0.05);
  color: #1F2937;
}

.toolbar-btn.active {
  background: rgba(31, 41, 55, 0.08);
  color: #1F2937;
}

.toolbar-btn svg {
  width: 18px;
  height: 18px;
}

.toolbar-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 3px 0;
}

/* Node Menu */
.node-menu {
  position: absolute;
  left: calc(100% + 8px);
  top: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 4px;
  min-width: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6B7280;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  text-align: left;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: #F3F4F6;
  color: #1F2937;
}

.menu-item svg {
  flex-shrink: 0;
}

/* Transitions */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.menu-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
