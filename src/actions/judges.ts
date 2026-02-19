"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import crypto from "crypto"

const JudgeSchema = z.object({
    name: z.string().min(2),
})

export async function createJudge(hackathonId: string, formData: FormData) {
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
    const validated = JudgeSchema.safeParse({ name })

    if (!validated.success) {
        return { error: "Invalid name" }
    }

    // Generate secure random token
    const token = crypto.randomBytes(16).toString("hex")

    try {
        await prisma.judge.create({
            data: {
                hackathonId,
                name: validated.data.name,
                token,
                isActive: true
            }
        })

        revalidatePath(`/h/${hackathon.slug}/manage/judges`)
        return { success: true }
    } catch (e) {
        return { error: "Failed to create judge" }
    }
}

export async function deleteJudge(hackathonId: string, judgeId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    await prisma.judge.delete({ where: { id: judgeId } })
    revalidatePath(`/h/${hackathon.slug}/manage/judges`)
    return { success: true }
}

export async function toggleJudgeStatus(hackathonId: string, judgeId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const judge = await prisma.judge.findUnique({ where: { id: judgeId } })
    if (!judge) return { error: "Judge not found" }

    await prisma.judge.update({
        where: { id: judgeId },
        data: { isActive: !judge.isActive }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/judges`)
    return { success: true }
}
