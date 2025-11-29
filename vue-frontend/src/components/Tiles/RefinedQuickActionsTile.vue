<template>
  <RefinedTileBase :span="3" :row="1" class="quick-actions-tile">
    <template #header>
      <h4 class="refined-h4">Quick Actions</h4>
    </template>

    <div class="actions-grid">
      <button @click="handleAction('workflow')" class="action-btn">
        <div class="action-icon">⚡</div>
        <span class="refined-caption">New Workflow</span>
      </button>

      <button @click="handleAction('analyze')" class="action-btn">
        <div class="action-icon">🔍</div>
        <span class="refined-caption">Analyze</span>
      </button>

      <button @click="handleAction('map')" class="action-btn">
        <div class="action-icon">🗺️</div>
        <span class="refined-caption">Map</span>
      </button>
    </div>
  </RefinedTileBase>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import RefinedTileBase from './RefinedTileBase.vue'

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
      console.log('[QuickActions] Navigate to learning map (not implemented yet)')
      break
  }
}
</script>

<style scoped>
.quick-actions-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
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
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-sm);
  background: var(--refined-bg-primary);
  border: 1px solid var(--refined-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--refined-bg-tertiary);
  border-color: var(--refined-accent-orange);
  transform: translateY(-2px);
  box-shadow: var(--refined-shadow-sm);
}

.action-btn:active {
  transform: translateY(0);
}

.action-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.action-btn .refined-caption {
  color: var(--refined-text-secondary);
  font-size: 0.7rem;
}
</style>
