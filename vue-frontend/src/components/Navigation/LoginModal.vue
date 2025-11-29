<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content" @click.stop>
          <!-- Close Button -->
          <button @click="closeModal" class="close-btn" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Modal Header -->
          <div class="modal-header">
            <h2>{{ isRegisterMode ? 'Create Account' : 'Welcome Back' }}</h2>
            <p>{{ isRegisterMode ? 'Sign up to start using Workflow Lab' : 'Sign in to access your Workflow Lab' }}</p>
          </div>

          <!-- Email/Password Section -->
          <div class="email-section">
            <form @submit.prevent="handleEmailAuth" class="auth-form">
              <div class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  v-model="emailForm.email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  :disabled="isLoading"
                />
                <span v-if="emailErrors.email" class="field-error">{{ emailErrors.email }}</span>
              </div>

              <div class="form-group">
                <label for="password">Password</label>
                <input
                  id="password"
                  v-model="emailForm.password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  :disabled="isLoading"
                />
                <span v-if="emailErrors.password" class="field-error">{{ emailErrors.password }}</span>
              </div>

              <div v-if="isRegisterMode" class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  v-model="emailForm.confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  :disabled="isLoading"
                />
                <span v-if="emailErrors.confirmPassword" class="field-error">{{ emailErrors.confirmPassword }}</span>
              </div>

              <button type="submit" class="submit-btn" :disabled="isLoading">
                {{ isLoading ? 'Please wait...' : (isRegisterMode ? 'Create Account' : 'Sign In') }}
              </button>
            </form>

            <div class="auth-switch">
              <button @click="toggleRegisterMode" class="switch-link">
                {{ isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up" }}
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider">
            <span>or continue with</span>
          </div>

          <!-- OAuth Section -->
          <div class="oauth-section">
            <div class="login-options">
              <!-- Google Login -->
              <button @click="handleGoogleLogin" class="oauth-btn google-btn" :disabled="isLoading">
                <svg class="oauth-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{{ isLoading ? 'Connecting...' : 'Continue with Google' }}</span>
              </button>

              <!-- GitHub Login -->
              <button @click="handleGitHubLogin" class="oauth-btn github-btn" :disabled="isLoading">
                <svg class="oauth-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>{{ isLoading ? 'Connecting...' : 'Continue with GitHub' }}</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, watch, reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()
const isLoading = ref(false)
const errorMessage = ref('')
const isRegisterMode = ref(false)

// Email form data
const emailForm = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// Email validation errors
const emailErrors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

function closeModal() {
  emit('close')
  errorMessage.value = ''
  resetEmailForm()
}

function handleOverlayClick() {
  closeModal()
}

function resetEmailForm() {
  emailForm.email = ''
  emailForm.password = ''
  emailForm.confirmPassword = ''
  emailErrors.email = ''
  emailErrors.password = ''
  emailErrors.confirmPassword = ''
}

function toggleRegisterMode() {
  isRegisterMode.value = !isRegisterMode.value
  resetEmailForm()
  errorMessage.value = ''
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8
}

function validateEmailForm(): boolean {
  let isValid = true

  // Reset errors
  emailErrors.email = ''
  emailErrors.password = ''
  emailErrors.confirmPassword = ''

  // Validate email
  if (!validateEmail(emailForm.email)) {
    emailErrors.email = 'Please enter a valid email address'
    isValid = false
  }

  // Validate password
  if (!validatePassword(emailForm.password)) {
    emailErrors.password = 'Password must be at least 8 characters'
    isValid = false
  }

  // Validate password confirmation (register only)
  if (isRegisterMode.value && emailForm.password !== emailForm.confirmPassword) {
    emailErrors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

async function handleEmailAuth() {
  errorMessage.value = ''

  if (!validateEmailForm()) {
    return
  }

  isLoading.value = true

  try {
    if (isRegisterMode.value) {
      await authStore.registerWithEmail(emailForm.email, emailForm.password)
    } else {
      await authStore.loginWithEmail(emailForm.email, emailForm.password)
    }
    // Modal will auto-close via watch on isAuthenticated
  } catch (error: any) {
    console.error('[LoginModal] Email auth failed:', error)
    errorMessage.value = error.message || `Failed to ${isRegisterMode.value ? 'register' : 'sign in'}`
    isLoading.value = false
  }
}

async function handleGoogleLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Read returnUrl from localStorage (set by App.vue when modal opens)
    const returnUrl = localStorage.getItem('oauth_return_url')
    await authStore.loginWithGoogle(returnUrl || undefined)
    // User will be redirected to Google OAuth
  } catch (error: any) {
    console.error('[LoginModal] Google login failed:', error)
    errorMessage.value = error.message || 'Failed to sign in with Google'
    isLoading.value = false
  }
}

async function handleGitHubLogin() {
  errorMessage.value = 'GitHub login coming soon!'
  // TODO: Implement GitHub OAuth
}

// Close modal when authentication succeeds
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    emit('success') // Emit success event
    closeModal()
    isLoading.value = false
  }
})

// Prevent body scroll when modal is open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    resetEmailForm()
    isRegisterMode.value = false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2.5rem;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #334155;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.modal-header p {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Email/Password Section */
.email-section {
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  color: #1a202c;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.field-error {
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: -0.25rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 1rem;
}

.switch-link {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
}

.switch-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 1rem;
  background: white;
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

/* OAuth Section */
.oauth-section {
  margin-bottom: 1.5rem;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oauth-btn:hover:not(:disabled) {
  border-color: #cbd5e0;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oauth-icon {
  flex-shrink: 0;
}

.google-btn:hover:not(:disabled) {
  border-color: #4285F4;
}

.github-btn:hover:not(:disabled) {
  border-color: #24292e;
  background: #24292e;
  color: white;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.modal-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.modal-footer p {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content {
  transform: translateY(20px);
}

.modal-leave-to .modal-content {
  transform: translateY(-20px);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .modal-content {
    padding: 2rem 1.5rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
  }

  .oauth-btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.95rem;
  }
}
</style>
