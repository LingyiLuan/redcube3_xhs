<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-container">
      <!-- Step 1: Warning -->
      <div v-if="step === 1" class="modal-content">
        <div class="modal-header">
          <div class="icon-wrapper danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2>Delete Account?</h2>
          <p class="subtitle">This action cannot be undone and will permanently delete your account.</p>
        </div>

        <div class="warning-section">
          <h3>What will be deleted:</h3>
          <ul class="deletion-list">
            <li>Your profile and account information</li>
            <li>All your interview experiences and contributions</li>
            <li>Your learning maps and progress</li>
            <li>Usage history and analytics</li>
            <li>All associated data and preferences</li>
          </ul>

          <div class="grace-period-notice">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>You'll have 14 days to change your mind and reactivate your account.</span>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="handleCancel" class="btn-secondary">
            Cancel
          </button>
          <button @click="step = 2" class="btn-danger">
            Continue
          </button>
        </div>
      </div>

      <!-- Step 2: Confirmation -->
      <div v-else-if="step === 2" class="modal-content">
        <div class="modal-header">
          <h2>Are you absolutely sure?</h2>
          <p class="subtitle">This will schedule your account for permanent deletion.</p>
        </div>

        <div class="confirmation-section">
          <div class="form-group">
            <label for="email-confirm">Type your email to confirm</label>
            <input
              id="email-confirm"
              v-model="emailConfirm"
              type="email"
              :placeholder="userEmail"
              class="confirm-input"
              @keyup.enter="emailConfirm === userEmail && handleDelete()"
            />
            <p v-if="emailError" class="error-text">{{ emailError }}</p>
          </div>

          <div class="form-group">
            <label for="reason">Why are you leaving? (optional)</label>
            <textarea
              id="reason"
              v-model="deletionReason"
              placeholder="Help us improve by sharing your reason..."
              class="reason-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="checkbox-group">
            <input
              id="understand"
              v-model="understandPermanent"
              type="checkbox"
              class="checkbox-input"
            />
            <label for="understand" class="checkbox-label">
              I understand this action is permanent and my data cannot be recovered after 14 days
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="step = 1" class="btn-secondary">
            Go Back
          </button>
          <button
            @click="handleDelete"
            :disabled="!canDelete || deleting"
            class="btn-danger"
          >
            {{ deleting ? 'Deleting...' : 'Delete My Account' }}
          </button>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-else-if="step === 3" class="modal-content">
        <div class="modal-header">
          <div class="icon-wrapper success">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Account Deletion Scheduled</h2>
          <p class="subtitle">Your account will be permanently deleted in 14 days.</p>
        </div>

        <div class="success-section">
          <p class="success-message">
            We've sent a confirmation email to <strong>{{ userEmail }}</strong>.
          </p>
          <p class="success-message">
            You can log in at any time before the deletion date to cancel and reactivate your account.
          </p>
          <div class="deletion-date">
            <strong>Deletion scheduled for:</strong> {{ deletionDate }}
          </div>
        </div>

        <div class="modal-actions">
          <button @click="handleClose" class="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  isOpen: boolean
  userEmail: string
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  userEmail: ''
})

const emit = defineEmits<{
  close: []
  delete: [reason: string]
}>()

const step = ref(1)
const emailConfirm = ref('')
const deletionReason = ref('')
const understandPermanent = ref(false)
const deleting = ref(false)
const emailError = ref('')

const canDelete = computed(() => {
  return emailConfirm.value === props.userEmail && understandPermanent.value
})

const deletionDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function handleCancel() {
  resetModal()
  emit('close')
}

function handleClose() {
  resetModal()
  emit('close')
}

async function handleDelete() {
  if (!canDelete.value) {
    if (emailConfirm.value !== props.userEmail) {
      emailError.value = 'Email does not match'
    }
    return
  }

  emailError.value = ''
  deleting.value = true

  try {
    emit('delete', deletionReason.value)
    // Wait for parent to handle the deletion
    setTimeout(() => {
      deleting.value = false
      step.value = 3
    }, 500)
  } catch (error) {
    deleting.value = false
    emailError.value = 'Failed to delete account. Please try again.'
  }
}

function resetModal() {
  step.value = 1
  emailConfirm.value = ''
  deletionReason.value = ''
  understandPermanent.value = false
  emailError.value = ''
  deleting.value = false
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content {
  padding: 32px;
}

/* Header */
.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.icon-wrapper.danger {
  background: #fee2e2;
  color: #dc2626;
}

.icon-wrapper.success {
  background: #d1fae5;
  color: #10b981;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}

/* Warning Section */
.warning-section {
  margin-bottom: 24px;
}

.warning-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.deletion-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px 0;
}

.deletion-list li {
  padding: 8px 0;
  padding-left: 24px;
  position: relative;
  font-size: 14px;
  color: #475569;
}

.deletion-list li:before {
  content: "×";
  position: absolute;
  left: 0;
  color: #dc2626;
  font-size: 18px;
  font-weight: bold;
}

.grace-period-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #dbeafe;
  border-radius: 6px;
  border-left: 3px solid #3B82F6;
}

.grace-period-notice svg {
  color: #3B82F6;
  flex-shrink: 0;
  margin-top: 2px;
}

.grace-period-notice span {
  font-size: 13px;
  color: #1E3A8A;
  line-height: 1.5;
}

/* Confirmation Section */
.confirmation-section {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 6px;
}

.confirm-input,
.reason-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.confirm-input:focus,
.reason-textarea:focus {
  outline: none;
  border-color: #3B82F6;
}

.error-text {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
}

.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.checkbox-input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.checkbox-label {
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
  cursor: pointer;
}

/* Success Section */
.success-section {
  margin-bottom: 24px;
}

.success-message {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 12px;
}

.deletion-date {
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 14px;
  color: #1E3A8A;
  text-align: center;
  margin-top: 16px;
}

/* Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1E3A8A;
  color: white;
}

.btn-primary:hover {
  background: #1E40AF;
}

.btn-secondary {
  background: white;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.btn-secondary:hover {
  background: #F8FAFC;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
  }

  .modal-content {
    padding: 24px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
  }
}
</style>
