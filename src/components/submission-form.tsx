"use client"

import { useState } from "react"
import { Round, Submission } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitProject } from "@/actions/submissions"
import { CheckCircle2, Clock } from "lucide-react"

export function SubmissionForm({
    round,
    teamId,
    slug,
    existingSubmission
}: {
    round: Round,
    teamId: string,
    slug: string,
    existingSubmission?: Submission | null
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        githubUrl: existingSubmission?.githubUrl || "",
        demoUrl: existingSubmission?.demoUrl || "",
        presentationUrl: existingSubmission?.presentationUrl || "",
        otherUrl: existingSubmission?.otherUrl || "",
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const res = await submitProject({ ...formData, teamId, roundId: round.id }, slug)
        if (res.success) {
            alert(`INBOUND_RECEIVED: Project files transmitted. Time Bonus: ${res.timeBonus}`)
        } else {
            alert("TRANSMISSION_ERROR: " + res.error)
        }
        setLoading(false)
    }

    return (
        <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="bg-muted/50 pb-3 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest">{round.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">SUBMISSION_WINDOW_REMAINING: 00:00:00 (MOCK)</p>
                </div>
                {existingSubmission && (
                    <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/50">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        SUBMITTED
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">GitHub Repo</Label>
                            <Input
                                className="bg-background/50 h-8 text-xs font-mono"
                                placeholder="https://github.com/..."
                                value={formData.githubUrl}
                                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Demo URL</Label>
                            <Input
                                className="bg-background/50 h-8 text-xs font-mono"
                                placeholder="https://..."
                                value={formData.demoUrl}
                                onChange={e => setFormData({ ...formData, demoUrl: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="w-full text-xs uppercase font-bold"
                        disabled={loading}
                    >
                        {loading ? "TRANSMITTING..." : existingSubmission ? "UPDATE SUBMISSION" : "TRANSMIT SUBMISSION"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>
            {children}
        </span>
    )
}
