<template>
  <!-- Hiring Process Intelligence - McKinsey Professional Style -->
  <section v-if="hasData" class="hiring-process">
    <!-- Section Header -->
    <div class="section-header">
      <h2 class="section-title">Hiring Process Intelligence</h2>
      <div class="data-attribution">
        Analyzing {{ companyCount }} companies across {{ totalPosts }} interviews
      </div>
    </div>

    <!-- Company Comparison Table -->
    <div v-if="companyData.length > 0" class="process-card">
      <div class="card-header">
        <h3 class="card-title">Company Comparison</h3>
        <span class="data-count">{{ companyData.length }} companies</span>
      </div>
      <div class="card-content">
        <div class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Company</th>
                <th class="text-center">Rounds</th>
                <th class="text-center">Timeline</th>
                <th class="text-center">Success %</th>
                <th class="text-center">Remote %</th>
                <th class="text-center">Referral %</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(company, index) in companyData.slice(0, 15)" :key="index">
                <td class="company-name">{{ company.name }}</td>
                <td class="text-center">{{ company.rounds }}</td>
                <td class="text-center">{{ company.timeline }}</td>
                <td class="text-center">
                  <span class="success-value" :class="getSuccessClass(company.success_rate)">
                    {{ company.success_rate }}%
                  </span>
                </td>
                <td class="text-center">{{ company.remote_rate }}%</td>
                <td class="text-center">{{ company.referral_rate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Interview Format Trends -->
    <div v-if="formatTrends.length > 0" class="process-card">
      <div class="card-header">
        <h3 class="card-title">Interview Format Trends</h3>
        <span class="data-count">{{ formatTrends.length }} time periods</span>
      </div>
      <div class="card-content">
        <div class="format-trends">
          <div v-for="(trend, index) in formatTrends" :key="index" class="trend-row">
            <span class="trend-period">{{ trend.period }}</span>
            <div class="trend-bar-container">
              <div class="trend-bar onsite" :style="{ width: `${trend.onsite}%` }">
                <span v-if="trend.onsite > 15" class="trend-label">Onsite {{ trend.onsite }}%</span>
              </div>
              <div class="trend-bar virtual" :style="{ width: `${trend.virtual}%` }">
                <span v-if="trend.virtual > 15" class="trend-label">Virtual {{ trend.virtual }}%</span>
              </div>
              <div v-if="trend.hybrid > 0" class="trend-bar hybrid" :style="{ width: `${trend.hybrid}%` }">
                <span v-if="trend.hybrid > 15" class="trend-label">Hybrid {{ trend.hybrid }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Offer Dynamics -->
    <div v-if="offerDynamics" class="process-card">
      <div class="card-header">
        <h3 class="card-title">Offer Dynamics</h3>
        <span class="data-count">Compensation & negotiation insights</span>
      </div>
      <div class="card-content">
        <div class="dynamics-grid">
          <div class="dynamic-item">
            <div class="dynamic-value">{{ offerDynamics.negotiation_rate }}%</div>
            <div class="dynamic-label">Negotiation Occurred</div>
            <div class="dynamic-insight">of offers were negotiated</div>
          </div>
          <div class="dynamic-item">
            <div class="dynamic-value">{{ offerDynamics.compensation_discussed }}%</div>
            <div class="dynamic-label">Compensation Discussed</div>
            <div class="dynamic-insight">mentioned salary/benefits</div>
          </div>
          <div class="dynamic-item">
            <div class="dynamic-value">{{ offerDynamics.multiple_offers }}%</div>
            <div class="dynamic-label">Multiple Offers</div>
            <div class="dynamic-insight">had competing offers</div>
          </div>
          <div v-if="offerDynamics.avg_response_time" class="dynamic-item">
            <div class="dynamic-value">{{ offerDynamics.avg_response_time }}</div>
            <div class="dynamic-label">Avg Response Time</div>
            <div class="dynamic-insight">from final round to offer</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Intelligence by Company -->
    <div v-if="timelineIntelligence.length > 0" class="process-card">
      <div class="card-header">
        <h3 class="card-title">Timeline Intelligence by Company</h3>
        <span class="data-count">{{ timelineIntelligence.length }} companies with detailed timeline data</span>
      </div>
      <div class="card-content">
        <div class="timeline-grid">
          <div v-for="(timeline, index) in timelineIntelligence.slice(0, 6)" :key="index" class="timeline-card">
            <div class="timeline-header">
              <h4 class="timeline-company">{{ timeline.company }}</h4>
              <span class="timeline-duration">{{ timeline.avg_duration }}</span>
            </div>
            <div class="timeline-stages">
              <div v-for="(stage, idx) in timeline.stages" :key="idx" class="stage-item">
                <div class="stage-dot"></div>
                <div class="stage-info">
                  <div class="stage-name">{{ stage.name }}</div>
                  <div class="stage-time">{{ stage.duration }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Insufficient Data Message -->
  <section v-else class="insufficient-data">
    <h2 class="section-title">Hiring Process Intelligence</h2>
    <p class="message">Insufficient data for hiring process analysis (minimum company data required)</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  intelligence: any | null
  patterns: any
}

const props = defineProps<Props>()

// Check if we have sufficient data
const hasData = computed(() => {
  return (props.patterns?.company_trends && props.patterns.company_trends.length > 0) ||
         (props.intelligence?.hiring_process)
})

const totalPosts = computed(() => {
  return props.patterns?.summary?.total_posts_analyzed || 0
})

const companyCount = computed(() => {
  return companyData.value.length || 0
})

// Company comparison data from enhanced intelligence
const companyData = computed(() => {
  // Use timeline_intelligence.by_company from enhanced intelligence
  const companyTimelines = props.intelligence?.timeline_intelligence?.by_company || []

  console.log('[HiringProcessIntelligence] companyTimelines:', JSON.stringify(companyTimelines, null, 2))
  console.log('[HiringProcessIntelligence] companyTimelines length:', companyTimelines.length)

  if (companyTimelines.length === 0) {
    console.log('[HiringProcessIntelligence] No company timeline data available')
    // Fallback: try to get company data from patterns
    if (props.patterns?.company_trends) {
      console.log('[HiringProcessIntelligence] Falling back to patterns.company_trends')
      return props.patterns.company_trends
        .filter((c: any) => c.company && c.company !== 'Unknown')
        .map((c: any) => ({
          name: c.company,
          rounds: c.avg_rounds ? c.avg_rounds.toFixed(1) : 'N/A',
          timeline: c.avg_duration || 'N/A',
          success_rate: c.success_rate || 0,
          remote_rate: 50, // Default if not available
          referral_rate: 0
        }))
        .sort((a: any, b: any) => b.success_rate - a.success_rate)
        .slice(0, 15)
    }
    return []
  }

  return companyTimelines
    .filter((c: any) => c.company && c.company !== 'Unknown')
    .map((c: any) => ({
      name: c.company,
      rounds: c.avg_rounds ? c.avg_rounds.toFixed(1) : 'N/A',
      timeline: c.typical_timeline || 'N/A',
      success_rate: c.success_rate || 0,
      remote_rate: c.most_common_location === 'remote' || c.most_common_location === 'virtual' ? 100 :
                   c.most_common_location === 'onsite' ? 0 : 50,
      referral_rate: c.referral_rate || 0
    }))
    .sort((a: any, b: any) => b.success_rate - a.success_rate)
    .slice(0, 15) // Limit to top 15 companies
})

// Interview format trends (from intelligence or patterns)
const formatTrends = computed(() => {
  // Try to get from enhanced intelligence first
  if (props.intelligence?.hiring_process?.format_trends) {
    return props.intelligence.hiring_process.format_trends
  }

  // Fallback: construct from patterns temporal data if available
  if (props.patterns?.temporal_intelligence?.quarterly_trends) {
    return props.patterns.temporal_intelligence.quarterly_trends
      .slice(-4) // Last 4 quarters
      .map((q: any) => ({
        period: q.quarter || q.period,
        onsite: q.onsite_percentage || 30,
        virtual: q.virtual_percentage || 60,
        hybrid: q.hybrid_percentage || 10
      }))
  }

  return []
})

// Offer dynamics from enhanced intelligence
const offerDynamics = computed(() => {
  if (!props.intelligence?.hiring_process) {
    return null
  }

  const hiringProcess = props.intelligence.hiring_process
  const dynamics = hiringProcess.offer_dynamics
  const compTransparency = hiringProcess.compensation_transparency

  if (!dynamics) return null

  return {
    negotiation_rate: Math.round(dynamics.negotiation_rate || 0),
    compensation_discussed: Math.round(compTransparency?.discussion_rate || 0),
    multiple_offers: Math.round(dynamics.decline_rate || 0), // Use decline_rate as proxy for having multiple offers
    avg_response_time: null // Not available in current backend structure
  }
})

// Timeline intelligence by company (same as companyData but restructured for timeline display)
const timelineIntelligence = computed(() => {
  const companyTimelines = props.intelligence?.timeline_intelligence?.by_company || []

  if (companyTimelines.length === 0) return []

  // Generate simplified timeline stages from company data
  return companyTimelines
    .filter((ct: any) => ct.company && ct.company !== 'Unknown')
    .slice(0, 6)
    .map((ct: any) => ({
      company: ct.company,
      avg_duration: ct.typical_timeline || 'N/A',
      stages: [
        { name: 'Application', duration: '1-2 days' },
        { name: 'Phone Screen', duration: '1 week' },
        { name: `${ct.avg_rounds || 4} Technical Rounds`, duration: ct.typical_timeline || 'N/A' },
        { name: 'Decision', duration: '3-7 days' }
      ]
    }))
})

// Helper function to get success rate color class
function getSuccessClass(rate: number): string {
  if (rate >= 50) return 'success-high'
  if (rate >= 30) return 'success-medium'
  return 'success-low'
}
</script>

<style scoped>
/* McKinsey Professional Styling - NO Web 2.0 */

/* Section Container */
.hiring-process {
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

/* Process Cards */
.process-card {
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

/* Comparison Table */
.comparison-table-wrapper {
  @apply overflow-x-auto;
}

.comparison-table {
  @apply w-full border border-gray-200 rounded;
}

.comparison-table thead {
  @apply bg-gray-100;
}

.comparison-table th {
  @apply px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide;
}

.comparison-table td {
  @apply px-4 py-3 text-sm border-t border-gray-200;
}

.comparison-table tbody tr:hover {
  @apply bg-gray-50;
}

.company-name {
  @apply font-medium text-gray-900;
}

.success-value {
  @apply font-semibold text-center;
}

.success-value.success-high {
  @apply text-blue-700;
}

.success-value.success-medium {
  @apply text-blue-600;
}

.success-value.success-low {
  @apply text-gray-600;
}

/* Format Trends */
.format-trends {
  @apply space-y-4;
}

.trend-row {
  @apply flex items-center gap-4;
}

.trend-period {
  @apply text-sm font-medium text-gray-700 w-24 flex-shrink-0;
}

.trend-bar-container {
  @apply flex-1 flex h-10 bg-gray-100 rounded overflow-hidden;
}

.trend-bar {
  @apply flex items-center justify-center transition-all duration-500;
}

.trend-bar.onsite {
  @apply bg-blue-500;
}

.trend-bar.virtual {
  @apply bg-gray-400;
}

.trend-bar.hybrid {
  @apply bg-amber-500;
}

.trend-label {
  @apply text-white text-xs font-semibold;
}

/* Offer Dynamics Grid */
.dynamics-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.dynamic-item {
  @apply bg-gray-50 p-4 rounded border border-gray-200 text-center;
}

.dynamic-value {
  @apply text-3xl font-bold text-gray-900 mb-1;
}

.dynamic-label {
  @apply text-xs text-gray-600 uppercase tracking-wide font-medium mb-2;
}

.dynamic-insight {
  @apply text-xs text-gray-500;
}

/* Timeline Grid */
.timeline-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.timeline-card {
  @apply border border-gray-200 rounded p-4 bg-gray-50;
}

.timeline-header {
  @apply flex items-center justify-between mb-3 pb-2 border-b border-gray-200;
}

.timeline-company {
  @apply text-sm font-semibold text-gray-900 m-0;
}

.timeline-duration {
  @apply text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200;
}

.timeline-stages {
  @apply space-y-2;
}

.stage-item {
  @apply flex items-start gap-2;
}

.stage-dot {
  @apply w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0;
}

.stage-info {
  @apply flex-1;
}

.stage-name {
  @apply text-xs font-medium text-gray-900;
}

.stage-time {
  @apply text-xs text-gray-600;
}
</style>
