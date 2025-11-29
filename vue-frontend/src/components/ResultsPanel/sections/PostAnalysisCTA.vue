<template>
  <div class="contribute-section">
    <h4 class="contribute-title">Contribute to the community</h4>
    <p class="contribute-text">
      This report used {{ sourceCount }} real interview experiences. 
      Share yours to help others on their journey.
    </p>
    <button @click="handleShareClick" class="contribute-btn">
      Share Your Experience →
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  sourceCount: {
    type: Number,
    default: 0
  }
})

const router = useRouter()

function handleShareClick() {
  router.push('/share-experiences')
}
</script>

<style scoped>
.contribute-section {
  border-top: 1px solid #E5E7EB;
  padding: 32px 0;
  margin-top: 48px;
  text-align: center;
}

.contribute-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.contribute-text {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin: 0 0 20px 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.contribute-btn {
  background: #FFFFFF;
  border: 1px solid #1E3A8A;
  color: #1E3A8A;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.contribute-btn:hover {
  background: #1E3A8A;
  color: #FFFFFF;
}
</style>

