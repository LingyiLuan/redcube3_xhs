import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Learning Map Generation Flow
 *
 * Tests the complete user journey from generating a learning map
 * to viewing all sections and interacting with source posts.
 *
 * Phase 6: Testing
 */

test.describe('Learning Map Generation', () => {
  test('should generate learning map from batch analysis', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await expect(page.locator('h1')).toContainText('RedCube');

    // Navigate to Batch Analysis tab
    await page.click('text=Batch Analysis');

    // Enter test query
    await page.fill('textarea[placeholder*="Enter URLs"]', 'https://www.reddit.com/r/cscareerquestions/comments/test1\nhttps://www.reddit.com/r/cscareerquestions/comments/test2');

    // Set target company
    await page.fill('input[placeholder*="company"]', 'Google');

    // Set target role
    await page.fill('input[placeholder*="role"]', 'Software Engineer');

    // Submit the batch analysis
    await page.click('button:has-text("Analyze")');

    // Wait for analysis to complete (this may take a while)
    await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 120000 });

    // Click "Generate Learning Map" button
    await page.click('button:has-text("Generate Learning Map")');

    // Wait for learning map to be generated
    await expect(page.locator('h2:has-text("Learning Map")')).toBeVisible({ timeout: 120000 });

    // Verify all main sections are visible
    await expect(page.locator('text=Skill Modules')).toBeVisible();
    await expect(page.locator('text=Timeline & Milestones')).toBeVisible();
    await expect(page.locator('text=Interview Questions')).toBeVisible();
    await expect(page.locator('text=Knowledge Gaps')).toBeVisible();
    await expect(page.locator('text=Resources')).toBeVisible();
    await expect(page.locator('text=Expected Outcomes')).toBeVisible();
  });

  test('should display skill modules with problems', async ({ page }) => {
    // This test assumes a learning map is already generated
    // In a real test, you would first generate one or use a test fixture

    await page.goto('/');

    // Navigate to existing learning map (you may need to adjust this)
    // For now, we'll assume the learning map is displayed after generation

    // Check that skill modules are displayed
    const skillModules = page.locator('[data-testid="skill-module"]');
    await expect(skillModules.first()).toBeVisible({ timeout: 30000 });

    // Expand first module
    await skillModules.first().click();

    // Verify problem categories are shown
    await expect(page.locator('[data-testid="problem-category"]').first()).toBeVisible();

    // Verify individual problems are listed
    await expect(page.locator('[data-testid="problem-item"]').first()).toBeVisible();

    // Verify problem metadata (difficulty, frequency, etc.)
    await expect(page.locator('text=Difficulty:').first()).toBeVisible();
    await expect(page.locator('text=Frequency:').first()).toBeVisible();
  });

  test('should display timeline with weekly breakdowns', async ({ page }) => {
    await page.goto('/');

    // Navigate to Timeline section
    await page.click('text=Timeline & Milestones');

    // Verify timeline is displayed
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();

    // Verify weeks are displayed
    const weeks = page.locator('[data-testid="week-item"]');
    await expect(weeks.first()).toBeVisible();

    // Expand first week
    await weeks.first().click();

    // Verify daily tasks are shown
    await expect(page.locator('[data-testid="daily-task"]').first()).toBeVisible();

    // Verify week metadata
    await expect(page.locator('text=Skills Covered:').first()).toBeVisible();
    await expect(page.locator('text=Based on').first()).toBeVisible();
  });

  test('should display milestones with criteria', async ({ page }) => {
    await page.goto('/');

    // Navigate to Timeline section
    await page.click('text=Timeline & Milestones');

    // Verify milestones are displayed
    const milestones = page.locator('[data-testid="milestone"]');
    await expect(milestones.first()).toBeVisible();

    // Click first milestone
    await milestones.first().click();

    // Verify milestone details
    await expect(page.locator('text=Criteria:').first()).toBeVisible();
    await expect(page.locator('text=Skills Mastered:').first()).toBeVisible();
    await expect(page.locator('text=Evidence:').first()).toBeVisible();
  });

  test('should display interview questions by category', async ({ page }) => {
    await page.goto('/');

    // Navigate to Interview Questions section
    await page.click('text=Interview Questions');

    // Verify question categories are displayed
    await expect(page.locator('[data-testid="question-category"]').first()).toBeVisible();

    // Verify questions are listed
    await expect(page.locator('[data-testid="question-item"]').first()).toBeVisible();

    // Verify question metadata
    await expect(page.locator('text=Frequency:').first()).toBeVisible();
    await expect(page.locator('text=Difficulty:').first()).toBeVisible();
  });

  test('should display knowledge gaps with evidence', async ({ page }) => {
    await page.goto('/');

    // Navigate to Knowledge Gaps section
    await page.click('text=Knowledge Gaps');

    // Verify knowledge gaps are displayed
    const gaps = page.locator('[data-testid="knowledge-gap"]');
    await expect(gaps.first()).toBeVisible();

    // Verify gap metadata
    await expect(page.locator('text=Struggle Percentage:').first()).toBeVisible();
    await expect(page.locator('text=Evidence Count:').first()).toBeVisible();
    await expect(page.locator('text=Recommendation:').first()).toBeVisible();
  });

  test('should display curated resources with success rates', async ({ page }) => {
    await page.goto('/');

    // Navigate to Resources section
    await page.click('text=Resources');

    // Verify resources are displayed
    const resources = page.locator('[data-testid="resource-item"]');
    await expect(resources.first()).toBeVisible();

    // Verify resource metadata
    await expect(page.locator('text=Success Rate:').first()).toBeVisible();
    await expect(page.locator('text=Mentions:').first()).toBeVisible();
    await expect(page.locator('text=Category:').first()).toBeVisible();
  });

  test('should display expected outcomes', async ({ page }) => {
    await page.goto('/');

    // Navigate to Expected Outcomes section
    await page.click('text=Expected Outcomes');

    // Verify outcomes are displayed
    await expect(page.locator('[data-testid="outcome-item"]').first()).toBeVisible();

    // Verify outcome metadata
    await expect(page.locator('text=Probability:').first()).toBeVisible();
    await expect(page.locator('text=Timeline:').first()).toBeVisible();
  });
});

test.describe('Source Attribution', () => {
  test('should display source post count badges', async ({ page }) => {
    await page.goto('/');

    // Navigate to learning map
    // Assuming a learning map is already generated

    // Check for "View X Source Posts" badges
    const sourceBadges = page.locator('[data-testid="source-posts-badge"]');
    await expect(sourceBadges.first()).toBeVisible({ timeout: 30000 });

    // Verify badge shows count
    await expect(sourceBadges.first()).toContainText(/\d+ posts?/);
  });

  test('should open source posts modal on badge click', async ({ page }) => {
    await page.goto('/');

    // Click first source posts badge
    const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
    await firstBadge.click();

    // Verify modal opens
    await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();

    // Verify modal title
    await expect(page.locator('h3:has-text("Source Posts")')).toBeVisible();

    // Verify posts are listed
    await expect(page.locator('[data-testid="source-post-item"]').first()).toBeVisible();
  });

  test('should display post metadata in modal', async ({ page }) => {
    await page.goto('/');

    // Open source posts modal
    const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
    await firstBadge.click();

    // Wait for modal to open
    await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();

    // Verify post metadata is displayed
    const firstPost = page.locator('[data-testid="source-post-item"]').first();

    // Check for title
    await expect(firstPost.locator('[data-testid="post-title"]')).toBeVisible();

    // Check for company (if available)
    const company = firstPost.locator('[data-testid="post-company"]');
    if (await company.isVisible()) {
      await expect(company).toHaveText(/[\w\s]+/);
    }

    // Check for role (if available)
    const role = firstPost.locator('[data-testid="post-role"]');
    if (await role.isVisible()) {
      await expect(role).toHaveText(/[\w\s]+/);
    }

    // Check for outcome (if available)
    const outcome = firstPost.locator('[data-testid="post-outcome"]');
    if (await outcome.isVisible()) {
      await expect(outcome).toHaveText(/[\w\s]+/);
    }
  });

  test('should open Reddit post in new tab on click', async ({ page, context }) => {
    await page.goto('/');

    // Open source posts modal
    const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
    await firstBadge.click();

    // Wait for modal
    await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();

    // Listen for new page
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('[data-testid="source-post-item"]').first().click()
    ]);

    // Verify new page URL is Reddit
    expect(newPage.url()).toContain('reddit.com');
  });

  test('should close modal on X button click', async ({ page }) => {
    await page.goto('/');

    // Open modal
    const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
    await firstBadge.click();

    // Wait for modal
    await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();

    // Click close button
    await page.click('[data-testid="close-modal-button"]');

    // Verify modal is closed
    await expect(page.locator('[data-testid="source-posts-modal"]')).not.toBeVisible();
  });

  test('should close modal on overlay click', async ({ page }) => {
    await page.goto('/');

    // Open modal
    const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
    await firstBadge.click();

    // Wait for modal
    await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();

    // Click overlay (outside modal content)
    await page.click('[data-testid="modal-overlay"]');

    // Verify modal is closed
    await expect(page.locator('[data-testid="source-posts-modal"]')).not.toBeVisible();
  });
});

test.describe('Data Quality Warnings', () => {
  test('should display warning when data quality is low', async ({ page }) => {
    await page.goto('/');

    // Look for warning badges
    const warningBadges = page.locator('[data-testid="data-warning"]');

    // If warnings exist, verify they're visible
    if (await warningBadges.count() > 0) {
      await expect(warningBadges.first()).toBeVisible();
      await expect(warningBadges.first()).toContainText(/low|medium|insufficient/i);
    }
  });

  test('should show evidence quality indicators', async ({ page }) => {
    await page.goto('/');

    // Look for evidence quality badges
    const qualityBadges = page.locator('[data-testid="evidence-quality"]');

    // If quality indicators exist, verify they're visible
    if (await qualityBadges.count() > 0) {
      await expect(qualityBadges.first()).toBeVisible();
      await expect(qualityBadges.first()).toContainText(/high|medium|low/i);
    }
  });
});
