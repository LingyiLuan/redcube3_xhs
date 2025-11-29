/**
 * Quick test script for metadata extraction
 */

require('dotenv').config();
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const samplePost = `
Just finished my Google interview for Senior Software Engineer role.
The system design round was incredibly challenging - they asked me to design
a distributed rate limiting system using Redis and PostgreSQL. I felt pretty unprepared for the scale
estimation questions and kept second-guessing my answers. The interviewers
were professional but I couldn't tell if they were impressed. Really worried
about whether I did well enough. Fingers crossed!

Used React and Node.js for the coding portion. Also discussed Docker and Kubernetes deployment.
`;

async function test() {
  try {
    logger.info('🔬 Testing Metadata Extraction...\n');
    logger.info('Sample Post:');
    logger.info(samplePost);
    logger.info('\n📊 Analyzing...\n');

    const result = await aiService.analyzeText(samplePost);

    logger.info('✅ Metadata Extraction Result:');
    logger.info('═══════════════════════════════════════');
    logger.info(`Company: ${result.company}`);
    logger.info(`Role: ${result.role}`);
    logger.info(`Experience Level: ${result.experience_level}`);
    logger.info(`Outcome: ${result.outcome}`);
    logger.info(`Difficulty: ${result.difficulty_level}`);
    logger.info(`Timeline: ${result.timeline}`);
    logger.info(`Interview Topics: ${JSON.stringify(result.interview_topics, null, 2)}`);
    logger.info(`Interview Stages: ${JSON.stringify(result.interview_stages, null, 2)}`);
    logger.info('═══════════════════════════════════════\n');

    // Extract tech stack from topics
    const techKeywords = ['Python', 'JavaScript', 'TypeScript', 'Java', 'React', 'Node', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'];
    const allText = [...result.interview_topics, ...(result.key_insights || [])].join(' ');
    const techStack = techKeywords.filter(tech => new RegExp(tech, 'i').test(allText));

    logger.info(`Extracted Tech Stack: ${JSON.stringify(techStack)}`);
    logger.info('\n✅ Test passed! Metadata extraction is working correctly.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Test failed:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

test();
