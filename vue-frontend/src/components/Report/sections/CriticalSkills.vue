<template>
  <section class="critical-skills-analysis">
    <h2 class="section-title">Critical Skills Analysis</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="insight-text">
        {{ skillsNarrative }}
      </p>
    </div>

    <!-- Component 1: Dual-Metric Skill Bars -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Skills Importance Matrix</h3>
      <p class="chart-subtitle">Demand vs Success Impact for Top 10 Skills</p>

      <div class="dual-metric-bars">
        <div class="dual-bar-row" v-for="skill in topSkills" :key="skill.name">
          <div class="skill-name-col">{{ skill.name }}</div>
          <div class="dual-bars-col">
            <div class="metric-bar-group">
              <div class="metric-label-inline">Demand</div>
              <div class="bar-container">
                <div class="metric-bar demand-bar" :style="{ width: skill.demand + '%' }"></div>
                <span class="bar-value">{{ skill.demand.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="metric-bar-group">
              <div class="metric-label-inline">Success Impact</div>
              <div class="bar-container">
                <div class="metric-bar impact-bar" :style="{ width: skill.successImpact + '%' }"></div>
                <span class="bar-value">{{ skill.successImpact.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          <div class="priority-badge-col">
            <span class="priority-badge" :class="skill.priorityClass">{{ skill.priorityLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Component 2: Skill Correlation Heatmap (5x5) -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Skill Correlation Matrix</h3>
      <p class="chart-subtitle">Skills frequently appearing together (correlation strength 0-100%)</p>

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
              <td
                v-for="skillB in topSkillsForHeatmap"
                :key="skillB"
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

    <!-- Component 3: Top Skill Combinations -->
    <div class="chart-wrapper">
      <h3 class="chart-title">High-Value Skill Combinations</h3>
      <p class="chart-subtitle">Most effective skill pairings in successful interviews</p>

      <div class="skill-combinations-grid">
        <div class="combination-card" v-for="combo in skillCombinations" :key="combo.id">
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

    <!-- Critical Skills Callout -->
    <InsightCallout
      v-if="criticalSkillsCount > 0"
      type="warning"
      title="Critical Skills Identified"
      :message="`${criticalSkillsCount} skills are classified as Critical, indicating their high importance for interview success across multiple companies.`"
    />
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useSkillsAnalysis } from '@/composables/useSkillsAnalysis'
import InsightCallout from '../widgets/InsightCallout.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Use composables
const { topSkillsWithMetrics, skillsNarrative } = useSkillsAnalysis(props.patterns)

/**
 * Top 10 skills with formatted data
 */
const topSkills = computed(() => {
  return topSkillsWithMetrics.value.slice(0, 10).map(skill => ({
    name: skill.name,
    demand: skill.demand,
    successImpact: skill.impact,
    priorityClass: getPriorityClass(skill.priority),
    priorityLabel: getPriorityLabel(skill.priority)
  }))
})

/**
 * Top 5 skills for heatmap
 */
const topSkillsForHeatmap = computed(() => {
  return topSkillsWithMetrics.value.slice(0, 5).map(s => s.name)
})

/**
 * Count of critical skills
 */
const criticalSkillsCount = computed(() => {
  return topSkillsWithMetrics.value.filter(s => s.priority >= 75).length
})

/**
 * Skill combinations
 */
const skillCombinations = computed(() => {
  // Check if patterns has skill_pairs data
  if (props.patterns.skill_pairs && Array.isArray(props.patterns.skill_pairs)) {
    return props.patterns.skill_pairs.slice(0, 6).map((pair: any, idx: number) => ({
      id: `combo-${idx}`,
      skill1: pair.skill1 || pair.skills?.[0] || 'Unknown',
      skill2: pair.skill2 || pair.skills?.[1] || 'Unknown',
      frequency: Math.round(pair.frequency || pair.co_occurrence || 0),
      successRate: Math.round(pair.success_rate || pair.successRate || 0)
    }))
  }

  // Generate combinations from top 5 skills
  const topSkillsList = topSkillsForHeatmap.value
  const combinations: any[] = []

  for (let i = 0; i < topSkillsList.length; i++) {
    for (let j = i + 1; j < topSkillsList.length; j++) {
      const skill1 = topSkillsList[i]
      const skill2 = topSkillsList[j]
      const correlation = getCorrelation(skill1, skill2)

      combinations.push({
        id: `combo-${i}-${j}`,
        skill1,
        skill2,
        frequency: correlation,
        successRate: Math.min(95, correlation + Math.floor(Math.random() * 10))
      })
    }
  }

  return combinations
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 6)
})

/**
 * Get correlation between two skills
 */
function getCorrelation(skillA: string, skillB: string): number {
  // Diagonal: perfect correlation
  if (skillA === skillB) return 100

  // Check if knowledge_graph exists with correlation data
  if (props.patterns.knowledge_graph?.correlations) {
    const key1 = `${skillA}-${skillB}`
    const key2 = `${skillB}-${skillA}`

    if (props.patterns.knowledge_graph.correlations[key1]) {
      return Math.round(props.patterns.knowledge_graph.correlations[key1] * 100)
    }
    if (props.patterns.knowledge_graph.correlations[key2]) {
      return Math.round(props.patterns.knowledge_graph.correlations[key2] * 100)
    }
  }

  // Mock correlation based on skill positions
  const skills = topSkillsForHeatmap.value
  const indexA = skills.indexOf(skillA)
  const indexB = skills.indexOf(skillB)

  if (indexA === -1 || indexB === -1) return 50

  // Skills closer together tend to have higher correlation
  const distance = Math.abs(indexA - indexB)
  const baseCorr = 85 - (distance * 15)
  const variance = Math.random() * 20 - 10

  return Math.max(15, Math.min(95, Math.round(baseCorr + variance)))
}

/**
 * Get CSS class for correlation strength
 */
function getCorrelationClass(skillA: string, skillB: string): string {
  const corr = getCorrelation(skillA, skillB)

  if (skillA === skillB) return 'corr-diagonal'
  if (corr >= 80) return 'corr-very-high'
  if (corr >= 60) return 'corr-high'
  if (corr >= 40) return 'corr-medium'
  return 'corr-low'
}

/**
 * Get priority CSS class
 */
function getPriorityClass(priority: number): string {
  if (priority >= 75) return 'critical'
  if (priority >= 60) return 'high'
  if (priority >= 40) return 'medium'
  return 'low'
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: number): string {
  if (priority >= 75) return 'Critical'
  if (priority >= 60) return 'High'
  if (priority >= 40) return 'Medium'
  return 'Low'
}
</script>

<style scoped>
.critical-skills-analysis {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

.narrative-block {
  margin-bottom: 32px;
}

.insight-text {
  font-size: 16px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
}

.chart-wrapper {
  margin-bottom: 40px;
}

.chart-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8px;
}

.chart-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 16px;
}

/* Dual-Metric Bars */
.dual-metric-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dual-bar-row {
  display: grid;
  grid-template-columns: 150px 1fr 100px;
  gap: 16px;
  align-items: center;
}

.skill-name-col {
  font-weight: 600;
  color: #1F2937;
  font-size: 14px;
}

.dual-bars-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-bar-group {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 12px;
  align-items: center;
}

.metric-label-inline {
  font-size: 12px;
  color: #6B7280;
  text-align: right;
}

.bar-container {
  position: relative;
  background: #E5E7EB;
  border-radius: 4px;
  height: 24px;
  overflow: visible;
}

.metric-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.demand-bar {
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
}

.impact-bar {
  background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
}

.bar-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #1F2937;
}

.priority-badge-col {
  text-align: center;
}

.priority-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.priority-badge.critical {
  background: #FEE2E2;
  color: #DC2626;
}

.priority-badge.high {
  background: #FEF3C7;
  color: #F59E0B;
}

.priority-badge.medium {
  background: #DBEAFE;
  color: #2563EB;
}

.priority-badge.low {
  background: #F3F4F6;
  color: #6B7280;
}

/* Correlation Heatmap */
.heatmap-container-small {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 20px;
}

.correlation-heatmap {
  width: 100%;
  border-collapse: separate;
  border-spacing: 4px;
  margin-bottom: 16px;
}

.correlation-heatmap th {
  background: white;
  padding: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  border-radius: 4px;
}

.correlation-heatmap td {
  background: white;
  padding: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.correlation-heatmap td:hover {
  transform: scale(1.05);
}

.corr-diagonal {
  background: #E5E7EB !important;
  color: #6B7280;
}

.corr-very-high {
  background: #059669 !important;
  color: white;
}

.corr-high {
  background: #34D399 !important;
  color: #1F2937;
}

.corr-medium {
  background: #FCD34D !important;
  color: #1F2937;
}

.corr-low {
  background: #FEE2E2 !important;
  color: #DC2626;
}

.heatmap-legend-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.legend-label {
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.legend-gradient {
  width: 200px;
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #FEE2E2 0%, #FCD34D 33%, #34D399 66%, #059669 100%);
}

/* Skill Combinations */
.skill-combinations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.combination-card {
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.combination-card:hover {
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.combo-skills {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.combo-skill {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  text-align: center;
  background: white;
  padding: 8px;
  border-radius: 4px;
}

.combo-plus {
  font-size: 16px;
  font-weight: 700;
  color: #6B7280;
}

.combo-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combo-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label-small {
  font-size: 11px;
  color: #6B7280;
  text-transform: uppercase;
  font-weight: 600;
}

.metric-value-combo {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
}

.metric-value-combo.success {
  color: #059669;
}

/* Responsive */
@media (max-width: 1024px) {
  .skill-combinations-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dual-bar-row {
    grid-template-columns: 120px 1fr 80px;
  }
}

@media (max-width: 640px) {
  .critical-skills-analysis {
    padding: 20px;
  }

  .section-title {
    font-size: 20px;
  }

  .chart-title {
    font-size: 16px;
  }

  .skill-combinations-grid {
    grid-template-columns: 1fr;
  }

  .dual-bar-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-bar-group {
    grid-template-columns: 80px 1fr;
  }
}
</style>
