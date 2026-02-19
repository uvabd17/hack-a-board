import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QRCode from "qrcode"
import { Lock } from "lucide-react"

import { getLeaderboardData } from "@/actions/leaderboard"
import { ProblemSelection } from "@/components/problem-selection"
import { SubmissionForm } from "@/components/submission-form"
import { CheckCircle2 } from "lucide-react"

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
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ token?: string }>
}) {
    const { slug } = await params
    const token = (await searchParams).token

    if (!token) {
        redirect(`/h/${slug}/register`)
    }

    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        include: {
            team: true,
            hackathon: true
        }
    })

    // Security check: Match slug
    if (!participant || participant.hackathon.slug !== slug) {
        return (
            <div className="flex items-center justify-center min-h-screen text-destructive">
                INVALID ACCESS — Please register again.
            </div>
        )
    }

    const qrCodeDataUrl = await generateQR(participant.qrToken)

    // Fetch live leaderboard data
    const { leaderboard, frozen } = await getLeaderboardData(slug)
    const teamEntry = leaderboard.find(e => e.teamId === participant.teamId)

    // Fetch problem statements and rounds
    const problems = await prisma.problemStatement.findMany({
        where: { hackathonId: participant.hackathonId, isReleased: true },
        orderBy: { order: 'asc' }
    })

    const rounds = await prisma.round.findMany({
        where: { hackathonId: participant.hackathonId },
        orderBy: { order: 'asc' }
    })

    const submissions = await prisma.submission.findMany({
        where: { teamId: participant.teamId }
    })

    const selectedProblem = participant.team.problemStatementId
        ? problems.find(p => p.id === participant.team.problemStatementId)
        : null

    return (
        <div className="min-h-screen bg-background p-4 font-mono text-foreground pb-20">
            <header className="mb-8 border-b border-border pb-4 flex justify-between items-center max-w-6xl mx-auto">
                <div>
                    <h1 className="text-xl font-bold text-primary">{participant.hackathon.name}</h1>
                    <p className="text-xs text-muted-foreground">HACKER_DASHBOARD</p>
                </div>
                <div className="flex gap-2 items-center">
                    <a href={`/h/${slug}/display`} target="_blank" className="text-xs text-primary hover:underline uppercase tracking-widest">
                        📊 Leaderboard
                    </a>
                    <Badge variant={participant.team.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                        STATUS: {participant.team.status}
                    </Badge>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Left Column: Identity & Intel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Identity Card */}
                    <Card className="bg-card border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeDataUrl} alt="Participant QR Code" className="w-40 h-40 bg-white p-2 mb-4" />
                                <p className="text-[10px] text-center text-muted-foreground break-all opacity-50">{token}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-primary">{participant.name}</p>
                                <p className="text-xs text-muted-foreground">{participant.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Intel */}
                    <Card className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Team Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xl font-bold text-foreground">{participant.team.name}</p>
                                <p className="text-[10px] text-muted-foreground">CODE: <span className="text-primary text-sm font-bold ml-1 tracking-widest">{participant.team.inviteCode}</span></p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2 uppercase">Current Standing</p>
                                {frozen ? (
                                    <div className="flex items-center gap-2 text-destructive animate-pulse">
                                        <Lock className="w-4 h-4" />
                                        <p className="text-sm font-bold">HIDDEN (FROZEN)</p>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-primary">#{teamEntry?.rank || "--"}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">SCORE: {teamEntry?.totalScore || 0}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Mission Control */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Statement Selection */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">
                                Challenge Track
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedProblem ? (
                                <div className="p-4 border border-primary/20 bg-primary/5 rounded">
                                    <h3 className="text-lg font-bold text-primary mb-1">{selectedProblem.title}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedProblem.description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] text-primary/70 uppercase">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Track Locked
                                    </div>
                                </div>
                            ) : problems.length > 0 ? (
                                <ProblemSelection problems={problems} teamId={participant.teamId} slug={slug} />
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Problem statements have not been released by the organizer yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submissions */}
                    {selectedProblem && rounds.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-sm text-muted-foreground uppercase tracking-widest pl-1">Submissions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rounds.map(round => (
                                    <SubmissionForm
                                        key={round.id}
                                        round={round}
                                        teamId={participant.teamId}
                                        slug={slug}
                                        existingSubmission={submissions.find(s => s.roundId === round.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
