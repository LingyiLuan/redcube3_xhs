import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Verify basic functionality
 *
 * This is a simple test to verify the testing infrastructure works correctly.
 */

test.describe('Smoke Tests', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page).toHaveTitle(/RedCube/i);

    // Verify search bar is visible (main interactive element on homepage)
    await expect(page.locator('.search-input')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check if navigation tabs are present
    const batchAnalysisTab = page.locator('text=Batch Analysis');
    await expect(batchAnalysisTab).toBeVisible();
  });
});
