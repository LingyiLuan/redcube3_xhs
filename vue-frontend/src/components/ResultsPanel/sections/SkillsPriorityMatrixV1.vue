<template>
  <section v-if="skillsForPriorityMatrix.length > 0" class="report-section skills-priority-section">
    <SkillsPriorityMatrix
      :skills="skillsForPriorityMatrix"
      :totalPosts="totalPosts"
    />
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import SkillsPriorityMatrix from '../../SkillsPriorityMatrix.vue'
import { calculateSkillPriority } from '@/utilities/reportHelpers'
// ✅ COMPLIANCE FIX: Removed hashString import - no longer using deterministic mock data

interface Props {
  patterns: any
}

const props = defineProps<Props>()

/**
 * Total posts analyzed for calculations
 * ✅ COMPLIANCE FIX: Use actual post count from backend, no fallback
 */
const totalPosts = computed(() => {
  return props.patterns.summary?.total_posts_analyzed || 0
})

/**
 * Top 10 skills with demand and success impact metrics
 */
const topSkillsWithMetrics = computed(() => {
  if (!props.patterns.skill_frequency || props.patterns.skill_frequency.length === 0) {
    return []
  }

  // ✅ COMPLIANCE FIX: Only include skills with real success correlation data
  return props.patterns.skill_frequency
    .filter((skill: any) => {
      // Only include if we have real success correlation data
      return props.patterns.skill_success_correlation && props.patterns.skill_success_correlation[skill.skill]
    })
    .slice(0, 10)
    .map((skill: any) => {
      // Demand = existing percentage from skill_frequency
      const demand = Math.round(typeof skill.percentage === 'number' ? skill.percentage : parseFloat(skill.percentage) || 0)

      // ✅ Success Impact - ONLY from backend, no mock data
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
 * Skills data formatted for Priority Matrix component with percentile rankings
 */
const skillsForPriorityMatrix = computed(() => {
  if (!props.patterns.skill_frequency || props.patterns.skill_frequency.length === 0) {
    console.log('[Skills Priority Matrix] No skill_frequency data available')
    return []
  }

  const baseSkills = topSkillsWithMetrics.value.map((skill: any) => {
    const postCount = Math.round((skill.demand / 100) * totalPosts.value)
    return {
      name: skill.name,
      demand: skill.demand,
      impact: skill.successImpact,
      postCount
    }
  })

  // Calculate percentile rankings for natural spread across quadrants
  // Sort by demand and assign percentiles
  const sortedByDemand = [...baseSkills].sort((a, b) => b.demand - a.demand)
  const demandPercentiles = new Map(
    sortedByDemand.map((skill, index) => [
      skill.name,
      ((sortedByDemand.length - index) / sortedByDemand.length) * 100
    ])
  )

  // Sort by impact and assign percentiles
  const sortedByImpact = [...baseSkills].sort((a, b) => b.impact - a.impact)
  const impactPercentiles = new Map(
    sortedByImpact.map((skill, index) => [
      skill.name,
      ((sortedByImpact.length - index) / sortedByImpact.length) * 100
    ])
  )

  // Combine raw data with percentile rankings
  const skillsWithPercentiles = baseSkills.map(skill => ({
    name: skill.name,
    // Percentiles for visual positioning (0-100)
    demand: demandPercentiles.get(skill.name) || 50,
    impact: impactPercentiles.get(skill.name) || 50,
    // Raw values for display
    rawDemand: skill.demand,
    rawImpact: skill.impact,
    postCount: skill.postCount,
    // Rank information
    demandRank: sortedByDemand.findIndex(s => s.name === skill.name) + 1,
    impactRank: sortedByImpact.findIndex(s => s.name === skill.name) + 1,
    totalSkills: baseSkills.length
  }))

  console.log('[Skills Priority Matrix] Generated', skillsWithPercentiles.length, 'skills with percentile ranking')
  return skillsWithPercentiles
})
</script>

<style scoped>
.skills-priority-section {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .skills-priority-section {
    padding: 16px;
  }
}
</style>
