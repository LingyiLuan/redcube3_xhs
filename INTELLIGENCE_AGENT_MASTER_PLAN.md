# Intelligence Agent & Automation Service - Master Plan
**Real-Time Interview Intelligence with Automated Insights Delivery**

**Author:** AI Analysis System
**Date:** 2025-11-17
**Status:** Strategic Design Phase

---

## Vision Statement

Transform from a **static analysis tool** to an **intelligent automation platform** that:
- Monitors interview trends in real-time
- Detects industry shifts automatically
- Delivers personalized insights to users via email
- Provides temporal analysis (2024 vs 2025 trends)
- Operates 100% free using existing infrastructure

**Core Philosophy:** "The market is chasing automation - we deliver actionable intelligence automatically"

---

## 1. Strategic Analysis: Why This Matters

### 1.1 Current Limitation: Static Snapshots

**Problem:** Users upload 4 posts → Get analysis → Data becomes stale immediately

**Example:**
- User uploads Google posts from January 2024
- Analysis shows: "System design is asked 45% of the time"
- **But:** By October 2024, Google shifted to asking more ML/AI questions
- **User doesn't know** this critical shift happened

### 1.2 Intelligence Gap: Missing Temporal Context

**What Users REALLY Want to Know:**

1. **Trend Analysis:**
   - "Google asked system design 60% in 2024 Q1"
   - "Google now asks ML/AI 40% in 2024 Q4"
   - **Insight:** "Google is hiring for ML roles - prepare AI topics"

2. **Industry Shift Detection:**
   - "Backend roles in 2024: 80% asked SQL, 20% asked NoSQL"
   - "Backend roles in 2025: 50% asked SQL, 50% asked NoSQL"
   - **Insight:** "Industry shifting to NoSQL - learn MongoDB/DynamoDB"

3. **Emerging Question Detection:**
   - "Design a recommendation system" appeared 0 times in 2024
   - "Design a recommendation system" appeared 15 times in Jan-Feb 2025
   - **Insight:** "NEW TREND: Recommendation systems now critical for SWE roles"

4. **Company-Specific Changes:**
   - Meta 2024: "React" in 70% of interviews
   - Meta 2025: "Next.js" in 50% of interviews
   - **Insight:** "Meta is modernizing tech stack - learn Next.js"

### 1.3 The Automation Opportunity

**User Journey (Current - Manual):**
1. User uploads posts → Gets analysis
2. Time passes (weeks/months)
3. User manually uploads new posts → Gets new analysis
4. User manually compares reports to find trends
5. **Insight:** Delayed, manual, often missed

**User Journey (Automated - Vision):**
1. User sets preferences: "Notify me about Google SWE L5 interviews"
2. System monitors Reddit 24/7 for new Google L5 posts
3. System finds 4 new posts → Analyzes automatically
4. System detects: "Google now asking LLM design questions (NEW TREND)"
5. System emails user: "🚨 New Trend Alert: Google L5 interviews now include LLM system design"
6. **Insight:** Real-time, automated, actionable

---

## 2. Intelligence Agent Architecture

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE AGENT SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Data Ingestion  │  Continuous monitoring of Reddit/forums
│     Agent        │  - Scrapes new posts every 6 hours
└────────┬─────────┘  - Filters by relevance (is_relevant = true)
         │            - Extracts metadata (company, role, date)
         ↓
┌──────────────────┐
│  Temporal Store  │  Time-series database for trend analysis
│   (PostgreSQL)   │  - Posts indexed by scraped_at timestamp
└────────┬─────────┘  - Partitioned by year/month for fast queries
         │            - Stores: company, role, questions, date
         ↓
┌──────────────────┐
│  Trend Analyzer  │  Detects shifts in interview patterns
│     Agent        │  - Compares 2024 vs 2025 question frequency
└────────┬─────────┘  - Identifies emerging topics (0% → 15%)
         │            - Tracks company-specific changes
         ↓
┌──────────────────┐
│ User Preference  │  Stores user interests & notification settings
│     Store        │  - Table: user_intelligence_subscriptions
└────────┬─────────┘  - Fields: user_id, companies[], roles[], notify_email
         │
         ↓
┌──────────────────┐
│  Matching Agent  │  Matches new insights to user preferences
│                  │  - Finds users interested in "Google SWE L5"
└────────┬─────────┘  - Filters by severity (only significant trends)
         │            - Deduplicates (don't spam same insight)
         ↓
┌──────────────────┐
│ Insight Generator│  Creates human-readable intelligence reports
│     Agent        │  - "Google now asking X (up 40% from 2024)"
└────────┬─────────┘  - "Emerging trend: Y mentioned 15 times this month"
         │            - "Industry shift: Z adoption increased 2x"
         ↓
┌──────────────────┐
│  Email Delivery  │  Sends insights to users (FREE - no SendGrid)
│     Agent        │  - Uses Node.js nodemailer + Gmail SMTP
└──────────────────┘  - Batches emails (max 500/day to avoid spam)
                      - Unsubscribe link included
```

### 2.2 Database Schema

**New Tables:**

```sql
-- User intelligence subscriptions
CREATE TABLE user_intelligence_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Subscription preferences
  companies TEXT[] DEFAULT '{}',              -- ['Google', 'Meta', 'Amazon']
  roles TEXT[] DEFAULT '{}',                  -- ['SWE', 'Senior SWE', 'Staff SWE']
  levels TEXT[] DEFAULT '{}',                 -- ['L4', 'L5', 'L6']

  -- Notification settings
  notify_email VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) DEFAULT 'weekly',     -- 'realtime', 'daily', 'weekly'
  min_posts_threshold INTEGER DEFAULT 4,      -- Only notify if >= 4 new posts

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Temporal trends cache (for fast lookups)
CREATE TABLE interview_trends (
  id SERIAL PRIMARY KEY,

  -- Dimensions
  company VARCHAR(255),
  role VARCHAR(255),
  level VARCHAR(50),
  time_period VARCHAR(20),                    -- '2024-Q1', '2025-Q1', '2025-02'

  -- Metrics
  question_frequency JSONB,                   -- {"System Design": 45, "Algorithms": 30}
  skill_frequency JSONB,                      -- {"React": 60, "Python": 80}
  avg_difficulty DECIMAL(3,1),
  success_rate DECIMAL(5,2),
  total_posts INTEGER,

  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(company, role, level, time_period)
);

-- Trend alerts (what we've already sent to users)
CREATE TABLE trend_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),

  -- Alert content
  alert_type VARCHAR(50),                     -- 'emerging_question', 'industry_shift', 'company_change'
  company VARCHAR(255),
  role VARCHAR(255),
  trend_description TEXT,

  -- Evidence
  posts_analyzed INTEGER,
  time_period_compared VARCHAR(100),          -- '2024-Q4 vs 2025-Q1'
  confidence_score DECIMAL(3,2),              -- 0.0 to 1.0

  -- Delivery
  sent_at TIMESTAMP DEFAULT NOW(),
  email_status VARCHAR(50) DEFAULT 'sent'
);

-- Create indexes for fast temporal queries
CREATE INDEX idx_scraped_posts_temporal
ON scraped_posts(company, role, scraped_at DESC, is_relevant)
WHERE is_relevant = true;

CREATE INDEX idx_trends_period
ON interview_trends(time_period, company, role);
```

---

## 3. Intelligence Features

### 3.1 Feature 1: Temporal Trend Analysis

**User Question:** "How have Google interviews changed from 2024 to 2025?"

**System Response:**

```javascript
{
  company: "Google",
  role: "Senior SWE",
  comparison: "2024 vs 2025-Q1",

  changes: [
    {
      metric: "question_topics",
      2024: { "System Design": 45, "Algorithms": 35, "Behavioral": 20 },
      2025: { "ML/AI Design": 30, "System Design": 35, "LLM Integration": 20, "Algorithms": 15 },
      insight: "Google is shifting focus to ML/AI - 30% of interviews now include ML system design (up from 0% in 2024)",
      severity: "high"
    },
    {
      metric: "difficulty",
      2024: 4.2,
      2025: 4.6,
      insight: "Interviews became 10% harder in 2025",
      severity: "medium"
    }
  ],

  emerging_questions: [
    {
      question: "Design a recommendation system using LLMs",
      frequency_2024: 0,
      frequency_2025: 12,
      insight: "NEW: This question appeared 12 times in Jan-Feb 2025 (never asked in 2024)",
      action: "Learn: RAG architectures, vector databases, LLM APIs"
    }
  ],

  declining_questions: [
    {
      question: "Implement a hash table",
      frequency_2024: 25,
      frequency_2025: 5,
      insight: "This question declining - focus on higher-level design instead"
    }
  ]
}
```

### 3.2 Feature 2: Industry Shift Detection

**Detection Logic:**

```javascript
/**
 * Detect industry-wide shifts by comparing time periods
 */
async function detectIndustryShifts(role = 'SWE', comparison = '2024 vs 2025') {
  // Get all posts for this role in both periods
  const posts2024 = await getPostsByPeriod(role, '2024');
  const posts2025 = await getPostsByPeriod(role, '2025-Q1');

  // Extract skill frequency
  const skills2024 = extractSkillFrequency(posts2024);
  const skills2025 = extractSkillFrequency(posts2025);

  // Calculate changes
  const shifts = [];

  for (const skill of Object.keys(skills2025)) {
    const freq2024 = skills2024[skill] || 0;
    const freq2025 = skills2025[skill];
    const change = ((freq2025 - freq2024) / freq2024 * 100).toFixed(1);

    // Significant shift: >50% change AND appeared in 10+ posts
    if (Math.abs(change) > 50 && freq2025 >= 10) {
      shifts.push({
        skill,
        frequency_2024: freq2024,
        frequency_2025: freq2025,
        change_percent: change,
        insight: generateShiftInsight(skill, change, freq2025),
        severity: Math.abs(change) > 100 ? 'critical' : 'high'
      });
    }
  }

  return {
    role,
    time_comparison: comparison,
    shifts: shifts.sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent)),
    total_posts_analyzed: { 2024: posts2024.length, 2025: posts2025.length }
  };
}

/**
 * Generate human-readable insight
 */
function generateShiftInsight(skill, changePercent, frequency) {
  if (changePercent > 100) {
    return `${skill} demand DOUBLED in 2025 (now ${frequency}% of interviews) - critical to learn`;
  } else if (changePercent > 50) {
    return `${skill} demand increased ${changePercent}% - trending upward`;
  } else if (changePercent < -50) {
    return `${skill} demand dropped ${Math.abs(changePercent)}% - deprioritize in prep`;
  }
}
```

**Example Output:**

```json
{
  "role": "Backend Engineer",
  "time_comparison": "2024 vs 2025-Q1",
  "shifts": [
    {
      "skill": "NoSQL Databases",
      "frequency_2024": 20,
      "frequency_2025": 55,
      "change_percent": "+175%",
      "insight": "NoSQL Databases demand nearly TRIPLED in 2025 (now 55% of interviews) - critical to learn",
      "severity": "critical",
      "action": "Learn MongoDB, DynamoDB, Cassandra"
    },
    {
      "skill": "GraphQL",
      "frequency_2024": 15,
      "frequency_2025": 38,
      "change_percent": "+153%",
      "insight": "GraphQL demand more than DOUBLED - critical to learn",
      "severity": "critical"
    },
    {
      "skill": "Microservices",
      "frequency_2024": 45,
      "frequency_2025": 28,
      "change_percent": "-38%",
      "insight": "Microservices questions declining - industry consolidating to monoliths",
      "severity": "medium"
    }
  ]
}
```

### 3.3 Feature 3: Automated Intelligence Delivery

**Trigger:** System finds 4+ new relevant posts matching user preferences

**Process:**

1. **Daily Scraper** finds 4 new Google SWE L5 posts
2. **Analyzer** runs batch analysis on these 4 posts
3. **Trend Detector** compares to historical data
4. **Insight Generator** creates summary:

```
Subject: 🚨 New Google L5 Interview Intelligence (4 new posts analyzed)

Hi [User Name],

We analyzed 4 new Google L5 Software Engineer interviews from the past week
and discovered significant changes:

🔴 CRITICAL TREND ALERT

1. ML System Design Questions Surging
   - 3 out of 4 interviews included "Design an ML recommendation system"
   - This question appeared 0 times in all of 2024
   - This represents a 300% increase in ML-focused questions

   ✅ Action: Learn RAG architectures, vector databases, LLM fine-tuning

2. LeetCode Hard Questions Increasing
   - Average difficulty: 4.8/5 (up from 4.2 in 2024)
   - 75% of coding rounds included at least one Hard problem

   ✅ Action: Practice LeetCode Hard: #72, #124, #297

📊 SKILL SHIFT DETECTED

- "Distributed Tracing" mentioned in 50% of interviews (up from 10% in 2024)
- "React" dropped to 25% (down from 60% in 2024)

Based on 638 historical Google interviews analyzed.

View full analysis: [Link to comprehensive report]
Unsubscribe: [Link]

---
Powered by RedCube Intelligence Agent
Generated from 4 real Reddit interview posts (2025-02-14 to 2025-02-21)
```

---

## 4. Zero-Cost Email Infrastructure

### 4.1 Free Email Options

**Option 1: Gmail SMTP (FREE - 500 emails/day)**

```javascript
const nodemailer = require('nodemailer');

// Use Gmail SMTP for free (500 emails/day limit)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,      // redcube.intelligence@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD  // App-specific password
  }
});

async function sendIntelligenceEmail(user, insights) {
  const mailOptions = {
    from: '"RedCube Intelligence" <redcube.intelligence@gmail.com>',
    to: user.email,
    subject: `🚨 New ${insights.company} ${insights.role} Interview Intelligence`,
    html: generateEmailHTML(insights),
    text: generateEmailText(insights)
  };

  await transporter.sendMail(mailOptions);
}
```

**Cost:** $0/month (up to 500 emails/day)

**Option 2: Resend.com (FREE - 3,000 emails/month)**

```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Free tier: 3,000 emails/month
const { data, error } = await resend.emails.send({
  from: 'RedCube Intelligence <intelligence@redcube.app>',
  to: user.email,
  subject: 'New Interview Intelligence',
  html: emailHTML
});
```

**Cost:** $0/month (up to 3,000 emails/month)

**Recommendation:** Start with **Gmail SMTP** (500/day = 15,000/month) - completely free

### 4.2 Email Batching Strategy

```javascript
/**
 * Batch emails to avoid spam and stay under free limits
 */
async function sendBatchedIntelligence() {
  // Get all users with pending notifications
  const pendingNotifications = await pool.query(`
    SELECT DISTINCT u.id, u.email, s.companies, s.roles
    FROM user_intelligence_subscriptions s
    JOIN users u ON s.user_id = u.id
    WHERE s.is_active = true
      AND s.notify_email IS NOT NULL
      AND (s.last_notified_at IS NULL
           OR s.last_notified_at < NOW() - INTERVAL '1 day')
    LIMIT 400  -- Stay under 500/day Gmail limit
  `);

  for (const user of pendingNotifications.rows) {
    // Find insights matching user preferences
    const insights = await findMatchingInsights(user);

    if (insights.length > 0) {
      await sendIntelligenceEmail(user, insights);

      // Update last_notified_at
      await pool.query(`
        UPDATE user_intelligence_subscriptions
        SET last_notified_at = NOW()
        WHERE user_id = $1
      `, [user.id]);

      // Rate limit: 1 email per second (avoid spam detection)
      await sleep(1000);
    }
  }
}
```

---

## 5. Automation Agent Service

### 5.1 Service Name: **"RedCube Intelligence Agent"**

**Tagline:** "Your AI-powered interview intelligence assistant - delivers insights while you sleep"

### 5.2 Agent Capabilities

| Capability | Description | Frequency |
|------------|-------------|-----------|
| **Monitor** | Scrapes Reddit/forums for new posts | Every 6 hours |
| **Analyze** | Runs batch analysis on new posts | When 4+ new posts found |
| **Detect Trends** | Compares current vs historical data | Daily |
| **Match Users** | Finds users interested in trends | Daily |
| **Generate Insights** | Creates human-readable intelligence | Real-time |
| **Deliver Email** | Sends personalized alerts | Daily batch |

### 5.3 Architecture

```
services/
├── intelligence-agent/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── monitorAgent.js          # Scrapes new posts
│   │   │   ├── analyzeScraper Agent.js          # Runs analysis on new posts
│   │   │   ├── trendDetectorAgent.js    # Detects shifts
│   │   │   ├── matcherAgent.js          # Matches users to insights
│   │   │   └── emailAgent.js            # Sends emails
│   │   ├── services/
│   │   │   ├── temporalAnalysisService.js
│   │   │   ├── trendCalculationService.js
│   │   │   ├── insightGenerationService.js
│   │   │   └── emailTemplateService.js
│   │   ├── database/
│   │   │   ├── subscriptionQueries.js
│   │   │   ├── trendsQueries.js
│   │   │   └── alertsQueries.js
│   │   ├── scheduler/
│   │   │   └── cronJobs.js              # Runs agents on schedule
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml (add intelligence-agent service)
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Tasks:**
1. Create database tables (subscriptions, trends, alerts)
2. Build temporal analysis service
3. Create trend detection algorithms
4. Test on historical data (2024 vs 2025)

**Deliverables:**
- SQL migrations
- `temporalAnalysisService.js`
- `trendDetectorAgent.js`
- Test results showing 2024 vs 2025 trends

### Phase 2: Automation (Week 2)

**Tasks:**
1. Build monitoring agent (scrapes new posts)
2. Create auto-analysis pipeline
3. Implement user matching logic
4. Setup email infrastructure (Gmail SMTP)

**Deliverables:**
- `monitorAgent.js`
- `emailAgent.js`
- Cron scheduler
- Test email delivery

### Phase 3: Intelligence Generation (Week 3)

**Tasks:**
1. Build insight generation service
2. Create email templates
3. Implement batching/rate limiting
4. Add unsubscribe functionality

**Deliverables:**
- `insightGenerationService.js`
- Email HTML templates
- Unsubscribe endpoint

### Phase 4: User Interface (Week 4)

**Tasks:**
1. Build subscription management UI
2. Add "Subscribe to Intelligence" button
3. Create intelligence history view
4. Show trend charts on frontend

**Deliverables:**
- Subscription settings page
- Intelligence dashboard
- Trend visualization charts

---

## 7. Advanced Features (Future)

1. **Slack/Discord Integration** - Send insights to workspace channels
2. **AI-Powered Recommendations** - "Based on trends, you should learn X"
3. **Competitive Intelligence** - "Your preparation vs market average"
4. **Interview Timing Predictions** - "Google hiring surge detected - apply now"
5. **Custom Alerts** - "Notify me if Google L5 success rate drops below 60%"
6. **API Access** - Let users programmatically query trends

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Email delivery rate | >95% | Nodemailer success rate |
| User engagement | >40% open rate | Track email opens |
| Trend accuracy | >80% | User feedback on insights |
| Automation coverage | 100% | All new posts auto-analyzed |
| Cost | $0/month | Stay under free tier limits |

---

## Next: Update Learning Map Plan

Now let's update the Learning Map plan to integrate temporal trends...

**END OF INTELLIGENCE AGENT PLAN**
