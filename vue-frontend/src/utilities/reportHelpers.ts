/**
 * Report Helpers Utility
 *
 * Provides calculation and analysis utilities for report components.
 * These are pure utility functions that don't depend on Vue reactivity.
 */

/**
 * Calculate skill priority classification based on demand and impact metrics
 *
 * @param demand - Skill demand percentage (0-100)
 * @param impact - Success impact percentage (0-100)
 * @returns Priority level: 'critical' | 'high' | 'medium' | 'low'
 */
export function calculateSkillPriority(demand: number, impact: number): string {
  const score = (demand + impact) / 2
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Count number of critical skills in skill frequency data
 * Filters skills with 'Critical' importance
 *
 * @param skillFrequency - Array of skill objects with importance property
 * @returns Count of critical skills
 */
export function getCriticalSkillsCount(skillFrequency: any[]): number {
  if (!skillFrequency || !Array.isArray(skillFrequency)) return 0
  return skillFrequency.filter((s: any) => s.importance === 'Critical').length
}

/**
 * Extract unique companies from post data
 *
 * @param posts - Array of post objects with company property
 * @returns Array of unique company names
 */
export function extractUniqueCompanies(posts: any[]): string[] {
  if (!posts || !Array.isArray(posts)) return []
  const companies = new Set<string>()
  posts.forEach((post: any) => {
    if (post.company) companies.add(post.company)
  })
  return Array.from(companies)
}

/**
 * Extract unique roles from post data
 *
 * @param posts - Array of post objects with role property
 * @returns Array of unique role names
 */
export function extractUniqueRoles(posts: any[]): string[] {
  if (!posts || !Array.isArray(posts)) return []
  const roles = new Set<string>()
  posts.forEach((post: any) => {
    if (post.role) roles.add(post.role)
  })
  return Array.from(roles)
}

/**
 * Count total unique skills from posts
 *
 * @param posts - Array of post objects with skills array property
 * @returns Count of unique skills
 */
export function countUniqueSkills(posts: any[]): number {
  if (!posts || !Array.isArray(posts)) return 0
  const skills = new Set<string>()
  posts.forEach((post: any) => {
    if (post.skills && Array.isArray(post.skills)) {
      post.skills.forEach((skill: string) => {
        if (skill) skills.add(skill)
      })
    }
  })
  return skills.size
}
