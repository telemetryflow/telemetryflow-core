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

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ClickHouse Seeds - TelemetryFlow Core            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   • Container: $CLICKHOUSE_CONTAINER"
echo "   • Database:  $CLICKHOUSE_DB"
echo ""

seed_count=$(find "$SCRIPT_DIR" -name "*.sql" -type f | wc -l | tr -d ' ')
echo "🌱 Found $seed_count seed file(s) to run"
echo ""

counter=1
for seed in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$seed" ]; then
    filename=$(basename "$seed")
    echo "[$counter/$seed_count] 📦 Seeding: $filename"
    
    # Substitute environment variables in SQL
    sed "s/\${CLICKHOUSE_DB}/$CLICKHOUSE_DB/g" "$seed" | \
      docker exec -i "$CLICKHOUSE_CONTAINER" clickhouse-client --multiquery
    
    echo "[$counter/$seed_count] ✅ Completed: $filename"
    echo ""
    ((counter++))
  fi
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    ✨ All ClickHouse seeds completed successfully! ✨      ║"
echo "╚════════════════════════════════════════════════════════════╝"
