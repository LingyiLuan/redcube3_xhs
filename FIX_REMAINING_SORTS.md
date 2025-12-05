# Remaining Sort Fixes for analysisController.js

## Summary
Need to add stable tiebreakers to 7 more `.sort()` calls to ensure deterministic ordering.

## Pattern to Apply
```javascript
// BEFORE (unstable)
.sort((a, b) => b[1] - a[1])

// AFTER (stable)
.sort((a, b) => {
  if (b[1] !== a[1]) return b[1] - a[1];  // Primary: count DESC
  return a[0].localeCompare(b[0]);         // Secondary: name ASC (alphabetical)
})
```

## Locations to Fix

### 1. Company Skills (Line ~707)
```javascript
// CURRENT:
      const topSkills = Object.entries(stats.commonSkills)
        .sort((a, b) => b[1] - a[1])

// FIX TO:
      const topSkills = Object.entries(stats.commonSkills)
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return a[0].localeCompare(b[0]);
        })
```

### 2. Company Roles (Line ~725)
```javascript
// CURRENT:
        top_roles: Object.entries(stats.roles)
          .sort((a, b) => b[1] - a[1])

// FIX TO:
        top_roles: Object.entries(stats.roles)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
          })
```

### 3. Role Skills (Line ~802)
```javascript
// CURRENT:
        top_skills: Object.entries(stats.skills)
          .sort((a, b) => b[1] - a[1])

// FIX TO:
        top_skills: Object.entries(stats.skills)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
          })
```

### 4. Knowledge Gaps (Line ~879)
```javascript
// CURRENT:
  const knowledgeGaps = Object.entries(struggledTopics)
    .sort((a, b) => b[1] - a[1])

// FIX TO:
  const knowledgeGaps = Object.entries(struggledTopics)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
```

### 5. Top Keywords (Line ~937)
```javascript
// CURRENT:
  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => b[1] - a[1])

// FIX TO:
  const topKeywords = Object.entries(allKeywords)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
```

### 6. Skill Network Edges (Line ~1107)
```javascript
// CURRENT:
      .sort((a, b) => b[1] - a[1])

// FIX TO:
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
```

### 7. Top Emotions (Line ~1129)
```javascript
// CURRENT:
  const topEmotions = Object.entries(emotionKeywords)
    .sort((a, b) => b[1] - a[1])

// FIX TO:
  const topEmotions = Object.entries(emotionKeywords)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
```

## Implementation Status
- ✅ Fixed 1/8: Top Skills (line 652)
- ⏳ Remaining: 7 fixes

## Next Steps
1. Apply all 7 fixes above
2. Copy updated file to Docker container
3. Restart content-service
4. Test report consistency
