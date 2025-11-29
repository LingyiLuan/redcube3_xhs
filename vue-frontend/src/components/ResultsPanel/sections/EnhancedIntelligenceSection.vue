<template>
  <!-- Enhanced Intelligence Section - McKinsey Style -->
  <section v-if="intelligence && intelligence.data_quality && intelligence.executive_summary" class="enhanced-intelligence-section">
    <!-- Section Header -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">Enhanced Intelligence</h2>
        <div class="data-badge">
          <span class="badge-text">Foundation: {{ intelligence.data_quality?.foundation_pool_size || 0 }} posts</span>
          <span class="badge-dot">•</span>
          <span class="badge-text">Coverage: {{ intelligence.data_quality?.extraction_coverage || '0' }}%</span>
          <span class="badge-dot">•</span>
          <span class="badge-text confidence-badge" :class="`confidence-${intelligence.data_quality?.statistical_confidence || 'low'}`">
            {{ (intelligence.data_quality?.statistical_confidence || 'low').toUpperCase() }} confidence
          </span>
        </div>
      </div>
    </div>

    <!-- Key Findings Cards (Most Important Insights) -->
    <div class="key-findings-grid">
      <div
        v-for="(finding, index) in intelligence.executive_summary.key_findings"
        :key="index"
        class="finding-card"
        :class="`category-${finding.category}`"
      >
        <div class="finding-header">
          <span class="category-icon">{{ getCategoryIcon(finding.category) }}</span>
          <span class="category-label">{{ formatCategory(finding.category) }}</span>
        </div>
        <div class="finding-content">
          <p class="finding-text">{{ finding.finding }}</p>
          <div class="benchmark-line">
            <span class="benchmark-icon">📈</span>
            <span class="benchmark-text">{{ finding.benchmark }}</span>
          </div>
          <div class="implication-box">
            <span class="implication-label">→</span>
            <span class="implication-text">{{ finding.implication }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Referral Intelligence (Highlight 3.4x Multiplier) -->
    <div v-if="intelligence.hiring_process?.referral_intelligence" class="intelligence-card referral-card">
      <div class="card-header">
        <h3 class="card-title">Referral Impact Analysis</h3>
        <div class="multiplier-badge">
          {{ intelligence.hiring_process.referral_intelligence.multiplier }} Multiplier
        </div>
      </div>
      <div class="card-content">
        <div class="comparison-bars">
          <div class="bar-row">
            <span class="bar-label">With Referral</span>
            <div class="bar-container">
              <div
                class="bar bar-referral"
                :style="{ width: `${intelligence.hiring_process.referral_intelligence.success_rate_with}%` }"
              >
                <span class="bar-value">{{ intelligence.hiring_process.referral_intelligence.success_rate_with }}%</span>
              </div>
            </div>
          </div>
          <div class="bar-row">
            <span class="bar-label">Without Referral</span>
            <div class="bar-container">
              <div
                class="bar bar-no-referral"
                :style="{ width: `${intelligence.hiring_process.referral_intelligence.success_rate_without}%` }"
              >
                <span class="bar-value">{{ intelligence.hiring_process.referral_intelligence.success_rate_without }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="insight-text">
          <p><strong>Strategic Implication:</strong> Referrals yield a {{ intelligence.hiring_process.referral_intelligence.multiplier }} advantage. Allocate 30% of prep time to networking—attend meetups, request informational interviews, and leverage LinkedIn connections.</p>
        </div>
      </div>
    </div>

    <!-- Top Rejection Reasons -->
    <div v-if="intelligence.rejection_analysis?.top_reasons" class="intelligence-card rejection-card">
      <div class="card-header">
        <h3 class="card-title">Top Rejection Drivers</h3>
        <span class="data-count">{{ intelligence.rejection_analysis.top_reasons.length }} patterns identified</span>
      </div>
      <div class="card-content">
        <div class="rejection-list">
          <div
            v-for="(reason, index) in intelligence.rejection_analysis.top_reasons.slice(0, 5)"
            :key="index"
            class="rejection-item"
            :class="`priority-${reason.priority_level}`"
          >
            <div class="rejection-header">
              <span class="rank-badge">#{{ index + 1 }}</span>
              <span class="reason-text">{{ reason.reason }}</span>
              <span class="frequency-badge">{{ reason.frequency }} cases</span>
            </div>
            <div class="mitigation-box">
              <span class="mitigation-label">Mitigation:</span>
              <span class="mitigation-text">{{ reason.mitigation_strategy }}</span>
            </div>
            <div class="companies-row" v-if="reason.top_companies && reason.top_companies.length > 0">
              <span class="companies-label">Companies:</span>
              <span class="companies-text">{{ reason.top_companies.slice(0, 3).join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Interview Questions -->
    <div v-if="intelligence.question_intelligence?.top_questions" class="intelligence-card questions-card">
      <div class="card-header">
        <h3 class="card-title">Most Asked Interview Questions</h3>
        <span class="data-count">{{ intelligence.question_intelligence.top_questions.length }} questions (2+ occurrences)</span>
      </div>
      <div class="card-content">
        <div class="questions-table">
          <div class="table-header">
            <div class="col-question">Question</div>
            <div class="col-frequency">Asked</div>
            <div class="col-difficulty">Difficulty</div>
            <div class="col-time">Avg Time</div>
            <div class="col-priority">Prep Priority</div>
          </div>
          <div
            v-for="(question, index) in intelligence.question_intelligence.top_questions.slice(0, 10)"
            :key="index"
            class="table-row"
            :class="`priority-${question.prep_priority}`"
          >
            <div class="col-question">
              <span class="question-text">{{ question.question }}</span>
              <div class="question-meta" v-if="question.common_mistake">
                <span class="meta-label">⚠️ Common Mistake:</span>
                <span class="meta-text">{{ question.common_mistake }}</span>
              </div>
            </div>
            <div class="col-frequency">{{ question.asked_count }}×</div>
            <div class="col-difficulty">
              <span class="difficulty-badge" :class="`difficulty-${question.difficulty}`">
                {{ question.difficulty }}
              </span>
            </div>
            <div class="col-time">{{ question.avg_time_minutes || 'N/A' }} min</div>
            <div class="col-priority">
              <span class="priority-badge" :class="`priority-${question.prep_priority}`">
                {{ question.prep_priority.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Quality Footer -->
    <div class="data-quality-footer">
      <div class="quality-metric">
        <span class="metric-label">Posts Analyzed:</span>
        <span class="metric-value">{{ intelligence.data_quality.posts_analyzed }}</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">Questions Analyzed:</span>
        <span class="metric-value">{{ intelligence.data_quality.questions_analyzed }}</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">Companies Covered:</span>
        <span class="metric-value">{{ intelligence.data_quality.companies_covered }}</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">Statistical Confidence:</span>
        <span class="metric-value confidence-value" :class="`confidence-${intelligence.data_quality.statistical_confidence}`">
          {{ intelligence.data_quality.statistical_confidence.toUpperCase() }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

interface Props {
  intelligence: any | null
}

const props = defineProps<Props>()

// DEBUG: Log intelligence data
console.log('[EnhancedIntelligenceSection] Received intelligence prop:', props.intelligence)
console.log('[EnhancedIntelligenceSection] Intelligence keys:', props.intelligence ? Object.keys(props.intelligence) : 'null')
console.log('[EnhancedIntelligenceSection] Has data_quality?:', !!props.intelligence?.data_quality)
console.log('[EnhancedIntelligenceSection] Has executive_summary?:', !!props.intelligence?.executive_summary)
if (props.intelligence) {
  console.log('[EnhancedIntelligenceSection] Data quality:', props.intelligence.data_quality)
  console.log('[EnhancedIntelligenceSection] Executive summary:', props.intelligence.executive_summary)
}
watch(() => props.intelligence, (newVal) => {
  console.log('[EnhancedIntelligenceSection] Intelligence changed:', newVal)
  if (newVal) {
    console.log('[EnhancedIntelligenceSection] Changed - keys:', Object.keys(newVal))
  }
}, { immediate: true })

// Helper functions
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    referral_advantage: '🎯',
    rejection_patterns: '🚫',
    question_frequency: '❓',
    timeline_insights: '⏱️',
    experience_insights: '👥',
    remote_work: '🏠',
    negotiation: '💰'
  }
  return icons[category] || '📊'
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<style scoped>
/* McKinsey-Style Professional Design */
.enhanced-intelligence-section {
  @apply mb-8 bg-white rounded-lg border border-gray-200;
}

/* Section Header */
.section-header {
  @apply px-6 py-4 border-b border-gray-200 bg-gray-50;
}

.header-content {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 m-0;
}

.data-badge {
  @apply flex items-center gap-2 text-sm text-gray-600;
}

.badge-dot {
  @apply text-gray-400;
}

.confidence-badge {
  @apply font-semibold px-2 py-0.5 rounded;
}

.confidence-badge.confidence-high {
  @apply bg-green-100 text-green-800;
}

.confidence-badge.confidence-medium {
  @apply bg-yellow-100 text-yellow-800;
}

.confidence-badge.confidence-low {
  @apply bg-red-100 text-red-800;
}

/* Key Findings Grid */
.key-findings-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6;
}

.finding-card {
  @apply border border-gray-200 rounded p-4 hover:shadow-md transition-shadow;
}

.finding-header {
  @apply flex items-center gap-2 mb-3 pb-2 border-b border-gray-100;
}

.category-icon {
  @apply text-xl;
}

.category-label {
  @apply text-xs font-semibold text-gray-600 uppercase tracking-wide;
}

.finding-content {
  @apply space-y-2;
}

.finding-text {
  @apply text-sm font-semibold text-gray-900 leading-tight;
}

.benchmark-line {
  @apply flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded;
}

.implication-box {
  @apply flex items-start gap-2 text-xs text-gray-700 mt-2;
}

.implication-label {
  @apply text-blue-600 font-bold;
}

/* Intelligence Cards */
.intelligence-card {
  @apply mx-6 mb-6 border border-gray-200 rounded-lg overflow-hidden;
}

.card-header {
  @apply flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200;
}

.card-title {
  @apply text-lg font-semibold text-gray-900 m-0;
}

.data-count {
  @apply text-sm text-gray-600;
}

.card-content {
  @apply p-4;
}

/* Referral Card */
.referral-card .multiplier-badge {
  @apply bg-green-600 text-white px-3 py-1 rounded font-bold text-sm;
}

.comparison-bars {
  @apply space-y-4 mb-4;
}

.bar-row {
  @apply flex items-center gap-4;
}

.bar-label {
  @apply text-sm font-medium text-gray-700 w-32;
}

.bar-container {
  @apply flex-1 bg-gray-100 rounded-full h-8 relative;
}

.bar {
  @apply h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500;
}

.bar-referral {
  @apply bg-green-500;
}

.bar-no-referral {
  @apply bg-gray-400;
}

.bar-value {
  @apply text-white text-sm font-semibold;
}

.insight-text {
  @apply text-sm text-gray-700 bg-blue-50 border-l-4 border-blue-500 p-3 rounded;
}

/* Rejection Card */
.rejection-list {
  @apply space-y-4;
}

.rejection-item {
  @apply border-l-4 pl-4 py-2;
}

.rejection-item.priority-critical {
  @apply border-red-500 bg-red-50;
}

.rejection-item.priority-high {
  @apply border-orange-500 bg-orange-50;
}

.rejection-item.priority-medium {
  @apply border-yellow-500 bg-yellow-50;
}

.rejection-header {
  @apply flex items-center gap-3 mb-2;
}

.rank-badge {
  @apply bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded;
}

.reason-text {
  @apply flex-1 text-sm font-semibold text-gray-900;
}

.frequency-badge {
  @apply bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded;
}

.mitigation-box {
  @apply flex gap-2 text-sm text-gray-700 mb-1;
}

.mitigation-label {
  @apply font-semibold text-gray-900;
}

.companies-row {
  @apply flex gap-2 text-xs text-gray-600;
}

.companies-label {
  @apply font-medium;
}

/* Questions Table */
.questions-table {
  @apply border border-gray-200 rounded overflow-hidden;
}

.table-header {
  @apply grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide;
}

.table-row {
  @apply grid grid-cols-12 gap-4 px-4 py-3 border-t border-gray-200 hover:bg-gray-50 transition-colors;
}

.col-question {
  @apply col-span-5;
}

.col-frequency {
  @apply col-span-1 text-center;
}

.col-difficulty {
  @apply col-span-2;
}

.col-time {
  @apply col-span-2 text-center;
}

.col-priority {
  @apply col-span-2 text-center;
}

.question-text {
  @apply text-sm font-medium text-gray-900;
}

.question-meta {
  @apply flex gap-2 mt-1 text-xs text-gray-600;
}

.meta-label {
  @apply font-semibold;
}

.difficulty-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.difficulty-badge.difficulty-easy {
  @apply bg-green-100 text-green-800;
}

.difficulty-badge.difficulty-medium {
  @apply bg-yellow-100 text-yellow-800;
}

.difficulty-badge.difficulty-hard {
  @apply bg-red-100 text-red-800;
}

.priority-badge {
  @apply px-2 py-1 rounded text-xs font-bold;
}

.priority-badge.priority-critical {
  @apply bg-red-600 text-white;
}

.priority-badge.priority-high {
  @apply bg-orange-500 text-white;
}

.priority-badge.priority-medium {
  @apply bg-yellow-500 text-white;
}

.priority-badge.priority-low {
  @apply bg-gray-400 text-white;
}

/* Data Quality Footer */
.data-quality-footer {
  @apply flex items-center justify-around px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm;
}

.quality-metric {
  @apply flex flex-col items-center gap-1;
}

.metric-label {
  @apply text-gray-600 text-xs;
}

.metric-value {
  @apply text-gray-900 font-semibold;
}

.confidence-value.confidence-high {
  @apply text-green-600;
}

.confidence-value.confidence-medium {
  @apply text-yellow-600;
}

.confidence-value.confidence-low {
  @apply text-red-600;
}
</style>
