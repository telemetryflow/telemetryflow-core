/**
 * API Keys Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for API key management and usage analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const API_KEYS_MOCK_DATA: MockQA[] = [
  {
    question: "Show me all API keys and their usage",
    answer: `## API Key Inventory

### Active Keys
| Name | Key Hint | Scope | Created | Last Used | Requests (30d) | Status |
|------|----------|-------|---------|-----------|---------------|--------|
| Production Ingestion | sk-prod...x1a | write:telemetry | 90d ago | 1m ago | 12,456,789 | ✅ Active |
| Staging Ingestion | sk-stag...b2c | write:telemetry | 60d ago | 5m ago | 234,567 | ✅ Active |
| CI/CD Pipeline | sk-cicd...d3e | read:all, write:deploy | 45d ago | 2h ago | 8,901 | ✅ Active |
| Grafana Read | sk-graf...f4g | read:metrics,logs | 30d ago | 15m ago | 45,678 | ✅ Active |
| External Webhook | sk-hook...h5i | write:alerts | 120d ago | 3d ago | 1,234 | ✅ Active |
| Dev Testing | sk-devt...j6k | read:all | 120d ago | 45d ago | 123 | ⚠️ Stale |
| Legacy Script | sk-legc...l7m | write:all | 200d ago | 90d+ ago | 0 | 🔴 Unused |

### Usage Summary
| Metric | Value |
|--------|-------|
| Total Active Keys | 7 |
| Keys Used (Last 7d) | 5 |
| Total Requests (30d) | 12,747,292 |
| Avg Requests/Key/Day | 60,701 |
| Rate Limit Hits (30d) | 45 |

### Key Permissions Summary
| Permission | Keys with Access | Risk |
|------------|-----------------|------|
| write:all | 1 (Legacy Script) | 🔴 High |
| write:telemetry | 2 | ✅ Normal |
| read:all | 2 | ⚠️ Medium |
| read:metrics | 1 | ✅ Normal |
| write:alerts | 1 | ✅ Normal |
| write:deploy | 1 | ✅ Normal |

### Security Recommendations
1. **Revoke** Legacy Script key — unused for 90+ days with \`write:all\` scope
2. **Rotate** Dev Testing key — stale for 45 days
3. **Restrict** CI/CD key — add IP allowlist for CI runners
4. **Monitor** Production key — highest volume, ensure rate limits are adequate`,
  },
  {
    question: "How do I create a new API key?",
    answer: `## Creating an API Key

### Via API
\`\`\`bash
curl -X POST https://api.telemetryflow.id/api/v2/api-keys \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "New Integration Key",
    "description": "Used by monitoring dashboard",
    "permissions": ["read:metrics", "read:logs", "read:traces"],
    "expiresIn": "90d",
    "rateLimit": {
      "requestsPerSecond": 100,
      "burstSize": 200
    },
    "ipAllowlist": ["10.0.0.0/8", "172.16.0.0/12"],
    "metadata": {
      "team": "platform",
      "environment": "production"
    }
  }'
\`\`\`

### Response
\`\`\`json
{
  "id": "key-uuid-12345",
  "name": "New Integration Key",
  "key": "sk-tf-xxxxxxxxxxxxxxxxxxxx",
  "keyHint": "sk-tf...xxxx",
  "permissions": ["read:metrics", "read:logs", "read:traces"],
  "expiresAt": "2024-06-15T00:00:00Z",
  "createdAt": "2024-03-15T10:00:00Z"
}
\`\`\`

> **Important:** The full key is only shown once. Store it securely.

### Available Permissions
| Permission | Description | Risk Level |
|------------|-------------|------------|
| read:metrics | Query metrics data | Low |
| read:logs | Query log data | Low |
| read:traces | Query trace data | Low |
| read:all | Read all data types | Medium |
| write:telemetry | Ingest telemetry data | Medium |
| write:alerts | Create/manage alerts | Medium |
| write:deploy | Trigger deployments | High |
| write:all | Full write access | Critical |
| admin:manage | Administrative operations | Critical |

### Best Practices
| Practice | Description |
|----------|-------------|
| Least privilege | Only grant required permissions |
| Expiration | Set expiration (90 days recommended) |
| IP allowlist | Restrict to known IP ranges |
| Rate limiting | Set appropriate limits per use case |
| Naming | Use descriptive names with team/purpose |
| Rotation | Rotate keys every 90 days |`,
  },
  {
    question: "Which API keys are approaching their rate limits?",
    answer: `## Rate Limit Analysis

### Current Rate Limit Status
| Key | Limit | Current Rate | Peak (24h) | Headroom | Status |
|-----|-------|-------------|-----------|----------|--------|
| Production Ingestion | 1,000 rps | 850 rps | 980 rps | 15% | ⚠️ Near limit |
| Staging Ingestion | 200 rps | 45 rps | 120 rps | 78% | ✅ OK |
| CI/CD Pipeline | 50 rps | 2 rps | 25 rps | 96% | ✅ OK |
| Grafana Read | 100 rps | 15 rps | 78 rps | 85% | ✅ OK |
| External Webhook | 10 rps | 0.5 rps | 3 rps | 95% | ✅ OK |

### Production Key Rate Detail (Last 24h)
\`\`\`
Hour  | Requests/sec
00:00 | ██████████████░░░░░░ 680 rps
06:00 | ████████████████░░░░ 780 rps
09:00 | ██████████████████░░ 890 rps
12:00 | ████████████████████ 980 rps  ← Peak
15:00 | ██████████████████░░ 920 rps
18:00 | ████████████████░░░░ 820 rps
21:00 | ██████████████░░░░░░ 720 rps
\`\`\`

### Rate Limit Events (Last 7 Days)
| Key | Events | Peak Time | HTTP 429 Count |
|-----|--------|-----------|---------------|
| Production Ingestion | 12 | 12:15 UTC (Monday) | 234 requests dropped |
| Grafana Read | 3 | 09:00 UTC (Tuesday) | 45 requests dropped |
| Others | 0 | — | 0 |

### Recommendations
| Key | Current Limit | Recommended | Reason |
|-----|--------------|-------------|--------|
| Production Ingestion | 1,000 rps | 1,500 rps | Peak at 980 rps, 12 limit events |
| Grafana Read | 100 rps | 150 rps | Occasional spikes during dashboard loads |
| Others | Current | Keep | Well within limits |

### How to Update Rate Limits
\`\`\`bash
curl -X PATCH "https://api.telemetryflow.id/api/v2/api-keys/{keyId}" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "rateLimit": { "requestsPerSecond": 1500, "burstSize": 3000 } }'
\`\`\``,
  },
  {
    question: "Show me API key security audit",
    answer: `## API Key Security Audit

### Security Score: 72/100

### Critical Findings
| Finding | Key | Severity | Recommendation |
|---------|-----|----------|---------------|
| No IP restriction | Production Ingestion | 🔴 Critical | Add IP allowlist |
| write:all scope | Legacy Script | 🔴 Critical | Revoke immediately |
| No expiration | 4 keys | ⚠️ High | Set 90-day expiration |
| Unused 90+ days | Legacy Script | ⚠️ High | Revoke |
| Stale 45+ days | Dev Testing | ⚠️ Medium | Rotate or revoke |

### Key Security Matrix
| Key | IP Restricted | Expiration | Rotated (90d) | Scoped | Score |
|-----|:------------:|:----------:|:-------------:|:------:|:-----:|
| Production | ❌ | ❌ | ✅ | ✅ | 50% |
| Staging | ✅ | ❌ | ✅ | ✅ | 75% |
| CI/CD | ✅ | ✅ | ✅ | ✅ | 100% |
| Grafana | ❌ | ❌ | ✅ | ✅ | 50% |
| Webhook | ✅ | ✅ | ❌ | ✅ | 75% |
| Dev Testing | ❌ | ❌ | ❌ | ⚠️ | 0% |
| Legacy Script | ❌ | ❌ | ❌ | ❌ | 0% |

### Suspicious Usage Patterns
| Key | Pattern | Time | Details |
|-----|---------|------|---------|
| Production | Unusual source IP | 3d ago | Request from 45.33.xx.xx (not in known ranges) |
| Staging | After-hours usage | 5d ago | Burst at 03:00 UTC (normally idle) |

### Remediation Plan
| Priority | Action | Keys Affected | Effort |
|----------|--------|--------------|--------|
| 1 (Critical) | Revoke Legacy Script | 1 | 5 min |
| 2 (Critical) | Add IP restriction to Production | 1 | 15 min |
| 3 (High) | Set expiration on all keys | 4 | 10 min |
| 4 (Medium) | Rotate Dev Testing | 1 | 10 min |
| 5 (Medium) | Investigate suspicious IPs | 1 | 30 min |`,
  },
  {
    question: "How do I rotate an API key safely?",
    answer: `## Safe API Key Rotation Guide

### Zero-Downtime Rotation Process
| Step | Action | Downtime | Duration |
|------|--------|----------|----------|
| 1 | Create new key with same permissions | None | 1 min |
| 2 | Deploy new key to consumers | None | 5-30 min |
| 3 | Monitor both keys in parallel | None | 24h |
| 4 | Verify old key has zero traffic | None | Check |
| 5 | Revoke old key | None | 1 min |

### Step-by-Step API Commands

#### 1. Create New Key (Clone Permissions)
\`\`\`bash
# Get existing key details
curl "https://api.telemetryflow.id/api/v2/api-keys/{oldKeyId}" \\
  -H "Authorization: Bearer $TOKEN"

# Create replacement key
curl -X POST "https://api.telemetryflow.id/api/v2/api-keys" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "Production Ingestion (rotated 2024-03)",
    "permissions": ["write:telemetry"],
    "rateLimit": { "requestsPerSecond": 1500, "burstSize": 3000 },
    "ipAllowlist": ["10.0.0.0/8"],
    "expiresIn": "90d"
  }'
\`\`\`

#### 2. Update Consumers
\`\`\`bash
# Update environment variable / secret
kubectl create secret generic tf-api-key \\
  --from-literal=key=sk-tf-newkeyvalue \\
  --dry-run=client -o yaml | kubectl apply -f -

# Rolling restart to pick up new secret
kubectl rollout restart deployment/otel-collector
\`\`\`

#### 3. Monitor Both Keys
\`\`\`bash
# Check traffic on both keys
curl "https://api.telemetryflow.id/api/v2/api-keys/usage?keys=oldKeyId,newKeyId&period=1h" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

#### 4. Verify & Revoke
\`\`\`bash
# Once old key shows 0 requests for 24h
curl -X DELETE "https://api.telemetryflow.id/api/v2/api-keys/{oldKeyId}" \\
  -H "Authorization: Bearer $TOKEN"
\`\`\`

### Automated Rotation
Enable automatic rotation in settings:
\`\`\`bash
curl -X PUT "https://api.telemetryflow.id/api/v2/api-keys/{keyId}/rotation" \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "autoRotate": true, "intervalDays": 90, "notifyDaysBefore": 14 }'
\`\`\``,
  },
  {
    question: "What endpoints are each API key accessing?",
    answer: `## API Key Endpoint Access Report

### Production Ingestion Key
| Endpoint | Method | Requests/day | Avg Latency | Error Rate |
|----------|--------|-------------|-------------|------------|
| /v1/metrics | POST | 345,678 | 12ms | 0.02% |
| /v1/logs | POST | 89,012 | 15ms | 0.05% |
| /v1/traces | POST | 23,456 | 18ms | 0.03% |
| /api/v2/health | GET | 1,440 | 3ms | 0% |

### Grafana Read Key
| Endpoint | Method | Requests/day | Avg Latency | Error Rate |
|----------|--------|-------------|-------------|------------|
| /api/v2/metrics/query | POST | 8,456 | 234ms | 0.1% |
| /api/v2/metrics/labels | GET | 2,345 | 45ms | 0% |
| /api/v2/metrics/series | GET | 1,890 | 89ms | 0% |
| /api/v2/logs/search | POST | 567 | 345ms | 0.2% |

### CI/CD Pipeline Key
| Endpoint | Method | Requests/day | Avg Latency | Error Rate |
|----------|--------|-------------|-------------|------------|
| /api/v2/health | GET | 144 | 5ms | 0% |
| /api/v2/alerts/rules | GET | 24 | 45ms | 0% |
| /api/v2/dashboards | GET | 12 | 67ms | 0% |

### Endpoint Access Heatmap (Production Key)
\`\`\`
Endpoint          | 00  06  12  18  24
/v1/metrics       | ██  ██  ██  ██  ██  (constant — collector)
/v1/logs          | █░  ██  ██  ██  █░  (business hours heavy)
/v1/traces        | █░  ██  ██  █░  █░  (business hours)
/api/v2/health    | ░░  ░░  ░░  ░░  ░░  (1/min constant)
\`\`\`

### Unauthorized Access Attempts (Last 30 Days)
| Key | Endpoint Attempted | Count | Result |
|-----|-------------------|-------|--------|
| Grafana Read | /api/v2/alerts/rules (POST) | 3 | 403 Forbidden |
| External Webhook | /api/v2/metrics/query | 1 | 403 Forbidden |
| Dev Testing | /api/v2/admin/settings | 2 | 403 Forbidden |`,
  },
];

export const API_KEYS_CONVERSATION_TITLES: string[] = [
  "API key inventory review",
  "Rate limit analysis",
  "API key security audit",
  "Key rotation procedure",
  "Endpoint access analysis",
  "API key rotation policy review",
  "Key usage patterns by service",
  "Expired key audit and cleanup",
  "Key scope and permission analysis",
  "Rate limit exceeded investigation",
];
