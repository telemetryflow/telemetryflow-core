# OTEL Metrics - Quick Start

Quick reference for accessing and using metrics in TelemetryFlow Core.

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **OTEL Collector** | http://localhost:8889/metrics | Raw Prometheus metrics |
| **Prometheus UI** | http://localhost:9090 | Query and visualize metrics |
| **Grafana** | http://localhost:3001 | Dashboards (if configured) |

## Quick Commands

### View All Metrics
```bash
curl http://localhost:8889/metrics
```

### Filter Specific Metrics
```bash
# HTTP metrics
curl -s http://localhost:8889/metrics | grep http_server

# Database metrics
curl -s http://localhost:8889/metrics | grep db_client

# OTEL Collector metrics
curl -s http://localhost:8889/metrics | grep otelcol
```

### Count Metrics
```bash
curl -s http://localhost:8889/metrics | grep "^# TYPE" | wc -l
```

## Key Metrics

### Application Performance
```promql
# Request rate (requests per second)
rate(http_server_duration_milliseconds_count[5m])

# Average response time
rate(http_server_duration_milliseconds_sum[5m]) / rate(http_server_duration_milliseconds_count[5m])

# Error rate
rate(http_server_duration_milliseconds_count{http_response_status_code=~"5.."}[5m])
```

### System Health
```promql
# Memory usage
process_memory_usage

# CPU usage
process_cpu_usage

# Active requests
http_server_active_requests
```

### OTEL Collector Health
```promql
# Spans received
rate(otelcol_receiver_accepted_spans_total[5m])

# Logs received
rate(otelcol_receiver_accepted_log_records_total[5m])

# Export failures
rate(otelcol_exporter_send_failed_spans_total[5m])
```

## Common Queries

### Top 5 Slowest Endpoints
```promql
topk(5, 
  rate(http_server_duration_milliseconds_sum[5m]) 
  / 
  rate(http_server_duration_milliseconds_count[5m])
)
```

### Request Rate by Status Code
```promql
sum by (http_response_status_code) (
  rate(http_server_duration_milliseconds_count[5m])
)
```

### 95th Percentile Response Time
```promql
histogram_quantile(0.95, 
  rate(http_server_duration_milliseconds_bucket[5m])
)
```

## Troubleshooting

### No Metrics Showing
```bash
# 1. Check OTEL is enabled
docker-compose logs backend | grep OTEL

# 2. Check OTEL Collector is running
docker-compose ps otel-collector

# 3. Check metrics endpoint
curl http://localhost:8889/metrics | head

# 4. Check Prometheus targets
# Open http://localhost:9090/targets
```

### Metrics Delayed
```bash
# Check batch timeout (default 10s)
# Edit config/otel/otel-collector-config.yaml
processors:
  batch:
    timeout: 2s  # Reduce for faster export
```

## Configuration Files

- **OTEL Collector**: `config/otel/otel-collector-config.yaml`
- **Prometheus**: `config/prometheus/prometheus.yml`
- **Backend OTEL**: `src/otel/tracing.ts`
- **Environment**: `.env` (OTEL_ENABLED, OTEL_EXPORTER_OTLP_ENDPOINT)

## Next Steps

1. **View metrics**: Open http://localhost:9090
2. **Create dashboards**: Import Grafana dashboards
3. **Set up alerts**: Configure Prometheus alerts
4. **Add custom metrics**: See [OTEL_METRICS.md](./OTEL_METRICS.md)

## Full Documentation

See [OTEL_METRICS.md](./OTEL_METRICS.md) for complete guide.
