import { test, expect } from '@playwright/test';

/**
 * API Integration Tests
 *
 * Tests the integration between frontend and backend APIs
 * for learning map generation and source post retrieval.
 *
 * Phase 6: Testing
 */

const API_BASE_URL = 'http://localhost:8080/api/content';

test.describe('Learning Map API Integration', () => {
  test('should generate learning map via API', async ({ request }) => {
    // Make API request to generate learning map
    const response = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: 'test-batch-id',
        targetCompany: 'Google',
        targetRole: 'Software Engineer',
        userGoals: {
          position: 'Software Engineer',
          company: 'Google',
          preparation_time_weeks: 12
        }
      }
    });

    // Verify response
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('mapId');
    expect(data).toHaveProperty('learningMap');

    // Verify learning map structure
    const learningMap = data.learningMap;
    expect(learningMap).toHaveProperty('skill_modules');
    expect(learningMap).toHaveProperty('timeline');
    expect(learningMap).toHaveProperty('milestones');
    expect(learningMap).toHaveProperty('interview_questions');
    expect(learningMap).toHaveProperty('knowledge_gaps');
    expect(learningMap).toHaveProperty('curated_resources');
    expect(learningMap).toHaveProperty('expected_outcomes');
  });

  test('should retrieve learning map by ID', async ({ request }) => {
    // First, generate a learning map
    const createResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: 'test-batch-id-2',
        targetCompany: 'Meta',
        targetRole: 'Software Engineer',
        userGoals: {
          position: 'Software Engineer',
          company: 'Meta',
          preparation_time_weeks: 10
        }
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    const mapId = createData.mapId;

    // Retrieve the learning map
    const getResponse = await request.get(`${API_BASE_URL}/learning-map/${mapId}`);

    expect(getResponse.ok()).toBeTruthy();
    const getData = await getResponse.json();

    expect(getData).toHaveProperty('success', true);
    expect(getData).toHaveProperty('learningMap');
    expect(getData.learningMap).toHaveProperty('map_id', mapId);
  });

  test('should retrieve learning maps history', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-maps/history`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('maps');
    expect(Array.isArray(data.maps)).toBeTruthy();

    // If there are maps, verify structure
    if (data.maps.length > 0) {
      const firstMap = data.maps[0];
      expect(firstMap).toHaveProperty('map_id');
      expect(firstMap).toHaveProperty('target_company');
      expect(firstMap).toHaveProperty('target_role');
      expect(firstMap).toHaveProperty('created_at');
    }
  });

  test('should update learning map progress', async ({ request }) => {
    // First, generate a learning map
    const createResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: 'test-batch-id-3',
        targetCompany: 'Amazon',
        targetRole: 'SDE',
        userGoals: {
          position: 'SDE',
          company: 'Amazon',
          preparation_time_weeks: 8
        }
      }
    });

    const createData = await createResponse.json();
    const mapId = createData.mapId;

    // Update progress
    const updateResponse = await request.put(`${API_BASE_URL}/learning-map/${mapId}/progress`, {
      data: {
        completedModules: ['module-1'],
        completedWeeks: [1, 2],
        completedMilestones: ['milestone-1']
      }
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData).toHaveProperty('success', true);
  });

  test('should delete learning map', async ({ request }) => {
    // First, generate a learning map
    const createResponse = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        batchId: 'test-batch-id-4',
        targetCompany: 'Netflix',
        targetRole: 'Senior Engineer',
        userGoals: {
          position: 'Senior Engineer',
          company: 'Netflix',
          preparation_time_weeks: 12
        }
      }
    });

    const createData = await createResponse.json();
    const mapId = createData.mapId;

    // Delete the map
    const deleteResponse = await request.delete(`${API_BASE_URL}/learning-map/${mapId}`);

    expect(deleteResponse.ok()).toBeTruthy();
    const deleteData = await deleteResponse.json();
    expect(deleteData).toHaveProperty('success', true);

    // Verify it's deleted
    const getResponse = await request.get(`${API_BASE_URL}/learning-map/${mapId}`);
    expect(getResponse.status()).toBe(404);
  });
});

test.describe('Source Posts API Integration', () => {
  test('should fetch batch posts by IDs', async ({ request }) => {
    // This test requires actual post IDs from your database
    // For demonstration, using mock IDs - replace with real IDs in production
    const postIds = ['post-1', 'post-2', 'post-3'];

    const response = await request.post(`${API_BASE_URL}/posts/batch`, {
      data: {
        postIds
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('posts');
    expect(Array.isArray(data.posts)).toBeTruthy();

    // Verify post structure if posts exist
    if (data.posts.length > 0) {
      const firstPost = data.posts[0];
      expect(firstPost).toHaveProperty('post_id');
      expect(firstPost).toHaveProperty('title');
      // Optional fields
      // expect(firstPost).toHaveProperty('company');
      // expect(firstPost).toHaveProperty('role_type');
      // expect(firstPost).toHaveProperty('outcome');
    }
  });

  test('should handle empty post IDs array', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/posts/batch`, {
      data: {
        postIds: []
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
  });

  test('should handle invalid post IDs', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/posts/batch`, {
      data: {
        postIds: 'not-an-array'
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
  });
});

test.describe('Batch Analysis API Integration', () => {
  test('should create batch analysis', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/analyze/batch`, {
      data: {
        posts: [
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/test1',
            text: 'Sample post about Google interview'
          },
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/test2',
            text: 'Sample post about Amazon interview'
          }
        ],
        targetCompany: 'Google',
        targetRole: 'Software Engineer'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('batchId');
    expect(data).toHaveProperty('report');

    // Verify report structure
    const report = data.report;
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('patterns');
    expect(report).toHaveProperty('recommendations');
  });

  test('should retrieve cached batch report', async ({ request }) => {
    // First, create a batch analysis
    const createResponse = await request.post(`${API_BASE_URL}/analyze/batch`, {
      data: {
        posts: [
          {
            url: 'https://www.reddit.com/r/cscareerquestions/comments/cache-test',
            text: 'Cached batch test post'
          }
        ],
        targetCompany: 'Microsoft',
        targetRole: 'SDE'
      }
    });

    const createData = await createResponse.json();
    const batchId = createData.batchId;

    // Retrieve the cached report
    const getResponse = await request.get(`${API_BASE_URL}/batch/report/${batchId}`);

    expect(getResponse.ok()).toBeTruthy();
    const getData = await getResponse.json();

    expect(getData).toHaveProperty('success', true);
    expect(getData).toHaveProperty('report');
    expect(getData).toHaveProperty('batchId', batchId);
  });
});

test.describe('Workflow API Integration', () => {
  test('should parse search intent', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/workflow/parse-intent`, {
      data: {
        query: 'Google software engineer interview'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('entities');

    // Verify entities structure
    const entities = data.entities;
    expect(entities).toHaveProperty('companies');
    expect(entities).toHaveProperty('roles');
    expect(Array.isArray(entities.companies)).toBeTruthy();
    expect(Array.isArray(entities.roles)).toBeTruthy();
  });

  test('should search posts via workflow', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/workflow/search-posts`, {
      data: {
        query: 'Amazon software engineer',
        limit: 10
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('posts');
    expect(Array.isArray(data.posts)).toBeTruthy();

    // Verify post structure if posts exist
    if (data.posts.length > 0) {
      const firstPost = data.posts[0];
      expect(firstPost).toHaveProperty('id');
      expect(firstPost).toHaveProperty('title');
      expect(firstPost).toHaveProperty('similarity');
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 for non-existent learning map', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/learning-map/non-existent-id`);
    expect(response.status()).toBe(404);
  });

  test('should handle invalid batch report ID', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/batch/report/invalid-id`);
    expect(response.status()).toBe(404);
  });

  test('should handle malformed request body', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/learning-map`, {
      data: {
        // Missing required fields
      }
    });

    expect(response.status()).toBe(400);
  });
});
