/**
 * Exemplars Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for trace exemplar analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const EXEMPLARS_MOCK_DATA: MockQA[] = [
  {
    question: "What are exemplars and how do they work?",
    answer: `## Understanding Exemplars in TelemetryFlow

### What Are Exemplars?
Exemplars are **representative trace samples** attached to metric data points. They bridge the gap between aggregated metrics and individual traces, enabling you to jump from a metric anomaly directly to a relevant trace.

### How They Work
| Step | Description |
|------|-------------|
| 1. Metric Recorded | A metric data point is recorded (e.g., request latency) |
| 2. Exemplar Attached | The SDK attaches trace context (trace_id, span_id) to the metric |
| 3. Stored in ClickHouse | Exemplars are stored with 7-day TTL in \`exemplars\` table |
| 4. Query & Correlate | Click an exemplar to jump directly to the full distributed trace |

### Exemplar Fields
| Field | Type | Description |
|-------|------|-------------|
| trace_id | string | Links to the full distributed trace |
| span_id | string | Links to the specific span within the trace |
| value | float64 | The metric value at that point |
| timestamp | DateTime | When the exemplar was recorded |
| labels | Map | Additional context labels |

### Supported Metric Types
- **Histograms** — Most common, exemplars on bucket boundaries
- **Counters** — Exemplars on significant increments
- **Summaries** — Exemplars on quantile boundaries

### Retention
- Raw exemplars: **7 days** TTL
- Aggregated exemplar stats: **30 days** TTL`,
  },
  {
    question: "Show me the latest exemplars for high-latency requests",
    answer: `## High-Latency Exemplars (Last 1 Hour)

### Exemplars with Latency > 500ms
| Trace ID | Service | Latency | Timestamp | Status |
|----------|---------|---------|-----------|--------|
| \`abc123def456\` | payment-service | 1,245ms | 3m ago | ❌ Error |
| \`ghi789jkl012\` | order-processor | 892ms | 7m ago | ✅ OK |
| \`mno345pqr678\` | inventory-api | 756ms | 12m ago | ⚠️ Timeout |
| \`stu901vwx234\` | checkout-flow | 623ms | 18m ago | ✅ OK |
| \`yza567bcd890\` | user-service | 589ms | 24m ago | ✅ OK |

### Latency Distribution with Exemplars
\`\`\`
Bucket     | Count | Exemplars
0-100ms    | 45,230 | 12
100-250ms  | 12,456 | 8
250-500ms  | 3,210  | 15
500ms-1s   | 456    | 23 ← Highest exemplar density
1s-2s      | 89     | 18
>2s        | 12     | 5
\`\`\`

### Root Cause Patterns
- **payment-service**: External gateway timeout (Stripe API)
- **order-processor**: Database connection pool exhaustion
- **inventory-api**: Cache miss causing full table scan

### Recommendation
Click any Trace ID above to view the full distributed trace and identify the exact bottleneck span.`,
  },
  {
    question: "How many exemplars are being collected per metric?",
    answer: `## Exemplar Collection Statistics

### Collection Rate (Last 24 Hours)
| Metric | Exemplars Collected | Rate | Storage |
|--------|-------------------|------|---------|
| http_request_duration_seconds | 12,450 | ~8.6/min | 2.4 MB |
| http_request_total | 8,234 | ~5.7/min | 1.6 MB |
| db_query_duration_seconds | 6,789 | ~4.7/min | 1.3 MB |
| grpc_server_handling_seconds | 4,567 | ~3.2/min | 0.9 MB |
| kafka_consumer_lag | 2,345 | ~1.6/min | 0.5 MB |
| cache_hit_ratio | 1,234 | ~0.9/min | 0.2 MB |

### Total
- **Total Exemplars (24h):** 35,619
- **Average Rate:** 24.7/min
- **Storage Used:** 6.9 MB
- **Retention:** 7 days (auto-purge via ClickHouse TTL)

### Collection by Service
| Service | Exemplars | % of Total |
|---------|-----------|------------|
| payment-service | 8,456 | 23.7% |
| api-gateway | 7,234 | 20.3% |
| order-processor | 6,123 | 17.2% |
| inventory-api | 5,890 | 16.5% |
| user-service | 4,567 | 12.8% |
| notification-svc | 3,349 | 9.4% |

### Cardinality Impact
- Exemplar labels are **not indexed** — minimal cardinality impact
- Max exemplars per metric series: configurable (default: 128)`,
  },
  {
    question: "Which metrics have the most exemplars with errors?",
    answer: `## Error Exemplar Analysis

### Top Metrics by Error Exemplars (Last 6 Hours)
| Metric | Total Exemplars | Error Exemplars | Error Rate |
|--------|----------------|-----------------|------------|
| http_request_duration_seconds | 3,120 | 234 | 7.5% |
| grpc_server_handling_seconds | 1,890 | 156 | 8.3% |
| db_query_duration_seconds | 2,456 | 89 | 3.6% |
| kafka_consumer_lag | 678 | 45 | 6.6% |
| cache_operation_duration | 890 | 23 | 2.6% |

### Error Distribution by Status Code
| Status | Count | % | Top Service |
|--------|-------|---|-------------|
| 500 Internal Server Error | 189 | 34.6% | payment-service |
| 504 Gateway Timeout | 123 | 22.5% | api-gateway |
| 503 Service Unavailable | 98 | 17.9% | order-processor |
| 429 Too Many Requests | 67 | 12.3% | user-service |
| 502 Bad Gateway | 45 | 8.2% | inventory-api |
| Other | 25 | 4.6% | Various |

### Top Error Spans in Exemplars
| Span Name | Error Count | Avg Latency |
|-----------|-------------|-------------|
| POST /api/v2/payments/charge | 78 | 2,340ms |
| SELECT inventory.stock | 56 | 890ms |
| gRPC OrderService.Create | 45 | 1,567ms |

### Action Items
1. Investigate payment-service 500 errors — likely Stripe API issues
2. Review api-gateway timeout configuration (currently 30s)
3. Check order-processor circuit breaker settings`,
  },
  {
    question: "Compare exemplar patterns between two services",
    answer: `## Exemplar Comparison: payment-service vs order-processor

### Latency Exemplar Distribution
| Bucket | payment-service | order-processor | Delta |
|--------|----------------|-----------------|-------|
| 0-50ms | 1,234 (45%) | 2,345 (62%) | -17% |
| 50-100ms | 890 (32%) | 789 (21%) | +11% |
| 100-250ms | 345 (13%) | 456 (12%) | +1% |
| 250-500ms | 178 (6%) | 123 (3%) | +3% |
| 500ms-1s | 67 (2%) | 45 (1%) | +1% |
| >1s | 34 (1%) | 12 (0.3%) | +0.7% |

### p99 Latency Exemplars (Last Hour)
| Service | p99 Latency | Exemplar Trace | Root Cause |
|---------|-------------|----------------|------------|
| payment-service | 1,456ms | \`abc123\` | Stripe API slow |
| order-processor | 678ms | \`def456\` | DB connection wait |

### Error Rate Exemplars
| Metric | payment-service | order-processor |
|--------|----------------|-----------------|
| Error Exemplars | 89 (3.2%) | 34 (0.9%) |
| Timeout Exemplars | 45 (1.6%) | 12 (0.3%) |
| Retry Exemplars | 23 (0.8%) | 8 (0.2%) |

### Key Insight
Payment-service has **3.5x more error exemplars** than order-processor. The majority correlate with external API calls to Stripe, suggesting the need for:
- Increased timeout thresholds for Stripe API calls
- Circuit breaker pattern implementation
- Fallback payment queue for retries`,
  },
  {
    question: "How do I configure exemplar collection for my service?",
    answer: `## Configuring Exemplar Collection

### OpenTelemetry SDK Configuration
\`\`\`yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
      http:
        endpoint: "0.0.0.0:4318"

processors:
  batch:
    send_batch_size: 1024
    timeout: 5s

exporters:
  otlp/telemetryflow:
    endpoint: "collector.telemetryflow.id:4317"
    headers:
      Authorization: "Bearer \${TF_API_KEY}"

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/telemetryflow]
\`\`\`

### Application-Level Configuration
\`\`\`typescript
// Node.js / TypeScript
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { ExemplarFilter } from '@opentelemetry/sdk-metrics';

const meterProvider = new MeterProvider({
  exemplarFilter: ExemplarFilter.TRACE_BASED,
  // Only attach exemplars when a trace is active
});

const histogram = meter.createHistogram('http_request_duration', {
  unit: 'ms',
  description: 'HTTP request duration',
});

// Exemplars are automatically attached when recording within a trace context
histogram.record(responseTime, { method: 'GET', path: '/api/users' });
\`\`\`

### Exemplar Limits
| Setting | Default | Range |
|---------|---------|-------|
| Max exemplars per series | 128 | 1-1000 |
| Exemplar TTL | 7 days | 1-30 days |
| Max label pairs | 10 | 1-50 |`,
  },
  {
    question: "Show me exemplar correlation with traces for the checkout flow",
    answer: `## Checkout Flow Exemplar-Trace Correlation

### Checkout Pipeline Exemplars (Last 30 Minutes)
| Step | Metric | Exemplar Value | Trace ID | Status |
|------|--------|---------------|----------|--------|
| 1. Cart Validation | cart_validation_ms | 45ms | \`trc-cv-001\` | ✅ |
| 2. Inventory Check | inventory_check_ms | 123ms | \`trc-ic-002\` | ✅ |
| 3. Price Calculation | price_calc_ms | 67ms | \`trc-pc-003\` | ✅ |
| 4. Payment Auth | payment_auth_ms | 2,340ms | \`trc-pa-004\` | ❌ Slow |
| 5. Order Creation | order_create_ms | 189ms | \`trc-oc-005\` | ✅ |
| 6. Notification | notification_ms | 234ms | \`trc-nt-006\` | ✅ |

### Bottleneck Analysis (from Exemplar Traces)
\`\`\`
Total Checkout Latency: 2,998ms
├── Cart Validation:    45ms  ( 1.5%)
├── Inventory Check:   123ms  ( 4.1%)
├── Price Calculation:  67ms  ( 2.2%)
├── Payment Auth:    2,340ms  (78.1%) ← BOTTLENECK
├── Order Creation:   189ms  ( 6.3%)
└── Notification:     234ms  ( 7.8%)
\`\`\`

### Payment Auth Exemplar Deep Dive
| Attribute | Value |
|-----------|-------|
| Gateway | Stripe |
| Request Type | charge |
| Amount | $129.99 |
| Currency | USD |
| Retry Count | 2 |
| Final Status | Success (after retry) |

### Recommendation
The payment authorization step dominates checkout latency at **78.1%**. Consider:
1. Pre-authorizing payment during cart phase
2. Implementing async payment confirmation
3. Adding Stripe API connection pooling`,
  },
  {
    question: "What's the exemplar retention policy and storage usage?",
    answer: `## Exemplar Retention & Storage

### Current Retention Policy
| Data Type | TTL | Storage Engine | Rollup |
|-----------|-----|---------------|--------|
| Raw Exemplars | 7 days | MergeTree | None |
| Exemplar Stats (1h) | 30 days | SummingMergeTree | Hourly |
| Exemplar Stats (1d) | 90 days | SummingMergeTree | Daily |

### Storage Usage (Current)
| Table | Rows | Compressed | Uncompressed | Ratio |
|-------|------|-----------|--------------|-------|
| exemplars | 2.1M | 128 MB | 892 MB | 7.0x |
| exemplars_hourly_mv | 45K | 3.2 MB | 18 MB | 5.6x |
| exemplars_daily_mv | 1.8K | 0.4 MB | 2.1 MB | 5.3x |

### Growth Projections
| Timeframe | Expected Rows | Storage (Compressed) |
|-----------|--------------|---------------------|
| 7 days (max raw) | 2.1M | 128 MB |
| 30 days (rollup) | 45K | 3.2 MB |
| 90 days (rollup) | 5.4K | 1.2 MB |

### ClickHouse TTL Configuration
\`\`\`sql
-- Raw exemplars: 7-day TTL
ALTER TABLE exemplars
  MODIFY TTL timestamp + INTERVAL 7 DAY;

-- Hourly rollup: 30-day TTL
ALTER TABLE exemplars_hourly_mv
  MODIFY TTL hour + INTERVAL 30 DAY;

-- Daily rollup: 90-day TTL
ALTER TABLE exemplars_daily_mv
  MODIFY TTL day + INTERVAL 90 DAY;
\`\`\`

### Optimization Tips
- Enable \`optimize_on_insert = 1\` for better compression
- Use \`CODEC(ZSTD(3))\` for exemplar value columns
- Partition by \`toYYYYMM(timestamp)\` for efficient TTL cleanup`,
  },
];

export const EXEMPLARS_CONVERSATION_TITLES: string[] = [
  "High-latency exemplar investigation",
  "Exemplar collection rate analysis",
  "Error exemplar patterns by service",
  "Checkout flow exemplar correlation",
  "Exemplar retention and storage review",
  "Exemplar-to-trace drill-down workflow",
  "High-latency request exemplar analysis",
  "Error rate exemplar correlation",
  "Exemplar sampling rate optimization",
  "Cross-service exemplar comparison",
];
