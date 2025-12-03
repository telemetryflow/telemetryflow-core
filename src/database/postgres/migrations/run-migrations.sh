#!/bin/bash

# PostgreSQL Migration Runner
# Runs all SQL migrations in order via Docker

set -e

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-telemetryflow_core_postgres}"
POSTGRES_DB="${POSTGRES_DB:-telemetryflow_db}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Running PostgreSQL migrations..."
echo "   Container: $POSTGRES_CONTAINER"
echo "   Database: $POSTGRES_DB"
echo ""

for migration in "$SCRIPT_DIR"/*.sql; do
  if [ -f "$migration" ]; then
    filename=$(basename "$migration")
    echo "📝 Running migration: $filename"
    
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$migration"
    
    echo "   ✅ $filename completed"
    echo ""
  fi
done

echo "🎉 All PostgreSQL migrations completed successfully!"
