import { useState } from 'react';
import { analysisAPI } from '../api/apiService';
import { getErrorMessage, validatePostText } from '../utils/helpers';

/**
 * Custom hook for single post analysis
 */
export const useSingleAnalysis = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeSingle = async (userId = 1) => {
    const validation = validatePostText(text);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analysisAPI.analyzeSingle(text, userId);
      setAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    text,
    setText,
    analysis,
    loading,
    error,
    analyzeSingle,
    clearAnalysis,
    clearError
  };
};

/**
 * Custom hook for batch analysis
 */
export const useBatchAnalysis = () => {
  const [posts, setPosts] = useState([]);
  const [batchAnalysis, setBatchAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addPost = () => {
    const newPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      placeholder: `输入面试经验分享 ${posts.length + 1}...`
    };
    setPosts([...posts, newPost]);
  };

  const updatePost = (id, text) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, text } : post
    ));
  };

  const removePost = (id) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  const clearPosts = () => {
    setPosts([]);
    setBatchAnalysis(null);
    setError(null);
  };

  const loadSamplePosts = (sampleData) => {
    const newPosts = sampleData.map((text, index) => ({
      id: `sample_${Date.now()}_${index}`,
      text,
      placeholder: `示例 ${index + 1}`
    }));
    setPosts(newPosts);
  };

  const reorderPosts = (sourceIndex, destinationIndex) => {
    const items = Array.from(posts);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);
    setPosts(items);
  };

  const analyzeBatch = async (userId = 1, analyzeConnections = true) => {
    const validPosts = posts.filter(post => post.text?.trim());

    if (validPosts.length === 0) {
      setError('请至少添加一篇要分析的内容');
      return;
    }

    setLoading(true);
    setError(null);
    setBatchAnalysis(null);

    try {
      const result = await analysisAPI.analyzeBatch(posts, userId, analyzeConnections);
      setBatchAnalysis(result);
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearBatchAnalysis = () => {
    setBatchAnalysis(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const getValidPostsCount = () => {
    return posts.filter(post => post.text?.trim()).length;
  };

  return {
    posts,
    batchAnalysis,
    loading,
    error,
    addPost,
    updatePost,
    removePost,
    clearPosts,
    loadSamplePosts,
    reorderPosts,
    analyzeBatch,
    clearBatchAnalysis,
    clearError,
    getValidPostsCount
  };
};