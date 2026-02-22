"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const PhaseSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    startTime: z.string().min(1, "Start time required"),
    endTime: z.string().min(1, "End time required"),
    order: z.coerce.number().int().min(1).max(50),
})

async function assertOwner(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) return null
    return hackathon
}

export async function createPhase(hackathonId: string, formData: FormData) {
    const hackathon = await assertOwner(hackathonId)
    if (!hackathon) return { error: "Unauthorized" }

    const raw = {
        name: formData.get("name"),
        startTime: formData.get("startTime"),
        endTime: formData.get("endTime"),
        order: formData.get("order"),
    }

    const validated = PhaseSchema.safeParse(raw)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const { name, startTime, endTime, order } = validated.data

    if (new Date(startTime) >= new Date(endTime)) {
        return { error: "Start time must be before end time" }
    }

    try {
        await prisma.phase.create({
            data: {
                hackathonId,
                name,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                order,
            }
        })

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to create phase" }
    }
}

export async function updatePhase(hackathonId: string, phaseId: string, formData: FormData) {
    const hackathon = await assertOwner(hackathonId)
    if (!hackathon) return { error: "Unauthorized" }

    const raw = {
        name: formData.get("name"),
        startTime: formData.get("startTime"),
        endTime: formData.get("endTime"),
        order: formData.get("order"),
    }

    const validated = PhaseSchema.safeParse(raw)
    if (!validated.success) {
        return { error: validated.error.issues[0].message }
    }

    const { name, startTime, endTime, order } = validated.data

    if (new Date(startTime) >= new Date(endTime)) {
        return { error: "Start time must be before end time" }
    }

    try {
        await prisma.phase.update({
            where: { id: phaseId, hackathonId },
            data: {
                name,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                order,
            }
        })

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to update phase" }
    }
}

export async function deletePhase(hackathonId: string, phaseId: string) {
    const hackathon = await assertOwner(hackathonId)
    if (!hackathon) return { error: "Unauthorized" }

    try {
        await prisma.phase.delete({ where: { id: phaseId, hackathonId } })

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to delete phase" }
    }
}

/**
 * Shift all phases by a specified number of minutes
 * Useful for handling delays during events
 */
export async function shiftAllPhases(hackathonId: string, shiftMinutes: number) {
    const hackathon = await assertOwner(hackathonId)
    if (!hackathon) return { error: "Unauthorized" }

    if (shiftMinutes === 0) return { error: "Shift amount cannot be zero" }
    if (Math.abs(shiftMinutes) > 1440) return { error: "Shift amount cannot exceed 24 hours" }

    try {
        const phases = await prisma.phase.findMany({
            where: { hackathonId },
            select: { id: true, startTime: true, endTime: true }
        })

        if (phases.length === 0) return { error: "No phases to shift" }

        const shiftMs = shiftMinutes * 60 * 1000

        // Update all phases in parallel
        await Promise.all(phases.map(phase => 
            prisma.phase.update({
                where: { id: phase.id },
                data: {
                    startTime: new Date(phase.startTime.getTime() + shiftMs),
                    endTime: new Date(phase.endTime.getTime() + shiftMs)
                }
            })
        ))

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true, shiftedPhases: phases.length }
    } catch (e) {
        console.error(e)
        return { error: "Failed to shift phases" }
    }
}
