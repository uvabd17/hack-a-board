"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toggleFreeze, updateDisplayConfig } from "@/actions/display"
import { Loader2, Lock, Unlock, Monitor, Layers, RefreshCcw } from "lucide-react"
import { ProblemStatement } from "@prisma/client"
// Actually, I'll skip toast for now or use standard alert if I don't have it.
// Checking package.json, I don't see sonner or toast manually installed, but shadcn might have it.
// To be safe, I'll use simple state message or standard alert for MVP speed, or I can try adding toast later.
// Let's stick to simple UI feedback.

export function DisplayController({
    hackathonId,
    initialIsFrozen,
    slug,
    problemStatements = [],
    initialMode = "global",
    initialProblemId = null
}: {
    hackathonId: string,
    initialIsFrozen: boolean,
    slug: string,
    problemStatements?: ProblemStatement[],
    initialMode?: "global" | "problem" | "auto",
    initialProblemId?: string | null
}) {
    const [isFrozen, setIsFrozen] = useState(initialIsFrozen)
    const [displayMode, setDisplayMode] = useState<"global" | "problem" | "auto">(initialMode as "global" | "problem" | "auto")
    const [activeProblemId, setActiveProblemId] = useState<string | null>(initialProblemId)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggleFreeze = async () => {
        setIsLoading(true)
        try {
            const newState = !isFrozen
            const result = await toggleFreeze(hackathonId, newState, slug)
            if (result.success) setIsFrozen(newState)
        } catch (error) {
            alert("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfigChange = async (mode: "global" | "problem" | "auto", problemId: string | null = null) => {
        setIsLoading(true)
        try {
            const result = await updateDisplayConfig(hackathonId, { mode, problemId }, slug)
            if (result.success) {
                setDisplayMode(mode)
                setActiveProblemId(problemId)
            }
        } catch (error) {
            alert("Failed to update config")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Freeze Control */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-widest">
                        <span>LEADERBOARD_LOCK</span>
                        {isFrozen ? (
                            <Badge variant="destructive" className="text-[10px]">FROZEN</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/50">LIVE</Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Freezes standings across all displays to prevent spoilers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleToggleFreeze}
                        disabled={isLoading}
                        variant={isFrozen ? "outline" : "destructive"}
                        className="w-full font-bold uppercase text-xs"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFrozen ? "RELEASE_LOCK" : "ENGAGE_FREEZE"}
                    </Button>
                </CardContent>
            </Card>

            {/* Display Mode Control */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        PROJECTOR_SCENE
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Select which data set is projected on the main wall.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Button
                            variant={displayMode === "global" ? "default" : "outline"}
                            size="sm"
                            className="text-xs uppercase justify-start"
                            onClick={() => handleConfigChange("global")}
                            disabled={isLoading}
                        >
                            <Monitor className="w-3 h-3 mr-2" />
                            GLOBAL_LEADERBOARD
                        </Button>

                        <Button
                            variant={displayMode === "auto" ? "secondary" : "outline"}
                            size="sm"
                            className="text-xs uppercase justify-start border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                            onClick={() => handleConfigChange("auto")}
                            disabled={isLoading}
                        >
                            <RefreshCcw className="w-3 h-3 mr-2 animate-spin-slow" />
                            AUTO_CYCLE_ALL_TRACKS
                        </Button>

                        <div className="pt-2 border-t border-border/20">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-1">TRACK_SPECIFIC_VIEW</p>
                            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                {problemStatements.map(ps => (
                                    <Button
                                        key={ps.id}
                                        variant={displayMode === "problem" && activeProblemId === ps.id ? "secondary" : "ghost"}
                                        size="sm"
                                        className="text-[10px] uppercase justify-start h-7"
                                        onClick={() => handleConfigChange("problem", ps.id)}
                                        disabled={isLoading}
                                    >
                                        <Layers className="w-3 h-3 mr-2" />
                                        {ps.title}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
