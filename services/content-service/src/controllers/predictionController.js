/**
 * Prediction Controller
 * Handles ML prediction endpoints
 */

const predictionService = require('../services/predictionService');

/**
 * Predict interview success
 * POST /api/content/predict/interview-success
 */
async function predictInterviewSuccess(req, res) {
  try {
    const result = await predictionService.predictInterviewSuccess(req.body);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'Prediction service unavailable',
        details: result.error
      });
    }

    res.json({
      success: true,
      prediction: result.prediction
    });
  } catch (error) {
    console.error('Error in predictInterviewSuccess:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Analyze skill gap
 * POST /api/content/predict/skill-gap
 */
async function analyzeSkillGap(req, res) {
  try {
    const result = await predictionService.analyzeSkillGap(req.body);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'Prediction service unavailable',
        details: result.error
      });
    }

    res.json({
      success: true,
      analysis: result.analysis
    });
  } catch (error) {
    console.error('Error in analyzeSkillGap:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get prediction service status
 * GET /api/content/predict/status
 */
async function getPredictionStatus(req, res) {
  try {
    const health = await predictionService.getPredictionServiceHealth();
    const stats = await predictionService.getModelStats();

    res.json({
      success: true,
      predictionService: health,
      models: stats.success ? stats.stats : []
    });
  } catch (error) {
    console.error('Error in getPredictionStatus:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Retrain ML models
 * POST /api/content/predict/retrain
 */
async function retrainModels(req, res) {
  try {
    console.log('🔄 [PREDICTION] Triggering model retraining...');

    const result = await predictionService.retrainModels();

    if (!result.success) {
      return res.status(503).json({
        success: false,
        error: 'Failed to retrain models',
        details: result.error
      });
    }

    res.json({
      success: true,
      result: result.result
    });
  } catch (error) {
    console.error('Error in retrainModels:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  predictInterviewSuccess,
  analyzeSkillGap,
  getPredictionStatus,
  retrainModels
};
