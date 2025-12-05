# Interview Intel: UGC Platform Implementation Plan

## Executive Summary

Building a User-Generated Content platform where users share interview experiences with academic-style citation tracking. This creates a content supply engine that feeds the Learning Map generator while building a competitive moat through network effects.

**Key Innovation**: Citation tracking ("Referenced in 89 Learning Maps", "Helped 340 Job Seekers") - unique differentiation from Blind/Glassdoor/Fishbowl.

**Strategic Rationale**: Build UGC FIRST (Q1 2025), then Community Growth (Q2 2025), then Gamification Layer (Q3 2025).

---

## Phase 1A: UGC Foundation (Months 1-3, Q1 2025)

**Goal**: Enable users to post verified interview experiences and build citation tracking infrastructure.

### 1.1 Database Schema (Week 1)

**Tasks**:
- [ ] Create `interview_experiences` table with company, role, difficulty, outcome, questions asked
- [ ] Create `learning_map_citations` table to track which learning maps reference which experiences
- [ ] Create `experience_citations` table for experience-to-experience references
- [ ] Create `user_reputation` table with points, tier, badges
- [ ] Create migration file: `27-interview-intel-ugc.sql`
- [ ] Add indexes for performance (company, role, created_at, citation_count)

**Acceptance Criteria**:
- All tables created with proper foreign key constraints
- Migration runs successfully on fresh database
- Sample data can be inserted and queried

**Files to Create**:
- `shared/database/init/27-interview-intel-ugc.sql`

---

### 1.2 Backend API - Posting Interface (Week 2)

**Tasks**:
- [ ] Create `interviewIntelController.js` with POST /api/interview-intel/experiences
- [ ] Create `interviewIntelService.js` with experience creation logic
- [ ] Add email verification endpoint (verify but don't store email)
- [ ] Create validation schemas for structured posting (company, role, date, difficulty, questions)
- [ ] Add routes to `contentRoutes.js`

**Acceptance Criteria**:
- User can POST interview experience with all required fields
- Email verification sends verification code
- Invalid posts are rejected with clear error messages
- Experiences stored in database with proper user association

**Files to Create**:
- `services/content-service/src/controllers/interviewIntelController.js`
- `services/content-service/src/services/interviewIntelService.js`
- `services/content-service/src/utils/emailVerification.js`

---

### 1.3 Backend API - Browse & Search (Week 2)

**Tasks**:
- [ ] Add GET /api/interview-intel/experiences with filters (company, role, difficulty, date range)
- [ ] Add pagination support (20 experiences per page)
- [ ] Add sorting options (recent, most cited, most helpful)
- [ ] Add search by keywords in questions/feedback text
- [ ] Add GET /api/interview-intel/experiences/:id for individual experience

**Acceptance Criteria**:
- Users can browse all experiences with filters
- Pagination works correctly
- Search returns relevant results
- Individual experience view includes citation count and impact metrics

**Files to Modify**:
- `services/content-service/src/controllers/interviewIntelController.js`
- `services/content-service/src/services/interviewIntelService.js`

---

### 1.4 Frontend - Posting Interface (Week 3-4)

**Tasks**:
- [ ] Create `InterviewIntelPage.vue` as main container
- [ ] Create `ShareExperienceForm.vue` with structured fields:
  - Company (dropdown with autocomplete)
  - Role (text input)
  - Interview Date (date picker)
  - Difficulty (1-5 star rating)
  - Outcome (Offer/Reject/Pending)
  - Questions Asked (multi-line, one per line)
  - Preparation Feedback (rich text)
  - Tips for Others (rich text)
- [ ] Add email verification modal
- [ ] Add success confirmation with preview of posted experience
- [ ] Add to main navigation sidebar

**Acceptance Criteria**:
- Form validates all required fields
- Email verification flow works end-to-end
- Posted experience appears in browse view immediately
- McKinsey clean design (typography-based, professional)

**Files to Create**:
- `vue-frontend/src/pages/InterviewIntelPage.vue`
- `vue-frontend/src/components/InterviewIntel/ShareExperienceForm.vue`
- `vue-frontend/src/components/InterviewIntel/EmailVerificationModal.vue`

---

### 1.5 Frontend - Browse & Search Interface (Week 4-5)

**Tasks**:
- [ ] Create `ExperienceBrowser.vue` with filter sidebar:
  - Company filter (multi-select)
  - Role filter (multi-select)
  - Difficulty filter (1-5 stars)
  - Date range filter
  - Outcome filter (Offer/Reject/Pending)
- [ ] Create `ExperienceCard.vue` to display individual experience:
  - Company, role, date, difficulty, outcome
  - Questions asked (collapsed/expandable)
  - Citation count ("Referenced in X Learning Maps")
  - Upvote count
  - "Use This Experience" button (generates learning map)
- [ ] Create `ExperienceDetailView.vue` for full experience view
- [ ] Add pagination component
- [ ] Add sort dropdown (Recent, Most Cited, Most Helpful)

**Acceptance Criteria**:
- Users can filter experiences by all criteria
- Experience cards display all key information
- "Use This Experience" button triggers learning map generation
- Detail view shows full content with citation tracking
- Professional, clean design matching existing UI

**Files to Create**:
- `vue-frontend/src/components/InterviewIntel/ExperienceBrowser.vue`
- `vue-frontend/src/components/InterviewIntel/ExperienceCard.vue`
- `vue-frontend/src/components/InterviewIntel/ExperienceDetailView.vue`

---

### 1.6 Citation Tracking Integration (Week 5-6)

**Tasks**:
- [ ] Modify `learningMapGeneratorService.js` to track source experience_id
- [ ] Add `source_experience_id` column to `learning_maps` table
- [ ] Update citation count when learning map is generated from experience
- [ ] Create API endpoint GET /api/interview-intel/experiences/:id/citations
- [ ] Display "Referenced in X Learning Maps" on experience cards
- [ ] Display list of citing learning maps on experience detail page

**Acceptance Criteria**:
- When learning map is generated from experience, citation is tracked
- Citation count updates automatically
- Users can see which learning maps referenced an experience
- Citation count displayed prominently on experience cards

**Files to Modify**:
- `services/content-service/src/services/learningMapGeneratorService.js`
- `shared/database/init/28-add-citation-tracking.sql`
- `services/content-service/src/controllers/interviewIntelController.js`

---

### 1.7 Basic Reputation System (Week 6-7)

**Tasks**:
- [ ] Create `reputationService.js` with point calculation logic:
  - +10 points: Post verified experience
  - +5 points: Experience cited in learning map
  - +1 point: Experience upvoted
  - +2 points: Helpful feedback on your experience
- [ ] Add reputation points to user profile
- [ ] Display reputation tier badges (New Contributor, Regular, Veteran, Expert, Legend)
- [ ] Create leaderboard view (top contributors this month/all time)
- [ ] Add reputation points display to experience cards (author reputation)

**Acceptance Criteria**:
- Points accumulate correctly based on actions
- Tier badges display based on point thresholds
- Leaderboard shows top contributors
- High-reputation authors have visual indicator

**Files to Create**:
- `services/content-service/src/services/reputationService.js`
- `vue-frontend/src/components/InterviewIntel/LeaderboardView.vue`
- `vue-frontend/src/components/InterviewIntel/ReputationBadge.vue`

---

### 1.8 Testing & Polish (Week 7-8)

**Tasks**:
- [ ] Write integration tests for posting flow
- [ ] Write tests for citation tracking
- [ ] Write tests for reputation calculation
- [ ] Performance testing (pagination, search with 1000+ experiences)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] UX polish (loading states, error messages, empty states)
- [ ] Mobile responsive design

**Acceptance Criteria**:
- All critical paths have integration tests
- Page loads under 2 seconds with 1000+ experiences
- No security vulnerabilities
- Professional UX on mobile and desktop

---

## Phase 1B: Enhanced Features (Months 2-3)

### 1.9 Advanced Search & Filters (Week 9)

**Tasks**:
- [ ] Add full-text search on questions and feedback
- [ ] Add "Similar Experiences" recommendation
- [ ] Add saved searches/bookmarks
- [ ] Add email alerts for new experiences matching saved filters

### 1.10 Rich Content Support (Week 10)

**Tasks**:
- [ ] Support markdown formatting in feedback
- [ ] Support code snippets in questions
- [ ] Support links to LeetCode problems mentioned
- [ ] Support images (whiteboard photos, offer letters with PII redacted)

### 1.11 Social Features (Week 11-12)

**Tasks**:
- [ ] Upvote/downvote system
- [ ] Comment threads on experiences
- [ ] Follow specific companies/roles
- [ ] Share experience to external platforms (Twitter, LinkedIn)

---

## Phase 2: Community Growth (Q2 2025, Months 4-6)

### 2.1 Moderation System (Week 13-14)

**Tasks**:
- [ ] AI-powered spam detection (OpenAI Moderation API)
- [ ] Community flagging system
- [ ] Human moderator dashboard
- [ ] Automated removal of low-quality posts
- [ ] Appeal process for removed content

### 2.2 User Profiles & Impact Metrics (Week 15-16)

**Tasks**:
- [ ] User profile pages with:
  - Total experiences posted
  - Total citation count
  - Total people helped (sum of all citations)
  - Reputation tier and badges
  - Top contributed companies/roles
- [ ] "Helped X Job Seekers" metric (citation count)
- [ ] "Average Helpfulness Rating" (upvote ratio)

### 2.3 Badge System (Week 17-18)

**Tasks**:
- [ ] Company-specific badges (Google Expert, Meta Veteran)
- [ ] Milestone badges (First Post, 10 Citations, 100 People Helped)
- [ ] Special badges (Early Adopter, Top Contributor, Community Moderator)
- [ ] Badge showcase on profile

### 2.4 Recommendation Engine (Week 19-20)

**Tasks**:
- [ ] "Recommended for You" based on user's target company/role
- [ ] "Similar to experiences you viewed"
- [ ] Email digest: "Top experiences this week in your tracked companies"

### 2.5 Analytics Dashboard (Week 21-24)

**Tasks**:
- [ ] For users: "Your Impact" dashboard (citations, views, upvotes over time)
- [ ] For platform: Growth metrics (new experiences per week, citation growth, user engagement)
- [ ] Company trends: Which companies have most experiences posted

---

## Phase 3: Gamification Layer (Q3 2025, Months 7-9)

### 3.1 Progress Tracking on Learning Maps (Week 25-26)

**Tasks**:
- [ ] Add completion checkboxes to learning map problems
- [ ] Calculate week progress percentage
- [ ] Calculate total hours spent based on completed problems
- [ ] "Mark Week Complete" button triggers backend update
- [ ] Progress persists across sessions

### 3.2 Streak System (Week 27-28)

**Tasks**:
- [ ] Daily check-in for studying
- [ ] Streak counter ("7 day streak!")
- [ ] Streak recovery (1 freeze per week)
- [ ] Streak leaderboard
- [ ] Push notifications for streak maintenance

### 3.3 Interview Readiness Score (Week 29-30)

**Tasks**:
- [ ] Calculate readiness based on:
  - Learning map completion percentage
  - Problem difficulty distribution (Easy/Medium/Hard ratio)
  - Interview experiences posted (shows you've been through the process)
  - Reputation points (community trust)
  - Recency (studied in last 7 days vs 30 days ago)
- [ ] Display as 0-100 score with breakdown
- [ ] "Ready to Apply" threshold (80+)

### 3.4 Completion Rewards (Week 31-32)

**Tasks**:
- [ ] Week completion rewards (badges, points)
- [ ] Full curriculum completion certificate
- [ ] Special badges for hard problems completed
- [ ] "Interview Ready" badge when score hits 80+

### 3.5 Optional Verification (Week 33-36)

**Tasks**:
- [ ] LeetCode unofficial API integration (risky, may break)
- [ ] Company email verification for offer claims
- [ ] LinkedIn integration for role verification
- [ ] "Verified" badge on profile

---

## Technical Architecture Decisions

### Database
- PostgreSQL with pgvector (already set up)
- Citation tracking uses junction tables
- Reputation calculated in real-time (not cached initially)
- Indexes on frequently queried columns (company, role, created_at, citation_count)

### Backend
- Express.js (existing stack)
- Email verification: SendGrid or AWS SES
- AI moderation: OpenAI Moderation API
- File uploads (images): AWS S3 or Cloudinary

### Frontend
- Vue 3 Composition API + TypeScript (existing stack)
- McKinsey clean design (typography-based, professional)
- Mobile-first responsive design
- Optimistic UI updates for better UX

### Security
- Email verification (Blind model: verify but don't store)
- Rate limiting on POST endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize user input)
- CSRF tokens for state-changing operations

---

## Success Metrics

### Phase 1 (Q1 2025)
- **Goal**: 100 interview experiences posted
- **Metric**: 500 learning maps generated from user experiences
- **Metric**: 50 active contributors (posted at least 1 experience)

### Phase 2 (Q2 2025)
- **Goal**: 500 interview experiences posted
- **Metric**: Average citation count of 3+ per experience
- **Metric**: 200 active contributors

### Phase 3 (Q3 2025)
- **Goal**: 1000 interview experiences posted
- **Metric**: 60% of users complete at least 1 week of learning map
- **Metric**: Average Interview Readiness Score of 70+ for active users

---

## Competitive Differentiation

| Feature | Blind | Glassdoor | Fishbowl | Interview Intel |
|---------|-------|-----------|----------|-----------------|
| Interview Experiences | ✓ | ✓ | ✓ | ✓ |
| Citation Tracking | ✗ | ✗ | ✗ | **✓** |
| Learning Map Generation | ✗ | ✗ | ✗ | **✓** |
| Reputation System | ✗ | Limited | ✗ | **✓** |
| "Helped X People" Metric | ✗ | ✗ | ✗ | **✓** |
| Interview Readiness Score | ✗ | ✗ | ✗ | **✓** |
| Email Verification | ✓ | ✗ | ✓ | **✓** |

**Key Innovation**: Academic-style citation tracking creates social proof and network effects that competitors lack.

---

## Risk Mitigation

### Risk: Low initial posting volume
- **Mitigation**: Seed database with 50 curated experiences from public sources (Reddit r/cscareerquestions)
- **Mitigation**: Early adopter badges and special recognition
- **Mitigation**: Email outreach to existing user base

### Risk: Spam and low-quality posts
- **Mitigation**: Email verification as barrier to entry
- **Mitigation**: AI-powered moderation (OpenAI Moderation API)
- **Mitigation**: Community flagging system

### Risk: Privacy concerns (exposing company/interview details)
- **Mitigation**: Clear privacy policy: "Don't post NDA-protected information"
- **Mitigation**: Remove specific names/dates if legally required
- **Mitigation**: Company email verification optional (for extra credibility)

### Risk: LeetCode API breaking (for verification)
- **Mitigation**: Make verification OPTIONAL, not required
- **Mitigation**: Trust-based system as primary mechanism
- **Mitigation**: Community validation as backup

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1A: UGC Foundation | Weeks 1-8 | Posting, browse, citation tracking, basic reputation |
| 1B: Enhanced Features | Weeks 9-12 | Advanced search, rich content, social features |
| 2: Community Growth | Weeks 13-24 | Moderation, profiles, badges, recommendations |
| 3: Gamification | Weeks 25-36 | Progress tracking, streaks, readiness score, rewards |

**Total Timeline**: 9 months (Q1-Q3 2025)

---

## Next Immediate Steps

1. Create database migration `27-interview-intel-ugc.sql`
2. Implement backend API controllers and services
3. Build Vue frontend components
4. Integrate citation tracking with learning map generation
5. Deploy and test with initial seed data
