# Database Structure

## Overview

TelemetryFlow Core uses two databases:
- **PostgreSQL**: IAM data (users, roles, permissions, tenants, organizations, workspaces)
- **ClickHouse**: Audit logs (high-volume time-series data)

## Directory Structure

```
src/database/
├── postgres/
│   ├── migrations/
│   │   ├── 1704240000000-CreateIAMTables.ts
│   │   └── README.md
│   └── seeds/
│       ├── 001-iam-data.seed.ts
│       ├── 001-iam-roles-permissions.seed.ts
│       ├── 002-auth-test-users.seed.ts
│       ├── index.ts
│       └── run-seeds.ts
├── clickhouse/
│   ├── migrations/
│   │   ├── 001-audit-logs.sql
│   │   └── run-migrations.sh
│   └── seeds/
│       ├── 001-sample-audit-logs.sql
│       └── README.md
├── config/                  # Database configuration
├── typeorm.config.ts        # TypeORM configuration
└── verify-migrations.sh     # Idempotency verification
```

## PostgreSQL

### Migrations

**Available Migrations:**
- `1704240000000-CreateIAMTables.ts` - Creates all IAM tables (12 tables)

**Run Migrations:**
```bash
# Run all pending migrations
pnpm run migration:run

# Generate new migration
pnpm run migration:generate -- src/database/postgres/migrations/MigrationName

# Revert last migration
pnpm run migration:revert
```

**Tables Created:**
- `regions`, `organizations`, `workspaces`, `tenants`
- `users`, `roles`, `permissions`, `groups`
- `user_roles`, `user_permissions`, `role_permissions`, `user_groups`

**Idempotency:** ✅ All migrations use `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
# All seeds
pnpm run db:seed

# IAM only
pnpm run db:seed:iam
```

**Seed Files:**
- `001-iam-data.seed.ts` - Regions, organizations, workspaces, tenants
- `001-iam-roles-permissions.seed.ts` - Permissions and roles (5-tier RBAC)
- `002-auth-test-users.seed.ts` - Default test users

## ClickHouse

### Migrations

**Available Migrations:**
- `001-audit-logs.sql` - Audit logs table with indexes and materialized views

**Run Migrations:**
```bash
# Using Docker
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/migrations/001-audit-logs.sql

# Or using script
bash src/database/clickhouse/migrations/run-migrations.sh
```

**Schema Created:**
- `audit_logs` table (MergeTree engine, 90-day TTL)
- 6 indexes (bloom_filter, set)
- 2 materialized views (stats, user activity)

**Idempotency:** ✅ Uses `IF NOT EXISTS` - safe to run multiple times

### Seeds

**Run Seeds:**
```bash
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/seeds/001-sample-audit-logs.sql
```

**Seed Files:**
- `001-sample-audit-logs.sql` - 12 sample audit log entries (AUTH, AUTHZ, DATA, SYSTEM)

### Connection

ClickHouse connection is configured in `.env`:
```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetryflow_db
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
```

## Quick Start

### 1. Start Databases
```bash
docker-compose up -d postgres clickhouse
```

### 2. Run PostgreSQL Migrations & Seeds
```bash
# Run migrations (if needed)
pnpm run migration:run

# Seed IAM data
pnpm run db:seed:iam
```

### 3. Run ClickHouse Migrations & Seeds
```bash
# Run migration
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/migrations/001-audit-logs.sql

# Load sample data
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/seeds/001-sample-audit-logs.sql
```

### 4. Verify Setup
```bash
# PostgreSQL - Check tables
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"

# ClickHouse - Check audit logs
docker exec -it telemetryflow_core_clickhouse clickhouse-client --query "SELECT count() FROM telemetryflow_db.audit_logs"
```

## Migration Idempotency

All migrations are idempotent and safe to run multiple times:

```bash
# Verify idempotency
./src/database/verify-migrations.sh
```

**PostgreSQL:** Uses `IF NOT EXISTS` for tables, indexes, and extensions
**ClickHouse:** Uses `IF NOT EXISTS` for database, tables, indexes, and views

## Default Users (5-Tier RBAC)

Created by `002-auth-test-users.seed.ts`:

| Email | Password | Role | Tier |
|-------|----------|------|------|
| superadmin.telemetryflow@telemetryflow.id | SuperAdmin@123456 | Super Administrator | 1 |
| administrator.telemetryflow@telemetryflow.id | Admin@123456 | Administrator | 2 |
| developer.telemetryflow@telemetryflow.id | Developer@123456 | Developer | 3 |
| viewer.telemetryflow@telemetryflow.id | Viewer@123456 | Viewer | 4 |
| demo.telemetryflow@telemetryflow.id | Demo@123456 | Demo | 5 |

## Documentation

- [PostgreSQL Migrations](./postgres/migrations/README.md)
- [ClickHouse Seeds](./clickhouse/seeds/README.md)
- [TypeORM Configuration](./typeorm.config.ts)
