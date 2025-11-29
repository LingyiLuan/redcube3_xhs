<template>
  <div class="data-source-badge-container">
    <button
      class="data-source-badge"
      :class="badgeClass"
      @click="showTooltip = !showTooltip"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <span class="badge-text">{{ label }}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" class="info-icon">
        <circle cx="5" cy="5" r="4.5" stroke="currentColor" fill="none"/>
        <text x="5" y="7.5" text-anchor="middle" font-size="7" font-weight="bold" fill="currentColor">i</text>
      </svg>
    </button>

    <!-- Tooltip -->
    <transition name="tooltip-fade">
      <div v-if="showTooltip" class="data-source-tooltip" :class="tooltipClass">
        <div class="tooltip-header">
          <svg v-if="type === 'benchmark'" width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" fill="currentColor"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" fill="currentColor"/>
          </svg>
          <span class="tooltip-title">{{ tooltipTitle }}</span>
        </div>
        <p class="tooltip-description">{{ tooltipDescription }}</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  type: 'benchmark' | 'personalized'
}

const props = defineProps<Props>()
const showTooltip = ref(false)

const label = computed(() => props.type === 'benchmark' ? 'Benchmark' : 'Personalized')

const badgeClass = computed(() => {
  return props.type === 'benchmark' ? 'badge-benchmark' : 'badge-personalized'
})

const tooltipClass = computed(() => {
  return props.type === 'benchmark' ? 'tooltip-benchmark' : 'tooltip-personalized'
})

const tooltipTitle = computed(() => {
  return props.type === 'benchmark' ? 'Industry Benchmark Data' : 'Your Personalized Data'
})

const tooltipDescription = computed(() => {
  if (props.type === 'benchmark') {
    return 'This data is aggregated from thousands of interview experiences across the industry, providing objective comparison metrics.'
  } else {
    return 'This analysis is based specifically on your uploaded posts, showing patterns unique to your interview experiences.'
  }
})
</script>

<style scoped>
.data-source-badge-container {
  position: relative;
  display: inline-block;
}

.data-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-source-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge-benchmark {
  background-color: #FEF3C7;
  color: #92400E;
  border-color: #FCD34D;
}

.badge-benchmark:hover {
  background-color: #FDE68A;
}

.badge-personalized {
  background-color: #DBEAFE;
  color: #1E40AF;
  border-color: #93C5FD;
}

.badge-personalized:hover {
  background-color: #BFDBFE;
}

.badge-icon {
  flex-shrink: 0;
}

.badge-text {
  line-height: 1;
}

.info-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

/* Tooltip */
.data-source-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
}

.tooltip-benchmark {
  background-color: #FFFBEB;
  border: 1px solid #FCD34D;
}

.tooltip-personalized {
  background-color: #EFF6FF;
  border: 1px solid #93C5FD;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tooltip-benchmark .tooltip-header {
  color: #92400E;
}

.tooltip-personalized .tooltip-header {
  color: #1E40AF;
}

.tooltip-title {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tooltip-description {
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

.tooltip-benchmark .tooltip-description {
  color: #78350F;
}

.tooltip-personalized .tooltip-description {
  color: #1E3A8A;
}

/* Tooltip fade animation */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

.tooltip-fade-enter-to,
.tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
