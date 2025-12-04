# Prometheus Configuration

Prometheus configuration for TelemetryFlow Core metrics collection.

## Files

- `prometheus.yml` - Prometheus server configuration

## Scrape Targets

1. **otel-collector** (port 8889)
   - Metrics exported from OTEL Collector
   - Namespace: `telemetryflow_core`

2. **otel-collector-internal** (port 8888)
   - OTEL Collector internal metrics
   - Health and performance monitoring

3. **prometheus** (port 9090)
   - Prometheus self-monitoring

## Usage

Mounted in Docker Compose:
```yaml
volumes:
  - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
```

## Access

- Prometheus UI: http://localhost:9090
- Metrics endpoint: http://localhost:9090/metrics

## Query Examples

```promql
# OTEL Collector metrics
rate(telemetryflow_core_requests_total[5m])

# Memory usage
process_resident_memory_bytes{job="otel-collector"}
```
