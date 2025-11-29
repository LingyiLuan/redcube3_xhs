<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <!-- Close Button -->
          <button class="modal-close" @click="$emit('close')" aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Modal Header -->
          <div class="modal-header">
            <h2 class="modal-title">Interview Experience at {{ post.company }}</h2>
            <p class="modal-subtitle">{{ post.role }}</p>
          </div>

          <!-- Interview Overview Section -->
          <div class="overview-section">
            <h3 class="section-label">INTERVIEW OVERVIEW</h3>
            <div class="overview-grid">
              <div class="overview-item">
                <div class="overview-label">Outcome</div>
                <div class="overview-value">
                  <span :class="['outcome-badge', `outcome-${post.outcome}`]">
                    {{ post.outcomeText }}
                  </span>
                </div>
              </div>
              <div class="overview-item">
                <div class="overview-label">Timeline</div>
                <div class="overview-value">{{ post.timeline || 'Not specified' }}</div>
              </div>
              <div class="overview-item">
                <div class="overview-label">Difficulty</div>
                <div class="overview-value">{{ post.difficulty || 'Not specified' }}</div>
              </div>
              <div class="overview-item">
                <div class="overview-label">Posted</div>
                <div class="overview-value">{{ formatDate(post.date) }}</div>
              </div>
            </div>
          </div>

          <!-- Technical Skills Section -->
          <div v-if="post.skills && post.skills.length > 0 && post.skills[0] !== 'Not specified'" class="skills-section">
            <h3 class="section-label">TECHNICAL SKILLS</h3>
            <div class="skills-list">
              <span v-for="skill in post.skills" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Original Post Content -->
          <div class="post-content-section">
            <h3 class="section-label">ORIGINAL POST</h3>
            <div class="post-content">
              {{ post.originalText }}
            </div>
          </div>

          <!-- View Original Source Button (only for real Reddit URLs from database) -->
          <div v-if="isRealRedditPost" class="modal-footer">
            <a
              :href="post.url"
              target="_blank"
              rel="noopener noreferrer"
              class="source-link"
            >
              View Original Source
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'

interface Post {
  company: string
  role: string
  outcome: string
  outcomeText: string
  date: string
  skills: string[]
  originalText: string
  url?: string
  timeline?: string
  difficulty?: string
}

const props = defineProps<{
  show: boolean
  post: Post
}>()

const emit = defineEmits<{
  close: []
}>()

/**
 * Check if this is a real Reddit post from our database
 * (not a mock/workflow post with temporary content)
 */
const isRealRedditPost = computed(() => {
  if (!props.post.url) return false

  // Check if URL is a valid Reddit URL (contains reddit.com and /comments/)
  return props.post.url.includes('reddit.com') && props.post.url.includes('/comments/')
})

function handleOverlayClick() {
  emit('close')
}

function handleEscKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

/* Modal Container */
.modal-container {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
}

/* Close Button */
.modal-close {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #F3F4F6;
  color: #1F2937;
}

/* Modal Header */
.modal-header {
  margin-bottom: 32px;
  padding-right: 40px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.modal-subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
  line-height: 1.4;
}

/* Section Labels */
.section-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #2563EB;
  margin: 0 0 16px 0;
}

/* Overview Section */
.overview-section {
  margin-bottom: 32px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
}

.overview-value {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
}

/* Outcome Badges */
.outcome-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.outcome-badge.outcome-passed,
.outcome-badge.outcome-success {
  background-color: #D1FAE5;
  color: #065F46;
}

.outcome-badge.outcome-failed,
.outcome-badge.outcome-rejected {
  background-color: #FEE2E2;
  color: #991B1B;
}

.outcome-badge.outcome-pending {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.outcome-badge.outcome-unknown {
  background-color: #E5E7EB;
  color: #374151;
}

/* Skills Section */
.skills-section {
  margin-bottom: 32px;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  display: inline-block;
  padding: 6px 12px;
  background: #EFF6FF;
  color: #1E40AF;
  border: 1px solid #DBEAFE;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

/* Post Content Section */
.post-content-section {
  margin-bottom: 32px;
}

.post-content {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Custom Scrollbar */
.post-content::-webkit-scrollbar {
  width: 8px;
}

.post-content::-webkit-scrollbar-track {
  background: #F3F4F6;
  border-radius: 4px;
}

.post-content::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 4px;
}

.post-content::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #2563EB;
  color: #FFFFFF;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.source-link:hover {
  background: #1D4ED8;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.source-link svg {
  flex-shrink: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    padding: 24px;
  }

  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-title {
    font-size: 18px;
  }

  .modal-subtitle {
    font-size: 14px;
  }
}

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
