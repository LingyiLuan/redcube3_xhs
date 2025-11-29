<template>
  <div class="pricing-page">
    <div class="pricing-container">
      <!-- Header -->
      <div class="pricing-header">
        <h1>Choose Your Plan</h1>
        <p class="subtitle">Unlock premium features and accelerate your career growth</p>

        <!-- Billing Toggle -->
        <div class="billing-toggle">
          <button
            :class="['toggle-btn', { active: billingCycle === 'monthly' }]"
            @click="billingCycle = 'monthly'"
          >
            Monthly
          </button>
          <button
            :class="['toggle-btn', { active: billingCycle === 'annual' }]"
            @click="billingCycle = 'annual'"
          >
            Annual <span class="save-text">(Save 27%)</span>
          </button>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="pricing-grid">
        <!-- Free Plan -->
        <div class="pricing-card">
          <div class="card-header">
            <h3>Free</h3>
            <div class="price">
              <span class="amount">$0</span>
              <span class="period">/month</span>
            </div>
          </div>

          <ul class="features">
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>5 analyses per month</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>2 learning maps per month</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Basic interview insights</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Community access</span>
            </li>
          </ul>

          <button class="cta-button secondary" disabled>
            Current Plan
          </button>
        </div>

        <!-- Pro Plan -->
        <div class="pricing-card featured">
          <div class="best-value-label">BEST VALUE</div>

          <div class="card-header">
            <h3>Pro</h3>
            <div class="price">
              <span class="amount">${{ proPlan.price }}</span>
              <span class="period">/{{ billingCycle === 'monthly' ? 'month' : 'year' }}</span>
            </div>
            <div v-if="billingCycle === 'annual'" class="price-note">
              ${{ (proPlan.price / 12).toFixed(2) }}/month billed annually
            </div>
          </div>

          <ul class="features">
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span><strong>15 analyses</strong> per month</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span><strong>10 learning maps</strong> per month</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Advanced interview intelligence</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Company-specific insights</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Priority support</span>
            </li>
          </ul>

          <button
            class="cta-button primary"
            :disabled="loading"
            @click="handleSubscribe(proPlan.variantId)"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Subscribe to Pro</span>
          </button>
        </div>

        <!-- Premium Plan -->
        <div class="pricing-card">
          <div class="card-header">
            <h3>Premium</h3>
            <div class="price">
              <span class="amount">${{ premiumPlan.price }}</span>
              <span class="period">/{{ billingCycle === 'monthly' ? 'month' : 'year' }}</span>
            </div>
            <div v-if="billingCycle === 'annual'" class="price-note">
              ${{ (premiumPlan.price / 12).toFixed(2) }}/month billed annually
            </div>
          </div>

          <ul class="features">
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span><strong>Unlimited analyses</strong></span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span><strong>Unlimited learning maps</strong></span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Real-time interview trends</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>Custom curriculum builder</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>1-on-1 career coaching</span>
            </li>
            <li class="feature-item">
              <CheckIcon class="check-icon" />
              <span>White-glove support</span>
            </li>
          </ul>

          <button
            class="cta-button primary"
            :disabled="loading"
            @click="handleSubscribe(premiumPlan.variantId)"
          >
            <span v-if="loading">Processing...</span>
            <span v-else>Subscribe to Premium</span>
          </button>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="faq-section">
        <h2>Frequently Asked Questions</h2>

        <div class="faq-grid">
          <div class="faq-item">
            <h4>Can I change plans later?</h4>
            <p>Yes! You can upgrade or downgrade your plan at any time from your account settings.</p>
          </div>

          <div class="faq-item">
            <h4>What happens when I hit my limits?</h4>
            <p>You'll be notified when approaching limits. You can upgrade anytime or wait for the next billing cycle.</p>
          </div>

          <div class="faq-item">
            <h4>How do refunds work?</h4>
            <p>We offer a 14-day money-back guarantee on all paid plans. Contact support for a refund.</p>
          </div>

          <div class="faq-item">
            <h4>Is my payment information secure?</h4>
            <p>Yes! All payments are processed securely through Lemon Squeezy. We never store your payment details.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Icon component (you can replace with your icon library)
const CheckIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `
}

const router = useRouter()
const billingCycle = ref<'monthly' | 'annual'>('monthly')
const loading = ref(false)

// Lemon Squeezy variant IDs from your .env
const VARIANT_IDS = {
  PRO_MONTHLY: '1115451',
  PRO_ANNUAL: '1115461',
  PREMIUM_MONTHLY: '1115464',
  PREMIUM_ANNUAL: '1115465'
}

// Computed plans based on billing cycle
const proPlan = computed(() => ({
  name: 'Pro',
  price: billingCycle.value === 'monthly' ? 9 : 79,
  variantId: billingCycle.value === 'monthly' ? VARIANT_IDS.PRO_MONTHLY : VARIANT_IDS.PRO_ANNUAL
}))

const premiumPlan = computed(() => ({
  name: 'Premium',
  price: billingCycle.value === 'monthly' ? 19 : 169,
  variantId: billingCycle.value === 'monthly' ? VARIANT_IDS.PREMIUM_MONTHLY : VARIANT_IDS.PREMIUM_ANNUAL
}))

// Handle subscription
const handleSubscribe = async (variantId: string) => {
  try {
    loading.value = true

    // Call your backend API to create checkout session
    const response = await axios.post('/api/content/ls/checkout', {
      variant_id: variantId
    })

    if (response.data.success && response.data.checkout_url) {
      // Redirect to Lemon Squeezy checkout
      window.location.href = response.data.checkout_url
    } else {
      throw new Error('Failed to create checkout session')
    }
  } catch (error) {
    console.error('Subscription error:', error)
    alert('Failed to start checkout. Please try again or contact support.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pricing-page {
  min-height: 100vh;
  background: #F8FAFC;
  padding: 80px 20px;
}

.pricing-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.pricing-header {
  text-align: center;
  margin-bottom: 60px;
}

.pricing-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 16px;
  color: #64748B;
  margin-bottom: 40px;
}

/* Billing Toggle */
.billing-toggle {
  display: inline-flex;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.toggle-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #64748B;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #1E3A8A;
  color: white;
}

.save-text {
  font-size: 12px;
  color: inherit;
  margin-left: 4px;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
  margin-bottom: 80px;
}

.pricing-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 32px;
  transition: border-color 0.2s ease;
  position: relative;
}

.pricing-card:hover {
  border-color: #CBD5E1;
}

.pricing-card.featured {
  border: 2px solid #1E3A8A;
}

.best-value-label {
  font-size: 11px;
  color: #1E3A8A;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: center;
  margin-bottom: 16px;
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #E2E8F0;
}

.card-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 12px;
}

.price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.amount {
  font-size: 40px;
  font-weight: 600;
  color: #1E3A8A;
}

.period {
  font-size: 14px;
  color: #64748B;
}

.price-note {
  font-size: 13px;
  color: #64748B;
  margin-top: 6px;
}

/* Features */
.features {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
}

.check-icon {
  color: #10b981;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-item span {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

/* CTA Buttons */
.cta-button {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button.primary {
  background: #1E3A8A;
  color: white;
}

.cta-button.primary:hover:not(:disabled) {
  background: #1E40AF;
}

.cta-button.secondary {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.cta-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* FAQ Section */
.faq-section {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 48px 32px;
  margin-top: 60px;
}

.faq-section h2 {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 32px;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.faq-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 8px;
}

.faq-item p {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .pricing-header h1 {
    font-size: 32px;
  }

  .subtitle {
    font-size: 16px;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .faq-section {
    padding: 40px 20px;
  }
}
</style>
