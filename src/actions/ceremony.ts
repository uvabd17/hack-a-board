"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { emitCeremonyStarted, emitCeremonyReveal } from "@/lib/socket-emit"

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

export async function calculateWinners(hackathonId: string, mode: "overall" | "problem-wise", revealCount: number = 10): Promise<WinnerSnapshot[]> {
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { slug: true, id: true }
    })
    if (!hackathon) return []

    const { leaderboard } = await getLeaderboardData(hackathon.slug)
    let winners: WinnerSnapshot[] = []

    if (mode === "overall") {
        const topTeams = leaderboard.slice(0, revealCount)
        // Batch fetch all team details in one query
        const teamIds = topTeams.map(e => e.teamId)
        const teamDetails = await prisma.team.findMany({
            where: { id: { in: teamIds } },
            include: {
                participants: { select: { name: true } },
                problemStatement: { select: { title: true } }
            }
        })
        const teamMap = new Map(teamDetails.map(t => [t.id, t]))

        winners = topTeams.map(entry => {
            const details = teamMap.get(entry.teamId)
            return {
                rank: entry.rank,
                teamName: entry.teamName,
                score: entry.totalScore,
                problemStatement: details?.problemStatement?.title || "General",
                members: details?.participants.map(p => p.name) || []
            }
        })
    } else {
        const problems = await prisma.problemStatement.findMany({
            where: { hackathonId }
        })

        // Find top team per problem
        const topTeamIds: string[] = []
        const problemWinnerEntries: { entry: typeof leaderboard[0]; problemTitle: string }[] = []

        for (const problem of problems) {
            const topTeamInProblem = leaderboard.find(e => e.problemStatementId === problem.id && e.totalScore > 0)
            if (topTeamInProblem) {
                topTeamIds.push(topTeamInProblem.teamId)
                problemWinnerEntries.push({ entry: topTeamInProblem, problemTitle: problem.title })
            }
        }

        // Batch fetch all winning team details
        const teamDetails = await prisma.team.findMany({
            where: { id: { in: topTeamIds } },
            include: {
                participants: { select: { name: true } },
            }
        })
        const teamMap = new Map(teamDetails.map(t => [t.id, t]))

        winners = problemWinnerEntries
            .map(({ entry, problemTitle }) => {
                const details = teamMap.get(entry.teamId)
                return {
                    rank: 1,
                    teamName: entry.teamName,
                    score: entry.totalScore,
                    problemStatement: problemTitle,
                    members: details?.participants.map(p => p.name) || []
                }
            })
            .sort((a, b) => b.score - a.score)
    }

    return winners
}

export async function getCeremonyPreview(hackathonId: string, mode: "overall" | "problem-wise", revealCount: number = 10) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId, userId: session.user.id } })
    if (!hackathon) return { success: false, error: "Access Denied" }

    try {
        const winners = await calculateWinners(hackathonId, mode, revealCount)
        return { success: true, winners }
    } catch (error) {
        console.error("Failed to get ceremony preview:", error)
        return { success: false, error: "Failed to generate preview" }
    }
}

export async function startCeremony(hackathonId: string, mode: "overall" | "problem-wise", revealCount: number = 10) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId, userId: session.user.id }
    })

    if (!hackathon) return { success: false, error: "Hackathon not found" }

    const winners = await calculateWinners(hackathonId, mode, revealCount)

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
    await emitCeremonyStarted(hackathonId, mode, winners.length)

    return { success: true, sessionId: ceremonySession.id }
}

export async function revealNext(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId, userId: session.user.id } })
    if (!hackathon) return { success: false, error: "Access Denied" }

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

    // Emit the revealed winner to the display
    const nextIndex = activeSession.currentIndex        // Before increment
    const winnerIndex = winners.length - (nextIndex + 1) // Reverse order
    const winner = winners[winnerIndex]
    if (winner) {
        await emitCeremonyReveal(
            hackathonId,
            activeSession.currentIndex + 1,
            winner.teamName,
            winner.score,
            winner.problemStatement
        )
    }

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

    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId, userId: session.user.id } })
    if (!hackathon) return { success: false, error: "Access Denied" }

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
