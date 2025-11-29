<template>
  <div
    :class="['refined-module', { 'refined-module-interactive': interactive }, spanClass, rowClass]"
    @click="handleClick"
  >
    <div v-if="$slots.header || title" class="tile-header">
      <slot name="header">
        <h4 class="refined-h4">{{ title }}</h4>
      </slot>
      <div v-if="badge" class="tile-badge">
        <span :class="['refined-badge', badgeVariant ? `refined-badge-${badgeVariant}` : '']">
          {{ badge }}
        </span>
      </div>
    </div>

    <div class="tile-body">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="tile-footer">
      <slot name="footer"></slot>
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
  title: String,
  interactive: Boolean,
  badge: [String, Number],
  badgeVariant: {
    type: String,
    validator: (v: string) => ['outline', 'alert', ''].includes(v)
  }
})

const emit = defineEmits(['click'])

const spanClass = computed(() => `refined-span-${props.span}`)
const rowClass = computed(() => `refined-row-${props.row}`)

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
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--refined-border);
}

.tile-body {
  flex: 1;
  overflow: hidden;
}

.tile-footer {
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--refined-border);
}

.tile-badge {
  flex-shrink: 0;
}
</style>
