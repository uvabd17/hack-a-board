"use server"

import { prisma } from "@/lib/prisma"
import { calculateTeamScore } from "@/lib/scoring"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getLeaderboard(slug: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            teams: {
                where: { status: "approved" }, // Only show approved teams
                select: { id: true }
            }
        }
    })

    if (!hackathon) return { error: "Hackathon not found" }

    // Calculate scores for all teams
    // Optimization: In a real app, we might cache this or store likely calculated scores. 
    // For MVP, we calculate on the fly.
    interface TeamScore {
        teamId: string;
        teamName: string;
        totalScore: number;
        breakdown: any[];
    }

    const teamsData = await Promise.all(
        hackathon.teams.map(async (t: { id: string }) => {
            const scoreData = await calculateTeamScore(t.id)
            return scoreData
        })
    )

    // Filter nulls and Sort by Score Descending
    const sortedTeams = teamsData
        .filter((t): t is TeamScore => t !== null)
        .sort((a: TeamScore, b: TeamScore) => b.totalScore - a.totalScore)

    // Apply Freeze Logic
    // If frozen, we might hide ranks/scores or just return them with a "masked" flag?
    // Spec says: "Hide rank, Hide score... Show: RANK: 🔒... SCORE: 🔒"
    // So we return the data struct, but values masked if frozen.

    if (hackathon.isFrozen) {
        return {
            isFrozen: true,
            teams: sortedTeams.map((t: TeamScore) => ({
                ...t,
                totalScore: -1, // Sentinel for hidden
                rank: -1
            }))
        }
    }

    return {
        isFrozen: false,
        teams: sortedTeams.map((t: TeamScore, index: number) => ({
            ...t,
            rank: index + 1
        }))
    }
}

export async function toggleFreeze(hackathonId: string, currentState: boolean) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Unauthorized" }
    }

    await prisma.hackathon.update({
        where: { id: hackathonId },
        data: { isFrozen: !currentState }
    })

    revalidatePath(`/h/${hackathon.slug}`)
    revalidatePath(`/h/${hackathon.slug}/manage`)
    return { success: true }
}
