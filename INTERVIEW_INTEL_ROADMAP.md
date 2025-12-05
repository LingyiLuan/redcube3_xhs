# Interview Intel Platform Roadmap

## Executive Summary

Interview Intel is a UGC platform for sharing and discovering interview experiences. This document outlines the completed features and the strategic roadmap for building a world-class interview preparation community.

## Platform Vision

Create the most trusted source of interview intelligence where candidates:
- Share authentic interview experiences
- Discover high-quality preparation insights
- Analyze trends across companies and roles
- Build reputation through helpful contributions
- Learn from the collective wisdom of the community

## Current State (Completed Features)

### Phase 1: Foundation ✅
**Status:** Complete
**Documentation:** `CITATION_TRACKING_IMPLEMENTATION.md`

#### Database Schema
- Complete `interview_experiences` table with 23 fields
- Citation tracking tables (`experience_analysis_history`)
- Reputation system (`reputation_events`)
- Voting system (`experience_votes`)
- Comment system (`experience_comments`)
- Email verification (`email_verifications`)
- Moderation system (`experience_flags`)

#### Backend API
- Full CRUD operations for experiences
- Citation tracking endpoint (POST `/api/content/interview-intel/experiences/:id/cite`)
- Voting system (upvote/downvote)
- Search functionality
- Trending experiences (basic)
- User experience management
- Citations history tracking

#### Frontend Components
- `ExperienceCard.vue` - Display interview experience cards
- `ExperienceDetailView.vue` - Full experience view modal
- `InterviewIntelPage.vue` - Main discovery page
- Citation count display (📚 icon)
- "ANALYZE THIS EXPERIENCE" button with workflow integration
- Upvote/view/citation statistics

#### Workflow Integration
- Automatic citation tracking when experiences are analyzed
- Experience loading in Workflow Editor
- Non-blocking citation recording (failures don't disrupt UX)
- Workflow ID generation for citation history

#### Key Metrics Tracked
- Upvotes/downvotes (community validation)
- Views (engagement)
- Citation count (academic influence)
- Analysis usage count (workflow usage)
- Impact score (composite metric)
- Helpfulness ratio (quality signal)

## Next Phase: Discovery & Trending

### Phase 2: Trending Algorithm 🚀
**Status:** Planned
**Documentation:** `NEXT_PHASE_TRENDING_EXPERIENCES.md`
**Timeline:** 11 days (4 sprints)

#### Goals
1. Implement sophisticated trending algorithm
2. Build discovery features (trending, rising stars, most cited)
3. Create dedicated trending page
4. Set up automated trending score updates

#### Key Features

**Sprint 1: Trending Algorithm Backend (3 days)**
- Database migration: `32-trending-algorithm.sql`
- Trending score calculation function
- Materialized view for performance
- Service layer implementation

**Trending Score Formula:**
```
score = (engagement * 0.3) + (quality * 0.2) + (impact * 0.4) + (time_decay * 10)

where:
- engagement = (upvotes * 10) - (downvotes * 5) + (views * 0.1)
- quality = upvotes / (upvotes + downvotes) * 100
- impact = (citation_count * 20) + (analysis_usage_count * 15)
- time_decay = exp(-age_in_days / 30)
- verified_boost = 1.2x multiplier
```

**Sprint 2: API Endpoints (2 days)**
- GET `/api/trending/experiences` - Trending with filters
- GET `/api/trending/rising-stars` - New but engaging
- GET `/api/trending/most-cited` - Academic influence
- Time window filters (24h / 7d / 30d / all)
- Category filters (by company / role)

**Sprint 3: Frontend Discovery Page (4 days)**
- `TrendingExperiencesPage.vue` - Main discovery interface
- Tabbed navigation (Trending / Rising Stars / Most Cited)
- Time window selector
- Category filters
- Grid layout with infinite scroll
- Real-time trending score display (optional)

**Sprint 4: Automation & Monitoring (2 days)**
- Hourly cron job for trending score updates
- Materialized view refresh automation
- Monitoring dashboard for trending metrics
- Performance optimization

## Future Phases

### Phase 3: Personalization (Q2 2025)
**Timeline:** 3 weeks
**Status:** Conceptual

#### Features
- User browsing history tracking
- Personalized recommendations
- Company/role follow system
- Collaborative filtering
- Custom feed based on interests

#### Success Metrics
- Increased time on site
- Higher conversion to workflow analysis
- User retention improvement

### Phase 4: Advanced Discovery (Q3 2025)
**Timeline:** 4 weeks
**Status:** Conceptual

#### Features
- ML-based similar experiences clustering
- Topic modeling for content themes
- Seasonal trending (hiring seasons)
- Outcome-specific trending
- Company/role comparative analytics

#### Technology Stack
- TensorFlow/PyTorch for ML models
- Elasticsearch for advanced search
- Redis for real-time recommendations

### Phase 5: Community Engagement (Q4 2025)
**Timeline:** 3 weeks
**Status:** Conceptual

#### Features
- User profiles and badges
- Reputation leaderboards
- Contribution streaks
- Community challenges
- Expert verification program

## Technical Architecture

### Database
- **Primary:** PostgreSQL 14+
- **Caching:** Redis (planned)
- **Search:** Full-text search with pg_trgm (current), Elasticsearch (future)

### Backend
- **Framework:** Express.js
- **Language:** Node.js
- **Architecture:** Service-oriented (controller → service → database)
- **Authentication:** JWT with optional auth middleware

### Frontend
- **Framework:** Vue 3 (Composition API)
- **Router:** Vue Router
- **State:** Pinia stores
- **Styling:** Custom CSS (minimalist design system)
- **Build:** Vite

### DevOps
- **Containers:** Docker Compose
- **Database:** PostgreSQL in Docker
- **Reverse Proxy:** Nginx
- **Scheduled Jobs:** node-cron

## Data Model

### Core Entities

```
interview_experiences (main table)
├── id (PK)
├── user_id (FK → users)
├── company (indexed)
├── role (indexed)
├── interview_date
├── difficulty (1-5)
├── outcome (Offer/Reject/Pending/etc)
├── questions_asked (text[])
├── preparation_feedback (text)
├── tips_for_others (text)
├── areas_struggled (text[])
├── verified (boolean)
├── verified_email_domain
├── upvotes (indexed)
├── downvotes
├── views
├── citation_count (indexed)
├── analysis_usage_count (indexed)
├── impact_score (indexed)
├── helpfulness_ratio
├── trending_score (future, indexed)
├── trending_score_updated_at (future)
├── created_at (indexed)
└── deleted_at (soft delete)

experience_analysis_history (citation tracking)
├── id (PK)
├── experience_id (FK → interview_experiences)
├── analyzed_by_user_id (FK → users)
├── workflow_id
├── analysis_type
└── analyzed_at (indexed)
```

## API Surface

### Current Endpoints

**Interview Intel UGC**
- `POST /api/content/interview-intel/experiences` - Create experience
- `GET /api/content/interview-intel/experiences` - List with filters
- `GET /api/content/interview-intel/experiences/:id` - Get single experience
- `GET /api/content/interview-intel/experiences/:id/citations` - Get citation history
- `POST /api/content/interview-intel/experiences/:id/vote` - Vote on experience
- `POST /api/content/interview-intel/experiences/:id/cite` - Record citation
- `GET /api/content/interview-intel/my-experiences` - User's experiences
- `GET /api/content/interview-intel/trending` - Trending experiences (basic)
- `GET /api/content/interview-intel/search` - Search experiences

### Planned Endpoints (Phase 2)

**Trending & Discovery**
- `GET /api/trending/experiences` - Advanced trending with filters
- `GET /api/trending/rising-stars` - New but engaging content
- `GET /api/trending/most-cited` - Academic influence ranking
- `GET /api/trending/category/:category/:value` - Category-specific trending

## Success Metrics

### User Engagement
- **DAU/MAU Ratio:** Target 30% (sticky product)
- **Avg Session Duration:** Target 15+ minutes
- **Return User Rate:** Target 60%+ weekly
- **Experience Creation Rate:** Target 10% of active users

### Content Quality
- **Avg Upvote Ratio:** Target 70%+ positive
- **Citation Rate:** Target 20% of experiences cited
- **Verification Rate:** Target 40%+ email verified
- **Spam/Flag Rate:** Target <2% flagged

### Business Metrics
- **User Growth:** Target 100% MoM in early stage
- **Experience Growth:** Target 50+ new experiences/week
- **Conversion to Analysis:** Target 30% discovery → workflow
- **User Retention:** Target 50%+ 30-day retention

## Competitive Analysis

### Differentiators
1. **Academic Citation Model** - Unlike Glassdoor/Blind, we track how often experiences are referenced
2. **Workflow Integration** - Direct connection to interview prep workflow
3. **Data-Driven Insights** - AI analysis of trends across experiences
4. **Quality over Quantity** - Trending algorithm surfaces best content, not just newest
5. **Community Reputation** - Gamified contribution system

### Market Position
- **Primary Competitor:** Blind (anonymous professional network)
- **Secondary Competitors:** Glassdoor, LeetCode Discuss
- **Unique Value:** Integration with learning map generation and workflow analysis

## Risk Mitigation

### Technical Risks
- **Database Performance:** Mitigated by indexes, materialized views, caching
- **Spam/Low Quality:** Mitigated by voting, verification, moderation system
- **Trending Algorithm Gaming:** Mitigated by time decay, quality signals, verification boost

### Product Risks
- **Cold Start Problem:** Mitigated by seeding with Reddit data, early adopter program
- **User Privacy:** Mitigated by anonymization options, verified domains only
- **Content Moderation:** Mitigated by flag system, automated detection (future)

## Next Steps

### Immediate (This Week)
1. ✅ Complete citation tracking implementation
2. ✅ Document current state and roadmap
3. 🔄 Begin Phase 2 planning approval

### Short Term (Next 2 Weeks)
1. Implement trending algorithm backend
2. Build discovery API endpoints
3. Create trending experiences page
4. Set up automated trending updates

### Medium Term (Next Month)
1. Launch trending features to production
2. Monitor engagement metrics
3. Gather user feedback
4. Iterate on trending algorithm weights

### Long Term (Next Quarter)
1. Begin personalization features
2. Implement ML-based recommendations
3. Build community engagement features
4. Launch expert verification program

## Resource Requirements

### Development Team
- **Backend Engineer:** 1 FTE
- **Frontend Engineer:** 1 FTE
- **Data Scientist:** 0.5 FTE (future phases)
- **DevOps Engineer:** 0.25 FTE

### Infrastructure
- **Database:** PostgreSQL (current Docker setup sufficient)
- **Caching:** Redis (add in Phase 2)
- **Monitoring:** Application Performance Monitoring tool
- **Analytics:** Google Analytics + custom dashboards

## Conclusion

The Interview Intel platform has a solid foundation with citation tracking, voting, and basic discovery features. The next phase focuses on surfacing the best content through sophisticated trending algorithms and discovery features.

By leveraging multiple quality signals (votes, citations, views, verification) and time decay, we can create a discovery experience that consistently surfaces the most valuable interview insights to our users.

The roadmap balances quick wins (trending in 11 days) with strategic long-term investments (personalization, ML recommendations) to build a sustainable competitive advantage in the interview preparation market.

## Appendix

### Related Documentation
- `CITATION_TRACKING_IMPLEMENTATION.md` - Complete citation system documentation
- `NEXT_PHASE_TRENDING_EXPERIENCES.md` - Detailed Phase 2 plan
- Database migrations in `shared/database/init/` (migrations 01-31)

### Code References
- Backend service: [services/content-service/src/services/interviewIntelService.js](services/content-service/src/services/interviewIntelService.js)
- Backend controller: [services/content-service/src/controllers/interviewIntelController.js](services/content-service/src/controllers/interviewIntelController.js)
- Frontend page: [vue-frontend/src/pages/InterviewIntelPage.vue](vue-frontend/src/pages/InterviewIntelPage.vue)
- Experience card: [vue-frontend/src/components/InterviewIntel/ExperienceCard.vue](vue-frontend/src/components/InterviewIntel/ExperienceCard.vue)
