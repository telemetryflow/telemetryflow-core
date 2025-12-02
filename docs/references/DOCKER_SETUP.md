# Docker Setup - TelemetryFlow Core

## Services

### 1. PostgreSQL (IAM Data)
- **Port**: 5432
- **IP**: 172.151.151.20
- **Database**: telemetryflow_core
- **User**: postgres
- **Purpose**: IAM module data storage

### 2. ClickHouse (Audit Logs)
- **HTTP Port**: 8123
- **Native Port**: 9000
- **Metrics Port**: 9363
- **IP**: 172.151.151.40
- **Database**: telemetry
- **User**: default
- **Purpose**: High-volume audit log storage

### 3. Backend (NestJS)
- **Port**: 3000
- **IP**: 172.151.151.10
- **Purpose**: API server

### 4. OTEL Collector
- **gRPC Port**: 4317
- **HTTP Port**: 4318
- **Metrics Port**: 8889
- **IP**: 172.151.151.30
- **Purpose**: OpenTelemetry data collection

## Quick Start

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Check Status
```bash
docker-compose ps
```

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f clickhouse
```

### 4. Initialize ClickHouse Schema
```bash
# Execute migration
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql
```

### 5. Seed IAM Data
```bash
# Inside backend container
docker exec telemetryflow_core_backend pnpm run db:seed:iam
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
- **Prometheus Metrics**: http://localhost:8889/metrics

## ClickHouse Management

### Connect to ClickHouse
```bash
# Using docker exec
docker exec -it telemetryflow_core_clickhouse clickhouse-client

# Using clickhouse-client locally
clickhouse-client --host localhost --port 9000
```

### Query Audit Logs
```sql
-- Count total audit logs
SELECT count() FROM telemetry.audit_logs;

-- Recent audit logs
SELECT * FROM telemetry.audit_logs ORDER BY timestamp DESC LIMIT 10;

-- Audit logs by event type
SELECT event_type, count() as count
FROM telemetry.audit_logs
GROUP BY event_type;

-- Failed operations
SELECT * FROM telemetry.audit_logs
WHERE result = 'FAILURE'
ORDER BY timestamp DESC
LIMIT 10;

-- User activity
SELECT user_email, event_type, count() as count
FROM telemetry.audit_logs
WHERE user_email != ''
GROUP BY user_email, event_type
ORDER BY count DESC;
```

### Check ClickHouse Health
```bash
curl http://localhost:8123/ping
```

### View ClickHouse Metrics
```bash
curl http://localhost:9363/metrics
```

## Volumes

### PostgreSQL Data
```bash
docker volume inspect telemetryflow-core_vol_postgres_data
```

### ClickHouse Data
```bash
docker volume inspect telemetryflow-core_vol_clickhouse_data
docker volume inspect telemetryflow-core_vol_clickhouse_logs
```

## Troubleshooting

### Reset All Data
```bash
docker-compose down -v
docker-compose up -d
```

### Reset ClickHouse Only
```bash
docker-compose stop clickhouse
docker volume rm telemetryflow-core_vol_clickhouse_data
docker volume rm telemetryflow-core_vol_clickhouse_logs
docker-compose up -d clickhouse
```

### Check ClickHouse Logs
```bash
docker-compose logs clickhouse
docker exec telemetryflow_core_clickhouse cat /var/log/clickhouse-server/clickhouse-server.log
```

### Verify ClickHouse Tables
```bash
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SHOW TABLES FROM telemetry"
```

## Environment Variables

### Required
- `POSTGRES_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT secret (min 32 chars)
- `SESSION_SECRET` - Session secret (min 32 chars)

### Optional
- `CLICKHOUSE_PASSWORD` - ClickHouse password (empty by default)
- `OTEL_ENABLED` - Enable OpenTelemetry (true/false)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Network

All services are on the same network: `telemetryflow_core_net` (172.151.0.0/16)

Service IPs:
- Backend: 172.151.151.10
- PostgreSQL: 172.151.151.20
- OTEL Collector: 172.151.151.30
- ClickHouse: 172.151.151.40

## Production Considerations

1. **Change Default Passwords**
   - PostgreSQL: Update `POSTGRES_PASSWORD`
   - ClickHouse: Update `CLICKHOUSE_PASSWORD` and `config/clickhouse/users.xml`
   - JWT: Update `JWT_SECRET` and `SESSION_SECRET`

2. **Enable TLS**
   - Configure ClickHouse HTTPS
   - Use reverse proxy for backend

3. **Resource Limits**
   - Add memory/CPU limits to services
   - Configure ClickHouse memory settings

4. **Backup Strategy**
   - Regular PostgreSQL backups
   - ClickHouse data backups
   - Volume snapshots

5. **Monitoring**
   - Enable Prometheus metrics
   - Configure alerting
   - Monitor disk usage

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ClickHouse Documentation](https://clickhouse.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
