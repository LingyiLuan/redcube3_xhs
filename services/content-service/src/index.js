const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const OpenAI = require('openai');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'redcube_content',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Validation schema for analyze endpoint
const analyzeSchema = Joi.object({
  text: Joi.string().required().min(10).max(10000),
  userId: Joi.number().optional()
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'content-service' });
});

// Main analysis endpoint
app.post('/api/content/analyze', async (req, res) => {
  try {
    // Validate input
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, userId = null } = value;

    // Call OpenAI for analysis
    const analysisResult = await analyzeXHSPost(text);

    // Store in database for future features (connections, learning paths)
    const savedResult = await saveAnalysisResult(text, analysisResult, userId);

    res.json({
      id: savedResult.id,
      ...analysisResult,
      createdAt: savedResult.created_at
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// OpenAI analysis function
async function analyzeXHSPost(text) {
  const prompt = `Analyze this XHS (小红书) post about job interviews/career experiences and extract structured information. Return ONLY valid JSON with these exact fields:

{
  "company": "string (company name mentioned, or null if none)",
  "role": "string (job role/position mentioned, or null if none)",
  "sentiment": "string (positive/negative/neutral based on overall tone)",
  "interview_topics": ["array of specific interview topics/skills mentioned"],
  "industry": "string (industry/field mentioned, or null if none)",
  "experience_level": "string (intern/entry/mid/senior/executive, or null if unclear)",
  "preparation_materials": ["array of study materials/resources mentioned"],
  "key_insights": ["array of 2-3 key takeaways or advice points"]
}

Post content: "${text}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1000
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', completion.choices[0].message.content);
    throw new Error('Invalid AI response format');
  }
}

// Database storage function (designed for future scalability)
async function saveAnalysisResult(originalText, analysisResult, userId) {
  const query = `
    INSERT INTO analysis_results
    (original_text, company, role, sentiment, interview_topics, industry, experience_level, preparation_materials, key_insights, user_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING id, created_at
  `;

  const values = [
    originalText,
    analysisResult.company,
    analysisResult.role,
    analysisResult.sentiment,
    JSON.stringify(analysisResult.interview_topics || []),
    analysisResult.industry,
    analysisResult.experience_level,
    JSON.stringify(analysisResult.preparation_materials || []),
    JSON.stringify(analysisResult.key_insights || []),
    userId
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get analysis history (for future features)
app.get('/api/content/history', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    let query = 'SELECT * FROM analysis_results';
    let values = [];

    if (userId) {
      query += ' WHERE user_id = $1';
      values.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1);
    values.push(limit);

    const result = await pool.query(query, values);

    // Parse JSON fields back to objects
    const history = result.rows.map(row => ({
      ...row,
      interview_topics: JSON.parse(row.interview_topics || '[]'),
      preparation_materials: JSON.parse(row.preparation_materials || '[]'),
      key_insights: JSON.parse(row.key_insights || '[]')
    }));

    res.json(history);
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// Analytics endpoint (for future insights)
app.get('/api/content/analytics', async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT
        company,
        COUNT(*) as mention_count,
        AVG(CASE WHEN sentiment = 'positive' THEN 1 WHEN sentiment = 'negative' THEN -1 ELSE 0 END) as avg_sentiment
      FROM analysis_results
      WHERE company IS NOT NULL
      GROUP BY company
      ORDER BY mention_count DESC
      LIMIT 10
    `;

    const result = await pool.query(analyticsQuery);
    res.json({
      topCompanies: result.rows,
      totalAnalyses: await getTotalAnalysisCount()
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Analytics retrieval failed' });
  }
});

async function getTotalAnalysisCount() {
  const result = await pool.query('SELECT COUNT(*) FROM analysis_results');
  return parseInt(result.rows[0].count);
}

// Legacy endpoints (keeping for backward compatibility)
app.get('/api/content', (req, res) => {
  res.json({ message: 'Content service endpoint - use /api/content/analyze for XHS analysis' });
});

app.get('/api/questions', (req, res) => {
  res.json({ message: 'Legacy questions endpoint - use /api/content/analyze' });
});

app.post('/api/questions', (req, res) => {
  res.json({ message: 'Legacy create question endpoint - use /api/content/analyze' });
});

app.listen(PORT, () => {
  console.log(`Content service with XHS analysis running on port ${PORT}`);
  console.log('OpenAI integration ready for XHS post analysis');
});

module.exports = app;