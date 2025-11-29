<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { User, Sparkles, Plus } from 'lucide-vue-next'
import type { Message } from '@/types/assistant'
import { useWorkflowStore } from '@/stores/workflowStore'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const workflowStore = useWorkflowStore()

const isUser = computed(() => props.message.role === 'user')
const isAssistant = computed(() => props.message.role === 'assistant')

const formattedTime = computed(() => {
  return props.message.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const hasSuggestions = computed(() => {
  return props.message.suggestions && props.message.suggestions.length > 0
})

function handleAddToCanvas(suggestion: any) {
  // Add suggestion as a new node to canvas
  workflowStore.addNode({
    type: 'input',
    position: {
      x: Math.random() * 300 + 150,
      y: Math.random() * 200 + 150
    },
    data: {
      label: suggestion.title || 'AI Suggestion',
      content: suggestion.content || suggestion.text || '',
      metadata: {
        source: 'ai-assistant',
        suggestionId: suggestion.id
      }
    }
  })
}
</script>

<template>
  <div :class="['chat-message', isUser ? 'user-message' : 'assistant-message']">
    <!-- Avatar -->
    <div class="message-avatar">
      <component :is="isUser ? User : Sparkles" :size="16" />
    </div>

    <!-- Content -->
    <div class="message-content-wrapper">
      <!-- Text Content -->
      <div class="message-bubble">
        <p class="message-text">{{ message.content }}</p>
        <span class="message-time">{{ formattedTime }}</span>
      </div>

      <!-- Suggestions (for assistant messages) -->
      <div v-if="isAssistant && hasSuggestions" class="suggestions-list">
        <div
          v-for="(suggestion, index) in message.suggestions"
          :key="index"
          class="suggestion-card"
        >
          <div class="suggestion-content">
            <h5 v-if="suggestion.title" class="suggestion-title">
              {{ suggestion.title }}
            </h5>
            <p class="suggestion-text">
              {{ suggestion.content || suggestion.text }}
            </p>
          </div>
          <button
            @click="handleAddToCanvas(suggestion)"
            class="add-to-canvas-btn"
            title="Add to canvas"
          >
            <Plus :size="16" />
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  @apply flex gap-3;
}

.user-message {
  @apply flex-row-reverse;
}

.assistant-message {
  @apply flex-row;
}

/* Avatar */
.message-avatar {
  @apply flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center;
}

.user-message .message-avatar {
  @apply bg-blue-500 text-white;
}

.assistant-message .message-avatar {
  @apply bg-gradient-to-br from-purple-500 to-blue-500 text-white;
}

/* Content Wrapper */
.message-content-wrapper {
  @apply flex flex-col gap-2 max-w-[85%];
}

.user-message .message-content-wrapper {
  @apply items-end;
}

.assistant-message .message-content-wrapper {
  @apply items-start;
}

/* Message Bubble */
.message-bubble {
  @apply relative px-4 py-2 rounded-2xl;
}

.user-message .message-bubble {
  @apply bg-blue-500 text-white;
  border-bottom-right-radius: 4px;
}

.assistant-message .message-bubble {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  border-bottom-left-radius: 4px;
}

.message-text {
  @apply text-sm leading-relaxed whitespace-pre-wrap break-words;
}

.message-time {
  @apply block text-xs mt-1 opacity-70;
}

/* Suggestions */
.suggestions-list {
  @apply flex flex-col gap-2 w-full;
}

.suggestion-card {
  @apply flex flex-col gap-2 p-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm;
}

.suggestion-content {
  @apply flex flex-col gap-1;
}

.suggestion-title {
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

.suggestion-text {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.add-to-canvas-btn {
  @apply flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all;
}
</style>
