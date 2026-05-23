/**
 * System Sub-Context Mock Data for LLM AI Insights
 * Covers: system-setup, system-channels, ai-assistant
 */

export interface MockQA {
  question: string;
  answer: string;
}

// ==================== SYSTEM SETUP CONTEXT ====================

export const SYSTEM_SETUP_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the current platform configuration",
    answer: `## Platform Configuration Overview

### General Settings
| Setting | Value | Status |
|---------|-------|--------|
| Platform Name | TelemetryFlow | ✅ |
| Base URL | https://app.telemetryflow.id | ✅ |
| API Endpoint | https://api.telemetryflow.id | ✅ |
| Environment | Production | ✅ |
| Version | 2.4.1 | ✅ Latest |
| Multi-tenancy | Enabled | ✅ |
| Debug Mode | Disabled | ✅ |

### Authentication
| Setting | Value |
|---------|-------|
| JWT Expiry | 15 minutes (access), 7 days (refresh) |
| MFA Support | TOTP, WebAuthn, SMS (deprecated) |
| SSO | SAML 2.0, OIDC — Enabled |
| Password Policy | Min 12 chars, 1 upper, 1 symbol |
| Max Failed Logins | 5 (then lockout) |
| Session Idle Timeout | 60 minutes |

### Database
| Database | Host | Pool | Status |
|---------|------|------|--------|
| PostgreSQL 16 | pg-primary.internal | 50 connections | ✅ Healthy |
| ClickHouse 24.3 | ch1-3.internal (cluster) | 100 connections | ✅ Healthy |
| Redis 7.2 | redis.internal | DB 0 (cache), DB 1 (queue) | ✅ Healthy |

### Queue & Messaging
| Service | Status | Workers | Pending Jobs |
|---------|--------|---------|-------------|
| BullMQ (Redis) | ✅ Running | 12 | 3 |
| NATS | ✅ Running | — | 0 |

### Performance
| Metric | Value | Target |
|--------|-------|--------|
| API P99 Latency | 145ms | <200ms ✅ |
| Cache Hit Rate | 89% | >85% ✅ |
| Ingestion Throughput | 360K events/s | 500K capacity |`,
  },
  {
    question: "How do I configure SMTP for email notifications?",
    answer: `## SMTP Configuration Guide

### Configure via UI
1. Navigate to **System → Setup**
2. Scroll to **Email / SMTP Settings**
3. Fill in SMTP server details
4. Click **Test Connection** to verify
5. Save settings

### Configure via Environment Variables
\`\`\`env
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@company.com
SMTP_PASS=your-smtp-password
SMTP_FROM="TelemetryFlow <noreply@company.com>"
\`\`\`

### Common SMTP Providers
| Provider | Host | Port | Auth |
|---------|------|------|------|
| AWS SES | email-smtp.us-east-1.amazonaws.com | 587 | SMTP + IAM |
| SendGrid | smtp.sendgrid.net | 587 | API key |
| Mailgun | smtp.mailgun.org | 587 | SMTP credentials |
| Google Workspace | smtp.gmail.com | 587 | OAuth2 / App password |
| Office 365 | smtp.office365.com | 587 | Modern auth |

### Test SMTP
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/smtp/test \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "email": "test@company.com" }'
\`\`\`

### Troubleshooting
| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Connection refused | Wrong host/port | Verify SMTP_HOST and SMTP_PORT |
| Auth failed | Wrong credentials | Check SMTP_USER and SMTP_PASS |
| Emails in spam | Missing SPF/DKIM | Configure DNS records |
| Timeout | Firewall blocking | Open port 587 outbound |`,
  },
  {
    question: "What are the recommended production settings for TelemetryFlow?",
    answer: `## Production Configuration Best Practices

### Security Hardening
| Setting | Recommended Value | Current |
|---------|------------------|---------|
| JWT Secret | ≥64-char random string | ✅ Configured |
| HTTPS only | Enforced | ✅ |
| CORS origins | Explicit whitelist | ✅ |
| Rate limiting | Enabled (100 req/min per IP) | ✅ |
| MFA enforcement | Required for admins | ⚠️ Optional currently |
| API key rotation | 90-day policy | ⚠️ Not enforced |

### Performance Tuning
| Setting | Recommended | Notes |
|---------|-------------|-------|
| PostgreSQL pool | 50 connections | 1 per CPU core × 5 |
| ClickHouse pool | 100 connections | Shared across workers |
| Cache TTL (L1) | 60 seconds | In-memory |
| Cache TTL (L2) | 1800 seconds | Redis |
| Ingestion workers | 10 per queue | Scale with load |
| BullMQ concurrency | 10 (ingestion) | Adjust per resource |

### Observability
| Setting | Recommended | Status |
|---------|-------------|--------|
| Application logging | INFO level (not DEBUG) | ✅ |
| OTEL self-monitoring | Enabled | ⚠️ Not configured |
| Alerting on errors | Enabled | ✅ |
| Backup schedule | Daily snapshots | ✅ |
| Backup retention | 30 days | ✅ |

### Recommended Actions
1. **Enforce MFA for all admins** — currently optional
2. **Enable API key rotation policy** — reduce security risk
3. **Configure self-monitoring** via OTEL to track platform health
4. **Enable log aggregation** for all platform services
5. **Set up PagerDuty/OpsGenie** integration for critical alerts`,
  },
  {
    question: "How do I access and navigate the admin panel?",
    answer: `## Admin Panel Overview

### Access
- Navigate to **System → Admin Panel** (requires Org Admin or Super Admin role)
- Direct URL: \`https://app.telemetryflow.id/admin\`

### Admin Panel Sections
| Section | Description | Access Level |
|---------|-------------|-------------|
| Setup | Platform-wide settings (SMTP, auth, URLs) | Org Admin |
| Notification Channels | Configure alert delivery channels | Org Admin |
| API Keys | Manage platform and personal API keys | Org Admin |
| Users & Roles | IAM — users, roles, permissions | Org Admin |
| Tenancy | Organizations, workspaces, subscription tiers | Super Admin |
| Audit Logs | Security and activity logs | Org Admin |
| AI Assistant | LLM providers and usage | Org Admin |
| Maintenance | Enable/disable maintenance mode | Super Admin |
| System Health | Live infrastructure health dashboard | Org Admin |

### Admin Quick Actions
| Action | Location |
|--------|----------|
| Invite a new user | System → Users → Invite |
| Reset a user password | System → Users → [User] → Reset |
| View pending alerts | System → Health → Alerts |
| Check queue backlog | System → Health → Queues |
| Rotate a platform API key | System → API Keys → Rotate |

### Role Requirements
\`\`\`
Super Admin  → All sections including Tenancy and Maintenance
Org Admin    → All sections except Tenancy
Workspace Admin → Workspace-scoped views only (no System access)
\`\`\``,
  },
  {
    question: "How do I backup and restore the platform configuration?",
    answer: `## Backup & Restore Configuration

### What Is Backed Up
| Component | Backup Method | Frequency |
|-----------|--------------|-----------|
| PostgreSQL (config, entities) | pg_dump snapshot | Daily 02:00 UTC |
| ClickHouse (time-series) | ClickHouse backup | Daily 03:00 UTC |
| Redis (queue state) | RDB + AOF | Continuous |
| Platform settings (JSON) | Config export API | On demand |
| Environment variables | Secret manager | Versioned |

### Export Platform Config
\`\`\`bash
curl -X GET https://api.telemetryflow.id/api/v2/admin/config/export \\
  -H "Authorization: Bearer $TOKEN" \\
  -o platform-config-backup.json
\`\`\`

### Import / Restore Config
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/admin/config/import \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @platform-config-backup.json
\`\`\`

### Database Backup (Manual)
\`\`\`bash
# PostgreSQL
pg_dump -h pg-primary.internal -U telemetryflow telemetryflow_db \\
  -Fc -f backup-$(date +%Y%m%d).dump

# ClickHouse
clickhouse-client --host ch1.internal --query \\
  "BACKUP DATABASE telemetryflow_db TO Disk('backups', 'ch-backup-$(date +%Y%m%d).zip')"
\`\`\`

### Restore Checklist
1. Stop ingestion workers (pause BullMQ queues)
2. Restore PostgreSQL from dump
3. Restore ClickHouse backup
4. Run migration runner to apply any missing migrations
5. Re-import platform config JSON
6. Restart all services
7. Verify health dashboard`,
  },
  {
    question: "How do I manage environment variables for the platform?",
    answer: `## Environment Variable Management

### Core Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| \`DATABASE_URL\` | PostgreSQL connection string | \`postgresql://user:pass@pg:5432/db\` |
| \`CLICKHOUSE_HOST\` | ClickHouse server host | \`ch1.internal\` |
| \`CLICKHOUSE_DB\` | ClickHouse database name | \`telemetryflow_db\` |
| \`REDIS_URL\` | Redis connection string | \`redis://redis.internal:6379\` |
| \`NATS_URL\` | NATS server URL | \`nats://nats.internal:4222\` |
| \`JWT_SECRET\` | JWT signing secret (≥64 chars) | (random string) |
| \`JWT_EXPIRY\` | Access token TTL | \`15m\` |
| \`APP_BASE_URL\` | Platform base URL | \`https://app.telemetryflow.id\` |
| \`API_BASE_URL\` | API base URL | \`https://api.telemetryflow.id\` |
| \`NODE_ENV\` | Runtime environment | \`production\` |

### LLM / AI Variables
| Variable | Description |
|----------|-------------|
| \`OPENAI_API_KEY\` | OpenAI API key |
| \`ANTHROPIC_API_KEY\` | Anthropic API key |
| \`GOOGLE_AI_API_KEY\` | Google Gemini API key |
| \`OLLAMA_BASE_URL\` | Ollama local server URL |

### Managing Variables in Production
\`\`\`bash
# Kubernetes secret update
kubectl create secret generic telemetryflow-secrets \\
  --from-env-file=.env \\
  --namespace=telemetryflow \\
  --dry-run=client -o yaml | kubectl apply -f -

# Docker Compose
docker compose --env-file .env.production up -d
\`\`\`

### Best Practices
1. Never commit \`.env\` files — use a secrets manager (Vault, AWS SSM, K8s Secrets)
2. Rotate \`JWT_SECRET\` triggers forced logout of all users — plan accordingly
3. \`CLICKHOUSE_DB\` must match the database created during migrations
4. Use separate \`.env\` files per environment: \`.env.production\`, \`.env.staging\``,
  },
  {
    question: "How do I enable and manage maintenance mode?",
    answer: `## Maintenance Mode

### What Maintenance Mode Does
- Returns **HTTP 503** with a maintenance page for all UI requests
- API returns \`{"code": "MAINTENANCE", "message": "Platform under maintenance"}\`
- Background workers (BullMQ, NATS) continue processing
- Ingestion endpoints remain active (to avoid data loss)
- Admin panel accessible at \`/admin\` bypass URL

### Enable Maintenance Mode
#### Via UI
1. Navigate to **System → Maintenance**
2. Set **Message**: e.g., "Scheduled maintenance — back in 2 hours"
3. Set **Estimated End**: (optional) displayed to users
4. Toggle **Enable Maintenance Mode**
5. Click **Confirm** — takes effect within 30 seconds

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/admin/maintenance \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "enabled": true,
    "message": "Scheduled database migration — back in 1 hour",
    "estimatedEnd": "2026-03-01T12:00:00Z",
    "allowedIPs": ["10.0.0.0/8", "203.0.113.10"]
  }'
\`\`\`

### Disable Maintenance Mode
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/admin/maintenance \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "enabled": false }'
\`\`\`

### Maintenance Checklist
| Step | Action |
|------|--------|
| 1 | Notify users 24h in advance via platform banner |
| 2 | Enable maintenance mode |
| 3 | Pause BullMQ ingestion queues |
| 4 | Perform migration / upgrade |
| 5 | Verify all services healthy |
| 6 | Disable maintenance mode |
| 7 | Post completion notice |`,
  },
  {
    question: "How do I run a system health check?",
    answer: `## System Health Check

### Health Dashboard
Navigate to **System → Health** for the live health overview.

### Current System Status
| Service | Status | Latency | Uptime |
|---------|--------|---------|--------|
| API Gateway | ✅ Healthy | 12ms | 99.97% |
| PostgreSQL | ✅ Healthy | 3ms | 99.99% |
| ClickHouse | ✅ Healthy | 8ms | 99.98% |
| Redis (cache) | ✅ Healthy | 1ms | 99.99% |
| BullMQ Workers | ✅ Healthy | — | 99.95% |
| NATS Messaging | ✅ Healthy | 2ms | 99.99% |
| Ollama (local LLM) | ⚠️ Degraded | 8.5s | 98.1% |

### Health Check API
\`\`\`bash
# Overall health (public — no auth required)
curl https://api.telemetryflow.id/api/v2/health

# Detailed health (requires auth)
curl https://api.telemetryflow.id/api/v2/health/details \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample Response
\`\`\`json
{
  "status": "ok",
  "timestamp": "2026-03-01T09:00:00Z",
  "services": {
    "database": { "status": "ok", "latency": 3 },
    "clickhouse": { "status": "ok", "latency": 8 },
    "redis": { "status": "ok", "latency": 1 },
    "nats": { "status": "ok", "latency": 2 },
    "queues": { "status": "ok", "pending": 3 }
  }
}
\`\`\`

### Automated Health Alerts
| Check | Threshold | Alert |
|-------|-----------|-------|
| API P99 latency | >500ms for 2m | PagerDuty Critical |
| DB connection pool | >80% used | Slack Warning |
| Queue backlog | >1000 pending | Slack Warning |
| Worker crash | Any | PagerDuty High |`,
  },
  {
    question: "How do I configure platform-level logging?",
    answer: `## Logging Configuration

### Current Logging Settings
| Setting | Value | Recommended |
|---------|-------|-------------|
| Log Level | INFO | INFO (production) |
| Format | JSON (structured) | JSON ✅ |
| Output | stdout + file | stdout ✅ |
| Rotation | Daily, 30-day retention | ✅ |
| Sensitive data masking | Enabled | ✅ |
| Request logging | Enabled (≥400ms only) | ✅ |

### Log Levels
| Level | Use Case |
|-------|----------|
| \`DEBUG\` | Development only — very verbose, never in production |
| \`INFO\` | Standard production logging |
| \`WARN\` | Potential issues worth monitoring |
| \`ERROR\` | Errors requiring attention |
| \`FATAL\` | Service-stopping errors |

### Configure Log Level
\`\`\`env
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/telemetryflow/app.log
LOG_ROTATION=daily
LOG_RETENTION_DAYS=30
\`\`\`

### Structured Log Fields
\`\`\`json
{
  "level": "info",
  "timestamp": "2026-03-01T09:14:22.345Z",
  "service": "api-gateway",
  "traceId": "abc123",
  "userId": "usr-xyz",
  "method": "POST",
  "path": "/api/v2/alerts/rules",
  "statusCode": 201,
  "durationMs": 45
}
\`\`\`

### Log Shipping (Production)
| Destination | Integration | Format |
|------------|------------|--------|
| TelemetryFlow Logs | OTEL Agent (self-monitoring) | JSON |
| Elasticsearch | Filebeat / Logstash | JSON |
| Loki | Promtail | JSON |
| CloudWatch | AWS agent | JSON |`,
  },
  {
    question: "How do I configure rate limiting for the API?",
    answer: `## Rate Limiting Configuration

### Current Rate Limits
| Endpoint Group | Limit | Window | Scope |
|---------------|-------|--------|-------|
| Authentication (/auth/*) | 10 req | 1 minute | Per IP |
| API (general) | 100 req | 1 minute | Per API key |
| OTEL ingestion (/v1/*) | 10,000 req | 1 minute | Per tenant |
| LLM chat | 50 req | 1 minute | Per user |
| Reporting | 10 req | 1 minute | Per user |
| Admin endpoints | 30 req | 1 minute | Per admin |

### Configure Rate Limits
#### Via Environment Variables
\`\`\`env
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_AUTH=10
RATE_LIMIT_INGESTION=10000
RATE_LIMIT_LLM=50
\`\`\`

#### Via API (per-tenant override)
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/admin/tenants/org-abc/rate-limits \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "apiRateLimit": 500,
    "ingestionRateLimit": 50000,
    "llmRateLimit": 200
  }'
\`\`\`

### Rate Limit Response Headers
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1740823200
Retry-After: 34
\`\`\`

### Handling 429 Too Many Requests
| Strategy | Implementation |
|----------|---------------|
| Exponential backoff | Start at 1s, double each retry, max 32s |
| Jitter | Add ±25% random to avoid thundering herd |
| Client-side caching | Cache read-only responses (metrics, dashboards) |
| Batch requests | Combine multiple small requests into one |`,
  },
];

export const SYSTEM_SETUP_CONVERSATION_TITLES: string[] = [
  "Platform configuration review",
  "SMTP and email setup",
  "Production hardening checklist",
  "Admin panel navigation guide",
  "Backup and restore configuration",
  "Environment variable management",
  "Maintenance mode setup",
  "System health check",
  "Logging configuration",
  "Rate limiting settings",
];

// ==================== SYSTEM CHANNELS CONTEXT ====================

export const SYSTEM_CHANNELS_MOCK_DATA: MockQA[] = [
  {
    question: "List all notification channels and their status",
    answer: `## Notification Channels

### Configured Channels (8)
| Channel | Type | Status | Used In | Last Delivery | Success Rate |
|---------|------|--------|---------|--------------|-------------|
| #alerts-prod | Slack | ✅ Active | 12 rules | 3m ago | 99.8% |
| #incidents | Slack | ✅ Active | 5 rules | 1h ago | 100% |
| ops-team | Email | ✅ Active | 8 rules | 15m ago | 98.5% |
| PagerDuty On-Call | PagerDuty | ✅ Active | 3 rules | 2h ago | 100% |
| sre-webhook | Webhook | ✅ Active | 4 rules | 8m ago | 97.3% |
| #devops-slack | Slack | ⚠️ Degraded | 2 rules | 6h ago | 62% ⚠️ |
| Teams-General | MS Teams | ✅ Active | 1 rule | 1d ago | 100% |
| old-pager | Webhook | 🔴 Error | 1 rule | 3d ago | 0% |

### Channel Type Distribution
| Type | Count | Active | Error |
|------|-------|--------|-------|
| Slack | 3 | 2 | 1 |
| Email | 1 | 1 | 0 |
| PagerDuty | 1 | 1 | 0 |
| Webhook | 2 | 1 | 1 |
| MS Teams | 1 | 1 | 0 |

### Issues Detected
- ⚠️ **#devops-slack** (62% success): Possible Slack token expiry or channel permissions changed
- 🔴 **old-pager** (0% success): Webhook endpoint unreachable for 3 days — should be disabled`,
  },
  {
    question: "How do I set up a Slack notification channel?",
    answer: `## Slack Notification Channel Setup

### Prerequisites
- Slack workspace admin access
- Create a **Slack App** or use an **Incoming Webhook**

### Step 1: Create Slack Webhook
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app → **Incoming Webhooks**
3. Activate Incoming Webhooks
4. Add webhook URL to your Slack channel
5. Copy the generated webhook URL

### Step 2: Add Channel in TelemetryFlow
1. Navigate to **System → Notification Channels**
2. Click **Add Channel**
3. Select type: **Slack**
4. Fill in:
   - **Name**: descriptive (e.g., "#alerts-prod")
   - **Webhook URL**: paste Slack webhook URL
   - **Channel**: #alerts-prod (optional, override default)
   - **Username**: TelemetryFlow Alerts (optional)
5. Click **Test** to send a test notification
6. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "#alerts-prod",
    "type": "slack",
    "config": {
      "webhookUrl": "https://hooks.slack.com/services/T.../B.../xxx",
      "channel": "#alerts-prod",
      "username": "TelemetryFlow",
      "iconEmoji": ":bell:"
    }
  }'
\`\`\`

### Slack Message Format
Alerts sent to Slack include:
- 🚨 Alert name and severity
- 📊 Metric value that triggered the alert
- 🔗 Link to the TelemetryFlow alert detail page
- 📝 Runbook URL (if configured in alert rule)`,
  },
  {
    question: "Which notification channels have failures?",
    answer: `## Channel Health Report

### Failing Channels
| Channel | Type | Error | Since | Affected Rules | Impact |
|---------|------|-------|-------|---------------|--------|
| old-pager | Webhook | 404 Not Found | 3d ago | 1 rule | 🔴 High — critical alert not delivered |
| #devops-slack | Slack | 401 Unauthorized | 6h ago | 2 rules | ⚠️ Medium — non-critical alerts missed |

### Delivery Failure Details

#### old-pager (Webhook)
- **Last successful**: 3 days ago
- **Error**: HTTP 404 — endpoint \`https://pager.internal/webhook/alerts\` not found
- **Likely cause**: Internal service was decommissioned or URL changed
- **Action**: Update webhook URL or disable this channel

#### #devops-slack (Slack)
- **Last successful**: 6 hours ago
- **Error**: 401 Unauthorized — Slack token rejected
- **Likely cause**: Slack app token expired or webhook revoked
- **Action**: Regenerate Slack webhook URL and update channel config

### Recommendations
| Priority | Action | Channel |
|----------|--------|---------|
| 🔴 Urgent | Disable or fix | old-pager |
| 🔴 Urgent | Regenerate webhook | #devops-slack |
| ℹ️ Low | Add fallback channel | All critical rules |

> 💡 Best practice: Configure **2 channels per critical alert rule** (primary + fallback) to prevent missed alerts.`,
  },
  {
    question: "How do I set up a webhook notification channel?",
    answer: `## Webhook Notification Channel Setup

### When to Use Webhooks
- Custom internal alerting systems
- Incident management platforms (Jira, ServiceNow, Opsgenie, Rootly)
- Home-grown runbook automation

### Create Webhook Channel
1. Navigate to **System → Notification Channels → Add Channel**
2. Select type: **Webhook**
3. Configure:
   - **Name**: e.g., "sre-incident-webhook"
   - **URL**: Your endpoint URL
   - **HTTP Method**: POST (default)
   - **Auth**: None / Bearer Token / Basic Auth / HMAC signature
   - **Headers**: custom headers (e.g., \`X-Api-Key\`)
   - **Payload Template**: custom JSON body (optional)
4. Click **Test** → verifies endpoint returns 2xx
5. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "sre-incident-webhook",
    "type": "webhook",
    "config": {
      "url": "https://incidents.company.com/api/alerts",
      "method": "POST",
      "auth": { "type": "bearer", "token": "secret-token" },
      "headers": { "X-Source": "TelemetryFlow" }
    }
  }'
\`\`\`

### Default Webhook Payload
\`\`\`json
{
  "alertName": "HighCPUUsage",
  "severity": "critical",
  "status": "firing",
  "value": 91.5,
  "threshold": 85,
  "labels": { "service": "api", "env": "production" },
  "annotations": { "summary": "CPU at 91.5%", "runbook": "https://..." },
  "firedAt": "2026-03-01T09:00:00Z",
  "resolvedAt": null,
  "dashboardURL": "https://app.telemetryflow.id/alerts/123"
}
\`\`\`

### HMAC Signature Verification
Webhooks include \`X-TF-Signature: sha256=<hmac>\` header for payload integrity verification.`,
  },
  {
    question: "How do I set up PagerDuty as a notification channel?",
    answer: `## PagerDuty Notification Channel Setup

### Prerequisites
- PagerDuty account with a Service configured
- **Integration Key** (Events API v2)

### Step 1: Get PagerDuty Integration Key
1. Log in to PagerDuty
2. Go to **Services → [Your Service] → Integrations**
3. Add Integration → select **Events API v2**
4. Copy the **Integration Key**

### Step 2: Add PagerDuty Channel in TelemetryFlow
1. Navigate to **System → Notification Channels → Add Channel**
2. Select type: **PagerDuty**
3. Configure:
   - **Name**: e.g., "PagerDuty On-Call"
   - **Integration Key**: paste key from PagerDuty
   - **Severity Mapping**: (optional) map TF severities to PD severities
4. Click **Test** → sends a test incident to PagerDuty
5. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "PagerDuty On-Call",
    "type": "pagerduty",
    "config": {
      "integrationKey": "r1d2e3f4g5h6i7j8k9l0...",
      "severityMap": {
        "critical": "critical",
        "high": "error",
        "warning": "warning",
        "info": "info"
      }
    }
  }'
\`\`\`

### PagerDuty Event Fields
| TelemetryFlow Field | PagerDuty Field |
|--------------------|----------------|
| Alert name | \`summary\` |
| Labels | \`custom_details\` |
| Dashboard URL | \`links[].href\` |
| Severity | \`severity\` |
| Fired timestamp | \`timestamp\` |

### Auto-Resolve
When a TelemetryFlow alert resolves, it automatically sends a **resolve** event to PagerDuty to close the incident.`,
  },
  {
    question: "How do I configure a Microsoft Teams notification channel?",
    answer: `## Microsoft Teams Notification Channel Setup

### Prerequisites
- Microsoft Teams admin access (to create Incoming Webhook connector)
- Target Teams channel identified

### Step 1: Create Teams Incoming Webhook
1. Open Microsoft Teams
2. Navigate to the target channel
3. Click **...** → **Connectors**
4. Search for **Incoming Webhook** → **Configure**
5. Name it "TelemetryFlow Alerts" and upload an icon (optional)
6. Click **Create**
7. Copy the generated webhook URL

### Step 2: Add MS Teams Channel in TelemetryFlow
1. Navigate to **System → Notification Channels → Add Channel**
2. Select type: **Microsoft Teams**
3. Configure:
   - **Name**: e.g., "Teams-SRE-Alerts"
   - **Webhook URL**: paste Teams webhook URL
   - **Mention users**: @oncall (optional)
4. Click **Test** → sends a test card to Teams
5. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Teams-SRE-Alerts",
    "type": "msteams",
    "config": {
      "webhookUrl": "https://company.webhook.office.com/webhookb2/..."
    }
  }'
\`\`\`

### Teams Adaptive Card Preview
Alerts appear as rich Adaptive Cards in Teams with:
- Severity badge (color-coded)
- Alert name and current value
- Labels (service, env, team)
- Action buttons: **View Dashboard**, **Acknowledge**, **Silence 1h**`,
  },
  {
    question: "How do I test a notification channel?",
    answer: `## Testing Notification Channels

### Send a Test Notification
#### Via UI
1. Navigate to **System → Notification Channels**
2. Find the channel to test
3. Click the **Test** button (lightning bolt icon)
4. A test alert payload is sent immediately
5. Check the result: ✅ Success or 🔴 Error with details

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels/ch-abc123/test \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Test Response
\`\`\`json
{
  "success": true,
  "statusCode": 200,
  "responseTime": 245,
  "message": "Test notification delivered successfully"
}
\`\`\`

### Common Test Failures
| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid token/API key | Regenerate credentials |
| 404 Not Found | Wrong endpoint URL | Verify webhook URL |
| 403 Forbidden | IP allowlist / permissions | Whitelist TF egress IPs |
| Timeout (>10s) | Endpoint too slow or unreachable | Check network/firewall |
| 422 Unprocessable | Payload format rejected | Check custom template |

### Bulk Test All Channels
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/settings/channels/test-all \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`
Returns a summary report of all channel test results.`,
  },
  {
    question: "How do I set channel priority and ordering for alert rules?",
    answer: `## Channel Priority and Ordering

### Why Priority Matters
When multiple channels are assigned to an alert rule, TelemetryFlow delivers to all channels in parallel by default. Priority controls:
- **Retry order** — highest-priority channel is retried first on failure
- **Escalation** — optional: escalate to secondary channel after N minutes

### Set Channel Priority
#### Via UI
1. Navigate to **System → Notification Channels**
2. Click **Edit** on a channel
3. Set **Priority**: 1 (highest) – 10 (lowest)
4. Save

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/settings/channels/ch-abc123 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "priority": 1 }'
\`\`\`

### Current Channel Priority Ranking
| Priority | Channel | Type | Use Case |
|----------|---------|------|---------|
| 1 | PagerDuty On-Call | PagerDuty | Critical incidents — on-call paging |
| 2 | #alerts-prod | Slack | All P1/P2 alerts — team visibility |
| 3 | ops-team | Email | Async notifications — non-urgent |
| 4 | sre-webhook | Webhook | Incident automation system |
| 5 | Teams-General | MS Teams | Cross-team visibility |

### Escalation Policy
Configure escalation so that if the primary channel fails to deliver within N minutes, the secondary channel is attempted:

\`\`\`json
{
  "escalation": {
    "enabled": true,
    "escalateAfterMinutes": 5,
    "fallbackChannelId": "ch-email-ops"
  }
}
\`\`\``,
  },
  {
    question: "How do I view the channel health dashboard?",
    answer: `## Channel Health Dashboard

### Access
Navigate to **System → Notification Channels → Health Dashboard**

### Dashboard Overview
| Metric | Value | Trend |
|--------|-------|-------|
| Total Channels | 8 | — |
| Healthy | 6 | ✅ |
| Degraded | 1 | ⚠️ |
| Error | 1 | 🔴 |
| Deliveries (24h) | 1,234 | ↗ +12% |
| Success Rate (24h) | 98.7% | ↘ -0.3% |
| Avg Delivery Time | 320ms | ✅ |

### Per-Channel Metrics (Last 7 Days)
| Channel | Deliveries | Success | Avg Latency | Errors |
|---------|-----------|---------|-------------|--------|
| #alerts-prod | 456 | 99.8% | 245ms | 1 |
| PagerDuty On-Call | 89 | 100% | 890ms | 0 |
| ops-team (Email) | 234 | 98.5% | 1.2s | 3 |
| sre-webhook | 189 | 97.3% | 310ms | 5 |
| #devops-slack | 67 | 62% | 450ms | 25 |
| old-pager | 12 | 0% | — | 12 |

### Health Check API
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/settings/channels/health \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Automated Alerts on Channel Health
Configure TelemetryFlow to alert you when a channel degrades:
- Success rate drops below **90%** → Slack warning
- Success rate reaches **0%** → PagerDuty critical
- Last successful delivery older than **1 hour** → Email warning`,
  },
  {
    question: "How do I disable a stale notification channel?",
    answer: `## Disabling Stale Notification Channels

### Identify Stale Channels
A channel is considered stale when:
- Success rate is 0% for more than 24 hours
- Last successful delivery was more than 7 days ago
- Endpoint returns consistent 4xx/5xx errors

### Current Stale Channels
| Channel | Last Success | Success Rate | Reason |
|---------|-------------|-------------|--------|
| old-pager | 3d ago | 0% | 404 Not Found |
| #devops-slack | 6h ago | 62% | 401 Unauthorized |

### Disable a Channel
#### Via UI
1. Navigate to **System → Notification Channels**
2. Find the stale channel
3. Click the toggle to **Disable**
4. Optionally click **Delete** to remove permanently
5. Confirm

#### Via API
\`\`\`bash
# Disable (soft — keeps config, stops deliveries)
curl -X PATCH https://api.telemetryflow.id/api/v2/settings/channels/ch-old-pager \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "enabled": false }'

# Delete permanently
curl -X DELETE https://api.telemetryflow.id/api/v2/settings/channels/ch-old-pager \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Impact of Disabling
| Effect | Behavior |
|--------|---------|
| Alert rules using this channel | Deliveries to this channel stop; other channels still active |
| Rules with only this channel | Alerts fire but no delivery — configure a replacement |
| Channel config | Preserved if disabled (soft), deleted if removed |

> Always assign a **replacement channel** to rules that exclusively used the stale channel before disabling.`,
  },
];

export const SYSTEM_CHANNELS_CONVERSATION_TITLES: string[] = [
  "Notification channel inventory",
  "Setup Slack channel",
  "Channel health and failures",
  "Webhook channel setup",
  "PagerDuty integration setup",
  "Microsoft Teams channel setup",
  "Test notification channels",
  "Channel priority and ordering",
  "Channel health dashboard",
  "Disable stale channels",
];

// ==================== AI ASSISTANT CONTEXT ====================

export const AI_ASSISTANT_MOCK_DATA: MockQA[] = [
  {
    question: "Show me all configured AI providers",
    answer: `## AI Provider Configuration

### Active Providers (6)
| Provider | Type | Model | Status | Default | Requests (30d) | Avg Latency |
|---------|------|-------|--------|---------|---------------|-------------|
| Claude Opus 4.6 | Anthropic | claude-opus-4-6 | ✅ Active | ✅ Yes | 1,234 | 2.1s |
| Claude Sonnet 4.6 | Anthropic | claude-sonnet-4-6 | ✅ Active | ❌ | 5,678 | 0.8s |
| GPT-4.5 | OpenAI | gpt-4.5 | ✅ Active | ❌ | 890 | 1.4s |
| Gemini 2.5 Pro | Google | gemini-2.5-pro | ✅ Active | ❌ | 234 | 1.2s |
| DeepSeek V3.2 | DeepSeek | deepseek-v3.2 | ✅ Active | ❌ | 456 | 1.8s |
| Llama 3.3 Local | Ollama | llama3.3:70b | ⚠️ Degraded | ❌ | 12 | 8.5s |

### Token Usage (Current Month)
| Provider | Input Tokens | Output Tokens | Total | Est. Cost |
|---------|-------------|--------------|-------|-----------|
| Claude Opus 4.6 | 1.2M | 456K | 1.66M | $124.50 |
| Claude Sonnet 4.6 | 4.5M | 1.8M | 6.3M | $189.00 |
| GPT-4.5 | 780K | 312K | 1.09M | $98.00 |
| Gemini 2.5 Pro | 234K | 89K | 323K | $12.40 |
| DeepSeek V3.2 | 456K | 178K | 634K | $9.50 |
| **Total** | | | **10M** | **$433.40** |

### Ollama (Local) Status
⚠️ Llama 3.3 70B is responding but with high latency (8.5s avg). GPU utilization: 94%. Consider scaling GPU resources or using a smaller model.`,
  },
  {
    question: "How do I add a new LLM provider?",
    answer: `## Adding a New LLM Provider

### Via UI
1. Navigate to **System → AI Assistant**
2. Click **Add Provider**
3. Select provider type (Anthropic, OpenAI, Google, etc.)
4. Enter:
   - **Name**: descriptive label (e.g., "Claude Haiku 4.6 — Fast")
   - **API Key**: your provider API key
   - **Model ID**: select from list or enter custom
   - **Base URL**: for Ollama or custom OpenAI-compatible providers
5. Configure model parameters:
   - Temperature (0.0–1.0, default: 0.7)
   - Max Tokens (default: 4096)
   - Top-P (default: 1.0)
6. Click **Test Connection**
7. Optionally set as **Default Provider**
8. Click **Save**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/llm/providers \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Claude Haiku 4.6 — Fast",
    "providerType": "anthropic",
    "apiKey": "sk-ant-api03-...",
    "modelId": "claude-haiku-4-5-20251001",
    "temperature": 0.5,
    "maxTokens": 2048,
    "topP": 1.0,
    "isDefault": false
  }'
\`\`\`

### Supported Providers & Models
| Provider | Base URL | Auth |
|---------|----------|------|
| Anthropic | Built-in | API Key |
| OpenAI | Built-in | API Key |
| Google Gemini | Built-in | API Key |
| DeepSeek | Built-in | API Key |
| Qwen (Alibaba) | Built-in | API Key |
| Ollama | http://localhost:11434 | None (local) |
| Custom (OpenAI-compat.) | Your URL | API Key |`,
  },
  {
    question: "What is the AI token usage and cost this month?",
    answer: `## AI Token Usage Report — March 2026

### Usage Summary
| Metric | Value | vs Last Month |
|--------|-------|--------------|
| Total Requests | 8,504 | ↗ +23% |
| Total Input Tokens | 7.2M | ↗ +18% |
| Total Output Tokens | 2.8M | ↗ +31% |
| Total Tokens | 10M | ↗ +22% |
| Estimated Cost | $433.40 | ↗ +$89.20 |

### Usage by Feature
| Feature | Requests | Tokens | Cost |
|---------|---------|--------|------|
| Chat conversations | 6,234 | 7.8M | $312 |
| Insight generation | 1,456 | 1.8M | $98 |
| Root cause analysis | 567 | 340K | $18 |
| Auto-recommendations | 247 | 60K | $5.40 |

### Daily Average
| Metric | Value |
|--------|-------|
| Requests/day | 280 |
| Tokens/day | 333K |
| Cost/day | $14.45 |

### Cost Optimization Tips
| Tip | Estimated Savings |
|-----|------------------|
| Use Sonnet instead of Opus for chat | -40% on chat cost |
| Set max_tokens to 2048 for summaries | -20% output tokens |
| Cache repeated context queries | -15% total tokens |
| Use Haiku for short classification tasks | -70% on those tasks |

> 💡 Current default is **Claude Opus 4.6** ($15/1M tokens). Switching chat to **Claude Sonnet 4.6** ($3/1M tokens) would save ~$100/month at current volume.`,
  },
  {
    question: "How do I tune model parameters for better results?",
    answer: `## Model Parameter Tuning

### Key Parameters
| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| \`temperature\` | 0.0 – 1.0 | 0.7 | Creativity vs. determinism |
| \`maxTokens\` | 1 – 8192 | 4096 | Max output length |
| \`topP\` | 0.0 – 1.0 | 1.0 | Nucleus sampling cutoff |
| \`topK\` | 1 – 100 | 40 | Top-K sampling (Gemini/Ollama) |
| \`frequencyPenalty\` | -2.0 – 2.0 | 0.0 | Penalize repeated tokens |
| \`presencePenalty\` | -2.0 – 2.0 | 0.0 | Penalize already-used tokens |

### Recommended Presets by Use Case
| Use Case | Temperature | MaxTokens | Notes |
|----------|------------|-----------|-------|
| Root cause analysis | 0.2 | 2048 | Deterministic, focused |
| Alert summarization | 0.3 | 512 | Brief, factual |
| Chat Q&A | 0.7 | 4096 | Balanced creativity |
| Custom prompt templates | 0.5 | 2048 | Moderate creativity |
| Code generation | 0.1 | 4096 | High determinism |

### Update Parameters via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/llm/providers/prov-abc123 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "temperature": 0.3,
    "maxTokens": 2048,
    "topP": 0.95,
    "frequencyPenalty": 0.2
  }'
\`\`\`

### Impact of Temperature
\`\`\`
0.0  → Fully deterministic (same input = same output always)
0.3  → Low creativity — good for factual/technical tasks
0.7  → Balanced — good for conversational AI
1.0  → Maximum creativity — may hallucinate more
\`\`\``,
  },
  {
    question: "How do I set the default LLM model for the platform?",
    answer: `## Setting the Default LLM Model

### What the Default Model Controls
- AI chat conversations (when no model is explicitly selected)
- Insight generation (alert analysis, anomaly explanations)
- Root cause analysis suggestions
- Auto-recommendation engine

### Current Default
| Provider | Model | Status |
|---------|-------|--------|
| Anthropic | Claude Opus 4.6 (\`claude-opus-4-6\`) | ✅ Default |

### Change Default Model
#### Via UI
1. Navigate to **System → AI Assistant → Providers**
2. Find the model you want to set as default
3. Click **Set as Default**
4. Confirm — takes effect immediately for new sessions

#### Via API
\`\`\`bash
# First, get the provider ID
curl https://api.telemetryflow.id/api/v2/llm/providers \\
  -H "Authorization: Bearer $TOKEN"

# Set as default
curl -X PATCH https://api.telemetryflow.id/api/v2/llm/providers/prov-claude-sonnet \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "isDefault": true }'
\`\`\`

### Recommended Default by Workload
| Workload | Recommended Default | Reason |
|----------|--------------------|----- --|
| High-volume SRE platform | Claude Sonnet 4.6 | Best speed/cost/quality balance |
| Premium enterprise tier | Claude Opus 4.6 | Highest quality for complex analysis |
| Cost-constrained | DeepSeek V3.2 | Very low cost, good for simple tasks |
| Privacy-first (on-prem) | Ollama (Llama 3.3 70B) | No data leaves infrastructure |

> Only one provider can be marked as default at a time. Changing the default does not affect in-progress conversations.`,
  },
  {
    question: "How do I manage API keys for LLM providers?",
    answer: `## LLM Provider API Key Management

### Current API Key Status
| Provider | Key Status | Last Rotated | Expires |
|---------|-----------|-------------|---------|
| Anthropic | ✅ Active | 45d ago | Never (org key) |
| OpenAI | ✅ Active | 32d ago | Never (org key) |
| Google Gemini | ✅ Active | 10d ago | Never (org key) |
| DeepSeek | ✅ Active | 5d ago | Never (org key) |
| Ollama | N/A | — | N/A (local) |

### Rotate an API Key
#### Via UI
1. Navigate to **System → AI Assistant → Providers**
2. Click **Edit** on the provider
3. Click **Rotate API Key**
4. Enter the new API key from your provider dashboard
5. Click **Test** to verify
6. Click **Save** — old key is immediately invalidated

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/llm/providers/prov-anthropic \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "apiKey": "sk-ant-api03-new-key-here" }'
\`\`\`

### Security Best Practices
| Practice | Detail |
|----------|--------|
| Rotate keys every 90 days | Reduces exposure window |
| Use project-scoped keys | Limit key to TelemetryFlow usage only |
| Set spending limits | Cap monthly spend at provider dashboard |
| Monitor for anomalous usage | Alert if token usage spikes >3x |
| Never log full API keys | Keys are masked after storage |

### Where Keys Are Stored
API keys are encrypted at rest using AES-256 and stored in the database. Keys are never returned in full after saving — only the last 4 characters are shown.`,
  },
  {
    question: "How do I view LLM request logs?",
    answer: `## LLM Request Logs

### Access
Navigate to **System → AI Assistant → Request Logs**

### Recent Requests (Last 1 Hour)
| Time | User | Provider | Model | Tokens (In/Out) | Latency | Status |
|------|------|---------|-------|-----------------|---------|--------|
| 09:14:22 | alex.johnson | Anthropic | claude-sonnet-4-6 | 1,234 / 456 | 820ms | ✅ |
| 09:13:45 | mike.sre | OpenAI | gpt-4.5 | 890 / 321 | 1.4s | ✅ |
| 09:12:10 | system | Anthropic | claude-opus-4-6 | 2,100 / 890 | 2.1s | ✅ |
| 09:10:33 | sarah.devops | Anthropic | claude-sonnet-4-6 | 567 / 234 | 750ms | ✅ |
| 09:05:18 | system | Ollama | llama3.3:70b | 345 / 120 | 9.2s | ⚠️ Slow |

### Query Logs via API
\`\`\`bash
# All LLM requests (paginated)
curl "https://api.telemetryflow.id/api/v2/llm/logs?limit=50&provider=anthropic" \\
  -H "Authorization: Bearer $TOKEN"

# Filter by user
curl "https://api.telemetryflow.id/api/v2/llm/logs?userId=usr-alex&from=2026-03-01" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Log Fields
| Field | Description |
|-------|-------------|
| \`requestId\` | Unique request identifier |
| \`userId\` | User who initiated the request |
| \`feature\` | chat / insight / rca / recommendation |
| \`provider\` | LLM provider name |
| \`model\` | Model ID used |
| \`inputTokens\` | Tokens in the prompt |
| \`outputTokens\` | Tokens in the response |
| \`latencyMs\` | End-to-end latency |
| \`status\` | success / error / timeout |
| \`errorMessage\` | Error detail (if failed) |

> Logs are retained for **90 days**. Sensitive prompt content is not logged — only metadata.`,
  },
  {
    question: "How do I configure streaming for LLM responses?",
    answer: `## LLM Response Streaming Configuration

### What Streaming Does
- Responses are delivered token-by-token as they are generated
- Users see text appearing progressively (like ChatGPT)
- Reduces perceived latency significantly for long responses

### Current Streaming Settings
| Setting | Value |
|---------|-------|
| Streaming enabled | ✅ Yes (global default) |
| SSE endpoint | \`/api/v2/llm/chat/stream\` |
| Timeout per stream | 120 seconds |
| Buffer flush interval | 50ms |
| Fallback to non-streaming | ✅ On error |

### Enable/Disable Streaming
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/llm/settings \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "streamingEnabled": true }'
\`\`\`

### Client-Side Streaming (SSE)
\`\`\`javascript
const response = await fetch('/api/v2/llm/chat/stream', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${token}\` },
  body: JSON.stringify({ message: 'Explain this alert spike' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE: "data: {token}\n\n"
  console.log(chunk);
}
\`\`\`

### Provider Streaming Support
| Provider | Streaming | Notes |
|---------|-----------|-------|
| Anthropic | ✅ Full | SSE native |
| OpenAI | ✅ Full | SSE native |
| Google Gemini | ✅ Full | SSE native |
| DeepSeek | ✅ Full | OpenAI-compatible |
| Ollama | ✅ Full | JSON streaming |`,
  },
  {
    question: "How do I configure conversation history retention for AI chat?",
    answer: `## Conversation History Retention

### Current Settings
| Setting | Value |
|---------|-------|
| Conversation history retention | 90 days |
| Max messages per conversation | 200 |
| Max context window (injected history) | Last 20 messages |
| Store user messages | ✅ Yes |
| Store AI responses | ✅ Yes |
| Store system prompts | ❌ No (security) |

### Configure Retention
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/llm/settings \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "conversationRetentionDays": 90,
    "maxMessagesPerConversation": 200,
    "contextWindowMessages": 20
  }'
\`\`\`

### Per-User Retention Override
Users can delete their own conversation history:
\`\`\`bash
# Delete specific conversation
curl -X DELETE https://api.telemetryflow.id/api/v2/llm/conversations/conv-abc123 \\
  -H "Authorization: Bearer $TOKEN"

# Delete all conversations for current user
curl -X DELETE https://api.telemetryflow.id/api/v2/llm/conversations \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Data Residency Notes
| Data Type | Storage | Retention | Encrypted |
|-----------|---------|-----------|-----------|
| Conversation messages | PostgreSQL | 90 days | ✅ AES-256 |
| Token usage per request | PostgreSQL | 1 year | ✅ |
| LLM request logs | PostgreSQL | 90 days | ✅ |
| Prompt content | Never logged | N/A | N/A |

> Conversation data is **never sent to LLM providers** as training data. All providers are configured in **no-training mode**.`,
  },
  {
    question: "How do I set up LLM cost alerts to avoid budget overruns?",
    answer: `## LLM Cost Alerts Setup

### Why Cost Alerts Matter
LLM usage can spike unexpectedly — a single runaway loop or misconfigured automation can generate thousands of requests and hundreds of dollars in charges within hours.

### Configure Cost Alert Thresholds
#### Via UI
1. Navigate to **System → AI Assistant → Cost Alerts**
2. Set **Daily Budget Limit**: e.g., $50/day
3. Set **Monthly Budget Limit**: e.g., $600/month
4. Set **Alert at**: 70%, 90%, 100% of budget
5. Set **Notification Channel**: Slack #alerts-prod
6. Optionally enable **Auto-disable LLM** when budget is reached
7. Click **Save**

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/llm/cost-alerts \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "dailyLimitUsd": 50,
    "monthlyLimitUsd": 600,
    "alertThresholds": [70, 90, 100],
    "notificationChannelId": "ch-slack-alerts",
    "autoDisableOnBudgetReached": false
  }'
\`\`\`

### Current Month Budget Status
| Metric | Value | Budget | % Used |
|--------|-------|--------|--------|
| Daily spend (today) | $14.45 | $50/day | 28.9% ✅ |
| Monthly spend | $433.40 | $600/month | 72.2% ⚠️ |
| Projected month-end | $578 | $600 | 96.3% ⚠️ |

### Cost Alert Notification Example
\`\`\`
[TelemetryFlow] LLM Budget Alert — 90% reached
Monthly spend: $540 / $600 (90%)
Projected end-of-month: $612 (over budget)
Top spender: Claude Opus 4.6 — $320 (59%)
Recommendation: Switch chat to Claude Sonnet 4.6
\`\`\``,
  },
];

export const AI_ASSISTANT_CONVERSATION_TITLES: string[] = [
  "AI provider overview",
  "Add new LLM provider",
  "Token usage and cost analysis",
  "Model parameter tuning",
  "Default LLM model selection",
  "LLM provider API key management",
  "LLM request logs",
  "Streaming configuration",
  "Conversation history retention",
  "LLM cost alerts setup",
];

// ==================== DATA MASKING CONTEXT ====================

export const DATA_MASKING_MOCK_DATA: MockQA[] = [
  {
    question: "What PII fields are currently being detected and masked?",
    answer: `## PII Detection & Masking Coverage

### Active Masking Rules
| Field Type | Pattern | Action | Coverage |
|------------|---------|--------|----------|
| Email | RFC 5321 regex | Partial mask (u***@domain.com) | 100% |
| Phone | E.164 format | Full mask (***-***-****) | 100% |
| Credit Card | Luhn algorithm | Partial (****-****-****-1234) | 100% |
| SSN / TaxID | XXX-XX-XXXX | Full mask | 100% |
| IP Address | IPv4/v6 regex | Partial (192.168.x.x) | 100% |
| Name (ML) | NER model | Tokenize | 94% |
| Address | NER model | Hash | 91% |
| Passport No | Country regex | Full mask | 87% |

### Masking Coverage by Data Source
| Source | Fields Scanned | PII Detected | Masked | Miss Rate |
|--------|---------------|-------------|--------|-----------|
| Application Logs | 23M/day | 1.2M | 1.2M | 0.0% |
| API Request Bodies | 5.6M/day | 234K | 231K | 1.3% |
| Database Queries | 890K/day | 45K | 45K | 0.0% |
| Error Traces | 2.3M/day | 12K | 11.8K | 1.7% |

### Coverage Gaps
- API Request Bodies: 3,000 unmasked PII/day — JSON nested paths not covered
- Error Traces: 200 unmasked — stack traces containing user data

### Recommendations
1. Add JSON path rule for \`body.user.email\` in API traces
2. Enable deep stack trace scanning for error telemetry`,
  },
  {
    question: "Are there any PII leaks in recent logs?",
    answer: `## PII Leak Detection Report (Last 24h)

### Leak Summary
| Severity | Count | Status |
|----------|-------|--------|
| Critical (unmasked in storage) | 3 | 🚨 Needs action |
| High (transmitted unmasked) | 12 | ⚠️ Review |
| Medium (partially masked) | 45 | Monitoring |
| Low (masked in transit) | 234 | ✅ OK |

### Critical Leaks
\`\`\`
[14:23:45] service: checkout-svc
Log: "Payment failed for user john.doe@example.com, card 4532-1234-5678-9012"
Status: Stored UNMASKED in ClickHouse logs table
Action: Quarantine record + retro-mask + review rule
\`\`\`

\`\`\`
[09:15:22] service: user-registration
Log: "New user registered: Jane Smith, DOB: 1990-04-15, SSN: 123-45-6789"
Status: Stored UNMASKED in error logs
Action: Immediate deletion + rule update
\`\`\`

### Root Cause
Both leaks come from \`logger.error(JSON.stringify(request.body))\` without sanitization.

### Immediate Actions
1. Quarantine 3 affected log entries
2. Add input sanitizer to checkout-svc and user-registration
3. Update masking rule to catch \`DOB\` patterns`,
  },
  {
    question: "Show data masking rules configuration",
    answer: `## Data Masking Rules

### Rule Library (24 Active Rules)
| Rule ID | Type | Trigger | Action | Scope |
|---------|------|---------|--------|-------|
| DM-001 | Email | Regex | Partial | Logs, Traces |
| DM-002 | Phone | E.164 | Partial | Logs, Metrics labels |
| DM-003 | Credit Card | Luhn | Last-4 | Logs, Traces |
| DM-004 | SSN | Regex | Hash | Logs |
| DM-005 | IP Address | Regex | Partial | Logs, Metrics |
| DM-006 | JWT Token | Prefix | Truncate | Logs |
| DM-007 | API Key | Pattern | Hint-only | Logs, Traces |
| DM-008 | Password | Field name | Redact | Logs, Traces |
| DM-009 | Auth Header | HTTP header | Redact | Traces |
| DM-010 | Name (NER) | ML model | Tokenize | Logs |

### Rule Performance
| Rule | Matches/day | False Positive Rate | Latency Impact |
|------|-------------|--------------------|-----------------|
| DM-001 (Email) | 1,234,567 | 0.01% | +0.2ms |
| DM-003 (CC) | 234,567 | 0.00% | +0.1ms |
| DM-010 (Name NER) | 89,234 | 6.2% | +2.1ms |

### DM-010 False Positive Examples
- "timeout" → matched as name token (common word collision)
- "python-requests" → matched as name

### Recommendations
1. Tune NER model threshold from 0.7 to 0.85 to reduce false positives
2. Add whitelist for common technical terms
3. Split DM-010 into separate rules for first/last names`,
  },
  {
    question: "What is the compliance status for GDPR and PCI-DSS?",
    answer: `## Compliance Status Report

### GDPR Compliance
| Requirement | Status | Evidence | Next Review |
|-------------|--------|---------|-------------|
| Right to erasure | ✅ Implemented | Deletion API, audit trail | 2026-06-01 |
| Data minimization | ⚠️ Partial | 3 logs sources log excess fields | 2026-04-01 |
| Masking in transit | ✅ Passing | TLS + field-level masking | 2026-06-01 |
| Masking at rest | ✅ Passing | AES-256, column encryption | 2026-06-01 |
| Consent logging | ✅ Implemented | Audit trail for consent events | 2026-06-01 |
| DPA with sub-processors | ⚠️ 2 missing | AWS, GCP signed; Azure pending | 2026-03-31 |

### PCI-DSS Requirements
| Requirement | Control | Status |
|-------------|---------|--------|
| Req 3.4 (PAN masking) | Credit card rule DM-003 | ✅ Passing |
| Req 10.5 (Audit logs) | Immutable audit trail | ✅ Passing |
| Req 6.4 (Test data) | Staging anonymizer | ⚠️ Not configured |
| Req 11.5 (Change detection) | File integrity monitoring | ✅ Passing |

### Open Action Items
1. Configure staging data anonymizer for PCI-DSS Req 6.4 (due: 2026-03-31)
2. Sign DPA with Azure (due: 2026-03-31)
3. Reduce excess logging in 3 log sources`,
  },
  {
    question: "How does PII masking impact query performance?",
    answer: `## PII Masking Performance Impact

### Latency Overhead by Pipeline Stage
| Stage | Without Masking | With Masking | Overhead |
|-------|-----------------|--------------|----------|
| Log ingestion | 2.3ms/event | 2.8ms/event | +22% |
| API trace ingestion | 4.1ms/span | 5.2ms/span | +27% |
| Query (masked field) | 12ms | 18ms | +50% |
| Export/report | 234ms | 287ms | +23% |

### NER Model Impact
The ML-based name detection (DM-010) is the most expensive:
- CPU: +0.8 cores at peak (23,000 events/s)
- Latency: +2.1ms per event
- Can be batched: Yes (batch size 500 → 0.4ms/event)

### Throughput Under Masking Load
| Events/s | CPU Used | Latency p99 | Status |
|----------|----------|-------------|--------|
| 10,000 | 2.1 cores | 5.2ms | ✅ OK |
| 23,000 | 4.8 cores | 5.2ms | ✅ OK |
| 50,000 | 9.6 cores | 8.9ms | ⚠️ Near limit |
| 100,000 | 18+ cores | 15ms | 🚨 Scale needed |

### Recommendations
1. Enable batch NER processing (reduce overhead by 80%)
2. Pre-compile regex patterns (current: compiled per event)
3. Add masking worker scaling rule at 45,000 events/s`,
  },
  {
    question: "Show data masking audit trail for the last 7 days",
    answer: `## Data Masking Audit Trail (Last 7 Days)

### Summary
| Activity | Count |
|----------|-------|
| Masking rules created | 2 |
| Masking rules modified | 5 |
| Masking rules disabled | 1 |
| Manual un-mask requests | 3 |
| PII leaks detected | 3 |
| PII leaks remediated | 3 |
| Compliance reports generated | 7 |

### Rule Change History
| Date | Rule | Action | Changed By | Reason |
|------|------|--------|-----------|--------|
| 2026-03-13 | DM-010 | Modified threshold 0.7→0.85 | admin@tf.id | Reduce false positives |
| 2026-03-12 | DM-024 | Created (Passport regex) | admin@tf.id | GDPR expansion |
| 2026-03-11 | DM-015 | Disabled | ops@tf.id | Conflicting with DM-010 |
| 2026-03-10 | DM-003 | Modified scope | admin@tf.id | Add metrics labels scope |

### Un-mask Requests
| Date | Requestor | Justification | Approved By | Record |
|------|-----------|---------------|------------|--------|
| 2026-03-13 | legal@tf.id | Legal hold investigation | ciso@tf.id | conv-abc123 |
| 2026-03-11 | support@tf.id | Customer complaint resolution | ciso@tf.id | log-def456 |
| 2026-03-09 | legal@tf.id | Court order compliance | ciso@tf.id | trace-ghi789 |

### Recommendations
1. Implement 4-eyes approval for un-mask requests
2. Alert CISO when >2 un-mask requests in 24h`,
  },
  {
    question: "What data fields should be masked but aren't?",
    answer: `## Masking Gap Analysis

### Unprotected PII Fields Detected
| Field | Source | Exposure Risk | Volume/day | Priority |
|-------|--------|---------------|-----------|----------|
| \`body.shipping.address\` | API traces | High | 45,000 | P1 |
| \`user.birthdate\` | User service logs | High | 12,000 | P1 |
| \`metadata.customer_id\` | Metrics labels | Medium | 890,000 | P2 |
| \`event.agent_ip\` | Browser events | Low | 234,000 | P3 |
| \`device.fingerprint\` | Auth logs | Medium | 67,000 | P2 |

### Detection Method
- Static analysis: JSON path scanning across 7-day log sample
- ML scan: NER model detected potential PII patterns

### Quick Wins (Low Effort, High Impact)
1. **P1: shipping.address** — add DM-025 JSON path rule (1hr effort)
2. **P1: user.birthdate** — add DOB regex rule (30min effort)
3. **P2: customer_id** — add metric label masking rule (2hr effort)

### Estimated Risk Reduction
Implementing P1 rules reduces unmasked PII by **64%** immediately.

### Compliance Note
Unmasked \`shipping.address\` violates GDPR Article 25 (Data by Design & Default).
Recommend immediate action before next GDPR audit.`,
  },
  {
    question: "How is masking applied to Kubernetes pod logs?",
    answer: `## Kubernetes Pod Log Masking

### Masking Pipeline for Pod Logs
\`\`\`
[Pod stdout/stderr]
    ↓
[Fluent Bit sidecar] — collects log lines
    ↓
[Masking Processor] — applies DM rules at collection time
    ↓
[OTLP exporter] → TelemetryFlow collector
    ↓
[ClickHouse storage] — only masked data stored
\`\`\`

### Coverage by Namespace
| Namespace | Masking Enabled | Rules Applied | Last Audit |
|-----------|----------------|--------------|-----------|
| production | ✅ Yes | 24 rules | Today |
| staging | ✅ Yes | 24 rules | Today |
| monitoring | ✅ Yes | 15 rules | Today |
| kube-system | ⚠️ Partial | 8 rules | 7 days ago |
| testing | ❌ No | None | Never |

### Issues
- **testing namespace**: No masking — OK if no real PII, but risky
- **kube-system**: Missing PAN and SSN rules — low risk but incomplete

### Recommendations
1. Apply full rule set to kube-system namespace
2. Add policy to block real PII from reaching testing namespace
3. Audit testing pods for any real-data usage`,
  },
  {
    question: "Explain data masking for metrics labels",
    answer: `## Metrics Label Masking

### Why Metrics Labels Need Masking
Prometheus/OTEL metrics can embed PII in labels:
\`\`\`
http_requests_total{
  method="POST",
  path="/api/orders",
  user_email="john@example.com",  ← PII leak!
  customer_id="CUST-12345",       ← Identifier
  status="200"
}
\`\`\`

### Current Label Masking Rules
| Label | Rule | Action | Applied To |
|-------|------|--------|-----------|
| user_email | DM-001 | Remove label | All metrics |
| customer_id | DM-023 | Hash(SHA-256) | All metrics |
| user_id | DM-022 | Hash(SHA-256) | All metrics |
| ip_address | DM-005 | Partial mask | All metrics |

### High-Cardinality PII Labels Blocked
These labels are stripped entirely (they would cause cardinality explosion anyway):
- \`request.body\` — stripped
- \`user.name\` — stripped
- \`order.details\` — stripped

### Current Status
- 23 metric families scanned
- 4 PII label types found and masked
- Cardinality impact: -67% (removing high-cardinality user labels)

### Recommendations
1. Add \`account_number\` to masking rules (found in payment metrics)
2. Audit custom application metrics for new label names quarterly`,
  },
  {
    question: "What happens when a masking rule fails?",
    answer: `## Masking Rule Failure Handling

### Failure Modes & Responses
| Failure Type | Default Action | Current Config | Risk |
|--------------|----------------|----------------|------|
| Rule timeout (>5ms) | Log & continue | Skip masking | High |
| Regex compile error | Alert + skip | Skip masking | Medium |
| NER model unavailable | Fallback to regex | Use DM-010b | Low |
| Rule conflict | Last-write-wins | Logged | Medium |
| Upstream error | Retry 3x | Drop if max | High |

### Failure Policy Options
\`\`\`yaml
masking:
  failurePolicy: "block"  # block | skip | quarantine
  timeout: 10ms
  retries: 3
  fallback: "regex-only"
\`\`\`

**Current setting: \`skip\`** — PII may pass through unmasked on failure.

### Recent Failures (Last 7d)
| Date | Rule | Failure | Events Unmasked |
|------|------|---------|-----------------|
| 2026-03-12 | DM-010 | NER model timeout | 234 |
| 2026-03-10 | DM-001 | Regex backtrack | 12 |

### Recommendations
1. **Change failure policy to \`quarantine\`** — hold events until retried
2. Set masking timeout to 20ms (NER model takes up to 15ms)
3. Alert when masking failures >10/minute`,
  },
];

export const DATA_MASKING_CONVERSATION_TITLES: string[] = [
  "PII field detection and masking",
  "PII leak detection report",
  "Masking rules configuration",
  "GDPR and PCI-DSS compliance",
  "Masking performance impact",
  "Data masking audit trail",
  "Masking gap analysis",
  "Kubernetes pod log masking",
  "Metrics label masking",
  "Masking rule failure handling",
];
