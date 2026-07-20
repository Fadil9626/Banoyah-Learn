#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Banoyah Learn — idempotent deploy / update.
#
# Run as the APP USER (never root/sudo): the pm2 process 'banoyah-learn' lives
# under this user's pm2 daemon — running as root creates a second, invisible
# daemon and you'll chase "process not found" / EACCES ghosts.
#
#   ./deploy.sh            # deploy the main branch
#   ./deploy.sh some-branch
#
# First-time server provisioning (DB, .env, nginx, TLS) is in README.md →
# "Production deployment". This script only updates an already-provisioned box.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_APP="${PM2_APP:-banoyah-learn}"
BRANCH="${1:-main}"

cd "$APP_DIR"
echo "▶ Deploying Banoyah Learn ($BRANCH) from $APP_DIR"

if [ ! -f backend/.env ]; then
  echo "✖ backend/.env is missing — this looks like a fresh box."
  echo "  Follow README.md → 'Production deployment' first, then re-run."
  exit 1
fi

echo "▶ Fetching latest…"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "▶ Backend dependencies…"
cd "$APP_DIR/backend"
npm ci --omit=dev          # migrations run on boot (server.js → migrate())

echo "▶ Building frontend…"
cd "$APP_DIR/frontend"
npm ci                     # dev deps needed for the Vite build
npm run build              # → frontend/dist, served by the backend on one port

echo "▶ Restarting pm2 process '$PM2_APP'…"
cd "$APP_DIR"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

PORT_HINT="$(grep -E '^PORT=' backend/.env | cut -d= -f2 || true)"
echo "✅ Deployed. Health check:  curl -s localhost:${PORT_HINT:-5300}/api/health"
