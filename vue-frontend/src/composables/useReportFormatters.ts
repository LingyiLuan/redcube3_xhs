/**
 * Report Formatters Composable
 *
 * Provides utility functions for formatting dates, difficulty levels,
 * and extracting skill names consistently across report components.
 */

/**
 * Format date string to human-readable format
 *
 * @param dateStr - Date string to format
 * @returns Formatted date string (e.g., "January 15, 2024")
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Get CSS class for difficulty badge based on difficulty value
 *
 * @param difficulty - Difficulty rating (1-5 scale)
 * @returns CSS class name for styling
 */
export function getDifficultyClass(difficulty: number): string {
  if (difficulty < 3.0) return 'difficulty-low'
  if (difficulty >= 3.0 && difficulty < 4.0) return 'difficulty-medium'
  return 'difficulty-high'
}

/**
 * Safely extract skill name from various data structures
 * Handles strings, objects with different property names, null/undefined
 *
 * @param skill - Skill data (string, object, or null/undefined)
 * @returns Skill name as string
 */
export function getSkillName(skill: any): string {
  // Handle null/undefined
  if (skill == null) return ''

  // If it's already a string, return it
  if (typeof skill === 'string') {
    return skill
  }

  // If it's an object, try to extract the skill name
  if (typeof skill === 'object') {
    // Try common property names
    if (skill.skill) return String(skill.skill)
    if (skill.name) return String(skill.name)
    if (skill.skillName) return String(skill.skillName)
    if (skill.skill_name) return String(skill.skill_name)

    // If none of those work, return fallback
    console.warn('Skill object has unexpected structure:', skill)
    return '[Unknown Skill]'
  }

  // For other types, convert to string
  return String(skill)
}

/**
 * Hash a string to a numeric seed (for deterministic randomness)
 * Note: This is a duplicate of hashCode from useChartHelpers
 * Consider importing from useChartHelpers if both are needed
 *
 * @param str - Input string to hash
 * @returns Positive integer hash value
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Composable function for report formatters
 * Exports all formatting utility functions
 */
export function useReportFormatters() {
  return {
    formatDate,
    getDifficultyClass,
    getSkillName,
    hashString
  }
}
