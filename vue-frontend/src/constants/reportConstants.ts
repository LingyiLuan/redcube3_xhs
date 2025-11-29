/**
 * Report Constants
 * Centralized configuration for MultiPostPatternReport
 * Extracted from 7,599-line component as part of modularization effort
 */

// ============================================================================
// MCKINSEY DESIGN SYSTEM COLORS
// ============================================================================

export const MCKINSEY_COLORS = {
  // Primary Palette
  primaryBlue: '#1E40AF',
  secondaryBlue: '#60A5FA',
  lightBlue: '#DBEAFE',
  darkBlue: '#1E3A8A',

  // Success/Positive
  successGreen: '#059669',
  lightGreen: '#D1FAE5',
  darkGreen: '#065F46',

  // Warning/Caution
  warningYellow: '#F59E0B',
  lightYellow: '#FEF3C7',
  darkYellow: '#92400E',

  // Error/Negative
  errorRed: '#DC2626',
  lightRed: '#FEE2E2',
  darkRed: '#991B1B',

  // Neutral Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Accent Colors
  purple: '#7C3AED',
  lightPurple: '#E9D5FF',
  orange: '#EA580C',
  teal: '#14B8A6',

  // Chart-Specific
  chartBlue: '#2563EB',
  chartGreen: '#10B981',
  chartYellow: '#FBBF24',
  chartRed: '#EF4444',
  chartPurple: '#8B5CF6',
  chartOrange: '#F97316',
  chartTeal: '#06B6D4',
  chartPink: '#EC4899'
} as const

// ============================================================================
// PRIORITY THRESHOLDS
// ============================================================================

export const PRIORITY_THRESHOLDS = {
  // Skills Priority Matrix
  CRITICAL: 75,      // ≥75% = Critical Priority
  HIGH: 60,          // 60-74% = High Priority
  MEDIUM: 40,        // 40-59% = Medium Priority
  LOW: 0,            // <40% = Low Priority

  // Success Impact
  HIGH_IMPACT: 70,
  MEDIUM_IMPACT: 50,
  LOW_IMPACT: 30,

  // Market Demand
  HIGH_DEMAND: 60,
  MEDIUM_DEMAND: 40,
  LOW_DEMAND: 20,

  // Confidence Scores
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4
} as const

// ============================================================================
// CHART DIMENSIONS
// ============================================================================

export const CHART_DIMENSIONS = {
  // Standard chart heights
  SMALL_CHART_HEIGHT: 200,
  MEDIUM_CHART_HEIGHT: 300,
  LARGE_CHART_HEIGHT: 400,
  XLARGE_CHART_HEIGHT: 500,

  // Priority Matrix
  MATRIX_SIZE: 500,
  MATRIX_PADDING: 60,

  // Skill dot sizes
  MIN_DOT_SIZE: 8,
  MAX_DOT_SIZE: 24,

  // Bar chart
  BAR_THICKNESS: 24,
  BAR_MAX_WIDTH: 60,

  // Margins
  CHART_MARGIN: {
    top: 20,
    right: 30,
    bottom: 50,
    left: 60
  }
} as const

// ============================================================================
// DATA LIMITS
// ============================================================================

export const DATA_LIMITS = {
  // Top N items to display
  TOP_SKILLS: 10,
  TOP_COMPANIES: 15,
  TOP_QUESTIONS: 20,
  TOP_SUCCESS_FACTORS: 8,
  TOP_FAILURE_FACTORS: 8,

  // Chart data points
  MAX_CHART_ITEMS: 20,
  MAX_HEATMAP_ITEMS: 10,
  MAX_SCATTER_POINTS: 50,

  // Text limits
  MAX_SKILL_NAME_LENGTH: 30,
  MAX_COMPANY_NAME_LENGTH: 40,
  MAX_QUESTION_LENGTH: 120,
  MAX_INSIGHT_LENGTH: 200
} as const

// ============================================================================
// SKILL CATEGORIES
// ============================================================================

export const SKILL_CATEGORIES = {
  TECHNICAL: [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust',
    'SQL', 'NoSQL', 'GraphQL', 'REST API'
  ],
  FRAMEWORKS: [
    'React', 'Vue', 'Angular', 'Next.js', 'Express', 'Django', 'Flask',
    'FastAPI', 'Spring Boot', 'Rails'
  ],
  CLOUD: [
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'CI/CD', 'Jenkins', 'GitHub Actions'
  ],
  DATA: [
    'Machine Learning', 'Deep Learning', 'Data Science', 'Analytics',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Spark'
  ],
  SOFT: [
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork',
    'Time Management', 'Critical Thinking', 'Adaptability'
  ]
} as const

// ============================================================================
// INTERVIEW STAGES
// ============================================================================

export const INTERVIEW_STAGES = [
  'Phone Screen',
  'Technical Screen',
  'Coding Challenge',
  'System Design',
  'Behavioral',
  'Onsite',
  'Final Round',
  'Offer'
] as const

export const INTERVIEW_STAGE_ORDER: Record<string, number> = {
  'Phone Screen': 1,
  'Technical Screen': 2,
  'Coding Challenge': 3,
  'System Design': 4,
  'Behavioral': 5,
  'Onsite': 6,
  'Final Round': 7,
  'Offer': 8
} as const

// ============================================================================
// SENIORITY LEVELS
// ============================================================================

export const SENIORITY_LEVELS = [
  'Intern',
  'Entry Level',
  'Junior',
  'Mid-Level',
  'Senior',
  'Staff',
  'Principal',
  'Lead'
] as const

export const SENIORITY_ORDER: Record<string, number> = {
  'Intern': 1,
  'Entry Level': 2,
  'Junior': 3,
  'Mid-Level': 4,
  'Senior': 5,
  'Staff': 6,
  'Principal': 7,
  'Lead': 8
} as const

// ============================================================================
// DIFFICULTY RATINGS
// ============================================================================

export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  VERY_HARD: 'Very Hard'
} as const

export const DIFFICULTY_COLORS: Record<string, string> = {
  'Easy': MCKINSEY_COLORS.successGreen,
  'Medium': MCKINSEY_COLORS.warningYellow,
  'Hard': MCKINSEY_COLORS.orange,
  'Very Hard': MCKINSEY_COLORS.errorRed
} as const

// ============================================================================
// TIME DURATIONS
// ============================================================================

export const PREPARATION_TIMEFRAMES = {
  SHORT: '1-2 weeks',
  MEDIUM: '3-4 weeks',
  LONG: '1-2 months',
  EXTENDED: '3+ months'
} as const

export const INTERVIEW_DURATIONS = {
  PHONE_SCREEN: 30,      // minutes
  TECHNICAL_SCREEN: 45,
  CODING_CHALLENGE: 90,
  SYSTEM_DESIGN: 60,
  BEHAVIORAL: 45,
  ONSITE: 240,           // 4 hours
  FINAL_ROUND: 60
} as const

// ============================================================================
// INSIGHT TEMPLATES
// ============================================================================

export const INSIGHT_TEMPLATES = {
  HIGH_DEMAND_SKILL: 'appears in {percentage}% of interviews',
  SUCCESS_CORRELATION: 'correlates with {percentage}% higher success rate',
  COMMON_FAILURE: 'identified as failure point in {count} posts',
  TRENDING_SKILL: 'showing {trend} trend over past {months} months',
  COMPANY_REQUIREMENT: 'required by {count} companies in dataset'
} as const

// ============================================================================
// FORMATTING
// ============================================================================

export const NUMBER_FORMATS = {
  PERCENTAGE_DECIMALS: 1,
  SCORE_DECIMALS: 2,
  COUNT_DECIMALS: 0,
  CURRENCY_DECIMALS: 0
} as const

export const DATE_FORMATS = {
  SHORT: 'MMM DD',
  MEDIUM: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  ISO: 'YYYY-MM-DD'
} as const

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  MIN_POSTS_FOR_ANALYSIS: 5,
  MIN_CONFIDENCE_SCORE: 0.5,
  MIN_SKILL_FREQUENCY: 2,
  MIN_COMPANY_SAMPLE: 3,
  MAX_AGE_DAYS: 365
} as const

// ============================================================================
// ANIMATION TIMINGS
// ============================================================================

export const ANIMATION = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const Z_INDEX = {
  TOOLTIP: 10000,
  MODAL: 9000,
  OVERLAY: 8000,
  DROPDOWN: 7000,
  STICKY_HEADER: 6000,
  FLOATING_BUTTON: 5000
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'
export type SkillCategory = keyof typeof SKILL_CATEGORIES
export type InterviewStage = typeof INTERVIEW_STAGES[number]
export type SeniorityLevel = typeof SENIORITY_LEVELS[number]
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS]
