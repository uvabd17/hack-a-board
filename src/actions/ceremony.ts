"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Types for the winner snapshot
export type WinnerSnapshot = {
    rank: number
    teamName: string
    score: number
    problemStatement: string
    members: string[] // Strings for MVP simplicty
}

export type CeremonyState = {
    isActive: boolean
    currentRound: number // 1-based index (1 = 1st winner revealed)
    totalWinners: number
    currentWinner: WinnerSnapshot | null
    history: WinnerSnapshot[]
}

// MOCK DATA GENERATOR (Since Phase 5 is out of scope)
function generateMockWinners(count: number): WinnerSnapshot[] {
    const problemStatements = ["FinTech", "HealthTech", "EdTech", "GreenTech", "Open Innovation"]
    const winners: WinnerSnapshot[] = []

    for (let i = 0; i < count; i++) {
        // Generate random score between 70 and 100
        const score = Math.floor(Math.random() * 30) + 70
        winners.push({
            rank: i + 1,
            teamName: `Team ${["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"][i]}`,
            score: score,
            problemStatement: problemStatements[i % problemStatements.length],
            members: [`Hacker ${i * 2 + 1}`, `Hacker ${i * 2 + 2}`]
        })
    }

    // Sort by rank (implicitly 1 to N)
    return winners
}


export async function startCeremony(hackathonId: string, mode: "overall" | "problem-wise") {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    // verify organizer ownership
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId, userId: session.user.id }
    })

    if (!hackathon) return { success: false, error: "Hackathon not found" }

    // Generate snapshot
    const winners = generateMockWinners(10) // Top 10 winners

    // Create new session
    const ceremonySession = await prisma.ceremonySession.create({
        data: {
            hackathonId,
            mode,
            revealCount: 10,
            isStarted: true,
            startedAt: new Date(),
            winnersSnapshot: JSON.stringify(winners),
            currentIndex: 0 // Start at 0 (nothing revealed)
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

    if (activeSession.currentIndex >= 10) {
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
