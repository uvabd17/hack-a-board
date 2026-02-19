"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function toggleFreeze(hackathonId: string, isFrozen: boolean, slug: string) {
    try {
        // In a real app, we would verify the user is the owner here
        // const session = await auth()
        // if (!session?.user) throw new Error("Unauthorized")

        await prisma.hackathon.update({
            where: { id: hackathonId },
            data: { isFrozen },
        })

        revalidatePath(`/h/${slug}/manage/display`)
        revalidatePath(`/h/${slug}/display`)
        revalidatePath(`/h/${slug}/dashboard`)

        return { success: true }
    } catch (error) {
        console.error("Failed to toggle freeze:", error)
        return { success: false, error: "Failed to update freeze state" }
    }
}

// Mock function to get leaderboard data
export async function getLeaderboardData(hackathonId: string) {
    // Return random data changes to simulate live updates
    return [
        { name: "Team Phoenix", score: 1250 + Math.floor(Math.random() * 50), rank: 1, trend: "up", change: 5 },
        { name: "Null Pointers", score: 1100 + Math.floor(Math.random() * 30), rank: 2, trend: "same", change: 0 },
        { name: "Cyber Ninjas", score: 950, rank: 3, trend: "down", change: 2 },
        { name: "Code Breakers", score: 800 + Math.floor(Math.random() * 100), rank: 4, trend: "up", change: 10 },
        { name: "Hack Attack", score: 750, rank: 5, trend: "same", change: 0 },
        { name: "Bit Bandits", score: 600, rank: 6, trend: "down", change: 1 },
        { name: "Data Drivers", score: 550, rank: 7, trend: "up", change: 3 },
        { name: "Pixel Perfect", score: 500, rank: 8, trend: "same", change: 0 },
    ].sort((a, b) => b.score - a.score).map((team, index) => ({ ...team, rank: index + 1 }))
}

export async function getDisplayState(slug: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, isFrozen: true, name: true }
    })

    if (!hackathon) return null

    // If frozen, return static data (or whatever logic defines frozen state in Phase 6)
    // Actually, if frozen, the display should stop updating.
    // So the client needs to know `isFrozen`.

    const leaderboard = await getLeaderboardData(hackathon.id)

    return {
        hackathon,
        leaderboard
    }
}
