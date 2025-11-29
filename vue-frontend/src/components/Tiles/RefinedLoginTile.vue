<template>
  <RefinedTileBase :span="3" :row="1" :interactive="true" class="login-tile" @click="handleClick">
    <template #header>
      <div class="login-header">
        <h4 class="refined-h4">{{ isAuthenticated ? user?.name : 'Account' }}</h4>
      </div>
    </template>

    <div v-if="isAuthenticated" class="user-profile">
      <div class="user-avatar">
        <div class="avatar-circle">{{ user?.name?.charAt(0).toUpperCase() }}</div>
      </div>
      <div class="user-info">
        <p class="refined-body-sm">{{ user?.email }}</p>
      </div>
    </div>

    <div v-else class="login-prompt">
      <p class="refined-body-sm">Sign in to access your workspace</p>
      <button class="refined-btn refined-btn-primary btn-small">Login →</button>
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

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

function handleClick() {
  if (isAuthenticated.value) {
    // Navigate to profile or settings
    console.log('[RefinedLoginTile] Navigate to profile')
  } else {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.login-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--refined-accent-orange);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: flex-start;
}

.login-prompt p {
  margin: 0;
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.8125rem;
}
</style>
