"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { participantFallbackLogin } from "@/actions/registration"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full text-sm font-mono" disabled={pending}>
            {pending ? "Signing in..." : "Open Dashboard"}
        </Button>
    )
}

export function ParticipantLoginForm({ slug }: { slug: string }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    async function handleLogin(formData: FormData) {
        setError(null)
        formData.set("hackathonSlug", slug)
        const result = await participantFallbackLogin({}, formData)
        if (result.error) {
            setError(result.error)
            return
        }
        router.push(result.redirectTo || `/h/${slug}/dashboard`)
    }

    return (
        <Card className="w-full max-w-md border-primary/20 bg-card">
            <CardHeader>
                <CardTitle className="text-xl text-center">Participant Login</CardTitle>
                <CardDescription className="text-center">
                    Use your registration email and team code to reopen your dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleLogin} className="space-y-4">
                    <input type="hidden" name="hackathonSlug" value={slug} />
                    <div className="space-y-2">
                        <Label htmlFor="email">EMAIL</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="teamCode">TEAM CODE</Label>
                        <Input
                            id="teamCode"
                            name="teamCode"
                            required
                            maxLength={10}
                            className="uppercase tracking-widest font-mono"
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-destructive border border-destructive/40 bg-destructive/10 p-2">
                            {error}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Forgot your team code? Contact an organizer to retrieve it.
                    </p>
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    )
}

