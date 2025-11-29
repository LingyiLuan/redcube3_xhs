<template>
  <button
    :class="[
      'pixel-button',
      `pixel-button-${variant}`,
      {
        'pixel-button-disabled': disabled,
        'pixel-button-loading': loading
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <PixelIcon v-if="icon && !loading" :name="icon" :size="iconSize" />
    <div v-if="loading" class="pixel-spinner"></div>
    <span v-if="$slots.default"><slot></slot></span>
    <div class="pixel-button-glow" v-if="glow"></div>
  </button>
</template>

<script setup lang="ts">
import PixelIcon from './PixelIcon.vue'

defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v: string) => ['primary', 'secondary', 'accent', 'danger', 'success'].includes(v)
  },
  icon: String,
  iconSize: {
    type: Number,
    default: 20
  },
  disabled: Boolean,
  loading: Boolean,
  glow: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<style scoped>
.pixel-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: var(--font-pixel-title);
  font-size: 12px;
  border: 2px solid var(--pixel-border-light);
  cursor: pointer;
  box-shadow: var(--pixel-shadow-sm);
  transition: all 0.2s ease;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pixel-button:hover:not(.pixel-button-disabled):not(.pixel-button-loading) {
  transform: translateY(-2px);
  box-shadow: var(--pixel-shadow-md);
}

.pixel-button:active:not(.pixel-button-disabled):not(.pixel-button-loading) {
  transform: translateY(0);
  box-shadow: var(--pixel-shadow-sm);
}

/* Variants */
.pixel-button-primary {
  background: var(--pixel-accent-cyan);
  color: var(--pixel-bg-primary);
}

.pixel-button-primary:hover:not(.pixel-button-disabled) {
  box-shadow: var(--pixel-shadow-md), 0 0 15px var(--pixel-accent-cyan);
}

.pixel-button-secondary {
  background: var(--pixel-accent-magenta);
  color: white;
}

.pixel-button-secondary:hover:not(.pixel-button-disabled) {
  box-shadow: var(--pixel-shadow-md), 0 0 15px var(--pixel-accent-magenta);
}

.pixel-button-accent {
  background: var(--pixel-accent-yellow);
  color: var(--pixel-bg-primary);
}

.pixel-button-accent:hover:not(.pixel-button-disabled) {
  box-shadow: var(--pixel-shadow-md), 0 0 15px var(--pixel-accent-yellow);
}

.pixel-button-success {
  background: var(--pixel-accent-green);
  color: var(--pixel-bg-primary);
}

.pixel-button-success:hover:not(.pixel-button-disabled) {
  box-shadow: var(--pixel-shadow-md), 0 0 15px var(--pixel-accent-green);
}

.pixel-button-danger {
  background: #e63946;
  color: white;
}

.pixel-button-danger:hover:not(.pixel-button-disabled) {
  box-shadow: var(--pixel-shadow-md), 0 0 15px #e63946;
}

/* Disabled state */
.pixel-button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading state */
.pixel-button-loading {
  cursor: wait;
  pointer-events: none;
}

/* Glow effect */
.pixel-button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: pixel-button-shine 3s ease-in-out infinite;
}

@keyframes pixel-button-shine {
  0% {
    left: -100%;
  }
  50%,
  100% {
    left: 100%;
  }
}

/* Spinner */
.pixel-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: pixel-spin 0.8s linear infinite;
}

@keyframes pixel-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
