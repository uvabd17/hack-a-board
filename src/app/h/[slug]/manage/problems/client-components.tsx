"use client"

import { useState } from "react"
import { createProblemStatement, deleteProblemStatement, toggleProblemRelease } from "@/actions/problems"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Trash2, Eye, EyeOff } from "lucide-react"

export function ProblemForm({ hackathonId }: { hackathonId: string }) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ error?: string, success?: string } | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setStatus(null)

        try {
            const res = await createProblemStatement(hackathonId, formData)
            if (res.error) {
                setStatus({ error: res.error })
            } else {
                setStatus({ success: "Problem statement created successfully" })
                // Reset form manually or use ref
                const form = document.getElementById("create-problem-form") as HTMLFormElement
                form?.reset()
            }
        } catch {
            setStatus({ error: "An unexpected error occurred" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ADD_NEW_DIRECTIVE</CardTitle>
                <CardDescription>Define a problem statement for teams to solve.</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="create-problem-form" action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="FinTech Innovation" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL friendly)</Label>
                            <Input id="slug" name="slug" placeholder="fintech" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Detailed requirements..." required className="h-24" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon (Emoji)</Label>
                        <Input id="icon" name="icon" placeholder="💸" className="w-20" />
                    </div>

                    {status?.error && (
                        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded">
                            <AlertCircle size={16} />
                            {status.error}
                        </div>
                    )}

                    {status?.success && (
                        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-500/10 p-3 rounded">
                            <CheckCircle2 size={16} />
                            {status.success}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "PROCESSING..." : "REGISTER_DIRECTIVE"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

interface ProblemStatement {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon?: string | null;
    isReleased: boolean;
}

export function ProblemItem({ problem, hackathonId }: { problem: ProblemStatement, hackathonId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        setLoading(true)
        await toggleProblemRelease(hackathonId, problem.id)
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm("Confirm deletion? This cannot be undone.")) return
        setLoading(true)
        await deleteProblemStatement(hackathonId, problem.id)
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-between p-4 border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-4">
                <div className="text-2xl bg-muted w-12 h-12 flex items-center justify-center rounded">
                    {problem.icon || "📄"}
                </div>
                <div>
                    <h3 className="font-bold flex items-center gap-2">
                        {problem.title}
                        <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 border border-border rounded">
                            {problem.slug}
                        </span>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                        {problem.description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant={problem.isReleased ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggle}
                    disabled={loading}
                    className={problem.isReleased ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {problem.isReleased ? (
                        <><Eye size={14} className="mr-2" /> LIVE</>
                    ) : (
                        <><EyeOff size={14} className="mr-2" /> HIDDEN</>
                    )}
                </Button>

                <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
                    <Trash2 size={16} />
                </Button>
            </div>
        </div>
    )
}
