<template>
  <nav class="landing-nav">
    <div class="nav-container">
      <!-- Logo -->
      <router-link to="/" class="nav-logo">
        INTERVIEW INTEL
        <span class="beta-badge">BETA</span>
      </router-link>

      <!-- Nav Links -->
      <div class="nav-links">
        <a href="/#features" class="nav-link">FEATURES</a>
        <router-link to="/pricing" class="nav-link">PRICING</router-link>
        <router-link to="/share-experiences" class="nav-link nav-link-community">COMMUNITY</router-link>
      </div>

      <!-- User Menu (when authenticated) -->
      <div v-if="authStore.isAuthenticated" class="user-menu-container">
        <div class="user-menu" @click="toggleDropdown">
          <div class="user-avatar">
            {{ userInitial }}
          </div>
          <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
          <svg class="dropdown-arrow" :class="{ 'open': isDropdownOpen }" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
          <div v-if="isDropdownOpen" class="user-dropdown" @click.stop>
            <a href="/profile" class="dropdown-item" @click="handleMenuClick">
              <span>Settings</span>
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-item" @click="handleLogout">
              <span>Logout</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Sign In Button (when not authenticated) -->
      <button v-else class="sign-in-btn" @click="handleSignIn">
        SIGN IN
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useReportsStore } from '@/stores/reportsStore'
import { useLearningMapStore } from '@/stores/learningMapStore'
import { useEventBus } from '@/utils/eventBus'

const router = useRouter()
const authStore = useAuthStore()
const reportsStore = useReportsStore()
const learningMapStore = useLearningMapStore()
const eventBus = useEventBus()
const isDropdownOpen = ref(false)

const userInitial = computed(() => {
  const name = authStore.user?.name || authStore.user?.email || 'U'
  return name.charAt(0).toUpperCase()
})

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleMenuClick() {
  isDropdownOpen.value = false
}

function handleClickOutside(event) {
  const target = event.target
  if (!target.closest('.user-menu-container')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  // Check auth status on mount
  authStore.checkAuthStatus()

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleSignIn() {
  eventBus.emit('open-login-modal')
}

async function handleLogout() {
  isDropdownOpen.value = false
  await authStore.logout()
  reportsStore.clearAll()
  learningMapStore.clearAll()
  router.push('/')
}
</script>

<style scoped>
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #FFFFFF;
  border-bottom: 2px solid #000000;
}

.nav-container {
  max-width: 100%;
  width: 100%;
  margin: 0;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
}

.nav-logo {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #000000;
  letter-spacing: 0.5px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-logo:hover {
  opacity: 0.7;
}

.beta-badge {
  display: inline-block;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  background: #F3F4F6;
  color: #6B7280;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-link {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 8px 0;
}

.nav-link:hover {
  color: #000000;
}

/* Community link - subtle differentiation with color + weight */
.nav-link-community {
  color: #1E3A8A;
  font-weight: 600;
}

.nav-link-community:hover {
  color: #1E40AF;
}

/* User Menu Container */
.user-menu-container {
  position: relative;
}

/* User Menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-menu:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #000000;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  border: 2px solid #000000;
}

.user-name {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
}

.dropdown-arrow {
  transition: transform 0.3s;
  color: #000000;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #000000;
  text-decoration: none;
  background: #FFFFFF;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #F8F8F8;
}

.dropdown-divider {
  height: 1px;
  background: #E5E5E5;
  margin: 4px 0;
}

.logout-item {
  color: #DC2626;
}

.logout-item:hover {
  background: #FEE2E2;
}

/* Dropdown Animation */
.dropdown-enter-active {
  transition: all 0.3s ease-out;
}

.dropdown-leave-active {
  transition: all 0.2s ease-in;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.sign-in-btn {
  padding: 10px 24px;
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #000000;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.sign-in-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sign-in-btn:active {
  transform: scale(0.98);
}

/* Mobile */
@media (max-width: 768px) {
  .nav-container {
    padding: 10px 16px;
    height: 48px;
  }

  .nav-links {
    position: static;
    transform: none;
    gap: 20px;
  }

  .nav-link {
    font-size: 13px;
  }

  .nav-logo {
    font-size: 15px;
    gap: 6px;
  }

  .beta-badge {
    font-size: 8px;
    padding: 2px 6px;
  }

  .sign-in-btn {
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>
