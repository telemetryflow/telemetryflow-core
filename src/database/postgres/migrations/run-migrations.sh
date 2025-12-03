#!/bin/bash

# PostgreSQL Migration Runner
# Runs all SQL migrations in order via Docker

set -e

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-telemetryflow_core_postgres}"
POSTGRES_DB="${POSTGRES_DB:-telemetryflow_db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         PostgreSQL Migrations - TelemetryFlow Core         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Configuration:"
echo "   • Container: $POSTGRES_CONTAINER"
echo "   • Database:  $POSTGRES_DB"
echo "   • User:      $POSTGRES_USER"
echo ""

migration_count=$(find "$SCRIPT_DIR" -name "*.sql" -type f | wc -l | tr -d ' ')
echo "🔄 Found $migration_count migration(s) to run"
echo ""

counter=1
for migration in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "[$counter/$migration_count] 📝 Running: $filename"
    
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$migration"
    
    echo "[$counter/$migration_count] ✅ Completed: $filename"
    echo ""
    ((counter++))
  fi
done

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✨ All PostgreSQL migrations completed successfully! ✨   ║"
echo "╚════════════════════════════════════════════════════════════╝"
