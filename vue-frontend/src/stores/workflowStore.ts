// @ts-nocheck
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { WorkflowNode, WorkflowEdge, ExecutionResults, Viewport } from '@/types/workflow'
import { analysisService } from '@/services/analysisService'
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'
import { useHistory } from '@/composables/useHistory'

// Storage key for persistence
const STORAGE_KEY = 'redcube-workflow-vue'
const AUTOSAVE_DELAY = 1500 // ms

export const useWorkflowStore = defineStore('workflow', () => {
  // ===== STATE =====
  const workflowId = ref('default-workflow')
  const nodes = ref<WorkflowNode[]>([])
  const edges = ref<WorkflowEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const selectedNodeIds = ref<string[]>([]) // Multi-select support
  const selectedEdgeId = ref<string | null>(null) // Edge selection support
  const viewport = ref<Viewport>({ x: 0, y: 0, zoom: 1 })

  // Execution state
  const isExecuting = ref(false)
  const executionResults = ref<ExecutionResults | null>(null)

  // Abort controller management for cancelling in-flight requests
  const activeRequests = ref<Map<string, AbortController>>(new Map())

  // Helper functions for abort controller management
  function createAbortController(nodeId: string): AbortController {
    // Cancel any existing request for this node
    const existing = activeRequests.value.get(nodeId)
    if (existing) {
      console.log(`[WorkflowStore] Aborting existing request for node ${nodeId}`)
      existing.abort()
    }

    const controller = new AbortController()
    activeRequests.value.set(nodeId, controller)
    console.log(`[WorkflowStore] Created AbortController for node ${nodeId}`)
    return controller
  }

  function clearAbortController(nodeId: string) {
    activeRequests.value.delete(nodeId)
    console.log(`[WorkflowStore] Cleared AbortController for node ${nodeId}`)
  }

  function abortAnalysis(nodeId: string) {
    const controller = activeRequests.value.get(nodeId)
    if (controller) {
      controller.abort()
      clearAbortController(nodeId)
      updateNodeData(nodeId, {
        status: 'cancelled',
        error: 'Analysis cancelled by user'
      })
      useUIStore().showToast('Analysis cancelled', 'info')
      console.log(`[WorkflowStore] Analysis aborted for node ${nodeId}`)
    }
  }

  // Persistence state
  const isDirty = ref(false)
  const lastSavedAt = ref<string | null>(null)
  const version = ref(1)

  // Freemium tracking - DISABLED FOR FREE TIER
  const analysesCount = ref(0)
  const maxFreeAnalyses = ref(999) // Unlimited for now to attract users

  // ===== HISTORY (Undo/Redo) =====
  interface WorkflowSnapshot {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
  }

  const history = useHistory<WorkflowSnapshot>(
    { nodes: [], edges: [] },
    15 // Keep last 15 states
  )

  // Track changes and push to history (debounced to avoid too many snapshots)
  let historyTimeout: ReturnType<typeof setTimeout> | null = null
  function pushToHistory(description?: string) {
    if (historyTimeout) clearTimeout(historyTimeout)

    historyTimeout = setTimeout(() => {
      // Pass reactive refs directly - useHistory will handle toRaw() + structuredClone()
      history.push(
        {
          nodes: nodes.value,
          edges: edges.value
        },
        description
      )
    }, 500) // Debounce by 500ms
  }

  // ===== GETTERS =====
  const inputNodes = computed(() =>
    nodes.value.filter(n => n.type === 'input')
  )

  const selectedNode = computed(() =>
    nodes.value.find(n => n.id === selectedNodeId.value)
  )

  const nodesWithContent = computed(() =>
    inputNodes.value.filter(n => n.data.content?.trim())
  )

  // ===== CONNECTIVITY & SELECTION MODE =====

  /**
   * Check if a set of nodes form a connected component
   * Uses BFS (Breadth-First Search) to traverse the graph
   * Time Complexity: O(N + E) where N = nodes, E = edges
   */
  function areNodesConnected(nodeIds: string[]): boolean {
    if (nodeIds.length < 2) return false

    // Build adjacency map from edges (undirected graph)
    const adjacency = new Map<string, Set<string>>()
    for (const edge of edges.value) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set())
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set())
      adjacency.get(edge.source)!.add(edge.target)
      adjacency.get(edge.target)!.add(edge.source) // Bidirectional
    }

    // BFS from first selected node
    const visited = new Set<string>()
    const queue = [nodeIds[0]]
    visited.add(nodeIds[0])

    while (queue.length > 0) {
      const current = queue.shift()!
      const neighbors = adjacency.get(current) || new Set()

      for (const neighbor of neighbors) {
        // Only visit neighbors that are in the selected set
        if (nodeIds.includes(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }

    // All nodes must be reachable from the start node
    return visited.size === nodeIds.length
  }

  /**
   * Selection mode based on current selection state
   */
  type SelectionMode = 'idle' | 'single' | 'connected-group' | 'mixed-selection'

  const selectionMode = computed<SelectionMode>(() => {
    if (selectedNodeIds.value.length === 0) return 'idle'
    if (selectedNodeIds.value.length === 1) return 'single'
    if (areNodesConnected(selectedNodeIds.value)) return 'connected-group'
    return 'mixed-selection'
  })

  /**
   * Get all edges that connect selected nodes
   */
  const connectedEdgesForSelection = computed(() => {
    const selectedSet = new Set(selectedNodeIds.value)
    return edges.value.filter(edge =>
      selectedSet.has(edge.source) && selectedSet.has(edge.target)
    )
  })

  const selectedNodes = computed(() =>
    nodes.value.filter(n => selectedNodeIds.value.includes(n.id))
  )

  const selectedEdge = computed(() =>
    edges.value.find(e => e.id === selectedEdgeId.value)
  )

  // ===== NODE OPERATIONS =====

  function addNode(config: Partial<WorkflowNode>): WorkflowNode {
    const newNode: WorkflowNode = {
      id: generateId(),
      type: config.type || 'input',
      position: config.position || { x: 100, y: 100 },
      data: {
        label: config.data?.label || 'New Node',
        status: 'idle',
        ...config.data,
        createdAt: new Date().toISOString()
      }
    }

    nodes.value.push(newNode)
    selectedNodeId.value = newNode.id
    isDirty.value = true

    pushToHistory('Add node')
    scheduleAutosave()

    return newNode
  }

  function updateNode(nodeId: string, updates: Partial<WorkflowNode['data']>) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      Object.assign(node.data, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      isDirty.value = true
      scheduleAutosave()
    }
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    edges.value = edges.value.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }

    isDirty.value = true
    scheduleAutosave()
  }

  function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      node.position = position
      isDirty.value = true
      scheduleAutosave()
    }
  }

  // Helper to update only node data (not position)
  function updateNodeData(nodeId: string, dataUpdates: Partial<WorkflowNode['data']>) {
    updateNode(nodeId, dataUpdates)
  }

  // Helper to select a single node
  function selectNode(nodeId: string) {
    setSelectedNode(nodeId)
  }

  // ===== EDGE OPERATIONS =====

  function addEdge(connection: any) {
    const newEdge: WorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'default',
      animated: true
    }

    // Prevent duplicates
    const exists = edges.value.some(
      e => e.source === newEdge.source && e.target === newEdge.target
    )

    if (!exists) {
      edges.value.push(newEdge)
      isDirty.value = true
      scheduleAutosave()
    }
  }

  function removeEdge(edgeId: string) {
    const edgeToRemove = edges.value.find(e => e.id === edgeId)
    if (!edgeToRemove) return

    edges.value = edges.value.filter(e => e.id !== edgeId)

    // Clear selection if this edge was selected
    if (selectedEdgeId.value === edgeId) {
      selectedEdgeId.value = null
    }

    isDirty.value = true
    pushToHistory('Delete edge')
    scheduleAutosave()

    console.log('[WorkflowStore] Edge removed:', edgeId)
  }

  function setSelectedEdge(edgeId: string | null) {
    selectedEdgeId.value = edgeId
    // Clear node selection when edge is selected
    if (edgeId) {
      selectedNodeId.value = null
      selectedNodeIds.value = []
    }
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId.value) return
    removeEdge(selectedEdgeId.value)
    const uiStore = useUIStore()
    uiStore.showToast('Connection deleted', 'info')
  }

  function createLinkedNode(sourceNodeId: string, direction: 'right' | 'bottom' = 'right'): WorkflowNode | null {
    const sourceNode = nodes.value.find(n => n.id === sourceNodeId)
    if (!sourceNode) {
      console.error('[WorkflowStore] Source node not found:', sourceNodeId)
      return null
    }

    // Calculate position based on direction
    const offset = direction === 'right' ? { x: 300, y: 0 } : { x: 0, y: 150 }
    const newPosition = {
      x: sourceNode.position.x + offset.x,
      y: sourceNode.position.y + offset.y
    }

    // Create new node
    const newNode = addNode({
      type: 'input',
      position: newPosition,
      data: {
        label: 'Input Node',
        content: '',
        metadata: { createdFrom: sourceNodeId }
      }
    })

    // Create edge
    addEdge({
      source: sourceNodeId,
      target: newNode.id,
      sourceHandle: 'bottom',
      targetHandle: 'top'
    })

    console.log('[WorkflowStore] Created linked node:', newNode.id)

    return newNode
  }

  // Create Results Node (auto-generated after analysis completes)
  function createResultsNode(analysisNodeId: string, analysisResult: any): WorkflowNode | null {
    const analysisNode = nodes.value.find(n => n.id === analysisNodeId)
    if (!analysisNode) {
      console.error('[WorkflowStore] Analysis node not found:', analysisNodeId)
      return null
    }

    // Remove any existing results nodes connected to this analysis node
    const existingResultsNodes = nodes.value.filter(
      n => n.type === 'results' && n.data.metadata?.sourceAnalysisNode === analysisNodeId
    )

    if (existingResultsNodes.length > 0) {
      console.log(`[WorkflowStore] Removing ${existingResultsNodes.length} existing results node(s) for analysis node ${analysisNodeId}`)
      existingResultsNodes.forEach(node => {
        removeNode(node.id)
      })
    }

    // Calculate position to the right of analysis node
    const newPosition = {
      x: analysisNode.position.x + 400,
      y: analysisNode.position.y
    }

    // Create results node
    // Extract batchId or analysisId from result for matching with backend reports
    const batchId = analysisResult.batchId
    const analysisId = analysisResult.id

    const resultsNode = addNode({
      type: 'results',
      position: newPosition,
      data: {
        label: 'Analysis Results',
        content: '',
        analysisResult: analysisResult,
        createdAt: new Date().toISOString(),
        metadata: {
          sourceAnalysisNode: analysisNodeId,
          batchId: batchId, // For batch analysis matching
          analysisId: analysisId // For single analysis matching
        }
      }
    })

    // Create edge from analysis to results (right to left)
    addEdge({
      source: analysisNodeId,
      target: resultsNode.id,
      sourceHandle: 'right',
      targetHandle: 'left'
    })

    console.log('[WorkflowStore] Created results node:', resultsNode.id)

    return resultsNode
  }

  // ===== WORKFLOW EXECUTION =====

  async function analyzeNode(nodeId: string) {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) throw new Error('Node not found')

    if (!node.data.content?.trim()) {
      throw new Error('Node content is empty')
    }

    console.log('[WorkflowStore] Analyzing node:', nodeId)

    // Create abort controller for this request
    const controller = createAbortController(nodeId)

    // Update status
    updateNode(nodeId, { status: 'analyzing' })

    try {
      const result = await analysisService.analyzeSingle(
        node.data.content,
        authStore.userId,
        controller.signal
      )

      // Clear abort controller on success
      clearAbortController(nodeId)

      // Update with result
      updateNode(nodeId, {
        status: 'completed',
        analysisResult: result,
        analyzedAt: new Date().toISOString()
      })

      // Increment analysis counter for freemium tracking
      analysesCount.value++
      localStorage.setItem('redcube-analyses-count', analysesCount.value.toString())

      uiStore.showToast('Analysis complete!', 'success')

      return result
    } catch (error: any) {
      // Clear abort controller on error
      clearAbortController(nodeId)

      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('[WorkflowStore] Analysis cancelled for node:', nodeId)
        return null
      }

      console.error('[WorkflowStore] Analysis failed:', error)

      // Update with error
      updateNode(nodeId, {
        status: 'error',
        error: error.response?.data?.error || error.message
      })

      uiStore.showToast(`Analysis failed: ${error.message}`, 'error')

      throw error
    }
  }

  async function executeWorkflow() {
    const uiStore = useUIStore()

    const nodesToAnalyze = nodesWithContent.value

    if (nodesToAnalyze.length === 0) {
      throw new Error('No nodes with content to analyze')
    }

    console.log(`[WorkflowStore] Found ${nodesToAnalyze.length} node(s) to analyze`)

    isExecuting.value = true
    executionResults.value = null

    try {
      // Auto-detect: use batch mode for multiple nodes
      if (nodesToAnalyze.length > 1) {
        return await executeBatchAnalysis(nodesToAnalyze)
      } else {
        const firstNode = nodesToAnalyze[0]
        if (!firstNode) {
          throw new Error('No valid node to analyze')
        }
        return await executeSingleAnalysis(firstNode)
      }
    } catch (error: any) {
      console.error('[WorkflowStore] Execution failed:', error)

      executionResults.value = {
        success: false,
        mode: 'single',
        timestamp: new Date().toISOString(),
        totalNodes: nodesToAnalyze.length,
        successCount: 0,
        failureCount: nodesToAnalyze.length,
        results: []
      }

      uiStore.showToast(`Execution failed: ${error.message}`, 'error')

      throw error
    } finally {
      isExecuting.value = false
    }
  }

  async function executeSingleAnalysis(inputNode: WorkflowNode) {
    const uiStore = useUIStore()

    console.log('[WorkflowStore] Executing single analysis for node:', inputNode.id)

    try {
      const result = await analyzeNode(inputNode.id)

      const results: ExecutionResults = {
        success: true,
        mode: 'single',
        timestamp: new Date().toISOString(),
        totalNodes: 1,
        successCount: 1,
        failureCount: 0,
        results: [{ nodeId: inputNode.id, success: true, result }]
      }

      executionResults.value = results
      uiStore.showToast('✨ Analysis complete!', 'success')

      return results
    } catch (error: any) {
      // Mark node with error
      updateNode(inputNode.id, {
        status: 'error',
        error: error.response?.data?.error || error.message
      })

      const results: ExecutionResults = {
        success: false,
        mode: 'single',
        timestamp: new Date().toISOString(),
        totalNodes: 1,
        successCount: 0,
        failureCount: 1,
        results: [{ nodeId: inputNode.id, success: false, error: error.message }]
      }

      executionResults.value = results
      throw error
    }
  }

  async function executeBatchAnalysis(inputNodes: WorkflowNode[]) {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    console.log('[WorkflowStore] Executing batch analysis for', inputNodes.length, 'nodes')

    // Create a single abort controller for the entire batch
    const batchId = `batch-${Date.now()}`
    const controller = createAbortController(batchId)

    // Mark all nodes as analyzing
    for (const node of inputNodes) {
      updateNode(node.id, { status: 'analyzing' })
    }

    try {
      // Prepare batch request - include metadata so backend can preserve it
      const posts = inputNodes.map(node => ({
        id: node.id,
        text: node.data.content || '',
        // Include metadata from node data (populated by AI Assistant)
        company: node.data.company,
        role: node.data.role,
        level: node.data.level,
        outcome: node.data.outcome,
        postId: node.data.postId,
        url: node.data.redditUrl,
        title: node.data.label
      }))

      const batchResult = await analysisService.analyzeBatch(
        posts,
        authStore.userId,
        true,
        controller.signal
      )

      // Clear abort controller on success
      clearAbortController(batchId)

      console.log('[WorkflowStore] Batch analysis completed:', batchResult)

      // Map results back to nodes by index
      const results = []
      for (let i = 0; i < (batchResult.individual_analyses || []).length; i++) {
        const analysis = batchResult.individual_analyses[i]
        const correspondingNode = inputNodes[i]

        if (correspondingNode) {
          updateNode(correspondingNode.id, {
            status: 'completed',
            analysisResult: analysis,
            analyzedAt: new Date().toISOString()
          })

          results.push({ nodeId: correspondingNode.id, success: true, result: analysis })
        }
      }

      // ===== CRITICAL: Log data received from backend =====
      console.log(`\n${'='.repeat(80)}`)
      console.log(`[WORKFLOW STORE] 📥 Received Batch Result from Backend`)
      console.log(`${'='.repeat(80)}`)
      console.log(`[WORKFLOW STORE] similar_posts count: ${batchResult.similar_posts?.length || 0}`)
      console.log(`[WORKFLOW STORE] individual_analyses count: ${batchResult.individual_analyses?.length || 0}`)
      console.log(`[WORKFLOW STORE] pattern_analysis exists: ${!!batchResult.pattern_analysis}`)
      console.log(`[WORKFLOW STORE] batchId: ${batchResult.batchId}`)
      console.log(`[WORKFLOW STORE] 🚨 Degraded Mode Check:`)
      console.log(`[WORKFLOW STORE]   - extraction_warning:`, batchResult.extraction_warning)
      console.log(`[WORKFLOW STORE]   - features_available:`, batchResult.features_available)
      console.log(`[WORKFLOW STORE] 🎯 Enhanced Intelligence Check:`)
      console.log(`[WORKFLOW STORE]   - enhanced_intelligence:`, batchResult.enhanced_intelligence)
      console.log(`[WORKFLOW STORE]   - has enhanced_intelligence:`, !!batchResult.enhanced_intelligence)
      console.log(`${'='.repeat(80)}\n`)

      const executionResult: ExecutionResults = {
        success: true,
        mode: 'batch',
        timestamp: new Date().toISOString(),
        totalNodes: inputNodes.length,
        successCount: results.length,
        failureCount: inputNodes.length - results.length,
        results,
        connections: batchResult.connections || [],
        batchInsights: batchResult.batch_insights || null,
        totalConnections: batchResult.total_connections || 0,
        pattern_analysis: batchResult.pattern_analysis || null,
        individual_analyses: batchResult.individual_analyses || [], // User's 3 posts
        similar_posts: batchResult.similar_posts || [], // RAG posts from backend
        batchId: batchResult.batchId, // Include batchId from backend for report matching
        extraction_warning: batchResult.extraction_warning || null, // Degraded mode warning
        features_available: batchResult.features_available || null, // Feature availability flags
        enhanced_intelligence: batchResult.enhanced_intelligence || null // Enhanced Intelligence (Phase 3)
      }

      // ===== CRITICAL: Log executionResult after building =====
      console.log(`\n${'='.repeat(80)}`)
      console.log(`[WORKFLOW STORE] 💾 Built executionResult`)
      console.log(`${'='.repeat(80)}`)
      console.log(`[WORKFLOW STORE] executionResult.similar_posts count: ${executionResult.similar_posts?.length || 0}`)
      console.log(`[WORKFLOW STORE] executionResult.individual_analyses count: ${executionResult.individual_analyses?.length || 0}`)
      console.log(`[WORKFLOW STORE] executionResult.pattern_analysis exists: ${!!executionResult.pattern_analysis}`)
      console.log(`${'='.repeat(80)}\n`)

      executionResults.value = executionResult
      uiStore.showToast(
        `🎉 Batch complete: All ${results.length} nodes analyzed successfully!`,
        'success'
      )

      return executionResult
    } catch (error: any) {
      // Clear abort controller on error
      clearAbortController(batchId)

      // Don't show error if request was cancelled
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('[WorkflowStore] Batch analysis cancelled')
        // Mark all nodes as cancelled
        for (const node of inputNodes) {
          updateNode(node.id, {
            status: 'cancelled',
            error: 'Analysis cancelled by user'
          })
        }
        return null
      }

      console.error('[WorkflowStore] Batch analysis failed:', error)

      // Mark all nodes with error
      for (const node of inputNodes) {
        updateNode(node.id, {
          status: 'error',
          error: error.response?.data?.error || error.message
        })
      }

      const results: ExecutionResults = {
        success: false,
        mode: 'batch',
        timestamp: new Date().toISOString(),
        totalNodes: inputNodes.length,
        successCount: 0,
        failureCount: inputNodes.length,
        results: inputNodes.map(node => ({
          nodeId: node.id,
          success: false,
          error: error.message
        }))
      }

      executionResults.value = results
      throw error
    }
  }

  // ===== PERSISTENCE =====

  let autosaveTimer: any = null

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer)

    autosaveTimer = setTimeout(() => {
      saveWorkflow()
    }, AUTOSAVE_DELAY)
  }

  function serializeWorkflowState() {
    return {
      workflowId: workflowId.value,
      // Filter out ephemeral states (analyzing, cancelled) before saving
      nodes: nodes.value.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: node.data.status === 'analyzing' || node.data.status === 'cancelled'
            ? 'idle'
            : node.data.status,
          error: node.data.status === 'cancelled' ? undefined : node.data.error,
          analysisResult: node.data.analysisResult ? {
            id: node.data.analysisResult.id,
            batchId: node.data.analysisResult.batchId,
            type: node.data.analysisResult.type
          } : undefined
        }
      })),
      edges: edges.value,
      version: version.value
    }
  }

  function saveWorkflow() {
    const state = serializeWorkflowState()

    try {
      const jsonString = JSON.stringify(state)
      const sizeInKB = new Blob([jsonString]).size / 1024

      // Warn if size is large
      if (sizeInKB > 500) {
        console.warn(`[WorkflowStore] localStorage size is large: ${sizeInKB.toFixed(2)} KB`)
      }

      localStorage.setItem(STORAGE_KEY, jsonString)

      isDirty.value = false
      lastSavedAt.value = new Date().toISOString()

      console.log(`[WorkflowStore] Workflow saved to localStorage (${sizeInKB.toFixed(2)} KB, ephemeral states filtered)`)
    } catch (error) {
      console.error('[WorkflowStore] Failed to save workflow:', error)

      // If quota exceeded, try saving minimal state
      if (error instanceof DOMException && (error as DOMException).name === 'QuotaExceededError') {
        console.warn('[WorkflowStore] Quota exceeded, saving minimal state...')
        try {
          const minimalState = {
            workflowId: workflowId.value,
            nodes: nodes.value.map(node => ({
              id: node.id,
              type: node.type,
              position: node.position,
              data: {
                label: node.data.label,
                content: node.data.content,
                status: 'idle' // Reset all to idle
              }
            })),
            edges: edges.value,
            version: version.value
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState))
          console.log('[WorkflowStore] Successfully saved minimal state')
        } catch (retryError) {
          console.error('[WorkflowStore] Failed even with minimal state:', retryError)
        }
      }
    }
  }

  function loadWorkflow() {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        const state = JSON.parse(saved)

        // Load nodes and clean up stale errors and analyzing states
        nodes.value = (state.nodes || []).map((node: WorkflowNode) => {
          // Reset analyzing states on load (page refresh scenario - request is lost)
          if (node.data.status === 'analyzing') {
            console.log('[WorkflowStore] Resetting stale analyzing state from node:', node.id)
            return {
              ...node,
              data: {
                ...node.data,
                status: 'idle',
                error: 'Previous analysis was interrupted. Please try again.'
              }
            }
          }

          // Clear old timeout errors from localStorage
          if (node.data.error && typeof node.data.error === 'string' &&
              (node.data.error.includes('timeout') || node.data.error.includes('ECONNABORTED'))) {
            console.log('[WorkflowStore] Clearing stale timeout error from node:', node.id)
            return {
              ...node,
              data: {
                ...node.data,
                error: undefined,
                status: node.data.status === 'error' ? 'idle' : node.data.status
              }
            }
          }
          return node
        })

        // Migrate old edge types to new bezier curves
        edges.value = (state.edges || []).map((edge: WorkflowEdge) => ({
          ...edge,
          type: edge.type === 'smoothstep' ? 'default' : edge.type
        }))

        workflowId.value = state.workflowId || 'default-workflow'
        version.value = state.version || 1

        console.log('[WorkflowStore] Workflow loaded from localStorage')
      } catch (error) {
        console.error('[WorkflowStore] Failed to load workflow:', error)
      }
    }
  }

  function clearWorkflow() {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    executionResults.value = null
    isDirty.value = false

    console.log('[WorkflowStore] Workflow cleared')
  }

  function exportWorkflow(): string {
    const exportData = {
      version: version.value,
      workflowId: workflowId.value,
      nodes: nodes.value,
      edges: edges.value,
      exportedAt: new Date().toISOString(),
      metadata: {
        totalNodes: nodes.value.length,
        totalEdges: edges.value.length
      }
    }

    const json = JSON.stringify(exportData, null, 2)
    console.log('[WorkflowStore] Workflow exported')
    return json
  }

  function importWorkflow(jsonString: string): boolean {
    try {
      const importData = JSON.parse(jsonString)

      // Validate structure
      if (!importData.nodes || !Array.isArray(importData.nodes)) {
        throw new Error('Invalid workflow format: missing nodes array')
      }

      if (!importData.edges || !Array.isArray(importData.edges)) {
        throw new Error('Invalid workflow format: missing edges array')
      }

      // Clear current workflow
      clearWorkflow()

      // Import data
      nodes.value = importData.nodes
      edges.value = importData.edges
      workflowId.value = importData.workflowId || 'imported-workflow'
      version.value = importData.version || 1

      isDirty.value = true
      saveWorkflow()

      console.log('[WorkflowStore] Workflow imported:', {
        nodes: nodes.value.length,
        edges: edges.value.length
      })

      return true
    } catch (error: any) {
      console.error('[WorkflowStore] Failed to import workflow:', error)
      throw new Error(`Import failed: ${error.message}`)
    }
  }

  // ===== SELECTION =====

  function setSelectedNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function toggleNodeSelection(nodeId: string, additive: boolean = false) {
    if (!additive) {
      // Single select - clear others
      selectedNodeIds.value = [nodeId]
      selectedNodeId.value = nodeId
    } else {
      // Multi-select - toggle this node
      const index = selectedNodeIds.value.indexOf(nodeId)
      if (index > -1) {
        selectedNodeIds.value.splice(index, 1)
        // Update primary selection to last selected
        selectedNodeId.value = selectedNodeIds.value[selectedNodeIds.value.length - 1] || null
      } else {
        selectedNodeIds.value.push(nodeId)
        selectedNodeId.value = nodeId
      }
    }
  }

  function selectMultipleNodes(nodeIds: string[]) {
    selectedNodeIds.value = nodeIds
    selectedNodeId.value = nodeIds[nodeIds.length - 1] || null
  }

  function clearSelection() {
    selectedNodeIds.value = []
    selectedNodeId.value = null
  }

  function deleteSelectedNodes() {
    if (selectedNodeIds.value.length === 0) return

    // Remove all selected nodes
    for (const nodeId of selectedNodeIds.value) {
      removeNode(nodeId)
    }

    clearSelection()
    pushToHistory('Delete selected nodes')
  }

  function setViewport(newViewport: Viewport) {
    viewport.value = newViewport
  }

  // ===== UNDO/REDO OPERATIONS =====

  function undo() {
    const previousState = history.undo()
    if (previousState) {
      nodes.value = previousState.nodes
      edges.value = previousState.edges
      isDirty.value = true
      console.log('[WorkflowStore] Undo applied')
      useUIStore().showToast('Undo', 'info')
    } else {
      console.log('[WorkflowStore] Nothing to undo')
      useUIStore().showToast('Nothing to undo', 'warning')
    }
  }

  function redo() {
    const nextState = history.redo()
    if (nextState) {
      nodes.value = nextState.nodes
      edges.value = nextState.edges
      isDirty.value = true
      console.log('[WorkflowStore] Redo applied')
      useUIStore().showToast('Redo', 'info')
    } else {
      console.log('[WorkflowStore] Nothing to redo')
      useUIStore().showToast('Nothing to redo', 'warning')
    }
  }

  // Computed getters for undo/redo availability
  const canUndo = computed(() => history.canUndo())
  const canRedo = computed(() => history.canRedo())

  // ===== UTILITIES =====

  function generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    workflowId,
    nodes,
    edges,
    selectedNodeId,
    selectedNodeIds,
    selectedEdgeId,
    viewport,
    isExecuting,
    executionResults,
    isDirty,
    lastSavedAt,
    version,
    analysesCount,
    maxFreeAnalyses,

    // Getters
    inputNodes,
    selectedNode,
    selectedNodes,
    selectedEdge,
    nodesWithContent,
    canUndo,
    canRedo,
    selectionMode,
    connectedEdgesForSelection,

    // Actions
    addNode,
    updateNode,
    updateNodeData,
    selectNode,
    removeNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    setSelectedEdge,
    deleteSelectedEdge,
    createLinkedNode,
    createResultsNode,
    analyzeNode,
    abortAnalysis,
    executeBatchAnalysis,
    executeWorkflow,
    serializeWorkflowState,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow,
    exportWorkflow,
    importWorkflow,
    setSelectedNode,
    toggleNodeSelection,
    selectMultipleNodes,
    clearSelection,
    deleteSelectedNodes,
    setViewport,
    undo,
    redo
  }
})
