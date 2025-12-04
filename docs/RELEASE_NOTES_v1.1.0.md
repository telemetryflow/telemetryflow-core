<div align="center">
  <img src="assets/tfo-logo-light.svg#gh-light-mode-only" alt="TelemetryFlow Logo" width="300">
  <img src="assets/tfo-logo-dark.svg#gh-dark-mode-only" alt="TelemetryFlow Logo" width="300">
</div>

# TelemetryFlow Core v1.1.0 - Release Notes

**Release Date**: December 3, 2025

## 🎉 What's New

### 🧪 BDD Testing Automation

Complete automated testing suite using Newman with Behavior-Driven Development approach:

- **33 BDD test scenarios** covering all IAM endpoints
- **Given-When-Then format** for clear test intent
- **100% API coverage** (54 requests across 10 modules)
- **HTML & JSON reports** with interactive dashboard
- **CI/CD ready** with GitHub Actions and GitLab CI examples

**Quick Start:**
```bash
# Run all BDD tests
pnpm test:bdd

# Run specific module
pnpm test:bdd:users
pnpm test:bdd:roles

# With detailed output
pnpm test:bdd:verbose
```

**Documentation:**
- [BDD_TESTS.md](./docs/postman/BDD_TESTS.md) - Complete test scenarios
- [QUICK_START_BDD.md](./docs/postman/QUICK_START_BDD.md) - Quick reference

### 📊 Enhanced Database Management

Improved migration and seed scripts with detailed logging:

- **Boxed headers** for clear visual separation
- **Progress counters** showing [1/3], [2/3], etc.
- **Configuration display** (container, database, host)
- **Step-by-step execution** logs
- **Success/failure indicators** with clear messages

**New Commands:**
```bash
pnpm db:migrate              # Run all migrations (PostgreSQL + ClickHouse)
pnpm db:migrate:seed         # Run migrations + seeds (full setup)
pnpm db:seed                 # Seed all data (both databases)
```

### 🔧 Improved Developer Experience

**Organized Package.json Scripts:**
- Grouped by category (Development, Database, Testing, Docker)
- Consistent naming following Platform structure
- Added `docker:*` commands for container management
- Added `clean` command for cleanup

**Fixed Bootstrap Script:**
- ✅ Fixed ClickHouse health check timeout
- ✅ Updated endpoint paths to match Swagger
- ✅ Added `/metrics` endpoint
- ✅ Added Groups and Regions endpoints
- ✅ Improved CLICKHOUSE_HOST display

## 📦 Installation

### Upgrade from v1.0.0

```bash
# Pull latest changes
git pull origin main

# Install dependencies (if needed)
pnpm install

# Run migrations and seeds
pnpm db:migrate:seed

# Restart services
docker-compose restart backend
```

### Fresh Installation

```bash
# Clone repository
git clone <repository-url>
cd telemetryflow-core

# Run bootstrap
pnpm bootstrap

# Start development
pnpm dev
```

## 🧪 Testing

### BDD Test Coverage

| Module         | Scenarios | Requests | Coverage |
|----------------|-----------|----------|----------|
| Health         | 2         | 4        | 100%     |
| Users          | 7         | 14       | 100%     |
| Roles          | 5         | 9        | 100%     |
| Permissions    | 2         | 3        | 100%     |
| Organizations  | 3         | 4        | 100%     |
| Tenants        | 2         | 3        | 100%     |
| Workspaces     | 2         | 3        | 100%     |
| Groups         | 4         | 8        | 100%     |
| Regions        | 2         | 3        | 100%     |
| Audit          | 4         | 5        | 100%     |
| **Total**      | **33**    | **56**   | **100%** |

### Run Tests

```bash
# All tests
pnpm test:bdd

# Specific module
bash docs/postman/run-bdd-tests.sh --folder Users

# With options
bash docs/postman/run-bdd-tests.sh --verbose --bail
```

## 📝 Documentation Updates

- ✅ Updated README.md with BDD testing section
- ✅ Updated README.md with complete script list
- ✅ Added BDD_TESTS.md with 33 test scenarios
- ✅ Added QUICK_START_BDD.md for quick reference
- ✅ Updated Postman README with automation instructions
- ✅ Updated CHANGELOG.md with v1.1.0 changes

## 🐛 Bug Fixes

- Fixed ClickHouse health check timeout in bootstrap script
- Fixed endpoint paths to match Swagger documentation
- Fixed CLICKHOUSE_HOST display value
- Improved migration and seed script error handling

## 🔄 Breaking Changes

None. This is a backward-compatible release.

## 📊 Metrics

- **Version**: 1.1.0
- **BDD Scenarios**: 33
- **API Coverage**: 100%
- **Test Reports**: HTML + JSON
- **Documentation Files**: 3 new files
- **Scripts Added**: 7 new commands

## 🚀 Next Steps

After upgrading:

1. **Run BDD tests** to verify your setup:
   ```bash
   pnpm test:bdd
   ```

2. **Check test reports**:
   ```bash
   open docs/postman/reports/report-*.html
   ```

3. **Review new endpoints**:
   - Groups: `/api/v2/iam/groups`
   - Regions: `/api/v2/iam/regions`
   - Metrics: `/metrics`

## 📚 Resources

- [README.md](./README.md) - Main documentation
- [CHANGELOG.md](./CHANGELOG.md) - Complete changelog
- [BDD_TESTS.md](./docs/postman/BDD_TESTS.md) - BDD test scenarios
- [Postman Collection](./docs/postman/) - API testing

## 🙏 Acknowledgments

Built with ❤️ by DevOpsCorner Indonesia

---

**Full Changelog**: v1.0.0...v1.1.0
