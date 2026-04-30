// Capture screenshots for the pitch deck.
// Run from project root: node scripts/capture-pitch-screenshots.mjs
import { chromium } from "../pitch/node_modules/playwright-chromium/index.mjs"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import "dotenv/config"

const SLUG = "test-hackathon-2026"
const BASE = "http://localhost:3000"
const OUT = "pitch/public/screenshots"

mkdirSync(OUT, { recursive: true })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Get one participant qrToken from seed for participant dashboard
  const participant = await prisma.participant.findFirst({
    where: { hackathon: { slug: SLUG } },
    select: { qrToken: true, name: true, teamId: true },
  })
  if (!participant?.qrToken) {
    throw new Error("No seeded participant with qrToken found. Did you run the seed?")
  }
  console.log(`✓ Using participant: ${participant.name}`)

  const browser = await chromium.launch()

  // ───── 1. Display screen — no auth needed, waits for leaderboard rows ─────
  {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/h/${SLUG}/display`, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page
      .waitForFunction(() => !document.body.innerText.includes("LOADING LEADERBOARD"), { timeout: 30000 })
      .catch(() => console.warn("⚠ display still loading, capturing anyway"))
    await page.waitForTimeout(3000)
    // Hide socket-offline banner + OFFLINE pill for a clean marketing capture.
    await page.evaluate(() => {
      const hideMatches = (re) => {
        document.querySelectorAll("body *").forEach((el) => {
          const txt = el.textContent?.trim() || ""
          if (re.test(txt) && el.children.length === 0) {
            const wrap = el.closest("div") || el
            wrap.style.display = "none"
          }
        })
      }
      hideMatches(/LIVE SYNC DELAYED|RECONNECTING TO SOCKET/i)
      hideMatches(/^OFFLINE$/i)
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(OUT, "display.png"), fullPage: false })
    console.log("✓ display.png")
    await ctx.close()
  }

  // ───── 2. Organizer manage page — dev credentials login ─────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/signin`, { waitUntil: "domcontentloaded", timeout: 20000 })
    // Click DEV login button
    const devButton = page.locator('button:has-text("DEV: Login as Test Organizer")')
    if (await devButton.count()) {
      await devButton.click()
      await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {})
    }
    await page.goto(`${BASE}/h/${SLUG}/manage`, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: join(OUT, "organizer.png"), fullPage: false })
    console.log("✓ organizer.png")
    await ctx.close()
  }

  // ───── 3. Participant dashboard ─────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    // QR auth flow sets cookie and redirects
    await page.goto(`${BASE}/h/${SLUG}/qr/${participant.qrToken}`, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(2000)
    // Should redirect to dashboard
    if (!page.url().includes("/dashboard")) {
      await page.goto(`${BASE}/h/${SLUG}/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 })
    }
    await page.waitForTimeout(1500)
    await page.screenshot({ path: join(OUT, "participant.png"), fullPage: false })
    console.log("✓ participant.png")
    await ctx.close()
  }

  // ───── 4. Judge phone view ─────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/h/${SLUG}/qr/test_judge_token_001`, { waitUntil: "domcontentloaded", timeout: 20000 })
    await page.waitForTimeout(2000)
    if (!page.url().includes("/judge")) {
      await page.goto(`${BASE}/h/${SLUG}/judge`, { waitUntil: "domcontentloaded", timeout: 20000 })
    }
    await page.waitForTimeout(1500)
    await page.screenshot({ path: join(OUT, "judge.png"), fullPage: false })
    console.log("✓ judge.png")
    await ctx.close()
  }

  await browser.close()
  await prisma.$disconnect()
  console.log("\n✓ All screenshots saved to", OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
