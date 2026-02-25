/**
 * Server-side emit utility.
 * Calls the Socket.IO server's internal /emit HTTP endpoint.
 */

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3001"
const EMIT_SECRET = process.env.EMIT_SECRET

async function socketEmit(room: string, event: string, data?: Record<string, unknown>) {
    const res = await fetch(`${SOCKET_SERVER_URL}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-emit-secret": EMIT_SECRET || "",
        },
        body: JSON.stringify({ room, event, data }),
    })
    if (!res.ok) throw new Error(`Socket emit failed: ${res.status}`)
}

export function emitScoreUpdated(hackathonId: string, teamId: string) {
    return socketEmit(`hackathon:${hackathonId}`, "score-updated", { teamId })
}

export async function emitFreeze(hackathonId: string, frozen: boolean) {
    const event = frozen ? "display:freeze" : "display:unfreeze"
    await Promise.all([
        socketEmit(`display:${hackathonId}`, event),
        socketEmit(`hackathon:${hackathonId}`, event),
    ])
}

export async function emitCheckpointUpdated(hackathonId: string) {
    await Promise.all([
        socketEmit(`display:${hackathonId}`, "checkpoint-updated"),
        socketEmit(`hackathon:${hackathonId}`, "checkpoint-updated"),
    ])
}

export async function emitTeamSubmitted(
    hackathonId: string,
    teamId: string,
    roundId: string,
    submittedAt: Date,
    timeBonus: number,
    teamName: string,
    roundName: string,
) {
    const data = {
        teamId,
        roundId,
        submittedAt: submittedAt.toISOString(),
        timeBonus,
        teamName,
        roundName,
    }
    await Promise.all([
        socketEmit(`hackathon:${hackathonId}`, "team-submitted", data),
        socketEmit(`display:${hackathonId}`, "team-submitted", data),
    ])
}

export function emitDisplayConfig(hackathonId: string, mode: string, problemId?: string | null) {
    return socketEmit(`display:${hackathonId}`, "display:set-scene", { mode, problemId: problemId ?? null })
}

export function emitProblemsReleased(hackathonId: string) {
    return socketEmit(`hackathon:${hackathonId}`, "problem-statements-released")
}

export function emitCeremonyStarted(hackathonId: string, mode: string, totalWinners: number) {
    return socketEmit(`display:${hackathonId}`, "display:ceremony-started", { mode, totalWinners })
}

export function emitCeremonyReveal(
    hackathonId: string,
    index: number,
    teamName: string,
    score: number,
    problemStatement?: string,
) {
    return socketEmit(`display:${hackathonId}`, "display:ceremony-reveal", { index, teamName, score, problemStatement })
}

export function emitJudgingProgress(hackathonId: string, teamId: string, roundId: string) {
    return socketEmit(`hackathon:${hackathonId}`, "judging-progress", { teamId, roundId })
}

export function emitParticipantCheckedIn(hackathonId: string, teamId: string, teamName: string) {
    return socketEmit(`hackathon:${hackathonId}`, "participant-checked-in", { teamId, teamName })
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
