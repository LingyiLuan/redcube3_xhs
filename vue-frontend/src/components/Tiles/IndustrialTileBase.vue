<template>
  <div
    :class="['industrial-module', { 'industrial-module-interactive': interactive }, spanClass, rowClass]"
    @click="handleClick"
  >
    <div v-if="$slots.header || title" class="tile-header">
      <slot name="header">
        <h4 class="industrial-h4">{{ title }}</h4>
      </slot>
      <div v-if="badge" class="tile-badge">
        <span :class="['industrial-badge', badgeVariant ? `industrial-badge-${badgeVariant}` : '']">
          {{ badge }}
        </span>
      </div>
    </div>

    <div class="tile-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  span?: number
  row?: number
  title?: string
  badge?: string
  badgeVariant?: 'alert' | 'default'
  interactive?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const spanClass = computed(() => props.span ? `industrial-span-${props.span}` : '')
const rowClass = computed(() => props.row ? `industrial-row-${props.row}` : '')

function handleClick() {
  if (props.interactive) {
    emit('click')
  }
}
</script>

<style scoped>
.tile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}
</style>
