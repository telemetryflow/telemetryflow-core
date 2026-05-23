# Retention Module

## Overview

The Retention module manages data lifecycle and retention policies for telemetry data (logs, metrics, traces, alerts, exemplars) in the TelemetryFlow Platform. It provides configurable policies for automatic data cleanup and optional archiving.

## Features

- **Retention Policies**: Define how long data should be kept for each data type
- **Per-Organization Policies**: Override default policies at the organization level
- **Automatic Enforcement**: Scheduled cleanup of old data based on policies
- **Archive Support**: Optional archiving to external storage before deletion
- **Dry Run Mode**: Preview what data would be deleted without actually deleting
- **Statistics & Reporting**: View data volumes and retention status

## Architecture

The module follows Domain-Driven Design (DDD) with CQRS pattern:

```
retention/
├── domain/
│   ├── aggregates/
│   │   └── RetentionPolicy.ts       # Main aggregate
│   ├── events/
│   │   ├── RetentionPolicyCreated.event.ts
│   │   ├── RetentionPolicyUpdated.event.ts
│   │   └── RetentionPolicyDeleted.event.ts
│   └── repositories/
│       └── IRetentionPolicyRepository.ts
├── application/
│   ├── commands/
│   │   ├── CreateRetentionPolicy.command.ts
│   │   ├── UpdateRetentionPolicy.command.ts
│   │   ├── DeleteRetentionPolicy.command.ts
│   │   └── EnforceRetention.command.ts
│   ├── queries/
│   │   ├── GetRetentionPolicy.query.ts
│   │   ├── ListRetentionPolicies.query.ts
│   │   └── GetRetentionStatistics.query.ts
│   ├── handlers/
│   ├── dto/
│   └── services/
│       └── RetentionEnforcement.service.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── entities/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── repositories/
│   └── schedulers/
│       └── RetentionEnforcement.scheduler.ts
└── presentation/
    ├── controllers/
    │   └── RetentionPolicy.controller.ts
    └── dto/
```

## Data Types

The module manages retention for the following data types:

| Data Type | Default Retention | Storage |
|-----------|-------------------|---------|
| logs | 30 days | ClickHouse |
| metrics | 90 days | ClickHouse |
| traces | 14 days | ClickHouse |
| alerts | 365 days | PostgreSQL |
| exemplars | 7 days | ClickHouse |

## API Endpoints

### Retention Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/retention/policies` | Create retention policy |
| GET | `/api/v2/retention/policies` | List retention policies |
| GET | `/api/v2/retention/policies/:id` | Get retention policy |
| PUT | `/api/v2/retention/policies/:id` | Update retention policy |
| DELETE | `/api/v2/retention/policies/:id` | Delete retention policy |
| POST | `/api/v2/retention/policies/:id/activate` | Activate policy |
| POST | `/api/v2/retention/policies/:id/deactivate` | Deactivate policy |

### Statistics & Enforcement

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/retention/policies/statistics` | Get retention statistics |
| POST | `/api/v2/retention/policies/enforce` | Manually enforce retention |

## Scheduled Tasks

| Schedule | Task | Description |
|----------|------|-------------|
| Daily at 2:00 AM UTC | `handleDailyRetention` | Main retention enforcement |
| Every hour | `handleHourlyCheck` | Quick check for urgent cleanup |
| Weekly | `handleWeeklyReport` | Generate retention report |

## Configuration

```env
# Enable/disable retention scheduler
RETENTION_SCHEDULER_ENABLED=true
```

## Usage Examples

### Create a Custom Retention Policy

```typescript
// POST /api/v2/retention/policies
{
  "name": "Production Logs 60 Days",
  "description": "Extended retention for production logs",
  "dataType": "logs",
  "retentionDays": 60,
  "archiveEnabled": true,
  "archiveDestination": "s3://my-bucket/archives/logs",
  "filters": {
    "env": "production"
  }
}
```

### Get Retention Statistics

```typescript
// GET /api/v2/retention/policies/statistics?dataType=logs
{
  "dataType": "logs",
  "totalRecords": 1500000,
  "oldestRecord": "2026-01-01T00:00:00Z",
  "newestRecord": "2026-01-31T12:00:00Z",
  "estimatedSize": "2.5 GB",
  "retentionPolicy": {
    "name": "Default Logs Retention",
    "retentionDays": 30,
    "cutoffDate": "2026-01-01T00:00:00Z"
  },
  "recordsToDelete": 50000,
  "estimatedSizeToDelete": "85 MB"
}
```

### Enforce Retention (Dry Run)

```typescript
// POST /api/v2/retention/policies/enforce
{
  "dataType": "logs",
  "dryRun": true
}

// Response
[{
  "dataType": "logs",
  "recordsDeleted": 50000,
  "spaceReclaimed": "85 MB",
  "duration": 1234,
  "dryRun": true
}]
```

## Security

- All endpoints require JWT authentication
- Users can only manage policies for their organization
- Default (global) policies cannot be modified or deleted
- Admin role required for manual enforcement

## Related Documentation

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [DFD.md](./DFD.md) - Data Flow Diagram
- [api/openapi.yaml](./api/openapi.yaml) - OpenAPI Specification
