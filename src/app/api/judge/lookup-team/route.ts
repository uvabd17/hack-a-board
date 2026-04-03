import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const judgeToken = cookieStore.get("hackaboard_judge_token")?.value

    if (!judgeToken) {
        // Debug: list all cookies to diagnose path issues
        const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`)
        console.log("[lookup-team] No judge token. All cookies:", allCookies)
        return NextResponse.json({ error: "Not authenticated as judge. Please re-scan your judge QR code." }, { status: 401 })
    }
    console.log("[lookup-team] Judge token found:", judgeToken.substring(0, 15) + "...")

    const judge = await prisma.judge.findUnique({
        where: { token: judgeToken },
        select: { hackathonId: true, isActive: true }
    })

    if (!judge?.isActive) {
        return NextResponse.json({ error: "Judge session expired" }, { status: 401 })
    }

    const { inviteCode } = await request.json()

    if (!inviteCode || typeof inviteCode !== "string") {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
        select: { id: true, hackathonId: true }
    })

    if (!team || team.hackathonId !== judge.hackathonId) {
        return NextResponse.json({ error: "Team not found. Check the code and try again." }, { status: 404 })
    }

    return NextResponse.json({ teamId: team.id })
}
