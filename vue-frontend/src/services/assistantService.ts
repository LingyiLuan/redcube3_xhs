import apiClient from './apiClient'
import type { AssistantContext, AssistantResponse } from '@/types/assistant'

export const assistantService = {
  /**
   * Send message to AI Assistant with RAG context
   */
  async query(message: string, context?: AssistantContext): Promise<AssistantResponse> {
    const response = await apiClient.post('/assistant/query', {
      query: message,
      context
    })

    return response.data
  }
}
