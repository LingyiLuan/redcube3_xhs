<template>
  <div class="report-header">
    <div class="header-content">
      <h1 class="report-title">Tech Interview Insights Report</h1>
      <p class="report-subtitle">{{ formatDate(patterns.generated_at) }}</p>
      <div class="report-meta">
        <span class="meta-item">{{ patterns.summary.total_posts_analyzed }} posts analyzed</span>
        <span class="meta-divider">·</span>
        <span class="meta-item">{{ patterns.summary.unique_companies }} companies</span>
        <span class="meta-divider">·</span>
        <span class="meta-item">{{ patterns.summary.unique_roles }} roles</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/composables/useReportFormatters'

interface Props {
  patterns: any
}

defineProps<Props>()
</script>

<style scoped>
/* Header - Clean White with Minimal Border */
.report-header {
  background-color: #FFFFFF;
  padding: 48px 64px 32px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  flex: 1;
}

.report-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 40px;
  font-weight: 400;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.report-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 16px;
  font-weight: 400;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 24px;
}

.meta-item {
  font-weight: 400;
}

.meta-divider {
  color: #D1D5DB;
}

/* Responsive Design */
@media (max-width: 768px) {
  .report-header {
    padding: 32px 24px 24px;
  }

  .report-title {
    font-size: 32px;
  }

  .report-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meta-divider {
    display: none;
  }
}
</style>
