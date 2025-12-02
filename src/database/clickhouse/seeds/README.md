# ClickHouse Seeds

Sample data for ClickHouse audit logs.

## Files

- `001-sample-audit-logs.sql` - Sample audit log entries

## Usage

```bash
# Load seed data
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < src/database/clickhouse/seeds/001-sample-audit-logs.sql
```

## Sample Data Includes

- **AUTH events**: Successful/failed logins
- **AUTHZ events**: Permission checks
- **DATA events**: CRUD operations
- **SYSTEM events**: System-level operations
