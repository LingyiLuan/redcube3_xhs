<template>
  <div class="section-container benchmark-section">
    <div class="section-header">
      <div class="title-with-badge">
        <h2 class="section-title">Benchmark Comparison</h2>
        <DataSourceBadge type="benchmark" />
      </div>
      <p class="section-subtitle">
        How your interview compares to industry benchmarks
      </p>
    </div>

    <div class="benchmark-grid">
      <!-- Success Rate Comparison -->
      <div class="benchmark-card">
        <h3 class="card-title">Success Rate for this Role</h3>
        <div class="metric-row">
          <div class="metric-label">Industry Average</div>
          <div class="metric-value primary">
            {{ benchmark.successRate.industry.toFixed(1) }}%
          </div>
        </div>
        <div class="metric-row">
          <div class="metric-label">Your Outcome</div>
          <div class="metric-value" :class="outcomeClass">
            {{ formattedOutcome }}
          </div>
        </div>
      </div>

      <!-- Difficulty Comparison -->
      <div class="benchmark-card" v-if="benchmark.difficulty.industryAverage">
        <h3 class="card-title">Difficulty Rating</h3>
        <div class="metric-row">
          <div class="metric-label">Industry Average</div>
          <div class="metric-value">
            {{ benchmark.difficulty.industryAverage.toFixed(1) }}/5
          </div>
        </div>
        <div class="metric-row" v-if="benchmark.difficulty.userRating">
          <div class="metric-label">Your Rating</div>
          <div class="metric-value">
            {{ benchmark.difficulty.userRating }}/5
          </div>
        </div>
        <div class="interpretation-box" v-if="benchmark.difficulty.interpretation">
          {{ benchmark.difficulty.interpretation }}
        </div>
      </div>
    </div>

    <!-- Stage Breakdown (if available) -->
    <div class="stage-breakdown" v-if="benchmark.stageBreakdown && benchmark.stageBreakdown.length > 0">
      <h3 class="subsection-title">Success Rate by Interview Stage</h3>
      <div class="stage-list">
        <div
          v-for="stage in benchmark.stageBreakdown"
          :key="stage.stage"
          class="stage-item"
        >
          <div class="stage-info">
            <span class="stage-name">{{ stage.stage }}</span>
            <span class="stage-posts">({{ stage.totalPosts }} posts)</span>
          </div>
          <div class="stage-metric">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: stage.successRate + '%' }"
              ></div>
            </div>
            <span class="percentage">{{ stage.successRate.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataSourceBadge from '../../../common/DataSourceBadge.vue'

interface Props {
  benchmark: {
    successRate: {
      industry: number
      userOutcome: string
    }
    difficulty: {
      userRating?: number
      industryAverage?: number
      interpretation?: string
    }
    stageBreakdown?: Array<{
      stage: string
      successRate: number
      totalPosts: number
    }> | null
  }
}

const props = defineProps<Props>()

const formattedOutcome = computed(() => {
  const userOutcome = props.benchmark.successRate.userOutcome
  if (!userOutcome) return 'Unknown'
  const outcome = userOutcome.toLowerCase()
  if (outcome === 'passed') return 'Passed'
  if (outcome === 'failed') return 'Failed'
  return 'Unknown'
})

const outcomeClass = computed(() => {
  const userOutcome = props.benchmark.successRate.userOutcome
  if (!userOutcome) return 'unknown'
  const outcome = userOutcome.toLowerCase()
  if (outcome === 'passed') return 'success'
  if (outcome === 'failed') return 'failure'
  return 'unknown'
})
</script>

<style scoped>
.section-container {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.benchmark-card {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.metric-row:last-of-type {
  border-bottom: none;
}

.metric-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-value.primary {
  color: #3b82f6;
}

.metric-value.success {
  color: #059669;
}

.metric-value.failure {
  color: #dc2626;
}

.metric-value.unknown {
  color: #6b7280;
}

.interpretation-box {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #1e40af;
  line-height: 1.5;
}

.subsection-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.stage-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stage-item {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stage-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.stage-posts {
  font-size: 0.85rem;
  color: #6b7280;
}

.stage-metric {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background-color: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.percentage {
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.95rem;
  min-width: 50px;
  text-align: right;
}
</style>
