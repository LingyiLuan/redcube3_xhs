<template>
  <div class="learning-map-header">
    <!-- Key Metrics Cards -->
    <div class="metrics-grid">
      <div class="metric-card">
        <ChartBarIcon class="metric-icon" />
        <div class="metric-content">
          <p class="metric-label">Posts Analyzed</p>
          <p class="metric-value">{{ analytics.totalPosts || 0 }}</p>
        </div>
      </div>

      <div class="metric-card">
        <BuildingOfficeIcon class="metric-icon" />
        <div class="metric-content">
          <p class="metric-label">Companies</p>
          <p class="metric-value">{{ analytics.totalCompanies || 0 }}</p>
        </div>
      </div>

      <div class="metric-card">
        <CheckCircleIcon class="metric-icon" />
        <div class="metric-content">
          <p class="metric-label">Success Rate</p>
          <p class="metric-value">{{ successRatePercent }}%</p>
        </div>
      </div>

      <div class="metric-card">
        <SparklesIcon class="metric-icon" />
        <div class="metric-content">
          <p class="metric-label">Personalization</p>
          <p class="metric-value">{{ personalizationPercent }}%</p>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid">
      <!-- Topic Frequency Chart -->
      <div class="chart-card">
        <h4 class="chart-title">Top Topics</h4>
        <Bar
          v-if="topicChartData"
          :data="topicChartData"
          :options="chartOptions"
          class="chart"
        />
      </div>

      <!-- Company Breakdown Chart -->
      <div class="chart-card">
        <h4 class="chart-title">Company Coverage</h4>
        <Doughnut
          v-if="companyChartData"
          :data="companyChartData"
          :options="doughnutOptions"
          class="chart"
        />
      </div>

      <!-- Success Rate by Topic -->
      <div class="chart-card">
        <h4 class="chart-title">Success Rates</h4>
        <Bar
          v-if="successRateChartData"
          :data="successRateChartData"
          :options="successRateOptions"
          class="chart"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  analytics: {
    topicFrequency?: Record<string, number>
    companyBreakdown?: Record<string, number>
    successRateByTopic?: Record<string, number>
    totalCompanies?: number
    totalSkillsIdentified?: number
    overallSuccessRate?: number
    totalPosts?: number
  }
  personalizationScore?: number
}

const props = withDefaults(defineProps<Props>(), {
  personalizationScore: 0.85
})

// Computed metrics
const successRatePercent = computed(() => {
  return ((props.analytics.overallSuccessRate || 0) * 100).toFixed(0)
})

const personalizationPercent = computed(() => {
  return ((props.personalizationScore || 0) * 100).toFixed(0)
})

// Topic Frequency Chart Data
const topicChartData = computed(() => {
  if (!props.analytics.topicFrequency) return null

  const sorted = Object.entries(props.analytics.topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8) // Top 8 topics

  return {
    labels: sorted.map(([topic]) => topic),
    datasets: [{
      label: 'Mentions',
      data: sorted.map(([, count]) => count),
      backgroundColor: 'rgba(30, 58, 95, 0.8)',
      borderColor: 'rgba(30, 58, 95, 1)',
      borderWidth: 2,
      borderRadius: 6
    }]
  }
})

// Company Breakdown Chart Data
const companyChartData = computed(() => {
  if (!props.analytics.companyBreakdown) return null

  const sorted = Object.entries(props.analytics.companyBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6) // Top 6 companies

  return {
    labels: sorted.map(([company]) => company),
    datasets: [{
      data: sorted.map(([, count]) => count),
      backgroundColor: [
        '#2563eb',
        '#22c55e',
        '#f59e0b',
        '#a855f7',
        '#ef4444',
        '#14b8a6'
      ],
      borderWidth: 0
    }]
  }
})

// Success Rate Chart Data
const successRateChartData = computed(() => {
  if (!props.analytics.successRateByTopic) return null

  const sorted = Object.entries(props.analytics.successRateByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return {
    labels: sorted.map(([topic]) => topic),
    datasets: [{
      label: 'Success Rate',
      data: sorted.map(([, rate]) => (rate * 100).toFixed(0)),
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      borderRadius: 6
    }]
  }
})

// Chart Options - Professional Theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 1,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#FFFFFF',
      titleColor: '#111827',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: '#6B7280',
        font: {
          family: 'Inter, -apple-system, sans-serif',
          size: 11
        }
      },
      grid: {
        color: '#F3F4F6'
      }
    },
    x: {
      ticks: {
        color: '#6B7280',
        font: {
          family: 'Inter, -apple-system, sans-serif',
          size: 11
        }
      },
      grid: {
        color: '#F3F4F6'
      }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 1,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#374151',
        font: {
          family: 'Inter, -apple-system, sans-serif',
          size: 11
        },
        padding: 12
      }
    },
    tooltip: {
      backgroundColor: '#FFFFFF',
      titleColor: '#111827',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12
    }
  }
}

const successRateOptions = {
  ...chartOptions,
  scales: {
    ...chartOptions.scales,
    y: {
      ...chartOptions.scales.y,
      max: 100,
      ticks: {
        ...chartOptions.scales.y.ticks,
        callback: (value: number) => value + '%'
      }
    }
  }
}
</script>

<style scoped>
/* === PROFESSIONAL MCKINSEY THEME FOR ANALYTICS HEADER === */

.learning-map-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: #1E3A5F;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.06);
}

.metric-icon {
  width: 32px;
  height: 32px;
  color: #1E3A5F;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 11px;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: 'Inter', -apple-system, sans-serif;
}

.metric-value {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.chart-card {
  padding: 20px;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  min-height: 250px;
  max-height: 300px;
  transition: all 0.2s ease;
}

.chart-card:hover {
  border-color: #1E3A5F;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.06);
}

.chart-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
  font-family: 'Inter', -apple-system, sans-serif;
}

.chart {
  height: 192px;
  max-height: 192px;
  width: 100%;
  max-width: 100%;
  position: relative;
}

/* Responsive */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
