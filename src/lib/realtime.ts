import { Realtime, type InferRealtimeEvents } from "@upstash/realtime"
import { redis } from "./redis"
import z from "zod/v4"

// ─────────────────────────────────────────────────────────────────
// Event schema — typed events for all hackathon realtime events
//
// Channels used:
//   hackathon:<id>  →  participant-facing events
//   display:<id>    →  projector/display-facing events
// ─────────────────────────────────────────────────────────────────
const schema = {
    // Participant + display channels
    scoreUpdated: z.object({ teamId: z.string() }),
    checkpointUpdated: z.object({}),
    displayFreeze: z.object({}),
    displayUnfreeze: z.object({}),
    teamSubmitted: z.object({
        teamId: z.string(),
        roundId: z.string(),
        submittedAt: z.string(), // ISO string after JSON serialization
        timeBonus: z.number(),
        teamName: z.string(),
        roundName: z.string(),
    }),

    // Participant channel only
    problemsReleased: z.object({}),
    judgingProgress: z.object({ teamId: z.string(), roundId: z.string() }),
    participantCheckedIn: z.object({ teamId: z.string(), teamName: z.string() }),

    // Display channel only
    displaySetScene: z.object({
        mode: z.string(),
        problemId: z.string().nullish(),
    }),
    displayCeremonyStarted: z.object({
        mode: z.string(),
        totalWinners: z.number(),
    }),
    displayCeremonyReveal: z.object({
        index: z.number(),
        teamName: z.string(),
        score: z.number(),
        problemStatement: z.string().optional(),
    }),
}

export const realtime = new Realtime({ schema, redis })
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
