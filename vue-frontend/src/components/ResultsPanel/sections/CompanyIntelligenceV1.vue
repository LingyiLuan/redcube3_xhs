<template>
  <!-- 2. Company Intelligence Section -->
  <section class="report-section company-intelligence" v-if="patterns.company_trends && patterns.company_trends.length > 0">
    <h2 class="section-title">Company Intelligence</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="insight-text">
        {{ narrativeText }}
      </p>
    </div>

    <!-- Component 1: Comparison Table -->
    <div class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">Company-by-Company Comparison</h3>
        <DataSourceBadge type="personalized" />
      </div>
      <div class="company-intelligence-table-wrapper">
        <table class="company-comparison-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Posts</th>
              <th>Success Rate</th>
              <th>Avg Difficulty</th>
              <th>Top Skill</th>
              <th>Top Role</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(company, idx) in companyComparisonData.filter(c => c.company !== 'Unknown').slice(0, 10)" :key="company.company"
                :class="{
                  'best-performer': idx === 0,
                  'worst-performer': idx === companyComparisonData.length - 1 && companyComparisonData.length > 3
                }">
              <td class="company-cell">
                {{ company.company }}
                <span v-if="company.is_seed_company" class="seed-badge" title="From your uploaded posts">Your Company</span>
              </td>
              <td>{{ company.total_posts }}</td>
              <td class="success-rate-cell">{{ company.success_rate }}</td>
              <td>{{ company.avg_difficulty }}</td>
              <td>{{ company.top_skill }}</td>
              <td>{{ company.top_role }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Component 2: Success Rate by Interview Stage - McKinsey Comparative Table -->
    <div v-if="hasStageData" class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">Success Rate by Company & Interview Stage</h3>
        <div class="badge-group">
          <DataSourceBadge type="benchmark" />
          <CacheFreshnessIndicator />
        </div>
      </div>
      <p class="chart-subtitle">Comparative analysis of interview stage performance across companies. Your company is highlighted with ★ and will show more data as our database grows.</p>

      <div class="stage-comparison-table-wrapper">
        <table class="stage-comparison-table">
          <thead>
            <tr>
              <th class="company-col">Company</th>
              <th v-for="stage in allStageNames" :key="stage" class="stage-col">{{ stage }}</th>
              <th class="posts-col">Posts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stageTableData" :key="row.company" :class="{ 'seed-company-row': row.is_seed }">
              <td class="company-name-cell">
                {{ row.company }}
                <span v-if="row.is_seed" class="seed-company-badge" title="Your company">★</span>
                <span v-if="row.limited_data" class="limited-data-note">Limited data</span>
              </td>
              <td v-for="stage in allStageNames" :key="stage" class="stage-rate-cell">
                <span v-if="row.stages[stage] !== null"
                      class="rate-badge"
                      :class="getStageRateClass(row.stages[stage])">
                  {{ row.stages[stage] }}%
                </span>
                <span v-else class="rate-na">—</span>
              </td>
              <td class="posts-count-cell">{{ row.posts }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="stage-legend">
        <span class="legend-item">
          <span class="legend-dot success-high"></span>
          High success (≥60%)
        </span>
        <span class="legend-item">
          <span class="legend-dot success-medium"></span>
          Medium (40-59%)
        </span>
        <span class="legend-item">
          <span class="legend-dot success-low"></span>
          Low (<40%)
        </span>
      </div>
    </div>
    <div v-else class="chart-wrapper temporal-unavailable">
      <h3 class="chart-title">Success Rate by Company & Interview Stage</h3>
      <div class="unavailable-message">
        <p class="unavailable-text">Stage breakdown data not available</p>
        <p class="unavailable-subtext">Detailed stage progression analysis requires additional data from foundation posts</p>
      </div>
    </div>

    <!-- Component 3: Scatter Plot - Success vs Difficulty -->
    <div class="chart-wrapper">
      <!-- Chart header with title and hover instruction -->
      <div class="chart-header">
        <div class="header-text">
          <div class="chart-title-with-badge">
            <h3 class="chart-title">Success Rate vs Interview Difficulty Matrix</h3>
            <DataSourceBadge type="personalized" />
          </div>
          <p class="chart-subtitle">
            Comparative analysis of interview success rates and difficulty levels across companies.
            Bubble size indicates data volume.
          </p>
        </div>
        <div class="hover-instruction">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="cursor-icon">
            <path d="M3 3L13 13M3 13L13 3" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="8" r="6" stroke="#9CA3AF" stroke-width="1.5" fill="none"/>
          </svg>
          <span>Hover over bubbles for details</span>
        </div>
      </div>

      <!-- Clean McKinsey-style scatter plot - NO quadrant overlays -->
      <div class="scatter-chart-minimal">
        <Scatter :data="companyScatterData" :options="scatterOptions" />
      </div>

      <!-- Minimal legend with bubble size indicator -->
      <div class="minimal-legend">
        <div class="legend-note">
          <span class="dot-example small"></span>
          <span class="dot-example medium"></span>
          <span class="dot-example large"></span>
          <span>Bubble size = number of posts analyzed</span>
        </div>
      </div>
    </div>

    <!-- Component 4: Timeline Comparison (conditional) -->
    <div v-if="hasTemporalData" class="chart-wrapper">
      <h3 class="chart-title">Success Rate Trends Over Time</h3>
      <p class="chart-subtitle">Month-over-month comparison of top companies</p>
      <div class="chart-container">
        <Line :data="companyTimelineData" :options="timelineOptions" />
      </div>
    </div>
    <div v-else class="chart-wrapper temporal-unavailable">
      <h3 class="chart-title">Success Rate Trends Over Time</h3>
      <div class="unavailable-message">
        <p class="unavailable-text">Temporal data not available for this dataset</p>
        <p class="unavailable-subtext">Analysis requires time-series data to track company performance trends</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { Scatter, Line } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'
import { MCKINSEY_COLORS, getDeterministicJitter } from '@/composables/useChartHelpers'
import { MCKINSEY_CHART_COLORS, MCKINSEY_CHART_DEFAULTS } from '@/composables/useChartColors'
import { getSkillName } from '@/composables/useReportFormatters'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import CacheFreshnessIndicator from '@/components/common/CacheFreshnessIndicator.vue'

/**
 * Props
 */
interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Narrative Text
 */
const narrativeText = computed(() => {
  if (!props.patterns.company_trends || props.patterns.company_trends.length === 0) {
    return 'Company intelligence data is currently unavailable.'
  }

  const topCompany = props.patterns.company_trends[0]
  const totalCompanies = props.patterns.company_trends.length

  // Extract success rate percentage (handle both "75%" and 75 formats)
  const successRateStr = topCompany.success_rate || '0%'
  const successRate = parseFloat(successRateStr.toString().replace('%', ''))

  return `Analysis of ${totalCompanies} companies reveals significant variations in interview difficulty and success rates. ${topCompany.company} leads with ${topCompany.total_posts} analyzed posts and a ${topCompany.success_rate} success rate, emphasizing ${topCompany.top_skills?.[0] || 'technical skills'} as a key competency. The data suggests strategic preparation tailored to company-specific patterns can significantly improve outcomes.`
})

/**
 * Helper function to get stage breakdown for small multiples
 * ✅ COMPLIANCE FIX: Only return real data from backend, no mock data
 */
function getCompanyStageBreakdown(companyName: string) {
  // Only return stage breakdown if real data exists from backend
  if (props.patterns.stage_by_company && props.patterns.stage_by_company[companyName]) {
    return props.patterns.stage_by_company[companyName]
  }

  // ✅ NO MOCK DATA: Return null to signal "no data available"
  return null
}

/**
 * Computed: Company comparison table data
 */
const companyComparisonData = computed(() => {
  if (!props.patterns.company_trends) return []

  // DEBUG: Log raw company_trends data from backend
  console.log('🔍 [Frontend Debug] Raw company_trends from backend:', props.patterns.company_trends.map((c: any) => ({
    company: c.company,
    is_seed: c.is_seed_company
  })))

  return props.patterns.company_trends.map((company: any) => {
    // ✅ COMPLIANCE FIX: Get difficulty from backend only, use N/A if unavailable
    let avgDifficulty = 'N/A'
    if (props.patterns.difficulty_by_company && props.patterns.difficulty_by_company[company.company]) {
      avgDifficulty = props.patterns.difficulty_by_company[company.company]
    }
    // ✅ NO MOCK DATA: Show N/A instead of random difficulty

    // Extract top skill from top_skills array - handle both object and string formats
    let topSkill = 'N/A'
    if (Array.isArray(company.top_skills) && company.top_skills.length > 0) {
      topSkill = getSkillName(company.top_skills[0])
    }

    // Extract top role from top_roles array - handle both object and string formats
    let topRole = 'N/A'
    if (Array.isArray(company.top_roles) && company.top_roles.length > 0) {
      const roleItem = company.top_roles[0]
      // If it's an object, try to extract role name
      if (typeof roleItem === 'object' && roleItem !== null) {
        topRole = roleItem.role || roleItem.name || roleItem.title || String(roleItem)
      } else {
        topRole = String(roleItem)
      }
    }

    return {
      company: company.company,
      total_posts: company.total_posts,
      success_rate: company.success_rate || 'N/A',
      avg_difficulty: avgDifficulty,
      top_skill: topSkill,
      top_role: topRole,
      is_seed_company: company.is_seed_company || false  // ← ADD THIS: Preserve is_seed_company flag from backend
    }
  }) // Show all companies (no limit for scatter plot)
})

/**
 * Computed: Scatter plot data (Success Rate vs Difficulty)
 */
const companyScatterData = computed(() => {
  if (!props.patterns.company_trends) return { datasets: [] }

  // Separate seed companies from RAG companies
  const seedPoints: any[] = []
  const ragPoints: any[] = []

  companyComparisonData.value
    .filter((company: any) => {
      // Filter out "Unknown" - it's not a real company
      if (company.company === 'Unknown') {
        return false
      }

      // ALWAYS include seed companies (user's companies), regardless of success rate
      if (company.is_seed_company) {
        return true
      }

      const successRateStr = company.success_rate.toString().replace('%', '')
      const successRate = parseFloat(successRateStr)

      // Accept N/A by treating it as 50% (neutral)
      const validSuccessRate = isNaN(successRate) ? 50 : successRate

      // Only exclude extreme values (0% or 100% exactly) for non-seed companies
      return validSuccessRate > 0 && validSuccessRate < 100 && company.total_posts >= 1
    })
    .forEach((company: any) => {
      // Extract numeric difficulty (e.g., "3.5/5" -> 3.5)
      const difficultyMatch = company.avg_difficulty.match(/(\d+\.?\d*)/)
      const difficulty = difficultyMatch ? parseFloat(difficultyMatch[1]) : 3

      // Extract numeric success rate (e.g., "75%" -> 75) - treat N/A as 50%
      const successRateStr = company.success_rate.toString().replace('%', '')
      const parsedRate = parseFloat(successRateStr)
      const successRate = isNaN(parsedRate) ? 50 : parsedRate

      // Better bubble sizing: seed companies get larger bubbles (12-25), RAG companies smaller (8-18)
      const isSeed = company.is_seed_company
      const baseBubbleSize = isSeed
        ? Math.min(25, Math.max(12, company.total_posts * 4))
        : Math.min(18, Math.max(8, company.total_posts * 2.5))

      // Deterministic jitter for overlap prevention (same company = same position)
      const jitter = getDeterministicJitter(company.company, 1)
      const jitterX = jitter.x * 0.15 // Scale to ±0.075
      const jitterY = jitter.y * 3    // Scale to ±1.5

      const finalX = Math.max(1, Math.min(5, difficulty + jitterX))
      const finalY = Math.max(5, Math.min(95, successRate + jitterY))

      console.log(`📍 [Scatter] ${company.company}: diff=${difficulty.toFixed(2)}, success=${successRate.toFixed(1)}%, jitter=(${jitterX.toFixed(3)}, ${jitterY.toFixed(3)}), final=(${finalX.toFixed(2)}, ${finalY.toFixed(1)}), seed=${isSeed}`)

      const point = {
        x: finalX,
        y: finalY,
        r: baseBubbleSize,
        label: company.company
      }

      // Separate into seed vs RAG datasets
      if (isSeed) {
        seedPoints.push(point)
      } else {
        ragPoints.push(point)
      }
    })

  console.log(`📊 [Scatter] Seed companies: ${seedPoints.length}, RAG companies: ${ragPoints.length}`)

  return {
    datasets: [
      // Dataset 1: RAG companies (light blue, in background)
      {
        label: 'Similar Companies (from database)',
        data: ragPoints,
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[2],  // Light blue 80%
        borderColor: MCKINSEY_CHART_COLORS.lightBlue,
        borderWidth: 1,
        hoverBackgroundColor: MCKINSEY_CHART_COLORS.lightBlue,
        hoverBorderColor: MCKINSEY_CHART_COLORS.blue,
        hoverBorderWidth: 1.5
      },
      // Dataset 2: Seed companies (McKinsey navy, highlighted)
      {
        label: 'Your Companies (from your posts)',
        data: seedPoints,
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[0],  // Navy 80%
        borderColor: MCKINSEY_CHART_COLORS.navy,
        borderWidth: 1.5,
        hoverBackgroundColor: MCKINSEY_CHART_COLORS.navy,
        hoverBorderColor: MCKINSEY_CHART_COLORS.datasetsBorder[0],
        hoverBorderWidth: 2
      }
    ]
  }
})

/**
 * Scatter plot options
 */
const scatterOptions = computed<ChartOptions<'scatter'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
    }
  },
  scales: {
    x: {
      type: 'linear' as const,
      position: 'bottom' as const,
      min: 1,
      max: 5,
      title: {
        display: true,
        text: 'Interview Difficulty, scale (1 = easier; 5 = harder)',
        color: '#6B7280',
        font: { size: 12, weight: 500 }
      },
      grid: {
        display: true,
        color: '#F1F5F9',  // Light gray grid
        lineWidth: 1,
        drawBorder: false
      },
      ticks: {
        color: MCKINSEY_CHART_COLORS.slate,
        font: { size: 11 },
        stepSize: 1
      }
    },
    y: {
      type: 'linear' as const,
      min: 0,
      max: 100,
      title: {
        display: true,
        text: 'Success Rate, percentage (0% = lower; 100% = higher)',
        color: '#6B7280',
        font: { size: 12, weight: 500 }
      },
      grid: {
        display: true,
        color: '#F1F5F9',  // Light gray grid
        lineWidth: 1,
        drawBorder: false
      },
      ticks: {
        color: MCKINSEY_CHART_COLORS.slate,
        font: { size: 11 },
        stepSize: 25,
        callback: function(value: any) {
          return value + '%'
        }
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
      backgroundColor: MCKINSEY_CHART_COLORS.charcoal,
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: MCKINSEY_CHART_COLORS.lightGray,
      borderWidth: 1,
      padding: 16,
      displayColors: false,
      titleFont: { size: 14, weight: 700 },
      bodyFont: { size: 12, weight: 400 },
      callbacks: {
        title: function(context: any) {
          return context[0].raw.label || 'Company'
        },
        label: function(context: any) {
          const point = context.raw
          return [
            `Success Rate: ${point.y.toFixed(1)}%`,
            `Difficulty: ${point.x.toFixed(1)}/5`,
            `Posts Analyzed: ${Math.round(point.r / 3)}`
          ]
        }
      }
    }
  },
  clip: false
}))

/**
 * Computed: Check if stage breakdown data exists
 * ✅ COMPLIANCE FIX: Only show stage breakdown section if real data exists
 */
const hasStageData = computed(() => {
  return props.patterns.stage_by_company && Object.keys(props.patterns.stage_by_company).length > 0
})

/**
 * Computed: All unique stage names across all companies (for table columns)
 */
const allStageNames = computed(() => {
  if (!props.patterns.stage_by_company) return []

  const stagesSet = new Set<string>()
  Object.values(props.patterns.stage_by_company).forEach((companyData: any) => {
    // Handle new backend structure: { stages: [...], total_posts: N }
    const stages = companyData.stages || companyData
    if (Array.isArray(stages)) {
      stages.forEach((stage: any) => {
        if (stage.name) {
          stagesSet.add(stage.name)
        }
      })
    }
  })

  return Array.from(stagesSet).sort()
})

/**
 * Computed: Stage table data (rows of companies with stage success rates)
 * ✅ Filters out "Unknown" company
 * ✅ Always includes seed company (even with 0 posts) and highlights it
 */
const stageTableData = computed(() => {
  if (!props.patterns.stage_by_company) return []

  const tableData: any[] = []
  const seedCompanyName = props.patterns.seed_company

  // DEBUG: Log seed company detection
  console.log('[CompanyIntelligence] 🔍 seed_company from patterns:', seedCompanyName)
  console.log('[CompanyIntelligence] 🔍 Available companies in stage_by_company:', Object.keys(props.patterns.stage_by_company))

  let seedCompanyIncluded = false

  Object.entries(props.patterns.stage_by_company).forEach(([company, companyData]: [string, any]) => {
    // ✅ FILTER OUT "Unknown" company
    if (company === 'Unknown') return

    // Track if seed company is already in the data
    if (company === seedCompanyName) {
      seedCompanyIncluded = true
    }

    // Handle new backend structure: { stages: [...], total_posts: N }
    const stages = companyData.stages || companyData
    const totalPosts = companyData.total_posts || 0

    // Create a map of stage name -> percentage for this company
    const stageMap: Record<string, number | null> = {}
    allStageNames.value.forEach(stageName => {
      stageMap[stageName] = null // Default to null (will show "—")
    })

    // Fill in actual percentages from backend data
    if (Array.isArray(stages)) {
      stages.forEach((stage: any) => {
        if (stage.name && typeof stage.percentage === 'number') {
          stageMap[stage.name] = stage.percentage
        }
      })
    }

    tableData.push({
      company,
      stages: stageMap,
      posts: totalPosts,
      is_seed: company === seedCompanyName
    })
  })

  // If seed company is not in the data, add it with empty stages
  console.log('[CompanyIntelligence] 🔍 Check if need to add seed company:')
  console.log('  - seedCompanyName:', seedCompanyName)
  console.log('  - seedCompanyIncluded:', seedCompanyIncluded)
  console.log('  - Will add?:', seedCompanyName && !seedCompanyIncluded && seedCompanyName !== 'Unknown')

  if (seedCompanyName && !seedCompanyIncluded && seedCompanyName !== 'Unknown') {
    console.log('[CompanyIntelligence] ✅ Adding seed company to table:', seedCompanyName)
    const stageMap: Record<string, number | null> = {}
    allStageNames.value.forEach(stageName => {
      stageMap[stageName] = null
    })

    tableData.push({
      company: seedCompanyName,
      stages: stageMap,
      posts: 0,
      is_seed: true,
      limited_data: true // Flag to show data limitation note
    })
  }

  console.log('[CompanyIntelligence] 🔍 Final tableData before sort:', tableData.map(r => ({ company: r.company, is_seed: r.is_seed, posts: r.posts })))

  // Sort: seed company first (if present), then by post count descending
  const sorted = tableData.sort((a, b) => {
    // Seed company always comes first
    if (a.is_seed) return -1
    if (b.is_seed) return 1
    // Otherwise sort by post count
    return b.posts - a.posts
  }).slice(0, 10) // Show top 10 (including seed if present)

  console.log('[CompanyIntelligence] 🔍 Final sorted table (top 10):', sorted.map(r => ({ company: r.company, is_seed: r.is_seed, limited_data: r.limited_data })))

  return sorted
})

/**
 * Helper function to get CSS class for stage success rate badge
 */
function getStageRateClass(rate: number | null): string {
  if (rate === null) return ''
  if (rate >= 60) return 'success-high'
  if (rate >= 40) return 'success-medium'
  return 'success-low'
}

/**
 * Computed: Check if temporal data exists
 */
const hasTemporalData = computed(() => {
  return props.patterns.temporal_data && props.patterns.temporal_data.length > 0
})

/**
 * Computed: Timeline data (if available)
 * ✅ COMPLIANCE FIX: Only use real temporal data from backend, no mock data
 */
const companyTimelineData = computed(() => {
  if (!hasTemporalData.value) return { labels: [], datasets: [] }

  // ✅ Use temporal_data from backend (format: { labels: [...], datasets: [...] })
  // Backend should provide time series data from foundation posts
  return props.patterns.temporal_data
})

/**
 * Timeline chart options
 */
const timelineOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: MCKINSEY_COLORS.textDark,
        font: { size: 12 }
      }
    },
    y: {
      min: 0,
      max: 100,
      grid: {
        color: MCKINSEY_COLORS.gridLight,
        lineWidth: 1
      },
      ticks: {
        color: MCKINSEY_COLORS.textGray,
        font: { size: 12 },
        callback: function(value: any) {
          return value + '%'
        }
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 12,
        font: { size: 12 },
        color: MCKINSEY_COLORS.textDark,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: MCKINSEY_COLORS.textDark,
      titleColor: MCKINSEY_COLORS.white,
      bodyColor: MCKINSEY_COLORS.white,
      padding: 12,
      titleFont: { size: 13, weight: 600 },
      bodyFont: { size: 12 },
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
        }
      }
    }
  }
}))
</script>

<style scoped>
/* ===== Company Intelligence Section Styles ===== */

/* Narrative Block */
.narrative-block {
  margin-bottom: 32px;
}

.insight-text {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  font-weight: 400;
}

.insight-text strong {
  color: #111827;
  font-weight: 600;
}

/* Company Comparison Table */
.company-intelligence-table-wrapper {
  overflow-x: auto;
  margin-top: 16px;
  border: 1px solid #E5E7EB;
}

.company-comparison-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #FFFFFF;
  font-size: 14px;
}

.company-comparison-table thead {
  background-color: #F9FAFB;
}

.company-comparison-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #111827;
  border-bottom: 2px solid #E5E7EB;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.company-comparison-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #F3F4F6;
  color: #374151;
}

.company-comparison-table tbody tr {
  transition: all 0.2s ease;
}

.company-comparison-table tbody tr:hover {
  background-color: #F9FAFB;
  box-shadow: inset 0 0 0 1px #E5E7EB;
}

.company-comparison-table tbody tr.best-performer {
  background-color: #EFF6FF;
}

.company-comparison-table tbody tr.best-performer:hover {
  background-color: #DBEAFE;
}

.company-comparison-table tbody tr.worst-performer {
  background-color: var(--color-baby-blue);
}

.company-comparison-table tbody tr.worst-performer:hover {
  background-color: #BFDBFE;
}

.company-comparison-table .company-cell {
  font-weight: 600;
  color: #111827;
}

.company-comparison-table .success-rate-cell {
  font-weight: 600;
  color: #1E40AF;
}

/* Stage Comparison Table - McKinsey Professional Style */
.stage-comparison-table-wrapper {
  overflow-x: auto;
  margin-top: 16px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
}

.stage-comparison-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #FFFFFF;
  font-size: 13px;
}

.stage-comparison-table thead {
  background-color: #F9FAFB;
}

.stage-comparison-table th {
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  color: #111827;
  border-bottom: 2px solid #E5E7EB;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.stage-comparison-table th.company-col {
  text-align: left;
  min-width: 120px;
}

.stage-comparison-table th.stage-col {
  text-align: center;
  min-width: 80px;
}

.stage-comparison-table th.posts-col {
  text-align: center;
  min-width: 60px;
}

.stage-comparison-table tbody tr {
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #F3F4F6;
}

.stage-comparison-table tbody tr:hover {
  background-color: #F9FAFB;
}

.stage-comparison-table tbody tr:last-child {
  border-bottom: none;
}

.company-name-cell {
  font-weight: 600;
  color: #111827;
  padding: 12px 14px;
  position: relative;
}

/* Seed Company Row Highlighting */
.stage-comparison-table tbody tr.seed-company-row {
  background-color: #EFF6FF;
  border-left: 3px solid #2563EB;
}

.stage-comparison-table tbody tr.seed-company-row:hover {
  background-color: #DBEAFE;
}

.seed-company-badge {
  display: inline-block;
  margin-left: 6px;
  color: #2563EB;
  font-size: 14px;
  font-weight: bold;
}

.limited-data-note {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #FEF3C7;
  color: #92400E;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stage-rate-cell {
  text-align: center;
  padding: 12px 14px;
}

.posts-count-cell {
  text-align: center;
  font-weight: 500;
  color: #6B7280;
  padding: 12px 14px;
}

/* Rate Badges - McKinsey Color Scheme */
.rate-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  min-width: 45px;
  text-align: center;
}

.rate-badge.success-high {
  background-color: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

.rate-badge.success-medium {
  background-color: #E0F2FE;
  color: #0369A1;
  border: 1px solid #BAE6FD;
}

.rate-badge.success-low {
  background-color: #F3F4F6;
  color: #6B7280;
  border: 1px solid #D1D5DB;
}

.rate-na {
  color: #9CA3AF;
  font-size: 14px;
}

/* Stage Legend */
.stage-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F3F4F6;
  font-size: 12px;
  color: #6B7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid;
}

.legend-dot.success-high {
  background-color: #DBEAFE;
  border-color: #93C5FD;
}

.legend-dot.success-medium {
  background-color: #E0F2FE;
  border-color: #BAE6FD;
}

.legend-dot.success-low {
  background-color: #F3F4F6;
  border-color: #D1D5DB;
}

/* Chart Header and Hover Instruction */
.chart-wrapper {
  margin-bottom: 40px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 24px;
}

.header-text {
  flex: 1;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.chart-subtitle {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.6;
  margin: 0;
}

/* Hover instruction box */
.hover-instruction {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.cursor-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

/* Clean McKinsey-style Scatter Plot - Minimal Design */
.scatter-chart-minimal {
  position: relative;
  height: 500px;
  margin: 32px 0;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 24px;
}

/* Minimal legend with bubble size indicator */
.minimal-legend {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F3F4F6;
}

.legend-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9CA3AF;
}

.dot-example {
  border-radius: 50%;
  background: #2563EB;
  border: 1px solid #1E40AF;
}

.dot-example.small {
  width: 8px;
  height: 8px;
}

.dot-example.medium {
  width: 12px;
  height: 12px;
}

.dot-example.large {
  width: 16px;
  height: 16px;
}

/* Temporal Data Unavailable */
.temporal-unavailable {
  background-color: #FAFBFC;
}

.unavailable-message {
  text-align: center;
  padding: 48px 24px;
}

.unavailable-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.unavailable-text {
  font-size: 15px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 8px;
}

.unavailable-subtext {
  font-size: 13px;
  color: #9CA3AF;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.6;
}

.chart-container {
  height: 400px;
  position: relative;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

/* Data Source Badge Wrapper */
.chart-title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}

.chart-title-with-badge .chart-title {
  margin-bottom: 0;
}

.badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
