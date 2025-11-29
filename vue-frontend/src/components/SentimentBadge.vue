<template>
  <div
    ref="badgeRef"
    class="sentiment-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Badge Display -->
    <div :class="['sentiment-badge', `sentiment-${category.toLowerCase()}`]">
      <span class="sentiment-category">{{ category }}</span>
      <span class="sentiment-score">{{ formatScore(score) }}</span>
    </div>

    <!-- Teleport Tooltip to Body (escapes overflow: hidden) -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="showTooltip"
          ref="tooltipRef"
          class="sentiment-tooltip"
          :style="tooltipStyle"
        >
          <div class="tooltip-header">
            <span class="tooltip-title">Sentiment Analysis</span>
            <span class="tooltip-score">{{ formatScore(score) }}/5.0</span>
          </div>

          <div class="tooltip-meta">
            <span class="meta-item">
              <span class="meta-label">Category:</span>
              <span class="meta-value">{{ category }}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Sample Size:</span>
              <span class="meta-value">{{ postCount }} posts</span>
            </span>
          </div>

          <div class="tooltip-reasoning">
            <div class="reasoning-label">Analysis</div>
            <div class="reasoning-text">{{ reasoning }}</div>
          </div>

          <div v-if="keyPhrases && keyPhrases.length > 0" class="tooltip-phrases">
            <div class="phrases-label">Representative Quotes</div>
            <ul class="phrases-list">
              <li v-for="(phrase, index) in keyPhrases.slice(0, 3)" :key="index">
                "{{ phrase }}"
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, nextTick, onUnmounted } from 'vue'

interface Props {
  category: string
  score: number | string
  reasoning?: string
  keyPhrases?: string[]
  postCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  reasoning: 'Aggregated sentiment from multiple interview posts',
  keyPhrases: () => [],
  postCount: 0
})

const badgeRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipPosition = ref({ top: 0, left: 0, placement: 'bottom' })

const TOOLTIP_WIDTH = 340
const TOOLTIP_OFFSET = 8
const VIEWPORT_PADDING = 16

function formatScore(score: number | string): string {
  if (score === 'N/A' || score === null || score === undefined) {
    return 'N/A'
  }
  const numScore = typeof score === 'string' ? parseFloat(score) : score
  return isNaN(numScore) ? 'N/A' : numScore.toFixed(1)
}

function calculateTooltipPosition() {
  if (!badgeRef.value) return

  const badgeRect = badgeRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  // Calculate horizontal position (centered below badge)
  let left = badgeRect.left + badgeRect.width / 2 - TOOLTIP_WIDTH / 2

  // Prevent tooltip from going off-screen horizontally
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING
  } else if (left + TOOLTIP_WIDTH > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING
  }

  // Calculate vertical position with smart placement
  const spaceBelow = viewportHeight - badgeRect.bottom
  const spaceAbove = badgeRect.top

  // Estimate tooltip height (will be refined after render)
  const estimatedTooltipHeight = 250

  let top: number
  let placement: 'bottom' | 'top'

  if (spaceBelow >= estimatedTooltipHeight + TOOLTIP_OFFSET || spaceBelow > spaceAbove) {
    // Place below (default)
    top = badgeRect.bottom + TOOLTIP_OFFSET + window.scrollY
    placement = 'bottom'
  } else {
    // Place above (flip)
    top = badgeRect.top - estimatedTooltipHeight - TOOLTIP_OFFSET + window.scrollY
    placement = 'top'
  }

  tooltipPosition.value = { top, left, placement }
}

async function handleMouseEnter() {
  showTooltip.value = true
  await nextTick()
  calculateTooltipPosition()
}

function handleMouseLeave() {
  showTooltip.value = false
}

// Recalculate position on scroll/resize
function handleWindowEvent() {
  if (showTooltip.value) {
    calculateTooltipPosition()
  }
}

// Cleanup listeners
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', handleWindowEvent, true)
  window.addEventListener('resize', handleWindowEvent)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleWindowEvent, true)
    window.removeEventListener('resize', handleWindowEvent)
  })
}

const tooltipStyle = computed(() => ({
  position: 'fixed',
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
  width: `${TOOLTIP_WIDTH}px`
}))
</script>

<style scoped>
/* Container */
.sentiment-container {
  position: relative;
  display: inline-block;
}

/* Badge Styles */
.sentiment-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.sentiment-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Category-Specific Colors (Professional McKinsey Palette) */
.sentiment-confident {
  background: #EFF6FF;
  color: #1E3A8A;
  border-color: #DBEAFE;
}

.sentiment-anxious {
  background: #DBEAFE;
  color: #1E40AF;
  border-color: #BFDBFE;
}

.sentiment-frustrated {
  background: #BFDBFE;
  color: #3B82F6;
  border-color: #93C5FD;
}

.sentiment-relieved {
  background: #DBEAFE;
  color: #1E40AF;
  border-color: #BFDBFE;
}

.sentiment-disappointed {
  background: #E0E7FF;
  color: #3730A3;
  border-color: #C7D2FE;
}

.sentiment-neutral {
  background: #F3F4F6;
  color: #374151;
  border-color: #D1D5DB;
}

.sentiment-mixed {
  background: #F3E8FF;
  color: #6B21A8;
  border-color: #E9D5FF;
}

.sentiment-category {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-size: 11px;
}

.sentiment-score {
  font-size: 13px;
  font-weight: 700;
}

/* Tooltip - Now uses fixed positioning via Teleport */
.sentiment-tooltip {
  position: fixed;
  /* top and left are set dynamically via :style */
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  z-index: 10000;
  text-align: left;
  pointer-events: none; /* Prevent tooltip from interfering with mouse events */
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.tooltip-score {
  font-size: 16px;
  font-weight: 700;
  color: #2563EB;
}

.tooltip-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.meta-label {
  color: #6B7280;
  font-weight: 500;
}

.meta-value {
  color: #1F2937;
  font-weight: 600;
}

.tooltip-reasoning {
  margin-bottom: 12px;
}

.reasoning-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
  margin-bottom: 6px;
}

.reasoning-text {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}

.tooltip-phrases {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
}

.phrases-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6B7280;
  margin-bottom: 6px;
}

.phrases-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.phrases-list li {
  font-size: 12px;
  line-height: 1.6;
  color: #4B5563;
  padding: 4px 0;
  font-style: italic;
}

.phrases-list li:before {
  content: '•';
  margin-right: 8px;
  color: #9CA3AF;
}

/* Tooltip Transition - Updated for fixed positioning */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
