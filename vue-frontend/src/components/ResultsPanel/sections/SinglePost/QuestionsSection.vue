<template>
  <div class="section-container questions-section">
    <div class="section-header">
      <h2 class="section-title">Interview Questions Intelligence</h2>
      <p class="section-subtitle">
        Specific questions asked during the interview
      </p>
    </div>

    <div class="questions-list">
      <div
        v-for="(question, index) in questions"
        :key="index"
        class="question-card"
      >
        <div class="question-header">
          <span class="question-number">Q{{ index + 1 }}</span>
          <span class="question-type" v-if="question.type && question.type !== 'Unknown'">
            {{ question.type }}
          </span>
        </div>

        <div class="question-text">{{ question.question }}</div>

        <div class="question-meta">
          <div class="meta-item" v-if="question.difficulty">
            <span class="meta-label">Difficulty:</span>
            <span class="meta-value">
              <span class="difficulty-badge" :class="difficultyClass(question.difficulty)">
                {{ formatDifficulty(question.difficulty) }}
              </span>
            </span>
          </div>

          <div class="meta-item" v-if="question.successRate !== null && question.successRate !== undefined">
            <span class="meta-label">Success Rate:</span>
            <span class="meta-value success-rate">
              {{ question.successRate.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase 2 Notice -->
    <div class="phase2-notice">
      <div class="notice-icon">ℹ️</div>
      <div class="notice-content">
        <strong>Enhanced Analysis Coming Soon:</strong>
        Question-level performance indicators extracted from post content will be available in Phase 2.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  questions: Array<{
    question: string
    type: string
    difficulty?: number | null
    successRate?: number | null
    userPerformance?: string | null
  }>
}

const props = defineProps<Props>()

function formatDifficulty(difficulty: number): string {
  if (difficulty <= 1) return 'Easy'
  if (difficulty <= 2) return 'Medium-Easy'
  if (difficulty <= 3) return 'Medium'
  if (difficulty <= 4) return 'Medium-Hard'
  return 'Hard'
}

function difficultyClass(difficulty: number): string {
  if (difficulty <= 2) return 'easy'
  if (difficulty <= 3) return 'medium'
  return 'hard'
}
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
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.question-card {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.question-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.question-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.85rem;
}

.question-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.question-text {
  font-size: 1.05rem;
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-weight: 500;
}

.question-meta {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 0.9rem;
  color: #1f2937;
  font-weight: 600;
}

.difficulty-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.difficulty-badge.easy {
  background-color: #d1fae5;
  color: #065f46;
}

.difficulty-badge.medium {
  background-color: #fef3c7;
  color: #92400e;
}

.difficulty-badge.hard {
  background-color: #fee2e2;
  color: #991b1b;
}

.success-rate {
  color: #3b82f6;
}

.phase2-notice {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  align-items: flex-start;
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content {
  font-size: 0.9rem;
  color: #1e40af;
  line-height: 1.6;
}

.notice-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1e3a8a;
}
</style>
