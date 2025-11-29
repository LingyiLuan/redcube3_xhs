<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="modal-overlay" :style="{ left: sidebarWidth }" @click.self="close">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">
              Similar Interview Experiences
            </h2>
            <button @click="close" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- No tabs needed - only showing similar posts -->
          <div class="section-header">
            <h3 class="section-title">Similar Posts ({{ similarPostsCount }})</h3>
            <p class="section-subtitle">
              Posts from Reddit/forums with high semantic similarity to your experiences
            </p>
          </div>

          <!-- Filters -->
          <div class="filters-container">
            <div class="filter-group">
              <label class="filter-label">Company:</label>
              <select v-model="filterCompany" class="filter-select">
                <option value="">All Companies</option>
                <option v-for="company in uniqueCompanies" :key="company" :value="company">
                  {{ company }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Role:</label>
              <select v-model="filterRole" class="filter-select">
                <option value="">All Roles</option>
                <option v-for="role in uniqueRoles" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Outcome:</label>
              <select v-model="filterOutcome" class="filter-select">
                <option value="">All Outcomes</option>
                <option value="success">Success</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <button @click="resetFilters" class="reset-btn">
              Reset Filters
            </button>
          </div>

          <!-- Content -->
          <div class="modal-body">
            <!-- Similar Posts Content -->
            <div class="posts-container">
              <p class="tab-description">
                {{ similarPostsCount }} posts from Reddit/forums with high semantic similarity to your experiences.
                <span v-if="allSimilarPosts.length === 0"> Detailed post data is being processed.</span>
              </p>

              <div v-if="allSimilarPosts.length === 0" class="empty-state">
                <p>Similar posts are identified ({{ similarPostsCount }} total), but detailed data is not yet available in this view.</p>
                <p class="empty-state-note">The analysis was performed on all {{ totalPostsCount }} posts. Individual post details will be available in a future update.</p>
              </div>

              <div v-else-if="filteredSimilarPosts.length === 0" class="empty-state">
                <p>No similar posts match your current filters</p>
              </div>

              <div v-else class="posts-grid">
                <div
                  v-for="post in paginatedSimilarPosts"
                  :key="post.id"
                  class="source-card similar-card"
                >
                  <div class="card-header">
                    <div class="badges-group">
                      <span v-if="post.company" class="company-badge">{{ post.company }}</span>
                      <span v-if="post.role" class="role-badge">{{ post.role }}</span>
                    </div>
                    <span class="similarity-badge" :class="getSimilarityClass(post.similarity)">
                      {{ formatSimilarity(post.similarity) }}% match
                    </span>
                  </div>

                  <div class="card-body">
                    <h3 class="post-title">{{ truncateText(post.title, 80) }}</h3>
                    <p v-if="post.excerpt" class="post-excerpt">
                      {{ truncateText(post.excerpt, 120) }}
                    </p>
                  </div>

                  <div class="card-footer">
                    <span v-if="post.outcome" class="outcome-tag" :class="getOutcomeClass(post.outcome)">
                      {{ post.outcome }}
                    </span>
                    <a
                      v-if="post.url"
                      :href="post.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="view-original-link"
                    >
                      View Original
                      <ArrowTopRightOnSquareIcon class="link-icon" />
                    </a>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="pagination">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="page-btn"
                >
                  Previous
                </button>
                <span class="page-info">
                  Page {{ currentPage }} of {{ totalPages }}
                </span>
                <button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  class="page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <div class="footer-stats">
              <span class="stat-item">
                Showing <strong>{{ filteredSimilarPosts.length }}</strong> of <strong>{{ similarPostsCount }}</strong> similar posts
              </span>
            </div>
            <button @click="close" class="close-modal-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/uiStore'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'

// Removed SeedPost interface - no longer displaying seed posts in this modal

interface SimilarPost {
  id: string
  title: string
  company?: string
  role?: string
  outcome?: string
  similarity?: number
  excerpt?: string
  url?: string
}

interface Props {
  isOpen: boolean
  seedPosts: SeedPost[]
  similarPosts?: SimilarPost[]
  patterns?: any
}

const props = withDefaults(defineProps<Props>(), {
  similarPosts: () => [],
  patterns: () => ({})
})

const emit = defineEmits<{
  close: []
}>()

// Get sidebar state from UI store
const uiStore = useUIStore()
const { sidebarOpen } = storeToRefs(uiStore)

// Compute sidebar width for positioning
const sidebarWidth = computed(() => sidebarOpen.value ? '320px' : '60px')

// Watch for prop changes
watch(() => props.isOpen, (newVal) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`[SOURCE DATA MODAL] 👁️ isOpen changed to: ${newVal}`)
  console.log(`${'='.repeat(80)}`)
  if (newVal) {
    console.log('[SOURCE DATA MODAL] Modal is now OPEN')
    console.log('[SOURCE DATA MODAL] similarPosts at open:', props.similarPosts)
    console.log('[SOURCE DATA MODAL] similarPosts length at open:', props.similarPosts?.length)
    console.log('[SOURCE DATA MODAL] seedPosts at open:', props.seedPosts)
    console.log('[SOURCE DATA MODAL] seedPosts length at open:', props.seedPosts?.length)
    console.log('[SOURCE DATA MODAL] 🔍 patterns object:', props.patterns)
    console.log('[SOURCE DATA MODAL] 🔍 patterns.source_posts:', props.patterns?.source_posts)
    console.log('[SOURCE DATA MODAL] 🔍 patterns.source_posts length:', props.patterns?.source_posts?.length)
    console.log('[SOURCE DATA MODAL] 🔍 patterns.metadata:', props.patterns?.metadata)
    console.log('[SOURCE DATA MODAL] 🔍 patterns.total_posts:', props.patterns?.total_posts)

    // Log first source post to see its structure
    if (props.patterns?.source_posts && props.patterns.source_posts.length > 0) {
      console.log('[SOURCE DATA MODAL] 🔍 First source post FULL:', props.patterns.source_posts[0])
      console.log('[SOURCE DATA MODAL] 🔍 First source post fields:', {
        post_id: props.patterns.source_posts[0].post_id,
        title: props.patterns.source_posts[0].title,
        url: props.patterns.source_posts[0].url,
        permalink: props.patterns.source_posts[0].permalink,
        company: props.patterns.source_posts[0].company,
        role: props.patterns.source_posts[0].role,
        role_type: props.patterns.source_posts[0].role_type,
        similarity: props.patterns.source_posts[0].similarity
      })
    }
  }
  console.log(`${'='.repeat(80)}\n`)
})

watch(() => props.similarPosts, (newVal) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`[SOURCE DATA MODAL] 📊 similarPosts prop changed`)
  console.log(`${'='.repeat(80)}`)
  console.log('[SOURCE DATA MODAL] New similarPosts:', newVal)
  console.log('[SOURCE DATA MODAL] New similarPosts length:', newVal?.length)
  console.log(`${'='.repeat(80)}\n`)
}, { deep: true })

// State (no tabs needed anymore - only showing similar posts)
const filterCompany = ref('')
const filterRole = ref('')
const filterOutcome = ref('')
const currentPage = ref(1)
const postsPerPage = 12

// Computed
const similarPostsCount = computed(() => {
  console.log('[SOURCE DATA MODAL] 📊 Computing similarPostsCount')
  console.log('[SOURCE DATA MODAL] props.patterns.metadata:', props.patterns?.metadata)
  console.log('[SOURCE DATA MODAL] props.patterns.total_posts:', props.patterns?.total_posts)
  console.log('[SOURCE DATA MODAL] props.patterns.source_posts.length:', props.patterns?.source_posts?.length)
  console.log('[SOURCE DATA MODAL] props.seedPosts.length:', props.seedPosts?.length)

  // Get count from:
  // 1. patterns.metadata.total_posts (preferred)
  // 2. patterns.total_posts (fallback)
  // 3. patterns.source_posts.length (actual RAG posts count)
  const totalPosts = props.patterns.metadata?.total_posts ||
                     props.patterns.total_posts ||
                     (props.patterns.source_posts?.length || 0) + props.seedPosts.length

  const count = Math.max(0, totalPosts - props.seedPosts.length)
  console.log('[SOURCE DATA MODAL] Computed similarPostsCount:', count)
  return count
})

const totalPostsCount = computed(() => {
  return props.seedPosts.length + similarPostsCount.value
})

// Use actual similar posts from patterns.source_posts (SAME PATTERN AS interview_questions)
// IMPORTANT: Backend returns role_type, we map it to role for frontend consistency
const allSimilarPosts = computed(() => {
  // ===== CRITICAL: Log data received in modal =====
  console.log(`\n${'='.repeat(80)}`)
  console.log(`[SOURCE DATA MODAL] 🔍 Computing allSimilarPosts`)
  console.log(`${'='.repeat(80)}`)
  console.log(`[SOURCE DATA MODAL] props.isOpen: ${props.isOpen}`)
  console.log(`[SOURCE DATA MODAL] props.patterns.source_posts:`, props.patterns?.source_posts)
  console.log(`[SOURCE DATA MODAL] props.patterns.source_posts count: ${props.patterns?.source_posts?.length || 0}`)
  console.log(`[SOURCE DATA MODAL] props.seedPosts count: ${props.seedPosts?.length || 0}`)
  console.log(`[SOURCE DATA MODAL] props.patterns exists: ${!!props.patterns}`)

  // Get source posts from patterns (same as interview_questions pattern)
  const sourcePosts = props.patterns?.source_posts || []
  console.log(`[SOURCE DATA MODAL] sourcePosts from patterns: ${sourcePosts.length}`)

  if (sourcePosts.length > 0) {
    console.log(`[SOURCE DATA MODAL] First source post (RAW):`, {
      post_id: sourcePosts[0].post_id,
      title: sourcePosts[0].title?.substring(0, 50),
      company: sourcePosts[0].company,
      role: sourcePosts[0].role,
      role_type: sourcePosts[0].role_type
    })
  } else {
    console.log(`[SOURCE DATA MODAL] ❌ NO SOURCE POSTS in patterns.source_posts!`)
  }

  if (props.seedPosts && props.seedPosts.length > 0) {
    console.log(`[SOURCE DATA MODAL] First seed post:`, {
      company: props.seedPosts[0].company,
      role: props.seedPosts[0].role,
      original_text: props.seedPosts[0].original_text?.substring(0, 50)
    })
  }

  console.log(`${'='.repeat(80)}\n`)

  // Map role_type → role for frontend consistency
  const result = sourcePosts.map(post => ({
    ...post,
    role: post.role || post.role_type // Use role if exists, fallback to role_type
  }))

  console.log(`[SOURCE DATA MODAL] Returning ${result.length} similar posts (after mapping role_type → role)`)
  if (result.length > 0) {
    console.log(`[SOURCE DATA MODAL] First post after mapping:`, {
      post_id: result[0].post_id,
      company: result[0].company,
      role: result[0].role
    })
  }
  return result
})

const uniqueCompanies = computed(() => {
  const companies = new Set(allSimilarPosts.value.map(p => p.company).filter(Boolean))
  return Array.from(companies).sort()
})

const uniqueRoles = computed(() => {
  const roles = new Set(allSimilarPosts.value.map(p => p.role).filter(Boolean))
  return Array.from(roles).sort()
})

const filteredSimilarPosts = computed(() => {
  const filtered = allSimilarPosts.value.filter(post => {
    if (filterCompany.value && post.company !== filterCompany.value) return false
    if (filterRole.value && post.role !== filterRole.value) return false
    if (filterOutcome.value && post.outcome !== filterOutcome.value) return false
    return true
  })
  console.log(`[SOURCE DATA MODAL] 🔍 Filtered similar posts: ${filtered.length}/${allSimilarPosts.value.length}`)
  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredSimilarPosts.value.length / postsPerPage)
})

const paginatedSimilarPosts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  const paginated = filteredSimilarPosts.value.slice(start, end)
  console.log(`[SOURCE DATA MODAL] 📄 Paginated posts (page ${currentPage.value}): ${paginated.length}`)
  console.log(`[SOURCE DATA MODAL] 📄 Showing posts ${start + 1}-${Math.min(end, filteredSimilarPosts.value.length)} of ${filteredSimilarPosts.value.length}`)
  return paginated
})

// Methods
function close() {
  emit('close')
}

function resetFilters() {
  filterCompany.value = ''
  filterRole.value = ''
  filterOutcome.value = ''
  currentPage.value = 1
}

// Removed viewPostDetails function - no longer needed since we removed "Your Posts" tab

function formatSimilarity(similarity?: number): string {
  if (similarity === undefined || similarity === null) {
    console.warn('[SourceDataModal] formatSimilarity received undefined/null similarity')
    return '0'
  }
  const percent = ((1 - similarity) * 100).toFixed(0)
  console.log(`[SourceDataModal] formatSimilarity(${similarity}) = ${percent}%`)
  return percent
}

function getSimilarityClass(similarity?: number): string {
  if (!similarity) return ''
  const percent = (1 - similarity) * 100
  if (percent >= 90) return 'very-high'
  if (percent >= 80) return 'high'
  if (percent >= 70) return 'medium'
  return 'low'
}

function getOutcomeClass(outcome: string): string {
  const lower = outcome.toLowerCase()
  if (lower.includes('success') || lower.includes('offer') || lower.includes('accept')) {
    return 'outcome-success'
  }
  if (lower.includes('reject') || lower.includes('fail')) {
    return 'outcome-failure'
  }
  return 'outcome-neutral'
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Reset page when filters change
watch([filterCompany, filterRole, filterOutcome], () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* Modal Overlay - Covers content area only, adjusts with sidebar */
.modal-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: var(--sidebar-width, 320px); /* Dynamically set based on sidebar state */
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  transition: left 0.2s ease;
}

/* Modal Container */
.modal-container {
  width: 90%; /* 90% of available content area width */
  max-width: 1400px;
  max-height: 90vh;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  font-family: 'Inter', -apple-system, sans-serif;
}

.close-btn {
  color: #6B7280;
  transition: color 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  padding: 4px;
}

.close-btn:hover {
  color: #111827;
}

/* Section Header */
.section-header {
  padding: 20px 24px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
  font-family: 'Inter', -apple-system, sans-serif;
}

.section-subtitle {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

/* Filters */
.filters-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  color: #111827;
  background: #FFFFFF;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #1E3A5F;
  box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
}

.reset-btn {
  padding: 6px 16px;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  border-color: #1E3A5F;
  color: #1E3A5F;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tab-description {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  padding: 12px 16px;
  background: #F9FAFB;
  border-left: 3px solid #1E3A5F;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: #9CA3AF;
  font-size: 15px;
}

.empty-state-note {
  margin-top: 12px;
  font-size: 13px;
  color: #6B7280;
  font-style: italic;
}

/* Posts Grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.source-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.source-card:hover {
  border-color: #1E3A5F;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.08);
}

.seed-card {
  border-left: 3px solid #10b981;
}

.similar-card {
  border-left: 3px solid #3b82f6;
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.seed-badge {
  padding: 4px 10px;
  background: #EFF6FF;
  color: #1E3A8A;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.post-number {
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.badges-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.company-badge,
.role-badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}

.company-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

.role-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.similarity-badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  white-space: nowrap;
}

.similarity-badge.very-high {
  background: #EFF6FF;
  color: #1E3A8A;
}

.similarity-badge.high {
  background: #DBEAFE;
  color: #1E40AF;
}

.similarity-badge.medium {
  background: #BFDBFE;
  color: #3B82F6;
}

.similarity-badge.low {
  background: #F3F4F6;
  color: #6B7280;
}

.card-body {
  padding: 16px;
  flex: 1;
}

.post-company {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.post-role,
.post-level {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 4px;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.4;
}

.post-excerpt {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
}

.skills-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.skills-label {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}

.skills-count {
  font-size: 12px;
  color: #1E3A5F;
  font-weight: 600;
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.view-btn {
  padding: 6px 16px;
  background: #1E3A5F;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #2C5282;
}

.outcome-tag {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: capitalize;
}

.outcome-success {
  background: #EFF6FF;
  color: #1E3A8A;
}

.outcome-failure {
  background: #FEE2E2;
  color: #991B1B;
}

.outcome-neutral {
  background: #F3F4F6;
  color: #6B7280;
}

.view-original-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #1E40AF;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.view-original-link:hover {
  color: #2563EB;
}

.link-icon {
  width: 14px;
  height: 14px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid #E5E7EB;
}

.page-btn {
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: #1E3A5F;
  color: #1E3A5F;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.footer-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6B7280;
}

.stat-item strong {
  color: #1E3A5F;
  font-weight: 700;
}

.stat-separator {
  color: #D1D5DB;
}

.close-modal-btn {
  padding: 10px 20px;
  background: #1E3A5F;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(30, 58, 95, 0.15);
  font-family: 'Inter', -apple-system, sans-serif;
}

.close-modal-btn:hover {
  background: #2C5282;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 95, 0.25);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }

  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
