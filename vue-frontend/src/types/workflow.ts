// Node Types
export type NodeType = 'input' | 'analysis' | 'results' | 'output' | 'analyze'

export type NodeStatus = 'idle' | 'analyzing' | 'completed' | 'error' | 'cancelled'

export interface NodeData {
  label: string
  content?: string
  status?: NodeStatus
  analysisResult?: AnalysisResult | ExecutionResults
  error?: string
  metadata?: Record<string, any>
  createdAt?: string
  updatedAt?: string
  analyzedAt?: string
  redditUrl?: string
  postId?: string
  company?: string
  role?: string
  level?: string
  outcome?: string
  [key: string]: any
}

export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: NodeData
  selected?: boolean
  draggable?: boolean
  connectable?: boolean
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  animated?: boolean
  label?: string
}

// Analysis Types
export interface AnalysisResult {
  id?: number
  summary?: string
  insights?: string[]
  sentiment?: string
  categories?: string[]
  keywords?: string[]
  createdAt?: string
  created_at?: string
  aiProvider?: string
  [key: string]: any
}

export interface ExecutionResults {
  success: boolean
  mode: 'single' | 'batch'
  timestamp: string
  totalNodes: number
  successCount: number
  failureCount: number
  results: Array<{
    nodeId: string
    success: boolean
    result?: AnalysisResult
    error?: string
  }>
  connections?: any[]
  crossPostPatterns?: any
  batchInsights?: any
  totalConnections?: number
  pattern_analysis?: any
  individual_analyses?: any[] // User's uploaded posts with company/role/outcome data
  similar_posts?: any[] // RAG posts from backend
  batchId?: string // Backend batch ID for report matching
  extraction_warning?: any // Degraded mode warning
  features_available?: any // Feature availability flags
}

// Workflow Types
export interface Workflow {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  version: number
  createdAt?: string
  updatedAt?: string
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}
