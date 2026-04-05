"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { canManageHackathon } from "@/lib/access-control"
import { parseDateTimeLocalWithOffset } from "@/lib/datetime"

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
        select: { userId: true, organizerEmails: true, slug: true, startDate: true, endDate: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) return null
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
    const offsetMinutesRaw = formData.get("clientTimezoneOffsetMinutes")
    const offsetMinutes = typeof offsetMinutesRaw === "string" ? Number(offsetMinutesRaw) : undefined
    const parsedStart = parseDateTimeLocalWithOffset(startTime, offsetMinutes)
    const parsedEnd = parseDateTimeLocalWithOffset(endTime, offsetMinutes)
    if (!parsedStart || !parsedEnd) {
        return { error: "Invalid phase datetime format" }
    }
    if (parsedStart >= parsedEnd) {
        return { error: "Start time must be before end time" }
    }
    if (parsedStart < hackathon.startDate || parsedEnd > hackathon.endDate) {
        return { error: "Phase must be within event start/end time" }
    }

    try {
        // Overlap check + create in single transaction to prevent race conditions
        await prisma.$transaction(async (tx) => {
            const overlapping = await tx.phase.findFirst({
                where: {
                    hackathonId,
                    startTime: { lt: parsedEnd },
                    endTime: { gt: parsedStart },
                },
                select: { id: true }
            })
            if (overlapping) {
                throw new Error("Phase overlaps with an existing phase")
            }

            await tx.phase.create({
                data: {
                    hackathonId,
                    name,
                    startTime: parsedStart,
                    endTime: parsedEnd,
                    order,
                }
            })
        })

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ""
        if (msg.includes("overlaps")) return { error: msg }
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
    const offsetMinutesRaw = formData.get("clientTimezoneOffsetMinutes")
    const offsetMinutes = typeof offsetMinutesRaw === "string" ? Number(offsetMinutesRaw) : undefined
    const parsedStart = parseDateTimeLocalWithOffset(startTime, offsetMinutes)
    const parsedEnd = parseDateTimeLocalWithOffset(endTime, offsetMinutes)
    if (!parsedStart || !parsedEnd) {
        return { error: "Invalid phase datetime format" }
    }
    if (parsedStart >= parsedEnd) {
        return { error: "Start time must be before end time" }
    }
    if (parsedStart < hackathon.startDate || parsedEnd > hackathon.endDate) {
        return { error: "Phase must be within event start/end time" }
    }

    const overlapping = await prisma.phase.findFirst({
        where: {
            hackathonId,
            id: { not: phaseId },
            startTime: { lt: parsedEnd },
            endTime: { gt: parsedStart },
        },
        select: { id: true }
    })
    if (overlapping) {
        return { error: "Phase overlaps with an existing phase" }
    }

    try {
        await prisma.phase.update({
            where: { id: phaseId, hackathonId },
            data: {
                name,
                startTime: parsedStart,
                endTime: parsedEnd,
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
        const shifted = phases.map((phase) => ({
            id: phase.id,
            startTime: new Date(phase.startTime.getTime() + shiftMs),
            endTime: new Date(phase.endTime.getTime() + shiftMs),
        }))

        if (shifted.some((phase) => phase.startTime < hackathon.startDate || phase.endTime > hackathon.endDate)) {
            return { error: "Shift would push one or more phases outside event window" }
        }

        // Update all phases in parallel
        await Promise.all(shifted.map(phase =>
            prisma.phase.update({
                where: { id: phase.id },
                data: {
                    startTime: phase.startTime,
                    endTime: phase.endTime
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

/**
 * Cascade shift: move all phases and rounds that start AFTER a given
 * pivot timestamp by shiftMinutes. Used when editing one phase/round
 * and wanting to push everything downstream by the same delta.
 */
export async function cascadeTimeShift(
    hackathonId: string,
    shiftMinutes: number,
    afterTimestamp: string
) {
    const hackathon = await assertOwner(hackathonId)
    if (!hackathon) return { error: "Unauthorized" }

    if (shiftMinutes === 0) return { success: true, shifted: 0 }
    if (Math.abs(shiftMinutes) > 1440) return { error: "Shift cannot exceed 24 hours" }

    const pivot = new Date(afterTimestamp)
    if (isNaN(pivot.getTime())) return { error: "Invalid pivot timestamp" }

    const shiftMs = shiftMinutes * 60 * 1000

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Find phases whose start is after the pivot
            const phases = await tx.phase.findMany({
                where: { hackathonId, startTime: { gt: pivot } },
                select: { id: true, startTime: true, endTime: true }
            })

            // Find rounds whose checkpoint is after the pivot
            const rounds = await tx.round.findMany({
                where: { hackathonId, checkpointTime: { gt: pivot } },
                select: { id: true, checkpointTime: true }
            })

            // Validate bounds
            for (const p of phases) {
                const newEnd = new Date(p.endTime.getTime() + shiftMs)
                if (newEnd > hackathon.endDate) {
                    throw new Error("Shift would push a phase past event end time")
                }
                const newStart = new Date(p.startTime.getTime() + shiftMs)
                if (newStart < hackathon.startDate) {
                    throw new Error("Shift would push a phase before event start time")
                }
            }
            for (const r of rounds) {
                const newCp = new Date(r.checkpointTime.getTime() + shiftMs)
                if (newCp > hackathon.endDate || newCp < hackathon.startDate) {
                    throw new Error("Shift would push a round checkpoint outside event window")
                }
            }

            // Apply shifts
            for (const p of phases) {
                await tx.phase.update({
                    where: { id: p.id },
                    data: {
                        startTime: new Date(p.startTime.getTime() + shiftMs),
                        endTime: new Date(p.endTime.getTime() + shiftMs),
                    }
                })
            }
            for (const r of rounds) {
                await tx.round.update({
                    where: { id: r.id },
                    data: {
                        checkpointTime: new Date(r.checkpointTime.getTime() + shiftMs),
                    }
                })
            }

            return phases.length + rounds.length
        })

        revalidatePath(`/h/${hackathon.slug}/manage/phases`)
        revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
        revalidatePath(`/h/${hackathon.slug}/manage`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true, shifted: result }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to cascade shift"
        console.error(e)
        return { error: msg }
    }
}
