"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { emitProblemsReleased } from "@/lib/socket-emit"

const ProblemSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    slug: z.string().min(2), // e.g. "fintech"
    icon: z.string().optional(),
})

export async function createProblemStatement(hackathonId: string, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    // Verify ownership
    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        slug: formData.get("slug"),
        icon: formData.get("icon"),
    }

    const validated = ProblemSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: "Invalid data: " + validated.error.issues.map(e => e.message).join(", ") }
    }

    try {
        await prisma.problemStatement.create({
            data: {
                hackathonId,
                title: validated.data.title,
                description: validated.data.description,
                slug: validated.data.slug,
                icon: validated.data.icon || null,
                isReleased: false,
            }
        })

        revalidatePath(`/h/${hackathon.slug}/manage/problems`)
        revalidatePath(`/h/${hackathon.slug}`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to create problem statement. Slug might be taken." }
    }
}

export async function toggleProblemRelease(hackathonId: string, problemId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const problem = await prisma.problemStatement.findUnique({ where: { id: problemId } })
    if (!problem) return { error: "Problem not found" }

    await prisma.problemStatement.update({
        where: { id: problemId },
        data: {
            isReleased: !problem.isReleased,
            releasedAt: !problem.isReleased ? new Date() : null
        }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/problems`)
    revalidatePath(`/h/${hackathon.slug}`)
    if (!problem.isReleased) {
        // Just released — broadcast to participants
        await emitProblemsReleased(hackathonId)
    }
    return { success: true }
}

export async function deleteProblemStatement(hackathonId: string, problemId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    await prisma.problemStatement.delete({
        where: { id: problemId }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/problems`)
    revalidatePath(`/h/${hackathon.slug}`)
    return { success: true }
}
export async function selectTeamProblem(teamId: string, problemId: string, slug: string) {
    try {
        await prisma.team.update({
            where: { id: teamId },
            data: {
                problemStatementId: problemId,
                selectedAt: new Date()
            }
        })

        revalidatePath(`/h/${slug}/dashboard`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Failed to select problem statement" }
    }
}

export async function releaseAllProblems(hackathonId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { userId: true, slug: true }
    })

    if (!hackathon || hackathon.userId !== session.user.id) {
        return { error: "Access Denied" }
    }

    const result = await prisma.problemStatement.updateMany({
        where: { hackathonId, isReleased: false },
        data: {
            isReleased: true,
            releasedAt: new Date(),
        }
    })

    revalidatePath(`/h/${hackathon.slug}/manage/problems`)
    revalidatePath(`/h/${hackathon.slug}`)

    if (result.count > 0) {
        await emitProblemsReleased(hackathonId)
    }

    return { success: true, count: result.count }
}
