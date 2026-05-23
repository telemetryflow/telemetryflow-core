/**
 * Notifications Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for notification channel and delivery analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const NOTIFICATIONS_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the notification channel status",
    answer: `## Notification Channels Overview

### Active Channels
| Channel | Type | Status | Destinations | Last Sent | Success Rate |
|---------|------|--------|-------------|-----------|-------------|
| #ops-alerts | Slack | ✅ Active | #ops-alerts channel | 5m ago | 99.8% |
| #dev-notifications | Slack | ✅ Active | #dev-notifications | 12m ago | 99.9% |
| PagerDuty On-Call | PagerDuty | ✅ Active | SRE Team rotation | 1h ago | 100% |
| Email - SRE Team | Email | ✅ Active | 5 recipients | 2h ago | 98.5% |
| Email - Management | Email | ✅ Active | 3 recipients | 1d ago | 100% |
| Webhook - StatusPage | Webhook | ⚠️ Degraded | status.company.com | 30m ago | 92.3% |
| Teams - Platform | MS Teams | ✅ Active | Platform channel | 45m ago | 99.2% |
| SMS - Critical | SMS | ✅ Active | 3 phone numbers | 3d ago | 100% |

### Channel Health Summary
| Metric | Value | Status |
|--------|-------|--------|
| Total Channels | 8 | |
| Healthy | 7 | ✅ |
| Degraded | 1 | ⚠️ (Webhook) |
| Down | 0 | ✅ |
| Avg Delivery Time | 1.8s | ✅ |
| Failed Deliveries (24h) | 12 | ⚠️ |

### Webhook Issue Details
- **Channel:** Webhook - StatusPage
- **Issue:** Intermittent HTTP 502 responses from target
- **Failed:** 12 of 156 attempts (7.7%)
- **Since:** 6 hours ago
- **Action:** Auto-retry enabled (3 attempts, exponential backoff)`,
  },
  {
    question: "What notifications were sent in the last 24 hours?",
    answer: `## Notification History (Last 24 Hours)

### Summary
| Channel Type | Sent | Delivered | Failed | Avg Delivery |
|-------------|------|-----------|--------|-------------|
| Slack | 89 | 89 | 0 | 0.8s |
| PagerDuty | 12 | 12 | 0 | 1.2s |
| Email | 34 | 33 | 1 | 2.3s |
| Webhook | 156 | 144 | 12 | 1.5s |
| Teams | 23 | 23 | 0 | 1.1s |
| SMS | 2 | 2 | 0 | 3.5s |
| **Total** | **316** | **303** | **13** | **1.7s** |

### Recent Notifications
| Time | Channel | Alert | Severity | Status |
|------|---------|-------|----------|--------|
| 5m ago | Slack (#ops) | CPU > 90% on prod-web-02 | Critical | ✅ Delivered |
| 12m ago | Slack (#dev) | Deployment v2.5.1 complete | Info | ✅ Delivered |
| 30m ago | Webhook | Status page component update | Warning | ⚠️ Retry 2 |
| 1h ago | PagerDuty | Payment gateway timeout | Critical | ✅ Delivered |
| 2h ago | Email (SRE) | Daily error summary report | Info | ✅ Delivered |
| 3h ago | Slack (#ops) | Memory pressure on cache-01 | Warning | ✅ Delivered |
| 5h ago | PagerDuty | Database replication lag | High | ✅ Delivered |
| 8h ago | Teams | Weekly SLA report ready | Info | ✅ Delivered |

### Notification Volume by Hour
\`\`\`
00:00 | ████░░░░░░░░░░░░░░░░  8
04:00 | ██░░░░░░░░░░░░░░░░░░  4
08:00 | ██████████░░░░░░░░░░ 23
10:00 | ████████████████░░░░ 45  ← Peak (alert burst)
12:00 | ████████████░░░░░░░░ 34
14:00 | ██████████░░░░░░░░░░ 28
16:00 | ████████░░░░░░░░░░░░ 18
18:00 | ████████░░░░░░░░░░░░ 20
20:00 | ██████░░░░░░░░░░░░░░ 14
22:00 | ████████░░░░░░░░░░░░ 18
\`\`\`

### Alert Fatigue Check
- **Total notifications:** 316 in 24h (13.2/hour avg)
- **Unique alerts:** 45 (7x notification amplification due to multi-channel routing)
- **Actionable alerts:** 23 (51% — below 70% target ⚠️)`,
  },
  {
    question: "How do I configure a new Slack notification channel?",
    answer: `## Configuring Slack Notifications

### Option 1: Incoming Webhook (Simple)
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/notifications/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Engineering Alerts",
    "type": "slack",
    "config": {
      "webhookUrl": "https://hooks.slack.com/services/T00/B00/xxxx",
      "channel": "#engineering-alerts",
      "username": "TelemetryFlow",
      "iconEmoji": ":chart_with_upwards_trend:",
      "messageTemplate": "default"
    },
    "filters": {
      "severities": ["critical", "high"],
      "services": ["api-gateway", "payment-service"],
      "environments": ["production"]
    },
    "schedule": {
      "quietHours": { "start": "22:00", "end": "08:00", "timezone": "America/New_York" },
      "quietDaySeverityOverride": "critical"
    }
  }'
\`\`\`

### Option 2: Slack App (Rich Features)
\`\`\`bash
# Install TelemetryFlow Slack App
curl -X POST https://api.telemetryflow.id/api/v2/notifications/channels \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Engineering Alerts (App)",
    "type": "slack-app",
    "config": {
      "appToken": "xapp-xxx",
      "botToken": "xoxb-xxx",
      "channel": "#engineering-alerts",
      "features": {
        "interactiveButtons": true,
        "threadedAlerts": true,
        "acknowledgeFromSlack": true,
        "escalateFromSlack": true
      }
    }
  }'
\`\`\`

### Message Template Options
| Template | Description | Preview |
|----------|-------------|---------|
| default | Standard alert format | Title + severity + details |
| compact | Minimal one-liner | Severity icon + title + link |
| detailed | Full context | Title + graph + metrics + runbook |
| custom | User-defined | Markdown template |

### Alert Routing Rules
| Rule | Condition | Channel | Priority |
|------|-----------|---------|----------|
| Critical Production | severity=critical AND env=prod | PagerDuty + Slack | Highest |
| High Production | severity=high AND env=prod | Slack (#ops) | High |
| Warning | severity=warning | Slack (#dev) | Normal |
| Info/Resolved | severity=info OR status=resolved | Slack (#dev) | Low |

### Testing
\`\`\`bash
# Send test notification
curl -X POST "https://api.telemetryflow.id/api/v2/notifications/channels/{channelId}/test" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\``,
  },
  {
    question: "What's the notification delivery failure rate?",
    answer: `## Notification Delivery Metrics

### Delivery Success Rate (Last 30 Days)
| Channel | Sent | Delivered | Failed | Success Rate | Trend |
|---------|------|-----------|--------|-------------|-------|
| Slack | 2,345 | 2,342 | 3 | 99.87% | → Stable |
| PagerDuty | 234 | 234 | 0 | 100% | → Stable |
| Email | 890 | 878 | 12 | 98.65% | ↘ -0.5% |
| Webhook | 4,567 | 4,234 | 333 | 92.71% | ↘ -3.2% ⚠️ |
| Teams | 567 | 564 | 3 | 99.47% | → Stable |
| SMS | 45 | 45 | 0 | 100% | → Stable |
| **Total** | **8,648** | **8,297** | **351** | **95.94%** | |

### Failure Analysis (Webhook Channel)
| Error | Count | % of Failures | Root Cause |
|-------|-------|--------------|------------|
| HTTP 502 | 234 | 70.3% | Target server overloaded |
| HTTP 504 Timeout | 67 | 20.1% | Target response > 10s |
| Connection Refused | 23 | 6.9% | Target down during deploy |
| SSL Error | 9 | 2.7% | Certificate mismatch |

### Failure Timeline (Webhook)
\`\`\`
Week 1: ██░░░░░░░░ 12 failures (normal)
Week 2: ███░░░░░░░ 23 failures (slight increase)
Week 3: ████████░░ 89 failures (StatusPage deploy)
Week 4: ██████████ 209 failures (ongoing issues) ⚠️
\`\`\`

### Email Delivery Issues
| Issue | Count | Recipients Affected |
|-------|-------|-------------------|
| Bounced (invalid address) | 5 | old-employee@company.com |
| Spam filtered | 4 | 2 external recipients |
| Mailbox full | 2 | contractor@company.com |
| Timeout | 1 | SMTP server issue |

### Retry Configuration
| Channel | Max Retries | Backoff | Current Queue |
|---------|------------|---------|--------------|
| Slack | 3 | 1s, 5s, 30s | 0 |
| Webhook | 5 | 5s, 30s, 2m, 10m, 1h | 3 |
| Email | 3 | 30s, 5m, 30m | 0 |

### Recommendations
1. **Webhook:** Contact StatusPage team about 502 errors — target server needs scaling
2. **Email:** Remove bouncing address (old-employee@), update SPF/DKIM records
3. Consider adding **fallback channels** for critical alerts (if Webhook fails → Slack)`,
  },
  {
    question: "How do I set up alert escalation policies?",
    answer: `## Alert Escalation Policy Configuration

### Current Escalation Policies
| Policy | Trigger | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|---------|
| Critical Production | Severity: Critical | Slack + PagerDuty (0m) | SMS (5m) | VP Engineering (15m) |
| High Production | Severity: High | Slack (0m) | PagerDuty (10m) | Email Manager (30m) |
| Standard | Severity: Medium | Slack (0m) | Email Team (30m) | — |

### Create New Escalation Policy
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/notifications/escalation-policies \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Database Critical",
    "description": "Escalation for database-related critical alerts",
    "rules": [
      {
        "level": 1,
        "delay": "0m",
        "channels": ["slack-ops", "pagerduty-dba"],
        "condition": "alert.severity == critical AND alert.labels.component == database"
      },
      {
        "level": 2,
        "delay": "5m",
        "channels": ["sms-dba-oncall"],
        "condition": "NOT acknowledged"
      },
      {
        "level": 3,
        "delay": "15m",
        "channels": ["email-vp-engineering", "sms-cto"],
        "condition": "NOT acknowledged AND NOT resolved"
      }
    ],
    "repeatInterval": "30m",
    "maxRepeats": 3,
    "autoResolve": {
      "enabled": true,
      "timeout": "4h"
    }
  }'
\`\`\`

### Escalation Flow Visualization
\`\`\`
Alert Fired (t=0)
  ├── Level 1: Slack + PagerDuty
  │   ├── Acknowledged? → Stop escalation
  │   └── Not acknowledged after 5m ↓
  ├── Level 2: SMS to DBA on-call
  │   ├── Acknowledged? → Stop escalation
  │   └── Not acknowledged after 15m ↓
  └── Level 3: Email VP + SMS CTO
      └── Repeat every 30m (max 3x)
\`\`\`

### On-Call Schedule Integration
| Team | Current On-Call | Rotation | Next Rotation |
|------|---------------|----------|--------------|
| SRE | sarah.devops@ | Weekly | 3 days |
| DBA | john.dba@ | Weekly | 5 days |
| Platform | mike.platform@ | Daily | 8 hours |

### Escalation Statistics (Last 30 Days)
| Metric | Value |
|--------|-------|
| Total Escalations | 45 |
| Resolved at Level 1 | 34 (75.6%) |
| Escalated to Level 2 | 8 (17.8%) |
| Escalated to Level 3 | 3 (6.7%) |
| Avg Acknowledgement Time | 4.2 min |
| Avg Resolution Time | 28 min |`,
  },
  {
    question: "Show me notification routing and filtering rules",
    answer: `## Notification Routing Rules

### Active Routing Rules
| Priority | Name | Condition | Channels | Status |
|----------|------|-----------|----------|--------|
| 1 | Critical Prod Alerts | severity=critical AND env=prod | PagerDuty, Slack, SMS | ✅ Active |
| 2 | High Prod Alerts | severity=high AND env=prod | Slack (#ops), Email (SRE) | ✅ Active |
| 3 | Database Alerts | labels.component=database | Slack (#dba), PagerDuty (DBA) | ✅ Active |
| 4 | Security Alerts | labels.category=security | Slack (#security), Email (CISO) | ✅ Active |
| 5 | Staging Alerts | env=staging | Slack (#dev) | ✅ Active |
| 6 | Resolved | status=resolved | Slack (thread reply) | ✅ Active |
| 7 | Default | * (catch-all) | Slack (#monitoring) | ✅ Active |

### Suppression Rules
| Rule | Condition | Duration | Reason |
|------|-----------|----------|--------|
| Maintenance Window | service=api-gateway | Tue 02:00-04:00 UTC | Weekly deployment |
| Known Issue | alert_name=disk_warning AND host=dev-* | Permanent | Dev env, expected |
| Flapping Guard | same alert fired 5x in 10min | 30 min cooldown | Prevent alert fatigue |

### Grouping Rules
| Group By | Window | Effect |
|----------|--------|--------|
| alert_name + service | 5 min | Group related alerts into single notification |
| host | 2 min | Batch multiple alerts from same host |
| severity=critical | 0 min | Never group critical alerts (immediate) |

### De-duplication
| Setting | Value |
|---------|-------|
| Duplicate window | 5 minutes |
| Match fields | alert_name, service, host |
| Action | Suppress duplicate, increment counter |

### Routing Statistics (Last 7 Days)
| Rule | Matched | Notifications Sent | Suppressed |
|------|---------|-------------------|-----------|
| Critical Prod | 23 | 69 (3 channels each) | 0 |
| High Prod | 45 | 90 (2 channels each) | 5 |
| Database | 12 | 24 (2 channels each) | 2 |
| Staging | 89 | 89 | 34 (maintenance) |
| Default | 156 | 156 | 23 (dedup) |

### Notification Volume Reduction
- **Before routing/suppression:** ~580 raw notifications
- **After routing/suppression:** ~428 delivered notifications
- **Reduction:** 26.2% — saving ~152 unnecessary notifications`,
  },
];

export const NOTIFICATIONS_CONVERSATION_TITLES: string[] = [
  "Channel status and health review",
  "Notification delivery analysis",
  "Slack channel configuration",
  "Alert escalation setup",
  "Routing rules optimization",
  "Notification delivery failure investigation",
  "High-volume notification digest setup",
  "Priority escalation rule configuration",
  "Notification channel health check",
  "Alert-to-notification latency analysis",
];
