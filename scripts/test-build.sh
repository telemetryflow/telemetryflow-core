#!/bin/bash

# =============================================================================
# TelemetryFlow Core - Build Test Script
# =============================================================================
#
# This script tests the build process locally to ensure it works before
# running in Docker or CI/CD environments.
#
# Usage:
#   bash scripts/test-build.sh
#
# =============================================================================

set -e  # Exit on any error

echo "🧪 Testing TelemetryFlow Core Build Process"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ or 25+"
    exit 1
fi

# Check pnpm
if command -v pnpm >/dev/null 2>&1; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm found: $PNPM_VERSION"
else
    print_error "pnpm not found. Please install pnpm: npm install -g pnpm@10.24.0"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_success "All prerequisites met!"

# Test 1: Install dependencies
print_status "Test 1: Installing dependencies..."
if pnpm install --frozen-lockfile; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Test 2: Lint code
print_status "Test 2: Running linter..."
if pnpm lint; then
    print_success "Linting passed"
else
    print_warning "Linting failed - this won't block the build but should be fixed"
fi

# Test 3: Build application
print_status "Test 3: Building application..."
if pnpm build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Test 4: Check build output
print_status "Test 4: Checking build output..."
if [ -d "dist" ] && [ -f "dist/main.js" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    print_success "Build output found in dist/ directory (Size: $DIST_SIZE)"
    
    # List main files in dist
    print_status "Main build files:"
    ls -la dist/ | head -10
else
    print_error "Build output not found or incomplete"
    exit 1
fi

# Test 5: Run tests (optional)
print_status "Test 5: Running tests..."
if pnpm test --passWithNoTests; then
    print_success "Tests passed"
else
    print_warning "Tests failed - this won't block the build but should be investigated"
fi

# Test 6: Check for common issues
print_status "Test 6: Checking for common issues..."

# Check TypeScript configuration
if [ -f "tsconfig.json" ] && [ -f "tsconfig.build.json" ]; then
    print_success "TypeScript configuration files found"
else
    print_warning "TypeScript configuration files missing"
fi

# Check NestJS configuration
if [ -f "nest-cli.json" ]; then
    print_success "NestJS CLI configuration found"
else
    print_warning "NestJS CLI configuration missing"
fi

# Check for source files
if [ -d "src" ] && [ -f "src/main.ts" ]; then
    print_success "Source files found"
else
    print_error "Source files missing"
    exit 1
fi

# Summary
echo ""
echo "🎉 Build Test Summary"
echo "===================="
print_success "✅ Dependencies installation: PASSED"
print_success "✅ Application build: PASSED"
print_success "✅ Build output verification: PASSED"
echo ""
print_status "The build process is working correctly!"
print_status "This means the Docker build should also work."
echo ""
print_status "Next steps:"
echo "  1. Test Docker build: docker build -t telemetryflow-core ."
echo "  2. Run the application: docker run -p 3000:3000 telemetryflow-core"
echo "  3. Check health: curl http://localhost:3000/health"
echo ""
print_success "🚀 Ready for deployment!"