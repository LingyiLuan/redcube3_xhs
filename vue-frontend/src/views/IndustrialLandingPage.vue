<template>
  <div class="industrial-landing-page">
    <div class="industrial-grid">
      <!-- Hero Tile: Working Lab (6×2) -->
      <IndustrialHeroTile />

      <!-- Login/Profile Tile (3×1) -->
      <IndustrialLoginTile />

      <!-- News/Updates Tile (3×2) -->
      <IndustrialNewsTile />

      <!-- Quick Actions Tile (3×1) -->
      <IndustrialQuickActionsTile />

      <!-- Data Insights Tile (3×1) -->
      <IndustrialDataTile />

      <!-- About Tile (3×1) -->
      <IndustrialAboutTile />

      <!-- Activity Timeline (12×1) - Only show when authenticated -->
      <IndustrialTileBase v-if="isAuthenticated" :span="12" :row="1" class="activity-tile">
        <template #header>
          <h4 class="industrial-h4">Recent Activity</h4>
        </template>

        <div class="activity-timeline">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon">{{ activity.icon }}</div>
            <div class="activity-content">
              <p class="industrial-body-sm">{{ activity.description }}</p>
              <span class="industrial-caption">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>

          <div v-if="recentActivities.length === 0" class="empty-state">
            <p class="industrial-body-sm">No recent activity</p>
          </div>
        </div>
      </IndustrialTileBase>

      <!-- About Tile (6×1) - Only show when not authenticated -->
      <IndustrialTileBase v-if="!isAuthenticated" :span="6" :row="1" class="about-tile">
        <template #header>
          <h4 class="industrial-h4">About Working Lab</h4>
        </template>

        <div class="about-content">
          <p class="industrial-body">
            A modular workspace for analyzing data, building workflows, and generating insights through
            visual node-based editing. Industrial-grade data processing meets intuitive design.
          </p>
        </div>
      </IndustrialTileBase>

      <!-- Database Insights Tile (6×1) - Only show when not authenticated -->
      <IndustrialTileBase v-if="!isAuthenticated" :span="6" :row="1" class="database-tile">
        <template #header>
          <h4 class="industrial-h4">Database Insights</h4>
          <span v-if="databaseStats.scraperMode" class="scraper-badge" :class="`scraper-badge-${databaseStats.scraperMode}`">
            {{ databaseStats.scraperMode === 'reddit' ? '🆓 Reddit API' : 'Apify' }}
          </span>
        </template>

        <div v-if="loadingStats" class="loading-state">
          <span class="industrial-body-sm">Loading...</span>
        </div>

        <div v-else-if="databaseStats.totalPosts" class="database-grid">
          <div class="database-stat-card database-stat-primary">
            <div class="stat-value">{{ formatNumber(databaseStats.totalPosts) }}</div>
            <div class="stat-label">Total Posts</div>
            <div v-if="databaseStats.postsWithEmbeddings" class="stat-sublabel">
              {{ formatNumber(databaseStats.postsWithEmbeddings) }} with embeddings
            </div>
          </div>

          <div class="database-stat-card">
            <div class="stat-value stat-value-accent">{{ formatNumber(databaseStats.todayCount) }}</div>
            <div class="stat-label">Collected Today</div>
            <div class="stat-sublabel">{{ databaseStats.collectionRate }}/day</div>
          </div>

          <div class="database-stat-card">
            <div class="stat-label">Top Companies</div>
            <div class="company-list">
              <div v-for="company in databaseStats.topCompanies" :key="company.company" class="company-item">
                <span class="company-name">{{ company.company }}</span>
                <span class="company-count">{{ company.count }}</span>
              </div>
            </div>
          </div>

          <div class="database-stat-card">
            <div class="stat-label">Auto-Scraping</div>
            <div class="stat-value-status">
              <span :class="databaseStats.autoScrapingEnabled ? 'status-active' : 'status-inactive'">
                {{ databaseStats.autoScrapingEnabled ? '✅ Active' : '❌ Inactive' }}
              </span>
            </div>
            <div class="stat-sublabel">
              {{ databaseStats.autoScrapingEnabled ? 'Every 6 hours' : 'Disabled' }}
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="industrial-body-sm">No database stats available</p>
        </div>
      </IndustrialTileBase>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useLandingStore } from '@/stores/landingStore'
import IndustrialTileBase from '@/components/Tiles/IndustrialTileBase.vue'
import IndustrialHeroTile from '@/components/Tiles/IndustrialHeroTile.vue'
import IndustrialLoginTile from '@/components/Tiles/IndustrialLoginTile.vue'
import IndustrialNewsTile from '@/components/Tiles/IndustrialNewsTile.vue'
import IndustrialQuickActionsTile from '@/components/Tiles/IndustrialQuickActionsTile.vue'
import IndustrialDataTile from '@/components/Tiles/IndustrialDataTile.vue'
import IndustrialAboutTile from '@/components/Tiles/IndustrialAboutTile.vue'
import axios from 'axios'

const authStore = useAuthStore()
const landingStore = useLandingStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const recentActivities = computed(() => landingStore.recentActivities.slice(0, 6))

// Database stats state
const loadingStats = ref(true)
const databaseStats = ref({
  totalPosts: 0,
  postsWithEmbeddings: 0,
  todayCount: 0,
  collectionRate: '600',
  topCompanies: [] as Array<{ company: string; count: number }>,
  scraperMode: 'reddit',
  autoScrapingEnabled: true
})

// Fetch database stats
async function fetchDatabaseStats() {
  try {
    loadingStats.value = true
    const response = await axios.get('/api/content/agent/stats')

    if (response.data.success) {
      const data = response.data.data
      const overall = data.overall
      const companyCoverage = data.companyCoverage || []

      databaseStats.value = {
        totalPosts: overall.totalPosts || 0,
        postsWithEmbeddings: overall.postsWithEmbeddings || 0,
        todayCount: overall.todayCount || 0,
        collectionRate: '600', // Fixed rate based on schedule
        topCompanies: companyCoverage.slice(0, 5),
        scraperMode: data.scraperMode || 'reddit',
        autoScrapingEnabled: data.autoScrapingEnabled ?? true
      }
    }
  } catch (error) {
    console.error('[IndustrialLandingPage] Failed to fetch database stats:', error)
  } finally {
    loadingStats.value = false
  }
}

onMounted(async () => {
  // Check for OAuth callback parameters
  const urlParams = new URLSearchParams(window.location.search)
  const authSuccess = urlParams.get('auth')
  const userData = urlParams.get('user')

  if (authSuccess === 'success' && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData))
      const token = 'oauth-token-' + Date.now()
      authStore.setAuthData(user, token)
      console.log('[IndustrialLandingPage] OAuth login successful')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      console.error('[IndustrialLandingPage] Failed to parse OAuth user data:', error)
    }
  }

  // Fetch landing page data
  await landingStore.fetchNews()
  if (isAuthenticated.value && authStore.user?.id) {
    await landingStore.fetchActivities(authStore.user.id)
  }

  // Fetch database stats
  await fetchDatabaseStats()
})

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
</script>

<style scoped>
.industrial-landing-page {
  min-height: 100vh;
  background: var(--industrial-bg-page);
}

/* Activity Timeline */
.activity-tile {
  display: flex;
  flex-direction: column;
}

.activity-timeline {
  display: flex;
  gap: var(--space-lg);
  overflow-x: auto;
  padding-bottom: var(--space-xs);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 200px;
  padding: var(--space-md);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
}

.activity-icon {
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--industrial-icon);
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.activity-content p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--industrial-text-tertiary);
}

.empty-state p {
  margin: 0;
}

/* About Tile */
.about-tile {
  display: flex;
  flex-direction: column;
}

.about-content p {
  margin: 0;
  line-height: 1.6;
}

/* Database Insights Tile */
.database-tile {
  display: flex;
  flex-direction: column;
}

.database-tile .industrial-h4 {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.scraper-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: var(--space-sm);
}

.scraper-badge-reddit {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.scraper-badge-apify {
  background: rgba(155, 89, 182, 0.1);
  color: #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.2);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--industrial-text-tertiary);
}

.database-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

.database-stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.database-stat-card:hover {
  border-color: var(--industrial-primary);
  transform: translateY(-2px);
}

.database-stat-primary {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(41, 128, 185, 0.05));
  border-color: rgba(52, 152, 219, 0.3);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  line-height: 1;
}

.stat-value-accent {
  color: var(--industrial-accent);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--industrial-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-sublabel {
  font-size: 0.7rem;
  color: var(--industrial-text-tertiary);
}

.stat-value-status {
  margin-top: var(--space-xs);
}

.status-active {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: #2ecc71;
  font-weight: 600;
  font-size: 0.875rem;
}

.status-inactive {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: #e74c3c;
  font-weight: 600;
  font-size: 0.875rem;
}

.company-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.company-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  background: var(--industrial-bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.company-name {
  color: var(--industrial-text-primary);
  font-weight: 500;
}

.company-count {
  color: var(--industrial-text-secondary);
  font-weight: 600;
  background: var(--industrial-bg-page);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

/* Responsive */
@media (max-width: 1024px) {
  .database-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .activity-timeline {
    overflow-x: auto;
  }

  .database-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
