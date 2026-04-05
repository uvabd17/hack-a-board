import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QRCode from "qrcode"
import { Lock } from "lucide-react"
import { unstable_cache } from "next/cache"

import { getLeaderboardData } from "@/actions/leaderboard"
import { ProblemSelection } from "@/components/problem-selection"
import { SubmissionForm } from "@/components/submission-form"
import { LiveJudgingProgress } from "@/components/live-judging-progress"
import { LinkSubmissionForm } from "@/components/link-submission-form"
import { getTeamJudgingProgressBatch } from "@/actions/judging"
import { CheckCircle2 } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { LiveRefresher } from "@/components/live-refresher"
import { PARTICIPANT_COOKIE_NAME } from "@/lib/participant-session"
import { BrandFooter } from "@/components/ui/brand"

// Revalidate this page every 5 seconds for ISR performance
export const revalidate = 5

// Cache QR code generation - QR codes don't change (but are domain-specific)
const getCachedQRCode = unstable_cache(
    async (token: string, slug: string) => {
        try {
            // Use NEXT_PUBLIC_BASE_URL, fall back to VERCEL_URL (auto-set by Vercel), then empty string
            const baseUrl =
                process.env.NEXT_PUBLIC_BASE_URL ||
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
            return await QRCode.toDataURL(`${baseUrl}/h/${slug}/qr/${token}`)
        } catch (err) {
            console.error(err)
            return ""
        }
    },
    ["qr-code"],
    { revalidate: 86400 } // 24 hours - QR codes never change
)

async function generateQR(text: string) {
    try {
        return await QRCode.toDataURL(text)
    } catch (err) {
        console.error(err)
        return ""
    }
}

export default async function DashboardPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const token = (await cookies()).get(PARTICIPANT_COOKIE_NAME)?.value

    if (!token) {
        redirect(`/h/${slug}/participant-login`)
    }

    const participant = await prisma.participant.findUnique({
        where: { qrToken: token },
        include: {
            team: true,
            hackathon: true
        }
    })

    // Security check: Match slug + not archived
    if (!participant || participant.hackathon.slug !== slug) {
        redirect(`/h/${slug}/participant-login`)
    }
    if (participant.hackathon.isArchived) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <p className="text-2xl">📦</p>
                    <h1 className="text-lg font-bold">Event Archived</h1>
                    <p className="text-sm text-muted-foreground">This hackathon has ended and been archived.</p>
                </div>
            </div>
        )
    }

    const qrCodeDataUrl = await getCachedQRCode(participant.qrToken, slug)

    // Parallelize independent queries for better performance
    const [{ leaderboard, frozen }, problems, rounds, submissions, phases, batchedProgress] = await Promise.all([
        getLeaderboardData(slug),
        prisma.problemStatement.findMany({
            where: { hackathonId: participant.hackathonId, isReleased: true },
            orderBy: { order: 'asc' }
        }),
        prisma.round.findMany({
            where: { hackathonId: participant.hackathonId },
            orderBy: { order: 'asc' }
        }),
        prisma.submission.findMany({
            where: { teamId: participant.teamId }
        }),
        prisma.phase.findMany({
            where: { hackathonId: participant.hackathonId },
            orderBy: { order: 'asc' }
        }),
        // Batch query: all rounds in 3 queries instead of 5N
        prisma.round.findMany({
            where: { hackathonId: participant.hackathonId },
            select: { id: true }
        }).then(rs =>
            getTeamJudgingProgressBatch(participant.teamId, participant.hackathonId, rs.map(r => r.id))
        )
    ])

    // Find current active phase
    const now = Date.now()
    const currentPhase = phases.find((p: any) => 
        new Date(p.startTime).getTime() <= now && new Date(p.endTime).getTime() > now
    )

    const teamEntry = leaderboard.find((e: any) => e.teamId === participant.teamId)
    const isCheckedIn = participant.team.isCheckedIn

    const selectedProblem = participant.team.problemStatementId
        ? problems.find((p: any) => p.id === participant.team.problemStatementId)
        : null

    return (
        <div className="min-h-screen bg-background p-4 text-foreground pb-20" data-role="participant">
            <LiveRefresher hackathonId={participant.hackathonId} />
            <header className="mb-8 border-b border-border pb-4 max-w-6xl mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-primary truncate">{participant.hackathon.name}</h1>
                        <p className="text-xs text-muted-foreground">Participant Dashboard</p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0">
                        <a href={`/h/${slug}/display`} target="_blank" className="text-xs text-primary hover:underline uppercase tracking-widest hidden sm:inline">
                            📊 Leaderboard
                        </a>
                        <Badge variant={participant.team.status === 'approved' ? 'default' : 'secondary'} className="uppercase">
                            STATUS: {participant.team.status}
                        </Badge>
                    </div>
                </div>

                {/* Live timer bar — only shown when event is live */}
                {participant.hackathon.status === "live" && (
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-muted/30 border border-border rounded px-3 sm:px-4 py-2 overflow-hidden">
                        {currentPhase && (
                            <CountdownTimer
                                targetMs={new Date(currentPhase.endTime).getTime()}
                                label={`${currentPhase.name} ends in`}
                                size="sm"
                            />
                        )}
                        {rounds.map((r: any) => (
                            <CountdownTimer
                                key={r.id}
                                targetMs={new Date(r.checkpointTime).getTime()}
                                pausedRemainingMs={
                                    r.checkpointPausedAt
                                        ? new Date(r.checkpointTime).getTime() - new Date(r.checkpointPausedAt).getTime()
                                        : null
                                }
                                label={!r.checkpointPausedAt && new Date(r.checkpointTime).getTime() <= Date.now() ? `${r.name}` : `${r.name} closes in`}
                                size="sm"
                            />
                        ))}
                    </div>
                )}
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Left Column: Identity & Intel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* QR Passport Card */}
                    <div className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
                        {/* Decorative corner accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40" />

                        <div className="px-6 pt-5 pb-2">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold text-center">Participant Pass</p>
                            <p className="text-[9px] text-center text-muted-foreground/60 mt-0.5">{participant.hackathon.name}</p>
                        </div>

                        {/* Dashed separator */}
                        <div className="mx-4 border-t border-dashed border-primary/20" />

                        {/* QR Code */}
                        <div className="flex justify-center py-5">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary/5 rounded-xl blur-sm" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrCodeDataUrl} alt="Participant QR Code"
                                    className="relative w-44 h-44 bg-white p-3 rounded-lg shadow-md" />
                            </div>
                        </div>

                        {/* Dashed separator */}
                        <div className="mx-4 border-t border-dashed border-primary/20" />

                        {/* Identity info */}
                        <div className="px-6 py-4 text-center space-y-1.5">
                            <p className="text-lg font-bold text-foreground tracking-wide">{participant.name}</p>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                            {participant.team && (
                                <div className="pt-2">
                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-3 py-0.5 uppercase tracking-widest">
                                        {participant.team.name}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Token footer */}
                        <div className="bg-muted/30 px-4 py-2">
                            <p className="text-[8px] text-center text-muted-foreground/40 font-mono tracking-widest">Session active</p>
                        </div>
                    </div>

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
                    {!isCheckedIn ? (
                        <Card className="bg-card border-2 border-amber-500/30">
                            <CardContent className="py-12 text-center space-y-3">
                                <div className="text-4xl">📋</div>
                                <h3 className="text-lg font-bold text-foreground">Check-in required</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Show your QR code to an organizer at the venue to check in.
                                    Once checked in, you&apos;ll be able to pick your challenge track and participate in rounds.
                                </p>
                                <Badge variant="outline" className="border-amber-500/30 text-amber-500 mt-2">
                                    NOT CHECKED IN
                                </Badge>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
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

                            {/* Submissions / Judging Progress */}
                            {selectedProblem && rounds.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground pl-1">Round Progress</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rounds.map((round: any) => {
                                            const submission = submissions.find((s: any) => s.roundId === round.id)
                                            const progressData = batchedProgress?.[round.id]

                                            if (round.requiresLinkSubmission && !submission?.linksSubmittedAt) {
                                                return (
                                                    <LinkSubmissionForm
                                                        key={round.id}
                                                        roundId={round.id}
                                                        roundName={round.name}
                                                        teamId={participant.teamId}
                                                        slug={slug}
                                                        checkpointTime={round.checkpointTime}
                                                        checkpointPausedAt={round.checkpointPausedAt}
                                                    />
                                                )
                                            }

                                            if (progressData) {
                                                return (
                                                    <LiveJudgingProgress
                                                        key={round.id}
                                                        roundName={round.name}
                                                        roundId={round.id}
                                                        teamId={participant.teamId}
                                                        hackathonId={participant.hackathonId}
                                                        checkpointTime={new Date(round.checkpointTime)}
                                                        checkpointPausedAt={round.checkpointPausedAt ? new Date(round.checkpointPausedAt) : null}
                                                        initialRequiredJudges={progressData.requiredJudges}
                                                        initialJudgeCount={progressData.judgeCount}
                                                        initialSubmitted={progressData.submitted}
                                                        initialTimeBonus={progressData.timeBonus ?? null}
                                                        initialJudges={progressData.judges || []}
                                                        timeBonusRate={participant.hackathon.timeBonusRate}
                                                        timePenaltyRate={participant.hackathon.timePenaltyRate}
                                                    />
                                                )
                                            }

                                            return (
                                                <SubmissionForm
                                                    key={round.id}
                                                    round={round}
                                                    teamId={participant.teamId}
                                                    slug={slug}
                                                    existingSubmission={submission}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <BrandFooter className="max-w-6xl mx-auto" />
        </div>
    )
}
