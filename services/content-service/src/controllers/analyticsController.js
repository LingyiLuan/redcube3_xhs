const { getAnalytics } = require('../database/analyticsQueries');

/**
 * Analytics data controller
 */
async function getAnalyticsData(req, res) {
  try {
    const { timeframe = '30d', userId } = req.query;
    const analytics = await getAnalytics(timeframe, userId);
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
}

module.exports = {
  getAnalytics: getAnalyticsData
};