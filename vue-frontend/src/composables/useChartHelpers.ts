/**
 * Chart Helpers Composable
 *
 * Provides shared chart utilities and color constants for McKinsey-style reports.
 * Includes deterministic randomness helpers for consistent chart rendering.
 */

/**
 * McKinsey-inspired color palette for charts and UI
 */
export const MCKINSEY_COLORS = {
  primaryBlue: '#1E40AF',
  secondaryBlue: '#60A5FA',
  lightBlue: '#93C5FD',
  paleBlue: '#DBEAFE',
  successGreen: '#059669',
  warningYellow: '#F59E0B',
  errorRed: '#DC2626',
  textDark: '#111827',
  textGray: '#6B7280',
  gridLight: '#F3F4F6',
  borderGray: '#E5E7EB',
  backgroundLight: '#F9FAFB',
  white: '#FFFFFF'
} as const

/**
 * Hash a string to a numeric seed
 * Same string always produces same hash for deterministic randomness
 *
 * @param str - Input string to hash
 * @returns Positive integer hash value
 */
export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Seeded pseudo-random number generator
 * Given same seed, always returns same "random" value between 0-1
 *
 * @param seed - Numeric seed value
 * @returns Pseudo-random number between 0 and 1
 */
export function getSeededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Get deterministic jitter for a string identifier (e.g., company name, skill name)
 * Returns consistent offset values for positioning in charts
 *
 * @param identifier - String identifier to generate jitter for
 * @param range - Maximum jitter range (default: 1)
 * @returns Object with x and y jitter values
 */
export function getDeterministicJitter(identifier: string, range: number = 1): { x: number, y: number } {
  const hash = hashCode(identifier)
  const jitterX = (getSeededRandom(hash) - 0.5) * range
  const jitterY = (getSeededRandom(hash + 1) - 0.5) * range
  return { x: jitterX, y: jitterY }
}

/**
 * Composable function for chart helpers
 * Exports all chart utility functions and constants
 */
export function useChartHelpers() {
  return {
    MCKINSEY_COLORS,
    hashCode,
    getSeededRandom,
    getDeterministicJitter
  }
}
