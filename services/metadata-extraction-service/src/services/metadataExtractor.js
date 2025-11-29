/**
 * Metadata Extraction Service
 * Extracts structured metadata from Reddit posts using pattern matching and NLP
 */

const {
  ROLE_PATTERNS,
  LEVEL_PATTERNS,
  LEVEL_NORMALIZATION,
  COMPANY_PATTERNS,
  INTERVIEW_STAGE_PATTERNS,
  OUTCOME_PATTERNS,
  TECH_STACK_PATTERNS,
} = require('../config/constants');

class MetadataExtractor {
  constructor() {
    this.debug = process.env.DEBUG === 'true';
  }

  /**
   * Extract all metadata from a post
   * @param {Object} post - Post object with title and body_text
   * @returns {Object} Extracted metadata
   */
  extractAll(post) {
    const { title = '', body_text = '', comments = [] } = post;
    const fullText = `${title} ${body_text} ${this.extractCommentsText(comments)}`.toLowerCase();

    const metadata = {
      // Role information
      role_type: this.extractRoleType(fullText),
      role_category: null, // Will be filled after role_type

      // Level information
      level: this.extractLevel(fullText),
      level_label: null, // Will be filled after level
      company_specific_level: this.extractCompanySpecificLevel(fullText),
      experience_years: this.extractExperienceYears(fullText),

      // Company
      company: this.extractCompany(fullText),

      // Interview details
      interview_stage: this.extractInterviewStage(fullText),
      interview_round: this.extractInterviewRound(fullText),
      outcome: this.extractOutcome(fullText),

      // Tech stack
      tech_stack: this.extractTechStack(fullText),
      primary_language: null, // Will be determined from tech_stack

      // Interview topics (detailed)
      interview_topics: this.extractInterviewTopics(fullText),

      // Preparation details
      preparation: this.extractPreparation(fullText),

      // Confidence scores
      confidence: {
        role: 0,
        level: 0,
        company: 0,
        overall: 0,
      },
    };

    // Post-process: fill in derived fields
    metadata.role_category = this.getRoleCategory(metadata.role_type);
    metadata.level_label = this.getLevelLabel(metadata.level);
    metadata.primary_language = this.getPrimaryLanguage(metadata.tech_stack);

    // Calculate confidence scores
    metadata.confidence = this.calculateConfidence(metadata, fullText);

    if (this.debug) {
      console.log('[MetadataExtractor] Extracted:', JSON.stringify(metadata, null, 2));
    }

    return metadata;
  }

  /**
   * Extract role type (SWE, MLE, etc.)
   */
  extractRoleType(text) {
    for (const [roleCode, patterns] of Object.entries(ROLE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return roleCode;
        }
      }
    }
    return null;
  }

  /**
   * Get role category from role type
   */
  getRoleCategory(roleType) {
    const categoryMap = {
      SWE: 'Engineering',
      SDE: 'Engineering',
      Frontend: 'Engineering',
      Backend: 'Engineering',
      Fullstack: 'Engineering',
      Mobile: 'Engineering',
      MLE: 'ML/AI',
      Research: 'ML/AI',
      'Applied Scientist': 'ML/AI',
      'LLM Engineer': 'ML/AI',
      'Data Engineer': 'Data',
      'Data Scientist': 'Data',
      'Analytics Engineer': 'Data',
      DevOps: 'Infrastructure',
      SRE: 'Infrastructure',
      'Cloud Engineer': 'Infrastructure',
      PM: 'Product',
      TPM: 'Product',
      EM: 'Leadership',
    };
    return categoryMap[roleType] || null;
  }

  /**
   * Extract level (L1-L8 or company-specific)
   */
  extractLevel(text) {
    // Try company-specific first (more specific)
    for (const [levelCode, patterns] of Object.entries(LEVEL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          // Normalize to standard level
          return LEVEL_NORMALIZATION[levelCode] || levelCode;
        }
      }
    }
    return null;
  }

  /**
   * Extract company-specific level code (for display)
   */
  extractCompanySpecificLevel(text) {
    const companyLevels = ['SDE 1', 'SDE 2', 'SDE 3', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
    for (const level of companyLevels) {
      const patterns = LEVEL_PATTERNS[level] || [];
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return level;
        }
      }
    }
    return null;
  }

  /**
   * Get level label from standardized level
   */
  getLevelLabel(level) {
    const labels = {
      L1: 'Entry Level',
      L2: 'Junior',
      L3: 'Mid-Level',
      L4: 'Senior',
      L5: 'Staff',
      L6: 'Senior Staff',
      L7: 'Principal',
      L8: 'Distinguished',
    };
    return labels[level] || null;
  }

  /**
   * Extract years of experience
   */
  extractExperienceYears(text) {
    // Pattern: "X years of experience" or "X year experience"
    const patterns = [
      /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i,
      /(\d+)\+?\s*yoe/i, // years of experience abbreviation
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  }

  /**
   * Extract company name
   */
  extractCompany(text) {
    for (const [company, patterns] of Object.entries(COMPANY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return company;
        }
      }
    }
    return null;
  }

  /**
   * Extract interview stage
   */
  extractInterviewStage(text) {
    for (const [stage, patterns] of Object.entries(INTERVIEW_STAGE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return stage;
        }
      }
    }
    return null;
  }

  /**
   * Extract interview round number
   */
  extractInterviewRound(text) {
    const patterns = [
      /round\s*(\d+)/i,
      /(\d+)(?:st|nd|rd|th)\s*round/i,
      /interview\s*(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  }

  /**
   * Extract outcome (passed, rejected, pending)
   */
  extractOutcome(text) {
    for (const [outcome, patterns] of Object.entries(OUTCOME_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return outcome;
        }
      }
    }
    return null;
  }

  /**
   * Extract tech stack mentioned
   */
  extractTechStack(text) {
    const techStack = [];
    for (const [tech, patterns] of Object.entries(TECH_STACK_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          techStack.push(tech);
          break; // Only add once per tech
        }
      }
    }
    return techStack.length > 0 ? techStack : null;
  }

  /**
   * Determine primary programming language from tech stack
   */
  getPrimaryLanguage(techStack) {
    if (!techStack || techStack.length === 0) return null;

    const languages = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'Swift', 'Kotlin'];
    for (const lang of languages) {
      if (techStack.includes(lang)) {
        return lang;
      }
    }
    return null;
  }

  /**
   * Extract interview topics (coding, system design, behavioral)
   */
  extractInterviewTopics(text) {
    const topics = {
      coding: [],
      system_design: [],
      behavioral: [],
    };

    // Coding topics
    const codingPatterns = {
      arrays: /\b(array|list)\b/i,
      strings: /\bstring\b/i,
      trees: /\b(tree|binary tree|bst)\b/i,
      graphs: /\bgraph/i,
      dynamic_programming: /\b(dp|dynamic programming)\b/i,
      recursion: /\brecursion/i,
      sorting: /\bsort/i,
      searching: /\b(search|binary search)\b/i,
    };

    for (const [topic, pattern] of Object.entries(codingPatterns)) {
      if (pattern.test(text)) {
        topics.coding.push(topic);
      }
    }

    // System design topics
    const designPatterns = {
      distributed_systems: /\bdistributed\s*system/i,
      scalability: /\bscal(e|ability|ing)/i,
      database_design: /\bdatabase\s*design/i,
      caching: /\bcach(e|ing)/i,
      load_balancing: /\bload\s*balanc/i,
      microservices: /\bmicroservice/i,
    };

    for (const [topic, pattern] of Object.entries(designPatterns)) {
      if (pattern.test(text)) {
        topics.system_design.push(topic);
      }
    }

    // Behavioral topics
    const behavioralPatterns = {
      leadership: /\bleadership/i,
      conflict: /\bconflict/i,
      teamwork: /\bteam/i,
      failure: /\bfail(ure|ed)/i,
    };

    for (const [topic, pattern] of Object.entries(behavioralPatterns)) {
      if (pattern.test(text)) {
        topics.behavioral.push(topic);
      }
    }

    return topics;
  }

  /**
   * Extract preparation details
   */
  extractPreparation(text) {
    const prep = {};

    // Duration in weeks/months
    const durationPatterns = [
      /(\d+)\s*weeks?\s*(?:of\s*)?(?:prep|preparation)/i,
      /(?:prep|preparation)\s*(?:for\s*)?(\d+)\s*weeks?/i,
      /(\d+)\s*months?\s*(?:of\s*)?(?:prep|preparation)/i,
    ];

    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseInt(match[1], 10);
        if (text.includes('month')) {
          prep.duration_weeks = value * 4;
        } else {
          prep.duration_weeks = value;
        }
        break;
      }
    }

    // LeetCode count
    const leetcodePattern = /(\d+)\s*leetcode\s*(?:problems?|questions?)/i;
    const leetcodeMatch = text.match(leetcodePattern);
    if (leetcodeMatch) {
      prep.leetcode_count = parseInt(leetcodeMatch[1], 10);
    }

    // Mock interviews
    const mockPattern = /(\d+)\s*mock\s*interviews?/i;
    const mockMatch = text.match(mockPattern);
    if (mockMatch) {
      prep.mock_interviews = parseInt(mockMatch[1], 10);
    }

    return Object.keys(prep).length > 0 ? prep : null;
  }

  /**
   * Extract text from comments array
   */
  extractCommentsText(comments) {
    if (!comments || !Array.isArray(comments)) return '';
    return comments.map(c => c.text || c.body || '').join(' ');
  }

  /**
   * Calculate confidence scores
   */
  calculateConfidence(metadata, text) {
    const scores = {
      role: 0,
      level: 0,
      company: 0,
      overall: 0,
    };

    // Role confidence (based on how specific the match is)
    if (metadata.role_type) {
      scores.role = metadata.role_category ? 0.9 : 0.7;
    }

    // Level confidence
    if (metadata.level) {
      scores.level = metadata.company_specific_level ? 0.95 : 0.8;
    }

    // Company confidence
    if (metadata.company) {
      scores.company = 0.9;
    }

    // Overall confidence (average)
    const validScores = Object.values(scores).filter(s => s > 0);
    scores.overall = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

    return scores;
  }
}

module.exports = MetadataExtractor;
