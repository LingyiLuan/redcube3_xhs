// @ts-nocheck
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Message } from '@/types/assistant'
import { assistantChatService, type AssistantChat, type AssistantMessage } from '@/services/assistantChatService'
import { useAuthStore } from './authStore'
import { useUIStore } from './uiStore'

function mapMessage(raw: AssistantMessage): Message {
  return {
    id: raw.id.toString(),
    role: raw.role,
    content: raw.content,
    timestamp: new Date(raw.createdAt)
  }
}

export const useAssistantChatStore = defineStore('assistantChat', () => {
  const chats = ref<AssistantChat[]>([])
  const activeChatId = ref<number | null>(null)
  const messages = ref<Message[]>([])
  const isLoadingChats = ref(false)
  const isLoadingMessages = ref(false)
  const error = ref<string | null>(null)

  const authStore = useAuthStore()
  const uiStore = useUIStore()

  function reset() {
    chats.value = []
    messages.value = []
    activeChatId.value = null
    error.value = null
  }

  function updateChatPreview(chatId: number, preview: string) {
    const index = chats.value.findIndex(chat => chat.id === chatId)
    if (index === -1) return

    const updatedAt = new Date().toISOString()
    const updatedChat = {
      ...chats.value[index],
      updatedAt,
      lastMessagePreview: preview
    }

    const nextChats = [...chats.value]
    nextChats.splice(index, 1)
    nextChats.unshift(updatedChat)
    chats.value = nextChats
  }

  async function fetchChats() {
    if (!authStore.isAuthenticated) {
      reset()
      return
    }

    isLoadingChats.value = true
    try {
      chats.value = await assistantChatService.listChats()
      if (!activeChatId.value && chats.value.length > 0) {
        await loadChat(chats.value[0].id)
      }
    } catch (err: any) {
      console.error('[AssistantChatStore] Failed to load chats', err)
      error.value = err.message || 'Failed to load assistant chats'
    } finally {
      isLoadingChats.value = false
    }
  }

  async function startNewChat(title?: string) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    const chat = await assistantChatService.createChat(title)
    chats.value = [chat, ...chats.value]
    activeChatId.value = chat.id
    messages.value = []
    return chat
  }

  async function ensureActiveChat(title?: string) {
    if (activeChatId.value) {
      return activeChatId.value
    }

    const chat = await startNewChat(title)
    return chat.id
  }

  async function loadChat(chatId: number) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }

    isLoadingMessages.value = true
    try {
      const { chat, messages: rawMessages } = await assistantChatService.fetchChat(chatId)
      activeChatId.value = chat.id
      messages.value = rawMessages.map(mapMessage)
    } catch (err: any) {
      console.error('[AssistantChatStore] Failed to load chat', err)
      uiStore.showToast('Failed to load conversation', 'error')
      throw err
    } finally {
      isLoadingMessages.value = false
    }
  }

  async function appendMessage(role: 'user' | 'assistant', content: string, metadata?: any) {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    const chatId = await ensureActiveChat()

    const localMessage: Message = {
      id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      timestamp: new Date()
    }

    messages.value.push(localMessage)
    updateChatPreview(chatId, content)

    try {
      const persisted = await assistantChatService.appendMessage(chatId, { role, content, metadata })
      localMessage.id = persisted.id.toString()
    } catch (err) {
      console.error('[AssistantChatStore] Failed to persist message', err)
    }

    return localMessage
  }

  async function deleteActiveChat() {
    if (!authStore.isAuthenticated) {
      throw new Error('Authentication required')
    }
    if (!activeChatId.value) return

    await assistantChatService.deleteChat(activeChatId.value)
    chats.value = chats.value.filter(chat => chat.id !== activeChatId.value)
    messages.value = []
    activeChatId.value = null

    if (chats.value.length > 0) {
      await loadChat(chats.value[0].id)
    }
  }

  // ✅ CRITICAL FIX: Watch must be BEFORE return statement to actually run
  // This clears stale chat IDs when user logs out or switches accounts
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth) {
      reset()
    }
  })

  return {
    chats,
    messages,
    activeChatId,
    isLoadingChats,
    isLoadingMessages,
    error,
    fetchChats,
    startNewChat,
    ensureActiveChat,
    loadChat,
    appendMessage,
    deleteActiveChat,
    reset
  }
})

