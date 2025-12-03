#!/bin/bash

echo "=========================================="
echo "SPM Verification Script"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check OTEL Collector
echo "1. Checking OTEL Collector..."
if curl -s http://localhost:8889/metrics | grep -q "telemetryflow_core_span_metrics_calls_total"; then
    echo -e "${GREEN}✓ OTEL Collector generating span metrics${NC}"
else
    echo -e "${RED}✗ OTEL Collector NOT generating metrics${NC}"
    exit 1
fi

# 2. Check Prometheus
echo "2. Checking Prometheus..."
METRIC_COUNT=$(curl -s 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total' | jq '.data.result | length')
if [ "$METRIC_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Prometheus has $METRIC_COUNT span metrics${NC}"
else
    echo -e "${RED}✗ Prometheus has NO metrics${NC}"
    exit 1
fi

# 3. Check Grafana
echo "3. Checking Grafana..."
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Grafana is healthy${NC}"
else
    echo -e "${RED}✗ Grafana NOT healthy${NC}"
    exit 1
fi

# 4. Check Jaeger
echo "4. Checking Jaeger..."
SERVICE_COUNT=$(curl -s 'http://localhost:16686/api/services' | jq '.data | length')
if [ "$SERVICE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Jaeger has $SERVICE_COUNT services${NC}"
else
    echo -e "${YELLOW}⚠ Jaeger has no services (generate traffic)${NC}"
fi

# 5. Generate traffic
echo "5. Generating traffic..."
for i in {1..5}; do
    curl -s http://localhost:3000/health > /dev/null
    echo -n "."
done
echo -e "\n${GREEN}✓ Traffic generated${NC}"

# 6. Wait for flush
echo "6. Waiting 15s for metrics flush..."
sleep 15

# 7. Verify metrics
echo "7. Verifying span metrics..."
INTERNAL_SPANS=$(curl -s 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_INTERNAL"}' | jq '.data.result | length')
if [ "$INTERNAL_SPANS" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $INTERNAL_SPANS internal span metrics${NC}"
    echo ""
    echo "Sample metrics:"
    curl -s 'http://localhost:9090/api/v1/query?query=telemetryflow_core_span_metrics_calls_total{span_kind="SPAN_KIND_INTERNAL"}' | jq -r '.data.result[0:3][] | "  - \(.metric.span_name): \(.value[1]) calls"'
else
    echo -e "${RED}✗ No span metrics found${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ SPM IS WORKING!${NC}"
echo "=========================================="
echo ""
echo "Access:"
echo "  • Grafana:    http://localhost:3001 (admin/admin)"
echo "  • Jaeger:     http://localhost:16686"
echo "  • Prometheus: http://localhost:9090"
echo ""
echo "PromQL Examples:"
echo "  rate(telemetryflow_core_span_metrics_calls_total[5m])"
echo "  histogram_quantile(0.95, rate(telemetryflow_core_span_metrics_duration_milliseconds_bucket[5m]))"
echo ""
