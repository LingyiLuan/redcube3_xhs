<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted } from 'vue'
import { Network, X } from 'lucide-vue-next'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useUIStore } from '@/stores/uiStore'

const learningMapStore = useLearningMapStore()
const uiStore = useUIStore()

const maps = computed(() => learningMapStore.maps)

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

function formatDate(timestamp: Date | string | undefined) {
  if (!timestamp) return 'Unknown'

  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    console.warn('[LearningMapsListView] Invalid date:', timestamp)
    return 'Invalid Date'
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

function getCompanyFocus(map: any): string {
  // Extract company from title
  const title = map.title || ''

  // Common patterns: "Google SWE", "Amazon Software Engineer", etc.
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

  // Fallback - extract first 2-3 words from title
  const words = title.split(' ').filter(w => w.length > 2)
  return words.slice(0, 2).join(' ') || 'Learning Map'
}

function getSkillCount(map: any): number {
  // Count from skills_roadmap.modules if available (correct structure)
  if (map.skills_roadmap?.modules?.length) {
    return map.skills_roadmap.modules.length
  }
  
  // Try legacy structure (array directly)
  if (Array.isArray(map.skills_roadmap) && map.skills_roadmap.length > 0) {
    return map.skills_roadmap.length
  }

  // Fallback to nodes count
  if (map.nodes?.length) {
    return map.nodes.length
  }
  
  // Count from timeline weeks if available
  if (map.timeline?.weeks?.length) {
    return map.timeline.weeks.length
  }

  return 0
}

function getProgress(map: any): number {
  // TODO: Implement progress tracking when user completion data is available
  // For now, return 0 to indicate no progress tracking yet
  // This could be calculated from completed tasks/problems in the future
  return 0
}
</script>

<template>
  <div class="learning-maps-list-view">
    <!-- Empty State -->
    <div v-if="maps.length === 0" class="empty-state">
      <Network :size="48" class="empty-icon" />
      <h3 class="empty-title">No Learning Maps Yet</h3>
      <p class="empty-description">
        Generate your first learning map from analysis reports
      </p>
    </div>

    <!-- Professional Table View -->
    <div v-else class="table-container">
      <table class="maps-table">
        <thead>
          <tr>
            <th class="col-company">Company Focus</th>
            <th class="col-skills">Skills</th>
            <th class="col-created">Created</th>
            <th class="col-progress">Progress</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="map in maps"
            :key="map.id"
            class="table-row"
            @click="handleViewMap(map.id)"
          >
            <td class="col-company">
              <span class="company-name">{{ getCompanyFocus(map) }}</span>
            </td>
            <td class="col-skills">
              <span class="skill-count">{{ getSkillCount(map) }} skills</span>
            </td>
            <td class="col-created">
              <span class="created-date">{{ formatDate(map.createdAt) }}</span>
            </td>
            <td class="col-progress">
              <div class="progress-container">
                <div class="progress-bar" :style="{ width: getProgress(map) + '%' }"></div>
              </div>
              <span class="progress-text">{{ getProgress(map) }}%</span>
            </td>
            <td class="col-actions" @click.stop>
              <a @click="handleViewMap(map.id)" class="action-link">View</a>
              <button @click="handleDeleteMap(map.id, $event)" class="action-delete">
                <X :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.learning-maps-list-view {
  @apply flex flex-col h-full bg-white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center flex-1 p-12 text-center;
}

.empty-icon {
  @apply text-gray-300 mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.empty-description {
  @apply text-sm text-gray-500;
}

/* Professional Table */
.table-container {
  @apply flex-1 overflow-auto;
}

.maps-table {
  @apply w-full border-collapse;
  min-width: 800px;
  table-layout: fixed;
}

.maps-table thead {
  @apply sticky top-0 z-10;
  background: #F1F5F9;
  border-bottom: 2px solid #E2E8F0;
}

.maps-table th {
  @apply text-left px-4 py-3;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #1E3A8A;
  white-space: nowrap;
}

.maps-table tbody tr {
  @apply cursor-pointer;
  border-bottom: 1px solid #E2E8F0;
  transition: background-color 0.15s ease;
}

.maps-table tbody tr:nth-child(odd) {
  background: white;
}

.maps-table tbody tr:nth-child(even) {
  background: #F9FAFB;
}

.maps-table tbody tr:hover {
  background: #EFF6FF;
}

.maps-table td {
  @apply px-4 py-3;
  font-size: 13px;
  color: #374151;
  vertical-align: middle;
}

/* Column Widths */
.col-company {
  width: 35%;
}

.col-skills {
  width: 10%;
}

.col-created {
  width: 20%;
}

.col-progress {
  width: 20%;
}

.col-actions {
  width: 15%;
}

/* Cell Content */
.company-name {
  @apply font-medium;
  color: #111827;
}

.skill-count {
  color: #374151;
  font-weight: 500;
}

.created-date {
  color: #6B7280;
  font-size: 12px;
}

/* Progress */
.col-progress > div,
.col-progress > span {
  display: inline-block;
  vertical-align: middle;
}

.progress-container {
  display: inline-block;
  width: 80px;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #E2E8F0;
  margin-right: 8px;
  vertical-align: middle;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  background: #3B82F6;
}

.progress-text {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: #6B7280;
  min-width: 28px;
  text-align: right;
  vertical-align: middle;
}

/* Actions */
.col-actions > * {
  display: inline-block;
  vertical-align: middle;
}

.action-link {
  font-size: 12px;
  font-weight: 500;
  color: #3B82F6;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
  margin-right: 12px;
}

.action-link:hover {
  color: #2563EB;
  text-decoration: underline;
}

.action-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  color: #9CA3AF;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.action-delete:hover {
  color: #EF4444;
  background: #FEF2F2;
}

/* Responsive */
@media (max-width: 1024px) {
  .col-progress {
    display: none;
  }

  .col-company {
    width: 40%;
  }

  .col-skills {
    width: 15%;
  }

  .col-created {
    width: 30%;
  }

  .col-actions {
    width: 15%;
  }
}
</style>
