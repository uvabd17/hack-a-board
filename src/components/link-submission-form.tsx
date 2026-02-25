"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { submitProjectLinks } from "@/actions/submissions"
import { Link2, CheckCircle2, AlertCircle } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"

interface LinkSubmissionFormProps {
    roundId: string
    roundName: string
    teamId: string
    slug: string
    checkpointTime: Date
    checkpointPausedAt: Date | null
}

export function LinkSubmissionForm({
    roundId,
    roundName,
    teamId,
    slug,
    checkpointTime,
    checkpointPausedAt
}: LinkSubmissionFormProps) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ success?: string; error?: string } | null>(null)
    const [formData, setFormData] = useState({
        githubUrl: "",
        demoUrl: "",
        presentationUrl: "",
        otherUrl: "",
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setStatus(null)

        const res = await submitProjectLinks(
            { ...formData, teamId, roundId },
            slug
        )

        if (res.error) {
            setStatus({ error: res.error })
        } else {
            setStatus({ success: "Links submitted! You can now get judged for this round." })
            // Refresh page after 2 seconds to show judging progress
            setTimeout(() => window.location.reload(), 2000)
        }
        setLoading(false)
    }

    return (
        <Card className="bg-card border-yellow-500/30 border-2">
            <CardHeader className="bg-yellow-900/20 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest">
                            {roundName}
                        </CardTitle>
                        <div className="mt-1">
                            <CountdownTimer
                                targetMs={checkpointTime.getTime()}
                                pausedRemainingMs={
                                    checkpointPausedAt
                                        ? checkpointTime.getTime() - checkpointPausedAt.getTime()
                                        : null
                                }
                                label="Checkpoint"
                                size="sm"
                            />
                        </div>
                    </div>
                    <Badge className="bg-yellow-600 text-white">
                        <Link2 className="w-3 h-3 mr-1" />
                        STEP 1: SUBMIT LINKS
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-4 pb-4">
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs">
                    <p className="text-yellow-300 font-semibold mb-1">⚠️ Required: Submit project links first</p>
                    <p className="text-yellow-200/70">
                        This round requires you to submit your project links before judges can score you.
                        After submission, show your QR code to judges.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                                GitHub Repository
                            </Label>
                            <Input
                                className="bg-background/50 h-9 text-xs font-mono"
                                placeholder="https://github.com/team/project"
                                value={formData.githubUrl}
                                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                                Live Demo URL
                            </Label>
                            <Input
                                className="bg-background/50 h-9 text-xs font-mono"
                                placeholder="https://yourdemo.vercel.app"
                                value={formData.demoUrl}
                                onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                                Presentation / Slides
                            </Label>
                            <Input
                                className="bg-background/50 h-9 text-xs font-mono"
                                placeholder="https://docs.google.com/..."
                                value={formData.presentationUrl}
                                onChange={e => setFormData({ ...formData, presentationUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">
                                Other Link
                            </Label>
                            <Input
                                className="bg-background/50 h-9 text-xs font-mono"
                                placeholder="https://..."
                                value={formData.otherUrl}
                                onChange={e => setFormData({ ...formData, otherUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    {status?.error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded text-xs">
                            <AlertCircle size={16} />
                            {status.error}
                        </div>
                    )}

                    {status?.success && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-900/20 p-3 rounded text-xs">
                            <CheckCircle2 size={16} />
                            {status.success}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 text-sm font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                        {loading ? "SUBMITTING..." : "SUBMIT LINKS →"}
                    </Button>

                    <p className="text-[10px] text-muted-foreground text-center italic">
                        At least one link is required. You can update links later if needed.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
