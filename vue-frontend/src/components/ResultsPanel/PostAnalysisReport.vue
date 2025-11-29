<template>
  <div class="post-analysis-report">
    <!-- Post Summary Section -->
    <div class="analysis-section">
      <h3 class="section-title">📄 Post Summary</h3>
      <div class="post-summary-card">
        <h4 class="post-title">{{ analysis.post_summary.title }}</h4>

        <div class="meta-grid">
          <div class="meta-item" v-if="analysis.post_summary.company">
            <span class="meta-label">🏢 Company</span>
            <span class="meta-value">{{ analysis.post_summary.company }}</span>
          </div>
          <div class="meta-item" v-if="analysis.post_summary.role">
            <span class="meta-label">💼 Role</span>
            <span class="meta-value">{{ analysis.post_summary.role }}</span>
          </div>
          <div class="meta-item" v-if="analysis.post_summary.level">
            <span class="meta-label">📊 Level</span>
            <span class="meta-value">{{ analysis.post_summary.level }}</span>
          </div>
          <div class="meta-item" v-if="analysis.post_summary.outcome">
            <span class="meta-label">{{ getOutcomeIcon(analysis.post_summary.outcome) }} Outcome</span>
            <span class="meta-value" :class="getOutcomeClass(analysis.post_summary.outcome)">
              {{ analysis.post_summary.outcome }}
            </span>
          </div>
        </div>

        <div v-if="analysis.post_summary.key_skills && analysis.post_summary.key_skills.length > 0" class="skills-section">
          <h5 class="subsection-title">🔧 Key Skills</h5>
          <div class="tags-list">
            <span v-for="skill in analysis.post_summary.key_skills" :key="skill" class="tag skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <a v-if="isRealRedditUrl(analysis.post_summary.url)" :href="analysis.post_summary.url" target="_blank" class="view-original-link">
          View Original Post →
        </a>
      </div>
    </div>

    <!-- Similar Posts Section -->
    <div class="analysis-section" v-if="analysis.similar_posts && analysis.similar_posts.length > 0">
      <h3 class="section-title">🔗 Similar Posts ({{ analysis.similar_posts.length }})</h3>
      <div class="similar-posts-grid">
        <div
          v-for="post in analysis.similar_posts.slice(0, 6)"
          :key="post.post_id"
          class="similar-post-card"
        >
          <div class="similarity-badge" :style="getSimilarityStyle(post.similarity_score)">
            {{ Math.round(post.similarity_score) }}%
          </div>
          <h5 class="similar-post-title">{{ post.title }}</h5>
          <div class="similar-post-meta">
            <span v-if="post.company" class="meta-badge">🏢 {{ post.company }}</span>
            <span v-if="post.role_type" class="meta-badge">💼 {{ post.role_type }}</span>
          </div>
          <a v-if="post.url" :href="post.url" target="_blank" class="view-link">View →</a>
        </div>
      </div>
    </div>

    <!-- Comparative Metrics Section -->
    <div class="analysis-section" v-if="analysis.comparative_metrics">
      <h3 class="section-title">📊 Comparative Analysis</h3>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">🏢</div>
          <div class="metric-content">
            <div class="metric-label">Same Company</div>
            <div class="metric-value">{{ analysis.comparative_metrics.same_company.percentage }}%</div>
            <div class="metric-desc">{{ analysis.comparative_metrics.same_company.count }} of {{ analysis.comparative_metrics.total_similar_posts }} posts</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">💼</div>
          <div class="metric-content">
            <div class="metric-label">Same Role</div>
            <div class="metric-value">{{ analysis.comparative_metrics.same_role.percentage }}%</div>
            <div class="metric-desc">{{ analysis.comparative_metrics.same_role.count }} of {{ analysis.comparative_metrics.total_similar_posts }} posts</div>
          </div>
        </div>

        <div class="metric-card success-card">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <div class="metric-label">Success Rate</div>
            <div class="metric-value">{{ analysis.comparative_metrics.outcome_distribution.success_rate }}</div>
            <div class="metric-desc">
              {{ analysis.comparative_metrics.outcome_distribution.success }} passed,
              {{ analysis.comparative_metrics.outcome_distribution.failure }} failed
            </div>
          </div>
        </div>
      </div>

      <!-- Skill Frequency Analysis -->
      <div v-if="hasSkills" class="skill-frequency-section">
        <h4 class="subsection-title">🔧 Skill Frequency in Similar Posts</h4>
        <div class="skill-bars">
          <div
            v-for="(data, skill) in topSkills"
            :key="skill"
            class="skill-bar-item"
          >
            <div class="skill-bar-label">{{ skill }}</div>
            <div class="skill-bar-container">
              <div
                class="skill-bar-fill"
                :style="{ width: data.percentage + '%' }"
                :class="getSkillFrequencyClass(parseFloat(data.percentage))"
              >
                <span class="skill-bar-text">{{ data.percentage }}%</span>
              </div>
            </div>
            <div class="skill-bar-count">{{ data.mentioned_in_similar }} posts</div>
          </div>
        </div>
      </div>

      <!-- Insight -->
      <div v-if="analysis.comparative_metrics.similarity_insight" class="insight-banner">
        <span class="insight-icon">💡</span>
        <span class="insight-text">{{ analysis.comparative_metrics.similarity_insight }}</span>
      </div>
    </div>

    <!-- Unique Aspects Section -->
    <div class="analysis-section" v-if="analysis.unique_aspects">
      <h3 class="section-title">✨ Unique Aspects</h3>
      <p class="section-desc">{{ analysis.unique_aspects.uniqueness_summary }}</p>

      <div v-if="analysis.unique_aspects.is_unique && analysis.unique_aspects.rare_skills.length > 0" class="rare-skills-list">
        <div
          v-for="skill in analysis.unique_aspects.rare_skills"
          :key="skill.skill"
          class="rare-skill-item"
        >
          <div class="rare-skill-header">
            <span class="rare-skill-name">{{ skill.skill }}</span>
            <span class="rarity-badge" :style="getRarityStyle(parseFloat(skill.rarity_score))">
              {{ skill.rarity_score }}% Rare
            </span>
          </div>
          <p class="rare-skill-insight">💡 {{ skill.insight }}</p>
          <p class="rare-skill-stat">Mentioned in {{ skill.mentioned_in }} similar posts</p>
        </div>
      </div>
    </div>

    <!-- Recommended Resources Section -->
    <div class="analysis-section" v-if="analysis.recommended_resources && analysis.recommended_resources.length > 0">
      <h3 class="section-title">📚 Recommended Resources</h3>
      <div class="resources-grid">
        <a
          v-for="resource in analysis.recommended_resources"
          :key="resource.title"
          :href="resource.url"
          target="_blank"
          class="resource-card"
        >
          <div class="resource-header">
            <span class="resource-icon">{{ getResourceIcon(resource.type) }}</span>
            <span class="resource-type">{{ resource.type }}</span>
          </div>
          <h5 class="resource-title">{{ resource.title }}</h5>
          <span class="resource-skill">{{ resource.skill }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import type { AnalysisResult, ComparativeMetrics, SkillComparisonMetric } from '@/types/reports'

type PostAnalysisResult = AnalysisResult & {
  comparative_metrics: ComparativeMetrics
}

const props = defineProps<{
  analysis: PostAnalysisResult
}>()

const hasSkills = computed(() => {
  const skillComparison = props.analysis.comparative_metrics?.skill_comparison
  return !!(skillComparison && Object.keys(skillComparison).length > 0)
})

const topSkills = computed<Record<string, SkillComparisonMetric>>(() => {
  if (!hasSkills.value || !props.analysis.comparative_metrics?.skill_comparison) {
    return {}
  }

  const entries = Object
    .entries(props.analysis.comparative_metrics.skill_comparison) as [string, SkillComparisonMetric][]

  entries.sort(([, a], [, b]) => {
    const aPercent = typeof a.percentage === 'string' ? parseFloat(a.percentage) : Number(a.percentage || 0)
    const bPercent = typeof b.percentage === 'string' ? parseFloat(b.percentage) : Number(b.percentage || 0)
    return bPercent - aPercent
  })

  return Object.fromEntries(entries.slice(0, 8))
})

/**
 * Check if URL is a valid Reddit URL from database
 * (not a temporary/mock URL)
 */
function isRealRedditUrl(url: string | undefined): boolean {
  if (!url) return false
  // Check if URL is a valid Reddit URL (contains reddit.com and /comments/)
  return url.includes('reddit.com') && url.includes('/comments/')
}

function getOutcomeIcon(outcome: string) {
  if (!outcome) return '❓'
  const lower = outcome.toLowerCase()
  if (lower.includes('pass') || lower.includes('offer') || lower.includes('accept')) return '✅'
  if (lower.includes('fail') || lower.includes('reject')) return '❌'
  return '⏳'
}

function getOutcomeClass(outcome: string) {
  if (!outcome) return ''
  const lower = outcome.toLowerCase()
  if (lower.includes('pass') || lower.includes('offer') || lower.includes('accept')) return 'outcome-success'
  if (lower.includes('fail') || lower.includes('reject')) return 'outcome-failure'
  return 'outcome-pending'
}

function getSimilarityStyle(score: number) {
  const hue = 120 // Green
  const lightness = 35 + (score / 100) * 15
  return {
    background: `hsl(${hue}, 65%, ${lightness}%)`,
    color: 'white'
  }
}

function getSkillFrequencyClass(percentage: number) {
  if (percentage >= 70) return 'frequency-high'
  if (percentage >= 40) return 'frequency-medium'
  return 'frequency-low'
}

function getRarityStyle(rarityScore: number) {
  if (rarityScore >= 90) {
    return { background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', color: 'white' }
  } else if (rarityScore >= 80) {
    return { background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', color: 'white' }
  } else {
    return { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }
  }
}

function getResourceIcon(type: string) {
  const icons: Record<string, string> = {
    'Practice': '💪',
    'Guide': '📖',
    'Documentation': '📄',
    'Tutorial': '🎓',
    'Course': '🎯',
    'Practice List': '📝'
  }
  return icons[type] || '📚'
}
</script>

<style scoped>
.post-analysis-report {
  @apply space-y-8 p-8;
}

.analysis-section {
  @apply bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm hover:shadow-md transition-shadow;
}

.section-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6;
}

.section-desc {
  @apply text-base text-gray-600 dark:text-gray-400 mb-6;
}

.subsection-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
}

/* Post Summary */
.post-summary-card {
  @apply space-y-6;
}

.post-title {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight;
}

.meta-grid {
  @apply grid grid-cols-2 gap-6;
}

.meta-item {
  @apply flex flex-col gap-2;
}

.meta-label {
  @apply text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide;
}

.meta-value {
  @apply text-lg font-medium text-gray-900 dark:text-gray-100;
}

.outcome-success {
  @apply text-green-600 dark:text-green-400;
}

.outcome-failure {
  @apply text-red-600 dark:text-red-400;
}

.outcome-pending {
  @apply text-yellow-600 dark:text-yellow-400;
}

.skills-section {
  @apply pt-6 border-t border-gray-100 dark:border-gray-700;
}

.tags-list {
  @apply flex flex-wrap gap-3;
}

.tag {
  @apply px-3 py-1.5 text-sm font-medium rounded-lg;
}

.skill-tag {
  @apply bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300;
}

.view-original-link {
  @apply inline-block text-base text-blue-600 dark:text-blue-400 hover:underline font-medium;
}

/* Similar Posts */
.similar-posts-grid {
  @apply grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6;
}

.similar-post-card {
  @apply relative p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-600 transition-colors;
}

.similarity-badge {
  @apply absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold;
}

.similar-post-title {
  @apply text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 pr-16;
}

.similar-post-meta {
  @apply flex gap-3 flex-wrap mb-3;
}

.meta-badge {
  @apply text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded;
}

.view-link {
  @apply text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium;
}

/* Metrics */
.metrics-grid {
  @apply grid grid-cols-3 gap-6 mb-6;
}

.metric-card {
  @apply flex gap-4 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl;
}

.success-card {
  @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

.metric-icon {
  @apply text-4xl;
}

.metric-content {
  @apply flex-1;
}

.metric-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.metric-value {
  @apply text-4xl font-bold text-gray-900 dark:text-gray-100;
}

.metric-desc {
  @apply text-sm text-gray-500 dark:text-gray-500;
}

/* Skill Frequency */
.skill-frequency-section {
  @apply mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}

.skill-bars {
  @apply space-y-4;
}

.skill-bar-item {
  @apply grid grid-cols-[160px_1fr_80px] gap-4 items-center;
}

.skill-bar-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 truncate;
}

.skill-bar-container {
  @apply h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.skill-bar-fill {
  @apply h-full flex items-center justify-end px-3 transition-all duration-500;
}

.skill-bar-text {
  @apply text-sm font-bold text-white;
}

.frequency-high {
  @apply bg-gradient-to-r from-green-500 to-green-600;
}

.frequency-medium {
  @apply bg-gradient-to-r from-yellow-500 to-yellow-600;
}

.frequency-low {
  @apply bg-gradient-to-r from-gray-500 to-gray-600;
}

.skill-bar-count {
  @apply text-sm text-gray-600 dark:text-gray-400 text-right;
}

/* Insight Banner */
.insight-banner {
  @apply flex items-center gap-4 p-6 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl;
}

.insight-icon {
  @apply text-3xl;
}

.insight-text {
  @apply text-base font-medium text-yellow-900 dark:text-yellow-200;
}

/* Rare Skills */
.rare-skills-list {
  @apply space-y-6;
}

.rare-skill-item {
  @apply p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl;
}

.rare-skill-header {
  @apply flex items-center justify-between mb-3;
}

.rare-skill-name {
  @apply text-base font-bold text-gray-900 dark:text-gray-100;
}

.rarity-badge {
  @apply px-3 py-1.5 rounded-full text-sm font-bold;
}

.rare-skill-insight {
  @apply text-base text-gray-700 dark:text-gray-300 mb-2;
}

.rare-skill-stat {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Resources */
.resources-grid {
  @apply grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6;
}

.resource-card {
  @apply block p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-md transition-all;
}

.resource-header {
  @apply flex items-center justify-between mb-3;
}

.resource-icon {
  @apply text-3xl;
}

.resource-type {
  @apply text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase;
}

.resource-title {
  @apply text-base font-bold text-gray-900 dark:text-gray-100 mb-2;
}

.resource-skill {
  @apply inline-block text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded;
}
</style>
