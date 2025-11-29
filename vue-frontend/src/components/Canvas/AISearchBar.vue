<template>
  <div class="ai-search-bar">
    <div class="search-container">
      <!-- Search Input -->
      <div class="search-input-wrapper" :class="{ 'is-focused': isFocused, 'is-loading': isAnalyzing }">
        <Search :size="18" class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Describe what you want to analyze..."
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown.escape="closeDropdown"
          @keydown.enter="handleEnter"
        />
        <div v-if="isAnalyzing" class="loading-indicator">
          <Loader2 :size="16" class="spinner" />
        </div>
        <button
          v-else-if="searchQuery"
          class="clear-btn"
          @click="clearSearch"
          title="Clear"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- Dropdown with Intent-Based Suggestions -->
      <Transition name="dropdown">
        <div
          v-if="showDropdown && (hasResults || examplePrompts.length > 0)"
          class="dropdown"
        >
          <!-- Loading State -->
          <div v-if="isAnalyzing" class="loading-state">
            <Loader2 :size="20" class="spinner" />
            <span>Analyzing your request...</span>
          </div>

          <!-- Intent Detection Results -->
          <template v-else-if="intentResult">
            <!-- Quick Actions Section -->
            <div v-if="intentResult.quickActions && intentResult.quickActions.length > 0" class="section">
              <div class="section-header">
                <h4 class="section-title">Quick Actions</h4>
              </div>
              <div class="section-content">
                <button
                  v-for="(action, index) in intentResult.quickActions"
                  :key="index"
                  class="action-item"
                  @click="handleQuickAction(action)"
                >
                  <component :is="getActionIcon(action.type)" :size="16" class="action-icon" />
                  <span class="action-text">{{ action.label }}</span>
                  <ChevronRight :size="14" class="action-chevron" />
                </button>
              </div>
            </div>

            <!-- Related Posts Section -->
            <div v-if="intentResult.postsFound && intentResult.postsFound > 0" class="section">
              <div class="section-header">
                <h4 class="section-title">Related Content</h4>
                <span class="section-badge">{{ intentResult.postsFound }} posts found</span>
              </div>
              <div class="section-content">
                <button
                  class="action-item"
                  @click="openPostBrowser"
                >
                  <FileText :size="16" class="action-icon" />
                  <span class="action-text">Browse {{ intentResult.postsFound }} matching posts</span>
                  <ChevronRight :size="14" class="action-chevron" />
                </button>
              </div>
            </div>

            <!-- Suggestions Section -->
            <div v-if="intentResult.suggestions && intentResult.suggestions.length > 0" class="section">
              <div class="section-header">
                <h4 class="section-title">Suggestions</h4>
              </div>
              <div class="section-content">
                <button
                  v-for="(suggestion, index) in intentResult.suggestions"
                  :key="index"
                  class="suggestion-item"
                  @click="handleSuggestion(suggestion)"
                >
                  <Lightbulb :size="14" class="suggestion-icon" />
                  <span class="suggestion-text">{{ suggestion }}</span>
                </button>
              </div>
            </div>
          </template>

          <!-- Example Prompts (when no query) -->
          <div v-else-if="!searchQuery && examplePrompts.length > 0" class="section">
            <div class="section-header">
              <h4 class="section-title">Example Searches</h4>
            </div>
            <div class="section-content">
              <button
                v-for="(example, index) in examplePrompts"
                :key="index"
                class="example-item"
                @click="handleExample(example)"
              >
                <span class="example-text">{{ example.text }}</span>
                <span class="example-meta">{{ example.meta }}</span>
              </button>
            </div>
          </div>

          <!-- No Results -->
          <div v-if="!isAnalyzing && searchQuery && !hasResults" class="no-results">
            <AlertCircle :size="20" class="no-results-icon" />
            <p class="no-results-text">No matching content found. Try a different search term.</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Post Browser Modal (positioned like dropdown) -->
    <Transition name="modal">
      <div v-if="showPostBrowser" class="post-browser-modal">
        <div class="modal-container" @click.stop="(e) => e.preventDefault()">
          <div class="modal-header">
            <div class="modal-header-left">
              <h3 class="modal-title">Select Posts to Analyze</h3>
              <select v-model="timeFilter" @change="handleTimeFilterChange" class="time-filter-dropdown">
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last 1 year</option>
                <option value="2years">Last 2 years</option>
                <option value="all">All time</option>
              </select>
            </div>
            <button class="modal-close-btn" @click="closePostBrowser">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <!-- Loading State -->
            <div v-if="isLoadingPosts" class="loading-posts">
              <Loader2 :size="24" class="spinner" />
              <p>Searching for posts...</p>
            </div>

            <!-- Top 5 Most Relevant Posts - Selectable Cards -->
            <div v-if="!isLoadingPosts && browserPosts.length > 0" class="posts-list-cards">
              <div
                v-for="(post, index) in browserPosts"
                :key="post.id"
                class="post-card"
                :class="{ 'selected': selectedPostIds.includes(post.post_id) }"
                @click="togglePostSelection(post.post_id)"
              >
                <div class="post-card-header">
                  <div class="post-card-rank">#{{ index + 1 }}</div>
                  <span v-if="isPostOnCanvas(post.post_id)" class="on-canvas-badge">On Canvas</span>
                  <h4 class="post-card-title">{{ post.title }}</h4>
                  <div class="post-card-checkbox">
                    <span v-if="selectedPostIds.includes(post.post_id)" class="checkmark">✓</span>
                  </div>
                </div>

                <p class="post-card-preview">{{ truncateText(post.body_text, 150) }}</p>

                <div class="post-card-tags">
                  <span v-if="post.company" class="post-tag company">{{ post.company }}</span>
                  <span v-if="post.role_type" class="post-tag role">{{ post.role_type }}</span>
                  <span v-if="post.outcome" class="post-tag outcome">{{ post.outcome }}</span>
                  <span class="post-tag match">{{ Math.round(post.similarity * 100) }}% match</span>
                  <span v-if="post.created_at" class="post-tag date">{{ formatDate(post.created_at) }}</span>
                </div>

                <a
                  :href="post.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="post-card-link"
                  @click.stop
                >
                  View Original Post →
                </a>
              </div>
            </div>

            <!-- No Posts Found -->
            <div v-if="!isLoadingPosts && browserPosts.length === 0" class="no-posts-found">
              <AlertCircle :size="32" class="no-posts-icon" />
              <p class="no-posts-title">No posts found</p>
              <p class="no-posts-text">Try adjusting your search query or filters</p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              v-if="filteredPosts.length > 0"
              class="footer-btn footer-btn-secondary"
              @click="selectTopPosts"
            >
              Select Top 5
            </button>
            <button
              class="footer-btn footer-btn-primary"
              :disabled="selectedPostIds.length === 0"
              @click="analyzeSelectedPosts"
            >
              Analyze Selected ({{ selectedPostIds.length }})
            </button>
            <button
              class="footer-btn footer-btn-primary"
              :disabled="selectedPostIds.length === 0"
              @click="addToCanvas"
            >
              Add to Canvas ({{ selectedPostIds.length }})
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import {
  Search,
  X,
  Loader2,
  ChevronRight,
  FileText,
  Lightbulb,
  AlertCircle,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

// Define emits
const emit = defineEmits<{
  postsSelected: [posts: any[]]
}>()

// State
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const isFocused = ref(false)
const showDropdown = ref(false)
const isAnalyzing = ref(false)
const intentResult = ref<any>(null)
const showPostBrowser = ref(false)
const selectedPostIds = ref<string[]>([])
const timeFilter = ref('1year') // Default to 1 year
const postFilter = ref({
  quality: '',
  recency: '',
  outcome: ''
})

// Example prompts for first-time users
const examplePrompts = ref([
  { text: 'amazon swe', meta: 'Company + Role' },
  { text: 'google l4 system design', meta: 'Specific interview type' },
  { text: 'failed meta interviews', meta: 'Filter by outcome' },
  { text: 'best quality amazon swe post', meta: 'Quality filtered' }
])

// Computed
const hasResults = computed(() => {
  return intentResult.value && (
    (intentResult.value.quickActions && intentResult.value.quickActions.length > 0) ||
    (intentResult.value.postsFound && intentResult.value.postsFound > 0) ||
    (intentResult.value.suggestions && intentResult.value.suggestions.length > 0)
  )
})

// Posts data
const browserPosts = ref<any[]>([])
const isLoadingPosts = ref(false)

// Track which posts are already on canvas
const postsOnCanvas = computed(() => {
  const postIds = new Set<string>()
  workflowStore.nodes.forEach(node => {
    if (node.data.postId) {
      postIds.add(node.data.postId)
    }
  })
  return postIds
})

// Check if a post is already on the canvas
function isPostOnCanvas(postId: string): boolean {
  return postsOnCanvas.value.has(postId)
}

const filteredPosts = computed(() => {
  let posts = browserPosts.value

  // Apply quality filter
  if (postFilter.value.quality) {
    posts = posts.filter(p => p.quality_score >= (postFilter.value.quality === 'high' ? 0.7 : 0.5))
  }

  // Apply recency filter
  if (postFilter.value.recency) {
    const days = parseInt(postFilter.value.recency)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    posts = posts.filter(p => new Date(p.created_at) >= cutoffDate)
  }

  // Apply outcome filter
  if (postFilter.value.outcome) {
    posts = posts.filter(p => p.outcome === postFilter.value.outcome)
  }

  return posts
})

// Methods
async function handleInput() {
  if (searchQuery.value.length >= 2) {
    showDropdown.value = true
    await analyzeIntent()
  } else {
    showDropdown.value = false
    intentResult.value = null
  }
}

async function analyzeIntent() {
  isAnalyzing.value = true

  try {
    const response = await fetch('http://localhost:8080/api/content/workflow/parse-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: searchQuery.value })
    })

    if (!response.ok) {
      throw new Error('Failed to parse intent')
    }

    const data = await response.json()

    if (data.success && data.intent) {
      intentResult.value = data.intent
      console.log('[AISearchBar] Intent analyzed:', data.intent)
    } else {
      throw new Error(data.error || 'Invalid response from server')
    }
  } catch (error) {
    console.error('[AISearchBar] Failed to analyze intent:', error)
    uiStore.showToast('Failed to analyze request', 'error')

    // Fallback to empty state
    intentResult.value = null
  } finally {
    isAnalyzing.value = false
  }
}

function handleFocus() {
  isFocused.value = true
  if (searchQuery.value.length >= 2 || examplePrompts.value.length > 0) {
    showDropdown.value = true
  }
}

function handleBlur() {
  isFocused.value = false
  // Delay to allow click events to fire
  setTimeout(() => {
    if (!showPostBrowser.value) {
      // Don't close if post browser is open
    }
  }, 200)
}

function handleEnter() {
  if (intentResult.value?.quickActions && intentResult.value.quickActions.length > 0) {
    handleQuickAction(intentResult.value.quickActions[0])
  }
}

function handleQuickAction(action: any) {
  console.log('[AISearchBar] Quick action:', action)

  if (action.type === 'analyze') {
    // Open post browser to select posts
    openPostBrowser()
  } else if (action.type === 'compare') {
    // Open post browser for batch analysis
    openPostBrowser()
  }
}

function handleSuggestion(suggestion: string) {
  searchQuery.value = suggestion
  handleInput()
}

function handleExample(example: any) {
  searchQuery.value = example.text
  handleInput()
}

async function openPostBrowser() {
  showPostBrowser.value = true
  showDropdown.value = false

  // Fetch posts based on current search query and intent
  await fetchPosts()
}

function closePostBrowser() {
  showPostBrowser.value = false
  selectedPostIds.value = []
  browserPosts.value = []
}

async function fetchPosts() {
  if (!searchQuery.value || !intentResult.value) {
    console.log('[AISearchBar] No search query or intent result')
    return
  }

  isLoadingPosts.value = true

  try {
    // Use LLM-reformulated query if available, otherwise use original query
    const queryToSearch = intentResult.value.searchQuery || searchQuery.value

    console.log('[AISearchBar] Original query:', searchQuery.value)
    console.log('[AISearchBar] Searching with:', queryToSearch)

    const response = await fetch('http://localhost:8080/api/content/workflow/search-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: queryToSearch,  // Use LLM-simplified query
        entities: intentResult.value.entities || {},
        limit: 50,  // Fetch up to 50 matching posts (no hard limit)
        timeFilter: timeFilter.value
      })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }

    const data = await response.json()

    if (data.success && data.posts) {
      browserPosts.value = data.posts
      console.log('[AISearchBar] Fetched', data.posts.length, 'posts with query:', queryToSearch)
    } else {
      throw new Error(data.error || 'Invalid response from server')
    }
  } catch (error) {
    console.error('[AISearchBar] Failed to fetch posts:', error)
    uiStore.showToast('Failed to load posts', 'error')
    browserPosts.value = []
  } finally {
    isLoadingPosts.value = false
  }
}

function togglePostSelection(postId: string) {
  const index = selectedPostIds.value.indexOf(postId)
  if (index > -1) {
    selectedPostIds.value.splice(index, 1)
  } else {
    selectedPostIds.value.push(postId)
  }
}

function selectTopPosts() {
  const topPosts = filteredPosts.value.slice(0, 5)
  selectedPostIds.value = topPosts.map(p => p.id)
}

function analyzeSelectedPosts() {
  if (selectedPostIds.value.length === 0) return

  // TODO: Create workflow nodes from selected posts
  console.log('[AISearchBar] Analyzing posts:', selectedPostIds.value)

  uiStore.showToast(`Creating workflow with ${selectedPostIds.value.length} posts`, 'success')
  closePostBrowser()
  clearSearch()
}

function addToCanvas() {
  if (selectedPostIds.value.length === 0) return

  // Get full post objects for selected posts
  const selectedPosts = browserPosts.value.filter(post =>
    selectedPostIds.value.includes(post.post_id)
  )

  console.log('[AISearchBar] Adding posts to canvas:', selectedPosts)

  // Emit event to parent component with selected posts
  emit('postsSelected', selectedPosts)

  // Show success toast
  uiStore.showToast(`Added ${selectedPosts.length} ${selectedPosts.length === 1 ? 'post' : 'posts'} to canvas`, 'success')

  // Keep selections and modal open so user can add more posts or analyze
  // Don't clear: selectedPostIds.value = []
  // Don't close: closePostBrowser()
}

function clearSearch() {
  searchQuery.value = ''
  showDropdown.value = false
  intentResult.value = null
}

function closeDropdown() {
  showDropdown.value = false
}

function getActionIcon(type: string) {
  switch (type) {
    case 'analyze':
      return Zap
    case 'compare':
      return TrendingUp
    case 'intelligence':
      return BarChart3
    default:
      return FileText
  }
}

function truncate(text: string, length: number): string {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

function formatDate(date: Date | string): string {
  if (!date) return ''
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  return `${month} ${day}, ${year}`
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function handleTimeFilterChange() {
  // Re-fetch posts with new time filter
  await fetchPosts()
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  // Don't close if clicking inside the search bar or modal
  if (!target.closest('.ai-search-bar') && !target.closest('.post-browser-modal')) {
    closeDropdown()
    closePostBrowser()
  }
}

watch([showDropdown, showPostBrowser], ([dropdownOpen, modalOpen]) => {
  if (dropdownOpen || modalOpen) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.ai-search-bar {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
}

.search-container {
  pointer-events: auto;
  width: 680px;
  max-width: 90vw;
}

/* Search Input */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.search-input-wrapper.is-focused {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-input-wrapper.is-loading {
  border-color: #8B5CF6;
}

.search-icon {
  color: #6B7280;
  flex-shrink: 0;
  margin-right: 12px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #111827;
  padding: 0;
}

.search-input::placeholder {
  color: #9CA3AF;
}

.loading-indicator {
  margin-left: 8px;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #8B5CF6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.clear-btn {
  background: transparent;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
  margin-left: 8px;
}

.clear-btn:hover {
  background: #F3F4F6;
  color: #374151;
}

/* Dropdown */
.dropdown {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  right: 0;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  max-height: 480px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 16px;
  color: #6B7280;
  font-size: 13px;
}

/* Section */
.section {
  border-bottom: 1px solid #F3F4F6;
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.section-badge {
  font-size: 11px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 10px;
}

.section-content {
  padding: 0 8px 12px;
}

/* Action Items */
.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.action-item:hover {
  background: #F9FAFB;
}

.action-icon {
  color: #3B82F6;
  flex-shrink: 0;
}

.action-text {
  flex: 1;
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

.action-chevron {
  color: #9CA3AF;
  flex-shrink: 0;
}

/* Suggestion Items */
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.suggestion-item:hover {
  background: #FEF3C7;
}

.suggestion-icon {
  color: #F59E0B;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: 12px;
  color: #78350F;
  font-weight: 500;
}

/* Example Items */
.example-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.example-item:hover {
  background: #F9FAFB;
}

.example-text {
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

.example-meta {
  font-size: 11px;
  color: #9CA3AF;
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
}

.no-results-icon {
  color: #D1D5DB;
}

.no-results-text {
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

/* Post Browser Modal (positioned like dropdown, above search bar) */
.post-browser-modal {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  right: 0;
  z-index: 1000;
  cursor: default; /* Override Vue Flow's grab cursor */
  pointer-events: auto;
}

.modal-container {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  max-height: 600px;
  overflow: hidden;
  cursor: default; /* Override Vue Flow's grab cursor */
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.time-filter-dropdown {
  padding: 6px 12px;
  font-size: 13px;
  color: #374151;
  background: #F9FAFB;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
}

.time-filter-dropdown:hover {
  border-color: #9CA3AF;
  background: #FFFFFF;
}

.time-filter-dropdown:focus {
  border-color: #3B82F6;
  background: #FFFFFF;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.modal-close-btn:hover {
  background: #F3F4F6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.post-item:hover {
  border-color: #D1D5DB;
  background: #F9FAFB;
}

.post-item.is-selected {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.post-checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  cursor: pointer;
}

.post-content {
  flex: 1;
}

.post-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.post-meta {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-date {
  font-size: 11px;
  color: #9CA3AF;
}

.post-preview {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  margin: 0 0 8px;
}

.post-tags {
  display: flex;
  gap: 6px;
}

.post-tag {
  font-size: 11px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Loading Posts */
.loading-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.loading-posts p {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

/* No Posts Found */
.no-posts-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.no-posts-icon {
  color: #9CA3AF;
  margin-bottom: 12px;
}

.no-posts-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.no-posts-text {
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
}

.footer-btn {
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.footer-btn-secondary {
  background: transparent;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.footer-btn-secondary:hover {
  background: #F3F4F6;
}

.footer-btn-primary {
  background: #3B82F6;
  color: #FFFFFF;
}

.footer-btn-primary:hover:not(:disabled) {
  background: #2563EB;
}

.footer-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Post Cards - Selectable with Checkbox */
.posts-list-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  background: #FFFFFF;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-card:hover {
  border-color: #D1D5DB;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.post-card.selected {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.post-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.post-card-rank {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
}

.on-canvas-badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
  background: #3B82F6;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.post-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.4;
}

.post-card-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 1.5px solid #D1D5DB;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  transition: all 0.15s ease;
}

.post-card.selected .post-card-checkbox {
  background: #3B82F6;
  border-color: #3B82F6;
}

.post-card-checkbox .checkmark {
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
}

.post-card-preview {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  margin: 0 0 12px;
}

.post-card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.post-card-tags .post-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.post-card-tags .post-tag.company {
  background: #DBEAFE;
  color: #1E40AF;
}

.post-card-tags .post-tag.role {
  background: #E0E7FF;
  color: #3730A3;
}

.post-card-tags .post-tag.outcome {
  background: #D1FAE5;
  color: #065F46;
}

.post-card-tags .post-tag.match {
  background: #F3F4F6;
  color: #374151;
}

.post-card-link {
  display: inline-block;
  font-size: 13px;
  color: #3B82F6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.post-card-link:hover {
  color: #2563EB;
  text-decoration: underline;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

/* Scrollbar */
.dropdown::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.dropdown::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.dropdown::-webkit-scrollbar-thumb:hover,
.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
