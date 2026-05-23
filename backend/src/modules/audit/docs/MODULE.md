# Audit Module

**Version**: 1.0.0
**Type**: Core Security Module
**Status**: Production Ready

---

## Module Overview

The Audit module provides comprehensive audit logging for the TelemetryFlow Platform, tracking all security-relevant events including authentication, authorization, data operations, and system events.

### Features

- **Event Logging**: Capture all security-relevant events
- **ClickHouse Storage**: High-performance time-series storage
- **Request Interception**: Automatic audit logging via interceptor
- **Multi-tenancy Support**: Organization and tenant-level tracking
- **Statistics & Analytics**: Aggregated views for monitoring
- **Export Capability**: Export audit logs for compliance

---

## Architecture

```
audit/
├── docs/
│   ├── MODULE.md
│   ├── ERD.md
│   ├── DFD.md
│   └── api/
│       └── openapi.yaml
├── infrastructure/
│   └── persistence/
│       ├── migrations/
│       │   └── clickhouse/
│       │       └── 1709000000001-CreateAuditLogsTable.ts
│       └── seeds/
│           └── clickhouse/
├── audit.controller.ts
├── audit.service.ts
├── audit.interceptor.ts
├── audit.module.ts
└── index.ts
```

---

## Database Storage

### ClickHouse Table

| Table | Description |
|-------|-------------|
| `audit_logs` | Main audit log storage |
| `audit_logs_stats` | Materialized view for statistics |
| `audit_logs_user_activity` | Materialized view for user activity |
| `audit_logs_org_activity` | Materialized view for organization activity |

---

## Event Types

| Type | Code | Description |
|------|------|-------------|
| AUTH | 1 | Authentication events (login, logout, failed attempts) |
| AUTHZ | 2 | Authorization events (access granted/denied) |
| DATA | 3 | Data operations (create, update, delete) |
| SYSTEM | 4 | System events (configuration changes, errors) |

## Event Results

| Result | Code | Description |
|--------|------|-------------|
| SUCCESS | 1 | Operation completed successfully |
| FAILURE | 2 | Operation failed due to error |
| DENIED | 3 | Operation denied due to authorization |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/audit/logs` | List audit logs |
| GET | `/api/v2/audit/logs/:id` | Get audit log by ID |
| GET | `/api/v2/audit/logs/count` | Count total logs |
| GET | `/api/v2/audit/logs/statistics` | Get aggregated statistics |
| GET | `/api/v2/audit/logs/export` | Export logs |

---

## Service Methods

### Core Logging

| Method | Description |
|--------|-------------|
| `log()` | Create a general audit log |
| `logAuth()` | Log authentication event |
| `logAuthz()` | Log authorization event |
| `logData()` | Log data operation event |
| `logSystem()` | Log system event |

### Querying

| Method | Description |
|--------|-------------|
| `query()` | Query audit logs with filters |
| `getById()` | Get single audit log by ID |
| `count()` | Count total logs |
| `getStatistics()` | Get aggregated statistics |
| `export()` | Export logs for compliance |

---

## Interceptor Usage

The `AuditInterceptor` automatically logs all HTTP requests:

```typescript
@UseInterceptors(AuditInterceptor)
@Controller('resource')
export class ResourceController {
  // All requests will be audited
}
```

---

## Retention Policy

- Default TTL: 90 days
- Partition: Monthly (YYYYMM)
- Compliance: Configurable per organization

---

## Related Documentation

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [DFD.md](./DFD.md) - Data Flow Diagram
- [api/openapi.yaml](./api/openapi.yaml) - OpenAPI Specification
