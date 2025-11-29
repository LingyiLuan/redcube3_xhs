<template>
  <TileBase size="hero" variant="primary" :interactive="!locked" :locked="locked">
    <template #header>
      <div class="hero-badge">
        <PixelIcon name="star" :size="16" />
        MAIN STATION
      </div>
    </template>

    <div class="hero-content">
      <div class="hero-left">
        <h1 class="hero-title">WORKING LAB</h1>
        <p class="hero-subtitle">Visual workflow editor for analyzing interview data</p>

        <div class="hero-stats" v-if="!locked">
          <div class="stat-item">
            <PixelIcon name="workflow" :size="20" />
            <span>{{ workflowCount }} Workflows</span>
          </div>
          <div class="stat-item">
            <PixelIcon name="chart" :size="20" />
            <span>{{ analysisCount }} Analyses</span>
          </div>
          <div class="stat-item">
            <PixelIcon name="map" :size="20" />
            <span>{{ mapCount }} Maps</span>
          </div>
        </div>

        <PixelButton
          :icon="locked ? 'lock' : 'play'"
          variant="primary"
          @click="handleEnter"
        >
          {{ locked ? 'LOGIN TO ACCESS' : 'ENTER LAB' }}
        </PixelButton>
      </div>

      <div class="hero-right">
        <div class="pixel-character">
          <div :class="['character-sprite', characterState]">
            <div class="character-body"></div>
            <div class="character-eyes"></div>
            <div class="character-accessory"></div>
          </div>
          <div class="character-platform"></div>
        </div>
      </div>
    </div>
  </TileBase>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import TileBase from '../TileBase.vue'
import PixelIcon from '../PixelIcon.vue'
import PixelButton from '../PixelButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

const characterState = ref('idle')
const locked = computed(() => !authStore.isAuthenticated)

const workflowCount = computed(() => {
  // Count unique workflows (based on workflowId)
  return 1 // Single workflow for now
})

const analysisCount = computed(() => {
  // Count nodes that have been analyzed (have results)
  return workflowStore.nodes.filter((node: any) => node.data.result).length
})

const mapCount = computed(() => {
  // Count learning maps from learningMapStore if available
  return 0 // Will be populated later when integrated with learningMapStore
})

function handleEnter() {
  if (locked.value) {
    router.push({ name: 'Login' })
  } else {
    router.push({ name: 'WorkflowEditor' })
  }
}
</script>

<style scoped>
.hero-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-pixel-title);
  font-size: 10px;
  color: var(--pixel-accent-yellow);
  letter-spacing: 2px;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  height: 100%;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-title {
  font-family: var(--font-pixel-title);
  font-size: 32px;
  color: var(--pixel-accent-cyan);
  text-shadow: 2px 2px 0 var(--pixel-accent-magenta), 4px 4px 0 rgba(0, 0, 0, 0.8);
  margin-bottom: 8px;
  line-height: 1.4;
  letter-spacing: 3px;
}

.hero-subtitle {
  font-family: var(--font-pixel-body);
  font-size: 20px;
  color: var(--pixel-text-secondary);
  line-height: 1.5;
}

.hero-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-pixel-body);
  font-size: 18px;
  color: var(--pixel-accent-yellow);
  padding: 8px 12px;
  background: rgba(255, 190, 11, 0.1);
  border: 2px solid var(--pixel-accent-yellow);
}

.stat-item span {
  font-weight: bold;
}

.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pixel-character {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.character-sprite {
  position: relative;
  width: 120px;
  height: 120px;
  animation: pixel-breathe 3s ease-in-out infinite;
}

.character-body {
  position: absolute;
  width: 80px;
  height: 80px;
  background: var(--pixel-accent-cyan);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: var(--pixel-shadow-md);
}

.character-eyes {
  position: absolute;
  width: 60px;
  height: 20px;
  left: 50%;
  top: 40%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: space-around;
}

.character-eyes::before,
.character-eyes::after {
  content: '';
  width: 12px;
  height: 12px;
  background: var(--pixel-bg-primary);
  animation: pixel-blink 4s ease-in-out infinite;
}

.character-accessory {
  position: absolute;
  width: 40px;
  height: 12px;
  background: var(--pixel-accent-yellow);
  left: 50%;
  top: 70%;
  transform: translate(-50%, -50%);
}

.character-platform {
  width: 100px;
  height: 8px;
  background: var(--pixel-border-light);
  opacity: 0.3;
  border-radius: 50%;
}

.character-sprite.idle {
  animation: pixel-breathe 3s ease-in-out infinite;
}

.character-sprite.locked .character-body {
  background: var(--pixel-border-dark);
  opacity: 0.6;
}

@keyframes pixel-blink {
  0%,
  48%,
  52%,
  100% {
    height: 12px;
  }
  49%,
  51% {
    height: 2px;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 18px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-stats {
    gap: 12px;
  }

  .stat-item {
    font-size: 16px;
    padding: 6px 10px;
  }
}
</style>
