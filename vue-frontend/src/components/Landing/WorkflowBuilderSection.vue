<template>
  <section class="workflow-builder-section">
    <div class="section-container">
      <!-- Header -->
      <div class="section-header">
        <h2 class="section-title">VISUAL WORKFLOW BUILDER</h2>
        <p class="section-subtitle">Build custom analysis pipelines with drag-and-drop nodes</p>
      </div>

      <!-- Workflow Example -->
      <div class="workflow-example">
        <div class="workflow-label">Example: Amazon SDE Interview Analysis</div>

        <!-- Vue Flow Canvas with Real Nodes - Static presentation view -->
        <div class="vue-flow-wrapper">
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :node-types="nodeTypes"
            :default-viewport="{ zoom: 0.7, x: 50, y: 50 }"
            :zoom-on-scroll="false"
            :pan-on-scroll="false"
            :pan-on-drag="false"
            :nodes-draggable="false"
            :nodes-connectable="false"
            :elements-selectable="false"
            :zoom-activation-key-code="null"
            class="workflow-canvas"
          >
            <!-- Background with dots pattern - exact copy from workflow lab -->
            <Background
              pattern-color="#aaa"
              :gap="16"
              variant="dots"
            />
          </VueFlow>

          <!-- Learning Map UI Component -->
          <div class="learning-map-container">
            <div class="learning-map-visual">
              <div class="lm-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span class="lm-title">Learning Roadmap</span>
              </div>

              <!-- Timeline -->
              <div class="lm-timeline">
                <div class="timeline-week">
                  <span class="week-label">Week 1-4</span>
                  <div class="milestone completed">
                    <div class="milestone-dot"></div>
                    <span class="milestone-text">Arrays & Hashing</span>
                  </div>
                  <div class="resource-tag">LeetCode • 40 problems</div>
                </div>

                <div class="timeline-week">
                  <span class="week-label">Week 5-8</span>
                  <div class="milestone in-progress">
                    <div class="milestone-dot"></div>
                    <span class="milestone-text">System Design</span>
                  </div>
                  <div class="resource-tag">SD Primer • Grokking</div>
                </div>

                <div class="timeline-week">
                  <span class="week-label">Week 9-12</span>
                  <div class="milestone pending">
                    <div class="milestone-dot"></div>
                    <span class="milestone-text">Mock Interviews</span>
                  </div>
                  <div class="resource-tag">Pramp • 8 sessions</div>
                </div>
              </div>

              <div class="lm-footer">
                <div class="progress-indicator">
                  <div class="progress-bar-small" style="width: 35%"></div>
                </div>
                <span class="lm-label">35% Complete • 8 weeks left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="section-cta">
        <button class="cta-button" @click="handleTryIt">
          TRY WORKFLOW BUILDER
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import InputNode from '@/components/Nodes/InputNode.vue'
import AnalysisNode from '@/components/Nodes/AnalysisNode.vue'
import ResultsNode from '@/components/Nodes/ResultsNode.vue'

const router = useRouter()

// Register node types - exact copy from workflow lab
const nodeTypes = {
  input: markRaw(InputNode),
  analysis: markRaw(AnalysisNode),
  results: markRaw(ResultsNode)
}

// Define nodes using actual workflow lab node types - adjusted positions to prevent overlap
const nodes = ref([
  // Input Nodes (3 vertically stacked on the left) - 200px spacing for 250px tall nodes
  {
    id: 'input-1',
    type: 'input',
    position: { x: 50, y: 0 },
    data: {
      label: 'Interview Post',
      content: 'Just finished my Amazon coding interview. They asked me to implement LRU Cache and discuss time complexity...',
      metadata: { source: 'Reddit' },
      status: 'completed',
      analysisResult: { id: 401 }
    }
  },
  {
    id: 'input-2',
    type: 'input',
    position: { x: 50, y: 200 },
    data: {
      label: 'Interview Post',
      content: 'Amazon system design round - had to design a distributed rate limiter. Discussed token bucket algorithm...',
      metadata: { source: 'Blind' },
      status: 'completed',
      analysisResult: { id: 402 }
    }
  },
  {
    id: 'input-3',
    type: 'input',
    position: { x: 50, y: 400 },
    data: {
      label: 'Interview Post',
      content: 'Amazon behavioral interview focused heavily on leadership principles. Got asked about a time I had to make...',
      metadata: { source: 'LeetCode Discuss' },
      status: 'completed',
      analysisResult: { id: 403 }
    }
  },
  // Analysis Node (center) - more spacing from inputs
  {
    id: 'analysis-1',
    type: 'analysis',
    position: { x: 450, y: 200 },
    data: {
      label: 'Batch Analysis',
      status: 'completed',
      analysisCount: 3
    }
  },
  // Results Node (right of analysis) - increased spacing (400px gap for 320px wide nodes)
  {
    id: 'results-1',
    type: 'results',
    position: { x: 870, y: 200 },
    data: {
      label: 'Analysis Results',
      status: 'completed',
      result: {
        summary: 'Technical focus on algorithms, system design scalability, leadership principles'
      }
    }
  }
])

// Define edges (connections) between nodes - using Vue Flow's edge system
const edges = ref([
  // Input nodes to Analysis node
  { id: 'e1-a', source: 'input-1', target: 'analysis-1', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'e2-a', source: 'input-2', target: 'analysis-1', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'e3-a', source: 'input-3', target: 'analysis-1', sourceHandle: 'right', targetHandle: 'left' },
  // Analysis to Results
  { id: 'ea-r', source: 'analysis-1', target: 'results-1', sourceHandle: 'right', targetHandle: 'left' }
])

function handleTryIt() {
  router.push('/workflow')
}
</script>

<style scoped>
.workflow-builder-section {
  background: #FFFFFF;
  padding: 120px 0;
  position: relative;
  z-index: 1;
}

.section-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 40px;
}

/* Header */
.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #000000;
  letter-spacing: -1px;
  margin: 0 0 16px 0;
}

.section-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  color: #666666;
  margin: 0;
}

/* Workflow Example */
.workflow-example {
  position: relative;
}

.workflow-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 32px;
  text-align: center;
}

/* Vue Flow Wrapper - No frame box, increased height for better layout */
.vue-flow-wrapper {
  position: relative;
  width: 100%;
  height: 700px;
  background: transparent;
  overflow: visible;
}

.workflow-canvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Remove default Vue Flow node styling */
:deep(.vue-flow__node) {
  cursor: default;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

/* Dotted edge styling - exact match for workflow lab */
:deep(.vue-flow__edge-path) {
  stroke-width: 2;
  stroke: #94a3b8;
  stroke-dasharray: 5, 5;
  transition: all 0.3s ease;
}

/* Disable Vue Flow controls */
:deep(.vue-flow__controls) {
  display: none !important;
}

:deep(.vue-flow__minimap) {
  display: none !important;
}

/* Learning Map Container - Aligned with Results node */
.learning-map-container {
  position: absolute;
  left: 1000px;
  top: 40%;
  transform: translateY(-50%);
  z-index: 5;
  pointer-events: auto;
}

/* Learning Map Visual - Same size as Input nodes (~280px) */
.learning-map-visual {
  width: 280px;
  padding: 16px;
  background: #FFFFFF;
  border: 2px solid #3B82F6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  display: flex;
  flex-direction: column;
  gap: 14px;
  pointer-events: auto;
}

.lm-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 2px solid #E5E7EB;
}

.lm-header svg {
  color: #3B82F6;
  flex-shrink: 0;
}

.lm-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000000;
  line-height: 1.2;
}

/* Timeline */
.lm-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-week {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.week-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.milestone {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  background: #F8F9FA;
  border-radius: 6px;
  border-left: 3px solid #D1D5DB;
}

.resource-tag {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  color: #6B7280;
  padding-left: 18px;
}

.milestone.completed {
  border-left-color: #10B981;
  background: #ECFDF5;
}

.milestone.in-progress {
  border-left-color: #F59E0B;
  background: #FFFBEB;
}

.milestone.pending {
  border-left-color: #D1D5DB;
  background: #F8F9FA;
}

.milestone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D1D5DB;
  flex-shrink: 0;
}

.milestone.completed .milestone-dot {
  background: #10B981;
}

.milestone.in-progress .milestone-dot {
  background: #F59E0B;
}

.milestone-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #1F2937;
}

/* Footer */
.lm-footer {
  padding-top: 10px;
  border-top: 2px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.progress-indicator {
  width: 100%;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-small {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6, #60A5FA);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.lm-label {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #6B7280;
  text-align: center;
}

/* CTA */
.section-cta {
  text-align: center;
  margin-top: 64px;
}

.cta-button {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  background: #000000;
  border: 3px solid #000000;
  padding: 16px 48px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.cta-button:hover {
  background: #FFFFFF;
  color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Tablet */
@media (max-width: 1024px) {
  .workflow-builder-section {
    padding: 80px 0;
  }

  .section-container {
    padding: 0 32px;
  }

  .section-title {
    font-size: 36px;
  }

  .section-subtitle {
    font-size: 18px;
  }

  .vue-flow-wrapper {
    height: 500px;
  }

  .learning-map-container {
    display: none;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .workflow-builder-section {
    padding: 60px 0;
  }

  .section-container {
    padding: 0 20px;
  }

  .section-header {
    margin-bottom: 48px;
  }

  .section-title {
    font-size: 28px;
  }

  .section-subtitle {
    font-size: 16px;
  }

  .vue-flow-wrapper {
    height: 400px;
  }

  .cta-button {
    font-size: 14px;
    padding: 14px 32px;
  }
}
</style>
