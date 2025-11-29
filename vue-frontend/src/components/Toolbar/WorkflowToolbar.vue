<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Play, Save, Trash2, FileText, Download, Upload, Layers, Terminal } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useWorkflowLibraryStore } from '@/stores/workflowLibraryStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventBus } from '@/utils/eventBus'
import { storeToRefs } from 'pinia'

const workflowStore = useWorkflowStore()
const workflowLibraryStore = useWorkflowLibraryStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const eventBus = useEventBus()
const { nodes, isExecuting } = storeToRefs(workflowStore)

const nodeCount = computed(() => nodes.value.length)

const nodesWithContent = computed(() =>
  nodes.value.filter(n => n.type === 'input' && n.data.content?.trim()).length
)

// Add new input node
function handleAddNode() {
  const newNode = workflowStore.addNode({
    type: 'input',
    position: {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    },
    data: {
      label: 'Input Node',
      content: ''
    }
  })

  uiStore.showToast('Post node added', 'success')
  console.log('[Toolbar] Added node:', newNode.id)
}

// Add new analysis node
function handleAddAnalysisNode() {
  const newNode = workflowStore.addNode({
    type: 'analysis',
    position: {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100
    },
    data: {
      label: 'Analysis',
      content: '',
      status: 'idle'
    }
  })

  uiStore.showToast('Analysis node added', 'success')
  console.log('[Toolbar] Added analysis node:', newNode.id)
}

// Execute workflow
async function handleExecute() {
  if (nodesWithContent.value === 0) {
    uiStore.showToast('No nodes with content to analyze', 'warning')
    return
  }

  try {
    const results = await workflowStore.executeWorkflow()
    console.log('[Toolbar] Execution results:', results)
  } catch (error: any) {
    console.error('[Toolbar] Execution failed:', error)
  }
}

// Save workflow
async function handleSave() {
  workflowStore.saveWorkflow()

  if (!authStore.isAuthenticated) {
    uiStore.showToast('Workflow saved locally. Sign in to sync it.', 'info')
    eventBus.emit('open-login-modal')
    return
  }

  const defaultName = `Workflow ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const name = window.prompt('Name this workflow', defaultName)

  if (name === null) {
    return
  }

  try {
    await workflowLibraryStore.saveCurrentWorkflow(name || defaultName)
  } catch (error) {
    // Error handled via store toast
  }
}

// Clear workflow
function handleClear() {
  if (confirm('Are you sure you want to clear the entire workflow?')) {
    workflowStore.clearWorkflow()
    uiStore.showToast('Workflow cleared', 'info')
  }
}

// Export workflow to JSON file
function handleExport() {
  try {
    const json = workflowStore.exportWorkflow()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    uiStore.showToast('Workflow exported', 'success')
    console.log('[Toolbar] Workflow exported')
  } catch (error: any) {
    console.error('[Toolbar] Export failed:', error)
    uiStore.showToast(`Export failed: ${error.message}`, 'error')
  }
}

// Import workflow from JSON file
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  try {
    const text = await file.text()
    workflowStore.importWorkflow(text)
    uiStore.showToast('Workflow imported successfully', 'success')
    console.log('[Toolbar] Workflow imported')
  } catch (error: any) {
    console.error('[Toolbar] Import failed:', error)
    uiStore.showToast(`Import failed: ${error.message}`, 'error')
  } finally {
    // Reset file input
    if (input) input.value = ''
  }
}
</script>

<template>
  <div class="workflow-toolbar">
    <div class="toolbar-content">
      <!-- Left: Title and Stats -->
      <div class="toolbar-left">
        <h1 class="toolbar-title">
          <FileText :size="20" />
          <span>Workflow Lab</span>
        </h1>
        <div class="toolbar-stats">
          <span class="stat">{{ nodeCount }} node{{ nodeCount !== 1 ? 's' : '' }}</span>
          <span v-if="nodesWithContent > 0" class="stat stat-ready">
            {{ nodesWithContent }} ready
          </span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="toolbar-right">
        <button
          @click="handleAddNode"
          class="toolbar-btn toolbar-btn-primary"
          aria-label="Add new post node to workflow"
        >
          <Plus :size="16" aria-hidden="true" />
          <span>Add Post</span>
        </button>

        <button
          @click="handleAddAnalysisNode"
          class="toolbar-btn toolbar-btn-purple"
          aria-label="Add new analysis node to workflow"
        >
          <Layers :size="16" aria-hidden="true" />
          <span>Add Analysis</span>
        </button>

        <button
          @click="handleExecute"
          :disabled="isExecuting || nodesWithContent === 0"
          class="toolbar-btn toolbar-btn-success"
          :aria-label="isExecuting ? 'Executing workflow' : 'Execute workflow analysis'"
          :aria-busy="isExecuting"
        >
          <Play :size="16" :class="{ 'animate-spin': isExecuting }" aria-hidden="true" />
          <span>{{ isExecuting ? 'Executing...' : 'Execute' }}</span>
        </button>

        <button
          @click="handleSave"
          class="toolbar-btn toolbar-btn-secondary"
          aria-label="Save workflow to local storage"
        >
          <Save :size="16" aria-hidden="true" />
          <span>Save</span>
        </button>

        <!-- Export/Import buttons -->
        <button
          @click="handleExport"
          :disabled="nodeCount === 0"
          class="toolbar-btn toolbar-btn-secondary"
          title="Export workflow as JSON"
          aria-label="Export workflow as JSON file"
        >
          <Download :size="16" aria-hidden="true" />
          <span>Export</span>
        </button>

        <button
          @click="handleImportClick"
          class="toolbar-btn toolbar-btn-secondary"
          title="Import workflow from JSON"
          aria-label="Import workflow from JSON file"
        >
          <Upload :size="16" aria-hidden="true" />
          <span>Import</span>
        </button>

        <!-- Console Toggle -->
        <button
          @click="uiStore.toggleConsole"
          :class="['toolbar-btn toolbar-btn-secondary', { 'active': uiStore.consoleOpen }]"
          title="Toggle Console"
          aria-label="Toggle Console Panel"
        >
          <Terminal :size="16" aria-hidden="true" />
          <span>Console</span>
        </button>

        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          @change="handleFileChange"
          style="display: none"
          aria-label="Select workflow JSON file to import"
        />

        <button
          @click="handleClear"
          :disabled="nodeCount === 0"
          class="toolbar-btn toolbar-btn-danger"
          aria-label="Clear entire workflow"
        >
          <Trash2 :size="16" aria-hidden="true" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-toolbar {
  @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm;
  min-height: 64px;
}

.toolbar-content {
  @apply px-6 py-3 flex items-center justify-between;
}

.toolbar-left {
  @apply flex items-center gap-4;
}

.toolbar-title {
  @apply flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white;
}

.toolbar-stats {
  @apply flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400;
}

.stat {
  @apply px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded;
}

.stat-ready {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.toolbar-right {
  @apply flex items-center gap-2;
}

.toolbar-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.toolbar-btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.toolbar-btn-purple {
  @apply bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600;
}

.toolbar-btn-success {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.toolbar-btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600;
}

.toolbar-btn-danger {
  @apply bg-red-500 text-white hover:bg-red-600;
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar-content {
    @apply flex-col gap-3;
  }

  .toolbar-right {
    @apply w-full overflow-x-auto;
  }

  .toolbar-btn span {
    @apply hidden;
  }
}
</style>
