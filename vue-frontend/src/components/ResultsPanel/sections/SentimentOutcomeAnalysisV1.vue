<template>
  <section class="report-section">
    <h2 class="section-title">Interview Success Rate</h2>

    <!-- McKinsey-Style Big Number Display -->
    <div class="big-number-container">
      <div class="big-number-display">
        <div class="big-number-main">
          <div class="big-number">{{ patterns.sentiment_metrics.success_rate }}</div>
          <div class="big-number-label">Success Rate</div>
        </div>
        <div class="big-number-bar-wrapper">
          <div class="big-number-bar-bg">
            <div
              class="big-number-bar-fill"
              :style="{ width: patterns.sentiment_metrics.success_rate }"
            ></div>
          </div>
          <div class="big-number-context">
            {{ patterns.sentiment_metrics.total_success }} successful outcomes of {{ patterns.summary.total_posts_analyzed }} interviews analyzed
          </div>
        </div>
      </div>

      <!-- Supporting Metrics - Clean Cards -->
      <div class="supporting-metrics">
        <div class="metric-card success-card">
          <div class="metric-card-value">{{ patterns.sentiment_metrics.total_success }}</div>
          <div class="metric-card-label">Successful</div>
          <div class="metric-card-bar">
            <div class="metric-bar-fill success-bar" :style="{ width: (patterns.sentiment_metrics.total_success / patterns.summary.total_posts_analyzed * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-card failure-card">
          <div class="metric-card-value">{{ patterns.sentiment_metrics.total_failure }}</div>
          <div class="metric-card-label">Unsuccessful</div>
          <div class="metric-card-bar">
            <div class="metric-bar-fill failure-bar" :style="{ width: (patterns.sentiment_metrics.total_failure / patterns.summary.total_posts_analyzed * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-card unknown-card">
          <div class="metric-card-value">{{ patterns.sentiment_metrics.total_unknown }}</div>
          <div class="metric-card-label">Unknown/Pending</div>
          <div class="metric-card-bar">
            <div class="metric-bar-fill unknown-bar" :style="{ width: (patterns.sentiment_metrics.total_unknown / patterns.summary.total_posts_analyzed * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Insight Callout -->
    <div class="insight-callout">
      <div class="callout-content">
        <strong>Key Insight:</strong> The success rate of {{ patterns.sentiment_metrics.success_rate }} suggests {{ getSentimentInsight() }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Generate sentiment insight based on success rate
 */
function getSentimentInsight() {
  const rate = parseFloat(props.patterns.sentiment_metrics.success_rate)
  if (rate > 50) return 'a competitive but achievable interview landscape with proper preparation.'
  if (rate > 30) return 'moderate success rates, highlighting the importance of targeted skill development.'
  return 'highly competitive interview environments requiring comprehensive preparation strategies.'
}
</script>

<style scoped>
/* McKinsey Big Number Display */
.big-number-container {
  margin-top: 32px;
  margin-bottom: 24px;
}

.big-number-display {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  padding: 48px 64px;
  text-align: center;
  margin-bottom: 24px;
}

.big-number-main {
  margin-bottom: 32px;
}

.big-number {
  font-size: 72px;
  font-weight: 700;
  color: #1E40AF;
  line-height: 1;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.big-number-label {
  font-size: 16px;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.big-number-bar-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.big-number-bar-bg {
  height: 8px;
  background-color: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.big-number-bar-fill {
  height: 100%;
  background-color: #1E40AF;
  transition: width 0.6s ease;
}

.big-number-context {
  font-size: 14px;
  color: #6B7280;
  font-weight: 400;
}

/* Supporting Metrics - Clean Cards */
.supporting-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.metric-card {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  border-color: #1E40AF;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);
  transform: translateY(-2px);
}

.metric-card-value {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1;
}

.metric-card-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.metric-card-bar {
  height: 4px;
  background-color: #F3F4F6;
  border-radius: 2px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  transition: width 0.6s ease;
}

.success-bar {
  background-color: #1E40AF;
}

.failure-bar {
  background-color: #60A5FA;
}

.unknown-bar {
  background-color: #D1D5DB;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .big-number-display {
    padding: 32px 24px;
  }

  .big-number {
    font-size: 56px;
  }

  .supporting-metrics {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
