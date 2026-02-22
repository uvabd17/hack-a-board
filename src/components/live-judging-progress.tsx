"use client"

import { useState, useEffect } from "react"
import { JudgingProgress } from "@/components/judging-progress"
import { connectSocket } from "@/lib/socket-client"
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

    useEffect(() => {
        const socket = connectSocket(hackathonId, ["hackathon"])
        socket.emit("join:hackathon", hackathonId)

        // Listen for team-submitted events (when judging completes)
        socket.on("team-submitted", async (payload: { teamId: string; roundId: string }) => {
            // Check if this event is for our team and round
            if (payload.teamId === teamId && payload.roundId === roundId) {
                // Fetch updated progress data
                const progressData = await getTeamJudgingProgress(teamId, roundId)
                if (progressData && 'submitted' in progressData) {
                    setRequiredJudges(progressData.requiredJudges)
                    setJudgeCount(progressData.judgeCount)
                    setSubmitted(progressData.submitted)
                    setTimeBonus(progressData.timeBonus ?? undefined)
                    setJudges((progressData.judges || []).map((j: any) => ({ 
                        name: j.judgeName, 
                        timestamp: j.timestamp 
                    })))
                }
            }
        })

        // Listen for judging-progress events (when individual judges score)
        socket.on("judging-progress", async (payload: { teamId: string; roundId: string }) => {
            // Check if this event is for our team and round
            if (payload.teamId === teamId && payload.roundId === roundId) {
                // Fetch updated progress data
                const progressData = await getTeamJudgingProgress(teamId, roundId)
                if (progressData && 'submitted' in progressData) {
                    setRequiredJudges(progressData.requiredJudges)
                    setJudgeCount(progressData.judgeCount)
                    setSubmitted(progressData.submitted)
                    setTimeBonus(progressData.timeBonus ?? undefined)
                    setJudges((progressData.judges || []).map((j: any) => ({ 
                        name: j.judgeName, 
                        timestamp: j.timestamp 
                    })))
                }
            }
        })

        return () => {
            socket.off("team-submitted")
            socket.off("judging-progress")
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
