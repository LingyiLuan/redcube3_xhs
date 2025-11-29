<template>
  <div class="my-experiences">
    <div class="section-header">
      <h2 class="section-title">MY EXPERIENCES</h2>
      <p class="section-subtitle">Your shared interview experiences</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">Loading your experiences...</div>

    <!-- Error State -->
    <div v-if="error" class="error-state">{{ error }}</div>

    <!-- Experiences Grid -->
    <div v-if="!loading && !error && experiences.length > 0" class="experiences-grid">
      <ExperienceCard
        v-for="experience in experiences"
        :key="experience.id"
        :experience="experience"
        @view="$emit('view-experience', experience.id)"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && experiences.length === 0" class="empty-state">
      <p>You haven't shared any interview experiences yet.</p>
      <p class="empty-cta">Switch to the "Share Your Experience" tab to get started!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ExperienceCard from './ExperienceCard.vue'

const emit = defineEmits(['view-experience'])

const experiences = ref([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  fetchMyExperiences()
})

async function fetchMyExperiences() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(
      'http://localhost:8080/api/content/interview-intel/my-experiences'
    )

    console.log('[MyExperiences] Fetched my experiences:', response.data)
    experiences.value = response.data.data || []
  } catch (err) {
    console.error('[MyExperiences] Error:', err)
    error.value = 'Failed to load your experiences. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.my-experiences {
  width: 100%;
}

.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.section-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 64px 32px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
}

.error-state {
  color: #D32F2F;
}

.empty-state p {
  margin-bottom: 16px;
}

.empty-cta {
  font-weight: 600;
  color: #000000;
}

.experiences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .experiences-grid {
    grid-template-columns: 1fr;
  }
}
</style>
