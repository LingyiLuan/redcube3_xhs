const { analyzeWithOpenRouter } = require('./analysisService');
const pool = require('../config/database');

/**
 * Learning Map Service
 * Generates AI-powered learning pathways based on XHS content analysis
 */

class LearningMapService {
  /**
   * Generate a structured learning map based on selected analyses
   * @param {Array} analysisIds - Array of analysis result IDs
   * @param {Object} userGoals - User's learning goals and preferences
   * @param {number} userId - User ID for personalization
   * @returns {Object} Structured learning map
   */
  async generateLearningMap(analysisIds, userGoals = {}, userId = null) {
    try {
      console.log('Generating learning map for user:', userId);
      console.log('Analysis IDs:', analysisIds);
      console.log('User goals:', userGoals);

      // Step 1: Fetch user goals from database if not provided
      const enhancedUserGoals = await this.getUserGoals(userId, userGoals);

      // Step 2: Fetch smart analysis results based on user goals
      const analysisResults = await this.fetchSmartAnalysisResults(analysisIds, enhancedUserGoals, userId);

      // Step 3: Process analysis data with intelligent filtering
      const insights = this.extractSmartInsights(analysisResults, enhancedUserGoals);

      // Step 4: Generate AI-powered learning map using enhanced data
      const aiGeneratedContent = await this.generateAILearningContent(insights, enhancedUserGoals);

      // Step 5: Structure the learning map with personalization metrics
      const learningMap = {
        id: `map_${Date.now()}`,
        title: aiGeneratedContent.title || "Interview Success Learning Path",
        summary: aiGeneratedContent.summary || "Personalized learning journey based on your interview analysis data.",
        timeline_weeks: aiGeneratedContent.timeline_weeks || enhancedUserGoals.timeline_months || 6,
        difficulty: aiGeneratedContent.difficulty || enhancedUserGoals.current_level || "Intermediate",
        created_at: new Date().toISOString(),
        analysis_count: analysisResults.length,
        personalization_score: insights.personalization_score,
        insights_used: insights,
        milestones: aiGeneratedContent.milestones || [],
        prerequisites: aiGeneratedContent.prerequisites || [],
        outcomes: aiGeneratedContent.outcomes || [],
        next_steps: aiGeneratedContent.next_steps || []
      };

      console.log('Generated personalized learning map:', learningMap.title);
      console.log('Personalization score:', insights.personalization_score);
      return learningMap;

    } catch (error) {
      console.error('Error generating learning map:', error);
      throw new Error('Failed to generate learning map');
    }
  }

  /**
   * Get user goals from database
   * @param {number} userId - User ID
   * @param {Object} fallbackGoals - Fallback goals if none in database
   * @returns {Object} Enhanced user goals
   */
  async getUserGoals(userId, fallbackGoals = {}) {
    try {
      if (!userId) {
        return {
          target_role: fallbackGoals.target_role || 'Data Analyst',
          target_companies: fallbackGoals.target_companies || [],
          timeline_months: fallbackGoals.timeline_months || 6,
          focus_areas: fallbackGoals.focus_areas || [],
          current_level: fallbackGoals.current_level || 'Intermediate'
        };
      }

      const query = `
        SELECT target_role, target_companies, timeline_months, focus_areas, current_level
        FROM user_goals
        WHERE user_id = $1 AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        console.log('No user goals found, using fallback');
        return {
          target_role: fallbackGoals.target_role || 'Data Analyst',
          target_companies: fallbackGoals.target_companies || [],
          timeline_months: fallbackGoals.timeline_months || 6,
          focus_areas: fallbackGoals.focus_areas || [],
          current_level: fallbackGoals.current_level || 'Intermediate'
        };
      }

      const userGoals = result.rows[0];
      console.log('Fetched user goals:', userGoals);

      return {
        target_role: userGoals.target_role || fallbackGoals.target_role || 'Data Analyst',
        target_companies: userGoals.target_companies || fallbackGoals.target_companies || [],
        timeline_months: userGoals.timeline_months || fallbackGoals.timeline_months || 6,
        focus_areas: userGoals.focus_areas || fallbackGoals.focus_areas || [],
        current_level: userGoals.current_level || fallbackGoals.current_level || 'Intermediate'
      };

    } catch (error) {
      console.error('Error fetching user goals:', error);
      return fallbackGoals;
    }
  }

  /**
   * Fetch smart analysis results based on user goals and preferences
   * @param {Array} analysisIds - Specific analysis IDs to fetch
   * @param {Object} userGoals - User's learning goals
   * @param {number} userId - User ID for filtering
   * @returns {Array} Filtered and weighted analysis results
   */
  async fetchSmartAnalysisResults(analysisIds, userGoals, userId) {
    try {
      let analyses = [];

      // If specific IDs provided, fetch those first
      if (analysisIds && analysisIds.length > 0) {
        analyses = await this.fetchAnalysisResults(analysisIds);
      }

      // If no specific analyses or user wants more personalized results
      if (analyses.length === 0 || userId) {
        const smartAnalyses = await this.fetchRelevantAnalyses(userGoals, userId);
        analyses = analyses.concat(smartAnalyses);
      }

      // Remove duplicates and apply intelligent filtering
      const uniqueAnalyses = this.deduplicateAnalyses(analyses);
      const filteredAnalyses = this.filterByRelevance(uniqueAnalyses, userGoals);
      const weightedAnalyses = this.applyRecencyWeighting(filteredAnalyses);

      console.log(`Smart filtering: ${analyses.length} → ${filteredAnalyses.length} relevant analyses`);
      return weightedAnalyses.slice(0, 15); // Limit to top 15 most relevant

    } catch (error) {
      console.error('Error fetching smart analysis results:', error);
      // Fallback to recent analyses
      return this.fetchRecentAnalyses(10);
    }
  }

  /**
   * Fetch analysis results from database
   * @param {Array} analysisIds - Analysis IDs to fetch
   * @returns {Array} Analysis results
   */
  async fetchAnalysisResults(analysisIds) {
    try {
      if (!analysisIds || analysisIds.length === 0) {
        return [];
      }

      const placeholders = analysisIds.map((_, index) => `$${index + 1}`).join(',');
      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        WHERE id IN (${placeholders})
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, analysisIds);
      console.log(`Fetched ${result.rows.length} analysis results`);

      // Transform database rows to expected format
      return result.rows.map(row => ({
        id: row.id,
        original_content: row.original_text,
        analysis_result: JSON.stringify({
          company_name: row.company,
          position_title: row.role,
          sentiment: row.sentiment,
          interview_topics: JSON.parse(row.interview_topics || '[]'),
          industry: row.industry,
          experience_level: row.experience_level,
          preparation_materials: JSON.parse(row.preparation_materials || '[]'),
          key_insights: JSON.parse(row.key_insights || '[]'),
          interview_stages: JSON.parse(row.interview_stages || '[]'),
          difficulty_level: row.difficulty_level,
          timeline: row.timeline,
          outcome: row.outcome
        }),
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      return [];
    }
  }

  /**
   * Fetch analyses relevant to user goals
   * @param {Object} userGoals - User's learning goals
   * @param {number} userId - User ID for filtering
   * @returns {Array} Relevant analysis results
   */
  async fetchRelevantAnalyses(userGoals, userId) {
    try {
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Filter by target companies if specified
      if (userGoals.target_companies && userGoals.target_companies.length > 0) {
        whereConditions.push(`company = ANY($${paramIndex})`);
        queryParams.push(userGoals.target_companies);
        paramIndex++;
      }

      // Filter by target role if specified
      if (userGoals.target_role) {
        whereConditions.push(`(role ILIKE $${paramIndex} OR role IS NULL)`);
        queryParams.push(`%${userGoals.target_role}%`);
        paramIndex++;
      }

      // Filter by experience level if specified
      if (userGoals.current_level) {
        whereConditions.push(`(experience_level = $${paramIndex} OR experience_level IS NULL)`);
        queryParams.push(userGoals.current_level);
        paramIndex++;
      }

      // Prefer successful outcomes
      whereConditions.push(`(sentiment = 'positive' OR outcome = 'success' OR sentiment IS NULL)`);

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        ${whereClause}
        ORDER BY created_at DESC,
                 CASE WHEN sentiment = 'positive' THEN 1
                      WHEN outcome = 'success' THEN 2
                      ELSE 3 END
        LIMIT 20
      `;

      const result = await pool.query(query, queryParams);
      console.log(`Fetched ${result.rows.length} relevant analyses for user goals`);

      // Transform to expected format
      return result.rows.map(row => ({
        id: row.id,
        original_content: row.original_text,
        analysis_result: JSON.stringify({
          company_name: row.company,
          position_title: row.role,
          sentiment: row.sentiment,
          interview_topics: JSON.parse(row.interview_topics || '[]'),
          industry: row.industry,
          experience_level: row.experience_level,
          preparation_materials: JSON.parse(row.preparation_materials || '[]'),
          key_insights: JSON.parse(row.key_insights || '[]'),
          interview_stages: JSON.parse(row.interview_stages || '[]'),
          difficulty_level: row.difficulty_level,
          timeline: row.timeline,
          outcome: row.outcome
        }),
        created_at: row.created_at,
        relevance_score: this.calculateRelevanceScore(row, userGoals)
      }));

    } catch (error) {
      console.error('Error fetching relevant analyses:', error);
      return [];
    }
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
      if (userGoals.target_companies.includes(analysis.company)) {
        score += 0.3;
      }
    }

    // Role match (25% weight)
    if (userGoals.target_role && analysis.role) {
      factors++;
      if (analysis.role.toLowerCase().includes(userGoals.target_role.toLowerCase())) {
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
   * Fetch recent analyses as fallback
   * @param {number} limit - Number of recent analyses to fetch
   * @returns {Array} Recent analysis results
   */
  async fetchRecentAnalyses(limit = 10) {
    try {
      const query = `
        SELECT id, original_text, company, role, sentiment, interview_topics,
               industry, experience_level, preparation_materials, key_insights,
               interview_stages, difficulty_level, timeline, outcome, created_at
        FROM analysis_results
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      console.log(`Fetched ${result.rows.length} recent analysis results as fallback`);

      // Transform database rows to expected format
      return result.rows.map(row => ({
        id: row.id,
        original_content: row.original_text,
        analysis_result: JSON.stringify({
          company_name: row.company,
          position_title: row.role,
          sentiment: row.sentiment,
          interview_topics: JSON.parse(row.interview_topics || '[]'),
          industry: row.industry,
          experience_level: row.experience_level,
          preparation_materials: JSON.parse(row.preparation_materials || '[]'),
          key_insights: JSON.parse(row.key_insights || '[]'),
          interview_stages: JSON.parse(row.interview_stages || '[]'),
          difficulty_level: row.difficulty_level,
          timeline: row.timeline,
          outcome: row.outcome
        }),
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      return [];
    }
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

    // Analyze goal alignment
    insights.goal_alignment = this.analyzeGoalAlignment(insights, userGoals);
    insights.skill_gaps = this.identifySkillGaps(insights, userGoals);
    insights.recommended_focus = this.getRecommendedFocus(insights, userGoals);

    // Convert Maps to sorted Arrays by frequency
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
   * Extract insights from analysis results (legacy method for compatibility)
   * @param {Array} analysisResults - Analysis results from database
   * @returns {Object} Extracted insights
   */
  extractInsights(analysisResults) {
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

        // Extract companies
        if (analysis.company_name) {
          insights.companies.add(analysis.company_name);
        }

        // Extract roles
        if (analysis.position_title) {
          insights.roles.add(analysis.position_title);
        }

        // Extract skills
        if (analysis.skills_required && Array.isArray(analysis.skills_required)) {
          analysis.skills_required.forEach(skill => insights.skills_mentioned.add(skill));
        }

        // Extract interview types
        if (analysis.interview_type) {
          insights.interview_types.add(analysis.interview_type);
        }

        // Extract success indicators
        if (analysis.outcome === 'success' || analysis.result === 'passed') {
          insights.success_indicators.push(analysis.key_factors || analysis.success_factors);
        }

        // Extract challenges
        if (analysis.challenges || analysis.difficulties) {
          insights.common_challenges.push(analysis.challenges || analysis.difficulties);
        }

        // Extract salary info
        if (analysis.salary_range || analysis.compensation) {
          insights.salary_ranges.push(analysis.salary_range || analysis.compensation);
        }

        // Extract locations
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
   * Generate AI-powered learning content using OpenRouter
   * @param {Object} insights - Extracted insights from analysis data
   * @param {Object} userGoals - User's learning goals
   * @returns {Object} AI-generated learning content
   */
  async generateAILearningContent(insights, userGoals) {
    try {
      const prompt = this.buildLearningMapPrompt(insights, userGoals);

      console.log('Generating AI content with OpenRouter...');
      const aiResponse = await analyzeWithOpenRouter(prompt, {
        model: "anthropic/claude-3.5-sonnet",
        max_tokens: 4000,
        temperature: 0.7
      });

      // Parse AI response to extract structured learning map
      const parsedResponse = this.parseAIResponse(aiResponse);
      return parsedResponse;

    } catch (error) {
      console.error('Error generating AI learning content:', error);

      // Fallback to structured content based on insights
      return this.generateFallbackContent(insights, userGoals);
    }
  }

  /**
   * Build prompt for AI learning map generation
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @returns {string} Formatted prompt
   */
  buildLearningMapPrompt(insights, userGoals) {
    return `
Based on the following interview analysis data, create a personalized learning map for interview success:

**Analysis Summary:**
- Total interview posts analyzed: ${insights.total_posts}
- Companies mentioned: ${insights.companies.slice(0, 10).join(', ')}
- Roles targeted: ${insights.roles.slice(0, 10).join(', ')}
- Key skills mentioned: ${insights.skills_mentioned.slice(0, 15).join(', ')}
- Interview types: ${insights.interview_types.join(', ')}
- Locations: ${insights.locations.slice(0, 5).join(', ')}

**User Goals:**
- Target role: ${userGoals.target_role || 'Not specified'}
- Experience level: ${userGoals.experience_level || 'Intermediate'}
- Learning style: ${userGoals.learning_style || 'Structured'}

**Instructions:**
Create a JSON-formatted learning map with the following structure:
{
  "title": "Personalized interview success learning path title",
  "summary": "Brief summary based on the actual data analyzed",
  "timeline_weeks": 4-8,
  "difficulty": "Beginner/Intermediate/Advanced",
  "milestones": [
    {
      "week": 1,
      "title": "Week title",
      "description": "What to focus on this week",
      "skills": ["skill1", "skill2", "skill3"],
      "tasks": ["task1", "task2", "task3"],
      "resources": ["resource1", "resource2", "resource3"]
    }
  ],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "outcomes": ["outcome1", "outcome2"],
  "next_steps": ["next_step1", "next_step2"]
}

Focus on:
1. Interview preparation strategies for the specific companies/roles identified
2. Skills development based on the actual requirements found in the data
3. Practical, actionable tasks that address real interview challenges
4. Company-specific preparation when possible

Return ONLY the JSON object, no additional text.
`;
  }

  /**
   * Parse AI response to extract learning map structure
   * @param {string} aiResponse - Raw AI response
   * @returns {Object} Parsed learning map
   */
  parseAIResponse(aiResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in AI response');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  /**
   * Generate fallback content when AI generation fails
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @returns {Object} Fallback learning content
   */
  generateFallbackContent(insights, userGoals) {
    const topCompanies = insights.companies.slice(0, 3);
    const topRoles = insights.roles.slice(0, 3);
    const topSkills = insights.skills_mentioned.slice(0, 8);

    return {
      title: `Interview Success Path: ${topRoles[0] || 'Tech Roles'} Focus`,
      summary: `Personalized learning journey based on analysis of ${insights.total_posts} interview experiences, targeting ${topCompanies.join(', ')} and similar companies.`,
      timeline_weeks: 6,
      difficulty: userGoals.experience_level || "Intermediate",
      milestones: [
        {
          week: 1,
          title: "Company Research & Role Analysis",
          description: `Deep dive into ${topCompanies.join(', ')} interview processes`,
          skills: ["Company Research", "Role Requirements Analysis", "Interview Process Mapping"],
          tasks: [
            `Research interview processes at ${topCompanies.join(', ')}`,
            `Analyze job requirements for ${topRoles.join(', ')} positions`,
            "Create company-specific preparation timeline"
          ],
          resources: ["Company careers pages", "Glassdoor reviews", "LinkedIn insights"]
        },
        {
          week: 2,
          title: "Core Skills Development",
          description: `Focus on the most mentioned skills: ${topSkills.slice(0, 4).join(', ')}`,
          skills: topSkills.slice(0, 4),
          tasks: [
            `Practice ${topSkills[0]} problems and scenarios`,
            `Build projects demonstrating ${topSkills[1]} expertise`,
            `Study ${topSkills[2]} best practices and frameworks`
          ],
          resources: ["Online coding platforms", "Technical documentation", "Practice projects"]
        },
        {
          week: 3,
          title: "Interview Format Preparation",
          description: `Prepare for ${insights.interview_types.join(', ')} interview formats`,
          skills: ["Technical Interviews", "Behavioral Interviews", "System Design"],
          tasks: [
            "Practice coding interviews with time constraints",
            "Prepare STAR method responses for behavioral questions",
            "Study system design patterns and case studies"
          ],
          resources: ["LeetCode", "Behavioral interview guides", "System design resources"]
        },
        {
          week: 4,
          title: "Mock Interviews & Feedback",
          description: "Simulate real interview conditions and get feedback",
          skills: ["Interview Performance", "Communication", "Problem Solving"],
          tasks: [
            "Conduct mock technical interviews",
            "Practice explaining solutions clearly",
            "Record and review interview performance"
          ],
          resources: ["Mock interview platforms", "Peer practice sessions", "Interview feedback tools"]
        },
        {
          week: 5,
          title: "Company-Specific Preparation",
          description: `Tailored preparation for ${topCompanies[0] || 'target companies'}`,
          skills: ["Company Culture Fit", "Specific Technical Stacks", "Industry Knowledge"],
          tasks: [
            "Study company values and culture",
            "Learn company-specific technologies",
            "Prepare company-specific questions"
          ],
          resources: ["Company blogs", "Employee testimonials", "Technical blogs"]
        },
        {
          week: 6,
          title: "Final Preparation & Application",
          description: "Polish your preparation and start applying",
          skills: ["Application Strategy", "Follow-up", "Negotiation"],
          tasks: [
            "Finalize resume and portfolio",
            "Apply to target positions",
            "Prepare for salary negotiations"
          ],
          resources: ["Resume templates", "Salary research tools", "Negotiation guides"]
        }
      ],
      prerequisites: [
        `Basic understanding of ${topSkills[0] || 'required technologies'}`,
        "Resume and portfolio ready",
        "Clear career goals"
      ],
      outcomes: [
        `Increased confidence in ${topRoles[0] || 'target role'} interviews`,
        `Proficiency in ${topSkills.slice(0, 3).join(', ')}`,
        `Understanding of ${topCompanies.join(', ')} interview processes`,
        "Strong interview performance and communication skills"
      ],
      next_steps: [
        `Apply to ${topRoles[0] || 'target'} positions at ${topCompanies.join(', ')}`,
        "Continue practicing with new interview questions",
        "Network with employees at target companies",
        "Track application progress and interview feedback"
      ]
    };
  }

  /**
   * Get personalized learning recommendations
   * @param {Object} userProfile - User's current skills and goals
   * @returns {Array} Recommended learning paths
   */
  async getPersonalizedRecommendations(userProfile) {
    try {
      // Mock recommendations based on user profile
      const recommendations = [
        {
          title: "Beginner's XHS Analysis Path",
          description: "Start with fundamental content analysis techniques",
          estimated_weeks: 4,
          difficulty: "Beginner",
          match_score: 0.9
        },
        {
          title: "Advanced Trend Prediction",
          description: "Master predictive analytics for content trends",
          estimated_weeks: 6,
          difficulty: "Advanced",
          match_score: 0.75
        },
        {
          title: "Interview-Focused Strategy",
          description: "Apply XHS analysis specifically for interview success",
          estimated_weeks: 3,
          difficulty: "Intermediate",
          match_score: 0.85
        }
      ];

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  /**
   * Update learning progress
   * @param {string} mapId - Learning map ID
   * @param {Object} progress - Progress update data
   * @returns {Object} Updated progress
   */
  async updateProgress(mapId, progress) {
    try {
      // Mock progress tracking
      const updatedProgress = {
        map_id: mapId,
        completed_milestones: progress.completed_milestones || [],
        current_week: progress.current_week || 1,
        completion_percentage: progress.completion_percentage || 0,
        last_updated: new Date().toISOString()
      };

      console.log('Updated learning progress for map:', mapId);
      return updatedProgress;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new Error('Failed to update learning progress');
    }
  }
}

module.exports = new LearningMapService();