"use client"

import { useState } from "react"
import { submitScore } from "@/actions/scoring"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

// Native range input is safer if Slider component missing, but let's try to be premium.
// Actually, I'll use a styled native input for MVP reliability unless I check for Slider.
// But I can build a quick custom slider UI.

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
    const [status, setStatus] = useState<{ error?: string, success?: string } | null>(null)

    // Ensure at least one round exists
    if (rounds.length === 0) return <div>No scoring rounds configured yet</div>

    const handleScoreChange = (criterionId: string, value: number) => {
        setScores(prev => ({ ...prev, [criterionId]: value }))
    }

    const handleSubmit = async (roundId: string) => {
        setLoading(true)
        setStatus(null)

        // Filter scores for this round only
        const round = rounds.find(r => r.id === roundId)
        if (!round) return

        const roundScores: Record<string, number> = {}
        let allFilled = true
        round.criteria.forEach(c => {
            const val = scores[c.id]
            if (val === undefined) allFilled = false
            roundScores[c.id] = val || 0 // Send 0 or handle error? verification usually blocks execution.
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
            setStatus({ success: "Scores saved successfully." })
        }
        setLoading(false)
    }

    return (
        <Tabs defaultValue={rounds[0].id} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-zinc-800">
                {rounds.map(round => (
                    <TabsTrigger key={round.id} value={round.id} className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                        {round.name}
                    </TabsTrigger>
                ))}
            </TabsList>

            {rounds.map(round => (
                <TabsContent key={round.id} value={round.id} className="space-y-6 mt-6">
                    <div className="flex justify-between items-center bg-zinc-900/50 p-3 border-x border-t border-zinc-800 rounded-t-lg">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            Round: {round.name}
                        </div>
                        {round.criteria.some(c => initialScores[c.id] !== undefined) && (
                            <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-500 bg-yellow-500/5 rounded-none px-2 py-0">
                                RE-SCORING
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-6">
                        {round.criteria.map(criterion => (
                            <div key={criterion.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="font-bold text-lg text-white">{criterion.name}</label>
                                    <span className="text-2xl font-mono text-cyan-400">
                                        {scores[criterion.id] || 0}<span className="text-zinc-600 text-sm">/5</span>
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={scores[criterion.id] || 0}
                                    onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />

                                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                                    <span>POOR (1)</span>
                                    <span>EXCELLENT (5)</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {status?.error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded border border-red-900">
                            <AlertCircle size={18} /> {status.error}
                        </div>
                    )}

                    {status?.success && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-4 rounded border border-green-900">
                            <CheckCircle2 size={18} /> {status.success}
                        </div>
                    )}

                    <Button
                        onClick={() => handleSubmit(round.id)}
                        disabled={loading}
                        className="w-full h-14 text-xl font-bold bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        {loading ? "SAVING..." : "SUBMIT SCORES"}
                    </Button>
                </TabsContent>
            ))}
        </Tabs >
    )
}
