<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
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
          <p>Create your account to get started</p>
        </div>

        <div class="register-body">
          <!-- Success Message (shown after successful registration) -->
          <div v-if="registrationSuccess" class="success-message-container">
            <div class="email-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#10b981" stroke-width="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 6l-10 7L2 6"/>
              </svg>
            </div>
            <h2 class="success-title">Check Your Inbox</h2>
            <p class="success-message">
              A verification link has been sent to <strong>{{ email }}</strong>
            </p>
            <p class="success-note">
              If you don't see it within a few minutes, check your spam folder.
            </p>

            <!-- Resend Section -->
            <div class="resend-section">
              <button
                @click="handleResendVerification"
                class="resend-btn"
                :disabled="isResending || resendCooldown > 0"
              >
                <span v-if="isResending">Sending...</span>
                <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
                <span v-else>Resend verification email</span>
              </button>
              <p v-if="resendMessage" :class="['resend-feedback', resendSuccess ? 'success' : 'error']">
                {{ resendMessage }}
              </p>
            </div>

            <div class="action-links">
              <router-link to="/login" class="back-to-login">
                Back to Sign In
              </router-link>
            </div>
          </div>

          <!-- Registration Form (hidden when success) -->
          <div v-if="!registrationSuccess">
            <!-- Google OAuth Button -->
            <button @click="handleGoogleRegister" class="google-register-btn" :disabled="isLoading">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{{ isLoading ? 'CREATING ACCOUNT...' : 'CONTINUE WITH GOOGLE' }}</span>
          </button>

          <div class="divider">
            <span>OR</span>
          </div>

          <!-- Email/Password Registration Form -->
          <form @submit.prevent="handleEmailRegister" class="register-form" novalidate>
            <div class="form-group">
              <label for="displayName">DISPLAY NAME</label>
              <div class="input-wrapper">
                <input
                  id="displayName"
                  v-model="displayName"
                  type="text"
                  placeholder="Your Name"
                  :disabled="isLoading"
                  autocomplete="off"
                  :class="{ 'input-error': displayNameError, 'input-success': isDisplayNameValid }"
                />
                <span v-if="isDisplayNameValid" class="validation-icon">✓</span>
              </div>
              <p v-if="displayNameError" class="field-error">{{ displayNameError }}</p>
            </div>

            <div class="form-group">
              <label for="email">EMAIL</label>
              <!-- Hidden dummy username field to train Chrome password manager -->
              <input
                type="text"
                name="username"
                autocomplete="username"
                style="display:none"
                tabindex="-1"
                aria-hidden="true"
              />
              <div class="input-wrapper">
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  inputmode="email"
                  placeholder="your@email.com"
                  :disabled="isLoading"
                  autocomplete="email"
                  name="email"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-protonpass-ignore="true"
                  :class="{ 'input-error': emailError || isEmailInvalid, 'input-success': isEmailValid }"
                />
                <!-- Loading text while checking email -->
                <span v-if="isCheckingEmail" class="checking-text">Checking...</span>
                <!-- Success checkmark if email is valid and available -->
                <span v-else-if="isEmailValid" class="validation-icon">✓</span>
                <!-- Error X if email is invalid or taken -->
                <span v-else-if="isEmailInvalid" class="validation-icon invalid-icon">✗</span>
              </div>
              <p v-if="emailError" class="field-error">{{ emailError }}</p>
              <!-- Availability feedback message -->
              <p v-if="emailAvailable === false && !emailError" class="field-error">
                An account with this email already exists. Try <router-link to="/login" class="login-link">logging in</router-link>
              </p>
            </div>

            <div class="form-group">
              <label for="password">PASSWORD</label>
              <div class="password-input-wrapper">
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  :disabled="isLoading"
                  aria-describedby="password-requirements"
                  autocomplete="new-password"
                  :class="{ 'input-error': passwordError, 'input-success': isPasswordValid }"
                />
                <span v-if="isPasswordValid" class="validation-icon password-validation-icon">✓</span>
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="password-toggle-btn"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  tabindex="0"
                >
                  <span v-if="showPassword">👁️</span>
                  <span v-else>👁️‍🗨️</span>
                </button>
              </div>

              <!-- Password Strength Meter -->
              <div v-if="password.length > 0" class="password-strength-meter">
                <div class="strength-bar-container">
                  <div
                    class="strength-bar-fill"
                    :style="{ width: passwordStrength + '%', backgroundColor: passwordStrengthColor }"
                  ></div>
                </div>
                <span class="strength-label" :style="{ color: passwordStrengthColor }">
                  {{ passwordStrengthLabel }}
                </span>
              </div>

              <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
              <ul v-else id="password-requirements" class="password-requirements" aria-live="polite">
                <li :class="{ 'requirement-met': passwordRequirements.minLength }">
                  <span class="requirement-icon">{{ passwordRequirements.minLength ? '✓' : '○' }}</span>
                  At least 8 characters
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasUppercase }">
                  <span class="requirement-icon">{{ passwordRequirements.hasUppercase ? '✓' : '○' }}</span>
                  One uppercase letter
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasLowercase }">
                  <span class="requirement-icon">{{ passwordRequirements.hasLowercase ? '✓' : '○' }}</span>
                  One lowercase letter
                </li>
                <li :class="{ 'requirement-met': passwordRequirements.hasNumber }">
                  <span class="requirement-icon">{{ passwordRequirements.hasNumber ? '✓' : '○' }}</span>
                  One number
                </li>
              </ul>
            </div>

            <div class="form-group">
              <label for="confirmPassword">CONFIRM PASSWORD</label>
              <div class="password-input-wrapper">
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  :disabled="isLoading"
                  autocomplete="new-password"
                  :class="{ 'input-error': confirmPasswordError, 'input-success': isConfirmPasswordValid }"
                />
                <span v-if="isConfirmPasswordValid" class="validation-icon password-validation-icon">✓</span>
                <button
                  type="button"
                  @click="toggleConfirmPasswordVisibility"
                  class="password-toggle-btn"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  tabindex="0"
                >
                  <span v-if="showConfirmPassword">👁️</span>
                  <span v-else>👁️‍🗨️</span>
                </button>
              </div>
              <p v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</p>
              <p v-else-if="confirmPassword.length > 0 && passwordsMatch" class="field-success">Passwords match</p>
            </div>

            <button type="submit" class="email-register-btn" :disabled="isLoading">
              {{ isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT' }}
            </button>
          </form>

            <div v-if="errorMessages.length > 0" class="error-message">
              <div v-for="(error, index) in errorMessages" :key="index" class="error-item">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

        <div class="register-footer" v-if="!registrationSuccess">
          <p>Already have an account? <router-link to="/login">Sign in</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessages = ref<string[]>([])
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const registrationSuccess = ref(false)

// Resend verification state
const isResending = ref(false)
const resendCooldown = ref(30) // Start with 30s cooldown after registration
const resendMessage = ref('')
const resendSuccess = ref(false)

// Field-level error states
const displayNameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

// Email availability check states
const isCheckingEmail = ref(false)
const emailAvailable = ref<boolean | null>(null)
let emailCheckTimeout: ReturnType<typeof setTimeout> | null = null

// Clear errors when user starts typing, validate display name in real-time
watch(displayName, (newName) => {
  if (displayNameError.value) {
    displayNameError.value = ''
  }

  // Real-time validation with debouncing (Facebook standard: 2-50 characters)
  const trimmed = newName.trim()
  if (trimmed.length > 0 && trimmed.length < 2) {
    displayNameError.value = 'Name must be at least 2 characters'
  } else if (newName.length > 50) {
    displayNameError.value = 'Name must be 50 characters or less'
  }
})

watch(email, (newEmail) => {
  // Clear errors when user starts typing
  if (emailError.value) {
    emailError.value = ''
  }

  // Clear previous timeout
  if (emailCheckTimeout) {
    clearTimeout(emailCheckTimeout)
    emailCheckTimeout = null
  }

  // Reset availability state
  emailAvailable.value = null

  // Only check if email format is valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    isCheckingEmail.value = false
    return
  }

  // Debounce: wait 500ms after user stops typing
  isCheckingEmail.value = true
  emailCheckTimeout = setTimeout(async () => {
    await checkEmailAvailability(newEmail)
  }, 500)
})

watch(password, () => {
  if (passwordError.value) {
    passwordError.value = ''
  }
  // Re-validate confirm password if it has been entered
  if (confirmPassword.value && confirmPasswordError.value) {
    confirmPasswordError.value = ''
  }
})

watch(confirmPassword, () => {
  if (confirmPasswordError.value) {
    confirmPasswordError.value = ''
  }
})

// Password requirement validation
const passwordRequirements = computed(() => {
  const pwd = password.value
  return {
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd)
  }
})

// Password strength calculation (0-100)
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return 0

  let strength = 0
  const requirements = passwordRequirements.value

  // Base points for meeting requirements (25 points each = 100 total)
  if (requirements.minLength) strength += 25
  if (requirements.hasUppercase) strength += 25
  if (requirements.hasLowercase) strength += 25
  if (requirements.hasNumber) strength += 25

  return strength
})

// Password strength label
const passwordStrengthLabel = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return ''
  if (strength <= 50) return 'Weak'
  if (strength <= 75) return 'Medium'
  return 'Strong'
})

// Password strength color
const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return '#6b7280' // gray
  if (strength <= 50) return '#ef4444' // red
  if (strength <= 75) return '#f59e0b' // yellow
  return '#10b981' // green
})

// Field validation states for success indicators
const isDisplayNameValid = computed(() => {
  const trimmed = displayName.value.trim()
  // Facebook standard: 2-50 characters
  return trimmed.length >= 2 && displayName.value.length <= 50 && !displayNameError.value
})

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value) && !emailError.value && emailAvailable.value === true
})

const isEmailInvalid = computed(() => {
  if (!email.value || emailError.value) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // Invalid if format is wrong OR email is taken
  return !emailRegex.test(email.value) || emailAvailable.value === false
})

const isPasswordValid = computed(() => {
  const reqs = passwordRequirements.value
  return reqs.minLength && reqs.hasUppercase && reqs.hasLowercase && reqs.hasNumber && !passwordError.value
})

// Password confirmation validation
const passwordsMatch = computed(() => {
  return password.value.length > 0 && confirmPassword.value.length > 0 && password.value === confirmPassword.value
})

const isConfirmPasswordValid = computed(() => {
  return passwordsMatch.value && !confirmPasswordError.value
})

async function checkEmailAvailability(emailToCheck: string) {
  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      emailAvailable.value = !data.exists // Available if NOT exists
    } else {
      // If API fails, assume email is available (fail gracefully)
      emailAvailable.value = null
    }
  } catch (error) {
    console.error('[RegisterPage] Email availability check failed:', error)
    // Fail gracefully - don't block registration if check fails
    emailAvailable.value = null
  } finally {
    isCheckingEmail.value = false
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

function toggleConfirmPasswordVisibility() {
  showConfirmPassword.value = !showConfirmPassword.value
}

async function handleGoogleRegister() {
  isLoading.value = true
  errorMessages.value = []

  try {
    await authStore.loginWithGoogle()
    // User will be redirected to Google OAuth
  } catch (error: any) {
    console.error('[RegisterPage] Google registration failed:', error)
    errorMessages.value = [error.message || 'Failed to register with Google']
    isLoading.value = false
  }
}

async function handleEmailRegister() {
  // Clear all errors
  displayNameError.value = ''
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  errorMessages.value = []

  // Client-side validation
  let hasError = false

  // Display name validation (Facebook standard: 2-50 characters)
  const trimmedName = displayName.value.trim()
  if (!trimmedName) {
    displayNameError.value = 'Please enter your name'
    hasError = true
  } else if (trimmedName.length < 2) {
    displayNameError.value = 'Name must be at least 2 characters'
    hasError = true
  } else if (displayName.value.length > 50) {
    displayNameError.value = 'Name must be 50 characters or less'
    hasError = true
  }

  if (!email.value.trim()) {
    emailError.value = 'Please enter your email'
    hasError = true
  }

  if (!password.value) {
    passwordError.value = 'Please enter a password'
    hasError = true
  }

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password'
    hasError = true
  } else if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    hasError = true
  }

  // If validation fails, don't submit
  if (hasError) {
    return
  }

  isLoading.value = true

  try {
    await authStore.registerWithEmail(email.value, password.value, displayName.value)
    console.log('[RegisterPage] Registration successful, showing success message')

    // Set success state - show "Check your inbox" page
    registrationSuccess.value = true

    // Start resend cooldown timer (30 seconds)
    startResendCooldown()
  } catch (error: any) {
    console.error('[RegisterPage] Email registration failed:', error)
    const message = error.message || 'Failed to create account'

    // Parse error message and assign to appropriate fields
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('email') && lowerMessage.includes('already')) {
      emailError.value = 'This email is already registered'
    } else if (lowerMessage.includes('email') && lowerMessage.includes('invalid')) {
      emailError.value = 'Please enter a valid email address'
    } else if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
      passwordError.value = 'Password does not meet requirements'
    } else if (lowerMessage.includes('password')) {
      passwordError.value = message
    } else if (lowerMessage.includes('display name') || lowerMessage.includes('name')) {
      displayNameError.value = message
    } else {
      // Generic error - split into bullet points and show in centralized location
      errorMessages.value = message
        .split('. ')
        .map((msg: string) => msg.trim())
        .filter((msg: string) => msg.length > 0)
    }
  } finally {
    isLoading.value = false
  }
}

// Start the resend cooldown timer
function startResendCooldown() {
  resendCooldown.value = 30
  const cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

// Handle resend verification email
async function handleResendVerification() {
  if (isResending.value || resendCooldown.value > 0) return

  isResending.value = true
  resendMessage.value = ''
  resendSuccess.value = false

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const response = await fetch(`${apiGatewayUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email.value })
    })

    const data = await response.json()

    if (response.ok) {
      resendSuccess.value = true
      resendMessage.value = 'Verification email sent! Please check your inbox.'
      // Start cooldown again
      startResendCooldown()
    } else {
      resendSuccess.value = false
      resendMessage.value = data.message || 'Failed to resend verification email'
    }
  } catch (error: any) {
    console.error('[RegisterPage] Resend verification failed:', error)
    resendSuccess.value = false
    resendMessage.value = 'Failed to resend verification email. Please try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--industrial-bg-page);
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 480px;
}

.register-card {
  background: var(--industrial-bg-module);
  border: 1px solid var(--industrial-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.register-header {
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

.register-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--industrial-text-primary);
  margin: 0 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.register-header p {
  color: var(--industrial-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.register-body {
  padding: 2rem;
}

.google-register-btn {
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

.google-register-btn:hover:not(:disabled) {
  background: var(--industrial-accent);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-sm);
}

.google-register-btn:disabled {
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

.register-form {
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

.form-group input.input-error {
  border-color: var(--industrial-text-primary);
  background: var(--industrial-bg-page);
}

.field-error {
  margin: 0.5rem 0 0;
  padding: 0;
  color: #ff6b6b;
  font-size: 0.75rem;
  line-height: 1.4;
  font-weight: 500;
}

.field-success {
  margin: 0.5rem 0 0;
  padding: 0;
  color: #10b981;
  font-size: 0.75rem;
  line-height: 1.4;
  font-weight: 500;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  flex: 1;
  padding-right: 5.5rem; /* Make room for both success icon and toggle button */
}

.password-input-wrapper input.input-success {
  border-color: #10b981;
}

/* Input wrapper for validation icons - Industry standard pattern */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper input {
  width: 100%;
  padding-right: 2.5rem; /* Space for validation icon */
}

.input-wrapper input.input-success {
  border-color: #10b981;
}

/* Validation icon - Positioned inside input at right edge */
.validation-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  font-size: 1.25rem;
  font-weight: bold;
  pointer-events: none;
  animation: checkmark-appear 0.3s ease;
}

/* Invalid state icon - Red color */
.invalid-icon {
  color: #ef4444;
}

/* Checking/loading state text - Animated text */
.checking-text {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Password field validation icon - Position before toggle button */
.password-validation-icon {
  right: 3rem;
}

@keyframes checkmark-appear {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.password-toggle-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--industrial-text-tertiary);
  font-size: 1.25rem;
  transition: color var(--transition-fast);
  line-height: 1;
}

.password-toggle-btn:hover {
  color: var(--industrial-text-primary);
}

.password-toggle-btn:focus {
  outline: none;
  color: var(--industrial-icon);
}

/* Password Strength Meter */
.password-strength-meter {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strength-bar-container {
  flex: 1;
  height: 4px;
  background: var(--industrial-border-strong);
  border-radius: 2px;
  overflow: hidden;
}

.strength-bar-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 60px;
  text-align: right;
  transition: color 0.3s ease;
}

.password-requirements {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.password-requirements li {
  font-size: 0.75rem;
  color: var(--industrial-text-tertiary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color var(--transition-fast);
}

.password-requirements li.requirement-met {
  color: var(--industrial-text-primary);
}

.requirement-icon {
  font-size: 0.875rem;
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

.password-requirements li.requirement-met .requirement-icon {
  color: var(--industrial-icon);
  font-weight: 700;
}

.email-register-btn {
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

.email-register-btn:hover:not(:disabled) {
  background: var(--industrial-icon);
  border-color: var(--industrial-icon);
  transform: translateY(-1px);
  box-shadow: var(--industrial-shadow-md);
}

.email-register-btn:disabled {
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
}

.error-item {
  padding: 0.25rem 0;
  line-height: 1.5;
}

.error-item::before {
  content: '• ';
  margin-right: 0.25rem;
}

.register-footer {
  padding: 1.5rem 2rem;
  background: var(--industrial-bg-page);
  text-align: center;
  border-top: 1px solid var(--industrial-divider);
}

.register-footer p {
  margin: 0;
  color: var(--industrial-text-secondary);
  font-size: 0.8125rem;
}

.register-footer a {
  color: var(--industrial-text-primary);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.register-footer a:hover {
  color: var(--industrial-icon);
}

/* Login link in error message */
.login-link {
  color: var(--industrial-icon);
  text-decoration: underline;
  font-weight: 600;
  transition: color var(--transition-fast);
}

.login-link:hover {
  color: var(--industrial-text-primary);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .register-page {
    padding: 1rem;
  }

  .register-header {
    padding: 2rem 1.5rem 1.5rem;
  }

  .register-header h1 {
    font-size: 1.5rem;
  }

  .register-body {
    padding: 1.5rem;
  }
}

/* Success Message Styles */
.success-message-container {
  text-align: center;
  padding: 2rem 1rem;
}

.email-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.success-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
}

.success-message {
  color: var(--industrial-text-primary);
  font-size: 1rem;
  margin: 0 0 0.75rem;
  line-height: 1.6;
}

.success-message strong {
  color: #10b981;
  font-weight: 600;
}

.success-note {
  color: var(--industrial-text-secondary);
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

/* Resend Section */
.resend-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--industrial-divider);
}

.resend-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid var(--industrial-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--industrial-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.resend-btn:hover:not(:disabled) {
  background: var(--industrial-accent);
  border-color: var(--industrial-icon);
  color: var(--industrial-text-primary);
}

.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resend-feedback {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  text-align: center;
}

.resend-feedback.success {
  color: #10b981;
}

.resend-feedback.error {
  color: #ef4444;
}

/* Action Links */
.action-links {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--industrial-divider);
}

.back-to-login {
  display: inline-block;
  color: var(--industrial-text-secondary);
  font-size: 0.875rem;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.back-to-login:hover {
  color: var(--industrial-text-primary);
}
</style>
