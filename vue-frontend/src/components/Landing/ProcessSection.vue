<template>
  <section id="how-it-works" class="process-section">
    <div class="process-container">
      <h2 class="section-title">FROM RAW DATA TO ACTIONABLE INSIGHTS</h2>

      <div class="process-steps">
        <!-- Step 1 -->
        <div class="process-card" ref="card1">
          <div class="step-number">01</div>
          <div class="step-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="25" stroke="#000000" stroke-width="2"/>
              <path d="M20 30 H40 M30 20 V40" stroke="#000000" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="step-title">SEARCH</h3>
          <p class="step-desc">Query 247 posts</p>
        </div>

        <!-- Arrow -->
        <div class="process-arrow">
          <svg width="80" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 H70 M60 4 L70 12 L60 20" stroke="#000000" stroke-width="2"/>
          </svg>
        </div>

        <!-- Step 2 -->
        <div class="process-card" ref="card2">
          <div class="step-number">02</div>
          <div class="step-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="8" stroke="#000000" stroke-width="2"/>
              <circle cx="20" cy="20" r="5" stroke="#000000" stroke-width="2"/>
              <circle cx="40" cy="25" r="5" stroke="#000000" stroke-width="2"/>
              <circle cx="25" cy="40" r="5" stroke="#000000" stroke-width="2"/>
              <line x1="25" y1="22" x2="28" y2="25" stroke="#000000" stroke-width="1.5"/>
              <line x1="35" y1="27" x2="32" y2="29" stroke="#000000" stroke-width="1.5"/>
              <line x1="27" y1="35" x2="28" y2="33" stroke="#000000" stroke-width="1.5"/>
            </svg>
          </div>
          <h3 class="step-title">ANALYZE</h3>
          <p class="step-desc">RAG AI generates insights</p>
        </div>

        <!-- Arrow -->
        <div class="process-arrow">
          <svg width="80" height="24" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12 H70 M60 4 L70 12 L60 20" stroke="#000000" stroke-width="2"/>
          </svg>
        </div>

        <!-- Step 3 -->
        <div class="process-card" ref="card3">
          <div class="step-number">03</div>
          <div class="step-icon">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="15" width="30" height="30" stroke="#000000" stroke-width="2"/>
              <path d="M20 30 L27 37 L40 24" stroke="#000000" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3 class="step-title">LEARN</h3>
          <p class="step-desc">Roadmap created</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const card1 = ref(null)
const card2 = ref(null)
const card3 = ref(null)

onMounted(() => {
  // Animate cards on scroll into view
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cards = [card1.value, card2.value, card3.value]
          cards.forEach((card, index) => {
            if (card) {
              setTimeout(() => {
                card.style.opacity = '1'
                card.style.transform = 'translateY(0)'
              }, index * 150)
            }
          })
          observer.disconnect()
        }
      })
    },
    { threshold: 0.2 }
  )

  if (card1.value) observer.observe(card1.value)
})
</script>

<style scoped>
.process-section {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 64px 0;
}

.process-container {
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

.process-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.process-card {
  flex: 1;
  max-width: 280px;
  padding: 32px 24px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s, box-shadow 0.3s, border-width 0.3s;
  opacity: 0;
  transform: translateY(30px);
}

.process-card:hover {
  transform: translateY(-4px);
  border-width: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.step-number {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 72px;
  font-weight: 700;
  color: #000000;
  line-height: 1;
}

.step-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #000000;
  margin: 0;
  letter-spacing: 1px;
}

.step-desc {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  text-align: center;
  margin: 0;
}

.process-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Tablet */
@media (max-width: 1024px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }

  .process-steps {
    gap: 24px;
  }

  .process-card {
    max-width: 240px;
    padding: 24px 20px;
  }

  .step-number {
    font-size: 60px;
  }

  .process-arrow svg {
    width: 60px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .process-section {
    min-height: auto;
    padding: 48px 0;
  }

  .process-container {
    padding: 0 20px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 32px;
  }

  .process-steps {
    flex-direction: column;
    gap: 20px;
  }

  .process-card {
    max-width: 100%;
    width: 100%;
  }

  .process-arrow {
    transform: rotate(90deg);
  }

  .process-arrow svg {
    width: 40px;
  }
}
</style>
