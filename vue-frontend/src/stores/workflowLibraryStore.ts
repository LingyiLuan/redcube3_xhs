import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { workflowLibraryService } from '@/services/workflowLibraryService'
import { useWorkflowStore } from './workflowStore'
import { useUIStore } from './uiStore'
import { useAuthStore } from './authStore'

interface WorkflowListItem {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  workflowJson?: any
}

function generateDefaultName() {
  const date = new Date()
  return `Workflow ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export const useWorkflowLibraryStore = defineStore('workflowLibrary', () => {
  const workflows = ref<WorkflowListItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const activeWorkflowId = ref<number | null>(null)

  const uiStore = useUIStore()
  const authStore = useAuthStore()

  const sortedWorkflows = computed(() =>
    [...workflows.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  )

  async function fetchWorkflows() {
    if (!authStore.isAuthenticated) {
      reset()
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const list = await workflowLibraryService.list()
      workflows.value = list as WorkflowListItem[]
    } catch (err: any) {
      console.error('[WorkflowLibraryStore] Failed to load workflows', err)
      error.value = err.message || 'Failed to load workflows'
    } finally {
      isLoading.value = false
    }
  }

  async function saveCurrentWorkflow(name?: string) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    const workflowStore = useWorkflowStore()
    const serialized = workflowStore.serializeWorkflowState()

    isSaving.value = true
    try {
      const payload = {
        name: name?.trim() || generateDefaultName(),
        workflow: serialized
      }

      const saved = await workflowLibraryService.create(payload)
      workflows.value = [saved as WorkflowListItem, ...workflows.value.filter(w => w.id !== saved.id)]
      activeWorkflowId.value = saved.id
      uiStore.showToast('Workflow saved to your library', 'success')
      return saved
    } catch (err: any) {
      console.error('[WorkflowLibraryStore] Failed to save workflow', err)
      uiStore.showToast('Failed to save workflow', 'error')
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function loadWorkflow(workflowId: number) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      const workflow = await workflowLibraryService.fetch(workflowId)
      if (!workflow?.workflowJson) {
        uiStore.showToast('Saved workflow is empty', 'warning')
        return null
      }

      const workflowStore = useWorkflowStore()
      workflowStore.importWorkflow(JSON.stringify(workflow.workflowJson))
      activeWorkflowId.value = Number(workflow.id)
      uiStore.showToast(`Loaded “${workflow.name}”`, 'success')
      return workflow
    } catch (err: any) {
      console.error('[WorkflowLibraryStore] Failed to load workflow', err)
      uiStore.showToast('Failed to load workflow', 'error')
      throw err
    }
  }

  async function deleteWorkflow(workflowId: number) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      await workflowLibraryService.remove(workflowId)
      workflows.value = workflows.value.filter(w => w.id !== workflowId)
      if (activeWorkflowId.value === workflowId) {
        activeWorkflowId.value = null
      }
      uiStore.showToast('Workflow deleted', 'info')
    } catch (err: any) {
      console.error('[WorkflowLibraryStore] Failed to delete workflow', err)
      uiStore.showToast('Failed to delete workflow', 'error')
      throw err
    }
  }

  function setActiveWorkflow(workflowId: number | null) {
    activeWorkflowId.value = workflowId
  }

  function reset() {
    workflows.value = []
    activeWorkflowId.value = null
    error.value = null
  }

  return {
    workflows,
    sortedWorkflows,
    isLoading,
    isSaving,
    error,
    activeWorkflowId,
    fetchWorkflows,
    saveCurrentWorkflow,
    loadWorkflow,
    deleteWorkflow,
    setActiveWorkflow,
    reset
  }
})

