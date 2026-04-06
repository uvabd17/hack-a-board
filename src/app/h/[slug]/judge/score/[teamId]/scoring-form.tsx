"use client"

import { useState, useEffect, useMemo } from "react"
import { submitScore } from "@/actions/scoring"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Trophy, Loader2, Check } from "lucide-react"
import { retryWithBackoff } from "@/lib/retry"

interface Criterion {
    id: string;
    name: string;
    weight: number;
}

interface Round {
    id: string;
    name: string;
    order: number;
    weight: number;
    criteria: Criterion[];
}

const SCORE_LABELS: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent",
}

export function ScoringForm({
    hackathonId,
    teamId,
    rounds,
    initialScores
}: {
    hackathonId: string,
    teamId: string,
    rounds: Round[],
    initialScores: Record<string, number>
}) {
    const [scores, setScores] = useState<Record<string, number>>(initialScores)
    const [activeTab, setActiveTab] = useState(rounds[0]?.id ?? "")
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [status, setStatus] = useState<{
        error?: string
        success?: string
        submissionStatus?: {
            submitted: boolean
            judgeCount: number
            requiredJudges: number
            newSubmission?: boolean
            timeBonus?: number
        }
    } | null>(null)

    // Recover pending scores from localStorage on mount
    useEffect(() => {
        const pendingKey = `pending:${teamId}`
        const pending = localStorage.getItem(pendingKey)
        if (!pending) return

        try {
            const { roundId, scores: pendingScores } = JSON.parse(pending)
            setSyncing(true)
            setStatus({ success: "Recovering saved scores..." })
            retryWithBackoff(
                () => submitScore({ hackathonId, teamId, roundId, scores: pendingScores }),
                { maxAttempts: 3, onRetry: (a, m) => setStatus({ success: `Syncing saved scores... (${a}/${m})` }) }
            ).then(res => {
                if (res.error) {
                    setStatus({ error: `Recovery failed: ${res.error}` })
                } else {
                    localStorage.removeItem(pendingKey)
                    setStatus({ success: "Saved scores synced successfully!" })
                }
            }).catch(() => {
                setStatus({ error: "Could not sync saved scores. Will retry next time." })
            }).finally(() => setSyncing(false))
        } catch {
            localStorage.removeItem(pendingKey)
        }
    }, [hackathonId, teamId])

    if (rounds.length === 0) return <div className="text-muted-foreground p-4">No scoring rounds configured yet</div>

    const handleScoreChange = (criterionId: string, value: number) => {
        setScores(prev => ({ ...prev, [criterionId]: value }))
    }

    // Track which rounds have all criteria scored
    const roundComplete = useMemo(() => {
        const map: Record<string, boolean> = {}
        for (const round of rounds) {
            map[round.id] = round.criteria.length > 0 && round.criteria.every(c => scores[c.id] !== undefined)
        }
        return map
    }, [scores, rounds])

    const handleSubmit = async (roundId: string) => {
        setLoading(true)
        setStatus(null)

        const round = rounds.find(r => r.id === roundId)
        if (!round) return

        const roundScores: Record<string, number> = {}
        round.criteria.forEach(c => {
            roundScores[c.id] = scores[c.id]
        })

        // Optimistic UI — show success immediately, sync in background
        setStatus({ success: "Scores submitted! Syncing..." })
        setSyncing(true)

        // Persist to localStorage in case of crash/timeout
        const pendingKey = `pending:${teamId}`
        localStorage.setItem(pendingKey, JSON.stringify({ roundId, scores: roundScores }))

        try {
            const res = await retryWithBackoff(
                () => submitScore({ hackathonId, teamId, roundId, scores: roundScores }),
                {
                    maxAttempts: 3,
                    onRetry: (attempt, max) => {
                        setStatus({ success: `Syncing... (retry ${attempt}/${max})` })
                    }
                }
            )

            // Clear pending — server confirmed
            localStorage.removeItem(pendingKey)

            if (res.error) {
                setStatus({ error: res.error })
            } else {
                if (res.submissionStatus?.newSubmission && res.submissionStatus.submitted) {
                    const bonus = res.submissionStatus.timeBonus || 0
                    const bonusText = bonus > 0 ? `+${bonus} time bonus!` : bonus < 0 ? `${bonus} time penalty` : ''
                    setStatus({ success: `Team submitted! ${bonusText}`, submissionStatus: res.submissionStatus })
                } else if (res.submissionStatus?.submitted) {
                    setStatus({
                        success: `Scores saved. Team already submitted (${res.submissionStatus.judgeCount}/${res.submissionStatus.requiredJudges} judges).`,
                        submissionStatus: res.submissionStatus
                    })
                } else {
                    setStatus({
                        success: `Scores saved! ${res.submissionStatus?.judgeCount}/${res.submissionStatus?.requiredJudges} judges completed.`,
                        submissionStatus: res.submissionStatus
                    })
                }
            }
        } catch {
            // All retries exhausted — scores are in localStorage for recovery
            setStatus({ error: "Network issue. Scores saved locally — will sync when connection improves." })
        } finally {
            setLoading(false)
            setSyncing(false)
        }
    }

    return (
        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setStatus(null) }} className="w-full">
            <TabsList className="flex w-full overflow-x-auto bg-secondary">
                {rounds.map(round => (
                    <TabsTrigger
                        key={round.id}
                        value={round.id}
                        className="flex-1 min-w-0 gap-1.5 data-[state=active]:bg-[var(--role-accent)] data-[state=active]:text-[var(--role-accent-foreground)] font-bold truncate"
                    >
                        {round.name}
                        {roundComplete[round.id] && <Check className="w-3.5 h-3.5" />}
                    </TabsTrigger>
                ))}
            </TabsList>

            {rounds.map(round => (
                <TabsContent key={round.id} value={round.id} className="space-y-5 mt-5">
                    {/* Round header */}
                    <div className="flex justify-between items-center bg-card p-3 border-2 border-border rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Round: {round.name}
                        </div>
                        {round.criteria.some(c => initialScores[c.id] !== undefined) && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 bg-amber-500/5 px-2 py-0">
                                RE-SCORING
                            </Badge>
                        )}
                    </div>

                    {/* Criteria with chunky score buttons */}
                    {round.criteria.length === 0 ? (
                        <div className="p-8 border-2 border-border border-dashed rounded-lg text-center text-muted-foreground space-y-2">
                            <p className="font-bold text-foreground">No scoring criteria</p>
                            <p className="text-xs">The organizer hasn&apos;t added criteria for this round yet.</p>
                        </div>
                    ) : (
                    <div className="space-y-5">
                        {round.criteria.map(criterion => (
                            <div key={criterion.id} className="border-2 border-border bg-card p-4 space-y-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <label className="font-bold text-lg text-foreground">{criterion.name}</label>
                                    <span className="text-2xl font-mono font-black text-[var(--role-accent)] tabular-nums">
                                        {scores[criterion.id] || 0}<span className="text-muted-foreground text-sm">/5</span>
                                    </span>
                                </div>

                                {/* Chunky tappable score buttons */}
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(value => {
                                        const isSelected = scores[criterion.id] === value
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => handleScoreChange(criterion.id, value)}
                                                className={[
                                                    "h-16 flex flex-col items-center justify-center border-2 border-b-[4px] rounded-lg font-mono transition-all duration-100 cursor-pointer select-none active:border-b-2 active:mt-[2px]",
                                                    isSelected
                                                        ? "bg-[var(--role-accent)] text-[var(--role-accent-foreground)] border-[var(--role-accent)] border-b-[var(--role-accent)]/60"
                                                        : "bg-secondary border-border border-b-border/60 text-muted-foreground hover:border-[var(--role-accent)]/50 hover:text-foreground",
                                                ].join(" ")}
                                            >
                                                <span className="text-xl font-black">{value}</span>
                                                <span className="text-[8px] uppercase tracking-wider leading-none mt-0.5">
                                                    {SCORE_LABELS[value]}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    )}

                    {/* Status messages */}
                    {status?.error && (
                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 border-2 border-destructive/30">
                            <AlertCircle size={18} /> {status.error}
                        </div>
                    )}

                    {status?.success && (
                        <div className={`flex items-center gap-2 p-4 border-2 rounded-lg ${
                            syncing
                                ? 'text-amber-400 bg-amber-900/20 border-amber-700/30'
                                : status.submissionStatus?.newSubmission
                                    ? 'text-primary bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
                                    : 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30'
                        }`}>
                            {syncing ? <Loader2 size={18} className="animate-spin" /> : status.submissionStatus?.newSubmission ? <Trophy size={18} /> : <CheckCircle2 size={18} />}
                            <span>{status.success}</span>
                        </div>
                    )}

                    {/* Submit button */}
                    <Button
                        onClick={() => handleSubmit(round.id)}
                        disabled={loading || syncing || !roundComplete[round.id]}
                        variant="brutal"
                        size="xl"
                        className="w-full text-xl font-black"
                    >
                        {loading ? "SAVING..." : syncing ? "SYNCING..." : !roundComplete[round.id] ? "SCORE ALL CRITERIA" : "SUBMIT SCORES"}
                    </Button>
                </TabsContent>
            ))}
        </Tabs>
    )
}
