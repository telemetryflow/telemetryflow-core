#!/bin/sh
# =============================================================================
# Runtime environment injection for TelemetryFlow-Viz
#
# Generates /tmp/runtime-config.js from container env vars.
# /usr/share/nginx/html/runtime-config.js is a symlink to this file.
# This allows Helm ConfigMap values to override build-time defaults without
# rebuilding the Docker image.
#
# Only non-empty TELEMETRYFLOW_* env vars are written; the frontend config
# falls back to build-time values for anything not set at runtime.
# =============================================================================

TARGET="/tmp/runtime-config.js"

{
  echo "// Auto-generated at container startup — do not edit"
  echo "window.__TELEMETRYFLOW_RUNTIME__ = {"

  # Iterate over all TELEMETRYFLOW_* environment variables
  env | grep '^TELEMETRYFLOW_' | sort | while IFS='=' read -r key value; do
    # Skip empty values — let build-time defaults apply
    [ -z "$value" ] && continue
    # Escape single quotes in value
    escaped=$(printf '%s' "$value" | sed "s/'/\\\\'/g")
    printf '  "%s": '\''%s'\'',\n' "$key" "$escaped"
  done

  echo "};"
} > "$TARGET"

echo "[entrypoint] Runtime config written to $TARGET"

# Start nginx
exec nginx -g 'daemon off;'
