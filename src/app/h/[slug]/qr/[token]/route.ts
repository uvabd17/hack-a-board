import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

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

    // 1. Check if Judge
    const judge = await prisma.judge.findUnique({
        where: { token },
        include: { hackathon: true }
    })

    if (judge) {
        if (judge.hackathon.slug === slug && judge.isActive) {
            // Create redirect response
            const url = request.nextUrl.clone()
            url.pathname = `/h/${slug}/judge`
            url.searchParams.delete("token") // Clean URL

            const response = NextResponse.redirect(url)

            // Set HTTP-only cookie
            response.cookies.set("hackaboard_judge_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: `/h/${slug}`,
                maxAge: 60 * 60 * 12 // 12 hours (single event day)
            })

            return response
        }
    }

    // 2. Check if Participant (Future)
    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        include: { hackathon: true, team: true }
    })

    if (participant) {
        if (participant.hackathon.slug === slug) {
            // Check if potential Judge is scanning
            const judgeToken = request.cookies.get("hackaboard_judge_token")?.value
            if (judgeToken) {
                // Verify judge token validity (simple check)
                const isJudge = await prisma.judge.findUnique({ where: { token: judgeToken, isActive: true } })
                if (isJudge && isJudge.hackathonId === participant.hackathonId) {
                    // Redirect to Scoring Interface
                    const url = request.nextUrl.clone()
                    url.pathname = `/h/${slug}/judge/score/${participant.teamId}`
                    return NextResponse.redirect(url)
                }
            }

            const url = request.nextUrl.clone()
            url.pathname = `/h/${slug}/dashboard`

            const response = NextResponse.redirect(url)

            // Set Participant Cookie (Placeholder)
            response.cookies.set("hackaboard_participant_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: `/h/${slug}`,
                maxAge: 60 * 60 * 24 * 3 // 3 days
            })

            return response
        }
    }

    return NextResponse.json({ error: "Invalid Token or Hackathon Mismatch" }, { status: 404 })
}
