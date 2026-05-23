/**
 * Agents Context Mock Data for LLM AI Insights
 * Contains 30 realistic Q&A pairs for monitoring agents analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const AGENTS_MOCK_DATA: MockQA[] = [
  {
    question: "Why are some monitoring agents showing offline status?",
    answer: `## Offline Agents Analysis

### Agent Status Overview
| Agent | Host | Status | Last Seen | Offline Duration |
|-------|------|--------|-----------|------------------|
| agent-prod-01 | srv-web-01 | ✅ Online | 30s ago | - |
| agent-prod-02 | srv-web-02 | ❌ Offline | 2h 15m ago | 2h 15m |
| agent-prod-03 | srv-api-01 | ✅ Online | 45s ago | - |
| agent-prod-04 | srv-api-02 | ❌ Offline | 45m ago | 45m |
| agent-prod-05 | srv-db-01 | ⚠️ Degraded | 5m ago | Intermittent |

### Root Cause Analysis

#### agent-prod-02 (2h 15m offline)
\`\`\`
Last Error: Connection refused to collector:4317
Host Status: Server reachable via SSH
Agent Process: Not running
\`\`\`

**Likely Cause:** Agent process crashed or was killed
**Recovery Steps:**
\`\`\`bash
# SSH to srv-web-02
systemctl status telemetryflow-agent
systemctl restart telemetryflow-agent
\`\`\`

#### agent-prod-04 (45m offline)
\`\`\`
Last Error: TLS handshake timeout
Network: Firewall rule change detected at 14:30
\`\`\`

**Likely Cause:** Network/firewall configuration change
**Recovery Steps:** Verify port 4317 is open

### Recommended Actions
1. Restart crashed agent on srv-web-02
2. Check firewall rules for srv-api-02
3. Enable agent auto-restart on failure
4. Set up agent health alerting`,
  },
  {
    question: "Show me the resource utilization across all agents",
    answer: `## Agent Resource Utilization

### CPU & Memory Usage
| Agent | Host | CPU % | Memory | Disk I/O | Network |
|-------|------|-------|--------|----------|---------|
| agent-prod-01 | srv-web-01 | 2.3% | 156MB | 12KB/s | 450KB/s |
| agent-prod-02 | srv-web-02 | 1.8% | 142MB | 8KB/s | 380KB/s |
| agent-prod-03 | srv-api-01 | 4.2% | 198MB | 45KB/s | 1.2MB/s |
| agent-prod-04 | srv-api-02 | 3.5% | 178MB | 32KB/s | 890KB/s |
| agent-prod-05 | srv-db-01 | 8.7% | 312MB | 125KB/s | 2.4MB/s |

### High Resource Consumers

#### agent-prod-05: Elevated Usage
- **CPU:** 8.7% (threshold: 5%)
- **Memory:** 312MB (threshold: 256MB)
- **Root Cause:** High log volume from database queries

\`\`\`yaml
# Optimize agent configuration
processors:
  batch:
    send_batch_size: 10000  # Increase batch size
    timeout: 10s
  filter:
    logs:
      exclude:
        match_type: regexp
        bodies:
          - ".*SELECT 1.*"  # Filter health check logs
\`\`\`

### Resource Trends (7 days)
| Metric | Min | Avg | Max | Trend |
|--------|-----|-----|-----|-------|
| CPU | 1.2% | 3.8% | 12.5% | ↗ +15% |
| Memory | 128MB | 197MB | 450MB | ↗ +8% |
| Network | 200KB/s | 1.1MB/s | 4.5MB/s | → Stable |

### Recommendations
1. Add log filtering for agent-prod-05
2. Increase batch size to reduce CPU overhead
3. Consider sampling for high-volume endpoints`,
  },
  {
    question: "What telemetry data are the agents collecting?",
    answer: `## Agent Telemetry Collection Summary

### Data Collection by Type
| Agent | Metrics/min | Logs/min | Traces/min | Total/min |
|-------|-------------|----------|------------|-----------|
| agent-prod-01 | 1,250 | 890 | 2,340 | 4,480 |
| agent-prod-02 | 1,180 | 1,200 | 1,890 | 4,270 |
| agent-prod-03 | 2,450 | 3,400 | 5,670 | 11,520 |
| agent-prod-04 | 2,120 | 2,800 | 4,890 | 9,810 |
| agent-prod-05 | 3,890 | 8,500 | 1,200 | 13,590 |

### Collection Configuration

#### Metrics Collection
| Receiver | Agents | Scrape Interval | Data Points |
|----------|--------|-----------------|-------------|
| hostmetrics | All | 60s | CPU, Memory, Disk, Network |
| prometheus | API agents | 30s | Application metrics |
| statsd | Web agents | 10s | Custom business metrics |

#### Log Collection
| Source | Agents | Format | Volume |
|--------|--------|--------|--------|
| /var/log/app/*.log | All | JSON | 12,000/min |
| /var/log/nginx/*.log | Web | Combined | 4,500/min |
| journald | All | Structured | 2,800/min |

#### Trace Collection
| Protocol | Agents | Sampling | Spans/min |
|----------|--------|----------|-----------|
| OTLP/gRPC | All | 100% | 15,990 |
| Jaeger | Legacy | 10% | 450 |
| Zipkin | None | - | - |

### Top Collected Metrics
| Metric Name | Cardinality | Frequency |
|-------------|-------------|-----------|
| http_requests_total | 2,450 | 30s |
| process_cpu_seconds | 5 | 60s |
| go_memstats_alloc_bytes | 5 | 60s |
| custom_business_events | 890 | 10s |

### Data Flow
\`\`\`
Agents → Collector → [Processors] → Exporters
                          ↓
                    ClickHouse (Metrics, Logs, Traces)
\`\`\``,
  },
  {
    question: "Are there any agents with version mismatches?",
    answer: `## Agent Version Analysis

### Version Distribution
| Version | Agents | Status | Released |
|---------|--------|--------|----------|
| v1.8.2 | 12 | ✅ Latest | 2 weeks ago |
| v1.8.1 | 8 | ⚠️ Update available | 1 month ago |
| v1.7.5 | 3 | 🔴 Outdated | 3 months ago |
| v1.6.0 | 2 | 🔴 Critical EOL | 8 months ago |

### Agents Requiring Updates

#### Critical (v1.6.0) - Security Patches Missing
| Agent | Host | Environment |
|-------|------|-------------|
| agent-legacy-01 | srv-old-01 | production |
| agent-legacy-02 | srv-old-02 | staging |

**Security Issues:**
- CVE-2024-1234: Memory disclosure vulnerability
- CVE-2024-5678: TLS certificate validation bypass

#### Outdated (v1.7.5)
| Agent | Host | Environment |
|-------|------|-------------|
| agent-batch-01 | srv-batch-01 | production |
| agent-batch-02 | srv-batch-02 | production |
| agent-batch-03 | srv-batch-03 | jobs |

### Update Recommendations

\`\`\`bash
# Update agent to latest version
# On each host:
wget https://releases.telemetryflow.id/agent/v1.8.2/install.sh
sudo bash install.sh --upgrade

# Verify version
telemetryflow-agent --version
\`\`\`

### Version Compatibility Matrix
| Agent Version | Collector | Breaking Changes |
|---------------|-----------|------------------|
| v1.8.x | v0.90+ | None |
| v1.7.x | v0.85+ | Config format change |
| v1.6.x | v0.80+ | Deprecated exporters |

### Rollout Plan
1. **Week 1:** Update staging agents (3)
2. **Week 2:** Update production non-critical (8)
3. **Week 3:** Update production critical (12)
4. **Week 4:** Decommission legacy agents (2)`,
  },
  {
    question:
      "How can I optimize agent configuration for high-volume environments?",
    answer: `## Agent Configuration Optimization

### Current vs Recommended Settings

| Setting | Current | Recommended | Impact |
|---------|---------|-------------|--------|
| batch_size | 1000 | 8192 | -60% CPU |
| send_batch_timeout | 1s | 5s | -40% network |
| queue_size | 5000 | 20000 | Prevents drops |
| num_workers | 1 | 4 | +300% throughput |
| compression | none | gzip | -70% bandwidth |

### Optimized Configuration

\`\`\`yaml
receivers:
  otlp:
    protocols:
      grpc:
        max_recv_msg_size_mib: 16
      http:
        max_request_body_size: 16777216

processors:
  batch:
    send_batch_size: 8192
    send_batch_max_size: 16384
    timeout: 5s

  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

  filter/drop-debug:
    logs:
      exclude:
        match_type: strict
        severity_texts:
          - DEBUG
          - TRACE

exporters:
  otlp:
    endpoint: collector.internal:4317
    compression: gzip
    sending_queue:
      enabled: true
      num_consumers: 4
      queue_size: 20000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch]
      exporters: [otlp]
    logs:
      receivers: [otlp, filelog]
      processors: [memory_limiter, filter/drop-debug, batch]
      exporters: [otlp]
\`\`\`

### Performance Comparison
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Throughput | 5K/s | 25K/s | +400% |
| CPU Usage | 15% | 6% | -60% |
| Memory | 512MB | 380MB | -26% |
| Data Loss | 2.3% | 0.01% | -99.5% |
| Latency | 450ms | 120ms | -73% |`,
  },
  {
    question: "Show me the agent heartbeat patterns and anomalies",
    answer: `## Agent Heartbeat Analysis

### Heartbeat Status
| Agent | Expected | Actual | Variance | Status |
|-------|----------|--------|----------|--------|
| agent-prod-01 | 60/hr | 60/hr | 0% | ✅ Normal |
| agent-prod-02 | 60/hr | 58/hr | -3.3% | ✅ Normal |
| agent-prod-03 | 60/hr | 45/hr | -25% | ⚠️ Irregular |
| agent-prod-04 | 60/hr | 60/hr | 0% | ✅ Normal |
| agent-prod-05 | 60/hr | 12/hr | -80% | 🔴 Critical |

### Anomaly Detection

#### agent-prod-03: Irregular Heartbeats
\`\`\`
Pattern: Gaps every 15 minutes
Duration: 2-3 minutes each
Correlation: Coincides with log rotation

Timeline (last hour):
✓ 14:00 | ✓ 14:01 | ... | ✗ 14:15 | ✗ 14:16 | ✓ 14:17
✓ 14:30 | ... | ✗ 14:45 | ✗ 14:46 | ✓ 14:47
\`\`\`

**Root Cause:** Log rotation causing temporary file locks
**Fix:** Configure agent to handle log rotation gracefully

#### agent-prod-05: Severe Heartbeat Loss
\`\`\`
Missing heartbeats: 48/60 (80%)
Last stable period: 3 days ago
Correlates with: Database load spikes

Resource during gaps:
- CPU: 95%+ (threshold exceeded)
- Memory: 98% utilized
- Network: Connection timeouts
\`\`\`

**Root Cause:** Resource exhaustion under load
**Fix:** Increase resource limits or add filtering

### Heartbeat Trend (24 hours)
\`\`\`
      Heartbeats/Hour
  60 |████████████████████████████████████████████████
  50 |████████████████████████████░░░░████████████████
  40 |████████████████████████░░░░░░░░████████████████
  30 |████████████████████░░░░░░░░░░░░████████████████
  20 |██████████████░░░░░░░░░░░░░░░░░░████████████████
  10 |████░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████
   0 +------------------------------------------------
     00:00         06:00         12:00         18:00
\`\`\`

### Alerting Recommendations
\`\`\`yaml
# Add heartbeat alerts
- alert: AgentHeartbeatMissing
  expr: time() - agent_last_heartbeat_timestamp > 120
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Agent {{ $labels.agent }} heartbeat missing"
\`\`\``,
  },
  {
    question: "What errors are the agents reporting?",
    answer: `## Agent Error Analysis

### Error Summary (Last 24h)
| Error Type | Count | Agents Affected | Trend |
|------------|-------|-----------------|-------|
| Connection refused | 1,245 | 3 | ↗ +45% |
| TLS handshake failed | 456 | 2 | → Stable |
| Queue overflow | 234 | 4 | ↗ +120% |
| Memory limit exceeded | 89 | 1 | ↘ -30% |
| Export timeout | 567 | 5 | ↗ +60% |

### Top Errors by Agent

#### agent-prod-03: Connection Refused
\`\`\`
[ERROR] 2024-01-15T14:32:45Z
exporter/otlp: Sending failed
error: connection refused: collector.internal:4317
retries: 3/3 exhausted
dropped: 1,234 spans
\`\`\`

**Analysis:**
- Collector endpoint unreachable
- Network partition or collector down
- 1,234 spans dropped in 1 hour

#### agent-prod-05: Queue Overflow
\`\`\`
[WARN] 2024-01-15T14:28:12Z
processor/batch: Queue capacity reached
queue_size: 5000/5000
action: dropping oldest items
dropped_count: 567
\`\`\`

**Analysis:**
- Ingestion rate exceeds export rate
- Collector backpressure detected
- Data loss occurring

### Error Timeline
| Hour | Conn Refused | TLS | Queue | Memory | Timeout |
|------|--------------|-----|-------|--------|---------|
| 12:00 | 23 | 12 | 0 | 5 | 18 |
| 13:00 | 45 | 15 | 12 | 8 | 34 |
| 14:00 | 189 | 18 | 89 | 12 | 156 |
| 15:00 | 234 | 20 | 78 | 8 | 178 |
| 16:00 | 156 | 14 | 34 | 5 | 89 |

### Resolution Steps

1. **Connection Refused:**
\`\`\`bash
# Check collector status
kubectl get pods -l app=otel-collector
# Verify network connectivity
telnet collector.internal 4317
\`\`\`

2. **Queue Overflow:**
\`\`\`yaml
# Increase queue size
exporters:
  otlp:
    sending_queue:
      queue_size: 20000  # Was 5000
\`\`\`

3. **Export Timeout:**
\`\`\`yaml
# Increase timeout
exporters:
  otlp:
    timeout: 30s  # Was 10s
\`\`\``,
  },
  {
    question: "Which agents need configuration updates?",
    answer: `## Agent Configuration Audit

### Configuration Drift Report
| Agent | Config Version | Expected | Drift Status |
|-------|----------------|----------|--------------|
| agent-prod-01 | v2.3.1 | v2.4.0 | ⚠️ Outdated |
| agent-prod-02 | v2.4.0 | v2.4.0 | ✅ Current |
| agent-prod-03 | v2.4.0 | v2.4.0 | ✅ Current |
| agent-prod-04 | v2.2.0 | v2.4.0 | 🔴 Major drift |
| agent-prod-05 | v2.4.0 | v2.4.0 | ✅ Current |

### Configuration Differences

#### agent-prod-01 (v2.3.1 → v2.4.0)
| Setting | Current | Expected | Impact |
|---------|---------|----------|--------|
| batch.timeout | 1s | 5s | Performance |
| sampling.rate | 1.0 | 0.5 | Cost reduction |
| compression | none | gzip | Bandwidth |

#### agent-prod-04 (v2.2.0 → v2.4.0)
| Setting | Current | Expected | Impact |
|---------|---------|----------|--------|
| exporters.otlp.endpoint | old-collector:4317 | collector.internal:4317 | 🔴 Critical |
| receivers.prometheus.scrape_interval | 60s | 30s | Granularity |
| processors.memory_limiter | disabled | enabled | Stability |
| service.telemetry.logs.level | debug | info | Performance |

### Missing Features
| Agent | Missing Configuration |
|-------|----------------------|
| agent-prod-01 | Resource detection, K8s attributes |
| agent-prod-04 | Memory limiter, Retry policy, TLS config |

### Recommended Updates

\`\`\`yaml
# agent-prod-04 config update
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  otlp:
    endpoint: collector.internal:4317  # Updated endpoint
    tls:
      insecure: false
      ca_file: /etc/ssl/ca.pem

processors:
  memory_limiter:  # Added
    limit_mib: 512
    spike_limit_mib: 128
    check_interval: 1s

service:
  telemetry:
    logs:
      level: info  # Changed from debug
\`\`\`

### Deployment Plan
1. Update agent-prod-04 immediately (critical)
2. Schedule agent-prod-01 update (next maintenance window)
3. Validate configurations with dry-run
4. Monitor for 24h post-deployment`,
  },
  {
    question: "How is the agent auto-discovery working?",
    answer: `## Agent Auto-Discovery Status

### Discovery Configuration
| Setting | Value |
|---------|-------|
| Discovery Mode | Kubernetes + VM |
| Scan Interval | 5 minutes |
| Auto-Register | Enabled |
| Auto-Deregister | After 30 min offline |

### Recently Discovered Agents
| Agent | Host | Discovered | Method | Status |
|-------|------|------------|--------|--------|
| agent-k8s-node-06 | node-06 | 2h ago | K8s DaemonSet | ✅ Registered |
| agent-vm-batch-03 | vm-batch-03 | 4h ago | Cloud metadata | ✅ Registered |
| agent-k8s-node-07 | node-07 | 1h ago | K8s DaemonSet | ⚠️ Pending |
| agent-vm-dev-01 | vm-dev-01 | 30m ago | Manual | ✅ Registered |

### Auto-Discovery Metrics
| Metric | Last 24h | Last 7d |
|--------|----------|---------|
| New agents discovered | 8 | 23 |
| Agents auto-deregistered | 3 | 12 |
| Failed registrations | 2 | 5 |
| Manual overrides | 1 | 4 |

### Discovery by Source
\`\`\`
Kubernetes DaemonSet:  ████████████████████  45 agents (65%)
Cloud Metadata:        ████████░░░░░░░░░░░░  18 agents (26%)
Manual Registration:   ███░░░░░░░░░░░░░░░░░   6 agents (9%)
\`\`\`

### Pending Registration: agent-k8s-node-07
\`\`\`
Status: Pending approval
Reason: New node detected, awaiting validation
Discovery Info:
  - Node: node-07
  - Labels: env=production, tier=compute
  - Resources: 8 CPU, 32Gi RAM
\`\`\`

**Action Required:**
\`\`\`bash
# Approve agent registration
telemetryflow agent approve agent-k8s-node-07

# Or auto-approve matching pattern
telemetryflow config set agent.auto-approve.pattern "agent-k8s-*"
\`\`\`

### Discovery Configuration
\`\`\`yaml
discovery:
  kubernetes:
    enabled: true
    namespace: "*"
    labels:
      app: telemetryflow-agent
  cloud:
    enabled: true
    providers:
      - aws
      - gcp
    metadata_tags:
      - environment
      - service
  registration:
    auto_approve: false
    approval_timeout: 24h
    deregister_after: 30m
\`\`\``,
  },
  {
    question: "What's the data throughput for each agent?",
    answer: `## Agent Data Throughput Analysis

### Current Throughput (Real-time)
| Agent | Metrics | Logs | Traces | Total | Bandwidth |
|-------|---------|------|--------|-------|-----------|
| agent-prod-01 | 2.5K/s | 1.2K/s | 3.8K/s | 7.5K/s | 4.2MB/s |
| agent-prod-02 | 2.1K/s | 1.5K/s | 2.9K/s | 6.5K/s | 3.8MB/s |
| agent-prod-03 | 4.8K/s | 5.6K/s | 8.2K/s | 18.6K/s | 12.4MB/s |
| agent-prod-04 | 3.2K/s | 3.8K/s | 6.1K/s | 13.1K/s | 8.6MB/s |
| agent-prod-05 | 6.5K/s | 12.3K/s | 2.1K/s | 20.9K/s | 15.8MB/s |

### Throughput Trends (24h)
\`\`\`
Events/Second
20K |                                    ████
18K |                               ████████
16K |                          █████████████
14K |                     ██████████████████
12K |                ███████████████████████
10K |           ████████████████████████████
 8K |      █████████████████████████████████
 6K | █████████████████████████████████████
 4K |███████████████████████████████████████
 2K |███████████████████████████████████████
    +---------------------------------------
    00:00     06:00     12:00     18:00  Now
\`\`\`

### Peak vs Average
| Agent | Peak/s | Average/s | Peak Time | Utilization |
|-------|--------|-----------|-----------|-------------|
| agent-prod-01 | 15.2K | 7.5K | 14:30 | 49% |
| agent-prod-02 | 12.8K | 6.5K | 14:30 | 51% |
| agent-prod-03 | 45.6K | 18.6K | 14:45 | 41% |
| agent-prod-04 | 32.1K | 13.1K | 14:45 | 41% |
| agent-prod-05 | 52.3K | 20.9K | 10:15 | 40% |

### Capacity Analysis
| Agent | Max Capacity | Current | Headroom |
|-------|--------------|---------|----------|
| agent-prod-01 | 25K/s | 7.5K/s | 70% |
| agent-prod-02 | 25K/s | 6.5K/s | 74% |
| agent-prod-03 | 50K/s | 18.6K/s | 63% |
| agent-prod-04 | 50K/s | 13.1K/s | 74% |
| agent-prod-05 | 50K/s | 20.9K/s | 58% ⚠️ |

### Throughput Optimization
\`\`\`yaml
# For high-throughput agents
exporters:
  otlp:
    sending_queue:
      num_consumers: 8  # Parallel exporters
      queue_size: 50000
    compression: zstd  # Better than gzip for high volume

processors:
  batch:
    send_batch_size: 16384
    timeout: 10s
\`\`\`

### Data Volume Summary
| Period | Total Events | Data Size | Cost Est. |
|--------|--------------|-----------|-----------|
| Last Hour | 238M | 145GB | $12.50 |
| Last Day | 5.7B | 3.5TB | $300 |
| Last Week | 39.9B | 24.5TB | $2,100 |`,
  },
  {
    question: "Are any agents experiencing certificate issues?",
    answer: `## Agent TLS Certificate Analysis

### Certificate Status
| Agent | Cert Status | Expiry | Days Left | Issuer |
|-------|-------------|--------|-----------|--------|
| agent-prod-01 | ✅ Valid | 2024-06-15 | 152 | Internal CA |
| agent-prod-02 | ✅ Valid | 2024-06-15 | 152 | Internal CA |
| agent-prod-03 | ⚠️ Expiring | 2024-02-01 | 17 | Internal CA |
| agent-prod-04 | 🔴 Invalid | - | - | Unknown |
| agent-prod-05 | ✅ Valid | 2024-08-20 | 218 | Internal CA |

### Certificate Issues

#### agent-prod-03: Certificate Expiring
\`\`\`
Subject: CN=agent-prod-03.internal
Issuer: CN=TelemetryFlow Internal CA
Not Before: 2023-02-01 00:00:00
Not After: 2024-02-01 00:00:00
Days Until Expiry: 17

Warning: Certificate will expire in 17 days
Action: Renew certificate before expiration
\`\`\`

#### agent-prod-04: Invalid Certificate
\`\`\`
Error: x509: certificate signed by unknown authority
Details:
  - Certificate issuer not in trust chain
  - CA certificate missing from agent
  - Connection falling back to insecure

Current Behavior:
  - Agent connecting without TLS verification
  - Data transmission unencrypted
  - Security risk: HIGH
\`\`\`

### Certificate Errors (Last 24h)
| Error | Count | Agents | Impact |
|-------|-------|--------|--------|
| Certificate expired | 0 | 0 | None |
| CA not trusted | 234 | 1 | Data unencrypted |
| Hostname mismatch | 12 | 1 | Connection failed |
| TLS handshake timeout | 45 | 2 | Intermittent drops |

### Resolution Steps

#### Renew Expiring Certificate
\`\`\`bash
# Generate new certificate request
openssl req -new -key agent-prod-03.key \\
  -out agent-prod-03.csr \\
  -subj "/CN=agent-prod-03.internal"

# Sign with internal CA
openssl x509 -req -in agent-prod-03.csr \\
  -CA ca.crt -CAkey ca.key \\
  -CAcreateserial -out agent-prod-03.crt \\
  -days 365
\`\`\`

#### Fix Invalid Certificate
\`\`\`bash
# Copy CA certificate to agent
scp ca.crt agent-prod-04:/etc/telemetryflow/certs/

# Update agent config
tls:
  ca_file: /etc/telemetryflow/certs/ca.crt
  cert_file: /etc/telemetryflow/certs/agent.crt
  key_file: /etc/telemetryflow/certs/agent.key
\`\`\`

### Automation Recommendation
\`\`\`yaml
# Use cert-manager for automatic renewal
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: agent-cert
spec:
  secretName: agent-tls
  duration: 8760h  # 1 year
  renewBefore: 720h  # 30 days
  issuerRef:
    name: internal-ca
    kind: ClusterIssuer
\`\`\``,
  },
  {
    question: "Show me the agent deployment history",
    answer: `## Agent Deployment History

### Recent Deployments
| Date | Version | Agents | Status | Duration | Rollback |
|------|---------|--------|--------|----------|----------|
| Jan 15 | v1.8.2 | 25 | ✅ Complete | 45m | No |
| Jan 08 | v1.8.1 | 25 | ✅ Complete | 52m | No |
| Dec 20 | v1.8.0 | 25 | ⚠️ Partial | 2h | Yes (3) |
| Dec 10 | v1.7.5 | 25 | ✅ Complete | 38m | No |
| Nov 28 | v1.7.4 | 22 | ✅ Complete | 35m | No |

### Deployment: v1.8.2 (Jan 15)
\`\`\`
Deployment Strategy: Rolling
Batch Size: 5 agents
Health Check Wait: 5 minutes

Timeline:
14:00 - Started deployment
14:00 - Batch 1: agents 1-5 upgrading
14:08 - Batch 1: health checks passed
14:10 - Batch 2: agents 6-10 upgrading
14:18 - Batch 2: health checks passed
14:20 - Batch 3: agents 11-15 upgrading
14:28 - Batch 3: health checks passed
14:30 - Batch 4: agents 16-20 upgrading
14:38 - Batch 4: health checks passed
14:40 - Batch 5: agents 21-25 upgrading
14:45 - Deployment complete
\`\`\`

### Failed Deployment: v1.8.0 (Dec 20)
\`\`\`
Issue: Memory leak in trace processor
Affected Agents: agent-prod-03, agent-prod-04, agent-prod-05
Detection: Health checks failed after 15 minutes

Symptoms:
- Memory usage: 95%+ within 10 minutes
- OOM kills detected
- Data loss reported

Resolution:
- Immediate rollback to v1.7.5
- Hotfix released as v1.8.1
\`\`\`

### Deployment Statistics
| Metric | Last 30 Days | Last 90 Days |
|--------|--------------|--------------|
| Total Deployments | 4 | 12 |
| Successful | 3 (75%) | 10 (83%) |
| With Rollbacks | 1 (25%) | 2 (17%) |
| Avg Duration | 47m | 42m |
| Agent Downtime | 0.2% | 0.3% |

### Version Adoption Timeline
\`\`\`
v1.8.2  ██████████████████████████████████████████ 25 agents (100%)
v1.8.1  (superseded)
v1.8.0  (rolled back)
v1.7.5  (archived)
\`\`\``,
  },
  {
    question: "Why is agent-prod-03 using excessive memory?",
    answer: `## Memory Analysis: agent-prod-03

### Current Memory Status
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Heap Used | 1.8GB | 512MB | 🔴 Critical |
| Heap Allocated | 2.1GB | 1GB | 🔴 Critical |
| Stack | 45MB | 100MB | ✅ Normal |
| Off-heap | 234MB | 256MB | ⚠️ Warning |
| Total RSS | 2.4GB | 2GB | 🔴 Over limit |

### Memory Growth Pattern
\`\`\`
Memory (GB)
2.5 |                                    ████████
2.0 |                          ██████████████████
1.5 |                ████████████████████████████
1.0 |      ██████████████████████████████████████
0.5 |██████████████████████████████████████████████
    +----------------------------------------------
    00:00    06:00    12:00    18:00    Now

Growth Rate: ~150MB/hour (should be stable)
\`\`\`

### Root Cause Analysis

#### Primary Cause: Unbatched Span Processing
\`\`\`
Trace processor holding 2.4M spans in memory
Expected: <100K spans
Cause: Batch processor stalled

Stall Reason:
- Exporter timeout: Connection to collector failing
- Retry queue: 1.8M items (max: 100K)
- Backpressure not propagating correctly
\`\`\`

#### Memory Allocation Breakdown
| Component | Memory | % Total | Normal |
|-----------|--------|---------|--------|
| Trace buffer | 1.4GB | 58% | 🔴 200MB |
| Metric buffer | 312MB | 13% | ⚠️ 150MB |
| Log buffer | 289MB | 12% | ✅ 250MB |
| gRPC connections | 156MB | 6% | ✅ 150MB |
| Other | 243MB | 10% | ✅ 250MB |

### Immediate Actions

1. **Restart agent to clear buffers**
\`\`\`bash
systemctl restart telemetryflow-agent
\`\`\`

2. **Add memory limiter**
\`\`\`yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 1500
    spike_limit_mib: 512
\`\`\`

3. **Fix exporter connection**
\`\`\`bash
# Check collector connectivity
telnet collector.internal 4317

# Verify TLS certificates
openssl s_client -connect collector.internal:4317
\`\`\`

### Prevention Configuration
\`\`\`yaml
exporters:
  otlp:
    sending_queue:
      queue_size: 10000  # Limit queue
    retry_on_failure:
      max_elapsed_time: 60s  # Fail faster
\`\`\``,
  },
  {
    question: "Compare agent performance across different environments",
    answer: `## Cross-Environment Agent Performance

### Environment Overview
| Environment | Agents | Avg CPU | Avg Memory | Throughput | Health |
|-------------|--------|---------|------------|------------|--------|
| Production | 15 | 4.2% | 312MB | 45K/s | 93% |
| Staging | 8 | 2.8% | 198MB | 12K/s | 100% |
| Development | 5 | 1.5% | 145MB | 3K/s | 100% |
| Edge | 12 | 6.8% | 256MB | 28K/s | 85% |

### Performance Metrics by Environment

#### Production
| Metric | Min | Avg | Max | P99 |
|--------|-----|-----|-----|-----|
| CPU % | 1.2 | 4.2 | 12.5 | 8.9 |
| Memory MB | 245 | 312 | 512 | 456 |
| Latency ms | 2 | 12 | 89 | 45 |
| Drop Rate % | 0 | 0.02 | 0.5 | 0.1 |

#### Edge (Remote Locations)
| Metric | Min | Avg | Max | P99 |
|--------|-----|-----|-----|-----|
| CPU % | 2.5 | 6.8 | 18.2 | 15.6 |
| Memory MB | 180 | 256 | 412 | 380 |
| Latency ms | 45 | 156 | 890 | 450 |
| Drop Rate % | 0.1 | 1.2 | 5.8 | 3.2 |

### Issues by Environment

#### Edge Environment Challenges
| Issue | Frequency | Impact | Solution |
|-------|-----------|--------|----------|
| High latency | Constant | Delayed data | Local buffering |
| Network drops | Frequent | Data loss | Retry + queue |
| Limited bandwidth | Always | Throttling | Compression |
| Resource constraints | Often | Crashes | Memory limits |

### Environment-Specific Configurations

\`\`\`yaml
# Production config
processors:
  batch:
    send_batch_size: 8192
    timeout: 5s

# Edge config (optimized for unreliable networks)
processors:
  batch:
    send_batch_size: 2048  # Smaller batches
    timeout: 30s  # Longer timeout

exporters:
  otlp:
    compression: zstd  # Better compression
    timeout: 60s
    retry_on_failure:
      initial_interval: 10s
      max_interval: 300s
      max_elapsed_time: 3600s  # Retry for 1 hour
    sending_queue:
      storage: file  # Persist queue to disk
      queue_size: 100000
\`\`\`

### Recommendations
1. **Edge:** Enable disk-backed queues
2. **Production:** Increase batch sizes
3. **Development:** Reduce sampling to save resources`,
  },
  {
    question: "What is the status of agent health checks?",
    answer: `## Agent Health Check Status

### Health Check Summary
| Agent | Liveness | Readiness | Startup | Overall |
|-------|----------|-----------|---------|---------|
| agent-prod-01 | ✅ Pass | ✅ Pass | ✅ Pass | Healthy |
| agent-prod-02 | ✅ Pass | ✅ Pass | ✅ Pass | Healthy |
| agent-prod-03 | ✅ Pass | ⚠️ Degraded | ✅ Pass | Degraded |
| agent-prod-04 | ✅ Pass | ❌ Fail | ✅ Pass | Unhealthy |
| agent-prod-05 | ✅ Pass | ✅ Pass | ✅ Pass | Healthy |

### Health Check Endpoints
| Endpoint | Purpose | Interval | Timeout |
|----------|---------|----------|---------|
| /healthz | Liveness | 30s | 5s |
| /readyz | Readiness | 10s | 5s |
| /startupz | Startup | 5s | 10s |

### Detailed Health Status

#### agent-prod-03: Degraded Readiness
\`\`\`json
{
  "status": "degraded",
  "checks": {
    "collector_connection": {
      "status": "pass",
      "latency_ms": 45
    },
    "exporter_queue": {
      "status": "warn",
      "queue_size": 8500,
      "max_queue": 10000,
      "message": "Queue 85% full"
    },
    "memory": {
      "status": "pass",
      "used_mb": 312,
      "limit_mb": 512
    }
  }
}
\`\`\`

#### agent-prod-04: Failed Readiness
\`\`\`json
{
  "status": "fail",
  "checks": {
    "collector_connection": {
      "status": "fail",
      "error": "connection refused",
      "last_success": "2024-01-15T12:45:00Z"
    },
    "exporter_queue": {
      "status": "fail",
      "queue_size": 10000,
      "max_queue": 10000,
      "message": "Queue full, dropping data"
    },
    "memory": {
      "status": "pass",
      "used_mb": 278,
      "limit_mb": 512
    }
  }
}
\`\`\`

### Health Check History (24h)
| Agent | Pass | Warn | Fail | Availability |
|-------|------|------|------|--------------|
| agent-prod-01 | 2880 | 0 | 0 | 100% |
| agent-prod-02 | 2875 | 5 | 0 | 99.8% |
| agent-prod-03 | 2650 | 200 | 30 | 92.0% |
| agent-prod-04 | 2400 | 150 | 330 | 83.3% |
| agent-prod-05 | 2870 | 10 | 0 | 99.7% |

### Configuration
\`\`\`yaml
# Agent health check config
health_check:
  endpoint: 0.0.0.0:13133
  path: /
  check_collector_pipeline: true

extensions:
  health_check:
    endpoint: 0.0.0.0:13133
    check_collector_pipeline: true
    include_permanent_errors: true
\`\`\``,
  },
  {
    question: "How do I troubleshoot agent connectivity issues?",
    answer: `## Agent Connectivity Troubleshooting Guide

### Connectivity Check Matrix
| Agent | Collector gRPC | Collector HTTP | DNS | Internet |
|-------|----------------|----------------|-----|----------|
| agent-prod-01 | ✅ | ✅ | ✅ | ✅ |
| agent-prod-02 | ✅ | ✅ | ✅ | ✅ |
| agent-prod-03 | ⚠️ Slow | ✅ | ✅ | ✅ |
| agent-prod-04 | ❌ Failed | ❌ Failed | ✅ | ✅ |
| agent-prod-05 | ✅ | ✅ | ⚠️ Slow | ✅ |

### Troubleshooting agent-prod-04

#### Step 1: Network Connectivity
\`\`\`bash
# Check DNS resolution
dig collector.internal
# Expected: 10.0.1.50

# Check port connectivity
nc -zv collector.internal 4317
nc -zv collector.internal 4318

# Check route
traceroute collector.internal
\`\`\`

#### Step 2: TLS Verification
\`\`\`bash
# Test TLS connection
openssl s_client -connect collector.internal:4317 \\
  -CAfile /etc/telemetryflow/certs/ca.crt

# Check certificate chain
openssl s_client -connect collector.internal:4317 \\
  -showcerts 2>/dev/null | openssl x509 -noout -dates
\`\`\`

#### Step 3: Agent Logs
\`\`\`bash
# View recent errors
journalctl -u telemetryflow-agent -p err --since "1 hour ago"

# Common error patterns:
# "connection refused" → Collector down or firewall
# "TLS handshake failed" → Certificate issue
# "context deadline exceeded" → Network timeout
# "no healthy upstream" → Load balancer issue
\`\`\`

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Firewall blocking | Connection refused | Open ports 4317, 4318 |
| TLS mismatch | Handshake failed | Update certificates |
| DNS failure | Unknown host | Check DNS config |
| MTU issues | Partial data | Reduce MTU or enable PMTUD |
| Proxy required | Timeout | Configure HTTP_PROXY |

### Agent Configuration Fixes

\`\`\`yaml
# Add retry and timeout settings
exporters:
  otlp:
    endpoint: collector.internal:4317
    timeout: 30s
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 60s
      max_elapsed_time: 300s

    # For proxied environments
    # proxy_url: http://proxy.internal:8080

    # For TLS issues
    tls:
      insecure: false
      insecure_skip_verify: false  # Set true for testing only
      ca_file: /etc/telemetryflow/certs/ca.crt
      cert_file: /etc/telemetryflow/certs/client.crt
      key_file: /etc/telemetryflow/certs/client.key
\`\`\`

### Quick Diagnostic Script
\`\`\`bash
#!/bin/bash
echo "=== Agent Connectivity Check ==="
echo "DNS: $(dig +short collector.internal)"
echo "TCP 4317: $(nc -zv collector.internal 4317 2>&1)"
echo "TCP 4318: $(nc -zv collector.internal 4318 2>&1)"
echo "Agent Status: $(systemctl is-active telemetryflow-agent)"
echo "Recent Errors: $(journalctl -u telemetryflow-agent -p err -n 5 --no-pager)"
\`\`\``,
  },
  {
    question: "What agents are handling the most traffic?",
    answer: `## Top Traffic Agents Analysis

### Traffic Leaders (Real-time)
| Rank | Agent | Host | Events/s | Data Rate | % Total |
|------|-------|------|----------|-----------|---------|
| 1 | agent-prod-05 | srv-db-01 | 20.9K | 15.8MB/s | 24.5% |
| 2 | agent-prod-03 | srv-api-01 | 18.6K | 12.4MB/s | 21.8% |
| 3 | agent-prod-04 | srv-api-02 | 13.1K | 8.6MB/s | 15.4% |
| 4 | agent-prod-01 | srv-web-01 | 7.5K | 4.2MB/s | 8.8% |
| 5 | agent-prod-02 | srv-web-02 | 6.5K | 3.8MB/s | 7.6% |

### Traffic by Type (Top 5 Agents)
| Agent | Metrics/s | Logs/s | Traces/s | Dominant |
|-------|-----------|--------|----------|----------|
| agent-prod-05 | 6.5K | 12.3K | 2.1K | Logs (59%) |
| agent-prod-03 | 4.8K | 5.6K | 8.2K | Traces (44%) |
| agent-prod-04 | 3.2K | 3.8K | 6.1K | Traces (47%) |
| agent-prod-01 | 2.5K | 1.2K | 3.8K | Traces (51%) |
| agent-prod-02 | 2.1K | 1.5K | 2.9K | Traces (45%) |

### Traffic Distribution
\`\`\`
agent-prod-05  ████████████████████████░░  24.5%
agent-prod-03  ██████████████████████░░░░  21.8%
agent-prod-04  ███████████████░░░░░░░░░░░  15.4%
agent-prod-01  █████████░░░░░░░░░░░░░░░░░   8.8%
agent-prod-02  ████████░░░░░░░░░░░░░░░░░░   7.6%
Others         ██████████████████████░░░░  21.9%
\`\`\`

### Peak Traffic Analysis
| Agent | Peak/s | Peak Time | Sustained Peak |
|-------|--------|-----------|----------------|
| agent-prod-05 | 52.3K | 10:15 | 15 minutes |
| agent-prod-03 | 45.6K | 14:45 | 25 minutes |
| agent-prod-04 | 32.1K | 14:45 | 20 minutes |
| agent-prod-01 | 15.2K | 14:30 | 10 minutes |
| agent-prod-02 | 12.8K | 14:30 | 12 minutes |

### High Traffic Source Analysis

#### agent-prod-05: Database Server
\`\`\`
Top Log Sources:
1. /var/log/postgresql/queries.log - 8.5K/s
2. /var/log/postgresql/slow.log - 2.1K/s
3. /var/log/app/audit.log - 1.7K/s

Recommendation: Filter routine queries
Potential Reduction: 60% log volume
\`\`\`

#### agent-prod-03: API Server
\`\`\`
Top Trace Sources:
1. HTTP endpoints - 5.2K spans/s
2. Database calls - 2.1K spans/s
3. Cache operations - 0.9K spans/s

Recommendation: Sample high-frequency endpoints
Potential Reduction: 40% trace volume
\`\`\`

### Load Balancing Recommendations
| Current | Issue | Recommendation |
|---------|-------|----------------|
| 1 high-traffic agent | Single point of failure | Add redundant agent |
| Uneven distribution | Inefficient resource use | Implement sharding |
| Peak overload | Data drops during spikes | Pre-scaling triggers |`,
  },
  {
    question: "Show me the agent log collection configuration",
    answer: `## Agent Log Collection Configuration

### Collection Overview
| Agent | Sources | Parsers | Volume | Status |
|-------|---------|---------|--------|--------|
| agent-prod-01 | 5 | 3 | 1.2K/s | ✅ Active |
| agent-prod-02 | 5 | 3 | 1.5K/s | ✅ Active |
| agent-prod-03 | 8 | 5 | 5.6K/s | ✅ Active |
| agent-prod-04 | 7 | 4 | 3.8K/s | ✅ Active |
| agent-prod-05 | 6 | 4 | 12.3K/s | ⚠️ High volume |

### Log Sources Configuration

#### Standard Application Logs
\`\`\`yaml
receivers:
  filelog/app:
    include:
      - /var/log/app/*.log
      - /var/log/app/**/*.log
    exclude:
      - /var/log/app/debug.log
      - /var/log/app/*.tmp
    start_at: end
    include_file_path: true
    include_file_name: true
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.timestamp
          layout: '%Y-%m-%dT%H:%M:%S.%fZ'
      - type: severity_parser
        parse_from: attributes.level
\`\`\`

#### System Logs (journald)
\`\`\`yaml
receivers:
  journald:
    directory: /var/log/journal
    units:
      - sshd
      - docker
      - kubelet
    priority: info
    operators:
      - type: add
        field: attributes.source
        value: journald
\`\`\`

#### Nginx Access Logs
\`\`\`yaml
receivers:
  filelog/nginx:
    include:
      - /var/log/nginx/access.log
    operators:
      - type: regex_parser
        regex: '^(?P<remote_addr>[^ ]*) - (?P<remote_user>[^ ]*) \\[(?P<time_local>[^\\]]*)\\] "(?P<request>[^"]*)" (?P<status>[^ ]*) (?P<body_bytes_sent>[^ ]*)'
        timestamp:
          parse_from: attributes.time_local
          layout: '%d/%b/%Y:%H:%M:%S %z'
\`\`\`

### Parser Configuration
| Parser | Format | Success Rate | Errors/h |
|--------|--------|--------------|----------|
| json_parser | JSON | 99.8% | 45 |
| regex_parser | Combined | 98.5% | 234 |
| syslog_parser | RFC5424 | 99.9% | 12 |
| csv_parser | CSV | 97.2% | 567 |

### Log Processing Pipeline
\`\`\`yaml
processors:
  # Add resource attributes
  resource:
    attributes:
      - key: service.name
        value: "\${env:-SERVICE_NAME}"
        action: insert
      - key: host.name
        value: "\${env:-HOSTNAME}"
        action: insert

  # Filter unwanted logs
  filter/drop:
    logs:
      exclude:
        match_type: regexp
        bodies:
          - '.*health.*check.*'
          - '.*readiness.*probe.*'
        severity_texts:
          - DEBUG
          - TRACE

  # Batch for efficiency
  batch:
    send_batch_size: 8192
    timeout: 5s
\`\`\`

### Multiline Log Handling
\`\`\`yaml
operators:
  - type: recombine
    is_first_entry: body matches '^\\d{4}-\\d{2}-\\d{2}'
    combine_field: body
    max_log_size: 102400
    source_identifier: attributes["log.file.path"]
\`\`\``,
  },
  {
    question: "How do I scale agents for increased load?",
    answer: `## Agent Scaling Guide

### Current Capacity
| Agent | Max Throughput | Current | Utilization |
|-------|----------------|---------|-------------|
| agent-prod-01 | 25K/s | 7.5K/s | 30% |
| agent-prod-02 | 25K/s | 6.5K/s | 26% |
| agent-prod-03 | 50K/s | 18.6K/s | 37% |
| agent-prod-04 | 50K/s | 13.1K/s | 26% |
| agent-prod-05 | 50K/s | 20.9K/s | 42% |

### Scaling Strategies

#### 1. Vertical Scaling (Single Agent)
\`\`\`yaml
# Increase agent resources
resources:
  limits:
    cpu: "4"       # Was 2
    memory: "2Gi"  # Was 1Gi
  requests:
    cpu: "1"
    memory: "512Mi"

# Optimize processing
processors:
  batch:
    send_batch_size: 16384  # Larger batches
    timeout: 10s

exporters:
  otlp:
    sending_queue:
      num_consumers: 8  # More export workers
      queue_size: 50000
\`\`\`

**Expected Impact:** +100% throughput per agent

#### 2. Horizontal Scaling (Multiple Agents)
\`\`\`yaml
# Kubernetes DaemonSet scaling
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: telemetryflow-agent
spec:
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
  template:
    spec:
      containers:
        - name: agent
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2"
              memory: "1Gi"
\`\`\`

#### 3. Sharding Strategy
\`\`\`yaml
# Shard by data type
# Agent A: Traces
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/traces]

# Agent B: Metrics
service:
  pipelines:
    metrics:
      receivers: [prometheus]
      processors: [batch]
      exporters: [otlp/metrics]
\`\`\`

### Scaling Decision Matrix
| Load Increase | Recommended Action | Complexity |
|---------------|-------------------|------------|
| +25% | Optimize batching | Low |
| +50% | Vertical scale | Medium |
| +100% | Add agents | Medium |
| +200% | Shard + horizontal | High |

### Auto-Scaling Configuration
\`\`\`yaml
# HPA for agent deployment
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: telemetryflow-agent-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: otelcol_exporter_queue_size
        target:
          type: AverageValue
          averageValue: 5000
\`\`\`

### Capacity Planning
| Expected Load | Agents Needed | Resources |
|---------------|---------------|-----------|
| 50K events/s | 2 | 4 CPU, 2GB |
| 100K events/s | 4 | 8 CPU, 4GB |
| 250K events/s | 8 | 16 CPU, 8GB |
| 500K events/s | 15 | 30 CPU, 15GB |`,
  },
  {
    question: "What's the agent retry and backoff behavior?",
    answer: `## Agent Retry & Backoff Analysis

### Current Retry Configuration
| Agent | Initial Interval | Max Interval | Max Time | Enabled |
|-------|------------------|--------------|----------|---------|
| agent-prod-01 | 5s | 30s | 300s | ✅ Yes |
| agent-prod-02 | 5s | 30s | 300s | ✅ Yes |
| agent-prod-03 | 5s | 30s | 300s | ✅ Yes |
| agent-prod-04 | 1s | 10s | 60s | ⚠️ Too aggressive |
| agent-prod-05 | 10s | 60s | 600s | ✅ Yes |

### Retry Statistics (Last Hour)
| Agent | Attempts | Successes | Final Failures | Avg Retries |
|-------|----------|-----------|----------------|-------------|
| agent-prod-01 | 234 | 230 | 4 | 1.8 |
| agent-prod-02 | 189 | 185 | 4 | 1.6 |
| agent-prod-03 | 567 | 545 | 22 | 2.4 |
| agent-prod-04 | 1,234 | 890 | 344 | 4.2 ⚠️ |
| agent-prod-05 | 312 | 308 | 4 | 1.5 |

### Backoff Visualization
\`\`\`
Standard Exponential Backoff (agent-prod-01):

Attempt 1: |█| 5s
Attempt 2: |██| 10s
Attempt 3: |████| 20s
Attempt 4: |██████| 30s (max)
Attempt 5: |██████| 30s
...
Max elapsed: 300s → Drop data

Aggressive Backoff (agent-prod-04):

Attempt 1: |█| 1s
Attempt 2: |██| 2s
Attempt 3: |████| 4s
Attempt 4: |████████| 8s
Attempt 5: |██████████| 10s (max)
...
Max elapsed: 60s → Drop data quickly
\`\`\`

### Problem: agent-prod-04 Excessive Retries
\`\`\`
Issue: 344 final failures in 1 hour
Impact: 34,400 events dropped
Cause: Aggressive retry + short max elapsed time

Current Config:
  initial_interval: 1s   # Too short
  max_interval: 10s      # Too short
  max_elapsed_time: 60s  # Gives up too fast
\`\`\`

### Recommended Configuration
\`\`\`yaml
exporters:
  otlp:
    retry_on_failure:
      enabled: true
      initial_interval: 5s      # Start reasonable
      randomization_factor: 0.5 # Add jitter
      multiplier: 2             # Double each time
      max_interval: 60s         # Cap at 1 minute
      max_elapsed_time: 300s    # Retry for 5 minutes
\`\`\`

### Retry Decision Flow
\`\`\`
Export Attempt
    │
    ▼
Success? ──Yes──► Done
    │
    No
    │
    ▼
Retryable Error? ──No──► Drop + Log
    │
    Yes
    │
    ▼
Max Elapsed? ──Yes──► Drop + Alert
    │
    No
    │
    ▼
Calculate Backoff
    │
    ▼
Wait (interval * multiplier + jitter)
    │
    ▼
Retry Export
\`\`\`

### Queue Behavior During Retries
| Setting | Value | Purpose |
|---------|-------|---------|
| queue_size | 10000 | Buffer during retries |
| num_consumers | 4 | Parallel retry attempts |
| storage | file | Persist across restarts |

\`\`\`yaml
sending_queue:
  enabled: true
  num_consumers: 4
  queue_size: 10000
  storage: file:///var/lib/otelcol/queue
\`\`\``,
  },
  {
    question: "How do I monitor agent pipeline health?",
    answer: `## Agent Pipeline Health Monitoring

### Pipeline Overview
| Agent | Pipelines | Healthy | Degraded | Failed |
|-------|-----------|---------|----------|--------|
| agent-prod-01 | 3 | 3 | 0 | 0 |
| agent-prod-02 | 3 | 3 | 0 | 0 |
| agent-prod-03 | 3 | 2 | 1 | 0 |
| agent-prod-04 | 3 | 1 | 1 | 1 |
| agent-prod-05 | 3 | 3 | 0 | 0 |

### Pipeline Metrics Dashboard

#### Key Metrics to Monitor
| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| otelcol_receiver_accepted_spans | Spans received | N/A (info) |
| otelcol_receiver_refused_spans | Spans rejected | > 0 |
| otelcol_processor_batch_timeout_trigger_send | Batch timeouts | > 10/min |
| otelcol_exporter_sent_spans | Spans exported | Should match accepted |
| otelcol_exporter_queue_size | Queue depth | > 80% capacity |
| otelcol_exporter_send_failed_spans | Export failures | > 0 |

### Pipeline Health Checks

#### Traces Pipeline
\`\`\`yaml
# Check span flow
Received: 5,234/s
Processed: 5,234/s (100%)
Exported: 5,230/s (99.9%)
Dropped: 4/s (0.1%)

Status: ✅ Healthy
\`\`\`

#### Metrics Pipeline
\`\`\`yaml
# Check metric flow
Received: 2,450/s
Processed: 2,445/s (99.8%)
Exported: 2,445/s (100%)
Dropped: 5/s (0.2%)

Status: ✅ Healthy
\`\`\`

#### Logs Pipeline (agent-prod-03)
\`\`\`yaml
# Check log flow
Received: 5,600/s
Processed: 5,200/s (92.8%)
Exported: 4,800/s (92.3%)
Dropped: 400/s (7.7%)

Status: ⚠️ Degraded
Issue: Parser errors causing drops
\`\`\`

### Monitoring Configuration
\`\`\`yaml
service:
  telemetry:
    metrics:
      level: detailed  # Enable all metrics
      address: 0.0.0.0:8888
    logs:
      level: info
      development: false
      encoding: json

# Prometheus scrape config
scrape_configs:
  - job_name: 'otel-agent'
    static_configs:
      - targets: ['localhost:8888']
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'otelcol_.*'
        action: keep
\`\`\`

### Alert Rules
\`\`\`yaml
groups:
  - name: otel-agent-alerts
    rules:
      - alert: AgentExporterFailing
        expr: rate(otelcol_exporter_send_failed_spans[5m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Agent {{ $labels.instance }} exporter failing"

      - alert: AgentQueueBacklog
        expr: otelcol_exporter_queue_size / otelcol_exporter_queue_capacity > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent {{ $labels.instance }} queue 80% full"

      - alert: AgentDataDropping
        expr: rate(otelcol_processor_dropped_spans[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Agent {{ $labels.instance }} dropping data"
\`\`\`

### Grafana Dashboard Panels
1. **Throughput:** receiver/exporter accepted vs sent
2. **Queue Health:** queue size vs capacity
3. **Drop Rate:** dropped spans/metrics/logs
4. **Latency:** export duration histogram
5. **Error Rate:** failed exports and retries`,
  },
  {
    question: "What are the agent sampling configurations?",
    answer: `## Agent Sampling Configuration Analysis

### Current Sampling Settings
| Agent | Trace Sampling | Log Sampling | Metric Sampling |
|-------|----------------|--------------|-----------------|
| agent-prod-01 | 100% | None | None |
| agent-prod-02 | 100% | None | None |
| agent-prod-03 | 50% (tail) | Debug: 10% | None |
| agent-prod-04 | 25% (head) | None | None |
| agent-prod-05 | 100% | Debug: 1% | Down-sample 60s |

### Sampling Impact
| Config | Events Before | Events After | Reduction | Cost Savings |
|--------|---------------|--------------|-----------|--------------|
| agent-prod-01 | 7,500/s | 7,500/s | 0% | $0 |
| agent-prod-03 | 37,200/s | 18,600/s | 50% | $1,200/mo |
| agent-prod-04 | 52,400/s | 13,100/s | 75% | $2,400/mo |
| agent-prod-05 | 42,000/s | 20,900/s | 50% | $1,300/mo |

### Sampling Strategies

#### Head-Based Sampling (agent-prod-04)
\`\`\`yaml
processors:
  probabilistic_sampler:
    hash_seed: 22
    sampling_percentage: 25

# Pros:
# - Simple implementation
# - Low overhead
# - Consistent sampling

# Cons:
# - May miss errors (sampled out)
# - No intelligent selection
\`\`\`

#### Tail-Based Sampling (agent-prod-03)
\`\`\`yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      # Always keep errors
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]

      # Always keep slow traces
      - name: latency
        type: latency
        latency:
          threshold_ms: 500

      # Sample normal traces at 25%
      - name: probabilistic
        type: probabilistic
        probabilistic:
          sampling_percentage: 25

# Pros:
# - Keeps all errors
# - Keeps slow requests
# - Intelligent selection

# Cons:
# - Higher memory usage
# - Requires trace completion
\`\`\`

#### Log Sampling
\`\`\`yaml
processors:
  filter/logs:
    logs:
      # Drop debug logs except 10%
      log_record:
        - 'severity_text == "DEBUG" and
           Random() > 0.1'

      # Drop health checks entirely
      exclude:
        match_type: regexp
        bodies:
          - '.*healthcheck.*'
          - '.*readiness.*'
\`\`\`

### Sampling Recommendations by Use Case

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Production critical | Tail 100% errors, 50% normal | Capture all errors |
| High-volume APIs | Head 10-25% | Cost control |
| Development | 100% | Full visibility |
| Batch jobs | 100% errors, 1% success | Focus on failures |

### Metrics Down-Sampling
\`\`\`yaml
processors:
  metricstransform:
    transforms:
      # Aggregate to 60s intervals
      - include: http_requests_total
        action: update
        operations:
          - action: aggregate_labels
            aggregation_type: sum
            label_set: [method, status]

  # Or use OTLP exporter interval
  exporters:
    otlp:
      sending_queue:
        timeout: 60s  # Batch 60s of data
\`\`\`

### Cost vs Visibility Trade-off
\`\`\`
Sampling Rate
100% |████████████████████████████████████| Full visibility, high cost
 75% |███████████████████████████░░░░░░░░░| Good visibility, moderate cost
 50% |██████████████████░░░░░░░░░░░░░░░░░░| Balanced
 25% |█████████░░░░░░░░░░░░░░░░░░░░░░░░░░░| Cost-effective, some blind spots
 10% |████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░| Minimal cost, limited visibility
     +------------------------------------
     Cost: $5K  $3.75K  $2.5K  $1.25K  $500  /month
\`\`\``,
  },
  {
    question: "Show me the agent resource limits and requests",
    answer: `## Agent Resource Configuration

### Current Resource Settings
| Agent | CPU Req | CPU Limit | Mem Req | Mem Limit | Status |
|-------|---------|-----------|---------|-----------|--------|
| agent-prod-01 | 200m | 1000m | 256Mi | 512Mi | ✅ Adequate |
| agent-prod-02 | 200m | 1000m | 256Mi | 512Mi | ✅ Adequate |
| agent-prod-03 | 500m | 2000m | 512Mi | 1Gi | ⚠️ Near limit |
| agent-prod-04 | 500m | 2000m | 512Mi | 1Gi | ✅ Adequate |
| agent-prod-05 | 1000m | 4000m | 1Gi | 2Gi | ⚠️ Near limit |

### Resource Usage vs Limits
| Agent | CPU Used | CPU % | Mem Used | Mem % |
|-------|----------|-------|----------|-------|
| agent-prod-01 | 230m | 23% | 156Mi | 30% |
| agent-prod-02 | 180m | 18% | 142Mi | 28% |
| agent-prod-03 | 1680m | 84% | 820Mi | 82% |
| agent-prod-04 | 720m | 36% | 456Mi | 46% |
| agent-prod-05 | 3480m | 87% | 1.7Gi | 85% |

### Resource Pressure Analysis

#### agent-prod-03: High Utilization
\`\`\`
CPU: 1680m / 2000m (84%)
Memory: 820Mi / 1Gi (82%)

Trend (24h):
- CPU: ↗ +15% growth
- Memory: ↗ +12% growth

Prediction:
- Will hit CPU limit in ~6 hours
- Will hit memory limit in ~8 hours

Recommendation: Increase limits
\`\`\`

#### agent-prod-05: Near Limits
\`\`\`
CPU: 3480m / 4000m (87%)
Memory: 1.7Gi / 2Gi (85%)

Issues:
- CPU throttling detected (45 events/hour)
- Memory pressure causing GC pauses

Recommendation: Scale vertically or add sharding
\`\`\`

### Recommended Resource Configuration

#### Standard Agent (Low-Medium Volume)
\`\`\`yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "1000m"
    memory: "512Mi"

# Suitable for: <10K events/s
\`\`\`

#### High-Volume Agent
\`\`\`yaml
resources:
  requests:
    cpu: "1000m"
    memory: "1Gi"
  limits:
    cpu: "4000m"
    memory: "4Gi"

# Suitable for: 10K-50K events/s
\`\`\`

#### Ultra High-Volume Agent
\`\`\`yaml
resources:
  requests:
    cpu: "2000m"
    memory: "2Gi"
  limits:
    cpu: "8000m"
    memory: "8Gi"

# Suitable for: >50K events/s
\`\`\`

### Resource Sizing Guide
| Throughput | CPU Request | CPU Limit | Mem Request | Mem Limit |
|------------|-------------|-----------|-------------|-----------|
| <5K/s | 100m | 500m | 128Mi | 256Mi |
| 5K-10K/s | 200m | 1000m | 256Mi | 512Mi |
| 10K-25K/s | 500m | 2000m | 512Mi | 1Gi |
| 25K-50K/s | 1000m | 4000m | 1Gi | 2Gi |
| >50K/s | 2000m | 8000m | 2Gi | 4Gi |

### Quality of Service Classes
| QoS Class | When Applied | Agent Use Case |
|-----------|--------------|----------------|
| Guaranteed | requests = limits | Critical telemetry |
| Burstable | requests < limits | Standard agents |
| BestEffort | No limits | Development only |

\`\`\`yaml
# Guaranteed QoS (production critical)
resources:
  requests:
    cpu: "1000m"
    memory: "1Gi"
  limits:
    cpu: "1000m"
    memory: "1Gi"
\`\`\``,
  },
  {
    question: "How do I debug agent data transformation issues?",
    answer: `## Agent Data Transformation Debugging

### Transformation Pipeline Status
| Agent | Transformations | Success Rate | Errors/min |
|-------|-----------------|--------------|------------|
| agent-prod-01 | 5 | 99.9% | 2 |
| agent-prod-02 | 5 | 99.8% | 5 |
| agent-prod-03 | 8 | 97.2% | 156 ⚠️ |
| agent-prod-04 | 7 | 99.5% | 12 |
| agent-prod-05 | 6 | 98.1% | 89 ⚠️ |

### Common Transformation Issues

#### 1. JSON Parse Errors (agent-prod-03)
\`\`\`
Error: failed to parse JSON body
Input: {"timestamp": "2024-01-15", "level": "info", msg: "test"}
                                                    ^^^ missing quotes

Count: 89 errors/minute
Source: /var/log/app/legacy.log
\`\`\`

**Fix:**
\`\`\`yaml
operators:
  - type: json_parser
    parse_from: body
    on_error: send  # Don't drop on error
  - type: add
    if: 'attributes.parse_error != nil'
    field: attributes.parse_failed
    value: true
\`\`\`

#### 2. Regex Mismatch (agent-prod-05)
\`\`\`
Error: regex pattern did not match
Pattern: ^(?P<time>\\d{4}-\\d{2}-\\d{2})\\s
Input: "15/01/2024 12:34:56 INFO Starting..."
                  ^^^ Different date format

Count: 45 errors/minute
\`\`\`

**Fix:**
\`\`\`yaml
operators:
  - type: regex_parser
    regex: '^(?P<time>\\d{2}/\\d{2}/\\d{4})\\s(?P<timestamp>\\d{2}:\\d{2}:\\d{2})\\s(?P<level>\\w+)\\s(?P<message>.*)'
    on_error: send
\`\`\`

### Debug Mode Configuration
\`\`\`yaml
service:
  telemetry:
    logs:
      level: debug  # Enable debug logging
      development: true
      encoding: console  # Human-readable

# Debug specific processors
processors:
  transform/debug:
    log_statements:
      - context: log
        statements:
          - |
            set(attributes["debug.original_body"], body)
          - |
            set(attributes["debug.processed"], "true")
\`\`\`

### Transformation Testing

#### Local Test Command
\`\`\`bash
# Test transformation locally
echo '{"msg": "test"}' | otelcol-contrib \\
  --config test-config.yaml \\
  --feature-gates="+component.UseDebugOutput" 2>&1 | grep -A5 "Transformed"
\`\`\`

#### Test Configuration
\`\`\`yaml
receivers:
  filelog:
    include: [./test-input.log]
    start_at: beginning

processors:
  transform:
    log_statements:
      - context: log
        statements:
          - set(attributes["test"], "value")

exporters:
  debug:
    verbosity: detailed
    sampling_initial: 5
    sampling_thereafter: 100

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [transform]
      exporters: [debug]
\`\`\`

### Debugging Checklist
| Step | Check | Command |
|------|-------|---------|
| 1 | Input format | \`tail -f /var/log/app/app.log\` |
| 2 | Parser config | Review regex/JSON config |
| 3 | Error logs | \`journalctl -u otelcol -f\` |
| 4 | Metrics | Check \`otelcol_processor_*\` |
| 5 | Output | Enable debug exporter |

### Transformation Monitoring
\`\`\`yaml
# Prometheus alerts for transformation issues
- alert: TransformationErrors
  expr: rate(otelcol_processor_transform_errors_total[5m]) > 10
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High transformation error rate on {{ $labels.instance }}"
\`\`\``,
  },
];

export const AGENTS_CONVERSATION_TITLES = [
  "Offline Agents Analysis",
  "Agent Resource Usage",
  "Telemetry Collection Status",
  "Agent Version Check",
  "Configuration Optimization",
  "Heartbeat Patterns",
  "Agent Error Analysis",
  "Configuration Updates",
  "Auto-Discovery Status",
  "Data Throughput",
  "Certificate Issues",
  "Deployment History",
  "Memory Analysis",
  "Environment Comparison",
  "Health Check Status",
  "Connectivity Issues",
  "Traffic Analysis",
  "Log Collection Config",
  "Agent Scaling",
  "Retry Behavior",
  "Pipeline Health",
  "Sampling Configuration",
  "Resource Limits",
  "Transformation Debug",
];
