import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QRCode from "qrcode"

async function generateQR(text: string) {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
        return ""
    }
}

export default async function DashboardPage({
    params,
    searchParams
}: {
    params: { slug: string },
    searchParams: { token?: string }
}) {
    const token = searchParams.token

    if (!token) {
        redirect(`/h/${params.slug}/register`)
    }

    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        include: {
            team: true,
            hackathon: true
        }
    })

    // Security check: Match slug
    if (!participant || participant.hackathon.slug !== params.slug) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive">
                INVALID_ACCESS_TOKEN // TERMINATED
            </div>
        )
    }

    const qrCodeDataUrl = await generateQR(participant.qrToken)

    return (
        <div className="min-h-screen bg-background p-4 font-mono text-foreground">
            <header className="mb-8 border-b border-border pb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-primary">{participant.hackathon.name}</h1>
                    <p className="text-xs text-muted-foreground">OPERATIVE_DASHBOARD_v1.0</p>
                </div>
                <Badge variant={participant.team.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                    STATUS: {participant.team.status}
                </Badge>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Identity Card */}
                <Card className="bg-card border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Identity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrCodeDataUrl} alt="Participant QR Code" className="w-48 h-48 bg-white p-2 mb-4" />
                            <p className="text-xs text-center text-muted-foreground break-all">{token}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-primary">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                            <p className="text-sm">{participant.college || "No Affiliation"}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Intel */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Unit Designation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-2xl font-bold text-foreground">{participant.team.name}</p>
                            <p className="text-xs text-muted-foreground">ACCESS_CODE: <span className="text-primary text-base font-bold ml-1 tracking-widest">{participant.team.inviteCode}</span></p>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-2">MISSION_STATUS</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                <p className="text-sm">Awaiting Problem Statement Selection</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground mb-2">CURRENT_RANK</p>
                            <p className="text-4xl font-bold text-muted-foreground/50">--</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
