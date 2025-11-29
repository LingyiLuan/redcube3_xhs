<template>
  <section class="company-intelligence" v-if="hasCompanyData">
    <h2 class="section-title">Company Intelligence</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="insight-text">
        {{ companyNarrative }}
      </p>
    </div>

    <!-- Component 1: Comparison Table -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Company-by-Company Comparison</h3>
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
            <tr
              v-for="(company, idx) in topCompanies"
              :key="company.name"
              :class="{
                'best-performer': idx === 0,
                'worst-performer': idx === topCompanies.length - 1 && topCompanies.length > 3
              }">
              <td class="company-cell">{{ company.name }}</td>
              <td>{{ company.interviewCount }}</td>
              <td class="success-rate-cell">{{ company.successRate }}%</td>
              <td>{{ company.difficulty }}/5</td>
              <td>{{ company.topSkill }}</td>
              <td>{{ company.topRole }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Component 2: Success vs Difficulty Scatter Plot -->
    <div class="chart-wrapper">
      <!-- Chart header with title and hover instruction -->
      <div class="chart-header">
        <div class="header-text">
          <h3 class="chart-title">Success Rate vs Interview Difficulty Matrix</h3>
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

      <div class="scatter-chart-container-clean">
        <div class="chart-container">
          <Scatter :data="scatterData" :options="scatterOptions" />
        </div>
      </div>

      <!-- Interpretation Guide -->
      <div class="scatter-interpretation">
        <div class="interp-grid">
          <div class="interp-item">
            <div class="interp-icon">🎯</div>
            <div class="interp-text">
              <strong>Top Right:</strong> High success + Hard interviews (competitive but rewarding)
            </div>
          </div>
          <div class="interp-item">
            <div class="interp-icon">✅</div>
            <div class="interp-text">
              <strong>Top Left:</strong> High success + Easy interviews (good opportunities)
            </div>
          </div>
          <div class="interp-item">
            <div class="interp-icon">⚠️</div>
            <div class="interp-text">
              <strong>Bottom Right:</strong> Low success + Hard interviews (challenging)
            </div>
          </div>
          <div class="interp-item">
            <div class="interp-icon">📉</div>
            <div class="interp-text">
              <strong>Bottom Left:</strong> Low success + Easy interviews (need improvement)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insights Callouts -->
    <div class="insights-row">
      <InsightCallout
        v-if="highSuccessRateCompanies.length > 0"
        type="success"
        title="High Success Companies"
        :message="`${highSuccessRateCompanies.map(c => c.name).join(', ')} show success rates above 70%.`"
      />
      <InsightCallout
        v-if="highDifficultyCompanies.length > 0"
        type="warning"
        title="Challenging Interviews"
        :message="`${highDifficultyCompanies.map(c => c.name).join(', ')} are rated as high difficulty (≥4.0/5).`"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
// @ts-nocheck
import { computed } from 'vue'
import { Scatter } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js'
import { useCompanyAnalysis } from '@/composables/useCompanyAnalysis'
import { useChartConfig } from '@/composables/useChartConfig'
import InsightCallout from '../widgets/InsightCallout.vue'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip, Legend)

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Use composables
const {
  topCompaniesWithMetrics,
  companiesForScatterPlot,
  highSuccessRateCompanies,
  highDifficultyCompanies,
  companyNarrative
} = useCompanyAnalysis(props.patterns)

const { getScatterPlotConfig } = useChartConfig()

/**
 * Check if we have company data
 */
const hasCompanyData = computed(() => {
  return props.patterns.company_trends && props.patterns.company_trends.length > 0
})

/**
 * Top 10 companies for table
 */
const topCompanies = computed(() => {
  return topCompaniesWithMetrics.value.slice(0, 10).map(company => ({
    name: company.name,
    interviewCount: company.interviewCount,
    successRate: company.successRate,
    difficulty: company.difficulty.toFixed(1),
    topSkill: getTopSkillForCompany(company.name),
    topRole: getTopRoleForCompany(company.name)
  }))
})

/**
 * Top 3 high success companies (≥70%)
 */
const topHighSuccessCompanies = computed(() => {
  return highSuccessRateCompanies.value.slice(0, 3)
})

/**
 * Top 3 high difficulty companies (≥4.0/5)
 */
const topHighDifficultyCompanies = computed(() => {
  return highDifficultyCompanies.value.slice(0, 3)
})

/**
 * Scatter plot data
 */
const scatterData = computed(() => {
  const datasets = companiesForScatterPlot.value.map(company => ({
    label: company.name,
    data: [{
      x: company.x,
      y: company.y,
      r: company.size
    }],
    backgroundColor: company.color + '80', // Add transparency
    borderColor: company.color,
    borderWidth: 2
  }))

  return { datasets }
})

/**
 * Scatter plot options
 */
const scatterOptions = computed(() => {
  return getScatterPlotConfig({
    // Allow points to render outside chart area to prevent edge clipping
    clip: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Interview Difficulty, scale (1 = easier; 5 = harder)',
          color: '#6B7280',
          font: { size: 12, weight: '500' }
        },
        min: 0,
        max: 5.3, // Add buffer to prevent clipping at edge (was 5)
        ticks: {
          stepSize: 1,
          callback: (value: any) => {
            // Only show integer labels 0-5
            return Number.isInteger(value) && value <= 5 ? value : ''
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Success Rate, percentage (0% = lower; 100% = higher)',
          color: '#6B7280',
          font: { size: 12, weight: '500' }
        },
        min: 0,
        max: 105, // Add 5% buffer to prevent clipping at edge (was 100)
        ticks: {
          stepSize: 20,
          callback: (value: any) => {
            // Show labels with % suffix, only up to 100%
            return value <= 100 ? value + '%' : ''
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false // Too many companies for legend
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const company = companiesForScatterPlot.value[context.datasetIndex]
            return [
              `Company: ${company.name}`,
              `Difficulty: ${company.x.toFixed(1)}/5`,
              `Success Rate: ${company.y.toFixed(1)}%`,
              `Interviews: ${Math.round((company.size / 24) * 100)}` // Approximate from bubble size
            ]
          }
        }
      }
    }
  })
})

/**
 * Get top skill for a company from patterns data
 */
function getTopSkillForCompany(companyName: string): string {
  const companyTrend = props.patterns.company_trends?.find((c: any) => c.company === companyName)
  return companyTrend?.top_skills?.[0] || 'N/A'
}

/**
 * Get top role for a company from patterns data
 */
function getTopRoleForCompany(companyName: string): string {
  const companyTrend = props.patterns.company_trends?.find((c: any) => c.company === companyName)
  return companyTrend?.common_roles?.[0] || 'N/A'
}
</script>

<style scoped>
.company-intelligence {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

.narrative-block {
  margin-bottom: 32px;
}

.insight-text {
  font-size: 16px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
}

.chart-wrapper {
  margin-bottom: 40px;
}

/* Chart header with title and hover instruction */
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
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 8px 0;
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

/* Company Comparison Table */
.company-intelligence-table-wrapper {
  overflow-x: auto;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
}

.company-comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.company-comparison-table thead {
  background: #F9FAFB;
}

.company-comparison-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #E5E7EB;
}

.company-comparison-table td {
  padding: 12px 16px;
  color: #1F2937;
  border-bottom: 1px solid #E5E7EB;
}

.company-comparison-table tbody tr:hover {
  background: #F9FAFB;
}

.company-cell {
  font-weight: 600;
  color: #1E40AF;
}

.success-rate-cell {
  font-weight: 600;
  color: #059669;
}

.best-performer {
  background: linear-gradient(90deg, #D1FAE5 0%, transparent 100%) !important;
}

.worst-performer {
  background: linear-gradient(90deg, #FEE2E2 0%, transparent 100%) !important;
}

/* Scatter Chart */
.scatter-chart-container-clean {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
}

.chart-container {
  height: 400px;
  position: relative;
}

/* Interpretation Grid */
.scatter-interpretation {
  background: #FFFBEB;
  border: 1px solid #FCD34D;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.interp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.interp-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.interp-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.interp-text {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}

.interp-text strong {
  color: #1F2937;
  font-weight: 600;
}

/* Insights Row */
.insights-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
}

/* Responsive */
@media (max-width: 1024px) {
  .chart-header {
    flex-direction: column;
    gap: 16px;
  }

  .hover-instruction {
    width: 100%;
    justify-content: center;
  }

  .interp-grid {
    grid-template-columns: 1fr;
  }

  .insights-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .company-intelligence {
    padding: 20px;
  }

  .section-title {
    font-size: 20px;
  }

  .chart-title {
    font-size: 16px;
  }

  .company-comparison-table {
    font-size: 12px;
  }

  .company-comparison-table th,
  .company-comparison-table td {
    padding: 8px 12px;
  }
}
</style>
