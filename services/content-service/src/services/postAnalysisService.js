/**
 * Post Analysis Service
 * Provides deep insights into interview posts through RAG and quantitative analysis
 *
 * Phase 1: Single Post Deep Dive
 * - Find similar posts using RAG
 * - Compare metrics (difficulty, rounds, skills)
 * - Identify unique aspects
 * - Recommend resources
 */

const pool = require('../config/database');
const { generateEmbedding } = require('./embeddingService');
const logger = require('../utils/logger');

/**
 * Analyze a single post in depth
 * Retrieves 15-30 similar posts and provides contextual comparison
 */
async function analyzeSinglePost(postId) {
  logger.info(`[Post Analysis] Starting single post analysis for: ${postId}`);

  try {
    // 1. Get the target post
    const post = await getPostById(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    // 2. Find similar posts using RAG (semantic search)
    const similarPosts = await findSimilarPosts(post, 30);
    logger.info(`[Post Analysis] Found ${similarPosts.length} similar posts`);

    // 3. Extract and analyze patterns
    const analysis = {
      post_summary: extractPostSummary(post),
      similar_posts: similarPosts.slice(0, 10).map(p => ({
        post_id: p.post_id,
        title: p.title,
        company: p.company,
        role_type: p.role_type,
        similarity_score: (1 - p.distance) * 100, // Convert to percentage
        url: p.url
      })),
      comparative_metrics: computeComparativeMetrics(post, similarPosts),
      unique_aspects: findUniqueAspects(post, similarPosts),
      recommended_resources: generateRecommendedResources(post)
    };

    logger.info(`[Post Analysis] Analysis complete for post ${postId}`);
    return analysis;

  } catch (error) {
    logger.error('[Post Analysis] Error:', error);
    throw error;
  }
}

/**
 * Get a single post by ID with all metadata
 */
async function getPostById(postId) {
  const result = await pool.query(`
    SELECT
      post_id,
      title,
      body_text,
      url,
      role_type,
      level,
      metadata->>'company' as company,
      outcome,
      tech_stack,
      frameworks,
      interview_topics,
      preparation,
      created_at,
      embedding
    FROM scraped_posts
    WHERE post_id = $1
  `, [postId]);

  return result.rows[0];
}

/**
 * Find similar posts using RAG (semantic search via embeddings)
 */
async function findSimilarPosts(targetPost, limit = 30) {
  if (!targetPost.embedding) {
    throw new Error('Target post has no embedding');
  }

  // Parse embedding if it's a string (from database)
  let embeddingArray = targetPost.embedding;
  if (typeof embeddingArray === 'string') {
    embeddingArray = JSON.parse(embeddingArray);
  }

  // Convert array to pgvector format: [x,y,z]
  const vectorString = `[${embeddingArray.join(',')}]`;

  // Use the post's embedding to find similar posts
  const result = await pool.query(`
    SELECT
      post_id,
      title,
      body_text,
      url,
      role_type,
      level,
      metadata->>'company' as company,
      outcome,
      tech_stack,
      frameworks,
      interview_topics,
      created_at,
      (embedding <=> $1::vector) as distance
    FROM scraped_posts
    WHERE
      post_id != $2 AND
      embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, [vectorString, targetPost.post_id, limit]);

  return result.rows;
}

/**
 * Extract key summary information from a post
 */
function extractPostSummary(post) {
  // Extract key skills from tech_stack and frameworks (ensure arrays)
  const techStack = Array.isArray(post.tech_stack) ? post.tech_stack : [];
  const frameworks = Array.isArray(post.frameworks) ? post.frameworks : [];
  const skills = [...techStack, ...frameworks].filter(Boolean);

  // Parse interview topics if available (ensure array)
  const topics = Array.isArray(post.interview_topics) ? post.interview_topics : [];

  return {
    post_id: post.post_id,
    title: post.title,
    company: post.company || 'Unknown',
    role: post.role_type || 'Unknown',
    level: post.level || 'Unknown',
    outcome: post.outcome || 'Not specified',
    key_skills: [...new Set(skills)].slice(0, 10), // Top 10 unique skills
    interview_topics: topics,
    date: post.created_at,
    url: post.url
  };
}

/**
 * Compute comparative metrics against similar posts
 */
function computeComparativeMetrics(targetPost, similarPosts) {
  // Extract skills from target post (ensure arrays)
  const targetTechStack = Array.isArray(targetPost.tech_stack) ? targetPost.tech_stack : [];
  const targetFrameworks = Array.isArray(targetPost.frameworks) ? targetPost.frameworks : [];
  const targetSkills = new Set([...targetTechStack, ...targetFrameworks]);

  // Count skill frequencies in similar posts
  const skillFrequency = {};
  similarPosts.forEach(post => {
    const postTechStack = Array.isArray(post.tech_stack) ? post.tech_stack : [];
    const postFrameworks = Array.isArray(post.frameworks) ? post.frameworks : [];
    const postSkills = [...postTechStack, ...postFrameworks];
    postSkills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  // Calculate what % of similar posts mention each skill from target
  const skillComparison = {};
  targetSkills.forEach(skill => {
    const count = skillFrequency[skill] || 0;
    const percentage = (count / similarPosts.length) * 100;
    skillComparison[skill] = {
      mentioned_in_similar: count,
      percentage: percentage.toFixed(1)
    };
  });

  // Company/role statistics
  const companyCount = similarPosts.filter(p =>
    p.company && p.company.toLowerCase() === (targetPost.company || '').toLowerCase()
  ).length;

  const roleCount = similarPosts.filter(p =>
    p.role_type && p.role_type.toLowerCase() === (targetPost.role_type || '').toLowerCase()
  ).length;

  // Outcome statistics
  const outcomes = {
    success: 0,
    failure: 0,
    unknown: 0
  };

  similarPosts.forEach(post => {
    const outcome = (post.outcome || '').toLowerCase();
    if (outcome.includes('pass') || outcome.includes('offer') || outcome.includes('accept')) {
      outcomes.success++;
    } else if (outcome.includes('fail') || outcome.includes('reject')) {
      outcomes.failure++;
    } else {
      outcomes.unknown++;
    }
  });

  const successRate = outcomes.success / (outcomes.success + outcomes.failure) || 0;

  return {
    total_similar_posts: similarPosts.length,
    same_company: {
      count: companyCount,
      percentage: ((companyCount / similarPosts.length) * 100).toFixed(1)
    },
    same_role: {
      count: roleCount,
      percentage: ((roleCount / similarPosts.length) * 100).toFixed(1)
    },
    skill_comparison: skillComparison,
    outcome_distribution: {
      success: outcomes.success,
      failure: outcomes.failure,
      unknown: outcomes.unknown,
      success_rate: (successRate * 100).toFixed(1) + '%'
    },
    similarity_insight: companyCount > similarPosts.length * 0.5
      ? `This is a typical ${targetPost.company} experience`
      : `This experience is unique compared to similar posts`
  };
}

/**
 * Identify unique or rare aspects of this post
 */
function findUniqueAspects(targetPost, similarPosts) {
  // Ensure arrays
  const targetTechStack = Array.isArray(targetPost.tech_stack) ? targetPost.tech_stack : [];
  const targetFrameworks = Array.isArray(targetPost.frameworks) ? targetPost.frameworks : [];
  const targetSkills = new Set([...targetTechStack, ...targetFrameworks]);

  // Count skill frequencies
  const skillFrequency = {};
  similarPosts.forEach(post => {
    const postTechStack = Array.isArray(post.tech_stack) ? post.tech_stack : [];
    const postFrameworks = Array.isArray(post.frameworks) ? post.frameworks : [];
    const postSkills = [...postTechStack, ...postFrameworks];
    postSkills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  // Find rare skills (mentioned in <20% of similar posts)
  const rareSkills = [];
  targetSkills.forEach(skill => {
    const frequency = skillFrequency[skill] || 0;
    const percentage = (frequency / similarPosts.length) * 100;

    if (percentage < 20 && percentage > 0) {
      rareSkills.push({
        skill,
        rarity_score: (100 - percentage).toFixed(1),
        mentioned_in: frequency,
        insight: `Only ${percentage.toFixed(0)}% of similar posts mention "${skill}"`
      });
    }
  });

  // Sort by rarity
  rareSkills.sort((a, b) => parseFloat(b.rarity_score) - parseFloat(a.rarity_score));

  return {
    rare_skills: rareSkills.slice(0, 5), // Top 5 rarest skills
    is_unique: rareSkills.length > 0,
    uniqueness_summary: rareSkills.length > 0
      ? `This post mentions ${rareSkills.length} rare skills not commonly seen in similar experiences`
      : `This post follows typical patterns for ${targetPost.company || 'this role'}`
  };
}

/**
 * Generate recommended study resources based on post skills
 */
function generateRecommendedResources(post) {
  // Ensure all fields are arrays
  const techStack = Array.isArray(post.tech_stack) ? post.tech_stack : [];
  const frameworks = Array.isArray(post.frameworks) ? post.frameworks : [];
  const interviewTopics = Array.isArray(post.interview_topics) ? post.interview_topics : [];

  const skills = [
    ...techStack,
    ...frameworks,
    ...interviewTopics
  ].filter(Boolean);

  // Map skills to popular resources (can be expanded with a database)
  const resourceMap = {
    'algorithms': { title: 'LeetCode', url: 'https://leetcode.com', type: 'Practice' },
    'system design': { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'Guide' },
    'python': { title: 'Python Official Docs', url: 'https://docs.python.org', type: 'Documentation' },
    'javascript': { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'Documentation' },
    'react': { title: 'React Official Docs', url: 'https://react.dev', type: 'Documentation' },
    'sql': { title: 'SQLZoo', url: 'https://sqlzoo.net', type: 'Tutorial' },
    'behavioral': { title: 'STAR Method Guide', url: 'https://www.themuse.com/advice/star-interview-method', type: 'Guide' },
    'leetcode': { title: 'LeetCode Patterns', url: 'https://seanprashad.com/leetcode-patterns/', type: 'Guide' }
  };

  const recommendations = [];
  const seen = new Set();

  skills.forEach(skill => {
    const key = skill.toLowerCase();
    if (resourceMap[key] && !seen.has(key)) {
      recommendations.push({
        skill,
        ...resourceMap[key]
      });
      seen.add(key);
    }
  });

  // Add generic resources if we have few recommendations
  if (recommendations.length < 3) {
    if (!seen.has('algorithms')) {
      recommendations.push({
        skill: 'General Prep',
        title: 'Blind 75',
        url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions',
        type: 'Practice List'
      });
    }
    if (!seen.has('system design')) {
      recommendations.push({
        skill: 'General Prep',
        title: 'Grokking the System Design Interview',
        url: 'https://www.educative.io/courses/grokking-the-system-design-interview',
        type: 'Course'
      });
    }
  }

  return recommendations.slice(0, 5); // Top 5 resources
}

module.exports = {
  analyzeSinglePost
};
