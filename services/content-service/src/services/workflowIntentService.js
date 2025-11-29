const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenRouter client
const openrouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://redcube-xhs.local',
    'X-Title': 'RedCube XHS Analysis Platform'
  }
});

/**
 * Extract JSON from LLM response with markdown cleanup
 */
function extractJsonFromString(str) {
  try {
    return JSON.parse(str.trim());
  } catch (error) {
    let cleanStr = str
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/`/g, '')
      .trim();

    const firstBrace = cleanStr.indexOf('{');
    const lastBrace = cleanStr.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanStr = cleanStr.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleanStr);
  }
}

/**
 * Analyze user's workflow search intent using LLM
 * Extracts entities (company, role, level, outcome, etc.) and generates action suggestions
 *
 * @param {string} query - User's search query (e.g., "amazon swe", "google l4 system design")
 * @returns {Promise<Object>} Intent analysis result with quick actions and entity extraction
 */
async function analyzeWorkflowIntent(query) {
  console.log('[WorkflowIntentService] Analyzing query:', query);

  const prompt = `You are a professional workflow assistant for an interview analysis platform. Analyze the user's search query and extract structured information.

User query: "${query}"

Your task:
1. Extract entities from the query (company, role, level, interview type, outcome filter, quality filter)
2. **CRITICAL**: Generate a simplified "searchQuery" - convert natural language to concise search terms
3. Generate 2-3 actionable "Quick Actions" that the user likely wants to perform
4. Suggest related searches if applicable

Response format (JSON only, no markdown):
{
  "searchQuery": "simplified search terms for database query",
  "entities": {
    "companies": ["string"],
    "roles": ["string"],
    "levels": ["string"],
    "interviewTypes": ["string"],
    "outcomeFilter": "passed|failed|null",
    "qualityFilter": "high|null"
  },
  "quickActions": [
    {
      "type": "analyze",
      "label": "Analyze Google SWE interview experiences",
      "data": {
        "query": "simplified search query",
        "analysisType": "single|batch",
        "entities": { "company": "Google", "role": "SWE" }
      }
    }
  ],
  "suggestions": [
    "Analyze best quality Google SWE posts",
    "Compare Google vs Amazon SWE interviews"
  ]
}

Rules:
- **searchQuery**: Simplify natural language to core search terms. Examples:
  * "I wanna know about Google SWE interview questions" → "Google SWE interview questions"
  * "Show me recent Amazon software engineer posts" → "Amazon software engineer"
  * "What are the interview experiences at Meta?" → "Meta interview experiences"
- "analyze" action: Creates workflow to analyze posts matching the query
- analysisType: "single" if query is specific to one company/role, "batch" if comparing multiple companies or analyzing trends
- If query mentions "failed" or "rejected", set outcomeFilter to "failed"
- If query mentions "best quality" or "high quality", set qualityFilter to "high"
- Keep action labels clear, concise, and professional (no emojis)
- Suggestions should be relevant expansions or variations of the query
- **ALWAYS include searchQuery field** - this is used for database semantic search

Examples:
Query: "amazon swe"
→ searchQuery: "Amazon SWE"
→ Action: "Analyze Amazon SWE interview experiences"
→ Type: single

Query: "I wanna know about Google SWE interview questions"
→ searchQuery: "Google SWE interview questions"
→ Action: "Analyze Google SWE interview experiences"
→ Type: single

Query: "google l4 system design"
→ searchQuery: "Google L4 system design"
→ Action: "Analyze Google L4 System Design interviews"
→ Type: single

Query: "Show me failed meta interviews"
→ searchQuery: "Meta interview failed"
→ Action: "Analyze failed Meta interview experiences"
→ Type: single, outcomeFilter: "failed"

Query: "amazon swe, google swe, meta swe"
→ searchQuery: "Amazon Google Meta SWE"
→ Action: "Compare Amazon, Google, and Meta SWE interviews"
→ Type: batch

Query: "best quality amazon swe post"
→ searchQuery: "Amazon SWE"
→ Action: "Analyze highest quality Amazon SWE posts"
→ Type: single, qualityFilter: "high"

Now analyze the user's query and respond with JSON only.`;

  try {
    const response = await openrouterClient.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional intent analysis assistant. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    console.log('[WorkflowIntentService] LLM response:', content.substring(0, 200) + '...');

    const intentResult = extractJsonFromString(content);

    // Validate structure
    if (!intentResult.entities || !intentResult.quickActions) {
      throw new Error('Invalid intent result structure');
    }

    console.log('[WorkflowIntentService] Parsed intent:', JSON.stringify(intentResult, null, 2));

    return {
      success: true,
      intent: intentResult
    };

  } catch (error) {
    console.error('[WorkflowIntentService] Error analyzing intent:', error);

    // Fallback: Return basic structure from simple parsing
    return {
      success: false,
      intent: {
        entities: {
          companies: extractCompanies(query),
          roles: extractRoles(query),
          levels: [],
          interviewTypes: [],
          outcomeFilter: query.toLowerCase().includes('failed') ? 'failed' : null,
          qualityFilter: query.toLowerCase().includes('best') || query.toLowerCase().includes('high quality') ? 'high' : null
        },
        quickActions: [
          {
            type: 'analyze',
            label: `Analyze ${query} interview experiences`,
            data: {
              query,
              analysisType: 'single',
              entities: {}
            }
          }
        ],
        suggestions: []
      },
      error: error.message
    };
  }
}

/**
 * Simple fallback entity extraction (used when LLM fails)
 */
function extractCompanies(query) {
  const companies = ['amazon', 'google', 'meta', 'facebook', 'microsoft', 'apple', 'netflix', 'uber', 'airbnb', 'tesla'];
  const found = [];

  const lowerQuery = query.toLowerCase();
  companies.forEach(company => {
    if (lowerQuery.includes(company)) {
      found.push(company.charAt(0).toUpperCase() + company.slice(1));
    }
  });

  return found;
}

function extractRoles(query) {
  const roles = ['swe', 'software engineer', 'sde', 'pm', 'product manager', 'data scientist', 'ml engineer'];
  const found = [];

  const lowerQuery = query.toLowerCase();
  roles.forEach(role => {
    if (lowerQuery.includes(role)) {
      found.push(role.toUpperCase());
    }
  });

  return found;
}

module.exports = {
  analyzeWorkflowIntent
};
