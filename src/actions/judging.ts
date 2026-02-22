"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { emitTeamSubmitted } from "@/lib/socket-emit"

/**
 * Record when a judge scans a team's QR code (starts judging session)
 * This is for grace period tracking - if deadline passes mid-pitch, we use scan time
 */
export async function recordJudgingAttempt(
    judgeToken: string,
    teamQRToken: string,
    roundId: string
) {
    try {
        // Validate judge
        const judge = await prisma.judge.findUnique({
            where: { token: judgeToken },
            select: { id: true, hackathonId: true, isActive: true }
        })

        if (!judge || !judge.isActive) {
            return { error: "Invalid or inactive judge" }
        }

        // Find team by QR token
        const participant = await prisma.participant.findUnique({
            where: { qrToken: teamQRToken },
            select: { teamId: true, hackathonId: true }
        })

        if (!participant || participant.hackathonId !== judge.hackathonId) {
            return { error: "Team not found or not in this hackathon" }
        }

        // Verify round belongs to this hackathon
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            select: { hackathonId: true }
        })

        if (!round || round.hackathonId !== judge.hackathonId) {
            return { error: "Invalid round" }
        }

        // Check if attempt already exists
        const existing = await prisma.judgingAttempt.findFirst({
            where: {
                judgeId: judge.id,
                teamId: participant.teamId,
                roundId
            }
        })

        if (existing) {
            // Update scanned time (in case judge rescans)
            await prisma.judgingAttempt.update({
                where: { id: existing.id },
                data: { scannedAt: new Date() }
            })
        } else {
            // Create new attempt
            await prisma.judgingAttempt.create({
                data: {
                    judgeId: judge.id,
                    teamId: participant.teamId,
                    roundId,
                    scannedAt: new Date()
                }
            })
        }

        return { success: true, teamId: participant.teamId }
    } catch (error) {
        console.error("Error recording judging attempt:", error)
        return { error: "Failed to record judging attempt" }
    }
}

/**
 * Check if team has met submission requirements for a round
 * Returns submission status and calculates time bonus if newly submitted
 */
export async function checkSubmissionStatus(teamId: string, roundId: string) {
    try {
        // Get round configuration
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            include: {
                criteria: true,
                hackathon: {
                    select: {
                        id: true,
                        timeBonusRate: true,
                        timePenaltyRate: true
                    }
                }
            }
        })

        if (!round) {
            return { error: "Round not found" }
        }

        // Get all scores for this team in this round
        const scores = await prisma.score.findMany({
            where: { teamId, roundId },
            include: { judge: true },
            orderBy: { createdAt: "asc" }
        })

        if (scores.length === 0) {
            return {
                submitted: false,
                judgeCount: 0,
                requiredJudges: round.requiredJudges,
                progress: `0/${round.requiredJudges} judges`
            }
        }

        // Group scores by judge
        const judgeScoresMap = new Map<string, typeof scores>()
        scores.forEach(score => {
            const existing = judgeScoresMap.get(score.judgeId) || []
            judgeScoresMap.set(score.judgeId, [...existing, score])
        })

        // Find judges who scored ALL criteria
        const completeJudges: Array<{ judgeId: string; timestamp: Date; judgeName: string }> = []

        for (const [judgeId, judgeScores] of judgeScoresMap.entries()) {
            if (judgeScores.length === round.criteria.length) {
                // This judge completed all criteria
                const latestScore = judgeScores.reduce((latest, score) =>
                    score.createdAt > latest.createdAt ? score : latest
                )
                completeJudges.push({
                    judgeId,
                    timestamp: latestScore.createdAt,
                    judgeName: latestScore.judge.name
                })
            }
        }

        // Sort by timestamp
        completeJudges.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        const judgeCount = completeJudges.length

        // Check if submission requirement is met
        if (judgeCount >= round.requiredJudges) {
            // Nth judge's timestamp is the submission time
            const submissionTime = completeJudges[round.requiredJudges - 1].timestamp

            // Check if we already have a submission record
            const existingSubmission = await prisma.submission.findUnique({
                where: {
                    teamId_roundId: { teamId, roundId }
                }
            })

            // If no submission exists, this is a NEW submission
            if (!existingSubmission) {
                // Calculate time bonus/penalty
                const { timeBonus, diffMinutes } = calculateTimeBonus(
                    submissionTime,
                    round.checkpointTime,
                    round.checkpointPausedAt,
                    round.hackathon.timeBonusRate,
                    round.hackathon.timePenaltyRate
                )

                return {
                    submitted: true,
                    newSubmission: true,
                    submittedAt: submissionTime,
                    timeBonus,
                    diffMinutes,
                    judgeCount,
                    requiredJudges: round.requiredJudges,
                    judges: completeJudges,
                    hackathonId: round.hackathon.id
                }
            }

            // Submission already exists
            return {
                submitted: true,
                newSubmission: false,
                submittedAt: existingSubmission.submittedAt,
                timeBonus: existingSubmission.timeBonus,
                judgeCount,
                requiredJudges: round.requiredJudges,
                judges: completeJudges
            }
        }

        // Not enough judges yet
        return {
            submitted: false,
            judgeCount,
            requiredJudges: round.requiredJudges,
            progress: `${judgeCount}/${round.requiredJudges} judges`,
            judges: completeJudges
        }
    } catch (error) {
        console.error("Error checking submission status:", error)
        return { error: "Failed to check submission status" }
    }
}

/**
 * Calculate time bonus/penalty based on submission time vs checkpoint
 */
function calculateTimeBonus(
    submittedAt: Date,
    checkpointTime: Date,
    checkpointPausedAt: Date | null,
    bonusRate: number,
    penaltyRate: number
): { timeBonus: number; diffMinutes: number } {
    // If checkpoint is paused, use the paused time as the effective deadline
    const effectiveDeadline = checkpointPausedAt || checkpointTime

    // Calculate time difference in milliseconds
    const diffMs = effectiveDeadline.getTime() - submittedAt.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    let timeBonus = 0

    if (diffMinutes > 0) {
        // Early submission - positive bonus
        timeBonus = diffMinutes * bonusRate
    } else if (diffMinutes < 0) {
        // Late submission - negative penalty
        timeBonus = diffMinutes * penaltyRate // diffMinutes is already negative
    }

    return { timeBonus, diffMinutes }
}

/**
 * Get team's judging progress for a specific round
 * Used in participant dashboard
 */
export async function getTeamJudgingProgress(teamId: string, roundId: string) {
    try {
        const result = await checkSubmissionStatus(teamId, roundId)

        if ('error' in result) {
            return { error: result.error }
        }

        return {
            success: true,
            ...result
        }
    } catch (error) {
        console.error("Error getting team judging progress:", error)
        return { error: "Failed to get judging progress" }
    }
}

/**
 * Create submission record with time bonus
 * Called after checkSubmissionStatus confirms new submission
 */
export async function createSubmission(
    teamId: string,
    roundId: string,
    submittedAt: Date,
    timeBonus: number
) {
    try {
        const submission = await prisma.submission.create({
            data: {
                teamId,
                roundId,
                submittedAt,
                timeBonus
            },
            include: {
                team: {
                    select: { name: true, hackathonId: true }
                },
                round: {
                    select: { name: true }
                }
            }
        })

        // Emit socket event for real-time leaderboard update
        await emitTeamSubmitted(submission.team.hackathonId, {
            teamId,
            roundId,
            submittedAt,
            timeBonus,
            teamName: submission.team.name,
            roundName: submission.round.name
        })

        return { success: true, submission }
    } catch (error) {
        console.error("Error creating submission:", error)
        return { error: "Failed to create submission" }
    }
}

/**
 * Check if judge can submit scores for a team (grace period logic)
 * Returns true if:
 * 1. Checkpoint hasn't passed yet, OR
 * 2. Judge scanned QR before checkpoint (grace period)
 */
export async function canJudgeScore(
    judgeId: string,
    teamId: string,
    roundId: string
): Promise<{ allowed: boolean; reason?: string }> {
    try {
        const round = await prisma.round.findUnique({
            where: { id: roundId },
            select: { checkpointTime: true, checkpointPausedAt: true }
        })

        if (!round) {
            return { allowed: false, reason: "Round not found" }
        }

        const now = new Date()
        const effectiveDeadline = round.checkpointPausedAt || round.checkpointTime

        // If deadline hasn't passed, allow scoring
        if (now <= effectiveDeadline) {
            return { allowed: true }
        }

        // Deadline has passed - check for grace period
        const  attempt = await prisma.judgingAttempt.findFirst({
            where: { judgeId, teamId, roundId },
            orderBy: { scannedAt: "desc" }
        })

        if (attempt && attempt.scannedAt <= effectiveDeadline) {
            // Judge scanned before deadline - grace period applies
            return { allowed: true, reason: "Grace period - judging started before deadline" }
        }

        return {
            allowed: false,
            reason: "Round closed and judging was not started before the deadline"
        }
    } catch (error) {
        console.error("Error checking if judge can score:", error)
        return { allowed: false, reason: "Error checking permissions" }
    }
}
