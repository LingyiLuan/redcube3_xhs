import { test, expect } from '@playwright/test';

/**
 * Learning Map Generation E2E Tests
 *
 * Phase 6: Testing - Verify learning map generation works end-to-end
 * Tests the complete flow from batch analysis to learning map generation
 *
 * These tests verify:
 * 1. Learning map generation from batch analysis
 * 2. All database schema fixes (posts -> scraped_posts, id -> post_id)
 * 3. Phase 4 timeline & milestones generation
 * 4. Phase 5 knowledge gaps & resources generation
 * 5. Skill modules generation (with graceful handling of missing leetcode_problems table)
 */

const API_BASE_URL = 'http://localhost:8080/api/content';

test.describe('Learning Map Generation - Full Flow', () => {
  let testBatchId: string;
  let testMapId: string;

  test('should generate learning map from batch report', async ({ request }) => {
    // Step 1: Create a batch analysis first
    // Using realistic Reddit posts for testing
    const batchResponse = await request.post(`${API_BASE_URL}/analyze/batch`, {
      data: {
        posts: [
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/test1',
            text: 'I passed my Google software engineer interview! Studied for 12 weeks, focused on arrays, strings, trees, and dynamic programming. Did 150 LeetCode problems.'
          },
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/test2',
            text: 'Amazon SDE interview experience - passed after 3 months prep. Key topics: system design, behavioral questions, and coding (graphs, DFS/BFS).'
          },
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/test3',
            text: 'Meta E4 offer! Preparation timeline: 10 weeks. Heavy focus on medium/hard problems, mock interviews, and understanding Big O complexity.'
          }
        ],
        targetCompany: 'Google',
        targetRole: 'Software Engineer'
      }
    });

    expect(batchResponse.ok()).toBeTruthy();
    const batchData = await batchResponse.json();
    expect(batchData).toHaveProperty('success', true);
    expect(batchData).toHaveProperty('batchId');

    testBatchId = batchData.batchId;

    // Step 2: Generate learning map from the batch
    const mapResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: testBatchId,
        targetCompany: 'Google',
        targetRole: 'Software Engineer',
        userGoals: {
          position: 'Software Engineer',
          company: 'Google',
          preparation_time_weeks: 12
        }
      }
    });

    // Verify the learning map was generated successfully
    expect(mapResponse.ok()).toBeTruthy();
    const mapData = await mapResponse.json();

    expect(mapData).toHaveProperty('success', true);
    expect(mapData).toHaveProperty('mapId');
    expect(mapData).toHaveProperty('learningMap');

    testMapId = mapData.mapId;

    // Step 3: Verify learning map structure
    const learningMap = mapData.learningMap;

    // Verify all required sections exist
    expect(learningMap).toHaveProperty('skill_modules');
    expect(learningMap).toHaveProperty('timeline');
    expect(learningMap).toHaveProperty('milestones');
    expect(learningMap).toHaveProperty('interview_questions');
    expect(learningMap).toHaveProperty('knowledge_gaps');
    expect(learningMap).toHaveProperty('curated_resources');
    expect(learningMap).toHaveProperty('expected_outcomes');
    expect(learningMap).toHaveProperty('metadata');

    // Verify metadata
    expect(learningMap.metadata).toHaveProperty('target_company', 'Google');
    expect(learningMap.metadata).toHaveProperty('target_role', 'Software Engineer');
    expect(learningMap.metadata).toHaveProperty('total_source_posts');
    expect(learningMap.metadata.total_source_posts).toBeGreaterThan(0);
  });

  test('should verify Phase 4: Timeline & Milestones', async ({ request }) => {
    // Retrieve the learning map we created
    const response = await request.get(`${API_BASE_URL}/learning-map/${testMapId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const learningMap = data.learningMap;

    // Verify Timeline structure
    const timeline = learningMap.timeline;
    expect(timeline).toHaveProperty('total_weeks');
    expect(timeline).toHaveProperty('weeks');
    expect(timeline.total_weeks).toBeGreaterThan(0);
    expect(Array.isArray(timeline.weeks)).toBeTruthy();

    // Verify each week has required properties
    if (timeline.weeks.length > 0) {
      const firstWeek = timeline.weeks[0];
      expect(firstWeek).toHaveProperty('week');
      expect(firstWeek).toHaveProperty('title');
      expect(firstWeek).toHaveProperty('description');
      expect(firstWeek).toHaveProperty('daily_tasks');
      expect(firstWeek).toHaveProperty('skills_covered');
      expect(firstWeek).toHaveProperty('based_on_posts');
      expect(Array.isArray(firstWeek.daily_tasks)).toBeTruthy();
      expect(firstWeek.daily_tasks.length).toBe(7); // 7 days
    }

    // Verify Milestones structure
    const milestones = learningMap.milestones;
    expect(Array.isArray(milestones)).toBeTruthy();

    if (milestones.length > 0) {
      const firstMilestone = milestones[0];
      expect(firstMilestone).toHaveProperty('week');
      expect(firstMilestone).toHaveProperty('title');
      expect(firstMilestone).toHaveProperty('description');
      expect(firstMilestone).toHaveProperty('criteria');
      expect(firstMilestone).toHaveProperty('skills_mastered');
      expect(firstMilestone).toHaveProperty('based_on_posts');
      expect(Array.isArray(firstMilestone.criteria)).toBeTruthy();
    }
  });

  test('should verify Phase 5: Knowledge Gaps & Resources', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/${testMapId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const learningMap = data.learningMap;

    // Verify Knowledge Gaps structure
    const knowledgeGaps = learningMap.knowledge_gaps;
    expect(knowledgeGaps).toHaveProperty('critical_gaps');
    expect(knowledgeGaps).toHaveProperty('improvement_areas');
    expect(knowledgeGaps).toHaveProperty('based_on_failures');
    expect(Array.isArray(knowledgeGaps.critical_gaps)).toBeTruthy();
    expect(Array.isArray(knowledgeGaps.improvement_areas)).toBeTruthy();

    // Verify Curated Resources structure
    const resources = learningMap.curated_resources;
    expect(resources).toHaveProperty('by_category');
    expect(resources).toHaveProperty('total_resources');
    expect(typeof resources.by_category).toBe('object');
  });

  test('should verify Skill Modules (graceful handling)', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/${testMapId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const learningMap = data.learningMap;

    // Verify Skill Modules structure
    const skillModules = learningMap.skill_modules;
    expect(skillModules).toHaveProperty('modules');
    expect(skillModules).toHaveProperty('metadata');
    expect(Array.isArray(skillModules.modules)).toBeTruthy();

    // Should handle gracefully even if leetcode_problems table doesn't exist
    // Either modules are populated OR it returns empty array
    if (skillModules.modules.length > 0) {
      const firstModule = skillModules.modules[0];
      expect(firstModule).toHaveProperty('module_name');
      expect(firstModule).toHaveProperty('priority');
      expect(firstModule).toHaveProperty('total_problems');
      expect(firstModule).toHaveProperty('estimated_hours');
      expect(firstModule).toHaveProperty('context');
      expect(firstModule).toHaveProperty('problems');
    } else {
      // If empty, verify metadata reflects this
      expect(skillModules.metadata.total_problems).toBe(0);
    }
  });

  test('should verify source post attribution', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/${testMapId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const learningMap = data.learningMap;

    // Verify metadata has source post tracking
    expect(learningMap.metadata).toHaveProperty('total_source_posts');
    expect(learningMap.metadata.total_source_posts).toBeGreaterThan(0);

    // Verify timeline has source attribution
    if (learningMap.timeline.weeks.length > 0) {
      const firstWeek = learningMap.timeline.weeks[0];
      expect(firstWeek).toHaveProperty('based_on_posts');
      expect(typeof firstWeek.based_on_posts).toBe('number');
    }

    // Verify milestones have source attribution
    if (learningMap.milestones.length > 0) {
      const firstMilestone = learningMap.milestones[0];
      expect(firstMilestone).toHaveProperty('based_on_posts');
    }
  });

  test('should handle data quality warnings', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/${testMapId}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const learningMap = data.learningMap;

    // Check if data quality warnings are properly surfaced
    if (learningMap.timeline.data_warning) {
      expect(learningMap.timeline.data_warning).toHaveProperty('type');
      expect(learningMap.timeline.data_warning).toHaveProperty('message');
      expect(learningMap.timeline.data_warning).toHaveProperty('posts_with_data');
    }

    // Check evidence quality indicators
    if (learningMap.timeline.evidence_quality) {
      expect(learningMap.timeline.evidence_quality).toHaveProperty('posts_analyzed');
      expect(learningMap.timeline.evidence_quality).toHaveProperty('confidence');
    }
  });

  test('should retrieve learning maps history', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-maps/history`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('maps');
    expect(Array.isArray(data.maps)).toBeTruthy();

    // Should include our test map
    const testMap = data.maps.find((m: any) => m.map_id === testMapId);
    expect(testMap).toBeDefined();

    if (testMap) {
      expect(testMap).toHaveProperty('target_company', 'Google');
      expect(testMap).toHaveProperty('target_role', 'Software Engineer');
      expect(testMap).toHaveProperty('created_at');
    }
  });

  // Clean up after tests
  test.afterAll(async ({ request }) => {
    if (testMapId) {
      await request.delete(`${API_BASE_URL}/learning-map/${testMapId}`);
    }
  });
});

test.describe('Learning Map Error Handling', () => {
  test('should handle invalid batch ID', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: 'non-existent-batch-id',
        targetCompany: 'Google',
        targetRole: 'Software Engineer',
        userGoals: {
          position: 'Software Engineer',
          company: 'Google',
          preparation_time_weeks: 12
        }
      }
    });

    // Should return an error (400 or 404)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should handle missing required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        // Missing batchId, targetCompany, targetRole
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
  });

  test('should handle non-existent learning map ID', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/non-existent-id`);
    expect(response.status()).toBe(404);
  });
});

test.describe('Database Schema Verification', () => {
  test('should work with scraped_posts table (not posts)', async ({ request }) => {
    // This test verifies that all our database schema fixes work correctly
    // The services should use scraped_posts, not posts

    const batchResponse = await request.post(`${API_BASE_URL}/analyze/batch`, {
      data: {
        posts: [
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/schema_test',
            text: 'Testing schema fixes - Google interview prep timeline'
          }
        ],
        targetCompany: 'Google',
        targetRole: 'SWE'
      }
    });

    expect(batchResponse.ok()).toBeTruthy();
    const batchData = await batchResponse.json();
    const batchId = batchData.batchId;

    const mapResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: batchId,
        targetCompany: 'Google',
        targetRole: 'SWE',
        userGoals: {
          position: 'SWE',
          company: 'Google',
          preparation_time_weeks: 12
        }
      }
    });

    // Should succeed without "relation 'posts' does not exist" error
    expect(mapResponse.ok()).toBeTruthy();
    const mapData = await mapResponse.json();
    expect(mapData).toHaveProperty('success', true);

    // Clean up
    if (mapData.mapId) {
      await request.delete(`${API_BASE_URL}/learning-map/${mapData.mapId}`);
    }
  });

  test('should use post_id (VARCHAR) not id (INTEGER)', async ({ request }) => {
    // This test verifies the fix for "invalid input syntax for type integer: '1p2heef'"
    // The services should use post_id (VARCHAR) in WHERE clauses, not id (INTEGER)

    const batchResponse = await request.post(`${API_BASE_URL}/analyze/batch`, {
      data: {
        posts: [
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/postid_test',
            text: 'Testing post_id vs id schema fix for timeline service'
          }
        ],
        targetCompany: 'Amazon',
        targetRole: 'SDE'
      }
    });

    expect(batchResponse.ok()).toBeTruthy();
    const batchData = await batchResponse.json();

    const mapResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: batchData.batchId,
        targetCompany: 'Amazon',
        targetRole: 'SDE',
        userGoals: {
          position: 'SDE',
          company: 'Amazon',
          preparation_time_weeks: 10
        }
      }
    });

    // Should succeed without "invalid input syntax for type integer" error
    expect(mapResponse.ok()).toBeTruthy();
    const mapData = await mapResponse.json();
    expect(mapData).toHaveProperty('success', true);

    // Verify timeline was generated (this uses the fixed queries)
    expect(mapData.learningMap).toHaveProperty('timeline');
    expect(mapData.learningMap.timeline).toHaveProperty('weeks');

    // Clean up
    if (mapData.mapId) {
      await request.delete(`${API_BASE_URL}/learning-map/${mapData.mapId}`);
    }
  });
});
