<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 24 24`"
    :class="['pixel-icon', { animated }]"
    :style="{ color: color }"
  >
    <use :href="`#pixel-icon-${name}`" />
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 24
  },
  color: String,
  animated: Boolean
})
</script>

<style scoped>
.pixel-icon {
  fill: currentColor;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-icon.animated {
  animation: icon-pulse 1s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
