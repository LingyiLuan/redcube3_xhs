<script setup lang="ts">
import { computed, ref } from 'vue'
import { Building2, Briefcase, TrendingUp, BookOpen, Lightbulb, List, Target, Calendar, Award, ChevronDown, ChevronRight } from 'lucide-vue-next'

interface Props {
  result: any // Analysis result from backend
}

const props = defineProps<Props>()

const sectionsExpanded = ref({
  overview: true,
  details: true,
  insights: true,
  timeline: true
})

function toggleSection(section: keyof typeof sectionsExpanded.value) {
  sectionsExpanded.value[section] = !sectionsExpanded.value[section]
}

// Extract data from backend response
const company = computed(() => props.result?.company || 'Not specified')
const role = computed(() => props.result?.role || 'Not specified')
const sentiment = computed(() => props.result?.sentiment || 'neutral')
const industry = computed(() => props.result?.industry || 'Not specified')
const experienceLevel = computed(() => props.result?.experience_level || 'Not specified')
const interviewTopics = computed(() => props.result?.interview_topics || [])
const keyInsights = computed(() => props.result?.key_insights || [])
const preparationMaterials = computed(() => props.result?.preparation_materials || [])
const interviewStages = computed(() => props.result?.interview_stages || [])
const difficultyLevel = computed(() => props.result?.difficulty_level || 'Not specified')
const timeline = computed(() => props.result?.timeline || 'Not specified')
const outcome = computed(() => props.result?.outcome || 'unknown')

// Sentiment styling
const sentimentColor = computed(() => {
  switch (sentiment.value.toLowerCase()) {
    case 'positive':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
    case 'negative':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
})

// Outcome styling
const outcomeColor = computed(() => {
  switch (outcome.value.toLowerCase()) {
    case 'passed':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
    case 'failed':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
})

// Difficulty styling
const difficultyColor = computed(() => {
  switch (difficultyLevel.value.toLowerCase()) {
    case 'easy':
      return 'text-green-600 dark:text-green-400'
    case 'hard':
      return 'text-red-600 dark:text-red-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
})
</script>

<template>
  <div class="results-panel">
    <!-- Overview Section -->
    <div class="result-section">
      <button @click="toggleSection('overview')" class="section-header">
        <component :is="sectionsExpanded.overview ? ChevronDown : ChevronRight" :size="16" />
        <Building2 :size="16" />
        <span>Overview</span>
      </button>
      <div v-if="sectionsExpanded.overview" class="section-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">
              <Building2 :size="14" />
              Company
            </div>
            <div class="info-value">{{ company }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <Briefcase :size="14" />
              Role
            </div>
            <div class="info-value">{{ role }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <TrendingUp :size="14" />
              Sentiment
            </div>
            <span :class="['badge', sentimentColor]">{{ sentiment }}</span>
          </div>
          <div class="info-item">
            <div class="info-label">
              <Target :size="14" />
              Industry
            </div>
            <div class="info-value">{{ industry }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <Award :size="14" />
              Experience Level
            </div>
            <div class="info-value">{{ experienceLevel }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <Calendar :size="14" />
              Outcome
            </div>
            <span :class="['badge', outcomeColor]">{{ outcome }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Interview Details Section -->
    <div v-if="interviewTopics.length > 0 || interviewStages.length > 0" class="result-section">
      <button @click="toggleSection('details')" class="section-header">
        <component :is="sectionsExpanded.details ? ChevronDown : ChevronRight" :size="16" />
        <List :size="16" />
        <span>Interview Details</span>
      </button>
      <div v-if="sectionsExpanded.details" class="section-content">
        <!-- Interview Topics -->
        <div v-if="interviewTopics.length > 0" class="detail-subsection">
          <h4 class="subsection-title">Topics Covered</h4>
          <div class="tags-grid">
            <span v-for="(topic, index) in interviewTopics" :key="index" class="tag">
              {{ topic }}
            </span>
          </div>
        </div>

        <!-- Interview Stages -->
        <div v-if="interviewStages.length > 0" class="detail-subsection">
          <h4 class="subsection-title">Interview Stages</h4>
          <ul class="stages-list">
            <li v-for="(stage, index) in interviewStages" :key="index" class="stage-item">
              <span class="stage-number">{{ index + 1 }}</span>
              {{ stage }}
            </li>
          </ul>
        </div>

        <!-- Difficulty & Timeline -->
        <div class="detail-subsection">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Difficulty</div>
              <span :class="['difficulty-badge', difficultyColor]">
                {{ difficultyLevel }}
              </span>
            </div>
            <div class="info-item">
              <div class="info-label">Timeline</div>
              <div class="info-value">{{ timeline }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Insights Section -->
    <div v-if="keyInsights.length > 0" class="result-section">
      <button @click="toggleSection('insights')" class="section-header">
        <component :is="sectionsExpanded.insights ? ChevronDown : ChevronRight" :size="16" />
        <Lightbulb :size="16" />
        <span>Key Insights</span>
        <span class="badge">{{ keyInsights.length }}</span>
      </button>
      <div v-if="sectionsExpanded.insights" class="section-content">
        <ul class="insights-list">
          <li v-for="(insight, index) in keyInsights" :key="index" class="insight-item">
            <span class="insight-bullet">💡</span>
            {{ insight }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Preparation Materials Section -->
    <div v-if="preparationMaterials.length > 0" class="result-section">
      <button @click="toggleSection('timeline')" class="section-header">
        <component :is="sectionsExpanded.timeline ? ChevronDown : ChevronRight" :size="16" />
        <BookOpen :size="16" />
        <span>Preparation Materials</span>
        <span class="badge">{{ preparationMaterials.length }}</span>
      </button>
      <div v-if="sectionsExpanded.timeline" class="section-content">
        <ul class="materials-list">
          <li v-for="(material, index) in preparationMaterials" :key="index" class="material-item">
            <span class="material-bullet">📚</span>
            {{ material }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!result" class="empty-state">
      <TrendingUp :size="48" class="empty-icon" />
      <p class="empty-text">No analysis results available</p>
    </div>
  </div>
</template>

<style scoped>
.results-panel {
  @apply space-y-3;
}

.result-section {
  @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.section-header {
  @apply w-full flex items-center gap-2 px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.section-content {
  @apply px-4 pb-4;
}

.info-grid {
  @apply grid grid-cols-2 gap-3;
}

.info-item {
  @apply flex flex-col gap-1;
}

.info-label {
  @apply flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400;
}

.info-value {
  @apply text-sm text-gray-900 dark:text-gray-100 font-medium;
}

.badge {
  @apply inline-flex items-center px-2 py-1 text-xs font-semibold rounded;
}

.difficulty-badge {
  @apply font-semibold text-sm;
}

.detail-subsection {
  @apply mb-4 last:mb-0;
}

.subsection-title {
  @apply text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2;
}

.tags-grid {
  @apply flex flex-wrap gap-2;
}

.tag {
  @apply inline-flex items-center px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full;
}

.stages-list {
  @apply space-y-2;
}

.stage-item {
  @apply flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300;
}

.stage-number {
  @apply flex-shrink-0 w-5 h-5 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold;
}

.insights-list {
  @apply space-y-2;
}

.insight-item {
  @apply flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.insight-bullet {
  @apply flex-shrink-0 text-base;
}

.materials-list {
  @apply space-y-2;
}

.material-item {
  @apply flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300;
}

.material-bullet {
  @apply flex-shrink-0 text-base;
}

.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-3;
}

.empty-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}
</style>
