/**
 * RAG Analysis Controller - Phase 6: Deep Analysis
 * Endpoints for RAG-powered interview analysis
 */

const {
  analyzeWithRAG,
  compareScenarios,
  getTrendingTopics
} = require('../services/ragAnalysisService');
const logger = require('../utils/logger');

/**
 * Analyze interview query with RAG
 * POST /api/content/rag/analyze
 * Body: {
 *   query: "What to expect in Google L4 system design interview?",
 *   role: "SWE",
 *   level: "L4",
 *   company: "Google",
 *   contextSize: 5
 * }
 */
async function analyze(req, res) {
  try {
    const { query, role, level, company, contextSize, temperature } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query string is required' });
    }

    logger.info(`[RAG API] Analyze request: "${query.substring(0, 50)}..."`);

    const result = await analyzeWithRAG(query, {
      role,
      level,
      company,
      contextSize,
      temperature
    });

    return res.json(result);

  } catch (error) {
    logger.error('[RAG API] Analyze error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
}

/**
 * Compare two interview scenarios
 * POST /api/content/rag/compare
 * Body: {
 *   scenario1: "Google backend interview",
 *   scenario2: "Meta frontend interview"
 * }
 */
async function compare(req, res) {
  try {
    const { scenario1, scenario2 } = req.body;

    if (!scenario1 || !scenario2) {
      return res.status(400).json({ error: 'Both scenario1 and scenario2 are required' });
    }

    logger.info(`[RAG API] Compare: "${scenario1}" vs "${scenario2}"`);

    const result = await compareScenarios(scenario1, scenario2);

    return res.json(result);

  } catch (error) {
    logger.error('[RAG API] Compare error:', error);
    return res.status(500).json({
      error: 'Comparison failed',
      message: error.message
    });
  }
}

/**
 * Get trending interview topics
 * GET /api/content/rag/trending
 * Query params: timeframe=30 days, limit=10
 */
async function trending(req, res) {
  try {
    const { timeframe = '30 days', limit = 10 } = req.query;

    logger.info(`[RAG API] Trending topics: ${timeframe}, limit=${limit}`);

    const result = await getTrendingTopics({
      timeframe,
      limit: parseInt(limit)
    });

    return res.json(result);

  } catch (error) {
    logger.error('[RAG API] Trending error:', error);
    return res.status(500).json({
      error: 'Failed to get trending topics',
      message: error.message
    });
  }
}

/**
 * Get personalized recommendations based on user profile
 * POST /api/content/rag/recommendations
 * Body: {
 *   targetRole: "SWE",
 *   targetLevel: "L4",
 *   targetCompanies: ["Google", "Meta"],
 *   weakAreas: ["system design", "behavioral"]
 * }
 */
async function recommendations(req, res) {
  try {
    const { targetRole, targetLevel, targetCompanies, weakAreas } = req.body;

    if (!targetRole) {
      return res.status(400).json({ error: 'targetRole is required' });
    }

    // Build personalized query
    const query = `I'm preparing for ${targetRole} ${targetLevel || ''} interviews at ${
      targetCompanies ? targetCompanies.join(', ') : 'top tech companies'
    }. ${
      weakAreas ? `I need help with: ${weakAreas.join(', ')}.` : ''
    } What should I focus on?`;

    logger.info(`[RAG API] Personalized recommendations for: ${targetRole}`);

    const result = await analyzeWithRAG(query, {
      role: targetRole,
      level: targetLevel,
      contextSize: 8
    });

    return res.json({
      ...result,
      profile: {
        targetRole,
        targetLevel,
        targetCompanies,
        weakAreas
      }
    });

  } catch (error) {
    logger.error('[RAG API] Recommendations error:', error);
    return res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
}

module.exports = {
  analyze,
  compare,
  trending,
  recommendations
};
