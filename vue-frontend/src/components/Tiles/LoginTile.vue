<template>
  <LightTileBase :span="3" :row="1" glow="cyan" interactive @click="handleClick">
    <div class="login-tile-content">
      <div v-if="!isAuthenticated" class="login-prompt">
        <div class="login-icon">👤</div>
        <div class="login-text">
          <div class="light-h4">Sign In</div>
          <div class="light-body-sm">Access your workspace</div>
        </div>
      </div>

      <div v-else class="user-profile">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <div class="user-name light-h4">{{ userName }}</div>
          <div class="user-email light-caption">{{ userEmail }}</div>
        </div>
      </div>
    </div>
  </LightTileBase>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LightTileBase from './LightTileBase.vue'

const router = useRouter()
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userName = computed(() => authStore.user?.name || 'User')
const userEmail = computed(() => authStore.user?.email || '')
const userInitials = computed(() => {
  const name = userName.value
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

function handleClick() {
  if (!isAuthenticated.value) {
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped>
.login-tile-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.login-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.login-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--light-accent-blue), var(--light-accent-cyan));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  color: var(--light-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .user-profile {
    flex-direction: column;
    text-align: center;
  }
}
</style>
