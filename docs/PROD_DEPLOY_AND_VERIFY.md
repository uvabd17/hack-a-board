# Production Deploy + Verify

## 1) Deploy sequence
1. Deploy `socket-server` first.
2. Verify socket is healthy: `GET /health`.
3. Deploy Next.js app.
4. Run Prisma migration on production DB:
   - `npm run db:migrate:deploy`

## 2) Required env parity
1. `EMIT_SECRET` must match in app + socket server.
2. `SOCKET_SERVER_URL` (app server-side) must point to deployed socket URL.
3. `NEXT_PUBLIC_SOCKET_SERVER_URL` (browser) must point to deployed socket URL.
4. `CLIENT_ORIGIN` (socket server) must include deployed app origin.

## 3) Automated quick smoke
Run from repo root:

```bash
chmod +x scripts/prod-smoke.sh
./scripts/prod-smoke.sh https://<app-domain> https://<socket-domain>
```

## 4) 5-minute manual live checklist
1. Open organizer manage controls and `/h/<slug>/display` in two tabs.
2. Trigger freeze/unfreeze and confirm display updates instantly.
3. Change filter or display mode and confirm no refresh needed.
4. Update marks and confirm score movement appears live.
5. Confirm connection badge shows sane state transitions.
6. Register participant, close tab, reopen via `/h/<slug>/participant-login`.
7. Login with email + team code and confirm dashboard opens.

## 5) If live updates fail
1. Check socket `/health`.
2. Check browser console for socket reconnect loops.
3. Verify `EMIT_SECRET` exact match between app and socket.
4. Verify app can reach socket URL from server environment.
5. Check socket server logs for `/emit` auth failures (401).

