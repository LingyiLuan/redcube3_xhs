<template>
  <IndustrialTileBase
    :span="3"
    :row="1"
    :interactive="true"
    :badge="hasNewData ? 'NEW' : undefined"
    badge-variant="alert"
    class="data-tile"
    @click="handleClick"
  >
    <template #header>
      <h4 class="industrial-h4">Data Insights</h4>
    </template>

    <div class="data-preview">
      <div class="data-stats">
        <div class="stat">
          <div class="stat-value industrial-h3">{{ dataCount }}</div>
          <div class="stat-label industrial-caption">Records</div>
        </div>
        <div class="stat">
          <div class="stat-value industrial-h3">{{ insightCount }}</div>
          <div class="stat-label industrial-caption">Insights</div>
        </div>
      </div>

      <div class="data-visual">
        <div class="bar-chart">
          <div class="bar" style="height: 60%;"></div>
          <div class="bar" style="height: 85%;"></div>
          <div class="bar" style="height: 45%;"></div>
          <div class="bar" style="height: 75%;"></div>
          <div class="bar" style="height: 92%;"></div>
        </div>
      </div>
    </div>
  </IndustrialTileBase>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import IndustrialTileBase from './IndustrialTileBase.vue'

const router = useRouter()
const authStore = useAuthStore()

const dataCount = computed(() => 247)
const insightCount = computed(() => 18)
const hasNewData = computed(() => true)

function handleClick() {
  if (authStore.isAuthenticated) {
    console.log('[DataTile] Navigate to data insights')
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.data-tile {
  display: flex;
  flex-direction: column;
}

.data-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  flex: 1;
}

.data-stats {
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
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
}

.stat-value {
  font-weight: 700;
  line-height: 1;
  color: var(--industrial-text-primary);
}

.stat-label {
  color: var(--industrial-text-tertiary);
}

.data-visual {
  flex: 1;
  padding: var(--space-md);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: flex-end;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  width: 100%;
  height: 60px;
}

.bar {
  flex: 1;
  background: var(--industrial-text-primary);
  border: 1px solid var(--industrial-text-primary);
  min-height: 20%;
  transition: all var(--transition-base);
}

.bar:hover {
  background: var(--industrial-icon);
}
</style>
