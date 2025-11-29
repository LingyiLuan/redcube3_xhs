<template>
  <div class="usage-progress-bar">
    <!-- Header -->
    <div class="usage-header">
      <div class="usage-title">
        <span class="resource-name">{{ resourceName }}</span>
        <span v-if="showUpgradePrompt" class="upgrade-link" @click="handleUpgrade">
          Upgrade for more
        </span>
      </div>
      <div class="usage-stats">
        <span class="usage-text">
          <span class="current">{{ used }}</span>
          <span class="separator">/</span>
          <span class="limit">{{ isUnlimited ? 'Unlimited' : limit }}</span>
        </span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div
        class="progress-bar"
        :class="progressClass"
        :style="{ width: progressWidth }"
      >
        <div class="progress-shine"></div>
      </div>
    </div>

    <!-- Warning Messages -->
    <div v-if="showWarning" class="usage-warning" :class="warningClass">
      <AlertIcon class="warning-icon" />
      <span>{{ warningMessage }}</span>
    </div>

    <!-- Info Text -->
    <div v-if="resetDate" class="reset-info">
      <span>Resets on {{ formattedResetDate }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const AlertIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  `
}

interface Props {
  resourceName: string
  used: number
  limit: number | null // null means unlimited
  resetDate?: string // ISO date string
  showUpgradePrompt?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  resetDate: undefined,
  showUpgradePrompt: true
})

const emit = defineEmits<{
  upgrade: []
}>()

const router = useRouter()

// Computed properties
const isUnlimited = computed(() => props.limit === null)

const usagePercentage = computed(() => {
  if (isUnlimited.value) return 0
  if (props.limit === 0) return 100
  return Math.min((props.used / props.limit) * 100, 100)
})

const progressWidth = computed(() => {
  if (isUnlimited.value) {
    // Show a small filled bar for unlimited plans
    return '100%'
  }
  return `${usagePercentage.value}%`
})

const progressClass = computed(() => {
  if (isUnlimited.value) return 'unlimited'

  const percentage = usagePercentage.value

  if (percentage >= 100) return 'critical' // At limit
  if (percentage >= 90) return 'danger'    // 90-99%
  if (percentage >= 75) return 'warning'   // 75-89%
  return 'normal'                           // 0-74%
})

const showWarning = computed(() => {
  return !isUnlimited.value && usagePercentage.value >= 75
})

const warningClass = computed(() => {
  const percentage = usagePercentage.value

  if (percentage >= 100) return 'critical'
  if (percentage >= 90) return 'danger'
  return 'warning'
})

const warningMessage = computed(() => {
  const percentage = usagePercentage.value
  const remaining = props.limit! - props.used

  if (percentage >= 100) {
    return `You've reached your ${props.resourceName.toLowerCase()} limit. Upgrade to continue.`
  }

  if (percentage >= 90) {
    return `Only ${remaining} ${props.resourceName.toLowerCase()} remaining this month.`
  }

  if (percentage >= 75) {
    return `You've used ${Math.round(percentage)}% of your ${props.resourceName.toLowerCase()} limit.`
  }

  return ''
})

const formattedResetDate = computed(() => {
  if (!props.resetDate) return ''

  const date = new Date(props.resetDate)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

// Event handlers
const handleUpgrade = () => {
  emit('upgrade')
  router.push('/pricing')
}
</script>

<style scoped>
.usage-progress-bar {
  margin-bottom: 24px;
}

/* Header */
.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.usage-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.upgrade-link {
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
}

.upgrade-link:hover {
  color: #2563EB;
  text-decoration: underline;
}

.usage-stats {
  font-size: 14px;
}

.usage-text .current {
  font-weight: 700;
  color: #1f2937;
}

.usage-text .separator {
  color: #9ca3af;
  margin: 0 4px;
}

.usage-text .limit {
  color: #6b7280;
}

/* Progress Bar */
.progress-container {
  position: relative;
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.5s ease, background-color 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  to {
    left: 100%;
  }
}

/* Progress Bar Colors */
.progress-bar.normal {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.progress-bar.warning {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.progress-bar.danger {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.progress-bar.critical {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
}

.progress-bar.unlimited {
  background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%);
}

/* Warning Messages */
.usage-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.usage-warning.warning {
  background: #fef3c7;
  color: #92400e;
}

.usage-warning.danger {
  background: #fed7aa;
  color: #9a3412;
}

.usage-warning.critical {
  background: #fee2e2;
  color: #991b1b;
}

.warning-icon {
  flex-shrink: 0;
}

/* Reset Info */
.reset-info {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .usage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .usage-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
