<template>
  <!-- Bottom Panel - Collapsible -->
  <div
    class="bottom-panel"
    :class="{ 'expanded': isExpanded, 'collapsed': !isExpanded }"
  >
    <!-- Tab Bar (Always Visible) -->
    <div class="tab-bar">
      <div class="tabs">
        <button
          :class="['tab-button', { active: activeTab === 'reports' && isExpanded }]"
          @click="openTab('reports')"
        >
          Reports
          <span v-if="reportsCount > 0" class="badge" :class="{ pulse: hasNewReports }">
            {{ reportsCount }}
          </span>
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'maps' && isExpanded }]"
          @click="openTab('maps')"
        >
          Learning Maps
          <span v-if="mapsCount > 0" class="badge">{{ mapsCount }}</span>
        </button>
      </div>
      <button
        class="toggle-button"
        @click="togglePanel"
        :title="isExpanded ? 'Collapse panel' : 'Expand panel'"
      >
        <ChevronDown v-if="isExpanded" :size="18" />
        <ChevronUp v-else :size="18" />
      </button>
    </div>

    <!-- Panel Content (Only when expanded) -->
    <div v-if="isExpanded" class="panel-content">
      <!-- Reports Tab -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <ReportsTab @report-viewed="hasNewReports = false" />
      </div>

      <!-- Learning Maps Tab -->
      <div v-else-if="activeTab === 'maps'" class="tab-content">
        <LearningMapTab />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReportsStore } from '@/stores/reportsStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import ReportsTab from '../Inspector/ReportsTab.vue'
import LearningMapTab from '../Inspector/LearningMapTab.vue'

const reportsStore = useReportsStore()
const workflowStore = useWorkflowStore()

// State
const isExpanded = ref(false)
const activeTab = ref('reports')
const hasNewReports = ref(false)

// Computed counts
const reportsCount = computed(() => reportsStore.reports?.length || 0)
const mapsCount = computed(() => {
  // Count learning maps from workflow store or dedicated store
  return 0 // TODO: Connect to actual learning maps count
})

// Methods
function openTab(tabId: string) {
  activeTab.value = tabId
  if (!isExpanded.value) {
    isExpanded.value = true
  }
}

function togglePanel() {
  isExpanded.value = !isExpanded.value
}

// Auto-expand when new report is generated
// This will be triggered by an event from the workflow
function onReportGenerated() {
  hasNewReports.value = true
  setTimeout(() => {
    isExpanded.value = true
    activeTab.value = 'reports'
  }, 1000)
}

// Expose method for parent component
defineExpose({ onReportGenerated })
</script>

<style scoped>
.bottom-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 30;
  transition: height 0.3s ease-out;
}

.dark .bottom-panel {
  background: #1f2937;
  border-top-color: #374151;
}

/* Collapsed: 48px (tab bar only) */
.bottom-panel.collapsed {
  height: 48px;
}

/* Expanded: 300px */
.bottom-panel.expanded {
  height: 300px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
}

.dark .tab-bar {
  border-bottom-color: #374151;
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.dark .tab-button {
  color: #9ca3af;
}

.dark .tab-button:hover {
  background: #374151;
  color: #f9fafb;
}

.tab-button.active {
  background: #eff6ff;
  color: #3b82f6;
}

.dark .tab-button.active {
  background: #1e3a8a;
  color: #60a5fa;
}

/* Badge */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

/* Pulse animation for new reports */
.badge.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Toggle Button */
.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.dark .toggle-button {
  color: #9ca3af;
}

.dark .toggle-button:hover {
  background: #374151;
  color: #f9fafb;
}

/* Panel Content */
.panel-content {
  height: calc(300px - 48px);
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}
</style>
