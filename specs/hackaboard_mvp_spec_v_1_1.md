# hack<a>board — Complete MVP Technical Specification

> **Version:** 1.1  
> **Last Updated:** February 2026  
> **Status:** Ready to Build (Revised)

---

## Table of Contents

1. Executive Summary  
2. Product Philosophy  
3. Homepage Design Specification  
4. Complete Data Model  
5. Page-by-Page Breakdown  
6. Core User Flows  
7. Real-Time System  
8. Scoring Engine  
9. Display System  
10. Ceremony System (Updated)  
11. API Reference  
12. Edge Cases & Rules  
13. Implementation Checklist  
14. Success Criteria  
15. Tech Stack

---

# 1. Executive Summary

## What We’re Building

**hack<a>board** is a real-time hackathon platform designed for organizers to make events feel like real competitive hackathons.

Core experience:

- Live leaderboard (ticker-style feel)
- Real-time judging updates
- Problem statement tracking
- Freeze + suspense mode
- Controlled ceremony reveal

## MVP Scope

### IN

- Organizer-created hackathons
- Team registration
- Problem statements
- Multi-round scoring
- Time bonus / penalty
- QR-based judging
- Live leaderboard display
- Organizer-controlled ceremony
- Participant dashboards

### OUT (Phase 2)

- Multi-organizer roles
- Payments
- Networking directory
- Email system
- Bulk imports

---

# 2. Product Philosophy

Goal:

> Make hackathons feel competitive, alive, and professional — using a clean developer-terminal aesthetic.

Principles:

- Minimal friction
- High-energy visual feedback without heavy neon
- Deterministic scoring and ceremony results
- Organizer-first control

---

# 3. Homepage Design Specification

## Purpose

Homepage is the organizer entry point. It should immediately communicate that this product helps organizers run a serious, modern hackathon.

## Visual Direction

- Developer terminal aesthetic
- Dark background
- Subtle grid/dot texture allowed
- Neon accents: restrained (not neon-heavy)
- Text-first branding (no logo in MVP)

## Layout

### Top Bar (minimal)

Right-aligned:

- Organizer Login

### Hero (full viewport)

Centered both vertically and horizontally.

```
hack<a>board

Real-time scoring for hackathons
Live leaderboards • Judging • Ceremony

[ Create New Hackathon ]   [ View Demo ]
```

Rules:

- App name centered and dominant
- Primary CTA = Create New Hackathon
- Secondary CTA = View Demo
- No mission-control terminology

### Supporting Sections (below fold)

1. Value statement
2. Feature highlights (3–5 cards)
3. How it works (Create → Register → Judge → Reveal)
4. Minimal footer (Terms / Privacy)

---

# 4. Complete Data Model

> Existing schema retained from v1.0 unless modified below.

## New Model: CeremonySession

```prisma
model CeremonySession {
  id              String   @id @default(cuid())
  hackathonId     String

  mode            String   // "problem-wise" | "overall"
  revealCount     Int      // 1 | 3 | 5 | 10

  isStarted       Boolean  @default(false)
  startedAt       DateTime?

  winnersSnapshot Json
  currentIndex    Int      @default(0)

  hackathon Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  @@index([hackathonId])
}
```

### Notes

- Winners are snapshotted once ceremony begins.
- Display and organizer UI read from this state.

---

# 5. Page-by-Page Breakdown

All pages from v1.0 remain, with the following updates.

## Platform Homepage (`/`)

Use the Homepage Design Specification above.

## Participant Dashboard (`/h/[slug]/dashboard`)

### Freeze Behavior

When leaderboard is frozen:

- Hide rank
- Hide score
- Hide trend arrows

Show:

```
RANK: 🔒 Hidden until ceremony
SCORE: 🔒 Hidden until ceremony
```

Timers and submissions remain visible.

## Display Controller (`/h/[slug]/manage/display`)

### New Ceremony Setup Section

```
CEREMONY SETUP

Mode:
○ Problem Statement Winners
○ Overall Winners

If Overall:
  ○ Top 3
  ○ Top 5
  ○ Top 10

[ Start Ceremony ]
(Double confirmation required)
```

After start:

```
Ceremony Active
Current Reveal: X / Y
[ Reveal Next ]
```

---

# 6. Core User Flows

## Updated Flow: Ceremony Reveal

### Pre-Ceremony

1. Organizer freezes leaderboard.
2. Participant dashboards hide rankings.
3. Scoring continues in backend.

### Ceremony Setup

1. Organizer opens Ceremony Controller.
2. Selects mode:
   - Problem Statement Winners (Top 1 per PS)
   - Overall Winners (Top 3/5/10)
3. Double confirmation required.

### Snapshot Generation

System computes winners and saves `winnersSnapshot`.

Tie-breaks:
1. Earlier submission time
2. Earlier team creation time

### Reveal

- Organizer clicks Reveal Next.
- `currentIndex` increments.
- Display reveals next winner.

### End

Ceremony ends when all winners are revealed.

---

# 7. Real-Time System

## New Events

```ts
display:ceremony-started {
  mode,
  totalWinners
}

display:ceremony-reveal {
  index,
  teamName,
  score,
  problemStatement?
}
```

## Existing events remain unchanged.

---

# 8. Scoring Engine

Scoring formula remains unchanged from v1.0.

### Tie Handling (New)

When scores are equal:

1. Earliest submission time wins
2. Earlier team creation time as fallback

---

# 9. Display System

## Leaderboard Freeze

Freeze means:

- Display can stay on leaderboard or switch scenes.
- Rankings stop updating visually.
- Backend scoring continues.

## Ceremony Display

Display reads from `CeremonySession` only.

This makes ceremony deterministic and refresh-safe.

---

# 10. Ceremony System (Updated)

## Modes

### Problem Statement Winners

- Top 1 eligible team per problem statement.
- Teams must have scored submissions.
- Empty tracks are skipped.

### Overall Winners

- Top N teams from global leaderboard.
- N = 3 / 5 / 10.

## Visibility Rules

- Ceremony controls are organizer-only.
- Public display is view-only.

## Snapshot Rule

Once ceremony starts:

- Winner list is locked.
- Later judging changes do not affect ceremony.

## Recommended UX

Show a preview list before final confirmation.

---

# 11. API Reference (Additions)

```
POST /api/h/[slug]/ceremony/start
POST /api/h/[slug]/ceremony/reveal-next
GET  /api/h/[slug]/ceremony/state
```

Existing endpoints remain as in v1.0.

---

# 12. Edge Cases & Rules

- Problem statement with no scored teams → skipped.
- Display reconnect mid-ceremony → hydrate from CeremonySession.
- Organizer refresh → state restored via currentIndex.
- Duplicate reveal clicks prevented server-side.

---

# 13. Implementation Checklist (Additions)

### Ceremony & Freeze

- [ ] Leaderboard visibility freeze flag
- [ ] Participant dashboard hidden rank state
- [ ] CeremonySession model
- [ ] Ceremony start snapshot logic
- [ ] Reveal-next endpoint
- [ ] Display rehydration logic

### Homepage

- [ ] Terminal-style hero layout
- [ ] Centered text-only branding
- [ ] Create New Hackathon CTA

---

# 14. Success Criteria (Additions)

- [ ] Freezing hides ranks for all participants within 5s
- [ ] Ceremony reveals stay stable after refresh
- [ ] Organizer can run ceremony without ranking drift

---

# 15. Tech Stack

Unchanged from v1.0:

- Next.js 14 (App Router)
- Prisma + Postgres
- NextAuth.js
- Socket.IO
- Tailwind CSS + shadcn/ui
- Zod + React Hook Form
- QR libraries
- Vercel + Render

---

**END OF DOCUMENT**

