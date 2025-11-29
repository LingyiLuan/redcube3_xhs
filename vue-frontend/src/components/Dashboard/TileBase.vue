<template>
  <div
    :class="[
      'pixel-tile',
      `tile-${size}`,
      `tile-${variant}`,
      { 'tile-interactive': interactive, 'tile-locked': locked }
    ]"
    :style="tileStyle"
  >
    <!-- Pixel border effect -->
    <div class="pixel-border pixel-border-top"></div>
    <div class="pixel-border pixel-border-right"></div>
    <div class="pixel-border pixel-border-bottom"></div>
    <div class="pixel-border pixel-border-left"></div>

    <!-- Corner decorations -->
    <div class="pixel-corner pixel-corner-tl"></div>
    <div class="pixel-corner pixel-corner-tr"></div>
    <div class="pixel-corner pixel-corner-bl"></div>
    <div class="pixel-corner pixel-corner-br"></div>

    <!-- Scan line effect -->
    <div class="scanline-overlay" v-if="showScanlines"></div>

    <!-- Content slot -->
    <div class="tile-content">
      <div class="tile-header" v-if="$slots.header">
        <slot name="header"></slot>
      </div>
      <div class="tile-body">
        <slot></slot>
      </div>
      <div class="tile-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>

    <!-- Lock overlay for authenticated features -->
    <div class="lock-overlay" v-if="locked">
      <div class="lock-icon">🔒</div>
      <p class="pixel-text">LOGIN REQUIRED</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg', 'xl', 'hero'].includes(v)
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (v: string) => ['primary', 'secondary', 'accent', 'danger', 'success'].includes(v)
  },
  interactive: Boolean,
  locked: Boolean,
  showScanlines: {
    type: Boolean,
    default: true
  },
  glowColor: String
})

const tileStyle = computed(() => ({
  '--tile-glow-color': props.glowColor || 'var(--pixel-accent-cyan)'
}))
</script>

<style scoped>
.pixel-tile {
  position: relative;
  background: var(--pixel-bg-secondary);
  border-radius: var(--crt-curvature);
  overflow: hidden;
  box-shadow: var(--pixel-shadow-md);
  transition: all 0.2s ease;
}

/* Pixel borders */
.pixel-border {
  position: absolute;
  background: var(--pixel-border-light);
  z-index: 1;
}

.pixel-border-top,
.pixel-border-bottom {
  left: 0;
  right: 0;
  height: 2px;
}

.pixel-border-left,
.pixel-border-right {
  top: 0;
  bottom: 0;
  width: 2px;
}

.pixel-border-top {
  top: 0;
}
.pixel-border-bottom {
  bottom: 0;
}
.pixel-border-left {
  left: 0;
}
.pixel-border-right {
  right: 0;
}

/* Corner decorations */
.pixel-corner {
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: 2;
}

.pixel-corner-tl {
  top: 0;
  left: 0;
  background: var(--pixel-accent-cyan);
}
.pixel-corner-tr {
  top: 0;
  right: 0;
  background: var(--pixel-accent-magenta);
}
.pixel-corner-bl {
  bottom: 0;
  left: 0;
  background: var(--pixel-accent-green);
}
.pixel-corner-br {
  bottom: 0;
  right: 0;
  background: var(--pixel-accent-yellow);
}

/* Interactive hover effect */
.tile-interactive {
  cursor: pointer;
}

.tile-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--pixel-shadow-lg), 0 0 20px var(--tile-glow-color);
}

.tile-interactive:hover .pixel-corner {
  animation: corner-pulse 0.6s ease-in-out infinite;
}

@keyframes corner-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Scanline effect */
.scanline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, var(--scanline-opacity)) 0px,
    transparent 2px,
    transparent 4px
  );
  pointer-events: none;
  z-index: 3;
}

/* Content layout */
.tile-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tile-header {
  font-family: var(--font-pixel-title);
  font-size: 14px;
  color: var(--pixel-accent-cyan);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tile-body {
  flex: 1;
  font-family: var(--font-pixel-body);
  color: var(--pixel-text-primary);
  overflow-y: auto;
}

.tile-footer {
  font-family: var(--font-pixel-body);
  font-size: 14px;
  color: var(--pixel-text-secondary);
}

/* Lock overlay */
.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
}

.lock-icon {
  font-size: 48px;
  opacity: 0.8;
  animation: pixel-pulse-lock 2s ease-in-out infinite;
}

.lock-overlay .pixel-text {
  font-family: var(--font-pixel-title);
  font-size: 12px;
  color: var(--pixel-accent-magenta);
  letter-spacing: 2px;
}

/* Variant colors */
.tile-primary {
  --tile-glow-color: var(--pixel-accent-cyan);
}
.tile-primary .pixel-corner-tl,
.tile-primary .pixel-corner-br {
  background: var(--pixel-accent-cyan);
}

.tile-secondary {
  --tile-glow-color: var(--pixel-accent-magenta);
}
.tile-secondary .pixel-corner-tl,
.tile-secondary .pixel-corner-br {
  background: var(--pixel-accent-magenta);
}

.tile-accent {
  --tile-glow-color: var(--pixel-accent-yellow);
}
.tile-accent .pixel-corner-tl,
.tile-accent .pixel-corner-br {
  background: var(--pixel-accent-yellow);
}

.tile-success {
  --tile-glow-color: var(--pixel-accent-green);
}
.tile-success .pixel-corner-tl,
.tile-success .pixel-corner-br {
  background: var(--pixel-accent-green);
}

/* Scrollbar for tile body */
.tile-body::-webkit-scrollbar {
  width: 8px;
  background: var(--pixel-bg-primary);
}

.tile-body::-webkit-scrollbar-track {
  background: var(--pixel-bg-secondary);
  border: 1px solid var(--pixel-border-dark);
}

.tile-body::-webkit-scrollbar-thumb {
  background: var(--pixel-accent-cyan);
  border: 1px solid var(--pixel-bg-primary);
}

.tile-body::-webkit-scrollbar-thumb:hover {
  background: var(--pixel-accent-magenta);
}

/* Responsive sizing */
@media (max-width: 768px) {
  .tile-content {
    padding: 16px;
  }

  .tile-header {
    font-size: 12px;
  }
}
</style>
