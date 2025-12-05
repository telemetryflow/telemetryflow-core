<div align="center">
  <img src="assets/tfo-logo-light.svg#gh-light-mode-only" alt="TelemetryFlow Logo" width="600">
  <img src="assets/tfo-logo-dark.svg#gh-dark-mode-only" alt="TelemetryFlow Logo" width="600">
</div>

# TelemetryFlow Core v1.1.1 - Release Notes

**Release Date**: December 4, 2025

## 🎉 What's New

### 🔧 Database Migration Fixes

Fixed critical issues with database migrations and seeds:

- **PostgreSQL migration glob pattern** fixed to exclude non-migration files
- **ClickHouse authentication** now properly loads from .env
- **Database cleanup script** for easy testing and re-seeding

### 🗑️ Database Cleanup

New cleanup script for development workflow:

```bash
# Clean all databases
pnpm db:cleanup

# Or run directly
bash scripts/db-cleanup.sh
```

**Features:**
- Drops all PostgreSQL tables and recreates schema
- Drops all ClickHouse tables and views
- Safe for development environment
- Fast and reliable

## 🔧 What's Fixed

### Migration Issues

#### PostgreSQL Migrations
**Problem**: Duplicate migration detection error
**Cause**: Glob pattern `*.ts` matched `index.ts` and `run-migrations.ts`
**Solution**: Changed to `[0-9]*.ts` to only match numbered migration files

```typescript
// Before
migrations: ['src/database/postgres/migrations/*.ts']

// After
migrations: ['src/database/postgres/migrations/[0-9]*.ts']
```

#### ClickHouse Authentication
**Problem**: "REQUIRED_PASSWORD" error
**Cause**: Environment variables not loaded before connection
**Solution**: Added `dotenv` config to migration and seed runners

```typescript
import { config } from 'dotenv';
config(); // Load .env before accessing process.env
```

### Documentation Updates

Updated all database documentation:
- ✅ `src/database/postgres/migrations/README.md` - New commands and troubleshooting
- ✅ `src/database/postgres/seeds/README.md` - Updated commands
- ✅ `src/database/clickhouse/migrations/README.md` - Actual file names (001-004)
- ✅ `src/database/clickhouse/seeds/README.md` - Actual file names (001-003)
- ✅ Root `README.md` - Added `db:cleanup` command

## 📚 Documentation

### New Files
- `scripts/db-cleanup.sh` - Database cleanup automation

### Updated Files
- All migration and seed README files
- Root README with new commands
- CHANGELOG with v1.1.1 entry

## 🚀 Quick Start

### Clean and Reset Database

```bash
# 1. Clean databases
pnpm db:cleanup

# 2. Run migrations
pnpm db:migrate

# 3. Run seeds
pnpm db:seed

# Or do all at once
pnpm db:cleanup && pnpm db:migrate:seed
```

### Verify Setup

```bash
# Check PostgreSQL tables
docker exec telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "\dt"

# Check ClickHouse tables
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetryflow_db"
```

## 🔗 Related Documentation

- [Database README](../src/database/README.md) - Database structure
- [PostgreSQL Migrations](../src/database/postgres/migrations/README.md) - Migration guide
- [ClickHouse Migrations](../src/database/clickhouse/migrations/README.md) - ClickHouse setup
- [CHANGELOG.md](../CHANGELOG.md) - Complete changelog

## 🎊 Contributors

Thanks to the team for quickly addressing these critical database issues!

---

**Previous Release**: [v1.1.0](./RELEASE_NOTES_v1.1.0.md)
**Next Release**: [v1.1.2](./RELEASE_NOTES_v1.1.2.md)

**Built with ❤️ by DevOpsCorner Indonesia**
