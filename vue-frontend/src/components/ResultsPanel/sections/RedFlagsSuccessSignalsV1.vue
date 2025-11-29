<template>
  <section class="red-flags-section">
    <div class="section-header">
      <h2 class="section-title">Red Flags & Success Signals</h2>
      <p class="section-subtitle">Common patterns from successful offers vs. rejections</p>
    </div>

    <div v-if="hasSignalsData" class="section-content">
      <!-- Two-Column Layout -->
      <div class="signals-grid">
        <!-- Success Signals Column -->
        <div class="signals-column success-column">
          <div class="column-header">
            <h3>Success Signals</h3>
            <p class="column-subtitle">From {{ signalsData.successCount }} successful offers</p>
          </div>

          <div v-if="signalsData.successSignals.length > 0" class="signals-list">
            <div
              v-for="signal in signalsData.successSignals"
              :key="signal.skill"
              class="signal-item success-signal"
            >
              <div class="signal-header">
                <span class="signal-skill">{{ signal.skill }}</span>
                <span class="signal-percentage">{{ signal.frequency }}%</span>
              </div>
              <div class="signal-bar">
                <div
                  class="signal-bar-fill success-bar"
                  :style="{ width: signal.frequency + '%' }"
                ></div>
              </div>
              <p class="signal-description">
                Mentioned in {{ signal.count }} of {{ signalsData.successCount }} successful interviews
              </p>
            </div>
          </div>

          <div v-else class="no-signals-message">
            <p>No skills/technologies data available for successful interviews.</p>
            <p class="data-note">
              Note: Only ~35% of interview posts contain detailed skills information.
              We're continuously improving data extraction from interview experiences.
            </p>
          </div>
        </div>

        <!-- Red Flags Column -->
        <div class="signals-column failure-column">
          <div class="column-header">
            <h3>Red Flags</h3>
            <p class="column-subtitle">From {{ signalsData.failureCount }} rejections</p>
          </div>

          <div v-if="signalsData.redFlags.length > 0" class="signals-list">
            <div
              v-for="flag in signalsData.redFlags"
              :key="flag.skill"
              class="signal-item failure-signal"
            >
              <div class="signal-header">
                <span class="signal-skill">{{ flag.skill }}</span>
                <span class="signal-percentage">{{ flag.frequency }}%</span>
              </div>
              <div class="signal-bar">
                <div
                  class="signal-bar-fill failure-bar"
                  :style="{ width: flag.frequency + '%' }"
                ></div>
              </div>
              <p class="signal-description">
                Mentioned in {{ flag.count }} of {{ signalsData.failureCount }} rejected interviews
              </p>
            </div>
          </div>

          <div v-else class="no-signals-message">
            <p>No skills/technologies data available for rejected interviews.</p>
            <p class="data-note">
              Note: Only ~35% of interview posts contain detailed skills information.
              We're continuously improving data extraction from interview experiences.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="footer-note">
        <p>
          Based on analysis of {{ signalsData.successCount }} successful offers and
          {{ signalsData.failureCount }} rejections for similar roles.
          Patterns show skills and topics that appear more frequently in each outcome group.
        </p>
      </div>
    </div>

    <div v-else class="no-data-state">
      <p>Insufficient data available to extract success signals and red flags</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  patterns: any
}

const props = defineProps<Props>()

// Check if we have valid signals data
const hasSignalsData = computed(() => {
  const sourcePosts = props.patterns?.source_posts || []
  const successPosts = sourcePosts.filter((p: any) => p.outcome === 'offer')
  const failurePosts = sourcePosts.filter((p: any) => p.outcome === 'rejected')

  return successPosts.length > 0 || failurePosts.length > 0
})

// Extract success signals and red flags
const signalsData = computed(() => {
  const sourcePosts = props.patterns?.source_posts || []

  // Filter by outcome (handle both 'offer'/'passed' as success)
  const successPosts = sourcePosts.filter((p: any) => p.outcome === 'offer' || p.outcome === 'passed')
  const failurePosts = sourcePosts.filter((p: any) => p.outcome === 'rejected' || p.outcome === 'failed')

  // Extract skills from successful interviews (include tech_stack, frameworks, and tools)
  const successSkills: Record<string, number> = {}
  successPosts.forEach((post: any) => {
    const skills = [
      ...(post.tech_stack || []),
      ...(post.frameworks || []),
      ...(post.tools || [])
    ]
    skills.forEach((skill: string) => {
      if (skill && skill.trim()) {
        successSkills[skill] = (successSkills[skill] || 0) + 1
      }
    })
  })

  // Extract skills from rejected interviews (include tech_stack, frameworks, and tools)
  const failureSkills: Record<string, number> = {}
  failurePosts.forEach((post: any) => {
    const skills = [
      ...(post.tech_stack || []),
      ...(post.frameworks || []),
      ...(post.tools || [])
    ]
    skills.forEach((skill: string) => {
      if (skill && skill.trim()) {
        failureSkills[skill] = (failureSkills[skill] || 0) + 1
      }
    })
  })

  // Convert to arrays
  // STRATEGY: Show top 5 skills even if below threshold (if we have ANY skills data)
  // This ensures we show something useful even with sparse data
  const minFrequency = 15
  const maxResults = 5

  const successSignals = Object.entries(successSkills)
    .map(([skill, count]) => ({
      skill,
      frequency: parseFloat(((count / successPosts.length) * 100).toFixed(0)),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults)
    // Show top skills even if below threshold, but mark low-frequency ones
    .filter(s => s.count > 0)

  const redFlags = Object.entries(failureSkills)
    .map(([skill, count]) => ({
      skill,
      frequency: parseFloat(((count / failurePosts.length) * 100).toFixed(0)),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxResults)
    .filter(s => s.count > 0)

  return {
    successCount: successPosts.length,
    failureCount: failurePosts.length,
    successSignals,
    redFlags
  }
})
</script>

<style scoped>
.red-flags-section {
  margin-bottom: var(--spacing-16);
}

/* Section Header */
.section-header {
  margin-bottom: var(--spacing-8);
  padding-bottom: var(--spacing-6);
  border-bottom: 2px solid var(--color-border-light);
}

.section-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
  font-family: var(--font-serif);
}

.section-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-normal);
}

/* Section Content */
.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

/* Two-Column Grid */
.signals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-8);
}

@media (max-width: 1024px) {
  .signals-grid {
    grid-template-columns: 1fr;
  }
}

/* Column Styling */
.signals-column {
  background-color: var(--color-bg-secondary);
  padding: var(--spacing-8);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
}

.success-column {
  border-color: var(--color-success);
  background-color: var(--color-success-light);
}

.failure-column {
  border-color: var(--color-error);
  background-color: var(--color-error-light);
}

/* Column Header */
.column-header {
  margin-bottom: var(--spacing-6);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-border-light);
}

.column-header h3 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
}

.column-subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* Signals List */
.signals-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

/* Signal Item */
.signal-item {
  background-color: var(--color-bg-primary);
  padding: var(--spacing-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.signal-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Signal Header */
.signal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.signal-skill {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.signal-percentage {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

/* Signal Bar */
.signal-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-quaternary);
  border-radius: var(--radius-base);
  overflow: hidden;
  margin-bottom: var(--spacing-3);
}

.signal-bar-fill {
  height: 100%;
  border-radius: var(--radius-base);
  transition: width var(--transition-base);
}

.success-bar {
  background-color: var(--color-success);
}

.failure-bar {
  background-color: var(--color-error);
}

/* Signal Description */
.signal-description {
  font-size: var(--font-size-md);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
  margin: 0;
}

/* No Signals Message */
.no-signals-message {
  padding: var(--spacing-8);
  text-align: center;
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border-base);
}

.no-signals-message p {
  font-size: var(--font-size-md);
  color: var(--color-text-tertiary);
  font-style: italic;
  margin: 0;
  margin-bottom: var(--spacing-3);
}

.no-signals-message p:last-child {
  margin-bottom: 0;
}

.data-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-quaternary);
  font-style: normal;
  margin-top: var(--spacing-4);
}

/* Footer Note */
.footer-note {
  padding: var(--spacing-6);
  background-color: var(--color-bg-quaternary);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.footer-note p {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

/* No Data State */
.no-data-state {
  padding: var(--spacing-12);
  text-align: center;
  background-color: var(--color-bg-quaternary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border-base);
}

.no-data-state p {
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>
