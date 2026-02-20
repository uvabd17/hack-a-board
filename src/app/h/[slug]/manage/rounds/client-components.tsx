"use client"

import { useState } from "react"
import { createRound, deleteRound, createCriterion, deleteCriterion } from "@/actions/rounds"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, Plus, Scale } from "lucide-react"

export function RoundForm({ hackathonId }: { hackathonId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await createRound(hackathonId, formData)
        setLoading(false)
        const form = document.getElementById("create-round-form") as HTMLFormElement
        form?.reset()
    }

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle>Add Round</CardTitle>
                <CardDescription>Create a judging round with criteria.</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="create-round-form" action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Round Name</Label>
                            <Input name="name" placeholder="Round 1: Ideation" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Order (1-10)</Label>
                            <Input name="order" type="number" min="1" max="10" defaultValue="1" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Weight (%)</Label>
                        <Input name="weight" type="number" min="0" max="100" defaultValue="100" required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Creating..." : "Add Round"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export function CriterionForm({ hackathonId, roundId }: { hackathonId: string, roundId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await createCriterion(hackathonId, roundId, formData)
        setLoading(false)
        const form = document.getElementById(`crit-form-${roundId}`) as HTMLFormElement
        form?.reset()
    }

    return (
        <form id={`crit-form-${roundId}`} action={handleSubmit} className="flex gap-2 items-end mt-4 pt-4 border-t border-dashed border-border">
            <div className="flex-1 space-y-1">
                <Label className="text-xs">New Criterion</Label>
                <Input name="name" placeholder="Innovation" size={1} required className="h-8" />
            </div>
            <div className="w-20 space-y-1">
                <Label className="text-xs">Weight</Label>
                <Input name="weight" type="number" placeholder="%" size={1} required className="h-8" />
            </div>
            <Button type="submit" size="sm" variant="secondary" disabled={loading} className="h-8">
                <Plus size={14} />
            </Button>
        </form>
    )
}

interface Criterion {
    id: string;
    name: string;
    weight: number;
}

interface Round {
    id: string;
    hackathonId: string;
    name: string;
    order: number;
    weight: number;
    criteria: Criterion[];
}

export function RoundItem({ round, hackathonId }: { round: Round, hackathonId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleDeleteRound() {
        if (!confirm("Delete round? Scores will be lost.")) return
        setLoading(true)
        await deleteRound(hackathonId, round.id)
        setLoading(false)
    }

    async function handleDeleteCrit(critId: string) {
        if (!confirm("Remove criterion?")) return
        await deleteCriterion(hackathonId, critId)
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">
                            #{round.order}
                        </span>
                        {round.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground border border-border px-2 py-1 rounded flex items-center gap-1">
                            <Scale size={12} /> {round.weight}%
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDeleteRound} disabled={loading}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {round.criteria.map((c: Criterion) => (
                        <div key={c.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <span>{c.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground font-mono">{c.weight}%</span>
                                <button onClick={() => handleDeleteCrit(c.id)} className="text-destructive hover:text-destructive/80">
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}
                    {round.criteria.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No criteria defined.</p>
                    )}
                </div>

                <CriterionForm hackathonId={hackathonId} roundId={round.id} />
            </CardContent>
        </Card>
    )
}
