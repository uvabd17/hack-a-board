"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"

const SubmissionSchema = z.object({
    teamId: z.string(),
    roundId: z.string(),
    githubUrl: z.string().url().optional().or(z.literal("")),
    demoUrl: z.string().url().optional().or(z.literal("")),
    presentationUrl: z.string().url().optional().or(z.literal("")),
    otherUrl: z.string().url().optional().or(z.literal("")),
})

export async function submitProject(data: z.infer<typeof SubmissionSchema>, slug: string) {
    const validated = SubmissionSchema.safeParse(data)
    if (!validated.success) return { error: "Invalid submission links" }

    const participantToken = (await cookies()).get("hackaboard_participant_token")?.value
    if (!participantToken) return { error: "Unauthorized" }

    // Verify the submitter is actually a participant on this team and slug
    const participant = await prisma.participant.findUnique({
        where: { qrToken: participantToken },
        select: { teamId: true, hackathonId: true, hackathon: { select: { slug: true } } }
    })
    if (!participant || participant.teamId !== data.teamId || participant.hackathon.slug !== slug) {
        return { error: "Unauthorized" }
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: data.teamId },
            select: { hackathonId: true }
        })
        const round = await prisma.round.findUnique({
            where: { id: data.roundId },
            include: { hackathon: true }
        })

        if (!team || !round) return { error: "Round not found" }
        if (team.hackathonId !== participant.hackathonId || round.hackathonId !== participant.hackathonId) {
            return { error: "Data Mismatch" }
        }

        const submittedAt = new Date()

        // Calculate Time Bonus/Penalty
        // Bonus = (Checkpoint - Submitted) * Rate
        // If Submitted > Checkpoint, it becomes negative (penalty)
        // CheckpointTime is a DateTime in the DB.

        const diffInMs = round.checkpointTime.getTime() - submittedAt.getTime()
        const diffInMinutes = diffInMs / (1000 * 60)

        let timeBonus = 0
        if (diffInMinutes > 0) {
            // Early submission: Bonus
            timeBonus = Math.floor(diffInMinutes * round.hackathon.timeBonusRate)
        } else {
            // Late submission: Penalty (diff is negative)
            // Example: 10 mins late -> diff = -10. Penalty = -10 * penaltyRate.
            timeBonus = Math.floor(diffInMinutes * round.hackathon.timePenaltyRate)
        }

        await prisma.submission.upsert({
            where: {
                teamId_roundId: {
                    teamId: data.teamId,
                    roundId: data.roundId
                }
            },
            update: {
                githubUrl: data.githubUrl || null,
                demoUrl: data.demoUrl || null,
                presentationUrl: data.presentationUrl || null,
                otherUrl: data.otherUrl || null,
                submittedAt,
                timeBonus
            },
            create: {
                teamId: data.teamId,
                roundId: data.roundId,
                githubUrl: data.githubUrl || null,
                demoUrl: data.demoUrl || null,
                presentationUrl: data.presentationUrl || null,
                otherUrl: data.otherUrl || null,
                submittedAt,
                timeBonus
            }
        })

        revalidatePath(`/h/${slug}/dashboard`)
        return { success: true, timeBonus }
    } catch (e) {
        console.error(e)
        return { error: "Failed to submit project" }
    }
}
