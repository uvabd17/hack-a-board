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
