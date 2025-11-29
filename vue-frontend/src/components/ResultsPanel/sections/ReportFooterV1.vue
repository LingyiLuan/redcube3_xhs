<template>
  <footer class="report-footer">
    <div class="methodology-section">
      <h3 class="methodology-title">METHODOLOGY</h3>
      <p class="methodology-text">
        This analysis is based on <strong>{{ patterns.summary.total_posts_analyzed }} interview posts</strong>
        from <strong>{{ patterns.summary.unique_companies }} companies</strong> across
        <strong>{{ patterns.summary.unique_roles }} distinct roles</strong>. Data includes technical
        interviews across multiple seniority levels, with an overall success rate of
        <strong>{{ patterns.summary.overall_success_rate }}</strong>.
      </p>
      <div class="footer-actions">
        <button class="footer-btn secondary" @click="viewSourceData">
          View Source Data ({{ patterns.summary.total_posts_analyzed }} posts)
        </button>
        <button class="footer-btn primary" @click="exportPDF">
          Export Report PDF
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
interface Props {
  patterns: any
}

const props = defineProps<Props>()

function viewSourceData() {
  // Future: Open data explorer modal/page
  console.log('[Report] View source data clicked')
  alert(`Source data explorer coming soon!\n\nThis will show a sortable, filterable table of all ${props.patterns.summary.total_posts_analyzed} analyzed posts with links to original sources.`)
}

function exportPDF() {
  // Future: Generate and download PDF report
  console.log('[Report] Export PDF clicked')
  alert('PDF export coming soon!\n\nThis will generate a professional PDF version of this McKinsey-style report.')
}
</script>

<style scoped>
/* Report Footer - Methodology Section */
.report-footer {
  margin-top: 64px;
  padding-top: 48px;
  border-top: 2px solid #E5E7EB;
  background-color: #F9FAFB;
}

.methodology-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 64px;
  text-align: center;
}

.methodology-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #6B7280;
  margin-bottom: 16px;
}

.methodology-text {
  font-size: 14px;
  line-height: 1.7;
  color: #4B5563;
  margin-bottom: 32px;
}

.methodology-text strong {
  color: #1F2937;
  font-weight: 600;
}

.footer-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.footer-btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: inherit;
}

.footer-btn.primary {
  background-color: #1E40AF;
  color: #FFFFFF;
  border: 1px solid #1E40AF;
}

.footer-btn.primary:hover {
  background-color: #1E3A8A;
  border-color: #1E3A8A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
}

.footer-btn.secondary {
  background-color: #FFFFFF;
  color: #1E40AF;
  border: 1px solid #1E40AF;
}

.footer-btn.secondary:hover {
  background-color: #EFF6FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .report-footer {
    margin-top: 48px;
    padding-top: 32px;
  }

  .methodology-section {
    padding: 32px 24px;
  }

  .footer-actions {
    flex-direction: column;
    gap: 12px;
  }

  .footer-btn {
    width: 100%;
  }
}
</style>
