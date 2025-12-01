/**
 * Embedding Service - Phase 6: RAG Database
 * Generates embeddings for scraped posts using Hugging Face BAAI/bge-m3
 *
 * Note: Can be easily switched to OpenAI when Tier 2+ is available
 */

const axios = require('axios');
const pool = require('../config/database');
const logger = require('../utils/logger');

// ============================================================================
// ACTIVE PROVIDER: HUGGINGFACE (Fixed Router API - Nov 2025)
// Using HuggingFace Router API with correct model path
// ============================================================================
const EMBEDDING_PROVIDER = 'local'; // 'local', 'huggingface', 'openai', or 'disabled' - HF API is down, using local
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5'; // 384 dimensions
const EMBEDDING_DIMENSIONS = 384;

// HF API configuration (Models endpoint - Working as of Nov 2025)
// Note: HF API is experiencing intermittent outages. If this fails with 410/502, the API is temporarily down.
const HF_API_URL = `https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Local server (for future use)
// Use Railway internal service discovery: http://embedding-server:${PORT}
// Or use explicit URL if provided (for external services)
// Falls back to Docker service name for local development
const EMBEDDING_SERVER_PORT = process.env.EMBEDDING_SERVICE_PORT || '5000';
const LOCAL_EMBEDDING_URL = process.env.EMBEDDING_SERVER_URL || `http://embedding-server:${EMBEDDING_SERVER_PORT}`;

// Configuration
const BATCH_SIZE = 100; // Process 100 posts at a time
const MAX_TOKENS_PER_REQUEST = 8000; // Token limit

/**
 * Generate embeddings for all pending posts
 * This is the main entry point for the embedding pipeline
 */
async function generatePendingEmbeddings() {
  const startTime = Date.now();
  logger.info('[Embeddings] Starting pending embeddings generation');

  try {
    // Get pending posts - ONLY PROCESS RELEVANT POSTS
    // This saves API costs by only generating embeddings for interview-related content
    const pendingQuery = await pool.query(`
      SELECT id, post_id, title, body_text, comments
      FROM scraped_posts
      WHERE embedding_status = 'pending'
        AND embedding_retry_count < 3
        AND is_relevant = true  -- ONLY process relevant posts
      ORDER BY scraped_at DESC
      LIMIT $1
    `, [BATCH_SIZE]);

    const posts = pendingQuery.rows;

    if (posts.length === 0) {
      logger.info('[Embeddings] No pending posts to process');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    logger.info(`[Embeddings] Processing ${posts.length} posts`);

    let succeeded = 0;
    let failed = 0;

    // Process each post
    for (const post of posts) {
      try {
        await generatePostEmbedding(post);
        succeeded++;
      } catch (error) {
        logger.error(`[Embeddings] Failed to generate embedding for post ${post.post_id}:`, error.message);
        failed++;

        // Mark as failed in database
        await pool.query(`
          UPDATE scraped_posts
          SET
            embedding_status = 'failed',
            embedding_error = $1,
            embedding_retry_count = embedding_retry_count + 1,
            updated_at = NOW()
          WHERE id = $2
        `, [error.message.substring(0, 500), post.id]);
      }
    }

    const duration = Date.now() - startTime;
    logger.info(`[Embeddings] Completed: ${succeeded} succeeded, ${failed} failed (${duration}ms)`);

    return {
      processed: posts.length,
      succeeded,
      failed,
      duration_ms: duration
    };

  } catch (error) {
    logger.error('[Embeddings] Pipeline error:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single post
 */
async function generatePostEmbedding(post) {
  // Mark as processing
  await pool.query(`
    UPDATE scraped_posts
    SET embedding_status = 'processing', updated_at = NOW()
    WHERE id = $1
  `, [post.id]);

  // Prepare text for embedding
  const fullText = prepareTextForEmbedding(post);
  const titleText = post.title || '';

  // Generate embeddings using OpenAI
  const [fullEmbedding, titleEmbedding] = await Promise.all([
    generateEmbedding(fullText),
    generateEmbedding(titleText)
  ]);

  // Save embeddings to database
  await pool.query(`
    UPDATE scraped_posts
    SET
      embedding = $1,
      title_embedding = $2,
      embedding_model = $3,
      embedding_status = 'completed',
      embedding_generated_at = NOW(),
      embedding_error = NULL,
      updated_at = NOW()
    WHERE id = $4
  `, [
    JSON.stringify(fullEmbedding),
    JSON.stringify(titleEmbedding),
    EMBEDDING_MODEL,
    post.id
  ]);

  logger.debug(`[Embeddings] Generated embeddings for post ${post.post_id}`);
}

/**
 * Prepare text for embedding by combining relevant fields
 */
function prepareTextForEmbedding(post) {
  const parts = [];

  // Add title (most important)
  if (post.title) {
    parts.push(`Title: ${post.title}`);
  }

  // Add body text
  if (post.body_text) {
    // Truncate body if too long (keep first 3000 characters)
    const bodyText = post.body_text.length > 3000
      ? post.body_text.substring(0, 3000) + '...'
      : post.body_text;
    parts.push(`Body: ${bodyText}`);
  }

  // Add top comments (if available)
  if (post.comments && Array.isArray(post.comments)) {
    const topComments = post.comments.slice(0, 3); // Top 3 comments only
    topComments.forEach((comment, idx) => {
      if (comment.body) {
        const commentText = comment.body.length > 200
          ? comment.body.substring(0, 200) + '...'
          : comment.body;
        parts.push(`Comment ${idx + 1}: ${commentText}`);
      }
    });
  }

  const fullText = parts.join('\n\n');

  // Final safety check - OpenAI has 8191 token limit
  // Roughly 1 token = 4 characters, so limit to ~32000 characters
  if (fullText.length > 32000) {
    return fullText.substring(0, 32000) + '...';
  }

  return fullText;
}

/**
 * Generate embedding using configured provider
 * Supports: Local TEI, Hugging Face API, and OpenAI (future)
 */
async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    // Return zero vector for empty text
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  if (EMBEDDING_PROVIDER === 'local') {
    return generateEmbeddingLocal(text);
  } else if (EMBEDDING_PROVIDER === 'huggingface') {
    return generateEmbeddingHuggingFace(text);
  } else if (EMBEDDING_PROVIDER === 'openai') {
    return generateEmbeddingOpenAI(text);
  } else {
    throw new Error(`Unknown embedding provider: ${EMBEDDING_PROVIDER}`);
  }
}

/**
 * Generate embedding using local Text Embeddings Inference server
 * Model: BAAI/bge-small-en-v1.5 (384 dimensions)
 */
async function generateEmbeddingLocal(text) {
  try {
    const response = await axios.post(
      `${LOCAL_EMBEDDING_URL}/embed`,
      { inputs: text },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // TEI returns array of embeddings
    let embedding = response.data;

    // Handle response format: [[...]] or [...]
    if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
      embedding = embedding[0];
    }

    // Validate dimensions
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
    }

    return embedding;

  } catch (error) {
    // If local server fails, log and throw
    logger.error(`[Embeddings] Local server error: ${error.message}`);

    // Don't retry with HF API automatically - fail fast
    throw new Error(`Local embedding server error: ${error.message}`);
  }
}

/**
 * Generate embedding using Hugging Face Router API
 * Model: BAAI/bge-small-en-v1.5 (384 dimensions)
 * Endpoint: https://router.huggingface.co/hf-inference/models/{MODEL}
 * Note: Migrated from api-inference.huggingface.co (Jan 2025)
 */
async function generateEmbeddingHuggingFace(text) {
  try {
    const response = await axios.post(
      HF_API_URL,
      {
        inputs: text,
        options: { wait_for_model: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // HF returns array directly, or sometimes nested
    let embedding = response.data;

    // Handle different response formats
    if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
      embedding = embedding[0]; // Take first result
    }

    // Validate dimensions
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`);
    }

    return embedding;

  } catch (error) {
    // Handle model loading (first request may take time)
    if (error.response?.status === 503) {
      logger.warn('[Embeddings] Model loading, waiting 20 seconds...');
      await sleep(20000);
      return generateEmbeddingHuggingFace(text); // Retry
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      logger.warn('[Embeddings] Rate limit hit, waiting 10 seconds...');
      await sleep(10000);
      return generateEmbeddingHuggingFace(text); // Retry
    }

    // Handle 410 Gone (API migration/deprecation issues)
    // This indicates HuggingFace Router is having issues
    if (error.response?.status === 410) {
      logger.error('[Embeddings] ❌ HuggingFace API returned 410 Gone');
      logger.error('[Embeddings] Current endpoint:', HF_API_URL);
      logger.error('[Embeddings] This is a critical failure - embeddings cannot be generated');
      logger.error('[Embeddings] Possible causes:');
      logger.error('[Embeddings]   1. Router endpoint still experiencing migration issues');
      logger.error('[Embeddings]   2. Model unavailable on the new router');
      logger.error('[Embeddings]   3. API key issues');
      // DO NOT retry on 410 - it means the endpoint is permanently gone
      // Throw error to fail fast and surface the issue
      throw new Error(`HuggingFace API 410 Gone - embedding generation failed. Check API endpoint and model availability.`);
    }

    throw new Error(`Hugging Face API error: ${error.message}`);
  }
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbeddingOpenAI(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float'
    });

    return response.data[0].embedding;

  } catch (error) {
    if (error.status === 429) {
      logger.warn('[Embeddings] Rate limit hit, waiting 10 seconds...');
      await sleep(10000);
      return generateEmbeddingOpenAI(text);
    }

    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

/**
 * Generate embeddings for specific post IDs (manual trigger)
 */
async function generateEmbeddingsForPosts(postIds) {
  logger.info(`[Embeddings] Manual generation for ${postIds.length} posts`);

  const posts = await pool.query(`
    SELECT id, post_id, title, body_text, comments
    FROM scraped_posts
    WHERE post_id = ANY($1)
  `, [postIds]);

  let succeeded = 0;
  let failed = 0;

  for (const post of posts.rows) {
    try {
      await generatePostEmbedding(post);
      succeeded++;
    } catch (error) {
      logger.error(`[Embeddings] Failed for post ${post.post_id}:`, error.message);
      failed++;
    }
  }

  return { succeeded, failed };
}

/**
 * Get embedding statistics
 */
async function getEmbeddingStats() {
  const stats = await pool.query(`
    SELECT
      COUNT(*) as total_posts,
      COUNT(embedding) as posts_with_embeddings,
      COUNT(*) FILTER (WHERE embedding_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE embedding_status = 'processing') as processing,
      COUNT(*) FILTER (WHERE embedding_status = 'failed') as failed,
      COUNT(*) FILTER (WHERE embedding_status = 'completed') as completed,
      ROUND(100.0 * COUNT(embedding) / NULLIF(COUNT(*), 0), 2) as coverage_pct,
      MAX(embedding_generated_at) as last_generated,
      AVG(EXTRACT(EPOCH FROM (embedding_generated_at - scraped_at))) as avg_delay_seconds
    FROM scraped_posts
  `);

  return stats.rows[0];
}

/**
 * Semantic search using embeddings
 * Uses the same pattern as RAG analysis (retrieveContext) with parameterized queries
 */
async function semanticSearch(queryText, options = {}) {
  const {
    matchThreshold = 0.5, // Lower threshold for short queries - short phrases get 0.6-0.7 similarity
    matchCount = 10,
    filterRole = null,
    filterLevel = null,
    filterOutcome = null,
    filterCompany = null, // Hard filter by company - only returns posts from this company
    timeFilter = '1year' // Time filter: '3months', '6months', '1year', '2years', 'all'
  } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);

  logger.info(`[Embeddings] Query embedding generated: ${queryEmbedding.length} dimensions`);
  logger.debug(`[Embeddings] First 5 values: ${queryEmbedding.slice(0, 5)}`);

  // Map timeFilter to PostgreSQL interval
  const timeIntervalMap = {
    '3months': '3 months',
    '6months': '6 months',
    '1year': '1 year',
    '2years': '2 years',
    'all': null // No time filter
  };
  const timeInterval = timeIntervalMap[timeFilter] || timeIntervalMap['1year'];

  // Two-tier sorting: highly relevant posts (>0.7) first by time DESC, then moderately relevant (>0.5) by time DESC
  // Hard filter by company when specified - ensures "amazon swe" returns ONLY Amazon posts
  const query = `
    SELECT
      id,
      post_id,
      title,
      body_text,
      1 - (embedding <=> $1::vector) as similarity,
      role_type,
      level,
      outcome,
      metadata->>'company' as company,
      created_at
    FROM scraped_posts
    WHERE embedding IS NOT NULL
      AND is_relevant = true
      AND 1 - (embedding <=> $1::vector) > $2
      AND ($3::varchar IS NULL OR role_type = $3)
      AND ($4::varchar IS NULL OR level = $4)
      AND ($5::varchar IS NULL OR outcome = $5)
      AND ($7::varchar IS NULL OR metadata->>'company' = $7)
      AND ($8::varchar IS NULL OR created_at > NOW() - CAST($8 AS INTERVAL))
    ORDER BY
      CASE
        WHEN 1 - (embedding <=> $1::vector) > 0.7 THEN 1
        WHEN 1 - (embedding <=> $1::vector) > 0.5 THEN 2
        ELSE 3
      END,
      created_at DESC
    LIMIT $6
  `;

  // Debug logging BEFORE query execution
  logger.info(`[Embeddings] 🔍 SQL PARAMETERS:`);
  logger.info(`[Embeddings]   - matchThreshold: ${matchThreshold}`);
  logger.info(`[Embeddings]   - matchCount: ${matchCount}`);
  logger.info(`[Embeddings]   - filterRole: ${filterRole}`);
  logger.info(`[Embeddings]   - filterLevel: ${filterLevel}`);
  logger.info(`[Embeddings]   - filterOutcome: ${filterOutcome}`);
  logger.info(`[Embeddings]   - filterCompany: ${filterCompany}`);
  logger.info(`[Embeddings]   - timeInterval: ${timeInterval}`);
  logger.info(`[Embeddings]   - embedding length: ${queryEmbedding.length}`);

  const results = await pool.query(query, [
    JSON.stringify(queryEmbedding),
    matchThreshold,
    filterRole,
    filterLevel,
    filterOutcome,
    matchCount,
    filterCompany,
    timeInterval
  ]);

  logger.info(`[Embeddings] 📊 Search returned ${results.rows.length} results`);
  if (results.rows.length > 0) {
    logger.debug(`[Embeddings] Top result similarity: ${results.rows[0].similarity}, company: ${results.rows[0].company}`);
  } else {
    logger.error(`[Embeddings] ❌ ZERO RESULTS - Check filters above!`);
  }

  return results.rows;
}

// Helper function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generatePendingEmbeddings,
  generatePostEmbedding,
  generateEmbeddingsForPosts,
  getEmbeddingStats,
  semanticSearch,
  generateEmbedding
};
