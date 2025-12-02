# Docker Setup Complete ✅

## What Was Added

### 1. ClickHouse Service
**File**: `docker-compose.yml`

Added ClickHouse service with:
- HTTP port: 8123
- Native port: 9000
- Prometheus metrics: 9363
- IP: 172.151.150.40
- Volumes for data and logs
- Health check
- Configuration files mounted

### 2. Environment Variables
**Files**: `.env`, `.env.example`

Added ClickHouse configuration:
```env
CLICKHOUSE_VERSION=latest
CONTAINER_CLICKHOUSE=telemetryflow_core_clickhouse
CONTAINER_IP_CLICKHOUSE=172.151.150.40
PORT_CLICKHOUSE_HTTP=8123
PORT_CLICKHOUSE_NATIVE=9000
PORT_CLICKHOUSE_METRICS=9363
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=telemetry
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

### 3. ClickHouse Schema
**File**: `config/clickhouse/migrations/001-audit-logs.sql`

Created audit_logs table with:
- UUID primary key
- User information fields
- Event tracking (type, action, result)
- Request metadata (IP, user agent)
- Multi-tenancy support
- TTL: 90 days
- Materialized views for statistics

### 4. Docker Volumes
Added volumes:
- `vol_clickhouse_data` - ClickHouse data storage
- `vol_clickhouse_logs` - ClickHouse logs

### 5. Backend Configuration
Updated backend service:
- Added ClickHouse environment variables
- Added dependency on ClickHouse health check
- Connected to ClickHouse network

### 6. Startup Script
**File**: `docker-start.sh`

One-command startup that:
- Starts all Docker services
- Waits for services to be ready
- Initializes ClickHouse schema
- Seeds IAM data
- Shows service URLs

### 7. Documentation
**Files**: 
- `DOCKER_SETUP.md` - Complete Docker documentation
- `DOCKER_COMPLETE.md` - This file
- Updated `README.md` - Quick start instructions

## Services Overview

| Service | Port | IP | Purpose |
|---------|------|----|---------| 
| **Backend** | 3000 | 172.151.150.10 | NestJS API |
| **PostgreSQL** | 5432 | 172.151.150.20 | IAM data |
| **OTEL Collector** | 4317/4318 | 172.151.150.30 | Telemetry |
| **ClickHouse** | 8123/9000 | 172.151.150.40 | Audit logs |

## Quick Start

### Start Everything
```bash
./docker-start.sh
```

### Manual Start
```bash
# Start services
docker-compose up -d

# Initialize ClickHouse
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Seed data
docker-compose exec backend pnpm run db:seed:iam
```

## Service URLs

- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **PostgreSQL**: postgresql://postgres:postgres@localhost:5432/telemetryflow_core
- **ClickHouse HTTP**: http://localhost:8123
- **ClickHouse Native**: clickhouse://localhost:9000
- **OTEL gRPC**: http://localhost:4317
- **OTEL HTTP**: http://localhost:4318

## ClickHouse Schema

### audit_logs Table
```sql
CREATE TABLE audit_logs (
    id UUID,
    timestamp DateTime64(3),
    user_id String,
    user_email String,
    event_type Enum8('AUTH', 'AUTHZ', 'DATA', 'SYSTEM'),
    action String,
    resource String,
    result Enum8('SUCCESS', 'FAILURE', 'DENIED'),
    error_message String,
    ip_address String,
    user_agent String,
    metadata String,
    tenant_id String,
    organization_id String,
    workspace_id String,
    session_id String,
    duration_ms UInt32,
    created_at DateTime64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, event_type, user_id)
TTL timestamp + INTERVAL 90 DAY;
```

### Materialized Views
- `audit_logs_stats` - Event statistics by date/type/result
- `audit_logs_user_activity` - User activity by date/user/type

### Indexes
- `idx_user_id` - User activity queries
- `idx_event_type` - Event type filtering
- `idx_result` - Result filtering
- `idx_action` - Action filtering
- `idx_tenant_id` - Multi-tenancy
- `idx_organization_id` - Multi-tenancy

## Testing ClickHouse

### Connect to ClickHouse
```bash
docker exec -it telemetryflow_core_clickhouse clickhouse-client
```

### Query Examples
```sql
-- Count audit logs
SELECT count() FROM telemetry.audit_logs;

-- Recent logs
SELECT * FROM telemetry.audit_logs ORDER BY timestamp DESC LIMIT 10;

-- By event type
SELECT event_type, count() FROM telemetry.audit_logs GROUP BY event_type;

-- Failed operations
SELECT * FROM telemetry.audit_logs WHERE result = 'FAILURE' ORDER BY timestamp DESC LIMIT 10;
```

### Health Check
```bash
curl http://localhost:8123/ping
```

## Configuration Files

### From Platform
Copied from TelemetryFlow Platform:
- `config/clickhouse/config.xml` - ClickHouse server config
- `config/clickhouse/users.xml` - User accounts
- Schema structure matches Platform's audit module

### New Files
- `config/clickhouse/migrations/001-audit-logs.sql` - Schema migration
- `docker-start.sh` - Startup script
- `DOCKER_SETUP.md` - Documentation

## Volumes

```bash
# List volumes
docker volume ls | grep telemetryflow

# Inspect volume
docker volume inspect telemetryflow-core_vol_clickhouse_data

# Remove volumes (reset data)
docker-compose down -v
```

## Troubleshooting

### ClickHouse Not Starting
```bash
# Check logs
docker-compose logs clickhouse

# Check config
docker exec telemetryflow_core_clickhouse cat /etc/clickhouse-server/config.xml
```

### Schema Not Created
```bash
# Manually run migration
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Verify tables
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetry"
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
./docker-start.sh
```

## Production Checklist

- [ ] Change `POSTGRES_PASSWORD` in `.env`
- [ ] Change `CLICKHOUSE_PASSWORD` in `.env` and `users.xml`
- [ ] Change `JWT_SECRET` (min 32 chars)
- [ ] Change `SESSION_SECRET` (min 32 chars)
- [ ] Enable TLS for ClickHouse
- [ ] Configure resource limits
- [ ] Set up backup strategy
- [ ] Enable monitoring/alerting
- [ ] Review ClickHouse memory settings
- [ ] Configure log rotation

## Comparison with Platform

| Feature | Core | Platform |
|---------|------|----------|
| **Services** | 4 | 15+ |
| **Databases** | PostgreSQL + ClickHouse | PostgreSQL + ClickHouse + Redis + NATS |
| **Audit Storage** | ClickHouse | ClickHouse |
| **Schema** | Same | Same |
| **TTL** | 90 days | 90 days |
| **Indexes** | Same | Same |

## Next Steps

1. **Start Services**: `./docker-start.sh`
2. **Verify Setup**: Check all service URLs
3. **Test Audit Logging**: See `src/modules/audit/QUICK_START.md`
4. **Integrate IAM**: See `docs/IAM_AUDIT_INTEGRATION.md`
5. **Monitor**: Check ClickHouse metrics at http://localhost:9363/metrics

## References

- [Docker Setup Guide](./DOCKER_SETUP.md)
- [ClickHouse Configuration](./config/clickhouse/README.md)
- [Audit Module](./src/modules/audit/README.md)
- [IAM-Audit Integration](./docs/IAM_AUDIT_INTEGRATION.md)

---

**Status**: ✅ Complete
**Services**: 4 (Backend, PostgreSQL, ClickHouse, OTEL)
**Ready**: Production-ready with proper configuration
