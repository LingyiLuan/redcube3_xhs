/**
 * Benchmark Cache Service
 *
 * Pre-computes expensive benchmark queries and stores results in cache tables
 * Runs as background job (daily cron) to avoid 504 timeouts during batch analysis
 *
 * Architecture:
 * - Queries ALL is_relevant=true posts from scraped_posts table
 * - Stores aggregated results in benchmark_role_intelligence and benchmark_stage_success tables
 * - Tracks cache freshness in benchmark_metadata table
 * - Designed to run daily after new posts are scraped
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class BenchmarkCacheService {
  /**
   * Main entry point: Refresh all benchmark caches
   * Call this from cron job or manually via API endpoint
   */
  async refreshAllBenchmarkCaches() {
    logger.info('[BenchmarkCache] ========================================');
    logger.info('[BenchmarkCache] Starting benchmark cache refresh...');
    logger.info('[BenchmarkCache] ========================================');

    const startTime = Date.now();

    try {
      // Refresh both benchmark caches in parallel
      const [roleResult, stageResult] = await Promise.all([
        this.refreshRoleIntelligenceCache(),
        this.refreshStageSuccessCache()
      ]);

      const duration = Date.now() - startTime;

      logger.info('[BenchmarkCache] ========================================');
      logger.info('[BenchmarkCache] Benchmark cache refresh COMPLETE');
      logger.info(`[BenchmarkCache] Total duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
      logger.info(`[BenchmarkCache] Role Intelligence: ${roleResult.rowCount} roles cached`);
      logger.info(`[BenchmarkCache] Stage Success: ${stageResult.rowCount} stage records cached`);
      logger.info('[BenchmarkCache] ========================================');

      return {
        success: true,
        duration_ms: duration,
        role_count: roleResult.rowCount,
        stage_count: stageResult.rowCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR during cache refresh:', error);
      throw error;
    }
  }

  /**
   * Refresh Role Intelligence benchmark cache
   * Queries ALL relevant posts and aggregates role statistics
   */
  async refreshRoleIntelligenceCache() {
    logger.info('[BenchmarkCache] Refreshing Role Intelligence cache...');
    const startTime = Date.now();

    try {
      // Step 1: Query role statistics from ALL relevant posts
      const roleStatsQuery = `
        SELECT
          role_type,
          COUNT(*) as total_posts,
          SUM(CASE WHEN outcome IN ('passed', 'success', 'offer', 'accepted') THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN outcome IN ('failed', 'reject', 'rejected') THEN 1 ELSE 0 END) as failure_count
        FROM scraped_posts
        WHERE is_relevant = true
          AND role_type IS NOT NULL
          AND role_type != 'Unknown'
        GROUP BY role_type
        HAVING COUNT(*) >= 2
        ORDER BY COUNT(*) DESC
      `;

      const roleStatsResult = await pool.query(roleStatsQuery);
      logger.info(`[BenchmarkCache] Found ${roleStatsResult.rows.length} roles with ≥2 posts`);

      // Step 2: Query top skills per role
      const skillsByRoleQuery = `
        SELECT
          role_type,
          unnest(tech_stack) as skill,
          COUNT(*) as skill_count
        FROM scraped_posts
        WHERE is_relevant = true
          AND role_type IS NOT NULL
          AND role_type != 'Unknown'
          AND tech_stack IS NOT NULL
          AND array_length(tech_stack, 1) > 0
        GROUP BY role_type, skill
        ORDER BY role_type, skill_count DESC
      `;

      const skillsResult = await pool.query(skillsByRoleQuery);
      logger.info(`[BenchmarkCache] Found ${skillsResult.rows.length} role-skill combinations`);

      // Step 3: Aggregate skills by role
      const skillsByRole = {};
      skillsResult.rows.forEach(row => {
        if (!skillsByRole[row.role_type]) {
          skillsByRole[row.role_type] = [];
        }
        skillsByRole[row.role_type].push({
          skill: row.skill,
          count: parseInt(row.skill_count)
        });
      });

      // Step 4: Clear existing cache
      await pool.query('DELETE FROM benchmark_role_intelligence');
      logger.info('[BenchmarkCache] Cleared old role intelligence cache');

      // Step 5: Insert new cache data
      let insertedCount = 0;
      for (const roleRow of roleStatsResult.rows) {
        const roleType = roleRow.role_type;
        const totalPosts = parseInt(roleRow.total_posts);
        const successCount = parseInt(roleRow.success_count);
        const failureCount = parseInt(roleRow.failure_count);
        const successRate = totalPosts > 0 ? ((successCount / totalPosts) * 100).toFixed(2) : 0;

        // Get top 10 skills for this role
        const topSkills = (skillsByRole[roleType] || [])
          .slice(0, 10)
          .map(s => ({
            skill: s.skill,
            count: s.count,
            percentage: ((s.count / totalPosts) * 100).toFixed(1)
          }));

        const insertQuery = `
          INSERT INTO benchmark_role_intelligence
            (role_type, total_posts, success_count, failure_count, success_rate, top_skills)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await pool.query(insertQuery, [
          roleType,
          totalPosts,
          successCount,
          failureCount,
          successRate,
          JSON.stringify(topSkills)
        ]);

        insertedCount++;
      }

      logger.info(`[BenchmarkCache] Inserted ${insertedCount} role records into cache`);

      // Step 6: Update metadata
      const totalPostsAnalyzed = roleStatsResult.rows.reduce((sum, r) => sum + parseInt(r.total_posts), 0);
      const duration = Date.now() - startTime;

      await pool.query(`
        UPDATE benchmark_metadata
        SET last_computed = NOW(),
            total_posts_analyzed = $1,
            computation_duration_ms = $2,
            updated_at = NOW()
        WHERE cache_type = 'role_intelligence'
      `, [totalPostsAnalyzed, duration]);

      logger.info(`[BenchmarkCache] Role Intelligence cache refreshed successfully in ${duration}ms`);

      return { rowCount: insertedCount, duration_ms: duration };
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR refreshing Role Intelligence cache:', error);
      throw error;
    }
  }

  /**
   * Refresh Stage Success benchmark cache
   * Queries ALL relevant posts and aggregates stage success rates by company
   */
  async refreshStageSuccessCache() {
    logger.info('[BenchmarkCache] Refreshing Stage Success cache...');
    const startTime = Date.now();

    try {
      // Step 1: Query stage statistics from ALL relevant posts
      const stageStatsQuery = `
        SELECT
          COALESCE(metadata->>'company', llm_company, 'Unknown') as company,
          interview_stage,
          COUNT(*) as total_posts,
          SUM(CASE WHEN outcome IN ('passed', 'success', 'offer', 'accepted') THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN outcome IN ('failed', 'reject', 'rejected') THEN 1 ELSE 0 END) as failure_count
        FROM scraped_posts
        WHERE is_relevant = true
          AND (metadata->>'company' IS NOT NULL OR llm_company IS NOT NULL)
          AND interview_stage IS NOT NULL
          AND interview_stage != 'Unknown'
        GROUP BY company, interview_stage
        HAVING COUNT(*) >= 1
        ORDER BY company, interview_stage
      `;

      const stageStatsResult = await pool.query(stageStatsQuery);
      logger.info(`[BenchmarkCache] Found ${stageStatsResult.rows.length} company-stage combinations`);

      // Step 2: Clear existing cache
      await pool.query('DELETE FROM benchmark_stage_success');
      logger.info('[BenchmarkCache] Cleared old stage success cache');

      // Step 3: Insert new cache data
      let insertedCount = 0;
      for (const stageRow of stageStatsResult.rows) {
        const company = stageRow.company;
        const interviewStage = stageRow.interview_stage;
        const totalPosts = parseInt(stageRow.total_posts);
        const successCount = parseInt(stageRow.success_count);
        const failureCount = parseInt(stageRow.failure_count);
        const successRate = totalPosts > 0 ? ((successCount / totalPosts) * 100).toFixed(2) : 0;

        // Filter out 'Unknown' companies
        if (company === 'Unknown') continue;

        const insertQuery = `
          INSERT INTO benchmark_stage_success
            (company, interview_stage, total_posts, success_count, failure_count, success_rate)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await pool.query(insertQuery, [
          company,
          interviewStage,
          totalPosts,
          successCount,
          failureCount,
          successRate
        ]);

        insertedCount++;
      }

      logger.info(`[BenchmarkCache] Inserted ${insertedCount} stage records into cache`);

      // Step 4: Update metadata
      const totalPostsAnalyzed = stageStatsResult.rows.reduce((sum, r) => sum + parseInt(r.total_posts), 0);
      const duration = Date.now() - startTime;

      await pool.query(`
        UPDATE benchmark_metadata
        SET last_computed = NOW(),
            total_posts_analyzed = $1,
            computation_duration_ms = $2,
            updated_at = NOW()
        WHERE cache_type = 'stage_success'
      `, [totalPostsAnalyzed, duration]);

      logger.info(`[BenchmarkCache] Stage Success cache refreshed successfully in ${duration}ms`);

      return { rowCount: insertedCount, duration_ms: duration };
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR refreshing Stage Success cache:', error);
      throw error;
    }
  }

  /**
   * Get cached role intelligence data
   * Used by analysisController instead of running expensive queries
   */
  async getCachedRoleIntelligence() {
    try {
      const result = await pool.query(`
        SELECT
          role_type,
          total_posts,
          success_count,
          failure_count,
          success_rate,
          top_skills
        FROM benchmark_role_intelligence
        ORDER BY total_posts DESC
        LIMIT 20
      `);

      return result.rows;
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR fetching cached role intelligence:', error);
      return [];
    }
  }

  /**
   * Get cached stage success data
   * Used by analysisController instead of running expensive queries
   * Returns stage data for top 10 companies only (by total posts across all stages)
   */
  async getCachedStageSuccess() {
    try {
      const result = await pool.query(`
        WITH top_companies AS (
          SELECT company
          FROM benchmark_stage_success
          GROUP BY company
          ORDER BY SUM(total_posts) DESC
          LIMIT 10
        )
        SELECT
          bss.company,
          bss.interview_stage,
          bss.total_posts,
          bss.success_count,
          bss.failure_count,
          bss.success_rate
        FROM benchmark_stage_success bss
        INNER JOIN top_companies tc ON bss.company = tc.company
        ORDER BY bss.company, bss.interview_stage
      `);

      return result.rows;
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR fetching cached stage success:', error);
      return [];
    }
  }

  /**
   * Get cache metadata (freshness, last updated, etc.)
   */
  async getCacheMetadata() {
    try {
      const result = await pool.query(`
        SELECT
          cache_type,
          last_computed,
          total_posts_analyzed,
          computation_duration_ms,
          updated_at
        FROM benchmark_metadata
        ORDER BY cache_type
      `);

      return result.rows;
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR fetching cache metadata:', error);
      return [];
    }
  }

  /**
   * Track seed post markers for highlighting
   * Call this when batch analysis is initiated with seed posts
   */
  async trackSeedPostMarkers(batchId, seedPosts) {
    logger.info(`[BenchmarkCache] Tracking seed post markers for batch ${batchId}...`);

    try {
      // Extract companies and roles from seed posts
      const companies = new Map();
      const roles = new Map();

      for (const post of seedPosts) {
        // Track companies
        const company = post.metadata?.company || post.llm_company;
        if (company && company !== 'Unknown') {
          companies.set(company, (companies.get(company) || 0) + 1);
        }

        // Track roles
        const role = post.role_type;
        if (role && role !== 'Unknown') {
          roles.set(role, (roles.get(role) || 0) + 1);
        }
      }

      // Clear existing markers for this batch
      await pool.query('DELETE FROM seed_post_markers WHERE batch_id = $1', [batchId]);

      // Insert company markers
      for (const [company, count] of companies.entries()) {
        await pool.query(`
          INSERT INTO seed_post_markers (batch_id, entity_type, entity_value, seed_post_count)
          VALUES ($1, 'company', $2, $3)
        `, [batchId, company, count]);
      }

      // Insert role markers
      for (const [role, count] of roles.entries()) {
        await pool.query(`
          INSERT INTO seed_post_markers (batch_id, entity_type, entity_value, seed_post_count)
          VALUES ($1, 'role', $2, $3)
        `, [batchId, role, count]);
      }

      logger.info(`[BenchmarkCache] Tracked ${companies.size} companies and ${roles.size} roles from seed posts`);

      return {
        companies: Array.from(companies.keys()),
        roles: Array.from(roles.keys())
      };
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR tracking seed post markers:', error);
      throw error;
    }
  }

  /**
   * Get seed post markers for a batch
   * Used to highlight seed companies/roles in benchmark data
   */
  async getSeedPostMarkers(batchId) {
    try {
      const result = await pool.query(`
        SELECT entity_type, entity_value, seed_post_count
        FROM seed_post_markers
        WHERE batch_id = $1
      `, [batchId]);

      const markers = {
        companies: [],
        roles: []
      };

      for (const row of result.rows) {
        if (row.entity_type === 'company') {
          markers.companies.push(row.entity_value);
        } else if (row.entity_type === 'role') {
          markers.roles.push(row.entity_value);
        }
      }

      return markers;
    } catch (error) {
      logger.error('[BenchmarkCache] ERROR fetching seed post markers:', error);
      return { companies: [], roles: [] };
    }
  }
}

module.exports = new BenchmarkCacheService();
