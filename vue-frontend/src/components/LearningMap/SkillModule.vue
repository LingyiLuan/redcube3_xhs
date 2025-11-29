<template>
  <div class="skill-module" :class="{ expanded: isExpanded }">
    <!-- Module Header (Always Visible) -->
    <div class="module-header" @click="toggleExpand">
      <div class="header-left">
        <div class="priority-badge" :class="`priority-${module.priority.toLowerCase()}`">
          {{ module.priority }}
        </div>
        <h3 class="module-title">{{ module.module_name }}</h3>
      </div>

      <div class="header-right">
        <div class="metadata">
          <span class="metadata-item">
            <CodeBracketIcon class="metadata-icon-svg" />
            {{ module.total_problems }} problems
          </span>
          <span class="metadata-item">
            <ClockIcon class="metadata-icon-svg" />
            {{ module.estimated_hours }}hrs
          </span>
          <span class="metadata-item">
            <ChartBarIcon class="metadata-icon-svg" />
            {{ module.total_mentions }} mentions
          </span>
        </div>
        <button class="expand-btn" :class="{ rotated: isExpanded }">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Expanded Content -->
    <transition name="expand">
      <div v-if="isExpanded" class="module-body">
        <!-- Context (LLM-generated WHY this module matters) -->
        <p v-if="module.context" class="context">
          {{ module.context }}
        </p>

        <!-- Companies that ask these questions -->
        <div v-if="module.companies && module.companies.length > 0" class="companies-section">
          <h4 class="section-title">
            <BuildingOfficeIcon class="section-icon" />
            Companies Asking These Questions
          </h4>
          <div class="companies-tags">
            <span v-for="company in module.companies.slice(0, 10)" :key="company" class="company-tag">
              {{ company }}
            </span>
          </div>
        </div>

        <!-- Problems List -->
        <div v-if="module.problems && module.problems.length > 0" class="problems-section">
          <h4 class="section-title">
            <ListBulletIcon class="section-icon" />
            Practice Problems ({{ completedCount }}/{{ module.problems.length }} completed)
          </h4>

          <div class="problems-list">
            <ProblemItem
              v-for="problem in module.problems"
              :key="problem.problem_id"
              :problem="problem"
              :completed="isCompleted(problem.problem_id)"
              @toggle="toggleProblem(problem.problem_id)"
              @view-sources="$emit('view-sources', problem.source_post_ids)"
            />
          </div>
        </div>

        <!-- View All Source Posts Button -->
        <button
          v-if="module.source_post_ids && module.source_post_ids.length > 0"
          @click="$emit('view-sources', module.source_post_ids)"
          class="view-sources-btn"
        >
          View {{ module.source_post_ids.length }} Source {{ module.source_post_ids.length === 1 ? 'Post' : 'Posts' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CodeBracketIcon,
  ClockIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ListBulletIcon
} from '@heroicons/vue/24/outline'
import ProblemItem from './ProblemItem.vue'

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

interface SkillModule {
  module_name: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  total_problems: number
  estimated_hours: number
  total_mentions: number
  companies: string[]
  context: string
  problems: Problem[]
  source_post_ids: string[]
}

interface Props {
  module: SkillModule
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'view-sources': [postIds: string[]]
}>()

const isExpanded = ref(false)
const completedProblems = ref<Set<number>>(new Set())

const completedCount = computed(() => completedProblems.value.size)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function isCompleted(problemId: number) {
  return completedProblems.value.has(problemId)
}

function toggleProblem(problemId: number) {
  if (completedProblems.value.has(problemId)) {
    completedProblems.value.delete(problemId)
  } else {
    completedProblems.value.add(problemId)
  }

  // Persist to localStorage
  const storageKey = `skill-module-${props.module.module_name}-problems`
  localStorage.setItem(storageKey, JSON.stringify([...completedProblems.value]))
}

// Load completed problems from localStorage on mount
const storageKey = `skill-module-${props.module.module_name}-problems`
const stored = localStorage.getItem(storageKey)
if (stored) {
  try {
    const indices = JSON.parse(stored) as number[]
    completedProblems.value = new Set(indices)
  } catch (e) {
    console.error('Failed to load problem progress:', e)
  }
}
</script>

<style scoped>
/* === PROFESSIONAL MCKINSEY THEME FOR SKILL MODULES === */

.skill-module {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 12px;
}

.skill-module.expanded {
  border-color: #1E3A5F;
  box-shadow: 0 6px 16px rgba(30, 58, 95, 0.08);
}

/* Header */
.module-header {
  padding: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease;
}

.module-header:hover {
  background-color: #F9FAFB;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.priority-badge {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.03em;
  font-family: 'Inter', -apple-system, sans-serif;
}

.priority-critical {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
}

.priority-high {
  background: #FED7AA;
  color: #9A3412;
  border: 1px solid #FDBA74;
}

.priority-medium {
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #93C5FD;
}

.priority-low {
  background: #E5E7EB;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.module-title {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.metadata {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6B7280;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metadata-icon-svg {
  width: 16px;
  height: 16px;
  color: #6B7280;
  flex-shrink: 0;
}

.expand-btn {
  color: #6B7280;
  transition: transform 0.2s ease, color 0.2s ease;
}

.expand-btn:hover {
  color: #1E3A5F;
}

.expand-btn.rotated {
  transform: rotate(180deg);
}

/* Body */
.module-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 1px solid #E5E7EB;
}

.context {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
  padding-top: 12px;
  background: #F9FAFB;
  padding: 16px;
  border-left: 3px solid #1E3A5F;
  border-radius: 4px;
  margin-top: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E7EB;
  font-family: 'Inter', -apple-system, sans-serif;
  margin-bottom: 12px;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: #1E3A5F;
  flex-shrink: 0;
}

/* Companies */
.companies-section {
  display: flex;
  flex-direction: column;
}

.companies-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.company-tag {
  padding: 6px 12px;
  background: #F3F4F6;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #D1D5DB;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Problems */
.problems-section {
  display: flex;
  flex-direction: column;
}

.problems-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* View Sources Button */
.view-sources-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  background: #1E3A5F;
  color: #FFFFFF;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(30, 58, 95, 0.15);
  margin-top: 8px;
  cursor: pointer;
  font-family: 'Inter', -apple-system, sans-serif;
}

.view-sources-btn:hover {
  background: #2C5282;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(30, 58, 95, 0.25);
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease-out;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
