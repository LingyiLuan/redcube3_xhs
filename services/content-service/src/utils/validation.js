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
      id: Joi.string().optional()
    })
  ).min(1).max(20).required(),
  userId: Joi.number().optional(),
  analyzeConnections: Joi.boolean().default(true)
});

module.exports = {
  analyzeSchema,
  batchAnalyzeSchema
};