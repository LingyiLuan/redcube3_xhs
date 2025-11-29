<template>
  <div
    :class="[
      'light-tile',
      { 'light-tile-interactive': interactive },
      glowClass,
      spanClass,
      rowClass
    ]"
    @click="handleClick"
  >
    <div v-if="$slots.header" class="tile-header">
      <slot name="header"></slot>
    </div>
    <div class="tile-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="tile-footer">
      <slot name="footer"></slot>
    </div>
    <div v-if="badge" class="tile-badge">
      <span :class="['light-badge', badgeVariant ? `light-badge-${badgeVariant}` : '']">
        {{ badge }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  span: {
    type: Number,
    default: 4
  },
  row: {
    type: Number,
    default: 1
  },
  interactive: Boolean,
  glow: {
    type: String,
    validator: (v: string) => ['blue', 'cyan', 'green', ''].includes(v)
  },
  badge: [String, Number],
  badgeVariant: {
    type: String,
    validator: (v: string) => ['success', 'warning', 'alert', ''].includes(v)
  }
})

const emit = defineEmits(['click'])

const spanClass = computed(() => `light-span-${props.span}`)
const rowClass = computed(() => `light-row-${props.row}`)
const glowClass = computed(() => props.glow ? `light-tile-glow-${props.glow}` : '')

function handleClick() {
  if (props.interactive) {
    emit('click')
  }
}
</script>

<style scoped>
.tile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--light-border);
}

.tile-body {
  flex: 1;
  overflow: hidden;
}

.tile-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--light-border);
}

.tile-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}
</style>
