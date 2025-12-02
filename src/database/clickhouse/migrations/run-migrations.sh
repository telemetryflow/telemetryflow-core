#!/bin/bash

# ClickHouse Migration Runner
# Runs all SQL migrations in order

set -e

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-localhost}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-8123}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Running ClickHouse migrations..."
echo "   Host: $CLICKHOUSE_HOST:$CLICKHOUSE_PORT"
echo ""

for migration in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "📝 Running migration: $filename"
    
    if [ -n "$CLICKHOUSE_PASSWORD" ]; then
      clickhouse-client --host="$CLICKHOUSE_HOST" --port="$CLICKHOUSE_PORT" \
        --user="$CLICKHOUSE_USER" --password="$CLICKHOUSE_PASSWORD" \
        --multiquery < "$migration"
    else
      clickhouse-client --host="$CLICKHOUSE_HOST" --port="$CLICKHOUSE_PORT" \
        --user="$CLICKHOUSE_USER" --multiquery < "$migration"
    fi
    
    echo "   ✅ $filename completed"
    echo ""
  fi
done

echo "🎉 All ClickHouse migrations completed successfully!"
