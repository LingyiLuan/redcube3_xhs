<template>
  <div class="canvas-search-bar">
    <div class="search-container">
      <!-- Search Input -->
      <div class="search-input-wrapper">
        <Search :size="18" class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="What do you want to analyze?"
          @input="handleInput"
          @focus="showDropdown = true"
          @keydown.escape="closeDropdown"
          @keydown.enter="handleEnter"
        />
        <button
          v-if="searchQuery"
          class="clear-btn"
          @click="clearSearch"
          title="Clear"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- Dropdown with Recommendations -->
      <Transition name="dropdown">
        <div
          v-if="showDropdown && (filteredPosts.length > 0 || aiSuggestion)"
          class="dropdown"
        >
          <!-- AI Suggestion -->
          <div v-if="aiSuggestion" class="ai-suggestion" @click="handleAISuggestion">
            <Sparkles :size="16" class="ai-icon" />
            <span>{{ aiSuggestion }}</span>
          </div>

          <!-- Divider -->
          <div v-if="aiSuggestion && filteredPosts.length > 0" class="divider"></div>

          <!-- Post Recommendations -->
          <div class="recommendations">
            <div
              v-for="(post, index) in filteredPosts"
              :key="post.id"
              class="recommendation-item"
              @click="handlePostSelect(post)"
            >
              <div class="post-header">
                <span class="post-source">{{ post.source || 'Reddit' }}</span>
                <span class="post-date">{{ formatDate(post.created_at) }}</span>
              </div>
              <p class="post-preview">{{ truncate(post.content, 120) }}</p>
            </div>
          </div>

          <!-- No Results -->
          <div v-if="filteredPosts.length === 0 && !aiSuggestion && searchQuery" class="no-results">
            <p>No posts found. Try a different search term.</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import { Search, X, Sparkles } from 'lucide-vue-next'
import { useWorkflowStore } from '@/stores/workflowStore'
import { useUIStore } from '@/stores/uiStore'

const workflowStore = useWorkflowStore()
const uiStore = useUIStore()

const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const showDropdown = ref(false)

// Mock post data - replace with actual API call
const mockPosts = ref([
  {
    id: '1',
    content: 'Just finished my Amazon coding interview. They asked me to implement LRU Cache and discuss time complexity.',
    source: 'Reddit',
    created_at: new Date('2024-01-15')
  },
  {
    id: '2',
    content: 'Amazon system design round - had to design a distributed rate limiter. Discussed token bucket algorithm.',
    source: 'Blind',
    created_at: new Date('2024-01-14')
  },
  {
    id: '3',
    content: 'Google SWE interview focused on graphs. Implemented BFS and DFS variants for different problems.',
    source: 'LeetCode',
    created_at: new Date('2024-01-13')
  },
  {
    id: '4',
    content: 'Meta behavioral interview was intense. Asked about conflict resolution and team leadership examples.',
    source: 'Reddit',
    created_at: new Date('2024-01-12')
  },
  {
    id: '5',
    content: 'Amazon leadership principles came up in every question. Be prepared with STAR format answers.',
    source: 'Blind',
    created_at: new Date('2024-01-11')
  }
])

// Filter posts based on search query
const filteredPosts = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }

  const query = searchQuery.value.toLowerCase()
  return mockPosts.value
    .filter(post => post.content.toLowerCase().includes(query))
    .slice(0, 10) // Limit to 10 results
})

// AI suggestion based on search query
const aiSuggestion = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 3) {
    return null
  }

  const query = searchQuery.value.trim()
  return `Generate workflow for "${query}" analysis?`
})

function handleInput() {
  if (searchQuery.value.length >= 2) {
    showDropdown.value = true
  } else {
    showDropdown.value = false
  }
}

function handlePostSelect(post: any) {
  // Add post as Input Node to canvas
  const newNode = workflowStore.addNode({
    type: 'input',
    position: {
      x: Math.random() * 400 + 200,
      y: Math.random() * 300 + 150
    },
    data: {
      label: 'Interview Post',
      content: post.content,
      status: 'idle',
      metadata: {
        source: post.source,
        postId: post.id
      }
    }
  })

  uiStore.showToast(`Added post from ${post.source}`, 'success')
  closeDropdown()
  clearSearch()

  console.log('[CanvasSearchBar] Added node:', newNode.id)
}

function handleAISuggestion() {
  // Generate workflow based on search query
  uiStore.showToast('Generating AI workflow...', 'info')

  // TODO: Implement AI workflow generation
  // For now, just add a few nodes
  const posts = filteredPosts.value.slice(0, 3)

  posts.forEach((post, index) => {
    workflowStore.addNode({
      type: 'input',
      position: {
        x: 100,
        y: 100 + (index * 200)
      },
      data: {
        label: 'Interview Post',
        content: post.content,
        status: 'idle',
        metadata: {
          source: post.source,
          postId: post.id
        }
      }
    })
  })

  // Add analysis node
  workflowStore.addNode({
    type: 'analysis',
    position: {
      x: 500,
      y: 250
    },
    data: {
      label: 'Batch Analysis',
      status: 'idle'
    }
  })

  uiStore.showToast('Workflow generated', 'success')
  closeDropdown()
  clearSearch()
}

function handleEnter() {
  if (aiSuggestion.value) {
    handleAISuggestion()
  } else if (filteredPosts.value.length > 0) {
    handlePostSelect(filteredPosts.value[0])
  }
}

function clearSearch() {
  searchQuery.value = ''
  showDropdown.value = false
}

function closeDropdown() {
  showDropdown.value = false
}

function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

function formatDate(date: Date): string {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - new Date(date).getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.canvas-search-bar')) {
    closeDropdown()
  }
}

// Add/remove event listener
watch(showDropdown, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.canvas-search-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
}

.search-container {
  pointer-events: auto;
  width: 600px;
  max-width: 90vw;
}

/* Search Input */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
}

.search-icon {
  color: #9CA3AF;
  flex-shrink: 0;
  margin-right: 12px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #1F2937;
  padding: 0;
}

.search-input::placeholder {
  color: #9CA3AF;
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
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #F3F4F6;
  color: #1F2937;
}

/* Dropdown */
.dropdown {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* AI Suggestion */
.ai-suggestion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #E5E7EB;
}

.ai-suggestion:hover {
  background: #F9FAFB;
}

.ai-icon {
  color: #8B5CF6;
  flex-shrink: 0;
}

.ai-suggestion span {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

/* Divider */
.divider {
  height: 1px;
  background: #E5E7EB;
}

/* Recommendations */
.recommendations {
  padding: 8px 0;
}

.recommendation-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recommendation-item:hover {
  background: #F9FAFB;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.post-source {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #8B5CF6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.post-date {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #9CA3AF;
}

.post-preview {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #4B5563;
  line-height: 1.5;
  margin: 0;
}

/* No Results */
.no-results {
  padding: 32px 16px;
  text-align: center;
}

.no-results p {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #9CA3AF;
  margin: 0;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Scrollbar */
.dropdown::-webkit-scrollbar {
  width: 6px;
}

.dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.dropdown::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
