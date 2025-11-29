<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <div class="reset-password-card">
        <div class="reset-password-header">
          <div class="station-badge">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
              <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
            </svg>
            MAIN STATION
          </div>
          <h1>RESET PASSWORD</h1>
          <p>Enter your new password</p>
        </div>

        <div class="reset-password-body">
          <!-- Loading State (validating token) -->
          <div v-if="isValidatingToken" class="loading-state">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
            <p>Validating reset link...</p>
          </div>

          <!-- Invalid/Expired Token State -->
          <div v-else-if="!isTokenValid" class="error-state">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
            </div>
            <h2>INVALID RESET LINK</h2>
            <p class="error-description">
              This password reset link is invalid or has expired. Reset links are valid for 24 hours.
            </p>
            <div class="action-buttons">
              <router-link to="/forgot-password" class="primary-btn">REQUEST NEW LINK</router-link>
              <router-link to="/login" class="secondary-btn">BACK TO LOGIN</router-link>
            </div>
          </div>

          <!-- Success State -->
          <div v-else-if="passwordResetSuccess" class="success-state">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h2>PASSWORD RESET SUCCESSFUL</h2>
            <p class="success-message">
              Your password has been successfully reset. All active sessions have been terminated for security.
            </p>
            <p class="info-message">
              You can now sign in with your new password.
            </p>
            <div class="action-buttons">
              <router-link to="/login" class="primary-btn">SIGN IN</router-link>
            </div>
          </div>

          <!-- Form State -->
          <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
            <p class="form-description">
              Choose a strong password for your account. Your password must meet all requirements below.
            </p>

            <div class="form-group">
              <label for="password">NEW PASSWORD</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter new password"
                required
                :disabled="isSubmitting"
                @input="validatePassword"
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword">CONFIRM PASSWORD</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                :disabled="isSubmitting"
                @input="validatePasswordMatch"
              />
            </div>

            <!-- Password Requirements -->
            <div class="password-requirements">
              <p class="requirements-title">PASSWORD REQUIREMENTS:</p>
              <ul>
                <li :class="{ valid: requirements.minLength, invalid: password && !requirements.minLength }">
                  At least 8 characters long
                </li>
                <li :class="{ valid: requirements.hasUppercase, invalid: password && !requirements.hasUppercase }">
                  Contains uppercase letter
                </li>
                <li :class="{ valid: requirements.hasLowercase, invalid: password && !requirements.hasLowercase }">
                  Contains lowercase letter
                </li>
                <li :class="{ valid: requirements.hasNumber, invalid: password && !requirements.hasNumber }">
                  Contains number
                </li>
                <li :class="{ valid: requirements.hasSpecial, invalid: password && !requirements.hasSpecial }">
                  Contains special character (!@#$%^&*)
                </li>
                <li :class="{ valid: requirements.passwordsMatch, invalid: confirmPassword && !requirements.passwordsMatch }">
                  Passwords match
                </li>
              </ul>
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting || !isFormValid">
              {{ isSubmitting ? 'RESETTING PASSWORD...' : 'RESET PASSWORD' }}
            </button>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </form>
        </div>

        <div class="reset-password-footer">
          <p>Remember your password? <router-link to="/login">Sign in</router-link></p>
          <p>Need a new reset link? <router-link to="/forgot-password">Request reset</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const isValidatingToken = ref(true)
const isTokenValid = ref(false)
const isSubmitting = ref(false)
const passwordResetSuccess = ref(false)
const errorMessage = ref('')

const requirements = ref({
  minLength: false,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSpecial: false,
  passwordsMatch: false
})

const isFormValid = computed(() => {
  return (
    requirements.value.minLength &&
    requirements.value.hasUppercase &&
    requirements.value.hasLowercase &&
    requirements.value.hasNumber &&
    requirements.value.hasSpecial &&
    requirements.value.passwordsMatch
  )
})

function validatePassword() {
  requirements.value.minLength = password.value.length >= 8
  requirements.value.hasUppercase = /[A-Z]/.test(password.value)
  requirements.value.hasLowercase = /[a-z]/.test(password.value)
  requirements.value.hasNumber = /\d/.test(password.value)
  requirements.value.hasSpecial = /[!@#$%^&*]/.test(password.value)
  validatePasswordMatch()
}

function validatePasswordMatch() {
  requirements.value.passwordsMatch = password.value === confirmPassword.value && password.value.length > 0
}

async function validateToken() {
  const tokenParam = route.query.token as string

  if (!tokenParam) {
    console.error('[ResetPasswordPage] No token provided in URL')
    isValidatingToken.value = false
    isTokenValid.value = false
    return
  }

  token.value = tokenParam

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/reset-password?token=${encodeURIComponent(token.value)}`, {
      method: 'GET',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Invalid or expired reset token')
    }

    console.log('[ResetPasswordPage] Token validated successfully')
    isTokenValid.value = true
  } catch (error: any) {
    console.error('[ResetPasswordPage] Token validation error:', error)
    isTokenValid.value = false
  } finally {
    isValidatingToken.value = false
  }
}

async function handleSubmit() {
  if (!isFormValid.value) {
    errorMessage.value = 'Please meet all password requirements'
    return
  }

  if (!token.value) {
    errorMessage.value = 'Invalid reset token'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password')
    }

    console.log('[ResetPasswordPage] Password reset successful')
    passwordResetSuccess.value = true

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error: any) {
    console.error('[ResetPasswordPage] Error:', error)
    errorMessage.value = error.message || 'Failed to reset password. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  validateToken()
})
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-bg-page);
  padding: 2rem;
}

.reset-password-container {
  width: 100%;
  max-width: 520px;
}

.reset-password-card {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.reset-password-header {
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

.reset-password-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.reset-password-header p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.reset-password-body {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--industrial-border);
  border-top-color: var(--industrial-text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--industrial-text-secondary);
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

.error-description {
  margin: 0 0 2rem;
  font-size: 0.9375rem;
  line-height: 1.6;
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
  margin: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--industrial-text-secondary);
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
.reset-password-form {
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

/* Password Requirements */
.password-requirements {
  margin: 0 0 1.5rem;
  padding: 1.25rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-sm);
}

.requirements-title {
  margin: 0 0 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--industrial-text-primary);
}

.password-requirements ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.password-requirements li {
  padding: 0.375rem 0 0.375rem 1.5rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--industrial-text-secondary);
  position: relative;
}

.password-requirements li::before {
  content: '○';
  position: absolute;
  left: 0;
  font-weight: 700;
  color: var(--industrial-text-secondary);
}

.password-requirements li.valid {
  color: var(--industrial-text-primary);
}

.password-requirements li.valid::before {
  content: '●';
  color: var(--industrial-text-primary);
}

.password-requirements li.invalid {
  color: var(--industrial-text-secondary);
  opacity: 0.6;
}

.password-requirements li.invalid::before {
  content: '○';
  color: var(--industrial-text-secondary);
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

.primary-btn,
.secondary-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
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

.primary-btn {
  background: var(--industrial-text-primary);
  color: var(--industrial-bg-module);
}

.primary-btn:hover {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

.secondary-btn {
  background: transparent;
  color: var(--industrial-text-primary);
}

.secondary-btn:hover {
  background: var(--industrial-bg-page);
  transform: translateY(-1px);
}

/* Footer */
.reset-password-footer {
  padding: 1.5rem 2.5rem;
  border-top: 1px solid var(--industrial-divider);
  text-align: center;
}

.reset-password-footer p {
  margin: 0.5rem 0;
  font-size: 0.8125rem;
  color: var(--industrial-text-secondary);
}

.reset-password-footer a {
  color: var(--industrial-text-primary);
  text-decoration: none;
  font-weight: 600;
  transition: opacity var(--transition-fast);
}

.reset-password-footer a:hover {
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 640px) {
  .reset-password-page {
    padding: 1rem;
  }

  .reset-password-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .reset-password-header h1 {
    font-size: 1.5rem;
  }

  .reset-password-body {
    padding: 2rem 1.5rem;
  }

  .success-state h2,
  .error-state h2 {
    font-size: 1.25rem;
  }

  .reset-password-footer {
    padding: 1.25rem 1.5rem;
  }
}
</style>
