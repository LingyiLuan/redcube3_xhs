<template>
  <div class="analysis-details">
    <div class="detail-grid">
      <!-- Company & Role -->
      <div v-if="analysis.company" class="detail-card">
        <div class="detail-label">🏢 Company</div>
        <div class="detail-value">{{ analysis.company }}</div>
      </div>

      <div v-if="analysis.role" class="detail-card">
        <div class="detail-label">💼 Role</div>
        <div class="detail-value">{{ analysis.role }}</div>
      </div>

      <!-- Sentiment & Outcome -->
      <div v-if="analysis.sentiment" class="detail-card">
        <div class="detail-label">😊 Sentiment</div>
        <div class="detail-value">
          <span class="sentiment-badge" :class="`sentiment-${analysis.sentiment}`">
            {{ analysis.sentiment }}
          </span>
        </div>
      </div>

      <div v-if="analysis.outcome" class="detail-card">
        <div class="detail-label">🎯 Outcome</div>
        <div class="detail-value">
          <span class="outcome-badge" :class="`outcome-${analysis.outcome}`">
            {{ analysis.outcome }}
          </span>
        </div>
      </div>

      <!-- Industry & Experience Level -->
      <div v-if="analysis.industry" class="detail-card">
        <div class="detail-label">🏭 Industry</div>
        <div class="detail-value">{{ analysis.industry }}</div>
      </div>

      <div v-if="analysis.experience_level" class="detail-card">
        <div class="detail-label">📊 Experience Level</div>
        <div class="detail-value">{{ analysis.experience_level }}</div>
      </div>

      <!-- Difficulty & Timeline -->
      <div v-if="analysis.difficulty_level" class="detail-card">
        <div class="detail-label">⚡ Difficulty</div>
        <div class="detail-value">
          <span class="difficulty-badge" :class="`difficulty-${analysis.difficulty_level}`">
            {{ analysis.difficulty_level }}
          </span>
        </div>
      </div>

      <div v-if="analysis.timeline" class="detail-card">
        <div class="detail-label">⏱️ Timeline</div>
        <div class="detail-value">{{ analysis.timeline }}</div>
      </div>
    </div>

    <!-- Interview Topics -->
    <div v-if="analysis.interview_topics && analysis.interview_topics.length > 0" class="topics-section">
      <h5 class="subsection-title">📚 Interview Topics</h5>
      <div class="tags-list">
        <span
          v-for="topic in analysis.interview_topics"
          :key="topic"
          class="tag"
        >
          {{ topic }}
        </span>
      </div>
    </div>

    <!-- Interview Stages -->
    <div v-if="analysis.interview_stages && analysis.interview_stages.length > 0" class="stages-section">
      <h5 class="subsection-title">🚀 Interview Stages</h5>
      <ol class="stages-list">
        <li v-for="(stage, idx) in analysis.interview_stages" :key="idx" class="stage-item">
          {{ stage }}
        </li>
      </ol>
    </div>

    <!-- Preparation Materials -->
    <div v-if="analysis.preparation_materials && analysis.preparation_materials.length > 0" class="materials-section">
      <h5 class="subsection-title">📖 Preparation Materials</h5>
      <ul class="materials-list">
        <li v-for="(material, idx) in analysis.preparation_materials" :key="idx" class="material-item">
          {{ material }}
        </li>
      </ul>
    </div>

    <!-- Key Insights -->
    <div v-if="analysis.key_insights && analysis.key_insights.length > 0" class="insights-section">
      <h5 class="subsection-title">💡 Key Insights</h5>
      <ul class="insights-list">
        <li v-for="(insight, idx) in analysis.key_insights" :key="idx" class="insight-item">
          {{ insight }}
        </li>
      </ul>
    </div>

    <!-- Original Text (if available) -->
    <div v-if="analysis.original_text" class="original-text-section">
      <h5 class="subsection-title">📝 Original Post</h5>
      <div class="original-text">
        {{ analysis.original_text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  analysis: any
}>()
</script>

<style scoped>
.analysis-details {
  @apply space-y-5;
}

/* Detail Grid */
.detail-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.detail-card {
  @apply p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.detail-label {
  @apply text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

.detail-value {
  @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
}

/* Badges */
.sentiment-badge,
.outcome-badge,
.difficulty-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.sentiment-positive {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.sentiment-negative {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

.sentiment-neutral {
  @apply bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300;
}

.outcome-passed {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.outcome-failed {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

.outcome-pending,
.outcome-unknown {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
}

.difficulty-easy {
  @apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
}

.difficulty-medium {
  @apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
}

.difficulty-hard {
  @apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
}

/* Subsection Title */
.subsection-title {
  @apply text-sm font-bold text-gray-900 dark:text-gray-100 mb-2;
}

/* Tags */
.tags-list {
  @apply flex flex-wrap gap-2;
}

.tag {
  @apply px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full;
}

/* Lists */
.stages-list,
.materials-list,
.insights-list {
  @apply space-y-2 text-sm text-gray-700 dark:text-gray-300;
}

.stage-item,
.material-item,
.insight-item {
  @apply pl-2;
}

.stages-list {
  @apply list-decimal list-inside;
}

.materials-list,
.insights-list {
  @apply list-disc list-inside;
}

/* Original Text */
.original-text {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap;
}
</style>
