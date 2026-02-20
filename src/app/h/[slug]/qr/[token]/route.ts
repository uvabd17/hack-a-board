import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string; token: string }> } // Correct type for Next.js 15+ route handlers
) {
    const { slug, token } = await context.params

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
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 // 24 hours
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
            url.searchParams.set("token", participant.qrToken)

            const response = NextResponse.redirect(url)

            // Set Participant Cookie (Placeholder)
            response.cookies.set("hackaboard_participant_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })

            return response
        }
    }

    return NextResponse.json({ error: "Invalid Token or Hackathon Mismatch" }, { status: 404 })
}
