"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getLeaderboardData } from "@/actions/leaderboard"
import { emitFreeze, emitDisplayConfig } from "@/lib/socket-emit"
import { canManageHackathon } from "@/lib/access-control"

async function assertDisplayOwner(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return null
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, organizerEmails: true, slug: true }
    })
    if (!hackathon || !canManageHackathon(hackathon, session.user)) return null
    return { slug: hackathon.slug }
}

export async function toggleFreeze(hackathonId: string, isFrozen: boolean, slug: string) {
    const owner = await assertDisplayOwner(hackathonId)
    if (!owner) return { success: false, error: "Unauthorized" }
    try {
        // Socket emit + DB update in parallel — display reacts to socket instantly,
        // DB is just for persistence. Neither blocks the other.
        await Promise.all([
            prisma.hackathon.update({ where: { id: hackathonId }, data: { isFrozen } }),
            emitFreeze(hackathonId, isFrozen),
        ])
        return { success: true }
    } catch (error) {
        console.error("Failed to toggle freeze:", error)
        return { success: false, error: "Failed to update freeze state" }
    }
}

export async function updateDisplayConfig(
    hackathonId: string,
    config: { mode: "global" | "problem" | "auto", problemId?: string | null },
    slug: string
) {
    const owner = await assertDisplayOwner(hackathonId)
    if (!owner) return { success: false, error: "Unauthorized" }
    try {
        // Socket emit first (display reacts instantly), DB write in background
        await emitDisplayConfig(hackathonId, config.mode, config.problemId)
        // Fire-and-forget DB persistence — if it fails, next poll self-corrects
        prisma.hackathon.update({
            where: { id: hackathonId },
            data: { displayMode: config.mode, displayProblemId: config.problemId || null },
        }).catch(err => console.warn("[display-config] DB write failed:", err))
        return { success: true }
    } catch (error) {
        console.error("Failed to update display config:", error)
        return { success: false, error: "Failed to update display configuration" }
    }
}

export async function getDisplayState(slug: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: {
            id: true, isFrozen: true, name: true, displayMode: true, displayProblemId: true,
            status: true, liveStartedAt: true, endDate: true, startDate: true,
        }
    })

    if (!hackathon) return null

    try {
        const rounds = await prisma.round.findMany({
            where: { hackathonId: hackathon.id },
            select: { id: true, name: true, order: true, checkpointTime: true, checkpointPausedAt: true },
            orderBy: { order: "asc" }
        })

        const [problems, { leaderboard, frozen }, phases] = await Promise.all([
            prisma.problemStatement.findMany({
                where: { hackathonId: hackathon.id },
                orderBy: { order: 'asc' },
                select: { id: true, title: true, description: true, order: true, isReleased: true }
            }),
            getLeaderboardData(slug), // Always global — display filters client-side
            prisma.phase.findMany({
                where: { hackathonId: hackathon.id },
                orderBy: { order: 'asc' },
                select: { id: true, name: true, startTime: true, endTime: true, order: true }
            })
        ])

        return {
            hackathon: { ...hackathon, isFrozen: frozen },
            leaderboard,
            problems,
            rounds,
            phases,
            displayConfig: {
                mode: hackathon.displayMode,
                problemId: hackathon.displayProblemId
            }
        }
    } catch (error) {
        console.error("Failed to load display state:", error)
        return null
    }
}

