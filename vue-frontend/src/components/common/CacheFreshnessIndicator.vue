<template>
  <div v-if="cacheMetadata" class="cache-freshness-indicator">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="clock-icon">
      <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1" fill="none"/>
      <path d="M6 3v3l2 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
    </svg>
    <span class="freshness-text">{{ freshnessLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const cacheMetadata = ref<any>(null)

const freshnessLabel = computed(() => {
  if (!cacheMetadata.value || cacheMetadata.value.length === 0) {
    return 'Cache unavailable'
  }

  // Get the most recent cache update (use stage_success as it's typically last)
  const stageCache = cacheMetadata.value.find((c: any) => c.cache_type === 'stage_success')
  if (!stageCache || !stageCache.last_computed) {
    return 'Cache unavailable'
  }

  const lastComputed = new Date(stageCache.last_computed)
  const now = new Date()
  const diffMs = now.getTime() - lastComputed.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return 'Updated < 1h ago'
  } else if (diffHours < 24) {
    return `Updated ${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Updated 1 day ago'
  } else if (diffDays < 7) {
    return `Updated ${diffDays} days ago`
  } else {
    return 'Updated > 1 week ago'
  }
})

async function fetchCacheMetadata() {
  try {
    const response = await axios.get('/api/content/benchmark/metadata')
    if (response.data.success && response.data.metadata) {
      cacheMetadata.value = response.data.metadata
    }
  } catch (error) {
    console.error('[CacheFreshnessIndicator] Failed to fetch cache metadata:', error)
  }
}

onMounted(() => {
  fetchCacheMetadata()
})
</script>

<style scoped>
.cache-freshness-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: #F3F4F6;
  border: 1px solid #E5E7EB;
  font-size: 10px;
  color: #6B7280;
  font-weight: 500;
}

.clock-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.freshness-text {
  white-space: nowrap;
}
</style>
