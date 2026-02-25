# hack<a>board

Real-time hackathon operations platform with:
- organizer control panel
- participant dashboard + submissions
- judge QR scoring flow
- live public/display leaderboard
- ceremony reveal mode

## Stack
- Next.js (App Router) on Vercel
- PostgreSQL + Prisma
- Socket.IO server (Render)
- Optional Upstash Redis (rate limit + realtime helpers)

## Local setup
1. Install deps: `npm ci`
2. Copy env: `cp .env.example .env`
3. Set required variables in `.env`
4. Run migrations: `npx prisma migrate dev`
5. Seed (optional): `npm run db:seed`
6. Start app: `npm run dev`
7. Start socket server: `cd socket-server && npm ci && npm run dev`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run db:migrate:deploy`
- `npm run db:seed`

## Production deployment
1. Set all required env vars in Vercel and Render.
2. Ensure DB migrations are committed in `prisma/migrations`.
3. Run migrations during deploy (`npm run db:migrate:deploy` or `npm run build`).
4. Configure Render socket `CLIENT_ORIGIN` and `EMIT_SECRET` to match app env.
5. Keep socket health endpoint monitored (`/health`) and alerting enabled.

## Security + reliability notes
- Server actions are role-scoped (organizer/judge/participant).
- Judge/participant token routes are rate-limited.
- Registration and scoring submissions are rate-limited.
- CSP is stricter in production than development.
- CI runs typecheck on push/PR.

## Governance (GitHub)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- issue templates and PR template under `.github/`

## Legal Pages (App)
- `/terms`
- `/privacy`
- `/security`
