<template>
  <section class="stats-section">
    <div class="stats-container">
      <h2 class="section-title">THE NUMBERS SPEAK</h2>

      <div class="stats-grid">
        <div class="stat-item" ref="stat1">
          <div class="stat-number">{{ animatedPosts }}</div>
          <div class="stat-label">POSTS ANALYZED</div>
        </div>

        <div class="stat-item" ref="stat2">
          <div class="stat-number">{{ animatedInsights }}</div>
          <div class="stat-label">INSIGHTS GENERATED</div>
        </div>

        <div class="stat-item" ref="stat3">
          <div class="stat-number">{{ animatedSuccess }}%</div>
          <div class="stat-label">SUCCESS RATE</div>
        </div>

        <div class="stat-item" ref="stat4">
          <div class="stat-number">{{ animatedRating }}</div>
          <div class="stat-label">RATING</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const animatedPosts = ref(0)
const animatedInsights = ref(0)
const animatedSuccess = ref(0)
const animatedRating = ref('0.0')

const stat1 = ref(null)
const stat2 = ref(null)
const stat3 = ref(null)
const stat4 = ref(null)

const targetValues = {
  posts: 247,
  insights: 18000,
  success: 89,
  rating: 4.8
}

function animateCounter(current, target, setter, duration = 2000, isFloat = false) {
  const start = performance.now()
  const startValue = current.value

  function update(timestamp) {
    const elapsed = timestamp - start
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    if (isFloat) {
      const value = (startValue + (target - startValue) * eased).toFixed(1)
      setter(value)
    } else {
      const value = Math.floor(startValue + (target - startValue) * eased)
      setter(value)
    }

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Start counter animations
          animateCounter(animatedPosts, targetValues.posts, (val) => { animatedPosts.value = val })
          animateCounter(animatedInsights, targetValues.insights, (val) => { animatedInsights.value = val })
          animateCounter(animatedSuccess, targetValues.success, (val) => { animatedSuccess.value = val })
          animateCounter(animatedRating, targetValues.rating, (val) => { animatedRating.value = val }, 2000, true)

          observer.disconnect()
        }
      })
    },
    { threshold: 0.3 }
  )

  if (stat1.value) {
    observer.observe(stat1.value)
  }
})
</script>

<style scoped>
.stats-section {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 64px 0;
}

.stats-container {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 48px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.stat-number {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 64px;
  font-weight: 700;
  color: #000000;
  line-height: 1;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #666666;
  text-align: center;
  letter-spacing: 1px;
}

/* Tablet */
@media (max-width: 1024px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
  }

  .stat-number {
    font-size: 56px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .stats-section {
    min-height: auto;
    padding: 48px 0;
  }

  .stats-container {
    padding: 0 20px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 32px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .stat-number {
    font-size: 48px;
  }

  .stat-label {
    font-size: 12px;
  }
}
</style>
