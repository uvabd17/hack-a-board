"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { connectSocket, disconnectSocket } from "@/lib/socket-client"

/**
 * Invisible client component that joins the hackathon socket room
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

        return () => {
            socket.off("score-updated", refresh)
            socket.off("problem-statements-released", refresh)
            socket.off("checkpoint-updated", refresh)
            socket.off("display:freeze", refresh)
            socket.off("display:unfreeze", refresh)
            disconnectSocket()
        }
    }, [hackathonId, router])

    return null
}
