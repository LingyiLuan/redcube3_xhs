const { analyzeWithOpenRouter } = require('./aiService');

/**
 * AI Content Service
 * Handles AI-powered learning map content generation
 */

class AIContentService {
  /**
   * Generate AI-powered learning content using OpenRouter
   * @param {Object} insights - Extracted insights from analysis data
   * @param {Object} userGoals - User's learning goals
   * @returns {Object} AI-generated learning content
   */
  async generateAILearningContent(insights, userGoals, isCrazyPlan = false) {
    try {
      const prompt = this.buildLearningMapPrompt(insights, userGoals, isCrazyPlan);

      console.log('Generating AI content with OpenRouter...');
      console.log('CrazyPlan mode:', isCrazyPlan);
      const aiResponse = await analyzeWithOpenRouter(prompt, {
        model: "anthropic/claude-3.5-sonnet",
        max_tokens: 4000,
        temperature: isCrazyPlan ? 0.8 : 0.7 // Higher creativity for CrazyPlan
      });

      // Parse AI response to extract structured learning map
      const parsedResponse = this.parseAIResponse(aiResponse);
      return parsedResponse;

    } catch (error) {
      console.error('Error generating AI learning content:', error);

      // Fallback to structured content based on insights
      return this.generateFallbackContent(insights, userGoals, isCrazyPlan);
    }
  }

  /**
   * Build prompt for AI learning map generation
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @param {boolean} isCrazyPlan - Whether to generate CrazyPlan mode
   * @returns {string} Formatted prompt
   */
  buildLearningMapPrompt(insights, userGoals, isCrazyPlan = false) {
    const topCompanies = insights.companies ? insights.companies.slice(0, 10).map(c => c.name || c).join(', ') : 'No companies';
    const topRoles = insights.roles ? insights.roles.slice(0, 10).map(r => r.name || r).join(', ') : 'No roles';
    const topSkills = insights.skills_mentioned ? insights.skills_mentioned.slice(0, 15).map(s => s.name || s).join(', ') : 'No skills';
    const locations = insights.locations ? insights.locations.slice(0, 5).join(', ') : 'No locations';

    if (isCrazyPlan) {
      return `
🚀 CRAZYPLAN MODE ACTIVATED 🚀

Based on the following interview analysis data, create an AGGRESSIVE, PROJECT-BASED 30-DAY learning sprint for modern job seekers who don't have time for long-term preparation:

**THE REALITY FOR YOUNG PROFESSIONALS TODAY:**
- Traditional 6-month study plans are outdated for the AI-assisted era
- Young people need to SHIP PROJECTS, not just study theory
- Modern tools (ChatGPT, Claude, Cursor, v0.dev, Supabase, Vercel) enable 10x faster learning
- Companies care more about what you've BUILT than what you've studied

**Analysis Summary:**
- Total interview posts analyzed: ${insights.total_posts}
- Companies mentioned: ${topCompanies}
- Roles targeted: ${topRoles}
- Key skills mentioned: ${topSkills}
- Success rate: ${(insights.success_rate * 100 || 0).toFixed(1)}%

**User Goals:**
- Target role: ${userGoals.target_role || 'Not specified'}
- Target companies: ${userGoals.target_companies ? userGoals.target_companies.join(', ') : 'Not specified'}
- Experience level: ${userGoals.current_level || 'Intermediate'}
- Timeline: 30 DAYS (CrazyPlan)

**CRAZYPLAN PHILOSOPHY:**
1. BUILD 2-3 PORTFOLIO PROJECTS that directly relate to ${userGoals.target_role || 'your target role'}
2. Use AI tools to accelerate development (ChatGPT for architecture, Cursor for coding, v0 for UI)
3. Deploy LIVE projects (Vercel, Railway, Fly.io) - no localhost portfolios
4. Document your learning journey on Twitter/LinkedIn
5. Focus on SHIPPING over perfection

**Instructions:**
Create a JSON-formatted CRAZYPLAN learning map with 4 weeks of aggressive, project-focused milestones:

{
  "title": "30-Day [Role] Mastery Sprint with Real Projects",
  "summary": "Build, ship, and showcase 2-3 production projects in 30 days using modern AI-assisted development",
  "timeline_weeks": 4,
  "difficulty": "High Intensity",
  "milestones": [
    {
      "week": 1,
      "title": "Project 1: [Specific tool/app related to target role]",
      "description": "Design, build MVP, and deploy using [specific modern stack]",
      "skills": ["skill from analysis", "modern tool", "deployment"],
      "tasks": [
        "Day 1-2: Use ChatGPT to architect the project and create technical spec",
        "Day 3-5: Build core features with Cursor AI assistance",
        "Day 6-7: Deploy to production (Vercel/Railway) + document on GitHub"
      ],
      "resources": [
        "Cursor AI - AI-assisted coding",
        "v0.dev - Generate React components",
        "ChatGPT - Architecture & debugging",
        "Vercel/Railway - Free deployment"
      ]
    }
  ],
  "prerequisites": ["Basic programming knowledge", "GitHub account", "Willingness to learn fast"],
  "outcomes": [
    "2-3 live, deployed portfolio projects",
    "GitHub profile with consistent commits",
    "Technical blog posts documenting your journey",
    "Practical experience with modern AI-assisted development tools"
  ],
  "next_steps": [
    "Share projects on Twitter/LinkedIn with #BuildInPublic",
    "Apply to companies with portfolio links in resume",
    "Continue iterating on projects based on feedback"
  ]
}

**CRITICAL REQUIREMENTS FOR CRAZYPLAN:**
- Each milestone MUST include a concrete PROJECT to build
- Recommend specific AI tools (ChatGPT, Claude, Cursor, v0, Copilot) for acceleration
- Focus on SHIPPING and DEPLOYMENT, not just coding
- Include modern no-code/low-code tools where appropriate (Supabase, Firebase, Convex)
- Emphasize building in public and documenting the journey
- Projects should relate to the ${topSkills} skills and ${topRoles} roles from analysis
- Make it realistic but challenging - young people can move FAST with AI tools

Return ONLY the JSON object, no additional text.
`;
    }

    return `
Based on the following interview analysis data, create a personalized learning map for interview success:

**Analysis Summary:**
- Total interview posts analyzed: ${insights.total_posts}
- Companies mentioned: ${topCompanies}
- Roles targeted: ${topRoles}
- Key skills mentioned: ${topSkills}
- Success rate: ${(insights.success_rate * 100 || 0).toFixed(1)}%
- Average difficulty: ${insights.avg_difficulty || 'Unknown'}
- Personalization score: ${(insights.personalization_score || 0).toFixed(2)}
- Locations: ${locations}

**User Goals:**
- Target role: ${userGoals.target_role || 'Not specified'}
- Target companies: ${userGoals.target_companies ? userGoals.target_companies.join(', ') : 'Not specified'}
- Experience level: ${userGoals.current_level || 'Intermediate'}
- Timeline: ${userGoals.timeline_months || 6} months
- Focus areas: ${userGoals.focus_areas ? userGoals.focus_areas.join(', ') : 'Not specified'}

**Skill Gaps Identified:**
${insights.skill_gaps && insights.skill_gaps.length > 0 ?
  insights.skill_gaps.map(gap => `- ${gap.skill}: ${gap.reason}`).join('\n') :
  '- No significant skill gaps identified'}

**Recommended Focus Areas:**
${insights.recommended_focus && insights.recommended_focus.length > 0 ?
  insights.recommended_focus.map(rec => `- ${rec.area} (${rec.priority}): ${rec.reason}`).join('\n') :
  '- General interview preparation recommended'}

**Instructions:**
Create a JSON-formatted learning map with the following structure:
{
  "title": "Personalized interview success learning path title",
  "summary": "Brief summary based on the actual data analyzed and user goals",
  "timeline_weeks": 4-12 (based on user timeline and complexity),
  "difficulty": "Beginner/Intermediate/Advanced" (based on user level and analysis difficulty),
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
5. Address identified skill gaps and leverage recommended focus areas
6. Consider the success rate and difficulty level from the analysis data

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
  generateFallbackContent(insights, userGoals, isCrazyPlan = false) {
    const topCompanies = insights.companies ? insights.companies.slice(0, 3).map(c => c.name || c) : [];
    const topRoles = insights.roles ? insights.roles.slice(0, 3).map(r => r.name || r) : [];
    const topSkills = insights.skills_mentioned ? insights.skills_mentioned.slice(0, 8).map(s => s.name || s) : [];

    const timelineWeeks = isCrazyPlan ? 4 : Math.ceil((userGoals.timeline_months || 6) * 4.33); // Convert months to weeks

    if (isCrazyPlan) {
      return {
        title: `🚀 CrazyPlan: 30-Day ${topRoles[0] || userGoals.target_role || 'Tech'} Sprint`,
        summary: `AGGRESSIVE 30-DAY PLAN: Build 2-3 portfolio projects using AI tools. Ship fast, learn faster. Based on ${insights.total_posts} interview experiences targeting ${topCompanies.join(', ')||'top companies'}.`,
        timeline_weeks: 4,
        difficulty: "High Intensity",
        milestones: this.generateCrazyPlanMilestones(insights, userGoals, topCompanies, topRoles, topSkills),
        prerequisites: [
          "Basic programming knowledge",
          "GitHub account",
          "Willingness to learn FAST and ship projects"
        ],
        outcomes: [
          "2-3 live, deployed portfolio projects",
          "GitHub profile with consistent commits",
          "Practical experience with AI-assisted development (ChatGPT, Cursor, v0)",
          `Real-world ${topSkills.slice(0, 2).join(', ')} implementation experience`
        ],
        next_steps: [
          "Share projects on Twitter/LinkedIn with #BuildInPublic",
          `Apply to ${topCompanies.join(', ')||'target companies'} with portfolio links`,
          "Continue iterating on projects based on feedback",
          "Build project #4 based on what you learned"
        ]
      };
    }

    return {
      title: `Interview Success Path: ${topRoles[0] || userGoals.target_role || 'Tech Roles'} Focus`,
      summary: `Personalized learning journey based on analysis of ${insights.total_posts} interview experiences, targeting ${topCompanies.join(', ')} and similar companies. Success rate: ${(insights.success_rate * 100 || 0).toFixed(1)}%.`,
      timeline_weeks: Math.min(Math.max(timelineWeeks, 4), 12), // Between 4-12 weeks
      difficulty: userGoals.current_level || "Intermediate",
      milestones: this.generateFallbackMilestones(insights, userGoals, topCompanies, topRoles, topSkills),
      prerequisites: [
        `Basic understanding of ${topSkills[0] || 'required technologies'}`,
        "Resume and portfolio ready",
        "Clear career goals"
      ],
      outcomes: [
        `Increased confidence in ${topRoles[0] || userGoals.target_role || 'target role'} interviews`,
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
   * Generate CrazyPlan milestones (4-week aggressive project-based plan)
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @param {Array} topCompanies - Top companies from analysis
   * @param {Array} topRoles - Top roles from analysis
   * @param {Array} topSkills - Top skills from analysis
   * @returns {Array} Generated CrazyPlan milestones
   */
  generateCrazyPlanMilestones(insights, userGoals, topCompanies, topRoles, topSkills) {
    const targetRole = topRoles[0] || userGoals.target_role || 'Developer';
    const skill1 = topSkills[0] || 'React';
    const skill2 = topSkills[1] || 'Node.js';
    const skill3 = topSkills[2] || 'SQL';

    return [
      {
        week: 1,
        title: `Project 1: ${skill1} Portfolio App`,
        description: `Build and deploy a production-ready ${skill1} application related to ${targetRole} work. Use AI tools to accelerate development.`,
        skills: [skill1, "AI-assisted coding", "Git/GitHub", "Deployment"],
        tasks: [
          "Day 1-2: Use ChatGPT to design project architecture and create technical spec",
          "Day 3-5: Build MVP using Cursor AI for code assistance and v0.dev for UI components",
          "Day 6: Deploy to Vercel/Railway and set up custom domain",
          "Day 7: Write README, add screenshots, document journey on Twitter/LinkedIn"
        ],
        resources: [
          "Cursor AI - https://cursor.sh (AI pair programming)",
          "v0.dev - Generate React/Tailwind components",
          "ChatGPT - Architecture planning and debugging",
          "Vercel - Free deployment and hosting"
        ]
      },
      {
        week: 2,
        title: `Project 2: ${skill2} Backend Service`,
        description: `Create a full-stack application with ${skill2} backend. Focus on features relevant to ${topCompanies[0] || 'target companies'}.`,
        skills: [skill2, skill3, "API Design", "Database management"],
        tasks: [
          "Day 8-9: Use Claude/ChatGPT to design API architecture and data models",
          "Day 10-12: Build backend with Cursor, use Supabase/Firebase for quick database setup",
          "Day 13: Integrate with Week 1 frontend OR build simple admin dashboard",
          "Day 14: Deploy, add authentication, document API with Postman/Swagger"
        ],
        resources: [
          "Supabase - Instant PostgreSQL database",
          "Railway.app - Deploy Node.js/Python backends",
          "Postman - API testing and documentation",
          "GitHub Actions - Set up basic CI/CD"
        ]
      },
      {
        week: 3,
        title: `Project 3: Industry-Specific Tool`,
        description: `Build a tool that solves a real problem in ${targetRole} domain. This becomes your portfolio showpiece.`,
        skills: [skill1, skill2, "Problem-solving", "Product thinking"],
        tasks: [
          "Day 15-16: Research pain points in ${targetRole} work, design solution with AI",
          "Day 17-19: Rapid development using full AI toolkit (ChatGPT + Cursor + Copilot)",
          "Day 20: Polish UI/UX, add analytics, deploy with monitoring",
          "Day 21: Create demo video, write detailed case study blog post"
        ],
        resources: [
          "Product Hunt - Research similar tools",
          "Loom - Record demo videos",
          "Vercel Analytics - Track usage",
          "Medium/Dev.to - Publish case study"
        ]
      },
      {
        week: 4,
        title: "Portfolio Polish & Job Applications",
        description: "Finalize all projects, create compelling portfolio site, and start applying with real projects.",
        skills: ["Portfolio presentation", "Resume writing", "Networking"],
        tasks: [
          "Day 22-23: Build portfolio website showcasing all 3 projects (use v0.dev for quick design)",
          "Day 24: Update resume with project links, add metrics (users, features, tech stack)",
          "Day 25-26: Apply to 20+ positions at ${topCompanies.join(', ')||'target companies'} with portfolio",
          "Day 27: Network on LinkedIn, share #BuildInPublic journey",
          "Day 28: Prep for interviews, review projects, prepare to demo live"
        ],
        resources: [
          "v0.dev - Quick portfolio site",
          "Resume.io - ATS-friendly resume templates",
          "LinkedIn - Connect with engineers at target companies",
          "Levels.fyi - Research salary expectations"
        ]
      }
    ];
  }

  /**
   * Generate fallback milestones for learning map
   * @param {Object} insights - Extracted insights
   * @param {Object} userGoals - User goals
   * @param {Array} topCompanies - Top companies from analysis
   * @param {Array} topRoles - Top roles from analysis
   * @param {Array} topSkills - Top skills from analysis
   * @returns {Array} Generated milestones
   */
  generateFallbackMilestones(insights, userGoals, topCompanies, topRoles, topSkills) {
    const milestones = [
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
      }
    ];

    // Add more milestones based on timeline
    const timelineWeeks = Math.ceil((userGoals.timeline_months || 6) * 4.33);

    if (timelineWeeks >= 3) {
      milestones.push({
        week: 3,
        title: "Interview Format Preparation",
        description: "Prepare for technical and behavioral interview formats",
        skills: ["Technical Interviews", "Behavioral Interviews", "System Design"],
        tasks: [
          "Practice coding interviews with time constraints",
          "Prepare STAR method responses for behavioral questions",
          "Study system design patterns and case studies"
        ],
        resources: ["LeetCode", "Behavioral interview guides", "System design resources"]
      });
    }

    if (timelineWeeks >= 4) {
      milestones.push({
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
      });
    }

    return milestones;
  }
}

module.exports = new AIContentService();