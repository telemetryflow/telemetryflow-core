/**
 * Reports Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for reporting and scheduled delivery analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const REPORTS_MOCK_DATA: MockQA[] = [
  {
    question: "Show me all scheduled reports and their status",
    answer: `## Scheduled Reports Overview

### Active Report Schedules
| Report Name | Schedule | Format | Recipients | Last Run | Status |
|-------------|----------|--------|------------|----------|--------|
| Weekly SLA Report | Mon 08:00 UTC | PDF | 5 users | 2d ago | ✅ Success |
| Daily Error Summary | Daily 06:00 UTC | HTML Email | 3 channels | 6h ago | ✅ Success |
| Monthly Capacity Report | 1st of month | PDF + CSV | 8 users | 18d ago | ✅ Success |
| Incident Postmortem | On incident close | PDF | Stakeholders | 3d ago | ✅ Success |
| Hourly Health Check | Every hour | Slack | #ops-alerts | 15m ago | ✅ Success |
| Quarterly Business Review | Quarterly | PPTX | 12 users | 48d ago | ✅ Success |
| Custom Dashboard Export | Daily 22:00 UTC | PDF | 2 users | 2h ago | ⚠️ Partial |

### Report Execution Stats (Last 30 Days)
| Metric | Value | Trend |
|--------|-------|-------|
| Total Executions | 892 | → Stable |
| Success Rate | 98.4% | ↗ +0.3% |
| Avg Generation Time | 12.3s | ↘ -8% |
| Failed Executions | 14 | ↘ -22% |
| Data Points Processed | 2.4M | ↗ +12% |

### Failed Reports (Last 7 Days)
| Report | Time | Error | Resolution |
|--------|------|-------|------------|
| Custom Dashboard Export | 2h ago | Timeout (widget #3) | Auto-retry scheduled |
| Monthly Capacity Report | 5d ago | ClickHouse timeout | Increased query timeout |

### Storage Usage
- **Report archive:** 4.2 GB (PDF + CSV exports)
- **Retention:** 90 days
- **Auto-cleanup:** Enabled`,
  },
  {
    question: "How do I create a new scheduled report?",
    answer: `## Creating a Scheduled Report

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/reports \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Weekly Performance Report",
    "description": "Service performance metrics summary",
    "schedule": {
      "type": "cron",
      "expression": "0 8 * * MON",
      "timezone": "America/New_York"
    },
    "template": "performance-summary",
    "format": "pdf",
    "filters": {
      "timeRange": "7d",
      "services": ["api-gateway", "payment-service"],
      "metrics": ["latency_p99", "error_rate", "throughput"]
    },
    "delivery": {
      "channels": [
        { "type": "email", "recipients": ["team@company.com"] },
        { "type": "slack", "channel": "#weekly-reports" }
      ]
    }
  }'
\`\`\`

### Available Templates
| Template | Description | Sections |
|----------|-------------|----------|
| performance-summary | Service performance overview | Latency, errors, throughput |
| sla-compliance | SLA adherence report | Uptime, SLO status, budget |
| capacity-planning | Resource utilization trends | CPU, memory, storage, network |
| incident-summary | Incident analysis report | Timeline, MTTR, root cause |
| security-audit | Security posture report | Alerts, vulnerabilities, compliance |

### Schedule Options
| Type | Example | Description |
|------|---------|-------------|
| cron | \`0 8 * * MON\` | Standard cron expression |
| interval | \`every 6h\` | Repeating interval |
| event | \`on_incident_close\` | Triggered by events |
| one-time | \`2024-03-15T10:00:00Z\` | Single execution |

### Format Options
PDF, HTML, CSV, JSON, Slack message, Email (HTML)`,
  },
  {
    question: "What were the key findings from the last SLA report?",
    answer: `## Weekly SLA Report Summary (Last 7 Days)

### SLA Compliance Overview
| Service | Target | Actual | Status | Budget Used |
|---------|--------|--------|--------|-------------|
| API Gateway | 99.99% | 99.97% | ⚠️ At Risk | 87% |
| User Service | 99.95% | 99.98% | ✅ Met | 42% |
| Payment Service | 99.5% | 99.62% | ✅ Met | 24% |
| Order Service | 99.9% | 99.85% | 🔴 Breached | 115% |
| Notification Service | 99.0% | 99.45% | ✅ Met | 45% |

### SLO Performance
| SLO | Target | Actual | Status |
|-----|--------|--------|--------|
| API Latency p99 < 200ms | 200ms | 178ms | ✅ Met |
| Error Rate < 0.5% | 0.5% | 0.42% | ✅ Met |
| Checkout Success > 98% | 98% | 97.2% | 🔴 Breached |
| Page Load < 3s | 3s | 2.4s | ✅ Met |

### Downtime Events
| Event | Duration | Impact | Services |
|-------|----------|--------|----------|
| Payment gateway timeout | 12m | 156 failed orders | payment, order |
| DB failover | 3m | Read-only mode | All |
| Certificate renewal | 45s | Brief TLS errors | api-gateway |

### Error Budget Status
- **API Gateway:** 0.5 min remaining (of 4.3 min monthly budget)
- **Order Service:** EXCEEDED by 2.1 minutes — freeze deployments
- **Other services:** Within budget

### Recommendations
1. Prioritize order-service reliability improvements
2. Implement payment fallback processor
3. Automate certificate renewal (avoid manual window)`,
  },
  {
    question: "Compare this month's report metrics with last month",
    answer: `## Month-over-Month Report Comparison

### Key Metrics Comparison
| Metric | Last Month | This Month | Change | Trend |
|--------|-----------|------------|--------|-------|
| Avg Availability | 99.89% | 99.92% | +0.03% | ✅ Improved |
| Total Incidents | 18 | 12 | -33% | ✅ Improved |
| MTTR | 42 min | 35 min | -17% | ✅ Improved |
| Error Rate (avg) | 0.52% | 0.42% | -19% | ✅ Improved |
| p99 Latency (avg) | 234ms | 178ms | -24% | ✅ Improved |
| Throughput (avg) | 4,200 rps | 4,890 rps | +16% | ↗ Growth |
| Data Ingested | 1.8 TB | 2.1 TB | +17% | ↗ Growth |

### Service-Level Comparison
| Service | Last Month | This Month | Delta |
|---------|-----------|------------|-------|
| API Gateway | 99.94% | 99.97% | +0.03% |
| Payment Service | 99.48% | 99.62% | +0.14% |
| Order Service | 99.92% | 99.85% | -0.07% ⚠️ |
| User Service | 99.96% | 99.98% | +0.02% |

### Report Generation Metrics
| Metric | Last Month | This Month | Change |
|--------|-----------|------------|--------|
| Reports Generated | 845 | 892 | +5.6% |
| Avg Gen Time | 14.2s | 12.3s | -13% |
| Failed Reports | 18 | 14 | -22% |
| Data Points Queried | 1.9M | 2.4M | +26% |

### Highlights
- **Best improvement:** Payment service availability +0.14% (circuit breaker deployed)
- **Concern:** Order service degraded by 0.07% (investigate deployment impact)
- **Report performance:** 13% faster generation (ClickHouse query optimization)`,
  },
  {
    question: "Show me report delivery and notification status",
    answer: `## Report Delivery Status

### Delivery Channel Performance (Last 30 Days)
| Channel | Delivered | Failed | Avg Delivery Time | Status |
|---------|-----------|--------|-------------------|--------|
| Email (SMTP) | 456 | 3 | 2.3s | ✅ Healthy |
| Slack | 234 | 1 | 0.8s | ✅ Healthy |
| S3 Upload | 189 | 0 | 4.5s | ✅ Healthy |
| Webhook | 67 | 5 | 1.2s | ⚠️ Review |
| Teams | 45 | 2 | 1.5s | ✅ Healthy |

### Recent Delivery Failures
| Report | Channel | Time | Error | Retried |
|--------|---------|------|-------|---------|
| Daily Error Summary | Webhook | 6h ago | HTTP 502 | ✅ Success (retry 2) |
| Custom Dashboard | Email | 2h ago | Attachment too large (15MB) | ❌ Failed |
| Health Check | Webhook | 1d ago | Connection timeout | ✅ Success (retry 1) |

### Email Delivery Stats
| Metric | Value |
|--------|-------|
| Total Sent | 456 |
| Delivered | 453 |
| Bounced | 2 |
| Opened | 389 (85.2%) |
| Clicked | 234 (51.2%) |

### Delivery Latency Distribution
\`\`\`
< 1s:    ████████████████░░░░ 78% (Slack, Webhook)
1-5s:    ████░░░░░░░░░░░░░░░░ 18% (Email, S3)
5-10s:   █░░░░░░░░░░░░░░░░░░░  3% (Large PDF email)
> 10s:   ░░░░░░░░░░░░░░░░░░░░  1% (Timeout/retry)
\`\`\`

### Action Items
1. Fix webhook endpoint returning 502 — check target server health
2. Compress PDF attachments > 10MB or use S3 link instead
3. Consider moving large reports to S3 + email link pattern`,
  },
  {
    question: "What report templates are available?",
    answer: `## Available Report Templates

### Built-in Templates
| Template | Category | Sections | Format |
|----------|----------|----------|--------|
| Performance Summary | Operations | Latency, throughput, errors | PDF, HTML |
| SLA Compliance | Business | Uptime, SLO status, budget | PDF, PPTX |
| Capacity Planning | Infrastructure | CPU, memory, disk, network trends | PDF, CSV |
| Incident Summary | Operations | Timeline, MTTR, root cause | PDF |
| Security Audit | Security | Alerts, access logs, compliance | PDF |
| Cost Analysis | Finance | Resource costs, optimization | PDF, CSV |
| Traffic Analysis | Operations | Request patterns, top endpoints | PDF, HTML |
| Error Analysis | Engineering | Error patterns, stack traces | PDF, HTML |

### Template Customization Options
| Feature | Description |
|---------|-------------|
| Time Range | 1h, 6h, 24h, 7d, 30d, 90d, custom |
| Filters | Service, environment, region, team |
| Grouping | By service, by endpoint, by region |
| Charts | Line, bar, pie, heatmap, table |
| Branding | Logo, colors, header/footer text |
| Sections | Add/remove/reorder sections |

### Custom Template API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/reports/templates \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "My Custom Report",
    "sections": [
      { "type": "metric_chart", "metric": "http_request_duration_seconds", "aggregation": "p99" },
      { "type": "table", "query": "top_errors", "limit": 20 },
      { "type": "text", "content": "## Custom Analysis Section" },
      { "type": "sla_summary", "services": ["api-gateway", "payment-service"] }
    ],
    "variables": [
      { "name": "environment", "type": "select", "options": ["production", "staging"] }
    ]
  }'
\`\`\`

### Most Used Templates (Last 90 Days)
| Template | Uses | Avg Execution | Users |
|----------|------|---------------|-------|
| Performance Summary | 245 | 8.2s | 12 |
| SLA Compliance | 134 | 12.5s | 8 |
| Incident Summary | 89 | 6.3s | 15 |
| Capacity Planning | 45 | 18.9s | 5 |`,
  },
  {
    question: "How do I export report data to CSV?",
    answer: `## Exporting Report Data to CSV

### Quick Export via API
\`\`\`bash
# Export a specific report execution as CSV
curl -X GET "https://api.telemetryflow.id/api/v2/reports/executions/{executionId}/export?format=csv" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o report-export.csv

# Export with custom time range
curl -X POST "https://api.telemetryflow.id/api/v2/reports/export" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "template": "performance-summary",
    "format": "csv",
    "timeRange": { "from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z" },
    "filters": { "services": ["api-gateway"] }
  }'
\`\`\`

### CSV Export Options
| Option | Values | Default |
|--------|--------|---------|
| format | csv, tsv | csv |
| delimiter | comma, semicolon, tab, pipe | comma |
| includeHeaders | true, false | true |
| dateFormat | ISO8601, unix, human | ISO8601 |
| timezone | Any IANA timezone | UTC |
| nullValue | empty, "NULL", "N/A" | empty |

### Bulk Export
\`\`\`bash
# Export all report executions for a date range
curl -X POST "https://api.telemetryflow.id/api/v2/reports/bulk-export" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "reportId": "report-weekly-sla",
    "from": "2024-01-01",
    "to": "2024-03-31",
    "format": "csv",
    "delivery": { "type": "s3", "bucket": "my-exports", "prefix": "reports/" }
  }'
\`\`\`

### Export Size Limits
| Format | Max Rows | Max File Size | Timeout |
|--------|---------|---------------|---------|
| CSV | 1,000,000 | 500 MB | 5 min |
| JSON | 500,000 | 250 MB | 5 min |
| PDF | N/A (rendered) | 50 MB | 2 min |`,
  },
  {
    question: "What's the report generation performance?",
    answer: `## Report Generation Performance

### Execution Time by Template (Last 30 Days)
| Template | Avg Time | p50 | p95 | p99 | Executions |
|----------|----------|-----|-----|-----|------------|
| Performance Summary | 8.2s | 6.5s | 15.2s | 23.4s | 245 |
| SLA Compliance | 12.5s | 10.1s | 22.3s | 34.5s | 134 |
| Incident Summary | 6.3s | 4.8s | 12.1s | 18.9s | 89 |
| Capacity Planning | 18.9s | 15.2s | 35.6s | 48.2s | 45 |
| Security Audit | 14.2s | 11.5s | 28.4s | 42.1s | 34 |
| Custom Reports | 10.8s | 8.2s | 20.5s | 32.8s | 345 |

### Performance Breakdown (avg across all reports)
| Phase | Duration | % of Total |
|-------|----------|------------|
| Query Planning | 0.3s | 2.4% |
| Data Fetching (ClickHouse) | 6.8s | 55.3% |
| Data Processing | 2.1s | 17.1% |
| Chart Rendering | 1.8s | 14.6% |
| PDF Generation | 1.1s | 8.9% |
| Delivery | 0.2s | 1.6% |

### Optimization History
| Date | Change | Impact |
|------|--------|--------|
| 2 weeks ago | ClickHouse query batching | -22% avg time |
| 1 month ago | PDF rendering parallelization | -15% PDF gen time |
| 2 months ago | Materialized view for SLA data | -40% SLA report time |

### Queue Stats (BullMQ - reports queue)
| Metric | Value |
|--------|-------|
| Active Jobs | 2 |
| Waiting Jobs | 0 |
| Completed (24h) | 34 |
| Failed (24h) | 1 |
| Concurrency | 3 |
| Avg Wait Time | 1.2s |`,
  },
];

export const REPORTS_CONVERSATION_TITLES: string[] = [
  "Scheduled reports status review",
  "SLA report findings analysis",
  "Report delivery troubleshooting",
  "Month-over-month comparison",
  "Report generation performance tuning",
  "Monthly SLA compliance report generation",
  "Scheduled report delivery failure check",
  "Report template customization guide",
  "Multi-workspace aggregate report",
  "Executive summary report setup",
];
