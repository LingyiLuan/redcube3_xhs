/**
 * Report Helper Utilities
 * Provides smart naming and formatting for analysis reports
 */

// @ts-nocheck
import type { AnalysisReport } from '@/types/reports'

/**
 * Generate a user-friendly title for a report
 * Examples:
 * - "Single Analysis (Google - Software Engineer)"
 * - "Batch Analysis (Amazon + Netflix + Apple)"
 * - "Batch Analysis (5 companies: Google + Amazon + ...)"
 */
export function getReportTitle(report: AnalysisReport): string {
  const reportType = report.result?.type || 'batch'

  if (reportType === 'single') {
    // Single Analysis (Google - Software Engineer)
    const company = report.result?.overview?.company || report.result?.company || 'Unknown Company'
    const role = report.result?.overview?.role || report.result?.role

    return role
      ? `Single Analysis (${company} - ${role})`
      : `Single Analysis (${company})`
  } else {
    // Batch Analysis (3 companies: Google + Amazon + Netflix)
    const companies = extractCompaniesFromBatchReport(report)

    if (companies.length === 0) {
      return 'Batch Analysis'
    } else if (companies.length === 1) {
      return `Batch Analysis (${companies[0]})`
    } else if (companies.length <= 3) {
      return `Batch Analysis (${companies.join(' + ')})`
    } else {
      // More than 3: "Batch Analysis (4 companies: Google + Amazon + ...)"
      return `Batch Analysis (${companies.length} companies: ${companies.slice(0, 2).join(' + ')} + ...)`
    }
  }
}

/**
 * Extract company names from a batch report
 * ✅ FIX: Extract from individual_analyses (user's analyzed posts) ONLY
 * NOT from company_trends or similar_posts (which include RAG data)
 */
function extractCompaniesFromBatchReport(report: AnalysisReport): string[] {
  // 🎯 PRIORITY 1: Extract from individual_analyses (user's actual analyzed posts)
  if (report.result?.individual_analyses && Array.isArray(report.result.individual_analyses)) {
    const companies = [...new Set(
      report.result.individual_analyses
        .map((analysis: any) => analysis.company)
        .filter((c: string) => c && c !== 'Unknown' && c !== 'unknown')
    )]

    if (companies.length > 0) {
      return companies.slice(0, 4)
    }
  }

  // Fallback 1: Try posts_metadata if available (contains user's posts metadata)
  if (report.result?.posts_metadata && Array.isArray(report.result.posts_metadata)) {
    const companies = [...new Set(
      report.result.posts_metadata
        .map((p: any) => p.company)
        .filter((c: string) => c && c !== 'Unknown' && c !== 'unknown')
    )]

    if (companies.length > 0) {
      return companies.slice(0, 4)
    }
  }

  // Fallback 2: Last resort - check direct company field
  if (report.result?.company) {
    return [report.result.company]
  }

  return []
}

/**
 * Get a preview description for a report card
 */
export function getReportPreview(report: AnalysisReport): string {
  const reportType = report.result?.type || 'batch'

  if (reportType === 'single') {
    const difficulty = report.result?.difficulty || report.result?.overview?.difficulty
    const outcome = report.result?.outcome || report.result?.overview?.outcome

    const parts: string[] = []
    if (difficulty) parts.push(`${capitalizeFirst(difficulty)} difficulty`)
    if (outcome) parts.push(`Outcome: ${capitalizeFirst(outcome)}`)

    return parts.length > 0 ? parts.join(' • ') : 'Click to view interview analysis'
  } else {
    const postsCount = report.result?.similar_posts?.length || 0
    const questionsCount = report.result?.patternAnalysis?.interview_questions?.length || 0

    if (postsCount > 0 || questionsCount > 0) {
      const parts: string[] = []
      if (postsCount > 0) parts.push(`${postsCount} posts analyzed`)
      if (questionsCount > 0) parts.push(`${questionsCount} questions extracted`)
      return parts.join(' • ')
    }

    return 'Click to view comprehensive analysis'
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Format a date for display in reports list
 * ✅ UPDATED: Shorter format for card layout (Nov 22, 04:58 PM)
 * No year if current year
 */
export function formatReportDate(timestamp: Date | string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isCurrentYear = date.getFullYear() === now.getFullYear()

  // Show shorter format without year if same year
  if (isCurrentYear) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else {
    // Include year if different year
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

/**
 * Extract company name from report (for table display)
 */
export function getReportCompany(report: AnalysisReport): string {
  const reportType = report.result?.type || 'batch'

  if (reportType === 'single') {
    return report.result?.overview?.company || report.result?.company || 'Unknown'
  } else {
    // Batch: get first company from company_trends
    const companies = extractCompaniesFromBatchReport(report)
    return companies.length > 0 ? companies[0] : 'Multiple'
  }
}

/**
 * Extract role from report (for table display)
 */
export function getReportRole(report: AnalysisReport): string {
  const reportType = report.result?.type || 'batch'

  if (reportType === 'single') {
    return report.result?.overview?.role || report.result?.role || 'Unknown'
  } else {
    // Batch: show "Batch Analysis"
    return 'Batch Analysis'
  }
}

/**
 * Extract difficulty from report (for table display)
 */
export function getReportDifficulty(report: AnalysisReport): string {
  const difficulty = report.result?.difficulty || report.result?.overview?.difficulty
  return difficulty ? capitalizeFirst(difficulty) : 'Unknown'
}

/**
 * Extract outcome from report (for table display)
 */
export function getReportOutcome(report: AnalysisReport): string {
  const outcome = report.result?.outcome || report.result?.overview?.outcome
  return outcome ? capitalizeFirst(outcome) : 'Unknown'
}
