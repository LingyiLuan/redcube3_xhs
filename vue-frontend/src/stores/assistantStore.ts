// @ts-nocheck
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, AssistantContext } from '@/types/assistant'
import { assistantService } from '@/services/assistantService'

export const useAssistantStore = defineStore('assistant', () => {
  // ===== STATE =====
  const messages = ref<Message[]>([])
  const isLoading = ref(false)

  // ===== ACTIONS =====

  async function sendMessage(text: string, context: AssistantContext) {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    messages.value.push(userMessage)
    isLoading.value = true

    try {
      // Call RAG backend
      const response = await assistantService.query(text, context)

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions || []
      }

      messages.value.push(assistantMessage)

      console.log('[AssistantStore] Message sent successfully')

      return response
    } catch (error: any) {
      console.error('[AssistantStore] Failed to send message:', error)

      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }

      messages.value.push(errorMessage)

      throw error
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages() {
    messages.value = []
    console.log('[AssistantStore] Messages cleared')
  }

  function removeMessage(messageId: string) {
    messages.value = messages.value.filter(m => m.id !== messageId)
  }

  // ===== UTILITIES =====

  function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // ===== RETURN PUBLIC API =====

  return {
    // State
    messages,
    isLoading,

    // Actions
    sendMessage,
    clearMessages,
    removeMessage
  }
})
