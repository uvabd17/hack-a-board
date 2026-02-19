"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toggleFreeze } from "@/actions/display"
import { Loader2, Lock, Unlock } from "lucide-react"
// Actually, I'll skip toast for now or use standard alert if I don't have it.
// Checking package.json, I don't see sonner or toast manually installed, but shadcn might have it.
// To be safe, I'll use simple state message or standard alert for MVP speed, or I can try adding toast later.
// Let's stick to simple UI feedback.

export function DisplayController({
    hackathonId,
    initialIsFrozen,
    slug
}: {
    hackathonId: string,
    initialIsFrozen: boolean,
    slug: string
}) {
    const [isFrozen, setIsFrozen] = useState(initialIsFrozen)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async () => {
        setIsLoading(true)
        try {
            const newState = !isFrozen
            const result = await toggleFreeze(hackathonId, newState, slug)

            if (result.success) {
                setIsFrozen(newState)
            } else {
                alert("Failed to update freeze state")
            }
        } catch (error) {
            alert("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Leaderboard Freeze</span>
                        {isFrozen ? (
                            <Badge variant="destructive" className="flex gap-1 items-center">
                                <Lock className="w-3 h-3" /> Frozen
                            </Badge>
                        ) : (
                            <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/50 flex gap-1 items-center">
                                <Unlock className="w-3 h-3" /> Live
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        When frozen, the leaderboard on the projector and judge screens will stop updating.
                        Participant dashboards will hide individual ranks and scores.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleToggle}
                        disabled={isLoading}
                        variant={isFrozen ? "outline" : "destructive"}
                        className="w-full sm:w-auto"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isFrozen ? "Unfreeze Leaderboard" : "Freeze Leaderboard"}
                    </Button>
                </CardContent>
            </Card>

            {/* Placeholder for future Ceremony Controls */}
            <Card className="border-border bg-card/50 opacity-50">
                <CardHeader>
                    <CardTitle>Ceremony Controls</CardTitle>
                    <CardDescription>Coming in Phase 7</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button disabled variant="secondary">Start Ceremony</Button>
                </CardContent>
            </Card>
        </div>
    )
}
