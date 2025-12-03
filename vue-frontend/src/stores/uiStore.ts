import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

export type ContentView = 'workflow' | 'reports-list' | 'learning-maps-list' | 'report-detail' | 'learning-map-detail'

const UI_STATE_KEY = 'redcube-ui-state'

export const useUIStore = defineStore('ui', () => {
  // ===== STATE =====
  const mode = ref<'light' | 'dark'>('light')
  const sidebarCollapsed = ref(false)
  const sidebarOpen = ref(true) // Left sidebar for Runway-style layout
  const inspectorOpen = ref(false)
  const assistantOpen = ref(false)
  const inspectorActiveTab = ref<'node' | 'reports' | 'map'>('node')
  const toasts = ref<Toast[]>([])

  // Content area state - manages what's displayed in main canvas area
  const contentView = ref<ContentView>('workflow')
  const activeContentId = ref<string | null>(null)
  
  // Reports filter state
  const reportFilter = ref<'all' | 'unread' | 'batch' | 'single'>('all')

  // Console state
  const consoleOpen = ref(false)
  const consoleHeight = ref(300) // Default height in pixels

  // Canvas control state - for communication between toolbar and canvas
  const canvasCommand = ref<'zoomIn' | 'zoomOut' | 'fitView' | null>(null)
  const canvasLabelsVisible = ref(true)

  // ===== ACTIONS =====

  function setMode(newMode: 'light' | 'dark') {
    mode.value = newMode
    // Update DOM class for Tailwind dark mode
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newMode)
  }

  function toggleMode() {
    setMode(mode.value === 'light' ? 'dark' : 'light')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    sidebarOpen.value = !sidebarOpen.value
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openInspector() {
    inspectorOpen.value = true
  }

  function closeInspector() {
    inspectorOpen.value = false
  }

  function toggleInspector() {
    inspectorOpen.value = !inspectorOpen.value
  }

  function openAssistant() {
    assistantOpen.value = true
  }

  function closeAssistant() {
    assistantOpen.value = false
  }

  function toggleAssistant() {
    assistantOpen.value = !assistantOpen.value
  }

  function setInspectorTab(tab: 'node' | 'reports' | 'map') {
    inspectorActiveTab.value = tab
  }

  // Console actions
  function openConsole() {
    consoleOpen.value = true
  }

  function closeConsole() {
    consoleOpen.value = false
  }

  function toggleConsole() {
    consoleOpen.value = !consoleOpen.value
  }

  function setConsoleHeight(height: number) {
    // Constrain between 200px and 80% of window height
    const maxHeight = window.innerHeight * 0.8
    consoleHeight.value = Math.max(200, Math.min(maxHeight, height))
  }

  function showToast(message: string, type: ToastType = 'info', duration = 3000) {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration
    }

    toasts.value.push(toast)

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(toast.id)
    }, duration)

    return toast.id
  }

  function removeToast(toastId: string) {
    toasts.value = toasts.value.filter(t => t.id !== toastId)
  }

  // Initialize theme from localStorage
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setMode(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }
  }

  // Initialize UI state from localStorage
  function initializeUIState() {
    try {
      const saved = localStorage.getItem(UI_STATE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        if (state.contentView) {
          contentView.value = state.contentView
        }
        if (state.activeContentId) {
          activeContentId.value = state.activeContentId
        }
        console.log('[UIStore] Restored UI state from localStorage:', state)
      }
    } catch (error) {
      console.error('[UIStore] Failed to restore UI state:', error)
    }

    // Watch for changes and persist to localStorage
    watch([contentView, activeContentId], () => {
      try {
        const state = {
          contentView: contentView.value,
          activeContentId: activeContentId.value
        }
        localStorage.setItem(UI_STATE_KEY, JSON.stringify(state))
        console.log('[UIStore] Saved UI state to localStorage:', state)
      } catch (error) {
        console.error('[UIStore] Failed to save UI state:', error)
      }
    })
  }

  // Content area navigation
  function showWorkflow() {
    console.log('[UIStore] showWorkflow() called, setting contentView to "workflow"')
    contentView.value = 'workflow'
    activeContentId.value = null
    console.log('[UIStore] showWorkflow() complete, contentView is now:', contentView.value)
  }

  function showReportsList() {
    console.log('[UIStore] showReportsList() called, current contentView:', contentView.value)
    contentView.value = 'reports-list'
    activeContentId.value = null
    console.log('[UIStore] showReportsList() complete, contentView is now:', contentView.value)
  }

  function showLearningMapsList() {
    console.log('[UIStore] showLearningMapsList() called, current contentView:', contentView.value)
    contentView.value = 'learning-maps-list'
    activeContentId.value = null
    console.log('[UIStore] showLearningMapsList() complete, contentView is now:', contentView.value)
  }

  function showReportDetail(reportId: string) {
    contentView.value = 'report-detail'
    activeContentId.value = reportId
  }

  function showLearningMapDetail(mapId: string) {
    contentView.value = 'learning-map-detail'
    activeContentId.value = mapId
  }

  function setReportFilter(filter: 'all' | 'unread' | 'batch' | 'single') {
    reportFilter.value = filter
  }

  // Canvas control actions - trigger commands that WorkflowCanvas will listen to
  function triggerCanvasZoomIn() {
    canvasCommand.value = 'zoomIn'
  }

  function triggerCanvasZoomOut() {
    canvasCommand.value = 'zoomOut'
  }

  function triggerCanvasFitView() {
    canvasCommand.value = 'fitView'
  }

  function clearCanvasCommand() {
    canvasCommand.value = null
  }

  function toggleCanvasLabels() {
    canvasLabelsVisible.value = !canvasLabelsVisible.value
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    mode,
    sidebarCollapsed,
    sidebarOpen,
    inspectorOpen,
    assistantOpen,
    inspectorActiveTab,
    toasts,
    consoleOpen,
    consoleHeight,
    reportFilter,
    contentView,
    activeContentId,
    canvasCommand,
    canvasLabelsVisible,

    // Actions
    setMode,
    toggleMode,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    openInspector,
    closeInspector,
    toggleInspector,
    setInspectorTab,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    openConsole,
    closeConsole,
    toggleConsole,
    setConsoleHeight,
    showToast,
    removeToast,
    initializeTheme,
    initializeUIState,
    showWorkflow,
    showReportsList,
    showLearningMapsList,
    showReportDetail,
    showLearningMapDetail,
    setReportFilter,
    triggerCanvasZoomIn,
    triggerCanvasZoomOut,
    triggerCanvasFitView,
    clearCanvasCommand,
    toggleCanvasLabels
  }
})
