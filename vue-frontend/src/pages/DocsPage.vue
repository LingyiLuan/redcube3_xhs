<template>
  <div class="docs-page">
    <LandingNav />
    <div class="docs-container">
      <div class="docs-content">
        <h1 class="docs-title">Documentation</h1>
        <p class="docs-subtitle">Learn how to use LabZero</p>

        <div class="docs-section">
          <h2>Getting Started</h2>
          <p>
            Welcome to LabZero! This documentation will help you get started with using our platform
            to analyze tech interview experiences and generate personalized learning roadmaps.
          </p>
        </div>

        <div class="docs-section">
          <h2>Quick Start Guide</h2>
          <ol>
            <li>Sign in with your Google account</li>
            <li>Navigate to the Workflow Lab</li>
            <li>Use the AI search bar to find interview experiences</li>
            <li>Select posts and analyze them</li>
            <li>View your analysis reports and generate learning maps</li>
          </ol>
        </div>

        <div class="docs-section">
          <h2>Features</h2>
          <h3>Workflow Lab</h3>
          <p>
            Create and execute analysis workflows using our visual workflow editor. Connect input nodes,
            analysis nodes, and report nodes to build custom analysis pipelines.
          </p>

          <h3>Community</h3>
          <p>
            Browse and share interview experiences from the tech industry. Learn from others' experiences
            and contribute your own to help the community.
          </p>

          <h3>Learning Maps</h3>
          <p>
            Generate personalized learning roadmaps based on your analysis results. Get actionable insights
            on what skills to focus on for your target role and company.
          </p>
        </div>

        <div class="docs-section">
          <h2>Need Help?</h2>
          <p>
            If you have questions or need assistance, please contact us at:
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
.docs-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-top: 52px;
}

.docs-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 32px;
}

.docs-content {
  font-family: 'Inter', sans-serif;
  color: #374151;
  line-height: 1.7;
}

.docs-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.docs-subtitle {
  font-size: 16px;
  color: #6B7280;
  margin: 0 0 48px 0;
}

.docs-section {
  margin-bottom: 48px;
}

.docs-section h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 16px 0;
}

.docs-section h3 {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 24px 0 12px 0;
}

.docs-section p {
  font-size: 16px;
  color: #374151;
  margin: 0 0 16px 0;
}

.docs-section ol {
  margin: 16px 0;
  padding-left: 24px;
}

.docs-section li {
  font-size: 16px;
  color: #374151;
  margin: 8px 0;
  line-height: 1.6;
}

.docs-section a {
  color: #1E3A8A;
  text-decoration: none;
}

.docs-section a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .docs-container {
    padding: 48px 20px;
  }

  .docs-title {
    font-size: 32px;
  }

  .docs-section h2 {
    font-size: 20px;
  }

  .docs-section h3 {
    font-size: 16px;
  }

  .docs-section p,
  .docs-section li {
    font-size: 15px;
  }
}
</style>

