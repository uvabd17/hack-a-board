"use server"

import { prisma } from "@/lib/prisma"
import { calculateTeamScore, breakTie, LeaderboardEntry, TeamWithRelations, RoundWithCriteria } from "@/lib/scoring"
import { Team, Submission, Score, Criterion, Round } from "@prisma/client"

export async function getLeaderboardData(slug: string, problemId?: string | null): Promise<{
    leaderboard: LeaderboardEntry[],
    lastUpdated: Date,
    frozen: boolean
}> {

    // 1. Fetch Hackathon Config & Rounds
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        include: {
            rounds: {
                orderBy: { order: 'asc' },
                include: { criteria: true }
            }
        }
    })

    if (!hackathon) throw new Error("Hackathon not found")

    // 2. Fetch Teams and Data
    const teams = await prisma.team.findMany({
        where: {
            hackathonId: hackathon.id,
            status: "approved",
            ...(problemId ? { problemStatementId: problemId } : {})
        },
        include: {
            scores: {
                include: { criterion: true }
            },
            submissions: true,
            participants: { select: { id: true } }
        }
    })

    // 3. Calculate Scores
    // We need to cast types explicitly because Prisma types can be tricky
    const roundsTyped = hackathon.rounds as RoundWithCriteria[];

    const scoredTeams = teams.map(team => {
        // Cast team to our expected type. 
        // Prisma return includes relations so it should match TeamWithRelations structure.
        const teamTyped = team as unknown as TeamWithRelations;

        const { total, breakdown } = calculateTeamScore(teamTyped, roundsTyped)
        return {
            team: teamTyped,
            total,
            breakdown
        }
    })

    // 4. Sort & Rank (Tie Breaking)
    scoredTeams.sort((a, b) => {
        // Compare Total Score (Desc)
        if (b.total !== a.total) return b.total - a.total;

        // Break Tie (Asc - Lower result from breakTie means 'better/earlier')
        // We want 'better' to be first in list.
        // Array.sort(a, b): if < 0, a comes first.
        return breakTie(a.team, b.team, hackathon.rounds as Round[])
    })

    // 5. Map to Response Format
    const leaderboard: LeaderboardEntry[] = scoredTeams.map((item, index) => ({
        rank: index + 1,
        teamId: item.team.id,
        teamName: item.team.name,
        slug: item.team.inviteCode,
        problemStatementId: item.team.problemStatementId,
        totalScore: item.total,
        roundBreakdown: item.breakdown || {}, // Corrected from item.roundBreakdown
        trend: 'same',
        change: 0
    }))

    return {
        leaderboard,
        lastUpdated: new Date(),
        frozen: hackathon.isFrozen
    }
}
