#!/bin/bash

# TelemetryFlow Core - BDD Tests with Newman
# Behavior-Driven Development testing for IAM API

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
COLLECTION="TelemetryFlow Core - IAM.postman_collection.json"
ENVIRONMENT="TelemetryFlow Core - Local.postman_environment.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create reports directory
mkdir -p "$REPORT_DIR"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}║         TelemetryFlow Core - BDD API Tests (Newman)           ║${NC}"
echo -e "${CYAN}║                                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${RED}❌ Newman is not installed${NC}"
    echo -e "${YELLOW}Install with: npm install -g newman newman-reporter-htmlextra${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Newman installed"
echo ""

# Check if backend is running
echo -e "${BLUE}🔍 Checking if backend is running...${NC}"
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running${NC}"
    echo -e "${YELLOW}Start with: docker-compose up -d backend${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend is running"
echo ""

# Parse command line arguments
VERBOSE=""
FOLDER=""
BAIL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE="--verbose"
            shift
            ;;
        --folder|-f)
            FOLDER="--folder $2"
            shift 2
            ;;
        --bail|-b)
            BAIL="--bail"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose    Show detailed output"
            echo "  -f, --folder     Run specific folder only"
            echo "  -b, --bail       Stop on first failure"
            echo "  -h, --help       Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                           # Run all tests"
            echo "  $0 --verbose                 # Run with detailed output"
            echo "  $0 --folder Users            # Run only Users tests"
            echo "  $0 --folder Users --bail     # Run Users tests, stop on failure"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Running BDD Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Collection:${NC}  $COLLECTION"
echo -e "${CYAN}Environment:${NC} $ENVIRONMENT"
if [ -n "$FOLDER" ]; then
    echo -e "${CYAN}Folder:${NC}      ${FOLDER#--folder }"
fi
echo ""

# Run Newman with BDD-style reporting
newman run "$SCRIPT_DIR/$COLLECTION" \
    -e "$SCRIPT_DIR/$ENVIRONMENT" \
    $FOLDER \
    $BAIL \
    $VERBOSE \
    --reporters cli,htmlextra,json \
    --reporter-htmlextra-export "$REPORT_DIR/report-$TIMESTAMP.html" \
    --reporter-htmlextra-title "TelemetryFlow Core - BDD Test Report" \
    --reporter-htmlextra-darkTheme \
    --reporter-json-export "$REPORT_DIR/report-$TIMESTAMP.json" \
    --color on \
    --delay-request 100

EXIT_CODE=$?

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
fi

echo ""
echo -e "${CYAN}Reports generated:${NC}"
echo -e "  ${YELLOW}HTML:${NC} $REPORT_DIR/report-$TIMESTAMP.html"
echo -e "  ${YELLOW}JSON:${NC} $REPORT_DIR/report-$TIMESTAMP.json"
echo ""
echo -e "${CYAN}Open HTML report:${NC}"
echo -e "  open $REPORT_DIR/report-$TIMESTAMP.html"
echo ""

exit $EXIT_CODE
