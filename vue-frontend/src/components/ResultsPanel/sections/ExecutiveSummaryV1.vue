<template>
  <section class="report-section executive-summary">
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
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Props {
  patterns: any
}

defineProps<Props>()
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

/* Executive Summary Section */
.executive-summary {
  /* Inherits report-section styles from parent */
}

/* Two-Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 48px;
  align-items: start;
}

.narrative-column {
  padding-right: 24px;
}

.metrics-column {
  padding-left: 24px;
  border-left: 1px solid #E5E7EB;
}

/* Typography */
.body-text {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 16px;
  font-weight: 400;
}

/* Metrics Table */
.metrics-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.metrics-table tbody tr {
  border-bottom: 1px solid #F3F4F6;
}

.metrics-table tbody tr:last-child {
  border-bottom: none;
}

.metrics-table tbody tr.metric-highlight {
  background-color: #F9FAFB;
}

.metric-label {
  font-size: 10px;
  color: #6B7280;
  padding: 6px 0 4px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 20px;
  color: #111827;
  font-weight: 700;
  text-align: right;
  padding: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .two-column-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .narrative-column {
    padding-right: 0;
  }

  .metrics-column {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #E5E7EB;
    padding-top: 24px;
  }
}
</style>
