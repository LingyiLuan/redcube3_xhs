/**
 * RAG Analysis Service - Phase 6: Deep Analysis
 * Uses semantic search to provide context-aware interview analysis
 * Using DeepSeek API (cheaper alternative to OpenAI)
 */

const { generateEmbedding } = require('./embeddingService');
const pool = require('../config/database');
const OpenAI = require('openai');
const logger = require('../utils/logger');

// Use DeepSeek API (OpenAI-compatible)
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

/**
 * Analyze interview query using RAG
 * Retrieves similar experiences and generates comprehensive analysis
 */
async function analyzeWithRAG(query, options = {}) {
  const {
    role = null,
    level = null,
    company = null,
    contextSize = 10,  // Increased from 5 to 10 for more comprehensive analysis
    temperature = 0.7
  } = options;

  logger.info(`[RAG Analysis] Query: "${query.substring(0, 50)}..."`);

  try {
    // Step 1: Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Retrieve relevant context from database using vector similarity
    const context = await retrieveContext(queryEmbedding, {
      role,
      level,
      company,
      limit: contextSize
    });

    if (context.length === 0) {
      return {
        success: false,
        error: 'No relevant interview experiences found in the database',
        suggestion: 'Try broadening your search criteria or wait for more data to be collected'
      };
    }

    // Step 3: Build RAG prompt with context
    const prompt = buildRAGPrompt(query, context, { role, level, company });

    // Step 4: Generate analysis using GPT-4
    const analysis = await generateAnalysis(prompt, temperature);

    // Step 5: Extract key insights
    const insights = extractInsights(context);

    return {
      success: true,
      query,
      analysis,
      insights,
      contextUsed: {
        postCount: context.length,
        companies: [...new Set(context.map(p => p.company).filter(Boolean))],
        roles: [...new Set(context.map(p => p.role_type).filter(Boolean))],
        avgSimilarity: (context.reduce((sum, p) => sum + p.similarity, 0) / context.length).toFixed(3)
      },
      sources: context.map(p => ({
        postId: p.post_id,
        title: p.title,
        similarity: p.similarity,
        company: p.company,
        role: p.role_type,
        outcome: p.outcome
      }))
    };

  } catch (error) {
    logger.error('[RAG Analysis] Error:', error);
    throw error;
  }
}

/**
 * Retrieve relevant context using vector similarity search
 */
async function retrieveContext(queryEmbedding, filters) {
  const { role, level, company, limit } = filters;

  const query = `
    SELECT
      post_id,
      title,
      body_text,
      1 - (embedding <=> $1::vector) as similarity,
      role_type,
      level,
      outcome,
      metadata->>'company' as company,
      interview_topics,
      created_at
    FROM scraped_posts
    WHERE embedding IS NOT NULL
      AND ($2::varchar IS NULL OR role_type = $2)
      AND ($3::varchar IS NULL OR level = $3)
      AND ($4::varchar IS NULL OR metadata->>'company' = $4)
      AND 1 - (embedding <=> $1::vector) > 0.6
    ORDER BY embedding <=> $1::vector
    LIMIT $5
  `;

  const result = await pool.query(query, [
    JSON.stringify(queryEmbedding),
    role,
    level,
    company,
    limit
  ]);

  return result.rows;
}

/**
 * Build RAG prompt with retrieved context
 */
function buildRAGPrompt(query, context, filters) {
  const { role, level, company } = filters;

  let filterInfo = '';
  if (role || level || company) {
    filterInfo = `\nFilters applied: ${[
      role ? `Role: ${role}` : null,
      level ? `Level: ${level}` : null,
      company ? `Company: ${company}` : null
    ].filter(Boolean).join(', ')}`;
  }

  const contextText = context.map((post, idx) => {
    return `
### Experience ${idx + 1} (Similarity: ${post.similarity})
**Company:** ${post.company || 'Unknown'}
**Role:** ${post.role_type || 'Unknown'}
**Level:** ${post.level || 'Unknown'}
**Outcome:** ${post.outcome || 'Unknown'}
**Title:** ${post.title}

**Details:**
${post.body_text ? post.body_text.substring(0, 1000) : 'No details available'}
${post.body_text && post.body_text.length > 1000 ? '...' : ''}
`;
  }).join('\n---\n');

  return `You are an expert interview coach analyzing real interview experiences from tech companies.

USER QUERY:
${query}
${filterInfo}

RELEVANT INTERVIEW EXPERIENCES:
${contextText}

TASK:
Provide a comprehensive analysis that helps the user prepare for their interview. Include:
1. **Key Patterns**: Common themes across these experiences
2. **Question Types**: What kinds of questions were asked
3. **Difficulty Assessment**: How challenging these interviews tend to be
4. **Success Factors**: What helped candidates succeed
5. **Preparation Advice**: Specific recommendations based on these experiences
6. **Red Flags**: What to watch out for

Be specific and reference the actual experiences. Use concrete examples from the context above.`;
}

/**
 * Generate analysis using DeepSeek Chat
 */
async function generateAnalysis(prompt, temperature) {
  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'You are an expert technical interview coach with deep knowledge of FAANG and top tech company interview processes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature,
    max_tokens: 2000
  });

  return response.choices[0].message.content;
}

/**
 * Extract key insights from context
 */
function extractInsights(context) {
  const insights = {
    totalExperiences: context.length,
    outcomes: {},
    topCompanies: {},
    topRoles: {},
    avgSimilarity: 0,
    topicsFrequency: {}
  };

  context.forEach(post => {
    // Count outcomes
    if (post.outcome) {
      insights.outcomes[post.outcome] = (insights.outcomes[post.outcome] || 0) + 1;
    }

    // Count companies
    if (post.company) {
      insights.topCompanies[post.company] = (insights.topCompanies[post.company] || 0) + 1;
    }

    // Count roles
    if (post.role_type) {
      insights.topRoles[post.role_type] = (insights.topRoles[post.role_type] || 0) + 1;
    }

    // Accumulate similarity
    insights.avgSimilarity += post.similarity;

    // Count topics
    if (post.interview_topics) {
      Object.keys(post.interview_topics).forEach(topic => {
        insights.topicsFrequency[topic] = (insights.topicsFrequency[topic] || 0) + 1;
      });
    }
  });

  insights.avgSimilarity = (insights.avgSimilarity / context.length).toFixed(3);

  return insights;
}

/**
 * Compare two interview scenarios using RAG
 */
async function compareScenarios(scenario1, scenario2) {
  logger.info(`[RAG Compare] Comparing "${scenario1}" vs "${scenario2}"`);

  try {
    // Get embeddings and contexts for both scenarios
    const [emb1, emb2] = await Promise.all([
      generateEmbedding(scenario1),
      generateEmbedding(scenario2)
    ]);

    const [context1, context2] = await Promise.all([
      retrieveContext(emb1, { limit: 3 }),
      retrieveContext(emb2, { limit: 3 })
    ]);

    // Build comparison prompt
    const prompt = `Compare these two interview scenarios:

SCENARIO 1: ${scenario1}
Relevant experiences: ${context1.length} found

SCENARIO 2: ${scenario2}
Relevant experiences: ${context2.length} found

Based on real interview data, provide a detailed comparison covering:
1. Difficulty level
2. Common question types
3. Success rates
4. Preparation time needed
5. Key differences in interviewer expectations

Be specific and data-driven.`;

    const comparison = await generateAnalysis(prompt, 0.7);

    return {
      success: true,
      scenario1,
      scenario2,
      comparison,
      experienceCounts: {
        scenario1: context1.length,
        scenario2: context2.length
      }
    };

  } catch (error) {
    logger.error('[RAG Compare] Error:', error);
    throw error;
  }
}

/**
 * Get trending interview topics using embeddings clustering
 */
async function getTrendingTopics(options = {}) {
  const { timeframe = '30 days', limit = 10 } = options;

  try {
    // Get recent posts with embeddings
    const query = `
      SELECT
        title,
        body_text,
        role_type,
        metadata->>'company' as company,
        interview_topics,
        created_at,
        scraped_at
      FROM scraped_posts
      WHERE embedding IS NOT NULL
        AND scraped_at >= NOW() - INTERVAL '${timeframe}'
      ORDER BY scraped_at DESC
      LIMIT 500
    `;

    const result = await pool.query(query);
    const posts = result.rows;

    // Aggregate topics
    const topicCounts = {};
    posts.forEach(post => {
      if (post.interview_topics) {
        Object.keys(post.interview_topics).forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    // Sort and return top topics
    const trending = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: ((count / posts.length) * 100).toFixed(1)
      }));

    return {
      success: true,
      timeframe,
      totalPosts: posts.length,
      trending
    };

  } catch (error) {
    logger.error('[RAG Trending] Error:', error);
    throw error;
  }
}

module.exports = {
  analyzeWithRAG,
  compareScenarios,
  getTrendingTopics
};
