<template>
  <div class="pixel-input-wrapper">
    <label v-if="label" :for="inputId" class="pixel-input-label">
      {{ label }}
    </label>
    <div :class="['pixel-input-container', { 'has-icon': icon, 'is-focused': isFocused }]">
      <PixelIcon v-if="icon" :name="icon" :size="16" class="pixel-input-icon" />
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="pixel-input"
        @input="handleInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>
    <p v-if="error" class="pixel-input-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  modelValue: [String, Number],
  type: {
    type: String,
    default: 'text'
  },
  label: String,
  placeholder: String,
  icon: String,
  error: String,
  disabled: Boolean,
  required: Boolean
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const inputId = computed(() => `pixel-input-${Math.random().toString(36).substr(2, 9)}`)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.pixel-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pixel-input-label {
  font-family: var(--font-pixel-title);
  font-size: 10px;
  color: var(--pixel-accent-yellow);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pixel-input-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pixel-input-container.has-icon .pixel-input {
  padding-left: 40px;
}

.pixel-input-icon {
  position: absolute;
  left: 12px;
  color: var(--pixel-text-secondary);
  pointer-events: none;
  z-index: 1;
}

.pixel-input {
  flex: 1;
  font-family: var(--font-pixel-body);
  font-size: 18px;
  padding: 12px;
  background: var(--pixel-bg-primary);
  color: var(--pixel-text-primary);
  border: 2px solid var(--pixel-border-dark);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.pixel-input::placeholder {
  color: var(--pixel-text-secondary);
  opacity: 0.5;
}

.pixel-input:focus {
  border-color: var(--pixel-accent-cyan);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.3);
}

.pixel-input-container.is-focused .pixel-input-icon {
  color: var(--pixel-accent-cyan);
}

.pixel-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--pixel-bg-secondary);
}

.pixel-input-error {
  font-family: var(--font-pixel-body);
  font-size: 14px;
  color: #e63946;
  margin-top: -4px;
}

/* Number input adjustments */
.pixel-input[type='number'] {
  -moz-appearance: textfield;
}

.pixel-input[type='number']::-webkit-outer-spin-button,
.pixel-input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
