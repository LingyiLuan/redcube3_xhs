// @ts-nocheck
/**
 * useReportData
 * General data transformation utilities for report generation
 * Common helpers used across multiple report sections
 */

import { NUMBER_FORMATS, DATE_FORMATS } from '@/constants/reportConstants'

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to readable string
 */
export function formatDate(dateString: string | Date | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateString) return 'N/A'

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString

    if (isNaN(date.getTime())) return 'Invalid Date'

    const options: Intl.DateTimeFormatOptions = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric' }
    }[format]

    return new Intl.DateTimeFormat('en-US', options).format(date)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string | Date): string {
  if (!dateString) return 'N/A'

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch (error) {
    return 'N/A'
  }
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format number as percentage
 */
export function formatPercentage(value: number | string | undefined, decimals: number = NUMBER_FORMATS.PERCENTAGE_DECIMALS): string {
  if (value === undefined || value === null) return 'N/A'

  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value

  if (isNaN(numValue)) return 'N/A'

  return `${numValue.toFixed(decimals)}%`
}

/**
 * Format number with commas
 */
export function formatNumber(value: number | undefined, decimals: number = 0): string {
  if (value === undefined || value === null) return 'N/A'
  if (isNaN(value)) return 'N/A'

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Format as currency
 */
export function formatCurrency(value: number | undefined, currency: string = 'USD'): string {
  if (value === undefined || value === null) return 'N/A'
  if (isNaN(value)) return 'N/A'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: NUMBER_FORMATS.CURRENCY_DECIMALS,
    maximumFractionDigits: NUMBER_FORMATS.CURRENCY_DECIMALS
  }).format(value)
}

/**
 * Format number with suffix (K, M, B)
 */
export function formatCompactNumber(value: number | undefined): string {
  if (value === undefined || value === null) return 'N/A'
  if (isNaN(value)) return 'N/A'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value)
}

/**
 * Format score (e.g., 4.5/5.0)
 */
export function formatScore(value: number | undefined, maxValue: number = 5.0): string {
  if (value === undefined || value === null) return 'N/A'
  if (isNaN(value)) return 'N/A'

  return `${value.toFixed(NUMBER_FORMATS.SCORE_DECIMALS)}/${maxValue.toFixed(1)}`
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string with ellipsis
 */
export function truncateString(str: string | undefined, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(str: string | undefined): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert to title case
 */
export function toTitleCase(str: string | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Pluralize word based on count
 */
export function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`
}

/**
 * Create slug from string
 */
export function slugify(str: string | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Get unique values from array
 */
export function getUniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], keys: (keyof T)[], orders: ('asc' | 'desc')[] = []): T[] {
  return [...array].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const order = orders[i] || 'asc'
      const aVal = a[key]
      const bVal = b[key]

      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

/**
 * Calculate median
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Calculate percentile
 */
export function percentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0
  if (p < 0 || p > 100) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

/**
 * Check if value is valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if value is valid date
 */
export function isValidDate(value: any): boolean {
  const date = new Date(value)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Check if value is valid percentage (0-100)
 */
export function isValidPercentage(value: any): boolean {
  return isValidNumber(value) && value >= 0 && value <= 100
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Generate color from string (consistent hashing)
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Lighten color by percentage
 */
export function lightenColor(color: string, percent: number): string {
  // Simple implementation - in production, use a library like chroma.js
  return color // Placeholder
}

/**
 * Get contrast color (black or white)
 */
export function getContrastColor(backgroundColor: string): 'black' | 'white' {
  // Simple implementation - check luminance and return appropriate contrast
  return 'white' // Placeholder
}

// ============================================================================
// EXPORT AS COMPOSABLE
// ============================================================================

export function useReportData() {
  return {
    // Date formatting
    formatDate,
    getRelativeTime,

    // Number formatting
    formatPercentage,
    formatNumber,
    formatCurrency,
    formatCompactNumber,
    formatScore,

    // String utilities
    truncateString,
    capitalizeFirst,
    toTitleCase,
    pluralize,
    slugify,

    // Array utilities
    getUniqueValues,
    groupBy,
    sortBy,
    average,
    median,
    percentile,

    // Object utilities
    deepClone,
    isEmpty,
    pick,
    omit,

    // Data validation
    isValidNumber,
    isValidDate,
    isValidPercentage,

    // Color utilities
    stringToColor,
    lightenColor,
    getContrastColor
  }
}

// Also export individual functions for direct import
export default {
  formatDate,
  getRelativeTime,
  formatPercentage,
  formatNumber,
  formatCurrency,
  formatCompactNumber,
  formatScore,
  truncateString,
  capitalizeFirst,
  toTitleCase,
  pluralize,
  slugify,
  getUniqueValues,
  groupBy,
  sortBy,
  average,
  median,
  percentile,
  deepClone,
  isEmpty,
  pick,
  omit,
  isValidNumber,
  isValidDate,
  isValidPercentage,
  stringToColor,
  lightenColor,
  getContrastColor
}
