<template>
  <div class="changelog-page">
    <LandingNav />
    <div class="changelog-container">
      <div class="changelog-content">
        <h1 class="changelog-title">Changelog</h1>
        <p class="changelog-subtitle">Recent updates and improvements to LabZero</p>

        <div class="changelog-entry">
          <div class="entry-header">
            <h2 class="entry-version">Version 1.0.0 - Beta Launch</h2>
            <div class="entry-date">November 29, 2025</div>
          </div>
          <div class="entry-content">
            <h3>New Features</h3>
            <ul>
              <li>Initial beta release of LabZero</li>
              <li>Workflow Lab with visual workflow editor</li>
              <li>AI-powered interview experience analysis</li>
              <li>Community platform for sharing interview experiences</li>
              <li>Learning map generation</li>
              <li>User authentication with Google OAuth</li>
            </ul>

            <h3>Improvements</h3>
            <ul>
              <li>Streamlined user interface</li>
              <li>Enhanced analysis reports</li>
              <li>Improved search functionality</li>
            </ul>

            <h3>Bug Fixes</h3>
            <ul>
              <li>Fixed authentication persistence issues</li>
              <li>Resolved workflow execution errors</li>
              <li>Fixed report display issues</li>
            </ul>
          </div>
        </div>

        <div class="changelog-footer">
          <p>
            For questions or feedback, contact us at:
            <a href="mailto:lingyi.luan01@gmail.com">lingyi.luan01@gmail.com</a>
          </p>
        </div>
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
.changelog-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-top: 52px;
}

.changelog-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 32px;
}

.changelog-content {
  font-family: 'Inter', sans-serif;
  color: #374151;
  line-height: 1.7;
}

.changelog-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.changelog-subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0 0 48px 0;
}

.changelog-entry {
  margin-bottom: 48px;
  padding: 32px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #E5E7EB;
}

.entry-version {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.entry-date {
  font-size: 14px;
  color: #6B7280;
  font-weight: 600;
}

.entry-content h3 {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 24px 0 12px 0;
}

.entry-content h3:first-child {
  margin-top: 0;
}

.entry-content ul {
  margin: 16px 0;
  padding-left: 24px;
}

.entry-content li {
  font-size: 16px;
  color: #374151;
  margin: 8px 0;
  line-height: 1.6;
}

.changelog-footer {
  padding-top: 32px;
  border-top: 2px solid #E5E7EB;
  text-align: center;
}

.changelog-footer p {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

.changelog-footer a {
  color: #1E3A8A;
  text-decoration: none;
}

.changelog-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .changelog-container {
    padding: 48px 20px;
  }

  .changelog-title {
    font-size: 32px;
  }

  .entry-header {
    flex-direction: column;
    gap: 8px;
  }

  .entry-version {
    font-size: 20px;
  }

  .entry-content h3 {
    font-size: 16px;
  }

  .entry-content li {
    font-size: 15px;
  }
}
</style>

