#!/bin/bash

# ClickHouse Seed Runner
# Runs all SQL seed files in order via Docker

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

CLICKHOUSE_CONTAINER="${CLICKHOUSE_CONTAINER:-telemetryflow_core_clickhouse}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-telemetry}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🌱 Running ClickHouse seeds..."
echo "   Container: $CLICKHOUSE_CONTAINER"
echo "   Database: $CLICKHOUSE_DB"
echo ""

for seed in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$seed" ]; then
    filename=$(basename "$seed")
    echo "📝 Running seed: $filename"
    
    # Substitute environment variables in SQL
    sed "s/\${CLICKHOUSE_DB}/$CLICKHOUSE_DB/g" "$seed" | \
      docker exec -i "$CLICKHOUSE_CONTAINER" clickhouse-client --multiquery
    
    echo "   ✅ $filename completed"
    echo ""
  fi
done

echo "🎉 All ClickHouse seeds completed successfully!"
