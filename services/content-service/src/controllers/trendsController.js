const { getTrendAnalysis } = require('../services/trendService');

/**
 * Trends analysis controller
 */
async function getTrends(req, res) {
  try {
    const { timeframe = '30d', userId } = req.query;

    // Validate timeframe
    const validTimeframes = ['7d', '30d', '90d', '180d', '1y'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe',
        message: `Timeframe must be one of: ${validTimeframes.join(', ')}`
      });
    }

    const trendData = await getTrendAnalysis(timeframe, userId);

    res.json({
      ...trendData,
      analysis_metadata: {
        timeframe,
        generated_at: new Date().toISOString(),
        data_points: trendData.totalAnalyses,
        user_scoped: !!userId
      }
    });

  } catch (error) {
    console.error('Trends retrieval error:', error);
    res.status(500).json({
      error: 'Trends analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get market signals endpoint
 */
async function getMarketSignals(req, res) {
  try {
    const { timeframe = '30d', userId } = req.query;
    const trendData = await getTrendAnalysis(timeframe, userId);

    // Focus only on actionable market signals
    const actionableSignals = trendData.market_signals.filter(signal => signal.actionable);

    res.json({
      signals: actionableSignals,
      signal_count: actionableSignals.length,
      timeframe,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market signals error:', error);
    res.status(500).json({ error: 'Failed to retrieve market signals' });
  }
}

/**
 * Get personalized recommendations
 */
async function getRecommendations(req, res) {
  try {
    const { timeframe = '30d', userId } = req.query;
    const trendData = await getTrendAnalysis(timeframe, userId);

    // Sort recommendations by priority and confidence
    const sortedRecommendations = trendData.recommended_focuses.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    res.json({
      recommendations: sortedRecommendations,
      total_recommendations: sortedRecommendations.length,
      high_priority_count: sortedRecommendations.filter(r => r.priority === 'high').length,
      timeframe,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
}

module.exports = {
  getTrends,
  getMarketSignals,
  getRecommendations
};