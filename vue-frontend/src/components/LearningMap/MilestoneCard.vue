<template>
  <div class="milestone-card" :class="{ expanded: isExpanded }">
    <!-- Card Header (Always Visible) -->
    <div class="milestone-header" @click="toggleExpand">
      <div class="header-left">
        <div class="week-badge">Week {{ milestone.week }}</div>
        <h3 class="milestone-title">{{ milestone.title }}</h3>
      </div>

      <div class="header-right">
        <div class="metadata">
          <span class="metadata-item">
            <DocumentTextIcon class="metadata-icon-svg" />
            {{ postCount }} posts
          </span>
          <span class="metadata-item">
            <BookOpenIcon class="metadata-icon-svg" />
            {{ resourceCount }} resources
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
      <div v-if="isExpanded" class="milestone-body">
        <!-- Description -->
        <p v-if="milestone.description" class="description">
          {{ milestone.description }}
        </p>

        <!-- Real Examples Section -->
        <div v-if="milestone.real_examples && milestone.real_examples.length > 0" class="section">
          <h4 class="section-title">
            <LightBulbIcon class="section-icon" />
            Real Examples from Candidates
          </h4>
          <ul class="examples-list">
            <li v-for="(example, index) in milestone.real_examples" :key="index" class="example-item">
              {{ example }}
            </li>
          </ul>
        </div>

        <!-- Skills Section -->
        <div v-if="milestone.skills && milestone.skills.length > 0" class="section">
          <h4 class="section-title">
            <AcademicCapIcon class="section-icon" />
            Skills to Focus On
          </h4>
          <div class="skills-tags">
            <span v-for="skill in milestone.skills" :key="skill" class="skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- Tasks Section -->
        <div v-if="milestone.tasks && milestone.tasks.length > 0" class="section">
          <h4 class="section-title">
            <CheckCircleIcon class="section-icon" />
            Action Items
          </h4>
          <ul class="tasks-list">
            <li v-for="(task, index) in milestone.tasks" :key="index" class="task-item">
              <input
                type="checkbox"
                :id="`task-${milestone.week}-${index}`"
                :checked="isTaskCompleted(index)"
                @change="toggleTask(index)"
                class="task-checkbox"
              />
              <label :for="`task-${milestone.week}-${index}`" class="task-label">
                {{ task }}
              </label>
            </li>
          </ul>
        </div>

        <!-- Resources Section -->
        <div v-if="milestone.resources && milestone.resources.length > 0" class="section">
          <h4 class="section-title">
            <BookOpenIcon class="section-icon" />
            Recommended Resources
          </h4>
          <ul class="resources-list">
            <li v-for="(resource, index) in milestone.resources" :key="index" class="resource-item">
              <a
                v-if="typeof resource === 'string'"
                :href="getResourceUrl(resource)"
                target="_blank"
                rel="noopener noreferrer"
                class="resource-link"
              >
                {{ resource }}
                <svg class="external-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
              <div v-else class="resource-detailed">
                <a
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="resource-link"
                >
                  {{ resource.title }}
                  <svg class="external-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
                <span v-if="resource.mentionedBy" class="mention-count">
                  Mentioned by {{ resource.mentionedBy }} candidates
                </span>
              </div>
            </li>
          </ul>
        </div>

        <!-- View Source Posts Button -->
        <button
          v-if="sourcePostIds && sourcePostIds.length > 0"
          @click="$emit('view-sources', sourcePostIds)"
          class="view-sources-btn"
        >
          View {{ sourcePostIds.length }} Source {{ sourcePostIds.length === 1 ? 'Post' : 'Posts' }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DocumentTextIcon,
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

interface Milestone {
  week: number
  title: string
  description?: string
  skills?: string[]
  tasks?: string[]
  resources?: (string | { title: string; url: string; mentionedBy?: number })[]
  real_examples?: string[]
  sourcePostIds?: string[]
}

interface Props {
  milestone: Milestone
  sourcePostIds?: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'view-sources': [postIds: string[]]
}>()

const isExpanded = ref(false)
const completedTasks = ref<Set<number>>(new Set())

const postCount = computed(() => props.sourcePostIds?.length || 0)
const resourceCount = computed(() => props.milestone.resources?.length || 0)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function isTaskCompleted(index: number) {
  return completedTasks.value.has(index)
}

function toggleTask(index: number) {
  if (completedTasks.value.has(index)) {
    completedTasks.value.delete(index)
  } else {
    completedTasks.value.add(index)
  }

  // Persist to localStorage
  const storageKey = `milestone-${props.milestone.week}-tasks`
  localStorage.setItem(storageKey, JSON.stringify([...completedTasks.value]))
}

function getResourceUrl(resource: string): string {
  // Simple heuristic: if it contains a URL pattern, return as-is
  if (resource.includes('http://') || resource.includes('https://')) {
    return resource
  }
  // Otherwise, search for it
  return `https://www.google.com/search?q=${encodeURIComponent(resource)}`
}

// Load completed tasks from localStorage on mount
const storageKey = `milestone-${props.milestone.week}-tasks`
const stored = localStorage.getItem(storageKey)
if (stored) {
  try {
    const indices = JSON.parse(stored) as number[]
    completedTasks.value = new Set(indices)
  } catch (e) {
    console.error('Failed to load task progress:', e)
  }
}
</script>

<style scoped>
/* === PROFESSIONAL MCKINSEY THEME FOR MILESTONE CARDS === */

.milestone-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.milestone-card.expanded {
  border-color: #1E3A5F;
  box-shadow: 0 6px 16px rgba(30, 58, 95, 0.08);
}

/* Header */
.milestone-header {
  padding: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease;
}

.milestone-header:hover {
  background-color: #F9FAFB;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.week-badge {
  padding: 6px 12px;
  background: #1E3A5F;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  letter-spacing: 0.03em;
  font-family: 'Inter', -apple-system, sans-serif;
}

.milestone-title {
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

.metadata-icon {
  font-size: 14px;
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
.milestone-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 1px solid #E5E7EB;
}

.description {
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
  padding-top: 12px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}

.section-icon {
  width: 18px;
  height: 18px;
  color: #1E3A5F;
  flex-shrink: 0;
}

/* Examples */
.examples-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 20px;
}

.example-item {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  list-style: disc;
}

/* Skills */
.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  padding: 6px 12px;
  background: #DBEAFE;
  color: #1E40AF;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #93C5FD;
  font-family: 'Inter', -apple-system, sans-serif;
}

/* Tasks */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.task-checkbox {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #D1D5DB;
  background: #FFFFFF;
  cursor: pointer;
  appearance: none;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.task-checkbox:checked {
  background: #1E3A5F;
  border-color: #1E3A5F;
}

.task-checkbox:checked::after {
  content: '✓';
  display: block;
  color: white;
  font-size: 12px;
  text-align: center;
  line-height: 14px;
}

.task-label {
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  flex: 1;
  line-height: 1.6;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-item {
  font-size: 14px;
}

.resource-link {
  color: #1E40AF;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: underline;
  text-decoration-style: solid;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.resource-link:hover {
  color: #2563EB;
}

.external-icon {
  display: inline-block;
  opacity: 0.6;
}

.resource-detailed {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mention-count {
  font-size: 12px;
  color: #6B7280;
  font-style: italic;
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
