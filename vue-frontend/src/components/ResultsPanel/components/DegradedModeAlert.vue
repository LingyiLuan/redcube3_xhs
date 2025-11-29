<template>
  <div v-if="warning" class="degraded-mode-alert">
    <div class="alert-content">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="alert-icon">
        <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
      </svg>

      <span class="alert-message">
        Limited Mode: Advanced features unavailable due to API limits. Basic analysis available.
      </span>

      <button
        v-if="!showDetails"
        @click="showDetails = true"
        class="learn-more-link"
      >
        Learn more
      </button>

      <button
        v-if="showDetails"
        @click="showDetails = false"
        class="learn-more-link"
      >
        Hide details
      </button>
    </div>

    <!-- Expandable details section -->
    <div v-if="showDetails" class="alert-details">
      <div class="details-grid">
        <div class="details-section">
          <h4 class="details-heading">Unavailable Features</h4>
          <ul class="details-list">
            <li v-for="(feature, index) in warning.unavailable_features" :key="index">
              {{ feature }}
            </li>
          </ul>
        </div>

        <div class="details-section">
          <h4 class="details-heading">Available Features</h4>
          <ul class="details-list available">
            <li>Company Insights</li>
            <li>Similar Posts</li>
            <li>Basic Analysis</li>
          </ul>
        </div>
      </div>

      <div v-if="warning.reason" class="technical-details">
        <span class="technical-label">Technical reason:</span>
        <code class="technical-value">{{ warning.reason }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ExtractionWarning {
  type: string
  title: string
  message: string
  unavailable_features?: string[]
  reason?: string
  fallback_method: string
}

interface Props {
  warning: ExtractionWarning | null
}

const props = defineProps<Props>()

const showDetails = ref(false)
</script>

<style scoped>
/* Clean, single-line banner - McKinsey style */
.degraded-mode-alert {
  margin: 0 0 24px 0;
  border-bottom: 1px solid #E5E7EB;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #EFF6FF;
  border: 1px solid #DBEAFE;
  border-bottom: none;
}

.alert-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #3B82F6;
}

.alert-message {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  font-weight: 400;
}

.learn-more-link {
  padding: 0;
  background: none;
  border: none;
  color: #6B7280;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
  white-space: nowrap;
}

.learn-more-link:hover {
  color: #374151;
}

/* Expandable details section */
.alert-details {
  padding: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-top: 1px solid #E5E7EB;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 16px;
}

.details-section {
  min-width: 0;
}

.details-heading {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.details-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.details-list li {
  font-size: 13px;
  line-height: 1.8;
  color: #4B5563;
  position: relative;
  padding-left: 16px;
}

.details-list li::before {
  content: '−';
  position: absolute;
  left: 0;
  color: #9CA3AF;
  font-weight: 600;
}

.details-list.available li::before {
  content: '✓';
  color: #10B981;
}

.technical-details {
  padding-top: 12px;
  border-top: 1px solid #F3F4F6;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: baseline;
}

.technical-label {
  font-size: 11px;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.technical-value {
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  color: #6B7280;
  background: #F9FAFB;
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .alert-content {
    padding: 10px 12px;
  }

  .alert-message {
    font-size: 12px;
  }

  .learn-more-link {
    font-size: 12px;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
