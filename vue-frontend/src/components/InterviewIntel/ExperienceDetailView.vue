<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- Close Button -->
      <button class="close-btn" @click="$emit('close')">✕</button>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">Loading experience...</div>

      <!-- Error State -->
      <div v-if="error" class="error-state">{{ error }}</div>

      <!-- Experience Details -->
      <div v-if="!loading && !error && experience" class="experience-details">
        <!-- Header -->
        <div class="detail-header">
          <h2 class="company-name">{{ experience.company }}</h2>
          <div class="role-title">{{ experience.role }}</div>
        </div>

        <!-- Metadata Row -->
        <div class="metadata-section">
          <div v-if="experience.interview_date" class="metadata-item">
            <span class="metadata-label">INTERVIEW DATE:</span>
            <span class="metadata-value">{{ formatDate(experience.interview_date) }}</span>
          </div>
          <div v-if="experience.difficulty" class="metadata-item">
            <span class="metadata-label">DIFFICULTY:</span>
            <span class="metadata-value">{{ experience.difficulty }}/5</span>
          </div>
          <div v-if="experience.outcome" class="metadata-item">
            <span class="metadata-label">OUTCOME:</span>
            <span class="outcome-badge" :class="`outcome-${experience.outcome}`">
              {{ experience.outcome.toUpperCase() }}
            </span>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-icon">⬆</span>
            <span class="stat-value">{{ experience.upvotes || 0 }} upvotes</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👁</span>
            <span class="stat-value">{{ experience.views || 0 }} views</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-value">{{ experience.citation_count || 0 }} citations</span>
          </div>
        </div>

        <!-- Questions Asked -->
        <div v-if="experience.questions_asked && experience.questions_asked.length > 0" class="detail-section">
          <h3 class="section-title">QUESTIONS ASKED</h3>
          <ul class="questions-list">
            <li v-for="(question, index) in experience.questions_asked" :key="index" class="question-item">
              {{ question }}
            </li>
          </ul>
        </div>

        <!-- Preparation Feedback -->
        <div v-if="experience.preparation_feedback" class="detail-section">
          <h3 class="section-title">PREPARATION</h3>
          <p class="section-content">{{ experience.preparation_feedback }}</p>
        </div>

        <!-- Tips for Others -->
        <div v-if="experience.tips_for_others" class="detail-section">
          <h3 class="section-title">TIPS FOR OTHERS</h3>
          <p class="section-content">{{ experience.tips_for_others }}</p>
        </div>

        <!-- Areas Struggled -->
        <div v-if="experience.areas_struggled && experience.areas_struggled.length > 0" class="detail-section">
          <h3 class="section-title">AREAS STRUGGLED</h3>
          <ul class="areas-list">
            <li v-for="(area, index) in experience.areas_struggled" :key="index" class="area-item">
              {{ area }}
            </li>
          </ul>
        </div>

        <!-- Author Info -->
        <div v-if="experience.author_tier" class="author-section">
          <span class="author-label">Shared by:</span>
          <span class="author-tier" :class="`tier-${experience.author_tier}`">
            {{ experience.author_tier.toUpperCase() }}
          </span>
          <span v-if="experience.verified" class="verified-badge">✓ VERIFIED</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import axios from 'axios'

const props = defineProps({
  experienceId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'

const experience = ref(null)
const loading = ref(false)
const error = ref('')

onMounted(() => {
  fetchExperience()
})

async function fetchExperience() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(
      `${apiGatewayUrl}/api/content/interview-intel/experiences/${props.experienceId}`
    )

    console.log('[ExperienceDetailView] Fetched experience:', response.data)
    experience.value = response.data.data
  } catch (err) {
    console.error('[ExperienceDetailView] Error:', err)
    error.value = 'Failed to load experience details. Please try again.'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 24px;
  overflow-y: auto;
}

.modal-content {
  background: #FFFFFF;
  border: 4px solid #000000;
  max-width: 800px;
  width: 100%;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  position: relative;
  padding: 48px;
  margin: auto;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  font-family: 'Space Grotesk', monospace;
  font-size: 24px;
  font-weight: 700;
  background: none;
  border: 2px solid #000000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #000000;
  color: #FFFFFF;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 64px 32px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
}

.error-state {
  color: #D32F2F;
}

.experience-details {
  width: 100%;
}

.detail-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 3px solid #000000;
}

.company-name {
  font-family: 'Space Grotesk', monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin: 0 0 12px 0;
}

.role-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #666666;
}

.metadata-section {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #E5E5E5;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metadata-label {
  font-family: 'Space Grotesk', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #666666;
}

.metadata-value {
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #000000;
}

.outcome-badge {
  font-family: 'Space Grotesk', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 12px;
  border: 2px solid #000000;
}

.outcome-Offer {
  background: #E8F5E9;
  color: #2E7D32;
  border-color: #2E7D32;
}

.outcome-Reject {
  background: #FFEBEE;
  color: #C62828;
  border-color: #C62828;
}

.outcome-Pending {
  background: #FFF3E0;
  color: #F57C00;
  border-color: #F57C00;
}

.outcome-Withdrew,
.outcome-No\ Response {
  background: #F5F5F5;
  color: #757575;
  border-color: #757575;
}

.stats-section {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #E5E5E5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
}

.stat-icon {
  font-size: 16px;
}

.stat-value {
  color: #000000;
}

.detail-section {
  margin-bottom: 32px;
}

.section-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.section-content {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #333333;
  margin: 0;
}

.questions-list,
.areas-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.question-item,
.area-item {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #333333;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #FAFAFA;
  border-left: 4px solid #000000;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 24px;
  border-top: 2px solid #E5E5E5;
}

.author-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
}

.author-tier {
  font-family: 'Space Grotesk', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 10px;
  border: 2px solid #000000;
}

.tier-bronze {
  background: #D4A574;
  color: #000000;
}

.tier-silver {
  background: #C0C0C0;
  color: #000000;
}

.tier-gold {
  background: #FFD700;
  color: #000000;
}

.verified-badge {
  font-family: 'Space Grotesk', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #2E7D32;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    padding: 32px 24px;
  }

  .company-name {
    font-size: 24px;
  }

  .role-title {
    font-size: 16px;
  }

  .metadata-section,
  .stats-section {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
