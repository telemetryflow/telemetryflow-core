#!/bin/bash

# TelemetryFlow Core Bootstrap Script
# Comprehensive script to initialize and run the IAM-only backend
# Includes migration, seeding, and all required setup steps

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env ]; then
  echo -e "${BLUE}📋 Loading environment variables from .env${NC}"
  set -a
  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    export "$line" 2>/dev/null || true
  done < .env
  set +a
  echo -e "${GREEN}✓${NC} Environment variables loaded"
else
  echo -e "${YELLOW}⚠️  Warning: .env file not found. Using defaults.${NC}"
fi

# Default values
PORT="${PORT:-3000}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-telemetryflow_db}"
CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-172.151.151.40}"

# Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}║          🚀 TelemetryFlow Core Bootstrap Script 🚀             ║${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}║              IAM-Only Backend with 5-Tier RBAC                 ║${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
  local service_name=$1
  local check_command=$2
  local max_attempts=30
  local attempt=1

  echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"

  while [ $attempt -le $max_attempts ]; do
    if eval "$check_command" > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} $service_name is ready!"
      return 0
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done

  echo ""
  echo -e "${RED}✗${NC} Timeout waiting for $service_name"
  return 1
}

# Parse command line arguments
SKIP_DEPS_CHECK=false
SKIP_DOCKER=false
SKIP_MIGRATION=false
SKIP_SEED=false
RUN_DEV=false
RUN_PROD=false
DOCKER_PROFILE="all"

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-deps)
      SKIP_DEPS_CHECK=true
      shift
      ;;
    --skip-docker)
      SKIP_DOCKER=true
      shift
      ;;
    --skip-migration)
      SKIP_MIGRATION=true
      shift
      ;;
    --skip-seed)
      SKIP_SEED=true
      shift
      ;;
    --dev)
      RUN_DEV=true
      shift
      ;;
    --prod)
      RUN_PROD=true
      shift
      ;;
    --profile)
      DOCKER_PROFILE="$2"
      shift 2
      ;;
    --help)
      echo "TelemetryFlow Core Bootstrap Script"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-deps        Skip dependency check"
      echo "  --skip-docker      Skip Docker containers startup"
      echo "  --skip-migration   Skip database migrations"
      echo "  --skip-seed        Skip database seeding"
      echo "  --dev              Start application in development mode after setup"
      echo "  --prod             Start application in production mode after setup"
      echo "  --profile PROFILE  Docker profile: core, monitoring, tools, all (default: all)"
      echo "  --help             Show this help message"
      echo ""
      echo "Docker Profiles:"
      echo "  core               Backend, PostgreSQL, ClickHouse"
      echo "  monitoring         OTEL, Jaeger, Prometheus, Grafana"
      echo "  tools              Portainer"
      echo "  all                Everything (default)"
      echo ""
      echo "Examples:"
      echo "  $0                          # Full bootstrap (all services)"
      echo "  $0 --dev                    # Bootstrap and run in dev mode"
      echo "  $0 --profile core           # Core services only"
      echo "  $0 --profile core --dev     # Core + dev mode"
      echo "  $0 --skip-seed              # Skip seed, useful for existing data"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run '$0 --help' for usage information"
      exit 1
      ;;
  esac
done

# Step 1: Check dependencies
if [ "$SKIP_DEPS_CHECK" = false ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📦 Step 1: Checking Dependencies${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  MISSING_DEPS=false

  if ! command_exists node; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    MISSING_DEPS=true
  else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"
  fi

  if ! command_exists pnpm; then
    echo -e "${RED}✗${NC} pnpm is not installed"
    MISSING_DEPS=true
  else
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓${NC} pnpm $PNPM_VERSION"
  fi

  if ! command_exists docker; then
    echo -e "${RED}✗${NC} Docker is not installed"
    MISSING_DEPS=true
  else
    DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | sed 's/,//')
    echo -e "${GREEN}✓${NC} Docker $DOCKER_VERSION"
  fi

  if ! command_exists docker-compose; then
    echo -e "${RED}✗${NC} docker-compose is not installed"
    MISSING_DEPS=true
  else
    COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f4 | sed 's/,//')
    echo -e "${GREEN}✓${NC} docker-compose $COMPOSE_VERSION"
  fi

  if [ "$MISSING_DEPS" = true ]; then
    echo -e "\n${RED}❌ Missing required dependencies. Please install them and try again.${NC}"
    exit 1
  fi

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}📦 Installing pnpm dependencies...${NC}"
    pnpm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
  else
    echo -e "${GREEN}✓${NC} node_modules exists"
  fi
fi

# Step 2: Start Docker containers
if [ "$SKIP_DOCKER" = false ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🐳 Step 2: Starting Docker Containers${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "${BLUE}Starting Docker containers (profile: ${YELLOW}${DOCKER_PROFILE}${BLUE})...${NC}"
  docker-compose --profile "$DOCKER_PROFILE" up -d

  echo -e "\n${BLUE}Waiting for services to be ready...${NC}"

  # Wait for PostgreSQL
  wait_for_service "PostgreSQL" \
    "docker exec telemetryflow_core_postgres pg_isready -U postgres"

  # Wait for ClickHouse
  wait_for_service "ClickHouse" \
    "docker exec telemetryflow_core_clickhouse clickhouse-client --query 'SELECT 1'"

  echo -e "\n${GREEN}✓${NC} All Docker services are running"
fi

# Step 3: Database Migrations
if [ "$SKIP_MIGRATION" = false ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🔄 Step 3: Running Database Migrations${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "${YELLOW}Running PostgreSQL migrations...${NC}"
  pnpm run db:migrate:postgres
  echo -e "${GREEN}✓${NC} PostgreSQL migrations completed"

  echo -e "\n${YELLOW}Running ClickHouse migrations...${NC}"
  pnpm run db:migrate:clickhouse
  echo -e "${GREEN}✓${NC} ClickHouse migrations completed"
fi

# Step 4: Seed databases
if [ "$SKIP_SEED" = false ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🌱 Step 4: Seeding Databases${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  echo -e "${YELLOW}Seeding PostgreSQL (IAM data)...${NC}"
  pnpm run db:seed:postgres
  echo -e "${GREEN}✓${NC} PostgreSQL seeded"

  echo -e "\n${YELLOW}Seeding ClickHouse (sample data)...${NC}"
  pnpm run db:seed:clickhouse
  echo -e "${GREEN}✓${NC} ClickHouse seeded"
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}║                   ✅ Bootstrap Complete! ✅                     ║${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 System Status${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}PostgreSQL:${NC}     Running on ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo -e "  ${CYAN}ClickHouse:${NC}     Running on ${CLICKHOUSE_HOST}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔧 Database Architecture${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${YELLOW}PostgreSQL:${NC}"
echo -e "    • Users, Roles, Permissions (5-Tier RBAC)"
echo -e "    • Organizations, Workspaces, Tenants"
echo -e "    • Regions, Groups"
echo -e ""
echo -e "  ${YELLOW}ClickHouse:${NC}"
echo -e "    • Audit logs with 90-day TTL"
echo -e "    • High-performance time-series storage"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}👥 Default Users (Password: TelemetryFlow@2024)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}Super Admin:${NC}       superadmin.telemetryflow@telemetryflow.id"
echo -e "  ${CYAN}Administrator:${NC}     administrator.telemetryflow@telemetryflow.id"
echo -e "  ${CYAN}Developer:${NC}         developer.telemetryflow@telemetryflow.id"
echo -e "  ${CYAN}Viewer:${NC}            viewer.telemetryflow@telemetryflow.id"
echo -e "  ${CYAN}Demo:${NC}              demo.telemetryflow@telemetryflow.id"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🏢 Organizations${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${CYAN}DevOpsCorner:${NC}      DEVOPSCORNER"
echo -e "  ${CYAN}TelemetryFlow:${NC}     TELEMETRYFLOW"
echo -e "  ${CYAN}Demo:${NC}              DEMO"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Next Steps${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$RUN_DEV" = false ] && [ "$RUN_PROD" = false ]; then
  echo -e "\n${YELLOW}Start the application:${NC}"
  echo -e "  ${CYAN}Development mode:${NC}  pnpm run dev"
  echo -e "  ${CYAN}Production mode:${NC}   pnpm run build && pnpm run start"
fi

echo -e "\n${YELLOW}Access the application:${NC}"
echo -e "  ${CYAN}API Documentation:${NC} http://localhost:${PORT}/api"
echo -e "  ${CYAN}Health Check:${NC}      http://localhost:${PORT}/health"
echo -e "  ${CYAN}Metrics:${NC}           http://localhost:${PORT}/metrics"

if [[ "$DOCKER_PROFILE" == "all" || "$DOCKER_PROFILE" == "monitoring" ]]; then
  echo -e "\n${YELLOW}Monitoring & Observability:${NC}"
  echo -e "  ${CYAN}Grafana (SPM):${NC}     http://localhost:3001 (admin/admin)"
  echo -e "  ${CYAN}Jaeger (Traces):${NC}   http://localhost:16686"
  echo -e "  ${CYAN}Prometheus:${NC}        http://localhost:9090"
fi

if [[ "$DOCKER_PROFILE" == "all" || "$DOCKER_PROFILE" == "tools" ]]; then
  echo -e "\n${YELLOW}Management Tools:${NC}"
  echo -e "  ${CYAN}Portainer:${NC}         http://localhost:9100"
fi

echo -e "\n${YELLOW}IAM Endpoints:${NC}"
echo -e "  ${CYAN}Users:${NC}             http://localhost:${PORT}/api/v2/users"
echo -e "  ${CYAN}Roles:${NC}             http://localhost:${PORT}/api/v2/roles"
echo -e "  ${CYAN}Permissions:${NC}       http://localhost:${PORT}/api/v2/permissions"
echo -e "  ${CYAN}Organizations:${NC}     http://localhost:${PORT}/api/v2/organizations"
echo -e "  ${CYAN}Workspaces:${NC}        http://localhost:${PORT}/api/v2/iam/workspaces"
echo -e "  ${CYAN}Tenants:${NC}           http://localhost:${PORT}/api/v2/iam/tenants"
echo -e "  ${CYAN}Groups:${NC}            http://localhost:${PORT}/api/v2/iam/groups"
echo -e "  ${CYAN}Regions:${NC}           http://localhost:${PORT}/api/v2/iam/regions"

echo -e "\n${YELLOW}Useful commands:${NC}"
echo -e "  ${CYAN}View logs:${NC}         docker-compose logs -f"
echo -e "  ${CYAN}Stop services:${NC}     docker-compose down"
echo -e "  ${CYAN}Restart:${NC}           docker-compose restart"
echo -e "  ${CYAN}Reset DB:${NC}          pnpm run db:reset"

# Step 6: Start application (if requested)
if [ "$RUN_DEV" = true ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🚀 Starting Application (Development Mode)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  pnpm run dev
elif [ "$RUN_PROD" = true ]; then
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🏗️  Building Application${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  pnpm run build

  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🚀 Starting Application (Production Mode)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  pnpm run start
fi

echo ""
