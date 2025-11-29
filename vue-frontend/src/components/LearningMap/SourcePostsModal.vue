<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <h2 class="modal-title">
              Source Posts ({{ posts.length }})
            </h2>
            <button @click="close" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="modal-body">
            <div v-if="posts.length === 0" class="empty-state">
              <p>No source posts available</p>
            </div>

            <div v-else class="posts-list">
              <div
                v-for="post in sortedPosts"
                :key="post.post_id"
                class="post-card"
              >
                <!-- Post Header -->
                <div class="post-header">
                  <div class="post-meta">
                    <span v-if="post.company" class="company-badge">
                      {{ post.company }}
                    </span>
                    <span v-if="post.role_type" class="role-badge">
                      {{ post.role_type }}
                    </span>
                    <span v-if="post.level" class="level-badge">
                      {{ post.level }}
                    </span>
                  </div>
                  <div class="similarity-score">
                    <span class="similarity-label">Relevance:</span>
                    <span class="similarity-value">{{ formatSimilarity(post.similarity) }}%</span>
                  </div>
                </div>

                <!-- Post Title -->
                <h3 class="post-title">{{ post.title }}</h3>

                <!-- Post Excerpt -->
                <p v-if="post.excerpt" class="post-excerpt">
                  {{ post.excerpt }}
                </p>

                <!-- Post Footer -->
                <div class="post-footer">
                  <span v-if="post.outcome" class="outcome-badge" :class="getOutcomeClass(post.outcome)">
                    {{ post.outcome }}
                  </span>
                  <a
                    v-if="post.url"
                    :href="post.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-original-btn"
                  >
                    View Original Post
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" class="inline-block ml-1">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button @click="close" class="cancel-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SourcePost {
  post_id: string
  title: string
  company?: string
  role_type?: string
  level?: string
  outcome?: string
  similarity?: number
  excerpt?: string
  url?: string
}

interface Props {
  isOpen: boolean
  posts: SourcePost[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const sortedPosts = computed(() => {
  return [...props.posts].sort((a, b) => {
    const simA = a.similarity || 0
    const simB = b.similarity || 0
    return simB - simA // Highest similarity first
  })
})

function close() {
  emit('close')
}

function formatSimilarity(similarity?: number): string {
  if (!similarity) return '0'
  return ((1 - similarity) * 100).toFixed(0) // Convert distance to similarity
}

function getOutcomeClass(outcome: string): string {
  const lower = outcome.toLowerCase()
  if (lower.includes('pass') || lower.includes('offer') || lower.includes('accept')) {
    return 'outcome-success'
  }
  if (lower.includes('fail') || lower.includes('reject')) {
    return 'outcome-failure'
  }
  return 'outcome-neutral'
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Modal Container */
.modal-container {
  width: 100%;
  max-width: 4xl;
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

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6B7280;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Post Card */
.post-card {
  padding: 20px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.post-card:hover {
  border-color: #1E3A5F;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.06);
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.company-badge,
.role-badge,
.level-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.company-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

.role-badge {
  background: #D1FAE5;
  color: #065F46;
  border: 1px solid #6EE7B7;
}

.level-badge {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.similarity-score {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.similarity-label {
  color: #6B7280;
  font-weight: 500;
}

.similarity-value {
  font-weight: 700;
  color: #1E3A5F;
  font-family: 'Inter', -apple-system, sans-serif;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.5;
  font-family: 'Inter', -apple-system, sans-serif;
}

.post-excerpt {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
}

.outcome-badge {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.outcome-success {
  background: #D1FAE5;
  color: #065F46;
  border: 1px solid #6EE7B7;
}

.outcome-failure {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
}

.outcome-neutral {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.view-original-btn {
  font-size: 13px;
  color: #1E40AF;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  font-weight: 500;
}

.view-original-btn:hover {
  color: #2563EB;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
}

.cancel-btn {
  padding: 10px 20px;
  background: #1E3A5F;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-family: 'Inter', -apple-system, sans-serif;
  box-shadow: 0 2px 4px rgba(30, 58, 95, 0.15);
}

.cancel-btn:hover {
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
</style>
