<template>
  <div class="share-form-container">
    <div class="form-header">
      <h2 class="form-title">Share Your Interview Experience</h2>
      <p class="form-subtitle">Help others prepare by sharing your interview journey</p>
    </div>

    <form class="experience-form" @submit.prevent="submitExperience">
      <!-- Company & Role -->
      <div class="form-row">
        <div class="form-field">
          <label class="field-label">Company *</label>
          <input
            v-model="formData.company"
            type="text"
            class="field-input"
            placeholder="e.g., Google, Amazon, Meta"
            required
          />
        </div>

        <div class="form-field">
          <label class="field-label">Role *</label>
          <input
            v-model="formData.role"
            type="text"
            class="field-input"
            placeholder="e.g., Software Engineer L4"
            required
          />
        </div>
      </div>

      <!-- Interview Date & Outcome -->
      <div class="form-row">
        <div class="form-field">
          <label class="field-label">Interview Date</label>
          <input
            v-model="formData.interviewDate"
            type="date"
            class="field-input"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Outcome</label>
          <select v-model="formData.outcome" class="field-select">
            <option value="">Select outcome</option>
            <option value="Offer">Offer</option>
            <option value="Reject">Reject</option>
            <option value="Pending">Pending</option>
            <option value="Withdrew">Withdrew</option>
            <option value="No Response">No Response</option>
          </select>
        </div>
      </div>

      <!-- Difficulty -->
      <div class="form-field">
        <label class="field-label">Difficulty (1-5)</label>
        <div class="difficulty-selector">
          <button
            v-for="level in 5"
            :key="level"
            type="button"
            :class="['difficulty-btn', { active: formData.difficulty === level }]"
            @click="formData.difficulty = level"
          >
            {{ level }}
          </button>
        </div>
      </div>

      <!-- Questions Asked -->
      <div class="form-field">
        <label class="field-label">Interview Questions (one per line)</label>
        <textarea
          v-model="questionsText"
          class="field-textarea"
          rows="5"
          placeholder="Describe the questions you were asked..."
        ></textarea>
      </div>

      <!-- Preparation Feedback -->
      <div class="form-field">
        <label class="field-label">How did you prepare?</label>
        <textarea
          v-model="formData.preparationFeedback"
          class="field-textarea"
          rows="4"
          placeholder="What resources did you use? What helped most?"
        ></textarea>
      </div>

      <!-- Tips for Others -->
      <div class="form-field">
        <label class="field-label">Tips for Others</label>
        <textarea
          v-model="formData.tipsForOthers"
          class="field-textarea"
          rows="4"
          placeholder="What advice would you give to future candidates?"
        ></textarea>
      </div>

      <!-- Areas Struggled -->
      <div class="form-field">
        <label class="field-label">Areas You Struggled With (one per line)</label>
        <textarea
          v-model="areasStruggledText"
          class="field-textarea"
          rows="3"
          placeholder="What topics or concepts were challenging?"
        ></textarea>
      </div>

      <!-- Submit Section -->
      <div class="submit-section">
        <p v-if="error" class="error-message">{{ error }}</p>
        <p v-if="success" class="success-message">Experience shared successfully!</p>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'SUBMITTING...' : 'SHARE EXPERIENCE' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const emit = defineEmits(['experience-created'])

const formData = ref({
  company: '',
  role: '',
  interviewDate: '',
  difficulty: null,
  outcome: '',
  preparationFeedback: '',
  tipsForOthers: ''
})

const questionsText = ref('')
const areasStruggledText = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const questionsArray = computed(() => {
  return questionsText.value
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0)
})

const areasStruggledArray = computed(() => {
  return areasStruggledText.value
    .split('\n')
    .map(a => a.trim())
    .filter(a => a.length > 0)
})

async function submitExperience() {
  error.value = ''
  success.value = false
  loading.value = true

  try {
    const payload = {
      company: formData.value.company,
      role: formData.value.role,
      interviewDate: formData.value.interviewDate || null,
      difficulty: formData.value.difficulty,
      outcome: formData.value.outcome || null,
      questionsAsked: questionsArray.value,
      preparationFeedback: formData.value.preparationFeedback,
      tipsForOthers: formData.value.tipsForOthers,
      areasStruggled: areasStruggledArray.value
    }

    const response = await axios.post(
      'http://localhost:8080/api/content/interview-intel/experiences',
      payload
    )

    console.log('[ShareExperienceForm] Experience created:', response.data)
    success.value = true

    // Reset form
    formData.value = {
      company: '',
      role: '',
      interviewDate: '',
      difficulty: null,
      outcome: '',
      preparationFeedback: '',
      tipsForOthers: ''
    }
    questionsText.value = ''
    areasStruggledText.value = ''

    // Emit success event
    emit('experience-created', response.data.data)

    // Hide success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    console.error('[ShareExperienceForm] Error:', err)
    error.value = err.response?.data?.error || 'Failed to submit experience. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.share-form-container {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #000000;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0;
}

.experience-form {
  background: #FAFAFA;
  border: 2px solid #000000;
  padding: 32px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.form-field {
  margin-bottom: 24px;
}

.field-label {
  font-family: 'Space Grotesk', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #000000;
  display: block;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.field-input,
.field-select,
.field-textarea {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  width: 100%;
  padding: 12px;
  border: 2px solid #000000;
  background: #FFFFFF;
  color: #000000;
  transition: all 0.2s ease;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  outline: none;
  border-color: #000000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
}

.difficulty-selector {
  display: flex;
  gap: 8px;
}

.difficulty-btn {
  font-family: 'Space Grotesk', monospace;
  font-size: 16px;
  font-weight: 700;
  width: 48px;
  height: 48px;
  border: 2px solid #000000;
  background: #FFFFFF;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-btn:hover {
  background: #F0F0F0;
}

.difficulty-btn.active {
  background: #000000;
  color: #FFFFFF;
}

.submit-section {
  margin-top: 32px;
  text-align: center;
}

.submit-btn {
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 16px 48px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.submit-btn:hover:not(:disabled) {
  background: #FFFFFF;
  color: #000000;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #D32F2F;
  margin-bottom: 16px;
}

.success-message {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #2E7D32;
  margin-bottom: 16px;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .experience-form {
    padding: 24px;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
