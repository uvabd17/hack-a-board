# Hackaboard MVP - Complete Technical Specification
## The "Wall Street Ticker" Hackathon Platform

> **Version:** 1.0 Final  
> **Last Updated:** February 19, 2026  
> **Status:** Ready to Build  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Data Model](#complete-data-model)
3. [Page-by-Page Breakdown](#page-by-page-breakdown)
4. [Core User Flows](#core-user-flows)
5. [Real-Time System](#real-time-system)
6. [Scoring Engine](#scoring-engine)
7. [Display System](#display-system)
8. [API Reference](#api-reference)
9. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### What We're Building

A live hackathon management platform centered around a **Wall Street ticker-style leaderboard** that:
- Updates in real-time with trend arrows (↑ 15, ↓ 3)
- Auto-pages through teams (PAGE 1/4 → 2/4 → 3/4 → 4/4 → loop)
- Supports multiple problem statements with separate leaderboards
- Has manual ceremony reveals with winner announcements per problem statement
- Includes time bonuses/penalties for early/late submissions

### The Magic Moment

**3:00 PM, Hour 5 of hacking:**
- Team "Phoenix" submits Round 1 links 10 mins early → +20 time bonus
- Judge scans their QR → Scores Innovation 🔥(5), Feasibility ⭐(4)
- **2 seconds later:** Display shows "Phoenix ↑ 15" (jumped #28→#13)
- Their dashboard updates: "Rank: #13"
- Room energy spikes

### MVP Scope

**IN:**
- ✅ Single organizer per hackathon
- ✅ Self-registration with team formation
- ✅ Problem statements (teams choose on-site)
- ✅ Multi-round scoring with time bonuses/penalties
- ✅ QR-based judge authentication and scoring
- ✅ Real-time leaderboard with trend arrows
- ✅ Problem statement-specific leaderboards (auto-cycle)
- ✅ Manual check-in by organizer
- ✅ Ceremony with one winner per problem statement
- ✅ Participant dashboard with live rank

**OUT (Phase 2):**
- ❌ Bulk CSV import
- ❌ Multiple organizers
- ❌ Volunteer scanner system
- ❌ Email notifications
- ❌ Payment tracking
- ❌ Grand Champion (overall winner)
- ❌ Networking directory

---

## Complete Data Model

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION (NextAuth)
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  hackathons    Hackathon[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// HACKATHON CORE
// ============================================

model Hackathon {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  tagline     String?
  description String?  @db.Text

  // Dates
  startDate   DateTime
  endDate     DateTime
  timezone    String   @default("Asia/Kolkata")

  // Location
  mode        String   @default("in-person") // "in-person" | "online" | "hybrid"
  venue       String?
  onlineLink  String?

  // Team config
  minTeamSize     Int     @default(1)
  maxTeamSize     Int     @default(4)
  maxTeams        Int     @default(0) // 0 = unlimited
  requireApproval Boolean @default(false)

  // Registration
  registrationDeadline DateTime?

  // Status
  status        String    @default("draft") // "draft" | "published" | "live" | "ended"
  liveStartedAt DateTime?
  endedAt       DateTime?

  // Scoring config
  timeBonusRate   Float @default(2.0)  // +2 pts per minute early
  timePenaltyRate Float @default(1.0)  // -1 pt per minute late

  // Ownership
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  teams              Team[]
  participants       Participant[]
  rounds             Round[]
  judges             Judge[]
  problemStatements  ProblemStatement[]
  phases             Phase[]

  @@index([slug])
  @@index([userId])
  @@index([status])
}

// ============================================
// PROBLEM STATEMENTS (TRACKS)
// ============================================

model ProblemStatement {
  id           String   @id @default(cuid())
  hackathonId  String
  slug         String   // "fintech", "healthtech"
  title        String   // "FinTech Innovation"
  description  String   @db.Text
  icon         String?  // Emoji or icon identifier
  
  // Release control
  isReleased   Boolean  @default(false)
  releasedAt   DateTime?

  // Display order
  order        Int      @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  hackathon    Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  teams        Team[]

  @@unique([hackathonId, slug])
  @@index([hackathonId])
  @@index([isReleased])
}

// ============================================
// TEAMS & PARTICIPANTS
// ============================================

model Team {
  id         String @id @default(cuid())
  hackathonId String
  name       String
  inviteCode String @unique // 6-char code for joining

  // Problem statement selection
  problemStatementId String?
  selectedAt         DateTime?

  // Status
  status String @default("pending") // "pending" | "approved" | "rejected"

  // Check-in
  isCheckedIn Boolean @default(false)
  checkedInAt DateTime?
  checkedInBy String? // User ID of organizer who checked them in

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hackathon        Hackathon         @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  problemStatement ProblemStatement? @relation(fields: [problemStatementId], references: [id], onDelete: SetNull)
  participants     Participant[]
  submissions      Submission[]
  scores           Score[]

  @@index([hackathonId])
  @@index([inviteCode])
  @@index([status])
  @@index([problemStatementId])
}

model Participant {
  id          String  @id @default(cuid())
  hackathonId String
  teamId      String

  // Personal info
  name    String
  email   String
  phone   String?
  college String?

  // Role in team
  role String // "leader" | "member"

  // Authentication
  qrToken String @unique // Universal QR for everything

  // Status
  status String @default("approved") // Always approved for self-reg

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hackathon Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  team      Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([hackathonId, email])
  @@index([qrToken])
  @@index([teamId])
}

// ============================================
// ROUNDS & CRITERIA
// ============================================

model Round {
  id          String @id @default(cuid())
  hackathonId String
  name        String   // "Round 1: Ideation"
  order       Int      // 1, 2, 3

  // Weight in final score
  weight Int @default(100) // Percentage (must sum to 100)

  // Checkpoint
  checkpointTime DateTime

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hackathon   Hackathon   @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  criteria    Criterion[]
  submissions Submission[]
  scores      Score[]

  @@index([hackathonId])
  @@index([order])
}

model Criterion {
  id      String @id @default(cuid())
  roundId String
  name    String // "Innovation", "Execution"
  weight  Int    // Percentage within round (must sum to 100)

  // Relations
  round  Round   @relation(fields: [roundId], references: [id], onDelete: Cascade)
  scores Score[]

  @@index([roundId])
}

// ============================================
// SUBMISSIONS
// ============================================

model Submission {
  id      String @id @default(cuid())
  teamId  String
  roundId String

  // Links
  githubUrl       String?
  demoUrl         String?
  presentationUrl String?
  otherUrl        String?

  // Timing
  submittedAt DateTime @default(now())
  
  // Time bonus/penalty (calculated at submission)
  timeBonus Float @default(0) // Can be negative for penalty

  // Relations
  team  Team  @relation(fields: [teamId], references: [id], onDelete: Cascade)
  round Round @relation(fields: [roundId], references: [id], onDelete: Cascade)

  @@unique([teamId, roundId])
  @@index([teamId])
  @@index([roundId])
}

// ============================================
// JUDGING & SCORING
// ============================================

model Judge {
  id          String  @id @default(cuid())
  hackathonId String
  name        String
  token       String  @unique // For QR auth
  isActive    Boolean @default(true)

  createdAt DateTime @default(now())

  hackathon Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)
  scores    Score[]

  @@index([hackathonId])
  @@index([token])
}

model Score {
  id          String @id @default(cuid())
  teamId      String
  roundId     String
  judgeId     String
  criterionId String

  // Score value (1-5)
  value Int

  // Optional comment
  comment String? @db.Text

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  team      Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  round     Round     @relation(fields: [roundId], references: [id], onDelete: Cascade)
  judge     Judge     @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  criterion Criterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)

  @@unique([judgeId, teamId, roundId, criterionId])
  @@index([teamId])
  @@index([roundId])
  @@index([judgeId])
}

// ============================================
// PHASES (Schedule)
// ============================================

model Phase {
  id          String   @id @default(cuid())
  hackathonId String
  name        String   // "Check-in", "Hacking", "Judging"
  startTime   DateTime
  endTime     DateTime
  order       Int

  hackathon Hackathon @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  @@index([hackathonId])
  @@index([order])
}
```

---

## Page-by-Page Breakdown

### PUBLIC PAGES

#### 1. Platform Homepage (`/`)

**Purpose:** Marketing landing page for organizers

**Components:**
- Hero section with headline + CTA
- Features grid
- "Create Your Hackathon" button → `/auth/login`

**No complex features - static marketing page**

---

#### 2. Login Page (`/auth/login`)

**Purpose:** Organizer authentication

**Features:**
- Google OAuth button (via NextAuth)
- "Continue with Google" → Creates User if first time
- After auth → Redirect to `/dashboard`

**Implementation:**
```typescript
// NextAuth config
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })
]
```

---

#### 3. Public Hackathon Page (`/h/[slug]`)

**Purpose:** Public-facing event page

**Sections:**

**A. Hero**
- Event name, tagline, dates
- Venue/mode
- "Register Now" button (if registration open)
- Countdown timer if event hasn't started

**B. About**
- Description (from organizer)

**C. Schedule** (if configured)
- Phase timeline

**D. Rules** (if configured)
- Team size, submission requirements

**E. Prizes** (if configured)
- Prize breakdown

**F. Problem Statements** (if released)
- Grid of problem statement cards
- Shown only if `isReleased = true`

**Data Fetching:**
```typescript
const hackathon = await prisma.hackathon.findUnique({
  where: { slug },
  include: {
    problemStatements: {
      where: { isReleased: true },
      orderBy: { order: 'asc' }
    },
    rounds: {
      orderBy: { order: 'asc' },
      include: { criteria: true }
    },
    phases: {
      orderBy: { order: 'asc' }
    }
  }
})
```

---

#### 4. Registration Page (`/h/[slug]/register`)

**Purpose:** Participant self-registration

**Form Fields:**

**Personal Info:**
- Name (required)
- Email (required, unique per hackathon)
- Phone (optional)
- College (optional)

**Team Selection:**
- Radio buttons:
  - ○ Create new team
  - ○ Join existing team
  - ○ Go solo

**If "Create new team":**
- Team name input
- Generates 6-char invite code on submit

**If "Join existing team":**
- Invite code input (6 chars)
- Validates code exists and team not full

**If "Go solo":**
- Auto-creates team with participant's name

**Submit Flow:**
```typescript
1. Validate email uniqueness
2. If creating team:
   - Check team name not taken
   - Generate invite code
   - Create Team
3. If joining team:
   - Validate invite code exists
   - Check team size < maxTeamSize
   - Get team ID
4. Generate qrToken (crypto.randomBytes(32).toString('hex'))
5. Create Participant with role "leader" or "member"
6. Redirect to /h/[slug]/dashboard?token=[qrToken]
```

**Edge Cases:**
- Email already registered → Error: "Already registered"
- Invalid invite code → Error: "Invalid code"
- Team full → Error: "Team full (max X members)"

---

#### 5. Participant Dashboard (`/h/[slug]/dashboard`)

**Purpose:** Central hub for participants during event

**Authentication:**
```typescript
// URL: /h/[slug]/dashboard?token=[qrToken]
// OR cookie-based after first visit

const participant = await prisma.participant.findUnique({
  where: { qrToken: token },
  include: {
    team: {
      include: {
        participants: true,
        problemStatement: true,
        submissions: {
          include: { round: true }
        }
      }
    },
    hackathon: {
      include: {
        rounds: {
          include: { criteria: true },
          orderBy: { order: 'asc' }
        },
        problemStatements: {
          where: { isReleased: true }
        }
      }
    }
  }
})
```

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│ HACKNOVA 2026                    🟢 LIVE            │
│ Team Phoenix                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ YOUR RANK: #13  ↑ 15                               │
│ SCORE: 3,847 pts                                    │
│                                                      │
├─────────────────────────────────────────────────────┤
│ EVENT TIMER: 18:32:45                               │
│ ROUND 1 TIMER: 02:47:13                            │
├─────────────────────────────────────────────────────┤
│ PROBLEM STATEMENT                                   │
│ [If not selected yet]                               │
│   ⚠ You must select a problem statement            │
│   [View Options]                                    │
│                                                      │
│ [If selected]                                       │
│   🏦 FinTech Innovation                            │
│   Selected 2 hours ago                              │
├─────────────────────────────────────────────────────┤
│ SUBMISSIONS                                         │
│                                                      │
│ Round 1: Ideation - Ends in 02:47:13               │
│ ├─ GitHub: [________________] [Update]             │
│ ├─ Demo: [________________] [Update]               │
│ └─ Status: ⏱ Submitted 10 mins early (+20 pts)    │
│                                                      │
│ Round 2: Prototype - Locked                        │
│ └─ Unlocks after Round 1 checkpoint                │
│                                                      │
│ Round 3: Final - Locked                            │
│ └─ Unlocks after Round 2 checkpoint                │
├─────────────────────────────────────────────────────┤
│ YOUR QR CODE                                        │
│ [QR Code Image]                                     │
│ Show this to judges                                 │
├─────────────────────────────────────────────────────┤
│ TEAM MEMBERS                                        │
│ • Alice (Leader) ✓ Checked In                      │
│ • Bob (Member)                                      │
│ • Carol (Member) ✓ Checked In                      │
└─────────────────────────────────────────────────────┘
```

**Features:**

**A. Live Rank Display**
- Fetches from `/api/h/[slug]/leaderboard/my-rank?token=[qrToken]`
- Updates every 10 seconds
- Shows trend arrow if rank changed

**B. Problem Statement Selection** (if not selected)
- Shows grid of available problem statements
- Click opens modal with full description
- "Select This" button
- Confirmation: "This is permanent"
- After selection:
  - Updates `Team.problemStatementId`
  - Socket.IO broadcasts update
  - Unlocks submission forms

**C. Submission Forms**
- One form per round
- Locked until:
  1. Problem statement selected
  2. Previous round submitted (for Round 2+)
- Shows countdown to checkpoint
- Fields: GitHub URL, Demo URL, Presentation URL
- Submit button → Calculates time bonus/penalty
- Shows submission status + time bonus amount

**D. QR Code**
- Generated from qrToken
- Encodes: `/h/[slug]/qr/[qrToken]`
- Judge scans this to score team

**E. Team Info**
- List of members
- Check-in status per member

**Real-Time Updates:**
```typescript
// Socket.IO client
socket.on('rank-updated', ({ teamId, newRank, trend }) => {
  if (teamId === myTeamId) {
    updateRank(newRank, trend)
  }
})

socket.on('problem-statements-released', () => {
  fetchProblemStatements()
})
```

---

### ORGANIZER PAGES

#### 6. Organizer Dashboard (`/dashboard`)

**Purpose:** List of organizer's hackathons

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ My Hackathons                 [+ Create Hackathon]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ HackNova 2026               🟢 LIVE       │      │
│ │ March 15-16, 2026                         │      │
│ │ 42 teams • 156 participants               │      │
│ │                                            │      │
│ │ [Manage] [View Public Page]               │      │
│ └───────────────────────────────────────────┘      │
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ CodeFest 2026               DRAFT         │      │
│ │ April 20-21, 2026                         │      │
│ │ 0 teams • 0 participants                  │      │
│ │                                            │      │
│ │ [Manage] [Publish]                        │      │
│ └───────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**Data:**
```typescript
const hackathons = await prisma.hackathon.findMany({
  where: { userId: session.user.id },
  include: {
    _count: {
      select: {
        teams: true,
        participants: true
      }
    }
  },
  orderBy: { createdAt: 'desc' }
})
```

---

#### 7. Create Hackathon (`/create`)

**Purpose:** Minimal 3-step wizard

**Step 1: Basics**
- Name (auto-generates slug)
- Tagline
- Description (textarea)
- Start date/time
- End date/time
- Timezone (default: Asia/Kolkata)
- Mode (in-person/online/hybrid)
- Venue (if in-person)
- Online link (if online)

**Step 2: Team Config**
- Min team size (1-10, default 1)
- Max team size (1-10, default 4)
- Max teams (0 = unlimited)
- Registration deadline
- Require approval (toggle, default OFF)

**Step 3: Scoring**
- Time bonus rate (pts/min early, default 2.0)
- Time penalty rate (pts/min late, default 1.0)

**Submit:**
- Creates Hackathon with status "draft"
- Redirects to `/h/[slug]/manage`

---

#### 8. Manage Hub (`/h/[slug]/manage`)

**Purpose:** Central organizer control panel

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ HackNova 2026                                       │
│ Status: DRAFT        [Publish] [Go Live] [End]     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Quick Stats                                         │
│ 42 Teams • 156 Participants • 5 Judges             │
│ 23 Teams checked in • 12 Teams submitted Round 1   │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Management                                          │
│                                                      │
│ [Teams] [Check-In] [Rounds] [Problem Statements]   │
│ [Judges] [Display] [Settings]                      │
└─────────────────────────────────────────────────────┘
```

**Status Flow:**
- **DRAFT:** Not visible to public
- **PUBLISHED:** Public page live, accepting registrations
- **LIVE:** Event in progress, judging active
- **ENDED:** Event over, leaderboard frozen

---

#### 9. Teams Management (`/h/[slug]/manage/teams`)

**Purpose:** View and manage registered teams

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Teams                                  [Export CSV] │
│                                                      │
│ Search: [________]  Filter: [All] [Checked In]     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Team Phoenix              🏦 FinTech                │
│ ├─ Alice (Leader) ✓                                │
│ ├─ Bob ✓                                           │
│ ├─ Carol                                           │
│ └─ Rank: #13 • Score: 3,847                       │
│ [Check In All] [View Details]                      │
│                                                      │
│ Team Alpha                🏥 HealthTech             │
│ ├─ David (Leader)                                   │
│ ├─ Eve                                             │
│ └─ Rank: #7 • Score: 4,102                        │
│ [Check In All] [View Details]                      │
└─────────────────────────────────────────────────────┘
```

**Features:**
- List all teams with members
- Show problem statement assignment
- Show current rank/score
- Check-in controls (per member or all at once)
- Search/filter
- Export to CSV

---

#### 10. Check-In Page (`/h/[slug]/manage/checkin`)

**Purpose:** Fast check-in interface

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Check-In            42 teams • 156 participants     │
│                                                      │
│ Search: [________]                                  │
│                                                      │
│ ☐ Show only not checked in (89 remaining)          │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Alice (Team Phoenix) ✓ Checked in 2 hours ago      │
│                                                      │
│ Bob (Team Phoenix)                                  │
│ [Check In]                                          │
│                                                      │
│ Carol (Team Phoenix)                                │
│ [Check In]                                          │
│                                                      │
│ David (Team Alpha) ✓ Checked in 1 hour ago         │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Search by name/team
- Filter: All / Not checked in
- One-click check-in button per participant
- Shows check-in timestamp
- Updates in real-time

**Implementation:**
```typescript
async function handleCheckIn(participantId: string) {
  await fetch(`/api/h/${slug}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ participantId })
  })
  
  // Updates Team.isCheckedIn if all members checked in
  // Broadcasts via Socket.IO
}
```

---

#### 11. Rounds Configuration (`/h/[slug]/manage/rounds`)

**Purpose:** Configure rounds, criteria, weights, checkpoints

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Rounds & Criteria                   [+ Add Round]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Round 1: Ideation                 Weight: 20%  │ │
│ │ Checkpoint: March 15, 10:00 AM                 │ │
│ │                                                 │ │
│ │ Criteria:                                       │ │
│ │ • Innovation (60%)                              │ │
│ │ • Feasibility (40%)                             │ │
│ │                                 [Edit] [Delete] │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Round 2: Prototype                Weight: 30%  │ │
│ │ Checkpoint: March 15, 6:00 PM                  │ │
│ │                                                 │ │
│ │ Criteria:                                       │ │
│ │ • Execution (50%)                               │ │
│ │ • Design (50%)                                  │ │
│ │                                 [Edit] [Delete] │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Round 3: Final                    Weight: 50%  │ │
│ │ Checkpoint: March 16, 9:00 AM                  │ │
│ │                                                 │ │
│ │ Criteria:                                       │ │
│ │ • Impact (40%)                                  │ │
│ │ • Technical (30%)                               │ │
│ │ • Presentation (30%)                            │ │
│ │                                 [Edit] [Delete] │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Total Weight: 100% ✓                                │
└─────────────────────────────────────────────────────┘
```

**Validation:**
- Round weights must sum to 100%
- Criteria weights must sum to 100% per round
- Checkpoints must be between start and end dates
- Can't edit after event goes live

---

#### 12. Problem Statements (`/h/[slug]/manage/problems`)

**Purpose:** Create and manage problem statements

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Problem Statements                                   │
│                                                      │
│ Status: HIDDEN        [Release All] [Hide All]      │
│                                                      │
│ Releasing makes all problem statements visible to   │
│ participants. Do this at event opening ceremony.    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ 🏦 FinTech Innovation        HIDDEN       │      │
│ │ 12 teams selected                         │      │
│ │                                            │      │
│ │ Build innovative financial solutions...   │      │
│ │                          [Edit] [Delete]  │      │
│ └───────────────────────────────────────────┘      │
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ 🏥 HealthTech Solutions      HIDDEN       │      │
│ │ 8 teams selected                          │      │
│ │                                            │      │
│ │ Create healthcare tools for...            │      │
│ │                          [Edit] [Delete]  │      │
│ └───────────────────────────────────────────┘      │
│                                                      │
│ [+ Create Problem Statement]                        │
└─────────────────────────────────────────────────────┘
```

**Create/Edit Form:**
- Title
- Slug (auto-generated)
- Icon (emoji picker)
- Description (markdown editor)
- Order (for display sorting)

**Release Flow:**
```typescript
async function releaseAll() {
  await prisma.problemStatement.updateMany({
    where: { hackathonId },
    data: { 
      isReleased: true,
      releasedAt: new Date()
    }
  })
  
  // Socket.IO broadcast
  io.to(`hackathon:${hackathonId}`).emit('problem-statements-released')
}
```

---

#### 13. Judges Management (`/h/[slug]/manage/judges`)

**Purpose:** Create judge accounts and generate QR codes

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Judges                           [+ Add Judge]      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Judge Alice                                         │
│ ├─ 12 teams scored                                 │
│ ├─ Last active: 10 mins ago                        │
│ └─ [View QR] [Deactivate]                          │
│                                                      │
│ Judge Bob                                           │
│ ├─ 8 teams scored                                  │
│ ├─ Last active: 2 hours ago                        │
│ └─ [View QR] [Deactivate]                          │
│                                                      │
│ Judge Carol (Inactive)                              │
│ ├─ 15 teams scored                                 │
│ ├─ Last active: 1 day ago                          │
│ └─ [View QR] [Activate]                            │
└─────────────────────────────────────────────────────┘
```

**Add Judge Flow:**
1. Click "+ Add Judge"
2. Modal: Enter name
3. System generates token
4. Shows QR code
5. Options: Download as PNG, Print

**QR Code Content:**
- Encodes: `/h/[slug]/judge/login?token=[judgeToken]`

---

#### 14. Display Controller (`/h/[slug]/manage/display`)

**Purpose:** Control projector display in real-time

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Display Control                                      │
│                                                      │
│ Connected Display: ✓ /h/hacknova-2026/display      │
│ Last ping: 2 seconds ago                            │
├─────────────────────────────────────────────────────┤
│ SCENE                                               │
│                                                      │
│ ● Leaderboard                                       │
│ ○ Ceremony                                          │
│ ○ Blank                                             │
├─────────────────────────────────────────────────────┤
│ LEADERBOARD OPTIONS                                 │
│                                                      │
│ Problem Statement:                                  │
│ ● Auto-Cycle (30s each)                            │
│ ○ Overall                                           │
│ ○ FinTech                                           │
│ ○ HealthTech                                        │
│ ○ Climate                                           │
│                                                      │
│ Status: LIVE                                        │
│ [Freeze Leaderboard]                                │
├─────────────────────────────────────────────────────┤
│ CEREMONY CONTROLS                                   │
│                                                      │
│ Current: FinTech Winners                            │
│ Revealed: #3, #2                                    │
│                                                      │
│ [Reveal #1] ← Click to reveal next                 │
│                                                      │
│ After #1: [Next Problem Statement]                 │
└─────────────────────────────────────────────────────┘
```

**Socket.IO Commands:**
```typescript
// Switch scene
socket.emit('display:set-scene', { scene: 'leaderboard' })

// Set problem statement filter
socket.emit('display:set-filter', { filter: 'fintech' })

// Freeze leaderboard
socket.emit('display:freeze')

// Ceremony reveal
socket.emit('ceremony:reveal-next')
```

---

### JUDGE PAGES

#### 15. Judge Login (`/h/[slug]/judge/login`)

**Purpose:** Authenticate judge via QR token

**Flow:**
```
URL: /h/[slug]/judge/login?token=[judgeToken]

1. Validate token exists and is active
2. Set cookie: judge_session=[judgeToken]
3. Redirect to /h/[slug]/judge/scan
```

**No UI - just validation and redirect**

---

#### 16. Judge Scanner (`/h/[slug]/judge/scan`)

**Purpose:** Scan team QR codes to score

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ JUDGE: Alice                                        │
│ HackNova 2026 // Round 1: Ideation                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│        SCAN TEAM QR CODE                            │
│                                                      │
│     [Camera Feed Here]                              │
│                                                      │
│     Point camera at participant's QR code           │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Teams scored this round: 12/42                      │
└─────────────────────────────────────────────────────┘
```

**Scan Flow:**
```
1. Camera opens (html5-qrcode)
2. Scan QR (encodes /h/[slug]/qr/[qrToken])
3. Fetch participant → Get team
4. Check if judge already scored this team for current round
5. If not scored → Redirect to scoring form
6. If already scored → Show error: "Already scored"
```

---

#### 17. Judge Scoring Form (`/h/[slug]/judge/score`)

**Purpose:** Score team on criteria

**URL:** `/h/[slug]/judge/score?team=[teamId]&round=[roundId]`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ JUDGE: Alice                                        │
│ Scoring: Team Phoenix                               │
│ Problem: FinTech Innovation                         │
│ Round: Round 1 - Ideation                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Innovation (60%)                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ 👎   👌   👍   ⭐   🔥                         │ │
│ │ 1    2    3    4    5                          │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Feasibility (40%)                                   │
│ ┌────────────────────────────────────────────────┐ │
│ │ 👎   👌   👍   ⭐   🔥                         │ │
│ │ 1    2    3    4    5                          │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Optional Comment:                                   │
│ [________________________________]                  │
│                                                      │
│                      [Submit Scores]                │
└─────────────────────────────────────────────────────┘
```

**Submit Flow:**
```typescript
1. Validate all criteria scored
2. Create Score records (one per criterion)
3. Trigger leaderboard recalculation
4. Emit Socket.IO event: 'score-updated'
5. Show success → Redirect back to scanner
```

**Duplicate Prevention:**
```typescript
// Check before showing form
const existing = await prisma.score.findFirst({
  where: {
    judgeId,
    teamId,
    roundId,
  }
})

if (existing) {
  return <AlreadyScoredError />
}
```

---

### DISPLAY PAGE

#### 18. Projector Display (`/h/[slug]/display`)

**Purpose:** Fullscreen display for projector

**This is a PASSIVE player - NO UI controls**

**Socket.IO Listener:**
```typescript
socket.on('display:set-scene', ({ scene }) => {
  setCurrentScene(scene) // 'leaderboard' | 'ceremony' | 'blank'
})

socket.on('display:set-filter', ({ filter }) => {
  setFilter(filter) // 'auto' | 'overall' | problem statement slug
})

socket.on('display:freeze', () => {
  setFrozen(true)
})

socket.on('score-updated', () => {
  if (!frozen) {
    refetchLeaderboard()
  }
})

socket.on('ceremony:reveal-next', ({ rank, teamName }) => {
  animateReveal(rank, teamName)
})
```

**Leaderboard Scene:**

```
┌─────────────────────────────────────────────────────┐
│ LIVE STANDINGS              PAGE 2/4      🟢 LIVE   │
│ HACKNOVA 2026 // HACKING PHASE                      │
│                                                      │
│ EVENT: 18:32:45  |  ROUND 1: 02:47:13              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  #   TEAM              SCORE   TREND   #   TEAM ... │
│ 41   Team 41 Alpha     3,804   ↓ 2    61  Team ... │
│ 42   Team 42 Beta      3,783   ↓ 3    62  Team ... │
│ 43   Team 43 Gamma     3,740   ↑ 11   63  Team ... │
│ 44   Team 44 Delta     3,726   ↓ 5    64  Team ... │
│ ...                                                  │
│ 57   Team 57 Beta      3,328   ↑ 12   77  Team ... │
└─────────────────────────────────────────────────────┘
```

**Features:**
- 2-column layout (20 teams per page)
- Auto-pages every 10 seconds
- Shows PAGE X/Y in header
- Trend arrows (↑/↓ X)
- Monospace font for terminal aesthetic
- Updates on score events (if not frozen)

**Auto-Cycle Problem Statements:**
```typescript
useEffect(() => {
  if (filter === 'auto') {
    const interval = setInterval(() => {
      // Cycle: fintech → healthtech → climate → overall → repeat
      setCurrentPS(getNextPS())
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }
}, [filter])
```

**Ceremony Scene:**
```
┌─────────────────────────────────────────────────────┐
│ FINTECH WINNERS                       🏆            │
│ HACKNOVA 2026                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  3RD PLACE                                          │
│  Team Alpha                                         │
│  3,847 points                                       │
│                                                      │
│  2ND PLACE                                          │
│  Team Beta                                          │
│  4,102 points                                       │
│                                                      │
│  [Waiting for reveal...]                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Reveal Animation:**
```typescript
socket.on('ceremony:reveal-next', ({ rank, team }) => {
  if (rank === 1) {
    // Show #1 with confetti
    showWinner(team)
    triggerConfetti()
  } else {
    // Show #3, #2
    showPlace(rank, team)
  }
})
```

---

### UNIVERSAL QR ROUTE

#### 19. QR Router (`/h/[slug]/qr/[token]`)

**Purpose:** Smart routing based on who scans

**Logic:**
```typescript
export async function GET(req: Request, { params }) {
  const { slug, token } = params
  
  // Get participant from token
  const participant = await prisma.participant.findUnique({
    where: { qrToken: token },
    include: { team: true }
  })
  
  if (!participant) {
    return notFound()
  }
  
  // Check who's accessing
  const judgeSession = cookies().get('judge_session')?.value
  
  if (judgeSession) {
    // Judge scanned → Redirect to scoring
    const judge = await prisma.judge.findUnique({
      where: { token: judgeSession }
    })
    
    if (judge) {
      // Get current active round
      const currentRound = await getCurrentRound(slug)
      
      return redirect(
        `/h/${slug}/judge/score?team=${participant.teamId}&round=${currentRound.id}`
      )
    }
  }
  
  // Participant or public scanned → Redirect to dashboard
  return redirect(`/h/${slug}/dashboard?token=${token}`)
}
```

---

## Core User Flows

### Flow 1: Organizer Creates Hackathon

```
1. Visit / → Click "Create Hackathon"
2. Redirect to /auth/login
3. Google OAuth → Account created/logged in
4. Redirect to /create
5. Fill 3-step wizard:
   Step 1: Basics (name, dates, venue)
   Step 2: Team config (sizes, limits)
   Step 3: Scoring (time bonus/penalty rates)
6. Click "Create" → Hackathon created (status: DRAFT)
7. Redirect to /h/[slug]/manage
8. Configure rounds, criteria, problem statements
9. Click "Publish" → Status: PUBLISHED
10. Share /h/[slug] link with participants
```

---

### Flow 2: Participant Self-Registration

```
1. Receive link /h/[slug] from organizer
2. Click "Register Now"
3. Fill form:
   - Name, email, phone, college
   - Team selection:
     Option A: Create new team (enter team name)
     Option B: Join team (enter 6-char code)
     Option C: Go solo
4. Submit → Participant + Team created
5. Generate qrToken
6. Redirect to /h/[slug]/dashboard?token=[qrToken]
7. Bookmark this URL (or screenshot QR)
```

---

### Flow 3: Event Day - Problem Statement Selection

```
Opening Ceremony (10:00 AM):
1. Organizer clicks "Release All" in /manage/problems
2. All problem statements: isReleased = true
3. Socket.IO broadcasts to all connected dashboards
4. Participants see notification: "Problem Statements Available!"

Team Selection (10:00 - 10:30 AM):
1. Team Leader opens dashboard
2. Sees problem statement grid
3. Clicks "View Details" on FinTech
4. Reads full description
5. Clicks "Select This"
6. Confirmation modal: "This is permanent. Confirm?"
7. Clicks "Confirm"
8. Team.problemStatementId = fintech-id
9. Team.selectedAt = now
10. Socket.IO broadcasts update
11. Submission forms unlock

Edge Case - Team doesn't select:
- Can't submit until they select
- Warning banner: "Select problem statement to unlock submissions"
```

---

### Flow 4: Submission with Time Bonus

```
Round 1 (Checkpoint: 10:00 AM):
1. Team opens dashboard at 9:50 AM
2. Round 1 form visible
3. Enter GitHub URL, Demo URL
4. Click "Submit" at 9:50 AM (10 mins early)
5. System calculates:
   - Checkpoint: 10:00 AM
   - Submitted: 9:50 AM  
   - Difference: -10 mins (negative = early)
   - Time bonus: 10 × 2.0 = +20 points
6. Create Submission record with timeBonus: 20
7. Dashboard shows: "✓ Submitted 10 mins early (+20 pts)"
8. Round 2 form unlocks (after Round 1 checkpoint passes)
```

---

### Flow 5: Judge Scoring

```
1. Organizer creates judge "Alice" in /manage/judges
2. System generates token, shows QR
3. Judge Alice scans QR → /h/[slug]/judge/login?token=xxx
4. Cookie set → Redirect to /h/[slug]/judge/scan
5. Alice points camera at Team Phoenix member's QR
6. Scans /h/[slug]/qr/[participantToken]
7. System detects judge session
8. Fetches participant → Gets team
9. Checks if Alice already scored Phoenix for Round 1
10. Not scored yet → Redirect to scoring form
11. Alice scores:
    - Innovation: 🔥 (5)
    - Feasibility: ⭐ (4)
12. Submit → Creates Score records
13. Trigger leaderboard recalculation
14. Emit Socket.IO: 'score-updated'
15. Display updates (if not frozen)
16. Phoenix's dashboard updates rank
17. Alice redirected back to scanner for next team
```

---

### Flow 6: Leaderboard Update with Trend

```
Initial State:
- Team Phoenix: Rank #28, Score 3,200

Judge Scores Phoenix:
1. Scores saved to database
2. Leaderboard calculation triggered:
   
   Phoenix Total Score = 
     (Round 1 Score × 20%) + Time Bonus
     
   Round 1 Score = 
     Average of all judges:
       (Judge A's (Innovation×60% + Feasibility×40%)) + 
       (Judge B's (Innovation×60% + Feasibility×40%))
       ...
     ÷ Number of judges
     + Time Bonus
   
   Result: 3,847 points
   
3. Sort all teams by score
4. Phoenix new rank: #13
5. Calculate trend: #28 → #13 = ↑ 15
6. Socket.IO emit:
   {
     teamId: 'phoenix-id',
     newRank: 13,
     oldRank: 28,
     trend: '+15',
     newScore: 3847
   }
7. Display receives event → Updates immediately
8. Phoenix's dashboard receives event → Updates rank
```

---

### Flow 7: Ceremony Reveal

```
Pre-Ceremony:
1. Organizer clicks "Freeze Leaderboard"
2. Socket.IO: display:freeze
3. Display stops updating (shows last state)
4. Judges continue scoring (scores accumulate)

Ceremony Start:
1. Organizer clicks "Switch to Ceremony" in controller
2. Socket.IO: display:set-scene → 'ceremony'
3. Display shows ceremony scene
4. Controller shows: "FinTech Winners" (first problem statement)

Reveal Process:
1. Organizer clicks [Reveal #3]
2. Socket.IO: ceremony:reveal-next → { rank: 3, team: 'Team Alpha' }
3. Display animates: Team Alpha card flips in
4. Shows: "3RD PLACE - Team Alpha - 3,500 pts"

5. Organizer clicks [Reveal #2]
6. Socket.IO: ceremony:reveal-next → { rank: 2, team: 'Team Beta' }
7. Display animates: Team Beta appears

8. Organizer clicks [Reveal #1]
9. Socket.IO: ceremony:reveal-next → { rank: 1, team: 'Team Phoenix' }
10. Display animates: Team Phoenix with confetti

11. Organizer clicks [Next Problem Statement]
12. Repeat for HealthTech winners
13. Repeat for Climate winners
14. Done
```

---

## Real-Time System

### Socket.IO Events

**Server Emits:**

```typescript
// Score updated
io.to(`hackathon:${hackathonId}`).emit('score-updated', {
  teamId: string,
  newRank: number,
  oldRank: number,
  trend: string, // '+15' or '-3'
  newScore: number
})

// Problem statements released
io.to(`hackathon:${hackathonId}`).emit('problem-statements-released')

// Display control
io.to(`display:${hackathonId}`).emit('display:set-scene', {
  scene: 'leaderboard' | 'ceremony' | 'blank'
})

io.to(`display:${hackathonId}`).emit('display:set-filter', {
  filter: 'auto' | 'overall' | problemStatementSlug
})

io.to(`display:${hackathonId}`).emit('display:freeze')

io.to(`display:${hackathonId}`).emit('display:unfreeze')

// Ceremony
io.to(`display:${hackathonId}`).emit('ceremony:reveal-next', {
  rank: number,
  teamName: string,
  teamId: string,
  score: number
})

// Check-in
io.to(`hackathon:${hackathonId}`).emit('participant-checked-in', {
  participantId: string,
  teamId: string
})
```

**Clients Subscribe:**

```typescript
// Participant dashboard
socket.emit('join:hackathon', hackathonId)
socket.on('score-updated', handleRankUpdate)
socket.on('problem-statements-released', fetchProblemStatements)

// Display
socket.emit('join:display', hackathonId)
socket.on('display:set-scene', handleSceneChange)
socket.on('display:freeze', handleFreeze)
socket.on('score-updated', refetchLeaderboard)
socket.on('ceremony:reveal-next', handleReveal)

// Organizer dashboard
socket.emit('join:hackathon', hackathonId)
socket.on('participant-checked-in', updateCheckInCount)
socket.on('score-updated', updateStats)
```

---

## Scoring Engine

### Formula

```
Team Final Score = Σ (Round Score × Round Weight / 100)

Round Score = (
  Average across all judges of:
    Σ (Criterion Score × Criterion Weight / 100)
) + Time Bonus/Penalty

Where:
  Criterion Score: 1-5 (from judge)
  Criterion Weight: % (must sum to 100 per round)
  Round Weight: % (must sum to 100 across all rounds)
  Time Bonus: (Minutes Early × Bonus Rate) or -(Minutes Late × Penalty Rate)
```

### Example Calculation

**Setup:**
- 2 judges
- Round 1 weight: 20%
- Round 1 criteria: Innovation (60%), Feasibility (40%)
- Time bonus rate: 2 pts/min
- Team submitted 10 mins early

**Judge A scores:**
- Innovation: 5
- Feasibility: 4

**Judge B scores:**
- Innovation: 4
- Feasibility: 4

**Calculation:**

```
Judge A Round Score = (5 × 0.6) + (4 × 0.4) = 3.0 + 1.6 = 4.6
Judge B Round Score = (4 × 0.6) + (4 × 0.4) = 2.4 + 1.6 = 4.0

Average = (4.6 + 4.0) / 2 = 4.3

Time Bonus = 10 × 2 = +20 points

Round 1 Score = 4.3 + 20 = 24.3

Final Score (if only Round 1 complete) = 24.3 × 0.2 = 4.86

(As more rounds complete, their weighted scores add to this)
```

### Implementation

```typescript
async function calculateTeamScore(teamId: string) {
  // Get team with all scores
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      scores: {
        include: {
          criterion: {
            include: {
              round: true
            }
          }
        }
      },
      submissions: true
    }
  })
  
  // Group scores by round
  const roundScores: Record<string, any> = {}
  
  team.scores.forEach(score => {
    const roundId = score.criterion.round.id
    
    if (!roundScores[roundId]) {
      roundScores[roundId] = {
        round: score.criterion.round,
        judgeScores: {},
        submission: team.submissions.find(s => s.roundId === roundId)
      }
    }
    
    if (!roundScores[roundId].judgeScores[score.judgeId]) {
      roundScores[roundId].judgeScores[score.judgeId] = []
    }
    
    roundScores[roundId].judgeScores[score.judgeId].push({
      value: score.value,
      weight: score.criterion.weight
    })
  })
  
  let finalScore = 0
  
  // Calculate each round
  Object.values(roundScores).forEach((roundData: any) => {
    const { round, judgeScores, submission } = roundData
    
    // Average across judges
    const judgeAverages = Object.values(judgeScores).map((scores: any) => {
      // Weighted sum of criteria
      return scores.reduce((sum: number, s: any) => {
        return sum + (s.value * s.weight / 100)
      }, 0)
    })
    
    const avgScore = judgeAverages.reduce((a, b) => a + b, 0) / judgeAverages.length
    
    // Add time bonus
    const timeBonus = submission?.timeBonus || 0
    
    const roundScore = avgScore + timeBonus
    
    // Apply round weight
    finalScore += (roundScore * round.weight / 100)
  })
  
  return Math.round(finalScore * 100) / 100 // Round to 2 decimals
}
```

---

## Display System

### Auto-Pagination Logic

```typescript
// Calculate pages needed
const teamsPerPage = 20 // 2 columns × 10 rows
const totalPages = Math.ceil(teams.length / teamsPerPage)

// Auto-cycle pages
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentPage(prev => (prev % totalPages) + 1)
  }, 10000) // 10 seconds per page
  
  return () => clearInterval(interval)
}, [totalPages])
```

### Auto-Cycle Problem Statements

```typescript
const problemStatements = ['fintech', 'healthtech', 'climate', 'overall']
let currentIndex = 0

setInterval(() => {
  const current = problemStatements[currentIndex]
  fetchLeaderboard(current)
  currentIndex = (currentIndex + 1) % problemStatements.length
}, 30000) // 30 seconds per problem statement
```

### Trend Calculation

```typescript
// Store previous rankings
const previousRankings = new Map<string, number>()

function calculateTrends(newRankings: TeamRanking[]) {
  return newRankings.map(team => {
    const oldRank = previousRankings.get(team.id)
    
    if (!oldRank) {
      return { ...team, trend: null }
    }
    
    const change = oldRank - team.rank // Positive = moved up
    
    return {
      ...team,
      trend: change === 0 ? null : change
    }
  })
}

// Update after each calculation
newRankings.forEach(team => {
  previousRankings.set(team.id, team.rank)
})
```

---

## API Reference

### Authentication

```
GET  /api/auth/[...nextauth] - NextAuth handler
POST /api/auth/signout        - Logout
```

### Hackathon Management

```
POST   /api/hackathon               - Create hackathon
GET    /api/hackathon/[id]          - Get details
PATCH  /api/hackathon/[id]          - Update
POST   /api/h/[slug]/publish        - Publish (draft → published)
POST   /api/h/[slug]/go-live        - Go live (published → live)
POST   /api/h/[slug]/end            - End event (live → ended)
```

### Registration

```
POST /api/h/[slug]/register - Register participant
GET  /api/h/[slug]/teams    - Get all teams
```

### Problem Statements

```
POST   /api/h/[slug]/problems              - Create problem statement
PATCH  /api/h/[slug]/problems/[id]         - Update
DELETE /api/h/[slug]/problems/[id]         - Delete
POST   /api/h/[slug]/problems/release-all  - Release all
POST   /api/h/[slug]/teams/[id]/select-ps  - Team selects problem statement
```

### Rounds & Criteria

```
POST   /api/h/[slug]/rounds                - Create round
PATCH  /api/h/[slug]/rounds/[id]           - Update
DELETE /api/h/[slug]/rounds/[id]           - Delete
POST   /api/h/[slug]/rounds/[id]/criteria  - Add criterion
```

### Submissions

```
POST /api/h/[slug]/submit - Submit project links for round
GET  /api/h/[slug]/submissions/[teamId] - Get team submissions
```

### Check-In

```
POST /api/h/[slug]/checkin - Check in participant
GET  /api/h/[slug]/checkin/stats - Get check-in stats
```

### Judging

```
POST /api/h/[slug]/judges           - Create judge
GET  /api/h/[slug]/judges           - List judges
POST /api/h/[slug]/judge/score      - Submit scores
GET  /api/h/[slug]/judge/history    - Judge's scoring history
```

### Leaderboard

```
GET /api/h/[slug]/leaderboard          - Get rankings (overall or filtered)
GET /api/h/[slug]/leaderboard/my-rank  - Get participant's rank
```

### Display

```
POST /api/h/[slug]/display/set-scene   - Change display scene
POST /api/h/[slug]/display/freeze      - Freeze leaderboard
POST /api/h/[slug]/display/unfreeze    - Unfreeze leaderboard
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Next.js 14, Prisma, NextAuth)
- [ ] Database schema implementation
- [ ] Google OAuth working
- [ ] Platform homepage
- [ ] Create hackathon wizard

### Phase 2: Registration (Week 2)
- [ ] Public hackathon page
- [ ] Self-registration form
- [ ] Team formation (create/join/solo)
- [ ] QR generation
- [ ] Participant dashboard skeleton

### Phase 3: Core Systems (Week 3)
- [ ] Problem statements CRUD
- [ ] Rounds & criteria configuration
- [ ] Submission system with time bonus
- [ ] Check-in interface
- [ ] Judge creation & QR auth

### Phase 4: Judging (Week 4)
- [ ] Judge scanner
- [ ] Scoring form
- [ ] Score storage
- [ ] Duplicate prevention

### Phase 5: Leaderboard (Week 5)
- [ ] Scoring engine implementation
- [ ] Leaderboard calculation
- [ ] Real-time updates (Socket.IO)
- [ ] Trend arrow calculation
- [ ] Problem statement filtering

### Phase 6: Display (Week 6)
- [ ] Display page (projector)
- [ ] Auto-pagination
- [ ] Auto-cycle problem statements
- [ ] Display controller
- [ ] Freeze/unfreeze

### Phase 7: Ceremony (Week 7)
- [ ] Ceremony scene
- [ ] Manual reveal controls
- [ ] Confetti animation
- [ ] Problem statement winner reveals

### Phase 8: Polish & Testing (Week 8)
- [ ] Organizer dashboard improvements
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance optimization
- [ ] End-to-end testing

---

## Success Criteria

MVP is launch-ready when:

**Functionality:**
- [ ] Organizer can create hackathon in <5 mins
- [ ] Participant can register in <2 mins
- [ ] Team can select problem statement
- [ ] Team can submit per round with time tracking
- [ ] Judge can score any team without duplicate
- [ ] Leaderboard updates within 5 seconds of score
- [ ] Display shows trend arrows correctly
- [ ] Ceremony reveals work smoothly

**Performance:**
- [ ] Leaderboard calculation <1 second
- [ ] Socket.IO latency <100ms
- [ ] Display page load <2 seconds
- [ ] Handles 100 teams, 10 judges, 300 participants

**User Experience:**
- [ ] Mobile-friendly (all pages)
- [ ] No confusing error messages
- [ ] Clear visual feedback on actions
- [ ] Intuitive navigation

**Technical:**
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] Proper error handling everywhere
- [ ] Database indexes on hot queries

---

## Tech Stack Summary

- **Framework:** Next.js 14 (App Router)
- **Database:** Neon Postgres (Serverless)
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 (Google OAuth)
- **Real-Time:** Socket.IO (separate server on Render)
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui
- **Validation:** Zod
- **Forms:** React Hook Form
- **QR:** qrcode + html5-qrcode
- **Deployment:** Vercel (app) + Render (socket)

---

**END OF MVP SPECIFICATION**

This spec is complete and ready to build. Every page, feature, and connection is defined. Any questions? 🚀
