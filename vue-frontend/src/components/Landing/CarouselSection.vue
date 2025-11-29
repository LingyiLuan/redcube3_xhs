<template>
  <section class="carousel-section">
    <div class="carousel-container">
      <h2 class="section-title">INTELLIGENCE IN ACTION</h2>

      <!-- 3D Carousel Scene -->
      <div
        class="carousel-scene"
        :style="sceneStyle"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <div class="carousel-ring" :style="ringStyle">
          <div v-for="(card, index) in cards" :key="card.id"
               class="carousel-card"
               :style="getCardStyle(index)">
            <div class="card-content" @click="viewAnalysis(card.company)">
              <h3 class="card-company">{{ card.company }}</h3>
              <p class="card-role">{{ card.role }}</p>

              <!-- Prominent bar chart visualization -->
              <div class="chart-container">
                <div class="chart-bars">
                  <div v-for="(bar, i) in card.chartData" :key="i" class="chart-bar">
                    <div class="bar-fill" :style="{ height: bar + '%' }"></div>
                    <span class="bar-value">{{ bar }}%</span>
                  </div>
                </div>
                <p class="chart-label">Interview Success Rate</p>
              </div>

              <!-- Stats -->
              <div class="card-stats">
                <div class="stat">
                  <span class="stat-label">DIFFICULTY</span>
                  <span class="stat-value">{{ card.difficulty }}/10</span>
                </div>
                <div class="stat">
                  <span class="stat-label">PREP TIME</span>
                  <span class="stat-value">{{ card.prepTime }} weeks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="carousel-hint">Drag to rotate • Scroll to zoom</p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const cards = [
  {
    id: 1,
    company: 'AMAZON',
    role: 'Senior SDE - System Design',
    chartData: [35, 55, 70, 48],  // Moderate, steady growth
    difficulty: 8,
    prepTime: 12
  },
  {
    id: 2,
    company: 'GOOGLE',
    role: 'L4 Software Engineer',
    chartData: [50, 72, 95, 88],  // Steep climb to very high
    difficulty: 9,
    prepTime: 16
  },
  {
    id: 3,
    company: 'META',
    role: 'E4 Backend Engineer',
    chartData: [25, 40, 92, 78],  // Dramatic jump in 3rd bar
    difficulty: 8,
    prepTime: 14
  },
  {
    id: 4,
    company: 'APPLE',
    role: 'ICT3 Systems Engineer',
    chartData: [68, 45, 82, 60],  // Dip then recovery
    difficulty: 7,
    prepTime: 10
  },
  {
    id: 5,
    company: 'NETFLIX',
    role: 'Senior Engineer',
    chartData: [80, 88, 98, 92],  // Consistently very high
    difficulty: 9,
    prepTime: 18
  }
]

const anglePerCard = 360 / cards.length
const radius = 500

// Animation and interaction state
const autoRotationY = ref(0)
const manualRotationY = ref(0)
const manualRotationX = ref(0)
const perspective = ref(1800)

const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

let animationFrameId = null
const rotationSpeed = 360 / 120000 // 360 degrees in 120 seconds (2 minutes)

// Combined rotation style
const sceneStyle = computed(() => ({
  perspective: `${perspective.value}px`
}))

const ringStyle = computed(() => ({
  transform: `rotateX(${manualRotationX.value}deg) rotateY(${autoRotationY.value + manualRotationY.value}deg)`
}))

// Position each card in circular formation
function getCardStyle(index) {
  const angle = anglePerCard * index
  return {
    transform: `rotateY(${angle}deg) translateZ(${radius}px)`
  }
}

// Animation loop - auto rotation
function animate() {
  const deltaTime = 16.67 // Approximate 60fps
  autoRotationY.value += rotationSpeed * deltaTime

  // Keep rotation within 0-360 to prevent overflow
  if (autoRotationY.value >= 360) {
    autoRotationY.value -= 360
  }

  animationFrameId = requestAnimationFrame(animate)
}

// Mouse drag handlers
function handleMouseDown(event) {
  isDragging.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  event.preventDefault()
}

function handleMouseMove(event) {
  if (!isDragging.value) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  manualRotationY.value += deltaX * 0.5
  manualRotationX.value -= deltaY * 0.3

  // Clamp X rotation to prevent flipping
  manualRotationX.value = Math.max(-60, Math.min(60, manualRotationX.value))

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
}

function handleMouseUp() {
  isDragging.value = false
}

// Mouse wheel zoom - expanded range for better distant view
function handleWheel(event) {
  event.preventDefault()
  const delta = event.deltaY * 2 // Increased sensitivity
  perspective.value = Math.max(1000, Math.min(4500, perspective.value + delta))
}

function viewAnalysis(company) {
  router.push({
    path: '/workflow',
    query: { q: company }
  })
}

onMounted(() => {
  // Start animation loop
  animate()

  // Add wheel listener
  const scene = document.querySelector('.carousel-scene')
  if (scene) {
    scene.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  // Clean up animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // Clean up wheel listener
  const scene = document.querySelector('.carousel-scene')
  if (scene) {
    scene.removeEventListener('wheel', handleWheel)
  }
})
</script>

<style scoped>
.carousel-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding: 80px 0;
}

.carousel-container {
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
  margin: 0 0 80px 0;
  letter-spacing: -0.5px;
}

/* 3D Scene Container */
.carousel-scene {
  width: 100%;
  height: 700px;
  perspective-origin: 50% 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}

.carousel-scene:active {
  cursor: grabbing;
}

/* Rotating Ring - All Cards Spin Together */
.carousel-ring {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

/* Individual Cards Positioned in Circle - SMALLER SIZE */
.carousel-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  margin-left: -120px;
  margin-top: -180px;
  transform-style: preserve-3d;
}

.card-content {
  padding: 28px 20px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 12px;
  height: 360px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  cursor: pointer;
}

.card-content:hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
  border-width: 4px;
  transform: translateY(-8px) scale(1.05);
}

.card-company {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.card-role {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: #666666;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.chart-container {
  flex: 1;
  margin-bottom: 16px;
  padding: 12px;
  background: #F8F8F8;
  border: 2px solid #E0E0E0;
  border-radius: 6px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  height: 100px;
  margin-bottom: 10px;
  padding: 0 4px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(to top, #000000, #333333);
  transition: height 0.8s ease-out;
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bar-value {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #000000;
  order: -1;
}

.chart-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin: 0;
  letter-spacing: 0.3px;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 2px solid #F8F8F8;
  border-bottom: 2px solid #F8F8F8;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 600;
  color: #666666;
  letter-spacing: 0.5px;
}

.stat-value {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
}

.carousel-hint {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666666;
  text-align: center;
  margin: 32px 0 0 0;
  letter-spacing: 0.5px;
}

/* Tablet */
@media (max-width: 1024px) {
  .section-title {
    font-size: 36px;
    margin-bottom: 48px;
  }

  .carousel-scene {
    height: 600px;
  }

  .carousel-card {
    width: 260px;
    margin-left: -130px;
  }

  .card-content {
    height: 400px;
    padding: 28px 20px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .carousel-section {
    min-height: auto;
    padding: 48px 0;
  }

  .carousel-container {
    padding: 0 20px;
  }

  .section-title {
    font-size: 28px;
    margin-bottom: 32px;
  }

  .carousel-scene {
    height: 500px;
  }

  .carousel-card {
    width: 240px;
    margin-left: -120px;
  }

  .card-content {
    padding: 24px 20px;
    height: 380px;
  }

  .card-company {
    font-size: 20px;
  }

  .card-role {
    font-size: 12px;
  }

  .chart-bars {
    height: 100px;
  }

  .carousel-hint {
    font-size: 12px;
  }
}
</style>
