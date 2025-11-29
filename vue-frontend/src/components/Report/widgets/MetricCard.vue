<template>
  <div :class="['metric-card', `metric-${variant}`]">
    <div class="metric-header">
      <div class="metric-icon" v-if="icon">{{ icon }}</div>
      <div class="metric-label">{{ label }}</div>
    </div>
    <div class="metric-value-container">
      <div class="metric-value">{{ formattedValue }}</div>
      <div v-if="trend" class="metric-trend" :class="trendClass">
        <span class="trend-icon">{{ trendIcon }}</span>
        <span class="trend-value">{{ trend }}</span>
      </div>
    </div>
    <div v-if="subtitle" class="metric-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  value: string | number
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  icon?: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  subtitle?: string
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  icon: '',
  trend: '',
  trendDirection: 'neutral',
  subtitle: '',
  unit: ''
})

/**
 * Format value with unit if provided
 */
const formattedValue = computed(() => {
  if (props.unit) {
    return `${props.value}${props.unit}`
  }
  return props.value
})

/**
 * Get trend CSS class
 */
const trendClass = computed(() => {
  if (props.trendDirection === 'up') return 'trend-up'
  if (props.trendDirection === 'down') return 'trend-down'
  return 'trend-neutral'
})

/**
 * Get trend icon
 */
const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return '↑'
  if (props.trendDirection === 'down') return '↓'
  return '→'
})
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 3px solid;
  transition: all 0.2s;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Variants */
.metric-default {
  border-left-color: #E5E7EB;
}

.metric-primary {
  border-left-color: #3B82F6;
}

.metric-success {
  border-left-color: #10B981;
}

.metric-warning {
  border-left-color: #F59E0B;
}

.metric-error {
  border-left-color: #EF4444;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-icon {
  font-size: 20px;
  line-height: 1;
}

.metric-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value-container {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1F2937;
  line-height: 1;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.trend-icon {
  font-size: 16px;
  line-height: 1;
}

.trend-up {
  background: #D1FAE5;
  color: #059669;
}

.trend-down {
  background: #FEE2E2;
  color: #DC2626;
}

.trend-neutral {
  background: #F3F4F6;
  color: #6B7280;
}

.metric-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 640px) {
  .metric-card {
    padding: 16px;
  }

  .metric-value {
    font-size: 24px;
  }

  .metric-label {
    font-size: 11px;
  }
}
</style>
