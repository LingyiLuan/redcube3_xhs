<template>
  <div class="mckinsey-report">
    <!-- Report Header - Modularized Component -->
    <ReportHeaderV1 :patterns="patterns" />

    <!-- Degraded Mode Alert (if applicable) -->
    <DegradedModeAlert
      v-if="extractionWarning"
      :warning="extractionWarning"
    />

    <!-- Report Content -->
    <div class="report-body">
      <!-- 0. Your Interview Experiences - Modularized Component -->
      <YourInterviewExperiencesV1
        :individualAnalyses="individualAnalyses"
        :patterns="patterns"
        @openPostModal="openPostModal"
      />

      <!-- 0.5. Methodology - Data Transparency Section -->
      <MethodologyV1
        :patterns="patterns"
        :individualAnalyses="individualAnalyses"
        @view-sources="openSourceDataModal"
      />

      <!-- 1. Executive Summary - Modularized Component -->
      <ExecutiveSummaryV1 :patterns="patterns" />

      <!-- 2. Skill Landscape Analysis - Modularized Component -->
      <SkillLandscapeAnalysisV1 :patterns="patterns" />

      <!-- 2.5. Comparative Metrics Table - Modularized Component -->
      <ComparativeMetricsTableV1 :patterns="patterns" />

      <!-- 2. Company Intelligence Section - Modularized Component -->
      <CompanyIntelligenceV1 :patterns="patterns" />

      <!-- 3. Role Intelligence Section - Modularized Component -->
      <RoleIntelligenceV1 :patterns="patterns" />

      <!-- 4. Critical Skills Analysis Section - Modularized Component -->
      <CriticalSkillsAnalysisV1
        :patterns="patterns"
      />

      <!-- 2.5 Topic Breakdown Section - Modularized Component -->
      <TopicBreakdownV1
        v-if="featuresAvailable?.topic_breakdown !== false"
        :patterns="patterns"
      />
      <div v-else class="feature-unavailable-notice">
        <h3>📊 Topic Breakdown</h3>
        <p>This feature requires advanced AI analysis and is unavailable in limited mode.</p>
      </div>

      <!-- 5. Success Factors Section - Modularized Component -->
      <SuccessFactorsV1
        :patterns="patterns"
      />

      <!-- 6. Sentiment & Outcome Analysis - Modularized Component -->
      <SentimentOutcomeAnalysisV1
        :patterns="patterns"
      />

      <!-- Skills Priority Matrix - Modularized Component -->
      <SkillsPriorityMatrixV1
        v-if="featuresAvailable?.skills_priority_matrix !== false"
        :patterns="patterns"
      />
      <div v-else class="feature-unavailable-notice">
        <h3>🎯 Skills Priority Matrix</h3>
        <p>This feature requires advanced AI analysis and is unavailable in limited mode.</p>
      </div>

      <!-- 6. Interview Questions Intelligence Section -->
      <InterviewQuestionsIntelligenceV1
        v-if="patterns.interview_questions && patterns.interview_questions.length > 0"
        :patterns="patterns"
      />

      <!-- 8. Industry Trends - Temporal Intelligence (Phase 1 & 2) -->
      <IndustryTrendsV1
        :patterns="patterns"
      />

      <!-- 8.5. Strategic Insights Dashboard - McKinsey-Style Professional Report -->
      <StrategicInsightsDashboard
        v-if="enhancedIntelligence"
        :intelligence="enhancedIntelligence"
        :patterns="patterns"
      />

      <!-- 9. Learning Plan CTA - Navigate to Learning Map -->
      <LearningPlanCTA
        :patterns="patterns"
      />
    </div>

    <!-- Interview Post Modal -->
    <InterviewPostModal
      v-if="selectedPost"
      :show="showPostModal"
      :post="selectedPost"
      @close="closePostModal"
    />

    <!-- Source Data Modal -->
    <SourceDataModal
      :isOpen="showSourceDataModal"
      :seedPosts="individualAnalyses || []"
      :similarPosts="similarPosts || []"
      :patterns="patterns"
      @close="closeSourceDataModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import InterviewPostModal from '../Modals/InterviewPostModal.vue'
import SourceDataModal from '../Modals/SourceDataModal.vue'
import DegradedModeAlert from './components/DegradedModeAlert.vue'
import ReportHeaderV1 from './sections/ReportHeaderV1.vue'
import YourInterviewExperiencesV1 from './sections/YourInterviewExperiencesV1.vue'
import MethodologyV1 from './sections/MethodologyV1.vue'
import StrategicInsightsDashboard from './sections/StrategicInsightsDashboard.vue'
import ExecutiveSummaryV1 from './sections/ExecutiveSummaryV1.vue'
import SkillLandscapeAnalysisV1 from './sections/SkillLandscapeAnalysisV1.vue'
import ComparativeMetricsTableV1 from './sections/ComparativeMetricsTableV1.vue'
import SkillsPriorityMatrixV1 from './sections/SkillsPriorityMatrixV1.vue'
import CompanyIntelligenceV1 from './sections/CompanyIntelligenceV1.vue'
import RoleIntelligenceV1 from './sections/RoleIntelligenceV1.vue'
import CriticalSkillsAnalysisV1 from './sections/CriticalSkillsAnalysisV1.vue'
import SuccessFactorsV1 from './sections/SuccessFactorsV1.vue'
import TopicBreakdownV1 from './sections/TopicBreakdownV1.vue'
import SentimentOutcomeAnalysisV1 from './sections/SentimentOutcomeAnalysisV1.vue'
import InterviewQuestionsIntelligenceV1 from './sections/InterviewQuestionsIntelligenceV1.vue'
import IndustryTrendsV1 from './sections/IndustryTrendsV1.vue'
import LearningPlanCTA from './sections/LearningPlanCTA.vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement
} from 'chart.js'
import { MCKINSEY_COLORS, getDeterministicJitter, hashCode, getSeededRandom } from '@/composables/useChartHelpers'
import { formatDate, getDifficultyClass, getSkillName, hashString } from '@/composables/useReportFormatters'
import { calculateSkillPriority, getCriticalSkillsCount as getCriticalSkillsCountUtil, extractUniqueCompanies, extractUniqueRoles, countUniqueSkills } from '@/utilities/reportHelpers'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement, LineElement, PointElement)

interface ExtractionWarning {
  type: string
  title: string
  message: string
  unavailable_features?: string[]
  reason?: string
  fallback_method: string
}

const props = defineProps<{
  patterns: any
  individualAnalyses?: any[]
  similarPosts?: any[]
  extractionWarning?: ExtractionWarning | null
  featuresAvailable?: any
  enhancedIntelligence?: any | null
}>()

// Debug: Log degraded mode props
console.log('🔍 [MultiPostPatternReport] Received props:', {
  hasExtractionWarning: !!props.extractionWarning,
  extractionWarning: props.extractionWarning,
  featuresAvailable: props.featuresAvailable,
  enhancedIntelligence: props.enhancedIntelligence,
  hasEnhancedIntelligence: !!props.enhancedIntelligence,
  enhancedIntelligenceKeys: props.enhancedIntelligence ? Object.keys(props.enhancedIntelligence) : null
})

// Additional debug for new sections visibility
if (!props.enhancedIntelligence) {
  console.warn('⚠️ [MultiPostPatternReport] enhancedIntelligence is NULL/UNDEFINED - new sections will NOT render')
  console.log('   Patterns available?', !!props.patterns)
  console.log('   Individual analyses available?', !!props.individualAnalyses)
} else {
  console.log('✅ [MultiPostPatternReport] enhancedIntelligence is present - new sections WILL render')
}

// ===== User Data Extraction (Section 0: Your Interview Experiences) =====

// Extract user's uploaded posts from backend individual_analyses
// Modal state for viewing individual posts
const showPostModal = ref(false)
const selectedPost = ref<any>(null)

// Modal state for source data
const showSourceDataModal = ref(false)

// Degraded mode warning state

function openPostModal(post: any) {
  selectedPost.value = {
    ...post,
    originalText: props.individualAnalyses?.find(a => a.company === post.company)?.original_text || 'Post content not available',
    url: props.individualAnalyses?.find(a => a.company === post.company)?.url || undefined
  }
  showPostModal.value = true
}

function closePostModal() {
  showPostModal.value = false
  selectedPost.value = null
}

function openSourceDataModal() {
  console.log('\n' + '='.repeat(80))
  console.log('[MULTI POST PATTERN REPORT] 🔓 Opening Source Data Modal')
  console.log('='.repeat(80))
  console.log('[MULTI POST PATTERN REPORT] props.similarPosts:', props.similarPosts)
  console.log('[MULTI POST PATTERN REPORT] props.similarPosts length:', props.similarPosts?.length)
  console.log('[MULTI POST PATTERN REPORT] props.individualAnalyses:', props.individualAnalyses)
  console.log('[MULTI POST PATTERN REPORT] props.individualAnalyses length:', props.individualAnalyses?.length)
  console.log('[MULTI POST PATTERN REPORT] props.patterns exists:', !!props.patterns)
  if (props.similarPosts && props.similarPosts.length > 0) {
    console.log('[MULTI POST PATTERN REPORT] First similar post:', {
      post_id: props.similarPosts[0].post_id,
      title: props.similarPosts[0].title?.substring(0, 50),
      company: props.similarPosts[0].company,
      role: props.similarPosts[0].role
    })
  }
  console.log('[MULTI POST PATTERN REPORT] Setting showSourceDataModal = true')
  console.log('='.repeat(80) + '\n')
  showSourceDataModal.value = true
}

function closeSourceDataModal() {
  showSourceDataModal.value = false
}

function getOutcomeIcon(outcome: string) {
  const icons: Record<string, string> = {
    success: '●',
    rejected: '●',
    pending: '●'
  }
  return icons[outcome] || '●'
}

// ===== Helper Functions =====

function getTopInsight() {
  const topSkill = props.patterns.skill_frequency[0]
  const topCompany = props.patterns.company_trends[0]
  return `${topSkill.skill} emerged as the most critical skill (${topSkill.percentage}% mention rate), particularly emphasized in ${topCompany?.company || 'technical'} interviews.`
}

function getCriticalSkillsCount() {
  return getCriticalSkillsCountUtil(props.patterns.skill_frequency)
}

</script>

<style scoped>
@import '@/assets/mckinsey-report-shared.css';

/* Feature Unavailable Notice */
.feature-unavailable-notice {
  margin: 32px 0;
  padding: 32px;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
  border: 2px dashed #9CA3AF;
  border-radius: 12px;
  text-align: center;
}

.feature-unavailable-notice h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #6B7280;
}

.feature-unavailable-notice p {
  margin: 0;
  font-size: 14px;
  color: #9CA3AF;
  line-height: 1.6;
}
</style>
