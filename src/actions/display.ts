"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
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

        revalidatePath(`/h/${slug}/manage/display`)
        revalidatePath(`/h/${slug}/display`)
        revalidatePath(`/h/${slug}/dashboard`)
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

        revalidatePath(`/h/${slug}/manage/display`)
        revalidatePath(`/h/${slug}/display`)
        await emitDisplayConfig(hackathonId, config.mode, config.problemId)
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
        const [problems, rounds] = await Promise.all([
            prisma.problemStatement.findMany({ where: { hackathonId: hackathon.id } }),
            prisma.round.findMany({
                where: { hackathonId: hackathon.id },
                select: { id: true, name: true, order: true, checkpointTime: true, checkpointPausedAt: true },
                orderBy: { order: "asc" }
            })
        ])

        const { leaderboard, frozen } = await getLeaderboardData(
            slug,
            hackathon.displayMode === "problem" ? hackathon.displayProblemId : null
        )

        return {
            hackathon: { ...hackathon, isFrozen: frozen },
            leaderboard,
            problems,
            rounds,
            displayConfig: {
                mode: hackathon.displayMode,
                problemId: hackathon.displayProblemId
            }
        }
    } catch (error) {
        console.error("Failed to get leaderboard data:", error)
        return null
    }
}

export async function getTrackStanding(slug: string, problemId: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, isFrozen: true, name: true, displayMode: true, displayProblemId: true }
    })

    if (!hackathon) return null

    try {
        const problems = await prisma.problemStatement.findMany({
            where: { hackathonId: hackathon.id }
        })

        const { leaderboard, frozen } = await getLeaderboardData(slug, problemId)

        return {
            hackathon: { ...hackathon, isFrozen: frozen },
            leaderboard,
            problems,
            displayConfig: {
                mode: "problem",
                problemId
            }
        }
    } catch (error) {
        console.error("Failed to get track standing:", error)
        return null
    }
}
