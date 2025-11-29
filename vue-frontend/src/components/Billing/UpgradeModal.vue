<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <!-- Close Button -->
          <button class="close-button" @click="handleClose">
            <CloseIcon />
          </button>

          <!-- Header -->
          <div class="modal-header">
            <div class="icon-wrapper" :class="iconClass">
              <component :is="headerIcon" class="header-icon" />
            </div>
            <h2>{{ title }}</h2>
            <p class="subtitle">{{ message }}</p>
          </div>

          <!-- Plan Comparison -->
          <div class="plans-comparison">
            <!-- Current Plan -->
            <div class="plan-card current">
              <div class="plan-badge">Current Plan</div>
              <h3>{{ currentPlanName }}</h3>
              <div class="plan-price">
                <span class="amount">{{ currentPlanPrice }}</span>
                <span v-if="currentPlanPrice !== '$0'" class="period">/mo</span>
              </div>
              <ul class="plan-features">
                <li v-for="(feature, index) in currentPlanFeatures" :key="index">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Arrow -->
            <div class="arrow-wrapper">
              <ArrowIcon />
            </div>

            <!-- Recommended Plan -->
            <div class="plan-card recommended">
              <div class="plan-badge featured">Recommended</div>
              <h3>{{ recommendedPlanName }}</h3>
              <div class="plan-price">
                <span class="amount">{{ recommendedPlanPrice }}</span>
                <span class="period">/mo</span>
              </div>
              <ul class="plan-features highlight">
                <li v-for="(feature, index) in recommendedPlanFeatures" :key="index">
                  <CheckIcon class="check-icon" />
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Benefits Section -->
          <div v-if="benefits.length > 0" class="benefits-section">
            <h4>What you'll get:</h4>
            <div class="benefits-grid">
              <div v-for="(benefit, index) in benefits" :key="index" class="benefit-item">
                <CheckIcon class="benefit-icon" />
                <span>{{ benefit }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="btn-upgrade" @click="handleUpgrade">
              {{ upgradeButtonText }}
            </button>
            <button class="btn-secondary" @click="handleViewPlans">
              View All Plans
            </button>
            <button v-if="allowDismiss" class="btn-text" @click="handleClose">
              Maybe Later
            </button>
          </div>

          <!-- Trust Signal -->
          <div class="trust-signal">
            <LockIcon class="lock-icon" />
            <span>Secure checkout powered by Lemon Squeezy</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// Icons
const CloseIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `
}

const AlertIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `
}

const RocketIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
  `
}

const ArrowIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  `
}

const CheckIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `
}

const LockIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `
}

interface Props {
  isOpen: boolean
  triggerType?: 'limit_reached' | 'usage_warning' | 'feature_gate' | 'general'
  currentTier?: 'free' | 'pro' | 'premium'
  recommendedTier?: 'pro' | 'premium'
  resourceType?: string // e.g., "analyses", "learning maps"
  allowDismiss?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  triggerType: 'general',
  currentTier: 'free',
  recommendedTier: 'pro',
  resourceType: '',
  allowDismiss: true
})

const emit = defineEmits<{
  close: []
  upgrade: [tier: string]
}>()

const router = useRouter()

// Computed properties
const headerIcon = computed(() => {
  return props.triggerType === 'limit_reached' || props.triggerType === 'usage_warning'
    ? AlertIcon
    : RocketIcon
})

const iconClass = computed(() => {
  return props.triggerType === 'limit_reached' || props.triggerType === 'usage_warning'
    ? 'warning'
    : 'success'
})

const title = computed(() => {
  if (props.triggerType === 'limit_reached') {
    return `You've Reached Your Limit`
  }
  if (props.triggerType === 'usage_warning') {
    return `Almost at Your Limit`
  }
  if (props.triggerType === 'feature_gate') {
    return 'Unlock Premium Features'
  }
  return 'Upgrade Your Plan'
})

const message = computed(() => {
  if (props.triggerType === 'limit_reached' && props.resourceType) {
    return `You've used all your ${props.resourceType} for this month. Upgrade to continue.`
  }
  if (props.triggerType === 'usage_warning' && props.resourceType) {
    return `You're running low on ${props.resourceType}. Upgrade to get more.`
  }
  return 'Get more features and accelerate your career growth with a premium plan.'
})

const currentPlanName = computed(() => {
  if (props.currentTier === 'free') return 'Free'
  if (props.currentTier === 'pro') return 'Pro'
  return 'Premium'
})

const currentPlanPrice = computed(() => {
  if (props.currentTier === 'free') return '$0'
  if (props.currentTier === 'pro') return '$9'
  return '$19'
})

const currentPlanFeatures = computed(() => {
  if (props.currentTier === 'free') {
    return ['5 analyses/month', '2 learning maps/month', 'Basic insights']
  }
  if (props.currentTier === 'pro') {
    return ['15 analyses/month', '10 learning maps/month', 'Advanced insights']
  }
  return ['Unlimited everything']
})

const recommendedPlanName = computed(() => {
  return props.recommendedTier === 'pro' ? 'Pro' : 'Premium'
})

const recommendedPlanPrice = computed(() => {
  return props.recommendedTier === 'pro' ? '$9' : '$19'
})

const recommendedPlanFeatures = computed(() => {
  if (props.recommendedTier === 'pro') {
    return [
      '15 analyses per month',
      '10 learning maps per month',
      'Advanced interview intelligence',
      'Company-specific insights',
      'Priority support'
    ]
  }
  return [
    'Unlimited analyses',
    'Unlimited learning maps',
    'Real-time interview trends',
    'Custom curriculum builder',
    '1-on-1 career coaching',
    'White-glove support'
  ]
})

const benefits = computed(() => {
  const baseBenefits = [
    'Immediate access to all features',
    'Cancel anytime',
    '14-day money-back guarantee'
  ]

  if (props.triggerType === 'limit_reached') {
    return ['Continue your progress right away', ...baseBenefits]
  }

  return baseBenefits
})

const upgradeButtonText = computed(() => {
  return `Upgrade to ${recommendedPlanName.value}`
})

// Event handlers
const handleClose = () => {
  if (props.allowDismiss) {
    emit('close')
  }
}

const handleUpgrade = () => {
  emit('upgrade', props.recommendedTier)
  router.push('/pricing')
}

const handleViewPlans = () => {
  emit('close')
  router.push('/pricing')
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
}

/* Modal Container */
.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Close Button */
.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Header */
.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.icon-wrapper.success {
  background: #dbeafe;
  color: #3B82F6;
}

.modal-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
}

/* Plan Comparison */
.plans-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  margin-bottom: 32px;
  align-items: center;
}

.plan-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  position: relative;
}

.plan-card.recommended {
  background: linear-gradient(135deg, #f0f4ff 0%, #dbeafe 100%);
  border: 2px solid #3B82F6;
}

.plan-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.plan-card.current .plan-badge {
  background: #e5e7eb;
  color: #6b7280;
}

.plan-badge.featured {
  background: #3B82F6;
  color: white;
}

.plan-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 16px;
}

.plan-price .amount {
  font-size: 32px;
  font-weight: 700;
  color: #3B82F6;
}

.plan-price .period {
  font-size: 14px;
  color: #6b7280;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  font-size: 14px;
  color: #6b7280;
  padding: 6px 0;
}

.plan-features.highlight li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
}

.check-icon {
  color: #10b981;
  flex-shrink: 0;
}

.arrow-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3B82F6;
}

/* Benefits Section */
.benefits-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.benefits-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 16px;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.benefit-icon {
  color: #10b981;
  flex-shrink: 0;
}

.benefit-item span {
  font-size: 14px;
  color: #374151;
}

/* Actions */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-upgrade,
.btn-secondary,
.btn-text {
  width: 100%;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-upgrade {
  background: #3B82F6;
  color: white;
}

.btn-upgrade:hover {
  background: #2563EB;
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: #3B82F6;
  border: 2px solid #3B82F6;
}

.btn-secondary:hover {
  background: #dbeafe;
}

.btn-text {
  background: transparent;
  color: #6b7280;
  padding: 12px;
}

.btn-text:hover {
  color: #374151;
}

/* Trust Signal */
.trust-signal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.lock-icon {
  flex-shrink: 0;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    padding: 24px;
  }

  .plans-comparison {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .arrow-wrapper {
    transform: rotate(90deg);
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
