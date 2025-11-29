<template>
  <!-- Your Interview Experience Section - Seed Post Only -->
  <section class="report-section your-interview-experience">
    <div class="section-header-with-badge">
      <h2 class="section-title">Your Interview Experience</h2>
      <DataSourceBadge type="personalized" />
    </div>
    <p class="section-subtitle personalized-subtitle">Analysis of your uploaded interview post</p>

    <!-- Narrative Block -->
    <div class="narrative-block">
      <p class="insight-text">
        Based on your interview experience{{ seedData.company ? ` at ${seedData.company}` : '' }}{{ seedData.role ? ` for the ${seedData.role} role` : '' }}, we've extracted key details to help you understand your preparation needs and compare with similar candidates.
      </p>
    </div>

    <!-- Compact Metadata -->
    <div class="metadata-compact">
      <span class="metadata-item">
        <span class="metadata-label">Company:</span>
        <span class="metadata-value">{{ seedData.company || 'Unknown' }}</span>
      </span>
      <span class="metadata-divider">|</span>
      <span class="metadata-item">
        <span class="metadata-label">Role:</span>
        <span class="metadata-value">{{ seedData.role || 'N/A' }}</span>
      </span>
      <span class="metadata-divider">|</span>
      <span class="metadata-item">
        <span class="metadata-label">Outcome:</span>
        <span class="metadata-value" :class="outcomeClass">{{ outcomeDisplay }}</span>
      </span>
    </div>

    <!-- Original Post Preview Box -->
    <div class="original-post-preview-box">
      <div class="preview-box-header">ORIGINAL POST PREVIEW</div>
      <p class="preview-box-text">{{ previewText }}</p>
      <a @click="showModal = true" class="view-full-link">View Original Post →</a>
    </div>

    <!-- Key Skills Section -->
    <div v-if="seedSkills.length > 0" class="subsection">
      <h3 class="subsection-title">Skills Identified in Your Interview</h3>
      <div class="skills-tag-cloud">
        <span
          v-for="(skill, idx) in seedSkills"
          :key="idx"
          class="skill-tag"
          :class="{ 'primary-skill': idx === 0 }">
          {{ skill }}
        </span>
      </div>
    </div>

    <!-- Questions Section - REMOVED due to low data quality (most showing "General") -->
    <!-- See commit history if restoration is needed -->

    <!-- Modal for Full Post -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Original Interview Post</h3>
            <button class="modal-close" @click="showModal = false">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-text">{{ seedData.original_text || 'No original post text available.' }}</p>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Question {
  question: string
  type?: string
  difficulty?: string
}

interface SeedData {
  company?: string
  role?: string
  difficulty?: string
  outcome?: string
  skills?: string[]
  interview_questions?: Question[]
  original_text?: string
}

interface Props {
  patterns: any
}

const props = defineProps<Props>()

const showModal = ref(false)

/**
 * Extract seed post data from patterns
 * Seed post is tagged with post_source: 'seed' in backend
 */
const seedData = computed((): SeedData => {
  // The seed data comes from the first analysis in patterns
  // Backend tags it with post_source: 'seed'
  if (!props.patterns) return {}

  // DEBUG: Log the received patterns object
  console.log('[YourInterviewExperience] 🔍 Full patterns object:', props.patterns)
  console.log('[YourInterviewExperience] 🔍 seed_company:', props.patterns.seed_company)
  console.log('[YourInterviewExperience] 🔍 seed_role:', props.patterns.seed_role)
  console.log('[YourInterviewExperience] 🔍 seed_skills:', props.patterns.seed_skills)
  console.log('[YourInterviewExperience] 🔍 seed_questions:', props.patterns.seed_questions)
  console.log('[YourInterviewExperience] 🔍 seed_original_text:', props.patterns.seed_original_text ? 'exists' : 'null')

  return {
    company: props.patterns.seed_company || props.patterns.company_trends?.[0]?.company,
    role: props.patterns.seed_role || props.patterns.role_trends?.[0]?.role,
    difficulty: props.patterns.seed_difficulty,
    outcome: props.patterns.seed_outcome,
    skills: props.patterns.seed_skills || [],
    interview_questions: props.patterns.seed_questions || [],
    original_text: props.patterns.seed_original_text || ''
  }
})

/**
 * Formatted difficulty display
 */
const difficultyDisplay = computed(() => {
  if (!seedData.value.difficulty) return 'Not specified'
  const difficultyMap: Record<string, string> = {
    'easy': '⭐ Easy',
    'medium': '⭐⭐ Medium',
    'hard': '⭐⭐⭐ Hard'
  }
  return difficultyMap[seedData.value.difficulty.toLowerCase()] || seedData.value.difficulty
})

/**
 * Outcome display formatting
 */
const outcomeDisplay = computed(() => {
  if (!seedData.value.outcome) return 'Not specified'
  const outcomeMap: Record<string, string> = {
    'accepted': 'Accepted',
    'rejected': 'Rejected',
    'pending': 'Pending',
    'offer': 'Offer Received'
  }
  return outcomeMap[seedData.value.outcome.toLowerCase()] || seedData.value.outcome
})

const outcomeIcon = computed(() => {
  const outcome = seedData.value.outcome?.toLowerCase()
  if (outcome === 'accepted' || outcome === 'offer') return '✅'
  if (outcome === 'rejected') return '❌'
  if (outcome === 'pending') return '⏳'
  return '📋'
})

const outcomeClass = computed(() => {
  const outcome = seedData.value.outcome?.toLowerCase()
  if (outcome === 'accepted' || outcome === 'offer') return 'outcome-success'
  if (outcome === 'rejected') return 'outcome-failure'
  if (outcome === 'pending') return 'outcome-pending'
  return ''
})

/**
 * Seed skills list
 */
const seedSkills = computed(() => {
  return seedData.value.skills || []
})

/**
 * Seed questions list
 */
const seedQuestions = computed(() => {
  return seedData.value.interview_questions || []
})

/**
 * Preview text with smart truncation (150-200 chars, complete sentence)
 */
const previewText = computed(() => {
  const text = seedData.value.original_text || 'No original post text available.'
  if (text.length <= 200) return text

  // Try to find a sentence ending within 150-200 chars
  const excerpt = text.substring(0, 200)
  const lastPeriod = excerpt.lastIndexOf('.')
  const lastQuestion = excerpt.lastIndexOf('?')
  const lastExclamation = excerpt.lastIndexOf('!')

  const sentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)

  if (sentenceEnd > 100) {
    // Found a sentence ending, use it
    return text.substring(0, sentenceEnd + 1) + '..'
  }

  // No sentence ending found, truncate at 150 chars
  return text.substring(0, 150).trim() + '...'
})

/**
 * Get question type CSS class
 */
function getQuestionTypeClass(type: string): string {
  if (!type) return 'general'
  const typeMap: Record<string, string> = {
    'coding': 'coding',
    'system design': 'system',
    'behavioral': 'behavioral',
    'technical': 'technical',
    'general': 'general'
  }
  return typeMap[type.toLowerCase()] || 'general'
}
</script>

<style scoped>
/* Section Header with Badge */
.section-header-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.personalized-subtitle {
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin-bottom: 24px;
  font-weight: 500;
}

/* Your Interview Experience Section */
.your-interview-experience {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-10);
}

/* Compact Metadata */
.metadata-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  font-size: 14px;
  color: #374151;
}

.metadata-item {
  display: inline-flex;
  gap: 4px;
}

.metadata-label {
  font-weight: 500;
  color: #6B7280;
}

.metadata-value {
  font-weight: 600;
  color: #1F2937;
}

.metadata-value.outcome-success {
  color: #059669;
}

.metadata-value.outcome-failure {
  color: #DC2626;
}

.metadata-value.outcome-pending {
  color: #D97706;
}

.metadata-divider {
  color: #D1D5DB;
}

/* Original Post Preview Box */
.original-post-preview-box {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 16px;
  margin: 24px 0;
}

.preview-box-header {
  font-size: 10px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.preview-box-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
  white-space: pre-wrap;
}

.view-full-link {
  font-size: 13px;
  color: #2563EB;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s ease;
}

.view-full-link:hover {
  color: #1E40AF;
  text-decoration: underline;
}

/* Subsections */
.subsection {
  margin-top: var(--spacing-8);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-border-light);
}

.subsection-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
}

/* Skills Tag Cloud */
.skills-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.skill-tag {
  display: inline-block;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-accent-blue-lightest);
  color: var(--color-primary);
  border: 1px solid var(--color-accent-blue-light);
  border-radius: var(--radius-base);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-fast);
}

.skill-tag:hover {
  background: var(--color-accent-blue-light);
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.skill-tag.primary-skill {
  background: var(--color-primary);
  color: var(--color-bg-primary);
  border-color: var(--color-primary-dark);
  font-weight: var(--font-weight-bold);
}

/* Questions List */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.question-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  transition: var(--transition-fast);
}

.question-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-sm);
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.question-type-badge {
  display: inline-block;
  padding: 4px var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--radius-sm);
}

.question-type-badge.type-coding {
  background: #DBEAFE;
  color: #1E40AF;
}

.question-type-badge.type-system {
  background: #D1FAE5;
  color: #065F46;
}

.question-type-badge.type-behavioral {
  background: #FEF3C7;
  color: #92400E;
}

.question-type-badge.type-technical {
  background: #E0E7FF;
  color: #3730A3;
}

.question-type-badge.type-general {
  background: var(--color-bg-quaternary);
  color: var(--color-text-secondary);
}

.difficulty-badge {
  display: inline-block;
  padding: 4px var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-sm);
}

.difficulty-badge.difficulty-easy {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.difficulty-badge.difficulty-medium {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.difficulty-badge.difficulty-hard {
  background: var(--color-error-light);
  color: var(--color-error-dark);
}

.question-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* Modal Styles */
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
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #6B7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background-color: #F3F4F6;
  color: #1F2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

/* Modal fade animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}

/* Responsive Design */
@media (max-width: 768px) {
  .metadata-compact {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .metadata-divider {
    display: none;
  }

  .your-interview-experience {
    padding: var(--spacing-4);
  }

  .subsection-title {
    font-size: var(--font-size-3xl);
  }

  .modal-content {
    max-width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
