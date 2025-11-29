<template>
  <div class="section-container similar-experiences-section">
    <div class="section-header">
      <div class="title-with-badge">
        <h2 class="section-title">Similar Interview Experiences</h2>
        <DataSourceBadge type="benchmark" />
      </div>
      <p class="section-subtitle">
        Learn from other candidates with similar experiences
      </p>
    </div>

    <div class="experiences-list">
      <div
        v-for="(experience, index) in similarExperiences"
        :key="experience.id"
        class="experience-card"
      >
        <div class="experience-header">
          <div class="company-role">
            <h3 class="company-name">{{ experience.company }}</h3>
            <span class="role-badge">{{ experience.role }}</span>
          </div>
          <span class="outcome-badge" :class="outcomeClass(experience.outcome)">
            {{ formatOutcome(experience.outcome) }}
          </span>
        </div>

        <div class="experience-meta">
          <div class="meta-item" v-if="experience.difficulty">
            <span class="meta-label">Difficulty:</span>
            <span class="meta-value">{{ experience.difficulty }}/5</span>
          </div>
        </div>

        <div class="experience-summary" v-if="experience.summary">
          {{ experience.summary }}
        </div>

        <div class="skills-tested" v-if="experience.keySkills && experience.keySkills.length > 0">
          <div class="skills-label">Key Skills:</div>
          <div class="skills-tags">
            <span
              v-for="skill in experience.keySkills"
              :key="skill"
              class="skill-tag"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <div class="info-icon">💡</div>
      <div class="info-content">
        These experiences are from the foundation pool (relevant interview posts).
        We prioritize posts with the same outcome as yours for validation, with some opposite outcomes for contrast and learning.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DataSourceBadge from '../../../common/DataSourceBadge.vue'

interface Props {
  similarExperiences: Array<{
    id: string
    company: string
    role: string
    outcome: string
    difficulty?: number
    keySkills: string[]
    summary: string
    followUp?: string | null
  }>
}

const props = defineProps<Props>()

function formatOutcome(outcome: string | null | undefined): string {
  if (!outcome) return 'Unknown'
  const lower = outcome.toLowerCase()
  if (lower === 'passed') return 'Passed'
  if (lower === 'failed') return 'Failed'
  return 'Unknown'
}

function outcomeClass(outcome: string | null | undefined): string {
  if (!outcome) return 'outcome-unknown'
  const lower = outcome.toLowerCase()
  if (lower === 'passed') return 'outcome-passed'
  if (lower === 'failed') return 'outcome-failed'
  return 'outcome-unknown'
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

.experiences-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.experience-card {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.experience-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1);
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.company-role {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.company-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  width: fit-content;
}

.outcome-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: capitalize;
  flex-shrink: 0;
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

.experience-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
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

.experience-summary {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: #ffffff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

.skills-tested {
  margin-top: 1rem;
}

.skills-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  align-items: flex-start;
}

.info-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-content {
  font-size: 0.9rem;
  color: #166534;
  line-height: 1.6;
}
</style>
