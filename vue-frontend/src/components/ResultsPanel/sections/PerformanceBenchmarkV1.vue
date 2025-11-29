<template>
  <section class="performance-benchmark-section">
    <div class="section-header">
      <h2 class="section-title">Your Performance Benchmark</h2>
      <p class="section-subtitle">How your outcome compares to similar interview experiences</p>
    </div>

    <div v-if="hasBenchmarkData" class="section-content">
      <!-- Inline Outcome Display -->
      <div class="outcome-inline">
        <span class="outcome-label">Outcome:</span>
        <span class="outcome-value" :class="outcomeClass">{{ formattedOutcome }}</span>
      </div>

      <!-- Benchmark Stats (McKinsey Style) -->
      <div class="benchmark-stats-container">
        <h3 class="stats-header">INDUSTRY BENCHMARK ({{ benchmarkData.totalSamples }} similar interviews)</h3>

        <div class="stats-grid">
          <div class="stat-column">
            <div class="stat-label">Success Rate</div>
            <div class="stat-value">{{ benchmarkData.successRate }}%</div>
            <div class="stat-detail">{{ benchmarkData.successCount }} candidates</div>
          </div>

          <div class="stat-column">
            <div class="stat-label">Rejection Rate</div>
            <div class="stat-value">{{ benchmarkData.failureRate }}%</div>
            <div class="stat-detail">{{ benchmarkData.failureCount }} candidates</div>
          </div>

          <div class="stat-column">
            <div class="stat-label">Sample Size</div>
            <div class="stat-value">{{ benchmarkData.totalSamples }}</div>
            <div class="stat-detail">interviews</div>
          </div>
        </div>

        <!-- Single Insight -->
        <div class="key-insight">
          <p class="insight-label">Key Insight:</p>
          <p class="insight-text">{{ keyInsight }}</p>
        </div>
      </div>
    </div>

    <div v-else class="no-data-state">
      <p>Insufficient benchmark data available for comparison</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Check if we have valid benchmark data
const hasBenchmarkData = computed(() => {
  const dist = props.patterns?.outcome_distribution
  if (!dist) return false

  const total = (dist.success || 0) + (dist.failure || 0)
  return total > 0
})

// Compute benchmark statistics
const benchmarkData = computed(() => {
  const dist = props.patterns?.outcome_distribution || {}
  const success = dist.success || 0
  const failure = dist.failure || 0
  const total = success + failure

  if (total === 0) {
    return {
      userOutcome: null,
      successCount: 0,
      failureCount: 0,
      successRate: '0.0',
      failureRate: '0.0',
      totalSamples: 0
    }
  }

  return {
    userOutcome: props.patterns?.seed_outcome || 'unknown',
    successCount: success,
    failureCount: failure,
    successRate: ((success / total) * 100).toFixed(1),
    failureRate: ((failure / total) * 100).toFixed(1),
    totalSamples: total
  }
})

// Format outcome for display
const formattedOutcome = computed(() => {
  const outcome = benchmarkData.value.userOutcome
  if (outcome === 'offer') return 'Offer Received'
  if (outcome === 'rejected') return 'Rejected'
  return 'Unknown'
})

// CSS class for outcome value
const outcomeClass = computed(() => {
  const outcome = benchmarkData.value.userOutcome
  if (outcome === 'offer') return 'outcome-success'
  if (outcome === 'rejected') return 'outcome-failure'
  return 'outcome-unknown'
})

// Generate single key insight
const keyInsight = computed(() => {
  const successRate = parseFloat(benchmarkData.value.successRate)
  const role = props.patterns?.seed_role || 'this role'
  const company = props.patterns?.seed_company || 'similar companies'

  if (successRate > 60) {
    return `Success rate of ${benchmarkData.value.successRate}% indicates favorable interview outcomes for ${role} at ${company} and similar companies.`
  } else if (successRate < 40) {
    return `Success rate of ${benchmarkData.value.successRate}% indicates competitive selection process for ${role} at ${company} and similar companies.`
  } else {
    return `Balanced success rate (${benchmarkData.value.successRate}%) indicates standard interview difficulty for ${role} at ${company} and similar companies.`
  }
})
</script>

<style scoped>
.performance-benchmark-section {
  margin-bottom: var(--spacing-16);
}

/* Section Header */
.section-header {
  margin-bottom: var(--spacing-8);
  padding-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-border-light);
}

.section-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-serif);
}

.section-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-normal);
}

/* Section Content */
.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

/* Inline Outcome Display */
.outcome-inline {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  font-size: var(--font-size-xl);
  padding: var(--spacing-4) 0;
}

.outcome-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.outcome-value {
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-2xl);
}

.outcome-value.outcome-success {
  color: #1E3A8A; /* McKinsey navy instead of green */
}

.outcome-value.outcome-failure {
  color: #1E3A8A; /* McKinsey navy instead of red */
}

.outcome-value.outcome-unknown {
  color: var(--color-text-tertiary);
}

/* Benchmark Stats Container (McKinsey Style) */
.benchmark-stats-container {
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-8);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.stats-header {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-border-light);
}

/* Three-Column Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-8);
}

.stat-column {
  text-align: center;
  padding: var(--spacing-6);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-3);
}

.stat-value {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  color: #1E3A8A; /* McKinsey navy */
  margin-bottom: var(--spacing-2);
  font-family: var(--font-serif);
}

.stat-detail {
  font-size: var(--font-size-md);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-normal);
}

/* Key Insight (Single Concise Summary) */
.key-insight {
  padding: var(--spacing-6);
  background-color: #EFF6FF; /* Light blue background */
  border-radius: var(--radius-md);
  border-left: 4px solid #1E3A8A; /* McKinsey navy */
}

.insight-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: #1E3A8A;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-2);
}

.insight-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* No Data State */
.no-data-state {
  padding: var(--spacing-12);
  text-align: center;
  background-color: var(--color-bg-quaternary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border-base);
}

.no-data-state p {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }

  .stat-value {
    font-size: var(--font-size-4xl);
  }
}
</style>
