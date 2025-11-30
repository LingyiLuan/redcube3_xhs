<template>
  <div class="auth-empty-state">
    <component :is="icon" :size="48" class="empty-icon" />
    <h4 class="empty-title">{{ title }}</h4>
    <p class="empty-description">{{ description }}</p>
    <button @click="handleLogin" class="login-btn">Sign In</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

defineProps<{
  icon: any
  title: string
  description: string
}>()

const router = useRouter()
const route = useRoute()

function handleLogin() {
  // Navigate to industrial login page with returnUrl
  const returnUrl = route.path || '/workflow'
  router.push({
    path: '/login',
    query: { returnUrl }
  })
}
</script>

<style scoped>
.auth-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 48px 24px;
}

.empty-icon {
  color: #9CA3AF;
  opacity: 0.8;
}

.empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.empty-description {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  max-width: 320px;
  line-height: 1.5;
}

.login-btn {
  border: none;
  background: #1E3A8A;
  color: #fff;
  border-radius: 8px;
  padding: 10px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.login-btn:hover {
  background: #1E40AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}
</style>

