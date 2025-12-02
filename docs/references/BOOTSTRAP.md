# Bootstrap & Data Generation

## Overview

TelemetryFlow Core includes scripts for easy setup and sample data generation, similar to the platform.

## Scripts

### 1. bootstrap.sh - Full Setup
Complete initialization script that handles everything.

**Usage:**
```bash
# Full bootstrap
bash scripts/bootstrap.sh

# Bootstrap and start dev server
bash scripts/bootstrap.sh --dev

# Skip Docker (if already running)
bash scripts/bootstrap.sh --skip-docker

# Skip seeding (if already seeded)
bash scripts/bootstrap.sh --skip-seed
```

**What it does:**
1. ✅ Checks dependencies (Node.js, pnpm, Docker)
2. ✅ Installs npm packages
3. ✅ Starts PostgreSQL with Docker Compose
4. ✅ Waits for database to be ready
5. ✅ Seeds IAM data
6. ✅ Shows system status
7. ✅ Optionally starts dev server

**Options:**
- `--skip-docker` - Skip Docker startup
- `--skip-seed` - Skip database seeding
- `--dev` - Start development server after setup
- `--help` - Show help message

### 2. seed.ts - Database Seeding
Main seeding orchestrator.

**Usage:**
```bash
pnpm run db:seed
```

**What it seeds:**
- Tenants
- Organizations
- Workspaces
- Regions
- Users (admin, users)
- Roles (admin, user, viewer)
- Permissions
- Groups

### 3. seed-iam.ts - IAM-Only Seeding
Direct IAM seeding (same as platform).

**Usage:**
```bash
pnpm run db:seed:iam
```

### 4. generate-sample-data.sh - Sample Data Generator
Creates additional test data.

**Usage:**
```bash
# Generate 10 records (default)
bash scripts/generate-sample-data.sh

# Generate 50 records
bash scripts/generate-sample-data.sh --count 50

# Or via npm
pnpm run db:generate-sample --count 100
```

**What it generates:**
- Additional users
- Additional roles
- Additional permissions

### 5. generate-sample-iam-data.ts - Sample Data Script
TypeScript implementation of sample data generation.

**Usage:**
```bash
ts-node scripts/generate-sample-iam-data.ts --count=50
```

## Quick Start Examples

### First Time Setup
```bash
# Clone and setup
git clone <repo>
cd telemetryflow-core
bash scripts/bootstrap.sh --dev
```

### Reset Everything
```bash
# Stop and remove containers
docker-compose down -v

# Bootstrap from scratch
bash scripts/bootstrap.sh --dev
```

### Add Sample Data
```bash
# After initial setup
pnpm run db:generate-sample --count 100
```

### Development Workflow
```bash
# Day 1: Full setup
bash scripts/bootstrap.sh --dev

# Day 2+: Just start
pnpm run dev

# Need fresh data?
pnpm run db:seed:iam
```

## Comparison with Platform

| Feature | Platform | Core |
|---------|----------|------|
| **bootstrap.sh** | ✅ Full (15+ services) | ✅ Minimal (PostgreSQL only) |
| **seed.ts** | ✅ Multi-database | ✅ PostgreSQL only |
| **seed-iam.ts** | ✅ Identical | ✅ Identical |
| **generate-sample-data.sh** | ✅ Telemetry data | ✅ IAM data |
| **ClickHouse init** | ✅ Yes | ❌ No |
| **Redis check** | ✅ Yes | ❌ No |
| **NATS check** | ✅ Yes | ❌ No |

## Bootstrap Script Features

### ✅ Included
- Dependency checking (Node.js, pnpm, Docker)
- Package installation
- Docker Compose startup
- PostgreSQL health check
- Database seeding
- Status summary
- Development server start

### ❌ Not Included (Platform Only)
- ClickHouse initialization
- Redis health check
- NATS health check
- Prometheus check
- OTEL Collector check
- Migration runner
- CSS build step
- Volume setup script

## Sample Data

### Default Seed Data
```
Tenants:        1 (ACME Corp)
Organizations:  1 (Engineering)
Workspaces:     1 (Production)
Regions:        3 (us-east-1, eu-west-1, ap-southeast-1)
Users:          3 (admin, user1, user2)
Roles:          3 (admin, user, viewer)
Permissions:    10+ (CRUD operations)
Groups:         2 (Admins, Developers)
```

### Generated Sample Data
```bash
# Generate 50 records
pnpm run db:generate-sample --count 50

Creates:
- 50 users (user1@example.com ... user50@example.com)
- 17 roles (sample_role_1 ... sample_role_17)
- 25 permissions (sample:permission:1 ... sample:permission:25)
```

## Environment Variables

Bootstrap script uses these from .env:

```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=telemetryflow_core
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres
```

## Troubleshooting

### Bootstrap Fails
```bash
# Check dependencies
node --version
pnpm --version
docker --version

# Check .env exists
ls -la .env

# Run with verbose output
bash -x scripts/bootstrap.sh
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Seeding Fails
```bash
# Check database exists
docker-compose exec postgres psql -U postgres -l

# Drop and recreate
docker-compose down -v
docker-compose up -d
sleep 5
pnpm run db:seed:iam
```

### Sample Data Generation Fails
```bash
# Ensure seed ran first
pnpm run db:seed:iam

# Then generate samples
pnpm run db:generate-sample --count 10
```

## Advanced Usage

### Custom Bootstrap
```bash
# Skip everything, just check deps
bash scripts/bootstrap.sh --skip-docker --skip-seed

# Only seed, no Docker
bash scripts/bootstrap.sh --skip-docker

# Full setup for production
bash scripts/bootstrap.sh
pnpm run build
pnpm run start
```

### Automated CI/CD
```yaml
# .github/workflows/test.yml
- name: Bootstrap
  run: bash scripts/bootstrap.sh --skip-docker
  
- name: Run tests
  run: pnpm run test
```

### Docker-only Setup
```bash
# Start PostgreSQL
docker-compose up -d

# Wait for ready
sleep 5

# Seed
pnpm run db:seed:iam

# Start app
pnpm run dev
```

## Best Practices

1. **First Time**: Use `bootstrap.sh --dev` for complete setup
2. **Daily Dev**: Just use `pnpm run dev`
3. **Fresh Data**: Run `pnpm run db:seed:iam` anytime
4. **Testing**: Generate sample data with `--count` parameter
5. **CI/CD**: Use `--skip-docker` flag

## Performance

Bootstrap script is fast:
- Dependency check: < 1s
- Package install: 10-30s (first time), < 1s (cached)
- Docker startup: 5-10s
- Database seed: 2-5s
- **Total**: ~20-50s first time, ~10s subsequent runs

## Summary

✅ **bootstrap.sh** - One command to rule them all
✅ **seed.ts** - Orchestrates all seeding
✅ **seed-iam.ts** - IAM data (identical to platform)
✅ **generate-sample-data.sh** - Quick test data generation
✅ **Simple & Fast** - Minimal but complete

The bootstrap process is **production-ready** and **fully compatible** with the platform workflow!
