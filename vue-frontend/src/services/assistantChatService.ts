import apiClient from './apiClient'

export interface AssistantChat {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  lastMessagePreview?: string | null
}

export interface AssistantMessage {
  id: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export const assistantChatService = {
  async listChats(): Promise<AssistantChat[]> {
    const response = await apiClient.get('/assistant/chats')
    return response.data.chats || []
  },

  async createChat(title?: string): Promise<AssistantChat> {
    const response = await apiClient.post('/assistant/chats', { title })
    return response.data.chat
  },

  async fetchChat(chatId: number | string): Promise<{ chat: AssistantChat; messages: AssistantMessage[] }> {
    const response = await apiClient.get(`/assistant/chats/${chatId}`)
    return response.data
  },

  async appendMessage(chatId: number | string, payload: { role: 'user' | 'assistant'; content: string; metadata?: any }) {
    const response = await apiClient.post(`/assistant/chats/${chatId}/messages`, payload)
    return response.data.message
  },

  async deleteChat(chatId: number | string) {
    await apiClient.delete(`/assistant/chats/${chatId}`)
  }
}

