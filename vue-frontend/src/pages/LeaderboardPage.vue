<template>
  <div class="leaderboard-page">
    <div class="leaderboard-header">
      <h1>Reputation Leaderboard</h1>
      <p class="subtitle">Top contributors to the Interview Intel community</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading leaderboard...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
      <button @click="loadLeaderboard" class="retry-btn">Retry</button>
    </div>

    <div v-else class="leaderboard-content">
      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          :class="['filter-tab', { active: selectedPeriod === 'all-time' }]"
          @click="selectedPeriod = 'all-time'"
        >
          All Time
        </button>
        <button
          :class="['filter-tab', { active: selectedPeriod === 'monthly' }]"
          @click="selectedPeriod = 'monthly'"
        >
          This Month
        </button>
      </div>

      <!-- Your Rank Card (if user is logged in) -->
      <div v-if="currentUserRank" class="your-rank-card">
        <div class="rank-badge">
          <span class="rank-label">Your Rank</span>
          <span class="rank-number">#{{ currentUserRank.rank }}</span>
        </div>
        <div class="rank-details">
          <div class="user-info">
            <div class="avatar-small">
              {{ getUserInitials(currentUserRank.email) }}
            </div>
            <div>
              <div class="user-name">{{ currentUserRank.email }}</div>
              <ReputationBadge :tier="currentUserRank.tier" size="small" />
            </div>
          </div>
          <div class="points-display">
            <span class="points-value">{{ currentUserRank.reputationPoints }}</span>
            <span class="points-label">points</span>
          </div>
        </div>
      </div>

      <!-- Top 3 Podium -->
      <div v-if="topThree.length > 0" class="podium">
        <div v-for="(user, index) in topThree" :key="user.id" :class="['podium-place', `place-${index + 1}`]">
          <div class="podium-medal">
            <svg v-if="index === 0" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            <svg v-else-if="index === 1" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M8.5 14A6.5 6.5 0 0 0 2 20.5V22h20v-1.5A6.5 6.5 0 0 0 15.5 14"/>
              <path d="M12 2v6"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="avatar-medium">
            {{ getUserInitials(user.email) }}
          </div>
          <div class="podium-name">{{ user.email }}</div>
          <ReputationBadge :tier="user.tier" size="medium" />
          <div class="podium-points">
            <span class="points-number">{{ user.reputationPoints }}</span>
            <span class="points-text">points</span>
          </div>
          <div class="podium-stats">
            <div class="stat-item">
              <span class="stat-value">{{ user.stats?.experiencesShared || 0 }}</span>
              <span class="stat-label">Experiences</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ user.stats?.totalUpvotesReceived || 0 }}</span>
              <span class="stat-label">Upvotes</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rest of Leaderboard Table -->
      <div class="leaderboard-table">
        <div class="table-header">
          <span class="col-rank">Rank</span>
          <span class="col-user">User</span>
          <span class="col-tier">Tier</span>
          <span class="col-experiences">Experiences</span>
          <span class="col-upvotes">Upvotes</span>
          <span class="col-points">Points</span>
        </div>

        <div
          v-for="(user, index) in remainingUsers"
          :key="user.id"
          :class="['table-row', { highlight: user.isCurrentUser }]"
        >
          <div class="col-rank">
            <span class="rank-display">#{{ index + 4 }}</span>
          </div>
          <div class="col-user">
            <div class="avatar-tiny">
              {{ getUserInitials(user.email) }}
            </div>
            <span class="user-email">{{ user.email }}</span>
          </div>
          <div class="col-tier">
            <ReputationBadge :tier="user.tier" size="tiny" />
          </div>
          <div class="col-experiences">
            {{ user.stats?.experiencesShared || 0 }}
          </div>
          <div class="col-upvotes">
            {{ user.stats?.totalUpvotesReceived || 0 }}
          </div>
          <div class="col-points">
            <span class="points-badge">{{ user.reputationPoints }}</span>
          </div>
        </div>
      </div>

      <div v-if="leaderboard.length === 0" class="empty-state">
        <p>No users found on the leaderboard yet. Be the first to contribute!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import ReputationBadge from '@/components/User/ReputationBadge.vue'

const authStore = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)
const leaderboard = ref<any[]>([])
const selectedPeriod = ref<'all-time' | 'monthly'>('all-time')

const topThree = computed(() => {
  return leaderboard.value.slice(0, 3)
})

const remainingUsers = computed(() => {
  return leaderboard.value.slice(3)
})

const currentUserRank = computed(() => {
  if (!authStore.user?.id) return null

  const userIndex = leaderboard.value.findIndex(u => u.id === authStore.user?.id)
  if (userIndex === -1) return null

  return {
    ...leaderboard.value[userIndex],
    rank: userIndex + 1
  }
})

function getUserInitials(email: string) {
  if (!email) return 'U'
  return email.substring(0, 2).toUpperCase()
}

async function loadLeaderboard() {
  loading.value = true
  error.value = null

  try {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
    const limit = 50 // Show top 50 users
    const response = await fetch(`${apiGatewayUrl}/api/content/reputation/leaderboard?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to load leaderboard')
    }

    const data = await response.json()

    if (data.success) {
      leaderboard.value = data.data.map((user: any, index: number) => ({
        ...user,
        isCurrentUser: user.id === authStore.user?.id
      }))
    } else {
      throw new Error(data.error || 'Unknown error')
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load leaderboard'
    console.error('[Leaderboard] Error loading leaderboard:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.leaderboard-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #64748b;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #ef4444;
}

.retry-btn {
  padding: 0.625rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.filter-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;
}

.filter-tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.filter-tab:hover:not(.active) {
  color: #334155;
}

/* Your Rank Card */
.your-rank-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 12px;
  color: white;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.rank-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.rank-number {
  font-size: 2rem;
  font-weight: 700;
}

.rank-details {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 2px solid white;
}

.user-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.points-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.points-value {
  font-size: 2rem;
  font-weight: 700;
}

.points-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Podium */
.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.podium-place {
  background: white;
  border-radius: 16px;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.podium-place:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.place-1 {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.place-2 {
  border-color: #c0c0c0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.place-3 {
  border-color: #cd7f32;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.podium-medal {
  margin-bottom: 1rem;
}

.place-1 .podium-medal svg {
  color: #fbbf24;
}

.place-2 .podium-medal svg {
  color: #94a3b8;
}

.place-3 .podium-medal svg {
  color: #f59e0b;
}

.avatar-medium {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin: 0 auto 1rem;
  border: 3px solid #667eea;
}

.podium-name {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
}

.podium-points {
  margin: 1rem 0;
}

.points-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #667eea;
  display: block;
}

.points-text {
  font-size: 0.875rem;
  color: #64748b;
}

.podium-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
}

/* Leaderboard Table */
.leaderboard-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 120px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  font-size: 0.875rem;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 120px 120px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.highlight {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #667eea;
}

.rank-display {
  font-weight: 600;
  color: #1a202c;
}

.col-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-tiny {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.user-email {
  font-weight: 500;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.points-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .leaderboard-page {
    padding: 1rem;
  }

  .leaderboard-header h1 {
    font-size: 2rem;
  }

  .podium {
    grid-template-columns: 1fr;
  }

  .your-rank-card {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .rank-details {
    flex-direction: column;
    gap: 1rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .col-rank,
  .col-user,
  .col-tier,
  .col-experiences,
  .col-upvotes,
  .col-points {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-rank::before { content: 'Rank: '; }
  .col-tier::before { content: 'Tier: '; }
  .col-experiences::before { content: 'Experiences: '; }
  .col-upvotes::before { content: 'Upvotes: '; }
  .col-points::before { content: 'Points: '; }

  .col-rank::before,
  .col-tier::before,
  .col-experiences::before,
  .col-upvotes::before,
  .col-points::before {
    font-weight: 600;
    color: #64748b;
    font-size: 0.875rem;
  }
}
</style>
