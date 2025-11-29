<template>
  <RefinedTileBase
    :span="3"
    :row="1"
    :interactive="true"
    :badge="hasNewInsights ? 'NEW' : undefined"
    badge-variant="alert"
    class="learning-map-tile"
    @click="handleClick"
  >
    <template #header>
      <h4 class="refined-h4">Learning Maps</h4>
    </template>

    <div class="map-preview">
      <div class="map-stats">
        <div class="stat">
          <div class="stat-value refined-h3">{{ mapCount }}</div>
          <div class="stat-label refined-caption">Active Maps</div>
        </div>
        <div class="stat">
          <div class="stat-value refined-h3">{{ insightCount }}</div>
          <div class="stat-label refined-caption">Insights</div>
        </div>
      </div>

      <div class="map-visual">
        <svg viewBox="0 0 120 60" class="map-graph">
          <path
            d="M 10 45 L 30 35 L 50 40 L 70 25 L 90 30 L 110 20"
            stroke="var(--refined-accent-orange)"
            stroke-width="2"
            fill="none"
          />
          <circle cx="10" cy="45" r="3" fill="var(--refined-accent-orange)" />
          <circle cx="30" cy="35" r="3" fill="var(--refined-accent-orange)" />
          <circle cx="50" cy="40" r="3" fill="var(--refined-accent-orange)" />
          <circle cx="70" cy="25" r="3" fill="var(--refined-accent-orange)" />
          <circle cx="90" cy="30" r="3" fill="var(--refined-accent-orange)" />
          <circle cx="110" cy="20" r="3" fill="var(--refined-accent-orange)" />
        </svg>
      </div>
    </div>
  </RefinedTileBase>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import RefinedTileBase from './RefinedTileBase.vue'

const router = useRouter()
const authStore = useAuthStore()

const mapCount = computed(() => 2)
const insightCount = computed(() => 12)
const hasNewInsights = computed(() => true)

function handleClick() {
  if (authStore.isAuthenticated) {
    console.log('[LearningMapTile] Navigate to learning map (not implemented yet)')
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.learning-map-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.map-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.map-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--refined-bg-primary);
  border-radius: var(--radius-md);
}

.stat-value {
  color: var(--refined-accent-orange);
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: var(--refined-text-tertiary);
}

.map-visual {
  padding: var(--space-sm);
  background: var(--refined-bg-primary);
  border-radius: var(--radius-md);
}

.map-graph {
  width: 100%;
  height: auto;
}
</style>
