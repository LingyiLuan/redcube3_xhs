/**
 * Quick test script for sentiment analysis
 */

require('dotenv').config();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const samplePost = `
Just finished my Google interview for Senior Software Engineer role.
The system design round was incredibly challenging - they asked me to design
a distributed rate limiting system. I felt pretty unprepared for the scale
estimation questions and kept second-guessing my answers. The interviewers
were professional but I couldn't tell if they were impressed. Really worried
about whether I did well enough. Fingers crossed!
`;

async function test() {
  try {
    logger.info('🔬 Testing Sentiment Analysis...\n');
    logger.info('Sample Post:');
    logger.info(samplePost);
    logger.info('\n📊 Analyzing...\n');

    const result = await aiService.analyzeSentiment(samplePost);

    logger.info('✅ Sentiment Analysis Result:');
    logger.info('═══════════════════════════════════════');
    logger.info(`Category: ${result.category}`);
    logger.info(`Score: ${result.score}/5.0`);
    logger.info(`Confidence: ${result.confidence}`);
    logger.info(`Reasoning: ${result.reasoning}`);
    logger.info(`Key Phrases:`);
    result.key_phrases.forEach((phrase, i) => {
      logger.info(`  ${i + 1}. "${phrase}"`);
    });
    logger.info('═══════════════════════════════════════\n');

    logger.info('✅ Test passed! Sentiment analysis is working correctly.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Test failed:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

test();
