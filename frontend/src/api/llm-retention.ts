/**
 * Retention Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for data retention policy analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const RETENTION_MOCK_DATA: MockQA[] = [
  {
    question: "What are the current retention policies?",
    answer: `## Data Retention Policies

### Active Policies
| Data Type | Raw Retention | Rollup 1m | Rollup 1h | Rollup 1d | Total Queryable |
|-----------|--------------|-----------|-----------|-----------|----------------|
| Metrics | 30 days | 60 days | 90 days | 365 days | 365 days |
| Logs | 30 days | — | 60 days | 90 days | 90 days |
| Traces | 30 days | — | 60 days | 90 days | 90 days |
| Exemplars | 7 days | — | 30 days | — | 30 days |
| Audit Logs | 90 days | — | — | 365 days | 365 days |
| Uptime Checks | 30 days | 60 days | 90 days | 365 days | 365 days |

### ClickHouse TTL Configuration
| Table | TTL Expression | Engine | Partition Key |
|-------|---------------|--------|---------------|
| metrics_raw | timestamp + 30 DAY | MergeTree | (tenant_id, toYYYYMM) |
| metrics_1m_mv | minute + 60 DAY | SummingMergeTree | (tenant_id, toYYYYMM) |
| metrics_1h_mv | hour + 90 DAY | SummingMergeTree | (tenant_id, toYYYYMM) |
| metrics_1d_mv | day + 365 DAY | SummingMergeTree | (tenant_id, toYYYYMM) |
| logs_raw | timestamp + 30 DAY | MergeTree | (tenant_id, toYYYYMM) |
| traces_raw | timestamp + 30 DAY | MergeTree | (tenant_id, toYYYYMM) |
| exemplars | timestamp + 7 DAY | MergeTree | (tenant_id, toYYYYMM) |

### Policy Compliance
| Requirement | Policy | Status |
|-------------|--------|--------|
| GDPR (EU data) | Audit logs: 730 days | ✅ Compliant |
| SOC 2 | Audit logs: 365 days | ✅ Compliant |
| Business (SLA reports) | Metrics: 365 days | ✅ Compliant |
| Cost optimization | Exemplars: 7 days | ✅ Within budget |`,
  },
  {
    question: "How much storage is each retention tier using?",
    answer: `## Storage by Retention Tier

### Current Storage Breakdown
| Tier | Data Age | Resolution | Rows | Compressed | Uncompressed | Ratio |
|------|----------|-----------|------|-----------|-------------|-------|
| Raw | 0-30d | Full | 2.4B | 89 GB | 623 GB | 7.0x |
| 1-minute rollup | 7-60d | 1 min | 456M | 23 GB | 138 GB | 6.0x |
| 1-hour rollup | 30-90d | 1 hour | 12M | 2.8 GB | 14 GB | 5.0x |
| 1-day rollup | 60-365d | 1 day | 890K | 0.4 GB | 1.8 GB | 4.5x |
| **Total** | | | **2.87B** | **115.2 GB** | **776.8 GB** | **6.7x** |

### Storage by Data Type
| Data Type | Compressed | % of Total | Growth/day |
|-----------|-----------|------------|------------|
| Metrics | 45.6 GB | 39.6% | +1.2 GB |
| Logs | 34.2 GB | 29.7% | +0.9 GB |
| Traces | 23.4 GB | 20.3% | +0.6 GB |
| Exemplars | 4.8 GB | 4.2% | +0.5 GB |
| Audit | 3.2 GB | 2.8% | +0.1 GB |
| Materialized Views | 4.0 GB | 3.5% | +0.08 GB |

### Storage Projection (Next 12 Months)
| Month | Raw | Rollups | Total | Cost |
|-------|-----|---------|-------|------|
| Current | 89 GB | 26.2 GB | 115.2 GB | $92 |
| +3 months | 95 GB | 32 GB | 127 GB | $102 |
| +6 months | 102 GB | 38 GB | 140 GB | $112 |
| +12 months | 115 GB | 48 GB | 163 GB | $130 |

### Compression Analysis
| Codec | Tables Using | Avg Ratio | Best For |
|-------|-------------|-----------|----------|
| ZSTD(3) | metrics, logs | 7.0x | General purpose |
| LZ4 | traces | 5.5x | Fast decompression |
| DoubleDelta + ZSTD | timestamps | 15x | Time columns |
| Gorilla + ZSTD | float values | 12x | Metric values |`,
  },
  {
    question: "How do I change the retention period for logs?",
    answer: `## Modifying Log Retention Policy

### Via API
\`\`\`bash
curl -X PUT https://api.telemetryflow.id/api/v2/retention/policies/logs \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "dataType": "logs",
    "tiers": [
      { "name": "raw", "retentionDays": 14, "resolution": "full" },
      { "name": "hourly", "retentionDays": 60, "resolution": "1h" },
      { "name": "daily", "retentionDays": 90, "resolution": "1d" }
    ],
    "scope": {
      "tenantId": "all",
      "workspaceId": "all"
    }
  }'
\`\`\`

### Impact Preview
| Change | Before | After | Storage Impact |
|--------|--------|-------|---------------|
| Raw logs | 30 days | 14 days | -16 GB (-47%) |
| Hourly rollup | 60 days | 60 days | No change |
| Daily rollup | 90 days | 90 days | No change |
| **Net savings** | | | **-16 GB/month** |

### Considerations
| Factor | Detail |
|--------|--------|
| Compliance | Ensure new retention meets regulatory requirements |
| Alerting | Alert rules querying raw logs must use < 14 day window |
| Dashboards | Update any dashboard using 30-day log windows |
| Reports | Scheduled reports may need updated time ranges |
| Rollback | Previous data within old TTL is still available until TTL expires |

### Per-Tenant Override
\`\`\`bash
# Override retention for a specific tenant (e.g., compliance tenant)
curl -X PUT https://api.telemetryflow.id/api/v2/retention/policies/logs \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "dataType": "logs",
    "tiers": [
      { "name": "raw", "retentionDays": 90, "resolution": "full" }
    ],
    "scope": { "tenantId": "tenant-eurotech-uuid" }
  }'
\`\`\`

### Validation
After applying changes, ClickHouse TTL will be updated automatically. Data beyond the new TTL will be cleaned up during the next merge cycle (typically within 24 hours).`,
  },
  {
    question: "What's the cost impact of different retention periods?",
    answer: `## Retention Cost Analysis

### Cost per GB by Storage Tier
| Tier | Storage Type | Cost/GB/month | Performance |
|------|-------------|---------------|-------------|
| Hot (SSD) | ClickHouse NVMe | $0.80 | < 100ms queries |
| Warm (HDD) | ClickHouse HDD | $0.25 | < 500ms queries |
| Cold (S3) | S3 Standard | $0.023 | 1-5s queries |
| Archive (Glacier) | S3 Glacier | $0.004 | Minutes to hours |

### Cost Comparison by Retention Period
| Retention | Metrics | Logs | Traces | Total/month |
|-----------|---------|------|--------|-------------|
| 7 days | $9.60 | $6.80 | $4.00 | $20.40 |
| 14 days | $16.80 | $12.40 | $7.60 | $36.80 |
| 30 days | $36.48 | $27.36 | $18.72 | $82.56 |
| 60 days | $52.80 | $38.40 | $26.40 | $117.60 |
| 90 days | $64.80 | $46.08 | $32.64 | $143.52 |
| 365 days | $112.00 | N/A | N/A | $112.00 |

### Optimization Scenarios
| Scenario | Current Cost | Optimized Cost | Savings |
|----------|------------|---------------|---------|
| Reduce raw logs 30d→14d | $27.36 | $12.40 | -$14.96/mo |
| Reduce raw traces 30d→14d | $18.72 | $7.60 | -$11.12/mo |
| Reduce exemplars 7d→3d | $3.84 | $1.64 | -$2.20/mo |
| Move 60-90d data to warm | $23.00 | $7.19 | -$15.81/mo |
| **Total potential savings** | | | **-$44.09/mo** |

### Tiered Storage Strategy (Recommended)
\`\`\`
0-7 days:   Hot (NVMe SSD)     — Full resolution, instant queries
7-30 days:  Hot (NVMe SSD)     — Full resolution
30-90 days: Warm (HDD)         — 1-hour rollup, fast queries
90-365 days: Cold (S3)         — 1-day rollup, acceptable latency
365+ days:  Archive (Glacier)  — Compliance only
\`\`\`

### ROI Analysis
- Annual savings with optimization: **$529/year**
- Implementation effort: ~4 hours (policy updates + validation)
- Risk: Minimal — rollup data preserves trend visibility`,
  },
  {
    question: "Show me the data cleanup schedule and history",
    answer: `## Data Cleanup Schedule & History

### Automated Cleanup Schedule
| Task | Schedule | Last Run | Next Run | Status |
|------|----------|----------|----------|--------|
| Metrics TTL cleanup | Daily 02:00 UTC | 6h ago | 18h | ✅ On schedule |
| Logs TTL cleanup | Daily 03:00 UTC | 5h ago | 19h | ✅ On schedule |
| Traces TTL cleanup | Daily 04:00 UTC | 4h ago | 20h | ✅ On schedule |
| Exemplars TTL cleanup | Every 6 hours | 2h ago | 4h | ✅ On schedule |
| Audit log archival | Weekly Sun 01:00 | 2d ago | 5d | ✅ On schedule |
| S3 lifecycle transition | Daily (AWS managed) | Continuous | — | ✅ Active |

### Recent Cleanup History
| Date | Data Type | Rows Deleted | Space Reclaimed | Duration |
|------|-----------|-------------|-----------------|----------|
| Today | Metrics raw | 12,456,789 | 4.2 GB | 3m 12s |
| Today | Logs raw | 8,901,234 | 3.1 GB | 2m 45s |
| Today | Traces raw | 3,456,789 | 1.8 GB | 1m 58s |
| Today | Exemplars | 5,678,901 | 2.3 GB | 1m 23s |
| Yesterday | Metrics raw | 11,890,456 | 3.9 GB | 3m 05s |
| Yesterday | Logs raw | 9,234,567 | 3.3 GB | 2m 52s |

### Cleanup Efficiency
| Metric | Value | Status |
|--------|-------|--------|
| Avg cleanup duration | 2m 34s | ✅ Fast |
| Cleanup during peak | 0 events | ✅ Off-peak only |
| Failed cleanups (30d) | 0 | ✅ Reliable |
| Space reclaimed (30d) | 234 GB | Expected |
| Merge cycle frequency | Every 4h | ✅ Normal |

### Manual Cleanup Options
\`\`\`bash
# Trigger immediate cleanup for a specific data type
curl -X POST https://api.telemetryflow.id/api/v2/retention/cleanup \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "dataType": "logs",
    "olderThan": "2024-01-01T00:00:00Z",
    "dryRun": true
  }'
\`\`\`

### Cleanup Performance Tips
- Schedule cleanup during lowest-traffic window (typically 01:00-05:00 UTC)
- Use \`OPTIMIZE TABLE FINAL\` only during maintenance windows
- ClickHouse TTL cleanup happens automatically during merges`,
  },
  {
    question: "How does the rollup cascade work?",
    answer: `## Rollup Cascade Architecture

### Cascade Flow
\`\`\`
Raw Data (full resolution)
  │ TTL: 7-30 days
  ▼
1-Minute Rollup (SummingMergeTree)
  │ TTL: 30-60 days
  ▼
1-Hour Rollup (SummingMergeTree)
  │ TTL: 60-90 days
  ▼
1-Day Rollup (SummingMergeTree)
  │ TTL: 90-365 days
  ▼
Expired / Archived
\`\`\`

### Rollup Configuration by Data Type
| Data Type | Raw → 1m | 1m → 1h | 1h → 1d | Notes |
|-----------|----------|---------|---------|-------|
| Metrics | At ingest (MV) | At ingest (MV) | At ingest (MV) | All via materialized views |
| Logs | N/A | 30d (batch) | 60d (batch) | Count + severity aggregation |
| Traces | N/A | 30d (batch) | 60d (batch) | Latency stats aggregation |
| Uptime | At ingest (MV) | At ingest (MV) | At ingest (MV) | Availability % rollup |

### What Gets Preserved in Rollups
| Field | Raw | 1-Minute | 1-Hour | 1-Day |
|-------|-----|---------|--------|-------|
| Individual values | ✅ | ❌ | ❌ | ❌ |
| Min/Max | ✅ | ✅ | ✅ | ✅ |
| Sum | ✅ | ✅ | ✅ | ✅ |
| Count | ✅ | ✅ | ✅ | ✅ |
| Avg (computed) | ✅ | ✅ | ✅ | ✅ |
| p50/p95/p99 | ✅ | ✅* | ✅* | ❌ |
| Labels (all) | ✅ | ✅ | ✅ | Top 10 |
| Trace IDs | ✅ | ❌ | ❌ | ❌ |

*Percentiles use AggregatingMergeTree with quantileState

### Materialized View Example
\`\`\`sql
CREATE MATERIALIZED VIEW metrics_1h_mv
ENGINE = SummingMergeTree()
ORDER BY (tenant_id, metric_name, hour)
TTL hour + INTERVAL 90 DAY
AS SELECT
  tenant_id,
  metric_name,
  toStartOfHour(timestamp) AS hour,
  sum(value) AS sum_value,
  count() AS count_value,
  min(value) AS min_value,
  max(value) AS max_value,
  quantileState(0.99)(value) AS p99_state
FROM metrics_raw
GROUP BY tenant_id, metric_name, hour;
\`\`\`

### Query Routing
The query engine automatically selects the appropriate rollup tier based on the requested time range:
- **< 6 hours:** Raw data
- **6h - 7 days:** 1-minute rollup
- **7d - 30 days:** 1-hour rollup
- **> 30 days:** 1-day rollup`,
  },
];

export const RETENTION_CONVERSATION_TITLES: string[] = [
  "Current retention policy review",
  "Storage cost analysis by tier",
  "Log retention configuration",
  "Cleanup schedule monitoring",
  "Rollup cascade architecture",
  "Storage cost projection with current policy",
  "Retention tier migration planning",
  "Compliance-driven retention config",
  "Cold storage archive setup",
  "Retention policy impact on query speed",
];
