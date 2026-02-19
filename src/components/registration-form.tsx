"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { registerParticipant, RegisterState } from "@/actions/registration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full bg-primary text-primary-foreground text-lg py-6 font-mono" disabled={pending}>
            {pending ? "INITIATING..." : "CONFIRM_REGISTRATION >"}
        </Button>
    )
}

export default function RegistrationForm({ hackathonSlug }: { hackathonSlug: string }) {
    const router = useRouter()
    // Using simple form action for now, easier than useFormState with complex client logic
    // But we need client side validation too. mixing shadcn forms with server actions.

    const [mode, setMode] = useState<"create" | "join" | "solo">("create")
    const [error, setError] = useState<string | null>(null)

    async function clientAction(formData: FormData) {
        setError(null)
        formData.append("hackathonSlug", hackathonSlug)
        formData.append("mode", mode)

        const result = await registerParticipant({}, formData)

        if (result.error) {
            setError(result.error)
        } else if (result.success && result.qrToken) {
            router.push(`/h/${hackathonSlug}/dashboard?token=${result.qrToken}`)
        }
    }

    return (
        <div className="max-w-md mx-auto py-10 px-4 font-mono">
            <Card className="border-primary/20 bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl text-primary text-center">ACCESS_REQUEST_FORM</CardTitle>
                    <CardDescription className="text-center">Identify yourself to proceed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={clientAction} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">AGENT_NAME</Label>
                            <Input id="name" name="name" required placeholder="John Doe" className="border-border bg-background focus:ring-primary" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">COMM_LINK (EMAIL)</Label>
                            <Input id="email" name="email" type="email" required placeholder="john@example.com" className="border-border bg-background focus:ring-primary" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">PHONE (OPT)</Label>
                                <Input id="phone" name="phone" placeholder="+1234567890" className="border-border bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="college">AFFILIATION (OPT)</Label>
                                <Input id="college" name="college" placeholder="University..." className="border-border bg-background" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <Label className="mb-4 block text-center text-primary">UNIT_ASSIGNMENT</Label>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as "create" | "join" | "solo")} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-muted">
                                    <TabsTrigger value="create">CREATE</TabsTrigger>
                                    <TabsTrigger value="join">JOIN</TabsTrigger>
                                    <TabsTrigger value="solo">SOLO</TabsTrigger>
                                </TabsList>

                                <TabsContent value="create" className="pt-4 space-y-2">
                                    <Label htmlFor="teamName">NEW_UNIT_DESIGNATION</Label>
                                    <Input id="teamName" name="teamName" placeholder="Team Phoenix" required={mode === "create"} className="border-border bg-background" />
                                </TabsContent>

                                <TabsContent value="join" className="pt-4 space-y-2">
                                    <Label htmlFor="inviteCode">ACCESS_CODE</Label>
                                    <Input id="inviteCode" name="inviteCode" placeholder="XYZ123" required={mode === "join"} className="border-border bg-background uppercase tracking-widest" maxLength={6} />
                                </TabsContent>

                                <TabsContent value="solo" className="pt-4">
                                    <p className="text-xs text-muted-foreground text-center">
                                        A temporary single-operative unit will be established.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm text-center">
                                ERROR: {error}
                            </div>
                        )}

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
