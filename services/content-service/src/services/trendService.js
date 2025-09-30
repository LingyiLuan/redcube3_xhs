const { getAnalytics } = require('../database/analyticsQueries');

/**
 * Trend analysis service for identifying patterns over time
 */

/**
 * Get trending data with time-based analysis
 */
async function getTrendAnalysis(timeframe = '30d', userId = null) {
  try {
    // Get base analytics data
    const analytics = await getAnalytics(timeframe, userId);

    // Add trend-specific analysis
    const trendData = {
      ...analytics,
      trending_insights: await generateTrendInsights(analytics),
      market_signals: await detectMarketSignals(analytics),
      recommended_focuses: await generateRecommendations(analytics)
    };

    return trendData;
  } catch (error) {
    console.error('Trend analysis error:', error);

    // Return empty but valid trend data when no data exists
    return {
      topCompanies: [],
      topTopics: [],
      connectionStats: [],
      totalAnalyses: 0,
      timeframe,
      trending_insights: [{
        type: 'no_data',
        message: 'No analysis data available yet. Upload some posts to see trends!',
        confidence: 1.0,
        category: 'system'
      }],
      market_signals: [],
      recommended_focuses: [{
        type: 'getting_started',
        priority: 'high',
        title: 'Start Building Your Analysis Database',
        description: 'Upload XHS posts about interviews to begin trend analysis',
        action_items: ['Upload your first interview experience post', 'Try batch analysis with multiple posts'],
        confidence: 1.0
      }]
    };
  }
}

/**
 * Generate trend insights from analytics data
 */
async function generateTrendInsights(analytics) {
  const insights = [];

  // Company trend analysis
  if (analytics.topCompanies && analytics.topCompanies.length > 0) {
    const topCompany = analytics.topCompanies[0];
    insights.push({
      type: 'company_trend',
      message: `${topCompany.company} is the most discussed company with ${topCompany.mention_count} mentions`,
      confidence: calculateConfidence(topCompany.mention_count, analytics.totalAnalyses),
      category: 'companies'
    });

    // Sentiment analysis for top companies
    const positiveSentimentCompanies = analytics.topCompanies
      .filter(c => c.avg_sentiment > 0.3)
      .slice(0, 3);

    if (positiveSentimentCompanies.length > 0) {
      insights.push({
        type: 'sentiment_trend',
        message: `Companies with positive interview sentiment: ${positiveSentimentCompanies.map(c => c.company).join(', ')}`,
        confidence: 0.8,
        category: 'sentiment'
      });
    }
  }

  // Topic trend analysis
  if (analytics.topTopics && analytics.topTopics.length > 0) {
    const hotTopics = analytics.topTopics.slice(0, 3);
    insights.push({
      type: 'topic_trend',
      message: `Trending interview topics: ${hotTopics.map(t => t.topic).join(', ')}`,
      confidence: 0.9,
      category: 'topics'
    });

    // Identify technical vs behavioral trends
    const technicalTopics = hotTopics.filter(t =>
      t.topic.toLowerCase().includes('algorithm') ||
      t.topic.toLowerCase().includes('coding') ||
      t.topic.toLowerCase().includes('system') ||
      t.topic.toLowerCase().includes('technical')
    );

    if (technicalTopics.length > 0) {
      insights.push({
        type: 'skill_trend',
        message: `Technical skills are highly emphasized in recent interviews`,
        confidence: 0.85,
        category: 'skills'
      });
    }
  }

  return insights;
}

/**
 * Detect market signals from the data
 */
async function detectMarketSignals(analytics) {
  const signals = [];

  // High-activity companies (potential hiring sprees)
  if (analytics.topCompanies) {
    const highActivityCompanies = analytics.topCompanies.filter(c => c.mention_count >= 3);

    for (const company of highActivityCompanies) {
      signals.push({
        type: 'hiring_activity',
        company: company.company,
        signal_strength: Math.min(company.mention_count / 10, 1.0),
        message: `${company.company} shows increased interview activity`,
        actionable: true
      });
    }
  }

  // Topic emergence patterns
  if (analytics.topTopics) {
    const emergingTopics = analytics.topTopics
      .filter(t => t.frequency >= 2)
      .slice(0, 5);

    signals.push({
      type: 'skill_emergence',
      topics: emergingTopics.map(t => t.topic),
      signal_strength: 0.7,
      message: `New interview focus areas detected`,
      actionable: true
    });
  }

  // Connection density analysis
  if (analytics.connectionStats) {
    const connectionDensity = analytics.connectionStats.reduce((sum, stat) => sum + stat.count, 0);

    if (connectionDensity > 5) {
      signals.push({
        type: 'pattern_density',
        signal_strength: Math.min(connectionDensity / 20, 1.0),
        message: `Strong patterns detected across multiple experiences`,
        actionable: false
      });
    }
  }

  return signals;
}

/**
 * Generate actionable recommendations based on trends
 */
async function generateRecommendations(analytics) {
  const recommendations = [];

  // Company-based recommendations
  if (analytics.topCompanies && analytics.topCompanies.length > 0) {
    const topCompanies = analytics.topCompanies.slice(0, 3);

    recommendations.push({
      type: 'target_companies',
      priority: 'high',
      title: 'Focus on High-Activity Companies',
      description: `Consider targeting: ${topCompanies.map(c => c.company).join(', ')}`,
      action_items: topCompanies.map(c => `Research ${c.company} interview process`),
      confidence: 0.8
    });
  }

  // Skill-based recommendations
  if (analytics.topTopics && analytics.topTopics.length > 0) {
    const topSkills = analytics.topTopics.slice(0, 5);

    recommendations.push({
      type: 'skill_development',
      priority: 'high',
      title: 'Prepare for Trending Topics',
      description: 'Focus your preparation on the most frequently tested areas',
      action_items: topSkills.map(t => `Study ${t.topic} (mentioned ${t.frequency} times)`),
      confidence: 0.9
    });
  }

  // Connection-based recommendations
  if (analytics.connectionStats && analytics.connectionStats.length > 0) {
    const strongConnections = analytics.connectionStats.filter(c => c.avg_strength > 0.6);

    if (strongConnections.length > 0) {
      recommendations.push({
        type: 'pattern_insights',
        priority: 'medium',
        title: 'Leverage Experience Patterns',
        description: 'Strong patterns found in similar experiences',
        action_items: ['Review connected experiences for common themes', 'Apply successful strategies from similar cases'],
        confidence: 0.7
      });
    }
  }

  return recommendations;
}

/**
 * Calculate confidence score based on data volume
 */
function calculateConfidence(mentions, total) {
  if (total === 0) return 0;
  const ratio = mentions / total;
  return Math.min(ratio * 2, 1.0); // Scale confidence
}

module.exports = {
  getTrendAnalysis,
  generateTrendInsights,
  detectMarketSignals,
  generateRecommendations
};