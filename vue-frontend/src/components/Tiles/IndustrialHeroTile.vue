<template>
  <IndustrialTileBase :span="6" :row="2" class="hero-tile">
    <div class="hero-main">
      <!-- Big Character -->
      <div class="hero-character">
        <svg viewBox="0 0 100 100" class="character-icon">
          <!-- Robot/Lab character in industrial style -->
          <rect x="30" y="20" width="40" height="40" fill="none" stroke="#1c1c1c" stroke-width="3" />
          <rect x="35" y="25" width="12" height="12" fill="#1c1c1c" />
          <rect x="53" y="25" width="12" height="12" fill="#1c1c1c" />
          <rect x="25" y="35" width="8" height="20" fill="none" stroke="#1c1c1c" stroke-width="3" />
          <rect x="67" y="35" width="8" height="20" fill="none" stroke="#1c1c1c" stroke-width="3" />
          <rect x="40" y="60" width="8" height="25" fill="none" stroke="#1c1c1c" stroke-width="3" />
          <rect x="52" y="60" width="8" height="25" fill="none" stroke="#1c1c1c" stroke-width="3" />
          <rect x="42" y="48" width="16" height="4" fill="#1c1c1c" />
        </svg>
      </div>

      <!-- Station Badge and Title -->
      <div class="hero-text">
        <div class="hero-badge">
          <svg viewBox="0 0 16 16" width="16" height="16" class="badge-icon">
            <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
            <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
            <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
            <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
          </svg>
          MAIN STATION
        </div>

        <h1 class="hero-title">
          <TypewriterText text="WORKING LAB" :speed="80" />
        </h1>

        <p class="hero-subtitle">
          Visual workflow editor for analyzing interview data
        </p>

        <button @click="handleEnter" class="industrial-btn industrial-btn-primary enter-btn">
          Enter Working Lab →
        </button>
      </div>
    </div>
  </IndustrialTileBase>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import IndustrialTileBase from './IndustrialTileBase.vue'
import TypewriterText from '@/components/TypewriterText.vue'

const router = useRouter()
const authStore = useAuthStore()

function handleEnter() {
  if (authStore.isAuthenticated) {
    router.push({ name: 'WorkflowEditor' })
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.hero-tile {
  display: flex;
  flex-direction: column;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-xl);
}

.hero-character {
  flex-shrink: 0;
}

.character-icon {
  width: 120px;
  height: 120px;
}

.hero-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--industrial-text-primary);
  background: var(--industrial-bg-module);
  color: var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  width: fit-content;
}

.badge-icon {
  flex-shrink: 0;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--industrial-text-primary);
  margin: 0;
  text-transform: uppercase;
}

.hero-subtitle {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--industrial-text-secondary);
  margin: 0;
  max-width: 450px;
}

.enter-btn {
  margin-top: var(--space-sm);
  width: fit-content;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-main {
    flex-direction: column;
    text-align: center;
    padding: var(--space-lg);
  }

  .hero-text {
    align-items: center;
  }

  .character-icon {
    width: 80px;
    height: 80px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    max-width: 100%;
  }

  .enter-btn {
    width: 100%;
  }
}
</style>
