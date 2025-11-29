<template>
  <div class="trending-page">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">TRENDING INTERVIEW EXPERIENCES</h1>
      <p class="page-subtitle">Discover the most valuable interview insights from the community</p>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: selectedTab === tab.id }"
          @click="selectedTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Time Window Filter -->
      <div class="time-filter">
        <select v-model="timeWindow" class="time-select">
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
    </div>

    <!-- Category Filters (Optional) -->
    <div class="category-filters">
      <button
        class="filter-chip"
        :class="{ active: categoryFilter === null }"
        @click="categoryFilter = null; filterValue = null"
      >
        ALL
      </button>
      <button
        class="filter-chip"
        :class="{ active: categoryFilter === 'company' }"
        @click="showCompanyDropdown = !showCompanyDropdown"
      >
        BY COMPANY
      </button>
      <button
        class="filter-chip"
        :class="{ active: categoryFilter === 'role' }"
        @click="showRoleDropdown = !showRoleDropdown"
      >
        BY ROLE
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading trending experiences...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="loadExperiences">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="experiences.length === 0" class="empty-container">
      <p class="empty-text">No trending experiences found</p>
      <p class="empty-subtext">Check back later or try different filters</p>
    </div>

    <!-- Experiences Grid -->
    <div v-else class="experiences-grid">
      <ExperienceCard
        v-for="experience in experiences"
        :key="experience.id"
        :experience="experience"
        @view="viewExperience(experience)"
      />
    </div>

    <!-- Load More Button -->
    <div v-if="!loading && experiences.length > 0 && hasMore" class="load-more-container">
      <button class="load-more-btn" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- Experience Detail Modal -->
    <ExperienceDetailView
      v-if="selectedExperience"
      :experience="selectedExperience"
      @close="selectedExperience = null"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ExperienceCard from '../components/InterviewIntel/ExperienceCard.vue'
import ExperienceDetailView from '../components/InterviewIntel/ExperienceDetailView.vue'

const router = useRouter()

// Tab definitions
const tabs = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'rising', label: 'Rising Stars', icon: '⭐' },
  { id: 'most-cited', label: 'Most Cited', icon: '📚' }
]

// State
const selectedTab = ref('trending')
const timeWindow = ref('7d')
const categoryFilter = ref<string | null>(null)
const filterValue = ref<string | null>(null)
const showCompanyDropdown = ref(false)
const showRoleDropdown = ref(false)

const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const experiences = ref<any[]>([])
const selectedExperience = ref<any | null>(null)

const limit = 20
const offset = ref(0)
const hasMore = ref(true)

// Watch for filter changes
watch([selectedTab, timeWindow, categoryFilter, filterValue], () => {
  offset.value = 0
  loadExperiences()
})

// Load experiences
async function loadExperiences() {
  loading.value = true
  error.value = null

  try {
    const url = getApiUrl()
    const params = new URLSearchParams()

    if (selectedTab.value === 'trending') {
      params.append('timeWindow', timeWindow.value)
      params.append('limit', limit.toString())
      params.append('offset', offset.value.toString())

      if (categoryFilter.value && filterValue.value) {
        params.append('category', categoryFilter.value)
        params.append('filter', filterValue.value)
      }
    } else if (selectedTab.value === 'rising') {
      params.append('limit', limit.toString())
    } else if (selectedTab.value === 'most-cited') {
      params.append('timeWindow', timeWindow.value)
      params.append('limit', limit.toString())
    }

    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()

    if (data.success) {
      if (offset.value === 0) {
        experiences.value = data.data
      } else {
        experiences.value = [...experiences.value, ...data.data]
      }

      hasMore.value = data.data.length === limit
    } else {
      error.value = data.error || 'Failed to load experiences'
    }
  } catch (err: any) {
    error.value = err.message || 'Network error occurred'
    console.error('[TrendingPage] Error loading experiences:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function getApiUrl(): string {
  const baseUrl = 'http://localhost:8080/api'

  if (selectedTab.value === 'trending') {
    return `${baseUrl}/trending/experiences`
  } else if (selectedTab.value === 'rising') {
    return `${baseUrl}/trending/rising-stars`
  } else if (selectedTab.value === 'most-cited') {
    return `${baseUrl}/trending/most-cited`
  }

  return `${baseUrl}/trending/experiences`
}

async function loadMore() {
  loadingMore.value = true
  offset.value += limit
  await loadExperiences()
}

function viewExperience(experience: any) {
  selectedExperience.value = experience
}

onMounted(() => {
  loadExperiences()
})
</script>

<style scoped>
.trending-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #000000;
  margin: 0 0 12px 0;
}

.page-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #FAFAFA;
  border: 2px solid #E5E5E5;
  border-radius: 4px;
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #FFFFFF;
  border-color: #000000;
  color: #000000;
}

.tab-btn.active {
  background: #000000;
  border-color: #000000;
  color: #FFFFFF;
}

.tab-icon {
  font-size: 16px;
}

/* Time Filter */
.time-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-select {
  padding: 10px 16px;
  background: #FFFFFF;
  border: 2px solid #E5E5E5;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-select:hover {
  border-color: #000000;
}

.time-select:focus {
  outline: none;
  border-color: #000000;
}

/* Category Filters */
.category-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 8px 16px;
  background: #FAFAFA;
  border: 2px solid #E5E5E5;
  border-radius: 20px;
  font-family: 'Space Grotesk', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  background: #FFFFFF;
  border-color: #000000;
  color: #000000;
}

.filter-chip.active {
  background: #000000;
  border-color: #000000;
  color: #FFFFFF;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E5E5E5;
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.error-text {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #C62828;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 24px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 4px;
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #FFFFFF;
  color: #000000;
}

/* Empty State */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-text {
  font-family: 'Space Grotesk', monospace;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
}

.empty-subtext {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
}

/* Experiences Grid */
.experiences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Load More */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more-btn {
  padding: 14px 32px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 4px;
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: #FFFFFF;
  color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 4px 0 #000000;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-title {
    font-size: 28px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-navigation {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    justify-content: center;
  }

  .time-filter {
    width: 100%;
  }

  .time-select {
    width: 100%;
  }

  .experiences-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
