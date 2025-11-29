<template>
  <section class="hero-section">
    <div class="hero-container">
      <!-- Hero Video -->
      <div class="hero-visual">
        <video autoplay loop muted playsinline class="hero-video">
          <source src="@/assets/Assets_Robot/Robot-hero-present.mp4" type="video/mp4">
        </video>
      </div>

      <!-- Search Bar -->
      <div class="hero-search">
        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search interview insights..."
            @keyup.enter="handleSearch"
          />
          <button class="search-button" @click="handleSearch" title="Search">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p class="search-hint">
          Try: "Amazon system design" or "FAANG comparison"
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/workflow',
      query: { q: searchQuery.value.trim() }
    })
  }
}
</script>

<style scoped>
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  padding-top: 52px; /* Account for fixed nav */
  position: relative;
  overflow: hidden;
}

/* Subtle Lab Background */
.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
  pointer-events: none;
  z-index: 0;
  background-image:
    /* Fine grid pattern - graph paper style */
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 30px 30px;
}

/* Lab equipment watermarks in corners */
.hero-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.04;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='1200' height='800' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-width='2'%3E%3C!-- Top left: beaker --%3E%3Cpath d='M 50 50 L 50 120 Q 50 150 80 150 L 120 150 Q 150 150 150 120 L 150 50 M 60 50 L 140 50' /%3E%3C!-- Top right: monitor --%3E%3Crect x='1050' y='50' width='120' height='80' rx='4' /%3E%3Cline x1='1090' y1='130' x2='1130' y2='130' /%3E%3Cline x1='1110' y1='130' x2='1110' y2='140' /%3E%3C!-- Bottom left: microscope --%3E%3Ccircle cx='80' cy='680' r='25' /%3E%3Cline x1='80' y1='705' x2='80' y2='750' /%3E%3Cline x1='60' y1='750' x2='100' y2='750' /%3E%3C!-- Bottom right: circuit --%3E%3Ccircle cx='1080' cy='700' r='15' /%3E%3Cline x1='1095' y1='700' x2='1120' y2='700' /%3E%3Crect x='1120' y='690' width='20' height='20' /%3E%3C/g%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}

.hero-container {
  max-width: 1280px;
  width: 100%;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  position: relative;
  z-index: 1;
}

.hero-visual {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-video {
  width: 100%;
  height: auto;
  max-height: 700px;
  object-fit: contain;
  border-radius: 12px;
}

.hero-search {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 16px 60px 16px 24px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #000000;
  transition: border-width 0.2s, box-shadow 0.2s;
}

.search-input::placeholder {
  color: #666666;
}

.search-input:focus {
  outline: none;
  border-width: 3px;
  box-shadow: 0 0 0 1px #000000;
}

.search-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: #000000;
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.search-button:hover {
  background: #333333;
  transform: translateY(-50%) scale(1.05);
}

.search-button:active {
  transform: translateY(-50%) scale(0.98);
}

.search-hint {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666666;
  text-align: center;
  margin: 0;
}

/* Tablet */
@media (max-width: 1024px) {
  .hero-container {
    gap: 48px;
  }

  .hero-video {
    max-height: 500px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .hero-section {
    min-height: calc(100vh - 48px);
    padding-top: 48px;
  }

  .hero-container {
    padding: 0 20px;
    gap: 32px;
  }

  .hero-video {
    max-height: 400px;
    border-radius: 8px;
  }

  .search-input {
    padding: 14px 20px;
    font-size: 14px;
  }

  .search-hint {
    font-size: 12px;
  }
}
</style>
