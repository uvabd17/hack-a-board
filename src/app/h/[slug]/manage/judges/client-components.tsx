"use client"

import { useState, useEffect } from "react"
import { createJudge, deleteJudge, toggleJudgeStatus } from "@/actions/judges"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, QrCode, UserX, UserCheck } from "lucide-react"
import QRCode from "qrcode"

interface Judge {
    id: string;
    name: string;
    token: string;
    hackathonId: string;
    isActive: boolean;
}

export function JudgeForm({ hackathonId }: { hackathonId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        await createJudge(hackathonId, formData)
        setLoading(false)
        const form = document.getElementById("create-judge-form") as HTMLFormElement
        form?.reset()
    }

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle>AUTHORIZE_JUDGE</CardTitle>
                <CardDescription>Grant access to scoring interface.</CardDescription>
            </CardHeader>
            <CardContent>
                <form id="create-judge-form" action={handleSubmit} className="flex gap-2">
                    <div className="flex-1">
                        <Input name="name" placeholder="Judge Name (e.g. Jane Doe)" required />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? "ADDING..." : "ADD_JUDGE"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export function JudgeItem({ judge, hackathonId }: { judge: Judge, hackathonId: string }) {
    const [loading, setLoading] = useState(false)
    const [qrUrl, setQrUrl] = useState<string>("")
    const [showQr, setShowQr] = useState(false)

    useEffect(() => {
        if (showQr && !qrUrl) {
            // Generate QR code for the judge login URL
            // Format: /judge/login?token=TOKEN
            // But for now, let's just use the token or a full URL if we had the domain
            // Assuming base URL is relative or we construct it.
            // Let's us a simple JSON payload or just the token string if the scanner expects that.
            // The spec says "QR-based judging". Usually implies a URL or a token.
            // Let's generate a URL relative to current origin
            const url = `${window.location.origin}/h/${judge.hackathonId}/judge?token=${judge.token}`
            QRCode.toDataURL(url).then(setQrUrl)
        }
    }, [showQr, judge.token, judge.hackathonId, qrUrl])

    async function handleDelete() {
        if (!confirm("Remove judge?")) return
        setLoading(true)
        await deleteJudge(hackathonId, judge.id)
        setLoading(false)
    }

    async function handleToggle() {
        setLoading(true)
        await toggleJudgeStatus(hackathonId, judge.id)
        setLoading(false)
    }

    return (
        <Card className={judge.isActive ? "" : "opacity-60 bg-muted"}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {judge.name}
                        {!judge.isActive && <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">INACTIVE</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                        TOKEN: {judge.token.substring(0, 8)}...
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowQr(!showQr)}>
                        <QrCode size={16} className="mr-2" />
                        {showQr ? "HIDE_QR" : "SHOW_QR"}
                    </Button>

                    <Button variant="ghost" size="icon" onClick={handleToggle} disabled={loading} title={judge.isActive ? "Deactivate" : "Activate"}>
                        {judge.isActive ? <UserCheck size={16} className="text-green-600" /> : <UserX size={16} />}
                    </Button>

                    <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete} disabled={loading}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </CardContent>

            {showQr && (
                <div className="p-4 border-t border-border flex flex-col items-center bg-white">
                    {qrUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrUrl} alt="Judge QR" className="w-48 h-48" />
                    ) : (
                        <p>Generating QR...</p>
                    )}
                    <p className="text-xs text-black mt-2 font-mono">{judge.name}</p>
                </div>
            )}
        </Card>
    )
}
