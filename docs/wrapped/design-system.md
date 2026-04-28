# HackaBoard Wrapped — Design System

A single cohesive design language. Variety comes from content composition, not from switching styles.

## Core principle

Every slide must look like the same designer made it. If you cover the content and only look at type, color, and composition rules, you should not be able to tell slides apart by "style."

What changes slide-to-slide: which color is dominant, which composition primitive carries the slide, what content lives where.

What never changes: type system, palette, composition primitives, brand mark treatment, motion vocabulary.

---

## 1. Brand framing

**HackaBoard Wrapped is the product brand.** Event and team are *possessors*.

Reading hierarchy:
1. **HackaBoard Wrapped** — the product. The hero typographic element on slide 1.
2. **Event** — the locator/context. Top label band on slide 1, header of every share PNG.
3. **Team** — the protagonist of *this* Wrapped. Subtitle on slide 1, star of stat slides.

Natural-language framings:
- "DevSquad's HackaBoard Wrapped in Hack Bengaluru"
- "Hack Bengaluru's HackaBoard Wrapped"

Slide 1 read-down (top to bottom):
```
♦ HACK BENGALURU · APRIL 28–30, 2026 ♦
HackaBoard
Wrapped
Team DevSquad's edition
```

**Mark placement rules:**

| Surface | Treatment |
|---|---|
| Slide bottoms (2-4) | Tiny `hack<a>board` watermark at 40% opacity |
| Slide 1 hero | Big `HackaBoard Wrapped` lockup (the visual anchor) |
| Slide 4 share | Mid-size lockup next to download CTA |
| Static share PNG | Hackathon name top, team name center, lockup bottom band |
| Browser tab | `HackaBoard Wrapped — [team name]` |
| OG meta on link share | Rich preview = the static PNG |
| Splash entry (1.5s) | Wordmark fades in, mono "presents", fades to slide 1 |

**Domain placeholder:** No hardcoded URL on the share PNG until domain is secured. Lockup-only attribution for now.

---

## 2. Type system

Three roles, three fonts. Never substitute.

| Role | Font | Used for |
|---|---|---|
| **Hero** | Instrument Serif (Google Fonts, free) — italic for emphasis | Big titles, named moments, rank announcements, quote callouts |
| **Display** | Geist Sans, font-black, tracking-tight | Stat numerals, headline labels like "BY THE NUMBERS", CTA buttons |
| **Mono / labels** | Geist Mono | All-caps labels, watermarks, code-syntax bits, the wordmark |

**Type scale (1080×1920 canvas):**
- Hero serif: 96–120px (clamp via shrink-to-fit when team/event names are long)
- Display: 64–144px
- Body: 24–32px
- Labels: 14–18px, letter-spacing 0.2em, ALL CAPS

**Long-text rules:**
- Team name >40 chars: shrink-to-fit by 15% steps, hard cap at 2 lines
- Event name >60 chars: 2-line wrap on slide 1, single-line ellipsis on PNG header
- Tagline (optional): renders only if set; max 50 chars; ellipsize beyond

---

## 3. Color system

### Signature: Electric purple `#B82FE0`
The HackaBoard Wrapped color. Not used elsewhere in the app. Used for: download CTA button, slide 1 hero accent, dashboard "Wrapped is ready" card, display banner accent.

### Supporting palette (gradient block colors)
- Lime `#C5F11A`
- Royal blue `#1A37D6`
- Magenta `#FF2EAA`
- Cyan `#3DD9E0` (matches app primary — visual bridge to the product)

### Surfaces
- True black `#000` for text panels (more dramatic than app's `oklch(0.11)`)
- Off-white `#F5F0E6` for occasional inverted slides
- Full-bleed surface: any supporting palette color at full saturation

### Slide-to-slide variety rule
Each slide picks ONE dominant color from the supporting palette + black/cream. Used as either:
- A full-bleed surface, OR
- The lead color in a gradient block

Same composition primitives. Different colors. The system stays consistent.

---

## 4. Composition primitives

Four reusable primitives. Every slide is built from one or two. Never invent a new layout.

### Primitive A — Two-panel split
Slide divided 50/50 or 40/60. One panel is content (typography), the other is visual (gradient block or solid color). Used on hero and rank slides.

### Primitive B — Pixelated gradient block
Rectangular block, 8–16 horizontal hard-edge bands, 2–3 colors, no smooth blending. Sized 30–100% of slide width. Animated to drift on enter.

### Primitive C — Stat stack
Vertical stack of 3–4 stats. Each stat = pill label + huge serif numeral (or short phrase). Used on the Numbers slide.

### Primitive D — Hero quote
Single italic serif line, large (96px+), centered, with a small label above and team/event credit below. Used on Top Moment slide.

### Primitive combinations per slide
- Slide 1 (Hero): A + B (block on visual side)
- Slide 2 (Numbers): C + B (block as background detail)
- Slide 3 (Top Moment): D + a single B as visual punctuation
- Slide 4 (Rank + Share): A + B (rank number watermarked into gradient)

Same vocabulary. Different sentences.

---

## 5. Decorative details

Used sparingly — accents only.

- **Diamond glyph** `♦` (U+2666) — flanks small ALL-CAPS labels: `♦ THE NUMBERS ♦`
- **Pill labels** — small rounded rects, contrasting fill, holding stat names
- **Hairline rule** — 1px contrasting line, panel separators or under-label dividers

**Cut from the references:** squiggles, dotted curves, contour lines, sticker overlays. They break consistency.

---

## 6. Motion system

| Primitive | Behavior | Duration |
|---|---|---|
| Slide-up + fade | Y-translate from 24px below + opacity 0→1 | 400ms, ease-out |
| Stagger reveal | Children animate in sequence, 80ms offset | — |
| Gradient drift | Bands slide in horizontally, alternating sides | 600ms, ease-out |
| Number count | Tweens 0 → target value | 800ms, ease-out |
| Word-by-word fade | Italic copy reveals one word at a time | 60ms per word |
| Progress bar | Top bar fills 0→100%, drives auto-advance | 5000ms, linear |

**Tap behaviors:**
- Tap right half → next slide (instant)
- Tap left half → previous slide (instant)
- Tap-and-hold → pause auto-advance
- Tap share → static PNG generation + native share sheet

**Reduced motion:**
- `prefers-reduced-motion: reduce` → all motion disabled, auto-advance disabled, tap-only navigation

---

## 7. Copy system

### Voice
Confident. Punchy. Slightly cocky. Treats every team as the protagonist.

### Forbidden
- Corporate phrasing ("Congratulations on achieving...")
- Patronizing fallbacks ("you tried your best!")
- Emoji (only ♦ glyph allowed)
- Sentences over 12 words

### Required
- Active voice ("You walked in at 9:03")
- Specific numbers ("47 judges" not "many")
- One-line callouts (≤12 words)
- Italic for closing/quote lines, regular for everything else

### Copy library
Lives at `src/lib/wrapped-copy.ts`. ~50 phrase variants picked by data shape. Tier-aware (top 3 / top 10 / ahead-of-N / mid-pack / no-rank fallback).

---

## 8. Layout grid (1080×1920 canvas)

- Outer padding: 64px
- Panel gap (two-panel layouts): 32px
- Pill label: 32px height, padding 8×16px, radius 999px
- Diamond glyph: matches label cap height
- Slide watermark: bottom-center, 14px mono, 40% opacity, 32px from bottom edge

Larger screens center the 1080-wide canvas with neutral letterbox surface. The slide itself never reflows for desktop.

---

## 9. Edge case handling (must-handle in v1)

These are baked into the system. Each is the system's *responsibility*, not per-slide special casing.

### Hackathon data
- **Long event name (60+ chars)** → 2-line wrap on slide 1, ellipsize on PNG header
- **Single-day event** → render "April 28, 2026" not "April 28–28"
- **Year-spanning event** → "December 30, 2025 — January 2, 2026"
- **No rounds defined** → adaptive slides skip score content entirely
- **No tagline** → tagline line not rendered (no empty space)
- **Future-dated event accessed** → "Wrapped not available yet" page
- **Archived event** → Wrapped still accessible (nostalgia by design)

### Team data
- **Long team name (40+ chars)** → shrink-to-fit by 15% steps, 2-line cap
- **Zero data team (no check-in, no scores)** → URL returns "no Wrapped for this team"
- **Checked-in but never scored** → adaptive: stats slide swaps score bits for "what you brought" content
- **Solo team (1 member)** → "1 builder, 1 vision" copy variant
- **Big team (5+)** → "X builders, one idea" copy
- **Tied rank** → copy: "Tied for #3" (still gets podium treatment)
- **Only team in event** → skip rank slide entirely, no relative comparison
- **Problem statement deleted post-registration** → fallback "—" or omit track display

### Score / round data
- **Round with 0 criteria** → excluded from stat computation
- **Incomplete judging (1 of 3 judges)** → use actual count, no pretense
- **All-1 scores** → graceful copy, no false celebration
- **All-5 scores** → special celebration variant

### Stat computation
- **Tied "best criterion"** → pick alphabetically first (deterministic)
- **Zero judges scanned** → swap "judges visited" for "you built"
- **Check-in time unknown** → use registration time, copy adapts
- **Pre-event check-in** → use actual time, copy says "earliest of all teams"

### Publish state
- **Publish before End Event** → button is disabled, can't physically click
- **Unpublish during view** → next nav 404s, current view stays graceful
- **Score edited after publish** → bump `wrappedVersion`, all caches invalidate, PNG regenerates
- **Concurrent publish clicks** → upsert, last-write-wins
- **Hackathon archived post-publish** → Wrapped accessible
- **Hackathon deleted (cascade)** → URLs 404 cleanly

### URLs / access
- **Pre-publish access** → "Not available yet" page (NOT 404)
- **Wrong slug for team** → 404
- **Organizer URL accessed by participant** → 403 redirect to signin
- **Bot/crawler hitting URL** → return OG meta + static PNG, never auth-gate
- **Post-deletion access** → 404 with "this event no longer exists"

### PNG / sharing
- **Satori font load failure** → fall back to system serif, log warning
- **Incomplete team data** → render with available stats only
- **Stale cached PNG** → cache key includes `wrappedVersion`
- **Emoji / non-Latin in name** → embed Noto Sans font subset
- **iOS vs Android share sheet** → Web Share API + download fallback

### Performance
- **Mass simultaneous opens (500+ teams)** → pre-compute on publish, Redis cache, DB only on miss
- **PNG cold start** → Vercel edge cache after first hit
- **Slow stat computation** → background job at publish time, not per-request

### Animation / UX
- **`prefers-reduced-motion`** → all motion off, tap-only
- **Rapid taps during transition** → debounce, queue safely
- **Screen reader** → each slide has aria-live region with text content
- **Background → resume** → restart current slide, don't jump
- **Device rotation** → orientation locked portrait

### Copy variants
- **Rank=0 / "ahead of 0"** → swap copy entirely, no rank slide
- **Solo / 1-person team** → dedicated variant
- **Tier-specific** → top 3 / top 10 / mid / ahead-of-N / no-rank
- **Missing-stat fallback** → every slot has a default phrase

### Typography / rendering
- **Long names** → shrink-to-fit on web, manual size step-down on PNG
- **Number formatting** → `Intl.NumberFormat` with `en-IN` locale (47 vs 1,247)

### Time / timezone
- **Date display** → server renders in event timezone, hydrates as text
- **`endedAt` comparisons** → UTC always, never trust client time
- **Cross-timezone viewers** → text is server-rendered, display is consistent

---

## 10. Defensive (handle v1, not first-class)

Logged with `// TODO defensive:` comments in code:
- Future-dated event accessed
- Round paused with partial data
- `requiredJudges=5` but only 2 actually scored
- Problem statement deleted post-registration
- Long stat numerals (1000+) → comma format via `Intl.NumberFormat`

---

## 11. Deferred to v2

- Per-member personalization
- Music / audio
- Custom illustrations or iconography (only ♦ + wordmark for v1)
- Photo uploads on slides
- Confetti / particle effects
- Multiple design "modes" (one cohesive system in v1)
- Hardcoded domain URL on share PNG (until domain secured)
- Charts / data viz
- Animated GIF version of share image
- Lakh/crore number formatting
- Emoji / non-Latin script in event name (Noto fallback in v2)
- Rejected/withdrawn team states (no schema yet)
- Progressive slide loading (overkill)

---

## 12. Open questions before build

1. Signature purple `#B82FE0` confirmed, or pick differently?
2. Off-white `#F5F0E6` for inverted slides — keep or cut?
3. Wordmark lockup variant (chosen on `feat/wrapped-wordmark-sketches`) — which one?
4. Build order: slide 1 prototype only first, iterate before slides 2–4? Or all four parallel?
5. Splash entry (1.5s wordmark intro before slide 1) — yes or skip?

---

## 13. File map (planned)

```
docs/wrapped/
  design-system.md        ← this file
  references/             ← inspiration screenshots
  copy-library.md         ← all 50 copy variants (build phase)

src/app/h/[slug]/wrapped/
  [teamId]/
    page.tsx              ← participant Wrapped entry
    slides.tsx            ← client carousel
  organizer/
    page.tsx              ← organizer Wrapped

src/app/api/wrapped/
  [teamId]/image/
    route.tsx             ← static share PNG via next/og

src/components/wrapped/
  primitives/
    GradientBlock.tsx     ← Primitive B
    StatStack.tsx         ← Primitive C
    HeroQuote.tsx         ← Primitive D
    TwoPanelSlide.tsx     ← Primitive A
  Wordmark.tsx            ← lockup component
  SlideShell.tsx          ← shared shell with watermark + progress

src/actions/wrapped.ts    ← publish/unpublish, stat computation
src/lib/wrapped-copy.ts   ← copy variant picker
```
