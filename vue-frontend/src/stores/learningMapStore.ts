import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LearningMap } from '@/types/reports'
import { useAuthStore } from './authStore'
import { useReportsStore } from './reportsStore'
import apiClient from '@/services/apiClient'

// Pending map type for in-progress generation
export interface PendingMap {
  id: string // Temporary ID like 'pending-123'
  title: string // Company names from batch report
  status: 'generating' | 'error'
  progress: { phase: number; message: string; percent: number }
  startedAt: Date
  error?: string
}

export const useLearningMapStore = defineStore('learningMap', () => {
  // ===== STATE =====
  const maps = ref<LearningMap[]>([])
  const activeMapId = ref<string | null>(null)
  const isGenerating = ref(false)
  const generationProgress = ref<{ phase: number; message: string; percent: number } | null>(null)

  // Pending maps - maps that are currently being generated
  const pendingMaps = ref<PendingMap[]>([])

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

  // Helper to extract company names from a batch report
  function getCompanyNamesFromReport(report: any): string {
    // Extract from individual_analyses
    if (report.result?.individual_analyses && Array.isArray(report.result.individual_analyses)) {
      const companies = [...new Set(
        report.result.individual_analyses
          .map((analysis: any) => analysis.company)
          .filter((c: string) => c && c !== 'Unknown' && c !== 'unknown')
      )] as string[]

      if (companies.length > 0) {
        if (companies.length > 3) {
          return `${companies.slice(0, 3).join(', ')} +${companies.length - 3}`
        }
        return companies.join(', ')
      }
    }
    return 'Learning Map'
  }

  async function generateMap(reportIds: string[], _useRAG: boolean = false, title?: string, description?: string) {
    const authStore = useAuthStore()
    const reportsStore = useReportsStore()

    // Validate inputs
    if (reportIds.length !== 1) {
      throw new Error('Please select exactly one batch analysis report to generate a learning map.')
    }

    const reportId = reportIds[0]
    const report = reportsStore.reports.find(r => r.id === reportId)

    if (!report) {
      throw new Error('Report not found')
    }

    if (!report.batchId) {
      throw new Error('Learning maps can only be generated from batch analysis reports. Please run a batch analysis first.')
    }

    // Create a pending map immediately
    const pendingId = `pending-${Date.now()}`
    const mapTitle = title || getCompanyNamesFromReport(report)
    const pendingMap: PendingMap = {
      id: pendingId,
      title: mapTitle,
      status: 'generating',
      progress: { phase: 0, message: 'Starting...', percent: 0 },
      startedAt: new Date()
    }
    pendingMaps.value.unshift(pendingMap) // Add to beginning of array

    // Set global generating state
    isGenerating.value = true
    generationProgress.value = { phase: 0, message: 'Starting...', percent: 0 }

    console.log('[LearningMapStore] Created pending map:', pendingId)
    console.log('[LearningMapStore] Generating from batch report:', report.batchId)

    // Use SSE streaming endpoint to avoid Cloudflare timeout
    const apiBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const streamUrl = `${apiBaseUrl}/api/content/learning-map/stream`

    return new Promise<LearningMap>((resolve, reject) => {
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
          buffer = lines.pop() || ''

          let eventType = ''
          let eventData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6)
            } else if (line === '' && eventType && eventData) {
              try {
                const data = JSON.parse(eventData)
                console.log('[LearningMapStore] SSE Event:', eventType, data)

                if (eventType === 'progress') {
                  // Update both the pending map and global progress
                  const progressData = {
                    phase: data.phase,
                    message: data.message,
                    percent: data.percent
                  }
                  generationProgress.value = progressData

                  // Update the pending map's progress
                  const pending = pendingMaps.value.find(p => p.id === pendingId)
                  if (pending) {
                    pending.progress = progressData
                  }
                } else if (eventType === 'complete') {
                  // Remove pending map
                  const pendingIndex = pendingMaps.value.findIndex(p => p.id === pendingId)
                  if (pendingIndex > -1) {
                    pendingMaps.value.splice(pendingIndex, 1)
                  }

                  // Add completed map
                  const newMap: LearningMap = {
                    ...data.data,
                    id: String(data.data.id),
                    createdAt: new Date()
                  }
                  maps.value.unshift(newMap) // Add to beginning
                  activeMapId.value = newMap.id

                  // Clear generating state
                  isGenerating.value = false
                  generationProgress.value = null

                  console.log('[LearningMapStore] Learning map generated:', newMap.id)
                  resolve(newMap)
                  return
                } else if (eventType === 'error') {
                  // Mark pending map as error
                  const pending = pendingMaps.value.find(p => p.id === pendingId)
                  if (pending) {
                    pending.status = 'error'
                    pending.error = data.message || 'Generation failed'
                  }

                  isGenerating.value = false
                  generationProgress.value = null

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

        // Stream ended without complete event - but backend might have saved the data
        // Show "checking" status instead of error, then auto-refresh
        console.log('[LearningMapStore] Stream ended unexpectedly, checking if map was saved...')

        const pending = pendingMaps.value.find(p => p.id === pendingId)
        if (pending) {
          pending.progress = { phase: 5, message: 'Checking if saved...', percent: 95 }
        }

        // Wait a bit for backend to finish saving, then refresh
        setTimeout(async () => {
          const prevMapCount = maps.value.length
          await fetchUserMaps()

          // Check if we now have a new map (backend saved it despite stream ending)
          const pendingToRemove = pendingMaps.value.find(p => p.id === pendingId)
          if (pendingToRemove) {
            const pendingIndex = pendingMaps.value.findIndex(p => p.id === pendingId)
            if (pendingIndex > -1) {
              pendingMaps.value.splice(pendingIndex, 1)
            }
          }

          // If we got a new map, it worked! Otherwise show subtle message
          if (maps.value.length > prevMapCount) {
            console.log('[LearningMapStore] Map was saved successfully despite stream disconnect')
          }
        }, 5000) // Wait 5 seconds for backend to finish

        isGenerating.value = false
        generationProgress.value = null
        // Don't reject with error - resolve undefined since we're auto-handling this
        resolve(undefined as any)
      }).catch(error => {
        console.error('[LearningMapStore] SSE Error:', error)

        // Mark pending map as error
        const pending = pendingMaps.value.find(p => p.id === pendingId)
        if (pending) {
          pending.status = 'error'
          pending.error = error.message || 'Generation failed'
        }

        isGenerating.value = false
        generationProgress.value = null
        reject(error)
      })
    })
  }

  // Remove a pending map (e.g., dismiss error)
  function removePendingMap(pendingId: string) {
    const index = pendingMaps.value.findIndex(p => p.id === pendingId)
    if (index > -1) {
      pendingMaps.value.splice(index, 1)
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
    pendingMaps,

    // Getters
    activeMap,
    sortedMaps,

    // Actions
    generateMap,
    fetchUserMaps,
    setActiveMap,
    deleteMap,
    clearAll,
    removePendingMap
  }
})
