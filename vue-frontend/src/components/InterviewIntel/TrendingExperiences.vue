<template>
  <div class="trending-experiences">
    <div class="section-header">
      <h2 class="section-title">TRENDING EXPERIENCES</h2>
      <p class="section-subtitle">Discover the most valuable interview insights</p>
    </div>

    <!-- Sub-tab Navigation -->
    <div class="subtab-nav">
      <button
        :class="['subtab-button', { active: activeSubTab === 'trending' }]"
        @click="switchSubTab('trending')"
      >
        🔥 Trending
      </button>
      <button
        :class="['subtab-button', { active: activeSubTab === 'rising' }]"
        @click="switchSubTab('rising')"
      >
        ⚡ Rising Stars
      </button>
      <button
        :class="['subtab-button', { active: activeSubTab === 'cited' }]"
        @click="switchSubTab('cited')"
      >
        📚 Most Cited
      </button>
    </div>

    <!-- Filters (only for trending tab) -->
    <div v-if="activeSubTab === 'trending'" class="filters">
      <select v-model="timeWindow" @change="fetchExperiences" class="filter-select">
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="all">All Time</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">Loading experiences...</div>

    <!-- Error State -->
    <div v-if="error" class="error-state">{{ error }}</div>

    <!-- Experiences Grid -->
    <div v-if="!loading && !error" class="experiences-grid">
      <ExperienceCard
        v-for="experience in experiences"
        :key="experience.id"
        :experience="experience"
        @view="$emit('view-experience', experience.id)"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && experiences.length === 0" class="empty-state">
      No experiences found for this filter.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ExperienceCard from './ExperienceCard.vue'

const emit = defineEmits(['view-experience'])

const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'

const experiences = ref([])
const loading = ref(false)
const error = ref('')
const activeSubTab = ref('trending')
const timeWindow = ref('7d')

onMounted(() => {
  fetchExperiences()
})

function switchSubTab(tab) {
  activeSubTab.value = tab
  fetchExperiences()
}

async function fetchExperiences() {
  loading.value = true
  error.value = ''

  try {
    let url = ''
    let params = {}

    switch (activeSubTab.value) {
      case 'trending':
        url = `${apiGatewayUrl}/api/content/trending/experiences`
        params = { limit: 20, timeWindow: timeWindow.value }
        break
      case 'rising':
        url = `${apiGatewayUrl}/api/content/trending/rising-stars`
        params = { limit: 10 }
        break
      case 'cited':
        url = `${apiGatewayUrl}/api/content/trending/most-cited`
        params = { limit: 20, timeWindow: 'all' }
        break
    }

    console.log('[TrendingExperiences] Fetching:', url, params)
    const response = await axios.get(url, { params })

    console.log('[TrendingExperiences] Response:', response.data)
    experiences.value = response.data.data || []
  } catch (err) {
    console.error('[TrendingExperiences] Error:', err)
    error.value = 'Failed to load experiences. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.trending-experiences {
  width: 100%;
}

.section-header {
  text-align: center;
  margin-bottom: 24px;
}

.section-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0;
}

/* Sub-tab Navigation */
.subtab-nav {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.subtab-button {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subtab-button:hover {
  border-color: #000000;
  color: #000000;
}

.subtab-button.active {
  background: #000000;
  border-color: #000000;
  color: #FFFFFF;
}

/* Filters */
.filters {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-select {
  padding: 10px 16px;
  background: #FFFFFF;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:hover {
  border-color: #000000;
}

.filter-select:focus {
  outline: none;
  border-color: #000000;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 64px 32px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
}

.error-state {
  color: #D32F2F;
}

/* Grid */
.experiences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .section-title {
    font-size: 20px;
  }

  .subtab-nav {
    flex-direction: column;
  }

  .subtab-button {
    width: 100%;
  }

  .experiences-grid {
    grid-template-columns: 1fr;
  }
}
</style>
