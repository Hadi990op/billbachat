#!/bin/bash
# Adds billbachat nip.io route to Caddy via admin API
# Runs on boot after Caddy starts

DOMAIN="billbachat.2604-f440-5-3-3-67a1-d07e-ea61.nip.io"
API="http://localhost:2019"

# Wait for Caddy to be ready
for i in $(seq 1 30); do
  if curl -s --max-time 2 "$API/config/" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Check if route already exists
EXISTING=$(curl -s "$API/config/apps/http/servers/srv0" 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    for route in d.get('routes', []):
        for m in route.get('match', []):
            if '$DOMAIN' in m.get('host', []):
                print('exists')
                sys.exit()
    print('not_exists')
except:
    print('not_exists')
" 2>/dev/null)

if [ "$EXISTING" = "exists" ]; then
  echo "Route already exists, skipping"
  exit 0
fi

# Add pass-through route for /billbachat/* paths
curl -s -X POST "$API/config/apps/http/servers/srv0/routes" \
  -H "Content-Type: application/json" \
  -d "{
    \"match\": [{\"host\": [\"$DOMAIN\"], \"path\": [\"/billbachat/*\"]}],
    \"handle\": [{
      \"handler\": \"reverse_proxy\",
      \"upstreams\": [{\"dial\": \"localhost:9100\"}]
    }]
  }" > /dev/null

# Add rewrite route for everything else
curl -s -X POST "$API/config/apps/http/servers/srv0/routes" \
  -H "Content-Type: application/json" \
  -d "{
    \"match\": [{\"host\": [\"$DOMAIN\"]}],
    \"handle\": [{
      \"handler\": \"rewrite\",
      \"uri\": \"/billbachat{http.request.uri}\"
    }, {
      \"handler\": \"reverse_proxy\",
      \"upstreams\": [{\"dial\": \"localhost:9100\"}]
    }]
  }" > /dev/null

echo "Route added for $DOMAIN"
