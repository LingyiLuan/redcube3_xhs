<template>
  <section class="report-section skill-landscape-analysis">
    <div class="section-header-with-badge">
      <h2 class="section-title">Skill Landscape Analysis</h2>
      <DataSourceBadge type="personalized" />
    </div>
    <p class="section-subtitle personalized-subtitle">Based on 50 interviews similar to yours</p>

    <!-- Narrative Block -->
    <p class="body-text" v-if="patterns.skill_narrative">
      {{ patterns.skill_narrative }}
    </p>
    <p class="body-text" v-else>
      Our analysis identifies {{ criticalSkillsCount }} critical high-demand skills across
      {{ patterns.skill_frequency?.length || 0 }} distinct technical competencies.
      The chart below visualizes skill demand frequency across all analyzed interview experiences,
      with higher percentages indicating skills that appear more frequently in successful interview outcomes.
    </p>

    <!-- Chart with Percentage Labels Overlay -->
    <div class="chart-wrapper">
      <div class="chart-container-with-labels">
        <Bar
          :data="skillChartData"
          :options="skillChartOptions"
        />

        <!-- Percentage Labels Overlay -->
        <div class="skill-bar-labels">
          <div
            v-for="(skill, idx) in topSkills"
            :key="idx"
            class="skill-label-row"
            :class="{ 'top-skill': idx === 0 }"
          >
            <span class="skill-percentage">{{ skill.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { MCKINSEY_COLORS } from '@/composables/useChartHelpers'
import { getCriticalSkillsCount } from '@/utilities/reportHelpers'
import { getSkillName } from '@/composables/useReportFormatters'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Count of critical skills for narrative summary
 */
const criticalSkillsCount = computed(() => {
  return getCriticalSkillsCount(props.patterns.skill_frequency)
})

/**
 * Top 10 skills for display
 */
const topSkills = computed(() => {
  if (!props.patterns.skill_frequency) return []
  return props.patterns.skill_frequency.slice(0, 10)
})

/**
 * Chart.js data configuration for skill frequency bar chart
 */
const skillChartData = computed(() => {
  if (!props.patterns.skill_frequency || props.patterns.skill_frequency.length === 0) {
    return {
      labels: ['No data available'],
      datasets: [{
        label: 'Skill Frequency',
        data: [0],
        backgroundColor: MCKINSEY_COLORS.paleBlue,
        borderColor: MCKINSEY_COLORS.borderGray,
        borderWidth: 1
      }]
    }
  }

  const top10 = props.patterns.skill_frequency.slice(0, 10)

  return {
    labels: top10.map((s: any) => getSkillName(s)),
    datasets: [{
      label: 'Demand Frequency (%)',
      data: top10.map((s: any) => s.percentage || 0),
      backgroundColor: top10.map((_: any, idx: number) =>
        idx === 0 ? MCKINSEY_COLORS.primaryBlue : MCKINSEY_COLORS.secondaryBlue
      ),
      borderColor: MCKINSEY_COLORS.borderGray,
      borderWidth: 1,
      borderRadius: 4,
      barThickness: 28,
      maxBarThickness: 32
    }]
  }
})

/**
 * Chart.js options configuration for skill frequency bar chart
 */
const skillChartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: MCKINSEY_COLORS.textDark,
      padding: 12,
      titleColor: MCKINSEY_COLORS.white,
      bodyColor: MCKINSEY_COLORS.white,
      borderColor: MCKINSEY_COLORS.borderGray,
      borderWidth: 1,
      displayColors: false,
      callbacks: {
        label: function(context: any) {
          return `${context.parsed.x}% of interviews`
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      grid: {
        color: MCKINSEY_COLORS.gridLight,
        drawBorder: false
      },
      ticks: {
        color: MCKINSEY_COLORS.textGray,
        font: {
          size: 11,
          weight: '500'
        },
        callback: function(value: any) {
          return value + '%'
        }
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        color: MCKINSEY_COLORS.textDark,
        font: {
          size: 13,
          weight: '500'
        },
        padding: 12,
        autoSkip: false
      },
      border: {
        display: false
      }
    }
  },
  layout: {
    padding: {
      left: 10,
      right: 80, // Space for percentage labels
      top: 10,
      bottom: 10
    }
  }
}))
</script>

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

/* Skill Landscape Analysis Section */
.skill-landscape-analysis {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

/* Chart Wrapper */
.chart-wrapper {
  margin-top: 24px;
}

/* Chart Container with Labels */
.chart-container-with-labels {
  position: relative;
  height: 400px;
}

/* Skill Bar Labels Overlay */
.skill-bar-labels {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 52px 20px 35px 0; /* Align with chart bars */
  pointer-events: none; /* Don't block chart interactions */
}

.skill-label-row {
  height: calc(100% / 10); /* 10 bars */
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.skill-percentage {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 3px;
}

.skill-label-row.top-skill .skill-percentage {
  color: #1E40AF;
  font-weight: 700;
}

/* Responsive Design */
@media (max-width: 768px) {
  .skill-landscape-analysis {
    padding: 16px;
  }

  .chart-container-with-labels {
    height: 320px;
  }

  .skill-bar-labels {
    padding: 42px 12px 28px 0;
  }

  .skill-percentage {
    font-size: 11px;
    padding: 1px 4px;
  }
}
</style>
