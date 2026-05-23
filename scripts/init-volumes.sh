#!/bin/bash

#================================================================================================
# Initialize Docker Volume Directories
# Creates required directories for TelemetryFlow Core volumes
#================================================================================================

set -e

BASE_PATH="${VOLUMES_BASE_PATH:-/opt/data/docker/telemetryflow-core}"

echo "Creating volume directories at ${BASE_PATH}..."

# Create directories
sudo mkdir -p "${BASE_PATH}/postgresql/pgdata"
sudo mkdir -p "${BASE_PATH}/clickhouse/data"
sudo mkdir -p "${BASE_PATH}/clickhouse/logs"
sudo mkdir -p "${BASE_PATH}/redis"
sudo mkdir -p "${BASE_PATH}/nats"
sudo mkdir -p "${BASE_PATH}/portainer"

# Set permissions
sudo chown -R $(whoami) "${BASE_PATH}"
sudo chmod -R 755 "${BASE_PATH}"

echo "Volume directories created successfully:"
echo "  - ${BASE_PATH}/postgresql/pgdata"
echo "  - ${BASE_PATH}/clickhouse/data"
echo "  - ${BASE_PATH}/clickhouse/logs"
echo "  - ${BASE_PATH}/redis"
echo "  - ${BASE_PATH}/nats"
echo "  - ${BASE_PATH}/portainer"
