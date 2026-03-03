"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"

/**
 * Invisible client component that subscribes to the hackathon channel
 * and calls router.refresh() whenever scores or other leaderboard-
 * affecting events fire — causing the parent Server Component to
 * re-render with fresh data from the database.
 */
export function LiveRefresher({ hackathonId }: { hackathonId: string }) {
    const router = useRouter()

    useEffect(() => {
        if (!hackathonId) return
        const socket = connectSocket(hackathonId, ["hackathon"])
        const refresh = () => router.refresh()
        socket.on("score-updated", refresh)
        socket.on("problem-statements-released", refresh)
        socket.on("checkpoint-updated", refresh)
        socket.on("display:freeze", refresh)
        socket.on("display:unfreeze", refresh)
        socket.on("display:set-scene", refresh)
        socket.on("team-submitted", refresh)
        socket.on("judging-progress", refresh)
        socket.on("participant-checked-in", refresh)
        return () => {
            socket.off("score-updated", refresh)
            socket.off("problem-statements-released", refresh)
            socket.off("checkpoint-updated", refresh)
            socket.off("display:freeze", refresh)
            socket.off("display:unfreeze", refresh)
            socket.off("display:set-scene", refresh)
            socket.off("team-submitted", refresh)
            socket.off("judging-progress", refresh)
            socket.off("participant-checked-in", refresh)
            disconnectSocket()
        }
    }, [hackathonId, router])

    return null
}
