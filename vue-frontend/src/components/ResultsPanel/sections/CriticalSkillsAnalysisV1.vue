<template>
  <section class="report-section critical-skills-analysis">
    <h2 class="section-title">Critical Skills Analysis</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="insight-text">
        {{ getCriticalSkillsNarrative() }}
      </p>
    </div>

    <!-- NEW: Skills Prioritization Framework (Compact Single Table) -->
    <div v-if="skillsData.length > 0" class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">Skills Prioritization Framework</h3>
        <DataSourceBadge type="personalized" />
      </div>
      <p class="chart-subtitle">{{ skillsData.length }} skills analyzed • Sorted by frequency and difficulty</p>

      <div class="compact-skills-table">
        <table class="skills-priority-table">
          <thead>
            <tr>
              <th class="col-skill-header">Skill</th>
              <th class="col-priority-header">Priority</th>
              <th class="col-mentions-header">Mentions</th>
              <th class="col-difficulty-header">Difficulty</th>
              <th class="col-coverage-header">Coverage</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(skill, index) in skillsData"
              :key="index"
              :class="`priority-${skill.priority}`"
            >
              <td>{{ skill.name }}</td>
              <td>
                <span class="priority-badge" :class="`badge-${skill.priority}`">
                  {{ getPriorityLabel(skill.priority) }}
                </span>
              </td>
              <td>{{ skill.frequency }}</td>
              <td>
                <span class="difficulty-compact">{{ getDifficultyLabel(skill.difficulty) }}</span>
              </td>
              <td>{{ skill.percentage }}%</td>
            </tr>
          </tbody>
        </table>

        <!-- Legend -->
        <div class="priority-legend">
          <span class="legend-item">
            <span class="legend-badge badge-critical">Critical</span> Master first (10+ mentions, medium+ difficulty)
          </span>
          <span class="legend-divider">•</span>
          <span class="legend-item">
            <span class="legend-badge badge-high">High</span> Build proficiency (5+ mentions or hard difficulty)
          </span>
          <span class="legend-divider">•</span>
          <span class="legend-item">
            <span class="legend-badge badge-medium">Baseline</span> Maintain competency
          </span>
        </div>
      </div>
    </div>

    <!-- Component 1: Skill Correlation Heatmap (10x10) - Conditional -->
    <div v-if="hasCorrelationData" class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">Skill Correlation Matrix</h3>
        <DataSourceBadge type="personalized" />
      </div>
      <p class="chart-subtitle">Top 10 skills frequently appearing together (correlation strength 0-100%)</p>

      <div class="heatmap-container-small">
        <table class="correlation-heatmap">
          <thead>
            <tr>
              <th></th>
              <th v-for="skill in topSkillsForHeatmap" :key="skill">{{ skill }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="skillA in topSkillsForHeatmap" :key="skillA">
              <th>{{ skillA }}</th>
              <td v-for="skillB in topSkillsForHeatmap" :key="skillB"
                  :class="getCorrelationClass(skillA, skillB)"
                  :title="`${skillA} + ${skillB}: ${getCorrelation(skillA, skillB)}%`">
                {{ getCorrelation(skillA, skillB) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="heatmap-legend-horizontal">
          <span class="legend-label">Low</span>
          <div class="legend-gradient"></div>
          <span class="legend-label">High</span>
        </div>
      </div>
    </div>

    <!-- Component 3: Top Skill Combinations - Conditional -->
    <div v-if="topSkillCombinations.length > 0" class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">High-Value Skill Combinations</h3>
        <DataSourceBadge type="personalized" />
      </div>
      <p class="chart-subtitle">Most effective skill pairings in successful interviews</p>

      <div class="skill-combinations-grid">
        <div class="combination-card" v-for="combo in topSkillCombinations.slice(0, 6)" :key="combo.id">
          <div class="combo-skills">
            <span class="combo-skill">{{ combo.skill1 }}</span>
            <span class="combo-plus">+</span>
            <span class="combo-skill">{{ combo.skill2 }}</span>
          </div>
          <div class="combo-metrics">
            <div class="combo-metric">
              <span class="metric-label-small">Co-occurrence</span>
              <span class="metric-value-combo">{{ combo.frequency }}%</span>
            </div>
            <div class="combo-metric">
              <span class="metric-label-small">Success Rate</span>
              <span class="metric-value-combo success">{{ combo.successRate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Deterministic string hash function
 * Same string → Same hash → Consistent pseudo-random values
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Calculate priority based on demand and impact
 */
function calculateSkillPriority(demand: number, impact: number): string {
  const score = (demand + impact) / 2
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Computed: Top skills with demand and success impact metrics
 * ✅ COMPLIANCE FIX: Only include skills with real success correlation data
 */
const topSkillsWithMetrics = computed(() => {
  if (!props.patterns.skill_frequency || props.patterns.skill_frequency.length === 0) {
    return []
  }

  // ✅ Only include skills that have real success correlation data
  return props.patterns.skill_frequency
    .filter((skill: any) => {
      return props.patterns.skill_success_correlation && props.patterns.skill_success_correlation[skill.skill]
    })
    .slice(0, 10)
    .map((skill: any) => {
      // Demand = existing percentage from skill_frequency
      const demand = Math.round(typeof skill.percentage === 'number' ? skill.percentage : parseFloat(skill.percentage) || 0)

      // ✅ Success Impact - ONLY from backend, no fallback calculations
      const successImpact = Math.round(props.patterns.skill_success_correlation[skill.skill] * 100)

      const priority = calculateSkillPriority(demand, successImpact)

      return {
        name: skill.skill,
        demand,
        successImpact,
        priority
      }
    })
})

/**
 * Computed: Top 10 skills for heatmap
 */
const topSkillsForHeatmap = computed(() => {
  return topSkillsWithMetrics.value.slice(0, 10).map((s: any) => s.name)
})

/**
 * Computed: Check if correlation data exists
 * ✅ COMPLIANCE FIX: Only show heatmap if real correlation data available
 */
const hasCorrelationData = computed(() => {
  return props.patterns.knowledge_graph &&
         props.patterns.knowledge_graph.correlations &&
         Object.keys(props.patterns.knowledge_graph.correlations).length > 0
})

/**
 * Computed: Top skill combinations
 * ✅ COMPLIANCE FIX: Only use real skill_pairs data from backend
 */
const topSkillCombinations = computed(() => {
  // ✅ Only return skill combinations if backend provides real data
  if (props.patterns.skill_pairs && Array.isArray(props.patterns.skill_pairs) && props.patterns.skill_pairs.length > 0) {
    return props.patterns.skill_pairs.slice(0, 6).map((pair: any, idx: number) => ({
      id: `combo-${idx}`,
      skill1: pair.skill1 || pair.skills?.[0] || 'Unknown',
      skill2: pair.skill2 || pair.skills?.[1] || 'Unknown',
      // ✅ FIX: Only use frequency (percentage), never co_occurrence (count) as percentage
      frequency: typeof pair.frequency === 'number' ? Math.round(pair.frequency) : 0,
      successRate: Math.round(pair.success_rate || pair.successRate || 0)
    }))
  }

  // ✅ NO MOCK DATA: Return empty array if no real data available
  return []
})

/**
 * Get correlation between two skills
 * ✅ COMPLIANCE FIX: Only use real correlation data from backend
 */
function getCorrelation(skillA: string, skillB: string): number {
  // Diagonal: perfect correlation
  if (skillA === skillB) return 100

  // ✅ Only use real correlation data from knowledge_graph
  if (props.patterns.knowledge_graph && props.patterns.knowledge_graph.correlations) {
    const key1 = `${skillA}_${skillB}`
    const key2 = `${skillB}_${skillA}`
    if (props.patterns.knowledge_graph.correlations[key1]) {
      return Math.round(props.patterns.knowledge_graph.correlations[key1] * 100)
    }
    if (props.patterns.knowledge_graph.correlations[key2]) {
      return Math.round(props.patterns.knowledge_graph.correlations[key2] * 100)
    }
  }

  // ✅ NO MOCK DATA: Return 0 if no real correlation data available
  return 0
}

/**
 * Get CSS class for correlation cell based on value
 */
function getCorrelationClass(skillA: string, skillB: string): string {
  const corr = getCorrelation(skillA, skillB)

  if (skillA === skillB) return 'corr-diagonal'
  if (corr >= 80) return 'corr-very-high'
  if (corr >= 60) return 'corr-high'
  if (corr >= 40) return 'corr-medium'
  if (corr >= 20) return 'corr-low'
  return 'corr-very-low'
}

/**
 * Skills data for priority tables (from patterns.skill_frequency)
 */
const skillsData = computed(() => {
  if (!props.patterns?.skill_frequency) return []

  const result = props.patterns.skill_frequency.slice(0, 12).map((skill: any) => {
    const frequency = parseInt(skill.count) || 0
    const difficultyMap: { [key: string]: number } = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    }
    const difficulty = difficultyMap[skill.avg_difficulty?.toLowerCase()] || 2

    // Calculate priority based on frequency and difficulty
    let priority = 'medium'
    if (frequency > 10 && difficulty >= 2) {
      priority = 'critical'
    } else if (frequency > 5 || difficulty === 3) {
      priority = 'high'
    }

    return {
      name: skill.skill,
      frequency,
      difficulty,
      priority,
      percentage: Math.round(parseFloat(skill.percentage) || 0)
    }
  })

  console.log('[CriticalSkillsAnalysis] skillsData:', result)
  return result
})

/**
 * Group skills by priority tier
 */
const criticalSkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'critical')
})

const highPrioritySkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'high')
})

const baselineSkills = computed(() => {
  return skillsData.value.filter(s => s.priority === 'medium')
})

/**
 * Helper function for difficulty label
 */
function getDifficultyLabel(difficulty: number): string {
  if (difficulty === 1) return 'Easy'
  if (difficulty === 2) return 'Medium'
  if (difficulty === 3) return 'Hard'
  return 'Medium'
}

/**
 * Helper function for priority label
 */
function getPriorityLabel(priority: string): string {
  if (priority === 'critical') return 'Critical'
  if (priority === 'high') return 'High'
  return 'Baseline'
}

/**
 * Generate narrative text for Critical Skills Analysis section
 */
function getCriticalSkillsNarrative() {
  const criticalCount = skillsData.value.filter((s: any) => s.priority === 'critical').length
  const topSkill = skillsData.value[0]

  if (!topSkill) {
    return 'Skill analysis is currently unavailable.'
  }

  return `Analysis reveals ${criticalCount} skills classified as critical for interview success, with ${topSkill.name} appearing in ${topSkill.percentage}% of interviews. The prioritization framework categorizes skills into three tiers (Critical/High/Baseline) based on frequency and difficulty, while the correlation matrix identifies key skill combinations that appear together in successful interview outcomes.`
}
</script>

<style scoped>
@import '@/assets/mckinsey-report-shared.css';

/* Compact Skills Table Styling - McKinsey Dense Layout */
.compact-skills-table {
  @apply border border-gray-200 rounded overflow-hidden;
}

.skills-priority-table {
  @apply w-full;
  table-layout: fixed;
  border-collapse: collapse;
}

.skills-priority-table thead {
  @apply bg-gray-100;
}

.skills-priority-table th {
  @apply px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-200;
}

.skills-priority-table .col-skill-header {
  width: 30%;
}

.skills-priority-table .col-priority-header {
  width: 15%;
  @apply text-center;
}

.skills-priority-table .col-mentions-header {
  width: 15%;
  @apply text-center;
}

.skills-priority-table .col-difficulty-header {
  width: 20%;
  @apply text-center;
}

.skills-priority-table .col-coverage-header {
  width: 20%;
  @apply text-right;
}

.skills-priority-table tbody tr {
  @apply border-b border-gray-100 transition-colors hover:bg-gray-50;
}

.skills-priority-table tbody tr:last-child {
  @apply border-b-0;
}

/* Row background colors based on priority */
.skills-priority-table tbody tr.priority-critical {
  @apply bg-blue-50;
}

.skills-priority-table tbody tr.priority-high {
  background-color: #eff6ff;
}

.skills-priority-table tbody tr.priority-medium {
  @apply bg-white;
}

.skills-priority-table td {
  @apply px-3 py-2 text-sm text-gray-700;
  vertical-align: middle;
}

.skills-priority-table td:nth-child(1) {
  @apply font-medium text-gray-900;
}

.skills-priority-table td:nth-child(2),
.skills-priority-table td:nth-child(3),
.skills-priority-table td:nth-child(4) {
  @apply text-center;
}

.skills-priority-table td:nth-child(5) {
  @apply text-right font-semibold text-gray-900;
}

/* Priority Badges - McKinsey Blue Gradient */
.priority-badge {
  @apply inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide;
}

.priority-badge.badge-critical {
  @apply bg-blue-600 text-white;
}

.priority-badge.badge-high {
  @apply bg-blue-500 text-white;
}

.priority-badge.badge-medium {
  @apply bg-gray-400 text-white;
}

/* Compact Difficulty Label */
.difficulty-compact {
  @apply text-sm text-gray-700;
}

/* Priority Legend */
.priority-legend {
  @apply flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs;
}

.priority-legend .legend-item {
  @apply flex items-center gap-1 text-gray-700;
}

.priority-legend .legend-badge {
  @apply inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide;
}

.priority-legend .legend-divider {
  @apply text-gray-400;
}

/* Data Source Badge Wrapper */
.chart-title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
}

.chart-title-with-badge .chart-title {
  margin-bottom: 0;
}
</style>
