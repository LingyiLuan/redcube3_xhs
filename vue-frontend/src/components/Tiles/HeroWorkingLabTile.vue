<template>
  <LightTileBase :span="6" :row="2" glow="blue" class="hero-tile">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-label light-caption">MAIN WORKSPACE</div>
        <h1 class="hero-title">Working Lab</h1>
        <p class="hero-description light-body-sm">
          Visual workflow editor for analyzing interview data and generating insights
        </p>

        <div v-if="isAuthenticated" class="hero-stats">
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ workflowCount }}</div>
              <div class="stat-label">Workflows</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-value">{{ analysisCount }}</div>
              <div class="stat-label">Analyses</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🗺️</div>
            <div class="stat-content">
              <div class="stat-value">{{ mapCount }}</div>
              <div class="stat-label">Maps</div>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <button
            @click="handleEnterLab"
            :class="['light-btn', isAuthenticated ? 'light-btn-primary' : 'light-btn-outline']"
          >
            <span v-if="isAuthenticated">Enter Lab →</span>
            <span v-else>🔒 Login to Enter</span>
          </button>
        </div>
      </div>

      <div class="hero-right">
        <div class="pixel-character-container">
          <div class="pixel-character">
            <div class="character-head"></div>
            <div class="character-body"></div>
            <div class="character-desk">
              <div class="desk-laptop">
                <div class="laptop-screen"></div>
                <div class="laptop-screen-glow"></div>
              </div>
            </div>
          </div>
          <div class="character-shadow"></div>
        </div>
      </div>
    </div>
  </LightTileBase>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import LightTileBase from './LightTileBase.vue'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const workflowCount = computed(() => 1)
const analysisCount = computed(() => {
  return workflowStore.nodes.filter((node: any) => node.data.result).length
})
const mapCount = computed(() => 0)

function handleEnterLab() {
  if (isAuthenticated.value) {
    router.push({ name: 'WorkflowEditor' })
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.hero-tile {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  height: 100%;
  min-height: 300px;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-label {
  color: var(--light-accent-blue);
  font-weight: 600;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--light-accent-blue), var(--light-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.2;
}

.hero-description {
  color: var(--light-text-secondary);
  max-width: 400px;
}

.hero-stats {
  display: flex;
  gap: 24px;
  margin: 8px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--light-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--light-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

/* Pixel Character */
.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pixel-character-container {
  position: relative;
  width: 200px;
  height: 200px;
}

.pixel-character {
  position: relative;
  width: 100%;
  height: 100%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.character-head {
  position: absolute;
  width: 60px;
  height: 60px;
  background: var(--light-accent-blue);
  border-radius: 50%;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.2);
}

.character-head::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  top: 20px;
  left: 12px;
  animation: blink 4s infinite;
}

.character-head::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  top: 20px;
  right: 12px;
  animation: blink 4s infinite;
}

@keyframes blink {
  0%, 48%, 52%, 100% {
    height: 12px;
  }
  49%, 51% {
    height: 2px;
  }
}

.character-body {
  position: absolute;
  width: 80px;
  height: 70px;
  background: linear-gradient(135deg, var(--light-accent-blue), var(--light-accent-cyan));
  border-radius: 20px 20px 0 0;
  top: 75px;
  left: 50%;
  transform: translateX(-50%);
}

.character-desk {
  position: absolute;
  width: 140px;
  height: 80px;
  background: var(--light-bg-tertiary);
  border-radius: 8px;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: var(--light-shadow-sm);
}

.desk-laptop {
  position: absolute;
  width: 80px;
  height: 50px;
  background: var(--light-text-secondary);
  border-radius: 4px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.laptop-screen {
  position: absolute;
  width: 70px;
  height: 40px;
  background: var(--light-accent-cyan);
  border-radius: 2px;
  top: 5px;
  left: 5px;
  animation: screen-glow 2s ease-in-out infinite;
}

.laptop-screen-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0, 188, 212, 0.3), transparent 70%);
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes screen-glow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.character-shadow {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 8px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.1), transparent 70%);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hero-right {
    display: none;
  }

  .hero-title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 16px;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}
</style>
