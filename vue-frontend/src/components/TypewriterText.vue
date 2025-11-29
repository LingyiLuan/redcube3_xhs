<template>
  <span class="typewriter-text">{{ displayedText }}<span class="cursor" v-if="!isComplete">|</span></span>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  speed?: number
}>(), {
  speed: 100
})

const displayedText = ref('')
const isComplete = ref(false)

onMounted(() => {
  let index = 0
  const interval = setInterval(() => {
    if (index < props.text.length) {
      displayedText.value += props.text[index]
      index++
    } else {
      isComplete.value = true
      clearInterval(interval)
    }
  }, props.speed)
})
</script>

<style scoped>
.typewriter-text {
  display: inline-block;
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
