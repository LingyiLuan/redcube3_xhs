const { analyzeText } = require('../services/aiService');
const { analyzeBatchWithConnections } = require('../services/analysisService');
const { saveAnalysisResult, getAnalysisHistory } = require('../database/analysisQueries');
const { saveConnections } = require('../database/connectionQueries');
const { analyzeSchema, batchAnalyzeSchema } = require('../utils/validation');

/**
 * Single post analysis controller
 */
async function analyzeSinglePost(req, res) {
  try {
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, userId = null } = value;
    const analysisResult = await analyzeText(text);
    const savedResult = await saveAnalysisResult(text, analysisResult, userId);

    res.json({
      id: savedResult.id,
      ...analysisResult,
      createdAt: savedResult.created_at,
      aiProvider: 'OpenRouter'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Batch analysis controller
 */
async function analyzeBatchPosts(req, res) {
  try {
    const { error, value } = batchAnalyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { posts, userId = null, analyzeConnections = true } = value;
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let result;
    if (analyzeConnections && posts.length > 1) {
      result = await analyzeBatchWithConnections(posts);

      // Save individual analyses to database
      const savedAnalyses = [];
      for (const analysis of result.individual_analyses) {
        const saved = await saveAnalysisResult(
          analysis.original_text,
          analysis,
          userId,
          batchId
        );
        savedAnalyses.push({ ...analysis, id: saved.id, createdAt: saved.created_at });
      }

      result.individual_analyses = savedAnalyses;

      // Save connections to database
      if (result.connections.length > 0) {
        const savedConnections = await saveConnections(result.connections, savedAnalyses);
        result.connections = savedConnections;
      }
    } else {
      // Simple batch analysis without connections
      const analyses = [];
      for (const post of posts) {
        const analysis = await analyzeText(post.text);
        const saved = await saveAnalysisResult(post.text, analysis, userId, batchId);
        analyses.push({
          ...analysis,
          id: saved.id,
          createdAt: saved.created_at
        });
      }

      result = {
        individual_analyses: analyses,
        connections: [],
        batch_insights: generateBatchInsights(analyses, []),
        total_posts: posts.length,
        total_connections: 0
      };
    }

    res.json({
      ...result,
      batchId,
      aiProvider: 'OpenRouter',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get analysis history controller
 */
async function getHistory(req, res) {
  try {
    const { userId, limit = 10, batchId } = req.query;
    const history = await getAnalysisHistory(userId, limit, batchId);
    res.json(history);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
}

/**
 * Health check controller
 */
function healthCheck(req, res) {
  res.json({ status: 'OK', service: 'content-service-v2', aiProvider: 'DeepSeek+OpenAI' });
}

/**
 * Service info controller
 */
function getServiceInfo(req, res) {
  res.json({
    message: 'Content service v2 - Enhanced with DeepSeek API, batch analysis, and trend intelligence',
    endpoints: {
      analysis: {
        single: '/api/content/analyze',
        batch: '/api/content/analyze/batch'
      },
      data: {
        history: '/api/content/history',
        analytics: '/api/content/analytics'
      },
      intelligence: {
        trends: '/api/content/trends',
        signals: '/api/content/trends/signals',
        recommendations: '/api/content/trends/recommendations'
      },
      system: {
        health: '/api/content/health'
      }
    },
    features: [
      'Single post analysis with DeepSeek AI',
      'Multi-post batch analysis with connection detection',
      'Historical analytics and insights',
      'Trend analysis and market signal detection',
      'Personalized recommendations based on data patterns'
    ]
  });
}

module.exports = {
  analyzeSinglePost,
  analyzeBatchPosts,
  getHistory,
  healthCheck,
  getServiceInfo
};