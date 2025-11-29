<template>
  <div :class="['pixel-loading-spinner', `size-${size}`, `variant-${variant}`]">
    <div class="spinner-blocks">
      <div class="block block-1"></div>
      <div class="block block-2"></div>
      <div class="block block-3"></div>
      <div class="block block-4"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v)
  },
  variant: {
    type: String,
    default: 'cyan',
    validator: (v: string) => ['cyan', 'magenta', 'yellow', 'green'].includes(v)
  },
  text: String
})
</script>

<style scoped>
.pixel-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner-blocks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.block {
  animation: pixel-block-fade 1.2s ease-in-out infinite;
}

/* Size variants */
.size-sm .block {
  width: 8px;
  height: 8px;
}

.size-md .block {
  width: 12px;
  height: 12px;
}

.size-lg .block {
  width: 16px;
  height: 16px;
}

/* Color variants */
.variant-cyan .block {
  background: var(--pixel-accent-cyan);
}

.variant-magenta .block {
  background: var(--pixel-accent-magenta);
}

.variant-yellow .block {
  background: var(--pixel-accent-yellow);
}

.variant-green .block {
  background: var(--pixel-accent-green);
}

/* Animation delays for blocks */
.block-1 {
  animation-delay: 0s;
}

.block-2 {
  animation-delay: 0.15s;
}

.block-3 {
  animation-delay: 0.3s;
}

.block-4 {
  animation-delay: 0.45s;
}

@keyframes pixel-block-fade {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-text {
  font-family: var(--font-pixel-title);
  font-size: 10px;
  color: var(--pixel-text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: pixel-blink 1s step-end infinite;
}

@keyframes pixel-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0.3;
  }
}
</style>
