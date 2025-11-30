<template>
  <div class="not-found-page">
    <LandingNav />
    <div class="not-found-container">
      <div class="not-found-content">
        <h1 class="not-found-title">404</h1>
        <h2 class="not-found-subtitle">Page Not Found</h2>
        <p class="not-found-description">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="not-found-actions">
          <router-link to="/" class="home-button">Go to Home</router-link>
          <router-link to="/workflow" class="workflow-button">Go to Workflow Lab</router-link>
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
.not-found-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-top: 52px; /* Account for fixed nav */
  display: flex;
  flex-direction: column;
}

.not-found-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
}

.not-found-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 120px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  line-height: 1;
  letter-spacing: -4px;
}

.not-found-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #000000;
  margin: 24px 0 16px 0;
  letter-spacing: -1px;
}

.not-found-description {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  color: #6B7280;
  margin: 0 0 40px 0;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.home-button,
.workflow-button {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  display: inline-block;
}

.home-button {
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
}

.home-button:hover {
  background: #FFFFFF;
  color: #000000;
}

.workflow-button {
  background: #FFFFFF;
  color: #1E3A8A;
  border: 2px solid #1E3A8A;
}

.workflow-button:hover {
  background: #1E3A8A;
  color: #FFFFFF;
}

/* Mobile */
@media (max-width: 768px) {
  .not-found-container {
    padding: 48px 20px;
  }

  .not-found-title {
    font-size: 80px;
  }

  .not-found-subtitle {
    font-size: 24px;
  }

  .not-found-description {
    font-size: 16px;
  }

  .not-found-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .home-button,
  .workflow-button {
    width: 100%;
  }
}
</style>


