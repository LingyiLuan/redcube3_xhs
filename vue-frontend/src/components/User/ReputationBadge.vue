<template>
  <div class="reputation-badge" :class="`tier-${tier.toLowerCase()}`">
    <div class="badge-icon">
      <svg v-if="tier === 'bronze'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
      <svg v-else-if="tier === 'silver'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
        <circle cx="12" cy="8" r="6"/>
      </svg>
      <svg v-else-if="tier === 'gold'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
        <circle cx="12" cy="8" r="6"/>
      </svg>
      <svg v-else-if="tier === 'platinum'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
        <circle cx="12" cy="8" r="6"/>
        <circle cx="12" cy="8" r="3"/>
      </svg>
    </div>
    <span class="badge-text">{{ tierDisplay }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  tier: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const tierDisplay = computed(() => {
  return props.tier.charAt(0).toUpperCase() + props.tier.slice(1)
})
</script>

<style scoped>
.reputation-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

/* Bronze Tier */
.tier-bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.3);
}

.tier-bronze .badge-icon {
  color: #fff8dc;
}

/* Silver Tier */
.tier-silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.3);
}

.tier-silver .badge-icon {
  color: #f0f0f0;
}

/* Gold Tier */
.tier-gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  color: #1a202c;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.tier-gold .badge-icon {
  color: #fff8dc;
}

/* Platinum Tier */
.tier-platinum {
  background: linear-gradient(135deg, #e5e4e2 0%, #d4d4d4 100%);
  color: #1a202c;
  box-shadow: 0 4px 12px rgba(229, 228, 226, 0.5);
  border: 2px solid #c0c0c0;
}

.tier-platinum .badge-icon {
  color: #667eea;
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  letter-spacing: 0.5px;
}

/* Size variations */
.reputation-badge.size-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.375rem;
}

.reputation-badge.size-small .badge-icon svg {
  width: 16px;
  height: 16px;
}

.reputation-badge.size-large {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  gap: 0.625rem;
}

.reputation-badge.size-large .badge-icon svg {
  width: 24px;
  height: 24px;
}
</style>
