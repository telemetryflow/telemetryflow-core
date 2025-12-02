#!/bin/bash

#================================================================================================
# Initialize Docker Volume Directories
# Creates required directories for TelemetryFlow Core volumes
#================================================================================================

set -e

BASE_PATH="/opt/data/docker/telemetryflow-core"

echo "Creating volume directories at ${BASE_PATH}..."

# Create directories
sudo mkdir -p "${BASE_PATH}/postgres"
sudo mkdir -p "${BASE_PATH}/clickhouse/data"
sudo mkdir -p "${BASE_PATH}/clickhouse/logs"
sudo mkdir -p "${BASE_PATH}/prometheus"
sudo mkdir -p "${BASE_PATH}/portainer"

# Set permissions
sudo chown -R $(id -u):$(id -g) "${BASE_PATH}"
sudo chmod -R 755 "${BASE_PATH}"

echo "✓ Volume directories created successfully:"
echo "  - ${BASE_PATH}/postgres"
echo "  - ${BASE_PATH}/clickhouse/data"
echo "  - ${BASE_PATH}/clickhouse/logs"
echo "  - ${BASE_PATH}/prometheus"
echo "  - ${BASE_PATH}/portainer"
