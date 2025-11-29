<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'
import { useReportsStore } from '@/stores/reportsStore'
import { useUIStore } from '@/stores/uiStore'
import {
  getReportCompany,
  getReportRole,
  getReportDifficulty,
  getReportOutcome,
  formatReportDate
} from '@/utils/reportHelpers'

const reportsStore = useReportsStore()
const uiStore = useUIStore()

const sortedReports = computed(() => reportsStore.sortedReports)

function handleViewReport(reportId: string) {
  uiStore.showReportDetail(reportId)
  reportsStore.markAsRead(reportId)
}

function handleDeleteReport(event: Event, reportId: string) {
  event.stopPropagation() // Prevent row click
  if (confirm('Delete this report?')) {
    reportsStore.deleteReport(reportId)
    uiStore.showToast('Report deleted', 'info')
  }
}

// Check if outcome is "Failed" for warning indicator
function isFailed(report: any): boolean {
  const outcome = report.result?.outcome || report.result?.overview?.outcome
  return outcome?.toLowerCase() === 'failed'
}
</script>

<template>
  <div class="reports-list-view">
    <!-- Empty State -->
    <div v-if="sortedReports.length === 0" class="empty-state">
      <h3 class="empty-title">No Reports Yet</h3>
      <p class="empty-description">
        Analyze a node to generate your first report. Reports will appear here once generated.
      </p>
    </div>

    <!-- Reports Table -->
    <div v-else class="table-container">
      <table class="reports-table">
        <thead>
          <tr>
            <th class="col-company">Company</th>
            <th class="col-role">Role</th>
            <th class="col-difficulty">Difficulty</th>
            <th class="col-outcome">Outcome</th>
            <th class="col-date">Date</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="report in sortedReports"
            :key="report.id"
            :class="['table-row', { 'row-unread': !report.isRead }]"
            @click="handleViewReport(report.id)"
          >
            <td class="col-company">{{ getReportCompany(report) }}</td>
            <td class="col-role">{{ getReportRole(report) }}</td>
            <td class="col-difficulty">{{ getReportDifficulty(report) }}</td>
            <td class="col-outcome">
              <span :class="['outcome-text', { 'outcome-failed': isFailed(report) }]">
                {{ getReportOutcome(report) }}
                <AlertTriangle v-if="isFailed(report)" :size="14" class="warning-icon" />
              </span>
            </td>
            <td class="col-date">{{ formatReportDate(report.timestamp) }}</td>
            <td class="col-actions">
              <button
                @click="(e) => handleDeleteReport(e, report.id)"
                class="delete-btn"
                title="Delete report"
              >
                <X :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.reports-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #6b7280;
  max-width: 400px;
  margin: 0;
}

/* Table Container */
.table-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Professional Table */
.reports-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reports-table thead {
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 10;
}

.reports-table thead th {
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.reports-table tbody tr {
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f3f4f6;
}

/* Alternating row colors */
.reports-table tbody tr:nth-child(even) {
  background-color: #f9fafb;
}

.reports-table tbody tr:hover {
  background-color: #eff6ff;
}

/* Unread row styling */
.reports-table tbody tr.row-unread {
  background-color: #dbeafe;
  font-weight: 500;
}

.reports-table tbody tr.row-unread:hover {
  background-color: #bfdbfe;
}

.reports-table tbody td {
  padding: 10px 16px;
  color: #374151;
  vertical-align: middle;
}

/* Column widths */
.col-company {
  width: 15%;
  font-weight: 500;
}

.col-role {
  width: 30%;
}

.col-difficulty {
  width: 12%;
}

.col-outcome {
  width: 15%;
}

.col-date {
  width: 15%;
  color: #6b7280;
  font-size: 12px;
}

.col-actions {
  width: 8%;
  text-align: center;
}

/* Outcome with warning icon */
.outcome-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.outcome-failed {
  color: #dc2626;
  font-weight: 500;
}

.warning-icon {
  color: #dc2626;
}

/* Delete button */
.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Responsive */
@media (max-width: 1024px) {
  .col-role {
    width: 25%;
  }

  .col-difficulty,
  .col-outcome {
    width: 10%;
  }
}

@media (max-width: 768px) {
  .reports-table {
    font-size: 12px;
  }

  .reports-table thead th {
    padding: 10px 12px;
    font-size: 10px;
  }

  .reports-table tbody td {
    padding: 8px 12px;
  }

  /* Hide less important columns on mobile */
  .col-difficulty {
    display: none;
  }

  .col-role {
    width: 40%;
  }
}
</style>
