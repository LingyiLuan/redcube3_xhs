<template>
  <div class="logs-tab">
    <div class="logs-header">
      <h3 class="logs-title">Execution Logs</h3>
      <button @click="clearLogs" class="clear-btn">
        Clear Logs
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="logs.length === 0" class="empty-state">
      <Terminal :size="48" class="empty-icon" />
      <h4 class="empty-title">No Logs Yet</h4>
      <p class="empty-description">
        Node execution logs will appear here
      </p>
    </div>

    <!-- Logs List -->
    <div v-else class="logs-list">
      <div
        v-for="log in logs"
        :key="log.id"
        :class="['log-entry', `log-${log.type}`]"
      >
        <div class="log-timestamp">{{ formatTime(log.timestamp) }}</div>
        <div class="log-message">{{ log.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Terminal } from 'lucide-vue-next'

interface Log {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
}

const logs = ref<Log[]>([])

function clearLogs() {
  logs.value = []
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Add a sample log for demonstration
logs.value.push({
  id: '1',
  type: 'info',
  message: 'Workflow execution logs will appear here',
  timestamp: new Date()
})
</script>

<style scoped>
.logs-tab {
  @apply flex flex-col h-full;
}

.logs-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800;
}

.logs-title {
  @apply text-base font-bold text-gray-900 dark:text-gray-100;
}

.clear-btn {
  @apply px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors;
}

/* Empty State */
.empty-state {
  @apply flex flex-col items-center justify-center flex-1 text-center px-4;
}

.empty-icon {
  @apply text-gray-400 dark:text-gray-600 mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.empty-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Logs List */
.logs-list {
  @apply flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900 font-mono text-sm;
}

.log-entry {
  @apply flex gap-3 py-2 px-3 rounded;
}

.log-timestamp {
  @apply text-gray-500 shrink-0;
}

.log-message {
  @apply flex-1;
}

.log-info {
  @apply text-blue-400;
}

.log-success {
  @apply text-green-400;
}

.log-warning {
  @apply text-yellow-400;
}

.log-error {
  @apply text-red-400;
}
</style>
