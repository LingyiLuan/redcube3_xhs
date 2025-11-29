<template>
  <div class="usage-indicator" :class="statusClass">
    <div class="usage-header">
      <div class="usage-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Monthly Analysis Limit</span>
      </div>
      <div class="usage-count">
        {{ usageStats?.currentUsage || 0 }} / {{ limitDisplay }}
      </div>
    </div>

    <div class="usage-bar">
      <div class="usage-fill" :style="{ width: usagePercentage + '%' }"></div>
    </div>

    <div class="usage-info">
      <span class="usage-remaining" v-if="!isUnlimited">
        {{ usageStats?.remaining || 0 }} {{ usageStats?.remaining === 1 ? 'analysis' : 'analyses' }} remaining
      </span>
      <span class="usage-remaining unlimited" v-else>
        Unlimited analyses
      </span>
      <span class="usage-reset" v-if="!isUnlimited">
        Resets {{ resetDateDisplay }}
      </span>
    </div>

    <!-- Warning message when approaching limit -->
    <div v-if="showWarning" class="usage-warning">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>You're running low on analyses. Consider upgrading to {{ nextTierName }} for more!</span>
    </div>

    <!-- Upgrade CTA when at limit -->
    <div v-if="showUpgradeCTA" class="usage-upgrade">
      <div class="upgrade-message">
        <strong>Limit Reached!</strong>
        <p>Upgrade to {{ nextTierName }} to continue analyzing interview trends.</p>
      </div>
      <button class="upgrade-btn" @click="$emit('upgrade')">
        Upgrade Now
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface UsageStats {
  tier: string
  limit: number | string
  currentUsage: number
  remaining: number | string
  resetDate: string
}

interface Props {
  usageStats: UsageStats | null
}

const props = defineProps<Props>()
defineEmits(['upgrade'])

const isUnlimited = computed(() => {
  return props.usageStats?.limit === 'unlimited' || props.usageStats?.limit === -1
})

const limitDisplay = computed(() => {
  if (isUnlimited.value) return '∞'
  return props.usageStats?.limit || 0
})

const usagePercentage = computed(() => {
  if (isUnlimited.value) return 0
  if (!props.usageStats) return 0

  const current = props.usageStats.currentUsage || 0
  const limit = props.usageStats.limit as number || 1

  return Math.min((current / limit) * 100, 100)
})

const statusClass = computed(() => {
  const percentage = usagePercentage.value

  if (isUnlimited.value) return 'status-unlimited'
  if (percentage >= 100) return 'status-exceeded'
  if (percentage >= 80) return 'status-warning'
  if (percentage >= 50) return 'status-caution'
  return 'status-good'
})

const showWarning = computed(() => {
  return !isUnlimited.value && usagePercentage.value >= 80 && usagePercentage.value < 100
})

const showUpgradeCTA = computed(() => {
  return !isUnlimited.value && usagePercentage.value >= 100
})

const nextTierName = computed(() => {
  const tier = props.usageStats?.tier?.toLowerCase()

  if (tier === 'bronze') return 'Silver'
  if (tier === 'silver') return 'Gold'
  return 'Premium'
})

const resetDateDisplay = computed(() => {
  if (!props.usageStats?.resetDate) return ''

  const resetDate = new Date(props.usageStats.resetDate)
  const now = new Date()
  const diffTime = resetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays < 7) return `in ${diffDays} days`

  return resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})
</script>

<style scoped>
.usage-indicator {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.usage-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #334155;
}

.usage-title svg {
  color: #667eea;
}

.usage-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
}

.usage-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 999px;
  transition: all 0.3s ease;
}

.status-good .usage-fill {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.status-caution .usage-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.status-warning .usage-fill {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.status-exceeded .usage-fill {
  background: linear-gradient(90deg, #991b1b 0%, #7f1d1d 100%);
}

.status-unlimited .usage-fill {
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
}

.usage-remaining.unlimited {
  color: #8b5cf6;
  font-weight: 600;
}

.usage-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #92400e;
}

.usage-warning svg {
  flex-shrink: 0;
  color: #f59e0b;
}

.usage-upgrade {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #ef4444;
  border-radius: 8px;
}

.upgrade-message {
  margin-bottom: 0.75rem;
}

.upgrade-message strong {
  display: block;
  color: #991b1b;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.upgrade-message p {
  color: #7f1d1d;
  font-size: 0.875rem;
  margin: 0;
}

.upgrade-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .usage-indicator {
    padding: 1rem;
  }

  .usage-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
