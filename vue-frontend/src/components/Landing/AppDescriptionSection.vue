<template>
  <section class="app-description-section">
    <div class="description-container">
      <h2 class="description-title">What Is This Platform?</h2>
      <div class="description-content">
        <p class="description-text">
          We transform thousands of real tech industry interview experiences from Reddit and LeetCode into
          actionable career intelligence. Our AI-powered platform analyzes technical interview posts across all tech roles,
          extracts patterns, and generates personalized learning roadmaps tailored to your target role
          and company.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
// No logic needed - purely presentational
</script>

<style scoped>
.app-description-section {
  background: #FFFFFF;
  padding: 100px 0;
  position: relative;
  z-index: 1;
}

.description-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 40px;
  text-align: center;
}

.description-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #000000;
  letter-spacing: -1px;
  margin: 0 0 40px 0;
}

.description-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.description-text {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  line-height: 1.7;
  color: #374151;
  margin: 0;
  text-align: center;
}

/* Tablet */
@media (max-width: 1024px) {
  .app-description-section {
    padding: 80px 0;
  }

  .description-container {
    padding: 0 32px;
  }

  .description-title {
    font-size: 36px;
  }

  .description-text {
    font-size: 17px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .app-description-section {
    padding: 60px 0;
  }

  .description-container {
    padding: 0 20px;
  }

  .description-title {
    font-size: 28px;
    margin-bottom: 28px;
  }

  .description-text {
    font-size: 16px;
    line-height: 1.6;
  }
}
</style>
