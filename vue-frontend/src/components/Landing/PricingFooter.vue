<template>
  <section class="pricing-footer-section">
    <div class="section-container">
      <!-- Pricing Section -->
      <div class="pricing-section">
        <h2 class="section-title">PRICING</h2>

        <div class="pricing-grid">
          <!-- Free Tier -->
          <div class="pricing-card">
            <h3 class="plan-name">FREE</h3>
            <div class="plan-price">
              <span class="price-amount">$0</span>
              <span class="price-period">/month</span>
            </div>
            <ul class="features-list">
              <li class="feature-item">✓ 10 analyses per month</li>
              <li class="feature-item">✓ Basic RAG search</li>
              <li class="feature-item">✓ Standard reports</li>
              <li class="feature-item">✓ Community support</li>
            </ul>
            <button class="cta-btn outlined" @click="handleGetStarted('free')">
              GET STARTED
            </button>
          </div>

          <!-- Pro Tier (Recommended) -->
          <div class="pricing-card recommended">
            <div class="recommended-badge">RECOMMENDED</div>
            <h3 class="plan-name">PRO</h3>
            <div class="plan-price">
              <span class="price-amount">$29</span>
              <span class="price-period">/month</span>
            </div>
            <ul class="features-list">
              <li class="feature-item">✓ Unlimited analyses</li>
              <li class="feature-item">✓ Advanced RAG search</li>
              <li class="feature-item">✓ McKinsey reports</li>
              <li class="feature-item">✓ Learning maps</li>
              <li class="feature-item">✓ Workflow builder</li>
              <li class="feature-item">✓ Priority support</li>
            </ul>
            <button class="cta-btn filled" @click="handleGetStarted('pro')">
              START FREE TRIAL
            </button>
          </div>

          <!-- Enterprise Tier -->
          <div class="pricing-card">
            <h3 class="plan-name">ENTERPRISE</h3>
            <div class="plan-price">
              <span class="price-amount">Custom</span>
            </div>
            <ul class="features-list">
              <li class="feature-item">✓ Everything in Pro</li>
              <li class="feature-item">✓ Custom integrations</li>
              <li class="feature-item">✓ Dedicated support</li>
              <li class="feature-item">✓ SLA guarantee</li>
              <li class="feature-item">✓ Team management</li>
              <li class="feature-item">✓ API access</li>
            </ul>
            <button class="cta-btn outlined" @click="handleContact">
              CONTACT SALES
            </button>
          </div>
        </div>
      </div>

      <!-- Contact Section -->
      <div class="contact-section">
        <p class="contact-text">
          Questions? <a href="mailto:contact@interviewintel.dev" class="contact-link">contact@interviewintel.dev</a>
        </p>
        <p class="tagline">Built for serious interview prep</p>
      </div>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-col">
            <div class="footer-logo">INTERVIEW INTEL</div>
            <p class="footer-copyright">© 2025 Interview Intel. All rights reserved.</p>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">PRODUCT</h4>
            <a href="#features" class="footer-link">Features</a>
            <a href="#how-it-works" class="footer-link">How it Works</a>
            <a href="/workflow" class="footer-link">Workflow Lab</a>
          </div>

          <div class="footer-col">
            <h4 class="footer-heading">CONNECT</h4>
            <a href="https://github.com/redcube" target="_blank" class="footer-link">GitHub</a>
            <a href="https://twitter.com/redcube" target="_blank" class="footer-link">Twitter</a>
            <a href="/docs" class="footer-link">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function handleGetStarted(plan) {
  router.push({
    path: '/register',
    query: { plan }
  })
}

function handleContact() {
  window.location.href = 'mailto:contact@interviewintel.dev?subject=Enterprise Plan Inquiry'
}
</script>

<style scoped>
.pricing-footer-section {
  background: #FFFFFF;
  padding: 64px 0 0 0;
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Pricing */
.pricing-section {
  padding-bottom: 64px;
}

.section-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #000000;
  text-align: center;
  margin: 0 0 64px 0;
  letter-spacing: -0.5px;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.pricing-card {
  position: relative;
  padding: 40px 32px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.pricing-card.recommended {
  border-width: 4px;
}

.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  background: #000000;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.plan-name {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 16px 0;
  letter-spacing: 1px;
}

.plan-price {
  margin-bottom: 32px;
}

.price-amount {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 48px;
  font-weight: 700;
  color: #000000;
}

.price-period {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  flex-grow: 1;
}

.feature-item {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #000000;
  margin-bottom: 12px;
  padding-left: 0;
}

.cta-btn {
  width: 100%;
  padding: 14px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid #000000;
}

.cta-btn.filled {
  background: #000000;
  color: #FFFFFF;
}

.cta-btn.filled:hover {
  background: #333333;
}

.cta-btn.outlined {
  background: #FFFFFF;
  color: #000000;
}

.cta-btn.outlined:hover {
  background: #000000;
  color: #FFFFFF;
}

/* Contact */
.contact-section {
  padding: 48px 0;
  text-align: center;
  border-top: 2px solid #F8F8F8;
  border-bottom: 2px solid #F8F8F8;
}

.contact-text {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #000000;
  margin: 0 0 8px 0;
}

.contact-link {
  color: #000000;
  font-weight: 600;
  text-decoration: underline;
}

.tagline {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
  margin: 0;
}

/* Footer */
.footer {
  padding: 48px 0;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-logo {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin-bottom: 8px;
}

.footer-copyright {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
  margin: 0;
}

.footer-heading {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.footer-link {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #000000;
}

/* Tablet */
@media (max-width: 1024px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .pricing-footer-section {
    padding: 48px 0 0 0;
  }

  .section-container {
    padding: 0 20px;
  }

  .pricing-section {
    padding-bottom: 48px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 32px;
  }

  .pricing-card {
    padding: 32px 24px;
  }

  .plan-name {
    font-size: 20px;
  }

  .price-amount {
    font-size: 40px;
  }

  .contact-section {
    padding: 32px 0;
  }

  .footer {
    padding: 32px 0;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
