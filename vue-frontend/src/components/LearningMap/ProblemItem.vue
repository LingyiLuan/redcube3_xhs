<template>
  <div class="problem-item" :class="{ completed }">
    <div class="problem-checkbox-wrapper">
      <input
        type="checkbox"
        :id="`problem-${problem.problem_id}`"
        :checked="completed"
        @change="$emit('toggle')"
        class="problem-checkbox"
      />
    </div>

    <div class="problem-content">
      <div class="problem-header">
        <label :for="`problem-${problem.problem_id}`" class="problem-name">
          <span v-if="problem.problem_number" class="problem-number">#{{ problem.problem_number }}</span>
          {{ problem.problem_name }}
        </label>
        <div class="problem-meta">
          <span class="difficulty-badge" :class="`difficulty-${problem.difficulty.toLowerCase()}`">
            {{ problem.difficulty }}
          </span>
          <span class="time-estimate">
            <ClockIcon class="time-icon" />
            {{ problem.estimated_time_hours }}hrs
          </span>
        </div>
      </div>

      <div class="problem-footer">
        <button
          v-if="problem.source_post_ids && problem.source_post_ids.length > 0"
          @click="$emit('view-sources', problem.source_post_ids)"
          class="source-link"
        >
          <DocumentTextIcon class="source-icon" />
          Asked in {{ problem.frequency }} {{ problem.frequency === 1 ? 'post' : 'posts' }}
        </button>

        <a
          v-if="problem.problem_url"
          :href="problem.problem_url"
          target="_blank"
          rel="noopener noreferrer"
          class="leetcode-link"
        >
          <CodeBracketIcon class="leetcode-icon" />
          View on LeetCode
          <svg class="external-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ClockIcon, DocumentTextIcon, CodeBracketIcon } from '@heroicons/vue/24/outline'

interface Problem {
  problem_id: number
  problem_name: string
  problem_number?: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category?: string
  problem_url?: string
  frequency: number
  mentioned_in_posts: number
  source_post_ids: string[]
  companies?: string[]
  priority: string
  estimated_time_hours: number
}

interface Props {
  problem: Problem
  completed: boolean
}

defineProps<Props>()
defineEmits<{
  toggle: []
  'view-sources': [postIds: string[]]
}>()
</script>

<style scoped>
/* === PROFESSIONAL MCKINSEY THEME FOR PROBLEM ITEMS === */

.problem-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
  background: #FFFFFF;
  transition: all 0.15s ease;
}

.problem-item:hover {
  border-color: #1E3A5F;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
}

.problem-item.completed {
  background: #F9FAFB;
  opacity: 0.7;
}

.problem-item.completed .problem-name {
  text-decoration: line-through;
  color: #6B7280;
}

.problem-checkbox-wrapper {
  flex-shrink: 0;
  padding-top: 2px;
}

.problem-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #D1D5DB;
  background: #FFFFFF;
  cursor: pointer;
  appearance: none;
  transition: all 0.15s ease;
}

.problem-checkbox:checked {
  background: #1E3A5F;
  border-color: #1E3A5F;
}

.problem-checkbox:checked::after {
  content: '✓';
  display: block;
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 14px;
}

.problem-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.problem-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.problem-name {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  font-family: 'Inter', -apple-system, sans-serif;
}

.problem-number {
  color: #6B7280;
  font-weight: 400;
  margin-right: 4px;
}

.problem-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.difficulty-badge {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  letter-spacing: 0.02em;
  font-family: 'Inter', -apple-system, sans-serif;
}

.difficulty-easy {
  background: #D1FAE5;
  color: #065F46;
  border: 1px solid #6EE7B7;
}

.difficulty-medium {
  background: #FED7AA;
  color: #9A3412;
  border: 1px solid #FDBA74;
}

.difficulty-hard {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
}

.time-estimate {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.time-icon {
  width: 14px;
  height: 14px;
}

.problem-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1E40AF;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  font-family: 'Inter', -apple-system, sans-serif;
  padding: 0;
}

.source-link:hover {
  color: #2563EB;
}

.source-icon {
  width: 14px;
  height: 14px;
}

.leetcode-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #059669;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
  font-family: 'Inter', -apple-system, sans-serif;
}

.leetcode-link:hover {
  color: #10B981;
}

.leetcode-icon {
  width: 14px;
  height: 14px;
}

.external-icon {
  display: inline-block;
  opacity: 0.6;
  margin-left: 2px;
}
</style>
