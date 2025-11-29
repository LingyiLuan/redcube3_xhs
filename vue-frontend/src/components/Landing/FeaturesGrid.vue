<template>
  <section id="features" class="features-section">
    <div class="features-container">
      <h2 class="section-title">BUILT FOR SERIOUS PREP</h2>

      <div class="features-grid">
        <div v-for="feature in features" :key="feature.id" class="feature-card">
          <div class="feature-icon" v-html="feature.icon"></div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-desc">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const features = ref([
  {
    id: 1,
    title: 'SMART SEARCH',
    description: 'Find relevant interview experiences across thousands of posts instantly',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="12" stroke="#000000" stroke-width="2"/>
      <path d="M29 29 L38 38" stroke="#000000" stroke-width="2"/>
      <circle cx="20" cy="20" r="4" fill="#000000"/>
    </svg>`
  },
  {
    id: 2,
    title: 'COMPREHENSIVE REPORTS',
    description: 'Professional-grade analysis with data visualizations and insights',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="28" height="28" stroke="#000000" stroke-width="2"/>
      <rect x="15" y="28" width="4" height="10" fill="#000000"/>
      <rect x="22" y="22" width="4" height="16" fill="#000000"/>
      <rect x="29" y="18" width="4" height="20" fill="#000000"/>
    </svg>`
  },
  {
    id: 3,
    title: 'LEARNING ROADMAPS',
    description: 'Personalized study plans tailored to your career goals and skill gaps',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="12" r="4" stroke="#000000" stroke-width="2"/>
      <circle cx="12" cy="30" r="4" stroke="#000000" stroke-width="2"/>
      <circle cx="36" cy="30" r="4" stroke="#000000" stroke-width="2"/>
      <path d="M24 16 L24 24 M24 24 L12 26 M24 24 L36 26" stroke="#000000" stroke-width="2"/>
    </svg>`
  },
  {
    id: 4,
    title: 'CUSTOM ANALYSIS',
    description: 'Build multi-step analysis workflows tailored to your specific needs',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="10" height="10" stroke="#000000" stroke-width="2"/>
      <rect x="28" y="10" width="10" height="10" stroke="#000000" stroke-width="2"/>
      <rect x="19" y="28" width="10" height="10" stroke="#000000" stroke-width="2"/>
      <path d="M15 20 L24 28 M24 28 L33 20" stroke="#000000" stroke-width="2"/>
    </svg>`
  },
  {
    id: 5,
    title: 'INTERVIEW INSIGHTS',
    description: 'Predict interview difficulty and success rates based on real experiences',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 L16 28 L24 32 L32 18 L40 24" stroke="#000000" stroke-width="2" fill="none"/>
      <circle cx="16" cy="28" r="3" fill="#000000"/>
      <circle cx="24" cy="32" r="3" fill="#000000"/>
      <circle cx="32" cy="18" r="3" fill="#000000"/>
    </svg>`
  },
  {
    id: 6,
    title: 'INSTANT INSIGHTS',
    description: 'Get comprehensive analysis and personalized recommendations in seconds',
    icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="14" stroke="#000000" stroke-width="2"/>
      <path d="M24 12 L24 24 L32 28" stroke="#000000" stroke-width="2"/>
      <circle cx="24" cy="24" r="2" fill="#000000"/>
    </svg>`
  }
])
</script>

<style scoped>
.features-section {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 64px 0;
}

.features-container {
  max-width: 1280px;
  width: 100%;
  padding: 0 32px;
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

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  padding: 32px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s, border-width 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-width: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  letter-spacing: 0.5px;
}

.feature-desc {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #666666;
  margin: 0;
}

/* Tablet */
@media (max-width: 1024px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .feature-card {
    padding: 28px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .features-section {
    min-height: auto;
    padding: 48px 0;
  }

  .features-container {
    padding: 0 20px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 32px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .feature-card {
    padding: 24px;
  }

  .feature-title {
    font-size: 18px;
  }

  .feature-desc {
    font-size: 14px;
  }
}
</style>
