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

# Check Jaeger
echo "✓ Checking Jaeger..."
curl -s http://localhost:16686 > /dev/null || echo "⚠ Jaeger not ready"

# Initialize ClickHouse schema
echo "📊 Initializing ClickHouse schema..."
docker exec -i telemetryflow_core_clickhouse clickhouse-client --multiquery < config/clickhouse/migrations/001-audit-logs.sql || echo "⚠ Schema already initialized"

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 20

# Check backend status
if docker-compose ps backend | grep -q "Up"; then
  echo "✓ Backend is running"
  # Seed IAM data
  echo "🌱 Seeding IAM data..."
  docker-compose exec -T backend pnpm run db:seed:iam || echo "⚠ Seeding failed (may already be seeded)"
else
  echo "⚠ Backend failed to start. Checking logs..."
  docker-compose logs --tail=50 backend
fi

echo ""
echo "✅ TelemetryFlow Core is ready!"
echo ""
echo "📍 Service URLs:"
echo "   Backend API:    http://localhost:3000"
echo "   Swagger Docs:   http://localhost:3000/api"
echo "   Health Check:   http://localhost:3000/health"
echo "   PostgreSQL:     postgresql://postgres:telemetrfyflow123@localhost:5432/telemetryflow_db"
echo "   ClickHouse:     http://localhost:8123"
echo "   Jaeger UI:      http://localhost:16686"
echo "   Prometheus:     http://localhost:9090"
echo "   Portainer:      http://localhost:9100"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
