"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getUserHackathons() {
    const session = await auth()
    if (!session?.user?.id) {
        return { authorized: false, hackathons: [] }
    }

    const hackathons = await prisma.hackathon.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
    })

    return { authorized: true, hackathons }
}

export async function createNewHackathon() {
    const session = await auth()
    if (!session?.user?.id) redirect("/api/auth/signin")

    // Generate a random slug for the new hackathon
    const randomSlug = `hack-${Math.random().toString(36).substring(7)}`

    // Create a draft hackathon
    try {
        const hackathon = await prisma.hackathon.create({
            data: {
                name: "Untitled Hackathon",
                slug: randomSlug,
                userId: session.user.id,
                startDate: new Date(),
                endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
            }
        })
        return { success: true, slug: hackathon.slug }
    } catch (error) {
        console.error("Failed to create hackathon:", error)
        return { success: false, error: "Failed to create hackathon" }
    }
}
