"use server"

import { prisma } from "@/lib/prisma"
import { calculateTeamScore, breakTie, LeaderboardEntry, TeamWithRelations, RoundWithCriteria } from "@/lib/scoring"
import { Round } from "@prisma/client"
import { unstable_cache } from "next/cache"

// Cached leaderboard — revalidated every 3s or on-demand via tag
const getCachedLeaderboard = unstable_cache(
    async (hackathonId: string, problemId?: string | null) => {
        return computeLeaderboard(hackathonId, problemId)
    },
    ["leaderboard"],
    { revalidate: 3, tags: ["leaderboard"] }
)

export async function getLeaderboardData(slug: string, problemId?: string | null): Promise<{
    leaderboard: LeaderboardEntry[],
    lastUpdated: Date,
    frozen: boolean
}> {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, isFrozen: true }
    })
    if (!hackathon) throw new Error("Hackathon not found")

    const result = await getCachedLeaderboard(hackathon.id, problemId)
    return { ...result, frozen: hackathon.isFrozen }
}

async function computeLeaderboard(hackathonId: string, problemId?: string | null): Promise<{
    leaderboard: LeaderboardEntry[],
    lastUpdated: Date,
    frozen: boolean
}> {
    // 1. Fetch Rounds + Criteria in a single query
    const rounds = await prisma.round.findMany({
        where: { hackathonId },
        orderBy: { order: "asc" },
        include: { criteria: true }
    })

    // 2. Fetch only approved teams with minimal selected fields
    const teams = await prisma.team.findMany({
        where: {
            hackathonId,
            status: "approved",
            ...(problemId ? { problemStatementId: problemId } : {})
        },
        include: {
            scores: {
                select: {
                    id: true,
                    teamId: true,
                    roundId: true,
                    judgeId: true,
                    criterionId: true,
                    value: true,
                    createdAt: true,
                    updatedAt: true,
                    comment: true,
                    criterion: { select: { id: true, roundId: true, name: true, weight: true } }
                }
            },
            submissions: {
                select: {
                    id: true,
                    teamId: true,
                    roundId: true,
                    submittedAt: true,
                    timeBonus: true,
                    githubUrl: true,
                    demoUrl: true,
                    presentationUrl: true,
                    otherUrl: true,
                }
            },
        }
    })

    // 3. Calculate Scores in-memory (no extra DB calls)
    const roundsTyped = rounds as RoundWithCriteria[]

    const scoredTeams = teams.map(team => {
        const teamTyped = team as unknown as TeamWithRelations
        const { total, breakdown } = calculateTeamScore(teamTyped, roundsTyped)
        return { team: teamTyped, total, breakdown }
    })

    // 4. Sort & Rank with Tie Breaking
    scoredTeams.sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        return breakTie(a.team, b.team, rounds as Round[])
    })

    // 5. Map to Response
    const leaderboard: LeaderboardEntry[] = scoredTeams.map((item, index) => ({
        rank: index + 1,
        teamId: item.team.id,
        teamName: item.team.name,
        slug: item.team.inviteCode,
        problemStatementId: item.team.problemStatementId,
        totalScore: item.total,
        roundBreakdown: item.breakdown || {},
        trend: "same",
        change: 0
    }))

    return {
        leaderboard,
        lastUpdated: new Date(),
        frozen: false
    }
}
