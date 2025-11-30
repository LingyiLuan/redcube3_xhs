<template>
  <div class="legal-page">
    <LandingNav />
    <div class="legal-container">
      <div class="legal-content">
        <h1 class="legal-title">Security</h1>
        <p class="legal-last-updated">Last updated: November 29, 2025</p>

        <section class="legal-section">
          <h2>Our Commitment to Security</h2>
          <p>
            At LabZero, we take the security of your data seriously. We implement industry-standard
            security measures to protect your information and ensure a safe experience on our platform.
          </p>
        </section>

        <section class="legal-section">
          <h2>Data Protection</h2>
          <ul>
            <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using TLS/SSL</li>
            <li><strong>Secure Storage:</strong> Sensitive data is stored securely using industry-standard encryption</li>
            <li><strong>Access Controls:</strong> We implement strict access controls to ensure only authorized personnel can access user data</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>Authentication & Authorization</h2>
          <ul>
            <li>Secure password hashing using bcrypt</li>
            <li>OAuth 2.0 integration for Google sign-in</li>
            <li>Session-based authentication with secure cookies</li>
            <li>Role-based access control for different user permissions</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>Infrastructure Security</h2>
          <ul>
            <li>Regular security updates and patches</li>
            <li>Firewall protection and network security</li>
            <li>DDoS protection via Cloudflare</li>
            <li>Regular security audits and vulnerability assessments</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>Reporting Security Issues</h2>
          <p>
            If you discover a security vulnerability, please report it to us immediately at:
            <a href="mailto:lingyi.luan01@gmail.com">lingyi.luan01@gmail.com</a>
          </p>
          <p>
            We appreciate responsible disclosure and will work with you to address any security concerns.
          </p>
        </section>

        <section class="legal-section">
          <h2>Contact Us</h2>
          <p>
            For security-related questions, please contact us at:
            <a href="mailto:lingyi.luan01@gmail.com">lingyi.luan01@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
    <LandingFooter />
  </div>
</template>

<script setup>
import LandingNav from '@/components/Landing/LandingNav.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-top: 52px;
}

.legal-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 32px;
}

.legal-content {
  font-family: 'Inter', sans-serif;
  color: #374151;
  line-height: 1.7;
}

.legal-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.legal-last-updated {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 48px 0;
}

.legal-section {
  margin-bottom: 40px;
}

.legal-section h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 16px 0;
}

.legal-section p {
  font-size: 16px;
  color: #374151;
  margin: 0 0 16px 0;
}

.legal-section ul {
  margin: 16px 0;
  padding-left: 24px;
}

.legal-section li {
  font-size: 16px;
  color: #374151;
  margin: 8px 0;
  line-height: 1.6;
}

.legal-section a {
  color: #1E3A8A;
  text-decoration: none;
}

.legal-section a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .legal-container {
    padding: 48px 20px;
  }

  .legal-title {
    font-size: 32px;
  }

  .legal-section h2 {
    font-size: 20px;
  }

  .legal-section p,
  .legal-section li {
    font-size: 15px;
  }
}
</style>

