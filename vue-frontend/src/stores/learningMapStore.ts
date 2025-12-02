import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LearningMap } from '@/types/reports'
import { useAuthStore } from './authStore'
import { useReportsStore } from './reportsStore'
import apiClient from '@/services/apiClient'

export const useLearningMapStore = defineStore('learningMap', () => {
  // ===== STATE =====
  const maps = ref<LearningMap[]>([])
  const activeMapId = ref<string | null>(null)
  const isGenerating = ref(false)

  // ===== GETTERS =====
  const activeMap = computed(() =>
    maps.value.find(m => m.id === activeMapId.value)
  )

  const sortedMaps = computed(() =>
    [...maps.value].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  )

  // ===== ACTIONS =====

  async function generateMap(reportIds: string[], useRAG: boolean = false, title?: string, description?: string) {
    isGenerating.value = true
    const authStore = useAuthStore()
    const reportsStore = useReportsStore()

    try {
      // ✅ NEW PATH: Use reportId directly for batch reports (comprehensive analysis)
      // This uses the enhanced learningMapGeneratorService with foundation pool
      if (reportIds.length !== 1) {
        throw new Error('Please select exactly one batch analysis report to generate a learning map.')
      }

      const reportId = reportIds[0]
      const report = reportsStore.reports.find(r => r.id === reportId)

      if (!report) {
        throw new Error('Report not found')
      }

      // Validate it's a batch report (has batchId)
      if (!report.batchId) {
        throw new Error('Learning maps can only be generated from batch analysis reports. Please run a batch analysis first.')
      }

      console.log('[LearningMapStore] Generating learning map from batch report:', report.batchId)
      console.log('[LearningMapStore] Report ID:', reportId)

      // Call the content service API with reportId via apiClient (uses correct API gateway URL)
      const response = await apiClient.post('/learning-map', {
        reportId: report.batchId,  // Use batchId as reportId (e.g., "batch_1_abc123")
        userId: authStore.userId,
        userGoals: {
          title,
          description
        }
      })

      const data = response.data
      console.log('[LearningMapStore] Backend response:', data)

      const newMap: LearningMap = {
        ...data.data,
        id: String(data.data.id), // Ensure ID is a string
        createdAt: new Date()
      }

      maps.value.push(newMap)
      activeMapId.value = newMap.id

      console.log('[LearningMapStore] Learning map generated:', newMap.id)
      return newMap
    } catch (error: any) {
      console.error('[LearningMapStore] Failed to generate map:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  async function fetchUserMaps() {
    const authStore = useAuthStore()

    if (!authStore.userId) {
      console.warn('[LearningMapStore] No user ID, skipping maps fetch')
      return
    }

    console.log('[LearningMapStore] Fetching learning maps for user:', authStore.userId)

    try {
      // ✅ SECURITY FIX: Remove userId from query params - backend uses authenticated session
      // Uses apiClient which has correct API gateway URL and sends credentials
      const response = await apiClient.get('/learning-maps/history?limit=100')

      const data = response.data
      console.log('[LearningMapStore] API Response:', data)

      // Backend returns { success: true, data: { maps: [...], totalCount: N } }
      const fetchedMaps = data.data?.maps || data.learningMaps || data.maps || []

      // Ensure all IDs are strings and normalize field names
      maps.value = fetchedMaps.map((map: any) => ({
        ...map,
        id: String(map.id),
        // Normalize created_at to createdAt (backend uses snake_case)
        createdAt: map.createdAt || map.created_at || new Date().toISOString()
      }))

      console.log('[LearningMapStore] Fetched', maps.value.length, 'learning maps')
    } catch (error: any) {
      console.error('[LearningMapStore] Failed to fetch maps:', error)
      // Don't throw - just log the error and continue with empty maps
    }
  }

  function setActiveMap(mapId: string | null) {
    activeMapId.value = mapId
  }

  function deleteMap(mapId: string) {
    const index = maps.value.findIndex(m => m.id === mapId)
    if (index > -1) {
      maps.value.splice(index, 1)
      if (activeMapId.value === mapId) {
        activeMapId.value = null
      }
      console.log('[LearningMapStore] Map deleted:', mapId)
    }
  }

  function clearAll() {
    maps.value = []
    activeMapId.value = null
    console.log('[LearningMapStore] All maps cleared')
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    maps,
    activeMapId,
    isGenerating,

    // Getters
    activeMap,
    sortedMaps,

    // Actions
    generateMap,
    fetchUserMaps,
    setActiveMap,
    deleteMap,
    clearAll
  }
})
