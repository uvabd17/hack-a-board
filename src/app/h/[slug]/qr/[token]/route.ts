import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { PARTICIPANT_COOKIE_NAME } from "@/lib/participant-session"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string; token: string }> } // Correct type for Next.js 15+ route handlers
) {
    const { slug, token } = await context.params
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"

    const limited = await checkRateLimit({
        namespace: "qr-auth",
        identifier: `${ip}:${slug.toLowerCase()}`,
        limit: 60,
        windowSec: 60,
    })
    if (!limited.allowed) {
        return NextResponse.json(
            { error: "Too many QR auth attempts. Try again shortly." },
            {
                status: 429,
                headers: { "Retry-After": String(limited.retryAfterSec || 60) },
            }
        )
    }

    const judgeToken = request.cookies.get("hackaboard_judge_token")?.value

    // Fast path for judge scanning participant QR: skip judge-token lookup by scanned token.
    if (judgeToken) {
        const participant = await prisma.participant.findUnique({
            where: { qrToken: token },
            select: { teamId: true, hackathonId: true, hackathon: { select: { slug: true } } }
        })
        if (participant && participant.hackathon.slug === slug) {
            const activeJudge = await prisma.judge.findUnique({
                where: { token: judgeToken },
                select: { hackathonId: true, isActive: true }
            })
            if (activeJudge?.isActive && activeJudge.hackathonId === participant.hackathonId) {
                const url = request.nextUrl.clone()
                url.pathname = `/h/${slug}/judge/score/${participant.teamId}`
                return NextResponse.redirect(url)
            }
        }
    }

    // 1. Check if scanned token is a Judge pass
    const judge = await prisma.judge.findUnique({
        where: { token },
        select: { isActive: true, hackathon: { select: { slug: true } } }
    })

    if (judge?.isActive && judge.hackathon.slug === slug) {
        // Instead of a redirect (which drops cookies from external contexts like camera apps),
        // return an HTML page that sets the cookie and then navigates client-side.
        const judgePath = `/h/${slug}/judge`
        const response = new NextResponse(
            `<!DOCTYPE html>
            <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <style>body{background:#0a0a0f;color:#e4e4e7;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
            .c{text-align:center}.s{font-size:12px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.5}</style>
            </head><body><div class="c"><p>Authenticating...</p><p class="s">Setting up judge session</p></div>
            <script>setTimeout(function(){window.location.replace("${judgePath}")},300)</script>
            </body></html>`,
            {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
            }
        )
        response.cookies.set("hackaboard_judge_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: `/`,
            maxAge: 60 * 60 * 12
        })
        return response
    }

    // 2. Check if scanned token is a Participant pass
    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        select: { qrToken: true, teamId: true, hackathonId: true, hackathon: { select: { slug: true } } }
    })

    if (participant) {
        if (participant.hackathon.slug === slug) {
            // Check if potential Judge is scanning
            if (judgeToken) {
                const isJudge = await prisma.judge.findUnique({
                    where: { token: judgeToken, isActive: true },
                    select: { hackathonId: true }
                })
                if (isJudge && isJudge.hackathonId === participant.hackathonId) {
                    const url = request.nextUrl.clone()
                    url.pathname = `/h/${slug}/judge/score/${participant.teamId}`
                    return NextResponse.redirect(url)
                }
            }

            // Same HTML-page approach as judge auth — avoids cookie loss on external-context redirects
            const dashPath = `/h/${slug}/dashboard`
            const response = new NextResponse(
                `<!DOCTYPE html>
                <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                <style>body{background:#0a0a0f;color:#e4e4e7;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
                .c{text-align:center}.s{font-size:12px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.5}</style>
                </head><body><div class="c"><p>Welcome!</p><p class="s">Loading your dashboard</p></div>
                <script>setTimeout(function(){window.location.replace("${dashPath}")},300)</script>
                </body></html>`,
                {
                    status: 200,
                    headers: { "Content-Type": "text/html; charset=utf-8" },
                }
            )
            response.cookies.set(PARTICIPANT_COOKIE_NAME, participant.qrToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: `/h/${slug}`,
                maxAge: 60 * 60 * 24 * 3 // 3 days
            })

            return response
        }
    }

    return NextResponse.json({ error: "Invalid Token or Hackathon Mismatch" }, { status: 404 })
}
