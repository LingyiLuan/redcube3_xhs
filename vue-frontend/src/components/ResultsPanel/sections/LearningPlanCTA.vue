<template>
  <section class="learning-plan-cta-section">
    <!-- Unified CTA Card with Features -->
    <div class="cta-card">
      <div class="cta-header">
        <div class="cta-content">
          <h3 class="cta-title">Ready to Start Preparing?</h3>
          <p class="cta-description">
            Create a personalized learning map based on
            <strong>{{ questionsCount }} questions</strong> and
            <strong>{{ skillsCount }} skills</strong> from your analysis.
          </p>
        </div>

        <button @click="createLearningPlan" class="cta-button">
          Create Learning Map →
        </button>
      </div>

      <!-- Features Grid (inside the card) -->
      <div class="cta-features">
        <div class="feature-item">
          <span class="feature-text">Week-by-week roadmap</span>
        </div>
        <div class="feature-item">
          <span class="feature-text">Prioritized skills</span>
        </div>
        <div class="feature-item">
          <span class="feature-text">Curated resources</span>
        </div>
        <div class="feature-item">
          <span class="feature-text">Track progress</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  patterns: any
}

const props = defineProps<Props>()
const uiStore = useUIStore()

// Computed: Count of questions from analysis
const questionsCount = computed(() => {
  // Check interview_questions array from backend
  if (props.patterns.interview_questions && Array.isArray(props.patterns.interview_questions)) {
    return props.patterns.interview_questions.length
  }
  // Fallback: check questions_by_topic (legacy format)
  if (props.patterns.questions_by_topic) {
    return Object.values(props.patterns.questions_by_topic).flat().length
  }
  return 0
})

// Computed: Count of unique skills from analysis
const skillsCount = computed(() => {
  if (props.patterns.skill_frequency && Array.isArray(props.patterns.skill_frequency)) {
    return props.patterns.skill_frequency.length
  }
  return 0
})

// Method: Navigate to Learning Map tab
function createLearningPlan() {
  console.log('[LearningPlanCTA] Navigating to Learning Map tab')

  // Navigate to Learning Map tab
  // User can then select this report and generate a learning map
  uiStore.showLearningMapsList()

  console.log('[LearningPlanCTA] Navigated to Learning Maps view')
}
</script>

<style scoped>
/* === LEARNING PLAN CTA SECTION === */

.learning-plan-cta-section {
  margin: 32px 0;
  padding: 0;
}

/* Unified CTA Card */
.cta-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 28px;
  transition: all 0.2s ease;
}

.cta-card:hover {
  border-color: var(--color-navy);
  box-shadow: 0 2px 8px rgba(30, 58, 138, 0.04);
}

/* CTA Header (title + description + button) */
.cta-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #F3F4F6;
  margin-bottom: 20px;
}

.cta-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cta-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-charcoal);
  margin: 0;
  line-height: 1.3;
}

.cta-description {
  font-size: 14px;
  color: var(--color-slate);
  margin: 0;
  line-height: 1.5;
}

.cta-description strong {
  color: var(--color-navy);
  font-weight: 600;
}

.cta-button {
  padding: 12px 24px;
  background: var(--color-button-primary);
  color: var(--color-white);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.1);
}

.cta-button:hover {
  background: var(--color-button-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.2);
}

.cta-button:active {
  transform: translateY(0);
}

/* Features Grid (inside the card) */
.cta-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  background: #F9FAFB;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.feature-item:hover {
  background: #F3F4F6;
}

.feature-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-slate);
  line-height: 1.4;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .cta-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .cta-button {
    width: 100%;
  }

  .cta-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .cta-card {
    padding: 20px;
  }

  .cta-header {
    padding-bottom: 20px;
    margin-bottom: 16px;
  }

  .cta-title {
    font-size: 16px;
  }

  .cta-description {
    font-size: 13px;
  }

  .cta-features {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .feature-item {
    padding: 10px 12px;
  }

  .feature-text {
    font-size: 12px;
  }
}
</style>
