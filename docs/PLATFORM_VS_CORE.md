# Platform vs Core Comparison

## Overview

Comparison between **TelemetryFlow Platform** (Monolith) and **TelemetryFlow Core** v1.4.0 (Full-Stack Monorepo).

---

## Architecture

| Aspect        | Platform                      | Core                          |
| ------------- | ----------------------------- | ----------------------------- |
| **Type**      | Monolith (Backend + Frontend) | Full-Stack Monorepo           |
| **Modules**   | 25+ modules                   | 13 modules                    |
| **Databases** | PostgreSQL + ClickHouse       | PostgreSQL + ClickHouse       |
| **Caching**   | Redis (3 DBs)                 | Redis (cache + BullMQ queues) |
| **Messaging** | NATS JetStream                | NATS JetStream                |
| **Frontend**  | Vue 3 + Vite                  | Vue 3 + Vite                  |
| **Monorepo**  | Turborepo                     | pnpm workspaces + Turborepo   |

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
  "version": "1.4.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "bootstrap": "bash backend/scripts/bootstrap.sh"
  }
}
```

**Workspace packages**:

- `@telemetryflow/backend` — NestJS API (`backend/`)
- `@telemetryflow/viz` — Vue 3 + Vite frontend (`frontend/`)

---

## Docker Compose

### Platform (800+ lines)

```yaml
services:
  backend: # NestJS API
  frontend: # Vue 3 UI
  postgres: # PostgreSQL 15
  clickhouse: # ClickHouse 23
  redis: # Redis 7
  nats: # NATS 2.10
  prometheus: # Prometheus
  otel-collector: # OTEL Collector
  loki: # Grafana Loki
  opensearch: # OpenSearch
  fluentbit: # Fluent Bit
  pgadmin: # pgAdmin 4
  portainer: # Portainer
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

### Core

```yaml
services:
  backend: # NestJS API
  frontend: # Vue 3 + Vite UI
  postgres: # PostgreSQL 16
  clickhouse: # ClickHouse latest
  redis: # Redis 7 (cache + BullMQ queues)
  nats: # NATS JetStream
  portainer: # Portainer

networks:
  telemetryflow_core_net:
    subnet: 172.154.0.0/16

volumes:
  vol_postgres_data:
  vol_clickhouse_data:
  vol_clickhouse_logs:
  vol_redis_data:
  vol_nats_data:
  vol_portainer:
```

**Differences**:

- ✅ Has Frontend service (Vue 3 + Vite)
- ✅ Has Redis (cache + BullMQ queues)
- ✅ Has NATS JetStream
- ❌ No Loki, OpenSearch, Fluent Bit
- ❌ No pgAdmin, Prometheus, OTEL Collector (as separate services)
- ✅ Same dual database (PostgreSQL + ClickHouse)
- ✅ Container names: `telemetryflow_core_*`
- ✅ Different subnet: 172.154.0.0/16 (no conflicts)

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

```dockerfile
FROM node:22-alpine AS builder
# Multi-stage build
# Backend + Frontend
# Production optimized
```

Both use identical multi-stage build patterns.

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
├── redis/
│   └── redis.conf
├── nats/
│   └── nats.conf
├── postgresql/
│   └── README.md
└── README.md
```

**Reason**: Core includes configs for all its infrastructure (ClickHouse, Redis, NATS, PostgreSQL).

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
    "winston-elasticsearch": "^0.19.0"
    // + 100+ more
  }
}
```

### Core Backend

```json
{
  "dependencies": {
    "@nestjs/*": "30+ packages",
    "@clickhouse/client": "^1.7.0",
    "redis": "^5.10.0",
    "ioredis": "^5.8.2",
    "nats": "^2.29.3",
    "bullmq": "^5.65.0",
    "@opentelemetry/*": "8+ packages",
    "winston": "^3.18.3",
    "typeorm": "^0.3.27",
    "pg": "^8.16.3",
    "argon2": "^0.44.0"
    // ~80 total
  }
}
```

### Core Frontend

```json
{
  "dependencies": {
    "vue": "^3.x",
    "vue-router": "^4.x",
    "pinia": "^2.x"
    // Vue 3 + Vite stack
  }
}
```

**Differences**:

- ✅ Has ClickHouse client (audit logs + query)
- ✅ Has Redis clients (cache + queues)
- ✅ Has NATS (messaging)
- ✅ Has BullMQ (job queues)
- ❌ No Winston transports for Loki/OpenSearch
- ✅ Fewer packages than Platform overall

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

### Core (.env.example - 300+ lines)

```env
# Application
NODE_ENV=development
PORT=3000
TZ=UTC

# Docker
POSTGRES_VERSION=16-alpine
CLICKHOUSE_VERSION=latest
REDIS_VERSION=7-alpine
NATS_VERSION=2.10-alpine
PORTAINER_VERSION=latest

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
# ...

# ClickHouse
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_DB=telemetryflow_db
# ...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# ...

# NATS
NATS_URL=nats://localhost:4222
# ...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=24h
SESSION_SECRET=...

# Logging
LOG_LEVEL=info
LOG_PRETTY_PRINT=true
LOGGER_TYPE=winston
```

**Differences**:

- Platform: ~100+ variables
- Core: ~80 variables
- ✅ Includes Redis config (cache + queues)
- ✅ Includes NATS config (messaging)
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

### Core (13 modules)

```
backend/src/modules/
├── iam/              # Identity & Access Management
├── auth/             # Authentication
├── sso/              # Single Sign-On (SAML, OAuth2)
├── api-keys/         # API Key Management
├── audit/            # Audit Logging (ClickHouse)
├── tenancy/          # Multi-Tenancy Management
├── alerting/         # Alert Rules Engine (TFQL)
├── query/            # Query Service
├── llm/              # AI Assistant (LLM Integration)
├── notification/     # Notification Service
├── data-masking/     # Data Masking
├── cache/            # Caching Layer
└── retention/        # Data Retention Policies
```

**Differences**:

- Platform: 25+ modules (telemetry ingestion, dashboards, agents, monitoring, etc.)
- Core: 13 modules (IAM, security, alerting, AI, tenancy, retention)
- ✅ Focused on identity, access, and platform management
- ❌ No telemetry ingestion, dashboards, monitoring, or agent modules

---

## Frontend

### Platform

Full observability UI with dashboards, telemetry viewers, monitoring, agent management, etc.

### Core

Focused management UI with the following sidebar navigation:

| Section     | Description                        |
| ----------- | ---------------------------------- |
| **Home**    | Overview Dashboard                 |
| **Alert**   | Alert Management                   |
| **IAM**     | Identity & Access                  |
| **Tenancy** | Multi-Tenancy Management           |
| **System**  | Setup, Channels, AI, Keys, Retention |
| **Account** | Account Settings                   |

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
  - SSO configurations (SAML, OAuth2)
  - API keys
  - Alert rules
  - Notification settings
  - Data masking policies
  - Audit logs (metadata)

ClickHouse:
  - Audit logs (full audit trail)
  - Alert history
  - Query results
```

**Differences**:

- ✅ Same dual-database architecture (PostgreSQL + ClickHouse)
- ❌ No telemetry data storage
- ❌ No monitoring/uptime data
- ✅ Focused on IAM, tenancy, alerting, and audit data

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

### Core (`backend/scripts/`)

```bash
bootstrap.sh                    # Setup script
export-swagger-docs.sh          # Export OpenAPI spec
generate-secrets.ts             # Generate JWT/Session secrets
# + database scripts
```

**Database Scripts** (`backend/src/database/`):

```bash
postgres/migrations/run-migrations.ts
postgres/seeds/run-seeds.ts
clickhouse/migrations/run-migrations.ts
clickhouse/seeds/run-seeds.ts
```

**Differences**:

- Platform: 40+ scripts
- Core: Focused set of essential scripts
- ✅ Complete database migration & seed support
- ✅ Separate PostgreSQL and ClickHouse scripts

---

## Features Comparison

| Feature             | Platform                 | Core                       |
| ------------------- | ------------------------ | -------------------------- |
| **IAM**             | ✅ Full                  | ✅ Full (Identical)        |
| **5-Tier RBAC**     | ✅ Yes                   | ✅ Yes                     |
| **Multi-Tenancy**   | ✅ Yes                   | ✅ Yes                     |
| **Authentication**  | ✅ JWT + OAuth + SSO     | ✅ JWT + SSO (SAML/OAuth2) |
| **MFA**             | ✅ TOTP + SMS            | ❌ No                      |
| **Audit Logs**      | ✅ Full (ClickHouse)     | ✅ Full (ClickHouse)       |
| **Telemetry**       | ✅ Metrics, Logs, Traces | ❌ No                      |
| **Dashboards**      | ✅ Yes                   | ❌ No                      |
| **Alerts**          | ✅ Yes                   | ✅ Alert Rules (TFQL)      |
| **Monitoring**      | ✅ Uptime checks         | ❌ No                      |
| **Agents**          | ✅ Yes                   | ❌ No                      |
| **Caching**         | ✅ L1 + L2 (Redis)       | ✅ Redis                   |
| **Queues**          | ✅ BullMQ (5 queues)     | ✅ BullMQ                  |
| **Aggregations**    | ✅ Hourly/Daily          | ✅ Hourly/Daily            |
| **API Keys**        | ✅ Yes                   | ✅ Yes                     |
| **SSO**             | ✅ SAML, OAuth           | ✅ SAML, OAuth2            |
| **AI Assistant**    | ✅ LLM Integration       | ✅ LLM Integration         |
| **Data Masking**    | ✅ Yes                   | ✅ Yes                     |
| **Notification**    | ✅ Yes                   | ✅ Yes                     |
| **Email**           | ✅ Nodemailer            | ❌ No                      |
| **Frontend**        | ✅ Vue 3                 | ✅ Vue 3 + Vite            |
| **Swagger**         | ✅ Yes                   | ✅ Yes                     |
| **OpenTelemetry**   | ✅ Full stack            | ✅ Basic tracing           |
| **Winston Logging** | ✅ + Transports          | ✅ Console + File          |
| **NATS Messaging**  | ✅ JetStream             | ✅ JetStream               |

---

## Size Comparison

| Metric              | Platform | Core              |
| ------------------- | -------- | ----------------- |
| **Total Files**     | 3000+    | 800+              |
| **Lines of Code**   | 150,000+ | 50,000+           |
| **Dependencies**    | 150+     | 100+              |
| **Docker Services** | 15+      | 7                 |
| **Config Files**    | 50+      | 20+               |
| **Scripts**         | 40+      | 10+               |
| **Modules**         | 25+      | 12                |
| **Packages**        | 1        | 2 (backend + viz) |
| **API Endpoints**   | 200+     | 100+              |
| **node_modules**    | ~500MB   | ~350MB            |
| **Docker Images**   | ~5GB     | ~3GB              |

---

## Performance

| Aspect           | Platform    | Core       |
| ---------------- | ----------- | ---------- |
| **Startup Time** | 10-15s      | 5-8s       |
| **Memory Usage** | 500MB-1GB   | 200-400MB  |
| **CPU Usage**    | Medium-High | Medium-Low |
| **Disk Space**   | 5-10GB      | 2-4GB      |
| **Build Time**   | 2-3 min     | 1-2 min    |

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

- ✅ IAM + security service with UI
- ✅ Authentication, authorization & SSO
- ✅ User & tenant management
- ✅ Multi-tenant SaaS (IAM layer)
- ✅ Alerting with TFQL rules engine
- ✅ AI Assistant (LLM integration)
- ✅ API key management
- ✅ Data masking & compliance
- ✅ Notification service
- ✅ Microservice architecture

---

## Migration Path

### From Core to Platform

1. **Add telemetry modules**:

   ```bash
   cp -r platform/backend/src/modules/telemetry core/backend/src/modules/
   ```

2. **Add observability stack**:

   ```bash
   # Add Loki, OpenSearch, Fluent Bit to docker-compose.yml
   ```

3. **Add Platform-specific modules**:

   ```bash
   cp -r platform/backend/src/modules/dashboard core/backend/src/modules/
   cp -r platform/backend/src/modules/monitoring core/backend/src/modules/
   cp -r platform/backend/src/modules/agent core/backend/src/modules/
   # etc.
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

- Core: Single docker-compose setup (7 services)
- Core: pnpm workspaces manage backend + frontend
- Core: Simpler, fewer services to manage

---

## Maintenance

### Platform

- **Complexity**: High
- **Updates**: Multiple services (15+)
- **Monitoring**: Required
- **Backups**: PostgreSQL + ClickHouse
- **Scaling**: Horizontal + Vertical

### Core

- **Complexity**: Medium
- **Updates**: Multiple services (7)
- **Monitoring**: Optional
- **Backups**: PostgreSQL + ClickHouse
- **Scaling**: Horizontal + Vertical

---

## Cost Comparison

### Platform (Production)

```
Infrastructure:
- PostgreSQL: $50-200/month
- ClickHouse: $100-500/month
- Redis: $20-100/month
- NATS: $20-50/month
- Monitoring (Prometheus/Loki/etc): $50-200/month
- Load Balancer: $20-50/month
Total: $260-1100/month
```

### Core (Production)

```
Infrastructure:
- PostgreSQL: $50-200/month
- ClickHouse: $50-150/month (smaller dataset)
- Redis: $20-50/month
- NATS: $20-50/month
- Load Balancer: $20-50/month
Total: $160-500/month
```

**Savings**: 50-60% infrastructure cost

---

## When to Use

### Use Platform When:

- ✅ Need full observability
- ✅ Collecting telemetry data
- ✅ Need monitoring & alerts
- ✅ Enterprise requirements
- ✅ Complete solution needed

### Use Core When:

- ✅ Need IAM with a management UI
- ✅ Need SSO (SAML, OAuth2)
- ✅ Need alerting with custom rules (TFQL)
- ✅ Need AI Assistant (LLM)
- ✅ Need API key management
- ✅ Need data masking for compliance
- ✅ Building microservices
- ✅ Cost-sensitive
- ✅ Focused requirements

---

## Summary

| Aspect          | Platform           | Core                | Winner   |
| --------------- | ------------------ | ------------------- | -------- |
| **Features**    | Complete           | IAM + Security + AI | Platform |
| **Complexity**  | High               | Medium              | Core     |
| **Cost**        | High               | Medium              | Core     |
| **Maintenance** | Complex            | Moderate            | Core     |
| **Performance** | Heavy              | Medium              | Core     |
| **Scalability** | Horizontal         | Horizontal          | Tie      |
| **Use Case**    | Full observability | IAM & platform mgmt | Depends  |

---

## Conclusion

**TelemetryFlow Platform**: Full-featured observability platform for enterprises with telemetry ingestion, dashboards, monitoring, and agents.

**TelemetryFlow Core v1.4.0**: Full-stack IAM & platform management service with Vue 3 frontend, alerting engine, AI assistant, SSO, data masking, and notification capabilities.

Both share the same IAM implementation (DDD + CQRS + 5-Tier RBAC), making Core a focused subset of Platform with unique features like LLM integration and data masking.
