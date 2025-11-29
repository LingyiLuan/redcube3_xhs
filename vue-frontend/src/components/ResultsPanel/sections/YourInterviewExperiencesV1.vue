<template>
  <section class="report-section your-experiences">
    <h2 class="section-title">Your Interview Experiences</h2>
    <p class="section-subtitle">{{ userPosts.length }} posts analyzed from your recent interviews</p>

    <!-- Compact Table -->
    <table class="your-posts-table">
      <thead>
        <tr>
          <th class="col-company">Company</th>
          <th class="col-role">Role</th>
          <th class="col-date">Date</th>
          <th class="col-outcome">Outcome</th>
          <th class="col-topics">Key Topics</th>
          <th class="col-view">View</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in userPosts" :key="post.id" :class="'outcome-row-' + post.outcome">
          <td class="company-cell">{{ post.company }}</td>
          <td class="role-cell">{{ post.role }}</td>
          <td class="date-cell">{{ formatDate(post.date) }}</td>
          <td class="outcome-cell">{{ post.outcomeText }}</td>
          <td class="topics-cell">{{ post.skills.slice(0, 3).join(', ') }}</td>
          <td class="view-cell">
            <button class="view-link" @click="openPostModal(post)">View</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Minimal Analysis Scope -->
    <div class="analysis-scope-compact">
      <span class="scope-label">SCOPE:</span>
      <span class="scope-text">
        {{ userCompaniesFromPosts.length }} companies ({{ userCompaniesFromPosts.join(', ') }})
        · {{ userRolesFromPosts.length }} roles
        · {{ totalUserSkills }} skills
        · Benchmarked against {{ benchmarkPostsCount }} similar posts
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { formatDate } from '@/composables/useReportFormatters'

interface Props {
  individualAnalyses?: any[]
  patterns: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openPostModal: [post: any]
}>()

/**
 * Extract user's uploaded posts from backend individual_analyses
 */
const userPosts = computed(() => {
  if (!props.individualAnalyses || props.individualAnalyses.length === 0) {
    console.warn('⚠️ [Your Interview Experiences] No individual_analyses data available')
    return []
  }

  console.log('✅ [Your Interview Experiences] Processing', props.individualAnalyses.length, 'user posts')

  // Transform backend individual_analyses to frontend format
  return props.individualAnalyses.map((analysis, index) => {
    // Extract skills from tech_stack and frameworks
    const skills = []
    if (Array.isArray(analysis.tech_stack)) {
      skills.push(...analysis.tech_stack)
    }
    if (Array.isArray(analysis.frameworks)) {
      skills.push(...analysis.frameworks)
    }

    // Map outcome to display text
    const outcomeMap: Record<string, string> = {
      'passed': 'Offer Received',
      'failed': 'Rejected',
      'pending': 'Pending Decision',
      'unknown': 'Status Unknown'
    }

    return {
      id: analysis.id || index + 1,
      company: analysis.company || 'Unknown',
      role: analysis.role || 'Not specified',
      outcome: analysis.outcome || 'unknown',
      outcomeText: outcomeMap[analysis.outcome] || 'Status Unknown',
      date: analysis.createdAt ? new Date(analysis.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      skills: skills.length > 0 ? skills.slice(0, 5) : ['Not specified'],
      stages: [] // Not available in current backend structure
    }
  })
})

/**
 * Extract unique companies from user posts
 */
const userCompaniesFromPosts = computed(() => {
  return [...new Set(userPosts.value.map(p => p.company))]
})

/**
 * Extract unique roles from user posts
 */
const userRolesFromPosts = computed(() => {
  return [...new Set(userPosts.value.map(p => p.role))]
})

/**
 * Count total unique skills across all user posts
 */
const totalUserSkills = computed(() => {
  const allSkills = userPosts.value.flatMap(p => p.skills || [])
  return [...new Set(allSkills)].length
})

/**
 * Get total posts count for benchmarking
 */
const benchmarkPostsCount = computed(() => {
  return props.patterns.summary?.total_posts_analyzed || 0
})

/**
 * Open modal to view individual post details
 */
function openPostModal(post: any) {
  const enrichedPost = {
    ...post,
    originalText: props.individualAnalyses?.find(a => a.company === post.company)?.original_text || 'Post content not available',
    url: props.individualAnalyses?.find(a => a.company === post.company)?.url || undefined
  }
  emit('openPostModal', enrichedPost)
}
</script>

<style scoped>
/* Your Interview Experiences Section */
.your-experiences {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

/* Table Styles */
.your-posts-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
}

.your-posts-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #E5E7EB;
  background: #F9FAFB;
}

.your-posts-table tbody tr {
  border-bottom: 1px solid #E5E7EB;
  transition: background-color 0.15s ease;
  border-left: 3px solid transparent;
}

.your-posts-table tbody tr:hover {
  background: #F9FAFB;
}

/* Outcome row color coding */
.outcome-row-success {
  border-left-color: #1E3A8A;
}

.outcome-row-rejected {
  border-left-color: #60A5FA;
}

.outcome-row-pending {
  border-left-color: #3B82F6;
}

.your-posts-table tbody td {
  padding: 14px 16px;
  color: #374151;
}

/* Table Cell Styles */
.company-cell {
  font-weight: 600;
  color: #111827;
  width: 15%;
}

.role-cell {
  width: 28%;
  color: #374151;
}

.date-cell {
  width: 12%;
  color: #6B7280;
  font-size: 13px;
}

.outcome-cell {
  width: 15%;
  font-weight: 500;
}

.outcome-row-success .outcome-cell {
  color: #1E3A8A;
}

.outcome-row-rejected .outcome-cell {
  color: #60A5FA;
}

.outcome-row-pending .outcome-cell {
  color: #3B82F6;
}

.topics-cell {
  width: 25%;
  font-size: 13px;
  color: #6B7280;
}

.view-cell {
  width: 5%;
  text-align: center;
}

.view-link {
  background: transparent;
  border: none;
  color: #2563EB;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  text-decoration: underline;
  transition: color 0.15s ease;
}

.view-link:hover {
  color: #1D4ED8;
}

/* Analysis Scope */
.analysis-scope-compact {
  background: #F9FAFB;
  border-left: 3px solid #2563EB;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.scope-label {
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
  margin-right: 8px;
}

.scope-text {
  color: #6B7280;
}

/* Responsive Design */
@media (max-width: 768px) {
  .your-experiences {
    padding: 16px;
  }

  .your-posts-table {
    font-size: 12px;
  }

  .your-posts-table thead th,
  .your-posts-table tbody td {
    padding: 10px 12px;
  }

  .topics-cell {
    display: none;
  }
}
</style>
