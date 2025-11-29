<template>
  <section class="preparation-roadmap">
    <h2 class="section-title">Personalized Preparation Roadmap</h2>

    <!-- Narrative intro -->
    <div class="narrative-block">
      <p class="body-text">{{ roadmapNarrative }}</p>
    </div>

    <!-- Phase-Based Roadmap -->
    <div class="chart-wrapper">
      <h3 class="chart-title">4-Week Preparation Plan</h3>
      <p class="chart-subtitle">Structured approach to maximize your interview readiness</p>

      <div class="roadmap-phases">
        <div v-for="phase in preparationPhases" :key="phase.week" class="phase-card">
          <div class="phase-header">
            <div class="phase-week">Week {{ phase.week }}</div>
            <div class="phase-title">{{ phase.title }}</div>
          </div>
          <div class="phase-focus">
            <strong>Focus:</strong> {{ phase.focus }}
          </div>
          <ul class="phase-activities">
            <li v-for="activity in phase.activities" :key="activity">
              <span class="activity-bullet">✓</span>
              {{ activity }}
            </li>
          </ul>
          <div class="phase-resources">
            <strong>Resources:</strong> {{ phase.resources }}
          </div>
        </div>
      </div>
    </div>

    <!-- Priority Skills to Master -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Priority Skills to Master</h3>
      <p class="chart-subtitle">Top skills ranked by impact on interview success</p>

      <div class="priority-skills-list">
        <div
          v-for="(skill, index) in prioritySkills"
          :key="skill.name"
          class="priority-skill-item">
          <div class="skill-rank">#{{ index + 1 }}</div>
          <div class="skill-info">
            <div class="skill-name-row">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-priority-badge" :class="skill.priority">
                {{ skill.priority }}
              </span>
            </div>
            <div class="skill-metrics-row">
              <span class="skill-metric">
                <span class="metric-label">Demand:</span> {{ skill.demand }}%
              </span>
              <span class="skill-metric">
                <span class="metric-label">Success Impact:</span> {{ skill.successImpact }}%
              </span>
              <span class="skill-metric">
                <span class="metric-label">Gap Level:</span> {{ skill.gapLevel }}
              </span>
            </div>
          </div>
          <div class="skill-action">
            <button @click="viewSkillResources(skill.name)" class="action-btn-small">
              Study Resources →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Items Checklist -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Immediate Action Items</h3>
      <p class="chart-subtitle">Complete these tasks to jumpstart your preparation</p>

      <div class="action-checklist">
        <div v-for="action in actionItems" :key="action.id" class="checklist-item">
          <input
            type="checkbox"
            :id="'action-' + action.id"
            class="checklist-checkbox" />
          <label :for="'action-' + action.id" class="checklist-label">
            <span class="checklist-text">{{ action.text }}</span>
            <span class="checklist-impact" :class="action.impact">
              {{ action.impact }} impact
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Recommended Resources -->
    <div class="chart-wrapper">
      <h3 class="chart-title">Recommended Resources</h3>
      <p class="chart-subtitle">Curated learning materials for your target roles and companies</p>

      <div class="resources-grid">
        <div v-for="resource in recommendedResources" :key="resource.title" class="resource-card">
          <div class="resource-type-badge">{{ resource.type }}</div>
          <h4 class="resource-title">{{ resource.title }}</h4>
          <p class="resource-description">{{ resource.description }}</p>
          <div class="resource-tags">
            <span v-for="tag in resource.tags" :key="tag" class="resource-tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { useSkillsAnalysis } from '@/composables/useSkillsAnalysis'

interface PreparationPhase {
  week: number
  title: string
  focus: string
  activities: string[]
  resources: string
}

interface PrioritySkill {
  name: string
  demand: number
  successImpact: number
  priority: string
  gapLevel: string
}

interface ActionItem {
  id: number
  text: string
  impact: 'high' | 'medium' | 'low'
}

interface Resource {
  type: string
  title: string
  description: string
  tags: string[]
}

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Use skills analysis composable
const { topSkillsWithMetrics } = useSkillsAnalysis(props.patterns)

/**
 * Generate roadmap narrative
 */
const roadmapNarrative = computed(() => {
  const topSkills = topSkillsWithMetrics.value.slice(0, 3)
  const topCompanies = props.patterns.company_trends?.slice(0, 2) || []

  if (topSkills.length === 0) {
    return 'Based on your analysis, we recommend a comprehensive preparation approach focusing on core technical skills and interview fundamentals.'
  }

  const topSkillNames = topSkills.map((s) => s.name).join(', ')
  const companyNames = topCompanies.map((c: any) => c.company).join(' and ')
  const avgDemand = Math.round(
    topSkills.reduce((sum, s) => sum + s.demand, 0) / topSkills.length
  )

  let narrative = `Based on your analysis of ${props.patterns.summary.total_posts_analyzed} interview posts, we've created a tailored preparation roadmap focusing on the most impactful areas for interview success. `

  if (topCompanies.length > 0) {
    narrative += `Your target companies (${companyNames}) show strong emphasis on ${topSkillNames}, with an average demand rate of ${avgDemand}%. `
  } else {
    narrative += `The top skills identified are ${topSkillNames}, with an average demand rate of ${avgDemand}%. `
  }

  narrative += `This 4-week plan prioritizes high-impact skills, provides actionable study tasks, and includes curated resources to maximize your preparation efficiency. Start with the immediate action items to build momentum, then follow the weekly roadmap for structured learning.`

  return narrative
})

/**
 * Preparation phases (4-week roadmap)
 */
const preparationPhases = computed<PreparationPhase[]>(() => {
  const topSkills = topSkillsWithMetrics.value.slice(0, 8)

  if (topSkills.length === 0) {
    return [
      {
        week: 1,
        title: 'Foundation Building',
        focus: 'Core technical fundamentals',
        activities: [
          'Review data structures (arrays, linked lists, trees)',
          'Practice 10 easy coding problems',
          'Study time/space complexity basics'
        ],
        resources: 'LeetCode, Cracking the Coding Interview'
      },
      {
        week: 2,
        title: 'Technical Depth',
        focus: 'Advanced algorithms and system design',
        activities: [
          'Practice 15 medium difficulty problems',
          'Study system design fundamentals',
          'Review common design patterns'
        ],
        resources: 'System Design Interview book, Design Gurus'
      },
      {
        week: 3,
        title: 'Domain Expertise',
        focus: 'Role-specific technical skills',
        activities: [
          'Deep dive into role-specific technologies',
          'Build a small project demonstrating key skills',
          'Practice explaining technical concepts'
        ],
        resources: 'Official documentation, GitHub projects'
      },
      {
        week: 4,
        title: 'Mock Interviews & Polish',
        focus: 'Interview simulation and refinement',
        activities: [
          'Complete 3-5 full mock interviews',
          'Review and practice behavioral questions',
          'Polish your project portfolio and resume'
        ],
        resources: 'Pramp, Interviewing.io, peers'
      }
    ]
  }

  // Generate dynamic roadmap based on top skills
  const phases: PreparationPhase[] = []

  // Week 1: Foundation (skills 1-2)
  const week1Skills = topSkills.slice(0, 2).map((s) => s.name)
  phases.push({
    week: 1,
    title: 'Foundation Building',
    focus: `Core fundamentals: ${week1Skills.join(' & ')}`,
    activities: [
      `Master ${week1Skills[0]} basics and common patterns`,
      `Study ${week1Skills[1]} fundamentals and best practices`,
      'Practice 10-15 foundational problems',
      'Set up your development environment and tools'
    ],
    resources: 'LeetCode, Official documentation, freeCodeCamp'
  })

  // Week 2: Technical Depth (skills 3-4)
  const week2Skills = topSkills.slice(2, 4).map((s) => s.name)
  if (week2Skills.length >= 2) {
    phases.push({
      week: 2,
      title: 'Technical Depth',
      focus: `Advanced concepts: ${week2Skills.join(' & ')}`,
      activities: [
        `Deep dive into ${week2Skills[0]} advanced patterns`,
        `Practice ${week2Skills[1]} real-world scenarios`,
        'Solve 15-20 medium difficulty problems',
        'Study system design fundamentals'
      ],
      resources: 'System Design Interview, Design Gurus, Medium articles'
    })
  } else {
    phases.push({
      week: 2,
      title: 'Technical Depth',
      focus: 'Advanced algorithms and patterns',
      activities: [
        'Practice advanced data structure problems',
        'Study dynamic programming and graph algorithms',
        'Solve 15-20 medium difficulty problems',
        'Review system design basics'
      ],
      resources: 'AlgoExpert, Educative.io, YouTube tutorials'
    })
  }

  // Week 3: Domain Expertise (skills 5-6)
  const week3Skills = topSkills.slice(4, 6).map((s) => s.name)
  if (week3Skills.length >= 2) {
    phases.push({
      week: 3,
      title: 'Domain Expertise',
      focus: `Specialized skills: ${week3Skills.join(' & ')}`,
      activities: [
        `Build a project showcasing ${week3Skills[0]}`,
        `Practice ${week3Skills[1]} interview questions`,
        'Work on company-specific technical challenges',
        'Review real interview questions from target companies'
      ],
      resources: 'GitHub, Company engineering blogs, Glassdoor'
    })
  } else {
    phases.push({
      week: 3,
      title: 'Domain Expertise',
      focus: 'Role-specific technical mastery',
      activities: [
        'Build a portfolio project using top skills',
        'Practice explaining technical decisions',
        'Study company-specific technologies',
        'Review common architectural patterns'
      ],
      resources: 'Company blogs, Stack Overflow, Tech talks'
    })
  }

  // Week 4: Mock Interviews & Polish
  const topCompany = props.patterns.company_trends?.[0]?.company || 'target companies'
  phases.push({
    week: 4,
    title: 'Mock Interviews & Polish',
    focus: 'Interview simulation and refinement',
    activities: [
      'Complete 3-5 full mock technical interviews',
      `Practice ${topCompany}-style interview questions`,
      'Review and polish behavioral answer framework (STAR)',
      'Prepare thoughtful questions for interviewers'
    ],
    resources: 'Pramp, Interviewing.io, Peers, Career counselors'
  })

  return phases
})

/**
 * Priority skills to master
 */
const prioritySkills = computed<PrioritySkill[]>(() => {
  const skills = topSkillsWithMetrics.value.slice(0, 8)

  return skills.map((skill) => {
    // Determine gap level based on priority and success impact
    let gapLevel = 'Low'
    if (skill.priority === 'critical' && skill.successImpact >= 80) {
      gapLevel = 'High'
    } else if (skill.priority === 'critical' || skill.successImpact >= 70) {
      gapLevel = 'Medium'
    }

    return {
      name: skill.name,
      demand: skill.demand,
      successImpact: skill.successImpact,
      priority: skill.priority,
      gapLevel
    }
  })
})

/**
 * Action items checklist
 */
const actionItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = []
  const topSkills = topSkillsWithMetrics.value.slice(0, 5)
  const topCompanies = props.patterns.company_trends?.slice(0, 3) || []

  // Skill-based action items
  if (topSkills.length > 0) {
    items.push({
      id: 1,
      text: `Review ${topSkills[0].name} fundamentals and practice 5 related problems`,
      impact: 'high'
    })
  }

  if (topSkills.length > 1) {
    items.push({
      id: 2,
      text: `Study ${topSkills[1].name} best practices and common interview patterns`,
      impact: 'high'
    })
  }

  // Company-based action items
  if (topCompanies.length > 0) {
    items.push({
      id: 3,
      text: `Research ${topCompanies[0].company} engineering culture and recent tech blog posts`,
      impact: 'medium'
    })
  }

  // Generic high-impact items
  items.push(
    {
      id: 4,
      text: 'Set up a study schedule: 2-3 hours daily for coding practice',
      impact: 'high'
    },
    {
      id: 5,
      text: 'Join online communities (Reddit, Discord) for interview prep support',
      impact: 'medium'
    },
    {
      id: 6,
      text: 'Create a project portfolio showcasing top skills',
      impact: 'high'
    },
    {
      id: 7,
      text: 'Practice explaining your past projects using the STAR method',
      impact: 'high'
    }
  )

  if (topCompanies.length > 1) {
    items.push({
      id: 8,
      text: `Read interview experiences for ${topCompanies[1].company} on Glassdoor/Blind`,
      impact: 'medium'
    })
  }

  items.push(
    {
      id: 9,
      text: 'Schedule your first mock interview for next week',
      impact: 'high'
    },
    {
      id: 10,
      text: 'Prepare 3-5 thoughtful questions to ask interviewers',
      impact: 'low'
    }
  )

  return items.slice(0, 10) // Return top 10
})

/**
 * Recommended resources
 */
const recommendedResources = computed<Resource[]>(() => {
  const resources: Resource[] = []
  const topSkills = topSkillsWithMetrics.value.slice(0, 4)
  const topCompany = props.patterns.company_trends?.[0]?.company

  // Skill-based resources
  if (topSkills.length > 0) {
    resources.push({
      type: 'Practice',
      title: 'LeetCode Premium',
      description: `Focused practice on ${topSkills[0].name} and algorithm problems. Company-specific question lists available.`,
      tags: [topSkills[0].name, 'Coding', 'Practice']
    })

    if (
      topSkills.length > 1 &&
      (topSkills[1].name.toLowerCase().includes('system') ||
        topSkills[1].name.toLowerCase().includes('design'))
    ) {
      resources.push({
        type: 'Book',
        title: 'System Design Interview (Alex Xu)',
        description:
          'Comprehensive guide to system design interviews with real-world examples and detailed diagrams.',
        tags: ['System Design', 'Architecture', 'Scalability']
      })
    }
  }

  // General technical interview resources
  resources.push(
    {
      type: 'Book',
      title: 'Cracking the Coding Interview',
      description:
        'Classic technical interview preparation book covering algorithms, data structures, and problem-solving strategies.',
      tags: ['Algorithms', 'Data Structures', 'Interview Prep']
    },
    {
      type: 'Course',
      title: 'Grokking the Coding Interview',
      description:
        'Pattern-based approach to solving coding interview questions with 16 common patterns.',
      tags: ['Patterns', 'Algorithms', 'Step-by-Step']
    },
    {
      type: 'Practice',
      title: 'Pramp - Mock Interviews',
      description:
        'Free peer-to-peer mock technical interviews. Practice with real people in real-time.',
      tags: ['Mock Interviews', 'Live Practice', 'Free']
    }
  )

  // Company-specific resource
  if (topCompany) {
    resources.push({
      type: 'Resource',
      title: `${topCompany} Interview Guide`,
      description: `Curated list of ${topCompany} interview questions, process insights, and company culture information from Glassdoor and Blind.`,
      tags: [topCompany, 'Company-Specific', 'Interview Experience']
    })
  }

  // Advanced resources
  if (topSkills.some((s) => s.priority === 'critical')) {
    resources.push({
      type: 'Video',
      title: 'NeetCode YouTube Channel',
      description:
        'Clear video explanations of LeetCode problems with pattern recognition and optimal solutions.',
      tags: ['Video', 'Algorithms', 'Visual Learning']
    })
  }

  resources.push({
    type: 'Course',
    title: 'Educative.io Interview Courses',
    description:
      'Interactive text-based courses on algorithms, system design, and language-specific interview prep.',
    tags: ['Interactive', 'Comprehensive', 'Self-Paced']
  })

  return resources.slice(0, 8) // Return top 8
})

/**
 * View skill resources (placeholder)
 */
function viewSkillResources(skillName: string) {
  alert(`Resources for ${skillName} will be displayed here. Feature coming soon!`)
}
</script>

<style scoped>
.preparation-roadmap {
  margin-bottom: 80px;
  padding-bottom: 40px;
  border-bottom: 1px solid #F3F4F6;
}

.section-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 32px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.narrative-block {
  margin-bottom: 32px;
}

.body-text {
  font-size: 16px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 16px;
  font-weight: 400;
}

.chart-wrapper {
  background-color: #FFFFFF;
  padding: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  margin-top: 24px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.chart-subtitle {
  font-size: 13px;
  color: #6B7280;
  font-weight: 400;
  margin-bottom: 24px;
}

/* Roadmap Phases */
.roadmap-phases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.phase-card {
  background: linear-gradient(to bottom right, #F9FAFB 0%, #FFFFFF 100%);
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s;
}

.phase-card:hover {
  border-color: #1E40AF;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.phase-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.phase-week {
  font-size: 12px;
  font-weight: 600;
  color: #1E40AF;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.phase-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.phase-focus {
  font-size: 14px;
  color: #374151;
  margin-bottom: 16px;
  line-height: 1.6;
}

.phase-focus strong {
  color: #111827;
  font-weight: 600;
}

.phase-activities {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.phase-activities li {
  display: flex;
  align-items: start;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.activity-bullet {
  flex-shrink: 0;
  color: #10B981;
  font-size: 14px;
  font-weight: 700;
}

.phase-resources {
  font-size: 13px;
  color: #6B7280;
  padding-top: 16px;
  border-top: 1px solid #F3F4F6;
}

.phase-resources strong {
  color: #111827;
  font-weight: 600;
}

/* Priority Skills */
.priority-skills-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.priority-skill-item {
  display: flex;
  align-items: start;
  gap: 16px;
  padding: 20px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s;
}

.priority-skill-item:hover {
  border-color: #1E40AF;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.skill-rank {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

.skill-info {
  flex: 1;
}

.skill-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.skill-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.skill-priority-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.skill-priority-badge.critical {
  background: #EFF6FF;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.skill-priority-badge.high {
  background: #FEF3C7;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.skill-priority-badge.medium {
  background: #F3F4F6;
  color: #6B7280;
  border: 1px solid #E5E7EB;
}

.skill-metrics-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.skill-metric {
  font-size: 13px;
  color: #374151;
}

.metric-label {
  color: #6B7280;
  font-weight: 500;
}

.skill-action {
  flex-shrink: 0;
}

.action-btn-small {
  padding: 8px 16px;
  background: #1E40AF;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn-small:hover {
  background: #1E3A8A;
}

/* Action Checklist */
.action-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checklist-item {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 16px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  transition: all 0.2s;
}

.checklist-item:has(.checklist-checkbox:checked) {
  background: #D1FAE5;
  border-color: #10B981;
}

.checklist-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
}

.checklist-label {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
  cursor: pointer;
}

.checklist-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.checklist-impact {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.checklist-impact.high {
  background: #FEE2E2;
  color: #DC2626;
}

.checklist-impact.medium {
  background: #FEF3C7;
  color: #D97706;
}

.checklist-impact.low {
  background: #F3F4F6;
  color: #6B7280;
}

/* Resources Grid */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.resource-card {
  padding: 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  transition: all 0.2s;
}

.resource-card:hover {
  border-color: #1E40AF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.resource-type-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #EFF6FF;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 10px;
}

.resource-description {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 12px;
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-tag {
  padding: 4px 8px;
  background: #F3F4F6;
  color: #374151;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1024px) {
  .roadmap-phases {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }

  .priority-skill-item {
    flex-direction: column;
    gap: 12px;
  }

  .skill-action {
    width: 100%;
  }

  .action-btn-small {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .chart-wrapper {
    padding: 20px;
  }

  .roadmap-phases {
    grid-template-columns: 1fr;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }

  .checklist-label {
    flex-direction: column;
    align-items: start;
  }

  .skill-metrics-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
