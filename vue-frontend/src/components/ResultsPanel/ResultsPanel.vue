<template>
  <!-- Modal Backdrop -->
  <Transition name="backdrop">
    <div
      v-if="resultsPanelStore.isPanelOpen"
      class="modal-backdrop"
      @click="resultsPanelStore.closePanel"
    />
  </Transition>

  <!-- Modal Panel -->
  <Transition name="modal-panel">
    <div
      v-if="resultsPanelStore.isPanelOpen"
      class="modal-container"
      @click.stop
    >
      <div class="modal-panel">
        <!-- Panel Header -->
        <div class="panel-header">
          <div class="panel-title">
            <span v-if="resultsPanelStore.activeContentType === 'report'" class="title-icon">📊</span>
            <span v-else-if="resultsPanelStore.activeContentType === 'learningMap'" class="title-icon">🗺️</span>
            <h3 class="title-text">
              {{ panelTitle }}
            </h3>
          </div>
          <button class="close-btn" @click="resultsPanelStore.closePanel" title="Close (Esc)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Panel Content -->
        <div class="panel-content">
          <ReportViewer
            v-if="resultsPanelStore.activeContentType === 'report' && resultsPanelStore.activeContentId"
            :report-id="resultsPanelStore.activeContentId"
          />
          <LearningMapViewer
            v-else-if="resultsPanelStore.activeContentType === 'learningMap' && resultsPanelStore.activeContentId"
            :map-id="resultsPanelStore.activeContentId"
          />
          <div v-else class="empty-state">
            <p>No content selected</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useResultsPanelStore } from '@/stores/resultsPanelStore'
import ReportViewer from './ReportViewer.vue'
import LearningMapViewer from './LearningMapViewer.vue'

const resultsPanelStore = useResultsPanelStore()

const panelTitle = computed(() => {
  if (resultsPanelStore.activeContentType === 'report') {
    return 'Analysis Report'
  } else if (resultsPanelStore.activeContentType === 'learningMap') {
    return 'Learning Map'
  }
  return 'Results'
})

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && resultsPanelStore.isPanelOpen) {
    resultsPanelStore.closePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Modal Backdrop */
.modal-backdrop {
  @apply fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40;
}

/* Backdrop Animation */
.backdrop-enter-active {
  transition: opacity 0.3s ease-out;
}

.backdrop-leave-active {
  transition: opacity 0.3s ease-in;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Modal Container (Full Screen) */
.modal-container {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8;
  pointer-events: none;
}

/* Modal Panel (Centered Card) */
.modal-panel {
  @apply w-full max-w-7xl h-full max-h-screen bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden;
  pointer-events: auto;
}

/* Panel Animation with Spring Effect */
.modal-panel-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-panel-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 1, 1);
}

.modal-panel-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.modal-panel-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

/* Panel Header */
.panel-header {
  @apply flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50;
}

.panel-title {
  @apply flex items-center gap-4;
}

.title-icon {
  @apply text-3xl;
}

.title-text {
  @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

.close-btn {
  @apply p-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all hover:scale-110;
}

/* Panel Content */
.panel-content {
  @apply flex-1 overflow-y-auto;
}

.empty-state {
  @apply flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-lg;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .modal-container {
    @apply p-0;
  }

  .modal-panel {
    @apply rounded-none max-w-full;
  }

  .panel-header {
    @apply px-4 py-4;
  }

  .title-icon {
    @apply text-2xl;
  }

  .title-text {
    @apply text-xl;
  }
}
</style>
