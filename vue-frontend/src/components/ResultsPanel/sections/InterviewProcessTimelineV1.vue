<template>
  <section class="report-section interview-process">
    <h2 class="section-title">Interview Process & Timeline</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="insight-text">
        {{ getInterviewProcessNarrative() }}
      </p>
    </div>

    <!-- Compact Horizontal Timeline -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Typical Interview Process</h3>
      <p class="chart-subtitle">Industry-standard timeline • 3-5 weeks total</p>

      <div class="process-timeline-horizontal">
        <div class="timeline-track"></div>
        <div class="timeline-stages">
          <div class="timeline-stage-compact" v-for="(stage, index) in interviewStages" :key="stage.name">
            <div class="stage-number-compact">{{ index + 1 }}</div>
            <div class="stage-info-compact">
              <h4 class="stage-name-compact">{{ stage.name }}</h4>
              <p class="stage-duration-compact">{{ stage.duration }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-disclaimer">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="note-icon">
          <circle cx="8" cy="8" r="7" stroke="#6B7280" stroke-width="1.5"/>
          <path d="M8 7V11M8 5V5.5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>
          Timeline may vary by company. For specific details, check
          <a href="https://www.glassdoor.com" target="_blank">Glassdoor</a> or
          <a href="https://www.teamblind.com" target="_blank">Blind</a>.
        </p>
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

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Computed: Interview stages with metrics
const interviewStages = computed(() => {
  // Try to extract from patterns.interview_stages if available
  if (props.patterns.interview_stages && Array.isArray(props.patterns.interview_stages)) {
    return props.patterns.interview_stages
  }

  // Fallback: Use simplified 4-stage process
  return [
    {
      name: 'Phone Screen',
      duration: '30-45 min'
    },
    {
      name: 'Technical',
      duration: '1-2 hours'
    },
    {
      name: 'Onsite',
      duration: '3-5 hours'
    },
    {
      name: 'Final Round',
      duration: '1-2 hours'
    }
  ]
})

// Computed: Check if company-specific process data exists
const hasCompanyProcessData = computed(() => {
  return props.patterns.company_process_variations &&
         Array.isArray(props.patterns.company_process_variations) &&
         props.patterns.company_process_variations.length > 0
})

// Computed: Company-specific process variations
const companyProcessData = computed(() => {
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

// Function: Get interview process narrative
function getInterviewProcessNarrative() {
  const stages = interviewStages.value
  const totalStages = stages.length

  const hasCompanyData = hasCompanyProcessData.value
  const companyCount = hasCompanyData
    ? companyProcessData.value.length
    : props.patterns.company_trends?.length || 0

  let narrative = `Most software engineering interviews follow a ${totalStages}-stage process spanning 3-5 weeks. `
  narrative += `Expect approximately 5-8 hours of total interview time, with 1-2 week wait periods between major stages. `

  if (hasCompanyData && companyCount > 0) {
    narrative += `Based on analyzed data from ${companyCount} companies, process structures vary significantly—some emphasize cultural fit while others prioritize deep technical assessment. `
  }

  narrative += `The timeline below shows industry-standard stages. For company-specific details, consult Glassdoor or Blind.`

  return narrative
}
</script>

<style scoped>
/* ===== 7. Interview Process & Timeline Section ===== */

.interview-process {
  /* Inherits report-section styles */
}

/* Connected Stepper Timeline */
.process-timeline-horizontal {
  position: relative;
  margin: 32px 0;
  padding: 48px 32px 32px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow-x: auto;
}

/* Connecting line */
.timeline-track {
  position: absolute;
  top: 76px;
  left: 12%;
  right: 12%;
  height: 2px;
  background: #E5E7EB;
  z-index: 0;
}

/* Stages container */
.timeline-stages {
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}

.timeline-stage-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.stage-number-compact {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-navy);
  border: 4px solid #FFFFFF;
  box-shadow: 0 0 0 2px #E5E7EB;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  position: relative;
  z-index: 2;
}

.stage-info-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.stage-name-compact {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  white-space: nowrap;
}

.stage-duration-compact {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
  margin: 0;
}

/* Timeline Disclaimer - Subtle */
.timeline-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px 20px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
}

.note-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.timeline-disclaimer p {
  font-size: 13px;
  color: #4B5563;
  margin: 0;
  line-height: 1.6;
}

.timeline-disclaimer strong {
  color: #111827;
  font-weight: 600;
}

.timeline-disclaimer a {
  color: var(--color-navy);
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.2s ease;
}

.timeline-disclaimer a:hover {
  color: var(--color-blue);
}

/* Process Comparison Table */
.process-comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}

.process-comparison-table thead {
  background: #F3F4F6;
}

.process-comparison-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #E5E7EB;
}

.process-comparison-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #F3F4F6;
}

.process-comparison-table tbody tr {
  transition: background 0.2s ease;
}

.process-comparison-table tbody tr:hover {
  background: #F9FAFB;
}

.process-comparison-table .company-name {
  font-weight: 700;
  color: #111827;
}

.characteristics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.char-tag {
  padding: 4px 10px;
  background: var(--color-baby-blue);
  color: var(--color-navy);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .process-timeline-horizontal {
    padding: 32px 16px 24px;
  }

  .timeline-stages {
    flex-direction: column;
    align-items: flex-start;
    gap: 32px;
  }

  .timeline-track {
    left: 27px;
    right: auto;
    width: 2px;
    height: calc(100% - 96px);
    top: 76px;
  }

  .timeline-stage-compact {
    flex-direction: row;
    gap: 16px;
    width: 100%;
    align-items: flex-start;
  }

  .stage-number-compact {
    width: 48px;
    height: 48px;
    font-size: 18px;
    flex-shrink: 0;
  }

  .stage-info-compact {
    align-items: flex-start;
    text-align: left;
    padding-top: 8px;
  }

  .stage-name-compact {
    font-size: 14px;
  }

  .stage-duration-compact {
    font-size: 12px;
  }

  .timeline-disclaimer {
    padding: 14px 16px;
  }

  .timeline-disclaimer p {
    font-size: 12px;
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

  .char-tag {
    font-size: 11px;
    padding: 3px 8px;
  }
}
</style>
