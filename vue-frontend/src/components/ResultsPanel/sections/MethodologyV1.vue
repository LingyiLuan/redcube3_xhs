<template>
  <section class="methodology-section report-section">
    <h2 class="section-header">METHODOLOGY</h2>

    <div class="methodology-content">
      <!-- Main Explanation -->
      <div class="methodology-explanation">
        <p class="methodology-text">
          Analysis begins with <strong>{{ seedPostCount }} interview experience posts</strong> you submitted.
          Using semantic similarity matching (pgvector embeddings), we identified
          <strong>{{ similarPostCount }} related posts</strong> from r/cscareerquestions discussing comparable companies, roles, and experiences.
        </p>
      </div>

      <!-- Data Sources Breakdown -->
      <div class="stats-container">
        <div class="data-sources-grid">
          <div class="source-stat">
            <div class="stat-value">{{ seedPostCount }}</div>
            <div class="stat-label">Your Posts</div>
          </div>

          <div class="source-stat">
            <div class="stat-value">{{ similarPostCount }}</div>
            <div class="stat-label">Similar Posts (RAG)</div>
          </div>

          <div class="source-stat">
            <div class="stat-value">{{ totalCompanies }}</div>
            <div class="stat-label">Companies</div>
          </div>

          <div class="source-stat">
            <div class="stat-value">{{ totalRoles }}</div>
            <div class="stat-label">Distinct Roles</div>
          </div>

          <div class="source-stat">
            <div class="stat-value">{{ timeRange }}</div>
            <div class="stat-label">Time Range</div>
          </div>
        </div>
      </div>

      <!-- View Source Data Button -->
      <div class="methodology-actions">
        <button @click="handleViewSources" class="view-sources-btn">
          View All {{ totalPosts }} Source Posts
        </button>
      </div>

      <!-- Transparency Note -->
      <div class="transparency-note">
        <p>
          <strong>Data Transparency:</strong> All insights derived from real Reddit posts.
          Click "View Sources" buttons throughout to see original posts.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'

interface Props {
  patterns: any
  individualAnalyses?: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'view-sources': []
}>()

// Log when button is clicked
function handleViewSources() {
  console.log('\n' + '='.repeat(80))
  console.log('[METHODOLOGY V1] 🖱️ View Sources Button Clicked')
  console.log('='.repeat(80))
  console.log('[METHODOLOGY V1] seedPostCount:', seedPostCount.value)
  console.log('[METHODOLOGY V1] similarPostCount:', similarPostCount.value)
  console.log('[METHODOLOGY V1] totalPosts:', totalPosts.value)
  console.log('[METHODOLOGY V1] props.individualAnalyses:', props.individualAnalyses)
  console.log('[METHODOLOGY V1] props.patterns exists:', !!props.patterns)
  console.log('[METHODOLOGY V1] Emitting view-sources event...')
  console.log('='.repeat(80) + '\n')
  emit('view-sources')
}

// Computed values from patterns data
const seedPostCount = computed(() => {
  return props.individualAnalyses?.length || 4
})

const totalPosts = computed(() => {
  // Read from patterns.summary.total_posts_analyzed (same as header)
  return props.patterns.summary?.total_posts_analyzed || seedPostCount.value
})

const similarPostCount = computed(() => {
  return totalPosts.value - seedPostCount.value
})

const totalCompanies = computed(() => {
  // Read from patterns.summary.unique_companies (same as header)
  return props.patterns.summary?.unique_companies ||
         (props.patterns.company_trends?.length || 0)
})

const totalRoles = computed(() => {
  // Read from patterns.summary.unique_roles (same as header)
  return props.patterns.summary?.unique_roles ||
         (props.patterns.role_patterns?.length || 0)
})

const timeRange = computed(() => {
  // Calculate actual date range from source_posts
  const sourcePosts = props.patterns?.source_posts || []

  if (sourcePosts.length === 0) {
    return '2024' // Fallback if no posts
  }

  // Extract all created_at dates from source posts
  const dates = sourcePosts
    .map((post: any) => post.created_at)
    .filter((date: any) => date) // Filter out null/undefined
    .map((dateStr: string) => new Date(dateStr))
    .filter((date: Date) => !isNaN(date.getTime())) // Filter out invalid dates

  if (dates.length === 0) {
    return '2024' // Fallback if no valid dates
  }

  // Find min and max dates
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

  const minYear = minDate.getFullYear()
  const maxYear = maxDate.getFullYear()

  // Return range or single year
  return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`
})
</script>

<style scoped>
/* ===== METHODOLOGY SECTION (COMPRESSED MCKINSEY STYLE) ===== */

.methodology-section {
  background: var(--color-off-white);
  border-top: 2px solid var(--color-navy);
  border-bottom: 2px solid var(--color-border);
}

.methodology-content {
  display: flex;
  flex-direction: column;
  gap: 16px; /* Reduced from 32px */
}

/* Main Explanation */
.methodology-explanation {
  background: var(--color-white);
  padding: 16px 20px; /* Reduced from 24px */
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.methodology-text {
  font-size: 14px; /* Reduced from 15px */
  line-height: 1.6; /* Reduced from 1.8 */
  color: var(--color-slate);
  margin: 0;
}

.methodology-text strong {
  color: var(--color-navy);
  font-weight: 700;
}

/* Stats Container - Breathing Room */
.stats-container {
  padding: 0 32px;  /* Horizontal padding for desktop */
}

/* Data Sources Grid */
.data-sources-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px; /* Reduced from 16px */
}

.source-stat {
  background: var(--color-white);
  padding: 14px 16px; /* Reduced from 20px */
  border-radius: 8px;
  border: 1px solid var(--color-border);
  text-align: center;
  transition: all 0.2s ease;
}

.source-stat:hover {
  border-color: var(--color-navy);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.06);
}

.stat-value {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 28px; /* Reduced from 32px */
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
  margin-bottom: 6px; /* Reduced from 8px */
}

.stat-label {
  font-size: 10px; /* Reduced from 11px */
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-slate);
}

/* Actions */
.methodology-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.view-sources-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px; /* Reduced from 12px 24px */
  background: var(--color-button-primary);
  color: var(--color-white);
  font-size: 13px; /* Reduced from 14px */
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);
  font-family: 'Inter', -apple-system, sans-serif;
}

.view-sources-btn:hover {
  background: var(--color-button-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(15, 23, 42, 0.25);
}

/* Transparency Note */
.transparency-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px; /* Reduced from 16px 20px */
  background: var(--color-off-white);
  border: 1px solid var(--color-light-gray);
  border-radius: 6px;
}

.transparency-note p {
  font-size: 12px; /* Reduced from 13px */
  color: var(--color-charcoal);
  margin: 0;
  line-height: 1.5; /* Reduced from 1.6 */
}

.transparency-note strong {
  color: var(--color-navy);
  font-weight: 700;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-container {
    padding: 0 24px;  /* Reduce padding on tablets */
  }

  .data-sources-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-container {
    padding: 0 16px;  /* Reduce padding on mobile */
  }

  .data-sources-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
