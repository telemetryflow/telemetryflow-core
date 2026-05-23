/**
 * Status Page Context Mock Data for LLM AI Insights
 * Contains 30 realistic Q&A pairs for status page and incident management
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const STATUS_PAGE_MOCK_DATA: MockQA[] = [
  {
    question: "What's the current status of all services?",
    answer: `## Current Service Status

### Overall Status: Partial Outage

### Service Components
| Component | Status | Updated |
|-----------|--------|---------|
| API | ✅ Operational | 5m ago |
| Web Application | ✅ Operational | 5m ago |
| Database | ⚠️ Degraded Performance | 15m ago |
| CDN | ✅ Operational | 5m ago |
| Authentication | ✅ Operational | 5m ago |
| Payment Processing | 🔴 Major Outage | 45m ago |
| Email Service | ✅ Operational | 5m ago |
| File Storage | ⚠️ Degraded Performance | 20m ago |

### Active Incidents
| Incident | Severity | Duration | Status |
|----------|----------|----------|--------|
| Payment Gateway Unavailable | Critical | 45 minutes | Investigating |
| Slow Database Queries | Medium | 2 hours | Monitoring |

### System Metrics (Last Hour)
- **Uptime:** 99.2%
- **Avg Response Time:** 234ms
- **Error Rate:** 0.8%
- **Active Users:** 12,450`,
  },
  {
    question: "Show me recent incidents and their resolution status",
    answer: `## Recent Incidents Report

### Active Incidents
| ID | Title | Severity | Started | Status |
|----|-------|----------|---------|--------|
| INC-2024-0089 | Payment Gateway Timeout | Critical | 45m ago | Investigating |
| INC-2024-0088 | Database Performance Degradation | Medium | 2h ago | Monitoring |

### Resolved Incidents (Last 7 Days)
| ID | Title | Severity | Duration | Resolution |
|----|-------|----------|----------|------------|
| INC-2024-0087 | CDN Cache Invalidation Failure | Low | 35m | Cache cleared manually |
| INC-2024-0086 | Auth Service 503 Errors | High | 1h 15m | Service restarted |
| INC-2024-0085 | SSL Certificate Warning | Medium | 25m | Certificate renewed |
| INC-2024-0084 | API Rate Limiting Issues | Low | 45m | Config updated |
| INC-2024-0083 | Search Indexing Delay | Medium | 3h | Index rebuilt |

### Incident Statistics (30 Days)
| Metric | Value | Trend |
|--------|-------|-------|
| Total Incidents | 23 | ↗ +15% |
| MTTR | 48 minutes | ↘ -12% |
| Critical Incidents | 3 | → Same |
| Customer Impact Hours | 8.5h | ↗ +20% |

### Resolution Rate
- Within SLA: 87%
- Automated Resolution: 35%
- Manual Intervention: 65%`,
  },
  {
    question: "How do I create a new incident on the status page?",
    answer: `## Creating a New Incident

### Quick Create via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/v2/status-page/incidents \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Service Degradation",
    "status": "investigating",
    "severity": "minor",
    "components": ["api", "database"],
    "message": "We are investigating reports of slow API responses."
  }'
\`\`\`

### Incident Fields
| Field | Required | Options |
|-------|----------|---------|
| title | Yes | Free text (max 255 chars) |
| status | Yes | investigating, identified, monitoring, resolved |
| severity | Yes | critical, major, minor, maintenance |
| components | Yes | Array of component IDs |
| message | Yes | Markdown supported |
| notify_subscribers | No | true/false (default: true) |

### Severity Guidelines
| Severity | When to Use | Example |
|----------|-------------|---------|
| Critical | Complete service unavailable | Payment system down |
| Major | Significant functionality impaired | Slow responses (>5s) |
| Minor | Limited impact, workaround exists | Dashboard loading issues |
| Maintenance | Planned work | Scheduled upgrades |

### Notification Channels
When created, notifications go to:
- Email subscribers: Immediate
- Slack webhook: Immediate
- RSS feed: Updated
- Status page: Updated

### Best Practices
1. Use clear, non-technical language
2. Provide estimated resolution time if known
3. Update at least every 30 minutes
4. Include affected regions/user segments`,
  },
  {
    question: "What components are affected by the current outage?",
    answer: `## Affected Components Analysis

### Current Outage: Payment Gateway Timeout
**Incident ID:** INC-2024-0089
**Started:** 45 minutes ago
**Severity:** Critical

### Directly Affected Components
| Component | Impact Level | Users Affected |
|-----------|--------------|----------------|
| Payment Processing | 🔴 Down | 100% |
| Checkout Flow | 🔴 Down | 100% |
| Subscription Billing | 🔴 Down | 100% |
| Invoice Generation | ⚠️ Degraded | 80% |

### Indirectly Affected Components
| Component | Impact Level | Reason |
|-----------|--------------|--------|
| Order Service | ⚠️ Degraded | Cannot complete orders |
| Notification Service | ⚠️ Degraded | Payment confirmations failing |
| Analytics | ⚠️ Degraded | Missing transaction data |
| Reporting | ⚠️ Degraded | Incomplete financial data |

### Unaffected Components
| Component | Status |
|-----------|--------|
| User Authentication | ✅ Operational |
| Product Catalog | ✅ Operational |
| Search | ✅ Operational |
| User Dashboard | ✅ Operational |
| API (non-payment) | ✅ Operational |

### Impact Summary
- **Affected Users:** ~15,000 (attempting checkout)
- **Revenue Impact:** ~$45,000/hour
- **Geographic Impact:** Global
- **Workaround:** None available`,
  },
  {
    question: "How many subscribers are on our status page?",
    answer: `## Status Page Subscriber Analytics

### Subscriber Overview
| Metric | Count | Change (30d) |
|--------|-------|--------------|
| Total Subscribers | 8,450 | ↗ +12% |
| Email Subscribers | 6,234 | ↗ +8% |
| Webhook Subscribers | 156 | ↗ +25% |
| RSS Subscribers | 890 | ↘ -3% |
| Slack Integration | 45 | ↗ +15% |
| SMS Subscribers | 1,125 | ↗ +18% |

### Subscriber Growth
\`\`\`
Subscribers
9000 |                                    ████
8500 |                               █████████
8000 |                          ██████████████
7500 |                     █████████████████████
7000 |                ████████████████████████████
6500 |           █████████████████████████████████
     +------------------------------------------
     Jul   Aug   Sep   Oct   Nov   Dec   Jan
\`\`\`

### Top Subscriber Domains
| Domain | Subscribers | % of Total |
|--------|-------------|------------|
| gmail.com | 2,345 | 27.8% |
| company.com (internal) | 890 | 10.5% |
| partner-inc.com | 456 | 5.4% |
| enterprise-client.com | 234 | 2.8% |
| Other | 4,525 | 53.5% |

### Notification Preferences
| Preference | Subscribers |
|------------|-------------|
| All incidents | 4,567 (54%) |
| Critical only | 2,890 (34%) |
| Specific components | 993 (12%) |

### Engagement Metrics
- **Open Rate:** 68% (email)
- **Click Rate:** 23%
- **Unsubscribe Rate:** 0.8%/month`,
  },
  {
    question: "What's the scheduled maintenance for this week?",
    answer: `## Scheduled Maintenance This Week

### Upcoming Maintenance Windows
| ID | Title | Date | Time (UTC) | Duration | Impact |
|----|-------|------|------------|----------|--------|
| MW-456 | Database Migration | Jan 18 | 02:00-04:00 | 2h | High |
| MW-457 | API Gateway Update | Jan 19 | 03:00-03:30 | 30m | Medium |
| MW-458 | CDN Certificate Rotation | Jan 20 | 00:00-00:15 | 15m | Low |
| MW-459 | K8s Cluster Upgrade | Jan 21 | 01:00-05:00 | 4h | High |

### Detailed Schedule

#### MW-456: Database Migration
\`\`\`yaml
Date: Thursday, January 18, 2024
Time: 02:00 - 04:00 UTC
Expected Downtime: 15-30 minutes
Affected Services:
  - All read/write operations
  - Reports and analytics
  - User data exports
Unaffected Services:
  - Static content (CDN)
  - Documentation
  - Status page
\`\`\`

#### MW-459: K8s Cluster Upgrade
\`\`\`yaml
Date: Sunday, January 21, 2024
Time: 01:00 - 05:00 UTC
Expected Downtime: Rolling (2-5 min per service)
Affected Services:
  - All services (rolling restarts)
Mitigation:
  - Blue-green deployment
  - Traffic shift to DR cluster
\`\`\`

### Notification Status
| Maintenance | Email Sent | Slack Posted | Banner Added |
|-------------|------------|--------------|--------------|
| MW-456 | ✅ 7d ago | ✅ 7d ago | ✅ Active |
| MW-457 | ✅ 5d ago | ✅ 5d ago | ⏳ 24h before |
| MW-458 | ✅ 3d ago | ✅ 3d ago | ⏳ 24h before |
| MW-459 | ✅ 7d ago | ✅ 7d ago | ✅ Active |`,
  },
  {
    question: "How can I customize the status page branding?",
    answer: `## Status Page Branding Configuration

### Current Branding Settings
| Setting | Value |
|---------|-------|
| Page Title | "Example Service Status" |
| Company Name | "Example Inc." |
| Logo URL | https://cdn.telemetryflow.id/logo.svg |
| Favicon | https://cdn.telemetryflow.id/favicon.ico |
| Primary Color | #4F46E5 (Indigo) |
| Accent Color | #10B981 (Green) |
| Custom Domain | status.telemetryflow.id |

### Customization Options

#### Basic Branding
\`\`\`yaml
branding:
  title: "Your Service Status"
  company_name: "Your Company"
  logo_url: "https://your-cdn.com/logo.svg"
  favicon_url: "https://your-cdn.com/favicon.ico"

  colors:
    primary: "#4F46E5"
    accent: "#10B981"
    background: "#F9FAFB"
    text: "#1F2937"

  # Dark mode colors (auto-detected)
  colors_dark:
    background: "#111827"
    text: "#F9FAFB"
\`\`\`

#### Custom CSS
\`\`\`css
/* Custom header styling */
.status-page-header {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 2rem;
}

/* Custom component card styling */
.component-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Status indicator customization */
.status-operational {
  background-color: #10B981;
}
\`\`\`

### Custom Domain Setup
\`\`\`bash
# Add CNAME record
status.telemetryflow.id CNAME status-page.telemetryflow.com

# Verify domain
curl -X POST /v2/status-page/domains/verify \\
  -d '{"domain": "status.telemetryflow.id"}'

# Enable SSL
curl -X POST /v2/status-page/domains/ssl \\
  -d '{"domain": "status.telemetryflow.id"}'
\`\`\`

### Available Widgets
- Overall status indicator
- Component status list
- Active incidents
- Scheduled maintenance
- Historical uptime chart
- Subscriber form`,
  },
  {
    question: "What's the incident update history for INC-2024-0089?",
    answer: `## Incident Update History

### Incident: INC-2024-0089
**Title:** Payment Gateway Timeout
**Severity:** Critical
**Status:** Investigating
**Duration:** 1 hour 23 minutes

### Timeline
\`\`\`
TIME (UTC)      STATUS              UPDATE
─────────────────────────────────────────────────────────
14:23:00        🔴 Investigating    Initial detection
                                    "We are investigating
                                    reports of payment
                                    failures."

14:35:00        🔴 Investigating    First update
                                    "Issue traced to
                                    payment gateway timeout.
                                    Working with provider."

14:52:00        🟡 Identified       Root cause found
                                    "Identified network
                                    connectivity issue between
                                    our infrastructure and
                                    payment provider."

15:15:00        🟡 Identified       Progress update
                                    "Working with Stripe
                                    support. ETA 30 minutes
                                    for resolution."

15:30:00        🔵 Monitoring       Fix deployed
                                    "Connectivity restored.
                                    Monitoring payment
                                    success rate."

15:45:00        ✅ Resolved         Incident resolved
                                    "All payment systems
                                    operational. Transactions
                                    processed normally."
\`\`\`

### Metrics During Incident
| Metric | Before | During | After |
|--------|--------|--------|-------|
| Payment Success Rate | 99.8% | 12.3% | 99.7% |
| Avg Transaction Time | 1.2s | Timeout | 1.4s |
| Error Rate | 0.2% | 87.7% | 0.3% |
| Affected Transactions | - | 1,847 | - |

### Post-Incident Actions
- [ ] Update payment provider failover config
- [ ] Add monitoring for gateway latency
- [ ] Schedule post-mortem review
- [ ] Communicate with affected customers`,
  },
  {
    question: "How do I set up incident notifications to Slack?",
    answer: `## Slack Notification Integration

### Quick Setup

1. **Create Slack Webhook**
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app → Incoming Webhooks
   - Copy webhook URL

2. **Configure Integration**
\`\`\`bash
curl -X POST /v2/status-page/integrations/slack \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "webhook_url": "https://hooks.slack.com/services/T00/B00/xxx",
    "channel": "#incidents",
    "events": ["incident.created", "incident.updated", "incident.resolved"],
    "severity_filter": ["critical", "major"]
  }'
\`\`\`

### Notification Events
| Event | Description | Default |
|-------|-------------|---------|
| incident.created | New incident created | ✅ Enabled |
| incident.updated | Status/message updated | ✅ Enabled |
| incident.resolved | Incident resolved | ✅ Enabled |
| maintenance.scheduled | New maintenance window | ⚠️ Optional |
| maintenance.started | Maintenance begins | ⚠️ Optional |
| maintenance.completed | Maintenance ends | ⚠️ Optional |
| component.degraded | Component status change | ⚠️ Optional |

### Message Format
\`\`\`json
{
  "attachments": [{
    "color": "#FF4136",
    "title": "🔴 Critical Incident: Payment Gateway Timeout",
    "title_link": "https://status.telemetryflow.id/incidents/INC-2024-0089",
    "text": "We are investigating reports of payment failures.",
    "fields": [
      {"title": "Status", "value": "Investigating", "short": true},
      {"title": "Severity", "value": "Critical", "short": true},
      {"title": "Components", "value": "Payment Processing", "short": true},
      {"title": "Started", "value": "14:23 UTC", "short": true}
    ],
    "footer": "Example Status Page",
    "ts": 1705329780
  }]
}
\`\`\`

### Advanced Options
\`\`\`yaml
slack_integration:
  # Multiple channels by severity
  routing:
    critical: "#incidents-critical"
    major: "#incidents"
    minor: "#ops-alerts"

  # Custom message template
  template: |
    *{{ severity_emoji }} {{ title }}*
    Status: {{ status }}
    {{ message }}

  # Mention users for critical
  mentions:
    critical: ["@oncall", "@engineering-lead"]
\`\`\``,
  },
  {
    question: "Show me the uptime history for the last 90 days",
    answer: `## 90-Day Uptime History

### Overall Availability
| Period | Uptime | Downtime | Incidents |
|--------|--------|----------|-----------|
| Last 90 days | 99.87% | 2h 49m | 15 |
| Last 30 days | 99.92% | 35m | 4 |
| Last 7 days | 99.95% | 8m | 1 |
| Last 24 hours | 100% | 0m | 0 |

### Monthly Breakdown
| Month | Uptime | Downtime | Incidents | SLA |
|-------|--------|----------|-----------|-----|
| January 2024 | 99.95% | 22m | 3 | ✅ Met |
| December 2023 | 99.82% | 78m | 5 | ⚠️ At risk |
| November 2023 | 99.96% | 17m | 3 | ✅ Met |
| October 2023 | 99.91% | 39m | 4 | ✅ Met |

### Daily Uptime Chart (Last 90 Days)
\`\`\`
     100% |████████████████████████████████████████████████████████████████████████████████████████
    99.9% |████████████████████████████████████████████████████████████████████████████████████████
    99.5% |████████████████████████░░██████████████████████████████████░░████████████████████████████
    99.0% |██████████████████████░░░░░░████████████████████████████████░░░░██████████████████████████
          +──────────────────────────────────────────────────────────────────────────────────────────
          Oct 15              Nov 1               Dec 1               Jan 1               Jan 15
                              ↑                                       ↑
                    Major outage (78m)                         Minor outage (12m)
\`\`\`

### Component Uptime
| Component | 90-Day Uptime | Incidents | MTTR |
|-----------|---------------|-----------|------|
| API | 99.95% | 5 | 18m |
| Web Application | 99.98% | 2 | 12m |
| Database | 99.89% | 4 | 35m |
| CDN | 99.99% | 1 | 8m |
| Authentication | 99.97% | 3 | 15m |
| Payment Processing | 99.78% | 6 | 45m |

### SLA Performance
| SLA Level | Target | Actual | Status |
|-----------|--------|--------|--------|
| Platinum | 99.99% | 99.87% | ❌ Breach |
| Gold | 99.95% | 99.87% | ❌ Breach |
| Silver | 99.9% | 99.87% | ❌ Breach |
| Bronze | 99.5% | 99.87% | ✅ Met |`,
  },
  {
    question: "What metrics should I display on the status page?",
    answer: `## Status Page Metrics Best Practices

### Essential Metrics
| Metric | Purpose | Update Frequency |
|--------|---------|------------------|
| Overall Status | Quick health overview | Real-time |
| Component Status | Per-service health | 30 seconds |
| Active Incidents | Current issues | Real-time |
| Response Time | Performance indicator | 1 minute |
| Uptime Percentage | Reliability indicator | 5 minutes |

### Recommended Dashboard Layout

#### Above the Fold
\`\`\`
┌─────────────────────────────────────────────────┐
│           All Systems Operational ✅            │
│         Last updated: 2 minutes ago             │
├─────────────────────────────────────────────────┤
│  Uptime: 99.95%  │  Response: 145ms  │  0 Issues │
└─────────────────────────────────────────────────┘
\`\`\`

#### Component Status Section
| Component | Metrics to Show |
|-----------|-----------------|
| API | Status, Response Time, Error Rate |
| Database | Status, Query Time, Connections |
| CDN | Status, Cache Hit Rate |
| Auth | Status, Login Success Rate |

### Performance Metrics
\`\`\`yaml
metrics:
  response_time:
    display: true
    percentile: p95
    threshold_warning: 500ms
    threshold_critical: 2000ms

  error_rate:
    display: true
    threshold_warning: 1%
    threshold_critical: 5%

  throughput:
    display: false  # Internal only
    unit: requests/second

  availability:
    display: true
    calculation_window: 30d
    sla_target: 99.9%
\`\`\`

### Historical Charts
| Chart | Time Range | Granularity |
|-------|------------|-------------|
| Uptime | 90 days | Daily |
| Response Time | 24 hours | 5 minutes |
| Incidents | 30 days | Daily count |
| Error Rate | 7 days | Hourly |

### What NOT to Display
- Internal infrastructure details
- Sensitive system information
- Raw error messages
- Customer-specific data
- Security-related metrics

### API for Metrics
\`\`\`bash
# Get current metrics for status page
curl /v2/status-page/metrics?components=api,web,db

# Response
{
  "overall_status": "operational",
  "uptime_30d": 99.95,
  "response_time_p95": 145,
  "error_rate": 0.02,
  "active_incidents": 0
}
\`\`\``,
  },
  {
    question: "How do I configure component dependencies?",
    answer: `## Component Dependency Configuration

### Current Component Hierarchy
\`\`\`
                    ┌─────────────┐
                    │   Frontend  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │   API   │  │   CDN   │  │  Auth   │
        └────┬────┘  └─────────┘  └────┬────┘
             │                         │
    ┌────────┴────────┐               │
    ▼                 ▼               │
┌─────────┐     ┌─────────┐          │
│ Database│     │  Cache  │◄─────────┘
└─────────┘     └─────────┘
\`\`\`

### Dependency Configuration
\`\`\`yaml
components:
  - id: frontend
    name: "Web Application"
    dependencies: [api, cdn, auth]
    impact_on_failure: critical

  - id: api
    name: "API"
    dependencies: [database, cache]
    impact_on_failure: critical

  - id: auth
    name: "Authentication"
    dependencies: [database, cache]
    impact_on_failure: critical

  - id: database
    name: "Database"
    dependencies: []
    impact_on_failure: critical

  - id: cache
    name: "Cache Layer"
    dependencies: []
    impact_on_failure: degraded  # Service works, slower

  - id: cdn
    name: "CDN"
    dependencies: []
    impact_on_failure: degraded
\`\`\`

### Impact Propagation Rules
| Dependency Status | Parent Impact |
|-------------------|---------------|
| 1 critical dependency down | Parent marked critical |
| Multiple degraded dependencies | Parent marked degraded |
| Non-critical dependency down | Parent stays operational (with warning) |

### API Configuration
\`\`\`bash
# Set component dependencies
curl -X PUT /v2/status-page/components/api/dependencies \\
  -d '{
    "dependencies": ["database", "cache"],
    "propagation_rules": {
      "database_down": "component_down",
      "cache_down": "component_degraded"
    }
  }'

# View dependency graph
curl /v2/status-page/components/dependency-graph
\`\`\`

### Automatic Status Updates
When a dependency fails:
1. Affected components auto-update status
2. Subscribers notified of cascade impact
3. Status page shows root cause component
4. Timeline shows propagation order`,
  },
  {
    question: "Analyze the subscriber notification delivery rate",
    answer: `## Notification Delivery Analysis

### Delivery Overview (Last 30 Days)
| Channel | Sent | Delivered | Rate | Bounced |
|---------|------|-----------|------|---------|
| Email | 45,678 | 44,234 | 96.8% | 1,444 |
| Slack | 2,345 | 2,340 | 99.8% | 5 |
| Webhook | 12,456 | 12,123 | 97.3% | 333 |
| SMS | 8,901 | 8,654 | 97.2% | 247 |

### Email Delivery Details
| Metric | Value | Industry Avg |
|--------|-------|--------------|
| Delivery Rate | 96.8% | 95% |
| Open Rate | 68.5% | 21% |
| Click Rate | 23.4% | 2.5% |
| Bounce Rate | 3.2% | 5% |
| Unsubscribe Rate | 0.4% | 0.5% |

### Delivery by Provider
| Email Provider | Delivery Rate | Opens |
|----------------|---------------|-------|
| Gmail | 98.2% | 72% |
| Outlook/O365 | 94.5% | 65% |
| Yahoo | 93.8% | 58% |
| Corporate | 97.8% | 71% |
| Other | 95.2% | 62% |

### Failed Deliveries
| Reason | Count | % of Failures |
|--------|-------|---------------|
| Invalid email | 678 | 47% |
| Mailbox full | 234 | 16% |
| Spam filter | 312 | 22% |
| Server error | 156 | 11% |
| Other | 64 | 4% |

### Notification Latency
| Channel | Avg Latency | P95 | P99 |
|---------|-------------|-----|-----|
| Email | 8.5s | 25s | 45s |
| Slack | 1.2s | 3s | 5s |
| Webhook | 0.8s | 2s | 4s |
| SMS | 12s | 30s | 60s |

### Recommendations
1. Clean up 678 invalid emails
2. Retry failed webhooks with exponential backoff
3. Investigate Gmail spam filter issues
4. Add delivery confirmation tracking`,
  },
  {
    question: "How do I set up a public vs private status page?",
    answer: `## Public vs Private Status Page Configuration

### Visibility Options
| Option | Access | Use Case |
|--------|--------|----------|
| Public | Anyone | Customer-facing status |
| Private | Authenticated users | Internal status |
| Hybrid | Mixed components | Both audiences |

### Public Status Page Setup
\`\`\`yaml
status_page:
  visibility: public
  url: status.telemetryflow.id

  # Public components
  components:
    - id: api
      name: "API"
      visibility: public
    - id: web
      name: "Web Application"
      visibility: public
    - id: cdn
      name: "CDN"
      visibility: public

  # Hidden components (internal only)
  hidden_components:
    - database
    - kubernetes
    - internal-services

  # Incident filtering
  incidents:
    show_all: false
    filter_internal: true  # Hide internal incidents

  # Sanitize messages
  message_filtering:
    remove_internal_links: true
    remove_technical_details: true
\`\`\`

### Private Status Page Setup
\`\`\`yaml
status_page:
  visibility: private
  url: internal-status.telemetryflow.id

  authentication:
    method: sso
    provider: okta
    allowed_groups: ["engineering", "operations"]

  # Show everything
  components:
    show_all: true
    include_internal: true

  # Full incident details
  incidents:
    show_all: true
    include_technical: true
    show_debug_info: true
\`\`\`

### Hybrid Configuration
\`\`\`yaml
status_page:
  visibility: hybrid

  # Public view
  public:
    url: status.telemetryflow.id
    components: [api, web, cdn, auth]
    incident_detail_level: summary

  # Private view
  private:
    url: internal-status.telemetryflow.id
    components: all
    incident_detail_level: full
    requires_auth: true
\`\`\`

### Access Control
| Feature | Public | Private |
|---------|--------|---------|
| View status | ✅ | Auth required |
| Subscribe | ✅ | Auth required |
| View incidents | Limited | Full |
| View metrics | Basic | Detailed |
| Component details | Limited | Full |
| API access | Rate limited | Full access |`,
  },
  {
    question: "What are the best practices for incident communication?",
    answer: `## Incident Communication Best Practices

### Communication Principles
| Principle | Description |
|-----------|-------------|
| Timeliness | Update within 15 minutes |
| Clarity | Use simple, non-technical language |
| Accuracy | Only share confirmed information |
| Empathy | Acknowledge customer impact |
| Actionability | Provide workarounds if possible |

### Message Templates

#### Initial Detection
\`\`\`markdown
**Status: Investigating**

We are currently investigating reports of [issue summary].

**What we know:**
- [Symptom 1]
- [Symptom 2]

**Impact:** [Affected services/features]

**Next update:** Within 30 minutes
\`\`\`

#### Root Cause Identified
\`\`\`markdown
**Status: Identified**

We have identified the root cause of [issue].

**Root cause:** [Brief technical explanation in plain language]

**What we're doing:**
- [Action 1]
- [Action 2]

**Expected resolution:** [Time estimate]
\`\`\`

#### Resolution
\`\`\`markdown
**Status: Resolved**

The incident affecting [service] has been resolved.

**Root cause:** [Summary]
**Resolution:** [What fixed it]
**Duration:** [Total incident time]

We apologize for any inconvenience. A detailed post-mortem
will be published within 48 hours.
\`\`\`

### Communication Cadence
| Phase | Update Frequency |
|-------|------------------|
| Investigating | Every 15-30 min |
| Identified | Every 30-60 min |
| Monitoring | Every 1-2 hours |
| Resolved | Immediately |

### What to Avoid
| Don't | Do Instead |
|-------|------------|
| Blame individuals | Focus on systems |
| Use jargon | Use plain language |
| Speculate | Share confirmed facts |
| Over-promise | Give realistic estimates |
| Hide information | Be transparent |

### Post-Incident
1. Publish post-mortem within 48 hours
2. Include timeline and root cause
3. List preventive actions
4. Thank customers for patience`,
  },
  {
    question: "Show me the component group configuration",
    answer: `## Component Groups Configuration

### Current Group Structure
\`\`\`
├── Core Services
│   ├── API (Operational)
│   ├── Web Application (Operational)
│   └── Authentication (Operational)
│
├── Infrastructure
│   ├── Database (Operational)
│   ├── Cache Layer (Operational)
│   └── Message Queue (Operational)
│
├── External Services
│   ├── Payment Gateway (Operational)
│   ├── Email Service (Operational)
│   └── SMS Provider (Degraded)
│
└── Developer Tools
    ├── API Documentation (Operational)
    ├── Webhooks (Operational)
    └── SDKs (Operational)
\`\`\`

### Group Configuration
\`\`\`yaml
component_groups:
  - id: core
    name: "Core Services"
    description: "Essential application services"
    display_order: 1
    expanded_by_default: true
    components:
      - api
      - web
      - auth

  - id: infrastructure
    name: "Infrastructure"
    description: "Backend infrastructure services"
    display_order: 2
    expanded_by_default: false
    components:
      - database
      - cache
      - queue

  - id: external
    name: "External Services"
    description: "Third-party integrations"
    display_order: 3
    expanded_by_default: false
    components:
      - payment
      - email
      - sms

  - id: developer
    name: "Developer Tools"
    description: "APIs and developer resources"
    display_order: 4
    expanded_by_default: false
    components:
      - docs
      - webhooks
      - sdks
\`\`\`

### Group Aggregation Rules
| Rule | Description |
|------|-------------|
| All operational | Group shows ✅ |
| Any degraded | Group shows ⚠️ |
| Any outage | Group shows 🔴 |
| Maintenance active | Group shows 🔧 |

### API Operations
\`\`\`bash
# Create component group
curl -X POST /v2/status-page/component-groups \\
  -d '{
    "name": "Mobile Services",
    "description": "Mobile app backend",
    "components": ["mobile-api", "push-notifications"]
  }'

# Reorder groups
curl -X PUT /v2/status-page/component-groups/order \\
  -d '{"order": ["core", "infrastructure", "external", "mobile", "developer"]}'

# Move component to different group
curl -X PUT /v2/status-page/components/api/group \\
  -d '{"group_id": "core"}'
\`\`\``,
  },
  {
    question: "How do I set up automated incident detection?",
    answer: `## Automated Incident Detection Configuration

### Detection Sources
| Source | Detection Method | Auto-Create |
|--------|------------------|-------------|
| Uptime Monitors | HTTP/TCP checks | ✅ Yes |
| APM Alerts | Error rate threshold | ✅ Yes |
| Metrics Alerts | Custom thresholds | ⚠️ Optional |
| Log Patterns | Error pattern match | ⚠️ Optional |
| External Monitors | Third-party alerts | ✅ Yes |

### Uptime Monitor Auto-Incident
\`\`\`yaml
uptime_integration:
  enabled: true

  # Incident creation rules
  create_incident_on:
    consecutive_failures: 3
    failure_duration: "2m"

  # Severity mapping
  severity_mapping:
    all_locations_down: critical
    majority_down: major
    single_location: minor

  # Auto-resolution
  auto_resolve: true
  resolve_after_checks: 2

  # Component mapping
  component_mapping:
    "api-health": "api"
    "web-health": "web"
    "auth-health": "auth"
\`\`\`

### APM Integration
\`\`\`yaml
apm_integration:
  enabled: true
  provider: datadog  # or newrelic, dynatrace

  rules:
    - name: "High Error Rate"
      condition: "error_rate > 5%"
      duration: "5m"
      severity: major
      component: api

    - name: "Slow Response"
      condition: "p99_latency > 5s"
      duration: "10m"
      severity: minor
      component: api
\`\`\`

### Alert Routing Rules
\`\`\`yaml
routing:
  # Prevent duplicate incidents
  deduplication:
    enabled: true
    window: "30m"
    key: "source:component"

  # Suppress low-impact alerts
  suppression:
    during_maintenance: true
    severity_threshold: minor

  # Escalation
  escalation:
    if_no_ack_in: "15m"
    escalate_to: [slack, pagerduty]

  # Business hours awareness
  time_based:
    outside_hours:
      delay_notification: "10m"
      severity_downgrade: true
\`\`\`

### Manual Override
\`\`\`bash
# Disable auto-incident for component
curl -X PUT /v2/status-page/components/api/auto-incident \\
  -d '{"enabled": false}'

# Set maintenance mode (prevents auto-incidents)
curl -X POST /v2/status-page/maintenance-mode \\
  -d '{"components": ["api"], "duration": "2h"}'
\`\`\``,
  },
  {
    question: "What's the API rate limit for status page endpoints?",
    answer: `## Status Page API Rate Limits

### Rate Limit Tiers
| Tier | Requests/min | Requests/hour | Burst |
|------|--------------|---------------|-------|
| Free | 60 | 1,000 | 10 |
| Pro | 300 | 10,000 | 50 |
| Enterprise | 1,000 | 50,000 | 200 |
| Custom | Unlimited | Unlimited | Custom |

### Endpoint-Specific Limits
| Endpoint | Limit | Scope |
|----------|-------|-------|
| GET /status | 600/min | IP |
| GET /components | 300/min | IP |
| GET /incidents | 300/min | IP |
| POST /incidents | 30/min | API Key |
| PUT /incidents/:id | 60/min | API Key |
| POST /subscribers | 60/min | IP |
| Webhooks (outbound) | 100/min | Per webhook |

### Rate Limit Headers
\`\`\`http
HTTP/1.1 200 OK
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 245
X-RateLimit-Reset: 1705334400
X-RateLimit-Policy: "300;w=60"
\`\`\`

### Rate Limit Response (429)
\`\`\`json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 45,
    "limit": 300,
    "window": "60s"
  }
}
\`\`\`

### Best Practices
\`\`\`python
import time
import requests

def fetch_status_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url)

        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            time.sleep(retry_after)
            continue

        return response

    raise Exception("Rate limit exceeded after retries")

# Use caching
@cache(ttl=60)
def get_status():
    return fetch_status_with_retry("https://api/status")
\`\`\`

### Increasing Limits
| Method | Process |
|--------|---------|
| Upgrade tier | Self-service in dashboard |
| Enterprise | Contact sales |
| Burst increase | Temporary via support |
| Whitelist IP | For monitoring services |`,
  },
  {
    question: "How do I export incident data for reporting?",
    answer: `## Incident Data Export

### Export Formats
| Format | Use Case | Includes |
|--------|----------|----------|
| CSV | Spreadsheet analysis | Basic fields |
| JSON | API integration | All fields |
| PDF | Executive reports | Formatted report |
| Markdown | Documentation | Human readable |

### API Export
\`\`\`bash
# Export incidents as JSON
curl -X GET /v2/status-page/incidents/export \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "format": "json",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "severity": ["critical", "major"],
    "include_updates": true
  }' \\
  -o incidents-january.json

# Export as CSV
curl -X GET /v2/status-page/incidents/export?format=csv \\
  -H "Authorization: Bearer $TOKEN" \\
  -o incidents.csv
\`\`\`

### Export Fields
| Field | Type | Description |
|-------|------|-------------|
| id | string | Incident ID |
| title | string | Incident title |
| status | string | Current status |
| severity | string | Severity level |
| components | array | Affected components |
| created_at | datetime | Creation time |
| resolved_at | datetime | Resolution time |
| duration_minutes | number | Total duration |
| updates | array | Status updates |
| metrics | object | Impact metrics |

### Sample Export Data
\`\`\`json
{
  "incidents": [
    {
      "id": "INC-2024-0089",
      "title": "Payment Gateway Timeout",
      "severity": "critical",
      "status": "resolved",
      "components": ["payment"],
      "created_at": "2024-01-15T14:23:00Z",
      "resolved_at": "2024-01-15T15:45:00Z",
      "duration_minutes": 82,
      "impact": {
        "affected_users": 15000,
        "failed_transactions": 1847,
        "estimated_revenue_loss": 45000
      },
      "updates_count": 6,
      "mttr_minutes": 82
    }
  ],
  "summary": {
    "total_incidents": 1,
    "total_downtime_minutes": 82,
    "mttr_average": 82
  }
}
\`\`\`

### Scheduled Reports
\`\`\`yaml
scheduled_exports:
  - name: "Weekly Incident Report"
    frequency: weekly
    day: monday
    format: pdf
    recipients: [ops@telemetryflow.id, management@telemetryflow.id]
    include:
      - incident_summary
      - uptime_metrics
      - sla_status

  - name: "Monthly Executive Summary"
    frequency: monthly
    day: 1
    format: pdf
    recipients: [exec@telemetryflow.id]
\`\`\``,
  },
  {
    question: "Show me how to embed status widgets",
    answer: `## Status Page Widget Embedding

### Available Widgets
| Widget | Size | Updates |
|--------|------|---------|
| Status Badge | Small | Real-time |
| Component List | Medium | 30 seconds |
| Full Status | Large | 30 seconds |
| Incident Banner | Flexible | Real-time |

### Status Badge
\`\`\`html
<!-- Simple badge -->
<a href="https://status.telemetryflow.id">
  <img src="https://status.telemetryflow.id/badge.svg" alt="Status">
</a>

<!-- Badge with specific component -->
<img src="https://status.telemetryflow.id/badge.svg?component=api" alt="API Status">

<!-- Custom style -->
<img src="https://status.telemetryflow.id/badge.svg?style=flat-square&label=API" alt="Status">
\`\`\`

### JavaScript Widget
\`\`\`html
<!-- Include widget script -->
<script src="https://status.telemetryflow.id/widget.js"></script>

<!-- Status indicator -->
<div id="status-widget"></div>
<script>
  StatusWidget.init({
    container: '#status-widget',
    pageId: 'your-page-id',
    components: ['api', 'web'],
    theme: 'auto',  // light, dark, auto
    compact: false,
    showIncidents: true
  });
</script>
\`\`\`

### React Component
\`\`\`jsx
import { StatusWidget } from '@example/status-widget';

function App() {
  return (
    <StatusWidget
      pageUrl="https://status.telemetryflow.id"
      components={['api', 'web']}
      showIncidents={true}
      theme="auto"
      onStatusChange={(status) => console.log(status)}
    />
  );
}
\`\`\`

### Incident Banner
\`\`\`html
<!-- Auto-showing incident banner -->
<div id="incident-banner"></div>
<script>
  StatusWidget.incidentBanner({
    container: '#incident-banner',
    pageId: 'your-page-id',
    position: 'top',  // top, bottom
    severity: ['critical', 'major'],  // Which to show
    dismissable: true,
    style: {
      backgroundColor: '#FEF3C7',
      textColor: '#92400E',
      borderColor: '#F59E0B'
    }
  });
</script>
\`\`\`

### iFrame Embed
\`\`\`html
<iframe
  src="https://status.telemetryflow.id/embed"
  width="100%"
  height="400"
  frameborder="0"
  scrolling="no"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>
\`\`\`

### API for Widget Data
\`\`\`bash
# Get widget data
curl https://status.telemetryflow.id/api/widget \\
  -H "Accept: application/json"

# Response (JSONP supported)
{
  "status": "operational",
  "components": [...],
  "active_incidents": []
}
\`\`\``,
  },
  {
    question: "What regions does the status page support?",
    answer: `## Status Page Regional Configuration

### Available Regions
| Region | Location | Latency | Status |
|--------|----------|---------|--------|
| US-East | Virginia | Baseline | ✅ Primary |
| US-West | Oregon | +40ms | ✅ Active |
| EU-West | Ireland | +80ms | ✅ Active |
| EU-Central | Frankfurt | +85ms | ✅ Active |
| APAC-Tokyo | Japan | +150ms | ✅ Active |
| APAC-Sydney | Australia | +180ms | ✅ Active |
| APAC-Singapore | Singapore | +200ms | ⏳ Coming |
| SA-East | São Paulo | +120ms | ⏳ Coming |

### Regional Status Display
\`\`\`yaml
regional_status:
  enabled: true
  display_mode: map  # map, list, tabs

  regions:
    - id: us-east
      name: "North America (East)"
      components: [api-east, db-east, cdn-east]
      timezone: "America/New_York"

    - id: eu-west
      name: "Europe (West)"
      components: [api-eu, db-eu, cdn-eu]
      timezone: "Europe/London"

    - id: apac
      name: "Asia Pacific"
      components: [api-apac, db-apac, cdn-apac]
      timezone: "Asia/Tokyo"

  # Auto-detect visitor region
  auto_detect: true
  default_region: us-east
\`\`\`

### Regional Component Mapping
| Component | US-East | US-West | EU | APAC |
|-----------|---------|---------|-----|------|
| API | api-us-e | api-us-w | api-eu | api-apac |
| Database | db-us-e | db-us-w | db-eu | db-apac |
| CDN | cdn-us | cdn-us | cdn-eu | cdn-apac |

### Regional Incident Display
\`\`\`
Global View:
┌─────────────────────────────────────────────┐
│ 🌍 Global Status: Partial Outage            │
├─────────────────────────────────────────────┤
│ US-East    ✅ Operational                   │
│ US-West    ⚠️ Degraded (CDN issues)        │
│ EU         ✅ Operational                   │
│ APAC       🔴 Major Outage (DB failover)   │
└─────────────────────────────────────────────┘
\`\`\`

### Visitor Region Detection
\`\`\`javascript
// Auto-redirect to regional status
const region = await StatusPage.detectRegion();
// Returns: { region: 'eu-west', country: 'UK', detected_via: 'geo-ip' }

// Show regional view
StatusPage.showRegion(region.region);
\`\`\`

### Regional Notifications
| Setting | Options |
|---------|---------|
| Notify global | All subscribers |
| Notify regional | Only affected region |
| Notify cross-region | Multi-region failures |`,
  },
  {
    question: "How do I handle planned vs unplanned downtime differently?",
    answer: `## Planned vs Unplanned Downtime Management

### Key Differences
| Aspect | Planned (Maintenance) | Unplanned (Incident) |
|--------|----------------------|----------------------|
| Notice | 7+ days advance | None (immediate) |
| Status | Scheduled | Investigating |
| Notification | Pre-scheduled | Real-time |
| SLA Impact | Usually excluded | Counted against SLA |
| Severity | By impact | By urgency |

### Planned Maintenance Flow
\`\`\`yaml
maintenance_workflow:
  # 1. Schedule maintenance
  schedule:
    advance_notice: "7 days"
    notification_channels: [email, status_page, slack]

  # 2. Pre-maintenance notifications
  notifications:
    - trigger: "7_days_before"
      channels: [email]
      template: maintenance_scheduled

    - trigger: "24_hours_before"
      channels: [email, status_page]
      template: maintenance_reminder

    - trigger: "1_hour_before"
      channels: [slack, status_page]
      template: maintenance_starting_soon

  # 3. During maintenance
  during:
    status: "under_maintenance"
    suppress_alerts: true
    auto_incidents: disabled

  # 4. Completion
  completion:
    auto_resolve: true
    notification: maintenance_completed
    verify_services: true
\`\`\`

### Unplanned Incident Flow
\`\`\`yaml
incident_workflow:
  # 1. Detection
  detection:
    sources: [monitors, alerts, reports]
    auto_create: true

  # 2. Immediate notification
  notifications:
    - trigger: "on_create"
      channels: [slack, pagerduty]
      template: incident_investigating

    - trigger: "on_update"
      channels: [email, status_page]
      template: incident_update

  # 3. During incident
  during:
    status_updates: "every_30_min"
    escalation_policy: active
    communication_lead: assigned

  # 4. Resolution
  resolution:
    notification: incident_resolved
    require_post_mortem: true
    post_mortem_deadline: "48h"
\`\`\`

### SLA Considerations
| Downtime Type | SLA Treatment | Configuration |
|---------------|---------------|---------------|
| Planned (announced >7d) | Excluded | sla_exempt: true |
| Planned (announced <7d) | Partial credit | sla_weight: 0.5 |
| Emergency maintenance | Included | sla_weight: 1.0 |
| Unplanned incident | Included | sla_weight: 1.0 |

### Status Display Differences
\`\`\`
Planned Maintenance:
┌────────────────────────────────────────────┐
│ 🔧 Scheduled Maintenance                   │
│                                            │
│ Database upgrade scheduled for             │
│ January 20, 02:00-04:00 UTC               │
│                                            │
│ Expected downtime: 15-30 minutes           │
│ Affected: Order processing, Reports        │
└────────────────────────────────────────────┘

Unplanned Incident:
┌────────────────────────────────────────────┐
│ 🔴 Service Disruption                      │
│                                            │
│ We are investigating issues with           │
│ payment processing.                        │
│                                            │
│ Started: 14:23 UTC                         │
│ Status: Investigating                      │
│ Last update: 5 minutes ago                 │
└────────────────────────────────────────────┘
\`\`\``,
  },
  {
    question: "Show me the post-mortem template and process",
    answer: `## Post-Mortem Template & Process

### Post-Mortem Timeline
| Step | Timing | Owner |
|------|--------|-------|
| Schedule review | Within 24h | Incident Commander |
| Draft post-mortem | Within 48h | Primary responder |
| Internal review | Within 72h | Team leads |
| Publish (internal) | Within 5 days | Engineering |
| Publish (external) | Within 7 days | Communications |

### Post-Mortem Template
\`\`\`markdown
# Post-Mortem: [Incident Title]

## Incident Summary
| Field | Value |
|-------|-------|
| Incident ID | INC-2024-0089 |
| Date | January 15, 2024 |
| Duration | 1 hour 22 minutes |
| Severity | Critical |
| Customer Impact | 15,000 users affected |

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 14:23 | Alerts triggered for payment failures |
| 14:25 | On-call engineer paged |
| 14:28 | Investigation started |
| 14:35 | Root cause identified |
| 14:52 | Fix deployed |
| 15:30 | Services restored |
| 15:45 | Incident resolved |

## Root Cause Analysis
[Detailed technical explanation of what caused the incident]

The payment gateway experienced connection timeouts due to...

## Impact Assessment
| Metric | Value |
|--------|-------|
| Failed transactions | 1,847 |
| Affected users | 15,000 |
| Revenue impact | $45,000 estimated |
| SLA impact | 0.05% reduction |

## What Went Well
- Alert fired within 2 minutes of issue
- Quick identification of root cause
- Clear communication to customers
- Effective team coordination

## What Went Wrong
- No automatic failover to backup gateway
- Monitoring didn't catch early warning signs
- Runbook was outdated

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| Implement payment failover | @alice | Jan 30 | P1 |
| Update monitoring thresholds | @bob | Jan 22 | P1 |
| Update runbook | @carol | Jan 20 | P2 |
| Add gateway health dashboard | @dave | Feb 1 | P2 |

## Lessons Learned
1. Single points of failure must have automated failover
2. Early warning metrics need lower thresholds
3. Regular runbook reviews are essential
\`\`\`

### Publishing Process
\`\`\`yaml
post_mortem:
  # Internal publication
  internal:
    channel: #engineering
    audience: all_engineers
    detail_level: full

  # External publication (sanitized)
  external:
    publish_to: status_page
    delay_hours: 48
    sanitize:
      - remove_internal_names
      - remove_exact_revenue
      - simplify_technical_details
\`\`\``,
  },
  {
    question: "How do I integrate status page with PagerDuty?",
    answer: `## PagerDuty Integration Setup

### Integration Overview
| Feature | Direction | Status |
|---------|-----------|--------|
| Incident sync | PagerDuty → Status Page | ✅ Supported |
| Manual trigger | Status Page → PagerDuty | ✅ Supported |
| Auto-resolve | Bidirectional | ✅ Supported |
| Component mapping | Configurable | ✅ Supported |

### Setup Steps

#### 1. Create PagerDuty Integration
\`\`\`bash
# In PagerDuty:
# - Go to Service Directory
# - Select your service
# - Add Integration → Events API v2
# - Copy the Integration Key
\`\`\`

#### 2. Configure Status Page
\`\`\`yaml
integrations:
  pagerduty:
    enabled: true
    integration_key: $PAGERDUTY_INTEGRATION_KEY
    subdomain: your-company

    # Sync PagerDuty incidents to status page
    sync_incidents:
      enabled: true
      services:
        - pd_service_id: P123ABC
          component_id: api
          auto_create: true
          severity_mapping:
            P1: critical
            P2: major
            P3: minor

    # Trigger PagerDuty from status page
    trigger_alerts:
      enabled: true
      escalation_policy: PXXXXXX
      severity_mapping:
        critical: P1
        major: P2
        minor: P3
\`\`\`

### Service Mapping
| PagerDuty Service | Status Page Component |
|-------------------|----------------------|
| Production API | api |
| Web Application | web |
| Database | database |
| Payment Service | payment |

### Bidirectional Sync
\`\`\`
PagerDuty Incident Created
         │
         ▼
    Status Page Incident Auto-Created
         │
         ▼
    Subscribers Notified
         │
         ▼
PagerDuty Incident Resolved
         │
         ▼
    Status Page Incident Auto-Resolved
\`\`\`

### API Configuration
\`\`\`bash
# Configure PagerDuty integration
curl -X POST /v2/status-page/integrations/pagerduty \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "integration_key": "your-integration-key",
    "service_mappings": [
      {"pagerduty_service": "P123ABC", "component": "api"}
    ],
    "auto_create_incidents": true,
    "auto_resolve": true
  }'
\`\`\`

### Webhook Events
| Event | PagerDuty → Status Page |
|-------|-------------------------|
| incident.triggered | Create incident |
| incident.acknowledged | Update status |
| incident.resolved | Resolve incident |
| incident.escalated | Add update |`,
  },
  {
    question: "What's the best way to communicate during a major outage?",
    answer: `## Major Outage Communication Playbook

### Communication Phases

#### Phase 1: Immediate (0-15 minutes)
\`\`\`
Priority: Speed over perfection

Actions:
1. Post initial status update
2. Notify internal stakeholders
3. Activate incident commander
4. Begin triage
\`\`\`

**Initial Message Template:**
\`\`\`markdown
🔴 **Major Service Disruption**

We are aware of issues affecting [service] and are
actively investigating.

**Impact:** [Brief description]
**Started:** [Time] UTC

We will provide updates every 15 minutes.
\`\`\`

#### Phase 2: Investigation (15-60 minutes)
\`\`\`
Priority: Regular updates

Actions:
1. Update every 15-30 minutes
2. Provide workarounds if available
3. Set customer expectations
4. Coordinate with support team
\`\`\`

**Progress Update Template:**
\`\`\`markdown
**Update - [Time] UTC**

Our team has identified [root cause summary].
We are actively working on [solution].

**Current workaround:** [If available]
**Estimated resolution:** [Time estimate or "investigating"]

Next update in 30 minutes.
\`\`\`

#### Phase 3: Resolution (Active fix)
\`\`\`
Priority: Clear timeline

Actions:
1. Communicate fix progress
2. Provide specific ETAs when known
3. Prepare recovery message
4. Ready customer support
\`\`\`

#### Phase 4: Post-Resolution
\`\`\`
Priority: Closure and follow-up

Actions:
1. Confirm full recovery
2. Thank customers
3. Commit to post-mortem
4. Schedule follow-up comms
\`\`\`

### Multi-Channel Strategy
| Channel | Audience | Frequency | Content |
|---------|----------|-----------|---------|
| Status Page | All | Real-time | Full updates |
| Email | Subscribers | Major updates | Summary |
| Twitter | Public | Key milestones | Brief |
| Slack (internal) | Teams | Continuous | Technical |
| Support | Customers | On request | Detailed |

### Escalation Communication
| Duration | Action |
|----------|--------|
| >30 min | Executive notification |
| >1 hour | Customer success outreach |
| >2 hours | Proactive customer emails |
| >4 hours | Executive customer calls |

### DO's and DON'Ts
| ✅ DO | ❌ DON'T |
|-------|---------|
| Update frequently | Go silent |
| Be honest | Speculate |
| Show empathy | Blame others |
| Provide workarounds | Make promises you can't keep |
| Give realistic ETAs | Hide severity |`,
  },
  {
    question: "How do I manage component status transitions?",
    answer: `## Component Status Transition Management

### Available Statuses
| Status | Color | Use When |
|--------|-------|----------|
| Operational | 🟢 Green | All systems functioning normally |
| Degraded Performance | 🟡 Yellow | Slower than normal, still functional |
| Partial Outage | 🟠 Orange | Some functionality unavailable |
| Major Outage | 🔴 Red | Complete service unavailable |
| Under Maintenance | 🔵 Blue | Planned maintenance in progress |

### Valid Transitions
\`\`\`
            ┌─────────────────────────────────────┐
            │                                     │
            ▼                                     │
    ┌───────────────┐                            │
    │  Operational  │◄────────────────────┐      │
    └───────┬───────┘                     │      │
            │                             │      │
    ┌───────▼───────┐              ┌──────┴────┐ │
    │   Degraded    │◄────────────►│  Partial  │ │
    └───────┬───────┘              └─────┬─────┘ │
            │                            │       │
            │      ┌─────────────────────┘       │
            │      │                             │
            ▼      ▼                             │
    ┌───────────────┐                           │
    │ Major Outage  │───────────────────────────┘
    └───────────────┘

    Maintenance: Can transition from/to any status
\`\`\`

### Transition Rules
\`\`\`yaml
status_transitions:
  operational:
    allowed_to: [degraded, partial_outage, major_outage, maintenance]
    requires_incident: false

  degraded:
    allowed_to: [operational, partial_outage, major_outage]
    requires_incident: true
    auto_escalate_after: "30m"  # To partial if not resolved

  partial_outage:
    allowed_to: [operational, degraded, major_outage]
    requires_incident: true
    auto_escalate_after: "15m"  # To major if getting worse

  major_outage:
    allowed_to: [operational, degraded, partial_outage]
    requires_incident: true
    notify_executives: true
    require_resolution_note: true

  maintenance:
    allowed_to: [operational]  # Only back to operational
    requires_maintenance_window: true
\`\`\`

### API Status Updates
\`\`\`bash
# Manual status update
curl -X PUT /v2/status-page/components/api/status \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "status": "degraded",
    "incident_id": "INC-2024-0089",
    "message": "Experiencing elevated latency"
  }'

# Bulk status update
curl -X PUT /v2/status-page/components/bulk-status \\
  -d '{
    "components": ["api", "web", "auth"],
    "status": "operational",
    "incident_id": "INC-2024-0089",
    "message": "Services restored"
  }'
\`\`\`

### Automatic Status Updates
\`\`\`yaml
automation:
  # Based on uptime monitors
  uptime_integration:
    api_monitor:
      component: api
      down_threshold: 3  # checks
      degraded_threshold: "response_time > 1000ms"

  # Based on error rates
  error_rate_integration:
    component: api
    degraded: "error_rate > 1%"
    partial_outage: "error_rate > 5%"
    major_outage: "error_rate > 50%"
\`\`\``,
  },
  {
    question: "How do I set up incident severity levels?",
    answer: `## Incident Severity Configuration

### Default Severity Levels
| Level | Name | Response Time | Example |
|-------|------|---------------|---------|
| 1 | Critical | 15 min | Complete service outage |
| 2 | Major | 30 min | Significant functionality impaired |
| 3 | Minor | 2 hours | Limited impact, workaround exists |
| 4 | Maintenance | N/A | Planned work |

### Severity Definitions
\`\`\`yaml
severity_levels:
  critical:
    id: 1
    name: "Critical"
    color: "#DC2626"  # Red
    description: "Complete service outage affecting all users"
    criteria:
      - "Service completely unavailable"
      - "Data loss risk"
      - "Security breach"
      - "Revenue impact >$10,000/hour"
    response:
      target_acknowledge: "5m"
      target_resolve: "1h"
      escalation: immediate
      notify: [pagerduty, slack-critical, executives]

  major:
    id: 2
    name: "Major"
    color: "#F59E0B"  # Orange
    description: "Significant functionality impaired"
    criteria:
      - "Core feature unavailable"
      - "Performance severely degraded (>5s response)"
      - "Affecting >25% of users"
      - "Revenue impact >$1,000/hour"
    response:
      target_acknowledge: "15m"
      target_resolve: "4h"
      escalation: "after_30m"
      notify: [pagerduty, slack-ops]

  minor:
    id: 3
    name: "Minor"
    color: "#EAB308"  # Yellow
    description: "Limited impact with workaround"
    criteria:
      - "Non-critical feature affected"
      - "Performance degraded but usable"
      - "Affecting <10% of users"
      - "Workaround available"
    response:
      target_acknowledge: "1h"
      target_resolve: "24h"
      escalation: "after_4h"
      notify: [slack-ops, email]

  maintenance:
    id: 4
    name: "Maintenance"
    color: "#3B82F6"  # Blue
    description: "Planned work"
    criteria:
      - "Scheduled in advance"
      - "Users notified"
      - "Time-boxed"
    response:
      target_acknowledge: "N/A"
      target_resolve: "per_schedule"
      notify: [status_page, email]
\`\`\`

### Severity Assessment Matrix
| User Impact | Revenue Impact | Data Risk | Severity |
|-------------|----------------|-----------|----------|
| 100% | High | Yes | Critical |
| >50% | High | No | Critical |
| >25% | Medium | No | Major |
| <25% | Low | No | Minor |
| 0% (planned) | None | No | Maintenance |

### Auto-Severity Detection
\`\`\`yaml
auto_severity:
  enabled: true
  rules:
    - condition: "error_rate > 50%"
      severity: critical

    - condition: "error_rate > 10%"
      severity: major

    - condition: "response_time_p99 > 5000ms"
      severity: major

    - condition: "error_rate > 1%"
      severity: minor
\`\`\`

### Severity Escalation
\`\`\`
minor ──30m──> major ──15m──> critical
                │
                └── if getting worse
\`\`\``,
  },
  {
    question: "What analytics are available for status page performance?",
    answer: `## Status Page Analytics Dashboard

### Overview Metrics
| Metric | Current | 30-Day Avg | Trend |
|--------|---------|------------|-------|
| Page Views | 45,678 | 38,000 | ↗ +20% |
| Unique Visitors | 12,345 | 10,500 | ↗ +18% |
| Avg Time on Page | 1m 23s | 1m 15s | ↗ +11% |
| Bounce Rate | 35% | 42% | ↘ -17% |
| Subscription Rate | 2.3% | 1.8% | ↗ +28% |

### Traffic Sources
| Source | Visitors | % of Total |
|--------|----------|------------|
| Direct | 8,500 | 45% |
| Search (Google) | 3,200 | 17% |
| Referral (docs) | 2,800 | 15% |
| Social (Twitter) | 1,500 | 8% |
| Email links | 1,200 | 6% |
| Other | 1,678 | 9% |

### Peak Traffic Analysis
\`\`\`
Visitors/hour during incidents:

Normal:    ████████████████ 450/hr
Minor:     ████████████████████████ 1,200/hr
Major:     ████████████████████████████████████████ 3,500/hr
Critical:  ████████████████████████████████████████████████████ 8,900/hr
\`\`\`

### Geographic Distribution
| Region | Visitors | Avg Load Time |
|--------|----------|---------------|
| North America | 55% | 0.8s |
| Europe | 25% | 1.2s |
| Asia Pacific | 15% | 1.8s |
| Other | 5% | 2.1s |

### Device & Browser Stats
| Device | % Users | Avg Session |
|--------|---------|-------------|
| Desktop | 68% | 1m 45s |
| Mobile | 28% | 0m 52s |
| Tablet | 4% | 1m 12s |

| Browser | % Users |
|---------|---------|
| Chrome | 62% |
| Safari | 18% |
| Firefox | 12% |
| Edge | 6% |
| Other | 2% |

### Incident Correlation
| Incident Severity | Traffic Spike | Subscriber Growth |
|-------------------|---------------|-------------------|
| Critical | +850% | +45 subs |
| Major | +340% | +18 subs |
| Minor | +80% | +5 subs |

### API Usage Analytics
| Endpoint | Calls/day | Avg Latency | Cache Hit |
|----------|-----------|-------------|-----------|
| GET /status | 125,000 | 45ms | 92% |
| GET /components | 45,000 | 62ms | 88% |
| GET /incidents | 23,000 | 78ms | 75% |
| Webhooks | 12,000 | 120ms | N/A |

### Report Export
\`\`\`bash
# Export analytics
curl /v2/status-page/analytics/export \\
  -d '{
    "period": "30d",
    "metrics": ["visitors", "subscriptions", "api_calls"],
    "format": "csv"
  }'
\`\`\``,
  },
];

export const STATUS_PAGE_CONVERSATION_TITLES = [
  "Current Service Status",
  "Recent Incidents",
  "Creating Incidents",
  "Affected Components",
  "Subscriber Analytics",
  "Maintenance Schedule",
  "Branding Configuration",
  "Incident Updates History",
  "Slack Integration",
  "Uptime History",
  "Display Metrics",
  "Component Dependencies",
  "Notification Delivery",
  "Public vs Private",
  "Communication Best Practices",
  "Component Groups",
  "Auto Incident Detection",
  "API Rate Limits",
  "Data Export",
  "Widget Embedding",
  "Regional Support",
  "Downtime Types",
  "Post-Mortem Process",
  "PagerDuty Integration",
  "Major Outage Communication",
  "Status Transitions",
  "Severity Levels",
  "Page Analytics",
];
