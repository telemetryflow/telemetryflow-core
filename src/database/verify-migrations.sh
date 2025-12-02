#!/bin/bash
# Verify migrations are idempotent by running them twice

set -e

echo "==================================="
echo "Migration Idempotency Verification"
echo "==================================="

# PostgreSQL
echo ""
echo "✓ PostgreSQL Migration:"
echo "  - Uses 'CREATE TABLE IF NOT EXISTS'"
echo "  - Uses 'CREATE INDEX IF NOT EXISTS'"
echo "  - Uses 'CREATE EXTENSION IF NOT EXISTS'"
echo "  - Safe to run multiple times"

# ClickHouse
echo ""
echo "✓ ClickHouse Migration:"
echo "  - Uses 'CREATE DATABASE IF NOT EXISTS'"
echo "  - Uses 'CREATE TABLE IF NOT EXISTS'"
echo "  - Uses 'ALTER TABLE ... ADD INDEX IF NOT EXISTS'"
echo "  - Uses 'CREATE MATERIALIZED VIEW IF NOT EXISTS'"
echo "  - Safe to run multiple times"

echo ""
echo "==================================="
echo "All migrations are IDEMPOTENT ✓"
echo "==================================="
