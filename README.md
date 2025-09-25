# RedCube XHS Content Analysis MVP

An intelligent microservices platform for analyzing XHS (小红书) posts about job interviews and career experiences using OpenAI.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API key
- Node.js 18+ (for local development)

### Setup and Run

1. **Clone and navigate to the project:**
   ```bash
   cd redcube3_xhs
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key:
   # OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - **Frontend**: http://localhost:3001
   - **API Gateway**: http://localhost:8080
   - **Grafana Monitoring**: http://localhost:3000 (admin/admin)
   - **Prometheus**: http://localhost:9090

### Test the MVP

1. Open http://localhost:3001 in your browser
2. Use one of the sample XHS posts or paste your own content
3. Click "开始分析" to analyze the content
4. View extracted insights: company, role, sentiment, interview topics, etc.

## 🏗️ Architecture

### Microservices
- **frontend**: React app for user interface
- **api-gateway**: Nginx reverse proxy routing requests
- **content-service**: OpenAI-powered content analysis service
- **user-service**: User management (future features)
- **interview-service**: Interview session management (future features)
- **notification-service**: Real-time notifications (future features)

### Infrastructure
- **PostgreSQL**: Primary database with separate schemas per service
- **Redis**: Caching and session management
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards

## 📋 MVP Features Delivered

✅ **XHS Content Analysis**
- OpenAI-powered extraction of company, role, sentiment
- Interview topics and preparation materials identification
- Key insights generation

✅ **Data Storage**
- Analysis results stored in PostgreSQL
- Designed for future features (connections, learning paths)
- History tracking and analytics

✅ **Web Interface**
- Clean, responsive React frontend
- Sample posts for testing
- Real-time analysis results display

✅ **Monitoring Stack**
- Prometheus metrics collection
- Grafana dashboards
- Service health monitoring

## 🔧 API Endpoints

### Content Analysis Service (Port 3003)

#### Analyze Content
```bash
POST /api/content/analyze
Content-Type: application/json

{
  "text": "刚刚结束了字节跳动的面试...",
  "userId": 1  // optional
}
```

**Response:**
```json
{
  "id": 123,
  "company": "字节跳动",
  "role": "软件工程师",
  "sentiment": "positive",
  "interview_topics": ["算法", "系统设计", "项目经验"],
  "industry": "互联网",
  "experience_level": "mid",
  "preparation_materials": ["算法题库", "系统设计案例"],
  "key_insights": ["面试官很专业", "需要深入准备算法"],
  "createdAt": "2023-09-21T10:30:00Z"
}
```

#### Get Analysis History
```bash
GET /api/content/history?userId=1&limit=10
```

#### Get Analytics
```bash
GET /api/content/analytics
```

## 🧪 Testing

### Manual Testing
1. **Service Health Check:**
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:3003/health
   ```

2. **Test Analysis API:**
   ```bash
   curl -X POST http://localhost:8080/api/content/analyze \
     -H "Content-Type: application/json" \
     -d '{"text":"刚刚结束了字节跳动的面试，感觉不错！"}'
   ```

3. **Check Database:**
   ```bash
   docker exec -it redcube3_xhs-postgres-1 psql -U postgres -d redcube_content
   \dt
   SELECT * FROM analysis_results LIMIT 5;
   ```

### Frontend Testing
1. Navigate to http://localhost:3001
2. Test with sample posts
3. Verify analysis results display correctly
4. Check history section updates

## 🔄 Development Workflow

### Local Development
```bash
# Start only infrastructure
docker-compose up postgres redis -d

# Run content-service locally
cd services/content-service
npm install
npm run dev

# Run frontend locally
cd frontend
npm install
npm start
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f content-service
docker-compose logs -f frontend
```

### Database Management
```bash
# Connect to PostgreSQL
docker exec -it redcube3_xhs-postgres-1 psql -U postgres -d redcube_content

# Restart database with fresh schema
docker-compose down postgres
docker volume rm redcube3_xhs_postgres_data
docker-compose up postgres -d
```

## 📊 Monitoring

### Prometheus Metrics (http://localhost:9090)
- Service health and uptime
- Request rates and response times
- Database connection metrics
- Custom OpenAI API metrics

### Grafana Dashboards (http://localhost:3000)
- Login: admin/admin
- Pre-configured dashboard for microservices monitoring
- Real-time service performance visualization

## 🚀 Next Steps (Post-MVP)

### Phase 2: Advanced Analysis
- [ ] Post similarity detection and clustering
- [ ] Trend analysis across multiple posts
- [ ] Company-specific interview pattern recognition
- [ ] Real-time streaming analysis

### Phase 3: Intelligent Features
- [ ] Personalized learning path generation
- [ ] Interview preparation recommendations
- [ ] Peer matching based on similar experiences
- [ ] AI-powered Q&A assistant

### Phase 4: Scale & Production
- [ ] Kubernetes deployment
- [ ] Advanced caching strategies
- [ ] Rate limiting and API optimization
- [ ] User authentication and authorization
- [ ] Mobile application development

## 🛠️ Troubleshooting

### Common Issues

1. **OpenAI API Key not working:**
   - Verify key is set in .env file
   - Check content-service logs: `docker-compose logs content-service`
   - Ensure sufficient OpenAI credits

2. **Database connection errors:**
   - Wait for PostgreSQL to fully start: `docker-compose logs postgres`
   - Check if database tables are created: Connect via psql

3. **Frontend not loading:**
   - Check if frontend service built successfully
   - Verify port 3001 is not in use
   - Check nginx configuration in api-gateway

4. **Analysis returns errors:**
   - Verify OpenAI API key is valid
   - Check text length (max 10,000 characters)
   - Review content-service logs for detailed errors

### Reset Everything
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d
```

## 📝 Environment Variables

Required in `.env` file:
```
OPENAI_API_KEY=your-openai-api-key-here
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_URL=redis://redis:6379
```

## 🏆 Success Metrics

The MVP successfully demonstrates:
- ✅ End-to-end XHS content analysis workflow
- ✅ OpenAI integration with structured data extraction
- ✅ Microservices architecture with proper separation
- ✅ Scalable database design for future features
- ✅ Monitoring and observability stack
- ✅ Clean, responsive user interface
- ✅ Docker-based deployment ready for production

---

**Built with**: React, Node.js, Express, PostgreSQL, Redis, OpenAI, Docker, Prometheus, Grafana