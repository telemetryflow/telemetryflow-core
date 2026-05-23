/**
 * Audit Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for audit log analysis and compliance
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const AUDIT_MOCK_DATA: MockQA[] = [
  {
    question: "Show me recent audit log activity",
    answer: `## Audit Log Summary (Last 24 Hours)

### Activity Overview
| Category | Events | % of Total | Trend |
|----------|--------|-----------|-------|
| Authentication | 456 | 38.2% | → Stable |
| Resource Access | 345 | 28.9% | ↗ +12% |
| Configuration Change | 123 | 10.3% | → Stable |
| User Management | 67 | 5.6% | → Stable |
| API Key Usage | 156 | 13.1% | ↗ +8% |
| Alert Actions | 47 | 3.9% | ↘ -5% |
| **Total** | **1,194** | **100%** | **↗ +6%** |

### Top 10 Recent Events
| Time | Actor | Action | Resource | Result |
|------|-------|--------|----------|--------|
| 2m ago | john.admin | dashboard.update | Dashboard "SRE Overview" | ✅ Success |
| 5m ago | api-key:prod | metrics.query | PromQL range query | ✅ Success |
| 12m ago | sarah.devops | alert.acknowledge | Alert #ALR-2024-089 | ✅ Success |
| 18m ago | system | retention.cleanup | Metrics older than 90d | ✅ Success |
| 23m ago | mike.dev | dashboard.create | Dashboard "API Latency" | ✅ Success |
| 34m ago | unknown | auth.login.failed | User admin@ | ❌ Failed |
| 45m ago | ci-cd-bot | deployment.create | api-service v2.5.1 | ✅ Success |
| 1h ago | jane.admin | user.role.update | User mike.dev → Developer | ✅ Success |
| 1h ago | system | backup.create | PostgreSQL full backup | ✅ Success |
| 2h ago | john.admin | sso.config.update | SAML IdP settings | ✅ Success |

### Failed Operations
| Time | Actor | Action | Reason |
|------|-------|--------|--------|
| 34m ago | unknown | auth.login (8x) | Invalid credentials |
| 3h ago | mike.dev | admin.settings.update | Insufficient permissions |
| 6h ago | api-key:staging | prod.metrics.query | Wrong environment scope |`,
  },
  {
    question: "Who made configuration changes this week?",
    answer: `## Configuration Change Audit (Last 7 Days)

### Change Summary
| Actor | Changes | Category | Risk Level |
|-------|---------|----------|------------|
| john.admin@company.com | 12 | SSO, Retention, Alerts | ⚠️ High |
| sarah.devops@company.com | 8 | Alerts, Dashboards | ℹ️ Medium |
| jane.admin@company.com | 5 | Users, Roles | ⚠️ High |
| ci-cd-bot | 15 | Deployments | ℹ️ Medium |
| system | 23 | Auto-scaling, TTL cleanup | ℹ️ Low |

### Detailed Change Log
| Date | Actor | Change | Before | After |
|------|-------|--------|--------|-------|
| Today | john.admin | Retention: metrics | 60d | 90d |
| Today | john.admin | SSO: SAML IdP URL | old-okta.com | new-okta.com |
| Yesterday | jane.admin | Role: mike.dev | Viewer | Developer |
| Yesterday | sarah.devops | Alert: CPU threshold | 80% | 90% |
| 2d ago | john.admin | Notification: Slack | #old-channel | #new-alerts |
| 3d ago | ci-cd-bot | Deploy: api-service | v2.5.0 | v2.5.1 |
| 3d ago | ci-cd-bot | Deploy: worker-svc | v1.8.2 | v1.8.3 |
| 4d ago | sarah.devops | Dashboard: SRE Overview | Added 3 panels | — |
| 5d ago | jane.admin | User: contractor1@ | Active | Disabled |
| 6d ago | john.admin | API Key: rotate prod | sk-old...xyz | sk-new...abc |

### High-Risk Changes
| Change | Actor | Risk | Review Status |
|--------|-------|------|---------------|
| SSO IdP URL change | john.admin | 🔴 High | ⚠️ Unreviewed |
| Retention increase (60→90d) | john.admin | ⚠️ Medium | ⚠️ Unreviewed |
| API key rotation | john.admin | ⚠️ Medium | ✅ Reviewed |
| Role escalation | jane.admin | ⚠️ Medium | ✅ Reviewed |

### Recommendation
Implement a **change approval workflow** for high-risk configuration changes (SSO, retention, billing). Currently, single admin can make critical changes without peer review.`,
  },
  {
    question: "Generate a compliance audit report",
    answer: `## Compliance Audit Report

### Executive Summary
| Standard | Status | Score | Last Audit |
|----------|--------|-------|------------|
| SOC 2 Type II | ⚠️ Partial | 87/100 | 3 months ago |
| ISO 27001 | ✅ Compliant | 94/100 | 8 months ago |
| GDPR | ✅ Compliant | 92/100 | 6 months ago |
| HIPAA | ⚠️ Partial | 78/100 | Not certified |

### SOC 2 Control Assessment
| Control | Category | Status | Finding |
|---------|----------|--------|---------|
| CC6.1 | Access Control | ✅ Pass | Proper RBAC implemented |
| CC6.2 | Authentication | ⚠️ Partial | MFA at 79% (target: 100%) |
| CC6.3 | Authorization | ✅ Pass | Least privilege enforced |
| CC7.1 | Change Management | ⚠️ Partial | No peer review for config |
| CC7.2 | System Monitoring | ✅ Pass | 24/7 monitoring active |
| CC8.1 | Incident Response | ✅ Pass | IR plan documented |

### Audit Log Compliance Checks
| Requirement | Status | Details |
|-------------|--------|---------|
| All admin actions logged | ✅ Pass | 100% coverage |
| Log tampering protection | ✅ Pass | Immutable ClickHouse storage |
| Log retention (1 year) | ✅ Pass | 365-day retention |
| Access to audit logs restricted | ✅ Pass | Admin + Org Admin only |
| Failed login attempts logged | ✅ Pass | With IP and user agent |
| Data access logged | ✅ Pass | Query audit trail |
| Configuration changes logged | ✅ Pass | Before/after values stored |

### Findings & Remediation
| ID | Finding | Severity | Remediation | Deadline |
|----|---------|----------|-------------|----------|
| F-001 | MFA not enforced for all users | ⚠️ Medium | Enforce MFA policy | 30 days |
| F-002 | No peer review for config changes | ⚠️ Medium | Implement approval workflow | 60 days |
| F-003 | 3 inactive accounts not disabled | ℹ️ Low | Disable accounts | 7 days |
| F-004 | SMS MFA still in use (4 users) | ℹ️ Low | Migrate to TOTP/WebAuthn | 30 days |

### Next Steps
1. Address all findings within specified deadlines
2. Schedule SOC 2 Type II renewal audit
3. Begin HIPAA certification process if needed`,
  },
  {
    question: "Show me data access audit trails",
    answer: `## Data Access Audit Trail

### Query Audit Log (Last 6 Hours)
| Time | User | Query Type | Data Source | Rows Accessed | Duration |
|------|------|-----------|-------------|---------------|----------|
| 5m ago | sarah.devops | PromQL | Metrics | 45,678 | 1.2s |
| 12m ago | api-key:grafana | PromQL | Metrics | 12,345 | 0.8s |
| 18m ago | john.admin | SQL | ClickHouse | 234,567 | 3.4s |
| 25m ago | mike.dev | Log search | Logs | 8,901 | 1.5s |
| 34m ago | api-key:prod | Trace query | Traces | 456 | 0.3s |
| 45m ago | system | Aggregation | All | 1,234,567 | 12.3s |

### Sensitive Data Access
| Time | User | Data Category | Resource | Reason |
|------|------|--------------|----------|--------|
| 1h ago | john.admin | PII (user emails) | IAM user list | Admin dashboard |
| 3h ago | jane.admin | Billing data | Subscription details | Invoice review |
| 6h ago | john.admin | API keys (masked) | Key management | Key rotation |

### Access Patterns by User
| User | Queries/day | Data Volume | Peak Hour | Anomaly |
|------|------------|-------------|-----------|---------|
| sarah.devops | 145 | 2.3 GB | 10:00-11:00 | None |
| john.admin | 89 | 5.6 GB | 09:00-10:00 | None |
| mike.dev | 234 | 1.2 GB | 14:00-16:00 | ⚠️ High volume |
| api-key:grafana | 1,440 | 890 MB | Even distribution | None |
| api-key:prod | 12,456 | 89 GB | Business hours | None |

### mike.dev Anomaly Details
- **Normal:** 50-80 queries/day
- **Today:** 234 queries (2.9x normal)
- **Likely cause:** Investigating production incident
- **Action:** Monitor, no immediate concern

### Data Export Audit
| Time | User | Format | Records | Destination |
|------|------|--------|---------|-------------|
| 2h ago | sarah.devops | CSV | 5,678 rows | Browser download |
| 1d ago | john.admin | PDF report | 45 pages | Email (team@) |
| 3d ago | ci-cd-bot | JSON | 234 records | S3 backup |`,
  },
  {
    question: "What are the most common audit events?",
    answer: `## Audit Event Analysis (Last 30 Days)

### Top Events by Frequency
| Event Type | Count | % | Trend |
|-----------|-------|---|-------|
| auth.login.success | 8,456 | 24.1% | → Stable |
| metrics.query | 6,789 | 19.4% | ↗ +8% |
| api.request | 5,678 | 16.2% | ↗ +12% |
| logs.search | 3,456 | 9.9% | → Stable |
| dashboard.view | 2,345 | 6.7% | ↗ +5% |
| traces.query | 1,890 | 5.4% | → Stable |
| alert.fired | 1,234 | 3.5% | ↘ -15% |
| alert.acknowledge | 987 | 2.8% | ↘ -12% |
| auth.login.failed | 567 | 1.6% | ↗ +35% ⚠️ |
| config.change | 456 | 1.3% | → Stable |
| user.management | 234 | 0.7% | → Stable |
| Other | 2,876 | 8.2% | — |

### Failed Login Trend (30 Days)
\`\`\`
Week 1: ████░░░░░░ 89
Week 2: █████░░░░░ 112
Week 3: ███████░░░ 145
Week 4: ██████████ 221  ← +35% increase ⚠️
\`\`\`

### Event Severity Distribution
| Severity | Count | % |
|----------|-------|---|
| Info | 28,456 | 81.2% |
| Warning | 4,567 | 13.0% |
| Error | 1,678 | 4.8% |
| Critical | 345 | 1.0% |

### Storage Impact
| Month | Events | Storage | Growth |
|-------|--------|---------|--------|
| Current | 35,046 | 4.2 GB | — |
| Last Month | 32,890 | 3.9 GB | +7.7% |
| 2 Months Ago | 30,456 | 3.6 GB | +7.4% |

### Alert
⚠️ Failed login attempts increased 35% in the last week. Investigate potential brute-force attack pattern. Consider implementing progressive lockout policy.`,
  },
  {
    question: "How do I search and export audit logs?",
    answer: `## Searching & Exporting Audit Logs

### Search API
\`\`\`bash
# Search by actor and time range
curl "https://api.telemetryflow.id/api/v2/audit/search" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "timeFrom": "2024-01-01T00:00:00Z",
    "timeTo": "2024-01-31T23:59:59Z",
    "filters": {
      "actor": "john.admin@company.com",
      "action": "config.change",
      "result": "success"
    },
    "sort": { "field": "timestamp", "order": "desc" },
    "page": 1,
    "pageSize": 50
  }'

# Search by resource type
curl "https://api.telemetryflow.id/api/v2/audit/search" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "filters": {
      "resourceType": "alert_rule",
      "action": ["create", "update", "delete"]
    }
  }'
\`\`\`

### Filter Options
| Field | Type | Example |
|-------|------|---------|
| actor | string/array | \`"john@company.com"\` |
| action | string/array | \`["config.change", "user.create"]\` |
| resourceType | string | \`"dashboard"\`, \`"alert_rule"\` |
| result | string | \`"success"\`, \`"failure"\` |
| severity | string | \`"critical"\`, \`"warning"\` |
| ipAddress | string | \`"192.168.1.0/24"\` |

### Export Options
\`\`\`bash
# Export as CSV
curl "https://api.telemetryflow.id/api/v2/audit/export?format=csv" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "timeFrom": "2024-01-01", "timeTo": "2024-01-31" }' \\
  -o audit-export.csv

# Export as JSON (for SIEM integration)
curl "https://api.telemetryflow.id/api/v2/audit/export?format=json" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "timeFrom": "2024-01-01", "timeTo": "2024-01-31" }' \\
  -o audit-export.json
\`\`\`

### SIEM Integration
| SIEM | Method | Format | Status |
|------|--------|--------|--------|
| Splunk | HEC webhook | JSON | ✅ Supported |
| Elasticsearch | Direct push | JSON | ✅ Supported |
| Datadog | API push | JSON | ✅ Supported |
| S3 (archive) | Scheduled export | Parquet | ✅ Supported |

### Audit Log Retention
- **ClickHouse:** 90 days (hot storage)
- **S3 Archive:** 365 days (cold storage)
- **GDPR tenants:** 730 days (compliance requirement)`,
  },
];

export const AUDIT_CONVERSATION_TITLES: string[] = [
  "Recent audit log review",
  "Configuration change investigation",
  "Compliance audit report",
  "Data access trail analysis",
  "Audit event pattern analysis",
  "Suspicious login attempt investigation",
  "Failed operation root cause analysis",
  "High-risk configuration change review",
  "Data access anomaly detection",
  "Audit log export for SIEM integration",
];
