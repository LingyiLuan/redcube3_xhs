<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/uiStore'
import WorkflowCanvas from './WorkflowCanvas.vue'
import ReportsListView from '@/components/Views/ReportsListView.vue'
import LearningMapsListView from '@/components/Views/LearningMapsListView.vue'
import ReportViewer from '@/components/ResultsPanel/ReportViewer.vue'
import LearningMapViewer from '@/components/ResultsPanel/LearningMapViewer.vue'

const uiStore = useUIStore()
const { contentView, activeContentId } = storeToRefs(uiStore)

// Determine which component to show
const showWorkflow = computed(() => contentView.value === 'workflow')
const showReportsList = computed(() => contentView.value === 'reports-list')
const showLearningMapsList = computed(() => contentView.value === 'learning-maps-list')
const showReportDetail = computed(() => contentView.value === 'report-detail' && activeContentId.value)
const showLearningMapDetail = computed(() => contentView.value === 'learning-map-detail' && activeContentId.value)
</script>

<template>
  <div class="content-area">
    <!-- Workflow Canvas (default view) -->
    <div v-if="showWorkflow" class="view-container workflow-view">
      <WorkflowCanvas />
    </div>

    <!-- Reports List View -->
    <div v-else-if="showReportsList" class="view-container list-view">
      <ReportsListView />
    </div>

    <!-- Learning Maps List View -->
    <div v-else-if="showLearningMapsList" class="view-container list-view">
      <LearningMapsListView />
    </div>

    <!-- Report Detail View -->
    <div v-else-if="showReportDetail" class="view-container detail-view">
      <div class="detail-wrapper">
        <ReportViewer :report-id="activeContentId!" />
      </div>
    </div>

    <!-- Learning Map Detail View -->
    <div v-else-if="showLearningMapDetail" class="view-container detail-view">
      <div class="detail-wrapper">
        <LearningMapViewer :map-id="String(activeContentId!)" />
      </div>
    </div>

    <!-- Fallback (should never show) -->
    <div v-else class="view-container empty-view">
      <p>No content to display</p>
    </div>
  </div>
</template>

<style scoped>
.content-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.view-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* Workflow view - full canvas */
.workflow-view {
  background: #FFFFFF;
}

/* List views - full page layouts */
.list-view {
  background: #F9FAFB;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Detail views - scrollable with padding */
.detail-view {
  background: #F9FAFB;
  overflow-y: auto;
  overflow-x: hidden;
}

.detail-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  min-height: 100%;
}

/* Empty state */
.empty-view {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
}

.empty-view p {
  color: #6B7280;
  font-size: 16px;
}

/* Dark mode */
.dark .workflow-view {
  background: #1F2937;
}

.dark .list-view,
.dark .detail-view {
  background: #111827;
}

.dark .empty-view {
  background: #111827;
}

.dark .empty-view p {
  color: #9CA3AF;
}
</style>
