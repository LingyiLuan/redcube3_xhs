import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/auth'
import { useReportsStore } from './reportsStore'
import { useLearningMapStore } from './learningMapStore'
import { useWorkflowStore } from './workflowStore'
import { useWorkflowLibraryStore } from './workflowLibraryStore'

export const useAuthStore = defineStore('auth', () => {
  // ===== STATE =====
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const isConnecting = ref(false) // True when API is unreachable (504/network error)
  const connectionError = ref<string | null>(null)
  const justLoggedOut = ref(false) // Prevents race condition after logout

  // ===== GETTERS =====
  const isAuthenticated = computed(() => !!token.value && !!user.value)

const userId = computed(() => user.value?.id || null) // No fallback - real auth only

  // ===== ACTIONS =====

  async function login(email: string, password: string) {
    isLoading.value = true

    try {
      // TODO: Implement actual email/password login API call
      // const response = await authService.login(email, password)

      // Mock implementation for development
      const mockUser: User = {
        id: 1,
        email,
        name: 'Demo User',
        createdAt: new Date().toISOString()
      }

      const mockToken = 'mock-jwt-token-' + Date.now()

      setAuthData(mockUser, mockToken)

      console.log('[AuthStore] Login successful')
    } catch (error: any) {
      console.error('[AuthStore] Login failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithEmail(email: string, password: string) {
    isLoading.value = true

    try {
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const response = await fetch(`${apiGatewayUrl}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        // Include hint in error message if available
        const errorMessage = error.message || 'Login failed'
        const errorWithHint = error.hint ? `${errorMessage} ${error.hint}` : errorMessage
        throw new Error(errorWithHint)
      }

      const data = await response.json()

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.display_name || data.user.email.split('@')[0],
        emailVerified: data.user.email_verified,
        createdAt: data.user.created_at
      }

      setAuthData(userData, data.token)
      console.log('[AuthStore] Email login successful')
    } catch (error: any) {
      console.error('[AuthStore] Email login failed:', error)
      throw new Error(error.message || 'Invalid email or password')
    } finally {
      isLoading.value = false
    }
  }

  async function registerWithEmail(email: string, password: string, displayName: string) {
    isLoading.value = true

    try {
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const response = await fetch(`${apiGatewayUrl}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, displayName })
      })

      if (!response.ok) {
        const error = await response.json()
        // If there are validation details, show them as a list
        if (error.details && Array.isArray(error.details)) {
          throw new Error(error.details.join('. '))
        }
        throw new Error(error.message || 'Registration failed')
      }

      const data = await response.json()

      // Handle the immediate "processing" response (202 Accepted)
      // User and account are created in the background - user will verify via email
      if (data.processing) {
        console.log('[AuthStore] Registration processing in background, email:', data.email)
        // Don't set auth data - user hasn't verified yet
        // Frontend will show success message and redirect
        return
      }

      // Handle the legacy synchronous response (201 Created) - if user data is returned
      if (data.user) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.display_name || data.user.email.split('@')[0],
          emailVerified: data.user.email_verified,
          createdAt: data.user.created_at
        }

        setAuthData(userData, data.token)
      }

      console.log('[AuthStore] Email registration successful')
    } catch (error: any) {
      console.error('[AuthStore] Email registration failed:', error)
      throw new Error(error.message || 'Registration failed. Email may already be in use.')
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithGoogle(returnUrl?: string) {
    // Redirect to Google OAuth endpoint via API Gateway
    const userServiceUrl = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8080'
    const url = new URL(`${userServiceUrl}/api/auth/google`)
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl)
    }
    window.location.href = url.toString()
  }

  async function handleGoogleCallback(token: string, userData: User) {
    // Called after Google OAuth redirects back with token
    setAuthData(userData, token)
    console.log('[AuthStore] Google login successful')
  }

  async function logout() {
    // Set flag FIRST to prevent race condition with checkAuthStatus
    justLoggedOut.value = true

    // Clear local state immediately (don't wait for API)
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')

    // Call backend to destroy session (fire and forget)
    try {
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      await fetch(`${apiGatewayUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('[AuthStore] Logout API call failed:', error)
    }

    const reportsStore = useReportsStore()
    const learningMapStore = useLearningMapStore()
    const workflowStore = useWorkflowStore()
    const workflowLibraryStore = useWorkflowLibraryStore()
    reportsStore.clearAll()
    learningMapStore.clearAll()
    workflowStore.clearWorkflow()
    workflowLibraryStore.reset()

    console.log('[AuthStore] Logout successful')

    // Reset flag after a delay (allow components to remount)
    setTimeout(() => {
      justLoggedOut.value = false
    }, 2000)
  }

  function setAuthData(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken

    // Persist to localStorage
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('authUser', JSON.stringify(userData))
  }

  async function checkAuthStatus() {
    // Skip if we just logged out (prevents race condition)
    if (justLoggedOut.value) {
      console.log('[AuthStore] Skipping checkAuthStatus - just logged out')
      return
    }

    isConnecting.value = true
    connectionError.value = null

    // Verify session authentication via API (this is the source of truth)
    try {
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const response = await fetch(`${apiGatewayUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session auth
        headers: {
          'Content-Type': 'application/json'
        }
      })

      isConnecting.value = false

      if (response.ok) {
        const data = await response.json()
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.display_name || data.user.email.split('@')[0],
          avatarUrl: data.user.avatar_url,
          linkedinUrl: data.user.linkedin_url,
          emailVerified: data.user.email_verified,
          createdAt: data.user.created_at
        }

        // Set auth data (session-based auth uses a placeholder token)
        user.value = userData
        token.value = 'session-auth-' + Date.now()

        // Update localStorage with verified data
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('authUser', JSON.stringify(userData))

        console.log('[AuthStore] Session auth verified via API:', {
          userId: userData.id,
          email: userData.email,
          hasAvatar: !!userData.avatarUrl
        })
        return
      } else {
        // API says not authenticated - clear state
        console.log('[AuthStore] API returned non-OK status, clearing auth state')
        user.value = null
        token.value = null
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
      }
    } catch (error) {
      console.log('[AuthStore] Session check failed (network error):', error)
      isConnecting.value = false
      connectionError.value = 'Unable to connect to server'

      // IMPORTANT: On network error, clear auth state to prevent inconsistency
      // User will need to log in again when server is reachable
      user.value = null
      token.value = null
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    }
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    user,
    token,
    isLoading,
    isConnecting,
    connectionError,

    // Getters
    isAuthenticated,
    userId,

    // Actions
    login,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    handleGoogleCallback,
    logout,
    setAuthData,
    checkAuthStatus
  }
})
