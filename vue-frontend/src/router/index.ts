import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import LandingPage from '../pages/LandingPage.vue'
import IndustrialLandingPage from '../views/IndustrialLandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import VerifyEmailPage from '../views/VerifyEmailPage.vue'
import ForgotPasswordPage from '../views/ForgotPasswordPage.vue'
import ResetPasswordPage from '../views/ResetPasswordPage.vue'
import WorkflowEditor from '../views/WorkflowEditor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/old-landing',
      name: 'old-landing',
      component: IndustrialLandingPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/verify-email',
      name: 'VerifyEmail',
      component: VerifyEmailPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: ForgotPasswordPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: ResetPasswordPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/workflow',
      name: 'WorkflowEditor',
      component: WorkflowEditor,
      meta: { requiresAuth: false }
    },
    {
      path: '/instructions',
      name: 'Instructions',
      component: () => import('../views/InstructionsPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/analyze/:postId',
      name: 'SinglePostAnalysis',
      component: () => import('../components/ResultsPanel/SinglePostAnalysisViewer.vue'),
      meta: { requiresAuth: false },
      props: true
    },
    {
      path: '/share-experiences',
      name: 'ShareExperiences',
      component: () => import('../pages/InterviewIntelPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../components/User/UserProfile.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('../pages/LeaderboardPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/trending',
      name: 'trending',
      component: () => import('../pages/TrendingExperiencesPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('../pages/PricingPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../pages/PrivacyPolicyPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('../pages/TermsOfServicePage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/security',
      name: 'security',
      component: () => import('../pages/SecurityPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/cookies',
      name: 'cookies',
      component: () => import('../pages/CookiePolicyPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/status',
      name: 'status',
      component: () => import('../pages/StatusPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('../pages/DocsPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: () => import('../pages/ChangelogPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue'),
      meta: { requiresAuth: false }
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('[Router] Route requires auth, redirecting to landing page')
    next({ name: 'landing' })
  } else {
    next()
  }
})

export default router
