<template>
  <IndustrialTileBase :span="3" :row="1" class="about-tile">
    <template #header>
      <h4 class="industrial-h4">About Working Lab</h4>
    </template>

    <div class="about-content">
      <p class="industrial-body-sm">
        Analyze real interview experiences from top tech companies. Extract patterns, trending questions,
        and hiring insights to prepare smarter for your next interview.
      </p>

      <div class="features-list">
        <div class="feature-item">
          <span class="feature-icon">💬</span>
          <span class="feature-text">Interview Data Collection</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔍</span>
          <span class="feature-text">Pattern Recognition</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📈</span>
          <span class="feature-text">Trend Analysis</span>
        </div>
      </div>

      <button @click="handleLearnMore" class="industrial-btn learn-more-btn">
        Learn More →
      </button>
    </div>
  </IndustrialTileBase>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import IndustrialTileBase from './IndustrialTileBase.vue'

const router = useRouter()

function handleLearnMore() {
  router.push({ name: 'Instructions' })
}
</script>

<style scoped>
.about-tile {
  display: flex;
  flex-direction: column;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  flex: 1;
}

.about-content p {
  margin: 0;
  line-height: 1.5;
  color: var(--industrial-text-secondary);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
}

.feature-icon {
  font-size: 1rem;
  line-height: 1;
}

.feature-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--industrial-text-primary);
}

.learn-more-btn {
  margin-top: auto;
  width: 100%;
}
</style>
