# MultiPostPatternReport Architecture Diagram

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                  MultiPostPatternReport.vue                      │
│                         (200 lines)                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Uses: usePatternData, useSkillData composables            │  │
│  │ Imports: 14 section components                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              ▼                                 ▼
        ┌──────────────────────────────────┐   ┌──────────────────────────────┐
        │   Section Components (14)        │   │   Composables (10)           │
        │   ├─ ReportHeader               │   │   ├─ usePatternData          │
        │   ├─ YourExperiencesSection     │   │   ├─ useCompanyData          │
        │   ├─ ExecutiveSummarySection    │   │   ├─ useRoleData             │
        │   ├─ SkillLandscapeSection      │   │   ├─ useSkillData            │
        │   ├─ CompanyIntelligenceSection │   │   ├─ useSuccessMetrics       │
        │   └─ ... (9 more)               │   │   ├─ useChartData            │
        └──────────────────────────────────┘   │   ├─ useChartOptions         │
                       │                        │   ├─ useQuestionBank         │
                       │                        │   ├─ useNarrativeGenerator   │
                       │                        │   └─ useReportExport         │
                       │                        └──────────────────────────────┘
                       │                                       │
                       ├───────────────────────────────────────┤
                       ▼                                       ▼
        ┌──────────────────────────────────┐   ┌──────────────────────────────┐
        │   Chart Components (8)           │   │   Utils (4)                  │
        │   ├─ BarChart.vue               │   │   ├─ formatters.ts           │
        │   ├─ ScatterChart.vue           │   │   ├─ calculators.ts          │
        │   ├─ LineChart.vue              │   │   ├─ dataTransformers.ts     │
        │   ├─ DoughnutChart.vue          │   │   └─ mockDataGenerators.ts   │
        │   ├─ WaterfallChart.vue         │   └──────────────────────────────┘
        │   ├─ FunnelChart.vue            │                  │
        │   ├─ HeatmapChart.vue           │                  │
        │   └─ SmallMultiplesChart.vue    │                  ▼
        └──────────────────────────────────┘   ┌──────────────────────────────┐
                       │                        │   Constants (3)              │
                       │                        │   ├─ chartColors.ts          │
                       ├────────────────────────│   ├─ chartDefaults.ts        │
                       │                        │   └─ reportConfig.ts         │
                       ▼                        └──────────────────────────────┘
        ┌──────────────────────────────────┐
        │   Widget Components (15)         │
        │   ├─ BigNumberDisplay.vue       │
        │   ├─ MetricCard.vue             │
        │   ├─ ComparisonTable.vue        │
        │   ├─ ProcessTimeline.vue        │
        │   ├─ NarrativeBlock.vue         │
        │   ├─ InsightCallout.vue         │
        │   ├─ TabNavigation.vue          │
        │   └─ ... (8 more)               │
        └──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │   Shared Components (5)          │
        │   ├─ SentimentBadge.vue         │
        │   ├─ SkillsPriorityMatrix.vue   │
        │   ├─ DifficultyBadge.vue        │
        │   ├─ PriorityBadge.vue          │
        │   └─ Pagination.vue             │
        └──────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│  props.patterns (from backend API)                                │
│  - summary, skill_frequency, company_trends, etc.                 │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  usePatternData(patterns)                                         │
│  - Transforms raw backend data                                     │
│  - Returns: userPosts, totalPosts, successRate, etc.              │
└───────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
    ┌──────────────┐ ┌─────────────���┐ ┌──────────────┐
    │useCompanyData│ │  useSkillData │ │ useRoleData  │
    │              │ │               │ │              │
    │- Filters     │ │- Correlations │ │- Comparisons │
    │- Aggregates  │ │- Metrics      │ │- Rankings    │
    │- Scatter pts │ │- Heatmap data │ │- Stats       │
    └──────────────┘ └──────────────┘ └──────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  useChartData()                                                   │
│  - Converts processed data into Chart.js format                   │
│  - Returns: { labels: [...], datasets: [...] }                   │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  Chart Components (BarChart, ScatterChart, etc.)                 │
│  - Receives chart data + options                                  │
│  - Merges with defaults from chartDefaults.ts                     │
│  - Renders using vue-chartjs                                      │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  Section Components                                               │
│  - Composes charts, widgets, and narrative blocks                │
│  - Passes specific data slices to child components                │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  MultiPostPatternReport (Main)                                    │
│  - Orchestrates all sections                                      │
│  - Minimal logic (just composition)                               │
└───────────────────────────────────────────────────────────────────┘
```

---

## Example: Skill Landscape Section Flow

```
Backend API Response
│
│ {
│   skill_frequency: [
│     { skill: 'React', percentage: 45.2, count: 123 },
│     { skill: 'Python', percentage: 38.7, count: 105 },
│     ...
│   ]
│ }
│
▼
usePatternData(patterns)
│
│ - Validates data structure
│ - Ensures required fields exist
│
▼
useSkillData(patterns)
│
│ const topSkillsWithMetrics = computed(() => {
│   return patterns.value.skill_frequency.slice(0, 10).map(skill => ({
│     name: skill.skill,
│     demand: skill.percentage,
│     successImpact: calculateSuccessImpact(skill),
│     priority: calculatePriority(skill.percentage, successImpact)
│   }))
│ })
│
▼
useChartData(topSkillsWithMetrics)
│
│ const skillChartData = computed(() => ({
│   labels: topSkills.value.map(s => s.name),
│   datasets: [{
│     label: 'Skill Demand',
│     data: topSkills.value.map(s => s.demand),
│     backgroundColor: MCKINSEY_COLORS.primaryBlue,
│     borderColor: MCKINSEY_COLORS.primaryBlue
│   }]
│ }))
│
▼
BarChart.vue
│
│ <template>
│   <div class="chart-container">
│     <Bar :data="data" :options="mergedOptions" />
│   </div>
│ </template>
│
│ const mergedOptions = computed(() =>
│   merge({}, DEFAULT_BAR_OPTIONS, props.options)
│ )
│
▼
SkillLandscapeSection.vue
│
│ <template>
│   <section class="report-section">
│     <h2 class="section-title">Skill Landscape Analysis</h2>
│     <NarrativeBlock :text="narrative" />
│     <BarChart :data="chartData" :options="chartOptions" />
│   </section>
│ </template>
│
▼
MultiPostPatternReport.vue
│
│ <SkillLandscapeSection :patterns="patterns" />
│
▼
Rendered UI
```

---

## Dependency Graph

```
Level 0 (No Dependencies)
├─ constants/chartColors.ts
├─ constants/chartDefaults.ts
├─ constants/reportConfig.ts
└─ utils/formatters.ts
    └─ utils/calculators.ts (uses formatters)

Level 1 (Constants + Utils)
├─ composables/usePatternData.ts
├─ composables/useCompanyData.ts
├─ composables/useRoleData.ts
├─ composables/useSkillData.ts
└─ composables/useSuccessMetrics.ts

Level 2 (Data Composables)
├─ composables/useChartData.ts
├─ composables/useChartOptions.ts
├─ composables/useQuestionBank.ts
└─ composables/useNarrativeGenerator.ts

Level 3 (UI Components - Base)
├─ Charts/BarChart.vue
├─ Charts/ScatterChart.vue
├─ Widgets/MetricCard.vue
├─ Widgets/NarrativeBlock.vue
└─ Shared/DifficultyBadge.vue

Level 4 (UI Components - Complex)
├─ Charts/WaterfallChart.vue
├─ Widgets/BigNumberDisplay.vue
└─ Widgets/ComparisonTable.vue

Level 5 (Section Components)
├─ Sections/SkillLandscapeSection.vue
├─ Sections/CompanyIntelligenceSection.vue
└─ ... (12 more)

Level 6 (Main Component)
└─ MultiPostPatternReport.vue
```

---

## File Size Distribution

```
Current (Monolith):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 7,599 lines
MultiPostPatternReport.vue

After Refactor (Modular):
Sections (14 files, avg 200 lines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2,800 lines

Composables (10 files, avg 250 lines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2,500 lines

Charts (8 files, avg 150 lines):
━━━━━━━━━━━━━━━ 1,200 lines

Widgets (15 files, avg 100 lines):
━━━━━━━━━━━━━━━━━━ 1,500 lines

Utils + Constants (7 files, avg 100 lines):
━━━━━━━━━ 700 lines

Styles (5 SCSS files, avg 560 lines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2,800 lines

Main Component (1 file):
━━ 200 lines

Total: ~11,700 lines (organized, testable, maintainable)
```

---

## Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Testing Pyramid                        │
│                                                          │
│                      E2E Tests (5%)                      │
│                  ┌─────────────────┐                     │
│                  │ Playwright      │                     │
│                  │ - Full report   │                     │
│                  │ - User flows    │                     │
│                  └─────────────────┘                     │
│                                                          │
│             Integration Tests (15%)                      │
│          ┌─────────────────────────────┐                │
│          │ Vitest + Vue Test Utils     │                │
│          │ - Section rendering         │                │
│          │ - Data flow through comp    │                │
│          └─────────────────────────────┘                │
│                                                          │
│                Component Tests (30%)                     │
│     ┌─────────────────────────────────────────┐         │
│     │ Vitest + Vue Test Utils                 │         │
│     │ - Widget behavior                       │         │
│     │ - Chart rendering                       │         │
│     │ - User interactions                     │         │
│     └─────────────────────────────────────────┘         │
│                                                          │
│                    Unit Tests (50%)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Vitest                                          │    │
│  │ - Utils (formatters, calculators)               │    │
│  │ - Composables (data transformations)            │    │
│  │ - Pure functions                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

```
┌────────────────────────────────────────────────────────┐
│  Initial Load (MainComponent)                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✓ ReportHeader (eager - always visible)         │  │
│  │ ✓ YourExperiencesSection (eager - important)    │  │
│  │ ✓ ExecutiveSummarySection (eager - fold)        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  Lazy Load (On Scroll / Interaction)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⏱ SkillLandscapeSection (lazy)                  │  │
│  │ ⏱ CompanyIntelligenceSection (lazy)             │  │
│  │ ⏱ QuestionsIntelligenceSection (lazy)           │  │
│  │   (Heavy - 7 sub-components)                     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  Computed Caching                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ computed(() => expensiveCalculation())           │  │
│  │ - Only recalculates when dependencies change     │  │
│  │ - Shared across sections via composables         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  Virtual Scrolling (Question Bank)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ vue-virtual-scroller                             │  │
│  │ - Render only visible rows (~20)                 │  │
│  │ - Not all 500+ questions                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

Result:
- Initial load: 800ms → 500ms (38% faster)
- Memory: 45MB → 35MB (22% reduction)
- Smooth 60fps scrolling
```

---

## Migration Timeline Visual

```
Week 1: Foundation
├── Day 1-2: Constants & Utils
│   └── ✓ chartColors, formatters, calculators
├── Day 3-4: Base Charts
│   └── ✓ BarChart, ScatterChart, LineChart, DoughnutChart
└── Day 5: Base Widgets
    └── ✓ MetricCard, NarrativeBlock, TabNavigation

Week 2: Composables
├── Day 1-3: Core Logic
│   └── ✓ usePatternData, useCompanyData, useSkillData
├── Day 4-5: Feature Logic
│   └── ✓ useChartData, useQuestionBank, useNarrativeGenerator
└── Testing: >80% coverage

Week 3: Sections
├── Day 1-2: Simple Sections
│   └── ✓ Header, Summary, Skills, Topics
├── Day 3-4: Medium Sections
│   └── ✓ Experiences, Metrics, Roles, Process
└── Day 5: Complex Sections
    └── ✓ Company Intelligence, Critical Skills

Week 4: Advanced
├── Day 1-2: Custom Charts
│   └── ✓ Waterfall, Funnel, Heatmap
├── Day 3: Company Sub-Components
│   └── ✓ Comparison Table, Scatter Plot, Timeline
└── Day 4-5: Questions Section
    └── ✓ 7 specialized components + E2E tests

Week 5: Integration
├── Day 1-2: Advanced Widgets
│   └── ✓ BigNumber, Timeline, DualMetricBar
├── Day 3-4: Style Extraction
│   └── ✓ 5 SCSS modules
└── Day 5: Main Component
    └── ✓ Refactor to 200 lines + Feature Flag

Week 6: Launch
├── Day 1-2: Testing
│   └── ✓ Unit, Component, Integration, E2E
├── Day 3: Performance
│   └── ✓ Benchmarking, Optimization
├── Day 4: Documentation
│   └── ✓ API docs, Architecture guide
└── Day 5: Rollout
    └── ✓ 10% → 50% → 100%

DONE! 🎉
```

