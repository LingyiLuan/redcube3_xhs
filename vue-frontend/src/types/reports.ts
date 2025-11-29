export interface AnalysisReport {
  id: string
  nodeId: string
  workflowId: string
  result: AnalysisResult
  timestamp: Date | string
  isRead: boolean
  batchId?: string
  analysisId?: number
  date?: Date | string
}

export type AnalysisType = 'single' | 'batch' | 'legacy'

export interface SourcePost {
  post_id?: string | number
  title?: string
  company?: string
  role?: string
  role_type?: string
  url?: string
  difficulty?: string | number
  outcome?: string
  citations?: number
  views?: number
}

export interface PatternAnalysis {
  summary?: string
  key_findings?: string[]
  recommendations?: string[]
  company_trends?: CompanyTrend[]
  stage_by_company?: Record<string, any>
  temporal_data?: any
  source_posts?: SourcePost[]
  seed_company?: string
}

export interface CompanyTrend {
  company?: string
  total_posts?: number
  success_rate?: string | number
  avg_difficulty?: string | number
  top_skill?: string
  top_role?: string
  is_seed_company?: boolean
}

export interface SimilarPost {
  post_id?: string | number
  title?: string
  company?: string
  outcome?: string
  difficulty?: string | number
  url?: string
  role_type?: string
  citations?: number
}

export interface SkillComparisonMetric {
  percentage: number | string
  mentioned_in_similar?: number
  mentioned_in_seed?: number
}

export interface ComparativeMetrics {
  total_similar_posts?: number
  same_company?: {
    count?: number
    percentage?: number
  }
  same_role?: {
    count?: number
    percentage?: number
  }
  outcome_distribution?: {
    success_rate?: string | number
    success?: number
    failure?: number
  }
  similarity_insight?: string
  skill_comparison?: Record<string, SkillComparisonMetric>
}

export interface UniqueAspect {
  skill?: string
  rarity_score?: number | string
  insight?: string
  mentioned_in?: number
}

export interface UniqueAspects {
  uniqueness_summary?: string
  is_unique?: boolean
  rare_skills?: UniqueAspect[]
}

export interface RecommendedResource {
  title?: string
  description?: string
  type?: string
  url?: string
  source?: string
}

export interface EnhancedIntelligence {
  summary?: string
  insights?: string[]
  recommendations?: string[]
}

export interface AnalysisOverview {
  company?: string
  role?: string
  outcome?: string
  difficulty?: string
  interview_type?: string
  date?: string
  level?: string
  location?: string
}

export interface AnalysisResult {
  id?: number
  type?: AnalysisType
  summary?: string
  sentiment?: string
  themes?: string[]
  insights?: string[]
  rawData?: any
  overview?: AnalysisOverview
  pattern_analysis?: PatternAnalysis | null
  individual_analyses?: Array<Record<string, any>>
  similar_posts?: SimilarPost[]
  similarExperiences?: SimilarPost[]
  extraction_warning?: string | null
  features_available?: Record<string, any> | null
  enhanced_intelligence?: EnhancedIntelligence | null
  comparative_metrics?: ComparativeMetrics
  unique_aspects?: UniqueAspects
  recommended_resources?: RecommendedResource[]
  post_summary?: Record<string, any>
  cached?: boolean
  created_at?: string
  createdAt?: string
  [key: string]: any
}

export interface LearningMap {
  id: string
  reportIds: string[]
  userId: number
  title: string
  description?: string
  nodes: LearningMapNode[]
  edges: LearningMapEdge[]
  createdAt: Date | string
  updatedAt?: Date | string
  summary?: string
  difficulty?: string
  timeline_weeks?: number
  analysis_count?: number
  skills_roadmap?: SkillsRoadmap
  timeline?: LearningTimeline
  outcomes?: LearningOutcome[]
  next_steps?: LearningNextStep[]
  company_specific_insights?: LearningInsight[]
  pitfalls_narrative?: string
  foundation_posts?: SourcePost[]
  common_pitfalls?: LearningInsight[]
  readiness_checklist?: LearningChecklistItem[]
  improvement_areas?: LearningInsight[]
  resource_recommendations?: LearningResourceRecommendation[]
  preparation_expectations?: LearningExpectation[]
  company_tracks?: Array<Record<string, any>>
  analytics?: Record<string, any>
  milestones?: LearningMapMilestone[]
  milestone_source_mapping?: Record<string, string[]>
  [key: string]: any
}

export interface SkillsRoadmap {
  metadata?: {
    total_posts?: number
    total_problems?: number
    total_estimated_hours?: number
    priority_breakdown?: Record<string, number>
  }
  modules?: SkillsRoadmapModule[]
}

export interface SkillsRoadmapModule {
  title?: string
  description?: string
  priority?: string
  duration_hours?: number
  practice_problems?: PracticeProblem[]
  resources?: LearningResource[]
  stats?: Record<string, any>
}

export interface PracticeProblem {
  title?: string
  name?: string
  url?: string
  difficulty?: string
  leetcode_number?: string | number
  estimated_time?: number
  estimated_time_minutes?: number
}

export interface LearningResource {
  name?: string
  url?: string
  type?: string
}

export interface LearningTimeline {
  weeks?: LearningTimelineWeek[]
  [key: string]: any
}

export interface LearningTimelineWeek {
  week?: number
  title?: string
  narrative?: string
  topics?: string[]
  daily_plan?: DailyPlanEntry[]
  [key: string]: any
}

export interface DailyPlanEntry {
  day?: string
  focus?: string
  total_study_hours?: number
  morning_session?: SessionPlan
  afternoon_session?: SessionPlan
}

export interface SessionPlan {
  duration_minutes?: number
  activity?: string
  topics?: string[]
  resources?: LearningResource[]
  problems?: PracticeProblem[]
}

export interface LearningOutcome {
  title?: string
  description?: string
  impact_metrics?: string[]
}

export interface LearningNextStep {
  title?: string
  description?: string
  priority?: string
  status?: string
}

export interface LearningInsight {
  title?: string
  description?: string
  severity?: string
  category?: string
  narrative?: string
}

export interface LearningChecklistItem {
  label?: string
  completed?: boolean
}

export interface LearningResourceRecommendation {
  title?: string
  resources?: LearningResource[]
  summary?: string
}

export interface LearningExpectation {
  title?: string
  description?: string
}

export interface LearningMapMilestone {
  id?: string
  week?: number
  title?: string
  description?: string
  difficulty?: string
  action_items?: string[]
  sourcePostIds?: string[]
}

export interface LearningMapNode {
  id: string
  label: string
  type: 'concept' | 'skill' | 'resource' | 'milestone'
  description?: string
  x?: number
  y?: number
}

export interface LearningMapEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: 'prerequisite' | 'related' | 'leads_to'
}
