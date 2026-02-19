"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateHackathonStatus } from "@/actions/organizer"
import { Button } from "@/components/ui/button"
import { Rocket, Play, Square, Undo2 } from "lucide-react"

const TRANSITIONS: Record<string, { label: string; next: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline"; confirm: string }[]> = {
    draft: [
        {
            label: "PUBLISH",
            next: "published",
            icon: <Rocket size={14} />,
            variant: "default",
            confirm: "Publish this hackathon? It will become visible to participants.",
        },
    ],
    published: [
        {
            label: "BACK_TO_DRAFT",
            next: "draft",
            icon: <Undo2 size={14} />,
            variant: "outline",
            confirm: "Revert to draft? The hackathon will no longer be publicly visible.",
        },
        {
            label: "GO_LIVE",
            next: "live",
            icon: <Play size={14} />,
            variant: "default",
            confirm: "Start the hackathon? This begins the live event clock.",
        },
    ],
    live: [
        {
            label: "END_EVENT",
            next: "ended",
            icon: <Square size={14} />,
            variant: "destructive",
            confirm: "End the hackathon? No more submissions will be accepted after this.",
        },
    ],
    ended: [],
}

export function LifecycleControls({
    hackathonId,
    status,
}: {
    hackathonId: string
    status: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const transitions = TRANSITIONS[status] || []

    if (transitions.length === 0) {
        return (
            <div className="border border-border bg-card/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        EVENT_{status.toUpperCase()} — No further transitions available
                    </p>
                </div>
            </div>
        )
    }

    async function handleTransition(next: string, confirmMsg: string) {
        if (!confirm(confirmMsg)) return
        setLoading(true)
        setError(null)

        const res = await updateHackathonStatus(hackathonId, next)
        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.refresh()
            setLoading(false)
        }
    }

    return (
        <div className="border border-border bg-card/50 p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${status === "live" ? "bg-green-500 animate-pulse" : status === "published" ? "bg-blue-500" : "bg-muted-foreground"}`} />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    EVENT_STATUS: {status.toUpperCase()}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {error && (
                    <span className="text-xs text-destructive mr-2">{error}</span>
                )}
                {transitions.map(t => (
                    <Button
                        key={t.next}
                        variant={t.variant}
                        size="sm"
                        className="gap-2 uppercase text-xs"
                        disabled={loading}
                        onClick={() => handleTransition(t.next, t.confirm)}
                    >
                        {t.icon}
                        {loading ? "PROCESSING..." : t.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
