Upstash Realtime integration
============================

This project includes an optional integration with Upstash Realtime to provide a serverless pub/sub layer for realtime events.

What was added
- `src/lib/upstash-publish.ts` — helper to publish events via Upstash REST.
- `src/lib/socket-emit.ts` — will use Upstash publish when `UPSTASH_PUBLISH_URL` and `UPSTASH_PUBLISH_TOKEN` are set.
- `src/lib/socket-client.ts` — browser adapter that uses Upstash WebSocket when `NEXT_PUBLIC_UPSTASH_WS_URL` is set; otherwise falls back to Socket.IO.

Required environment variables

Server (used by Next.js server actions)
- `UPSTASH_PUBLISH_URL` — Upstash publish endpoint (provided by Upstash dashboard).
- `UPSTASH_PUBLISH_TOKEN` — Bearer token for publish calls.

Client (used by browser)
- `NEXT_PUBLIC_UPSTASH_WS_URL` — Upstash Realtime WebSocket URL (e.g. `wss://<...>.upstash.io/ws` or cloud URL).
- `NEXT_PUBLIC_UPSTASH_TOKEN` — (optional) token/query used for authenticating the WS connection.

Fallbacks
- If the Upstash env vars are not set, the app will continue to use the existing Socket.IO server via `SOCKET_SERVER_URL` and `EMIT_SECRET`.

Vercel deployment steps
1. In the Vercel dashboard, add the four env vars above (or `vercel env add` via CLI).
2. Redeploy the project.

Notes
- The Upstash adapter expects messages with an `event` field (e.g. `{ event: "score-updated", data: {...} }`). If Upstash wraps messages differently, adjust `src/lib/socket-client.ts` onmessage parsing.
- Upstash free tier has connection and throughput limits — monitor usage and upgrade if needed.
