"use client"

import { useState } from "react"
import { createRound, deleteRound, createCriterion, deleteCriterion, updateCheckpointTime, extendCheckpoint, pauseCheckpoint, resumeCheckpoint, updateRoundSettings } from "@/actions/rounds"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, Plus, Scale, Pause, Play, Clock, Users, Link2 } from "lucide-react"

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
                    <div className="space-y-2">
                        <Label>Checkpoint Time (submission deadline)</Label>
                        <Input name="checkpointTime" type="datetime-local" />
                        <p className="text-xs text-muted-foreground">Leave blank to default to 24 h from now.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Required Judges</Label>
                            <Input name="requiredJudges" type="number" min="1" max="10" defaultValue="1" required />
                            <p className="text-xs text-muted-foreground">How many judges must score each team</p>
                        </div>
                        <div className="space-y-2 flex items-center gap-2 pt-6">
                            <input 
                                type="checkbox" 
                                name="requiresLinkSubmission" 
                                id="requiresLinkSubmission" 
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label htmlFor="requiresLinkSubmission" className="cursor-pointer text-sm">
                                Require link submission before judging
                            </Label>
                        </div>
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
    checkpointTime: string;
    checkpointPausedAt: string | null;
    requiredJudges: number;
    requiresLinkSubmission: boolean;
    criteria: Criterion[];
}

function CheckpointControls({ round, hackathonId }: { round: Round, hackathonId: string }) {
    const [editing, setEditing] = useState(false)
    const [newTime, setNewTime] = useState(
        round.checkpointTime ? new Date(round.checkpointTime).toISOString().slice(0, 16) : ""
    )
    const [busy, setBusy] = useState(false)

    const isPaused = !!round.checkpointPausedAt

    // Remaining ms when paused
    const pausedRemainingMs = isPaused
        ? new Date(round.checkpointTime).getTime() - new Date(round.checkpointPausedAt!).getTime()
        : null

    function formatCheckpoint() {
        if (isPaused && pausedRemainingMs !== null) {
            const totalSec = Math.max(0, Math.floor(pausedRemainingMs / 1000))
            const h = Math.floor(totalSec / 3600)
            const m = Math.floor((totalSec % 3600) / 60)
            const s = totalSec % 60
            return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} remaining (paused)`
        }
        return new Date(round.checkpointTime).toLocaleString()
    }

    async function handleSaveTime() {
        if (!newTime) return
        setBusy(true)
        await updateCheckpointTime(hackathonId, round.id, newTime)
        setBusy(false)
        setEditing(false)
    }

    async function handleExtend(minutes: number) {
        setBusy(true)
        await extendCheckpoint(hackathonId, round.id, minutes)
        setBusy(false)
    }

    async function handlePauseResume() {
        setBusy(true)
        if (isPaused) {
            await resumeCheckpoint(hackathonId, round.id)
        } else {
            await pauseCheckpoint(hackathonId, round.id)
        }
        setBusy(false)
    }

    return (
        <div className="mt-3 pt-3 border-t border-dashed border-border space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{formatCheckpoint()}</span>
                    {isPaused && (
                        <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">⏸ PAUSED</span>
                    )}
                </div>
                <button
                    className="text-xs text-muted-foreground underline underline-offset-2"
                    onClick={() => setEditing(e => !e)}
                >
                    {editing ? "cancel" : "edit time"}
                </button>
            </div>

            {editing && (
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs">New checkpoint time</Label>
                        <Input
                            type="datetime-local"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <Button size="sm" className="h-8 text-xs" onClick={handleSaveTime} disabled={busy || !newTime}>
                        Save
                    </Button>
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-2"
                    onClick={() => handleExtend(5)}
                    disabled={busy}
                >
                    +5 min
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs px-2"
                    onClick={() => handleExtend(10)}
                    disabled={busy}
                >
                    +10 min
                </Button>
                <Button
                    size="sm"
                    variant={isPaused ? "default" : "outline"}
                    className={`h-7 text-xs px-2 ml-auto ${isPaused ? "bg-cyan-600 hover:bg-cyan-700" : "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"}`}
                    onClick={handlePauseResume}
                    disabled={busy}
                >
                    {isPaused ? <><Play size={10} className="mr-1" /> Resume</> : <><Pause size={10} className="mr-1" /> Pause</>}
                </Button>
            </div>
        </div>
    )
}

export function RoundItem({ round, hackathonId }: { round: Round, hackathonId: string }) {
    const [loading, setLoading] = useState(false)
    const [editingJudges, setEditingJudges] = useState(false)
    const [requiredJudges, setRequiredJudges] = useState(round.requiredJudges)

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

    async function handleToggleLinkSubmission() {
        await updateRoundSettings(hackathonId, round.id, {
            requiresLinkSubmission: !round.requiresLinkSubmission
        })
    }

    async function handleUpdateRequiredJudges() {
        if (requiredJudges < 1 || requiredJudges > 10) return
        await updateRoundSettings(hackathonId, round.id, { requiredJudges })
        setEditingJudges(false)
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
                
                {/* Judging Requirements */}
                <div className="mt-4 pt-4 border-t border-dashed border-border space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Judging Requirements</p>
                    
                    {/* Required Judges */}
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <div className="flex items-center gap-2 text-sm">
                            <Users size={14} className="text-muted-foreground" />
                            <span>Required Judges:</span>
                        </div>
                        {editingJudges ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={requiredJudges}
                                    onChange={(e) => setRequiredJudges(parseInt(e.target.value))}
                                    className="h-7 w-16 text-sm"
                                />
                                <Button size="sm" className="h-7 text-xs" onClick={handleUpdateRequiredJudges}>
                                    Save
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                    setRequiredJudges(round.requiredJudges)
                                    setEditingJudges(false)
                                }}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm">{round.requiredJudges}</span>
                                <button
                                    className="text-xs text-muted-foreground underline underline-offset-2"
                                    onClick={() => setEditingJudges(true)}
                                >
                                    edit
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Link Submission Requirement */}
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                        <div className="flex items-center gap-2 text-sm">
                            <Link2 size={14} className="text-muted-foreground" />
                            <span>Require Link Submission:</span>
                        </div>
                        <button
                            onClick={handleToggleLinkSubmission}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                round.requiresLinkSubmission
                                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                        >
                            {round.requiresLinkSubmission ? "ENABLED" : "DISABLED"}
                        </button>
                    </div>
                </div>
                
                <CheckpointControls round={round} hackathonId={hackathonId} />
            </CardContent>
        </Card>
    )
}
