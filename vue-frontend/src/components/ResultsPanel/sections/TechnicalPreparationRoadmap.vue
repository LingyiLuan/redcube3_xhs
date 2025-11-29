<template>
  <!-- Technical Preparation Roadmap - McKinsey Professional Style -->
  <section v-if="hasData" class="technical-roadmap">
    <!-- Section Header -->
    <div class="section-header">
      <h2 class="section-title">Technical Preparation Roadmap</h2>
      <div class="data-attribution">
        Based on {{ totalPosts }} interview experiences
      </div>
    </div>

    <!-- Skills Prioritization Framework (Priority Table) -->
    <div v-if="skillsData.length > 0" class="roadmap-card">
      <div class="card-header">
        <h3 class="card-title">Skills Prioritization Framework</h3>
        <span class="data-count">{{ skillsData.length }} skills analyzed</span>
      </div>
      <div class="card-content">
        <!-- CRITICAL FOCUS (Master First) -->
        <div v-if="criticalSkills.length > 0" class="priority-section">
          <div class="priority-section-header critical">
            <span class="priority-label">CRITICAL FOCUS</span>
            <span class="priority-subtitle">Master First</span>
          </div>
          <div class="skills-table">
            <div class="table-header">
              <div class="col-skill">Skill</div>
              <div class="col-mentions">Mentions</div>
              <div class="col-difficulty">Difficulty</div>
              <div class="col-percentage">Coverage</div>
            </div>
            <div
              v-for="(skill, index) in criticalSkills"
              :key="index"
              class="table-row priority-critical"
            >
              <div class="col-skill">{{ skill.name }}</div>
              <div class="col-mentions">{{ skill.frequency }}</div>
              <div class="col-difficulty">
                <div class="difficulty-bar-container">
                  <div class="difficulty-bar" :style="{ width: `${(skill.difficulty / 3) * 100}%` }"></div>
                </div>
                <span class="difficulty-label">{{ getDifficultyLabel(skill.difficulty) }}</span>
              </div>
              <div class="col-percentage">{{ skill.percentage }}%</div>
            </div>
          </div>
        </div>

        <!-- HIGH PRIORITY (Build Proficiency) -->
        <div v-if="highPrioritySkills.length > 0" class="priority-section">
          <div class="priority-section-header high">
            <span class="priority-label">HIGH PRIORITY</span>
            <span class="priority-subtitle">Build Proficiency</span>
          </div>
          <div class="skills-table">
            <div class="table-header">
              <div class="col-skill">Skill</div>
              <div class="col-mentions">Mentions</div>
              <div class="col-difficulty">Difficulty</div>
              <div class="col-percentage">Coverage</div>
            </div>
            <div
              v-for="(skill, index) in highPrioritySkills"
              :key="index"
              class="table-row priority-high"
            >
              <div class="col-skill">{{ skill.name }}</div>
              <div class="col-mentions">{{ skill.frequency }}</div>
              <div class="col-difficulty">
                <div class="difficulty-bar-container">
                  <div class="difficulty-bar" :style="{ width: `${(skill.difficulty / 3) * 100}%` }"></div>
                </div>
                <span class="difficulty-label">{{ getDifficultyLabel(skill.difficulty) }}</span>
              </div>
              <div class="col-percentage">{{ skill.percentage }}%</div>
            </div>
          </div>
        </div>

        <!-- BASELINE (Maintain Competency) -->
        <div v-if="baselineSkills.length > 0" class="priority-section">
          <div class="priority-section-header baseline">
            <span class="priority-label">BASELINE</span>
            <span class="priority-subtitle">Maintain Competency</span>
          </div>
          <div class="skills-table">
            <div class="table-header">
              <div class="col-skill">Skill</div>
              <div class="col-mentions">Mentions</div>
              <div class="col-difficulty">Difficulty</div>
              <div class="col-percentage">Coverage</div>
            </div>
            <div
              v-for="(skill, index) in baselineSkills"
              :key="index"
              class="table-row priority-baseline"
            >
              <div class="col-skill">{{ skill.name }}</div>
              <div class="col-mentions">{{ skill.frequency }}</div>
              <div class="col-difficulty">
                <div class="difficulty-bar-container">
                  <div class="difficulty-bar" :style="{ width: `${(skill.difficulty / 3) * 100}%` }"></div>
                </div>
                <span class="difficulty-label">{{ getDifficultyLabel(skill.difficulty) }}</span>
              </div>
              <div class="col-percentage">{{ skill.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Interview Questions (Compact Table) -->
    <div v-if="topQuestions.length > 0" class="roadmap-card">
      <div class="card-header">
        <h3 class="card-title">Top Interview Questions</h3>
        <span class="data-count">{{ topQuestions.length }} questions (2+ occurrences)</span>
      </div>
      <div class="card-content">
        <div class="questions-table">
          <div class="table-header">
            <div class="col-question">Question</div>
            <div class="col-asked">Asked</div>
            <div class="col-difficulty">Difficulty</div>
            <div class="col-time">Avg Time</div>
            <div class="col-priority">Priority</div>
          </div>
          <div
            v-for="(question, index) in topQuestions.slice(0, 10)"
            :key="index"
            class="table-row"
            :class="`priority-${question.prep_priority || 'medium'}`"
          >
            <div class="col-question">
              <span class="question-text">{{ question.question }}</span>
            </div>
            <div class="col-asked">{{ question.asked_count }}×</div>
            <div class="col-difficulty">
              <span class="difficulty-stars">{{ getDifficultyStars(question.difficulty) }}</span>
            </div>
            <div class="col-time">{{ question.avg_time_minutes || 'N/A' }} min</div>
            <div class="col-priority">
              <span class="priority-badge" :class="`priority-${question.prep_priority || 'medium'}`">
                {{ (question.prep_priority || 'MED').toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Categories Distribution -->
    <div v-if="questionCategories.length > 0" class="roadmap-card">
      <div class="card-header">
        <h3 class="card-title">Question Category Distribution</h3>
        <span class="data-count">{{ questionCategories.length }} categories</span>
      </div>
      <div class="card-content">
        <div class="category-bars">
          <div v-for="(category, index) in questionCategories.slice(0, 6)" :key="index" class="category-bar-row">
            <span class="category-label">{{ category.name }}</span>
            <div class="category-bar-container">
              <div class="category-bar" :style="{ width: `${category.percentage}%` }">
                <span class="category-value">{{ category.percentage }}%</span>
              </div>
            </div>
            <span class="category-count">{{ category.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Insufficient Data Message -->
  <section v-else class="insufficient-data">
    <h2 class="section-title">Technical Preparation Roadmap</h2>
    <p class="message">Insufficient data for technical analysis (minimum data required)</p>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'

interface Props {
  intelligence: any | null
  patterns: any
}

const props = defineProps<Props>()

// Check if we have sufficient data
const hasData = computed(() => {
  return (props.patterns?.skill_frequency && props.patterns.skill_frequency.length > 0) ||
         (props.intelligence?.question_intelligence?.top_questions && props.intelligence.question_intelligence.top_questions.length > 0)
})

const totalPosts = computed(() => {
  return props.patterns?.summary?.total_posts_analyzed || 0
})

// Skills data for matrix (from patterns.skill_frequency)
const skillsData = computed(() => {
  if (!props.patterns?.skill_frequency) return []

  return props.patterns.skill_frequency.slice(0, 12).map((skill: any) => {
    const frequency = parseInt(skill.count) || 0
    const difficultyMap: { [key: string]: number } = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    }
    const difficulty = difficultyMap[skill.avg_difficulty?.toLowerCase()] || 2

    // Calculate priority based on frequency and difficulty
    let priority = 'medium'
    if (frequency > 10 && difficulty >= 2) {
      priority = 'critical'
    } else if (frequency > 5 || difficulty === 3) {
      priority = 'high'
    }

    return {
      name: skill.skill,
      frequency,
      difficulty,
      priority,
      percentage: parseFloat(skill.percentage) || 0
    }
  })
})

// Group skills by priority tier
const criticalSkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'critical')
})

const highPrioritySkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'high')
})

const baselineSkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'medium')
})

// Top questions from enhanced intelligence
const topQuestions = computed(() => {
  return props.intelligence?.question_intelligence?.top_questions || []
})

// Question categories distribution
const questionCategories = computed(() => {
  if (!props.patterns?.interview_questions_analysis?.category_breakdown) return []

  const categories = props.patterns.interview_questions_analysis.category_breakdown
  const total = categories.reduce((sum: number, cat: any) => sum + (cat.count || 0), 0)

  return categories
    .map((cat: any) => ({
      name: cat.category || 'Other',
      count: cat.count || 0,
      percentage: total > 0 ? Math.round(((cat.count || 0) / total) * 100) : 0
    }))
    .sort((a: any, b: any) => b.count - a.count)
})

// Helper function for difficulty label
function getDifficultyLabel(difficulty: number): string {
  if (difficulty === 1) return 'Easy'
  if (difficulty === 2) return 'Medium'
  if (difficulty === 3) return 'Hard'
  return 'Medium'
}

// Helper function for difficulty stars (⭐ only)
function getDifficultyStars(difficulty: string): string {
  const difficultyMap: { [key: string]: string } = {
    'easy': '⭐',
    'medium': '⭐⭐',
    'hard': '⭐⭐⭐'
  }
  return difficultyMap[difficulty?.toLowerCase()] || '⭐⭐'
}
</script>

<style scoped>
/* McKinsey Professional Styling - NO Web 2.0 */

/* Section Container */
.technical-roadmap {
  @apply mb-8 bg-white rounded border border-gray-200;
}

.insufficient-data {
  @apply mb-8 bg-white rounded border border-gray-200 p-6;
}

.message {
  @apply text-gray-600 text-sm mt-2;
}

/* Section Header */
.section-header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 m-0 mb-1;
}

.data-attribution {
  @apply text-xs text-gray-600;
}

/* Roadmap Cards */
.roadmap-card {
  @apply mx-6 my-6 border border-gray-200 rounded overflow-hidden;
}

.card-header {
  @apply flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200;
}

.card-title {
  @apply text-base font-semibold text-gray-900 m-0;
}

.data-count {
  @apply text-xs text-gray-600;
}

.card-content {
  @apply p-4;
}

/* Skills Prioritization Framework */
.priority-section {
  @apply mb-6;
}

.priority-section:last-child {
  @apply mb-0;
}

.priority-section-header {
  @apply flex items-baseline gap-2 px-4 py-2 border-l-4 mb-3;
}

.priority-section-header.critical {
  @apply bg-blue-50 border-blue-600;
}

.priority-section-header.high {
  @apply bg-blue-50 border-blue-400;
}

.priority-section-header.baseline {
  @apply bg-gray-50 border-gray-400;
}

.priority-label {
  @apply text-sm font-bold text-gray-900 uppercase tracking-wide;
}

.priority-subtitle {
  @apply text-xs text-gray-600;
}

/* Skills Table */
.skills-table {
  @apply border border-gray-200 rounded overflow-hidden;
}

.skills-table .table-header {
  @apply grid grid-cols-12 gap-3 bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide;
}

.skills-table .table-row {
  @apply grid grid-cols-12 gap-3 px-4 py-3 border-t border-gray-200;
}

.skills-table .table-row.priority-critical {
  @apply bg-blue-50;
}

.skills-table .table-row.priority-high {
  @apply bg-blue-50;
}

.skills-table .table-row.priority-baseline {
  @apply bg-white;
}

.skills-table .col-skill {
  @apply col-span-4 text-sm font-medium text-gray-900;
}

.skills-table .col-mentions {
  @apply col-span-2 text-sm text-gray-700 text-center;
}

.skills-table .col-difficulty {
  @apply col-span-4 flex items-center gap-2;
}

.skills-table .col-percentage {
  @apply col-span-2 text-sm text-gray-700 text-right font-semibold;
}

.difficulty-bar-container {
  @apply flex-1 bg-gray-200 rounded h-5 overflow-hidden;
}

.difficulty-bar {
  @apply h-full bg-gray-600 transition-all duration-500;
}

.difficulty-label {
  @apply text-xs text-gray-600 font-medium w-12;
}

/* Questions Table */
.questions-table {
  @apply border border-gray-200 rounded overflow-hidden;
}

.table-header {
  @apply grid grid-cols-12 gap-2 bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide;
}

.table-row {
  @apply grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-200 hover:bg-gray-50 transition-colors;
}

.table-row:nth-child(even) {
  @apply bg-gray-50;
}

.col-question {
  @apply col-span-5;
}

.col-asked {
  @apply col-span-1 text-center;
}

.col-difficulty {
  @apply col-span-2 text-center;
}

.col-time {
  @apply col-span-2 text-center;
}

.col-priority {
  @apply col-span-2 text-center;
}

.question-text {
  @apply text-sm text-gray-900 font-medium;
}

.difficulty-stars {
  @apply text-sm;
}

.priority-badge {
  @apply px-2 py-1 rounded text-xs font-bold;
}

.priority-badge.priority-critical {
  @apply bg-blue-600 text-white;
}

.priority-badge.priority-high {
  @apply bg-blue-500 text-white;
}

.priority-badge.priority-medium {
  @apply bg-blue-400 text-white;
}

.priority-badge.priority-low {
  @apply bg-gray-400 text-white;
}

/* Category Bars */
.category-bars {
  @apply space-y-3;
}

.category-bar-row {
  @apply grid grid-cols-12 gap-3 items-center;
}

.category-label {
  @apply col-span-3 text-sm font-medium text-gray-700;
}

.category-bar-container {
  @apply col-span-8 bg-gray-100 rounded h-6 relative overflow-hidden;
}

.category-bar {
  @apply h-full bg-blue-500 flex items-center justify-end pr-2 transition-all duration-500;
}

.category-value {
  @apply text-white text-xs font-semibold;
}

.category-count {
  @apply col-span-1 text-sm text-gray-600 text-right;
}
</style>
