<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted } from 'vue'
import { Network, X, Loader2, AlertCircle, Calendar, BookOpen } from 'lucide-vue-next'
import { useLearningMapStore, type PendingMap } from '@/stores/learningMapStore'
import { useUIStore } from '@/stores/uiStore'
import type { LearningMap } from '@/types/reports'

const learningMapStore = useLearningMapStore()
const uiStore = useUIStore()

const maps = computed(() => learningMapStore.maps)
const pendingMaps = computed(() => learningMapStore.pendingMaps)

// Combine pending and completed maps for display
const allCards = computed(() => {
  const pending = pendingMaps.value.map(p => ({ type: 'pending' as const, data: p }))
  const completed = maps.value.map(m => ({ type: 'completed' as const, data: m }))
  return [...pending, ...completed]
})

onMounted(() => {
  learningMapStore.fetchUserMaps()
})

function handleViewMap(mapId: string) {
  uiStore.showLearningMapDetail(mapId)
}

function handleDeleteMap(mapId: string, event: Event) {
  event.stopPropagation()
  if (confirm('Delete this learning map?')) {
    learningMapStore.deleteMap(mapId)
    uiStore.showToast('Learning map deleted', 'info')
  }
}

function handleDismissPending(pendingId: string, event: Event) {
  event.stopPropagation()
  learningMapStore.removePendingMap(pendingId)
}

function formatDate(timestamp: Date | string | undefined) {
  if (!timestamp) return 'Unknown'

  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(timestamp: Date | string | undefined) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getTimeAgo(timestamp: Date | string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  return formatDate(timestamp)
}

function getCompanyFocus(map: LearningMap): string {
  const title = map.title || ''

  const companies = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix',
                     'Uber', 'Lyft', 'Airbnb', 'Spotify', 'Twitter', 'LinkedIn',
                     'Coinbase', 'Stripe', 'Shopify', 'Dropbox', 'Slack', 'Zoom',
                     'Tesla', 'SpaceX', 'Salesforce', 'Oracle', 'IBM', 'Adobe']

  const foundCompanies: string[] = []
  const titleLower = title.toLowerCase()

  for (const company of companies) {
    if (titleLower.includes(company.toLowerCase())) {
      foundCompanies.push(company)
    }
  }

  if (foundCompanies.length > 2) {
    return `${foundCompanies.slice(0, 2).join(', ')} +${foundCompanies.length - 2}`
  } else if (foundCompanies.length > 0) {
    return foundCompanies.join(', ')
  }

  const words = title.split(' ').filter(w => w.length > 2)
  return words.slice(0, 3).join(' ') || 'Learning Map'
}

function getWeekCount(map: LearningMap): number {
  if (map.timeline?.weeks?.length) {
    return map.timeline.weeks.length
  }
  return 0
}

function getMilestoneCount(map: LearningMap): number {
  if (map.milestones?.length) {
    return map.milestones.length
  }
  return 0
}
</script>

<template>
  <div class="learning-maps-list-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <Network :size="24" class="header-icon" />
        <h1 class="header-title">Learning Maps</h1>
      </div>
      <p class="header-subtitle">Your personalized study plans based on analysis reports</p>
    </div>

    <!-- Empty State -->
    <div v-if="allCards.length === 0" class="empty-state">
      <Network :size="64" class="empty-icon" />
      <h3 class="empty-title">No Learning Maps Yet</h3>
      <p class="empty-description">
        Generate your first learning map from an analysis report.<br>
        Select a report in the Inspector panel and click "Generate Learning Map".
      </p>
    </div>

    <!-- Cards Grid -->
    <div v-else class="cards-grid">
      <!-- Pending Cards (Generating) -->
      <div
        v-for="card in allCards"
        :key="card.type === 'pending' ? card.data.id : card.data.id"
        class="map-card"
        :class="{
          'generating': card.type === 'pending' && card.data.status === 'generating',
          'error': card.type === 'pending' && card.data.status === 'error'
        }"
        @click="card.type === 'completed' ? handleViewMap(card.data.id) : null"
      >
        <!-- Pending/Generating Card -->
        <template v-if="card.type === 'pending'">
          <div class="card-header">
            <h3 class="card-title">{{ (card.data as PendingMap).title }}</h3>
            <div class="card-status" :class="(card.data as PendingMap).status">
              <Loader2 v-if="(card.data as PendingMap).status === 'generating'" :size="14" class="spinner" />
              <AlertCircle v-else :size="14" />
              <span>{{ (card.data as PendingMap).status === 'generating' ? 'Generating' : 'Error' }}</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="(card.data as PendingMap).status === 'generating'" class="progress-section">
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: (card.data as PendingMap).progress.percent + '%' }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-message">{{ (card.data as PendingMap).progress.message }}</span>
              <span class="progress-percent">{{ (card.data as PendingMap).progress.percent }}%</span>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="(card.data as PendingMap).status === 'error'" class="error-section">
            <p class="error-message">{{ (card.data as PendingMap).error }}</p>
            <button @click="handleDismissPending((card.data as PendingMap).id, $event)" class="dismiss-btn">
              Dismiss
            </button>
          </div>

          <div class="card-footer">
            <span class="card-timestamp">Started {{ getTimeAgo((card.data as PendingMap).startedAt) }}</span>
          </div>
        </template>

        <!-- Completed Card -->
        <template v-else>
          <div class="card-header">
            <h3 class="card-title">{{ getCompanyFocus(card.data as LearningMap) }}</h3>
            <button
              @click="handleDeleteMap((card.data as LearningMap).id, $event)"
              class="delete-btn"
              title="Delete map"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="card-stats">
            <div class="stat">
              <Calendar :size="14" />
              <span>{{ getWeekCount(card.data as LearningMap) }} weeks</span>
            </div>
            <div class="stat">
              <BookOpen :size="14" />
              <span>{{ getMilestoneCount(card.data as LearningMap) }} milestones</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="card-timestamp">
              Created {{ formatDate((card.data as LearningMap).createdAt) }}
              <span class="time">{{ formatTime((card.data as LearningMap).createdAt) }}</span>
            </span>
            <span class="view-link">View</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-maps-list-view {
  @apply flex flex-col h-full bg-gray-50 dark:bg-gray-900;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.view-header {
  @apply p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900;
}

.header-content {
  @apply flex items-center gap-3 mb-2;
}

.header-icon {
  @apply text-blue-600 dark:text-blue-400;
}

.header-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
}

.header-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center flex-1 p-12 text-center;
}

.empty-icon {
  @apply text-gray-300 dark:text-gray-700 mb-6;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3;
}

.empty-description {
  @apply text-sm text-gray-500 dark:text-gray-400 leading-relaxed;
}

/* Cards Grid */
.cards-grid {
  @apply flex-1 overflow-auto p-6;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-content: start;
}

/* Map Card */
.map-card {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all;
}

.map-card:hover:not(.generating):not(.error) {
  @apply border-blue-400 dark:border-blue-600 shadow-md;
}

.map-card.generating {
  @apply border-blue-400 dark:border-blue-600 cursor-default;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
}

.dark .map-card.generating {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(31, 41, 55, 1) 100%);
}

.map-card.error {
  @apply border-red-300 dark:border-red-700 cursor-default;
  background: rgba(239, 68, 68, 0.05);
}

.dark .map-card.error {
  background: rgba(239, 68, 68, 0.1);
}

/* Card Header */
.card-header {
  @apply flex items-start justify-between gap-3 mb-3;
}

.card-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100 flex-1;
  line-height: 1.4;
}

.card-status {
  @apply flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium;
}

.card-status.generating {
  @apply bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300;
}

.card-status.error {
  @apply bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.delete-btn {
  @apply p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors;
}

/* Progress Section */
.progress-section {
  @apply mb-4;
}

.progress-bar-container {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2;
}

.progress-bar {
  @apply h-full bg-blue-500 transition-all duration-300 ease-out;
}

.progress-info {
  @apply flex items-center justify-between text-xs;
}

.progress-message {
  @apply text-gray-600 dark:text-gray-400;
}

.progress-percent {
  @apply font-medium text-blue-600 dark:text-blue-400;
}

/* Error Section */
.error-section {
  @apply mb-3;
}

.error-message {
  @apply text-sm text-red-600 dark:text-red-400 mb-2;
}

.dismiss-btn {
  @apply px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors;
}

/* Card Stats */
.card-stats {
  @apply flex items-center gap-4 mb-4;
}

.stat {
  @apply flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400;
}

/* Card Footer */
.card-footer {
  @apply flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700;
}

.card-timestamp {
  @apply flex items-center gap-1;
}

.card-timestamp .time {
  @apply text-gray-400 dark:text-gray-500;
}

.view-link {
  @apply text-blue-600 dark:text-blue-400 font-medium hover:underline;
}

/* Responsive */
@media (max-width: 640px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .view-header {
    @apply p-4;
  }

  .cards-grid {
    @apply p-4;
  }
}
</style>
