/**
 * LLM Correlations Mock Data
 * TASK-11: Mock Q&A data for signal correlations context
 */

export const CORRELATIONS_MOCK_DATA: { question: string; answer: string }[] = [
  {
    question: "Show correlations between services",
    answer: `## Service Correlations

### Cross-Service Dependencies
| Service A | Service B | Correlation | Type |
|-----------|-----------|-------------|------|
| payment-svc | order-svc | 0.94 | Strong |
| auth-svc | user-svc | 0.89 | Strong |
| api-gateway | all-services | 0.95 | Critical |
| notification-svc | email-svc | 0.78 | Moderate |
| analytics-svc | data-pipeline | 0.82 | Strong |

### Latency Correlations
When payment-svc latency increases by 100ms:
- order-svc: +85ms (downstream impact)
- notification-svc: +45ms
- analytics-svc: +12ms

### Error Correlations
Error spike in auth-svc correlates with:
- 403 errors in api-gateway (r=0.92)
- Failed logins (r=0.98)
- Session timeouts (r=0.87)`,
  },
  {
    question: "Analyze error correlation patterns",
    answer: `## Error Correlation Analysis

### Correlated Error Chains
\`\`\`
auth-svc (500) → user-svc (503) → order-svc (timeout)
     ↓
payment-svc (retry storms)
\`\`\`

### Top Correlated Errors (24h)
| Error A | Error B | Correlation | Lag |
|---------|---------|-------------|-----|
| DB connection timeout | API 503 | 0.95 | 2s |
| Cache miss | Slow query | 0.88 | 500ms |
| Auth failure | Session invalid | 0.92 | 0s |
| Rate limit hit | User errors | 0.76 | 0s |

### Recommendations
1. Add circuit breaker between auth and user services
2. Implement request coalescing for cache misses
3. Increase connection pool size for DB`,
  },
  {
    question: "Find metrics-logs correlations",
    answer: `## Metrics-Logs Correlation

### High Correlation Events (Last 24h)
| Metric | Log Pattern | Correlation | Impact |
|--------|-------------|-------------|--------|
| cpu_usage > 80% | "GC pause exceeded" | 0.91 | High |
| memory_used > 90% | "OOMKilled" | 0.98 | Critical |
| request_latency > 2s | "timeout" errors | 0.89 | High |
| error_rate > 5% | "Connection refused" | 0.85 | Medium |

### Automatic Detections
1. **CPU-GC Correlation**: When CPU > 80%, GC pauses increase 3x
2. **Memory-OOM Pattern**: OOMKilled always preceded by memory > 95%
3. **Latency-Timeout Chain**: 89% of timeouts occur after latency spike

### Actionable Insights
- Set alert for memory > 85% to prevent OOMKilled
- Tune GC settings when CPU consistently > 70%`,
  },
  {
    question: "Show trace-log linking analysis",
    answer: `## Trace-Log Linking Analysis

### Linked Traces with Errors
| Trace ID | Service | Error Log | Latency |
|----------|---------|-----------|---------|
| abc123... | payment-svc | "Card declined" | 2.3s |
| def456... | order-svc | "Inventory unavailable" | 1.8s |
| ghi789... | auth-svc | "Token expired" | 0.5s |

### Error Distribution by Trace
\`\`\`
Total Traces: 45,678
With Errors: 1,234 (2.7%)
├── payment-svc: 456 (37%)
├── order-svc: 312 (25%)
├── auth-svc: 234 (19%)
└── other: 232 (19%)
\`\`\`

### Correlation Insights
- 78% of error traces have >3 services involved
- Average error trace latency: 3.2s vs 0.8s normal`,
  },
  {
    question: "Detect multi-service incident correlation",
    answer: `## Multi-Service Incident Correlation

### Current Incident Chain
\`\`\`
[14:23:45] redis-cluster → connection refused
    ↓ (2s)
[14:23:47] cart-service → cache miss spike
    ↓ (5s)
[14:23:52] session-service → session lookup failures
    ↓ (10s)
[14:24:02] api-gateway → 5xx errors to users
\`\`\`

### Correlation Analysis
| Service | Impact Score | Dependencies |
|---------|--------------|--------------|
| redis-cluster | 1.0 | Root cause |
| cart-service | 0.95 | Direct |
| session-service | 0.92 | Direct |
| api-gateway | 0.78 | Cascaded |

### Root Cause
**Redis cluster failover** triggered cascading failures across dependent services.`,
  },
  {
    question: "Show exemplar-based root cause analysis",
    answer: `## Exemplar-Based Root Cause Analysis

### Anomalous Exemplars Detected
| Time | Metric | Value | Trace ID |
|------|--------|-------|----------|
| 14:23:45 | p99_latency | 4.5s | abc123 |
| 14:24:12 | error_rate | 12% | def456 |
| 14:24:33 | cpu_usage | 98% | ghi789 |

### Trace Analysis: abc123
\`\`\`
api-gateway [45ms]
└── order-service [123ms]
    └── inventory-service [89ms]
        └── database-query [3,890ms] ⚠️ BOTTLENECK
\`\`\`

### Root Cause Identified
**Database query** in inventory-service taking 3.9s (expected: 50ms)

### Recommendation
Add index on \`inventory.sku\` column to optimize query`,
  },
  {
    question: "Analyze latency correlation across services",
    answer: `## Cross-Service Latency Correlation

### Correlation Matrix
| Service | api-gw | payment | order | auth |
|---------|--------|---------|-------|------|
| api-gateway | 1.00 | 0.85 | 0.78 | 0.82 |
| payment-svc | 0.85 | 1.00 | 0.92 | 0.45 |
| order-svc | 0.78 | 0.92 | 1.00 | 0.56 |
| auth-svc | 0.82 | 0.45 | 0.56 | 1.00 |

### Key Findings
1. **payment-svc ↔ order-svc**: Very high correlation (0.92)
   - When payment latency increases, orders are delayed
2. **api-gateway → all**: Gateway latency affects all downstream

### Propagation Delay Analysis
- api-gateway +100ms → payment-svc +85ms (85% propagation)
- payment-svc +100ms → order-svc +92ms (92% propagation)`,
  },
  {
    question: "Find anomaly correlations in the last hour",
    answer: `## Anomaly Correlation Analysis (Last Hour)

### Detected Anomalies
| Time | Service | Metric | Deviation |
|------|---------|--------|-----------|
| 14:15 | payment-svc | latency | +340% |
| 14:16 | order-svc | error_rate | +560% |
| 14:17 | api-gateway | 5xx | +890% |
| 14:18 | notification | queue_depth | +450% |

### Correlation Clusters
**Cluster 1** (Correlation: 0.94)
- payment-svc latency spike
- order-svc error rate
- api-gateway 5xx

**Cluster 2** (Correlation: 0.78)
- notification queue depth
- email service delays

### Timeline
\`\`\`
14:15 → payment-svc deployment started
14:16 → Errors begin cascading
14:18 → Peak impact
14:25 → Rollback initiated
14:30 → Recovery complete
\`\`\``,
  },
  {
    question: "Show database query correlation with service latency",
    answer: `## Database-Service Latency Correlation

### Query Impact Analysis
| Query Pattern | Avg Time | Service Impact | Correlation |
|---------------|----------|----------------|-------------|
| SELECT orders... | 450ms | order-svc +380ms | 0.89 |
| JOIN inventory... | 890ms | checkout +720ms | 0.94 |
| UPDATE cart... | 120ms | cart-svc +95ms | 0.85 |
| COUNT analytics... | 2.3s | dashboard +1.8s | 0.91 |

### Slow Query Impact
When \`JOIN inventory\` exceeds 500ms:
- checkout-service: +45% latency
- order-service: +23% latency
- api-gateway: +12% p99

### Recommendations
1. Add composite index on \`inventory(sku, warehouse_id)\`
2. Implement query caching for dashboard analytics
3. Consider read replicas for heavy queries`,
  },
  {
    question: "Analyze memory-CPU correlation patterns",
    answer: `## Memory-CPU Correlation Analysis

### Correlation Over Time
| Time Window | Memory-CPU r | GC Impact |
|-------------|--------------|-----------|
| 00:00-06:00 | 0.45 | Low |
| 06:00-12:00 | 0.67 | Medium |
| 12:00-18:00 | 0.89 | High |
| 18:00-24:00 | 0.72 | Medium |

### Peak Hours Analysis (12:00-18:00)
- Memory spikes trigger GC cycles
- Each GC cycle: +15% CPU for 200ms
- 23 major GC events in peak period

### Service Breakdown
| Service | Mem-CPU Correlation | GC Overhead |
|---------|---------------------|-------------|
| order-svc | 0.92 | 18% |
| payment-svc | 0.85 | 12% |
| analytics | 0.78 | 8% |

### Optimization
Increase heap size on order-svc to reduce GC frequency`,
  },
  {
    question: "Find network and latency correlations",
    answer: `## Network-Latency Correlation

### Network Metrics Impact
| Network Event | Latency Impact | Correlation |
|---------------|----------------|-------------|
| Packet loss >0.1% | +156ms p99 | 0.91 |
| RTT increase | +89ms avg | 0.87 |
| Bandwidth saturation | +234ms p95 | 0.82 |
| DNS timeout | +500ms spike | 0.95 |

### Cross-AZ Latency
| Source AZ | Target AZ | Baseline | Current | Delta |
|-----------|-----------|----------|---------|-------|
| us-east-1a | us-east-1b | 2ms | 2.1ms | +5% |
| us-east-1a | us-east-1c | 3ms | 8.5ms | +183% |
| us-east-1b | us-east-1c | 2.5ms | 7.2ms | +188% |

### Alert
**AZ-1c network degradation** affecting cross-AZ communication`,
  },
  {
    question: "Show deployment correlation with errors",
    answer: `## Deployment-Error Correlation

### Recent Deployments
| Time | Service | Version | Error Spike |
|------|---------|---------|-------------|
| 14:00 | payment-svc | v2.3.1 | +340% |
| 13:00 | auth-svc | v1.8.0 | +5% |
| 12:00 | order-svc | v3.1.2 | None |
| 11:00 | api-gateway | v2.0.5 | None |

### payment-svc v2.3.1 Impact
\`\`\`
Deployment: 14:00:00
First Error: 14:00:45
Peak Errors: 14:02:30 (340% increase)
Rollback: 14:15:00
Recovery: 14:17:00
\`\`\`

### Correlation Analysis
- 85% of error spikes occur within 5min of deployment
- payment-svc has highest deployment-error correlation (0.92)

### Recommendation
Implement canary deployment with 5% traffic for payment-svc`,
  },
  {
    question: "Analyze cache hit correlation with performance",
    answer: `## Cache-Performance Correlation

### Cache Hit Rate Impact
| Cache Hit Rate | Avg Latency | DB Load | User Impact |
|----------------|-------------|---------|-------------|
| 95%+ | 45ms | Low | Excellent |
| 85-95% | 89ms | Medium | Good |
| 75-85% | 178ms | High | Degraded |
| <75% | 450ms+ | Critical | Poor |

### Current Status by Service
| Service | Hit Rate | Latency | Trend |
|---------|----------|---------|-------|
| session-cache | 94% | 12ms | Stable |
| product-cache | 82% | 156ms | ↓ Degrading |
| user-cache | 91% | 34ms | Stable |

### Correlation Findings
- 1% cache hit drop → 15ms latency increase
- Product cache degradation correlates with DB CPU spike (r=0.89)

### Action Required
Increase product-cache TTL or memory allocation`,
  },
  {
    question: "Find error propagation patterns",
    answer: `## Error Propagation Analysis

### Propagation Chain (Last Incident)
\`\`\`
[Root] database-primary (connection timeout)
  ├──[+2s] user-service (query failure)
  │    └──[+1s] auth-service (user lookup failed)
  │         └──[+0.5s] api-gateway (401 errors)
  └──[+3s] order-service (transaction failed)
       └──[+1s] notification-service (order failed email)
\`\`\`

### Propagation Statistics
| Origin | Affected Services | Avg Propagation Time |
|--------|-------------------|---------------------|
| database | 6 services | 4.2s |
| redis | 4 services | 2.1s |
| auth-svc | 3 services | 1.5s |
| payment-svc | 2 services | 0.8s |

### Recommendations
1. Add circuit breaker at database layer
2. Implement fallback for auth-service
3. Async error handling for notifications`,
  },
  {
    question: "Show log volume correlation with incidents",
    answer: `## Log Volume-Incident Correlation

### Log Spike Analysis
| Time | Log Volume | Incident | Correlation |
|------|------------|----------|-------------|
| 14:00 | 45K/min | Deployment error | 0.94 |
| 13:30 | 23K/min | Normal | - |
| 13:00 | 67K/min | Memory leak | 0.88 |
| 12:30 | 25K/min | Normal | - |

### Log Volume Patterns
- Normal: 20-30K logs/min
- Warning: 40-60K logs/min
- Critical: >60K logs/min

### Predictive Signals
Log volume increase precedes incidents by avg 2.5 minutes:
- 78% accuracy for predicting error spikes
- 65% accuracy for predicting latency issues

### Auto-Detection Rule
\`\`\`
IF log_rate > 2x baseline for 60s
THEN trigger_anomaly_investigation()
\`\`\``,
  },
  {
    question: "Analyze request rate correlation with resource usage",
    answer: `## Request-Resource Correlation

### Current Correlations
| Metric | Requests/s Correlation |
|--------|------------------------|
| CPU Usage | 0.92 |
| Memory Usage | 0.78 |
| Network I/O | 0.95 |
| Disk I/O | 0.45 |

### Scaling Analysis
| Request Rate | CPU | Memory | Recommended |
|--------------|-----|--------|-------------|
| 1K/s | 25% | 40% | 2 replicas |
| 2K/s | 50% | 55% | 3 replicas |
| 5K/s | 85% | 75% | 5 replicas |
| 10K/s | 95% | 90% | 8 replicas |

### Auto-Scaling Trigger
When request rate >3K/s for 2min:
- Scale up payment-svc by 2 replicas
- Scale up order-svc by 1 replica

### Current Status
Request rate: 4.2K/s → Scale up recommended`,
  },
  {
    question: "Find correlation between external API and internal latency",
    answer: `## External API Impact Analysis

### External Dependencies
| API | Avg Latency | Our Latency | Correlation |
|-----|-------------|-------------|-------------|
| Stripe | 234ms | +198ms | 0.91 |
| SendGrid | 89ms | +45ms | 0.72 |
| Twilio | 156ms | +123ms | 0.85 |
| AWS S3 | 45ms | +12ms | 0.45 |

### Impact When External API Degrades
**Stripe latency +100ms:**
- checkout latency: +95ms
- payment success rate: -2%
- user abandonment: +5%

### Mitigation Strategies
1. Add timeout of 2s for all external APIs
2. Implement async processing for non-critical calls
3. Cache SendGrid templates locally

### Current Alerts
Stripe latency currently at 450ms (normal: 234ms)`,
  },
  {
    question: "Show queue depth correlation with processing latency",
    answer: `## Queue-Processing Correlation

### Queue Analysis
| Queue | Depth | Process Time | Lag | Status |
|-------|-------|--------------|-----|--------|
| orders | 1,234 | 45ms/msg | 2min | Warning |
| notifications | 5,678 | 12ms/msg | 5min | Critical |
| analytics | 234 | 89ms/msg | 30s | Normal |

### Correlation Findings
- Queue depth increase → Processing latency increase
- 1000 msg queue increase → +23% processing time

### Backpressure Impact
\`\`\`
Queue depth > 5000:
├── Consumer CPU: +45%
├── Memory: +30%
├── Process time: +67%
└── Error rate: +12%
\`\`\`

### Recommendations
1. Scale notification consumers from 3 to 6
2. Enable batch processing for analytics queue
3. Implement backpressure at producer level`,
  },
  {
    question: "Analyze pod restart correlation with performance",
    answer: `## Pod Restart Correlation Analysis

### Recent Restarts
| Pod | Restarts | Reason | Performance Impact |
|-----|----------|--------|-------------------|
| order-svc-abc | 5 | OOMKilled | -23% throughput |
| payment-svc-def | 2 | Liveness fail | +340ms latency |
| cache-svc-ghi | 8 | CrashLoop | -45% hit rate |

### Correlation with Incidents
| Restart Type | Incident Correlation | Avg Recovery |
|--------------|---------------------|--------------|
| OOMKilled | 0.89 | 45s |
| Liveness | 0.76 | 30s |
| CrashLoop | 0.95 | 5min |

### Impact Chain
\`\`\`
Pod restart → Cold start → Cache empty → DB pressure → Latency spike
\`\`\`

### Recommendations
1. Increase memory limits for order-svc (+25%)
2. Tune liveness probe for payment-svc
3. Fix CrashLoop in cache-svc (check logs)`,
  },
  {
    question: "Find user journey correlation with errors",
    answer: `## User Journey Error Correlation

### Journey Stages
| Stage | Error Rate | Abandonment | Correlation |
|-------|------------|-------------|-------------|
| Browse | 0.1% | 5% | Baseline |
| Add to Cart | 0.5% | 12% | 0.78 |
| Checkout | 2.3% | 45% | 0.95 |
| Payment | 1.8% | 67% | 0.92 |

### Critical Path Analysis
\`\`\`
Login → Browse → Cart → Checkout → Payment → Confirmation
  ↓        ↓       ↓        ↓          ↓
 0.2%    0.1%    0.5%     2.3%       1.8%    (Error rate)
  ↓        ↓       ↓        ↓          ↓
 2%       5%     12%      45%        67%     (Abandonment if error)
\`\`\`

### Business Impact
- Each 1% checkout error → $12,340 lost revenue/day
- Payment errors have highest correlation with churn (r=0.92)

### Priority Actions
1. Reduce checkout errors (target: <1%)
2. Improve payment retry logic
3. Add error recovery UX`,
  },
  {
    question: "Show infrastructure cost correlation",
    answer: `## Cost-Performance Correlation

### Resource Efficiency
| Service | Cost/hr | Requests/hr | Cost/1K req |
|---------|---------|-------------|-------------|
| payment-svc | $12.50 | 45,000 | $0.28 |
| order-svc | $8.20 | 67,000 | $0.12 |
| analytics | $23.40 | 12,000 | $1.95 |
| api-gateway | $5.60 | 234,000 | $0.02 |

### Cost Anomalies
| Service | Expected | Actual | Variance |
|---------|----------|--------|----------|
| analytics | $15/hr | $23.40/hr | +56% |
| payment-svc | $10/hr | $12.50/hr | +25% |

### Correlation Findings
- Analytics cost spike correlates with unoptimized queries (r=0.89)
- Payment cost increase correlates with retry storms (r=0.82)

### Optimization Opportunities
1. Optimize analytics queries: Save $8/hr
2. Fix payment retries: Save $2.50/hr
3. Right-size api-gateway: Save $1.20/hr`,
  },
  {
    question: "Analyze SSL certificate expiry correlation",
    answer: `## Certificate-Incident Correlation

### Certificate Status
| Domain | Expiry | Days Left | Risk |
|--------|--------|-----------|------|
| api.telemetryflow.id | Mar 15 | 41 | Low |
| pay.telemetryflow.id | Feb 20 | 18 | Medium |
| admin.telemetryflow.id | Feb 10 | 8 | High |

### Historical Incidents
| Date | Domain | Issue | Impact |
|------|--------|-------|--------|
| Jan 5 | cdn.telemetryflow.id | Expired | 2hr outage |
| Dec 12 | webhook.telemetryflow.id | Expired | Failed callbacks |

### Correlation Analysis
- Certificate expiry → 100% service outage
- Warning at 14 days prevents 95% of incidents

### Auto-Renewal Status
| Domain | Auto-Renew | Last Check |
|--------|------------|------------|
| api.telemetryflow.id | Enabled | 1hr ago |
| pay.telemetryflow.id | Enabled | 1hr ago |
| admin.telemetryflow.id | **Disabled** | - |

### Action Required
Enable auto-renewal for admin.telemetryflow.id`,
  },
  {
    question: "Find traffic pattern correlation with incidents",
    answer: `## Traffic-Incident Correlation

### Weekly Pattern
| Day | Avg Traffic | Incidents | Correlation |
|-----|-------------|-----------|-------------|
| Monday | 125% | 4.2 | 0.85 |
| Tuesday | 100% | 2.1 | Baseline |
| Wednesday | 95% | 1.8 | -0.12 |
| Thursday | 98% | 2.0 | Baseline |
| Friday | 110% | 3.1 | 0.67 |
| Saturday | 65% | 0.5 | -0.45 |
| Sunday | 55% | 0.3 | -0.52 |

### Peak Hour Analysis
| Hour | Traffic | Error Rate | Action |
|------|---------|------------|--------|
| 09:00 | 145% | 0.8% | Scale up |
| 12:00 | 130% | 0.5% | Monitor |
| 15:00 | 120% | 0.4% | Normal |
| 18:00 | 85% | 0.2% | Scale down |

### Predictive Actions
- Monday 9AM: Pre-scale by 50%
- Friday afternoon: Enable rate limiting standby
- Weekend: Reduce to minimum replicas`,
  },
  {
    question: "Show database connection pool correlation",
    answer: `## Connection Pool Correlation

### Pool Status
| Database | Active | Max | Wait Time | Correlation |
|----------|--------|-----|-----------|-------------|
| primary | 45 | 50 | 234ms | 0.92 |
| replica-1 | 23 | 50 | 12ms | 0.34 |
| replica-2 | 21 | 50 | 8ms | 0.28 |

### Connection Exhaustion Impact
| Pool % Used | Latency | Error Rate |
|-------------|---------|------------|
| 50% | Baseline | 0.1% |
| 75% | +45ms | 0.3% |
| 90% | +234ms | 2.1% |
| 100% | Timeout | 15%+ |

### Correlation with Service Performance
Primary pool at 90%:
- order-service: +180ms latency (r=0.95)
- payment-service: +120ms latency (r=0.89)
- auth-service: +45ms latency (r=0.78)

### Recommendations
1. Increase primary pool to 75 connections
2. Route read queries to replicas
3. Implement connection pooling middleware`,
  },
  {
    question: "Analyze GC pause correlation with user experience",
    answer: `## GC-User Experience Correlation

### GC Impact Analysis
| GC Type | Duration | User Impact | Correlation |
|---------|----------|-------------|-------------|
| Minor GC | 5-15ms | Minimal | 0.12 |
| Major GC | 100-500ms | Noticeable | 0.78 |
| Full GC | 500ms-2s | Severe | 0.95 |

### Service Impact
| Service | GC Frequency | User Latency Impact |
|---------|--------------|---------------------|
| order-svc | 12/min | +89ms p99 |
| payment-svc | 8/min | +45ms p99 |
| search-svc | 15/min | +123ms p99 |

### User Journey Impact
\`\`\`
Full GC during checkout:
├── Page freeze: 800ms avg
├── User abandonment: +15%
├── Failed transactions: +3%
└── Support tickets: +8%
\`\`\`

### Optimization
1. Increase heap size for order-svc (reduces Major GC by 60%)
2. Tune G1GC parameters for payment-svc
3. Enable concurrent GC for search-svc`,
  },
  {
    question: "Find load balancer health correlation",
    answer: `## Load Balancer Health Correlation

### Backend Health Check Results
| Backend | Healthy | Unhealthy | Degraded | Impact |
|---------|---------|-----------|----------|--------|
| api-1 | 98% | 0% | 2% | Low |
| api-2 | 95% | 2% | 3% | Medium |
| api-3 | 87% | 8% | 5% | High |

### Correlation with Traffic Distribution
When api-3 unhealthy:
- api-1 load: +45%
- api-2 load: +38%
- Overall latency: +67ms

### Health Check Failures
| Backend | Failure Type | Count/hr | Correlation with Outage |
|---------|--------------|----------|------------------------|
| api-3 | Timeout | 23 | 0.89 |
| api-3 | 5xx | 12 | 0.95 |
| api-2 | Timeout | 5 | 0.45 |

### Recommendations
1. Investigate api-3 timeout issues
2. Increase health check timeout from 2s to 5s
3. Add circuit breaker before removing from pool`,
  },
  {
    question: "Show alert correlation analysis",
    answer: `## Alert Correlation Analysis

### Correlated Alert Groups
**Group 1: Database Chain** (Correlation: 0.94)
- DB_CONNECTION_EXHAUSTED
- API_LATENCY_HIGH
- ORDER_SERVICE_DEGRADED

**Group 2: Memory Chain** (Correlation: 0.89)
- MEMORY_USAGE_HIGH
- GC_PAUSE_EXCEEDED
- SERVICE_RESTART

**Group 3: Network Chain** (Correlation: 0.87)
- NETWORK_LATENCY_HIGH
- CROSS_AZ_DEGRADED
- REPLICA_LAG_HIGH

### Alert Deduplication Opportunities
| Alert Pair | Correlation | Suggested Action |
|------------|-------------|------------------|
| CPU_HIGH + GC_HIGH | 0.92 | Merge |
| LATENCY + TIMEOUT | 0.88 | Group |
| OOM + RESTART | 0.96 | Root cause only |

### Recommendations
1. Create alert correlation rules
2. Suppress downstream alerts for 5min
3. Show root cause alert only`,
  },
  {
    question: "Analyze API versioning correlation with errors",
    answer: `## API Version Error Correlation

### Version Distribution
| Version | Traffic | Error Rate | Correlation |
|---------|---------|------------|-------------|
| v1 (deprecated) | 5% | 2.3% | 0.89 |
| v2 (current) | 85% | 0.3% | Baseline |
| v3 (beta) | 10% | 0.8% | 0.45 |

### Deprecation Impact
| Deprecated Endpoint | Calls/hr | Error Rate |
|--------------------|----------|------------|
| /v1/orders/create | 234 | 3.4% |
| /v1/payment/process | 156 | 4.1% |
| /v1/auth/login | 89 | 1.2% |

### Migration Analysis
- 67% of v1 errors are from deprecated methods
- v2 migration reduces errors by 87%

### Recommendations
1. Force migrate /v1/payment/process (highest impact)
2. Add deprecation warnings to remaining v1 endpoints
3. Set sunset date for v1: March 31`,
  },
  {
    question: "Find container resource correlation",
    answer: `## Container Resource Correlation

### Resource Relationships
| Container | CPU-Mem Correlation | Net-IO Correlation |
|-----------|--------------------|--------------------|
| api-pod | 0.78 | 0.92 |
| worker-pod | 0.45 | 0.34 |
| cache-pod | 0.89 | 0.67 |

### Resource Contention Analysis
| Pod | Resource | Contention Level | Impact |
|-----|----------|------------------|--------|
| api-pod | CPU | High | +45ms latency |
| worker-pod | Memory | Medium | +12% GC |
| cache-pod | Network | Low | Normal |

### Node-Level Correlation
When node CPU > 80%:
- All pods: +23% latency
- Eviction risk: 15%
- Scheduling delays: +5s

### Right-Sizing Recommendations
| Pod | Current | Recommended | Savings |
|-----|---------|-------------|---------|
| api-pod | 2 CPU | 1.5 CPU | $45/day |
| worker-pod | 4Gi Mem | 3Gi Mem | $23/day |
| cache-pod | 1 CPU | 0.5 CPU | $12/day |`,
  },
  {
    question: "Show service mesh correlation metrics",
    answer: `## Service Mesh Correlation

### mTLS Impact
| Connection Type | Latency Overhead | Error Rate |
|----------------|------------------|------------|
| No mTLS | Baseline | 0.5% |
| mTLS enabled | +3ms | 0.3% |
| Certificate rotation | +12ms spike | 0.1% |

### Sidecar Correlation
| Service | Sidecar CPU | Latency Impact | Correlation |
|---------|-------------|----------------|-------------|
| api-gateway | 5% | +2ms | 0.45 |
| payment-svc | 8% | +5ms | 0.67 |
| order-svc | 12% | +8ms | 0.82 |

### Circuit Breaker Effectiveness
| Circuit | Trips/hr | Protected Errors | Savings |
|---------|----------|------------------|---------|
| payment→stripe | 3 | 456 | 98% |
| order→inventory | 8 | 234 | 95% |
| auth→ldap | 1 | 89 | 99% |

### Mesh Optimization
1. Reduce order-svc sidecar resource limits
2. Enable connection pooling for payment-svc
3. Tune circuit breaker thresholds`,
  },
];

export const CORRELATIONS_CONVERSATION_TITLES: string[] = [
  "Cross-signal anomaly detection",
  "Metrics-logs correlation for errors",
  "Trace-to-log linking analysis",
  "Multi-service incident correlation",
  "Exemplar-based root cause analysis",
  "Spike correlation across metrics and traces",
  "Database slow-query correlation with logs",
  "Deployment event impact correlation",
  "Alert-to-trace drill-down workflow",
  "Service dependency failure propagation",
];
