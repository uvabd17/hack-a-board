"use client"

import { useState } from "react"
import { toggleFreeze } from "@/actions/leaderboard"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Loader2 } from "lucide-react"

export function FreezeToggle({
    hackathonId,
    initialState
}: {
    hackathonId: string,
    initialState: boolean
}) {
    const [isFrozen, setIsFrozen] = useState(initialState)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        const newState = !isFrozen
        const res = await toggleFreeze(hackathonId, isFrozen)

        if (res.success) {
            setIsFrozen(newState)
        }
        setLoading(false)
    }

    return (
        <Button
            onClick={handleToggle}
            disabled={loading}
            variant={isFrozen ? "destructive" : "outline"}
            className={`w-full justify-start gap-2 ${isFrozen ? "" : "border-green-500 text-green-500 hover:bg-green-900/20"}`}
        >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                isFrozen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />
            )}
            {isFrozen ? "FROZEN (HIDDEN)" : "LIVE (VISIBLE)"}
        </Button>
    )
}
