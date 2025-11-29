/**
 * useCompanyAnalysis
 * Business logic for company intelligence and trend analysis
 * Extracts company-related computations from MultiPostPatternReport.vue
 */

// @ts-nocheck
import { computed } from 'vue'
import { DATA_LIMITS, PRIORITY_THRESHOLDS } from '@/constants/reportConstants'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompanyTrend {
  company: string
  count: number
  percentage?: number | string
  success_rate?: number | string
  avg_difficulty?: number | string
  interview_stages?: string[]
  common_roles?: string[]
}

export interface CompanyWithMetrics {
  name: string
  interviewCount: number
  successRate: number
  difficulty: number
  difficultyLevel: 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
  popularity: number  // Percentile ranking
  rawPopularity: number
  rank: number
}

export interface CompanyScatterPoint {
  name: string
  x: number  // Difficulty
  y: number  // Success Rate
  size: number  // Interview count
  color: string
}

// ============================================================================
// MAIN COMPOSABLE
// ============================================================================

export function useCompanyAnalysis(patterns: any) {

  // ============================================================================
  // DETERMINISTIC JITTER FUNCTIONS (for scatter plot stability)
  // ============================================================================

  /**
   * Generate hash code from string (deterministic)
   */
  function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generate seeded pseudo-random number (deterministic)
   */
  function getSeededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  /**
   * Get deterministic jitter for scatter plot positioning
   * Same identifier → same jitter → same position every time
   */
  function getDeterministicJitter(identifier: string, range: number = 1): { x: number, y: number } {
    const hash = hashCode(identifier)
    const jitterX = (getSeededRandom(hash) - 0.5) * range
    const jitterY = (getSeededRandom(hash + 1) - 0.5) * range
    return { x: jitterX, y: jitterY }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

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
   * Parse difficulty rating (can be string like "3.5/5" or number)
   */
  function parseDifficulty(value: number | string | undefined): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Handle formats like "3.5/5" or "3.5"
      const match = value.match(/(\d+\.?\d*)/)
      if (match) {
        const parsed = parseFloat(match[1])
        return isNaN(parsed) ? 3.0 : parsed
      }
    }
    return 3.0 // Default middle difficulty
  }

  /**
   * Get difficulty level label
   */
  function getDifficultyLevel(difficulty: number): 'Easy' | 'Medium' | 'Hard' | 'Very Hard' {
    if (difficulty >= 4.5) return 'Very Hard'
    if (difficulty >= 3.5) return 'Hard'
    if (difficulty >= 2.5) return 'Medium'
    return 'Easy'
  }

  /**
   * Calculate popularity percentile
   */
  function calculatePopularity(count: number, maxCount: number): number {
    return Math.min(100, Math.round((count / maxCount) * 100))
  }

  // ============================================================================
  // COMPUTED: TOP COMPANIES WITH METRICS
  // ============================================================================

  const topCompaniesWithMetrics = computed(() => {
    if (!patterns.company_trends || patterns.company_trends.length === 0) {
      return []
    }

    const companies = patterns.company_trends.slice(0, DATA_LIMITS.TOP_COMPANIES)
    const maxCount = Math.max(...companies.map((c: CompanyTrend) => c.count))

    return companies.map((company: CompanyTrend, index: number) => {
      const successRate = parsePercentage(company.success_rate)
      const difficulty = parseDifficulty(company.avg_difficulty)
      const popularity = calculatePopularity(company.count, maxCount)

      return {
        name: company.company,
        interviewCount: company.count,
        successRate,
        difficulty,
        difficultyLevel: getDifficultyLevel(difficulty),
        popularity,
        rawPopularity: company.count,
        rank: index + 1
      } as CompanyWithMetrics
    })
  })

  // ============================================================================
  // COMPUTED: COMPANIES FOR SCATTER PLOT
  // ============================================================================

  const companiesForScatterPlot = computed((): CompanyScatterPoint[] => {
    console.log('[useCompanyAnalysis] 🎯 Computing scatter plot points...')
    console.log('[useCompanyAnalysis] 📊 Raw company_trends:', patterns.company_trends)

    const points = topCompaniesWithMetrics.value.map(company => {
      // Size: larger circles for more interviews
      const minSize = 8
      const maxSize = 24
      const sizeRange = maxSize - minSize
      const normalizedCount = company.interviewCount / Math.max(...topCompaniesWithMetrics.value.map(c => c.interviewCount))
      const size = minSize + (sizeRange * normalizedCount)

      // Color based on difficulty
      let color = '#10B981' // Green (Easy)
      if (company.difficulty >= 4.5) color = '#EF4444' // Red (Very Hard)
      else if (company.difficulty >= 3.5) color = '#F97316' // Orange (Hard)
      else if (company.difficulty >= 2.5) color = '#FBBF24' // Yellow (Medium)

      // Apply deterministic jitter to prevent overlapping points
      // Same company name → same jitter → same position every time
      const jitter = getDeterministicJitter(company.name, 1)
      const jitterX = jitter.x * 0.15  // Scale to ±0.075 (difficulty range 1-5)
      const jitterY = jitter.y * 3     // Scale to ±1.5 (success rate 0-100)

      // Apply jitter with boundary constraints
      const x = Math.max(0, Math.min(5.3, company.difficulty + jitterX))
      const y = Math.max(0, Math.min(105, company.successRate + jitterY))

      console.log(`[useCompanyAnalysis] 📍 ${company.name}: difficulty=${company.difficulty.toFixed(2)}, success=${company.successRate.toFixed(1)}%, jitter=(${jitterX.toFixed(3)}, ${jitterY.toFixed(3)}), final=(${x.toFixed(2)}, ${y.toFixed(1)})`)

      return {
        name: company.name,
        x,
        y,
        size,
        color
      }
    })

    console.log('[useCompanyAnalysis] ✅ Total scatter points:', points.length)
    return points
  })

  // ============================================================================
  // COMPUTED: HIGH SUCCESS RATE COMPANIES
  // ============================================================================

  const highSuccessRateCompanies = computed(() => {
    return topCompaniesWithMetrics.value
      .filter(c => c.successRate >= PRIORITY_THRESHOLDS.HIGH_IMPACT)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
  })

  // ============================================================================
  // COMPUTED: HIGH DIFFICULTY COMPANIES
  // ============================================================================

  const highDifficultyCompanies = computed(() => {
    return topCompaniesWithMetrics.value
      .filter(c => c.difficulty >= 4.0)
      .sort((a, b) => b.difficulty - a.difficulty)
      .slice(0, 5)
  })

  // ============================================================================
  // COMPUTED: MOST POPULAR COMPANIES
  // ============================================================================

  const mostPopularCompanies = computed(() => {
    return topCompaniesWithMetrics.value
      .sort((a, b) => b.interviewCount - a.interviewCount)
      .slice(0, 5)
  })

  // ============================================================================
  // COMPUTED: COMPANY DIFFICULTY DISTRIBUTION
  // ============================================================================

  const companyDifficultyDistribution = computed(() => {
    const distribution = {
      'Easy': 0,
      'Medium': 0,
      'Hard': 0,
      'Very Hard': 0
    }

    topCompaniesWithMetrics.value.forEach(company => {
      distribution[company.difficultyLevel]++
    })

    return distribution
  })

  // ============================================================================
  // COMPUTED: AVERAGE METRICS
  // ============================================================================

  const averageMetrics = computed(() => {
    if (topCompaniesWithMetrics.value.length === 0) {
      return {
        avgSuccessRate: 0,
        avgDifficulty: 0,
        avgInterviewCount: 0
      }
    }

    const total = topCompaniesWithMetrics.value.reduce((acc, company) => {
      acc.successRate += company.successRate
      acc.difficulty += company.difficulty
      acc.count += company.interviewCount
      return acc
    }, { successRate: 0, difficulty: 0, count: 0 })

    const count = topCompaniesWithMetrics.value.length

    return {
      avgSuccessRate: Math.round(total.successRate / count),
      avgDifficulty: Number((total.difficulty / count).toFixed(1)),
      avgInterviewCount: Math.round(total.count / count)
    }
  })

  // ============================================================================
  // COMPUTED: COMPANY NARRATIVES
  // ============================================================================

  const companyNarrative = computed(() => {
    const topCompany = topCompaniesWithMetrics.value[0]
    if (!topCompany) {
      return 'Insufficient data for company analysis.'
    }

    const totalCompanies = topCompaniesWithMetrics.value.length
    const avgSuccess = averageMetrics.value.avgSuccessRate
    const avgDiff = averageMetrics.value.avgDifficulty

    const highSuccessCount = highSuccessRateCompanies.value.length
    const highDiffCount = highDifficultyCompanies.value.length

    return `Analysis of ${totalCompanies} companies reveals ${topCompany.name} leads with ` +
      `${topCompany.interviewCount} interviews (${topCompany.successRate}% success rate, ` +
      `${topCompany.difficulty}/5 difficulty). ` +
      `${highSuccessCount} companies show success rates above ${PRIORITY_THRESHOLDS.HIGH_IMPACT}%, ` +
      `while ${highDiffCount} are classified as high difficulty (≥4.0/5). ` +
      `Average success rate across all companies: ${avgSuccess}%.`
  })

  /**
   * Get insight for a specific company
   */
  function getCompanyInsight(companyName: string): string {
    const company = topCompaniesWithMetrics.value.find(c => c.name === companyName)
    if (!company) return 'No data available for this company.'

    const avgSuccess = averageMetrics.value.avgSuccessRate
    const avgDiff = averageMetrics.value.avgDifficulty

    const successComparison = company.successRate > avgSuccess ? 'above' : 'below'
    const successDiff = Math.abs(company.successRate - avgSuccess)

    const diffComparison = company.difficulty > avgDiff ? 'more difficult' : 'easier'
    const diffDiffValue = Math.abs(company.difficulty - avgDiff)

    return `${company.name} ranks #${company.rank} in interview frequency with ` +
      `${company.interviewCount} recorded interviews. Success rate is ${successDiff.toFixed(1)}% ` +
      `${successComparison} average (${company.successRate}% vs ${avgSuccess}%). ` +
      `Difficulty rated ${diffDiffValue.toFixed(1)} points ${diffComparison} than average ` +
      `(${company.difficulty}/5 vs ${avgDiff}/5).`
  }

  // ============================================================================
  // COMPUTED: SUCCESS RATE TIER BREAKDOWN
  // ============================================================================

  const successRateTiers = computed(() => {
    const tiers = {
      high: [] as CompanyWithMetrics[],      // ≥70%
      medium: [] as CompanyWithMetrics[],    // 50-69%
      low: [] as CompanyWithMetrics[]        // <50%
    }

    topCompaniesWithMetrics.value.forEach(company => {
      if (company.successRate >= PRIORITY_THRESHOLDS.HIGH_IMPACT) {
        tiers.high.push(company)
      } else if (company.successRate >= PRIORITY_THRESHOLDS.MEDIUM_IMPACT) {
        tiers.medium.push(company)
      } else {
        tiers.low.push(company)
      }
    })

    return tiers
  })

  // ============================================================================
  // COMPUTED: COMPANY COMPARISON DATA
  // ============================================================================

  const companyComparisonData = computed(() => {
    return topCompaniesWithMetrics.value.map(company => ({
      name: company.name,
      metrics: {
        'Success Rate': company.successRate,
        'Difficulty': company.difficulty * 20, // Scale to 0-100
        'Popularity': company.popularity,
        'Interview Count': (company.interviewCount / Math.max(...topCompaniesWithMetrics.value.map(c => c.interviewCount))) * 100
      }
    }))
  })

  // ============================================================================
  // UTILITY: FIND COMPANY BY NAME
  // ============================================================================

  function findCompanyByName(name: string): CompanyWithMetrics | undefined {
    return topCompaniesWithMetrics.value.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    )
  }

  // ============================================================================
  // UTILITY: GET TOP N COMPANIES BY METRIC
  // ============================================================================

  function getTopCompaniesByMetric(
    metric: 'successRate' | 'difficulty' | 'interviewCount',
    limit: number = 5,
    ascending: boolean = false
  ): CompanyWithMetrics[] {
    const sorted = [...topCompaniesWithMetrics.value].sort((a, b) => {
      return ascending ? a[metric] - b[metric] : b[metric] - a[metric]
    })
    return sorted.slice(0, limit)
  }

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // Main data
    topCompaniesWithMetrics,
    companiesForScatterPlot,
    highSuccessRateCompanies,
    highDifficultyCompanies,
    mostPopularCompanies,

    // Distributions
    companyDifficultyDistribution,
    successRateTiers,
    companyComparisonData,

    // Aggregates
    averageMetrics,

    // Narratives
    companyNarrative,
    getCompanyInsight,

    // Utilities
    parsePercentage,
    parseDifficulty,
    getDifficultyLevel,
    findCompanyByName,
    getTopCompaniesByMetric
  }
}
