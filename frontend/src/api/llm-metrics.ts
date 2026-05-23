/**
 * LLM Mock Data - Metrics
 * TASK-11: Mock data for metrics-related AI insights
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const METRICS_MOCK_DATA: MockQA[] = [
  {
    question:
      "Analyze CPU usage patterns on payment-service over the last 24 hours",
    answer: `## CPU Usage Analysis: payment-service

### Current Status
- **Average CPU**: 67.3% (↑12% from baseline)
- **Peak CPU**: 94.2% at 14:32 UTC
- **Anomaly Score**: 0.78 (High)

### Detected Patterns

| Time Window | Avg CPU | Pattern |
|-------------|---------|---------|
| 00:00-06:00 | 23.4% | Normal baseline |
| 06:00-12:00 | 58.7% | Morning ramp-up |
| 12:00-18:00 | 82.1% | **Elevated** - Peak hours |
| 18:00-24:00 | 45.2% | Evening cooldown |

### Anomalies Detected
1. **14:32 UTC** - CPU spike to 94.2% correlates with \`checkout.processPayment\` trace latency
2. **16:45 UTC** - Sustained 85%+ for 23 minutes during batch job execution
3. **Memory correlation** - 0.89 correlation with heap usage suggests GC pressure

### Recommendations
1. **Immediate**: Scale payment-service replicas from 3 to 5
2. **Short-term**: Optimize \`PaymentProcessor.validateCard()\` - consuming 34% of CPU
3. **Long-term**: Consider async processing for non-critical payment validations

### Related Metrics
- \`payment_service_heap_used_bytes\`: 1.2GB / 2GB (60%)
- \`payment_service_gc_pause_seconds\`: avg 120ms (↑40% from normal)
- \`payment_service_request_rate\`: 2,340 req/min`,
  },
  {
    question: "What's causing the memory leak in order-processor?",
    answer: `## Memory Leak Analysis: order-processor

### Evidence Summary
- **Memory Growth Rate**: +45MB/hour (abnormal)
- **Time to OOM**: ~18 hours at current rate
- **Affected Pods**: order-processor-7d8f9-{abc12, def34, ghi56}

### Root Cause Identification

Based on metric correlation analysis:

\`\`\`
Metric: order_processor_heap_used_bytes
Correlation with order_cache_entries: 0.94 (Very High)
Correlation with pending_order_count: 0.67 (Moderate)
\`\`\`

**Primary Cause**: Order cache entries not being evicted
- Cache size: 847,293 entries (expected: <100,000)
- Cache hit ratio: 12.3% (very low, indicating stale data)

### Affected Code Path
\`\`\`
OrderCacheService.cacheOrder() → Missing TTL configuration
OrderRepository.findById() → Cache lookup without expiration check
\`\`\`

### Remediation Steps
1. Add TTL of 300s to order cache configuration
2. Implement LRU eviction with max 100,000 entries
3. Add cache metrics: \`order_cache_evictions_total\`, \`order_cache_size\`

### Immediate Action
\`\`\`bash
kubectl rollout restart deployment/order-processor -n production
\`\`\``,
  },
  {
    question: "Detect anomalies in request latency for api-gateway",
    answer: `## Latency Anomaly Detection: api-gateway

### Statistical Summary
| Metric | Value | Baseline | Status |
|--------|-------|----------|--------|
| P50 | 45ms | 42ms | ✅ Normal |
| P95 | 234ms | 180ms | ⚠️ +30% |
| P99 | 1,247ms | 450ms | 🔴 +177% |

### Anomalies Detected (Last 6h)
1. **11:23 UTC** - P99 spike to 3.2s (auth-service dependency)
2. **13:45 UTC** - Sustained P95 >500ms for 12 min
3. **15:02 UTC** - Latency oscillation pattern detected

### Root Cause
\`auth-service\` response time degradation causing cascade effect.

### Correlation Analysis
| Upstream Service | Correlation | Impact |
|-----------------|-------------|--------|
| auth-service | 0.94 | Primary |
| user-db | 0.87 | Secondary |
| redis-cache | 0.23 | Minimal |

### Recommendations
1. Implement circuit breaker for auth-service calls
2. Add caching layer for user token validation
3. Scale auth-service replicas from 2 to 4`,
  },
  {
    question: "Show disk I/O metrics for database cluster",
    answer: `## Disk I/O Analysis: PostgreSQL Cluster

### Current I/O Statistics
| Node | Read IOPS | Write IOPS | Latency | Queue |
|------|-----------|------------|---------|-------|
| pg-primary | 12,340 | 8,920 | 2.3ms | 4.2 |
| pg-replica-1 | 8,450 | 1,230 | 1.8ms | 1.1 |
| pg-replica-2 | 8,670 | 1,180 | 1.9ms | 1.3 |

### Disk Throughput
| Node | Read MB/s | Write MB/s | Utilization |
|------|-----------|------------|-------------|
| pg-primary | 245 | 189 | 78% |
| pg-replica-1 | 167 | 23 | 45% |
| pg-replica-2 | 172 | 21 | 47% |

### Alerts
⚠️ Primary node queue depth elevated (threshold: 3.0)

### Analysis
The primary node is experiencing I/O pressure due to:
- Heavy write workload during peak hours
- Large sequential scans on orders table
- WAL generation rate: 234MB/min

### Recommendations
1. Enable read replicas for SELECT queries
2. Consider SSD upgrade for primary node
3. Optimize slow queries causing sequential scans`,
  },
  {
    question: "Network bandwidth utilization across services",
    answer: `## Network Bandwidth Report

### Top Bandwidth Consumers
| Service | Ingress | Egress | Total |
|---------|---------|--------|-------|
| cdn-proxy | 2.3 Gbps | 890 Mbps | 3.2 Gbps |
| api-gateway | 450 Mbps | 1.2 Gbps | 1.65 Gbps |
| data-pipeline | 780 Mbps | 340 Mbps | 1.12 Gbps |
| cache-service | 230 Mbps | 210 Mbps | 440 Mbps |
| search-service | 120 Mbps | 340 Mbps | 460 Mbps |

### Network Saturation
| Interface | Capacity | Used | Status |
|-----------|----------|------|--------|
| eth0-primary | 10 Gbps | 6.2 Gbps | ✅ OK |
| eth1-internal | 25 Gbps | 4.5 Gbps | ✅ OK |
| bond0-storage | 40 Gbps | 12 Gbps | ✅ OK |

### Anomalies
- data-pipeline egress dropped 45% at 14:00 (batch job completed)
- Unusual inter-service traffic between order-svc and inventory-svc

### Recommendations
1. Enable compression for inter-service communication
2. Review data-pipeline batch scheduling`,
  },
  {
    question: "Compare metrics between production and staging",
    answer: `## Environment Comparison: Prod vs Staging

| Metric | Production | Staging | Variance |
|--------|------------|---------|----------|
| Request Rate | 45K/min | 2.3K/min | Expected |
| Error Rate | 0.34% | 0.12% | ⚠️ Prod higher |
| P95 Latency | 234ms | 89ms | ⚠️ 2.6x slower |
| CPU Usage | 67% | 23% | Expected |
| Memory | 78% | 45% | Expected |

### Service-Level Comparison
| Service | Prod Latency | Staging Latency | Diff |
|---------|--------------|-----------------|------|
| payment-svc | 456ms | 123ms | +270% |
| order-svc | 234ms | 98ms | +139% |
| auth-svc | 67ms | 45ms | +49% |

### Key Differences
1. Production has 3x more database connections
2. Cache hit ratio: Prod 67% vs Staging 89%
3. External API latency higher in prod

### Recommendations
1. Investigate payment-svc latency gap
2. Review prod cache configuration
3. Add staging traffic simulation`,
  },
  {
    question: "What's the current error rate?",
    answer: `## Error Rate Analysis

**Current Overall Error Rate**: 0.34% (↑12% from baseline)

### By Service
| Service | Error Rate | Trend | Status |
|---------|------------|-------|--------|
| payment-svc | 0.89% | ↑ +45% | ⚠️ High |
| order-svc | 0.23% | → | ✅ Normal |
| auth-svc | 0.12% | ↓ -8% | ✅ Normal |
| cart-svc | 0.18% | → | ✅ Normal |
| search-svc | 0.05% | → | ✅ Normal |

### Error Types
| Error | Count/hr | % of Total |
|-------|----------|------------|
| 5xx Server Errors | 234 | 45% |
| Timeout Errors | 156 | 30% |
| Validation Errors | 89 | 17% |
| Auth Errors | 42 | 8% |

### Root Cause
payment-svc experiencing elevated errors due to external gateway timeouts

### Immediate Actions
1. Check stripe-api health status
2. Review payment-svc circuit breaker config`,
  },
  {
    question: "Show me JVM heap metrics",
    answer: `## JVM Heap Metrics Overview

### Current Heap Status
| Service | Heap Used | Max Heap | GC Pause | Status |
|---------|-----------|----------|----------|--------|
| order-svc | 1.2GB | 2GB | 120ms | ⚠️ High |
| payment-svc | 890MB | 1.5GB | 45ms | ✅ OK |
| auth-svc | 456MB | 1GB | 23ms | ✅ OK |
| cart-svc | 678MB | 1GB | 67ms | ✅ OK |
| report-svc | 1.8GB | 2GB | 234ms | 🔴 Critical |

### GC Analysis
| Service | Young GC | Old GC | Full GC/hr |
|---------|----------|--------|------------|
| order-svc | 45/min | 2/min | 3 |
| payment-svc | 23/min | 0.5/min | 0 |
| report-svc | 67/min | 8/min | 12 |

### Alerts
- **order-svc**: Approaching heap limit (60%), GC pauses increasing
- **report-svc**: Full GC frequency too high, potential memory leak

### Recommendations
1. Increase order-svc heap to 3GB
2. Profile report-svc for memory leaks
3. Enable G1GC for order-svc`,
  },
  {
    question: "Database connection pool status",
    answer: `## Connection Pool Status

### PostgreSQL Pools
| Database | Active | Idle | Max | Wait | Status |
|----------|--------|------|-----|------|--------|
| primary | 45 | 5 | 50 | 2ms | ⚠️ 90% |
| replica-1 | 23 | 27 | 50 | 0ms | ✅ OK |
| replica-2 | 21 | 29 | 50 | 0ms | ✅ OK |

### Redis Pools
| Cluster | Active | Max | Utilization |
|---------|--------|-----|-------------|
| session | 89 | 100 | 89% |
| cache | 45 | 200 | 23% |
| queue | 34 | 100 | 34% |

### Connection Statistics
| Metric | Value | Threshold |
|--------|-------|-----------|
| Avg wait time | 2.3ms | <10ms ✅ |
| Connection timeouts | 3/hr | <5/hr ✅ |
| Pool exhaustion events | 0 | 0 ✅ |

### Alerts
⚠️ Primary pool at 90% capacity - consider scaling

### Recommendations
1. Increase primary pool max to 75
2. Enable connection pool metrics
3. Review long-running queries`,
  },
  {
    question: "Kafka consumer lag metrics",
    answer: `## Kafka Consumer Lag Analysis

### Topic Overview
| Topic | Partitions | Producers | Consumers | Lag |
|-------|------------|-----------|-----------|-----|
| orders | 12 | 3 | 3 | 1,234 |
| events | 24 | 8 | 6 | 45 |
| notifications | 6 | 2 | 2 | 5,678 |
| analytics | 12 | 4 | 2 | 89,234 |

### Consumer Group Details
| Group | Topic | Lag | Rate In | Rate Out |
|-------|-------|-----|---------|----------|
| order-processor | orders | 1,234 | 234/s | 189/s |
| notification-svc | notifications | 5,678 | 45/s | 23/s |
| analytics-pipeline | analytics | 89,234 | 890/s | 456/s |

### Critical Alerts
🔴 **analytics** consumer lag critical
- Current lag: 89,234 messages
- Time to catch up: 3.2 hours at current rate
- Root cause: Consumer processing slowdown

### Recommendations
1. Scale analytics consumers from 2 to 6
2. Increase batch size for analytics-pipeline
3. Add consumer lag alerting at 10K threshold`,
  },
  {
    question: "Redis cache hit ratio",
    answer: `## Redis Cache Performance

### Cluster Overview
| Cluster | Hit Rate | Miss Rate | Memory | Status |
|---------|----------|-----------|--------|--------|
| session | 94.2% | 5.8% | 2.3GB | ✅ Excellent |
| cart | 87.5% | 12.5% | 1.8GB | ✅ Good |
| catalog | 78.3% | 21.7% | 4.5GB | ⚠️ Below target |
| search | 91.2% | 8.8% | 890MB | ✅ Excellent |

### Performance Metrics
| Metric | session | cart | catalog |
|--------|---------|------|---------|
| Ops/sec | 45K | 23K | 12K |
| Latency P50 | 0.3ms | 0.4ms | 0.8ms |
| Latency P99 | 1.2ms | 1.8ms | 3.4ms |
| Evictions/hr | 0 | 234 | 4,567 |

### Issues
**catalog** cache performance below 80% threshold:
- High eviction rate due to memory pressure
- TTL too short for catalog items
- Key pattern causing hot spots

### Recommendations
1. Increase catalog cluster memory to 8GB
2. Extend catalog TTL from 5min to 30min
3. Add key hashing for better distribution`,
  },
  {
    question: "HTTP request rate by endpoint",
    answer: `## HTTP Request Rate Analysis

### Top Endpoints (Last 5 min)
| Endpoint | Rate | P95 | Errors | Trend |
|----------|------|-----|--------|-------|
| GET /api/v1/products | 2.3K/s | 45ms | 0.1% | ↑ |
| POST /api/v1/checkout | 890/s | 234ms | 0.5% | → |
| POST /api/v1/auth/login | 1.2K/s | 67ms | 0.2% | → |
| GET /api/v1/search | 3.4K/s | 89ms | 0.1% | ↑ |
| GET /api/v1/cart | 1.8K/s | 34ms | 0.05% | → |

### Request Distribution
| Method | Count/min | Percentage |
|--------|-----------|------------|
| GET | 420K | 72% |
| POST | 134K | 23% |
| PUT | 23K | 4% |
| DELETE | 5.8K | 1% |

### Geographic Distribution
| Region | Requests/s | Latency |
|--------|------------|---------|
| US-East | 4.2K | 45ms |
| US-West | 2.8K | 67ms |
| EU-West | 1.9K | 89ms |
| AP-East | 1.2K | 134ms |

### Alerts
⚠️ checkout endpoint error rate elevated (0.5%)`,
  },
  {
    question: "Container resource usage",
    answer: `## Container Resource Report

### Resource Utilization
| Pod | CPU | Memory | Restarts | Status |
|-----|-----|--------|----------|--------|
| payment-7d8f9 | 78% | 1.2GB | 0 | ⚠️ High CPU |
| order-5c6d7 | 45% | 890MB | 2 | ⚠️ Restarts |
| auth-8e9f0 | 23% | 456MB | 0 | ✅ OK |
| cart-3a4b5 | 34% | 567MB | 0 | ✅ OK |
| search-1x2y3 | 56% | 1.1GB | 0 | ✅ OK |

### Resource Requests vs Limits
| Pod | CPU Req | CPU Lim | Mem Req | Mem Lim |
|-----|---------|---------|---------|---------|
| payment | 500m | 1000m | 512Mi | 1.5Gi |
| order | 250m | 500m | 256Mi | 1Gi |
| auth | 100m | 250m | 128Mi | 512Mi |

### Alerts
- **order-5c6d7**: Restarted 2x in last hour (OOMKilled)
- **payment-7d8f9**: CPU approaching limit (78%)

### Recommendations
1. Increase order-svc memory limit to 1.5Gi
2. Scale payment-svc horizontally`,
  },
  {
    question: "Garbage collection pause times",
    answer: `## GC Pause Analysis

### Service Summary
| Service | Avg Pause | Max Pause | Frequency | Status |
|---------|-----------|-----------|-----------|--------|
| order-svc | 120ms | 890ms | 12/min | 🔴 High |
| payment-svc | 45ms | 234ms | 8/min | ✅ OK |
| auth-svc | 23ms | 89ms | 5/min | ✅ OK |
| cart-svc | 56ms | 178ms | 7/min | ✅ OK |
| report-svc | 234ms | 1,234ms | 15/min | 🔴 Critical |

### GC Type Breakdown
| Service | Young GC | Old GC | Full GC |
|---------|----------|--------|---------|
| order-svc | 85% | 12% | 3% |
| report-svc | 60% | 25% | 15% |

### Impact Analysis
- **order-svc**: Max 890ms pause affecting P99 latency
- **report-svc**: Full GC causing 1.2s stop-the-world events

### Root Causes
1. order-svc: Large object allocation in OrderMapper
2. report-svc: Memory leak in ReportGenerator

### Recommendations
1. Tune -XX:MaxGCPauseMillis=200 for order-svc
2. Profile and fix memory leak in report-svc
3. Consider ZGC for low-latency requirements`,
  },
  {
    question: "API throughput summary",
    answer: `## API Throughput Summary

### Overall Statistics
- **Total Requests**: 45.2K/min
- **Success Rate**: 99.66%
- **Total Bandwidth**: 2.3 GB/min

### By HTTP Method
| Method | Count | Avg Latency | Error Rate |
|--------|-------|-------------|------------|
| GET | 34.5K | 45ms | 0.12% |
| POST | 8.7K | 123ms | 0.56% |
| PUT | 1.5K | 89ms | 0.34% |
| DELETE | 0.5K | 67ms | 0.23% |

### By Service
| Service | Throughput | P95 | Availability |
|---------|------------|-----|--------------|
| api-gateway | 45K/min | 89ms | 99.97% |
| auth-service | 12K/min | 67ms | 99.99% |
| order-service | 8.9K/min | 234ms | 99.87% |
| payment-service | 4.5K/min | 456ms | 99.65% |

### Trends
- ↑ 12% increase from last week
- Peak hour: 14:00-15:00 UTC (67K/min)
- Lowest: 04:00-05:00 UTC (12K/min)`,
  },
  {
    question: "Show pod CPU throttling",
    answer: `## CPU Throttling Report

### Throttled Pods
| Pod | Throttled % | Limit | Request | Ratio |
|-----|-------------|-------|---------|-------|
| analytics-job | 45% | 1 core | 0.5 core | 2:1 |
| order-processor | 23% | 2 cores | 1 core | 2:1 |
| report-gen | 12% | 2 cores | 1 core | 2:1 |
| batch-worker | 34% | 0.5 core | 0.25 core | 2:1 |

### Throttling Impact
| Pod | Latency Impact | Affected Requests |
|-----|----------------|-------------------|
| analytics-job | +234ms | 45K/hr |
| order-processor | +89ms | 12K/hr |

### CFS Period Analysis
| Pod | Period | Quota | Throttled Periods |
|-----|--------|-------|-------------------|
| analytics-job | 100ms | 50ms | 4,567/hr |
| order-processor | 100ms | 100ms | 2,345/hr |

### Recommendations
1. Increase analytics-job limit to 2 cores
2. Set burstable QoS for batch workloads
3. Review request/limit ratios (target 1:1.5)`,
  },
  {
    question: "Analyze load balancer metrics",
    answer: `## Load Balancer Analysis

### Active Connections
| LB | Active | Max | Utilization |
|----|--------|-----|-------------|
| alb-prod-api | 12,456 | 50,000 | 25% |
| nlb-internal | 4,567 | 20,000 | 23% |
| alb-staging | 234 | 10,000 | 2% |

### Traffic Distribution
| Backend | Requests/s | Health | Weight |
|---------|------------|--------|--------|
| api-1 | 3,456 | ✅ | 33% |
| api-2 | 3,421 | ✅ | 33% |
| api-3 | 3,512 | ✅ | 34% |

### Health Check Status
| Target Group | Healthy | Unhealthy | Draining |
|--------------|---------|-----------|----------|
| api-targets | 6 | 0 | 0 |
| auth-targets | 4 | 0 | 0 |
| web-targets | 3 | 1 | 0 |

### Alerts
⚠️ web-targets has 1 unhealthy instance (web-server-04)

### Recommendations
1. Investigate web-server-04 health
2. Enable cross-zone load balancing`,
  },
  {
    question: "Show queue depth metrics",
    answer: `## Message Queue Metrics

### RabbitMQ Overview
| Queue | Messages | Consumers | Rate In | Rate Out |
|-------|----------|-----------|---------|----------|
| orders.process | 1,234 | 5 | 234/s | 234/s |
| notifications | 456 | 3 | 89/s | 89/s |
| analytics | 5,678 | 2 | 67/s | 45/s |
| email.send | 234 | 4 | 45/s | 45/s |
| sms.send | 89 | 2 | 12/s | 12/s |

### Queue Health
| Queue | Memory | State | Consumers |
|-------|--------|-------|-----------|
| orders.process | 234MB | Running | ✅ Sufficient |
| analytics | 567MB | Running | ⚠️ Low |

### Issues Detected
⚠️ **analytics** queue depth increasing:
- Current: 5,678 messages
- Rate in: 67/s | Rate out: 45/s
- Deficit: 22/s
- Time to drain: 4.2 hours

### Recommendations
1. Scale analytics consumers to 4
2. Enable queue length alerting
3. Consider dead-letter queue for failed messages`,
  },
  {
    question: "Analyze service mesh metrics",
    answer: `## Service Mesh Metrics (Istio)

### Request Success Rate
| Service | Success | Failures | Latency P99 |
|---------|---------|----------|-------------|
| api-gateway | 99.8% | 0.2% | 45ms |
| payment-svc | 99.2% | 0.8% | 234ms |
| order-svc | 99.6% | 0.4% | 123ms |
| auth-svc | 99.9% | 0.1% | 67ms |

### Circuit Breaker Status
| Source | Destination | State | Trips/hr | Timeout |
|--------|-------------|-------|----------|---------|
| payment | stripe-api | Closed | 0 | 30s |
| order | inventory | Half-Open | 3 | 10s |
| auth | ldap | Closed | 0 | 5s |

### mTLS Status
| Namespace | Enabled | Mode | Coverage |
|-----------|---------|------|----------|
| production | Yes | STRICT | 100% |
| staging | Yes | PERMISSIVE | 89% |

### Alerts
⚠️ order→inventory circuit tripped 3x in last hour

### Recommendations
1. Investigate inventory-service health
2. Tune circuit breaker thresholds
3. Enable outlier detection`,
  },
  {
    question: "Show CDN cache performance",
    answer: `## CDN Cache Metrics

### Global Performance
| Region | Hit Rate | Bandwidth | Latency |
|--------|----------|-----------|---------|
| US-East | 94.2% | 2.3 Gbps | 12ms |
| US-West | 92.8% | 1.9 Gbps | 18ms |
| EU-West | 91.8% | 1.8 Gbps | 28ms |
| AP-South | 87.3% | 890 Mbps | 45ms |
| AP-East | 89.5% | 1.2 Gbps | 38ms |

### Cache Efficiency
| Metric | Value | Target |
|--------|-------|--------|
| Total Requests | 45.2M/hr | - |
| Cache Hits | 41.8M/hr | 40M+ |
| Origin Requests | 3.4M/hr | <5M |
| Hit Ratio | 92.5% | >90% |

### Content Type Breakdown
| Type | Hit Rate | Size |
|------|----------|------|
| Images | 98.2% | 12TB |
| JS/CSS | 96.5% | 2.3TB |
| HTML | 45.6% | 890GB |
| API responses | 67.8% | 456GB |

### Cost Savings
- Origin bandwidth saved: $12,340/day
- Transfer acceleration: $4,567/day saved`,
  },
  {
    question: "Database replication lag analysis",
    answer: `## Replication Lag Report

### PostgreSQL Cluster
| Replica | Lag | Bytes Behind | Status | Sync Mode |
|---------|-----|--------------|--------|-----------|
| replica-1 | 12ms | 234KB | ✅ | Async |
| replica-2 | 8ms | 156KB | ✅ | Async |
| replica-3 | 2,345ms | 45MB | ⚠️ | Async |

### Replication Statistics
| Metric | replica-1 | replica-2 | replica-3 |
|--------|-----------|-----------|-----------|
| Replay rate | 12MB/s | 11MB/s | 2MB/s |
| Write latency | 1.2ms | 1.3ms | 23ms |
| Flush latency | 0.8ms | 0.9ms | 18ms |

### Issue Details: replica-3
- **Current lag**: 2,345ms (threshold: 1,000ms)
- **Network latency**: 234ms (elevated)
- **Disk I/O wait**: 23% (high)
- **WAL segments pending**: 156

### Root Cause Analysis
1. Cross-AZ network congestion (AZ-3)
2. Storage performance degradation
3. Heavy write workload during peak

### Recommendations
1. Investigate AZ-3 network
2. Upgrade replica-3 storage to io2
3. Consider synchronous replication for critical data`,
  },
  {
    question: "Show DNS resolution metrics",
    answer: `## DNS Resolution Metrics

### Internal DNS (CoreDNS)
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Queries/sec | 12,456 | 50,000 | ✅ OK |
| Latency P50 | 1.2ms | <5ms | ✅ OK |
| Latency P99 | 8.7ms | <20ms | ✅ OK |
| Cache Hit | 89% | >80% | ✅ OK |
| NXDOMAIN | 0.3% | <1% | ✅ OK |
| SERVFAIL | 0.01% | <0.1% | ✅ OK |

### Query Distribution
| Record Type | Count/min | Percentage |
|-------------|-----------|------------|
| A | 8,234 | 66% |
| AAAA | 2,345 | 19% |
| SRV | 1,234 | 10% |
| CNAME | 643 | 5% |

### External DNS
| Provider | Latency | Availability | Queries |
|----------|---------|--------------|---------|
| Route53 | 23ms | 100% | 4.5K/min |
| CloudFlare | 12ms | 100% | 890/min |

### Alerts
All DNS services healthy - no issues detected`,
  },
  {
    question: "Analyze object storage metrics",
    answer: `## S3 Storage Metrics

### Bucket Usage
| Bucket | Size | Objects | Class | Cost/mo |
|--------|------|---------|-------|---------|
| assets-prod | 2.3 TB | 1.2M | Standard | $52 |
| backups | 12.4 TB | 45K | Glacier | $284 |
| logs-archive | 8.9 TB | 890K | IA | $205 |
| uploads-temp | 456 GB | 234K | Standard | $10 |

### Request Patterns (Last 24h)
| Operation | Count | Cost | Latency |
|-----------|-------|------|---------|
| GET | 65M | $32.50 | 23ms |
| PUT | 3.3M | $16.50 | 45ms |
| LIST | 1.3M | $6.50 | 67ms |
| DELETE | 234K | $0.12 | 12ms |

### Bandwidth
| Direction | Transfer | Cost |
|-----------|----------|------|
| In | 2.3 TB | $0 |
| Out | 8.9 TB | $802 |
| Same-region | 4.5 TB | $45 |

### Optimization Recommendations
1. Enable Intelligent Tiering for logs-archive (-$82/mo)
2. Lifecycle policy for uploads-temp (7 day expiry)
3. Enable transfer acceleration for assets-prod`,
  },
  {
    question: "Show certificate transparency logs",
    answer: `## Certificate Monitoring

### Active Certificates
| Domain | Issuer | Expires | Days Left | Status |
|--------|--------|---------|-----------|--------|
| *.telemetryflow.id | Let's Encrypt | Apr 2 | 60 | ✅ OK |
| api.telemetryflow.id | DigiCert | Aug 2 | 180 | ✅ OK |
| admin.telemetryflow.id | Let's Encrypt | Feb 28 | 26 | ⚠️ Renew |
| cdn.telemetryflow.id | CloudFlare | May 15 | 103 | ✅ OK |

### Certificate Health
| Status | Count | Action Required |
|--------|-------|-----------------|
| Healthy (>60d) | 12 | None |
| Warning (30-60d) | 4 | Plan renewal |
| Critical (<30d) | 2 | Renew now |

### CT Log Entries (Last 24h)
| Event | Count | Details |
|-------|-------|---------|
| New certificates | 2 | staging.telemetryflow.id |
| Renewals | 1 | api-internal.telemetryflow.id |
| Suspicious | 0 | None detected |

### Recommendations
1. Renew admin.telemetryflow.id before Feb 20
2. Enable auto-renewal for manual certs
3. Set up CT log monitoring alerts`,
  },
  {
    question: "Analyze serverless function metrics",
    answer: `## Lambda Function Metrics

### Invocation Statistics
| Function | Invocations | Avg Duration | Errors | Cost |
|----------|-------------|--------------|--------|------|
| image-processor | 23,456 | 234ms | 0.1% | $12.34 |
| email-sender | 12,890 | 89ms | 0.05% | $4.56 |
| report-gen | 567 | 4,567ms | 1.2% | $8.90 |
| webhook-handler | 8,901 | 123ms | 0.08% | $5.67 |

### Cold Start Analysis
| Function | Cold Starts | Cold Duration | Warm Duration |
|----------|-------------|---------------|---------------|
| image-processor | 2.3% | 890ms | 234ms |
| email-sender | 1.8% | 456ms | 89ms |
| report-gen | 12.4% | 2,345ms | 4,567ms |
| webhook-handler | 0.5% | 234ms | 123ms |

### Concurrency
| Function | Reserved | Peak | Throttled |
|----------|----------|------|-----------|
| image-processor | 100 | 89 | 0 |
| report-gen | 10 | 12 | 23 |

### Recommendations
1. Enable provisioned concurrency for report-gen
2. Reduce report-gen cold starts (optimize bundle)
3. Increase report-gen reserved concurrency to 20`,
  },
  {
    question: "Show network firewall metrics",
    answer: `## Firewall Metrics

### Traffic Analysis
| Rule | Allowed | Blocked | Allow Rate |
|------|---------|---------|------------|
| HTTPS Inbound | 1.2M | 0 | 100% |
| SSH Admin | 234 | 12K | 2% |
| DB Access | 45K | 890 | 98% |
| Internal | 567K | 0 | 100% |

### Blocked Traffic Sources
| Source IP | Attempts | Reason | Action |
|-----------|----------|--------|--------|
| 185.x.x.x | 4,567 | Brute force | Auto-blocked |
| 203.x.x.x | 2,345 | Port scan | Auto-blocked |
| 91.x.x.x | 1,234 | Known malicious | Permanent block |
| 178.x.x.x | 890 | Rate exceeded | Temp block |

### Attack Patterns
| Type | Count | Trend |
|------|-------|-------|
| SSH brute force | 12,456 | ↑ 23% |
| Port scanning | 4,567 | → |
| HTTP flood | 2,345 | ↓ 12% |

### Summary
- **Auto-Blocked**: 23 IPs in last 24h
- **Permanent blocks**: 156 IPs total
- **WAF rules triggered**: 4,567 times`,
  },
  {
    question: "Analyze streaming pipeline metrics",
    answer: `## Kafka Streaming Metrics

### Broker Health
| Broker | Partitions | Leader | ISR | Status |
|--------|------------|--------|-----|--------|
| broker-1 | 45 | 15 | 45/45 | ✅ |
| broker-2 | 45 | 15 | 45/45 | ✅ |
| broker-3 | 45 | 15 | 44/45 | ⚠️ |

### Topic Throughput
| Topic | Messages In | Messages Out | Lag |
|-------|-------------|--------------|-----|
| events | 12K/s | 12K/s | 0 |
| orders | 4.5K/s | 4.2K/s | 300 |
| logs | 89K/s | 89K/s | 0 |
| analytics | 23K/s | 18K/s | 5,000 |

### Partition Balance
| Topic | Leader Skew | Replica Skew |
|-------|-------------|--------------|
| events | 0% | 0% |
| orders | 5% | 2% |
| analytics | 12% | 8% |

### Alerts
- ⚠️ broker-3: 1 partition under-replicated
- ⚠️ orders: consumer lag increasing
- ⚠️ analytics: leader skew above threshold

### Recommendations
1. Rebalance analytics partitions
2. Scale orders consumers
3. Investigate broker-3 ISR issue`,
  },
  {
    question: "Show service level indicators",
    answer: `## SLI Dashboard

### Availability SLIs
| Service | Target | Current | Error Budget | Status |
|---------|--------|---------|--------------|--------|
| API | 99.9% | 99.94% | 72% left | ✅ |
| Web | 99.9% | 99.87% | 23% left | ⚠️ |
| Mobile | 99.5% | 99.78% | 100% left | ✅ |
| Payments | 99.95% | 99.89% | -18% | 🔴 |

### Latency SLIs
| Endpoint | Target P95 | Current | Status |
|----------|------------|---------|--------|
| /checkout | <500ms | 456ms | ✅ |
| /search | <200ms | 234ms | ⚠️ |
| /auth | <100ms | 67ms | ✅ |
| /products | <300ms | 189ms | ✅ |

### Error Budget Status
| Service | 30-day Budget | Used | Remaining |
|---------|---------------|------|-----------|
| API | 43.2 min | 12.3 min | 30.9 min |
| Web | 43.2 min | 33.2 min | 10.0 min |
| Payments | 21.6 min | 25.4 min | -3.8 min |

### Recommendations
1. Payments SLO breached - incident review required
2. Web approaching budget limit - reduce deployments
3. Search latency needs optimization`,
  },
  {
    question: "Analyze batch job metrics",
    answer: `## Batch Job Metrics

### Daily Jobs Status
| Job | Schedule | Last Run | Duration | Status |
|-----|----------|----------|----------|--------|
| ETL-daily | 02:00 UTC | 2h ago | 2h 34m | ✅ |
| Report-gen | 06:00 UTC | 6h ago | 45m | ✅ |
| Cleanup | 04:00 UTC | 4h ago | 12m | ✅ |
| Backup | 01:00 UTC | 7h ago | 1h 23m | ✅ |
| Sync-job | */15 * * * * | 3m ago | 2m | ✅ |

### Resource Usage
| Job | CPU Peak | Memory Peak | Data Processed |
|-----|----------|-------------|----------------|
| ETL-daily | 8 cores | 16GB | 12.4M rows |
| Report-gen | 4 cores | 8GB | 23K reports |
| Cleanup | 2 cores | 4GB | 890K files |
| Backup | 4 cores | 8GB | 45GB |

### Failed Jobs (Last 7d)
| Job | Date | Error | Resolution |
|-----|------|-------|------------|
| ETL-daily | Feb 1 | OOM | Increased memory |
| Sync-job | Jan 30 | Timeout | Extended deadline |

### Trends
| Job | Avg Duration | Trend |
|-----|--------------|-------|
| ETL-daily | 2h 15m | ↑ +15% |
| Report-gen | 42m | → |
| Backup | 1h 18m | → |`,
  },
];

export const METRICS_CONVERSATION_TITLES = [
  "CPU spike analysis on payment-service",
  "Memory leak detection in order-processor",
  "Disk I/O anomaly on database cluster",
  "Network latency investigation between services",
  "Request rate drop during peak hours",
  "JVM heap memory analysis",
  "Kafka consumer lag investigation",
  "Redis cache performance review",
  "Load balancer traffic analysis",
  "Service mesh latency patterns",
];
