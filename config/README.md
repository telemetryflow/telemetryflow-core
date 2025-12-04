# Configuration Files

Configuration files for TelemetryFlow Core infrastructure services.

## Directory Structure

```
config/
├── clickhouse/          # ClickHouse configuration
│   ├── config.xml       # Server configuration
│   ├── users.xml        # User and access control
│   ├── migrations/      # Schema migrations
│   └── README.md
├── postgresql/          # PostgreSQL configuration
│   ├── postgresql.conf  # Server configuration
│   └── README.md
├── otel/                # OpenTelemetry Collector
│   ├── otel-collector-config.yaml
│   └── README.md
├── prometheus/          # Prometheus monitoring
│   ├── prometheus.yml   # Scrape configuration
│   └── README.md
└── README.md
```

## Services

### ClickHouse
- **Port**: 8123 (HTTP), 9000 (Native)
- **Purpose**: Audit logs storage
- **Config**: `clickhouse/config.xml`, `clickhouse/users.xml`
- **Migrations**: `clickhouse/migrations/`

### PostgreSQL
- **Port**: 5432
- **Purpose**: IAM data storage
- **Config**: `postgresql/postgresql.conf`
- **Database**: telemetryflow_db

### OTEL Collector
- **Ports**: 4317 (gRPC), 4318 (HTTP), 8889 (Prometheus), 13133 (Health)
- **Purpose**: Telemetry collection and export
- **Config**: `otel/otel-collector-config.yaml`

### Prometheus
- **Port**: 9090
- **Purpose**: Metrics collection and monitoring
- **Config**: `prometheus/prometheus.yml`

## Docker Integration

All configurations are mounted in `docker-compose.yml`:

```yaml
services:
  postgres:
    volumes:
      - ./config/postgresql/postgresql.conf:/etc/postgresql/postgresql.conf

  clickhouse:
    volumes:
      - ./config/clickhouse/config.xml:/etc/clickhouse-server/config.xml
      - ./config/clickhouse/users.xml:/etc/clickhouse-server/users.xml

  otel:
    volumes:
      - ./config/otel/otel-collector-config.yaml:/etc/otel/config.yaml

  prometheus:
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
```

## Quick Start

```bash
# Start all services with configurations
docker-compose up -d

# Initialize ClickHouse schema
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Verify configurations
docker-compose logs postgres
docker-compose logs clickhouse
docker-compose logs otel
docker-compose logs prometheus
```

## Configuration Updates

After modifying configurations:

```bash
# Restart specific service
docker-compose restart postgres
docker-compose restart clickhouse
docker-compose restart otel
docker-compose restart prometheus

# Or restart all
docker-compose restart
```

## Documentation

- [ClickHouse](./clickhouse/README.md)
- [PostgreSQL](./postgresql/README.md)
- [OTEL Collector](./otel/README.md)
- [Prometheus](./prometheus/README.md)
