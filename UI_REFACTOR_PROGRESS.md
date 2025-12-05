# RedCube UI Refactor Progress

## ✅ **COMPLETED WORK** (Phase 1-2 Partial)

### Phase 1: Setup & Dependencies ✅
- [x] Installed all required dependencies:
  - `reactflow@11.10.4` - Canvas workflow system
  - `tailwindcss@3.4.1` - Styling framework
  - `@tailwindcss/forms@0.5.7` - Form styling
  - `postcss@8.4.35` + `autoprefixer@10.4.18` - CSS processing
  - `framer-motion@11.0.3` - Animations
  - `zustand@4.5.2` - State management
  - `lucide-react@0.344.0` - Icon library
  - `clsx@2.1.0` + `tailwind-merge@2.2.1` - Class name utilities
  - `class-variance-authority@0.7.0` - Component variants

- [x] Configured Tailwind CSS (`tailwind.config.js`):
  - Custom color palette (redcube-primary, redcube-secondary, node colors)
  - Inter font family
  - Custom animations (fade-in, slide-up, slide-down)
  - @tailwindcss/forms plugin

- [x] Configured PostCSS (`postcss.config.js`)

- [x] Refactored main CSS file (`src/index.css`):
  - Added Tailwind imports
  - Removed purple gradient background → white/light-gray theme
  - Added React Flow canvas grid styling
  - Added custom utility classes (glass, card, btn-primary, btn-secondary)
  - Added node styling classes (node-input, node-analyze, node-output)
  - Kept legacy styles for backward compatibility

- [x] Created directory structure:
```
src/
├── layouts/               ← New
├── pages/
│   ├── Dashboard/        ← New
│   │   └── components/
│   ├── WorkflowLab/      ← New
│   │   ├── components/
│   │   ├── nodes/
│   │   └── utils/
├── components/
│   ├── ui/               ← New (Shadcn-style components)
│   ├── Assistant/        ← New
│   ├── charts/           ← Existing (keep)
│   ├── auth/             ← Existing (keep)
│   └── learning/         ← Existing (keep)
├── stores/               ← New (Zustand)
├── services/
│   └── workflow/         ← New
└── utils/
    └── cn/               ← New
```

### Phase 2: Core Utilities & Stores ✅
- [x] Created utility files:
  - `utils/cn.js` - Class name merging (clsx + tailwind-merge)

- [x] Created Zustand state stores:
  - `stores/uiStore.js` - UI state (mode, sidebar, assistant, theme, inspector, output drawer)
  - `stores/workflowStore.js` - Workflow canvas (nodes, edges, execution)
  - `stores/assistantStore.js` - AI chat (messages, retrieved posts, RAG queries)
  - `stores/dashboardStore.js` - Dashboard data (stats, trends, insights, filters)

- [x] Created base UI components:
  - `components/ui/Button.jsx` - 5 variants (primary, secondary, outline, ghost, danger), 3 sizes
  - `components/ui/Card.jsx` - Card + CardHeader, CardTitle, CardDescription, CardContent, CardFooter
  - `components/ui/Badge.jsx` - 7 variants (default, primary, secondary, success, warning, danger, info)

### Phase 3: Layout Components (Partial) ✅
- [x] Created `layouts/TopBar.jsx`:
  - Logo + menu toggle
  - Search bar (center, hidden on mobile)
  - Notifications, theme toggle
  - Auth button integration

- [x] Created `layouts/Sidebar.jsx`:
  - Navigation items (Dashboard, Workflow Lab, Learning Map, Data Labeling)
  - AI Assistant toggle
  - Collapsible on desktop
  - Mobile overlay

- [x] Created `layouts/AssistantDrawer.jsx`:
  - Full-featured AI chat interface
  - Message history (user/assistant bubbles)
  - Retrieved posts with "Add to Canvas" buttons
  - Placeholder RAG integration
  - Mobile responsive

---

## 🚧 **REMAINING WORK**

### Phase 3: Complete Layout (30 min)
- [ ] Create `layouts/MainLayout.jsx` - Main wrapper component
  - Combine TopBar + Sidebar + AssistantDrawer
  - Render children (Dashboard or Workflow Lab)
  - Handle responsive layout

### Phase 4: Dashboard Mode (2-3 hours)
- [ ] Create `pages/Dashboard/index.jsx`
- [ ] Create Dashboard components:
  - `StatsOverview.jsx` - Top stat cards (total analyses, active companies, etc.)
  - `ChartsSection.jsx` - Wrapper for existing charts
  - `InsightsPanel.jsx` - AI-generated insights cards
  - `PredictionsPanel.jsx` - Job market predictions
  - `RecentActivity.jsx` - Recent analyses (reuse HistorySection logic)
  - `QuickActions.jsx` - Quick action buttons
- [ ] Integrate existing Chart.js components:
  - Reuse `MarketActivityChart`, `TrendingSkillsChart`, `CompanyOpportunityChart`
  - Apply Tailwind styling

### Phase 5: Workflow Lab Mode (3-4 hours)
- [ ] Create `pages/WorkflowLab/index.jsx` - Main canvas page
- [ ] Create Workflow components:
  - `components/Canvas.jsx` - React Flow wrapper
  - `components/NodeLibrary.jsx` - Draggable node palette
  - `components/InspectorPanel.jsx` - Node properties editor
  - `components/ExecutionPanel.jsx` - Workflow logs (bottom drawer)
  - `components/MiniMap.jsx` - Canvas minimap
- [ ] Create Node components:
  - `nodes/InputNode.jsx` - Input node (manual/AI/scrape)
  - `nodes/AnalyzeNode.jsx` - Analysis node (sentiment/skills/trends)
  - `nodes/OutputNode.jsx` - Output node (report/email/dashboard)
  - `nodes/CustomEdge.jsx` - Custom connection styling
- [ ] Create workflow utilities:
  - `utils/nodeTypes.js` - Node type definitions
  - `utils/workflowRunner.js` - Workflow execution logic

### Phase 6: Services & API Integration (1 hour)
- [ ] Create `services/workflow/workflowService.js`:
  - `executeWorkflow(nodes, edges)` - Execute workflow
  - `saveTemplate(name, nodes, edges)` - Save workflow template
  - `getTemplates()` - Get workflow templates
  - `deleteTemplate(id)` - Delete template
- [ ] Create `services/workflow/ragService.js`:
  - `queryRAG(query, context)` - Query RAG knowledge base
  - `retrievePosts(query, limit)` - Retrieve relevant posts
  - `addToCanvas(post)` - Add post to workflow canvas
- [ ] Update `api/apiService.js` with workflow endpoints

### Phase 7: App Integration & Routing (1 hour)
- [ ] Update `App.jsx`:
  - Import MainLayout
  - Update routing to use mode-based navigation
  - Keep existing pages (LabelingPage, LearningMapPage)
  - Add route for Dashboard and Workflow Lab
- [ ] Example App.jsx structure:
```jsx
function App() {
  const { mode } = useUIStore();

  return (
    <AuthProvider>
      <MainLayout>
        {mode === 'dashboard' && <Dashboard />}
        {mode === 'workflow' && <WorkflowLab />}
        {mode === 'learning' && <LearningMapPage />}
        {mode === 'labeling' && <LabelingPage />}
      </MainLayout>
      <AssistantDrawer />
    </AuthProvider>
  );
}
```

### Phase 8: Testing & Polish (2-3 hours)
- [ ] Test Dashboard mode:
  - Stats loading and display
  - Charts rendering
  - Filters working
  - Mobile responsiveness
- [ ] Test Workflow Lab mode:
  - Drag nodes from library
  - Connect nodes
  - Inspector panel updates
  - Workflow execution
  - Save/load templates
- [ ] Test AI Assistant:
  - Send messages
  - Retrieved posts display
  - "Add to Canvas" functionality
- [ ] Test navigation:
  - Mode switching
  - Sidebar collapse
  - Mobile menu
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Accessibility audit (ARIA labels, keyboard navigation)

---

## 📋 **QUICK START GUIDE (Continue Refactor)**

### Step 1: Create MainLayout.jsx
```jsx
// src/layouts/MainLayout.jsx
import React from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
```

### Step 2: Create Dashboard Page
```jsx
// src/pages/Dashboard/index.jsx
import React, { useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { Card } from '../../components/ui/Card';
// Import components as you create them

export const Dashboard = () => {
  const { stats, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      {/* Add StatsOverview, ChartsSection, etc. */}
    </div>
  );
};
```

### Step 3: Create Workflow Lab Page
```jsx
// src/pages/WorkflowLab/index.jsx
import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../stores/workflowStore';

export const WorkflowLab = () => {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => setNodes(applyNodeChanges(changes, nodes))}
        onEdgesChange={(changes) => setEdges(applyEdgeChanges(changes, edges))}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
```

### Step 4: Update App.jsx
Replace the existing tab-based navigation with mode-based routing using MainLayout.

---

## 🎨 **DESIGN REFERENCE**

### Color Palette
```css
/* Primary Colors */
--redcube-primary: #3b82f6;    /* Blue */
--redcube-secondary: #10b981;  /* Green */
--redcube-dark: #1f2937;       /* Dark Gray */
--redcube-light: #f9fafb;      /* Light Gray Background */
--redcube-border: #e5e7eb;     /* Border Gray */

/* Node Colors */
--node-input: #dbeafe;         /* Light Blue */
--node-analyze: #fef3c7;       /* Light Yellow */
--node-output: #d1fae5;        /* Light Green */
```

### Typography
- Font: **Inter** (Google Fonts)
- Headings: 600-700 weight
- Body: 400 weight
- Small text: 300 weight

### Spacing
- Container max-width: 1280px (max-w-7xl)
- Section padding: 24px (p-6)
- Card padding: 24px (p-6)
- Gap between cards: 24px (gap-6)

---

## 🐛 **KNOWN ISSUES / TODO**

1. **React Flow Dependency**: Need to install React Flow's peer dependencies:
   ```bash
   npm install reactflow@11.10.4
   ```

2. **Assistant RAG Integration**: Currently using placeholder responses. Need to:
   - Implement actual RAG API endpoints (Phase 5.2)
   - Connect to vector database
   - Implement semantic search

3. **Workflow Execution**: Placeholder logic in workflowStore. Need to:
   - Implement topological sort for node execution order
   - Handle async node operations
   - Implement error handling and retry logic

4. **Backend APIs**: Need to create new endpoints:
   - `POST /api/content/workflow/execute`
   - `POST /api/content/workflow/templates`
   - `GET /api/content/workflow/templates`
   - `POST /api/assistant/query`
   - `POST /api/assistant/retrieve`

---

## 📚 **RESOURCES**

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **React Flow Docs**: https://reactflow.dev/
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **Lucide Icons**: https://lucide.dev/
- **Framer Motion**: https://www.framer.com/motion/

---

## ✨ **NEXT STEPS**

1. **Create MainLayout.jsx** (5 min)
2. **Create Dashboard page** (1-2 hours)
3. **Create Workflow Lab page** (2-3 hours)
4. **Update App.jsx routing** (30 min)
5. **Test everything** (1 hour)

**Estimated Time Remaining:** 6-8 hours

---

Good luck! The foundation is solid. Most of the heavy lifting (Tailwind setup, stores, layout components) is complete. Now it's mainly assembling the Dashboard and Workflow Lab pages using the components you've built. 🚀
