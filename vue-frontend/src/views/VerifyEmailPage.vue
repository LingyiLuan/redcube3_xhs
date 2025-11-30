<template>
  <div class="verify-email-page">
    <div class="verify-email-container">
      <div class="verify-email-card">
        <div class="verify-email-header">
          <div class="station-badge">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
              <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
            </svg>
            MAIN STATION
          </div>
          <h1>
            <span class="verify-logo-text">
              <span class="verify-logo-lab">Lab</span><span class="verify-logo-zero">Zero</span>
            </span>
          </h1>
          <p>Email Verification</p>
        </div>

        <div class="verify-email-body">
          <!-- Loading State -->
          <div v-if="isVerifying" class="loading-state">
            <div class="loading-spinner"></div>
            <h2>Verifying Your Email</h2>
            <p>Please wait while we verify your email address...</p>
          </div>

          <!-- Success State -->
          <div v-else-if="verificationStatus === 'success'" class="success-state">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h2>Email Verified Successfully!</h2>
            <p class="success-message">
              Your email address has been verified. Redirecting to dashboard...
            </p>
            <div class="loading-spinner small-spinner"></div>
          </div>

          <!-- Error State -->
          <div v-else-if="verificationStatus === 'error'" class="error-state">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
            </div>
            <h2>Verification Failed</h2>
            <p class="error-message">{{ errorMessage }}</p>

            <div class="error-reasons">
              <p>This could be because:</p>
              <ul>
                <li>The verification link has expired (links are valid for 24 hours)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>

            <div class="action-buttons">
              <button @click="handleResendVerification" class="primary-btn" :disabled="isResending">
                {{ isResending ? 'SENDING...' : 'RESEND VERIFICATION EMAIL' }}
              </button>
              <button @click="router.push({ name: 'register' })" class="secondary-btn">
                CREATE NEW ACCOUNT
              </button>
            </div>

            <div v-if="resendMessage" class="resend-message" :class="resendSuccess ? 'success' : 'error'">
              {{ resendMessage }}
            </div>
          </div>

          <!-- No Token State -->
          <div v-else class="no-token-state">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2>No Verification Token</h2>
            <p class="warning-message">
              This page requires a verification token. Please use the link from your verification email.
            </p>
            <div class="action-buttons">
              <button @click="router.push({ name: 'landing' })" class="primary-btn">
                GO TO HOME
              </button>
              <button @click="router.push({ name: 'register' })" class="secondary-btn">
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isVerifying = ref(false)
const verificationStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')
const isResending = ref(false)
const resendMessage = ref('')
const resendSuccess = ref(false)
const userEmail = ref('') // Store email for resend

async function verifyEmail(token: string) {
  isVerifying.value = true
  verificationStatus.value = 'idle'

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed')
    }

    verificationStatus.value = 'success'
    console.log('[VerifyEmailPage] Email verified successfully', data)

    // Auto-login successful - redirect to dashboard after brief delay
    if (data.autoLoginSuccess && data.user) {
      console.log('[VerifyEmailPage] User auto-logged in:', data.user)
      setTimeout(() => {
        router.push({ name: 'landing' })
      }, 2000) // 2 second delay to show success message
    }
    // Auto-login failed - user needs to manually sign in
    else if (data.autoLoginFailed) {
      console.log('[VerifyEmailPage] Auto-login failed, redirecting to login')
      setTimeout(() => {
        router.push({ name: 'login' })
      }, 3000)
    }
  } catch (error: any) {
    console.error('[VerifyEmailPage] Verification failed:', error)
    verificationStatus.value = 'error'
    errorMessage.value = error.message || 'Unable to verify your email. Please try again.'
  } finally {
    isVerifying.value = false
  }
}

async function handleResendVerification() {
  if (!userEmail.value) {
    resendMessage.value = 'Email address not available. Please try registering again.'
    resendSuccess.value = false
    return
  }

  isResending.value = true
  resendMessage.value = ''
  resendSuccess.value = false

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/resend-verification`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: userEmail.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification email')
    }

    resendSuccess.value = true
    resendMessage.value = 'Verification email sent! Please check your inbox.'
    console.log('[VerifyEmailPage] Resend verification successful')
  } catch (error: any) {
    console.error('[VerifyEmailPage] Resend verification failed:', error)
    resendSuccess.value = false
    resendMessage.value = error.message || 'Failed to resend verification email. Please try again.'
  } finally {
    isResending.value = false
  }
}

onMounted(() => {
  const token = route.query.token as string
  const emailParam = route.query.email as string

  // Store email from URL parameter (if provided)
  if (emailParam) {
    userEmail.value = emailParam
  }

  if (token) {
    verifyEmail(token)
  } else {
    verificationStatus.value = 'error'
  }
})
</script>

<style scoped>
.verify-email-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-bg-page);
  padding: 2rem;
}

.verify-email-container {
  width: 100%;
  max-width: 480px;
}

.verify-email-card {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.verify-email-header {
  text-align: center;
  padding: 3rem 2rem 2rem;
  border-bottom: 1px solid var(--industrial-divider);
}

.station-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--industrial-text-primary);
  background: var(--industrial-bg-module);
  color: var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  margin-bottom: 1.5rem;
}

.verify-email-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.verify-logo-text {
  display: inline-block;
}

.verify-logo-lab {
  color: var(--industrial-text-primary);
}

.verify-logo-zero {
  color: #1E3A8A;
}

.verify-email-header p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.verify-email-body {
  padding: 3rem 2.5rem;
}

/* Loading State */
.loading-state {
  text-align: center;
}

.loading-spinner {
  margin: 0 auto 1.5rem;
  width: 64px;
  height: 64px;
  border: 3px solid var(--industrial-border);
  border-top-color: var(--industrial-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state h2 {
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.loading-state p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--industrial-text-secondary);
}

/* Success State */
.success-state {
  text-align: center;
}

.success-icon {
  margin: 0 auto 1.5rem;
  width: 64px;
  height: 64px;
}

.success-icon svg {
  stroke: var(--industrial-text-primary);
}

.success-state h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.success-message {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
}

.small-spinner {
  margin: 1.5rem auto 0;
  width: 40px;
  height: 40px;
}

/* Error State */
.error-state {
  text-align: center;
}

.error-icon {
  margin: 0 auto 1.5rem;
  width: 64px;
  height: 64px;
}

.error-icon svg {
  stroke: var(--industrial-text-primary);
}

.error-state h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.error-message {
  margin: 0 0 1.5rem;
  font-size: 0.9375rem;
  color: var(--industrial-text-primary);
  font-weight: 500;
}

.error-reasons {
  margin: 1.5rem 0;
  padding: 1.25rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
  text-align: left;
}

.error-reasons p {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.error-reasons ul {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.error-reasons li {
  margin: 0.375rem 0;
  font-size: 0.8125rem;
  color: var(--industrial-text-secondary);
  line-height: 1.5;
}

/* No Token State */
.no-token-state {
  text-align: center;
}

.warning-icon {
  margin: 0 auto 1.5rem;
  width: 64px;
  height: 64px;
}

.warning-icon svg {
  stroke: var(--industrial-text-primary);
}

.no-token-state h2 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.warning-message {
  margin: 0 0 2rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 2rem;
}

.primary-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--industrial-text-primary);
  color: var(--industrial-bg-module);
  border: 1px solid var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.primary-btn:hover:not(:disabled) {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--industrial-bg-module);
  color: var(--industrial-text-primary);
  border: 1px solid var(--industrial-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.secondary-btn:hover {
  background: var(--industrial-accent);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-sm);
}

/* Resend Message */
.resend-message {
  margin-top: 1.25rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: center;
  border: 1px solid var(--industrial-border);
}

.resend-message.success {
  background: var(--industrial-bg-page);
  color: var(--industrial-text-primary);
  border-color: var(--industrial-text-primary);
}

.resend-message.error {
  background: var(--industrial-bg-page);
  color: var(--industrial-text-primary);
  border-color: var(--industrial-text-primary);
}

/* Responsive */
@media (max-width: 640px) {
  .verify-email-page {
    padding: 1rem;
  }

  .verify-email-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .verify-email-header h1 {
    font-size: 1.5rem;
  }

  .verify-email-body {
    padding: 2rem 1.5rem;
  }

  .success-state h2,
  .error-state h2,
  .no-token-state h2,
  .loading-state h2 {
    font-size: 1.25rem;
  }
}
</style>
