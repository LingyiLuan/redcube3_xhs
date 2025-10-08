/**
 * Smart Insights Service
 * Handles intelligent analysis filtering, insights extraction, and personalization
 */

class SmartInsightsService {
  /**
   * Remove duplicate analyses
   * @param {Array} analyses - Array of analyses
   * @returns {Array} Deduplicated analyses
   */
  deduplicateAnalyses(analyses) {
    const seen = new Set();
    return analyses.filter(analysis => {
      if (seen.has(analysis.id)) {
        return false;
      }
      seen.add(analysis.id);
      return true;
    });
  }

  /**
   * Filter analyses by relevance to user goals
   * @param {Array} analyses - Array of analyses
   * @param {Object} userGoals - User goals
   * @returns {Array} Filtered analyses
   */
  filterByRelevance(analyses, userGoals) {
    return analyses
      .map(analysis => ({
        ...analysis,
        relevance_score: analysis.relevance_score || this.calculateRelevanceScore(
          JSON.parse(analysis.analysis_result), userGoals
        )
      }))
      .filter(analysis => analysis.relevance_score > 0.1) // Filter out very low relevance
      .sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Apply recency weighting to analyses
   * @param {Array} analyses - Array of analyses
   * @returns {Array} Weighted analyses
   */
  applyRecencyWeighting(analyses) {
    return analyses.map(analysis => {
      const daysSince = (new Date() - new Date(analysis.created_at)) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.max(0.5, 1 - daysSince / 90); // Decay over 90 days, min 0.5

      return {
        ...analysis,
        weighted_relevance: (analysis.relevance_score || 0.1) * recencyWeight
      };
    }).sort((a, b) => b.weighted_relevance - a.weighted_relevance);
  }

  /**
   * Extract smart insights from analysis results with personalization scoring
   * @param {Array} analysisResults - Analysis results from database
   * @param {Object} userGoals - User's learning goals
   * @returns {Object} Enhanced insights with personalization metrics
   */
  extractSmartInsights(analysisResults, userGoals) {
    const insights = {
      total_posts: analysisResults.length,
      companies: new Map(), // Track frequency
      roles: new Map(),
      skills_mentioned: new Map(),
      interview_types: new Map(),
      success_indicators: [],
      common_challenges: [],
      salary_ranges: [],
      locations: new Set(),
      success_rate: 0,
      avg_difficulty: 0,
      personalization_score: 0,
      goal_alignment: {},
      skill_gaps: [],
      recommended_focus: []
    };

    let successCount = 0;
    let totalDifficulty = 0;
    let difficultyCount = 0;
    let totalRelevance = 0;

    analysisResults.forEach(result => {
      try {
        const analysis = JSON.parse(result.analysis_result);
        const relevanceScore = result.relevance_score || 0.1;
        totalRelevance += relevanceScore;

        // Track frequency with weights
        if (analysis.company_name) {
          const current = insights.companies.get(analysis.company_name) || 0;
          insights.companies.set(analysis.company_name, current + relevanceScore);
        }

        if (analysis.position_title) {
          const current = insights.roles.get(analysis.position_title) || 0;
          insights.roles.set(analysis.position_title, current + relevanceScore);
        }

        // Extract skills with frequency weighting
        if (analysis.interview_topics && Array.isArray(analysis.interview_topics)) {
          analysis.interview_topics.forEach(skill => {
            const current = insights.skills_mentioned.get(skill) || 0;
            insights.skills_mentioned.set(skill, current + relevanceScore);
          });
        }

        // Track success indicators from successful cases
        if (analysis.sentiment === 'positive' || analysis.outcome === 'success') {
          successCount++;
          if (analysis.key_insights && Array.isArray(analysis.key_insights)) {
            insights.success_indicators.push(...analysis.key_insights);
          }
          if (analysis.preparation_materials && Array.isArray(analysis.preparation_materials)) {
            insights.success_indicators.push(...analysis.preparation_materials);
          }
        }

        // Track challenges from all cases
        if (analysis.key_insights && Array.isArray(analysis.key_insights)) {
          insights.common_challenges.push(...analysis.key_insights);
        }

        // Calculate average difficulty
        if (analysis.difficulty_level) {
          const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3, 'Expert': 4 };
          const difficultyScore = difficultyMap[analysis.difficulty_level] || 2;
          totalDifficulty += difficultyScore;
          difficultyCount++;
        }

        // Extract other data
        if (analysis.location) {
          insights.locations.add(analysis.location);
        }

      } catch (parseError) {
        console.warn('Could not parse analysis result:', parseError);
      }
    });

    // Calculate metrics
    insights.success_rate = analysisResults.length > 0 ? successCount / analysisResults.length : 0;
    insights.avg_difficulty = difficultyCount > 0 ? totalDifficulty / difficultyCount : 2;
    insights.personalization_score = analysisResults.length > 0 ? totalRelevance / analysisResults.length : 0;

    // Convert Maps to sorted Arrays by frequency FIRST
    insights.companies = Array.from(insights.companies.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score: score.toFixed(2) }));

    insights.roles = Array.from(insights.roles.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score: score.toFixed(2) }));

    insights.skills_mentioned = Array.from(insights.skills_mentioned.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score: score.toFixed(2) }));

    insights.locations = Array.from(insights.locations);

    // NOW analyze goal alignment with arrays
    insights.goal_alignment = this.analyzeGoalAlignment(insights, userGoals);
    insights.skill_gaps = this.identifySkillGaps(insights, userGoals);
    insights.recommended_focus = this.getRecommendedFocus(insights, userGoals);

    console.log('Smart insights extracted:', {
      personalization_score: insights.personalization_score.toFixed(2),
      success_rate: (insights.success_rate * 100).toFixed(1) + '%',
      avg_difficulty: insights.avg_difficulty.toFixed(1),
      top_companies: insights.companies.slice(0, 3).map(c => c.name),
      top_skills: insights.skills_mentioned.slice(0, 5).map(s => s.name)
    });

    return insights;
  }

  /**
   * Analyze how well the analysis data aligns with user goals
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @returns {Object} Goal alignment analysis
   */
  analyzeGoalAlignment(insights, userGoals) {
    const alignment = {
      company_match: 0,
      role_match: 0,
      overall_score: 0
    };

    // Check company alignment
    if (userGoals.target_companies && userGoals.target_companies.length > 0) {
      const matchingCompanies = insights.companies.filter(company =>
        userGoals.target_companies.includes(company.name)
      );
      alignment.company_match = matchingCompanies.length / userGoals.target_companies.length;
    }

    // Check role alignment
    if (userGoals.target_role) {
      const roleMatches = insights.roles.filter(role =>
        role.name.toLowerCase().includes(userGoals.target_role.toLowerCase())
      );
      alignment.role_match = roleMatches.length > 0 ? 1 : 0;
    }

    alignment.overall_score = (alignment.company_match + alignment.role_match) / 2;
    return alignment;
  }

  /**
   * Identify skill gaps based on user goals vs analysis data
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @returns {Array} Identified skill gaps
   */
  identifySkillGaps(insights, userGoals) {
    if (!userGoals.focus_areas || userGoals.focus_areas.length === 0) {
      return [];
    }

    const mentionedSkills = new Set(insights.skills_mentioned.map(s => s.name.toLowerCase()));
    const gaps = userGoals.focus_areas.filter(skill =>
      !mentionedSkills.has(skill.toLowerCase())
    );

    return gaps.map(skill => ({
      skill,
      reason: 'Not found in recent interview analyses',
      priority: 'high'
    }));
  }

  /**
   * Get recommended focus areas based on analysis insights
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @returns {Array} Recommended focus areas
   */
  getRecommendedFocus(insights, userGoals) {
    const recommendations = [];

    // Recommend top skills from successful interviews
    const topSkills = insights.skills_mentioned.slice(0, 5);
    topSkills.forEach(skill => {
      recommendations.push({
        area: skill.name,
        reason: `Mentioned in ${skill.score} relevant interview experiences`,
        priority: parseFloat(skill.score) > 2 ? 'high' : 'medium'
      });
    });

    // Recommend based on goal alignment gaps
    if (insights.goal_alignment.company_match < 0.5) {
      recommendations.push({
        area: 'Company Research',
        reason: 'Limited data on your target companies',
        priority: 'high'
      });
    }

    if (insights.goal_alignment.role_match < 0.5) {
      recommendations.push({
        area: 'Role-Specific Preparation',
        reason: 'Limited data on your target role',
        priority: 'high'
      });
    }

    return recommendations.slice(0, 8); // Limit recommendations
  }

  /**
   * Legacy method for basic insights extraction (compatibility)
   * @param {Array} analysisResults - Analysis results from database
   * @returns {Object} Basic extracted insights
   */
  extractBasicInsights(analysisResults) {
    const insights = {
      total_posts: analysisResults.length,
      companies: new Set(),
      roles: new Set(),
      skills_mentioned: new Set(),
      interview_types: new Set(),
      success_indicators: [],
      common_challenges: [],
      salary_ranges: [],
      locations: new Set()
    };

    analysisResults.forEach(result => {
      try {
        const analysis = JSON.parse(result.analysis_result);

        if (analysis.company_name) {
          insights.companies.add(analysis.company_name);
        }

        if (analysis.position_title) {
          insights.roles.add(analysis.position_title);
        }

        if (analysis.interview_topics && Array.isArray(analysis.interview_topics)) {
          analysis.interview_topics.forEach(skill => insights.skills_mentioned.add(skill));
        }

        if (analysis.outcome === 'success' || analysis.result === 'passed') {
          insights.success_indicators.push(analysis.key_factors || analysis.success_factors);
        }

        if (analysis.challenges || analysis.difficulties) {
          insights.common_challenges.push(analysis.challenges || analysis.difficulties);
        }

        if (analysis.location || analysis.city) {
          insights.locations.add(analysis.location || analysis.city);
        }

      } catch (parseError) {
        console.warn('Could not parse analysis result:', parseError);
      }
    });

    // Convert Sets to Arrays for easier processing
    return {
      ...insights,
      companies: Array.from(insights.companies),
      roles: Array.from(insights.roles),
      skills_mentioned: Array.from(insights.skills_mentioned),
      interview_types: Array.from(insights.interview_types),
      locations: Array.from(insights.locations)
    };
  }

  /**
   * Calculate relevance score for an analysis based on user goals
   * @param {Object} analysis - Analysis result
   * @param {Object} userGoals - User goals
   * @returns {number} Relevance score (0-1)
   */
  calculateRelevanceScore(analysis, userGoals) {
    let score = 0;
    let factors = 0;

    // Company match (30% weight)
    if (userGoals.target_companies && userGoals.target_companies.length > 0) {
      factors++;
      if (userGoals.target_companies.includes(analysis.company_name)) {
        score += 0.3;
      }
    }

    // Role match (25% weight)
    if (userGoals.target_role && analysis.position_title) {
      factors++;
      if (analysis.position_title.toLowerCase().includes(userGoals.target_role.toLowerCase())) {
        score += 0.25;
      }
    }

    // Experience level match (20% weight)
    if (userGoals.current_level && analysis.experience_level) {
      factors++;
      if (analysis.experience_level === userGoals.current_level) {
        score += 0.2;
      }
    }

    // Positive outcome bonus (15% weight)
    factors++;
    if (analysis.sentiment === 'positive' || analysis.outcome === 'success') {
      score += 0.15;
    }

    // Recency bonus (10% weight)
    factors++;
    const daysSince = (new Date() - new Date(analysis.created_at)) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      score += 0.1 * (1 - daysSince / 30); // Decay over 30 days
    }

    return factors > 0 ? score : 0.1; // Minimum score for any analysis
  }
}

module.exports = new SmartInsightsService();