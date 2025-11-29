/**
 * LLM Filter Service
 * Uses DeepSeek (cheap LLM) to classify borderline posts as relevant or not
 *
 * Cost: ~$0.14 per 1M input tokens (very cheap!)
 * Use for: Posts scoring 30-60 (uncertain cases)
 */

const axios = require('axios');
const logger = require('../utils/logger');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEEPSEEK_MODEL = 'deepseek/deepseek-chat';  // DeepSeek-V3

/**
 * Ask LLM if a post is a relevant tech job interview experience
 *
 * @param {Object} post - Post object with title and bodyText
 * @returns {Object} { isRelevant: boolean, confidence: 0-100, reason: string }
 */
async function classifyPostWithLLM(post) {
  if (!OPENROUTER_API_KEY) {
    logger.warn('[LLM Filter] No OPENROUTER_API_KEY found, skipping LLM classification');
    return { isRelevant: false, confidence: 50, reason: 'No API key configured' };
  }

  try {
    const prompt = buildClassificationPrompt(post);

    logger.info(`[LLM Filter] Classifying post: "${post.title.substring(0, 60)}..."`);

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at classifying tech job interview posts. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,  // Low temperature for consistent classification
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8080',
          'X-Title': 'RedCube Interview Filter'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content;

    // Parse JSON response
    const result = parseLLMResponse(content);

    logger.info(`[LLM Filter] Result: ${result.isRelevant ? '✅ RELEVANT' : '❌ NOT RELEVANT'} (confidence: ${result.confidence}%)`);
    logger.debug(`[LLM Filter] Reason: ${result.reason}`);

    return result;

  } catch (error) {
    logger.error(`[LLM Filter] Error classifying post: ${error.message}`);

    // On error, be conservative and reject
    return {
      isRelevant: false,
      confidence: 0,
      reason: `LLM error: ${error.message}`
    };
  }
}

/**
 * Build the classification prompt
 */
function buildClassificationPrompt(post) {
  const text = `${post.title}\n\n${post.bodyText || ''}`.substring(0, 2000);  // Limit to 2K chars

  return `Is this post about a PERSONAL tech job interview experience?

Rules:
- ✅ YES if: Personal story about interviewing at a tech company (offer, rejection, interview rounds, etc.)
- ❌ NO if: LeetCode practice, career advice, resume help, resource requests, general questions

Post:
"""
${text}
"""

Respond ONLY with JSON in this exact format:
{
  "isRelevant": true or false,
  "confidence": 0-100,
  "reason": "brief explanation"
}`;
}

/**
 * Parse LLM response (handles various formats)
 */
function parseLLMResponse(content) {
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isRelevant: parsed.isRelevant === true,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reason: parsed.reason || 'No reason provided'
      };
    }

    // Fallback: look for keywords
    const lowerContent = content.toLowerCase();
    const isRelevant = lowerContent.includes('"isrelevant": true') ||
                       lowerContent.includes('yes') ||
                       lowerContent.includes('relevant');

    return {
      isRelevant,
      confidence: 60,
      reason: 'Parsed from unstructured response'
    };

  } catch (error) {
    logger.error(`[LLM Filter] Failed to parse LLM response: ${error.message}`);
    return {
      isRelevant: false,
      confidence: 0,
      reason: 'Parse error'
    };
  }
}

/**
 * Check if LLM filtering is available
 */
function isLLMAvailable() {
  return !!OPENROUTER_API_KEY;
}

module.exports = {
  classifyPostWithLLM,
  isLLMAvailable
};
