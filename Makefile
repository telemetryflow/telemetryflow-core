# =============================================================================
# TelemetryFlow Core - Makefile
# =============================================================================
#
# TelemetryFlow Core - IAM, AI Assistant & Audit Platform
# Copyright (c) 2024-2026 Telemetri Data Indonesia. All rights reserved.
#
# This Makefile provides standardized commands for development, testing,
# building, and deployment of TelemetryFlow Core.
#
# =============================================================================

# Variables
PRODUCT_NAME := TelemetryFlow Core
VERSION := $(shell node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || echo "unknown")

# Docker
REGISTRY := docker.io
IMAGE_NAME_BACKEND := telemetryflow/telemetryflow-core
IMAGE_NAME_FRONTEND := telemetryflow/telemetryflow-core-viz
PLATFORMS := linux/amd64,linux/arm64

# Node.js
NODE_VERSION := 23
PNPM_VERSION := 10.24.0

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# Help
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)$(PRODUCT_NAME) - Makefile$(NC)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Variables:$(NC)"
	@echo "  VERSION        = $(VERSION)"
	@echo "  GIT_COMMIT     = $(GIT_COMMIT)"
	@echo "  GIT_BRANCH     = $(GIT_BRANCH)"
	@echo "  IMAGE_BACKEND  = $(IMAGE_NAME_BACKEND)"
	@echo "  IMAGE_FRONTEND = $(IMAGE_NAME_FRONTEND)"

# =============================================================================
# Development
# =============================================================================

.PHONY: install
install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install --frozen-lockfile

.PHONY: dev
dev: ## Start all development servers (backend + frontend)
	@echo "$(BLUE)Starting all development servers...$(NC)"
	pnpm dev

.PHONY: dev-backend
dev-backend: ## Start backend development server only
	@echo "$(BLUE)Starting backend development server...$(NC)"
	pnpm dev:backend

.PHONY: dev-frontend
dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend development server...$(NC)"
	pnpm dev:frontend

.PHONY: build
build: ## Build the application (backend + frontend via turbo)
	@echo "$(BLUE)Building application...$(NC)"
	pnpm build

.PHONY: build-backend
build-backend: ## Build backend only
	@echo "$(BLUE)Building backend...$(NC)"
	pnpm build:backend

.PHONY: build-frontend
build-frontend: ## Build frontend only (production)
	@echo "$(BLUE)Building frontend...$(NC)"
	pnpm build:frontend

.PHONY: build-frontend-dev
build-frontend-dev: ## Build frontend in development mode (with sourcemaps)
	@echo "$(BLUE)Building frontend (development mode)...$(NC)"
	pnpm --filter @telemetryflow/viz build:dev

.PHONY: build-frontend-typecheck
build-frontend-typecheck: ## Build frontend with vue-tsc type-check
	@echo "$(BLUE)Building frontend (with type-check)...$(NC)"
	pnpm --filter @telemetryflow/viz build:typecheck

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist node_modules coverage backend/dist backend/node_modules frontend/dist frontend/node_modules logs/*.log .turbo
	@echo "$(GREEN)✅ Clean completed$(NC)"

# =============================================================================
# Code Quality
# =============================================================================

.PHONY: lint
lint: lint-backend lint-frontend ## Run ESLint for backend + frontend
	@echo "$(GREEN)✅ Lint completed$(NC)"

.PHONY: lint-backend
lint-backend: ## Run ESLint for backend only
	@echo "$(BLUE)Running ESLint (backend)...$(NC)"
	pnpm lint

.PHONY: lint-frontend
lint-frontend: ## Run ESLint for frontend only
	@echo "$(BLUE)Running ESLint (frontend)...$(NC)"
	pnpm --filter @telemetryflow/viz lint

.PHONY: lint-fix
lint-fix: lint-fix-backend lint-fix-frontend ## Run ESLint with auto-fix for backend + frontend
	@echo "$(GREEN)✅ Lint-fix completed$(NC)"

.PHONY: lint-fix-backend
lint-fix-backend: ## Run ESLint with auto-fix for backend only
	@echo "$(BLUE)Running ESLint with auto-fix (backend)...$(NC)"
	pnpm lint:fix

.PHONY: lint-fix-frontend
lint-fix-frontend: ## Run ESLint with auto-fix for frontend only
	@echo "$(BLUE)Running ESLint with auto-fix (frontend)...$(NC)"
	pnpm --filter @telemetryflow/viz lint

.PHONY: type-check
type-check: ## Run TypeScript type checking (frontend)
	@echo "$(BLUE)Running type check...$(NC)"
	pnpm --filter @telemetryflow/viz type-check

.PHONY: format
format: lint-fix ## Alias for lint-fix

.PHONY: fmt
fmt: lint-fix ## Format code (alias for lint-fix)

.PHONY: fmt-check
fmt-check: lint ## Check code formatting (alias for lint)

# =============================================================================
# Testing
# =============================================================================

.PHONY: test
test: test-backend test-frontend ## Run all tests (backend + frontend)
	@echo "$(GREEN)✅ All tests completed$(NC)"

.PHONY: test-backend
test-backend: ## Run backend unit tests (jest)
	@echo "$(BLUE)Running backend unit tests...$(NC)"
	pnpm test

.PHONY: test-backend-watch
test-backend-watch: ## Run backend tests in watch mode
	@echo "$(BLUE)Running backend tests in watch mode...$(NC)"
	pnpm test:watch

.PHONY: test-backend-coverage
test-backend-coverage: ## Run backend tests with coverage
	@echo "$(BLUE)Running backend tests with coverage...$(NC)"
	pnpm test:cov

.PHONY: test-frontend
test-frontend: ## Run frontend unit tests (vitest)
	@echo "$(BLUE)Running frontend unit tests...$(NC)"
	pnpm --filter @telemetryflow/viz test

.PHONY: test-frontend-watch
test-frontend-watch: ## Run frontend tests in watch mode
	@echo "$(BLUE)Running frontend tests in watch mode...$(NC)"
	pnpm --filter @telemetryflow/viz test:watch

.PHONY: test-frontend-ui
test-frontend-ui: ## Run frontend tests with Vitest UI
	@echo "$(BLUE)Running frontend tests with UI...$(NC)"
	pnpm --filter @telemetryflow/viz test:ui

.PHONY: test-watch
test-watch: ## Run all tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	pnpm test:watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pnpm test:cov

# =============================================================================
# Database
# =============================================================================

.PHONY: db-migrate
db-migrate: ## Run all database migrations (Postgres + ClickHouse)
	@echo "$(BLUE)Running database migrations...$(NC)"
	pnpm db:migrate

.PHONY: db-migrate-postgres
db-migrate-postgres: ## Run PostgreSQL migrations only
	@echo "$(BLUE)Running PostgreSQL migrations...$(NC)"
	pnpm db:migrate:postgres

.PHONY: db-migrate-postgres-iam
db-migrate-postgres-iam: ## Run PostgreSQL IAM migrations only
	@echo "$(BLUE)Running PostgreSQL IAM migrations...$(NC)"
	pnpm db:migrate:postgres:iam

.PHONY: db-migrate-postgres-auth
db-migrate-postgres-auth: ## Run PostgreSQL Auth migrations only
	@echo "$(BLUE)Running PostgreSQL Auth migrations...$(NC)"
	pnpm db:migrate:postgres:auth

.PHONY: db-migrate-clickhouse
db-migrate-clickhouse: ## Run ClickHouse migrations only
	@echo "$(BLUE)Running ClickHouse migrations...$(NC)"
	pnpm db:migrate:clickhouse

.PHONY: db-migrate-clickhouse-audit
db-migrate-clickhouse-audit: ## Run ClickHouse Audit migrations only
	@echo "$(BLUE)Running ClickHouse Audit migrations...$(NC)"
	pnpm db:migrate:clickhouse:audit

.PHONY: db-seed
db-seed: ## Seed all databases (Postgres + ClickHouse)
	@echo "$(BLUE)Seeding databases...$(NC)"
	pnpm db:seed

.PHONY: db-seed-postgres
db-seed-postgres: ## Seed PostgreSQL only
	@echo "$(BLUE)Seeding PostgreSQL...$(NC)"
	pnpm db:seed:postgres

.PHONY: db-seed-postgres-iam
db-seed-postgres-iam: ## Seed PostgreSQL IAM module only
	@echo "$(BLUE)Seeding PostgreSQL IAM module...$(NC)"
	pnpm db:seed:postgres:iam

.PHONY: db-seed-postgres-auth
db-seed-postgres-auth: ## Seed PostgreSQL Auth module only
	@echo "$(BLUE)Seeding PostgreSQL Auth module...$(NC)"
	pnpm db:seed:postgres:auth

.PHONY: db-seed-clickhouse
db-seed-clickhouse: ## Seed ClickHouse only
	@echo "$(BLUE)Seeding ClickHouse...$(NC)"
	pnpm db:seed:clickhouse

.PHONY: db-setup
db-setup: db-migrate db-seed ## Setup database (migrate + seed)
	@echo "$(GREEN)✅ Database setup completed$(NC)"

.PHONY: db-cleanup
db-cleanup: ## Clean up database
	@echo "$(BLUE)Cleaning up database...$(NC)"
	pnpm db:cleanup

.PHONY: db-fresh
db-fresh: ## Fresh database (cleanup + migrate + seed)
	@echo "$(BLUE)Resetting database to fresh state...$(NC)"
	pnpm db:fresh
	@echo "$(GREEN)✅ Database fresh reset completed$(NC)"

# =============================================================================
# Docker Build
# =============================================================================

.PHONY: docker-build
docker-build: docker-build-backend docker-build-frontend ## Build all Docker images (backend + frontend)

.PHONY: docker-build-backend
docker-build-backend: ## Build backend Docker image
	@echo "$(BLUE)Building backend Docker image...$(NC)"
	docker build \
		-f Dockerfile.backend \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME_BACKEND):$(VERSION) \
		-t $(IMAGE_NAME_BACKEND):$(GIT_COMMIT) \
		-t $(IMAGE_NAME_BACKEND):latest \
		.

.PHONY: docker-build-frontend
docker-build-frontend: ## Build frontend Docker image
	@echo "$(BLUE)Building frontend Docker image...$(NC)"
	docker build \
		-f Dockerfile.frontend \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME_FRONTEND):$(VERSION) \
		-t $(IMAGE_NAME_FRONTEND):$(GIT_COMMIT) \
		-t $(IMAGE_NAME_FRONTEND):latest \
		.

.PHONY: docker-build-multi
docker-build-multi: docker-build-multi-backend docker-build-multi-frontend ## Build multi-platform Docker images

.PHONY: docker-build-multi-backend
docker-build-multi-backend: ## Build multi-platform backend Docker image
	@echo "$(BLUE)Building multi-platform backend Docker image...$(NC)"
	docker buildx build \
		-f Dockerfile.backend \
		--platform $(PLATFORMS) \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME_BACKEND):$(VERSION) \
		-t $(IMAGE_NAME_BACKEND):$(GIT_COMMIT) \
		-t $(IMAGE_NAME_BACKEND):latest \
		--push \
		.

.PHONY: docker-build-multi-frontend
docker-build-multi-frontend: ## Build multi-platform frontend Docker image
	@echo "$(BLUE)Building multi-platform frontend Docker image...$(NC)"
	docker buildx build \
		-f Dockerfile.frontend \
		--platform $(PLATFORMS) \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME_FRONTEND):$(VERSION) \
		-t $(IMAGE_NAME_FRONTEND):$(GIT_COMMIT) \
		-t $(IMAGE_NAME_FRONTEND):latest \
		--push \
		.

# =============================================================================
# Docker Run
# =============================================================================

.PHONY: docker-run-backend
docker-run-backend: ## Run backend Docker container locally
	@echo "$(BLUE)Running backend Docker container...$(NC)"
	docker run -d \
		--name telemetryflow-core-backend \
		-p 3000:3000 \
		-e NODE_ENV=development \
		$(IMAGE_NAME_BACKEND):latest

.PHONY: docker-run-frontend
docker-run-frontend: ## Run frontend Docker container locally
	@echo "$(BLUE)Running frontend Docker container...$(NC)"
	docker run -d \
		--name telemetryflow-core-frontend \
		-p 8080:80 \
		$(IMAGE_NAME_FRONTEND):latest

.PHONY: docker-stop
docker-stop: ## Stop and remove Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker stop telemetryflow-core-backend || true
	docker rm telemetryflow-core-backend || true
	docker stop telemetryflow-core-frontend || true
	docker rm telemetryflow-core-frontend || true

.PHONY: docker-logs
docker-logs: ## Show backend Docker container logs
	docker logs -f telemetryflow-core-backend

.PHONY: docker-logs-frontend
docker-logs-frontend: ## Show frontend Docker container logs
	docker logs -f telemetryflow-core-frontend

.PHONY: docker-clean
docker-clean: ## Clean Docker volumes
	@echo "$(BLUE)Cleaning Docker volumes...$(NC)"
	bash scripts/docker-volumes-clean.sh

# =============================================================================
# Docker Compose
# =============================================================================

.PHONY: up
up: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting services with Docker Compose...$(NC)"
	docker-compose --profile all up -d

.PHONY: up-core
up-core: ## Start core services only (postgres, clickhouse, redis, nats, backend, frontend)
	@echo "$(BLUE)Starting core services...$(NC)"
	docker-compose --profile core up -d

.PHONY: up-monitoring
up-monitoring: ## Start core + monitoring services
	@echo "$(BLUE)Starting core + monitoring services...$(NC)"
	docker-compose --profile core --profile monitoring up -d

.PHONY: down
down: ## Stop all services
	@echo "$(BLUE)Stopping services...$(NC)"
	docker-compose down

.PHONY: logs
logs: ## Show Docker Compose logs
	docker-compose logs -f

.PHONY: ps
ps: ## Show running containers
	docker-compose ps

.PHONY: restart
restart: ## Restart all Docker Compose services
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose restart

# =============================================================================
# CI/CD Pipeline
# =============================================================================

.PHONY: ci-install
ci-install: ## CI: Install dependencies (frozen lockfile)
	@echo "$(BLUE)CI: Installing dependencies...$(NC)"
	pnpm install --frozen-lockfile

.PHONY: ci-lint
ci-lint: ## CI: Run linting (backend + frontend)
	@echo "$(BLUE)CI: Running linting...$(NC)"
	pnpm lint --quiet
	pnpm --filter @telemetryflow/viz lint

.PHONY: ci-build
ci-build: ## CI: Build application
	@echo "$(BLUE)CI: Building application...$(NC)"
	pnpm build

.PHONY: ci-test
ci-test: ## CI: Run all tests with coverage (backend + frontend)
	@echo "$(BLUE)CI: Running tests...$(NC)"
	pnpm test:cov
	pnpm --filter @telemetryflow/viz test

.PHONY: ci-security
ci-security: ## CI: Run security audit
	@echo "$(BLUE)CI: Running security audit...$(NC)"
	pnpm audit --audit-level moderate || true

.PHONY: ci-validate
ci-validate: ## CI: Validate module standardization
	@echo "$(BLUE)CI: Validating module standardization...$(NC)"
	@if [ ! -d ".kiro/specs" ]; then \
		echo "$(RED)❌ .kiro/specs directory not found$(NC)"; \
		exit 1; \
	fi
	@for dir in .kiro/specs/*/; do \
		module=$$(basename "$$dir"); \
		echo "Validating $$module..."; \
		for file in requirements.md design.md tasks.md; do \
			if [ ! -f "$$dir$$file" ]; then \
				echo "$(RED)❌ Required file not found: $$module/$$file$(NC)"; \
				exit 1; \
			fi; \
			if [ ! -s "$$dir$$file" ]; then \
				echo "$(RED)❌ File is empty: $$module/$$file$(NC)"; \
				exit 1; \
			fi; \
		done; \
		echo "$(GREEN)✅ $$module specification is valid$(NC)"; \
	done
	@echo "$(GREEN)✅ All module specifications are valid$(NC)"

.PHONY: ci-pipeline
ci-pipeline: ci-install ci-validate ci-lint ci-build ci-test ci-security ## CI: Run complete pipeline
	@echo "$(GREEN)✅ CI Pipeline completed successfully$(NC)"

# =============================================================================
# Release
# =============================================================================

.PHONY: release-build
release-build: clean install ci-lint ci-build ci-test ## Build release version
	@echo "$(GREEN)✅ Release build completed$(NC)"

.PHONY: release-docker
release-docker: release-build docker-build-multi ## Build and push Docker release
	@echo "$(GREEN)✅ Docker release completed$(NC)"

# =============================================================================
# Utilities
# =============================================================================

.PHONY: generate-secrets
generate-secrets: ## Generate JWT and session secrets
	@echo "$(BLUE)Generating secrets...$(NC)"
	node scripts/generate-secrets.js

.PHONY: init-volumes
init-volumes: ## Initialize Docker volumes
	@echo "$(BLUE)Initializing Docker volumes...$(NC)"
	bash scripts/init-volumes.sh

.PHONY: bootstrap
bootstrap: ## Bootstrap development environment
	@echo "$(BLUE)Bootstrapping development environment...$(NC)"
	bash scripts/bootstrap.sh

.PHONY: health
health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@if curl -f http://localhost:3000/health >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Application is healthy$(NC)"; \
	else \
		echo "$(RED)❌ Application is not responding$(NC)"; \
		exit 1; \
	fi

.PHONY: export-swagger
export-swagger: ## Export Swagger/OpenAPI docs
	@echo "$(BLUE)Exporting Swagger docs...$(NC)"
	bash scripts/export-swagger-docs.sh

.PHONY: preview
preview: ## Preview frontend production build locally
	@echo "$(BLUE)Starting preview server...$(NC)"
	pnpm --filter @telemetryflow/viz preview

.PHONY: version
version: ## Show version information
	@echo "$(BLUE)Version Information:$(NC)"
	@echo "  Product:     $(PRODUCT_NAME)"
	@echo "  Version:     $(VERSION)"
	@echo "  Git Commit:  $(GIT_COMMIT)"
	@echo "  Git Branch:  $(GIT_BRANCH)"
	@echo "  Build Time:  $(BUILD_TIME)"
	@echo "  Node.js:     $(shell node --version)"
	@echo "  pnpm:        $(shell pnpm --version)"

.PHONY: info
info: version ## Alias for version

# =============================================================================
# Development Shortcuts
# =============================================================================

.PHONY: start
start: install build ## Install, build and start development
	@echo "$(GREEN)✅ Ready for development$(NC)"
	$(MAKE) dev

.PHONY: reset
reset: clean install build ## Reset environment (clean + install + build)
	@echo "$(GREEN)✅ Environment reset completed$(NC)"

.PHONY: check
check: lint type-check test ## Quick check (lint + type-check + test)
	@echo "$(GREEN)✅ Quick check completed$(NC)"

# =============================================================================
# Maintenance
# =============================================================================

.PHONY: update-deps
update-deps: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	pnpm update

.PHONY: audit-fix
audit-fix: ## Fix security vulnerabilities
	@echo "$(BLUE)Fixing security vulnerabilities...$(NC)"
	pnpm audit --fix

.PHONY: outdated
outdated: ## Check for outdated dependencies
	@echo "$(BLUE)Checking for outdated dependencies...$(NC)"
	pnpm outdated

# =============================================================================
# Special Targets
# =============================================================================

.PHONY: all
all: clean install lint type-check build test ## Run all main tasks

.PRECIOUS: package.json pnpm-lock.yaml

SHELL := /bin/bash
