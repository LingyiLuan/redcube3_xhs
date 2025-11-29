<template>
  <div class="section-container learning-map-cta">
    <div class="cta-content">
      <div class="cta-icon">🗺️</div>
      <div class="cta-text">
        <h2 class="cta-title">Ready to Improve?</h2>
        <p class="cta-description">
          Generate a personalized Learning Map based on your interview experience.
          Get actionable recommendations, study resources, and a strategic preparation plan
          tailored to your specific gaps and goals.
        </p>
      </div>
    </div>

    <div class="cta-actions">
      <button @click="handleGenerateLearningMap" class="primary-button">
        Generate Learning Map
      </button>
      <div class="cta-features">
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Skill gap analysis</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Curated resources</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          <span class="feature-text">Study timeline</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  postId?: string // Optional - may be undefined for text-based analyses
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'navigate-to-learning-map': []
}>()

function handleGenerateLearningMap() {
  emit('navigate-to-learning-map')
}
</script>

<style scoped>
.section-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  color: white;
}

.cta-content {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.cta-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.cta-text {
  flex: 1;
}

.cta-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 1rem 0;
}

.cta-description {
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-start;
}

.primary-button {
  padding: 1rem 2rem;
  background-color: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background-color: #f8f9fa;
}

.primary-button:active {
  transform: translateY(0);
}

.cta-features {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
}

.feature-text {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

@media (max-width: 768px) {
  .cta-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .cta-title {
    font-size: 1.5rem;
  }

  .cta-description {
    font-size: 0.95rem;
  }

  .cta-actions {
    align-items: center;
  }

  .cta-features {
    justify-content: center;
  }
}
</style>
