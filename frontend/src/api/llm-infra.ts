/**
 * Infrastructure Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for CPU, Memory, Storage, and Network monitoring
 */

export interface MockQA {
  question: string;
  answer: string;
}

// ==================== CPU ====================

export const INFRA_CPU_MOCK_DATA: MockQA[] = [
  {
    question: "What's the current CPU utilization across all hosts?",
    answer: `## CPU Utilization Overview

### Host CPU Summary (Last 15 Minutes)
| Host | Cores | User% | System% | IOWait% | Total% | Status |
|------|-------|-------|---------|---------|--------|--------|
| prod-web-01 | 8 | 45.2% | 12.3% | 2.1% | 59.6% | ✅ Normal |
| prod-web-02 | 8 | 72.8% | 18.5% | 5.3% | 96.6% | 🔴 Critical |
| prod-api-01 | 16 | 34.5% | 8.7% | 1.2% | 44.4% | ✅ Normal |
| prod-api-02 | 16 | 38.1% | 9.2% | 1.8% | 49.1% | ✅ Normal |
| prod-db-01 | 32 | 28.4% | 15.6% | 8.9% | 52.9% | ⚠️ High IOWait |
| prod-db-02 | 32 | 22.1% | 11.3% | 3.2% | 36.6% | ✅ Normal |
| prod-cache-01 | 4 | 15.3% | 5.4% | 0.3% | 21.0% | ✅ Normal |
| prod-worker-01 | 8 | 85.4% | 8.9% | 1.1% | 95.4% | 🔴 Critical |

### Fleet Summary
- **Total Hosts:** 8
- **Average CPU:** 56.9%
- **Critical (>90%):** 2 hosts
- **High IOWait (>5%):** 1 host

### Alerts
- ⚠️ \`prod-web-02\` CPU at 96.6% for 12 minutes
- ⚠️ \`prod-worker-01\` CPU at 95.4% for 8 minutes
- ℹ️ \`prod-db-01\` IOWait at 8.9% — possible disk bottleneck`,
  },
  {
    question: "Show me CPU usage trends for the last 24 hours",
    answer: `## CPU Usage Trends (24 Hours)

### Fleet Average CPU Utilization
\`\`\`
Time     | CPU%
00:00    | ████████░░░░░░░░░░░░ 38%
04:00    | ██████░░░░░░░░░░░░░░ 28%
08:00    | ████████████░░░░░░░░ 58%
10:00    | ██████████████░░░░░░ 72%
12:00    | ████████████████░░░░ 82%  ← Peak
14:00    | ███████████████░░░░░ 76%
16:00    | ██████████████░░░░░░ 68%
18:00    | ████████████░░░░░░░░ 62%
20:00    | ██████████░░░░░░░░░░ 52%
22:00    | ████████░░░░░░░░░░░░ 42%
\`\`\`

### Peak Hours Analysis
| Period | Avg CPU | Peak CPU | Top Consumer |
|--------|---------|----------|--------------|
| 00:00-06:00 | 32% | 45% | Batch jobs |
| 06:00-12:00 | 68% | 82% | API traffic |
| 12:00-18:00 | 72% | 86% | API + reports |
| 18:00-00:00 | 48% | 62% | Evening traffic |

### Anomalies Detected
| Time | Host | CPU Spike | Duration | Cause |
|------|------|-----------|----------|-------|
| 10:23 | prod-web-02 | 98% | 8m | Traffic burst |
| 14:15 | prod-worker-01 | 95% | 15m | Report generation |
| 16:42 | prod-api-01 | 88% | 5m | Cache rebuild |

### Recommendation
Consider scaling web tier during 10:00-14:00 window. Current capacity is near limits during peak business hours.`,
  },
  {
    question: "Which processes are consuming the most CPU?",
    answer: `## Top CPU Consumers by Process

### prod-web-02 (Current CPU: 96.6%)
| PID | Process | User | CPU% | Memory | Runtime |
|-----|---------|------|------|--------|---------|
| 12345 | node (api-server) | app | 42.3% | 1.2 GB | 3d 14h |
| 12367 | node (worker-pool) | app | 28.5% | 890 MB | 3d 14h |
| 12401 | nginx | www | 12.8% | 256 MB | 15d 2h |
| 12456 | filebeat | root | 8.1% | 345 MB | 15d 2h |
| 12489 | telegraf | root | 3.2% | 128 MB | 15d 2h |

### prod-worker-01 (Current CPU: 95.4%)
| PID | Process | User | CPU% | Memory | Runtime |
|-----|---------|------|------|--------|---------|
| 23456 | python (report-gen) | app | 65.2% | 2.8 GB | 18m |
| 23478 | node (event-proc) | app | 18.3% | 678 MB | 5d 8h |
| 23501 | redis-server | redis | 6.4% | 512 MB | 30d |
| 23523 | telegraf | root | 3.1% | 128 MB | 30d |

### Analysis
- **prod-web-02:** Node.js API server is handling excessive concurrent connections. Consider horizontal scaling.
- **prod-worker-01:** Report generation process (\`python report-gen\`) is CPU-bound. This is a scheduled job that should complete in ~25 minutes.

### Load Average
| Host | 1min | 5min | 15min | Cores |
|------|------|------|-------|-------|
| prod-web-02 | 12.4 | 10.8 | 8.2 | 8 |
| prod-worker-01 | 8.9 | 7.6 | 5.4 | 8 |`,
  },
  {
    question: "Set up a CPU usage alert threshold",
    answer: `## CPU Alert Configuration

### Recommended Alert Rules
| Alert | Condition | Duration | Severity |
|-------|-----------|----------|----------|
| CPU Warning | CPU > 75% | 5 min | Warning |
| CPU Critical | CPU > 90% | 3 min | Critical |
| CPU IOWait High | IOWait > 10% | 5 min | Warning |
| Load Average High | Load > 2x cores | 10 min | Warning |
| CPU Steal High | Steal > 5% | 5 min | Warning |

### API Configuration
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/alerts/rules \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "High CPU Utilization",
    "metric": "system_cpu_usage_percent",
    "condition": "gt",
    "threshold": 90,
    "duration": "3m",
    "severity": "critical",
    "labels": { "team": "infra", "component": "cpu" },
    "annotations": {
      "summary": "CPU usage above 90% on {{ $labels.host }}",
      "runbook": "https://wiki.internal/runbooks/high-cpu"
    },
    "notificationChannels": ["slack-infra", "pagerduty-oncall"]
  }'
\`\`\`

### Current Active CPU Alerts
| Rule | Hosts Triggered | Last Fired |
|------|----------------|------------|
| CPU > 90% (Critical) | 2 | 5m ago |
| CPU > 75% (Warning) | 3 | 12m ago |
| IOWait > 10% | 0 | 2h ago |`,
  },
  {
    question: "Analyze CPU steal time on our VMs",
    answer: `## CPU Steal Time Analysis

### What is CPU Steal?
CPU steal time indicates the percentage of time a virtual CPU waits for a physical CPU while the hypervisor services another VM. High steal = noisy neighbor or over-provisioned host.

### Current Steal Time by Host
| Host | Provider | Instance | Steal% | Trend |
|------|----------|----------|--------|-------|
| prod-web-01 | AWS | c5.2xlarge | 0.2% | → Stable |
| prod-web-02 | AWS | c5.2xlarge | 0.3% | → Stable |
| prod-api-01 | AWS | c6i.4xlarge | 0.1% | → Stable |
| prod-api-02 | AWS | c6i.4xlarge | 0.1% | → Stable |
| prod-db-01 | AWS | r6i.8xlarge | 0.0% | → Stable |
| prod-db-02 | AWS | r6i.8xlarge | 0.0% | → Stable |
| staging-all-01 | GCP | e2-standard-4 | 3.8% | ↗ Rising |
| dev-shared-01 | GCP | e2-medium | 8.2% | ↗ Rising |

### Recommendations
| Host | Action | Priority |
|------|--------|----------|
| dev-shared-01 | Upgrade from e2-medium to n2-standard-2 | Medium |
| staging-all-01 | Monitor — borderline, may need upgrade | Low |
| Production hosts | No action needed — steal < 1% | — |

### Note
GCP e2 instances use shared-core CPU and are expected to have higher steal. Production workloads should use dedicated-core instances (c2, n2) for consistent performance.`,
  },
];

export const INFRA_CPU_CONVERSATION_TITLES: string[] = [
  "Fleet CPU utilization overview",
  "CPU spike investigation on web tier",
  "Process-level CPU analysis",
  "CPU alert threshold configuration",
  "VM steal time analysis",
  "CPU throttling detection on containers",
  "Multi-core utilization imbalance",
  "CPU steal time analysis (VM hosts)",
  "Process-level CPU breakdown",
  "CPU frequency scaling impact",
];

// ==================== MEMORY ====================

export const INFRA_MEMORY_MOCK_DATA: MockQA[] = [
  {
    question: "What's the memory usage across all hosts?",
    answer: `## Memory Usage Overview

### Host Memory Summary
| Host | Total | Used | Available | Buffers/Cache | Usage% | Status |
|------|-------|------|-----------|---------------|--------|--------|
| prod-web-01 | 32 GB | 24.5 GB | 7.5 GB | 8.2 GB | 76.6% | ✅ Normal |
| prod-web-02 | 32 GB | 28.8 GB | 3.2 GB | 6.1 GB | 90.0% | ⚠️ Warning |
| prod-api-01 | 64 GB | 38.2 GB | 25.8 GB | 14.5 GB | 59.7% | ✅ Normal |
| prod-api-02 | 64 GB | 41.6 GB | 22.4 GB | 12.3 GB | 65.0% | ✅ Normal |
| prod-db-01 | 128 GB | 98.4 GB | 29.6 GB | 45.2 GB | 76.9% | ✅ Normal |
| prod-db-02 | 128 GB | 85.6 GB | 42.4 GB | 38.9 GB | 66.9% | ✅ Normal |
| prod-cache-01 | 16 GB | 14.2 GB | 1.8 GB | 0.5 GB | 88.8% | ⚠️ Warning |
| prod-worker-01 | 32 GB | 18.9 GB | 13.1 GB | 4.8 GB | 59.1% | ✅ Normal |

### Fleet Summary
- **Total Memory:** 496 GB
- **Used:** 350.2 GB (70.6%)
- **Available:** 145.8 GB
- **Hosts at Warning:** 2

### Swap Usage
| Host | Swap Total | Swap Used | Swap% |
|------|-----------|-----------|-------|
| prod-web-02 | 8 GB | 1.2 GB | 15.0% |
| prod-cache-01 | 4 GB | 0.8 GB | 20.0% |
| Others | — | 0 GB | 0% |`,
  },
  {
    question: "Is there a memory leak in any of our services?",
    answer: `## Memory Leak Detection Report

### Potential Memory Leaks Detected
| Service | Host | RSS Growth | Period | Confidence |
|---------|------|-----------|--------|------------|
| api-server (Node.js) | prod-web-02 | +2.4 GB | 72h | 🔴 High |
| event-processor | prod-api-01 | +890 MB | 48h | ⚠️ Medium |
| report-scheduler | prod-worker-01 | +340 MB | 24h | ⚠️ Medium |

### api-server Memory Growth Pattern
\`\`\`
Day 1:  ████████████░░░░░░░░ 1.2 GB (baseline)
Day 2:  ██████████████░░░░░░ 2.1 GB (+75%)
Day 3:  ████████████████░░░░ 3.6 GB (+71%)  ← Current
\`\`\`

### Heap Analysis (api-server on prod-web-02)
| Metric | Value | Normal Range |
|--------|-------|-------------|
| Heap Total | 2.8 GB | 0.5-1.5 GB |
| Heap Used | 2.4 GB | 0.3-1.0 GB |
| External | 890 MB | 100-300 MB |
| Array Buffers | 456 MB | 50-150 MB |
| GC Pause (avg) | 234ms | 10-50ms |
| GC Frequency | 12/min | 2-5/min |

### Likely Causes
1. **Event listener accumulation** — EventEmitter leak in WebSocket handler
2. **Unclosed database connections** — Connection pool growing without release
3. **Cache without eviction** — In-memory LRU cache exceeding max size

### Recommended Actions
1. Take a heap snapshot: \`kill -USR2 <pid>\` to generate \`.heapsnapshot\`
2. Enable \`--max-old-space-size=2048\` to cap heap growth
3. Schedule service restart during low-traffic window (02:00-04:00)`,
  },
  {
    question: "Show me OOM killer events in the last week",
    answer: `## OOM Killer Events (Last 7 Days)

### Events Summary
| Date | Host | Process Killed | RSS at Kill | Trigger |
|------|------|---------------|-------------|---------|
| Today 03:14 | prod-web-02 | node (api-server) | 3.8 GB | Memory pressure |
| 2 days ago 14:22 | prod-cache-01 | redis-server | 14.8 GB | Memory limit |
| 4 days ago 08:45 | prod-worker-01 | python (etl-job) | 6.2 GB | Cgroup limit |
| 5 days ago 22:10 | staging-01 | java (test-suite) | 4.1 GB | Memory pressure |

### Impact Assessment
| Event | Downtime | User Impact | Auto-Recovered |
|-------|----------|-------------|----------------|
| api-server OOM | 45s | 234 failed requests | ✅ Yes (systemd) |
| redis-server OOM | 2m 15s | Cache cold start | ✅ Yes (sentinel) |
| python etl-job OOM | N/A | ETL delayed 30m | ✅ Yes (retry) |
| java test-suite OOM | N/A | None (staging) | ❌ Manual restart |

### Prevention Recommendations
| Host | Current Limit | Recommended | Action |
|------|--------------|-------------|--------|
| prod-web-02 | No cgroup limit | 4 GB per process | Set memory.max in cgroup |
| prod-cache-01 | maxmemory 15GB | maxmemory 12GB | Reduce Redis maxmemory |
| prod-worker-01 | 8 GB cgroup | 8 GB (keep) | Fix ETL memory usage |`,
  },
  {
    question: "What's the memory pressure on the database hosts?",
    answer: `## Database Host Memory Analysis

### PostgreSQL Memory Configuration
| Parameter | prod-db-01 | prod-db-02 | Recommended |
|-----------|-----------|-----------|-------------|
| shared_buffers | 32 GB | 32 GB | 25% of RAM ✅ |
| effective_cache_size | 96 GB | 96 GB | 75% of RAM ✅ |
| work_mem | 256 MB | 256 MB | Consider 512 MB |
| maintenance_work_mem | 2 GB | 2 GB | ✅ Optimal |
| wal_buffers | 64 MB | 64 MB | ✅ Optimal |

### Memory Breakdown (prod-db-01)
| Component | Memory | % of Total |
|-----------|--------|------------|
| PostgreSQL shared_buffers | 32.0 GB | 25.0% |
| PostgreSQL connections (45 active) | 11.5 GB | 9.0% |
| OS page cache | 45.2 GB | 35.3% |
| OS kernel + services | 5.8 GB | 4.5% |
| Monitoring agents | 1.2 GB | 0.9% |
| Available | 32.3 GB | 25.2% |

### Buffer Cache Hit Ratio
| Database | Hit Ratio | Status |
|----------|-----------|--------|
| telemetryflow_main | 99.4% | ✅ Excellent |
| telemetryflow_auth | 98.8% | ✅ Good |
| telemetryflow_audit | 95.2% | ⚠️ Consider more cache |

### Recommendation
Buffer cache hit ratio for \`telemetryflow_audit\` is below 97%. Consider increasing \`shared_buffers\` to 40 GB if total RAM allows, or optimize audit query patterns to reduce cache churn.`,
  },
  {
    question: "Compare memory usage before and after the last deployment",
    answer: `## Memory Usage: Pre vs Post Deployment

### Deployment: v2.4.1 → v2.5.0 (deployed 6 hours ago)

### Service Memory Comparison
| Service | Pre-Deploy (avg) | Post-Deploy (avg) | Change | Status |
|---------|-----------------|-------------------|--------|--------|
| api-server | 1.1 GB | 1.3 GB | +18% | ⚠️ Review |
| order-processor | 680 MB | 645 MB | -5% | ✅ Improved |
| payment-service | 420 MB | 415 MB | -1% | ✅ Stable |
| user-service | 310 MB | 520 MB | +68% | 🔴 Investigate |
| notification-svc | 180 MB | 175 MB | -3% | ✅ Stable |

### user-service Deep Dive
| Metric | Pre-Deploy | Post-Deploy | Delta |
|--------|-----------|-------------|-------|
| Heap Used | 245 MB | 420 MB | +71% |
| External Memory | 65 MB | 100 MB | +54% |
| GC Pause Avg | 12ms | 28ms | +133% |
| GC Frequency | 3/min | 8/min | +167% |

### Probable Cause
The v2.5.0 release includes a new user profile caching layer. The in-memory cache is pre-warming on startup and loading more data than expected.

### Changelog Entries Related to Memory
- \`feat: Add user profile in-memory cache\` — likely cause of +68% memory
- \`fix: Reduce API server connection pool size\` — explains +18% (fewer pooled connections, more per-request alloc)
- \`perf: Optimize order processing batch size\` — explains -5% improvement

### Action Items
1. Review user profile cache max size configuration
2. Add LRU eviction policy (currently unbounded)
3. Monitor for 24h before scaling up instances`,
  },
];

export const INFRA_MEMORY_CONVERSATION_TITLES: string[] = [
  "Fleet memory utilization report",
  "Memory leak investigation on web tier",
  "OOM killer event analysis",
  "Database memory pressure review",
  "Post-deployment memory comparison",
  "Memory swap usage investigation",
  "Huge pages configuration analysis",
  "Container memory limit tuning",
  "Memory bandwidth saturation check",
  "RSS vs virtual memory analysis",
];

// ==================== STORAGE ====================

export const INFRA_STORAGE_MOCK_DATA: MockQA[] = [
  {
    question: "What's the disk usage across all hosts?",
    answer: `## Disk Usage Overview

### Storage Summary by Host
| Host | Mount | Total | Used | Avail | Usage% | Status |
|------|-------|-------|------|-------|--------|--------|
| prod-web-01 | /data | 500 GB | 312 GB | 188 GB | 62.4% | ✅ Normal |
| prod-web-02 | /data | 500 GB | 423 GB | 77 GB | 84.6% | ⚠️ Warning |
| prod-api-01 | /data | 1 TB | 456 GB | 544 GB | 44.6% | ✅ Normal |
| prod-api-02 | /data | 1 TB | 478 GB | 522 GB | 46.7% | ✅ Normal |
| prod-db-01 | /data/pg | 2 TB | 1.4 TB | 600 GB | 70.0% | ✅ Normal |
| prod-db-02 | /data/pg | 2 TB | 1.2 TB | 800 GB | 60.0% | ✅ Normal |
| prod-db-01 | /data/wal | 200 GB | 78 GB | 122 GB | 39.0% | ✅ Normal |
| prod-cache-01 | / | 100 GB | 23 GB | 77 GB | 23.0% | ✅ Normal |

### Fleet Summary
- **Total Storage:** 6.8 TB
- **Used:** 4.4 TB (64.7%)
- **Available:** 2.4 TB
- **Hosts Near Capacity (>80%):** 1

### Growth Rate
| Host | Daily Growth | Days Until 90% |
|------|-------------|----------------|
| prod-web-02 | +2.1 GB/day | 14 days ⚠️ |
| prod-db-01 | +5.8 GB/day | 52 days |
| prod-api-01 | +1.2 GB/day | 378 days |`,
  },
  {
    question: "Show me disk I/O performance metrics",
    answer: `## Disk I/O Performance

### IOPS by Host (Last 1 Hour Average)
| Host | Read IOPS | Write IOPS | Queue Depth | Avg Latency |
|------|-----------|------------|-------------|-------------|
| prod-db-01 | 4,520 | 2,890 | 3.2 | 2.1ms |
| prod-db-02 | 3,890 | 2,340 | 2.1 | 1.8ms |
| prod-web-01 | 890 | 1,230 | 0.8 | 0.9ms |
| prod-web-02 | 1,120 | 1,890 | 1.4 | 1.2ms |
| prod-api-01 | 456 | 678 | 0.4 | 0.6ms |
| prod-worker-01 | 2,340 | 3,450 | 4.8 | 3.4ms |

### Throughput
| Host | Read MB/s | Write MB/s | Disk Type |
|------|-----------|------------|-----------|
| prod-db-01 | 245 | 156 | NVMe SSD |
| prod-db-02 | 212 | 134 | NVMe SSD |
| prod-worker-01 | 178 | 234 | GP3 SSD |
| prod-web-02 | 89 | 123 | GP3 SSD |

### I/O Wait Analysis
| Host | IOWait% | Status | Concern |
|------|---------|--------|---------|
| prod-worker-01 | 8.9% | ⚠️ High | Report generation writes |
| prod-db-01 | 4.2% | ✅ Normal | Expected for DB workload |
| prod-web-02 | 3.1% | ✅ Normal | Log rotation underway |

### Recommendation
\`prod-worker-01\` IOWait is elevated during report generation. Consider:
- Moving report output to a dedicated volume with higher IOPS
- Implementing async write buffering for large reports`,
  },
  {
    question: "Which directories are growing the fastest?",
    answer: `## Directory Growth Analysis (Last 7 Days)

### Top Growing Directories
| Host | Directory | Size | 7d Growth | Daily Rate |
|------|-----------|------|-----------|------------|
| prod-web-02 | /data/logs | 234 GB | +14.7 GB | +2.1 GB/day |
| prod-db-01 | /data/pg/base | 1.1 TB | +40.6 GB | +5.8 GB/day |
| prod-api-01 | /data/uploads | 123 GB | +8.4 GB | +1.2 GB/day |
| prod-worker-01 | /data/reports | 89 GB | +6.3 GB | +0.9 GB/day |
| prod-db-01 | /data/wal | 78 GB | +3.5 GB | +0.5 GB/day |

### Log Directory Breakdown (prod-web-02)
| Log Type | Size | Rotation | Max Age |
|----------|------|----------|---------|
| nginx access.log | 89 GB | Daily | 14 days |
| app error.log | 67 GB | Daily | 30 days |
| app debug.log | 45 GB | Hourly | 3 days |
| audit.log | 33 GB | Daily | 90 days |

### Actionable Recommendations
1. **prod-web-02 /data/logs** — Reduce debug.log retention from 3d to 1d (saves ~30 GB)
2. **prod-web-02 /data/logs** — Enable gzip compression on rotated logs
3. **prod-db-01** — Schedule VACUUM FULL on weekends to reclaim space
4. **prod-api-01** — Implement S3 offloading for uploads older than 30 days`,
  },
  {
    question: "Are there any disk health warnings?",
    answer: `## Disk Health Report

### S.M.A.R.T. Status
| Host | Disk | Model | Health | Hours | Temp |
|------|------|-------|--------|-------|------|
| prod-db-01 | /dev/nvme0n1 | Samsung PM9A3 | ✅ OK | 12,456 | 38°C |
| prod-db-01 | /dev/nvme1n1 | Samsung PM9A3 | ✅ OK | 12,456 | 36°C |
| prod-db-02 | /dev/nvme0n1 | Samsung PM9A3 | ✅ OK | 8,234 | 37°C |
| prod-web-01 | /dev/sda | GP3 EBS | N/A | N/A | N/A |
| prod-web-02 | /dev/sda | GP3 EBS | N/A | N/A | N/A |

### EBS Volume Health (AWS)
| Volume | Host | State | Burst Balance |
|--------|------|-------|--------------|
| vol-0a1b2c3d | prod-web-01 | ✅ OK | 98% |
| vol-0e4f5g6h | prod-web-02 | ⚠️ Low Burst | 12% |
| vol-0i7j8k9l | prod-api-01 | ✅ OK | 95% |
| vol-0m1n2o3p | prod-api-02 | ✅ OK | 92% |

### Filesystem Warnings
| Host | Filesystem | Warning | Severity |
|------|-----------|---------|----------|
| prod-web-02 | /data (ext4) | Inode usage at 78% | ⚠️ Medium |
| prod-db-01 | /data/pg (xfs) | Fragmentation at 15% | ℹ️ Low |

### Action Items
1. **prod-web-02 EBS** — Burst balance at 12%. Upgrade from gp3 baseline to provisioned IOPS.
2. **prod-web-02 inodes** — Clean up small temp files in /data/logs/tmp/
3. Schedule \`xfs_fsr\` defragmentation on prod-db-01 during maintenance window`,
  },
];

export const INFRA_STORAGE_CONVERSATION_TITLES: string[] = [
  "Disk usage capacity planning",
  "I/O performance investigation",
  "Storage growth trend analysis",
  "Disk health and SMART status",
  "Log storage optimization review",
  "IOPS saturation root cause",
  "Disk queue depth spike analysis",
  "Volume throughput trend review",
  "File system fragmentation check",
  "Storage class performance comparison",
];

// ==================== NETWORK ====================

export const INFRA_NETWORK_MOCK_DATA: MockQA[] = [
  {
    question: "What's the network traffic overview?",
    answer: `## Network Traffic Overview

### Interface Traffic Summary (Last 1 Hour)
| Host | Interface | RX Rate | TX Rate | RX Errors | TX Errors |
|------|-----------|---------|---------|-----------|-----------|
| prod-web-01 | eth0 | 234 Mbps | 456 Mbps | 0 | 0 |
| prod-web-02 | eth0 | 312 Mbps | 523 Mbps | 12 | 0 |
| prod-api-01 | eth0 | 178 Mbps | 289 Mbps | 0 | 0 |
| prod-api-02 | eth0 | 156 Mbps | 267 Mbps | 0 | 0 |
| prod-db-01 | eth0 | 89 Mbps | 345 Mbps | 0 | 0 |
| prod-db-02 | eth0 | 67 Mbps | 234 Mbps | 0 | 0 |
| prod-cache-01 | eth0 | 456 Mbps | 423 Mbps | 0 | 0 |

### Total Bandwidth
- **Inbound:** 1.49 Gbps
- **Outbound:** 2.54 Gbps
- **Peak (24h):** 4.2 Gbps (at 12:15 UTC)
- **Interface Capacity:** 10 Gbps per host

### Anomalies
| Host | Issue | Value | Threshold |
|------|-------|-------|-----------|
| prod-web-02 | RX errors | 12/hr | 0/hr |
| prod-cache-01 | High bandwidth | 879 Mbps total | 800 Mbps warn |

### Top Talkers (by bytes transferred)
1. prod-cache-01 ↔ prod-api-01: 234 GB/hr (Redis cache traffic)
2. prod-web-01 ↔ CDN: 189 GB/hr (static assets)
3. prod-db-01 ↔ prod-api-01: 156 GB/hr (query results)`,
  },
  {
    question: "Show me network latency between services",
    answer: `## Inter-Service Network Latency

### Latency Matrix (p50 / p99)
| From → To | api-01 | api-02 | db-01 | db-02 | cache-01 |
|-----------|--------|--------|-------|-------|----------|
| web-01 | 0.3/1.2ms | 0.4/1.5ms | — | — | 0.2/0.8ms |
| web-02 | 0.4/1.8ms | 0.3/1.3ms | — | — | 0.2/0.9ms |
| api-01 | — | 0.1/0.4ms | 0.5/2.3ms | 0.6/2.8ms | 0.1/0.5ms |
| api-02 | 0.1/0.4ms | — | 0.6/2.5ms | 0.5/2.1ms | 0.1/0.5ms |

### Cross-AZ Latency
| Route | AZ Pair | p50 | p99 | Status |
|-------|---------|-----|-----|--------|
| api → db (primary) | us-east-1a → 1a | 0.5ms | 2.3ms | ✅ Same AZ |
| api → db (replica) | us-east-1a → 1b | 1.2ms | 4.8ms | ✅ Cross AZ |
| api → cache | us-east-1a → 1a | 0.1ms | 0.5ms | ✅ Same AZ |
| web → api | us-east-1c → 1a | 0.8ms | 3.2ms | ⚠️ Cross AZ |

### Latency Percentile Distribution (api → db)
\`\`\`
p50:  ██░░░░░░░░ 0.5ms
p75:  ████░░░░░░ 1.2ms
p90:  ██████░░░░ 1.8ms
p95:  ████████░░ 2.1ms
p99:  █████████░ 2.3ms
p999: ██████████ 4.5ms
\`\`\`

### Recommendation
Consider moving web servers to the same AZ as API servers to reduce web→api p99 from 3.2ms to ~1.5ms. Current cross-AZ setup adds ~0.5ms overhead per hop.`,
  },
  {
    question: "Are there any TCP connection issues?",
    answer: `## TCP Connection Health Report

### Connection States by Host
| Host | Established | Time Wait | Close Wait | SYN Recv | Fin Wait |
|------|------------|-----------|------------|----------|----------|
| prod-web-01 | 2,345 | 456 | 12 | 23 | 34 |
| prod-web-02 | 3,456 | 1,234 | 89 | 45 | 67 |
| prod-api-01 | 1,890 | 234 | 5 | 12 | 18 |
| prod-api-02 | 1,678 | 198 | 3 | 8 | 15 |
| prod-db-01 | 456 | 23 | 0 | 2 | 4 |

### Issues Detected
| Host | Issue | Count | Severity |
|------|-------|-------|----------|
| prod-web-02 | High TIME_WAIT | 1,234 | ⚠️ Warning |
| prod-web-02 | Elevated CLOSE_WAIT | 89 | ⚠️ Warning |
| prod-web-02 | Connection refused errors | 23/min | 🔴 Critical |

### prod-web-02 Connection Analysis
- **TIME_WAIT accumulation**: Likely due to short-lived connections without connection reuse
- **CLOSE_WAIT**: Application not properly closing sockets (possible leak)
- **Connection refused**: Upstream service rejecting connections (backlog full)

### Kernel Parameters (prod-web-02)
| Parameter | Current | Recommended |
|-----------|---------|-------------|
| net.ipv4.tcp_tw_reuse | 0 | 1 |
| net.core.somaxconn | 128 | 4096 |
| net.ipv4.tcp_max_syn_backlog | 512 | 4096 |
| net.ipv4.tcp_fin_timeout | 60 | 30 |
| net.core.netdev_max_backlog | 1000 | 5000 |

### Immediate Actions
1. Enable \`tcp_tw_reuse\` to reduce TIME_WAIT accumulation
2. Increase \`somaxconn\` to prevent connection refused errors
3. Investigate application code for unclosed sockets causing CLOSE_WAIT`,
  },
  {
    question: "Show me DNS resolution performance",
    answer: `## DNS Resolution Performance

### DNS Query Stats (Last 1 Hour)
| Metric | Value | Trend |
|--------|-------|-------|
| Total Queries | 45,678 | → Stable |
| Avg Resolution Time | 2.3ms | ✅ Normal |
| Cache Hit Rate | 94.2% | ✅ Good |
| NXDOMAIN Responses | 123 | ⚠️ Check |
| SERVFAIL Responses | 12 | ✅ Low |
| Timeout Rate | 0.02% | ✅ Normal |

### Resolution Time by Domain Type
| Domain Type | Avg Time | p99 Time | Queries/hr |
|-------------|----------|----------|------------|
| Internal (.svc.cluster.local) | 0.8ms | 2.1ms | 23,456 |
| External (api.stripe.com) | 12.4ms | 45.6ms | 3,456 |
| External (*.amazonaws.com) | 8.9ms | 23.4ms | 8,901 |
| External (*.google.com) | 6.7ms | 18.9ms | 2,345 |
| CDN (cdn.telemetryflow.id) | 3.2ms | 8.9ms | 7,520 |

### NXDOMAIN Analysis
| Query | Count | Source | Likely Cause |
|-------|-------|--------|-------------|
| old-api.internal.svc | 67 | api-server | Deprecated service reference |
| metrics-v1.svc.local | 34 | telegraf | Old config file |
| auth-backup.internal | 22 | auth-service | Failover endpoint removed |

### Recommendations
1. Update api-server config to remove \`old-api.internal.svc\` reference
2. Update telegraf config to use \`metrics.svc.cluster.local\`
3. Consider enabling DNS prefetching for external domains`,
  },
  {
    question: "What's the bandwidth utilization trend?",
    answer: `## Bandwidth Utilization Trends

### Daily Traffic Pattern (Last 7 Days Average)
\`\`\`
Hour  | Inbound              | Outbound
00:00 | ████░░░░░░ 0.6 Gbps  | ██████░░░░ 1.1 Gbps
06:00 | ██████░░░░ 1.1 Gbps  | ████████░░ 1.8 Gbps
09:00 | ████████░░ 1.8 Gbps  | ██████████ 2.8 Gbps
12:00 | ██████████ 2.4 Gbps  | ██████████ 3.2 Gbps ← Peak
15:00 | █████████░ 2.1 Gbps  | ██████████ 2.9 Gbps
18:00 | ███████░░░ 1.5 Gbps  | ████████░░ 2.1 Gbps
21:00 | █████░░░░░ 0.9 Gbps  | ██████░░░░ 1.4 Gbps
\`\`\`

### Weekly Summary
| Day | Peak In | Peak Out | Total Transfer |
|-----|---------|----------|---------------|
| Monday | 2.4 Gbps | 3.2 Gbps | 18.5 TB |
| Tuesday | 2.6 Gbps | 3.5 Gbps | 19.8 TB |
| Wednesday | 2.3 Gbps | 3.1 Gbps | 17.9 TB |
| Thursday | 2.5 Gbps | 3.4 Gbps | 19.2 TB |
| Friday | 2.1 Gbps | 2.8 Gbps | 16.4 TB |
| Saturday | 0.8 Gbps | 1.2 Gbps | 6.8 TB |
| Sunday | 0.6 Gbps | 0.9 Gbps | 5.2 TB |

### Capacity Planning
- **Current Peak:** 3.5 Gbps (35% of 10 Gbps capacity)
- **Growth Rate:** +8% month-over-month
- **Projected Peak (6 months):** 5.2 Gbps
- **Upgrade Needed:** Not until peak exceeds 7 Gbps (~12 months)`,
  },
];

export const INFRA_NETWORK_CONVERSATION_TITLES: string[] = [
  "Network traffic bandwidth analysis",
  "Inter-service latency investigation",
  "TCP connection health audit",
  "DNS resolution performance review",
  "Bandwidth capacity planning",
  "Packet loss detection between pods",
  "MTU mismatch troubleshooting",
  "Network interface error rate analysis",
  "Egress cost optimization review",
  "Connection tracking table exhaustion",
];

export const INFRA_OVERVIEW_CONVERSATION_TITLES: string[] = [
  "Full infrastructure health review",
  "Multi-host resource pressure analysis",
  "Fleet-wide capacity planning",
  "Correlated CPU and memory spike investigation",
  "Infrastructure optimization recommendations",
  "Host performance comparison across regions",
  "Cluster-wide resource saturation check",
  "Underutilized host identification",
  "Infrastructure cost reduction analysis",
  "Cross-host network bottleneck detection",
];
