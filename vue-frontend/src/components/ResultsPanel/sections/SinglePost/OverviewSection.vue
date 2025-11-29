<template>
  <div class="section-container overview-section">
    <div class="section-header">
      <h2 class="section-title">Interview Overview</h2>
    </div>

    <div class="overview-grid">
      <div class="overview-card">
        <div class="card-label">Company</div>
        <div class="card-value">{{ overview.company }}</div>
      </div>

      <div class="overview-card">
        <div class="card-label">Role</div>
        <div class="card-value">{{ overview.role }}</div>
      </div>

      <div class="overview-card">
        <div class="card-label">Outcome</div>
        <div class="card-value">
          <span class="outcome-badge" :class="outcomeClass">
            {{ formattedOutcome }}
          </span>
        </div>
      </div>

      <div class="overview-card" v-if="overview.difficulty">
        <div class="card-label">Difficulty</div>
        <div class="card-value difficulty-value">
          {{ overview.difficulty }}/5
          <div class="difficulty-bar">
            <div
              class="difficulty-fill"
              :style="{ width: (overview.difficulty / 5 * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="overview-card" v-if="overview.interviewDate">
        <div class="card-label">Interview Date</div>
        <div class="card-value">{{ formattedDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  overview: {
    company: string
    role: string
    outcome: string
    difficulty?: number
    interviewDate?: string
    stages?: string[] | null
  }
}

const props = defineProps<Props>()

const formattedOutcome = computed(() => {
  if (!props.overview.outcome) return 'Unknown'
  const outcome = props.overview.outcome.toLowerCase()
  if (outcome === 'passed') return 'Passed'
  if (outcome === 'failed') return 'Failed'
  return 'Unknown'
})

const outcomeClass = computed(() => {
  if (!props.overview.outcome) return 'outcome-unknown'
  const outcome = props.overview.outcome.toLowerCase()
  if (outcome === 'passed') return 'outcome-passed'
  if (outcome === 'failed') return 'outcome-failed'
  return 'outcome-unknown'
})

const formattedDate = computed(() => {
  if (!props.overview.interviewDate) return 'N/A'
  const date = new Date(props.overview.interviewDate)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background-color: #f9fafb;
  padding: 1.25rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.card-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.outcome-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: capitalize;
}

.outcome-passed {
  background-color: #d1fae5;
  color: #065f46;
}

.outcome-failed {
  background-color: #fee2e2;
  color: #991b1b;
}

.outcome-unknown {
  background-color: #e5e7eb;
  color: #4b5563;
}

.difficulty-value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.difficulty-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.difficulty-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>
