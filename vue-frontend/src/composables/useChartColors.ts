// @ts-nocheck
/**
 * McKinsey Chart Color System
 * Provides consistent colors for Chart.js visualizations
 * Using only blue/gray spectrum - no random colors
 */

export const MCKINSEY_CHART_COLORS = {
  // Primary data visualization colors (in order of usage)
  navy: '#1E3A8A',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  babyBlue: '#BFDBFE',

  // Neutral colors for backgrounds/borders
  charcoal: '#1F2937',
  slate: '#64748B',
  lightGray: '#E2E8F0',
  offWhite: '#F8FAFC',

  // Dataset color sequence (for multiple data series)
  datasets: [
    '#1E3A8A', // Navy - primary
    '#3B82F6', // Blue - secondary
    '#60A5FA', // Light Blue - tertiary
    '#BFDBFE', // Baby Blue - quaternary
  ],

  // Alternative: semi-transparent versions for overlays
  datasetsAlpha: [
    'rgba(30, 58, 138, 0.8)',  // Navy 80%
    'rgba(59, 130, 246, 0.8)', // Blue 80%
    'rgba(96, 165, 250, 0.8)', // Light Blue 80%
    'rgba(191, 219, 254, 0.8)', // Baby Blue 80%
  ],

  // For borders/points (darker versions)
  datasetsBorder: [
    '#0F172A', // Dark Navy
    '#1E3A8A', // Navy
    '#3B82F6', // Blue
    '#60A5FA', // Light Blue
  ],
}

/**
 * Get chart color by index (cycles through palette)
 */
export function getChartColor(index: number): string {
  return MCKINSEY_CHART_COLORS.datasets[index % MCKINSEY_CHART_COLORS.datasets.length]
}

/**
 * Get chart color with alpha transparency
 */
export function getChartColorAlpha(index: number): string {
  return MCKINSEY_CHART_COLORS.datasetsAlpha[index % MCKINSEY_CHART_COLORS.datasetsAlpha.length]
}

/**
 * Get border color for charts
 */
export function getChartBorderColor(index: number): string {
  return MCKINSEY_CHART_COLORS.datasetsBorder[index % MCKINSEY_CHART_COLORS.datasetsBorder.length]
}

/**
 * Generate gradient for heatmaps (low to high intensity)
 */
export function getHeatmapGradient(): string[] {
  return [
    '#F8FAFC', // Off white (lowest)
    '#BFDBFE', // Baby blue
    '#60A5FA', // Light blue
    '#3B82F6', // Blue
    '#1E3A8A', // Navy (highest)
  ]
}

/**
 * Get status/priority color (blue spectrum only - no red/yellow/green)
 */
export function getStatusColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const statusColors = {
    low: '#BFDBFE',      // Baby blue
    medium: '#60A5FA',   // Light blue
    high: '#1E3A8A',     // Navy
    critical: '#0F172A', // Dark navy
  }
  return statusColors[level]
}

/**
 * Get difficulty color (blue gradient - no traffic lights)
 */
export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 2.5) return '#BFDBFE'  // Baby blue - easier
  if (difficulty < 3.5) return '#60A5FA'  // Light blue - moderate
  if (difficulty < 4.5) return '#3B82F6'  // Blue - challenging
  return '#1E3A8A'                         // Navy - difficult
}

/**
 * Standard Chart.js configuration for McKinsey style
 */
export const MCKINSEY_CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#1F2937', // Charcoal
        font: {
          family: "'Inter', -apple-system, sans-serif",
          size: 13,
          weight: 500,
        },
      },
    },
    tooltip: {
      backgroundColor: '#1F2937', // Charcoal
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 6,
      titleFont: {
        size: 13,
        weight: 600,
      },
      bodyFont: {
        size: 12,
        weight: 400,
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: '#F1F5F9',
        borderColor: '#E2E8F0',
      },
      ticks: {
        color: '#64748B', // Slate
        font: {
          size: 12,
        },
      },
    },
    y: {
      grid: {
        color: '#F1F5F9',
        borderColor: '#E2E8F0',
      },
      ticks: {
        color: '#64748B', // Slate
        font: {
          size: 12,
        },
      },
    },
  },
}
