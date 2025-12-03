<template>
  <div class="dashboard-layout">
    <!-- Left Sidebar Navigation -->
    <aside class="sidebar">
      <!-- Home Button -->
      <button class="home-btn" @click="goHome" title="Go to home">
        <Home :size="20" />
      </button>
      
      <div class="sidebar-header">
        <h2>DASHBOARD</h2>
      </div>

      <nav class="sidebar-nav">
        <a href="#" @click.prevent="activePage = 'overview'" :class="['nav-item', { active: activePage === 'overview' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Overview</span>
        </a>

        <a href="#" @click.prevent="activePage = 'settings'" :class="['nav-item', { active: activePage === 'settings' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Settings</span>
        </a>

        <a href="#" @click.prevent="activePage = 'experiences'" :class="['nav-item', { active: activePage === 'experiences' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>My Experiences</span>
        </a>

        <a href="#" @click.prevent="activePage = 'learning-maps'" :class="['nav-item', { active: activePage === 'learning-maps' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <span>Learning Maps</span>
        </a>

        <a href="#" @click.prevent="activePage = 'saved'" :class="['nav-item', { active: activePage === 'saved' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Saved Items</span>
        </a>

        <div class="nav-divider"></div>

        <a href="#" @click.prevent="activePage = 'help'" :class="['nav-item', { active: activePage === 'help' }]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
          <span>Help</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>{{ error }}</p>
        <button @click="loadProfile" class="retry-btn">Retry</button>
      </div>

      <!-- Overview Page -->
      <div v-else-if="activePage === 'overview' && profile" class="page-container">
        <h1 class="page-title">Overview</h1>

        <div class="overview-grid">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <h2 class="welcome-title">Welcome back, {{ profile.displayName || profile.email }}</h2>
            <p class="welcome-subtitle">Here's your activity summary</p>
          </div>

          <!-- Usage Stats Card -->
          <div class="overview-card stats-card">
            <h4 class="card-title">ACCOUNT</h4>
            <div class="stat-row">
              <span class="stat-label">Current Plan</span>
              <span class="stat-value">{{ getPlanName() }}</span>
            </div>
            <div class="stat-row" v-if="usageStats">
              <span class="stat-label">Usage This Month</span>
              <span class="stat-value">{{ usageStats.currentUsage }}/{{ usageStats.limit === 'unlimited' ? '∞' : usageStats.limit }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Member Since</span>
              <span class="stat-value">{{ formatDate(profile.stats.memberSince) }}</span>
            </div>
          </div>

          <!-- Reputation & Tier Card -->
          <div class="overview-card reputation-card">
            <h4 class="card-title">REPUTATION & ACCESS</h4>

            <div class="tier-row">
              <div class="tier-badge">{{ profile.tier }}</div>
              <div class="tier-points">
                <span class="points-value">{{ reputationScore }}</span>
                <span class="points-label">points</span>
              </div>
            </div>

            <div v-if="nextTierInfo" class="tier-progress">
              <div class="progress-top">
                <span class="progress-label">Next: {{ nextTierInfo.name }}</span>
                <span class="progress-remaining">{{ pointsToNextTier }} pts to go</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: tierProgressPercent + '%' }"
                ></div>
              </div>
            </div>
            <div v-else class="tier-progress">
              <div class="progress-top">
                <span class="progress-label">Max tier unlocked</span>
                <span class="progress-remaining">Full access</span>
              </div>
            </div>

            <div class="tier-benefits">
              <div class="benefits-label">Benefits</div>
              <ul>
                <li v-for="benefit in currentTierBenefits" :key="benefit">
                  {{ benefit }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Activity Metrics -->
          <div class="overview-card metrics-card">
            <h4 class="card-title">YOUR CONTRIBUTIONS</h4>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">Experiences</div>
                <div class="metric-value">{{ profile.stats.experiencesShared }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Upvotes</div>
                <div class="metric-value">{{ profile.stats.totalUpvotesReceived }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Citations</div>
                <div class="metric-value">{{ profile.stats.totalCitationsReceived }}</div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="overview-card actions-card">
            <h4 class="card-title">QUICK ACTIONS</h4>
            <div class="action-buttons">
              <button class="quick-action-btn">
                <span class="action-arrow">→</span>
                <span>Run Analysis</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-arrow">→</span>
                <span>Create Learning Map</span>
              </button>
              <button class="quick-action-btn">
                <span class="action-arrow">→</span>
                <span>Share Experience</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Page (with tabs) -->
      <div v-else-if="activePage === 'settings' && profile" class="page-container">
        <h1 class="page-title">Settings</h1>

        <!-- Settings Tabs -->
        <div class="settings-tabs">
          <button @click="activeSettingsTab = 'profile'" :class="['tab-btn', { active: activeSettingsTab === 'profile' }]">
            Profile
          </button>
          <button @click="activeSettingsTab = 'account'" :class="['tab-btn', { active: activeSettingsTab === 'account' }]">
            Account
          </button>
          <button @click="activeSettingsTab = 'preferences'" :class="['tab-btn', { active: activeSettingsTab === 'preferences' }]">
            Preferences
          </button>
          <button @click="activeSettingsTab = 'billing'" :class="['tab-btn', { active: activeSettingsTab === 'billing' }]">
            Billing
          </button>
        </div>

        <div class="settings-container">
          <!-- Profile Tab -->
          <div v-if="activeSettingsTab === 'profile'">
            <h2 class="section-header">PROFILE INFORMATION</h2>

            <!-- Error message -->
            <div v-if="profileError" class="profile-error">
              {{ profileError }}
            </div>

            <!-- Email (read-only for now) -->
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Email</div>
                <div class="setting-value">{{ profile.email }}</div>
              </div>
            </div>

            <!-- Display Name with inline editing -->
            <div class="setting-row">
              <div class="setting-info full-width">
                <div class="setting-label">Display Name</div>
                <div v-if="!editingDisplayName" class="setting-value">
                  {{ profile.displayName || 'Not set' }}
                </div>
                <div v-else class="edit-field">
                  <input
                    v-model="newDisplayName"
                    type="text"
                    class="edit-input"
                    placeholder="Enter display name"
                    @keyup.enter="saveDisplayName"
                    @keyup.esc="cancelEditDisplayName"
                  />
                  <div class="edit-actions">
                    <button @click="saveDisplayName" class="action-btn action-btn-primary" :disabled="savingProfile">
                      {{ savingProfile ? 'Saving...' : 'Save' }}
                    </button>
                    <button @click="cancelEditDisplayName" class="action-btn" :disabled="savingProfile">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              <button v-if="!editingDisplayName" @click="startEditingDisplayName" class="action-btn">
                Edit
              </button>
            </div>

            <!-- LinkedIn OAuth Connection -->
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">LinkedIn</div>
                <div class="setting-value">
                  <span v-if="profile.linkedinUrl" class="status-verified">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Connected
                  </span>
                  <span v-else class="status-unverified">Not connected</span>
                </div>
              </div>
              <button
                v-if="!profile.linkedinUrl"
                @click="connectLinkedIn"
                class="action-btn action-btn-linkedin"
              >
                Connect LinkedIn
              </button>
              <button
                v-else
                @click="disconnectLinkedIn"
                class="action-btn"
              >
                Disconnect
              </button>
            </div>
          </div>

          <!-- Account Tab -->
          <div v-else-if="activeSettingsTab === 'account'">
            <h2 class="section-header">ACCOUNT STATUS</h2>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Plan</div>
                <div class="setting-value">
                  {{ getPlanName() }}
                  <span v-if="usageStats && usageStats.limit !== 'unlimited'" class="plan-detail">
                    ({{ usageStats.limit }} analyses/month)
                  </span>
                </div>
              </div>
              <button v-if="profile.tier === 'Bronze' || profile.tier === 'Silver'" @click="handleUpgrade" class="action-btn action-btn-primary">
                Upgrade
              </button>
            </div>

            <div class="setting-row" v-if="usageStats">
              <div class="setting-info full-width">
                <div class="setting-label">Usage This Month</div>
                <div class="usage-display">
                  <div class="usage-progress-bar">
                    <div
                      class="usage-progress-fill"
                      :style="{ width: getUsagePercent() + '%' }"
                    ></div>
                  </div>
                  <div class="usage-text">
                    {{ usageStats.currentUsage }}/{{ usageStats.limit === 'unlimited' ? '∞' : usageStats.limit }} analyses
                    <span v-if="usageStats.remaining !== 'unlimited'" class="remaining-text">
                      ({{ usageStats.remaining }} remaining)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Account Deletion Warning -->
            <div v-if="profile?.deletionScheduledAt" class="deletion-warning-banner">
              <div class="warning-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div class="warning-content">
                <h3 class="warning-title">Account Deletion Scheduled</h3>
                <p class="warning-text">
                  Your account will be permanently deleted on <strong>{{ formatDate(profile.deletionScheduledAt) }}</strong>.
                  You can cancel this at any time before then.
                </p>
              </div>
              <button
                @click="handleCancelDeletion"
                class="btn-cancel-deletion"
                :disabled="cancelingDeletion"
              >
                {{ cancelingDeletion ? 'Canceling...' : 'Cancel Deletion' }}
              </button>
            </div>

            <h2 class="section-header">SECURITY</h2>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Email Verification</div>
                <div class="setting-value">
                  <span v-if="profile.verificationStatus.emailVerified" class="status-verified">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Verified
                  </span>
                  <span v-else class="status-unverified">Not verified</span>
                </div>
              </div>
              <button
                v-if="!profile.verificationStatus.emailVerified"
                @click="handleSendVerificationEmail"
                class="action-btn"
                :disabled="sendingVerification"
              >
                {{ sendingVerification ? 'Sending...' : 'Verify' }}
              </button>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Password</div>
                <div class="setting-value">••••••••</div>
              </div>
              <button
                @click="handlePasswordChange"
                class="action-btn"
                :disabled="sendingPasswordReset"
              >
                {{ sendingPasswordReset ? 'Sending...' : 'Change' }}
              </button>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Member Since</div>
                <div class="setting-value">{{ formatDate(profile.stats.memberSince) }}</div>
              </div>
            </div>

            <h2 class="section-header danger-header">DANGER ZONE</h2>

            <div class="setting-row danger-row">
              <div class="setting-info">
                <div class="setting-label">Delete Account</div>
                <div class="setting-value danger-description">
                  Permanently delete your account and all associated data
                </div>
              </div>
              <button @click="handleDeleteAccount" class="action-btn action-btn-danger">
                Delete Account
              </button>
            </div>
          </div>

          <!-- Preferences Tab -->
          <div v-else-if="activeSettingsTab === 'preferences'">
            <h2 class="section-header">INSIGHTS & UPDATES</h2>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">
                  Weekly Career Insights Digest
                  <span class="coming-soon-badge">Coming Soon</span>
                </div>
                <div class="setting-value">
                  Get a weekly summary of trending skills, top companies hiring, and personalized learning recommendations based on your career goals
                </div>
              </div>
              <label class="toggle-switch disabled">
                <input
                  type="checkbox"
                  :checked="false"
                  disabled
                >
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="preferences-note">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>We're building intelligent career insights powered by real job market data. Stay tuned!</span>
            </div>
          </div>

          <!-- Billing Tab -->
          <div v-else-if="activeSettingsTab === 'billing'">
            <!-- Beta Access Banner -->
            <div class="beta-access-banner">
              <h2 class="beta-access-title">EARLY ACCESS BETA</h2>
              <p class="beta-access-subtitle">You're part of the first 500 users building the future of interview prep.</p>
              
              <div class="beta-divider"></div>
              
              <h3 class="beta-benefits-title">Your benefits:</h3>
              <ul class="beta-benefits-list">
                <li>Free access through December 2025</li>
                <li>Unlimited features during beta</li>
                <li>Priority feature requests</li>
                <li>Founding member community access</li>
              </ul>
              
              <div class="beta-divider"></div>
            </div>

            <!-- Current Subscription -->
            <h2 class="section-header">YOUR SUBSCRIPTION</h2>
            <SubscriptionCard
              :subscription="subscriptionData"
              @upgrade="handleChangePlan"
              @change-plan="handleChangePlan"
              @update-payment="handleUpdatePayment"
              @view-invoices="handleViewInvoices"
              @cancel="showCancelModal = true"
              @reactivate="handleReactivateSubscription"
              @resubscribe="handleChangePlan('pro')"
            />
          </div>
        </div>
      </div>

      <!-- My Experiences Page -->
      <div v-else-if="activePage === 'experiences'" class="page-container">
        <h1 class="page-title">My Experiences</h1>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>No Experiences Yet</h3>
          <p>You haven't shared any interview experiences. Help others by sharing your story!</p>
          <button class="action-btn action-btn-primary">Share Experience</button>
        </div>
      </div>

      <!-- Learning Maps Page -->
      <div v-else-if="activePage === 'learning-maps'" class="page-container">
        <h1 class="page-title">Learning Maps</h1>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <h3>No Learning Maps</h3>
          <p>Create your first personalized learning map to start your interview prep journey!</p>
          <button class="action-btn action-btn-primary">Create Learning Map</button>
        </div>
      </div>

      <!-- Saved Items Page -->
      <div v-else-if="activePage === 'saved'" class="page-container">
        <h1 class="page-title">Saved Items</h1>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No Saved Items</h3>
          <p>Save helpful content to reference later!</p>
        </div>
      </div>

      <!-- Help Page -->
      <div v-else-if="activePage === 'help'" class="page-container">
        <h1 class="page-title">Help & Support</h1>
        <div class="help-content">
          <div class="help-section">
            <h3>Getting Started</h3>
            <ul class="help-links">
              <li><a href="#">How to Run Analysis</a></li>
              <li><a href="#">How to Create Learning Maps</a></li>
              <li><a href="#">How to Share Experiences</a></li>
              <li><a href="#">Understanding Your Tier</a></li>
            </ul>
          </div>

          <div class="help-section">
            <h3>Frequently Asked Questions</h3>
            <ul class="help-links">
              <li><a href="#">What are the tier limits?</a></li>
              <li><a href="#">How do I upgrade my plan?</a></li>
              <li><a href="#">What data is collected?</a></li>
              <li><a href="#">How do I delete my account?</a></li>
            </ul>
          </div>

          <div class="help-section">
            <h3>Contact Support</h3>
            <p>Need more help? Contact our support team.</p>
            <button class="action-btn action-btn-primary">Contact Support</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Account Modal -->
    <DeleteAccountModal
      :is-open="showDeleteAccountModal"
      :user-email="profile?.email || ''"
      @close="handleCloseDeleteModal"
      @delete="handleDeleteAccountConfirm"
    />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import SubscriptionCard from '@/components/Billing/SubscriptionCard.vue'
import UsageProgressBar from '@/components/Billing/UsageProgressBar.vue'
import UpgradeModal from '@/components/Billing/UpgradeModal.vue'
import DeleteAccountModal from '@/components/User/DeleteAccountModal.vue'

const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()
const router = useRouter()

const profile = ref<any>(null)
const usageStats = ref<any>(null)
const loading = ref(true)
const error = ref('')

// Navigation state
const activePage = ref('settings')  // Default to settings page
const activeSettingsTab = ref('profile')  // Default to profile tab within settings

// Edit state
const editingDisplayName = ref(false)
const newDisplayName = ref('')
const savingProfile = ref(false)
const profileError = ref('')

// Account security state
const sendingVerification = ref(false)
const sendingPasswordReset = ref(false)
const showDeleteAccountModal = ref(false)
const cancelingDeletion = ref(false)

// Billing/Subscription state
const subscriptionData = ref<any>(null)
const learningMapsUsed = ref(0)
const showUpgradeModal = ref(false)
const showCancelModal = ref(false)
const upgradeModalType = ref<'limit_reached' | 'usage_warning' | 'feature_gate' | 'general'>('general')
const upgradeResourceType = ref('')

const tierThresholds: Record<string, { name: string; min: number; next: number | null; benefits: string[] }> = {
  Bronze: {
    name: 'Bronze',
    min: 0,
    next: 50,
    benefits: ['5 analyses / month', 'Community access', 'Share interview experiences']
  },
  Silver: {
    name: 'Silver',
    min: 50,
    next: 200,
    benefits: ['15 analyses / month', 'Learning Map generation', 'Priority analysis queue']
  },
  Gold: {
    name: 'Gold',
    min: 200,
    next: 500,
    benefits: ['Unlimited analyses', 'Workflow Lab automations', 'Priority product support']
  },
  Platinum: {
    name: 'Platinum',
    min: 500,
    next: null,
    benefits: ['Unlimited access', 'Early feature access', 'Private contributor briefings']
  }
}

const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']

const reputationScore = computed(() => profile.value?.reputationScore || 0)

const currentTierInfo = computed(() => tierThresholds[profile.value?.tier] || tierThresholds['Bronze'])

const nextTierInfo = computed(() => {
  const tier = profile.value?.tier || 'Bronze'
  const index = tierOrder.indexOf(tier)
  if (index === -1 || index === tierOrder.length - 1) return null
  const nextTierName = tierOrder[index + 1]
  return tierThresholds[nextTierName]
})

const pointsToNextTier = computed(() => {
  if (!profile.value) return null
  const next = nextTierInfo.value
  if (!next || next.min === undefined || next.min === null) return null
  return Math.max(next.min - reputationScore.value, 0)
})

const tierProgressPercent = computed(() => {
  if (!profile.value) return 0
  const tier = currentTierInfo.value
  const next = nextTierInfo.value
  if (!next) return 100
  const range = next.min - tier.min
  if (range <= 0) return 100
  return Math.min(((reputationScore.value - tier.min) / range) * 100, 100)
})

const currentTierBenefits = computed(() => currentTierInfo.value.benefits || [])

// API Gateway URL
const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'

// Navigation
function goHome() {
  router.push('/')
}

async function loadProfile() {
  loading.value = true
  error.value = ''

  try {
    // First, get authenticated user from user-service
    const authResponse = await fetch(`${apiGatewayUrl}/api/auth/me`, {
      credentials: 'include'  // Include session cookies
    })

    if (!authResponse.ok) {
      throw new Error('Not authenticated - please log in with Google')
    }

    const authData = await authResponse.json()
    const authenticatedUser = authData.user
    const userId = authenticatedUser.id

    // Then get reputation/usage data from content-service
    const [reputationResponse, usageResponse] = await Promise.all([
      fetch(`${apiGatewayUrl}/api/content/reputation/profile/${userId}`),
      fetch(`${apiGatewayUrl}/api/content/reputation/usage/${userId}`)
    ])

    // Merge auth data (from user-service) with reputation data (from content-service)
    const reputationData = reputationResponse.ok ? (await reputationResponse.json()).data : {}

    profile.value = {
      // Auth data from user-service (real Google login)
      email: authenticatedUser.email,
      displayName: authenticatedUser.display_name,
      avatarUrl: authenticatedUser.avatar_url,
      linkedinUrl: authenticatedUser.linkedin_url,
      createdAt: authenticatedUser.created_at,
      deletionScheduledAt: authenticatedUser.deletion_scheduled_at || null,
      // Reputation data from content-service
      tier: reputationData.tier || 'Bronze',
      reputationScore: reputationData.reputation_score || 0,
      contributionCount: reputationData.contribution_count || 0,
      // Verification status
      verificationStatus: {
        emailVerified: authenticatedUser.email_verified || false
      },
      // Stats
      stats: {
        memberSince: authenticatedUser.created_at,
        experiencesShared: reputationData.contribution_count || 0,
        totalUpvotesReceived: 0,
        totalCitationsReceived: 0
      }
    }

    if (usageResponse.ok) {
      const usageData = await usageResponse.json()
      usageStats.value = usageData.data
    }

    console.log('[UserProfile] Loaded authenticated user:', profile.value)
    console.log('[UserProfile] Usage stats:', usageStats.value)
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile'
    console.error('[UserProfile] Error loading profile:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getPlanName() {
  // During beta, all users are Founding Members
  return 'Founding Member (Beta)'

  // Original tier mapping (will be restored after beta)
  /*
  if (!profile.value) return 'Free'

  const tierMap: Record<string, string> = {
    'Bronze': 'Free',
    'bronze': 'Free',
    'Silver': 'Starter',
    'silver': 'Starter',
    'Gold': 'Pro',
    'gold': 'Pro',
    'Platinum': 'Enterprise',
    'platinum': 'Enterprise',
    'free': 'Free',
    'pro': 'Pro',
    'premium': 'Premium'
  }

  return tierMap[profile.value.tier] || profile.value.tier
  */
}

function getUsagePercent() {
  if (!usageStats.value) return 0
  if (usageStats.value.limit === 'unlimited') return 0

  const current = usageStats.value.currentUsage || 0
  const limit = usageStats.value.limit || 1

  return Math.min((current / limit) * 100, 100)
}

function handleUpgrade() {
  console.log('[UserProfile] Upgrade requested')
  alert('Upgrade to Pro for unlimited analyses and advanced features.')
}

function connectLinkedIn() {
  // Redirect to LinkedIn OAuth flow
  window.location.href = `${apiGatewayUrl}/auth/linkedin`
}

async function disconnectLinkedIn() {
  if (!confirm('Are you sure you want to disconnect your LinkedIn account?')) {
    return
  }

  try {
    const response = await fetch(`${apiGatewayUrl}/api/auth/linkedin/disconnect`, {
      method: 'POST',
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to disconnect LinkedIn')
    }

    // Update local profile
    if (profile.value) {
      profile.value.linkedinUrl = null
    }

    console.log('[UserProfile] LinkedIn disconnected successfully')
  } catch (err: any) {
    profileError.value = err.message || 'Failed to disconnect LinkedIn'
    console.error('[UserProfile] Error disconnecting LinkedIn:', err)
  }
}

async function handleSendVerificationEmail() {
  if (!profile.value?.email) {
    alert('Email address not found')
    return
  }

  try {
    sendingVerification.value = true

    const response = await fetch(`${apiGatewayUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: profile.value.email
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send verification email')
    }

    alert(`Verification email sent to ${profile.value.email}. Please check your inbox.`)
    console.log('[UserProfile] Verification email sent successfully')
  } catch (err: any) {
    console.error('[UserProfile] Error sending verification email:', err)
    alert(err.message || 'Failed to send verification email. Please try again.')
  } finally {
    sendingVerification.value = false
  }
}

async function handlePasswordChange() {
  if (!profile.value?.email) {
    alert('Email address not found')
    return
  }

  try {
    sendingPasswordReset.value = true

    const response = await fetch(`${apiGatewayUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: profile.value.email
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send password reset email')
    }

    alert(`Password reset email sent to ${profile.value.email}. Please check your inbox.`)
    console.log('[UserProfile] Password reset email sent successfully')
  } catch (err: any) {
    console.error('[UserProfile] Error sending password reset:', err)
    alert(err.message || 'Failed to send password reset email. Please try again.')
  } finally {
    sendingPasswordReset.value = false
  }
}

function handleDeleteAccount() {
  showDeleteAccountModal.value = true
}

async function handleDeleteAccountConfirm(reason: string) {
  try {
    const response = await fetch(`${apiGatewayUrl}/api/auth/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        reason: reason || undefined
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete account')
    }

    console.log('[UserProfile] Account deletion scheduled successfully')
    // Modal will show success step automatically
  } catch (err: any) {
    console.error('[UserProfile] Error deleting account:', err)
    showDeleteAccountModal.value = false
    alert(err.message || 'Failed to delete account. Please try again.')
  }
}

function handleCloseDeleteModal() {
  showDeleteAccountModal.value = false
}

async function handleCancelDeletion() {
  if (!confirm('Are you sure you want to cancel the account deletion? Your account will remain active.')) {
    return
  }

  try {
    cancelingDeletion.value = true

    const response = await fetch(`${apiGatewayUrl}/api/auth/cancel-deletion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel account deletion')
    }

    // Update local profile state to remove deletion timestamp
    if (profile.value) {
      profile.value.deletionScheduledAt = null
    }

    alert('Account deletion cancelled successfully! Your account will remain active.')
    console.log('[UserProfile] Account deletion cancelled successfully')
  } catch (err: any) {
    console.error('[UserProfile] Error canceling account deletion:', err)
    alert(err.message || 'Failed to cancel account deletion. Please try again.')
  } finally {
    cancelingDeletion.value = false
  }
}

// Profile editing functions
function startEditingDisplayName() {
  newDisplayName.value = profile.value?.displayName || ''
  editingDisplayName.value = true
  profileError.value = ''
}

function cancelEditDisplayName() {
  editingDisplayName.value = false
  newDisplayName.value = ''
  profileError.value = ''
}

async function saveDisplayName() {
  if (!newDisplayName.value || newDisplayName.value.trim().length < 2) {
    profileError.value = 'Display name must be at least 2 characters'
    return
  }

  savingProfile.value = true
  profileError.value = ''

  try {
    const userId = authStore.user?.id || 1

    const response = await fetch(`${apiGatewayUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        display_name: newDisplayName.value.trim()
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.details?.join(', ') || data.error || 'Failed to update display name')
    }

    // Update local profile data
    if (profile.value) {
      profile.value.displayName = data.user.display_name
    }
    editingDisplayName.value = false
    newDisplayName.value = ''

    console.log('[UserProfile] Display name updated successfully')
  } catch (err: any) {
    profileError.value = err.message || 'Failed to update display name'
    console.error('[UserProfile] Error updating display name:', err)
  } finally {
    savingProfile.value = false
  }
}

// Billing helper functions
function getUsageLimit(type: 'analyses' | 'learning_maps'): number | null {
  if (!subscriptionData.value) {
    // Free tier limits
    return type === 'analyses' ? 5 : 2
  }

  const tier = subscriptionData.value.tier

  if (tier === 'premium') {
    return null // Unlimited
  }

  if (tier === 'pro') {
    return type === 'analyses' ? 15 : 10
  }

  // Free tier
  return type === 'analyses' ? 5 : 2
}

function getResetDate(): string {
  // Calculate next month's first day
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString()
}

function getCurrentTierForModal(): 'free' | 'pro' | 'premium' {
  if (!subscriptionData.value) return 'free'
  return subscriptionData.value.tier as 'free' | 'pro' | 'premium'
}

function getRecommendedTier(): 'pro' | 'premium' {
  const currentTier = getCurrentTierForModal()

  if (currentTier === 'free') return 'pro'
  if (currentTier === 'pro') return 'premium'
  return 'premium'
}

function getNextBillingDate(): string {
  if (!subscriptionData.value || !subscriptionData.value.current_period_end) {
    return 'N/A'
  }

  return new Date(subscriptionData.value.current_period_end).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Billing action handlers
function handleChangePlan(tier: string) {
  console.log('[UserProfile] Change plan to:', tier)
  window.location.href = '/pricing'
}

function handleUpdatePayment() {
  console.log('[UserProfile] Update payment method')
  subscriptionStore.updatePaymentMethod()
    .catch(err => {
      profileError.value = 'Failed to update payment method'
      console.error(err)
    })
}

function handleViewInvoices() {
  console.log('[UserProfile] View invoices')
  // TODO: Navigate to invoices page or open Lemon Squeezy customer portal
  alert('Invoice history feature coming soon!')
}

async function confirmCancelSubscription() {
  try {
    await subscriptionStore.cancelSubscription()
    showCancelModal.value = false

    // Reload subscription data
    if (subscriptionData.value) {
      subscriptionData.value.cancel_at_period_end = true
    }

    console.log('[UserProfile] Subscription cancelled successfully')
  } catch (err: any) {
    profileError.value = err.message || 'Failed to cancel subscription'
    console.error('[UserProfile] Error cancelling subscription:', err)
  }
}

async function handleReactivateSubscription() {
  try {
    await subscriptionStore.reactivateSubscription()

    // Reload subscription data
    if (subscriptionData.value) {
      subscriptionData.value.cancel_at_period_end = false
    }

    console.log('[UserProfile] Subscription reactivated successfully')
  } catch (err: any) {
    profileError.value = err.message || 'Failed to reactivate subscription'
    console.error('[UserProfile] Error reactivating subscription:', err)
  }
}

function handleUpgradeFromModal(tier: string) {
  showUpgradeModal.value = false
  window.location.href = '/pricing'
}

// Preferences functions removed - Coming Soon feature only
onMounted(() => {
  loadProfile()

  // Load subscription data from store
  subscriptionStore.fetchAll().then(() => {
    subscriptionData.value = subscriptionStore.subscription

    // Get learning maps usage (mock for now)
    learningMapsUsed.value = 0 // TODO: Get from API
  })
})
</script>

<style scoped>
/* Deletion Warning Banner */
.deletion-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  margin-bottom: 32px;
}

.warning-icon {
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 4px;
}

.warning-text {
  font-size: 14px;
  color: #7f1d1d;
  line-height: 1.5;
  margin: 0;
}

.warning-text strong {
  font-weight: 600;
}

.btn-cancel-deletion {
  padding: 10px 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-cancel-deletion:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-cancel-deletion:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dashboard Layout */
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: white;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #F8FAFC;
  border-right: 1px solid #E2E8F0;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
}

/* Home Button */
.home-btn {
  width: 36px;
  height: 36px;
  margin: 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748B;
  transition: all 0.2s ease;
}

.home-btn:hover {
  background: #E2E8F0;
  color: #1E293B;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #E2E8F0;
}

.sidebar-header h2 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #64748B;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: #475569;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: #E2E8F0;
  color: #1E293B;
}

.nav-item.active {
  background: #1E3A8A;
  color: white;
}

.nav-item svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.nav-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 12px 0;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  justify-content: center;
  padding: 40px;
  background: white;
  min-height: 100vh;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #64748B;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #DC2626;
  text-align: center;
}

.error-state svg {
  color: #DC2626;
}

.retry-btn {
  padding: 10px 20px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #1E40AF;
}

/* Page Container - INCREASED WIDTH */
.page-container {
  width: 100%;
  max-width: 900px;  /* Increased from 600px to 900px */
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 32px;
}

/* Settings Tabs */
.settings-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 32px;
}

.tab-btn {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748B;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: #3B82F6;
}

.tab-btn.active {
  color: #3B82F6;
  border-bottom-color: #3B82F6;
}

/* Settings Container */
.settings-container {
  width: 100%;
  max-width: 900px;  /* Increased from 600px to 900px */
}

/* Section Header */
.section-header {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #1E3A8A;
  margin-top: 32px;
  margin-bottom: 8px;
}

.section-header:first-child {
  margin-top: 0;
}

.danger-header {
  color: #DC2626;
}

/* Setting Row - Horizontal line separator */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #E5E7EB;
}

.setting-row:last-of-type {
  border-bottom: none;
}

.danger-row {
  border-bottom: 1px solid #FEE2E2;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.setting-info.full-width {
  width: 100%;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.setting-value {
  font-size: 14px;
  color: #6B7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-detail {
  color: #9CA3AF;
  font-size: 13px;
}

.danger-description {
  color: #991B1B;
  font-size: 13px;
}

/* Action Buttons */
.action-btn {
  padding: 6px 16px;
  background: white;
  color: #1E3A8A;
  border: 1px solid #1E3A8A;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: #1E3A8A;
  color: white;
}

.action-btn.action-btn-primary {
  background: #3B82F6;
  color: white;
}

.action-btn.action-btn-primary:hover {
  background: #2563EB;
  border-color: #2563EB;
}

.action-btn.action-btn-linkedin {
  color: #0077B5;
  border-color: #0077B5;
}

.action-btn.action-btn-linkedin:hover {
  background: #0077B5;
  color: white;
}

.action-btn.action-btn-danger {
  color: #DC2626;
  border-color: #DC2626;
}

.action-btn.action-btn-danger:hover {
  background: #DC2626;
  color: white;
}

/* Usage Progress Bar */
.usage-display {
  margin-top: 12px;
  width: 100%;
}

.usage-progress-bar {
  width: 100%;
  height: 8px;
  background: #E5E7EB;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 13px;
  color: #6B7280;
}

.remaining-text {
  color: #64748B;
  font-weight: 600;
}

/* Status Indicators */
.status-verified {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10B981;
  font-weight: 500;
}

.status-verified svg {
  width: 16px;
  height: 16px;
}

.status-unverified {
  color: #94A3B8;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #CBD5E1;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background: #3B82F6;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* Disabled toggle */
.toggle-switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-switch.disabled .toggle-slider {
  cursor: not-allowed;
  background: #E5E7EB;
}

/* Coming Soon Badge */
.coming-soon-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #3B82F6;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 4px;
  vertical-align: middle;
}

/* Preferences Note */
.preferences-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  background: #F0F9FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
}

.preferences-note svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #3B82F6;
}

.preferences-note span {
  font-size: 14px;
  line-height: 1.5;
  color: #1E40AF;
}

/* Beta Access Banner (above billing) */
.beta-access-banner {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
}

.beta-access-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #000000;
  margin: 0 0 12px 0;
}

.beta-access-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #666666;
  margin: 0 0 24px 0;
}

.beta-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 24px 0;
}

.beta-benefits-title {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 12px 0;
}

.beta-benefits-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.beta-benefits-list li {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333333;
  padding-left: 20px;
  position: relative;
}

.beta-benefits-list li::before {
  content: '−';
  position: absolute;
  left: 0;
  color: #000000;
  font-weight: 400;
}

/* Founding Member Section */
/* Beta Access Section - Professional Style */
.beta-access-section {
  max-width: 700px;
  margin: 0 auto;
}

.beta-header {
  margin-bottom: 32px;
}

.beta-status {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #1E3A8A;
  margin-bottom: 16px;
}

.beta-title {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #000000;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.beta-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0;
  line-height: 1.5;
}

.beta-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 32px 0;
}

.beta-benefits {
  margin-bottom: 32px;
}

.benefits-heading {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin: 0 0 16px 0;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #333333;
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.benefits-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #000000;
  font-weight: 700;
}

.beta-footer {
  margin-top: 32px;
}

.beta-footer p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #666666;
  margin: 0;
}

/* Select Input */
.select-input {
  padding: 6px 32px 6px 12px;
  border: 1px solid #1E3A8A;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #1E3A8A;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-input:hover {
  background: #1E3A8A;
  color: white;
}

/* Overview Page */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.overview-card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.2s ease;
}

.overview-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.reputation-card .tier-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tier-badge {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 6px 12px;
  border: 1px solid #1E293B;
  text-transform: uppercase;
  color: #1E293B;
}

.tier-points {
  text-align: right;
}

.points-value {
  font-size: 28px;
  font-weight: 700;
  color: #0F172A;
  line-height: 1;
}

.points-label {
  display: block;
  font-size: 12px;
  color: #64748B;
}

.tier-progress {
  margin-bottom: 16px;
}

.progress-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #475569;
  margin-bottom: 6px;
}

.progress-bar {
  height: 6px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #111827;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.tier-benefits {
  border-top: 1px solid #E2E8F0;
  padding-top: 12px;
}

.benefits-label {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.tier-benefits ul {
  margin: 0;
  padding-left: 16px;
  color: #1F2937;
  font-size: 13px;
  line-height: 1.6;
}

.welcome-section {
  grid-column: 1 / -1;
  margin-bottom: 8px;
}

.welcome-title {
  font-size: 20px;
  font-weight: 600;
  color: #1E3A8A;
  margin-bottom: 4px;
}

.welcome-subtitle {
  font-size: 14px;
  color: #64748B;
}

.stats-card .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #E2E8F0;
}

.stats-card .stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 13px;
  color: #64748B;
}

.stat-value {
  font-size: 13px;
  font-weight: 500;
  color: #1E293B;
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  color: #1E3A8A;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-grid {
  display: flex;
  flex-direction: column;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid #E2E8F0;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 13px;
  color: #64748B;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid #E2E8F0;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.quick-action-btn:last-child {
  border-bottom: none;
}

.quick-action-btn:hover {
  color: #1E3A8A;
}

.quick-action-btn:hover .action-arrow {
  color: #1E3A8A;
  transform: translateX(4px);
}

.action-arrow {
  color: #64748B;
  font-size: 16px;
  transition: all 0.2s ease;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.empty-state svg {
  color: #CBD5E1;
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 24px;
}

/* Help Page */
.help-content {
  display: grid;
  gap: 32px;
}

.help-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 16px;
}

.help-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-links li {
  margin-bottom: 12px;
}

.help-links a {
  color: #3B82F6;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.help-links a:hover {
  color: #2563EB;
  text-decoration: underline;
}

/* Profile Editing Styles */
.profile-error {
  padding: 12px 16px;
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  border-radius: 6px;
  color: #991B1B;
  font-size: 14px;
  margin-bottom: 16px;
}

.edit-field {
  width: 100%;
  margin-top: 8px;
}

.edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.linkedin-link {
  color: #0077B5;
  text-decoration: none;
  font-weight: 500;
}

.linkedin-link:hover {
  text-decoration: underline;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #E2E8F0;
  }

  .main-content {
    margin-left: 0;
    padding: 24px 16px;
  }

  .page-container {
    max-width: 100%;
  }

  .settings-container {
    max-width: 100%;
  }

  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .action-btn {
    align-self: flex-start;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .settings-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab-btn {
    white-space: nowrap;
  }
}

/* Billing Tab Enhancements */
.usage-section {
  margin-top: 24px;
}

.billing-history-section {
  margin-top: 24px;
}

.billing-history-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 24px;
}

.empty-state-billing {
  text-align: center;
  padding: 20px;
}

.empty-state-billing p {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}

/* Cancel Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.cancel-modal {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.cancel-modal h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 16px;
}

.cancel-modal p {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin-bottom: 24px;
}

.cancel-modal-actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.cancel-modal-actions button {
  width: 100%;
}
</style>
