#!/bin/bash

# TelemetryFlow Core Bootstrap Script
# Initialize and run the IAM-only backend

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

PORT="${PORT:-3000}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          🚀 TelemetryFlow Core Bootstrap Script 🚀              ║${NC}"
echo -e "${CYAN}║                    IAM Module Only                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
SKIP_DOCKER=false
SKIP_SEED=false
RUN_DEV=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-docker) SKIP_DOCKER=true; shift ;;
    --skip-seed) SKIP_SEED=true; shift ;;
    --dev) RUN_DEV=true; shift ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-docker   Skip Docker startup"
      echo "  --skip-seed     Skip database seeding"
      echo "  --dev           Start in development mode"
      echo "  --help          Show this help"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# Check dependencies
echo -e "${BLUE}📦 Checking Dependencies${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js not found${NC}"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}pnpm not found${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker not found${NC}"; exit 1; }
echo -e "${GREEN}✓ All dependencies found${NC}"

# Install packages
if [ ! -d "node_modules" ]; then
  echo -e "\n${BLUE}📦 Installing packages...${NC}"
  pnpm install
fi

# Start Docker
if [ "$SKIP_DOCKER" = false ]; then
  echo -e "\n${BLUE}🐳 Starting PostgreSQL...${NC}"
  docker-compose up -d
  echo -e "${BLUE}⏳ Waiting for PostgreSQL...${NC}"
  sleep 5
  echo -e "${GREEN}✓ PostgreSQL ready${NC}"
fi

# Seed database
if [ "$SKIP_SEED" = false ]; then
  echo -e "\n${BLUE}🌱 Seeding IAM data...${NC}"
  pnpm run db:seed:iam
  echo -e "${GREEN}✓ Database seeded${NC}"
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   ✅ Bootstrap Complete! ✅                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}📋 System Status${NC}"
echo -e "  ${CYAN}PostgreSQL:${NC} Running on ${POSTGRES_HOST}:${POSTGRES_PORT}"

echo -e "\n${GREEN}🚀 Next Steps${NC}"
if [ "$RUN_DEV" = false ]; then
  echo -e "  ${CYAN}Start:${NC} pnpm run dev"
fi
echo -e "  ${CYAN}API:${NC}   http://localhost:${PORT}/api"

# Start if requested
if [ "$RUN_DEV" = true ]; then
  echo -e "\n${BLUE}🚀 Starting Development Server${NC}"
  pnpm run dev
fi
