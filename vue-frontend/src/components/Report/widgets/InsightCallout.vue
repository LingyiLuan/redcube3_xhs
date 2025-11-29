<template>
  <div :class="['insight-callout', `insight-${type}`]">
    <div class="insight-icon">{{ icon }}</div>
    <div class="insight-content">
      <div v-if="title" class="insight-title">{{ title }}</div>
      <div class="insight-text">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  icon: ''
})

const defaultIcon = computed(() => {
  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  return props.icon || icons[props.type]
})

const icon = computed(() => props.icon || defaultIcon.value)
</script>

<style scoped>
.insight-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 0 8px 8px 0;
  border-left: 3px solid;
  margin: 16px 0;
}

/* Type variants */
.insight-info {
  background: #EFF6FF;
  border-left-color: #2563EB;
}

.insight-success {
  background: #D1FAE5;
  border-left-color: #059669;
}

.insight-warning {
  background: #FEF3C7;
  border-left-color: #F59E0B;
}

.insight-error {
  background: #FEE2E2;
  border-left-color: #DC2626;
}

.insight-icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.insight-content {
  flex: 1;
  min-width: 0;
}

.insight-title {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 4px;
}

.insight-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

/* Responsive */
@media (max-width: 640px) {
  .insight-callout {
    padding: 12px 16px;
  }

  .insight-icon {
    font-size: 20px;
  }

  .insight-title {
    font-size: 13px;
  }

  .insight-text {
    font-size: 13px;
  }
}
</style>
