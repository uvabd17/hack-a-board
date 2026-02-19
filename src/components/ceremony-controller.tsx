"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { startCeremony, stopCeremony, revealNext, getCeremonyPreview } from "@/actions/ceremony"
import type { WinnerSnapshot } from "@/actions/ceremony"
import { Trophy, Power, CheckCircle2, AlertTriangle } from "lucide-react"

export function CeremonyController({
    hackathonId,
    slug
}: {
    hackathonId: string,
    slug: string
}) {
    const [winners, setWinners] = useState<WinnerSnapshot[]>([])
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)
    const [mode, setMode] = useState<"overall" | "problem-wise">("overall")
    const [revealCount, setRevealCount] = useState(3)
    const [isActive, setIsActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [totalWinners, setTotalWinners] = useState(0)

    // Load preview when mode/count changes
    useEffect(() => {
        if (isActive) return
        const loadPreview = async () => {
            setIsPreviewLoading(true)
            try {
                const res = await getCeremonyPreview(hackathonId, mode, revealCount)
                if (res.success && res.winners) {
                    setWinners(res.winners)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsPreviewLoading(false)
            }
        }
        loadPreview()
    }, [hackathonId, mode, revealCount, isActive])

    const handleStart = async () => {
        setIsLoading(true)
        try {
            const res = await startCeremony(hackathonId, mode, revealCount)
            if (res.success) {
                setIsActive(true)
                setShowConfirm(false)
                setTotalWinners(winners.length)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReveal = async () => {
        setIsLoading(true)
        try {
            await revealNext(hackathonId)
            setCurrentIndex(prev => prev + 1)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStop = async () => {
        setIsLoading(true)
        try {
            await stopCeremony(hackathonId)
            setIsActive(false)
            setCurrentIndex(0)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-border bg-card/50 backdrop-blur-sm mt-6 border-yellow-500/20">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-yellow-500">
                    <span className="flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Ceremony Control Center
                    </span>
                    {isActive ? (
                        <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/50 flex gap-1 items-center animate-pulse">
                            ACTIVE
                        </Badge>
                    ) : (
                        <Badge variant="secondary">OFFLINE</Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Deterministic winner reveals. Snapshot is locked on start.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isActive ? (
                    <div className="space-y-6">
                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reveal Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={mode === "overall" ? "default" : "outline"}
                                    onClick={() => setMode("overall")}
                                    className="text-xs uppercase"
                                >
                                    Overall Rankings
                                </Button>
                                <Button
                                    variant={mode === "problem-wise" ? "default" : "outline"}
                                    onClick={() => setMode("problem-wise")}
                                    className="text-xs uppercase"
                                >
                                    Problem Winners
                                </Button>
                            </div>
                        </div>

                        {mode === "overall" && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Winner Spectrum</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[3, 5, 10].map(count => (
                                        <Button
                                            key={count}
                                            variant={revealCount === count ? "secondary" : "outline"}
                                            onClick={() => setRevealCount(count)}
                                            size="sm"
                                        >
                                            Top {count}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview List */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                                Winner Preview
                                {isPreviewLoading && <span className="animate-pulse">Analyzing...</span>}
                            </label>
                            <div className="bg-black/20 rounded border border-border/50 max-h-40 overflow-y-auto divide-y divide-border/30">
                                {winners.length > 0 ? winners.map((w, i) => (
                                    <div key={i} className="p-2 flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-zinc-400">#{(mode === "overall" ? (i + 1) : 1).toString().padStart(2, '0')}</span>
                                        <span className="font-bold text-zinc-200 truncate mx-2 flex-1">{w.teamName}</span>
                                        <span className="text-yellow-500/80">{w.score.toFixed(1)} pts</span>
                                    </div>
                                )) : !isPreviewLoading && (
                                    <div className="p-4 text-center text-[10px] text-muted-foreground italic">No eligible teams found for this mode.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-yellow-500/5 p-4 rounded border border-yellow-500/10 flex gap-3 text-xs text-yellow-500/80">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>Starting the ceremony creates a <strong>static snapshot</strong>. Late scores will be ignored.</p>
                        </div>

                        {showConfirm ? (
                            <div className="space-y-3 animate-in fade-in zoom-in duration-200">
                                <p className="text-xs text-center font-bold text-destructive uppercase tracking-widest">Confirm Detonation?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="destructive" onClick={handleStart} disabled={isLoading || winners.length === 0} className="font-bold">YES, START</Button>
                                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>CANCEL</Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => setShowConfirm(true)}
                                disabled={isLoading || winners.length === 0}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold h-12"
                            >
                                INITIATE CEREMONY
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="text-center py-6 bg-black/40 rounded border border-border/50">
                            <div className="text-4xl font-mono font-bold text-yellow-500 mb-1">
                                STEP_{currentIndex.toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Phase: {mode.replace('-', ' ')}</div>
                        </div>

                        <Button
                            onClick={handleReveal}
                            disabled={isLoading}
                            size="lg"
                            className="w-full h-20 text-xl font-bold bg-green-600 hover:bg-green-700 text-black shadow-[0_0_20px_rgba(22,163,74,0.3)] animate-pulse"
                        >
                            REVEAL NEXT
                        </Button>

                        <div className="flex justify-between items-center pt-4 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground uppercase">Snapshot Locked: {new Date().toLocaleTimeString()}</p>
                            <Button variant="ghost" size="sm" onClick={handleStop} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] uppercase">
                                <Power className="w-3 h-3 mr-2" />
                                Terminate
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
