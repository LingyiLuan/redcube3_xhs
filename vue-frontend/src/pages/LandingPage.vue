<template>
  <div class="landing-page">
    <LandingNav />
    <HeroSection />
    <AppDescriptionSection />
    <CarouselSection />
    <FeaturesGrid />
    <WorkflowBuilderSection />
    <LandingFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LandingNav from '@/components/Landing/LandingNav.vue'
import HeroSection from '@/components/Landing/HeroSection.vue'
import AppDescriptionSection from '@/components/Landing/AppDescriptionSection.vue'
import WorkflowBuilderSection from '@/components/Landing/WorkflowBuilderSection.vue'
import CarouselSection from '@/components/Landing/CarouselSection.vue'
import FeaturesGrid from '@/components/Landing/FeaturesGrid.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // Handle OAuth callback (legacy flow with query params)
  const authParam = route.query.auth
  const userParam = route.query.user

  if (authParam === 'success' && userParam) {
    try {
      const userData = JSON.parse(decodeURIComponent(userParam))
      console.log('[LandingPage] OAuth callback - user data:', userData)
      const token = 'google-auth-token-' + Date.now()
      authStore.handleGoogleCallback(token, userData)
      console.log('[LandingPage] After handleGoogleCallback - authStore.isAuthenticated:', authStore.isAuthenticated)
      console.log('[LandingPage] After handleGoogleCallback - authStore.user:', authStore.user)
      
      // Check for returnUrl in localStorage and redirect if present
      const returnUrl = localStorage.getItem('oauth_return_url')
      if (returnUrl) {
        localStorage.removeItem('oauth_return_url')
        router.replace(returnUrl)
        return
      }
      
      router.replace({ name: 'landing' })
    } catch (error) {
      console.error('[LandingPage] OAuth callback error:', error)
    }
  } else {
    console.log('[LandingPage] No OAuth callback params, checking auth status from localStorage')
  }

  // Check auth status
  await authStore.checkAuthStatus()
  console.log('[LandingPage] After checkAuthStatus - isAuthenticated:', authStore.isAuthenticated)
  
  // If user just logged in via OAuth and we have a returnUrl, redirect them
  // This handles the case where backend redirects to / but we want to go to /workflow
  if (authStore.isAuthenticated) {
    const returnUrl = localStorage.getItem('oauth_return_url')
    if (returnUrl && returnUrl !== '/') {
      console.log('[LandingPage] User authenticated, redirecting to returnUrl:', returnUrl)
      localStorage.removeItem('oauth_return_url')
      router.replace(returnUrl)
      return
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const targetId = this.getAttribute('href').substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    })
  })
})
</script>

<style scoped>
.landing-page {
  width: 100%;
  background: #FFFFFF;
  scroll-behavior: smooth;
  position: relative;
}

/* Lab Background Pattern - More visible */
.landing-page::before {
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
    /* Grid pattern - significantly more visible */
    linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Lab Background - Add more visible equipment outlines */
.landing-page::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000000' stroke-width='1.5'%3E%3Ccircle cx='180' cy='40' r='15'/%3E%3Cline x1='180' y1='55' x2='180' y2='80'/%3E%3Cline x1='170' y1='80' x2='190' y2='80'/%3E%3Crect x='20' y='150' width='25' height='40'/%3E%3Cline x1='32' y1='150' x2='32' y2='130'/%3E%3Ccircle cx='32' cy='125' r='5'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
  background-position: 0 0, 100px 100px;
}

/* Ensure content stays above background, but not the nav */
.landing-page > section {
  position: relative;
  z-index: 1;
}

/* Nav stays at highest z-index */
.landing-page > nav {
  z-index: 9999;
}

</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

/* Global CSS reset and base styles */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #FFFFFF;
  color: #000000;
}
</style>
