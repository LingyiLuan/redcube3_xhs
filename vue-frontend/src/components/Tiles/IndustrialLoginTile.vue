<template>
  <IndustrialTileBase :span="3" :row="1" :interactive="true" class="login-tile" @click="handleClick">
    <template #header>
      <h4 class="industrial-h4">{{ isAuthenticated ? 'Account' : 'Login' }}</h4>
    </template>

    <div v-if="isAuthenticated" class="user-profile">
      <div class="user-avatar">
        <div class="avatar-box">{{ user?.name?.charAt(0).toUpperCase() }}</div>
      </div>
      <div class="user-info">
        <p class="industrial-body" style="font-weight: 600; margin-bottom: 2px;">{{ user?.name }}</p>
        <p class="industrial-caption">{{ user?.email }}</p>
      </div>
    </div>

    <div v-else class="login-prompt">
      <p class="industrial-body-sm" style="margin-bottom: var(--space-md);">
        Sign in to access your workspace
      </p>
      <button class="industrial-btn industrial-btn-primary" style="width: 100%;">
        Login →
      </button>
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

const isAuthenticated = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

function handleClick() {
  if (!isAuthenticated.value) {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.login-tile {
  display: flex;
  flex-direction: column;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  text-align: center;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-box {
  width: 64px;
  height: 64px;
  border: 2px solid var(--industrial-text-primary);
  background: var(--industrial-bg-page);
  color: var(--industrial-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
}

.user-info {
  width: 100%;
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
  align-items: center;
  text-align: center;
}

.login-prompt p {
  margin: 0;
}
</style>
