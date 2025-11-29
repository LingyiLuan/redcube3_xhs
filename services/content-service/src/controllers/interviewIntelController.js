/**
 * Interview Intel Controller
 *
 * HTTP request handlers for Interview Intel UGC platform
 * Handles creating, browsing, voting on interview experiences
 */

const interviewIntelService = require('../services/interviewIntelService');
const reputationService = require('../services/reputationService');
const logger = require('../utils/logger');

/**
 * POST /api/interview-intel/experiences
 * Create a new interview experience
 */
async function createExperience(req, res) {
  try {
    const {
      company,
      role,
      interviewDate,
      difficulty,
      outcome,
      questionsAsked,
      preparationFeedback,
      tipsForOthers,
      areasStruggled
    } = req.body;

    // Validation
    if (!company || !role) {
      return res.status(400).json({
        success: false,
        error: 'Company and role are required'
      });
    }

    if (difficulty && (difficulty < 1 || difficulty > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty must be between 1 and 5'
      });
    }

    // Get user ID from request (assuming auth middleware sets this)
    const userId = req.user?.id || 1; // Default to user 1 for now

    const result = await interviewIntelService.createExperience({
      userId,
      company,
      role,
      interviewDate,
      difficulty,
      outcome,
      questionsAsked,
      preparationFeedback,
      tipsForOthers,
      areasStruggled
    });

    if (result.success) {
      // Award reputation points for sharing experience
      const experience = result.experience;
      let pointsAwarded = reputationService.POINT_VALUES.SHARE_EXPERIENCE;

      // Bonus for adding 3+ specific questions
      if (questionsAsked && questionsAsked.length >= 3) {
        pointsAwarded += reputationService.POINT_VALUES.SPECIFIC_QUESTIONS_BONUS;
      }

      // Bonus for detailed preparation tips (200+ characters)
      if (tipsForOthers && tipsForOthers.length >= 200) {
        pointsAwarded += reputationService.POINT_VALUES.PREPARATION_TIPS_BONUS;
      }

      // Award points (non-blocking)
      reputationService.awardPoints(
        userId,
        pointsAwarded,
        'Shared interview experience',
        'experience',
        experience.id,
        { company, role, difficulty }
      ).catch(err => {
        logger.error('[InterviewIntelController] Error awarding reputation points:', err);
      });

      return res.status(201).json({
        success: true,
        data: experience,
        message: 'Interview experience created successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error creating experience:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/experiences
 * Get experiences with filters and pagination
 */
async function getExperiences(req, res) {
  try {
    const {
      company,
      role,
      difficulty,
      outcome,
      minDifficulty,
      maxDifficulty,
      startDate,
      endDate,
      verified,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {
      company,
      role,
      difficulty: difficulty ? parseInt(difficulty) : undefined,
      outcome,
      minDifficulty: minDifficulty ? parseInt(minDifficulty) : undefined,
      maxDifficulty: maxDifficulty ? parseInt(maxDifficulty) : undefined,
      startDate,
      endDate,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined
    };

    const pagination = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'DESC'
    };

    const result = await interviewIntelService.getExperiences(filters, pagination);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences,
        pagination: result.pagination
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error getting experiences:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/experiences/:id
 * Get a single experience by ID
 */
async function getExperienceById(req, res) {
  try {
    const { id } = req.params;

    const result = await interviewIntelService.getExperienceById(parseInt(id));

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experience
      });
    } else {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error getting experience:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/experiences/:id/citations
 * Get citations for an experience
 */
async function getExperienceCitations(req, res) {
  try {
    const { id } = req.params;

    const result = await interviewIntelService.getExperienceCitations(parseInt(id));

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          citations: result.citations,
          count: result.count
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error getting citations:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/interview-intel/experiences/:id/vote
 * Vote on an experience (upvote or downvote)
 */
async function voteExperience(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type. Must be "upvote" or "downvote"'
      });
    }

    // Get user ID from request
    const userId = req.user?.id || 1;

    const result = await interviewIntelService.voteExperience(
      parseInt(id),
      userId,
      voteType
    );

    if (result.success) {
      // Award reputation points for upvotes (to experience author and voter)
      if (result.voteType === 'upvote') {
        // Award +5 points to the experience author
        reputationService.awardPoints(
          result.authorId,
          reputationService.POINT_VALUES.RECEIVE_UPVOTE,
          'Received upvote on interview experience',
          'upvote',
          parseInt(id),
          { voterId: userId }
        ).catch(err => {
          logger.error('[InterviewIntelController] Error awarding upvote points to author:', err);
        });

        // Award +1 point to the voter for engaging
        reputationService.awardPoints(
          userId,
          reputationService.POINT_VALUES.GIVE_UPVOTE,
          'Gave upvote on interview experience',
          'upvote',
          parseInt(id),
          { authorId: result.authorId }
        ).catch(err => {
          logger.error('[InterviewIntelController] Error awarding upvote points to voter:', err);
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          helpfulness_ratio: result.helpfulness_ratio
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error voting on experience:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/my-experiences
 * Get current user's experiences
 */
async function getMyExperiences(req, res) {
  try {
    const userId = req.user?.id || 1;

    const result = await interviewIntelService.getUserExperiences(userId);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error getting user experiences:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/trending
 * Get trending experiences (most cited in last 30 days)
 */
async function getTrendingExperiences(req, res) {
  try {
    const { limit } = req.query;

    const result = await interviewIntelService.getTrendingExperiences(
      limit ? parseInt(limit) : 10
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error getting trending experiences:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/interview-intel/search
 * Search experiences by keywords
 */
async function searchExperiences(req, res) {
  try {
    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const result = await interviewIntelService.searchExperiences(
      q,
      limit ? parseInt(limit) : 20
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.experiences,
        count: result.count
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error searching experiences:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/interview-intel/experiences/:id/cite
 * Record that an experience was cited/analyzed
 */
async function citeExperience(req, res) {
  try {
    const { id } = req.params;
    const { workflowId, analysisType } = req.body;

    // Get user ID from request
    const userId = req.user?.id || 1;

    const result = await interviewIntelService.citeExperience(
      parseInt(id),
      userId,
      workflowId,
      analysisType
    );

    if (result.success) {
      // Award +10 reputation points to the experience author for being cited/analyzed
      if (result.authorId) {
        reputationService.awardPoints(
          result.authorId,
          reputationService.POINT_VALUES.EXPERIENCE_ANALYZED,
          'Interview experience was cited in analysis',
          'citation',
          parseInt(id),
          { citedBy: userId, workflowId, analysisType }
        ).catch(err => {
          logger.error('[InterviewIntelController] Error awarding citation points:', err);
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          citationCount: result.citationCount,
          lastAnalyzedAt: result.lastAnalyzedAt
        },
        message: 'Citation recorded successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('[InterviewIntelController] Error citing experience:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  createExperience,
  getExperiences,
  getExperienceById,
  getExperienceCitations,
  voteExperience,
  getMyExperiences,
  getTrendingExperiences,
  searchExperiences,
  citeExperience
};
