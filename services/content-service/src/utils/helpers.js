// Helper functions for data processing and calculations

/**
 * Calculate role similarity between two roles
 */
function calculateRoleSimilarity(role1, role2) {
  const r1 = role1.toLowerCase();
  const r2 = role2.toLowerCase();

  // Simple keyword matching for MVP
  const commonKeywords = ['engineer', 'developer', 'manager', 'analyst', 'designer'];
  let matches = 0;

  for (const keyword of commonKeywords) {
    if (r1.includes(keyword) && r2.includes(keyword)) {
      matches++;
    }
  }

  return matches > 0 ? 0.8 : 0.2;
}

/**
 * Calculate topic overlap between two arrays of topics
 */
function calculateTopicOverlap(topics1, topics2) {
  if (!topics1.length || !topics2.length) return 0;

  const set1 = new Set(topics1.map(t => t.toLowerCase()));
  const set2 = new Set(topics2.map(t => t.toLowerCase()));

  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}

/**
 * Get most frequent items from an array
 */
function getMostFrequent(arr) {
  const freq = {};
  arr.forEach(item => {
    freq[item] = (freq[item] || 0) + 1;
  });

  return Object.entries(freq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([item, count]) => ({ item, count }));
}

/**
 * Calculate average sentiment from analysis array
 */
function calculateAverageSentiment(analyses) {
  const sentiments = analyses.map(a => a.sentiment).filter(Boolean);
  const positives = sentiments.filter(s => s === 'positive').length;
  const negatives = sentiments.filter(s => s === 'negative').length;
  const neutrals = sentiments.filter(s => s === 'neutral').length;

  return {
    positive: positives,
    negative: negatives,
    neutral: neutrals,
    dominant: positives > negatives && positives > neutrals ? 'positive' :
              negatives > neutrals ? 'negative' : 'neutral'
  };
}

/**
 * Generate batch insights from analyses and connections
 */
function generateBatchInsights(analyses, connections) {
  const companies = analyses.map(a => a.company).filter(Boolean);
  const roles = analyses.map(a => a.role).filter(Boolean);
  const topics = analyses.flatMap(a => a.interview_topics || []);

  return {
    most_mentioned_companies: getMostFrequent(companies),
    most_mentioned_roles: getMostFrequent(roles),
    most_common_topics: getMostFrequent(topics),
    overall_sentiment: calculateAverageSentiment(analyses),
    connection_summary: {
      total_connections: connections.length,
      strongest_connection: connections.length > 0 ? Math.max(...connections.map(c => c.strength)) : 0,
      connection_types: [...new Set(connections.flatMap(c => c.connection_types))]
    }
  };
}

module.exports = {
  calculateRoleSimilarity,
  calculateTopicOverlap,
  getMostFrequent,
  calculateAverageSentiment,
  generateBatchInsights
};