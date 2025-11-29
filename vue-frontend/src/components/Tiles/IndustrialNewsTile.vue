<template>
  <IndustrialTileBase :span="3" :row="2" class="news-tile">
    <template #header>
      <h4 class="industrial-h4">Interview Insights</h4>
      <span class="industrial-status industrial-status-success industrial-status-pulse"></span>
    </template>

    <div class="news-list-container" ref="scrollContainer">
      <div class="news-list">
        <div v-for="item in interviewQuestions" :key="item.id" class="news-item">
          <div class="news-meta">
            <span class="industrial-caption">{{ item.company }}</span>
            <span class="industrial-badge">{{ item.role }}</span>
          </div>
          <p class="news-title industrial-body-sm">{{ item.question }}</p>
        </div>
      </div>
    </div>
  </IndustrialTileBase>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import IndustrialTileBase from './IndustrialTileBase.vue'

const scrollContainer = ref<HTMLElement | null>(null)
let scrollInterval: number | null = null

// Real interview questions from big tech companies
const interviewQuestions = ref([
  {
    id: 1,
    company: 'GOOGLE',
    role: 'SWE',
    question: 'Design a distributed rate limiter for API gateway'
  },
  {
    id: 2,
    company: 'META',
    role: 'Frontend',
    question: 'Implement infinite scroll with virtualization'
  },
  {
    id: 3,
    company: 'AMAZON',
    role: 'Backend',
    question: 'Design URL shortener with analytics tracking'
  },
  {
    id: 4,
    company: 'APPLE',
    role: 'iOS',
    question: 'Optimize memory usage in large image gallery'
  },
  {
    id: 5,
    company: 'MICROSOFT',
    role: 'Full Stack',
    question: 'Implement collaborative text editor (OT/CRDT)'
  },
  {
    id: 6,
    company: 'NETFLIX',
    role: 'SRE',
    question: 'Design video streaming CDN architecture'
  },
  {
    id: 7,
    company: 'GOOGLE',
    role: 'ML Engineer',
    question: 'Build recommendation system with cold start'
  },
  {
    id: 8,
    company: 'META',
    role: 'Data Eng',
    question: 'Design real-time analytics pipeline'
  },
  {
    id: 9,
    company: 'AMAZON',
    role: 'DevOps',
    question: 'Implement blue-green deployment strategy'
  },
  {
    id: 10,
    company: 'STRIPE',
    role: 'Backend',
    question: 'Design payment processing with idempotency'
  },
  {
    id: 11,
    company: 'UBER',
    role: 'SWE',
    question: 'Build dynamic pricing algorithm for surge'
  },
  {
    id: 12,
    company: 'AIRBNB',
    role: 'Frontend',
    question: 'Create calendar booking with availability'
  }
])

onMounted(() => {
  // Auto-scroll every 3 seconds
  scrollInterval = window.setInterval(() => {
    if (scrollContainer.value) {
      const container = scrollContainer.value
      const scrollAmount = 80 // Scroll by ~1 item height

      // Smooth scroll down
      container.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      })

      // Reset to top when reaching bottom
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
        setTimeout(() => {
          container.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }, 2000)
      }
    }
  }, 3000)
})

onUnmounted(() => {
  if (scrollInterval) {
    clearInterval(scrollInterval)
  }
})
</script>

<style scoped>
.news-tile {
  display: flex;
  flex-direction: column;
}

.news-list-container {
  overflow-y: auto;
  max-height: 280px;
  padding-right: var(--space-xs);
  scroll-behavior: smooth;
}

.news-list-container::-webkit-scrollbar {
  width: 4px;
}

.news-list-container::-webkit-scrollbar-track {
  background: var(--industrial-bg-page);
}

.news-list-container::-webkit-scrollbar-thumb {
  background: var(--industrial-border-strong);
  border-radius: 2px;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.news-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--industrial-divider);
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
  color: var(--industrial-text-primary);
}
</style>
