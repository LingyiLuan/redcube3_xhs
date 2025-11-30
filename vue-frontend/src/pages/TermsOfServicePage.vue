<template>
  <div class="legal-page">
    <LandingNav />
    <div class="legal-container">
      <div class="legal-content">
        <h1 class="legal-title">Terms of Service</h1>
        <p class="legal-last-updated">Last updated: November 29, 2025</p>

        <section class="legal-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using LabZero ("the Service"), you agree to be bound by these Terms of Service.
            If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only.
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained in the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. User Accounts</h2>
          <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times.</p>
          <p>You are responsible for safeguarding the password and for all activities that occur under your account.</p>
          <p>You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account.</p>
        </section>

        <section class="legal-section">
          <h2>4. User Content</h2>
          <h3>4.1 Content You Submit</h3>
          <p>
            You retain ownership of any content you submit, post, or display on or through the Service ("User Content").
            By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
            modify, and distribute your User Content for the purpose of operating and providing the Service.
          </p>

          <h3>4.2 Content Standards</h3>
          <p>You agree not to submit User Content that:</p>
          <ul>
            <li>Is illegal, harmful, or violates any applicable law</li>
            <li>Infringes on the rights of others (including intellectual property rights)</li>
            <li>Contains false or misleading information</li>
            <li>Is spam, unsolicited, or contains malicious code</li>
            <li>Violates the privacy of others</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>5. Prohibited Uses</h2>
          <p>You may not use the Service:</p>
          <ul>
            <li>In any way that violates any applicable law or regulation</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material</li>
            <li>To impersonate or attempt to impersonate the company, employees, or other users</li>
            <li>In any way that infringes upon the rights of others</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use of the Service</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>6. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by LabZero and are
            protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Disclaimer</h2>
          <p>
            The information on the Service is provided on an "as is" basis. To the fullest extent permitted by law,
            LabZero excludes all representations, warranties, and conditions relating to the Service and the use of the Service.
          </p>
          <p>
            LabZero does not warrant that the Service will be available, uninterrupted, secure, or error-free,
            or that defects will be corrected.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Limitation of Liability</h2>
          <p>
            In no event shall LabZero, nor its directors, employees, partners, agents, suppliers, or affiliates,
            be liable for any indirect, incidental, special, consequential, or punitive damages, including without
            limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use
            of the Service.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice
            or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will cease immediately. If you wish to terminate your account,
            you may simply discontinue using the Service or contact us to delete your account.
          </p>
        </section>

        <section class="legal-section">
          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        <section class="legal-section">
          <h2>11. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
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

