/**
 * Service Map Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for service dependency and topology analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const SERVICE_MAP_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the current service dependency map",
    answer: `## Service Dependency Map

### Service Topology Overview
\`\`\`
                    ┌─────────────┐
                    │  CDN/Edge   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼─────┐ ┌───▼──────┐
        │user-svc  │ │order-svc │ │payment-  │
        │          │ │          │ │service   │
        └─────┬────┘ └────┬─────┘ └───┬──────┘
              │      ┌────┴────┐      │
              │      │         │      │
        ┌─────▼──┐ ┌─▼──────┐ ┌▼─────────┐
        │auth-db │ │inv-svc │ │Stripe API│
        └────────┘ └────────┘ └──────────┘
\`\`\`

### Service Count by Tier
| Tier | Services | Healthy | Degraded | Down |
|------|----------|---------|----------|------|
| Edge | 2 | 2 | 0 | 0 |
| API | 1 | 1 | 0 | 0 |
| Application | 6 | 5 | 1 | 0 |
| Data | 4 | 3 | 1 | 0 |
| External | 3 | 2 | 1 | 0 |

### Current Issues
| Service | Status | Issue | Since |
|---------|--------|-------|-------|
| payment-service | ⚠️ Degraded | High latency to Stripe API | 25m ago |
| postgres-replica | ⚠️ Degraded | Replication lag 2.3s | 10m ago |
| stripe-api | ⚠️ External | Elevated response times | 30m ago |

### Total Services Discovered: **16**
### Total Edges (Dependencies): **28**`,
  },
  {
    question: "Which services have the highest dependency count?",
    answer: `## Service Dependency Analysis

### Top Services by Dependency Count
| Service | Upstream | Downstream | Total Deps | Criticality |
|---------|----------|------------|------------|-------------|
| api-gateway | 2 | 6 | 8 | 🔴 Critical |
| order-service | 3 | 5 | 8 | 🔴 Critical |
| user-service | 2 | 4 | 6 | ⚠️ High |
| payment-service | 2 | 3 | 5 | ⚠️ High |
| inventory-service | 3 | 2 | 5 | ⚠️ High |
| notification-svc | 4 | 1 | 5 | ⚠️ High |
| auth-service | 5 | 1 | 6 | 🔴 Critical |

### Dependency Direction Details
| Service | Depends On (Downstream) | Depended By (Upstream) |
|---------|------------------------|----------------------|
| api-gateway | user, order, payment, inventory, notification, auth | CDN, mobile-app |
| order-service | inventory, payment, notification, postgres, redis | api-gateway, web-hook, scheduler |
| auth-service | postgres | api-gateway, user, order, payment, notification |

### Risk Assessment
| Risk Type | Services Affected | Mitigation |
|-----------|------------------|------------|
| Single point of failure | api-gateway, auth-service | Multi-instance + circuit breaker |
| Cascade failure risk | order → payment → stripe | Async queue fallback |
| Circular dependency | None detected | ✅ Clean topology |

### Recommendation
\`auth-service\` is a critical dependency for 5 services. Ensure:
- At least 3 replicas running
- Circuit breaker configured with 5s timeout
- Local token cache (60s TTL) to survive auth-service outages`,
  },
  {
    question: "Show me the request flow for a typical checkout",
    answer: `## Checkout Request Flow Analysis

### End-to-End Flow
| Step | Service | Method | Avg Latency | Error Rate |
|------|---------|--------|-------------|------------|
| 1 | api-gateway | POST /checkout | 3ms | 0.01% |
| 2 | auth-service | Validate JWT | 12ms | 0.02% |
| 3 | user-service | GET /profile | 15ms | 0.03% |
| 4 | inventory-service | POST /reserve | 45ms | 0.1% |
| 5 | payment-service | POST /charge | 890ms | 1.2% |
| 6 | order-service | POST /create | 67ms | 0.05% |
| 7 | notification-svc | POST /email | 23ms | 0.02% |
| **Total** | | | **1,055ms** | **1.4%** |

### Latency Breakdown
\`\`\`
api-gateway:     ██░░░░░░░░░░░░░░░░░░ 3ms   (0.3%)
auth-service:    ██░░░░░░░░░░░░░░░░░░ 12ms  (1.1%)
user-service:    ███░░░░░░░░░░░░░░░░░ 15ms  (1.4%)
inventory-svc:   █████░░░░░░░░░░░░░░░ 45ms  (4.3%)
payment-service: █████████████████░░░ 890ms (84.4%) ← Bottleneck
order-service:   ███████░░░░░░░░░░░░░ 67ms  (6.4%)
notification:    ███░░░░░░░░░░░░░░░░░ 23ms  (2.2%)
\`\`\`

### Critical Path
**api-gateway → auth → user → inventory → payment → order → notification**

Payment service dominates at 84.4% of total checkout latency. This is primarily external API call to Stripe.

### Optimization Opportunities
1. **Parallelize** steps 3 & 4 (user profile + inventory check) — saves ~15ms
2. **Async notification** — move step 7 to background queue — saves ~23ms
3. **Pre-auth payment** — authorize during cart, capture at checkout — saves ~500ms`,
  },
  {
    question: "Are there any unhealthy service connections?",
    answer: `## Unhealthy Service Connections

### Connection Health Dashboard
| Source → Target | Protocol | Status | Error Rate | p99 Latency |
|-----------------|----------|--------|------------|-------------|
| api-gw → payment-svc | gRPC | ⚠️ Degraded | 2.3% | 3,450ms |
| order-svc → inventory-svc | gRPC | ⚠️ Degraded | 1.8% | 890ms |
| payment-svc → stripe-api | HTTPS | 🔴 Critical | 5.6% | 8,900ms |
| user-svc → postgres-replica | TCP | ⚠️ Degraded | 0.5% | 45ms |

### Healthy Connections (Spot Check)
| Source → Target | Protocol | Error Rate | p99 Latency | Status |
|-----------------|----------|------------|-------------|--------|
| api-gw → user-svc | gRPC | 0.01% | 23ms | ✅ |
| api-gw → auth-svc | gRPC | 0.02% | 18ms | ✅ |
| order-svc → redis | TCP | 0% | 1.2ms | ✅ |
| notification → kafka | TCP | 0.01% | 5ms | ✅ |

### Circuit Breaker States
| Connection | State | Failures | Threshold | Recovery In |
|------------|-------|----------|-----------|-------------|
| payment → stripe | Half-Open | 23/50 | 50 | Testing |
| order → inventory | Closed | 8/30 | 30 | N/A |
| user → pg-replica | Closed | 3/20 | 20 | N/A |

### Root Cause Chain
\`\`\`
Stripe API degradation (external)
  └→ payment-service elevated latency
      └→ api-gateway timeout increase
          └→ order-service retry storms
              └→ inventory-service overload
\`\`\`

### Mitigation Actions
1. Stripe API: Switch to backup payment processor (Adyen)
2. Enable request hedging for payment-service
3. Increase order-service circuit breaker timeout to 10s`,
  },
  {
    question: "How do I add a new service to the service map?",
    answer: `## Adding a New Service to the Service Map

### Auto-Discovery (Recommended)
Services are automatically discovered when they emit traces via OpenTelemetry. Simply instrument your service:

\`\`\`typescript
// Install dependencies
// npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

const sdk = new NodeSDK({
  serviceName: 'my-new-service',
  traceExporter: new OTLPTraceExporter({
    url: 'https://collector.telemetryflow.id:4317',
    headers: { Authorization: 'Bearer <API_KEY>' },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
\`\`\`

### Manual Registration
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/service-map/services \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "my-new-service",
    "type": "application",
    "tier": "application",
    "team": "backend",
    "dependencies": ["postgres", "redis", "auth-service"],
    "metadata": {
      "language": "typescript",
      "framework": "nestjs",
      "repository": "github.com/org/my-service"
    }
  }'
\`\`\`

### Service Map Update Timeline
| Method | Discovery Time | Accuracy |
|--------|---------------|----------|
| Auto (OTEL traces) | ~5 minutes | High (real traffic) |
| Manual registration | Immediate | Depends on config |
| Hybrid (both) | Immediate + enrichment | Best |

### Verification
After instrumentation, check the service map in ~5 minutes. The service will appear once traces flow through TelemetryFlow's OTLP ingestion pipeline.`,
  },
  {
    question: "What's the error propagation pattern between services?",
    answer: `## Error Propagation Analysis

### Error Flow Map (Last 1 Hour)
| Origin | Error Type | Propagated To | Impact |
|--------|-----------|---------------|--------|
| stripe-api | 503 Timeout | payment-svc → order-svc → api-gw | 234 users |
| postgres-primary | Connection reset | user-svc → api-gw | 89 users |
| kafka-broker-2 | Leader election | notification-svc (queued) | 0 users |

### Error Cascade Timeline
\`\`\`
14:23:00  stripe-api returns 503 (external issue)
14:23:01  payment-service logs error, retries (1/3)
14:23:03  payment-service retry fails (2/3)
14:23:06  payment-service retry fails (3/3), returns error
14:23:06  order-service receives payment failure
14:23:07  order-service rolls back inventory reservation
14:23:07  api-gateway returns 500 to client
14:23:08  client sees "Payment failed" error
\`\`\`

### Error Rate by Service (Last 1 Hour)
| Service | Total Requests | Errors | Error Rate | Error Source |
|---------|---------------|--------|------------|-------------|
| payment-service | 4,567 | 256 | 5.6% | 95% external (Stripe) |
| order-service | 8,901 | 198 | 2.2% | 100% upstream (payment) |
| api-gateway | 45,678 | 312 | 0.7% | 80% upstream cascade |
| user-service | 12,345 | 89 | 0.7% | 60% DB connection |
| notification-svc | 6,789 | 23 | 0.3% | Kafka broker failover |

### Blast Radius Assessment
- **Direct Impact:** payment-service (5.6% error rate)
- **Cascade Impact:** order-service, api-gateway
- **User Impact:** ~234 checkout failures in last hour
- **Revenue Impact:** ~$12,400 in failed transactions (estimated)

### Prevention Strategies
1. Implement payment fallback queue for retry
2. Add Stripe health check to circuit breaker
3. Configure order-service to return "pending" instead of "failed"`,
  },
  {
    question: "Show me the service map changes over the last 30 days",
    answer: `## Service Map Evolution (Last 30 Days)

### Services Added
| Service | Date Added | Type | Team |
|---------|-----------|------|------|
| recommendation-engine | 5 days ago | Application | ML Team |
| feature-flag-service | 12 days ago | Infrastructure | Platform |
| audit-logger | 18 days ago | Application | Security |

### Services Removed
| Service | Date Removed | Reason |
|---------|-------------|--------|
| legacy-auth-proxy | 8 days ago | Migrated to auth-service v2 |
| metrics-aggregator-v1 | 22 days ago | Replaced by TelemetryFlow native |

### Dependency Changes
| Change | Date | Description |
|--------|------|-------------|
| + order-svc → recommendation-engine | 5d ago | Product recommendations at checkout |
| + api-gw → feature-flag-service | 12d ago | Feature flag evaluation |
| - api-gw → legacy-auth-proxy | 8d ago | Auth migration complete |
| + audit-logger → kafka | 18d ago | Async audit event streaming |
| ~ payment-svc → stripe (v2→v3) | 15d ago | Stripe API version upgrade |

### Topology Metrics
| Metric | 30 Days Ago | Current | Change |
|--------|------------|---------|--------|
| Total Services | 14 | 16 | +2 |
| Total Edges | 24 | 28 | +4 |
| Avg Depth | 3.2 | 3.5 | +0.3 |
| Max Fan-out | 6 | 7 | +1 |
| Circular Dependencies | 0 | 0 | ✅ None |

### Complexity Score
- **30 days ago:** 42/100 (Moderate)
- **Current:** 48/100 (Moderate)
- **Trend:** Slight increase due to recommendation engine dependencies`,
  },
  {
    question: "What are the SLA dependencies for each service?",
    answer: `## Service SLA Dependencies

### SLA Hierarchy
| Service | Own SLA | Depends On | Effective SLA |
|---------|---------|-----------|---------------|
| api-gateway | 99.99% | auth (99.95%), routing (99.99%) | 99.94% |
| user-service | 99.95% | postgres (99.99%), auth (99.95%) | 99.94% |
| order-service | 99.9% | payment (99.5%), inventory (99.9%) | 99.4% |
| payment-service | 99.5% | stripe (99.9%), postgres (99.99%) | 99.49% |
| notification-svc | 99.0% | kafka (99.95%), smtp (99.5%) | 98.95% |

### SLA Risk Matrix
| Service | Current Availability | SLA Target | Margin | Risk |
|---------|---------------------|-----------|--------|------|
| api-gateway | 99.97% | 99.99% | -0.02% | 🔴 At Risk |
| order-service | 99.85% | 99.9% | -0.05% | 🔴 At Risk |
| payment-service | 99.62% | 99.5% | +0.12% | ✅ OK |
| user-service | 99.98% | 99.95% | +0.03% | ⚠️ Tight |
| notification-svc | 99.45% | 99.0% | +0.45% | ✅ OK |

### SLA Budget Remaining (This Month)
| Service | Budget | Used | Remaining | Downtime Left |
|---------|--------|------|-----------|---------------|
| api-gateway | 4.3 min | 3.8 min | 0.5 min | ⚠️ Low |
| order-service | 43.2 min | 38.4 min | 4.8 min | ⚠️ Low |
| payment-service | 216 min | 164 min | 52 min | ✅ OK |

### Recommendations
1. **api-gateway** — SLA budget nearly exhausted. Freeze non-critical deployments this month.
2. **order-service** — Payment service dependency drags SLA down. Add fallback queue.
3. Review SLA targets quarterly based on actual achievable availability.`,
  },
];

export const SERVICE_MAP_CONVERSATION_TITLES: string[] = [
  "Service dependency topology review",
  "Checkout flow latency analysis",
  "Unhealthy connection investigation",
  "Error propagation cascade analysis",
  "SLA dependency risk assessment",
  "Critical path identification in service map",
  "Service dependency health overview",
  "Orphaned service detection",
  "Traffic volume heatmap analysis",
  "Service version drift across environments",
];
