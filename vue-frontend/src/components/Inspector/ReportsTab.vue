<script setup lang="ts">
import { computed } from 'vue'
import { FileBarChart, Clock, CheckCircle, Trash2, Eye } from 'lucide-vue-next'
import AuthEmptyState from '@/components/common/AuthEmptyState.vue'
import { useReportsStore } from '@/stores/reportsStore'
import { useUIStore } from '@/stores/uiStore'
import { useResultsPanelStore } from '@/stores/resultsPanelStore'
import { useAuthStore } from '@/stores/authStore'
import { useEventBus } from '@/utils/eventBus'

const reportsStore = useReportsStore()
const uiStore = useUIStore()
const resultsPanelStore = useResultsPanelStore()
const authStore = useAuthStore()
const eventBus = useEventBus()

const sortedReports = computed(() => reportsStore.sortedReports)
const isAuthenticated = computed(() => !!authStore.userId)

function handleViewReport(reportId: string) {
  // Open the ResultsPanel with this report
  resultsPanelStore.openReport(reportId)
  // Mark as read
  reportsStore.markAsRead(reportId)
}

function handleDeleteReport(reportId: string) {
  if (confirm('Delete this report?')) {
    reportsStore.deleteReport(reportId)
    uiStore.showToast('Report deleted', 'info')
  }
}

function formatDate(timestamp: Date | string) {
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <div class="reports-tab">
    <template v-if="isAuthenticated">
      <!-- Reports List -->
      <div class="reports-list">
        <!-- Header -->
        <div class="reports-header">
          <h3 class="reports-title">Analysis Reports</h3>
          <button
            v-if="sortedReports.length > 0"
            @click="reportsStore.markAllAsRead"
            class="mark-all-read-btn"
          >
            <CheckCircle :size="16" />
            Mark All Read
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="sortedReports.length === 0" class="empty-state">
          <FileBarChart :size="48" class="empty-icon" />
          <h4 class="empty-title">No Reports Yet</h4>
          <p class="empty-description">
            Analyze a node to generate your first report
          </p>
        </div>

        <!-- Reports List -->
        <div v-else class="reports-items">
          <div
            v-for="report in sortedReports"
            :key="report.id"
            :class="['report-card', { unread: !report.isRead }]"
          >
            <div class="report-card-header">
              <div class="report-badge" :class="{ 'badge-unread': !report.isRead }">
                <FileBarChart :size="16" />
              </div>
              <div class="report-meta">
                <p class="report-node-label">Node: {{ report.nodeId }}</p>
                <p class="report-time">
                  <Clock :size="14" />
                  {{ formatDate(report.timestamp) }}
                </p>
              </div>
            </div>

            <div class="report-card-actions">
              <button @click="handleViewReport(report.id)" class="view-btn">
                <Eye :size="16" />
                View
              </button>
              <button @click="handleDeleteReport(report.id)" class="delete-btn">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <AuthEmptyState
        :icon="FileBarChart"
        title="Sign in to view your reports"
        description="Analyze interview workflows, then view them here once you connect your account."
      />
    </template>
  </div>
</template>

<style scoped>
.reports-tab {
  @apply flex flex-col h-full;
}

/* Active Report View */
.active-report-view {
  @apply flex flex-col h-full;
}

.report-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
}

.report-header-content {
  @apply flex items-center gap-3;
}

.report-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

.report-timestamp {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.close-report-btn {
  @apply px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors;
}

.report-content {
  @apply flex-1 overflow-y-auto p-4;
}

/* Reports List */
.reports-list {
  @apply flex flex-col h-full;
}

.reports-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
}

.reports-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

.mark-all-read-btn {
  @apply flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center min-h-[300px];
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-3;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Reports Items */
.reports-items {
  @apply flex-1 overflow-y-auto p-4 space-y-3;
}

.report-card {
  @apply p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow;
}

.report-card.unread {
  @apply border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20;
}

.report-card-header {
  @apply flex items-start gap-3 mb-3;
}

.report-badge {
  @apply flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400;
}

.badge-unread {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400;
}

.report-meta {
  @apply flex-1;
}

.report-node-label {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 mb-1;
}

.report-time {
  @apply flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400;
}

.report-card-actions {
  @apply flex items-center gap-2;
}

.view-btn {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors;
}

.delete-btn {
  @apply flex items-center justify-center p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors;
}

.auth-empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center gap-4 h-full border border-dashed border-gray-300 dark:border-gray-700 rounded-lg mx-4 my-6;
}

.auth-empty-state .login-btn {
  @apply mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors;
}
</style>
