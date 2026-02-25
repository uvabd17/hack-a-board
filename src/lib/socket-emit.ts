/**
 * Server-side emit utility.
 * Uses @upstash/realtime to broadcast typed, real-time events.
 */
import { realtime } from "./realtime"

// ──────────────────────────────────────────────
// Typed emit helpers per event
// ──────────────────────────────────────────────

export function emitScoreUpdated(hackathonId: string, teamId: string) {
    return realtime.channel(`hackathon:${hackathonId}`).emit("scoreUpdated", { teamId })
}

export async function emitFreeze(hackathonId: string, frozen: boolean) {
    const event = frozen ? "displayFreeze" : "displayUnfreeze"
    await Promise.all([
        realtime.channel(`display:${hackathonId}`).emit(event, {}),
        realtime.channel(`hackathon:${hackathonId}`).emit(event, {}),
    ])
}

export async function emitCheckpointUpdated(hackathonId: string) {
    await Promise.all([
        realtime.channel(`display:${hackathonId}`).emit("checkpointUpdated", {}),
        realtime.channel(`hackathon:${hackathonId}`).emit("checkpointUpdated", {}),
    ])
}

export function emitDisplayConfig(hackathonId: string, mode: string, problemId?: string | null) {
    return realtime.channel(`display:${hackathonId}`).emit("displaySetScene", { mode, problemId: problemId ?? null })
}

export function emitProblemsReleased(hackathonId: string) {
    return realtime.channel(`hackathon:${hackathonId}`).emit("problemsReleased", {})
}

export function emitCeremonyStarted(hackathonId: string, mode: string, totalWinners: number) {
    return realtime.channel(`display:${hackathonId}`).emit("displayCeremonyStarted", { mode, totalWinners })
}

export function emitCeremonyReveal(
    hackathonId: string,
    index: number,
    teamName: string,
    score: number,
    problemStatement?: string,
) {
    return realtime.channel(`display:${hackathonId}`).emit("displayCeremonyReveal", { index, teamName, score, problemStatement })
}

export function emitParticipantCheckedIn(hackathonId: string, teamId: string, teamName: string) {
    return realtime.channel(`hackathon:${hackathonId}`).emit("participantCheckedIn", { teamId, teamName })
}

export async function emitTeamSubmitted(
    hackathonId: string,
    data: {
        teamId: string
        roundId: string
        submittedAt: Date
        timeBonus: number
        teamName: string
        roundName: string
    },
) {
    const payload = { ...data, submittedAt: data.submittedAt.toISOString() }
    await Promise.all([
        realtime.channel(`display:${hackathonId}`).emit("teamSubmitted", payload),
        realtime.channel(`hackathon:${hackathonId}`).emit("teamSubmitted", payload),
    ])
}

export function emitJudgingProgress(hackathonId: string, teamId: string, roundId: string) {
    return realtime.channel(`hackathon:${hackathonId}`).emit("judgingProgress", { teamId, roundId })
}
