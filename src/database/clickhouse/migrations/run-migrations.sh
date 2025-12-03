#!/bin/bash

# ClickHouse Migration Runner
# Runs all SQL migrations in order via Docker

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

CLICKHOUSE_CONTAINER="${CLICKHOUSE_CONTAINER:-telemetryflow_core_clickhouse}"
CLICKHOUSE_DB="${CLICKHOUSE_DB:-telemetry}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ClickHouse Migrations - TelemetryFlow Core         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   • Container: $CLICKHOUSE_CONTAINER"
echo "   • Database:  $CLICKHOUSE_DB"
echo ""

migration_count=$(find "$SCRIPT_DIR" -name "*.sql" -type f | wc -l | tr -d ' ')
echo "🔄 Found $migration_count migration(s) to run"
echo ""

counter=1
for migration in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "[$counter/$migration_count] 📝 Running: $filename"
    
    # Substitute environment variables in SQL
    sed "s/\${CLICKHOUSE_DB}/$CLICKHOUSE_DB/g" "$migration" | \
      docker exec -i "$CLICKHOUSE_CONTAINER" clickhouse-client --multiquery
    
    echo "[$counter/$migration_count] ✅ Completed: $filename"
    echo ""
    ((counter++))
  fi
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✨ All ClickHouse migrations completed successfully! ✨   ║"
echo "╚════════════════════════════════════════════════════════════╝"
