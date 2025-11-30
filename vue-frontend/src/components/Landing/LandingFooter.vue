<template>
  <section class="landing-footer-section">
    <div class="section-container">
      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <!-- Logo Column -->
          <div class="footer-col footer-col-logo">
            <div class="footer-logo">
              <span class="footer-logo-text">
                <span class="footer-logo-lab">Lab</span><span class="footer-logo-zero">Zero</span>
              </span>
            </div>
            <p class="footer-copyright">© 2025 LabZero. All rights reserved.</p>
          </div>

          <!-- Product Column -->
          <div class="footer-col">
            <h4 class="footer-heading">PRODUCT</h4>
            <a href="#features" class="footer-link">Features</a>
            <a href="#how-it-works" class="footer-link">How It Works</a>
            <a href="/workflow" class="footer-link">Workflow Lab</a>
            <a href="#pricing" class="footer-link">Pricing</a>
          </div>

          <!-- Resources Column -->
          <div class="footer-col">
            <h4 class="footer-heading">RESOURCES</h4>
            <a href="/docs" class="footer-link">Documentation</a>
            <a href="/changelog" class="footer-link">Updates/Changelog</a>
            <a href="https://github.com/redcube" target="_blank" class="footer-link">GitHub</a>
            <a href="/community" class="footer-link">Discord/Community</a>
          </div>

          <!-- Support Column -->
          <div class="footer-col">
            <h4 class="footer-heading">SUPPORT</h4>
            <a href="mailto:lingyi.luan01@gmail.com" class="footer-link">Contact Us</a>
            <a href="/status" class="footer-link">Status Page</a>
            <a href="/bugs" class="footer-link">Bug Reports</a>
            <a href="/feature-requests" class="footer-link">Feature Requests</a>
          </div>

          <!-- Legal Column -->
          <div class="footer-col">
            <h4 class="footer-heading">LEGAL</h4>
            <a href="/privacy" class="footer-link">Privacy Policy</a>
            <a href="/terms" class="footer-link">Terms of Service</a>
            <a href="/security" class="footer-link">Security</a>
            <a href="/cookies" class="footer-link">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
// No pricing functionality needed - just static footer
</script>

<style scoped>
.landing-footer-section {
  background: #000000;
  padding: 64px 0 32px 0;
  border-top: 3px solid #000000;
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Footer */
.footer {
  padding: 0;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 64px;
  padding-bottom: 32px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-col-logo {
  gap: 12px;
}

.footer-logo {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.footer-logo-text {
  display: inline-block;
}

.footer-logo-lab {
  color: #FFFFFF;
}

.footer-logo-zero {
  color: #1E3A8A;
}

.footer-tagline {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #999999;
  margin: 0;
  line-height: 1.5;
}

.footer-copyright {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666666;
  margin: 8px 0 0 0;
}

.footer-heading {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #666666;
  margin: 0 0 4px 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.footer-link {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #FFFFFF;
  text-decoration: none;
  transition: color 0.2s;
  line-height: 1.6;
}

.footer-link:hover {
  color: #999999;
}

/* Tablet */
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 2fr 1fr 1fr;
    gap: 40px;
  }

  .footer-col:nth-child(4),
  .footer-col:nth-child(5) {
    grid-column: span 1;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .landing-footer-section {
    padding: 48px 0 24px 0;
  }

  .section-container {
    padding: 0 20px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .footer-col-logo {
    padding-bottom: 16px;
    border-bottom: 1px solid #333333;
  }
}
</style>
