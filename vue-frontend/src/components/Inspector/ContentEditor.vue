<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Play, Save, Loader2 } from 'lucide-vue-next'
import type { NodeStatus } from '@/types/workflow'

interface Props {
  content: string
  nodeId: string
  status: NodeStatus
}

interface Emits {
  (e: 'update:content', value: string): void
  (e: 'analyze'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localContent = ref(props.content)
const isDirty = ref(false)
const charCount = ref(props.content.length)

// Watch for external content changes (e.g., from undo/redo)
watch(() => props.content, (newContent) => {
  if (newContent !== localContent.value) {
    localContent.value = newContent
    isDirty.value = false
    charCount.value = newContent.length
  }
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  localContent.value = target.value
  charCount.value = target.value.length
  isDirty.value = true
}

function handleSave() {
  emit('update:content', localContent.value)
  isDirty.value = false
}

function handleAnalyze() {
  if (isDirty.value) {
    handleSave()
  }
  emit('analyze')
}

// Auto-save on blur
function handleBlur() {
  if (isDirty.value) {
    handleSave()
  }
}

const isAnalyzing = computed(() => props.status === 'analyzing')
const hasContent = computed(() => localContent.value.trim().length > 0)
</script>

<template>
  <div class="content-editor">
    <!-- Textarea -->
    <div class="editor-container">
      <textarea
        v-model="localContent"
        @input="handleInput"
        @blur="handleBlur"
        :disabled="isAnalyzing"
        class="content-textarea"
        placeholder="Enter your content here to analyze..."
        rows="10"
      ></textarea>
    </div>

    <!-- Character Count -->
    <div class="editor-footer">
      <div class="char-count">
        <span :class="{ 'text-amber-600': charCount > 5000, 'text-red-600': charCount > 10000 }">
          {{ charCount }} characters
        </span>
        <span v-if="charCount > 5000" class="char-warning">
          {{ charCount > 10000 ? '(very long)' : '(long)' }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="editor-actions">
        <button
          v-if="isDirty"
          @click="handleSave"
          class="btn-save"
          title="Save content"
        >
          <Save :size="14" />
          Save
        </button>
      </div>
    </div>

    <!-- Help Text -->
    <div class="help-text">
      <p>💡 Enter text content. Use Analyze node + Run button to process.</p>
    </div>
  </div>
</template>

<style scoped>
.content-editor {
  @apply flex flex-col gap-2;
}

.editor-container {
  @apply relative;
}

.content-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[200px] font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed;
}

.editor-footer {
  @apply flex items-center justify-between text-xs;
}

.char-count {
  @apply flex items-center gap-2 text-gray-500 dark:text-gray-400;
}

.char-warning {
  @apply text-amber-600 dark:text-amber-400 font-medium;
}

.editor-actions {
  @apply flex items-center gap-2;
}

.btn-save {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors;
}

.btn-analyze {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.help-text {
  @apply text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded;
}

.help-text p {
  @apply m-0;
}
</style>
