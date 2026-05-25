<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/telemetryflow/.github/raw/main/docs/assets/tfo-logo-core-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/telemetryflow/.github/raw/main/docs/assets/tfo-logo-core-light.svg">
    <img src="https://github.com/telemetryflow/.github/raw/main/docs/assets/tfo-logo-core-light.svg" alt="TelemetryFlow Logo" width="80%">
  </picture>

  <h3>TelemetryFlow Core - IAM, AI Assistant & Audit Platform</h3>

[![Version](https://img.shields.io/badge/Version-1.4.0-orange.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![Vue 3](https://img.shields.io/badge/Vue%203-5.x-4FC08D?logo=vuedotjs)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![ClickHouse](https://img.shields.io/badge/ClickHouse-latest-FFCC00?logo=clickhouse)](https://clickhouse.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![DDD](https://img.shields.io/badge/Architecture-DDD%2FCQRS-blueviolet)](backend/src/modules/iam/)
[![RBAC](https://img.shields.io/badge/Security-5--Tier%20RBAC-red)](README.md#5-tier-rbac-system)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://hub.docker.com/r/telemetryflow/telemetryflow-core)

</div>

---

## Overview

**TelemetryFlow Core** is a full-stack monorepo providing IAM, AI Assistant (LLM), Alerting, Retention, Audit, Tenancy, and System management. Built with NestJS backend and Vue 3 frontend, extracted and adapted from the TelemetryFlow Platform monolith.

## Architecture

### Monorepo Structure (pnpm + Turborepo)

```
telemetryflow-core/
├── backend/                    # NestJS API (@telemetryflow/backend)
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── modules/
│       │   ├── iam/            # Identity & Access Management
│       │   ├── auth/           # Authentication (JWT, MFA, Sessions)
│       │   ├── sso/            # Single Sign-On (SAML, OAuth2)
│       │   ├── api-keys/       # API Key Management
│       │   ├── audit/          # Audit Logging (ClickHouse)
│       │   ├── tenancy/        # Multi-tenancy Management
│       │   ├── alerting/       # Alert Rules Engine
│       │   ├── query/          # TFQL Query Engine
│       │   ├── llm/            # AI Assistant (LLM Integration)
│       │   ├── retention/      # Data Retention Policies
│       │   ├── notification/   # Notification Service
│       │   ├── data-masking/   # Data Masking Policies
│       │   └── cache/          # Caching Service
│       ├── shared/             # Shared utilities (queue, domain primitives)
│       ├── database/           # PostgreSQL + ClickHouse migrations/seeds
│       ├── logger/             # Winston logger module
│       └── otel/               # OpenTelemetry tracing
├── frontend/                   # Vue 3 SPA (@telemetryflow/viz)
│   └── src/
│       ├── views/              # Page components
│       ├── components/         # Reusable components
│       ├── layouts/            # SideNav layout
│       ├── api/                # API client modules
│       ├── store/              # Pinia stores
│       ├── router/             # Vue Router
│       └── composables/        # Vue composables
├── config/                     # Service configs (PostgreSQL, ClickHouse, OTEL)
├── docs/                       # Documentation
├── docker-compose.yml          # Full stack deployment
├── turbo.json                  # Turborepo task config
├── pnpm-workspace.yaml         # Workspace definition
└── package.json                # Root scripts (turbo-based)
```

### Sidebar Navigation (Frontend)

| Section     | Items                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| **Home**    | Overview Dashboard                                                                         |
| **Alert**   | Alerts, Alert Rules                                                                        |
| **IAM**     | Users, Roles, Permissions, Matrix, Groups                                                  |
| **Tenancy** | Tenants, Organizations, Workspaces, Regions                                                |
| **System**  | Setup, Channels, Notifications, AI Assistant, API Keys, PII Masking, Audit Logs, Retention |
| **Account** | Profile, Security, Sessions, Preferences                                                   |

---

## Features

### IAM Module

- **Multi-tenant architecture**: Tenant -> Organization -> Workspace hierarchy
- **User management**: Complete CRUD with role-based access
- **5-Tier RBAC System**: Super Admin, Administrator, Developer, Viewer, Demo
- **Role-Based Access Control**: Hierarchical roles with 22+ permissions
- **Group management**: User groups with permission inheritance
- **Region support**: Multi-region tenant deployment
- **CQRS pattern**: Separate read/write operations (33 commands, 18 queries)
- **Domain events**: Event-driven architecture (25+ events)

### Retention

- **Retention Policies**: Configurable data retention per data type (logs, metrics, traces, audit)
- **Automated Enforcement**: Scheduled cleanup via cron jobs
- **Archive Support**: Optional archival before deletion

### Alerting Module

- **Alert Rules Engine**: Define threshold-based alert rules via TFQL
- **Alert Management**: Real-time alert tracking and history
- **Notification Integration**: Alerts trigger notifications

### AI Assistant (LLM)

- **LLM Integration**: Multi-provider support (OpenAI, Anthropic, etc.)
- **Encrypted Configuration**: Secure API key storage
- **Chat Interface**: AI-powered assistant in the frontend

### Authentication & Security

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **MFA Support**: TOTP-based multi-factor authentication
- **SSO Integration**: SAML and OAuth2 providers
- **API Key Management**: Scoped API keys with permissions
- **Data Masking**: Policy-based data redaction
- **Argon2 Password Hashing**: Industry-standard password security

### Observability

- **Swagger/OpenAPI**: Interactive API documentation at `/api`
- **OpenTelemetry**: Distributed tracing with gRPC exporters
- **Winston Logging**: Structured logging with multiple transports
- **Health Checks**: Built-in health endpoint

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### One-Command Setup

```bash
# Start all services
docker-compose --profile all up -d

# Or start specific profiles
docker-compose --profile core up -d                       # Core only
docker-compose --profile core --profile monitoring up -d  # Core + Monitoring
```

### Docker Profiles

**Available profiles:**

- `core` - Backend, Frontend, PostgreSQL, ClickHouse, Redis, NATS
- `monitoring` - Jaeger
- `tools` - Portainer
- `all` - Everything

See [docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md) for details.

### Manual Setup

```bash
# Clone repository
git clone https://github.com/telemetryflow/telemetryflow-core.git
cd telemetryflow-core

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Generate secrets
pnpm run generate:secrets

# Start infrastructure (PostgreSQL + ClickHouse + Redis + NATS)
docker-compose up -d

# Run migrations and seeds
pnpm run db:migrate:seed

# Start development (backend + frontend)
pnpm run dev
```

## Development

### Available Scripts

```bash
# Development
pnpm dev                  # Start backend + frontend (turbo)
pnpm dev:backend          # Backend only
pnpm dev:frontend         # Frontend only

# Build
pnpm build                # Build all (turbo)
pnpm build:backend        # Backend only
pnpm build:frontend       # Frontend only

# Database
pnpm db:migrate           # Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate:seed      # Run migrations + seeds (full setup)
pnpm db:fresh             # Full reset (cleanup + migrate + seed)
pnpm db:seed              # Seed all data
pnpm db:cleanup           # Clean all databases

# Docker
pnpm docker:up            # Start all containers
pnpm docker:down          # Stop all containers
pnpm docker:logs          # View logs
pnpm docker:clean         # Clean volumes

# Code Quality
pnpm lint                 # Lint backend code
pnpm lint:fix             # Lint and fix

# Security
pnpm generate:secrets     # Generate JWT & Session secrets
```

---

## 5-Tier RBAC System

### Role Hierarchy

1. **Super Administrator** (Global)
   - Platform management across all organizations
   - All permissions

2. **Administrator** (Organization-scoped)
   - Full CRUD within organization
   - Cannot manage platform

3. **Developer** (Organization-scoped)
   - Create/Read/Update (no delete)
   - Cannot manage users/roles

4. **Viewer** (Organization-scoped)
   - Read-only access
   - Cannot modify resources

5. **Demo** (Demo org only)
   - Developer access in demo organization
   - Isolated from production data

### Default Users

| Email                                        | Password          | Role                | Tier |
| -------------------------------------------- | ----------------- | ------------------- | ---- |
| superadmin.telemetryflow@telemetryflow.id    | SuperAdmin@123456 | Super Administrator | 1    |
| administrator.telemetryflow@telemetryflow.id | Admin@123456      | Administrator       | 2    |
| developer.telemetryflow@telemetryflow.id     | Developer@123456  | Developer           | 3    |
| viewer.telemetryflow@telemetryflow.id        | Viewer@123456     | Viewer              | 4    |
| demo.telemetryflow@telemetryflow.id          | Demo@123456       | Demo                | 5    |

---

## API Documentation

Once running, access Swagger UI at: `http://localhost:3000/api`

### Key Endpoints

- **Auth**: `/api/v2/auth` - Login, logout, refresh, MFA
- **Users**: `/api/v2/iam/users` - User management
- **Roles**: `/api/v2/iam/roles` - Role management
- **Permissions**: `/api/v2/iam/permissions` - Permission management
- **Tenants**: `/api/v2/iam/tenants` - Tenant management
- **Organizations**: `/api/v2/iam/organizations` - Organization management
- **Workspaces**: `/api/v2/iam/workspaces` - Workspace management
- **Groups**: `/api/v2/iam/groups` - Group management
- **Regions**: `/api/v2/iam/regions` - Region management
- **API Keys**: `/api/v2/api-keys` - API key management
- **SSO**: `/api/v2/sso` - SSO provider management
- **Audit**: `/api/v2/audit` - Audit log queries
- **Alerts**: `/api/v2/alerting/alerts` - Alert management
- **Alert Rules**: `/api/v2/alerting/alert-rules` - Alert rule management
- **LLM**: `/api/v2/llm` - AI Assistant configuration
- **Data Masking**: `/api/v2/data-masking` - Data masking policies
- **Retention**: `/api/v2/retention` - Data retention policies
- **Health**: `/health` - Health check

---

## Docker Deployment

### Docker Images

| Image                                  | Registry   | Purpose                |
| -------------------------------------- | ---------- | ---------------------- |
| `telemetryflow/telemetryflow-core`     | Docker Hub | NestJS Backend         |
| `telemetryflow/telemetryflow-core-viz` | Docker Hub | Vue 3 Frontend (Nginx) |

### Services

| Service        | IP             | Port(s)   | Purpose           |
| -------------- | -------------- | --------- | ----------------- |
| **Frontend**   | 172.154.154.80 | 8080      | Vue 3 SPA (Nginx) |
| **Backend**    | 172.154.154.10 | 3000      | NestJS API        |
| **PostgreSQL** | 172.154.154.20 | 5432      | IAM + config data |
| **Redis**      | 172.154.154.30 | 6379      | Cache + queues    |
| **NATS**       | 172.154.154.35 | 4222      | Event streaming   |
| **ClickHouse** | 172.154.154.40 | 8123/9000 | Audit logs        |

Network: `172.154.0.0/16`

---

## Technology Stack

### Backend

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL 16 + ClickHouse
- **ORM**: TypeORM 0.3
- **Cache**: Redis 7
- **Messaging**: NATS JetStream
- **Queues**: BullMQ
- **Architecture**: DDD + CQRS
- **API Docs**: Swagger/OpenAPI
- **Logger**: Winston
- **Observability**: OpenTelemetry (OTLP gRPC)
- **Password Hashing**: Argon2

### Frontend

- **Framework**: Vue 3 + Vite
- **State**: Pinia
- **Routing**: Vue Router 4
- **UI**: Custom component library

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **Package Manager**: pnpm (workspaces)
- **Build Orchestration**: Turborepo

---

## Comparison with TelemetryFlow Platform

| Feature                 | Platform                 | Core                          |
| ----------------------- | ------------------------ | ----------------------------- |
| **Modules**             | 25+                      | 13                            |
| **Frontend**            | Full observability UI    | IAM + Alerts + AI Assistant   |
| **Telemetry Ingestion** | Metrics, Logs, Traces    | No                            |
| **Alerts**              | Yes                      | Yes                           |
| **AI Assistant**        | Yes                      | Yes                           |
| **Retention**           | Yes                      | Yes                           |
| **Agent Management**    | Yes                      | No                            |
| **Dashboards**          | Full dashboard builder   | Overview dashboards           |
| **Architecture**        | Monolith                 | Monorepo (Backend + Frontend) |
| **Databases**           | PostgreSQL + ClickHouse  | PostgreSQL + ClickHouse       |
| **Docker Images**       | Backend + Frontend       | Backend + Frontend            |
| **Infrastructure**      | Redis + NATS + Loki + OS | Redis + NATS                  |

See [docs/PLATFORM_VS_CORE.md](./docs/PLATFORM_VS_CORE.md) for detailed comparison.

---

## Documentation

### Core

- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](./SECURITY.md) - Security policy

### Architecture & Setup

- [docs/ARCHITECTURE_DIAGRAMS.md](./docs/ARCHITECTURE_DIAGRAMS.md) - System architecture diagrams
- [docs/CORE_MODULES.md](./docs/CORE_MODULES.md) - Module documentation
- [docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md) - Docker deployment guide
- [docs/PLATFORM_VS_CORE.md](./docs/PLATFORM_VS_CORE.md) - Platform vs Core comparison

### Observability

- [docs/OBSERVABILITY.md](./docs/OBSERVABILITY.md) - Observability features
- [docs/WINSTON_LOGGER.md](./docs/WINSTON_LOGGER.md) - Winston logger documentation
- [docs/CLICKHOUSE_LOGGING.md](./docs/CLICKHOUSE_LOGGING.md) - ClickHouse logging

### Configuration

- [config/README.md](./config/README.md) - All service configurations

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for security policy and vulnerability reporting.

## License

Apache-2.0 License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

Extracted from [TelemetryFlow Platform](https://github.com/telemetryflow/telemetryflow-platform) - Enterprise Telemetry & Observability Platform.

---

**Built with care by Telemetri Data Indonesia**
