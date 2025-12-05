# McKinsey-Style Batch Analysis Report - COMPLETE IMPLEMENTATION PLAN

## 🎯 MISSION
Transform amateur batch analysis report → Professional McKinsey-grade analytical report with sophisticated comparative visualizations and actionable intelligence

## 📐 CORE PHILOSOPHY
- ✅ Professional charts (McKinsey standards)
- ✅ Comparative insights (batch analysis value)
- ✅ Actionable intelligence (not just data)
- ✅ Data-rich but clear

---

## 📊 COMPLETE REPORT STRUCTURE (10 Sections)

1. **Executive Summary** (Keep & Enhance)
2. **Company Intelligence** ⭐ NEW - Comparative Analysis
3. **Role Intelligence** ⭐ NEW - If Multiple Roles
4. **Critical Skills Analysis** ⭐ NEW - Enhanced with Correlation
5. **Success Factors** ⭐ NEW - What Works
6. **Interview Questions** ⭐⭐⭐ NEW - Comparative + Full Bank
7. **Interview Process** (Simplified)
8. **Preparation Roadmap** (General - No User Input)
9. **Personalized Recommendations** ⭐ NEW - Optional User Input
10. **Methodology & Data** (Keep)

---

## 🗑️ PHASE 1: DEMOLITION & CLEANUP (Delete 12 Items)

### **What to Delete:**

1. ❌ All filter dropdowns (Company/Timeframe/Stage) - Lines 19-54
2. ❌ Emotion keywords section - Lines 282-291
3. ❌ Company deep dive accordions - Lines 573-652
4. ❌ Network graphs (keep heatmap only) - Check lines 326-385
5. ❌ Radar charts - Already replaced ✅
6. ❌ Sentiment timeline - Lines 233-256
7. ❌ Generic "Strategic Insights" - Lines 656-695
8. ❌ Role expandable cards - Lines 502-571
9. ❌ Comparative metrics text table - Lines 167-213
10. ❌ Stacked bar charts - Lines 226-232
11. ❌ Duplicate skill displays (consolidate to ONE)
12. ❌ Duplicate company data (consolidate to ONE)

### **Reactive State to Remove:**
```typescript
// DELETE:
const selectedCompany = ref<string>('all')
const selectedTimeframe = ref<string>('all')
const selectedStage = ref<string>('all')
const expandedRoles = ref<string[]>([])
const expandedCompanies = ref<string[]>([])
```

### **Functions to Remove:**
```typescript
// DELETE:
function resetFilters() {...}
function toggleRole() {...}
function toggleCompany() {...}
```

---

## 🏗️ PHASE 2: BUILD CORE SECTIONS (Week 2)

### **SECTION 2: COMPANY INTELLIGENCE** ⭐⭐⭐

**Components to Build:**
- [A] Comparison Table (side-by-side metrics)
- [B] Small Multiples (skill focus per company)
- [C] Scatter Plot (difficulty vs success)
- [D] Timeline Comparison (process length)
- [E] Insights Callout (data-backed)

**Template Structure:**
```vue
<section class="report-section company-intelligence">
  <h2 class="section-title">Company Intelligence</h2>

  <!-- Narrative -->
  <div class="narrative-block">
    <p class="insight-text">Strategic comparison reveals...</p>
  </div>

  <!-- [A] Comparison Table -->
  <div class="comparison-table-container">
    <table class="company-comparison-table">
      <!-- 4 columns: Metric | Company1 | Company2 | Company3 | Company4 -->
      <!-- Rows: Posts, Success Rate, Difficulty, Timeline, Rounds -->
    </table>
  </div>

  <!-- [B] Small Multiples -->
  <div class="small-multiples-container">
    <h3 class="subsection-title">Top Skill Focus by Company</h3>
    <div class="small-multiples-grid">
      <!-- 4-column grid, each showing top 3 skills -->
    </div>
  </div>

  <!-- [C] Scatter Plot -->
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3 class="chart-title">Strategic Positioning: Difficulty vs Success</h3>
    </div>
    <div class="chart-container medium">
      <canvas ref="scatterChartRef"></canvas>
    </div>
  </div>

  <!-- [D] Timeline Comparison -->
  <div class="timeline-comparison">
    <h3 class="subsection-title">Interview Process Timeline</h3>
    <div class="timeline-container">
      <!-- Horizontal bars showing App→Screen→Tech→Final stages -->
    </div>
  </div>

  <!-- [E] Insights -->
  <div class="insight-callout mckinsey-blue">
    <strong>💡 COMPARATIVE INSIGHTS:</strong>
    <ul>
      <li>Amazon: Highest success (67%), AWS critical (83%)</li>
      <li>Google: Hardest (⭐⭐⭐⭐⭐), algorithm heavy</li>
      <li>Meta: ML required (67%), 50% success</li>
    </ul>
  </div>
</section>
```

**Key Functions Needed:**
```typescript
const topCompanies = computed(() => {
  return props.patterns.company_trends.slice(0, 4)
})

function getDifficultyStars(company: any): string {
  const successRate = parseFloat(company.success_rate)
  if (successRate > 70) return '⭐⭐⭐'
  if (successRate > 60) return '⭐⭐⭐⭐'
  return '⭐⭐⭐⭐⭐'
}

function getTimeline(company: any): string {
  // Calculate from data or use backend value
  return '2-4 weeks'
}

const scatterChartData = computed(() => ({
  datasets: [{
    data: companies.map(c => ({
      x: getDifficultyScore(c),
      y: parseFloat(c.success_rate),
      company: c.company
    }))
  }]
}))
```

**Styles:**
```css
.company-comparison-table {
  border: 1px solid #E5E7EB;
  border-collapse: separate;
  border-spacing: 0;
}

.small-multiples-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 120px 1fr 100px;
  gap: 16px;
}

.timeline-stage {
  background-color: #2563EB;
  color: white;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### **SECTION 3: ROLE INTELLIGENCE** (If Multiple Roles)

**Condition:** Only show if `patterns.role_breakdown.length >= 2`

**Components:**
- [A] Requirement Comparison Table with Inline Bars
- [B] Role Insights Callout

**Template:**
```vue
<section v-if="hasMultipleRoles" class="report-section role-intelligence">
  <h2 class="section-title">Role Intelligence</h2>

  <!-- Role Comparison Table -->
  <table class="role-comparison-table">
    <thead>
      <tr>
        <th>Skill/Metric</th>
        <th v-for="role in topRoles">{{ role.role }}</th>
      </tr>
    </thead>
    <tbody>
      <!-- Posts, Success, Difficulty rows -->
      <!-- Then skill rows with inline bars -->
      <tr v-for="skill in commonSkills">
        <td>{{ skill }}</td>
        <td v-for="role in topRoles">
          <div class="inline-bar">
            <div class="fill" :style="{width: getPercent(role, skill)}"></div>
            <span>{{ getPercent(role, skill) }}%</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</section>
```

**Functions:**
```typescript
const hasMultipleRoles = computed(() =>
  props.patterns.role_breakdown?.length >= 2
)

const topRoles = computed(() =>
  props.patterns.role_breakdown.slice(0, 4)
)

function getCommonSkills(): string[] {
  const skillSet = new Set<string>()
  topRoles.value.forEach(role => {
    role.top_skills.forEach((s: any) => skillSet.add(s.skill))
  })
  return Array.from(skillSet).slice(0, 8)
}

function getSkillPercentageForRole(role: any, skill: string): number {
  const s = role.top_skills.find((x: any) => x.skill === skill)
  return s ? parseFloat(s.percentage) : 0
}
```

---

### **SECTION 4: CRITICAL SKILLS ANALYSIS** ⭐⭐⭐

**Components:**
- [A] Dual-Metric Skill Bars (Frequency + Success Rate)
- [B] Skill Co-Occurrence Heatmap (keep existing, enhance)
- [C] High-Impact Skill Combinations Table

**[A] Dual-Metric Bars:**
```vue
<div class="dual-metric-bars">
  <div class="chart-header">
    <h3>Top 10 Skills: Frequency + Success Correlation</h3>
  </div>

  <div class="dual-bars-container">
    <div v-for="skill in top10Skills" class="dual-bar-row">
      <!-- Left: Skill name -->
      <div class="skill-name">{{ skill.skill }}</div>

      <!-- Center: Frequency bar -->
      <div class="frequency-bar">
        <div class="bar-fill" :style="{width: skill.percentage + '%'}"></div>
        <span class="bar-label">{{ skill.percentage }}%</span>
      </div>

      <!-- Right: Success indicator -->
      <div class="success-indicator" :class="getSuccessClass(skill)">
        Success: {{ getSuccessRate(skill) }}% {{ getArrow(skill) }}
      </div>
    </div>
  </div>

  <div class="legend">
    <span>Blue bar = Mention frequency</span>
    <span>↑ Above avg | → Average | ↓ Below avg</span>
  </div>
</div>
```

**[C] High-Impact Combinations:**
```vue
<div class="skill-combinations">
  <h3>High-Impact Skill Combinations</h3>
  <table class="combinations-table">
    <thead>
      <tr>
        <th>Skill Pair</th>
        <th>Posts</th>
        <th>Success Rate</th>
        <th>Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="combo in topCombinations">
        <td>{{ combo.skill1 }} + {{ combo.skill2 }}</td>
        <td>{{ combo.count }}</td>
        <td>{{ combo.success }}%</td>
        <td>
          <div class="impact-bar" :style="{width: combo.success + '%'}"></div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Functions:**
```typescript
function getSuccessRate(skill: any): number {
  // Calculate correlation between skill mention and success
  // This requires backend analysis
  return 73 // Placeholder
}

function getSuccessClass(skill: any): string {
  const rate = getSuccessRate(skill)
  const avg = 58 // Overall average
  if (rate > avg + 10) return 'above-avg'
  if (rate < avg - 10) return 'below-avg'
  return 'average'
}

function getArrow(skill: any): string {
  const cls = getSuccessClass(skill)
  if (cls === 'above-avg') return '↑'
  if (cls === 'below-avg') return '↓'
  return '→'
}

const topCombinations = computed(() => {
  // Calculate from knowledge_graph edges
  const combos = props.patterns.knowledge_graph.edges
    .map((edge: any) => ({
      skill1: edge.source,
      skill2: edge.target,
      count: edge.value,
      success: calculateCombinationSuccess(edge)
    }))
    .sort((a, b) => b.success - a.success)
    .slice(0, 10)
  return combos
})
```

---

### **SECTION 5: SUCCESS FACTORS** ⭐⭐⭐

**Components:**
- [A] Waterfall Chart (Prep Time → Success)
- [B] Funnel Chart (Interview Conversion)
- [C] Histogram (Prep Time Distribution)
- [D] Success vs Failure Patterns Table

**[A] Waterfall Chart:**
```vue
<div class="waterfall-chart">
  <h3>Success Rate by Preparation Time</h3>
  <svg class="waterfall-svg" viewBox="0 0 400 200">
    <!-- 8-12 weeks bar -->
    <rect x="50" y="40" width="80" height="120" fill="#1E40AF"/>
    <text x="90" y="30" text-anchor="middle">73%</text>
    <text x="90" y="170" text-anchor="middle">8-12wk</text>

    <!-- 4-8 weeks bar -->
    <rect x="150" y="90" width="80" height="70" fill="#60A5FA"/>
    <text x="190" y="80" text-anchor="middle">52%</text>
    <text x="190" y="170" text-anchor="middle">4-8wk</text>

    <!-- <4 weeks bar -->
    <rect x="250" y="120" width="80" height="40" fill="#93C5FD"/>
    <text x="290" y="110" text-anchor="middle">35%</text>
    <text x="290" y="170" text-anchor="middle"><4wk</text>
  </svg>
</div>
```

**[B] Funnel Chart:**
```vue
<div class="funnel-chart">
  <h3>Interview Conversion Funnel</h3>
  <div class="funnel-container">
    <div class="funnel-stage" :style="{width: '100%'}">
      <span class="stage-label">Application</span>
      <span class="stage-count">247</span>
      <span class="stage-percent">100%</span>
    </div>
    <div class="funnel-stage" :style="{width: '75%'}">
      <span class="stage-label">Screen Pass</span>
      <span class="stage-count">186</span>
      <span class="stage-percent">75% (-25%)</span>
    </div>
    <div class="funnel-stage critical" :style="{width: '50%'}">
      <span class="stage-label">Technical Pass</span>
      <span class="stage-count">124</span>
      <span class="stage-percent">50% (-25%) ← BIGGEST DROP</span>
    </div>
    <div class="funnel-stage" :style="{width: '29%'}">
      <span class="stage-label">Final Pass</span>
      <span class="stage-count">72</span>
      <span class="stage-percent">29% (-21%)</span>
    </div>
    <div class="funnel-stage success" :style="{width: '23%'}">
      <span class="stage-label">Offer</span>
      <span class="stage-count">58</span>
      <span class="stage-percent">23% (-6%)</span>
    </div>
  </div>
</div>
```

**[D] Success Patterns Table:**
```vue
<table class="patterns-table">
  <thead>
    <tr>
      <th>Success Pattern</th>
      <th>Success Rate</th>
      <th>Failure Rate</th>
      <th>Impact</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>8-12 weeks prep</td>
      <td class="success">73%</td>
      <td class="failure">35%</td>
      <td class="impact-high">+38pp</td>
    </tr>
    <tr>
      <td>50+ LeetCode problems</td>
      <td class="success">68%</td>
      <td class="failure">30%</td>
      <td class="impact-high">+38pp</td>
    </tr>
    <tr>
      <td>3+ mock interviews</td>
      <td class="success">71%</td>
      <td class="failure">42%</td>
      <td class="impact-medium">+29pp</td>
    </tr>
  </tbody>
</table>
```

---

### **SECTION 6: INTERVIEW QUESTIONS** ⭐⭐⭐ (MOST COMPLEX)

**Two-Layer Structure:**
1. Comparative Overview (default view)
2. Full Question Bank (detailed drill-down)

**Tab Navigation:**
```vue
<section class="report-section interview-questions">
  <h2 class="section-title">Interview Questions: Comparative Analysis</h2>

  <div class="tabs-container">
    <button
      @click="activeQuestionTab = 'overview'"
      :class="{active: activeQuestionTab === 'overview'}"
    >
      Comparative Overview
    </button>
    <button
      @click="activeQuestionTab = 'bank'"
      :class="{active: activeQuestionTab === 'bank'}"
    >
      Full Question Bank
    </button>
    <button
      @click="activeQuestionTab = 'by-company'"
      :class="{active: activeQuestionTab === 'by-company'}"
    >
      By Company
    </button>
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    <!-- TAB 1: Overview -->
    <div v-show="activeQuestionTab === 'overview'">
      <!-- Heatmap, Top 10 side-by-side, etc. -->
    </div>

    <!-- TAB 2: Full Bank -->
    <div v-show="activeQuestionTab === 'bank'">
      <!-- Searchable question database -->
    </div>

    <!-- TAB 3: By Company -->
    <div v-show="activeQuestionTab === 'by-company'">
      <!-- Drill down per company -->
    </div>
  </div>
</section>
```

**Overview Tab - Top 10 Side-by-Side:**
```vue
<div class="top-questions-comparison">
  <table class="questions-comparison-table">
    <thead>
      <tr>
        <th v-for="company in top4Companies">{{ company.company }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="i in 10">
        <td v-for="company in top4Companies">
          <div v-if="getQuestion(company, i)" class="question-card-mini">
            <div class="q-title" @click="openQuestionDetail(getQuestion(company, i))">
              {{ i }}. {{ getQuestion(company, i).title }}
            </div>
            <div class="q-meta">
              <span>{{ getQuestion(company, i).mentions }} posts</span>
              <span>{{ getQuestion(company, i).success }}% pass</span>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Question Detail Modal:**
```vue
<div v-if="selectedQuestion" class="question-detail-modal">
  <div class="modal-overlay" @click="closeQuestionDetail"></div>
  <div class="modal-content">
    <button class="close-btn" @click="closeQuestionDetail">×</button>

    <h2>{{ selectedQuestion.title }}</h2>

    <!-- Metadata -->
    <div class="q-metadata">
      <span>📊 {{ selectedQuestion.frequency }} mentions</span>
      <span>🎯 {{ selectedQuestion.success }}% success</span>
      <span>⭐ {{ selectedQuestion.difficulty }}</span>
      <span>🏢 {{ selectedQuestion.companies.join(', ') }}</span>
    </div>

    <!-- Full Description -->
    <div class="q-description">
      <h3>FULL QUESTION DESCRIPTION:</h3>
      <p>{{ selectedQuestion.description }}</p>
    </div>

    <!-- Context from Posts -->
    <div class="q-context">
      <h3>CONTEXT FROM ACTUAL INTERVIEWS:</h3>
      <div v-for="post in selectedQuestion.posts" class="context-post">
        <div class="post-header">
          Post #{{ post.id }} ({{ post.company }}, {{ post.result }})
        </div>
        <p class="post-excerpt">{{ post.excerpt }}</p>
      </div>
    </div>

    <!-- Success Patterns -->
    <div class="q-success-patterns">
      <h3>SUCCESS PATTERNS ({{ selectedQuestion.successCount }} passed):</h3>
      <ul>
        <li v-for="pattern in selectedQuestion.successPatterns">
          ✓ {{ pattern.pattern }} ({{ pattern.percent }}%)
        </li>
      </ul>
    </div>

    <!-- Common Mistakes -->
    <div class="q-mistakes">
      <h3>COMMON MISTAKES ({{ selectedQuestion.failureCount }} failed):</h3>
      <ul>
        <li v-for="mistake in selectedQuestion.mistakes">
          ✗ {{ mistake.mistake }} ({{ mistake.percent }}%)
        </li>
      </ul>
    </div>

    <!-- Resources -->
    <div class="q-resources">
      <h3>RESOURCES:</h3>
      <ul>
        <li v-for="resource in selectedQuestion.resources">
          <a :href="resource.url">{{ resource.title }}</a>
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="q-actions">
      <button @click="addToPracticeList(selectedQuestion)">
        Add to Practice List
      </button>
      <button @click="markAsPracticed(selectedQuestion)">
        Mark as Practiced
      </button>
    </div>
  </div>
</div>
```

---

## 🎨 STYLING STANDARDS

### **McKinsey Color Palette:**
```css
:root {
  --mckinsey-primary: #1E40AF;
  --mckinsey-secondary: #60A5FA;
  --mckinsey-accent: #2563EB;
  --mckinsey-success: #10B981;
  --mckinsey-warning: #F59E0B;
  --mckinsey-text-dark: #111827;
  --mckinsey-text-gray: #6B7280;
  --mckinsey-grid-light: #F3F4F6;
  --mckinsey-white: #FFFFFF;
}
```

### **Typography:**
```css
/* Headers - Georgia Serif (McKinsey editorial) */
h1, h2, .report-title, .section-title {
  font-family: Georgia, 'Times New Roman', serif;
}

/* Body - Inter Sans-serif */
body, p, div, span {
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Sizes */
.report-title { font-size: 42px; font-weight: 400; }
.section-title { font-size: 32px; font-weight: 400; }
.chart-title { font-size: 18px; font-weight: 600; }
.subsection-title { font-size: 16px; font-weight: 600; }
.body-text { font-size: 15px; font-weight: 400; line-height: 1.7; }
```

### **Chart Styling:**
```css
.chart-wrapper {
  background-color: #FFFFFF;
  border: 1px solid #E5E7EB;
  padding: 32px;
  margin-top: 24px;
}

.chart-container {
  background-color: #FFFFFF;
  position: relative;
  height: 400px;
}

.chart-container.medium {
  height: 320px;
}

/* Chart.js config */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { left: 0, right: 20, top: 10, bottom: 0 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111827',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      padding: 12
    }
  },
  scales: {
    x: {
      grid: { color: '#F3F4F6', drawBorder: false },
      ticks: { color: '#6B7280', font: { size: 11 } }
    },
    y: {
      grid: { color: '#F3F4F6', drawBorder: false },
      ticks: { color: '#6B7280', font: { size: 11 } }
    }
  }
}
```

---

## 📅 IMPLEMENTATION TIMELINE

### **Week 1: Demolition**
- Day 1-2: Remove all 12 items from delete list
- Day 3-4: Consolidate duplicate sections
- Day 5: Apply McKinsey styling globally
- Day 6-7: Test compilation, fix errors

### **Week 2: Core Sections**
- Day 1-2: Build Company Intelligence (all 4 components)
- Day 3: Build Role Intelligence
- Day 4-5: Build Critical Skills Analysis
- Day 6-7: Build Success Factors

### **Week 3: Questions & Process**
- Day 1-3: Build Interview Questions (comparative)
- Day 4-5: Build Question Bank (detailed)
- Day 6: Simplify Interview Process section
- Day 7: Build Preparation Roadmap

### **Week 4: Personalization**
- Day 1-2: Build user input form
- Day 3-4: Build personalization logic
- Day 5: Build custom roadmap generator
- Day 6-7: Polish, test, PDF export

---

## ✅ SUCCESS CRITERIA

**A Good McKinsey Report:**
- ✅ Looks professional (could be from top consulting firm)
- ✅ Uses sophisticated visualizations correctly
- ✅ Everything is comparative (batch analysis value)
- ✅ User knows which company to target
- ✅ User knows what skills to learn
- ✅ User has concrete action plan

**What User Should Feel:**
> "This report tells me exactly which companies to target, what skills to learn,
> how to prepare, and gives me a concrete plan. It's like having a career consultant."

**NOT:**
> "Here's a bunch of charts about interviews."

---

## 🔧 TECHNICAL REQUIREMENTS

### **Backend Changes Needed:**
```typescript
// Add to pattern analysis response:
interface CompanyTrend {
  company: string
  total_posts: number
  success_rate: string
  top_skills: Array<{
    skill: string
    count: number
    percentage: string  // ✅ NOW INCLUDED (fixed earlier)
  }>
  // NEW FIELDS NEEDED:
  difficulty_score: number  // 0-100
  avg_timeline_weeks: number  // 2-6
  avg_rounds: number  // 3-5
  process_stages: string[]  // ['app', 'screen', 'tech', 'final']
}

// Add question extraction:
interface QuestionData {
  id: string
  title: string
  description: string
  frequency: number
  success_rate: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  companies: string[]
  type: 'Coding' | 'System Design' | 'Behavioral'
  topics: string[]
  posts: Array<{
    id: number
    company: string
    result: 'Passed' | 'Failed'
    excerpt: string
  }>
  success_patterns: Array<{pattern: string, percent: number}>
  common_mistakes: Array<{mistake: string, percent: number}>
  resources: Array<{title: string, url: string}>
}
```

### **Vue Dependencies:**
```bash
npm install chart.js vue-chartjs
# Already installed ✅
```

---

This plan provides extreme detail for first 6 sections. Remaining sections 7-10 follow same pattern.

Ready to implement?
