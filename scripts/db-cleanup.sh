#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Database Cleanup - TelemetryFlow Core                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# PostgreSQL Cleanup
echo "🗑️  Cleaning PostgreSQL..."
docker exec -i telemetryflow_core_postgres psql -U postgres -d telemetryflow_db << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF
echo "✅ PostgreSQL cleaned"
echo ""

# ClickHouse Cleanup
echo "🗑️  Cleaning ClickHouse..."
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery << 'EOF'
DROP TABLE IF EXISTS telemetryflow_db.audit_logs;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_stats;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_user_activity;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_org_activity;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_5m;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_15m;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_1h;
DROP VIEW IF EXISTS telemetryflow_db.audit_logs_6h;
DROP TABLE IF EXISTS telemetryflow_db.logs;
DROP VIEW IF EXISTS telemetryflow_db.error_logs;
DROP VIEW IF EXISTS telemetryflow_db.recent_errors;
DROP VIEW IF EXISTS telemetryflow_db.logs_errors;
DROP VIEW IF EXISTS telemetryflow_db.logs_stats;
DROP TABLE IF EXISTS telemetryflow_db.metrics;
DROP VIEW IF EXISTS telemetryflow_db.metrics_1m;
DROP VIEW IF EXISTS telemetryflow_db.metrics_1h;
DROP TABLE IF EXISTS telemetryflow_db.traces;
DROP VIEW IF EXISTS telemetryflow_db.trace_statistics;
DROP VIEW IF EXISTS telemetryflow_db.slow_traces;
DROP VIEW IF EXISTS telemetryflow_db.traces_errors;
DROP VIEW IF EXISTS telemetryflow_db.traces_stats;
DROP TABLE IF EXISTS telemetryflow_db.schema_migrations;
DROP TABLE IF EXISTS telemetryflow_db.migrations;
EOF
echo "✅ ClickHouse cleaned"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✨ All databases cleaned successfully! ✨                ║"
echo "╚════════════════════════════════════════════════════════════╝"
