<script setup lang="ts">
import { computed } from 'vue'
import { FileBarChart, Clock } from 'lucide-vue-next'
import AuthEmptyState from '@/components/common/AuthEmptyState.vue'
import { useReportsStore } from '@/stores/reportsStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import {
  getReportCompany,
  getReportRole,
  formatReportDate
} from '@/utils/reportHelpers'
import type { AnalysisReport } from '@/types/reports'

const reportsStore = useReportsStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const isAuthenticated = computed(() => !!authStore.userId)
const sortedReports = computed(() => reportsStore.sortedReports)
const unreadCount = computed(() => reportsStore.unreadReportsCount)

// Filter counts
const allCount = computed(() => sortedReports.value.length)
const unreadReports = computed(() => sortedReports.value.filter(r => !r.isRead))
const batchReports = computed(() => sortedReports.value.filter(r => r.result?.type === 'batch'))
const singleReports = computed(() => sortedReports.value.filter(r => r.result?.type === 'single'))

// Recent reports (last 5)
const recentReports = computed(() => sortedReports.value.slice(0, 5))

// Stats
const thisWeekCount = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return sortedReports.value.filter(r => new Date(r.timestamp) >= oneWeekAgo).length
})

// Current filter
const currentFilter = computed(() => uiStore.reportFilter)

function handleFilterClick(filter: 'all' | 'unread' | 'batch' | 'single') {
  uiStore.setReportFilter(filter)
  uiStore.showReportsList()
}

function handleRecentReportClick(reportId: string) {
  uiStore.showReportDetail(reportId)
  reportsStore.markAsRead(reportId)
}

function formatRelativeTime(timestamp: Date | string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return diffMins < 1 ? 'Just now' : `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return '1d ago'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return formatReportDate(timestamp)
  }
}
</script>

<template>
  <div class="reports-tab">
    <template v-if="isAuthenticated">
      <!-- Header -->
      <div class="reports-header">
        <h3 class="reports-title">Analysis Reports</h3>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <button
          :class="['filter-btn', { active: currentFilter === 'all' }]"
          @click="handleFilterClick('all')"
        >
          All Reports
          <span class="filter-count">({{ allCount }})</span>
        </button>
        <button
          :class="['filter-btn', { active: currentFilter === 'unread' }]"
          @click="handleFilterClick('unread')"
        >
          Unread
          <span class="filter-count">({{ unreadCount }})</span>
        </button>
        <button
          :class="['filter-btn', { active: currentFilter === 'batch' }]"
          @click="handleFilterClick('batch')"
        >
          Batch
          <span class="filter-count">({{ batchReports.length }})</span>
        </button>
        <button
          :class="['filter-btn', { active: currentFilter === 'single' }]"
          @click="handleFilterClick('single')"
        >
          Single
          <span class="filter-count">({{ singleReports.length }})</span>
        </button>
      </div>

      <!-- Recent Reports -->
      <div v-if="recentReports.length > 0" class="recent-section">
        <h4 class="section-title">Recent</h4>
        <div class="recent-list">
          <button
            v-for="report in recentReports"
            :key="report.id"
            class="recent-item"
            @click="handleRecentReportClick(report.id)"
          >
            <div class="recent-item-content">
              <p class="recent-company">{{ getReportCompany(report) }}</p>
              <p class="recent-role">{{ getReportRole(report) }}</p>
            </div>
            <span class="recent-time">{{ formatRelativeTime(report.timestamp) }}</span>
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-section">
        <h4 class="section-title">Stats</h4>
        <div class="stats-list">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ allCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Unread:</span>
            <span class="stat-value">{{ unreadCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">This week:</span>
            <span class="stat-value">{{ thisWeekCount }}</span>
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

/* Header */
.reports-header {
  @apply flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900;
  flex-shrink: 0;
}

.reports-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100;
}

/* Filters Section */
.filters-section {
  @apply flex flex-col p-4 border-b border-gray-200 dark:border-gray-700;
  flex-shrink: 0;
  gap: 4px;
}

.filter-btn {
  @apply flex items-center justify-between px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 rounded transition-all;
  font-family: 'Inter', sans-serif;
  background: transparent;
  border: none;
  cursor: pointer;
}

.filter-btn:hover {
  @apply bg-gray-100 dark:bg-gray-800;
}

.filter-btn.active {
  @apply bg-gray-200 dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-100;
}

.filter-count {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.filter-btn.active .filter-count {
  @apply text-gray-700 dark:text-gray-300;
}

/* Recent Section */
.recent-section {
  @apply flex flex-col p-4 border-b border-gray-200 dark:border-gray-700;
  flex-shrink: 0;
}

.section-title {
  @apply text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3;
  font-family: 'Inter', sans-serif;
}

.recent-list {
  @apply flex flex-col gap-2;
}

.recent-item {
  @apply flex items-center justify-between px-2 py-1.5 rounded transition-all;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
}

.recent-item:hover {
  @apply bg-gray-100 dark:bg-gray-800;
}

.recent-item-content {
  @apply flex flex-col gap-0.5 flex-1 min-w-0;
}

.recent-company {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 truncate;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.recent-role {
  @apply text-xs text-gray-600 dark:text-gray-400 truncate;
  font-family: 'Inter', sans-serif;
  margin: 0;
}

.recent-time {
  @apply text-xs text-gray-500 dark:text-gray-500 ml-2 flex-shrink-0;
  font-family: 'Inter', sans-serif;
}

/* Stats Section */
.stats-section {
  @apply flex flex-col p-4;
  flex-shrink: 0;
}

.stats-list {
  @apply flex flex-col gap-2;
}

.stat-item {
  @apply flex items-center justify-between text-sm;
  font-family: 'Inter', sans-serif;
}

.stat-label {
  @apply text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

/* Auth Empty State */
.auth-empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center gap-4 h-full border border-dashed border-gray-300 dark:border-gray-700 rounded-lg mx-4 my-6;
}

.auth-empty-state .login-btn {
  @apply mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors;
}
</style>
