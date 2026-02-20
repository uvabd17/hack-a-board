/**
 * Server-side socket emit utility.
 * Called from Next.js server actions to broadcast real-time events
 * via the standalone Socket.IO server.
 */

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:3001"
const EMIT_SECRET = process.env.EMIT_SECRET

type EmitPayload = {
    room: string
    event: string
    data?: unknown
}

export async function socketEmit({ room, event, data }: EmitPayload): Promise<void> {
    if (!process.env.SOCKET_SERVER_URL && process.env.NODE_ENV === "production") {
        console.warn("[socketEmit] SOCKET_SERVER_URL not set — skipping emit")
        return
    }
    if (!EMIT_SECRET) {
        console.warn("[socketEmit] EMIT_SECRET not set — skipping emit")
        return
    }
    try {
        const res = await fetch(`${SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-emit-secret": EMIT_SECRET,
            },
            body: JSON.stringify({ room, event, data }),
        })
        if (!res.ok) {
            console.warn("[socketEmit] Emit failed:", event, res.status)
        }
    } catch (err) {
        // Non-fatal — real-time update missed, polling will catch up
        console.warn("[socketEmit] Failed to emit:", event, err)
    }
}

// ──────────────────────────────────────────────
// Convenience helpers per event type
// ──────────────────────────────────────────────

export function emitScoreUpdated(hackathonId: string, teamId: string) {
    return socketEmit({
        room: `hackathon:${hackathonId}`,
        event: "score-updated",
        data: { teamId },
    })
}

export function emitFreeze(hackathonId: string, frozen: boolean) {
    return socketEmit({
        room: `display:${hackathonId}`,
        event: frozen ? "display:freeze" : "display:unfreeze",
        data: {},
    })
}

export function emitCheckpointUpdated(hackathonId: string) {
    return socketEmit({
        room: `display:${hackathonId}`,
        event: "checkpoint-updated",
        data: {},
    })
}

export function emitDisplayConfig(hackathonId: string, mode: string, problemId?: string | null) {
    return socketEmit({
        room: `display:${hackathonId}`,
        event: "display:set-scene",
        data: { mode, problemId },
    })
}

export function emitProblemsReleased(hackathonId: string) {
    return socketEmit({
        room: `hackathon:${hackathonId}`,
        event: "problem-statements-released",
        data: {},
    })
}

export function emitCeremonyStarted(hackathonId: string, mode: string, totalWinners: number) {
    return socketEmit({
        room: `display:${hackathonId}`,
        event: "display:ceremony-started",
        data: { mode, totalWinners },
    })
}

export function emitCeremonyReveal(
    hackathonId: string,
    index: number,
    teamName: string,
    score: number,
    problemStatement?: string
) {
    return socketEmit({
        room: `display:${hackathonId}`,
        event: "display:ceremony-reveal",
        data: { index, teamName, score, problemStatement },
    })
}

export function emitParticipantCheckedIn(hackathonId: string, teamId: string, teamName: string) {
    return socketEmit({
        room: `hackathon:${hackathonId}`,
        event: "participant-checked-in",
        data: { teamId, teamName },
    })
}
