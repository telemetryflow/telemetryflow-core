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
│   │   ├── 001-audit-logs.sql
│   │   └── run-migrations.sh
│   └── seeds/
│       ├── 001-sample-audit-logs.sql
│       └── README.md
├── config/
│   ├── database.config.ts
│   └── index.ts
├── postgres/
│   ├── migrations/
│   │   ├── 1704240000000-CreateIAMTables.ts
│   │   └── README.md
│   └── seeds/
│       ├── 001-iam-roles-permissions.seed.ts
│       ├── 002-iam-data.seed.ts
│       ├── 003-auth-test-users.seed.ts
│       ├── 004-groups.seed.ts
│       ├── index.ts
│       ├── run-seeds.ts
│       └── README.md
├── typeorm.config.ts        # TypeORM configuration
├── verify-migrations.sh     # Migration idempotency check
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

**Available Migrations:**
- `1704240000000-CreateIAMTables.ts` - Creates all IAM tables

**Run Migrations:**
```bash
# Run all pending migrations
pnpm run migration:run

# Generate new migration
pnpm run migration:generate -- src/database/postgres/migrations/MigrationName

# Revert last migration
pnpm run migration:revert
```

**Idempotency:** ✅ All migrations use `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
# All seeds (recommended)
pnpm run db:seed:iam

# Or manually
ts-node src/database/postgres/seeds/run-seeds.ts
```

**Seed Files:**
1. `001-iam-roles-permissions.seed.ts` - Permissions and roles (5-tier RBAC)
2. `002-iam-data.seed.ts` - Regions, tenants, organizations, workspaces
3. `003-auth-test-users.seed.ts` - Default test users with roles
4. `004-groups.seed.ts` - Sample user groups

**Default Data Created:**
- 1 Region: `ap-southeast-3` (Asia Pacific Jakarta)
- 1 Tenant: `TelemetryFlow`
- 1 Organization: `DevOpsCorner`
- 1 Workspace: `Production`
- 22+ Permissions
- 5 Roles (Super Admin, Administrator, Developer, Viewer, Demo)
- 5 Test Users

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

**Run Migrations:**
```bash
# Using Docker
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Or using script
bash config/clickhouse/migrations/run-migrations.sh
```

**Idempotency:** ✅ Uses `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/seeds/001-sample-audit-logs.sql
```

**Sample Data:**
- 12 audit log entries (AUTH, AUTHZ, DATA, SYSTEM events)

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
docker-compose up -d postgres clickhouse
```

### 2. Run PostgreSQL Migrations & Seeds
```bash
# Migrations run automatically with synchronize: true in development
# Or manually:
pnpm run migration:run

# Seed IAM data
pnpm run db:seed:iam
```

### 3. Run ClickHouse Migrations
```bash
# Run migration
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Optional: Load sample data
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/seeds/001-sample-audit-logs.sql
```

### 4. Verify Setup
```bash
# PostgreSQL - Check tables
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_core -c "\dt"

# PostgreSQL - Check users
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_core -c "SELECT email, first_name, last_name FROM users;"

# ClickHouse - Check audit logs table
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetryflow_db"

# ClickHouse - Check audit logs count
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SELECT count() FROM telemetryflow_db.audit_logs"
```

## Default Users (5-Tier RBAC)

Created by `003-auth-test-users.seed.ts`:

| Email | Password | Role | Tier | Permissions |
|-------|----------|------|------|-------------|
| superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | Super Administrator | 1 | All (22+) |
| administrator.telemetryflow@telemetryflow.id | Admin@123456 | Administrator | 2 | Full CRUD in org |
| developer.telemetryflow@telemetryflow.id | Developer@123456 | Developer | 3 | Create/Read/Update |
| viewer.telemetryflow@telemetryflow.id | Viewer@123456 | Viewer | 4 | Read-only |
| demo.telemetryflow@telemetryflow.id | Demo@123456 | Demo | 5 | Demo org only |

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

**Last Updated**: 2025-12-03
