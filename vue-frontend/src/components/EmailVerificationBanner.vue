<template>
  <!-- Only show banner if user is logged in but email is not verified -->
  <div v-if="shouldShowBanner" class="verification-banner">
    <div class="banner-container">
      <div class="banner-content">
        <!-- Info Icon -->
        <div class="banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>

        <!-- Message -->
        <div class="banner-message">
          <span class="banner-text">
            <strong>Verify your email address.</strong>
            Check your inbox for the verification link we sent to <strong>{{ userEmail }}</strong>.
          </span>
        </div>
      </div>

      <!-- Resend Button -->
      <div class="banner-actions">
        <button
          @click="handleResendEmail"
          :disabled="isResending || cooldownRemaining > 0"
          class="resend-btn"
        >
          <span v-if="cooldownRemaining > 0">
            Resend in {{ cooldownRemaining }}s
          </span>
          <span v-else-if="isResending">
            Sending...
          </span>
          <span v-else>
            Resend Email
          </span>
        </button>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="resendMessage" :class="['resend-notification', resendMessageType]">
      {{ resendMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'

// ===== STORES =====
const authStore = useAuthStore()

// ===== STATE =====
const isResending = ref(false)
const cooldownRemaining = ref(0)
const resendMessage = ref('')
const resendMessageType = ref<'success' | 'error'>('success')

let cooldownInterval: ReturnType<typeof setInterval> | null = null

// ===== COMPUTED =====
const shouldShowBanner = computed(() => {
  // Show banner if user is authenticated but email is not verified
  return (
    authStore.isAuthenticated &&
    authStore.user &&
    authStore.user.emailVerified === false
  )
})

const userEmail = computed(() => authStore.user?.email || '')

// ===== METHODS =====
async function handleResendEmail() {
  if (isResending.value || cooldownRemaining.value > 0) {
    return
  }

  isResending.value = true
  resendMessage.value = ''

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/resend-verification`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to resend verification email')
    }

    // Success - set expectations about delivery time
    resendMessage.value = 'Verification email is being sent! This may take a few minutes - check your inbox and spam folder.'
    resendMessageType.value = 'success'

    // Start 60-second cooldown
    startCooldown()

    // Clear success message after 5 seconds
    setTimeout(() => {
      resendMessage.value = ''
    }, 5000)
  } catch (error: any) {
    console.error('[EmailVerificationBanner] Resend failed:', error)
    resendMessage.value = error.message || 'Failed to send email. Please try again.'
    resendMessageType.value = 'error'

    // Clear error message after 5 seconds
    setTimeout(() => {
      resendMessage.value = ''
    }, 5000)
  } finally {
    isResending.value = false
  }
}

function startCooldown() {
  cooldownRemaining.value = 60

  cooldownInterval = setInterval(() => {
    cooldownRemaining.value--

    if (cooldownRemaining.value <= 0) {
      if (cooldownInterval) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }
  }, 1000)
}

// ===== LIFECYCLE =====
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<style scoped>
/* Banner Container - Fixed at top of viewport */
.verification-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-bottom: 2px solid #b45309;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.banner-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.banner-icon {
  flex-shrink: 0;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-message {
  flex: 1;
}

.banner-text {
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.banner-text strong {
  font-weight: 600;
}

/* Actions */
.banner-actions {
  flex-shrink: 0;
}

.resend-btn {
  padding: 0.5rem 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.resend-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Notification Messages */
.resend-notification {
  padding: 0.75rem 1.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 500;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.resend-notification.success {
  background: rgba(16, 185, 129, 0.15);
  color: #fff;
}

.resend-notification.error {
  background: rgba(239, 68, 68, 0.15);
  color: #fff;
}

/* Responsive Design */
@media (max-width: 768px) {
  .banner-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem;
  }

  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .banner-text {
    font-size: 0.8125rem;
  }

  .resend-btn {
    width: 100%;
  }
}

/* Ensure page content shifts down when banner is visible */
:global(body.has-verification-banner) {
  padding-top: 60px;
}

@media (max-width: 768px) {
  :global(body.has-verification-banner) {
    padding-top: 100px;
  }
}
</style>
