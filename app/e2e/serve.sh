#!/bin/sh
# Rebuild and restart the local production server behind the TLS proxy.
#
# Written because "the endpoint 404s" cost two debugging detours in a row, both
# times because a previous node was still holding :8796: the new process died
# on EADDRINUSE, nohup swallowed the error, and the old build kept answering.
# Kill by port, wait for it to actually let go, then verify by start time.
set -e
cd "$(dirname "$0")/.."
(cd client && npm run build >/dev/null)
(cd server && npm run build >/dev/null)

OLD=$(fuser 8796/tcp 2>/dev/null | tr -d ' ' || true)
if [ -n "$OLD" ]; then kill $OLD 2>/dev/null || true; fi
for i in 1 2 3 4 5 6 7 8 9 10; do
  fuser 8796/tcp >/dev/null 2>&1 || break
  sleep 0.5
done

cd server
NODE_ENV=production PORT=8796 BACKUPS_ENABLED=false \
  DB_PATH=/tmp/cmp/w.db CLIENT_DIR="$PWD/../client/dist" \
  SESSION_SECRET=$(openssl rand -hex 32) \
  nohup node dist/index.js > /tmp/claude-0/server.log 2>&1 &

for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if curl -sk -o /dev/null https://127.0.0.1:8797/api/health 2>/dev/null; then break; fi
done
echo "serving:"; ps -o pid,lstart,cmd -C node | grep 'dist/index.js'
