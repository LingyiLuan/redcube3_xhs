const Joi = require('joi');

// Validation schemas
const analyzeSchema = Joi.object({
  text: Joi.string().required().min(10).max(10000),
  userId: Joi.number().optional()
});

const batchAnalyzeSchema = Joi.object({
  posts: Joi.array().items(
    Joi.object({
      text: Joi.string().required().min(10).max(10000),
      id: Joi.string().optional(),
      // Optional metadata from AI Assistant (used as fallback when LLM extraction fails)
      company: Joi.string().optional().allow(null),
      role: Joi.string().optional().allow(null),
      level: Joi.string().optional().allow(null),
      outcome: Joi.string().optional().allow(null),
      postId: Joi.string().optional().allow(null),
      url: Joi.string().optional().allow(null),
      title: Joi.string().optional().allow(null)
    })
  ).min(1).max(20).required(),
  userId: Joi.number().optional(),
  analyzeConnections: Joi.boolean().default(true)
});

module.exports = {
  analyzeSchema,
  batchAnalyzeSchema
};