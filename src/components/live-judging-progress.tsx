"use client"

import { useState } from "react"
import { JudgingProgress } from "@/components/judging-progress"
import { useRealtime } from "@/lib/realtime-client"
import { getTeamJudgingProgress } from "@/actions/judging"

interface LiveJudgingProgressProps {
    roundName: string
    roundId: string
    teamId: string
    hackathonId: string
    checkpointTime: Date
    checkpointPausedAt: Date | null
    initialRequiredJudges: number
    initialJudgeCount: number
    initialSubmitted: boolean
    initialTimeBonus: number | null
    initialJudges: Array<{ judgeId: string; timestamp: Date; judgeName: string }>
}

export function LiveJudgingProgress({
    roundName,
    roundId,
    teamId,
    hackathonId,
    checkpointTime,
    checkpointPausedAt,
    initialRequiredJudges,
    initialJudgeCount,
    initialSubmitted,
    initialTimeBonus,
    initialJudges,
}: LiveJudgingProgressProps) {
    const [requiredJudges, setRequiredJudges] = useState(initialRequiredJudges)
    const [judgeCount, setJudgeCount] = useState(initialJudgeCount)
    const [submitted, setSubmitted] = useState(initialSubmitted)
    const [timeBonus, setTimeBonus] = useState(initialTimeBonus ?? undefined)
    const [judges, setJudges] = useState(
        initialJudges.map(j => ({ name: j.judgeName, timestamp: j.timestamp }))
    )

    useRealtime({
        events: ["teamSubmitted", "judgingProgress"],
        channels: [`hackathon:${hackathonId}`],
        enabled: !!hackathonId,
        onData: async ({ event, data: payload }) => {
            if (payload.teamId !== teamId || payload.roundId !== roundId) return
            const progressData = await getTeamJudgingProgress(teamId, roundId)
            if (progressData && "submitted" in progressData) {
                setRequiredJudges(progressData.requiredJudges)
                setJudgeCount(progressData.judgeCount)
                setSubmitted(progressData.submitted)
                setTimeBonus(progressData.timeBonus ?? undefined)
                setJudges((progressData.judges || []).map((j: any) => ({
                    name: j.judgeName,
                    timestamp: j.timestamp,
                })))
            }
        },
    })

    return (
        <JudgingProgress
            roundName={roundName}
            roundId={roundId}
            checkpointTime={checkpointTime}
            checkpointPausedAt={checkpointPausedAt}
            requiredJudges={requiredJudges}
            judgeCount={judgeCount}
            submitted={submitted}
            timeBonus={timeBonus}
            judges={judges}
        />
    )
}
