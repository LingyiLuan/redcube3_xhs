<script setup lang="ts">
// @ts-nocheck
import { ref, computed } from 'vue'
import { MessageSquare, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-vue-next'
import { useAssistantStore } from '@/stores/assistantStore'
import { useWorkflowStore } from '@/stores/workflowStore'
import { storeToRefs } from 'pinia'
import ChatMessage from './ChatMessage.vue'
import MessageInput from './MessageInput.vue'

const assistantStore = useAssistantStore()
const workflowStore = useWorkflowStore()

const { messages, isLoading } = storeToRefs(assistantStore)
const userInput = ref('')

const isOpen = ref(false)
const isMinimized = ref(false)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    isMinimized.value = false
  }
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const handleClose = () => {
  isOpen.value = false
  isMinimized.value = false
}

const handleSendMessage = async (text?: string) => {
  const prompt = typeof text === 'string' ? text : userInput.value
  if (!prompt.trim()) {
    return
  }

  // Build context from current workflow
  const context = {
    workflowId: workflowStore.workflowId,
    nodes: workflowStore.nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.data.label,
      content: n.data.content,
      status: n.data.status
    })),
    currentNodeId: workflowStore.selectedNodeId || undefined
  }

  try {
    await assistantStore.sendMessage(prompt, context)
    userInput.value = ''
  } catch (error) {
    console.error('[AiAssistant] Failed to send message:', error)
  }
}

const handleClearChat = () => {
  if (confirm('Clear all messages?')) {
    assistantStore.clearMessages()
  }
}

const messageCount = computed(() => messages.value.length)
const hasMessages = computed(() => messageCount.value > 0)
</script>

<template>
  <div class="ai-assistant">
    <!-- Floating Action Button (when closed) -->
    <button
      v-if="!isOpen"
      @click="toggleOpen"
      class="assistant-fab"
      aria-label="Open AI Assistant"
    >
      <Sparkles :size="24" />
      <span v-if="hasMessages" class="badge">{{ messageCount }}</span>
    </button>

    <!-- Assistant Panel (when open) -->
    <div v-if="isOpen" :class="['assistant-panel', { 'minimized': isMinimized }]">
      <!-- Header -->
      <div class="assistant-header">
        <div class="header-left">
          <MessageSquare :size="20" />
          <h3>AI Assistant</h3>
          <span v-if="hasMessages" class="message-count">{{ messageCount }}</span>
        </div>
        <div class="header-actions">
          <button
            @click="toggleMinimize"
            class="header-btn"
            :aria-label="isMinimized ? 'Expand' : 'Minimize'"
          >
            <component :is="isMinimized ? ChevronUp : ChevronDown" :size="18" />
          </button>
          <button
            v-if="hasMessages"
            @click="handleClearChat"
            class="header-btn"
            aria-label="Clear messages"
          >
            <X :size="18" />
          </button>
          <button
            @click="handleClose"
            class="header-btn close-btn"
            aria-label="Close assistant"
          >
            <X :size="20" />
          </button>
        </div>
      </div>

      <!-- Chat Content (hidden when minimized) -->
      <div v-if="!isMinimized" class="assistant-content">
        <!-- Empty State -->
        <div v-if="!hasMessages" class="empty-state">
          <Sparkles :size="48" class="empty-icon" />
          <h4>AI Assistant Ready</h4>
          <p>Ask me anything about your workflow or content analysis!</p>
          <div class="suggestions">
            <button @click="handleSendMessage('What can you help me with?')" class="suggestion-btn">
              What can you help me with?
            </button>
            <button @click="handleSendMessage('Analyze my workflow')" class="suggestion-btn">
              Analyze my workflow
            </button>
            <button @click="handleSendMessage('Suggest improvements')" class="suggestion-btn">
              Suggest improvements
            </button>
          </div>
        </div>

        <!-- Messages List -->
        <div v-else class="messages-list">
          <ChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
          />

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="loading-message">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <!-- Message Input -->
            <MessageInput
              v-model="userInput"
              :is-loading="isLoading"
              @send="handleSendMessage()"
            />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant {
  @apply fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50;
}

/* Floating Action Button */
.assistant-fab {
  @apply relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110;
}

.assistant-fab .badge {
  @apply absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center;
}

/* Assistant Panel */
.assistant-panel {
  @apply flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden;
  width: 400px;
  max-height: 600px;
  transition: max-height 0.3s ease;
}

.assistant-panel.minimized {
  max-height: 60px;
}

/* Header */
.assistant-header {
  @apply flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white;
}

.header-left {
  @apply flex items-center gap-2;
}

.header-left h3 {
  @apply text-lg font-semibold;
}

.message-count {
  @apply px-2 py-0.5 bg-white/20 text-xs rounded-full;
}

.header-actions {
  @apply flex items-center gap-1;
}

.header-btn {
  @apply p-1.5 rounded-lg hover:bg-white/20 transition-colors;
}

.close-btn {
  @apply hover:bg-red-500/50;
}

/* Content */
.assistant-content {
  @apply flex flex-col flex-1 overflow-hidden;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.empty-icon {
  @apply text-purple-500 dark:text-purple-400 mb-4;
}

.empty-state h4 {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.empty-state p {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-6;
}

.suggestions {
  @apply flex flex-col gap-2 w-full;
}

.suggestion-btn {
  @apply px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors;
}

/* Messages List */
.messages-list {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

/* Custom Scrollbar */
.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.messages-list::-webkit-scrollbar-thumb {
  @apply bg-gray-400 dark:bg-gray-600 rounded;
}

/* Loading Indicator */
.loading-message {
  @apply flex items-center justify-start;
}

.typing-indicator {
  @apply flex items-center gap-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl;
}

.typing-indicator span {
  @apply w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
