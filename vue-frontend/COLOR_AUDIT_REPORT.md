# McKinsey Color System Audit Report

## Foundation Complete ✅

- [x] Created `/src/assets/css-variables.css` - McKinsey color palette
- [x] Created `/src/composables/useChartColors.ts` - Chart color helpers
- [x] Imported CSS variables in `main.css`

## Color Replacement Guide

### McKinsey Palette Mappings

**Current → McKinsey Replacement**

| Current Color | Hex | Replace With | CSS Variable |
|--------------|-----|--------------|--------------|
| Light backgrounds | `#F9FAFB` | Off White | `var(--color-off-white)` or `#F8FAFC` |
| Card backgrounds | `#FFFFFF` | White | `var(--color-white)` |
| Border colors | `#E5E7EB` | Light Gray | `var(--color-border)` |
| Border lighter | `#F3F4F6` | Light Gray | `var(--color-border-light)` |
| Primary text | `#111827` | Charcoal | `var(--color-charcoal)` or `#1F2937` |
| Secondary text | `#374151` | Slate | `var(--color-slate)` or `#64748B` |
| Muted text | `#6B7280` | Slate | `var(--color-slate)` |
| Gray text | `#9CA3AF` | Slate | `var(--color-slate)` |
| Primary blue | `#1E3A8A` | Navy | `var(--color-navy)` |
| Blue hover | `#1E40AF` | Navy | `var(--color-navy)` |
| Medium blue | `#3B82F6` | Blue | `var(--color-blue)` |
| Light blue backgrounds | `#EFF6FF` | Baby Blue | `var(--color-baby-blue)` or `#BFDBFE` |
| Light blue | `#DBEAFE` | Baby Blue | `var(--color-baby-blue)` |
| **Red (REMOVE)** | `#FEF2F2` | Baby Blue | `var(--color-baby-blue)` ❗ |
| **Red (REMOVE)** | `#FEE2E2` | Baby Blue | `var(--color-baby-blue)` ❗ |
| **Green (REMOVE)** | `#10B981` | Navy | `var(--color-navy)` ❗ |
| **Yellow (REMOVE)** | `#F59E0B` | Light Blue | `var(--color-light-blue)` ❗ |

## Component-by-Component Audit

### 1. CompanyIntelligenceV1.vue ⚠️ HIGH PRIORITY

**Chart Colors to Update:**
```javascript
// Current scatter plot colors (lines 268-273)
borderColor: '#4B5563'  → MCKINSEY_CHART_COLORS.navy
borderColor: '#1E3A8A'  → MCKINSEY_CHART_COLORS.navy (already correct!)

// Grid colors (lines 397-398)
color: '#F3F4F6'  → '#F1F5F9' (lighter grid)
color: '#9CA3AF'  → '#E2E8F0' (light gray border)

// Tooltip colors (lines 406-409)
backgroundColor: '#FFFFFF'  → '#1F2937' (charcoal - better contrast)
titleColor: '#111827'  → '#FFFFFF'
bodyColor: '#374151'  → '#FFFFFF'
```

**CSS Colors to Update:**
```css
/* Replace all instances */
#F9FAFB → var(--color-off-white)
#FFFFFF → var(--color-white)
#E5E7EB → var(--color-border)
#374151 → var(--color-slate)
#111827 → var(--color-charcoal)

/* CRITICAL: Remove red background */
#FEF2F2 → var(--color-baby-blue)  /* worst-performer rows */
```

### 2. LearningPlanCTA.vue ⚠️ MEDIUM PRIORITY

**Already mostly McKinsey-compliant!** Just needs CSS variables:

```css
/* Line 101-142 */
background: #FFFFFF → var(--color-white)
border: 1px solid #E5E7EB → var(--color-border)
border-color: #1E3A5F → var(--color-navy)
color: #111827 → var(--color-charcoal)
color: #4B5563 → var(--color-slate)
color: #1E3A5F → var(--color-navy)
background: #1E3A5F → var(--color-button-primary)
background: #2C5282 → var(--color-button-primary-hover)
background: #F9FAFB → var(--color-off-white)
border: 1px solid #E5E7EB → var(--color-border)
border-color: #D1D5DB → var(--color-border)
color: #374151 → var(--color-slate)
```

### 3. MethodologyV1.vue ⚠️ MEDIUM PRIORITY

**Mostly compliant, needs CSS variables:**

```css
/* Lines 168-265 */
background: #F9FAFB → var(--color-off-white)
border: 2px solid #1E3A5F → var(--color-navy)
border-bottom: 2px solid #E5E7EB → var(--color-border)
background: #FFFFFF → var(--color-white)
border: 1px solid #E5E7EB → var(--color-border)
color: #374151 → var(--color-slate)
color: #1E3A5F → var(--color-navy)
color: #6B7280 → var(--color-slate)
background: #1E3A5F → var(--color-button-primary)
background: #2C5282 → var(--color-button-primary-hover)
background: #FEF3C7 → var(--color-baby-blue) /* yellow warning box */
border: 1px solid #FDE68A → var(--color-light-gray)
color: #78350F → var(--color-charcoal)
color: #92400E → var(--color-navy)
```

### 4. Shared CSS Files ⚠️ HIGH PRIORITY

**File:** `/src/assets/css-modules/_tables.css`

**Critical Changes:**
```css
/* Seed badge (already compliant!) */
.seed-badge {
  background: var(--color-success-light) → var(--color-baby-blue)
  color: var(--color-success-dark) → var(--color-navy)
}

/* Difficulty badges - REMOVE traffic lights */
.difficulty-low {
  /* current: green colors */
  background: var(--color-baby-blue);
  color: var(--color-navy);
}

.difficulty-medium {
  /* current: yellow colors */
  background: var(--color-light-blue);
  color: var(--color-white);
}

.difficulty-high {
  /* current: red colors */
  background: var(--color-navy);
  color: var(--color-white);
}
```

## Chart.js Standard Configuration

**All Chart.js instances should use:**

```javascript
import { MCKINSEY_CHART_COLORS, MCKINSEY_CHART_DEFAULTS } from '@/composables/useChartColors'

// For datasets
datasets: [{
  backgroundColor: MCKINSEY_CHART_COLORS.navy,
  borderColor: MCKINSEY_CHART_COLORS.navy,
  // ... rest
}]

// Or use the helper
datasets: [{
  backgroundColor: getChartColor(0), // Navy
  borderColor: getChartBorderColor(0), // Dark Navy
  // ... rest
}]

// Merge with defaults
const options = {
  ...MCKINSEY_CHART_DEFAULTS,
  // custom options...
}
```

## Priority Action Items

### Immediate (Phase 1)
1. ✅ Create CSS variables file
2. ✅ Create chart colors composable
3. ✅ Import into main.css
4. Update CompanyIntelligenceV1.vue charts
5. Update _tables.css difficulty badges (REMOVE RED/YELLOW/GREEN)

### Short-term (Phase 2)
6. Update LearningPlanCTA.vue to use CSS variables
7. Update MethodologyV1.vue to use CSS variables
8. Update all button components
9. Update all badge components

### Medium-term (Phase 3)
10. Audit all remaining .vue files
11. Update shared CSS files
12. Document color usage guidelines
13. Add ESLint rule to prevent hardcoded colors

## Files Modified

- [x] `/src/assets/css-variables.css` - Created
- [x] `/src/composables/useChartColors.ts` - Created
- [x] `/src/assets/main.css` - Updated (imported variables)

## Files Pending

- [ ] `/src/assets/css-modules/_tables.css` - Remove traffic light colors
- [ ] `/src/components/ResultsPanel/sections/CompanyIntelligenceV1.vue` - Update charts
- [ ] `/src/components/ResultsPanel/sections/LearningPlanCTA.vue` - Use CSS variables
- [ ] `/src/components/ResultsPanel/sections/MethodologyV1.vue` - Use CSS variables
- [ ] All other report sections

## Notes

- **No red/yellow/green** - Use blue gradient for all status indicators
- **Consistent chart colors** - Use `MCKINSEY_CHART_COLORS` for all Chart.js
- **CSS variables** - Prefer `var(--color-name)` over hardcoded hex
- **Blue spectrum only** - Navy → Blue → Light Blue → Baby Blue progression

## Testing Checklist

- [ ] Charts use only blue spectrum (no random colors)
- [ ] Buttons use navy/dark navy
- [ ] No red/yellow/green status indicators
- [ ] Cards use white/off-white backgrounds
- [ ] Text uses charcoal/slate hierarchy
- [ ] Borders use light gray
- [ ] Overall visual harmony
