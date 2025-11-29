import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface NewsItem {
  id: string
  title: string
  icon: string
  timestamp: Date
  url?: string
  category?: string
}

export interface Activity {
  id: string
  type: string
  message: string
  timestamp: number
  isLast?: boolean
}

export interface DailyTip {
  icon: string
  title: string
  description: string
}

export const useLandingStore = defineStore('landing', () => {
  // State
  const newsItems = ref<NewsItem[]>([])
  const activities = ref<Activity[]>([])
  const currentTile = ref<string | null>(null)
  const isNewsLoading = ref(false)
  const isActivitiesLoading = ref(false)

  // Getters
  const recentNews = computed(() => newsItems.value.slice(0, 10))
  const recentActivities = computed(() => activities.value.slice(0, 20))

  // Daily tips (static content)
  const dailyTips: DailyTip[] = [
    {
      icon: 'keyboard',
      title: 'Keyboard Shortcuts',
      description: 'Use Cmd+S to save, Cmd+E to execute workflow, and Del to delete nodes'
    },
    {
      icon: 'connection',
      title: 'Connect Multiple Nodes',
      description: 'Batch analyze multiple posts by connecting Input nodes to single Analysis node'
    },
    {
      icon: 'map',
      title: 'Generate Learning Maps',
      description: 'Select multiple reports in the Reports tab and click "Generate Map" for insights'
    },
    {
      icon: 'filter',
      title: 'Filter Reports',
      description: 'Use the search bar in Reports tab to quickly find specific analyses'
    },
    {
      icon: 'export',
      title: 'Export Results',
      description: 'Click the export button in any report to download as JSON or CSV'
    }
  ]

  // Actions
  async function fetchNews() {
    isNewsLoading.value = true
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/news/latest')
      // const data = await response.json()
      // newsItems.value = data.news

      // Mock data for now
      newsItems.value = [
        {
          id: '1',
          title: 'New feature: Batch analysis now supports cross-post connections',
          icon: 'chart',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          category: 'feature'
        },
        {
          id: '2',
          title: 'Learning maps now include milestone tracking',
          icon: 'map',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          category: 'update'
        },
        {
          id: '3',
          title: 'Performance improvements for large workflows',
          icon: 'workflow',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          category: 'improvement'
        },
        {
          id: '4',
          title: 'New data source: XiaoHongShu integration available',
          icon: 'connection',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          category: 'feature'
        }
      ]
    } catch (error) {
      console.error('[LandingStore] Failed to fetch news:', error)
    } finally {
      isNewsLoading.value = false
    }
  }

  async function fetchActivities(userId: number) {
    isActivitiesLoading.value = true
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/users/${userId}/activities`)
      // const data = await response.json()
      // activities.value = data.activities

      // Mock data for now
      activities.value = [
        {
          id: '1',
          type: 'workflow_created',
          message: 'Created workflow "User Research Analysis"',
          timestamp: Date.now() - 1000 * 60 * 30
        },
        {
          id: '2',
          type: 'analysis_completed',
          message: 'Completed analysis of 5 Reddit posts',
          timestamp: Date.now() - 1000 * 60 * 45
        },
        {
          id: '3',
          type: 'map_generated',
          message: 'Generated learning map "Career Development Insights"',
          timestamp: Date.now() - 1000 * 60 * 60 * 2
        },
        {
          id: '4',
          type: 'workflow_executed',
          message: 'Executed batch analysis workflow',
          timestamp: Date.now() - 1000 * 60 * 60 * 3
        },
        {
          id: '5',
          type: 'report_viewed',
          message: 'Viewed report "XHS Product Reviews"',
          timestamp: Date.now() - 1000 * 60 * 60 * 5,
          isLast: true
        }
      ]
    } catch (error) {
      console.error('[LandingStore] Failed to fetch activities:', error)
    } finally {
      isActivitiesLoading.value = false
    }
  }

  async function fetchMoreNews() {
    // Fetch additional news items
    console.log('[LandingStore] Fetching more news...')
  }

  function setActiveTile(tileId: string | null) {
    currentTile.value = tileId
  }

  function addActivity(activity: Activity) {
    activities.value.unshift(activity)
    // Keep only last 50 activities
    if (activities.value.length > 50) {
      activities.value = activities.value.slice(0, 50)
    }
  }

  return {
    // State
    newsItems,
    activities,
    currentTile,
    isNewsLoading,
    isActivitiesLoading,
    dailyTips,

    // Getters
    recentNews,
    recentActivities,

    // Actions
    fetchNews,
    fetchActivities,
    fetchMoreNews,
    setActiveTile,
    addActivity
  }
})
