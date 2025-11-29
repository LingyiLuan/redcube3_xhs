<template>
  <section v-if="hasMultipleRoles" class="report-section role-intelligence">
    <h2 class="section-title">Role Intelligence</h2>

    <div class="narrative-block">
      <p class="insight-text">
        {{ getRoleIntelligenceNarrative() }}
      </p>
    </div>

    <div class="chart-wrapper">
      <div class="chart-title-with-badge">
        <h3 class="chart-title">Role-by-Role Comparison</h3>
        <div class="badge-group">
          <DataSourceBadge type="benchmark" />
          <CacheFreshnessIndicator />
        </div>
      </div>
      <div class="role-table-wrapper">
        <table class="role-comparison-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Posts</th>
              <th>Success Rate</th>
              <th>Difficulty</th>
              <th>Top Skills</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(role, idx) in roleComparisonData" :key="role.name">
              <td class="role-name-cell">
                {{ role.name }}
                <span v-if="role.isSeedRole" class="seed-badge" title="From your uploaded posts">Your Role</span>
              </td>
              <td>{{ role.postCount }}</td>
              <td>
                <div class="inline-bar-container">
                  <div class="inline-bar" :style="{ width: role.successRate + '%' }"></div>
                  <span class="inline-bar-label">{{ role.successRate }}%</span>
                </div>
              </td>
              <td>
                <span
                  class="difficulty-badge"
                  :class="getDifficultyClass(role.difficulty)"
                >
                  {{ role.difficulty }}/5
                </span>
              </td>
              <td>
                <div class="skill-tags">
                  <span
                    v-for="skill in role.topSkills.slice(0, 3)"
                    :key="skill"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { getSkillName, getDifficultyClass } from '@/composables/useReportFormatters'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import CacheFreshnessIndicator from '@/components/common/CacheFreshnessIndicator.vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Check if we have multiple roles to display
 */
const hasMultipleRoles = computed(() => {
  if (props.patterns.role_trends && Array.isArray(props.patterns.role_trends)) {
    return props.patterns.role_trends.length >= 2
  }

  // Fallback: check role_breakdown
  if (props.patterns.role_breakdown && Array.isArray(props.patterns.role_breakdown)) {
    return props.patterns.role_breakdown.length >= 2
  }

  // Fallback: extract from company_trends
  if (props.patterns.company_trends && Array.isArray(props.patterns.company_trends)) {
    const roles = new Set()
    props.patterns.company_trends.forEach((c: any) => {
      if (c.common_roles && Array.isArray(c.common_roles)) {
        c.common_roles.forEach((r: string) => roles.add(r))
      }
    })
    return roles.size >= 2
  }

  return false
})

/**
 * Process and format role comparison data for the table
 */
const roleComparisonData = computed(() => {
  const roleSource = props.patterns.role_breakdown || props.patterns.role_trends

  if (roleSource && Array.isArray(roleSource)) {
    return roleSource.map((role: any) => {
      const successRateStr = String(role.success_rate || role.successRate || '0%').replace('%', '')
      const successRate = parseFloat(successRateStr)
      let difficulty = 3.5

      if (role.difficulty !== undefined) {
        difficulty = parseFloat(String(role.difficulty))
      } else if (role.avg_difficulty !== undefined) {
        difficulty = parseFloat(String(role.avg_difficulty))
      }

      let topSkills: string[] = []
      if (role.top_skills && Array.isArray(role.top_skills)) {
        topSkills = role.top_skills.map((s: any) => getSkillName(s))
      } else if (role.skills && Array.isArray(role.skills)) {
        topSkills = role.skills.map((s: any) => getSkillName(s))
      }

      return {
        name: role.role || role.name || 'Unknown Role',
        postCount: role.total_posts || role.post_count || 0,
        successRate: Math.round(successRate),
        difficulty: parseFloat(difficulty.toFixed(1)),
        topSkills: topSkills.slice(0, 5),
        isSeedRole: role.is_seed_role || false
      }
    })
    .filter((role: any) => role.postCount > 0)
    .sort((a: any, b: any) => b.successRate - a.successRate)
    .slice(0, 8)
  }

  // Fallback: extract roles from company_trends
  if (props.patterns.company_trends && Array.isArray(props.patterns.company_trends)) {
    const roleMap = new Map()

    props.patterns.company_trends.forEach((company: any) => {
      if (company.common_roles && Array.isArray(company.common_roles)) {
        company.common_roles.forEach((roleName: string) => {
          if (!roleMap.has(roleName)) {
            roleMap.set(roleName, {
              name: roleName,
              postCount: 0,
              successRate: 0,
              difficulty: 3.5,
              topSkills: [],
              isSeedRole: false
            })
          }

          const roleData = roleMap.get(roleName)
          roleData.postCount += company.interview_count || 0
        })
      }
    })

    return Array.from(roleMap.values())
      .filter((role: any) => role.postCount > 0)
      .sort((a: any, b: any) => b.postCount - a.postCount)
      .slice(0, 8)
  }

  return []
})

/**
 * Generate narrative text for Role Intelligence section
 */
function getRoleIntelligenceNarrative() {
  if (!roleComparisonData.value || roleComparisonData.value.length < 2) {
    return 'Role intelligence data is currently unavailable.'
  }

  const topRole = roleComparisonData.value[0]
  const bottomRole = roleComparisonData.value[roleComparisonData.value.length - 1]

  return `Across ${roleComparisonData.value.length} distinct roles, ${topRole.name} demonstrates the highest success rate at ${topRole.successRate}%, followed by specialized positions requiring niche expertise. In contrast, ${bottomRole.name} presents greater challenges with a ${bottomRole.successRate}% success rate and difficulty rating of ${bottomRole.difficulty}/5.`
}

/**
 * Get CSS class for difficulty badge based on difficulty value
 */
function getDifficultyClass(difficulty: number): string {
  if (difficulty < 3.0) return 'difficulty-low'
  if (difficulty >= 3.0 && difficulty < 4.0) return 'difficulty-medium'
  return 'difficulty-high'
}
</script>

<style scoped>
@import '@/assets/mckinsey-report-shared.css';

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

.badge-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
