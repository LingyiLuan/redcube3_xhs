# Citation Tracking Implementation

## Overview

The citation tracking system measures how frequently interview experiences are used as seed posts in workflow analyses. This creates an academic-style citation model where popular/useful experiences accumulate higher citation counts over time.

## Architecture

### Database Schema

**Migration File:** `shared/database/init/31-citation-tracking.sql`

#### Enhanced `interview_experiences` Table
- `analysis_usage_count` (INTEGER): Counter for total times experience has been analyzed
- `last_analyzed_at` (TIMESTAMP): Most recent analysis timestamp

#### New `experience_analysis_history` Table
- `id` (SERIAL): Primary key
- `experience_id` (INTEGER): Foreign key to `interview_experiences`
- `analyzed_by_user_id` (INTEGER): User who performed analysis
- `workflow_id` (VARCHAR): Unique workflow execution identifier
- `analysis_type` (VARCHAR): Type of analysis performed
- `analyzed_at` (TIMESTAMP): Citation timestamp
- `created_at` (TIMESTAMP): Record creation time

#### Performance Indexes
- `idx_experience_analysis_history_experience_id`: Fast lookup by experience
- `idx_experience_analysis_history_user_id`: Fast lookup by user
- `idx_experience_analysis_history_analyzed_at`: Time-based queries
- `idx_interview_experiences_analysis_usage_count`: Sorting by popularity

### Backend Implementation

#### Service Layer
**File:** `services/content-service/src/services/interviewIntelService.js:476-528`

```javascript
async function citeExperience(experienceId, userId, workflowId, analysisType)
```

**Features:**
- PostgreSQL transaction support (BEGIN/COMMIT/ROLLBACK)
- Atomically inserts citation record and increments counter
- Returns updated citation count and timestamp
- Full rollback on any error

#### Controller Layer
**File:** `services/content-service/src/controllers/interviewIntelController.js:372-410`

```javascript
async function citeExperience(req, res)
```

**Features:**
- Extracts `experienceId` from URL params
- Validates `workflowId` and `analysisType` from request body
- Uses `optionalAuth` middleware for user tracking
- Returns citation count and last analyzed timestamp

#### API Routes
**File:** `services/content-service/src/routes/contentRoutes.js:156`

```javascript
router.post('/interview-intel/experiences/:id/cite', optionalAuth, citeExperience)
```

**Endpoint:** `POST /api/content/interview-intel/experiences/:id/cite`

**Request Body:**
```json
{
  "workflowId": "workflow_12345",
  "analysisType": "workflow_analysis"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "citationCount": 2,
    "lastAnalyzedAt": "2025-11-25T20:02:30.855Z"
  },
  "message": "Citation recorded successfully"
}
```

### Frontend Integration

#### Workflow Editor
**File:** `vue-frontend/src/views/WorkflowEditor.vue:239-252`

Automatically records citations when experiences are analyzed:

```javascript
// Record citation for this experience being analyzed
try {
  await axios.post(
    `http://localhost:8080/api/content/interview-intel/experiences/${experience.id}/cite`,
    {
      workflowId: `workflow_${Date.now()}`,
      analysisType: 'workflow_analysis'
    }
  )
  console.log('[WorkflowEditor] Citation recorded for experience:', experience.id)
} catch (citationError) {
  console.error('[WorkflowEditor] Error recording citation:', citationError)
  // Don't show error to user - citation tracking is non-critical
}
```

**Features:**
- Non-blocking (citation failures don't interrupt workflow)
- Automatic tracking on experience load
- Silent error handling (tracking is non-critical)

#### Experience Card UI
**File:** `vue-frontend/src/components/InterviewIntel/ExperienceCard.vue:42-45`

Displays citation count alongside other metrics:

```vue
<div class="stat">
  <span class="stat-icon">📚</span>
  <span class="stat-value">{{ experience.citation_count || 0 }}</span>
</div>
```

## Usage Flow

1. **User clicks "ANALYZE THIS EXPERIENCE"** on an experience card
2. **Router navigates** to `/workflow?mode=analyze-experience&experienceId=2`
3. **WorkflowEditor loads** the experience data from API
4. **Citation is recorded automatically** via POST to citation endpoint
5. **Database updates atomically:**
   - Inserts record in `experience_analysis_history`
   - Increments `analysis_usage_count` on experience
   - Updates `last_analyzed_at` timestamp
6. **UI displays** updated citation count (📚 icon)

## Data Integrity

### Transaction Safety
All citation operations use PostgreSQL transactions to ensure:
- Both history record and counter update succeed together
- No partial updates if any step fails
- Automatic rollback on errors

### Foreign Key Constraints
- Citations require valid experience ID
- Cascading delete removes citation history when experience is deleted
- User ID uses `SET NULL` on user deletion (preserves analytics)

## Analytics Capabilities

### Trending Experiences
Query most-cited experiences:
```sql
SELECT * FROM interview_experiences
ORDER BY analysis_usage_count DESC
LIMIT 10;
```

### Citation History
View detailed citation timeline:
```sql
SELECT * FROM experience_analysis_history
WHERE experience_id = 2
ORDER BY analyzed_at DESC;
```

### User Activity
Track which users analyze most experiences:
```sql
SELECT analyzed_by_user_id, COUNT(*) as citation_count
FROM experience_analysis_history
GROUP BY analyzed_by_user_id
ORDER BY citation_count DESC;
```

### Time-Based Analysis
Citations over time periods:
```sql
SELECT DATE(analyzed_at) as date, COUNT(*) as citations
FROM experience_analysis_history
WHERE analyzed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(analyzed_at)
ORDER BY date;
```

## Testing

### Verified Functionality
✅ Citation records created in database
✅ Counter increments correctly (tested: 0→1→2)
✅ History table tracks each citation with workflow ID
✅ Transactional integrity maintained
✅ API endpoint responds with proper error handling
✅ Frontend integration working (automatic tracking)
✅ UI displays citation counts correctly

### Test Commands
```bash
# Test citation endpoint
curl -X POST http://localhost:8080/api/content/interview-intel/experiences/2/cite \
  -H "Content-Type: application/json" \
  -d '{"workflowId": "workflow_test_123", "analysisType": "workflow_analysis"}'

# Verify database state
docker exec redcube_postgres psql -U postgres -d postgres \
  -c "SELECT id, company, analysis_usage_count FROM interview_experiences WHERE id = 2;"

# Check citation history
docker exec redcube_postgres psql -U postgres -d postgres \
  -c "SELECT * FROM experience_analysis_history WHERE experience_id = 2;"
```

## Future Enhancements

### Potential Features
- **Citation leaderboard** showing most-cited experiences
- **User contribution metrics** based on their experiences' citation counts
- **Time-decay algorithm** to favor recent citations over old ones
- **Citation graphs** showing trends over time
- **Recommendation system** suggesting highly-cited experiences
- **Badges/rewards** for users whose experiences are frequently cited

### Performance Optimizations
- Materialized views for trending experiences
- Redis cache for citation counts
- Batch citation updates for high-traffic scenarios
- Partitioning of history table by date

## Deployment Notes

### Migration Application
```bash
# Apply migration to database
docker exec redcube_postgres psql -U postgres -d postgres \
  -f /docker-entrypoint-initdb.d/31-citation-tracking.sql

# Rebuild and restart service
docker-compose build content-service
docker-compose up -d content-service
```

### Monitoring
- Monitor citation API response times
- Track citation success/failure rates
- Alert on transaction rollbacks
- Monitor database index performance

## Technical Decisions

### Why Dual Storage (Counter + History)?
- **Counter (`analysis_usage_count`)**: Fast reads for sorting/filtering
- **History table**: Detailed analytics and audit trail
- Trade-off: Small storage overhead for significant performance gain

### Why Transactions?
- Ensures data consistency between counter and history
- Prevents race conditions in concurrent citations
- Allows atomic rollback on any failure

### Why Non-Critical Tracking?
- Citation tracking enhances UX but isn't essential
- Silent failures prevent disrupting user workflows
- Async nature allows for retry mechanisms if needed

## Related Files

### Database
- `shared/database/init/31-citation-tracking.sql`

### Backend
- `services/content-service/src/services/interviewIntelService.js`
- `services/content-service/src/controllers/interviewIntelController.js`
- `services/content-service/src/routes/contentRoutes.js`

### Frontend
- `vue-frontend/src/views/WorkflowEditor.vue`
- `vue-frontend/src/components/InterviewIntel/ExperienceCard.vue`

## Contact

For questions or issues related to citation tracking:
- Review this document
- Check database migration logs
- Monitor service logs for citation errors
- Verify API endpoint accessibility
