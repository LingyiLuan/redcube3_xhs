const { analyzeText } = require('./aiService');
const { extractMetadataBatch } = require('./hybridExtractionService');
const { generateBatchInsights } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Multi-post batch analysis with connection detection
 * LEGACY: Uses pure AI (expensive!)
 * Use analyzeBatchWithHybrid instead
 */
async function analyzeBatchWithConnections(posts) {
  // Step 1: Analyze each post individually IN PARALLEL
  console.log(`📊 Analyzing ${posts.length} posts in parallel...`);
  const analysisPromises = posts.map(post =>
    analyzeText(post.text).then(analysis => ({
      ...analysis,
      original_text: post.text,
      post_id: post.id || `temp_${Date.now()}_${Math.random()}`,
      // Preserve metadata from AI Assistant (company, url, title, etc.)
      // If LLM extraction fails, use frontend-provided metadata as fallback
      company: analysis.company || post.company,
      role: analysis.role || post.role,
      level: analysis.level || post.level,
      outcome: analysis.outcome || post.outcome,
      url: post.url || post.redditUrl,
      title: post.title
    }))
  );

  const analyses = await Promise.all(analysisPromises);
  console.log(`✅ Completed ${analyses.length} parallel analyses`);

  // Step 2: Identify connections between posts
  const connections = [];

  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const post1 = analyses[i];
      const post2 = analyses[j];

      const connection = analyzeConnection(post1, post2);
      if (connection.strength > 0.3) {
        connections.push({
          post1_index: i,
          post2_index: j,
          ...connection
        });
      }
    }
  }

  // Step 3: Generate batch insights
  const batchInsights = generateBatchInsights(analyses, connections);

  return {
    individual_analyses: analyses,
    connections,
    batch_insights: batchInsights,
    total_posts: posts.length,
    total_connections: connections.length
  };
}

/**
 * Multi-post batch analysis with HYBRID extraction (NER → Pattern → AI)
 * OPTIMIZED: 70-90% cost reduction vs pure AI
 */
async function analyzeBatchWithHybrid(posts) {
  logger.info(`[Hybrid Batch] Analyzing ${posts.length} posts with hybrid extraction (NER → Pattern → AI fallback)`);

  // Step 1: Hybrid extraction (NER first, AI as fallback)
  const startTime = Date.now();
  const analyses = await extractMetadataBatch(posts, {
    useAI: true,      // Allow AI as fallback for missing fields
    preferNER: true   // But try NER first (free, fast)
  });

  // Add original text, post_id, and preserve metadata from frontend
  const enrichedAnalyses = analyses.map((analysis, idx) => {
    const enriched = {
      ...analysis,
      original_text: posts[idx].text,
      post_id: posts[idx].id || `temp_${Date.now()}_${Math.random()}`,
      // Preserve metadata from AI Assistant (company, url, title, etc.)
      // If LLM extraction fails, use frontend-provided metadata as fallback
      company: analysis.company || posts[idx].company,
      role: analysis.role || posts[idx].role,
      level: analysis.level || posts[idx].level,
      outcome: analysis.outcome || posts[idx].outcome,
      url: posts[idx].url || posts[idx].redditUrl,
      title: posts[idx].title
    };

    // Debug log for first 2 posts
    if (idx < 2) {
      console.log(`[Hybrid Batch] Enriched analysis ${idx}:`, {
        llm_company: analysis.company,
        frontend_company: posts[idx].company,
        final_company: enriched.company,
        final_url: enriched.url,
        final_title: enriched.title
      });
    }

    return enriched;
  });

  const extractionTime = Date.now() - startTime;
  logger.info(`[Hybrid Batch] Extraction completed in ${extractionTime}ms`);

  // Log extraction source breakdown
  const sourceCounts = { ner: 0, pattern: 0, ai: 0 };
  enrichedAnalyses.forEach(analysis => {
    if (analysis.extraction_sources?.company) {
      sourceCounts[analysis.extraction_sources.company]++;
    }
  });
  logger.info(`[Hybrid Batch] Extraction sources: NER=${sourceCounts.ner}, Pattern=${sourceCounts.pattern}, AI=${sourceCounts.ai}`);

  // Step 2: Identify connections between posts
  const connections = [];

  for (let i = 0; i < enrichedAnalyses.length; i++) {
    for (let j = i + 1; j < enrichedAnalyses.length; j++) {
      const post1 = enrichedAnalyses[i];
      const post2 = enrichedAnalyses[j];

      const connection = analyzeConnection(post1, post2);
      if (connection.strength > 0.3) {
        connections.push({
          post1_index: i,
          post2_index: j,
          ...connection
        });
      }
    }
  }

  // Step 3: Generate batch insights
  const batchInsights = generateBatchInsights(enrichedAnalyses, connections);

  return {
    individual_analyses: enrichedAnalyses,
    connections,
    batch_insights: batchInsights,
    total_posts: posts.length,
    total_connections: connections.length,
    extraction_stats: sourceCounts
  };
}

/**
 * Connection analysis algorithm
 */
function analyzeConnection(post1, post2) {
  let strength = 0;
  let connectionTypes = [];
  let insights = [];

  // Same company connection
  if (post1.company && post2.company &&
      post1.company.toLowerCase() === post2.company.toLowerCase()) {
    strength += 0.6;
    connectionTypes.push('same_company');
    insights.push(`Both posts discuss experiences at ${post1.company}`);
  }

  // Similar role connection
  if (post1.role && post2.role &&
      calculateRoleSimilarity(post1.role, post2.role) > 0.7) {
    strength += 0.4;
    connectionTypes.push('similar_role');
    insights.push(`Similar roles: ${post1.role} and ${post2.role}`);
  }

  // Topic overlap
  const topicOverlap = calculateTopicOverlap(
    post1.interview_topics || [],
    post2.interview_topics || []
  );
  if (topicOverlap > 0.3) {
    strength += topicOverlap * 0.3;
    connectionTypes.push('topic_overlap');
    insights.push(`Shared interview topics detected`);
  }

  // Industry connection
  if (post1.industry && post2.industry &&
      post1.industry.toLowerCase() === post2.industry.toLowerCase()) {
    strength += 0.2;
    connectionTypes.push('same_industry');
  }

  // Experience level progression
  if (post1.experience_level && post2.experience_level) {
    const levels = ['intern', 'entry', 'mid', 'senior', 'executive'];
    const level1 = levels.indexOf(post1.experience_level);
    const level2 = levels.indexOf(post2.experience_level);

    if (Math.abs(level1 - level2) === 1) {
      strength += 0.15;
      connectionTypes.push('career_progression');
      insights.push('Career progression pathway identified');
    }
  }

  return {
    strength: Math.min(strength, 1.0),
    connection_types: connectionTypes,
    insights: insights.join('; ')
  };
}

// Helper functions (moved from utils for now, can be imported if preferred)
function calculateRoleSimilarity(role1, role2) {
  const r1 = role1.toLowerCase();
  const r2 = role2.toLowerCase();

  const commonKeywords = ['engineer', 'developer', 'manager', 'analyst', 'designer'];
  let matches = 0;

  for (const keyword of commonKeywords) {
    if (r1.includes(keyword) && r2.includes(keyword)) {
      matches++;
    }
  }

  return matches > 0 ? 0.8 : 0.2;
}

function calculateTopicOverlap(topics1, topics2) {
  if (!topics1.length || !topics2.length) return 0;

  const set1 = new Set(topics1.map(t => t.toLowerCase()));
  const set2 = new Set(topics2.map(t => t.toLowerCase()));

  const intersection = [...set1].filter(x => set2.has(x));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}

module.exports = {
  analyzeBatchWithConnections,
  analyzeBatchWithHybrid,
  analyzeConnection
};