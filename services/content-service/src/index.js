require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3003;

// Start server
app.listen(PORT, () => {
  console.log(`Content service v2 with OpenRouter integration running on port ${PORT}`);
  console.log('Features: Single analysis, Batch analysis, Connection detection, Enhanced analytics');
  console.log(`AI Provider: ${process.env.OPENROUTER_API_KEY ? 'OpenRouter (with model fallback cascade)' : 'Mock responses only'}`);
});

module.exports = app;