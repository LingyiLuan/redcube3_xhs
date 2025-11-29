<template>
  <RefinedTileBase :span="6" :row="2" class="hero-tile">
    <div class="hero-content">
      <div class="hero-left">
        <div class="hero-label refined-caption">WORKSPACE</div>
        <h1 class="hero-title refined-h1">Working Lab</h1>
        <p class="hero-description refined-body-sm">
          Visual workflow editor for analyzing interview data and generating insights through
          connected nodes
        </p>

        <div v-if="isAuthenticated" class="hero-stats">
          <div class="stat-card">
            <div class="stat-value refined-h3">{{ workflowCount }}</div>
            <div class="stat-label refined-caption">Workflows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value refined-h3">{{ analysisCount }}</div>
            <div class="stat-label refined-caption">Analyses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value refined-h3">{{ mapCount }}</div>
            <div class="stat-label refined-caption">Maps</div>
          </div>
        </div>

        <div class="hero-actions">
          <button @click="handleEnterLab" class="refined-btn refined-btn-primary">
            <span v-if="isAuthenticated">Enter Lab →</span>
            <span v-else>🔒 Login to Access</span>
          </button>
        </div>
      </div>

      <div class="hero-right">
        <div class="workspace-visual">
          <div class="visual-grid">
            <div class="grid-cell"></div>
            <div class="grid-cell"></div>
            <div class="grid-cell active"></div>
            <div class="grid-cell"></div>
            <div class="grid-cell active"></div>
            <div class="grid-cell"></div>
            <div class="grid-cell"></div>
            <div class="grid-cell active"></div>
            <div class="grid-cell"></div>
          </div>
          <div class="visual-connections">
            <svg class="connection-line" viewBox="0 0 200 200">
              <path
                d="M 50 50 Q 100 80, 150 50"
                stroke="var(--refined-accent-orange)"
                stroke-width="2"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 50 100 L 150 150"
                stroke="var(--refined-accent-orange)"
                stroke-width="2"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </RefinedTileBase>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import RefinedTileBase from './RefinedTileBase.vue'

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
  background: linear-gradient(135deg, var(--refined-bg-secondary) 0%, var(--refined-bg-tertiary) 100%);
}

.hero-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--space-xl);
  align-items: center;
  height: 100%;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hero-label {
  color: var(--refined-accent-orange);
}

.hero-title {
  color: var(--refined-accent-orange);
  margin: 0;
}

.hero-description {
  max-width: 440px;
  line-height: 1.6;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  margin: var(--space-sm) 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--refined-bg-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--refined-shadow-xs);
  text-align: center;
}

.stat-value {
  color: var(--refined-accent-orange);
  font-weight: 700;
}

.stat-label {
  color: var(--refined-text-tertiary);
}

.hero-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* Workspace Visual */
.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.workspace-visual {
  position: relative;
  width: 200px;
  height: 200px;
}

.visual-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  position: relative;
  z-index: 1;
}

.grid-cell {
  aspect-ratio: 1;
  background: var(--refined-bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--refined-shadow-xs);
  transition: all var(--transition-base);
}

.grid-cell.active {
  background: var(--refined-accent-orange);
  box-shadow: var(--refined-shadow-sm), var(--refined-glow-subtle);
  animation: cell-pulse 2s ease-in-out infinite;
}

@keyframes cell-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.visual-connections {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.connection-line {
  width: 100%;
  height: 100%;
}

.connection-line path {
  stroke-dasharray: 5, 5;
  animation: dash 20s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }

  .hero-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
