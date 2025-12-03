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
  const generationProgress = ref<{ phase: number; message: string; percent: number } | null>(null)

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
    generationProgress.value = { phase: 0, message: 'Starting...', percent: 0 }
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

      // Use SSE streaming endpoint to avoid Cloudflare timeout
      const apiBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const streamUrl = `${apiBaseUrl}/api/content/learning-map/stream`

      return new Promise<LearningMap>((resolve, reject) => {
        // Create POST request with fetch for SSE (EventSource only supports GET)
        fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          credentials: 'include',
          body: JSON.stringify({
            reportId: report.batchId,
            userId: authStore.userId,
            userGoals: { title, description }
          })
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Process complete SSE events
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer

            let eventType = ''
            let eventData = ''

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim()
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6)
              } else if (line === '' && eventType && eventData) {
                // Process complete event
                try {
                  const data = JSON.parse(eventData)
                  console.log('[LearningMapStore] SSE Event:', eventType, data)

                  if (eventType === 'progress') {
                    generationProgress.value = {
                      phase: data.phase,
                      message: data.message,
                      percent: data.percent
                    }
                  } else if (eventType === 'complete') {
                    const newMap: LearningMap = {
                      ...data.data,
                      id: String(data.data.id),
                      createdAt: new Date()
                    }
                    maps.value.push(newMap)
                    activeMapId.value = newMap.id
                    console.log('[LearningMapStore] Learning map generated:', newMap.id)
                    resolve(newMap)
                    return
                  } else if (eventType === 'error') {
                    reject(new Error(data.message || 'Generation failed'))
                    return
                  }
                } catch (e) {
                  console.warn('[LearningMapStore] Failed to parse SSE data:', eventData)
                }
                eventType = ''
                eventData = ''
              }
            }
          }

          // If we get here without complete event, something went wrong
          reject(new Error('Stream ended without complete event'))
        }).catch(error => {
          console.error('[LearningMapStore] SSE Error:', error)
          reject(error)
        })
      })
    } catch (error: any) {
      console.error('[LearningMapStore] Failed to generate map:', error)
      throw error
    } finally {
      isGenerating.value = false
      generationProgress.value = null
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
    generationProgress,

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
