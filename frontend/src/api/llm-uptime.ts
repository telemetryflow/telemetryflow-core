/**
 * Uptime Monitoring Context Mock Data for LLM AI Insights
 * Contains 30 realistic Q&A pairs for uptime and availability analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const UPTIME_MOCK_DATA: MockQA[] = [
  {
    question: "What's the current uptime status of all production services?",
    answer: `## Production Services Uptime Status

### Overall Health
| Metric | Value |
|--------|-------|
| Total Monitors | 45 |
| Healthy | 41 (91.1%) |
| Degraded | 3 (6.7%) |
| Down | 1 (2.2%) |

### Service Status
| Service | Status | Uptime (30d) | Response Time | Last Check |
|---------|--------|--------------|---------------|------------|
| api.sinux.co.id | ✅ Up | 99.95% | 145ms | 30s ago |
| web.sinux.co.id | ✅ Up | 99.98% | 89ms | 30s ago |
| auth.sinux.co.id | ⚠️ Degraded | 99.21% | 890ms | 30s ago |
| payment.sinux.co.id | ✅ Up | 99.99% | 234ms | 30s ago |
| database.internal | ❌ Down | 98.45% | - | 2m ago |

### Incidents Today
| Time | Service | Duration | Impact |
|------|---------|----------|--------|
| 14:23 | database.internal | Ongoing | Critical |
| 09:15 | auth.sinux.co.id | 12 min | Degraded |
| 03:45 | web.sinux.co.id | 3 min | Minor |

### 30-Day Availability Summary
- **SLA Target:** 99.9%
- **Actual:** 99.72%
- **Downtime:** 2h 1m 14s
- **Incidents:** 8`,
  },
  {
    question: "Why did the API endpoint fail the health check?",
    answer: `## Health Check Failure Analysis: api.sinux.co.id/health

### Failure Details
| Metric | Value |
|--------|-------|
| Monitor | api-health-check |
| Endpoint | https://api.sinux.co.id/health |
| Method | GET |
| Expected Status | 200 |
| Actual Status | 503 |
| Response Time | 30,012ms (timeout) |

### Error Response
\`\`\`json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "connection timeout after 5000ms"
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 2
    },
    "external_api": {
      "status": "unhealthy",
      "error": "503 Service Unavailable"
    }
  }
}
\`\`\`

### Root Cause Analysis
1. **Primary:** Database connection timeout
2. **Secondary:** External API dependency failing
3. **Impact:** Health endpoint returning 503

### Failure Timeline
\`\`\`
14:23:00 - Health check started
14:23:05 - Database check timeout
14:23:05 - External API check failed
14:23:05 - Health endpoint returned 503
14:23:30 - Monitor marked endpoint as DOWN
\`\`\`

### Recommended Actions
1. Check database connection pool
2. Verify external API status
3. Review timeout configurations
4. Consider circuit breaker pattern`,
  },
  {
    question: "Show me the response time trends for the last 24 hours",
    answer: `## Response Time Analysis (24 Hours)

### Summary Statistics
| Service | Min | Avg | P95 | P99 | Max |
|---------|-----|-----|-----|-----|-----|
| api.sinux.co.id | 45ms | 145ms | 380ms | 890ms | 2.3s |
| web.sinux.co.id | 32ms | 89ms | 210ms | 456ms | 1.1s |
| auth.sinux.co.id | 89ms | 234ms | 890ms | 1.8s | 4.5s |
| payment.sinux.co.id | 120ms | 234ms | 456ms | 780ms | 1.5s |

### Hourly Response Time Trend
\`\`\`
Response Time (ms)
500 |                              ████
400 |                         █████████
300 |                    ██████████████
200 |           █████████████████████████
100 |██████████████████████████████████████████
    +------------------------------------------
    00:00    06:00    12:00    18:00    Now
              ▲              ▲
         Low traffic    Peak traffic
\`\`\`

### Performance Degradation Detected

**auth.sinux.co.id** showing elevated latency:
| Time Range | Avg Response | Change |
|------------|--------------|--------|
| 00:00-06:00 | 156ms | Baseline |
| 06:00-12:00 | 234ms | +50% |
| 12:00-18:00 | 567ms | +263% |
| 18:00-Now | 890ms | +470% |

### Recommendations
1. Investigate auth service performance
2. Check for memory leaks
3. Review database query performance
4. Consider adding caching layer`,
  },
  {
    question: "Which monitors have the most incidents this month?",
    answer: `## Monitor Incident Analysis (This Month)

### Top 10 Monitors by Incident Count
| Rank | Monitor | Incidents | Downtime | Avg Duration |
|------|---------|-----------|----------|--------------|
| 1 | legacy-api | 23 | 4h 32m | 11.8m |
| 2 | payment-webhook | 18 | 2h 15m | 7.5m |
| 3 | auth-service | 15 | 1h 48m | 7.2m |
| 4 | email-service | 12 | 1h 05m | 5.4m |
| 5 | cdn-origin | 9 | 45m | 5.0m |
| 6 | database-replica | 8 | 2h 30m | 18.8m |
| 7 | search-api | 7 | 35m | 5.0m |
| 8 | notification-svc | 6 | 28m | 4.7m |
| 9 | analytics-api | 5 | 22m | 4.4m |
| 10 | file-storage | 4 | 18m | 4.5m |

### Incident Patterns

#### legacy-api: Most Problematic
\`\`\`
Pattern: Regular failures during peak hours
Frequency: 3-4 incidents/day
Common Error: Connection timeout
Root Cause: Outdated infrastructure
\`\`\`

#### payment-webhook: Flapping
\`\`\`
Pattern: Brief outages, quick recovery
Frequency: 1-2 incidents/day
Common Error: 504 Gateway Timeout
Root Cause: Third-party dependency issues
\`\`\`

### Recommendations
| Service | Priority | Action |
|---------|----------|--------|
| legacy-api | Critical | Migrate to new infrastructure |
| payment-webhook | High | Add circuit breaker |
| auth-service | High | Scale horizontally |
| email-service | Medium | Review rate limits |`,
  },
  {
    question: "How do I configure SSL certificate monitoring?",
    answer: `## SSL Certificate Monitoring Configuration

### Current SSL Monitor Status
| Domain | Issuer | Expiry | Days Left | Status |
|--------|--------|--------|-----------|--------|
| api.sinux.co.id | Let's Encrypt | Mar 15 | 58 | ✅ Valid |
| web.sinux.co.id | DigiCert | Feb 28 | 43 | ✅ Valid |
| auth.sinux.co.id | Let's Encrypt | Feb 10 | 25 | ⚠️ Expiring |
| *.internal.com | Internal CA | Jan 28 | 12 | 🔴 Critical |

### SSL Monitor Configuration

\`\`\`yaml
# SSL Certificate Monitor
monitor:
  name: "API SSL Certificate"
  type: ssl
  target: api.sinux.co.id
  port: 443

  # Alert thresholds
  alerts:
    - days_before_expiry: 30
      severity: warning
    - days_before_expiry: 14
      severity: critical
    - days_before_expiry: 7
      severity: emergency

  # Check frequency
  interval: 6h  # Check every 6 hours

  # Validation options
  validation:
    verify_chain: true
    check_revocation: true
    min_tls_version: "1.2"
    allowed_algorithms:
      - RSA
      - ECDSA
\`\`\`

### SSL Health Checks
| Check | Description | Status |
|-------|-------------|--------|
| Certificate Valid | Not expired | ✅ |
| Chain Complete | Full chain present | ✅ |
| Not Revoked | OCSP/CRL check | ✅ |
| Strong Cipher | TLS 1.2+ | ✅ |
| Hostname Match | CN/SAN match | ✅ |

### Notification Setup
\`\`\`yaml
notifications:
  channels:
    - type: slack
      webhook: $SLACK_WEBHOOK
      events: [warning, critical]
    - type: email
      recipients: [ops@sinux.co.id]
      events: [critical, emergency]
    - type: pagerduty
      routing_key: $PD_KEY
      events: [emergency]
\`\`\``,
  },
  {
    question: "What's the global availability across all regions?",
    answer: `## Global Availability Report

### Regional Status
| Region | Monitors | Healthy | Availability | Avg Latency |
|--------|----------|---------|--------------|-------------|
| US-East | 15 | 15 | 99.98% | 45ms |
| US-West | 12 | 11 | 99.85% | 52ms |
| EU-West | 10 | 10 | 99.95% | 89ms |
| EU-Central | 8 | 8 | 99.92% | 78ms |
| APAC-Tokyo | 6 | 5 | 99.45% | 156ms |
| APAC-Sydney | 4 | 4 | 99.88% | 178ms |

### Global Availability Map
\`\`\`
                    ┌─────────────────────────────────────┐
                    │           GLOBAL STATUS             │
                    │         Availability: 99.84%        │
                    └─────────────────────────────────────┘

    US-West          US-East           EU             APAC
    ┌─────┐         ┌─────┐         ┌─────┐         ┌─────┐
    │ 99% │ ─────── │ 99% │ ─────── │ 99% │ ─────── │ 99% │
    │ ⚠️  │         │ ✅  │         │ ✅  │         │ ⚠️  │
    └─────┘         └─────┘         └─────┘         └─────┘
\`\`\`

### Regional Issues

#### US-West (99.85%)
- **Issue:** CDN edge node degraded
- **Impact:** 15% increased latency
- **Status:** Investigating

#### APAC-Tokyo (99.45%)
- **Issue:** Database replica lag
- **Impact:** Intermittent timeouts
- **Status:** Mitigating

### Cross-Region Latency Matrix
| From → To | US-East | US-West | EU-West | APAC |
|-----------|---------|---------|---------|------|
| US-East | 2ms | 65ms | 85ms | 180ms |
| US-West | 65ms | 2ms | 145ms | 120ms |
| EU-West | 85ms | 145ms | 2ms | 240ms |
| APAC | 180ms | 120ms | 240ms | 2ms |`,
  },
  {
    question: "Create an uptime report for the executive summary",
    answer: `## Executive Uptime Summary Report

### Period: January 2024

---

### Key Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Overall Availability | 99.87% | 99.9% | ⚠️ Below target |
| Total Downtime | 57m 14s | <43m | ⚠️ Exceeded |
| Incidents | 12 | <10 | ⚠️ Above target |
| MTTR | 4.8m | <5m | ✅ On target |
| MTTD | 1.2m | <2m | ✅ On target |

---

### Service Level Summary
| Service Tier | SLA | Actual | Gap | Status |
|--------------|-----|--------|-----|--------|
| Tier 1 (Critical) | 99.99% | 99.95% | -0.04% | ⚠️ |
| Tier 2 (Important) | 99.9% | 99.92% | +0.02% | ✅ |
| Tier 3 (Standard) | 99.5% | 99.78% | +0.28% | ✅ |

---

### Monthly Trend
\`\`\`
Availability %
99.95 |    █    █         █    █
99.90 | █  █ █  █    █    █ █  █ █
99.85 | █  █ █  █ █  █    █ █  █ █  █
99.80 | █  █ █  █ █  █    █ █  █ █  █
99.75 | █  █ █  █ █  █ █  █ █  █ █  █
      +--------------------------------
       Oct  Nov  Dec  Jan
\`\`\`

---

### Top Incidents
| Date | Service | Duration | Impact | Resolution |
|------|---------|----------|--------|------------|
| Jan 15 | Payment API | 23m | Revenue loss | DB failover |
| Jan 08 | Auth Service | 18m | Login blocked | Memory leak fix |
| Jan 03 | CDN | 12m | Slow loading | Cache purge |

---

### Recommendations
1. **Infrastructure:** Upgrade legacy-api to reduce incidents
2. **Monitoring:** Add synthetic monitoring for critical paths
3. **Process:** Implement automated failover for databases
4. **Budget:** Allocate $50K for HA improvements`,
  },
  {
    question: "Why is the synthetic monitoring test failing?",
    answer: `## Synthetic Monitor Failure Analysis

### Failed Test: checkout-flow-e2e
| Metric | Value |
|--------|-------|
| Test Name | checkout-flow-e2e |
| Type | Multi-step Browser |
| Location | US-East, EU-West |
| Frequency | 5 minutes |
| Last Success | 2 hours ago |
| Consecutive Failures | 24 |

### Test Steps & Results
| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1 | Navigate to /products | 200 OK | 200 OK | ✅ Pass |
| 2 | Click "Add to Cart" | Cart updated | Cart updated | ✅ Pass |
| 3 | Navigate to /checkout | 200 OK | 200 OK | ✅ Pass |
| 4 | Fill payment form | Form valid | Form valid | ✅ Pass |
| 5 | Submit payment | 200 OK | 500 Error | ❌ Fail |
| 6 | Verify confirmation | Order ID | - | ⏭️ Skipped |

### Error Details
\`\`\`javascript
// Step 5 failure
{
  "step": "Submit payment",
  "url": "https://api.sinux.co.id/v1/orders",
  "method": "POST",
  "status": 500,
  "response": {
    "error": "PaymentProcessingError",
    "message": "Unable to connect to payment gateway",
    "code": "GATEWAY_TIMEOUT"
  },
  "screenshot": "s3://monitors/checkout-flow-e2e/step5-failure.png",
  "timing": {
    "dns": 12,
    "connect": 45,
    "tls": 89,
    "wait": 30012,
    "total": 30158
  }
}
\`\`\`

### Correlation
| Related Monitor | Status | Correlation |
|-----------------|--------|-------------|
| payment-gateway | ❌ Down | Strong |
| stripe-webhook | ⚠️ Degraded | Strong |
| api-health | ✅ Up | None |

### Resolution
1. Payment gateway is experiencing outage
2. Stripe status page shows degraded
3. Enable fallback payment provider
4. Alert customers via status page`,
  },
  {
    question: "Compare uptime performance between HTTP and TCP monitors",
    answer: `## Monitor Type Performance Comparison

### HTTP vs TCP Monitor Statistics
| Metric | HTTP Monitors | TCP Monitors |
|--------|---------------|--------------|
| Total Monitors | 32 | 13 |
| Avg Availability | 99.85% | 99.92% |
| Avg Response Time | 234ms | 45ms |
| False Positives (30d) | 23 | 8 |
| Incidents Detected | 45 | 18 |

### Detailed Comparison

#### HTTP Monitors
\`\`\`
Advantages:
✅ Application-level health verification
✅ Content validation support
✅ Header/response body checks
✅ Multi-step transaction testing

Disadvantages:
❌ Higher false positive rate
❌ Slower response times
❌ More complex configuration
❌ Dependent on application logic
\`\`\`

#### TCP Monitors
\`\`\`
Advantages:
✅ Lower latency checks
✅ Fewer false positives
✅ Simple configuration
✅ Infrastructure-level monitoring

Disadvantages:
❌ No application health insight
❌ Can't detect partial failures
❌ No content validation
❌ May miss application errors
\`\`\`

### Response Time Distribution
| Percentile | HTTP | TCP | Difference |
|------------|------|-----|------------|
| P50 | 145ms | 23ms | 6.3x slower |
| P90 | 456ms | 67ms | 6.8x slower |
| P99 | 1.2s | 189ms | 6.3x slower |

### Recommendation by Service Type
| Service Type | Recommended Monitor |
|--------------|---------------------|
| Web application | HTTP (health endpoint) |
| Database | TCP (port check) |
| Cache (Redis) | TCP (port check) |
| Message queue | TCP + HTTP (admin API) |
| API endpoint | HTTP (with validation) |
| Load balancer | HTTP (health check) |
| DNS | DNS query monitor |

### Optimal Configuration
\`\`\`yaml
# Combine both for comprehensive coverage
monitors:
  - name: api-tcp
    type: tcp
    target: api.sinux.co.id
    port: 443
    interval: 30s  # Fast, frequent checks

  - name: api-http
    type: http
    target: https://api.sinux.co.id/health
    interval: 60s  # Slower, detailed checks
    validation:
      status: 200
      body_contains: "healthy"
\`\`\``,
  },
  {
    question: "What alerting rules should I configure for critical services?",
    answer: `## Critical Service Alerting Configuration

### Alert Rule Templates

#### Tier 1: Business Critical
\`\`\`yaml
monitor:
  name: payment-api
  tier: critical

alerts:
  # Immediate alert on first failure
  - condition: status != "up"
    threshold: 1
    window: 0
    severity: critical
    channels: [pagerduty, slack-critical, sms]

  # Performance degradation
  - condition: response_time > 500ms
    threshold: 3  # 3 consecutive checks
    window: 5m
    severity: warning
    channels: [slack-ops]

  # Availability dropping
  - condition: availability_1h < 99.9%
    severity: critical
    channels: [pagerduty, email-exec]
\`\`\`

#### Tier 2: Important Services
\`\`\`yaml
monitor:
  name: user-service
  tier: important

alerts:
  # Alert after 2 failures
  - condition: status != "up"
    threshold: 2
    window: 2m
    severity: high
    channels: [slack-ops, email]

  # Performance degradation
  - condition: response_time > 1000ms
    threshold: 5
    window: 10m
    severity: warning
    channels: [slack-ops]
\`\`\`

#### Tier 3: Standard Services
\`\`\`yaml
monitor:
  name: docs-site
  tier: standard

alerts:
  # Alert after 3 failures
  - condition: status != "up"
    threshold: 3
    window: 5m
    severity: medium
    channels: [slack-general, email]
\`\`\`

### Alert Routing Matrix
| Severity | PagerDuty | Slack | Email | SMS |
|----------|-----------|-------|-------|-----|
| Critical | ✅ Immediate | #critical | Exec team | On-call |
| High | ✅ 5m delay | #ops | Ops team | - |
| Warning | - | #ops | Ops team | - |
| Info | - | #monitoring | - | - |

### Escalation Policy
\`\`\`yaml
escalation:
  levels:
    - delay: 0m
      notify: [on-call-primary]
    - delay: 5m
      notify: [on-call-secondary]
    - delay: 15m
      notify: [team-lead]
    - delay: 30m
      notify: [engineering-manager]
    - delay: 60m
      notify: [vp-engineering]
\`\`\`

### Alert Suppression Rules
| Rule | Condition | Duration |
|------|-----------|----------|
| Maintenance | scheduled_maintenance = true | Until window ends |
| Flapping | >5 state changes in 10m | 30 minutes |
| Known Issue | incident_acknowledged = true | Until resolved |`,
  },
  {
    question: "Show me the maintenance window schedule and impact",
    answer: `## Maintenance Windows Overview

### Upcoming Maintenance
| ID | Service | Window | Duration | Impact |
|----|---------|--------|----------|--------|
| MW-234 | database-primary | Jan 20, 02:00-04:00 UTC | 2h | High |
| MW-235 | api-gateway | Jan 22, 03:00-03:30 UTC | 30m | Medium |
| MW-236 | cdn-refresh | Jan 25, 00:00-02:00 UTC | 2h | Low |
| MW-237 | k8s-upgrade | Jan 28, 01:00-05:00 UTC | 4h | Critical |

### Maintenance Window Details

#### MW-234: Database Primary Maintenance
\`\`\`yaml
maintenance:
  id: MW-234
  type: planned
  service: database-primary
  start: "2024-01-20T02:00:00Z"
  end: "2024-01-20T04:00:00Z"

  impact:
    services_affected:
      - api-service (read/write)
      - user-service (read/write)
      - analytics (read)
    expected_downtime: 15-30 minutes
    degradation_period: 2 hours

  notifications:
    - 7_days_before: email_all_users
    - 24_hours_before: status_page_notice
    - 1_hour_before: slack_announcement
    - start: status_page_incident

  monitoring:
    suppress_alerts: true
    monitors_affected:
      - database-health
      - api-health
      - user-service-health
\`\`\`

### Past Maintenance Impact Analysis
| Window | Planned Duration | Actual Duration | Variance |
|--------|------------------|-----------------|----------|
| MW-230 | 2h | 2h 15m | +15m |
| MW-231 | 1h | 45m | -15m |
| MW-232 | 30m | 32m | +2m |
| MW-233 | 4h | 3h 45m | -15m |

### Maintenance Best Practices
| Practice | Status |
|----------|--------|
| Scheduled during low traffic | ✅ |
| Status page updated | ✅ |
| Rollback plan ready | ✅ |
| Alert suppression configured | ✅ |
| Customer notification sent | ✅ |

### Traffic During Maintenance Windows
\`\`\`
Requests/min (typical Saturday 02:00 UTC)

2000 |
1500 |
1000 |███
 500 |███████
   0 |████████████████
     01:00  02:00  03:00  04:00
                 ↑
         Maintenance Window
\`\`\``,
  },
  {
    question: "How do I set up multi-location monitoring?",
    answer: `## Multi-Location Monitoring Configuration

### Available Monitoring Locations
| Region | Location | Latency to US | Status |
|--------|----------|---------------|--------|
| North America | Virginia (US-East) | 0ms | ✅ Active |
| North America | Oregon (US-West) | 65ms | ✅ Active |
| North America | Toronto (CA) | 25ms | ✅ Active |
| Europe | London (EU-West) | 85ms | ✅ Active |
| Europe | Frankfurt (EU-Central) | 95ms | ✅ Active |
| Asia Pacific | Tokyo (APAC-NE) | 160ms | ✅ Active |
| Asia Pacific | Sydney (APAC-SE) | 180ms | ✅ Active |
| Asia Pacific | Singapore (APAC-S) | 200ms | ✅ Active |

### Multi-Location Monitor Configuration

\`\`\`yaml
monitor:
  name: api-global
  type: http
  target: https://api.sinux.co.id/health

  locations:
    enabled:
      - us-east
      - us-west
      - eu-west
      - apac-tokyo
    minimum_locations: 2  # At least 2 must be available

  check_settings:
    interval: 60s
    timeout: 10s
    follow_redirects: true
    verify_ssl: true

  # Location-specific settings
  location_overrides:
    apac-tokyo:
      timeout: 15s  # Higher latency expected
    apac-sydney:
      timeout: 15s

  # Consensus-based alerting
  alerting:
    trigger_on: consensus
    consensus_threshold: 50%  # Alert if 50%+ locations fail
    # Or use 'any' to alert on any single location failure

  # Per-location baselines
  baselines:
    us-east:
      response_time_p95: 150ms
    eu-west:
      response_time_p95: 200ms
    apac-tokyo:
      response_time_p95: 350ms
\`\`\`

### Geographic Performance Analysis
| Location | P50 | P95 | P99 | Success Rate |
|----------|-----|-----|-----|--------------|
| US-East | 45ms | 120ms | 280ms | 99.98% |
| US-West | 52ms | 145ms | 310ms | 99.95% |
| EU-West | 89ms | 210ms | 456ms | 99.92% |
| APAC-Tokyo | 156ms | 340ms | 780ms | 99.88% |

### Benefits of Multi-Location
1. **Detect regional outages** - CDN or DNS issues
2. **Reduce false positives** - Consensus-based alerting
3. **Monitor user experience** - From customer locations
4. **Identify performance issues** - By geography`,
  },
  {
    question: "What's causing the flapping behavior on the web monitor?",
    answer: `## Monitor Flapping Analysis: web.sinux.co.id

### Flapping Statistics
| Metric | Value |
|--------|-------|
| Monitor | web-health-check |
| Flapping Period | Last 6 hours |
| State Changes | 47 |
| Up → Down | 24 |
| Down → Up | 23 |
| Avg Down Duration | 2m 15s |
| Avg Up Duration | 12m 30s |

### Flapping Timeline
\`\`\`
State
  UP |█████   ████   █████   ████   █████████
DOWN |     ███    ███     ███    ███
     +----------------------------------------
     12:00    14:00    16:00    18:00    Now
\`\`\`

### Root Cause Analysis

#### Pattern Analysis
| Time | Status | Response | Cause |
|------|--------|----------|-------|
| 12:15 | Down | Timeout | High load |
| 12:17 | Up | 234ms | Load decreased |
| 12:32 | Down | 503 | App restart |
| 12:34 | Up | 189ms | App recovered |
| 12:48 | Down | Timeout | Memory pressure |

#### Identified Issues
1. **Memory Leak**
   - Memory grows over 10-15 minute cycles
   - Triggers OOM killer or slow responses
   - App restarts, temporarily recovers

2. **Aggressive Timeout**
   - Current timeout: 5s
   - P99 response during load: 8s
   - Monitor times out during high load

3. **Single Instance Check**
   - Only checking one backend
   - Load balancer rotates unhealthy instance

### Solutions

\`\`\`yaml
# Adjust monitor configuration
monitor:
  name: web-health-check
  timeout: 15s          # Increase timeout (was 5s)
  interval: 60s         # Reduce frequency (was 30s)

  # Add flap detection
  flap_detection:
    enabled: true
    window: 30m
    threshold: 5          # 5 state changes = flapping
    stabilization: 10m    # Wait 10m before alerting again

  # Check multiple backends
  targets:
    - https://web-1.sinux.co.id/health
    - https://web-2.sinux.co.id/health
    - https://web-3.sinux.co.id/health
  success_threshold: 2    # 2 of 3 must be up
\`\`\`

### Application Fix Required
\`\`\`bash
# Investigate memory leak
kubectl top pods -l app=web
kubectl logs -l app=web --tail=1000 | grep -i "memory\\|oom"
\`\`\``,
  },
  {
    question: "Compare the availability SLAs across different service tiers",
    answer: `## Service Tier SLA Comparison

### SLA Definitions by Tier
| Tier | SLA Target | Max Downtime/Month | Response Time |
|------|------------|-------------------|---------------|
| Platinum | 99.99% | 4m 23s | <100ms P95 |
| Gold | 99.95% | 21m 54s | <250ms P95 |
| Silver | 99.9% | 43m 50s | <500ms P95 |
| Bronze | 99.5% | 3h 39m | <1000ms P95 |

### Current Performance vs SLA
| Service | Tier | SLA | Actual | Gap | Status |
|---------|------|-----|--------|-----|--------|
| payment-api | Platinum | 99.99% | 99.985% | -0.005% | ⚠️ At Risk |
| user-api | Gold | 99.95% | 99.97% | +0.02% | ✅ Met |
| auth-api | Gold | 99.95% | 99.92% | -0.03% | ❌ Breach |
| search-api | Silver | 99.9% | 99.94% | +0.04% | ✅ Met |
| analytics-api | Bronze | 99.5% | 99.78% | +0.28% | ✅ Met |

### Monthly Trend by Tier
\`\`\`
Availability %
100.0 |
99.95 |████  Platinum Target
99.90 |████████  Gold Target
99.85 |████████████
99.80 |████████████████
99.75 |████████████████████
      +--------------------
       Oct  Nov  Dec  Jan

█ Platinum  █ Gold  █ Silver  █ Bronze
\`\`\`

### SLA Credit Calculation
| Service | SLA Breach | Downtime | Credit % |
|---------|------------|----------|----------|
| auth-api | 99.92% < 99.95% | 35m | 10% |

### Tier Requirements
| Requirement | Platinum | Gold | Silver | Bronze |
|-------------|----------|------|--------|--------|
| Multi-region | ✅ Required | ✅ Required | Optional | - |
| Auto-failover | ✅ Required | ✅ Required | ✅ Required | - |
| Load balancing | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| Backup frequency | 15 min | 1 hour | 4 hours | Daily |
| RTO | 5 min | 15 min | 1 hour | 4 hours |
| RPO | 0 | 15 min | 1 hour | 4 hours |

### Cost vs SLA
| Tier | Monthly Cost | Cost per 9 |
|------|--------------|------------|
| Platinum (99.99%) | $15,000 | $3,750 |
| Gold (99.95%) | $8,000 | $2,000 |
| Silver (99.9%) | $4,000 | $1,333 |
| Bronze (99.5%) | $2,000 | $1,000 |`,
  },
  {
    question: "How do I configure API endpoint monitoring with authentication?",
    answer: `## Authenticated API Monitoring Configuration

### Authentication Methods Supported
| Method | Use Case | Security Level |
|--------|----------|----------------|
| API Key (Header) | Internal APIs | Medium |
| Bearer Token | OAuth2/JWT | High |
| Basic Auth | Legacy systems | Low |
| OAuth2 Client Credentials | External APIs | High |
| AWS Signature V4 | AWS services | High |

### Configuration Examples

#### API Key Authentication
\`\`\`yaml
monitor:
  name: internal-api
  type: http
  method: GET
  target: https://api.internal/v1/health

  authentication:
    type: api_key
    header: X-API-Key
    value: $API_KEY  # Reference secret

  # Or in query parameter
  # authentication:
  #   type: api_key
  #   query_param: api_key
  #   value: $API_KEY
\`\`\`

#### Bearer Token (JWT)
\`\`\`yaml
monitor:
  name: oauth-protected-api
  type: http
  target: https://api.sinux.co.id/v1/users

  authentication:
    type: bearer
    token: $JWT_TOKEN

    # Or with auto-refresh
    token_endpoint: https://auth.sinux.co.id/oauth/token
    client_id: $CLIENT_ID
    client_secret: $CLIENT_SECRET
    scope: "read:users"
\`\`\`

#### OAuth2 Client Credentials
\`\`\`yaml
monitor:
  name: external-partner-api
  type: http
  target: https://partner-api.sinux.co.id/v1/status

  authentication:
    type: oauth2_client_credentials
    token_url: https://partner-api.sinux.co.id/oauth/token
    client_id: $PARTNER_CLIENT_ID
    client_secret: $PARTNER_CLIENT_SECRET
    scope: "api:read"

  # Token caching
  token_cache:
    enabled: true
    refresh_before_expiry: 60s
\`\`\`

### Request Signing (AWS)
\`\`\`yaml
monitor:
  name: aws-api-gateway
  type: http
  target: https://api-id.execute-api.us-east-1.amazonaws.com/prod/health

  authentication:
    type: aws_signature_v4
    access_key: $AWS_ACCESS_KEY
    secret_key: $AWS_SECRET_KEY
    region: us-east-1
    service: execute-api
\`\`\`

### Security Best Practices
| Practice | Implementation |
|----------|----------------|
| Store credentials securely | Use secret management |
| Rotate credentials | Automate rotation |
| Minimal permissions | Least privilege access |
| Audit access | Log all API calls |
| Use HTTPS only | Enforce TLS 1.2+ |`,
  },
  {
    question: "What's the impact of the recent outage on our SLA?",
    answer: `## Outage Impact Analysis

### Outage Summary
| Metric | Value |
|--------|-------|
| Incident ID | INC-2024-0115 |
| Service | payment-api |
| Start Time | Jan 15, 14:23 UTC |
| End Time | Jan 15, 15:08 UTC |
| Duration | 45 minutes |
| Severity | Critical |

### SLA Impact Calculation

#### Before Outage (Jan 1-14)
\`\`\`
Uptime: 20,160 minutes
Downtime: 8 minutes
Availability: 99.96%
\`\`\`

#### After Outage (Jan 1-15)
\`\`\`
Uptime: 21,600 minutes
Downtime: 53 minutes (8 + 45)
Availability: 99.75%
\`\`\`

### Monthly SLA Projection
| Scenario | Projected Availability | SLA Status |
|----------|------------------------|------------|
| No more outages | 99.88% | ⚠️ At Risk |
| One more 15m outage | 99.85% | ❌ Breach |
| Two more 15m outages | 99.81% | ❌ Breach |

### SLA Credit Liability
| SLA Tier | Target | Actual | Shortfall | Credit |
|----------|--------|--------|-----------|--------|
| Platinum | 99.99% | 99.75% | 0.24% | 25% |
| Gold | 99.95% | 99.75% | 0.20% | 20% |
| Silver | 99.9% | 99.75% | 0.15% | 15% |

### Affected Customers
| Tier | Customers | Monthly Revenue | Potential Credit |
|------|-----------|-----------------|------------------|
| Platinum | 12 | $180,000 | $45,000 |
| Gold | 45 | $270,000 | $54,000 |
| Silver | 120 | $180,000 | $27,000 |
| **Total** | **177** | **$630,000** | **$126,000** |

### Error Budget Consumption
\`\`\`
Error Budget (99.95% SLA)

Month Start: 21m 54s available
Used before: 8m (37%)
This outage: 45m (206%)
Remaining: -31m 6s (EXCEEDED)

████████████████████████████████░░░░░░░░ EXCEEDED
0%                            100%    206%
\`\`\`

### Recovery Actions
1. ✅ Service restored at 15:08 UTC
2. ✅ Root cause identified (DB connection pool exhaustion)
3. ⏳ Post-mortem scheduled for Jan 16
4. ⏳ Customer communications sent
5. ⏳ SLA credit processing initiated`,
  },
  {
    question: "Show me the webhook notification configuration",
    answer: `## Webhook Notification Configuration

### Active Webhooks
| Name | URL | Events | Status |
|------|-----|--------|--------|
| slack-ops | hooks.slack.com/... | all | ✅ Active |
| pagerduty | events.pagerduty.com/... | critical | ✅ Active |
| custom-dashboard | internal.sinux.co.id/hooks | all | ✅ Active |
| discord-alerts | discord.com/api/webhooks/... | down,up | ⚠️ Failing |

### Webhook Configuration

#### Slack Integration
\`\`\`yaml
webhook:
  name: slack-ops
  url: https://hooks.slack.com/services/T00/B00/xxx
  method: POST
  headers:
    Content-Type: application/json

  # Event filtering
  events:
    - monitor.down
    - monitor.up
    - monitor.degraded
    - incident.created
    - incident.resolved

  # Payload template
  payload: |
    {
      "channel": "#ops-alerts",
      "username": "UptimeBot",
      "icon_emoji": ":robot_face:",
      "attachments": [{
        "color": "{{ if eq .Status "down" }}danger{{ else }}good{{ end }}",
        "title": "{{ .MonitorName }} is {{ .Status }}",
        "fields": [
          {"title": "URL", "value": "{{ .URL }}", "short": true},
          {"title": "Response Time", "value": "{{ .ResponseTime }}ms", "short": true},
          {"title": "Location", "value": "{{ .Location }}", "short": true},
          {"title": "Error", "value": "{{ .Error }}", "short": false}
        ],
        "footer": "Nusametric Uptime",
        "ts": {{ .Timestamp }}
      }]
    }
\`\`\`

#### PagerDuty Integration
\`\`\`yaml
webhook:
  name: pagerduty
  url: https://events.pagerduty.com/v2/enqueue

  events:
    - monitor.down  # Trigger incident
    - monitor.up    # Resolve incident

  payload: |
    {
      "routing_key": "$PAGERDUTY_KEY",
      "event_action": "{{ if eq .Status "down" }}trigger{{ else }}resolve{{ end }}",
      "dedup_key": "{{ .MonitorID }}",
      "payload": {
        "summary": "{{ .MonitorName }} is {{ .Status }}",
        "severity": "{{ .Severity }}",
        "source": "{{ .URL }}",
        "custom_details": {
          "response_time": "{{ .ResponseTime }}",
          "status_code": "{{ .StatusCode }}",
          "location": "{{ .Location }}"
        }
      }
    }
\`\`\`

### Webhook Delivery Status
| Webhook | Last 24h | Success | Failed | Avg Latency |
|---------|----------|---------|--------|-------------|
| slack-ops | 156 | 156 | 0 | 234ms |
| pagerduty | 12 | 12 | 0 | 189ms |
| custom-dashboard | 156 | 154 | 2 | 456ms |
| discord-alerts | 156 | 89 | 67 | 1.2s |

### Failed Webhook: discord-alerts
\`\`\`
Error: HTTP 429 Too Many Requests
Rate Limit: 50 requests per minute
Current Rate: 78 requests per minute

Fix: Add rate limiting to webhook
\`\`\``,
  },
  {
    question: "How do I monitor DNS resolution and propagation?",
    answer: `## DNS Monitoring Configuration

### DNS Monitor Types
| Type | Use Case | Check Frequency |
|------|----------|-----------------|
| A Record | IP resolution | 1 minute |
| AAAA Record | IPv6 resolution | 5 minutes |
| CNAME | Alias verification | 5 minutes |
| MX | Email routing | 15 minutes |
| TXT | SPF/DKIM verification | 15 minutes |
| NS | Nameserver health | 5 minutes |

### Current DNS Monitors
| Domain | Record | Expected | Actual | Status |
|--------|--------|----------|--------|--------|
| api.sinux.co.id | A | 52.1.2.3 | 52.1.2.3 | ✅ Match |
| www.sinux.co.id | CNAME | cdn.example.net | cdn.example.net | ✅ Match |
| sinux.co.id | MX | mail.sinux.co.id | mail.sinux.co.id | ✅ Match |
| sinux.co.id | TXT | v=spf1... | v=spf1... | ✅ Match |
| old.sinux.co.id | A | (deprecated) | 52.1.2.3 | ⚠️ Unexpected |

### DNS Monitor Configuration

\`\`\`yaml
monitor:
  name: api-dns
  type: dns
  domain: api.sinux.co.id

  queries:
    - record_type: A
      expected_values:
        - 52.1.2.3
        - 52.1.2.4  # Multiple IPs for load balancing

    - record_type: AAAA
      expected_values:
        - 2001:db8::1

  settings:
    timeout: 5s
    retries: 3
    nameservers:
      - 8.8.8.8      # Google DNS
      - 1.1.1.1      # Cloudflare DNS
      - 208.67.222.222  # OpenDNS

  # Alert on propagation issues
  propagation:
    check_global: true
    locations:
      - us-east
      - eu-west
      - apac-tokyo
    consistency_threshold: 100%  # All must match

  alerts:
    - condition: record_mismatch
      severity: critical
    - condition: resolution_timeout
      severity: warning
    - condition: propagation_incomplete
      severity: warning
\`\`\`

### DNS Propagation Check
| Location | Nameserver | Result | TTL | Status |
|----------|------------|--------|-----|--------|
| US-East | ns1.sinux.co.id | 52.1.2.3 | 300 | ✅ |
| US-West | ns2.sinux.co.id | 52.1.2.3 | 300 | ✅ |
| EU-West | 8.8.8.8 | 52.1.2.3 | 298 | ✅ |
| APAC | 1.1.1.1 | 52.1.2.4 | 300 | ⚠️ Stale |

### DNS Performance Metrics
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Resolution Time (avg) | 23ms | <50ms | ✅ |
| Resolution Time (p99) | 89ms | <200ms | ✅ |
| Query Success Rate | 99.98% | >99.9% | ✅ |
| Propagation Time | 15m | <30m | ✅ |`,
  },
  {
    question: "What's the status of our real user monitoring (RUM)?",
    answer: `## Real User Monitoring (RUM) Status

### Overview
| Metric | Value | Trend |
|--------|-------|-------|
| Active Sessions | 12,450 | ↗ +5% |
| Page Views (24h) | 1.2M | → Stable |
| Unique Users (24h) | 45,678 | ↗ +3% |
| Error Rate | 0.8% | ↘ -0.2% |

### Core Web Vitals
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP (Largest Contentful Paint) | 2.1s | <2.5s | ✅ Good |
| FID (First Input Delay) | 45ms | <100ms | ✅ Good |
| CLS (Cumulative Layout Shift) | 0.08 | <0.1 | ✅ Good |
| TTFB (Time to First Byte) | 380ms | <500ms | ✅ Good |
| FCP (First Contentful Paint) | 1.2s | <1.8s | ✅ Good |

### Performance by Page
| Page | LCP | FID | CLS | Traffic |
|------|-----|-----|-----|---------|
| / (Home) | 1.8s | 32ms | 0.05 | 35% |
| /products | 2.4s | 56ms | 0.12 | 25% |
| /checkout | 2.8s | 89ms | 0.08 | 15% |
| /account | 1.5s | 28ms | 0.03 | 12% |
| /search | 3.2s | 120ms | 0.15 | 13% |

### Performance by Device
| Device | Sessions | LCP | FID | CLS |
|--------|----------|-----|-----|-----|
| Desktop | 45% | 1.8s | 32ms | 0.06 |
| Mobile | 48% | 2.8s | 78ms | 0.12 |
| Tablet | 7% | 2.2s | 45ms | 0.09 |

### Performance by Geography
| Region | Users | LCP | TTFB | Error Rate |
|--------|-------|-----|------|------------|
| North America | 45% | 1.9s | 320ms | 0.6% |
| Europe | 30% | 2.1s | 380ms | 0.7% |
| Asia Pacific | 18% | 2.8s | 520ms | 1.2% |
| Other | 7% | 3.2s | 680ms | 1.5% |

### Top Errors
| Error | Count | Pages Affected | Impact |
|-------|-------|----------------|--------|
| ChunkLoadError | 234 | /checkout, /products | High |
| TypeError: null | 156 | /search | Medium |
| NetworkError | 89 | All | Low |
| TimeoutError | 67 | /api/* | Medium |

### Recommendations
1. **Optimize /search page** - LCP 3.2s exceeds target
2. **Fix ChunkLoadError** - Affects checkout flow
3. **CDN for APAC** - High TTFB in Asia Pacific
4. **Mobile optimization** - Higher CLS on mobile`,
  },
  {
    question: "How do I set up status page integration?",
    answer: `## Status Page Integration

### Integration Options
| Provider | Sync Type | Auto-Update | Features |
|----------|-----------|-------------|----------|
| Built-in Status Page | Native | ✅ Full | Complete |
| Statuspage.io | API | ✅ Full | Components, Incidents |
| Cachet | API | ✅ Full | Open source |
| Instatus | Webhook | Partial | Incidents only |
| Custom | API/Webhook | Configurable | Flexible |

### Built-in Status Page Configuration

\`\`\`yaml
status_page:
  enabled: true
  slug: status.sinux.co.id
  title: "Example Service Status"
  description: "Real-time status of Example services"

  # Branding
  branding:
    logo: https://sinux.co.id/logo.png
    favicon: https://sinux.co.id/favicon.ico
    primary_color: "#4F46E5"
    custom_css: |
      .header { background: linear-gradient(...) }

  # Components mapping
  components:
    - name: "API"
      monitors:
        - api-health
        - api-latency
      group: "Core Services"

    - name: "Web Application"
      monitors:
        - web-health
        - web-synthetic
      group: "Core Services"

    - name: "Database"
      monitors:
        - db-health
      group: "Infrastructure"

    - name: "CDN"
      monitors:
        - cdn-health
      group: "Infrastructure"

  # Automatic incident creation
  incidents:
    auto_create: true
    auto_resolve: true
    templates:
      investigating: "We are investigating issues with {{ .Component }}"
      identified: "The issue has been identified and we are working on a fix"
      monitoring: "A fix has been deployed and we are monitoring"
      resolved: "The issue has been resolved"

  # Subscribers
  notifications:
    email: true
    webhook: true
    rss: true
    slack: true
\`\`\`

### Statuspage.io Integration
\`\`\`yaml
integration:
  provider: statuspage.io
  api_key: $STATUSPAGE_API_KEY
  page_id: abc123

  component_mapping:
    api-health: cmp_api123
    web-health: cmp_web456
    db-health: cmp_db789

  sync:
    component_status: true
    incidents: true
    scheduled_maintenance: true
\`\`\`

### Status Levels
| Level | Display | Condition |
|-------|---------|-----------|
| Operational | ✅ Green | All monitors up |
| Degraded | ⚠️ Yellow | Response time >2x baseline |
| Partial Outage | 🟠 Orange | Some monitors down |
| Major Outage | 🔴 Red | All monitors down |
| Maintenance | 🔧 Blue | Scheduled maintenance |

### Component Groups
\`\`\`
├── Core Services
│   ├── API (Operational)
│   ├── Web Application (Operational)
│   └── Authentication (Degraded)
├── Infrastructure
│   ├── Database (Operational)
│   ├── CDN (Operational)
│   └── DNS (Operational)
└── Third-Party
    ├── Payment Gateway (Operational)
    └── Email Service (Maintenance)
\`\`\``,
  },
  {
    question: "What metrics should I track for SRE dashboards?",
    answer: `## SRE Dashboard Metrics Guide

### The Four Golden Signals
| Signal | Metrics | Target |
|--------|---------|--------|
| Latency | P50, P95, P99 response times | P99 < 500ms |
| Traffic | Requests/second, Active users | Trend awareness |
| Errors | Error rate, Error types | < 0.1% |
| Saturation | CPU, Memory, Connections | < 80% |

### SLI/SLO Dashboard

\`\`\`yaml
dashboard:
  name: SLI/SLO Overview

  panels:
    # Availability SLI
    - title: "Availability"
      type: gauge
      query: |
        (1 - sum(rate(http_errors_total[30d])) /
             sum(rate(http_requests_total[30d]))) * 100
      thresholds:
        - value: 99.9
          color: green
        - value: 99.5
          color: yellow
        - value: 0
          color: red

    # Error Budget
    - title: "Error Budget Remaining"
      type: gauge
      query: |
        1 - (
          sum(rate(http_errors_total[30d])) /
          (sum(rate(http_requests_total[30d])) * 0.001)
        )
      format: percent

    # Latency SLI
    - title: "Latency P99"
      type: timeseries
      query: |
        histogram_quantile(0.99,
          rate(http_request_duration_seconds_bucket[5m]))
      thresholds:
        - value: 0.5
          color: green
        - value: 1
          color: yellow
\`\`\`

### Recommended Panels

#### Service Health Overview
| Panel | Metric | Visualization |
|-------|--------|---------------|
| Uptime % | Availability over time | Stat |
| Error Rate | Errors / Total requests | Timeseries |
| Apdex Score | User satisfaction | Gauge |
| Active Incidents | Count by severity | Stat |

#### Performance Metrics
| Panel | Metric | Visualization |
|-------|--------|---------------|
| Request Rate | Requests per second | Timeseries |
| Latency Distribution | P50/P95/P99 | Timeseries |
| Throughput | Bytes in/out | Timeseries |
| Connection Pool | Active/Idle/Max | Gauge |

#### Infrastructure Metrics
| Panel | Metric | Visualization |
|-------|--------|---------------|
| CPU Utilization | By service | Heatmap |
| Memory Usage | Used/Available | Timeseries |
| Disk I/O | Read/Write IOPS | Timeseries |
| Network Traffic | Ingress/Egress | Timeseries |

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >0.5% | >1% |
| Latency P99 | >500ms | >1s |
| CPU Usage | >70% | >90% |
| Memory Usage | >80% | >95% |
| Disk Usage | >70% | >85% |
| Error Budget | <50% | <20% |

### Dashboard Layout
\`\`\`
┌─────────────────────────────────────────────────────────┐
│ Service Health Overview                                 │
├────────────┬────────────┬────────────┬─────────────────┤
│  Uptime    │ Error Rate │   Apdex    │  Incidents      │
│  99.95%    │   0.05%    │   0.92     │      2          │
├────────────┴────────────┴────────────┴─────────────────┤
│ Request Rate & Latency                                 │
│ [===================================] Timeline         │
├────────────────────────────────────────────────────────┤
│ Error Budget Burn Rate                                 │
│ [============] 45% remaining                           │
├─────────────────────────┬──────────────────────────────┤
│ Top Errors              │ Top Slow Endpoints           │
│ - 404 Not Found (45)    │ - /api/search (890ms)        │
│ - 500 Internal (12)     │ - /api/report (750ms)        │
└─────────────────────────┴──────────────────────────────┘
\`\`\``,
  },
  {
    question: "How do I troubleshoot false positive alerts?",
    answer: `## False Positive Alert Investigation

### False Positive Statistics
| Monitor | Total Alerts | False Positives | FP Rate |
|---------|--------------|-----------------|---------|
| api-health | 45 | 12 | 26.7% |
| web-latency | 34 | 8 | 23.5% |
| db-connection | 23 | 2 | 8.7% |
| cache-health | 18 | 6 | 33.3% |

### Common Causes

#### 1. Aggressive Thresholds
\`\`\`yaml
# Current (too sensitive)
monitor:
  name: api-health
  timeout: 5s
  threshold: 1  # Alert on first failure

# Recommended
monitor:
  name: api-health
  timeout: 15s  # Increase timeout
  threshold: 3  # Require 3 consecutive failures
  window: 5m    # Within 5 minute window
\`\`\`

#### 2. Network Blips
\`\`\`
False Positive Pattern:
- Single location failure
- Duration: <30 seconds
- Other locations: OK
- Recovery: Automatic

Fix: Enable multi-location consensus
\`\`\`yaml
alerting:
  trigger_on: consensus
  consensus_threshold: 50%
  locations:
    - us-east
    - us-west
    - eu-west
\`\`\`

#### 3. Monitoring Infrastructure Issues
| Issue | Symptom | Solution |
|-------|---------|----------|
| Probe timeout | Random timeouts | Increase timeout |
| DNS resolution | Intermittent failures | Cache DNS |
| TLS handshake | Slow HTTPS checks | Optimize TLS |
| Connection reuse | First request slow | Enable keep-alive |

### Investigation Steps

#### Step 1: Analyze Alert Timing
\`\`\`sql
SELECT
  time,
  monitor_name,
  location,
  response_time,
  status_code,
  error
FROM alerts
WHERE monitor_name = 'api-health'
  AND time > NOW() - INTERVAL '7 days'
  AND confirmed = false
ORDER BY time DESC
\`\`\`

#### Step 2: Correlate with Service Metrics
\`\`\`
Alert Time: 14:23:45
Service Metrics at 14:23:45:
- Request Rate: Normal (450 req/s)
- Error Rate: Normal (0.02%)
- CPU: Normal (45%)
- Memory: Normal (62%)
- Latency P99: Normal (234ms)

Conclusion: Service was healthy → False positive
\`\`\`

#### Step 3: Check Monitoring Location
\`\`\`yaml
# Location-specific issues
us-east:
  alerts: 45
  false_positives: 2 (4%)

eu-west:
  alerts: 23
  false_positives: 10 (43%)  # Problem location!
\`\`\`

### Recommended Configuration
\`\`\`yaml
monitor:
  name: api-health
  target: https://api.sinux.co.id/health

  # Tolerant settings
  timeout: 15s
  interval: 60s
  retries: 2

  # Multi-location verification
  locations: [us-east, us-west, eu-west]
  trigger_on: majority

  # Flap detection
  flap_detection:
    enabled: true
    threshold: 5
    window: 30m

  # Alert delay
  alert_delay: 2m  # Wait 2 min before alerting
\`\`\``,
  },
  {
    question: "Show me the incident response time metrics",
    answer: `## Incident Response Time Analysis

### Key Metrics Overview
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| MTTD (Mean Time to Detect) | 1.2m | <2m | ✅ Met |
| MTTA (Mean Time to Acknowledge) | 4.5m | <5m | ✅ Met |
| MTTR (Mean Time to Resolve) | 23m | <30m | ✅ Met |
| MTBF (Mean Time Between Failures) | 72h | >48h | ✅ Met |

### Response Time Breakdown
\`\`\`
Incident Timeline

Detection    │ █ │ 1.2m
             │   │
Acknowledge  │ ████ │ 4.5m
             │      │
Investigate  │ ████████ │ 8m
             │          │
Mitigate     │ ██████████████ │ 15m
             │                │
Resolve      │ ███████████████████████ │ 23m
             │                         │
             0    5    10   15   20   25   30 minutes
\`\`\`

### Response Times by Severity
| Severity | MTTD | MTTA | MTTR | Incidents |
|----------|------|------|------|-----------|
| Critical | 0.5m | 2m | 15m | 3 |
| High | 1.5m | 5m | 28m | 8 |
| Medium | 2m | 8m | 45m | 15 |
| Low | 5m | 15m | 2h | 12 |

### Response Time Trend (30 Days)
\`\`\`
MTTR (minutes)
40 |    █
35 |    █ █
30 | █  █ █    █
25 | █  █ █ █  █ █       Target: 30m
20 | █  █ █ █  █ █ █  █  ─────────────
15 | █  █ █ █  █ █ █  █  █
10 | █  █ █ █  █ █ █  █  █  █  █
   +--------------------------------
   W1    W2    W3    W4
          January 2024
\`\`\`

### Top Performers
| Responder | Avg MTTA | Avg MTTR | Incidents |
|-----------|----------|----------|-----------|
| Alice Chen | 2.1m | 18m | 12 |
| Bob Smith | 3.5m | 22m | 8 |
| Carol Davis | 4.2m | 25m | 10 |
| Team Average | 4.5m | 23m | 38 |

### Incident Categories
| Category | Count | Avg MTTR | Trend |
|----------|-------|----------|-------|
| Infrastructure | 12 | 35m | ↗ +5m |
| Application | 15 | 18m | ↘ -3m |
| Third-party | 8 | 45m | → Stable |
| Configuration | 3 | 12m | ↘ -2m |

### Improvement Opportunities
| Area | Current | Target | Action |
|------|---------|--------|--------|
| Runbook coverage | 65% | 90% | Create 15 runbooks |
| Auto-remediation | 12% | 30% | Implement 5 automations |
| On-call response | 4.5m | 3m | Improve alerting |
| Postmortem rate | 80% | 100% | Enforce completion |

### SLA Performance
| SLA | Target MTTR | Actual | Status |
|-----|-------------|--------|--------|
| Critical | <15m | 12m | ✅ Met |
| High | <30m | 28m | ✅ Met |
| Medium | <1h | 45m | ✅ Met |
| Low | <4h | 2h | ✅ Met |`,
  },
  {
    question: "What monitors should I add for a new microservice?",
    answer: `## New Microservice Monitoring Checklist

### Service: user-preferences-service

### Recommended Monitor Configuration

#### 1. Health Endpoint Monitor
\`\`\`yaml
monitor:
  name: user-preferences-health
  type: http
  tier: gold

  target: https://user-preferences.internal/health
  method: GET
  interval: 30s
  timeout: 10s

  validation:
    status_code: 200
    response_body:
      json_path: $.status
      equals: "healthy"

  alerts:
    - threshold: 3
      severity: critical
      channels: [pagerduty, slack-critical]
\`\`\`

#### 2. API Endpoint Monitors
\`\`\`yaml
monitors:
  - name: user-prefs-get
    type: http
    target: https://api.sinux.co.id/v1/users/test/preferences
    method: GET
    headers:
      Authorization: Bearer $TEST_TOKEN
    validation:
      status_code: 200
      response_time_ms: 500

  - name: user-prefs-synthetic
    type: synthetic
    steps:
      - action: request
        method: POST
        url: /v1/users/test/preferences
        body: '{"theme": "dark"}'
        expect:
          status: 200
      - action: request
        method: GET
        url: /v1/users/test/preferences
        expect:
          body_contains: "dark"
\`\`\`

#### 3. Infrastructure Monitors
\`\`\`yaml
monitors:
  # Database connectivity
  - name: user-prefs-db
    type: tcp
    target: user-prefs-db.internal
    port: 5432
    interval: 30s

  # Redis cache
  - name: user-prefs-cache
    type: tcp
    target: user-prefs-redis.internal
    port: 6379
    interval: 30s

  # Message queue
  - name: user-prefs-queue
    type: tcp
    target: rabbitmq.internal
    port: 5672
    interval: 60s
\`\`\`

#### 4. SSL Certificate Monitor
\`\`\`yaml
monitor:
  name: user-prefs-ssl
  type: ssl
  target: user-preferences.sinux.co.id
  alerts:
    - days_before_expiry: 30
      severity: warning
    - days_before_expiry: 7
      severity: critical
\`\`\`

### Monitor Priority Matrix
| Monitor | Priority | Frequency | On-Call Alert |
|---------|----------|-----------|---------------|
| Health endpoint | Critical | 30s | Yes |
| API endpoints | High | 60s | Yes |
| Database | High | 30s | Yes |
| Cache | Medium | 60s | No |
| SSL certificate | Low | 6h | No |

### Dashboard Panels
| Panel | Metric | Source |
|-------|--------|--------|
| Service Status | Health check status | Uptime monitor |
| Response Time | P50, P95, P99 | APM/Metrics |
| Error Rate | 5xx errors | Logs/Metrics |
| Request Rate | Requests/second | Metrics |
| Dependency Status | DB, Cache, Queue | TCP monitors |

### Alerting Setup
\`\`\`yaml
alert_rules:
  - name: user-prefs-down
    condition: health_check == "down"
    for: 2m
    severity: critical
    runbook: https://wiki.sinux.co.id/runbooks/user-prefs

  - name: user-prefs-slow
    condition: response_time_p99 > 500ms
    for: 5m
    severity: warning

  - name: user-prefs-errors
    condition: error_rate > 1%
    for: 5m
    severity: high
\`\`\``,
  },
  {
    question: "Analyze the historical uptime trends for capacity planning",
    answer: `## Historical Uptime Analysis for Capacity Planning

### 12-Month Availability Trend
| Month | Uptime % | Downtime | Incidents | Traffic |
|-------|----------|----------|-----------|---------|
| Feb 2023 | 99.92% | 35m | 4 | 100% |
| Mar 2023 | 99.95% | 22m | 3 | 105% |
| Apr 2023 | 99.89% | 48m | 6 | 112% |
| May 2023 | 99.94% | 26m | 4 | 118% |
| Jun 2023 | 99.87% | 56m | 7 | 125% |
| Jul 2023 | 99.91% | 39m | 5 | 135% |
| Aug 2023 | 99.85% | 65m | 8 | 145% |
| Sep 2023 | 99.88% | 52m | 6 | 150% |
| Oct 2023 | 99.93% | 30m | 4 | 155% |
| Nov 2023 | 99.96% | 17m | 2 | 162% |
| Dec 2023 | 99.82% | 78m | 9 | 180% |
| Jan 2024 | 99.87% | 57m | 7 | 175% |

### Trend Visualization
\`\`\`
Availability vs Traffic Growth

Uptime %                                    Traffic
100 |                                        200%
99.9|  █    █    █ █ █    █ █ █ █         █ 175%
99.8|  █ █  █    █ █ █    █ █ █ █ █     █ █ 150%
99.7|  █ █  █    █ █ █    █ █ █ █ █     █ █ 125%
99.6|  █ █  █    █ █ █ █  █ █ █ █ █ █   █ █ 100%
    +----------------------------------------
     F  M  A  M  J  J  A  S  O  N  D  J
     2023                          2024

     █ Uptime  ─── Traffic Trend
\`\`\`

### Correlation Analysis

#### Traffic vs Incidents
\`\`\`
Correlation coefficient: 0.78 (Strong positive)

Finding: Incidents increase proportionally with traffic
Rate: ~1 additional incident per 20% traffic growth
\`\`\`

#### Seasonal Patterns
| Period | Avg Traffic | Avg Incidents | Risk Level |
|--------|-------------|---------------|------------|
| Q1 | 108% | 4.5 | Low |
| Q2 | 118% | 5.5 | Medium |
| Q3 | 143% | 6.3 | High |
| Q4 | 166% | 6.0 | High |

### Capacity Planning Recommendations

#### Current vs Projected Load
| Metric | Current | +6 Months | +12 Months |
|--------|---------|-----------|------------|
| Traffic | 175% | 220% | 280% |
| Projected Incidents | 7/mo | 9/mo | 12/mo |
| Projected Downtime | 57m/mo | 75m/mo | 95m/mo |
| SLA Risk | Medium | High | Critical |

#### Infrastructure Scaling Needs
| Resource | Current | Recommended | Action |
|----------|---------|-------------|--------|
| Web servers | 4 | 8 | Scale up |
| Database | 1 primary + 2 replica | 1 primary + 4 replica | Add replicas |
| Cache | 3 nodes | 6 nodes | Scale up |
| CDN | 3 regions | 5 regions | Add APAC, LATAM |

### Investment Recommendations
| Priority | Initiative | Cost | Impact |
|----------|------------|------|--------|
| 1 | Database read replicas | $2K/mo | -30% DB incidents |
| 2 | Multi-region failover | $5K/mo | +0.05% availability |
| 3 | Auto-scaling infrastructure | $3K/mo | -40% capacity incidents |
| 4 | Enhanced monitoring | $1K/mo | -20% MTTR |

### Projected Improvement
\`\`\`
With recommended investments:

Current State:
  Availability: 99.87%
  Monthly Downtime: 57 minutes
  Incidents: 7/month

Projected State (+6 months):
  Availability: 99.95%
  Monthly Downtime: 22 minutes
  Incidents: 4/month
\`\`\``,
  },
];

export const UPTIME_CONVERSATION_TITLES = [
  "Service Uptime Status",
  "Health Check Failure",
  "Response Time Trends",
  "Incident Analysis",
  "SSL Monitoring Setup",
  "Global Availability",
  "Executive Report",
  "Synthetic Test Failure",
  "HTTP vs TCP Monitors",
  "Alert Configuration",
  "Maintenance Windows",
  "Multi-Location Setup",
  "Flapping Analysis",
  "SLA Comparison",
  "API Authentication",
  "Outage SLA Impact",
  "Webhook Configuration",
  "DNS Monitoring",
  "RUM Status",
  "Status Page Setup",
  "SRE Dashboard Metrics",
  "False Positives",
  "Incident Response",
  "New Service Monitors",
  "Capacity Planning",
];
