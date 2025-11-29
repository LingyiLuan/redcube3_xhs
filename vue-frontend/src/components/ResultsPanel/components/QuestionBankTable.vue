<template>
  <div class="question-bank-table-wrapper">
    <table class="question-bank-table">
      <thead>
        <tr>
          <th class="col-number">#</th>
          <th class="col-question">Question</th>
          <th class="col-company">Company</th>
          <th class="col-source">Source</th>
          <th class="col-category">Category</th>
          <th class="col-difficulty">Difficulty</th>
          <th class="col-leetcode">LeetCode</th>
          <th class="col-stage">Stage</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(question, index) in questions"
          :key="index"
          @click="$emit('questionClick', question)"
          class="question-row">
          <td class="question-number">
            {{ (currentPage - 1) * questionsPerPage + index + 1 }}
          </td>
          <td class="question-text">
            <span class="question-title">{{ truncateText(question.text, 85) }}</span>
          </td>
          <td class="company-cell">
            <span class="company-name">{{ question.company }}</span>
          </td>
          <td class="source-cell">
            <span class="source-badge" :class="{ 'source-seed': question.source === 'seed' }">
              {{ question.source === 'seed' ? 'YOUR POST' : 'Similar' }}
            </span>
          </td>
          <td class="category-cell">
            <span class="category-badge" :class="getCategoryClass(question.category)">
              {{ formatCategory(question.category) }}
            </span>
          </td>
          <td class="difficulty-cell">
            <div class="difficulty-info">
              <span class="difficulty-badge" :class="getLeetCodeDifficultyClass(question)">
                {{ getLeetCodeDifficultyText(question) }}
              </span>
              <span v-if="question.leetcode_frontend_id" class="leetcode-id">#{{ question.leetcode_frontend_id }}</span>
            </div>
          </td>
          <td class="leetcode-cell">
            <div v-if="question.leetcode_url" class="leetcode-match">
              <a
                :href="question.leetcode_url"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                class="leetcode-link">
                Practice →
              </a>
              <span
                v-if="getMatchConfidenceLevel(question) === 'high'"
                class="confidence-badge high"
                :title="`High confidence match (${Math.round((question.match_confidence || 0) * 100)}%)`">
                ⭐⭐⭐
              </span>
              <span
                v-else-if="getMatchConfidenceLevel(question) === 'good'"
                class="confidence-badge good"
                :title="`Good match (${Math.round((question.match_confidence || 0) * 100)}%)`">
                ⭐⭐
              </span>
              <span
                v-else-if="getMatchConfidenceLevel(question) === 'ok'"
                class="confidence-badge ok"
                :title="`Possible match (${Math.round((question.match_confidence || 0) * 100)}%)`">
                ⭐
              </span>
            </div>
            <span v-else class="no-match">-</span>
          </td>
          <td class="stage-cell">{{ question.stage || 'N/A' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Question {
  text: string
  company: string
  category: string
  difficulty: number
  source?: 'seed' | 'similar'
  stage?: string
  successRate?: number
  avgTime?: number
  topics?: string[]
  tips?: string
  leetcode_id?: number
  leetcode_frontend_id?: number
  leetcode_url?: string
  leetcode_title?: string
  leetcode_difficulty?: 'Easy' | 'Medium' | 'Hard'
  match_confidence?: number
  match_method?: string
}

interface Props {
  questions: Question[]
  currentPage: number
  questionsPerPage: number
}

const props = defineProps<Props>()
defineEmits<{
  questionClick: [question: Question]
}>()

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    'coding': 'Coding',
    'system_design': 'System Design',
    'behavioral': 'Behavioral',
    'technical': 'Technical',
    'case_study': 'Case Study'
  }
  return map[category] || category.charAt(0).toUpperCase() + category.slice(1)
}

function getCategoryClass(category: string): string {
  const classMap: Record<string, string> = {
    'coding': 'cat-coding',
    'system_design': 'cat-system',
    'behavioral': 'cat-behavioral',
    'technical': 'cat-technical',
    'case_study': 'cat-case'
  }
  return classMap[category] || ''
}

function getDifficultyClass(difficulty: number): string {
  if (difficulty < 3.0) return 'diff-easy'
  if (difficulty >= 3.0 && difficulty < 4.0) return 'diff-medium'
  return 'diff-hard'
}

function getLeetCodeDifficultyText(question: Question): string {
  // Prefer LeetCode difficulty if matched
  if (question.leetcode_difficulty) {
    return question.leetcode_difficulty
  }
  // Fallback to calculated difficulty
  return `${question.difficulty}/5`
}

function getLeetCodeDifficultyClass(question: Question): string {
  // Use LeetCode difficulty class if available
  if (question.leetcode_difficulty) {
    const diff = question.leetcode_difficulty.toLowerCase()
    return `leetcode-${diff}`
  }
  // Fallback to numeric difficulty class
  return getDifficultyClass(question.difficulty)
}

function getMatchConfidenceLevel(question: Question): 'high' | 'good' | 'ok' | 'none' {
  const confidence = question.match_confidence || 0
  if (confidence >= 0.90) return 'high'   // ⭐⭐⭐ Exact or keyword match
  if (confidence >= 0.80) return 'good'   // ⭐⭐ Alias or fuzzy match
  if (confidence >= 0.70) return 'ok'     // ⭐ LLM match
  return 'none'
}
</script>

<style scoped>
.question-bank-table-wrapper {
  margin-top: 16px;
  overflow-x: auto;
}

.question-bank-table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

/* Header */
.question-bank-table thead {
  background: #F9FAFB;
  border-bottom: 2px solid #E5E7EB;
}

.question-bank-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.col-number {
  width: 50px;
  text-align: center;
}

.col-question {
  min-width: 300px;
  max-width: 500px;
}

.col-company {
  width: 130px;
}

.col-source {
  width: 110px;
  text-align: center;
}

.col-category {
  width: 140px;
  text-align: center;
}

.col-difficulty {
  width: 120px;
  text-align: center;
}

.col-leetcode {
  width: 100px;
  text-align: center;
}

.col-stage {
  width: 140px;
}

/* Body */
.question-row {
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.question-row:hover {
  background: #F9FAFB;
}

.question-row:last-child {
  border-bottom: none;
}

.question-row td {
  padding: 12px 16px;
  color: #374151;
  font-size: 13px;
  vertical-align: middle;
}

.question-number {
  text-align: center;
  color: #9CA3AF;
  font-size: 12px;
  font-weight: 500;
}

.question-text {
  padding-right: 24px;
}

.question-title {
  display: block;
  color: #111827;
  font-weight: 500;
  line-height: 1.5;
}

.company-cell {
  text-align: left;
}

.company-name {
  font-weight: 600;
  color: #111827;
  font-size: 13px;
}

.source-cell {
  text-align: center;
}

.source-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6B7280;
  background: #F3F4F6;
}

.source-badge.source-seed {
  color: #1E40AF;
  background: #DBEAFE;
  border: 1px solid #93C5FD;
}

.category-cell {
  text-align: center;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.cat-coding {
  background: #DBEAFE;
  color: #1E40AF;
}

.cat-system {
  background: #DBEAFE;
  color: #1E40AF;
}

.cat-behavioral {
  background: #BFDBFE;
  color: #3B82F6;
}

.cat-technical {
  background: #E0E7FF;
  color: #3730A3;
}

.cat-case {
  background: #FCE7F3;
  color: #9F1239;
}

.difficulty-cell {
  text-align: center;
}

.difficulty-badge {
  font-size: 12px;
  font-weight: 700;
}

.diff-easy {
  color: #3B82F6;
}

.diff-medium {
  color: #1E40AF;
}

.diff-hard {
  color: #1E3A8A;
}

.stage-cell {
  color: #6B7280;
  font-size: 13px;
}

/* LeetCode difficulty badges */
.difficulty-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.leetcode-id {
  font-size: 10px;
  color: #9CA3AF;
  font-weight: 500;
}

.leetcode-easy {
  color: #10B981;
  font-weight: 700;
}

.leetcode-medium {
  color: #F59E0B;
  font-weight: 700;
}

.leetcode-hard {
  color: #EF4444;
  font-weight: 700;
}

/* LeetCode link button */
.leetcode-cell {
  text-align: center;
}

.leetcode-match {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.leetcode-link {
  display: inline-block;
  padding: 6px 12px;
  background: #FFA116;
  color: #FFFFFF;
  text-decoration: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.leetcode-link:hover {
  background: #FF8C00;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 161, 22, 0.3);
}

.leetcode-link:active {
  transform: translateY(0);
}

.confidence-badge {
  font-size: 14px;
  line-height: 1;
  cursor: help;
  user-select: none;
  transition: transform 0.2s ease;
}

.confidence-badge:hover {
  transform: scale(1.1);
}

.confidence-badge.high {
  /* Gold stars for high confidence (90%+) */
  filter: drop-shadow(0 1px 2px rgba(255, 215, 0, 0.3));
}

.confidence-badge.good {
  /* Slightly dimmed for good matches (80-89%) */
  opacity: 0.85;
  filter: drop-shadow(0 1px 2px rgba(255, 215, 0, 0.2));
}

.confidence-badge.ok {
  /* More dimmed for ok matches (70-79%) */
  opacity: 0.7;
  filter: drop-shadow(0 1px 1px rgba(255, 215, 0, 0.15));
}

.no-match {
  color: #D1D5DB;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .col-stage {
    display: none;
  }

  .stage-cell {
    display: none;
  }

  .col-leetcode {
    width: 80px;
  }

  .leetcode-link {
    padding: 5px 10px;
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  .question-bank-table {
    font-size: 13px;
  }

  .question-bank-table th,
  .question-bank-table td {
    padding: 10px 12px;
  }

  .col-question {
    min-width: 200px;
  }

  .col-company {
    width: 100px;
  }

  .col-category {
    width: 110px;
  }
}
</style>
