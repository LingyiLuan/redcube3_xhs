<template>
  <section class="report-section" v-if="patterns.question_distribution && patterns.question_distribution.length > 0">
    <div class="section-header-with-badge">
      <h2 class="section-title">Topic Breakdown</h2>
      <DataSourceBadge type="personalized" />
    </div>
    <p class="section-subtitle personalized-subtitle">Based on 50 interviews similar to yours</p>
    <div class="narrative-block">
      <p class="insight-text">
        Most discussions center around coding and system design challenges.
        <strong>{{ patterns.question_distribution[0]?.type }}</strong> questions dominate at
        {{ patterns.question_distribution[0]?.percentage }}%, followed by
        {{ patterns.question_distribution[1]?.type }} at {{ patterns.question_distribution[1]?.percentage }}%.
      </p>
    </div>

    <div class="dual-chart-layout">
      <div class="chart-wrapper">
        <div class="chart-header">
          <h3 class="chart-title">Interview Topic Distribution</h3>
        </div>
        <div class="chart-container medium">
          <Doughnut :data="topicBreakdownPieData" :options="pieChartOptions" />
        </div>
      </div>

      <div class="chart-wrapper">
        <div class="chart-header">
          <h3 class="chart-title">Topics by Company</h3>
        </div>
        <div class="chart-container medium">
          <Bar :data="topicByCompanyData" :options="stackedBarOptions" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { MCKINSEY_COLORS } from '@/composables/useChartHelpers'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Computed: Topic Breakdown Pie Chart Data
 */
const topicBreakdownPieData = computed(() => {
  if (!props.patterns.question_distribution) return { labels: [], datasets: [] }
  return {
    labels: props.patterns.question_distribution.map((q: any) => q.type),
    datasets: [{
      data: props.patterns.question_distribution.map((q: any) => q.count),
      backgroundColor: [
        MCKINSEY_COLORS.primaryBlue,
        MCKINSEY_COLORS.secondaryBlue,
        MCKINSEY_COLORS.lightBlue,
        MCKINSEY_COLORS.paleBlue,
        '#E5E7EB'
      ],
      borderWidth: 2,
      borderColor: MCKINSEY_COLORS.white
    }]
  }
})

/**
 * Pie Chart Options
 */
const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { left: 10, right: 10, top: 10, bottom: 10 }
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
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 }
    }
  }
}

/**
 * Computed: Topic by Company Stacked Bar Chart Data
 * Uses real backend data from comparative_table.question_type_breakdown
 */
const topicByCompanyData = computed(() => {
  console.log('[TopicBreakdownV1] Full patterns object:', props.patterns)
  console.log('[TopicBreakdownV1] comparative_table:', props.patterns.comparative_table)

  if (!props.patterns.comparative_table || props.patterns.comparative_table.length === 0) {
    console.log('[TopicBreakdownV1] ❌ No comparative_table data')
    return { labels: [], datasets: [] }
  }

  // Get top 5 companies
  const topCompanies = props.patterns.comparative_table.slice(0, 5)
  const companyLabels = topCompanies.map((c: any) => c.company)

  console.log('[TopicBreakdownV1] Top companies:', topCompanies.map((c: any) => ({
    company: c.company,
    question_type_breakdown: c.question_type_breakdown,
    has_breakdown: !!c.question_type_breakdown,
    breakdown_keys: c.question_type_breakdown ? Object.keys(c.question_type_breakdown) : []
  })))

  // Log the FULL first company object to see everything
  if (topCompanies.length > 0) {
    console.log('[TopicBreakdownV1] 🔍 FULL first company object:', topCompanies[0])
    console.log('[TopicBreakdownV1] 🔍 First company keys:', Object.keys(topCompanies[0]))
    console.log('[TopicBreakdownV1] 🔍 question_type_breakdown value:', topCompanies[0].question_type_breakdown)
  }

  // Get all question types from question_distribution (sorted by frequency)
  const topicTypes = props.patterns.question_distribution
    .map((q: any) => q.type)
    .filter((type: string) => type !== 'other') // Exclude 'other' category from chart

  console.log('[TopicBreakdownV1] Topic types:', topicTypes)

  // Build datasets - one per question type
  const datasets = topicTypes.map((type: string, idx: number) => {
    const data = topCompanies.map((company: any) => {
      // Use real question_type_breakdown data from backend
      if (company.question_type_breakdown && company.question_type_breakdown[type] !== undefined) {
        const value = company.question_type_breakdown[type]
        console.log(`[TopicBreakdownV1] ${company.company} - ${type}: ${value}%`)
        return value // Percentage value (0-100)
      }
      console.log(`[TopicBreakdownV1] ${company.company} - ${type}: NO DATA (returning 0)`)
      return 0 // If no data for this type, show 0
    })

    return {
      label: type,
      data,
      backgroundColor: [
        MCKINSEY_COLORS.primaryBlue,
        MCKINSEY_COLORS.secondaryBlue,
        MCKINSEY_COLORS.lightBlue,
        MCKINSEY_COLORS.paleBlue,
        '#E5E7EB'
      ][idx % 5],
      borderRadius: 4
    }
  })

  console.log('[TopicBreakdownV1] Final chart data:', { labels: companyLabels, datasets })

  return { labels: companyLabels, datasets }
})

/**
 * Stacked Bar Chart Options
 */
const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { left: 0, right: 20, top: 10, bottom: 0 }
  },
  scales: {
    x: {
      stacked: true,
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: MCKINSEY_COLORS.textDark,
        font: { size: 11, weight: '500' }
      }
    },
    y: {
      stacked: true,
      border: { display: false },
      grid: {
        color: MCKINSEY_COLORS.gridLight,
        lineWidth: 1
      },
      ticks: {
        color: MCKINSEY_COLORS.textGray,
        font: { size: 11 },
        callback: (value: number) => value + '%'
      },
      min: 0,
      max: 100
    }
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 12,
        font: { size: 11 },
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
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y || 0
          return `${label}: ${value.toFixed(1)}%`
        }
      }
    }
  }
}
</script>

<style>
@import '@/assets/mckinsey-report-shared.css';
</style>

<style scoped>
/* Section Header with Badge */
.section-header-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.personalized-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 24px;
  font-weight: 500;
}
</style>
