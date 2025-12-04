# Platform vs Core Comparison

## Overview

Comparison between **TelemetryFlow Platform** (Monolith) and **TelemetryFlow Core** (IAM-only).

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

### Core (400+ lines)
```yaml
services:
  backend:        # NestJS API
  postgres:       # PostgreSQL 16
  clickhouse:     # ClickHouse latest
  otel-collector: # OTEL Collector
  prometheus:     # Prometheus
  jaeger:         # Jaeger UI
  grafana:        # Grafana
  portainer:      # Portainer

profiles:
  core:         # Backend, PostgreSQL, ClickHouse
  monitoring:   # OTEL, Jaeger, Prometheus, Grafana
  tools:        # Portainer
  all:          # Everything

networks:
  telemetryflow_core_net:
    subnet: 172.151.151.0/24

volumes:
  vol_postgres_data:
  vol_clickhouse_data:
  vol_clickhouse_logs:
  vol_prometheus_data:
  vol_grafana_data:
  vol_portainer:
```

**Differences**:
- ❌ No Redis
- ❌ No NATS
- ❌ No Loki
- ❌ No OpenSearch
- ❌ No Fluent Bit
- ❌ No pgAdmin
- ❌ No frontend
- ✅ Has ClickHouse (audit logs)
- ✅ Has OTEL + Jaeger (tracing)
- ✅ Has Prometheus + Grafana (metrics)
- ✅ Has Portainer (management)
- ✅ Docker profiles for flexible deployment
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

### Core (`config/`)
```
config/
├── clickhouse/
│   ├── migrations/
│   └── README.md
├── otel/
│   ├── otel-collector-config.yaml
│   └── README.md
├── prometheus/
│   ├── prometheus.yml
│   └── README.md
├── postgresql/
│   └── README.md
└── README.md
```

**Reason**: Core includes ClickHouse for audit logs and observability stack (OTEL, Prometheus).

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
    "@clickhouse/client": "^1.7.0",
    "@opentelemetry/*": "8 packages",
    "winston": "^3.18.3",
    "typeorm": "^0.3.27",
    "pg": "^8.16.3",
    "argon2": "^0.44.0",
    // ~30 total
  }
}
```

**Differences**:
- ✅ Has ClickHouse client (audit logs)
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

### Core (.env.example - 100+ lines)
```env
# Application (3 vars)
NODE_ENV=development
PORT=3000
TZ=UTC

# Docker (15 vars)
POSTGRES_VERSION=16-alpine
CLICKHOUSE_VERSION=latest
OTEL_VERSION=0.115.1
PROMETHEUS_VERSION=latest
JAEGER_VERSION=latest
GRAFANA_VERSION=latest
PORTAINER_VERSION=latest
# ...

# PostgreSQL (5 vars)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
# ...

# ClickHouse (5 vars)
CLICKHOUSE_HOST=172.151.151.40
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123

# JWT (3 vars)
JWT_SECRET=...
JWT_EXPIRES_IN=24h
SESSION_SECRET=...

# OTEL (3 vars)
OTEL_ENABLED=true
OTEL_SERVICE_NAME=telemetryflow-core
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Logging (3 vars)
LOG_LEVEL=info
LOG_PRETTY_PRINT=true
LOGGER_TYPE=winston
```

**Differences**:
- Platform: ~100+ variables
- Core: ~40 variables
- ✅ Includes ClickHouse config
- ✅ Includes OTEL config
- ✅ Much simpler than Platform

---

## Modules

### Platform Backend (25+ modules)
```
backend/src/modules/
├── iam/                # Identity & Access Management
├── auth/               # Authentication
├── mfa/                # Multi-Factor Authentication
├── sso/                # Single Sign-On
├── audit/              # Audit Logging
├── telemetry/          # Telemetry Data (Metrics, Logs, Traces)
├── alerts/             # Alert Management
├── dashboard/          # Dashboard Management
├── monitoring/         # Uptime Monitoring
├── agent/              # Agent Management
├── aggregation/        # Data Aggregation
├── cache/              # Caching Layer
├── queue/              # Queue Management
├── messaging/          # NATS Messaging
├── email/              # Email Service
├── cors/               # CORS Configuration
├── api-keys/           # API Key Management
├── retention-policy/   # Data Retention
├── export/             # Data Export
├── query-builder/      # Query Builder
├── status-page/        # Status Page
├── subscription/       # Subscription Management
├── platform/           # Platform Management
├── ui/                 # UI Configuration
├── alertrule-group/    # Alert Rule Groups
└── notification-group/ # Notification Groups
```

### Core (2 modules)
```
src/modules/
├── iam/              # Identity & Access Management
└── audit/            # Audit Logging (ClickHouse)
```

**Differences**:
- Platform: 25+ modules
- Core: 2 modules
- ✅ Focused on IAM + Audit only

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
  - IAM data (users, roles, permissions)
  - Tenants, Organizations, Workspaces
  - Regions
  - Groups

ClickHouse:
  - Audit logs (IAM audit trail)
  - Application logs (optional)
  - Metrics (optional)
  - Traces (optional)
```

**Differences**:
- ✅ Has ClickHouse for audit logs
- ❌ No telemetry data storage
- ❌ No monitoring data
- ✅ Only IAM + Audit data

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
bootstrap.sh                    # Simple setup (200 lines)
export-swagger-docs.sh          # Export OpenAPI spec
generate-secrets.ts             # Generate JWT/Session secrets
```

**Database Scripts** (`src/database/`):
```bash
postgres/migrations/run-migrations.ts
postgres/seeds/run-seeds.ts
clickhouse/migrations/run-migrations.ts
clickhouse/seeds/run-seeds.ts
```

**Differences**:
- Platform: 40+ scripts
- Core: 3 main scripts + 4 database scripts
- ✅ Minimal but complete
- ✅ Separate PostgreSQL and ClickHouse scripts

---

## Features Comparison

| Feature | Platform | Core |
|---------|----------|------|
| **IAM** | ✅ Full | ✅ Full (Identical) |
| **5-Tier RBAC** | ✅ Yes | ✅ Yes |
| **Multi-Tenancy** | ✅ Yes | ✅ Yes |
| **Authentication** | ✅ JWT + OAuth + SSO | ✅ JWT only |
| **MFA** | ✅ TOTP + SMS | ❌ No |
| **Audit Logs** | ✅ Full (ClickHouse) | ✅ Full (ClickHouse) |
| **Telemetry** | ✅ Metrics, Logs, Traces | ❌ No |
| **Dashboards** | ✅ Yes | ❌ No |
| **Alerts** | ✅ Yes | ❌ No |
| **Monitoring** | ✅ Uptime checks | ❌ No |
| **Agents** | ✅ Yes | ❌ No |
| **Caching** | ✅ L1 + L2 (Redis) | ❌ No |
| **Queues** | ✅ BullMQ (5 queues) | ❌ No |
| **Aggregations** | ✅ Hourly/Daily | ❌ No |
| **API Keys** | ✅ Yes | ❌ No |
| **SSO** | ✅ SAML, OAuth | ❌ No |
| **Email** | ✅ Nodemailer | ❌ No |
| **Frontend** | ✅ Vue 3 | ❌ No |
| **Swagger** | ✅ Yes | ✅ Yes |
| **OpenTelemetry** | ✅ Full stack | ✅ Basic tracing |
| **Winston Logging** | ✅ + Transports | ✅ Console + File |
| **Prometheus** | ✅ Yes | ✅ Yes |
| **Jaeger** | ✅ Yes | ✅ Yes |
| **Grafana** | ✅ Yes | ✅ Yes |

---

## Size Comparison

| Metric | Platform | Core |
|--------|----------|------|
| **Total Files** | 3000+ | 200+ |
| **Lines of Code** | 150,000+ | 15,000+ |
| **Dependencies** | 150+ | 40+ |
| **Docker Services** | 15+ | 8 |
| **Config Files** | 50+ | 15+ |
| **Scripts** | 40+ | 7 |
| **Modules** | 25+ | 2 |
| **Database Tables** | 50+ | 13 (PG) + 12 (CH) |
| **API Endpoints** | 200+ | 50+ |
| **node_modules** | ~500MB | ~200MB |
| **Docker Images** | ~5GB | ~2GB |

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
# Development (core only)
docker-compose --profile core up -d
pnpm run dev

# Development (with monitoring)
docker-compose --profile core --profile monitoring up -d
pnpm run dev

# Development (all services)
docker-compose --profile all up -d
pnpm run dev

# Production
docker-compose --profile all up -d
pnpm run build
pnpm run start
```

**Differences**:
- Core: Uses Docker profiles for flexible deployment
- Core: Can run minimal (core) or full (all) stack
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
- ClickHouse: $50-150/month (smaller dataset)
- Prometheus: $20-50/month (optional)
- Load Balancer: $20-50/month (optional)
Total: $100-400/month
```

**Savings**: 60-75% infrastructure cost

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
