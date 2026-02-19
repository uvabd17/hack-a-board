"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateHackathon } from "@/actions/organizer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Save } from "lucide-react"

interface HackathonData {
    id: string
    name: string
    slug: string
    tagline: string | null
    description: string | null
    startDate: string
    endDate: string
    timezone: string
    mode: "in-person" | "online" | "hybrid"
    venue: string | null
    onlineLink: string | null
    minTeamSize: number
    maxTeamSize: number
    maxTeams: number
    requireApproval: boolean
    registrationDeadline: string | null
    timeBonusRate: number
    timePenaltyRate: number
    status: string
}

export function HackathonSettingsForm({ hackathon }: { hackathon: HackathonData }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ error?: string; success?: string } | null>(null)
    const [form, setForm] = useState({
        name: hackathon.name,
        slug: hackathon.slug,
        tagline: hackathon.tagline || "",
        description: hackathon.description || "",
        startDate: hackathon.startDate,
        endDate: hackathon.endDate,
        timezone: hackathon.timezone,
        mode: hackathon.mode,
        venue: hackathon.venue || "",
        onlineLink: hackathon.onlineLink || "",
        minTeamSize: hackathon.minTeamSize,
        maxTeamSize: hackathon.maxTeamSize,
        maxTeams: hackathon.maxTeams,
        requireApproval: hackathon.requireApproval,
        registrationDeadline: hackathon.registrationDeadline || "",
        timeBonusRate: hackathon.timeBonusRate,
        timePenaltyRate: hackathon.timePenaltyRate,
    })

    function update(field: string, value: unknown) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        try {
            const res = await updateHackathon(hackathon.id, {
                ...form,
                tagline: form.tagline || null,
                description: form.description || null,
                venue: form.venue || null,
                onlineLink: form.onlineLink || null,
                registrationDeadline: form.registrationDeadline || null,
            })
            if (res.error) {
                setStatus({ error: res.error })
            } else if (res.slugChanged && res.newSlug) {
                setStatus({ success: "Saved! Redirecting to new URL..." })
                setTimeout(() => { window.location.href = `/h/${res.newSlug}/manage/settings` }, 1000)
            } else {
                setStatus({ success: "Settings saved successfully" })
                router.refresh()
            }
        } catch {
            setStatus({ error: "An unexpected error occurred" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Info */}
            <Section title="GENERAL INFO">
                <div className="space-y-4">
                    <Field label="Hackathon Name">
                        <Input
                            value={form.name}
                            onChange={e => update("name", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="URL Slug" hint={`Your event is at /h/${form.slug} — slug cannot be changed after creation`}>
                        <Input
                            value={form.slug}
                            readOnly
                            className="opacity-60 cursor-not-allowed"
                        />
                    </Field>

                    <Field label="Tagline">
                        <Input
                            value={form.tagline}
                            onChange={e => update("tagline", e.target.value)}
                            placeholder="Build the future in 24 hours"
                        />
                    </Field>

                    <Field label="Description">
                        <Textarea
                            value={form.description}
                            onChange={e => update("description", e.target.value)}
                            placeholder="Full description of the hackathon..."
                            className="h-24"
                        />
                    </Field>
                </div>
            </Section>

            {/* Schedule */}
            <Section title="SCHEDULE">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Start Date/Time">
                        <Input
                            type="datetime-local"
                            value={form.startDate}
                            onChange={e => update("startDate", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="End Date/Time">
                        <Input
                            type="datetime-local"
                            value={form.endDate}
                            onChange={e => update("endDate", e.target.value)}
                            required
                        />
                    </Field>

                    <Field label="Timezone">
                        <Input
                            value={form.timezone}
                            onChange={e => update("timezone", e.target.value)}
                            placeholder="Asia/Kolkata"
                        />
                    </Field>

                    <Field label="Registration Deadline (optional)">
                        <Input
                            type="datetime-local"
                            value={form.registrationDeadline}
                            onChange={e => update("registrationDeadline", e.target.value)}
                        />
                    </Field>
                </div>
            </Section>

            {/* Venue / Mode */}
            <Section title="LOCATION">
                <div className="space-y-4">
                    <Field label="Mode">
                        <div className="flex gap-2">
                            {(["in-person", "online", "hybrid"] as const).map(m => (
                                <Button
                                    key={m}
                                    type="button"
                                    variant={form.mode === m ? "default" : "outline"}
                                    size="sm"
                                    className="uppercase text-xs"
                                    onClick={() => update("mode", m)}
                                >
                                    {m}
                                </Button>
                            ))}
                        </div>
                    </Field>

                    {(form.mode === "in-person" || form.mode === "hybrid") && (
                        <Field label="Venue">
                            <Input
                                value={form.venue}
                                onChange={e => update("venue", e.target.value)}
                                placeholder="Building A, Room 101"
                            />
                        </Field>
                    )}

                    {(form.mode === "online" || form.mode === "hybrid") && (
                        <Field label="Online Link">
                            <Input
                                value={form.onlineLink}
                                onChange={e => update("onlineLink", e.target.value)}
                                placeholder="https://meet.google.com/..."
                            />
                        </Field>
                    )}
                </div>
            </Section>

            {/* Team Config */}
            <Section title="TEAM RULES">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Min Team Size">
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={form.minTeamSize}
                            onChange={e => update("minTeamSize", parseInt(e.target.value) || 1)}
                        />
                    </Field>

                    <Field label="Max Team Size">
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={form.maxTeamSize}
                            onChange={e => update("maxTeamSize", parseInt(e.target.value) || 4)}
                        />
                    </Field>

                    <Field label="Max Teams (0 = unlimited)">
                        <Input
                            type="number"
                            min={0}
                            value={form.maxTeams}
                            onChange={e => update("maxTeams", parseInt(e.target.value) || 0)}
                        />
                    </Field>
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="requireApproval"
                        checked={form.requireApproval}
                        onChange={e => update("requireApproval", e.target.checked)}
                        className="w-4 h-4"
                    />
                    <Label htmlFor="requireApproval" className="text-sm cursor-pointer">
                        Require manual approval for team registrations
                    </Label>
                </div>
            </Section>

            {/* Scoring Config */}
            <Section title="SCORING CONFIG">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Time Bonus Rate" hint="+pts/min for early submission">
                        <Input
                            type="number"
                            step="0.1"
                            min={0}
                            value={form.timeBonusRate}
                            onChange={e => update("timeBonusRate", parseFloat(e.target.value) || 0)}
                        />
                    </Field>

                    <Field label="Time Penalty Rate" hint="-pts/min for late submission">
                        <Input
                            type="number"
                            step="0.1"
                            min={0}
                            value={form.timePenaltyRate}
                            onChange={e => update("timePenaltyRate", parseFloat(e.target.value) || 0)}
                        />
                    </Field>
                </div>
            </Section>

            {/* Status + Feedback */}
            {status?.error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 border border-destructive/30">
                    <AlertCircle size={16} />
                    {status.error}
                </div>
            )}

            {status?.success && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-500/10 p-3 border border-green-500/30">
                    <CheckCircle2 size={16} />
                    {status.success}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase">
                    STATUS: {hackathon.status.toUpperCase()}
                </p>
                <Button type="submit" disabled={loading} className="gap-2">
                    <Save size={16} />
                    {loading ? "SAVING..." : "SAVE SETTINGS"}
                </Button>
            </div>
        </form>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-border bg-card/50 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                {title}
            </h2>
            {children}
        </div>
    )
}

function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider">{label}</Label>
            {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
            {children}
        </div>
    )
}
