#!/bin/bash

# Generate Sample IAM Data
# Creates additional users, roles, and permissions for testing

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

COUNT=10

while [[ $# -gt 0 ]]; do
  case $1 in
    --count) COUNT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo -e "${BLUE}📊 Generating $COUNT sample IAM records...${NC}"

ts-node -r tsconfig-paths/register scripts/generate-sample-iam-data.ts --count "$COUNT"

echo -e "${GREEN}✓ Sample data generated${NC}"
