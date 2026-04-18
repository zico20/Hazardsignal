#!/usr/bin/env bash
set -euo pipefail

REMOTE_ROOT="/opt/fire-risk/current"
cd "$REMOTE_ROOT"

deploy_web=false
deploy_worker=false

for arg in "$@"; do
  case "$arg" in
    --web)    deploy_web=true ;;
    --worker) deploy_worker=true ;;
  esac
done

echo "[deploy] Pulling latest code..."
git pull origin main

if [[ "$deploy_worker" == "true" ]]; then
  echo "[deploy] Restarting worker..."
  sudo systemctl restart fire-risk-worker
  echo "[deploy] Worker restarted."
fi

if [[ "$deploy_web" == "true" ]]; then
  echo "[deploy] Building web..."
  ./scripts/prepare-production.sh
  sudo systemctl restart fire-risk-web
  echo "[deploy] Web rebuilt and restarted."
fi

echo "[deploy] Done."
