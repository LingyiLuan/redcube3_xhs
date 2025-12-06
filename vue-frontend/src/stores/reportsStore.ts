// @ts-nocheck
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AnalysisReport } from '@/types/reports'
import { useAuthStore } from './authStore'
import apiClient from '@/services/apiClient'

const STORAGE_KEY = 'redcube-reports'

export const useReportsStore = defineStore('reports', () => {
  // ===== STATE =====
  const reports = ref<AnalysisReport[]>([])
  const activeReportId = ref<string | null>(null)
  const isLoading = ref(false)

  // ===== GETTERS =====
  const unreadReportsCount = computed(() =>
    reports.value.filter(r => !r.isRead).length
  )

  const activeReport = computed(() =>
    reports.value.find(r => r.id === activeReportId.value)
  )

  const sortedReports = computed(() =>
    [...reports.value].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  )

  // ===== PERSISTENCE =====

  function saveToLocalStorage() {
    try {
      // Keep only the 10 most recent reports to prevent quota issues
      const reportsToSave = sortedReports.value.slice(0, 10).map(report => ({
        ...report,
        // Remove large data from localStorage - keep only metadata
        result: {
          id: report.result?.id,
          batchId: report.result?.batchId,
          type: report.result?.type,
          // Don't save large arrays (similar_posts, individual_analyses, etc.)
          // These will be loaded from backend when needed
        }
      }))

      const state = {
        reports: reportsToSave,
        activeReportId: activeReportId.value
      }

      const jsonString = JSON.stringify(state)
      const sizeInKB = new Blob([jsonString]).size / 1024

      // Check size before saving (warn if > 1MB)
      if (sizeInKB > 1024) {
        console.warn(`[ReportsStore] localStorage size is large: ${sizeInKB.toFixed(2)} KB`)
      }

      localStorage.setItem(STORAGE_KEY, jsonString)
      console.log(`[ReportsStore] Saved ${reportsToSave.length} reports (${sizeInKB.toFixed(2)} KB) to localStorage`)
    } catch (error) {
      console.error('[ReportsStore] Failed to save to localStorage:', error)

      // If quota exceeded, clear old data and retry with fewer reports
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[ReportsStore] Quota exceeded, clearing old reports and retrying...')
        try {
          const minimalState = {
            reports: sortedReports.value.slice(0, 3).map(r => ({
              id: r.id,
              timestamp: r.timestamp,
              batchId: r.batchId,
              isRead: r.isRead
            })),
            activeReportId: activeReportId.value
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState))
          console.log('[ReportsStore] Successfully saved minimal state (3 reports)')
        } catch (retryError) {
          console.error('[ReportsStore] Failed even with minimal state:', retryError)
          // Clear the storage key entirely as last resort
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        reports.value = state.reports || []
        activeReportId.value = state.activeReportId || null
        console.log('[ReportsStore] Loaded', reports.value.length, 'reports from localStorage')
      }
    } catch (error) {
      console.error('[ReportsStore] Failed to load from localStorage:', error)
    }
  }

  // NOTE: Auto-save is intentionally disabled to prevent localStorage quota issues
  // Reports persist in memory during the session
  // For cross-session persistence, use fetchReportsFromBackend() on login

  // ===== ACTIONS =====

  function addReport(report: AnalysisReport) {
    console.log('\n' + '='.repeat(80))
    console.log('[REPORTS STORE] 💾 Adding Report')
    console.log('='.repeat(80))
    console.log('[REPORTS STORE] Report ID:', report.id)
    console.log('[REPORTS STORE] Report batchId:', report.batchId)
    console.log('[REPORTS STORE] Report type:', report.result?.type)
    console.log('[REPORTS STORE] individual_analyses:', report.result?.individual_analyses)
    console.log('[REPORTS STORE] individual_analyses count:', report.result?.individual_analyses?.length)
    console.log('[REPORTS STORE] similar_posts:', report.result?.similar_posts)
    console.log('[REPORTS STORE] similar_posts count:', report.result?.similar_posts?.length)

    if (report.result?.similar_posts && report.result.similar_posts.length > 0) {
      console.log('[REPORTS STORE] ✅ First similar post:', {
        post_id: report.result.similar_posts[0].post_id,
        title: report.result.similar_posts[0].title?.substring(0, 50)
      })
    } else {
      console.log('[REPORTS STORE] ❌ NO SIMILAR POSTS in report!')
    }

    // Debug: Degraded mode fields
    console.log('[REPORTS STORE] 🚨 Degraded Mode Check:')
    console.log('[REPORTS STORE]   - extraction_warning:', report.result?.extraction_warning)
    console.log('[REPORTS STORE]   - features_available:', report.result?.features_available)
    console.log('='.repeat(80) + '\n')

    // CRITICAL FIX: Check for existing report with same batchId
    // Same batchId = same content = same report, so UPDATE instead of DUPLICATE
    if (report.batchId) {
      const existingIndex = reports.value.findIndex(r => r.batchId === report.batchId)

      if (existingIndex !== -1) {
        console.log('[ReportsStore] ⚠️ Report with same batchId already exists, updating:', report.batchId)
        console.log('[ReportsStore] Old report ID:', reports.value[existingIndex].id)
        console.log('[ReportsStore] New report ID:', report.id)

        // Update the existing report with new data (keeping the same position)
        reports.value[existingIndex] = report
        console.log('[ReportsStore] ✅ Report updated (no duplicate created)')

        // Save single analysis to localStorage for persistence
        if (report.result?.type === 'single') {
          saveSingleAnalysisToLocalStorage(report)
        }
        return
      }
    }

    // No existing report found, add new one
    reports.value.unshift(report)
    console.log('[ReportsStore] Report added:', report.id)

    // Save single analysis to localStorage for persistence (survives page refresh)
    if (report.result?.type === 'single') {
      saveSingleAnalysisToLocalStorage(report)
    }
  }

  // Save single analysis to localStorage (separate from main reports cache)
  function saveSingleAnalysisToLocalStorage(report: AnalysisReport) {
    try {
      const key = `single-analysis-${report.id}`
      localStorage.setItem(key, JSON.stringify(report))
      console.log('[ReportsStore] Saved single analysis to localStorage:', key)
    } catch (error) {
      console.error('[ReportsStore] Failed to save single analysis to localStorage:', error)
    }
  }

  // Load single analysis from localStorage
  function loadSingleAnalysisFromLocalStorage(reportId: string): AnalysisReport | null {
    try {
      const key = `single-analysis-${reportId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const report = JSON.parse(saved)
        console.log('[ReportsStore] Loaded single analysis from localStorage:', key)
        return report
      }
    } catch (error) {
      console.error('[ReportsStore] Failed to load single analysis from localStorage:', error)
    }
    return null
  }

  function markAsRead(reportId: string) {
    const report = reports.value.find(r => r.id === reportId)
    if (report) {
      report.isRead = true
      console.log('[ReportsStore] Report marked as read:', reportId)
    }
  }

  function markAllAsRead() {
    reports.value.forEach(r => r.isRead = true)
    console.log('[ReportsStore] All reports marked as read')
  }

  function getReportsByWorkflow(workflowId: string) {
    return reports.value.filter(r => r.workflowId === workflowId)
  }

  function getReportsByNode(nodeId: string) {
    return reports.value.filter(r => r.nodeId === nodeId)
  }

  function setActiveReport(reportId: string | null) {
    activeReportId.value = reportId
    if (reportId) {
      markAsRead(reportId)
    }
  }

  function deleteReport(reportId: string) {
    const index = reports.value.findIndex(r => r.id === reportId)
    if (index > -1) {
      reports.value.splice(index, 1)
      if (activeReportId.value === reportId) {
        activeReportId.value = null
      }
      console.log('[ReportsStore] Report deleted:', reportId)
    }
  }

  function clearAll() {
    reports.value = []
    activeReportId.value = null

    // ✅ CRITICAL FIX: Clear localStorage to prevent user data contamination
    // Without this, stale batchIds from one user could leak to another user
    localStorage.removeItem(STORAGE_KEY)

    // Also clear any single-analysis entries (they have dynamic keys)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('single-analysis-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    console.log('[ReportsStore] All reports and localStorage cleared')
  }

  // ===== BACKEND PERSISTENCE =====

  /**
   * Fetch user's reports from backend
   */
  async function fetchReportsFromBackend() {
    const authStore = useAuthStore()

    if (!authStore.userId) {
      console.warn('[ReportsStore] No user ID, skipping reports fetch')
      return
    }

    isLoading.value = true
    console.log('[ReportsStore] Fetching reports from backend for user:', authStore.userId)

    try {
      // ✅ Use apiClient for proper authentication (Bearer token + credentials)
      // Fetch BOTH batch and single analyses in parallel
      const [batchResponse, singleResponse] = await Promise.allSettled([
        apiClient.get('/history?limit=100'),
        apiClient.get('/single-analysis/history?limit=100')
      ])

      // Handle batch reports
      let batchData: any[] = []
      if (batchResponse.status === 'fulfilled') {
        batchData = batchResponse.value.data || []
        console.log('[ReportsStore] ✅ Fetched batch reports:', batchData.length)
      } else {
        console.error('[ReportsStore] ❌ Failed to fetch batch reports:', batchResponse.reason)
      }

      // Handle single analyses
      let singleData: any[] = []
      if (singleResponse.status === 'fulfilled') {
        singleData = singleResponse.value.data || []
        console.log('[ReportsStore] ✅ Fetched single analyses:', singleData.length)
      } else {
        console.error('[ReportsStore] ❌ Failed to fetch single analyses:', singleResponse.reason)
      }

      console.log('[ReportsStore] ✅ Fetched', batchData.length, 'batch reports and', singleData.length, 'single analyses from backend')

      // Convert batch analyses to report format
      const batchReports: AnalysisReport[] = batchData.map((analysis: any) => ({
        id: `report-${analysis.id}`,
        nodeId: `node-${analysis.id}`,
        workflowId: 'default-workflow',
        timestamp: analysis.created_at || new Date().toISOString(),
        batchId: analysis.batch_id,
        analysisId: analysis.id,
        result: {
          ...analysis,
          type: 'batch'
        },
        isRead: false
      }))

      // Convert single analyses to report format
      // Try to load full data from localStorage first, fallback to minimal metadata
      const singleReports: AnalysisReport[] = singleData.map((analysis: any) => {
        const reportId = `report-${analysis.id}`
        const cached = loadSingleAnalysisFromLocalStorage(reportId)

        if (cached) {
          // Use cached full report data from localStorage
          console.log('[ReportsStore] Using full single analysis from localStorage:', reportId)
          return cached
        }

        if (analysis.full_result) {
          console.log('[ReportsStore] Using full single analysis from backend:', reportId)
          return {
            id: reportId,
            nodeId: `node-${analysis.id}`,
            workflowId: 'default-workflow',
            timestamp: analysis.created_at || new Date().toISOString(),
            analysisId: analysis.id,
            result: analysis.full_result,
            isRead: false
          }
        }

        // Fallback: Create minimal report with basic metadata only
        console.log('[ReportsStore] No full result available, creating minimal report:', reportId)
        return {
          id: reportId,
          nodeId: `node-${analysis.id}`,
          workflowId: 'default-workflow',
          timestamp: analysis.created_at || new Date().toISOString(),
          analysisId: analysis.id,
          result: {
            id: analysis.id,
            overview: {
              company: analysis.company,
              role: analysis.role,
              outcome: analysis.outcome,
              difficulty: analysis.difficulty,
              interviewDate: analysis.created_at
            },
            type: 'single'
          },
          isRead: false
        }
      })

      // Combine both types
      const allBackendReports = [...batchReports, ...singleReports]

      // Merge with existing reports instead of replacing
      // Keep workflow-created reports that aren't in the backend yet
      const existingReportIds = new Set(allBackendReports.map(r => r.id))
      const workflowReports = reports.value.filter(r => !r.id.startsWith('report-') || !existingReportIds.has(r.id))

      reports.value = [...workflowReports, ...allBackendReports]
      console.log('[ReportsStore] Successfully loaded', batchReports.length, 'batch reports,', singleReports.length, 'single reports,', workflowReports.length, 'workflow reports retained')
    } catch (error) {
      console.error('[ReportsStore] Failed to fetch reports:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Initialize store - Load reports from backend database on startup
   */
  async function initialize() {
    console.log('[ReportsStore] Initializing...')

    // Wait for auth to be ready before fetching reports
    const authStore = useAuthStore()
    if (authStore.userId) {
      console.log('[ReportsStore] Auto-loading reports from backend...')
      await fetchReportsFromBackend()
    } else {
      console.log('[ReportsStore] No user logged in, skipping backend sync')
    }
  }

  // Note: Auto-initialization removed to prevent race conditions
  // Call initialize() explicitly after auth is ready

  // ===== RETURN PUBLIC API =====

  // Load reports from localStorage immediately (single-analysis persistence)
  if (typeof window !== 'undefined') {
    loadFromLocalStorage()
  }

  return {
    // State
    reports,
    activeReportId,
    isLoading,

    // Getters
    unreadReportsCount,
    activeReport,
    sortedReports,

    // Actions
    addReport,
    markAsRead,
    markAllAsRead,
    getReportsByWorkflow,
    getReportsByNode,
    setActiveReport,
    deleteReport,
    clearAll,
    fetchReportsFromBackend,
    initialize,
    saveToLocalStorage,
    loadFromLocalStorage,
    loadSingleAnalysisFromLocalStorage // Expose for ReportViewer to use
  }
})
