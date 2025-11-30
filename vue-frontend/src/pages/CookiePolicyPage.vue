<template>
  <div class="legal-page">
    <LandingNav />
    <div class="legal-container">
      <div class="legal-content">
        <h1 class="legal-title">Cookie Policy</h1>
        <p class="legal-last-updated">Last updated: November 29, 2025</p>

        <section class="legal-section">
          <h2>What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit a website.
            They are widely used to make websites work more efficiently and provide information to the site owners.
          </p>
        </section>

        <section class="legal-section">
          <h2>How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the Service to function properly (e.g., authentication, session management)</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Service</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>Types of Cookies We Use</h2>
          <h3>Session Cookies</h3>
          <p>
            These cookies are temporary and are deleted when you close your browser. They are essential
            for maintaining your session and authentication state.
          </p>

          <h3>Persistent Cookies</h3>
          <p>
            These cookies remain on your device for a set period or until you delete them. They help us
            remember your preferences and improve your experience.
          </p>
        </section>

        <section class="legal-section">
          <h2>Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies on your device. These services help us analyze
            usage patterns and improve our Service. We do not control these third-party cookies.
          </p>
        </section>

        <section class="legal-section">
          <h2>Managing Cookies</h2>
          <p>
            You can control and manage cookies in various ways. Most browsers allow you to refuse or accept
            cookies, and to delete cookies that have already been set.
          </p>
          <p>
            Please note that if you choose to disable cookies, some features of the Service may not function properly.
          </p>
        </section>

        <section class="legal-section">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact us at:
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

.legal-section h3 {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 24px 0 12px 0;
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

  .legal-section h3 {
    font-size: 16px;
  }

  .legal-section p,
  .legal-section li {
    font-size: 15px;
  }
}
</style>

