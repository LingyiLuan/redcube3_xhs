<template>
  <!-- Hidden SVG sprite sheet for pixel icons -->
  <svg style="display: none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Lock Icon -->
      <symbol id="pixel-icon-lock" viewBox="0 0 24 24">
        <rect x="6" y="10" width="12" height="10" fill="currentColor" />
        <path
          d="M8,10 V6 Q8,2 12,2 Q16,2 16,6 V10"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <rect x="11" y="14" width="2" height="4" fill="#000" />
      </symbol>

      <!-- Play Icon -->
      <symbol id="pixel-icon-play" viewBox="0 0 24 24">
        <polygon points="8,5 8,19 18,12" fill="currentColor" />
      </symbol>

      <!-- Star Icon -->
      <symbol id="pixel-icon-star" viewBox="0 0 24 24">
        <polygon
          points="12,2 15,9 22,10 17,15 18,22 12,18 6,22 7,15 2,10 9,9"
          fill="currentColor"
        />
      </symbol>

      <!-- Workflow Icon -->
      <symbol id="pixel-icon-workflow" viewBox="0 0 24 24">
        <rect x="2" y="2" width="6" height="6" fill="currentColor" />
        <rect x="16" y="2" width="6" height="6" fill="currentColor" />
        <rect x="9" y="16" width="6" height="6" fill="currentColor" />
        <path
          d="M5,8 V14 H12 M19,8 V14 H15"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
      </symbol>

      <!-- Map Icon -->
      <symbol id="pixel-icon-map" viewBox="0 0 24 24">
        <path
          d="M2,4 L8,2 L16,6 L22,4 V20 L16,22 L8,18 L2,20 Z M8,2 V18 M16,6 V22"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
      </symbol>

      <!-- Chart Icon -->
      <symbol id="pixel-icon-chart" viewBox="0 0 24 24">
        <rect x="4" y="14" width="4" height="6" fill="currentColor" />
        <rect x="10" y="10" width="4" height="10" fill="currentColor" />
        <rect x="16" y="6" width="4" height="14" fill="currentColor" />
      </symbol>

      <!-- Key Icon -->
      <symbol id="pixel-icon-key" viewBox="0 0 24 24">
        <circle cx="7" cy="17" r="4" fill="currentColor" />
        <path d="M11,13 L20,4 L22,6 L21,7 L20,6 L19,7 L18,6 L13,11 Z" fill="currentColor" />
      </symbol>

      <!-- Newspaper Icon -->
      <symbol id="pixel-icon-newspaper" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="2" />
        <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="2" />
        <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" stroke-width="2" />
        <rect x="15" y="12" width="2" height="4" fill="currentColor" />
      </symbol>

      <!-- Lightbulb Icon -->
      <symbol id="pixel-icon-lightbulb" viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="5" fill="currentColor" />
        <rect x="10" y="15" width="4" height="4" fill="currentColor" />
        <rect x="9" y="19" width="6" height="2" fill="currentColor" />
      </symbol>

      <!-- Activity Icon -->
      <symbol id="pixel-icon-activity" viewBox="0 0 24 24">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Plus Circle Icon -->
      <symbol id="pixel-icon-plus-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" />
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" />
      </symbol>

      <!-- Check Circle Icon -->
      <symbol id="pixel-icon-check-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="currentColor" />
        <polyline points="8,12 11,15 16,9" stroke="#000" stroke-width="2" fill="none" />
      </symbol>

      <!-- Eye Icon -->
      <symbol id="pixel-icon-eye" viewBox="0 0 24 24">
        <path d="M2,12 Q12,4 22,12 Q12,20 2,12" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </symbol>

      <!-- Trash Icon -->
      <symbol id="pixel-icon-trash" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="14" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" />
        <line x1="10" y1="10" x2="10" y2="16" stroke="currentColor" stroke-width="2" />
        <line x1="14" y1="10" x2="14" y2="16" stroke="currentColor" stroke-width="2" />
      </symbol>

      <!-- Refresh Icon -->
      <symbol id="pixel-icon-refresh" viewBox="0 0 24 24">
        <path
          d="M21,12 A9,9 0 0,1 12,21 A9,9 0 0,1 3,12"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <polyline points="21,5 21,12 14,12" fill="currentColor" />
        <path d="M3,12 A9,9 0 0,1 12,3" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Chevron Left Icon -->
      <symbol id="pixel-icon-chevron-left" viewBox="0 0 24 24">
        <polyline points="15,18 9,12 15,6" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Chevron Right Icon -->
      <symbol id="pixel-icon-chevron-right" viewBox="0 0 24 24">
        <polyline points="9,18 15,12 9,6" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Keyboard Icon -->
      <symbol id="pixel-icon-keyboard" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" stroke="currentColor" stroke-width="2" fill="none" />
        <rect x="4" y="8" width="2" height="2" fill="currentColor" />
        <rect x="7" y="8" width="2" height="2" fill="currentColor" />
        <rect x="10" y="8" width="2" height="2" fill="currentColor" />
        <rect x="5" y="14" width="14" height="2" fill="currentColor" />
      </symbol>

      <!-- Connection Icon -->
      <symbol id="pixel-icon-connection" viewBox="0 0 24 24">
        <circle cx="6" cy="6" r="3" fill="currentColor" />
        <circle cx="18" cy="6" r="3" fill="currentColor" />
        <circle cx="12" cy="18" r="3" fill="currentColor" />
        <line x1="6" y1="9" x2="12" y2="15" stroke="currentColor" stroke-width="2" />
        <line x1="18" y1="9" x2="12" y2="15" stroke="currentColor" stroke-width="2" />
      </symbol>

      <!-- Filter Icon -->
      <symbol id="pixel-icon-filter" viewBox="0 0 24 24">
        <polygon points="4,4 20,4 14,12 14,20 10,20 10,12" fill="currentColor" />
      </symbol>

      <!-- Export Icon -->
      <symbol id="pixel-icon-export" viewBox="0 0 24 24">
        <polyline points="8,4 12,0 16,4" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="12" y1="0" x2="12" y2="12" stroke="currentColor" stroke-width="2" />
        <rect x="4" y="14" width="16" height="8" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Login Icon -->
      <symbol id="pixel-icon-login" viewBox="0 0 24 24">
        <path d="M15,3 L21,3 L21,21 L15,21" stroke="currentColor" stroke-width="2" fill="none" />
        <polyline points="10,7 14,12 10,17" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="3" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="2" />
      </symbol>

      <!-- Inbox Icon -->
      <symbol id="pixel-icon-inbox" viewBox="0 0 24 24">
        <path d="M4,4 L20,4 L20,20 L4,20 Z M4,14 L8,14 L10,18 L14,18 L16,14 L20,14" stroke="currentColor" stroke-width="2" fill="none" />
      </symbol>

      <!-- Play Circle Icon -->
      <symbol id="pixel-icon-play-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
        <polygon points="10,8 10,16 16,12" fill="currentColor" />
      </symbol>

      <!-- Google Icon (Simple G) -->
      <symbol id="pixel-icon-google" viewBox="0 0 24 24">
        <path d="M12,5 A7,7 0 0,0 5,12 A7,7 0 0,0 12,19 A7,7 0 0,0 19,12" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="12" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" />
        <line x1="19" y1="9" x2="19" y2="15" stroke="currentColor" stroke-width="2" />
      </symbol>

      <!-- Circle Icon -->
      <symbol id="pixel-icon-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="6" fill="currentColor" />
      </symbol>
    </defs>
  </svg>
</template>

<script setup lang="ts">
// This component provides the sprite sheet for all pixel icons
// It should be included once in the root App.vue
</script>
