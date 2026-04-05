"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { emitCheckpointUpdated } from "@/lib/socket-emit"
import { z } from "zod"
import { canManageHackathon } from "@/lib/access-control"
import { parseDateTimeLocalWithOffset } from "@/lib/datetime"

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
        select: { userId: true, organizerEmails: true, slug: true, startDate: true, endDate: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
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

    const checkpointRaw = String(formData.get("checkpointTime") || "")
    const offsetMinutesRaw = formData.get("clientTimezoneOffsetMinutes")
    const offsetMinutes = typeof offsetMinutesRaw === "string" ? Number(offsetMinutesRaw) : undefined
    const checkpointTime = checkpointRaw
        ? parseDateTimeLocalWithOffset(checkpointRaw, offsetMinutes)
        : new Date(Date.now() + 86400000) // Default 24h from now
    if (!checkpointTime) {
        return { error: "Invalid checkpoint time" }
    }
    if (checkpointTime < hackathon.startDate || checkpointTime > hackathon.endDate) {
        return { error: "Checkpoint time must be within the event window" }
    }

    const requiredJudges = parseInt(formData.get("requiredJudges") as string) || 1
    const requiresLinkSubmission = formData.get("requiresLinkSubmission") === "on"

    try {
        await prisma.round.create({
            data: {
                hackathonId,
                name: validated.data.name,
                order: validated.data.order,
                weight: validated.data.weight,
                checkpointTime,
                requiredJudges,
                requiresLinkSubmission,
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
        select: { userId: true, organizerEmails: true, slug: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
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
        select: { userId: true, organizerEmails: true, slug: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
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

    // Check if criteria weights sum to 100% and warn if not
    const allCriteria = await prisma.criterion.findMany({
        where: { roundId },
        select: { weight: true }
    })
    const totalWeight = allCriteria.reduce((sum, c) => sum + c.weight, 0)

    revalidatePath(`/h/${hackathon.slug}/manage/rounds`)

    if (totalWeight !== 100) {
        return { success: true, warning: `Criteria weights sum to ${totalWeight}%, not 100%. Scores may be skewed.` }
    }
    return { success: true }
}

export async function deleteCriterion(hackathonId: string, criterionId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, organizerEmails: true, slug: true }
    })

    if (!hackathon || !canManageHackathon(hackathon, session.user)) {
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

async function getRoundAndHackathon(hackathonId: string, roundId: string, user: { id?: string | null; email?: string | null }) {
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, organizerEmails: true, slug: true, startDate: true, endDate: true }
    })
    if (!hackathon || !canManageHackathon(hackathon, user)) return null
    const round = await prisma.round.findUnique({ where: { id: roundId } })
    if (!round || round.hackathonId !== hackathonId) return null
    return { hackathon, round }
}

export async function updateCheckpointTime(
    hackathonId: string,
    roundId: string,
    checkpointTime: string,
    clientTimezoneOffsetMinutes?: number
) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user)
    if (!ctx) return { error: "Access Denied" }

    const parsedCheckpoint = parseDateTimeLocalWithOffset(checkpointTime, clientTimezoneOffsetMinutes)
    if (!parsedCheckpoint) return { error: "Invalid checkpoint time" }
    if (parsedCheckpoint < ctx.hackathon.startDate || parsedCheckpoint > ctx.hackathon.endDate) {
        return { error: "Checkpoint must be within event start/end time" }
    }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: parsedCheckpoint, checkpointPausedAt: null }
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function extendCheckpoint(hackathonId: string, roundId: string, minutes: number) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user)
    if (!ctx) return { error: "Access Denied" }

    const { round } = ctx
    const addMs = minutes * 60 * 1000

    // If paused: extend the checkpoint time (pushes the freeze point forward)
    // If running: extend the deadline normally
    const updatedCheckpoint = new Date(round.checkpointTime.getTime() + addMs)
    if (updatedCheckpoint > ctx.hackathon.endDate) {
        return { error: "Checkpoint cannot exceed event end time" }
    }
    if (updatedCheckpoint < ctx.hackathon.startDate) {
        return { error: "Checkpoint cannot be before event start time" }
    }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: updatedCheckpoint }
    })
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function pauseCheckpoint(hackathonId: string, roundId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user)
    if (!ctx) return { error: "Access Denied" }
    if (ctx.round.checkpointPausedAt) return { error: "Already paused" }
    if (ctx.round.checkpointTime.getTime() <= Date.now()) return { error: "Checkpoint already ended" }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointPausedAt: new Date() }
    })
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function resumeCheckpoint(hackathonId: string, roundId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user)
    if (!ctx) return { error: "Access Denied" }

    const { round } = ctx
    if (!round.checkpointPausedAt) return { error: "Not paused" }

    // Calculate remaining time when it was paused
    const remainingMsWhenPaused = round.checkpointTime.getTime() - round.checkpointPausedAt.getTime()
    if (remainingMsWhenPaused <= 0) return { error: "Checkpoint already ended" }
    // Set new checkpoint to now + remaining time
    const newCheckpointTime = new Date(Date.now() + remainingMsWhenPaused)
    if (newCheckpointTime > ctx.hackathon.endDate) {
        return { error: "Resumed checkpoint exceeds event end time" }
    }

    await prisma.round.update({
        where: { id: roundId },
        data: { checkpointTime: newCheckpointTime, checkpointPausedAt: null }
    })
    await emitCheckpointUpdated(hackathonId)
    return { success: true }
}

export async function updateRoundSettings(hackathonId: string, roundId: string, settings: { requiredJudges?: number; requiresLinkSubmission?: boolean }) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const ctx = await getRoundAndHackathon(hackathonId, roundId, session.user)
    if (!ctx) return { error: "Access Denied" }

    const updateData: { requiredJudges?: number; requiresLinkSubmission?: boolean } = {}
    if (typeof settings.requiredJudges === 'number') {
        if (settings.requiredJudges < 1 || settings.requiredJudges > 10) {
            return { error: "Required judges must be between 1 and 10" }
        }
        updateData.requiredJudges = settings.requiredJudges
    }
    if (typeof settings.requiresLinkSubmission === 'boolean') {
        updateData.requiresLinkSubmission = settings.requiresLinkSubmission
    }

    await prisma.round.update({
        where: { id: roundId },
        data: updateData
    })
    revalidatePath(`/h/${ctx.hackathon.slug}/manage/rounds`)
    return { success: true }
}
