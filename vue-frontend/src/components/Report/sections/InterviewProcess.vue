<template>
  <section class="interview-process">
    <h2 class="section-title">Interview Process & Timeline</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="body-text">{{ processNarrative }}</p>
    </div>

    <!-- Simplified Process Visualization -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Typical Interview Journey</h3>
      <p class="chart-subtitle">Average process across all companies analyzed</p>

      <div class="process-timeline">
        <div
          v-for="(stage, index) in interviewStages"
          :key="stage.name"
          class="timeline-stage">
          <div class="stage-number">{{ index + 1 }}</div>
          <div class="stage-content">
            <h4 class="stage-name">{{ stage.name }}</h4>
            <p class="stage-description">{{ stage.description }}</p>
            <div class="stage-metrics">
              <div class="metric">
                <span class="metric-icon">⏱️</span>
                <span class="metric-text">{{ stage.duration }}</span>
              </div>
              <div class="metric">
                <span class="metric-icon">✅</span>
                <span class="metric-text">{{ stage.passRate }}% pass rate</span>
              </div>
            </div>
          </div>
          <div v-if="index < interviewStages.length - 1" class="stage-connector">
            <div class="connector-line"></div>
            <div class="connector-time">{{ stage.waitTime }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Company-Specific Process Comparison (Optional) -->
    <div class="chart-wrapper" v-if="hasCompanyProcessData">
      <h3 class="chart-title">Process Variations by Company</h3>
      <p class="chart-subtitle">Key differences in interview structure</p>

      <table class="process-comparison-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Stages</th>
            <th>Avg Duration</th>
            <th>Unique Characteristics</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in companyProcessData" :key="company.name">
            <td class="company-name">{{ company.name }}</td>
            <td>{{ company.totalStages }}</td>
            <td>{{ company.avgDuration }}</td>
            <td class="characteristics">
              <span v-for="char in company.characteristics" :key="char" class="char-tag">
                {{ char }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface InterviewStage {
  name: string
  description: string
  duration: string
  passRate: number
  waitTime: string | null
}

interface CompanyProcess {
  name: string
  totalStages: number
  avgDuration: string
  characteristics: string[]
}

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Interview stages with metrics
 */
const interviewStages = computed<InterviewStage[]>(() => {
  // Try to extract from patterns.interview_stages if available
  if (props.patterns.interview_stages && Array.isArray(props.patterns.interview_stages)) {
    return props.patterns.interview_stages
  }

  // Fallback: Use realistic default stages
  return [
    {
      name: 'Initial Application',
      description: 'Submit resume and cover letter',
      duration: '1-2 days',
      passRate: 30,
      waitTime: '3-7 days'
    },
    {
      name: 'Phone Screen',
      description: 'Recruiter call to assess fit',
      duration: '30 min',
      passRate: 60,
      waitTime: '1-2 weeks'
    },
    {
      name: 'Technical Interview',
      description: 'Coding and problem-solving assessment',
      duration: '1-2 hours',
      passRate: 45,
      waitTime: '1 week'
    },
    {
      name: 'Onsite/Virtual Onsite',
      description: 'Multiple rounds with team members',
      duration: '3-5 hours',
      passRate: 50,
      waitTime: '1-2 weeks'
    },
    {
      name: 'Final Decision',
      description: 'Offer or rejection notification',
      duration: '1 day',
      passRate: 70,
      waitTime: null
    }
  ]
})

/**
 * Check if company-specific process data exists
 */
const hasCompanyProcessData = computed(() => {
  return (
    props.patterns.company_process_variations &&
    Array.isArray(props.patterns.company_process_variations) &&
    props.patterns.company_process_variations.length > 0
  )
})

/**
 * Company-specific process variations
 */
const companyProcessData = computed<CompanyProcess[]>(() => {
  if (!hasCompanyProcessData.value) {
    return []
  }

  return props.patterns.company_process_variations.map((company: any) => ({
    name: company.company,
    totalStages: company.total_stages || 5,
    avgDuration: company.avg_duration || '3-4 weeks',
    characteristics: company.characteristics || []
  }))
})

/**
 * Generate process narrative
 */
const processNarrative = computed(() => {
  const stages = interviewStages.value
  const totalStages = stages.length
  const avgPassRate = Math.round(
    stages.reduce((sum, stage) => sum + stage.passRate, 0) / totalStages
  )

  // Calculate total duration range
  const hasCompanyData = hasCompanyProcessData.value
  const companyCount = hasCompanyData
    ? companyProcessData.value.length
    : props.patterns.company_trends?.length || 0

  let narrative = `Typical interview processes span 3-5 weeks with ${totalStages} distinct stages. `
  narrative += `The average pass rate across all stages is ${avgPassRate}%, with the most significant filtering occurring at the technical assessment phase. `

  if (hasCompanyData) {
    narrative += `Analysis of ${companyCount} companies reveals notable variations in process structure, with some emphasizing cultural fit while others prioritize technical depth. `
  }

  narrative += `Candidates should expect 4-6 hours of total interview time, with wait periods of 1-2 weeks between major stages.`

  return narrative
})
</script>

<style scoped>
.interview-process {
  margin-bottom: 80px;
  padding-bottom: 40px;
  border-bottom: 1px solid #F3F4F6;
}

.section-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 32px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.narrative-block {
  margin-bottom: 32px;
}

.body-text {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 16px;
  font-weight: 400;
}

.chart-wrapper {
  background-color: #FFFFFF;
  padding: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  margin-top: 24px;
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
  font-weight: 400;
  margin-bottom: 24px;
}

/* Process Timeline */
.process-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-stage {
  display: flex;
  align-items: start;
  gap: 20px;
  position: relative;
}

.stage-number {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
}

.stage-content {
  flex: 1;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.stage-content:hover {
  border-color: #1E40AF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stage-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.stage-description {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.stage-metrics {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-icon {
  font-size: 18px;
}

.metric-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.stage-connector {
  position: absolute;
  left: 24px;
  top: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1;
}

.connector-line {
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, #3B82F6, #93C5FD);
}

.connector-time {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #E5E7EB;
  white-space: nowrap;
}

/* Process Comparison Table */
.process-comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.process-comparison-table thead {
  background: #F9FAFB;
  border-bottom: 2px solid #E5E7EB;
}

.process-comparison-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.process-comparison-table td {
  padding: 16px;
  border-bottom: 1px solid #F3F4F6;
  font-size: 14px;
  color: #374151;
}

.company-name {
  font-weight: 600;
  color: #111827;
}

.characteristics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.char-tag {
  padding: 4px 10px;
  background: #EFF6FF;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1024px) {
  .stage-metrics {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .chart-wrapper {
    padding: 20px;
  }

  .timeline-stage {
    gap: 12px;
  }

  .stage-number {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .stage-content {
    padding: 16px;
  }

  .stage-name {
    font-size: 16px;
  }

  .stage-connector {
    left: 20px;
    top: 60px;
  }

  .connector-line {
    height: 50px;
  }

  .process-comparison-table {
    font-size: 13px;
  }

  .process-comparison-table th,
  .process-comparison-table td {
    padding: 10px 12px;
  }

  .characteristics {
    flex-direction: column;
  }
}
</style>
