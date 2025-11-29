const { analyzeWithOpenRouter } = require('../services/aiService');
const { semanticSearch } = require('../services/embeddingService');

/**
 * Handle AI Assistant query with intelligent routing
 * - Agent execution → Autonomous analysis and report generation
 * - Interview search → Search and provide relevant posts
 * - App usage questions → Provide help
 * - Personal/emotional → Empathetic redirect
 * - General → Conversational response
 */
async function queryAssistant(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    console.log('[AI Assistant] Processing query:', query);

    // Step 1: Classify the query intent
    const classification = await classifyQuery(query);
    console.log('[AI Assistant] Query classified as:', classification.type);

    // Step 2: Handle based on intent
    let response;
    switch (classification.type) {
      case 'agent_execution':
        response = await handleAgentExecution(query, classification);
        break;
      case 'interview_search':
        response = await handleInterviewSearch(query, classification);
        break;
      case 'app_help':
        response = await handleAppHelp(query);
        break;
      case 'personal':
        response = await handlePersonalQuery(query);
        break;
      default:
        response = await handleGeneralQuery(query);
    }

    console.log('[AI Assistant] Response generated:', {
      type: classification.type,
      hasActions: response.actions?.length > 0
    });

    res.json({
      success: true,
      response: response.message,
      actions: response.actions || [],
      type: classification.type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Assistant] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process assistant query',
      message: error.message
    });
  }
}

/**
 * Classify user query into intent categories using LLM
 */
async function classifyQuery(query) {
  const prompt = `You are an intent classifier for an interview prep assistant. Analyze the user's query and determine their intent.

Query: "${query}"

Intent Categories:
1. agent_execution - User COMMANDS you to perform analysis/comparison (imperative verbs: "analyze", "compare", "generate report for X company")
2. interview_search - User wants to FIND/SEE interview posts (verbs: "show", "find", "search")
3. app_help - User ASKS HOW TO use features (question words: "how do I", "how can I", "what are the steps", "can you explain")
4. personal - Personal/emotional statements (feelings, experiences, not asking for action)
5. general - Greetings, chitchat, unclear intent

Critical Rules:
- "How do I [action]?" → app_help (NOT agent_execution)
- "What are the best [X]?" → app_help (NOT agent_execution)
- "[Company] interview tips?" → app_help (NOT agent_execution)
- "Analyze [Company]" → agent_execution
- "Compare [A] vs [B]" → agent_execution
- "Show me [Company] interviews" → interview_search

Examples:
✓ "How do I create a learning map?" → app_help
✓ "What are the best Google interview prep tips?" → app_help
✓ "Can you explain how learning maps work?" → app_help
✓ "Compare Google vs Amazon SWE" → agent_execution
✓ "Analyze Microsoft interviews" → agent_execution
✓ "Show me Amazon posts" → interview_search
✓ "Hello" → general

Respond with ONLY ONE word: agent_execution, interview_search, app_help, personal, or general.`;

  try {
    const response = await analyzeWithOpenRouter(prompt, {
      model: 'openai/gpt-4o-mini',
      max_tokens: 50,
      temperature: 0.1
    });

    const type = response.trim().toLowerCase();
    console.log('[AI Assistant] Classification result:', { query, type });
    return { type };
  } catch (error) {
    console.error('[AI Assistant] Classification error:', error);
    return { type: 'general' };
  }
}

/**
 * Handle interview search queries
 */
async function handleInterviewSearch(query, classification) {
  // Search for relevant posts
  const posts = await semanticSearch(query, {
    matchCount: 5,
    matchThreshold: 0.5
  });

  console.log(`[AI Assistant] Found ${posts.length} relevant posts`);

  // Generate response with LLM - pass all 5 posts to LLM for better context
  const postsContext = posts.map((p, i) =>
    `${i + 1}. ${p.title} (${p.company || 'Unknown'} - ${p.role_type || 'N/A'})`
  ).join('\n');

  const prompt = `You are an interview prep assistant. User asked: "${query}"

I found these relevant interview experiences:
${postsContext}

Provide a helpful 2-3 sentence response summarizing what we found. Be encouraging and specific.`;

  const message = await analyzeWithOpenRouter(prompt, {
    model: 'openai/gpt-4o-mini',
    max_tokens: 200,
    temperature: 0.7
  });

  // Create actions
  const actions = [];
  if (posts.length > 0) {
    actions.push({
      type: 'view_posts',
      label: `View ${posts.length} relevant interview experiences`,
      data: { posts: posts.slice(0, 5) }
    });
  }

  return { message, actions };
}

/**
 * Handle app help queries
 */
async function handleAppHelp(query) {
  const helpPrompt = `You are a helpful assistant for an interview analysis platform. User asked: "${query}"

Our app allows users to:
- Search and analyze interview experiences from Reddit
- Create learning maps for interview preparation
- View analytics and trends about interviews
- Use AI search to find relevant interview posts

Provide a clear, concise answer (2-3 sentences) about how to use the feature they're asking about.`;

  const message = await analyzeWithOpenRouter(helpPrompt, {
    model: 'openai/gpt-4o-mini',
    max_tokens: 200,
    temperature: 0.7
  });

  const actions = [{
    type: 'help_link',
    label: 'View documentation',
    data: { url: '/help' }
  }];

  return { message, actions };
}

/**
 * Handle personal/emotional queries
 */
async function handlePersonalQuery(query) {
  const empathyPrompt = `User shared something personal: "${query}"

Respond with empathy and gently redirect them to use our interview prep platform. Keep it warm, supportive, and brief (2-3 sentences).`;

  const message = await analyzeWithOpenRouter(empathyPrompt, {
    model: 'openai/gpt-4o-mini',
    max_tokens: 150,
    temperature: 0.8
  });

  return { message, actions: [] };
}

/**
 * Handle general queries
 */
async function handleGeneralQuery(query) {
  const generalPrompt = `You are a friendly assistant for an interview prep platform. User said: "${query}"

Respond conversationally and briefly (1-2 sentences). If appropriate, mention that you can help them search interview experiences or create study plans.`;

  const message = await analyzeWithOpenRouter(generalPrompt, {
    model: 'openai/gpt-4o-mini',
    max_tokens: 150,
    temperature: 0.8
  });

  return { message, actions: [] };
}

/**
 * Handle autonomous agent execution requests
 * Returns workflow structure for frontend to auto-execute
 */
async function handleAgentExecution(query, classification) {
  console.log('[AI Assistant] Starting autonomous agent execution for:', query);

  // Step 1: Extract entities from query
  const extractionPrompt = `Extract the companies from this query:

Query: "${query}"

Return ONLY valid JSON (no markdown, no code blocks):
{"companies": ["Company1", "Company2"]}

If no companies are mentioned, return: {"companies": []}`;

  let entities;
  try {
    let extraction = await analyzeWithOpenRouter(extractionPrompt, {
      model: 'openai/gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.1
    });

    // Strip markdown code blocks if present
    extraction = extraction.trim();
    if (extraction.startsWith('```')) {
      extraction = extraction.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
    }

    entities = JSON.parse(extraction);
    console.log('[AI Assistant] Extracted entities:', entities);

    // VALIDATION: If no companies found, this shouldn't be agent_execution
    if (!entities.companies || entities.companies.length === 0) {
      console.log('[AI Assistant] No companies found - routing to app help instead');
      return await handleAppHelp(query);
    }
  } catch (error) {
    console.error('[AI Assistant] Entity extraction failed:', error);
    return {
      message: 'Sorry, I had trouble understanding your request. Could you rephrase it?',
      actions: []
    };
  }

  // Step 2: Search for posts for each company
  console.log('[AI Assistant] Searching for posts...');
  const allPosts = [];
  const seenPostIds = new Set(); // Track unique post IDs to prevent duplicates

  for (const company of entities.companies) {
    const searchQuery = `${company} software engineer interview`;
    const posts = await semanticSearch(searchQuery, {
      matchCount: 3,  // 3 posts per company for workflow (faster analysis)
      matchThreshold: 0.4,
      filterCompany: company
    });
    console.log(`[AI Assistant] Found ${posts.length} posts for ${company}`);

    // Deduplicate: only add posts we haven't seen before
    for (const post of posts) {
      if (!seenPostIds.has(post.post_id)) {
        seenPostIds.add(post.post_id);
        allPosts.push({ ...post, _company: company });
      } else {
        console.log(`[AI Assistant] Skipping duplicate post: ${post.post_id}`);
      }
    }
  }

  if (allPosts.length === 0) {
    return {
      message: `I couldn't find any interview posts for ${entities.companies.join(' or ')}. Try searching for different companies or check the Workflow Lab for more posts.`,
      actions: []
    };
  }

  console.log('[AI Assistant] Agent execution complete - found', allPosts.length, 'unique posts (deduplicated)');

  // Step 3: Return workflow data for frontend to build canvas + auto-analyze
  const analysisType = entities.companies.length > 1 ? 'batch' : 'single';

  return {
    message: `I found ${allPosts.length} relevant posts for ${entities.companies.join(' and ')}. I'll add them to your canvas and run ${analysisType} analysis automatically.`,
    actions: [{
      type: 'execute_workflow',
      label: `Analyzing ${allPosts.length} posts automatically...`,
      data: {
        companies: entities.companies,
        posts: allPosts,
        analysisType,  // 'single' or 'batch'
        autoExecute: true,  // Signal to frontend to auto-run analysis
        query
      }
    }]
  };
}

/**
 * Get assistant capabilities and status
 */
function getAssistantInfo(req, res) {
  res.json({
    status: 'operational',
    capabilities: [
      'Autonomous analysis and report generation',
      'Interview experience search',
      'App usage help',
      'Empathetic conversation',
      'Context-aware assistance',
      'Action suggestions'
    ],
    models: ['openai/gpt-4o-mini'],
    version: '3.0.0'
  });
}

module.exports = {
  queryAssistant,
  getAssistantInfo
};
