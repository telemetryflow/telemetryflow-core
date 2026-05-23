/**
 * LLM Mock Data - Alerts
 * TASK-11: Mock data for alerts-related AI insights
 */

import type { MockQA } from "./llm-metrics";

export const ALERTS_MOCK_DATA: MockQA[] = [
  {
    question: "Analyze our alert patterns to reduce fatigue",
    answer: `## Alert Fatigue Analysis

### Alert Statistics (Last 7 Days)
- **Total Alerts**: 2,847
- **Unique Incidents**: 89
- **Alerts per Incident**: 32 avg (too high!)
- **MTTA**: 4.2 minutes
- **MTTR**: 47 minutes

### Alert Distribution

| Severity | Count | % of Total | Action Rate |
|----------|-------|------------|-------------|
| Critical | 234 | 8% | 89% actioned |
| Warning | 1,456 | 51% | 23% actioned |
| Info | 1,157 | 41% | 2% actioned |

### Top Noisy Alerts

| Alert | Fires | False Positive | Recommendation |
|-------|-------|----------------|----------------|
| \`HighCPUUsage\` | 456 | 78% | Increase threshold 70%→85% |
| \`PodRestartLoop\` | 234 | 45% | Add 3-restart minimum |
| \`DiskSpaceWarning\` | 189 | 92% | Change to 90% threshold |
| \`HighMemoryUsage\` | 167 | 34% | Add rate-of-change condition |
| \`APILatencyHigh\` | 145 | 23% | Increase window to 5min |

### Alert Correlation Clusters

**Cluster 1**: Database Issues (correlates 89%)
- \`DatabaseConnectionTimeout\`
- \`HighQueryLatency\`
- \`ConnectionPoolExhausted\`
→ **Recommendation**: Create parent alert, suppress children

**Cluster 2**: Deployment Events (correlates 94%)
- \`PodNotReady\`
- \`HighErrorRate\`
- \`LatencySpike\`
→ **Recommendation**: Suppress during deployment windows

### Optimization Actions
1. Increase CPU threshold: 70% → 85% (saves 356 alerts/week)
2. Add 3-minute evaluation window to memory alerts
3. Create alert hierarchy for database cluster
4. Implement deployment-aware alert suppression
5. Convert 41% info alerts to logs-only

**Expected Reduction**: 62% fewer alerts (2,847 → 1,082/week)`,
  },
  {
    question: "Show me all critical alerts in the last hour",
    answer: `## Critical Alerts (Last 1 Hour)

### Active Critical Alerts: 3

| Alert | Service | Duration | Assigned | Status |
|-------|---------|----------|----------|--------|
| DatabaseDown | postgres-primary | 12 min | @oncall-db | 🔴 Active |
| HighErrorRate | payment-service | 8 min | @oncall-platform | 🟡 Investigating |
| NodeNotReady | k8s-worker-07 | 5 min | @oncall-infra | 🟡 Remediation |

### Alert Details

#### 1. DatabaseDown
\`\`\`yaml
Alert: DatabaseDown
Service: postgres-primary
Triggered: 12 minutes ago
Description: Primary database not responding to health checks
Runbook: https://runbooks.telemetryflow.id/db-failover
\`\`\`

#### 2. HighErrorRate
\`\`\`yaml
Alert: HighErrorRate
Service: payment-service
Current: 8.7% (threshold: 1%)
Triggered: 8 minutes ago
Related: DatabaseDown (correlation: 0.92)
\`\`\`

### Recently Resolved: 2
| Alert | Service | Duration | Resolved |
|-------|---------|----------|----------|
| ServiceUnavailable | checkout-service | 23 min | 15 min ago |
| HighMemoryUsage | order-processor | 12 min | 23 min ago |

### Escalation Status
- **DatabaseDown**: Page sent, ACK'd by @john at 14:25
- **HighErrorRate**: Investigating, no ACK yet (auto-escalate in 7 min)
- **NodeNotReady**: Auto-remediation in progress`,
  },
  {
    question: "What alerts fired during the last deployment?",
    answer: `## Deployment Alert Correlation

### Deployment Details
- **Service**: order-service v3.2.1
- **Time**: 14:30-14:45 UTC
- **Strategy**: Rolling Update
- **Pods**: 3 replicas

### Alerts During Deployment
| Time | Alert | Severity | Duration | Status |
|------|-------|----------|----------|--------|
| 14:32 | PodNotReady | Warning | 3 min | Auto-resolved |
| 14:33 | HighErrorRate | Warning | 4 min | Auto-resolved |
| 14:34 | LatencySpike | Warning | 5 min | Auto-resolved |
| 14:36 | HealthCheckFailed | Critical | 2 min | False positive |

### Analysis
All alerts were deployment-related and auto-resolved within 5 minutes:
- **PodNotReady**: Normal during rolling update
- **HighErrorRate**: Transient during pod termination
- **LatencySpike**: Load redistribution
- **HealthCheckFailed**: New pod initialization

### Deployment Impact
| Metric | Before | During | After |
|--------|--------|--------|-------|
| Error Rate | 0.2% | 2.3% | 0.2% |
| Latency P95 | 234ms | 567ms | 198ms |
| Availability | 100% | 99.7% | 100% |

### Recommendations
1. Add deployment annotation to suppress these alerts
2. Extend readiness probe initialDelaySeconds
3. Configure PodDisruptionBudget for smoother rollouts`,
  },
  {
    question: "Find recurring alerts for SLA report",
    answer: `## Recurring Alert Analysis

### Time Period: Last 30 Days
- **Total Unique Alerts**: 45
- **Recurring (>5 times)**: 12
- **Total Occurrences**: 2,347

### Most Frequent Alerts
| Alert | Occurrences | Avg Duration | Impact | Trend |
|-------|-------------|--------------|--------|-------|
| HighCPUUsage | 156 | 8 min | Low | ↑ +23% |
| MemoryPressure | 89 | 15 min | Medium | → |
| DiskSpaceLow | 45 | 2 hours | Low | ↓ -12% |
| APILatencyHigh | 34 | 12 min | High | → |
| PodRestart | 28 | 5 min | Low | → |

### SLA Impact Analysis
| Metric | Target | Actual | Gap |
|--------|--------|--------|-----|
| Availability | 99.9% | 99.87% | -0.03% |
| Error Rate | <0.5% | 0.34% | ✅ Met |
| Latency P99 | <500ms | 456ms | ✅ Met |

### Breach Minutes
| Category | Minutes | Impact |
|----------|---------|--------|
| Total downtime | 18.7 min | SLA breach |
| APILatencyHigh | 12 min | Primary cause |
| DatabaseDown | 4.5 min | Secondary |
| Other | 2.2 min | Minor |

### Root Cause of Recurring Alerts
| Alert | Root Cause | Fix Status |
|-------|------------|------------|
| HighCPUUsage | Undersized instances | In progress |
| MemoryPressure | Memory leak | Scheduled |
| DiskSpaceLow | Log retention | Fixed |

### Recommendations
1. Right-size payment-service instances
2. Fix memory leak in order-processor
3. Implement log rotation policy`,
  },
  {
    question: "Show on-call metrics",
    answer: `## On-Call Metrics (This Week)

### Current On-Call
- **Primary**: @john (Platform Team)
- **Secondary**: @sarah (SRE Team)
- **Shift**: Mon 09:00 - Mon 09:00 UTC

### Performance Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Pages received | 23 | <30 | ✅ Met |
| MTTA (Mean Time to Acknowledge) | 4.2 min | <5 min | ✅ Met |
| MTTR (Mean Time to Resolve) | 47 min | <60 min | ✅ Met |
| Sleep interrupts | 3 | <2 | ⚠️ Exceeded |
| Escalations | 2 | <3 | ✅ Met |

### Alert Breakdown by Time
| Time Period | Alerts | Sleep Impact |
|-------------|--------|--------------|
| 09:00-18:00 | 12 | None |
| 18:00-22:00 | 5 | Low |
| 22:00-02:00 | 2 | Medium |
| 02:00-09:00 | 4 | High |

### Top Alerts This Week
| Alert | Count | Avg MTTR | Feedback |
|-------|-------|----------|----------|
| HighErrorRate | 8 | 23 min | Actionable |
| PodCrash | 6 | 12 min | Needs tuning |
| LatencySpike | 5 | 34 min | Actionable |
| DiskFull | 4 | 45 min | Preventable |

### On-Call Feedback
\`\`\`
"Too many non-actionable alerts during night hours.
PodCrash alert fires on every deployment.
Need better runbooks for database alerts."
- @john
\`\`\`

### Recommendations
1. Suppress PodCrash during deployments
2. Add more context to database alerts
3. Review night-time alert thresholds`,
  },
  {
    question: "Alert severity distribution",
    answer: `## Alert Severity Report

### Distribution (Last 30 Days)
| Severity | Count | % | Avg Duration | Action Rate |
|----------|-------|---|--------------|-------------|
| Critical | 45 | 5% | 23 min | 95% |
| High | 123 | 13% | 34 min | 78% |
| Medium | 345 | 36% | 45 min | 45% |
| Low | 456 | 48% | 67 min | 12% |

### Severity vs Impact
| Severity | True Positive | False Positive | Impact |
|----------|---------------|----------------|--------|
| Critical | 89% | 11% | Revenue/Availability |
| High | 72% | 28% | Performance |
| Medium | 56% | 44% | Operational |
| Low | 34% | 66% | Informational |

### Severity Trends
| Severity | This Week | Last Week | Change |
|----------|-----------|-----------|--------|
| Critical | 12 | 8 | ↑ +50% |
| High | 34 | 28 | ↑ +21% |
| Medium | 89 | 92 | ↓ -3% |
| Low | 123 | 145 | ↓ -15% |

### Severity Review Recommendations
| Current | Proposed | Alerts Affected | Reason |
|---------|----------|-----------------|--------|
| High → Medium | MemoryWarn | 23 | Non-critical |
| Low → Medium | SSLExpireSoon | 8 | Action needed |
| Medium → Low | DiskWarn80 | 45 | Too early |

### Action Items
1. Review Critical alert increase (+50%)
2. Reclassify 5 alert severities
3. Reduce Low severity false positives`,
  },
  {
    question: "Show silenced alerts",
    answer: `## Silenced Alerts

### Active Silences: 5

| Alert | Silenced By | Reason | Expires | Status |
|-------|-------------|--------|---------|--------|
| MaintenanceMode | @devops | Planned maintenance | 2h | Active |
| HighCPU-batch | @john | Expected batch job | 4h | Active |
| DiskWarning-logs | @sarah | Cleanup in progress | 1h | Active |
| MemoryHigh-analytics | @mike | Data processing | 6h | Active |
| NetworkLatency | @system | Auto-silence | 30m | Active |

### Silence Details

#### MaintenanceMode
\`\`\`yaml
Matchers:
  - env = "production"
  - service =~ "database.*"
Created: @devops
Reason: "Scheduled database maintenance window"
Expires: 2025-02-02T16:00:00Z
Ticket: JIRA-1234
\`\`\`

### Recently Expired Silences (Last 24h)
| Alert | Duration | Expired | Created By |
|-------|----------|---------|------------|
| DeploymentAlerts | 2h | 8h ago | @deploy-bot |
| HighLatency-staging | 4h | 12h ago | @qa-team |
| CPUSpike-report | 1h | 18h ago | @john |

### Silence Statistics
| Metric | This Week | Last Week |
|--------|-----------|-----------|
| Total silences | 23 | 18 |
| Avg duration | 3.2h | 2.8h |
| Auto-silences | 5 | 3 |
| Expired without incident | 21 | 16 |

### Recommendations
1. Review MaintenanceMode scope (too broad)
2. Add auto-expiry reminders
3. Require ticket for silences > 4h`,
  },
  {
    question: "Find flapping alerts",
    answer: `## Flapping Alert Detection

### Definition
Alert is "flapping" when it fires and resolves >3 times in 1 hour

### Flapping Alerts Detected: 4

| Alert | Flap Count | Pattern | Services |
|-------|------------|---------|----------|
| HighCPU-order-svc | 12 | Every 15 min | order-service |
| MemoryWarn-cache | 8 | Random | redis-cache |
| LatencySpike-api | 6 | Peak hours | api-gateway |
| PodReady-worker | 5 | Every 20 min | worker-pods |

### Flapping Analysis: HighCPU-order-svc

\`\`\`
Timeline (Last 2 hours):
12:00 ━━[FIRE]━━[RESOLVE]━━━━━━━━━━━━━━━
12:15 ━━━━━━━━━━[FIRE]━━[RESOLVE]━━━━━━━
12:30 ━━━━━━━━━━━━━━━━[FIRE]━━[RESOLVE]━
12:45 ━━━━━━━━━━[FIRE]━━[RESOLVE]━━━━━━━
13:00 ━━━━━━━━━━━━━━[FIRE]━━[RESOLVE]━━━
...
\`\`\`

### Root Cause Analysis
| Alert | Root Cause | Fix |
|-------|------------|-----|
| HighCPU-order-svc | Threshold too close to baseline | Increase to 85% |
| MemoryWarn-cache | Memory fluctuation | Add hysteresis |
| LatencySpike-api | No evaluation window | Add 3min window |
| PodReady-worker | HPA scaling | Add stabilization |

### Impact of Flapping
| Metric | Value |
|--------|-------|
| Pages to on-call | 31 unnecessary |
| Alert fatigue score | High |
| MTTA degradation | +45% |

### Recommendations
1. Add 5-minute evaluation window
2. Implement hysteresis (fire at 85%, resolve at 75%)
3. Suppress during HPA scaling events`,
  },
  {
    question: "Alert routing summary",
    answer: `## Alert Routing Configuration

### Routing Rules
| Severity | Route | Notification | Escalation |
|----------|-------|--------------|------------|
| Critical | PagerDuty | Page + Slack | 5 min → Secondary |
| High | Slack #oncall | Slack only | 15 min → Primary |
| Medium | Slack #alerts | Slack only | 1h → Team lead |
| Low | Email digest | Daily email | None |

### Route Details

#### Critical Path
\`\`\`yaml
match:
  severity: critical
receiver: pagerduty-critical
continue: true
routes:
  - receiver: slack-oncall
  - receiver: email-oncall
\`\`\`

### Team Routing
| Team | Services | Channel | On-Call |
|------|----------|---------|---------|
| Platform | api-*, order-* | #platform-alerts | @platform-oncall |
| Database | postgres-*, redis-* | #db-alerts | @db-oncall |
| Infra | k8s-*, network-* | #infra-alerts | @infra-oncall |

### Escalation Matrix
| Level | Time | Contact | Method |
|-------|------|---------|--------|
| L1 | 0 min | On-call engineer | PagerDuty |
| L2 | 5 min | Secondary on-call | PagerDuty |
| L3 | 15 min | Team lead | Phone |
| L4 | 30 min | Engineering manager | Phone |

### Routing Statistics
| Route | Alerts/Week | Avg Response |
|-------|-------------|--------------|
| PagerDuty | 23 | 3.2 min |
| Slack #oncall | 156 | 12 min |
| Email digest | 234 | N/A |`,
  },
  {
    question: "Show alert acknowledgments",
    answer: `## Alert Acknowledgments (Last 24 Hours)

### Summary
- **Total Alerts**: 89
- **Acknowledged**: 78 (88%)
- **Auto-resolved**: 11 (12%)
- **Unacknowledged**: 0 ✅

### Acknowledgment by Responder
| Responder | Acked | Avg Response | Role |
|-----------|-------|--------------|------|
| @john | 34 | 3.2 min | Primary |
| @sarah | 28 | 4.5 min | Secondary |
| @mike | 16 | 2.8 min | Backup |

### Acknowledgment Timeline
| Time Range | Alerts | Avg Ack Time |
|------------|--------|--------------|
| 00:00-06:00 | 8 | 5.2 min |
| 06:00-12:00 | 23 | 3.4 min |
| 12:00-18:00 | 34 | 2.8 min |
| 18:00-24:00 | 24 | 4.1 min |

### Acknowledgment vs Resolution
| Alert | Ack Time | Resolve Time | Gap |
|-------|----------|--------------|-----|
| DatabaseDown | 2 min | 23 min | 21 min |
| HighErrorRate | 3 min | 15 min | 12 min |
| LatencySpike | 5 min | 8 min | 3 min |

### Unacked Alert Patterns
| Pattern | Occurrences | Reason |
|---------|-------------|--------|
| Auto-resolved before ack | 8 | Transient issues |
| Weekend overnight | 3 | Delayed response |

### Recommendations
1. Maintain excellent ack rate (>85%)
2. Review overnight response times
3. Add auto-ack for known transient alerts`,
  },
  {
    question: "Analyze alert correlation",
    answer: `## Alert Correlation Analysis

### Correlation Clusters Detected: 8

### Cluster 1: Database Chain (Correlation: 0.94)
\`\`\`
[ROOT] DatabaseConnectionTimeout
  └─ HighQueryLatency (lag: 30s)
      └─ ConnectionPoolExhausted (lag: 60s)
          └─ ServiceError5xx (lag: 90s)
\`\`\`

### Cluster 2: Memory Cascade (Correlation: 0.89)
\`\`\`
[ROOT] HighMemoryUsage
  └─ GCPauseHigh (lag: 60s)
      └─ LatencySpike (lag: 120s)
          └─ PodOOMKilled (lag: 180s)
\`\`\`

### Correlation Matrix
| Alert A | Alert B | Correlation | Lag |
|---------|---------|-------------|-----|
| DBConnTimeout | PoolExhausted | 0.94 | 60s |
| HighMemory | GCPause | 0.89 | 60s |
| CPUHigh | LatencySpike | 0.78 | 30s |
| DiskFull | SlowQueries | 0.67 | 120s |

### Root Cause Identification
| Incident Time | Root Cause | Child Alerts |
|---------------|------------|--------------|
| 14:00 | DatabaseDown | 5 alerts |
| 12:30 | MemoryLeak | 3 alerts |
| 10:15 | DeploymentFailed | 4 alerts |

### Alert Suppression Opportunities
| Parent Alert | Child Alerts | Savings |
|--------------|--------------|---------|
| DatabaseDown | 4 alerts | 16/week |
| MemoryLeak | 3 alerts | 12/week |
| NetworkPartition | 2 alerts | 8/week |

### Recommendations
1. Implement alert grouping by correlation
2. Add root cause badges to child alerts
3. Configure 2-minute suppression window`,
  },
  {
    question: "Show alert threshold recommendations",
    answer: `## Alert Threshold Recommendations

### ML-Based Analysis
Analyzed 30 days of metrics and alert history

### Recommended Changes

| Alert | Current | Recommended | Confidence | Impact |
|-------|---------|-------------|------------|--------|
| HighCPU | 70% | 85% | 94% | -45% alerts |
| HighMemory | 80% | 88% | 89% | -32% alerts |
| DiskSpace | 85% | 92% | 87% | -28% alerts |
| ErrorRate | 0.5% | 1.0% | 78% | -23% alerts |
| LatencyP99 | 500ms | 750ms | 82% | -18% alerts |

### Threshold Analysis: HighCPU

\`\`\`
Current Threshold: 70%
Baseline Mean: 45%
Baseline StdDev: 12%

Recommendation: 85% (mean + 3*stddev)
Rationale: Current threshold catches normal variance

False Positive Rate:
  - Current (70%): 78%
  - Proposed (85%): 12%
\`\`\`

### Evaluation Window Recommendations
| Alert | Current | Recommended | Reason |
|-------|---------|-------------|--------|
| HighCPU | 1 min | 5 min | Reduce transient spikes |
| HighMemory | 2 min | 5 min | Allow GC recovery |
| LatencyP99 | 1 min | 3 min | Smooth out outliers |

### Expected Impact
| Metric | Current | After Changes |
|--------|---------|---------------|
| Alerts/week | 456 | 267 |
| False positives | 156 | 34 |
| True positives | 300 | 233 |
| Missed incidents | 0 | 0 (estimated) |

### Validation Plan
1. Apply changes to staging first
2. Monitor for 1 week
3. Review missed incidents
4. Roll out to production`,
  },
  {
    question: "Find alerts by service",
    answer: `## Alerts by Service (Last 7 Days)

### Service Alert Summary
| Service | Total | Critical | High | Medium | Low |
|---------|-------|----------|------|--------|-----|
| payment-service | 89 | 5 | 23 | 34 | 27 |
| order-service | 67 | 3 | 18 | 28 | 18 |
| api-gateway | 45 | 2 | 12 | 21 | 10 |
| auth-service | 23 | 1 | 8 | 9 | 5 |
| inventory-service | 34 | 2 | 10 | 14 | 8 |

### Alert Details: payment-service

#### Critical Alerts (5)
| Alert | Occurrences | Avg Duration |
|-------|-------------|--------------|
| PaymentGatewayDown | 2 | 12 min |
| HighErrorRate | 2 | 8 min |
| DatabaseTimeout | 1 | 23 min |

#### High Alerts (23)
| Alert | Occurrences | Pattern |
|-------|-------------|---------|
| HighLatency | 12 | Peak hours |
| RetryExhausted | 8 | External API |
| PoolExhausted | 3 | Traffic spike |

### Service Health Score
| Service | Alerts/Day | Health Score |
|---------|------------|--------------|
| auth-service | 3.3 | 95/100 |
| inventory-service | 4.9 | 88/100 |
| api-gateway | 6.4 | 82/100 |
| order-service | 9.6 | 74/100 |
| payment-service | 12.7 | 65/100 |

### Recommendations
1. Focus on payment-service stability
2. Review order-service alert patterns
3. Investigate payment gateway reliability`,
  },
  {
    question: "Show alert runbook coverage",
    answer: `## Runbook Coverage Analysis

### Overall Coverage
- **Total Alerts**: 45 unique alert types
- **With Runbook**: 34 (76%)
- **Without Runbook**: 11 (24%)

### Coverage by Severity
| Severity | Total | With Runbook | Coverage |
|----------|-------|--------------|----------|
| Critical | 8 | 8 | 100% ✅ |
| High | 12 | 10 | 83% |
| Medium | 15 | 10 | 67% |
| Low | 10 | 6 | 60% |

### Alerts Missing Runbooks
| Alert | Severity | Occurrences | Priority |
|-------|----------|-------------|----------|
| HighMemoryPressure | High | 34 | P1 |
| SlowQueryDetected | High | 23 | P1 |
| CacheEvictionHigh | Medium | 18 | P2 |
| LogVolumeSpike | Medium | 15 | P2 |
| NetworkLatencyHigh | Medium | 12 | P2 |

### Runbook Quality Score
| Runbook | Completeness | Last Updated | Score |
|---------|--------------|--------------|-------|
| DatabaseFailover | 100% | 2 weeks | 95/100 |
| PaymentGatewayDown | 90% | 1 month | 85/100 |
| PodCrashLoop | 80% | 3 months | 70/100 |
| HighCPU | 60% | 6 months | 50/100 |

### Runbook Usage Statistics
| Metric | Value |
|--------|-------|
| Avg runbook access/incident | 1.8 |
| Runbook contributed to resolution | 67% |
| Time saved (estimated) | 8 min/incident |

### Recommendations
1. Create runbooks for P1 missing alerts
2. Update stale runbooks (>3 months)
3. Add troubleshooting steps to HighCPU runbook`,
  },
  {
    question: "Analyze maintenance window alerts",
    answer: `## Maintenance Window Alert Analysis

### Recent Maintenance Windows (Last 30 Days)
| Window | Date | Duration | Suppressed |
|--------|------|----------|------------|
| DB Upgrade | Feb 1 | 2 hours | 45 alerts |
| K8s Update | Jan 28 | 4 hours | 89 alerts |
| Network Maint | Jan 15 | 1 hour | 23 alerts |
| Security Patch | Jan 10 | 30 min | 12 alerts |

### Alert Suppression Effectiveness
| Window | Expected | Actual | Leaked |
|--------|----------|--------|--------|
| DB Upgrade | 50 | 45 | 5 (10%) |
| K8s Update | 100 | 89 | 11 (11%) |
| Network Maint | 25 | 23 | 2 (8%) |

### Leaked Alerts Analysis
| Alert | Reason | Fix |
|-------|--------|-----|
| HighLatency | Not in scope | Expand matchers |
| ErrorRate | Wrong label | Fix selector |
| PodNotReady | Timing | Extend window |

### Post-Maintenance Alerts
| Window | Alerts 1h After | Normal Rate | Elevated |
|--------|-----------------|-------------|----------|
| DB Upgrade | 23 | 5 | ⚠️ Yes |
| K8s Update | 12 | 8 | Slight |
| Network Maint | 6 | 5 | No |

### Maintenance Window Best Practices
\`\`\`yaml
# Example: Database maintenance window
silence:
  matchers:
    - service=~"database.*"
    - env="production"
  duration: 2h
  buffer_before: 15m  # Start early
  buffer_after: 30m   # Extend after
  notify: ["#db-team"]
\`\`\`

### Recommendations
1. Add 30-min post-maintenance buffer
2. Fix label selectors for leaked alerts
3. Create maintenance window templates`,
  },
  {
    question: "Show alert volume trends",
    answer: `## Alert Volume Trends

### Weekly Trend (Last 8 Weeks)
| Week | Total | Critical | Trend |
|------|-------|----------|-------|
| W1 | 234 | 12 | ↑ |
| W2 | 267 | 15 | ↑ |
| W3 | 245 | 11 | ↓ |
| W4 | 289 | 18 | ↑ |
| W5 | 312 | 21 | ↑ |
| W6 | 278 | 14 | ↓ |
| W7 | 256 | 13 | ↓ |
| W8 | 301 | 17 | ↑ |

### Daily Pattern
| Day | Avg Alerts | Peak Hour |
|-----|------------|-----------|
| Monday | 45 | 10:00 |
| Tuesday | 38 | 14:00 |
| Wednesday | 42 | 11:00 |
| Thursday | 48 | 15:00 |
| Friday | 52 | 16:00 |
| Saturday | 23 | 12:00 |
| Sunday | 18 | 10:00 |

### Hourly Distribution
\`\`\`
Hour  Alerts
00:00 ████░░░░░░ 8
06:00 ██████░░░░ 12
09:00 ████████████████ 32 (peak)
12:00 ████████████ 24
15:00 ██████████████ 28
18:00 ████████░░ 16
21:00 ██████░░░░ 12
\`\`\`

### Alert Type Trends
| Alert Type | 4 Weeks Ago | Now | Change |
|------------|-------------|-----|--------|
| Performance | 89 | 123 | ↑ +38% |
| Availability | 45 | 34 | ↓ -24% |
| Security | 12 | 15 | ↑ +25% |
| Capacity | 34 | 28 | ↓ -18% |

### Analysis
- **Overall trend**: +12% over 8 weeks
- **Primary driver**: Performance alerts
- **Improvement**: Availability alerts down

### Recommendations
1. Investigate performance alert increase
2. Continue availability improvements
3. Monitor security alert uptick`,
  },
  {
    question: "Find alerts with longest resolution time",
    answer: `## Longest Resolution Time Analysis

### Top 10 Longest Alerts (Last 30 Days)
| Alert | Service | Duration | Resolved By |
|-------|---------|----------|-------------|
| DataCorruption | postgres | 4h 23m | @dba-team |
| NetworkPartition | k8s-cluster | 3h 45m | @network |
| MajorOutage | payment-gw | 2h 15m | @oncall |
| CertificateExpired | api-gateway | 1h 56m | @security |
| MemoryLeak | order-svc | 1h 34m | @backend |

### Resolution Time by Severity
| Severity | Avg Resolution | Target | Status |
|----------|----------------|--------|--------|
| Critical | 23 min | 15 min | ⚠️ Over |
| High | 45 min | 30 min | ⚠️ Over |
| Medium | 2h 15m | 4 hours | ✅ Met |
| Low | 8h 30m | 24 hours | ✅ Met |

### Resolution Time Breakdown
| Phase | Avg Duration | % of Total |
|-------|--------------|------------|
| Detection | 2 min | 4% |
| Acknowledgment | 4 min | 8% |
| Investigation | 18 min | 36% |
| Resolution | 22 min | 44% |
| Verification | 4 min | 8% |

### Long Resolution Root Causes
| Cause | Occurrences | Avg Added Time |
|-------|-------------|----------------|
| Missing runbook | 23 | +34 min |
| Wrong escalation | 12 | +23 min |
| External dependency | 18 | +45 min |
| Complex diagnosis | 8 | +56 min |

### Recommendations
1. Create runbooks for top 5 longest alerts
2. Review escalation paths for critical alerts
3. Add external dependency status to alerts`,
  },
  {
    question: "Show alert dependency mapping",
    answer: `## Alert Dependency Mapping

### Service Dependencies
\`\`\`
[api-gateway] (12 alerts/week)
├── [auth-service] (5 alerts/week)
│   └── [user-database] (2 alerts/week)
├── [order-service] (8 alerts/week)
│   ├── [inventory-service] (4 alerts/week)
│   └── [payment-service] (10 alerts/week)
│       └── [stripe-api] (3 alerts/week)
└── [search-service] (3 alerts/week)
    └── [elasticsearch] (2 alerts/week)
\`\`\`

### Cascade Risk Matrix
| If This Fails | These Alert | Impact |
|---------------|-------------|--------|
| user-database | 3 services | High |
| payment-service | 2 services | High |
| elasticsearch | 1 service | Medium |
| stripe-api | 1 service | Medium |

### Historical Cascades
| Root Cause | Cascade Size | Duration | Date |
|------------|--------------|----------|------|
| user-database down | 5 alerts | 23 min | Jan 15 |
| payment-service OOM | 3 alerts | 12 min | Jan 22 |
| network partition | 8 alerts | 45 min | Jan 28 |

### Dependency Alert Configuration
\`\`\`yaml
# Example: Payment service depends on database
alert: PaymentServiceDown
depends_on:
  - UserDatabaseDown
  - StripeAPIDown
suppress_if_parent_firing: true
\`\`\`

### Single Points of Failure
| Component | Dependent Services | Mitigation |
|-----------|-------------------|------------|
| user-database | 3 | Multi-AZ |
| api-gateway | All | Load balanced |
| redis-cache | 4 | Cluster mode |

### Recommendations
1. Implement dependency-aware alerting
2. Add redundancy for SPOFs
3. Create cascade prevention alerts`,
  },
  {
    question: "Analyze alert notification channels",
    answer: `## Alert Notification Channel Analysis

### Channel Performance
| Channel | Alerts Sent | Delivery Rate | Avg Latency |
|---------|-------------|---------------|-------------|
| PagerDuty | 234 | 99.9% | 2.3s |
| Slack | 1,456 | 99.5% | 1.2s |
| Email | 890 | 98.2% | 8.5s |
| SMS | 45 | 97.8% | 4.5s |
| Webhook | 234 | 99.1% | 3.2s |

### Channel by Severity
| Severity | Primary | Secondary | Tertiary |
|----------|---------|-----------|----------|
| Critical | PagerDuty | Slack | SMS |
| High | Slack | Email | - |
| Medium | Slack | - | - |
| Low | Email (digest) | - | - |

### Response Time by Channel
| Channel | Avg Response | Best | Worst |
|---------|--------------|------|-------|
| PagerDuty | 3.2 min | 1 min | 8 min |
| Slack | 12 min | 2 min | 45 min |
| Email | 2.3 hr | 15 min | 8 hr |
| SMS | 5 min | 1 min | 15 min |

### Notification Failures (Last 30 Days)
| Channel | Failures | Cause |
|---------|----------|-------|
| Email | 16 | Bounce/spam |
| SMS | 10 | Invalid number |
| Webhook | 8 | Timeout |
| Slack | 7 | Rate limit |
| PagerDuty | 1 | API error |

### Channel Recommendations
| Issue | Solution |
|-------|----------|
| Email bounces | Verify addresses |
| SMS failures | Update phone numbers |
| Webhook timeouts | Increase timeout |
| Slack rate limits | Batch notifications |

### Cost Analysis
| Channel | Cost/Month | Alerts | Cost/Alert |
|---------|------------|--------|------------|
| PagerDuty | $234 | 234 | $1.00 |
| Twilio SMS | $45 | 45 | $1.00 |
| Slack | $0 | 1,456 | $0.00 |
| Email | $12 | 890 | $0.01 |`,
  },
  {
    question: "Show alert deduplication effectiveness",
    answer: `## Alert Deduplication Analysis

### Deduplication Statistics
| Metric | Value |
|--------|-------|
| Raw alerts generated | 8,901 |
| After deduplication | 2,347 |
| Dedup ratio | 73.6% |
| Savings | 6,554 alerts |

### Deduplication by Alert
| Alert | Raw | Deduped | Reduction |
|-------|-----|---------|-----------|
| HighCPU | 1,234 | 234 | 81% |
| HighMemory | 890 | 156 | 82% |
| PodRestart | 567 | 89 | 84% |
| LatencySpike | 456 | 123 | 73% |
| ErrorRate | 345 | 78 | 77% |

### Deduplication Rules
\`\`\`yaml
# Example dedup configuration
group_by: [alertname, service, env]
group_wait: 30s
group_interval: 5m
repeat_interval: 4h
\`\`\`

### Grouping Effectiveness
| Group | Alerts/Group | Max Group Size |
|-------|--------------|----------------|
| By service | 4.2 | 23 |
| By alert type | 3.8 | 18 |
| By namespace | 2.9 | 12 |

### Missed Groupings
| Pattern | Occurrence | Fix |
|---------|------------|-----|
| Same issue, different labels | 89 | Normalize labels |
| Timing misalignment | 45 | Extend group_wait |
| Cross-service incident | 23 | Add correlation |

### Recommendations
1. Increase group_wait to 60s
2. Add service_group label for grouping
3. Implement cross-service correlation`,
  },
  {
    question: "Find alerts with missing context",
    answer: `## Alert Context Quality Analysis

### Context Completeness
| Field | Coverage | Importance |
|-------|----------|------------|
| Service name | 100% | Critical |
| Environment | 98% | Critical |
| Severity | 100% | Critical |
| Runbook URL | 76% | High |
| Dashboard link | 67% | High |
| Related traces | 34% | Medium |
| Recent changes | 23% | Medium |

### Alerts Missing Critical Context
| Alert | Missing Fields | Priority |
|-------|----------------|----------|
| HighLatencyGeneric | service, dashboard | P1 |
| ErrorRateHigh | runbook, traces | P1 |
| PodUnhealthy | env, namespace | P1 |
| DiskSpaceLow | host, dashboard | P2 |
| MemoryWarn | pod, traces | P2 |

### Example: Well-Contextualized Alert
\`\`\`yaml
alert: HighErrorRate
labels:
  severity: critical
  service: payment-service
  env: production
  team: payments
annotations:
  summary: "Error rate {{ $value }}% on {{ $labels.service }}"
  description: "Error rate exceeded threshold of 1%"
  runbook: "https://runbooks.telemetryflow.id/high-error-rate"
  dashboard: "https://grafana.telemetryflow.id/d/errors"
  trace_link: "https://jaeger.telemetryflow.id/trace/{{ $labels.trace_id }}"
  recent_changes: "deployment: v2.3.1 (2h ago)"
\`\`\`

### Context Usage Statistics
| Field | Accessed | Helpful Rating |
|-------|----------|----------------|
| Runbook | 78% | 4.2/5 |
| Dashboard | 89% | 4.5/5 |
| Traces | 45% | 4.8/5 |
| Recent changes | 34% | 4.6/5 |

### Recommendations
1. Add runbook URLs to all High/Critical alerts
2. Auto-link to relevant dashboards
3. Include trace sampling in alerts
4. Add deployment context annotation`,
  },
  {
    question: "Show alert cost analysis",
    answer: `## Alert Cost Analysis

### Alert Volume Costs
| Category | Alerts/Month | Cost | Trend |
|----------|--------------|------|-------|
| Email | 12,345 | $45 | Stable |
| SMS | 2,345 | $234 | Rising |
| PagerDuty | 890 | $89 | Stable |
| Slack | 45,678 | Free | Rising |

### Cost Breakdown
| Service | Alerts | Cost/Alert | Total |
|---------|--------|------------|-------|
| payment-svc | 456 | $0.12 | $54.72 |
| order-svc | 234 | $0.08 | $18.72 |
| api-gateway | 189 | $0.05 | $9.45 |

### Cost Optimization
| Opportunity | Current | Proposed | Savings |
|-------------|---------|----------|---------|
| Reduce SMS | 2,345 | 500 | $185/mo |
| Deduplicate | 45K | 30K | $45/mo |
| Batch notifications | - | Enable | $23/mo |

### Recommendations
1. Escalate to SMS only for Critical alerts
2. Enable alert batching for Warning level
3. Use webhook instead of email for Info level`,
  },
  {
    question: "Analyze alert correlation rules",
    answer: `## Alert Correlation Rules

### Active Rules
| Rule | Trigger | Suppresses | Effectiveness |
|------|---------|------------|---------------|
| DB-cascade | DB_DOWN | 5 downstream | 89% |
| Network-chain | NET_FAIL | 3 services | 92% |
| Deploy-window | DEPLOY_START | All warnings | 95% |

### Correlation Statistics
| Metric | Value | Improvement |
|--------|-------|-------------|
| Alerts before correlation | 4,567/hr | Baseline |
| Alerts after correlation | 1,234/hr | -73% |
| Root cause identified | 89% | +45% |

### Suggested New Rules
| Pattern Detected | Frequency | Suggested Rule |
|------------------|-----------|----------------|
| Memory → GC → Latency | 45/week | Create cascade |
| Cache → DB → Timeout | 23/week | Create cascade |
| Auth → API → 5xx | 12/week | Create cascade |

### Rule Configuration
- Correlation window: 5 minutes
- Minimum confidence: 80%
- Auto-learn: Enabled`,
  },
  {
    question: "Show alert SLA compliance",
    answer: `## Alert SLA Compliance

### Response Time SLAs
| Severity | Target | Actual | Status |
|----------|--------|--------|--------|
| Critical | <5min | 3.2min | Met |
| High | <15min | 12min | Met |
| Medium | <1hr | 45min | Met |
| Low | <4hr | 2.5hr | Met |

### Resolution Time SLAs
| Severity | Target | Actual | Status |
|----------|--------|--------|--------|
| Critical | <1hr | 45min | Met |
| High | <4hr | 3.2hr | Met |
| Medium | <8hr | 6.5hr | Met |
| Low | <24hr | 18hr | Met |

### Compliance Trends
| Month | Compliance | Incidents |
|-------|------------|-----------|
| Oct | 98.5% | 2 breaches |
| Nov | 97.2% | 4 breaches |
| Dec | 99.1% | 1 breach |
| Jan | 99.8% | 0 breaches |

### SLA Breach Analysis
Last breach: Dec 15 - Critical alert response 7min (target: 5min)
Root cause: On-call engineer phone on DND`,
  },
  {
    question: "Analyze alert noise patterns",
    answer: `## Alert Noise Analysis

### Noise Sources
| Source | Volume | % of Total | Action |
|--------|--------|------------|--------|
| Flapping | 234/hr | 23% | Tune threshold |
| Duplicates | 156/hr | 15% | Deduplicate |
| False positives | 89/hr | 9% | Review rules |
| Auto-resolved | 567/hr | 56% | OK |

### Flapping Alerts
| Alert | Flaps/hr | Pattern |
|-------|----------|---------|
| CPU_HIGH | 23 | Every 5min |
| MEMORY_WARN | 15 | Hourly |
| LATENCY_P99 | 12 | Random |

### Noise Reduction Results
| Action | Before | After | Reduction |
|--------|--------|-------|-----------|
| Hysteresis added | 234 | 45 | -81% |
| Dedup window | 156 | 23 | -85% |
| Threshold tuned | 89 | 34 | -62% |

### Recommendations
1. Add 2min hysteresis to CPU_HIGH
2. Increase dedup window to 15min
3. Raise LATENCY_P99 threshold to 500ms`,
  },
  {
    question: "Show alert routing configuration",
    answer: `## Alert Routing Configuration

### Current Routes
| Alert Pattern | Team | Channel | Escalation |
|---------------|------|---------|------------|
| payment-* | payments | #alerts-payments | PagerDuty |
| order-* | orders | #alerts-orders | PagerDuty |
| infra-* | platform | #alerts-infra | Opsgenie |
| security-* | security | #alerts-security | PagerDuty |

### Route Statistics
| Route | Alerts/Day | Ack Rate | MTTR |
|-------|------------|----------|------|
| payments | 45 | 98% | 12min |
| orders | 67 | 95% | 18min |
| platform | 234 | 89% | 25min |
| security | 12 | 100% | 8min |

### Routing Gaps
| Alert | Current Route | Suggested |
|-------|---------------|-----------|
| DB_SLOW | platform | database |
| CACHE_MISS | platform | application |
| AUTH_FAIL | security | auth-team |

### Schedule-Based Routing
| Time | Primary | Backup |
|------|---------|--------|
| Weekday | On-call | Team lead |
| Weekend | Senior eng | Escalation |
| Holiday | Skeleton | Full team |`,
  },
  {
    question: "Analyze alert acknowledgment patterns",
    answer: `## Alert Acknowledgment Analysis

### Ack Statistics
| Time Period | Avg Ack Time | Ack Rate |
|-------------|--------------|----------|
| Business hours | 2.3min | 98% |
| After hours | 8.5min | 92% |
| Weekends | 12min | 85% |

### Team Performance
| Team | Avg Ack | Rate | Trend |
|------|---------|------|-------|
| payments | 1.8min | 99% | Improving |
| orders | 3.2min | 96% | Stable |
| platform | 5.5min | 89% | Declining |
| security | 1.2min | 100% | Best |

### Unacked Alert Analysis
| Duration | Count | % |
|----------|-------|---|
| <5min | 0 | 0% |
| 5-15min | 12 | 2% |
| 15-30min | 5 | 1% |
| >30min | 2 | 0.4% |

### Improvement Actions
1. Add reminder at 3min for Critical
2. Auto-escalate at 5min if unacked
3. Review platform team on-call schedule`,
  },
  {
    question: "Show alert dependency mapping",
    answer: `## Alert Dependencies

### Dependency Tree
| Primary Alert | Dependent Alerts | Suppression |
|---------------|------------------|-------------|
| DB_PRIMARY_DOWN | 12 alerts | Auto-suppress |
| NETWORK_OUTAGE | 8 alerts | Auto-suppress |
| REDIS_CLUSTER_FAIL | 5 alerts | Auto-suppress |

### Dependency Chains
DB_PRIMARY_DOWN
├── API_TIMEOUT (suppressed)
├── ORDER_FAILS (suppressed)
├── PAYMENT_FAILS (suppressed)
└── NOTIFICATION_QUEUE_FULL (suppressed)

### Dependency Statistics
| Metric | Value |
|--------|-------|
| Mapped dependencies | 156 |
| Auto-suppress rate | 78% |
| False suppressions | 2% |

### Unmapped Dependencies
| Alert Pair | Correlation | Action |
|------------|-------------|--------|
| GC_PAUSE → LATENCY | 0.89 | Map |
| DISK_FULL → DB_SLOW | 0.92 | Map |
| CPU_HIGH → TIMEOUT | 0.76 | Review |

### Recommendations
1. Map GC_PAUSE → LATENCY dependency
2. Add DISK_FULL as DB_SLOW parent`,
  },
  {
    question: "Analyze alert escalation effectiveness",
    answer: `## Escalation Effectiveness

### Escalation Statistics
| Level | Escalations | Avg Time | Resolution |
|-------|-------------|----------|------------|
| L1 → L2 | 234/mo | 15min | 67% |
| L2 → L3 | 78/mo | 30min | 89% |
| L3 → Management | 12/mo | 1hr | 100% |

### Escalation Reasons
| Reason | Count | % |
|--------|-------|---|
| Timeout | 156 | 50% |
| Skill gap | 89 | 28% |
| Severity upgrade | 45 | 14% |
| Resource needed | 24 | 8% |

### De-escalation Stats
| Metric | Value |
|--------|-------|
| De-escalated | 23% |
| False escalations | 8% |
| Avg resolution level | L1.4 |

### Optimization Opportunities
| Issue | Current | Proposed | Impact |
|-------|---------|----------|--------|
| Timeout too short | 10min | 15min | -20% false |
| Wrong L1 skills | - | Training | -15% escalations |
| Missing runbooks | 45% | 90% | -25% L2 |

### Recommendations
1. Extend L1 timeout to 15 minutes
2. Create runbooks for top 10 alerts
3. Train L1 on database troubleshooting`,
  },
  {
    question: "Show alert audit trail",
    answer: `## Alert Audit Trail

### Recent Alert Activity
| Time | Alert | Action | User |
|------|-------|--------|------|
| 14:30 | CPU_HIGH | Acked | john@ops |
| 14:28 | MEMORY_WARN | Silenced | jane@dev |
| 14:25 | LATENCY_P99 | Resolved | auto |
| 14:20 | DB_CONN | Escalated | system |

### Configuration Changes
| Date | Change | User | Impact |
|------|--------|------|--------|
| Jan 28 | Threshold: 80→85% | admin | -15% alerts |
| Jan 25 | New rule: GC_PAUSE | devops | +12 alerts/day |
| Jan 22 | Route: security | ops | Improved MTTR |

### Audit Statistics
| Period | Config Changes | Silences | Acks |
|--------|----------------|----------|------|
| Today | 3 | 12 | 156 |
| This Week | 15 | 67 | 1,234 |
| This Month | 45 | 234 | 5,678 |

### Compliance
- All changes require approval: Yes
- Audit log retention: 90 days
- Last audit review: Jan 15, 2025`,
  },
];

export const ALERTS_CONVERSATION_TITLES = [
  "Alert fatigue analysis for on-call team",
  "Critical alert correlation study",
  "False positive rate investigation",
  "Alert threshold optimization",
  "Escalation pattern analysis",
  "On-call metrics review",
  "Alert routing configuration",
  "Maintenance window planning",
  "Alert deduplication tuning",
  "Runbook coverage audit",
];

// ==================== ALERT RULES CONTEXT ====================

export const ALERT_RULES_MOCK_DATA: MockQA[] = [
  {
    question: "Show me all active alert rules",
    answer: `## Alert Rules Overview

### Summary
| Status | Count | Coverage |
|--------|-------|----------|
| Active | 47 | ✅ |
| Inactive | 8 | ⏸ Disabled |
| Draft | 3 | 📝 Pending review |
| **Total** | **58** | |

### Rules by Category
| Category | Active Rules | Firing | Silenced |
|----------|-------------|--------|----------|
| Infrastructure | 14 | 2 | 1 |
| Application | 18 | 3 | 0 |
| Database | 8 | 1 | 2 |
| Kubernetes | 7 | 0 | 0 |

### Recently Modified Rules
| Rule | Changed | By | Change |
|------|---------|-----|--------|
| HighCPUUsage | 2h ago | john.admin | Threshold 70%→85% |
| PaymentTimeout | 1d ago | sarah.devops | Added runbook URL |
| DiskSpaceLow | 3d ago | mike.sre | Window 1m→5m |
| PodCrashLoop | 5d ago | ci-cd-bot | Added K8s label filter |

### Top Firing Rules (Last 24h)
| Rule | Fires | Severity | False Positive Rate |
|------|-------|----------|---------------------|
| HighMemoryUsage | 23 | Warning | 41% |
| PodRestart | 18 | Warning | 28% |
| HighErrorRate | 9 | Critical | 11% |
| DiskSpaceLow | 7 | Warning | 86% ⚠️ |
| APILatencyHigh | 5 | High | 20% |

> ⚠️ **DiskSpaceLow** has an 86% false positive rate — recommend raising threshold from 85% → 92%.`,
  },
  {
    question: "How do I create a new alert rule?",
    answer: `## Creating Alert Rules

### Via UI
1. Navigate to **Alerts → Rules**
2. Click **+ New Rule**
3. Fill in rule details:
   - **Name**: descriptive, kebab-case (e.g., \`high-error-rate-payment\`)
   - **Severity**: Critical / High / Warning / Info
   - **Expression**: PromQL query (metrics) or log filter (logs)
   - **For**: duration before firing (e.g., \`5m\`)
   - **Labels**: \`team\`, \`service\`, \`env\`
   - **Annotations**: \`summary\`, \`description\`, \`runbook\`
4. Configure **notification channels**
5. Set **silencing rules** (optional)
6. Click **Test Rule** to preview firing behavior
7. Click **Save & Activate**

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "high-error-rate-payment",
    "severity": "critical",
    "expression": "rate(http_requests_total{service=\\"payment-service\\",status=~\\"5..*\\"}[5m]) / rate(http_requests_total{service=\\"payment-service\\"}[5m]) > 0.01",
    "for": "2m",
    "labels": {
      "team": "payments",
      "service": "payment-service",
      "env": "production"
    },
    "annotations": {
      "summary": "Error rate {{ $value | humanizePercentage }} on payment-service",
      "description": "Payment service error rate has exceeded 1% threshold",
      "runbook": "https://runbooks.telemetryflow.id/high-error-rate"
    },
    "channels": ["slack-#alerts-prod", "pagerduty-oncall"],
    "isActive": true
  }'
\`\`\`

### PromQL Expression Examples
| Use Case | Expression |
|----------|-----------|
| High CPU | \`avg(cpu_usage_percent{env="production"}) > 85\` |
| Error rate | \`rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.01\` |
| Memory | \`(node_memory_MemTotal - node_memory_MemAvailable) / node_memory_MemTotal > 0.9\` |
| Latency P99 | \`histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1\` |
| Pod restarts | \`increase(kube_pod_container_status_restarts_total[1h]) > 5\` |`,
  },
  {
    question: "Which alert rules have the highest false positive rate?",
    answer: `## False Positive Analysis

### High False Positive Rules (Last 30 Days)
| Rule | Fires | FP Rate | FP Count | Root Cause |
|------|-------|---------|----------|------------|
| DiskSpaceLow | 234 | 86% | 201 | Threshold too low (85%) |
| HighCPUUsage | 456 | 78% | 356 | No evaluation window |
| PodNotReady | 189 | 71% | 134 | Fires during deployments |
| DiskSpaceWarning | 123 | 68% | 84 | Overlaps with DiskSpaceLow |
| HighMemoryUsage | 345 | 45% | 155 | GC spikes counted |

### Root Cause Breakdown
| Cause | Rules Affected | Fix |
|-------|---------------|-----|
| Threshold too aggressive | 12 rules | Increase by 5-15% |
| No evaluation window | 8 rules | Add \`for: 5m\` |
| No hysteresis | 6 rules | Add resolve threshold |
| Overlapping rules | 4 pairs | Deduplicate or suppress |
| Deployment noise | 5 rules | Add deployment label filter |

### Recommended Fixes
#### DiskSpaceLow
\`\`\`yaml
# Before
expr: disk_usage_percent > 85
for: 1m

# After
expr: disk_usage_percent > 92
for: 10m
\`\`\`

#### HighCPUUsage
\`\`\`yaml
# Before
expr: cpu_usage_percent > 70
for: 1m

# After
expr: avg_over_time(cpu_usage_percent[5m]) > 85
for: 5m
\`\`\`

### Expected Impact After Fixes
| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Total false positives | 930 | 195 | **-79%** |
| On-call pages | 89 | 23 | **-74%** |
| Alert noise score | High | Low | ✅ |`,
  },
  {
    question: "How do I duplicate or clone an existing alert rule?",
    answer: `## Duplicate / Clone Alert Rule

### Why Clone Rules?
- Reuse the same expression with different thresholds for different services
- Create a staging version of a rule for testing before applying to production
- Apply the same rule pattern across multiple teams with different channels

### Clone via UI
1. Navigate to **Alerts → Rules**
2. Find the rule to clone
3. Click the **...** menu → **Clone Rule**
4. A copy is created with name prefix "Copy of ..."
5. Edit the clone: update name, thresholds, labels, and channels
6. Click **Save & Activate**

### Clone via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123/clone \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "high-error-rate-checkout",
    "labels": {
      "team": "checkout",
      "service": "checkout-service"
    }
  }'
\`\`\`

### Clone and Modify Expression
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123/clone \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "high-error-rate-checkout",
    "expression": "rate(http_requests_total{service=\\"checkout-service\\",status=~\\"5..*\\"}[5m]) / rate(http_requests_total{service=\\"checkout-service\\"}[5m]) > 0.01",
    "channels": ["slack-checkout-team"]
  }'
\`\`\`

### Common Clone Use Cases
| Scenario | What to Change in Clone |
|----------|------------------------|
| New service coverage | \`service\` label in expression and labels |
| Different threshold | \`expression\` threshold value |
| Different team notification | \`channels\` array |
| Staging environment | \`env\` label + severity downgrade |`,
  },
  {
    question: "How do I disable or enable alert rules?",
    answer: `## Disable and Enable Alert Rules

### Disable a Rule
Disabling a rule stops it from evaluating and firing. The rule config is preserved.

#### Via UI
1. Navigate to **Alerts → Rules**
2. Find the rule
3. Click the toggle switch to **Disable**
4. Confirm — the rule stops firing immediately

#### Via API
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "isActive": false }'
\`\`\`

### Enable a Rule
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "isActive": true }'
\`\`\`

### Bulk Enable / Disable
\`\`\`bash
# Disable multiple rules at once
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/bulk \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "action": "disable",
    "ruleIds": ["rule-abc123", "rule-def456", "rule-ghi789"]
  }'
\`\`\`

### When to Disable vs Delete
| Situation | Action |
|-----------|--------|
| Temporary maintenance window | Disable (re-enable after) |
| Rule under review | Disable |
| Rule is permanently obsolete | Delete |
| Testing new threshold | Disable old rule, create new one |

### Currently Disabled Rules (8)
| Rule | Disabled By | Disabled Since | Reason |
|------|------------|----------------|--------|
| OldDiskSpaceAlert | john.admin | 7d ago | Superseded by new rule |
| StagingHighCPU | ci-cd-bot | 2d ago | Maintenance |`,
  },
  {
    question: "How do I configure rule evaluation frequency?",
    answer: `## Alert Rule Evaluation Frequency

### What Is Evaluation Frequency?
Evaluation frequency determines how often the alert expression is evaluated against current data. Lower frequency = faster detection, higher resource usage.

### Current Evaluation Settings
| Rule Group | Interval | Rules | Notes |
|-----------|---------|-------|-------|
| critical-rules | 30s | 8 | High-priority — frequent evaluation |
| application-rules | 1m | 18 | Standard application metrics |
| infrastructure-rules | 2m | 14 | Node/pod-level metrics |
| database-rules | 1m | 8 | DB connection and query metrics |
| informational-rules | 5m | 9 | Low-priority, infrequent |

### Set Evaluation Interval Per Rule Group
\`\`\`bash
curl -X PATCH https://api.telemetryflow.id/api/v2/alerts/rule-groups/critical-rules \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "evaluationInterval": "30s" }'
\`\`\`

### Supported Intervals
| Interval | Use Case |
|----------|---------|
| \`15s\` | Critical SLA rules (use sparingly) |
| \`30s\` | Critical / P1 rules |
| \`1m\` | Standard application rules |
| \`2m\` | Infrastructure / node rules |
| \`5m\` | Informational / low-priority rules |

### Balance: Speed vs. Cost
| Interval | ClickHouse Queries/day (per rule) | Notes |
|----------|----------------------------------|-------|
| 15s | 5,760 | Very high — use for critical only |
| 30s | 2,880 | High — acceptable for P1 |
| 1m | 1,440 | Standard |
| 5m | 288 | Low — good for informational |

> Evaluation frequency must be at least 2x the \`for\` duration to be meaningful. E.g., if \`for: 5m\`, set interval to \`1m\` or \`2m\`.`,
  },
  {
    question: "How do I test an alert rule with a dry-run?",
    answer: `## Alert Rule Dry-Run Testing

### What Is a Dry-Run?
A dry-run evaluates the alert expression against real data without sending notifications. It shows you whether the rule would currently fire and why.

### Run a Dry-Run Test
#### Via UI
1. Navigate to **Alerts → Rules → [Rule Name]**
2. Click **Test Rule**
3. Select time range for evaluation: e.g., Last 1 hour
4. Click **Run Test**
5. Results show: firing status, current value, threshold comparison

#### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123/test \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "from": "2026-03-01T08:00:00Z",
    "to": "2026-03-01T09:00:00Z"
  }'
\`\`\`

### Dry-Run Response
\`\`\`json
{
  "ruleId": "rule-abc123",
  "status": "firing",
  "currentValue": 0.023,
  "threshold": 0.01,
  "exceedsThreshold": true,
  "forDuration": "2m",
  "wouldFire": true,
  "timeline": [
    { "timestamp": "2026-03-01T08:45:00Z", "value": 0.024, "state": "firing" },
    { "timestamp": "2026-03-01T08:44:00Z", "value": 0.019, "state": "firing" },
    { "timestamp": "2026-03-01T08:43:00Z", "value": 0.007, "state": "ok" }
  ],
  "notificationsWouldSend": ["slack-#alerts-prod", "pagerduty-oncall"],
  "dryRun": true
}
\`\`\`

### Test New Rules Before Creating
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/test-expression \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "expression": "avg(cpu_usage_percent{env=\\"production\\"}) > 85",
    "for": "5m",
    "from": "2026-03-01T00:00:00Z",
    "to": "2026-03-01T09:00:00Z"
  }'
\`\`\``,
  },
  {
    question: "How do I create multi-condition alert rules?",
    answer: `## Multi-Condition Alert Rules

### Why Multi-Condition Rules?
Single-metric rules have high false positive rates. Combining conditions reduces noise:
- CPU high AND memory high → more likely a real issue
- Error rate high AND latency high → genuine service degradation

### AND Conditions (Both Must Be True)
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "service-degradation-payment",
    "severity": "critical",
    "expression": "rate(http_requests_total{service=\\"payment\\",status=~\\"5..*\\"}[5m]) / rate(http_requests_total{service=\\"payment\\"}[5m]) > 0.01 AND histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service=\\"payment\\"}[5m])) > 1",
    "for": "2m",
    "labels": { "service": "payment", "env": "production" }
  }'
\`\`\`

### OR Conditions (Either Triggers)
\`\`\`
(error_rate > 0.05) OR (latency_p99 > 2)
\`\`\`

### Multi-Metric with Correlation
\`\`\`
# Alert when error rate is high relative to request rate
rate(errors_total[5m]) / rate(requests_total[5m]) > 0.02
AND rate(requests_total[5m]) > 10
\`\`\`
This prevents false alerts during low-traffic periods.

### Condition Examples
| Pattern | Expression |
|---------|-----------|
| CPU AND Memory | \`cpu > 85 AND memory > 90\` |
| High errors AND traffic | \`error_rate > 0.01 AND rps > 100\` |
| P99 OR error rate | \`p99_latency > 1 OR error_rate > 0.05\` |
| Disk AND no recent writes | \`disk_usage > 90 AND rate(disk_writes[5m]) < 0.1\` |

### Alert Grouping for Multi-Conditions
Labels are used to group related multi-condition alerts into a single incident in PagerDuty or OpsGenie.`,
  },
  {
    question: "How do I import and export alert rules?",
    answer: `## Alert Rule Import and Export

### Export Alert Rules

#### Export All Rules (JSON)
\`\`\`bash
curl https://api.telemetryflow.id/api/v2/alerts/rules/export \\
  -H "Authorization: Bearer $TOKEN" \\
  -o alert-rules-backup.json
\`\`\`

#### Export Filtered (by team or service)
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/alerts/rules/export?team=payments&format=json" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o payments-rules.json
\`\`\`

#### Export as YAML (Prometheus-compatible)
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/alerts/rules/export?format=yaml" \\
  -H "Authorization: Bearer $TOKEN" \\
  -o alert-rules.yaml
\`\`\`

### Import Alert Rules
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/import \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d @alert-rules-backup.json
\`\`\`

### Import Options
| Option | Behavior |
|--------|---------|
| \`mode: "merge"\` | Add new rules, skip existing (default) |
| \`mode: "overwrite"\` | Replace existing rules with same name |
| \`mode: "dry-run"\` | Preview what would be imported without applying |
| \`activate: false\` | Import rules as inactive (requires manual enable) |

### Export Format (JSON)
\`\`\`json
{
  "version": "2.0",
  "exportedAt": "2026-03-01T09:00:00Z",
  "rules": [
    {
      "name": "high-error-rate-payment",
      "severity": "critical",
      "expression": "...",
      "for": "2m",
      "labels": { "team": "payments" },
      "annotations": { "summary": "...", "runbook": "..." },
      "channels": ["slack-#alerts-prod"]
    }
  ]
}
\`\`\``,
  },
  {
    question: "How do I view alert rule version history?",
    answer: `## Alert Rule Version History

### What Is Version History?
Every change to an alert rule is recorded: expression edits, threshold changes, label updates, channel modifications. You can view the full history and revert to previous versions.

### View Version History
#### Via UI
1. Navigate to **Alerts → Rules → [Rule Name]**
2. Click the **History** tab
3. Browse the list of versions with author and timestamp
4. Click **View Diff** to see what changed
5. Click **Restore** to revert to a previous version

#### Via API
\`\`\`bash
curl "https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123/history" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Sample History Response
\`\`\`json
[
  {
    "version": 5,
    "changedBy": "john.admin",
    "changedAt": "2026-03-01T08:30:00Z",
    "changes": {
      "expression": { "from": "cpu > 70", "to": "cpu > 85" },
      "for": { "from": "1m", "to": "5m" }
    }
  },
  {
    "version": 4,
    "changedBy": "sarah.devops",
    "changedAt": "2026-02-28T14:20:00Z",
    "changes": {
      "annotations.runbook": { "from": null, "to": "https://runbooks.../high-cpu" }
    }
  }
]
\`\`\`

### Revert to Previous Version
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules/rule-abc123/history/4/restore \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Version Retention
| Setting | Value |
|---------|-------|
| Versions retained | Last 50 versions per rule |
| Retention period | 1 year |
| Who can view | Any user with alert rule read access |
| Who can restore | Alert rule editors and Org Admins |`,
  },
];

export const ALERT_RULES_CONVERSATION_TITLES: string[] = [
  "Active alert rules overview",
  "Create new alert rule",
  "False positive rate reduction",
  "Duplicate and clone alert rules",
  "Disable and enable rules",
  "Rule evaluation frequency",
  "Dry-run rule testing",
  "Multi-condition alert rules",
  "Import and export rules",
  "Rule version history",
];
