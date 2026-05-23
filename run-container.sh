#!/usr/bin/env bash
# ===========================================================================
# run-container.sh
# Build, tag, and/or push TelemetryFlow Docker images.
#
# Usage:
#   ./run-container.sh [options]
#
# Options:
#   -b, --build <target>   Build target: frontend, backend, or all (default: all)
#   -t, --tag <version>    Override version tag (default: 1.4.0)
#   -p, --push <target>    Push only (skip build): frontend, backend, or all
#   -c, --complete         Complete: build, tag, and push all (backend + frontend)
#   -h, --help             Show help
#
# Examples:
#   ./run-container.sh                        # Build both, tag only
#   ./run-container.sh -b backend             # Build backend only
#   ./run-container.sh -b frontend -t 2.0.0   # Build frontend, custom tag
#   ./run-container.sh -p all                 # Push both (no build)
#   ./run-container.sh -p backend             # Push backend only
#   ./run-container.sh -b backend -p backend  # Build backend + push
#   ./run-container.sh -c                     # Build, tag, push everything
#   ./run-container.sh -c -t 2.0.0            # Complete with custom tag
#
# Images:
#   backend  → telemetryflow/telemetryflow-core
#   frontend → telemetryflow/telemetryflow-viz
#
# Tags generated per image:
#   :latest, :<version>, :<version>-<commit>, :demo-<YYYYMMDD>
# ===========================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
IMAGE_CORE="telemetryflow/telemetryflow-core"
IMAGE_VIZ="telemetryflow/telemetryflow-core-viz"
VERSION="1.4.0"
COMMIT=$(git rev-parse --short HEAD)
YYYYMMDD=$(date +"%Y%m%d")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
header() { echo -e "\n$1\n----------------------------------------------------------"; }

usage() {
  cat <<EOF
Usage: $0 [options]

Options:
  -b, --build <target>   Build target: frontend, backend, or all (default: all)
  -t, --tag <version>    Override version tag (default: ${VERSION})
  -p, --push <target>    Push only (skip build): frontend, backend, or all
  -c, --complete         Complete: build, tag, and push all (backend + frontend)
  -h, --help             Show this help

Examples:
  $0                        # Build both, tag only
  $0 -b backend             # Build backend only
  $0 -b frontend -t 2.0.0   # Build frontend, custom tag
  $0 -p all                 # Push both (no build)
  $0 -p backend             # Push backend only
  $0 -b backend -p backend  # Build backend + push
  $0 -c                     # Build, tag, push everything
  $0 -c -t 2.0.0            # Complete with custom tag
EOF
  exit 0
}

validate_target() {
  local target=$1
  local flag=$2
  case $target in
    frontend|backend|all) ;;
    *) echo "Error: invalid ${flag} target '${target}'. Use frontend, backend, or all."; exit 1 ;;
  esac
}

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
build_backend() {
  header "Building backend..."
  pnpm build:backend
  pnpm docker:build:backend
}

build_frontend() {
  header "Building frontend..."
  pnpm build:frontend
  pnpm docker:build:frontend
}

# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------
tag_image() {
  local image=$1
  local label=$2

  header "Tagging ${label}..."
  docker tag "${image}:latest" "${image}:${VERSION}"
  docker tag "${image}:latest" "${image}:${VERSION}-${COMMIT}"
  docker tag "${image}:latest" "${image}:demo-${YYYYMMDD}"
}

# ---------------------------------------------------------------------------
# Push
# ---------------------------------------------------------------------------
push_image() {
  local image=$1
  local label=$2

  header "Pushing ${label}..."
  docker push "${image}:latest"
  docker push "${image}:${VERSION}"
  docker push "${image}:${VERSION}-${COMMIT}"
  docker push "${image}:demo-${YYYYMMDD}"
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print_summary() {
  local image=$1
  local label=$2
  local action=$3

  echo "  [${label}] ${action}"
  echo "  ${image}:latest"
  echo "  ${image}:${VERSION}"
  echo "  ${image}:${VERSION}-${COMMIT}"
  echo "  ${image}:demo-${YYYYMMDD}"
}

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
BUILD_TARGET=""
PUSH_TARGET=""
DO_COMPLETE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -b|--build)     BUILD_TARGET="$2"; shift 2 ;;
    -t|--tag)       VERSION="$2";      shift 2 ;;
    -p|--push)      PUSH_TARGET="$2";  shift 2 ;;
    -c|--complete)  DO_COMPLETE=true;   shift   ;;
    -h|--help)      usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# --complete overrides: build all + push all
if $DO_COMPLETE; then
  BUILD_TARGET="all"
  PUSH_TARGET="all"
fi

# Default: build all if no flags given
if [[ -z "$BUILD_TARGET" && -z "$PUSH_TARGET" ]]; then
  BUILD_TARGET="all"
fi

# Validate targets
[[ -n "$BUILD_TARGET" ]] && validate_target "$BUILD_TARGET" "--build"
[[ -n "$PUSH_TARGET" ]]  && validate_target "$PUSH_TARGET" "--push"

# ---------------------------------------------------------------------------
# Execute — Build & Tag
# ---------------------------------------------------------------------------
if [[ -n "$BUILD_TARGET" ]]; then
  case $BUILD_TARGET in
    backend)
      build_backend
      tag_image "$IMAGE_CORE" "Core"
      ;;
    frontend)
      build_frontend
      tag_image "$IMAGE_VIZ" "Viz"
      ;;
    all)
      build_backend
      build_frontend
      tag_image "$IMAGE_CORE" "Core"
      tag_image "$IMAGE_VIZ" "Viz"
      ;;
  esac
fi

# ---------------------------------------------------------------------------
# Execute — Push
# ---------------------------------------------------------------------------
if [[ -n "$PUSH_TARGET" ]]; then
  case $PUSH_TARGET in
    backend)  push_image "$IMAGE_CORE" "Core" ;;
    frontend) push_image "$IMAGE_VIZ" "Viz" ;;
    all)
      push_image "$IMAGE_CORE" "Core"
      push_image "$IMAGE_VIZ" "Viz"
      ;;
  esac
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
header "Done."
if [[ -n "$BUILD_TARGET" ]]; then
  case $BUILD_TARGET in
    backend)  print_summary "$IMAGE_CORE" "Core" "built+tagged" ;;
    frontend) print_summary "$IMAGE_VIZ" "Viz" "built+tagged" ;;
    all)
      print_summary "$IMAGE_CORE" "Core" "built+tagged"
      echo ""
      print_summary "$IMAGE_VIZ" "Viz" "built+tagged"
      ;;
  esac
fi
if [[ -n "$PUSH_TARGET" ]]; then
  case $PUSH_TARGET in
    backend)  print_summary "$IMAGE_CORE" "Core" "pushed" ;;
    frontend) print_summary "$IMAGE_VIZ" "Viz" "pushed" ;;
    all)
      echo ""
      print_summary "$IMAGE_CORE" "Core" "pushed"
      echo ""
      print_summary "$IMAGE_VIZ" "Viz" "pushed"
      ;;
  esac
fi
