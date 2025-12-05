# Workflow Lab - Complete Implementation Plan

## Current Problems Summary
1. ❌ Node Inspector doesn't open when clicking nodes
2. ❌ Editing content in inspector doesn't update the node visually
3. ❌ "Add to Canvas" from AI Assistant doesn't work
4. ❌ + button doesn't create connected nodes
5. ❌ Workflow execution fails or doesn't show results
6. ❌ No state persistence between page reloads
7. ❌ ReactFlow and Zustand store not synced

## Proposed Solution - Complete Rewrite

### Phase 1: Core Store Architecture ✅
**File: `frontend/src/stores/workflowStore.js`**

```javascript
Features:
- ✅ Auto-save to localStorage using zustand persist
- ✅ Console logging for debugging
- ✅ Proper node/edge ID generation
- ✅ Direct updateNode() method that triggers re-render
- ✅ executeWorkflow() with real backend API calls
- ✅ Clear error handling and status updates
```

### Phase 2: Workflow Lab Container ✅
**File: `frontend/src/pages/WorkflowLab/index.jsx`**

```javascript
Key Changes:
1. Remove useNodesState/useEdgesState (causes sync issues)
2. Use workflowStore directly as single source of truth
3. Add onNodeClick={(event, node) => setSelectedNodeId(node.id)}
4. Use useEffect to load saved workflow on mount
5. Simplify - let store handle all mutations
```

### Phase 3: Node Components Redesign ✅
**Files: InputNode.jsx, AnalyzeNode.jsx, OutputNode.jsx**

```javascript
Key Changes:
1. onClick on outer <div> to open inspector
2. + button calls workflowStore.addNode() + workflowStore.addEdge()
3. Remove local state - everything from node.data
4. Show content preview if exists, "Click to edit" if empty
5. Show status indicator during execution
```

### Phase 4: Node Inspector Fix ✅
**File: `frontend/src/pages/WorkflowLab/components/NodeInspector.jsx`**

```javascript
Key Changes:
1. Use workflowStore.selectedNodeId to get current node
2. Local formData state for editing
3. Save button: workflowStore.updateNode(selectedNodeId, formData)
4. Auto-close after save
5. Real-time preview as you type
```

### Phase 5: Add to Canvas Fix ✅
**File: `frontend/src/stores/assistantStore.js`**

```javascript
addPostToCanvas: (post) => {
  // 1. Switch to workflow mode
  useUIStore.getState().setMode('workflow');

  // 2. Create node
  const node = {
    type: 'inputNode',
    position: { x: 250, y: 250 },
    data: {
      source: 'ai',
      content: post.preview,
      url: post.url,
      title: post.title,
      wordCount: post.preview.split(' ').length
    }
  };

  // 3. Add to workflow
  useWorkflowStore.getState().addNode(node);

  // 4. Close AI drawer
  useUIStore.getState().setAssistantOpen(false);
}
```

### Phase 6: Results Panel NEW ✅
**File: `frontend/src/pages/WorkflowLab/components/ResultsPanel.jsx`**

```javascript
Features:
- Slides up from bottom when execution completes
- Shows analysis results for each node
- Links to full analysis view
- Closeable with X button
- Dark mode support
```

## Testing Checklist

### Manual Test Flow:
1. ✅ Open Workflow Lab
2. ✅ Click "+ Input" button → node appears
3. ✅ Click on the node → inspector opens on right
4. ✅ Type content in textarea → see word count update
5. ✅ Click "Save Changes" → inspector closes, node shows preview
6. ✅ Hover over input node → see "+ Analyze" button
7. ✅ Click "+ Analyze" → new analyze node appears connected
8. ✅ Click new analyze node → inspector opens
9. ✅ Select analysis operations → save
10. ✅ Click "Execute" button → see nodes change status
11. ✅ Wait for completion → results panel appears
12. ✅ Refresh page → workflow persists
13. ✅ Open AI Assistant → ask question
14. ✅ Click "Add to Canvas" on post → switches to workflow, adds node
15. ✅ Connect nodes manually → drag from handle to handle

## File Changes Required

### New Files:
- `frontend/src/pages/WorkflowLab/components/ResultsPanel.jsx`

### Complete Rewrites:
- `frontend/src/stores/workflowStore.js` ← MOST CRITICAL
- `frontend/src/pages/WorkflowLab/index.jsx`
- `frontend/src/pages/WorkflowLab/nodes/InputNode.jsx`
- `frontend/src/pages/WorkflowLab/nodes/AnalyzeNode.jsx`

### Major Edits:
- `frontend/src/pages/WorkflowLab/components/NodeInspector.jsx`
- `frontend/src/stores/assistantStore.js` (addPostToCanvas only)

## Implementation Order

1. **workflowStore.js** - Foundation, must be perfect
2. **WorkflowLab/index.jsx** - Container, uses store correctly
3. **Node components** - Clickable, show data correctly
4. **NodeInspector.jsx** - Edit and save working
5. **ResultsPanel.jsx** - Show execution results
6. **assistantStore.js** - Add to canvas integration
7. **End-to-end testing** - Full user flow

## Success Criteria

✅ Click node → inspector opens
✅ Edit content → save → see update immediately
✅ + button → new connected node appears
✅ Execute → see real backend analysis
✅ Results → displayed in panel
✅ Add from AI → node appears in workflow
✅ Reload page → workflow persists
✅ Dark mode → everything looks good

## Ready to Proceed?

This plan will take approximately 1-2 hours to implement properly with testing.
Each step builds on the previous, so order matters.

Shall I proceed with the complete rewrite following this plan?
