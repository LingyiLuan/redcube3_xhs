<template>
  <div class="section-container skills-section">
    <div class="section-header">
      <h2 class="section-title">Skills Performance Analysis</h2>
      <p class="section-subtitle">
        Skills tested during the interview
      </p>
    </div>

    <!-- Skills Tested -->
    <div class="skills-tested">
      <h3 class="subsection-title">Skills Tested</h3>
      <div class="skills-grid">
        <div
          v-for="skill in skills.tested"
          :key="skill.name"
          class="skill-card"
        >
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-meta">
            <span class="skill-frequency">
              Mentioned {{ skill.frequency }}x
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Gap Analysis (if available) -->
    <div class="gap-analysis" v-if="skills.gapAnalysis">
      <h3 class="subsection-title">Gap Analysis</h3>
      <div class="gap-card">
        <div class="gap-row">
          <span class="gap-label">Critical Gap:</span>
          <span class="gap-value">{{ skills.gapAnalysis.criticalGap }}</span>
        </div>
        <div class="gap-evidence" v-if="skills.gapAnalysis.evidence && skills.gapAnalysis.evidence.length > 0">
          <div class="evidence-label">Evidence:</div>
          <ul class="evidence-list">
            <li v-for="(item, index) in skills.gapAnalysis.evidence" :key="index">
              {{ item }}
            </li>
          </ul>
        </div>
        <div class="gap-row" v-if="skills.gapAnalysis.likelyImpact">
          <span class="gap-label">Likely Impact:</span>
          <span class="gap-value">{{ skills.gapAnalysis.likelyImpact }}</span>
        </div>
      </div>
    </div>

    <!-- Phase 2 Notice -->
    <div class="phase2-notice">
      <div class="notice-icon">ℹ️</div>
      <div class="notice-content">
        <strong>Enhanced Analysis Coming Soon:</strong>
        Detailed skill performance indicators will be available in Phase 2 with advanced NLP extraction.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  skills: {
    tested: Array<{
      name: string
      frequency: number
      performance?: string | null
      benchmark?: {
        successRate?: number | null
        percentile?: number | null
      }
    }>
    gapAnalysis?: {
      criticalGap: string
      evidence: string[]
      likelyImpact: string
    } | null
  }
}

const props = defineProps<Props>()
</script>

<style scoped>
.section-container {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.subsection-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.skills-tested {
  margin-bottom: 2rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.skill-card {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.skill-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.skill-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.skill-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.skill-frequency {
  font-size: 0.85rem;
  color: #6b7280;
}

.gap-analysis {
  margin-bottom: 2rem;
}

.gap-card {
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
  border-left: 4px solid #f59e0b;
  padding: 1.5rem;
  border-radius: 6px;
}

.gap-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.gap-row:last-child {
  margin-bottom: 0;
}

.gap-label {
  font-weight: 600;
  color: #78350f;
  flex-shrink: 0;
}

.gap-value {
  color: #92400e;
  line-height: 1.5;
}

.gap-evidence {
  margin: 1rem 0;
}

.evidence-label {
  font-weight: 600;
  color: #78350f;
  margin-bottom: 0.5rem;
}

.evidence-list {
  list-style-position: inside;
  color: #92400e;
  margin: 0;
  padding-left: 1rem;
}

.evidence-list li {
  margin-bottom: 0.25rem;
}

.phase2-notice {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  align-items: flex-start;
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content {
  font-size: 0.9rem;
  color: #1e40af;
  line-height: 1.6;
}

.notice-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #1e3a8a;
}
</style>
