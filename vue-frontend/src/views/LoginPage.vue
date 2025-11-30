<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="station-badge">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="6" y="2" width="4" height="4" fill="#1c1c1c" />
              <rect x="2" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="10" y="6" width="4" height="4" fill="#1c1c1c" />
              <rect x="6" y="10" width="4" height="4" fill="#1c1c1c" />
            </svg>
            MAIN STATION
          </div>
          <h1>WORKING LAB</h1>
          <p>Sign in to access your workspace</p>
        </div>

        <div class="login-body">
          <!-- Google OAuth Button -->
          <button @click="handleGoogleLogin" class="google-login-btn" :disabled="isLoading">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isLoading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE' }}</span>
          </button>

          <div class="divider">
            <span>OR</span>
          </div>

          <!-- Email/Password Form -->
          <form @submit.prevent="handleEmailLogin" class="login-form">
            <div class="form-group">
              <label for="email">EMAIL</label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="your@email.com"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="password">PASSWORD</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                :disabled="isLoading"
              />
              <router-link to="/forgot-password" class="forgot-password-link">
                Forgot password?
              </router-link>
            </div>

            <button type="submit" class="email-login-btn" :disabled="isLoading">
              {{ isLoading ? 'SIGNING IN...' : 'SIGN IN WITH EMAIL' }}
            </button>
          </form>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <div class="login-footer">
          <p>Don't have an account? <router-link to="/register">Sign up</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Get returnUrl from query parameter, default to /workflow
const getReturnUrl = () => {
  const returnUrl = route.query.returnUrl as string | undefined
  return returnUrl || '/workflow'
}

async function handleGoogleLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const returnUrl = getReturnUrl()
    await authStore.loginWithGoogle(returnUrl)
    // User will be redirected to Google OAuth
  } catch (error: any) {
    console.error('[LoginPage] Google login failed:', error)
    errorMessage.value = error.message || 'Failed to sign in with Google'
    isLoading.value = false
  }
}

async function handleEmailLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.loginWithEmail(email.value, password.value)
    console.log('[LoginPage] Login successful, redirecting to returnUrl')
    const returnUrl = getReturnUrl()
    router.push(returnUrl)
  } catch (error: any) {
    console.error('[LoginPage] Email login failed:', error)
    errorMessage.value = error.message || 'Failed to sign in'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-bg-page);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-card {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.login-header {
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

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.login-header p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.login-body {
  padding: 2rem;
}

.google-login-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--industrial-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.google-login-btn:hover:not(:disabled) {
  background: var(--industrial-accent);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-sm);
}

.google-login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.google-icon {
  flex-shrink: 0;
}

.divider {
  position: relative;
  text-align: center;
  margin: 2rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--industrial-divider);
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 1rem;
  background: var(--industrial-bg-module);
  color: var(--industrial-text-tertiary);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--industrial-text-primary);
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--industrial-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--industrial-text-primary);
  background: var(--industrial-bg-module);
  transition: all var(--transition-fast);
}

.form-group input::placeholder {
  color: var(--industrial-text-tertiary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--industrial-icon);
  box-shadow: 0 0 0 3px var(--industrial-accent);
}

.form-group input:disabled {
  background: var(--industrial-bg-page);
  cursor: not-allowed;
  opacity: 0.5;
}

.forgot-password-link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--industrial-text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.forgot-password-link:hover {
  color: var(--industrial-text-primary);
}

.email-login-btn {
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
  margin-top: 0.5rem;
}

.email-login-btn:hover:not(:disabled) {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

.email-login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--industrial-bg-page);
  border: 1px solid var(--industrial-text-primary);
  border-radius: var(--radius-sm);
  color: var(--industrial-text-primary);
  font-size: 0.8125rem;
  text-align: center;
}

.login-footer {
  padding: 1.5rem 2rem;
  background: var(--industrial-bg-page);
  text-align: center;
  border-top: 1px solid var(--industrial-divider);
}

.login-footer p {
  margin: 0;
  color: var(--industrial-text-secondary);
  font-size: 0.8125rem;
}

.login-footer a {
  color: var(--industrial-text-primary);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.login-footer a:hover {
  color: var(--industrial-icon);
}

@media (max-width: 640px) {
  .login-page {
    padding: 1rem;
  }

  .login-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .login-body {
    padding: 1.5rem;
  }
}
</style>
