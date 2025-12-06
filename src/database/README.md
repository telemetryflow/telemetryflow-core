# Database Structure

## Overview

TelemetryFlow Core uses two databases:
- **PostgreSQL**: IAM data (users, roles, permissions, tenants, organizations, workspaces)
- **ClickHouse**: Audit logs (high-volume time-series data)

## Directory Structure

```
src/database/
├── clickhouse/
│   ├── migrations/
│   │   ├── 1704240000001-CreateAuditLogsTable.ts
│   │   ├── 1704240000002-CreateLogsTable.ts
│   │   ├── 1704240000003-CreateMetricsTable.ts
│   │   ├── 1704240000004-CreateTracesTable.ts
│   │   ├── run-migrations.ts
│   │   ├── index.ts
│   │   └── README.md
│   └── seeds/
│       ├── 1704240000001-seed-sample-audit-logs.ts
│       ├── 1704240000002-seed-sample-logs.ts
│       ├── 1704240000003-seed-sample-metrics.ts
│       ├── 1704240000004-seed-sample-traces.ts
│       ├── run-seeds.ts
│       ├── index.ts
│       └── README.md
├── config/
│   ├── database.config.ts
│   └── index.ts
├── postgres/
│   ├── migrations/
│   │   ├── 1704240000000-InitialSchema.ts
│   │   ├── 1704240000001-CreateRegionsTable.ts
│   │   ├── 1704240000002-CreateOrganizationsTable.ts
│   │   ├── 1704240000003-CreateWorkspacesTable.ts
│   │   ├── 1704240000004-CreateTenantsTable.ts
│   │   ├── 1704240000005-CreateGroupsTable.ts
│   │   ├── 1704240000006-CreateUsersTable.ts
│   │   ├── 1704240000007-CreateRBACTables.ts
│   │   ├── 1704240000008-CreateJunctionTables.ts
│   │   ├── run-migrations.ts
│   │   ├── index.ts
│   │   └── README.md
│   └── seeds/
│       ├── 1704240000001-seed-iam-roles-permissions.ts
│       ├── 1704240000002-seed-auth-test-users.ts
│       ├── 1704240000003-seed-groups.ts
│       ├── run-seeds.ts
│       ├── index.ts
│       └── README.md
├── typeorm.config.ts        # TypeORM configuration
└── README.md
```

## PostgreSQL

### Schema

**IAM Tables (13 tables):**
- `regions` - Geographic regions (ap-southeast-3, etc.)
- `tenants` - Top-level tenant organizations
- `organizations` - Business units within tenants
- `workspaces` - Project workspaces within organizations
- `users` - User accounts with profiles
- `roles` - Role definitions (5-tier RBAC)
- `permissions` - Permission definitions (22+ permissions)
- `groups` - User groups
- `user_roles` - User-Role assignments
- `user_permissions` - Direct user-permission assignments
- `role_permissions` - Role-Permission mappings
- `user_groups` - User-Group memberships
- `group_permissions` - Group-Permission mappings

### Migrations

**Available Migrations (9 files):**
1. `1704240000000-InitialSchema.ts` - UUID extension setup
2. `1704240000001-CreateRegionsTable.ts` - Geographic regions
3. `1704240000002-CreateOrganizationsTable.ts` - Organizations
4. `1704240000003-CreateWorkspacesTable.ts` - Workspaces
5. `1704240000004-CreateTenantsTable.ts` - Tenants
6. `1704240000005-CreateGroupsTable.ts` - User groups
7. `1704240000006-CreateUsersTable.ts` - User accounts
8. `1704240000007-CreateRBACTables.ts` - Roles and permissions
9. `1704240000008-CreateJunctionTables.ts` - Many-to-many relationships

**Run Migrations:**
```bash
# Run all PostgreSQL migrations
pnpm db:migrate:postgres

# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Run migrations + seeds
pnpm db:migrate:seed
```

**Idempotency:** ✅ All migrations use `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
# All PostgreSQL seeds (recommended)
pnpm db:seed:postgres

# Or use alias
pnpm db:seed:iam

# Run all seeds (PostgreSQL + ClickHouse)
pnpm db:seed

# Run migrations + seeds
pnpm db:migrate:seed
```

**Seed Files (3 files):**
1. `1704240000001-seed-iam-roles-permissions.ts` - Regions, organizations, workspaces, tenants, permissions, roles
2. `1704240000002-seed-auth-test-users.ts` - 5 test users (one per RBAC tier)
3. `1704240000003-seed-groups.ts` - 4 sample user groups

**Default Data Created:**
- 1 Region: `ap-southeast-3` (Asia Pacific Jakarta)
- 1 Tenant: `TelemetryFlow`
- 1 Organization: `DevOpsCorner`
- 1 Workspace: `Production`
- 22+ Permissions (IAM operations)
- 5 Roles (Super Admin, Administrator, Developer, Viewer, Demo)
- 5 Test Users (one per role)
- 4 Groups (Engineering, DevOps, Management, Demo Users)

## ClickHouse

### Schema

**Audit Logs Table:**
```sql
CREATE TABLE IF NOT EXISTS telemetryflow_db.audit_logs (
    id UUID DEFAULT generateUUIDv4(),
    timestamp DateTime64(3) DEFAULT now64(3),
    user_id Nullable(String),
    user_email Nullable(String),
    event_type Enum8('AUTH'=1, 'AUTHZ'=2, 'DATA'=3, 'SYSTEM'=4),
    action String,
    resource Nullable(String),
    result Enum8('SUCCESS'=1, 'FAILURE'=2, 'DENIED'=3),
    ip_address Nullable(String),
    user_agent Nullable(String),
    metadata String DEFAULT '{}',
    error_message Nullable(String),
    tenant_id Nullable(String),
    organization_id Nullable(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_type, user_id)
TTL timestamp + INTERVAL 90 DAY;
```

**Indexes:**
- `idx_user_id` - Bloom filter on user_id
- `idx_event_type` - Set index on event_type
- `idx_result` - Set index on result
- `idx_tenant` - Bloom filter on tenant_id
- `idx_organization` - Bloom filter on organization_id
- `idx_action` - Bloom filter on action

**Materialized Views:**
- `audit_logs_stats_mv` - Event statistics by type and result
- `audit_logs_user_activity_mv` - User activity aggregations

### Migrations

**Available Migrations (4 files):**
1. `1704240000001-CreateAuditLogsTable.ts` - Audit logs with materialized views
2. `1704240000002-CreateLogsTable.ts` - Application logs with error tracking
3. `1704240000003-CreateMetricsTable.ts` - Metrics with 1m/1h aggregations
4. `1704240000004-CreateTracesTable.ts` - Distributed traces with statistics

**Run Migrations:**
```bash
# Run all ClickHouse migrations
pnpm db:migrate:clickhouse

# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Run migrations + seeds
pnpm db:migrate:seed
```

**Idempotency:** ✅ Uses `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
# Run all ClickHouse seeds
pnpm db:seed:clickhouse

# Run all seeds (PostgreSQL + ClickHouse)
pnpm db:seed

# Run migrations + seeds
pnpm db:migrate:seed
```

**Seed Files (4 files):**
1. `1704240000001-seed-sample-audit-logs.ts` - 5 sample audit log entries
2. `1704240000002-seed-sample-logs.ts` - Sample application logs
3. `1704240000003-seed-sample-metrics.ts` - 240 sample metrics (last 1 hour)
4. `1704240000004-seed-sample-traces.ts` - 30 trace spans (10 complete traces)

**Sample Data:**
- 5 audit log entries (AUTH, AUTHZ, DATA, SYSTEM events)
- Application logs with different severity levels
- 240 metrics (CPU, memory, HTTP requests, response times)
- 10 complete distributed traces (3 spans each)

### Connection

ClickHouse connection is configured in `.env`:
```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

## Audit Logging

### Automatic Audit Capture

All API requests are automatically captured by the **AuditInterceptor**:

```typescript
// src/modules/audit/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  // Captures every API request/response
  // Logs: method, URL, user, IP, result, errors
}
```

**Registered globally in `app.module.ts`:**
```typescript
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: AuditInterceptor,
  }
]
```

**What's Logged:**
- ✅ All API requests (GET, POST, PUT, PATCH, DELETE)
- ✅ User context (userId, email, tenantId, organizationId)
- ✅ Request details (method, URL, IP, user-agent)
- ✅ Result (SUCCESS/FAILURE)
- ✅ Error messages (if failed)

**Current Implementation:**
- Logs to Winston (console/file)
- Ready for ClickHouse integration

**To Enable ClickHouse Persistence:**
Update `src/modules/audit/audit.service.ts` to insert into ClickHouse instead of just logging.

## Quick Start

### 1. Start Databases
```bash
# Start core services (PostgreSQL + ClickHouse)
docker-compose --profile core up -d

# Or start all services
docker-compose --profile all up -d
```

### 2. Run Migrations
```bash
# Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate

# Or run separately
pnpm db:migrate:postgres
pnpm db:migrate:clickhouse
```

### 3. Seed Data
```bash
# Seed all databases (PostgreSQL + ClickHouse)
pnpm db:seed

# Or run separately
pnpm db:seed:postgres  # or pnpm db:seed:iam
pnpm db:seed:clickhouse
```

### 4. Verify Setup
```bash
# PostgreSQL - Check tables
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"

# PostgreSQL - Check users
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "SELECT email, first_name, last_name FROM users;"

# ClickHouse - Check tables
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetryflow_db"

# ClickHouse - Check audit logs count
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SELECT count() FROM telemetryflow_db.audit_logs"
```

### 5. One-Command Setup
```bash
# Run migrations + seeds in one command
pnpm db:migrate:seed
```

## Default Users (5-Tier RBAC)

Created by `1704240000002-seed-auth-test-users.ts`:

| Email | Password | Role | Tier | Permissions |
|-------|----------|------|------|-------------|
| superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | Super Administrator | 1 | All (22+) |
| administrator.telemetryflow@telemetryflow.id | Admin@123456 | Administrator | 2 | Full CRUD in org |
| developer.telemetryflow@telemetryflow.id | Developer@123456 | Developer | 3 | Create/Read/Update |
| viewer.telemetryflow@telemetryflow.id | Viewer@123456 | Viewer | 4 | Read-only |
| demo.telemetryflow@telemetryflow.id | Demo@123456 | Demo | 5 | Demo org only |

⚠️ **Change these passwords in production!**

## API Endpoints

### Audit Logs API

Access audit logs via REST API:

```bash
# Get audit logs
GET /api/v2/audit/logs?limit=50&offset=0

# Get audit log by ID
GET /api/v2/audit/logs/:id

# Get audit count
GET /api/v2/audit/count

# Get audit statistics
GET /api/v2/audit/statistics

# Export audit logs
GET /api/v2/audit/export?format=csv
```

## Troubleshooting

### PostgreSQL Issues

**Connection refused:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

**Tables not created:**
```bash
# Check if migrations ran
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_core -c "\dt"

# Run migrations manually
pnpm run migration:run
```

**Seed fails:**
```bash
# Check if data already exists
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_core -c "SELECT count(*) FROM users;"

# Seeds are idempotent - safe to re-run
pnpm run db:seed:iam
```

### ClickHouse Issues

**Connection refused:**
```bash
docker-compose ps clickhouse
docker-compose logs clickhouse
```

**Table not found:**
```bash
# Check if migration ran
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetryflow_db"

# Run migration
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql
```

**No audit logs:**
```bash
# Check if audit interceptor is working
docker-compose logs backend | grep Audit

# Make an API request
curl http://localhost:3000/api/v2/users

# Check logs again
docker-compose logs backend | grep Audit
```

## Documentation

- [PostgreSQL Migrations](./postgres/migrations/README.md)
- [PostgreSQL Seeds](./postgres/seeds/README.md)
- [ClickHouse Seeds](./clickhouse/seeds/README.md)
- [TypeORM Configuration](./typeorm.config.ts)
- [Audit Module](../modules/audit/README.md)
- [IAM Module](../modules/iam/README.md)

## Updates

- ✅ PostgreSQL schema with 13 IAM tables
- ✅ ClickHouse audit logs with MergeTree engine
- ✅ Automatic audit capture via AuditInterceptor
- ✅ 5-tier RBAC with 22+ permissions
- ✅ Idempotent migrations and seeds
- ✅ Default test users for all roles
- ✅ REST API for audit log access

---

**Last Updated**: 2025-12-06
