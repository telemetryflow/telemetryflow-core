# Docker Setup - TelemetryFlow Core v1.4.0

Complete guide for Docker Compose deployment with profiles.

---

## Docker Profiles

TelemetryFlow Core uses Docker Compose profiles for flexible deployment:

| Profile        | Services                                               | Use Case               |
| -------------- | ------------------------------------------------------ | ---------------------- |
| **core**       | Backend, Frontend, PostgreSQL, ClickHouse, Redis, NATS | Full application stack |
| **monitoring** | Jaeger                                                 | Distributed tracing    |
| **tools**      | Portainer                                              | Container management   |
| **all**        | All services                                           | Complete stack         |

---

## Services Overview

### Core Services (Profile: `core`)

| Service        | Port(s)                    | IP             | Purpose                     |
| -------------- | -------------------------- | -------------- | --------------------------- |
| **Backend**    | 3000                       | 172.154.154.10 | NestJS API server           |
| **Frontend**   | 8080                       | 172.154.154.80 | Vue 3 SPA (Nginx)           |
| **PostgreSQL** | 5432                       | 172.154.154.20 | IAM data storage            |
| **ClickHouse** | 8123 (HTTP), 9000 (Native) | 172.154.154.40 | Audit log storage           |
| **Redis**      | 6379                       | 172.154.154.30 | Cache + BullMQ queues       |
| **NATS**       | 4222 (Client), 8222 (Mon)  | 172.154.154.35 | Event streaming (JetStream) |

### Monitoring Services (Profile: `monitoring`)

| Service    | Port(s) | IP              | Purpose                |
| ---------- | ------- | --------------- | ---------------------- |
| **Jaeger** | 16686   | (auto-assigned) | Distributed tracing UI |

### Tools Services (Profile: `tools`)

| Service       | Port(s)                   | IP            | Purpose              |
| ------------- | ------------------------- | ------------- | -------------------- |
| **Portainer** | 9100 (HTTP), 9443 (HTTPS) | 172.154.154.5 | Docker management UI |

---

## Quick Start

### 1. Start Services by Profile

```bash
# Core only (Backend + Frontend + PostgreSQL + ClickHouse + Redis + NATS)
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
docker-compose logs -f redis
docker-compose logs -f nats
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

| Service               | URL                                                                    | Description                   |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| **Frontend**          | http://localhost:8080                                                  | Vue 3 SPA                     |
| **Backend API**       | http://localhost:3000                                                  | REST API                      |
| **Swagger Docs**      | http://localhost:3000/api                                              | Interactive API documentation |
| **Health Check**      | http://localhost:3000/health                                           | Application health status     |
| **PostgreSQL**        | postgresql://postgres:telemetryflow123@localhost:5432/telemetryflow_db | Database connection           |
| **ClickHouse HTTP**   | http://localhost:8123                                                  | HTTP interface                |
| **ClickHouse Native** | clickhouse://localhost:9000                                            | Native protocol               |
| **Redis**             | redis://localhost:6379                                                 | Cache & queue backend         |
| **NATS Client**       | nats://localhost:4222                                                  | Event streaming               |
| **NATS Monitoring**   | http://localhost:8222                                                  | NATS server monitoring        |

### Monitoring Services

| Service       | URL                    | Description         |
| ------------- | ---------------------- | ------------------- |
| **Jaeger UI** | http://localhost:16686 | Trace visualization |

### Tools Services

| Service       | URL                   | Description          |
| ------------- | --------------------- | -------------------- |
| **Portainer** | http://localhost:9100 | Container management |

---

## Detailed Service Configuration

### 1. PostgreSQL

**Configuration**:

- **Image**: postgres:16-alpine
- **Database**: telemetryflow_db
- **User**: postgres
- **Password**: (set via `POSTGRES_PASSWORD`, empty by default)
- **Volume**: /opt/data/docker/telemetryflow-core/postgresql
- **IP**: 172.154.154.20

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
- **Password**: (set via `CLICKHOUSE_PASSWORD`, empty by default)
- **Volumes**:
  - Data: /opt/data/docker/telemetryflow-core/clickhouse/data
  - Logs: /opt/data/docker/telemetryflow-core/clickhouse/logs
- **IP**: 172.154.154.40

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

### 3. Redis

**Configuration**:

- **Image**: redis:7-alpine
- **Port**: 6379
- **Max Memory**: 512MB (configurable via `REDIS_MAX_MEMORY`)
- **Policy**: noeviction
- **Persistence**: RDB (every 60s if 1000+ keys) + AOF
- **Volume**: /opt/data/docker/telemetryflow-core/redis
- **IP**: 172.154.154.30

**Redis is used for two databases**:

- **DB 0** (`REDIS_CACHE_DB`): Caching and sessions
- **DB 1** (`REDIS_QUEUE_DB`): BullMQ job queues

**Connect**:

```bash
# Using docker exec
docker exec -it telemetryflow_core_redis redis-cli

# Check server info
docker exec telemetryflow_core_redis redis-cli INFO server

# Check memory usage
docker exec telemetryflow_core_redis redis-cli INFO memory
```

**Health Check**:

```bash
docker exec telemetryflow_core_redis redis-cli ping
```

### 4. NATS

**Configuration**:

- **Image**: nats:2-alpine
- **Ports**: 4222 (client), 8222 (monitoring)
- **JetStream**: Enabled (`--js`)
- **Max Memory Store**: 256MB
- **Max File Store**: 1GB
- **Volume**: /opt/data/docker/telemetryflow-core/nats
- **IP**: 172.154.154.35

**Health Check**:

```bash
curl http://localhost:8222/healthz
```

**Monitoring**:

```bash
# Server stats
curl http://localhost:8222/statsz

# JetStream info
curl http://localhost:8222/jsz
```

### 5. Backend (NestJS)

**Configuration**:

- **Image**: Built from Dockerfile.backend
- **Port**: 3000
- **IP**: 172.154.154.10
- **Depends on**: PostgreSQL, ClickHouse, Redis, NATS (all healthy)

**Environment**:

The backend connects to all core services:

- PostgreSQL (host: `postgres`, port: 5432)
- ClickHouse (host: `clickhouse`, port: 8123)
- Redis (host: `redis`, port: 6379)
- NATS (url: `nats://nats:4222`)

**Health Check**:

```bash
curl http://localhost:3000/health
```

**API Documentation**:

```bash
# Open Swagger UI
open http://localhost:3000/api
```

### 6. Frontend (Vue 3 + Nginx)

**Configuration**:

- **Image**: Built from Dockerfile.frontend
- **Port**: 8080 (maps to container port 80)
- **IP**: 172.154.154.80
- **Web Server**: Nginx
- **Depends on**: Backend

**Access**:

```bash
open http://localhost:8080
```

### 7. Jaeger

**Configuration**:

- **Image**: jaegertracing/jaeger:2.13.0
- **Storage**: Memory (for development)
- **Protocol**: Native OTLP support
- **Profile**: `monitoring`

**Access UI**:

```bash
open http://localhost:16686
```

### 8. Portainer

**Configuration**:

- **Image**: portainer/portainer-ce:latest
- **Ports**: 9100 (HTTP), 9443 (HTTPS)
- **Volume**: /opt/data/docker/telemetryflow-core/portainer
- **IP**: 172.154.154.5

**Access UI**:

```bash
open http://localhost:9100
```

---

## Volume Management

### Volume Paths

All persistent data is stored under `/opt/data/docker/telemetryflow-core/`:

| Service    | Path                                                |
| ---------- | --------------------------------------------------- |
| PostgreSQL | /opt/data/docker/telemetryflow-core/postgresql      |
| ClickHouse | /opt/data/docker/telemetryflow-core/clickhouse/data |
| ClickHouse | /opt/data/docker/telemetryflow-core/clickhouse/logs |
| Redis      | /opt/data/docker/telemetryflow-core/redis           |
| NATS       | /opt/data/docker/telemetryflow-core/nats            |
| Portainer  | /opt/data/docker/telemetryflow-core/portainer       |

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
**Subnet**: 172.154.0.0/16
**Driver**: bridge

### Service IP Addresses

| Service    | IP Address     |
| ---------- | -------------- |
| Portainer  | 172.154.154.5  |
| Backend    | 172.154.154.10 |
| PostgreSQL | 172.154.154.20 |
| Redis      | 172.154.154.30 |
| NATS       | 172.154.154.35 |
| ClickHouse | 172.154.154.40 |
| Frontend   | 172.154.154.80 |

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
sudo rm -rf /opt/data/docker/telemetryflow-core/postgresql/*
docker-compose --profile core up -d postgres

# Redis only
docker-compose stop redis
sudo rm -rf /opt/data/docker/telemetryflow-core/redis/*
docker-compose --profile core up -d redis

# NATS only
docker-compose stop nats
sudo rm -rf /opt/data/docker/telemetryflow-core/nats/*
docker-compose --profile core up -d nats
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
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key
MFA_ENCRYPTION_KEY=your-mfa-encryption-key
LLM_ENCRYPTION_KEY=your-llm-encryption-key
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
POSTGRES_PASSWORD=
POSTGRES_DB=telemetryflow_db

# ClickHouse
CLICKHOUSE_VERSION=latest
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DB=telemetryflow_db

# Redis
REDIS_MAX_MEMORY=512mb
REDIS_PASSWORD=

# NATS
NATS_CLUSTER_ID=telemetryflow-cluster

# OpenTelemetry
OTEL_ENABLED=false
OTEL_SERVICE_NAME=telemetryflow-core

# Tools
PORTAINER_VERSION=latest

# Logging
LOGGER_TYPE=winston
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_FILE_ENABLED=true

# SMTP
SMTP_ENABLED=false
```

---

## Production Considerations

### 1. Security

**Change Default Passwords**:

```env
POSTGRES_PASSWORD=<strong-password>
CLICKHOUSE_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
JWT_SECRET=<generated-secret-min-32-chars>
JWT_REFRESH_SECRET=<generated-secret-min-32-chars>
SESSION_SECRET=<generated-secret-min-32-chars>
ENCRYPTION_KEY=<generated-key>
MFA_ENCRYPTION_KEY=<generated-key>
LLM_ENCRYPTION_KEY=<generated-key>
```

**Generate Secrets**:

```bash
pnpm generate:secrets
```

**Enable TLS**:

- Configure ClickHouse HTTPS
- Use reverse proxy (nginx/traefik) for backend and frontend
- Enable HTTPS on Portainer (port 9443)

### 2. Resource Limits

Add to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "1"
          memory: 1G
```

### 3. Persistent Storage

**Bind Mounts** (Current):

- PostgreSQL: /opt/data/docker/telemetryflow-core/postgresql
- ClickHouse: /opt/data/docker/telemetryflow-core/clickhouse
- Redis: /opt/data/docker/telemetryflow-core/redis
- NATS: /opt/data/docker/telemetryflow-core/nats
- Portainer: /opt/data/docker/telemetryflow-core/portainer

**Ensure Permissions**:

```bash
sudo mkdir -p /opt/data/docker/telemetryflow-core/{postgresql,clickhouse/{data,logs},redis,nats,portainer}
sudo chown -R 999:999 /opt/data/docker/telemetryflow-core/postgresql
sudo chown -R 101:101 /opt/data/docker/telemetryflow-core/clickhouse
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

**Monitor Disk Usage**:

```bash
# Check volume sizes
docker system df -v

# Monitor ClickHouse disk usage
docker exec telemetryflow_core_clickhouse clickhouse-client --query "SELECT database, formatReadableSize(sum(bytes)) AS size FROM system.parts WHERE active GROUP BY database"

# Monitor Redis memory
docker exec telemetryflow_core_redis redis-cli INFO memory

# Monitor NATS JetStream
curl http://localhost:8222/jsz
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
- [Redis Docker](https://hub.docker.com/_/redis)
- [NATS Docker](https://hub.docker.com/_/nats)
- [Jaeger V2 Documentation](https://www.jaegertracing.io/docs/)
- [Portainer Documentation](https://docs.portainer.io/)

---

**Last Updated**: 2026-05-24
**Docker Compose Version**: 2.x
**Network**: 172.154.0.0/16
**TelemetryFlow Core Version**: v1.4.0
