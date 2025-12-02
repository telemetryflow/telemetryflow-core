# Docker Compose Changes

## Overview

Updated `docker-compose.yml` to match platform structure while keeping it minimal for IAM-only usage.

## Comparison

### Before (Simple)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: telemetryflow-core-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: telemetryflow_core
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### After (Platform-aligned)
```yaml
#================================================================================================
# TelemetryFlow Core - Docker Compose Configuration
# IAM Module Only (PostgreSQL)
#================================================================================================

networks:
  telemetryflow_core_net:
    name: telemetryflow_core_net
    driver: bridge
    ipam:
      config:
        - subnet: 172.151.0.0/16

volumes:
  vol_postgres_data:
    driver: local

services:
  postgres:
    platform: linux/amd64
    image: postgres:${POSTGRES_VERSION:-16-alpine}
    container_name: ${CONTAINER_POSTGRES:-telemetryflow_core_postgres}
    restart: unless-stopped
    ports:
      - "${PORT_POSTGRES:-5432}:5432"
    environment:
      - TZ=${TZ:-UTC}
      - POSTGRES_USER=${POSTGRES_USERNAME:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-telemetryflow_core}
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - vol_postgres_data:/var/lib/postgresql/data
    networks:
      telemetryflow_core_net:
        ipv4_address: ${CONTAINER_IP_POSTGRES:-172.151.151.20}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USERNAME:-postgres} -d ${POSTGRES_DB:-telemetryflow_core}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

## Key Improvements

### 1. Network Configuration
**Added:**
- Custom network: `telemetryflow_core_net`
- Custom subnet: `172.151.0.0/16`
- Static IP for PostgreSQL: `172.151.151.20`

**Benefits:**
- Better network isolation
- Predictable IP addresses
- Easier service discovery
- Compatible with platform networking

### 2. Environment Variables
**Now configurable via .env:**
```env
POSTGRES_VERSION=16-alpine
CONTAINER_POSTGRES=telemetryflow_core_postgres
CONTAINER_IP_POSTGRES=172.151.151.20
PORT_POSTGRES=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=telemetryflow_core
TZ=UTC
```

**Benefits:**
- Easy customization without editing docker-compose.yml
- Environment-specific configurations
- Production-ready setup

### 3. PostgreSQL Service Enhancements

**Added:**
- `platform: linux/amd64` - Explicit platform for M1/M2 Macs
- `restart: unless-stopped` - Auto-restart on failure
- `TZ` environment variable - Timezone support
- `PGDATA` path - Explicit data directory
- `start_period: 10s` in healthcheck - Grace period for startup

**Benefits:**
- Better cross-platform compatibility
- Automatic recovery from failures
- Consistent timezone handling
- More robust healthchecks

### 4. Volume Naming
**Changed:**
- `postgres_data` → `vol_postgres_data`

**Reason:** Matches platform naming convention (`vol_` prefix)

## Platform vs Core

| Feature | Platform | Core |
|---------|----------|------|
| **Services** | 15+ (Backend, Frontend, ClickHouse, Redis, NATS, etc.) | 1 (PostgreSQL only) |
| **Networks** | telemetryflow_net (172.150.0.0/16) | telemetryflow_core_net (172.151.0.0/16) |
| **Volumes** | 10+ volumes | 1 volume |
| **Profiles** | dev, monitoring | None (simple) |
| **Complexity** | ~800 lines | ~60 lines |

## Usage

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Restart PostgreSQL
```bash
docker-compose restart postgres
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

## Environment Variable Overrides

You can override any variable:

```bash
# Use different port
PORT_POSTGRES=5433 docker-compose up -d

# Use different database name
POSTGRES_DB=my_custom_db docker-compose up -d

# Use different PostgreSQL version
POSTGRES_VERSION=15-alpine docker-compose up -d
```

## Network Details

### Subnet: 172.151.0.0/16
- PostgreSQL: 172.151.151.20
- Available IPs: 172.151.0.1 - 172.151.255.254

### Why Different from Platform?
- Platform uses: 172.150.0.0/16
- Core uses: 172.151.0.0/16
- Reason: Avoid conflicts when running both simultaneously

## Migration from Old Version

If you have existing data:

```bash
# 1. Stop old container
docker-compose down

# 2. Backup data (optional)
docker run --rm -v telemetryflow-core_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# 3. Start new version
docker-compose up -d

# Data is preserved in the volume
```

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT_POSTGRES=5433

# Or use environment variable
PORT_POSTGRES=5433 docker-compose up -d
```

### Network Conflicts
```bash
# Change subnet in docker-compose.yml
# Or remove conflicting networks
docker network prune
```

### Volume Issues
```bash
# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Connection from Host
```bash
# Use localhost
psql -h localhost -p 5432 -U postgres -d telemetryflow_core

# Or use container IP
psql -h 172.151.151.20 -p 5432 -U postgres -d telemetryflow_core
```

## What's NOT Included

Compared to platform, these are intentionally excluded:

❌ ClickHouse service
❌ Redis service
❌ NATS service
❌ Backend service
❌ Frontend service
❌ OpenTelemetry Collector
❌ Prometheus
❌ Grafana Loki
❌ OpenSearch
❌ FluentBit
❌ Development tools (pgAdmin, Portainer)

## Future Additions

If you need more services later, you can add them:

### Add Redis
```yaml
redis:
  image: redis:7-alpine
  container_name: telemetryflow_core_redis
  ports:
    - "6379:6379"
  networks:
    telemetryflow_core_net:
      ipv4_address: 172.151.151.30
```

### Add pgAdmin
```yaml
pgadmin:
  image: dpage/pgadmin4:latest
  container_name: telemetryflow_core_pgadmin
  environment:
    - PGADMIN_DEFAULT_EMAIL=admin@telemetryflow.local
    - PGADMIN_DEFAULT_PASSWORD=admin
  ports:
    - "5050:80"
  networks:
    - telemetryflow_core_net
```

## Compatibility

✅ Compatible with platform structure
✅ Can run alongside platform (different subnet)
✅ Same PostgreSQL version support
✅ Same environment variable patterns
✅ Same volume management approach

## Testing

Verify the setup:

```bash
# 1. Start services
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. Check logs
docker-compose logs postgres

# 4. Test connection
docker-compose exec postgres psql -U postgres -d telemetryflow_core -c "SELECT version();"

# 5. Check network
docker network inspect telemetryflow_core_net
```

Expected output:
```
NAME                              IMAGE                 STATUS
telemetryflow_core_postgres       postgres:16-alpine    Up (healthy)
```
