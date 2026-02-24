#!/bin/bash
# ================================================================
# Update script — run on Oracle VM to pull latest changes
# Usage: ./oracle-update.sh
# ================================================================

set -e

APP_DIR="/opt/hackaboard-socket"
SERVICE_NAME="hackaboard-socket"

echo "[1/3] Pulling latest changes from GitHub..."
cd "$APP_DIR"

# Save .env
cp .env /tmp/socket-env-backup

git fetch origin main
git reset --hard origin/main

# Restore .env (git reset would not remove it, but just in case)
cp /tmp/socket-env-backup .env

echo "[2/3] Rebuilding..."
npm ci
npm run build

echo "[3/3] Restarting service..."
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "✅ Update complete!"
echo "Logs: journalctl -u $SERVICE_NAME -f"
