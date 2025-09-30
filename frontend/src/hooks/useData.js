import { useState, useEffect } from 'react';
import { analysisAPI, analyticsAPI } from '../api/apiService';
import { getErrorMessage } from '../utils/helpers';

/**
 * Custom hook for managing history data
 */
export const useHistory = (limit = 5) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async (userId = null, batchId = null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analysisAPI.getHistory(limit, userId, batchId);
      setHistory(data);
      return data;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
    return fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, [limit]);

  return {
    history,
    loading,
    error,
    fetchHistory,
    refreshHistory
  };
};

/**
 * Custom hook for managing trends data
 */
export const useTrends = (timeframe = '30d') => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = async (userId = null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analyticsAPI.getTrends(timeframe, userId);
      setTrends(data);
      return data;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Failed to fetch trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrends = () => {
    return fetchTrends();
  };

  useEffect(() => {
    fetchTrends();
  }, [timeframe]);

  return {
    trends,
    loading,
    error,
    fetchTrends,
    refreshTrends
  };
};

/**
 * Custom hook for managing analytics data
 */
export const useAnalytics = (timeframe = '30d') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (userId = null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analyticsAPI.getAnalytics(timeframe, userId);
      setAnalytics(data);
      return data;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = () => {
    return fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    refreshAnalytics
  };
};

/**
 * Custom hook for managing recommendations
 */
export const useRecommendations = (timeframe = '30d') => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async (userId = null) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analyticsAPI.getRecommendations(timeframe, userId);
      setRecommendations(data.recommendations || []);
      return data;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = () => {
    return fetchRecommendations();
  };

  useEffect(() => {
    fetchRecommendations();
  }, [timeframe]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    refreshRecommendations
  };
};