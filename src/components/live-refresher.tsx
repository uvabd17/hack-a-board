"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { connectSocket, disconnectSocket, subscribeSocketStatus } from "@/lib/socket-client"
import type { SocketConnectionState } from "@/lib/socket-client"

/**
 * Invisible client component that subscribes to the hackathon channel
 * and calls router.refresh() whenever scores or other leaderboard-
 * affecting events fire.
 *
 * Shows a connection status banner when disconnected for >10s.
 * Debounced to 1s to prevent rapid-fire refreshes on slow WiFi.
 */
export function LiveRefresher({ hackathonId }: { hackathonId: string }) {
    const router = useRouter()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [showOffline, setShowOffline] = useState(false)
    const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!hackathonId) return
        const socket = connectSocket(hackathonId, ["hackathon"])

        const refresh = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => {
                router.refresh()
            }, 1000)
        }

        // Track connection status — show banner after 10s offline
        const unsubStatus = subscribeSocketStatus((status: SocketConnectionState) => {
            if (status === "offline" || status === "reconnecting") {
                if (!offlineTimerRef.current) {
                    offlineTimerRef.current = setTimeout(() => setShowOffline(true), 10000)
                }
            } else {
                if (offlineTimerRef.current) {
                    clearTimeout(offlineTimerRef.current)
                    offlineTimerRef.current = null
                }
                setShowOffline(false)
            }
        })

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
            if (debounceRef.current) clearTimeout(debounceRef.current)
            if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
            unsubStatus()
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

    if (!showOffline) return null

    return (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs text-center py-2 px-4 rounded-lg mb-4">
            Connection lost — data may be outdated. Reconnecting...
        </div>
    )
}
