# 🚀 Production Deployment Runbook

> **Pattern**: Based on practices from Google SRE, Netflix, Stripe, Meta
> **Last Updated**: 2025-11-27
> **Owner**: Engineering Team

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Steps](#deployment-steps)
3. [Health Checks](#health-checks)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Incident Response](#incident-response)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (90%+ coverage achieved)
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Database migrations tested
- [ ] Feature flags configured

### Infrastructure
- [ ] Staging environment tested
- [ ] Database backups completed
- [ ] Rollback scripts tested
- [ ] Monitoring dashboards ready
- [ ] API credits topped up (OpenRouter)

### Communication
- [ ] Team notified of deployment
- [ ] Deployment window scheduled
- [ ] Rollback plan reviewed
- [ ] On-call engineer identified

---

## Deployment Steps

### Phase 1: Database Migrations (5-10 minutes)

```bash
# 1. Backup current database
docker exec redcube_postgres pg_dump -U postgres -d postgres > backup-$(date +%Y%m%d-%H%M%S).sql
docker exec redcube_postgres pg_dump -U postgres -d redcube_users > backup-users-$(date +%Y%m%d-%H%M%S).sql

# 2. Run migrations
docker exec redcube_postgres psql -U postgres -d redcube_users -f /docker-entrypoint-initdb.d/99-user-sync-trigger.sql

# 3. Verify migrations
docker exec redcube_postgres psql -U postgres -d redcube_users -c "SELECT * FROM v_user_sync_status;"
```

**Success Criteria:**
- User counts match in both databases
- No missing users (v_user_sync_missing returns 0 rows)
- Triggers created successfully

### Phase 2: Service Deployment (2-5 minutes)

```bash
# 1. Pull latest code
git pull origin main

# 2. Build services
docker-compose build content-service user-service

# 3. Deploy with zero downtime
docker-compose up -d --no-deps content-service
docker-compose up -d --no-deps user-service

# 4. Wait for services to start
sleep 10
```

**Success Criteria:**
- Services show "Up" status
- No error logs in first 30 seconds
- Health check endpoints responding

### Phase 3: Smoke Tests (2-3 minutes)

```bash
# Test 1: Health check
curl http://localhost:8080/api/content/interview-intel/experiences?limit=1

# Test 2: User registration (with new user sync)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"deploy-test@example.com","password":"Test123","confirmPassword":"Test123"}'

# Test 3: Verify user synced to postgres
docker exec redcube_postgres psql -U postgres -d postgres -c \
  "SELECT id, email FROM users WHERE email = 'deploy-test@example.com';"

# Test 4: UGC Analysis Pipeline
curl -X POST http://localhost:8080/api/content/analyze-single/text \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d @test-data/analyze-text.json
```

**Success Criteria:**
- All tests return HTTP 200
- User synced correctly across databases
- Analysis completes in < 60 seconds
- Structured logs showing trace IDs

---

## Health Checks

### Service Health

```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs -f content-service | grep ERROR
docker-compose logs -f user-service | grep ERROR

# Check structured logging
docker logs redcube3_xhs-content-service-1 --tail 20 | grep "trace_id"
```

### Database Health

```bash
# Check user sync status
docker exec redcube_postgres psql -U postgres -d redcube_users -c \
  "SELECT * FROM v_user_sync_status;"

# Check for missing users
docker exec redcube_postgres psql -U postgres -d redcube_users -c \
  "SELECT * FROM v_user_sync_missing;"

# Check database connections
docker exec redcube_postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname IN ('postgres', 'redcube_users');"
```

### Application Metrics

```bash
# Check request latency (from logs)
docker logs redcube3_xhs-content-service-1 --tail 100 | grep "duration_ms"

# Check error rates
docker logs redcube3_xhs-content-service-1 --tail 1000 | grep -c "\"status\":500"
docker logs redcube3_xhs-content-service-1 --tail 1000 | grep -c "\"status\":200"

# Check reputation system
docker exec redcube_postgres psql -U postgres -d postgres -c \
  "SELECT COUNT(*) FROM reputation_events WHERE created_at > NOW() - INTERVAL '1 hour';"
```

---

## Rollback Procedures

### 🚨 Emergency Rollback (30 seconds - 2 minutes)

**When to Rollback:**
- Error rate > 5%
- Response time > 5 seconds (p95)
- Database corruption detected
- Critical feature not working
- Security vulnerability discovered

**Rollback Steps:**

#### Option 1: Feature Flag Killswitch (5-30 seconds)
```bash
# Disable problematic feature
export FEATURE_UGC_ANALYSIS=false
docker-compose restart content-service

# Or via environment file
echo "FEATURE_UGC_ANALYSIS=false" >> .env
docker-compose up -d content-service
```

#### Option 2: Deployment Rollback (30s - 2min)
```bash
# Use automated script
./scripts/rollback-deployment.sh content-service

# Or manual rollback
docker-compose stop content-service
docker-compose up -d content-service  # Uses previous image
```

#### Option 3: Full System Rollback (1-3 min)
```bash
# Complete rollback (deployment + migrations + feature flags)
./scripts/full-rollback.sh
```

### Database Rollback

```bash
# Rollback specific migration
./scripts/rollback-migration.sh 99

# Or restore from backup
cat backup-20251127-120000.sql | docker exec -i redcube_postgres psql -U postgres -d postgres
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% | Investigate immediately |
| P95 Latency | > 5s | Check slow queries |
| Database Connections | > 80% of max | Scale database |
| CPU Usage | > 80% | Scale horizontally |
| Memory Usage | > 85% | Investigate memory leaks |
| User Sync Failures | > 0 | Check dblink connection |

### Monitoring Commands

```bash
# Real-time log monitoring
docker-compose logs -f --tail=100 content-service | grep -E "(ERROR|WARN|trace_id)"

# Monitor user sync
watch -n 5 'docker exec redcube_postgres psql -U postgres -d redcube_users -c "SELECT * FROM v_user_sync_status;"'

# Monitor reputation events
watch -n 10 'docker exec redcube_postgres psql -U postgres -d postgres -c "SELECT COUNT(*) as events_last_hour FROM reputation_events WHERE created_at > NOW() - INTERVAL '\''1 hour'\'';"'
```

---

## Incident Response

### Severity Levels

**P0 - Critical (Rollback immediately)**
- Service completely down
- Data loss occurring
- Security breach

**P1 - High (Rollback within 15 min)**
- Major feature broken
- Error rate > 10%
- Database sync failing

**P2 - Medium (Fix within 1 hour)**
- Minor feature broken
- Error rate 5-10%
- Performance degraded

**P3 - Low (Fix in next deploy)**
- UI glitches
- Non-critical logs
- Minor bugs

### Incident Checklist

1. **Identify** (1-2 min)
   - Check error logs
   - Check metrics dashboard
   - Identify affected users/features

2. **Assess** (2-3 min)
   - Determine severity (P0-P3)
   - Estimate impact (% of users)
   - Check if rollback needed

3. **Communicate** (1 min)
   - Notify team on Slack/Discord
   - Update status page (if applicable)
   - Assign incident commander

4. **Mitigate** (5-15 min)
   - Execute rollback if needed
   - Apply hotfix if possible
   - Disable affected feature

5. **Verify** (5 min)
   - Run smoke tests
   - Check error rates decreased
   - Confirm user reports

6. **Postmortem** (within 48 hours)
   - Document timeline
   - Identify root cause
   - Create action items

---

## Post-Deployment Validation

### 30-Minute Mark
- [ ] Error rate < 1%
- [ ] P95 latency < 2s
- [ ] No user sync failures
- [ ] Structured logs working

### 1-Hour Mark
- [ ] All features functional
- [ ] Database sync working
- [ ] Reputation system active
- [ ] Trending algorithm running

### 24-Hour Mark
- [ ] No degradation in metrics
- [ ] Scheduled jobs running
- [ ] User reports stable
- [ ] Ready for beta users

---

## Gradual Rollout Plan

### Week 1: Internal Testing
- Deploy to staging
- Team testing (5-10 users)
- Monitor metrics closely

### Week 2: Beta Users
- Invite 20-50 beta users
- Feature flag: `BETA_USERS_ENABLED=true`
- Daily metrics review

### Week 3: Gradual Rollout
- Day 1: 10% of traffic
- Day 3: 25% of traffic
- Day 5: 50% of traffic
- Day 7: 100% of traffic

### Monitoring During Rollout
```bash
# Check percentage of users on new version
docker exec redcube_postgres psql -U postgres -d postgres -c \
  "SELECT
    COUNT(*) FILTER (WHERE created_at > '2025-11-27') as new_users,
    COUNT(*) as total_users,
    ROUND(100.0 * COUNT(*) FILTER (WHERE created_at > '2025-11-27') / COUNT(*), 2) as percentage
   FROM users;"
```

---

## Runbook Contacts

| Role | Contact | Backup |
|------|---------|--------|
| On-Call Engineer | [Name] | [Name] |
| Database Admin | [Name] | [Name] |
| Product Owner | [Name] | [Name] |

---

## Quick Reference Commands

```bash
# Deploy
docker-compose build && docker-compose up -d

# Rollback
./scripts/full-rollback.sh

# Check health
docker-compose ps && docker-compose logs --tail=50

# Monitor
docker-compose logs -f content-service | grep ERROR

# Database backup
docker exec redcube_postgres pg_dump -U postgres -d postgres > backup.sql
```

---

## Appendix: Emergency Procedures

### Database Connection Lost
```bash
# 1. Check database status
docker-compose ps postgres

# 2. Restart database
docker-compose restart postgres

# 3. Verify connections restored
docker-compose logs content-service | grep "Database connected"
```

### Out of Memory
```bash
# 1. Check memory usage
docker stats

# 2. Restart service
docker-compose restart content-service

# 3. Investigate memory leak
docker logs redcube3_xhs-content-service-1 | grep "memory"
```

### API Credits Exhausted
```bash
# 1. Check current balance at: https://openrouter.ai/settings/credits
# 2. Top up credits
# 3. Verify in logs:
docker logs redcube3_xhs-content-service-1 | grep "OpenRouter"
```

---

**Last Reviewed**: 2025-11-27
**Next Review**: Before next major deployment
