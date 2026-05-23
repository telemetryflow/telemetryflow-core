/**
 * LLM Mock Data - Traces
 * TASK-11: Mock data for traces-related AI insights
 */

import type { MockQA } from "./llm-metrics";

export const TRACES_MOCK_DATA: MockQA[] = [
  {
    question: "Find the slowest requests in checkout flow",
    answer: `## Checkout Flow Latency Analysis

### Overview
- **Traces Analyzed**: 45,672
- **P50 Latency**: 234ms
- **P95 Latency**: 1,847ms
- **P99 Latency**: 4,523ms ⚠️

### Slowest Traces (>3s)

| Trace ID | Duration | Bottleneck | User Impact |
|----------|----------|------------|-------------|
| \`7f8a9b2c...\` | 8,234ms | payment-service | Checkout timeout |
| \`1a2b3c4d...\` | 6,891ms | inventory-check | Cart abandonment |
| \`9i8j7k6l...\` | 5,456ms | fraud-detection | Payment delayed |

### Span Breakdown: Trace \`7f8a9b2c\`

\`\`\`
checkout-frontend     [==]                           (45ms)
└─ api-gateway        [===]                          (67ms)
   └─ checkout-service [====]                        (89ms)
      ├─ cart-service  [==]                          (34ms)
      ├─ inventory-svc [=======]                     (156ms)
      └─ payment-svc   [================================] (7,843ms) ⚠️
         ├─ fraud-api  [===========]                 (2,341ms)
         ├─ bank-api   [==================]          (4,567ms) ⚠️
         └─ notify-svc [=]                           (23ms)
\`\`\`

### Root Cause: External Bank API Latency

**Span Details**:
- Service: payment-service
- Operation: \`BankGateway.processTransaction\`
- Duration: 4,567ms (expected: <500ms)
- Status: OK (but slow)

**Exemplar Metrics**:
- \`bank_api_latency_seconds{method="POST", endpoint="/v1/charge"}\`: 4.56s
- \`payment_retry_count\`: 2

### Recommendations
1. Add circuit breaker for bank-api (timeout: 2s, fallback to queue)
2. Implement async payment processing for orders >$100
3. Cache fraud-detection results for repeat customers (TTL: 1h)
4. Add timeout alert: bank_api_latency > 1s`,
  },
  {
    question: "Show service dependency map from traces",
    answer: `## Service Dependency Map

### Discovered Services: 12
### Total Edges: 34
### Analysis Period: Last 24 hours

### Dependency Graph
\`\`\`
frontend → api-gateway → auth-service → user-db
                       → order-service → inventory-db
                                       → payment-service → stripe-api
                                                        → fraud-api
                       → cart-service → redis-cache
                       → search-service → elasticsearch
                       → notification-svc → email-provider
                                         → sms-provider
\`\`\`

### Traffic Volume (requests/min)
| Source | Target | Volume | Error Rate |
|--------|--------|--------|------------|
| api-gateway | auth-service | 12,456 | 0.1% |
| api-gateway | order-service | 4,567 | 0.3% |
| order-service | payment-service | 2,345 | 0.5% |
| payment-service | stripe-api | 2,100 | 0.2% |

### Critical Paths
1. **Checkout**: frontend → api → order → payment → stripe (P99: 2.3s)
2. **Search**: frontend → api → search → elasticsearch (P99: 450ms)
3. **Auth**: frontend → api → auth → user-db (P99: 89ms)

### Single Points of Failure
- api-gateway: All traffic passes through (12K req/min)
- redis-cache: 6 services depend on it
- user-db: Authentication bottleneck`,
  },
  {
    question: "Find traces with errors in payment flow",
    answer: `## Error Traces: Payment Flow

### Error Summary
- **Total Payment Traces**: 12,456
- **Error Traces**: 234 (1.9%)
- **Unique Error Types**: 8

### Top Error Spans
| Service | Operation | Error | Count | % |
|---------|-----------|-------|-------|---|
| payment-svc | processPayment | CardDeclined | 89 | 38% |
| fraud-api | checkFraud | Timeout | 56 | 24% |
| stripe-api | charge | RateLimited | 34 | 15% |
| payment-svc | validateCard | InvalidNumber | 28 | 12% |
| bank-api | transfer | InsufficientFunds | 27 | 11% |

### Sample Error Trace
\`\`\`
trace_id: err-payment-789
Duration: 5,234ms
Status: ERROR

Spans:
├─ api-gateway (OK, 12ms)
├─ checkout-service (OK, 45ms)
└─ payment-service (ERROR, 5,189ms)
   ├─ fraud-api (OK, 890ms)
   └─ stripe-api (ERROR, 4,234ms)
       └─ Error: "Card declined: insufficient funds"
       └─ error.code: "card_declined"
       └─ decline_code: "insufficient_funds"
\`\`\`

### Error Correlation
| Error Type | Time Pattern | Correlation |
|------------|--------------|-------------|
| CardDeclined | Random | N/A |
| Timeout | Peak hours | CPU > 80% |
| RateLimited | Burst traffic | Marketing events |

### Recommendations
1. Implement card pre-validation
2. Add retry with backoff for timeouts
3. Request Stripe rate limit increase`,
  },
  {
    question: "Compare trace latency before and after deployment",
    answer: `## Deployment Impact Analysis

### Deployment Details
- **Service**: payment-service
- **Version**: v2.3.0 → v2.3.1
- **Time**: Feb 2, 14:00 UTC
- **Type**: Rolling update

### Latency Comparison

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| P50 | 123ms | 89ms | -28% | ✅ Improved |
| P95 | 456ms | 234ms | -49% | ✅ Improved |
| P99 | 1,234ms | 567ms | -54% | ✅ Improved |
| Max | 8,901ms | 2,345ms | -74% | ✅ Improved |

### Span-Level Changes
| Span | Before | After | Change |
|------|--------|-------|--------|
| validatePayment | 234ms | 45ms | -81% |
| processCard | 345ms | 189ms | -45% |
| notifyCustomer | 56ms | 34ms | -39% |
| saveTransaction | 89ms | 67ms | -25% |

### Throughput Impact
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Requests/sec | 234 | 289 | +23% |
| Error rate | 0.8% | 0.3% | -63% |
| Success rate | 99.2% | 99.7% | +0.5% |

### Verdict: ✅ Successful Optimization
Release notes confirmed: Database query optimization in validatePayment()`,
  },
  {
    question: "Show trace for order ID",
    answer: `## Trace Details: order_id=ORD-12345

### Overview
- **Trace ID**: abc123def456ghi789
- **Duration**: 2,345ms
- **Status**: ✅ SUCCESS
- **Spans**: 12
- **Services**: 6

### Timeline
\`\`\`
[0ms]      api-gateway        ┣━━━━┫ (45ms)
[45ms]     auth-service       ┣━━┫ (23ms)
[68ms]     order-service      ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ (2,200ms)
  [70ms]   ├─ validate        ┣━━┫ (34ms)
  [104ms]  ├─ inventory-svc   ┣━━━━━━━┫ (156ms)
  [260ms]  ├─ pricing-svc     ┣━━┫ (45ms)
  [305ms]  └─ payment-svc     ┣━━━━━━━━━━━━━━━━━━━━━┫ (1,890ms)
    [310ms]   ├─ fraud-api    ┣━━━━━━┫ (234ms)
    [544ms]   └─ stripe-api   ┣━━━━━━━━━━━━━━━┫ (1,345ms)
[2,265ms]  notify-service     ┣━━━┫ (67ms)
\`\`\`

### Span Details
| Span | Service | Duration | Status |
|------|---------|----------|--------|
| api-gateway | ingress | 45ms | ✅ |
| auth | auth-service | 23ms | ✅ |
| validate-order | order-svc | 34ms | ✅ |
| check-inventory | inventory | 156ms | ✅ |
| calculate-price | pricing | 45ms | ✅ |
| process-payment | payment | 1,890ms | ⚠️ Slow |
| send-notification | notify | 67ms | ✅ |

### Bottleneck Analysis
**Primary bottleneck**: payment-svc (81% of total time)
- stripe-api call: 1,345ms (57% of trace)

### Related Logs
\`\`\`
[order-svc] Order created: ORD-12345, amount: $234.56
[payment-svc] Payment initiated for ORD-12345
[stripe] Charge created: ch_xyz789, status: succeeded
\`\`\``,
  },
  {
    question: "Find traces with database spans >1s",
    answer: `## Slow Database Traces

### Summary
- **Total Traces Analyzed**: 45,678
- **Traces with DB >1s**: 234 (0.5%)
- **Avg Slow DB Duration**: 2.3s

### Slow Database Operations
| Trace ID | DB Duration | Table | Operation |
|----------|-------------|-------|-----------|
| abc123 | 3.4s | orders | SELECT with JOIN |
| def456 | 2.1s | inventory | UPDATE |
| ghi789 | 1.8s | users | SELECT COUNT |
| jkl012 | 4.5s | logs | SELECT * |
| mno345 | 2.7s | products | FULL TEXT SEARCH |

### Query Analysis
\`\`\`sql
-- Trace: abc123 (3.4s)
SELECT o.*, u.name, p.title
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
WHERE o.created_at > '2024-01-01'
  AND o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 1000;

-- Execution Plan:
-- Seq Scan on orders (rows: 1.2M)
-- Missing index on (created_at, status)
\`\`\`

### Pattern Analysis
- **89%** of slow traces involve orders table
- **67%** are JOIN operations
- **45%** occur during peak hours (14:00-16:00)

### Recommendations
1. Add composite index: \`(created_at, status)\`
2. Partition orders table by month
3. Enable query result caching`,
  },
  {
    question: "Analyze trace sampling rate",
    answer: `## Trace Sampling Analysis

### Current Configuration
| Setting | Value |
|---------|-------|
| Sampling Strategy | Head-based |
| Global Rate | 10% |
| Error Traces | 100% |
| Slow Traces (>2s) | 100% |

### Sampling Statistics
| Service | Total Requests | Sampled | Dropped | Coverage |
|---------|----------------|---------|---------|----------|
| api-gw | 450K | 45K | 405K | ✅ Good |
| payment | 120K | 12K | 108K | ✅ Good |
| order | 230K | 23K | 207K | ✅ Good |
| auth | 890K | 89K | 801K | ✅ Good |

### Error Capture Rate
| Error Type | Total | Sampled | Rate |
|------------|-------|---------|------|
| 5xx errors | 234 | 234 | 100% |
| 4xx errors | 1,234 | 123 | 10% |
| Timeouts | 89 | 89 | 100% |

### Storage Impact
| Metric | Current | With 15% | With 20% |
|--------|---------|----------|----------|
| Traces/day | 4.5M | 6.75M | 9M |
| Storage/day | 45GB | 67.5GB | 90GB |
| Cost/month | $450 | $675 | $900 |

### Recommendations
1. Increase payment-svc rate to 15% (critical path)
2. Add tail-based sampling for latency outliers
3. Implement adaptive sampling based on error rate`,
  },
  {
    question: "Show trace propagation issues",
    answer: `## Trace Propagation Report

### Summary
- **Total Traces**: 450,000
- **Complete Traces**: 445,234 (98.9%)
- **Broken Traces**: 4,766 (1.1%)

### Propagation Gaps
| Gap Location | Count | Cause | Impact |
|--------------|-------|-------|--------|
| api-gw → auth | 1,234 | Missing headers | Auth analysis gap |
| order → payment | 890 | Async job | Payment tracking |
| payment → bank | 567 | External API | End-to-end visibility |
| notify → email | 456 | Queue system | Notification tracking |
| search → elastic | 234 | Library bug | Search analysis |

### Root Causes

#### 1. Missing Headers (api-gw → auth)
\`\`\`
Expected: traceparent, tracestate headers
Actual: Headers stripped by nginx proxy
Fix: Add header passthrough configuration
\`\`\`

#### 2. Async Job Gap (order → payment)
\`\`\`
Issue: Background job doesn't inherit trace context
Solution: Pass trace_id in job payload
\`\`\`

### Fix Priority
| Issue | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Missing headers | Low | High | P1 |
| Async jobs | Medium | High | P1 |
| External APIs | Low | Medium | P2 |
| Queue system | Medium | Medium | P2 |

### Recommendations
1. Add W3C trace context to nginx config
2. Implement context propagation in async workers
3. Add trace linking for external API calls`,
  },
  {
    question: "Compare latency by customer tier",
    answer: `## Latency by Customer Tier

### Tier Definitions
| Tier | Rate Limit | Priority | SLA |
|------|------------|----------|-----|
| Enterprise | 10K/min | High | 99.99% |
| Business | 1K/min | Medium | 99.9% |
| Free | 100/min | Low | 99% |

### Latency Comparison
| Tier | P50 | P95 | P99 | Requests |
|------|-----|-----|-----|----------|
| Enterprise | 89ms | 234ms | 456ms | 45K/hr |
| Business | 123ms | 345ms | 678ms | 123K/hr |
| Free | 234ms | 567ms | 1,234ms | 890K/hr |

### Latency Ratio vs Enterprise
| Tier | P50 Ratio | P95 Ratio | P99 Ratio |
|------|-----------|-----------|-----------|
| Business | 1.4x | 1.5x | 1.5x |
| Free | 2.6x | 2.4x | 2.7x |

### Performance Breakdown
| Metric | Enterprise | Business | Free |
|--------|------------|----------|------|
| Queue wait | 0ms | 12ms | 45ms |
| Rate limit delay | 0ms | 5ms | 89ms |
| Cache hit rate | 95% | 87% | 67% |

### SLA Status
| Tier | Target | Actual | Status |
|------|--------|--------|--------|
| Enterprise | <500ms P99 | 456ms | ✅ Met |
| Business | <1s P99 | 678ms | ✅ Met |
| Free | <2s P99 | 1,234ms | ✅ Met |

### Recommendations
1. Investigate Free tier queue delays
2. Improve cache hit rate for lower tiers
3. Consider dedicated infrastructure for Enterprise`,
  },
  {
    question: "Show retry spans in traces",
    answer: `## Retry Analysis in Traces

### Summary
- **Traces with Retries**: 4,567 (2.3% of total)
- **Total Retry Attempts**: 12,456
- **Avg Retries per Failed Request**: 2.7

### Retry Distribution by Service
| Service | Traces | Retry Rate | Avg Retries | Impact |
|---------|--------|------------|-------------|--------|
| payment-svc | 2,345 | 5.6% | 2.3 | +340ms |
| email-svc | 1,234 | 3.4% | 1.8 | +120ms |
| sms-svc | 567 | 2.1% | 1.5 | +89ms |
| external-api | 421 | 4.5% | 3.1 | +456ms |

### Retry Reasons
| Reason | Count | % | Recovery Rate |
|--------|-------|---|---------------|
| Connection timeout | 5,678 | 45% | 78% |
| 503 Service Unavailable | 3,456 | 28% | 92% |
| 429 Rate Limited | 2,345 | 19% | 99% |
| Connection refused | 977 | 8% | 45% |

### Sample Retry Trace
\`\`\`
[0ms]   payment-svc.processPayment
[100ms] └─ stripe-api.charge (attempt 1) → TIMEOUT
[2100ms]└─ stripe-api.charge (attempt 2) → TIMEOUT
[4100ms]└─ stripe-api.charge (attempt 3) → SUCCESS
Total: 4,100ms (vs 100ms expected)
\`\`\`

### Latency Impact
| Retries | Traces | Avg Added Latency |
|---------|--------|-------------------|
| 1 | 2,345 | +150ms |
| 2 | 1,567 | +340ms |
| 3+ | 655 | +890ms |

### Recommendations
1. Add circuit breaker (3 failures → open)
2. Implement exponential backoff
3. Add jitter to prevent thundering herd`,
  },
  {
    question: "Analyze span attributes distribution",
    answer: `## Span Attributes Analysis

### Common Attributes
| Attribute | Coverage | Example Values |
|-----------|----------|----------------|
| http.method | 98% | GET, POST, PUT |
| http.status_code | 98% | 200, 404, 500 |
| http.url | 95% | /api/v1/orders |
| db.system | 67% | postgresql, redis |
| rpc.service | 45% | grpc, thrift |

### Attribute Cardinality
| Attribute | Unique Values | Risk |
|-----------|---------------|------|
| user.id | 1.2M | ⚠️ High |
| order.id | 4.5M | 🔴 Very High |
| http.url | 234 | ✅ OK |
| http.method | 5 | ✅ OK |

### Missing Critical Attributes
| Attribute | Missing % | Impact |
|-----------|-----------|--------|
| error.message | 23% | Debug difficulty |
| db.statement | 45% | Query analysis |
| http.request_content_length | 67% | Size analysis |

### Semantic Conventions Compliance
| Convention | Compliance | Issues |
|------------|------------|--------|
| HTTP | 89% | Missing route |
| Database | 67% | Missing statement |
| Messaging | 45% | Missing queue name |
| RPC | 78% | Missing method |

### Recommendations
1. Remove high-cardinality user.id from index
2. Add db.statement to database spans
3. Implement semantic convention validation`,
  },
  {
    question: "Find traces with external service calls",
    answer: `## External Service Call Analysis

### External Dependencies
| Service | Calls/hr | Latency P95 | Error Rate |
|---------|----------|-------------|------------|
| Stripe API | 4,567 | 890ms | 0.3% |
| SendGrid | 2,345 | 234ms | 0.1% |
| Twilio | 1,234 | 567ms | 0.5% |
| Google Maps | 890 | 123ms | 0.05% |
| AWS S3 | 12,456 | 45ms | 0.01% |

### Latency Breakdown
| External Call | Min | P50 | P95 | P99 | Max |
|---------------|-----|-----|-----|-----|-----|
| Stripe charge | 89ms | 234ms | 890ms | 2.3s | 8.9s |
| SendGrid send | 45ms | 123ms | 234ms | 567ms | 1.2s |
| Twilio SMS | 123ms | 345ms | 567ms | 1.2s | 3.4s |

### Error Analysis
| Service | Error Type | Count | Rate |
|---------|------------|-------|------|
| Stripe | rate_limited | 45 | 1% |
| Stripe | card_declined | 234 | 5% |
| Twilio | invalid_number | 89 | 7% |
| SendGrid | bounced | 23 | 1% |

### Circuit Breaker Status
| Service | State | Failures | Last Trip |
|---------|-------|----------|-----------|
| Stripe | Closed | 0 | N/A |
| Twilio | Half-Open | 3 | 2h ago |
| SendGrid | Closed | 0 | N/A |

### Recommendations
1. Add fallback for Stripe (queue for retry)
2. Investigate Twilio circuit breaker trips
3. Cache Google Maps responses (1h TTL)`,
  },
  {
    question: "Show trace timeline for user journey",
    answer: `## User Journey Trace Timeline

### Journey: Product Search → Checkout → Confirmation
### User ID: usr_12345
### Session Duration: 8 minutes 34 seconds

### Timeline
\`\`\`
[0:00]     ━━━━ Page Load ━━━━
           └─ frontend.loadHomepage (234ms)

[0:15]     ━━━━ Search ━━━━
           └─ search.query "laptop" (456ms)
              └─ elasticsearch.search (234ms)

[1:23]     ━━━━ Product View ━━━━
           └─ product.getDetails (123ms)
              └─ catalog.getProduct (45ms)
              └─ inventory.checkStock (34ms)
              └─ pricing.getPrice (23ms)

[2:45]     ━━━━ Add to Cart ━━━━
           └─ cart.addItem (89ms)
              └─ redis.set (12ms)

[5:12]     ━━━━ Checkout ━━━━
           └─ checkout.initiate (2,345ms)
              └─ cart.getItems (45ms)
              └─ inventory.reserve (234ms)
              └─ payment.process (1,890ms)
                 └─ stripe.charge (1,567ms)
              └─ order.create (123ms)

[8:34]     ━━━━ Confirmation ━━━━
           └─ notification.send (234ms)
              └─ email.queue (45ms)
\`\`\`

### Performance Summary
| Step | Duration | % of Total |
|------|----------|------------|
| Search | 456ms | 15% |
| Product View | 123ms | 4% |
| Add to Cart | 89ms | 3% |
| Checkout | 2,345ms | 74% |
| Confirmation | 234ms | 7% |

### Bottleneck: Checkout (74% of journey time)`,
  },
  {
    question: "Analyze service-to-service latency",
    answer: `## Service-to-Service Latency Matrix

### Latency Matrix (P95)
|  | api-gw | auth | order | payment | inventory |
|--|--------|------|-------|---------|-----------|
| api-gw | - | 45ms | 67ms | 89ms | 56ms |
| auth | 23ms | - | N/A | N/A | N/A |
| order | 34ms | 45ms | - | 234ms | 123ms |
| payment | 45ms | 34ms | 67ms | - | N/A |
| inventory | 23ms | N/A | 89ms | N/A | - |

### Network Latency Component
| Source → Target | Network | Processing | Total |
|-----------------|---------|------------|-------|
| api-gw → order | 2ms | 65ms | 67ms |
| order → payment | 3ms | 231ms | 234ms |
| order → inventory | 2ms | 121ms | 123ms |
| payment → stripe | 45ms | 845ms | 890ms |

### Latency Trends (Last 7 days)
| Route | Mon | Tue | Wed | Thu | Fri |
|-------|-----|-----|-----|-----|-----|
| api-gw → order | 65ms | 67ms | 68ms | 89ms | 67ms |
| order → payment | 230ms | 234ms | 245ms | 456ms | 234ms |

### Anomalies Detected
- **Thu**: order → payment spike (+96%)
- **Root cause**: Payment gateway maintenance

### Recommendations
1. Add connection pooling for frequently called services
2. Enable gRPC for internal service calls
3. Co-locate order and inventory services`,
  },
  {
    question: "Find traces with async operations",
    answer: `## Async Operation Traces

### Async Patterns Detected
| Pattern | Count | Avg Duration | Services |
|---------|-------|--------------|----------|
| Message Queue | 12,456 | 234ms | 5 |
| Background Job | 4,567 | 4.5s | 3 |
| Event-Driven | 8,901 | 567ms | 7 |
| Scheduled Task | 234 | 12.3s | 2 |

### Queue-Based Traces
\`\`\`
[Main Request] trace_id=abc123
├─ order-service.createOrder (234ms)
└─ queue.publish (12ms)
    └─ message_id: msg_xyz789

[Async Consumer] trace_id=def456 (linked to abc123)
├─ queue.consume (5ms)
└─ notification-service.sendEmail (234ms)
    └─ email-provider.send (189ms)
\`\`\`

### Trace Linking Status
| Async Type | Total | Linked | Orphaned |
|------------|-------|--------|----------|
| Kafka | 8,901 | 8,456 | 445 |
| RabbitMQ | 2,345 | 2,234 | 111 |
| SQS | 1,234 | 1,189 | 45 |

### Processing Delays
| Queue | Publish-to-Process | P95 | Max |
|-------|-------------------|-----|-----|
| orders | 45ms | 234ms | 2.3s |
| notifications | 123ms | 567ms | 4.5s |
| analytics | 890ms | 4.5s | 45s |

### Recommendations
1. Implement trace context in message headers
2. Add consumer lag monitoring
3. Create linked trace visualization`,
  },
  {
    question: "Show database query spans analysis",
    answer: `## Database Query Span Analysis

### Query Distribution
| Database | Queries/min | Avg Duration | Error Rate |
|----------|-------------|--------------|------------|
| PostgreSQL | 45,678 | 12ms | 0.1% |
| Redis | 89,012 | 0.5ms | 0.01% |
| MongoDB | 12,345 | 8ms | 0.05% |
| Elasticsearch | 2,345 | 34ms | 0.2% |

### Slow Queries (>100ms)
| Query Pattern | Avg | Count | Table |
|---------------|-----|-------|-------|
| SELECT * FROM orders JOIN... | 234ms | 456 | orders |
| UPDATE inventory SET... | 156ms | 234 | inventory |
| SELECT COUNT(*) FROM... | 890ms | 123 | logs |

### Query Categorization
| Category | Count | Avg Duration |
|----------|-------|--------------|
| Read (SELECT) | 34,567 | 8ms |
| Write (INSERT/UPDATE) | 8,901 | 23ms |
| Delete | 234 | 12ms |
| Transaction | 1,234 | 45ms |

### Index Usage
| Table | Queries | Index Scans | Seq Scans |
|-------|---------|-------------|-----------|
| orders | 12,456 | 89% | 11% |
| users | 8,901 | 98% | 2% |
| products | 4,567 | 95% | 5% |
| inventory | 2,345 | 67% | 33% |

### Recommendations
1. Add index on orders.created_at
2. Optimize inventory table queries
3. Enable query plan caching`,
  },
  {
    question: "Analyze trace error patterns",
    answer: `## Trace Error Pattern Analysis

### Error Summary (Last 24h)
- **Total Traces**: 1.2M
- **Error Traces**: 4,567 (0.38%)
- **Unique Error Types**: 23

### Top Error Patterns
| Error | Count | Services | First Seen |
|-------|-------|----------|------------|
| ConnectionTimeout | 1,234 | 5 | 6h ago |
| NullPointerException | 890 | 2 | 12h ago |
| RateLimitExceeded | 567 | 3 | 2h ago |
| AuthenticationFailed | 456 | 1 | 24h ago |
| ResourceNotFound | 345 | 4 | 1h ago |

### Error Propagation
\`\`\`
[Source Error] payment-service.CardDeclined
    ↓ propagates to
[Affected] order-service.CreateOrderFailed
    ↓ propagates to
[User Impact] checkout-service.CheckoutFailed
\`\`\`

### Error by Time of Day
| Hour | Errors | Rate |
|------|--------|------|
| 00-06 | 234 | 0.12% |
| 06-12 | 567 | 0.28% |
| 12-18 | 2,345 | 0.89% |
| 18-24 | 1,421 | 0.45% |

### Error Recovery
| Error | Auto-Recovered | Manual | Failed |
|-------|----------------|--------|--------|
| ConnectionTimeout | 89% | 8% | 3% |
| RateLimitExceeded | 99% | 1% | 0% |
| AuthFailed | 0% | 95% | 5% |

### Recommendations
1. Add retry logic for connection timeouts
2. Investigate NPE in order-service
3. Review auth failure patterns`,
  },
  {
    question: "Find traces by custom attribute",
    answer: `## Custom Attribute Search

### Query: \`customer.tier = "enterprise"\`

### Results
- **Matching Traces**: 45,678
- **Time Range**: Last 24 hours
- **Unique Customers**: 234

### Performance by Enterprise Tier
| Metric | Value | vs Overall |
|--------|-------|------------|
| P50 Latency | 89ms | -45% |
| P95 Latency | 234ms | -52% |
| Error Rate | 0.1% | -67% |
| Throughput | 4.5K/hr | 12% of total |

### Top Operations
| Operation | Count | Avg Duration |
|-----------|-------|--------------|
| checkout.process | 12,456 | 1.2s |
| order.create | 8,901 | 234ms |
| payment.process | 7,890 | 890ms |
| search.query | 4,567 | 123ms |

### Custom Attributes Distribution
| Attribute | Values | Coverage |
|-----------|--------|----------|
| customer.tier | 3 | 100% |
| customer.region | 12 | 98% |
| feature.flag | 5 | 67% |
| experiment.id | 8 | 45% |

### Sample Enterprise Trace
\`\`\`json
{
  "trace_id": "enterprise-trace-123",
  "duration": 1234,
  "attributes": {
    "customer.tier": "enterprise",
    "customer.id": "cust_ent_456",
    "feature.premium_support": true,
    "sla.priority": "high"
  }
}
\`\`\``,
  },
  {
    question: "Show span operation statistics",
    answer: `## Span Operation Statistics

### Top Operations by Volume
| Operation | Count | Avg Duration | Error % |
|-----------|-------|--------------|---------|
| http.request | 450K | 123ms | 0.3% |
| db.query | 234K | 12ms | 0.1% |
| cache.get | 890K | 0.5ms | 0.01% |
| grpc.call | 123K | 45ms | 0.2% |
| queue.publish | 45K | 5ms | 0.05% |

### Duration Distribution
| Operation | P50 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|
| http.request | 89ms | 234ms | 567ms | 8.9s |
| db.query | 5ms | 23ms | 89ms | 4.5s |
| cache.get | 0.3ms | 1ms | 5ms | 234ms |
| grpc.call | 23ms | 89ms | 234ms | 2.3s |

### Error Rate by Operation
| Operation | Success | Error | Timeout |
|-----------|---------|-------|---------|
| http.request | 99.7% | 0.2% | 0.1% |
| db.query | 99.9% | 0.08% | 0.02% |
| external.api | 99.2% | 0.5% | 0.3% |

### Throughput Trends
| Operation | Now | 1h ago | 24h ago |
|-----------|-----|--------|---------|
| http.request | 7.5K/s | 6.8K/s | 5.2K/s |
| db.query | 3.9K/s | 3.5K/s | 2.8K/s |
| cache.get | 14.8K/s | 13.2K/s | 10.1K/s |

### Recommendations
1. Monitor http.request P99 trend
2. Investigate db.query max latency
3. Add alerting for external.api errors`,
  },
  {
    question: "Analyze trace correlation with incidents",
    answer: `## Trace-Incident Correlation

### Recent Incident: Payment Outage
- **Time**: Feb 2, 14:00-14:45 UTC
- **Duration**: 45 minutes
- **Impact**: Checkout failures

### Pre-Incident Traces (13:45-14:00)
| Metric | Value | Baseline | Change |
|--------|-------|----------|--------|
| Latency P99 | 234ms | 456ms | -49% |
| Error Rate | 0.3% | 0.2% | +50% |
| Throughput | 4.5K/s | 4.2K/s | +7% |

### Incident Traces (14:00-14:45)
| Metric | Value | Normal | Change |
|--------|-------|--------|--------|
| Latency P99 | 8.9s | 456ms | +1,853% |
| Error Rate | 12.3% | 0.2% | +6,050% |
| Throughput | 1.2K/s | 4.2K/s | -71% |

### Error Traces During Incident
\`\`\`
[14:02:34] payment-svc: "Connection refused to db-primary"
[14:02:35] checkout-svc: "Upstream timeout"
[14:02:36] api-gateway: "502 Bad Gateway"
\`\`\`

### Trace-Based Timeline
\`\`\`
14:00:00 - Normal operation
14:02:30 - First DB connection error traces
14:02:45 - Payment service traces show timeouts
14:03:00 - Checkout failures cascade
14:15:00 - DB failover completed
14:20:00 - Services recovering
14:45:00 - Full recovery confirmed
\`\`\`

### Root Cause Evidence
Trace ID \`incident-trace-789\` shows:
- DB connection timeout: 30s
- Cascade to payment: 45s total
- User impact: Checkout failed`,
  },
  {
    question: "Show geographic latency distribution",
    answer: `## Geographic Latency Distribution

### By Region
| Region | Requests | P50 | P95 | P99 |
|--------|----------|-----|-----|-----|
| US-East | 123K | 45ms | 123ms | 234ms |
| US-West | 89K | 67ms | 156ms | 345ms |
| EU-West | 56K | 89ms | 234ms | 456ms |
| AP-South | 34K | 156ms | 345ms | 678ms |
| AP-East | 23K | 123ms | 289ms | 567ms |

### Latency Heatmap
\`\`\`
Region       P50    P95    P99
           |-----|------|------|
US-East    [===  |      |      ] Excellent
US-West    [==== |      |      ] Good
EU-West    [=====|=     |      ] Good
AP-South   [=====|======|==    ] Needs Work
AP-East    [=====|=====|=      ] Acceptable
\`\`\`

### CDN Impact
| Region | With CDN | Without CDN | Savings |
|--------|----------|-------------|---------|
| US-East | 45ms | 89ms | -49% |
| EU-West | 89ms | 234ms | -62% |
| AP-South | 156ms | 456ms | -66% |

### Network Path Analysis
| Path | Hops | Latency |
|------|------|---------|
| US-East → Origin | 3 | 12ms |
| EU-West → Origin | 7 | 89ms |
| AP-South → Origin | 12 | 156ms |

### Recommendations
1. Deploy edge servers in AP-South
2. Enable connection keep-alive for EU
3. Consider regional deployment for AP`,
  },
  {
    question: "Show trace sampling statistics",
    answer: `## Trace Sampling Statistics

### Sampling Configuration
| Service | Sample Rate | Strategy | Volume |
|---------|-------------|----------|--------|
| api-gateway | 100% | Always | 4.5K/min |
| payment-svc | 100% | Always | 1.2K/min |
| order-svc | 50% | Probabilistic | 2.3K/min |
| analytics | 10% | Probabilistic | 890/min |

### Sampling Decisions
| Decision | Count | Percentage |
|----------|-------|------------|
| Sampled | 8,934 | 45% |
| Dropped | 10,823 | 55% |
| Force sampled (error) | 234 | 1.2% |
| Force sampled (slow) | 567 | 2.9% |

### Head vs Tail Sampling
- **Head Sampling**: 89% of traces
- **Tail Sampling**: 11% (based on latency/errors)

### Recommendations
1. Increase order-svc sampling to 75% for better visibility
2. Enable tail sampling for latency > 500ms`,
  },
  {
    question: "Analyze span attributes and tags",
    answer: `## Span Attributes Analysis

### Common Attributes
| Attribute | Coverage | Values |
|-----------|----------|--------|
| service.name | 100% | 12 services |
| http.method | 89% | GET/POST/PUT/DELETE |
| http.status_code | 87% | 200-504 |
| db.system | 34% | postgresql/redis |
| user.id | 67% | Hashed IDs |

### Custom Tags Usage
| Tag | Services | Purpose |
|-----|----------|---------|
| order.id | order-svc, payment-svc | Transaction tracking |
| customer.tier | All | Priority routing |
| feature.flag | api-gateway | A/B testing |
| deployment.version | All | Release tracking |

### Missing Attributes
| Service | Missing | Impact |
|---------|---------|--------|
| legacy-api | user.id | Cannot trace user journeys |
| batch-job | parent context | Orphan spans |

### Recommendation
Add user.id attribute to legacy-api for complete user journey tracing`,
  },
  {
    question: "Show trace context propagation",
    answer: `## Trace Context Propagation

### Propagation Status
| Service Pair | Success Rate | Failures |
|--------------|--------------|----------|
| api-gw → auth | 99.9% | 12/hr |
| auth → user | 99.8% | 23/hr |
| order → payment | 99.5% | 56/hr |
| payment → Stripe | 98.2% | 189/hr |

### Propagation Headers
| Header | Support | Services |
|--------|---------|----------|
| traceparent (W3C) | 100% | All |
| b3 (Zipkin) | 45% | Legacy |
| x-request-id | 78% | Custom |

### Context Loss Points
- User Request → api-gateway: OK
- api-gateway → queue-consumer: LOST (async)
- payment → external-api: LOST (3rd party)

### Fixes Needed
1. Add context to queue message headers
2. Create synthetic spans for external APIs`,
  },
  {
    question: "Find orphan spans in traces",
    answer: `## Orphan Span Analysis

### Orphan Span Summary
- **Total Orphans**: 1,234/hr
- **Percentage**: 2.3% of all spans
- **Impact**: Incomplete trace visibility

### Top Orphan Sources
| Service | Orphans/hr | Cause |
|---------|------------|-------|
| batch-processor | 456 | No parent context |
| queue-consumer | 345 | Async message |
| cron-job | 234 | Scheduled task |
| webhook-handler | 199 | External trigger |

### Solutions
1. Inject trace context in message queue headers
2. Create synthetic root spans for cron jobs
3. Extract context from webhook headers`,
  },
  {
    question: "Analyze trace span timing accuracy",
    answer: `## Span Timing Analysis

### Clock Skew Detection
| Service Pair | Avg Skew | Max Skew | Status |
|--------------|----------|----------|--------|
| api-gw ↔ auth | 2ms | 5ms | Good |
| order ↔ payment | 12ms | 45ms | Warning |
| payment ↔ Stripe | 89ms | 234ms | Warning |

### Timing Anomalies
| Pattern | Count | Description |
|---------|-------|-------------|
| Child > Parent | 23 | Child end after parent |
| Negative duration | 5 | Clock skew issues |
| Zero duration | 156 | Instrumentation gaps |
| Overlapping siblings | 34 | Concurrent calls |

### Recommendations
1. Enable NTP sync on all services
2. Add network timing spans for external calls`,
  },
  {
    question: "Show trace storage and retention",
    answer: `## Trace Storage Analysis

### Storage Usage
| Period | Traces | Storage | Cost |
|--------|--------|---------|------|
| Today | 8.9M | 45GB | $1.35 |
| This Week | 62M | 312GB | $9.36 |
| This Month | 267M | 1.3TB | $39 |

### Retention Policy
| Tier | Duration | Storage Type |
|------|----------|--------------|
| Hot | 7 days | SSD (fast query) |
| Warm | 30 days | HDD (compressed) |
| Cold | 90 days | S3 (archived) |

### Storage Optimization
- Span compression: 4.5x ratio
- Attribute indexing: 12 fields
- Sampling reduction: 45% volume saved`,
  },
  {
    question: "Find trace instrumentation gaps",
    answer: `## Instrumentation Gap Analysis

### Coverage by Service
| Service | Spans | Coverage | Gap |
|---------|-------|----------|-----|
| api-gateway | 4,567 | 98% | Low |
| payment-svc | 2,345 | 95% | Low |
| order-svc | 3,456 | 87% | Medium |
| legacy-api | 890 | 45% | High |
| batch-jobs | 234 | 23% | Critical |

### Missing Instrumentation
| Service | Missing Area | Impact |
|---------|--------------|--------|
| order-svc | Database queries | No DB latency visibility |
| legacy-api | HTTP client calls | Missing external deps |
| batch-jobs | Queue operations | Orphan spans |

### Priority Actions
1. Add auto-instrumentation to legacy-api
2. Instrument database client in order-svc
3. Add queue span context for batch-jobs`,
  },
  {
    question: "Analyze trace correlation with logs",
    answer: `## Trace-Log Correlation

### Correlation Status
| Service | Trace ID in Logs | Correlation Rate |
|---------|------------------|------------------|
| api-gateway | Yes | 99.8% |
| payment-svc | Yes | 98.5% |
| order-svc | Yes | 97.2% |
| legacy-api | No | 0% |

### Log Enrichment
| Field | Source | Coverage |
|-------|--------|----------|
| trace_id | Span context | 95% |
| span_id | Span context | 95% |
| service.name | Resource | 100% |
| request.id | HTTP header | 78% |

### Missing Correlations
- legacy-api: Add trace ID to log format
- batch-jobs: Include span context in structured logs`,
  },
  {
    question: "Show service graph from traces",
    answer: `## Service Dependency Graph

### Edge Statistics
| Source | Target | Calls/min | Latency |
|--------|--------|-----------|---------|
| api-gw | auth | 12,345 | 23ms |
| api-gw | order | 8,901 | 89ms |
| order | payment | 4,567 | 234ms |
| payment | Stripe | 4,567 | 450ms |

### Dependency Health
| Edge | Status | Circuit |
|------|--------|---------|
| api-gw → auth | Healthy | Closed |
| api-gw → order | Healthy | Closed |
| order → payment | Healthy | Closed |
| payment → Stripe | Slow | Half-Open |

### Critical Paths
1. api-gw → order → payment → Stripe (checkout)
2. api-gw → auth → user-db (login)
3. api-gw → search → elastic (search)

All edges healthy - payment→Stripe being monitored`,
  },
];

export const TRACES_CONVERSATION_TITLES = [
  "Slow checkout flow investigation",
  "Payment processing latency analysis",
  "Distributed trace bottleneck detection",
  "Service dependency latency mapping",
  "Database query performance in traces",
  "Error trace pattern analysis",
  "Cross-service latency investigation",
  "Trace propagation gap analysis",
  "External API call tracing",
  "User journey trace analysis",
];
