/**
 * LLM Dashboard Mock Data
 * TASK-11: Mock Q&A data for dashboard/overview context
 */

export const DASHBOARD_MOCK_DATA: { question: string; answer: string }[] = [
  {
    question: "Give me a quick overview",
    answer: `## System Overview

### Health Status
| Component | Status | Uptime |
|-----------|--------|--------|
| API | ✅ Healthy | 99.98% |
| Database | ✅ Healthy | 99.95% |
| Cache | ⚠️ Warning | 99.2% |
| Queue | ✅ Healthy | 99.99% |

### Key Metrics (Last Hour)
- **Requests:** 1.2M (↑5%)
- **Latency P99:** 234ms (↓12ms)
- **Error Rate:** 0.05% (stable)
- **Active Users:** 45,678

### Active Alerts: 2
1. Cache hit rate below threshold
2. Payment service latency elevated`,
  },
  {
    question: "Show error rate trends",
    answer: `## Error Rate Trends

### Hourly Breakdown
| Hour | Rate | Trend |
|------|------|-------|
| 12:00 | 0.23% | → Stable |
| 13:00 | 0.28% | ↑ +22% |
| 14:00 | 0.89% | ⚠️ Spike |
| 15:00 | 0.45% | ↓ Recovering |
| 16:00 | 0.31% | ↓ Normal |

### Root Cause
**14:00 spike** linked to payment-service deployment

### Recommendation
Review deployment process for gradual rollout`,
  },
  {
    question: "Quick health check",
    answer: `## Quick Health Check ✅

### System Status
| System | Status | Notes |
|--------|--------|-------|
| API | ✅ Healthy | 234ms P99 |
| Database | ✅ Healthy | 45 connections |
| Cache | ⚠️ Warning | 82% hit rate |
| Queue | ✅ Healthy | 120 msg/s |
| CDN | ✅ Healthy | 98% cache hit |

### Queue Warning Details
Consumer lag at 1.2K messages - scaling consumers recommended`,
  },
  {
    question: "What's the current system status?",
    answer: `## Current System Status

### Overall Health: 🟢 Operational

### Services
| Service | Status | Latency | Error Rate |
|---------|--------|---------|------------|
| api-gateway | ✅ UP | 45ms | 0.02% |
| payment-svc | ✅ UP | 234ms | 0.15% |
| order-svc | ✅ UP | 89ms | 0.05% |
| auth-svc | ✅ UP | 23ms | 0.01% |
| notification | ✅ UP | 12ms | 0.08% |

### Infrastructure
- **Kubernetes:** 12/12 nodes healthy
- **Database:** Primary + 2 replicas active
- **Cache:** Redis cluster 6/6 nodes
- **CDN:** All edge locations operational

### No Active Incidents`,
  },
  {
    question: "Show me the key performance indicators",
    answer: `## Key Performance Indicators

### Traffic KPIs
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Requests/sec | 4,567 | >1,000 | ✅ |
| Unique Users/hr | 23,456 | >10,000 | ✅ |
| Session Duration | 8.5min | >5min | ✅ |

### Reliability KPIs
| Metric | Current | SLO | Status |
|--------|---------|-----|--------|
| Availability | 99.95% | 99.9% | ✅ |
| Error Rate | 0.12% | <1% | ✅ |
| MTTR | 4.5min | <10min | ✅ |

### Performance KPIs
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| P50 Latency | 67ms | <100ms | ✅ |
| P99 Latency | 234ms | <500ms | ✅ |
| Throughput | 45K TPS | >10K | ✅ |

### Business KPIs
- **Order Success Rate:** 98.7%
- **Payment Success Rate:** 97.2%
- **Cart Conversion:** 23.4%`,
  },
  {
    question: "Any issues I should know about?",
    answer: `## Current Issues Summary

### Active Alerts (2)
| Alert | Severity | Duration | Service |
|-------|----------|----------|---------|
| Cache hit rate low | Warning | 23min | redis-cluster |
| Payment latency | Warning | 8min | payment-svc |

### Recent Incidents
| Time | Issue | Status | Impact |
|------|-------|--------|--------|
| 14:00 | Deployment error | Resolved | 12min downtime |
| 12:30 | DB connection spike | Resolved | 5min degradation |

### Recommendations
1. **Cache:** Increase memory allocation
2. **Payment:** Check external API latency
3. **Monitoring:** Review alert thresholds

### Upcoming Maintenance
- Database upgrade: Tonight 02:00 UTC (30min)`,
  },
  {
    question: "Show traffic summary",
    answer: `## Traffic Summary

### Current Traffic
- **Requests/min:** 78,456
- **Active Sessions:** 12,345
- **Geographic:** 45% US, 30% EU, 25% APAC

### Traffic Distribution by Service
| Service | Traffic % | RPS |
|---------|-----------|-----|
| api-gateway | 100% | 4,567 |
| web-app | 65% | 2,968 |
| mobile-api | 35% | 1,599 |

### Top Endpoints
| Endpoint | Hits/min | Latency |
|----------|----------|---------|
| /api/products | 12,345 | 45ms |
| /api/checkout | 8,901 | 234ms |
| /api/auth/login | 5,678 | 67ms |
| /api/search | 4,567 | 123ms |

### Peak Hours
Today's peak: 14:00-15:00 (125% of normal)`,
  },
  {
    question: "Resource utilization summary",
    answer: `## Resource Utilization

### Compute
| Cluster | CPU | Memory | Status |
|---------|-----|--------|--------|
| prod-us-east | 67% | 72% | Healthy |
| prod-eu-west | 54% | 68% | Healthy |
| prod-ap-south | 45% | 58% | Healthy |

### Database
| Instance | Connections | CPU | IOPS |
|----------|-------------|-----|------|
| primary | 45/100 | 56% | 2,345 |
| replica-1 | 23/100 | 34% | 1,234 |
| replica-2 | 21/100 | 32% | 1,189 |

### Storage
| Volume | Used | Total | Status |
|--------|------|-------|--------|
| database | 456GB | 1TB | 45% |
| logs | 234GB | 500GB | 47% |
| backups | 890GB | 2TB | 44% |

### Auto-Scaling
All services within normal ranges - no scaling actions needed`,
  },
  {
    question: "Show me today's highlights",
    answer: `## Today's Highlights

### Key Events
| Time | Event | Impact |
|------|-------|--------|
| 09:00 | Traffic spike (+45%) | Handled well |
| 11:30 | payment-svc v2.3.0 deployed | Successful |
| 14:00 | Minor cache issue | Resolved in 8min |
| 15:30 | New user milestone (1M) | Celebration! |

### Performance Wins
- **Latency P99:** Down 15% from yesterday
- **Error Rate:** Lowest in 30 days
- **Throughput:** New record 52K TPS

### Areas of Attention
1. Cache hit rate trending down (monitoring)
2. Payment API latency slightly elevated
3. Log volume increasing (may need rotation)

### Tomorrow's Schedule
- 02:00 UTC: Database maintenance window
- 10:00 UTC: Security patch rollout`,
  },
  {
    question: "Compare today vs yesterday",
    answer: `## Day-over-Day Comparison

### Traffic Metrics
| Metric | Yesterday | Today | Change |
|--------|-----------|-------|--------|
| Total Requests | 45.2M | 48.7M | +7.7% |
| Unique Users | 234K | 256K | +9.4% |
| Peak RPS | 5,234 | 5,678 | +8.5% |

### Performance Metrics
| Metric | Yesterday | Today | Change |
|--------|-----------|-------|--------|
| P50 Latency | 78ms | 67ms | -14% ✅ |
| P99 Latency | 267ms | 234ms | -12% ✅ |
| Error Rate | 0.18% | 0.12% | -33% ✅ |

### Incidents
| | Yesterday | Today |
|--|-----------|-------|
| Total | 4 | 2 |
| Critical | 1 | 0 |
| Resolved <10min | 75% | 100% |

### Summary
📈 **Improved:** Traffic up, errors down, faster response times`,
  },
  {
    question: "Show service dependencies",
    answer: `## Service Dependencies Map

### Critical Path
\`\`\`
[User Request]
    ↓
[api-gateway] → [auth-svc] → [user-db]
    ↓
[order-svc] → [inventory-svc] → [warehouse-db]
    ↓
[payment-svc] → [Stripe API]
    ↓
[notification-svc] → [SendGrid API]
\`\`\`

### Dependency Health
| Service | Dependencies | All Healthy |
|---------|--------------|-------------|
| api-gateway | 5 | ✅ Yes |
| order-svc | 3 | ✅ Yes |
| payment-svc | 2 | ⚠️ 1 slow |
| auth-svc | 2 | ✅ Yes |

### External Dependencies
| API | Status | Latency | SLA |
|-----|--------|---------|-----|
| Stripe | ✅ UP | 234ms | 99.99% |
| SendGrid | ✅ UP | 89ms | 99.9% |
| Twilio | ✅ UP | 156ms | 99.95% |

### Single Points of Failure
None identified - all critical services have redundancy`,
  },
  {
    question: "Top 5 issues this week",
    answer: `## Top Issues This Week

### 1. Payment Gateway Timeouts
- **Occurrences:** 23
- **Impact:** 456 failed transactions
- **Root Cause:** Stripe API latency spikes
- **Status:** Monitoring, timeout increased to 5s

### 2. Database Connection Exhaustion
- **Occurrences:** 8
- **Impact:** 2-5min degradation each
- **Root Cause:** Connection leak in order-svc
- **Status:** ✅ Fixed in v2.3.1

### 3. Cache Eviction Storms
- **Occurrences:** 5
- **Impact:** 15% latency increase
- **Root Cause:** TTL too aggressive
- **Status:** TTL adjusted from 5min to 15min

### 4. Pod OOMKilled
- **Occurrences:** 4
- **Impact:** Brief service disruptions
- **Root Cause:** Memory limits too low
- **Status:** ✅ Limits increased

### 5. Certificate Renewal Failure
- **Occurrences:** 1
- **Impact:** 10min outage on webhook endpoint
- **Root Cause:** Let's Encrypt rate limit
- **Status:** ✅ Switched to wildcard cert`,
  },
  {
    question: "Show SLA status",
    answer: `## SLA Status Report

### Current Month SLA
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Availability | 99.9% | 99.94% | ✅ Met |
| P99 Latency | <500ms | 234ms | ✅ Met |
| Error Rate | <1% | 0.12% | ✅ Met |

### Error Budget
\`\`\`
Monthly Budget: 43.2 min downtime allowed
Used: 17.3 min (40%)
Remaining: 25.9 min (60%)
Days Left: 18
\`\`\`

### SLA by Service
| Service | SLO | Actual | Budget Used |
|---------|-----|--------|-------------|
| API | 99.95% | 99.98% | 23% |
| Payments | 99.9% | 99.92% | 45% |
| Orders | 99.9% | 99.96% | 28% |

### Historical Trend
| Month | Availability | Budget Used |
|-------|--------------|-------------|
| Oct | 99.97% | 18% |
| Nov | 99.91% | 78% |
| Dec | 99.95% | 34% |
| Jan | 99.94% | 40% (current) |`,
  },
  {
    question: "What needs attention right now?",
    answer: `## Immediate Attention Required

### Critical (0)
No critical issues

### High Priority (2)

**1. Payment Service Latency**
- Current P99: 450ms (target: <300ms)
- Duration: 45 minutes
- Impact: 2% slower checkouts
- **Action:** Check Stripe API status

**2. Disk Space Warning**
- logs-prod-1: 87% full
- Estimated full: 6 hours
- **Action:** Rotate logs or expand volume

### Medium Priority (3)
| Issue | Service | Recommended Action |
|-------|---------|-------------------|
| Cache hit rate | redis | Increase memory |
| Consumer lag | kafka | Scale consumers |
| Certificate expiry | webhook | Renew in 8 days |

### Monitoring (5)
- Memory trend on order-svc
- CPU spike on analytics workers
- Slow queries in reporting DB
- Queue depth fluctuation
- Network latency to EU region`,
  },
  {
    question: "Show deployment status",
    answer: `## Deployment Status

### Recent Deployments
| Time | Service | Version | Status |
|------|---------|---------|--------|
| 15:30 | api-gateway | v2.1.5 | ✅ Healthy |
| 14:00 | payment-svc | v2.3.1 | ✅ Healthy |
| 12:00 | order-svc | v3.0.8 | ✅ Healthy |
| 09:00 | auth-svc | v1.8.2 | ✅ Healthy |

### Deployment Pipeline
| Environment | Status | Version |
|-------------|--------|---------|
| dev | ✅ Ready | v2.3.2 |
| staging | 🔄 Testing | v2.3.2 |
| production | ✅ Stable | v2.3.1 |

### Rollback Available
All services have 1-click rollback to previous version

### Upcoming Deployments
| Scheduled | Service | Version | Change |
|-----------|---------|---------|--------|
| Tonight 23:00 | auth-svc | v1.8.3 | Security patch |
| Tomorrow 10:00 | web-app | v4.5.0 | Feature release |

### Feature Flags
- **new-checkout:** 25% rollout
- **dark-mode:** 100% enabled
- **beta-search:** 10% A/B test`,
  },
  {
    question: "Cost analysis for today",
    answer: `## Cost Analysis

### Today's Spend
| Category | Spend | Budget | Status |
|----------|-------|--------|--------|
| Compute | $234.56 | $250 | ✅ On track |
| Database | $89.23 | $100 | ✅ On track |
| Network | $45.67 | $50 | ⚠️ 91% |
| Storage | $23.45 | $30 | ✅ On track |
| **Total** | **$392.91** | **$430** | **91%** |

### Cost by Service
| Service | Daily Cost | % of Total |
|---------|------------|------------|
| api-gateway | $45.23 | 11.5% |
| payment-svc | $67.89 | 17.3% |
| order-svc | $34.56 | 8.8% |
| database | $89.23 | 22.7% |
| cache | $23.45 | 6.0% |
| other | $132.55 | 33.7% |

### Optimization Opportunities
1. **Right-size analytics pods:** Save $45/day
2. **Reserved instances:** Save $120/day
3. **Clean old snapshots:** Save $15/day

### Monthly Projection
On track for $11,787 (budget: $13,000)`,
  },
  {
    question: "Show user activity metrics",
    answer: `## User Activity Metrics

### Active Users
| Period | Count | Trend |
|--------|-------|-------|
| Now | 12,345 | Live |
| Last Hour | 45,678 | +5% |
| Today | 234,567 | +12% |
| This Week | 892,345 | +8% |

### User Journeys
| Flow | Started | Completed | Rate |
|------|---------|-----------|------|
| Signup | 1,234 | 987 | 80% |
| Checkout | 8,901 | 7,234 | 81% |
| Search→Buy | 12,345 | 2,345 | 19% |

### Session Metrics
- **Avg Duration:** 8.5 minutes
- **Pages/Session:** 6.2
- **Bounce Rate:** 23%

### Geographic Distribution
| Region | Users | Latency |
|--------|-------|---------|
| US | 45% | 67ms |
| EU | 30% | 89ms |
| APAC | 25% | 134ms |

### Peak Activity
Today's peak: 15:00 UTC (14,567 concurrent users)`,
  },
  {
    question: "Database health overview",
    answer: `## Database Health Overview

### Primary Database
| Metric | Value | Status |
|--------|-------|--------|
| Connections | 45/100 | ✅ Healthy |
| CPU | 56% | ✅ Normal |
| Memory | 72% | ✅ Normal |
| Disk I/O | 2,345 IOPS | ✅ Normal |
| Replication Lag | N/A | Primary |

### Read Replicas
| Replica | Lag | Connections | Status |
|---------|-----|-------------|--------|
| replica-1 | 12ms | 23 | ✅ Healthy |
| replica-2 | 8ms | 21 | ✅ Healthy |

### Query Performance
| Metric | Value | Threshold |
|--------|-------|-----------|
| Slow Queries (>1s) | 23/hr | <50/hr |
| Deadlocks | 0/hr | <5/hr |
| Long Transactions | 2 | <10 |

### Storage
- **Used:** 456GB / 1TB (45%)
- **Growth Rate:** 2.3GB/day
- **Days Until Full:** 236 days

### Backup Status
Last backup: 2 hours ago ✅`,
  },
  {
    question: "Show API performance summary",
    answer: `## API Performance Summary

### Overall Stats
- **Total Requests:** 4.5M (last hour)
- **Success Rate:** 99.88%
- **Avg Response Time:** 78ms

### Latency Percentiles
| Percentile | Latency | Status |
|------------|---------|--------|
| P50 | 45ms | ✅ Excellent |
| P75 | 89ms | ✅ Good |
| P95 | 178ms | ✅ Good |
| P99 | 234ms | ✅ Acceptable |

### Top Endpoints by Traffic
| Endpoint | RPS | Latency | Errors |
|----------|-----|---------|--------|
| GET /products | 1,234 | 34ms | 0.01% |
| POST /orders | 567 | 234ms | 0.12% |
| GET /users/:id | 890 | 23ms | 0.02% |
| POST /auth/login | 456 | 89ms | 0.08% |

### Slowest Endpoints
| Endpoint | Latency | Issue |
|----------|---------|-------|
| POST /reports/generate | 2.3s | Complex query |
| GET /analytics/dashboard | 1.8s | Large dataset |
| POST /checkout/complete | 890ms | Payment API |`,
  },
  {
    question: "Security overview",
    answer: `## Security Overview

### Threat Summary
| Metric | Count | Status |
|--------|-------|--------|
| Blocked Attacks | 12,345/hr | Normal |
| Failed Logins | 234/hr | ⚠️ Elevated |
| Rate Limited | 567/hr | Normal |

### Recent Security Events
| Time | Event | Severity | Action |
|------|-------|----------|--------|
| 14:30 | Brute force attempt | Medium | IP blocked |
| 13:45 | SQL injection attempt | High | Blocked by WAF |
| 12:00 | Unusual API access | Low | Logged |

### Authentication Health
- **MFA Adoption:** 78% of users
- **Session Security:** All tokens valid
- **API Keys:** 3 expiring this week

### Compliance Status
| Standard | Status | Last Audit |
|----------|--------|------------|
| SOC 2 | ✅ Compliant | Dec 2024 |
| GDPR | ✅ Compliant | Jan 2025 |
| PCI DSS | ✅ Compliant | Nov 2024 |

### Recommendations
1. Investigate failed login spike (source: single IP range)
2. Rotate 3 expiring API keys
3. Review WAF rules quarterly`,
  },
  {
    question: "Show infrastructure summary",
    answer: `## Infrastructure Summary

### Kubernetes Clusters
| Cluster | Nodes | Pods | CPU | Memory |
|---------|-------|------|-----|--------|
| prod-us-east | 12 | 145 | 67% | 72% |
| prod-eu-west | 8 | 98 | 54% | 68% |
| prod-ap-south | 6 | 67 | 45% | 58% |

### Load Balancers
| LB | Requests/s | Healthy Targets |
|----|------------|-----------------|
| alb-prod-api | 4,567 | 12/12 |
| nlb-internal | 2,345 | 8/8 |
| alb-cdn | 8,901 | 6/6 |

### CDN Status
- **Cache Hit Rate:** 94.5%
- **Edge Locations:** 45 worldwide
- **Bandwidth:** 2.3 Gbps

### DNS
- **Queries/sec:** 12,345
- **Resolution Time:** 2.3ms avg
- **Health Checks:** All passing

### SSL/TLS Certificates
| Domain | Expiry | Status |
|--------|--------|--------|
| *.telemetryflow.id | 60 days | ✅ |
| api.telemetryflow.id | 45 days | ✅ |
| pay.telemetryflow.id | 12 days | ⚠️ Renew soon |`,
  },
  {
    question: "Alert summary for today",
    answer: `## Alert Summary

### Active Alerts (3)
| Alert | Severity | Duration | Service |
|-------|----------|----------|---------|
| Cache hit rate low | Warning | 45min | redis |
| Payment latency | Warning | 23min | payment-svc |
| Disk space warning | Warning | 2hr | logs-server |

### Resolved Today (12)
| Alert | Duration | Resolution |
|-------|----------|------------|
| High error rate | 8min | Auto-scaled |
| Memory pressure | 12min | Pod restarted |
| DB connection spike | 5min | Connection leak fixed |
| API latency | 15min | Deployment rollback |

### Alert Statistics
| Metric | Today | Avg (7d) |
|--------|-------|----------|
| Total Alerts | 15 | 18 |
| Critical | 0 | 0.5 |
| Warning | 12 | 14 |
| MTTR | 8.5min | 10min |

### Alert Trends
- 📉 20% fewer alerts than last week
- ✅ No critical alerts today
- ⚡ Faster resolution time (8.5min vs 10min avg)`,
  },
  {
    question: "What happened in the last hour?",
    answer: `## Last Hour Summary

### Timeline
| Time | Event | Impact |
|------|-------|--------|
| 15:45 | Cache hit rate dropped | Minor latency increase |
| 15:30 | api-gateway v2.1.5 deployed | Successful |
| 15:15 | Traffic spike (+15%) | Handled normally |
| 15:00 | Scheduled job completed | No issues |
| 14:50 | Alert: Payment latency | Investigating |

### Key Metrics Change
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Requests/min | 72,345 | 78,456 | +8.4% |
| Error rate | 0.08% | 0.12% | +50% |
| P99 latency | 198ms | 234ms | +18% |
| Active users | 10,234 | 12,345 | +21% |

### Deployments
- api-gateway v2.1.5 at 15:30 ✅

### Alerts Fired
1. 15:45 - Cache hit rate warning
2. 14:50 - Payment latency warning

### Recommendations
- Monitor cache hit rate
- Check payment service external dependencies`,
  },
  {
    question: "Show capacity planning metrics",
    answer: `## Capacity Planning

### Current Utilization vs Capacity
| Resource | Used | Capacity | % Used |
|----------|------|----------|--------|
| Compute (CPU) | 156 cores | 240 cores | 65% |
| Memory | 412 GB | 512 GB | 80% |
| Database IOPS | 4,500 | 10,000 | 45% |
| Network | 4.5 Gbps | 10 Gbps | 45% |

### Growth Projections
| Metric | Current | +30 days | +90 days |
|--------|---------|----------|----------|
| Users | 250K | 275K | 325K |
| Requests/day | 45M | 52M | 68M |
| Data stored | 456GB | 525GB | 720GB |

### Scaling Headroom
| Service | Current | Max | Headroom |
|---------|---------|-----|----------|
| api-gateway | 6 pods | 20 | 233% |
| order-svc | 4 pods | 15 | 275% |
| payment-svc | 3 pods | 10 | 233% |

### Recommendations
1. **Memory:** Consider upgrade in 45 days
2. **Database:** Add read replica for analytics
3. **CDN:** Expand to 2 more regions

### Budget Impact
Projected +$2,500/month for recommended scaling`,
  },
  {
    question: "Show me the executive summary",
    answer: `## Executive Summary

### System Health: 🟢 Good

### Key Numbers (Today)
| Metric | Value | vs Yesterday |
|--------|-------|--------------|
| Revenue Processed | $1.2M | +8% |
| Orders Completed | 45,678 | +12% |
| New Users | 2,345 | +5% |
| Uptime | 99.98% | Stable |

### Performance
- ✅ All SLOs met
- ✅ No critical incidents
- ✅ Deployment success rate: 100%

### Highlights
1. **Record Day:** Highest order volume this quarter
2. **Performance Win:** P99 latency down 15%
3. **Cost Efficiency:** 8% under budget

### Concerns
1. Payment API latency elevated (monitoring)
2. Disk space trending - action needed in 6 hours

### Upcoming
- Tonight: Database maintenance (planned)
- Tomorrow: Feature release for mobile app

### Action Items
| Priority | Item | Owner |
|----------|------|-------|
| High | Rotate logs | Ops team |
| Medium | Payment latency | Dev team |
| Low | Review scaling | Platform team |`,
  },
  {
    question: "What's trending up?",
    answer: `## Trending Up 📈

### Traffic Trends
| Metric | Change | Period |
|--------|--------|--------|
| Total Requests | +15% | vs last week |
| Mobile Traffic | +23% | vs last week |
| API Usage | +18% | vs last week |
| New Signups | +12% | vs last week |

### Performance Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| P99 Latency | 280ms | 234ms | 16% faster |
| Cache Hit Rate | 89% | 94% | +5pp |
| DB Query Time | 45ms | 32ms | 29% faster |

### Growing Services
| Service | Growth | Reason |
|---------|--------|--------|
| mobile-api | +45% | New app version |
| search-svc | +34% | Improved discovery |
| analytics | +28% | New dashboard |

### User Engagement
- Session duration: +8%
- Pages per visit: +12%
- Return users: +15%

### Regional Growth
| Region | Growth |
|--------|--------|
| APAC | +34% |
| LATAM | +28% |
| EU | +12% |`,
  },
  {
    question: "What's trending down?",
    answer: `## Trending Down 📉

### Positive Trends (Things Getting Better)
| Metric | Change | Impact |
|--------|--------|--------|
| Error Rate | -33% | Improved reliability |
| Response Time | -16% | Better UX |
| Alert Volume | -20% | Fewer issues |
| MTTR | -25% | Faster recovery |

### Concerning Trends
| Metric | Change | Action Needed |
|--------|--------|--------------|
| Cache Hit Rate | -3% | Monitor closely |
| Free Disk Space | -15% | Plan expansion |
| API v1 Usage | -45% | Expected (migration) |

### Cost Reductions
| Category | Savings | How |
|----------|---------|-----|
| Compute | -12% | Right-sizing |
| Data Transfer | -8% | CDN optimization |
| Storage | -5% | Cleanup old data |

### Declining Endpoints
| Endpoint | Change | Status |
|----------|--------|--------|
| /v1/legacy | -78% | Deprecating |
| /api/old-auth | -65% | Migrating |
| /reports/pdf | -34% | Replaced |

### Note
Most declining metrics are positive outcomes from optimization work!`,
  },
  {
    question: "Show queue health",
    answer: `## Queue Health Overview

### Message Queues
| Queue | Depth | Rate In | Rate Out | Status |
|-------|-------|---------|----------|--------|
| orders | 234 | 45/s | 48/s | ✅ Healthy |
| notifications | 1,234 | 89/s | 85/s | ⚠️ Growing |
| analytics | 567 | 23/s | 25/s | ✅ Healthy |
| emails | 89 | 12/s | 12/s | ✅ Healthy |

### Consumer Status
| Queue | Consumers | Idle | Processing |
|-------|-----------|------|------------|
| orders | 5 | 2 | 3 |
| notifications | 3 | 0 | 3 |
| analytics | 2 | 1 | 1 |
| emails | 3 | 1 | 2 |

### Queue Latency
| Queue | Avg Wait | P99 Wait |
|-------|----------|----------|
| orders | 45ms | 234ms |
| notifications | 890ms | 2.3s |
| analytics | 123ms | 567ms |

### Dead Letter Queues
| DLQ | Messages | Oldest |
|-----|----------|--------|
| orders-dlq | 12 | 2hr ago |
| notifications-dlq | 45 | 1hr ago |

### Recommendation
Scale notification consumers from 3 to 5 to reduce backlog`,
  },
  {
    question: "Integration health status",
    answer: `## Integration Health

### External APIs
| API | Status | Latency | Success Rate |
|-----|--------|---------|--------------|
| Stripe | ✅ UP | 234ms | 99.8% |
| SendGrid | ✅ UP | 89ms | 99.9% |
| Twilio | ✅ UP | 156ms | 99.7% |
| AWS S3 | ✅ UP | 45ms | 100% |
| Google Maps | ✅ UP | 123ms | 99.9% |

### Internal Services
| Service | Status | Health Check |
|---------|--------|--------------|
| auth-svc | ✅ Healthy | 23ms |
| payment-svc | ⚠️ Slow | 450ms |
| order-svc | ✅ Healthy | 89ms |
| inventory-svc | ✅ Healthy | 67ms |

### Webhook Endpoints
| Endpoint | Success Rate | Avg Latency |
|----------|--------------|-------------|
| /webhooks/stripe | 99.9% | 45ms |
| /webhooks/sendgrid | 99.8% | 34ms |
| /webhooks/github | 100% | 23ms |

### Data Sync Status
| Sync | Last Run | Records | Status |
|------|----------|---------|--------|
| CRM → DB | 5min ago | 234 | ✅ |
| Analytics → DW | 15min ago | 12K | ✅ |
| Inventory → ERP | 30min ago | 567 | ✅ |`,
  },
  {
    question: "Show error breakdown",
    answer: `## Error Breakdown

### Error Distribution
| Error Type | Count | % of Total |
|------------|-------|------------|
| 4xx Client Errors | 4,567 | 78% |
| 5xx Server Errors | 1,234 | 21% |
| Timeout | 45 | 1% |

### Top Client Errors (4xx)
| Code | Count | Endpoint |
|------|-------|----------|
| 404 | 2,345 | /api/products/:id |
| 401 | 1,234 | /api/auth/* |
| 400 | 567 | /api/orders |
| 429 | 421 | Rate limited |

### Top Server Errors (5xx)
| Code | Count | Service | Issue |
|------|-------|---------|-------|
| 502 | 567 | api-gateway | Upstream timeout |
| 500 | 456 | payment-svc | Processing error |
| 503 | 211 | order-svc | Overloaded |

### Error Trends
| Hour | Error Rate | Trend |
|------|------------|-------|
| 12:00 | 0.08% | → |
| 13:00 | 0.12% | ↑ |
| 14:00 | 0.23% | ↑↑ |
| 15:00 | 0.15% | ↓ |
| 16:00 | 0.12% | ↓ |

### Root Cause Analysis
Most 5xx errors trace to payment-svc → Stripe API latency`,
  },
  {
    question: "Monitor all services",
    answer: `## All Services Monitor

### Service Status Grid
| Service | Status | CPU | Mem | Latency | Errors |
|---------|--------|-----|-----|---------|--------|
| api-gateway | ✅ | 45% | 67% | 45ms | 0.02% |
| auth-svc | ✅ | 23% | 45% | 23ms | 0.01% |
| user-svc | ✅ | 34% | 56% | 34ms | 0.03% |
| order-svc | ✅ | 56% | 72% | 89ms | 0.05% |
| payment-svc | ⚠️ | 67% | 78% | 450ms | 0.15% |
| inventory-svc | ✅ | 34% | 45% | 67ms | 0.02% |
| notification | ✅ | 23% | 34% | 12ms | 0.08% |
| search-svc | ✅ | 78% | 65% | 123ms | 0.04% |
| analytics | ✅ | 45% | 56% | 234ms | 0.01% |
| cdn-proxy | ✅ | 12% | 23% | 5ms | 0.00% |

### Replica Status
| Service | Desired | Ready | Available |
|---------|---------|-------|-----------|
| api-gateway | 6 | 6 | 6 |
| payment-svc | 3 | 3 | 3 |
| order-svc | 4 | 4 | 4 |
| auth-svc | 3 | 3 | 3 |

### Last Deployment
| Service | Version | Deployed |
|---------|---------|----------|
| api-gateway | v2.1.5 | 45min ago |
| payment-svc | v2.3.1 | 2hr ago |`,
  },
];

export const DASHBOARD_CONVERSATION_TITLES: string[] = [
  "Overview health assessment",
  "Key metrics trend analysis",
  "Performance summary report",
  "System-wide anomaly scan",
  "Executive dashboard insights",
  "Service SLA status overview",
  "Active incidents dashboard summary",
  "Infrastructure capacity overview",
  "Business KPI dashboard review",
  "Real-time traffic and error overview",
];
