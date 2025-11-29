import { defineStore } from 'pinia'
import axios from 'axios'

export interface Subscription {
  id: string
  user_id: string
  ls_subscription_id: string
  ls_customer_id: string
  tier: 'free' | 'pro' | 'premium'
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  price?: number
  billing_cycle?: 'monthly' | 'annual'
  created_at: string
  updated_at: string
}

export interface UsageStats {
  analyses: {
    used: number
    limit: number | null
    reset_date: string
  }
  learning_maps: {
    used: number
    limit: number | null
    reset_date: string
  }
}

interface SubscriptionState {
  subscription: Subscription | null
  usage: UsageStats | null
  loading: boolean
  error: string | null
}

export const useSubscriptionStore = defineStore('subscription', {
  state: (): SubscriptionState => ({
    subscription: null,
    usage: null,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Check if user has an active subscription
     */
    hasActiveSubscription: (state): boolean => {
      return state.subscription?.status === 'active' || false
    },

    /**
     * Get current tier
     */
    currentTier: (state): 'free' | 'pro' | 'premium' => {
      return state.subscription?.tier || 'free'
    },

    /**
     * Check if subscription is cancelled but still active
     */
    isCancelling: (state): boolean => {
      return state.subscription?.cancel_at_period_end || false
    },

    /**
     * Get formatted renewal date
     */
    renewalDate: (state): string | null => {
      if (!state.subscription?.current_period_end) return null

      return new Date(state.subscription.current_period_end).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    /**
     * Check if user is approaching usage limits (>75%)
     */
    isApproachingLimits: (state): boolean => {
      if (!state.usage) return false

      const analysesPercentage = state.usage.analyses.limit
        ? (state.usage.analyses.used / state.usage.analyses.limit) * 100
        : 0

      const mapsPercentage = state.usage.learning_maps.limit
        ? (state.usage.learning_maps.used / state.usage.learning_maps.limit) * 100
        : 0

      return analysesPercentage >= 75 || mapsPercentage >= 75
    },

    /**
     * Check if user has hit usage limits
     */
    hasHitLimits: (state): boolean => {
      if (!state.usage) return false

      const analysesLimitReached = state.usage.analyses.limit
        ? state.usage.analyses.used >= state.usage.analyses.limit
        : false

      const mapsLimitReached = state.usage.learning_maps.limit
        ? state.usage.learning_maps.used >= state.usage.learning_maps.limit
        : false

      return analysesLimitReached || mapsLimitReached
    },

    /**
     * Get recommended upgrade tier
     */
    recommendedUpgradeTier: (state): 'pro' | 'premium' => {
      const tier = state.subscription?.tier || 'free'

      if (tier === 'free') return 'pro'
      if (tier === 'pro') return 'premium'
      return 'premium' // Already premium, but just in case
    }
  },

  actions: {
    /**
     * Fetch subscription data from backend
     */
    async fetchSubscription() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get('/api/users/subscription')

        if (response.data.success) {
          this.subscription = response.data.subscription
        } else {
          // User doesn't have a subscription, default to free
          this.subscription = null
        }
      } catch (error: any) {
        console.error('Failed to fetch subscription:', error)
        this.error = error.response?.data?.message || 'Failed to load subscription'
        this.subscription = null
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch usage statistics
     */
    async fetchUsage() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get('/api/users/usage')

        if (response.data.success) {
          this.usage = response.data.usage
        }
      } catch (error: any) {
        console.error('Failed to fetch usage:', error)
        this.error = error.response?.data?.message || 'Failed to load usage stats'
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch both subscription and usage
     */
    async fetchAll() {
      await Promise.all([
        this.fetchSubscription(),
        this.fetchUsage()
      ])
    },

    /**
     * Update payment method via Lemon Squeezy
     */
    async updatePaymentMethod() {
      try {
        const response = await axios.post('/api/content/ls/update-payment-method')

        if (response.data.success && response.data.update_url) {
          // Redirect to Lemon Squeezy payment update page
          window.location.href = response.data.update_url
        } else {
          throw new Error('Failed to get payment update URL')
        }
      } catch (error: any) {
        console.error('Failed to update payment method:', error)
        throw error
      }
    },

    /**
     * Cancel subscription (will continue until end of billing period)
     */
    async cancelSubscription() {
      try {
        const response = await axios.post('/api/users/subscription/cancel')

        if (response.data.success) {
          // Update local state
          if (this.subscription) {
            this.subscription.cancel_at_period_end = true
          }

          return true
        }

        throw new Error('Failed to cancel subscription')
      } catch (error: any) {
        console.error('Failed to cancel subscription:', error)
        this.error = error.response?.data?.message || 'Failed to cancel subscription'
        throw error
      }
    },

    /**
     * Reactivate a cancelled subscription
     */
    async reactivateSubscription() {
      try {
        const response = await axios.post('/api/users/subscription/reactivate')

        if (response.data.success) {
          // Update local state
          if (this.subscription) {
            this.subscription.cancel_at_period_end = false
          }

          return true
        }

        throw new Error('Failed to reactivate subscription')
      } catch (error: any) {
        console.error('Failed to reactivate subscription:', error)
        this.error = error.response?.data?.message || 'Failed to reactivate subscription'
        throw error
      }
    },

    /**
     * Increment usage counters (called after creating analysis/learning map)
     */
    incrementUsage(type: 'analyses' | 'learning_maps') {
      if (this.usage && this.usage[type]) {
        this.usage[type].used += 1
      }
    },

    /**
     * Check if user can perform action based on usage limits
     */
    canPerformAction(type: 'analyses' | 'learning_maps'): boolean {
      if (!this.usage || !this.usage[type]) return true

      const { used, limit } = this.usage[type]

      // Unlimited (null limit)
      if (limit === null) return true

      // Check if under limit
      return used < limit
    },

    /**
     * Clear subscription data (on logout)
     */
    clearSubscription() {
      this.subscription = null
      this.usage = null
      this.error = null
    }
  }
})
