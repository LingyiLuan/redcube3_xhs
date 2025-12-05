# Week 1 Quick Start Guide

## Objective
Create foundation infrastructure (constants, utils, base charts, widgets) without breaking existing code.

**Timeline:** 5 days  
**Deliverables:** 11 reusable components + 4 utility modules + tests

---

## Day 1: Project Setup & Constants

### Morning (3 hours): Project Structure
```bash
cd vue-frontend/src

# Create new directories
mkdir -p constants
mkdir -p utils
mkdir -p components/ResultsPanel/Charts
mkdir -p components/ResultsPanel/Widgets
mkdir -p components/Shared

# Install dependencies (if needed)
npm install lodash-es
npm install --save-dev @vitest/ui
```

### Afternoon (4 hours): Constants

#### 1. Create `constants/chartColors.ts`
```typescript
// constants/chartColors.ts
export const MCKINSEY_COLORS = {
  // Primary colors
  primaryBlue: '#1E40AF',
  secondaryBlue: '#60A5FA',
  lightBlue: '#93C5FD',
  paleBlue: '#DBEAFE',
  
  // Status colors
  successGreen: '#059669',
  warningYellow: '#F59E0B',
  errorRed: '#DC2626',
  
  // Text colors
  textDark: '#111827',
  textGray: '#6B7280',
  
  // Background colors
  gridLight: '#F3F4F6',
  borderGray: '#E5E7EB',
  backgroundLight: '#F9FAFB',
  white: '#FFFFFF'
} as const

export const CHART_COLOR_PALETTE = [
  MCKINSEY_COLORS.primaryBlue,
  MCKINSEY_COLORS.secondaryBlue,
  MCKINSEY_COLORS.successGreen,
  MCKINSEY_COLORS.warningYellow,
  MCKINSEY_COLORS.errorRed,
  MCKINSEY_COLORS.lightBlue
]

export function getColorForIndex(index: number): string {
  return CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length]
}

export function getColorForPercentage(percentage: number): string {
  if (percentage >= 80) return MCKINSEY_COLORS.successGreen
  if (percentage >= 60) return MCKINSEY_COLORS.secondaryBlue
  if (percentage >= 40) return MCKINSEY_COLORS.warningYellow
  return MCKINSEY_COLORS.errorRed
}
```

#### 2. Create `constants/chartDefaults.ts`
```typescript
// constants/chartDefaults.ts
import { MCKINSEY_COLORS } from './chartColors'

export const DEFAULT_BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { left: 10, right: 10, top: 10, bottom: 10 }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: MCKINSEY_COLORS.textDark,
        font: { size: 12, weight: '600' }
      }
    },
    y: {
      grid: {
        color: MCKINSEY_COLORS.gridLight,
        lineWidth: 1
      },
      ticks: {
        color: MCKINSEY_COLORS.textGray,
        font: { size: 12 }
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: MCKINSEY_COLORS.textDark,
      titleColor: MCKINSEY_COLORS.white,
      bodyColor: MCKINSEY_COLORS.white,
      padding: 12,
      titleFont: { size: 13, weight: '600' },
      bodyFont: { size: 12 }
    }
  }
}

export const DEFAULT_SCATTER_OPTIONS = {
  ...DEFAULT_BAR_OPTIONS,
  scales: {
    x: {
      ...DEFAULT_BAR_OPTIONS.scales.x,
      title: {
        display: true,
        color: MCKINSEY_COLORS.textDark,
        font: { size: 13, weight: '700' }
      }
    },
    y: {
      ...DEFAULT_BAR_OPTIONS.scales.y,
      title: {
        display: true,
        color: MCKINSEY_COLORS.textDark,
        font: { size: 13, weight: '700' }
      }
    }
  },
  plugins: {
    ...DEFAULT_BAR_OPTIONS.plugins,
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        padding: 12,
        font: { size: 12 },
        color: MCKINSEY_COLORS.textDark,
        usePointStyle: true
      }
    }
  }
}

export const DEFAULT_LINE_OPTIONS = DEFAULT_SCATTER_OPTIONS

export const DEFAULT_DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 10
  },
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        padding: 12,
        font: { size: 12 },
        color: MCKINSEY_COLORS.textDark,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: MCKINSEY_COLORS.textDark,
      titleColor: MCKINSEY_COLORS.white,
      bodyColor: MCKINSEY_COLORS.white,
      padding: 12,
      callbacks: {
        label: function(context: any) {
          return `${context.label}: ${context.parsed}%`
        }
      }
    }
  }
}
```

#### 3. Test the constants
```bash
# Run in terminal to verify no syntax errors
npx tsc constants/chartColors.ts --noEmit
npx tsc constants/chartDefaults.ts --noEmit
```

---

## Day 2: Utilities

### Morning (4 hours): Formatters

#### Create `utils/formatters.ts`
```typescript
// utils/formatters.ts

/**
 * Format a date string or Date object into readable format
 * @param dateInput - Date string or Date object
 * @returns Formatted date (e.g., "January 15, 2024")
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format a number as percentage
 * @param value - Number or string percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage (e.g., "75.2%")
 */
export function formatPercentage(value: number | string, decimals: number = 1): string {
  const num = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value
  
  if (isNaN(num)) {
    return '0%'
  }
  
  return `${num.toFixed(decimals)}%`
}

/**
 * Format a number with thousands separator
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number (e.g., "1,234")
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Extract skill name from object or string
 * Handles both { skill: 'React' } and 'React' formats
 */
export function getSkillName(skillItem: any): string {
  if (typeof skillItem === 'string') {
    return skillItem
  }
  
  if (typeof skillItem === 'object' && skillItem !== null) {
    return skillItem.skill || skillItem.name || String(skillItem)
  }
  
  return 'Unknown'
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
```

#### Create tests: `utils/formatters.test.ts`
```typescript
// utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, formatPercentage, formatNumber, getSkillName } from './formatters'

describe('formatters', () => {
  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2024-01-15')
      expect(result).toBe('January 15, 2024')
    })
    
    it('handles invalid date', () => {
      const result = formatDate('invalid')
      expect(result).toBe('Invalid Date')
    })
  })
  
  describe('formatPercentage', () => {
    it('formats number as percentage', () => {
      expect(formatPercentage(75.234)).toBe('75.2%')
      expect(formatPercentage(75.234, 2)).toBe('75.23%')
    })
    
    it('handles string input', () => {
      expect(formatPercentage('75.2%')).toBe('75.2%')
    })
  })
  
  describe('formatNumber', () => {
    it('formats with thousands separator', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })
  })
  
  describe('getSkillName', () => {
    it('extracts from object', () => {
      expect(getSkillName({ skill: 'React' })).toBe('React')
      expect(getSkillName({ name: 'Python' })).toBe('Python')
    })
    
    it('handles string directly', () => {
      expect(getSkillName('JavaScript')).toBe('JavaScript')
    })
  })
})
```

### Afternoon (3 hours): Calculators

#### Create `utils/calculators.ts`
```typescript
// utils/calculators.ts

/**
 * Calculate percentile ranking for a value in a dataset
 * @param value - The value to rank
 * @param dataset - Array of all values
 * @returns Percentile (0-100)
 */
export function calculatePercentile(value: number, dataset: number[]): number {
  const sorted = [...dataset].sort((a, b) => a - b)
  const index = sorted.indexOf(value)
  
  if (index === -1) return 50 // Default if not found
  
  return (index / sorted.length) * 100
}

/**
 * Calculate priority based on demand and success impact
 * @returns 'Critical' | 'High' | 'Medium' | 'Low'
 */
export function calculatePriority(demand: number, successImpact: number): string {
  const score = demand + successImpact
  
  if (score >= 150) return 'Critical'
  if (score >= 100) return 'High'
  if (score >= 60) return 'Medium'
  return 'Low'
}

/**
 * Calculate correlation between two skills (mock implementation)
 * In production, this would use actual co-occurrence data
 */
export function calculateCorrelation(skillA: string, skillB: string, data?: any): number {
  // This is a placeholder - real implementation would analyze actual data
  // For now, return a realistic random correlation
  const hash = (skillA + skillB).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return Math.min(95, Math.max(15, 40 + (hash % 50)))
}

/**
 * Get CSS class for correlation strength
 */
export function getCorrelationClass(correlation: number): string {
  if (correlation >= 80) return 'corr-very-high'
  if (correlation >= 60) return 'corr-high'
  if (correlation >= 40) return 'corr-medium'
  if (correlation >= 20) return 'corr-low'
  return 'corr-very-low'
}

/**
 * Calculate difficulty class for badge styling
 */
export function getDifficultyClass(difficulty: number): string {
  if (difficulty >= 4) return 'diff-hard'
  if (difficulty >= 3) return 'diff-medium'
  return 'diff-easy'
}
```

---

## Day 3: Base Chart Components

### Morning (4 hours): BarChart & ScatterChart

#### Create `components/ResultsPanel/Charts/BarChart.vue`
```vue
<template>
  <div class="chart-container" :style="{ height }">
    <Bar :data="data" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { merge } from 'lodash-es'
import { DEFAULT_BAR_OPTIONS } from '@/constants/chartDefaults'

const props = defineProps<{
  data: any
  options?: any
  height?: string
}>()

const mergedOptions = computed(() => {
  if (!props.options) return DEFAULT_BAR_OPTIONS
  return merge({}, DEFAULT_BAR_OPTIONS, props.options)
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}
</style>
```

#### Create `components/ResultsPanel/Charts/ScatterChart.vue`
```vue
<template>
  <div class="chart-container" :style="{ height }">
    <Scatter :data="data" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Scatter } from 'vue-chartjs'
import { merge } from 'lodash-es'
import { DEFAULT_SCATTER_OPTIONS } from '@/constants/chartDefaults'

const props = defineProps<{
  data: any
  options?: any
  height?: string
}>()

const mergedOptions = computed(() => {
  if (!props.options) return DEFAULT_SCATTER_OPTIONS
  return merge({}, DEFAULT_SCATTER_OPTIONS, props.options)
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 400px;
}
</style>
```

### Afternoon (3 hours): LineChart & DoughnutChart

#### Create `components/ResultsPanel/Charts/LineChart.vue`
```vue
<template>
  <div class="chart-container" :style="{ height }">
    <Line :data="data" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { merge } from 'lodash-es'
import { DEFAULT_LINE_OPTIONS } from '@/constants/chartDefaults'

const props = defineProps<{
  data: any
  options?: any
  height?: string
}>()

const mergedOptions = computed(() => {
  if (!props.options) return DEFAULT_LINE_OPTIONS
  return merge({}, DEFAULT_LINE_OPTIONS, props.options)
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 350px;
}
</style>
```

#### Create `components/ResultsPanel/Charts/DoughnutChart.vue`
```vue
<template>
  <div class="chart-container" :style="{ height }">
    <Doughnut :data="data" :options="mergedOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { merge } from 'lodash-es'
import { DEFAULT_DOUGHNUT_OPTIONS } from '@/constants/chartDefaults'

const props = defineProps<{
  data: any
  options?: any
  height?: string
}>()

const mergedOptions = computed(() => {
  if (!props.options) return DEFAULT_DOUGHNUT_OPTIONS
  return merge({}, DEFAULT_DOUGHNUT_OPTIONS, props.options)
})
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}
</style>
```

---

## Day 4: Base Widgets (Part 1)

### Create `components/ResultsPanel/Widgets/MetricCard.vue`
```vue
<template>
  <div class="metric-card" :class="`metric-card-${type}`">
    <div class="metric-card-value">{{ value }}</div>
    <div class="metric-card-label">{{ label }}</div>
    <div v-if="showBar && percentage !== undefined" class="metric-card-bar">
      <div 
        class="metric-bar-fill" 
        :class="`${type}-bar`"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number | string
  label: string
  type?: 'success' | 'failure' | 'unknown'
  percentage?: number
  showBar?: boolean
}>(), {
  type: 'unknown',
  showBar: true
})
</script>

<style scoped>
.metric-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.metric-card-value {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.metric-card-label {
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.metric-card-bar {
  height: 6px;
  background: #F3F4F6;
  border-radius: 3px;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.success-bar {
  background: #059669;
}

.failure-bar {
  background: #DC2626;
}

.unknown-bar {
  background: #6B7280;
}
</style>
```

### Create `components/ResultsPanel/Widgets/NarrativeBlock.vue`
```vue
<template>
  <div class="narrative-block">
    <div v-if="icon" class="narrative-icon">{{ icon }}</div>
    <p class="narrative-text" v-html="text"></p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string
  icon?: string
}>()
</script>

<style scoped>
.narrative-block {
  display: flex;
  gap: 12px;
  padding: 16px 0;
}

.narrative-icon {
  font-size: 24px;
  line-height: 1.6;
  flex-shrink: 0;
}

.narrative-text {
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
}

.narrative-text strong {
  color: #111827;
  font-weight: 600;
}
</style>
```

---

## Day 5: Base Widgets (Part 2) & Testing

### Morning: Remaining Widgets

#### Create `components/Shared/DifficultyBadge.vue`
```vue
<template>
  <span class="difficulty-badge" :class="difficultyClass">
    {{ displayText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getDifficultyClass } from '@/utils/calculators'

const props = defineProps<{
  difficulty: number | string
}>()

const difficultyClass = computed(() => {
  const num = typeof props.difficulty === 'string' 
    ? parseFloat(props.difficulty) 
    : props.difficulty
  return getDifficultyClass(num)
})

const displayText = computed(() => {
  if (typeof props.difficulty === 'string') return props.difficulty
  return `${props.difficulty}/5`
})
</script>

<style scoped>
.difficulty-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.diff-easy {
  background: #D1FAE5;
  color: #059669;
}

.diff-medium {
  background: #FEF3C7;
  color: #D97706;
}

.diff-hard {
  background: #FEE2E2;
  color: #DC2626;
}
</style>
```

#### Create `components/Shared/Pagination.vue`
```vue
<template>
  <div class="pagination">
    <button 
      class="page-btn" 
      :disabled="currentPage === 1"
      @click="emit('page-change', currentPage - 1)"
    >
      ← Previous
    </button>
    
    <span class="page-info">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    
    <button 
      class="page-btn"
      :disabled="currentPage === totalPages"
      @click="emit('page-change', currentPage + 1)"
    >
      Next →
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
}

.page-btn {
  padding: 10px 20px;
  background: #1E40AF;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #1E3A8A;
  transform: translateY(-2px);
}

.page-btn:disabled {
  background: #E5E7EB;
  color: #9CA3AF;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-info {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
</style>
```

### Afternoon: Testing & Documentation

#### Run all tests
```bash
npm run test
```

#### Create documentation: `components/ResultsPanel/Charts/README.md`
```markdown
# Chart Components

Reusable chart wrappers for Chart.js components.

## Usage

### BarChart
\`\`\`vue
<BarChart 
  :data="chartData" 
  :options="customOptions"
  height="400px"
/>
\`\`\`

### Props
- `data`: Chart.js data object (required)
- `options`: Custom Chart.js options (optional, merges with defaults)
- `height`: Container height (optional, default: 300px)

## Examples
See Storybook for live examples.
```

---

## End of Week 1 Checklist

- [ ] All constants created and tested
- [ ] All utils created with unit tests
- [ ] 4 base chart components created
- [ ] 7 base widgets created
- [ ] All tests passing (>80% coverage)
- [ ] Documentation written
- [ ] Code reviewed by team
- [ ] No breaking changes to existing code

---

## Next Steps (Week 2)

Begin extracting composables:
1. Create `composables/usePatternData.ts`
2. Create `composables/useSkillData.ts`
3. Continue with remaining composables

**Goal:** Extract all business logic from MultiPostPatternReport.vue into reusable composables.
