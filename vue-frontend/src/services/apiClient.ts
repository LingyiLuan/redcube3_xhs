import axios from 'axios'

// API base configuration
// Use full API Gateway URL to ensure cookies are sent to the correct domain (api.labzero.io)
const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080'
const apiClient = axios.create({
  baseURL: `${apiGatewayUrl}/api/content`,
  timeout: 300000, // 5 minutes for batch analysis with RAG
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data)
    return Promise.reject(error)
  }
)

export default apiClient
