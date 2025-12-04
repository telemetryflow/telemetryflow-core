# OTEL Collector Exporter Examples

This directory contains example configurations for exporting telemetry data (logs, traces, metrics) to various backends.

## Available Exporters

### 1. **Loki** (`loki-exporter.yaml`)
- **Purpose**: Log aggregation and visualization with Grafana
- **Use Case**: Centralized logging, log queries, dashboards
- **Best For**: Teams using Grafana ecosystem

**Quick Setup:**
```yaml
# Add to otel-collector-config.yaml exporters section
loki:
  endpoint: http://loki:3100/loki/api/v1/push
  labels:
    attributes:
      service.name: "service_name"
      level: "level"

# Add to logs pipeline
logs:
  exporters: [debug, loki]
```

### 2. **OpenSearch** (`opensearch-exporter.yaml`)
- **Purpose**: Full-text search and log analytics
- **Use Case**: Log search, complex queries, compliance
- **Best For**: Large-scale log analysis, security monitoring

**Quick Setup:**
```yaml
# Add to otel-collector-config.yaml exporters section
opensearch:
  http:
    endpoint: http://opensearch:9200
  logs_index: telemetryflow-logs

# Add to logs pipeline
logs:
  exporters: [debug, opensearch]
```

### 3. **File** (`file-exporter.yaml`)
- **Purpose**: Export to local JSON files with rotation
- **Use Case**: Backup, debugging, offline analysis
- **Best For**: Development, testing, archival

**Quick Setup:**
```yaml
# Add to otel-collector-config.yaml exporters section
file/logs:
  path: /var/log/otel/logs.json
  rotation:
    max_megabytes: 100
    max_days: 7

# Add to logs pipeline
logs:
  exporters: [debug, file/logs]
```

### 4. **Kafka** (`kafka-exporter.yaml`)
- **Purpose**: Stream telemetry to Kafka topics
- **Use Case**: Real-time processing, event streaming
- **Best For**: Microservices, event-driven architectures

**Quick Setup:**
```yaml
# Add to otel-collector-config.yaml exporters section
kafka/logs:
  brokers: [kafka:9092]
  topic: telemetryflow.logs
  encoding: otlp_json

# Add to logs pipeline
logs:
  exporters: [debug, kafka/logs]
```

## Current Configuration

The main OTEL Collector configuration (`otel-collector-config.yaml`) currently exports to:

- ✅ **Debug** - Console output for development
- ✅ **Jaeger** - Distributed tracing UI
- ✅ **Prometheus** - Metrics scraping

## How to Enable Additional Exporters

### Step 1: Choose an Exporter
Review the example files and choose the backend that fits your needs.

### Step 2: Add Exporter Configuration
Copy the exporter configuration from the example file to `otel-collector-config.yaml` under the `exporters:` section.

### Step 3: Update Pipeline
Add the exporter name to the appropriate pipeline's `exporters` list:

```yaml
service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes]
      exporters: [debug, loki, opensearch]  # Add your exporters here
```

### Step 4: Add Backend Service
If needed, add the backend service to `docker-compose.yml`:

```yaml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  networks:
    - telemetryflow_core_net
```

### Step 5: Restart OTEL Collector
```bash
docker-compose restart otel-collector
```

## Multiple Exporters

You can export to multiple backends simultaneously:

```yaml
logs:
  receivers: [otlp]
  processors: [memory_limiter, batch, attributes]
  exporters: [debug, loki, opensearch, file/logs, kafka/logs]
```

This sends logs to:
- Console (debug)
- Grafana Loki
- OpenSearch
- Local files
- Kafka topics

## Performance Considerations

- **Batch Processing**: Adjust `batch.timeout` and `batch.send_batch_size` for your workload
- **Memory Limits**: Configure `memory_limiter` based on available resources
- **Network**: Ensure low latency to backend services
- **Compression**: Enable compression for Kafka/HTTP exporters to reduce bandwidth

## Troubleshooting

### Check OTEL Collector Logs
```bash
docker-compose logs otel-collector
```

### Verify Metrics
```bash
curl http://localhost:8889/metrics | grep exporter
```

### Test Connectivity
```bash
# Test Loki
curl http://localhost:3100/ready

# Test OpenSearch
curl http://localhost:9200/_cluster/health

# Test Kafka
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

## References

- [OTEL Collector Exporters](https://opentelemetry.io/docs/collector/configuration/#exporters)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
