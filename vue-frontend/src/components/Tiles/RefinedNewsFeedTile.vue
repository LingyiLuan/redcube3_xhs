<template>
  <RefinedTileBase :span="3" :row="2" class="news-tile">
    <template #header>
      <h4 class="refined-h4">Latest Updates</h4>
      <span class="refined-status refined-status-pulse"></span>
    </template>

    <div class="news-list refined-scrollbar">
      <div v-for="item in newsItems" :key="item.id" class="news-item">
        <div class="news-meta">
          <span class="refined-caption">{{ formatDate(item.date) }}</span>
          <span :class="['refined-badge', 'badge-' + item.type]">{{ item.type }}</span>
        </div>
        <p class="news-title refined-body-sm">{{ item.title }}</p>
      </div>

      <div v-if="newsItems.length === 0" class="empty-state">
        <p class="refined-body-sm">No updates available</p>
      </div>
    </div>
  </RefinedTileBase>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useLandingStore } from '@/stores/landingStore'
import RefinedTileBase from './RefinedTileBase.vue'

const landingStore = useLandingStore()

const newsItems = computed(() => landingStore.newsItems.slice(0, 5))

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.news-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow-y: auto;
  max-height: 220px;
  padding-right: var(--space-xs);
}

.news-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--refined-border-light);
}

.news-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.news-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}

.news-title {
  margin: 0;
  line-height: 1.4;
  color: var(--refined-text-primary);
}

.badge-feature {
  background: var(--refined-accent-orange);
  color: white;
}

.badge-update {
  background: #28a745;
  color: white;
}

.badge-news {
  background: #4a90e2;
  color: white;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--refined-text-tertiary);
}

.empty-state p {
  margin: 0;
}
</style>
