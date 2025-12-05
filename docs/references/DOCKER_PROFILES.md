# Docker Compose Profiles

## Available Profiles

### `core` - Core Application Services
Essential services for running the application:
- **backend** - NestJS API
- **postgres** - PostgreSQL database
- **clickhouse** - ClickHouse (audit logs)

### `monitoring` - Observability Stack
Full monitoring and tracing infrastructure:
- **otel-collector** - OpenTelemetry Collector
- **jaeger** - Distributed tracing UI
- **prometheus** - Metrics storage
- **grafana** - SPM dashboards

### `tools` - Management Tools
Container management:
- **portainer** - Docker UI

### `all` - All Services
Runs everything (default behavior without profiles)

## Usage

### Start Core Services Only
```bash
docker-compose --profile core up -d
```

### Start Core + Monitoring
```bash
docker-compose --profile core --profile monitoring up -d
```

### Start Everything
```bash
docker-compose --profile all up -d
# or
docker-compose up -d
```

### Start Specific Combinations
```bash
# Core + Tools
docker-compose --profile core --profile tools up -d

# Monitoring only (requires core to be running)
docker-compose --profile monitoring up -d
```

## Service Dependencies

```
core (backend, postgres, clickhouse)
  ↓
monitoring (otel-collector, jaeger, prometheus, grafana)
  ↓
tools (portainer)
```

**Note**: Monitoring services depend on core services. Start core first.

## Examples

### Development (Minimal)
```bash
# Just the application
docker-compose --profile core up -d
```

### Development (With Monitoring)
```bash
# Application + full observability
docker-compose --profile core --profile monitoring up -d
```

### Production
```bash
# Everything
docker-compose --profile all up -d
```

### Testing
```bash
# Core only for integration tests
docker-compose --profile core up -d
```

## Check Running Services

```bash
# List all services
docker-compose ps

# List services by profile
docker-compose --profile core ps
docker-compose --profile monitoring ps
```

## Stop Services

```bash
# Stop specific profile
docker-compose --profile monitoring down

# Stop all
docker-compose down
```

## Environment Variables

All profiles use the same `.env` file. Configure once, use everywhere.

## Profile Matrix

| Service | core | monitoring | tools | all |
|---------|------|------------|-------|-----|
| backend | ✓ | | | ✓ |
| postgres | ✓ | | | ✓ |
| clickhouse | ✓ | | | ✓ |
| otel-collector | | ✓ | | ✓ |
| jaeger | | ✓ | | ✓ |
| prometheus | | ✓ | | ✓ |
| grafana | | ✓ | | ✓ |
| portainer | | | ✓ | ✓ |
