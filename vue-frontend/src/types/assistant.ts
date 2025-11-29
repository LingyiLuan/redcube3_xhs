export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: Suggestion[]
}

export interface Suggestion {
  id: string
  type: 'add_node' | 'analyze' | 'insight'
  title: string
  description?: string
  data?: any
}

export interface AssistantContext {
  workflowId: string
  nodes: any[]
  currentNodeId?: string
}

export interface AssistantResponse {
  success: boolean
  response?: string
  message?: string
  actions?: Array<{
    type: string
    label?: string
    data?: any
  }>
  type?: string
  timestamp?: string
}
