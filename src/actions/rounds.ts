"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { emitCheckpointUpdated } from "@/lib/socket-emit"
import { z } from "zod"

const RoundSchema = z.object({
    name: z.string().min(3),
    order: z.number().int().min(1),
    weight: z.number().int().min(0).max(100),
})

export async function createRound(hackathonId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const rawData = {
        name: formData.get("name"),
        order: parseInt(formData.get("order") as string),
        weight: parseInt(formData.get("weight") as string),
    }

    const validated = RoundSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: "Invalid data" }
    }

    const checkpointRaw = formData.get("checkpointTime") as string
    const checkpointTime = checkpointRaw
        ? new Date(checkpointRaw)
        : new Date(Date.now() + 86400000) // Default 24h from now

    try {
        await prisma.round.create({
            data: {
                hackathonId,
                name: validated.data.name,
                order: validated.data.order,
                weight: validated.data.weight,
                checkpointTime,
            }
        })

        revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to create round" }
    }
}

export async function deleteRound(hackathonId: string, roundId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    // Scope delete to this hackathon so a malicious caller can't delete rounds from other hackathons
    await prisma.round.delete({ where: { id: roundId, hackathonId } })
    revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
    return { success: true }
}

export async function createCriterion(hackathonId: string, roundId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    // Verify the round belongs to this hackathon before adding a criterion
    const round = await prisma.round.findUnique({ where: { id: roundId }, select: { hackathonId: true } })
    if (!round || round.hackathonId !== hackathonId) return { error: "Round not found" }

    const name = formData.get("name") as string
    const weight = parseInt(formData.get("weight") as string)

    if (!name || isNaN(weight)) return { error: "Invalid data" }

    await prisma.criterion.create({
        data: {
            roundId,
            name,
            weight
        }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
    return { success: true }
}

export async function deleteCriterion(hackathonId: string, criterionId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    // Verify the criterion belongs to a round in this hackathon
    const criterion = await prisma.criterion.findUnique({
        where: { id: criterionId },
        select: { round: { select: { hackathonId: true } } }
    })
    if (!criterion || criterion.round.hackathonId !== hackathonId) return { error: "Criterion not found" }

    await prisma.criterion.delete({ where: { id: criterionId } })
    revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
    return { success: true }
}

// ─────────────────────────────────────────────
// CHECKPOINT MANAGEMENT
// ─────────────────────────────────────────────

async function getRoundAndHackathon(hackathonId: string, roundId: string, userId: string) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })
    if (!hackathon || hackathon.userId !== userId) return null
    const round = await prisma.round.findUnique({ where: { id: roundId } })
    if (!round || round.hackathonId !== hackathonId) return null
    return { hackathon, round }
}

export async function updateCheckpointTime(hackathonId: string, roundId: string, checkpointTime: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user.id)
    if (!ctx) return { error: "Access Denied" }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: new Date(checkpointTime), checkpointPausedAt: null }
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function extendCheckpoint(hackathonId: string, roundId: string, minutes: number) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user.id)
    if (!ctx) return { error: "Access Denied" }

    const { round } = ctx
    const addMs = minutes * 60 * 1000

    // If paused: extend the checkpoint time (pushes the freeze point forward)
    // If running: extend the deadline normally
    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: new Date(round.checkpointTime.getTime() + addMs) }
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function pauseCheckpoint(hackathonId: string, roundId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user.id)
    if (!ctx) return { error: "Access Denied" }
    if (ctx.round.checkpointPausedAt) return { error: "Already paused" }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointPausedAt: new Date() }
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function resumeCheckpoint(hackathonId: string, roundId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user.id)
    if (!ctx) return { error: "Access Denied" }

    const { round } = ctx
    if (!round.checkpointPausedAt) return { error: "Not paused" }

    // How long was it paused?
    const pausedDurationMs = Date.now() - round.checkpointPausedAt.getTime()
    // Extend checkpoint by that duration so remaining time is preserved
    const newCheckpointTime = new Date(round.checkpointTime.getTime() + pausedDurationMs)

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: newCheckpointTime, checkpointPausedAt: null }
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}
