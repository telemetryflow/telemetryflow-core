# BDD Testing - Quick Start Guide

Run automated BDD tests for TelemetryFlow Core IAM API using Newman.

## Prerequisites

```bash
# Install Newman
npm install -g newman newman-reporter-htmlextra

# Start backend
docker-compose up -d backend

# Verify backend is running
curl http://localhost:3000/health
```

## Run Tests

### All Tests
```bash
pnpm test:bdd
```

### Specific Module
```bash
pnpm test:bdd:users      # Users module
pnpm test:bdd:roles      # Roles module
```

### With Options
```bash
pnpm test:bdd:verbose    # Detailed output
bash docs/postman/run-bdd-tests.sh --bail  # Stop on failure
```

## Test Reports

Reports are auto-generated in `docs/postman/reports/`:

```bash
# View latest HTML report
open docs/postman/reports/report-*.html
```

## Test Coverage

- **33 BDD scenarios** covering all IAM endpoints
- **100% API coverage** matching Swagger documentation
- **Given-When-Then** format for clear test intent

## Example Output

```
╔════════════════════════════════════════════════════════════════╗
║         TelemetryFlow Core - BDD API Tests (Newman)           ║
╚════════════════════════════════════════════════════════════════╝

✓ Newman installed
✓ Backend is running

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Running BDD Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collection:  TelemetryFlow Core - IAM.postman_collection.json
Environment: TelemetryFlow Core - Local.postman_environment.json

→ Health Check
  GET http://localhost:3000/health [200 OK, 245B, 15ms]
  ✓ Status code is 200
  ✓ Response contains status ok

→ Get All Users
  GET http://localhost:3000/api/v2/users [200 OK, 1.2KB, 45ms]
  ✓ Status code is 200
  ✓ Response is an array
  ✓ Users have required fields

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All tests passed!

Reports generated:
  HTML: docs/postman/reports/report-20251203_214500.html
  JSON: docs/postman/reports/report-20251203_214500.json
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run BDD Tests
  run: pnpm test:bdd
```

### GitLab CI
```yaml
test:
  script:
    - pnpm test:bdd
  artifacts:
    paths:
      - docs/postman/reports/
```

## Troubleshooting

### Backend Not Running
```bash
docker-compose up -d backend
sleep 10
```

### Newman Not Found
```bash
npm install -g newman newman-reporter-htmlextra
```

### View Detailed Logs
```bash
pnpm test:bdd:verbose
```

---

**See Also:**
- [BDD_TESTS.md](./BDD_TESTS.md) - Complete test scenarios
- [README.md](./README.md) - Postman collection documentation
