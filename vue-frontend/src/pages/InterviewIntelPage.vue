<template>
  <div class="interview-intel-page">
    <LandingNav />

    <div class="page-container">
      <!-- Header Section -->
      <header class="page-header">
        <h1 class="page-title">
          <span class="title-text">
            <span class="title-lab">Lab</span><span class="title-zero">Zero</span>
          </span>
        </h1>
        <p class="page-subtitle">Share your interview experiences and learn from others' journeys</p>
      </header>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button
          :class="['tab-button', { active: activeTab === 'browse' }]"
          @click="activeTab = 'browse'"
        >
          Browse Experiences
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'share' }]"
          @click="activeTab = 'share'"
        >
          Share Your Experience
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'trending' }]"
          @click="activeTab = 'trending'"
        >
          Trending
        </button>
        <button
          v-if="authStore.isAuthenticated"
          :class="['tab-button', { active: activeTab === 'my-experiences' }]"
          @click="activeTab = 'my-experiences'"
        >
          My Experiences
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <ExperienceBrowser
          v-if="activeTab === 'browse'"
          @view-experience="viewExperience"
          @go-to-share="activeTab = 'share'"
        />
        <ShareExperienceForm
          v-else-if="activeTab === 'share'"
          @experience-created="handleExperienceCreated"
        />
        <TrendingExperiences
          v-else-if="activeTab === 'trending'"
          @view-experience="viewExperience"
        />
        <MyExperiences
          v-else-if="activeTab === 'my-experiences'"
          @view-experience="viewExperience"
        />
      </div>
    </div>

    <LandingFooter />

    <!-- Experience Detail Modal -->
    <ExperienceDetailView
      v-if="selectedExperienceId"
      :experience-id="selectedExperienceId"
      @close="closeDetailView"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import LandingNav from '@/components/Landing/LandingNav.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'
import ExperienceBrowser from '@/components/InterviewIntel/ExperienceBrowser.vue'
import ShareExperienceForm from '@/components/InterviewIntel/ShareExperienceForm.vue'
import TrendingExperiences from '@/components/InterviewIntel/TrendingExperiences.vue'
import MyExperiences from '@/components/InterviewIntel/MyExperiences.vue'
import ExperienceDetailView from '@/components/InterviewIntel/ExperienceDetailView.vue'

const authStore = useAuthStore()
const activeTab = ref('browse')
const selectedExperienceId = ref(null)

function viewExperience(experienceId) {
  console.log('[InterviewIntel] Viewing experience:', experienceId)
  selectedExperienceId.value = experienceId
}

function closeDetailView() {
  selectedExperienceId.value = null
}

function handleExperienceCreated(experience) {
  console.log('[InterviewIntel] Experience created:', experience)
  // Switch to browse tab to show the new experience
  activeTab.value = 'browse'
}
</script>

<style scoped>
.interview-intel-page {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 120px 32px 64px;
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0 0 16px 0;
}

.title-text {
  display: inline-block;
}

.title-lab {
  color: #000000;
}

.title-zero {
  color: #1E3A8A;
}

.page-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  color: #666666;
  margin: 0;
}

.tab-nav {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #E5E5E5;
  margin-bottom: 32px;
}

.tab-button {
  font-family: 'Space Grotesk', monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.tab-button:hover {
  color: #000000;
  background: #F5F5F5;
}

.tab-button.active {
  color: #000000;
  border-bottom-color: #000000;
  background: #FAFAFA;
}

.tab-content {
  min-height: 600px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 100px 16px 32px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 16px;
  }

  .tab-nav {
    flex-wrap: wrap;
  }

  .tab-button {
    font-size: 12px;
    padding: 10px 16px;
  }
}
</style>
