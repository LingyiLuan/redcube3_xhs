# RedCube XHS - Autonomous Job Hunt Intelligence Platform

🚀 **Phase 2 Complete**: Multi-Post Analysis & Autonomous Intelligence Foundation

An intelligent microservices platform for analyzing XHS (小红书) posts about job interviews and career experiences using OpenRouter AI with autonomous trend detection and relationship mapping.

## 🎯 Current Features (Phase 2 Complete)

### ✅ **Intelligent Content Analysis**
- **OpenRouter AI Integration**: Model fallback cascade (moonshot → deepseek → gpt-3.5-turbo)
- **Single Post Analysis**: Company, role, sentiment, interview topics, key insights
- **Batch Post Analysis**: Multi-post processing with relationship detection
- **Robust JSON Parsing**: Handles special tokens, markdown, and AI response variations

### ✅ **Post Relationship Detection**
- **Connection Algorithm**: Identifies same company, similar roles, topic overlap, career progression
- **Strength Scoring**: 0.0-1.0 confidence scores for relationship strength
- **Connection Types**: same_company, similar_role, topic_overlap, career_progression, same_industry
- **Insights Generation**: Automated insights about post relationships

### ✅ **Trend Analysis & Market Signals**
- **Historical Trend Analysis**: Company mention frequency, topic evolution, sentiment trends
- **Market Signal Detection**: Hiring activity patterns, skill emergence, pattern density
- **Actionable Recommendations**: Personalized recommendations based on trend data
- **Time-based Analytics**: 7d, 30d, 90d, 180d, 1y analysis windows

### ✅ **Enhanced Frontend Interface**
- **Multi-Post Upload**: Drag-and-drop interface for batch analysis
- **Connection Visualization**: Visual display of post relationships and insights
- **Trend Dashboard**: Comprehensive trend analysis with charts and recommendations
- **Real-time Results**: Live analysis results with connection indicators

### ✅ **Database Foundation for Autonomy**
- **Analysis Results**: Comprehensive storage of all analysis data
- **Connection Mapping**: analysis_connections table with relationship data
- **User Goals**: user_goals table for personalized autonomous intelligence
- **Performance Optimized**: Proper indexing for complex queries

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenRouter API key
- Node.js 18+ (for local development)

### Setup and Run

1. **Clone and navigate to the project:**
   ```bash
   cd redcube3_xhs
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenRouter API key:
   # OPENROUTER_API_KEY=your-openrouter-api-key-here
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3002
   - **API Gateway**: http://localhost:8080
   - **Grafana Monitoring**: http://localhost:3000 (admin/admin)
   - **Prometheus**: http://localhost:9090

### Test the Phase 2 Features

1. **Single Analysis**: Open http://localhost:3002 and analyze individual posts
2. **Batch Analysis**: Use the "批量分析" tab to upload multiple posts
3. **View Connections**: See relationship detection between posts
4. **Trend Analysis**: Visit the "趋势分析" tab for market insights

## 🏗️ Architecture

### Microservices
- **frontend**: React app with multi-post analysis and trend visualization
- **api-gateway**: Nginx reverse proxy routing requests to services
- **content-service**: OpenRouter-powered analysis with relationship detection
- **user-service**: User management and goals tracking
- **interview-service**: Interview session management
- **notification-service**: Real-time notifications

### Infrastructure
- **PostgreSQL**: Primary database with analysis_connections and user_goals tables
- **Redis**: Caching and session management
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 📋 API Endpoints

### Single Post Analysis
```bash
POST /api/content/analyze
Content-Type: application/json

{
  "text": "今天去腾讯面试了算法工程师...",
  "userId": 1
}
```

### Batch Post Analysis
```bash
POST /api/content/analyze/batch
Content-Type: application/json

{
  "posts": [
    {"id": "post1", "text": "腾讯面试经验..."},
    {"id": "post2", "text": "字节跳动二面..."}
  ],
  "userId": 1,
  "analyzeConnections": true
}
```

**Response includes:**
```json
{
  "individual_analyses": [...],
  "connections": [
    {
      "post1_index": 0,
      "post2_index": 1,
      "strength": 0.6,
      "connection_types": ["same_company"],
      "insights": "Both posts discuss experiences at 腾讯"
    }
  ],
  "batch_insights": {
    "most_mentioned_companies": [...],
    "most_common_topics": [...],
    "overall_sentiment": {...}
  }
}
```

### Trend Analysis
```bash
GET /api/content/trends?timeframe=30d&userId=1
```

**Response includes:**
```json
{
  "topCompanies": [...],
  "topTopics": [...],
  "trending_insights": [...],
  "market_signals": [...],
  "recommended_focuses": [...]
}
```

## 🧪 Testing Phase 2 Features

### Test Batch Analysis with Connections
```bash
curl -X POST http://localhost:8080/api/content/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {"id": "post1", "text": "今天去腾讯面试了算法工程师岗位，主要问了深度学习相关问题"},
      {"id": "post2", "text": "腾讯二面结束了，这次主要考察系统设计和深度学习项目经验"}
    ],
    "analyzeConnections": true
  }'
```

### Test Trend Analysis
```bash
curl "http://localhost:8080/api/content/trends?timeframe=30d"
```

## 📊 Phase 2 Success Metrics

✅ **Multi-Post Analysis**: Users can analyze multiple XHS posts together
✅ **Connection Detection**: System identifies and stores relationships between posts
✅ **Trend Analysis**: Historical data analysis with market signals and recommendations
✅ **OpenRouter Integration**: Cost-effective AI analysis with model fallback
✅ **Database Foundation**: Ready for autonomous data collection and processing
✅ **Enhanced Frontend**: Multi-post interface with connection visualization

## 🔄 Development Workflow

### Local Development
```bash
# Start infrastructure
docker-compose up postgres redis -d

# Run content-service locally
cd services/content-service
npm install
npm run dev

# Run frontend locally
cd frontend
PORT=3002 npm start
```

### Database Schema Updates
The Phase 2 database includes:
- `analysis_connections` table for post relationships
- `user_goals` table for personalized intelligence
- Enhanced `analysis_results` with new fields (interview_stages, difficulty_level, etc.)

```bash
# Check Phase 2 tables
docker exec redcube3_xhs-postgres-1 psql -U postgres -d redcube_content -c "\dt"
```

## 🚀 Autonomous Intelligence Foundation

### Current Capabilities
- **Relationship Mapping**: Automatic detection of connections between career experiences
- **Trend Detection**: Historical pattern analysis for market insights
- **Signal Processing**: Detection of hiring activity and skill emergence
- **Recommendation Engine**: Personalized suggestions based on trend data

### Ready for Phase 3 Autonomous Features
- Autonomous XHS data scraping and filtering
- Proactive trend detection and user briefing generation
- Self-updating learning path recommendations
- 24/7 career intelligence monitoring and alerts

## 🛠️ Technology Stack

**Backend**: Node.js, Express, PostgreSQL, Redis, OpenRouter AI
**Frontend**: React, react-beautiful-dnd for drag-drop
**Infrastructure**: Docker, Nginx, Prometheus, Grafana
**AI**: OpenRouter with model cascade (moonshot/deepseek/gpt-3.5-turbo)

## 📈 Next Phase Planning

**Phase 3**: Advanced Autonomous Intelligence (See PHASE_3_MVP_INSTRUCTION.md)

---

**Phase 2 Complete** 🎉 - Built with React, Node.js, Express, PostgreSQL, Redis, OpenRouter, Docker