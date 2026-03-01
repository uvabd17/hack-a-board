<p align="center">
  <img src="public/hackaboard-title.svg" alt="hack<a>board" width="736" />
</p>

<p align="center">
  Real-time hackathon operations platform for organizers, judges, and participants.
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#tech-stack">Tech Stack</a> |
  <a href="#local-setup">Local Setup</a> |
  <a href="#production-deployment">Deployment</a> |
  <a href="#governance">Governance</a>
</p>

## Features

| Area | What you get |
| --- | --- |
| Organizer | Control panel for phases, rounds, teams, judges, and display state |
| Participants | Registration flow, dashboard, and submission handling |
| Judges | QR-based scoring flow with protected scoring routes |
| Audience | Live display leaderboard and ceremony reveal mode |
| Platform | Role-scoped server actions, rate limits, and production CSP hardening |

## Tech Stack

- Frontend/App: Next.js (App Router), React, TypeScript
- Data layer: PostgreSQL, Prisma
- Realtime: Socket.IO server (`socket-server/`), optional Upstash Redis helpers
- Deploy: Vercel (app) + Render (socket server)

## Local Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Fill required variables in `.env`.
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed sample data (optional):
   ```bash
   npm run db:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```
7. Start the socket server in another terminal:
   ```bash
   cd socket-server
   npm ci
   npm run dev
   ```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Next.js in development |
| `npm run build` | Generate Prisma client and build app |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run db:migrate:deploy` | Apply production migrations |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset DB and reseed |

## Production Deployment

1. Configure all required environment variables in Vercel and Render.
2. Commit Prisma migrations under `prisma/migrations`.
3. Run migrations during deploy (`npm run db:migrate:deploy`).
4. Configure socket server `CLIENT_ORIGIN` and `EMIT_SECRET` to match app settings.
5. Monitor socket health endpoint at `/health`.

## Security and Reliability

- Role-scoped server actions (organizer/judge/participant).
- Rate limits on judge/participant token routes.
- Rate limits on registration and scoring submissions.
- Stronger CSP rules in production.
- CI includes type checking on push and pull requests.

## Governance

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [SECURITY.md](SECURITY.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Issue templates and PR template under `.github/`

## Legal Pages

- `/terms`
- `/privacy`
- `/security`
