<template>
  <section class="report-section comparative-metrics" v-if="patterns.comparative_table && patterns.comparative_table.length > 0">
    <h2 class="section-title">Comparative Company Metrics</h2>

    <!-- Narrative Block -->
    <div class="narrative-block">
      <p class="insight-text">
        The following table provides a detailed comparison of interview metrics across companies,
        highlighting differences in sentiment, skill focus, and success rates.
      </p>
    </div>

    <!-- Comparative Table -->
    <div class="comparative-table-wrapper">
      <table class="comparative-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Avg Sentiment</th>
            <th>Top Skill Focus</th>
            <th>Difficulty</th>
            <th>Behavioral %</th>
            <th>Technical %</th>
            <th>Success Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in patterns.comparative_table"
            :key="row.company"
            :class="{ 'seed-company-row': row.is_seed_company }"
          >
            <td class="company-cell">
              {{ row.company }}
              <span v-if="row.is_seed_company" class="seed-badge">Your Company</span>
            </td>
            <td class="sentiment-cell">
              <SentimentBadge
                :category="row.sentiment_category || 'NEUTRAL'"
                :score="row.avg_sentiment"
                :reasoning="row.sentiment_reasoning"
                :key-phrases="row.sentiment_key_phrases || []"
                :post-count="row.sentiment_post_count || 0"
              />
            </td>
            <td>{{ row.top_skill_focus }}</td>
            <td>{{ row.avg_difficulty }}</td>
            <td>{{ row.behavioral_focus }}</td>
            <td>{{ row.technical_focus }}</td>
            <td class="success-cell">{{ row.success_rate }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import SentimentBadge from '@/components/SentimentBadge.vue'

interface Props {
  patterns: any
}

defineProps<Props>()
</script>

<style scoped>
/* Comparative Metrics Section */
.comparative-metrics {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

/* Narrative Block */
.narrative-block {
  margin-bottom: 16px;
}

.insight-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

/* Comparative Table - Clean McKinsey Style */
.comparative-table-wrapper {
  overflow-x: auto;
  margin-top: 24px;
  border: 1px solid #E5E7EB;
}

.comparative-table {
  width: 100%;
  font-size: 14px;
  background-color: #FFFFFF;
  border-collapse: collapse;
}

.comparative-table thead {
  background-color: #F9FAFB;
}

.comparative-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #111827;
  border-bottom: 2px solid #E5E7EB;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.comparative-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #F3F4F6;
  color: #374151;
}

.comparative-table tbody tr:hover {
  background-color: #FAFBFC;
}

.comparative-table .company-cell {
  font-weight: 600;
  color: #111827;
}

.comparative-table .success-cell {
  font-weight: 600;
  color: #2563EB;
}

.comparative-table .sentiment-cell {
  padding: 10px 16px;
}

/* Seed company highlighting */
.comparative-table tbody tr.seed-company-row {
  background-color: #EFF6FF !important;
  border-left: 4px solid #2563EB;
}

.comparative-table tbody tr.seed-company-row:hover {
  background-color: #DBEAFE !important;
}

.seed-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #2563EB;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .comparative-metrics {
    padding: 16px;
  }

  .comparative-table-wrapper {
    margin-top: 16px;
  }

  .comparative-table th,
  .comparative-table td {
    padding: 10px 12px;
    font-size: 12px;
  }

  .seed-badge {
    display: block;
    margin-left: 0;
    margin-top: 4px;
    width: fit-content;
  }
}
</style>
