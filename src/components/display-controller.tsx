"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toggleFreeze, updateDisplayConfig } from "@/actions/display"
import { Loader2, Lock, Unlock, Monitor, Layers, RefreshCcw, Check, X } from "lucide-react"
import { ProblemStatement } from "@prisma/client"

type LogEntry = {
    id: string
    action: string
    status: "sending" | "sent" | "error"
    time: Date
}

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
    const [freezeLoading, setFreezeLoading] = useState(false)
    const [configLoading, setConfigLoading] = useState<string | null>(null)
    const [log, setLog] = useState<LogEntry[]>([])

    // Abort previous in-flight config request when a new one fires
    const configAbortRef = useRef<AbortController | null>(null)

    const addLog = useCallback((action: string, status: LogEntry["status"]) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
        setLog(prev => [{ id, action, status, time: new Date() }, ...prev].slice(0, 5))
        return id
    }, [])

    const updateLog = useCallback((id: string, status: LogEntry["status"]) => {
        setLog(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    }, [])

    const handleToggleFreeze = async () => {
        const newState = !isFrozen
        const previousState = isFrozen

        setIsFrozen(newState)
        setFreezeLoading(true)
        const logId = addLog(newState ? "Freeze leaderboard" : "Unfreeze leaderboard", "sending")

        try {
            const result = await toggleFreeze(hackathonId, newState, slug)
            if (!result.success) {
                setIsFrozen(previousState)
                updateLog(logId, "error")
            } else {
                updateLog(logId, "sent")
            }
        } catch {
            setIsFrozen(previousState)
            updateLog(logId, "error")
        } finally {
            setFreezeLoading(false)
        }
    }

    const handleConfigChange = async (mode: "global" | "problem" | "auto", problemId: string | null = null) => {
        // Abort any in-flight config request — only latest click matters
        if (configAbortRef.current) configAbortRef.current.abort()
        const abort = new AbortController()
        configAbortRef.current = abort

        const previousMode = displayMode
        const previousProblemId = activeProblemId
        const loadingKey = problemId || mode

        // Label for the log
        const label = mode === "global"
            ? "Global leaderboard"
            : mode === "auto"
            ? "Auto-cycle tracks"
            : problemStatements.find(p => p.id === problemId)?.title || "Track view"

        setDisplayMode(mode)
        setActiveProblemId(problemId)
        setConfigLoading(loadingKey)
        const logId = addLog(label, "sending")

        try {
            const result = await updateDisplayConfig(hackathonId, { mode, problemId }, slug)
            // Check if this request was superseded
            if (abort.signal.aborted) return
            if (!result.success) {
                setDisplayMode(previousMode)
                setActiveProblemId(previousProblemId)
                updateLog(logId, "error")
            } else {
                updateLog(logId, "sent")
            }
        } catch (e: unknown) {
            if (abort.signal.aborted) return
            setDisplayMode(previousMode)
            setActiveProblemId(previousProblemId)
            updateLog(logId, "error")
        } finally {
            if (!abort.signal.aborted) setConfigLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Freeze Control */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm uppercase tracking-widest">
                        <span>LEADERBOARD LOCK</span>
                        {isFrozen ? (
                            <Badge variant="destructive" className="text-[10px]">FROZEN</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/50">LIVE</Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Freezes standings across all displays to prevent spoilers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleToggleFreeze}
                        disabled={freezeLoading}
                        variant={isFrozen ? "outline" : "destructive"}
                        className="w-full font-bold uppercase text-xs"
                    >
                        {freezeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFrozen ? "UNFREEZE" : "FREEZE LEADERBOARD"}
                    </Button>
                </CardContent>
            </Card>

            {/* Display Mode Control */}
            <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        DISPLAY MODE
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
                            disabled={configLoading === "global"}
                        >
                            {configLoading === "global" ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Monitor className="w-3 h-3 mr-2" />}
                            GLOBAL LEADERBOARD
                        </Button>

                        <Button
                            variant={displayMode === "auto" ? "secondary" : "outline"}
                            size="sm"
                            className="text-xs uppercase justify-start border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                            onClick={() => handleConfigChange("auto")}
                            disabled={configLoading === "auto"}
                        >
                            {configLoading === "auto" ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-2 animate-spin-slow" />}
                            AUTO CYCLE ALL TRACKS
                        </Button>

                        <div className="pt-2 border-t border-border/20">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 px-1">TRACK SPECIFIC VIEW</p>
                            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                {problemStatements.map(ps => (
                                    <Button
                                        key={ps.id}
                                        variant={displayMode === "problem" && activeProblemId === ps.id ? "secondary" : "ghost"}
                                        size="sm"
                                        className="text-[10px] uppercase justify-start h-7"
                                        onClick={() => handleConfigChange("problem", ps.id)}
                                        disabled={configLoading === ps.id}
                                    >
                                        {configLoading === ps.id ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Layers className="w-3 h-3 mr-2" />}
                                        {ps.title}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            </div>

            {/* Action Log — compact trail of recent changes */}
            {log.length > 0 && (
                <div className="border border-border/50 bg-card/30 px-3 py-2 space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Recent</p>
                    {log.map(entry => (
                        <div key={entry.id} className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-muted-foreground/50 w-14 shrink-0">
                                {entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            <span className="truncate flex-1 text-foreground/80">{entry.action}</span>
                            {entry.status === "sending" && (
                                <span className="flex items-center gap-1 text-amber-400 shrink-0">
                                    <Loader2 className="w-3 h-3 animate-spin" /> syncing
                                </span>
                            )}
                            {entry.status === "sent" && (
                                <span className="flex items-center gap-1 text-primary shrink-0">
                                    <Check className="w-3 h-3" /> applied
                                </span>
                            )}
                            {entry.status === "error" && (
                                <span className="flex items-center gap-1 text-red-400 shrink-0">
                                    <X className="w-3 h-3" /> failed
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
