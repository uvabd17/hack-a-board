# Contributing

## Development Setup
1. `npm ci`
2. Copy `.env.example` to `.env`
3. Configure environment variables
4. `npx prisma migrate dev`
5. `npm run dev`

For socket server:
1. `cd socket-server`
2. `npm ci`
3. `npm run dev`

## Branch + PR workflow
- Create feature branches from `main`
- Keep PRs focused and small
- Include screenshots for UI changes
- Reference related issue IDs in PR descriptions

## Required Checks
- `npm run typecheck`
- `npm run lint` for changed files where practical

## Coding Guidelines
- Prefer server-side authorization checks for every write/read that handles private data
- Validate all external input with schema checks
- Avoid exposing secrets or tokens in logs
- Keep generated output (`dist`, `.next`) out of commits
