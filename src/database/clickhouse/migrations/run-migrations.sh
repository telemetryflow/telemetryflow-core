#!/bin/bash

# ClickHouse Migration Runner
# Runs all SQL migrations in order via Docker

set -e

CLICKHOUSE_CONTAINER="${CLICKHOUSE_CONTAINER:-telemetryflow_core_clickhouse}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Running ClickHouse migrations..."
echo "   Container: $CLICKHOUSE_CONTAINER"
echo ""

for migration in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "📝 Running migration: $filename"
    
    docker exec -i "$CLICKHOUSE_CONTAINER" clickhouse-client --multiquery < "$migration"
    
    echo "   ✅ $filename completed"
    echo ""
  fi
done

echo "🎉 All ClickHouse migrations completed successfully!"
