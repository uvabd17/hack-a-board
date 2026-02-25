"use client"

import { useState, useEffect } from "react"
import { JudgingProgress } from "@/components/judging-progress"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"
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

type JudgingProgressJudge = { judgeId: string; timestamp: Date; judgeName: string }

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

    useEffect(() => {
        if (!hackathonId) return
        const socket = connectSocket(hackathonId, ["hackathon"])
        const handleUpdate = async (payload: { teamId: string; roundId: string }) => {
            if (payload.teamId !== teamId || payload.roundId !== roundId) return
            const progressData = await getTeamJudgingProgress(teamId, roundId)
            if (progressData && "submitted" in progressData) {
                setRequiredJudges(progressData.requiredJudges)
                setJudgeCount(progressData.judgeCount)
                setSubmitted(progressData.submitted)
                setTimeBonus(progressData.timeBonus ?? undefined)
                setJudges((progressData.judges || []).map((j: JudgingProgressJudge) => ({
                    name: j.judgeName,
                    timestamp: j.timestamp,
                })))
            }
        }
        socket.on("team-submitted", handleUpdate)
        socket.on("judging-progress", handleUpdate)
        return () => {
            socket.off("team-submitted", handleUpdate)
            socket.off("judging-progress", handleUpdate)
            disconnectSocket()
        }
    }, [hackathonId, teamId, roundId])

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
