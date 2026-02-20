"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { emitScoreUpdated } from "@/lib/socket-emit"

const ScoreSubmissionSchema = z.object({
    hackathonId: z.string(),
    teamId: z.string(),
    roundId: z.string(),
    scores: z.record(z.string(), z.number().min(1).max(5)) // CriterionID -> Score (1-5 per spec)
})

export async function submitScore(data: {
    hackathonId: string,
    teamId: string,
    roundId: string,
    scores: Record<string, number>
}) {
    // Validate schema — enforces score range 1-5 server-side
    const parsed = ScoreSubmissionSchema.safeParse(data)
    if (!parsed.success) return { error: "Invalid score data: " + parsed.error.issues[0].message }

    const cookieStore = await cookies()
    const token = cookieStore.get("hackaboard_judge_token")?.value

    if (!token) return { error: "Unauthorized" }

    const judge = await prisma.judge.findUnique({
        where: { token },
        select: { id: true, hackathonId: true, isActive: true }
    })

    if (!judge || !judge.isActive || judge.hackathonId !== data.hackathonId) {
        return { error: "Invalid Judge Session" }
    }

    // Validate Team & Round belong to hackathon
    const team = await prisma.team.findUnique({ where: { id: data.teamId } })
    const round = await prisma.round.findUnique({
        where: { id: data.roundId },
        include: { criteria: { select: { id: true } } }
    })

    if (team?.hackathonId !== data.hackathonId || round?.hackathonId !== data.hackathonId) {
        return { error: "Data Mismatch" }
    }

    // Verify all submitted criterion IDs belong to this round (prevent cross-round score injection)
    const validCriterionIds = new Set(round.criteria.map(c => c.id))
    const submittedIds = Object.keys(data.scores)
    if (submittedIds.some(id => !validCriterionIds.has(id))) {
        return { error: "Invalid criterion IDs" }
    }

    // Transactional Write
    try {
        await prisma.$transaction(
            Object.entries(data.scores).map(([criterionId, value]) => {
                return prisma.score.upsert({
                    where: {
                        judgeId_teamId_roundId_criterionId: {
                            judgeId: judge.id,
                            teamId: data.teamId,
                            roundId: data.roundId,
                            criterionId
                        }
                    },
                    update: { value },
                    create: {
                        judgeId: judge.id,
                        teamId: data.teamId,
                        roundId: data.roundId,
                        criterionId,
                        value
                    }
                })
            })
        )

        revalidatePath(`/h/${judge.hackathonId}/judge`)
        // Emit real-time event (non-fatal if socket server is down)
        await emitScoreUpdated(data.hackathonId, data.teamId)
        return { success: true }
    } catch (e) {
        console.error("Scoring Error", e)
        return { error: "Failed to save scores." }
    }
}
