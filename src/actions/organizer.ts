"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

export async function createNewHackathon(customSlug?: string) {
    const session = await auth()
    if (!session?.user?.id) redirect("/signin")

    // Use custom slug if provided, otherwise generate random
    let slug = customSlug 
        ? customSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
        : `hack-${Math.random().toString(36).substring(7)}`

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return { success: false, error: "Slug must contain only lowercase letters, numbers, and dashes" }
    }

    if (slug.length < 3) {
        return { success: false, error: "Slug must be at least 3 characters long" }
    }

    // Check if slug is already taken
    const existing = await prisma.hackathon.findUnique({
        where: { slug },
        select: { id: true }
    })

    if (existing) {
        return { success: false, error: "This slug is already taken. Please choose another." }
    }

    // Create a draft hackathon
    try {
        const hackathon = await prisma.hackathon.create({
            data: {
                name: customSlug ? customSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Untitled Hackathon",
                slug,
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

// ============================================
// HACKATHON SETTINGS / EDIT
// ============================================

const UpdateHackathonSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    tagline: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    startDate: z.string().min(1, "Start date required"),
    endDate: z.string().min(1, "End date required"),
    timezone: z.string().min(1),
    mode: z.enum(["in-person", "online", "hybrid"]),
    venue: z.string().optional().nullable(),
    onlineLink: z.string().optional().nullable(),
    minTeamSize: z.coerce.number().int().min(1).max(20),
    maxTeamSize: z.coerce.number().int().min(1).max(20),
    maxTeams: z.coerce.number().int().min(0),
    requireApproval: z.boolean(),
    registrationDeadline: z.string().optional().nullable(),
    timeBonusRate: z.coerce.number().min(0),
    timePenaltyRate: z.coerce.number().min(0),
})

export async function updateHackathon(hackathonId: string, data: z.infer<typeof UpdateHackathonSchema>) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const validated = UpdateHackathonSchema.safeParse(data)
    if (!validated.success) {
        return { error: "Invalid data: " + validated.error.issues.map(e => e.message).join(", ") }
    }

    try {
        const updated = await prisma.hackathon.update({
            where: { id: hackathonId },
            data: {
                name: validated.data.name,
                slug: validated.data.slug,
                tagline: validated.data.tagline || null,
                description: validated.data.description || null,
                startDate: new Date(validated.data.startDate),
                endDate: new Date(validated.data.endDate),
                timezone: validated.data.timezone,
                mode: validated.data.mode,
                venue: validated.data.venue || null,
                onlineLink: validated.data.onlineLink || null,
                minTeamSize: validated.data.minTeamSize,
                maxTeamSize: validated.data.maxTeamSize,
                maxTeams: validated.data.maxTeams,
                requireApproval: validated.data.requireApproval,
                registrationDeadline: validated.data.registrationDeadline ? new Date(validated.data.registrationDeadline) : null,
                timeBonusRate: validated.data.timeBonusRate,
                timePenaltyRate: validated.data.timePenaltyRate,
            }
        })

        revalidatePath(`/h/${updated.slug}/manage`)
        revalidatePath(`/h/${updated.slug}/manage/settings`)
        revalidatePath(`/h/${updated.slug}`)

        // If slug changed, redirect to the new URL
        if (hackathon.slug !== updated.slug) {
            return { success: true, slugChanged: true, newSlug: updated.slug }
        }

        return { success: true }
    } catch (error: unknown) {
        console.error("Failed to update hackathon:", error)
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
            return { error: "Slug is already taken. Choose a different one." }
        }
        return { error: "Failed to update hackathon" }
    }
}

// ============================================
// EVENT LIFECYCLE
// ============================================

const VALID_TRANSITIONS: Record<string, string[]> = {
    draft: ["published"],
    published: ["draft", "live"],
    live: ["ended"],
    ended: [],
}

export async function updateHackathonStatus(hackathonId: string, newStatus: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true, status: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const allowed = VALID_TRANSITIONS[hackathon.status] || []
    if (!allowed.includes(newStatus)) {
        return { error: `Cannot transition from "${hackathon.status}" to "${newStatus}"` }
    }

    const timestampUpdates: Record<string, unknown> = {}
    if (newStatus === "live") timestampUpdates.liveStartedAt = new Date()
    if (newStatus === "ended") timestampUpdates.endedAt = new Date()

    await prisma.hackathon.update({
        where: { id: hackathonId },
        data: {
            status: newStatus,
            ...timestampUpdates,
        }
    })

    revalidatePath(`/h/${hackathon.slug}/manage`)
    revalidatePath(`/h/${hackathon.slug}`)
    return { success: true }
}
