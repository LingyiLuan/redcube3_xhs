/**
 * Hybrid Extraction Service
 * Cascading pipeline: NER → Pattern Matching → AI
 *
 * Strategy:
 * 1. Try NER first (fast, accurate, free)
 * 2. Fallback to pattern matching for missing fields
 * 3. Final fallback to AI for comprehensive analysis
 */

const axios = require('axios');
const { findCompanyInText } = require('../config/companyMappings');
const { analyzeText } = require('./aiService');
const logger = require('../utils/logger');

// Use Railway internal service discovery: http://ner-service:${PORT}
// Or use explicit URL if provided (for external services)
// Falls back to Docker service name for local development
const NER_SERVICE_PORT = process.env.NER_SERVICE_PORT || '8000';
const NER_SERVICE_URL = process.env.NER_SERVICE_URL || `http://ner-service:${NER_SERVICE_PORT}`;
const NER_TIMEOUT = 3000; // 3 seconds

/**
 * Extract metadata using cascading pipeline
 * @param {string} text - Post text to analyze
 * @param {object} options - { useAI: true/false, preferNER: true/false }
 * @returns {object} Extracted metadata with source tracking
 */
async function extractMetadata(text, options = { useAI: true, preferNER: true }) {
  const result = {
    company: null,
    role_type: null,
    level: null,
    location: null,
    outcome: null,
    sentiment: null,
    interview_topics: [],
    difficulty_level: null,
    timeline: null,
    extraction_sources: {} // Track which method extracted each field
  };

  logger.info(`[Hybrid Extract] Starting cascading extraction for text (${text.length} chars)`);

  // STEP 1: Try NER first (preferred method)
  if (options.preferNER) {
    try {
      logger.info('[Hybrid Extract] Attempting NER extraction...');
      const nerData = await extractWithNER(text);

      if (nerData) {
        // Merge NER results
        if (nerData.company) {
          result.company = nerData.company;
          result.extraction_sources.company = 'ner';
        }
        if (nerData.role_type) {
          result.role_type = nerData.role_type;
          result.extraction_sources.role_type = 'ner';
        }
        if (nerData.level) {
          result.level = nerData.level;
          result.extraction_sources.level = 'ner';
        }
        if (nerData.location) {
          result.location = nerData.location;
          result.extraction_sources.location = 'ner';
        }
        if (nerData.outcome) {
          result.outcome = nerData.outcome;
          result.extraction_sources.outcome = 'ner';
        }

        logger.info(`[Hybrid Extract] NER extracted: ${Object.keys(result.extraction_sources).join(', ')}`);
      }
    } catch (nerError) {
      logger.warn(`[Hybrid Extract] NER failed: ${nerError.message}`);
    }
  }

  // STEP 2: Pattern matching fallback for missing company
  if (!result.company) {
    try {
      logger.info('[Hybrid Extract] NER missed company, trying pattern matching...');
      const companies = findCompanyInText(text);

      if (companies.length > 0) {
        // Smart prioritization: Prefer companies mentioned near "Company:" label
        let selectedCompany = companies[0]; // Default to first match

        const textLower = text.toLowerCase();
        const companyLabelIndex = textLower.indexOf('company:');

        if (companyLabelIndex !== -1) {
          // Extract text near "Company:" label (next 100 chars)
          const nearCompanyLabel = text.substring(companyLabelIndex, companyLabelIndex + 100);

          // Check which companies appear in this section
          for (const company of companies) {
            if (nearCompanyLabel.toLowerCase().includes(company.toLowerCase())) {
              selectedCompany = company;
              logger.info(`[Hybrid Extract] Prioritized '${company}' found near 'Company:' label`);
              break;
            }
          }
        }

        result.company = selectedCompany;
        result.extraction_sources.company = 'pattern';
        logger.info(`[Hybrid Extract] Pattern matching found companies: [${companies.join(', ')}], using: ${result.company}`);
        logger.info(`[Hybrid Extract] Text preview: "${text.substring(0, 200)}..."`);
      } else {
        logger.warn(`[Hybrid Extract] Pattern matching found NO companies`);
      }
    } catch (patternError) {
      logger.warn(`[Hybrid Extract] Pattern matching failed: ${patternError.message}`);
    }
  }

  // STEP 3: AI fallback for comprehensive analysis (only if enabled)
  if (options.useAI) {
    const missingFields = [];
    if (!result.company) missingFields.push('company');
    if (!result.sentiment) missingFields.push('sentiment');
    if (!result.difficulty_level) missingFields.push('difficulty');
    if (result.interview_topics.length === 0) missingFields.push('topics');

    if (missingFields.length > 0) {
      try {
        logger.info(`[Hybrid Extract] Missing fields (${missingFields.join(', ')}), trying AI...`);
        const aiData = await analyzeText(text);

        // Merge AI results (only for missing fields)
        if (!result.company && aiData.company) {
          result.company = aiData.company;
          result.extraction_sources.company = 'ai';
        }
        if (!result.role_type && aiData.role) {
          result.role_type = aiData.role;
          result.extraction_sources.role_type = 'ai';
        }
        if (!result.sentiment && aiData.sentiment) {
          result.sentiment = aiData.sentiment;
          result.extraction_sources.sentiment = 'ai';
        }
        if (!result.difficulty_level && aiData.difficulty_level) {
          result.difficulty_level = aiData.difficulty_level;
          result.extraction_sources.difficulty_level = 'ai';
        }
        if (!result.timeline && aiData.timeline) {
          result.timeline = aiData.timeline;
          result.extraction_sources.timeline = 'ai';
        }
        if (result.interview_topics.length === 0 && aiData.interview_topics) {
          result.interview_topics = aiData.interview_topics;
          result.extraction_sources.interview_topics = 'ai';
        }

        logger.info(`[Hybrid Extract] AI filled gaps: ${Object.keys(result.extraction_sources).join(', ')}`);
      } catch (aiError) {
        logger.error(`[Hybrid Extract] AI extraction failed: ${aiError.message}`);
      }
    }
  }

  // Normalize outcome field to match database constraints
  if (result.outcome) {
    const outcomeMap = {
      'pass': 'passed',
      'passed': 'passed',
      'offer': 'passed',
      'accept': 'passed',
      'accepted': 'passed',
      'fail': 'failed',
      'failed': 'failed',
      'reject': 'failed',
      'rejected': 'failed',
      'pending': 'pending',
      'unknown': 'unknown'
    };
    const normalizedOutcome = outcomeMap[result.outcome.toLowerCase()] || 'unknown';
    result.outcome = normalizedOutcome;
  }

  // Summary
  const extractedFields = Object.keys(result.extraction_sources).length;
  logger.info(`[Hybrid Extract] Completed: ${extractedFields} fields extracted`);
  logger.info(`[Hybrid Extract] Sources: ${JSON.stringify(result.extraction_sources)}`);

  return result;
}

/**
 * Call NER service
 */
async function extractWithNER(text) {
  try {
    const response = await axios.post(
      `${NER_SERVICE_URL}/extract-metadata`,
      { text: text.substring(0, 2000) }, // Limit to 2000 chars
      { timeout: NER_TIMEOUT }
    );

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('NER service not available');
    }
    throw error;
  }
}

/**
 * Batch extraction with parallel processing
 */
async function extractMetadataBatch(posts, options = { useAI: false, preferNER: true }) {
  logger.info(`[Hybrid Extract Batch] Processing ${posts.length} posts...`);

  const results = await Promise.all(
    posts.map(post => extractMetadata(post.text, options))
  );

  return results;
}

module.exports = {
  extractMetadata,
  extractMetadataBatch
};
