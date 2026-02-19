"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
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

    try {
        await prisma.round.create({
            data: {
                hackathonId,
                name: validated.data.name,
                order: validated.data.order,
                weight: validated.data.weight,
                checkpointTime: new Date(Date.now() + 86400000) // Default 24h from now
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

    await prisma.round.delete({ where: { id: roundId } })
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

    await prisma.criterion.delete({ where: { id: criterionId } })
    revalidatePath(`/h/${hackathon.slug}/manage/rounds`)
    return { success: true }
}
