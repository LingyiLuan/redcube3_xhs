<template>
  <div class="message-input">
    <textarea
      ref="textareaRef"
      v-model="internalValue"
      :placeholder="isLoading ? 'AI is typing...' : 'Ask me anything...'"
      :disabled="isLoading"
      class="input-field"
      rows="1"
      @keydown.enter="handleEnter"
      @input="adjustHeight"
    />
    <button
      class="send-btn"
      :disabled="!canSend"
      @click="handleSend"
    >
      <Loader2 v-if="isLoading" :size="20" class="spin" />
      <Send v-else :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Send, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': []
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canSend = computed(() => {
  return internalValue.value.trim().length > 0 && !props.isLoading
})

// Auto-resize textarea
function adjustHeight() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      const newHeight = Math.min(textareaRef.value.scrollHeight, 200)
      textareaRef.value.style.height = `${newHeight}px`
    }
  })
}

// Handle Enter key
function handleEnter(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Send message
function handleSend() {
  if (canSend.value) {
    emit('send')
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
      }
    })
  }
}

// Watch for value changes to adjust height
watch(() => props.modelValue, () => {
  adjustHeight()
})
</script>

<style scoped>
.message-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-field {
  flex: 1;
  min-width: 0;
  min-height: 48px;
  max-height: 200px;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  background: #FFFFFF;
  color: #1F2937;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #1E3A8A;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.input-field:disabled {
  background: #F9FAFB;
  color: #9CA3AF;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: #9CA3AF;
}

.send-btn {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: #1E3A8A;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  background: #1E40AF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #D1D5DB;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
