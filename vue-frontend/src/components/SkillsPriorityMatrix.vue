<template>
  <div class="skills-priority-matrix">
    <!-- Header -->
    <div class="matrix-header">
      <h3 class="matrix-title">Skills Priority Matrix</h3>
      <p class="matrix-subtitle">Relative Market Demand vs Success Impact (Percentile Ranking)</p>
      <p class="matrix-note">Skills positioned by comparative ranking within dataset • Hover for actual metrics</p>
    </div>

    <!-- Insight Callout -->
    <div class="insight-callout">
      <div class="insight-icon">💡</div>
      <div class="insight-content">
        <span class="insight-text">{{ topInsight }}</span>
      </div>
    </div>

    <!-- 2x2 Matrix Visualization -->
    <div class="matrix-visualization">
      <svg :width="matrixSize" :height="matrixSize" class="priority-matrix-svg">
        <!-- Quadrant Backgrounds -->
        <g class="quadrants">
          <!-- Bottom-Left: Low Priority -->
          <rect
            :x="svgPadding"
            :y="matrixSize / 2"
            :width="(matrixSize - 2 * svgPadding) / 2"
            :height="(matrixSize - 2 * svgPadding) / 2"
            fill="#F9FAFB"
            stroke="#D1D5DB"
            stroke-width="1"
          />
          <text
            :x="svgPadding + (matrixSize - 2 * svgPadding) / 4"
            :y="matrixSize / 2 + (matrixSize - 2 * svgPadding) / 4"
            text-anchor="middle"
            class="quadrant-label quadrant-low"
          >
            LOW PRIORITY
          </text>

          <!-- Bottom-Right: Market Demand -->
          <rect
            :x="matrixSize / 2"
            :y="matrixSize / 2"
            :width="(matrixSize - 2 * svgPadding) / 2"
            :height="(matrixSize - 2 * svgPadding) / 2"
            fill="#E0F2FE"
            stroke="#60A5FA"
            stroke-width="1"
          />
          <text
            :x="matrixSize / 2 + (matrixSize - 2 * svgPadding) / 4"
            :y="matrixSize / 2 + (matrixSize - 2 * svgPadding) / 4"
            text-anchor="middle"
            class="quadrant-label quadrant-market"
          >
            MARKET DEMAND
          </text>

          <!-- Top-Left: Nice to Have -->
          <rect
            :x="svgPadding"
            :y="svgPadding"
            :width="(matrixSize - 2 * svgPadding) / 2"
            :height="(matrixSize - 2 * svgPadding) / 2"
            fill="#DBEAFE"
            stroke="#BFDBFE"
            stroke-width="1"
          />
          <text
            :x="svgPadding + (matrixSize - 2 * svgPadding) / 4"
            :y="svgPadding + (matrixSize - 2 * svgPadding) / 4"
            text-anchor="middle"
            class="quadrant-label quadrant-valuable"
          >
            VALUABLE SKILLS
          </text>

          <!-- Top-Right: Critical Priority -->
          <rect
            :x="matrixSize / 2"
            :y="svgPadding"
            :width="(matrixSize - 2 * svgPadding) / 2"
            :height="(matrixSize - 2 * svgPadding) / 2"
            fill="#EFF6FF"
            stroke="#2563EB"
            stroke-width="2"
          />
          <text
            :x="matrixSize / 2 + (matrixSize - 2 * svgPadding) / 4"
            :y="svgPadding + (matrixSize - 2 * svgPadding) / 4"
            text-anchor="middle"
            class="quadrant-label quadrant-critical"
          >
            CRITICAL PRIORITY
          </text>
        </g>

        <!-- Grid Lines (50% marks) -->
        <g class="grid-lines">
          <line
            :x1="svgPadding"
            :y1="matrixSize / 2"
            :x2="matrixSize - svgPadding"
            :y2="matrixSize / 2"
            stroke="#E5E7EB"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
          <line
            :x1="matrixSize / 2"
            :y1="svgPadding"
            :x2="matrixSize / 2"
            :y2="matrixSize - svgPadding"
            stroke="#E5E7EB"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
        </g>

        <!-- Skill Dots -->
        <g class="skill-dots">
          <g
            v-for="skill in processedSkills"
            :key="skill.name"
            @mouseenter="hoveredSkill = skill"
            @mouseleave="hoveredSkill = null"
          >
            <circle
              :cx="getXPosition(skill.demand)"
              :cy="getYPosition(skill.impact)"
              :r="getSkillRadius(skill)"
              :fill="getSkillColor(skill)"
              :stroke="hoveredSkill === skill ? '#1F2937' : '#FFFFFF'"
              :stroke-width="hoveredSkill === skill ? 2 : 1"
              class="skill-dot"
              style="cursor: pointer"
            />
            <!-- Skill label for top skills -->
            <text
              v-if="skill.rank <= 3"
              :x="getXPosition(skill.demand)"
              :y="getYPosition(skill.impact) - getSkillRadius(skill) - 8"
              text-anchor="middle"
              class="skill-label-text"
            >
              {{ skill.name }}
            </text>
          </g>
        </g>

        <!-- Axes Labels -->
        <text
          :x="matrixSize / 2"
          :y="matrixSize - 10"
          text-anchor="middle"
          class="axis-label"
        >
          Relative Market Demand →
        </text>
        <text
          :x="15"
          :y="matrixSize / 2"
          text-anchor="middle"
          class="axis-label"
          transform="rotate(-90, 15, 250)"
        >
          ↑ Relative Success Impact
        </text>
      </svg>

      <!-- Tooltip (Teleport to avoid clipping) -->
      <Teleport to="body">
        <Transition name="tooltip-fade">
          <div
            v-if="hoveredSkill"
            class="skill-tooltip"
            :style="tooltipStyle"
          >
            <div class="tooltip-skill-name">{{ hoveredSkill.name }}</div>

            <!-- Ranking Information -->
            <div class="tooltip-section">
              <div class="tooltip-section-title">Relative Ranking</div>
              <div class="tooltip-metrics">
                <div class="tooltip-metric">
                  <span class="metric-label">Demand Rank:</span>
                  <span class="metric-value">#{{ hoveredSkill.demandRank }} of {{ hoveredSkill.totalSkills }}</span>
                </div>
                <div class="tooltip-metric">
                  <span class="metric-label">Impact Rank:</span>
                  <span class="metric-value">#{{ hoveredSkill.impactRank }} of {{ hoveredSkill.totalSkills }}</span>
                </div>
              </div>
            </div>

            <!-- Actual Metrics -->
            <div class="tooltip-section">
              <div class="tooltip-section-title">Actual Metrics</div>
              <div class="tooltip-metrics">
                <div class="tooltip-metric">
                  <span class="metric-label">Market Demand:</span>
                  <span class="metric-value">{{ hoveredSkill.rawDemand?.toFixed(1) || hoveredSkill.demand.toFixed(1) }}%</span>
                </div>
                <div class="tooltip-metric">
                  <span class="metric-label">Success Impact:</span>
                  <span class="metric-value">{{ hoveredSkill.rawImpact?.toFixed(1) || hoveredSkill.impact.toFixed(1) }}%</span>
                </div>
                <div class="tooltip-metric">
                  <span class="metric-label">Sample Size:</span>
                  <span class="metric-value">{{ hoveredSkill.postCount }} posts</span>
                </div>
              </div>
            </div>
            <div class="tooltip-priority">
              <span :class="['priority-badge', `priority-${hoveredSkill.priorityLevel}`]">
                {{ hoveredSkill.priorityTier }}
              </span>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- Detailed Skills Table -->
    <div class="skills-table-section">
      <h4 class="table-title">Detailed Analysis</h4>
      <div class="table-metadata">
        <span>Showing {{ processedSkills.length }} skills</span>
        <span>•</span>
        <span>Based on {{ totalPosts }} interview posts</span>
      </div>

      <div class="table-wrapper">
        <table class="skills-table">
          <thead>
            <tr>
              <th class="col-rank">#</th>
              <th class="col-skill">Skill</th>
              <th class="col-demand">Market Demand</th>
              <th class="col-impact">Success Impact</th>
              <th class="col-priority">Priority</th>
              <th class="col-recommendation">Recommendation</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="skill in processedSkills"
              :key="skill.name"
              :class="{ 'row-top': skill.rank === 1 }"
            >
              <td class="col-rank">{{ skill.rank }}</td>
              <td class="col-skill">
                <span class="skill-name">{{ skill.name }}</span>
              </td>
              <td class="col-demand">
                <div class="bar-container">
                  <div class="bar bar-demand" :style="{ width: `${skill.demand}%` }"></div>
                  <span class="bar-label">{{ typeof skill.demand === 'number' ? skill.demand.toFixed(1) : skill.demand }}%</span>
                </div>
              </td>
              <td class="col-impact">
                <div class="bar-container">
                  <div class="bar bar-impact" :style="{ width: `${skill.impact}%` }"></div>
                  <span class="bar-label">{{ typeof skill.impact === 'number' ? skill.impact.toFixed(1) : skill.impact }}%</span>
                </div>
              </td>
              <td class="col-priority">
                <span :class="['priority-badge', `priority-${skill.priorityLevel}`]">
                  {{ skill.priorityTier }}
                </span>
              </td>
              <td class="col-recommendation">
                <span class="recommendation-text">{{ skill.recommendation }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'

interface Skill {
  name: string
  demand: number // 0-100%
  impact: number // 0-100%
  postCount: number
}

interface Props {
  skills: Skill[]
  totalPosts?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalPosts: 0
})

const matrixSize = 500
const svgPadding = 20 // Add padding to prevent edge clipping
const hoveredSkill = ref<any>(null)

// Process skills: calculate priority, rank, recommendations
const processedSkills = computed(() => {
  return props.skills
    .map((skill, index) => {
      const priorityScore = (skill.demand + skill.impact) / 2

      // Determine quadrant and priority tier
      let priorityTier = 'Low'
      let priorityLevel = 'low'
      let recommendation = 'Monitor market trends'

      // McKinsey Style: Contextual recommendations based on skill type and quadrant
      if (skill.impact >= 50 && skill.demand >= 50) {
        priorityTier = 'Critical'
        priorityLevel = 'critical'
        // Vary recommendations based on skill characteristics
        if (skill.demand >= 80) {
          recommendation = 'Extremely high demand - prioritize immediately'
        } else if (skill.impact >= 80) {
          recommendation = 'Strong success correlation - focus here'
        } else {
          recommendation = 'Balanced high value - invest time'
        }
      } else if (skill.impact >= 50 && skill.demand < 50) {
        priorityTier = 'High'
        priorityLevel = 'high'
        if (skill.impact >= 75) {
          recommendation = 'Excellent success rate - competitive advantage'
        } else {
          recommendation = 'Valuable for interview success'
        }
      } else if (skill.impact < 50 && skill.demand >= 50) {
        priorityTier = 'Medium'
        priorityLevel = 'medium'
        if (skill.demand >= 70) {
          recommendation = 'Growing market trend - stay current'
        } else {
          recommendation = 'Moderate demand - consider learning'
        }
      } else {
        priorityTier = 'Low'
        priorityLevel = 'low'
        if (skill.demand < 20 && skill.impact < 20) {
          recommendation = 'Low priority - optional skill'
        } else {
          recommendation = 'Monitor for future trends'
        }
      }

      return {
        ...skill,
        rank: index + 1,
        priorityScore,
        priorityTier,
        priorityLevel,
        recommendation
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((skill, index) => ({ ...skill, rank: index + 1 }))
})

// Top insight (highest impact skill)
const topInsight = computed(() => {
  if (processedSkills.value.length === 0) return 'No skills data available'

  const topSkill = processedSkills.value.reduce((max, skill) =>
    skill.impact > max.impact ? skill : max
  )

  return `${topSkill.name} demonstrates the highest success impact (${topSkill.impact}%) with ${topSkill.demand}% market demand. Focus preparation efforts here for maximum interview success.`
})

// Position calculations for SVG with Smart Inset
/**
 * Calculate proportional inset margin based on distance from center
 * Provides more breathing room at edges (25px) than center (15px)
 */
function calculateInset(percentile: number): number {
  const MIN_INSET = 15  // Minimum margin at center (50%)
  const MAX_INSET = 25  // Maximum margin at boundaries (0%, 100%)

  // Calculate distance from center (0 at 50%, 1 at 0% or 100%)
  const distanceFromCenter = Math.abs(percentile - 50) / 50

  // Interpolate between min and max based on distance
  return MIN_INSET + (MAX_INSET - MIN_INSET) * distanceFromCenter
}

function getXPosition(demand: number): number {
  // Calculate smart inset for this percentile
  const inset = calculateInset(demand)

  // Map 0-100% to (padding+inset) to (matrixSize-padding-inset) pixels
  const plotWidth = matrixSize - (2 * (svgPadding + inset))
  return (svgPadding + inset) + (demand / 100) * plotWidth
}

function getYPosition(impact: number): number {
  // Calculate smart inset for this percentile
  const inset = calculateInset(impact)

  // Map 0-100% to (matrixSize-padding-inset) to (padding+inset) pixels (invert Y axis)
  const plotHeight = matrixSize - (2 * (svgPadding + inset))
  return (matrixSize - svgPadding - inset) - (impact / 100) * plotHeight
}

function getSkillRadius(skill: any): number {
  // Size based on priority: Critical = 12px, High = 10px, Medium = 8px, Low = 6px
  const sizes = {
    critical: 12,
    high: 10,
    medium: 8,
    low: 6
  }
  return sizes[skill.priorityLevel as keyof typeof sizes] || 6
}

function getSkillColor(skill: any): string {
  const colors = {
    critical: '#1E3A8A', // Navy - Highest priority
    high: '#3B82F6',     // Blue - High priority
    medium: '#60A5FA',   // Light Blue - Medium priority
    low: '#BFDBFE'       // Baby Blue - Low priority
  }
  return colors[skill.priorityLevel as keyof typeof colors] || '#BFDBFE'
}

// Tooltip positioning (simple centered below cursor)
const tooltipStyle = computed(() => {
  if (!hoveredSkill.value) return {}

  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  }
})
</script>

<style scoped>
.skills-priority-matrix {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

/* Header */
.matrix-header {
  margin-bottom: 20px;
}

.matrix-title {
  font-size: 20px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 4px 0;
}

.matrix-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.matrix-note {
  font-size: 12px;
  color: #9CA3AF;
  margin: 4px 0 0 0;
  font-style: italic;
}

/* Insight Callout */
.insight-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #EFF6FF;
  border-left: 3px solid #2563EB;
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 24px;
}

.insight-icon {
  font-size: 20px;
  line-height: 1;
}

.insight-content {
  flex: 1;
}

.insight-text {
  font-size: 14px;
  line-height: 1.6;
  color: #1F2937;
}

/* Matrix Visualization */
.matrix-visualization {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  position: relative;
}

.priority-matrix-svg {
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #FFFFFF;
}

.quadrant-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  fill: #6B7280;
  text-transform: uppercase;
}

.skill-dot {
  transition: all 0.2s ease;
}

.skill-dot:hover {
  opacity: 0.8;
}

.skill-label-text {
  font-size: 11px;
  font-weight: 600;
  fill: #1F2937;
  pointer-events: none;
}

.axis-label {
  font-size: 12px;
  font-weight: 500;
  fill: #6B7280;
}

/* Tooltip */
.skill-tooltip {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  min-width: 220px;
  z-index: 10000;
}

.tooltip-skill-name {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E7EB;
}

.tooltip-section {
  margin-bottom: 12px;
}

.tooltip-section:last-of-type {
  margin-bottom: 8px;
}

.tooltip-section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9CA3AF;
  margin-bottom: 6px;
}

.tooltip-metrics {
  margin-bottom: 0;
}

.tooltip-metric {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.metric-label {
  color: #6B7280;
}

.metric-value {
  color: #1F2937;
  font-weight: 600;
}

.tooltip-priority {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #E5E7EB;
}

/* Table Section */
.skills-table-section {
  margin-top: 32px;
}

.table-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 8px 0;
}

.table-metadata {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
}

.skills-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.skills-table thead {
  background: #F9FAFB;
}

.skills-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #E5E7EB;
  white-space: nowrap;
}

.skills-table td {
  padding: 12px;
  border-bottom: 1px solid #F3F4F6;
}

/* McKinsey Style: Alternating rows + hover for better readability */
.skills-table tbody tr {
  transition: background-color 0.15s;
}

.skills-table tbody tr:nth-child(even) {
  background: #FAFBFC;
}

.skills-table tbody tr:hover {
  background: #F3F4F6;
  cursor: pointer;
}

.row-top {
  border-left: 3px solid #2563EB;
}

.row-top .skill-name {
  font-weight: 700;
}

.col-rank {
  color: #9CA3AF;
  width: 50px;
}

.col-skill {
  font-weight: 600;
  color: #1F2937;
}

.skill-name {
  font-weight: 600;
}

/* Progress Bars - McKinsey Style */
.bar-container {
  position: relative;
  width: 200px;
  height: 20px;
  background: #E5E7EB; /* Darker background for better bar visibility */
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* McKinsey Style: Solid colors (no gradients) */
.bar-demand {
  background: #2563EB; /* Solid blue */
}

.bar-impact {
  background: #3B82F6; /* Solid blue */
}

.bar-label {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

/* Priority Badges - McKinsey Style (Softer, Professional) */
.priority-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: 1px solid transparent;
}

.priority-critical {
  background: #EFF6FF;
  color: #1E3A8A;
  border-color: #1E3A8A;
}

.priority-high {
  background: #DBEAFE;
  color: #3B82F6;
  border-color: #3B82F6;
}

.priority-medium {
  background: #BFDBFE;
  color: #1E3A8A;
  border-color: #60A5FA;
}

.priority-low {
  background: #F8FAFC;
  color: #64748B;
  border-color: #E2E8F0;
}

.recommendation-text {
  color: #4B5563;
  font-size: 12px;
}

/* Tooltip transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .priority-matrix-svg {
    width: 100%;
    height: auto;
  }

  .bar-container {
    width: 120px;
  }

  .skills-table {
    font-size: 11px;
  }

  .skills-table th,
  .skills-table td {
    padding: 8px;
  }

  .col-recommendation {
    display: none;
  }
}
</style>
