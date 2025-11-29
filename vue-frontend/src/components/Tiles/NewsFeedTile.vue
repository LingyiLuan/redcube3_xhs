<template>
  <LightTileBase :span="3" :row="2" glow="green">
    <template #header>
      <div class="tile-header-content">
        <span class="light-h4">Tech News</span>
        <span class="live-indicator">
          <span class="live-dot"></span>
          LIVE
        </span>
      </div>
    </template>

    <div class="news-feed light-scrollbar">
      <div
        v-for="(item, index) in newsItems"
        :key="item.id"
        class="news-item"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="news-icon">{{ getNewsIcon(item.category) }}</div>
        <div class="news-content">
          <div class="news-title light-body-sm">{{ item.title }}</div>
          <div class="news-meta light-caption">
            <span>{{ formatTime(item.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="light-shimmer" style="height: 60px; border-radius: 8px"></div>
        <div class="light-shimmer" style="height: 60px; border-radius: 8px"></div>
      </div>

      <div v-if="newsItems.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">📰</div>
        <div class="light-body-sm">No news available</div>
      </div>
    </div>
  </LightTileBase>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useLandingStore } from '@/stores/landingStore'
import LightTileBase from './LightTileBase.vue'

const landingStore = useLandingStore()

const newsItems = computed(() => landingStore.recentNews)
const isLoading = computed(() => landingStore.isNewsLoading)

function getNewsIcon(category: string) {
  const icons: Record<string, string> = {
    feature: '✨',
    update: '🔄',
    improvement: '⚡',
    fix: '🔧',
    default: '📢'
  }
  return icons[category] || icons.default
}

function formatTime(timestamp: Date) {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}
</script>

<style scoped>
.tile-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--light-accent-green);
  letter-spacing: 0.1em;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--light-accent-green);
  border-radius: 50%;
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.news-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.news-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--light-bg-tertiary);
  border-radius: 8px;
  transition: all var(--transition-fast);
  animation: fade-in var(--transition-normal) ease-out;
  animation-fill-mode: both;
}

.news-item:hover {
  background: var(--light-bg-secondary);
  box-shadow: var(--light-shadow-sm);
  transform: translateX(4px);
}

.news-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  color: var(--light-text-primary);
  line-height: 1.4;
  margin-bottom: 4px;
}

.news-meta {
  color: var(--light-text-tertiary);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.5;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
