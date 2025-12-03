<script setup lang="ts">
// @ts-nocheck
import { onMounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useReportsStore } from '@/stores/reportsStore'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { storeToRefs } from 'pinia'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import ContentArea from '@/components/Canvas/ContentArea.vue'
import SimplifiedToolbar from '@/components/Toolbar/SimplifiedToolbar.vue'
import LeftSidebar from '@/components/Sidebar/LeftSidebar.vue'
import AISearchBar from '@/components/Canvas/AISearchBar.vue'
import CanvasSideToolbar from '@/components/Canvas/CanvasSideToolbar.vue'
import SelectionToolbar from '@/components/Toolbar/SelectionToolbar.vue'
import NodeInspector from '@/components/Inspector/NodeInspector.vue'
import UpgradeModal from '@/components/Landing/UpgradeModal.vue'
import ResultsPanel from '@/components/ResultsPanel/ResultsPanel.vue'

const route = useRoute()
const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const learningMapStore = useLearningMapStore()

const { consoleOpen, sidebarOpen } = storeToRefs(uiStore)
const showUpgradeModal = ref(false)

// Watch for analysis count hitting limit
watch(() => workflowStore.analysesCount, (newCount) => {
  if (newCount >= workflowStore.maxFreeAnalyses && !authStore.user?.isPro) {
    showUpgradeModal.value = true
  }
})

function handleUpgrade() {
  // Redirect to upgrade page or billing
  window.location.href = '/billing'
}

function closeUpgradeModal() {
  showUpgradeModal.value = false
}


// Keyboard shortcuts
const { isMac } = useKeyboardShortcuts([
  {
    key: 's',
    meta: true,
    handler: () => {
      workflowStore.saveWorkflow()
      uiStore.showToast('Workflow saved', 'success')
    },
    description: 'Save workflow'
  },
  {
    key: 'e',
    meta: true,
    handler: () => {
      if (workflowStore.nodesWithContent.length > 0) {
        workflowStore.executeWorkflow()
      } else {
        uiStore.showToast('No nodes with content to analyze', 'warning')
      }
    },
    description: 'Execute workflow'
  },
  {
    key: 'a',
    meta: true,
    handler: () => {
      workflowStore.addNode({ type: 'input' })
      uiStore.showToast('Node added', 'success')
    },
    description: 'Add new node'
  },
  {
    key: 'Delete',
    handler: () => {
      // Priority 1: Delete selected edge
      if (workflowStore.selectedEdgeId) {
        workflowStore.deleteSelectedEdge()
        return
      }

      // Priority 2: Delete selected nodes
      if (workflowStore.selectedNodeIds.length > 1) {
        // Bulk delete multi-selected nodes
        const count = workflowStore.selectedNodeIds.length
        workflowStore.deleteSelectedNodes()
        uiStore.closeConsole()
        uiStore.showToast(`${count} nodes deleted`, 'success')
      } else if (workflowStore.selectedNodeId) {
        // Single delete
        const nodeId = workflowStore.selectedNodeId
        workflowStore.removeNode(nodeId)
        uiStore.closeConsole()
        uiStore.showToast('Node deleted', 'success')
      }
    },
    description: 'Delete selected node(s) or edge'
  },
  {
    key: 'Backspace',
    handler: () => {
      // Priority 1: Delete selected edge
      if (workflowStore.selectedEdgeId) {
        workflowStore.deleteSelectedEdge()
        return
      }

      // Priority 2: Delete selected nodes
      if (workflowStore.selectedNodeIds.length > 1) {
        // Bulk delete multi-selected nodes
        const count = workflowStore.selectedNodeIds.length
        workflowStore.deleteSelectedNodes()
        uiStore.closeConsole()
        uiStore.showToast(`${count} nodes deleted`, 'success')
      } else if (workflowStore.selectedNodeId) {
        // Single delete
        const nodeId = workflowStore.selectedNodeId
        workflowStore.removeNode(nodeId)
        uiStore.closeConsole()
        uiStore.showToast('Node deleted', 'success')
      }
    },
    description: 'Delete selected node(s) or edge'
  },
  {
    key: 'Escape',
    handler: () => {
      // Priority 1: Close inspector if open
      if (uiStore.inspectorOpen) {
        uiStore.closeInspector()
        return
      }
      // Priority 2: Close console if open
      if (consoleOpen.value) {
        uiStore.closeConsole()
      }
    },
    description: 'Close inspector or console'
  },
  {
    key: 'z',
    meta: true,
    handler: () => {
      workflowStore.undo()
    },
    description: 'Undo'
  },
  {
    key: 'z',
    meta: true,
    shift: true,
    handler: () => {
      workflowStore.redo()
    },
    description: 'Redo'
  }
])

onMounted(async () => {
  console.log('[WorkflowEditor] 🚀 Component mounted, initializing...')
  
  // Step 1: Load saved workflow from localStorage FIRST
  console.log('[WorkflowEditor] 📂 Loading saved workflow from localStorage...')
  workflowStore.loadWorkflow()

  // Step 2: Initialize theme
  console.log('[WorkflowEditor] 🎨 Initializing theme...')
  uiStore.initializeTheme()

  // Step 3: Initialize UI state from localStorage (must be after initializeTheme)
  console.log('[WorkflowEditor] 🖥️  Loading UI state...')
  uiStore.initializeUIState()

  // Step 4: Check if we're auto-populating from an experience (Community Analyze button)
  if (route.query.mode === 'analyze-experience' && route.query.experienceId) {
    console.log('[WorkflowEditor] 🎯 ANALYZE EXPERIENCE MODE DETECTED')
    console.log('[WorkflowEditor] Experience ID:', route.query.experienceId)
    console.log('[WorkflowEditor] Company:', route.query.company)
    console.log('[WorkflowEditor] Role:', route.query.role)

    // CRITICAL: Force workflow canvas view (override persisted contentView state)
    // User might have been viewing a report, but we want to show the workflow canvas
    console.log('[WorkflowEditor] 🎬 Forcing workflow canvas view...')
    uiStore.showWorkflow()
    console.log('[WorkflowEditor] ✅ Content view set to workflow')

    // Wait for loadWorkflow() and UI init to complete
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('[WorkflowEditor] ⏱️  Waited for initialization to complete')

    try {
      // Fetch experience data from API
      console.log('[WorkflowEditor] 📥 Fetching experience from API...')
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const response = await axios.get(
        `${apiGatewayUrl}/api/content/interview-intel/experiences/${route.query.experienceId}`
      )

      if (response.data.success) {
        const experience = response.data.data
        console.log('[WorkflowEditor] ✅ Experience loaded:', {
          id: experience.id,
          company: experience.company,
          role: experience.role,
          contentLength: experience.full_experience?.length || 0
        })

        // Clear existing workflow NOW (after loadWorkflow has run)
        console.log('[WorkflowEditor] 🧹 Clearing workflow...')
        workflowStore.clearWorkflow()
        console.log('[WorkflowEditor] ✅ Workflow cleared, nodes count:', workflowStore.nodes.length)

        // Wait a bit for clear to complete
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 300))

        // Construct full_experience field from available data
        const fullExperience = [
          `Company: ${experience.company}`,
          `Role: ${experience.role}`,
          `Outcome: ${experience.outcome}`,
          experience.preparation_feedback ? `\nPreparation: ${experience.preparation_feedback}` : '',
          experience.tips_for_others ? `\nTips: ${experience.tips_for_others}` : '',
          experience.questions_asked && experience.questions_asked.length > 0
            ? `\nQuestions Asked:\n${experience.questions_asked.map((q: string) => `- ${q}`).join('\n')}`
            : '',
          experience.areas_struggled && experience.areas_struggled.length > 0
            ? `\nAreas Struggled:\n${experience.areas_struggled.map((a: string) => `- ${a}`).join('\n')}`
            : ''
        ].filter(Boolean).join('\n')

        console.log('[WorkflowEditor] 📝 Constructed full experience, length:', fullExperience.length)

        // Step 1: Create INPUT node with experience data (SAME AS AI AGENT)
        console.log('[WorkflowEditor] 📝 Creating INPUT node...')
        const inputNode = workflowStore.addNode({
          type: 'input',
          position: { x: 100, y: 200 },
          data: {
            label: `${experience.company} - ${experience.role}`,
            content: fullExperience,
            experienceId: experience.id,
            company: experience.company,
            role: experience.role,
            outcome: experience.outcome
          }
        })
        console.log('[WorkflowEditor] ✅ INPUT node created:', inputNode?.id)

        if (!inputNode?.id) {
          throw new Error('Failed to create INPUT node')
        }

        // Wait for INPUT node to render
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 500))

        // Step 2: Create ANALYZE node to the right (SAME AS AI AGENT)
        console.log('[WorkflowEditor] 🔬 Creating ANALYZE node...')
        const analysisNode = workflowStore.addNode({
          type: 'analysis',
          position: { x: 500, y: 200 },  // 400px to the right
          data: {
            label: 'Analysis',
            status: 'idle'
          }
        })
        console.log('[WorkflowEditor] ✅ ANALYZE node created:', analysisNode?.id)

        if (!analysisNode?.id) {
          throw new Error('Failed to create ANALYZE node')
        }

        // Wait for ANALYZE node to render
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 300))

        // Step 3: Connect INPUT → ANALYZE (SAME AS AI AGENT)
        console.log('[WorkflowEditor] 🔗 Connecting INPUT → ANALYZE...')
        const edgeConfig = {
          source: inputNode.id,
          target: analysisNode.id,
          sourceHandle: 'right',  // InputNode's RIGHT handle
          targetHandle: 'left',   // AnalysisNode's LEFT handle
          type: 'default'
        }
        console.log('[WorkflowEditor] Edge config:', edgeConfig)
        workflowStore.addEdge(edgeConfig)
        console.log('[WorkflowEditor] ✅ Nodes connected, total edges:', workflowStore.edges.length)

        // Show initial toast
        uiStore.showToast(`Workflow ready: ${experience.company} - ${experience.role}`, 'success')

        // Wait before auto-executing
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 800))

        // Step 4: Auto-execute single analysis (SAME PATTERN AS AI AGENT)
        console.log('[WorkflowEditor] 🤖 AUTO-EXECUTING single analysis...')

        // Get the input node object from store
        const inputNodeObj = workflowStore.nodes.find(n => n.id === inputNode.id)
        
        if (!inputNodeObj) {
          throw new Error('Input node not found in store')
        }

        console.log('[WorkflowEditor] Found input node:', inputNodeObj.id)
        console.log('[WorkflowEditor] Content length:', inputNodeObj.data.content?.length || 0)

        // Update analysis node to analyzing state
        workflowStore.updateNodeData(analysisNode.id, { status: 'analyzing' })
        console.log('[WorkflowEditor] 📊 Analysis node status: analyzing')

        try {
          console.log('[WorkflowEditor] 🚀 Calling analyzeNode on INPUT node...')
          
          // Analyze the INPUT node (analyzeNode updates the INPUT node's status automatically)
          const result = await workflowStore.analyzeNode(inputNode.id)
          
          console.log('[WorkflowEditor] ✅ Analysis completed! Result:', {
            hasOverview: !!result?.overview,
            hasSkills: !!result?.skills,
            hasBenchmark: !!result?.benchmark,
            hasQuestions: !!result?.questions,
            hasSimilarExperiences: result?.similarExperiences?.length || 0,
            hasPatternAnalysis: !!result?.pattern_analysis
          })

          if (!result) {
            throw new Error('Analysis returned null result')
          }

          // CRITICAL: Add report to store (same as InputNode.vue does)
          // This allows ResultsNode to find the report and display it
          const deterministicReportId = result?.id ? `report-${result.id}` : `report-${Date.now()}`
          const reportData = {
            id: deterministicReportId,
            nodeId: inputNode.id,
            workflowId: 'default-workflow',
            result: result,  // Full analysis result with pattern_analysis
            timestamp: new Date(),
            isRead: false,
            analysisId: result.id  // Important: for ResultsNode to match by analysisId
          }
          console.log('[WorkflowEditor] 💾 Adding report to store:', {
            reportId: deterministicReportId,
            analysisId: result.id,
            hasPatternAnalysis: !!result.pattern_analysis
          })
          reportsStore.addReport(reportData)
          console.log('[WorkflowEditor] ✅ Report added to store, total reports:', reportsStore.reports.length)

          // Update analysis node to completed
          workflowStore.updateNodeData(analysisNode.id, {
            status: 'completed',
            analysisResult: result
          })
          console.log('[WorkflowEditor] ✅ Analysis node updated to completed')

          // Wait a bit before creating report node
          await nextTick()
          await new Promise(resolve => setTimeout(resolve, 300))

          // Create REPORT/RESULTS node from the ANALYSIS node (not INPUT node)
          console.log('[WorkflowEditor] 📊 Creating REPORT node...')
          const resultsNode = workflowStore.createResultsNode(analysisNode.id, result)
          console.log('[WorkflowEditor] ✅ REPORT node created:', resultsNode?.id)
          console.log('[WorkflowEditor] 📈 Total nodes now:', workflowStore.nodes.length)

          uiStore.showToast('Analysis complete! 🎉', 'success')

        } catch (error) {
          console.error('[WorkflowEditor] ❌ Analysis failed:', error)
          workflowStore.updateNodeData(analysisNode.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Analysis failed'
          })
          uiStore.showToast('Analysis failed', 'error')
        }

        // Record citation for this experience being analyzed
        try {
          console.log('[WorkflowEditor] 📝 Recording citation...')
          await axios.post(
            `${apiGatewayUrl}/api/content/interview-intel/experiences/${experience.id}/cite`,
            {
              workflowId: `workflow_${Date.now()}`,
              analysisType: 'workflow_analysis'
            }
          )
          console.log('[WorkflowEditor] ✅ Citation recorded')
        } catch (citationError) {
          console.error('[WorkflowEditor] ⚠️  Citation recording failed (non-critical):', citationError)
        }
      }
    } catch (error) {
      console.error('[WorkflowEditor] ❌ Error in analyze-experience flow:', error)
      uiStore.showToast('Failed to load experience', 'error')
    }
  }

  console.log('[WorkflowEditor] ✅ Mounting complete, final state:', {
    nodesCount: workflowStore.nodes.length,
    edgesCount: workflowStore.edges.length
  })

  // Fetch user data from backend if logged in
  if (authStore.userId) {
    console.log('[WorkflowEditor] User logged in, fetching reports and learning maps...')
    try {
      // Wait for reports store to initialize and load data
      await reportsStore.initialize()

      // Then fetch learning maps
      await learningMapStore.fetchUserMaps()

      console.log('[WorkflowEditor] Successfully loaded user data from backend')
    } catch (error) {
      console.error('[WorkflowEditor] Failed to load user data:', error)
    }
  }

  // Show keyboard shortcuts hint
  console.log('🎹 Keyboard Shortcuts:')
  console.log(`${isMac ? '⌘' : 'Ctrl'}+S - Save workflow`)
  console.log(`${isMac ? '⌘' : 'Ctrl'}+E - Execute workflow`)
  console.log(`${isMac ? '⌘' : 'Ctrl'}+A - Add new node`)
  console.log('Delete/Backspace - Delete selected node')
  console.log('Escape - Close console')
})
</script>

<template>
  <div
    class="workflow-editor"
    :style="{ '--sidebar-width': sidebarOpen ? '320px' : '60px' }">
    <!-- Left Sidebar (Full Height) -->
    <LeftSidebar />

    <!-- Simplified Toolbar (Floating, adjusts for sidebar) - always visible -->
    <SimplifiedToolbar
      :style="{ marginLeft: sidebarOpen ? '320px' : '60px' }"
    />

    <!-- Content Area (Adjusts for sidebar + header) -->
    <div
      class="canvas-wrapper"
      :style="{
        marginLeft: sidebarOpen ? '320px' : '60px',
        top: '56px'
      }"
    >
      <div class="canvas-container">
        <!-- Dynamic Content Area - shows workflow, reports, or maps -->
        <ContentArea />

        <!-- Canvas Side Toolbar (Floating Left) - only show in workflow view -->
        <CanvasSideToolbar v-if="uiStore.contentView === 'workflow'" />

        <!-- AI Search Bar (Bottom Center) - only show in workflow view -->
        <AISearchBar
          v-if="uiStore.contentView === 'workflow'"
        />

        <!-- Floating Selection Toolbar - only show in workflow view -->
        <SelectionToolbar v-if="uiStore.contentView === 'workflow'" />
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        :class="[
          'toast',
          `toast-${toast.type}`
        ]"
      >
        <span>{{ toast.message }}</span>
        <button @click="uiStore.removeToast(toast.id)" class="toast-close">×</button>
      </div>
    </div>

    <!-- Results Panel (Modal) - Always rendered -->
    <ResultsPanel />

    <!-- Node Inspector (Right Sidebar) -->
    <NodeInspector />

    <!-- Upgrade Modal (Freemium Trial Limit) -->
    <UpgradeModal
      :isOpen="showUpgradeModal"
      :analysesUsed="workflowStore.analysesCount"
      :freeAnalyses="workflowStore.maxFreeAnalyses"
      @close="closeUpgradeModal"
      @upgrade="handleUpgrade"
    />
  </div>
</template>

<style scoped>
.workflow-editor {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #F9FAFB;
  overflow: hidden;
}

/* Canvas Wrapper - Adjusts for sidebar */
.canvas-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  transition: margin-left 0.3s ease, top 0.3s ease;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  font-weight: 500;
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 500px;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.toast-warning {
  background: #f59e0b;
  color: white;
}

.toast-info {
  background: #3b82f6;
  color: white;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}

.toast-close:hover {
  opacity: 1;
}

/* Dark mode support */
.dark .workflow-editor {
  background: #F9FAFB;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .canvas-container {
    margin-left: 0 !important;
  }
}
</style>
