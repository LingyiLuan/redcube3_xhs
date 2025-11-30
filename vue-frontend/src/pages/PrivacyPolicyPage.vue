<template>
  <div class="legal-page">
    <LandingNav />
    <div class="legal-container">
      <div class="legal-content">
        <h1 class="legal-title">Privacy Policy</h1>
        <p class="legal-last-updated">Last updated: November 29, 2025</p>

        <section class="legal-section">
          <h2>1. Introduction</h2>
          <p>
            LabZero ("we," "our," or "us") operates the website https://labzero.io (the "Service").
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Account information (name, email address) when you register</li>
            <li>Interview experiences and content you share</li>
            <li>Profile information and preferences</li>
            <li>Communications with us</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>We automatically collect certain information when you use our Service:</p>
          <ul>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and location data</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Service</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Public Content:</strong> Interview experiences you share are publicly visible</li>
            <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information.
            However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Opt-out of certain communications</li>
            <li>Export your data</li>
          </ul>
          <p>To exercise these rights, contact us at: <a href="mailto:lingyi.luan01@gmail.com">lingyi.luan01@gmail.com</a></p>
        </section>

        <section class="legal-section">
          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and store certain information.
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for individuals under the age of 18. We do not knowingly collect
            personal information from children under 18.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section class="legal-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
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
  padding-top: 52px; /* Account for fixed nav */
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

/* Mobile */
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

