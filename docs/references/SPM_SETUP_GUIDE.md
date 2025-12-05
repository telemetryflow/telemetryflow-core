# SPM Setup Guide - Jaeger v2.2.0 with Grafana

## ✅ Solution Summary

**Baseline Version**: Jaeger v2.2.0 (latest stable, v1 deprecated)

**Issue**: Jaeger v2.2.0 doesn't support Prometheus metrics storage natively yet.

**Mitigation**: Use **Grafana** for SPM visualization (production-ready solution)

## Architecture

```
┌─────────┐     ┌──────────────┐     ┌────────────┐     ┌───────────┐
│ Backend │────▶│ OTEL         │────▶│ Prometheus │────▶│  Grafana  │
│         │     │ Collector    │     │            │     │    SPM    │
└─────────┘     │ (spanmetrics)│     └────────────┘     └───────────┘
                └──────────────┘            │
                                            │
                                     ┌──────▼──────┐
                                     │   Jaeger    │
                                     │  (Traces)   │
                                     └─────────────┘
```

## Services & Ports

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| **Grafana** (SPM) | 3001 | http://localhost:3001 | admin/admin |
| **Jaeger** (Traces) | 16686 | http://localhost:16686 | - |
| **Prometheus** | 9090 | http://localhost:9090 | - |
| **OTEL Collector** | 8889 | http://localhost:8889/metrics | - |

## Quick Start

```bash
# Start all services
docker-compose up -d

# Access Grafana SPM Dashboard
open http://localhost:3001

# Access Jaeger for Traces
open http://localhost:16686

# Query Prometheus directly
open http://localhost:9090
```

## Available Span Metrics

All metrics have prefix: `telemetryflow_core_span_metrics_`

- `calls_total` - Total request count
- `duration_milliseconds_bucket` - Latency histogram buckets
- `duration_milliseconds_count` - Request count for latency
- `duration_milliseconds_sum` - Total latency sum

**Dimensions:**
- `service_name` - Service name
- `span_name` - Operation name
- `span_kind` - SPAN_KIND_SERVER, SPAN_KIND_CLIENT, SPAN_KIND_INTERNAL
- `http_method` - GET, POST, etc.
- `http_status_code` - 200, 404, 500, etc.
- `status_code` - STATUS_CODE_UNSET, STATUS_CODE_ERROR

## PromQL Queries for SPM

### Request Rate (RPS)
```promql
# Total requests per second
rate(telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_SERVER"}[5m])

# By endpoint
rate(telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_SERVER"}[5m]) by (span_name)

# By HTTP method
rate(telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_SERVER"}[5m]) by (http_method)
```

### Latency
```promql
# Average latency (ms)
rate(telemetryflow_core_span_metrics_duration_milliseconds_sum{span_kind="SPAN_KIND_SERVER"}[5m]) 
/ 
rate(telemetryflow_core_span_metrics_duration_milliseconds_count{span_kind="SPAN_KIND_SERVER"}[5m])

# P50 latency
histogram_quantile(0.50, rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket{span_kind="SPAN_KIND_SERVER"}[5m]))

# P95 latency
histogram_quantile(0.95, rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket{span_kind="SPAN_KIND_SERVER"}[5m]))

# P99 latency
histogram_quantile(0.99, rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket{span_kind="SPAN_KIND_SERVER"}[5m]))
```

### Error Rate
```promql
# Error rate
rate(telemetryflow_core_span_metrics_calls_total{status_code="STATUS_CODE_ERROR"}[5m])

# Error percentage
(
  rate(telemetryflow_core_span_metrics_calls_total{status_code="STATUS_CODE_ERROR"}[5m])
  /
  rate(telemetryflow_core_span_metrics_calls_total[5m])
) * 100
```

### RED Metrics (Rate, Errors, Duration)
```promql
# Rate
sum(rate(telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_SERVER"}[5m]))

# Errors
sum(rate(telemetryflow_core_span_metrics_calls_total{status_code="STATUS_CODE_ERROR"}[5m]))

# Duration (P95)
histogram_quantile(0.95, sum(rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket{span_kind="SPAN_KIND_SERVER"}[5m])) by (le))
```

## Configuration Files

### OTEL Collector
`config/otel/otel-collector-config-spm.yaml`
```yaml
connectors:
  spanmetrics:
    namespace: span.metrics
    dimensions:
      - name: http.method
      - name: http.status_code
    histogram:
      explicit:
        buckets: [0.002, 0.004, 0.006, 0.008, 0.01, 0.05, 0.1, 0.2, 0.4, 0.8, 1, 1.4, 2, 5, 10, 15]
```

### Grafana Datasource
`config/grafana/provisioning/datasources/prometheus.yaml`
```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

## Verification

```bash
# Check span metrics in OTEL Collector
curl http://localhost:8889/metrics | grep span_metrics_calls_total

# Check metrics in Prometheus
curl 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total' | jq '.data.result | length'

# Generate traffic
for i in {1..20}; do curl -s http://localhost:3000/health > /dev/null; sleep 1; done

# Check Grafana health
curl http://localhost:3001/api/health

# Check Jaeger health
curl http://localhost:16686/api/services
```

## Troubleshooting

### No metrics in Grafana
1. Check Prometheus has data: http://localhost:9090/graph
2. Verify OTEL collector is generating metrics: `curl http://localhost:8889/metrics | grep span_metrics`
3. Generate traffic to backend
4. Wait 15 seconds for metrics flush interval

### Grafana can't connect to Prometheus
1. Check both containers are on same network: `docker network inspect telemetryflow_core_net`
2. Verify Prometheus URL in datasource: `http://prometheus:9090`
3. Check Prometheus is healthy: `docker-compose ps prometheus`

### Jaeger shows no traces
1. Check OTEL collector is sending to Jaeger: `docker-compose logs otel-collector | grep jaeger`
2. Verify backend is sending traces: `docker-compose logs backend | grep trace_id`
3. Check Jaeger is receiving: `docker-compose logs jaeger | grep "Starting GRPC server"`

## Future: Native Jaeger v2 SPM

When Jaeger v2.3+ adds full Prometheus support:

1. Update `docker-compose.yml`:
   ```yaml
   jaeger:
     image: jaegertracing/jaeger:2.3.0  # or later
   ```

2. SPM will work in Jaeger UI automatically

3. Grafana remains as enhanced visualization option

## Benefits of This Approach

✅ **Production-ready** - Grafana is battle-tested for metrics visualization
✅ **Flexible** - Create custom dashboards for your needs
✅ **Powerful** - Advanced querying, alerting, annotations
✅ **Future-proof** - Works now, continues to work when Jaeger v2 SPM arrives
✅ **Consistent** - Same baseline (Jaeger v2.2.0) for everyone

## References

- [Jaeger v2 Documentation](https://www.jaegertracing.io/docs/latest/)
- [OpenTelemetry Span Metrics Connector](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/spanmetricsconnector)
- [Grafana Prometheus Datasource](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
