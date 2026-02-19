"use client"

import { useState } from "react"
import { createPhase, updatePhase, deletePhase } from "@/actions/phases"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, Pencil, Check, X, AlertCircle, CheckCircle2 } from "lucide-react"

// ─────────────────────────────────────────────
// CREATE FORM
// ─────────────────────────────────────────────
export function PhaseForm({ hackathonId }: { hackathonId: string }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setStatus(null)
        const res = await createPhase(hackathonId, formData)
        if (res.error) setStatus({ error: res.error })
        else {
            setStatus({ success: "Phase added" })
            ;(document.getElementById("create-phase-form") as HTMLFormElement)?.reset()
        }
        setLoading(false)
    }

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle>ADD_PHASE</CardTitle>
                <CardDescription>Define a schedule block (Check-in, Hacking, Judging…)</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="create-phase-form" action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider">Phase Name</Label>
                        <Input name="name" placeholder="Hacking Phase" required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider">Start Time</Label>
                            <Input name="startTime" type="datetime-local" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider">End Time</Label>
                            <Input name="endTime" type="datetime-local" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider">Display Order</Label>
                        <Input name="order" type="number" min="1" max="50" defaultValue="1" required />
                    </div>

                    {status?.error && (
                        <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-3">
                            <AlertCircle size={14} /> {status.error}
                        </div>
                    )}
                    {status?.success && (
                        <div className="flex items-center gap-2 text-green-600 text-xs bg-green-500/10 p-3">
                            <CheckCircle2 size={14} /> {status.success}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "CREATING..." : "REGISTER_PHASE"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

// ─────────────────────────────────────────────
// PHASE ITEM (view + inline edit + delete)
// ─────────────────────────────────────────────
interface PhaseData {
    id: string
    name: string
    startTime: string   // ISO string from server
    endTime: string     // ISO string from server
    order: number
}

export function PhaseItem({
    phase,
    hackathonId,
}: {
    phase: PhaseData
    hackathonId: string
}) {
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const now = new Date()
    const start = new Date(phase.startTime)
    const end = new Date(phase.endTime)
    const isActive = now >= start && now <= end
    const isPast = now > end

    async function handleUpdate(formData: FormData) {
        setLoading(true)
        setError(null)
        const res = await updatePhase(hackathonId, phase.id, formData)
        if (res.error) setError(res.error)
        else setEditing(false)
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm("Delete this phase?")) return
        setLoading(true)
        await deletePhase(hackathonId, phase.id)
        setLoading(false)
    }

    if (editing) {
        return (
            <div className="border border-primary/40 bg-card p-4 space-y-3">
                <form action={handleUpdate} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3 space-y-1">
                            <Label className="text-xs uppercase tracking-wider">Phase Name</Label>
                            <Input name="name" defaultValue={phase.name} required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider">Order</Label>
                            <Input name="order" type="number" min="1" max="50" defaultValue={phase.order} required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider">Start</Label>
                            <Input name="startTime" type="datetime-local"
                                defaultValue={phase.startTime.slice(0, 16)} required />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wider">End</Label>
                            <Input name="endTime" type="datetime-local"
                                defaultValue={phase.endTime.slice(0, 16)} required />
                        </div>
                    </div>
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading} className="gap-1 flex-1">
                            <Check size={12} /> {loading ? "SAVING..." : "SAVE"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} className="gap-1">
                            <X size={12} /> CANCEL
                        </Button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className={`flex items-center justify-between p-4 border transition-colors
            ${isActive ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
            <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive ? "bg-primary animate-pulse" :
                    isPast ? "bg-muted-foreground" :
                    "border border-muted-foreground"}`} />
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{phase.order}</span>
                        <p className={`font-bold text-sm uppercase tracking-wide ${isPast ? "line-through text-muted-foreground" : ""}`}>
                            {phase.name}
                        </p>
                        {isActive && (
                            <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 uppercase">LIVE</span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatTime(phase.startTime)} → {formatTime(phase.endTime)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)} disabled={loading}
                    className="h-7 w-7">
                    <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}
                    className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 size={13} />
                </Button>
            </div>
        </div>
    )
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    })
}
