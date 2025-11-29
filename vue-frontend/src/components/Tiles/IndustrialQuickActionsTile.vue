<template>
  <IndustrialTileBase :span="3" :row="1" class="quick-actions-tile">
    <template #header>
      <h4 class="industrial-h4">Quick Actions</h4>
    </template>

    <div class="actions-grid">
      <button @click="handleAction('workflow')" class="action-btn">
        <div class="action-icon">⚡</div>
        <span class="industrial-caption">Workflow</span>
      </button>

      <button @click="handleAction('analyze')" class="action-btn">
        <div class="action-icon">⚙</div>
        <span class="industrial-caption">Analyze</span>
      </button>

      <button @click="handleAction('map')" class="action-btn">
        <div class="action-icon">◆</div>
        <span class="industrial-caption">Map</span>
      </button>
    </div>
  </IndustrialTileBase>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import IndustrialTileBase from './IndustrialTileBase.vue'

const router = useRouter()
const authStore = useAuthStore()

function handleAction(action: string) {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login' })
    return
  }

  switch (action) {
    case 'workflow':
      router.push({ name: 'WorkflowEditor' })
      break
    case 'analyze':
      console.log('[QuickActions] Navigate to analyze')
      break
    case 'map':
      console.log('[QuickActions] Navigate to map')
      break
  }
}
</script>

<style scoped>
.quick-actions-tile {
  display: flex;
  flex-direction: column;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-sm);
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--industrial-accent);
  border-color: var(--industrial-border-strong);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-sm);
}

.action-btn:active {
  transform: translateY(0);
}

.action-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--industrial-icon);
}
</style>
