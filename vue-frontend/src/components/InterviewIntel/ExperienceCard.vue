<template>
  <div class="experience-card" @click="$emit('view')">
    <!-- Header: Company + Outcome -->
    <div class="card-header">
      <div class="header-left">
        <h3 class="company-name">{{ experience.company }}</h3>
        <span v-if="experience.author_tier && experience.author_tier !== 'New Contributor'" class="author-tier">
          {{ experience.author_tier }}
        </span>
      </div>
      <span v-if="experience.outcome" class="outcome-text" :class="`outcome-${experience.outcome.toLowerCase()}`">
        {{ experience.outcome }}
      </span>
    </div>

    <!-- Role -->
    <div class="role-name">{{ experience.role }}</div>

    <!-- Metadata: Difficulty + Date -->
    <div class="metadata-line">
      <span v-if="experience.difficulty" class="metadata-item">
        Difficulty: {{ experience.difficulty }}/5
      </span>
      <span v-if="experience.difficulty && experience.interview_date" class="bullet-separator">•</span>
      <span v-if="experience.interview_date" class="metadata-item">
        {{ formatDate(experience.interview_date) }}
      </span>
    </div>

    <!-- Divider -->
    <div class="card-divider"></div>

    <!-- Preview Text -->
    <div v-if="experience.tips_for_others" class="preview-text">
      {{ truncateText(experience.tips_for_others, 150) }}
    </div>

    <!-- Divider -->
    <div class="card-divider"></div>

    <!-- Footer: Stats + Analyze Link -->
    <div class="card-footer">
      <div class="stats-line">
        <button
          class="upvote-inline"
          @click.stop="handleVote('upvote')"
          :class="{ active: hasUpvoted }"
          title="Upvote"
        >
          {{ experience.upvotes || 0 }} {{ (experience.upvotes || 0) === 1 ? 'upvote' : 'upvotes' }}
        </button>
        <span class="bullet-separator">•</span>
        <span class="stat-text">{{ experience.views || 0 }} {{ (experience.views || 0) === 1 ? 'view' : 'views' }}</span>
        <span class="bullet-separator">•</span>
        <span class="stat-text">{{ experience.citation_count || 0 }} {{ (experience.citation_count || 0) === 1 ? 'citation' : 'citations' }}</span>
      </div>
      <a
        class="analyze-link"
        @click.stop="handleAnalyze"
        title="Analyze this experience"
      >
        Analyze →
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const props = defineProps({
  experience: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view'])
const router = useRouter()

const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'

const hasUpvoted = ref(false)
const isVoting = ref(false)

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function handleVote(voteType) {
  if (isVoting.value) return

  isVoting.value = true

  try {
    const response = await axios.post(
      `${apiGatewayUrl}/api/content/interview-intel/experiences/${props.experience.id}/vote`,
      { voteType }
    )

    if (response.data.success) {
      props.experience.upvotes = response.data.data.upvotes
      props.experience.downvotes = response.data.data.downvotes
      hasUpvoted.value = voteType === 'upvote'
      console.log('[ExperienceCard] Vote successful:', response.data.data)
    }
  } catch (error) {
    console.error('[ExperienceCard] Vote error:', error)
  } finally {
    isVoting.value = false
  }
}

function handleAnalyze() {
  console.log('[ExperienceCard] Navigating to workflow with experience:', props.experience.id)

  router.push({
    path: '/workflow',
    query: {
      mode: 'analyze-experience',
      experienceId: props.experience.id,
      company: props.experience.company,
      role: props.experience.role
    }
  })
}
</script>

<style scoped>
/* Brutalist Black & White Card Style - Matches App UI */
.experience-card {
  background: #FAFAFA;
  border: 2px solid #000000;
  border-radius: 0;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.experience-card:hover {
  background: #FFFFFF;
  box-shadow: 0 4px 0 #000000;
  transform: translateY(-2px);
}

/* Header: Company + Outcome */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.company-name {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #000000;
  margin: 0;
}

.author-tier {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #FFFFFF;
  background: #000000;
  padding: 2px 8px;
  border: 1px solid #000000;
}

.outcome-text {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.outcome-offer {
  color: #2E7D32;
}

.outcome-reject {
  color: #C62828;
}

.outcome-pending {
  color: #F57C00;
}

.outcome-withdrew,
.outcome-no-response {
  color: #757575;
}

/* Role */
.role-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
}

/* Metadata Line */
.metadata-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #000000;
  margin-bottom: 16px;
}

.metadata-item {
  color: #000000;
  font-weight: 500;
}

.bullet-separator {
  color: #000000;
  font-weight: 400;
}

/* Divider */
.card-divider {
  height: 2px;
  background: #000000;
  margin: 16px 0;
}

/* Preview Text */
.preview-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333333;
  flex-grow: 1;
  margin-bottom: 16px;
  min-height: 60px;
}

/* Footer: Stats + Analyze */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.stats-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 13px;
  color: #000000;
  font-weight: 600;
}

.upvote-inline {
  background: none;
  border: none;
  padding: 0;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 13px;
  color: #000000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upvote-inline:hover {
  text-decoration: underline;
}

.upvote-inline.active {
  color: #000000;
  font-weight: 700;
}

.stat-text {
  color: #000000;
  font-weight: 600;
}

/* Analyze Link - Black Button */
.analyze-link {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #FFFFFF;
  text-decoration: none;
  cursor: pointer;
  padding: 6px 12px;
  border: 2px solid #000000;
  background: #000000;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.analyze-link:hover {
  background: #FFFFFF;
  color: #000000;
}
</style>
