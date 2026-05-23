/**
 * LLM Mock Data - Logs
 * TASK-11: Mock data for logs-related AI insights
 */

import type { MockQA } from "./llm-metrics";

export const LOGS_MOCK_DATA: MockQA[] = [
  {
    question: "Find error patterns in the last hour",
    answer: `## Log Error Pattern Analysis

### Time Range: Last 60 minutes
- **Total Logs**: 1,247,832
- **Error Logs**: 3,847 (0.31%)
- **Unique Error Patterns**: 12

### Top Error Patterns

| # | Pattern | Count | Services | Severity |
|---|---------|-------|----------|----------|
| 1 | \`Connection refused to redis-cluster:6379\` | 1,245 | cart-service, session-service | Critical |
| 2 | \`JWT token expired\` | 892 | auth-gateway | Warning |
| 3 | \`Timeout waiting for response from payment-api\` | 456 | checkout-service | Error |
| 4 | \`Failed to parse order JSON\` | 234 | order-processor | Error |
| 5 | \`Database connection pool exhausted\` | 187 | inventory-service | Critical |

### Pattern #1: Redis Connection Issues (Critical)

**First Occurrence**: 14:23:47 UTC
**Affected Services**: cart-service (623), session-service (622)

**Sample Log**:
\`\`\`json
{
  "timestamp": "2025-02-02T14:23:47.123Z",
  "level": "ERROR",
  "service": "cart-service",
  "trace_id": "abc123def456",
  "message": "Connection refused to redis-cluster:6379",
  "error": "ECONNREFUSED",
  "retry_attempt": 3
}
\`\`\`

**Correlation**: Redis pod \`redis-cluster-0\` restarted at 14:23:45 UTC

### Recommendations
1. **Redis**: Check pod health, increase connection timeout
2. **JWT**: Implement token refresh 5 min before expiry
3. **Payment API**: Add circuit breaker with 30s timeout
4. **Database**: Increase pool size from 10 to 25 connections`,
  },
  {
    question: "What caused the 5xx errors on API gateway?",
    answer: `## API Gateway 5xx Error Investigation

### Error Summary
- **Total 5xx Errors**: 2,341 in last 30 minutes
- **Error Rate**: 4.7% (threshold: 1%)
- **Affected Endpoints**: 8 of 47

### Error Distribution

| Status | Count | Percentage | Primary Cause |
|--------|-------|------------|---------------|
| 502 | 1,567 | 67% | Upstream timeout |
| 503 | 589 | 25% | Service unavailable |
| 504 | 185 | 8% | Gateway timeout |

### Timeline Analysis

\`\`\`
14:15:00 - Normal operation (0.2% error rate)
14:17:23 - payment-service deployment started
14:17:45 - First 502 errors appear
14:18:02 - Error rate spikes to 12%
14:19:30 - payment-service rollout complete
14:21:00 - Error rate stabilizes at 4.7%
\`\`\`

### Root Cause
**Deployment without proper readiness probe wait time**

The payment-service deployment rolled out new pods before they were fully ready:
- Readiness probe: HTTP /health (success after 8s)
- Traffic routed: after 2s (too early)
- Result: 502 errors during pod initialization

### Affected Trace IDs
\`\`\`
trace_id: 7f8a9b2c3d4e5f6a → /api/v1/checkout/submit (502)
trace_id: 1a2b3c4d5e6f7g8h → /api/v1/payment/process (502)
trace_id: 9i8j7k6l5m4n3o2p → /api/v1/order/create (503)
\`\`\`

### Remediation
1. Increase \`minReadySeconds\` from 0 to 10
2. Add \`initialDelaySeconds: 15\` to readiness probe
3. Implement graceful shutdown with 30s termination period`,
  },
  {
    question: "Find authentication failures in the last 24 hours",
    answer: `## Authentication Failure Analysis

### Summary
- **Total Auth Attempts**: 234,567
- **Failed Attempts**: 4,892 (2.1%)
- **Unique IPs**: 1,234
- **Blocked IPs**: 23

### Failure Breakdown
| Reason | Count | Percentage |
|--------|-------|------------|
| Invalid credentials | 3,245 | 66% |
| Expired token | 892 | 18% |
| Rate limited | 456 | 9% |
| Account locked | 234 | 5% |
| MFA failed | 65 | 1% |

### Geographic Distribution
| Country | Attempts | Failures | Rate |
|---------|----------|----------|------|
| United States | 123,456 | 1,234 | 1.0% |
| Germany | 45,678 | 567 | 1.2% |
| Unknown | 12,345 | 2,345 | 19% |

### Suspicious Activity Detected
- **IP 192.168.1.100**: 456 failed attempts (brute force pattern)
- **User "admin@telemetryflow.id"**: 89 attempts from 12 different IPs
- **Geo anomaly**: User logged from US then EU within 5 minutes

### Recommendations
1. Block IP 192.168.1.100 permanently
2. Force password reset for admin@telemetryflow.id
3. Enable impossible travel detection`,
  },
  {
    question: "Search for database slow query logs",
    answer: `## Slow Query Log Analysis

### Summary (Last 1 hour)
- **Total Queries**: 45,678
- **Slow Queries (>1s)**: 234 (0.5%)
- **Very Slow (>5s)**: 12 (0.03%)

### Top Slow Queries
| Query Pattern | Avg Time | Max Time | Count |
|--------------|----------|----------|-------|
| SELECT * FROM orders WHERE user_id... | 3.4s | 8.2s | 89 |
| UPDATE inventory SET quantity... | 2.1s | 4.5s | 45 |
| SELECT COUNT(*) FROM logs WHERE... | 8.7s | 15.3s | 12 |
| JOIN orders o, products p WHERE... | 1.8s | 3.2s | 34 |

### Query Analysis: Slowest Query
\`\`\`sql
SELECT COUNT(*) FROM logs
WHERE created_at > '2025-01-01'
AND level = 'ERROR'
-- Execution time: 8.7s avg, 15.3s max
-- Rows scanned: 12.4M
-- Index used: None (full table scan)
\`\`\`

### Missing Indexes Detected
\`\`\`sql
-- Recommended index for orders table
CREATE INDEX idx_orders_user_status
ON orders(user_id, status);

-- Recommended index for logs table
CREATE INDEX idx_logs_created_level
ON logs(created_at, level);
\`\`\`

### Recommendations
1. Add recommended indexes
2. Partition logs table by month
3. Enable query plan caching`,
  },
  {
    question: "Find logs related to payment failures",
    answer: `## Payment Failure Logs

### Summary
- **Time Range**: Last 2 hours
- **Total Payment Attempts**: 12,456
- **Failed Payments**: 234 (1.9%)

### Failure Reasons
| Error Code | Message | Count | Percentage |
|------------|---------|-------|------------|
| PAY_001 | Card declined | 123 | 53% |
| PAY_002 | Insufficient funds | 56 | 24% |
| PAY_003 | Gateway timeout | 34 | 15% |
| PAY_004 | Invalid card number | 21 | 9% |

### Gateway-Specific Errors
| Gateway | Failures | Rate | Status |
|---------|----------|------|--------|
| Stripe | 156 | 1.2% | ✅ Normal |
| PayPal | 45 | 3.4% | ⚠️ Elevated |
| Braintree | 33 | 1.8% | ✅ Normal |

### Sample Error Log
\`\`\`json
{
  "timestamp": "2025-02-02T14:23:45.123Z",
  "level": "ERROR",
  "service": "payment-service",
  "error_code": "PAY_003",
  "trace_id": "abc123def456",
  "gateway": "paypal",
  "latency_ms": 30245,
  "message": "Gateway timeout after 30s",
  "order_id": "ORD-12345",
  "amount": 99.99
}
\`\`\`

### Recommendations
1. Investigate PayPal gateway health
2. Implement retry with exponential backoff
3. Add fallback gateway for timeouts`,
  },
  {
    question: "Show me exception stack traces from order-service",
    answer: `## Exception Analysis: order-service

### Top Exceptions (Last 6 hours)
| Exception | Count | First Seen | Last Seen |
|-----------|-------|------------|-----------|
| NullPointerException | 234 | 08:23 UTC | 14:45 UTC |
| ConnectionTimeoutException | 89 | 09:45 UTC | 14:30 UTC |
| JsonParseException | 45 | 10:12 UTC | 14:15 UTC |
| ValidationException | 23 | 11:30 UTC | 14:40 UTC |

### Stack Trace: NullPointerException
\`\`\`
java.lang.NullPointerException: Cannot invoke method on null object
  at com.example.order.service.OrderService.processOrder(OrderService.java:142)
  at com.example.order.controller.OrderController.createOrder(OrderController.java:67)
  at sun.reflect.NativeMethodAccessorImpl.invoke(Native Method)
  at org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:897)
\`\`\`

### Root Cause Analysis
\`\`\`java
// OrderService.java:142
public void processOrder(Order order) {
    Customer customer = order.getCustomer();
    Address address = customer.getAddress(); // NPE when customer is null
    // ...
}
\`\`\`

**Issue**: Missing null check on customer.getAddress()

### Fix Recommendation
\`\`\`java
public void processOrder(Order order) {
    Customer customer = order.getCustomer();
    if (customer == null || customer.getAddress() == null) {
        throw new ValidationException("Customer address is required");
    }
    // ...
}
\`\`\``,
  },
  {
    question: "Count errors by service",
    answer: `## Error Count by Service (Last 1 hour)

### Overview
| Service | Errors | % of Total | Trend | Status |
|---------|--------|------------|-------|--------|
| payment-svc | 456 | 35% | ↑ +45% | 🔴 Critical |
| order-svc | 289 | 22% | → | ⚠️ Warning |
| auth-svc | 178 | 14% | ↓ -8% | ✅ Normal |
| cart-svc | 123 | 10% | → | ✅ Normal |
| search-svc | 89 | 7% | → | ✅ Normal |
| inventory-svc | 78 | 6% | ↑ +12% | ⚠️ Warning |
| other | 82 | 6% | → | ✅ Normal |

### Error Rate Comparison
| Service | Current | Baseline | Deviation |
|---------|---------|----------|-----------|
| payment-svc | 1.2% | 0.3% | +300% |
| order-svc | 0.5% | 0.4% | +25% |
| auth-svc | 0.2% | 0.2% | 0% |

### Recommended Actions
1. **Immediate**: Investigate payment-svc spike
2. **Today**: Review order-svc error patterns
3. **This week**: Audit inventory-svc degradation`,
  },
  {
    question: "Find timeout errors",
    answer: `## Timeout Error Analysis

### Summary
**Total Timeouts**: 234 in last hour

### By Source-Target
| Source | Target | Count | Avg Wait | Max Wait |
|--------|--------|-------|----------|----------|
| api-gw | payment-svc | 89 | 31.2s | 60s |
| order-svc | inventory-svc | 67 | 15.4s | 30s |
| checkout | fraud-api | 45 | 28.7s | 45s |
| auth-svc | user-db | 33 | 10.2s | 15s |

### Timeout Configuration
| Service | Timeout | Recommended |
|---------|---------|-------------|
| payment-svc | 60s | 30s |
| inventory-svc | 30s | 15s |
| fraud-api | 45s | 20s |
| user-db | 15s | 10s |

### Pattern Analysis
- Peak timeouts: 14:00-14:30 UTC (deployment window)
- Correlation with high CPU on inventory-svc: 0.89

### Recommendations
1. Reduce payment-svc timeout to 30s
2. Add circuit breaker for fraud-api
3. Scale inventory-svc during peak hours`,
  },
  {
    question: "Show warning logs",
    answer: `## Warning Logs Summary

### Overview
**Total Warnings**: 1,234 in last hour

### By Category
| Category | Count | % | Sample Message |
|----------|-------|---|----------------|
| Slow query | 456 | 37% | query_time > 1s |
| High memory | 234 | 19% | heap usage > 80% |
| Retry attempt | 189 | 15% | retry_count > 2 |
| Rate limit | 156 | 13% | requests > threshold |
| Deprecation | 89 | 7% | using deprecated API |
| Config issue | 67 | 5% | missing optional config |
| Other | 43 | 4% | various |

### Top Warning Messages
| Message | Count | Service |
|---------|-------|---------|
| "Query execution exceeded 1s" | 234 | db-service |
| "Heap usage at 85%" | 156 | order-svc |
| "Retry attempt 3 of 5" | 123 | payment-svc |
| "Rate limit 80% reached" | 89 | api-gateway |

### Trends
- Slow query warnings ↑ 23% from yesterday
- Memory warnings stable
- Retry attempts ↓ 12% from yesterday`,
  },
  {
    question: "Search logs for user ID",
    answer: `## Logs for user_id: usr_12345

### Summary
**Found**: 23 log entries (last 24 hours)

### Activity Timeline
| Time | Service | Level | Message |
|------|---------|-------|---------|
| 14:23:45 | auth | INFO | Login success |
| 14:24:12 | cart | INFO | Added item SKU-789 |
| 14:24:34 | cart | INFO | Updated quantity |
| 14:25:33 | checkout | INFO | Checkout started |
| 14:25:45 | payment | ERROR | Payment failed (PAY_001) |
| 14:26:01 | payment | INFO | Retry initiated |
| 14:26:15 | payment | INFO | Payment success |
| 14:26:23 | order | INFO | Order created ORD-12345 |
| 14:27:01 | notify | INFO | Email sent |

### Session Details
- **IP Address**: 192.168.1.50
- **User Agent**: Chrome/120.0.0.0
- **Session Duration**: 12 minutes
- **Actions Performed**: 9

### Related Trace IDs
\`\`\`
Login: trace_id=abc123
Cart: trace_id=def456
Checkout: trace_id=ghi789
\`\`\``,
  },
  {
    question: "Find security-related logs",
    answer: `## Security Logs Analysis

### Suspicious Events (Last 24 hours)
| Event | Count | Severity |
|-------|-------|----------|
| Failed login (>5 attempts) | 8 | High |
| Unusual IP location | 3 | Medium |
| Invalid API key | 1 | Low |
| Privilege escalation attempt | 2 | Critical |
| SQL injection attempt | 12 | High |

### Detailed Findings

#### Brute Force Attempts
| IP Address | Attempts | Target | Status |
|------------|----------|--------|--------|
| 185.x.x.x | 456 | /api/login | Blocked |
| 203.x.x.x | 234 | /api/login | Blocked |
| 91.x.x.x | 123 | /api/admin | Blocked |

#### SQL Injection Attempts
\`\`\`
[14:23:45] GET /api/users?id=1' OR '1'='1
[14:24:12] POST /api/search body: {"q": "'; DROP TABLE users;--"}
\`\`\`

### WAF Actions
- **Auto-Blocked**: 23 IPs
- **Rules Triggered**: 45 times
- **False Positives**: 2

### Recommendations
1. Enable 2FA for admin accounts
2. Implement CAPTCHA after 3 failures
3. Review WAF false positive rules`,
  },
  {
    question: "Show deployment logs",
    answer: `## Deployment Logs

### Last Deployment
**Service**: payment-service
**Version**: v2.3.1
**Time**: 14:30:00 UTC
**Duration**: 3 minutes
**Status**: ✅ Success

### Deployment Timeline
\`\`\`
14:30:00 - Deployment initiated by @john
14:30:05 - Image pull started
14:30:15 - Image pulled successfully
14:30:20 - Health check passed on pod-1
14:30:45 - Rolling update initiated
14:31:00 - Pod payment-old-1 terminating
14:31:23 - Pod payment-new-1 ready
14:32:01 - Pod payment-new-2 ready
14:32:45 - Pod payment-new-3 ready
14:33:00 - Deployment complete
14:33:05 - Smoke tests passed
\`\`\`

### Resource Changes
| Resource | Before | After |
|----------|--------|-------|
| Replicas | 3 | 3 |
| CPU limit | 1000m | 1500m |
| Memory limit | 1Gi | 1.5Gi |

### Rollback Available
\`\`\`bash
kubectl rollout undo deployment/payment-service
\`\`\``,
  },
  {
    question: "Audit log summary",
    answer: `## Audit Log Summary

### Period: Last 24 hours
### Total Events: 4,567

### By Action Type
| Action | Count | Users | Risk |
|--------|-------|-------|------|
| config.update | 23 | 3 | Medium |
| user.create | 12 | 2 | Low |
| role.assign | 8 | 2 | High |
| api_key.rotate | 5 | 1 | Medium |
| secret.access | 45 | 8 | High |
| permission.grant | 3 | 1 | Critical |

### High-Risk Actions
| Time | User | Action | Details |
|------|------|--------|---------|
| 14:23 | admin | permission.grant | Added admin role |
| 12:45 | john | secret.access | Accessed DB creds |
| 10:12 | sarah | config.update | Changed rate limits |

### User Activity
| User | Actions | Last Active |
|------|---------|-------------|
| admin | 156 | 2 min ago |
| john | 89 | 15 min ago |
| sarah | 67 | 1 hour ago |

### Compliance
- **SOC2 relevant events**: 234
- **GDPR data access**: 45
- **PCI audit trail**: 89`,
  },
  {
    question: "Find memory-related errors",
    answer: `## Memory Error Analysis

### OOM Events (Last 6 hours)
| Pod | Time | Memory at OOM | Limit |
|-----|------|---------------|-------|
| order-processor-abc | 14:23 | 512Mi/512Mi | 512Mi |
| notification-xyz | 12:45 | 256Mi/256Mi | 256Mi |
| analytics-job-def | 11:12 | 1Gi/1Gi | 1Gi |
| report-gen-ghi | 09:34 | 512Mi/512Mi | 512Mi |

### Memory Pressure Warnings
| Service | Current | Limit | Status |
|---------|---------|-------|--------|
| order-svc | 1.8GB | 2GB | ⚠️ 90% |
| payment-svc | 1.2GB | 2GB | ✅ 60% |
| cart-svc | 890MB | 1GB | ⚠️ 89% |

### Heap Dump Analysis
\`\`\`
order-processor heap dump:
- Top consumer: OrderCache (456MB)
- Suspected leak: UnreleasedConnections (234MB)
- GC overhead: 23% of CPU
\`\`\`

### Recommendations
1. Increase order-processor memory limit to 1Gi
2. Fix connection leak in order-processor
3. Add memory alerts at 80% threshold`,
  },
  {
    question: "Find rate limiting events",
    answer: `## Rate Limiting Events

### Summary (Last 1 hour)
- **Total Rate Limited**: 1,234 requests
- **Unique Clients**: 45
- **Endpoints Affected**: 12

### By Endpoint
| Endpoint | Limited | Limit | Period |
|----------|---------|-------|--------|
| /api/search | 567 | 100/s | Per IP |
| /api/login | 234 | 5/min | Per User |
| /api/export | 189 | 10/hr | Per User |
| /api/webhook | 123 | 1000/hr | Per Key |

### Top Rate Limited Clients
| Client | Requests | Limited | Status |
|--------|----------|---------|--------|
| api-key-123 | 12,456 | 567 | ⚠️ Review |
| IP 10.0.1.45 | 8,901 | 234 | Legitimate |
| api-key-456 | 5,678 | 189 | ⚠️ Review |

### Rate Limit Configuration
\`\`\`yaml
rate_limits:
  global: 10000/min
  per_ip: 100/s
  per_user: 1000/min
  per_api_key: 5000/hr
\`\`\`

### Recommendations
1. Review api-key-123 usage pattern
2. Consider increasing /api/search limit
3. Add graduated response for repeat offenders`,
  },
  {
    question: "Search for correlation IDs",
    answer: `## Correlation ID Search

### Query: correlation_id = "corr-abc123"

### Found: 45 log entries across 8 services

### Request Flow
\`\`\`
[14:23:45.001] api-gateway     → Request received
[14:23:45.012] auth-service    → Token validated
[14:23:45.034] order-service   → Order created
[14:23:45.089] inventory-svc   → Stock checked
[14:23:45.234] payment-service → Payment initiated
[14:23:47.456] payment-service → Payment completed
[14:23:47.567] notify-service  → Email queued
[14:23:47.890] order-service   → Order confirmed
\`\`\`

### Performance Breakdown
| Service | Duration | Status |
|---------|----------|--------|
| api-gateway | 12ms | ✅ |
| auth-service | 22ms | ✅ |
| order-service | 55ms | ✅ |
| inventory-svc | 145ms | ⚠️ |
| payment-service | 2,222ms | ⚠️ |
| notify-service | 111ms | ✅ |

### Total Duration: 2,889ms
### Bottleneck: payment-service (77%)`,
  },
  {
    question: "Find configuration change logs",
    answer: `## Configuration Change Logs

### Recent Changes (Last 24 hours)
| Time | Service | Key | Old | New | By |
|------|---------|-----|-----|-----|----|
| 14:23 | api-gw | rate_limit | 1000 | 2000 | @john |
| 12:45 | payment | timeout_ms | 30000 | 45000 | @sarah |
| 10:12 | order | pool_size | 10 | 25 | @mike |
| 08:30 | auth | token_ttl | 3600 | 7200 | @john |

### Change Details
\`\`\`yaml
# payment-service config change
# Changed by: @sarah
# Reason: "Increased timeout for slow bank API"
# Ticket: JIRA-1234

payment:
  gateway:
    timeout_ms: 45000  # was: 30000
    retry_count: 3     # unchanged
\`\`\`

### Impact Analysis
| Change | Affected Requests | Status |
|--------|-------------------|--------|
| rate_limit increase | 12,456 | ✅ Positive |
| timeout increase | 234 | ⚠️ Monitor |

### Rollback Commands
\`\`\`bash
kubectl rollout undo configmap/payment-config
\`\`\``,
  },
  {
    question: "Find network-related errors",
    answer: `## Network Error Analysis

### Error Distribution
| Error Type | Count | Services |
|------------|-------|----------|
| Connection refused | 456 | 5 |
| Connection timeout | 234 | 8 |
| DNS resolution failed | 89 | 3 |
| SSL handshake failed | 45 | 2 |
| Connection reset | 123 | 4 |

### Top Affected Connections
| Source | Destination | Errors | Type |
|--------|-------------|--------|------|
| order-svc | inventory-db | 234 | Timeout |
| api-gw | payment-svc | 156 | Refused |
| auth-svc | ldap-server | 89 | Timeout |
| cart-svc | redis | 67 | Reset |

### DNS Failures
\`\`\`
[14:23:45] Failed to resolve: inventory-db.production.svc.cluster.local
[14:24:12] DNS lookup timeout: ldap.internal.telemetryflow.id
\`\`\`

### Network Metrics
| Metric | Value | Threshold |
|--------|-------|-----------|
| Packet loss | 0.02% | <0.1% ✅ |
| Latency P99 | 12ms | <50ms ✅ |
| DNS resolution | 2.3ms | <10ms ✅ |

### Recommendations
1. Check inventory-db service discovery
2. Review LDAP server health
3. Add connection pooling for Redis`,
  },
  {
    question: "Show service health check logs",
    answer: `## Health Check Logs

### Summary (Last 15 minutes)
| Service | Checks | Pass | Fail | Rate |
|---------|--------|------|------|------|
| api-gateway | 60 | 60 | 0 | 100% |
| payment-svc | 60 | 57 | 3 | 95% |
| order-svc | 60 | 60 | 0 | 100% |
| auth-svc | 60 | 60 | 0 | 100% |
| inventory-svc | 60 | 58 | 2 | 97% |

### Failed Health Checks
| Time | Service | Endpoint | Error |
|------|---------|----------|-------|
| 14:23:45 | payment-svc | /health | Timeout |
| 14:24:15 | payment-svc | /health | Timeout |
| 14:24:45 | payment-svc | /health | Timeout |
| 14:25:30 | inventory-svc | /ready | 503 |
| 14:26:00 | inventory-svc | /ready | 503 |

### Health Check Configuration
\`\`\`yaml
livenessProbe:
  path: /health
  intervalSeconds: 15
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  path: /ready
  intervalSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 2
\`\`\`

### Alerts Triggered
- payment-svc: Readiness probe failed 3x (recovered)
- inventory-svc: Liveness degraded (investigating)`,
  },
  {
    question: "Find logs with high latency",
    answer: `## High Latency Log Analysis

### Slow Requests (>1s)
| Time | Service | Endpoint | Duration |
|------|---------|----------|----------|
| 14:23:45 | payment | /process | 4,567ms |
| 14:24:12 | order | /create | 2,345ms |
| 14:24:34 | search | /query | 1,890ms |
| 14:25:01 | report | /generate | 8,901ms |

### Latency Distribution
| Range | Count | Percentage |
|-------|-------|------------|
| <100ms | 45,678 | 92% |
| 100-500ms | 3,456 | 7% |
| 500ms-1s | 456 | 0.9% |
| >1s | 78 | 0.1% |

### Root Cause Analysis
\`\`\`json
{
  "trace_id": "slow-trace-123",
  "total_duration": 4567,
  "breakdown": {
    "db_query": 3234,
    "external_api": 890,
    "processing": 443
  }
}
\`\`\`

### Recommendations
1. Optimize slow DB queries
2. Add caching for external API calls
3. Enable query result caching`,
  },
  {
    question: "Find API deprecation warnings",
    answer: `## API Deprecation Warnings

### Deprecated Endpoints in Use
| Endpoint | Calls/day | Deprecated | Removal |
|----------|-----------|------------|---------|
| /api/v1/users | 12,456 | Jan 1, 2025 | Apr 1, 2025 |
| /api/v1/orders | 8,901 | Dec 1, 2024 | Mar 1, 2025 |
| /api/v1/legacy/* | 2,345 | Nov 1, 2024 | Feb 15, 2025 |

### Client Usage
| Client | Deprecated Calls | Contact |
|--------|-----------------|---------|
| mobile-app-v2 | 8,901 | mobile-team@telemetryflow.id |
| partner-api-123 | 2,345 | partner@telemetryflow.id |
| internal-tool | 1,234 | devops@telemetryflow.id |

### Migration Status
| API | v1 Usage | v2 Usage | Migration |
|-----|----------|----------|-----------|
| /users | 12,456 | 45,678 | 78% |
| /orders | 8,901 | 89,012 | 91% |
| /legacy | 2,345 | N/A | 0% |

### Recommended Actions
1. Contact mobile-team for /api/v1/orders migration
2. Schedule legacy API shutdown communication
3. Update internal-tool to v2 APIs`,
  },
  {
    question: "Find certificate expiration warnings",
    answer: `## Certificate Expiration Logs

### Expiring Soon
| Domain | Expires | Days Left | Type |
|--------|---------|-----------|------|
| api.telemetryflow.id | Feb 28 | 26 | SSL |
| admin.telemetryflow.id | Mar 5 | 31 | SSL |
| internal.telemetryflow.id | Feb 15 | 13 | mTLS |

### Certificate Status
| Status | Count |
|--------|-------|
| Valid (>60d) | 12 |
| Warning (30-60d) | 4 |
| Critical (<30d) | 2 |
| Expired | 0 |

### Recent Warnings
\`\`\`
[14:23:45] WARN Certificate for api.telemetryflow.id expires in 26 days
[14:23:45] WARN Certificate for internal.telemetryflow.id expires in 13 days
[12:00:00] INFO Auto-renewal initiated for staging.telemetryflow.id
[12:05:00] INFO Auto-renewal completed for staging.telemetryflow.id
\`\`\`

### Renewal Actions
| Domain | Auto-Renewal | Action Required |
|--------|--------------|-----------------|
| api.telemetryflow.id | No | Manual renewal |
| internal.telemetryflow.id | No | Urgent renewal |
| staging.telemetryflow.id | Yes | None |`,
  },
  {
    question: "Search logs for specific trace ID",
    answer: `## Trace ID Search: trace_id=abc123def456

### Found: 34 log entries

### Timeline
\`\`\`
14:23:45.001 [INFO]  api-gateway     Request: POST /api/v1/checkout
14:23:45.012 [INFO]  auth-service    User authenticated: usr_12345
14:23:45.034 [INFO]  cart-service    Cart retrieved: 3 items, $234.56
14:23:45.089 [INFO]  order-service   Order validation started
14:23:45.123 [INFO]  inventory-svc   Stock check: all items available
14:23:45.234 [INFO]  payment-service Payment initiated: $234.56
14:23:46.456 [WARN]  payment-service Retry attempt 1: gateway timeout
14:23:47.678 [INFO]  payment-service Payment successful: txn_789
14:23:47.789 [INFO]  order-service   Order created: ORD-12345
14:23:47.890 [INFO]  notify-service  Confirmation email queued
14:23:48.001 [INFO]  api-gateway     Response: 200 OK (3,000ms)
\`\`\`

### Span Summary
| Service | Duration | Status |
|---------|----------|--------|
| Total | 3,000ms | Success |
| payment-service | 2,444ms | ⚠️ Slow |
| inventory-svc | 34ms | ✅ |
| order-service | 134ms | ✅ |

### Issues Detected
- Payment gateway timeout caused 1 retry
- Total latency exceeded 2s threshold`,
  },
  {
    question: "Find database connection errors",
    answer: `## Database Connection Error Analysis

### Error Summary (Last 1 hour)
| Error Type | Count | Database |
|------------|-------|----------|
| Connection refused | 156 | postgres-primary |
| Pool exhausted | 89 | postgres-primary |
| Connection timeout | 67 | postgres-replica |
| Authentication failed | 12 | postgres-primary |

### Connection Pool Status
| Database | Active | Idle | Max | Status |
|----------|--------|------|-----|--------|
| postgres-primary | 50 | 0 | 50 | 🔴 Full |
| postgres-replica-1 | 23 | 27 | 50 | ✅ OK |
| postgres-replica-2 | 21 | 29 | 50 | ✅ OK |

### Error Timeline
\`\`\`
14:15:00 - Connection pool reaching capacity (45/50)
14:17:00 - Pool exhausted, requests queuing
14:18:00 - First connection refused errors
14:20:00 - Connection timeout errors begin
14:23:00 - Alerts triggered
14:25:00 - Pool connections released
14:27:00 - Normal operation resumed
\`\`\`

### Root Cause
Long-running queries blocked connection release:
\`\`\`sql
-- Query running for 15 minutes
SELECT * FROM orders
JOIN order_items ON ...
WHERE created_at > '2024-01-01'
\`\`\`

### Recommendations
1. Kill long-running query
2. Increase pool size to 100
3. Add query timeout of 30s`,
  },
  {
    question: "Find Kubernetes event logs",
    answer: `## Kubernetes Event Logs

### Recent Events (Last 30 minutes)
| Time | Type | Object | Reason | Message |
|------|------|--------|--------|---------|
| 14:23 | Warning | Pod/payment-abc | OOMKilled | Container exceeded memory |
| 14:25 | Normal | Deploy/payment | Scaling | Scaled up to 5 replicas |
| 14:27 | Warning | Node/worker-07 | NotReady | Node status changed |
| 14:28 | Normal | Pod/order-xyz | Pulled | Successfully pulled image |
| 14:30 | Warning | PVC/data-01 | Resizing | Expanding volume |

### Event Summary
| Type | Count |
|------|-------|
| Normal | 234 |
| Warning | 45 |

### Critical Events
\`\`\`yaml
- type: Warning
  reason: OOMKilled
  object: Pod/payment-service-7d8f9-abc12
  message: Container killed due to OOM
  count: 3
  firstSeen: 14:23:45
  lastSeen: 14:45:12

- type: Warning
  reason: NotReady
  object: Node/k8s-worker-07
  message: Kubelet stopped posting node status
  count: 1
  firstSeen: 14:27:00
\`\`\`

### Recommended Actions
1. Increase payment-service memory limits
2. Investigate k8s-worker-07 node health`,
  },
  {
    question: "Find webhook delivery failures",
    answer: `## Webhook Delivery Failure Analysis

### Summary (Last 24 hours)
| Endpoint | Attempts | Success | Failed | Rate |
|----------|----------|---------|--------|------|
| https://partner-a.com/webhook | 1,234 | 1,189 | 45 | 96% |
| https://partner-b.com/webhook | 890 | 823 | 67 | 92% |
| https://internal.telemetryflow.id/events | 5,678 | 5,678 | 0 | 100% |

### Failure Reasons
| Reason | Count | Percentage |
|--------|-------|------------|
| Connection timeout | 67 | 60% |
| HTTP 500 | 23 | 21% |
| HTTP 503 | 12 | 11% |
| SSL error | 10 | 9% |

### Retry Queue
| Webhook | Pending | Oldest |
|---------|---------|--------|
| partner-a | 12 | 2h ago |
| partner-b | 45 | 4h ago |

### Sample Failure Log
\`\`\`json
{
  "timestamp": "2025-02-02T14:23:45Z",
  "webhook_id": "wh_123",
  "endpoint": "https://partner-b.com/webhook",
  "attempt": 3,
  "error": "Connection timeout after 30s",
  "next_retry": "2025-02-02T14:53:45Z"
}
\`\`\`

### Recommendations
1. Contact partner-b about endpoint health
2. Increase retry delay for failing endpoints`,
  },
  {
    question: "Find file upload errors",
    answer: `## File Upload Error Analysis

### Summary (Last 6 hours)
| Error Type | Count | Percentage |
|------------|-------|------------|
| File too large | 234 | 45% |
| Invalid format | 156 | 30% |
| Storage full | 67 | 13% |
| Timeout | 45 | 9% |
| Permission denied | 18 | 3% |

### Size Limit Violations
| Limit | Attempted | Max Seen |
|-------|-----------|----------|
| 10MB (images) | 156 | 45MB |
| 50MB (documents) | 67 | 234MB |
| 100MB (videos) | 11 | 890MB |

### Storage Status
| Bucket | Used | Limit | Status |
|--------|------|-------|--------|
| uploads-temp | 89GB | 100GB | ⚠️ 89% |
| user-files | 234GB | 500GB | ✅ 47% |
| backups | 1.2TB | 2TB | ✅ 60% |

### Sample Error
\`\`\`json
{
  "error": "FILE_TOO_LARGE",
  "file_name": "report.pdf",
  "file_size": 52428800,
  "max_allowed": 10485760,
  "user_id": "usr_12345"
}
\`\`\`

### Recommendations
1. Implement client-side file validation
2. Expand uploads-temp bucket
3. Add file compression option`,
  },
  {
    question: "Find cache invalidation events",
    answer: `## Cache Invalidation Events

### Summary (Last 1 hour)
| Cache | Invalidations | Type | Impact |
|-------|---------------|------|--------|
| product-catalog | 456 | Key-based | Low |
| user-sessions | 234 | Pattern | Medium |
| search-results | 123 | TTL expiry | Low |
| api-responses | 89 | Manual | High |

### Invalidation Timeline
\`\`\`
14:00:00 - TTL-based invalidation: 1,234 keys
14:15:00 - Deployment trigger: product-catalog flush
14:23:00 - Manual invalidation: api-responses (admin)
14:30:00 - Pattern invalidation: user-sessions:*
\`\`\`

### Cache Miss Rate After Invalidation
| Cache | Before | After | Recovery |
|-------|--------|-------|----------|
| product-catalog | 2% | 34% | 5 min |
| user-sessions | 5% | 89% | 15 min |
| api-responses | 8% | 67% | 10 min |

### Performance Impact
- Latency spike: +45ms avg during recovery
- Origin load: +234% during cache warm-up
- Duration: 15 minutes

### Recommendations
1. Implement gradual cache invalidation
2. Add cache warming for critical keys
3. Schedule large invalidations off-peak`,
  },
];

export const LOGS_CONVERSATION_TITLES = [
  "Error pattern analysis in auth-service",
  "Failed login attempts investigation",
  "Database connection timeout errors",
  "API gateway 5xx error spike",
  "Trace correlation for checkout failures",
  "Payment failure log analysis",
  "Security audit log review",
  "Deployment log investigation",
  "Rate limiting event analysis",
  "Network error troubleshooting",
];
