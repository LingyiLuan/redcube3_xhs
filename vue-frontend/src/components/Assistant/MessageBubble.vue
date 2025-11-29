<template>
  <div :class="['message-bubble', `message-${message.role}`]">
    <div class="message-avatar">
      <User v-if="message.role === 'user'" :size="16" />
      <Sparkles v-else :size="16" />
    </div>
    <div class="message-content">
      <div class="message-text">{{ message.content }}</div>
      <div class="message-timestamp">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Sparkles } from 'lucide-vue-next'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

defineProps<{
  message: Message
}>()

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-user .message-avatar {
  background: #E5E7EB;
  color: #374151;
}

.message-assistant .message-avatar {
  background: #1E3A8A;
  color: white;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-user .message-text {
  background: #F3F4F6;
  color: #111827;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-text {
  background: #F3F4F6;
  color: #374151;
  border-bottom-left-radius: 4px;
}

.message-timestamp {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
  padding-left: 16px;
}
</style>
