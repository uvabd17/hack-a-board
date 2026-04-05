"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Hash, AlertTriangle, Loader2 } from "lucide-react"

export function ManualCodeEntry({ slug }: { slug: string }) {
    const [code, setCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = code.trim().toUpperCase()
        if (!trimmed) return

        setLoading(true)
        setError(null)

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            const res = await fetch(`/api/judge/lookup-team`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: trimmed }),
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            if (res.ok) {
                const { teamId } = await res.json()
                router.push(`/h/${slug}/judge/score/${teamId}`)
            } else {
                const data = await res.json().catch(() => ({}))
                setError(data.error || "Team not found. Check the code and try again.")
            }
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === "AbortError") {
                setError("Request timed out. Tap GO to retry.")
            } else {
                setError("Network error. Check your connection and try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="border-2 border-[var(--role-accent)]/30 bg-card rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[var(--role-accent)]" />
                <h3 className="text-sm font-bold">Enter team code</h3>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null) }}
                    placeholder="e.g. TEAM001"
                    className="bg-background border-border text-foreground font-mono uppercase tracking-widest text-center text-lg h-12"
                    maxLength={10}
                    required
                    autoComplete="off"
                    disabled={loading}
                />
                <Button type="submit" variant="brutal" className="px-6 h-12 font-black" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "GO"}
                </Button>
            </form>
            {error && (
                <div className="flex items-start gap-2 border border-destructive/30 bg-destructive/5 rounded-lg p-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}
            <p className="text-[10px] text-muted-foreground">Ask the team for their invite code</p>
        </div>
    )
}
