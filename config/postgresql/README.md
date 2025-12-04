# PostgreSQL Configuration

PostgreSQL configuration for TelemetryFlow Core.

## Files

- `postgresql.conf` - PostgreSQL server configuration

## Configuration Highlights

- **Max Connections**: 200
- **Shared Buffers**: 256MB
- **Effective Cache Size**: 1GB
- **Work Memory**: 4MB
- **Maintenance Work Memory**: 64MB
- **WAL Level**: replica (for replication support)
- **Logging**: Enabled with query logging for slow queries (>1s)

## Usage

Mounted in Docker Compose:
```yaml
volumes:
  - ./config/postgresql/postgresql.conf:/etc/postgresql/postgresql.conf
```

## Tuning

Adjust based on available resources:
- `shared_buffers`: 25% of RAM
- `effective_cache_size`: 50-75% of RAM
- `work_mem`: RAM / max_connections / 4
