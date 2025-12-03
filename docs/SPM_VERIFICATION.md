# SPM Verification Guide

## Quick Verification

```bash
# Run verification script
bash scripts/verify-spm.sh
```

## Manual Verification Steps

### 1. Check OTEL Collector Metrics
```bash
curl http://localhost:8889/metrics | grep span_metrics_calls_total
```
**Expected**: Should show multiple metrics with counts

### 2. Check Prometheus
```bash
curl 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total' | jq '.data.result | length'
```
**Expected**: Number > 0 (e.g., 13)

### 3. Check Grafana
```bash
curl http://localhost:3001/api/health
```
**Expected**: `{"database":"ok","version":"...","commit":"..."}`

### 4. Check Jaeger
```bash
curl http://localhost:16686/api/services | jq '.data'
```
**Expected**: List of services including "telemetryflow-core"

### 5. Generate Traffic
```bash
for i in {1..10}; do curl -s http://localhost:3000/health > /dev/null; sleep 1; done
```

### 6. Wait for Metrics Flush
```bash
sleep 15
```

### 7. Verify Metrics Increased
```bash
curl 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total' | jq '.data.result[0:3]'
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana (SPM)** | http://localhost:3001 | admin/admin |
| **Jaeger (Traces)** | http://localhost:16686 | - |
| **Prometheus** | http://localhost:9090 | - |
| **OTEL Metrics** | http://localhost:8889/metrics | - |

## Sample PromQL Queries

### Request Rate
```promql
rate(telemetryflow_core_span_metrics_calls_total[5m])
```

### Average Latency
```promql
rate(telemetryflow_core_span_metrics_duration_milliseconds_sum[5m]) 
/ 
rate(telemetryflow_core_span_metrics_duration_milliseconds_count[5m])
```

### P95 Latency
```promql
histogram_quantile(0.95, 
  rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket[5m])
)
```

### P99 Latency
```promql
histogram_quantile(0.99, 
  rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket[5m])
)
```

## Grafana Dashboard

1. Open http://localhost:3001
2. Login: admin/admin
3. Go to Dashboards
4. Create new dashboard
5. Add panel with PromQL queries above

## Troubleshooting

### No metrics in Prometheus
```bash
# Check OTEL collector logs
docker-compose logs otel-collector | grep spanmetrics

# Restart OTEL collector
docker-compose restart otel-collector
```

### Grafana can't query Prometheus
```bash
# Check datasource
curl -u admin:admin http://localhost:3001/api/datasources

# Test connection
curl -u admin:admin 'http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up'
```

### No traffic/spans
```bash
# Check backend is running
docker-compose ps backend

# Generate traffic
for i in {1..20}; do curl http://localhost:3000/health; sleep 1; done
```

## Success Criteria

✅ OTEL Collector shows span metrics
✅ Prometheus has 10+ metric series  
✅ Grafana is healthy and can query Prometheus
✅ Jaeger shows traces
✅ Metrics increase after generating traffic

## Next Steps

1. Create custom Grafana dashboards
2. Set up alerting rules
3. Add more span dimensions
4. Configure retention policies
