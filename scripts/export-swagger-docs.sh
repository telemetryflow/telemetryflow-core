#!/bin/bash

set -e

API_URL="${API_URL:-http://localhost:3000}"
OUTPUT_DIR="${OUTPUT_DIR:-./docs/api}"
OUTPUT_FILE="${OUTPUT_FILE:-swagger.json}"

mkdir -p "$OUTPUT_DIR"

echo "Exporting Swagger documentation from $API_URL..."

curl -s "$API_URL/api-json" -o "$OUTPUT_DIR/$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo "✓ Swagger documentation exported to $OUTPUT_DIR/$OUTPUT_FILE"
  
  if command -v jq &> /dev/null; then
    jq '.' "$OUTPUT_DIR/$OUTPUT_FILE" > "$OUTPUT_DIR/swagger-formatted.json"
    echo "✓ Formatted version saved to $OUTPUT_DIR/swagger-formatted.json"
  fi
else
  echo "✗ Failed to export Swagger documentation"
  exit 1
fi
