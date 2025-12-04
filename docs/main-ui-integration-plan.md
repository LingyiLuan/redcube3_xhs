# Main UI Page Integration - Design Plan

## 1. Architecture Overview

### 1.1 Application Structure
```
Main Application
├── Landing Page (Public)
│   ├── Hero Section (Interactive Pixel Character)
│   ├── How to Use Section
│   ├── Key Features Section
│   ├── Data Sources Section
│   └── Contact Section
├── Authentication Layer
└── Dashboard (Authenticated)
    ├── Working Lab (Workflow Editor) - Access via button click
    ├── Reports Panel (Tab/Sidebar)
    └── Learning Map Panel (Tab/Sidebar)
```

### 1.2 Navigation Flow
```
Landing → Login → Dashboard (Stay on landing page)
                     ├→ User clicks "Working Lab" button → Opens Working Lab
                     ├→ Analyze Node → Report Badge Appears
                     ├→ Click Report Badge → View Analysis
                     └→ Click Learning Map → Generate/View Map

**IMPORTANT**: Working Lab is LOCKED for non-authenticated users.
After login, user stays on landing page and must explicitly click "Working Lab" button to access it.
```

## 2. Component Structure

### 2.1 Landing Page Components
```
src/views/
├── LandingPage.vue (Main container - accessible to all, shows different UI based on auth state)
└── sections/
    ├── HeroSection.vue
    │   └── PixelCharacter.vue (Interactive character)
    ├── HowToUseSection.vue
    ├── FeaturesSection.vue
    ├── DataSourcesSection.vue
    └── ContactSection.vue
```

### 2.2 Dashboard Components (Update existing)
```
src/views/
├── Dashboard.vue (New wrapper for authenticated area - NOT auto-navigated)
└── WorkflowEditor.vue (Existing - integrate with Dashboard)

src/components/
├── Dashboard/
│   ├── DashboardNav.vue (Top navigation)
│   ├── ReportsPanel.vue (Collapsible sidebar)
│   └── LearningMapPanel.vue (Collapsible sidebar)
├── Navigation/
│   └── WorkingLabButton.vue (Button to access Working Lab - shown after login)
└── Inspector/ (Existing)
    ├── NodeInspector.vue (Keep existing)
    ├── ReportTab.vue (New)
    └── LearningMapTab.vue (New)
```

## 3. Routing Strategy

### 3.1 Route Configuration
```typescript
// src/router/index.ts
const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { requiresAuth: false }
    // Note: This page shows different content based on authentication status
    // - Not logged in: Shows "Login" button, Working Lab is locked/disabled
    // - Logged in: Shows "Working Lab" button, user can click to navigate
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'lab',
        name: 'WorkingLab',
        component: WorkflowEditor,
        meta: { requiresAuth: true }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsPanel,
        meta: { requiresAuth: true }
      },
      {
        path: 'learning-map',
        name: 'LearningMap',
        component: LearningMapPanel,
        meta: { requiresAuth: true }
      }
    ]
  }
]
```

### 3.2 Navigation Guards
```typescript
// Navigation guard logic
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to landing page for login
    next({ name: 'Landing' })
  } else {
    next()
  }
})

// Post-login behavior
async function handleLogin(credentials) {
  await authStore.login(credentials)

  // After successful login, redirect to landing page (NOT Working Lab)
  router.push({ name: 'Landing' })

  // User must then click "Working Lab" button to access /dashboard/lab
}
```

### 3.3 Landing Page Auth State Handling
```vue
<!-- LandingPage.vue -->
<template>
  <div class="landing-page">
    <HeroSection>
      <!-- Show different CTAs based on auth state -->
      <div v-if="!isAuthenticated" class="cta-buttons">
        <button @click="goToLogin" class="cta-primary">Login</button>
        <button @click="scrollToHowTo" class="cta-secondary">Learn More</button>
      </div>
      <div v-else class="cta-buttons">
        <button @click="goToWorkingLab" class="cta-primary">
          Open Working Lab 🚀
        </button>
        <button @click="goToReports" class="cta-secondary">View Reports</button>
      </div>
    </HeroSection>

    <!-- Other sections with locked/unlocked indicators -->
    <FeaturesSection>
      <FeatureCard
        v-for="feature in features"
        :key="feature.title"
        :locked="!isAuthenticated && feature.requiresAuth"
      />
    </FeaturesSection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isAuthenticated = computed(() => authStore.isAuthenticated)

function goToWorkingLab() {
  router.push({ name: 'WorkingLab' })
}

function goToReports() {
  router.push({ name: 'Reports' })
}
</script>
```

## 4. State Management

### 4.1 New Pinia Stores
```typescript
// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('authToken') || null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(credentials) {
    // Login API call
    const response = await api.login(credentials)
    user.value = response.user
    token.value = response.token
    localStorage.setItem('authToken', response.token)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
  }

  async function checkAuth() {
    if (token.value) {
      try {
        const response = await api.validateToken(token.value)
        user.value = response.user
      } catch (error) {
        logout()
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})

// src/stores/reportsStore.ts
export const useReportsStore = defineStore('reports', () => {
  const reports = ref([])
  const unreadReportsCount = computed(() =>
    reports.value.filter(r => !r.isRead).length
  )
  const activeReportId = ref(null)

  function addReport(report) {
    reports.value.unshift(report)
  }

  function markAsRead(reportId) {
    const report = reports.value.find(r => r.id === reportId)
    if (report) report.isRead = true
  }

  function getReportsByWorkflow(workflowId) {
    return reports.value.filter(r => r.workflowId === workflowId)
  }

  return {
    reports,
    unreadReportsCount,
    activeReportId,
    addReport,
    markAsRead,
    getReportsByWorkflow
  }
})

// src/stores/learningMapStore.ts
export const useLearningMapStore = defineStore('learningMap', () => {
  const maps = ref([])
  const activeMapId = ref(null)

  async function generateMap(reportIds) {
    const response = await api.generateLearningMap(reportIds)
    maps.value.push(response.map)
    return response.map
  }

  function getMapsByUser() {
    return maps.value
  }

  return {
    maps,
    activeMapId,
    generateMap,
    getMapsByUser
  }
})
```

### 4.2 Integration with Existing Store
```typescript
// Update src/stores/workflowStore.ts
- Add lastAnalysisResult to track completed analyses
- Add analysisCompleteCallback to notify UI
- Emit event when analyzeNode() completes successfully
```

## 5. Interactive Pixel Character Implementation

### 5.1 Technology Choice
**Recommendation**: Use PixiJS or HTML5 Canvas with sprite sheets

**Why PixiJS**:
- High-performance 2D rendering
- Sprite animation support
- Good Vue 3 integration via composables
- Mouse interaction detection built-in

### 5.2 Character States & Animations
```typescript
enum CharacterState {
  IDLE = 'idle',           // Default: gentle breathing, occasional blink
  TYPING = 'typing',       // Fast keyboard typing animation
  LOOKING = 'looking',     // Eyes follow cursor
  WAVING = 'waving',       // Click interaction: wave gesture
  THINKING = 'thinking',   // Scratch head, look up
  EXCITED = 'excited',     // Jump up with excitement
  LOCKED = 'locked'        // For non-authenticated users - character shows lock icon
}
```

### 5.3 Interaction Triggers
```typescript
// src/composables/usePixelCharacter.ts
export function usePixelCharacter() {
  const authStore = useAuthStore()
  const state = ref<CharacterState>('idle')
  const mousePosition = ref({ x: 0, y: 0 })

  // Show locked state if not authenticated
  watchEffect(() => {
    if (!authStore.isAuthenticated) {
      state.value = 'locked'
    }
  })

  // Cursor movement → Looking animation (only if authenticated)
  onMouseMove((e) => {
    if (!authStore.isAuthenticated) return

    if (isNearCharacter(e)) {
      state.value = 'looking'
      mousePosition.value = { x: e.clientX, y: e.clientY }
    } else {
      state.value = 'idle'
    }
  })

  // Click → Random gesture (only if authenticated)
  onClick(() => {
    if (!authStore.isAuthenticated) {
      // Show "Please login" message
      uiStore.showToast('Please login to interact', 'info')
      return
    }

    const gestures = ['waving', 'excited', 'typing']
    state.value = random(gestures)
    setTimeout(() => state.value = 'idle', 2000)
  })

  // Scroll → Thinking animation
  onScroll(() => {
    if (scrollProgress > 0.3 && authStore.isAuthenticated) {
      state.value = 'thinking'
    }
  })

  return { state, mousePosition }
}
```

### 5.4 Asset Requirements
```
assets/characters/pixel-character/
├── idle.png (or sprite sheet)
├── typing.png
├── looking.png
├── waving.png
├── thinking.png
├── excited.png
└── locked.png (Character with lock icon overlay)
```

## 6. Reports & Learning Map Integration

### 6.1 Tab/Panel Layout Design
**Option A: Inspector Panel Extension** (Recommended)
```
Right Sidebar (Inspector)
├── Tabs: [Node | Reports | Learning Map]
├── Node Tab (Existing)
│   └── Current node details
├── Reports Tab (New)
│   ├── Badge with unread count
│   ├── List of recent reports
│   └── Expandable report cards
└── Learning Map Tab (New)
    ├── "Generate from Reports" button
    └── Interactive map visualization
```

**Option B: Floating Panels**
```
Canvas Area
├── Working Lab (Center)
├── Inspector (Right - Existing)
├── Reports Drawer (Bottom - Slides up)
└── Learning Map Modal (Overlay)
```

### 6.2 Report Badge Notification System
```vue
<!-- src/components/Inspector/TabBar.vue -->
<template>
  <div class="tab-bar">
    <button @click="activeTab = 'node'" :class="{ active: activeTab === 'node' }">
      <FileText :size="16" />
      Node
    </button>
    <button @click="activeTab = 'reports'" :class="{ active: activeTab === 'reports' }">
      <FileBarChart :size="16" />
      Reports
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>
    <button @click="activeTab = 'map'" :class="{ active: activeTab === 'map' }">
      <Network :size="16" />
      Learning Map
    </button>
  </div>
</template>
```

### 6.3 Analysis Complete Flow
```typescript
// After analyzeNode() completes:
async function handleAnalyze() {
  if (!selectedNodeId.value) return

  try {
    const result = await workflowStore.analyzeNode(selectedNodeId.value)

    // Add report to store
    reportsStore.addReport({
      id: generateId(),
      nodeId: selectedNodeId.value,
      workflowId: workflowStore.currentWorkflowId,
      result: result,
      timestamp: new Date(),
      isRead: false
    })

    // Show notification
    uiStore.showToast('Analysis complete! Check Reports tab', 'success')

    // Optional: Auto-switch to Reports tab
    // inspectorStore.setActiveTab('reports')

  } catch (error) {
    uiStore.showToast(error.message, 'error')
  }
}
```

## 7. Landing Page Sections

### 7.1 Hero Section
```vue
<template>
  <section class="hero-section">
    <div class="hero-content">
      <div class="text-content">
        <h1>Intelligent Interview Experience Analyzer</h1>
        <p>Transform qualitative interview data into actionable insights</p>

        <!-- Dynamic CTA based on auth state -->
        <div v-if="!isAuthenticated" class="cta-group">
          <button @click="scrollToHowTo" class="cta-primary">See How It Works</button>
          <button @click="goToLogin" class="cta-secondary">Login to Get Started →</button>
        </div>
        <div v-else class="cta-group">
          <button @click="goToWorkingLab" class="cta-primary">
            <Workflow :size="20" />
            Open Working Lab
          </button>
          <button @click="goToReports" class="cta-secondary">
            <FileBarChart :size="20" />
            View My Reports
          </button>
        </div>
      </div>
      <div class="character-container">
        <PixelCharacter :interactive="isAuthenticated" :locked="!isAuthenticated" />
      </div>
    </div>
  </section>
</template>

<style>
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cta-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
```

### 7.2 How to Use Section
```vue
<template>
  <section class="how-to-section">
    <h2>How to Use</h2>
    <div class="steps-grid">
      <div class="step" v-for="(step, index) in steps" :key="index">
        <div class="step-number">{{ index + 1 }}</div>
        <img :src="step.gif" alt="step animation" />
        <h3>{{ step.title }}</h3>
        <p>{{ step.description }}</p>

        <!-- Show lock icon for steps requiring auth -->
        <Lock v-if="step.requiresAuth && !isAuthenticated"
              :size="24"
              class="lock-overlay"
              title="Login required" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { Lock } from 'lucide-vue-next'

const steps = [
  {
    title: 'Login to Your Account',
    description: 'Create an account or login to access the Working Lab',
    gif: '/animations/step0-login.gif',
    requiresAuth: false
  },
  {
    title: 'Open Working Lab',
    description: 'Click "Working Lab" button to enter the workflow editor',
    gif: '/animations/step1-open-lab.gif',
    requiresAuth: true
  },
  {
    title: 'Create Workflow',
    description: 'Add nodes and connect them to define your analysis pipeline',
    gif: '/animations/step2-create.gif',
    requiresAuth: true
  },
  {
    title: 'Input Data',
    description: 'Enter interview content or connect to data sources',
    gif: '/animations/step3-input.gif',
    requiresAuth: true
  },
  {
    title: 'Analyze',
    description: 'Run AI-powered analysis on your content',
    gif: '/animations/step4-analyze.gif',
    requiresAuth: true
  },
  {
    title: 'View Insights',
    description: 'Explore reports and generate learning maps',
    gif: '/animations/step5-insights.gif',
    requiresAuth: true
  }
]
</script>
```

### 7.3 Key Features Section
```vue
<template>
  <section class="features-section">
    <h2>Key Features</h2>
    <div class="features-grid">
      <FeatureCard
        v-for="feature in features"
        :key="feature.title"
        :icon="feature.icon"
        :title="feature.title"
        :description="feature.description"
        :locked="feature.requiresAuth && !isAuthenticated"
      />
    </div>
  </section>
</template>

<script setup>
import { Workflow, Database, FileText, Map, TrendingUp, Shield } from 'lucide-vue-next'

const features = [
  {
    icon: Workflow,
    title: 'Visual Workflow Editor',
    description: 'Drag-and-drop interface for building analysis pipelines',
    requiresAuth: true
  },
  {
    icon: Database,
    title: 'Multi-Source Data',
    description: 'Integrate data from Reddit, XHS, and more platforms',
    requiresAuth: true
  },
  {
    icon: FileText,
    title: 'Comprehensive Reports',
    description: 'AI-generated analysis with sentiment, themes, and insights',
    requiresAuth: true
  },
  {
    icon: Map,
    title: 'Learning Maps',
    description: 'Visualize knowledge connections and learning paths',
    requiresAuth: true
  },
  {
    icon: TrendingUp,
    title: 'Predictive Insights',
    description: 'Identify trends and patterns in qualitative data',
    requiresAuth: true
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data stays private with enterprise-grade security',
    requiresAuth: false
  }
]
</script>
```

### 7.4 Data Sources Section
```vue
<template>
  <section class="data-sources-section">
    <h2>Powered by Multiple Data Sources</h2>
    <div class="sources-grid">
      <div class="source-card" v-for="source in sources" :key="source.name">
        <img :src="source.logo" :alt="source.name" />
        <h3>{{ source.name }}</h3>
        <p>{{ source.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const sources = [
  {
    name: 'Reddit',
    logo: '/logos/reddit.svg',
    description: 'Community discussions and user experiences'
  },
  {
    name: 'XiaoHongShu (XHS)',
    logo: '/logos/xhs.svg',
    description: 'Chinese lifestyle and product reviews'
  },
  {
    name: 'Direct Input',
    logo: '/logos/upload.svg',
    description: 'Upload your own interview transcripts'
  }
]
</script>
```

## 8. Working Lab Access Control

### 8.1 FeatureCard Component with Lock State
```vue
<!-- src/components/Landing/FeatureCard.vue -->
<template>
  <div :class="['feature-card', { locked }]">
    <div class="icon-container">
      <component :is="icon" :size="48" />
      <Lock v-if="locked" :size="24" class="lock-badge" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div v-if="locked" class="locked-overlay">
      <Lock :size="32" />
      <p>Login Required</p>
    </div>
  </div>
</template>

<script setup>
import { Lock } from 'lucide-vue-next'

defineProps({
  icon: Object,
  title: String,
  description: String,
  locked: Boolean
})
</script>

<style scoped>
.feature-card {
  position: relative;
  padding: 2rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.feature-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.lock-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #ef4444;
}
</style>
```

### 8.2 Working Lab Button Component
```vue
<!-- src/components/Navigation/WorkingLabButton.vue -->
<template>
  <button
    @click="handleClick"
    :disabled="!isAuthenticated"
    :class="['working-lab-button', { locked: !isAuthenticated }]"
  >
    <Lock v-if="!isAuthenticated" :size="20" />
    <Workflow v-else :size="20" />
    <span>{{ buttonText }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Lock, Workflow } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const buttonText = computed(() =>
  isAuthenticated.value ? 'Open Working Lab' : 'Login to Access'
)

function handleClick() {
  if (!isAuthenticated.value) {
    router.push({ name: 'Login' })
  } else {
    router.push({ name: 'WorkingLab' })
  }
}
</script>

<style scoped>
.working-lab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.working-lab-button:hover:not(.locked) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.working-lab-button.locked {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
```

## 9. Responsive Design Strategy

### 9.1 Breakpoints
```css
/* Mobile first approach */
$breakpoints: (
  'mobile': 320px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1440px
);

/* Landing page adapts sections to stack vertically on mobile */
@media (max-width: 768px) {
  .hero-content { flex-direction: column; }
  .features-grid { grid-template-columns: 1fr; }
  .character-container { max-width: 300px; }
  .cta-group { flex-direction: column; }
}

/* Working Lab adapts inspector to bottom sheet on mobile */
@media (max-width: 1024px) {
  .node-inspector {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    height: 50vh;
    width: 100%;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .node-inspector.open {
    transform: translateY(0);
  }
}
```

## 10. Animation & Interaction Patterns

### 10.1 Scroll Animations
```typescript
// src/composables/useScrollAnimations.ts
import { useIntersectionObserver } from '@vueuse/core'

export function useScrollAnimations() {
  const animateOnScroll = (element: Ref<HTMLElement>) => {
    useIntersectionObserver(
      element,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          element.value.classList.add('animate-fade-in-up')
        }
      },
      { threshold: 0.2 }
    )
  }

  return { animateOnScroll }
}
```

### 10.2 CSS Animations
```css
/* Fade in and slide up animation for sections */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}

/* Pixel character breathing animation */
@keyframes breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.character-idle {
  animation: breathe 3s ease-in-out infinite;
}

/* Lock icon pulse animation */
@keyframes pulse-lock {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.lock-badge {
  animation: pulse-lock 2s ease-in-out infinite;
}
```

## 11. Technical Implementation Recommendations

### 11.1 Package Additions
```json
{
  "dependencies": {
    "pixi.js": "^7.3.0",          // Pixel character rendering
    "@vueuse/core": "^10.7.0",    // Composables for scroll, mouse
    "gsap": "^3.12.0",            // Advanced animations
    "vue3-smooth-scroll": "^2.1.0" // Smooth section scrolling
  }
}
```

### 11.2 Performance Optimizations
- Lazy load sections below fold: `defineAsyncComponent()`
- Preload critical assets (character sprites, hero image)
- Use `Intersection Observer` for animation triggers
- Debounce character mouse tracking (60fps max)
- Optimize GIF/animations: use WebP or MP4 instead

### 11.3 Accessibility Considerations
- Add ARIA labels to all interactive elements
- Add `aria-disabled="true"` and `role="button"` to locked features
- Ensure keyboard navigation for pixel character interactions
- Provide `prefers-reduced-motion` alternative (static character)
- Maintain color contrast ratios (WCAG AA)
- Add screen reader descriptions for visual-only content
- Announce locked state: "This feature requires login"

## 12. File Organization

```
src/
├── views/
│   ├── LandingPage.vue (New - public, shows different UI based on auth)
│   ├── LoginPage.vue (New)
│   ├── Dashboard.vue (New wrapper - authenticated only)
│   ├── WorkflowEditor.vue (Existing - integrate)
│   └── sections/ (New)
│       ├── HeroSection.vue
│       ├── PixelCharacter.vue
│       ├── HowToUseSection.vue
│       ├── FeaturesSection.vue
│       ├── DataSourcesSection.vue
│       └── ContactSection.vue
├── components/
│   ├── Landing/ (New)
│   │   └── FeatureCard.vue (with lock state)
│   ├── Navigation/ (New)
│   │   └── WorkingLabButton.vue (shows lock/unlock state)
│   ├── Dashboard/ (New)
│   │   ├── DashboardNav.vue
│   │   ├── ReportsPanel.vue
│   │   └── LearningMapPanel.vue
│   └── Inspector/ (Update existing)
│       ├── NodeInspector.vue (Update with tabs)
│       ├── TabBar.vue (New)
│       ├── ReportTab.vue (New)
│       └── LearningMapTab.vue (New)
├── stores/
│   ├── authStore.ts (New)
│   ├── reportsStore.ts (New)
│   └── learningMapStore.ts (New)
├── composables/
│   ├── usePixelCharacter.ts (New - with auth state handling)
│   └── useScrollAnimations.ts (New)
└── assets/
    ├── characters/ (New)
    │   └── pixel-character/
    ├── animations/ (New)
    └── logos/ (New)
```

## 13. Pixel-Style Modular Dashboard Landing Page Design

### 13.1 Design Vision
**Concept**: Retro gaming dashboard meets modern functionality - A modular, tile-based layout with pixel art aesthetic that feels like a command center from classic games, but with smooth, professional interactions.

**Aesthetic References**:
- Stardew Valley's UI panels
- Minecraft inventory system
- Hollow Knight's charm menu
- Mother 3's battle UI
- Modern pixel art: Dead Cells, Celeste

### 13.2 Color Palette - Pixel Theme
```css
/* Pixel Art Color System */
:root {
  /* Base colors - 8-bit inspired */
  --pixel-bg-primary: #1a1a2e;      /* Deep blue-black */
  --pixel-bg-secondary: #16213e;     /* Dark navy */
  --pixel-bg-tertiary: #0f3460;      /* Ocean blue */

  /* Accent colors - Vibrant retro */
  --pixel-accent-cyan: #00d9ff;      /* Neon cyan */
  --pixel-accent-magenta: #ff006e;   /* Hot pink */
  --pixel-accent-yellow: #ffbe0b;    /* Gold */
  --pixel-accent-green: #8ac926;     /* Lime green */

  /* UI elements */
  --pixel-border-light: #e7ecef;     /* Light border */
  --pixel-border-dark: #0f3460;      /* Dark border */
  --pixel-text-primary: #f5f5f5;     /* Off-white */
  --pixel-text-secondary: #a8dadc;   /* Light blue */

  /* Shadows - Pixel style */
  --pixel-shadow-sm: 2px 2px 0 rgba(0, 0, 0, 0.8);
  --pixel-shadow-md: 4px 4px 0 rgba(0, 0, 0, 0.8);
  --pixel-shadow-lg: 6px 6px 0 rgba(0, 0, 0, 0.8);

  /* Scan lines and CRT effects */
  --scanline-opacity: 0.05;
  --crt-curvature: 2px;
}
```

### 13.3 Typography - Pixel Fonts
```css
/* Import pixel fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

:root {
  --font-pixel-title: 'Press Start 2P', cursive;    /* Main headings */
  --font-pixel-body: 'VT323', monospace;            /* Body text */
  --font-pixel-mono: 'Courier New', monospace;      /* Code/data */
}

/* Font sizes optimized for pixel fonts */
.pixel-h1 { font-size: 24px; line-height: 1.5; letter-spacing: 2px; }
.pixel-h2 { font-size: 18px; line-height: 1.4; letter-spacing: 1.5px; }
.pixel-h3 { font-size: 14px; line-height: 1.3; letter-spacing: 1px; }
.pixel-body { font-size: 20px; line-height: 1.4; } /* VT323 needs larger size */
.pixel-small { font-size: 16px; line-height: 1.3; }
```

### 13.4 Modular Tile System Architecture

#### Grid Layout System
```css
/* 12-column grid for flexible tile placement */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 16px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Tile size variants */
.tile-sm { grid-column: span 3; grid-row: span 2; }   /* Small: 3x2 */
.tile-md { grid-column: span 4; grid-row: span 3; }   /* Medium: 4x3 */
.tile-lg { grid-column: span 6; grid-row: span 4; }   /* Large: 6x4 */
.tile-xl { grid-column: span 8; grid-row: span 5; }   /* Extra Large: 8x5 */
.tile-hero { grid-column: span 12; grid-row: span 3; } /* Full Width Hero */

/* Named grid areas for specific tiles */
.dashboard-grid {
  grid-template-areas:
    "hero hero hero hero hero hero hero hero hero hero hero hero"
    "login login login login news news news news tips tips tips tips"
    "login login login login news news news news tips tips tips tips"
    "activity activity activity activity feature1 feature1 feature1 feature2 feature2 feature2 stats stats"
    "activity activity activity activity feature1 feature1 feature1 feature2 feature2 feature2 stats stats"
    "insights insights insights insights insights insights map map map map map map";
}
```

#### Tile Component Base
```vue
<!-- src/components/Dashboard/TileBase.vue -->
<template>
  <div
    :class="[
      'pixel-tile',
      `tile-${size}`,
      variant,
      { 'tile-interactive': interactive, 'tile-locked': locked }
    ]"
    :style="tileStyle"
  >
    <!-- Pixel border effect -->
    <div class="pixel-border pixel-border-top"></div>
    <div class="pixel-border pixel-border-right"></div>
    <div class="pixel-border pixel-border-bottom"></div>
    <div class="pixel-border pixel-border-left"></div>

    <!-- Corner decorations -->
    <div class="pixel-corner pixel-corner-tl"></div>
    <div class="pixel-corner pixel-corner-tr"></div>
    <div class="pixel-corner pixel-corner-bl"></div>
    <div class="pixel-corner pixel-corner-br"></div>

    <!-- Scan line effect -->
    <div class="scanline-overlay" v-if="showScanlines"></div>

    <!-- Content slot -->
    <div class="tile-content">
      <div class="tile-header" v-if="$slots.header">
        <slot name="header"></slot>
      </div>
      <div class="tile-body">
        <slot></slot>
      </div>
      <div class="tile-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>

    <!-- Lock overlay for authenticated features -->
    <div class="lock-overlay" v-if="locked">
      <PixelIcon name="lock" :size="48" />
      <p class="pixel-text">LOGIN REQUIRED</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl', 'hero'].includes(v)
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'accent', 'danger', 'success'].includes(v)
  },
  interactive: Boolean,
  locked: Boolean,
  showScanlines: {
    type: Boolean,
    default: true
  },
  glowColor: String
})

const tileStyle = computed(() => ({
  '--tile-glow-color': props.glowColor || 'var(--pixel-accent-cyan)'
}))
</script>

<style scoped>
.pixel-tile {
  position: relative;
  background: var(--pixel-bg-secondary);
  border-radius: var(--crt-curvature);
  overflow: hidden;
  box-shadow: var(--pixel-shadow-md);
  transition: all 0.2s ease;
}

/* Pixel borders */
.pixel-border {
  position: absolute;
  background: var(--pixel-border-light);
  z-index: 1;
}

.pixel-border-top, .pixel-border-bottom {
  left: 0;
  right: 0;
  height: 2px;
}

.pixel-border-left, .pixel-border-right {
  top: 0;
  bottom: 0;
  width: 2px;
}

.pixel-border-top { top: 0; }
.pixel-border-bottom { bottom: 0; }
.pixel-border-left { left: 0; }
.pixel-border-right { right: 0; }

/* Corner decorations */
.pixel-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--pixel-accent-cyan);
  z-index: 2;
}

.pixel-corner-tl { top: 0; left: 0; }
.pixel-corner-tr { top: 0; right: 0; }
.pixel-corner-bl { bottom: 0; left: 0; }
.pixel-corner-br { bottom: 0; right: 0; }

/* Interactive hover effect */
.tile-interactive:hover {
  transform: translateY(-2px);
  box-shadow:
    var(--pixel-shadow-lg),
    0 0 20px var(--tile-glow-color);
  cursor: pointer;
}

.tile-interactive:hover .pixel-corner {
  animation: corner-pulse 0.6s ease-in-out infinite;
}

@keyframes corner-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Scanline effect */
.scanline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, var(--scanline-opacity)) 0px,
    transparent 2px,
    transparent 4px
  );
  pointer-events: none;
  z-index: 3;
}

/* Content layout */
.tile-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tile-header {
  font-family: var(--font-pixel-title);
  font-size: 14px;
  color: var(--pixel-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tile-body {
  flex: 1;
  font-family: var(--font-pixel-body);
  color: var(--pixel-text-primary);
  overflow-y: auto;
}

/* Lock overlay */
.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
}

.lock-overlay .pixel-text {
  font-family: var(--font-pixel-title);
  font-size: 12px;
  color: var(--pixel-accent-magenta);
  letter-spacing: 2px;
}

/* Variant colors */
.tile.primary { --tile-glow-color: var(--pixel-accent-cyan); }
.tile.secondary { --tile-glow-color: var(--pixel-accent-magenta); }
.tile.accent { --tile-glow-color: var(--pixel-accent-yellow); }
.tile.success { --tile-glow-color: var(--pixel-accent-green); }
</style>
```

### 13.5 Dashboard Tile Components

#### 1. Hero Tile (Full-width Working Lab Entry)
```vue
<!-- src/components/Dashboard/Tiles/HeroTile.vue -->
<template>
  <TileBase size="hero" variant="primary" :interactive="!locked" :locked="locked">
    <template #header>
      <div class="hero-badge">
        <PixelIcon name="star" :size="16" />
        MAIN STATION
      </div>
    </template>

    <div class="hero-content">
      <div class="hero-left">
        <h1 class="hero-title">
          <TypewriterText text="WORKING LAB" :speed="80" />
        </h1>
        <p class="hero-subtitle">
          Visual workflow editor for analyzing interview data
        </p>

        <div class="hero-stats" v-if="!locked">
          <div class="stat-item">
            <PixelIcon name="workflow" :size="20" />
            <span>{{ workflowCount }} Workflows</span>
          </div>
          <div class="stat-item">
            <PixelIcon name="chart" :size="20" />
            <span>{{ analysisCount }} Analyses</span>
          </div>
          <div class="stat-item">
            <PixelIcon name="map" :size="20" />
            <span>{{ mapCount }} Maps</span>
          </div>
        </div>

        <button
          @click="handleEnter"
          :class="['pixel-button', 'hero-cta', { locked }]"
        >
          <PixelIcon :name="locked ? 'lock' : 'play'" :size="24" />
          <span>{{ locked ? 'LOGIN TO ACCESS' : 'ENTER LAB' }}</span>
          <div class="button-glow"></div>
        </button>
      </div>

      <div class="hero-right">
        <PixelCharacter
          :state="characterState"
          :interactive="!locked"
          @click="handleCharacterClick"
        />
      </div>
    </div>
  </TileBase>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import TileBase from '../TileBase.vue'
import PixelIcon from '../PixelIcon.vue'
import PixelCharacter from '../PixelCharacter.vue'
import TypewriterText from '../TypewriterText.vue'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

const locked = computed(() => !authStore.isAuthenticated)
const characterState = computed(() => locked.value ? 'locked' : 'idle')

const workflowCount = computed(() => workflowStore.workflows?.length || 0)
const analysisCount = computed(() => workflowStore.totalAnalyses || 0)
const mapCount = computed(() => workflowStore.learningMaps?.length || 0)

function handleEnter() {
  if (locked.value) {
    router.push({ name: 'Login' })
  } else {
    router.push({ name: 'WorkingLab' })
  }
}

function handleCharacterClick() {
  if (!locked.value) {
    // Trigger fun animation
    characterState.value = 'excited'
    setTimeout(() => characterState.value = 'idle', 2000)
  }
}
</script>

<style scoped>
.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  height: 100%;
}

.hero-title {
  font-family: var(--font-pixel-title);
  font-size: 32px;
  color: var(--pixel-accent-cyan);
  text-shadow:
    2px 2px 0 var(--pixel-accent-magenta),
    4px 4px 0 rgba(0, 0, 0, 0.8);
  margin-bottom: 16px;
  line-height: 1.4;
}

.hero-subtitle {
  font-family: var(--font-pixel-body);
  font-size: 20px;
  color: var(--pixel-text-secondary);
  margin-bottom: 24px;
}

.hero-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-pixel-body);
  font-size: 18px;
  color: var(--pixel-accent-yellow);
}

.pixel-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  font-family: var(--font-pixel-title);
  font-size: 14px;
  background: var(--pixel-accent-cyan);
  color: var(--pixel-bg-primary);
  border: 3px solid var(--pixel-border-light);
  box-shadow: var(--pixel-shadow-md);
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.pixel-button:hover:not(.locked) {
  transform: translateY(-4px);
  box-shadow: var(--pixel-shadow-lg);
}

.pixel-button:active:not(.locked) {
  transform: translateY(0);
  box-shadow: var(--pixel-shadow-sm);
}

.pixel-button.locked {
  background: var(--pixel-border-dark);
  color: var(--pixel-text-secondary);
  cursor: not-allowed;
}

.button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: button-shine 3s ease-in-out infinite;
}

@keyframes button-shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}
</style>
```

#### 2. Login Tile (Compact Login Form)
```vue
<!-- src/components/Dashboard/Tiles/LoginTile.vue -->
<template>
  <TileBase
    size="md"
    variant="accent"
    :interactive="false"
    :show-scanlines="true"
  >
    <template #header>
      <div class="login-header">
        <PixelIcon name="key" :size="16" />
        ACCESS TERMINAL
      </div>
    </template>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="pixel-input-group">
        <label class="pixel-label">EMAIL</label>
        <input
          v-model="email"
          type="email"
          class="pixel-input"
          placeholder="user@example.com"
          required
        />
      </div>

      <div class="pixel-input-group">
        <label class="pixel-label">PASSWORD</label>
        <input
          v-model="password"
          type="password"
          class="pixel-input"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="pixel-button primary"
      >
        <PixelIcon name="login" :size="16" v-if="!loading" />
        <LoadingSpinner v-else />
        <span>{{ loading ? 'AUTHENTICATING...' : 'LOGIN' }}</span>
      </button>

      <div class="login-footer">
        <a href="#" class="pixel-link">Forgot password?</a>
        <span class="separator">|</span>
        <a href="#" class="pixel-link">Create account</a>
      </div>
    </form>

    <div class="social-login" v-if="showSocialLogin">
      <div class="divider">
        <span>OR</span>
      </div>
      <button @click="handleGoogleLogin" class="social-button google">
        <PixelIcon name="google" :size="20" />
        <span>GOOGLE</span>
      </button>
    </div>
  </TileBase>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showSocialLogin = ref(true)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    uiStore.showToast('Login successful!', 'success')
    router.push({ name: 'Landing' })
  } catch (error) {
    uiStore.showToast(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  // Google OAuth flow
  window.location.href = '/api/auth/google'
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pixel-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pixel-label {
  font-family: var(--font-pixel-title);
  font-size: 10px;
  color: var(--pixel-accent-yellow);
  letter-spacing: 1px;
}

.pixel-input {
  font-family: var(--font-pixel-body);
  font-size: 18px;
  padding: 12px;
  background: var(--pixel-bg-primary);
  color: var(--pixel-text-primary);
  border: 2px solid var(--pixel-border-dark);
  outline: none;
  transition: border-color 0.2s;
}

.pixel-input:focus {
  border-color: var(--pixel-accent-cyan);
  box-shadow: 0 0 10px var(--pixel-accent-cyan);
}

.pixel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  font-family: var(--font-pixel-title);
  font-size: 12px;
  background: var(--pixel-accent-green);
  color: var(--pixel-bg-primary);
  border: 2px solid var(--pixel-border-light);
  cursor: pointer;
  box-shadow: var(--pixel-shadow-sm);
  transition: all 0.2s;
}

.pixel-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--pixel-shadow-md);
}

.pixel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-pixel-body);
  font-size: 14px;
}

.pixel-link {
  color: var(--pixel-accent-cyan);
  text-decoration: none;
}

.pixel-link:hover {
  text-decoration: underline;
}

.separator {
  color: var(--pixel-text-secondary);
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--pixel-text-secondary);
  font-family: var(--font-pixel-body);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 2px;
  background: var(--pixel-border-dark);
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  width: 100%;
  font-family: var(--font-pixel-title);
  font-size: 10px;
  background: #4285f4;
  color: white;
  border: 2px solid var(--pixel-border-light);
  cursor: pointer;
  transition: all 0.2s;
}

.social-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--pixel-shadow-md);
}
</style>
```

#### 3. News Feed Tile (Live Updates)
```vue
<!-- src/components/Dashboard/Tiles/NewsTile.vue -->
<template>
  <TileBase size="md" variant="secondary" :interactive="false">
    <template #header>
      <div class="news-header">
        <PixelIcon name="newspaper" :size="16" />
        LIVE FEED
        <div class="pulse-indicator"></div>
      </div>
    </template>

    <div class="news-feed">
      <div
        v-for="item in newsItems"
        :key="item.id"
        class="news-item"
        @click="handleNewsClick(item)"
      >
        <div class="news-icon">
          <PixelIcon :name="item.icon" :size="20" />
        </div>
        <div class="news-content">
          <p class="news-title">{{ item.title }}</p>
          <p class="news-time">{{ formatTime(item.timestamp) }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <button @click="fetchMore" class="load-more">
        <PixelIcon name="refresh" :size="12" />
        LOAD MORE
      </button>
    </template>
  </TileBase>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNewsStore } from '@/stores/newsStore'

const newsStore = useNewsStore()
const newsItems = ref([])

onMounted(async () => {
  newsItems.value = await newsStore.fetchLatestNews()
})

function formatTime(timestamp: Date) {
  const diff = Date.now() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'JUST NOW'
  if (minutes < 60) return `${minutes}M AGO`
  const hours = Math.floor(minutes / 60)
  return `${hours}H AGO`
}

function handleNewsClick(item: any) {
  // Open news detail modal
}

function fetchMore() {
  newsStore.fetchMoreNews()
}
</script>

<style scoped>
.news-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.news-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--pixel-bg-primary);
  border: 1px solid var(--pixel-border-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.news-item:hover {
  border-color: var(--pixel-accent-cyan);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}

.news-icon {
  flex-shrink: 0;
  color: var(--pixel-accent-cyan);
}

.news-content {
  flex: 1;
}

.news-title {
  font-family: var(--font-pixel-body);
  font-size: 16px;
  color: var(--pixel-text-primary);
  margin-bottom: 4px;
}

.news-time {
  font-family: var(--font-pixel-mono);
  font-size: 12px;
  color: var(--pixel-text-secondary);
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  background: var(--pixel-accent-green);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  margin-left: auto;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  width: 100%;
  font-family: var(--font-pixel-title);
  font-size: 8px;
  background: transparent;
  color: var(--pixel-accent-cyan);
  border: 1px solid var(--pixel-border-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.load-more:hover {
  border-color: var(--pixel-accent-cyan);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}
</style>
```

#### 4. Tips & Tricks Tile (Rotating Content)
```vue
<!-- src/components/Dashboard/Tiles/TipsTile.vue -->
<template>
  <TileBase size="md" variant="accent" :interactive="false">
    <template #header>
      <div class="tips-header">
        <PixelIcon name="lightbulb" :size="16" />
        DAILY TIP #{{ currentTipIndex + 1 }}
      </div>
    </template>

    <div class="tip-container">
      <Transition name="fade-slide" mode="out-in">
        <div :key="currentTipIndex" class="tip-content">
          <PixelIcon :name="currentTip.icon" :size="48" class="tip-icon" />
          <h3 class="tip-title">{{ currentTip.title }}</h3>
          <p class="tip-description">{{ currentTip.description }}</p>
        </div>
      </Transition>
    </div>

    <template #footer>
      <div class="tip-controls">
        <button @click="prevTip" class="tip-nav-button">
          <PixelIcon name="chevron-left" :size="16" />
        </button>
        <div class="tip-dots">
          <span
            v-for="(_, index) in tips"
            :key="index"
            :class="['dot', { active: index === currentTipIndex }]"
          ></span>
        </div>
        <button @click="nextTip" class="tip-nav-button">
          <PixelIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </template>
  </TileBase>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const tips = [
  {
    icon: 'keyboard',
    title: 'Keyboard Shortcuts',
    description: 'Use Cmd+S to save, Cmd+E to execute workflow, and Del to delete nodes'
  },
  {
    icon: 'connection',
    title: 'Connect Multiple Nodes',
    description: 'Batch analyze multiple posts by connecting Input nodes to single Analysis node'
  },
  {
    icon: 'map',
    title: 'Generate Learning Maps',
    description: 'Select multiple reports in the Reports tab and click "Generate Map" for insights'
  },
  {
    icon: 'filter',
    title: 'Filter Reports',
    description: 'Use the search bar in Reports tab to quickly find specific analyses'
  },
  {
    icon: 'export',
    title: 'Export Results',
    description: 'Click the export button in any report to download as JSON or CSV'
  }
]

const currentTipIndex = ref(0)
const currentTip = computed(() => tips[currentTipIndex.value])
let autoRotateInterval: ReturnType<typeof setInterval>

function nextTip() {
  currentTipIndex.value = (currentTipIndex.value + 1) % tips.length
}

function prevTip() {
  currentTipIndex.value = (currentTipIndex.value - 1 + tips.length) % tips.length
}

onMounted(() => {
  // Auto-rotate tips every 10 seconds
  autoRotateInterval = setInterval(nextTip, 10000)
})

onUnmounted(() => {
  clearInterval(autoRotateInterval)
})
</script>

<style scoped>
.tip-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.tip-content {
  text-align: center;
}

.tip-icon {
  color: var(--pixel-accent-yellow);
  margin-bottom: 16px;
}

.tip-title {
  font-family: var(--font-pixel-title);
  font-size: 14px;
  color: var(--pixel-accent-cyan);
  margin-bottom: 12px;
}

.tip-description {
  font-family: var(--font-pixel-body);
  font-size: 18px;
  color: var(--pixel-text-secondary);
  line-height: 1.5;
}

.tip-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tip-nav-button {
  padding: 8px;
  background: transparent;
  color: var(--pixel-accent-cyan);
  border: 1px solid var(--pixel-border-dark);
  cursor: pointer;
  transition: all 0.2s;
}

.tip-nav-button:hover {
  border-color: var(--pixel-accent-cyan);
  box-shadow: 0 0 8px rgba(0, 217, 255, 0.3);
}

.tip-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: var(--pixel-border-dark);
  border: 1px solid var(--pixel-border-light);
  transition: all 0.3s;
}

.dot.active {
  background: var(--pixel-accent-yellow);
  box-shadow: 0 0 8px var(--pixel-accent-yellow);
}

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
```

#### 5. Activity Feed Tile (Real-time Updates)
```vue
<!-- src/components/Dashboard/Tiles/ActivityTile.vue -->
<template>
  <TileBase size="lg" variant="primary" :locked="locked">
    <template #header>
      <div class="activity-header">
        <PixelIcon name="activity" :size="16" />
        RECENT ACTIVITY
        <div class="activity-count">{{ activities.length }}</div>
      </div>
    </template>

    <div class="activity-feed">
      <div
        v-for="activity in sortedActivities"
        :key="activity.id"
        :class="['activity-item', activity.type]"
      >
        <div class="activity-timeline">
          <div class="timeline-dot"></div>
          <div class="timeline-line" v-if="!activity.isLast"></div>
        </div>
        <div class="activity-icon">
          <PixelIcon :name="getActivityIcon(activity.type)" :size="24" />
        </div>
        <div class="activity-content">
          <p class="activity-text">{{ activity.message }}</p>
          <p class="activity-meta">
            <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            <span class="activity-type">{{ activity.type }}</span>
          </p>
        </div>
      </div>

      <div v-if="activities.length === 0" class="empty-state">
        <PixelIcon name="inbox" :size="48" />
        <p>NO RECENT ACTIVITY</p>
      </div>
    </div>
  </TileBase>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useActivityStore } from '@/stores/activityStore'

const authStore = useAuthStore()
const activityStore = useActivityStore()

const locked = computed(() => !authStore.isAuthenticated)
const activities = computed(() => activityStore.activities)
const sortedActivities = computed(() =>
  [...activities.value].sort((a, b) => b.timestamp - a.timestamp)
)

onMounted(() => {
  if (!locked.value) {
    activityStore.fetchActivities()
  }
})

function getActivityIcon(type: string) {
  const icons = {
    workflow_created: 'plus-circle',
    workflow_executed: 'play-circle',
    analysis_completed: 'check-circle',
    map_generated: 'map',
    report_viewed: 'eye',
    node_deleted: 'trash'
  }
  return icons[type] || 'circle'
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'NOW'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
</script>

<style scoped>
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.activity-item {
  display: grid;
  grid-template-columns: 20px 40px 1fr;
  gap: 12px;
  padding: 12px;
  background: var(--pixel-bg-primary);
  border-left: 3px solid var(--pixel-border-dark);
  transition: all 0.2s;
}

.activity-item:hover {
  border-left-color: var(--pixel-accent-cyan);
  background: rgba(0, 217, 255, 0.05);
}

.activity-item.workflow_created { border-left-color: var(--pixel-accent-green); }
.activity-item.analysis_completed { border-left-color: var(--pixel-accent-cyan); }
.activity-item.map_generated { border-left-color: var(--pixel-accent-magenta); }

.activity-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  background: var(--pixel-accent-cyan);
  border: 2px solid var(--pixel-bg-primary);
  flex-shrink: 0;
}

.timeline-line {
  flex: 1;
  width: 2px;
  background: var(--pixel-border-dark);
  margin-top: 4px;
}

.activity-icon {
  color: var(--pixel-accent-yellow);
}

.activity-text {
  font-family: var(--font-pixel-body);
  font-size: 16px;
  color: var(--pixel-text-primary);
  margin-bottom: 4px;
}

.activity-meta {
  display: flex;
  gap: 12px;
  font-family: var(--font-pixel-mono);
  font-size: 12px;
}

.activity-time {
  color: var(--pixel-text-secondary);
}

.activity-type {
  color: var(--pixel-accent-cyan);
  text-transform: uppercase;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  color: var(--pixel-text-secondary);
}

.empty-state p {
  font-family: var(--font-pixel-title);
  font-size: 10px;
}
</style>
```

### 13.6 Pixel Art Icon System
```vue
<!-- src/components/Dashboard/PixelIcon.vue -->
<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    :class="['pixel-icon', { animated }]"
    :style="{ color: color }"
  >
    <use :href="`#pixel-icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: String,
  size: {
    type: Number,
    default: 24
  },
  color: String,
  animated: Boolean
})
</script>

<style scoped>
.pixel-icon {
  fill: currentColor;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-icon.animated {
  animation: icon-pulse 1s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
```

### 13.7 Pixel Art Sprite Sheet
```vue
<!-- src/components/Dashboard/PixelIcons.vue -->
<!-- Hidden SVG sprite sheet for pixel icons -->
<template>
  <svg style="display: none">
    <defs>
      <!-- Lock Icon -->
      <symbol id="pixel-icon-lock" viewBox="0 0 24 24">
        <rect x="6" y="10" width="12" height="10" fill="currentColor" />
        <path d="M8,10 V6 Q8,2 12,2 Q16,2 16,6 V10" stroke="currentColor" stroke-width="2" fill="none" />
        <rect x="11" y="14" width="2" height="4" fill="#000" />
      </symbol>

      <!-- Play Icon -->
      <symbol id="pixel-icon-play" viewBox="0 0 24 24">
        <polygon points="8,5 8,19 18,12" fill="currentColor" />
      </symbol>

      <!-- Star Icon -->
      <symbol id="pixel-icon-star" viewBox="0 0 24 24">
        <polygon points="12,2 15,9 22,10 17,15 18,22 12,18 6,22 7,15 2,10 9,9" fill="currentColor" />
      </symbol>

      <!-- Workflow Icon -->
      <symbol id="pixel-icon-workflow" viewBox="0 0 24 24">
        <rect x="2" y="2" width="6" height="6" fill="currentColor" />
        <rect x="16" y="2" width="6" height="6" fill="currentColor" />
        <rect x="9" y="16" width="6" height="6" fill="currentColor" />
        <path d="M5,8 V14 H12 M19,8 V14 H15" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Map Icon -->
      <symbol id="pixel-icon-map" viewBox="0 0 24 24">
        <path d="M2,4 L8,2 L16,6 L22,4 V20 L16,22 L8,18 L2,20 Z M8,2 V18 M16,6 V22" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- More icons... (add as needed) -->
    </defs>
  </svg>
</template>
```

### 13.8 State Management - Landing Page Store
```typescript
// src/stores/landingStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface NewsItem {
  id: string
  title: string
  icon: string
  timestamp: Date
  url?: string
}

export interface Activity {
  id: string
  type: string
  message: string
  timestamp: number
  isLast?: boolean
}

export const useLandingStore = defineStore('landing', () => {
  // State
  const newsItems = ref<NewsItem[]>([])
  const activities = ref<Activity[]>([])
  const currentTile = ref<string | null>(null)

  // Getters
  const recentNews = computed(() =>
    newsItems.value.slice(0, 10)
  )

  const recentActivities = computed(() =>
    activities.value.slice(0, 20)
  )

  // Actions
  async function fetchNews() {
    try {
      const response = await fetch('/api/news/latest')
      const data = await response.json()
      newsItems.value = data.news
    } catch (error) {
      console.error('[LandingStore] Failed to fetch news:', error)
    }
  }

  async function fetchActivities(userId: number) {
    try {
      const response = await fetch(`/api/activities/${userId}`)
      const data = await response.json()
      activities.value = data.activities
    } catch (error) {
      console.error('[LandingStore] Failed to fetch activities:', error)
    }
  }

  function setActiveTile(tileId: string | null) {
    currentTile.value = tileId
  }

  return {
    newsItems,
    activities,
    currentTile,
    recentNews,
    recentActivities,
    fetchNews,
    fetchActivities,
    setActiveTile
  }
})
```

### 13.9 Main Landing Page Component
```vue
<!-- src/views/LandingPage.vue -->
<template>
  <div class="pixel-landing">
    <!-- CRT Screen Effect -->
    <div class="crt-overlay"></div>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Hero Tile (Full Width) -->
      <HeroTile :locked="!isAuthenticated" />

      <!-- Conditional Rendering Based on Auth State -->
      <template v-if="!isAuthenticated">
        <!-- Not Logged In: Show Login Tile -->
        <LoginTile />
        <NewsTile />
        <TipsTile />
      </template>

      <template v-else>
        <!-- Logged In: Show Activity & Stats -->
        <ActivityTile />
        <StatsTile />
        <FeatureTile variant="primary" title="Reports" icon="chart" />
        <FeatureTile variant="secondary" title="Maps" icon="map" />
        <NewsTile />
        <TipsTile />
      </template>

      <!-- Insights Tile (Always Visible) -->
      <InsightsTile :locked="!isAuthenticated" />
    </div>

    <!-- Background Pixel Effects -->
    <div class="pixel-bg-effects">
      <div class="floating-pixel" v-for="n in 20" :key="n"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useLandingStore } from '@/stores/landingStore'
import HeroTile from '@/components/Dashboard/Tiles/HeroTile.vue'
import LoginTile from '@/components/Dashboard/Tiles/LoginTile.vue'
import NewsTile from '@/components/Dashboard/Tiles/NewsTile.vue'
import TipsTile from '@/components/Dashboard/Tiles/TipsTile.vue'
import ActivityTile from '@/components/Dashboard/Tiles/ActivityTile.vue'
import StatsTile from '@/components/Dashboard/Tiles/StatsTile.vue'
import FeatureTile from '@/components/Dashboard/Tiles/FeatureTile.vue'
import InsightsTile from '@/components/Dashboard/Tiles/InsightsTile.vue'

const authStore = useAuthStore()
const landingStore = useLandingStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

onMounted(async () => {
  // Fetch news feed
  await landingStore.fetchNews()

  // If authenticated, fetch user activities
  if (isAuthenticated.value) {
    await landingStore.fetchActivities(authStore.userId)
  }
})
</script>

<style scoped>
.pixel-landing {
  position: relative;
  min-height: 100vh;
  background: var(--pixel-bg-primary);
  overflow-x: hidden;
}

/* CRT Screen Effect */
.crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.05) 0px,
      transparent 2px,
      transparent 4px
    );
  animation: crt-flicker 0.1s infinite;
}

@keyframes crt-flicker {
  0% { opacity: 0.95; }
  50% { opacity: 1; }
  100% { opacity: 0.95; }
}

/* Floating Pixel Background */
.pixel-bg-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-pixel {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--pixel-accent-cyan);
  opacity: 0.2;
  animation: float-pixel 20s linear infinite;
}

.floating-pixel:nth-child(odd) {
  background: var(--pixel-accent-magenta);
  animation-duration: 25s;
}

.floating-pixel:nth-child(3n) {
  background: var(--pixel-accent-yellow);
  animation-duration: 30s;
}

@keyframes float-pixel {
  0% {
    transform: translateY(100vh) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.2;
  }
  90% {
    opacity: 0.2;
  }
  100% {
    transform: translateY(-100px) translateX(100px) rotate(360deg);
    opacity: 0;
  }
}

/* Random positions for floating pixels */
.floating-pixel:nth-child(1) { left: 5%; animation-delay: 0s; }
.floating-pixel:nth-child(2) { left: 15%; animation-delay: 2s; }
.floating-pixel:nth-child(3) { left: 25%; animation-delay: 4s; }
.floating-pixel:nth-child(4) { left: 35%; animation-delay: 6s; }
.floating-pixel:nth-child(5) { left: 45%; animation-delay: 8s; }
.floating-pixel:nth-child(6) { left: 55%; animation-delay: 10s; }
.floating-pixel:nth-child(7) { left: 65%; animation-delay: 12s; }
.floating-pixel:nth-child(8) { left: 75%; animation-delay: 14s; }
.floating-pixel:nth-child(9) { left: 85%; animation-delay: 16s; }
.floating-pixel:nth-child(10) { left: 95%; animation-delay: 18s; }
/* ... more positions */

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(8, 1fr);
  }

  .tile-lg { grid-column: span 4; }
  .tile-xl { grid-column: span 8; }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 12px;
  }

  .tile-sm, .tile-md, .tile-lg, .tile-xl {
    grid-column: span 4;
  }
}
</style>
```

### 13.10 Implementation Phases (Updated)

#### Phase 1: Design System & Base Components (Week 1)
1. Set up pixel color palette and CSS variables
2. Import pixel fonts (Press Start 2P, VT323)
3. Create TileBase.vue with pixel borders and corners
4. Create PixelIcon.vue and sprite sheet system
5. Build shared components: PixelButton, PixelInput, LoadingSpinner

#### Phase 2: Core Tiles (Week 2)
1. Build HeroTile.vue with PixelCharacter integration
2. Build LoginTile.vue with form validation
3. Build NewsTile.vue with API integration
4. Build TipsTile.vue with auto-rotation
5. Build ActivityTile.vue with timeline design

#### Phase 3: Data Integration (Week 3)
1. Create landingStore.ts for state management
2. Set up news API endpoint and integration
3. Set up activity feed WebSocket/polling
4. Implement real-time updates for tiles
5. Add error handling and loading states

#### Phase 4: Additional Tiles & Features (Week 4)
1. Build StatsTile, FeatureTile, InsightsTile
2. Implement tile interactions (click, hover effects)
3. Add smooth transitions between auth states
4. Build responsive breakpoints
5. Test all tile combinations

#### Phase 5: Polish & Animations (Week 5)
1. Add CRT screen effects and scanlines
2. Implement floating pixel background
3. Add typewriter text effects
4. Optimize performance (lazy loading tiles)
5. Accessibility audit (keyboard navigation, screen readers)

#### Phase 6: Testing & Deployment (Week 6)
1. Cross-browser testing
2. Mobile responsive testing
3. Performance optimization
4. Integration with existing Working Lab
5. Production deployment

---

## Key Features Summary

### Pixel Art Aesthetic
- **Visual Style**: Retro gaming meets modern dashboard
- **Typography**: Press Start 2P for headings, VT323 for body text
- **Effects**: Scanlines, CRT flicker, pixel borders with corner accents
- **Animations**: Smooth transitions with pixel-perfect feel

### Modular Tile System
- **Flexible Grid**: 12-column CSS Grid with named areas
- **Tile Sizes**: sm (3x2), md (4x3), lg (6x4), xl (8x5), hero (12x3)
- **Dynamic Layout**: Changes based on authentication state
- **Responsive**: Adapts to mobile, tablet, and desktop

### State-Based UI
- **Not Logged In**: Hero + Login + News + Tips tiles
- **Logged In**: Hero + Activity + Stats + Features + News + Tips
- **Smooth Transitions**: Tiles fade in/out when auth state changes

### Live Data Integration
- **News Feed**: Real-time updates from external API
- **Activity Timeline**: User's recent actions with visual timeline
- **Rotating Tips**: Auto-rotating helpful hints every 10s
- **Stats Dashboard**: Real-time workflow/analysis/map counts

### Interactive Elements
- **Hover Effects**: Glowing borders, corner animations
- **Click Interactions**: Smooth button presses, loading states
- **Locked Features**: Visual lock indicators for non-authenticated users
- **Typewriter Text**: Animated text reveal for hero title

This pixel-style modular dashboard creates an engaging, nostalgic yet modern experience that makes data analysis feel like an adventure game!
