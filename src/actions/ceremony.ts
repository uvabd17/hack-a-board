"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

import { getLeaderboardData } from "@/actions/leaderboard"

export type WinnerSnapshot = {
    rank: number
    teamName: string
    score: number
    problemStatement: string
    members: string[]
}

export type CeremonyState = {
    isActive: boolean
    currentRound: number // 1-based index (1 = 1st winner revealed)
    totalWinners: number
    currentWinner: WinnerSnapshot | null
    history: WinnerSnapshot[]
}

export async function startCeremony(hackathonId: string, mode: "overall" | "problem-wise") {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // verify organizer ownership
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId, userId: session.user.id }
    })

    if (!hackathon) return { success: false, error: "Hackathon not found" }

    const { leaderboard } = await getLeaderboardData(hackathon.slug)

    // Generate winners based on mode
    let winners: WinnerSnapshot[] = []

    if (mode === "overall") {
        // Take top 10 (or all if less than 10)
        const topTeams = leaderboard.slice(0, 10)
        winners = await Promise.all(topTeams.map(async (entry) => {
            const teamInfo = await fetchTeamDetails(entry.teamId)
            return {
                rank: entry.rank,
                teamName: entry.teamName,
                score: entry.totalScore,
                problemStatement: teamInfo?.problemStatement?.title || "General",
                members: teamInfo?.participants.map(p => p.name) || []
            }
        }))
    } else {
        // Problem-wise: Top 1 per problem statement (skip empty tracks)
        const problems = await prisma.problemStatement.findMany({
            where: { hackathonId }
        })

        const problemWinners: WinnerSnapshot[] = []

        for (const problem of problems) {
            const topTeamInProblem = leaderboard.find(e => {
                // We need to know the problem statement ID for each entry.
                // Currently LeaderboardEntry only has teamId. 
                // Let's assume we fetch team details to check.
                return e.problemStatementId === problem.id && e.totalScore > 0
            })

            if (topTeamInProblem) {
                const teamInfo = await fetchTeamDetails(topTeamInProblem.teamId)
                problemWinners.push({
                    rank: 1, // Winner of this track
                    teamName: topTeamInProblem.teamName,
                    score: topTeamInProblem.totalScore,
                    problemStatement: problem.title,
                    members: teamInfo?.participants.map(p => p.name) || []
                })
            }
        }

        // Sort winners by score (highest track winner first)
        winners = problemWinners.sort((a, b) => b.score - a.score)
    }

    // Helper for team details
    async function fetchTeamDetails(teamId: string) {
        return await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                participants: { select: { name: true } },
                problemStatement: { select: { title: true } }
            }
        })
    }

    // Create new session
    const ceremonySession = await prisma.ceremonySession.create({
        data: {
            hackathonId,
            mode,
            revealCount: winners.length,
            isStarted: true,
            startedAt: new Date(),
            winnersSnapshot: JSON.stringify(winners),
            currentIndex: 0
        }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/display`)
    revalidatePath(`/h/${hackathon.slug}/display`)

    return { success: true, sessionId: ceremonySession.id }
}

export async function revealNext(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Find active session
    const activeSession = await prisma.ceremonySession.findFirst({
        where: { hackathonId, isStarted: true },
        orderBy: { startedAt: 'desc' }
    })

    if (!activeSession) return { success: false, error: "No active ceremony" }

    const winners = JSON.parse(activeSession.winnersSnapshot as string) as WinnerSnapshot[]

    // Determine the *next* index to reveal.
    // Logic: 
    // currentIndex = 0 -> reveal rank #10 (if reverse) or #1 (if forward)?
    // Usually hackathons reveal in REVERSE order (3rd place, then 2nd, then 1st).
    // Let's assume the snapshot is ordered Rank 1 to 10.
    // Reveal order: Rank 10 -> Rank 9 -> ... -> Rank 1.

    // If currentIndex is 0, we haven't revealed anything.
    // We increment index.

    if (activeSession.currentIndex >= winners.length) {
        return { success: false, error: "All winners revealed" }
    }

    await prisma.ceremonySession.update({
        where: { id: activeSession.id },
        data: { currentIndex: activeSession.currentIndex + 1 }
    })

    // Trigger socket event would go here in full implementation

    return { success: true }
}

export async function getCeremonyState(slug: string): Promise<CeremonyState> {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug }
    })

    if (!hackathon) return { isActive: false, currentRound: 0, totalWinners: 0, currentWinner: null, history: [] }

    const activeSession = await prisma.ceremonySession.findFirst({
        where: { hackathonId: hackathon.id, isStarted: true },
        orderBy: { startedAt: 'desc' }
    })

    if (!activeSession) return { isActive: false, currentRound: 0, totalWinners: 0, currentWinner: null, history: [] }

    const winners = JSON.parse(activeSession.winnersSnapshot as string) as WinnerSnapshot[]

    // Current Index = number of winners revealed so far.
    // Reveal Order: Reverse Rank (10 down to 1).
    // Index 1 = 10th Place
    // Index 2 = 9th Place
    // ...
    // Index 10 = 1st Place

    const revealedCount = activeSession.currentIndex

    // Get the winner corresponding to the *last revealed* index.
    // If count is 1, we want the LAST item in the winners array (Rank 10).
    // If count is 10, we want the FIRST item (Rank 1).

    let currentWinner: WinnerSnapshot | null = null
    const history: WinnerSnapshot[] = []

    if (activeSession.currentIndex > 0) {
        // Calculate which rank was just revealed
        // winners array is [Rank 1, Rank 2, ... Rank 10]
        // Rev 1 = Rank 10 (index 9)
        // Rev 2 = Rank 9 (index 8)
        // Formula: index = length - currentReveal

        const winnerIndex = winners.length - activeSession.currentIndex
        if (winnerIndex >= 0 && winnerIndex < winners.length) {
            currentWinner = winners[winnerIndex]
        }

        // History: All revealed winners so far
        // [Rank 10, Rank 9 ... Rank X]
        for (let i = 1; i <= activeSession.currentIndex; i++) {
            const hIndex = winners.length - i
            if (hIndex >= 0) history.push(winners[hIndex])
        }
    }

    return {
        isActive: true,
        currentRound: activeSession.currentIndex,
        totalWinners: winners.length,
        currentWinner,
        history
    }
}

export async function stopCeremony(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // Find active session
    const activeSession = await prisma.ceremonySession.findFirst({
        where: { hackathonId, isStarted: true },
        orderBy: { startedAt: 'desc' }
    })

    if (!activeSession) return { success: false, error: "No active ceremony" }

    await prisma.ceremonySession.update({
        where: { id: activeSession.id },
        data: { isStarted: false }
    })

    return { success: true }
}
