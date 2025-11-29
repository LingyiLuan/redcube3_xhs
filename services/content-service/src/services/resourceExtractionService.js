/**
 * Resource Extraction Service
 *
 * PURPOSE: Extract learning resources (books, courses, platforms, tools) from interview posts
 * STRATEGY: Use LLM to identify and categorize resources mentioned by candidates
 *
 * Data Flow:
 * 1. Fetch relevant posts from database
 * 2. Use LLM to extract resources with metadata
 * 3. Store in learning_map_resources table
 * 4. Track success rates and mention frequency
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const { analyzeWithOpenRouter, extractJsonFromString } = require('./aiService');

// ============================================================================
// LLM PROMPT FOR RESOURCE EXTRACTION
// ============================================================================

const RESOURCE_EXTRACTION_PROMPT = `You are analyzing an interview experience post from Reddit. Extract ALL learning resources mentioned by the candidate.

RESOURCE CATEGORIES:
1. Books - Technical books, interview prep books
2. Courses - Online courses, bootcamps, MOOCs
3. Platforms - LeetCode, HackerRank, System Design primers, etc.
4. Websites - Blogs, documentation sites, tutorial sites
5. Videos - YouTube channels, video series
6. Tools - Development tools, practice environments
7. Communities - Forums, Discord servers, study groups

EXTRACTION RULES:
- Extract ONLY resources explicitly mentioned by the candidate
- Include the context of how they used it (e.g., "used daily for 3 months")
- Note if they found it helpful or not
- Extract specific details (e.g., "LeetCode Medium problems" not just "LeetCode")

POST TEXT:
---
{post_text}
---

POST METADATA:
- Company: {company}
- Role: {role}
- Outcome: {outcome}
- Prep Duration: {prep_duration} weeks
- Tech Stack: {tech_stack}

Return JSON in this EXACT format (no additional text):
{
  "resources": [
    {
      "name": "Resource Name",
      "type": "book|course|platform|website|video|tool|community",
      "url": "url if mentioned, otherwise null",
      "usage_context": "How candidate used it (1-2 sentences)",
      "usefulness_rating": "very_helpful|helpful|somewhat_helpful|not_helpful|unclear",
      "skills_covered": ["skill1", "skill2"],
      "time_invested": "Duration if mentioned, otherwise null",
      "specific_details": "Specific sections/problems/features mentioned"
    }
  ]
}

IMPORTANT:
- Only extract resources ACTUALLY mentioned in the post
- If no resources are mentioned, return empty array
- Be precise with resource names (e.g., "Cracking the Coding Interview" not "CTCI book")
- Extract usefulness signals from context (e.g., "X was invaluable" = very_helpful)`;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Extract resources from a single post using LLM
 * @param {Object} post - Post data from database
 * @returns {Array} Extracted resources
 */
async function extractResourcesFromPost(post) {
  const prompt = RESOURCE_EXTRACTION_PROMPT
    .replace('{post_text}', post.original_text || post.title || '')
    .replace('{company}', post.company || 'Not specified')
    .replace('{role}', post.role || 'Not specified')
    .replace('{outcome}', post.outcome || 'unknown')
    .replace('{prep_duration}', post.prep_duration_weeks || 'Not specified')
    .replace('{tech_stack}', (post.tech_stack || []).join(', ') || 'Not specified');

  try {
    const response = await analyzeWithOpenRouter(prompt, {
      max_tokens: 2000,
      temperature: 0.1 // Low temperature for factual extraction
    });

    const result = extractJsonFromString(response);

    if (!result || !result.resources) {
      logger.warn(`[ResourceExtraction] No valid JSON returned for post ${post.post_id}`);
      return [];
    }

    logger.info(`[ResourceExtraction] Extracted ${result.resources.length} resources from post ${post.post_id}`);

    // Add post metadata to each resource
    return result.resources.map(resource => ({
      ...resource,
      source_post_id: post.post_id,
      source_company: post.company,
      source_outcome: post.outcome
    }));
  } catch (error) {
    logger.error(`[ResourceExtraction] Failed to extract from post ${post.post_id}:`, error.message);
    return [];
  }
}

/**
 * Backfill resources_used field for existing posts
 * @param {Object} options - Backfill options
 * @returns {Object} Backfill statistics
 */
async function backfillResourcesForPosts(options = {}) {
  const {
    limit = 100,
    offset = 0,
    onlySuccessful = false,
    companies = null
  } = options;

  logger.info(`[ResourceBackfill] Starting backfill (limit: ${limit}, offset: ${offset})`);

  // Build query to fetch posts that need resource extraction
  let whereClause = 'is_relevant = true AND (resources_used IS NULL OR resources_used = \'[]\'::jsonb)';
  const queryParams = [];
  let paramIndex = 1;

  if (onlySuccessful) {
    whereClause += ' AND outcome = $' + paramIndex++;
    queryParams.push('passed');
  }

  if (companies && companies.length > 0) {
    whereClause += ` AND company = ANY($${paramIndex++})`;
    queryParams.push(companies);
  }

  // Fetch posts
  const postsQuery = `
    SELECT
      post_id,
      original_text,
      title,
      company,
      role,
      outcome,
      prep_duration_weeks,
      tech_stack
    FROM scraped_posts
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  queryParams.push(limit, offset);

  const postsResult = await pool.query(postsQuery, queryParams);
  const posts = postsResult.rows;

  logger.info(`[ResourceBackfill] Processing ${posts.length} posts`);

  const stats = {
    processed: 0,
    successful: 0,
    failed: 0,
    total_resources_extracted: 0,
    errors: []
  };

  // Process posts in batches to avoid rate limiting
  const BATCH_SIZE = 10;
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (post) => {
      try {
        const resources = await extractResourcesFromPost(post);

        // Update post with extracted resources
        await pool.query(`
          UPDATE scraped_posts
          SET resources_used = $1
          WHERE post_id = $2
        `, [JSON.stringify(resources), post.post_id]);

        stats.processed++;
        stats.successful++;
        stats.total_resources_extracted += resources.length;

        // Also update learning_map_resources table
        await updateResourcesTable(resources);
      } catch (error) {
        stats.processed++;
        stats.failed++;
        stats.errors.push({
          post_id: post.post_id,
          error: error.message
        });
        logger.error(`[ResourceBackfill] Failed for post ${post.post_id}:`, error.message);
      }
    }));

    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info(`[ResourceBackfill] Complete: ${stats.successful}/${stats.processed} successful`);

  return stats;
}

/**
 * Update learning_map_resources table with extracted resources
 * Aggregates mentions, tracks success rates, etc.
 */
async function updateResourcesTable(resources) {
  for (const resource of resources) {
    try {
      // Check if resource already exists
      const existingResult = await pool.query(
        'SELECT id, mention_count, source_posts FROM learning_map_resources WHERE name = $1',
        [resource.name]
      );

      if (existingResult.rows.length > 0) {
        // Update existing resource
        const existing = existingResult.rows[0];
        const sourcePosts = existing.source_posts || [];
        sourcePosts.push({
          post_id: resource.source_post_id,
          company: resource.source_company,
          outcome: resource.source_outcome
        });

        // Recalculate success rate
        const successCount = sourcePosts.filter(p => p.outcome === 'passed').length;
        const successRate = (successCount / sourcePosts.length * 100).toFixed(2);

        await pool.query(`
          UPDATE learning_map_resources
          SET
            mention_count = mention_count + 1,
            source_posts = $1,
            success_rate = $2,
            last_updated_at = NOW()
          WHERE id = $3
        `, [JSON.stringify(sourcePosts), successRate, existing.id]);
      } else {
        // Insert new resource
        const successRate = resource.source_outcome === 'passed' ? 100.00 : 0.00;

        await pool.query(`
          INSERT INTO learning_map_resources (
            name,
            type,
            url,
            mention_count,
            success_rate,
            skills,
            source_posts,
            metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          resource.name,
          resource.type,
          resource.url,
          1, // First mention
          successRate,
          resource.skills_covered || [],
          JSON.stringify([{
            post_id: resource.source_post_id,
            company: resource.source_company,
            outcome: resource.source_outcome
          }]),
          JSON.stringify({
            usage_context: resource.usage_context,
            usefulness_rating: resource.usefulness_rating,
            specific_details: resource.specific_details
          })
        ]);
      }
    } catch (error) {
      logger.error(`[ResourceTable] Failed to update resource ${resource.name}:`, error.message);
    }
  }
}

/**
 * Get top resources for specific criteria
 * @param {Object} filters - Resource filters
 * @returns {Array} Top resources
 */
async function getTopResources(filters = {}) {
  const {
    type = null,
    companies = null,
    skills = null,
    minMentions = 2,
    minSuccessRate = 50,
    limit = 10
  } = filters;

  let whereClause = 'mention_count >= $1 AND success_rate >= $2';
  const queryParams = [minMentions, minSuccessRate];
  let paramIndex = 3;

  if (type) {
    whereClause += ` AND type = $${paramIndex++}`;
    queryParams.push(type);
  }

  if (companies && companies.length > 0) {
    whereClause += ` AND companies && $${paramIndex++}`;
    queryParams.push(companies);
  }

  if (skills && skills.length > 0) {
    whereClause += ` AND skills && $${paramIndex++}`;
    queryParams.push(skills);
  }

  const query = `
    SELECT
      name,
      type,
      url,
      mention_count,
      success_rate,
      skills,
      companies,
      source_posts
    FROM learning_map_resources
    WHERE ${whereClause}
    ORDER BY success_rate DESC, mention_count DESC
    LIMIT $${paramIndex}
  `;
  queryParams.push(limit);

  const result = await pool.query(query, queryParams);
  return result.rows;
}

module.exports = {
  extractResourcesFromPost,
  backfillResourcesForPosts,
  updateResourcesTable,
  getTopResources
};
