import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        // Fetch user goals if authenticated
        if (data.user?.id) {
          await fetchUserGoals(data.user.id);
        }
      } else if (response.status === 401) {
        // Not authenticated - this is normal
        setUser(null);
        setUserGoals(null);
      } else {
        throw new Error('Failed to check authentication status');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Failed to verify authentication');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    console.log('Login button clicked - redirecting to Google OAuth');
    // Redirect to Google OAuth - use proxy configured in package.json
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      setError(null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUser(null);
        // Optionally redirect to home page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      throw err;
    }
  };

  const fetchUserGoals = async (userId) => {
    try {
      const response = await fetch('/api/content/user-goals', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserGoals(data.data);
      } else {
        console.warn('No user goals found');
        setUserGoals(null);
      }
    } catch (err) {
      console.error('Error fetching user goals:', err);
      setUserGoals(null);
    }
  };

  const fetchUserAnalysisIds = async (userId) => {
    try {
      const response = await fetch('/api/content/user-analyses', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      } else {
        console.warn('No user analyses found');
        return { analysisIds: [], totalCount: 0, analyses: [] };
      }
    } catch (err) {
      console.error('Error fetching user analysis IDs:', err);
      return { analysisIds: [], totalCount: 0, analyses: [] };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    userGoals,
    loading,
    error,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
    fetchUserGoals,
    fetchUserAnalysisIds,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;