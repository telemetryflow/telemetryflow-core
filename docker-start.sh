#!/bin/bash
set -e

echo "🚀 Starting TelemetryFlow Core..."

# Initialize volume directories
echo "📁 Initializing volume directories..."
bash scripts/init-volumes.sh

# Start services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo "✓ Checking PostgreSQL..."
docker-compose exec -T postgres pg_isready -U postgres || echo "⚠ PostgreSQL not ready"

# Check ClickHouse
echo "✓ Checking ClickHouse..."
curl -s http://localhost:8123/ping || echo "⚠ ClickHouse not ready"

# Initialize ClickHouse schema
echo "📊 Initializing ClickHouse schema..."
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql

# Seed IAM data
echo "🌱 Seeding IAM data..."
docker-compose exec -T backend pnpm run db:seed:iam || echo "⚠ Seeding failed (may already be seeded)"

echo ""
echo "✅ TelemetryFlow Core is ready!"
echo ""
echo "📍 Service URLs:"
echo "   Backend API:    http://localhost:3000"
echo "   Swagger Docs:   http://localhost:3000/api"
echo "   Health Check:   http://localhost:3000/health"
echo "   PostgreSQL:     postgresql://postgres:postgres@localhost:5432/telemetryflow_core"
echo "   ClickHouse:     http://localhost:8123"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
