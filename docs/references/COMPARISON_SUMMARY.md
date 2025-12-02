# Quick Comparison: Platform vs Core

## At a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                  TELEMETRYFLOW PLATFORM                     │
│                     (Monolith)                              │
├─────────────────────────────────────────────────────────────┤
│ Backend (NestJS)                                            │
│   ├── 25+ Modules                                           │
│   ├── PostgreSQL + ClickHouse                               │
│   ├── Redis + NATS                                          │
│   └── Full Observability Stack                              │
│                                                             │
│ Frontend (Vue 3)                                            │
│   └── Complete UI                                           │
│                                                             │
│ Infrastructure                                              │
│   ├── 15+ Docker Services                                   │
│   ├── Monitoring Stack                                      │
│   └── 50+ Config Files                                      │
└─────────────────────────────────────────────────────────────┘

                            VS

┌─────────────────────────────────────────────────────────────┐
│                   TELEMETRYFLOW CORE                        │
│                  (IAM-Only Backend)                         │
├─────────────────────────────────────────────────────────────┤
│ Backend (NestJS)                                            │
│   ├── 1 Module (IAM)                                        │
│   ├── PostgreSQL Only                                       │
│   └── Basic OTEL Tracing                                    │
│                                                             │
│ Infrastructure                                              │
│   ├── 1 Docker Service                                      │
│   └── Minimal Config                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences

### Size
- **Platform**: 3000+ files, 150K+ LOC, 150+ deps
- **Core**: 200+ files, 15K+ LOC, 30+ deps
- **Reduction**: 90%

### Services
- **Platform**: 15+ (Backend, Frontend, PostgreSQL, ClickHouse, Redis, NATS, Prometheus, OTEL, Loki, OpenSearch, FluentBit, pgAdmin, Portainer, etc.)
- **Core**: 1 (PostgreSQL)
- **Reduction**: 93%

### Modules
- **Platform**: 25+ (IAM, Auth, MFA, SSO, Telemetry, Alerts, Dashboard, Monitoring, Agent, etc.)
- **Core**: 1 (IAM)
- **Reduction**: 96%

### Cost
- **Platform**: $260-1100/month
- **Core**: $50-250/month
- **Savings**: 80-90%

### Startup Time
- **Platform**: 10-15 seconds
- **Core**: 2-3 seconds
- **Faster**: 5x

### Memory
- **Platform**: 500MB-1GB
- **Core**: 100-200MB
- **Reduction**: 80%

## What's the Same

✅ **IAM Module**: 100% identical implementation
✅ **5-Tier RBAC**: Same role hierarchy
✅ **DDD Architecture**: Same patterns
✅ **CQRS**: Same implementation
✅ **Multi-Tenancy**: Same structure
✅ **Swagger**: Both have API docs
✅ **OpenTelemetry**: Both support OTEL
✅ **Winston Logging**: Both use Winston

## What's Different

### Platform Has (Core Doesn't)
❌ Frontend (Vue 3)
❌ ClickHouse (telemetry storage)
❌ Redis (caching)
❌ NATS (messaging)
❌ BullMQ (queues)
❌ Telemetry module
❌ Alerts module
❌ Dashboard module
❌ Monitoring module
❌ 24+ other modules

### Core Has (Platform Doesn't)
✅ Simpler deployment
✅ Lower resource usage
✅ Faster startup
✅ Easier maintenance
✅ Lower cost

## Decision Matrix

### Choose Platform If:
- Need full observability platform
- Collecting telemetry data
- Need monitoring & alerts
- Enterprise requirements
- Complete solution needed

### Choose Core If:
- Only need IAM/Auth
- Building microservices
- Learning DDD/CQRS
- Cost-sensitive
- Simple deployment
- Focused requirements

## Migration

### Core → Platform
Easy! Just add modules and services.

### Platform → Core
Already done! This is it.

## Bottom Line

**Platform** = Full-featured enterprise observability platform
**Core** = Lightweight IAM service

Both share the same IAM foundation, making Core a perfect 10% subset of Platform.
