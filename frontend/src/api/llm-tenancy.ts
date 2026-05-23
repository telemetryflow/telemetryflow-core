/**
 * Tenancy Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for multi-tenant configuration analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const TENANCY_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the multi-tenant hierarchy",
    answer: `## Multi-Tenant Hierarchy

### Organizational Structure
\`\`\`
Platform (TelemetryFlow)
├── Region: US East (us-east-1)
│   ├── Organization: DevOpsCorner Inc.
│   │   ├── Workspace: Production
│   │   │   ├── Tenant: prod-main
│   │   │   └── Tenant: prod-staging
│   │   ├── Workspace: Development
│   │   │   └── Tenant: dev-team-alpha
│   │   └── Workspace: QA
│   │       └── Tenant: qa-automation
│   └── Organization: CloudNative Ltd.
│       ├── Workspace: Production
│       │   └── Tenant: cn-prod
│       └── Workspace: Sandbox
│           └── Tenant: cn-sandbox
├── Region: EU West (eu-west-1)
│   └── Organization: EuroTech GmbH
│       └── Workspace: Production
│           └── Tenant: et-prod-eu
└── Region: APAC (ap-southeast-1)
    └── Organization: AsiaPacific Corp.
        └── Workspace: Production
            └── Tenant: ap-prod
\`\`\`

### Summary
| Level | Count | Active |
|-------|-------|--------|
| Regions | 3 | 3 |
| Organizations | 4 | 4 |
| Workspaces | 7 | 6 (1 suspended) |
| Tenants | 8 | 7 (1 archived) |`,
  },
  {
    question: "What's the resource usage per tenant?",
    answer: `## Tenant Resource Usage

### Current Resource Consumption
| Tenant | Metrics/min | Logs/min | Traces/min | Storage | % of Quota |
|--------|-----------|---------|-----------|---------|------------|
| prod-main | 45,678 | 12,345 | 3,456 | 234 GB | 78% |
| prod-staging | 12,345 | 4,567 | 1,234 | 89 GB | 45% |
| dev-team-alpha | 3,456 | 1,234 | 456 | 23 GB | 12% |
| qa-automation | 8,901 | 2,345 | 789 | 45 GB | 23% |
| cn-prod | 34,567 | 8,901 | 2,345 | 178 GB | 65% |
| cn-sandbox | 1,234 | 456 | 123 | 5 GB | 3% |
| et-prod-eu | 23,456 | 6,789 | 1,890 | 145 GB | 55% |
| ap-prod | 18,901 | 5,678 | 1,567 | 112 GB | 42% |

### Quota Status
| Tenant | Plan | Quota | Used | Remaining | Status |
|--------|------|-------|------|-----------|--------|
| prod-main | Enterprise | 60K metrics/min | 45,678 | 14,322 | ⚠️ 78% |
| cn-prod | Professional | 50K metrics/min | 34,567 | 15,433 | ✅ 65% |
| et-prod-eu | Professional | 50K metrics/min | 23,456 | 26,544 | ✅ 55% |
| ap-prod | Professional | 50K metrics/min | 18,901 | 31,099 | ✅ 42% |

### Data Isolation Verification
| Check | Status | Details |
|-------|--------|---------|
| Query isolation | ✅ Pass | All queries scoped by tenant_id |
| Storage partitioning | ✅ Pass | Separate ClickHouse partitions |
| API key binding | ✅ Pass | Keys bound to tenant |
| Cross-tenant leak test | ✅ Pass | Last tested: 3 days ago |

### Alert
⚠️ **prod-main** is at 78% of metrics quota. At current growth rate (+5%/week), quota will be exceeded in **4 weeks**. Consider upgrading plan or optimizing metric cardinality.`,
  },
  {
    question: "How do I create a new organization and workspace?",
    answer: `## Creating Organizations & Workspaces

### Create Organization
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/organizations \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "NewCorp Inc.",
    "slug": "newcorp",
    "regionId": "us-east-1",
    "plan": "professional",
    "billing": {
      "email": "billing@newcorp.com",
      "paymentMethod": "stripe"
    },
    "settings": {
      "defaultRetention": "30d",
      "maxWorkspaces": 5,
      "maxUsersPerWorkspace": 25,
      "ssoEnabled": false
    }
  }'
\`\`\`

### Create Workspace
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/workspaces \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Production",
    "slug": "production",
    "organizationId": "org-newcorp-uuid",
    "environment": "production",
    "quotas": {
      "metricsPerMinute": 50000,
      "logsPerMinute": 20000,
      "tracesPerMinute": 10000,
      "storageGB": 500
    }
  }'
\`\`\`

### Create Tenant
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/tenants \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "prod-main",
    "workspaceId": "ws-production-uuid",
    "ingestionKey": "auto-generate",
    "retentionDays": 30,
    "labels": { "env": "production", "team": "platform" }
  }'
\`\`\`

### Provisioning Checklist
| Step | Status | Auto |
|------|--------|------|
| Create organization | Manual | ❌ |
| Create workspace | Manual | ❌ |
| Create tenant | Manual | ❌ |
| Generate API key | ✅ Auto | ✅ |
| Provision ClickHouse partition | ✅ Auto | ✅ |
| Configure retention policy | ✅ Auto (defaults) | ✅ |
| Set up billing | Manual | ❌ |
| Invite users | Manual | ❌ |`,
  },
  {
    question: "Are there any tenant isolation issues?",
    answer: `## Tenant Isolation Report

### Isolation Tests (Last Run: 2 Hours Ago)
| Test | Result | Details |
|------|--------|---------|
| Query scoping | ✅ Pass | All ClickHouse queries include tenant_id filter |
| API key tenant binding | ✅ Pass | Keys validated against tenant on every request |
| Cross-tenant data access | ✅ Pass | Attempted cross-tenant query returns 403 |
| Metric label isolation | ✅ Pass | Labels scoped by organization_id |
| Dashboard isolation | ✅ Pass | Dashboards filtered by workspace_id |
| Alert rule isolation | ✅ Pass | Rules scoped to workspace |
| User permission scoping | ✅ Pass | RBAC enforced at workspace level |

### Data Partition Status (ClickHouse)
| Table | Partition Key | Tenants | Status |
|-------|-------------|---------|--------|
| metrics_raw | (tenant_id, toYYYYMM) | 8 | ✅ Isolated |
| logs_raw | (tenant_id, toYYYYMM) | 8 | ✅ Isolated |
| traces_raw | (tenant_id, toYYYYMM) | 8 | ✅ Isolated |
| exemplars | (tenant_id, toYYYYMM) | 5 | ✅ Isolated |

### PostgreSQL Row-Level Security
| Table | RLS Policy | Status |
|-------|-----------|--------|
| users | organization_id check | ✅ Active |
| dashboards | workspace_id check | ✅ Active |
| alert_rules | workspace_id check | ✅ Active |
| api_keys | tenant_id check | ✅ Active |
| reports | workspace_id check | ✅ Active |

### No Issues Found
All tenant isolation checks pass. Data is properly scoped at every layer:
1. **Network:** API key validates tenant at ingestion
2. **Application:** Middleware injects tenant context
3. **Database:** ClickHouse partition + PG RLS
4. **Cache:** Redis keys prefixed with tenant_id`,
  },
  {
    question: "What's the tenant data residency status?",
    answer: `## Data Residency Report

### Region-to-Data Mapping
| Organization | Home Region | Data Location | Compliant |
|-------------|------------|---------------|-----------|
| DevOpsCorner Inc. | US East | us-east-1 | ✅ Yes |
| CloudNative Ltd. | US East | us-east-1 | ✅ Yes |
| EuroTech GmbH | EU West | eu-west-1 | ✅ Yes |
| AsiaPacific Corp. | APAC | ap-southeast-1 | ✅ Yes |

### EU Data Residency (GDPR)
| Data Type | Location | Encrypted | Compliant |
|-----------|----------|-----------|-----------|
| Telemetry data | eu-west-1 | ✅ AES-256 | ✅ |
| User PII | eu-west-1 | ✅ AES-256 | ✅ |
| Audit logs | eu-west-1 | ✅ AES-256 | ✅ |
| Backups | eu-west-1 | ✅ AES-256 | ✅ |
| CDN cache | Edge (multi-region) | ✅ TLS | ⚠️ Review |

### Cross-Region Data Flow
| Flow | Source | Destination | Purpose | Approved |
|------|--------|-------------|---------|----------|
| Aggregated analytics | All regions | us-east-1 | Platform analytics | ✅ Anonymized |
| Billing data | All regions | us-east-1 | Billing processing | ✅ Approved |
| Health checks | All regions | us-east-1 | Monitoring | ✅ No PII |

### Compliance Certifications
| Standard | Status | Last Audit | Next Audit |
|----------|--------|-----------|------------|
| SOC 2 Type II | ✅ Certified | 3 months ago | 9 months |
| GDPR | ✅ Compliant | 6 months ago | 6 months |
| ISO 27001 | ✅ Certified | 8 months ago | 4 months |
| HIPAA BAA | ✅ Available | On request | — |

### Action Item
⚠️ Review CDN edge caching for EU tenant data. Ensure no PII is cached at non-EU edge locations. Consider enabling "EU-only" CDN configuration for EuroTech GmbH.`,
  },
  {
    question: "Show me tenant billing and quota usage",
    answer: `## Tenant Billing & Quota Report

### Monthly Billing Summary (Current Month)
| Organization | Plan | Base Cost | Usage Cost | Total | vs Budget |
|-------------|------|-----------|-----------|-------|-----------|
| DevOpsCorner | Enterprise | $2,499 | $1,234 | $3,733 | ✅ Within |
| CloudNative | Professional | $499 | $456 | $955 | ✅ Within |
| EuroTech | Professional | $499 | $678 | $1,177 | ⚠️ Near limit |
| AsiaPacific | Professional | $499 | $345 | $844 | ✅ Within |

### Overage Charges (If Exceeded Quota)
| Metric | Rate | DevOpsCorner | EuroTech |
|--------|------|-------------|----------|
| Metrics (per 1K over) | $0.10 | — | $45 |
| Logs (per 1K over) | $0.15 | — | — |
| Traces (per 1K over) | $0.20 | — | — |
| Storage (per GB over) | $0.50 | — | $23 |

### Quota Usage Forecast
| Tenant | Current Usage | Growth Rate | Exceed Quota By |
|--------|-------------|-------------|-----------------|
| prod-main | 78% | +5%/week | 4 weeks |
| cn-prod | 65% | +3%/week | 8 weeks |
| et-prod-eu | 55% | +7%/week | 5 weeks ⚠️ |
| ap-prod | 42% | +2%/week | 20+ weeks |

### Cost Optimization
| Suggestion | Tenant | Savings | Effort |
|-----------|--------|---------|--------|
| Reduce metric cardinality | prod-main | -$200/mo | Medium |
| Enable log sampling (10:1) | et-prod-eu | -$150/mo | Low |
| Archive old traces (>14d) | cn-prod | -$80/mo | Low |
| Upgrade to Enterprise | et-prod-eu | -$100/mo (overage) | Admin |`,
  },
  {
    question: "How do I migrate a tenant between regions?",
    answer: `## Tenant Region Migration Guide

### Migration Process Overview
| Phase | Duration | Downtime | Description |
|-------|----------|----------|-------------|
| 1. Planning | 1-2 days | None | Capacity check, compliance review |
| 2. Data Sync | 2-5 days | None | Background replication to target |
| 3. Cutover | 15-30 min | Minimal | DNS switch + final sync |
| 4. Validation | 1 day | None | Verify data integrity |
| 5. Cleanup | 1 day | None | Remove source data |

### Pre-Migration Checklist
| Check | Status | Notes |
|-------|--------|-------|
| Target region capacity | ❓ Verify | Check ClickHouse cluster capacity |
| Compliance approval | ❓ Required | Data residency sign-off |
| User notification | ❓ Pending | 7-day advance notice |
| DNS TTL reduction | ❓ Pending | Lower to 60s before migration |
| Backup verification | ❓ Pending | Full backup before start |

### Migration API
\`\`\`bash
# 1. Initiate migration
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/migrations \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "tenantId": "tenant-uuid",
    "sourceRegion": "us-east-1",
    "targetRegion": "eu-west-1",
    "strategy": "live-migration",
    "scheduledAt": "2024-04-01T02:00:00Z",
    "options": {
      "migrateHistory": true,
      "historyDays": 30,
      "notifyUsers": true
    }
  }'

# 2. Monitor progress
curl https://api.telemetryflow.id/api/v2/tenancy/migrations/{migrationId}/status

# 3. Finalize cutover
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/migrations/{migrationId}/cutover
\`\`\`

### Data Transfer Estimates
| Data Type | Volume | Est. Transfer Time | Method |
|-----------|--------|-------------------|--------|
| Metrics | 234 GB | ~4 hours | ClickHouse backup/restore |
| Logs | 156 GB | ~3 hours | ClickHouse backup/restore |
| Traces | 89 GB | ~2 hours | ClickHouse backup/restore |
| Config (PG) | 2 GB | ~5 minutes | pg_dump/pg_restore |
| Cache | N/A | N/A | Rebuilt automatically |

### Rollback Plan
If issues are detected within 24 hours of cutover:
1. Revert DNS to source region
2. Stop replication to target
3. Verify source data integrity
4. Resume normal operations in source region`,
  },
  {
    question: "What are the tenant-level retention policies?",
    answer: `## Tenant Retention Policies

### Current Policies by Tenant
| Tenant | Metrics | Logs | Traces | Exemplars | Audit |
|--------|---------|------|--------|-----------|-------|
| prod-main | 90 days | 30 days | 30 days | 7 days | 365 days |
| prod-staging | 30 days | 14 days | 14 days | 3 days | 90 days |
| dev-team-alpha | 7 days | 7 days | 7 days | 1 day | 30 days |
| qa-automation | 14 days | 7 days | 7 days | 3 days | 30 days |
| cn-prod | 60 days | 30 days | 30 days | 7 days | 365 days |
| et-prod-eu | 90 days | 30 days | 30 days | 7 days | 730 days* |
| ap-prod | 60 days | 30 days | 30 days | 7 days | 365 days |

*GDPR requirement: 2-year audit log retention for EuroTech.

### Storage Impact by Retention Period
| Period | Metrics | Logs | Traces | Total |
|--------|---------|------|--------|-------|
| 7 days | 12 GB | 8 GB | 5 GB | 25 GB |
| 30 days | 45 GB | 34 GB | 21 GB | 100 GB |
| 90 days | 134 GB | 89 GB | 56 GB | 279 GB |
| 365 days | 512 GB | — | — | 512 GB |

### Rollup Strategy
| Data Age | Resolution | Compression | Engine |
|----------|-----------|-------------|--------|
| 0-7 days | Raw (full) | ~7x | MergeTree |
| 7-30 days | 1-minute rollup | ~15x | SummingMergeTree |
| 30-90 days | 1-hour rollup | ~50x | SummingMergeTree |
| 90+ days | 1-day rollup | ~200x | SummingMergeTree |

### Policy Recommendations
| Tenant | Current Cost | Optimized Cost | Savings |
|--------|------------|---------------|---------|
| prod-main | $890/mo | $670/mo | -$220 (25%) |
| cn-prod | $560/mo | $420/mo | -$140 (25%) |

Optimization: Enable 1-minute rollup after 3 days instead of 7 days for non-production tenants.`,
  },
];

export const TENANCY_CONVERSATION_TITLES: string[] = [
  "Multi-tenant hierarchy overview",
  "Tenant resource usage analysis",
  "Data isolation verification",
  "Region migration planning",
  "Tenant billing optimization",
  "Multi-tenancy architecture overview",
  "Tenant isolation verification",
  "Cross-tenant resource allocation review",
  "Tenant onboarding workflow summary",
  "Tenant usage and billing overview",
];

// ==================== TENANCY REGIONS SUB-CONTEXT ====================

export const TENANCY_REGIONS_MOCK_DATA: MockQA[] = [
  {
    question: "List all configured deployment regions and their status",
    answer: `## Deployment Regions

### Active Regions
| Region ID | Name | Location | Status | Organizations | ClickHouse Nodes | Latency |
|-----------|------|----------|--------|--------------|-----------------|---------|
| us-east-1 | US East | Virginia, USA | ✅ Healthy | 2 | 3-node cluster | 12ms |
| eu-west-1 | EU West | Dublin, Ireland | ✅ Healthy | 1 | 3-node cluster | 8ms |
| ap-southeast-1 | APAC | Singapore | ✅ Healthy | 1 | 3-node cluster | 15ms |

### Region Capacity
| Region | CPU Usage | Memory | Storage | Ingestion Rate | Headroom |
|--------|-----------|--------|---------|---------------|----------|
| us-east-1 | 62% | 71% | 58% | 180K events/s | ⚠️ Medium |
| eu-west-1 | 38% | 45% | 42% | 82K events/s | ✅ Plenty |
| ap-southeast-1 | 44% | 52% | 39% | 97K events/s | ✅ Plenty |

### Compliance Status
| Region | GDPR | SOC 2 | ISO 27001 | Data Sovereignty |
|--------|------|-------|----------|----------------|
| us-east-1 | N/A | ✅ | ✅ | US only |
| eu-west-1 | ✅ | ✅ | ✅ | EU only (GDPR) |
| ap-southeast-1 | N/A | ✅ | ✅ | APAC only |

### Planned Regions
| Region | ETA | Status |
|--------|-----|--------|
| us-west-2 (Oregon) | Q3 2026 | In planning |
| me-south-1 (Bahrain) | Q4 2026 | Pending demand |`,
  },
  {
    question: "How do I provision a new deployment region?",
    answer: `## New Region Provisioning Guide

### Prerequisites
- Cloud provider account with required permissions
- VPC / Network configuration ready
- ClickHouse cluster provisioned (min 3 nodes for HA)
- PostgreSQL replica (or separate RDS instance)
- Redis cluster (for cache and queue)
- DNS records and SSL certificates

### Provisioning Steps

#### 1. Register Region
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/regions \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "id": "eu-central-1",
    "name": "EU Central",
    "location": "Frankfurt, Germany",
    "provider": "aws",
    "clickhouseHosts": ["ch1.eu-central.internal", "ch2.eu-central.internal", "ch3.eu-central.internal"],
    "postgresHost": "pg.eu-central.internal",
    "redisHost": "redis.eu-central.internal",
    "compliance": ["GDPR", "SOC2"],
    "isActive": false
  }'
\`\`\`

#### 2. Run Migration
\`\`\`bash
# Run ClickHouse migrations in new region
npm run migrate:clickhouse -- --region eu-central-1
\`\`\`

#### 3. Activate Region
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/regions/eu-central-1 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "isActive": true }'
\`\`\`

### Post-Activation Checklist
| Step | Status |
|------|--------|
| Run ClickHouse migrations | ❓ Verify |
| Test ingestion endpoint | ❓ Verify |
| Verify SSL certificate | ❓ Verify |
| Enable health checks | ❓ Verify |
| Notify affected organizations | ❓ Pending |`,
  },
  {
    question: "What is the capacity and health status per region?",
    answer: `## Region Capacity & Health Report

### us-east-1 (US East)
| Resource | Used | Total | Status |
|---------|------|-------|--------|
| Ingestion Rate | 180K/s | 300K/s | ⚠️ 60% — monitor |
| Storage | 1.8 TB | 3 TB | ✅ 58% |
| ClickHouse CPU | 62% avg | 100% | ⚠️ Approaching |
| Active Connections | 1,234 | 5,000 | ✅ |
| Queue Backlog | 2,456 | — | ✅ Normal |

### eu-west-1 (EU West)
| Resource | Used | Total | Status |
|---------|------|-------|--------|
| Ingestion Rate | 82K/s | 300K/s | ✅ 27% |
| Storage | 890 GB | 3 TB | ✅ 29% |
| ClickHouse CPU | 38% avg | 100% | ✅ Healthy |
| Active Connections | 456 | 5,000 | ✅ |
| Queue Backlog | 123 | — | ✅ Normal |

### ap-southeast-1 (APAC)
| Resource | Used | Total | Status |
|---------|------|-------|--------|
| Ingestion Rate | 97K/s | 300K/s | ✅ 32% |
| Storage | 1.1 TB | 3 TB | ✅ 37% |
| ClickHouse CPU | 44% avg | 100% | ✅ Healthy |
| Active Connections | 678 | 5,000 | ✅ |
| Queue Backlog | 89 | — | ✅ Normal |

### Recommendations
- **us-east-1**: Consider adding a 4th ClickHouse node before reaching 75% CPU
- All regions have healthy queue backlogs — no ingestion bottleneck detected`,
  },
  {
    question: "What is the latency between deployment regions?",
    answer: `## Inter-Region Latency Report

### Region-to-Region Round-Trip Times (P50 / P95)
| Source | Destination | P50 Latency | P95 Latency | Status |
|--------|-------------|-------------|-------------|--------|
| us-east-1 | eu-west-1 | 82ms | 104ms | ✅ Normal |
| us-east-1 | ap-southeast-1 | 178ms | 213ms | ✅ Normal |
| eu-west-1 | ap-southeast-1 | 156ms | 189ms | ✅ Normal |
| us-east-1 | us-east-1 | 0.8ms | 1.2ms | ✅ Intra-region |
| eu-west-1 | eu-west-1 | 0.6ms | 0.9ms | ✅ Intra-region |
| ap-southeast-1 | ap-southeast-1 | 0.7ms | 1.1ms | ✅ Intra-region |

### Latency Impact on Cross-Region Features
| Feature | Affected Regions | Latency Added | Mitigation |
|---------|-----------------|---------------|------------|
| Global billing sync | All → us-east-1 | +82–178ms | Async job queue |
| Aggregated analytics | All → us-east-1 | +82–178ms | Batch processing |
| Health check polling | All → us-east-1 | +82–178ms | Local health agent |
| User auth (SSO) | All → us-east-1 | +82–178ms | Regional JWT cache |

### Historical Trend (Last 7 Days)
| Region Pair | Avg Latency | Max Spike | SLA Threshold |
|-------------|-------------|-----------|---------------|
| us-east-1 ↔ eu-west-1 | 83ms | 142ms | 250ms ✅ |
| us-east-1 ↔ ap-southeast-1 | 181ms | 247ms | 300ms ✅ |
| eu-west-1 ↔ ap-southeast-1 | 158ms | 209ms | 300ms ✅ |

### Summary
All inter-region latencies are within SLA thresholds. Cross-region features use async patterns to avoid blocking user-facing requests.`,
  },
  {
    question: "How do I set the default region for new organizations?",
    answer: `## Setting the Default Region

### Current Default Region Configuration
| Setting | Value | Scope |
|---------|-------|-------|
| Global default region | us-east-1 | Platform-wide |
| Fallback when region unspecified | us-east-1 | API & UI |
| Region auto-detection | Enabled (GeoIP) | New org signup |

### Update Default Region via API
\`\`\`bash
# Update platform-wide default region
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/settings \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "defaultRegionId": "eu-west-1",
    "regionAutoDetect": true,
    "geoIpFallback": "us-east-1"
  }'
\`\`\`

### Region Auto-Detection Logic
\`\`\`
1. GeoIP lookup on signup IP address
2. Map IP country → nearest region:
   EU countries      → eu-west-1
   APAC countries    → ap-southeast-1
   All others        → us-east-1 (default)
3. Present detected region to user with option to override
4. Store confirmed region on organization record
\`\`\`

### Override Region per Organization
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "regionId": "ap-southeast-1" }'
\`\`\`

### Notes
- Region cannot be changed after the first tenant is created without a full migration
- Compliance teams should review region selection for GDPR/data residency requirements`,
  },
  {
    question: "What are the region-specific resource quotas and limits?",
    answer: `## Region Resource Quotas & Limits

### Infrastructure Limits per Region
| Resource | us-east-1 | eu-west-1 | ap-southeast-1 |
|---------|-----------|-----------|----------------|
| Max ingestion rate | 300K events/s | 300K events/s | 300K events/s |
| Max ClickHouse storage | 10 TB | 10 TB | 5 TB |
| Max organizations | 500 | 200 | 200 |
| Max concurrent connections | 50,000 | 50,000 | 50,000 |
| BullMQ queue concurrency | 20 workers | 20 workers | 10 workers |

### Current Utilization vs Limits
| Region | Organizations | Ingestion Used | Storage Used | Connections |
|--------|--------------|---------------|--------------|-------------|
| us-east-1 | 2 / 500 | 180K/s (60%) | 1.8 TB (18%) | 1,234 |
| eu-west-1 | 1 / 200 | 82K/s (27%) | 890 GB (9%) | 456 |
| ap-southeast-1 | 1 / 200 | 97K/s (32%) | 1.1 TB (22%) | 678 |

### Per-Organization Quota Caps by Region
| Region | Max Orgs on Professional | Max Orgs on Enterprise | Notes |
|--------|-------------------------|----------------------|-------|
| us-east-1 | Unlimited | Unlimited | Primary region |
| eu-west-1 | 100 | 50 | GDPR-compliant only |
| ap-southeast-1 | 100 | 50 | APAC data residency |

### Planned Capacity Expansions
| Region | Expansion | ETA | Trigger |
|--------|-----------|-----|---------|
| us-east-1 | +2 CH nodes | Q2 2026 | CPU > 70% |
| ap-southeast-1 | +5 TB storage | Q3 2026 | Storage > 50% |`,
  },
  {
    question: "How is failover configured between regions?",
    answer: `## Region Failover Configuration

### Failover Architecture
\`\`\`
Primary Region (us-east-1)
       │
       ├── Active health check every 30s
       │
       ▼ (if health check fails × 3)
Failover Logic (Control Plane)
       │
       ├── DNS cutover to standby region
       ├── BullMQ queue drain to target
       └── Alert ops team via PagerDuty
\`\`\`

### Failover Policies per Region
| Source Region | Failover Target | RPO | RTO | Mode |
|--------------|----------------|-----|-----|------|
| us-east-1 | eu-west-1 | 5 min | 15 min | Manual approval |
| eu-west-1 | us-east-1 | 5 min | 15 min | Manual approval |
| ap-southeast-1 | us-east-1 | 5 min | 20 min | Manual approval |

### Configure Failover Settings
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/regions/us-east-1/failover \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "enabled": true,
    "targetRegionId": "eu-west-1",
    "healthCheckIntervalSeconds": 30,
    "failureThreshold": 3,
    "mode": "manual",
    "notifyChannels": ["pagerduty", "slack"]
  }'
\`\`\`

### Current Failover Status
| Region | Failover Enabled | Target | Last Test | Status |
|--------|-----------------|--------|-----------|--------|
| us-east-1 | ✅ Yes | eu-west-1 | 14 days ago | ✅ Passed |
| eu-west-1 | ✅ Yes | us-east-1 | 14 days ago | ✅ Passed |
| ap-southeast-1 | ✅ Yes | us-east-1 | 30 days ago | ⚠️ Overdue test |

### Recommendation
⚠️ Schedule a failover drill for **ap-southeast-1** — last test was 30 days ago (threshold: 21 days).`,
  },
  {
    question: "What are the region quota limits and how do I adjust them?",
    answer: `## Region Quota Limits

### Platform-Level Region Quotas
| Quota | us-east-1 | eu-west-1 | ap-southeast-1 | Adjustable |
|-------|-----------|-----------|----------------|-----------|
| Max organizations | 500 | 200 | 200 | ✅ Admin only |
| Max workspaces per region | 2,500 | 1,000 | 1,000 | ✅ Admin only |
| Max tenants per region | 10,000 | 5,000 | 5,000 | ✅ Admin only |
| Max API keys per region | 50,000 | 20,000 | 20,000 | ✅ Admin only |
| Max ingestion rate (all orgs) | 300K/s | 300K/s | 300K/s | ❌ Hardware |

### Current Region Quota Usage
| Region | Orgs | Workspaces | Tenants | API Keys |
|--------|------|------------|---------|---------|
| us-east-1 | 2 / 500 | 7 / 2,500 | 8 / 10,000 | 13 / 50,000 |
| eu-west-1 | 1 / 200 | 1 / 1,000 | 1 / 5,000 | 2 / 20,000 |
| ap-southeast-1 | 1 / 200 | 1 / 1,000 | 1 / 5,000 | 1 / 20,000 |

### Adjust Region Quotas via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/regions/eu-west-1/quotas \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "maxOrganizations": 300,
    "maxWorkspaces": 1500,
    "maxTenants": 7500,
    "maxApiKeys": 30000
  }'
\`\`\`

### Notes
- All quota adjustments are logged to the audit trail
- Hardware-bound limits (ingestion rate, storage) require infrastructure changes
- Quota changes take effect immediately with no downtime`,
  },
  {
    question: "How do I fetch region metrics and health data via API?",
    answer: `## Region Metrics & Health API

### Available Region Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/v2/tenancy/regions\` | GET | List all regions with status |
| \`/api/v2/tenancy/regions/{id}\` | GET | Single region details |
| \`/api/v2/tenancy/regions/{id}/health\` | GET | Health check results |
| \`/api/v2/tenancy/regions/{id}/metrics\` | GET | Ingestion & resource metrics |
| \`/api/v2/tenancy/regions/{id}/capacity\` | GET | Capacity utilization |

### List All Regions
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/tenancy/regions \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Response
\`\`\`json
[
  {
    "id": "us-east-1",
    "name": "US East",
    "status": "healthy",
    "ingestionRatePerSec": 180432,
    "storageTB": 1.8,
    "cpuUsagePct": 62,
    "memoryUsagePct": 71,
    "organizations": 2,
    "tenants": 8,
    "uptime99d": 99.98
  }
]
\`\`\`

### Fetch Region Health Details
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/tenancy/regions/us-east-1/health \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Health Response Fields
| Field | Type | Description |
|-------|------|-------------|
| \`clickhouseStatus\` | string | healthy / degraded / down |
| \`postgresStatus\` | string | healthy / degraded / down |
| \`redisStatus\` | string | healthy / degraded / down |
| \`queueBacklog\` | number | Pending BullMQ jobs |
| \`lastCheckedAt\` | ISO 8601 | Timestamp of last health probe |`,
  },
  {
    question: "How are tenants distributed across regions?",
    answer: `## Multi-Region Tenant Distribution

### Tenant Count by Region
| Region | Organizations | Workspaces | Tenants | % of Total |
|--------|--------------|------------|---------|-----------|
| us-east-1 | 2 | 5 | 6 | 75% |
| eu-west-1 | 1 | 1 | 1 | 12.5% |
| ap-southeast-1 | 1 | 1 | 1 | 12.5% |

### Tenant-to-Region Mapping
| Tenant | Region | Organization | Residency Requirement |
|--------|--------|-------------|----------------------|
| prod-main | us-east-1 | DevOpsCorner | US only |
| prod-staging | us-east-1 | DevOpsCorner | US only |
| dev-team-alpha | us-east-1 | DevOpsCorner | US only |
| qa-automation | us-east-1 | DevOpsCorner | US only |
| cn-prod | us-east-1 | CloudNative | US only |
| cn-sandbox | us-east-1 | CloudNative | US only |
| et-prod-eu | eu-west-1 | EuroTech | EU (GDPR) |
| ap-prod | ap-southeast-1 | AsiaPacific | APAC |

### Ingestion Load Distribution
| Region | Ingestion Share | Dominant Tenant |
|--------|----------------|-----------------|
| us-east-1 | 68% of total | prod-main (24%) |
| ap-southeast-1 | 18% of total | ap-prod (18%) |
| eu-west-1 | 14% of total | et-prod-eu (14%) |

### Growth Projections (Next 6 Months)
| Region | Current Tenants | Projected Tenants | New Orgs Expected |
|--------|----------------|-------------------|-------------------|
| us-east-1 | 6 | 9 | 1–2 |
| eu-west-1 | 1 | 3 | 1 |
| ap-southeast-1 | 1 | 2 | 0–1 |`,
  },
];

export const TENANCY_REGIONS_CONVERSATION_TITLES: string[] = [
  "Region list and status",
  "Provision new region",
  "Region capacity report",
  "Inter-region latency analysis",
  "Default region configuration",
  "Region resource quotas",
  "Failover region setup",
  "Region quota limits and adjustments",
  "Region metrics API reference",
  "Multi-region tenant distribution",
];

// ==================== TENANCY ORGANIZATIONS SUB-CONTEXT ====================

export const TENANCY_ORGANIZATIONS_MOCK_DATA: MockQA[] = [
  {
    question: "Show all organizations and their subscription plan",
    answer: `## Organization Overview

### Active Organizations
| Organization | Slug | Region | Plan | Users | Workspaces | Status |
|-------------|------|--------|------|-------|-----------|--------|
| DevOpsCorner Inc. | devopscorner | us-east-1 | Enterprise | 28 | 3 | ✅ Active |
| CloudNative Ltd. | cloudnative | us-east-1 | Professional | 12 | 2 | ✅ Active |
| EuroTech GmbH | eurotech | eu-west-1 | Professional | 8 | 1 | ✅ Active |
| AsiaPacific Corp. | asiapacific | ap-southeast-1 | Professional | 5 | 1 | ✅ Active |

### Plan Distribution
| Plan | Organizations | Monthly Revenue |
|------|--------------|----------------|
| Enterprise | 1 | $3,733 |
| Professional | 3 | $2,976 |
| Starter | 0 | — |

### Quota Usage by Organization
| Organization | Metrics | Logs | Traces | Storage | Status |
|-------------|---------|------|--------|---------|--------|
| DevOpsCorner | 75K/min (94%) | 18K/min | 5.2K/min | 512 GB | ⚠️ Near limit |
| CloudNative | 36K/min (72%) | 9.4K/min | 2.5K/min | 183 GB | ✅ OK |
| EuroTech | 23K/min (46%) | 6.8K/min | 1.9K/min | 145 GB | ✅ OK |
| AsiaPacific | 19K/min (38%) | 5.7K/min | 1.6K/min | 112 GB | ✅ OK |

### Action Required
⚠️ **DevOpsCorner** metrics ingestion at 94% quota. Recommend plan upgrade or cardinality reduction.`,
  },
  {
    question: "How do I create and configure a new organization?",
    answer: `## Creating a New Organization

### Via UI
1. Navigate to **Tenancy → Organizations**
2. Click **Create Organization**
3. Fill in: Name, Slug, Region, Plan
4. Configure billing contact
5. Set default quotas
6. Click **Create**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/organizations \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "NewCorp Inc.",
    "slug": "newcorp",
    "regionId": "us-east-1",
    "plan": "professional",
    "billing": {
      "email": "billing@newcorp.com",
      "contactName": "Finance Team"
    },
    "settings": {
      "defaultRetentionDays": 30,
      "maxWorkspaces": 5,
      "maxUsersPerWorkspace": 25,
      "ssoEnabled": false,
      "enforceSSO": false,
      "allowApiKeyCreation": true
    }
  }'
\`\`\`

### Default Quotas by Plan
| Plan | Metrics/min | Logs/min | Traces/min | Storage | Users | Workspaces |
|------|------------|---------|-----------|---------|-------|-----------|
| Starter | 10K | 5K | 2K | 50 GB | 5 | 1 |
| Professional | 50K | 20K | 10K | 500 GB | 25 | 5 |
| Enterprise | Custom | Custom | Custom | Custom | Unlimited | Unlimited |

### Post-Creation Steps
1. Create at least one **Workspace**
2. Create at least one **Tenant** in the workspace
3. Generate an **API Key** for ingestion
4. Invite the **Org Admin** user`,
  },
  {
    question: "Which organizations are approaching their quota limits?",
    answer: `## Quota Limit Analysis

### Organizations Near Limits
| Organization | Metric | Current | Limit | Usage | ETA to Exceed |
|-------------|--------|---------|-------|-------|---------------|
| DevOpsCorner | Metrics/min | 75,234 | 80,000 | 94% | ⚠️ ~1 week |
| DevOpsCorner | Storage | 512 GB | 600 GB | 85% | ⚠️ ~2 weeks |
| CloudNative | Metrics/min | 36,123 | 50,000 | 72% | ✅ ~4 weeks |

### Recommendations
| Organization | Action | Impact | Priority |
|-------------|--------|--------|----------|
| DevOpsCorner | Upgrade to Enterprise | Removes all limits | 🔴 Urgent |
| DevOpsCorner | Enable metric cardinality reduction | -20% metrics | ⚠️ Medium |
| DevOpsCorner | Increase storage quota | +200 GB | ⚠️ Medium |
| CloudNative | Monitor monthly growth trend | Preventive | ℹ️ Low |

### Growth Trend (Last 30 Days)
| Organization | Metrics Growth | Logs Growth | Storage Growth |
|-------------|---------------|------------|---------------|
| DevOpsCorner | +12%/month | +8%/month | +15%/month |
| CloudNative | +5%/month | +3%/month | +7%/month |
| EuroTech | +9%/month | +6%/month | +11%/month |`,
  },
  {
    question: "Show me the organization hierarchy and nested workspaces",
    answer: `## Organization Hierarchy

### Full Hierarchy Tree
\`\`\`
DevOpsCorner Inc. (Enterprise)
├── Workspace: Production       [prod] — 14 users, 2 tenants
├── Workspace: Development      [dev]  —  7 users, 1 tenant
└── Workspace: QA               [qa]   —  7 users, 1 tenant

CloudNative Ltd. (Professional)
├── Workspace: Production       [prod] —  8 users, 1 tenant
└── Workspace: Sandbox          [sbx]  —  3 users, 1 tenant

EuroTech GmbH (Professional)
└── Workspace: Production       [prod] —  8 users, 1 tenant

AsiaPacific Corp. (Professional)
└── Workspace: Production       [prod] —  5 users, 1 tenant
\`\`\`

### Hierarchy Summary
| Organization | Plan | Workspaces | Tenants | Users | Region |
|-------------|------|-----------|---------|-------|--------|
| DevOpsCorner Inc. | Enterprise | 3 | 4 | 28 | us-east-1 |
| CloudNative Ltd. | Professional | 2 | 2 | 12 | us-east-1 |
| EuroTech GmbH | Professional | 1 | 1 | 8 | eu-west-1 |
| AsiaPacific Corp. | Professional | 1 | 1 | 5 | ap-southeast-1 |

### Depth Limits by Plan
| Plan | Max Workspace Depth | Max Tenants per Workspace | Max Workspaces |
|------|--------------------|-----------------------------|----------------|
| Starter | 1 | 2 | 1 |
| Professional | 1 | 5 | 5 |
| Enterprise | 1 | Unlimited | Unlimited |`,
  },
  {
    question: "What are the usage metrics per organization this month?",
    answer: `## Organization Usage Metrics — Current Month

### Ingestion Volume (Month to Date)
| Organization | Metrics Ingested | Logs Ingested | Traces Ingested | Total Events |
|-------------|-----------------|--------------|----------------|-------------|
| DevOpsCorner | 3.24 billion | 776 million | 224 million | 4.24 billion |
| CloudNative | 1.56 billion | 405 million | 108 million | 2.07 billion |
| EuroTech | 993 million | 293 million | 82 million | 1.37 billion |
| AsiaPacific | 815 million | 245 million | 67 million | 1.13 billion |

### Storage Growth This Month
| Organization | Start of Month | Current | Growth | Rate |
|-------------|---------------|---------|--------|------|
| DevOpsCorner | 445 GB | 512 GB | +67 GB | +15%/mo |
| CloudNative | 171 GB | 183 GB | +12 GB | +7%/mo |
| EuroTech | 131 GB | 145 GB | +14 GB | +11%/mo |
| AsiaPacific | 105 GB | 112 GB | +7 GB | +7%/mo |

### Active Users This Month
| Organization | Total Users | Active (30d) | Active Rate | Avg Sessions/User |
|-------------|------------|-------------|-------------|------------------|
| DevOpsCorner | 28 | 26 | 93% | 18.4 |
| CloudNative | 12 | 11 | 92% | 12.7 |
| EuroTech | 8 | 8 | 100% | 22.1 |
| AsiaPacific | 5 | 4 | 80% | 9.8 |

### API Request Volume
| Organization | API Calls (MTD) | Avg Latency | Error Rate |
|-------------|----------------|-------------|------------|
| DevOpsCorner | 2.1 million | 48ms | 0.03% |
| CloudNative | 890K | 42ms | 0.01% |
| EuroTech | 560K | 38ms | 0.00% |
| AsiaPacific | 430K | 52ms | 0.02% |`,
  },
  {
    question: "How do I configure SSO for an organization?",
    answer: `## Organization SSO Configuration

### Supported SSO Providers
| Provider | Protocol | Status |
|---------|----------|--------|
| Okta | SAML 2.0 / OIDC | ✅ Supported |
| Azure AD | SAML 2.0 / OIDC | ✅ Supported |
| Google Workspace | OIDC | ✅ Supported |
| Auth0 | OIDC | ✅ Supported |
| Custom SAML | SAML 2.0 | ✅ Supported |

### Enable SSO via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId}/sso \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "provider": "okta",
    "protocol": "saml",
    "entityId": "https://sso.okta.com/app/exampleapp",
    "ssoUrl": "https://yourorg.okta.com/app/exampleapp/sso/saml",
    "certificate": "-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----",
    "enforceSSO": true,
    "autoProvisionUsers": true,
    "defaultRole": "member"
  }'
\`\`\`

### SSO Configuration Per Organization
| Organization | SSO Provider | Protocol | Enforced | Auto-Provision |
|-------------|-------------|----------|----------|---------------|
| DevOpsCorner | Okta | SAML 2.0 | ✅ Yes | ✅ Yes |
| CloudNative | Azure AD | OIDC | ❌ No | ✅ Yes |
| EuroTech | — | — | ❌ Disabled | — |
| AsiaPacific | — | — | ❌ Disabled | — |

### Enforce SSO (Block Password Login)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "settings": { "enforceSSO": true } }'
\`\`\`

> **Note:** When SSO is enforced, existing password-based users will be required to re-authenticate via SSO on next login.`,
  },
  {
    question: "What are the contact details and admin users for each organization?",
    answer: `## Organization Admin Contacts

### Primary Contacts
| Organization | Admin Name | Admin Email | Billing Email | Phone |
|-------------|-----------|-------------|--------------|-------|
| DevOpsCorner Inc. | Alex Chen | alex.chen@devopscorner.io | billing@devopscorner.io | +1-415-555-0101 |
| CloudNative Ltd. | Sarah Park | sarah.park@cloudnative.co | finance@cloudnative.co | +1-628-555-0189 |
| EuroTech GmbH | Markus Weber | m.weber@eurotech.de | rechnungen@eurotech.de | +49-30-555-0234 |
| AsiaPacific Corp. | Kenji Tanaka | k.tanaka@asiapacific.co | billing@asiapacific.co | +65-6555-0312 |

### Org Admins by Organization
| Organization | User | Role | Last Login |
|-------------|------|------|-----------|
| DevOpsCorner | alex.chen@devopscorner.io | Org Admin | 2 hours ago |
| DevOpsCorner | priya.sharma@devopscorner.io | Org Admin | 1 day ago |
| CloudNative | sarah.park@cloudnative.co | Org Admin | 4 hours ago |
| EuroTech | m.weber@eurotech.de | Org Admin | 3 hours ago |
| AsiaPacific | k.tanaka@asiapacific.co | Org Admin | 6 hours ago |

### Update Billing Contact
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "billing": {
      "contactName": "Finance Team",
      "email": "new-billing@example.com",
      "phone": "+1-415-555-9999"
    }
  }'
\`\`\``,
  },
  {
    question: "What is the billing summary for each organization?",
    answer: `## Organization Billing Summary

### Current Month Charges
| Organization | Plan | Base Fee | Overage | Credits | Total Due |
|-------------|------|---------|---------|---------|----------|
| DevOpsCorner | Enterprise | $2,499 | $1,234 | $0 | $3,733 |
| CloudNative | Professional | $499 | $456 | -$50 | $905 |
| EuroTech | Professional | $499 | $678 | $0 | $1,177 |
| AsiaPacific | Professional | $499 | $345 | $0 | $844 |

### Overage Breakdown (DevOpsCorner)
| Resource | Usage | Included | Overage Units | Rate | Charge |
|---------|-------|----------|--------------|------|--------|
| Metrics | 3.24B | 2.88B | 360M | $0.10/1K | $360 |
| Storage | 512 GB | 500 GB | 12 GB | $0.50/GB | $6 |
| Logs | 776M | 720M | 56M | $0.15/1K | $840 |
| Traces | 224M | 216M | 8M | $0.20/1K | $28 |

### Payment Method on File
| Organization | Payment Method | Card Last 4 | Next Invoice Date |
|-------------|---------------|------------|-----------------|
| DevOpsCorner | Stripe (card) | 4242 | Mar 1, 2026 |
| CloudNative | Stripe (card) | 1234 | Mar 1, 2026 |
| EuroTech | SEPA Debit | DE89 ***4567 | Mar 1, 2026 |
| AsiaPacific | Stripe (card) | 5678 | Mar 1, 2026 |

### Invoice History (Last 3 Months)
| Month | DevOpsCorner | CloudNative | EuroTech | AsiaPacific |
|-------|-------------|------------|---------|------------|
| Feb 2026 | $3,411 | $855 | $1,022 | $789 |
| Jan 2026 | $3,188 | $799 | $934 | $756 |
| Dec 2025 | $2,990 | $731 | $867 | $721 |`,
  },
  {
    question: "How do I configure data residency settings for an organization?",
    answer: `## Organization Data Residency Settings

### Current Data Residency Configuration
| Organization | Home Region | Data Stays In | CDN Scope | GDPR Mode |
|-------------|------------|--------------|-----------|-----------|
| DevOpsCorner | us-east-1 | US only | Global | ❌ Off |
| CloudNative | us-east-1 | US only | Global | ❌ Off |
| EuroTech | eu-west-1 | EU only | EU-only | ✅ On |
| AsiaPacific | ap-southeast-1 | APAC only | APAC-only | ❌ Off |

### Configure Data Residency
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId}/residency \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "dataResidency": {
      "primaryRegion": "eu-west-1",
      "allowCrossRegionAnalytics": false,
      "gdprMode": true,
      "cdnScope": "eu-only",
      "backupRegion": null,
      "encryptionKey": "customer-managed"
    }
  }'
\`\`\`

### Data Residency Rules
| Rule | EU (GDPR) | US | APAC |
|------|-----------|-----|------|
| Telemetry stays in region | ✅ Enforced | ✅ Enforced | ✅ Enforced |
| Billing data can leave region | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Aggregated (anonymous) analytics | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| PII in audit logs stays in region | ✅ Enforced | ✅ Enforced | ✅ Enforced |
| CDN edge caching of responses | ⚠️ EU-only CDN | Global CDN | APAC CDN |

### Customer-Managed Encryption Keys (CMEK)
| Organization | CMEK Enabled | Key Provider | Key Rotation |
|-------------|-------------|-------------|-------------|
| DevOpsCorner | ❌ No | — | — |
| EuroTech | ✅ Yes | AWS KMS | 90 days |
| AsiaPacific | ❌ No | — | — |`,
  },
  {
    question: "How do I list all workspaces belonging to a specific organization?",
    answer: `## Organization Workspace Listing

### Fetch Workspaces for an Organization
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId}/workspaces" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Response
\`\`\`json
[
  {
    "id": "ws-prod-uuid",
    "name": "Production",
    "slug": "production",
    "environment": "production",
    "status": "active",
    "users": 14,
    "tenants": 2,
    "metricsPerMin": 52345,
    "storageGB": 345,
    "quotaUsagePct": 87,
    "createdAt": "2024-01-15T00:00:00Z"
  }
]
\`\`\`

### DevOpsCorner Workspaces
| Workspace | Env | Users | Tenants | Quota Usage | Status |
|-----------|-----|-------|---------|------------|--------|
| Production | production | 14 | 2 | 87% ⚠️ | ✅ Active |
| Development | development | 7 | 1 | 28% | ✅ Active |
| QA | staging | 7 | 1 | 18% | ✅ Active |

### CloudNative Workspaces
| Workspace | Env | Users | Tenants | Quota Usage | Status |
|-----------|-----|-------|---------|------------|--------|
| Production | production | 8 | 1 | 69% | ✅ Active |
| Sandbox | sandbox | 3 | 1 | 3% | ✅ Active |

### Filter by Environment
\`\`\`bash
# List only production workspaces
curl "https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId}/workspaces?environment=production" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
];

export const TENANCY_ORGANIZATIONS_CONVERSATION_TITLES: string[] = [
  "Organization list and plans",
  "Create new organization",
  "Quota limit analysis",
  "Organization hierarchy and workspaces",
  "Monthly usage metrics per organization",
  "SSO configuration for organization",
  "Organization admin contacts",
  "Organization billing summary",
  "Data residency configuration",
  "List workspaces by organization",
];

// ==================== TENANCY WORKSPACES SUB-CONTEXT ====================

export const TENANCY_WORKSPACES_MOCK_DATA: MockQA[] = [
  {
    question: "List all workspaces and their resource usage",
    answer: `## Workspace Overview

### All Workspaces (7 Active)
| Workspace | Organization | Environment | Users | Tenants | Status |
|-----------|-------------|-------------|-------|---------|--------|
| Production | DevOpsCorner | production | 14 | 2 | ✅ Active |
| Development | DevOpsCorner | development | 7 | 1 | ✅ Active |
| QA | DevOpsCorner | staging | 7 | 1 | ✅ Active |
| Production | CloudNative | production | 8 | 1 | ✅ Active |
| Sandbox | CloudNative | sandbox | 3 | 1 | ✅ Active |
| Production | EuroTech | production | 8 | 1 | ✅ Active |
| Production | AsiaPacific | production | 5 | 1 | ✅ Active |

### Resource Usage by Workspace
| Workspace | Metrics/min | Logs/min | Storage | % of Quota |
|-----------|------------|---------|---------|-----------|
| DevOpsCorner/Production | 52,345 | 13,456 | 345 GB | 87% ⚠️ |
| DevOpsCorner/Development | 14,234 | 3,890 | 89 GB | 28% |
| CloudNative/Production | 34,567 | 8,901 | 178 GB | 69% |
| EuroTech/Production | 23,456 | 6,789 | 145 GB | 55% |
| AsiaPacific/Production | 18,901 | 5,678 | 112 GB | 42% |

### Suspended Workspaces (1)
| Workspace | Organization | Suspended On | Reason |
|-----------|-------------|-------------|--------|
| Old-Sandbox | CloudNative | 30d ago | Manual suspension — no active users |`,
  },
  {
    question: "How do I configure workspace quotas?",
    answer: `## Workspace Quota Configuration

### Via UI
1. Navigate to **Tenancy → Workspaces**
2. Click on a workspace → **Settings**
3. Go to **Quotas** tab
4. Adjust metric, log, trace, and storage limits
5. Click **Save Quotas**

### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/quotas \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "metricsPerMinute": 60000,
    "logsPerMinute": 25000,
    "tracesPerMinute": 12000,
    "storageGB": 600,
    "usersMax": 30,
    "alertRulesMax": 100,
    "dashboardsMax": 200
  }'
\`\`\`

### Quota Enforcement Behavior
| Quota Type | On Exceed | Grace Period |
|-----------|-----------|-------------|
| Metrics/min | Ingestion throttled | 5 minute buffer |
| Logs/min | Ingestion throttled | 5 minute buffer |
| Traces/min | Sampling increased | Immediate |
| Storage | No new data retained past limit | 24-hour warning |
| Users | Invitation blocked | None |

### Recommended Quotas by Environment
| Environment | Metrics | Logs | Traces | Storage |
|-----------|---------|------|--------|---------|
| Production | 70% of org quota | 70% | 70% | 70% |
| Development | 20% of org quota | 20% | 20% | 20% |
| QA/Staging | 10% of org quota | 10% | 10% | 10% |`,
  },
  {
    question: "Show workspaces that are approaching quota limits",
    answer: `## Workspace Quota Alert Report

### Near-Limit Workspaces
| Workspace | Metric | Usage | Limit | ETA to Exceed |
|-----------|--------|-------|-------|---------------|
| DevOpsCorner/Production | Metrics/min | 52,345 (87%) | 60,000 | ⚠️ ~5 days |
| DevOpsCorner/Production | Storage | 345 GB (86%) | 400 GB | ⚠️ ~7 days |
| CloudNative/Production | Metrics/min | 34,567 (69%) | 50,000 | ✅ ~3 weeks |

### Recommended Actions
| Workspace | Action | Priority |
|-----------|--------|----------|
| DevOpsCorner/Production | Increase quota or reduce cardinality | 🔴 Urgent |
| DevOpsCorner/Production | Expand storage allocation | 🔴 Urgent |
| CloudNative/Production | Monitor growth trend | ℹ️ Low |

### Quick Relief Options for DevOpsCorner/Production
1. **Increase workspace quota** (requires org quota headroom)
2. **Enable metric aggregation** to reduce cardinality by ~30%
3. **Archive traces >14 days** to free storage
4. **Adjust sampling rate** for high-volume services

> Note: DevOpsCorner org itself is also near its 80K limit. Workspace quota increase alone won't help unless the org quota is also raised.`,
  },
  {
    question: "How is workspace data isolation enforced?",
    answer: `## Workspace Data Isolation

### Isolation Architecture
| Layer | Mechanism | Scope | Status |
|-------|-----------|-------|--------|
| API | JWT carries workspace_id claim | All requests | ✅ Active |
| Middleware | WorkspaceContext injected per request | NestJS guards | ✅ Active |
| PostgreSQL | Row-level workspace_id filter | Dashboards, alerts, reports | ✅ Active |
| ClickHouse | Query-level tenant_id + workspace_id filter | Metrics, logs, traces | ✅ Active |
| Redis Cache | Keys prefixed with \`tf:cache:{workspace_id}:\` | All cached data | ✅ Active |

### Cross-Workspace Access Prevention
\`\`\`
Request: GET /api/v2/dashboards
JWT: { workspaceId: "ws-devops-prod", userId: "usr-alex" }

Guard checks:
  1. Is ws-devops-prod active? ✅
  2. Is usr-alex a member of ws-devops-prod? ✅
  3. Inject WorkspaceContext → all queries scoped to ws-devops-prod

ClickHouse query generated:
  SELECT * FROM metrics_raw
  WHERE workspace_id = 'ws-devops-prod'
    AND tenant_id IN ('t-prod-main', 't-prod-staging')
\`\`\`

### Isolation Test Results (Last Run)
| Test Case | Result | Tested |
|-----------|--------|--------|
| User from WS-A accessing WS-B dashboards | ✅ 403 Forbidden | 1 hour ago |
| API key of WS-A querying WS-B metrics | ✅ 403 Forbidden | 1 hour ago |
| Cache key collision between workspaces | ✅ Prevented by prefix | 1 hour ago |
| Cross-workspace alert rule trigger | ✅ Blocked | 1 hour ago |

### Compliance Note
Each workspace has its own RBAC policy set. A user with Org Admin access can see all workspaces in the org but cannot bypass workspace-level data access controls.`,
  },
  {
    question: "What are the resource limits per workspace and how do I set them?",
    answer: `## Workspace Resource Limits

### Default Limits by Environment
| Resource | Production | Staging | Development | Sandbox |
|---------|-----------|---------|------------|---------|
| Metrics/min | 50,000 | 15,000 | 10,000 | 2,000 |
| Logs/min | 20,000 | 6,000 | 4,000 | 1,000 |
| Traces/min | 10,000 | 3,000 | 2,000 | 500 |
| Storage | 400 GB | 100 GB | 50 GB | 10 GB |
| Users | 20 | 10 | 10 | 5 |
| Dashboards | 200 | 50 | 50 | 20 |
| Alert rules | 100 | 25 | 25 | 10 |
| Tenants | 5 | 3 | 3 | 2 |

### Update Workspace Resource Limits
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/quotas \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "metricsPerMinute": 70000,
    "logsPerMinute": 25000,
    "tracesPerMinute": 12000,
    "storageGB": 600,
    "usersMax": 30,
    "dashboardsMax": 300,
    "alertRulesMax": 150,
    "tenantsMax": 8
  }'
\`\`\`

### Current Limits vs Usage
| Workspace | Metrics Limit | Metrics Used | Storage Limit | Storage Used |
|-----------|-------------|-------------|--------------|-------------|
| DevOps/Production | 60,000 | 52,345 (87%) | 400 GB | 345 GB (86%) |
| DevOps/Development | 15,000 | 14,234 (95%) | 100 GB | 89 GB (89%) |
| CloudNative/Production | 50,000 | 34,567 (69%) | 300 GB | 178 GB (59%) |

### Alert
⚠️ **DevOps/Development** is at 95% of its metrics limit — immediate quota increase recommended.`,
  },
  {
    question: "How do I manage API credentials for a workspace?",
    answer: `## Workspace API Credentials

### API Key Types per Workspace
| Key Type | Purpose | Scope | Expiry |
|----------|---------|-------|--------|
| Ingestion Key | OTLP data ingestion | Write-only, tenant-scoped | Never (rotatable) |
| Read Key | Query API access | Read-only, workspace-scoped | 90 days (configurable) |
| Admin Key | Management API | Full workspace CRUD | 30 days |

### List API Keys for a Workspace
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/api-keys" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Create a New API Key
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/api-keys \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "CI Pipeline Key",
    "type": "ingestion",
    "tenantId": "t-prod-main",
    "expiresInDays": null,
    "labels": { "created-by": "platform-team", "env": "production" }
  }'
\`\`\`

### Current API Keys — DevOpsCorner/Production
| Key Name | Type | Tenant | Created | Last Used | Status |
|----------|------|--------|---------|----------|--------|
| prod-ingestion-primary | Ingestion | prod-main | 6 months ago | 2 min ago | ✅ Active |
| prod-ingestion-secondary | Ingestion | prod-staging | 3 months ago | 1 hour ago | ✅ Active |
| grafana-read-key | Read | — (workspace) | 2 months ago | 5 min ago | ✅ Active |

### Rotate an API Key
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/api-keys/{keyId}/rotate \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`
> Rotation generates a new key value. The old key remains valid for a 24-hour grace period.`,
  },
  {
    question: "How do I add and manage members in a workspace?",
    answer: `## Workspace Member Management

### Current Members — DevOpsCorner/Production
| User | Email | Role | Last Active | Status |
|------|-------|------|------------|--------|
| Alex Chen | alex.chen@devopscorner.io | Workspace Admin | 2 hours ago | ✅ Active |
| Priya Sharma | priya.sharma@devopscorner.io | Workspace Admin | 1 day ago | ✅ Active |
| Jordan Lee | jordan.lee@devopscorner.io | Editor | 3 hours ago | ✅ Active |
| Sam Rivera | sam.rivera@devopscorner.io | Viewer | 5 days ago | ✅ Active |

### Workspace Roles
| Role | View Data | Edit Dashboards | Manage Alerts | Manage Users | Manage Tenants |
|------|----------|----------------|--------------|-------------|---------------|
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Workspace Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

### Invite a New Member
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/members \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "email": "newuser@devopscorner.io",
    "role": "editor",
    "sendInviteEmail": true
  }'
\`\`\`

### Remove a Member
\`\`\`bash
curl -X DELETE https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/members/{userId} \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Update Member Role
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/members/{userId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "role": "workspace-admin" }'
\`\`\``,
  },
  {
    question: "What workspace audit logs are available?",
    answer: `## Workspace Audit Logs

### Audit Log Categories
| Category | Events Tracked | Retention |
|---------|---------------|-----------|
| Access | Login, logout, token refresh | 365 days |
| Configuration | Quota changes, settings updates | 365 days |
| Data | Dashboard create/edit/delete, alert rule changes | 365 days |
| User Management | Invite, remove, role change | 365 days |
| API Keys | Create, rotate, revoke | 365 days |
| Tenants | Create, archive, suspend | 365 days |

### Query Audit Logs via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/audit?workspaceId={workspaceId}&limit=50&category=user-management" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Recent Audit Events — DevOpsCorner/Production (Last 24h)
| Timestamp | Actor | Action | Resource | Details |
|-----------|-------|--------|----------|---------|
| 2026-03-01 10:23 | alex.chen | UPDATE_QUOTA | workspace | metricsPerMin: 50K → 60K |
| 2026-03-01 09:45 | priya.sharma | CREATE_API_KEY | api-key | "grafana-read-key" created |
| 2026-03-01 08:12 | jordan.lee | CREATE_DASHBOARD | dashboard | "Infra Overview v2" |
| 2026-02-28 17:34 | alex.chen | INVITE_USER | user | sam.rivera@devopscorner.io |
| 2026-02-28 14:22 | system | QUOTA_ALERT | workspace | metrics at 85% of quota |

### Export Audit Logs
\`\`\`bash
# Export last 30 days as JSON
curl "https://api.telemetryflow.id/api/v2/audit/export?workspaceId={workspaceId}&days=30&format=json" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o workspace-audit.json
\`\`\``,
  },
  {
    question: "How do workspace billing and costs work?",
    answer: `## Workspace Billing & Cost Breakdown

### Cost Attribution Model
Billing occurs at the **Organization** level, but costs are tracked per workspace for internal chargeback / showback reporting.

### Cost by Workspace (Current Month)
| Workspace | Org | Metrics Cost | Logs Cost | Storage Cost | Total |
|-----------|-----|-------------|----------|-------------|-------|
| DevOps/Production | DevOpsCorner | $780 | $412 | $345 | $1,537 |
| DevOps/Development | DevOpsCorner | $213 | $89 | $89 | $391 |
| DevOps/QA | DevOpsCorner | $134 | $67 | $45 | $246 |
| CN/Production | CloudNative | $520 | $267 | $178 | $965 |
| CN/Sandbox | CloudNative | $18 | $9 | $5 | $32 |

### Cost Breakdown Rates
| Resource | Rate |
|---------|------|
| Metrics ingestion | $0.10 per 1K events/min (per month) |
| Log ingestion | $0.15 per 1K events/min (per month) |
| Trace ingestion | $0.20 per 1K events/min (per month) |
| Storage | $0.50 per GB/month |

### Cost Optimization Recommendations
| Workspace | Suggestion | Estimated Saving |
|-----------|-----------|-----------------|
| DevOps/Production | Reduce metric label cardinality by 20% | -$156/mo |
| DevOps/Production | Enable log sampling (5:1) for debug logs | -$82/mo |
| DevOps/Development | Reduce retention from 30d → 7d | -$67/mo |
| CN/Sandbox | Archive inactive tenants | -$30/mo |

### Fetch Workspace Cost Report
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/costs?month=2026-03" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
  {
    question: "How do I configure default settings for a new workspace?",
    answer: `## Default Workspace Settings

### Available Default Settings
| Setting | Description | Default Value |
|---------|-------------|--------------|
| defaultRetentionDays | Data retention for new tenants | 30 |
| defaultEnvironment | Environment tag for new workspace | production |
| alertNotificationChannel | Default alert destination | email |
| metricsRollupEnabled | Enable automated metric rollup | true |
| samplingRate | Default trace sampling rate | 1.0 (100%) |
| logLevel | Minimum log level ingested | info |
| dashboardTheme | UI theme for workspace | system |
| autoArchiveInactiveTenants | Archive tenants idle > N days | false |

### Configure Default Settings via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/workspaces/{workspaceId}/settings \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "defaultRetentionDays": 30,
    "metricsRollupEnabled": true,
    "samplingRate": 0.5,
    "logLevel": "warn",
    "alertNotificationChannel": "slack",
    "autoArchiveInactiveTenants": false,
    "autoArchiveAfterDays": 90
  }'
\`\`\`

### Current Default Settings by Workspace
| Workspace | Retention | Sampling | Log Level | Auto-Archive |
|-----------|-----------|---------|-----------|-------------|
| DevOps/Production | 90 days | 100% | info | ❌ Off |
| DevOps/Development | 7 days | 10% | debug | ✅ On (30d) |
| DevOps/QA | 14 days | 25% | warn | ✅ On (14d) |
| CN/Production | 60 days | 100% | info | ❌ Off |
| CN/Sandbox | 7 days | 5% | debug | ✅ On (7d) |

### Recommended Production Defaults
- Retention: 30–90 days (match compliance requirements)
- Sampling: 10–25% for high-volume services, 100% for critical paths
- Log level: \`warn\` or \`info\` (avoid \`debug\` in production)
- Auto-archive: Disabled in production, enabled in dev/sandbox`,
  },
];

export const TENANCY_WORKSPACES_CONVERSATION_TITLES: string[] = [
  "Workspace list and usage",
  "Configure workspace quotas",
  "Workspaces near quota limits",
  "Workspace data isolation enforcement",
  "Workspace resource limits configuration",
  "Workspace API credentials management",
  "Workspace member management",
  "Workspace audit logs",
  "Workspace billing and cost breakdown",
  "Default workspace settings",
];

// ==================== TENANCY TENANTS SUB-CONTEXT ====================

export const TENANCY_TENANTS_MOCK_DATA: MockQA[] = [
  {
    question: "Show all tenants and their ingestion status",
    answer: `## Tenant Inventory

### All Tenants (8)
| Tenant | Workspace | Status | Ingestion Rate | Storage | API Keys |
|--------|-----------|--------|---------------|---------|---------|
| prod-main | DevOps/Production | ✅ Active | 45,678/min | 234 GB | 3 active |
| prod-staging | DevOps/Production | ✅ Active | 12,345/min | 89 GB | 1 active |
| dev-team-alpha | DevOps/Development | ✅ Active | 3,456/min | 23 GB | 2 active |
| qa-automation | DevOps/QA | ✅ Active | 8,901/min | 45 GB | 1 active |
| cn-prod | CloudNative/Production | ✅ Active | 34,567/min | 178 GB | 2 active |
| cn-sandbox | CloudNative/Sandbox | ✅ Active | 1,234/min | 5 GB | 1 active |
| et-prod-eu | EuroTech/Production | ✅ Active | 23,456/min | 145 GB | 2 active |
| ap-prod | AsiaPacific/Production | ✅ Active | 18,901/min | 112 GB | 1 active |

### Ingestion Health (Last 1 Hour)
| Tenant | Events/min | Errors | Queue Lag | Status |
|--------|-----------|--------|-----------|--------|
| prod-main | 45,892 | 3 (0.007%) | 0ms | ✅ Healthy |
| cn-prod | 34,123 | 0 | 0ms | ✅ Healthy |
| et-prod-eu | 23,678 | 1 (0.004%) | 12ms | ✅ Healthy |
| qa-automation | 8,945 | 45 (0.5%) | 3ms | ⚠️ Elevated errors |

### Alert
⚠️ **qa-automation** has elevated ingestion errors (0.5%). Likely cause: malformed OTEL spans from CI pipeline. Check trace validation logs.`,
  },
  {
    question: "How do I provision a new tenant?",
    answer: `## Tenant Provisioning Guide

### Via UI
1. Navigate to **Tenancy → Tenants**
2. Click **Create Tenant**
3. Select target Workspace
4. Enter: Name, Slug, Labels
5. Configure retention settings
6. Click **Create** — API key auto-generated

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/tenants \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "prod-new",
    "workspaceId": "ws-production-uuid",
    "retentionDays": 30,
    "labels": {
      "env": "production",
      "team": "platform",
      "cost-center": "engineering"
    },
    "ingestionKey": "auto-generate"
  }'
\`\`\`

### Auto-Provisioned on Tenant Creation
| Resource | Description |
|---------|-------------|
| API Key | Ingestion key for OTLP endpoint |
| ClickHouse Partition | Data isolation partition created |
| Retention Policy | Default from workspace settings |
| RBAC Scope | Tenant scoped to parent workspace |

### Ingestion Endpoint
After creation, configure your collector:
\`\`\`yaml
# OpenTelemetry Collector
exporters:
  otlphttp:
    endpoint: https://ingest.telemetryflow.id/v1
    headers:
      X-API-Key: "generated-tenant-api-key"
\`\`\``,
  },
  {
    question: "Which tenants have the highest ingestion rate?",
    answer: `## Top Tenants by Ingestion Rate

### Top 5 by Metrics/min
| Rank | Tenant | Metrics/min | Logs/min | Traces/min | Total Events |
|------|--------|------------|---------|-----------|-------------|
| 1 | prod-main | 45,678 | 12,345 | 3,456 | 61,479 |
| 2 | cn-prod | 34,567 | 8,901 | 2,345 | 45,813 |
| 3 | et-prod-eu | 23,456 | 6,789 | 1,890 | 32,135 |
| 4 | ap-prod | 18,901 | 5,678 | 1,567 | 26,146 |
| 5 | prod-staging | 12,345 | 4,567 | 1,234 | 18,146 |

### Ingestion Growth (Last 30 Days)
| Tenant | Growth Rate | Trend | Notes |
|--------|------------|-------|-------|
| prod-main | +5%/week | ↗ | New microservices added |
| et-prod-eu | +7%/week | ↗↗ | EU expansion underway |
| cn-prod | +3%/week | ↗ | Stable growth |
| qa-automation | +12%/week | ↗↗↗ | CI pipeline scaling |

### Cost by Tenant (Estimated Monthly)
| Tenant | Storage Cost | Ingestion Cost | Total |
|--------|------------|---------------|-------|
| prod-main | $280 | $456 | $736 |
| cn-prod | $213 | $346 | $559 |
| et-prod-eu | $174 | $234 | $408 |
| ap-prod | $134 | $189 | $323 |

### Recommendation
⚠️ **et-prod-eu** growth at +7%/week will exceed workspace quota in ~5 weeks. Consider workspace quota increase or sampling strategy.`,
  },
  {
    question: "Walk me through the full tenant onboarding flow",
    answer: `## Tenant Onboarding Flow

### End-to-End Onboarding Steps
| Step | Actor | Action | Duration |
|------|-------|--------|----------|
| 1 | Platform Admin | Create Organization | 2 min |
| 2 | Platform Admin | Create Workspace | 2 min |
| 3 | Platform Admin | Create Tenant | 1 min |
| 4 | System | Auto-generate API key | Instant |
| 5 | System | Provision ClickHouse partition | < 30s |
| 6 | System | Apply default retention policy | Instant |
| 7 | Platform Admin | Invite Org Admin user | 2 min |
| 8 | Org Admin | Accept invite, set password / SSO | 5 min |
| 9 | DevOps Engineer | Configure OTEL Collector | 10 min |
| 10 | DevOps Engineer | Send first test signal | 2 min |
| 11 | Org Admin | Verify data in dashboards | 5 min |

### OTEL Collector Quick-Start Config
\`\`\`yaml
exporters:
  otlphttp/telemetryflow:
    endpoint: https://ingest.telemetryflow.id/v1
    headers:
      X-API-Key: "YOUR_TENANT_API_KEY"

service:
  pipelines:
    metrics:
      exporters: [otlphttp/telemetryflow]
    logs:
      exporters: [otlphttp/telemetryflow]
    traces:
      exporters: [otlphttp/telemetryflow]
\`\`\`

### Onboarding Checklist
| Item | Status |
|------|--------|
| Organization created | ❓ |
| Workspace created | ❓ |
| Tenant created | ❓ |
| API key distributed to team | ❓ |
| OTEL Collector deployed | ❓ |
| First metrics received | ❓ |
| Dashboard configured | ❓ |
| Alerts configured | ❓ |`,
  },
  {
    question: "Generate a usage report for a specific tenant",
    answer: `## Tenant Usage Report — prod-main

### Report Period: February 2026

### Ingestion Summary
| Signal | Volume (MTD) | Avg Rate | Peak Rate | Peak Time |
|--------|-------------|----------|----------|-----------|
| Metrics | 1.97 billion | 45,678/min | 67,234/min | Feb 14, 09:30 |
| Logs | 532 million | 12,345/min | 18,901/min | Feb 14, 09:32 |
| Traces | 149 million | 3,456/min | 5,123/min | Feb 14, 09:31 |

### Storage Usage
| Data Type | Current | Growth MTD | Projected (30d) |
|-----------|---------|-----------|----------------|
| Metrics (raw) | 89 GB | +12 GB | 101 GB |
| Metrics (rollup) | 23 GB | +3 GB | 26 GB |
| Logs | 78 GB | +11 GB | 89 GB |
| Traces | 44 GB | +6 GB | 50 GB |
| **Total** | **234 GB** | **+32 GB** | **266 GB** |

### Error & Quality Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Ingestion error rate | 0.007% | < 0.1% | ✅ |
| Duplicate event rate | 0.002% | < 0.05% | ✅ |
| Schema validation failures | 0 | 0 | ✅ |
| Queue lag (P99) | 2ms | < 500ms | ✅ |

### Fetch Usage Report via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/tenancy/tenants/{tenantId}/usage?month=2026-02" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
  {
    question: "What plan and subscription is assigned to each tenant?",
    answer: `## Tenant Plan & Subscription Mapping

### Tenant Subscription Details
Subscriptions are set at the **Organization** level. Each tenant inherits its plan limits through the workspace.

| Tenant | Workspace | Org Plan | Metrics Quota | Storage Quota | Retention |
|--------|-----------|---------|--------------|--------------|----------|
| prod-main | DevOps/Production | Enterprise | 60K/min | 500 GB | 90 days |
| prod-staging | DevOps/Production | Enterprise | 15K/min | 100 GB | 30 days |
| dev-team-alpha | DevOps/Development | Enterprise | 10K/min | 50 GB | 7 days |
| qa-automation | DevOps/QA | Enterprise | 10K/min | 50 GB | 14 days |
| cn-prod | CN/Production | Professional | 50K/min | 300 GB | 60 days |
| cn-sandbox | CN/Sandbox | Professional | 2K/min | 10 GB | 7 days |
| et-prod-eu | EuroTech/Production | Professional | 50K/min | 300 GB | 90 days |
| ap-prod | AsiaPacific/Production | Professional | 50K/min | 300 GB | 60 days |

### Plan Feature Comparison
| Feature | Starter | Professional | Enterprise |
|---------|---------|-------------|-----------|
| Max metrics/min | 10K | 50K | Custom |
| Max storage | 50 GB | 500 GB | Custom |
| Retention | 7 days | 60 days | Custom |
| SSO | ❌ | ✅ | ✅ |
| RBAC | Basic | Full | Full + custom |
| SLA | 99.5% | 99.9% | 99.99% |
| Support | Community | Business | Dedicated |

### Upgrade a Tenant's Parent Organization Plan
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "plan": "enterprise" }'
\`\`\``,
  },
  {
    question: "How is SSO mapped to specific tenants?",
    answer: `## Tenant SSO Mapping

### SSO Configuration Overview
SSO is configured at the **Organization** level and applies to all workspaces and tenants within it.

### Current SSO Mapping
| Organization | SSO Provider | Protocol | Tenant Scope | Role Mapping |
|-------------|-------------|----------|-------------|-------------|
| DevOpsCorner | Okta | SAML 2.0 | All tenants | Groups → RBAC roles |
| CloudNative | Azure AD | OIDC | All tenants | Claims → roles |
| EuroTech | — | — | N/A | Local auth |
| AsiaPacific | — | — | N/A | Local auth |

### Okta Group → TelemetryFlow Role Mapping (DevOpsCorner)
| Okta Group | Workspace | TF Role |
|-----------|-----------|---------|
| tf-prod-admins | Production | Workspace Admin |
| tf-prod-editors | Production | Editor |
| tf-prod-viewers | Production | Viewer |
| tf-dev-all | Development | Editor |
| tf-qa-all | QA | Editor |

### Configure SSO Role Mapping
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/organizations/{orgId}/sso/role-mappings \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "mappings": [
      { "externalGroup": "tf-prod-admins", "workspaceId": "ws-prod-uuid", "role": "workspace-admin" },
      { "externalGroup": "tf-prod-editors", "workspaceId": "ws-prod-uuid", "role": "editor" }
    ]
  }'
\`\`\`

### Tenant-Level SSO Restrictions
Tenants themselves do not have SSO configuration — it flows from the organization. However, you can restrict which SSO groups have access to a specific tenant's data by controlling workspace membership.`,
  },
  {
    question: "How do I deactivate or archive a tenant?",
    answer: `## Deactivating & Archiving Tenants

### Deactivate vs Archive vs Delete
| Action | Ingestion | Data Retained | API Keys | Recoverable |
|--------|-----------|--------------|---------|------------|
| Suspend | ❌ Stopped | ✅ Yes | ✅ Kept (inactive) | ✅ Yes |
| Archive | ❌ Stopped | ✅ Yes (read-only) | ❌ Revoked | ✅ Yes (admin only) |
| Delete | ❌ Stopped | ❌ Purged per retention | ❌ Revoked | ❌ No |

### Suspend a Tenant (Temporary)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/tenants/{tenantId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "status": "suspended", "reason": "Non-payment — grace period active" }'
\`\`\`

### Archive a Tenant
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/tenancy/tenants/{tenantId}/archive \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "reason": "Project decommissioned", "notifyAdmins": true }'
\`\`\`

### Reactivate a Suspended Tenant
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/tenancy/tenants/{tenantId} \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "status": "active" }'
\`\`\`

### Current Inactive Tenants
| Tenant | Status | Since | Reason | Data Expires |
|--------|--------|-------|--------|-------------|
| old-sandbox | Archived | 45 days ago | Manual decommission | 15 days |

### Pre-Deactivation Checklist
1. Notify team members who own the tenant
2. Export or back up critical dashboards and alert rules
3. Revoke or rotate API keys
4. Confirm data retention period before archive
5. Update any external OTEL Collector configs`,
  },
  {
    question: "What is the tenant compliance and data governance status?",
    answer: `## Tenant Compliance Status

### Compliance Overview by Tenant
| Tenant | Region | GDPR | SOC 2 | ISO 27001 | Data Encrypted | Audit Log Retention |
|--------|--------|------|-------|----------|---------------|-------------------|
| prod-main | us-east-1 | N/A | ✅ | ✅ | AES-256 | 365 days |
| prod-staging | us-east-1 | N/A | ✅ | ✅ | AES-256 | 90 days |
| dev-team-alpha | us-east-1 | N/A | ✅ | ✅ | AES-256 | 30 days |
| qa-automation | us-east-1 | N/A | ✅ | ✅ | AES-256 | 30 days |
| cn-prod | us-east-1 | N/A | ✅ | ✅ | AES-256 | 365 days |
| et-prod-eu | eu-west-1 | ✅ Active | ✅ | ✅ | AES-256 + CMEK | 730 days |
| ap-prod | ap-southeast-1 | N/A | ✅ | ✅ | AES-256 | 365 days |

### GDPR Controls — et-prod-eu
| Control | Status | Details |
|---------|--------|---------|
| Data stays in EU | ✅ Enforced | eu-west-1 only |
| Right to erasure | ✅ Supported | Via API: DELETE /tenants/{id}/data |
| Data export (portability) | ✅ Supported | JSON / Parquet export |
| Consent logging | ✅ Active | Audit trail per user action |
| PII detection in logs | ⚠️ Manual | Automated PII scrubbing not enabled |

### Compliance Actions Needed
| Tenant | Issue | Priority | Recommendation |
|--------|-------|----------|---------------|
| et-prod-eu | PII scrubbing not enabled | ⚠️ Medium | Enable log PII masking in workspace settings |
| all tenants | SOC 2 recertification due | ℹ️ Low | Scheduled for Q2 2026 |

### Data Erasure Request (GDPR)
\`\`\`bash
curl -X DELETE "https://api.telemetryflow.id/api/v2/tenancy/tenants/{tenantId}/data" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "userId": "user-uuid", "dataTypes": ["logs", "traces"], "reason": "GDPR Art. 17 erasure" }'
\`\`\``,
  },
  {
    question: "How do I configure tenant API access and ingestion keys?",
    answer: `## Tenant API Access Configuration

### Ingestion Endpoint
All tenants share the same ingestion endpoint but are authenticated via their unique API key:

\`\`\`
https://ingest.telemetryflow.id/v1/metrics   (OTLP/HTTP)
https://ingest.telemetryflow.id/v1/logs
https://ingest.telemetryflow.id/v1/traces
\`\`\`

### Current API Keys per Tenant
| Tenant | Key Name | Type | Created | Last Used | Expires |
|--------|---------|------|---------|----------|---------|
| prod-main | primary-ingest | Ingestion | 6 mo ago | 2 min ago | Never |
| prod-main | backup-ingest | Ingestion | 3 mo ago | 1 hr ago | Never |
| prod-main | grafana-read | Read | 2 mo ago | 5 min ago | 90 days |
| et-prod-eu | eu-ingest | Ingestion | 8 mo ago | 8 min ago | Never |
| et-prod-eu | eu-grafana | Read | 4 mo ago | 30 min ago | 90 days |

### Create Tenant Ingestion Key
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/api-keys \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "new-ingest-key",
    "tenantId": "t-prod-main",
    "type": "ingestion",
    "expiresInDays": null,
    "rateLimit": 50000
  }'
\`\`\`

### Revoke an API Key
\`\`\`bash
curl -X DELETE https://api.telemetryflow.id/api/v2/api-keys/{keyId} \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### API Key Rate Limiting per Tenant
| Tenant | Ingestion Key Limit | Read Key Limit | Burst Allowed |
|--------|--------------------|--------------|--------------|
| prod-main | 60K events/min | 1,000 req/min | ✅ Up to 2x for 60s |
| et-prod-eu | 50K events/min | 500 req/min | ✅ Up to 2x for 60s |
| dev-team-alpha | 10K events/min | 200 req/min | ❌ |`,
  },
];

export const TENANCY_TENANTS_CONVERSATION_TITLES: string[] = [
  "Tenant inventory and ingestion",
  "Provision new tenant",
  "Top tenants by ingestion",
  "Tenant onboarding walkthrough",
  "Tenant usage report",
  "Tenant plan and subscription details",
  "SSO mapping for tenants",
  "Deactivating and archiving tenants",
  "Tenant compliance and data governance",
  "Tenant API access and ingestion keys",
];
