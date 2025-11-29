const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

/**
 * Scrape all LeetCode questions using GraphQL API
 * Returns: Array of {questionId, title, titleSlug, difficulty, topicTags, stats}
 */
async function scrapeAllLeetCodeQuestions() {
  console.log('🔍 Scraping LeetCode database via GraphQL API...');

  const query = `
    query problemsetQuestionList {
      problemsetQuestionList: questionList(
        categorySlug: ""
        limit: -1
        skip: 0
        filters: {}
      ) {
        total: totalNum
        questions: data {
          questionId
          questionFrontendId
          title
          titleSlug
          difficulty
          isPaidOnly
          topicTags {
            name
            slug
          }
          stats
        }
      }
    }
  `;

  try {
    const response = await axios.post(LEETCODE_GRAPHQL_ENDPOINT, {
      query,
      variables: {}
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from LeetCode API');
    }

    const questions = response.data.data.problemsetQuestionList.questions;
    const total = response.data.data.problemsetQuestionList.total;

    console.log(`✅ Successfully scraped ${questions.length} LeetCode questions (total: ${total})`);
    console.log(`   Difficulty breakdown:`);

    // Count by difficulty
    const diffCounts = { Easy: 0, Medium: 0, Hard: 0 };
    questions.forEach(q => {
      if (diffCounts[q.difficulty] !== undefined) {
        diffCounts[q.difficulty]++;
      }
    });

    console.log(`   - Easy: ${diffCounts.Easy}`);
    console.log(`   - Medium: ${diffCounts.Medium}`);
    console.log(`   - Hard: ${diffCounts.Hard}`);
    console.log(`   - Premium: ${questions.filter(q => q.isPaidOnly).length}`);

    return questions;
  } catch (error) {
    console.error('❌ Error scraping LeetCode:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Process and normalize difficulty to 1-5 scale
 * Easy → 2, Medium → 3, Hard → 4
 * Leaves room for 1 (very easy) and 5 (very hard) for future granularity
 */
function normalizeDifficulty(leetcodeDifficulty) {
  const mapping = {
    'Easy': 2,
    'Medium': 3,
    'Hard': 4
  };
  return mapping[leetcodeDifficulty] || 3;
}

/**
 * Save questions to PostgreSQL database
 */
async function saveLeetCodeQuestions(questions) {
  console.log('\n💾 Saving LeetCode questions to PostgreSQL database...');

  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leetcode_questions (
        id SERIAL PRIMARY KEY,
        leetcode_id INTEGER UNIQUE NOT NULL,
        frontend_id INTEGER,
        title TEXT NOT NULL,
        title_slug TEXT UNIQUE NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        difficulty_numeric INTEGER NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        topic_tags JSONB DEFAULT '[]',
        stats JSONB,
        url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_leetcode_title ON leetcode_questions(title);
      CREATE INDEX IF NOT EXISTS idx_leetcode_title_slug ON leetcode_questions(title_slug);
      CREATE INDEX IF NOT EXISTS idx_leetcode_difficulty ON leetcode_questions(difficulty);
      CREATE INDEX IF NOT EXISTS idx_leetcode_difficulty_numeric ON leetcode_questions(difficulty_numeric);
      CREATE INDEX IF NOT EXISTS idx_leetcode_frontend_id ON leetcode_questions(frontend_id);
    `);

    console.log('   ✅ Table and indexes created/verified');

    let saved = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches for better performance
    const batchSize = 100;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      for (const q of batch) {
        try {
          const topicTags = q.topicTags ? q.topicTags.map(tag => tag.name) : [];
          const url = `https://leetcode.com/problems/${q.titleSlug}/`;
          const difficultyNumeric = normalizeDifficulty(q.difficulty);

          const result = await pool.query(`
            INSERT INTO leetcode_questions
            (leetcode_id, frontend_id, title, title_slug, difficulty, difficulty_numeric,
             is_premium, topic_tags, url, stats, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (title_slug)
            DO UPDATE SET
              title = EXCLUDED.title,
              difficulty = EXCLUDED.difficulty,
              difficulty_numeric = EXCLUDED.difficulty_numeric,
              topic_tags = EXCLUDED.topic_tags,
              stats = EXCLUDED.stats,
              is_premium = EXCLUDED.is_premium,
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `, [
            parseInt(q.questionId),
            parseInt(q.questionFrontendId),
            q.title,
            q.titleSlug,
            q.difficulty,
            difficultyNumeric,
            q.isPaidOnly || false,
            JSON.stringify(topicTags),
            url,
            q.stats
          ]);

          if (result.rows[0].inserted) {
            saved++;
          } else {
            updated++;
          }
        } catch (error) {
          console.error(`   ❌ Error saving question ${q.title}:`, error.message);
          errors++;
        }
      }

      // Progress indicator
      const progress = Math.min(i + batchSize, questions.length);
      if (progress % 500 === 0 || progress === questions.length) {
        console.log(`   Progress: ${progress}/${questions.length} questions processed (${saved} new, ${updated} updated, ${errors} errors)`);
      }
    }

    console.log(`\n✅ Database save complete:`);
    console.log(`   - New questions: ${saved}`);
    console.log(`   - Updated questions: ${updated}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total: ${saved + updated} questions in database`);

    return { saved, updated, errors };
  } catch (error) {
    console.error('❌ Error saving to database:', error.message);
    throw error;
  }
}

/**
 * Export questions to JSON backup file
 */
async function exportToJSON(questions, outputPath) {
  console.log('\n📄 Exporting to JSON backup...');

  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));

    const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    console.log(`✅ Backup saved to ${outputPath}`);
    console.log(`   File size: ${fileSizeMB} MB`);

    return outputPath;
  } catch (error) {
    console.error('❌ Error exporting to JSON:', error.message);
    throw error;
  }
}

/**
 * Verify database contents
 */
async function verifyDatabase() {
  console.log('\n🔍 Verifying database contents...');

  try {
    // Total count
    const countResult = await pool.query('SELECT COUNT(*) FROM leetcode_questions');
    const total = parseInt(countResult.rows[0].count);
    console.log(`   Total questions in database: ${total}`);

    // Difficulty distribution
    const diffResult = await pool.query(`
      SELECT difficulty, COUNT(*) as count
      FROM leetcode_questions
      GROUP BY difficulty
      ORDER BY difficulty
    `);
    console.log('   Difficulty distribution:');
    diffResult.rows.forEach(row => {
      console.log(`     - ${row.difficulty}: ${row.count}`);
    });

    // Sample questions
    const sampleResult = await pool.query(`
      SELECT frontend_id, title, difficulty, url
      FROM leetcode_questions
      ORDER BY frontend_id
      LIMIT 5
    `);
    console.log('   Sample questions:');
    sampleResult.rows.forEach(row => {
      console.log(`     #${row.frontend_id}: ${row.title} (${row.difficulty})`);
    });

    // Premium count
    const premiumResult = await pool.query(`
      SELECT COUNT(*) FROM leetcode_questions WHERE is_premium = true
    `);
    console.log(`   Premium questions: ${premiumResult.rows[0].count}`);

    return true;
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log('🚀 LeetCode Database Scraper');
    console.log('=' .repeat(60));
    console.log(`Started at: ${new Date().toISOString()}\n`);

    // Step 1: Scrape all questions from LeetCode
    const questions = await scrapeAllLeetCodeQuestions();

    if (!questions || questions.length === 0) {
      throw new Error('No questions retrieved from LeetCode API');
    }

    // Step 2: Save to PostgreSQL database
    const saveStats = await saveLeetCodeQuestions(questions);

    // Step 3: Export to JSON backup
    const dataDir = path.join(__dirname, '../data');
    const jsonPath = path.join(dataDir, 'leetcode_questions.json');
    await exportToJSON(questions, jsonPath);

    // Step 4: Verify database contents
    await verifyDatabase();

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCRAPING COMPLETE!');
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Questions scraped: ${questions.length}`);
    console.log(`   Database: PostgreSQL (leetcode_questions table)`);
    console.log(`   Backup: ${jsonPath}`);
    console.log('=' .repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  scrapeAllLeetCodeQuestions,
  saveLeetCodeQuestions,
  exportToJSON,
  verifyDatabase
};
