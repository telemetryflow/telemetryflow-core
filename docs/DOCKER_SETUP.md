# Docker Setup - TelemetryFlow Core

Complete guide for Docker Compose deployment with profiles.

---

## Docker Profiles

TelemetryFlow Core uses Docker Compose profiles for flexible deployment:

| Profile | Services | Use Case |
|---------|----------|----------|
| **core** | Backend, PostgreSQL, ClickHouse | Minimal IAM + Audit setup |
| **monitoring** | OTEL, Jaeger, Prometheus, Grafana | Observability stack |
| **tools** | Portainer | Container management |
| **all** | All services | Complete stack |

---

## Services Overview

### Core Services (Profile: `core`)

| Service | Port(s) | IP | Purpose |
|---------|---------|-----|---------|
| **Backend** | 3000 | 172.151.151.10 | NestJS API server |
| **PostgreSQL** | 5432 | 172.151.151.20 | IAM data storage |
| **ClickHouse** | 8123 (HTTP)<br/>9000 (Native)<br/>9363 (Metrics) | 172.151.151.40 | Audit log storage |

### Monitoring Services (Profile: `monitoring`)

| Service | Port(s) | IP | Purpose |
|---------|---------|-----|---------|
| **OTEL Collector** | 4317 (gRPC)<br/>4318 (HTTP)<br/>8889 (Metrics) | 172.151.151.30 | Telemetry collection |
| **Jaeger** | 16686 (UI) | 172.151.151.60 | Distributed tracing UI |
| **Prometheus** | 9090 | 172.151.151.50 | Metrics storage |
| **Grafana** | 3001 | 172.151.151.70 | Metrics visualization |

### Tools Services (Profile: `tools`)

| Service | Port(s) | IP | Purpose |
|---------|---------|-----|---------|
| **Portainer** | 9100 (HTTP)<br/>9443 (HTTPS) | 172.151.151.5 | Docker management UI |

---

## Quick Start

### 1. Start Services by Profile

```bash
# Core only (Backend + PostgreSQL + ClickHouse)
docker-compose --profile core up -d

# Core + Monitoring
docker-compose --profile core --profile monitoring up -d

# Core + Tools
docker-compose --profile core --profile tools up -d

# All services
docker-compose --profile all up -d
```

### 2. Check Status

```bash
# All running containers
docker-compose ps

# Specific service
docker-compose ps backend
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f clickhouse
docker-compose logs -f jaeger
```

### 4. Initialize Databases

```bash
# Run PostgreSQL migrations
pnpm db:migrate:postgres

# Run ClickHouse migrations
pnpm db:migrate:clickhouse

# Or run all migrations
pnpm db:migrate
```

### 5. Seed Data

```bash
# Seed IAM data
pnpm db:seed:iam

# Seed ClickHouse sample data
pnpm db:seed:clickhouse

# Or seed all
pnpm db:seed
```

---

## Service URLs

### Core Services

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | REST API |
| **Swagger Docs** | http://localhost:3000/api | Interactive API documentation |
| **Health Check** | http://localhost:3000/health | Application health status |
| **PostgreSQL** | postgresql://postgres:telemetryflow123@localhost:5432/telemetryflow_db | Database connection |
| **ClickHouse HTTP** | http://localhost:8123 | HTTP interface |
| **ClickHouse Native** | clickhouse://localhost:9000 | Native protocol |
| **ClickHouse Metrics** | http://localhost:9363/metrics | Prometheus metrics |

### Monitoring Services

| Service | URL | Description |
|---------|-----|-------------|
| **OTEL gRPC** | http://localhost:4317 | OTLP gRPC endpoint |
| **OTEL HTTP** | http://localhost:4318 | OTLP HTTP endpoint |
| **OTEL Metrics** | http://localhost:8889/metrics | Collector metrics |
| **Jaeger UI** | http://localhost:16686 | Trace visualization |
| **Prometheus** | http://localhost:9090 | Metrics query UI |
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |

### Tools Services

| Service | URL | Description |
|---------|-----|-------------|
| **Portainer** | http://localhost:9100 | Container management |

---

## Detailed Service Configuration

### 1. PostgreSQL

**Configuration**:
- **Image**: postgres:16-alpine
- **Database**: telemetryflow_db
- **User**: postgres
- **Password**: telemetryflow123 (change in production!)
- **Volume**: /opt/data/docker/telemetryflow-core/postgres

**Connect**:
```bash
# Using docker exec
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_db

# Using psql locally
psql -h localhost -p 5432 -U postgres -d telemetryflow_db
```

**Common Queries**:
```sql
-- List all tables
\dt

-- Count users
SELECT COUNT(*) FROM users;

-- List roles
SELECT * FROM roles;

-- Check migrations
SELECT * FROM migrations ORDER BY timestamp;
```

### 2. ClickHouse

**Configuration**:
- **Image**: clickhouse/clickhouse-server:latest
- **Database**: telemetryflow_db
- **User**: default
- **Password**: telemetryflow123
- **Volumes**: 
  - Data: /opt/data/docker/telemetryflow-core/clickhouse/data
  - Logs: /opt/data/docker/telemetryflow-core/clickhouse/logs

**Connect**:
```bash
# Using docker exec
docker exec -it telemetryflow_core_clickhouse clickhouse-client

# Using clickhouse-client locally
clickhouse-client --host localhost --port 9000
```

**Common Queries**:
```sql
-- Show databases
SHOW DATABASES;

-- Show tables
SHOW TABLES FROM telemetryflow_db;

-- Count audit logs
SELECT count() FROM telemetryflow_db.audit_logs;

-- Recent audit logs
SELECT * FROM telemetryflow_db.audit_logs 
ORDER BY timestamp DESC LIMIT 10;

-- Audit logs by event type
SELECT event_type, count() as count
FROM telemetryflow_db.audit_logs
GROUP BY event_type;

-- Failed operations
SELECT * FROM telemetryflow_db.audit_logs
WHERE result = 'FAILURE'
ORDER BY timestamp DESC LIMIT 10;

-- User activity
SELECT user_email, event_type, count() as count
FROM telemetryflow_db.audit_logs
WHERE user_email != ''
GROUP BY user_email, event_type
ORDER BY count DESC;
```

**Health Check**:
```bash
curl http://localhost:8123/ping
```

**Metrics**:
```bash
curl http://localhost:9363/metrics
```

### 3. Backend (NestJS)

**Configuration**:
- **Image**: Built from Dockerfile
- **Port**: 3000
- **Environment**: Production (configurable)
- **Logs**: ./logs directory

**Health Check**:
```bash
curl http://localhost:3000/health
```

**API Documentation**:
```bash
# Open Swagger UI
open http://localhost:3000/api
```

### 4. OTEL Collector

**Configuration**:
- **Image**: otel/opentelemetry-collector-contrib:latest
- **Config**: ./config/otel/otel-collector-config-spm.yaml
- **Ports**: 4317 (gRPC), 4318 (HTTP), 8889 (metrics)

**Check Status**:
```bash
# Health check
curl http://localhost:13133

# Metrics
curl http://localhost:8889/metrics
```

### 5. Jaeger

**Configuration**:
- **Image**: jaegertracing/jaeger:2.2.0
- **Storage**: Memory (for development)
- **Metrics**: Prometheus integration

**Access UI**:
```bash
open http://localhost:16686
```

### 6. Prometheus

**Configuration**:
- **Image**: prom/prometheus:latest
- **Config**: ./config/prometheus/prometheus.yml
- **Volume**: /opt/data/docker/telemetryflow-core/prometheus

**Access UI**:
```bash
open http://localhost:9090
```

**Query Examples**:
```promql
# HTTP request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 7. Grafana

**Configuration**:
- **Image**: grafana/grafana:latest
- **Credentials**: admin/admin (change on first login)
- **Dashboards**: ./config/grafana/dashboards

**Access UI**:
```bash
open http://localhost:3001
```

**Pre-configured Dashboards**:
- System Health
- API Performance
- Audit Statistics
- User Activity

### 8. Portainer

**Configuration**:
- **Image**: portainer/portainer-ce:latest
- **Volume**: /opt/data/docker/telemetryflow-core/portainer

**Access UI**:
```bash
open http://localhost:9100
```

---

## Volume Management

### List Volumes

```bash
docker volume ls | grep telemetryflow
```

### Inspect Volume

```bash
# PostgreSQL data
docker volume inspect telemetryflow-core_vol_postgres_data

# ClickHouse data
docker volume inspect telemetryflow-core_vol_clickhouse_data

# Prometheus data
docker volume inspect telemetryflow-core_vol_prometheus_data
```

### Backup Volumes

```bash
# PostgreSQL backup
docker exec telemetryflow_core_postgres pg_dump -U postgres telemetryflow_db > backup.sql

# ClickHouse backup
docker exec telemetryflow_core_clickhouse clickhouse-client --query "BACKUP DATABASE telemetryflow_db TO Disk('backups', 'backup.zip')"
```

### Restore Volumes

```bash
# PostgreSQL restore
docker exec -i telemetryflow_core_postgres psql -U postgres telemetryflow_db < backup.sql

# ClickHouse restore
docker exec telemetryflow_core_clickhouse clickhouse-client --query "RESTORE DATABASE telemetryflow_db FROM Disk('backups', 'backup.zip')"
```

---

## Network Configuration

**Network Name**: telemetryflow_core_net  
**Subnet**: 172.151.0.0/16  
**Driver**: bridge

### Service IP Addresses

| Service | IP Address |
|---------|-----------|
| Portainer | 172.151.151.5 |
| Backend | 172.151.151.10 |
| PostgreSQL | 172.151.151.20 |
| OTEL Collector | 172.151.151.30 |
| ClickHouse | 172.151.151.40 |
| Prometheus | 172.151.151.50 |
| Jaeger | 172.151.151.60 |
| Grafana | 172.151.151.70 |

### Inspect Network

```bash
docker network inspect telemetryflow_core_net
```

---

## Troubleshooting

### Reset All Data

```bash
# Stop and remove all containers and volumes
docker-compose --profile all down -v

# Start fresh
docker-compose --profile all up -d
```

### Reset Specific Service

```bash
# ClickHouse only
docker-compose stop clickhouse
sudo rm -rf /opt/data/docker/telemetryflow-core/clickhouse/*
sudo mkdir -p /opt/data/docker/telemetryflow-core/clickhouse/{data,logs}
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chmod -R 777 /opt/data/docker/telemetryflow-core/clickhouse
docker-compose --profile core up -d clickhouse

# PostgreSQL only
docker-compose stop postgres
docker volume rm telemetryflow-core_vol_postgres_data
docker-compose --profile core up -d postgres
```

### Check Service Logs

```bash
# All services
docker-compose logs -f

# Specific service with tail
docker-compose logs -f --tail=100 backend

# Error logs only
docker-compose logs backend 2>&1 | grep -i error
```

### Check Service Health

```bash
# All services
docker-compose ps

# Specific service
docker inspect telemetryflow_core_backend --format='{{.State.Health.Status}}'
```

### ClickHouse Issues

**Container Unhealthy**:
```bash
# Check logs
docker logs telemetryflow_core_clickhouse --tail 50

# Check error log
docker exec telemetryflow_core_clickhouse cat /var/log/clickhouse-server/clickhouse-server.err.log

# Fix permissions
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chmod -R 777 /opt/data/docker/telemetryflow-core/clickhouse
docker restart telemetryflow_core_clickhouse
```

**Version Incompatibility**:
```bash
# Clean data and restart
docker stop telemetryflow_core_clickhouse
sudo rm -rf /opt/data/docker/telemetryflow-core/clickhouse/*
sudo mkdir -p /opt/data/docker/telemetryflow-core/clickhouse/{data,logs}
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
docker start telemetryflow_core_clickhouse
```

### Backend Issues

**Cannot Connect to Database**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check network connectivity
docker exec telemetryflow_core_backend ping -c 3 postgres

# Check environment variables
docker exec telemetryflow_core_backend env | grep POSTGRES
```

**Migration Errors**:
```bash
# Run migrations manually
docker exec telemetryflow_core_backend pnpm db:migrate

# Check migration status
docker exec -it telemetryflow_core_postgres psql -U postgres -d telemetryflow_db -c "SELECT * FROM migrations;"
```

---

## Environment Variables

### Required Variables

```env
# JWT & Session (generate with: pnpm generate:secrets)
JWT_SECRET=your-secret-key-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
```

### Optional Variables

```env
# Application
NODE_ENV=production
PORT=3000
TZ=UTC

# PostgreSQL
POSTGRES_VERSION=16-alpine
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=telemetryflow123
POSTGRES_DB=telemetryflow_db

# ClickHouse
CLICKHOUSE_VERSION=latest
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=telemetryflow123
CLICKHOUSE_DB=telemetryflow_db

# OpenTelemetry
OTEL_ENABLED=true
OTEL_SERVICE_NAME=telemetryflow-core
OTEL_VERSION=latest

# Monitoring
JAEGER_VERSION=2.2.0
PROMETHEUS_VERSION=latest
GRAFANA_VERSION=latest

# Tools
PORTAINER_VERSION=latest

# Logging
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_FILE_ENABLED=true

# Grafana
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Production Considerations

### 1. Security

**Change Default Passwords**:
```env
POSTGRES_PASSWORD=<strong-password>
CLICKHOUSE_PASSWORD=<strong-password>
JWT_SECRET=<generated-secret-min-32-chars>
SESSION_SECRET=<generated-secret-min-32-chars>
GF_SECURITY_ADMIN_PASSWORD=<strong-password>
```

**Generate Secrets**:
```bash
pnpm generate:secrets
```

**Enable TLS**:
- Configure ClickHouse HTTPS
- Use reverse proxy (nginx/traefik) for backend
- Enable Grafana HTTPS

### 2. Resource Limits

Add to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. Persistent Storage

**Bind Mounts** (Current):
- PostgreSQL: /opt/data/docker/telemetryflow-core/postgres
- ClickHouse: /opt/data/docker/telemetryflow-core/clickhouse
- Prometheus: /opt/data/docker/telemetryflow-core/prometheus
- Portainer: /opt/data/docker/telemetryflow-core/portainer

**Ensure Permissions**:
```bash
sudo mkdir -p /opt/data/docker/telemetryflow-core/{postgres,clickhouse/{data,logs},prometheus,portainer}
sudo chown -R 999:999 /opt/data/docker/telemetryflow-core/postgres
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
sudo chown -R 65534:65534 /opt/data/docker/telemetryflow-core/prometheus
```

### 4. Backup Strategy

**Automated Backups**:
```bash
# PostgreSQL daily backup
0 2 * * * docker exec telemetryflow_core_postgres pg_dump -U postgres telemetryflow_db | gzip > /backups/postgres-$(date +\%Y\%m\%d).sql.gz

# ClickHouse weekly backup
0 3 * * 0 docker exec telemetryflow_core_clickhouse clickhouse-client --query "BACKUP DATABASE telemetryflow_db TO Disk('backups', 'backup-$(date +\%Y\%m\%d).zip')"
```

### 5. Monitoring & Alerting

**Enable Prometheus Alerting**:
- Configure alert rules in prometheus.yml
- Set up Alertmanager
- Configure notification channels (email, Slack, PagerDuty)

**Monitor Disk Usage**:
```bash
# Check volume sizes
docker system df -v

# Monitor ClickHouse disk usage
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SELECT database, formatReadableSize(sum(bytes)) AS size FROM system.parts WHERE active GROUP BY database"
```

### 6. Log Rotation

**Configure Log Rotation**:
```bash
# /etc/logrotate.d/telemetryflow-core
/opt/data/docker/telemetryflow-core/*/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [ClickHouse Docker](https://hub.docker.com/r/clickhouse/clickhouse-server)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Portainer Documentation](https://docs.portainer.io/)

---

**Last Updated**: 2025-12-05  
**Docker Compose Version**: 2.x  
**Network**: 172.151.0.0/16
