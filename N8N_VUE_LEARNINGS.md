# 🎯 N8N & Vue Flow Learnings for RedCube Workflow Lab Migration

**Date**: 2025-01-11
**Purpose**: Document architectural patterns and implementation strategies from n8n's Vue 3 workflow editor to guide the migration of RedCube's React-based Workflow Lab to Vue 3.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [N8N Frontend Architecture](#n8n-frontend-architecture)
3. [Vue Flow Library Deep Dive](#vue-flow-library-deep-dive)
4. [Pinia State Management Patterns](#pinia-state-management-patterns)
5. [Component Architecture](#component-architecture)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Code Examples](#code-examples)
8. [Migration Strategy](#migration-strategy)

---

## 🎬 Executive Summary

### Key Takeaways

**n8n's Architecture**:
- Built on **Vue 3** with **Composition API**
- Uses **Vue Flow** for canvas-based workflow editing (not React Flow)
- **Pinia stores** for granular state management
- Modular component-based design with clear separation of concerns

**Our Current State (React)**:
- React 18 with Hooks
- React Flow for canvas
- Zustand for state management
- Working API integration with auth

**Migration Benefits**:
- Leverage Vue Flow's native Vue 3 integration
- Pinia's TypeScript support and dev tools
- Cleaner component architecture inspired by n8n
- Better performance with Vue's reactivity system

---

## 🏗️ N8N Frontend Architecture

### Core Architecture Principles

#### 1. **Component Hierarchy**

```
NodeView.vue (Main Editor)
├── Canvas.vue / WorkflowCanvas.vue
│   ├── Custom Node Components
│   ├── Custom Edge Components
│   └── Connection Lines
├── NodeCreator.vue (Node Palette)
├── FocusPanel.vue (Node Detail View)
└── Modals (via UIStore)
```

#### 2. **State Management with Pinia**

n8n uses **multiple specialized Pinia stores**:

| Store | Purpose | Key Responsibilities |
|-------|---------|---------------------|
| `useWorkflowsStore` | Workflow data | CRUD operations, execution state |
| `useUIStore` | Interface state | Modals, panels, theme |
| `useFocusPanelStore` | Node editing | Parameter management, validation |
| `useNodeTypesStore` | Node registry | Available node types, icons |
| `useExecutionStore` | Workflow execution | Running workflows, results |

**Key Pattern**: Each store is focused on a single domain, avoiding monolithic state.

#### 3. **Interaction Patterns**

n8n uses three communication methods:
1. **Vue Events**: Parent-child component communication
2. **Event Bus**: Cross-component messaging (sparingly)
3. **Pinia Actions**: State mutations and side effects

#### 4. **Key Components Breakdown**

**NodeView.vue** (Main Container):
- Initializes workflow routes
- Coordinates canvas, focus panel, and node creator
- Manages workflow execution lifecycle

**Canvas.vue / WorkflowCanvas.vue** (Vue Flow Wrapper):
- Wraps Vue Flow with custom logic
- Handles zoom, pan, selection
- Manages node/edge rendering
- Implements drag-drop from node palette

**FocusPanel / Node Detail View**:
- Modal-based node configuration
- Parameter inputs with validation
- Expression editor for data mapping

**NodeCreator** (Node Palette):
- Searchable node library
- Drag-to-canvas interaction
- Categorized node types

---

## 🌊 Vue Flow Library Deep Dive

### Why Vue Flow?

Vue Flow is the **de facto standard** for flowchart/workflow UIs in Vue 3, directly inspired by React Flow but built natively for Vue.

### Core Concepts

#### 1. **Nodes Structure**

Every node requires:
```typescript
interface Node {
  id: string              // Unique identifier
  type: string            // 'default' | 'input' | 'output' | custom
  position: { x: number, y: number }
  data: any               // Custom data payload
  selected?: boolean
  draggable?: boolean
  connectable?: boolean
}
```

**Built-in Node Types**:
- `default`: Branching node with 2 handles
- `input`: Start node (1 source handle)
- `output`: End node (1 target handle)

**Custom Node Types**: Unlimited via Vue components

#### 2. **Edges Structure**

```typescript
interface Edge {
  id: string              // Unique identifier
  source: string          // Source node ID
  target: string          // Target node ID
  sourceHandle?: string   // Optional handle ID
  targetHandle?: string   // Optional handle ID
  type?: string           // 'default' | 'step' | 'smoothstep' | 'straight'
  animated?: boolean
  label?: string
  data?: any
}
```

**Built-in Edge Types**:
- `default`: Bezier curve (smooth, organic)
- `step`: Right-angle connections
- `smoothstep`: Rounded right-angles
- `straight`: Direct line

#### 3. **useVueFlow Composable**

The **central API** for interacting with Vue Flow state:

```typescript
const {
  // State
  nodes,           // Ref<Node[]>
  edges,           // Ref<Edge[]>
  viewport,        // Ref<Viewport>

  // Actions
  addNodes,        // (nodes: Node[]) => void
  addEdges,        // (edges: Edge[]) => void
  removeNodes,     // (ids: string[]) => void
  removeEdges,     // (ids: string[]) => void
  updateNode,      // (id: string, update: Partial<Node>) => void
  updateEdge,      // (id: string, update: Partial<Edge>) => void

  // Events
  onConnect,       // (handler: (params: Connection) => void) => void
  onNodeClick,     // (handler: (event: Event, node: Node) => void) => void
  onNodeDragStart, // (handler: (event: Event, node: Node) => void) => void
  onNodeDragStop,  // (handler: (event: Event, node: Node) => void) => void

  // Viewport
  setViewport,     // (viewport: Viewport) => void
  fitView,         // (options?: FitViewOptions) => void
  zoomIn,          // () => void
  zoomOut,         // () => void

  // Selection
  getSelectedNodes, // () => Node[]
  getSelectedEdges, // () => Edge[]

} = useVueFlow()
```

#### 4. **Handles for Connections**

Handles define connection points on nodes:

```vue
<template>
  <div class="custom-node">
    <!-- Target handle (receives connections) -->
    <Handle
      type="target"
      position="top"
      :id="'input-' + id"
    />

    <div class="node-content">
      {{ data.label }}
    </div>

    <!-- Source handle (creates connections) -->
    <Handle
      type="source"
      position="bottom"
      :id="'output-' + id"
    />
  </div>
</template>
```

**Handle Positions**: `top`, `right`, `bottom`, `left`

#### 5. **Basic Vue Flow Setup**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'

const nodes = ref([
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: 'Start' }
  }
])

const edges = ref([])

const { onConnect, addEdges } = useVueFlow()

// Auto-create edges when handles connect
onConnect((params) => {
  addEdges([params])
})
</script>

<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    fit-view-on-init
  >
    <Background />
    <Controls />
    <MiniMap />
  </VueFlow>
</template>

<style>
.vue-flow {
  height: 100vh;
}
</style>
```

#### 6. **Custom Nodes**

```vue
<!-- CustomInputNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface Props {
  id: string
  data: {
    label: string
    content?: string
  }
}

defineProps<Props>()
</script>

<template>
  <div class="custom-input-node">
    <div class="node-header">
      <FileText :size="16" />
      <span>{{ data.label }}</span>
    </div>

    <div v-if="data.content" class="node-content">
      {{ data.content }}
    </div>

    <Handle
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<style scoped>
.custom-input-node {
  padding: 12px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  min-width: 200px;
}
</style>
```

Register custom nodes:

```typescript
import { markRaw } from 'vue'
import CustomInputNode from './CustomInputNode.vue'

const nodeTypes = {
  'customInput': markRaw(CustomInputNode)
}
```

```vue
<VueFlow :node-types="nodeTypes" ... />
```

#### 7. **Event Handling**

```typescript
const { onNodeClick, onNodeDragStop, onConnect } = useVueFlow()

// Node interactions
onNodeClick((event, node) => {
  console.log('Clicked node:', node.id)
  // Open inspector panel, etc.
})

onNodeDragStop((event, node) => {
  // Save node position
  workflowStore.updateNodePosition(node.id, node.position)
})

// Connection creation
onConnect((connection) => {
  // Validate connection
  if (isValidConnection(connection)) {
    addEdges([connection])
  }
})
```

#### 8. **Zoom & Pan Controls**

```vue
<script setup>
import { Controls, Background } from '@vue-flow/core'

const { zoomIn, zoomOut, fitView } = useVueFlow()
</script>

<template>
  <VueFlow>
    <!-- Built-in controls -->
    <Controls />

    <!-- Custom controls -->
    <Panel position="top-left">
      <button @click="zoomIn">Zoom In</button>
      <button @click="zoomOut">Zoom Out</button>
      <button @click="fitView">Fit View</button>
    </Panel>

    <!-- Canvas background -->
    <Background variant="dots" :gap="16" />
  </VueFlow>
</template>
```

---

## 📦 Pinia State Management Patterns

### Best Practices from Research

#### 1. **Modular Store Architecture**

**❌ Don't**: Create a monolithic store

```typescript
// BAD: Single huge store
export const useAppStore = defineStore('app', {
  state: () => ({
    workflows: [],
    nodes: [],
    edges: [],
    user: {},
    ui: {},
    assistant: {},
    // ... everything
  })
})
```

**✅ Do**: Break into focused stores

```typescript
// GOOD: Separate domain stores
export const useWorkflowStore = defineStore('workflow', { ... })
export const useUIStore = defineStore('ui', { ... })
export const useAssistantStore = defineStore('assistant', { ... })
export const useAuthStore = defineStore('auth', { ... })
```

#### 2. **Store Definition Pattern**

**Setup Stores** (Recommended for complex logic):

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWorkflowStore = defineStore('workflow', () => {
  // State (like data())
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const isExecuting = ref(false)

  // Getters (like computed)
  const inputNodes = computed(() =>
    nodes.value.filter(n => n.type === 'input')
  )

  // Actions (like methods)
  async function executeWorkflow() {
    isExecuting.value = true
    try {
      // API call...
    } finally {
      isExecuting.value = false
    }
  }

  return {
    // State
    nodes,
    edges,
    isExecuting,

    // Getters
    inputNodes,

    // Actions
    executeWorkflow
  }
})
```

**Options Stores** (Simpler alternative):

```typescript
export const useWorkflowStore = defineStore('workflow', {
  state: () => ({
    nodes: [],
    edges: [],
    isExecuting: false
  }),

  getters: {
    inputNodes: (state) => state.nodes.filter(n => n.type === 'input')
  },

  actions: {
    async executeWorkflow() {
      this.isExecuting = true
      try {
        // API call...
      } finally {
        this.isExecuting = false
      }
    }
  }
})
```

#### 3. **Composing Stores**

Stores can use each other:

```typescript
// workflowStore.ts
export const useWorkflowStore = defineStore('workflow', () => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  async function executeWorkflow() {
    // Use auth token
    const token = authStore.token

    // Show loading UI
    uiStore.setLoading(true)

    try {
      await api.post('/analyze', { token })
      uiStore.showToast('Success!')
    } catch (error) {
      uiStore.showToast('Error: ' + error.message)
    } finally {
      uiStore.setLoading(false)
    }
  }

  return { executeWorkflow }
})
```

**⚠️ Avoid Circular Dependencies**: Don't have Store A import Store B and Store B import Store A.

#### 4. **Actions Best Practices**

**Async Actions**:

```typescript
async function analyzeNode(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) throw new Error('Node not found')

  // Optimistic update
  updateNode(nodeId, { status: 'analyzing' })

  try {
    const result = await api.post('/analyze', {
      text: node.data.content
    })

    // Update with result
    updateNode(nodeId, {
      status: 'completed',
      analysisResult: result.data
    })

    return result.data
  } catch (error) {
    // Revert on error
    updateNode(nodeId, {
      status: 'error',
      error: error.message
    })

    throw error
  }
}
```

**Direct State Mutation** (allowed in Pinia):

```typescript
// This is OK in Pinia (unlike Vuex)
function updateNode(id: string, updates: Partial<Node>) {
  const node = nodes.value.find(n => n.id === id)
  if (node) {
    Object.assign(node, updates)
  }
}
```

#### 5. **Persistence with Plugins**

```typescript
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export const useWorkflowStore = defineStore('workflow',
  () => {
    // ... store logic
  },
  {
    persist: {
      key: 'redcube-workflow',
      paths: ['nodes', 'edges'] // Only persist these
    }
  }
)
```

#### 6. **TypeScript Integration**

```typescript
import { defineStore } from 'pinia'

interface Node {
  id: string
  type: 'input' | 'analyze' | 'output'
  position: { x: number, y: number }
  data: {
    label: string
    content?: string
    status?: 'idle' | 'analyzing' | 'completed' | 'error'
    analysisResult?: AnalysisResult
  }
}

interface AnalysisResult {
  id: number
  summary: string
  insights: string[]
}

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])

  function addNode(node: Node): void {
    nodes.value.push(node)
  }

  // TypeScript infers return types
  const inputNodes = computed(() =>
    nodes.value.filter(n => n.type === 'input')
  )

  return { nodes, edges, addNode, inputNodes }
})
```

---

## 🧩 Component Architecture

### Proposed Vue 3 Structure

```
src/
├── views/
│   └── WorkflowEditor.vue           # Main page
│
├── components/
│   ├── Canvas/
│   │   ├── WorkflowCanvas.vue       # Vue Flow wrapper
│   │   ├── CanvasControls.vue       # Zoom, pan, fit view
│   │   └── CanvasBackground.vue     # Grid/dot pattern
│   │
│   ├── Nodes/
│   │   ├── InputNode.vue            # Custom input node
│   │   ├── AnalyzeNode.vue          # Custom analyze node
│   │   ├── OutputNode.vue           # Custom output node
│   │   └── NodeHandle.vue           # Reusable handle component
│   │
│   ├── Edges/
│   │   └── CustomEdge.vue           # Custom edge styling
│   │
│   ├── Toolbar/
│   │   ├── WorkflowToolbar.vue      # Top toolbar
│   │   └── NodePalette.vue          # Draggable node list
│   │
│   ├── Inspector/
│   │   ├── NodeInspector.vue        # Right panel for node editing
│   │   └── ResultsPanel.vue         # Analysis results display
│   │
│   └── Assistant/
│       ├── AiAssistant.vue          # Fixed bottom-center panel
│       ├── ChatMessage.vue          # Individual message
│       └── SuggestedActions.vue     # "Add to Canvas" buttons
│
├── stores/
│   ├── workflowStore.ts             # Nodes, edges, execution
│   ├── uiStore.ts                   # Panels, modals, theme
│   ├── assistantStore.ts            # AI chat history, context
│   └── authStore.ts                 # User, token
│
├── services/
│   ├── apiService.ts                # Axios instance, interceptors
│   ├── analysisService.ts           # /analyze, /analyze/batch
│   └── assistantService.ts          # /assistant/query
│
├── composables/
│   ├── useCanvasOperations.ts       # Canvas helpers
│   ├── useNodeOperations.ts         # Node CRUD
│   └── useWorkflowExecution.ts      # Execute, save, load
│
├── types/
│   ├── workflow.ts                  # Node, Edge, Workflow types
│   ├── analysis.ts                  # AnalysisResult types
│   └── assistant.ts                 # Message, Context types
│
└── utils/
    ├── uuid.ts                      # ID generation
    └── validation.ts                # Input validation
```

### Component Responsibilities

#### WorkflowEditor.vue (Main View)

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

onMounted(() => {
  workflowStore.loadWorkflow()
})
</script>

<template>
  <div class="workflow-editor">
    <!-- Top toolbar -->
    <WorkflowToolbar />

    <!-- Main content area -->
    <div class="editor-content">
      <!-- Left: Node palette (optional) -->
      <NodePalette v-if="uiStore.showPalette" />

      <!-- Center: Canvas -->
      <WorkflowCanvas />

      <!-- Right: Inspector panel -->
      <NodeInspector v-if="uiStore.showInspector" />
    </div>

    <!-- Fixed bottom-center: AI Assistant -->
    <AiAssistant />
  </div>
</template>
```

#### WorkflowCanvas.vue (Vue Flow Wrapper)

```vue
<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background, Controls } from '@vue-flow/core'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'

// Node types
import InputNode from '@/components/Nodes/InputNode.vue'
import AnalyzeNode from '@/components/Nodes/AnalyzeNode.vue'
import OutputNode from '@/components/Nodes/OutputNode.vue'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()
const { nodes, edges } = storeToRefs(workflowStore)

const nodeTypes = {
  input: markRaw(InputNode),
  analyze: markRaw(AnalyzeNode),
  output: markRaw(OutputNode)
}

const { onConnect, addEdges, onNodeClick } = useVueFlow()

// Auto-create edges
onConnect((params) => {
  workflowStore.addEdge(params)
})

// Open inspector on click
onNodeClick((event, node) => {
  workflowStore.setSelectedNode(node.id)
  uiStore.openInspector()
})
</script>

<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    fit-view-on-init
    class="workflow-canvas"
  >
    <Background variant="dots" />
    <Controls />
  </VueFlow>
</template>

<style>
.workflow-canvas {
  width: 100%;
  height: 100%;
  background: #ffffff;
}
</style>
```

#### InputNode.vue (Custom Node)

```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { FileText, Play, Loader2, CheckCircle, XCircle } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'

interface Props {
  id: string
  data: {
    label: string
    content?: string
    status?: 'idle' | 'analyzing' | 'completed' | 'error'
    analysisResult?: any
    error?: string
  }
  selected?: boolean
}

const props = defineProps<Props>()
const workflowStore = useWorkflowStore()

const statusColor = computed(() => {
  switch (props.data.status) {
    case 'analyzing': return 'border-yellow-400 bg-yellow-50'
    case 'completed': return 'border-green-400 bg-green-50'
    case 'error': return 'border-red-400 bg-red-50'
    default: return 'border-blue-400 bg-blue-50'
  }
})

const statusIcon = computed(() => {
  switch (props.data.status) {
    case 'analyzing': return Loader2
    case 'completed': return CheckCircle
    case 'error': return XCircle
    default: return FileText
  }
})

async function handleAnalyze() {
  await workflowStore.analyzeNode(props.id)
}
</script>

<template>
  <div
    :class="[
      'input-node',
      statusColor,
      { 'ring-2 ring-blue-500': selected }
    ]"
  >
    <Handle type="target" :position="Position.Top" />

    <!-- Header -->
    <div class="node-header">
      <component :is="statusIcon" :size="16" />
      <span>{{ data.label }}</span>

      <button
        v-if="data.content"
        @click.stop="handleAnalyze"
        :disabled="data.status === 'analyzing'"
        class="analyze-btn"
      >
        <Play :size="14" />
      </button>
    </div>

    <!-- Content preview -->
    <div v-if="data.content" class="node-content">
      {{ data.content.slice(0, 100) }}...
    </div>

    <!-- Error display -->
    <div v-if="data.error" class="node-error">
      {{ data.error }}
    </div>

    <!-- Result preview -->
    <div v-if="data.analysisResult" class="node-result">
      ✓ Analysis #{{ data.analysisResult.id }}
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.input-node {
  padding: 12px;
  border: 2px solid;
  border-radius: 8px;
  min-width: 220px;
  max-width: 300px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
}

.analyze-btn {
  margin-left: auto;
  padding: 4px;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}

.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.node-content {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.node-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 8px;
}

.node-result {
  font-size: 12px;
  color: #10b981;
  margin-top: 8px;
}
</style>
```

#### AiAssistant.vue (Fixed Panel)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssistantStore } from '@/stores/assistantStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { Sparkles, Send } from 'lucide-vue-next'

const assistantStore = useAssistantStore()
const workflowStore = useWorkflowStore()

const isOpen = ref(false)
const message = ref('')

const messages = computed(() => assistantStore.messages)

async function sendMessage() {
  if (!message.value.trim()) return

  await assistantStore.sendMessage(message.value, {
    workflowId: workflowStore.workflowId,
    nodes: workflowStore.nodes
  })

  message.value = ''
}

function addToCanvas(data: any) {
  workflowStore.addNode({
    type: 'input',
    position: { x: Math.random() * 400, y: Math.random() * 300 },
    data: {
      label: 'From AI',
      content: data.text
    }
  })
}
</script>

<template>
  <div class="ai-assistant">
    <!-- Collapsed button -->
    <button
      v-if="!isOpen"
      @click="isOpen = true"
      class="assistant-toggle"
    >
      <Sparkles :size="20" />
      <span>AI Assistant</span>
    </button>

    <!-- Expanded panel -->
    <div v-else class="assistant-panel">
      <!-- Header -->
      <div class="assistant-header">
        <Sparkles :size="20" />
        <span>AI Assistant</span>
        <button @click="isOpen = false">×</button>
      </div>

      <!-- Messages -->
      <div class="assistant-messages">
        <ChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          @add-to-canvas="addToCanvas"
        />
      </div>

      <!-- Input -->
      <div class="assistant-input">
        <input
          v-model="message"
          @keyup.enter="sendMessage"
          placeholder="Ask about your workflow..."
        />
        <button @click="sendMessage">
          <Send :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.assistant-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
  transition: all 0.3s ease;
}

.assistant-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(168, 85, 247, 0.5);
}

.assistant-panel {
  width: 480px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  font-weight: 600;
}

.assistant-header button {
  margin-left: auto;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.assistant-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.assistant-input {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
}

.assistant-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
}

.assistant-input button {
  padding: 8px 16px;
  background: #a855f7;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Set up Vue 3 project structure with Vue Flow

- [ ] Initialize Vue 3 project with Vite
- [ ] Install dependencies: `@vue-flow/core`, `pinia`, `axios`, `tailwindcss`
- [ ] Create folder structure
- [ ] Set up Pinia stores (workflow, ui, auth, assistant)
- [ ] Configure API service with interceptors
- [ ] Implement basic types (Node, Edge, AnalysisResult)

### Phase 2: Canvas Implementation (Week 2)

**Goal**: Working Vue Flow canvas with custom nodes

- [ ] Implement WorkflowCanvas.vue with Vue Flow
- [ ] Create custom node components (Input, Analyze, Output)
- [ ] Implement node handles and connections
- [ ] Add zoom/pan/fit view controls
- [ ] Implement node drag & drop
- [ ] Add canvas background (dots/grid)

### Phase 3: State Management (Week 3)

**Goal**: Full workflow CRUD and execution

- [ ] Implement workflowStore actions (add/remove/update nodes)
- [ ] Add edge management (create/delete connections)
- [ ] Implement node selection and inspector panel
- [ ] Add workflow execution logic (single + batch)
- [ ] Implement persistence (localStorage + backend)
- [ ] Add error handling and loading states

### Phase 4: AI Assistant (Week 4)

**Goal**: Integrated RAG-powered AI assistant

- [ ] Implement AiAssistant.vue (fixed bottom-center panel)
- [ ] Create assistantStore (messages, context)
- [ ] Integrate with `/api/assistant/query` endpoint
- [ ] Add "Add to Canvas" functionality
- [ ] Implement suggested actions from AI responses
- [ ] Add chat history and context management

### Phase 5: UI Polish (Week 5)

**Goal**: Production-ready styling and UX

- [ ] Implement WorkflowToolbar (save, execute, export)
- [ ] Add NodeInspector panel (edit content, view results)
- [ ] Create toast notification system
- [ ] Add loading indicators and status badges
- [ ] Implement dark mode (optional)
- [ ] Add keyboard shortcuts (Cmd+K for assistant)
- [ ] Responsive layout for 13" screens

### Phase 6: Testing & Migration (Week 6)

**Goal**: Feature parity with React version

- [ ] End-to-end testing with Vitest
- [ ] API integration testing
- [ ] Authentication flow testing
- [ ] Migrate existing workflows from React version
- [ ] Performance optimization
- [ ] Documentation and deployment

---

## 💻 Code Examples

### Complete Store: workflowStore.ts

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { analysisService } from '@/services/analysisService'
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'

export const useWorkflowStore = defineStore('workflow', () => {
  // ===== STATE =====
  const workflowId = ref('default-workflow')
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const isExecuting = ref(false)
  const executionResults = ref<any>(null)

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

  // ===== ACTIONS: NODE OPERATIONS =====

  function addNode(nodeConfig: Partial<Node>) {
    const newNode: Node = {
      id: generateId(),
      type: nodeConfig.type || 'input',
      position: nodeConfig.position || { x: 100, y: 100 },
      data: {
        label: nodeConfig.data?.label || 'New Node',
        status: 'idle',
        ...nodeConfig.data
      }
    }

    nodes.value.push(newNode)
    selectedNodeId.value = newNode.id

    // Auto-save
    scheduleAutosave()

    return newNode
  }

  function updateNode(nodeId: string, updates: Partial<Node['data']>) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      Object.assign(node.data, updates)
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

    scheduleAutosave()
  }

  // ===== ACTIONS: EDGE OPERATIONS =====

  function addEdge(connection: any) {
    const newEdge: Edge = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'smoothstep',
      animated: true
    }

    // Prevent duplicates
    const exists = edges.value.some(
      e => e.source === newEdge.source && e.target === newEdge.target
    )

    if (!exists) {
      edges.value.push(newEdge)
      scheduleAutosave()
    }
  }

  function removeEdge(edgeId: string) {
    edges.value = edges.value.filter(e => e.id !== edgeId)
    scheduleAutosave()
  }

  // ===== ACTIONS: WORKFLOW EXECUTION =====

  async function analyzeNode(nodeId: string) {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) throw new Error('Node not found')

    if (!node.data.content?.trim()) {
      throw new Error('Node content is empty')
    }

    // Update status
    updateNode(nodeId, { status: 'analyzing' })

    try {
      const result = await analysisService.analyzeSingle(
        node.data.content,
        authStore.userId
      )

      // Update with result
      updateNode(nodeId, {
        status: 'completed',
        analysisResult: result
      })

      uiStore.showToast('Analysis complete!', 'success')

      return result
    } catch (error: any) {
      // Update with error
      updateNode(nodeId, {
        status: 'error',
        error: error.message
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

    isExecuting.value = true
    executionResults.value = null

    try {
      if (nodesToAnalyze.length === 1) {
        // Single node
        const result = await analyzeNode(nodesToAnalyze[0].id)

        executionResults.value = {
          mode: 'single',
          success: true,
          results: [{ nodeId: nodesToAnalyze[0].id, result }]
        }

        uiStore.showToast('Analysis complete!', 'success')
      } else {
        // Batch mode
        const results = await executeBatch(nodesToAnalyze)

        executionResults.value = {
          mode: 'batch',
          success: true,
          results
        }

        uiStore.showToast(
          `Batch complete: ${results.length} nodes analyzed`,
          'success'
        )
      }

      return executionResults.value
    } catch (error: any) {
      uiStore.showToast(`Execution failed: ${error.message}`, 'error')
      throw error
    } finally {
      isExecuting.value = false
    }
  }

  async function executeBatch(nodesToAnalyze: Node[]) {
    const authStore = useAuthStore()

    // Mark all as analyzing
    nodesToAnalyze.forEach(node => {
      updateNode(node.id, { status: 'analyzing' })
    })

    try {
      const posts = nodesToAnalyze.map(node => ({
        id: node.id,
        text: node.data.content
      }))

      const batchResult = await analysisService.analyzeBatch(
        posts,
        authStore.userId
      )

      // Map results back to nodes
      const results = []
      for (let i = 0; i < batchResult.individual_analyses.length; i++) {
        const analysis = batchResult.individual_analyses[i]
        const node = nodesToAnalyze[i]

        updateNode(node.id, {
          status: 'completed',
          analysisResult: analysis
        })

        results.push({ nodeId: node.id, result: analysis })
      }

      return results
    } catch (error: any) {
      // Mark all as error
      nodesToAnalyze.forEach(node => {
        updateNode(node.id, {
          status: 'error',
          error: error.message
        })
      })

      throw error
    }
  }

  // ===== ACTIONS: PERSISTENCE =====

  let autosaveTimer: any = null

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer)

    autosaveTimer = setTimeout(() => {
      saveWorkflow()
    }, 1500)
  }

  async function saveWorkflow() {
    // Save to localStorage
    const state = {
      workflowId: workflowId.value,
      nodes: nodes.value,
      edges: edges.value
    }

    localStorage.setItem('redcube-workflow', JSON.stringify(state))

    // TODO: Save to backend
    // await api.post('/workflows/save', state)
  }

  function loadWorkflow() {
    const saved = localStorage.getItem('redcube-workflow')

    if (saved) {
      const state = JSON.parse(saved)
      nodes.value = state.nodes || []
      edges.value = state.edges || []
      workflowId.value = state.workflowId || 'default-workflow'
    }
  }

  function clearWorkflow() {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    executionResults.value = null
  }

  // ===== UTILITIES =====

  function generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function setSelectedNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    workflowId,
    nodes,
    edges,
    selectedNodeId,
    isExecuting,
    executionResults,

    // Getters
    inputNodes,
    selectedNode,
    nodesWithContent,

    // Actions
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    analyzeNode,
    executeWorkflow,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow,
    setSelectedNode
  }
})
```

### Complete Store: assistantStore.ts

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { assistantService } from '@/services/assistantService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: any[]
}

export const useAssistantStore = defineStore('assistant', () => {
  // State
  const messages = ref<Message[]>([])
  const isLoading = ref(false)

  // Actions
  async function sendMessage(text: string, context: any) {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    messages.value.push(userMessage)
    isLoading.value = true

    try {
      // Call RAG backend
      const response = await assistantService.query(text, context)

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions || []
      }

      messages.value.push(assistantMessage)

      return assistantMessage
    } catch (error: any) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }

      messages.value.push(errorMessage)

      throw error
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages() {
    messages.value = []
  }

  function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  }
})
```

### Complete Service: analysisService.ts

```typescript
import apiClient from './apiService'

export const analysisService = {
  /**
   * Analyze single post
   */
  async analyzeSingle(text: string, userId?: number) {
    const response = await apiClient.post('/analyze', {
      text: text.trim(),
      userId
    })

    return response.data
  },

  /**
   * Batch analyze multiple posts
   */
  async analyzeBatch(
    posts: Array<{ id: string; text: string }>,
    userId?: number,
    analyzeConnections = true
  ) {
    const validPosts = posts.filter(p => p.text?.trim())

    const response = await apiClient.post('/analyze/batch', {
      posts: validPosts,
      userId,
      analyzeConnections
    })

    return response.data
  },

  /**
   * Get analysis history
   */
  async getHistory(limit = 10, userId?: number) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (userId) params.append('userId', userId.toString())

    const response = await apiClient.get(`/history?${params}`)

    return response.data
  }
}
```

---

## 🔄 Migration Strategy

### Current React Stack → Vue 3 Stack

| Current (React) | Target (Vue 3) | Notes |
|----------------|----------------|-------|
| React 18 | Vue 3.4+ | Composition API |
| React Flow | Vue Flow | Similar API, native Vue |
| Zustand | Pinia | Official Vue state management |
| React Router | Vue Router | Standard routing |
| Axios | Axios | Keep same (works with Vue) |
| Tailwind CSS | Tailwind CSS | Keep same configuration |
| Lucide React | Lucide Vue Next | Icon library Vue port |
| React Hot Toast | Vue Toastification | Toast notifications |

### Migration Steps

#### 1. **Component Mapping**

| React Component | Vue Component | Changes |
|----------------|---------------|---------|
| `WorkflowLab/index.jsx` | `WorkflowEditor.vue` | Use `<script setup>` |
| `nodes/InputNode.jsx` | `Nodes/InputNode.vue` | Props with `defineProps<T>()` |
| `components/Toolbar.jsx` | `Toolbar/WorkflowToolbar.vue` | Emits with `defineEmits` |
| `components/Inspector.jsx` | `Inspector/NodeInspector.vue` | v-model for two-way binding |
| `layouts/AssistantDrawer.jsx` | `Assistant/AiAssistant.vue` | Transition with `<Transition>` |

#### 2. **State Management Mapping**

**Zustand (React):**
```javascript
export const useWorkflowStore = create((set, get) => ({
  nodes: [],
  addNode: (node) => set(state => ({
    nodes: [...state.nodes, node]
  }))
}))
```

**Pinia (Vue):**
```typescript
export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref<Node[]>([])

  function addNode(node: Node) {
    nodes.value.push(node)
  }

  return { nodes, addNode }
})
```

#### 3. **Hooks → Composables**

**React Hook:**
```javascript
function useNodeOperations() {
  const { addNode } = useWorkflowStore()

  const handleAddNode = useCallback(() => {
    addNode({ ... })
  }, [addNode])

  return { handleAddNode }
}
```

**Vue Composable:**
```typescript
function useNodeOperations() {
  const workflowStore = useWorkflowStore()

  function handleAddNode() {
    workflowStore.addNode({ ... })
  }

  return { handleAddNode }
}
```

#### 4. **Effects → Lifecycle / Watchers**

**React useEffect:**
```javascript
useEffect(() => {
  loadWorkflow()
}, [])

useEffect(() => {
  if (selectedNode) {
    openInspector()
  }
}, [selectedNode])
```

**Vue onMounted / watch:**
```typescript
onMounted(() => {
  loadWorkflow()
})

watch(() => selectedNode.value, (newNode) => {
  if (newNode) {
    openInspector()
  }
})
```

#### 5. **API Service (No Changes)**

The existing API service with Axios can be used as-is in Vue:

```typescript
// services/apiService.ts (works in both React and Vue)
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api/content',
  timeout: 30000
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
```

---

## 📚 Key Differences: React vs Vue

### 1. **Component Syntax**

**React JSX:**
```jsx
export const InputNode = ({ id, data, selected }) => {
  const [content, setContent] = useState(data.content)

  return (
    <div className={selected ? 'selected' : ''}>
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  )
}
```

**Vue SFC:**
```vue
<script setup lang="ts">
interface Props {
  id: string
  data: { content?: string }
  selected?: boolean
}

const props = defineProps<Props>()
const content = ref(props.data.content)
</script>

<template>
  <div :class="{ selected }">
    <input v-model="content" />
  </div>
</template>
```

### 2. **Conditional Rendering**

**React:**
```jsx
{isVisible && <Component />}
{error ? <ErrorView /> : <SuccessView />}
```

**Vue:**
```vue
<Component v-if="isVisible" />
<ErrorView v-if="error" />
<SuccessView v-else />
```

### 3. **List Rendering**

**React:**
```jsx
{nodes.map(node => (
  <Node key={node.id} data={node} />
))}
```

**Vue:**
```vue
<Node
  v-for="node in nodes"
  :key="node.id"
  :data="node"
/>
```

### 4. **Event Handling**

**React:**
```jsx
<button onClick={handleClick}>Click</button>
<input onChange={(e) => setValue(e.target.value)} />
```

**Vue:**
```vue
<button @click="handleClick">Click</button>
<input @input="value = $event.target.value" />
<!-- Or with v-model -->
<input v-model="value" />
```

### 5. **Computed Values**

**React:**
```javascript
const filteredNodes = useMemo(() =>
  nodes.filter(n => n.type === 'input'),
  [nodes]
)
```

**Vue:**
```typescript
const filteredNodes = computed(() =>
  nodes.value.filter(n => n.type === 'input')
)
```

### 6. **Refs**

**React:**
```javascript
const divRef = useRef(null)

useEffect(() => {
  if (divRef.current) {
    divRef.current.focus()
  }
}, [])

return <div ref={divRef}>Content</div>
```

**Vue:**
```typescript
const divRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (divRef.value) {
    divRef.value.focus()
  }
})
```

```vue
<template>
  <div ref="divRef">Content</div>
</template>
```

---

## 🎨 Styling Guidelines

### Tailwind CSS (Same as React)

Vue works with Tailwind exactly like React:

```vue
<template>
  <div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click Me
    </button>
  </div>
</template>
```

### Dynamic Classes

**React:**
```jsx
<div className={cn(
  'base-class',
  selected && 'selected',
  error ? 'error' : 'success'
)}>
```

**Vue:**
```vue
<div :class="[
  'base-class',
  { selected: selected },
  error ? 'error' : 'success'
]">
```

Or use object syntax:

```vue
<div :class="{
  'base-class': true,
  'selected': selected,
  'error': error,
  'success': !error
}">
```

---

## ✅ Checklist for Vue Migration

### Pre-Migration

- [ ] Audit current React codebase
- [ ] Identify reusable logic (API calls, utils)
- [ ] Document current workflow state structure
- [ ] List all external dependencies
- [ ] Plan data migration strategy

### Setup

- [ ] Initialize Vue 3 project with Vite
- [ ] Configure TypeScript
- [ ] Install Vue Flow, Pinia, Tailwind
- [ ] Set up folder structure
- [ ] Configure dev environment

### Core Implementation

- [ ] Create Pinia stores (workflow, ui, auth, assistant)
- [ ] Port API service (no changes needed)
- [ ] Implement WorkflowEditor.vue (main view)
- [ ] Implement WorkflowCanvas.vue (Vue Flow wrapper)
- [ ] Create custom node components
- [ ] Create custom edge components
- [ ] Implement toolbar and controls

### Features

- [ ] Node operations (add, remove, update)
- [ ] Edge operations (connect, disconnect)
- [ ] Node selection and inspector
- [ ] Workflow execution (single + batch)
- [ ] AI Assistant integration
- [ ] Persistence (localStorage + backend)
- [ ] Authentication flow

### Polish

- [ ] Error handling and validation
- [ ] Loading states and progress indicators
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Responsive design
- [ ] Dark mode (optional)

### Testing

- [ ] Unit tests for stores
- [ ] Component tests
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Performance testing

### Deployment

- [ ] Build optimization
- [ ] Bundle size analysis
- [ ] Browser compatibility testing
- [ ] Production build
- [ ] Deployment to staging
- [ ] User acceptance testing
- [ ] Production deployment

---

## 🔗 Resources

### Official Documentation

- **Vue 3**: https://vuejs.org/
- **Vue Flow**: https://vueflow.dev/
- **Pinia**: https://pinia.vuejs.org/
- **Vite**: https://vitejs.dev/
- **TypeScript**: https://www.typescriptlang.org/

### Vue Flow Examples

- **Official Examples**: https://vueflow.dev/examples/
- **GitHub Repo**: https://github.com/bcakmakoglu/vue-flow

### N8N Source Code

- **GitHub**: https://github.com/n8n-io/n8n
- **Editor UI**: https://github.com/n8n-io/n8n/tree/master/packages/editor-ui

### Tools

- **Vue DevTools**: https://devtools.vuejs.org/
- **Pinia DevTools**: Integrated with Vue DevTools
- **Vite Dev Server**: Hot module replacement included

---

## 📝 Summary

### What We Learned from N8N

1. **Modular Store Architecture**: Separate stores for workflow, UI, execution, and node types
2. **Vue Flow Integration**: Native Vue 3 library for canvas-based workflows
3. **Component Composition**: Clear separation between canvas, nodes, edges, and panels
4. **State Management**: Pinia with setup stores for TypeScript support
5. **Event Handling**: Combination of Vue events, composables, and store actions

### What We'll Implement

1. **WorkflowEditor.vue**: Main page with toolbar, canvas, and panels
2. **WorkflowCanvas.vue**: Vue Flow wrapper with custom nodes and edges
3. **Custom Nodes**: InputNode, AnalyzeNode, OutputNode with status indicators
4. **AiAssistant.vue**: Fixed bottom-center panel for RAG queries
5. **Pinia Stores**: workflowStore, uiStore, assistantStore, authStore
6. **API Integration**: Reuse existing Axios service with auth interceptors

### Benefits of Vue 3 Migration

1. **Better TypeScript Support**: Pinia and Vue 3 have excellent type inference
2. **Smaller Bundle Size**: Vue 3 is lighter than React + dependencies
3. **Native Canvas Library**: Vue Flow is built for Vue, not ported
4. **Cleaner Syntax**: `<script setup>` is more concise than React Hooks
5. **Better Reactivity**: Vue's reactive system is more intuitive

---

**Next Steps**: Review this document, then proceed with Phase 1 implementation (Foundation setup).
