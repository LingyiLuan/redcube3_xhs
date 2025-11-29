const crypto = require('crypto');
const { analyzeText } = require('../services/aiService');
const { analyzeBatchWithConnections, analyzeBatchWithHybrid } = require('../services/analysisService');
const { extractMetadataBatch } = require('../services/hybridExtractionService');
const { saveAnalysisResult, getAnalysisHistory, updateAnalysisFullResult } = require('../database/analysisQueries');
const { saveConnections } = require('../database/connectionQueries');
const { analyzeSchema, batchAnalyzeSchema } = require('../utils/validation');
const { generateEmbedding } = require('../services/embeddingService');
const { findCompanyInText } = require('../config/companyMappings');
const { extractInterviewQuestions } = require('../services/questionExtractionService');
const { matchQuestionToLeetCode } = require('../services/leetcodeMatcherService');
const { generateTemporalIntelligence } = require('../services/temporalTrendAnalysisService');
const { generateEnhancedIntelligence } = require('../services/enhancedIntelligenceService');
const benchmarkCacheService = require('../services/benchmarkCacheService');
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Single post analysis controller
 * Now includes RAG-based similar posts analysis
 */
async function analyzeSinglePost(req, res) {
  try {
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text } = value;

    // Use authenticated user's ID from middleware, fallback to 1 if not available
    const userId = req.user?.id || 1;

    console.log(`🔍 ANALYSIS CONTROLLER - Single Post (NEW RAG PIPELINE):`);
    console.log(`  - req.user exists: ${!!req.user}`);
    console.log(`  - User ID: ${userId}`);

    if (req.user) {
      console.log(`  - User Email: ${req.user.email}`);
    } else {
      console.log(`  - WARNING: No req.user found, using fallback userId = 1`);
    }

    // ===== STEP 1: AI Extraction =====
    logger.info('[Single Analysis] STEP 1: AI extraction...');
    const analysisResult = await analyzeText(text);
    const savedResult = await saveAnalysisResult(text, analysisResult, userId);

    // ===== STEP 2: Embedding Generation =====
    logger.info('[Single Analysis] STEP 2: Generating embedding for RAG search...');
    let patternAnalysis = null;

    try {
      const embedding = await generateEmbedding(text);

      // ===== STEP 3: RAG Retrieval =====
      logger.info('[Single Analysis] STEP 3: Finding similar posts via pgvector...');
      const similarPosts = await findSimilarPostsByEmbedding(embedding, 50); // Same as batch (50 posts)

      if (similarPosts.length > 0) {
        logger.info(`[Single Analysis] Found ${similarPosts.length} similar posts`);

        // ===== STEP 4: Pattern Extraction (SAME AS BATCH!) =====
        logger.info('[Single Analysis] STEP 4: Computing patterns using computeMultiPostPatterns()...');

        // Tag seed post (user's input) with post_source: 'seed'
        const seedPostTagged = [{
          ...analysisResult,
          id: savedResult.id,
          post_source: 'seed',
          created_at: savedResult.created_at,
          role_type: analysisResult.role, // Map role to role_type for consistency
          original_text: text
        }];

        // Tag RAG posts with post_source: 'rag' and add similarity score
        const ragPostsTagged = similarPosts.map(post => ({
          ...post,
          post_source: 'rag',
          similarity: post.distance
        }));

        // Merge seed + RAG posts (SAME AS BATCH)
        const allPostsForAnalysis = [...seedPostTagged, ...ragPostsTagged];

        // Extract seed companies and roles
        const seedCompanies = new Set([analysisResult.company].filter(Boolean));
        const seedRoles = new Set([analysisResult.role].filter(Boolean));

        // ✅ USE THE SAME FUNCTION AS BATCH ANALYSIS
        patternAnalysis = await computeMultiPostPatterns(
          allPostsForAnalysis,
          seedCompanies,
          seedRoles,
          ragPostsTagged
        );

        logger.info('[Single Analysis] ✅ Pattern analysis complete - using SAME pipeline as batch!');
      } else {
        logger.warn('[Single Analysis] No similar posts found - skipping pattern extraction');
      }

    } catch (embeddingError) {
      logger.warn('[Single Analysis] RAG analysis skipped - embedding service unavailable:', embeddingError.message);
      // Continue without RAG analysis - basic analysis still works
    }

    // ===== STEP 5: Format Response (Extract from Pattern Analysis) =====
    logger.info(`[Single Analysis] STEP 5: Formatting Single Post Analysis response for analysisId: ${savedResult.id}`);

    // Helper function to extract success rate for user's company/role
    const getIndustrySuccessRate = () => {
      if (!patternAnalysis) return null;

      // Try company-specific success rate first
      if (analysisResult.company && patternAnalysis.company_trends) {
        const companyData = patternAnalysis.company_trends.find(
          ct => ct.company && ct.company.toLowerCase() === analysisResult.company.toLowerCase()
        );
        if (companyData && companyData.success_rate !== 'N/A') {
          return parseFloat(companyData.success_rate);
        }
      }

      // Fallback to role-specific success rate
      if (analysisResult.role && patternAnalysis.role_breakdown) {
        const roleData = patternAnalysis.role_breakdown.find(
          rb => rb.role && rb.role.toLowerCase() === analysisResult.role.toLowerCase()
        );
        if (roleData && roleData.success_rate !== 'N/A') {
          return parseFloat(roleData.success_rate);
        }
      }

      // Fallback to overall success rate
      if (patternAnalysis.summary && patternAnalysis.summary.overall_success_rate) {
        return parseFloat(patternAnalysis.summary.overall_success_rate);
      }

      return null;
    };

    const industrySuccessRate = getIndustrySuccessRate();

    const response = {
      id: savedResult.id,
      createdAt: savedResult.created_at,
      aiProvider: 'OpenRouter',

      // Section 1: Overview
      overview: {
        company: analysisResult.company || null,
        role: analysisResult.role || null,
        outcome: analysisResult.outcome || null,
        difficulty: analysisResult.difficulty || null,
        interviewDate: savedResult.created_at,
        stages: null
      },

      // Section 2: Benchmark (extracted from pattern_analysis)
      benchmark: patternAnalysis ? {
        successRate: {
          industry: industrySuccessRate,
          userOutcome: analysisResult.outcome || null
        },
        difficulty: {
          userRating: analysisResult.difficulty || null,
          industryAverage: null, // Can be extracted from patternAnalysis.difficulty_by_company if needed
          interpretation: null
        },
        stageBreakdown: null
      } : null,

      // Section 3: Skills (extracted from pattern_analysis.skill_frequency)
      skills: patternAnalysis && patternAnalysis.skill_frequency ? {
        tested: patternAnalysis.skill_frequency.slice(0, 10).map(skill => ({
          name: skill.skill,
          frequency: parseInt(skill.count),
          performance: patternAnalysis.skill_success_correlation?.[skill.skill] || null,
          benchmark: {
            successRate: patternAnalysis.skill_success_correlation?.[skill.skill]
              ? Math.round(patternAnalysis.skill_success_correlation[skill.skill] * 100)
              : null,
            percentile: null
          }
        }))
      } : {
        tested: analysisResult.technical_skills ? analysisResult.technical_skills.map(skill => ({
          name: skill,
          frequency: 1,
          performance: null,
          benchmark: { successRate: null, percentile: null }
        })) : []
      },

      // Section 4: Questions (extracted from pattern_analysis.interview_questions)
      questions: patternAnalysis && patternAnalysis.interview_questions
        ? patternAnalysis.interview_questions.slice(0, 20).map(q => ({
            question: q.text,
            frequency: q.frequency,
            company: q.company,
            difficulty: q.difficulty,
            successRate: q.successRate,
            category: q.category,
            topics: q.topics || []
          }))
        : null,

      // Section 5: Similar Experiences (extracted from pattern_analysis.source_posts)
      similarExperiences: patternAnalysis && patternAnalysis.source_posts
        ? patternAnalysis.source_posts
            .filter(p => p.post_source === 'rag')
            .slice(0, 50)  // Return all 50 RAG posts
            .map(post => ({
              id: post.post_id,
              company: post.company,
              role: post.role_type,
              outcome: post.outcome,
              difficulty: post.difficulty,
              keySkills: post.tech_stack || [],
              summary: post.summary || post.body_text?.substring(0, 150) + '...',
              followUp: null
            }))
        : [],

      // Add type field so frontend knows this is a single analysis
      type: 'single',

      // ADDED: Full pattern_analysis object for advanced UI sections (Executive Summary, Interview Questions Intelligence, etc.)
      // This allows SinglePostAnalysisViewer to use the same batch-style sections
      // ENHANCED: Add seed-specific fields for "Your Interview Experience" section
      pattern_analysis: patternAnalysis ? {
        ...patternAnalysis,
        // Seed post data (user's own interview experience)
        seed_company: analysisResult.company || null,
        seed_role: analysisResult.role || null,
        seed_difficulty: analysisResult.difficulty || null,
        seed_outcome: analysisResult.outcome || null,
        seed_skills: analysisResult.technical_skills || [],
        seed_questions: analysisResult.interview_questions || [],
        seed_original_text: text,
        // Compute outcome_distribution from source_posts
        outcome_distribution: patternAnalysis.source_posts ? (() => {
          const outcomes = { success: 0, failure: 0, unknown: 0 };
          patternAnalysis.source_posts.forEach(post => {
            if (post.outcome === 'offer' || post.outcome === 'passed') {
              outcomes.success++;
            } else if (post.outcome === 'rejected' || post.outcome === 'failed') {
              outcomes.failure++;
            } else {
              outcomes.unknown++;
            }
          });
          const total = outcomes.success + outcomes.failure;
          const successRate = total > 0 ? ((outcomes.success / total) * 100).toFixed(1) + '%' : 'N/A';
          return { ...outcomes, success_rate: successRate };
        })() : null
      } : null
    };

    try {
      await updateAnalysisFullResult(savedResult.id, response);
    } catch (updateError) {
      logger.warn('[Single Analysis] Failed to persist full result:', updateError.message);
    }

    // DEBUG: Log what we're sending to frontend
    console.log('[Single Analysis] 🔍 SENDING RESPONSE TO FRONTEND:');
    console.log('  - seed_company:', response.pattern_analysis?.seed_company);
    console.log('  - seed_role:', response.pattern_analysis?.seed_role);
    console.log('  - seed_skills:', response.pattern_analysis?.seed_skills);
    console.log('  - seed_questions count:', response.pattern_analysis?.seed_questions?.length);
    console.log('  - seed_original_text:', response.pattern_analysis?.seed_original_text ? 'exists' : 'null');

    res.json(response);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Batch analysis controller
 */
async function analyzeBatchPosts(req, res) {
  try {
    const { error, value } = batchAnalyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { posts, analyzeConnections = true } = value;
    // Use authenticated user's ID from middleware, fallback to 1 if not available
    const userId = req.user?.id || 1;

    // Generate deterministic batchId based on post content
    // Same posts → Same batchId → Cache hit
    const contentHash = crypto
      .createHash('sha256')
      .update(posts.map(p => p.text).sort().join('|'))
      .digest('hex')
      .substring(0, 16);
    const batchId = `batch_${userId}_${contentHash}`;

    logger.info(`[Batch Analysis] Generated deterministic batchId: ${batchId}`);

    console.log(`🔍 ANALYSIS CONTROLLER - Batch Posts:`);
    console.log(`  - req.user exists: ${!!req.user}`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Batch size: ${posts.length}`);
    console.log(`  - Posts metadata (first 2):`, posts.slice(0, 2).map(p => ({
      id: p.id,
      company: p.company,
      title: p.title,
      url: p.url,
      hasText: !!p.text
    })));

    if (req.user) {
      console.log(`  - User Email: ${req.user.email}`);
    } else {
      console.log(`  - WARNING: No req.user found, using fallback userId = 1`);
    }

    const startTime = Date.now();
    let result;
    let ragPosts = []; // Initialize at function scope
    let patternAnalysis, userPostEmbeddings; // Initialize at function scope for degraded mode tracking
    let extractionMethod = 'llm'; // Track which extraction method succeeded (function scope)
    let extractionError = null; // Track any errors for user notification (function scope)

    if (analyzeConnections && posts.length > 1) {
      // STEP 1: Individual Analysis with NER Fallback
      console.time('⏱️  STEP 1: AI Extraction with NER Fallback');
      logger.info('[Batch Analysis] Attempting LLM extraction with NER fallback');

      try {
        // Try LLM extraction first (preferred for complete data)
        result = await analyzeBatchWithConnections(posts);
        logger.info('✅ [Batch Analysis] LLM extraction succeeded');
        extractionMethod = 'llm';
      } catch (llmError) {
        // LLM failed - fallback to NER (degraded mode)
        logger.warn(`⚠️ [Batch Analysis] LLM extraction failed: ${llmError.message}`);
        logger.info('🔄 [Batch Analysis] Falling back to NER extraction (degraded mode)');

        extractionError = {
          type: 'llm_failure',
          message: llmError.message,
          fallback: 'ner'
        };

        try {
          // Use NER-based extraction (free, but limited features)
          result = await analyzeBatchWithHybrid(posts);
          logger.info('✅ [Batch Analysis] NER extraction succeeded (degraded mode)');
          extractionMethod = 'ner';
        } catch (nerError) {
          // Both LLM and NER failed - cannot continue
          logger.error(`❌ [Batch Analysis] Both LLM and NER extraction failed`);
          logger.error(`   LLM error: ${llmError.message}`);
          logger.error(`   NER error: ${nerError.message}`);

          throw new Error(
            'Unable to extract interview details from your posts. ' +
            'Please ensure your posts mention company names and try again later. ' +
            `Details: LLM failed (${llmError.message}), NER failed (${nerError.message})`
          );
        }
      }

      console.timeEnd('⏱️  STEP 1: AI Extraction with NER Fallback');

      // STEP 2: Skip Database Saves for Batch Analysis
      // ⚠️ IMPORTANT: Batch analysis reports are NOT saved to analysis_results table
      // They only exist in:
      // 1. Backend cache (batch_analysis_cache table) - for pattern_analysis
      // 2. Frontend localStorage - for the complete report
      //
      // Why? Saving individual analyses creates duplicate records that get fetched
      // on login and loaded into localStorage, causing non-deterministic behavior.
      //
      // For single post analysis, we DO save to analysis_results (see analyzeSinglePost).
      console.time('⏱️  STEP 2: Prepare Analyses (No DB Save)');
      logger.info('[Batch Analysis] ⚠️ SKIPPING database saves - batch reports live in cache + localStorage only');

      const savedAnalyses = [];
      for (const analysis of result.individual_analyses) {
        // Add synthetic ID and timestamp for consistency with single analysis
        savedAnalyses.push({
          ...analysis,
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary ID (not persisted)
          createdAt: new Date().toISOString(),
          role_type: analysis.role // Map role to role_type for consistency
        });
      }

      result.individual_analyses = savedAnalyses;

      // Skip connection saves for batch analysis
      // Connections are only computed for the pattern_analysis, not persisted
      logger.info('[Batch Analysis] ⚠️ SKIPPING connection saves - computed for analysis only');
      console.timeEnd('⏱️  STEP 2: Prepare Analyses (No DB Save)');

      // STEP 2.5: Check Cache for Deterministic Results
      // ⚠️ CACHE DISABLED: Database constantly changes with new scraping
      // Force fresh analysis every time to reflect latest data
      console.time('⏱️  STEP 2.5: Cache Check');
      // const cachedData = await getCachedBatchData(batchId); // DISABLED
      const cachedData = null; // Force cache miss every time
      console.timeEnd('⏱️  STEP 2.5: Cache Check');

      // CRITICAL: Don't re-declare ragPosts/patternAnalysis/userPostEmbeddings
      // Re-declaring with 'let' creates variable shadowing bug
      // These are already declared at function scope (lines 133-134)

      if (cachedData && cachedData.patternAnalysis) {
        // CACHE HIT: Use cached pattern_analysis (fully deterministic)
        logger.info(`[Cache HIT] Using cached pattern_analysis for batch ${batchId}`);
        patternAnalysis = cachedData.patternAnalysis;

        // Extract metadata from cached pattern_analysis
        const seedCompaniesFromCache = patternAnalysis.seed_companies || [];

        result.pattern_analysis = patternAnalysis;
        result.rag_metadata = {
          seed_posts: savedAnalyses.length,
          rag_posts: patternAnalysis.summary?.total_posts_analyzed - savedAnalyses.length || 0,
          total_posts: patternAnalysis.summary?.total_posts_analyzed || savedAnalyses.length,
          seed_companies: seedCompaniesFromCache,
          cache_hit: true
        };

        // ===== CRITICAL FIX: Retrieve RAG posts even on cache HIT =====
        // The pattern_analysis is cached, but we still need the actual similar_posts
        // for the frontend modal to display
        logger.info(`[Cache HIT] Retrieving RAG posts for modal display...`);
        if (cachedData && cachedData.userPostEmbeddings) {
          userPostEmbeddings = cachedData.userPostEmbeddings;
          ragPosts = await retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, 50);
        } else {
          ragPosts = await retrieveSimilarPostsForBatch(posts, 50);
        }
        logger.info(`[Cache HIT] Retrieved ${ragPosts?.length || 0} RAG posts for frontend modal`);

        // ===== DEBUG: Log ragPosts IMMEDIATELY after retrieval =====
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[DEBUG CACHE HIT] ragPosts IMMEDIATELY after retrieval (line 209)`);
        console.log(`${'='.repeat(80)}`);
        console.log(`[DEBUG] ragPosts length: ${ragPosts?.length || 0}`);
        console.log(`[DEBUG] ragPosts is Array: ${Array.isArray(ragPosts)}`);
        console.log(`[DEBUG] ragPosts type: ${typeof ragPosts}`);
        if (ragPosts && ragPosts.length > 0) {
          console.log(`[DEBUG] First ragPost:`, {
            post_id: ragPosts[0].post_id,
            company: ragPosts[0].company,
            role_type: ragPosts[0].role_type,
            title: ragPosts[0].title?.substring(0, 50)
          });
        } else {
          console.log(`[DEBUG] ❌ ragPosts is empty or undefined RIGHT AFTER retrieval!`);
        }
        console.log(`${'='.repeat(80)}\n`);

        // ===== CRITICAL: Add source_posts to cached pattern_analysis =====
        // The pattern_analysis is cached, but source_posts changes (new RAG posts retrieved)
        // So we need to manually add the fresh ragPosts to the cached pattern
        // Map distance → similarity for frontend
        const ragPostsWithSimilarity = (ragPosts || []).map(post => ({
          ...post,
          similarity: post.distance
        }));
        patternAnalysis.source_posts = ragPostsWithSimilarity;
        logger.info(`[Cache HIT] Added ${ragPostsWithSimilarity.length} source_posts with similarity field to cached pattern_analysis`);

        logger.info(`[Cache] Using cached pattern_analysis (but fresh RAG posts for modal)`);

      } else {
        // CACHE MISS: Generate embeddings, retrieve RAG posts, compute patterns
        logger.info(`[Cache MISS] Generating new analysis for batch ${batchId}`);

        // STEP 3: RAG Retrieval with Cached Embeddings
        console.time('⏱️  STEP 3: RAG Retrieval');

        if (cachedData && cachedData.userPostEmbeddings) {
          // Use cached embeddings (embeddings are deterministic now)
          logger.info(`[Cache] Using cached embeddings for ${cachedData.userPostEmbeddings.length} user posts`);
          userPostEmbeddings = cachedData.userPostEmbeddings;
          ragPosts = await retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, 50);
        } else {
          // Generate fresh embeddings and cache them
          logger.info(`[Batch Analysis] Retrieving similar posts from RAG database for ${posts.length} seed posts...`);
          ragPosts = await retrieveSimilarPostsForBatch(posts, 50); // Increased to 50 for richer scatter plot

          // Store embeddings for future use
          userPostEmbeddings = [];
          for (const post of posts) {
            const embedding = await generateEmbedding(post.text);
            userPostEmbeddings.push({
              text: post.text,
              embedding: embedding
            });
          }
        }

        console.timeEnd('⏱️  STEP 3: RAG Retrieval');

        // ===== DEBUG: Log ragPosts IMMEDIATELY after retrieval =====
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[DEBUG CACHE MISS] ragPosts IMMEDIATELY after retrieval (line 260)`);
        console.log(`${'='.repeat(80)}`);
        console.log(`[DEBUG] ragPosts length: ${ragPosts?.length || 0}`);
        console.log(`[DEBUG] ragPosts is Array: ${Array.isArray(ragPosts)}`);
        console.log(`[DEBUG] ragPosts type: ${typeof ragPosts}`);
        if (ragPosts && ragPosts.length > 0) {
          console.log(`[DEBUG] First ragPost:`, {
            post_id: ragPosts[0].post_id,
            company: ragPosts[0].company,
            role_type: ragPosts[0].role_type,
            title: ragPosts[0].title?.substring(0, 50)
          });
        } else {
          console.log(`[DEBUG] ❌ ragPosts is empty or undefined RIGHT AFTER retrieval!`);
        }
        console.log(`${'='.repeat(80)}\n`);

        // STEP 4: Extract Seed Companies from AI results (Testing Mode)
        console.time('⏱️  STEP 4a: Seed Company Extraction');
        logger.info(`[Batch Analysis] TESTING MODE: Extracting seed companies from AI results`);

        // Extract companies directly from the AI analysis results
        const seedCompanies = new Set();
        result.individual_analyses.forEach((analysis, idx) => {
          if (analysis.company) {
            seedCompanies.add(analysis.company);
            logger.info(`[Seed ${idx + 1}] Company: ${analysis.company} (from AI analysis)`);
          } else {
            logger.warn(`[Seed ${idx + 1}] No company found in AI results`);
          }
        });

        logger.info(`[Batch Analysis] Seed companies identified: ${Array.from(seedCompanies).join(', ') || 'NONE'}`);
        console.timeEnd('⏱️  STEP 4a: Seed Company Extraction');

        // STEP 4b: Extract Seed Roles from AI results
        console.time('⏱️  STEP 4b: Seed Role Extraction');
        logger.info(`[Batch Analysis] Extracting seed roles from AI results`);

        const seedRoles = new Set();
        result.individual_analyses.forEach((analysis, idx) => {
          if (analysis.role) {
            seedRoles.add(analysis.role);
            logger.info(`[Seed ${idx + 1}] Role: ${analysis.role} (from AI analysis)`);
          } else {
            logger.warn(`[Seed ${idx + 1}] No role found in AI results`);
          }
        });

        logger.info(`[Batch Analysis] Seed roles identified: ${Array.from(seedRoles).join(', ') || 'NONE'}`);
        console.timeEnd('⏱️  STEP 4b: Seed Role Extraction');

        // STEP 5: Pattern Analysis
        console.time('⏱️  STEP 5: Pattern Analysis');

        // ===== DEBUG: Check ragPosts BEFORE pattern analysis =====
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[DEBUG STEP 5] ragPosts BEFORE computeMultiPostPatterns (line 318)`);
        console.log(`${'='.repeat(80)}`);
        console.log(`[DEBUG] ragPosts length: ${ragPosts?.length || 0}`);
        console.log(`[DEBUG] ragPosts is Array: ${Array.isArray(ragPosts)}`);
        console.log(`[DEBUG] savedAnalyses length: ${savedAnalyses?.length || 0}`);
        if (ragPosts && ragPosts.length > 0) {
          console.log(`[DEBUG] ✅ ragPosts has data before pattern analysis`);
        } else {
          console.log(`[DEBUG] ❌ ragPosts is EMPTY before pattern analysis!`);
        }
        console.log(`${'='.repeat(80)}\n`);

        // ===== CRITICAL: Tag posts with source type BEFORE merging =====
        // Tag seed posts with post_source: 'seed'
        const seedPostsTagged = (savedAnalyses || []).map(post => ({
          ...post,
          post_source: 'seed'
        }));

        // Tag RAG posts with post_source: 'rag' AND map distance → similarity
        const ragPostsTagged = (ragPosts || []).map(post => ({
          ...post,
          post_source: 'rag',
          similarity: post.distance  // Convert distance to similarity for frontend
        }));

        const allPostsForAnalysis = [...seedPostsTagged, ...ragPostsTagged];
        const ragPostsWithSimilarity = ragPostsTagged; // For source_posts field
        logger.info(`[Batch Analysis] Computing multi-post patterns for ${allPostsForAnalysis.length} total posts (${savedAnalyses.length} seed + ${ragPosts.length} RAG)...`);

        patternAnalysis = await computeMultiPostPatterns(allPostsForAnalysis, seedCompanies, seedRoles, ragPostsWithSimilarity);
        result.pattern_analysis = patternAnalysis;
        result.rag_metadata = {
          seed_posts: savedAnalyses.length,
          rag_posts: ragPosts.length,
          total_posts: allPostsForAnalysis.length,
          seed_companies: Array.from(seedCompanies),
          cache_hit: false
        };

        // Track seed post markers for highlighting in benchmark data
        try {
          await benchmarkCacheService.trackSeedPostMarkers(batchId, savedAnalyses);
          logger.info(`[Batch Analysis] Tracked seed post markers for batch ${batchId}`);
        } catch (error) {
          logger.error('[Batch Analysis] Failed to track seed post markers:', error);
          // Non-critical error - continue with analysis
        }

        console.timeEnd('⏱️  STEP 5: Pattern Analysis');
      }

    } else {
      // Simple batch analysis without connections
      // ⚠️ IMPORTANT: Skip database saves for batch analysis (same reason as above)
      logger.info('[Batch Analysis] Simple mode - skipping database saves');
      const analyses = [];
      for (const post of posts) {
        const analysis = await analyzeText(post.text);
        // Add synthetic ID and timestamp (not persisted to database)
        analyses.push({
          ...analysis,
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString()
        });
      }

      result = {
        individual_analyses: analyses,
        connections: [],
        total_posts: posts.length,
        total_connections: 0
      };
    }

    // Determine feature availability based on extraction method
    const featuresAvailable = {
      extraction_method: extractionMethod, // 'llm' or 'ner'
      your_interview_experiences: true,    // Always available (company + role from NER)
      similar_posts: true,                  // Always available (only needs embeddings)
      company_insights: true,               // Available (company distribution from NER)
      interview_questions: extractionMethod === 'llm', // Needs LLM (interview_topics)
      skills_priority_matrix: extractionMethod === 'llm', // Needs LLM (interview_topics)
      topic_breakdown: extractionMethod === 'llm', // Needs LLM (interview_topics)
      sentiment_analysis: true, // Available (NER has keyword-based, LLM has contextual)
      sentiment_quality: extractionMethod === 'llm' ? 'contextual' : 'keyword-based',
      timeline_analysis: extractionMethod === 'llm', // Needs LLM
      preparation_materials: extractionMethod === 'llm' // Needs LLM
    };

    // Add extraction warning if in degraded mode
    const extractionWarning = extractionMethod === 'ner' ? {
      type: 'degraded_mode',
      title: 'Limited Analysis Mode',
      message: 'Due to API limitations, some advanced features are unavailable. You can still view company insights, similar posts, and basic analysis.',
      unavailable_features: [
        'Interview Questions Bank',
        'Skills Priority Matrix',
        'Detailed Topic Breakdown',
        'Timeline Analysis',
        'Preparation Materials'
      ],
      reason: extractionError?.message || 'LLM extraction service unavailable',
      fallback_method: 'NER (Named Entity Recognition)'
    } : null;

    const totalTime = Date.now() - startTime;
    console.log(`✅ TOTAL BATCH ANALYSIS TIME: ${(totalTime / 1000).toFixed(2)}s`);

    // DEBUG: Log what we're sending to frontend
    logger.info(`[Response Debug] Sending to frontend: individual_analyses=${result.individual_analyses?.length || 0}, pattern_analysis=${!!result.pattern_analysis}`);
    if (result.individual_analyses && result.individual_analyses.length > 0) {
      logger.info(`[Response Debug] individual_analyses companies: ${result.individual_analyses.map(a => a.company).join(', ')}`);
    }

    // ===== CRITICAL: Log RAG posts being sent =====
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[BACKEND API] 📤 Sending Response to Frontend`);
    console.log(`${'='.repeat(80)}`);
    console.log(`[BACKEND API] similar_posts count: ${ragPosts?.length || 0}`);
    if (ragPosts && ragPosts.length > 0) {
      console.log(`[BACKEND API] First similar post:`, {
        post_id: ragPosts[0].post_id,
        title: ragPosts[0].title?.substring(0, 50),
        company: ragPosts[0].company,
        role_type: ragPosts[0].role_type,
        has_role_type: !!ragPosts[0].role_type
      });
    } else {
      console.log(`[BACKEND API] ⚠️ ragPosts is empty or undefined!`);
    }
    console.log(`[BACKEND API] individual_analyses count: ${result.individual_analyses?.length || 0}`);
    console.log(`[BACKEND API] pattern_analysis exists: ${!!result.pattern_analysis}`);
    console.log(`${'='.repeat(80)}\n`);

    // Map distance → similarity for frontend display
    const similarPostsWithSimilarity = (ragPosts || []).map(post => ({
      ...post,
      similarity: post.distance  // Frontend expects field named 'similarity', converts (1-distance)*100
    }));

    // STEP 5.5: Generate Enhanced Intelligence (NEW - Phase 2)
    let enhancedIntelligence = null;
    try {
      console.time('⏱️  STEP 5.5: Enhanced Intelligence Generation');
      logger.info('[Enhanced Intelligence] Generating from foundation pool...');

      // Build foundation pool: Seed posts + RAG similar posts
      const seedPostIds = (result.individual_analyses || [])
        .map(analysis => analysis.post_id)
        .filter(id => id && id.startsWith('sp_'))
        .map(id => id.replace('sp_', ''));

      const ragPostIds = (ragPosts || [])
        .map(post => post.post_id)
        .filter(id => id);

      const foundationPoolIds = [...seedPostIds, ...ragPostIds];

      logger.info(`[Enhanced Intelligence] Foundation pool: ${foundationPoolIds.length} posts (${seedPostIds.length} seed + ${ragPostIds.length} RAG)`);

      if (foundationPoolIds.length > 0) {
        enhancedIntelligence = await generateEnhancedIntelligence(foundationPoolIds);
        logger.info(`[Enhanced Intelligence] ✅ Generated successfully - ${enhancedIntelligence.data_quality.questions_analyzed} questions, ${enhancedIntelligence.data_quality.companies_covered} companies`);
      } else {
        logger.warn('[Enhanced Intelligence] ⚠️  No foundation pool posts available, skipping');
      }

      console.timeEnd('⏱️  STEP 5.5: Enhanced Intelligence Generation');
    } catch (enhancedError) {
      logger.error('[Enhanced Intelligence] Error generating enhanced intelligence:', enhancedError.message);
      // Continue without enhanced intelligence - don't break the analysis
    }

    // STEP 6: Save to Cache with degraded mode metadata, individual analyses, and enhanced intelligence
    // Include features_available, extraction_warning, individual_analyses, and enhanced_intelligence in cache
    if (patternAnalysis) {
      console.time('⏱️  STEP 6: Save Cache');
      const patternAnalysisWithMetadata = {
        ...patternAnalysis,
        individual_analyses: result.individual_analyses || [],  // Include seed posts
        features_available: featuresAvailable,
        extraction_warning: extractionWarning
      };
      logger.info(`[Cache SAVE] Saving with extraction_method: ${featuresAvailable?.extraction_method}, has_warning: ${!!extractionWarning}, individual_analyses: ${result.individual_analyses?.length || 0}, enhanced_intelligence: ${!!enhancedIntelligence}`);
      await saveBatchCache(
        batchId,
        userPostEmbeddings,
        patternAnalysisWithMetadata,
        'BAAI/bge-small-en-v1.5',
        enhancedIntelligence,
        posts.length, // user_posts_count
        ragPosts?.length || 0 // rag_similar_posts_count
      );
      console.timeEnd('⏱️  STEP 6: Save Cache');
    }

    res.json({
      ...result,
      batchId,
      similar_posts: similarPostsWithSimilarity,
      enhanced_intelligence: enhancedIntelligence, // NEW: Phase 2 - Enhanced Intelligence
      aiProvider: 'OpenRouter',
      timestamp: new Date().toISOString(),
      performance: {
        total_time_ms: totalTime,
        total_time_seconds: (totalTime / 1000).toFixed(2)
      },
      features_available: featuresAvailable,
      extraction_warning: extractionWarning
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get analysis history controller
 */
async function getHistory(req, res) {
  try {
    const { userId, limit = 10, batchId } = req.query;
    const history = await getAnalysisHistory(userId, limit, batchId);
    res.json(history);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
}

/**
 * Get cached batch report by batchId
 * Retrieves the full pattern_analysis from cache
 */
async function getCachedBatchReport(req, res) {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    logger.info(`[API] Retrieving cached report for batch ${batchId}`);

    // Get cached data from batch_analysis_cache
    const cachedData = await getCachedBatchData(batchId);

    if (!cachedData || !cachedData.patternAnalysis) {
      logger.warn(`[API] No cached report found for batch ${batchId}`);
      return res.status(404).json({
        error: 'Report not found',
        message: 'No cached report exists for this batch ID. The report may have expired or never been generated.'
      });
    }

    // Extract degraded mode fields and individual analyses from pattern_analysis
    const patternAnalysis = cachedData.patternAnalysis || {};
    const featuresAvailable = patternAnalysis.features_available || null;
    const extractionWarning = patternAnalysis.extraction_warning || null;

    // Extract individual_analyses from pattern_analysis (seed posts)
    const individualAnalyses = patternAnalysis.individual_analyses || [];

    // Get enhanced intelligence from cache
    const enhancedIntelligence = cachedData.enhancedIntelligence || null;

    // Remove these fields from pattern_analysis to avoid duplication
    const { features_available, extraction_warning, individual_analyses, ...cleanPatternAnalysis } = patternAnalysis;

    // Construct full report response
    const report = {
      id: batchId,
      batchId: batchId,
      pattern_analysis: cleanPatternAnalysis,
      individual_analyses: individualAnalyses,
      features_available: featuresAvailable,
      extraction_warning: extractionWarning,
      enhanced_intelligence: enhancedIntelligence,
      cached: true,
      retrieved_at: new Date().toISOString()
    };

    logger.info(`[API] Successfully retrieved cached report for batch ${batchId} (${individualAnalyses.length} individual analyses, extraction_method: ${featuresAvailable?.extraction_method || 'unknown'}, has_enhanced_intelligence: ${!!enhancedIntelligence})`);

    res.json(report);

  } catch (error) {
    logger.error(`[API] Error retrieving cached report: ${error.message}`);
    res.status(500).json({
      error: 'Failed to retrieve cached report',
      message: error.message
    });
  }
}

/**
 * Health check controller
 */
function healthCheck(req, res) {
  res.json({ status: 'OK', service: 'content-service-v2', aiProvider: 'DeepSeek+OpenAI' });
}

/**
 * Service info controller
 */
function getServiceInfo(req, res) {
  res.json({
    message: 'Content service v2 - Enhanced with DeepSeek API, batch analysis, and trend intelligence',
    endpoints: {
      analysis: {
        single: '/api/content/analyze',
        batch: '/api/content/analyze/batch'
      },
      data: {
        history: '/api/content/history',
        analytics: '/api/content/analytics'
      },
      intelligence: {
        trends: '/api/content/trends',
        signals: '/api/content/trends/signals',
        recommendations: '/api/content/trends/recommendations'
      },
      system: {
        health: '/api/content/health'
      }
    },
    features: [
      'Single post analysis with DeepSeek AI',
      'Multi-post batch analysis with connection detection',
      'Historical analytics and insights',
      'Trend analysis and market signal detection',
      'Personalized recommendations based on data patterns'
    ]
  });
}

/**
 * Find similar posts using embedding-based semantic search
 * Filters:
 * - Time range: Last 2 years only (recent hiring trends)
 * - Similarity threshold: 60%+ match (cosine distance <= 0.4)
 */
async function findSimilarPostsByEmbedding(embedding, limit = 30) {
  const vectorString = `[${embedding.join(',')}]`;

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
      interview_stage,
      tech_stack,
      frameworks,
      interview_topics,
      created_at,
      sentiment_category,
      sentiment_score,
      sentiment_reasoning,
      sentiment_key_phrases,
      sentiment_confidence,
      (embedding <=> $1::vector) as distance
    FROM scraped_posts
    WHERE embedding IS NOT NULL
      AND is_relevant = true
      AND created_at >= NOW() - INTERVAL '2 years'
      AND (embedding <=> $1::vector) <= 0.4
    ORDER BY embedding <=> $1::vector, post_id ASC
    LIMIT $2
  `, [vectorString, limit]);

  logger.info(`[findSimilarPostsByEmbedding] Retrieved ${result.rows.length} similar posts (60%+ match, last 2 years)`);
  if (result.rows.length > 0) {
    logger.info(`[findSimilarPostsByEmbedding] First post: post_id=${result.rows[0].post_id}, distance=${result.rows[0].distance}, similarity=${((1 - result.rows[0].distance) * 100).toFixed(0)}%, company=${result.rows[0].company}, role_type=${result.rows[0].role_type}, created_at=${result.rows[0].created_at}`);
  } else {
    logger.warn(`[findSimilarPostsByEmbedding] No posts found matching criteria (60%+ similarity, last 2 years)`);
  }

  return result.rows;
}

/**
 * Retrieve similar posts for batch analysis
 * For each user post, find N similar posts from the database
 * Returns deduplicated array of similar posts
 */
async function retrieveSimilarPostsForBatch(userPosts, similarPerPost = 50) {
  const allSimilarPosts = [];
  const seenPostIds = new Set();

  for (const post of userPosts) {
    try {
      // Generate embedding for the user's post text
      const embedding = await generateEmbedding(post.text);

      // Find similar posts
      const similarPosts = await findSimilarPostsByEmbedding(embedding, similarPerPost);

      // Add to collection (deduplicate by post_id)
      for (const similar of similarPosts) {
        if (!seenPostIds.has(similar.post_id)) {
          seenPostIds.add(similar.post_id);
          allSimilarPosts.push(similar);
        }
      }
    } catch (error) {
      logger.error(`[RAG Batch] Error retrieving similar posts for user post: ${error.message}`);
      // Continue with other posts even if one fails
    }
  }

  logger.info(`[RAG Batch] Retrieved ${allSimilarPosts.length} unique similar posts from database`);

  // ===== REMOVED FALLBACK =====
  // Previously, if < 20 posts were retrieved, we fell back to random posts with dummy distance=0.5
  // This violated the "no mock data" principle
  // Now we return actual RAG results only, even if few posts match the criteria

  if (allSimilarPosts.length < 20) {
    logger.warn(`[RAG Batch] Only ${allSimilarPosts.length} posts retrieved from RAG (filters may be too strict)`);
    logger.warn(`[RAG Batch] Returning real posts only - NO FALLBACK TO MOCK DATA`);
  }

  return allSimilarPosts;
}

/**
 * Compute RAG analysis from similar posts
 * Reuses logic from postAnalysisService
 */
function computeRAGAnalysis(userText, analysisResult, similarPosts) {
  // Extract info from user's text and AI analysis
  const extractedSkills = new Set([
    ...(analysisResult.tech_stack || []),
    ...(analysisResult.frameworks || [])
  ]);

  // Build post summary from user's input
  const post_summary = {
    title: userText.substring(0, 100) + (userText.length > 100 ? '...' : ''),
    company: analysisResult.company || 'Not specified',
    role: analysisResult.role_type || 'Not specified',
    level: analysisResult.level || 'Not specified',
    outcome: analysisResult.outcome || 'Not specified',
    key_skills: Array.from(extractedSkills).slice(0, 10),
    interview_topics: analysisResult.interview_topics || [],
    date: new Date(),
    url: null
  };

  // Top 10 similar posts with similarity scores
  const similar_posts = similarPosts.slice(0, 10).map(p => ({
    post_id: p.post_id,
    title: p.title,
    company: p.company,
    role_type: p.role_type,
    similarity_score: (1 - p.distance) * 100,
    url: p.url
  }));

  // Comparative metrics
  const skillFrequency = {};
  similarPosts.forEach(post => {
    const postSkills = [
      ...(Array.isArray(post.tech_stack) ? post.tech_stack : []),
      ...(Array.isArray(post.frameworks) ? post.frameworks : [])
    ];
    postSkills.forEach(skill => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  const skill_comparison = {};
  extractedSkills.forEach(skill => {
    const count = skillFrequency[skill] || 0;
    const percentage = (count / similarPosts.length) * 100;
    skill_comparison[skill] = {
      mentioned_in_similar: count,
      percentage: percentage.toFixed(1)
    };
  });

  const sameCompanyCount = similarPosts.filter(p =>
    p.company && p.company.toLowerCase() === (analysisResult.company || '').toLowerCase()
  ).length;

  const sameRoleCount = similarPosts.filter(p =>
    p.role_type && p.role_type.toLowerCase() === (analysisResult.role_type || '').toLowerCase()
  ).length;

  const outcomes = { success: 0, failure: 0, unknown: 0 };
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

  const comparative_metrics = {
    total_similar_posts: similarPosts.length,
    same_company: {
      count: sameCompanyCount,
      percentage: ((sameCompanyCount / similarPosts.length) * 100).toFixed(1)
    },
    same_role: {
      count: sameRoleCount,
      percentage: ((sameRoleCount / similarPosts.length) * 100).toFixed(1)
    },
    skill_comparison,
    outcome_distribution: {
      success: outcomes.success,
      failure: outcomes.failure,
      unknown: outcomes.unknown,
      success_rate: (successRate * 100).toFixed(1) + '%'
    },
    similarity_insight: sameCompanyCount > similarPosts.length * 0.5
      ? `This is a typical ${analysisResult.company} experience`
      : `This experience is unique compared to similar posts`
  };

  // Find unique/rare skills
  const rareSkills = [];
  extractedSkills.forEach(skill => {
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

  rareSkills.sort((a, b) => parseFloat(b.rarity_score) - parseFloat(a.rarity_score));

  const unique_aspects = {
    rare_skills: rareSkills.slice(0, 5),
    is_unique: rareSkills.length > 0,
    uniqueness_summary: rareSkills.length > 0
      ? `This experience mentions ${rareSkills.length} rare skills not commonly seen`
      : `This experience follows typical patterns`
  };

  // Resource recommendations
  const resourceMap = {
    'algorithms': { title: 'LeetCode', url: 'https://leetcode.com', type: 'Practice' },
    'system design': { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'Guide' },
    'python': { title: 'Python Official Docs', url: 'https://docs.python.org', type: 'Documentation' },
    'javascript': { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'Documentation' },
    'react': { title: 'React Official Docs', url: 'https://react.dev', type: 'Documentation' },
    'behavioral': { title: 'STAR Method Guide', url: 'https://www.themuse.com/advice/star-interview-method', type: 'Guide' }
  };

  const recommendations = [];
  const seen = new Set();
  extractedSkills.forEach(skill => {
    const key = skill.toLowerCase();
    if (resourceMap[key] && !seen.has(key)) {
      recommendations.push({
        skill,
        ...resourceMap[key]
      });
      seen.add(key);
    }
  });

  if (recommendations.length < 2) {
    recommendations.push({
      skill: 'General Prep',
      title: 'Blind 75',
      url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions',
      type: 'Practice List'
    });
  }

  const recommended_resources = recommendations.slice(0, 5);

  return {
    post_summary,
    similar_posts,
    comparative_metrics,
    unique_aspects,
    recommended_resources
  };
}

/**
 * Phase 2: Multi-Post Pattern Analysis
 * Analyzes patterns across multiple posts (50-100 recommended)
 * Returns aggregate statistics, company trends, role breakdowns, timeline analysis
 */
async function computeMultiPostPatterns(analyses, seedCompanies = new Set(), seedRoles = new Set(), similarPosts = []) {
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`[Pattern Analysis] 🎯 FOUNDATION POSTS - These are the ONLY posts used for ALL insights`);
  logger.info(`${'='.repeat(80)}`);
  logger.info(`[Pattern Analysis] Total foundation posts: ${analyses.length}`);
  logger.info(`[Pattern Analysis] Breakdown: ${analyses.length - similarPosts.length} seed + ${similarPosts.length} RAG (60%+ similarity, last 2 years)`);
  logger.info(`[Pattern Analysis] Seed companies: ${Array.from(seedCompanies).join(', ')}`);
  logger.info(`[Pattern Analysis] Seed roles: ${Array.from(seedRoles).join(', ')}`);
  logger.info(`${'='.repeat(80)}\n`);

  // Helper function to normalize interview_topics to array format
  const normalizeTopics = (topics) => {
    if (!topics) return [];
    if (Array.isArray(topics)) return topics;
    // Handle JSONB format: {"coding": [...], "behavioral": [...], "system_design": [...]}
    if (typeof topics === 'object') {
      const allTopics = [];
      Object.keys(topics).forEach(category => {
        if (Array.isArray(topics[category])) {
          allTopics.push(...topics[category]);
        }
      });
      return allTopics;
    }
    return [];
  };

  /**
   * Convert string difficulty to numeric scale (1-5)
   * Database stores difficulty as string ('easy', 'medium', 'hard')
   * Frontend expects numeric values (1-5) for charts and filtering
   * @param {string|number} difficulty - String ('easy', 'medium', 'hard') or numeric value
   * @param {string} questionType - Question category for context-based difficulty adjustment
   * @returns {number} Difficulty on 1-5 scale
   */
  const convertDifficultyToNumeric = (difficulty, questionType = '') => {
    // If already numeric, validate and return
    if (typeof difficulty === 'number') {
      return Math.max(1, Math.min(5, Math.round(difficulty)));
    }

    // Convert string difficulty to numeric
    const difficultyStr = (difficulty || 'medium').toString().toLowerCase();

    // Base mapping: easy=2, medium=3, hard=4
    // Leaves room for 1 (very easy) and 5 (very hard) for future granularity
    const baseMapping = {
      'easy': 2,
      'medium': 3,
      'hard': 4
    };

    const baseValue = baseMapping[difficultyStr] || 3;

    // Contextual adjustment based on question type
    // System design is generally harder than coding, behavioral is easier
    const typeModifier = {
      'system_design': 0.5,  // System design questions tend to be harder
      'behavioral': -0.5,     // Behavioral questions tend to be easier
      'coding': 0,
      'technical': 0
    };

    const modifier = typeModifier[questionType] || 0;
    const adjustedValue = baseValue + modifier;

    // Clamp to 1-5 range and round
    return Math.max(1, Math.min(5, Math.round(adjustedValue)));
  };

  /**
   * Generate actionable tips for interview questions based on category and topic
   * @param {string} category - Question category (coding, system_design, behavioral, technical)
   * @param {string} topic - Primary topic/keyword from question
   * @returns {string} Actionable preparation tip
   */
  const generateQuestionTip = (category, topic) => {
    const tips = {
      coding: [
        'Practice on LeetCode/HackerRank before the interview',
        'Review time/space complexity analysis',
        'Prepare to explain your approach step-by-step',
        'Practice writing clean, bug-free code on a whiteboard',
        'Study common data structures and algorithms'
      ],
      system_design: [
        'Review scalability patterns (load balancing, caching, sharding)',
        'Understand trade-offs between consistency and availability',
        'Practice drawing system architecture diagrams',
        'Study real-world system examples (Twitter, Uber, Netflix)',
        'Prepare to discuss database choices (SQL vs NoSQL)'
      ],
      behavioral: [
        'Prepare STAR format examples (Situation, Task, Action, Result)',
        'Reflect on past team conflicts and how you resolved them',
        'Have specific examples of leadership and initiative',
        'Practice articulating your thought process clearly',
        'Prepare questions about team culture and values'
      ],
      technical: [
        'Review fundamental CS concepts (OOP, design patterns, etc.)',
        'Understand the tech stack mentioned in the job description',
        'Prepare to explain technical decisions from past projects',
        'Study best practices for testing and debugging',
        'Review networking, databases, and operating systems basics'
      ]
    };

    const categoryTips = tips[category] || tips.technical;

    // Deterministic selection based on topic hash (same topic → same tip)
    const topicHash = topic ? topic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const tipIndex = topicHash % categoryTips.length;

    return categoryTips[tipIndex];
  };

  // 1. Skill Frequency & Importance Analysis
  const skillFrequency = {};
  const skillByCompany = {};
  const skillByRole = {};

  analyses.forEach(analysis => {
    const skills = [
      ...(analysis.tech_stack || []),
      ...(analysis.frameworks || [])
    ];
    const company = analysis.company || 'Unknown';
    const role = analysis.role_type || 'Unknown';

    skills.forEach(skill => {
      // Overall frequency
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;

      // By company
      if (!skillByCompany[company]) skillByCompany[company] = {};
      skillByCompany[company][skill] = (skillByCompany[company][skill] || 0) + 1;

      // By role
      if (!skillByRole[role]) skillByRole[role] = {};
      skillByRole[role][skill] = (skillByRole[role][skill] || 0) + 1;
    });
  });

  const topSkills = Object.entries(skillFrequency)
    .sort((a, b) => {
      // Stable sort: primary by count DESC, secondary by name ASC
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 20)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: ((count / analyses.length) * 100).toFixed(1),
      importance: count > analyses.length * 0.5 ? 'Critical' : count > analyses.length * 0.3 ? 'Important' : 'Common'
    }));

  // Calculate real skill-success correlation (not mock data!)
  // For each skill, track: total posts with skill, successful posts with skill
  const skillSuccessStats = {};
  analyses.forEach(analysis => {
    const skills = [
      ...(analysis.tech_stack || []),
      ...(analysis.frameworks || [])
    ];
    const outcome = (analysis.outcome || '').toLowerCase();
    const isSuccess = outcome.includes('pass') || outcome.includes('offer') || outcome.includes('accept');

    skills.forEach(skill => {
      if (!skillSuccessStats[skill]) {
        skillSuccessStats[skill] = { total: 0, success: 0 };
      }
      skillSuccessStats[skill].total++;
      if (isSuccess) {
        skillSuccessStats[skill].success++;
      }
    });
  });

  // Calculate success rate for each skill (only for skills with 2+ occurrences for statistical relevance)
  const skillSuccessCorrelation = {};
  Object.entries(skillSuccessStats).forEach(([skill, stats]) => {
    if (stats.total >= 2) {  // Require at least 2 data points
      skillSuccessCorrelation[skill] = stats.success / stats.total;  // Value between 0 and 1
    }
  });

  console.log('[Pattern Analysis] ✅ Real skill-success correlation calculated for', Object.keys(skillSuccessCorrelation).length, 'skills');

  // 2. Company-Level Trends
  const companyStats = {};
  analyses.forEach(analysis => {
    const company = analysis.company || 'Unknown';
    if (!companyStats[company]) {
      companyStats[company] = {
        count: 0,
        success: 0,
        failure: 0,
        avgDifficulty: [],
        commonSkills: {},
        roles: {}
      };
    }

    companyStats[company].count++;

    const outcome = (analysis.outcome || '').toLowerCase();
    if (outcome.includes('pass') || outcome.includes('offer') || outcome.includes('accept')) {
      companyStats[company].success++;
    } else if (outcome.includes('fail') || outcome.includes('reject')) {
      companyStats[company].failure++;
    }

    // Track skills per company
    const skills = [...(analysis.tech_stack || []), ...(analysis.frameworks || [])];
    skills.forEach(skill => {
      companyStats[company].commonSkills[skill] = (companyStats[company].commonSkills[skill] || 0) + 1;
    });

    // Track roles per company
    const role = analysis.role_type || 'Unknown';
    companyStats[company].roles[role] = (companyStats[company].roles[role] || 0) + 1;
  });

  const companyTrends = Object.entries(companyStats)
    .filter(([_, stats]) => stats.count >= 1) // Changed from 2 to 1 - show all companies
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 50)  // Increased from 20 to 50 for information-dense scatter plot
    .map(([company, stats]) => {
      const topSkills = Object.entries(stats.commonSkills)
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return a[0].localeCompare(b[0]);
        })
        .slice(0, 5)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: ((count / stats.count) * 100).toFixed(1)
        }));

      console.log(`[DEBUG] ${company} - Total Posts: ${stats.count}, Top Skills:`, topSkills);

      return {
        company,
        total_posts: stats.count,
        success_rate: stats.success + stats.failure > 0
          ? ((stats.success / (stats.success + stats.failure)) * 100).toFixed(1) + '%'
          : 'N/A',
        top_skills: topSkills,
        top_roles: Object.entries(stats.roles)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
          })
          .slice(0, 3)
          .map(([role, count]) => ({ role, count })),
        is_seed_company: Array.from(seedCompanies).some(seed =>
          seed.toLowerCase() === company.toLowerCase()
        )  // Case-insensitive matching for frontend highlighting
      };
    });

  // DEBUG: Log company trends with is_seed_company flags
  logger.info(`[Pattern Analysis] Company trends generated: ${companyTrends.length} companies`);
  companyTrends.forEach(ct => {
    logger.info(`  - ${ct.company}: ${ct.total_posts} posts, is_seed=${ct.is_seed_company}`);
  });

  // 3. Role-Based Breakdown (BENCHMARK DATA - uses PRE-COMPUTED cache)
  // NOTE: This is benchmark data showing objective industry-wide role statistics
  // Uses PRE-COMPUTED cache from benchmark_role_intelligence table for fast response
  logger.info('[Role Analysis] Fetching role data from CACHED benchmark (fast mode)');

  let roleBreakdown = [];

  try {
    // Fetch cached role intelligence data
    const cachedRoles = await benchmarkCacheService.getCachedRoleIntelligence();
    logger.info(`[Role Analysis] Found ${cachedRoles.length} roles from cache`);

    // Build role breakdown data from cache
    roleBreakdown = cachedRoles.map(row => {
      const totalOutcomes = parseInt(row.success_count) + parseInt(row.failure_count);
      const successRate = row.success_rate ? `${parseFloat(row.success_rate).toFixed(1)}%` : 'N/A';

      // Calculate avg difficulty (inverse of success rate, 1-5 scale)
      let avgDifficulty = '3.0/5';
      if (totalOutcomes > 0) {
        const successPct = parseFloat(row.success_rate) || 0;
        const difficultyScore = Math.min(5.0, Math.max(1.0, (100 - successPct) / 20 + 1));
        avgDifficulty = `${difficultyScore.toFixed(1)}/5`;
      }

      // Check if this is a seed role (case-insensitive matching)
      const isSeedRole = Array.from(seedRoles).some(seed =>
        seed.toLowerCase() === row.role_type.toLowerCase()
      );

      // Parse top skills from JSONB
      const topSkills = row.top_skills || [];

      return {
        role: row.role_type,
        total_posts: parseInt(row.total_posts),
        success_rate: successRate,
        avg_difficulty: avgDifficulty,
        is_seed_role: isSeedRole,
        top_skills: topSkills
      };
    });

    logger.info(`[Role Analysis] Processed ${roleBreakdown.length} roles from cached benchmark data`);
  } catch (error) {
    logger.error('[Role Analysis] Failed to fetch cached role data:', error);
    // Gracefully handle error - return empty array
  }

  // 4. Question Type Distribution
  const questionTypes = {
    coding: 0,
    'system design': 0,
    behavioral: 0,
    'case study': 0,
    other: 0
  };

  analyses.forEach(analysis => {
    const topics = normalizeTopics(analysis.interview_topics).map(t => String(t).toLowerCase());
    const text = (analysis.original_text || analysis.body_text || '').toLowerCase();

    if (topics.some(t => t.includes('coding') || t.includes('leetcode') || t.includes('algorithm')) ||
        text.includes('coding') || text.includes('leetcode')) {
      questionTypes.coding++;
    }
    if (topics.some(t => t.includes('system') || t.includes('design')) ||
        text.includes('system design') || text.includes('architecture')) {
      questionTypes['system design']++;
    }
    if (topics.some(t => t.includes('behavioral') || t.includes('culture')) ||
        text.includes('behavioral') || text.includes('tell me about')) {
      questionTypes.behavioral++;
    }
    if (topics.some(t => t.includes('case')) || text.includes('case study')) {
      questionTypes['case study']++;
    }
  });

  const questionDistribution = Object.entries(questionTypes)
    .map(([type, count]) => ({
      type,
      count,
      percentage: ((count / analyses.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count);

  // 5. Knowledge Gap Heatmap (struggles vs frequent topics)
  const struggledTopics = {};
  analyses.forEach(analysis => {
    // Look for mentions of difficulty or failure in conjunction with topics
    const text = (analysis.original_text || '').toLowerCase();
    const topics = [...(analysis.tech_stack || []), ...(analysis.frameworks || [])];

    topics.forEach(topic => {
      if (text.includes(topic.toLowerCase()) &&
          (text.includes('struggled') || text.includes('difficult') || text.includes('hard') || text.includes('failed'))) {
        struggledTopics[topic] = (struggledTopics[topic] || 0) + 1;
      }
    });
  });

  const knowledgeGaps = Object.entries(struggledTopics)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 10)
    .map(([topic, count]) => ({
      topic,
      struggle_count: count,
      percentage: ((count / analyses.length) * 100).toFixed(1)
    }));

  // 6. Sentiment & Success Metrics
  const sentimentMetrics = {
    positive: 0,
    neutral: 0,
    negative: 0,
    total_success: 0,
    total_failure: 0,
    total_unknown: 0
  };

  analyses.forEach(analysis => {
    const outcome = (analysis.outcome || '').toLowerCase();
    if (outcome.includes('pass') || outcome.includes('offer') || outcome.includes('accept')) {
      sentimentMetrics.total_success++;
      sentimentMetrics.positive++;
    } else if (outcome.includes('fail') || outcome.includes('reject')) {
      sentimentMetrics.total_failure++;
      sentimentMetrics.negative++;
    } else {
      sentimentMetrics.total_unknown++;
      sentimentMetrics.neutral++;
    }
  });

  const overallSuccessRate = sentimentMetrics.total_success + sentimentMetrics.total_failure > 0
    ? ((sentimentMetrics.total_success / (sentimentMetrics.total_success + sentimentMetrics.total_failure)) * 100).toFixed(1)
    : 'N/A';

  // 7. Correlation Insights
  // ✅ Remove hardcoded placeholder correlation - use empty array until real correlations implemented
  // TODO: Implement real correlation calculations from foundation posts (e.g., system design presence vs success rate)
  const correlations = [];

  // 8. Extract Top Keywords
  const allKeywords = {};
  analyses.forEach(analysis => {
    const topics = normalizeTopics(analysis.interview_topics);
    topics.forEach(topic => {
      if (topic && typeof topic === 'string') {
        allKeywords[topic] = (allKeywords[topic] || 0) + 1;
      }
    });
  });
  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 10)
    .map(([keyword]) => keyword);

  // 9. Extract Sample Quotes (from body_text if available)
  const exampleQuotes = analyses
    .filter(a => a.body_text && a.body_text.length > 50)
    .slice(0, 3)
    .map(a => {
      const text = a.body_text.substring(0, 150);
      return text + (a.body_text.length > 150 ? '...' : '');
    });

  // 10. Generate Narrative Summary
  const topCompany = companyTrends[0]?.company || 'Unknown';
  const topSkill = topSkills[0]?.skill || 'Unknown';
  const narrativeSummary = `Based on ${analyses.length} interview experiences across ${Object.keys(companyStats).length} companies, ${topSkill} emerged as the most critical skill (${topSkills[0]?.percentage}% mention rate). ${topCompany} leads in interview volume with ${companyTrends[0]?.total_posts} analyzed posts. Overall success rate stands at ${overallSuccessRate}%, with significant variations across companies and roles. ${correlations.length > 0 ? correlations[0].finding : 'Candidates with strong technical preparation show higher success rates.'}`;

  // 11. Build Comparative Table (Company-by-Company Metrics)
  // Prioritize seed companies + top RAG companies (exclude "Unknown")
  const filteredCompanyTrends = companyTrends.filter(c => c.company !== 'Unknown');
  const seedCompaniesData = filteredCompanyTrends.filter(c => c.is_seed_company);
  const ragCompaniesData = filteredCompanyTrends.filter(c => !c.is_seed_company);

  // Combine: all seed companies first, then top RAG companies (up to 7-8 total)
  const targetTableSize = 7;
  const ragSlotsAvailable = Math.max(1, targetTableSize - seedCompaniesData.length);
  const selectedCompanies = [
    ...seedCompaniesData,
    ...ragCompaniesData.slice(0, ragSlotsAvailable)
  ];

  logger.info(`[Comparative Table] Total: ${selectedCompanies.length} companies (${seedCompaniesData.length} seed, ${Math.min(ragSlotsAvailable, ragCompaniesData.length)} RAG)`);

  console.log(`[DEBUG COMPARATIVE TABLE] About to build comparative table for ${selectedCompanies.length} companies`);
  console.log(`[DEBUG COMPARATIVE TABLE] Company names:`, selectedCompanies.map(c => c.company));

  const comparativeTable = selectedCompanies.map(company => {
    console.log(`[DEBUG MAP START] Processing company: ${company.company}`);
    const companyData = companyStats[company.company];

    // Calculate per-company question breakdown
    const companyPosts = analyses.filter(a => a.company === company.company);

    logger.info(`[Question Breakdown] ${company.company}: ${companyPosts.length} posts found`);

    // ============================================================
    // SENTIMENT AGGREGATION (Real data from sentiment_* columns)
    // ============================================================
    const sentimentScores = [];
    const sentimentCategories = {};
    const sentimentPhrases = [];

    companyPosts.forEach(analysis => {
      // Collect sentiment scores
      if (analysis.sentiment_score && !isNaN(analysis.sentiment_score)) {
        sentimentScores.push(parseFloat(analysis.sentiment_score));
      }

      // Count sentiment categories
      if (analysis.sentiment_category) {
        sentimentCategories[analysis.sentiment_category] =
          (sentimentCategories[analysis.sentiment_category] || 0) + 1;
      }

      // Collect key phrases (up to 3 per company)
      if (analysis.sentiment_key_phrases && Array.isArray(analysis.sentiment_key_phrases)) {
        sentimentPhrases.push(...analysis.sentiment_key_phrases.slice(0, 2));
      }
    });

    // Calculate average sentiment score
    const avgSentiment = sentimentScores.length > 0
      ? (sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length).toFixed(1)
      : null;  // null = no sentiment data yet

    // Determine primary sentiment category (most common)
    let primarySentiment = 'NEUTRAL';
    let maxCount = 0;
    Object.entries(sentimentCategories).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        primarySentiment = category;
      }
    });

    // Generate sentiment reasoning summary
    const sentimentReasoning = sentimentScores.length > 0
      ? `Based on ${sentimentScores.length} analyzed posts, candidates primarily express ${primarySentiment.toLowerCase()} sentiment. ${
          primarySentiment === 'CONFIDENT' ? 'Candidates generally feel well-prepared and optimistic about their performance.' :
          primarySentiment === 'ANXIOUS' ? 'Candidates frequently report uncertainty and stress during the interview process.' :
          primarySentiment === 'FRUSTRATED' ? 'Candidates express dissatisfaction with interview organization or treatment.' :
          primarySentiment === 'RELIEVED' ? 'Candidates report positive outcomes and relief after completing the process.' :
          primarySentiment === 'DISAPPOINTED' ? 'Candidates express regret or unmet expectations regarding outcomes.' :
          primarySentiment === 'MIXED' ? 'Candidates report complex, ambivalent experiences with multiple emotions.' :
          'Candidates provide factual, objective reporting with minimal emotional content.'
        }`
      : 'Insufficient sentiment data available for this company.';

    // ============================================================
    // QUESTION TYPE BREAKDOWN PER COMPANY (Full breakdown for charts)
    // ============================================================
    const questionTypeBreakdown = {
      coding: 0,
      'system design': 0,
      behavioral: 0,
      'case study': 0,
      other: 0
    };

    companyPosts.forEach(analysis => {
      const topics = normalizeTopics(analysis.interview_topics).map(t => String(t).toLowerCase());
      const text = (analysis.original_text || analysis.body_text || '').toLowerCase();

      // Coding questions
      if (topics.some(t => t.includes('coding') || t.includes('leetcode') || t.includes('algorithm')) ||
          text.includes('coding') || text.includes('leetcode')) {
        questionTypeBreakdown.coding++;
      }

      // System design questions
      if (topics.some(t => t.includes('system') || t.includes('design')) ||
          text.includes('system design') || text.includes('architecture')) {
        questionTypeBreakdown['system design']++;
      }

      // Behavioral questions
      if (topics.some(t => t.includes('behavioral') || t.includes('culture')) ||
          text.includes('behavioral') || text.includes('tell me about')) {
        questionTypeBreakdown.behavioral++;
      }

      // Case study questions
      if (topics.some(t => t.includes('case')) || text.includes('case study')) {
        questionTypeBreakdown['case study']++;
      }
    });

    // Calculate percentages for each question type
    const total = companyPosts.length;
    const questionTypePercentages = {};
    Object.entries(questionTypeBreakdown).forEach(([type, count]) => {
      questionTypePercentages[type] = total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0;
    });

    logger.info(`[Question Breakdown] ${company.company} percentages: ${JSON.stringify(questionTypePercentages)}`);
    console.log(`[DEBUG QUESTION BREAKDOWN] ${company.company} percentages:`, questionTypePercentages);

    // Legacy behavioral/technical percentages (kept for backward compatibility)
    const behavioral = questionTypeBreakdown.behavioral;
    const technical = questionTypeBreakdown.coding + questionTypeBreakdown['system design'];
    const behavioralPct = total > 0 ? ((behavioral / total) * 100).toFixed(0) : '0';
    const technicalPct = total > 0 ? ((technical / total) * 100).toFixed(0) : '0';

    // Get difficulty from difficultyByCompany (will be calculated later)
    // For now, calculate inline
    const successRate = parseFloat(company.success_rate);
    let difficulty = 'Medium';
    if (successRate < 40) difficulty = 'High';
    else if (successRate < 55) difficulty = 'Medium-High';
    else if (successRate > 70) difficulty = 'Low-Medium';
    else if (successRate > 85) difficulty = 'Low';

    const companyRow = {
      company: company.company,
      avg_sentiment: avgSentiment || 'N/A',  // Sentiment score (1.0-5.0) or N/A
      sentiment_category: primarySentiment,   // Most common sentiment category
      sentiment_reasoning: sentimentReasoning, // AI-generated explanation
      sentiment_key_phrases: sentimentPhrases.slice(0, 5), // Top 5 representative quotes
      sentiment_post_count: sentimentScores.length, // Number of posts with sentiment data
      top_skill_focus: company.top_skills[0]?.skill || 'N/A',
      avg_difficulty: difficulty,
      behavioral_focus: behavioralPct + '%',
      technical_focus: technicalPct + '%',
      question_type_breakdown: questionTypePercentages,  // Full breakdown: {coding: 45.5, 'system design': 30.2, behavioral: 20.1, 'case study': 4.2, other: 0}
      success_rate: company.success_rate,
      is_seed_company: company.is_seed_company || false
    };

    console.log(`[DEBUG RETURN OBJECT] ${company.company} has question_type_breakdown:`, companyRow.question_type_breakdown);
    return companyRow;
  });

  console.log(`[DEBUG COMPARATIVE TABLE COMPLETE] Built table with ${comparativeTable.length} companies`);
  console.log(`[DEBUG COMPARATIVE TABLE COMPLETE] First company:`, comparativeTable[0]);

  // 12. Build Cross-Post Knowledge Graph (Skill Connections)
  const skillConnections = {};
  const skillCoOccurrence = {};

  analyses.forEach(analysis => {
    const skills = [
      ...(analysis.tech_stack || []),
      ...(analysis.frameworks || []),
      ...normalizeTopics(analysis.interview_topics)
    ].filter(s => s && typeof s === 'string' && s.length > 0);

    // Track co-occurrence of skills in the same post
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const pair = [skills[i], skills[j]].sort().join('|');
        skillCoOccurrence[pair] = (skillCoOccurrence[pair] || 0) + 1;
      }
    }
  });

  // ✅ Calculate skill correlations for heatmap (normalized co-occurrence)
  const maxCoOccurrence = Math.max(...Object.values(skillCoOccurrence), 1);
  const skillCorrelations = {};
  Object.entries(skillCoOccurrence).forEach(([pair, count]) => {
    const [skill1, skill2] = pair.split('|');
    const normalizedCorr = count / maxCoOccurrence; // 0-1 scale
    skillCorrelations[`${skill1}_${skill2}`] = normalizedCorr;
    skillCorrelations[`${skill2}_${skill1}`] = normalizedCorr; // Symmetric
  });

  // Convert to graph format (nodes + edges)
  const knowledgeGraph = {
    nodes: topSkills.slice(0, 15).map(skill => ({
      id: skill.skill,
      label: skill.skill,
      value: skill.count,
      percentage: skill.percentage
    })),
    edges: Object.entries(skillCoOccurrence)
      .filter(([_, count]) => count >= 2) // Only connections appearing 2+ times
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .slice(0, 20) // Top 20 connections
      .map(([pair, count]) => {
        const [source, target] = pair.split('|');
        return { source, target, value: count };
      }),
    correlations: skillCorrelations  // ✅ NEW: Correlation matrix for CriticalSkillsAnalysisV1.vue heatmap
  };

  // 12b. ✅ Calculate Skill Pairs with Success Rates (for CriticalSkillsAnalysisV1.vue)
  // Track co-occurrence with outcome for each skill pair
  const skillPairStats = {};

  analyses.forEach(analysis => {
    const skills = [
      ...(analysis.tech_stack || []),
      ...(analysis.frameworks || []),
      ...normalizeTopics(analysis.interview_topics)
    ].filter(s => s && typeof s === 'string' && s.length > 0);

    const outcome = analysis.outcome;
    const isSuccess = outcome === 'success' || outcome === 'offer' || outcome === 'accepted';

    // Track pairs with outcomes
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const pair = [skills[i], skills[j]].sort().join('|');

        if (!skillPairStats[pair]) {
          skillPairStats[pair] = { total: 0, success: 0 };
        }

        skillPairStats[pair].total++;
        if (isSuccess) {
          skillPairStats[pair].success++;
        }
      }
    }
  });

  // Convert to skill_pairs array with frequency and success_rate
  const skillPairs = Object.entries(skillPairStats)
    .filter(([_, stats]) => stats.total >= 3) // At least 3 occurrences
    .map(([pair, stats]) => {
      const [skill1, skill2] = pair.split('|');
      const frequency = Math.round((stats.total / analyses.length) * 100); // % of posts
      const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

      return {
        skill1,
        skill2,
        skills: [skill1, skill2],
        co_occurrence: stats.total,
        frequency,  // Percentage of posts containing this pair
        success_rate: successRate,
        successRate  // Alias for backward compatibility
      };
    })
    .sort((a, b) => {
      // Sort by success rate first, then by co-occurrence
      if (b.success_rate !== a.success_rate) return b.success_rate - a.success_rate;
      return b.co_occurrence - a.co_occurrence;
    })
    .slice(0, 20); // Top 20 pairs

  // 13. Extract Emotion Keywords
  const emotionKeywords = {};
  const emotionWords = ['nervous', 'confident', 'overwhelmed', 'excited', 'frustrated', 'motivated', 'stressed', 'prepared', 'anxious', 'hopeful', 'confused', 'satisfied', 'disappointed', 'proud', 'worried', 'calm', 'scared', 'relieved', 'tense', 'optimistic'];

  analyses.forEach(analysis => {
    const text = (analysis.body_text || '').toLowerCase();
    emotionWords.forEach(emotion => {
      if (text.includes(emotion)) {
        emotionKeywords[emotion] = (emotionKeywords[emotion] || 0) + 1;
      }
    });
  });

  const topEmotions = Object.entries(emotionKeywords)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 15)
    .map(([emotion, count]) => ({ emotion, count }));

  // 14. Difficulty Analysis by Company
  // Convert difficulty to object keyed by company name with numeric "/5" format
  const difficultyByCompany = {};
  companyTrends.forEach(company => {
    // Heuristic: Inverse of success rate mapped to 1-5 scale
    // Success rate 100% → 1.0/5 (very easy)
    // Success rate 0% → 5.0/5 (very hard)
    const successRate = parseFloat(company.success_rate);

    if (!isNaN(successRate)) {
      // Linear mapping: (100 - successRate) / 20 gives range from 0-5
      // Add 1 to shift range to 1-5, then cap at 5
      const difficultyScore = Math.min(5.0, Math.max(1.0, (100 - successRate) / 20 + 1));
      difficultyByCompany[company.company] = `${difficultyScore.toFixed(1)}/5`;
    } else {
      // If success rate is N/A, use neutral difficulty
      difficultyByCompany[company.company] = '3.0/5';
    }
  });

  // 14b. ✅ Stage Progression by Company (BENCHMARK DATA - uses PRE-COMPUTED cache)
  // NOTE: This is benchmark data showing objective industry-wide stage success rates
  // Uses PRE-COMPUTED cache from benchmark_stage_success table for fast response
  logger.info('[Stage Analysis] Fetching stage data from CACHED benchmark (fast mode)');

  const stageByCompany = {};

  try {
    // Fetch cached stage success data (top 10 companies only)
    const cachedStages = await benchmarkCacheService.getCachedStageSuccess();
    logger.info(`[Stage Analysis] Found ${cachedStages.length} stage records from cache`);

    // Calculate total posts per company across all stages
    const companyPostCounts = {};
    cachedStages.forEach(row => {
      const { company, total_posts } = row;
      if (!companyPostCounts[company]) {
        companyPostCounts[company] = 0;
      }
      companyPostCounts[company] += parseInt(total_posts) || 0;
    });

    // Build stage statistics by company from cache
    cachedStages.forEach(row => {
      const { company, interview_stage, success_rate, total_posts } = row;

      if (!stageByCompany[company]) {
        stageByCompany[company] = {
          stages: [],
          total_posts: companyPostCounts[company] || 0
        };
      }

      stageByCompany[company].stages.push({
        name: interview_stage,
        percentage: Math.round(parseFloat(success_rate) || 0),
        posts: parseInt(total_posts) || 0
      });
    });

    // Sort each company's stages by success rate
    Object.keys(stageByCompany).forEach(company => {
      stageByCompany[company].stages.sort((a, b) => b.percentage - a.percentage);
    });

    logger.info(`[Stage Analysis] Processed cached stage data for ${Object.keys(stageByCompany).length} companies`);
  } catch (error) {
    logger.error('[Stage Analysis] Failed to fetch cached stage data:', error);
    // Gracefully handle error - return empty object
  }

  // 14c. ✅ Temporal Data - Time-series trends for CompanyIntelligenceV1.vue timeline
  // Calculate success rate trends over time for top companies
  const temporalData = {};

  analyses.forEach(analysis => {
    const company = (analysis.metadata?.company || analysis.company || 'Unknown').trim();
    if (!analysis.created_at || company === 'Unknown') return;

    const date = new Date(analysis.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const outcome = analysis.outcome;
    const isSuccess = outcome === 'success' || outcome === 'offer' || outcome === 'accepted';

    if (!temporalData[company]) {
      temporalData[company] = {};
    }

    if (!temporalData[company][monthKey]) {
      temporalData[company][monthKey] = { total: 0, success: 0 };
    }

    temporalData[company][monthKey].total++;
    if (isSuccess) {
      temporalData[company][monthKey].success++;
    }
  });

  // Convert to Chart.js format (labels + datasets) for top 4 companies
  const topCompaniesForTrends = companyTrends.slice(0, 4).map(c => c.company);
  const allMonths = new Set();

  // Collect all unique months
  topCompaniesForTrends.forEach(company => {
    if (temporalData[company]) {
      Object.keys(temporalData[company]).forEach(month => allMonths.add(month));
    }
  });

  const sortedMonths = Array.from(allMonths).sort();

  // Build datasets for each company
  const temporalDatasets = topCompaniesForTrends
    .filter(company => temporalData[company]) // Only companies with temporal data
    .map((company, idx) => {
      const colors = ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA'];
      const data = sortedMonths.map(month => {
        const stats = temporalData[company]?.[month];
        if (!stats || stats.total < 2) return null; // Skip months with <2 posts
        return Math.round((stats.success / stats.total) * 100);
      });

      return {
        label: company,
        data,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length],
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

  const temporalDataFormatted = sortedMonths.length > 0 && temporalDatasets.length > 0
    ? {
        labels: sortedMonths.map(m => {
          const [year, month] = m.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${monthNames[parseInt(month) - 1]} ${year}`;
        }),
        datasets: temporalDatasets
      }
    : null;

  // 15. Sentiment Timeline (Group by timestamp if available)
  const sentimentTimeline = [];
  const timeGrouped = {};

  analyses.forEach(analysis => {
    if (analysis.created_at) {
      const date = new Date(analysis.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!timeGrouped[monthKey]) {
        timeGrouped[monthKey] = { success: 0, failure: 0, neutral: 0, total: 0 };
      }

      timeGrouped[monthKey].total++;
      if (analysis.sentiment === 'Positive') timeGrouped[monthKey].success++;
      else if (analysis.sentiment === 'Negative') timeGrouped[monthKey].failure++;
      else timeGrouped[monthKey].neutral++;
    }
  });

  Object.entries(timeGrouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([month, data]) => {
      sentimentTimeline.push({
        month,
        success_rate: data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : 0,
        total_posts: data.total
      });
    });

  // 11. Interview Questions Extraction (Database-Based + Pattern Fallback)
  logger.info('[Pattern Analysis] Extracting interview questions from database (detailed LLM questions)...');
  console.time('⏱️  Interview Questions Extraction');

  const allQuestions = [];
  const questionsByCompany = {};
  let postsProcessedForQuestions = 0;
  let postsSkippedShortText = 0;

  // Get all post IDs from analyses
  const analysisPostIds = analyses.map(a => a.post_id).filter(Boolean);

  // Query database for detailed questions (confidence >= 0.90) from these posts
  // FILTER: Only coding/system_design/technical questions for Question Bank
  // (behavioral/HR questions are still in database, just not shown in Question Bank)
  const dbQuestionsResult = await pool.query(`
    SELECT
      iq.question_text,
      iq.question_type,
      iq.llm_category,
      iq.extraction_confidence,
      iq.company,
      sp.post_id,
      sp.url,
      sp.title,
      sp.potential_outcome,
      sp.interview_date
    FROM interview_questions iq
    JOIN scraped_posts sp ON iq.post_id = sp.post_id
    WHERE iq.post_id = ANY($1)
      AND iq.extraction_confidence >= 0.90
      AND iq.question_type IN ('coding', 'system_design', 'technical', 'unknown')
    ORDER BY iq.extraction_confidence DESC
  `, [analysisPostIds]);

  logger.info(`[Pattern Analysis] Found ${dbQuestionsResult.rows.length} detailed questions from database`);

  // Process database questions
  const dbQuestionPromises = dbQuestionsResult.rows.map(async (dbq) => {
    const analysis = analyses.find(a => a.post_id === dbq.post_id) || {};
    const company = dbq.company || analysis.company || 'Unknown';
    const outcome = dbq.potential_outcome || analysis.outcome || '';
    const isSuccess = outcome.toLowerCase().includes('positive') ||
                     outcome.toLowerCase().includes('pass') ||
                     outcome.toLowerCase().includes('offer');

    // Match to LeetCode
    const leetcodeMatch = await matchQuestionToLeetCode(dbq.question_text, dbq.question_type);

    return {
      text: dbq.question_text,
      company,
      category: dbq.llm_category || dbq.question_type || 'unknown',
      difficulty: leetcodeMatch.matched ? leetcodeMatch.difficulty_numeric : 3.0,
      stage: analysis.interview_stage || 'Technical Round',
      successRate: 50,
      frequency: 1,
      confidence: dbq.extraction_confidence,
      source: 'database_llm',
      post_source: analysis.post_source || 'unknown',
      topics: normalizeTopics(analysis.interview_topics || []).slice(0, 5),
      normalized: dbq.question_text.toLowerCase().trim(),
      post_outcome: isSuccess ? 'success' : 'failure',
      source_post_id: dbq.post_id,
      source_post_url: dbq.url,
      source_post_title: dbq.title,
      leetcode_id: leetcodeMatch.matched ? leetcodeMatch.leetcode_id : null,
      leetcode_frontend_id: leetcodeMatch.matched ? leetcodeMatch.frontend_id : null,
      leetcode_url: leetcodeMatch.matched ? leetcodeMatch.url : null,
      leetcode_title: leetcodeMatch.matched ? leetcodeMatch.title : null,
      leetcode_difficulty: leetcodeMatch.matched ? leetcodeMatch.difficulty : null,
      match_confidence: leetcodeMatch.confidence || 0,
      match_method: leetcodeMatch.method || 'none'
    };
  });

  const dbQuestions = await Promise.all(dbQuestionPromises);
  allQuestions.push(...dbQuestions);

  // Fallback: For posts without database questions, use pattern matching
  for (const analysis of analyses) {
    const postText = analysis.body_text || analysis.original_text || '';

    if (postText.length < 50) {
      postsSkippedShortText++;
      continue;
    }

    // Skip if we already have questions from database for this post
    if (dbQuestions.some(q => q.source_post_id === analysis.post_id)) {
      continue;
    }

    postsProcessedForQuestions++;

    // Extract questions using pattern matching (fallback)
    const extractedQuestions = extractInterviewQuestions(postText, {
      minConfidence: 0.75,
      maxQuestions: 10
    });

    // Process questions with LeetCode matching (using Promise.all for performance)
    const questionPromises = extractedQuestions.map(async question => {
      const company = analysis.company || 'Unknown';
      const outcome = (analysis.outcome || '').toLowerCase();
      const isSuccess = outcome.includes('pass') || outcome.includes('offer') || outcome.includes('accept');

      // ✅ Convert difficulty from string ('easy', 'medium', 'hard') to numeric (1-5)
      // Uses convertDifficultyToNumeric helper with question type context
      const numericDifficulty = convertDifficultyToNumeric(analysis.difficulty, question.type);

      // ✅ NEW: Match question to LeetCode database
      const leetcodeMatch = await matchQuestionToLeetCode(question.text, question.type);

      const questionData = {
        text: question.text,
        company,
        category: question.type, // coding, system_design, behavioral, technical
        difficulty: leetcodeMatch.matched ? leetcodeMatch.difficulty_numeric : numericDifficulty, // ✅ Use LeetCode difficulty if matched
        stage: analysis.interview_stage || 'Technical Round',
        successRate: 50, // Will calculate later
        frequency: question.frequency || 1,
        confidence: question.confidence,
        source: question.source,
        post_source: analysis.post_source || 'unknown', // ✅ NEW: Track whether from seed or RAG post
        topics: normalizeTopics(analysis.interview_topics).slice(0, 5),
        normalized: question.normalized,
        post_outcome: isSuccess ? 'success' : (outcome.includes('fail') || outcome.includes('reject')) ? 'failure' : 'unknown',
        // ✅ NEW: Preserve source post metadata for traceability
        source_post_id: analysis.post_id,
        source_post_url: analysis.url,
        source_post_title: analysis.title,
        // ✅ NEW: LeetCode metadata
        leetcode_id: leetcodeMatch.matched ? leetcodeMatch.leetcode_id : null,
        leetcode_frontend_id: leetcodeMatch.matched ? leetcodeMatch.frontend_id : null,
        leetcode_url: leetcodeMatch.matched ? leetcodeMatch.url : null,
        leetcode_title: leetcodeMatch.matched ? leetcodeMatch.title : null,
        leetcode_difficulty: leetcodeMatch.matched ? leetcodeMatch.difficulty : null,
        match_confidence: leetcodeMatch.confidence || 0,
        match_method: leetcodeMatch.method || 'none'
      };

      return questionData;
    });

    const processedQuestions = await Promise.all(questionPromises);

    // Add to collections
    processedQuestions.forEach(questionData => {
      allQuestions.push(questionData);

      // Group by company
      const company = questionData.company;
      if (!questionsByCompany[company]) {
        questionsByCompany[company] = [];
      }
      questionsByCompany[company].push(questionData);
    });
  }

  // Aggregate and deduplicate questions across all posts
  const questionMap = new Map();

  allQuestions.forEach(q => {
    if (questionMap.has(q.normalized)) {
      const existing = questionMap.get(q.normalized);
      existing.frequency += 1;
      existing.post_outcomes.push(q.post_outcome);

      // ✅ NEW: Accumulate source posts (track all posts mentioning this question)
      if (q.source_post_id && !existing.source_posts.some(sp => sp.post_id === q.source_post_id)) {
        existing.source_posts.push({
          post_id: q.source_post_id,
          url: q.source_post_url,
          title: q.source_post_title,
          post_source: q.post_source
        });
      }

      // Keep higher confidence version
      if (q.confidence > existing.confidence) {
        existing.text = q.text;
        existing.source = q.source;
      }
    } else {
      questionMap.set(q.normalized, {
        ...q,
        post_outcomes: [q.post_outcome],
        // ✅ NEW: Initialize source_posts array with first occurrence
        source_posts: q.source_post_id ? [{
          post_id: q.source_post_id,
          url: q.source_post_url,
          title: q.source_post_title,
          post_source: q.post_source
        }] : []
      });
    }
  });

  // Calculate success rates based on post outcomes
  const interviewQuestions = Array.from(questionMap.values()).map(q => {
    const successCount = q.post_outcomes.filter(o => o === 'success').length;
    const failureCount = q.post_outcomes.filter(o => o === 'failure').length;
    const total = successCount + failureCount;

    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 50;

    return {
      text: q.text,
      company: q.company,
      category: q.category,
      difficulty: q.difficulty,
      stage: q.stage,
      successRate,
      frequency: q.frequency,
      avgTime: 30, // Default, can be enhanced later
      topics: q.topics,
      tips: generateQuestionTip(q.category, q.topics[0]),
      post_source: q.post_source, // ✅ Include post source (seed vs rag)
      source_posts: q.source_posts || [], // ✅ NEW: Include source posts array for traceability
      primary_source_url: q.source_posts?.[0]?.url || null, // ✅ NEW: Convenience field for first source URL
      // ✅ LeetCode matching fields
      leetcode_id: q.leetcode_id || null,
      leetcode_frontend_id: q.leetcode_frontend_id || null,
      leetcode_url: q.leetcode_url || null,
      leetcode_title: q.leetcode_title || null,
      leetcode_difficulty: q.leetcode_difficulty || null,
      match_confidence: q.match_confidence || 0,
      match_method: q.match_method || 'none'
    };
  });

  // Sort by frequency (most common first), then by company, then by text
  interviewQuestions.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    if (a.company !== b.company) return a.company.localeCompare(b.company);
    return a.text.localeCompare(b.text);
  });

  console.timeEnd('⏱️  Interview Questions Extraction');
  logger.info(`[Pattern Analysis] Extracted ${interviewQuestions.length} unique questions from ${allQuestions.length} raw questions`);
  logger.info(`[Pattern Analysis] Posts processed for questions: ${postsProcessedForQuestions} (${postsSkippedShortText} skipped due to short text <50 chars)`);

  // ============================================================================
  // 14. INTERVIEW QUESTIONS INTELLIGENCE ANALYTICS
  // ============================================================================
  console.time('⏱️  Question Intelligence Analytics');
  logger.info('[Pattern Analysis] Calculating question intelligence metrics from foundation posts...');

  // 14a. Question Frequency Analysis (for Bar Chart) - from actual data only
  const questionFrequencyMap = new Map();
  interviewQuestions.forEach(q => {
    if (!questionFrequencyMap.has(q.text)) {
      questionFrequencyMap.set(q.text, {
        text: q.text,
        count: q.frequency,
        companies: new Set([q.company]),
        categories: new Set([q.category]),
        difficulty: q.difficulty,
        source_posts: q.source_posts || []
      });
    }
  });

  const questionFrequency = Array.from(questionFrequencyMap.values())
    .map(q => ({
      text: q.text,
      count: q.count,
      companies: Array.from(q.companies),
      difficulty: q.difficulty
    }))
    .sort((a, b) => {
      // Deterministic sort: frequency desc, then alphabetically for ties
      if (b.count !== a.count) return b.count - a.count;
      return a.text.localeCompare(b.text);
    })
    .slice(0, 10);  // Top 10 questions

  // 14b. Company Question Profiles (for Stacked Bar Chart) - from actual categories
  const companyQuestionProfiles = {};

  interviewQuestions.forEach(q => {
    const company = q.company;
    if (company === 'Unknown') return;

    if (!companyQuestionProfiles[company]) {
      companyQuestionProfiles[company] = {
        company,
        coding: 0,
        system_design: 0,
        behavioral: 0,
        technical: 0,
        other: 0,
        total: 0
      };
    }

    const profile = companyQuestionProfiles[company];
    profile.total++;

    // Categorize question type from actual category field (no assumptions)
    const category = (q.category || '').toLowerCase();
    if (category.includes('coding') || category.includes('algorithm')) {
      profile.coding++;
    } else if (category.includes('system') || category.includes('design')) {
      profile.system_design++;
    } else if (category.includes('behavioral')) {
      profile.behavioral++;
    } else if (category.includes('technical')) {
      profile.technical++;
    } else {
      profile.other++;
    }
  });

  // Convert to percentages and sort deterministically
  const companyQuestionProfilesArray = Object.values(companyQuestionProfiles)
    .map(profile => ({
      company: profile.company,
      total_questions: profile.total,
      categories: [
        { category: 'Technical', count: profile.technical, percentage: Math.round((profile.technical / profile.total) * 100) },
        { category: 'Behavioral', count: profile.behavioral, percentage: Math.round((profile.behavioral / profile.total) * 100) },
        { category: 'System Design', count: profile.system_design, percentage: Math.round((profile.system_design / profile.total) * 100) },
        { category: 'Coding', count: profile.coding, percentage: Math.round((profile.coding / profile.total) * 100) },
        { category: 'Problem Solving', count: profile.other, percentage: Math.round((profile.other / profile.total) * 100) }
      ]
    }))
    .sort((a, b) => {
      // Deterministic sort: total questions desc, then alphabetically
      if (b.total_questions !== a.total_questions) return b.total_questions - a.total_questions;
      return a.company.localeCompare(b.company);
    })
    .slice(0, 8);  // Top 8 companies

  // 14c. Difficulty Distribution (for Histogram) - from actual difficulty values
  const difficultyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  interviewQuestions.forEach(q => {
    const rounded = Math.round(q.difficulty);
    if (rounded >= 1 && rounded <= 5) {
      difficultyDistribution[rounded]++;
    }
  });

  // Calculate percentages from actual counts
  const totalQuestions = interviewQuestions.length;
  const difficultyDistributionPercent = {
    1: Math.round((difficultyDistribution[1] / totalQuestions) * 100),
    2: Math.round((difficultyDistribution[2] / totalQuestions) * 100),
    3: Math.round((difficultyDistribution[3] / totalQuestions) * 100),
    4: Math.round((difficultyDistribution[4] / totalQuestions) * 100),
    5: Math.round((difficultyDistribution[5] / totalQuestions) * 100)
  };

  // 14d. Topic Distribution (for Donut Chart) - from actual categories
  const topicDistribution = {};

  interviewQuestions.forEach(q => {
    const category = q.category || 'Other';
    topicDistribution[category] = (topicDistribution[category] || 0) + 1;
  });

  const topicDistributionArray = Object.entries(topicDistribution)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalQuestions) * 100)
    }))
    .sort((a, b) => {
      // Deterministic sort: count desc, then alphabetically
      if (b.count !== a.count) return b.count - a.count;
      return a.category.localeCompare(b.category);
    });

  // 14e. Generate Insights (rule-based, from actual data patterns only)
  const questionInsights = [];

  // Insight 1: Most frequent question (from actual frequency data)
  if (questionFrequency.length > 0) {
    const topQuestion = questionFrequency[0];
    questionInsights.push({
      type: 'frequency',
      text: `"${topQuestion.text}" is the most frequently asked question, appearing ${topQuestion.count} times across ${topQuestion.companies.length} companies.`,
      filter: { questionText: topQuestion.text }
    });
  }

  // Insight 2: Company with most system design questions (from actual percentages)
  const companyWithMostSystemDesign = companyQuestionProfilesArray
    .slice()  // Copy to avoid mutation
    .sort((a, b) => b.system_design - a.system_design)[0];
  if (companyWithMostSystemDesign && companyWithMostSystemDesign.system_design > 30) {
    questionInsights.push({
      type: 'company_focus',
      text: `${companyWithMostSystemDesign.company} emphasizes system design questions (${companyWithMostSystemDesign.system_design}% of all questions).`,
      filter: { company: companyWithMostSystemDesign.company, category: 'System Design' }
    });
  }

  // Insight 3: Difficulty trend (from actual difficulty distribution)
  const mediumHardCount = difficultyDistribution[3] + difficultyDistribution[4] + difficultyDistribution[5];
  const mediumHardPercent = Math.round((mediumHardCount / totalQuestions) * 100);
  if (mediumHardPercent > 60) {
    questionInsights.push({
      type: 'difficulty',
      text: `${mediumHardPercent}% of questions are medium-to-hard difficulty (3-5), indicating senior-level interview processes.`,
      filter: { difficulty: 'medium,hard' }
    });
  }

  // Calculate average difficulty for stats row
  const avgDifficulty = (interviewQuestions.reduce((sum, q) => sum + q.difficulty, 0) / totalQuestions).toFixed(1);

  console.timeEnd('⏱️  Question Intelligence Analytics');
  logger.info(`[Pattern Analysis] Generated ${questionInsights.length} insights from ${totalQuestions} questions across ${companyQuestionProfilesArray.length} companies`);

  // ============================================================================
  // 12. COMPANY-TIERED INTERVIEW QUESTIONS
  // ============================================================================
  // Categorize questions by company relevance (seed vs similar vs general)
  console.time('⏱️  Company-Tiered Questions Organization');
  logger.info('[Pattern Analysis] Organizing questions by company tiers...');

  const questionsBySeedCompany = new Map();
  const questionsBySimilarCompany = new Map();
  const questionsGeneral = [];

  interviewQuestions.forEach(question => {
    const company = question.company;

    // Tier 1: Seed companies (from user's uploaded posts)
    const isSeedCompany = Array.from(seedCompanies).some(seed =>
      seed.toLowerCase() === (company || '').toLowerCase()
    );

    if (isSeedCompany) {
      if (!questionsBySeedCompany.has(company)) {
        questionsBySeedCompany.set(company, {
          company,
          questions: [],
          categoryBreakdown: {}
        });
      }
      const companyData = questionsBySeedCompany.get(company);
      companyData.questions.push(question);

      // Track category breakdown
      companyData.categoryBreakdown[question.category] =
        (companyData.categoryBreakdown[question.category] || 0) + 1;
    }
    // Tier 2: Similar companies (from RAG, exclude Unknown)
    else if (company && company !== 'Unknown') {
      if (!questionsBySimilarCompany.has(company)) {
        questionsBySimilarCompany.set(company, {
          company,
          questions: [],
          categoryBreakdown: {},
          relevanceScore: 0,
          sourcePostCount: 0
        });
      }
      const companyData = questionsBySimilarCompany.get(company);
      companyData.questions.push(question);

      // Track category breakdown
      companyData.categoryBreakdown[question.category] =
        (companyData.categoryBreakdown[question.category] || 0) + 1;
    }
    // Tier 3: General patterns (Unknown or null company)
    else {
      questionsGeneral.push(question);
    }
  });

  // Calculate relevance scores for similar companies (based on RAG similarity)
  questionsBySimilarCompany.forEach((companyData, companyName) => {
    // Find this company in companyTrends to get post count
    const companyTrend = companyTrends.find(c =>
      c.company.toLowerCase() === companyName.toLowerCase()
    );

    if (companyTrend) {
      companyData.sourcePostCount = companyTrend.total_posts;

      // Relevance score calculation:
      // - Higher post count = more relevant
      // - Questions count also factors in
      const postCountScore = Math.min(100, (companyTrend.total_posts / analyses.length) * 100);
      const questionCountScore = Math.min(100, (companyData.questions.length / 10) * 100);
      companyData.relevanceScore = Math.round((postCountScore * 0.7) + (questionCountScore * 0.3));
    } else {
      companyData.relevanceScore = 30; // Default low relevance
    }
  });

  // Sort similar companies by relevance (descending)
  const sortedSimilarCompanies = Array.from(questionsBySimilarCompany.values())
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.company.localeCompare(b.company); // Stable sort by name
    });

  // Apply relevance threshold filter (>75% relevance OR top 5)
  const RELEVANCE_THRESHOLD = 75;
  const MAX_SIMILAR_COMPANIES = 5;

  const filteredSimilarCompanies = sortedSimilarCompanies
    .filter(c => c.relevanceScore >= RELEVANCE_THRESHOLD)
    .slice(0, MAX_SIMILAR_COMPANIES);

  // If threshold filtering gives us fewer than 3, take top 3 anyway
  if (filteredSimilarCompanies.length < 3 && sortedSimilarCompanies.length >= 3) {
    filteredSimilarCompanies.push(
      ...sortedSimilarCompanies
        .filter(c => !filteredSimilarCompanies.includes(c))
        .slice(0, 3 - filteredSimilarCompanies.length)
    );
  }

  // Format category breakdown for frontend
  const formatCategoryBreakdown = (breakdown, totalQuestions) => {
    return Object.entries(breakdown).map(([category, count]) => ({
      category,
      count,
      percentage: parseFloat(((count / totalQuestions) * 100).toFixed(1))
    })).sort((a, b) => b.count - a.count);
  };

  // Build Tier 1: Your Companies
  const tier1YourCompanies = Array.from(questionsBySeedCompany.values()).map(companyData => ({
    company: companyData.company,
    tier: 'seed',
    totalQuestions: companyData.questions.length,
    categoryBreakdown: formatCategoryBreakdown(
      companyData.categoryBreakdown,
      companyData.questions.length
    ),
    questions: companyData.questions,
    badge: 'YOUR COMPANY',
    badgeColor: '#3B82F6', // Blue
    description: `Based on ${companyData.questions.length} questions from your uploaded posts`
  })).sort((a, b) => {
    // Sort by question count DESC, then by name ASC
    if (b.totalQuestions !== a.totalQuestions) {
      return b.totalQuestions - a.totalQuestions;
    }
    return a.company.localeCompare(b.company);
  });

  // Build Tier 2: Similar Companies (filtered by relevance)
  const tier2SimilarCompanies = filteredSimilarCompanies.map(companyData => ({
    company: companyData.company,
    tier: 'similar',
    totalQuestions: companyData.questions.length,
    categoryBreakdown: formatCategoryBreakdown(
      companyData.categoryBreakdown,
      companyData.questions.length
    ),
    questions: companyData.questions,
    relevanceScore: companyData.relevanceScore,
    sourcePostCount: companyData.sourcePostCount,
    badge: 'SIMILAR',
    badgeColor: '#6B7280', // Gray
    description: `Based on ${companyData.sourcePostCount} similar interview posts (${companyData.relevanceScore}% relevant)`
  }));

  // Build Tier 3: General Patterns
  const generalCategoryBreakdown = {};
  questionsGeneral.forEach(q => {
    generalCategoryBreakdown[q.category] = (generalCategoryBreakdown[q.category] || 0) + 1;
  });

  const tier3GeneralPatterns = questionsGeneral.length > 0 ? {
    company: 'Common Patterns',  // ✅ Add company field for CompanyTierCard component
    tier: 'general',
    totalQuestions: questionsGeneral.length,
    categoryBreakdown: formatCategoryBreakdown(
      generalCategoryBreakdown,
      questionsGeneral.length
    ),
    questions: questionsGeneral,
    badge: 'CROSS-COMPANY',
    badgeColor: '#9CA3AF', // Light gray
    description: `Common patterns from ${questionsGeneral.length} interview experiences across various companies`
  } : null;

  console.timeEnd('⏱️  Company-Tiered Questions Organization');
  logger.info(`[Company Tiers] Tier 1 (Your Companies): ${tier1YourCompanies.length} companies, ${Array.from(questionsBySeedCompany.values()).reduce((sum, c) => sum + c.questions.length, 0)} questions`);
  logger.info(`[Company Tiers] Tier 2 (Similar): ${tier2SimilarCompanies.length} companies (filtered from ${sortedSimilarCompanies.length} by relevance)`);
  logger.info(`[Company Tiers] Tier 3 (General): ${questionsGeneral.length} questions`);

  // Build company-tiered response
  const companyTieredQuestions = {
    yourCompanies: tier1YourCompanies,
    similarCompanies: tier2SimilarCompanies,
    generalPatterns: tier3GeneralPatterns,
    metadata: {
      seedCompanyNames: Array.from(seedCompanies),
      totalSeedQuestions: Array.from(questionsBySeedCompany.values())
        .reduce((sum, c) => sum + c.questions.length, 0),
      totalSimilarQuestions: tier2SimilarCompanies
        .reduce((sum, c) => sum + c.totalQuestions, 0),
      totalGeneralQuestions: questionsGeneral.length,
      relevanceThreshold: RELEVANCE_THRESHOLD,
      filteredOutCompanies: sortedSimilarCompanies.length - tier2SimilarCompanies.length
    }
  };

  // ✅ Calculate data_coverage from foundation posts instead of hardcoding
  const dataCoverage = analyses.length >= 50 ? 'High' : analyses.length >= 20 ? 'Medium' : 'Low';

  // ============================================================================
  // TEMPORAL INTELLIGENCE - Phase 3.1 Refactored (Database Query)
  // ============================================================================
  logger.info(`\n${'='.repeat(80)}`);
  logger.info(`[Temporal Intelligence] Generating monthly trends from ALL 2023-2025 database posts`);
  logger.info(`${'='.repeat(80)}`);

  let temporalTrends = null;
  try {
    // Query database directly for ALL 2023-2025 posts (not just RAG foundation posts)
    temporalTrends = await generateTemporalIntelligence();

    if (temporalTrends && !temporalTrends.insufficient_data) {
      logger.info(`[Temporal Intelligence] ✅ Generated monthly trends successfully`);
      logger.info(`[Temporal Intelligence] Date range: ${temporalTrends.summary.date_range.start} to ${temporalTrends.summary.date_range.end}`);
      logger.info(`[Temporal Intelligence] Total posts: ${temporalTrends.summary.total_posts}`);
      logger.info(`[Temporal Intelligence] Months analyzed: ${temporalTrends.summary.months_analyzed}`);
      logger.info(`[Temporal Intelligence] Question trends: ${Object.keys(temporalTrends.monthly_data.question_trends).length}`);
      logger.info(`[Temporal Intelligence] Skill trends: ${Object.keys(temporalTrends.monthly_data.skill_trends).length}`);
      logger.info(`[Temporal Intelligence] Emerging questions: ${temporalTrends.summary.top_emerging_questions.length}`);
      logger.info(`[Temporal Intelligence] Emerging skills: ${temporalTrends.summary.top_emerging_skills.length}`);
    } else {
      logger.warn(`[Temporal Intelligence] ⚠️ Insufficient data for temporal analysis`);
    }
  } catch (error) {
    logger.error(`[Temporal Intelligence] ❌ Error generating temporal trends:`, error);
    temporalTrends = null;
  }

  logger.info(`${'='.repeat(80)}\n`);

  return {
    summary: {
      total_posts_analyzed: analyses.length,
      unique_companies: Object.keys(companyStats).length,
      unique_roles: roleBreakdown.length,  // ✅ FIXED: Use roleBreakdown array length instead of roleStats
      overall_success_rate: overallSuccessRate + '%',
      data_coverage: dataCoverage
    },
    narrative_summary: narrativeSummary,
    comparative_table: comparativeTable,
    skill_frequency: topSkills,
    skill_success_correlation: skillSuccessCorrelation,  // Real success impact data for Skills Priority Matrix
    company_trends: companyTrends,
    role_breakdown: roleBreakdown,
    question_distribution: questionDistribution,
    knowledge_gaps: knowledgeGaps,
    sentiment_metrics: {
      ...sentimentMetrics,
      success_rate: overallSuccessRate + '%'
    },
    correlation_insights: correlations,
    top_keywords: topKeywords,
    example_quotes: exampleQuotes,
    knowledge_graph: knowledgeGraph,
    skill_pairs: skillPairs,  // ✅ NEW: Top skill combinations with success rates for CriticalSkillsAnalysisV1.vue
    emotion_keywords: topEmotions,
    difficulty_by_company: difficultyByCompany,
    stage_by_company: stageByCompany,  // ✅ NEW: Stage progression data for CompanyIntelligenceV1.vue
    temporal_data: temporalDataFormatted,  // ✅ NEW: Time-series trends for CompanyIntelligenceV1.vue timeline
    sentiment_timeline: sentimentTimeline,
    interview_questions: interviewQuestions,  // ✅ Real pattern-extracted interview questions (backward compatible)
    company_tiered_questions: companyTieredQuestions,  // ✅ NEW: Categorized by company tiers (seed/similar/general)
    question_intelligence: {  // ✅ NEW: Intelligence analytics for dashboard charts (Phase 6 Sprint 4)
      question_frequency: questionFrequency,
      company_question_profiles: companyQuestionProfilesArray,
      difficulty_distribution: difficultyDistribution,
      difficulty_distribution_percent: difficultyDistributionPercent,
      topic_distribution: topicDistributionArray,
      insights: questionInsights,
      total_questions: totalQuestions,
      avg_difficulty: avgDifficulty
    },
    seed_companies: Array.from(seedCompanies),  // ✅ NEW: Explicit seed companies list
    source_posts: similarPosts || [],  // ✅ NEW: Raw RAG similar posts for Source Data Modal
    temporal_trends: temporalTrends,  // ✅ PHASE 1 & 2: Temporal intelligence (2024 vs 2025 trends)
    generated_at: new Date().toISOString()
  };
}

/**
 * ============================================================================
 * BATCH ANALYSIS CACHING FUNCTIONS
 * ============================================================================
 * These functions implement caching for batch analysis to ensure deterministic
 * reports. User post embeddings and pattern_analysis results are cached per
 * batch_id to prevent regeneration on every page refresh.
 */

/**
 * Get cached batch analysis data
 * Returns { userPostEmbeddings, patternAnalysis } or null if not cached
 */
async function getCachedBatchData(batchId) {
  try {
    const result = await pool.query(`
      SELECT user_post_embeddings, pattern_analysis, enhanced_intelligence
      FROM batch_analysis_cache
      WHERE batch_id = $1
    `, [batchId]);

    if (result.rows.length === 0) {
      return null;
    }

    // Update cache hit counter and last accessed time
    await pool.query(`
      UPDATE batch_analysis_cache
      SET cache_hits = cache_hits + 1,
          last_accessed_at = CURRENT_TIMESTAMP
      WHERE batch_id = $1
    `, [batchId]);

    logger.info(`[Cache HIT] Retrieved cached data for batch ${batchId} (has enhanced_intelligence: ${!!result.rows[0].enhanced_intelligence})`);
    return {
      userPostEmbeddings: result.rows[0].user_post_embeddings,
      patternAnalysis: result.rows[0].pattern_analysis,
      enhancedIntelligence: result.rows[0].enhanced_intelligence
    };
  } catch (error) {
    logger.error(`[Cache] Error retrieving cache for batch ${batchId}:`, error.message);
    return null;
  }
}

/**
 * Save batch analysis data to cache
 */
async function saveBatchCache(batchId, userPostEmbeddings, patternAnalysis, embeddingModel, enhancedIntelligence = null, userPostsCount = 0, ragSimilarPostsCount = 0) {
  try {
    const foundationPoolSize = userPostsCount + ragSimilarPostsCount;

    await pool.query(`
      INSERT INTO batch_analysis_cache (
        batch_id,
        user_post_embeddings,
        pattern_analysis,
        embedding_model,
        enhanced_intelligence,
        foundation_pool_size,
        user_posts_count,
        rag_similar_posts_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (batch_id) DO UPDATE SET
        user_post_embeddings = EXCLUDED.user_post_embeddings,
        pattern_analysis = EXCLUDED.pattern_analysis,
        embedding_model = EXCLUDED.embedding_model,
        enhanced_intelligence = EXCLUDED.enhanced_intelligence,
        foundation_pool_size = EXCLUDED.foundation_pool_size,
        user_posts_count = EXCLUDED.user_posts_count,
        rag_similar_posts_count = EXCLUDED.rag_similar_posts_count,
        cached_at = CURRENT_TIMESTAMP
    `, [
      batchId,
      JSON.stringify(userPostEmbeddings),
      JSON.stringify(patternAnalysis),
      embeddingModel,
      enhancedIntelligence ? JSON.stringify(enhancedIntelligence) : null,
      foundationPoolSize,
      userPostsCount,
      ragSimilarPostsCount
    ]);

    logger.info(`[Cache SAVE] Saved cache for batch ${batchId} with enhanced_intelligence: ${!!enhancedIntelligence}, foundation_pool: ${foundationPoolSize} (${userPostsCount} user + ${ragSimilarPostsCount} RAG)`);
  } catch (error) {
    logger.error(`[Cache] Error saving cache for batch ${batchId}:`, error.message);
    // Don't throw - caching is optional enhancement
  }
}

/**
 * Retrieve similar posts using cached embeddings
 * @param {Array} userPostEmbeddings - [{text, embedding}, ...]
 * @param {Number} similarPerPost - Number of similar posts per user post
 * @returns {Array} Deduplicated similar posts
 */
async function retrieveSimilarPostsWithCachedEmbeddings(userPostEmbeddings, similarPerPost = 50) {
  const allSimilarPosts = [];
  const seenPostIds = new Set();

  for (const { text, embedding } of userPostEmbeddings) {
    try {
      // Find similar posts using the cached embedding
      const similarPosts = await findSimilarPostsByEmbedding(embedding, similarPerPost);

      // Add to collection (deduplicate by post_id)
      for (const similar of similarPosts) {
        if (!seenPostIds.has(similar.post_id)) {
          seenPostIds.add(similar.post_id);
          allSimilarPosts.push(similar);
        }
      }
    } catch (error) {
      logger.error(`[RAG Cached] Error retrieving similar posts: ${error.message}`);
    }
  }

  logger.info(`[RAG Cached] Retrieved ${allSimilarPosts.length} unique similar posts using cached embeddings`);
  return allSimilarPosts;
}

/**
 * Get single analysis history for a specific user
 * Returns single analyses from analysis_results table (NOT batch analyses)
 */
async function getSingleAnalysisHistory(req, res) {
  try {
    const userId = req.user?.id || req.query.userId;
    const limit = parseInt(req.query.limit) || 100;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.info(`[Single Analysis History] Fetching single analyses for user ${userId}, limit ${limit}`);

    const query = `
      SELECT
        id,
        original_text,
        company,
        role,
        outcome,
        difficulty_level as difficulty,
        sentiment,
        interview_topics,
        industry,
        experience_level,
        created_at,
        full_result,
        user_id
      FROM analysis_results
      WHERE user_id = $1 AND batch_id IS NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    logger.info(`[Single Analysis History] Found ${result.rows.length} single analyses`);

    // Return in format compatible with frontend reportsStore
    const analyses = result.rows.map(row => ({
      id: row.id,
      original_text: row.original_text,
      company: row.company,
      role: row.role,
      outcome: row.outcome,
      difficulty: row.difficulty,
      sentiment: row.sentiment,
      interview_topics: row.interview_topics,
      industry: row.industry,
      experience_level: row.experience_level,
      created_at: row.created_at,
      user_id: row.user_id,
      type: 'single', // Mark as single analysis
      full_result: row.full_result
    }));

    res.json(analyses);

  } catch (error) {
    logger.error('[Single Analysis History] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch single analysis history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

module.exports = {
  analyzeSinglePost,
  analyzeBatchPosts,
  getHistory,
  getCachedBatchReport,
  getCachedBatchData,
  getSingleAnalysisHistory,
  healthCheck,
  getServiceInfo
};