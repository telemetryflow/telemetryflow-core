# =============================================================================
# TelemetryFlow Core - Makefile
# =============================================================================
#
# TelemetryFlow Core - Identity and Access Management Service
# Copyright (c) 2024-2026 DevOpsCorner Indonesia. All rights reserved.
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
IMAGE_NAME := telemetryflow/telemetryflow-core
PLATFORMS := linux/amd64,linux/arm64

# Node.js
NODE_VERSION := 18
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
	@echo "  VERSION     = $(VERSION)"
	@echo "  GIT_COMMIT  = $(GIT_COMMIT)"
	@echo "  GIT_BRANCH  = $(GIT_BRANCH)"
	@echo "  IMAGE_NAME  = $(IMAGE_NAME)"

# =============================================================================
# Development
# =============================================================================

.PHONY: install
install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	pnpm install --frozen-lockfile

.PHONY: dev
dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	pnpm dev

.PHONY: build
build: ## Build the application
	@echo "$(BLUE)Building application...$(NC)"
	pnpm build

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist node_modules coverage logs/*.log
	@echo "$(GREEN)✅ Clean completed$(NC)"

# =============================================================================
# Code Quality
# =============================================================================

.PHONY: lint
lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	pnpm lint

.PHONY: lint-fix
lint-fix: ## Run ESLint with auto-fix
	@echo "$(BLUE)Running ESLint with auto-fix...$(NC)"
	pnpm lint:fix

.PHONY: format
format: lint-fix ## Alias for lint-fix

# =============================================================================
# Testing
# =============================================================================

.PHONY: test
test: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	pnpm test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	pnpm test:watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pnpm test:cov

.PHONY: test-bdd
test-bdd: ## Run BDD tests (Newman/Postman)
	@echo "$(BLUE)Running BDD tests...$(NC)"
	pnpm test:bdd

# =============================================================================
# Database
# =============================================================================

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	pnpm db:migrate

.PHONY: db-seed
db-seed: ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	pnpm db:seed

.PHONY: db-setup
db-setup: db-migrate db-seed ## Setup database (migrate + seed)
	@echo "$(GREEN)✅ Database setup completed$(NC)"

.PHONY: db-cleanup
db-cleanup: ## Clean up database
	@echo "$(BLUE)Cleaning up database...$(NC)"
	pnpm db:cleanup

# =============================================================================
# Docker
# =============================================================================

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME):$(VERSION) \
		-t $(IMAGE_NAME):$(GIT_COMMIT) \
		-t $(IMAGE_NAME):latest \
		.

.PHONY: docker-build-multi
docker-build-multi: ## Build multi-platform Docker image
	@echo "$(BLUE)Building multi-platform Docker image...$(NC)"
	docker buildx build \
		--platform $(PLATFORMS) \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg GIT_BRANCH=$(GIT_BRANCH) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		-t $(IMAGE_NAME):$(VERSION) \
		-t $(IMAGE_NAME):$(GIT_COMMIT) \
		-t $(IMAGE_NAME):latest \
		--push \
		.

.PHONY: docker-run
docker-run: ## Run Docker container locally
	@echo "$(BLUE)Running Docker container...$(NC)"
	docker run -d \
		--name telemetryflow-core \
		-p 3000:3000 \
		-e NODE_ENV=development \
		$(IMAGE_NAME):latest

.PHONY: docker-stop
docker-stop: ## Stop and remove Docker container
	@echo "$(BLUE)Stopping Docker container...$(NC)"
	docker stop telemetryflow-core || true
	docker rm telemetryflow-core || true

.PHONY: docker-logs
docker-logs: ## Show Docker container logs
	docker logs -f telemetryflow-core

# =============================================================================
# Docker Compose
# =============================================================================

.PHONY: up
up: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting services with Docker Compose...$(NC)"
	docker-compose --profile all up -d

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

# =============================================================================
# CI/CD Pipeline
# =============================================================================

.PHONY: ci-install
ci-install: ## CI: Install dependencies (frozen lockfile)
	@echo "$(BLUE)CI: Installing dependencies...$(NC)"
	pnpm install --frozen-lockfile

.PHONY: ci-lint
ci-lint: ## CI: Run linting
	@echo "$(BLUE)CI: Running linting...$(NC)"
	pnpm lint --quiet

.PHONY: ci-build
ci-build: ## CI: Build application
	@echo "$(BLUE)CI: Building application...$(NC)"
	pnpm build

.PHONY: ci-test
ci-test: ## CI: Run tests with coverage
	@echo "$(BLUE)CI: Running tests...$(NC)"
	pnpm test:cov

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
	@for module in iam-module-standardization audit-module-standardization auth-module-standardization cache-module-standardization; do \
		echo "Validating $$module..."; \
		if [ ! -d ".kiro/specs/$$module" ]; then \
			echo "$(RED)❌ Module specification directory not found: $$module$(NC)"; \
			exit 1; \
		fi; \
		for file in requirements.md design.md tasks.md; do \
			if [ ! -f ".kiro/specs/$$module/$$file" ]; then \
				echo "$(RED)❌ Required file not found: $$module/$$file$(NC)"; \
				exit 1; \
			fi; \
			if [ ! -s ".kiro/specs/$$module/$$file" ]; then \
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

.PHONY: bootstrap
bootstrap: ## Bootstrap development environment
	@echo "$(BLUE)Bootstrapping development environment...$(NC)"
	bash scripts/bootstrap.sh --dev

.PHONY: health
health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@if curl -f http://localhost:3000/health >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Application is healthy$(NC)"; \
	else \
		echo "$(RED)❌ Application is not responding$(NC)"; \
		exit 1; \
	fi

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
check: lint test ## Quick check (lint + test)
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
# Documentation
# =============================================================================

.PHONY: docs
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "$(YELLOW)Documentation generation not implemented yet$(NC)"

# =============================================================================
# Special Targets
# =============================================================================

# Ensure these targets always run
.PHONY: all
all: clean install lint build test ## Run all main tasks

# Prevent make from deleting intermediate files
.PRECIOUS: package.json pnpm-lock.yaml

# Ensure make uses bash
SHELL := /bin/bash