// @ts-nocheck
import apiClient from './apiClient'

/**
 * Extract Reddit post ID from text (URL or direct ID)
 * Supports formats:
 * - https://www.reddit.com/r/cscareerquestions/comments/1oe2f5x/...
 * - reddit.com/r/cscareerquestions/comments/1oe2f5x/...
 * - 1oe2f5x (direct post ID)
 */
function extractPostId(text: string): string | null {
  // Try to match Reddit URL pattern
  const urlMatch = text.match(/reddit\.com\/r\/[^\/]+\/comments\/([a-z0-9]+)/i)
  if (urlMatch) {
    return urlMatch[1]
  }

  // Check if it's a direct post ID (7-8 alphanumeric characters, typical Reddit ID format)
  if (/^[a-z0-9]{7,8}$/i.test(text)) {
    return text
  }

  return null
}

export const analysisService = {
  /**
   * Analyze single post
   */
  async analyzeSingle(text: string, userId?: number | null, signal?: AbortSignal) {
    const trimmedText = text.trim()

    // Check if input is a Reddit URL or post ID
    const postId = extractPostId(trimmedText)

    if (postId) {
      // Use post ID endpoint for existing database posts
      console.log('[AnalysisService] Detected post ID, using analyze-single/post:', postId)
      const response = await apiClient.post('/analyze-single/post', {
        post_id: postId
      }, {
        signal
      })
      return response.data.data // Unwrap the { success: true, data: {...} } structure
    }

    // Use text endpoint for arbitrary text input
    console.log('[AnalysisService] Using analyze-single/text for text content')
    
    // Build request body, only include userId if it's a valid number
    const requestBody: { text: string; userId?: number } = { text: trimmedText }
    if (typeof userId === 'number') {
      requestBody.userId = userId
    }
    
    const response = await apiClient.post('/analyze-single/text', requestBody, {
      signal
    })

    return response.data
  },

  /**
   * Batch analyze multiple posts
   */
  async analyzeBatch(
    posts: Array<{ id: string; text: string }>,
    userId?: number | null,
    analyzeConnections = true,
    signal?: AbortSignal
  ) {
    const validPosts = posts.filter(p => p.text?.trim())

    // Build request body, only include userId if it's a valid number
    const requestBody: { posts: typeof validPosts; analyzeConnections: boolean; userId?: number } = {
      posts: validPosts,
      analyzeConnections
    }
    if (typeof userId === 'number') {
      requestBody.userId = userId
    }

    const response = await apiClient.post('/analyze/batch', requestBody, {
      signal
    })

    return response.data
  },

  /**
   * Get analysis history
   */
  async getHistory(limit = 10, userId?: number) {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (userId) params.append('userId', userId.toString())

    const response = await apiClient.get(`/history?${params}`)

    return response.data
  },

  /**
   * Get cached batch report by batchId
   * Retrieves the full pattern_analysis from backend cache
   */
  async getCachedBatchReport(batchId: string) {
    const response = await apiClient.get(`/batch/report/${batchId}`)
    return response.data
  }
}
