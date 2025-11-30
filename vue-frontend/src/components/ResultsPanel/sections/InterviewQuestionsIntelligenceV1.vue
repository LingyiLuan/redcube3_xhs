<template>
      <!-- 6. Interview Questions Intelligence -->
      <section class="report-section interview-questions">
        <div class="section-header-with-badge">
          <h2 class="section-title">Interview Questions Intelligence</h2>
          <DataSourceBadge type="personalized" />
        </div>
        <p class="section-subtitle personalized-subtitle">Based on questions from your interview and 50 similar experiences</p>

        <!-- Narrative intro -->
        <div class="narrative-block">
          <p class="insight-text">
            {{ getQuestionsNarrative() }}
          </p>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            @click="switchTab('intelligence')"
            :class="{ active: activeTab === 'intelligence' }"
            class="tab-btn">
            Intelligence Dashboard
          </button>
          <button
            @click="switchTab('question-bank')"
            :class="{ active: activeTab === 'question-bank' }"
            class="tab-btn tab-btn-question-bank">
            Question Bank
            <span v-if="fullQuestionBank.length > 0" class="tab-badge">{{ fullQuestionBank.length }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Tab 1: Intelligence Dashboard -->
          <div v-if="activeTab === 'intelligence'" class="intelligence-dashboard">
            <!-- Stats Summary Row -->
            <div class="intelligence-stats-row">
              <div class="stat-card">
                <div class="stat-value">{{ questionIntelligence.total_questions || 0 }}</div>
                <div class="stat-label">Total Questions</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ topicDist.length }}</div>
                <div class="stat-label">Unique Topics</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ companyProfiles.length }}</div>
                <div class="stat-label">Companies</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ avgDifficulty }}</div>
                <div class="stat-label">Avg Difficulty</div>
              </div>
            </div>

            <!-- Chart Grid - Asymmetric Rows Layout -->
            <div class="intelligence-charts-grid">
              <!-- Row 1: Question Frequency (Full Width) -->
              <div class="intelligence-chart-card intelligence-chart-card-full">
                <h3 class="intelligence-chart-title">Most Frequently Asked Questions</h3>
                <p class="intelligence-chart-subtitle">Top 10 questions sorted by mention count</p>

                <!-- Question Detail Table (No Chart) -->
                <div v-if="questionFrequency.length > 0" class="question-detail-table-expanded">
                  <table class="intel-table">
                    <thead>
                      <tr>
                        <th style="width: 40px">#</th>
                        <th style="width: 55%">Question</th>
                        <th style="width: 100px; text-align: center">Mentions</th>
                        <th style="width: 25%; text-align: center">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(q, idx) in questionFrequency.slice(0, 10)"
                        :key="idx"
                        @click="switchToQuestionBankWithFilter({ type: 'search', value: q.text })"
                        class="intel-table-row"
                      >
                        <td class="intel-rank">Q{{ idx + 1 }}</td>
                        <td class="intel-question">{{ q.text }}</td>
                        <td class="intel-count" :class="getMentionColorClass(q.count, questionFrequency)">
                          {{ q.count }}
                        </td>
                        <td class="intel-category">{{ q.category || 'General' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="chart-empty-state">No question frequency data available</div>
              </div>

              <!-- Row 2: Company & Difficulty Charts (50/50 Split) -->
              <div class="intelligence-charts-row-split">
                <!-- Chart 2: Company Profiles Stacked Bar Chart -->
                <div class="intelligence-chart-card">
                  <h3 class="intelligence-chart-title">Company Question Profiles</h3>
                  <p class="intelligence-chart-subtitle">Question category distribution by company (%)</p>
                  <div class="chart-container" v-if="companyProfiles.length > 0">
                    <Bar :data="companyProfilesChartData" :options="companyProfilesChartOptions" />
                  </div>
                  <div v-else class="chart-empty-state">No company profile data available</div>
                </div>

                <!-- Chart 3: Difficulty Distribution Histogram -->
                <div class="intelligence-chart-card">
                  <h3 class="intelligence-chart-title">Difficulty Distribution</h3>
                  <p class="intelligence-chart-subtitle">Number of questions by difficulty level (1-5)</p>
                  <div class="chart-container" v-if="Object.keys(difficultyDist).length > 0">
                    <Bar :data="difficultyDistChartData" :options="difficultyDistChartOptions" />
                  </div>
                  <div v-else class="chart-empty-state">No difficulty data available</div>
                </div>
              </div>

              <!-- Row 3: Topic Distribution & Analysis Highlights -->
              <div class="intelligence-charts-row-split">
                <!-- Chart 4: Topic Distribution (Left Box) -->
                <div class="intelligence-chart-card">
                  <h3 class="intelligence-chart-title">Topic Distribution</h3>
                  <p class="intelligence-chart-subtitle">Top 6 question categories by percentage</p>
                  <div class="chart-container" v-if="topicDist.length > 0">
                    <Doughnut :data="topicDistChartData" :options="topicDistChartOptions" />
                  </div>
                  <div v-else class="chart-empty-state">No topic data available</div>
                </div>

                <!-- Analysis Highlights (Right Box - Same Height) -->
                <div v-if="insights.length > 0" class="intelligence-chart-card analysis-highlights-box">
                  <h3 class="intelligence-chart-title">Analysis Highlights</h3>
                  <p class="intelligence-chart-subtitle">Key insights from question analysis</p>

                  <div class="highlights-content">
                    <div v-for="(insight, idx) in insights" :key="idx" class="highlight-item">
                      <h5 class="highlight-title">{{ insight.title }}</h5>
                      <p class="highlight-text">{{ insight.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- NEW: Top Interview Questions from Enhanced Intelligence -->
            <div v-if="topQuestionsEnhanced.length > 0" class="intelligence-section-divider">
              <h3 class="intelligence-section-title">Top Interview Questions (Enhanced Intelligence)</h3>
              <p class="intelligence-section-subtitle">{{ topQuestionsEnhanced.length }} high-priority questions with 2+ occurrences</p>

              <div class="top-questions-table-wrapper">
                <table class="top-questions-table">
                  <thead>
                    <tr>
                      <th class="col-question-header">Question</th>
                      <th class="col-asked-header">Asked</th>
                      <th class="col-difficulty-header">Difficulty</th>
                      <th class="col-time-header">Avg Time</th>
                      <th class="col-priority-header">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(question, index) in topQuestionsEnhanced.slice(0, 10)"
                      :key="index"
                      class="table-row"
                      :class="`priority-${question.prep_priority || 'medium'}`"
                    >
                      <td class="col-question">
                        <span class="question-text">{{ question.question }}</span>
                      </td>
                      <td class="col-asked">{{ question.asked_count }}×</td>
                      <td class="col-difficulty">
                        <span class="difficulty-stars">{{ getDifficultyStars(question.difficulty) }}</span>
                      </td>
                      <td class="col-time">{{ question.avg_time_minutes || 'N/A' }} min</td>
                      <td class="col-priority">
                        <span class="priority-badge" :class="`priority-${question.prep_priority || 'medium'}`">
                          {{ (question.prep_priority || 'MED').toUpperCase() }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tab 2: Question Bank (existing content) -->
          <div v-else-if="activeTab === 'question-bank'" class="question-bank-view">
            <!-- Breadcrumb Navigation (when coming from Intelligence Dashboard) -->
            <div v-if="hasActiveFilters" class="breadcrumb-bar">
              <button @click="switchTab('intelligence')" class="breadcrumb-back">
                ← Back to Intelligence Dashboard
              </button>
              <span class="breadcrumb-divider">/</span>
              <span class="breadcrumb-current">Filtered Results</span>
            </div>

            <!-- Full Question Bank (with search/filter) -->
            <div class="chart-wrapper">
              <h3 class="chart-title">Complete Question Bank</h3>
          <p class="chart-subtitle">{{ filteredQuestionBank.length }} questions from {{ totalCompanies }} companies</p>

          <!-- Compact Stats Summary -->
          <div v-if="sourceBreakdown.total > 0" class="stats-summary-inline">
            <span class="stats-text">
              {{ sourceBreakdown.total }} total questions analyzed •
              {{ sourceBreakdown.seed }} from your posts •
              {{ sourceBreakdown.similar }} from similar experiences
            </span>
          </div>

          <!-- Source Filter Buttons (Prominent) -->
          <div class="source-filter-buttons">
            <button
              @click="questionFilterSource = 'seed'"
              :class="{ active: questionFilterSource === 'seed' }"
              class="source-filter-btn primary">
              Your Posts ({{ sourceBreakdown.seed }})
            </button>

            <button
              @click="questionFilterSource = 'similar'"
              :class="{ active: questionFilterSource === 'similar' }"
              class="source-filter-btn">
              Similar ({{ sourceBreakdown.similar }})
            </button>

            <button
              @click="questionFilterSource = ''"
              :class="{ active: questionFilterSource === '' }"
              class="source-filter-btn">
              All Questions ({{ sourceBreakdown.total }})
            </button>
          </div>

          <!-- Filter Controls - Compact Single-Row Layout -->
          <div class="filters-container">
            <!-- Row 1: Search Bar (Full Width) -->
            <div class="filters-row-search">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input
                  v-model="questionSearchQuery"
                  type="text"
                  placeholder="Search questions..."
                  class="search-input search-input-full" />
              </div>
            </div>

            <!-- Row 2: All Filters + Clear Button (Single Row) -->
            <div class="filters-row-controls">
              <select v-model="questionFilterCompany" class="filter-select-compact">
                <option value="">All Companies</option>
                <option v-for="company in uniqueQuestionCompanies" :key="company" :value="company">
                  {{ company }}
                </option>
              </select>

              <select v-model="questionFilterCategory" class="filter-select-compact">
                <option value="">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
                <option value="Coding">Coding</option>
                <option value="Problem Solving">Problem Solving</option>
              </select>

              <select v-model="questionFilterDifficulty" class="filter-select-compact">
                <option value="">All Difficulties</option>
                <option value="easy">Easy (&lt; 3.0)</option>
                <option value="medium">Medium (3.0-3.9)</option>
                <option value="hard">Hard (4.0-5.0)</option>
              </select>

              <select v-model="questionSortBy" class="filter-select-compact">
                <option value="">Default Order</option>
                <option value="company">Company (A-Z)</option>
                <option value="difficulty-asc">Difficulty (Low to High)</option>
                <option value="difficulty-desc">Difficulty (High to Low)</option>
                <option value="category">Category</option>
              </select>

              <div class="spacer"></div>

              <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          </div>

          <div class="results-info" v-if="filteredQuestionBank.length > 0">
            <span class="results-count">
              Showing {{ (currentPage - 1) * questionsPerPage + 1 }}-{{ Math.min(currentPage * questionsPerPage, filteredQuestionBank.length) }} of {{ filteredQuestionBank.length }} questions
            </span>
          </div>

          <QuestionBankTable
            v-if="filteredQuestionBank.length > 0"
            :questions="paginatedQuestions"
            :currentPage="currentPage"
            :questionsPerPage="questionsPerPage"
            @questionClick="openQuestionDetail" />

          <div v-else class="empty-state">
            <h3 class="empty-state-title">No questions found</h3>
            <p class="empty-state-message">
              Try adjusting your filters or search query to find more questions.
            </p>
            <button @click="clearAllFilters" class="empty-state-btn">
              Clear All Filters
            </button>
          </div>

          <div class="pagination" v-if="totalPages > 1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">← Previous</button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">Next →</button>
          </div>
        </div>

        <!-- Question Detail Modal -->
        <div v-if="selectedQuestion" class="question-modal-overlay" @click="closeQuestionDetail">
          <div class="question-modal" @click.stop>
            <button class="modal-close" @click="closeQuestionDetail">×</button>

            <div class="modal-header">
              <h3 class="modal-title">{{ selectedQuestion.text }}</h3>
              <div class="modal-meta">
                <span class="modal-company">{{ selectedQuestion.company }}</span>
                <span class="modal-category">{{ selectedQuestion.category }}</span>
              </div>

              <!-- Source Attribution - Moved to Top for Visibility -->
              <div v-if="selectedQuestion.primary_source_url" class="modal-source-section-top">
                <a
                  :href="selectedQuestion.primary_source_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="modal-source-link-prominent">
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" class="source-icon-prominent">
                    <path d="M14 9v5a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h5M11 2h4v4M6.5 9.5L15 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  View Original Post on Reddit
                  <span v-if="selectedQuestion.source_posts && selectedQuestion.source_posts.length > 1" class="source-count-badge">
                    +{{ selectedQuestion.source_posts.length - 1 }} more
                  </span>
                </a>
              </div>
            </div>

            <div class="modal-body">
              <!-- LeetCode Match Badge (if matched) -->
              <div v-if="selectedQuestion.leetcode_url" class="leetcode-match-section">
                <div class="leetcode-badge-large">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFA116" class="leetcode-logo">
                    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                  </svg>
                  <div class="leetcode-info">
                    <div class="leetcode-title">{{ selectedQuestion.leetcode_title }}</div>
                    <div class="leetcode-meta">
                      <span class="leetcode-difficulty" :class="`diff-${(selectedQuestion.leetcode_difficulty || '').toLowerCase()}`">
                        {{ selectedQuestion.leetcode_difficulty }}
                      </span>
                      <span class="leetcode-number">#{{ selectedQuestion.leetcode_frontend_id }}</span>
                      <span class="leetcode-confidence" v-if="selectedQuestion.match_confidence">
                        {{ Math.round((selectedQuestion.match_confidence || 0) * 100) }}% match
                      </span>
                    </div>
                  </div>
                  <a
                    :href="selectedQuestion.leetcode_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="leetcode-practice-btn">
                    Practice on LeetCode →
                  </a>
                </div>
              </div>

              <div class="modal-section">
                <h4 class="modal-section-title">Question Details</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Difficulty</span>
                    <span class="detail-value">
                      {{ selectedQuestion.leetcode_difficulty || `${selectedQuestion.difficulty}/5` }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Interview Stage</span>
                    <span class="detail-value">{{ selectedQuestion.stage }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Success Rate</span>
                    <span class="detail-value">{{ selectedQuestion.successRate }}%</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Avg Time</span>
                    <span class="detail-value">{{ selectedQuestion.avgTime || 30 }} min</span>
                  </div>
                </div>
              </div>

              <div class="modal-section" v-if="selectedQuestion.topics && selectedQuestion.topics.length > 0">
                <h4 class="modal-section-title">Related Topics</h4>
                <div class="topics-list">
                  <span v-for="topic in selectedQuestion.topics" :key="topic" class="topic-tag">
                    {{ topic }}
                  </span>
                </div>
              </div>

              <div class="modal-section" v-if="selectedQuestion.tips">
                <h4 class="modal-section-title">Preparation Tips</h4>
                <p class="tips-text">{{ selectedQuestion.tips }}</p>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { MCKINSEY_CHART_COLORS } from '@/composables/useChartColors'
import QuestionBankTable from '../components/QuestionBankTable.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import type { SourcePost } from '@/types/reports'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

interface Props {
  patterns: any
  intelligence?: any | null
}

interface InterviewQuestion {
  id?: string | number
  text: string
  company: string
  category?: string
  difficulty: number
  stage?: string
  source?: 'seed' | 'similar' | ''
  post_source?: string
  primary_source_url?: string
  source_posts?: SourcePost[]
  leetcode_url?: string
  leetcode_title?: string
  leetcode_difficulty?: string
  leetcode_frontend_id?: string | number
  match_confidence?: number
  successRate?: number
  avgTime?: number
  topics?: string[]
  tips?: string
  [key: string]: any
}

const props = defineProps<Props>()

// Tab navigation state
const activeTab = ref<'intelligence' | 'question-bank'>('intelligence')

function switchTab(tab: 'intelligence' | 'question-bank') {
  activeTab.value = tab
}

const questionSearchQuery = ref('')
const questionFilterCompany = ref('')
const questionFilterCategory = ref('')
const questionFilterDifficulty = ref('')
const questionFilterSource = ref('seed')  // Default to "Your Posts Only"
const questionSortBy = ref('')
const selectedQuestion = ref<InterviewQuestion | null>(null)
const currentPage = ref(1)
const questionsPerPage = ref(20)

// Computed: Extract seed companies from backend
const seedCompanies = computed(() => {
  // Try to get from company_tiered_questions metadata
  if (props.patterns.company_tiered_questions?.metadata?.seedCompanyNames) {
    return props.patterns.company_tiered_questions.metadata.seedCompanyNames
  }

  // Fallback: extract from yourCompanies tier
  if (props.patterns.company_tiered_questions?.yourCompanies) {
    return props.patterns.company_tiered_questions.yourCompanies.map((c: any) => c.company)
  }

  return []
})

// Computed: Full question bank with source attribution
const fullQuestionBank = computed<InterviewQuestion[]>(() => {
  // ✅ Use real pattern-extracted interview questions from backend
  if (props.patterns.interview_questions && Array.isArray(props.patterns.interview_questions)) {
    const questionsWithSource = props.patterns.interview_questions.map((q: InterviewQuestion) => ({
      ...q,
      source: q.post_source === 'seed' ? 'seed' : 'similar'
    })) as InterviewQuestion[]

    console.log(`[Interview Questions] ✅ Using ${questionsWithSource.length} questions (${questionsWithSource.filter((q: any) => q.source === 'seed').length} from your posts, ${questionsWithSource.filter((q: any) => q.source === 'similar').length} from similar)`)

    return questionsWithSource
  }

  // ❌ No fallback mock data - return empty if no real questions extracted
  console.warn('[Interview Questions] ⚠️ No interview_questions found in patterns - showing empty state')
  return []
})

// Computed: Source breakdown for summary card
const sourceBreakdown = computed(() => {
  const seed = fullQuestionBank.value.filter((q) => q.source === 'seed').length
  const similar = fullQuestionBank.value.filter((q) => q.source === 'similar').length
  return {
    seed,
    similar,
    total: seed + similar
  }
})

// Computed: Filtered question bank
const filteredQuestionBank = computed<InterviewQuestion[]>(() => {
  let filtered: InterviewQuestion[] = fullQuestionBank.value

  // Search filter (case-insensitive)
  if (questionSearchQuery.value) {
    const query = questionSearchQuery.value.toLowerCase()
    filtered = filtered.filter((q) =>
      q.text.toLowerCase().includes(query) ||
      q.company.toLowerCase().includes(query)
    )
  }

  // Company filter
  if (questionFilterCompany.value) {
    filtered = filtered.filter((q) => q.company === questionFilterCompany.value)
  }

  // Category filter
  if (questionFilterCategory.value) {
    filtered = filtered.filter((q) => q.category === questionFilterCategory.value)
  }

  // Difficulty filter
  if (questionFilterDifficulty.value) {
    if (questionFilterDifficulty.value === 'easy') {
      filtered = filtered.filter((q) => q.difficulty < 3.0)
    } else if (questionFilterDifficulty.value === 'medium') {
      filtered = filtered.filter((q) => q.difficulty >= 3.0 && q.difficulty < 4.0)
    } else if (questionFilterDifficulty.value === 'hard') {
      filtered = filtered.filter((q) => q.difficulty >= 4.0)
    }
  }

  // Source filter (NEW)
  if (questionFilterSource.value) {
    filtered = filtered.filter((q) => q.source === questionFilterSource.value)
  }

  // Sorting
  if (questionSortBy.value) {
    filtered = [...filtered] // Clone to avoid mutating original

    switch (questionSortBy.value) {
      case 'company':
        filtered.sort((a, b) => a.company.localeCompare(b.company))
        break
      case 'difficulty-asc':
        filtered.sort((a, b) => a.difficulty - b.difficulty)
        break
      case 'difficulty-desc':
        filtered.sort((a, b) => b.difficulty - a.difficulty)
        break
      case 'category':
        filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''))
        break
    }
  }

  return filtered
})

// Computed: Paginated questions
const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * questionsPerPage.value
  const end = start + questionsPerPage.value
  return filteredQuestionBank.value.slice(start, end)
})

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredQuestionBank.value.length / questionsPerPage.value)
})

// Computed: Unique companies (for Interview Questions section) - exclude Unknown
const uniqueQuestionCompanies = computed(() => {
  const companies = new Set(
    fullQuestionBank.value
      .map((q) => q.company)
      .filter((c) => c && c !== 'Unknown' && c !== 'N/A' && c !== 'Common Patterns')
  )
  return Array.from(companies as Set<string>).sort()
})

// Computed: Total companies count
const totalCompanies = computed(() => {
  return uniqueQuestionCompanies.value.length
})

// Intelligence Dashboard data accessors
const questionIntelligence = computed(() => props.patterns.question_intelligence || {})
const questionFrequency = computed(() => questionIntelligence.value.question_frequency || [])
const companyProfiles = computed(() => questionIntelligence.value.company_question_profiles || [])
const difficultyDist = computed(() => questionIntelligence.value.difficulty_distribution || {})
const topicDist = computed(() => questionIntelligence.value.topic_distribution || [])

// Map insights from backend format to frontend format
const insights = computed(() => {
  const rawInsights = questionIntelligence.value.insights || []
  return rawInsights.map((insight: any) => {
    // Map type to title
    const titleMap: { [key: string]: string } = {
      'frequency': 'Most Frequent Question',
      'company_focus': 'Company Focus Pattern',
      'difficulty': 'Difficulty Trend'
    }

    return {
      title: titleMap[insight.type] || 'Insight',
      description: insight.text,
      action: insight.filter // Pass filter as action for the button
    }
  })
})

const avgDifficulty = computed(() => questionIntelligence.value.avg_difficulty || '0.0')

// Top questions from enhanced intelligence
const topQuestionsEnhanced = computed(() => {
  return props.intelligence?.question_intelligence?.top_questions || []
})

// Chart 1: Question Frequency Bar Chart Data (Horizontal Bars with Q1-Q10 Labels)
const questionFrequencyChartData = computed(() => {
  const data = questionFrequency.value.slice(0, 10) // Top 10
  return {
    labels: data.map((_, idx) => `Q${idx + 1}`), // Simple Q1, Q2, Q3... labels
    datasets: [{
      label: 'Mentions',
      data: data.map(q => q.count),
      backgroundColor: MCKINSEY_CHART_COLORS.navy,
      borderColor: MCKINSEY_CHART_COLORS.navy,
      borderWidth: 1
    }]
  }
})

const questionFrequencyChartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        // Simple tooltip showing label + count
        label: (context: any) => `${context.parsed.x} mentions`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { precision: 0 },
      title: { display: true, text: 'Mentions' }
    },
    y: {
      ticks: {
        font: {
          size: 14,
          weight: 'bold' as const
        }
      }
    }
  },
  onClick: (_event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const question = questionFrequency.value[index]
      switchToQuestionBankWithFilter({ type: 'search', value: question.text })
    }
  }
}

// Chart 2: Company Profiles Stacked Bar Chart Data
const companyProfilesChartData = computed(() => {
  const data = companyProfiles.value.slice(0, 8) // Top 8 companies
  const categories = ['Technical', 'Behavioral', 'System Design', 'Coding', 'Problem Solving']

  return {
    labels: data.map(c => c.company),
    datasets: categories.map((cat, idx) => ({
      label: cat,
      data: data.map(c => {
        // Handle both array and object structures
        if (Array.isArray(c.categories)) {
          const catData = c.categories.find((cd: any) => cd.category === cat)
          return catData ? catData.percentage : 0
        }
        return 0
      }),
      backgroundColor: [
        MCKINSEY_CHART_COLORS.navy,
        MCKINSEY_CHART_COLORS.blue,
        MCKINSEY_CHART_COLORS.lightBlue,
        MCKINSEY_CHART_COLORS.babyBlue,
        MCKINSEY_CHART_COLORS.slate
      ][idx],
      borderWidth: 0
    }))
  }
})

const companyProfilesChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
      }
    }
  },
  scales: {
    x: { stacked: true },
    y: {
      stacked: true,
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value: any) => value + '%'
      }
    }
  },
  onClick: (_event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const company = companyProfiles.value[index]
      switchToQuestionBankWithFilter({ type: 'company', value: company.company })
    }
  }
}

// Chart 3: Difficulty Distribution Histogram Data
const difficultyDistChartData = computed(() => {
  const levels = ['1', '2', '3', '4', '5']
  return {
    labels: levels.map(l => `Level ${l}`),
    datasets: [{
      label: 'Questions',
      data: levels.map(l => difficultyDist.value[l] || 0),
      backgroundColor: [
        MCKINSEY_CHART_COLORS.babyBlue,
        MCKINSEY_CHART_COLORS.lightBlue,
        MCKINSEY_CHART_COLORS.blue,
        MCKINSEY_CHART_COLORS.navy,
        MCKINSEY_CHART_COLORS.charcoal
      ],
      borderWidth: 0
    }]
  }
})

const difficultyDistChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.parsed.y} questions`
      }
    }
  },
  scales: {
    x: {
      title: { display: true, text: 'Difficulty Level' }
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      title: { display: true, text: 'Number of Questions' }
    }
  }
}

// Chart 4: Topic Distribution Donut Chart Data
const topicDistChartData = computed(() => {
  // Filter out "Unknown" topics before displaying
  const data = topicDist.value
    .filter(t => t.category && t.category.toLowerCase() !== 'unknown')
    .slice(0, 6) // Top 6 topics
  return {
    labels: data.map(t => t.category),
    datasets: [{
      data: data.map(t => t.percentage),
      backgroundColor: [
        MCKINSEY_CHART_COLORS.navy,
        MCKINSEY_CHART_COLORS.blue,
        MCKINSEY_CHART_COLORS.lightBlue,
        MCKINSEY_CHART_COLORS.babyBlue,
        MCKINSEY_CHART_COLORS.slate,
        MCKINSEY_CHART_COLORS.charcoal
      ],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }]
  }
})

const topicDistChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        generateLabels: (chart: any) => {
          const data = chart.data
          return data.labels.map((label: string, i: number) => ({
            text: `${label} (${data.datasets[0].data[i].toFixed(1)}%)`,
            fillStyle: data.datasets[0].backgroundColor[i],
            hidden: false,
            index: i
          }))
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.label}: ${context.parsed.toFixed(1)}%`
      }
    }
  },
  onClick: (_event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const topic = topicDist.value[index]
      switchToQuestionBankWithFilter({ type: 'category', value: topic.category })
    }
  }
}

// Computed: Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(
    questionSearchQuery.value ||
    questionFilterCompany.value ||
    questionFilterCategory.value ||
    questionFilterDifficulty.value ||
    questionFilterSource.value ||
    questionSortBy.value
  )
})

// Watchers: Reset to page 1 when filters change
watch([questionSearchQuery, questionFilterCompany, questionFilterCategory, questionFilterDifficulty, questionFilterSource, questionSortBy], () => {
  currentPage.value = 1
})

// Methods
function clearAllFilters() {
  questionSearchQuery.value = ''
  questionFilterCompany.value = ''
  questionFilterCategory.value = ''
  questionFilterDifficulty.value = ''
  questionFilterSource.value = ''
  questionSortBy.value = ''
  currentPage.value = 1
}

/**
 * Switch to Question Bank tab with a filter applied
 * Used by chart click handlers and insight action buttons
 */
/**
 * Get color class for mention count based on relative frequency
 * Creates a heat map effect - higher mentions = darker color
 */
function getMentionColorClass(count: number, allQuestions: any[]) {
  if (allQuestions.length === 0) return 'mention-low'

  const maxCount = Math.max(...allQuestions.map(q => q.count))
  const minCount = Math.min(...allQuestions.map(q => q.count))
  const range = maxCount - minCount

  if (range === 0) return 'mention-medium' // All same count

  const percentage = ((count - minCount) / range) * 100

  // 5-tier color system based on our McKinsey palette
  if (percentage >= 80) return 'mention-highest'      // Top 20%: Darkest navy
  else if (percentage >= 60) return 'mention-high'    // 60-80%: Dark blue
  else if (percentage >= 40) return 'mention-medium'  // 40-60%: Medium blue
  else if (percentage >= 20) return 'mention-low'     // 20-40%: Light blue
  else return 'mention-lowest'                         // Bottom 20%: Lightest
}

function switchToQuestionBankWithFilter(action: { type: string, value: string }) {
  // Clear all existing filters first
  clearAllFilters()

  // Apply the specific filter based on action type
  switch (action.type) {
    case 'search':
      questionSearchQuery.value = action.value
      break
    case 'company':
      questionFilterCompany.value = action.value
      break
    case 'category':
      questionFilterCategory.value = action.value
      break
    case 'difficulty':
      questionFilterDifficulty.value = action.value
      break
  }

  // Switch to Question Bank tab
  activeTab.value = 'question-bank'
}
function getQuestionsNarrative() {
  const totalQuestions = fullQuestionBank.value.length

  if (totalQuestions === 0) {
    return 'Interview question analysis is currently unavailable for this dataset.'
  }

  const categoryMap = new Map<string, { count: number; difficulties: number[]; successRates: number[] }>()
  fullQuestionBank.value.forEach((q) => {
    const key = q.category || 'General'
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { count: 0, difficulties: [], successRates: [] })
    }
    const cat = categoryMap.get(key)!
    cat.count++
    cat.difficulties.push(q.difficulty || 0)
    cat.successRates.push(q.successRate || 0)
  })

  const topCategory = Array.from(categoryMap.entries())
    .map(([name, data]) => {
      const avgDifficulty = data.difficulties.length
        ? data.difficulties.reduce((a, b) => a + b, 0) / data.difficulties.length
        : 0
      const avgSuccess = data.successRates.length
        ? Math.round(data.successRates.reduce((a, b) => a + b, 0) / data.successRates.length)
        : 0
      return {
        name,
        count: data.count,
        avgDifficulty,
        successRate: avgSuccess
      }
    })
    .sort((a, b) => b.count - a.count)[0]

  if (!topCategory) {
    return `Analysis of ${totalQuestions} interview questions reveals comprehensive patterns across ${totalCompanies.value} companies.`
  }

  return `Analysis of ${totalQuestions} interview questions reveals comprehensive patterns across ${totalCompanies.value} companies. ${topCategory.name} questions dominate at ${Math.round((topCategory.count / totalQuestions) * 100)}% of all questions, with an average difficulty of ${topCategory.avgDifficulty.toFixed(1)}/5 and ${topCategory.successRate}% success rate. Question distribution varies significantly by company and role, with difficulty levels ranging from foundational knowledge checks to complex system design challenges.`
}

function openQuestionDetail(question: InterviewQuestion) {
  selectedQuestion.value = question
}

function closeQuestionDetail() {
  selectedQuestion.value = null
}

/**
 * Helper function for difficulty classification
 */
function getDifficultyClass(difficulty: number): string {
  if (difficulty < 3.0) return 'difficulty-low'
  if (difficulty >= 3.0 && difficulty < 4.0) return 'difficulty-medium'
  return 'difficulty-high'
}

/**
 * Helper function for difficulty stars (⭐ only)
 */
function getDifficultyStars(difficulty: string): string {
  const difficultyMap: { [key: string]: string } = {
    'easy': '⭐',
    'medium': '⭐⭐',
    'hard': '⭐⭐⭐'
  }
  return difficultyMap[difficulty?.toLowerCase()] || '⭐⭐'
}
</script>

<style scoped>
/* ===== Interview Questions Section Styles ===== */

/* Section Header with Badge */
.section-header-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.personalized-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 24px;
  font-weight: 500;
}

.interview-questions {
  /* Inherits report-section styles */
}

/* Compact Stats Summary */
.stats-summary-inline {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--color-off-white);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.stats-text {
  font-size: 13px;
  color: var(--color-slate);
  font-weight: 500;
}

/* Source Filter Buttons */
.source-filter-buttons {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.source-filter-btn {
  flex: 1;
  padding: 12px 20px;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-align: center;
}

.source-filter-btn:hover {
  border-color: var(--color-blue);
  background: #F9FAFB;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.source-filter-btn.active {
  background: var(--color-button-primary);
  border-color: var(--color-button-primary);
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.source-filter-btn.primary.active {
  background: var(--color-button-primary);
  border-color: var(--color-button-primary);
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.35);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #E5E7EB;
  padding-bottom: 2px;
}

.tab-btn {
  padding: 10px 20px;
  background: #F9FAFB;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6B7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  bottom: -2px;
  border-radius: 6px 6px 0 0;
}

.tab-btn:hover {
  color: #374151;
  background: #F3F4F6;
}

.tab-btn.active {
  color: var(--color-navy);
  border-bottom-color: var(--color-navy);
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-bottom: 3px solid var(--color-navy);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.02);
}

/* Question Bank Tab - Subtle Differentiation */
.tab-btn-question-bank {
  position: relative;
}

.tab-btn-question-bank:not(.active) {
  border-left: 2px solid var(--color-navy);
  padding-left: 18px;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-navy);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  margin-left: 8px;
  font-family: 'Inter', sans-serif;
}

.tab-btn-question-bank.active .tab-badge {
  background: var(--color-navy);
  color: #FFFFFF;
}

/* Tab Content */
.tab-content {
  margin-top: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Breadcrumb Navigation */
.breadcrumb-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 6px;
  border-left: 3px solid var(--color-navy);
}

.breadcrumb-back {
  background: none;
  border: none;
  color: var(--color-navy);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;
}

.breadcrumb-back:hover {
  color: var(--color-blue);
  text-decoration: underline;
}

.breadcrumb-divider {
  color: #9CA3AF;
  font-weight: 300;
}

.breadcrumb-current {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* ===== Intelligence Dashboard Styles ===== */

.intelligence-dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Stats Summary Row */
.intelligence-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--color-white);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-navy);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.06);
  transform: translateY(-2px);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
  margin-bottom: 8px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate);
}

/* Chart Grid (Asymmetric Rows Layout) */
.intelligence-charts-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 32px;
}

/* Row container for 50/50 split charts */
.intelligence-charts-row-split {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 50/50 split */
  gap: 24px;
}

.intelligence-chart-card {
  background: var(--color-white);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

/* Full-width card for Question Frequency (Row 1) */
.intelligence-chart-card-full {
  background: var(--color-white);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  min-height: 600px; /* Taller to accommodate chart + table */
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 300px;
  max-height: 350px;
  width: 100%;
  overflow: hidden;
}

/* Smaller chart for Question Frequency (to make room for table) */
.chart-container-small {
  position: relative;
  min-height: 200px;
  max-height: 200px;
  width: 100%;
  overflow: hidden;
  margin-bottom: 16px;
}

.intelligence-chart-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-navy);
  margin: 0 0 4px 0;
  font-family: 'Inter', -apple-system, sans-serif;
}

.intelligence-chart-subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-slate);
  margin: 0 0 20px 0;
}

.chart-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-slate);
  font-size: 14px;
  font-style: italic;
  background: var(--color-off-white);
  border-radius: 6px;
  padding: 40px;
  text-align: center;
}

/* Analysis Highlights Box (Separate Box, Same Height as Topic Distribution) */
.analysis-highlights-box {
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.highlights-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
}

.highlight-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.highlight-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.highlight-title {
  font-size: 13px;
  font-weight: 600;
  color: #1E3A8A;
  margin: 0 0 8px 0;
  text-transform: capitalize;
}

.highlight-text {
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  margin: 0;
}

/* Question Detail Table (Below Chart) */
/* Expanded table - no chart above, so more vertical space */
.question-detail-table-expanded {
  margin-top: 24px;
  overflow-y: auto;
  max-height: none; /* No height limit - show all 10 questions */
  border: 1px solid var(--color-light-gray);
  border-radius: 6px;
}

/* Legacy table container (if needed) */
.question-detail-table {
  margin-top: 16px;
  overflow-y: auto;
  max-height: 530px;
  border: 1px solid var(--color-light-gray);
  border-radius: 6px;
}

.intel-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.intel-table thead {
  position: sticky;
  top: 0;
  background: var(--color-off-white);
  z-index: 1;
}

.intel-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate);
  border-bottom: 2px solid var(--color-border);
}

.intel-table-row {
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid var(--color-light-gray);
}

.intel-table-row:hover {
  background: var(--color-baby-blue);
  transform: translateX(2px);
}

.intel-table td {
  padding: 10px 12px;
  color: var(--color-charcoal);
}

.intel-rank {
  font-weight: 700;
  color: var(--color-navy);
  font-size: 12px;
}

.intel-question {
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-charcoal);
}

.intel-count {
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  transition: color 0.2s ease;
}

/* Mention count color tiers - text color only (no background) */
.intel-count.mention-highest {
  color: #003d82;  /* Darkest navy - top 20% */
}

.intel-count.mention-high {
  color: #0059b3;  /* Dark blue - 60-80% */
}

.intel-count.mention-medium {
  color: #3b82f6;  /* Medium blue - 40-60% */
}

.intel-count.mention-low {
  color: #60a5fa;  /* Light blue - 20-40% */
}

.intel-count.mention-lowest {
  color: #93c5fd;  /* Lightest blue - bottom 20% */
}

.intel-category {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-slate);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Responsive Intelligence Dashboard */
@media (max-width: 1024px) {
  .intelligence-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Stack charts vertically on tablets */
  .intelligence-charts-row-split {
    grid-template-columns: 1fr;
  }

  /* Reduce height for full-width card on smaller screens */
  .intelligence-chart-card-full {
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .tab-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .breadcrumb-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
  }

  .breadcrumb-divider {
    display: none;
  }

  .intelligence-stats-row {
    grid-template-columns: 1fr;
  }

  .intelligence-chart-card {
    min-height: 300px;
    padding: 16px;
  }

  .intelligence-chart-card-full {
    min-height: 400px;
    padding: 16px;
  }

  .intelligence-chart-title {
    font-size: 16px;
  }

  .intelligence-chart-subtitle {
    font-size: 12px;
  }

  .intel-table {
    font-size: 12px;
  }

  .intel-table th,
  .intel-table td {
    padding: 8px;
  }

  .question-detail-table {
    max-height: 400px;
  }

  .question-detail-table-expanded {
    max-height: 500px; /* Add limit on mobile */
  }
}

/* ===== Tier Section Styles ===== */
.tier-section {
  margin-bottom: 40px;
}

/* Compact Header (for table layout) */
.tier-header-compact {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
}

.tier-title-compact {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tier-subtitle {
  font-size: 13px;
  color: #6B7280;
  font-weight: 400;
}

.tier-title-row-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-btn-compact {
  margin-left: auto;
  background: none;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.expand-btn-compact:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
  color: #374151;
}

/* Regular Header (for card layout) */
.tier-header {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #E5E7EB;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.tier-seed-header {
  border-color: var(--color-blue);
  background: linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%);
}

.tier-similar-header {
  border-color: #D1D5DB;
  background: #FFFFFF;
}

.tier-general-header {
  border-color: #E5E7EB;
  background: #F9FAFB;
}

.tier-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.tier-icon {
  flex-shrink: 0;
}

.tier-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.tier-count {
  padding: 4px 12px;
  background: #F3F4F6;
  color: #374151;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.expand-btn {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border: none;
  background: #F3F4F6;
  color: #6B7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: #E5E7EB;
  color: #111827;
  transform: scale(1.1);
}

.tier-description {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

.tier-companies {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.3s ease;
}

/* Company Question Grid */
.company-question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.company-question-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.company-question-card:hover {
  border-color: var(--color-navy);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.1);
  transform: translateY(-2px);
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.company-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.question-count {
  font-size: 13px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.category-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-baby-blue);
  border-radius: 16px;
  font-size: 12px;
}

.cat-name {
  color: var(--color-navy);
  font-weight: 600;
}

.cat-count {
  color: var(--color-navy);
  font-weight: 700;
  background: var(--color-light-blue);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
}

.view-questions-btn {
  width: 100%;
  padding: 10px;
  background: var(--color-button-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.view-questions-btn:hover {
  background: var(--color-button-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

/* Category Table */
.category-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}

.category-table thead {
  background: #F3F4F6;
}

.category-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #E5E7EB;
}

.category-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #F3F4F6;
}

.category-table tbody tr {
  transition: background 0.2s ease;
}

.category-table tbody tr:hover {
  background: #F9FAFB;
}

.category-name {
  font-weight: 600;
  color: #111827;
}

.difficulty-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.difficulty-low {
  background: #BFDBFE;
  color: #1E3A8A;
}

.difficulty-medium {
  background: #DBEAFE;
  color: #1E40AF;
}

.difficulty-high {
  background: #EFF6FF;
  color: #1E3A8A;
}

.company-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.company-tag {
  padding: 4px 10px;
  background: var(--color-baby-blue);
  color: var(--color-navy);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Difficulty Distribution */
.difficulty-distribution {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.diff-level-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}

.diff-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-header.diff-easy {
  background: linear-gradient(135deg, var(--color-baby-blue) 0%, var(--color-light-blue) 100%);
}

.diff-header.diff-medium {
  background: linear-gradient(135deg, #DBEAFE 0%, var(--color-baby-blue) 100%);
}

.diff-header.diff-hard {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
}

.diff-level {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.diff-count {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.diff-stats {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

/* === FILTER CONTROLS - COMPACT SINGLE-ROW LAYOUT === */

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 12px;  /* Vertical spacing between search and filters */
  margin-bottom: 24px;
}

/* Row 1: Search Bar (Full Width) */
.filters-row-search {
  width: 100%;
}

/* Search Input Wrapper with Icon */
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

/* Row 2: All Filters + Clear Button (Single Row) */
.filters-row-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;  /* Keep all filters in one row on desktop */
}

/* Spacer pushes Clear button to right */
.spacer {
  flex: 1;
}

/* Search Input - Full Width with Icon */
.search-input-full {
  width: 100%;
  padding: 10px 16px 10px 44px;  /* Extra left padding for icon */
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.search-input-full:hover {
  border-color: #9CA3AF;
}

.search-input-full:focus {
  outline: none;
  border-color: var(--color-navy);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

/* Filter Select Dropdowns - Compact */
.filter-select-compact {
  padding: 8px 12px;  /* Reduced from 10px 16px */
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;  /* Reduced from 14px */
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  min-width: 120px;  /* Reduced from 150px */
  white-space: nowrap;
}

.filter-select-compact:hover {
  border-color: var(--color-navy);
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.05);
}

.filter-select-compact:focus {
  outline: none;
  border-color: var(--color-navy);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

/* Clear Filters Button - Destructive (Red) - Compact */
.clear-filters-btn {
  padding: 8px 16px;  /* Reduced from 10px 20px */
  background: var(--color-destructive);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 13px;  /* Reduced from 14px */
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;  /* Prevent button from shrinking */
}

.clear-filters-btn:hover {
  background: var(--color-destructive-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.clear-filters-btn:active {
  transform: translateY(0);
}

.results-info {
  margin: 16px 0 12px 0;
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
}

.results-count {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #F9FAFB;
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  margin: 20px 0;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.empty-state-message {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.empty-state-btn {
  padding: 12px 24px;
  background: var(--color-button-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.empty-state-btn:hover {
  background: var(--color-button-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.empty-state-btn:active {
  transform: translateY(0);
}

/* Question Bank List */
.question-bank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.question-item {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-item:hover {
  border-color: var(--color-navy);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
  transform: translateX(4px);
}

.question-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.question-number {
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  background: #F3F4F6;
  padding: 4px 8px;
  border-radius: 4px;
}

.question-company {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-navy);
}

.question-category-badge {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  background: #E5E7EB;
  padding: 4px 10px;
  border-radius: 12px;
}

.question-difficulty {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  margin-left: auto;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.5;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6B7280;
}

.meta-item {
  font-weight: 500;
}

.meta-divider {
  color: #D1D5DB;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #E5E7EB;
}

.page-btn {
  padding: 10px 20px;
  background: var(--color-button-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.page-btn:hover:not(:disabled) {
  background: var(--color-button-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.page-btn:disabled {
  background: #E5E7EB;
  color: #9CA3AF;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.page-info {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* Question Detail Modal - Centers within content area (respects sidebar) */
.question-modal-overlay {
  position: fixed;
  top: 0;
  left: var(--sidebar-width, 320px);  /* Offset by sidebar width */
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.2s ease;
  transition: left 0.3s ease;  /* Smooth transition when sidebar toggles */
}

/* Adjust modal position based on sidebar state */
/* When sidebar is collapsed (60px) - uses CSS variable fallback */
@media (min-width: 1px) {
  .question-modal-overlay {
    left: var(--sidebar-width, 320px);
  }
}

.question-modal {
  background: #FFFFFF;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  background: #F3F4F6;
  color: #6B7280;
  font-size: 24px;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #E5E7EB;
  color: #111827;
  transform: rotate(90deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 32px 32px 24px 32px;
  border-bottom: 2px solid #E5E7EB;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  padding-right: 40px;
  line-height: 1.4;
}

.modal-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-company {
  padding: 6px 14px;
  background: var(--color-baby-blue);
  color: var(--color-navy);
  font-size: 13px;
  font-weight: 700;
  border-radius: 16px;
}

.modal-category {
  padding: 6px 14px;
  background: #F3F4F6;
  color: #374151;
  font-size: 13px;
  font-weight: 700;
  border-radius: 16px;
}

/* Source Link - Prominent Top Position */
.modal-source-section-top {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E7EB;
}

.modal-source-link-prominent {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1E40AF;
  text-decoration: underline;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.modal-source-link-prominent:hover {
  color: #3B82F6;
  text-decoration-thickness: 2px;
}

.source-icon-prominent {
  flex-shrink: 0;
  color: currentColor;
  width: 16px;
  height: 16px;
}

.source-count-badge {
  padding: 2px 6px;
  background: #DBEAFE;
  color: #1E40AF;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
  text-decoration: none;
}

.modal-body {
  padding: 32px;
}

/* LeetCode Match Section */
.leetcode-match-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 2px solid #F3F4F6;
}

.leetcode-badge-large {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%);
  border: 2px solid #FFA116;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 161, 22, 0.15);
}

.leetcode-logo {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.leetcode-info {
  flex: 1;
  min-width: 0;
}

.leetcode-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.leetcode-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.leetcode-difficulty {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
}

.leetcode-difficulty.diff-easy {
  color: #10B981;
  background: #D1FAE5;
}

.leetcode-difficulty.diff-medium {
  color: #F59E0B;
  background: #FEF3C7;
}

.leetcode-difficulty.diff-hard {
  color: #EF4444;
  background: #FEE2E2;
}

.leetcode-number {
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.leetcode-confidence {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
}

.leetcode-practice-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  background: #FFA116;
  color: #FFFFFF;
  text-decoration: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.leetcode-practice-btn:hover {
  background: #FF8C00;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 161, 22, 0.4);
}

.leetcode-practice-btn:active {
  transform: translateY(0);
}

.modal-section {
  margin-bottom: 32px;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  background: #F9FAFB;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--color-navy);
}

.detail-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.detail-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  padding: 8px 16px;
  background: var(--color-baby-blue);
  color: var(--color-navy);
  font-size: 13px;
  font-weight: 600;
  border-radius: 16px;
}

.tips-text {
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
  border-left: 4px solid var(--color-navy);
}

.modal-source-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-navy);
  text-decoration: underline;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.modal-source-link:hover {
  color: var(--color-blue);
  transform: translateX(4px);
}

.source-icon {
  flex-shrink: 0;
}

.source-context {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-charcoal);
  font-style: italic;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .filters-row-controls {
    flex-wrap: wrap;  /* Allow wrapping on tablets if needed */
  }

  .filter-select-compact {
    min-width: 110px;  /* Slightly smaller on tablets */
  }
}

@media (max-width: 768px) {
  .company-question-grid {
    grid-template-columns: 1fr;
  }

  /* Stack all filters vertically on mobile */
  .filters-row-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select-compact {
    width: 100%;
    min-width: 100%;
  }

  .spacer {
    display: none;
  }

  .clear-filters-btn {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .question-header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-difficulty {
    margin-left: 0;
  }

  .difficulty-distribution {
    grid-template-columns: 1fr;
  }

  .modal-header {
    padding: 24px 24px 20px 24px;
  }

  .modal-body {
    padding: 24px;
  }

  .modal-title {
    font-size: 18px;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 12px;
  }

  .page-btn {
    flex: 1;
    min-width: 120px;
  }
}

/* Top Interview Questions from Enhanced Intelligence */
.intelligence-section-divider {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

.intelligence-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.intelligence-section-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.top-questions-table-wrapper {
  overflow-x: auto;
}

.top-questions-table {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  border-collapse: collapse;
}

.top-questions-table thead {
  background-color: #f3f4f6;
}

.top-questions-table th {
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.col-question-header {
  width: 45%;
}

.col-asked-header,
.col-difficulty-header,
.col-time-header,
.col-priority-header {
  text-align: center;
  width: 13.75%;
}

.top-questions-table tbody tr {
  border-top: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.top-questions-table tbody tr:hover {
  background-color: #f9fafb;
}

.top-questions-table tbody tr.priority-critical {
  background-color: #eff6ff;
}

.top-questions-table tbody tr.priority-high {
  background-color: #f0f9ff;
}

.top-questions-table tbody tr.priority-medium {
  background-color: #ffffff;
}

.top-questions-table td {
  padding: 12px 16px;
  font-size: 14px;
}

.col-question {
  width: 45%;
}

.col-asked,
.col-difficulty,
.col-time,
.col-priority {
  text-align: center;
  width: 13.75%;
}

.question-text {
  color: #111827;
  font-weight: 500;
}

.col-asked {
  color: #374151;
  font-weight: 600;
}

.difficulty-stars {
  font-size: 14px;
}

.col-time {
  color: #6b7280;
}

.priority-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.priority-badge.priority-critical {
  background-color: #2563eb;
  color: #ffffff;
}

.priority-badge.priority-high {
  background-color: #3b82f6;
  color: #ffffff;
}

.priority-badge.priority-medium {
  background-color: #60a5fa;
  color: #ffffff;
}

.priority-badge.priority-low {
  background-color: #9ca3af;
  color: #ffffff;
}
</style>
