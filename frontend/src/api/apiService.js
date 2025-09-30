import axios from 'axios';

// API base configuration
const API = axios.create({
  baseURL: '/api/content',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
API.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * Single post analysis API calls
 */
export const analysisAPI = {
  // Analyze single post
  analyzeSingle: async (text, userId = 1) => {
    const response = await API.post('/analyze', {
      text: text.trim(),
      userId
    });
    return response.data;
  },

  // Batch analyze multiple posts
  analyzeBatch: async (posts, userId = 1, analyzeConnections = true) => {
    const validPosts = posts.filter(post => post.text?.trim());
    const response = await API.post('/analyze/batch', {
      posts: validPosts.map(post => ({
        id: post.id,
        text: post.text.trim()
      })),
      userId,
      analyzeConnections
    });
    return response.data;
  },

  // Get analysis history
  getHistory: async (limit = 5, userId = null, batchId = null) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (userId) params.append('userId', userId);
    if (batchId) params.append('batchId', batchId);

    const response = await API.get(`/history?${params.toString()}`);
    return response.data;
  }
};

/**
 * Analytics and trends API calls
 */
export const analyticsAPI = {
  // Get analytics data
  getAnalytics: async (timeframe = '30d', userId = null) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (userId) params.append('userId', userId);

    const response = await API.get(`/analytics?${params.toString()}`);
    return response.data;
  },

  // Get trend analysis
  getTrends: async (timeframe = '30d', userId = null) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (userId) params.append('userId', userId);

    const response = await API.get(`/trends?${params.toString()}`);
    return response.data;
  },

  // Get market signals
  getMarketSignals: async (timeframe = '30d', userId = null) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (userId) params.append('userId', userId);

    const response = await API.get(`/trends/signals?${params.toString()}`);
    return response.data;
  },

  // Get recommendations
  getRecommendations: async (timeframe = '30d', userId = null) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeframe', timeframe);
    if (userId) params.append('userId', userId);

    const response = await API.get(`/trends/recommendations?${params.toString()}`);
    return response.data;
  }
};

/**
 * Health check and service info
 */
export const systemAPI = {
  // Health check
  healthCheck: async () => {
    const response = await API.get('/health');
    return response.data;
  },

  // Get service info
  getServiceInfo: async () => {
    const response = await API.get('/');
    return response.data;
  }
};

export default API;