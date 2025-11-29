<template>
  <div class="company-question-table-wrapper">
    <table class="company-question-table">
      <thead>
        <tr>
          <th class="col-company">Company</th>
          <th class="col-category">Technical</th>
          <th class="col-category">Coding</th>
          <th class="col-category">System Design</th>
          <th class="col-category">Behavioral</th>
          <th class="col-total">Total</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companies" :key="company.company" class="company-row">
          <td class="company-name">{{ company.company }}</td>
          <td class="category-count">{{ getCategoryCount(company, 'technical') }}</td>
          <td class="category-count">{{ getCategoryCount(company, 'coding') }}</td>
          <td class="category-count">{{ getCategoryCount(company, 'system_design') }}</td>
          <td class="category-count">{{ getCategoryCount(company, 'behavioral') }}</td>
          <td class="total-count">{{ company.totalQuestions }}</td>
          <td class="action-cell">
            <button @click="viewQuestions(company.company)" class="view-link">
              View questions →
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="companies.length > 1">
        <tr class="summary-row">
          <td class="summary-label">Total</td>
          <td class="summary-count">{{ getTotalByCategory('technical') }}</td>
          <td class="summary-count">{{ getTotalByCategory('coding') }}</td>
          <td class="summary-count">{{ getTotalByCategory('system_design') }}</td>
          <td class="summary-count">{{ getTotalByCategory('behavioral') }}</td>
          <td class="summary-total">{{ grandTotal }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
}

interface CompanyData {
  company: string
  totalQuestions: number
  categoryBreakdown: CategoryBreakdown[]
  questions: any[]
}

interface Props {
  companies: CompanyData[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewQuestions: [companyName: string]
}>()

function getCategoryCount(company: CompanyData, category: string): number {
  const breakdown = company.categoryBreakdown.find(c => c.category === category)
  return breakdown ? breakdown.count : 0
}

const getTotalByCategory = computed(() => (category: string): number => {
  return props.companies.reduce((sum, company) => {
    return sum + getCategoryCount(company, category)
  }, 0)
})

const grandTotal = computed(() => {
  return props.companies.reduce((sum, company) => sum + company.totalQuestions, 0)
})

function viewQuestions(companyName: string) {
  emit('viewQuestions', companyName)
}
</script>

<style scoped>
.company-question-table-wrapper {
  margin-top: 16px;
  overflow-x: auto;
}

.company-question-table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

/* Header */
.company-question-table thead {
  background: #F9FAFB;
  border-bottom: 2px solid #E5E7EB;
}

.company-question-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.col-company {
  min-width: 140px;
}

.col-category {
  text-align: center;
  width: 100px;
}

.col-total {
  text-align: center;
  width: 80px;
  font-weight: 700;
}

.col-action {
  width: 140px;
}

/* Body */
.company-row {
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.15s ease;
}

.company-row:hover {
  background: #F9FAFB;
}

.company-row:last-child {
  border-bottom: none;
}

.company-name {
  padding: 10px 16px;
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.category-count {
  padding: 10px 16px;
  text-align: center;
  color: #374151;
  font-size: 14px;
}

.total-count {
  padding: 10px 16px;
  text-align: center;
  font-weight: 700;
  color: #111827;
  font-size: 14px;
}

.action-cell {
  padding: 10px 16px;
  text-align: right;
}

.view-link {
  background: none;
  border: none;
  color: #2563EB;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  transition: color 0.15s ease;
  font-family: inherit;
}

.view-link:hover {
  color: #1E40AF;
  text-decoration: underline;
}

/* Footer (Summary Row) */
.company-question-table tfoot {
  border-top: 2px solid #E5E7EB;
  background: #F9FAFB;
}

.summary-row {
  font-weight: 600;
}

.summary-label {
  padding: 12px 16px;
  color: #111827;
  font-weight: 700;
  font-size: 14px;
}

.summary-count {
  padding: 12px 16px;
  text-align: center;
  color: #374151;
  font-size: 14px;
}

.summary-total {
  padding: 12px 16px;
  text-align: center;
  font-weight: 700;
  color: #111827;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .company-question-table {
    font-size: 13px;
  }

  .company-question-table th,
  .company-question-table td {
    padding: 8px 12px;
  }

  .col-category {
    width: 80px;
  }

  .col-action {
    width: 120px;
  }
}
</style>
