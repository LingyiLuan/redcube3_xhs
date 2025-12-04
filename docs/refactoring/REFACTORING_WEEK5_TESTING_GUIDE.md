# Week 5 Testing Guide - MultiPostPatternReport Refactoring

**Date:** November 11, 2025
**Phase:** Week 5 - Testing & Validation
**Status:** Ready for Testing

---

## Quick Start: How to Test

### 1. Enable v2 in Development

**Method 1: Use Dev Tools (Recommended)**
1. Start the dev server: `cd vue-frontend && npm run dev`
2. Navigate to a batch analysis report
3. Scroll to the bottom of the report
4. Look for the yellow "🔧 Developer Tools" box
5. Click "Enable v2" button
6. Page will reload with v2 enabled

**Method 2: Browser Console**
```javascript
localStorage.setItem('use_refactored_multipost_report', 'true')
location.reload()
```

**Method 3: Edit Feature Flag File**
Edit `/Users/luan02/Desktop/redcube3_xhs/vue-frontend/src/composables/useReportFeatureFlag.ts`:
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 1.0  // 100% rollout
```

### 2. Disable v2 (Rollback)

**Method 1: Use Dev Tools**
- Click "Disable v2" button in dev tools
- Page will reload with v1

**Method 2: Browser Console**
```javascript
localStorage.setItem('use_refactored_multipost_report', 'false')
location.reload()
```

---

## Testing Checklist

### Phase 1: Visual Regression Testing

**Goal:** Ensure v2 looks identical to v1

#### Test Cases

- [ ] **Report Header**
  - [ ] Title displays correctly
  - [ ] Date formatting matches v1
  - [ ] Metadata (posts/companies/roles) displays correctly
  - [ ] Blue gradient background renders

- [ ] **Your Experiences Table**
  - [ ] All columns render (Company, Role, Date, Outcome, Topics, View)
  - [ ] Row hover effects work
  - [ ] Outcome colors match (green=success, red=rejected, yellow=pending)
  - [ ] "View" button opens modal
  - [ ] Analysis scope displays correctly

- [ ] **Executive Summary**
  - [ ] Two-column layout renders
  - [ ] Narrative text displays
  - [ ] Metrics table shows all values
  - [ ] InsightCallout widget renders if present

- [ ] **Company Intelligence**
  - [ ] Company comparison table displays
  - [ ] Scatter plot renders with Chart.js
  - [ ] Quadrant interpretation shows
  - [ ] All companies plotted correctly

- [ ] **Critical Skills**
  - [ ] Dual-metric bars render
  - [ ] 5x5 correlation heatmap displays
  - [ ] Skill combinations grid shows
  - [ ] Priority badges display (Critical/High/Medium/Low)

- [ ] **Success Factors**
  - [ ] Waterfall chart renders
  - [ ] Funnel chart displays
  - [ ] Success patterns table shows
  - [ ] Success indicators list correctly

- [ ] **Interview Questions**
  - [ ] Tab navigation works (by-company, by-category, by-difficulty)
  - [ ] Company question grid displays
  - [ ] Question bank list renders
  - [ ] Search and filters function
  - [ ] Pagination works (10 per page)
  - [ ] Question detail modal opens

- [ ] **Interview Process**
  - [ ] Vertical timeline renders
  - [ ] Stage numbers display (1-5)
  - [ ] Duration and pass rate show
  - [ ] Wait time connectors render
  - [ ] Company process table displays (if data available)

- [ ] **Preparation Roadmap**
  - [ ] 4-week roadmap displays
  - [ ] Priority skills list shows (top 8)
  - [ ] Action items checklist renders (10 items)
  - [ ] Resource recommendations display

- [ ] **Post Detail Modal**
  - [ ] Modal opens when clicking "View" button
  - [ ] Company and role display
  - [ ] Outcome text and color correct
  - [ ] Skills tags display
  - [ ] Close button works
  - [ ] Click outside closes modal

### Phase 2: Functional Testing

**Goal:** Ensure all interactions work correctly

#### Test Cases

- [ ] **Navigation**
  - [ ] All tabs in Interview Questions section work
  - [ ] Company cards filter question bank correctly
  - [ ] Back button works in all sections

- [ ] **Search & Filter**
  - [ ] Search in question bank filters correctly
  - [ ] Company filter in question bank works
  - [ ] Category filter in question bank works
  - [ ] Clear filters resets correctly

- [ ] **Pagination**
  - [ ] Next/Previous buttons work
  - [ ] Page count is correct
  - [ ] Disabled states work (first/last page)
  - [ ] Items per page is 10

- [ ] **Modals**
  - [ ] Question detail modal opens
  - [ ] Post detail modal opens
  - [ ] Modals close on X button
  - [ ] Modals close on outside click
  - [ ] Multiple modals don't stack

- [ ] **Charts**
  - [ ] Chart.js charts render
  - [ ] Tooltips work on hover
  - [ ] Charts are responsive
  - [ ] No console errors

- [ ] **Feature Flag**
  - [ ] Dev tools toggle appears in development
  - [ ] Enable v2 button works
  - [ ] Disable v2 button works
  - [ ] Flag status displays correctly

### Phase 3: Responsive Testing

**Goal:** Ensure mobile/tablet/desktop layouts work

#### Test Cases

- [ ] **Desktop (>1024px)**
  - [ ] All sections display in full width
  - [ ] Charts are full size
  - [ ] Tables are readable
  - [ ] Modals are centered

- [ ] **Tablet (640px-1024px)**
  - [ ] Sections adapt to smaller width
  - [ ] Charts resize appropriately
  - [ ] Tables scroll horizontally if needed
  - [ ] Modals are responsive

- [ ] **Mobile (<640px)**
  - [ ] Report header stacks vertically
  - [ ] Tables become scrollable
  - [ ] Charts resize to fit screen
  - [ ] Modals take full width
  - [ ] Touch interactions work

### Phase 4: Browser Compatibility

**Goal:** Ensure cross-browser compatibility

#### Test Cases

- [ ] **Chrome** (Latest)
  - [ ] All features work
  - [ ] No console errors
  - [ ] Charts render correctly

- [ ] **Firefox** (Latest)
  - [ ] All features work
  - [ ] No console errors
  - [ ] Charts render correctly

- [ ] **Safari** (Latest)
  - [ ] All features work
  - [ ] No console errors
  - [ ] Charts render correctly

- [ ] **Edge** (Latest)
  - [ ] All features work
  - [ ] No console errors
  - [ ] Charts render correctly

### Phase 5: Performance Testing

**Goal:** Ensure v2 performs same or better than v1

#### Test Cases

- [ ] **Lighthouse Scores**
  - [ ] Run Lighthouse on v1, record scores
  - [ ] Run Lighthouse on v2, compare scores
  - [ ] Performance score >= v1
  - [ ] Accessibility score >= v1

- [ ] **Bundle Size**
  - [ ] Check bundle size of v1
  - [ ] Check bundle size of v2
  - [ ] v2 should be similar or smaller

- [ ] **Load Time**
  - [ ] Measure initial render time of v1
  - [ ] Measure initial render time of v2
  - [ ] v2 should be faster or same

- [ ] **Memory Usage**
  - [ ] Check memory usage in DevTools
  - [ ] v2 should not leak memory
  - [ ] v2 should use similar or less memory

### Phase 6: Data Validation

**Goal:** Ensure data is processed correctly

#### Test Cases

- [ ] **Empty Data**
  - [ ] Report handles missing patterns gracefully
  - [ ] No crashes with empty arrays
  - [ ] Fallback messages display

- [ ] **Partial Data**
  - [ ] Sections render with incomplete data
  - [ ] Conditional sections hide correctly
  - [ ] No undefined errors

- [ ] **Large Data**
  - [ ] Report handles 100+ posts
  - [ ] Pagination works with large datasets
  - [ ] Charts render with many data points

- [ ] **Edge Cases**
  - [ ] Single post analysis works
  - [ ] No companies case handled
  - [ ] No skills case handled

### Phase 7: Console & Error Checking

**Goal:** Ensure no errors or warnings

#### Test Cases

- [ ] **Console Errors**
  - [ ] No errors in console (v2)
  - [ ] No warnings in console (v2)
  - [ ] Same or fewer logs than v1

- [ ] **Network Errors**
  - [ ] No 404s for missing files
  - [ ] No CORS errors
  - [ ] All assets load correctly

- [ ] **TypeScript Errors**
  - [ ] No TypeScript errors in build
  - [ ] All types are correct
  - [ ] No `any` type warnings

---

## How to Report Issues

### Issue Template

```markdown
**Issue Title:** [Component Name] - Brief Description

**Version:** v2 (Refactored)

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
Attach screenshots if visual issue

**Browser:** Chrome/Firefox/Safari/Edge (Version)

**Console Errors:**
Paste any console errors here

**Priority:** High/Medium/Low
```

### Where to Report

- Create a GitHub issue in the project repository
- Add label: `refactoring-week5-testing`
- Assign to: Development team

---

## Rollback Plan

If critical issues are found:

### Immediate Rollback (< 5 minutes)

**Method 1: Dev Tools**
- Click "Disable v2" button
- Page reloads to v1

**Method 2: Feature Flag**
Edit `useReportFeatureFlag.ts`:
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 0.0  // Disable for all users
```

**Method 3: Emergency Override**
Add this to `ReportViewer.vue`:
```vue
<!-- Force v1 temporarily -->
<MultiPostPatternReport
  v-if="report.result.pattern_analysis"
  :patterns="report.result.pattern_analysis"
  :individual-analyses="report.result.individual_analyses || []"
/>
```

---

## Success Criteria

### Must Pass (Blocking)

- [ ] All visual regression tests pass
- [ ] All functional tests pass
- [ ] No console errors
- [ ] Performance same or better than v1
- [ ] Works on all major browsers
- [ ] Mobile responsive

### Nice to Have (Non-Blocking)

- [ ] 10% faster initial render
- [ ] Smaller bundle size
- [ ] Better Lighthouse scores
- [ ] Cleaner console output

---

## Testing Schedule

### Day 1: Visual & Functional Testing
- Run all visual regression tests
- Run all functional tests
- Document any issues found

### Day 2: Responsive & Browser Testing
- Test on all screen sizes
- Test on all browsers
- Document compatibility issues

### Day 3: Performance & Data Testing
- Run Lighthouse tests
- Test with various datasets
- Measure bundle size and load time

### Day 4: Bug Fixes
- Fix all high-priority issues
- Re-test fixed components
- Update documentation

### Day 5: Final Review
- Re-run all tests
- Sign-off on v2
- Prepare for gradual rollout

---

## Post-Testing: Gradual Rollout

After all tests pass:

### Week 5 (Day 6-7): 10% Rollout
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 0.1
```
- Monitor error rates
- Check performance metrics
- Gather user feedback

### Week 6 (Day 1-2): 25% Rollout
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 0.25
```
- Continue monitoring
- Fix any issues found
- Increase if stable

### Week 6 (Day 3-4): 50% Rollout
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 0.5
```
- A/B test metrics
- Compare v1 vs v2
- Validate improvement

### Week 6 (Day 5-7): 100% Rollout
```typescript
const DEFAULT_ROLLOUT_PERCENTAGE = 1.0
```
- Full deployment
- Remove v1 code
- Remove feature flag
- Rename v2 → main

---

## Testing Tools

### Recommended Tools

1. **Chrome DevTools**
   - Performance panel
   - Network panel
   - Console
   - Lighthouse

2. **Vue DevTools**
   - Component inspector
   - Performance profiling
   - Store inspection

3. **Browser Testing**
   - BrowserStack (cross-browser)
   - Responsively App (responsive)

4. **Visual Testing**
   - Percy (screenshots)
   - Chromatic (visual regression)

5. **Performance**
   - WebPageTest
   - Lighthouse CI
   - Bundle analyzer

---

## Developer Commands

### Run Tests
```bash
# Start dev server
cd vue-frontend
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

### Enable/Disable v2 via Console
```javascript
// Enable v2
localStorage.setItem('use_refactored_multipost_report', 'true')
location.reload()

// Disable v2
localStorage.setItem('use_refactored_multipost_report', 'false')
location.reload()

// Reset to default (percentage rollout)
localStorage.removeItem('use_refactored_multipost_report')
sessionStorage.removeItem('refactored_report_rollout_seed')
location.reload()
```

### Check Current Version
```javascript
// In console
console.log('Flag:', localStorage.getItem('use_refactored_multipost_report'))
console.log('Version:', document.querySelector('.mckinsey-report') ? 'v2' : 'v1')
```

---

## Conclusion

This testing guide provides a comprehensive checklist for validating the refactored MultiPostPatternReport_v2 component. Follow each phase systematically, document all findings, and ensure all blocking issues are resolved before proceeding to gradual rollout.

**Next Step:** Begin Phase 1 (Visual Regression Testing) with real batch analysis data.

---

**Last Updated:** November 11, 2025
**Status:** Ready for Testing
**Estimated Time:** 3-5 days for complete testing
