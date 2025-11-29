<template>
  <section class="executive-summary">
    <h2 class="section-title">Executive Summary</h2>

    <div class="two-column-layout">
      <!-- Left Column: Narrative (60%) -->
      <div class="narrative-column">
        <p class="body-text" v-if="patterns.narrative_summary">
          {{ patterns.narrative_summary }}
        </p>
        <p class="body-text" v-else>
          Based on {{ patterns.summary.total_posts_analyzed }} recent interview experiences
          across {{ patterns.summary.unique_companies }} companies and {{ patterns.summary.unique_roles }}
          distinct roles, we identified key patterns in technical interview preparation and outcomes.
          The overall success rate stands at {{ patterns.summary.overall_success_rate }},
          with notable variations across companies and skill requirements.
        </p>

        <!-- Insight Callout for Key Highlights -->
        <InsightCallout
          v-if="topCompany"
          type="info"
          title="Key Highlight"
          :message="`${topCompany} leads in interview frequency with the highest number of recorded interviews.`"
        />
      </div>

      <!-- Right Column: Key Metrics Table (40%) -->
      <div class="metrics-column">
        <table class="metrics-table">
          <tbody>
            <tr>
              <td class="metric-label">Posts Analyzed</td>
              <td class="metric-value">{{ patterns.summary.total_posts_analyzed }}</td>
            </tr>
            <tr>
              <td class="metric-label">Companies</td>
              <td class="metric-value">{{ patterns.summary.unique_companies }}</td>
            </tr>
            <tr>
              <td class="metric-label">Unique Roles</td>
              <td class="metric-value">{{ patterns.summary.unique_roles }}</td>
            </tr>
            <tr class="metric-highlight">
              <td class="metric-label">Success Rate</td>
              <td class="metric-value">{{ patterns.summary.overall_success_rate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InsightCallout from '../widgets/InsightCallout.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Get top company name for highlight
 */
const topCompany = computed(() => {
  if (!props.patterns.company_trends || props.patterns.company_trends.length === 0) {
    return null
  }
  return props.patterns.company_trends[0]?.company || null
})
</script>

<style scoped>
.executive-summary {
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

.two-column-layout {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 32px;
}

.narrative-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.body-text {
  font-size: 16px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
}

.metrics-column {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 20px;
}

.metrics-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}

.metrics-table tr {
  background: white;
  border-radius: 6px;
}

.metrics-table td {
  padding: 12px 16px;
  font-size: 14px;
}

.metric-label {
  color: #6B7280;
  font-weight: 500;
  width: 60%;
}

.metric-value {
  color: #1F2937;
  font-weight: 700;
  text-align: right;
  font-size: 16px;
}

.metric-highlight {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%) !important;
}

.metric-highlight .metric-value {
  color: #1E40AF;
  font-size: 18px;
}

/* Responsive */
@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 640px) {
  .executive-summary {
    padding: 20px;
  }

  .section-title {
    font-size: 20px;
  }

  .body-text {
    font-size: 14px;
  }

  .metrics-table td {
    padding: 10px 12px;
  }

  .metric-label,
  .metric-value {
    font-size: 13px;
  }
}
</style>
