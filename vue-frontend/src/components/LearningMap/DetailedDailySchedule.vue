<script setup lang="ts">
import { ref, computed } from 'vue'
import { Clock, Coffee, BookOpen, Code, Target, Brain, PenLine, Lightbulb, UtensilsCrossed, FileText, ChevronDown, ChevronRight, ExternalLink, AlertCircle, Sparkles, Link2, Info } from 'lucide-vue-next'

interface TimeSlot {
  time: string
  duration: number
  type: string
  typeIcon: string
  typeLabel: string
  activity: string
  details: string
  problem: {
    name: string
    number: number
    difficulty: string
    url: string
  } | null
  // LLM-enhanced fields
  why_it_matters?: string | null
  patterns_taught?: string[]
  common_mistakes?: string[]
  related_problems?: number[]
  enhanced_details?: string
  before_you_start?: string | null
  success_criteria?: string | null
}

interface PatternConnection {
  pattern: string
  problems: number[]
  explanation: string
}

interface PersonalizedTip {
  tip: string
  reason: string
}

interface DailySchedule {
  weekNumber: number
  dayOfWeek: string
  date: string | null
  totalMinutes: number
  availableHours: number
  focusArea: string
  isRestDay: boolean
  isLightDay?: boolean
  slots: TimeSlot[]
  summary: {
    problemsSolved: number
    learnTime: number
    practiceTime: number
    breakTime: number
  }
  // LLM-enhanced fields
  llm_enhanced?: boolean
  learning_objectives?: string[]
  pattern_connections?: PatternConnection[]
  personalized_tips?: PersonalizedTip[]
}

interface Props {
  schedule: DailySchedule
  compact?: boolean
  showEnhancements?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  showEnhancements: true
})

// Track which slots have expanded insights
const expandedInsights = ref<Set<number>>(new Set())

const isExpanded = ref(!props.compact)

const activityIcons: Record<string, any> = {
  WARMUP: Brain,
  LEARN: BookOpen,
  GUIDED: Code,
  SOLO: Code,
  MOCK: Target,
  REFLECT: PenLine,
  BREAK: Coffee,
  LUNCH: UtensilsCrossed,
  REVIEW: FileText,
  CONNECT: Lightbulb
}

const difficultyColors: Record<string, string> = {
  Easy: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  Medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
  Hard: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
}

const typeColors: Record<string, string> = {
  WARMUP: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  LEARN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  GUIDED: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  SOLO: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  MOCK: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  REFLECT: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  BREAK: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  LUNCH: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  REVIEW: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  CONNECT: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
}

const formattedDate = computed(() => {
  if (!props.schedule.date) return ''
  return new Date(props.schedule.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
})

const practiceSlots = computed(() =>
  props.schedule.slots.filter(s => ['GUIDED', 'SOLO', 'MOCK'].includes(s.type))
)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function getIcon(type: string) {
  return activityIcons[type] || Clock
}

function formatDuration(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${minutes}m`
}

function toggleInsight(idx: number) {
  if (expandedInsights.value.has(idx)) {
    expandedInsights.value.delete(idx)
  } else {
    expandedInsights.value.add(idx)
  }
}

function hasEnhancements(slot: TimeSlot): boolean {
  return !!(slot.why_it_matters || slot.patterns_taught?.length || slot.before_you_start)
}

// Check if schedule has any LLM enhancements
const hasLLMEnhancements = computed(() => {
  return props.schedule.llm_enhanced ||
    props.schedule.learning_objectives?.length ||
    props.schedule.personalized_tips?.length
})
</script>

<template>
  <div
    class="detailed-schedule-card"
    :class="{
      'rest-day': schedule.isRestDay,
      'light-day': schedule.isLightDay,
      'compact': compact
    }"
  >
    <!-- Day Header -->
    <div class="day-header" @click="toggleExpand">
      <div class="day-info">
        <div class="day-title">
          <component :is="isExpanded ? ChevronDown : ChevronRight" :size="16" class="expand-icon" />
          <span class="day-name">{{ schedule.dayOfWeek }}</span>
          <span v-if="formattedDate" class="day-date">{{ formattedDate }}</span>
        </div>
        <span class="focus-area">{{ schedule.focusArea }}</span>
      </div>

      <div class="day-meta">
        <span class="hours-badge">
          <Clock :size="14" />
          {{ schedule.availableHours }}h
        </span>
        <span v-if="!schedule.isRestDay" class="problems-badge">
          {{ schedule.summary.problemsSolved }} problems
        </span>
      </div>
    </div>

    <!-- Expanded Schedule Content -->
    <transition name="expand">
      <div v-if="isExpanded" class="schedule-content">
        <!-- Learning Objectives (LLM Enhanced) -->
        <div v-if="showEnhancements && schedule.learning_objectives?.length" class="learning-objectives">
          <div class="objectives-header">
            <Sparkles :size="14" class="text-amber-500" />
            <span>Today's Learning Objectives</span>
          </div>
          <ul class="objectives-list">
            <li v-for="(objective, idx) in schedule.learning_objectives" :key="idx">
              {{ objective }}
            </li>
          </ul>
        </div>

        <!-- Quick Summary Bar -->
        <div v-if="!schedule.isRestDay" class="summary-bar">
          <div class="summary-item">
            <BookOpen :size="14" />
            <span>{{ formatDuration(schedule.summary.learnTime) }} learning</span>
          </div>
          <div class="summary-item">
            <Code :size="14" />
            <span>{{ formatDuration(schedule.summary.practiceTime) }} practice</span>
          </div>
          <div class="summary-item">
            <Coffee :size="14" />
            <span>{{ formatDuration(schedule.summary.breakTime) }} breaks</span>
          </div>
          <div v-if="hasLLMEnhancements" class="summary-item enhanced-badge">
            <Sparkles :size="12" />
            <span>AI Enhanced</span>
          </div>
        </div>

        <!-- Time Slots Table -->
        <div class="time-slots">
          <div
            v-for="(slot, idx) in schedule.slots"
            :key="idx"
            class="time-slot"
            :class="{
              'is-break': ['BREAK', 'LUNCH'].includes(slot.type),
              'has-problem': slot.problem,
              'has-insights': hasEnhancements(slot)
            }"
          >
            <!-- Time Column -->
            <div class="slot-time">
              <span class="time-value">{{ slot.time }}</span>
              <span class="duration">{{ slot.duration }}m</span>
            </div>

            <!-- Type Badge -->
            <div class="slot-type" :class="typeColors[slot.type]">
              <component :is="getIcon(slot.type)" :size="14" />
              <span>{{ slot.typeLabel }}</span>
            </div>

            <!-- Activity Details -->
            <div class="slot-content">
              <div class="activity-name">
                {{ slot.activity }}
                <a
                  v-if="slot.problem?.url"
                  :href="slot.problem.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="problem-link"
                >
                  <ExternalLink :size="12" />
                </a>
                <!-- Insight toggle button -->
                <button
                  v-if="showEnhancements && hasEnhancements(slot)"
                  class="insight-toggle"
                  @click.stop="toggleInsight(idx)"
                  :title="expandedInsights.has(idx) ? 'Hide insights' : 'Show insights'"
                >
                  <Info :size="14" />
                </button>
              </div>
              <div class="activity-details">{{ slot.enhanced_details || slot.details }}</div>

              <!-- Problem Badge -->
              <div v-if="slot.problem" class="problem-badge">
                <span class="problem-number">LC #{{ slot.problem.number }}</span>
                <span
                  class="problem-difficulty"
                  :class="difficultyColors[slot.problem.difficulty]"
                >
                  {{ slot.problem.difficulty }}
                </span>
              </div>

              <!-- LLM Enhanced Insights (expandable) -->
              <transition name="fade">
                <div v-if="showEnhancements && expandedInsights.has(idx) && hasEnhancements(slot)" class="slot-insights">
                  <!-- Why It Matters -->
                  <div v-if="slot.why_it_matters" class="insight-section why-matters">
                    <div class="insight-label">
                      <Lightbulb :size="12" />
                      Why it matters
                    </div>
                    <p>{{ slot.why_it_matters }}</p>
                  </div>

                  <!-- Before You Start -->
                  <div v-if="slot.before_you_start" class="insight-section before-start">
                    <div class="insight-label">
                      <AlertCircle :size="12" />
                      Before you start
                    </div>
                    <p>{{ slot.before_you_start }}</p>
                  </div>

                  <!-- Patterns Taught -->
                  <div v-if="slot.patterns_taught?.length" class="insight-section patterns">
                    <div class="insight-label">
                      <Link2 :size="12" />
                      Patterns you'll learn
                    </div>
                    <div class="pattern-tags">
                      <span v-for="pattern in slot.patterns_taught" :key="pattern" class="pattern-tag">
                        {{ pattern }}
                      </span>
                    </div>
                  </div>

                  <!-- Common Mistakes -->
                  <div v-if="slot.common_mistakes?.length" class="insight-section mistakes">
                    <div class="insight-label">
                      <AlertCircle :size="12" />
                      Watch out for
                    </div>
                    <ul class="mistakes-list">
                      <li v-for="mistake in slot.common_mistakes" :key="mistake">{{ mistake }}</li>
                    </ul>
                  </div>

                  <!-- Success Criteria -->
                  <div v-if="slot.success_criteria" class="insight-section success">
                    <div class="insight-label">
                      <Target :size="12" />
                      Success criteria
                    </div>
                    <p>{{ slot.success_criteria }}</p>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <!-- Personalized Tips (LLM Enhanced) -->
        <div v-if="showEnhancements && schedule.personalized_tips?.length" class="personalized-tips">
          <div class="tips-header">
            <Sparkles :size="14" class="text-purple-500" />
            <span>Pro Tips for Today</span>
          </div>
          <div class="tips-list">
            <div v-for="(tip, idx) in schedule.personalized_tips" :key="idx" class="tip-card">
              <div class="tip-content">{{ tip.tip }}</div>
              <div class="tip-reason">{{ tip.reason }}</div>
            </div>
          </div>
        </div>

        <!-- Pattern Connections (LLM Enhanced) -->
        <div v-if="showEnhancements && schedule.pattern_connections?.length" class="pattern-connections">
          <div class="connections-header">
            <Link2 :size="14" class="text-blue-500" />
            <span>How Problems Connect</span>
          </div>
          <div class="connections-list">
            <div v-for="(connection, idx) in schedule.pattern_connections" :key="idx" class="connection-card">
              <div class="connection-pattern">{{ connection.pattern }}</div>
              <div class="connection-explanation">{{ connection.explanation }}</div>
              <div class="connection-problems">
                Problems: {{ connection.problems.map(p => `#${p}`).join(', ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Problems Quick Reference (collapsed view) -->
        <div v-if="practiceSlots.length > 0 && compact" class="problems-quick-ref">
          <h5 class="quick-ref-title">Today's Problems:</h5>
          <div class="problems-list">
            <template v-for="(slot, idx) in practiceSlots" :key="idx">
              <div v-if="slot.problem" class="problem-item">
                <span class="problem-num">LC #{{ slot.problem.number }}</span>
                <span class="problem-name">{{ slot.problem.name }}</span>
                <span
                  class="problem-diff"
                  :class="difficultyColors[slot.problem.difficulty]"
                >
                  {{ slot.problem.difficulty }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.detailed-schedule-card {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.detailed-schedule-card.rest-day {
  @apply bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800;
}

.detailed-schedule-card.light-day {
  @apply bg-amber-50/30 dark:bg-amber-900/10;
}

/* Day Header */
.day-header {
  @apply flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors;
}

.day-info {
  @apply flex flex-col gap-1;
}

.day-title {
  @apply flex items-center gap-2;
}

.expand-icon {
  @apply text-gray-400 dark:text-gray-500;
}

.day-name {
  @apply font-semibold text-gray-900 dark:text-gray-100;
}

.day-date {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.focus-area {
  @apply text-sm text-gray-600 dark:text-gray-400 pl-6;
}

.day-meta {
  @apply flex items-center gap-3;
}

.hours-badge, .problems-badge {
  @apply flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full;
}

.hours-badge {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300;
}

.problems-badge {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300;
}

/* Schedule Content */
.schedule-content {
  @apply border-t border-gray-200 dark:border-gray-700;
}

/* Summary Bar */
.summary-bar {
  @apply flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700;
}

.summary-item {
  @apply flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400;
}

/* Time Slots */
.time-slots {
  @apply divide-y divide-gray-100 dark:divide-gray-800;
}

.time-slot {
  @apply flex items-start gap-3 p-3;
}

.time-slot.is-break {
  @apply bg-gray-50 dark:bg-gray-900/30 py-2;
}

.time-slot.has-problem {
  @apply bg-blue-50/30 dark:bg-blue-900/10;
}

.slot-time {
  @apply flex flex-col items-end min-w-[60px];
}

.time-value {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
}

.duration {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.slot-type {
  @apply flex items-center gap-1 px-2 py-1 rounded text-xs font-medium min-w-[80px];
}

.slot-content {
  @apply flex-1 min-w-0;
}

.activity-name {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2;
}

.problem-link {
  @apply text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300;
}

.activity-details {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-0.5;
}

.problem-badge {
  @apply flex items-center gap-2 mt-1.5;
}

.problem-number {
  @apply text-xs font-mono text-gray-700 dark:text-gray-300;
}

.problem-difficulty {
  @apply text-xs px-1.5 py-0.5 rounded font-medium;
}

/* Quick Reference */
.problems-quick-ref {
  @apply p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700;
}

.quick-ref-title {
  @apply text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide;
}

.problems-list {
  @apply space-y-1;
}

.problem-item {
  @apply flex items-center gap-2 text-sm;
}

.problem-num {
  @apply font-mono text-xs text-gray-600 dark:text-gray-400;
}

.problem-name {
  @apply flex-1 text-gray-900 dark:text-gray-100;
}

.problem-diff {
  @apply text-xs px-1.5 py-0.5 rounded;
}

/* Learning Objectives */
.learning-objectives {
  @apply p-3 bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/30;
}

.objectives-header {
  @apply flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-2;
}

.objectives-list {
  @apply list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200 pl-1;
}

/* Enhanced Badge */
.enhanced-badge {
  @apply bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300;
}

/* Slot with insights indicator */
.time-slot.has-insights {
  @apply border-l-2 border-l-blue-400 dark:border-l-blue-500;
}

/* Insight Toggle Button */
.insight-toggle {
  @apply p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 dark:text-blue-400 transition-colors;
}

/* Slot Insights Panel */
.slot-insights {
  @apply mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 space-y-3;
}

.insight-section {
  @apply space-y-1;
}

.insight-label {
  @apply flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400;
}

.insight-section p {
  @apply text-sm text-gray-700 dark:text-gray-300 leading-relaxed;
}

.insight-section.why-matters .insight-label {
  @apply text-amber-600 dark:text-amber-400;
}

.insight-section.before-start .insight-label {
  @apply text-orange-600 dark:text-orange-400;
}

.insight-section.patterns .insight-label {
  @apply text-blue-600 dark:text-blue-400;
}

.insight-section.mistakes .insight-label {
  @apply text-red-600 dark:text-red-400;
}

.insight-section.success .insight-label {
  @apply text-green-600 dark:text-green-400;
}

/* Pattern Tags */
.pattern-tags {
  @apply flex flex-wrap gap-1.5;
}

.pattern-tag {
  @apply text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full;
}

/* Mistakes List */
.mistakes-list {
  @apply list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-0.5;
}

/* Personalized Tips */
.personalized-tips {
  @apply p-3 bg-purple-50/50 dark:bg-purple-900/10 border-t border-purple-200 dark:border-purple-800/30;
}

.tips-header {
  @apply flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 mb-2;
}

.tips-list {
  @apply space-y-2;
}

.tip-card {
  @apply p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-800/50;
}

.tip-content {
  @apply text-sm font-medium text-gray-800 dark:text-gray-200;
}

.tip-reason {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-1 italic;
}

/* Pattern Connections */
.pattern-connections {
  @apply p-3 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-200 dark:border-blue-800/30;
}

.connections-header {
  @apply flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2;
}

.connections-list {
  @apply space-y-2;
}

.connection-card {
  @apply p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800/50;
}

.connection-pattern {
  @apply text-sm font-semibold text-blue-700 dark:text-blue-300;
}

.connection-explanation {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

.connection-problems {
  @apply text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono;
}

/* Fade Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Expand Animation */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
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
