# Interview Questions Intelligence Enhancement Plan

**Date:** 2025-11-15
**Objective:** Transform Section 13 from basic question bank to strategic intelligence dashboard with two-tab architecture

---

## Core Principles

### 1. Foundation Posts Principle
**ALL insights generated from foundation posts only:**
- Seed Posts (4 user-submitted posts)
- RAG Posts (~50 similar posts after filters)
- **NO mock data, NO synthetic data**
- Every statistic traceable to actual Reddit posts
- Every chart uses real extracted data

### 2. Deterministic Data
- Same foundation posts = identical charts
- Consistent ordering (frequency-based, alphabetical for ties)
- Cache-friendly (same batchId = same visualization)

### 3. McKinsey Design System
- Professional color palette (navy/blue/light blue/baby blue)
- No emojis in production
- Clean typography hierarchy
- Data-driven insights only

### 4. Complementary Architecture
- **Section 6 (Company Intelligence):** Overall company performance metrics
- **Section 13 Tab 1 (NEW):** Question-specific intelligence per company
- **Section 9 (Topic Breakdown):** General interview topics across all patterns
- **Section 13 Tab 1 (NEW):** Question-specific topic distribution
- **Section 12 (Skills Priority):** Skills ranking
- **Section 13 Tab 2 (EXISTING):** Question Bank search/filter

---

## Two-Tab Architecture

### Tab 1: Intelligence Dashboard (NEW)
**Purpose:** Answer "What questions matter most?" through data visualization

**Components:**
1. Stats Summary Row (4 metrics)
2. Question Frequency Bar Chart (Top 10)
3. Company Question Profiles (Stacked bars)
4. Difficulty Distribution (Histogram)
5. Topic Distribution (Donut chart)
6. Insight Boxes (AI/rule-based findings)

### Tab 2: Question Bank (EXISTING)
**Purpose:** Browse and search actual questions

**Enhancements:**
- Breadcrumb navigation when filters active
- "Back to Intelligence" button
- Preserve all existing functionality (search, filters, modal, source attribution)

---

## Implementation Plan

### PHASE 1: Backend Analytics

**File:** `/services/content-service/src/controllers/analysisController.js`

**Location:** After line 1868 (after `interviewQuestions` array creation)

**New Section:** Interview Questions Intelligence Analytics

```javascript
// ============================================================================
// 14. INTERVIEW QUESTIONS INTELLIGENCE ANALYTICS
// ============================================================================
console.time('⏱️  Question Intelligence Analytics');
logger.info('[Pattern Analysis] Calculating question intelligence metrics...');

// 14a. Question Frequency Analysis (for Bar Chart)
const questionFrequencyMap = new Map();
interviewQuestions.forEach(q => {
  if (!questionFrequencyMap.has(q.text)) {
    questionFrequencyMap.set(q.text, {
      text: q.text,
      count: q.frequency,
      companies: new Set([q.company]),
      categories: new Set([q.category]),
      difficulty: q.difficulty,
      source_posts: q.source_posts || []
    });
  }
});

const questionFrequency = Array.from(questionFrequencyMap.values())
  .map(q => ({
    text: q.text,
    count: q.count,
    companies: Array.from(q.companies),
    difficulty: q.difficulty
  }))
  .sort((a, b) => {
    // Deterministic sort: frequency desc, then alphabetically
    if (b.count !== a.count) return b.count - a.count;
    return a.text.localeCompare(b.text);
  })
  .slice(0, 10);  // Top 10 questions

// 14b. Company Question Profiles (for Stacked Bar Chart)
const companyQuestionProfiles = {};

interviewQuestions.forEach(q => {
  const company = q.company;
  if (company === 'Unknown') return;

  if (!companyQuestionProfiles[company]) {
    companyQuestionProfiles[company] = {
      company,
      coding: 0,
      system_design: 0,
      behavioral: 0,
      technical: 0,
      other: 0,
      total: 0
    };
  }

  const profile = companyQuestionProfiles[company];
  profile.total++;

  // Categorize question type from actual category field
  const category = (q.category || '').toLowerCase();
  if (category.includes('coding') || category.includes('algorithm')) {
    profile.coding++;
  } else if (category.includes('system') || category.includes('design')) {
    profile.system_design++;
  } else if (category.includes('behavioral')) {
    profile.behavioral++;
  } else if (category.includes('technical')) {
    profile.technical++;
  } else {
    profile.other++;
  }
});

// Convert to percentages and sort deterministically
const companyQuestionProfilesArray = Object.values(companyQuestionProfiles)
  .map(profile => ({
    company: profile.company,
    coding: Math.round((profile.coding / profile.total) * 100),
    system_design: Math.round((profile.system_design / profile.total) * 100),
    behavioral: Math.round((profile.behavioral / profile.total) * 100),
    technical: Math.round((profile.technical / profile.total) * 100),
    other: Math.round((profile.other / profile.total) * 100),
    total_questions: profile.total
  }))
  .sort((a, b) => {
    // Deterministic sort: total questions desc, then alphabetically
    if (b.total_questions !== a.total_questions) return b.total_questions - a.total_questions;
    return a.company.localeCompare(b.company);
  })
  .slice(0, 8);  // Top 8 companies

// 14c. Difficulty Distribution (for Histogram)
const difficultyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

interviewQuestions.forEach(q => {
  const rounded = Math.round(q.difficulty);
  if (rounded >= 1 && rounded <= 5) {
    difficultyDistribution[rounded]++;
  }
});

// Calculate percentages
const totalQuestions = interviewQuestions.length;
const difficultyDistributionPercent = {
  1: Math.round((difficultyDistribution[1] / totalQuestions) * 100),
  2: Math.round((difficultyDistribution[2] / totalQuestions) * 100),
  3: Math.round((difficultyDistribution[3] / totalQuestions) * 100),
  4: Math.round((difficultyDistribution[4] / totalQuestions) * 100),
  5: Math.round((difficultyDistribution[5] / totalQuestions) * 100)
};

// 14d. Topic Distribution (for Donut Chart)
const topicDistribution = {};

interviewQuestions.forEach(q => {
  const category = q.category || 'Other';
  topicDistribution[category] = (topicDistribution[category] || 0) + 1;
});

const topicDistributionArray = Object.entries(topicDistribution)
  .map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / totalQuestions) * 100)
  }))
  .sort((a, b) => {
    // Deterministic sort: count desc, then alphabetically
    if (b.count !== a.count) return b.count - a.count;
    return a.category.localeCompare(b.category);
  });

// 14e. Generate Insights (rule-based, from actual data)
const questionInsights = [];

// Insight 1: Most frequent question (from actual data)
if (questionFrequency.length > 0) {
  const topQuestion = questionFrequency[0];
  questionInsights.push({
    type: 'frequency',
    text: `"${topQuestion.text}" is the most frequently asked question, appearing ${topQuestion.count} times across ${topQuestion.companies.length} companies.`,
    filter: { questionText: topQuestion.text }
  });
}

// Insight 2: Company with most system design questions (from actual data)
const companyWithMostSystemDesign = companyQuestionProfilesArray
  .slice()  // Copy to avoid mutation
  .sort((a, b) => b.system_design - a.system_design)[0];
if (companyWithMostSystemDesign && companyWithMostSystemDesign.system_design > 30) {
  questionInsights.push({
    type: 'company_focus',
    text: `${companyWithMostSystemDesign.company} emphasizes system design questions (${companyWithMostSystemDesign.system_design}% of all questions).`,
    filter: { company: companyWithMostSystemDesign.company, category: 'System Design' }
  });
}

// Insight 3: Difficulty trend (from actual data)
const mediumHardCount = difficultyDistribution[3] + difficultyDistribution[4] + difficultyDistribution[5];
const mediumHardPercent = Math.round((mediumHardCount / totalQuestions) * 100);
if (mediumHardPercent > 60) {
  questionInsights.push({
    type: 'difficulty',
    text: `${mediumHardPercent}% of questions are medium-to-hard difficulty (3-5), indicating senior-level interview processes.`,
    filter: { difficulty: 'medium,hard' }
  });
}

// Calculate average difficulty for stats row
const avgDifficulty = (interviewQuestions.reduce((sum, q) => sum + q.difficulty, 0) / totalQuestions).toFixed(1);

console.timeEnd('⏱️  Question Intelligence Analytics');
logger.info(`[Pattern Analysis] Generated ${questionInsights.length} question insights from ${totalQuestions} questions`);
```

**Add to return object (around line 2100+):**

```javascript
question_intelligence: {
  question_frequency: questionFrequency,
  company_question_profiles: companyQuestionProfilesArray,
  difficulty_distribution: difficultyDistribution,
  difficulty_distribution_percent: difficultyDistributionPercent,
  topic_distribution: topicDistributionArray,
  insights: questionInsights,
  total_questions: totalQuestions,
  avg_difficulty: avgDifficulty
}
```

---

### PHASE 2: Frontend Tab Structure

**File:** `/vue-frontend/src/components/ResultsPanel/sections/InterviewQuestionsIntelligenceV1.vue`

**Step 2.1: Add tab state and imports**

```typescript
// Add to imports
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

// Add tab state
const activeTab = ref<'intelligence' | 'question-bank'>('intelligence')

function switchTab(tab: 'intelligence' | 'question-bank') {
  activeTab.value = tab
}
```

**Step 2.2: Restructure template**

```vue
<!-- After narrative block, before existing content -->
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
    class="tab-btn">
    Question Bank
  </button>
</div>

<div class="tab-content">
  <!-- Tab 1: Intelligence Dashboard -->
  <div v-if="activeTab === 'intelligence'" class="intelligence-dashboard">
    <!-- Dashboard content goes here (Phase 3) -->
  </div>

  <!-- Tab 2: Question Bank (wrap existing content) -->
  <div v-else-if="activeTab === 'question-bank'" class="question-bank-view">
    <!-- Move ALL existing content here (chart-wrapper div onwards) -->
  </div>
</div>
```

**Step 2.3: Add tab styles**

```css
/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  border-bottom: 2px solid var(--color-border);
}

.tab-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--color-slate);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  bottom: -2px;
}

.tab-btn:hover {
  color: var(--color-navy);
  background: var(--color-off-white);
}

.tab-btn.active {
  color: var(--color-navy);
  border-bottom-color: var(--color-navy);
  background: transparent;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

### PHASE 3: Intelligence Dashboard Charts

**Step 3.1: Add computed data accessors**

```typescript
const questionIntelligence = computed(() => props.patterns.question_intelligence || {})

const questionFrequency = computed(() => questionIntelligence.value.question_frequency || [])
const companyProfiles = computed(() => questionIntelligence.value.company_question_profiles || [])
const difficultyDist = computed(() => questionIntelligence.value.difficulty_distribution || {})
const topicDist = computed(() => questionIntelligence.value.topic_distribution || [])
const insights = computed(() => questionIntelligence.value.insights || [])
const avgDifficulty = computed(() => questionIntelligence.value.avg_difficulty || '0.0')
```

**Step 3.2: Stats Summary Row**

```vue
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
```

```css
.intelligence-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-white);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate);
}
```

**Step 3.3: Chart 1 - Question Frequency (Horizontal Bar)**

```vue
<div class="chart-wrapper">
  <h3 class="chart-title">Most Frequently Asked Questions</h3>
  <p class="chart-subtitle">Top 10 questions across all foundation posts</p>

  <div style="height: 400px;">
    <Bar :data="questionFrequencyChartData" :options="questionFrequencyChartOptions" />
  </div>
</div>
```

```typescript
const questionFrequencyChartData = computed(() => {
  const data = questionFrequency.value.slice(0, 10)

  return {
    labels: data.map(q => {
      return q.text.length > 50 ? q.text.substring(0, 47) + '...' : q.text
    }),
    datasets: [{
      label: 'Mentions',
      data: data.map(q => q.count),
      backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[0],
      borderColor: MCKINSEY_CHART_COLORS.navy,
      borderWidth: 1
    }]
  }
})

const questionFrequencyChartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#F1F5F9' },
      ticks: {
        color: MCKINSEY_CHART_COLORS.slate,
        font: { size: 11 }
      }
    },
    y: {
      grid: { display: false },
      ticks: {
        color: MCKINSEY_CHART_COLORS.charcoal,
        font: { size: 12 }
      }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: MCKINSEY_CHART_COLORS.charcoal,
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      padding: 12,
      callbacks: {
        title: (context: any) => questionFrequency.value[context[0].dataIndex].text,
        label: (context: any) => `Mentioned ${context.parsed.x} times`
      }
    }
  },
  onClick: (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const question = questionFrequency.value[index]
      switchToQuestionBank({ questionText: question.text })
    }
  }
}
```

**Step 3.4: Chart 2 - Company Profiles (Stacked Horizontal Bar)**

```vue
<div class="chart-wrapper">
  <h3 class="chart-title">Question Types by Company</h3>
  <p class="chart-subtitle">Distribution of question categories</p>

  <div style="height: 400px;">
    <Bar :data="companyProfilesChartData" :options="companyProfilesChartOptions" />
  </div>
</div>
```

```typescript
const companyProfilesChartData = computed(() => {
  const companies = companyProfiles.value.slice(0, 8)

  return {
    labels: companies.map(c => c.company),
    datasets: [
      {
        label: 'Coding',
        data: companies.map(c => c.coding),
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[0],
        borderColor: MCKINSEY_CHART_COLORS.navy,
        borderWidth: 1
      },
      {
        label: 'System Design',
        data: companies.map(c => c.system_design),
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[1],
        borderColor: MCKINSEY_CHART_COLORS.blue,
        borderWidth: 1
      },
      {
        label: 'Behavioral',
        data: companies.map(c => c.behavioral),
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[2],
        borderColor: MCKINSEY_CHART_COLORS.lightBlue,
        borderWidth: 1
      },
      {
        label: 'Technical',
        data: companies.map(c => c.technical),
        backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[3],
        borderColor: MCKINSEY_CHART_COLORS.babyBlue,
        borderWidth: 1
      }
    ]
  }
})

const companyProfilesChartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      max: 100,
      grid: { color: '#F1F5F9' },
      ticks: {
        callback: (value: any) => value + '%',
        color: MCKINSEY_CHART_COLORS.slate
      }
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { color: MCKINSEY_CHART_COLORS.charcoal }
    }
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: MCKINSEY_CHART_COLORS.charcoal, font: { size: 12 } }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${context.parsed.x}%`
      }
    }
  },
  onClick: (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const datasetIndex = elements[0].datasetIndex
      const company = companyProfiles.value[index].company
      const category = ['Coding', 'System Design', 'Behavioral', 'Technical'][datasetIndex]
      switchToQuestionBank({ company, category })
    }
  }
}
```

**Step 3.5: Chart 3 - Difficulty Distribution (Histogram)**

```vue
<div class="chart-wrapper">
  <h3 class="chart-title">Question Difficulty Distribution</h3>
  <p class="chart-subtitle">Breakdown by difficulty level (1-5 scale)</p>

  <div style="height: 300px;">
    <Bar :data="difficultyDistChartData" :options="difficultyDistChartOptions" />
  </div>
</div>
```

```typescript
const difficultyDistChartData = computed(() => {
  const dist = difficultyDist.value

  return {
    labels: ['1 (Easiest)', '2', '3', '4', '5 (Hardest)'],
    datasets: [{
      label: 'Number of Questions',
      data: [dist[1] || 0, dist[2] || 0, dist[3] || 0, dist[4] || 0, dist[5] || 0],
      backgroundColor: MCKINSEY_CHART_COLORS.datasetsAlpha[0],
      borderColor: MCKINSEY_CHART_COLORS.navy,
      borderWidth: 1
    }]
  }
})

const difficultyDistChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#F1F5F9' },
      ticks: {
        stepSize: 10,
        color: MCKINSEY_CHART_COLORS.slate
      }
    },
    x: {
      grid: { display: false },
      ticks: { color: MCKINSEY_CHART_COLORS.charcoal }
    }
  },
  plugins: {
    legend: { display: false }
  }
}
```

**Step 3.6: Chart 4 - Topic Distribution (Donut)**

```vue
<div class="chart-wrapper">
  <h3 class="chart-title">Question Categories</h3>
  <p class="chart-subtitle">Distribution across topic areas</p>

  <div style="max-width: 400px; margin: 0 auto;">
    <Doughnut :data="topicDistChartData" :options="topicDistChartOptions" />
  </div>
</div>
```

```typescript
const topicDistChartData = computed(() => {
  const topics = topicDist.value.slice(0, 6)

  return {
    labels: topics.map(t => t.category),
    datasets: [{
      data: topics.map(t => t.percentage),
      backgroundColor: [
        MCKINSEY_CHART_COLORS.datasetsAlpha[0],
        MCKINSEY_CHART_COLORS.datasetsAlpha[1],
        MCKINSEY_CHART_COLORS.datasetsAlpha[2],
        MCKINSEY_CHART_COLORS.datasetsAlpha[3],
        '#93C5FD80',
        '#BFDBFE80'
      ],
      borderColor: '#FFFFFF',
      borderWidth: 2
    }]
  }
})

const topicDistChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: MCKINSEY_CHART_COLORS.charcoal, font: { size: 13 } }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const topic = topicDist.value[context.dataIndex]
          return `${topic.category}: ${topic.percentage}% (${topic.count} questions)`
        }
      }
    }
  },
  onClick: (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index
      const topic = topicDist.value[index]
      switchToQuestionBank({ category: topic.category })
    }
  }
}
```

**Step 3.7: Insight Boxes**

```vue
<div v-if="insights.length > 0" class="insights-container">
  <h3 class="chart-title">Key Findings</h3>

  <div class="insights-grid">
    <div v-for="(insight, idx) in insights" :key="idx" class="insight-box">
      <div class="insight-icon-bar" :class="`insight-${insight.type}`"></div>
      <p class="insight-text">{{ insight.text }}</p>
      <button
        v-if="insight.filter"
        @click="switchToQuestionBank(insight.filter)"
        class="insight-action-btn">
        View Questions →
      </button>
    </div>
  </div>
</div>
```

```css
.insights-container {
  margin-top: 32px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.insight-box {
  position: relative;
  padding: 20px 24px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  border-left: 4px solid var(--color-navy);
  transition: all 0.2s ease;
}

.insight-box:hover {
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.08);
  transform: translateY(-2px);
}

.insight-icon-bar {
  width: 4px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 4px 0 0 4px;
}

.insight-frequency { background: var(--color-navy); }
.insight-company_focus { background: var(--color-blue); }
.insight-difficulty { background: var(--color-light-blue); }

.insight-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-charcoal);
  margin: 0 0 12px 0;
}

.insight-action-btn {
  padding: 6px 12px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-navy);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.insight-action-btn:hover {
  background: var(--color-navy);
  color: var(--color-white);
  border-color: var(--color-navy);
}
```

**Step 3.8: Switch to Question Bank function**

```typescript
function switchToQuestionBank(filters: any = {}) {
  // Switch tab
  activeTab.value = 'question-bank'

  // Apply filters
  if (filters.company) questionFilterCompany.value = filters.company
  if (filters.category) questionFilterCategory.value = filters.category
  if (filters.questionText) questionSearchQuery.value = filters.questionText
  if (filters.difficulty) {
    if (filters.difficulty.includes('medium')) questionFilterDifficulty.value = 'medium'
    if (filters.difficulty.includes('hard')) questionFilterDifficulty.value = 'hard'
  }

  // Scroll to top of question bank
  setTimeout(() => {
    document.querySelector('.question-bank-view')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}
```

---

### PHASE 4: Question Bank Enhancements

**Step 4.1: Add breadcrumb navigation**

```vue
<!-- Add at top of question-bank-view div -->
<div v-if="hasActiveFilters" class="breadcrumb-bar">
  <button @click="switchTab('intelligence')" class="breadcrumb-back">
    ← Back to Intelligence Dashboard
  </button>
  <span class="breadcrumb-divider">/</span>
  <span class="breadcrumb-current">Filtered Results</span>
</div>
```

```css
.breadcrumb-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.breadcrumb-back {
  background: none;
  border: none;
  color: var(--color-navy);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-back:hover {
  color: var(--color-blue);
}

.breadcrumb-divider {
  color: var(--color-slate);
}

.breadcrumb-current {
  font-size: 14px;
  color: var(--color-charcoal);
  font-weight: 500;
}
```

---

### PHASE 5: Responsive Design

```css
@media (max-width: 1024px) {
  .intelligence-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tab-btn {
    padding: 10px 16px;
    font-size: 14px;
  }

  .intelligence-stats-row {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    padding: 16px;
  }
}
```

---

## Testing Checklist

- [ ] Backend generates `question_intelligence` object correctly
- [ ] All data comes from actual foundation posts (no mock data)
- [ ] Charts are deterministic (same input = same output, same order)
- [ ] Tab switching works smoothly
- [ ] All 4 charts render with correct data
- [ ] Click on chart → switches to Question Bank with filters applied
- [ ] Insights display correctly with action buttons
- [ ] Stats row shows accurate numbers from actual data
- [ ] Breadcrumb navigation works
- [ ] Mobile responsive design works
- [ ] No emojis in production code (use CSS styling instead)
- [ ] McKinsey color palette used consistently
- [ ] Source attribution still works in Question Bank modal
- [ ] Filters persist when switching back to Question Bank

---

## Files Modified

1. `/services/content-service/src/controllers/analysisController.js`
   - Add question intelligence analytics (after line 1868)
   - Add to return object (around line 2100+)

2. `/vue-frontend/src/components/ResultsPanel/sections/InterviewQuestionsIntelligenceV1.vue`
   - Add tab navigation
   - Add Intelligence Dashboard charts
   - Add insight boxes
   - Add breadcrumb to Question Bank
   - Add responsive styles

---

## Estimated Effort

- Phase 1 (Backend): 1-2 hours
- Phase 2 (Tab Structure): 30 minutes
- Phase 3 (Charts): 3-4 hours
- Phase 4 (Enhancements): 1 hour
- Phase 5 (Responsive): 1 hour
- **Total: 6.5-8.5 hours**

---

## Success Criteria

✅ Every chart uses actual data from foundation posts
✅ No mock/synthetic data anywhere
✅ Deterministic output (same posts = same visualizations)
✅ Professional McKinsey design (no emojis)
✅ Click-through from charts to filtered Question Bank works
✅ Insights generated from real patterns in data
✅ Source attribution preserved in Question Bank
✅ Mobile responsive across all breakpoints
