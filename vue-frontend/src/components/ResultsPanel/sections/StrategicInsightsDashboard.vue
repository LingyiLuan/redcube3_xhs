<template>
  <!-- Strategic Insights Dashboard - McKinsey Professional Style -->
  <section v-if="hasIntelligence" class="strategic-dashboard">
    <!-- Section Header (No Emoji) -->
    <div class="section-header">
      <h2 class="section-title">Strategic Insights Dashboard</h2>
      <div class="data-attribution">
        Based on {{ intelligence.data_quality.foundation_pool_size }} posts
        <span class="confidence-badge" :class="`confidence-${intelligence.data_quality.statistical_confidence}`">
          {{ intelligence.data_quality.statistical_confidence.toUpperCase() }} confidence
        </span>
      </div>
    </div>

    <!-- Metric Cards Grid (2×3) -->
    <div class="metrics-grid">
      <div v-for="(metric, index) in topMetrics" :key="index" class="metric-card">
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-label">{{ metric.label }}</div>
        <div v-if="metric.insight" class="metric-insight">→ {{ metric.insight }}</div>
      </div>
    </div>

    <!-- Referral Impact Analysis (UNIQUE - Not in other sections) -->
    <div v-if="referralIntelligence" class="insight-card referral-impact">
      <div class="card-header">
        <div class="card-title-with-badge">
          <h3 class="card-title">Referral Impact Analysis</h3>
          <DataSourceBadge type="personalized" />
        </div>
        <div class="multiplier-badge">{{ referralIntelligence.multiplier }} Advantage</div>
      </div>
      <div class="card-content">
        <div class="comparison-bars">
          <div class="bar-row">
            <span class="bar-label">With Referral</span>
            <div class="bar-container">
              <div
                class="bar bar-referral"
                :style="{ width: `${referralIntelligence.success_rate_with}%` }"
              >
                <span class="bar-value">{{ referralIntelligence.success_rate_with }}%</span>
              </div>
            </div>
          </div>
          <div class="bar-row">
            <span class="bar-label">Without Referral</span>
            <div class="bar-container">
              <div
                class="bar bar-no-referral"
                :style="{ width: `${referralIntelligence.success_rate_without}%` }"
              >
                <span class="bar-value">{{ referralIntelligence.success_rate_without }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="actionable-insight">
          <strong>Action:</strong> {{ referralActionableInsight }}
        </div>
      </div>
    </div>

    <!-- Top 3 Rejection Drivers (Summary only) -->
    <div v-if="topRejections.length > 0" class="insight-card rejection-summary">
      <div class="card-header">
        <div class="card-title-with-badge">
          <h3 class="card-title">Top Rejection Drivers</h3>
          <DataSourceBadge type="personalized" />
        </div>
        <span class="data-count">{{ rejectionAnalysis.top_reasons.length }} patterns identified</span>
      </div>
      <div class="card-content">
        <div class="rejection-list">
          <div
            v-for="(rejection, index) in topRejections"
            :key="index"
            class="rejection-item"
            :class="`priority-${rejection.priority_level}`"
          >
            <div class="rejection-header">
              <span class="rank">{{ index + 1 }}</span>
              <span class="reason">{{ rejection.reason }}</span>
              <span class="frequency">{{ rejection.frequency }} cases</span>
            </div>
            <div class="mitigation">
              <strong>Action:</strong> {{ rejection.mitigation_strategy }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Quality Footer -->
    <div class="data-quality-footer">
      <div class="quality-metric">
        <span class="metric-label">Posts Analyzed</span>
        <span class="metric-value">{{ intelligence.data_quality.posts_analyzed }}</span>
      </div>
      <div class="quality-metric" v-if="intelligence.data_quality.questions_analyzed">
        <span class="metric-label">Questions Analyzed</span>
        <span class="metric-value">{{ intelligence.data_quality.questions_analyzed }}</span>
      </div>
      <div class="quality-metric" v-if="intelligence.data_quality.companies_covered">
        <span class="metric-label">Companies Covered</span>
        <span class="metric-value">{{ intelligence.data_quality.companies_covered }}</span>
      </div>
    </div>
  </section>

  <!-- Insufficient Data Message -->
  <section v-else class="insufficient-data">
    <h2 class="section-title">Strategic Insights Dashboard</h2>
    <p class="message">Insufficient data for strategic analysis (minimum 10 posts with similar experiences required)</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Props {
  intelligence: any | null
  patterns: any
}

const props = defineProps<Props>()

// Check if we have sufficient intelligence data
const hasIntelligence = computed(() => {
  return props.intelligence
    && props.intelligence.data_quality
    && props.intelligence.data_quality.foundation_pool_size >= 10
    && props.intelligence.executive_summary
})

// Compute top 6 metrics for grid
const topMetrics = computed(() => {
  if (!hasIntelligence.value) return []

  const overview = props.intelligence.hiring_process?.overview || {}
  const offerDynamics = props.intelligence.hiring_process?.offer_dynamics || {}
  const referral = props.intelligence.hiring_process?.referral_intelligence || {}

  const metrics = []

  // Calculate success rate from patterns.summary if available
  let successRate = null
  if (props.patterns?.summary?.success_rate !== undefined) {
    successRate = Math.round(parseFloat(props.patterns.summary.success_rate))
  }

  // Row 1
  if (successRate !== null) {
    metrics.push({
      value: `${successRate}%`,
      label: 'Success Rate',
      insight: successRate < 30 ? 'Focus on preparation depth' : 'Maintain current approach'
    })
  }

  if (overview.avg_rounds !== undefined && overview.avg_rounds > 0) {
    const rounds = typeof overview.avg_rounds === 'number' ? overview.avg_rounds.toFixed(1) : overview.avg_rounds
    metrics.push({
      value: rounds,
      label: 'Avg Rounds',
      insight: `Prepare for ${Math.ceil(overview.avg_rounds) + 1}+ rounds`
    })
  }

  // Remote ratio from location_preference
  const remoteRatio = overview.location_preference?.remote
  if (remoteRatio !== undefined) {
    metrics.push({
      value: `${remoteRatio}%`,
      label: 'Remote Ratio',
      insight: remoteRatio > 50 ? 'Optimize virtual setup' : 'Prepare for onsite'
    })
  }

  // Row 2
  if (offerDynamics.negotiation_rate !== undefined && offerDynamics.negotiation_rate > 0) {
    metrics.push({
      value: `${offerDynamics.negotiation_rate}%`,
      label: 'Negotiation Rate',
      insight: 'Research market rates'
    })
  }

  if (referral.usage_rate !== undefined) {
    metrics.push({
      value: `${referral.usage_rate}%`,
      label: 'Referral Usage',
      insight: referral.usage_rate < 20 ? 'Network more actively' : null
    })
  }

  // Calculate avg timeline from patterns if available
  if (props.patterns?.summary?.avg_timeline) {
    metrics.push({
      value: props.patterns.summary.avg_timeline,
      label: 'Avg Timeline',
      insight: null
    })
  }

  return metrics.slice(0, 6) // Maximum 6 metrics
})

// Referral intelligence
const referralIntelligence = computed(() => {
  const ref = props.intelligence?.hiring_process?.referral_intelligence
  if (!ref) return null

  return {
    success_rate_with: ref.success_with_referral || 0,
    success_rate_without: ref.success_without_referral || 0,
    multiplier: ref.multiplier || '1.0x'
  }
})

const referralActionableInsight = computed(() => {
  if (!referralIntelligence.value) return ''
  const multiplier = referralIntelligence.value.multiplier
  return `Allocate 30% of prep time to networking—attend meetups, request informational interviews, and leverage LinkedIn connections for a ${multiplier} advantage`
})

// Top 3 rejections (summary only, full list in dedicated section)
const rejectionAnalysis = computed(() => {
  return props.intelligence?.rejection_analysis || { top_reasons: [] }
})

const topRejections = computed(() => {
  return rejectionAnalysis.value.top_reasons.slice(0, 3)
})
</script>

<style scoped>
/* McKinsey Professional Styling - NO Web 2.0 */

/* Section Container */
.strategic-dashboard {
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
  @apply text-xs text-gray-600 flex items-center gap-2;
}

.confidence-badge {
  @apply px-2 py-0.5 rounded text-xs font-medium;
}

.confidence-badge.confidence-high {
  @apply bg-blue-100 text-blue-800;
}

.confidence-badge.confidence-medium {
  @apply bg-blue-50 text-blue-700;
}

.confidence-badge.confidence-low {
  @apply bg-gray-100 text-gray-700;
}

/* Metrics Grid (2×2 Balanced Layout) - Dense Layout */
.metrics-grid {
  @apply grid grid-cols-2 gap-4 p-6 border-b border-gray-200;
}

@media (max-width: 1024px) {
  .metrics-grid {
    @apply grid-cols-2;
  }
}

@media (max-width: 640px) {
  .metrics-grid {
    @apply grid-cols-1;
  }
}

.metric-card {
  @apply bg-gray-50 p-4 rounded border border-gray-200;
}

.metric-value {
  @apply text-3xl font-bold text-gray-900 mb-1;
}

.metric-label {
  @apply text-xs text-gray-600 uppercase tracking-wide font-medium mb-2;
}

.metric-insight {
  @apply text-xs text-gray-700 mt-2 pt-2 border-t border-gray-200;
}

/* Insight Cards */
.insight-card {
  @apply mx-6 mb-6 border border-gray-200 rounded overflow-hidden;
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

/* Referral Impact */
.multiplier-badge {
  @apply bg-blue-500 text-white px-3 py-1 rounded text-sm font-semibold;
}

.comparison-bars {
  @apply space-y-3 mb-4;
}

.bar-row {
  @apply flex items-center gap-3;
}

.bar-label {
  @apply text-sm font-medium text-gray-700 w-32 flex-shrink-0;
}

.bar-container {
  @apply flex-1 bg-gray-100 rounded h-8 relative overflow-hidden;
}

.bar {
  @apply h-full flex items-center justify-end pr-3 transition-all duration-500;
}

.bar-referral {
  @apply bg-blue-500;
}

.bar-no-referral {
  @apply bg-gray-400;
}

.bar-value {
  @apply text-white text-sm font-semibold;
}

.actionable-insight {
  @apply text-sm text-gray-700 bg-gray-50 border-l-4 border-blue-500 p-3 rounded;
}

/* Rejection List */
.rejection-list {
  @apply space-y-3;
}

.rejection-item {
  @apply border-l-4 pl-3 py-2;
}

.rejection-item.priority-critical {
  @apply border-blue-600 bg-blue-50;
}

.rejection-item.priority-high {
  @apply border-blue-400 bg-blue-50;
}

.rejection-item.priority-medium {
  @apply border-gray-400 bg-gray-50;
}

.rejection-header {
  @apply flex items-center gap-2 mb-1;
}

.rank {
  @apply bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded w-6 text-center;
}

.reason {
  @apply flex-1 text-sm font-medium text-gray-900;
}

.frequency {
  @apply text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200;
}

.mitigation {
  @apply text-xs text-gray-700 ml-8;
}

/* Data Quality Footer */
.data-quality-footer {
  @apply flex items-center justify-around px-6 py-4 bg-gray-50 border-t border-gray-200;
}

.quality-metric {
  @apply flex flex-col items-center gap-1;
}

.quality-metric .metric-label {
  @apply text-xs text-gray-600;
}

.quality-metric .metric-value {
  @apply text-sm font-semibold text-gray-900;
}

/* Data Source Badge Wrapper */
.card-title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title-with-badge .card-title {
  margin: 0;
}
</style>
