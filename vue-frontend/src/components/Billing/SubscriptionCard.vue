<template>
  <div class="subscription-card">
    <!-- Header -->
    <div class="card-header">
      <div class="plan-info">
        <div class="plan-title-row">
          <h3 class="plan-name">{{ planName }}</h3>
          <span class="plan-price-inline">
            {{ formattedPrice }}<span v-if="subscription" class="period-inline">/{{ billingPeriod }}</span>
          </span>
        </div>
        <span v-if="subscription && subscription.cancel_at_period_end" class="status-warning">
          Cancels on {{ formattedRenewalDate }}
        </span>
      </div>
    </div>

    <!-- Renewal Info -->
    <div v-if="subscription && subscription.status === 'active' && !subscription.cancel_at_period_end" class="renewal-info">
      <div class="info-row">
        <span class="label">Next billing date</span>
        <span class="value">{{ formattedRenewalDate }}</span>
      </div>
    </div>

    <!-- Expired/Cancelled Info -->
    <div v-if="subscription && (subscription.status === 'expired' || subscription.status === 'cancelled')" class="expired-info">
      <div class="info-row">
        <span class="label">{{ subscription.status === 'cancelled' ? 'Cancelled on' : 'Expired on' }}</span>
        <span class="value">{{ formattedEndDate }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <!-- Free Plan Actions -->
      <template v-if="!subscription || subscription.tier === 'free'">
        <button class="btn-upgrade" @click="handleUpgrade">
          Upgrade to Pro →
        </button>
      </template>

      <!-- Active Subscription Actions -->
      <template v-else-if="subscription.status === 'active'">
        <button
          v-if="subscription.tier === 'pro'"
          class="btn-secondary"
          @click="handleChangePlan('premium')"
        >
          Upgrade to Premium
        </button>
        <button class="btn-secondary" @click="handleUpdatePayment">
          Update Payment Method
        </button>
        <button class="btn-secondary" @click="handleViewInvoices">
          View Invoices
        </button>
        <button
          v-if="!subscription.cancel_at_period_end"
          class="btn-danger"
          @click="handleCancelSubscription"
        >
          Cancel Subscription
        </button>
        <button
          v-else
          class="btn-primary"
          @click="handleReactivate"
        >
          Reactivate Subscription
        </button>
      </template>

      <!-- Expired/Cancelled Subscription Actions -->
      <template v-else-if="subscription.status === 'expired' || subscription.status === 'cancelled'">
        <button class="btn-primary" @click="handleResubscribe">
          Resubscribe
        </button>
      </template>
    </div>

    <!-- Features List -->
    <div class="features-section">
      <h4 class="features-header">Your plan includes</h4>
      <ul class="features-list">
        <li v-for="(feature, index) in planFeatures" :key="index" class="feature-item">
          <span class="bullet">•</span>
          <span>{{ feature }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Icons
const AlertIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `
}

interface Props {
  subscription?: {
    id: string
    tier: 'free' | 'pro' | 'premium'
    status: 'active' | 'cancelled' | 'expired' | 'past_due'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
    price?: number
    billing_cycle?: 'monthly' | 'annual'
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  subscription: null
})

const emit = defineEmits<{
  upgrade: []
  changePlan: [tier: string]
  updatePayment: []
  viewInvoices: []
  cancelSubscription: []
  reactivate: []
  resubscribe: []
}>()

const router = useRouter()

// Computed properties
const planName = computed(() => {
  if (!props.subscription || props.subscription.tier === 'free') {
    return 'Free Plan'
  }
  return props.subscription.tier === 'pro' ? 'Pro Plan' : 'Premium Plan'
})

const statusClass = computed(() => {
  if (!props.subscription || props.subscription.status === 'active') return 'status-active'
  if (props.subscription.status === 'cancelled' || props.subscription.status === 'expired') return 'status-inactive'
  if (props.subscription.status === 'past_due') return 'status-warning'
  return 'status-active'
})

const statusText = computed(() => {
  if (!props.subscription) return 'Active'
  if (props.subscription.cancel_at_period_end) return 'Cancelling'
  if (props.subscription.status === 'active') return 'Active'
  if (props.subscription.status === 'cancelled') return 'Cancelled'
  if (props.subscription.status === 'expired') return 'Expired'
  if (props.subscription.status === 'past_due') return 'Past Due'
  return 'Active'
})

const formattedPrice = computed(() => {
  if (!props.subscription || props.subscription.tier === 'free') {
    return '$0'
  }
  return `$${props.subscription.price || 0}`
})

const billingPeriod = computed(() => {
  if (!props.subscription) return ''
  return props.subscription.billing_cycle === 'annual' ? 'year' : 'month'
})

const formattedRenewalDate = computed(() => {
  if (!props.subscription || !props.subscription.current_period_end) return 'N/A'
  return new Date(props.subscription.current_period_end).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const formattedEndDate = computed(() => {
  if (!props.subscription || !props.subscription.current_period_end) return 'N/A'
  return new Date(props.subscription.current_period_end).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const planFeatures = computed(() => {
  if (!props.subscription || props.subscription.tier === 'free') {
    return [
      '5 analyses per month',
      '2 learning maps per month',
      'Basic interview insights',
      'Community access'
    ]
  }

  if (props.subscription.tier === 'pro') {
    return [
      '15 analyses per month',
      '10 learning maps per month',
      'Advanced interview intelligence',
      'Company-specific insights',
      'Priority support'
    ]
  }

  // Premium
  return [
    'Unlimited analyses',
    'Unlimited learning maps',
    'Real-time interview trends',
    'Custom curriculum builder',
    '1-on-1 career coaching',
    'White-glove support'
  ]
})

// Event handlers
const handleUpgrade = () => {
  router.push('/pricing')
}

const handleChangePlan = (tier: string) => {
  emit('changePlan', tier)
}

const handleUpdatePayment = () => {
  emit('updatePayment')
}

const handleViewInvoices = () => {
  emit('viewInvoices')
}

const handleCancelSubscription = () => {
  emit('cancelSubscription')
}

const handleReactivate = () => {
  emit('reactivate')
}

const handleResubscribe = () => {
  router.push('/pricing')
}
</script>

<style scoped>
.subscription-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 24px;
}

/* Header */
.card-header {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E2E8F0;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.plan-name {
  font-size: 16px;
  font-weight: 600;
  color: #1E3A8A;
  margin: 0;
}

.plan-price-inline {
  font-size: 16px;
  font-weight: 600;
  color: #1E3A8A;
}

.period-inline {
  font-size: 14px;
  font-weight: 400;
  color: #64748B;
}

.status-warning {
  font-size: 13px;
  color: #D97706;
}

/* Renewal Info */
.renewal-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
}

.label {
  font-size: 13px;
  color: #64748B;
}

.value {
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}

/* Expired Info */
.expired-info {
  margin-bottom: 20px;
}

/* Actions */
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.btn-upgrade,
.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-upgrade {
  background: #1E3A8A;
  color: white;
}

.btn-upgrade:hover {
  background: #1E40AF;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-danger:hover {
  background: #fee2e2;
}

/* Features */
.features-header {
  font-size: 14px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
}

.bullet {
  color: #64748B;
  font-size: 14px;
  line-height: 1.6;
}

.feature-item span:not(.bullet) {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-card {
    padding: 24px;
  }

  .card-header {
    flex-direction: column;
    gap: 16px;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
  }
}
</style>
