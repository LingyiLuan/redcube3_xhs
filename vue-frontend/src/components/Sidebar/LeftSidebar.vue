<template>
  <div :class="['left-sidebar', { collapsed: !isOpen }]">
    <!-- Home Button (Top) -->
    <button class="home-btn" @click="goHome" :title="'Go to home'">
      <Home :size="20" />
    </button>

    <!-- Toggle Button -->
    <button class="sidebar-toggle" @click="toggleSidebar" :title="isOpen ? 'Collapse sidebar' : 'Expand sidebar'">
      <svg v-if="isOpen" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5L10 10L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 5L3 10L8 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5L10 10L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 5L17 10L12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Collapsed Icon Strip -->
    <div v-if="!isOpen" class="icon-strip">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['icon-btn', { active: activeTab === tab.id }]"
        @click="selectTab(tab.id)"
        :title="tab.label"
      >
        <component :is="tab.icon" :size="18" />
      </button>
    </div>

    <!-- User Avatar (Bottom - Collapsed) -->
    <div v-if="!isOpen" class="user-section-collapsed">
      <button class="user-avatar-btn" @click="toggleUserMenu" :title="authStore.user?.name || 'User menu'">
        <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" alt="User avatar" class="avatar-image" />
        <User v-else :size="20" />
      </button>
    </div>

    <!-- Expanded Content -->
    <div v-else class="sidebar-content">
      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="selectTab(tab.id)"
        >
          <component :is="tab.icon" :size="18" />
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Workflows Tab -->
        <div v-if="activeTab === 'workflows'" class="tab-panel">
          <div class="panel-header">
            <h3>Workflows</h3>
            <button class="icon-btn-small" @click="createNewWorkflow" title="New workflow">
              <Plus :size="16" />
            </button>
          </div>
          <div class="workflow-list">
            <template v-if="isAuthenticated">
              <div v-if="workflowsLoading" class="empty-state">
                <p>Loading workflows…</p>
              </div>
              <div v-else-if="workflows.length === 0" class="empty-state">
                <p>No saved workflows yet</p>
              </div>
              <div
                v-else
                v-for="workflow in workflows"
                :key="workflow.id"
                class="workflow-item"
                @click="loadWorkflow(workflow.id)"
              >
                <div class="workflow-info">
                  <span class="workflow-name">{{ workflow.name }}</span>
                  <span class="workflow-date">{{ formatDate(workflow.updatedAt) }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <AuthEmptyState
                :icon="Layers"
                title="Sign in to save workflows"
                description="Create and save your interview analysis workflows once you connect your account."
              />
            </template>
          </div>
        </div>

        <!-- Reports Tab -->
        <div v-if="activeTab === 'reports'" class="tab-panel">
          <ReportsTab />
        </div>

        <!-- Learning Maps Tab -->
        <div v-if="activeTab === 'maps'" class="tab-panel learning-map-container">
          <LearningMapTab />
        </div>

        <!-- AI Assistant Tab -->
        <div v-if="activeTab === 'assistant'" class="tab-panel assistant-container">
          <AssistantTab />
        </div>
      </div>

      <!-- User Section (Bottom - Expanded) -->
      <div class="user-section-expanded">
        <button class="user-profile-btn" @click="toggleUserMenu">
          <div class="user-avatar">
            <img v-if="authStore.user?.avatarUrl" :src="authStore.user.avatarUrl" alt="User avatar" class="avatar-image" />
            <User v-else :size="18" />
          </div>
          <div class="user-info">
            <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
            <span class="user-email">{{ authStore.user?.email || '' }}</span>
          </div>
        </button>

        <!-- User Dropdown Menu -->
        <div v-if="showUserMenu" class="user-menu">
          <button class="menu-item" @click="handleMenuAction('billing')">
            <CreditCard :size="16" />
            <span>Plans & Billing</span>
          </button>
          <button class="menu-item" @click="handleMenuAction('upgrade')">
            <Zap :size="16" />
            <span>Upgrade Your Plan</span>
          </button>
          <button class="menu-item" @click="handleMenuAction('invite')">
            <Users :size="16" />
            <span>Invite Members</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User Menu (Floating - for collapsed state) -->
    <div v-if="showUserMenu && !isOpen" class="user-menu-floating">
      <button class="menu-item" @click="handleMenuAction('billing')">
        <CreditCard :size="16" />
        <span>Plans & Billing</span>
      </button>
      <button class="menu-item" @click="handleMenuAction('upgrade')">
        <Zap :size="16" />
        <span>Upgrade Your Plan</span>
      </button>
      <button class="menu-item" @click="handleMenuAction('invite')">
        <Users :size="16" />
        <span>Invite Members</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Layers, FileText, Map, Plus, Home, User, CreditCard, Zap, Users, Sparkles } from 'lucide-vue-next'
import LearningMapTab from '@/components/Inspector/LearningMapTab.vue'
import AssistantTab from '@/components/Assistant/AssistantTab.vue'
import ReportsTab from '@/components/Inspector/ReportsTab.vue'
import AuthEmptyState from '@/components/common/AuthEmptyState.vue'
import { useUIStore } from '@/stores/uiStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowLibraryStore } from '@/stores/workflowLibraryStore'
import { useEventBus } from '@/utils/eventBus'

const router = useRouter()
const uiStore = useUIStore()
const workflowStore = useWorkflowStore()
const workflowLibraryStore = useWorkflowLibraryStore()
const authStore = useAuthStore()
const eventBus = useEventBus()

const { sidebarOpen } = storeToRefs(uiStore)
const isOpen = computed(() => sidebarOpen.value)
const activeTab = ref('workflows')
const showUserMenu = ref(false)

// Debug: Watch isOpen changes
watch(isOpen, (newVal, oldVal) => {
  console.log('[LeftSidebar] isOpen changed:', oldVal, '->', newVal)
})

// Sync activeTab with contentView changes
watch(() => uiStore.contentView, (newContentView) => {
  console.log('[LeftSidebar] contentView changed to:', newContentView)

  // Map contentView to activeTab
  if (newContentView === 'workflow') {
    activeTab.value = 'workflows'
  } else if (newContentView === 'reports-list' || newContentView === 'report-detail') {
    activeTab.value = 'reports'
  } else if (newContentView === 'learning-maps-list' || newContentView === 'learning-map-detail') {
    activeTab.value = 'maps'
  }

  console.log('[LeftSidebar] activeTab synced to:', activeTab.value)
})

const tabs = [
  { id: 'workflows', label: 'Workflows', icon: Layers },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'maps', label: 'Learning Maps', icon: Map },
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles }
]

// Mock data - replace with real data from stores
const workflows = computed(() => workflowLibraryStore.sortedWorkflows)
const workflowsLoading = computed(() => workflowLibraryStore.isLoading)
const isAuthenticated = computed(() => authStore.isAuthenticated)

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    workflowLibraryStore.fetchWorkflows()
  } else {
    workflowLibraryStore.reset()
  }
}, { immediate: true })

function toggleSidebar() {
  console.log('[LeftSidebar] Before toggle - sidebarOpen:', sidebarOpen.value)
  uiStore.toggleSidebar()
  console.log('[LeftSidebar] After toggle - sidebarOpen:', sidebarOpen.value)
}

function selectTab(tabId: string) {
  console.log('[LeftSidebar] selectTab called with:', tabId)
  activeTab.value = tabId
  if (!isOpen.value) {
    uiStore.openSidebar()
  }

  // Navigate content area based on selected tab
  if (tabId === 'workflows') {
    console.log('[LeftSidebar] Calling showWorkflow()')
    uiStore.showWorkflow()
  } else if (tabId === 'reports') {
    console.log('[LeftSidebar] Calling showReportsList()')
    uiStore.showReportsList()
  } else if (tabId === 'maps') {
    console.log('[LeftSidebar] Calling showLearningMapsList()')
    uiStore.showLearningMapsList()
  }
  console.log('[LeftSidebar] After navigation, contentView is:', uiStore.contentView)
}

function createNewWorkflow() {
  workflowStore.clearWorkflow()
  uiStore.showToast('New workflow created', 'success')
}

async function loadWorkflow(workflowId: number) {
  try {
    await workflowLibraryStore.loadWorkflow(workflowId)
  } catch (error) {
    // Error handled in store
  }
}

function goHome() {
  router.push('/')
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function handleLoginClick() {
  eventBus.emit('open-login-modal', { returnUrl: '/workflow' })
}

function handleMenuAction(action: string) {
  showUserMenu.value = false
  switch (action) {
    case 'billing':
      router.push('/billing')
      break
    case 'upgrade':
      router.push('/billing')
      break
    case 'invite':
      console.log('Invite members')
      uiStore.showToast('Invite feature coming soon', 'info')
      break
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.left-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: #FFFFFF;
  border-right: 1px solid #E5E7EB;
  transition: width 0.3s ease;
  width: 320px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.left-sidebar.collapsed {
  width: 60px;
}

/* Home Button */
.home-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4B5563;
  z-index: 10;
  transition: all 0.2s ease;
}

.home-btn:hover {
  background: #F3F4F6;
  color: #1F2937;
}

/* Toggle Button */
.sidebar-toggle {
  position: absolute;
  top: 12px;
  right: -12px;
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4B5563;
  z-index: 10;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
  transform: scale(1.1);
}

/* Icon Strip (Collapsed) */
.icon-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0 20px 0;
  gap: 8px;
  flex: 1;
}

.icon-btn {
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #F3F4F6;
  color: #1F2937;
}

.icon-btn.active {
  background: #E5E7EB;
  color: #1F2937;
}

/* User Section - Collapsed */
.user-section-collapsed {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid #E5E7EB;
  margin-top: auto;
}

.user-avatar-btn {
  width: 36px;
  height: 36px;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4B5563;
  transition: all 0.2s ease;
}

.user-avatar-btn:hover {
  background: #E5E7EB;
  border-color: #D1D5DB;
  color: #1F2937;
}

/* Expanded Content */
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 48px;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
  border-bottom: 1px solid #E5E7EB;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6B7280;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  transition: all 0.2s ease;
  text-align: left;
}

.tab-btn:hover {
  background: #F3F4F6;
  color: #1F2937;
}

.tab-btn.active {
  background: #E5E7EB;
  color: #1F2937;
}

.tab-label {
  flex: 1;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Learning Map Container */
.learning-map-container {
  padding: 0 !important;
  gap: 0 !important;
  height: 100%;
  overflow-y: auto;
}

/* AI Assistant Container */
.assistant-container {
  padding: 0 !important;
  gap: 0 !important;
  height: 100%;
  overflow-y: hidden; /* Prevent scrolling - AssistantTab handles its own scrolling */
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.icon-btn-small {
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4B5563;
  transition: all 0.2s ease;
}

.icon-btn-small:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-state p {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

.login-btn {
  margin-top: 12px;
  border: 1px solid #111827;
  background: #111827;
  color: #FFFFFF;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.login-btn:hover {
  background: #000000;
}

/* Workflow Item */
.workflow-list,
.reports-list,
.maps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.workflow-item,
.report-item,
.map-item {
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workflow-item:hover,
.report-item:hover,
.map-item:hover {
  background: #F3F4F6;
  border-color: #D1D5DB;
}

.workflow-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.workflow-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.workflow-date {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #9CA3AF;
}

/* Report/Map Items */
.report-header,
.map-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #1F2937;
}

.report-title,
.map-title {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
}

.report-preview,
.map-preview {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #6B7280;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.report-date,
.map-date {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #9CA3AF;
}

/* ===== NEW: Structured Report Card Layout ===== */
.report-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-title-line {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0;
}

.report-companies-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.companies-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
}

.companies-list {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #1F2937;
  line-height: 1.5;
  word-wrap: break-word;
}

.report-single-info {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #1F2937;
  font-weight: 500;
}

.report-date-line {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #6B7280;
}

/* User Section - Expanded */
.user-section-expanded {
  margin-top: auto;
  border-top: 1px solid #E5E7EB;
  padding: 12px;
  position: relative;
}

.user-profile-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-profile-btn:hover {
  background: #F3F4F6;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4B5563;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.user-name {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
}

.user-email {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #9CA3AF;
}

/* User Menu Dropdown */
.user-menu {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  margin-bottom: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 100;
}

.user-menu-floating {
  position: fixed;
  left: 72px;
  bottom: 24px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 200px;
  z-index: 100;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #4B5563;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  transition: all 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background: #F3F4F6;
  color: #1F2937;
}

/* Scrollbar Styling */
.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
