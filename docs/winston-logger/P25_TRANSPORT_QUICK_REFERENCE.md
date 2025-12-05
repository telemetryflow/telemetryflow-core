# P25 Winston Transports - Quick Reference

## Enable/Disable Transports

### Console (Always Enabled)
```env
LOG_PRETTY_PRINT=true    # Pretty format for dev
LOG_COLORIZE=true        # Colorized output
```

### OpenTelemetry
```env
OTEL_LOGS_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### File Rotation
```env
LOG_FILE_ENABLED=true
LOG_FILE_DIRNAME=logs
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
```

### Loki (Grafana)
```env
LOKI_ENABLED=true
LOKI_HOST=http://loki:3100
LOKI_USERNAME=admin      # Optional
LOKI_PASSWORD=secret     # Optional
```

### FluentBit
```env
FLUENTBIT_ENABLED=true
FLUENTBIT_HOST=fluentbit
FLUENTBIT_PORT=24224
```

### OpenSearch
```env
OPENSEARCH_ENABLED=true
OPENSEARCH_NODE=http://opensearch:9200
OPENSEARCH_USERNAME=admin    # Optional
OPENSEARCH_PASSWORD=admin    # Optional
```

## Installation Commands

```bash
# All transports (already installed)
pnpm add winston-daily-rotate-file winston-loki fluent-logger @opensearch-project/opensearch winston-elasticsearch

# Individual transports
pnpm add winston-daily-rotate-file  # File rotation
pnpm add winston-loki                # Loki
pnpm add fluent-logger               # FluentBit
pnpm add @opensearch-project/opensearch winston-elasticsearch  # OpenSearch
```

## Common Configurations

### Development
```env
LOGGER_TYPE=winston
LOG_LEVEL=debug
LOG_PRETTY_PRINT=true
LOG_FILE_ENABLED=false
OTEL_LOGS_ENABLED=true
```

### Production
```env
LOGGER_TYPE=winston
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_FILE_ENABLED=true
OTEL_LOGS_ENABLED=true
LOKI_ENABLED=true
OPENSEARCH_ENABLED=true
```

### High-Volume
```env
LOGGER_TYPE=winston
LOG_LEVEL=warn
FLUENTBIT_ENABLED=true
OPENSEARCH_ENABLED=true
```

## Docker Services

### Loki
```yaml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
```

### FluentBit
```yaml
fluentbit:
  image: fluent/fluent-bit:latest
  ports:
    - "24224:24224"
```

### OpenSearch
```yaml
opensearch:
  image: opensearchproject/opensearch:latest
  ports:
    - "9200:9200"
  environment:
    - discovery.type=single-node
    - OPENSEARCH_INITIAL_ADMIN_PASSWORD=Admin@123
```

## Testing Connectivity

```bash
# Loki
curl http://localhost:3100/ready

# FluentBit
nc -zv localhost 24224

# OpenSearch
curl http://localhost:9200
curl -u admin:Admin@123 http://localhost:9200/_cluster/health
```

## Query Logs

### Loki (LogQL)
```bash
# All logs
curl 'http://localhost:3100/loki/api/v1/query?query={app="telemetryflow"}'

# Error logs only
curl 'http://localhost:3100/loki/api/v1/query?query={app="telemetryflow",level="error"}'

# With time range
curl 'http://localhost:3100/loki/api/v1/query_range?query={app="telemetryflow"}&start=1h'
```

### OpenSearch
```bash
# All logs
curl http://localhost:9200/telemetryflow-logs-*/_search?pretty

# Error logs only
curl -X POST http://localhost:9200/telemetryflow-logs-*/_search?pretty -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "level": "error" }
  }
}'

# With trace ID
curl -X POST http://localhost:9200/telemetryflow-logs-*/_search?pretty -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "traceId": "abc123..." }
  }
}'
```

## Troubleshooting

### Transport Not Working
1. Check package: `pnpm list <package-name>`
2. Check config: `env | grep <TRANSPORT>`
3. Check service: `curl <service-url>`
4. Enable debug: `LOG_LEVEL=debug`

### Common Errors

**"winston-loki not installed"**
```bash
pnpm add winston-loki
```

**"Connection refused"**
- Check service is running: `docker ps`
- Check port is correct
- Check firewall rules

**"Authentication failed"**
- Verify username/password
- Check service security settings

## Performance Tips

1. **Use batching** for high-volume logs (Loki, OpenSearch)
2. **Set appropriate log level** (warn/error in production)
3. **Enable sampling** for high-traffic endpoints
4. **Use FluentBit** for log aggregation and forwarding
5. **Rotate files** to prevent disk space issues

## See Also

- [P25 Transport Implementation](./P25_TRANSPORT_IMPLEMENTATION.md) - Full documentation
- [P25 Quick Start](./P25_QUICK_START.md) - Getting started guide
- [Winston Logger](./WINSTON_LOGGER.md) - Logger documentation
