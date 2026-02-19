"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getLeaderboardData } from "@/actions/leaderboard"

export async function toggleFreeze(hackathonId: string, isFrozen: boolean, slug: string) {
    try {
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

export async function getDisplayState(slug: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true, isFrozen: true, name: true }
    })

    if (!hackathon) return null

    try {
        const { leaderboard, frozen } = await getLeaderboardData(slug)

        return {
            hackathon: { ...hackathon, isFrozen: frozen },
            leaderboard
        }
    } catch (error) {
        console.error("Failed to get leaderboard data:", error)
        return {
            hackathon,
            leaderboard: []
        }
    }
}
