# Service Performance Monitoring (SPM) with Jaeger

Complete guide for Service Performance Monitoring in TelemetryFlow Core using Jaeger and OpenTelemetry.

## Overview

SPM (Service Performance Monitoring) provides RED metrics (Rate, Errors, Duration) derived from distributed traces, enabling performance analysis without additional instrumentation.

## Architecture

```
Application → OTEL SDK → OTEL Collector → Jaeger
                              ↓
                         Span Metrics Processor
                              ↓
                         Prometheus ← Jaeger SPM
```

## Features

### RED Metrics

1. **Rate** - Request throughput (requests per second)
2. **Errors** - Error rate and count
3. **Duration** - Latency percentiles (P50, P95, P99)

### Dimensions

- Service name
- Operation name
- HTTP method
- HTTP status code
- Span kind (SERVER, CLIENT, INTERNAL)

## Configuration

### 1. OTEL Collector (Span Metrics Processor)

The OTEL Collector generates metrics from spans:

```yaml
processors:
  spanmetrics:
    metrics_exporter: prometheus
    latency_histogram_buckets: [2ms, 4ms, 6ms, 8ms, 10ms, 50ms, 100ms, 200ms, 400ms, 800ms, 1s, 1400ms, 2s, 5s, 10s, 15s]
    dimensions:
      - name: http.method
        default: GET
      - name: http.status_code
      - name: service.name
      - name: operation
      - name: span.kind
    dimensions_cache_size: 1000
    aggregation_temporality: "AGGREGATION_TEMPORALITY_CUMULATIVE"
    metrics_flush_interval: 15s
```

**Metrics Generated:**
- `calls_total` - Total number of spans
- `latency` - Latency histogram
- `duration_milliseconds` - Duration in milliseconds

### 2. Jaeger Configuration

Jaeger connects to Prometheus to query span metrics:

```yaml
environment:
  - METRICS_STORAGE_TYPE=prometheus
  - PROMETHEUS_SERVER_URL=http://prometheus:9090
  - PROMETHEUS_QUERY_SUPPORT_SPANMETRICS_CONNECTOR=true
  - PROMETHEUS_QUERY_NAMESPACE=telemetryflow_core
  - PROMETHEUS_QUERY_DURATION_UNIT=ms
```

### 3. Prometheus Scraping

Prometheus scrapes metrics from OTEL Collector:

```yaml
scrape_configs:
  - job_name: 'otel-collector'
    scrape_interval: 15s
    static_configs:
      - targets: ['otel-collector:8889']
```

## Setup

### 1. Start Services

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Verify OTEL Collector

```bash
# Check OTEL Collector health
curl http://localhost:13133/

# Check span metrics endpoint
curl http://localhost:8889/metrics | grep calls_total
```

### 3. Verify Prometheus

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Query span metrics
curl 'http://localhost:9090/api/v1/query?query=calls_total'
```

### 4. Access Jaeger UI

Open browser: http://localhost:16686

Navigate to: **Monitor** tab → **Service Performance Monitoring**

## Using SPM in Jaeger

### 1. Service Overview

**Monitor Tab** shows:
- Request rate (req/s)
- Error rate (%)
- P50, P95, P99 latency
- Service dependency graph

### 2. Operation Metrics

View metrics per operation:
- HTTP endpoints (GET /api/users, POST /api/roles)
- Database queries
- External API calls

### 3. Time Range Selection

- Last 5 minutes
- Last 15 minutes
- Last 1 hour
- Custom range

### 4. Filtering

Filter by:
- Service name
- Operation name
- HTTP method
- Status code

## Metrics Available

### Call Rate

```promql
# Total calls per second
rate(calls_total{service_name="telemetryflow-core"}[5m])

# Calls by operation
rate(calls_total{service_name="telemetryflow-core", operation="GET /api/users"}[5m])

# Calls by HTTP method
rate(calls_total{service_name="telemetryflow-core", http_method="POST"}[5m])
```

### Error Rate

```promql
# Error rate percentage
(
  rate(calls_total{service_name="telemetryflow-core", http_status_code=~"5.."}[5m])
  /
  rate(calls_total{service_name="telemetryflow-core"}[5m])
) * 100

# Error count
sum(rate(calls_total{service_name="telemetryflow-core", http_status_code=~"5.."}[5m]))
```

### Latency

```promql
# P50 latency
histogram_quantile(0.50, 
  rate(latency_bucket{service_name="telemetryflow-core"}[5m])
)

# P95 latency
histogram_quantile(0.95, 
  rate(latency_bucket{service_name="telemetryflow-core"}[5m])
)

# P99 latency
histogram_quantile(0.99, 
  rate(latency_bucket{service_name="telemetryflow-core"}[5m])
)

# Average latency
rate(latency_sum{service_name="telemetryflow-core"}[5m])
/
rate(latency_count{service_name="telemetryflow-core"}[5m])
```

### Duration by Operation

```promql
# Average duration per operation
avg by (operation) (
  rate(duration_milliseconds_sum{service_name="telemetryflow-core"}[5m])
  /
  rate(duration_milliseconds_count{service_name="telemetryflow-core"}[5m])
)
```

## Grafana Dashboards

### Import SPM Dashboard

1. Open Grafana: http://localhost:3001
2. Go to Dashboards → Import
3. Use dashboard ID: **15983** (Jaeger SPM)
4. Select Prometheus data source
5. Click Import

### Custom Queries

**Request Rate Panel:**
```promql
sum(rate(calls_total{service_name="telemetryflow-core"}[5m])) by (operation)
```

**Error Rate Panel:**
```promql
sum(rate(calls_total{service_name="telemetryflow-core", http_status_code=~"5.."}[5m])) by (operation)
```

**Latency Heatmap:**
```promql
sum(rate(latency_bucket{service_name="telemetryflow-core"}[5m])) by (le, operation)
```

## Alerting

### Prometheus Alert Rules

```yaml
groups:
  - name: spm_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(calls_total{service_name="telemetryflow-core", http_status_code=~"5.."}[5m]))
            /
            sum(rate(calls_total{service_name="telemetryflow-core"}[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for telemetryflow-core"

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(latency_bucket{service_name="telemetryflow-core"}[5m])
          ) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency detected"
          description: "P95 latency is {{ $value }}ms for telemetryflow-core"

      # Low request rate (possible downtime)
      - alert: LowRequestRate
        expr: |
          sum(rate(calls_total{service_name="telemetryflow-core"}[5m])) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low request rate detected"
          description: "Request rate is {{ $value }} req/s for telemetryflow-core"
```

## Troubleshooting

### SPM Not Showing in Jaeger

1. **Check OTEL Collector logs:**
   ```bash
   docker logs telemetryflow_core_otel
   ```

2. **Verify span metrics are generated:**
   ```bash
   curl http://localhost:8889/metrics | grep calls_total
   ```

3. **Check Prometheus scraping:**
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

4. **Verify Jaeger can reach Prometheus:**
   ```bash
   docker exec telemetryflow_core_jaeger wget -O- http://prometheus:9090/api/v1/query?query=up
   ```

### No Metrics Data

1. **Generate traffic:**
   ```bash
   # Make some API requests
   curl http://localhost:3000/api/v2/users
   curl http://localhost:3000/api/v2/roles
   ```

2. **Wait for metrics flush (15 seconds)**

3. **Check if spans are being sent:**
   ```bash
   docker logs telemetryflow_core_backend | grep trace
   ```

### Metrics Not Updating

1. **Check OTEL Collector pipeline:**
   ```bash
   curl http://localhost:13133/
   ```

2. **Verify Prometheus is scraping:**
   ```bash
   curl 'http://localhost:9090/api/v1/query?query=up{job="otel-collector"}'
   ```

3. **Restart services:**
   ```bash
   docker-compose restart otel-collector prometheus jaeger
   ```

## Best Practices

### 1. Cardinality Management

Limit dimensions to avoid high cardinality:
- Use operation names, not full URLs
- Group similar operations
- Avoid user IDs or session IDs in dimensions

### 2. Histogram Buckets

Choose buckets based on your SLOs:
```yaml
# For fast APIs (< 100ms target)
latency_histogram_buckets: [2ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s]

# For slower APIs (< 1s target)
latency_histogram_buckets: [10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2s, 5s, 10s]
```

### 3. Sampling

For high-traffic services, use sampling:
```yaml
# In OTEL SDK configuration
sampler:
  type: parentbased_traceidratio
  arg: 0.1  # Sample 10% of traces
```

### 4. Retention

Configure Prometheus retention:
```yaml
# In prometheus.yml
storage:
  tsdb:
    retention.time: 15d
    retention.size: 10GB
```

## Performance Impact

### Resource Usage

- **OTEL Collector**: +50MB memory, +5% CPU
- **Prometheus**: +100MB memory per 1M active series
- **Jaeger**: Minimal (queries Prometheus)

### Optimization

1. **Reduce flush interval** for lower latency:
   ```yaml
   metrics_flush_interval: 5s  # Default: 15s
   ```

2. **Increase batch size** for higher throughput:
   ```yaml
   batch:
     send_batch_size: 2048  # Default: 1024
   ```

3. **Use aggregation** for high cardinality:
   ```yaml
   dimensions_cache_size: 10000  # Default: 1000
   ```

## Related Documentation

- [OBSERVABILITY.md](./OBSERVABILITY.md) - Observability overview
- [CLICKHOUSE_LOGGING.md](./CLICKHOUSE_LOGGING.md) - Log storage
- [Jaeger SPM Docs](https://www.jaegertracing.io/docs/latest/spm/)
- [OTEL Span Metrics](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/spanmetricsprocessor)

---

**Status**: ✅ Configured
**Jaeger UI**: http://localhost:16686
**Prometheus**: http://localhost:9090
**Last Updated**: 2025-12-04
