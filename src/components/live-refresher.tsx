"use client"

import { useRouter } from "next/navigation"
import { useRealtime } from "@/lib/realtime-client"

/**
 * Invisible client component that subscribes to the hackathon channel
 * and calls router.refresh() whenever scores or other leaderboard-
 * affecting events fire — causing the parent Server Component to
 * re-render with fresh data from the database.
 */
export function LiveRefresher({ hackathonId }: { hackathonId: string }) {
    const router = useRouter()

    useRealtime({
        events: ["scoreUpdated", "problemsReleased", "checkpointUpdated", "displayFreeze", "displayUnfreeze"],
        channels: [`hackathon:${hackathonId}`],
        enabled: !!hackathonId,
        onData: () => router.refresh(),
    })

    return null
}
