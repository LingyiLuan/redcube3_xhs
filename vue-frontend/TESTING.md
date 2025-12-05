# Testing Documentation

## Phase 6: Learning Map Testing Infrastructure

This document describes the E2E testing setup for the RedCube Learning Map system.

---

## Testing Framework

We use **Playwright** for End-to-End (E2E) testing. Playwright provides cross-browser testing capabilities and a robust API for interacting with web applications.

### Why Playwright?

- Cross-browser support (Chromium, Firefox, WebKit)
- Fast and reliable
- Auto-wait for elements
- Screenshots and video recording on failure
- Excellent TypeScript support
- Built-in test reporter

---

## Test Structure

```
vue-frontend/
├── tests/
│   └── e2e/
│       ├── learning-map.spec.ts        # Learning Map UI tests
│       └── api-integration.spec.ts     # API integration tests
├── playwright.config.ts                # Playwright configuration
└── package.json                        # Test scripts
```

---

## Running Tests

### Prerequisites

1. Ensure backend services are running:
   ```bash
   docker-compose up -d
   ```

2. Install Playwright browsers (first time only):
   ```bash
   cd vue-frontend
   npx playwright install
   ```

### Test Commands

```bash
# Run all tests (headless mode)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step-by-step
npm run test:e2e:debug

# View HTML test report
npm run test:e2e:report
```

---

## Test Suites

### 1. Learning Map Generation Tests

**File**: `tests/e2e/learning-map.spec.ts`

**Coverage**:
- Learning map generation from batch analysis
- Skill modules display and interaction
- Timeline and weekly breakdowns
- Milestones with criteria
- Interview questions by category
- Knowledge gaps with evidence
- Curated resources with success rates
- Expected outcomes

**Example Test**:
```typescript
test('should generate learning map from batch analysis', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Batch Analysis');
  await page.fill('textarea[placeholder*="Enter URLs"]', '...');
  await page.click('button:has-text("Analyze")');
  await expect(page.locator('text=Analysis Complete')).toBeVisible({ timeout: 120000 });
  await page.click('button:has-text("Generate Learning Map")');
  await expect(page.locator('h2:has-text("Learning Map")')).toBeVisible();
});
```

### 2. Source Attribution Tests

**File**: `tests/e2e/learning-map.spec.ts`

**Coverage**:
- Source post count badges display
- Source posts modal opening
- Post metadata display (company, role, outcome)
- Opening Reddit posts in new tabs
- Modal closing (X button, overlay click)

**Example Test**:
```typescript
test('should open source posts modal on badge click', async ({ page }) => {
  await page.goto('/');
  const firstBadge = page.locator('[data-testid="source-posts-badge"]').first();
  await firstBadge.click();
  await expect(page.locator('[data-testid="source-posts-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="source-post-item"]').first()).toBeVisible();
});
```

### 3. API Integration Tests

**File**: `tests/e2e/api-integration.spec.ts`

**Coverage**:
- Learning map generation API
- Learning map retrieval by ID
- Learning map history
- Progress updates
- Map deletion
- Batch posts retrieval
- Batch analysis creation
- Cached report retrieval
- Search intent parsing
- Post search workflow
- Error handling (404, 400, etc.)

**Example Test**:
```typescript
test('should generate learning map via API', async ({ request }) => {
  const response = await request.post(`${API_BASE_URL}/learning-map`, {
    data: {
      batchId: 'test-batch-id',
      targetCompany: 'Google',
      targetRole: 'Software Engineer'
    }
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('learningMap');
});
```

### 4. Data Quality Tests

**File**: `tests/e2e/learning-map.spec.ts`

**Coverage**:
- Data quality warnings display
- Evidence quality indicators
- Low data coverage scenarios

---

## Test Configuration

**File**: `playwright.config.ts`

### Key Settings:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,              // 60 second timeout per test
  fullyParallel: true,             // Run tests in parallel
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',       // Collect trace on retry
    screenshot: 'only-on-failure',  // Screenshot on failure
    video: 'retain-on-failure',     // Video on failure
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Writing New Tests

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```html
   <div data-testid="source-posts-badge">View 23 posts</div>
   ```

   ```typescript
   await page.locator('[data-testid="source-posts-badge"]').click();
   ```

2. **Use appropriate timeouts** for long-running operations:
   ```typescript
   await expect(page.locator('text=Analysis Complete'))
     .toBeVisible({ timeout: 120000 }); // 2 minutes
   ```

3. **Test user journeys, not implementation details**:
   - Good: "User can generate a learning map and view source posts"
   - Bad: "Component renders with correct props"

4. **Use descriptive test names**:
   ```typescript
   test('should display source post metadata in modal', async ({ page }) => {
     // ...
   });
   ```

5. **Clean up after tests**:
   ```typescript
   test.afterEach(async ({ request }) => {
     // Delete test data
     await request.delete(`/api/content/learning-map/${testMapId}`);
   });
   ```

### Example Test Template

```typescript
test.describe('Feature Name', () => {
  test('should perform specific action', async ({ page }) => {
    // 1. Navigate
    await page.goto('/');

    // 2. Interact
    await page.click('[data-testid="button"]');

    // 3. Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
    await expect(page.locator('[data-testid="result"]')).toContainText('Expected');
  });
});
```

---

## Debugging Tests

### 1. UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

- Interactive test runner
- See browser state at each step
- Time travel through test execution
- Inspect DOM and network

### 2. Debug Mode

```bash
npm run test:e2e:debug
```

- Pauses execution
- Opens Playwright Inspector
- Step through tests line by line

### 3. Headed Mode

```bash
npm run test:e2e:headed
```

- See browser while tests run
- Good for quick debugging

### 4. Screenshots and Videos

On test failure, Playwright automatically captures:
- **Screenshot**: `test-results/{test-name}/screenshot.png`
- **Video**: `test-results/{test-name}/video.webm`
- **Trace**: `test-results/{test-name}/trace.zip`

View trace:
```bash
npx playwright show-trace test-results/{test-name}/trace.zip
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          cd vue-frontend
          npm install
          npx playwright install --with-deps

      - name: Start services
        run: docker-compose up -d

      - name: Run tests
        run: |
          cd vue-frontend
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: vue-frontend/playwright-report/
```

---

## Test Data Management

### Using Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/learning-map.ts
export const mockLearningMapRequest = {
  batchId: 'test-batch-123',
  targetCompany: 'Google',
  targetRole: 'Software Engineer',
  userGoals: {
    position: 'Software Engineer',
    company: 'Google',
    preparation_time_weeks: 12
  }
};
```

Use in tests:

```typescript
import { mockLearningMapRequest } from '../fixtures/learning-map';

test('should generate learning map', async ({ request }) => {
  const response = await request.post('/api/content/learning-map', {
    data: mockLearningMapRequest
  });
  // ...
});
```

---

## Performance Testing

### Measuring Page Load Times

```typescript
test('learning map should load within 3 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/learning-map/123');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000);
});
```

### Measuring API Response Times

```typescript
test('API should respond within 500ms', async ({ request }) => {
  const start = Date.now();
  await request.get('/api/content/learning-maps/history');
  const responseTime = Date.now() - start;

  expect(responseTime).toBeLessThan(500);
});
```

---

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
- **Solution**: Increase timeout in test or config
- Check if backend services are running
- Check network connectivity

**Issue**: Flaky tests
- **Solution**: Use `page.waitForLoadState('networkidle')`
- Add explicit waits for dynamic content
- Use `page.waitForSelector()` instead of fixed delays

**Issue**: Cannot find element
- **Solution**: Check selector syntax
- Use Playwright Inspector to find correct selector
- Ensure element is visible (not hidden by CSS)

**Issue**: Test passes locally but fails in CI
- **Solution**: Check timing differences
- Ensure test data is properly seeded
- Check environment variables

---

## Test Coverage

Current test coverage:

- **Learning Map Generation**: ✅ Full coverage
- **Source Posts Modal**: ✅ Full coverage
- **API Integration**: ✅ Full coverage
- **Error Handling**: ✅ Full coverage
- **Data Quality Warnings**: ✅ Full coverage

---

## Future Enhancements

Planned improvements:

1. **Visual Regression Testing**: Screenshot comparison
2. **Accessibility Testing**: ARIA labels, keyboard navigation
3. **Performance Benchmarks**: Automated performance regression detection
4. **Load Testing**: Concurrent user simulation
5. **Integration with Monitoring**: Connect test results to APM

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [API Testing](https://playwright.dev/docs/api-testing)

---

## Contact

For questions about testing:
- Create an issue in the repository
- Reach out to the development team

---

**Last Updated**: Phase 6 Implementation
**Maintained By**: RedCube Development Team
