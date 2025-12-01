<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <div class="station-badge">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
              <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
            </svg>
            MAIN STATION
          </div>
          <h1>PASSWORD RECOVERY</h1>
          <p>Reset your account password</p>
        </div>

        <div class="forgot-password-body">
          <!-- Success State -->
          <div v-if="emailSent" class="success-state">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h2>CHECK YOUR EMAIL</h2>
            <p class="success-message">
              If an account exists with <strong>{{ submittedEmail }}</strong>, a password reset link has been sent.
            </p>
            <p class="info-message">
              <strong>What to do next:</strong><br>
              • Check your inbox and spam folder for the reset email<br>
              • Click the link in the email to reset your password<br>
              • The link will expire in 24 hours<br>
              <br>
              <strong>Note:</strong> For security, we send the same message whether the email exists or not. If you receive an email, your account exists. If you don't receive an email within a few minutes, check your spam folder or the email address may not be registered with us.
            </p>
            <div class="action-buttons">
              <router-link to="/login" class="primary-btn">BACK TO LOGIN</router-link>
            </div>
          </div>

          <!-- Form State -->
          <form v-else @submit.prevent="handleSubmit" class="forgot-password-form">
            <p class="form-description">
              Enter your email address and we'll send you a link to reset your password. For security, we'll send the same message whether the email exists or not.
            </p>

            <div class="form-group">
              <label for="email">EMAIL ADDRESS</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="your@email.com"
                required
                :disabled="isSubmitting"
              />
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'SENDING...' : 'SEND RESET LINK' }}
            </button>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </form>
        </div>

        <div class="forgot-password-footer">
          <p>Remember your password? <router-link to="/login">Sign in</router-link></p>
          <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const submittedEmail = ref('')
const isSubmitting = ref(false)
const emailSent = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!email.value) {
    errorMessage.value = 'Please enter your email address'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  submittedEmail.value = email.value

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset email')
    }

    console.log('[ForgotPasswordPage] Password reset email sent')
    emailSent.value = true
  } catch (error: any) {
    console.error('[ForgotPasswordPage] Error:', error)
    errorMessage.value = error.message || 'Failed to send reset email. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-bg-page);
  padding: 2rem;
}

.forgot-password-container {
  width: 100%;
  max-width: 480px;
}

.forgot-password-card {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.forgot-password-header {
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

.forgot-password-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.forgot-password-header p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.forgot-password-body {
  padding: 3rem 2.5rem;
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
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
}

.success-message strong {
  color: var(--industrial-text-primary);
  font-weight: 600;
}

.info-message {
  margin: 0 0 2rem;
  padding: 1.25rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
  text-align: left;
}

/* Form State */
.forgot-password-form {
  width: 100%;
}

.form-description {
  margin: 0 0 2rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--industrial-text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--industrial-text-primary);
  transition: all var(--transition-fast);
}

.form-group input:focus {
  outline: none;
  border-color: var(--industrial-text-primary);
  background: var(--industrial-bg-module);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  margin-top: 0.5rem;
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

.submit-btn:hover:not(:disabled) {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1.25rem;
  padding: 0.75rem 1rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--industrial-text-primary);
  text-align: center;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: block;
}

.primary-btn:hover {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

/* Footer */
.forgot-password-footer {
  padding: 1.5rem 2.5rem;
  border-top: 1px solid var(--industrial-divider);
  text-align: center;
}

.forgot-password-footer p {
  margin: 0.5rem 0;
  font-size: 0.8125rem;
  color: var(--industrial-text-secondary);
}

.forgot-password-footer a {
  color: var(--industrial-text-primary);
  text-decoration: none;
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.forgot-password-footer a:hover {
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 640px) {
  .forgot-password-page {
    padding: 1rem;
  }

  .forgot-password-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .forgot-password-header h1 {
    font-size: 1.5rem;
  }

  .forgot-password-body {
    padding: 2rem 1.5rem;
  }

  .success-state h2 {
    font-size: 1.25rem;
  }

  .forgot-password-footer {
    padding: 1.25rem 1.5rem;
  }
}
</style>
