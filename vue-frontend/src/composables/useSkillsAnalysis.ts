// @ts-nocheck
/**
 * useSkillsAnalysis
 * Business logic for skills analysis and priority calculations
 * Extracts from MultiPostPatternReport.vue for maintainability
 */

import { computed, type Ref } from 'vue'
import { PRIORITY_THRESHOLDS, DATA_LIMITS } from '@/constants/reportConstants'
import type { PriorityLevel } from '@/constants/reportConstants'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SkillFrequency {
  skill: string
  count: number
  percentage: number | string
  success_rate?: string
  avg_difficulty?: number
}

export interface SkillWithMetrics {
  name: string
  demand: number           // Market demand percentage
  impact: number           // Success impact percentage
  priority: PriorityLevel  // critical | high | medium | low
  priorityTier: string     // Display string
  postCount: number
  rank: number

  // For percentile ranking
  rawDemand?: number
  rawImpact?: number
  demandRank?: number
  impactRank?: number
  totalSkills?: number
}

export interface SkillCorrelation {
  skill1: string
  skill2: string
  coOccurrenceRate: number
  strength: 'strong' | 'moderate' | 'weak'
}

export interface KnowledgeGraphEntry {
  concepts?: string[]
  topics?: string[]
  [key: string]: any
}

// ============================================================================
// MAIN COMPOSABLE
// ============================================================================

export function useSkillsAnalysis(patterns: any) {

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Safely extract skill name from various input formats
   */
  function getSkillName(skill: any): string {
    if (typeof skill === 'string') return skill
    if (typeof skill === 'object' && skill !== null) {
      return skill.skill || skill.name || String(skill)
    }
    return String(skill)
  }

  /**
   * Parse percentage string to number
   */
  function parsePercentage(value: number | string | undefined): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace('%', '').trim()
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  /**
   * Calculate success impact based on success rate and difficulty
   */
  function calculateSuccessImpact(skill: SkillFrequency): number {
    const successRate = parsePercentage(skill.success_rate)
    const difficulty = skill.avg_difficulty || 3.0

    // Higher difficulty with high success rate = higher impact
    // Formula: normalize success rate and add difficulty bonus
    const baseImpact = successRate
    const difficultyBonus = (difficulty / 5.0) * 15 // Max 15% bonus

    return Math.min(100, Math.round(baseImpact + difficultyBonus))
  }

  /**
   * Determine priority level based on combined score
   */
  function calculatePriority(demand: number, impact: number): PriorityLevel {
    const avgScore = (demand + impact) / 2

    if (avgScore >= PRIORITY_THRESHOLDS.CRITICAL) return 'critical'
    if (avgScore >= PRIORITY_THRESHOLDS.HIGH) return 'high'
    if (avgScore >= PRIORITY_THRESHOLDS.MEDIUM) return 'medium'
    return 'low'
  }

  /**
   * Get display text for priority level
   */
  function getPriorityTier(priority: PriorityLevel): string {
    const tiers: Record<PriorityLevel, string> = {
      critical: 'CRITICAL PRIORITY',
      high: 'HIGH PRIORITY',
      medium: 'MEDIUM PRIORITY',
      low: 'LOW PRIORITY'
    }
    return tiers[priority]
  }

  // ============================================================================
  // COMPUTED: TOP SKILLS WITH METRICS
  // ============================================================================

  const topSkillsWithMetrics = computed(() => {
    if (!patterns.skill_frequency || patterns.skill_frequency.length === 0) {
      return []
    }

    const totalPosts = patterns.summary?.total_posts_analyzed || 100

    return patterns.skill_frequency
      .slice(0, DATA_LIMITS.TOP_SKILLS)
      .map((skill: SkillFrequency, index: number) => {
        const demand = parsePercentage(skill.percentage)
        const successImpact = calculateSuccessImpact(skill)
        const priority = calculatePriority(demand, successImpact)
        const postCount = Math.round((demand / 100) * totalPosts)

        return {
          name: getSkillName(skill.skill),
          demand,
          impact: successImpact,
          priority,
          priorityTier: getPriorityTier(priority),
          postCount,
          rank: index + 1
        }
      })
  })

  // ============================================================================
  // COMPUTED: SKILLS FOR PRIORITY MATRIX (WITH PERCENTILE RANKING)
  // ============================================================================

  const skillsForPriorityMatrix = computed(() => {
    const baseSkills = topSkillsWithMetrics.value

    if (baseSkills.length === 0) return []

    // Calculate percentile rankings for natural spread
    const sortedByDemand = [...baseSkills].sort((a, b) => b.demand - a.demand)
    const demandPercentiles = new Map(
      sortedByDemand.map((skill, index) => [
        skill.name,
        ((sortedByDemand.length - index) / sortedByDemand.length) * 100
      ])
    )

    const sortedByImpact = [...baseSkills].sort((a, b) => b.impact - a.impact)
    const impactPercentiles = new Map(
      sortedByImpact.map((skill, index) => [
        skill.name,
        ((sortedByImpact.length - index) / sortedByImpact.length) * 100
      ])
    )

    // Combine raw data with percentile rankings
    return baseSkills.map(skill => ({
      ...skill,
      // Percentiles for visual positioning (0-100)
      demand: demandPercentiles.get(skill.name) || 50,
      impact: impactPercentiles.get(skill.name) || 50,
      // Raw values for display
      rawDemand: skill.demand,
      rawImpact: skill.impact,
      // Rank information
      demandRank: sortedByDemand.findIndex(s => s.name === skill.name) + 1,
      impactRank: sortedByImpact.findIndex(s => s.name === skill.name) + 1,
      totalSkills: baseSkills.length
    }))
  })

  // ============================================================================
  // COMPUTED: SKILLS FOR HEATMAP
  // ============================================================================

  const topSkillsForHeatmap = computed(() => {
    return topSkillsWithMetrics.value
      .slice(0, DATA_LIMITS.MAX_HEATMAP_ITEMS)
      .map(s => s.name)
  })

  // ============================================================================
  // COMPUTED: SKILL CORRELATIONS
  // ============================================================================

  const skillCorrelations = computed((): SkillCorrelation[] => {
    if (!patterns.knowledge_graph || patterns.knowledge_graph.length === 0) {
      return []
    }

    const coOccurrenceMap = new Map<string, number>()
    const topSkillNames = new Set(topSkillsWithMetrics.value.map(s => s.name))

    // Count co-occurrences from knowledge graph
    patterns.knowledge_graph.forEach((entry: KnowledgeGraphEntry) => {
      const concepts = entry.concepts || entry.topics || []
      const relevantConcepts = concepts.filter((c: string) =>
        topSkillNames.has(c)
      )

      // Create pairs
      for (let i = 0; i < relevantConcepts.length; i++) {
        for (let j = i + 1; j < relevantConcepts.length; j++) {
          const skillA = relevantConcepts[i]
          const skillB = relevantConcepts[j]
          const key1 = `${skillA}_${skillB}`
          const key2 = `${skillB}_${skillA}`

          // Use consistent key (alphabetical order)
          const key = skillA < skillB ? key1 : key2
          coOccurrenceMap.set(key, (coOccurrenceMap.get(key) || 0) + 1)
        }
      }
    })

    // Convert to correlation objects
    const correlations: SkillCorrelation[] = []
    const totalPosts = patterns.summary?.total_posts_analyzed || 100

    coOccurrenceMap.forEach((count, key) => {
      const [skill1, skill2] = key.split('_')
      const rate = (count / totalPosts) * 100

      let strength: 'strong' | 'moderate' | 'weak' = 'weak'
      if (rate >= 30) strength = 'strong'
      else if (rate >= 15) strength = 'moderate'

      correlations.push({ skill1, skill2, coOccurrenceRate: rate, strength })
    })

    // Return top correlations sorted by strength
    return correlations
      .sort((a, b) => b.coOccurrenceRate - a.coOccurrenceRate)
      .slice(0, 20)
  })

  // ============================================================================
  // COMPUTED: NARRATIVE INSIGHTS
  // ============================================================================

  const skillsNarrative = computed(() => {
    const criticalCount = topSkillsWithMetrics.value.filter(
      s => s.priority === 'critical'
    ).length

    const topSkill = topSkillsWithMetrics.value[0]

    if (!topSkill) {
      return 'Insufficient data for skills analysis.'
    }

    const score = (topSkill.rawDemand || topSkill.demand + topSkill.rawImpact || topSkill.impact) / 2

    return `Analysis reveals ${criticalCount} skills classified as critical priority. ` +
      `${topSkill.name} leads with ${topSkill.rawDemand?.toFixed(1) || topSkill.demand.toFixed(1)}% market demand ` +
      `and ${topSkill.rawImpact?.toFixed(1) || topSkill.impact.toFixed(1)}% success impact (priority score: ${score.toFixed(1)}/100). ` +
      `Focus preparation on critical-priority skills for maximum ROI.`
  })

  // ============================================================================
  // COMPUTED: CRITICAL SKILLS ONLY
  // ============================================================================

  const criticalSkills = computed(() => {
    return topSkillsWithMetrics.value.filter(s => s.priority === 'critical')
  })

  // ============================================================================
  // COMPUTED: SKILL CATEGORIES
  // ============================================================================

  const skillsByCategory = computed(() => {
    const categories = {
      technical: [] as SkillWithMetrics[],
      frameworks: [] as SkillWithMetrics[],
      cloud: [] as SkillWithMetrics[],
      data: [] as SkillWithMetrics[],
      soft: [] as SkillWithMetrics[]
    }

    // Simple keyword-based categorization
    // In production, this would use more sophisticated NLP
    const techKeywords = ['python', 'javascript', 'java', 'sql', 'c++', 'go', 'rust']
    const frameworkKeywords = ['react', 'vue', 'angular', 'django', 'flask', 'spring']
    const cloudKeywords = ['aws', 'azure', 'gcp', 'docker', 'kubernetes']
    const dataKeywords = ['machine learning', 'data science', 'analytics', 'ai']
    const softKeywords = ['communication', 'leadership', 'problem solving']

    topSkillsWithMetrics.value.forEach(skill => {
      const nameLower = skill.name.toLowerCase()

      if (techKeywords.some(k => nameLower.includes(k))) {
        categories.technical.push(skill)
      } else if (frameworkKeywords.some(k => nameLower.includes(k))) {
        categories.frameworks.push(skill)
      } else if (cloudKeywords.some(k => nameLower.includes(k))) {
        categories.cloud.push(skill)
      } else if (dataKeywords.some(k => nameLower.includes(k))) {
        categories.data.push(skill)
      } else if (softKeywords.some(k => nameLower.includes(k))) {
        categories.soft.push(skill)
      } else {
        categories.technical.push(skill) // Default category
      }
    })

    return categories
  })

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // Main data
    topSkillsWithMetrics,
    skillsForPriorityMatrix,
    topSkillsForHeatmap,
    skillCorrelations,
    criticalSkills,
    skillsByCategory,

    // Narratives
    skillsNarrative,

    // Utility functions
    getSkillName,
    parsePercentage,
    calculateSuccessImpact,
    calculatePriority,
    getPriorityTier
  }
}
