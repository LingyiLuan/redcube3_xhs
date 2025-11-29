export interface User {
  id: number
  email: string
  name?: string
  avatarUrl?: string
  linkedinUrl?: string
  emailVerified?: boolean
  createdAt?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
