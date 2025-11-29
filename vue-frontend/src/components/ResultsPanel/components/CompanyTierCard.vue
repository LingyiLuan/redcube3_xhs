<template>
  <div class="company-tier-card" :class="tierClass">
    <!-- Company Header -->
    <div class="company-header">
      <div class="company-title-row">
        <h3 class="company-name">{{ companyData.company }}</h3>
        <span class="company-badge" :style="{ backgroundColor: badgeColor }">
          {{ companyData.badge }}
        </span>
        <span v-if="showRelevance" class="relevance-score">
          {{ companyData.relevanceScore }}%
        </span>
      </div>
      <p class="company-description">{{ companyData.description }}</p>
    </div>

    <!-- Category Breakdown -->
    <div class="category-breakdown">
      <h4 class="breakdown-title">Question Breakdown</h4>
      <div class="category-bars">
        <div
          v-for="cat in companyData.categoryBreakdown"
          :key="cat.category"
          class="category-bar-row">
          <div class="category-info">
            <span class="category-name">{{ formatCategoryName(cat.category) }}</span>
            <span class="category-count">{{ cat.count }} questions</span>
          </div>
          <div class="category-bar-container">
            <div
              class="category-bar-fill"
              :style="{
                width: cat.percentage + '%',
                backgroundColor: getCategoryColor(cat.category)
              }">
            </div>
            <span class="category-percentage">{{ cat.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- View Questions Button -->
    <button @click="viewQuestions" class="view-questions-btn">
      View All {{ companyData.totalQuestions }} Questions →
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CompanyData {
  company: string
  tier: 'seed' | 'similar' | 'general'
  totalQuestions: number
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  questions: any[]
  badge: string
  badgeColor: string
  description: string
  relevanceScore?: number
}

interface Props {
  companyData: CompanyData
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewQuestions: [companyName: string]
}>()

const tierClass = computed(() => `tier-${props.companyData.tier}`)
const badgeColor = computed(() => props.companyData.badgeColor)
const showRelevance = computed(() => props.companyData.tier === 'similar' && props.companyData.relevanceScore)

function formatCategoryName(category: string): string {
  const nameMap: Record<string, string> = {
    'coding': 'Coding',
    'system_design': 'System Design',
    'behavioral': 'Behavioral',
    'technical': 'Technical',
    'case study': 'Case Study'
  }
  return nameMap[category] || category.charAt(0).toUpperCase() + category.slice(1)
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'coding': '#1E3A8A',      // Navy (Critical)
    'system_design': '#3B82F6', // Blue (High)
    'behavioral': '#60A5FA',   // Light Blue (Medium)
    'technical': '#2563EB',    // Blue (High)
    'case study': '#BFDBFE'    // Baby Blue (Low)
  }
  return colorMap[category] || '#6B7280'
}

function viewQuestions() {
  emit('viewQuestions', props.companyData.company)
}
</script>

<style scoped>
.company-tier-card {
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.company-tier-card:hover {
  border-color: #1E40AF;
  box-shadow: 0 8px 24px rgba(30, 64, 175, 0.12);
  transform: translateY(-4px);
}

/* Tier-specific styling */
.tier-seed {
  border-color: #3B82F6;
  border-width: 3px;
  background: linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%);
}

.tier-seed:hover {
  border-color: #1E40AF;
  box-shadow: 0 12px 32px rgba(30, 64, 175, 0.2);
}

.tier-similar {
  border-color: #D1D5DB;
}

.tier-general {
  border-color: #E5E7EB;
  background: #F9FAFB;
}

/* Company Header */
.company-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.company-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.company-name {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.company-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 700;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.relevance-score {
  display: inline-block;
  padding: 6px 12px;
  background: #F3F4F6;
  color: #374151;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
}

.company-description {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
}

/* Category Breakdown */
.category-breakdown {
  margin-bottom: 20px;
}

.breakdown-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.category-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.category-count {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.category-bar-container {
  position: relative;
  width: 100%;
  height: 28px;
  background: #F3F4F6;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.category-bar-fill {
  height: 100%;
  transition: width 0.6s ease;
  border-radius: 8px;
}

.category-percentage {
  position: absolute;
  right: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  z-index: 1;
}

/* View Questions Button */
.view-questions-btn {
  width: 100%;
  padding: 14px 20px;
  background: #1E40AF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.view-questions-btn:hover {
  background: #1E3A8A;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
}

.view-questions-btn:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .company-tier-card {
    padding: 20px;
  }

  .company-name {
    font-size: 18px;
  }

  .company-title-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
