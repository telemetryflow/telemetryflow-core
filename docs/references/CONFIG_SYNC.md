# Configuration Synchronization

Configuration files synchronized from TelemetryFlow Platform to Core.

## Synchronized Configurations

### ✅ Copied from Platform

| Config | Source | Destination | Status |
|--------|--------|-------------|--------|
| PostgreSQL | `platform/config/postgresql/` | `core/config/postgresql/` | ✅ Synced |
| Prometheus | `platform/config/prometheus/` | `core/config/prometheus/` | ✅ Synced |
| OTEL Collector | `platform/config/otel/` | `core/config/otel/` | ✅ Updated |
| ClickHouse | `platform/config/clickhouse/` | `core/config/clickhouse/` | ✅ Already synced |

### ❌ Excluded (Not Applicable to Core)

| Config | Reason |
|--------|--------|
| NATS | Core doesn't use message queue |
| Redis | Core doesn't use caching layer |
| Loki | Core uses Winston logger only |
| Fluent Bit | Core doesn't need log aggregation |
| OpenSearch | Core doesn't use search engine |

## Configuration Details

### PostgreSQL (`config/postgresql/`)

**Files:**
- `postgresql.conf` - Server configuration
- `README.md` - Documentation

**Key Settings:**
- Max connections: 200
- Shared buffers: 256MB
- Effective cache size: 1GB
- WAL level: replica

**Docker Mount:**
```yaml
volumes:
  - ./config/postgresql/postgresql.conf:/etc/postgresql/postgresql.conf:ro
```

### Prometheus (`config/prometheus/`)

**Files:**
- `prometheus.yml` - Scrape configuration
- `README.md` - Documentation

**Scrape Targets:**
- OTEL Collector metrics (port 8889)
- OTEL Collector internal (port 8888)
- Prometheus self-monitoring (port 9090)

**Docker Service:**
```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  networks:
    telemetryflow_core_net:
      ipv4_address: 172.151.151.50
```

### OTEL Collector (`config/otel/`)

**Files:**
- `otel-collector-config.yaml` - Collector configuration
- `README.md` - Documentation

**Updates from Platform:**
- Added Prometheus receiver for self-scraping
- Added resource detection processor
- Added attributes processor for environment enrichment
- Added extensions: health_check, pprof, zpages
- Increased memory limit to 512MB
- Added telemetry configuration

**New Endpoints:**
- Health check: `http://localhost:13133`
- pprof: `http://localhost:1777`
- zPages: `http://localhost:55679`

### ClickHouse (`config/clickhouse/`)

**Status:** Already synchronized in previous session

**Files:**
- `config.xml` - Server configuration
- `users.xml` - User and access control
- `migrations/001-audit-logs.sql` - Audit logs schema
- `README.md` - Documentation

## Docker Compose Updates

### New Services

Added Prometheus service:
```yaml
prometheus:
  platform: linux/amd64
  image: prom/prometheus:latest
  container_name: telemetryflow_core_prometheus
  restart: unless-stopped
  ports:
    - "9090:9090"
  volumes:
    - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - vol_prometheus_data:/prometheus
  networks:
    telemetryflow_core_net:
      ipv4_address: 172.151.151.50
```

### Updated Services

**PostgreSQL:**
- Added config file mount: `./config/postgresql/postgresql.conf`

**OTEL Collector:**
- Added health check port: 13133
- Added zPages port: 55679

### New Volumes

```yaml
volumes:
  vol_prometheus_data:
    driver: local
```

## Environment Variables

### Added to .env and .env.example

```bash
# OTEL Collector
PORT_OTEL_HEALTH=13133
PORT_OTEL_ZPAGES=55679

# Prometheus
PROMETHEUS_VERSION=latest
CONTAINER_PROMETHEUS=telemetryflow_core_prometheus
CONTAINER_IP_PROMETHEUS=172.151.151.50
PORT_PROMETHEUS=9090
```

## Network Topology

```
172.151.0.0/16 (telemetryflow_core_net)
├── 172.151.151.10 - Backend (NestJS)
├── 172.151.151.20 - PostgreSQL
├── 172.151.151.30 - OTEL Collector
├── 172.151.151.40 - ClickHouse
└── 172.151.151.50 - Prometheus (NEW)
```

## Service Ports

| Service | Internal | External | Purpose |
|---------|----------|----------|---------|
| Backend | 3000 | 3000 | API |
| PostgreSQL | 5432 | 5432 | Database |
| ClickHouse HTTP | 8123 | 8123 | HTTP API |
| ClickHouse Native | 9000 | 9000 | Native protocol |
| ClickHouse Metrics | 9363 | 9363 | Prometheus metrics |
| OTEL gRPC | 4317 | 4317 | OTLP receiver |
| OTEL HTTP | 4318 | 4318 | OTLP receiver |
| OTEL Metrics | 8889 | 8889 | Prometheus exporter |
| OTEL Health | 13133 | 13133 | Health check |
| OTEL zPages | 55679 | 55679 | Debug pages |
| Prometheus | 9090 | 9090 | Metrics UI |

## Usage

### Start All Services

```bash
# With docker-start.sh
./docker-start.sh

# Or manually
docker-compose up -d
```

### Verify Configurations

```bash
# Check PostgreSQL config
docker exec telemetryflow_core_postgres cat /etc/postgresql/postgresql.conf

# Check Prometheus config
docker exec telemetryflow_core_prometheus cat /etc/prometheus/prometheus.yml

# Check OTEL config
docker exec telemetryflow_core_otel cat /etc/otel-collector-config.yaml

# Check ClickHouse config
docker exec telemetryflow_core_clickhouse cat /etc/clickhouse-server/config.xml
```

### Access Services

```bash
# Prometheus UI
open http://localhost:9090

# OTEL Health Check
curl http://localhost:13133

# OTEL zPages
open http://localhost:55679/debug/tracez

# OTEL Metrics
curl http://localhost:8889/metrics

# ClickHouse
curl http://localhost:8123/ping
```

## Configuration Management

### Update Configurations

1. Edit config files in `config/` directory
2. Restart affected service:
   ```bash
   docker-compose restart postgres
   docker-compose restart prometheus
   docker-compose restart otel-collector
   docker-compose restart clickhouse
   ```

### Backup Configurations

```bash
# Backup all configs
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/

# Restore
tar -xzf config-backup-YYYYMMDD.tar.gz
```

## Differences from Platform

| Aspect | Platform | Core |
|--------|----------|------|
| **Services** | 15+ | 5 |
| **Configs** | 9 directories | 4 directories |
| **NATS** | ✅ Included | ❌ Excluded |
| **Redis** | ✅ Included | ❌ Excluded |
| **Loki** | ✅ Included | ❌ Excluded |
| **Fluent Bit** | ✅ Included | ❌ Excluded |
| **OpenSearch** | ✅ Included | ❌ Excluded |
| **PostgreSQL** | ✅ Included | ✅ Included |
| **ClickHouse** | ✅ Included | ✅ Included |
| **OTEL** | ✅ Included | ✅ Included |
| **Prometheus** | ✅ Included | ✅ Included |

## Documentation

- [Main Config README](../config/README.md)
- [PostgreSQL Config](../config/postgresql/README.md)
- [ClickHouse Config](../config/clickhouse/README.md)
- [OTEL Config](../config/otel/README.md)
- [Prometheus Config](../config/prometheus/README.md)

## Changelog

### 2025-12-02
- ✅ Copied PostgreSQL configuration from Platform
- ✅ Copied Prometheus configuration from Platform
- ✅ Updated OTEL Collector configuration with Platform features
- ✅ Added Prometheus service to docker-compose.yml
- ✅ Added PostgreSQL config mount to docker-compose.yml
- ✅ Added OTEL health check and zPages ports
- ✅ Updated environment variables
- ✅ Created documentation for all configs
- ❌ Excluded NATS, Redis, Loki, Fluent Bit, OpenSearch (not applicable to Core)

---

**Status:** ✅ Configuration synchronization complete
**Services:** 5 (Backend, PostgreSQL, ClickHouse, OTEL Collector, Prometheus)
**Configs:** 4 directories (PostgreSQL, ClickHouse, OTEL, Prometheus)
