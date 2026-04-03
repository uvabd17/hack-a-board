"use client"

import { useState } from "react"
import { submitScore } from "@/actions/scoring"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Trophy } from "lucide-react"

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
    const [loading, setLoading] = useState(false)
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

    if (rounds.length === 0) return <div className="text-muted-foreground p-4">No scoring rounds configured yet</div>

    const handleScoreChange = (criterionId: string, value: number) => {
        setScores(prev => ({ ...prev, [criterionId]: value }))
    }

    const handleSubmit = async (roundId: string) => {
        setLoading(true)
        setStatus(null)

        const round = rounds.find(r => r.id === roundId)
        if (!round) return

        const roundScores: Record<string, number> = {}
        let allFilled = true
        round.criteria.forEach(c => {
            const val = scores[c.id]
            if (val === undefined) allFilled = false
            roundScores[c.id] = val || 0
        })

        if (!allFilled) {
            setStatus({ error: "Please score all criteria for this round." })
            setLoading(false)
            return
        }

        const res = await submitScore({
            hackathonId,
            teamId,
            roundId,
            scores: roundScores
        })

        if (res.error) {
            setStatus({ error: res.error })
        } else {
            if (res.submissionStatus?.newSubmission && res.submissionStatus.submitted) {
                const bonus = res.submissionStatus.timeBonus || 0
                const bonusText = bonus > 0
                    ? `+${bonus} time bonus!`
                    : bonus < 0
                    ? `${bonus} time penalty`
                    : ''
                setStatus({
                    success: `Team submitted! ${bonusText}`,
                    submissionStatus: res.submissionStatus
                })
            } else if (res.submissionStatus?.submitted) {
                setStatus({
                    success: `Scores saved. Team already submitted (${res.submissionStatus.judgeCount}/${res.submissionStatus.requiredJudges} judges).`,
                    submissionStatus: res.submissionStatus
                })
            } else {
                setStatus({
                    success: `Scores saved! Team progress: ${res.submissionStatus?.judgeCount}/${res.submissionStatus?.requiredJudges} judges completed.`,
                    submissionStatus: res.submissionStatus
                })
            }
        }
        setLoading(false)
    }

    return (
        <Tabs defaultValue={rounds[0].id} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-secondary">
                {rounds.map(round => (
                    <TabsTrigger
                        key={round.id}
                        value={round.id}
                        className="data-[state=active]:bg-[var(--role-accent)] data-[state=active]:text-[var(--role-accent-foreground)] font-bold"
                    >
                        {round.name}
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
                                                    "h-16 flex flex-col items-center justify-center border-2 font-mono transition-all duration-150",
                                                    isSelected
                                                        ? "bg-[var(--role-accent)] text-[var(--role-accent-foreground)] border-[var(--role-accent)] shadow-[2px_2px_0_var(--brutal-shadow)]"
                                                        : "bg-secondary border-border text-muted-foreground hover:border-[var(--role-accent)]/50 hover:text-foreground",
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

                    {/* Status messages */}
                    {status?.error && (
                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 border-2 border-destructive/30">
                            <AlertCircle size={18} /> {status.error}
                        </div>
                    )}

                    {status?.success && (
                        <div className={`flex items-center gap-2 p-4 border-2 ${
                            status.submissionStatus?.newSubmission
                                ? 'text-primary bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
                                : 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30'
                        }`}>
                            {status.submissionStatus?.newSubmission ? <Trophy size={18} /> : <CheckCircle2 size={18} />}
                            <span>{status.success}</span>
                        </div>
                    )}

                    {/* Submit button */}
                    <Button
                        onClick={() => handleSubmit(round.id)}
                        disabled={loading}
                        variant="brutal"
                        className="w-full h-16 text-xl font-black"
                    >
                        {loading ? "SAVING..." : "SUBMIT SCORES"}
                    </Button>
                </TabsContent>
            ))}
        </Tabs>
    )
}
