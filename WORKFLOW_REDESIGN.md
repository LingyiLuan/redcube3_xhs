# Workflow Lab Complete Redesign

## Problems Identified:
1. ❌ State not syncing between ReactFlow and Zustand store
2. ❌ Nodes not clickable to edit
3. ❌ Inspector panel not opening when clicking nodes
4. ❌ Add to Canvas from AI not working
5. ❌ + button not creating connected nodes
6. ❌ Node data not persisting after edit
7. ❌ No workflow save/load functionality

## Solution Architecture:

### 1. State Management (workflowStore.js)
- Single source of truth for all workflow state
- Real-time sync with ReactFlow using `useEffect`
- Persist to localStorage on every change
- Clear separation: store manages data, ReactFlow renders it

### 2. Node Interaction Flow:
```
User clicks node →
  onNodeClick() →
    workflowStore.setSelectedNodeId(id) →
      uiStore.setInspectorOpen(true) →
        NodeInspector renders with node data

User edits in inspector →
  handleSave() →
    workflowStore.updateNode(id, newData) →
      ReactFlow re-renders with updated data
```

### 3. Add Node Flow (+ button):
```
User clicks + on InputNode →
  handleAddAnalyze() →
    1. Create new AnalyzeNode at position (x, y+150)
    2. workflowStore.addNode(newNode)
    3. workflowStore.addEdge({ source: currentId, target: newNodeId })
    4. ReactFlow auto-renders new node + edge
```

### 4. Add to Canvas from AI:
```
User clicks "Add to Canvas" →
  addPostToCanvas(post) →
    1. Switch to workflow mode: uiStore.setMode('workflow')
    2. Create InputNode with post content
    3. workflowStore.addNode(node)
    4. Close AI drawer
```

### 5. Workflow Execution:
```
User clicks Execute →
  executeWorkflow() →
    For each InputNode:
      1. Validate has content
      2. Find connected AnalyzeNodes via edges
      3. For each AnalyzeNode:
         - Update status: 'analyzing'
         - Call API: POST /content/analyze-single
         - Update node with results
         - Update status: 'completed'
```

### 6. Save/Load:
```
Auto-save on change →
  localStorage.setItem('workflow', JSON.stringify({ nodes, edges }))

On mount →
  const saved = localStorage.getItem('workflow')
  if (saved) workflowStore.loadWorkflow(JSON.parse(saved))
```

## Implementation Plan:

### Step 1: Fix workflowStore (complete rewrite)
- ✅ Add proper state sync
- ✅ Add selectedNodeId tracking
- ✅ Add auto-save to localStorage
- ✅ Fix executeWorkflow to actually work

### Step 2: Fix WorkflowLab
- ✅ Add onNodeClick handler
- ✅ Sync nodes/edges with store using useEffect
- ✅ Remove duplicate state management
- ✅ Add auto-load from localStorage on mount

### Step 3: Fix Nodes
- ✅ Make entire node clickable (onClick on outer div)
- ✅ Fix + button to create AND connect nodes
- ✅ Show content preview properly
- ✅ Add loading states during execution

### Step 4: Fix NodeInspector
- ✅ Open on node click
- ✅ Save button actually updates node
- ✅ Close on save
- ✅ Immediate visual feedback

### Step 5: Fix Add to Canvas
- ✅ Switch to workflow mode
- ✅ Actually add node to store
- ✅ Close AI drawer
- ✅ Visual confirmation

### Step 6: Add Results Panel
- ✅ Show execution results at bottom
- ✅ Display analysis output
- ✅ Link to full analysis view

## Key Fixes:

1. **Single onClick handler on node container** - makes whole node clickable
2. **useEffect syncs** - WorkflowLab syncs local state ← workflowStore
3. **Direct store calls** - Nodes call workflowStore.addNode() directly
4. **No intermediate state** - ReactFlow → workflowStore → ReactFlow (one-way data flow)
5. **Auto-save** - Every store mutation triggers localStorage save
