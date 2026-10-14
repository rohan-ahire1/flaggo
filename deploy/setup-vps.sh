#!/usr/bin/env bash
# One-time VPS setup for Flaggo hosting. Run from a Mac with `ssh vps` and `gh`
# access, after this branch is merged to main:  bash deploy/setup-vps.sh
# Safe to re-run. It never overwrites /etc/flaggo/api.env once it exists.
set -euo pipefail

HOST=${FLAGGO_VPS:-vps}
REPO=rohan-ahire1/flaggo
SUPABASE_URL=https://nwqlxddakhicwptwstkk.supabase.co
SUPABASE_ANON_KEY=sb_publishable_zdoyjhgLiQG1UxqXcGMkJw_1Zs7FRRT # public (publishable) key
SITE_URL=https://flaggo.rohanahire.com

echo "1/4 Users, directories and build key"
pubkey=$(ssh "$HOST" 'sudo bash -s' <<'EOF'
set -euo pipefail
id flaggo-build >/dev/null 2>&1 || useradd --system --home-dir /var/lib/flaggo-build --create-home --shell /usr/sbin/nologin flaggo-build
id flaggo-api >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /opt/flaggo-api --shell /usr/sbin/nologin flaggo-api
install -d -m 0755 /opt/flaggo-api /etc/flaggo /var/lib/flaggo-deploy
install -d -m 0700 -o flaggo-build -g flaggo-build /var/lib/flaggo-build/.ssh
if [[ ! -f /var/lib/flaggo-build/.ssh/id_ed25519 ]]; then
  runuser -u flaggo-build -- ssh-keygen -q -t ed25519 -N "" -C flaggo-deploy@vps -f /var/lib/flaggo-build/.ssh/id_ed25519
fi
ssh-keyscan -t ed25519 github.com 2>/dev/null > /var/lib/flaggo-build/.ssh/known_hosts
chown flaggo-build:flaggo-build /var/lib/flaggo-build/.ssh/known_hosts
cat /var/lib/flaggo-build/.ssh/id_ed25519.pub
EOF
)

if ! gh repo deploy-key list -R "$REPO" | grep -q "VPS flaggo-deploy"; then
  echo "    adding read-only deploy key to $REPO"
  keyfile=$(mktemp)
  echo "$pubkey" > "$keyfile"
  gh repo deploy-key add "$keyfile" -R "$REPO" -t "VPS flaggo-deploy (read-only)"
  rm -f "$keyfile"
fi

echo "2/4 Clone, env files and systemd units"
ssh "$HOST" "sudo SUPABASE_URL='$SUPABASE_URL' SUPABASE_ANON_KEY='$SUPABASE_ANON_KEY' SITE_URL='$SITE_URL' bash -s" <<'EOF'
set -euo pipefail
clone=/var/lib/flaggo-build/flaggo
if [[ ! -d $clone/.git ]]; then
  runuser -u flaggo-build -- git clone -q git@github.com:rohan-ahire1/flaggo.git "$clone"
fi
runuser -u flaggo-build -- git -C "$clone" fetch -q origin main
runuser -u flaggo-build -- git -C "$clone" reset -q --hard origin/main

cat > /etc/flaggo/build.env <<ENV
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
VITE_SITE_URL=$SITE_URL
VITE_ADS_ENABLED=false
VITE_MONETIZATION_ENABLED=false
ENV
chmod 0644 /etc/flaggo/build.env

if [[ ! -f /etc/flaggo/api.env ]]; then
  cat > /etc/flaggo/api.env <<ENV
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=$SITE_URL
ENV
fi
chown root:flaggo-api /etc/flaggo/api.env
chmod 0640 /etc/flaggo/api.env

install -m 0755 "$clone/deploy/vps-deploy.sh" /usr/local/sbin/flaggo-deploy
install -m 0644 "$clone/deploy/flaggo-api.service" "$clone/deploy/flaggo-deploy.service" "$clone/deploy/flaggo-deploy.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable -q flaggo-api.service
EOF

echo "3/4 First deploy (builds main; takes a few minutes)"
ssh "$HOST" 'sudo /usr/local/sbin/flaggo-deploy --force'
# The API was just restarted; give it a moment to bind its port.
ssh "$HOST" 'for _ in $(seq 20); do curl -fsS http://127.0.0.1:8796/api/health && echo && exit 0; sleep 0.5; done; exit 1'

echo "4/4 Caddy: proxy /api to the Flaggo API"
ssh "$HOST" 'sudo bash -s' <<'EOF'
set -euo pipefail
cf=/etc/caddy/Caddyfile
if ! grep -q "reverse_proxy 127.0.0.1:8796" "$cf"; then
  cp "$cf" "$cf.before-flaggo-api-$(date +%Y%m%d%H%M%S)"
  python3 - "$cf" /var/lib/flaggo-build/flaggo/deploy/Caddyfile <<'PY'
import re, sys
caddyfile, snippet = sys.argv[1], sys.argv[2]
text = open(caddyfile).read()
block = open(snippet).read()
block = block[block.index("flaggo.rohanahire.com {"):].rstrip() + "\n"
new, n = re.subn(r"^flaggo\.rohanahire\.com \{\n.*?^\}\n", block, text, count=1, flags=re.S | re.M)
if n != 1:
    sys.exit("flaggo.rohanahire.com block not found")
open(caddyfile, "w").write(new)
PY
  caddy validate --config "$cf" --adapter caddyfile >/dev/null
  systemctl reload caddy
fi
systemctl enable -q --now flaggo-deploy.timer
EOF

curl -fsS https://flaggo.rohanahire.com/api/health && echo
cat <<'MSG'

Done. Last step: put the Supabase service-role key on the server
(Supabase dashboard > Project Settings > API keys > secret / service_role):

  ssh -t vps 'sudoedit /etc/flaggo/api.env && sudo systemctl restart flaggo-api'
MSG
