#!/usr/bin/env bash
set -euo pipefail

APP_URL="${1:-}"
SOCKET_URL="${2:-}"

if [[ -z "$APP_URL" || -z "$SOCKET_URL" ]]; then
  echo "Usage: ./scripts/prod-smoke.sh <APP_URL> <SOCKET_URL>"
  echo "Example: ./scripts/prod-smoke.sh https://hack-a-board.vercel.app https://hackaboard-socket.fly.dev"
  exit 1
fi

echo "== Hackaboard production smoke check =="
echo "App URL:    $APP_URL"
echo "Socket URL: $SOCKET_URL"
echo

echo "1) Socket health endpoint"
SOCKET_HEALTH="$(curl -fsS --max-time 10 "$SOCKET_URL/health")" || {
  echo "FAIL: socket health check failed"
  exit 1
}
echo "OK: $SOCKET_HEALTH"
echo

echo "2) App home availability"
APP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$APP_URL/")"
if [[ "$APP_STATUS" != "200" ]]; then
  echo "FAIL: app home returned HTTP $APP_STATUS"
  exit 1
fi
echo "OK: app home returned HTTP 200"
echo

echo "3) Sign-in page availability"
SIGNIN_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$APP_URL/signin")"
if [[ "$SIGNIN_STATUS" != "200" ]]; then
  echo "FAIL: /signin returned HTTP $SIGNIN_STATUS"
  exit 1
fi
echo "OK: /signin returned HTTP 200"
echo

cat <<'EOF'
4) Manual realtime check (required)
  a) Open organizer manage page in one tab.
  b) Open /h/<slug>/display in a second tab.
  c) Trigger freeze/unfreeze, marks update, filter change, auto-cycle change.
  d) Confirm display updates without refresh.
  e) Confirm status badge transitions: CONNECTING/LIVE/RECONNECTING/OFFLINE.

5) Manual participant re-entry check (required)
  a) Register a participant.
  b) Close browser tab/session.
  c) Open /h/<slug>/participant-login.
  d) Login with email + team code.
  e) Confirm dashboard opens and live updates continue.
EOF

echo
echo "Smoke checks completed. Manual realtime/re-entry checks still required."

