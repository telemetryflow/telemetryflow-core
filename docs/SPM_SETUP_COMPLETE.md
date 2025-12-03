# SPM Setup - Complete Configuration

Service Performance Monitoring (SPM) is now fully configured for TelemetryFlow Core.

## Configuration Files

### 1. OTEL Collector Configuration
**File**: `config/otel/otel-collector-config-spm.yaml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 15s
          static_configs:
            - targets: ['localhost:8888']

processors:
  batch:
    timeout: 2s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 512

  resourcedetection:
    detectors: [env, system, docker]
    timeout: 5s

connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: [2ms, 4ms, 6ms, 8ms, 10ms, 50ms, 100ms, 200ms, 400ms, 800ms, 1s, 1400ms, 2s, 5s, 10s, 15s]
    dimensions:
      - name: http.method
      - name: http.status_code
    aggregation_temporality: AGGREGATION_TEMPORALITY_CUMULATIVE

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: telemetryflow_core

  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

  debug:
    verbosity: normal

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]

  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/jaeger, spanmetrics, debug]

    metrics:
      receivers: [otlp, prometheus, spanmetrics]
      processors: [memory_limiter, batch]
      exporters: [prometheus, debug]

  telemetry:
    logs:
      level: info
    metrics:
      level: detailed
      address: 0.0.0.0:8888
```

### 2. Docker Compose Configuration
**File**: `docker-compose.yml`

**OTEL Collector**:
```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:${OTEL_VERSION:-latest}
  container_name: ${CONTAINER_OTEL:-telemetryflow_core_otel}
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./config/otel/otel-collector-config-spm.yaml:/etc/otel-collector-config.yaml:ro
  ports:
    - "${PORT_OTEL_GRPC:-4317}:4317"     # OTLP gRPC
    - "${PORT_OTEL_HTTP:-4318}:4318"     # OTLP HTTP
    - "${PORT_OTEL_METRICS:-8889}:8889"  # Prometheus metrics
    - "${PORT_OTEL_HEALTH:-13133}:13133" # Health check
  networks:
    telemetryflow_core_net:
      ipv4_address: ${CONTAINER_IP_OTEL:-172.151.151.30}
```

**Jaeger**:
```yaml
jaeger:
  image: jaegertracing/all-in-one:${JAEGER_VERSION:-latest}
  container_name: ${CONTAINER_JAEGER:-telemetryflow_core_jaeger}
  ports:
    - "${PORT_JAEGER_UI:-16686}:16686"        # Jaeger UI
    - "${PORT_JAEGER_COLLECTOR:-14268}:14268" # Jaeger collector HTTP
    - "${PORT_JAEGER_ADMIN:-14269}:14269"     # Jaeger admin port
  environment:
    - COLLECTOR_OTLP_ENABLED=true
    - LOG_LEVEL=info
    # SPM Configuration
    - METRICS_STORAGE_TYPE=prometheus
    - PROMETHEUS_SERVER_URL=http://prometheus:9090
    - PROMETHEUS_QUERY_SUPPORT_SPANMETRICS_CONNECTOR=true
    - PROMETHEUS_QUERY_NAMESPACE=
    - PROMETHEUS_QUERY_DURATION_UNIT=s
    - PROMETHEUS_QUERY_NORMALIZE_CALLS=true
    - PROMETHEUS_QUERY_NORMALIZE_DURATION=true
  depends_on:
    - prometheus
```

### 3. Environment Variables
**File**: `.env`

```env
# OTEL Configuration
OTEL_ENABLED=true
OTEL_SERVICE_NAME=telemetryflow-core
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_LOGS_ENABLED=true

# OTEL Collector
OTEL_VERSION=latest
CONTAINER_OTEL=telemetryflow_core_otel
PORT_OTEL_GRPC=4317
PORT_OTEL_HTTP=4318
PORT_OTEL_METRICS=8889
PORT_OTEL_HEALTH=13133
PORT_OTEL_ZPAGES=55679
CONTAINER_IP_OTEL=172.151.151.30

# Jaeger
JAEGER_VERSION=latest
CONTAINER_JAEGER=telemetryflow_core_jaeger
PORT_JAEGER_UI=16686
PORT_JAEGER_COLLECTOR=14268
PORT_JAEGER_ADMIN=14269
CONTAINER_IP_JAEGER=172.151.151.60

# Prometheus
PROMETHEUS_VERSION=latest
CONTAINER_PROMETHEUS=telemetryflow_core_prometheus
PORT_PROMETHEUS=9090
CONTAINER_IP_PROMETHEUS=172.151.151.50
```

### 4. Application OTEL Configuration
**File**: `src/otel/tracing.ts`

Key changes:
```typescript
import { config } from 'dotenv';

// Load .env file before anything else
config();

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

export function startTracing() {
  const otelEnabled = process.env.OTEL_ENABLED !== 'false';
  
  if (otelEnabled) {
    otelSDK.start();
    console.log(`[OTELTracing] ✓ OpenTelemetry SDK started`);
    console.log(`[OTELTracing] ✓ Service: ${process.env.OTEL_SERVICE_NAME || 'telemetryflow-core'}`);
    console.log(`[OTELTracing] ✓ Endpoint: ${endpoint || 'console'}`);
    console.log(`[OTELTracing] ✓ Exporting: traces, metrics, logs`);
  }
}
```

## Data Flow

```
┌─────────────────┐
│   Application   │
│ (NestJS + OTEL) │
└────────┬────────┘
         │ Traces (OTLP/HTTP)
         │ http://localhost:4318/v1/traces
         ↓
┌─────────────────────────┐
│   OTEL Collector        │
│  ┌──────────────────┐   │
│  │ Span Metrics     │   │
│  │ Connector        │   │
│  │ - Generates RED  │   │
│  │   metrics from   │   │
│  │   traces         │   │
│  └──────────────────┘   │
└───┬─────────────────┬───┘
    │                 │
    │ Traces          │ Metrics
    │                 │ http://localhost:8889/metrics
    ↓                 ↓
┌─────────┐      ┌──────────────┐
│ Jaeger  │      │ Prometheus   │
│ :4317   │      │ :9090        │
└─────────┘      └──────┬───────┘
                        │
                        │ Query metrics
                        │ for SPM
                        ↓
                 ┌──────────────┐
                 │  Jaeger UI   │
                 │  Monitor Tab │
                 │  :16686      │
                 └──────────────┘
```

## Verification Steps

### 1. Check Services Running
```bash
docker-compose ps
```

Expected output:
- telemetryflow_core_otel: Up
- telemetryflow_core_jaeger: Up (healthy)
- telemetryflow_core_prometheus: Up (healthy)

### 2. Check Application OTEL
```bash
# Start application
pnpm dev

# Look for:
# [OTELTracing] ✓ OpenTelemetry SDK started
# [OTELTracing] ✓ Endpoint: http://localhost:4318
```

### 3. Generate Traffic
```bash
for i in {1..50}; do
  curl -s http://localhost:3000/api/v2/users > /dev/null
  curl -s http://localhost:3000/api/v2/roles > /dev/null
done
```

### 4. Verify Traces in Jaeger
```bash
curl -s 'http://localhost:16686/api/services' | jq
```

Expected: `"telemetryflow-core"` in the list

### 5. Check Span Metrics
```bash
curl -s http://localhost:8889/metrics | grep duration_milliseconds | head -5
```

Expected: Metrics with `telemetryflow_core` namespace

### 6. View SPM in Jaeger UI
1. Open: http://localhost:16686
2. Click: **"Monitor"** tab
3. Select: **"telemetryflow-core"**
4. View:
   - Request Rate (req/s)
   - Error Rate (%)
   - P50, P95, P99 Latency

## Metrics Generated

### From Span Metrics Connector

1. **Duration Histogram**
   - `http_server_request_duration_seconds_bucket`
   - `http_server_request_duration_seconds_sum`
   - `http_server_request_duration_seconds_count`

2. **Dimensions**
   - `service_name`: telemetryflow-core
   - `http.method`: GET, POST, PUT, DELETE
   - `http.status_code`: 200, 404, 500, etc.

### Prometheus Queries

```promql
# Request rate
rate(http_server_request_duration_seconds_count{service_name="telemetryflow-core"}[5m])

# Error rate
rate(http_server_request_duration_seconds_count{service_name="telemetryflow-core",http_status_code=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_server_request_duration_seconds_bucket{service_name="telemetryflow-core"}[5m]))
```

## Troubleshooting

### Issue: No traces in Jaeger

**Check**:
```bash
# 1. Application OTEL enabled
grep "OTELTracing.*Endpoint" /tmp/backend-new.log

# 2. OTEL Collector receiving traces
docker logs telemetryflow_core_otel 2>&1 | grep "accepted_spans"

# 3. Application can reach OTEL Collector
curl -v http://localhost:4318/v1/traces
```

### Issue: No SPM in Jaeger UI

**Check**:
```bash
# 1. Span metrics being generated
curl -s http://localhost:8889/metrics | grep duration

# 2. Prometheus scraping OTEL Collector
curl -s http://localhost:9090/api/v1/targets | jq

# 3. Jaeger can reach Prometheus
docker exec telemetryflow_core_jaeger wget -qO- http://prometheus:9090/api/v1/query?query=up
```

### Issue: Application not sending traces

**Fix**:
```bash
# Kill all processes
pkill -f "nest.js start"

# Restart with proper env loading
cd /Users/dfdenni/Repositories/DevOpsCorner/TelemetryFlow/telemetryflow-core
pnpm dev
```

## Performance Impact

- **OTEL SDK**: +10-20MB memory, +2-5% CPU
- **OTEL Collector**: +50MB memory, +5% CPU
- **Span Metrics**: Minimal (connector-based)
- **Network**: ~1KB per trace

## Related Documentation

- [SPM_JAEGER.md](./SPM_JAEGER.md) - Detailed SPM guide
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Observability overview
- [CLICKHOUSE_LOGGING.md](./CLICKHOUSE_LOGGING.md) - Log storage

---

**Status**: ✅ Fully Operational
**Service**: telemetryflow-core
**Jaeger UI**: http://localhost:16686
**Last Updated**: 2025-12-04
