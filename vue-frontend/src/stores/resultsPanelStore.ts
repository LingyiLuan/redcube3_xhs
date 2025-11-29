import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ResultsContentType = 'report' | 'learningMap' | null

export const useResultsPanelStore = defineStore('resultsPanel', () => {
  // ===== STATE =====
  const isPanelOpen = ref(false)
  const panelWidth = ref(45) // Percentage of viewport width
  const activeContentType = ref<ResultsContentType>(null)
  const activeContentId = ref<string | null>(null)

  // ===== ACTIONS =====

  /**
   * Open the results panel with a report
   */
  function openReport(reportId: string) {
    activeContentType.value = 'report'
    activeContentId.value = reportId
    isPanelOpen.value = true
  }

  /**
   * Open the results panel with a learning map
   */
  function openLearningMap(mapId: string) {
    activeContentType.value = 'learningMap'
    activeContentId.value = mapId
    isPanelOpen.value = true
  }

  /**
   * Close the results panel
   */
  function closePanel() {
    isPanelOpen.value = false
    // Delay clearing content for smooth animation
    setTimeout(() => {
      if (!isPanelOpen.value) {
        activeContentType.value = null
        activeContentId.value = null
      }
    }, 300)
  }

  /**
   * Set panel width (percentage)
   */
  function setPanelWidth(width: number) {
    // Constrain between 30% and 70%
    panelWidth.value = Math.max(30, Math.min(70, width))
  }

  /**
   * Toggle panel open/closed
   */
  function togglePanel() {
    if (isPanelOpen.value) {
      closePanel()
    } else {
      isPanelOpen.value = true
    }
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    isPanelOpen,
    panelWidth,
    activeContentType,
    activeContentId,

    // Actions
    openReport,
    openLearningMap,
    closePanel,
    setPanelWidth,
    togglePanel
  }
})
