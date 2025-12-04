# Platform vs Core Comparison

## Overview

Comparison between **TelemetryFlow Platform** (monolith) and **TelemetryFlow Core** (IAM-only).

---

## Architecture

| Aspect | Platform | Core |
|--------|----------|------|
| **Type** | Monolith (Backend + Frontend) | Backend-only |
| **Modules** | 25+ modules | 1 module (IAM) |
| **Databases** | PostgreSQL + ClickHouse | PostgreSQL only |
| **Caching** | Redis (3 DBs) | None |
| **Messaging** | NATS JetStream | None |
| **Frontend** | Vue 3 + Vite | None |
| **Monorepo** | Turborepo | Single package |

---

## Package.json

### Platform
```json
{
  "name": "telemetryflow-platform",
  "version": "3.9.0",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "bootstrap": "bash backend/scripts/bootstrap.sh"
  }
}
```

### Core
```json
{
  "name": "telemetryflow-core",
  "version": "1.0.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "bootstrap": "bash scripts/bootstrap.sh"
  }
}
```

**Differences**:
- ❌ No Turborepo
- ❌ No workspaces
- ❌ No frontend scripts
- ✅ Simpler, direct scripts

---

## Docker Compose

### Platform (800+ lines)
```yaml
services:
  backend:        # NestJS API
  frontend:       # Vue 3 UI
  postgres:       # PostgreSQL 15
  clickhouse:     # ClickHouse 23
  redis:          # Redis 7
  nats:           # NATS 2.10
  prometheus:     # Prometheus
  otel-collector: # OTEL Collector
  loki:           # Grafana Loki
  opensearch:     # OpenSearch
  fluentbit:      # Fluent Bit
  pgadmin:        # pgAdmin 4
  portainer:      # Portainer
  # + more...

networks:
  telemetryflow_net:
    subnet: 172.150.0.0/16

volumes:
  vol_postgres_data:
  vol_clickhouse:
  vol_redis_data:
  vol_nats_data:
  vol_prometheus:
  vol_loki:
  vol_opensearch:
  # + more...
```

### Core (60 lines)
```yaml
services:
  postgres:       # PostgreSQL 16

networks:
  telemetryflow_core_net:
    subnet: 172.151.0.0/16

volumes:
  vol_postgres_data:
```

**Differences**:
- ❌ No ClickHouse
- ❌ No Redis
- ❌ No NATS
- ❌ No monitoring stack
- ❌ No frontend
- ✅ Only PostgreSQL
- ✅ Different subnet (no conflicts)

---

## Dockerfile

### Platform
```dockerfile
FROM node:22-alpine AS builder
# Multi-stage build
# Backend + Frontend
# Production optimized
```

### Core
```
❌ No Dockerfile yet
```

**Note**: Core can use same Dockerfile pattern if needed.

---

## Configuration Directory

### Platform (`config/`)
```
config/
├── clickhouse/
│   ├── config.xml
│   ├── users.xml
│   └── README.md
├── redis/
│   └── redis.conf
├── nats/
│   └── nats.conf
├── prometheus/
│   └── prometheus.yml
├── otel/
│   ├── otel-collector-config.yaml
│   └── README.md
├── loki/
│   └── loki-config.yaml
├── opensearch/
│   └── opensearch.yml
├── fluentbit/
│   └── fluent-bit.conf
├── postgresql/
│   └── postgresql.conf
└── README.md (28KB)
```

### Core
```
❌ No config directory
```

**Reason**: Core only needs PostgreSQL, which uses Docker defaults.

---

## Dependencies

### Platform Backend
```json
{
  "dependencies": {
    "@nestjs/*": "50+ packages",
    "@clickhouse/client": "^1.14.0",
    "redis": "^5.10.0",
    "ioredis": "^5.8.2",
    "nats": "^2.29.3",
    "bullmq": "^5.65.0",
    "@opentelemetry/*": "15+ packages",
    "winston": "^3.18.3",
    "winston-loki": "^6.1.3",
    "winston-elasticsearch": "^0.19.0",
    // + 100+ more
  }
}
```

### Core
```json
{
  "dependencies": {
    "@nestjs/*": "10 packages",
    "@opentelemetry/*": "8 packages",
    "winston": "^3.18.3",
    "typeorm": "^0.3.27",
    "pg": "^8.16.3",
    "argon2": "^0.44.0",
    // ~20 total
  }
}
```

**Differences**:
- ❌ No ClickHouse client
- ❌ No Redis clients
- ❌ No NATS
- ❌ No BullMQ
- ❌ No Winston transports (Loki, OpenSearch)
- ✅ Only essential packages

---

## Environment Variables

### Platform (.env.example - 1000+ lines)
```env
# Application (10 vars)
NODE_ENV=development
PORT=3100
FRONTEND_PORT=3101

# PostgreSQL (5 vars)
POSTGRES_HOST=172.150.150.20
POSTGRES_PORT=5432
# ...

# ClickHouse (5 vars)
CLICKHOUSE_HOST=http://0.0.0.0:8123
CLICKHOUSE_DB=telemetryflow_db
# ...

# Redis (10 vars)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_SESSION_DB=0
REDIS_CACHE_DB=1
REDIS_QUEUE_DB=2
# ...

# NATS (5 vars)
NATS_URL=nats://nats:4222
# ...

# Cache (5 vars)
CACHE_ENABLED=true
CACHE_L1_TTL=60000
# ...

# Queue (10 vars)
QUEUE_ENABLED=true
QUEUE_OTLP_CONCURRENCY=10
# ...

# Logging (20 vars)
LOG_LEVEL=info
LOKI_ENABLED=false
LOKI_HOST=http://loki:3100
FLUENTBIT_ENABLED=false
OPENSEARCH_ENABLED=false
# ...

# OTEL (10 vars)
OTEL_COLLECTOR_ENDPOINT=http://otel-collector:4318
# ...

# + 50+ more categories
```

### Core (.env.example - 50 lines)
```env
# Application (3 vars)
NODE_ENV=development
PORT=3000
TZ=UTC

# Docker (4 vars)
POSTGRES_VERSION=16-alpine
CONTAINER_POSTGRES=telemetryflow_core_postgres
# ...

# PostgreSQL (5 vars)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
# ...

# JWT (2 vars)
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# OTEL (3 vars)
OTEL_ENABLED=false
OTEL_SERVICE_NAME=telemetryflow-core
OTEL_EXPORTER_OTLP_ENDPOINT=

# Logging (2 vars)
LOG_LEVEL=info
LOG_PRETTY_PRINT=true
```

**Differences**:
- Platform: ~100+ variables
- Core: ~20 variables
- ✅ Much simpler configuration

---

## Modules

### Platform Backend (25+ modules)
```
backend/src/modules/
├── iam/              # Identity & Access Management
├── auth/             # Authentication
├── mfa/              # Multi-Factor Authentication
├── sso/              # Single Sign-On
├── audit/            # Audit Logging
├── telemetry/        # Telemetry Data (Metrics, Logs, Traces)
├── alerts/           # Alert Management
├── dashboard/        # Dashboard Management
├── monitoring/       # Uptime Monitoring
├── agent/            # Agent Management
├── aggregation/      # Data Aggregation
├── cache/            # Caching Layer
├── queue/            # Queue Management
├── messaging/        # NATS Messaging
├── email/            # Email Service
├── cors/             # CORS Configuration
├── api-keys/         # API Key Management
├── retention-policy/ # Data Retention
├── export/           # Data Export
├── query-builder/    # Query Builder
├── status-page/      # Status Page
├── subscription/     # Subscription Management
├── platform/         # Platform Management
├── ui/               # UI Configuration
├── alertrule-group/  # Alert Rule Groups
└── notification-group/ # Notification Groups
```

### Core (1 module)
```
src/modules/
└── iam/              # Identity & Access Management
```

**Differences**:
- Platform: 25+ modules
- Core: 1 module
- ✅ Focused on IAM only

---

## Database

### Platform
```
PostgreSQL:
  - IAM data (users, roles, permissions)
  - Configuration (agents, monitors, dashboards)
  - Alert rules
  - SSO configs
  - API keys
  - Audit logs (metadata)

ClickHouse:
  - Telemetry data (metrics, logs, traces)
  - Uptime checks
  - Alert history
  - Aggregations (hourly/daily)
  - Audit logs (full data)
```

### Core
```
PostgreSQL:
  - IAM data only (users, roles, permissions)
  - Tenants, Organizations, Workspaces
  - Regions
  - Groups
```

**Differences**:
- ❌ No ClickHouse
- ❌ No telemetry data storage
- ✅ Only IAM data

---

## Scripts

### Platform (`backend/scripts/`)
```bash
bootstrap.sh                    # Full setup (800 lines)
generate-sample-data.sh         # Generate telemetry data
seed.ts                         # Orchestrate all seeds
seed-iam.ts                     # Seed IAM
seed-core.ts                    # Seed core data
seed-monitoring.ts              # Seed monitors
seed-alerts.ts                  # Seed alerts
init-clickhouse.ts              # Initialize ClickHouse
run-migrations-programmatic.ts  # Run migrations
docker-volumes-setup.sh         # Setup Docker volumes
docker-volumes-clean.sh         # Clean Docker volumes
# + 40+ more scripts
```

### Core (`scripts/`)
```bash
bootstrap.sh                    # Simple setup (100 lines)
seed.ts                         # Seed orchestrator
seed-iam.ts                     # Seed IAM
generate-sample-data.sh         # Generate IAM samples
generate-sample-iam-data.ts     # Generate IAM data
```

**Differences**:
- Platform: 40+ scripts
- Core: 5 scripts
- ✅ Minimal but complete

---

## Features Comparison

| Feature | Platform | Core |
|---------|----------|------|
| **IAM** | ✅ Full | ✅ Full (Identical) |
| **5-Tier RBAC** | ✅ Yes | ✅ Yes |
| **Multi-Tenancy** | ✅ Yes | ✅ Yes |
| **Authentication** | ✅ JWT + OAuth + SSO | ❌ No |
| **MFA** | ✅ TOTP + SMS | ❌ No |
| **Telemetry** | ✅ Metrics, Logs, Traces | ❌ No |
| **Dashboards** | ✅ Yes | ❌ No |
| **Alerts** | ✅ Yes | ❌ No |
| **Monitoring** | ✅ Uptime checks | ❌ No |
| **Agents** | ✅ Yes | ❌ No |
| **Caching** | ✅ L1 + L2 (Redis) | ❌ No |
| **Queues** | ✅ BullMQ (5 queues) | ❌ No |
| **Aggregations** | ✅ Hourly/Daily | ❌ No |
| **Audit Logs** | ✅ Full (ClickHouse) | ❌ No |
| **API Keys** | ✅ Yes | ❌ No |
| **SSO** | ✅ SAML, OAuth | ❌ No |
| **Email** | ✅ Nodemailer | ❌ No |
| **Frontend** | ✅ Vue 3 | ❌ No |
| **Swagger** | ✅ Yes | ✅ Yes |
| **OpenTelemetry** | ✅ Full stack | ✅ Basic tracing |
| **Winston Logging** | ✅ + Transports | ✅ Console only |

---

## Size Comparison

| Metric | Platform | Core |
|--------|----------|------|
| **Total Files** | 3000+ | 200+ |
| **Lines of Code** | 150,000+ | 15,000+ |
| **Dependencies** | 150+ | 30+ |
| **Docker Services** | 15+ | 1 |
| **Config Files** | 50+ | 5 |
| **Scripts** | 40+ | 5 |
| **Modules** | 25+ | 1 |
| **Database Tables** | 50+ | 13 |
| **API Endpoints** | 200+ | 50+ |
| **node_modules** | ~500MB | ~150MB |
| **Docker Images** | ~5GB | ~500MB |

---

## Performance

| Aspect | Platform | Core |
|--------|----------|------|
| **Startup Time** | 10-15s | 2-3s |
| **Memory Usage** | 500MB-1GB | 100-200MB |
| **CPU Usage** | Medium-High | Low |
| **Disk Space** | 5-10GB | 1-2GB |
| **Build Time** | 2-3 min | 30s |

---

## Use Cases

### Platform
- ✅ Full observability platform
- ✅ Telemetry data collection
- ✅ Monitoring & alerting
- ✅ Multi-tenant SaaS
- ✅ Enterprise deployments
- ✅ Complete solution

### Core
- ✅ IAM-only service
- ✅ Authentication/Authorization
- ✅ User management
- ✅ Multi-tenant IAM
- ✅ Microservice architecture
- ✅ Learning DDD/CQRS

---

## Migration Path

### From Core to Platform

1. **Add ClickHouse**:
   ```bash
   cp -r platform/config/clickhouse core/config/
   ```

2. **Add Redis**:
   ```bash
   # Update docker-compose.yml
   ```

3. **Add Modules**:
   ```bash
   cp -r platform/backend/src/modules/telemetry core/src/modules/
   ```

4. **Add Frontend**:
   ```bash
   cp -r platform/frontend core/
   ```

### From Platform to Core

Already done! This is TelemetryFlow Core.

---

## Deployment

### Platform
```bash
# Development
docker-compose --profile dev up -d
pnpm run dev

# Production
docker-compose up -d
pnpm run build
pnpm run start
```

### Core
```bash
# Development
docker-compose up -d
pnpm run dev

# Production
docker-compose up -d
pnpm run build
pnpm run start
```

**Differences**:
- Platform: Requires profiles, more complex
- Core: Simple, straightforward

---

## Maintenance

### Platform
- **Complexity**: High
- **Updates**: Multiple services
- **Monitoring**: Required
- **Backups**: PostgreSQL + ClickHouse
- **Scaling**: Horizontal + Vertical

### Core
- **Complexity**: Low
- **Updates**: Single service
- **Monitoring**: Optional
- **Backups**: PostgreSQL only
- **Scaling**: Vertical

---

## Cost Comparison

### Platform (Production)
```
Infrastructure:
- PostgreSQL: $50-200/month
- ClickHouse: $100-500/month
- Redis: $20-100/month
- NATS: $20-50/month
- Monitoring: $50-200/month
- Load Balancer: $20-50/month
Total: $260-1100/month
```

### Core (Production)
```
Infrastructure:
- PostgreSQL: $50-200/month
- Load Balancer: $20-50/month (optional)
Total: $50-250/month
```

**Savings**: 80-90% infrastructure cost

---

## When to Use

### Use Platform When:
- ✅ Need full observability
- ✅ Collecting telemetry data
- ✅ Need monitoring & alerts
- ✅ Enterprise requirements
- ✅ Complete solution needed

### Use Core When:
- ✅ Only need IAM
- ✅ Building microservices
- ✅ Learning DDD/CQRS
- ✅ Cost-sensitive
- ✅ Simple deployment
- ✅ Focused requirements

---

## Summary

| Aspect | Platform | Core | Winner |
|--------|----------|------|--------|
| **Features** | Complete | IAM-only | Platform |
| **Complexity** | High | Low | Core |
| **Cost** | High | Low | Core |
| **Maintenance** | Complex | Simple | Core |
| **Performance** | Heavy | Light | Core |
| **Scalability** | Horizontal | Vertical | Platform |
| **Use Case** | Full solution | IAM service | Depends |

---

## Conclusion

**TelemetryFlow Platform**: Full-featured observability platform for enterprises.

**TelemetryFlow Core**: Lightweight IAM service for focused use cases.

Both share the same IAM implementation (DDD + CQRS + 5-Tier RBAC), making Core a perfect subset of Platform.
