# MVP Instructions
4-HOUR XHS CONTENT ANALYSIS MVP - Build on Existing Infrastructure

**ULTIMATE VISION** (for smart architecture decisions):
Build an intelligent XHS content aggregation platform that:
- Analyzes users' saved posts about job interviews/career experiences
- Extracts insights: companies, roles, interview types, preparation materials
- Finds connections between posts (same company, similar experiences) 
- Generates personalized learning maps and study recommendations
- Provides real-time analysis with progressive result streaming
- Scales to handle thousands of posts and complex NLP processing

**4-HOUR MVP SCOPE** (prove core concept):
Single workflow: XHS post text → OpenAI analysis → structured insights display

**EXISTING ASSETS TO KEEP**:
- docker-compose.yml with all services, postgres, redis, nginx, monitoring
- nginx.conf routing configuration  
- All service folder structures and Dockerfiles
- Prometheus/Grafana monitoring stack

**HOUR 1 - Refactor content-service**:
1. Modify services/content-service/package.json: Add "openai" dependency
2. Rewrite services/content-service/src/index.js:
   - Add POST /api/content/analyze endpoint
   - Integrate OpenAI API to extract: company, role, sentiment, interview_topics
   - Design data structures with future features in mind (connections, learning paths)
   - Input: {text: "XHS post content"}
   - Output: {company: "ByteDance", role: "SWE", sentiment: "positive", topics: ["algorithms", "system design"]}

**HOUR 2 - Database Schema** (design for scalability):
1. Update shared/database/init/01-create-databases.sql: Add analysis_results table
2. Schema: id, original_text, company, role, sentiment, topics, user_id, created_at
3. Consider future tables: post_connections, learning_paths, user_preferences
4. Test OpenAI API integration with sample XHS posts

**HOUR 3 - Simple Frontend**:
1. Create basic React app calling http://localhost:8080/api/content/analyze
2. Design UI components that can later support real-time streaming
3. Single page: textarea → submit → display insights

**HOUR 4 - End-to-End Testing**:
1. docker-compose up and test complete flow
2. Verify monitoring captures OpenAI API performance
3. Document next steps for scaling phase

**START WITH**: Modifying content-service for OpenAI integration, keeping future scalability in mind.