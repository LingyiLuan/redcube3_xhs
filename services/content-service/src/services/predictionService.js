/**
 * Prediction Service Integration
 * Calls Python prediction-service for ML-powered predictions
 */

const axios = require('axios');

const PREDICTION_SERVICE_URL = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:8000';

/**
 * Predict interview success probability
 */
async function predictInterviewSuccess(data) {
  try {
    const response = await axios.post(
      `${PREDICTION_SERVICE_URL}/api/predict/interview-success`,
      {
        company: data.company,
        role: data.role,
        experience_level: data.experienceLevel,
        interview_topics: data.interviewTopics || [],
        preparation_time_weeks: data.preparationTimeWeeks
      },
      { timeout: 10000 }
    );

    return {
      success: true,
      prediction: response.data
    };
  } catch (error) {
    console.error('❌ [PREDICTION] Error calling prediction service:', error.message);
    return {
      success: false,
      error: error.message,
      prediction: null
    };
  }
}

/**
 * Analyze skill gaps for a user
 */
async function analyzeSkillGap(data) {
  try {
    const response = await axios.post(
      `${PREDICTION_SERVICE_URL}/api/analyze/skill-gap`,
      {
        user_skills: data.userSkills || [],
        target_role: data.targetRole,
        target_companies: data.targetCompanies || []
      },
      { timeout: 10000 }
    );

    return {
      success: true,
      analysis: response.data
    };
  } catch (error) {
    console.error('❌ [PREDICTION] Error calling skill gap analysis:', error.message);
    return {
      success: false,
      error: error.message,
      analysis: null
    };
  }
}

/**
 * Get prediction service health status
 */
async function getPredictionServiceHealth() {
  try {
    const response = await axios.get(
      `${PREDICTION_SERVICE_URL}/health`,
      { timeout: 5000 }
    );

    return {
      available: true,
      status: response.data
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Trigger model retraining with latest data
 */
async function retrainModels() {
  try {
    const response = await axios.post(
      `${PREDICTION_SERVICE_URL}/api/models/retrain`,
      {},
      { timeout: 60000 } // 60 second timeout for training
    );

    return {
      success: true,
      result: response.data
    };
  } catch (error) {
    console.error('❌ [PREDICTION] Error retraining models:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get model statistics
 */
async function getModelStats() {
  try {
    const response = await axios.get(
      `${PREDICTION_SERVICE_URL}/api/models/stats`,
      { timeout: 5000 }
    );

    return {
      success: true,
      stats: response.data
    };
  } catch (error) {
    console.error('❌ [PREDICTION] Error getting model stats:', error.message);
    return {
      success: false,
      error: error.message,
      stats: []
    };
  }
}

module.exports = {
  predictInterviewSuccess,
  analyzeSkillGap,
  getPredictionServiceHealth,
  retrainModels,
  getModelStats
};
