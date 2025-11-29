<template>
  <div class="experience-browser">
    <!-- Unified Search & Filter Bar -->
    <div class="search-filter-section">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search by keyword..."
        @keyup.enter="performSearch"
      />
      <input
        v-model="filters.company"
        type="text"
        class="filter-input-compact"
        placeholder="Company"
      />
      <input
        v-model="filters.role"
        type="text"
        class="filter-input-compact"
        placeholder="Role"
      />
      <select v-model="filters.difficulty" class="filter-select-compact">
        <option value="">All Difficulties</option>
        <option value="1">1 - Easy</option>
        <option value="2">2</option>
        <option value="3">3 - Medium</option>
        <option value="4">4</option>
        <option value="5">5 - Hard</option>
      </select>
      <select v-model="filters.outcome" class="filter-select-compact">
        <option value="">All Outcomes</option>
        <option value="Offer">Offer</option>
        <option value="Reject">Reject</option>
        <option value="Pending">Pending</option>
        <option value="Withdrew">Withdrew</option>
        <option value="No Response">No Response</option>
      </select>
      <button @click="performSearch" class="search-btn">SEARCH</button>
      <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-btn">CLEAR</button>
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
      <p>No experiences found matching your filters.</p>
      <button @click="resetFilters" class="reset-btn">CLEAR FILTERS</button>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button
        @click="previousPage"
        :disabled="pagination.page === 1"
        class="page-btn"
      >
        PREVIOUS
      </button>
      <span class="page-info">
        Page {{ pagination.page }} of {{ pagination.totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="pagination.page === pagination.totalPages"
        class="page-btn"
      >
        NEXT
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import ExperienceCard from './ExperienceCard.vue'

const emit = defineEmits(['view-experience'])

const experiences = ref([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const isSearching = ref(false)

const filters = ref({
  company: '',
  role: '',
  difficulty: '',
  outcome: ''
})

const pagination = ref({
  page: 1,
  limit: 12,
  totalCount: 0,
  totalPages: 0
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || filters.value.company || filters.value.role ||
         filters.value.difficulty || filters.value.outcome
})

onMounted(() => {
  fetchExperiences()
})

async function fetchExperiences() {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    }

    if (filters.value.company) params.company = filters.value.company
    if (filters.value.role) params.role = filters.value.role
    if (filters.value.difficulty) params.difficulty = filters.value.difficulty
    if (filters.value.outcome) params.outcome = filters.value.outcome

    const response = await axios.get(
      'http://localhost:8080/api/content/interview-intel/experiences',
      { params }
    )

    console.log('[ExperienceBrowser] Fetched experiences:', response.data)
    experiences.value = response.data.data || []
    pagination.value = {
      ...pagination.value,
      ...response.data.pagination
    }
  } catch (err) {
    console.error('[ExperienceBrowser] Error:', err)
    error.value = 'Failed to load experiences. Please try again.'
  } finally {
    loading.value = false
  }
}

function previousPage() {
  if (pagination.value.page > 1) {
    pagination.value.page--
    fetchExperiences()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function nextPage() {
  if (pagination.value.page < pagination.value.totalPages) {
    pagination.value.page++
    fetchExperiences()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function performSearch() {
  // If search query exists, use search endpoint
  if (searchQuery.value.trim()) {
    loading.value = true
    error.value = ''
    isSearching.value = true

    try {
      const response = await axios.get(
        'http://localhost:8080/api/content/interview-intel/search',
        {
          params: {
            q: searchQuery.value,
            limit: pagination.value.limit
          }
        }
      )

      console.log('[ExperienceBrowser] Search results:', response.data)
      experiences.value = response.data.data || []
      pagination.value = {
        page: 1,
        limit: pagination.value.limit,
        totalCount: response.data.count || 0,
        totalPages: Math.ceil((response.data.count || 0) / pagination.value.limit)
      }
    } catch (err) {
      console.error('[ExperienceBrowser] Search error:', err)
      error.value = 'Search failed. Please try again.'
    } finally {
      loading.value = false
    }
  } else {
    // Otherwise, just apply filters
    pagination.value.page = 1
    fetchExperiences()
  }
}

function clearAllFilters() {
  searchQuery.value = ''
  filters.value = {
    company: '',
    role: '',
    difficulty: '',
    outcome: ''
  }
  isSearching.value = false
  pagination.value.page = 1
  fetchExperiences()
}
</script>

<style scoped>
.experience-browser {
  width: 100%;
}

.search-filter-section {
  background: #FFFFFF;
  border: 2px solid #000000;
  padding: 20px;
  margin-bottom: 32px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  flex: 2;
  min-width: 200px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 12px;
  border: 2px solid #000000;
  background: #FAFAFA;
}

.search-input:focus {
  outline: none;
  background: #FFFFFF;
}

.filter-input-compact {
  flex: 1;
  min-width: 120px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 12px;
  border: 2px solid #000000;
  background: #FAFAFA;
}

.filter-input-compact:focus {
  outline: none;
  background: #FFFFFF;
}

.filter-select-compact {
  flex: 1;
  min-width: 140px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  padding: 12px;
  border: 2px solid #000000;
  background: #FAFAFA;
  cursor: pointer;
}

.filter-select-compact:focus {
  outline: none;
  background: #FFFFFF;
}

.search-btn,
.clear-btn {
  font-family: 'Space Grotesk', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 12px 24px;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  white-space: nowrap;
}

.search-btn {
  background: #000000;
  color: #FFFFFF;
}

.search-btn:hover {
  background: #FFFFFF;
  color: #000000;
}

.clear-btn {
  background: #FFFFFF;
  color: #000000;
}

.clear-btn:hover {
  background: #F5F5F5;
}

.reset-btn,
.page-btn {
  font-family: 'Space Grotesk', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 10px 24px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.reset-btn:hover,
.page-btn:hover:not(:disabled) {
  background: #FFFFFF;
  color: #000000;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

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

.empty-state p {
  margin-bottom: 24px;
}

.experiences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 32px 0;
}

.page-info {
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

/* Responsive Design */
@media (max-width: 768px) {
  .search-filter-section {
    flex-direction: column;
  }

  .search-input,
  .filter-input-compact,
  .filter-select-compact {
    width: 100%;
    min-width: 0;
  }

  .search-btn,
  .clear-btn {
    width: 100%;
  }

  .experiences-grid {
    grid-template-columns: 1fr;
  }
}
</style>
