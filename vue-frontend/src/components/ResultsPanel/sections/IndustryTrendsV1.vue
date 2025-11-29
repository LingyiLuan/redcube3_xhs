<template>
  <!-- Industry Trends Section - McKinsey Style with Interactive Charts -->
  <section class="report-section industry-trends-mckinsey" v-if="hasTrendsData">
    <div class="section-header-with-badge">
      <h2 class="section-title">Industry Trends Analysis</h2>
      <DataSourceBadge type="benchmark" />
    </div>
    <div class="section-subtitle benchmark-subtitle">Based on {{ totalPosts }} interview experiences from all relevant posts ({{ dateRange }})</div>

    <!-- Insufficient Data Message -->
    <div v-if="insufficientData" class="insufficient-data-notice">
      <div class="notice-icon">⚠️</div>
      <div class="notice-content">
        <h3>Insufficient Data for Trend Analysis</h3>
        <p>{{ trends.message }}</p>
        <p class="data-summary">Total posts available: {{ trends.total_posts }}</p>
      </div>
    </div>

    <!-- Trends Available -->
    <template v-else>

      <!-- Executive Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalPosts }}</div>
          <div class="stat-label">Interview Posts</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ monthsAnalyzed }}</div>
          <div class="stat-label">Months Analyzed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ questionCount }}</div>
          <div class="stat-label">Question Trends</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ skillCount }}</div>
          <div class="stat-label">Skill Trends</div>
        </div>
      </div>

      <!-- 1. QUESTION TRENDS CHART -->
      <div class="chart-section">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Question Frequency Trends</h3>
            <p class="chart-description">Click questions below to show/hide their trend lines</p>
          </div>
        </div>

        <!-- Question Selector Buttons -->
        <div class="selector-grid">
          <button
            v-for="(question, index) in topQuestions"
            :key="question"
            @click="toggleQuestionVisibility(question)"
            :class="['selector-button', { active: isQuestionVisible(question), 'initially-visible': index < 3 }]"
          >
            <span class="button-label">{{ question }}</span>
            <span class="button-badge">{{ getQuestionTotal(question) }}</span>
          </button>
        </div>

        <!-- Line Chart -->
        <div class="chart-container">
          <Line :data="questionChartData" :options="questionChartOptions" />
        </div>
      </div>

      <!-- 2. SKILL TRENDS CHART -->
      <div class="chart-section">
        <div class="chart-header">
          <div>
            <h3 class="chart-title">Skill Frequency Trends</h3>
            <p class="chart-description">Click skills below to show/hide their trend lines</p>
          </div>
        </div>

        <!-- Skill Selector Buttons -->
        <div class="selector-grid">
          <button
            v-for="(skill, index) in topSkills"
            :key="skill"
            @click="toggleSkillVisibility(skill)"
            :class="['selector-button', { active: isSkillVisible(skill), 'initially-visible': index < 3 }]"
          >
            <span class="button-label">{{ skill }}</span>
            <span class="button-badge">{{ getSkillTotal(skill) }}</span>
          </button>
        </div>

        <!-- Line Chart -->
        <div class="chart-container">
          <Line :data="skillChartData" :options="skillChartOptions" />
        </div>
      </div>

      <!-- 3. TOP EMERGING TRENDS (McKinsey Data Table) -->
      <div class="insights-section">
        <h3 class="insights-title">Trending Analysis</h3>

        <!-- Combined Trending Topics (Questions + Skills) with Slope Chart -->
        <div v-if="trendingItems.length > 0" class="slope-chart-section">
          <div class="slope-chart-header">
            <p class="slope-chart-subtitle">
              Showing fastest-growing interview topics over the past {{ getTimeRangeLabel() }}
            </p>
          </div>

          <!-- Slope Chart Visualization -->
          <div class="slope-chart-container">
            <!-- Column Headers -->
            <div class="slope-chart-labels">
              <div class="period-label left">{{ getEarlyPeriodLabel() }}</div>
              <div class="period-label right">{{ getRecentPeriodLabel() }}</div>
            </div>

            <!-- Slope Chart Items -->
            <div class="slope-chart-items">
              <div
                v-for="(item, index) in trendingItems.slice(0, 8)"
                :key="item.name"
                class="slope-item"
              >
                <!-- Left Point (Early Period) -->
                <div class="slope-point left">
                  <span class="point-value">{{ item.early_count }}</span>
                  <div class="point-dot" :style="{ backgroundColor: getSlopeColor(index) }"></div>
                </div>

                <!-- Connecting Line -->
                <div class="slope-line-wrapper">
                  <svg class="slope-line" preserveAspectRatio="none" viewBox="0 0 100 20">
                    <line
                      x1="0" y1="10"
                      x2="100" y2="10"
                      :stroke="getSlopeColor(index)"
                      stroke-width="2"
                      stroke-dasharray="0"
                    />
                    <!-- Arrow head -->
                    <polygon
                      :points="`95,6 100,10 95,14`"
                      :fill="getSlopeColor(index)"
                    />
                  </svg>
                  <!-- Item Label (centered on line) -->
                  <div class="slope-label">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-type-badge" :class="item.type === 'question' ? 'badge-question' : 'badge-skill'">
                      {{ item.type === 'question' ? 'Q' : 'S' }}
                    </span>
                    <span class="item-change" :style="{ color: getSlopeColor(index) }">
                      +{{ item.absolute_change }} mentions
                    </span>
                  </div>
                </div>

                <!-- Right Point (Recent Period) -->
                <div class="slope-point right">
                  <div class="point-dot" :style="{ backgroundColor: getSlopeColor(index) }"></div>
                  <span class="point-value">{{ item.recent_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="slope-chart-legend">
            <div class="legend-item">
              <span class="legend-badge badge-question">Q</span>
              <span class="legend-text">Interview Question</span>
            </div>
            <div class="legend-item">
              <span class="legend-badge badge-skill">S</span>
              <span class="legend-text">Technical Skill</span>
            </div>
          </div>
        </div>

        <!-- Declining Trends (if any) -->
        <div v-if="decliningQuestions.length > 0" class="insight-table">
          <div class="table-header">
            <h4>Declining Questions</h4>
            <span class="table-subtitle">Significant decreases in frequency</span>
          </div>
          <table class="mckinsey-table">
            <thead>
              <tr>
                <th class="col-name">Question</th>
                <th class="col-metric">Early Period</th>
                <th class="col-metric">Recent Period</th>
                <th class="col-change">Change</th>
                <th class="col-severity">Severity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in decliningQuestions.slice(0, 5)" :key="item.question">
                <td class="col-name">{{ item.question }}</td>
                <td class="col-metric">{{ item.early_count }}</td>
                <td class="col-metric">{{ item.recent_count }}</td>
                <td class="col-change">
                  <span :class="getChangeClass(item.change_percent)">
                    {{ formatChange(item.change_percent) }}
                  </span>
                </td>
                <td class="col-severity">
                  <span :class="['severity-badge', getSeverityClass(item.severity)]">
                    {{ item.severity }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Data Source Attribution -->
      <div class="data-attribution">
        <p>Analysis based on {{ totalPosts }} relevant interview posts from {{ dateRange }}</p>
        <p class="timestamp">Generated {{ formatTimestamp(trends.analysis_timestamp) }}</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Extract temporal trends data
const trends = computed(() => props.patterns?.temporal_trends || null)
const hasTrendsData = computed(() => trends.value !== null)
const insufficientData = computed(() => trends.value?.insufficient_data === true)

const monthlyData = computed(() => trends.value?.monthly_data || {})
const summary = computed(() => trends.value?.summary || {})

const months = computed(() => monthlyData.value.months || [])
const questionTrends = computed(() => monthlyData.value.question_trends || {})
const skillTrends = computed(() => monthlyData.value.skill_trends || {})

const emergingQuestions = computed(() => summary.value.top_emerging_questions || [])
const emergingSkills = computed(() => summary.value.top_emerging_skills || [])
const decliningQuestions = computed(() => summary.value.top_declining_questions || [])
const decliningSkills = computed(() => summary.value.top_declining_skills || [])

// Combined trending items (questions + skills) sorted by absolute change
const trendingItems = computed(() => {
  const items: Array<{
    name: string
    type: 'question' | 'skill'
    early_count: number
    recent_count: number
    absolute_change: number
    change_percent: number | string
  }> = []

  // Add emerging questions
  emergingQuestions.value.forEach((q: any) => {
    items.push({
      name: q.question,
      type: 'question',
      early_count: q.early_count,
      recent_count: q.recent_count,
      absolute_change: q.recent_count - q.early_count,
      change_percent: q.change_percent
    })
  })

  // Add emerging skills
  emergingSkills.value.forEach((s: any) => {
    items.push({
      name: s.skill,
      type: 'skill',
      early_count: s.early_count,
      recent_count: s.recent_count,
      absolute_change: s.recent_count - s.early_count,
      change_percent: s.change_percent
    })
  })

  // Sort by absolute change (highest first)
  return items.sort((a, b) => b.absolute_change - a.absolute_change)
})

// Summary stats
const totalPosts = computed(() => summary.value.total_posts || 0)
const monthsAnalyzed = computed(() => summary.value.months_analyzed || 0)
const questionCount = computed(() => Object.keys(questionTrends.value).length)
const skillCount = computed(() => Object.keys(skillTrends.value).length)
const dateRange = computed(() => {
  const start = summary.value.date_range?.start || ''
  const end = summary.value.date_range?.end || ''
  return start && end ? `${start} to ${end}` : 'N/A'
})

// Top questions and skills (sorted by total frequency)
const topQuestions = computed(() => Object.keys(questionTrends.value))
const topSkills = computed(() => Object.keys(skillTrends.value))

// Visibility tracking
const visibleQuestions = ref<Set<string>>(new Set())
const visibleSkills = ref<Set<string>>(new Set())

// Initialize with top 3 visible
watch(topQuestions, (questions) => {
  if (questions.length > 0 && visibleQuestions.value.size === 0) {
    visibleQuestions.value = new Set(questions.slice(0, 3))
  }
}, { immediate: true })

watch(topSkills, (skills) => {
  if (skills.length > 0 && visibleSkills.value.size === 0) {
    visibleSkills.value = new Set(skills.slice(0, 3))
  }
}, { immediate: true })

// Toggle visibility
function toggleQuestionVisibility(question: string) {
  if (visibleQuestions.value.has(question)) {
    visibleQuestions.value.delete(question)
  } else {
    visibleQuestions.value.add(question)
  }
  // Force reactivity
  visibleQuestions.value = new Set(visibleQuestions.value)
}

function toggleSkillVisibility(skill: string) {
  if (visibleSkills.value.has(skill)) {
    visibleSkills.value.delete(skill)
  } else {
    visibleSkills.value.add(skill)
  }
  visibleSkills.value = new Set(visibleSkills.value)
}

function isQuestionVisible(question: string): boolean {
  return visibleQuestions.value.has(question)
}

function isSkillVisible(skill: string): boolean {
  return visibleSkills.value.has(skill)
}

// Get totals
function getQuestionTotal(question: string): number {
  const counts = questionTrends.value[question] || []
  return counts.reduce((a: number, b: number) => a + b, 0)
}

function getSkillTotal(skill: string): number {
  const counts = skillTrends.value[skill] || []
  return counts.reduce((a: number, b: number) => a + b, 0)
}

// Chart colors (McKinsey palette)
const chartColors = [
  '#0073E6', // McKinsey blue
  '#00A651', // Green
  '#F7901E', // Orange
  '#C8102E', // Red
  '#7A52C7', // Purple
  '#00B5E2', // Cyan
  '#FFB81C', // Yellow
  '#8CC63F', // Lime
  '#ED1C24', // Bright red
  '#0054A6'  // Dark blue
]

// Question Chart Data
const questionChartData = computed(() => {
  const datasets = Array.from(visibleQuestions.value).map((question, index) => {
    const data = questionTrends.value[question] || []
    const color = chartColors[index % chartColors.length]

    return {
      label: question,
      data: data,
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false
    }
  })

  return {
    labels: months.value.map(formatMonthLabel),
    datasets: datasets
  }
})

// Skill Chart Data
const skillChartData = computed(() => {
  const datasets = Array.from(visibleSkills.value).map((skill, index) => {
    const data = skillTrends.value[skill] || []
    const color = chartColors[index % chartColors.length]

    return {
      label: skill,
      data: data,
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false
    }
  })

  return {
    labels: months.value.map(formatMonthLabel),
    datasets: datasets
  }
})

// Chart Options (McKinsey style - clean, minimal)
const questionChartOptions = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        boxHeight: 12,
        padding: 15,
        font: {
          size: 11,
          family: "'Inter', sans-serif"
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1a202c',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label}: ${context.parsed.y} occurrences`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 10,
          family: "'Inter', sans-serif"
        },
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: '#f1f5f9'
      },
      ticks: {
        font: {
          size: 11,
          family: "'Inter', sans-serif"
        },
        precision: 0
      },
      title: {
        display: true,
        text: 'Frequency (occurrences)',
        font: {
          size: 11,
          family: "'Inter', sans-serif",
          weight: 600
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}))

const skillChartOptions = computed<ChartOptions<'line'>>(() => ({
  ...questionChartOptions.value,
  scales: {
    ...questionChartOptions.value.scales,
    y: {
      ...questionChartOptions.value.scales?.y,
      title: {
        display: true,
        text: 'Frequency (mentions)',
        font: {
          size: 11,
          family: "'Inter', sans-serif",
          weight: 600
        }
      }
    }
  }
}))

// Utility functions
function formatMonthLabel(month: string): string {
  const [rawYear = '', rawMonth = '1'] = month.split('-')
  const monthIndex = Math.max(0, Math.min(11, (parseInt(rawMonth, 10) || 1) - 1))
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const labelMonth = monthNames[monthIndex] ?? 'Jan'
  const year = rawYear || '20'
  return `${labelMonth} ${year.slice(-2)}`
}

function formatChange(change: number | string): string {
  if (change === 'NEW') return '🆕 NEW'
  if (typeof change === 'number') {
    return change > 0 ? `+${change}%` : `${change}%`
  }
  return String(change)
}

function getChangeClass(change: number | string): string {
  if (change === 'NEW') return 'change-new'
  if (typeof change === 'number') {
    if (change >= 100) return 'change-critical-up'
    if (change >= 50) return 'change-high-up'
    if (change > 0) return 'change-up'
    if (change <= -50) return 'change-critical-down'
    if (change < 0) return 'change-down'
  }
  return 'change-neutral'
}

function getSeverityClass(severity: string): string {
  const classes: Record<string, string> = {
    'Critical': 'severity-critical',
    'High': 'severity-high',
    'Medium': 'severity-medium',
    'Low': 'severity-low'
  }
  return classes[severity] || 'severity-medium'
}

function formatTimestamp(timestamp: string): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Slope Chart Helper Functions
function getTimeRangeLabel(): string {
  const analyzed = monthsAnalyzed.value
  if (analyzed >= 12) return `${Math.floor(analyzed / 12)} year${analyzed >= 24 ? 's' : ''}`
  return `${analyzed} months`
}

function getEarlyPeriodLabel(): string {
  const start = summary.value.date_range?.start
  if (!start) return 'Early Period'
  const date = new Date(start)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getRecentPeriodLabel(): string {
  const end = summary.value.date_range?.end
  if (!end) return 'Recent Period'
  const date = new Date(end)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function getSlopeColor(index: number): string {
  // Gradient from dark navy to light blue (McKinsey professional colors)
  const colors = [
    '#1E40AF', // Dark navy (highest momentum)
    '#2563EB', // Primary blue
    '#3B82F6', // Medium blue
    '#60A5FA', // Light blue
    '#93C5FD', // Lighter blue
    '#BFDBFE', // Very light blue
    '#DBEAFE', // Pale blue
    '#EFF6FF'  // Lightest blue (lowest momentum)
  ]
  return colors[index % colors.length]
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

.benchmark-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 24px;
  font-weight: 500;
}

.industry-trends-mckinsey {
  margin-bottom: 60px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.section-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
  font-weight: 400;
}

/* Insufficient Data */
.insufficient-data-notice {
  display: flex;
  gap: 20px;
  padding: 32px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  margin-bottom: 32px;
}

.notice-icon {
  font-size: 32px;
}

.notice-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 8px 0;
}

.notice-content p {
  font-size: 14px;
  color: #78350f;
  margin: 4px 0;
}

.data-summary {
  font-weight: 600;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #0073E6;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Chart Section */
.chart-section {
  margin-bottom: 56px;
}

.chart-header {
  margin-bottom: 24px;
}

.chart-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.chart-description {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Selector Grid */
.selector-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.selector-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.selector-button:hover {
  border-color: #0073E6;
  background: #eff6ff;
}

.selector-button.active {
  background: #0073E6;
  border-color: #0073E6;
  color: white;
}

.selector-button.initially-visible {
  border-color: #0073E6;
}

.button-label {
  flex: 1;
}

.button-badge {
  background: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.selector-button.active .button-badge {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Chart Container */
.chart-container {
  height: 400px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

/* Insights Section (McKinsey Data Tables) */
.insights-section {
  margin-top: 56px;
}

.insights-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 32px;
}

.insight-table {
  margin-bottom: 40px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1a202c;
}

.table-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.table-subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

/* McKinsey-style Table */
.mckinsey-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 13px;
}

.mckinsey-table thead {
  background: #f8fafc;
}

.mckinsey-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}

.mckinsey-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.mckinsey-table tbody tr:hover {
  background: #f8fafc;
}

.col-name {
  font-weight: 600;
  color: #1a202c;
}

.col-metric {
  text-align: right;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.col-change {
  text-align: right;
  font-weight: 700;
}

.col-severity {
  text-align: center;
}

/* Change Classes */
.change-new {
  color: #8b5cf6;
}

.change-critical-up {
  color: #dc2626;
}

.change-high-up {
  color: #f59e0b;
}

.change-up {
  color: #10b981;
}

.change-critical-down {
  color: #64748b;
}

.change-down {
  color: #94a3b8;
}

.change-neutral {
  color: #64748b;
}

/* Severity Badges */
.severity-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.severity-critical {
  background: #dc2626;
  color: white;
}

.severity-high {
  background: #f59e0b;
  color: white;
}

.severity-medium {
  background: #0073E6;
  color: white;
}

.severity-low {
  background: #64748b;
  color: white;
}

/* Data Attribution */
.data-attribution {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.data-attribution p {
  margin: 4px 0;
}

.timestamp {
  font-weight: 600;
}

/* ===== Slope Chart Styles ===== */
.slope-chart-section {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-top: 16px;
}

.slope-chart-header {
  margin-bottom: 24px;
}

.slope-chart-subtitle {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
  font-weight: 500;
}

.slope-chart-container {
  padding: 16px 0;
}

.slope-chart-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 120px;
  margin-bottom: 16px;
}

.period-label {
  font-size: 12px;
  font-weight: 700;
  color: #1F2937;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.period-label.left {
  text-align: left;
}

.period-label.right {
  text-align: right;
}

.slope-chart-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slope-item {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: center;
  gap: 16px;
  min-height: 40px;
}

.slope-point {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slope-point.left {
  justify-content: flex-end;
}

.slope-point.right {
  justify-content: flex-start;
}

.point-value {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  min-width: 40px;
  text-align: center;
}

.point-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.slope-line-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
}

.slope-line {
  width: 100%;
  height: 20px;
}

.slope-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #FFFFFF;
  padding: 4px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.item-name {
  font-size: 12px;
  font-weight: 600;
  color: #1F2937;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-type-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.item-type-badge.badge-question {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.item-type-badge.badge-skill {
  background-color: #FEF3C7;
  color: #92400E;
}

.item-change {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.slope-chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #E5E7EB;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.legend-badge.badge-question {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.legend-badge.badge-skill {
  background-color: #FEF3C7;
  color: #92400E;
}

.legend-text {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
}
</style>
