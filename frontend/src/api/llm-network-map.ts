/**
 * Network Map Context Mock Data for LLM AI Insights
 * Contains realistic Q&A pairs for network topology and infrastructure analysis
 */

export interface MockQA {
  question: string;
  answer: string;
}

export const NETWORK_MAP_MOCK_DATA: MockQA[] = [
  {
    question: "Show me the current network topology",
    answer: `## Network Topology Overview

### Infrastructure Layout
| Zone | Subnet | Hosts | Purpose |
|------|--------|-------|---------|
| us-east-1a | 10.0.1.0/24 | 6 | Primary application tier |
| us-east-1b | 10.0.2.0/24 | 4 | Database & cache tier |
| us-east-1c | 10.0.3.0/24 | 3 | Worker & async processing |
| Public | 10.0.100.0/24 | 2 | Load balancers & NAT |

### Network Components
| Component | Type | Status | Connections |
|-----------|------|--------|-------------|
| ALB-prod-01 | Load Balancer | ✅ Active | 12 targets |
| NLB-grpc-01 | Network LB | ✅ Active | 8 targets |
| NAT-gw-01 | NAT Gateway | ✅ Active | All private subnets |
| VPN-gw-01 | VPN Gateway | ✅ Active | 2 site-to-site tunnels |
| TGW-01 | Transit Gateway | ✅ Active | 3 VPC attachments |

### Cross-AZ Traffic
| Route | Bandwidth | Latency | Cost/GB |
|-------|-----------|---------|---------|
| 1a ↔ 1b | 456 Mbps | 0.8ms | $0.01 |
| 1a ↔ 1c | 234 Mbps | 0.9ms | $0.01 |
| 1b ↔ 1c | 89 Mbps | 1.1ms | $0.01 |

### Internet Egress
- **Daily Egress:** 2.4 TB
- **Monthly Cost (estimated):** $218
- **Top Destinations:** CDN (45%), API clients (35%), Webhooks (20%)`,
  },
  {
    question: "Are there any network security issues?",
    answer: `## Network Security Assessment

### Security Group Audit
| SG Name | Rules | Open Ports | Issues |
|---------|-------|-----------|--------|
| sg-web-public | 8 | 80, 443 | ✅ Clean |
| sg-api-internal | 12 | 8080, 4317 | ✅ Clean |
| sg-database | 6 | 5432 | ✅ Clean |
| sg-cache | 4 | 6379 | ⚠️ Wide CIDR |
| sg-management | 15 | 22, 3389 | ⚠️ Review |

### Issues Detected
| Issue | Severity | Resource | Detail |
|-------|----------|----------|--------|
| Wide CIDR on Redis | ⚠️ Medium | sg-cache | 10.0.0.0/16 instead of /24 |
| SSH from 0.0.0.0/0 | 🔴 Critical | sg-management | SSH open to internet |
| Unused security group | ℹ️ Low | sg-legacy-api | No attached resources |
| Missing flow logs | ⚠️ Medium | subnet-1c | VPC Flow Logs disabled |

### Network ACL Status
| Subnet | Inbound Rules | Outbound Rules | Status |
|--------|--------------|----------------|--------|
| 10.0.1.0/24 | 5 allow, 1 deny | 3 allow, 1 deny | ✅ |
| 10.0.2.0/24 | 3 allow, 1 deny | 2 allow, 1 deny | ✅ |
| 10.0.3.0/24 | 4 allow, 1 deny | 3 allow, 1 deny | ✅ |
| 10.0.100.0/24 | 2 allow, 1 deny | 2 allow, 1 deny | ✅ |

### Immediate Actions Required
1. **CRITICAL:** Remove 0.0.0.0/0 SSH rule from sg-management. Use SSM Session Manager instead.
2. **MEDIUM:** Restrict sg-cache CIDR to 10.0.1.0/24 (app tier only)
3. **MEDIUM:** Enable VPC Flow Logs on subnet-1c
4. **LOW:** Delete unused sg-legacy-api`,
  },
  {
    question: "What's the VPC peering and connectivity status?",
    answer: `## VPC Connectivity Status

### VPC Peering Connections
| Peering ID | VPCs | Status | Routes | Traffic/day |
|------------|------|--------|--------|-------------|
| pcx-prod-staging | prod ↔ staging | ✅ Active | 4 routes | 12 GB |
| pcx-prod-shared | prod ↔ shared-services | ✅ Active | 6 routes | 89 GB |
| pcx-prod-data | prod ↔ data-lake | ✅ Active | 2 routes | 234 GB |

### Transit Gateway Attachments
| Attachment | VPC/VPN | Status | Bandwidth |
|-----------|---------|--------|-----------|
| tgw-att-prod | VPC-Production | ✅ Active | 5 Gbps |
| tgw-att-shared | VPC-Shared-Services | ✅ Active | 2 Gbps |
| tgw-att-vpn-office | Site-to-Site VPN | ✅ Active | 1.25 Gbps |
| tgw-att-vpn-dc | Site-to-Site VPN | ⚠️ Degraded | 0.8 Gbps |

### VPN Tunnel Status
| Tunnel | Endpoint | Status | Uptime | Last Flap |
|--------|----------|--------|--------|-----------|
| vpn-office-tun1 | 203.0.113.1 | ✅ UP | 45d | 45d ago |
| vpn-office-tun2 | 203.0.113.2 | ✅ UP | 45d | 45d ago |
| vpn-dc-tun1 | 198.51.100.1 | ✅ UP | 3d | 3d ago |
| vpn-dc-tun2 | 198.51.100.2 | 🔴 DOWN | 0 | 12h ago |

### Issue Details
- **vpn-dc-tun2:** IKE phase 2 negotiation failure. Tunnel 1 is handling all traffic (failover working). Contact DC network team to check IKE pre-shared key rotation.
- **tgw-att-vpn-dc:** Degraded because only 1 of 2 tunnels active (reduced bandwidth).`,
  },
  {
    question: "Show me the firewall rules and traffic flow",
    answer: `## Firewall Rules & Traffic Flow

### Inbound Traffic Flow
| Source | Destination | Port | Protocol | Rule | Action |
|--------|-------------|------|----------|------|--------|
| 0.0.0.0/0 | ALB-prod | 443 | HTTPS | Web traffic | ✅ Allow |
| 0.0.0.0/0 | ALB-prod | 80 | HTTP | Redirect to 443 | ✅ Allow |
| Office CIDR | Bastion | 22 | SSH | Admin access | ✅ Allow |
| Monitoring | All hosts | 9090 | HTTP | Prometheus scrape | ✅ Allow |
| OTLP clients | NLB-grpc | 4317 | gRPC | Telemetry ingest | ✅ Allow |

### Internal Traffic Flow
| Source | Destination | Port | Protocol | Requests/sec |
|--------|-------------|------|----------|-------------|
| ALB → web-tier | 8080 | HTTP | 4,567 |
| web-tier → api-tier | 8081 | gRPC | 3,234 |
| api-tier → database | 5432 | PostgreSQL | 1,890 |
| api-tier → cache | 6379 | Redis | 12,345 |
| api-tier → kafka | 9092 | Kafka | 2,456 |
| workers → database | 5432 | PostgreSQL | 456 |

### WAF Rules (CloudFront/ALB)
| Rule | Matches/hr | Action | Status |
|------|-----------|--------|--------|
| SQL Injection | 234 | Block | ✅ Active |
| XSS Protection | 156 | Block | ✅ Active |
| Rate Limiting (100/s/IP) | 89 | Block | ✅ Active |
| Geo-blocking (sanctioned) | 12 | Block | ✅ Active |
| Bot Detection | 1,234 | Challenge | ✅ Active |
| IP Reputation | 567 | Block | ✅ Active |

### Top Blocked IPs (Last 24 Hours)
| IP | Country | Requests Blocked | Reason |
|----|---------|-----------------|--------|
| 45.33.xx.xx | CN | 12,456 | Rate limit + SQLi |
| 185.220.xx.xx | RU | 8,901 | Bot + XSS |
| 23.129.xx.xx | US | 4,567 | Rate limit (legitimate scraper) |`,
  },
  {
    question: "What's the network cost breakdown?",
    answer: `## Network Cost Analysis

### Monthly Network Costs (Current Month)
| Category | Cost | % of Total | Trend |
|----------|------|-----------|-------|
| Data Transfer Out | $1,234 | 42% | ↗ +8% |
| NAT Gateway Processing | $567 | 19% | → Stable |
| Cross-AZ Transfer | $345 | 12% | ↗ +15% |
| VPN Data Transfer | $234 | 8% | → Stable |
| Elastic IP | $89 | 3% | → Stable |
| Load Balancer (ALB+NLB) | $456 | 16% | ↗ +5% |
| **Total** | **$2,925** | **100%** | **↗ +7%** |

### Data Transfer Breakdown
| Destination | GB/month | Cost | Optimization |
|-------------|----------|------|-------------|
| Internet (CDN origin) | 8,456 GB | $756 | Use CloudFront caching |
| Internet (API responses) | 3,456 GB | $312 | Enable gzip compression |
| Cross-AZ | 12,345 GB | $345 | Co-locate services |
| VPC Peering | 2,345 GB | $0 | ✅ Free (same region) |
| S3 (same region) | 5,678 GB | $0 | ✅ Free (gateway endpoint) |

### Cost Optimization Recommendations
| Action | Estimated Savings | Effort |
|--------|------------------|--------|
| Enable CloudFront for static assets | -$312/mo | Low |
| Move db-replica to same AZ as api | -$120/mo | Medium |
| Enable gzip on API responses | -$89/mo | Low |
| Use VPC endpoints for AWS services | -$145/mo | Low |
| **Total Potential Savings** | **-$666/mo** | |

### Projected Costs (Next 3 Months)
| Month | Current Trend | After Optimization |
|-------|-------------|-------------------|
| This month | $2,925 | $2,925 |
| Next month | $3,130 | $2,464 |
| Month +2 | $3,349 | $2,520 |`,
  },
  {
    question: "Show me the load balancer health and configuration",
    answer: `## Load Balancer Status

### Application Load Balancer (ALB-prod-01)
| Metric | Value | Status |
|--------|-------|--------|
| Active Connections | 12,456 | ✅ Normal |
| New Connections/sec | 234 | ✅ Normal |
| Requests/sec | 4,567 | ✅ Normal |
| HTTP 2xx | 98.2% | ✅ Healthy |
| HTTP 4xx | 1.2% | ✅ Normal |
| HTTP 5xx | 0.6% | ✅ Normal |
| Avg Response Time | 89ms | ✅ Normal |
| SSL Handshake Time | 12ms | ✅ Normal |

### Target Group Health
| Target Group | Healthy | Unhealthy | Draining | Total |
|-------------|---------|-----------|----------|-------|
| tg-web-prod | 4 | 0 | 0 | 4 |
| tg-api-prod | 4 | 0 | 0 | 4 |
| tg-websocket | 2 | 0 | 0 | 2 |

### Network Load Balancer (NLB-grpc-01)
| Metric | Value | Status |
|--------|-------|--------|
| Active Flows | 8,901 | ✅ Normal |
| New Flows/sec | 156 | ✅ Normal |
| Processed Bytes | 23 GB/hr | ✅ Normal |
| TCP Reset Count | 12/hr | ✅ Low |
| Healthy Targets | 8/8 | ✅ All healthy |

### Health Check Configuration
| Target Group | Path | Interval | Threshold | Timeout |
|-------------|------|----------|-----------|---------|
| tg-web-prod | /health | 30s | 3 unhealthy | 10s |
| tg-api-prod | /health | 15s | 2 unhealthy | 5s |
| tg-websocket | TCP:8082 | 10s | 2 unhealthy | 5s |
| tg-grpc | gRPC health | 10s | 3 unhealthy | 5s |`,
  },
  {
    question: "What's the DNS configuration and health?",
    answer: `## DNS Configuration & Health

### Route 53 Hosted Zones
| Zone | Type | Records | Health Checks |
|------|------|---------|---------------|
| telemetryflow.id | Public | 34 | 8 active |
| internal.tf.local | Private | 56 | 12 active |

### Key DNS Records
| Record | Type | Target | TTL | Health |
|--------|------|--------|-----|--------|
| api.telemetryflow.id | A (Alias) | ALB-prod-01 | 60s | ✅ |
| collector.telemetryflow.id | A (Alias) | NLB-grpc-01 | 60s | ✅ |
| app.telemetryflow.id | CNAME | d123.cloudfront.net | 300s | ✅ |
| status.telemetryflow.id | A | 203.0.113.50 | 60s | ✅ |
| *.internal.tf.local | SRV | Service discovery | 30s | ✅ |

### DNS Health Checks
| Endpoint | Protocol | Interval | Status | Last Check |
|----------|----------|----------|--------|------------|
| api.telemetryflow.id/health | HTTPS | 30s | ✅ Healthy | 12s ago |
| collector.telemetryflow.id:4317 | TCP | 10s | ✅ Healthy | 3s ago |
| app.telemetryflow.id | HTTPS | 30s | ✅ Healthy | 18s ago |
| status.telemetryflow.id | HTTPS | 30s | ✅ Healthy | 8s ago |

### DNS Failover Configuration
| Primary | Failover | Type | Last Triggered |
|---------|----------|------|---------------|
| ALB us-east-1 | ALB us-west-2 | Active-Passive | 23 days ago |
| NLB us-east-1 | NLB us-west-2 | Active-Passive | Never |

### DNS Query Volume
- **Public zone:** 45,678 queries/hour
- **Private zone:** 123,456 queries/hour
- **Cache hit rate:** 94.2% (Route 53 Resolver)`,
  },
  {
    question: "Analyze network latency across regions",
    answer: `## Cross-Region Network Latency

### Region-to-Region Latency Matrix (p50 / p99)
| From → To | us-east-1 | us-west-2 | eu-west-1 | ap-southeast-1 |
|-----------|-----------|-----------|-----------|----------------|
| us-east-1 | — | 62/78ms | 85/112ms | 198/245ms |
| us-west-2 | 62/78ms | — | 142/178ms | 156/198ms |
| eu-west-1 | 85/112ms | 142/178ms | — | 178/223ms |
| ap-southeast-1 | 198/245ms | 156/198ms | 178/223ms | — |

### User-Facing Latency by Region
| Region | Users | p50 | p95 | p99 | Status |
|--------|-------|-----|-----|-----|--------|
| US East | 45% | 23ms | 89ms | 145ms | ✅ Excellent |
| US West | 25% | 78ms | 156ms | 234ms | ✅ Good |
| Europe | 20% | 112ms | 198ms | 312ms | ⚠️ Acceptable |
| APAC | 10% | 245ms | 389ms | 567ms | 🔴 Poor |

### APAC Latency Breakdown
| Component | Latency | % of Total |
|-----------|---------|------------|
| Network transit | 198ms | 80.8% |
| TLS handshake | 23ms | 9.4% |
| Server processing | 18ms | 7.3% |
| DNS resolution | 6ms | 2.4% |

### Optimization Recommendations
| Action | Region | Impact | Priority |
|--------|--------|--------|----------|
| Deploy edge cache in Singapore | APAC | -150ms p50 | 🔴 High |
| Enable TLS 1.3 + 0-RTT | All | -15ms first req | ⚠️ Medium |
| Pre-warm DNS in APAC | APAC | -4ms | ℹ️ Low |
| Consider read replica in eu-west-1 | Europe | -30ms DB queries | ⚠️ Medium |`,
  },
];

export const NETWORK_MAP_CONVERSATION_TITLES: string[] = [
  "Network topology overview",
  "Security group audit findings",
  "VPC peering connectivity status",
  "Network cost optimization",
  "Cross-region latency analysis",
  "Network topology change detection",
  "East-west traffic bottleneck analysis",
  "Service mesh latency investigation",
  "Unusual connection pattern detection",
  "Network segmentation compliance check",
];
