<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import PixelIcons from '@/components/Dashboard/PixelIcons.vue'
import EmailVerificationBanner from '@/components/EmailVerificationBanner.vue'
import LoginModal from '@/components/Navigation/LoginModal.vue'
import { useEventBus } from '@/utils/eventBus'

const router = useRouter()
const eventBus = useEventBus()
const isLoginModalOpen = ref(false)
const isLearningMapLoginModalOpen = ref(false)
const loginReturnUrl = ref<string | undefined>(undefined)

eventBus.on('open-login-modal', (payload) => {
  isLoginModalOpen.value = true
  loginReturnUrl.value = payload?.returnUrl
  // Store returnUrl in localStorage for Google OAuth (which causes full page redirect)
  if (payload?.returnUrl) {
    localStorage.setItem('oauth_return_url', payload.returnUrl)
  }
})

eventBus.on('open-learning-map-login', () => {
  isLearningMapLoginModalOpen.value = true
})

function handleLoginSuccess() {
  // Check localStorage first (for OAuth redirects), then fallback to state
  const storedReturnUrl = localStorage.getItem('oauth_return_url')
  const returnUrl = storedReturnUrl || loginReturnUrl.value
  
  if (returnUrl) {
    router.push(returnUrl)
    loginReturnUrl.value = undefined
    localStorage.removeItem('oauth_return_url')
  }
}
</script>

<template>
  <EmailVerificationBanner />
  <PixelIcons />
  <RouterView />
  <LoginModal v-model:is-open="isLoginModalOpen" @success="handleLoginSuccess" />
  <LoginModal v-model:is-open="isLearningMapLoginModalOpen" />
</template>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  min-height: 100vh;
}
</style>
