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
        throw new Error(error.message || 'Login failed')
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

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.display_name || data.user.email.split('@')[0],
        emailVerified: data.user.email_verified,
        createdAt: data.user.created_at
      }

      setAuthData(userData, data.token)
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
    // Call backend to destroy session
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

    // Clear local state
    user.value = null
    token.value = null

    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')

    const reportsStore = useReportsStore()
    const learningMapStore = useLearningMapStore()
    const workflowStore = useWorkflowStore()
    const workflowLibraryStore = useWorkflowLibraryStore()
    reportsStore.clearAll()
    learningMapStore.clearAll()
    workflowStore.clearWorkflow()
    workflowLibraryStore.reset()

    console.log('[AuthStore] Logout successful')
  }

  function setAuthData(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken

    // Persist to localStorage
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('authUser', JSON.stringify(userData))
  }

  async function checkAuthStatus() {
    // First, try to check session authentication via API
    try {
      const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
      const response = await fetch(`${apiGatewayUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session auth
        headers: {
          'Content-Type': 'application/json'
        }
      })

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

        // Optionally save to localStorage for faster subsequent checks
        localStorage.setItem('authToken', token.value)
        localStorage.setItem('authUser', JSON.stringify(userData))

        console.log('[AuthStore] Session auth verified:', {
          userId: userData.id,
          email: userData.email,
          hasAvatar: !!userData.avatarUrl
        })
        return
      }
    } catch (error) {
      console.log('[AuthStore] Session check failed, trying localStorage:', error)
    }

    // Fallback: Check if we have saved auth data in localStorage
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('authUser')

    console.log('[AuthStore] checkAuthStatus - savedToken:', savedToken ? 'EXISTS' : 'MISSING')
    console.log('[AuthStore] checkAuthStatus - savedUser:', savedUser ? savedUser : 'MISSING')

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        user.value = userData
        token.value = savedToken

        console.log('[AuthStore] Auth restored from localStorage:', {
          userId: userData.id,
          email: userData.email,
          hasAvatar: !!userData.avatarUrl
        })
      } catch (error) {
        console.error('[AuthStore] Failed to restore auth:', error)
        await logout()
      }
    } else {
      console.log('[AuthStore] No saved auth data in localStorage or session')
    }
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    user,
    token,
    isLoading,

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
