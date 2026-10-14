#!/usr/bin/env bash
# Pull-based production deploy, installed as /usr/local/sbin/flaggo-deploy and
# run as root by flaggo-deploy.timer. When origin/main has moved, it builds the
# web app and the API as the unprivileged flaggo-build user (read-only deploy
# key), then publishes them. `--force` redeploys the current commit.
# Root runs the installed copy, so re-install it by hand after changing this file.
set -euo pipefail

REPO=/var/lib/flaggo-build/flaggo
BUILD_USER=flaggo-build
BUILD_ENV=/etc/flaggo/build.env
WEB_ROOT=/var/www/flaggo.rohanahire.com
API_DIR=/opt/flaggo-api
STATE=/var/lib/flaggo-deploy/deployed-sha
NODE_BIN=/opt/nodejs-26/bin

as_builder() {
  runuser -u "$BUILD_USER" -- env HOME=/var/lib/flaggo-build PATH="$NODE_BIN:/usr/bin:/bin" bash -c "cd '$REPO' && $1"
}

as_builder "git fetch -q origin main"
sha=$(as_builder "git rev-parse origin/main")
if [[ "${1:-}" != "--force" && -f "$STATE" && "$(cat "$STATE")" == "$sha" ]]; then
  exit 0
fi

echo "Deploying $sha"
as_builder "git reset -q --hard '$sha' && npm ci --no-audit --no-fund --loglevel=error"
as_builder "set -a && . '$BUILD_ENV' && set +a && npm run build && npm run build:server"

# Old hashed assets are kept so open tabs and cached service workers can still
# load their chunks; index.html and the service worker go last.
rsync -a --chown=root:root --exclude index.html --exclude sw.js "$REPO/dist/" "$WEB_ROOT/"
install -m 0644 "$REPO/dist/sw.js" "$WEB_ROOT/sw.js"
install -m 0644 "$REPO/dist/index.html" "$WEB_ROOT/index.html"

install -D -m 0644 "$REPO/server/dist/flaggo-api.mjs" "$API_DIR/flaggo-api.mjs"
systemctl restart flaggo-api

mkdir -p "$(dirname "$STATE")"
echo "$sha" > "$STATE"
echo "Deployed $sha"
