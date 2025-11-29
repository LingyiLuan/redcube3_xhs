<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <button class="modal-close" @click="close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="modal-content">
          <h2 class="modal-title">TRIAL LIMIT REACHED</h2>
          <p class="modal-subtitle">You've used {{ analysesUsed }} of {{ freeAnalyses }} free analyses</p>

          <div class="trial-stats">
            <div class="stat-item">
              <span class="stat-label">ANALYSES COMPLETED</span>
              <span class="stat-value">{{ analysesUsed }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">FREE LIMIT</span>
              <span class="stat-value">{{ freeAnalyses }}</span>
            </div>
          </div>

          <div class="upgrade-section">
            <h3 class="upgrade-title">Upgrade to Pro</h3>
            <p class="upgrade-description">
              Get unlimited access to AI-powered interview analysis, comprehensive learning maps, and advanced insights.
            </p>

            <div class="pricing-card">
              <div class="pricing-header">
                <span class="pricing-label">PRO</span>
                <div class="pricing-amount">
                  <span class="price-currency">$</span>
                  <span class="price-value">29</span>
                  <span class="price-period">/month</span>
                </div>
              </div>

              <ul class="features-list">
                <li class="feature-item">
                  <svg class="check-icon" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M16 6L8 14L4 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Unlimited analyses</span>
                </li>
                <li class="feature-item">
                  <svg class="check-icon" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M16 6L8 14L4 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Advanced learning maps</span>
                </li>
                <li class="feature-item">
                  <svg class="check-icon" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M16 6L8 14L4 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Priority support</span>
                </li>
                <li class="feature-item">
                  <svg class="check-icon" width="20" height="20" viewBox="0 0 20 20">
                    <path d="M16 6L8 14L4 10" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Export to multiple formats</span>
                </li>
              </ul>

              <button class="upgrade-btn" @click="handleUpgrade">
                UPGRADE NOW
              </button>
            </div>

            <button class="later-btn" @click="close">
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  analysesUsed: {
    type: Number,
    default: 2
  },
  freeAnalyses: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['close', 'upgrade'])

function close() {
  emit('close')
}

function handleUpgrade() {
  emit('upgrade')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  position: relative;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}

.modal-close:hover {
  background: #000000;
}

.modal-close:hover svg path {
  stroke: #FFFFFF;
}

.modal-content {
  padding: 48px 40px;
}

.modal-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 12px 0;
  letter-spacing: 0.5px;
  text-align: center;
}

.modal-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0 0 32px 0;
  text-align: center;
}

.trial-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
  padding: 24px;
  background: #F8F8F8;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 32px;
  font-weight: 700;
  color: #000000;
}

.upgrade-section {
  text-align: center;
}

.upgrade-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 12px 0;
}

.upgrade-description {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #666666;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.pricing-card {
  border: 3px solid #000000;
  border-radius: 8px;
  padding: 32px 24px;
  margin-bottom: 20px;
}

.pricing-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #E0E0E0;
}

.pricing-label {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #666666;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 12px;
}

.pricing-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.price-currency {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
}

.price-value {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 56px;
  font-weight: 700;
  color: #000000;
  line-height: 1;
}

.price-period {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  color: #666666;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #000000;
  border-bottom: 1px solid #F0F0F0;
}

.feature-item:last-child {
  border-bottom: none;
}

.check-icon {
  flex-shrink: 0;
}

.upgrade-btn {
  width: 100%;
  padding: 16px 24px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.upgrade-btn:hover {
  background: #FFFFFF;
  color: #000000;
}

.later-btn {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  padding: 12px;
  transition: color 0.2s;
}

.later-btn:hover {
  color: #000000;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 32px 24px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-subtitle {
    font-size: 14px;
  }

  .trial-stats {
    padding: 20px;
  }

  .stat-value {
    font-size: 24px;
  }

  .upgrade-title {
    font-size: 20px;
  }

  .price-value {
    font-size: 48px;
  }

  .pricing-card {
    padding: 24px 20px;
  }
}
</style>
