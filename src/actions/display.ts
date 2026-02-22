"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath, unstable_cache } from "next/cache"
import { getLeaderboardData } from "@/actions/leaderboard"
import { emitFreeze, emitDisplayConfig } from "@/lib/socket-emit"

async function assertDisplayOwner(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return null
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId, userId: session.user.id },
        select: { slug: true }
    })
    return hackathon || null
}

export async function toggleFreeze(hackathonId: string, isFrozen: boolean, slug: string) {
    const owner = await assertDisplayOwner(hackathonId)
    if (!owner) return { success: false, error: "Unauthorized" }
    try {
        await prisma.hackathon.update({
            where: { id: hackathonId },
            data: { isFrozen },
        })

        // Emit socket event for real-time update (no need for aggressive revalidation)
        await emitFreeze(hackathonId, isFrozen)
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
        await prisma.hackathon.update({
            where: { id: hackathonId },
            data: {
                displayMode: config.mode,
                displayProblemId: config.problemId || null
            },
        })

        // Emit socket event for real-time update
        await emitDisplayConfig(hackathonId, config.mode, config.problemId)
        return { success: true }
    } catch (error) {
        console.error("Failed to update display config:", error)
        return { success: false, error: "Failed to update display configuration" }
    }
}

// Cache display state for 3 seconds - reduces DB load during rapid updates
const getCachedDisplayState = unstable_cache(
    async (slug: string) => {
        const hackathon = await prisma.hackathon.findUnique({
            where: { slug },
            select: {
                id: true, isFrozen: true, name: true, displayMode: true, displayProblemId: true,
                status: true, liveStartedAt: true, endDate: true, startDate: true,
            }
        })

        if (!hackathon) return null

        try {
            // Fetch rounds OUTSIDE cache for instant timer updates
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
                getLeaderboardData(
                    slug,
                    hackathon.displayMode === "problem" ? hackathon.displayProblemId : null
                ),
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
    },
    ["display-state"],
    { revalidate: 1, tags: ["display"] }
)

export async function getDisplayState(slug: string) {
    return getCachedDisplayState(slug)
}

// Cache track standing for 5 seconds
const getCachedTrackStanding = unstable_cache(
    async (slug: string, problemId: string) => {
        const hackathon = await prisma.hackathon.findUnique({
            where: { slug },
            select: { id: true, isFrozen: true, name: true, displayMode: true, displayProblemId: true, status: true, liveStartedAt: true, endDate: true, startDate: true }
        })

        if (!hackathon) return null

        try {
            // Fetch rounds OUTSIDE cache for instant timer updates
            const rounds = await prisma.round.findMany({
                where: { hackathonId: hackathon.id },
                select: { id: true, name: true, order: true, checkpointTime: true, checkpointPausedAt: true },
                orderBy: { order: "asc" }
            })

            const [problems, { leaderboard, frozen }, phases] = await Promise.all([
                prisma.problemStatement.findMany({ 
                    where: { hackathonId: hackathon.id },
                    select: { id: true, title: true, description: true, order: true, isReleased: true }
                }),
                getLeaderboardData(slug, problemId),
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
                    mode: hackathon.displayMode, // Use actual mode from DB (could be "auto")
                    problemId
                }
            }
        } catch (error) {
            console.error("Failed to get track standing:", error)
            return null
        }
    },
    ["track-standing"],
    { revalidate: 2, tags: ["display", "leaderboard"] }
)

export async function getTrackStanding(slug: string, problemId: string) {
    return getCachedTrackStanding(slug, problemId)
}
