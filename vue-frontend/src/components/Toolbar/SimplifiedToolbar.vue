<template>
  <div class="simplified-toolbar">
    <div class="toolbar-content">
      <!-- Left: Title only -->
      <div class="toolbar-left">
        <span class="workflow-title">{{ pageTitle }}</span>
      </div>

      <!-- Right: Context-aware action buttons -->
      <div class="toolbar-right">
        <!-- Workflow view: Save and Run buttons -->
        <template v-if="contentView === 'workflow'">
          <button
            @click="handleSave"
            class="toolbar-btn toolbar-btn-secondary"
            title="Save workflow"
          >
            <Save :size="18" />
            <span>Save</span>
          </button>

          <button
            @click="handleExecute"
            :disabled="isExecuting || nodesWithContent === 0"
            class="toolbar-btn toolbar-btn-primary"
            :class="{ 'executing': isExecuting }"
            title="Execute workflow"
          >
            <Play v-if="!isExecuting" :size="18" />
            <Loader2 v-else :size="18" class="animate-spin" />
            <span>{{ isExecuting ? 'Running...' : 'Run' }}</span>
          </button>
        </template>

        <!-- Reports view: Mark All Read button -->
        <template v-else-if="contentView === 'reports-list'">
          <button
            v-if="sortedReports.length > 0"
            @click="handleMarkAllRead"
            class="toolbar-btn toolbar-btn-secondary"
            title="Mark all reports as read"
          >
            <span>Mark All Read</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { Save, Play, Loader2 } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useReportsStore } from '@/stores/reportsStore'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowLibraryStore } from '@/stores/workflowLibraryStore'
import { useEventBus } from '@/utils/eventBus'
import { storeToRefs } from 'pinia'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const reportsStore = useReportsStore()
const authStore = useAuthStore()
const workflowLibraryStore = useWorkflowLibraryStore()
const eventBus = useEventBus()
const { nodes, isExecuting } = storeToRefs(workflowStore)
const { contentView } = storeToRefs(uiStore)
const { sortedReports } = storeToRefs(reportsStore)

onMounted(() => {
  console.log('[SimplifiedToolbar] Component mounted, contentView:', contentView.value)
})

// Watch contentView changes
watch(contentView, (newVal, oldVal) => {
  console.log('[SimplifiedToolbar] contentView changed from', oldVal, 'to', newVal)
}, { immediate: true })

const nodesWithContent = computed(() =>
  nodes.value.filter(n => n.type === 'input' && n.data.content?.trim()).length
)

// Dynamic page title
const pageTitle = computed(() => {
  const title = contentView.value === 'reports-list' ? 'Analysis Reports'
    : contentView.value === 'report-detail' ? 'Analysis Report'
    : contentView.value === 'learning-maps-list' ? 'Learning Maps'
    : contentView.value === 'learning-map-detail' ? 'Learning Map'
    : 'Workflow Lab'

  console.log('[SimplifiedToolbar] pageTitle computed, contentView:', contentView.value, '-> title:', title)
  return title
})

// Save workflow
async function handleSave() {
  workflowStore.saveWorkflow() // Save to localStorage first

  if (!authStore.isAuthenticated) {
    uiStore.showToast('Workflow saved locally. Sign in to sync it.', 'info')
    eventBus.emit('open-login-modal')
    return
  }

  const defaultName = `Workflow ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const name = window.prompt('Name this workflow', defaultName)

  if (name === null) { // User cancelled
    return
  }

  try {
    await workflowLibraryStore.saveCurrentWorkflow(name || defaultName)
  } catch (error) {
    // Error handled via store toast
  }
}

// Execute workflow
async function handleExecute() {
  if (nodesWithContent.value === 0) {
    uiStore.showToast('No nodes with content to analyze', 'warning')
    return
  }

  try {
    const results = await workflowStore.executeWorkflow()
    console.log('[SimplifiedToolbar] Execution results:', results)
  } catch (error: any) {
    console.error('[SimplifiedToolbar] Execution failed:', error)
  }
}

// Mark all reports as read
function handleMarkAllRead() {
  reportsStore.markAllAsRead()
  uiStore.showToast('All reports marked as read', 'success')
}
</script>

<style scoped>
.simplified-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  z-index: 50;
  transition: margin-left 0.3s ease;
}

.toolbar-content {
  height: 100%;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.workflow-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn-secondary {
  background: transparent;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.toolbar-btn-secondary:hover:not(:disabled) {
  background: #F3F4F6;
  border-color: #9CA3AF;
  color: #1F2937;
}

.toolbar-btn-primary {
  background: #3B82F6;
  color: #FFFFFF;
}

.toolbar-btn-primary:hover:not(:disabled) {
  background: #2563EB;
}

.toolbar-btn-primary.executing {
  background: #1E40AF;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .toolbar-content {
    grid-template-columns: auto auto;
    padding: 0 12px;
  }

  .toolbar-center {
    display: none;
  }

  .toolbar-btn span {
    display: none;
  }

  .toolbar-btn {
    padding: 8px 12px;
  }
}
</style>
