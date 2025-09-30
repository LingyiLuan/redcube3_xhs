PHASE 2: Multi-Post Analysis & Autonomous Intelligence Foundation (4-Hour Sprint)

ULTIMATE VISION: Autonomous Job Hunt Intelligence Platform
Building on existing XHS content analysis MVP towards a proactive career intelligence system that:
- Analyzes users' saved posts about job interviews/career experiences
- Extracts insights: companies, roles, interview types, preparation materials  
- Finds connections between posts (same company, similar experiences)
- Generates personalized learning maps and study recommendations
- Provides real-time analysis with progressive result streaming
- Evolves into autonomous data collection, trend detection, and proactive user briefings

IMMEDIATE OBJECTIVES (4-Hour Development):

**HOUR 1: DeepSeek API Migration & Multi-Post Analysis**
- Replace OpenAI with DeepSeek API integration in content-service
- Update analysis prompts for DeepSeek's request format and capabilities
- Create POST /api/content/analyze/batch endpoint
- Accept array of XHS posts, analyze relationships between them
- Enhanced prompts: identify shared companies, overlapping interview topics, timeline patterns
- Return: individual analysis + connection insights between posts

**HOUR 2: Post Relationship Detection Engine**
- Algorithm: Compare posts for company matches, similar roles, topic overlap
- Database: Create analysis_connections table linking related posts
- API endpoint: GET /api/content/connections/{analysis_id}
- Store relationships with connection types and confidence scores
- Return connection network data for future visualization

**HOUR 3: Trend Analysis Foundation**
- Create analytics service: GET /api/content/trends
- Analyze historical analysis_results for emerging patterns:
  - Company mention frequency over time
  - Interview topic evolution
  - Sentiment trends by company/role
- Foundation for autonomous trend detection and user briefings
- Return structured trend data for dashboard display

**HOUR 4: Enhanced Frontend Integration**
- Extend React UI: Multi-post upload/selection interface
- Simple drag-drop functionality using react-beautiful-dnd
- Display connection results between analyzed posts
- Basic trend visualization showing company/topic frequency
- Maintain current card-based design with connection indicators

DATABASE SCHEMA ADDITIONS:
```sql
CREATE TABLE analysis_connections (
  id SERIAL PRIMARY KEY,
  post1_id INTEGER REFERENCES analysis_results(id),
  post2_id INTEGER REFERENCES analysis_results(id),
  connection_type VARCHAR(50), -- 'same_company', 'similar_role', 'topic_overlap'
  strength DECIMAL(3,2), -- 0.0 to 1.0 confidence score
  insights TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  target_role VARCHAR(200),
  target_companies TEXT[],
  timeline_months INTEGER,
  focus_areas TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_connections_posts ON analysis_connections(post1_id, post2_id);
CREATE INDEX idx_connections_type ON analysis_connections(connection_type);


TECHNICAL REQUIREMENTS:

DeepSeek API integration (cost-effective alternative to OpenAI)
Design APIs for future autonomous workflow capabilities
Focus on data relationships enabling trend detection and learning path generation
Maintain existing monitoring stack (Prometheus/Grafana metrics)
Keep UI functional but simple - complex visualizations in later phases

API DESIGN FOR AUTONOMOUS FEATURES:

Batch analysis supports future automated post processing
Connection detection enables autonomous relationship mapping
Trend analysis foundation for proactive user briefings
User goals structure supports personalized autonomous recommendations

SUCCESS CRITERIA:

Users can analyze multiple XHS posts together
System identifies and stores connections between career experiences
Basic trend detection from historical data works effectively
DeepSeek integration maintains analysis quality while reducing costs
Database foundation ready for autonomous data collection and processing
Frontend demonstrates post relationship concepts through simple interactions

FUTURE AGENTIC ROADMAP (Post-4-Hour Foundation):

Autonomous XHS data scraping and filtering
Proactive trend detection and user briefing generation
Self-updating learning path recommendations based on detected trends
24/7 career intelligence monitoring and alerts

START WITH: DeepSeek API integration and multi-post batch analysis endpoint. Ensure existing single-post analysis continues working while building towards autonomous intelligence capabilities.